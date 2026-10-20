#!/usr/bin/env node
/**
 * 地图布局验证与生成工具
 * 
 * 功能：
 * 1. 验证每条 edge 的两端节点是否真正紧贴（共享一条边）
 * 2. 检测节点是否有重叠
 * 3. 检测越界节点
 * 4. ASCII 可视化预览
 * 5. 自动从坐标紧贴关系推导 edges（辅助设计）
 * 
 * 用法：
 *   node map-tool.cjs              # 验证当前 script.js 的地图
 *   node map-tool.cjs --auto       # 自动推导 edges 并输出
 *   node map-tool.cjs --ascii      # 只输出 ASCII 地图
 */

const path = require('path')

// 加载 script.js（ES module 语法，用正则提取 JSON-like 结构）
function loadScript() {
  const fs = require('fs')
  const content = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf-8')
  
  // 提取 grid
  const gridMatch = content.match(/grid:\s*\{[^}]*cols:\s*(\d+)[^}]*rows:\s*(\d+)[^}]*cellSize:\s*(\d+)/)
  const grid = gridMatch ? { cols: +gridMatch[1], rows: +gridMatch[2], cellSize: +gridMatch[3] } : { cols: 16, rows: 10, cellSize: 40 }
  
  // 提取 nodes（逐行解析）
  const nodes = []
  const nodeRegex = /\{\s*id:\s*'([^']+)'[^}]*name:\s*'([^']+)'[^}]*type:\s*'([^']+)'[^}]*floor:\s*(\d+)[^}]*x:\s*(\d+)[^}]*y:\s*(\d+)[^}]*w:\s*(\d+)[^}]*h:\s*(\d+)\s*\}/g
  let m
  while ((m = nodeRegex.exec(content)) !== null) {
    nodes.push({
      id: m[1], name: m[2], type: m[3], floor: +m[4],
      x: +m[5], y: +m[6], w: +m[7], h: +m[8]
    })
  }
  
  // 提取 edges（兼容数组 ['a','b'] 和对象 {from,to,hidden}）
  const edges = []
  const edgeArrayRegex = /\[\s*'([^']+)'[^,]*,\s*'([^']+)'\s*\]/g
  while ((m = edgeArrayRegex.exec(content)) !== null) {
    edges.push({ from: m[1], to: m[2], hidden: false })
  }
  const edgeObjRegex = /\{\s*from:\s*'([^']+)'[^}]*to:\s*'([^']+)'[^}]*\}/g
  while ((m = edgeObjRegex.exec(content)) !== null) {
    const fullMatch = m[0]
    const hidden = /hidden:\s*(true)/.test(fullMatch)
    edges.push({ from: m[1], to: m[2], hidden })
  }
  
  return { grid, nodes, edges }
}

// 判断两个节点是否紧贴（共享一条边）
function getAdjacency(a, b) {
  const aR = a.x + a.w, aB = a.y + a.h
  const bR = b.x + b.w, bB = b.y + b.h
  
  // 左右相邻：a右=b左 或 b右=a左，且 y 方向有重叠
  const yOv = Math.max(0, Math.min(aB, bB) - Math.max(a.y, b.y))
  if (yOv > 0) {
    if (aR === b.x) return { type: 'left-right', shared: { axis: 'x', val: aR, overlap: yOv } }
    if (bR === a.x) return { type: 'right-left', shared: { axis: 'x', val: bR, overlap: yOv } }
  }
  
  // 上下相邻：a底=b顶 或 b底=a顶，且 x 方向有重叠
  const xOv = Math.max(0, Math.min(aR, bR) - Math.max(a.x, b.x))
  if (xOv > 0) {
    if (aB === b.y) return { type: 'top-bottom', shared: { axis: 'y', val: aB, overlap: xOv } }
    if (bB === a.y) return { type: 'bottom-top', shared: { axis: 'y', val: bB, overlap: xOv } }
  }
  
  // 检测重叠
  const xOverlap = Math.max(0, Math.min(aR, bR) - Math.max(a.x, b.x))
  const yOverlap = Math.max(0, Math.min(aB, bB) - Math.max(a.y, b.y))
  if (xOverlap > 0 && yOverlap > 0) {
    return { type: 'overlap', area: xOverlap * yOverlap }
  }
  
  return null
}

// 验证地图
function validate({ grid, nodes, edges }) {
  console.log('='.repeat(60))
  console.log('  地图布局验证报告')
  console.log('='.repeat(60))
  console.log(`\n网格: ${grid.cols}×${grid.rows}, cellSize=${grid.cellSize}px`)
  console.log(`节点: ${nodes.length} 个, 边: ${edges.length} 条\n`)
  
  let hasError = false
  
  // 1. 检查节点越界
  console.log('─'.repeat(40))
  console.log('1. 节点越界检查')
  console.log('─'.repeat(40))
  for (const n of nodes) {
    if (n.x < 0 || n.y < 0 || n.x + n.w > grid.cols || n.y + n.h > grid.rows) {
      console.log(`  ❌ [${n.id}] ${n.name} 越界: x=${n.x},y=${n.y},w=${n.w},h=${n.h} (网格 ${grid.cols}×${grid.rows})`)
      hasError = true
    }
  }
  const inBounds = nodes.every(n => n.x >= 0 && n.y >= 0 && n.x + n.w <= grid.cols && n.y + n.h <= grid.rows)
  if (inBounds) console.log('  ✅ 所有节点在网格范围内')
  
  // 2. 检查节点重叠
  console.log('\n' + '─'.repeat(40))
  console.log('2. 节点重叠检查')
  console.log('─'.repeat(40))
  let overlapFound = false
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].floor !== nodes[j].floor) continue
      const adj = getAdjacency(nodes[i], nodes[j])
      if (adj && adj.type === 'overlap') {
        console.log(`  ❌ [${nodes[i].id}] 与 [${nodes[j].id}] 重叠 (面积=${adj.area})`)
        overlapFound = true
        hasError = true
      }
    }
  }
  if (!overlapFound) console.log('  ✅ 无节点重叠')
  
  // 3. 验证每条 edge 是否紧贴
  console.log('\n' + '─'.repeat(40))
  console.log('3. 连接关系（edge）紧贴验证')
  console.log('─'.repeat(40))
  for (const e of edges) {
    const aId = e.from, bId = e.to
    const na = nodes.find(n => n.id === aId)
    const nb = nodes.find(n => n.id === bId)
    if (!na) { console.log(`  ❌ edge [${aId}, ${bId}]: 节点 ${aId} 不存在`); hasError = true; continue }
    if (!nb) { console.log(`  ❌ edge [${aId}, ${bId}]: 节点 ${bId} 不存在`); hasError = true; continue }
    
    if (na.floor !== nb.floor) {
      console.log(`  🔗 [${aId}] ↔ [${bId}]  跨楼层连接 (F${na.floor}↔F${nb.floor})`)
      continue
    }
    
    if (e.hidden) {
      console.log(`  🌙 [${aId}] ↔ [${bId}]  隐蔽路径 (不要求紧贴)`)
      continue
    }
    
    const adj = getAdjacency(na, nb)
    if (!adj) {
      console.log(`  ❌ [${aId}] ↔ [${bId}]  不相邻! (${na.name} 与 ${nb.name} 之间有间隙)`)
      hasError = true
    } else if (adj.type === 'overlap') {
      console.log(`  ⚠️  [${aId}] ↔ [${bId}]  重叠!`)
      hasError = true
    } else {
      console.log(`  ✅ [${aId}] ↔ [${bId}]  ${adj.type} (共享${adj.shared.axis}=${adj.shared.val}, 重叠=${adj.shared.overlap})`)
    }
  }
  
  // 4. 检查孤立节点（没有任何 edge 连接）
  console.log('\n' + '─'.repeat(40))
  console.log('4. 孤立节点检查')
  console.log('─'.repeat(40))
  for (const n of nodes) {
    const hasEdge = edges.some(e => (e.from === n.id || e.to === n.id))
    if (!hasEdge) {
      console.log(`  ⚠️  [${n.id}] ${n.name} 没有任何连接`)
    }
  }
  const allConnected = nodes.every(n => edges.some(e => (e.from === n.id || e.to === n.id)))
  if (allConnected) console.log('  ✅ 所有节点都有连接')
  
  // 5. 楼层统计
  console.log('\n' + '─'.repeat(40))
  console.log('5. 楼层统计')
  console.log('─'.repeat(40))
  const floors = [...new Set(nodes.map(n => n.floor))].sort()
  for (const f of floors) {
    const fn = nodes.filter(n => n.floor === f)
    const rooms = fn.filter(n => n.type === 'room')
    const corridors = fn.filter(n => n.type === 'corridor')
    console.log(`  F${f}: ${fn.length}节点 (${rooms.length}房间, ${corridors.length}走廊)`)
  }
  
  console.log('\n' + '='.repeat(60))
  if (hasError) {
    console.log('  ❌ 地图存在问题，请修复上述错误')
  } else {
    console.log('  ✅ 地图验证通过！')
  }
  console.log('='.repeat(60))
}

// 自动推导 edges
function autoEdges({ nodes, edges }) {
  console.log('\n' + '='.repeat(60))
  console.log('  自动推导紧贴关系（辅助 edge 设计）')
  console.log('='.repeat(60) + '\n')
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].floor !== nodes[j].floor) continue
      const adj = getAdjacency(nodes[i], nodes[j])
      if (adj && adj.type !== 'overlap') {
        const inEdges = edges.some(e => 
          (e.from === nodes[i].id && e.to === nodes[j].id) || (e.from === nodes[j].id && e.to === nodes[i].id))
        const mark = inEdges ? '✅ 已有edge' : '💡 可添加'
        console.log(`  ${mark} ['${nodes[i].id}', '${nodes[j].id}']  (${adj.type})`)
      }
    }
  }
}

// ASCII 可视化
function asciiMap({ grid, nodes }, floor) {
  const floors = floor ? [floor] : [...new Set(nodes.map(n => n.floor))].sort()
  
  for (const f of floors) {
    const fn = nodes.filter(n => n.floor === f)
    console.log(`\n${'='.repeat(60)}`)
    console.log(`  F${f} ASCII 布局预览`)
    console.log('='.repeat(60))
    
    // 创建网格
    const map = Array(grid.rows).fill(null).map(() => Array(grid.cols).fill('·'))
    const labelMap = Array(grid.rows).fill(null).map(() => Array(grid.cols).fill(''))
    
    for (const n of fn) {
      // 填充区域
      for (let y = n.y; y < n.y + n.h; y++) {
        for (let x = n.x; x < n.x + n.w; x++) {
          if (y >= 0 && y < grid.rows && x >= 0 && x < grid.cols) {
            map[y][x] = n.type === 'corridor' ? '░' : '█'
            // 标签放在中心
            if (y === n.y + Math.floor(n.h / 2) && x === n.x + Math.floor(n.w / 2)) {
              labelMap[y][x] = n.name
            }
          }
        }
      }
    }
    
    // 打印网格
    let header = '    '
    for (let x = 0; x < grid.cols; x++) header += (x % 5 === 0 ? x.toString().padStart(1) : ' ')
    console.log(header)
    
    for (let y = 0; y < grid.rows; y++) {
      let row = `${y.toString().padStart(2)}  `
      for (let x = 0; x < grid.cols; x++) {
        row += map[y][x]
      }
      // 如果该行有标签，追加
      const labels = labelMap[y].filter(l => l)
      if (labels.length > 0) {
        row += '  ← ' + labels.join(', ')
      }
      console.log(row)
    }
    
    // 打印节点信息
    console.log('\n  节点详情:')
    for (const n of fn) {
      console.log(`    [${n.id.padEnd(16)}] ${n.name.padEnd(6)} ${n.type.padEnd(8)} x=${n.x} y=${n.y} w=${n.w} h=${n.h}`)
    }
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2)
  const data = loadScript()
  
  if (data.nodes.length === 0) {
    console.error('❌ 未能解析出节点数据，请检查 script.js 格式')
    process.exit(1)
  }
  
  if (args.includes('--auto')) {
    autoEdges(data)
  } else if (args.includes('--ascii')) {
    asciiMap(data)
  } else {
    validate(data)
    asciiMap(data)
  }
}

main()