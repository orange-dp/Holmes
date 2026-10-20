#!/usr/bin/env node
/**
 * 地图自动布局生成器
 *
 * 输入：声明式描述（nodes 无坐标 + edges + grid）
 * 输出：完整 nodes（含 x/y/w/h）+ edges
 *
 * 布局规则：
 * 1. 每层楼一条横贯走廊（y 居中）
 * 2. 房间排列在走廊上方（top）和下方（bottom），与走廊紧贴
 * 3. 楼梯间放在走廊末端，连接上下楼层
 * 4. 同楼层有 edge 连接的房间通过走廊间接连通
 * 5. 隐蔽路径（hidden edge）不参与布局邻接计算，不影响房间排列
 * 6. 间接连接的房间（如花园通过大厅连接走廊）紧贴父房间放置
 *
 * 用法：
 *   const { generateLayout } = require('./map-generator.cjs')
 *   const result = generateLayout(declarativeInput)
 *   // result.nodes → 含坐标的节点数组
 *   // result.edges → 完整边数组
 */

// ─── 布局常量 ──────────────────────────────────────
const CORRIDOR_HEIGHT = 1       // 走廊高度（格）
const ROOM_HEIGHT = 1           // 单排房间高度（格）
const DEFAULT_ROOM_WIDTH = 3    // 默认房间宽度（格）
const CORRIDOR_MARGIN = 2       // 走廊左侧留白（格）
const STAIRCASE_WIDTH = 3       // 楼梯间宽度（格）

// ─── 辅助函数 ──────────────────────────────────────

/**
 * 从 edges 构建邻接表
 * @param {Array} edges - 标准化后的 edges 数组
 * @param {Array} nodes - 节点数组
 * @param {Object} opts - { excludeHidden: 是否排除隐蔽路径 }
 */
function buildAdjacencyList(edges, nodes, opts = {}) {
  const { excludeHidden = false } = opts
  const adj = {}
  for (const n of nodes) adj[n.id] = new Set()
  for (const e of edges) {
    if (excludeHidden && e.hidden) continue
    const [a, b] = parseEdge(e)
    if (adj[a]) adj[a].add(b)
    if (adj[b]) adj[b].add(a)
  }
  return adj
}

/**
 * 解析 edge（兼容数组 ['a','b'] 和对象 {from,to,...}）
 */
function parseEdge(e) {
  if (Array.isArray(e)) return [e[0], e[1]]
  return [e.from, e.to]
}

/**
 * 按楼层分组节点
 */
function groupByFloor(nodes) {
  const floors = {}
  for (const n of nodes) {
    if (!floors[n.floor]) floors[n.floor] = []
    floors[n.floor].push(n)
  }
  return floors
}

// ─── 核心布局算法 ──────────────────────────────────

/**
 * 自动布局生成
 *
 * @param {Object} input - 声明式输入
 * @param {Object} input.grid - { cols, rows, cellSize }
 * @param {Array}  input.nodes - 节点数组（无坐标，含 id/name/type/floor）
 * @param {Array}  input.edges - 连接关系数组
 * @returns {Object} { grid, nodes: (含坐标), edges: (标准化) }
 */
function generateLayout(input) {
  const { grid, nodes: rawNodes, edges: rawEdges } = input

  // 标准化 edges
  const edges = rawEdges.map(e => {
    if (Array.isArray(e)) return { from: e[0], to: e[1], hidden: false }
    return { ...e, hidden: e.hidden || false }
  })

  // 构建邻接表（完整版：含 hidden，用于楼梯检测等）
  const adj = buildAdjacencyList(edges, rawNodes)
  // 构建邻接表（布局版：排除 hidden，隐蔽路径不参与房间排列计算）
  const layoutAdj = buildAdjacencyList(edges, rawNodes, { excludeHidden: true })

  // 按楼层分组
  const floorMap = groupByFloor(rawNodes)
  const floorNums = Object.keys(floorMap).map(Number).sort((a, b) => a - b)

  // 找跨楼层连接（楼梯对）
  const stairPairs = []
  for (const e of edges) {
    const na = rawNodes.find(n => n.id === e.from)
    const nb = rawNodes.find(n => n.id === e.to)
    if (na && nb && na.floor !== nb.floor) {
      stairPairs.push({ lower: na.floor < nb.floor ? na : nb, upper: na.floor < nb.floor ? nb : na })
    }
  }

  // 为每层生成布局
  const laidNodes = []
  const layoutInfo = {} // floor → { corridorY, corridorX, corridorW }

  for (const floor of floorNums) {
    const floorNodes = floorMap[floor]
    const result = layoutFloor(floor, floorNodes, layoutAdj, stairPairs, grid)
    laidNodes.push(...result.nodes)
    layoutInfo[floor] = result.info
  }

  return { grid, nodes: laidNodes, edges }
}

/**
 * 单层布局
 * 策略：
 * - 走廊横贯中间（y = floor * floorHeight）
 * - 与走廊直连的房间排在走廊上方或下方
 * - 不与走廊直连的房间（如 garden 通过 hall 间接连接）排在对应房间旁
 * - 楼梯间放在走廊末端
 */
function layoutFloor(floorNum, floorNodes, adj, stairPairs, grid) {
  // 1. 分类节点
  const corridors = floorNodes.filter(n => n.type === 'corridor')
  const rooms = floorNodes.filter(n => n.type === 'room')

  // 找主走廊（连接最多房间的走廊）
  const mainCorridor = corridors.find(c => {
    const neighbors = adj[c.id]
    if (!neighbors) return false
    let roomCount = 0
    for (const nid of neighbors) {
      const node = floorNodes.find(n => n.id === nid)
      if (node && node.type === 'room') roomCount++
    }
    return roomCount > 0
  }) || corridors[0]

  // 找楼梯间走廊（与跨楼层连接相关的）
  const stairCorridors = corridors.filter(c => {
    return stairPairs.some(p => p.lower.id === c.id || p.upper.id === c.id)
  })
  const otherCorridors = corridors.filter(c => c !== mainCorridor && !stairCorridors.includes(c))

  // 2. 计算走廊位置
  // 每层占 grid.rows / floorCount 的空间
  // 走廊在该层区域的中间
  const floorCount = Math.max(...Object.keys({ 1: 1, 2: 1, [floorNum]: 1 }).map(Number))
  const corridorY = 4  // 固定在 y=4，与现有布局一致
  const corridorX = CORRIDOR_MARGIN
  const corridorH = CORRIDOR_HEIGHT

  // 3. 分配房间到走廊上方/下方
  const topRooms = []    // 走廊上方 (y = corridorY - 1)
  const bottomRooms = [] // 走廊下方 (y = corridorY + corridorH)

  // 计算可用宽度（需留出楼梯间空间）
  const stairCount = stairCorridors.length
  const availableWidth = grid.cols - CORRIDOR_MARGIN - (stairCount > 0 ? STAIRCASE_WIDTH * stairCount : 0)

  // 第一轮：直连走廊的房间，交替分配到上下排以平衡宽度
  const directConnected = []
  const indirectConnected = [] // 只连其他房间，不直连走廊

  for (const room of rooms) {
    const neighbors = adj[room.id]
    if (!neighbors) continue
    const connectedCorridors = corridors.filter(c => neighbors.has(c.id))
    if (connectedCorridors.length > 0) {
      directConnected.push(room)
    } else {
      indirectConnected.push(room)
    }
  }

  // 交替分配直连房间，保持上下排宽度平衡
  // 但有子房间的直连房间优先放下方排（子房间向下延伸更自然）
  let topWidth = 0
  let bottomWidth = 0

  // 先处理有子房间的直连房间（优先下方排）
  const withChildren = []
  const withoutChildren = []
  for (const room of directConnected) {
    const hasChild = indirectConnected.some(ic => {
      const icNeighbors = adj[ic.id]
      return icNeighbors && icNeighbors.has(room.id)
    })
    if (hasChild) withChildren.push(room)
    else withoutChildren.push(room)
  }

  // 有子房间的优先放下方
  for (const room of withChildren) {
    const w = room.w || DEFAULT_ROOM_WIDTH
    bottomRooms.push(room)
    bottomWidth += w
  }

  // 无子房间的交替分配
  for (const room of withoutChildren) {
    const w = room.w || DEFAULT_ROOM_WIDTH
    if (topWidth <= bottomWidth) {
      topRooms.push(room)
      topWidth += w
    } else {
      bottomRooms.push(room)
      bottomWidth += w
    }
  }

  // 第二轮：间接连接的房间，记录其父房间关系，后续通过延伸处理
  // 不放入 topRooms/bottomRooms，避免重复
  const extensionChildren = [] // { room, parentId }
  for (const room of indirectConnected) {
    const neighbors = adj[room.id]
    if (!neighbors) { topRooms.push(room); continue }
    // 找它连接的直连房间
    const parentInTop = topRooms.find(r => neighbors.has(r.id))
    const parentInBottom = bottomRooms.find(r => neighbors.has(r.id))
    if (parentInBottom) {
      extensionChildren.push({ room, parentId: parentInBottom.id })
    } else if (parentInTop) {
      extensionChildren.push({ room, parentId: parentInTop.id })
    } else {
      // 没找到父节点，放宽度较小的一侧
      if (topWidth <= bottomWidth) { topRooms.push(room); topWidth += room.w || DEFAULT_ROOM_WIDTH }
      else { bottomRooms.push(room); bottomWidth += room.w || DEFAULT_ROOM_WIDTH }
    }
  }

  // 4. 排列上方房间（从左到右）
  let xPos = corridorX
  const laidTopRooms = []
  for (const room of topRooms) {
    const w = room.w || DEFAULT_ROOM_WIDTH
    const h = ROOM_HEIGHT
    const y = corridorY - h
    laidTopRooms.push({ ...room, x: xPos, y, w, h })
    xPos += w
  }

  // 走廊宽度在下方房间排列后计算（见下方）

  // 5. 排列下方房间，处理 room-room 直接连接的延伸
  let bottomX = corridorX
  const laidBottomRooms = []
  // 记录每个下方房间的"延伸子房间"（room-room 直连，需要向下延伸）
  const extensionMap = {} // roomId → [childRoom]

  for (const room of bottomRooms) {
    const w = room.w || DEFAULT_ROOM_WIDTH
    const y = corridorY + corridorH
    const h = ROOM_HEIGHT
    laidBottomRooms.push({ ...room, x: bottomX, y, w, h })
    bottomX += w
  }

  // 处理间接连接房间：放在父房间正下方/正上方，紧贴父房间
  const laidExtensions = []
  for (const { room, parentId } of extensionChildren) {
    const parent = [...laidTopRooms, ...laidBottomRooms].find(r => r.id === parentId)
    if (!parent) continue

    const w = parent.w
    // 判断父房间在上方还是下方，决定子房间放置方向
    if (parent.y < corridorY) {
      // 父房间在走廊上方 → 子房间放父房间上方，紧贴
      const childH = ROOM_HEIGHT
      const childY = parent.y - childH
      laidExtensions.push({ ...room, x: parent.x, y: childY, w, h: childH })
    } else {
      // 父房间在走廊下方 → 子房间放父房间下方，紧贴
      const childY = parent.y + parent.h
      const childH = ROOM_HEIGHT
      laidExtensions.push({ ...room, x: parent.x, y: childY, w, h: childH })
    }
  }

  // 走廊宽度 = 上下两排房间（含延伸）的最大宽度
  const usedTopWidth = xPos - corridorX
  const usedBottomWidth = Math.max(bottomWidth, bottomX - corridorX)
  const corridorW = Math.max(usedTopWidth, usedBottomWidth, 6)

  // 6. 放置楼梯间（走廊右侧末端）
  const laidStairCorridors = []
  const stairX = corridorX + corridorW
  for (const sc of stairCorridors) {
    const w = STAIRCASE_WIDTH
    const h = corridorH
    laidStairCorridors.push({ ...sc, x: stairX, y: corridorY, w, h })
  }

  // 7. 放置其他走廊节点（如果有）
  const laidOtherCorridors = []
  let otherX = stairX + (stairCorridors.length > 0 ? STAIRCASE_WIDTH : 0)
  for (const oc of otherCorridors) {
    const w = STAIRCASE_WIDTH
    const h = corridorH
    laidOtherCorridors.push({ ...oc, x: otherX, y: corridorY, w, h })
    otherX += w
  }

  // 8. 放置主走廊
  const laidMainCorridor = {
    ...mainCorridor,
    x: corridorX,
    y: corridorY,
    w: corridorW,
    h: corridorH,
  }

  const allLaidNodes = [
    laidMainCorridor,
    ...laidTopRooms,
    ...laidBottomRooms,
    ...laidExtensions,
    ...laidStairCorridors,
    ...laidOtherCorridors,
  ]

  return {
    nodes: allLaidNodes,
    info: {
      corridorY,
      corridorX,
      corridorW,
      stairX: stairCorridors.length > 0 ? stairX : null,
    },
  }
}

// ─── 声明式输入解析 ────────────────────────────────

/**
 * 从声明式 JSON 生成完整地图
 *
 * 声明式格式示例：
 * {
 *   grid: { cols: 16, rows: 10, cellSize: 40 },
 *   nodes: [
 *     { id: 'corridor_1f', name: '一楼走廊', type: 'corridor', floor: 1 },
 *     { id: 'kitchen', name: '厨房', type: 'room', floor: 1 },
 *     { id: 'study', name: '书房', type: 'room', floor: 1 },
 *     ...
 *   ],
 *   edges: [
 *     ['hall', 'corridor_1f'],
 *     ['corridor_1f', 'study'],
 *     { from: 'study', to: 'garden', hidden: true, unlockBy: {...} },
 *     ...
 *   ]
 * }
 *
 * 节点不需要写 x/y/w/h，生成器自动计算。
 * 可选字段：w（自定义房间宽度，默认3）
 */
function generateFromDeclarative(input) {
  // 验证输入
  if (!input.grid) throw new Error('缺少 grid 配置')
  if (!input.nodes || !Array.isArray(input.nodes)) throw new Error('缺少 nodes 数组')
  if (!input.edges || !Array.isArray(input.edges)) throw new Error('缺少 edges 数组')

  // 检查节点是否有坐标（有的话 warn）
  const hasCoords = input.nodes.some(n => n.x !== undefined)
  if (hasCoords) {
    console.warn('⚠️  输入节点包含坐标，将被自动计算的坐标覆盖')
  }

  // 清除已有坐标，交给生成器
  const cleanNodes = input.nodes.map(n => {
    const { x, y, w, h, ...rest } = n
    return { ...rest, w: n.w } // 保留自定义 w
  })

  return generateLayout({ ...input, nodes: cleanNodes })
}

// ─── 输出格式化 ────────────────────────────────────

/**
 * 将生成结果格式化为 script.js 代码片段
 */
function formatAsScriptCode(result) {
  const { grid, nodes, edges } = result

  let out = '// === 自动生成的地图布局 ===\n'
  out += `// 生成时间: ${new Date().toISOString()}\n`
  out += `// 由 map-generator.cjs 生成，请勿手动修改坐标\n\n`

  out += `grid: { cols: ${grid.cols}, rows: ${grid.rows}, cellSize: ${grid.cellSize} },\n`
  out += `nodes: [\n`

  // 按楼层分组输出
  const floorMap = groupByFloor(nodes)
  for (const floor of Object.keys(floorMap).map(Number).sort((a, b) => a - b)) {
    out += `    // --- ${floor}楼 ---\n`
    for (const n of floorMap[floor]) {
      const parts = [
        `id: '${n.id}'`,
        `name: '${n.name}'`,
        `type: '${n.type}'`,
        `floor: ${n.floor}`,
        `x: ${n.x}`,
        `y: ${n.y}`,
        `w: ${n.w}`,
        `h: ${n.h}`,
      ]
      out += `    { ${parts.join(', ')} },\n`
    }
  }

  out += `  ],\n\n  edges: [\n`
  for (const e of edges) {
    if (e.hidden) {
      const unlockStr = e.unlockBy ? `, unlockBy: ${JSON.stringify(e.unlockBy)}` : ''
      out += `    { from: '${e.from}', to: '${e.to}', hidden: true${unlockStr} },\n`
    } else {
      out += `    ['${e.from}', '${e.to}'],\n`
    }
  }
  out += `  ],\n`

  return out
}

// ─── CLI 入口 ──────────────────────────────────────

function runCLI() {
  const fs = require('fs')
  const path = require('path')
  const args = process.argv.slice(2)

  const inputFile = args.find(a => !a.startsWith('--'))

  if (!inputFile) {
    console.log('用法: node map-generator.cjs <layout-input.json> [--output script.js]')
    console.log('')
    console.log('输入文件格式（JSON）:')
    console.log('  {')
    console.log('    "grid": { "cols": 16, "rows": 10, "cellSize": 40 },')
    console.log('    "nodes": [ { "id": "study", "name": "书房", "type": "room", "floor": 1 } ],')
    console.log('    "edges": [ ["corridor", "study"], {"from":"study","to":"garden","hidden":true} ]')
    console.log('  }')
    process.exit(0)
  }

  const inputPath = path.resolve(inputFile)
  const raw = fs.readFileSync(inputPath, 'utf-8')
  const input = JSON.parse(raw)

  console.log('═'.repeat(60))
  console.log('  地图自动布局生成器')
  console.log('═'.repeat(60))
  console.log(`\n输入: ${inputPath}`)
  console.log(`节点: ${input.nodes.length} 个, 边: ${input.edges.length} 条\n`)

  const result = generateFromDeclarative(input)

  // 输出生成结果
  console.log('─'.repeat(40))
  console.log('生成结果:')
  console.log('─'.repeat(40))

  const floorMap = groupByFloor(result.nodes)
  for (const floor of Object.keys(floorMap).map(Number).sort((a, b) => a - b)) {
    const fn = floorMap[floor]
    console.log(`\n  F${floor} (${fn.length} 节点):`)
    for (const n of fn) {
      const typeIcon = n.type === 'corridor' ? '░' : '█'
      console.log(`    ${typeIcon} [${n.id.padEnd(16)}] ${n.name.padEnd(6)} x=${n.x} y=${n.y} w=${n.w} h=${n.h}`)
    }
  }

  // 格式化为代码
  const code = formatAsScriptCode(result)

  const outputFile = args.includes('--output') ? args[args.indexOf('--output') + 1] : null

  if (outputFile) {
    fs.writeFileSync(path.resolve(outputFile), code)
    console.log(`\n✅ 已输出到: ${outputFile}`)
  } else {
    console.log('\n' + '─'.repeat(40))
    console.log('生成的代码（可复制到 script.js）:')
    console.log('─'.repeat(40) + '\n')
    console.log(code)
  }
}

// 导出模块 + CLI
module.exports = { generateLayout, generateFromDeclarative, formatAsScriptCode }

if (require.main === module) {
  runCLI()
}