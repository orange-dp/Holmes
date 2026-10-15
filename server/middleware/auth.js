import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'holmes-dev-secret-2026'
const JWT_EXPIRES = '7d'

// 生成 JWT token
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

// 验证 JWT 中间件
export function authRequired(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录，请先登录' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '登录已过期，请重新登录' })
    }
    return res.status(401).json({ error: '无效的登录凭证' })
  }
}

// 可选认证：有 token 就解析，没有也放行（用于公开接口中获取当前用户）
export function authOptional(req, res, next) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      req.user = jwt.verify(token, JWT_SECRET)
    } catch {
      // 忽略错误，继续放行
    }
  }
  next()
}

export { JWT_SECRET }