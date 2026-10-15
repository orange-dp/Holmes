import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../middleware/auth.js'
import { buildRoomState } from '../routes/rooms.js'
import { query, queryOne, queryAll } from '../db/index.js'

// 存储 socketId -> { userId, roomId } 映射
const socketMap = new Map()

export function setupSocket(httpServer, corsOrigin) {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin || '*',
      methods: ['GET', 'POST'],
    },
  })

  // JWT 认证中间件
  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error('未认证'))
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      socket.userId = decoded.id
      socket.username = decoded.username
      next()
    } catch {
      next(new Error('认证失败'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`[Socket] 用户连接: ${socket.username} (${socket.id})`)

    // 加入房间
    socket.on('room:join', async ({ roomId }) => {
      if (!roomId) return

      // 验证用户在该房间中
      const player = await queryOne(
        'SELECT * FROM room_players WHERE room_id = $1 AND user_id = $2',
        [roomId, socket.userId]
      )
      if (!player) {
        socket.emit('error', { message: '你不在该房间中' })
        return
      }

      socket.join(`room:${roomId}`)
      socketMap.set(socket.id, { userId: socket.userId, roomId })

      // 广播最新房间状态
      const roomState = await buildRoomState(roomId)
      io.to(`room:${roomId}`).emit('room:state', { room: roomState })
    })

    // 离开房间
    socket.on('room:leave', async () => {
      const info = socketMap.get(socket.id)
      if (info) {
        socket.leave(`room:${info.roomId}`)
        socketMap.delete(socket.id)

        // 广播最新状态
        const roomState = await buildRoomState(info.roomId)
        if (roomState) {
          io.to(`room:${info.roomId}`).emit('room:state', { room: roomState })
        }
      }
    })

    // 准备状态变更
    socket.on('player:ready', async ({ roomId, ready }) => {
      await query(
        'UPDATE room_players SET is_ready = $1 WHERE room_id = $2 AND user_id = $3',
        [ready, roomId, socket.userId]
      )

      const roomState = await buildRoomState(roomId)
      io.to(`room:${roomId}`).emit('room:state', { room: roomState })
    })

    // 角色分配完成（通知全员刷新）
    socket.on('room:rolesAssigned', async ({ roomId }) => {
      const roomState = await buildRoomState(roomId)
      io.to(`room:${roomId}`).emit('room:state', { room: roomState })
      io.to(`room:${roomId}`).emit('room:rolesAssigned', {})
    })

    // 游戏开始
    socket.on('game:start', async ({ roomId }) => {
      const roomState = await buildRoomState(roomId)
      io.to(`room:${roomId}`).emit('room:state', { room: roomState })
      io.to(`room:${roomId}`).emit('game:started', { roomId })
    })

    // 阶段推进
    socket.on('game:phaseChange', async ({ roomId, phaseIdx }) => {
      const roomState = await buildRoomState(roomId)
      io.to(`room:${roomId}`).emit('room:state', { room: roomState })
      io.to(`room:${roomId}`).emit('game:phaseChanged', {
        phaseIdx,
        phase: roomState.phases[phaseIdx],
      })
    })

    // 投票
    socket.on('game:vote', async ({ roomId, targetRoleId }) => {
      if (!targetRoleId) return

      // upsert 投票记录
      await query(
        `INSERT INTO votes (room_id, voter_id, target_role_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (room_id, voter_id)
         DO UPDATE SET target_role_id = EXCLUDED.target_role_id, created_at = NOW()`,
        [roomId, socket.userId, targetRoleId]
      )

      // 统计当前投票情况（匿名，只返回数量）
      const voteCount = await queryOne(
        'SELECT COUNT(*) as cnt FROM votes WHERE room_id = $1',
        [roomId]
      )
      const playerCount = await queryOne(
        'SELECT COUNT(*) as cnt FROM room_players WHERE room_id = $1',
        [roomId]
      )

      io.to(`room:${roomId}`).emit('game:voteUpdate', {
        voted: parseInt(voteCount.cnt),
        total: parseInt(playerCount.cnt),
      })

      // 如果所有人都投了票，公布结果
      if (parseInt(voteCount.cnt) >= parseInt(playerCount.cnt)) {
        const votes = await queryAll(
          `SELECT target_role_id, COUNT(*) as cnt
           FROM votes WHERE room_id = $1
           GROUP BY target_role_id
           ORDER BY cnt DESC`,
          [roomId]
        )
        io.to(`room:${roomId}`).emit('game:voteResult', { votes })
      }
    })

    // 线索翻看（广播给房间内其他玩家，不暴露内容）
    socket.on('game:clueRevealed', async ({ roomId, clueId }) => {
      socket.to(`room:${roomId}`).emit('game:clueRevealed', { clueId, by: socket.username })
    })

    // 游戏结束
    socket.on('game:end', async ({ roomId }) => {
      const roomState = await buildRoomState(roomId)
      io.to(`room:${roomId}`).emit('room:state', { room: roomState })
      io.to(`room:${roomId}`).emit('game:ended', { roomId })
    })

    // 断线
    socket.on('disconnect', () => {
      const info = socketMap.get(socket.id)
      if (info) {
        console.log(`[Socket] 用户断线: ${socket.username} (房间 ${info.roomId})`)
        socketMap.delete(socket.id)
        // 通知房间内其他玩家
        socket.to(`room:${info.roomId}`).emit('player:disconnected', {
          userId: info.userId,
        })
      }
    })
  })

  return io
}