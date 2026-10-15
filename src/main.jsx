import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import ScriptDetail from './pages/ScriptDetail.jsx'
import Room from './pages/Room.jsx'
import Play from './pages/Play.jsx'
import Profile from './pages/Profile.jsx'
import Login from './pages/Login.jsx'
import './index.css'

/**
 * 受保护路由：未登录时跳转到登录页
 */
function ProtectedRoute({ children }) {
  const { isAuthed, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="page-loading">加载中...</div>
  }

  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/script/:id" element={<ScriptDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/room/:id" element={<ProtectedRoute><Room /></ProtectedRoute>} />
            <Route path="/play/:id" element={<ProtectedRoute><Play /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Routes>
          </Layout>
        </ErrorBoundary>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
)