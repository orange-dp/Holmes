import { Router } from 'express'
import { query, queryOne, queryAll } from '../db/index.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

// 生成 6 位房间码
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

async function getUniqueRoomCode() {
  let code
  let attempts = 0
  do {
    code = generateRoomCode()
    const existing = await queryOne('SELECT id FROM rooms WHERE code = $1', [code])
    if (!existing) return code
    attempts++
  } while (attempts < 10)
  throw new Error('生成房间码失败')
}

// 构建房间完整状态（含玩家列表、剧本信息）
async function buildRoomState(roomId) {
  const room = await queryOne(
    `SELECT r.*, s.title as script_title, s.player_count, s.roles, s.phases
     FROM rooms r
     JOIN scripts s ON r.script_id = s.id
     WHERE r.id = $1`,
    [roomId]
  )
  if (!room) return null

  const players = await queryAll(
    `SELECT rp.user_id, rp.role_id, rp.is_ready, u.username, u.nickname, u.avatar
     FROM room_players rp
     JOIN users u ON rp.user_id = u.id
     WHERE rp.room_id = $1
     ORDER BY rp.joined_at ASC`,
    [roomId]
  )

  // 玩家的角色信息仅返回公开部分（不含 secret/isKiller）
  const roles = room.roles || []
  const playersWithRoles = players.map(p => {
    const role = roles.find(r => r.id === p.role_id)
    return {
      userId: p.user_id,
      username: p.username,
      nickname: p.nickname || p.username,
      avatar: p.avatar,
      isReady: p.is_ready,
      roleId: p.role_id,
      roleName: role ? role.name : null,
      roleAvatar: role ? role.avatar : null,
    }
  })

  return {
    id: room.id,
    code: room.code,
    scriptId: room.script_id,
    scriptTitle: room.script_title,
    playerCount: room.player_count,
    status: room.status,
    currentPhase: room.current_phase,
    hostId: room.host_id,
    phases: room.phases,
    players: playersWithRoles,
  }
}

// 创建房间
router.post('/', authRequired, async (req, res) => {
  const { scriptId } = req.body
  if (!scriptId) {
    return res.status(400).json({ error: '请选择剧本' })
  }

  // 检查剧本是否存在
  const script = await queryOne('SELECT id, player_count FROM scripts WHERE id = $1', [scriptId])
  if (!script) {
    return res.status(404).json({ error: '剧本不存在' })
  }

  const code = await getUniqueRoomCode()

  const room = await queryOne(
    `INSERT INTO rooms (code, script_id, host_id)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [code, scriptId, req.user.id]
  )

  // 房主自动加入房间
  await query(
    `INSERT INTO room_players (room_id, user_id, is_ready) VALUES ($1, $2, true)`,
    [room.id, req.user.id]
  )

  const roomState = await buildRoomState(room.id)
  res.json({ room: roomState })
})

// 通过房间码获取房间
router.get('/code/:code', authRequired, async (req, res) => {
  const { code } = req.params

  const room = await queryOne('SELECT id FROM rooms WHERE code = $1', [code.toUpperCase()])
  if (!room) {
    return res.status(404).json({ error: '房间不存在' })
  }

  const roomState = await buildRoomState(room.id)
  res.json({ room: roomState })
})

// 查询当前用户正在进行的房间（用于刷新后恢复）
router.get('/active/mine', authRequired, async (req, res) => {
  const room = await queryOne(
    `SELECT r.id FROM rooms r
     JOIN room_players rp ON rp.room_id = r.id
     WHERE rp.user_id = $1 AND r.status IN ('waiting', 'playing')
     ORDER BY r.updated_at DESC
     LIMIT 1`,
    [req.user.id]
  )
  if (!room) {
    return res.json({ room: null })
  }
  const roomState = await buildRoomState(room.id)
  res.json({ room: roomState })
})

// 获取房间详情
router.get('/:id', authRequired, async (req, res) => {
  const roomState = await buildRoomState(req.params.id)
  if (!roomState) {
    return res.status(404).json({ error: '房间不存在' })
  }
  res.json({ room: roomState })
})

// 加入房间
router.post('/:id/join', authRequired, async (req, res) => {
  const roomId = req.params.id

  const room = await queryOne('SELECT * FROM rooms WHERE id = $1', [roomId])
  if (!room) {
    return res.status(404).json({ error: '房间不存在' })
  }
  if (room.status !== 'waiting') {
    return res.status(400).json({ error: '游戏已开始，无法加入' })
  }

  // 检查是否已加入 —— 已在房间则直接返回房间状态（支持刷新后重新进入）
  const existing = await queryOne(
    'SELECT id FROM room_players WHERE room_id = $1 AND user_id = $2',
    [roomId, req.user.id]
  )
  if (existing) {
    const roomState = await buildRoomState(roomId)
    return res.json({ room: roomState })
  }

  // 检查人数
  const players = await queryAll(
    'SELECT user_id FROM room_players WHERE room_id = $1',
    [roomId]
  )
  const script = await queryOne('SELECT player_count FROM scripts WHERE id = $1', [room.script_id])
  if (players.length >= script.player_count) {
    return res.status(400).json({ error: '房间已满' })
  }

  await query(
    `INSERT INTO room_players (room_id, user_id, is_ready) VALUES ($1, $2, false)`,
    [roomId, req.user.id]
  )

  const roomState = await buildRoomState(roomId)
  res.json({ room: roomState })
})

// 切换准备状态
router.post('/:id/ready', authRequired, async (req, res) => {
  const roomId = req.params.id
  const { ready } = req.body

  const player = await queryOne(
    'SELECT * FROM room_players WHERE room_id = $1 AND user_id = $2',
    [roomId, req.user.id]
  )
  if (!player) {
    return res.status(400).json({ error: '你不在该房间中' })
  }

  await query(
    'UPDATE room_players SET is_ready = $1 WHERE room_id = $2 AND user_id = $3',
    [ready !== false, roomId, req.user.id]
  )

  const roomState = await buildRoomState(roomId)
  res.json({ room: roomState })
})

// 分配角色（仅房主）
router.post('/:id/assign-roles', authRequired, async (req, res) => {
  const roomId = req.params.id

  const room = await queryOne('SELECT * FROM rooms WHERE id = $1', [roomId])
  if (!room) {
    return res.status(404).json({ error: '房间不存在' })
  }
  if (room.host_id !== req.user.id) {
    return res.status(403).json({ error: '只有房主可以分配角色' })
  }
  if (room.status !== 'waiting') {
    return res.status(400).json({ error: '角色已分配' })
  }

  const players = await queryAll(
    'SELECT user_id FROM room_players WHERE room_id = $1 ORDER BY joined_at ASC',
    [roomId]
  )
  const script = await queryOne('SELECT player_count, roles FROM scripts WHERE id = $1', [room.script_id])

  if (players.length < 2) {
    return res.status(400).json({ error: '至少需要 2 名玩家' })
  }

  // 随机打乱角色
  const shuffledRoles = [...script.roles].sort(() => Math.random() - 0.5)

  // 为每个玩家分配角色
  for (let i = 0; i < players.length; i++) {
    await query(
      'UPDATE room_players SET role_id = $1 WHERE room_id = $2 AND user_id = $3',
      [shuffledRoles[i].id, roomId, players[i].user_id]
    )
  }

  const roomState = await buildRoomState(roomId)
  res.json({ room: roomState })
})

// 开始游戏（房主操作）
router.post('/:id/start', authRequired, async (req, res) => {
  const roomId = req.params.id

  const room = await queryOne('SELECT * FROM rooms WHERE id = $1', [roomId])
  if (!room) {
    return res.status(404).json({ error: '房间不存在' })
  }
  if (room.host_id !== req.user.id) {
    return res.status(403).json({ error: '只有房主可以开始游戏' })
  }
  if (room.status !== 'waiting') {
    return res.status(400).json({ error: '游戏已在进行中' })
  }

  // 检查所有人已准备
  const notReady = await queryOne(
    'SELECT COUNT(*) as cnt FROM room_players WHERE room_id = $1 AND is_ready = false',
    [roomId]
  )
  if (parseInt(notReady.cnt) > 0) {
    return res.status(400).json({ error: '还有玩家未准备' })
  }

  // 检查角色已分配
  const unassigned = await queryOne(
    'SELECT COUNT(*) as cnt FROM room_players WHERE room_id = $1 AND role_id IS NULL',
    [roomId]
  )
  if (parseInt(unassigned.cnt) > 0) {
    return res.status(400).json({ error: '还有玩家未分配角色' })
  }

  await query(
    `UPDATE rooms SET status = 'playing', current_phase = 0, updated_at = NOW() WHERE id = $1`,
    [roomId]
  )

  // 创建游戏记录
  await query(
    `INSERT INTO game_sessions (room_id, script_id) VALUES ($1, $2)`,
    [roomId, room.script_id]
  )

  const roomState = await buildRoomState(roomId)
  res.json({ room: roomState })
})

// 推进/回退阶段（仅房主）
router.post('/:id/phase', authRequired, async (req, res) => {
  const roomId = req.params.id
  const { action } = req.body // 'next' | 'prev'

  const room = await queryOne('SELECT * FROM rooms WHERE id = $1', [roomId])
  if (!room) {
    return res.status(404).json({ error: '房间不存在' })
  }
  if (room.host_id !== req.user.id) {
    return res.status(403).json({ error: '只有房主可以控制阶段' })
  }
  if (room.status !== 'playing') {
    return res.status(400).json({ error: '游戏未在进行中' })
  }

  const script = await queryOne('SELECT phases FROM scripts WHERE id = $1', [room.script_id])
  const phases = script.phases || []
  let newPhase = room.current_phase

  if (action === 'next') {
    newPhase = Math.min(room.current_phase + 1, phases.length - 1)
  } else if (action === 'prev') {
    newPhase = Math.max(room.current_phase - 1, 0)
  }

  await query(
    `UPDATE rooms SET current_phase = $1, updated_at = NOW() WHERE id = $2`,
    [newPhase, roomId]
  )

  const roomState = await buildRoomState(roomId)
  res.json({ room: roomState })
})

// 结束游戏
router.post('/:id/end', authRequired, async (req, res) => {
  const roomId = req.params.id

  const room = await queryOne('SELECT * FROM rooms WHERE id = $1', [roomId])
  if (!room) {
    return res.status(404).json({ error: '房间不存在' })
  }
  if (room.host_id !== req.user.id) {
    return res.status(403).json({ error: '只有房主可以结束游戏' })
  }

  await query(
    `UPDATE rooms SET status = 'finished', updated_at = NOW() WHERE id = $1`,
    [roomId]
  )
  await query(
    `UPDATE game_sessions SET ended_at = NOW(), final_phase = $1 WHERE room_id = $2 AND ended_at IS NULL`,
    [room.current_phase, roomId]
  )

  const roomState = await buildRoomState(roomId)
  res.json({ room: roomState })
})

// 离开房间
router.post('/:id/leave', authRequired, async (req, res) => {
  const roomId = req.params.id

  const player = await queryOne(
    'SELECT * FROM room_players WHERE room_id = $1 AND user_id = $2',
    [roomId, req.user.id]
  )
  if (!player) {
    return res.status(400).json({ error: '你不在该房间中' })
  }

  await query('DELETE FROM room_players WHERE room_id = $1 AND user_id = $2', [roomId, req.user.id])

  // 如果是房主离开，转移房主或销毁房间
  const room = await queryOne('SELECT * FROM rooms WHERE id = $1', [roomId])
  if (room && room.host_id === req.user.id) {
    const remaining = await queryOne(
      'SELECT user_id FROM room_players WHERE room_id = $1 ORDER BY joined_at ASC LIMIT 1',
      [roomId]
    )
    if (remaining) {
      await query('UPDATE rooms SET host_id = $1 WHERE id = $2', [remaining.user_id, roomId])
    } else {
      await query('DELETE FROM rooms WHERE id = $1', [roomId])
      return res.json({ room: null })
    }
  }

  const roomState = await buildRoomState(roomId)
  res.json({ room: roomState })
})

// 获取用户的游戏历史
router.get('/history/mine', authRequired, async (req, res) => {
  const userId = req.user.id

  const sessions = await queryAll(
    `SELECT gs.id, gs.started_at, gs.ended_at, gs.winner, gs.final_phase,
            r.code, r.status, s.title as script_title, s.cover as script_cover,
            rp.role_id, s.roles
     FROM game_sessions gs
     JOIN rooms r ON gs.room_id = r.id
     JOIN scripts s ON gs.script_id = s.id
     JOIN room_players rp ON rp.room_id = r.id AND rp.user_id = $1
     WHERE gs.ended_at IS NOT NULL
     ORDER BY gs.ended_at DESC
     LIMIT 20`,
    [userId]
  )

  const history = sessions.map((s) => {
    const role = (s.roles || []).find((r) => r.id === s.role_id)
    const isKiller = role?.isKiller
    // 判断胜负：凶手方 winner='killers'，平民方 winner='civilians'
    let won = null
    if (s.winner) {
      won = (isKiller && s.winner === 'killers') || (!isKiller && s.winner === 'civilians')
    }
    return {
      id: s.id,
      scriptTitle: s.script_title,
      scriptCover: s.script_cover,
      roleName: role?.name || '未知',
      isKiller,
      won,
      winner: s.winner,
      startedAt: s.started_at,
      endedAt: s.ended_at,
    }
  })

  // 统计
  const total = history.length
  const wins = history.filter((h) => h.won === true).length
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0

  res.json({ history, stats: { total, wins, winRate } })
})

export { buildRoomState }
export default router