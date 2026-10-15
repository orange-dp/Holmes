import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getScriptById, PHASE_TYPES } from '../data/scripts';
import './Play.css';

export default function Play() {
  const { id } = useParams();
  const navigate = useNavigate();
  const script = getScriptById(id);

  // 当前阶段索引
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  // 当前视角角色（模拟"我是谁"）
  const [myRoleId, setMyRoleId] = useState(null);
  // 已查看的线索
  const [revealedClues, setRevealedClues] = useState([]);
  // 投票选择
  const [voteTarget, setVoteTarget] = useState(null);
  // 是否已揭示真相
  const [revealed, setRevealed] = useState(false);

  const phases = script?.phases || [];
  const currentPhase = phases[currentPhaseIdx];
  const myRole = script?.roles.find((r) => r.id === myRoleId);
  const phaseClues = useMemo(
    () => script?.clues.filter((c) => c.phaseId === currentPhase?.id) || [],
    [script, currentPhase]
  );

  if (!script) {
    return (
      <div className="play-not-found">
        <p>剧本不存在</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>返回大厅</button>
      </div>
    );
  }

  // 角色选择
  if (!myRoleId) {
    return (
      <div className="play-page">
        <button className="play-back" onClick={() => navigate(`/room/${script.id}`)}>
          ← 返回房间
        </button>
        <h1 className="play-title">选择你的角色</h1>
        <p className="play-subtitle">请选择你在本局游戏中扮演的角色（仅模拟，实际应由房间分配）</p>
        <div className="role-grid">
          {script.roles.map((role) => (
            <div
              key={role.id}
              className="role-card role-selectable"
              onClick={() => setMyRoleId(role.id)}
            >
              <img className="role-avatar" src={role.avatar} alt={role.name} />
              <div className="role-card-body">
                <h3 className="role-name">{role.name}</h3>
                <p className="role-desc">{role.intro}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 查看线索
  const handleRevealClue = (clueId) => {
    if (!revealedClues.includes(clueId)) {
      setRevealedClues([...revealedClues, clueId]);
    }
  };

  // 下一阶段
  const handleNextPhase = () => {
    if (currentPhaseIdx < phases.length - 1) {
      setCurrentPhaseIdx(currentPhaseIdx + 1);
    }
  };

  // 上一阶段
  const handlePrevPhase = () => {
    if (currentPhaseIdx > 0) {
      setCurrentPhaseIdx(currentPhaseIdx - 1);
    }
  };

  // 揭晓真相
  const handleReveal = () => {
    setRevealed(true);
  };

  return (
    <div className="play-page">
      <button className="play-back" onClick={() => navigate(`/room/${script.id}`)}>
        ← 返回房间
      </button>

      {/* 我的信息栏 */}
      <div className="play-my-role-bar">
        <img className="play-my-avatar" src={myRole.avatar} alt={myRole.name} />
        <div className="play-my-role-info">
          <span className="play-my-role-label">你的角色</span>
          <span className="play-my-role-name">{myRole.name}</span>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setMyRoleId(null)}
        >
          切换角色
        </button>
      </div>

      {/* 阶段进度条 */}
      <div className="play-progress">
        {phases.map((phase, idx) => (
          <div
            key={phase.id}
            className={`play-progress-item ${
              idx < currentPhaseIdx ? 'done' : idx === currentPhaseIdx ? 'current' : ''
            }`}
          >
            <div className="play-progress-dot">{idx + 1}</div>
            <span className="play-progress-label">{phase.name}</span>
          </div>
        ))}
      </div>

      {/* 当前阶段内容 */}
      <div className="play-phase-content">
        <div className="play-phase-header">
          <span className="tag tag-primary">{currentPhase?.type}</span>
          <h2 className="play-phase-title">{currentPhase?.name}</h2>
          <p className="play-phase-desc">{currentPhase?.description}</p>
        </div>

        {/* 阶段内容区 */}
        <div className="play-phase-body">
          {/* 背景介绍 */}
          {currentPhase?.type === PHASE_TYPES.INTRO && (
            <div className="play-story-card">
              <h3 className="play-story-title">背景故事</h3>
              <p className="play-story-text">{script.background}</p>
            </div>
          )}

          {/* 自我介绍 */}
          {currentPhase?.type === PHASE_TYPES.SELF_INTRO && (
            <div className="play-self-intro">
              <div className="play-story-card">
                <h3 className="play-story-title">你的公开介绍</h3>
                <p className="play-story-text">{myRole.intro}</p>
              </div>
              <div className="play-story-card play-secret-card">
                <h3 className="play-story-title">🔍 你的秘密剧本</h3>
                <p className="play-story-text">{myRole.secret}</p>
                {myRole.isKiller && (
                  <span className="tag tag-danger">你是凶手！</span>
                )}
              </div>
              <div className="play-role-list">
                <h4 className="play-subsection-title">其他角色介绍</h4>
                {script.roles.filter((r) => r.id !== myRoleId).map((role) => (
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
          {currentPhase?.type === PHASE_TYPES.INVESTIGATE && (
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
                            {isRevealed ? clue.name : '🔒 未知线索'}
                          </span>
                        </div>
                        {isRevealed && (
                          <p className="clue-card-desc">{clue.description}</p>
                        )}
                        {!isRevealed && (
                          <p className="clue-card-desc clue-card-placeholder">点击翻看线索卡</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {revealedClues.length > 0 && (
                <p className="play-clue-tip">
                  已查看 {revealedClues.length} / {phaseClues.length} 条线索
                </p>
              )}
            </div>
          )}

          {/* 讨论 */}
          {currentPhase?.type === PHASE_TYPES.DISCUSS && (
            <div className="play-discuss">
              <div className="play-story-card">
                <h3 className="play-story-title">自由讨论</h3>
                <p className="play-story-text">
                  请所有玩家自由讨论已掌握的线索，分享你的推理与怀疑。不要暴露你的秘密剧本，除非你想误导他人。
                </p>
              </div>
              <div className="play-clue-review">
                <h4 className="play-subsection-title">已掌握的线索</h4>
                {revealedClues.length === 0 ? (
                  <p className="play-empty">尚未发现任何线索</p>
                ) : (
                  <div className="clue-grid">
                    {script.clues
                      .filter((c) => revealedClues.includes(c.id))
                      .map((clue) => (
                        <div key={clue.id} className="clue-card revealed">
                          <div className="clue-card-header">
                            <span className="clue-card-name">{clue.name}</span>
                          </div>
                          <p className="clue-card-desc">{clue.description}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 投票 */}
          {currentPhase?.type === PHASE_TYPES.VOTE && (
            <div className="play-vote">
              <h4 className="play-subsection-title">你认为谁是凶手？</h4>
              <div className="play-vote-grid">
                {script.roles
                  .filter((r) => r.id !== myRoleId)
                  .map((role) => (
                    <div
                      key={role.id}
                      className={`play-vote-card ${voteTarget === role.id ? 'selected' : ''}`}
                      onClick={() => setVoteTarget(role.id)}
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
            </div>
          )}

          {/* 揭晓真相 */}
          {currentPhase?.type === PHASE_TYPES.REVEAL && (
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
                  {script.roles.map((role) => (
                    <div
                      key={role.id}
                      className={`play-reveal-role ${role.isKiller ? 'killer' : ''}`}
                    >
                      <img className="role-avatar" src={role.avatar} alt={role.name} />
                      <div className="play-reveal-role-info">
                        <span className="play-reveal-role-name">{role.name}</span>
                        {role.isKiller ? (
                          <span className="tag tag-danger">凶手</span>
                        ) : (
                          <span className="tag tag-ghost">无辜</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="play-reveal-vote">
                    {voteTarget && (
                      <p>
                        你投给了 <strong>{script.roles.find((r) => r.id === voteTarget)?.name}</strong>，
                        {script.roles.find((r) => r.id === voteTarget)?.isKiller
                          ? '猜对了！🎉'
                          : '很遗憾，猜错了。'}
                      </p>
                    )}
                  </div>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => navigate('/')}
                  >
                    返回大厅
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 底部导航 */}
      <div className="play-nav">
        <button
          className="btn btn-outline"
          onClick={handlePrevPhase}
          disabled={currentPhaseIdx === 0}
        >
          ← 上一阶段
        </button>
        {currentPhaseIdx < phases.length - 1 ? (
          <button className="btn btn-primary" onClick={handleNextPhase}>
            下一阶段 →
          </button>
        ) : (
          <span className="play-nav-end">游戏即将结束</span>
        )}
      </div>
    </div>
  );
}