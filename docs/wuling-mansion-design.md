# 雾庄疑案 - 开放地图交互设计讨论记录

> 基于「雾庄疑案」(script-001) 扩展为开放地图 + 多人实时交互模式
> 状态：讨论中，逐步细化

---

## 一、已确定的设计决策

### 1. 移动方式：路径选择式
- 地图由位置节点组成，节点之间有连接关系
- 玩家只能移动到相邻位置（如大厅→书房）
- 移动过程中可能经过走廊，走廊是临时空间

### 2. 空间类型：走廊（临时空间） vs 房间（持久空间）
- **走廊（临时空间）**：
  - 交互能力：交谈 + 快速交换道具
  - 不能搜索、不能上锁
  - 玩家离开后走廊状态不保留
  - 走廊是"相遇点"——两人在移动中相遇时产生社交交互
- **房间（持久空间）**：
  - 交互能力：全部交互（搜索、上锁/解锁、使用道具、交谈、交换道具）
  - 房间状态会保留（门是否上锁、抽屉是否被搜过等）
  - 房间是"探索点"——核心线索和交互都在房间内

### 3. 玩家位置可见性：同房间可见
- 只有当两个玩家在同一位置时才能看到对方
- 其他位置的玩家位置完全不可见
- 类似真实探索——不知道其他人在哪，直到碰面
- Socket 广播范围：只广播给同一位置的玩家

### 5. 时间系统：剧本时间轴 + 异步推进
- **最小时间单位 = 1 段**（剧本内时间，如15分钟，由剧本定义）
- **剧本总时长 = N 段**（由剧本配置，如雾庄疑案 = 8段）
- **每个行动消耗固定段数**（系统级常量）：

| 行动 | 消耗段数 | 说明 |
|------|---------|------|
| 移动到相邻位置 | 1 | |
| 搜索一个物体 | 2 | 先到先得 |
| 交谈（一次对话） | 1 | 双方各消耗 |
| 交换道具 | 0 | 同位置即时 |
| 上锁/解锁 | 0 | 同位置即时 |
| 使用道具 | 1 | |

- **异步推进**：每个玩家独立推进当前时段
- **相遇判定**：两个玩家时段重叠 + 同一位置 → 触发相遇
- **快速行动**（0消耗）：不推进时段，仅限当前时段内同位置执行
- **起始位置**：分散，根据角色秘密分配

### 6. 搜索机制
- 线索挂在房间内的"可搜索物体"上（如书桌、废纸篓、保险箱）
- 物体被搜过后其他人搜不到（先到先得）
- 部分物体需要特定条件（钥匙/密码）才能搜索

---

## 二、待讨论的设计点

### A. 交谈系统
- [ ] 预设对话选项的来源：全局通用 vs 上下文动态生成？
- [ ] 对话选项是否消耗行动次数或有冷却？
- [ ] 对话是否触发线索交换/揭露？对方可拒绝回答吗？
- [ ] 对话内容对其他同房间玩家是否可见（多人 vs 一对一）？
- [ ] 是否有"说谎"机制？
- [ ] 自由输入文字聊天的可能性（未来扩展）
- [x] **整体设计暂缓**：需先明确「自由活动期间的偶遇交谈」与「集中讨论阶段的正式交流」的区别与各自作用，再单独设计

### B. 道具系统
- [x] 道具获取方式：搜索房间物体获得
- [x] 道具类型：钥匙类、证据类、信息类（密码等自动记录）
- [x] 道具使用条件：在特定位置使用（如钥匙在对应门）
- [x] 道具可以丢弃/放置在房间中（其他人可搜索发现）
- [x] 道具交换：不需要双方确认，各自选择是否交流，各自可忽略
- [x] 道具数量上限：无上限
- [x] 凶手可销毁证据：需要剧本提供特定条件/道具，未提供则不能销毁

### C. 地图与位置
- [x] 雾庄具体位置节点设计（13个节点：6房间+2走廊+1楼梯+大厅+花园+2楼3房间+2楼走廊+2楼楼梯）
- [x] 位置之间的连接关系图（含1条隐蔽路径 study↔garden）
- [ ] 每个房间的初始状态
- [x] 隐蔽路径机制（hidden edge + unlockBy 搜索条件，书房窗户→花园）
- [x] 地图视觉呈现方式（户型图风格：实心区域+墙线+门开口+紫色虚线隐蔽路径）
- [x] 地图工具链（声明式自动布局生成器 + 验证工具，详见第九章）
- [ ] 走廊停留是否有时间限制？

### D. 交互引擎
- [x] 交互是否有冷却/行动点限制：时间轴系统（时间段消耗）
- [x] 搜索结果：先到先得，物体被搜过后其他人搜不到
- [x] 行动消耗表已定义（移动1/搜索2/交谈1/交换0/上锁0/使用道具1）
- [x] 上锁/解锁权限：需要持有对应钥匙
- [x] 房间上锁后：无钥匙的玩家无法进入
- [ ] 是否有暴力交互（破坏门锁等）？
- [x] 交互结果是否对同房间玩家可见：相遇后系统通知
- [x] 相遇触发机制：同一时段 + 同一位置 = 相遇，系统通知

### E. 任务系统
- [x] **混合制**：角色秘密（隐式驱动）+ 少量关键任务提示（显式引导，每角色2-3条）
- [x] **任务不可见**：每个玩家只看到自己的任务和秘密
- [x] **无时段要求**：不强制"第N段必须完成"，玩家自由安排
- [x] **自动检测完成**：系统检查完成条件是否满足
- [x] **条件可被破坏**：其他玩家行为改变世界状态→任务变为无法完成（如道具被拿走、位置被锁）
- [x] **不主动通知**：系统不通知任务状态变化，玩家通过搜索/交互自然感知
- [x] **任务三状态**：未完成 / 已完成 / 已失败（条件破坏）
- [x] **分阵营任务**：凶手有布局/掩盖任务，其他人有个人目标/日常职责任务
- [x] **任务完成影响后续**：凶手布局质量影响案件细节和线索量；其他角色任务完成影响讨论阶段可获得的信息视角
- [ ] 具体影响机制的设计（哪些任务影响哪些后续环节）
- [ ] 任务定义格式（系统级模板）
- [ ] 雾庄疑案各角色的具体任务内容

### F. 游戏流程

**流程阶段（5+1）：**
```
P1 背景介绍 → P2 自由活动(含案发) → P3 第一轮讨论 → [可选]P4 简单调查 → P5 最终讨论 → P6 投票 → P7 真相
```

**已确定：**
- [x] P3搜证改为开放探索（P2自由活动 + 案件在P2内部发生）
- [x] 游戏从案发前开始（P2自由活动阶段）
- [x] P2完全自由探索，通过地图交互物体填充游戏性
- [x] 剧情推进采用双轨制：剧情必然事件 + 凶手可加戏
- [x] 凶手是布局而非决定杀不杀（案件必然发生）
- [x] P2产生的交互痕迹成为后续讨论线索
- [x] 流程简化为5+1阶段
- [x] 案件发生在P2内部，不是独立阶段（P2前半段案发前，后半段案发后）
- [x] 案发后直接进入讨论，不需要独立的调查阶段
- [x] P4简单调查为可选阶段，可能是特殊形式（如搜身调查）

**P2→P3 案件触发机制：**
- [x] 案发时间由剧本固定配置（如"第4段"），玩家不知情
- [x] 凶手不能决定何时犯罪，只能在案发前布局、案发后掩盖
- [x] 案发时间可通过线索推理得出（各角色时段轨迹等）
- [x] 案发时刻系统静默标记（玩家不知情），凶手可能也不主动知情
- [x] 尸体发现方式由剧本配置（进入即发现 / 搜索特定物体 / 需特定条件）
- [x] 系统提供"发现触发器"机制——剧本定义触发条件，满足时触发P3讨论
- [x] 保底机制：到指定时段无人发现 → 系统强制播报进入P3

**待定（简单处理，后续细化）：**
- [ ] P1→P2过渡：同步等待读完 vs 超时自动进入？（倾向：超时自动+手动确认）
- [ ] P3→P5过渡：第一轮讨论如何结束？（倾向：时限+手动发起结束投票）
- [ ] P5→P6过渡：最终讨论如何结束？（倾向：时限+手动发起投票）
- [ ] 地图状态在阶段切换时的处理
- [ ] P2案件发生时凶手是否通知：由剧本配置决定（间接手段不通知，直接手段自然知道）
- [ ] P4简单调查的具体设计
- [ ] 是否保留现有 Phase 系统：保留但重构
- [ ] 断线重连状态恢复

### G. 视频整合（后续阶段）
- [ ] 视频触发节点
- [ ] 个人观看 vs 全员同步
- [ ] 视频内选择如何影响世界状态

---

## 三、讨论进度

- [x] 移动方式确定
- [x] 空间类型确定
- [x] 位置可见性确定
- [x] 交谈形式初步确定（预设选项）
- [x] 地图节点设计
- [x] 时间系统设计（时间段+异步推进）
- [x] 搜索机制设计（先到先得）
- [x] 起始位置策略（分散）
- [x] 道具系统设计
- [x] 游戏流程设计（5+1阶段，P2含案发，双轨制）
- [x] P2→P3案件触发机制（剧本固定案发时间+发现触发器+保底播报）
- [x] 任务系统设计（混合制，自动检测，不通知）
- [ ] 交谈系统设计（暂缓，待明确作用后单独设计）
- [ ] P2自由活动细节（剧情触发点、可交互物体、NPC行为）
- [ ] 技术实现方案
- [ ] 视频整合方案

---

## 四、地图节点详细设计

### 位置节点列表

| 节点ID | 名称 | 类型 | 楼层 | 说明 |
|--------|------|------|------|------|
| `hall` | 大厅 | 房间 | 1F | 游戏起始点，壁炉/沙发/挂钟 |
| `corridor_a` | 一楼走廊 | 走廊 | 1F | 连接大厅、书房、厨房 |
| `study` | 书房 | 房间 | 1F | 案发现场，书桌/书架/保险箱/废纸篓/窗户 |
| `garden` | 花园 | 房间 | 1F | 泥地鞋印线索，书房窗台下 |
| `kitchen` | 厨房 | 房间 | 1F | 茶具/水井，通储藏室 |
| `storage` | 储藏室 | 房间 | 1F | 药品柜/杂物，安眠药线索 |
| `dining` | 餐厅 | 房间 | 1F | 餐具柜，用餐场所 |
| `staircase` | 楼梯 | 走廊 | 1F↔2F | 连接一楼和二楼 |
| `corridor_b` | 二楼走廊 | 走廊 | 2F | 连接主卧、少爷房、楼梯 |
| `master_bed` | 主卧 | 房间 | 2F | 李夫人卧室，梳妆台/衣柜 |
| `young_master_bed` | 少爷房 | 房间 | 2F | 李少爷卧室，烟斗/留学行李 |

### 连接关系

```
hall ↔ corridor_a
hall ↔ garden
hall ↔ dining
corridor_a ↔ study
corridor_a ↔ kitchen
kitchen ↔ storage
study ↔ garden (隐蔽路径，需窗户未锁)
hall ↔ staircase
staircase ↔ corridor_b
corridor_b ↔ master_bed
corridor_b ↔ young_master_bed
```

### 线索与空间关联

| 线索 | 所在位置 | 获取方式 |
|------|---------|---------|
| 修改后的遗嘱 | 书房-保险箱 | 搜索保险箱（需钥匙或密码） |
| 安眠药瓶 | 储藏室-药品柜 | 搜索药品柜 |
| 书房钥匙 | 管家初始持有 | 交换/获取（待定） |
| 带泥的鞋印 | 花园-窗台下 | 搜索花园地面 |
| 撕碎的信件 | 书房-废纸篓 | 搜索废纸篓 |
| 茶杯（白色粉末） | 书房-书桌 | 搜索书桌 |

---

## 五、道具系统详细设计

### 道具类型

| 类型 | 说明 | 示例 |
|------|------|------|
| 钥匙类 | 可使用（开门/开容器/上锁），可交换，可丢弃 | 书房钥匙 |
| 证据类 | 可查看（阅读描述），可交换，可丢弃，投票阶段可提交 | 遗嘱、安眠药瓶 |
| 信息类 | 获得后自动记录在"笔记"中，不需要作为物品持有 | 保险箱密码 |

### 雾庄疑案道具列表

| 道具ID | 名称 | 类型 | 初始位置 | 用途 |
|--------|------|------|---------|------|
| `key_study` | 书房钥匙 | 钥匙类 | 王管家初始持有 | 开保险箱/上锁书房门 |
| `clue_will` | 修改后的遗嘱 | 证据类 | 书房-保险箱 | 投票证据 |
| `clue_medicine` | 安眠药瓶 | 证据类 | 储藏室-药品柜 | 投票证据 |
| `clue_shoeprint` | 带泥鞋印 | 证据类 | 花园-窗台下 | 投票证据 |
| `clue_letter` | 撕碎的信件 | 证据类 | 书房-废纸篓 | 投票证据 |
| `clue_teacup` | 茶杯 | 证据类 | 书房-书桌 | 投票证据 |
| `info_safe_code` | 保险箱密码 | 信息类 | 书房-书架某书 | 开保险箱（替代钥匙） |

### 道具交互规则

| 操作 | 说明 | 时段消耗 |
|------|------|---------|
| 拾取 | 从搜索结果中获得道具 | 包含在搜索(2时段)中 |
| 查看 | 阅读道具描述 | 0（即时） |
| 交换 | 将道具给同位置玩家，不需确认，各自选择是否交流 | 0（即时） |
| 丢弃 | 将道具放在当前位置，其他人可搜索发现 | 0（即时） |
| 使用 | 在特定位置使用（如钥匙开门） | 1时段 |

### 证据销毁机制

- 凶手可销毁证据，但需要**剧本提供特定条件/道具**
- 系统不硬编码销毁逻辑
- 剧本可通过配置定义：哪些证据可销毁、需要什么条件（如特定道具、特定位置）
- 未提供销毁条件的剧本中，凶手不能销毁证据

---

## 六、剧本 Schema 定义

### 6.1 顶层结构

```jsonc
{
  "id": "script-001",            // 剧本唯一标识
  "title": "雾庄疑案",            // 剧本标题
  "cover": "...",                 // 封面图（URL 或 SVG data URI）
  "difficulty": 3,                // 难度 1-5
  "playerCount": 6,               // 玩家人数
  "duration": 120,                // 预计时长（分钟）
  "tags": ["民国", "推理", "本格"],
  "synopsis": "...",              // 简介
  "background": "...",            // 背景故事

  "clockStart": "20:00",          // 游戏内起始时间
  "segmentDuration": 30,          // 每段 = 多少分钟
  "totalSegments": 8,             // 总时段数
  "murderSegment": 4,             // 案发时段索引（0-based）
  "murderRoom": "study",          // 案发地点（node id）
  "murderMethod": "...",          // 案发方式描述（真相用）

  "grid": { "cols": 16, "rows": 10, "cellSize": 40 },
  "floors": [1, 2],               // 楼层列表

  "nodes": [...],                 // 地图节点（矩形区域）
  "edges": [...],                 // 连接关系
  "objects": [...],               // 可交互物体
  "items": [...],                 // 道具定义
  "characters": [...],            // 角色定义
  "clues": [...],                 // 线索列表（用于投票阶段展示）
  "phases": [...],                // 游戏阶段定义
  "discoveryTrigger": {...},      // 尸体发现触发器
  "truth": {...}                  // 真相揭晓内容
}
```

### 6.2 字段详细说明

#### 时钟配置

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `clockStart` | string | 是 | 起始时间，格式 `HH:MM`，如 `20:00` |
| `segmentDuration` | int | 是 | 每段代表多少分钟，如 `30` 表示每段=30分钟 |
| `totalSegments` | int | 是 | 总时段数，如 `8` 表示 20:00~24:00 |
| `murderSegment` | int | 是 | 案发时段索引（0-based），如 `4` 表示第5段=22:00 |
| `murderRoom` | string | 是 | 案发房间 node id |
| `murderMethod` | string | 否 | 案发方式描述，用于 P7 真相揭晓 |

**时钟换算公式**：
```
clockTime(segment) = clockStart + segment * segmentDuration 分钟
// 例：segment=4, clockStart=20:00, duration=30 → 22:00
```

#### 地图配置

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `grid.cols` | int | 是 | 方格总列数 |
| `grid.rows` | int | 是 | 方格总行数 |
| `grid.cellSize` | int | 是 | 每格像素大小（前端渲染用） |
| `floors` | int[] | 是 | 楼层列表，如 `[1, 2]` |

#### 节点（nodes[]）

每个节点是地图上的一个矩形区域：

```jsonc
{
  "id": "study",              // 唯一标识
  "name": "书房",              // 显示名称
  "type": "room",              // "room" | "corridor"
  "floor": 1,                  // 楼层
  "x": 3, "y": 1,              // 左上角方格坐标
  "w": 3, "h": 2,              // 宽高（方格数）
  "locked": false,             // 初始是否上锁（可选，默认 false）
  "lockKeyId": "key_study",    // 对应钥匙道具 id（可选）
  "isMurderScene": true        // 是否标记为案发现场（可选，前端特殊渲染）
}
```

**节点类型说明**：
- `room`：房间（持久空间），支持全部交互（搜索/上锁/使用道具/交谈/交换）
- `corridor`：走廊（临时空间），支持交谈+快速交换道具，不能搜索/上锁

#### 连接关系（edges[]）

```jsonc
[
  ["hall", "corridor_1f"],       // 双向连接
  ["staircase", "corridor_2f"],  // 楼梯跨楼层连接
  ["study", "garden"]            // 隐蔽路径
]
```

- 每条边是 `[nodeIdA, nodeIdB]` 的二元组
- 玩家只能移动到与当前所在节点有边连接的相邻节点
- 楼梯间节点同时出现在两楼层的边中，实现跨楼层

#### 可交互物体（objects[]）

```jsonc
{
  "id": "study_safe",             // 唯一标识
  "name": "保险箱",                // 显示名称
  "room": "study",                // 所在房间 node id
  "searchable": true,             // 是否可搜索（默认 true）
  "gives": "clue_will",           // 搜索后获得的道具 id（null = 无道具）
  "givesInfo": null,              // 搜索后获得的信息文本（可选，不作为道具）
  "searched": false,              // 运行时状态：是否已被搜索（初始 false）
  "requires": {                   // 搜索前置条件（可选）
    "type": "key",                // "key" | "password" | "item"
    "itemId": "key_study"         // 需要的道具 id
  },
  "isBody": false,                // 是否为尸体（触发发现机制）
  "destroyable": false,           // 是否可被凶手销毁（可选）
  "destroyedBy": null             // 运行时状态：被谁销毁（初始 null）
}
```

**搜索条件类型**：
| type | 说明 | requires 示例 |
|------|------|--------------|
| `key` | 需持有特定钥匙道具 | `{"type":"key","itemId":"key_study"}` |
| `password` | 需持有信息类道具（密码） | `{"type":"password","itemId":"info_safe_code"}` |
| `item` | 需持有任意指定道具 | `{"type":"item","itemId":"clue_medicine"}` |

#### 道具（items[]）

```jsonc
{
  "id": "clue_will",              // 唯一标识
  "name": "修改后的遗嘱",          // 显示名称
  "type": "evidence",             // "key" | "evidence" | "info"
  "description": "...",           // 详细描述（玩家查看时显示）
  "initialHolder": "wang_guanjia", // 初始持有者角色 id（null = 在物体中）
  "initialLocation": null,        // 初始所在物体 id（null = 角色持有）
  "usableAt": ["study"],          // 可使用位置（node id 列表，空=任意位置）
  "destroyable": false            // 是否可被销毁（可选，仅凶手可操作）
}
```

**道具类型**：
| type | 说明 | 交互能力 |
|------|------|---------|
| `key` | 钥匙类 | 使用（开门/开容器/上锁）、交换、丢弃 |
| `evidence` | 证据类 | 查看、交换、丢弃、投票阶段可提交 |
| `info` | 信息类 | 获得后自动记录到笔记，不占道具栏 |

#### 角色（characters[]）

```jsonc
{
  "id": "li_furen",               // 唯一标识
  "name": "李夫人",                // 显示名称
  "color": "#e91e63",             // 地图标记颜色
  "avatar": "...",                // 头像（URL 或 SVG data URI）
  "gender": "女",                 // 性别
  "age": 38,                      // 年龄
  "occupation": "李老爷之妻",       // 职业
  "intro": "...",                 // 公开介绍（所有人可见）
  "secret": "...",                // 秘密剧本（仅该角色可见）
  "startLocation": "master_bed",  // 起始位置 node id
  "isMurderer": false,            // 是否为凶手
  "startItems": ["key_study"],    // 初始持有道具 id 列表（可选）
  "tasks": [                      // 个人任务列表
    {
      "id": "t_li_1",
      "name": "取回书房保险箱中的遗嘱",
      "completeCondition": {      // 完成条件
        "type": "hasItem",
        "itemId": "clue_will"
      }
    }
  ]
}
```

**任务完成条件类型**：
| type | 说明 | 字段 |
|------|------|------|
| `hasItem` | 持有指定道具 | `itemId` |
| `searchedObject` | 搜索过指定物体 | `objectId` |
| `visitedRooms` | 访问过所有指定房间 | `roomIds[]` |
| `usedItemAt` | 在指定位置使用过指定道具 | `itemId`, `location` |

#### 线索列表（clues[]）

用于投票阶段的证据展示和 P7 真相揭晓：

```jsonc
{
  "id": "c1",
  "name": "修改后的遗嘱",
  "description": "遗嘱被修改，李少爷继承份额减少，李夫人获益。",
  "source": "study_safe",         // 来源物体 id
  "relatedCharacter": "li_furen"  // 关联角色（可选）
}
```

#### 游戏阶段（phases[]）

```jsonc
{
  "id": "p1",
  "name": "背景介绍",
  "type": "intro",                // intro | free_activity | discuss | investigate | vote | reveal
  "description": "...",
  "autoAdvance": false,           // 是否自动推进到下一阶段
  "autoAdvanceDelay": 60,         // 自动推进延迟（秒）
  "allowMap": false,              // 是否允许地图操作
  "allowChat": false              // 是否允许聊天
}
```

**标准阶段流程**：
| 阶段 | type | 说明 |
|------|------|------|
| P1 | `intro` | 背景介绍，读背景故事 |
| P2 | `free_activity` | 自由活动+案发，地图交互核心 |
| P3 | `discuss` | 第一轮讨论 |
| P4 | `investigate` | 可选简单调查 |
| P5 | `discuss` | 最终讨论 |
| P6 | `vote` | 投票表决 |
| P7 | `reveal` | 真相揭晓 |

#### 尸体发现触发器（discoveryTrigger）

```jsonc
{
  "type": "enter_room",           // "enter_room" | "search_object" | "auto_announce"
  "targetRoom": "study",          // 触发房间
  "targetObject": "study_body",   // 触发物体（search_object 类型用）
  "fallbackSegment": 6,           // 保底时段：到此段无人发现则强制播报
  "announceText": "张护工在书房发现了李老爷的尸体！"  // 播报文案
}
```

#### 真相揭晓（truth）

```jsonc
{
  "summary": "王管家趁夜间在茶水中下了安眠药...",    // 案情概述
  "murderer": "wang_guanjia",                        // 凶手角色 id
  "murdererReason": "李老爷打算卖掉雾庄，管家一生心血将毁",  // 杀人动机
  "timeline": [                                      // 真实时间线
    { "time": "20:00", "event": "众人分散活动" },
    { "time": "21:30", "event": "王管家在储藏室取安眠药" },
    { "time": "22:00", "event": "王管家将药放入书房茶杯，李老爷饮下" },
    { "time": "22:30", "event": "李老爷毒发身亡" }
  ],
  "keyClues": ["clue_teacup", "clue_medicine"]       // 关键证据 id 列表
}
```

---

## 七、完整剧本 Schema Example — 雾庄疑案

```jsonc
{
  "id": "script-001",
  "title": "雾庄疑案",
  "cover": "data:image/svg+xml,...",
  "difficulty": 3,
  "playerCount": 6,
  "duration": 120,
  "tags": ["民国", "推理", "本格"],
  "synopsis": "民国二十六年，雾庄主人李老爷在书房离奇身亡。当夜暴雨封山，六位嫌疑人被困庄内。谁是真凶？",
  "background": "民国二十六年深秋，江南雾庄。李老爷在书房内离奇身亡，门窗紧锁，现场无打斗痕迹。当夜暴雨如注，山路封锁，庄中六人无法离开。警官尚未赶到，真相只能由你们自己揭开……",

  // ===== 时钟配置 =====
  "clockStart": "20:00",
  "segmentDuration": 30,
  "totalSegments": 8,
  "murderSegment": 4,
  "murderRoom": "study",
  "murderMethod": "安眠药溶于茶水，李老爷饮下后毒发身亡",

  // ===== 地图配置 =====
  "grid": { "cols": 16, "rows": 10, "cellSize": 40 },
  "floors": [1, 2],

  // ===== 地图节点 =====
  "nodes": [
    // --- 一楼 ---
    { "id": "hall",            "name": "大厅",       "type": "room",     "floor": 1, "x": 5, "y": 5, "w": 4, "h": 3 },
    { "id": "corridor_1f",     "name": "一楼走廊",   "type": "corridor", "floor": 1, "x": 4, "y": 3, "w": 8, "h": 1 },
    { "id": "study",           "name": "书房",       "type": "room",     "floor": 1, "x": 3, "y": 1, "w": 3, "h": 2, "isMurderScene": true },
    { "id": "kitchen",         "name": "厨房",       "type": "room",     "floor": 1, "x": 1, "y": 1, "w": 2, "h": 2 },
    { "id": "storage",         "name": "储藏室",     "type": "room",     "floor": 1, "x": 1, "y": 3, "w": 2, "h": 2 },
    { "id": "dining",          "name": "餐厅",       "type": "room",     "floor": 1, "x": 9, "y": 1, "w": 3, "h": 2 },
    { "id": "garden",          "name": "花园",       "type": "room",     "floor": 1, "x": 6, "y": 8, "w": 4, "h": 2 },
    { "id": "staircase",       "name": "楼梯间",     "type": "corridor", "floor": 1, "x": 12,"y": 3, "w": 2, "h": 2 },
    // --- 二楼 ---
    { "id": "corridor_2f",     "name": "二楼走廊",   "type": "corridor", "floor": 2, "x": 4, "y": 3, "w": 8, "h": 1 },
    { "id": "master_bed",      "name": "主卧",       "type": "room",     "floor": 2, "x": 3, "y": 1, "w": 3, "h": 2 },
    { "id": "young_master_bed","name": "少爷房",     "type": "room",     "floor": 2, "x": 9, "y": 1, "w": 3, "h": 2 },
    { "id": "guest_bed",       "name": "客房",       "type": "room",     "floor": 2, "x": 1, "y": 1, "w": 2, "h": 2 }
  ],

  // ===== 连接关系 =====
  "edges": [
    ["hall", "corridor_1f"],
    ["corridor_1f", "study"],
    ["corridor_1f", "kitchen"],
    ["corridor_1f", "dining"],
    ["kitchen", "storage"],
    ["hall", "garden"],
    ["corridor_1f", "staircase"],
    ["staircase", "corridor_2f"],
    ["corridor_2f", "master_bed"],
    ["corridor_2f", "young_master_bed"],
    ["corridor_2f", "guest_bed"],
    ["study", "garden"]
  ],

  // ===== 可交互物体 =====
  "objects": [
    // 书房
    { "id": "study_desk",         "name": "书桌",       "room": "study",    "gives": "clue_teacup" },
    { "id": "study_wastebasket",  "name": "废纸篓",     "room": "study",    "gives": "clue_letter" },
    { "id": "study_safe",         "name": "保险箱",     "room": "study",    "gives": "clue_will",
      "requires": { "type": "key", "itemId": "key_study" } },
    { "id": "study_bookshelf",    "name": "书架",       "room": "study",    "gives": "info_safe_code" },
    { "id": "study_body",         "name": "李老爷的遗体", "room": "study",  "gives": null, "isBody": true },
    // 储藏室
    { "id": "storage_cabinet",    "name": "药品柜",     "room": "storage",  "gives": "clue_medicine" },
    // 花园
    { "id": "garden_ground",      "name": "窗台下地面", "room": "garden",   "gives": "clue_shoeprint" },
    // 主卧
    { "id": "master_dresser",     "name": "梳妆台",     "room": "master_bed","gives": null },
    { "id": "master_wardrobe",    "name": "衣柜",       "room": "master_bed","gives": null },
    // 少爷房
    { "id": "young_pipe",         "name": "烟斗",       "room": "young_master_bed", "gives": null },
    { "id": "young_luggage",      "name": "留学行李",   "room": "young_master_bed", "gives": null },
    // 客房
    { "id": "guest_nightstand",   "name": "床头柜",     "room": "guest_bed","gives": null },
    // 厨房
    { "id": "kitchen_teaset",     "name": "茶具",       "room": "kitchen",  "gives": null },
    // 餐厅
    { "id": "dining_cabinet",     "name": "餐具柜",     "room": "dining",   "gives": null },
    // 大厅
    { "id": "hall_fireplace",     "name": "壁炉",       "room": "hall",     "gives": null },
    { "id": "hall_clock",         "name": "挂钟",       "room": "hall",     "gives": null }
  ],

  // ===== 道具 =====
  "items": [
    { "id": "key_study",       "name": "书房钥匙",       "type": "key",      "initialHolder": "wang_guanjia", "usableAt": ["study"] },
    { "id": "clue_will",       "name": "修改后的遗嘱",   "type": "evidence", "initialLocation": "study_safe",
      "description": "遗嘱被修改，李少爷的继承份额大幅减少，李夫人获益。" },
    { "id": "clue_medicine",   "name": "安眠药瓶",       "type": "evidence", "initialLocation": "storage_cabinet",
      "description": "药品柜中缺失的安眠药瓶，瓶内少了几颗。" },
    { "id": "clue_shoeprint",  "name": "带泥的鞋印",     "type": "evidence", "initialLocation": "garden_ground",
      "description": "书房窗台下有带泥的鞋印，有人从花园进入书房。" },
    { "id": "clue_letter",     "name": "撕碎的信件",     "type": "evidence", "initialLocation": "study_wastebasket",
      "description": "被撕碎的信件残片，隐约可见\"……威胁……必须……\"字样。" },
    { "id": "clue_teacup",     "name": "茶杯",           "type": "evidence", "initialLocation": "study_desk",
      "description": "书房桌上的茶杯，底部有白色粉末残留。" },
    { "id": "info_safe_code",  "name": "保险箱密码",     "type": "info",     "initialLocation": "study_bookshelf",
      "description": "从书架某书中发现的纸条，写着保险箱密码：19840315。" }
  ],

  // ===== 角色 =====
  "characters": [
    {
      "id": "li_furen", "name": "李夫人", "color": "#e91e63",
      "gender": "女", "age": 38, "occupation": "李老爷之妻",
      "intro": "李老爷的结发妻子，温婉端庄，掌管雾庄内务。",
      "secret": "你发现李老爷近期秘密修改了遗嘱。你知道保险箱的密码。修改后的遗嘱对你有利，你需要在别人发现前取走它。",
      "startLocation": "master_bed", "isMurderer": false,
      "tasks": [
        { "id": "t_li_1", "name": "取回书房保险箱中的遗嘱",
          "completeCondition": { "type": "hasItem", "itemId": "clue_will" } }
      ]
    },
    {
      "id": "li_shaoye", "name": "李少爷", "color": "#2196f3",
      "gender": "男", "age": 22, "occupation": "李老爷独子",
      "intro": "李老爷的独子，刚从西洋留学归来，性格不羁。",
      "secret": "你留学期间挥霍无度欠下巨债。案发前与父亲大吵一架。当晚你在花园吸烟，看到书房灯光闪烁。",
      "startLocation": "garden", "isMurderer": false,
      "tasks": [
        { "id": "t_ls_1", "name": "搜索书房寻找线索",
          "completeCondition": { "type": "searchedObject", "objectId": "study_desk" } }
      ]
    },
    {
      "id": "wang_guanjia", "name": "王管家", "color": "#4caf50",
      "gender": "男", "age": 50, "occupation": "雾庄管家",
      "intro": "雾庄老管家，侍奉李家三十年，忠心耿耿。",
      "secret": "你忠于李老爷，持有书房钥匙。你发现李老爷打算卖掉雾庄，你一生的心血将毁于一旦。你在茶水中下了安眠药。",
      "startLocation": "corridor_1f", "isMurderer": true,
      "startItems": ["key_study"],
      "tasks": [
        { "id": "t_wg_1", "name": "从储藏室获取安眠药",
          "completeCondition": { "type": "searchedObject", "objectId": "storage_cabinet" } },
        { "id": "t_wg_2", "name": "将安眠药放入书房茶杯",
          "completeCondition": { "type": "usedItemAt", "itemId": "clue_medicine", "location": "study" } },
        { "id": "t_wg_3", "name": "巡视一楼所有房间",
          "completeCondition": { "type": "visitedRooms", "roomIds": ["study", "kitchen", "dining", "storage"] } }
      ]
    },
    {
      "id": "zhao_yisheng", "name": "赵医生", "color": "#ff9800",
      "gender": "男", "age": 45, "occupation": "家庭医生",
      "intro": "李老爷的私人医生，定期来雾庄出诊。",
      "secret": "你一直在为李老爷开具安眠药处方。你的医疗事故记录被李老爷掌握，他以此威胁你免费出诊。",
      "startLocation": "dining", "isMurderer": false,
      "tasks": [
        { "id": "t_zy_1", "name": "检查储藏室药品柜",
          "completeCondition": { "type": "searchedObject", "objectId": "storage_cabinet" } }
      ]
    },
    {
      "id": "chen_xiaojie", "name": "陈小姐", "color": "#9c27b0",
      "gender": "女", "age": 25, "occupation": "李老爷秘书",
      "intro": "李老爷的私人秘书，负责处理商业文书。",
      "secret": "你是李老爷秘密收养的女儿，也是遗嘱修改的受益人。你知道遗嘱的修改过程。",
      "startLocation": "hall", "isMurderer": false,
      "tasks": [
        { "id": "t_cx_1", "name": "调查书房现场",
          "completeCondition": { "type": "searchedObject", "objectId": "study_wastebasket" } }
      ]
    },
    {
      "id": "zhang_hugong", "name": "张护工", "color": "#795548",
      "gender": "女", "age": 30, "occupation": "雾庄护工",
      "intro": "负责照顾李老爷起居的护工，勤劳本分。",
      "secret": "你曾偷拿药品被管家发现，管家以此要挟你。案发当晚你被管家叫去书房送茶水，但送到时门紧锁无人应答。",
      "startLocation": "kitchen", "isMurderer": false,
      "tasks": [
        { "id": "t_zh_1", "name": "前往书房送茶水",
          "completeCondition": { "type": "visitedRooms", "roomIds": ["study"] } }
      ]
    }
  ],

  // ===== 线索列表 =====
  "clues": [
    { "id": "c1", "name": "修改后的遗嘱",   "description": "遗嘱被修改，李少爷继承份额减少，李夫人获益。", "source": "study_safe",        "relatedCharacter": "li_furen" },
    { "id": "c2", "name": "安眠药瓶",       "description": "药瓶已空，上周才配的药。",                      "source": "storage_cabinet",   "relatedCharacter": "zhao_yisheng" },
    { "id": "c3", "name": "书房钥匙",       "description": "管家持有的书房备用钥匙。",                      "source": "wang_guanjia",      "relatedCharacter": "wang_guanjia" },
    { "id": "c4", "name": "带泥的鞋印",     "description": "书房窗台下花园泥地有新鲜鞋印。",                "source": "garden_ground",     "relatedCharacter": "li_shaoye" },
    { "id": "c5", "name": "撕碎的信件",     "description": "废纸篓中信件碎片，隐约可见\"威胁\"字样。",       "source": "study_wastebasket", "relatedCharacter": null },
    { "id": "c6", "name": "茶杯",           "description": "书房桌上茶杯，杯底有白色粉末残留。",            "source": "study_desk",        "relatedCharacter": "wang_guanjia" }
  ],

  // ===== 游戏阶段 =====
  "phases": [
    { "id": "p1", "name": "背景介绍",   "type": "intro",         "description": "主持人叙述案件背景，所有玩家了解故事全貌。",       "autoAdvance": true, "autoAdvanceDelay": 60, "allowMap": false, "allowChat": false },
    { "id": "p2", "name": "自由活动",   "type": "free_activity", "description": "自由探索雾庄，搜索线索，与其他角色交互。",        "autoAdvance": false,                        "allowMap": true,  "allowChat": true  },
    { "id": "p3", "name": "第一轮讨论", "type": "discuss",       "description": "围绕发现尸体和搜集到的线索进行第一轮讨论。",     "autoAdvance": true, "autoAdvanceDelay": 600,"allowMap": false, "allowChat": true  },
    { "id": "p4", "name": "简单调查",   "type": "investigate",   "description": "可选阶段：限定时间内的补充搜证。",               "autoAdvance": true, "autoAdvanceDelay": 300,"allowMap": true,  "allowChat": true  },
    { "id": "p5", "name": "最终讨论",   "type": "discuss",       "description": "最终讨论，整合所有线索进行推理。",               "autoAdvance": true, "autoAdvanceDelay": 600,"allowMap": false, "allowChat": true  },
    { "id": "p6", "name": "投票表决",   "type": "vote",          "description": "每人投出一票，指认你认为的凶手。",               "autoAdvance": true, "autoAdvanceDelay": 120,"allowMap": false, "allowChat": true  },
    { "id": "p7", "name": "真相揭晓",   "type": "reveal",        "description": "公布案件真相，游戏结束。",                       "autoAdvance": false,                        "allowMap": false, "allowChat": true  }
  ],

  // ===== 尸体发现触发器 =====
  "discoveryTrigger": {
    "type": "search_object",
    "targetRoom": "study",
    "targetObject": "study_body",
    "fallbackSegment": 6,
    "announceText": "有人在书房发现了李老爷的遗体！"
  },

  // ===== 真相揭晓 =====
  "truth": {
    "summary": "王管家趁夜间巡视之机，从储藏室药品柜取得安眠药，放入书房茶杯中。李老爷饮下茶水后毒发身亡。",
    "murderer": "wang_guanjia",
    "murdererReason": "李老爷打算卖掉雾庄解困，管家一生的心血将毁于一旦。",
    "timeline": [
      { "time": "20:00", "event": "众人分散活动，各自开始夜间行动" },
      { "time": "20:30", "event": "王管家持钥匙巡视一楼" },
      { "time": "21:00", "event": "王管家在储藏室药品柜取走安眠药" },
      { "time": "21:30", "event": "王管家进入书房，将安眠药放入茶杯" },
      { "time": "22:00", "event": "李老爷回到书房饮下茶水" },
      { "time": "22:30", "event": "李老爷安眠药毒性发作身亡" },
      { "time": "23:00", "event": "暴雨封山，庄内六人被困" }
    ],
    "keyClues": ["clue_teacup", "clue_medicine", "clue_will"]
  }
}
```

---

## 八、主项目对接方案

### 8.1 数据库 Schema 变更

现有 `scripts` 表的 `roles`/`clues`/`phases` 三个 JSONB 字段需要扩展为支持新 Schema 的结构。有两种方案：

**方案 A：扩展 JSONB 字段（推荐，改动最小）**

不新增表，而是扩展现有 JSONB 字段内容结构：

```sql
-- scripts 表不变，但 JSONB 字段内容结构升级
-- roles JSONB：从 [{id,name,secret,isKiller}] 扩展为完整的 characters 结构
-- clues JSONB：从 [{id,name,description,phaseId}] 扩展为 clues + items + objects + truth 合并
-- phases JSONB：从 DEFAULT_PHASES 扩展为含 autoAdvance/allowMap/allowChat 的新结构

-- rooms 表新增字段
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS game_state JSONB DEFAULT '{}'::jsonb;
-- game_state 存储运行时状态：玩家位置/时段/道具/物体搜索状态/门锁状态等

-- room_players 表新增字段
ALTER TABLE room_players ADD COLUMN IF NOT EXISTS role_id VARCHAR(20);
-- 已有 role_id，无需变更

-- votes 表不变（已有 target_role_id）
```

**运行时状态（game_state JSONB）结构**：
```jsonc
{
  "phase": "free_activity",        // 当前阶段
  "phaseIdx": 1,                   // 阶段索引
  "players": {
    "userId-1": {
      "characterId": "li_furen",
      "location": "master_bed",    // 当前位置
      "segment": 0,                // 当前时段
      "items": [],                 // 持有道具 id 列表
      "visitedRooms": [],          // 访问过的房间
      "searchedObjects": [],       // 搜索过的物体
      "notes": []                  // 信息笔记
    }
  },
  "objects": {                     // 物体运行时状态
    "study_safe": { "searched": true, "searchedBy": "userId-1" },
    "study_body": { "searched": false, "discovered": false }
  },
  "doors": {                       // 门锁状态
    "study": { "locked": false, "lockedBy": null }
  },
  "murderTriggered": false,        // 案发是否已触发
  "bodyDiscovered": false,         // 尸体是否已发现
  "meetingLog": []                 // 相遇记录
}
```

**方案 B：新增专用表（后续优化）**

如果运行时状态复杂度增长，可拆分为独立表：
```sql
CREATE TABLE game_object_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  object_id VARCHAR(50),
  searched BOOLEAN DEFAULT FALSE,
  searched_by UUID REFERENCES users(id),
  ...
);
```
初期推荐方案 A，用 JSONB 存储，减少表关联查询。

### 8.2 Mock 数据迁移（mock-scripts.js）

现有 `MOCK_SCRIPTS` 中每个剧本的 `roles`/`clues`/`phases` 结构需要升级为新 Schema。

**迁移策略**：
1. `roles` → 合并到 `characters` 结构，增加 `startLocation`/`tasks`/`startItems`/`color`
2. `clues` → 拆分为 `objects`（可搜索物体）+ `items`（道具）+ `clues`（投票展示）+ `truth`（真相）
3. `phases` → 升级为含 `autoAdvance`/`allowMap`/`allowChat` 的新结构
4. 新增顶层字段：`clockStart`/`segmentDuration`/`totalSegments`/`murderSegment`/`murderRoom`/`grid`/`nodes`/`edges`/`discoveryTrigger`

**向后兼容**：
- 新 Schema 是旧 Schema 的超集
- 前端读取时做字段降级处理（旧剧本缺少 `nodes` 等字段时，回退到旧的阶段制模式）
- Demo 剧本（script-001）先行升级为完整新 Schema

### 8.3 Socket 事件扩展

现有 socket 事件 vs 新增事件：

| 事件 | 方向 | 状态 | 说明 |
|------|------|------|------|
| `room:join` / `room:leave` | C→S | 已有 | 加入/离开房间 |
| `player:ready` | C→S | 已有 | 准备状态 |
| `game:start` | C→S | 已有 | 游戏开始 |
| `game:phaseChange` | C→S | 已有 | 阶段推进 |
| `game:vote` | C→S | 已有 | 投票 |
| `game:end` | C→S | 已有 | 游戏结束 |
| **`game:action`** | **C→S** | **新增** | **玩家行动（移动/搜索/使用道具/交换/上锁）** |
| **`game:actionResult`** | **S→C** | **新增** | **行动结果反馈（发给行动者）** |
| **`game:meeting`** | **S→C** | **新增** | **相遇通知（发给同位置玩家）** |
| **`game:globalEvent`** | **S→C** | **新增** | **全局事件播报（如尸体发现）** |
| **`game:stateSync`** | **S→C** | **新增** | **状态同步（发给房间全员，不含秘密信息）** |
| `game:voteUpdate` / `game:voteResult` | S→C | 已有 | 投票进度/结果 |
| `game:clueRevealed` | C→S | 已有 | 线索翻看 |
| `player:disconnected` | S→C | 已有 | 断线通知 |

**`game:action` 事件结构**：
```jsonc
// 客户端 → 服务端
{
  "roomId": "uuid",
  "action": {
    "type": "move",              // move | search | useItem | dropItem | giveItem | lock
    "target": "study",           // move: 目标节点 | search: 物体 id
    "itemId": "clue_medicine",   // useItem/dropItem/giveItem: 道具 id
    "targetUserId": "uuid",      // giveItem: 接收者
    "lock": true                 // lock: true=上锁, false=解锁
  }
}

// 服务端 → 客户端（行动者）
{
  "success": true,
  "action": "move",
  "message": "你移动到了书房",
  "newState": {                  // 该玩家可见的状态增量
    "location": "study",
    "segment": 1,
    "clockCurrent": "20:30"
  }
}

// 服务端 → 客户端（同位置玩家）
{
  "type": "meeting",
  "characterId": "li_shaoye",
  "characterName": "李少爷",
  "location": "study"
}

// 服务端 → 全房间（全局事件）
{
  "type": "body_discovered",
  "message": "有人在书房发现了李老爷的遗体！",
  "phase": "discuss"             // 触发阶段切换
}
```

### 8.4 后端游戏引擎（新增 server/game/engine.js）

从 demo 的 `game.js` 提取核心逻辑，适配主项目的 PostgreSQL + Socket.IO 架构：

```
server/
├── game/
│   ├── engine.js          # 游戏引擎核心（从 demo/game.js 迁移）
│   ├── actions.js         # 行动处理器（move/search/useItem/...）
│   ├── clock.js           # 时钟计算工具
│   └── state.js           # 状态管理（读写 game_state JSONB）
├── socket/
│   └── index.js           # 扩展 game:action 等新事件
├── db/
│   ├── schema.sql         # 新增 game_state 字段
│   └── mock-scripts.js    # 升级为新 Schema
└── routes/
    └── rooms.js           # buildRoomState 适配新结构
```

### 8.5 前端页面改造

| 页面 | 改造内容 |
|------|---------|
| `Play.jsx` | 集成 MapView + Clock + Sidebar 组件，处理 `game:action`/`game:meeting`/`game:globalEvent` 事件 |
| 新增 `MapView.jsx` | 从 demo 迁移方格户型图组件 |
| 新增 `Clock.jsx` | 从 demo 迁移时钟组件 |
| 新增 `Sidebar.jsx` | 从 demo 迁移侧边栏（道具/搜索/任务/日志） |
| `Play.css` | 合并 demo 的 map/clock 相关样式 |

### 8.6 对接步骤（优先级排序）

1. **DB Schema 变更**：`rooms` 表新增 `game_state` JSONB 字段
2. **后端引擎**：从 demo `game.js` 提取 `server/game/engine.js`，适配 PostgreSQL
3. **Socket 扩展**：在 `socket/index.js` 中新增 `game:action` 事件处理
4. **Mock 数据升级**：`mock-scripts.js` 中 script-001 升级为新 Schema
5. **前端组件迁移**：demo 的 MapView/Clock/Sidebar 迁移到主项目 `src/components/`
6. **Play.jsx 集成**：替换现有阶段制 UI 为地图+时钟交互模式
7. **联调测试**：6 人完整流程测试

## 九、地图工具

### 9.1 工具概览

地图工具包含两个独立脚本，位于 `demo/server/` 下：

| 工具 | 文件 | 用途 |
|------|------|------|
| 自动布局生成器 | `map-generator.cjs` | 从声明式输入（无坐标）自动生成房间坐标布局 |
| 布局验证工具 | `map-tool.cjs` | 验证现有 `script.js` 中的地图坐标是否合法 |

### 9.2 自动布局生成器（map-generator.cjs）

#### 设计理念

剧本作者只需描述**房间列表**和**连接关系**，不需要手动计算坐标。生成器自动完成：
- 按楼层分组，每层一条横贯走廊
- 房间排列在走廊上方/下方，与走廊紧贴
- 楼梯间放在走廊末端，连接上下楼层
- 间接连接的房间（如花园通过大厅连接走廊）紧贴父房间放置

#### 声明式输入格式

创建一个 JSON 文件（如 `wuling-layout.json`）：

```jsonc
{
  "grid": { "cols": 16, "rows": 10, "cellSize": 40 },
  "nodes": [
    // 不需要写 x/y/w/h，生成器自动计算
    { "id": "corridor_1f", "name": "一楼走廊", "type": "corridor", "floor": 1 },
    { "id": "study",       "name": "书房",     "type": "room", "floor": 1 },
    { "id": "hall",        "name": "大厅",     "type": "room", "floor": 1, "w": 5 },
    { "id": "garden",      "name": "花园",     "type": "room", "floor": 1, "w": 5 },
    { "id": "staircase",   "name": "楼梯间",   "type": "corridor", "floor": 1 }
    // ...
  ],
  "edges": [
    ["hall", "corridor_1f"],         // 普通连接（数组格式）
    ["corridor_1f", "study"],
    ["hall", "garden"],              // room-room 直连
    // 隐蔽路径（对象格式，hidden: true）
    { "from": "study", "to": "garden", "hidden": true, "unlockBy": { "type": "searchedObject", "objectId": "garden_ground" } }
  ]
}
```

**节点可选字段**：
- `w`：自定义房间宽度（格），默认 3
- 隐蔽路径不参与布局邻接计算，不影响房间排列

**edge 格式**：
- 普通连接：`["nodeA", "nodeB"]`（数组）
- 隐蔽路径：`{ "from": "nodeA", "to": "nodeB", "hidden": true, "unlockBy": {...} }`（对象）

#### 使用方法

```bash
# 生成布局并打印到控制台
node map-generator.cjs wuling-layout.json

# 生成并输出到文件
node map-generator.cjs wuling-layout.json --output script.js

# 查看用法
node map-generator.cjs
```

#### 代码调用（编程方式）

```js
const { generateLayout, generateFromDeclarative, formatAsScriptCode } = require('./map-generator.cjs')

// 从声明式输入生成
const result = generateFromDeclarative(input)
// result.nodes  → 含坐标的节点数组
// result.edges  → 标准化的边数组

// 格式化为 script.js 代码片段
const code = formatAsScriptCode(result)
```

#### 布局规则

1. **走廊横贯**：每层楼一条走廊，固定 `y=4`，从 `x=2` 开始
2. **房间分排**：直连走廊的房间交替分配到走廊上方（`y=3`）和下方（`y=5`），保持宽度平衡
3. **有子房间的优先下方**：如果直连房间有间接连接的子房间，优先放在下方排
4. **间接连接房间紧贴父房间**：如花园（garden）通过大厅（hall）连接，garden 放在 hall 正下方紧贴
5. **楼梯间在走廊末端**：右侧放置，宽度 3 格
6. **隐蔽路径不参与布局**：hidden edge 不影响房间邻接计算和排列

### 9.3 布局验证工具（map-tool.cjs）

验证 `script.js` 中的地图数据是否合法：

```bash
# 完整验证（越界+重叠+edge紧贴+孤立节点+楼层统计+ASCII预览）
node map-tool.cjs

# 自动推导紧贴关系（辅助 edge 设计）
node map-tool.cjs --auto

# 只输出 ASCII 地图预览
node map-tool.cjs --ascii
```

**验证项目**：
1. 节点越界检查（坐标是否超出 grid 范围）
2. 节点重叠检查（同楼层是否有矩形重叠）
3. edge 紧贴验证（每条 edge 两端是否共享一条边）
4. 孤立节点检查（没有任何 edge 连接的节点）
5. 楼层统计（每层节点/房间/走廊数量）
6. ASCII 可视化预览

### 9.4 完整工作流程

```
1. 编写声明式输入文件（如 wuling-layout.json）
   ↓
2. 运行生成器：node map-generator.cjs wuling-layout.json
   ↓  （检查控制台输出的布局预览）
3. 将生成的代码复制到 script.js（或用 --output 直接输出）
   ↓
4. 运行验证工具：node map-tool.cjs
   ↓  （确认所有检查通过 ✅）
5. 在 game.js / 前端中使用 script.js 的地图数据
```

### 9.5 隐蔽路径与布局的关系

隐蔽路径（hidden edge）在布局中有特殊处理：

- **布局阶段**：hidden edge 被排除在邻接表之外，不影响房间排列。例如 `study↔garden` 的隐蔽路径不会让 garden 被当作 study 的子房间
- **验证阶段**：map-tool.cjs 对 hidden edge 只标记 `🌙 隐蔽路径 (不要求紧贴)`，不检查坐标紧贴
- **游戏运行时**：`game.js` 的 `getNeighbors` 按玩家 `unlockedEdges` 状态过滤，搜索指定物体后解锁
- **前端渲染**：MapView 用紫色虚线渲染隐蔽路径，解锁前后可见性不同