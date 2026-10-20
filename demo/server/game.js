// 游戏状态管理 + Socket 事件处理
import { script } from './script.js'

// 行动消耗表（系统级常量）
const ACTION_COST = {
  move: 1,
  search: 2,
  talk: 1,
  exchange: 0,
  lock: 0,
  useItem: 1,
}

// === 时钟计算 ===
// 将时段索引转换为 HH:MM 格式
export function segmentToClock(segment) {
  const [startH, startM] = script.clockStart.split(':').map(Number)
  const totalMinutes = startH * 60 + startM + segment * script.segmentDuration
  const h = Math.floor(totalMinutes / 60) % 24
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// 案发时间
export function getMurderTime() {
  return segmentToClock(script.murderSegment)
}

// 游戏实例（demo 单房间）
let game = null

// 事件日志
let eventLog = []

export function createGame() {
  // 初始化物体状态
  const objects = {}
  for (const obj of script.objects) {
    objects[obj.id] = { ...obj, searchedBy: null }
  }

  // 初始化道具状态（哪个道具在哪）
  const itemLocations = {}
  for (const item of script.items) {
    itemLocations[item.id] = { type: 'object', objectId: findObjectIdByGives(item.id) }
  }

  // 初始化角色任务状态
  const characterTasks = {}
  for (const char of script.characters) {
    characterTasks[char.id] = char.tasks.map(t => ({ ...t, status: 'pending' }))
  }

  game = {
    phase: 'p2_free', // p2_free | p3_discussion | p6_vote | p7_reveal
    segment: 0, // 全局时段（用于案发判定）
    players: {}, // socketId -> player state
    objects,
    itemLocations, // itemId -> { type: 'object'|'player'|'room', objectId/playerId/roomId }
    characterTasks,
    visitedRooms: {}, // playerId -> Set of roomIds
    murdered: false, // 案件是否已发生
    bodyDiscovered: false,
    bodyDiscoveredBy: null,
    doors: {}, // roomId -> { locked: bool }
    eventLog: [],
  }

  // 王管家初始持有书房钥匙
  game.itemLocations['key_study'] = { type: 'player', characterId: 'wang_guanjia' }

  eventLog = []
  return game
}

function findObjectIdByGives(itemId) {
  const obj = script.objects.find(o => o.gives === itemId)
  return obj ? obj.id : null
}

export function joinGame(socketId, characterId, playerName) {
  if (!game) createGame()

  const character = script.characters.find(c => c.id === characterId)
  if (!character) return null

  // 检查角色是否已被占用
  const existing = Object.values(game.players).find(p => p.characterId === characterId)
  if (existing) return null

  game.players[socketId] = {
    socketId,
    characterId,
    characterName: character.name,
    color: character.color,
    playerName,
    isMurderer: character.isMurderer,
    secret: character.secret,
    location: character.startLocation,
    segment: 0, // 玩家当前时段
    inventory: [], // 道具栏
    notes: [], // 信息笔记
    visitedRooms: new Set([character.startLocation]),
    unlockedEdges: new Set(), // 已解锁的隐蔽路径
  }

  // 如果是王管家，初始持有钥匙
  if (characterId === 'wang_guanjia') {
    game.players[socketId].inventory.push('key_study')
  }

  return game.players[socketId]
}

export function leaveGame(socketId) {
  if (!game || !game.players[socketId]) return
  delete game.players[socketId]
}

// 获取相邻位置（过滤未解锁的隐蔽路径）
function getNeighbors(nodeId, player) {
  const neighbors = []
  for (const edge of script.edges) {
    const isArr = Array.isArray(edge)
    const a = isArr ? edge[0] : edge.from
    const b = isArr ? edge[1] : edge.to
    const hidden = !isArr && edge.hidden
    // 隐蔽路径需要玩家已解锁才能通行
    if (hidden && player) {
      const edgeKey = `${a}__${b}`
      const edgeKeyRev = `${b}__${a}`
      if (!player.unlockedEdges.has(edgeKey) && !player.unlockedEdges.has(edgeKeyRev)) {
        continue
      }
    }
    if (a === nodeId) neighbors.push(b)
    if (b === nodeId) neighbors.push(a)
  }
  return neighbors
}

// 检查相遇
function checkMeetings(socketId) {
  const player = game.players[socketId]
  if (!player) return []

  const meetings = []
  for (const [sid, other] of Object.entries(game.players)) {
    if (sid === socketId) continue
    // 同一位置 + 时段重叠
    if (other.location === player.location) {
      meetings.push({
        characterId: other.characterId,
        characterName: other.characterName,
        location: player.location,
        yourSegment: player.segment,
        otherSegment: other.segment,
      })
    }
  }
  return meetings
}

// 检查案发
function checkMurder() {
  if (game.murdered) return false
  // 检查是否有玩家时段推进到了案发时段
  for (const player of Object.values(game.players)) {
    if (player.segment >= script.murderSegment) {
      game.murdered = true
      return true
    }
  }
  return false
}

// 检查尸体发现
function checkBodyDiscovery(socketId) {
  if (game.bodyDiscovered) return false
  const player = game.players[socketId]
  if (!player) return false
  if (player.location !== script.murderRoom) return false
  if (!game.murdered) return false

  // 检查发现触发器——demo 中简化为：进入案发房间 + 搜索尸体物体
  // 或者直接进入即可发现（根据剧本配置，demo 先用"搜索尸体物体"）
  return false // 发现逻辑在 searchObject 中处理
}

// 检查任务完成
function checkTasks(socketId) {
  const player = game.players[socketId]
  if (!player) return []
  const tasks = game.characterTasks[player.characterId]
  if (!tasks) return []

  const updated = []
  for (const task of tasks) {
    if (task.status !== 'pending') continue
    const cond = task.completeCondition
    let completed = false

    if (cond.type === 'hasItem') {
      completed = player.inventory.includes(cond.itemId)
    } else if (cond.type === 'searchedObject') {
      const obj = game.objects[cond.objectId]
      completed = obj && obj.searchedBy === socketId
    } else if (cond.type === 'visitedRooms') {
      completed = cond.roomIds.every(r => player.visitedRooms.has(r))
    } else if (cond.type === 'usedItemAt') {
      // 检查是否在指定位置使用了指定道具
      completed = player._usedItems && player._usedItems.some(
        u => u.itemId === cond.itemId && u.location === cond.location
      )
    }

    if (completed) {
      task.status = 'completed'
      updated.push(task)
    }

    // 检查条件破坏（道具不再可得等）
    // 简化：不主动检测破坏，玩家通过搜索自然发现
  }
  return updated
}

// === 游戏状态快照（发送给客户端） ===
export function getGameState(socketId) {
  if (!game || !game.players[socketId]) return null
  const player = game.players[socketId]

  // 同位置玩家
  const sameLocationPlayers = Object.values(game.players)
    .filter(p => p.socketId !== socketId && p.location === player.location)
    .map(p => ({ characterId: p.characterId, characterName: p.characterName, color: p.color }))

  // 当前房间物体
  const roomObjects = Object.values(game.objects)
    .filter(o => o.room === player.location)
    .map(o => ({
      id: o.id, name: o.name, searched: o.searchedBy !== null,
      searchedByMe: o.searchedBy === socketId,
      requires: o.requires || null,
    }))

  // 相邻位置（过滤未解锁隐蔽路径）
  const neighbors = getNeighbors(player.location, player)

  // 道具详情
  const inventoryItems = player.inventory.map(id => {
    const item = script.items.find(i => i.id === id)
    return item ? { id: item.id, name: item.name, type: item.type, description: item.description } : null
  }).filter(Boolean)

  // 笔记
  const notes = player.notes.map(id => {
    const item = script.items.find(i => i.id === id)
    return item ? { id: item.id, name: item.name, description: item.description } : null
  }).filter(Boolean)

  // 任务
  const tasks = (game.characterTasks[player.characterId] || []).map(t => ({
    id: t.id, name: t.name, status: t.status,
  }))

  return {
    phase: game.phase,
    player: {
      characterId: player.characterId,
      characterName: player.characterName,
      color: player.color,
      isMurderer: player.isMurderer,
      secret: player.secret,
      location: player.location,
      segment: player.segment,
      totalSegments: script.totalSegments,
      // 时钟数据：只传起始时间和段长，前端自行计算表盘角度
      clockStart: script.clockStart,
      segmentDuration: script.segmentDuration,
    },
    sameLocationPlayers,
    roomObjects,
    neighbors,
    inventory: inventoryItems,
    notes,
    tasks,
    bodyDiscovered: game.bodyDiscovered,
    eventLog: game.eventLog.slice(-20),
    nodes: script.nodes,
    edges: script.edges,
    grid: script.grid,
    floors: [1, 2], // 可用楼层
    visitedRooms: [...player.visitedRooms],
    unlockedEdges: [...player.unlockedEdges], // 已解锁的隐蔽路径
  }
}

// === 行动处理 ===
export function handleAction(socketId, action) {
  if (!game || !game.players[socketId]) return { error: '未加入游戏' }
  const player = game.players[socketId]

  const result = { events: [] }

  switch (action.type) {
    case 'move': {
      const target = action.target
      const neighbors = getNeighbors(player.location, player)
      if (!neighbors.includes(target)) {
        return { error: '无法到达该位置' }
      }
      // 检查目标是否上锁
      const door = game.doors[target]
      if (door && door.locked) {
        // 检查是否有钥匙
        if (!player.inventory.includes('key_study')) {
          return { error: '门已上锁，需要钥匙' }
        }
      }
      const oldLocation = player.location
      player.location = target
      player.segment += ACTION_COST.move
      player.visitedRooms.add(target)
      result.events.push({ type: 'move', from: oldLocation, to: target, cost: ACTION_COST.move })

      // 检查相遇
      const meetings = checkMeetings(socketId)
      if (meetings.length > 0) {
        result.events.push({ type: 'meeting', meetings })
      }

      // 检查案发
      if (checkMurder()) {
        result.events.push({ type: 'murder_occurred' })
      }
      break
    }

    case 'search': {
      const obj = game.objects[action.objectId]
      if (!obj) return { error: '物体不存在' }
      if (obj.room !== player.location) return { error: '不在该物体所在房间' }
      if (obj.searchedBy) return { error: '已被搜索过' }

      // 检查搜索条件
      if (obj.requires) {
        if (obj.requires.type === 'key' && !player.inventory.includes(obj.requires.itemId)) {
          return { error: '需要特定钥匙才能搜索' }
        }
      }

      obj.searchedBy = socketId
      player.segment += ACTION_COST.search
      result.events.push({ type: 'search', object: obj.name, cost: ACTION_COST.search })

      // 尸体发现
      if (obj.isBody && game.murdered && !game.bodyDiscovered) {
        game.bodyDiscovered = true
        game.bodyDiscoveredBy = socketId
        game.phase = 'p3_discussion'
        result.events.push({ type: 'body_discovered', discoverer: player.characterName })
        // 广播全局事件
        game.eventLog.push({ type: 'body_discovered', text: `${player.characterName} 在书房发现了李老爷的尸体！`, timestamp: Date.now() })
        break
      }

      // 获得道具
      if (obj.gives) {
        const item = script.items.find(i => i.id === obj.gives)
        if (item) {
          if (item.type === 'info') {
            // 信息类：记录到笔记
            if (!player.notes.includes(item.id)) {
              player.notes.push(item.id)
            }
            result.events.push({ type: 'found_info', item: { id: item.id, name: item.name, description: item.description } })
          } else {
            // 实体道具：加入背包
            if (!player.inventory.includes(item.id)) {
              player.inventory.push(item.id)
            }
            game.itemLocations[item.id] = { type: 'player', playerId: socketId }
            result.events.push({ type: 'found_item', item: { id: item.id, name: item.name, type: item.type, description: item.description } })
          }
        }
      } else {
        result.events.push({ type: 'search_empty', object: obj.name })
      }

      // 检查隐蔽路径解锁
      for (const edge of script.edges) {
        if (Array.isArray(edge) || !edge.hidden || !edge.unlockBy) continue
        if (edge.unlockBy.type === 'searchedObject' && edge.unlockBy.objectId === action.objectId) {
          const edgeKey = `${edge.from}__${edge.to}`
          if (!player.unlockedEdges.has(edgeKey)) {
            player.unlockedEdges.add(edgeKey)
            result.events.push({ type: 'hidden_path_unlocked', from: edge.from, to: edge.to })
          }
        }
      }

      // 检查案发（搜索也推进时段）
      if (checkMurder()) {
        result.events.push({ type: 'murder_occurred' })
      }
      break
    }

    case 'useItem': {
      const itemId = action.itemId
      if (!player.inventory.includes(itemId)) {
        return { error: '没有该道具' }
      }
      const item = script.items.find(i => i.id === itemId)
      if (!item) return { error: '道具不存在' }

      // 记录使用（用于任务检测）
      if (!player._usedItems) player._usedItems = []
      player._usedItems.push({ itemId, location: player.location, segment: player.segment })
      player.segment += ACTION_COST.useItem
      result.events.push({ type: 'useItem', item: item.name, location: player.location, cost: ACTION_COST.useItem })

      // 检查案发
      if (checkMurder()) {
        result.events.push({ type: 'murder_occurred' })
      }
      break
    }

    case 'dropItem': {
      const itemId = action.itemId
      if (!player.inventory.includes(itemId)) {
        return { error: '没有该道具' }
      }
      player.inventory = player.inventory.filter(id => id !== itemId)
      game.itemLocations[itemId] = { type: 'room', roomId: player.location }
      result.events.push({ type: 'dropItem', item: script.items.find(i => i.id === itemId)?.name, location: player.location })
      break
    }

    case 'giveItem': {
      const itemId = action.itemId
      const targetSocketId = action.targetSocketId
      if (!player.inventory.includes(itemId)) {
        return { error: '没有该道具' }
      }
      const target = game.players[targetSocketId]
      if (!target || target.location !== player.location) {
        return { error: '目标不在同一位置' }
      }
      player.inventory = player.inventory.filter(id => id !== itemId)
      target.inventory.push(itemId)
      game.itemLocations[itemId] = { type: 'player', playerId: targetSocketId }
      result.events.push({
        type: 'giveItem',
        item: script.items.find(i => i.id === itemId)?.name,
        from: player.characterName,
        to: target.characterName,
      })
      break
    }

    case 'lock': {
      const roomId = player.location
      // 简化：持有书房钥匙可以锁书房
      if (player.inventory.includes('key_study')) {
        game.doors[roomId] = { locked: !game.doors[roomId]?.locked }
        result.events.push({ type: 'lock', room: roomId, locked: game.doors[roomId].locked })
      } else {
        return { error: '没有钥匙，无法上锁/解锁' }
      }
      break
    }

    default:
      return { error: '未知行动' }
  }

  // 检查任务完成
  const taskUpdates = checkTasks(socketId)
  if (taskUpdates.length > 0) {
    result.events.push({ type: 'task_completed', tasks: taskUpdates.map(t => t.name) })
  }

  // 记录事件到全局日志
  for (const evt of result.events) {
    if (evt.type === 'move') {
      // 移动不记录到全局日志（其他玩家不应知道）
    } else if (evt.type === 'body_discovered') {
      // 已在上面记录
    }
  }

  return result
}

export function getGame() { return game }
export function getPlayers() { return game ? game.players : {} }