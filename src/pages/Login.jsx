import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuth()

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 获取来源路径，登录后跳回
  const from = location.state?.from || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await login(username.trim(), password)
      } else {
        if (password.length < 6) {
          setError('密码至少 6 位')
          setLoading(false)
          return
        }
        await register(username.trim(), password, nickname.trim() || username.trim())
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">🔍 HOLMES</h1>
        <p className="login-subtitle">谋杀之谜 · 剧本杀平台</p>

        {/* 模式切换 */}
        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError('') }}
          >
            登录
          </button>
          <button
            className={`login-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError('') }}
          >
            注册
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">用户名</label>
            <input
              className="login-input"
              type="text"
              placeholder="2-20 个字符"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          {mode === 'register' && (
            <div className="login-field">
              <label className="login-label">昵称（可选）</label>
              <input
                className="login-input"
                type="text"
                placeholder="默认使用用户名"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
          )}

          <div className="login-field">
            <label className="login-label">密码</label>
            <input
              className="login-input"
              type="password"
              placeholder={mode === 'register' ? '至少 6 位' : '请输入密码'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            className="btn btn-primary btn-lg btn-block"
            type="submit"
            disabled={loading}
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <p className="login-hint">
          {mode === 'login' ? '没有账号？' : '已有账号？'}
          <button
            className="login-switch"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
            }}
          >
            {mode === 'login' ? '去注册' : '去登录'}
          </button>
        </p>
      </div>
    </div>
  )
}