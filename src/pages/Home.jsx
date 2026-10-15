import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStorage, setStorage } from '../utils/util.js'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const [userInfo, setUserInfo] = useState(null)

  useEffect(() => {
    // 记录访问时间到 localStorage（对应 app.js onLaunch 中的 logs 逻辑）
    const logs = getStorage('logs') || []
    logs.unshift(Date.now())
    setStorage('logs', logs)

    // 读取本地缓存的用户信息
    const cached = getStorage('userInfo')
    if (cached) setUserInfo(cached)
  }, [])

  const handleGetUserInfo = () => {
    // Web 环境下模拟获取用户信息
    const mockUser = {
      nickName: '侦探 Holmes',
      avatarUrl: 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">' +
        '<circle cx="64" cy="64" r="62" fill="#4a90d9"/>' +
        '<text x="64" y="74" font-size="48" text-anchor="middle" fill="white">H</text>' +
        '</svg>'
      )
    }
    setStorage('userInfo', mockUser)
    setUserInfo(mockUser)
  }

  const handleNavigateToLogs = () => {
    navigate('/logs')
  }

  return (
    <div className="container">
      <div className="userinfo">
        {!userInfo ? (
          <button className="btn-get-user" onClick={handleGetUserInfo}>
            获取头像昵称
          </button>
        ) : (
          <>
            <img
              className="userinfo-avatar"
              src={userInfo.avatarUrl}
              alt="avatar"
              onClick={handleNavigateToLogs}
            />
            <span className="userinfo-nickname">{userInfo.nickName}</span>
          </>
        )}
      </div>
      <div className="usermotto">
        <span className="user-motto">开始游戏</span>
      </div>
    </div>
  )
}