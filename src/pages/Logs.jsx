import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStorage, formatTime } from '../utils/util.js'
import './Logs.css'

export default function Logs() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    const rawLogs = getStorage('logs') || []
    setLogs(rawLogs.map((log) => formatTime(new Date(log))))
  }, [])

  return (
    <div className="container log-list">
      <Link to="/" className="back-link">返回首页</Link>
      {logs.map((log, index) => (
        <div key={index} className="log-item">
          {index + 1}. {log}
        </div>
      ))}
    </div>
  )
}