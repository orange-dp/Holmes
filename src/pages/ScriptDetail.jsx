import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getScriptDetail } from '../api/scripts.js';
import { useAuth } from '../context/AuthContext.jsx';
import './ScriptDetail.css';

export default function ScriptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthed } = useAuth();
  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('roles');

  useEffect(() => {
    setLoading(true);
    setError('');
    getScriptDetail(id)
      .then((data) => {
        setScript(data.script);
      })
      .catch((err) => {
        setError(err.message || '获取剧本详情失败');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="page-loading">加载中...</div>;
  }

  if (error || !script) {
    return (
      <div className="detail-not-found">
        <p>{error || '剧本不存在'}</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          返回大厅
        </button>
      </div>
    );
  }

  const handleStartGame = () => {
    if (!isAuthed) {
      navigate('/login', { state: { from: `/script/${id}` } });
      return;
    }
    navigate(`/room/${id}`);
  };

  return (
    <div className="detail-page">
      {/* 顶部信息 */}
      <div className="detail-header">
        <button className="detail-back" onClick={() => navigate('/')}>
          ← 返回
        </button>
        <div className="detail-header-content">
          <img className="detail-cover" src={script.cover} alt={script.title} />
          <div className="detail-header-info">
            <h1 className="detail-title">{script.title}</h1>
            <div className="detail-meta">
              <span className="tag tag-primary">{script.playerCount}人本</span>
              <span className="difficulty">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={`difficulty-star ${n > script.difficulty ? 'dim' : ''}`}>★</span>
                ))}
              </span>
              <span className="detail-duration">预计 {script.duration} 分钟</span>
            </div>
            <p className="detail-synopsis">{script.synopsis}</p>
            <div className="detail-tags">
              {(script.tags || []).map((t) => (
                <span key={t} className="tag tag-ghost">{t}</span>
              ))}
            </div>
            <button
              className="btn btn-primary btn-lg detail-start-btn"
              onClick={handleStartGame}
            >
              {isAuthed ? '创建房间 / 开始游戏' : '登录后开始游戏'}
            </button>
          </div>
        </div>
      </div>

      {/* Tab 区域 */}
      <div className="detail-tabs">
        <button
          className={`detail-tab ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          角色介绍
        </button>
        <button
          className={`detail-tab ${activeTab === 'phases' ? 'active' : ''}`}
          onClick={() => setActiveTab('phases')}
        >
          游戏阶段
        </button>
        <button
          className={`detail-tab ${activeTab === 'clues' ? 'active' : ''}`}
          onClick={() => setActiveTab('clues')}
        >
          线索预览
        </button>
      </div>

      {/* Tab 内容 */}
      <div className="detail-tab-content">
        {activeTab === 'roles' && (
          <div className="role-grid">
            {(script.roles || []).map((role) => (
              <div key={role.id} className="role-card">
                <img className="role-avatar" src={role.avatar} alt={role.name} />
                <div className="role-card-body">
                  <h3 className="role-name">{role.name}</h3>
                  {role.occupation && (
                    <span className="tag tag-ghost">{role.occupation}</span>
                  )}
                  <p className="role-desc">{role.intro}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'phases' && (
          <div className="phase-list">
            {(script.phases || []).map((phase, idx) => (
              <div key={idx} className="phase-item">
                <div className="phase-index">{idx + 1}</div>
                <div className="phase-item-body">
                  <h4 className="phase-item-title">{phase.title || phase.name}</h4>
                  <p className="phase-item-desc">{phase.description}</p>
                  <span className="tag tag-ghost">{phase.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'clues' && (
          <div className="clue-grid">
            {(script.clues || []).map((clue) => (
              <div key={clue.id} className="clue-card">
                <div className="clue-card-header">
                  <span className="clue-card-name">{clue.name}</span>
                  <span className={`tag ${clue.isPublic ? 'tag-primary' : 'tag-ghost'}`}>
                    {clue.isPublic ? '公共线索' : '个人线索'}
                  </span>
                </div>
                <p className="clue-card-desc">{clue.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}