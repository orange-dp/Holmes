/**
 * 剧本相关 API
 */
import { get } from './client.js'

/**
 * 获取剧本列表（支持筛选）
 * @param {object} filters - 筛选条件 { tag, players, search, difficulty }
 */
export function getScripts(filters = {}) {
  return get('/scripts', filters)
}

/**
 * 获取剧本详情
 * @param {string} id - 剧本 ID
 */
export function getScriptDetail(id) {
  return get(`/scripts/${id}`)
}

/**
 * 获取我在某剧本中分配的角色（含秘密剧本，需登录）
 * @param {string} scriptId - 剧本 ID
 */
export function getMyRole(scriptId) {
  return get(`/scripts/${scriptId}/my-role`)
}

/**
 * 获取揭晓阶段的完整角色信息（含 isKiller，需登录）
 * @param {string} scriptId - 剧本 ID
 */
export function getRevealRoles(scriptId) {
  return get(`/scripts/${scriptId}/reveal`)
}