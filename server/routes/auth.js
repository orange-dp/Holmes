import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { queryOne } from '../db/index.js'
import { signToken, authRequired } from '../middleware/auth.js'

const router = Router()

// 注册
router.post('/register', async (req, res) => {
  const { username, password, nickname } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' })
  }
  if (username.length < 2 || username.length > 20) {
    return res.status(400).json({ error: '用户名长度 2-20 个字符' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少 6 位' })
  }

  // 检查用户名是否已存在
  const existing = await queryOne('SELECT id FROM users WHERE username = $1', [username])
  if (existing) {
    return res.status(409).json({ error: '用户名已存在' })
  }

  const hash = bcrypt.hashSync(password, 10)
  const user = await queryOne(
    `INSERT INTO users (username, password, nickname)
     VALUES ($1, $2, $3)
     RETURNING id, username, nickname, avatar`,
    [username, hash, nickname || username]
  )

  const token = signToken({ id: user.id, username: user.username })
  res.json({ token, user })
})

// 登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' })
  }

  const user = await queryOne('SELECT * FROM users WHERE username = $1', [username])
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  const token = signToken({ id: user.id, username: user.username })
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
    },
  })
})

// 获取当前用户信息
router.get('/me', authRequired, async (req, res) => {
  const user = await queryOne(
    'SELECT id, username, nickname, avatar FROM users WHERE id = $1',
    [req.user.id]
  )
  if (!user) {
    return res.status(404).json({ error: '用户不存在' })
  }
  res.json({ user })
})

// 更新昵称
router.put('/profile', authRequired, async (req, res) => {
  const { nickname } = req.body
  if (!nickname) {
    return res.status(400).json({ error: '昵称不能为空' })
  }

  const user = await queryOne(
    `UPDATE users SET nickname = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, username, nickname, avatar`,
    [nickname, req.user.id]
  )
  res.json({ user })
})

export default router