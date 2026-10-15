import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthed, logout } = useAuth()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="page-wrap">
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo">
            🔍 HOLMES
          </Link>
          <div className="navbar-links">
            <Link to="/" className={`navbar-link ${isActive('/') ? 'active' : ''}`}>
              剧本大厅
            </Link>
            {isAuthed && (
              <Link to="/profile" className={`navbar-link ${isActive('/profile') ? 'active' : ''}`}>
                个人中心
              </Link>
            )}
            {isAuthed ? (
              <div className="navbar-user">
                <span className="navbar-username">{user?.nickname || user?.username}</span>
                <button className="navbar-logout" onClick={handleLogout}>
                  退出
                </button>
              </div>
            ) : (
              <Link to="/login" className="navbar-link navbar-login-btn">
                登录 / 注册
              </Link>
            )}
          </div>
        </div>
      </nav>
      <main className="page-content">{children}</main>
      <footer className="footer">
        Holmes · 谋杀之谜剧本杀平台 · 框架预览版
      </footer>
    </div>
  )
}