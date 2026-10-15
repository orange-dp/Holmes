import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children }) {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
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
            <Link to="/profile" className={`navbar-link ${isActive('/profile') ? 'active' : ''}`}>
              个人中心
            </Link>
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