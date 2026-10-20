// Demo 后端服务
import express from 'express'
import http from 'http'
import cors from 'cors'
import { Server } from 'socket.io'
import { createGame, joinGame, leaveGame, getGameState, handleAction, getGame, getPlayers } from './game.js'

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

// 静态文件（前端 build 产物）
app.use(express.static('../client/dist'))

// API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log(`[Socket] 连接: ${socket.id}`)

  // 加入游戏
  socket.on('join', ({ characterId, playerName }) => {
    const player = joinGame(socket.id, characterId, playerName)
    if (!player) {
      socket.emit('error', { message: '角色已被占用或无效' })
      return
    }
    socket.emit('joined', { characterId: player.characterId })
    broadcastAll()
  })

  // 行动
  socket.on('action', (action) => {
    const result = handleAction(socket.id, action)
    if (result.error) {
      socket.emit('action_error', { message: result.error })
      return
    }

    // 发送事件给当前玩家
    if (result.events && result.events.length > 0) {
      socket.emit('action_result', { events: result.events })
    }

    // 广播状态更新给所有人
    broadcastAll()

    // 特殊事件广播
    for (const evt of result.events || []) {
      if (evt.type === 'body_discovered') {
        io.emit('global_event', {
          type: 'body_discovered',
          text: `${evt.discoverer} 在书房发现了李老爷的尸体！案件发生了！`,
        })
      }
      if (evt.type === 'meeting') {
        // 通知被相遇的玩家
        for (const meeting of evt.meetings) {
          const otherSocket = Object.entries(getPlayers()).find(
            ([, p]) => p.characterId === meeting.characterId
          )?.[0]
          if (otherSocket) {
            io.to(otherSocket).emit('meeting', {
              with: getPlayers()[socket.id]?.characterName,
              location: meeting.location,
            })
          }
        }
      }
    }
  })

  // 断开连接
  socket.on('disconnect', () => {
    console.log(`[Socket] 断开: ${socket.id}`)
    leaveGame(socket.id)
    broadcastAll()
  })
})

// 广播状态给所有玩家
function broadcastAll() {
  const game = getGame()
  if (!game) return
  for (const socketId of Object.keys(game.players)) {
    const state = getGameState(socketId)
    if (state) {
      io.to(socketId).emit('state', state)
    }
  }
  // 同时发送玩家列表
  const playerList = Object.values(getPlayers()).map(p => ({
    socketId: p.socketId,
    characterId: p.characterId,
    characterName: p.characterName,
    color: p.color,
    location: p.location,
  }))
  io.emit('players', playerList)
}

const PORT = 3001
server.listen(PORT, () => {
  createGame()
  console.log(`Demo 服务器运行在 http://localhost:${PORT}`)
})