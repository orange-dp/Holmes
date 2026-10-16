/**
 * 房间相关 API
 */
import { get, post } from './client.js'

/**
 * 创建房间
 * @param {string} scriptId - 剧本 ID
 */
export function createRoom(scriptId) {
  return post('/rooms', { scriptId })
}

/**
 * 通过房间码获取房间
 * @param {string} code - 房间码
 */
export function getRoomByCode(code) {
  return get(`/rooms/code/${code}`)
}

/**
 * 获取房间详情
 * @param {string} roomId - 房间 ID
 */
export function getRoom(roomId) {
  return get(`/rooms/${roomId}`)
}

/**
 * 查询当前用户正在进行的房间（刷新后恢复用）
 */
export function getMyActiveRoom() {
  return get('/rooms/active/mine')
}

/**
 * 加入房间
 * @param {string} roomId - 房间 ID
 */
export function joinRoom(roomId) {
  return post(`/rooms/${roomId}/join`)
}

/**
 * 切换准备状态
 * @param {string} roomId - 房间 ID
 * @param {boolean} ready - 是否准备
 */
export function toggleReady(roomId, ready) {
  return post(`/rooms/${roomId}/ready`, { ready })
}

/**
 * 分配角色（仅房主）
 * @param {string} roomId - 房间 ID
 */
export function assignRoles(roomId) {
  return post(`/rooms/${roomId}/assign-roles`)
}

/**
 * 开始游戏（仅房主）
 * @param {string} roomId - 房间 ID
 */
export function startGame(roomId) {
  return post(`/rooms/${roomId}/start`)
}

/**
 * 推进/回退阶段（仅房主）
 * @param {string} roomId - 房间 ID
 * @param {string} action - 'next' | 'prev'
 */
export function changePhase(roomId, action) {
  return post(`/rooms/${roomId}/phase`, { action })
}

/**
 * 结束游戏（仅房主）
 * @param {string} roomId - 房间 ID
 */
export function endGame(roomId) {
  return post(`/rooms/${roomId}/end`)
}

/**
 * 离开房间
 * @param {string} roomId - 房间 ID
 */
export function leaveRoom(roomId) {
  return post(`/rooms/${roomId}/leave`)
}

/**
 * 获取我的游戏历史
 */
export function getMyHistory() {
  return get('/rooms/history/mine')
}