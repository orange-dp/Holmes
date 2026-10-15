import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import ScriptDetail from './pages/ScriptDetail.jsx'
import Room from './pages/Room.jsx'
import Play from './pages/Play.jsx'
import Profile from './pages/Profile.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/script/:id" element={<ScriptDetail />} />
          <Route path="/room/:id" element={<Room />} />
          <Route path="/play/:id" element={<Play />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </HashRouter>
  </React.StrictMode>
)