import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getScripts } from '../api/scripts.js';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateNickname } = useAuth();

  const [nickname, setNickname] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [recommendScripts, setRecommendScripts] = useState([]);

  // 初始化昵称
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || user.username || '');
    }
  }, [user]);

  // 获取推荐剧本
  useEffect(() => {
    getScripts()
      .then((data) => {
        setRecommendScripts((data.scripts || []).slice(0, 3));
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const trimmed = nickname.trim() || '匿名玩家';
      await updateNickname(trimmed);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      {/* 用户信息 */}
      <div className="profile-card">
        <div className="profile-avatar">
          {(nickname || user?.username || '?').charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <div className="profile-username">{user?.username}</div>
          <input
            className="profile-nickname-input"
            type="text"
            placeholder="输入你的昵称"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saved ? '已保存' : saving ? '保存中...' : '保存'}
          </button>
          {error && <p className="profile-error">{error}</p>}
        </div>
      </div>

      {/* 统计 */}
      <div className="profile-stats">
        <div className="profile-stat-item">
          <span className="profile-stat-value">0</span>
          <span className="profile-stat-label">总场次</span>
        </div>
        <div className="profile-stat-item">
          <span className="profile-stat-value">0</span>
          <span className="profile-stat-label">胜利</span>
        </div>
        <div className="profile-stat-item">
          <span className="profile-stat-value">-</span>
          <span className="profile-stat-label">胜率</span>
        </div>
      </div>

      {/* 游戏历史 */}
      <div className="profile-section">
        <h2 className="profile-section-title">游戏历史</h2>
        <div className="profile-empty">
          <p>还没有游戏记录</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            去玩一局
          </button>
        </div>
      </div>

      {/* 推荐剧本 */}
      <div className="profile-section">
        <h2 className="profile-section-title">推荐剧本</h2>
        <div className="profile-recommend">
          {recommendScripts.map((s) => (
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