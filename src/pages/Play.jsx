import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getScriptDetail, getMyRole, getRevealRoles } from '../api/scripts.js';
import { getRoom, getRoomByCode, changePhase, endGame } from '../api/rooms.js';
import {
  connectSocket,
  joinRoomSocket,
  leaveRoomSocket,
  onRoomState,
  onPhaseChanged,
  onVoteUpdate,
  onVoteResult,
  onGameEnded,
  onPlayerDisconnected,
  onClueRevealed,
  emitVote,
  emitPhaseChange,
  emitGameEnd,
  emitClueRevealed,
} from '../api/socket.js';
import './Play.css';

export default function Play() {
  const { id } = useParams();  // scriptId
  const navigate = useNavigate();
  const { user } = useAuth();

  const [script, setScript] = useState(null);
  const [room, setRoom] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 本地 UI 状态
  const [revealedClues, setRevealedClues] = useState([]);
  const [voteTarget, setVoteTarget] = useState(null);
  const [voteInfo, setVoteInfo] = useState({ voted: 0, total: 0 });
  const [voteResult, setVoteResult] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [revealRoles, setRevealRoles] = useState(null);
  const [disconnectNotice, setDisconnectNotice] = useState('');
  const [clueRevealNotice, setClueRevealNotice] = useState('');

  const roomIdRef = useRef(null);

  // 初始加载：获取剧本详情
  useEffect(() => {
    getScriptDetail(id)
      .then((data) => {
        setScript(data.script);
        // 获取我的角色
        return getMyRole(id);
      })
      .then((data) => {
        if (data.role) {
          setMyRole(data.role);
          // 如果有房间码，获取房间状态
          if (data.roomCode) {
            return getRoomByCode(data.roomCode);
          }
        }
        return null;
      })
      .then((data) => {
        if (data?.room) {
          setRoom(data.room);
          roomIdRef.current = data.room.id;

          // 连接 Socket
          connectSocket();
          joinRoomSocket(data.room.id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Socket.IO 监听
  useEffect(() => {
    if (!roomIdRef.current) return;

    const cleanup1 = onRoomState((data) => {
      if (data.room) setRoom(data.room);
    });

    const cleanup2 = onPhaseChanged((data) => {
      // 阶段变更时重置揭示状态
      setRevealed(false);
      setVoteResult(null);
    });

    const cleanup3 = onVoteUpdate((data) => {
      setVoteInfo(data);
    });

    const cleanup4 = onVoteResult((data) => {
      setVoteResult(data);
    });

    const cleanup5 = onGameEnded(() => {
      // 游戏结束
    });

    const cleanup6 = onPlayerDisconnected((data) => {
      const player = room?.players?.find((p) => p.userId === data.userId);
      const name = player?.nickname || player?.username || '某玩家';
      setDisconnectNotice(`${name} 已断线`);
      setTimeout(() => setDisconnectNotice(''), 5000);
    });

    const cleanup7 = onClueRevealed((data) => {
      if (data.by) {
        setClueRevealNotice(`${data.by} 翻看了一条线索`);
        setTimeout(() => setClueRevealNotice(''), 3000);
      }
    });

    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
      cleanup4();
      cleanup5();
      cleanup6();
      cleanup7();
    };
  }, [room?.id]);

  // 离开时清理 Socket
  useEffect(() => {
    return () => {
      if (roomIdRef.current) {
        leaveRoomSocket(roomIdRef.current);
      }
    };
  }, []);

  // ---- 以下计算必须在提前 return 之前，确保 Hooks 调用顺序一致 ----
  const phases = script?.phases || [];
  const currentPhaseIdx = room?.currentPhase ?? 0;
  const currentPhase = phases[currentPhaseIdx];
  const isHost = room?.hostId === user?.id;
  const roomStatus = room?.status;

  // 获取当前阶段的线索
  const phaseClues = useMemo(() => {
    if (!script?.clues || !currentPhase) return [];
    return script.clues.filter((c) => c.phaseId === currentPhase.id);
  }, [script, currentPhase]);

  // 所有已查看的线索
  const allRevealedClues = useMemo(() => {
    if (!script?.clues) return [];
    return script.clues.filter((c) => revealedClues.includes(c.id));
  }, [script, revealedClues]);

  // ---- 提前返回 ----

  if (loading) {
    return <div className="page-loading">加载中...</div>;
  }

  if (error && !script) {
    return (
      <div className="play-not-found">
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>返回大厅</button>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="play-not-found">
        <p>剧本不存在</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>返回大厅</button>
      </div>
    );
  }

  // 如果没有角色（未加入房间或未分配角色）
  if (!myRole) {
    return (
      <div className="play-not-found">
        <p>你尚未被分配角色，请先加入房间并等待房主分配角色</p>
        <button className="btn btn-primary" onClick={() => navigate(`/script/${id}`)}>
          前往剧本页
        </button>
      </div>
    );
  }

  // 查看线索
  const handleRevealClue = (clueId) => {
    if (!revealedClues.includes(clueId)) {
      setRevealedClues([...revealedClues, clueId]);
      // 通知其他玩家
      if (roomIdRef.current) {
        emitClueRevealed(roomIdRef.current, clueId);
      }
    }
  };

  // 下一阶段
  const handleNextPhase = () => {
    if (!roomIdRef.current || !isHost) return;
    changePhase(roomIdRef.current, 'next').then((data) => {
      setRoom(data.room);
      emitPhaseChange(roomIdRef.current, data.room.currentPhase);
    }).catch((err) => setError(err.message));
  };

  // 上一阶段
  const handlePrevPhase = () => {
    if (!roomIdRef.current || !isHost) return;
    changePhase(roomIdRef.current, 'prev').then((data) => {
      setRoom(data.room);
      emitPhaseChange(roomIdRef.current, data.room.currentPhase);
    }).catch((err) => setError(err.message));
  };

  // 投票
  const handleVote = (roleId) => {
    setVoteTarget(roleId);
    if (roomIdRef.current) {
      emitVote(roomIdRef.current, roleId);
    }
  };

  // 揭晓真相
  const handleReveal = () => {
    setRevealed(true);
    // 获取所有角色的凶手身份
    getRevealRoles(id)
      .then((data) => setRevealRoles(data.roles))
      .catch(() => {});
  };

  // 结束游戏
  const handleEndGame = () => {
    if (!roomIdRef.current || !isHost) return;
    endGame(roomIdRef.current).then((data) => {
      setRoom(data.room);
      emitGameEnd(roomIdRef.current);
    }).catch((err) => setError(err.message));
  };

  return (
    <div className="play-page">
      <button className="play-back" onClick={() => navigate(`/script/${id}`)}>
        ← 返回剧本
      </button>

      {/* 我的信息栏 */}
      <div className="play-my-role-bar">
        <img className="play-my-avatar" src={myRole.avatar} alt={myRole.name} />
        <div className="play-my-role-info">
          <span className="play-my-role-label">你的角色</span>
          <span className="play-my-role-name">{myRole.name}</span>
          {myRole.isKiller && <span className="tag tag-danger">你是凶手</span>}
        </div>
        {room && (
          <div className="play-room-info">
            <span className="play-room-code">房间号：{room.code}</span>
            <span className="tag tag-ghost">{room.players.length}人</span>
          </div>
        )}
      </div>

      {/* 断线/线索通知 */}
      {(disconnectNotice || clueRevealNotice) && (
        <div className="play-notice">
          {disconnectNotice || clueRevealNotice}
        </div>
      )}

      {/* 阶段进度条 */}
      <div className="play-progress">
        {phases.map((phase, idx) => (
          <div
            key={idx}
            className={`play-progress-item ${
              idx < currentPhaseIdx ? 'done' : idx === currentPhaseIdx ? 'current' : ''
            }`}
          >
            <div className="play-progress-dot">{idx + 1}</div>
            <span className="play-progress-label">{phase.title || phase.name}</span>
          </div>
        ))}
      </div>

      {/* 当前阶段内容 */}
      <div className="play-phase-content">
        <div className="play-phase-header">
          <span className="tag tag-primary">{currentPhase?.type || 'phase'}</span>
          <h2 className="play-phase-title">{currentPhase?.title || currentPhase?.name}</h2>
          <p className="play-phase-desc">{currentPhase?.description || currentPhase?.desc}</p>
        </div>

        <div className="play-phase-body">
          {/* 背景介绍 */}
          {currentPhase?.type === 'intro' && (
            <div className="play-story-card">
              <h3 className="play-story-title">背景故事</h3>
              <p className="play-story-text">{script.background}</p>
            </div>
          )}

          {/* 自我介绍 */}
          {currentPhase?.type === 'self_intro' && (
            <div className="play-self-intro">
              <div className="play-story-card">
                <h3 className="play-story-title">你的公开介绍</h3>
                <p className="play-story-text">{myRole.intro}</p>
              </div>
              <div className="play-story-card play-secret-card">
                <h3 className="play-story-title">你的秘密剧本</h3>
                <p className="play-story-text">{myRole.secret}</p>
                {myRole.isKiller && (
                  <span className="tag tag-danger">你是凶手！</span>
                )}
              </div>
              <div className="play-role-list">
                <h4 className="play-subsection-title">其他角色</h4>
                {script.roles.filter((r) => r.id !== myRole.id).map((role) => (
                  <div key={role.id} className="play-role-item">
                    <img className="role-avatar-sm" src={role.avatar} alt={role.name} />
                    <div>
                      <span className="play-role-item-name">{role.name}</span>
                      <span className="play-role-item-desc">{role.intro}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 搜证 */}
          {currentPhase?.type === 'investigate' && (
            <div className="play-investigate">
              <h4 className="play-subsection-title">本阶段线索（点击查看）</h4>
              {phaseClues.length === 0 ? (
                <p className="play-empty">本阶段暂无线索</p>
              ) : (
                <div className="clue-grid">
                  {phaseClues.map((clue) => {
                    const isRevealed = revealedClues.includes(clue.id);
                    return (
                      <div
                        key={clue.id}
                        className={`clue-card ${isRevealed ? 'revealed' : 'clue-hidden'}`}
                        onClick={() => handleRevealClue(clue.id)}
                      >
                        <div className="clue-card-header">
                          <span className="clue-card-name">
                            {isRevealed ? clue.name : '未知线索'}
                          </span>
                        </div>
                        {isRevealed ? (
                          <p className="clue-card-desc">{clue.description || clue.desc}</p>
                        ) : (
                          <p className="clue-card-desc clue-card-placeholder">点击翻看线索卡</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {phaseClues.length > 0 && (
                <p className="play-clue-tip">
                  已查看 {phaseClues.filter((c) => revealedClues.includes(c.id)).length} / {phaseClues.length} 条线索
                </p>
              )}
            </div>
          )}

          {/* 讨论 */}
          {currentPhase?.type === 'discuss' && (
            <div className="play-discuss">
              <div className="play-story-card">
                <h3 className="play-story-title">自由讨论</h3>
                <p className="play-story-text">
                  请所有玩家自由讨论已掌握的线索，分享你的推理与怀疑。不要暴露你的秘密剧本，除非你想误导他人。
                </p>
              </div>
              {allRevealedClues.length > 0 && (
                <div className="play-clue-review">
                  <h4 className="play-subsection-title">已掌握的线索</h4>
                  <div className="clue-grid">
                    {allRevealedClues.map((clue) => (
                      <div key={clue.id} className="clue-card revealed">
                        <div className="clue-card-header">
                          <span className="clue-card-name">{clue.name}</span>
                        </div>
                        <p className="clue-card-desc">{clue.description || clue.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 投票 */}
          {currentPhase?.type === 'vote' && (
            <div className="play-vote">
              <h4 className="play-subsection-title">你认为谁是凶手？</h4>
              {voteInfo.total > 0 && (
                <p className="play-vote-progress">
                  已投票：{voteInfo.voted} / {voteInfo.total}
                </p>
              )}
              <div className="play-vote-grid">
                {script.roles
                  .filter((r) => r.id !== myRole.id)
                  .map((role) => (
                    <div
                      key={role.id}
                      className={`play-vote-card ${voteTarget === role.id ? 'selected' : ''}`}
                      onClick={() => handleVote(role.id)}
                    >
                      <img className="role-avatar" src={role.avatar} alt={role.name} />
                      <span className="play-vote-name">{role.name}</span>
                      {voteTarget === role.id && (
                        <span className="play-vote-check">✓</span>
                      )}
                    </div>
                  ))}
              </div>
              {voteTarget && (
                <p className="play-vote-confirm">
                  你投给了 <strong>{script.roles.find((r) => r.id === voteTarget)?.name}</strong>
                </p>
              )}
              {voteResult && (
                <div className="play-vote-result">
                  <h4 className="play-subsection-title">投票结果</h4>
                  {voteResult.votes.map((v, idx) => {
                    const role = script.roles.find((r) => r.id === v.target_role_id);
                    return (
                      <div key={idx} className="play-vote-result-item">
                        <span>{role?.name || '未知'}</span>
                        <span className="tag tag-primary">{v.cnt} 票</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 揭晓真相 */}
          {currentPhase?.type === 'reveal' && (
            <div className="play-reveal">
              {!revealed ? (
                <div className="play-reveal-prompt">
                  <p>所有玩家已投票完毕，准备好揭晓真相了吗？</p>
                  <button className="btn btn-primary btn-lg" onClick={handleReveal}>
                    揭晓真相
                  </button>
                </div>
              ) : (
                <div className="play-reveal-content">
                  <h3 className="play-reveal-title">真相大白</h3>
                  {script.roles.map((role) => {
                    const revealInfo = revealRoles?.find((r) => r.id === role.id);
                    const isKiller = revealInfo?.isKiller;
                    return (
                      <div
                        key={role.id}
                        className={`play-reveal-role ${role.id === myRole.id ? 'me' : ''} ${isKiller ? 'is-killer' : ''}`}
                      >
                        <img className="role-avatar" src={role.avatar} alt={role.name} />
                        <div className="play-reveal-role-info">
                          <span className="play-reveal-role-name">{role.name}</span>
                          {role.id === myRole.id && <span className="tag tag-primary">我</span>}
                          {isKiller && <span className="tag tag-danger">凶手</span>}
                        </div>
                      </div>
                    );
                  })}
                  {myRole.isKiller && (
                    <p className="play-reveal-text">你就是凶手！</p>
                  )}
                  {!myRole.isKiller && voteTarget && (
                    <p className="play-reveal-text">
                      你投给了 <strong>{script.roles.find((r) => r.id === voteTarget)?.name}</strong>
                      {revealRoles?.find((r) => r.id === voteTarget)?.isKiller
                        ? '，恭喜猜对了！'
                        : '，很遗憾猜错了。'}
                    </p>
                  )}
                  <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>
                    返回大厅
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 底部导航（仅房主可操作） */}
      <div className="play-nav">
        {isHost ? (
          <>
            <button
              className="btn btn-outline"
              onClick={handlePrevPhase}
              disabled={currentPhaseIdx === 0}
            >
              上一阶段
            </button>
            {currentPhaseIdx < phases.length - 1 ? (
              <button className="btn btn-primary" onClick={handleNextPhase}>
                下一阶段 →
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleEndGame}>
                结束游戏
              </button>
            )}
          </>
        ) : (
          <span className="play-nav-hint">等待房主推进阶段...</span>
        )}
      </div>
    </div>
  );
}