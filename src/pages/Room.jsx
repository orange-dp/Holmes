import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getScriptById } from '../data/scripts';
import './Room.css';

export default function Room() {
  const { id } = useParams();
  const navigate = useNavigate();
  const script = getScriptById(id);

  // 本地状态：模拟房间
  const [roomCode] = useState(() => generateRoomCode());
  const [players, setPlayers] = useState([
    { id: 1, name: '玩家1（庄主）', ready: true, isHost: true, roleId: null },
  ]);
  const [playerName, setPlayerName] = useState('');
  const [assignedRoles, setAssignedRoles] = useState(false);

  if (!script) {
    return (
      <div className="room-not-found">
        <p>剧本不存在</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>返回大厅</button>
      </div>
    );
  }

  // 加入房间
  const handleJoin = () => {
    const name = playerName.trim() || `玩家${players.length + 1}`;
    if (players.length >= script.playerCount) return;
    setPlayers([
      ...players,
      { id: players.length + 1, name, ready: false, isHost: false, roleId: null },
    ]);
    setPlayerName('');
  };

  // 切换准备状态
  const toggleReady = (playerId) => {
    setPlayers(players.map((p) => (p.id === playerId ? { ...p, ready: !p.ready } : p)));
  };

  // 分配角色
  const handleAssignRoles = () => {
    const shuffled = [...script.roles].sort(() => Math.random() - 0.5);
    setPlayers(players.map((p, i) => ({ ...p, roleId: shuffled[i]?.id || null })));
    setAssignedRoles(true);
  };

  const allReady = players.length >= 2 && players.every((p) => p.ready);

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
            <span className="tag tag-primary">{players.length}/{script.playerCount}人</span>
            <span className="room-code">房间号：{roomCode}</span>
          </div>
        </div>
        <div className="room-header-right">
          {assignedRoles ? (
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate(`/play/${script.id}`)}
              disabled={!allReady}
            >
              进入游戏 →
            </button>
          ) : (
            <button
              className="btn btn-primary btn-lg"
              onClick={handleAssignRoles}
              disabled={players.length < 2}
            >
              分配角色
            </button>
          )}
        </div>
      </div>

      {/* 玩家列表 */}
      <div className="room-players">
        <h2 className="room-section-title">玩家列表</h2>
        <div className="player-list">
          {players.map((p) => {
            const role = script.roles.find((r) => r.id === p.roleId);
            return (
              <div key={p.id} className={`player-item ${p.ready ? 'ready' : ''}`}>
                <div className="player-item-info">
                  <span className="player-item-name">
                    {p.name}
                    {p.isHost && <span className="tag tag-ghost">房主</span>}
                  </span>
                  {assignedRoles && role && (
                    <span className="player-item-role">
                      你的角色：<strong>{role.name}</strong>
                    </span>
                  )}
                </div>
                <button
                  className={`btn btn-sm ${p.ready ? 'btn-success' : 'btn-outline'}`}
                  onClick={() => toggleReady(p.id)}
                >
                  {p.ready ? '已准备' : '准备'}
                </button>
              </div>
            );
          })}
        </div>

        {/* 加入区域 */}
        {players.length < script.playerCount && (
          <div className="room-join">
            <input
              className="room-join-input"
              type="text"
              placeholder="输入你的昵称"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <button className="btn btn-primary" onClick={handleJoin}>
              加入房间
            </button>
          </div>
        )}
      </div>

      {/* 角色预览（已分配后显示） */}
      {assignedRoles && (
        <div className="room-roles-preview">
          <h2 className="room-section-title">角色分配结果</h2>
          <div className="role-grid">
            {players.map((p) => {
              const role = script.roles.find((r) => r.id === p.roleId);
              if (!role) return null;
              return (
                <div key={p.id} className="role-card">
                  <img className="role-avatar" src={role.avatar} alt={role.name} />
                  <div className="role-card-body">
                    <h3 className="role-name">{role.name}</h3>
                    <p className="role-desc">{role.description}</p>
                    <span className="player-role-tag">分配给：{p.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 游戏阶段预览 */}
      <div className="room-phases-preview">
        <h2 className="room-section-title">游戏流程</h2>
        <div className="room-phase-chips">
          {script.phases.map((phase, idx) => (
            <span key={idx} className="room-phase-chip">
              {idx + 1}. {phase.title}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}