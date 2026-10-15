import { Router } from 'express'
import { queryAll, queryOne } from '../db/index.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

// 获取剧本列表（公开，支持筛选）
router.get('/', async (req, res) => {
  const { tag, players, search, difficulty } = req.query

  let sql = `SELECT id, title, cover, difficulty, player_count, duration, tags, synopsis FROM scripts WHERE 1=1`
  const params = []
  let idx = 1

  if (search) {
    sql += ` AND (title ILIKE $${idx} OR synopsis ILIKE $${idx})`
    params.push(`%${search}%`)
    idx++
  }
  if (tag) {
    sql += ` AND tags @> $${idx}::jsonb`
    params.push(JSON.stringify([tag]))
    idx++
  }
  if (players) {
    sql += ` AND player_count = $${idx}`
    params.push(parseInt(players))
    idx++
  }
  if (difficulty) {
    sql += ` AND difficulty = $${idx}`
    params.push(parseInt(difficulty))
    idx++
  }

  sql += ` ORDER BY created_at ASC`

  const scripts = await queryAll(sql, params)

  // 转为前端期望的 camelCase
  res.json({
    scripts: scripts.map(s => ({
      id: s.id,
      title: s.title,
      cover: s.cover,
      difficulty: s.difficulty,
      playerCount: s.player_count,
      duration: s.duration,
      tags: s.tags,
      synopsis: s.synopsis,
    })),
  })
})

// 获取剧本详情（公开）
// 注意：不返回 roles 中的 secret 和 isKiller，仅返回公开信息
router.get('/:id', async (req, res) => {
  const { id } = req.params

  const script = await queryOne('SELECT * FROM scripts WHERE id = $1', [id])
  if (!script) {
    return res.status(404).json({ error: '剧本不存在' })
  }

  // 公开角色信息（去掉 secret 和 isKiller）
  const publicRoles = (script.roles || []).map(r => ({
    id: r.id,
    name: r.name,
    avatar: r.avatar,
    gender: r.gender,
    age: r.age,
    occupation: r.occupation,
    intro: r.intro,
  }))

  res.json({
    script: {
      id: script.id,
      title: script.title,
      cover: script.cover,
      difficulty: script.difficulty,
      playerCount: script.player_count,
      duration: script.duration,
      tags: script.tags,
      synopsis: script.synopsis,
      background: script.background,
      roles: publicRoles,
      clues: script.clues,
      phases: script.phases,
    },
  })
})

// 获取我分配到的角色（含 secret/isKiller，需登录）
// 通过房间 id 查找该用户被分配的角色
router.get('/:id/my-role', authRequired, async (req, res) => {
  const { id: scriptId } = req.params
  const userId = req.user.id

  // 查找该用户在当前剧本进行中的房间里分配的角色
  const player = await queryOne(
    `SELECT rp.role_id, r.code, r.status
     FROM room_players rp
     JOIN rooms r ON rp.room_id = r.id
     WHERE rp.user_id = $1 AND r.script_id = $2 AND r.status IN ('waiting', 'playing')
     ORDER BY r.updated_at DESC
     LIMIT 1`,
    [userId, scriptId]
  )

  if (!player || !player.role_id) {
    return res.json({ role: null })
  }

  // 从剧本中找到角色完整信息（含 secret）
  const script = await queryOne('SELECT roles FROM scripts WHERE id = $1', [scriptId])
  if (!script) {
    return res.status(404).json({ error: '剧本不存在' })
  }

  const role = (script.roles || []).find(r => r.id === player.role_id)
  if (!role) {
    return res.json({ role: null })
  }

  res.json({
    role,
    roomCode: player.code,
    roomStatus: player.status,
  })
})

// 获取揭晓阶段的完整角色信息（含 isKiller，需登录）
// 仅在游戏处于 playing/finished 状态且到达 reveal 阶段时可用
router.get('/:id/reveal', authRequired, async (req, res) => {
  const { id: scriptId } = req.params
  const userId = req.user.id

  // 查找该用户在当前剧本的房间
  const player = await queryOne(
    `SELECT rp.role_id, r.id as room_id, r.status, r.current_phase
     FROM room_players rp
     JOIN rooms r ON rp.room_id = r.id
     WHERE rp.user_id = $1 AND r.script_id = $2 AND r.status IN ('playing', 'finished')
     ORDER BY r.updated_at DESC
     LIMIT 1`,
    [userId, scriptId]
  )

  if (!player) {
    return res.status(403).json({ error: '你不在进行中的游戏中' })
  }

  const script = await queryOne('SELECT roles, phases FROM scripts WHERE id = $1', [scriptId])
  if (!script) {
    return res.status(404).json({ error: '剧本不存在' })
  }

  const phases = script.phases || []
  const currentPhase = phases[player.current_phase]
  const isRevealPhase = currentPhase?.type === 'reveal' || player.status === 'finished'

  if (!isRevealPhase) {
    return res.status(403).json({ error: '尚未到达揭晓阶段' })
  }

  // 返回所有角色的 isKiller 信息（不含 secret，保护其他玩家隐私）
  const revealRoles = (script.roles || []).map(r => ({
    id: r.id,
    name: r.name,
    avatar: r.avatar,
    isKiller: !!r.isKiller,
  }))

  res.json({ roles: revealRoles })
})

export default router