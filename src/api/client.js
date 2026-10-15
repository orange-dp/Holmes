/**
 * HTTP 请求客户端
 * 封装 fetch，自动处理 JWT token、JSON 序列化、错误处理
 */

const BASE_URL = '/api'

/**
 * 获取 localStorage 中的 token
 */
export function getToken() {
  return localStorage.getItem('token')
}

/**
 * 设置 token
 */
export function setToken(token) {
  if (token) {
    localStorage.setItem('token', token)
  } else {
    localStorage.removeItem('token')
  }
}

/**
 * 统一请求方法
 */
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(url, {
      ...options,
      headers,
    })
  } catch (err) {
    throw new Error('网络连接失败，请检查网络')
  }

  // 尝试解析 JSON
  let data
  try {
    data = await response.json()
  } catch {
    data = null
  }

  // 处理未授权
  if (response.status === 401) {
    setToken(null)
    throw new Error(data?.error || '未登录或登录已过期')
  }

  // 处理其他错误
  if (!response.ok) {
    throw new Error(data?.error || `请求失败 (${response.status})`)
  }

  return data
}

/**
 * GET 请求
 */
export function get(path, params) {
  let url = path
  if (params) {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, value)
      }
    })
    const qs = search.toString()
    if (qs) url += `?${qs}`
  }
  return request(url, { method: 'GET' })
}

/**
 * POST 请求
 */
export function post(path, body) {
  return request(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * PUT 请求
 */
export function put(path, body) {
  return request(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * DELETE 请求
 */
export function del(path) {
  return request(path, { method: 'DELETE' })
}