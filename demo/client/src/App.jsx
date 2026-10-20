import React, { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

// 动态获取后端地址：用当前页面的 host + 3001 端口，局域网设备也能连上
const SOCKET_URL = `${window.location.protocol}//${window.location.hostname}:3001`
const socket = io(SOCKET_URL)

// === 角色选择界面 ===
function LoginScreen({ players }) {
  const characters = [
    { id: 'li_furen', name: '李夫人', color: '#e91e63' },
    { id: 'li_shaoye', name: '李少爷', color: '#2196f3' },
    { id: 'wang_guanjia', name: '王管家', color: '#4caf50' },
    { id: 'zhao_yisheng', name: '赵医生', color: '#ff9800' },
    { id: 'chen_xiaojie', name: '陈小姐', color: '#9c27b0' },
    { id: 'zhang_hugong', name: '张护工', color: '#795548' },
  ]

  const takenCharacters = new Set(players.map(p => p.characterId))

  const handleSelect = (charId) => {
    if (takenCharacters.has(charId)) return
    const name = prompt('输入你的名字：', characters.find(c => c.id === charId).name)
    if (name) socket.emit('join', { characterId: charId, playerName: name })
  }

  return (
    <div className="login-screen">
      <h1>雾庄疑案</h1>
      <h2>选择你的角色</h2>
      <div className="character-list">
        {characters.map(char => (
          <div
            key={char.id}
            className={`character-card ${takenCharacters.has(char.id) ? 'taken' : ''}`}
            onClick={() => handleSelect(char.id)}
          >
            <span className="character-dot" style={{ background: char.color }} />
            <span>{char.name}</span>
            {takenCharacters.has(char.id) && <span style={{ fontSize: 11, color: '#888' }}>（已选）</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// === 背景舞台（视频/图片层，后期接入实际素材）===
function VideoStage({ state }) {
  if (!state) return null

  const currentNode = state.nodes?.find(n => n.id === state.player.location)
  const roomName = currentNode?.name || '未知'
  const roomType = currentNode?.type === 'corridor' ? '走廊' : '房间'

  return (
    <div className="stage-bg">
      {/* 后期替换为：<video autoPlay loop muted src={currentNode.videoUrl} /> */}
      {/* 当前占位：渐变背景 + 房间名 */}
      <div className="stage-placeholder">
        <div className="stage-room-label">
          <span className="stage-room-type">{roomType}</span>
          <span className="stage-room-name">{roomName}</span>
        </div>
        <div className="stage-hint">背景视频/图片区域</div>
      </div>
    </div>
  )
}

// === 户型图俯视图（建筑平面图风格：实心区域+墙线+门开口）===
function MapView({ state, players, onMove, currentFloor, onFloorChange }) {
  const { nodes, edges, grid, player, visitedRooms, neighbors, unlockedEdges } = state
  const [selectedRoom, setSelectedRoom] = React.useState(null)

  if (!nodes || !grid) return null

  const cell = grid.cellSize
  const floorNodes = nodes.filter(n => n.floor === currentFloor)
  const svgW = grid.cols * cell
  const svgH = grid.rows * cell

  // 玩家按位置分组
  const playerNodeMap = {}
  for (const p of players) {
    const node = nodes.find(n => n.id === p.location)
    if (node && node.floor === currentFloor) {
      if (!playerNodeMap[p.location]) playerNodeMap[p.location] = []
      playerNodeMap[p.location].push(p)
    }
  }

  // 获取节点的矩形坐标（像素）
  const nodeRect = (n) => ({
    x: n.x * cell, y: n.y * cell, w: n.w * cell, h: n.h * cell,
    cx: (n.x + n.w / 2) * cell, cy: (n.y + n.h / 2) * cell,
  })

  // 点击房间
  const handleRoomClick = (nodeId) => {
    if (!neighbors.includes(nodeId)) return
    if (selectedRoom === nodeId) {
      onMove(nodeId)
      setSelectedRoom(null)
    } else {
      setSelectedRoom(nodeId)
    }
  }

  // 计算两个相邻区域的共享边，返回门开口线段坐标（像素坐标）
  const computeDoor = (a, b) => {
    const ra = nodeRect(a), rb = nodeRect(b)
    const aL = ra.x, aR = ra.x + ra.w, aTop = ra.y, aBot = ra.y + ra.h
    const bL = rb.x, bR = rb.x + rb.w, bTop = rb.y, bBot = rb.y + rb.h
    // y方向重叠量（用于判断左右相邻）
    const yOv = Math.max(0, Math.min(aBot, bBot) - Math.max(aTop, bTop))
    // x方向重叠量（用于判断上下相邻）
    const xOv = Math.max(0, Math.min(aR, bR) - Math.max(aL, bL))
    const GAP = 1 // 容差（像素）
    // 左右相邻：x方向紧贴(xOv≈0)，y方向有重叠(yOv>0) → 门是竖线（在共享的垂直边上）
    if (yOv > 0 && xOv <= GAP) {
      const wx = (aR + bL) / 2 // 共享垂直边的 x 坐标（取 a右/b左 的中点，紧贴时两者相等）
      const yMin = Math.max(aTop, bTop), yMax = Math.min(aBot, bBot)
      const dLen = (yMax - yMin) * 0.4
      const mid = (yMin + yMax) / 2
      return { x1: wx, y1: mid - dLen / 2, x2: wx, y2: mid + dLen / 2 }
    }
    // 上下相邻：y方向紧贴(yOv≈0)，x方向有重叠(xOv>0) → 门是横线（在共享的水平边上）
    if (xOv > 0 && yOv <= GAP) {
      const wy = (aBot + bTop) / 2 // 共享水平边的 y 坐标
      const xMin = Math.max(aL, bL), xMax = Math.min(aR, bR)
      const dLen = (xMax - xMin) * 0.4
      const mid = (xMin + xMax) / 2
      return { x1: mid - dLen / 2, y1: wy, x2: mid + dLen / 2, y2: wy }
    }
    return null
  }

  // 边的标准化解析（兼容数组 ['a','b'] 和对象 {from,to,hidden}）
  const parseEdge = (e) => Array.isArray(e) ? { a: e[0], b: e[1], hidden: false } : { a: e.from, b: e.to, hidden: !!e.hidden }

  // 预计算门开口（跳过隐蔽路径和跨楼层边）
  const doors = []
  for (const e of edges) {
    const { a: aId, b: bId, hidden } = parseEdge(e)
    if (hidden) continue
    const na = floorNodes.find(n => n.id === aId)
    const nb = floorNodes.find(n => n.id === bId)
    if (na && nb) {
      const d = computeDoor(na, nb)
      if (d) doors.push(d)
    }
  }

  // 已解锁的隐蔽路径（虚线连接，两端可能在同一楼层或不同楼层）
  const hiddenPaths = []
  for (const e of edges) {
    const { a: aId, b: bId, hidden } = parseEdge(e)
    if (!hidden) continue
    const edgeKey = `${aId}__${bId}`
    const edgeKeyRev = `${bId}__${aId}`
    const isUnlocked = (unlockedEdges || []).includes(edgeKey) || (unlockedEdges || []).includes(edgeKeyRev)
    if (!isUnlocked) continue
    const na = nodes.find(n => n.id === aId)
    const nb = nodes.find(n => n.id === bId)
    if (!na || !nb) continue
    // 只在两端之一属于当前楼层时显示
    if (na.floor !== currentFloor && nb.floor !== currentFloor) continue
    const ra = nodeRect(na), rb = nodeRect(nb)
    // 如果两端都在当前楼层，画虚线；跨楼层时只画当前楼层端的标记
    if (na.floor === currentFloor && nb.floor === currentFloor) {
      hiddenPaths.push({ x1: ra.cx, y1: ra.cy, x2: rb.cx, y2: rb.cy, crossFloor: false })
    } else {
      // 跨楼层隐蔽路径：在当前楼层端显示特殊标记
      const fn = na.floor === currentFloor ? na : nb
      const fr = nodeRect(fn)
      hiddenPaths.push({ x1: fr.cx, y1: fr.cy, x2: fr.cx, y2: fr.cy, crossFloor: true, node: fn })
    }
  }

  // 楼梯标记：找跨楼层 edge，在当前楼层显示对应节点
  const stairNodes = []
  for (const e of edges) {
    const { a: aId, b: bId } = parseEdge(e)
    const na = nodes.find(n => n.id === aId)
    const nb = nodes.find(n => n.id === bId)
    if (na && nb && na.floor !== nb.floor) {
      const fn = na.floor === currentFloor ? na : nb
      if (fn) stairNodes.push(fn)
    }
  }

  return (
    <div className="map-wrapper">
      <div className="floor-switcher">
        {state.floors.map(f => (
          <button key={f} className={`floor-btn ${currentFloor === f ? 'active' : ''}`} onClick={() => onFloorChange(f)}>
            {f}F
          </button>
        ))}
      </div>

      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: '100%', touchAction: 'manipulation' }}>
        <rect width={svgW} height={svgH} fill="#0a0a18" />

        {/* 区域填充（房间+走廊，紧密拼接） */}
        {floorNodes.map(node => {
          const r = nodeRect(node)
          const isCurrent = node.id === player.location
          const isVisited = visitedRooms.includes(node.id)
          const isCorridor = node.type === 'corridor'
          let fill = isCorridor ? '#1a1a30' : '#222238'
          if (isVisited && !isCurrent) fill = isCorridor ? '#1a2818' : '#1e3020'
          if (isCurrent) fill = isCorridor ? '#2a1820' : '#2a1828'
          if (selectedRoom === node.id) fill = '#2a2010'
          return <rect key={`fill-${node.id}`} x={r.x} y={r.y} width={r.w} height={r.h} fill={fill} />
        })}

        {/* 墙线 */}
        {floorNodes.map(node => {
          const r = nodeRect(node)
          const isCurrent = node.id === player.location
          const isNeighbor = neighbors.includes(node.id)
          const isSelected = selectedRoom === node.id
          let stroke = '#4a4a6a', sw = 1.5
          if (isCurrent) { stroke = '#e94560'; sw = 2.5 }
          else if (isSelected) { stroke = '#ff9800'; sw = 2.5 }
          else if (isNeighbor) { stroke = '#e94560'; sw = 2 }
          return <rect key={`wall-${node.id}`} x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke={stroke} strokeWidth={sw} />
        })}

        {/* 门开口：用背景色覆盖墙线形成缺口 */}
        {doors.map((d, i) => (
          <line key={`door-${i}`} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke="#0a0a18" strokeWidth="4" />
        ))}

        {/* 已解锁的隐蔽路径：虚线连接 */}
        {hiddenPaths.map((p, i) => (
          p.crossFloor ? (
            <text key={`hidden-${i}`} x={p.x1} y={p.y1} textAnchor="middle" dominantBaseline="central" fill="#9c27b0" fontSize="12">🌀</text>
          ) : (
            <g key={`hidden-${i}`}>
              <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke="#9c27b0" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
              <text x={(p.x1 + p.x2) / 2} y={(p.y1 + p.y2) / 2} textAnchor="middle" dominantBaseline="central" fill="#9c27b0" fontSize="9">窗</text>
            </g>
          )
        ))}

        {/* 楼梯标记 */}
        {stairNodes.map((node, i) => {
          const r = nodeRect(node)
          return <text key={`stair-${i}`} x={r.cx} y={r.cy} textAnchor="middle" dominantBaseline="central" fill="#888" fontSize="14">⇅</text>
        })}

        {/* 房间名称（走廊不显示） */}
        {floorNodes.map(node => {
          if (node.type === 'corridor') return null
          const r = nodeRect(node)
          const isCurrent = node.id === player.location
          const isSelected = selectedRoom === node.id
          const isNeighbor = neighbors.includes(node.id)
          let fill = '#888'
          if (isCurrent) fill = '#e94560'
          else if (isSelected) fill = '#ff9800'
          else if (isNeighbor) fill = '#ccc'
          return (
            <text key={`label-${node.id}`} x={r.cx} y={r.cy} textAnchor="middle" dominantBaseline="central"
              fill={fill} fontSize="10" fontWeight={isCurrent || isSelected ? 'bold' : 'normal'}>
              {node.name}
            </text>
          )
        })}

        {/* 案发标记 */}
        {state.bodyDiscovered && floorNodes.map(node => {
          if (node.id !== state.player.murderRoomId) return null
          const r = nodeRect(node)
          return <text key={`murder-${node.id}`} x={r.x + r.w - 10} y={r.y + 12} fill="#ff6b6b" fontSize="12">💀</text>
        })}

        {/* 玩家标记 */}
        {floorNodes.map(node => {
          const r = nodeRect(node)
          const herePlayers = playerNodeMap[node.id] || []
          if (herePlayers.length === 0) return null
          return herePlayers.map((p, i) => {
            const ox = i * 12
            return (
              <g key={`p-${node.id}-${i}`}>
                <circle cx={r.x + r.w - 12 - ox} cy={r.y + r.h - 12} r="7" fill={p.color} opacity="0.9" stroke="#fff" strokeWidth="0.5" />
                <text x={r.x + r.w - 12 - ox} y={r.y + r.h - 9} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{p.characterName[0]}</text>
              </g>
            )
          })
        })}

        {/* 可移动提示：居中显示，房间名下方偏移 */}
        {floorNodes.map(node => {
          if (!neighbors.includes(node.id)) return null
          const r = nodeRect(node)
          if (selectedRoom === node.id) {
            return <text key={`hint-${node.id}`} x={r.cx} y={r.cy + 14} textAnchor="middle" dominantBaseline="central" fill="#ff9800" fontSize="8" fontWeight="bold">再按确认</text>
          }
          // 走廊不显示名称，箭头在中心；房间有名称，箭头在名称下方
          const offsetY = node.type === 'corridor' ? 0 : 12
          return <text key={`hint-${node.id}`} x={r.cx} y={r.cy + offsetY} textAnchor="middle" dominantBaseline="central" fill="#e94560" fontSize="12" opacity="0.85">→</text>
        })}

        {/* 透明点击层 */}
        {floorNodes.map(node => {
          const r = nodeRect(node)
          const isNeighbor = neighbors.includes(node.id)
          return (
            <rect key={`click-${node.id}`} x={r.x} y={r.y} width={r.w} height={r.h} fill="transparent"
              style={{ cursor: isNeighbor ? 'pointer' : 'default', pointerEvents: isNeighbor ? 'all' : 'none' }}
              onClick={() => handleRoomClick(node.id)} />
          )
        })}
      </svg>
    </div>
  )
}

// === 模拟时钟组件（SVG 表盘，带 1-12 数字）===
function AnalogClock({ player, size = 80 }) {
  const { clockStart, segmentDuration, segment } = player
  if (!clockStart) return null

  const [startH, startM] = clockStart.split(':').map(Number)
  const totalMinutes = startH * 60 + startM + segment * segmentDuration
  const hours = Math.floor(totalMinutes / 60) % 24
  const minutes = totalMinutes % 60

  const hourAngle = ((hours % 12) + minutes / 60) * 30
  const minAngle = minutes * 6

  const cx = 50, cy = 50, r = 44

  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size, flexShrink: 0 }}>
      {/* 表盘背景 */}
      <circle cx={cx} cy={cy} r={r} fill="rgba(15, 15, 35, 0.92)" stroke="#3a3a5a" strokeWidth="2" />
      {/* 刻度线 */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 - 90) * Math.PI / 180
        const isMajor = i % 3 === 0
        const x1 = cx + Math.cos(angle) * (r - 3)
        const y1 = cy + Math.sin(angle) * (r - 3)
        const x2 = cx + Math.cos(angle) * (r - (isMajor ? 9 : 7))
        const y2 = cy + Math.sin(angle) * (r - (isMajor ? 9 : 7))
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={isMajor ? '#999' : '#444'} strokeWidth={isMajor ? 1.5 : 1} />
        )
      })}
      {/* 数字 1-12 */}
      {Array.from({ length: 12 }, (_, i) => {
        const num = i + 1
        const angle = (num * 30 - 90) * Math.PI / 180
        const tx = cx + Math.cos(angle) * (r - 16)
        const ty = cy + Math.sin(angle) * (r - 16)
        return (
          <text key={num} x={tx} y={ty}
            textAnchor="middle" dominantBaseline="central"
            fill="#777" fontSize="7" fontWeight="bold">
            {num}
          </text>
        )
      })}
      {/* 时针 */}
      <line
        x1={cx} y1={cy}
        x2={cx + Math.cos((hourAngle - 90) * Math.PI / 180) * (r - 20)}
        y2={cy + Math.sin((hourAngle - 90) * Math.PI / 180) * (r - 20)}
        stroke="#e0e0e0" strokeWidth="3" strokeLinecap="round"
      />
      {/* 分针 */}
      <line
        x1={cx} y1={cy}
        x2={cx + Math.cos((minAngle - 90) * Math.PI / 180) * (r - 8)}
        y2={cy + Math.sin((minAngle - 90) * Math.PI / 180) * (r - 8)}
        stroke="#aaa" strokeWidth="2" strokeLinecap="round"
      />
      {/* 中心点 */}
      <circle cx={cx} cy={cy} r="2.5" fill="#e94560" />
    </svg>
  )
}

// === 辅助信息面板（地图+时钟整合悬浮层，缩放式展开/缩小/拖拽）===
// 核心思路：内部始终以"展开态尺寸"渲染地图+时钟，通过 CSS transform: scale() 缩放
// 缩略态 = 展开态等比缩小，半透明可看见布局和指针
// 展开态尺寸基于 game-stage 实际大小按比例计算，大屏大、小屏小，灵活自适应
function AssistPanel({ state, players, onMove, currentFloor, onFloorChange, stageRef }) {
  const [expanded, setExpanded] = useState(false)
  const [pos, setPos] = useState({ x: 16, y: 16 }) // 相对 game-stage 左上角的偏移
  const dragRef = useRef(null)
  const dragStart = useRef(null)

  // 基于 game-stage 实际尺寸计算展开态大小
  const [baseSize, setBaseSize] = useState({ w: 460, h: 400 })
  useEffect(() => {
    const calcSize = () => {
      const stage = stageRef?.current
      if (!stage) return
      const rect = stage.getBoundingClientRect()
      // 展开态占 game-stage 的 72% 宽 × 78% 高，限制最小 360×320、最大 560×480
      const w = Math.max(360, Math.min(560, rect.width * 0.72))
      const h = Math.max(320, Math.min(480, rect.height * 0.78))
      setBaseSize({ w: Math.round(w), h: Math.round(h) })
    }
    calcSize()
    window.addEventListener('resize', calcSize)
    return () => window.removeEventListener('resize', calcSize)
  }, [stageRef])

  const BASE_W = baseSize.w
  const BASE_H = baseSize.h
  // 缩略态宽度目标约 76px，由此算出缩放比例
  const COLLAPSED_SCALE = Math.min(0.2, 80 / BASE_W)
  const scale = expanded ? 1 : COLLAPSED_SCALE

  // 拖拽逻辑（pointer 事件兼容触摸+鼠标）
  const onDragStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const stage = e.currentTarget.parentElement.parentElement // assist-panel -> game-stage
    const rect = stage.getBoundingClientRect()
    const panelW = BASE_W * scale
    const panelH = BASE_H * scale
    dragStart.current = {
      px: e.clientX,
      py: e.clientY,
      ox: pos.x,
      oy: pos.y,
      stageW: rect.width,
      stageH: rect.height,
      panelW,
      panelH,
    }
    dragRef.current = e.currentTarget
    window.addEventListener('pointermove', onDragMove)
    window.addEventListener('pointerup', onDragEnd)
  }

  const onDragMove = (e) => {
    if (!dragStart.current) return
    const dx = e.clientX - dragStart.current.px
    const dy = e.clientY - dragStart.current.py
    const maxX = dragStart.current.stageW - dragStart.current.panelW - 4
    const maxY = dragStart.current.stageH - dragStart.current.panelH - 4
    setPos({
      x: Math.max(4, Math.min(maxX, dragStart.current.ox + dx)),
      y: Math.max(4, Math.min(maxY, dragStart.current.oy + dy)),
    })
  }

  const onDragEnd = () => {
    dragStart.current = null
    window.removeEventListener('pointermove', onDragMove)
    window.removeEventListener('pointerup', onDragEnd)
  }

  useEffect(() => () => {
    window.removeEventListener('pointermove', onDragMove)
    window.removeEventListener('pointerup', onDragEnd)
  }, [])

  return (
    <div
      className={`assist-panel ${expanded ? 'expanded' : 'collapsed'}`}
      style={{
        left: pos.x,
        top: pos.y,
        width: BASE_W * scale,
        height: BASE_H * scale,
      }}
    >
      {/* 缩放容器：内部始终以 BASE_W × BASE_H 渲染，通过 scale 缩放 */}
      <div
        className="assist-scaler"
        style={{
          width: BASE_W,
          height: BASE_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* 拖拽手柄 */}
        <div className="assist-drag-handle" onPointerDown={onDragStart}>
          <span className="assist-drag-dots">⋮⋮</span>
        </div>

        {/* 展开/缩小按钮 */}
        <button
          className="assist-toggle"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
        >
          {expanded ? '✕' : '展开'}
        </button>

        {/* 内容区：时钟（上）+ 地图（下），始终渲染 */}
        {state && (
          <div className="assist-content">
            <div className="assist-clock-row">
              <AnalogClock player={state.player} size={80} />
            </div>
            <div className="assist-map-area">
              <MapView
                state={state}
                players={players}
                onMove={onMove}
                currentFloor={currentFloor}
                onFloorChange={onFloorChange}
              />
            </div>
          </div>
        )}
      </div>

      {/* 缩略态点击层（覆盖在缩放内容上方，点击展开） */}
      {!expanded && (
        <div
          className="assist-click-overlay"
          onClick={() => setExpanded(true)}
        />
      )}
    </div>
  )
}

// === 侧边栏组件 ===
function Sidebar({ state, players, onAction }) {
  if (!state) return null
  const { player, sameLocationPlayers, roomObjects, neighbors, inventory, notes, tasks, eventLog } = state

  const nodeName = (id) => state.nodes.find(n => n.id === id)?.name || id

  return (
    <div className="sidebar">
      {/* 玩家信息 */}
      <div className="sidebar-section">
        <h3>角色</h3>
        <div className="player-info">
          <span className="character-dot" style={{ background: player.color }} />
          <span className="name">{player.characterName}</span>
          {player.isMurderer && <span className="murderer-badge">凶手</span>}
        </div>
        <div className="secret-box" style={{ marginTop: 8 }}>
          {player.secret}
        </div>
      </div>

      {/* 当前位置 + 移动 */}
      <div className="sidebar-section">
        <h3>当前位置：{nodeName(player.location)}</h3>
        {sameLocationPlayers.length > 0 && (
          <div className="same-location">
            此处还有：{sameLocationPlayers.map(p => p.characterName).join('、')}
          </div>
        )}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>移动到：</div>
          {neighbors.length === 0 && <span style={{ fontSize: 12, color: '#666' }}>无路可走</span>}
          {neighbors.map(id => (
            <button key={id} className="btn btn-move" onClick={() => onAction({ type: 'move', target: id })}>
              → {nodeName(id)}
            </button>
          ))}
        </div>
      </div>

      {/* 房间物体 */}
      {roomObjects.length > 0 && (
        <div className="sidebar-section">
          <h3>可搜索物体</h3>
          {roomObjects.map(obj => (
            <div key={obj.id} className={`object-item ${obj.searched ? 'searched' : ''}`}>
              <span>{obj.name}</span>
              {obj.searched ? (
                <span style={{ fontSize: 11, color: '#666' }}>{obj.searchedByMe ? '已搜索' : '已被搜索'}</span>
              ) : obj.requires ? (
                <button className="btn" onClick={() => onAction({ type: 'search', objectId: obj.id })}>
                  🔑 搜索
                </button>
              ) : (
                <button className="btn" onClick={() => onAction({ type: 'search', objectId: obj.id })}>
                  搜索
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 道具栏 */}
      <div className="sidebar-section">
        <h3>道具栏</h3>
        {inventory.length === 0 && <div style={{ fontSize: 12, color: '#666' }}>空</div>}
        {inventory.map(item => (
          <div key={item.id} className="inventory-item">
            <span className={`item-type ${item.type}`}>{item.type === 'key' ? '钥匙' : item.type === 'evidence' ? '证据' : '信息'}</span>
            <span style={{ flex: 1 }}>{item.name}</span>
            <button className="btn" onClick={() => onAction({ type: 'useItem', itemId: item.id })}>使用</button>
            <button className="btn" onClick={() => onAction({ type: 'dropItem', itemId: item.id })}>丢弃</button>
            {sameLocationPlayers.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const targetPlayer = players.find(p => p.characterId === e.target.value)
                    onAction({ type: 'giveItem', itemId: item.id, targetSocketId: targetPlayer?.socketId || e.target.value })
                  }
                  e.target.value = ''
                }}
                style={{ fontSize: 11, background: '#1a1a3e', color: '#e0e0e0', border: '1px solid #333', borderRadius: 4 }}
              >
                <option value="">交给...</option>
                {sameLocationPlayers.map(p => (
                  <option key={p.characterId} value={p.characterId}>{p.characterName}</option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      {/* 笔记 */}
      {notes.length > 0 && (
        <div className="sidebar-section">
          <h3>信息笔记</h3>
          {notes.map(note => (
            <div key={note.id} className="inventory-item">
              <span className="item-type info">信息</span>
              <span>{note.name}：{note.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* 任务 */}
      <div className="sidebar-section">
        <h3>任务</h3>
        {tasks.map(t => (
          <div key={t.id} className={`task-item ${t.status === 'completed' ? 'completed' : ''}`}>
            {t.status === 'completed' ? '✓ ' : '○ '}{t.name}
          </div>
        ))}
      </div>

      {/* 上锁 */}
      <div className="sidebar-section">
        <h3>门锁</h3>
        <button className="btn" onClick={() => onAction({ type: 'lock' })}>上锁/解锁当前房间</button>
      </div>

      {/* 事件日志 */}
      <div className="sidebar-section">
        <h3>事件日志</h3>
        <div className="event-log">
          {eventLog.map((evt, i) => (
            <div key={i} className="event-entry">
              {evt.text || JSON.stringify(evt)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// === 搜索结果弹窗 ===
function SearchResultModal({ result, onClose }) {
  if (!result) return null
  return (
    <div className="search-result" onClick={onClose}>
      <h3>搜索结果</h3>
      {result.type === 'found_item' && (
        <div>
          <p style={{ marginBottom: 8 }}>你发现了 <strong>{result.item.name}</strong>！</p>
          <p style={{ color: '#aaa', fontSize: 13 }}>{result.item.description}</p>
        </div>
      )}
      {result.type === 'found_info' && (
        <div>
          <p style={{ marginBottom: 8 }}>你获得了信息：<strong>{result.item.name}</strong></p>
          <p style={{ color: '#aaa', fontSize: 13 }}>{result.item.description}</p>
        </div>
      )}
      {result.type === 'search_empty' && (
        <p>搜索了 <strong>{result.object}</strong>，什么也没找到。</p>
      )}
      <button className="btn" style={{ marginTop: 16 }} onClick={onClose}>关闭</button>
    </div>
  )
}

// === 相遇通知 ===
function MeetingNotification({ meeting, onClose }) {
  if (!meeting) return null
  return (
    <div className="meeting-notification" onClick={onClose}>
      你在 {meeting.location} 遇到了 {meeting.with}
    </div>
  )
}

// === 主组件 ===
export default function App() {
  const [joined, setJoined] = useState(false)
  const [state, setState] = useState(null)
  const [players, setPlayers] = useState([])
  const [searchResult, setSearchResult] = useState(null)
  const [meeting, setMeeting] = useState(null)
  const [error, setError] = useState(null)
  const [currentFloor, setCurrentFloor] = useState(1)
  const stageRef = useRef(null)
  const meetingTimerRef = useRef(null)

  useEffect(() => {
    socket.on('joined', () => setJoined(true))
    socket.on('state', (s) => {
      setState(s)
      // 自动切换到玩家所在楼层
      if (s && s.player) {
        const node = s.nodes.find(n => n.id === s.player.location)
        if (node && node.floor !== currentFloor) {
          setCurrentFloor(node.floor)
        }
      }
    })
    socket.on('players', (p) => setPlayers(p))
    socket.on('action_result', ({ events }) => {
      for (const evt of events) {
        if (evt.type === 'found_item' || evt.type === 'found_info' || evt.type === 'search_empty') {
          setSearchResult(evt)
        }
        if (evt.type === 'hidden_path_unlocked') {
          setError('发现隐蔽路径！地图已更新')
          setTimeout(() => setError(null), 3000)
        }
        if (evt.type === 'body_discovered') {
          setSearchResult({ type: 'found_info', item: { name: '发现尸体', description: `${evt.discoverer} 发现了李老爷的尸体！游戏进入讨论阶段。` } })
        }
        if (evt.type === 'murder_occurred') {
          // 静默，不通知
        }
        if (evt.type === 'task_completed') {
          setError(`任务完成：${evt.tasks.join('、')}`)
          setTimeout(() => setError(null), 3000)
        }
      }
    })
    socket.on('meeting', (data) => {
      const locName = state?.nodes.find(n => n.id === data.location)?.name || data.location
      setMeeting({ ...data, location: locName })
      if (meetingTimerRef.current) clearTimeout(meetingTimerRef.current)
      meetingTimerRef.current = setTimeout(() => setMeeting(null), 3000)
    })
    socket.on('global_event', (data) => {
      setError(data.text)
      setTimeout(() => setError(null), 5000)
    })
    socket.on('action_error', ({ message }) => {
      setError(message)
      setTimeout(() => setError(null), 3000)
    })
    socket.on('error', ({ message }) => {
      setError(message)
      setTimeout(() => setError(null), 3000)
    })

    return () => {
      socket.off()
    }
  }, [])

  const handleAction = (action) => {
    socket.emit('action', action)
  }

  if (!joined) {
    return (
      <>
        {error && <div className="meeting-notification" onClick={() => setError(null)}>{error}</div>}
        <LoginScreen players={players} />
      </>
    )
  }

  return (
    <div className="app">
      {/* 背景区（后期接入视频层）+ 悬浮辅助面板 */}
      <div className="game-stage" ref={stageRef}>
        {/* 背景（视频/图片层） */}
        <VideoStage state={state} />

        {/* 地图+时钟悬浮辅助面板 */}
        {state && (
          <AssistPanel
            state={state}
            players={players}
            onMove={(target) => handleAction({ type: 'move', target })}
            currentFloor={currentFloor}
            onFloorChange={setCurrentFloor}
            stageRef={stageRef}
          />
        )}
      </div>
      <Sidebar
        state={state}
        players={players}
        onAction={handleAction}
      />
      {searchResult && <SearchResultModal result={searchResult} onClose={() => setSearchResult(null)} />}
      {meeting && <MeetingNotification meeting={meeting} onClose={() => setMeeting(null)} />}
      {error && !meeting && <div className="meeting-notification" onClick={() => setError(null)}>{error}</div>}
    </div>
  )
}