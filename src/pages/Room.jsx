import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  createRoom,
  getRoomByCode,
  joinRoom,
  toggleReady,
  assignRoles,
  startGame,
  leaveRoom,
} from '../api/rooms.js';
import { getScriptDetail, getMyRole } from '../api/scripts.js';
import {
  connectSocket,
  joinRoomSocket,
  leaveRoomSocket,
  onRoomState,
  onRolesAssigned,
  onGameStarted,
  onPlayerDisconnected,
} from '../api/socket.js';
import './Room.css';

export default function Room() {
  const { id } = useParams();  // scriptId
  const navigate = useNavigate();
  const { user } = useAuth();

  const [script, setScript] = useState(null);
  const [room, setRoom] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [disconnectNotice, setDisconnectNotice] = useState('');
  const roomIdRef = useRef(null);

  // 初始加载：获取剧本详情
  useEffect(() => {
    getScriptDetail(id)
      .then((data) => setScript(data.script))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // 创建或加入房间
  const handleCreateRoom = async () => {
    setActionLoading(true);
    setError('');
    try {
      const data = await createRoom(id);
      setRoom(data.room);
      roomIdRef.current = data.room.id;

      // 连接 Socket 并加入房间
      connectSocket();
      joinRoomSocket(data.room.id);

      // 获取我的角色
      refreshMyRole(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 通过房间码加入
  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    setActionLoading(true);
    setError('');
    try {
      // 先通过码找到房间
      const data = await getRoomByCode(joinCode.trim().toUpperCase());
      const roomId = data.room.id;

      // 加入房间
      const joinData = await joinRoom(roomId);
      setRoom(joinData.room);
      roomIdRef.current = roomId;

      connectSocket();
      joinRoomSocket(roomId);
      refreshMyRole(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 刷新我的角色信息
  const refreshMyRole = (scriptId) => {
    getMyRole(scriptId)
      .then((data) => setMyRole(data.role))
      .catch(() => {});
  };

  // Socket.IO 监听
  useEffect(() => {
    if (!roomIdRef.current) return;

    const cleanup1 = onRoomState((data) => {
      if (data.room) {
        setRoom(data.room);
        // 如果角色已分配，刷新我的角色
        if (data.room.players?.some((p) => p.roleId)) {
          refreshMyRole(id);
        }
      }
    });

    const cleanup2 = onRolesAssigned(() => {
      refreshMyRole(id);
    });

    const cleanup3 = onGameStarted(() => {
      navigate(`/play/${id}`);
    });

    const cleanup4 = onPlayerDisconnected((data) => {
      const player = room?.players?.find((p) => p.userId === data.userId);
      const name = player?.nickname || player?.username || '某玩家';
      setDisconnectNotice(`${name} 已断线`);
      setTimeout(() => setDisconnectNotice(''), 5000);
    });

    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
      cleanup4();
    };
  }, [id, room?.id]);

  // 准备/取消准备
  const handleToggleReady = async () => {
    if (!room) return;
    const me = room.players.find((p) => p.userId === user.id);
    const newReady = !me?.isReady;
    try {
      const data = await toggleReady(room.id, newReady);
      setRoom(data.room);
    } catch (err) {
      setError(err.message);
    }
  };

  // 分配角色（仅房主）
  const handleAssignRoles = async () => {
    if (!room) return;
    setActionLoading(true);
    setError('');
    try {
      const data = await assignRoles(room.id);
      setRoom(data.room);
      refreshMyRole(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 开始游戏（仅房主）
  const handleStartGame = async () => {
    if (!room) return;
    setActionLoading(true);
    setError('');
    try {
      await startGame(room.id);
      navigate(`/play/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 离开房间
  const handleLeave = async () => {
    if (!room) return;
    try {
      leaveRoomSocket(room.id);
      await leaveRoom(room.id);
      setRoom(null);
      setMyRole(null);
      roomIdRef.current = null;
    } catch (err) {
      // 房间可能已被销毁
      setRoom(null);
      setMyRole(null);
      roomIdRef.current = null;
    }
  };

  if (loading) {
    return <div className="page-loading">加载中...</div>;
  }

  if (error && !script) {
    return (
      <div className="room-not-found">
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>返回大厅</button>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="room-not-found">
        <p>剧本不存在</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>返回大厅</button>
      </div>
    );
  }

  // 未进入房间时：显示创建/加入房间界面
  if (!room) {
    return (
      <div className="room-page">
        <button className="room-back" onClick={() => navigate(`/script/${script.id}`)}>
          ← 返回剧本
        </button>

        <div className="room-create-section">
          <h1 className="room-title">{script.title}</h1>
          <p className="room-create-hint">创建新房间或输入房间码加入已有房间</p>

          <div className="room-create-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleCreateRoom}
              disabled={actionLoading}
            >
              {actionLoading ? '创建中...' : '创建房间'}
            </button>
          </div>

          <div className="room-divider">
            <span>或</span>
          </div>

          <div className="room-join">
            <input
              className="room-join-input"
              type="text"
              placeholder="输入 6 位房间码"
              value={joinCode}
              maxLength={6}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
            />
            <button
              className="btn btn-primary"
              onClick={handleJoinByCode}
              disabled={actionLoading || !joinCode.trim()}
            >
              加入房间
            </button>
          </div>
          {error && <p className="room-error">{error}</p>}
      {disconnectNotice && <p className="room-notice">{disconnectNotice}</p>}
        </div>
      </div>
    );
  }

  // 已进入房间
  const isHost = room.hostId === user.id;
  const me = room.players.find((p) => p.userId === user.id);
  const allReady = room.players.length >= 2 && room.players.every((p) => p.isReady);
  const rolesAssigned = room.players.some((p) => p.roleId);

  return (
    <div className="room-page">
      <button className="room-back" onClick={() => navigate(`/script/${script.id}`)}>
        ← 返回剧本
      </button>

      {/* 房间信息 */}
      <div className="room-header">
        <div className="room-header-left">
          <h1 className="room-title">{script.title}</h1>
          <div className="room-info-row">
            <span className="tag tag-primary">{room.players.length}/{room.playerCount}人</span>
            <span className="room-code">房间号：{room.code}</span>
            {room.status === 'playing' && <span className="tag tag-success">游戏中</span>}
          </div>
        </div>
        <div className="room-header-right">
          {isHost && !rolesAssigned && (
            <button
              className="btn btn-primary btn-lg"
              onClick={handleAssignRoles}
              disabled={actionLoading || room.players.length < 2}
            >
              分配角色
            </button>
          )}
          {isHost && rolesAssigned && room.status === 'waiting' && (
            <button
              className="btn btn-primary btn-lg"
              onClick={handleStartGame}
              disabled={actionLoading || !allReady}
            >
              {allReady ? '开始游戏 →' : '等待全员准备'}
            </button>
          )}
          {room.status === 'playing' && (
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate(`/play/${id}`)}
            >
              进入游戏 →
            </button>
          )}
          <button className="btn btn-outline" onClick={handleLeave}>
            离开房间
          </button>
        </div>
      </div>

      {error && <p className="room-error">{error}</p>}
      {disconnectNotice && <p className="room-notice">{disconnectNotice}</p>}

      {/* 玩家列表 */}
      <div className="room-players">
        <h2 className="room-section-title">玩家列表</h2>
        <div className="player-list">
          {room.players.map((p) => (
            <div key={p.userId} className={`player-item ${p.isReady ? 'ready' : ''}`}>
              <div className="player-item-info">
                <span className="player-item-name">
                  {p.nickname || p.username}
                  {p.userId === room.hostId && <span className="tag tag-ghost">房主</span>}
                  {p.userId === user.id && <span className="tag tag-primary">我</span>}
                </span>
                {rolesAssigned && p.roleName && (
                  <span className="player-item-role">
                    角色：<strong>{p.roleName}</strong>
                  </span>
                )}
              </div>
              {p.userId !== user.id ? (
                <span className={`tag ${p.isReady ? 'tag-success' : 'tag-ghost'}`}>
                  {p.isReady ? '已准备' : '未准备'}
                </span>
              ) : (
                <button
                  className={`btn btn-sm ${me?.isReady ? 'btn-success' : 'btn-outline'}`}
                  onClick={handleToggleReady}
                >
                  {me?.isReady ? '已准备' : '准备'}
                </button>
              )}
            </div>
          ))}

          {/* 空位 */}
          {Array.from({ length: room.playerCount - room.players.length }).map((_, i) => (
            <div key={`empty-${i}`} className="player-item empty">
              <div className="player-item-info">
                <span className="player-item-name" style={{ opacity: 0.4 }}>
                  等待加入...
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 我的角色卡片（分配后显示） */}
      {myRole && (
        <div className="room-my-role">
          <h2 className="room-section-title">你的角色</h2>
          <div className="role-card role-card-highlight">
            <img className="role-avatar" src={myRole.avatar} alt={myRole.name} />
            <div className="role-card-body">
              <h3 className="role-name">{myRole.name}</h3>
              {myRole.occupation && <span className="tag tag-ghost">{myRole.occupation}</span>}
              <p className="role-desc">{myRole.intro}</p>
              {myRole.secret && (
                <div className="room-my-secret">
                  <span className="tag tag-danger">秘密剧本</span>
                  <p>{myRole.secret}</p>
                </div>
              )}
              {myRole.isKiller && (
                <span className="tag tag-danger">你是凶手！</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 游戏阶段预览 */}
      <div className="room-phases-preview">
        <h2 className="room-section-title">游戏流程</h2>
        <div className="room-phase-chips">
          {(script.phases || []).map((phase, idx) => (
            <span key={idx} className="room-phase-chip">
              {idx + 1}. {phase.title || phase.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}