import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getScripts } from '../api/scripts.js'
import './Home.css'

export default function Home() {
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('all')
  const [filterPlayers, setFilterPlayers] = useState(0)
  const [scripts, setScripts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 从 API 获取剧本列表
  useEffect(() => {
    setLoading(true)
    setError('')

    const filters = {}
    if (search) filters.search = search
    if (filterTag !== 'all') filters.tag = filterTag
    if (filterPlayers !== 0) filters.players = filterPlayers

    // 防抖：搜索时延迟 300ms
    const timer = setTimeout(() => {
      getScripts(filters)
        .then((data) => {
          setScripts(data.scripts || [])
        })
        .catch((err) => {
          setError(err.message || '获取剧本列表失败')
          setScripts([])
        })
        .finally(() => {
          setLoading(false)
        })
    }, search ? 300 : 0)

    return () => clearTimeout(timer)
  }, [search, filterTag, filterPlayers])

  // 收集所有标签（从已加载的剧本中提取）
  const allTags = useMemo(() => {
    const tags = new Set()
    scripts.forEach((s) => (s.tags || []).forEach((t) => tags.add(t)))
    return ['all', ...Array.from(tags)]
  }, [scripts])

  // 玩家人数选项
  const playerOptions = useMemo(() => {
    const counts = new Set(scripts.map((s) => s.playerCount))
    return [0, ...Array.from(counts).sort((a, b) => a - b)]
  }, [scripts])

  return (
    <div className="home">
      {/* Banner */}
      <div className="home-banner">
        <h1 className="home-banner-title">谋杀之谜</h1>
        <p className="home-banner-subtitle">沉浸式剧本杀 · 多人在线 · 角色扮演推理</p>
      </div>

      {/* 筛选区 */}
      <div className="home-filters">
        <div className="home-search">
          <input
            type="text"
            placeholder="搜索剧本名 / 简介..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="home-search-input"
          />
        </div>
        <div className="home-filter-row">
          <div className="home-filter-group">
            <span className="home-filter-label">标签</span>
            <div className="home-filter-chips">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={`home-chip ${filterTag === tag ? 'active' : ''}`}
                  onClick={() => setFilterTag(tag)}
                >
                  {tag === 'all' ? '全部' : tag}
                </button>
              ))}
            </div>
          </div>
          <div className="home-filter-group">
            <span className="home-filter-label">人数</span>
            <div className="home-filter-chips">
              {playerOptions.map((n) => (
                <button
                  key={n}
                  className={`home-chip ${filterPlayers === n ? 'active' : ''}`}
                  onClick={() => setFilterPlayers(n)}
                >
                  {n === 0 ? '全部' : `${n}人`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 剧本列表 */}
      <div className="home-section-title">
        {loading ? '加载中...' : error ? error : `共 ${scripts.length} 个剧本`}
      </div>
      {!loading && !error && scripts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>没有找到符合条件的剧本</p>
        </div>
      ) : (
        <div className="script-grid">
          {scripts.map((script) => (
            <Link
              to={`/script/${script.id}`}
              key={script.id}
              className="script-card"
            >
              <div className="script-card-cover">
                <img src={script.cover} alt={script.title} />
                <div className="script-card-badge">
                  {script.playerCount} 人
                </div>
              </div>
              <div className="script-card-body">
                <h3 className="script-card-title">{script.title}</h3>
                <div className="script-card-meta">
                  <span className="difficulty">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={`difficulty-star ${n > script.difficulty ? 'dim' : ''}`}
                      >
                        ★
                      </span>
                    ))}
                  </span>
                  <span className="script-card-duration">约 {script.duration} 分钟</span>
                </div>
                <p className="script-card-synopsis">{script.synopsis}</p>
                <div className="script-card-tags">
                  {(script.tags || []).map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}