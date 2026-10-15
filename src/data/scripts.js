/**
 * 剧本数据模型 & Mock 数据
 *
 * 数据结构说明：
 * - Script: 剧本
 *   - id, title, cover, difficulty, playerCount, duration, tags, synopsis
 *   - background: 背景故事
 *   - roles: Role[] 角色列表
 *   - clues: Clue[] 线索列表
 *   - phases: PhaseDef[] 游戏阶段定义
 *
 * - Role: 角色
 *   - id, name, avatar, gender, age, occupation
 *   - intro: 公开介绍
 *   - secret: 秘密剧本（仅该角色可见）
 *   - isKiller: 是否为凶手
 *
 * - Clue: 线索
 *   - id, name, description, phaseId（所属阶段）
 *
 * - PhaseDef: 阶段定义
 *   - id, name, type, description, duration（建议时长分钟）
 */

export const PHASE_TYPES = {
  INTRO: 'intro',           // 背景介绍
  SELF_INTRO: 'self_intro', // 自我介绍
  INVESTIGATE: 'investigate', // 搜证
  DISCUSS: 'discuss',       // 讨论
  VOTE: 'vote',             // 投票
  REVEAL: 'reveal',         // 揭晓真相
}

// 默认游戏阶段流程
export const DEFAULT_PHASES = [
  { id: 'p1', name: '背景介绍', type: PHASE_TYPES.INTRO, description: '主持人叙述案件背景，所有玩家了解故事全貌。', duration: 5 },
  { id: 'p2', name: '自我介绍', type: PHASE_TYPES.SELF_INTRO, description: '各角色依次进行自我介绍，分享公开身份信息。', duration: 10 },
  { id: 'p3', name: '搜证阶段', type: PHASE_TYPES.INVESTIGATE, description: '玩家搜索场景中的线索，获取证据卡。', duration: 15 },
  { id: 'p4', name: '自由讨论', type: PHASE_TYPES.DISCUSS, description: '所有玩家自由讨论，分享线索与推理。', duration: 20 },
  { id: 'p5', name: '投票表决', type: PHASE_TYPES.VOTE, description: '每人投出一票，指认你认为的凶手。', duration: 5 },
  { id: 'p6', name: '真相揭晓', type: PHASE_TYPES.REVEAL, description: '公布案件真相，游戏结束。', duration: 5 },
]

// SVG 头像生成
function svgAvatar(text, color) {
  return 'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">` +
    `<rect width="200" height="200" fill="${color}"/>` +
    `<text x="100" y="115" font-size="72" text-anchor="middle" fill="white" font-family="sans-serif">${text}</text>` +
    `</svg>`
  )
}

// 封面占位图
function svgCover(title, color1, color2) {
  return 'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="${color1}"/>` +
    `<stop offset="100%" stop-color="${color2}"/>` +
    `</linearGradient></defs>` +
    `<rect width="400" height="560" fill="url(#g)"/>` +
    `<text x="200" y="280" font-size="32" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="sans-serif" font-weight="bold">${title}</text>` +
    `<text x="200" y="320" font-size="16" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="sans-serif">剧本杀</text>` +
    `</svg>`
  )
}

export const MOCK_SCRIPTS = [
  {
    id: 'script-001',
    title: '雾庄疑案',
    cover: svgCover('雾庄疑案', '#2c3e50', '#4a6741'),
    difficulty: 3,
    playerCount: 6,
    duration: 120,
    tags: ['民国', '推理', '本格'],
    synopsis: '民国二十六年，雾庄主人李老爷在书房离奇身亡。当夜暴雨封山，六位嫌疑人被困庄内。谁是真凶？',
    background: '民国二十六年深秋，江南雾庄。李老爷在书房内离奇身亡，门窗紧锁，现场无打斗痕迹。当夜暴雨如注，山路封锁，庄中六人无法离开。警官尚未赶到，真相只能由你们自己揭开……',
    roles: [
      {
        id: 'r1', name: '李夫人', avatar: svgAvatar('李', '#c0392b'), gender: '女', age: 38, occupation: '李老爷之妻',
        intro: '李老爷的结发妻子，温婉端庄，掌管雾庄内务。',
        secret: '你发现李老爷近期秘密修改了遗嘱，将大部分财产留给了一个你不知道的人。案发当晚你去书房想要问个明白，但到了门口听到里面有动静就离开了。',
        isKiller: false,
      },
      {
        id: 'r2', name: '李少爷', avatar: svgAvatar('少', '#2980b9'), gender: '男', age: 22, occupation: '李老爷独子',
        intro: '李老爷的独子，刚从西洋留学归来，性格不羁。',
        secret: '你留学期间挥霍无度，欠下巨债。多次向父亲要钱未果，案发前曾与父亲大吵一架。当晚你在花园吸烟，看到了书房灯光闪烁。',
        isKiller: false,
      },
      {
        id: 'r3', name: '王管家', avatar: svgAvatar('王', '#27ae60'), gender: '男', age: 50, occupation: '雾庄管家',
        intro: '雾庄老管家，侍奉李家三十年，忠心耿耿。',
        secret: '你对李家忠心，但最近发现李老爷打算卖掉雾庄解困，你一生的心血将毁于一旦。案发当晚你负责巡查，曾进入过书房。',
        isKiller: true,
      },
      {
        id: 'r4', name: '赵医生', avatar: svgAvatar('赵', '#8e44ad'), gender: '男', age: 45, occupation: '家庭医生',
        intro: '李老爷的私人医生，定期来雾庄出诊。',
        secret: '你一直在为李老爷开具安眠药处方。最近你发现自己的医疗事故记录被李老爷掌握，他以此威胁你免费出诊。',
        isKiller: false,
      },
      {
        id: 'r5', name: '陈小姐', avatar: svgAvatar('陈', '#e67e22'), gender: '女', age: 25, occupation: '李老爷秘书',
        intro: '李老爷的私人秘书，负责处理商业文书。',
        secret: '你是李老爷秘密收养的女儿，也是遗嘱修改的受益人。但你自己并不知道身世真相，只知道李老爷最近对你格外关照。',
        isKiller: false,
      },
      {
        id: 'r6', name: '张护工', avatar: svgAvatar('张', '#16a085'), gender: '女', age: 30, occupation: '雾庄护工',
        intro: '负责照顾李老爷起居的护工，勤劳本分。',
        secret: '你曾偷拿李老爷的药品转卖被管家发现，管家以此要挟你做事。案发当晚你被管家叫去书房送茶水，但你送到时书房门紧锁无人应答。',
        isKiller: false,
      },
    ],
    clues: [
      { id: 'c1', name: '修改后的遗嘱', description: '一份新拟的遗嘱，将大部分财产留给"陈小姐"。', phaseId: 'p3' },
      { id: 'c2', name: '安眠药瓶', description: '药瓶已空，但处方显示上周才配的药。', phaseId: 'p3' },
      { id: 'c3', name: '书房钥匙', description: '管家腰间发现的书房备用钥匙。', phaseId: 'p3' },
      { id: 'c4', name: '带泥的鞋印', description: '书房窗台下的花园泥地有新鲜鞋印。', phaseId: 'p3' },
      { id: 'c5', name: '撕碎的信件', description: '废纸篓中残存的信件碎片，隐约可见"威胁"字样。', phaseId: 'p3' },
      { id: 'c6', name: '茶杯', description: '书房桌上的茶杯，杯底有白色粉末残留。', phaseId: 'p3' },
    ],
    phases: DEFAULT_PHASES,
  },
  {
    id: 'script-002',
    title: '末班列车',
    cover: svgCover('末班列车', '#1a1a2e', '#e94560'),
    difficulty: 4,
    playerCount: 5,
    duration: 90,
    tags: ['现代', '悬疑', '封闭'],
    synopsis: '深夜末班地铁上，一名乘客离奇死亡。列车停在隧道中，五名乘客各有秘密……',
    background: '凌晨1点17分，末班地铁驶入隧道后突然断电停车。车厢内一名乘客被发现已死亡，门窗紧闭。五名乘客被困在密闭车厢中，凶手就在其中。',
    roles: [
      {
        id: 'r1', name: '通勤者', avatar: svgAvatar('通', '#c0392b'), gender: '男', age: 35, occupation: '公司职员',
        intro: '每天乘坐末班车的上班族，沉默寡言。',
        secret: '你认出死者是你跟踪了三个月的人——他害死了你的妹妹。你本打算今晚动手，但有人比你先一步。',
        isKiller: false,
      },
      {
        id: 'r2', name: '护士', avatar: svgAvatar('护', '#2980b9'), gender: '女', age: 28, occupation: '医院护士',
        intro: '刚下夜班的护士，随身带着医药包。',
        secret: '你的医药包里少了一支注射器和一瓶氯化钾——这正是杀死死者的凶器。你不知道它是什么时候不见的。',
        isKiller: true,
      },
      {
        id: 'r3', name: '学生', avatar: svgAvatar('学', '#27ae60'), gender: '男', age: 19, occupation: '大学生',
        intro: '戴着耳机打游戏的大学生，看起来与世无争。',
        secret: '你其实是便衣警察，跟踪死者已有两周。你假装乘客，但你也在断电那一刻失去了意识。',
        isKiller: false,
      },
      {
        id: 'r4', name: '流浪者', avatar: svgAvatar('流', '#8e44ad'), gender: '男', age: 50, occupation: '无业',
        intro: '常年在地铁里过夜的流浪者，对车厢很熟悉。',
        secret: '你在断电前看到护士从医药包里取出了什么东西，但黑暗中看不清是什么。',
        isKiller: false,
      },
      {
        id: 'r5', name: '夜店女', avatar: svgAvatar('夜', '#e67e22'), gender: '女', age: 24, occupation: '夜店从业者',
        intro: '浓妆艳抹的女子，似乎喝了不少酒。',
        secret: '死者是你的常客，上个月他对你施暴。你有动机，但你整晚都在另一节车厢昏睡。',
        isKiller: false,
      },
    ],
    clues: [
      { id: 'c1', name: '空药瓶', description: '氯化钾空瓶，标签上有护士的签名。', phaseId: 'p3' },
      { id: 'c2', name: '注射器包装', description: '注射器的塑料包装，被丢弃在座位下。', phaseId: 'p3' },
      { id: 'c3', name: '手机', description: '死者手机，最后收到一条威胁短信。', phaseId: 'p3' },
      { id: 'c4', name: '监控截图', description: '断电前最后一帧监控：有人影靠近死者。', phaseId: 'p3' },
      { id: 'c5', name: '耳环', description: '死者手边发现的一只女士耳环。', phaseId: 'p3' },
    ],
    phases: DEFAULT_PHASES,
  },
  {
    id: 'script-003',
    title: '雪山孤 lodge',
    cover: svgCover('雪山孤 lodge', '#0f4c75', '#3282b8'),
    difficulty: 2,
    playerCount: 4,
    duration: 60,
    tags: ['暴风雪山庄', '推理', '入门'],
    synopsis: '暴风雪封锁了山路，雪山木屋中传来枪声。主人倒在血泊中，四人谁能脱罪？',
    background: '暴风雪肆虐的冬夜，雪山木屋中传来一声枪响。等你赶到客厅，主人已倒在血泊中。门窗被积雪封死，无人能离开。四名住客，一个凶手。',
    roles: [
      {
        id: 'r1', name: '作家', avatar: svgAvatar('作', '#c0392b'), gender: '男', age: 40, occupation: '推理小说家',
        intro: '来雪山寻找灵感的推理小说家，对密室杀人颇有研究。',
        secret: '你正在写一本以雪山木屋为背景的杀人小说，情节与本案惊人相似。你的手稿就放在房间里。',
        isKiller: false,
      },
      {
        id: 'r2', name: '登山者', avatar: svgAvatar('登', '#2980b9'), gender: '女', age: 30, occupation: '专业登山者',
        intro: '独自来登山的冒险家，体力过人。',
        secret: '你是主人的前妻，离婚后一直纠缠财产分割。你来这里本是要谈判，没想到他死了。',
        isKiller: true,
      },
      {
        id: 'r3', name: '摄影师', avatar: svgAvatar('摄', '#27ae60'), gender: '男', age: 26, occupation: '风光摄影师',
        intro: '来拍摄雪山的摄影师，随身携带大量器材。',
        secret: '你的相机里拍到了案发前客厅的景象——有人正在摆弄那把猎枪。',
        isKiller: false,
      },
      {
        id: 'r4', name: '隐士', avatar: svgAvatar('隐', '#8e44ad'), gender: '男', age: 60, occupation: '退休老人',
        intro: '常年住在雪山木屋的隐居老人，不爱说话。',
        secret: '那把猎枪是你的。你说已经上了锁，但锁似乎被人动过手脚。',
        isKiller: false,
      },
    ],
    clues: [
      { id: 'c1', name: '猎枪', description: '凶器，属于隐士，锁扣有撬动痕迹。', phaseId: 'p3' },
      { id: 'c2', name: '相机照片', description: '摄影师拍到的画面，有人影在摆弄猎枪。', phaseId: 'p3' },
      { id: 'c3', name: '离婚协议', description: '未签字的离婚协议，财产分割存在争议。', phaseId: 'p3' },
      { id: 'c4', name: '小说手稿', description: '作家的手稿，情节与本案几乎一致。', phaseId: 'p3' },
    ],
    phases: DEFAULT_PHASES,
  },
  {
    id: 'script-004',
    title: '校园怪谈',
    cover: svgCover('校园怪谈', '#780000', '#c1121f'),
    difficulty: 3,
    playerCount: 7,
    duration: 150,
    tags: ['校园', '恐怖', '情感'],
    synopsis: '十年前的校园命案重演，旧校舍里的幽灵再次苏醒。七个旧友重聚，谁带着秘密归来？',
    background: '十年前，一名学生在旧校舍坠楼身亡，校方以意外结案。十年后的同学聚会，你们重回旧校舍。午夜时分，熟悉的尖叫声再次响起——有人倒在当年同样的位置。',
    roles: [
      { id: 'r1', name: '班长', avatar: svgAvatar('班', '#c0392b'), gender: '男', age: 28, occupation: '企业主管', intro: '当年的班长，如今事业有成，组织了这次聚会。', secret: '你一直知道十年前那场"意外"的真相，但你选择了沉默。', isKiller: false },
      { id: 'r2', name: '校花', avatar: svgAvatar('花', '#2980b9'), gender: '女', age: 27, occupation: '模特', intro: '当年的校花，如今是知名模特。', secret: '十年前的死者曾追求你未果，你曾当众羞辱过他。', isKiller: false },
      { id: 'r3', name: '学霸', avatar: svgAvatar('学', '#27ae60'), gender: '男', age: 28, occupation: '大学讲师', intro: '当年的学霸，如今在高校任教。', secret: '你看到了十年前坠楼的真相——有人推了他。但你因恐惧一直不敢说。', isKiller: false },
      { id: 'r4', name: '体育生', avatar: svgAvatar('体', '#8e44ad'), gender: '男', age: 28, occupation: '健身教练', intro: '当年的体育特长生，性格冲动。', secret: '十年前你和死者有过冲突，你是最后一个见到他的人。', isKiller: true },
      { id: 'r5', name: '转学生', avatar: svgAvatar('转', '#e67e22'), gender: '女', age: 27, occupation: '记者', intro: '当年的转学生，如今是调查记者。', secret: '你一直在暗中调查十年前的案子，你掌握了一些关键证据。', isKiller: false },
      { id: 'r6', name: '文艺委员', avatar: svgAvatar('文', '#16a085'), gender: '女', age: 27, occupation: '编剧', intro: '当年的文艺委员，如今是小有名气的编剧。', secret: '你写了一个以当年事件为原型的剧本，死者家属看到后威胁要起诉你。', isKiller: false },
      { id: 'r7', name: '转校生', avatar: svgAvatar('校', '#f39c12'), gender: '男', age: 28, occupation: '程序员', intro: '沉默寡言的男生，如今在互联网公司工作。', secret: '你是死者生前的挚友，你一直怀疑死因不简单，这次回来就是为了找出真相。', isKiller: false },
    ],
    clues: [
      { id: 'c1', name: '旧日记', description: '死者的日记，最后一页写着"如果我出事了，一定是他。"', phaseId: 'p3' },
      { id: 'c2', name: '监控U盘', description: '转学生找到的U盘，存有当年校舍走廊的监控视频。', phaseId: 'p3' },
      { id: 'c3', name: '恐吓信', description: '文艺委员收到的匿名恐吓信，要求她停止剧本创作。', phaseId: 'p3' },
      { id: 'c4', name: '运动鞋', description: '体育生鞋柜里的旧运动鞋，鞋底有屋顶砂石。', phaseId: 'p3' },
      { id: 'c5', name: '同学录', description: '十年前的同学录，死者名字被划掉，旁边写着"对不起"。', phaseId: 'p3' },
      { id: 'c6', name: '手机录音', description: '死者手机中的一段录音，录下了争吵声。', phaseId: 'p3' },
      { id: 'c7', name: '医药处方', description: '班长书包里的抗焦虑药物处方，日期是十年前。', phaseId: 'p3' },
    ],
    phases: DEFAULT_PHASES,
  },
]

// 工具方法：按 id 查找剧本
export function getScriptById(id) {
  return MOCK_SCRIPTS.find((s) => s.id === id)
}