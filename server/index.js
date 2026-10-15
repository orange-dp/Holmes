import express from 'express'
import cors from 'cors'
import http from 'http'
import dotenv from 'dotenv'

import { initDB } from './db/index.js'
import { setupSocket } from './socket/index.js'
import authRoutes from './routes/auth.js'
import scriptRoutes from './routes/scripts.js'
import roomRoutes from './routes/rooms.js'

dotenv.config()

const app = express()
const PORT = parseInt(process.env.PORT || '3001')
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'

// 中间件
app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
app.use(express.json())

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'holmes-api', time: new Date().toISOString() })
})

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/scripts', scriptRoutes)
app.use('/api/rooms', roomRoutes)

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('[Error]', err.message)
  res.status(500).json({ error: '服务器内部错误' })
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' })
})

// 创建 HTTP 服务器
const server = http.createServer(app)

// 初始化 Socket.IO
const io = setupSocket(server, CORS_ORIGIN)

// 启动
async function start() {
  try {
    // 初始化数据库
    await initDB()
    console.log('[Server] 数据库初始化完成')

    server.listen(PORT, () => {
      console.log(`[Server] Holmes API 运行在端口 ${PORT}`)
      console.log(`[Server] CORS origin: ${CORS_ORIGIN}`)
    })
  } catch (err) {
    console.error('[Server] 启动失败:', err)
    process.exit(1)
  }
}

start()