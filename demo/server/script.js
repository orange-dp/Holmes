// 雾庄疑案 Demo 剧本数据
// 包含：方格户型图地图、连接关系、可交互物体、道具、角色、任务、案发配置、时钟配置

export const script = {
  id: 'script-001',
  name: '雾庄疑案',

  // === 时钟配置 ===
  clockStart: '20:00',      // 起始时间
  segmentDuration: 30,       // 每段 = 30 分钟
  totalSegments: 8,          // 总时段数（20:00 ~ 24:00）
  murderSegment: 4,          // 案发时段（第4段 = 22:00）
  murderRoom: 'study',       // 案发地点

  // === 方格户型图地图 ===
  // 每个节点是一个矩形区域，包含 x/y/w/h（方格坐标）
  // type: room（房间）| corridor（走廊/临时空间）
  // grid 整体为 16列 x 10行
  // 布局原则：有 edge 连接的区域必须在坐标上紧贴（共享一条边），无间隙
  grid: {
    cols: 16,
    rows: 10,
    cellSize: 40, // 每格 40px（前端渲染用）
  },
  nodes: [
    // --- 一楼 ---
    // 走廊横贯中间 y=4（占 y[4,5]），上排房间 y=3（与走廊共享 y=4 边），下排房间 y=5（与走廊共享 y=5 边）
    { id: 'corridor_1f', name: '一楼走廊', type: 'corridor', floor: 1, x: 2, y: 4, w: 10, h: 1 },
    { id: 'kitchen',     name: '厨房',     type: 'room', floor: 1, x: 1, y: 3, w: 3, h: 1 },   // x[1,4] y[3,4] 与走廊 x[2,12] 共享 x[2,4]
    { id: 'study',       name: '书房',     type: 'room', floor: 1, x: 5, y: 3, w: 3, h: 1 },   // x[5,8] y[3,4] 与走廊共享 x[5,8]
    { id: 'dining',      name: '餐厅',     type: 'room', floor: 1, x: 9, y: 3, w: 3, h: 1 },   // x[9,12] y[3,4] 与走廊共享 x[9,12]
    { id: 'storage',     name: '储藏室',   type: 'room', floor: 1, x: 1, y: 5, w: 3, h: 1 },   // x[1,4] y[5,6] 与走廊共享 x[2,4]
    { id: 'hall',        name: '大厅',     type: 'room', floor: 1, x: 5, y: 5, w: 5, h: 3 },   // x[5,10] y[5,8] 与走廊共享 x[5,10]
    { id: 'garden',      name: '花园',     type: 'room', floor: 1, x: 5, y: 8, w: 5, h: 1 },   // x[5,10] y[8,9] 与大厅共享 x[5,10]
    { id: 'staircase',   name: '楼梯间',   type: 'corridor', floor: 1, x: 12, y: 4, w: 3, h: 1 }, // x[12,15] y[4,5] 与走廊共享 x=12 边

    // --- 二楼 ---
    // 走廊横贯中间 y=4，房间在走廊上方(y=3)和下方(y=5)
    { id: 'corridor_2f',      name: '二楼走廊', type: 'corridor', floor: 2, x: 2, y: 4, w: 10, h: 1 },
    { id: 'master_bed',       name: '主卧',     type: 'room', floor: 2, x: 2, y: 3, w: 3, h: 1 },  // x[2,5] y[3,4]
    { id: 'young_master_bed', name: '少爷房',   type: 'room', floor: 2, x: 6, y: 3, w: 3, h: 1 },  // x[6,9] y[3,4]
    { id: 'guest_bed',        name: '客房',     type: 'room', floor: 2, x: 9, y: 3, w: 3, h: 1 },  // x[9,12] y[3,4]
    { id: 'staircase_2f',     name: '楼梯间',   type: 'corridor', floor: 2, x: 12, y: 4, w: 3, h: 1 }, // x[12,15] y[4,5]
  ],

  // 连接关系（门/通道）
  // hidden: true 表示隐蔽路径（如窗户翻越），不需要在地图上紧贴/画门
  edges: [
    ['hall', 'corridor_1f'],
    ['corridor_1f', 'study'],
    ['corridor_1f', 'kitchen'],
    ['corridor_1f', 'dining'],
    ['corridor_1f', 'storage'],
    ['hall', 'garden'],
    ['corridor_1f', 'staircase'],
    ['staircase', 'staircase_2f'],     // 楼梯连接一二楼
    ['staircase_2f', 'corridor_2f'],
    ['corridor_2f', 'master_bed'],
    ['corridor_2f', 'young_master_bed'],
    ['corridor_2f', 'guest_bed'],
    { from: 'study', to: 'garden', hidden: true, unlockBy: { type: 'searchedObject', objectId: 'garden_ground' } },  // 隐蔽路径：搜索窗台下脚印后解锁
  ],

  // 可交互物体（挂在房间内）
  objects: [
    // 书房
    { id: 'study_desk', name: '书桌', room: 'study', searchable: true, gives: 'clue_teacup', searched: false },
    { id: 'study_wastebasket', name: '废纸篓', room: 'study', searchable: true, gives: 'clue_letter', searched: false },
    { id: 'study_safe', name: '保险箱', room: 'study', searchable: true, gives: 'clue_will', searched: false, requires: { type: 'key', itemId: 'key_study' } },
    { id: 'study_bookshelf', name: '书架', room: 'study', searchable: true, gives: 'info_safe_code', searched: false },
    { id: 'study_body', name: '李老爷的尸体', room: 'study', searchable: true, gives: 'body_discovery', searched: false, isBody: true },

    // 储藏室
    { id: 'storage_cabinet', name: '药品柜', room: 'storage', searchable: true, gives: 'clue_medicine', searched: false },

    // 花园
    { id: 'garden_ground', name: '窗台下地面', room: 'garden', searchable: true, gives: 'clue_shoeprint', searched: false },

    // 主卧
    { id: 'master_dresser', name: '梳妆台', room: 'master_bed', searchable: true, gives: null, searched: false },
    { id: 'master_wardrobe', name: '衣柜', room: 'master_bed', searchable: true, gives: null, searched: false },

    // 少爷房
    { id: 'young_pipe', name: '烟斗', room: 'young_master_bed', searchable: true, gives: null, searched: false },
    { id: 'young_luggage', name: '留学行李', room: 'young_master_bed', searchable: true, gives: null, searched: false },

    // 客房
    { id: 'guest_nightstand', name: '床头柜', room: 'guest_bed', searchable: true, gives: null, searched: false },

    // 厨房
    { id: 'kitchen_teaset', name: '茶具', room: 'kitchen', searchable: true, gives: null, searched: false },

    // 餐厅
    { id: 'dining_cabinet', name: '餐具柜', room: 'dining', searchable: true, gives: null, searched: false },

    // 大厅
    { id: 'hall_fireplace', name: '壁炉', room: 'hall', searchable: true, gives: null, searched: false },
    { id: 'hall_clock', name: '挂钟', room: 'hall', searchable: true, gives: null, searched: false },
  ],

  // 道具
  items: [
    { id: 'key_study', name: '书房钥匙', type: 'key', description: '一把铜钥匙，可开启书房保险箱和书房门。' },
    { id: 'clue_will', name: '修改后的遗嘱', type: 'evidence', description: '遗嘱被修改，李少爷的继承份额大幅减少，李夫人获益。' },
    { id: 'clue_medicine', name: '安眠药瓶', type: 'evidence', description: '药品柜中缺失的安眠药瓶，瓶内少了几颗。' },
    { id: 'clue_shoeprint', name: '带泥的鞋印', type: 'evidence', description: '书房窗台下有带泥的鞋印，有人从花园进入书房。' },
    { id: 'clue_letter', name: '撕碎的信件', type: 'evidence', description: '被撕碎的信件残片，隐约可见"……威胁……必须……"字样。' },
    { id: 'clue_teacup', name: '茶杯', type: 'evidence', description: '书房桌上的茶杯，底部有白色粉末残留。' },
    { id: 'info_safe_code', name: '保险箱密码', type: 'info', description: '从书架某书中发现的纸条，写着保险箱密码：19840315。' },
  ],

  // 角色
  characters: [
    {
      id: 'li_furen', name: '李夫人', color: '#e91e63',
      startLocation: 'master_bed',
      isMurderer: false,
      secret: '你知道保险箱的密码。修改后的遗嘱对你有利，你需要在别人发现前取走它。',
      tasks: [
        { id: 't_li_1', name: '取回书房保险箱中的遗嘱', completeCondition: { type: 'hasItem', itemId: 'clue_will' } },
      ],
    },
    {
      id: 'li_shaoye', name: '李少爷', color: '#2196f3',
      startLocation: 'garden',
      isMurderer: false,
      secret: '你刚从国外留学回来，发现父亲的遗嘱被修改，你的继承份额减少。你怀疑继母。',
      tasks: [
        { id: 't_ls_1', name: '搜索书房寻找线索', completeCondition: { type: 'searchedObject', objectId: 'study_desk' } },
      ],
    },
    {
      id: 'wang_guanjia', name: '王管家', color: '#4caf50',
      startLocation: 'corridor_1f',
      isMurderer: false,
      secret: '你忠于李老爷，持有书房钥匙。你发现最近李老爷行为异常。',
      tasks: [
        { id: 't_wg_1', name: '今晚巡视所有一楼房间', completeCondition: { type: 'visitedRooms', roomIds: ['study', 'kitchen', 'dining', 'storage'] } },
      ],
    },
    {
      id: 'zhao_yisheng', name: '赵医生', color: '#ff9800',
      startLocation: 'dining',
      isMurderer: false,
      secret: '你是李老爷的私人医生，你知道李老爷最近在服用安眠药。',
      tasks: [
        { id: 't_zY_1', name: '检查储藏室药品柜', completeCondition: { type: 'searchedObject', objectId: 'storage_cabinet' } },
      ],
    },
    {
      id: 'chen_xiaojie', name: '陈小姐', color: '#9c27b0',
      startLocation: 'hall',
      isMurderer: false,
      secret: '你是李老爷的秘书，你知道遗嘱的修改过程。你对李老爷的死因有专业判断。',
      tasks: [
        { id: 't_cx_1', name: '调查书房现场', completeCondition: { type: 'searchedObject', objectId: 'study_wastebasket' } },
      ],
    },
    {
      id: 'zhang_hugong', name: '张护工', color: '#795548',
      startLocation: 'kitchen',
      isMurderer: true,
      secret: '你是凶手。你受雇于人，需要在茶水中下安眠药，等待李老爷饮下。你有安眠药的来源。',
      tasks: [
        { id: 't_zh_1', name: '从储藏室获取安眠药', completeCondition: { type: 'searchedObject', objectId: 'storage_cabinet' } },
        { id: 't_zh_2', name: '将安眠药放入书房茶杯', completeCondition: { type: 'usedItemAt', itemId: 'clue_medicine', location: 'study' } },
      ],
    },
  ],
}