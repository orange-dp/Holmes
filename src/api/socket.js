/**
 * Socket.IO 客户端
 * 用于房间内实时通信
 */
import { io } from 'socket.io-client'
import { getToken } from './client.js'

let socket = null

/**
 * 初始化 Socket.IO 连接
 */
export function connectSocket() {
  if (socket?.connected) return socket

  socket = io({
    path: '/socket.io/',
    auth: {
      token: getToken(),
    },
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => {
    console.log('[Socket] 已连接')
  })

  socket.on('disconnect', () => {
    console.log('[Socket] 已断开')
  })

  socket.on('connect_error', (err) => {
    console.error('[Socket] 连接错误:', err.message)
  })

  return socket
}

/**
 * 获取 Socket 实例
 */
export function getSocket() {
  if (!socket) {
    return connectSocket()
  }
  return socket
}

/**
 * 加入房间（Socket 层面）
 * @param {string} roomId - 房间 ID
 */
export function joinRoomSocket(roomId) {
  const s = getSocket()
  s.emit('room:join', { roomId })
}

/**
 * 离开房间
 * @param {string} roomId - 房间 ID
 */
export function leaveRoomSocket(roomId) {
  const s = getSocket()
  s.emit('room:leave', { roomId })
}

/**
 * 发送准备状态
 * @param {string} roomId - 房间 ID
 * @param {boolean} ready - 是否准备
 */
export function emitReady(roomId, ready) {
  const s = getSocket()
  s.emit('player:ready', { roomId, ready })
}

/**
 * 广播角色已分配
 */
export function emitRolesAssigned(roomId) {
  const s = getSocket()
  s.emit('room:rolesAssigned', { roomId })
}

/**
 * 广播游戏开始
 */
export function emitGameStart(roomId) {
  const s = getSocket()
  s.emit('game:start', { roomId })
}

/**
 * 广播阶段变更
 */
export function emitPhaseChange(roomId, phaseIdx) {
  const s = getSocket()
  s.emit('game:phaseChange', { roomId, phaseIdx })
}

/**
 * 发送投票
 */
export function emitVote(roomId, targetRoleId) {
  const s = getSocket()
  s.emit('game:vote', { roomId, targetRoleId })
}

/**
 * 广播线索翻看
 */
export function emitClueRevealed(roomId, clueId) {
  const s = getSocket()
  s.emit('game:clueRevealed', { roomId, clueId })
}

/**
 * 广播游戏结束
 */
export function emitGameEnd(roomId) {
  const s = getSocket()
  s.emit('game:end', { roomId })
}

// ===== 事件监听 =====

/**
 * 监听房间状态更新
 */
export function onRoomState(callback) {
  const s = getSocket()
  s.on('room:state', callback)
  return () => s.off('room:state', callback)
}

/**
 * 监听角色分配完成
 */
export function onRolesAssigned(callback) {
  const s = getSocket()
  s.on('room:rolesAssigned', callback)
  return () => s.off('room:rolesAssigned', callback)
}

/**
 * 监听游戏开始
 */
export function onGameStarted(callback) {
  const s = getSocket()
  s.on('game:started', callback)
  return () => s.off('game:started', callback)
}

/**
 * 监听阶段变更
 */
export function onPhaseChanged(callback) {
  const s = getSocket()
  s.on('game:phaseChanged', callback)
  return () => s.off('game:phaseChanged', callback)
}

/**
 * 监听投票更新
 */
export function onVoteUpdate(callback) {
  const s = getSocket()
  s.on('game:voteUpdate', callback)
  return () => s.off('game:voteUpdate', callback)
}

/**
 * 监听投票结果
 */
export function onVoteResult(callback) {
  const s = getSocket()
  s.on('game:voteResult', callback)
  return () => s.off('game:voteResult', callback)
}

/**
 * 监听游戏结束
 */
export function onGameEnded(callback) {
  const s = getSocket()
  s.on('game:ended', callback)
  return () => s.off('game:ended', callback)
}

/**
 * 断开 Socket 连接
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}