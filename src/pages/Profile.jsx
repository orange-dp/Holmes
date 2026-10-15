import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_SCRIPTS } from '../data/scripts';
import { getStorage, setStorage } from '../utils/util';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(() => getStorage('nickname') || '');
  const [saved, setSaved] = useState(false);

  // Mock 游戏历史
  const gameHistory = [
    { id: 1, scriptTitle: '雾庄疑案', date: '2026-10-12', role: '王管家', result: '凶手获胜', won: false },
    { id: 2, scriptTitle: '末班列车', date: '2026-10-08', role: '通勤者', result: '平民获胜', won: true },
    { id: 3, scriptTitle: '校园怪谈', date: '2026-09-30', role: '学生会长', result: '凶手获胜', won: true },
  ];

  const handleSave = () => {
    setStorage('nickname', nickname.trim() || '匿名玩家');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const stats = {
    total: gameHistory.length,
    wins: gameHistory.filter((g) => g.won).length,
    winRate: gameHistory.length > 0
      ? Math.round((gameHistory.filter((g) => g.won).length / gameHistory.length) * 100)
      : 0,
  };

  return (
    <div className="profile-page">
      {/* 用户信息 */}
      <div className="profile-card">
        <div className="profile-avatar">
          {nickname ? nickname.charAt(0).toUpperCase() : '?'}
        </div>
        <div className="profile-info">
          <input
            className="profile-nickname-input"
            type="text"
            placeholder="输入你的昵称"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            {saved ? '已保存' : '保存'}
          </button>
        </div>
      </div>

      {/* 统计 */}
      <div className="profile-stats">
        <div className="profile-stat-item">
          <span className="profile-stat-value">{stats.total}</span>
          <span className="profile-stat-label">总场次</span>
        </div>
        <div className="profile-stat-item">
          <span className="profile-stat-value">{stats.wins}</span>
          <span className="profile-stat-label">胜利</span>
        </div>
        <div className="profile-stat-item">
          <span className="profile-stat-value">{stats.winRate}%</span>
          <span className="profile-stat-label">胜率</span>
        </div>
      </div>

      {/* 游戏历史 */}
      <div className="profile-section">
        <h2 className="profile-section-title">游戏历史</h2>
        {gameHistory.length === 0 ? (
          <div className="profile-empty">
            <p>还没有游戏记录</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              去玩一局
            </button>
          </div>
        ) : (
          <div className="history-list">
            {gameHistory.map((game) => (
              <div key={game.id} className="history-item">
                <div className="history-item-info">
                  <span className="history-item-title">{game.scriptTitle}</span>
                  <span className="history-item-meta">
                    {game.date} · 扮演 {game.role}
                  </span>
                </div>
                <div className="history-item-result">
                  <span className={`tag ${game.won ? 'tag-success' : 'tag-danger'}`}>
                    {game.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 收藏剧本 */}
      <div className="profile-section">
        <h2 className="profile-section-title">推荐剧本</h2>
        <div className="profile-recommend">
          {MOCK_SCRIPTS.slice(0, 3).map((s) => (
            <div
              key={s.id}
              className="profile-recommend-card"
              onClick={() => navigate(`/script/${s.id}`)}
            >
              <img className="profile-recommend-cover" src={s.cover} alt={s.title} />
              <div className="profile-recommend-info">
                <span className="profile-recommend-title">{s.title}</span>
                <span className="profile-recommend-meta">{s.playerCount}人 · {s.duration}min</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}