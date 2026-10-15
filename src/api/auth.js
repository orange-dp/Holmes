/**
 * 认证相关 API
 */
import { get, post, put } from './client.js'

/**
 * 注册
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} nickname - 昵称（可选）
 */
export function register(username, password, nickname) {
  return post('/auth/register', { username, password, nickname })
}

/**
 * 登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 */
export function login(username, password) {
  return post('/auth/login', { username, password })
}

/**
 * 获取当前用户信息
 */
export function getMe() {
  return get('/auth/me')
}

/**
 * 更新昵称
 * @param {string} nickname - 新昵称
 */
export function updateNickname(nickname) {
  return put('/auth/profile', { nickname })
}