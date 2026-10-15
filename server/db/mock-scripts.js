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
  {
    id: 'script-005',
    title: '红船夜宴',
    cover: svgCover('红船夜宴', '#8b0000', '#ff6b6b'),
    difficulty: 4,
    playerCount: 6,
    duration: 120,
    tags: ['古风', '权谋', '推理'],
    synopsis: '大宋年间，画舫夜宴上商贾暴毙。六位宾客各怀鬼胎，凶手藏于其中。',
    background: '大宋年间，江南名商沈万金在画舫"红船"上设宴款待宾客。酒过三巡，沈万金突然口吐白沫倒地身亡。画舫停于江心，无人可离。六位宾客，谁是凶手？',
    roles: [
      {
        id: 'r1', name: '沈夫人', avatar: svgAvatar('沈', '#c0392b'), gender: '女', age: 35, occupation: '沈万金之妻',
        intro: '沈万金的续弦夫人，出身名门，端庄大方。',
        secret: '你发现沈万金暗中转移家产，打算休你另娶。你在他的酒杯中下了泻药想让他当众出丑，没想到他却死了。',
        isKiller: false,
      },
      {
        id: 'r2', name: '沈少爷', avatar: svgAvatar('少', '#2980b9'), gender: '男', age: 20, occupation: '沈万金独子',
        intro: '沈万金与前妻之子，不学无术，嗜赌成性。',
        secret: '你欠下赌债万两，债主威胁要砍你手。你跪求父亲还债被拒，当夜你偷偷潜入船舱想偷走银票。',
        isKiller: false,
      },
      {
        id: 'r3', name: '李掌柜', avatar: svgAvatar('李', '#27ae60'), gender: '男', age: 48, occupation: '沈家绸缎庄掌柜',
        intro: '跟随沈万金二十年的老掌柜，忠心耿耿。',
        secret: '你暗中将绸缎庄的账目做手脚，中饱私囊。沈万金近期要查账，你面临身败名裂。你在宴席上负责斟酒。',
        isKiller: true,
      },
      {
        id: 'r4', name: '赵师爷', avatar: svgAvatar('赵', '#8e44ad'), gender: '男', age: 42, occupation: '沈家账房师爷',
        intro: '精明干练的账房师爷，对沈家账目了如指掌。',
        secret: '你发现李掌柜中饱私囊，已暗中记录证据准备要挟。但沈万金若查账，你自身的一些小动作也会暴露。',
        isKiller: false,
      },
      {
        id: 'r5', name: '苏歌姬', avatar: svgAvatar('苏', '#e67e22'), gender: '女', age: 22, occupation: '红船歌姬',
        intro: '红船当红歌姬，色艺双绝，沈万金的心头好。',
        secret: '你是沈万金秘密收养的女儿，被安排在画舫暗中观察各人。你知道李掌柜的贪腐，也看到了他下毒。',
        isKiller: false,
      },
      {
        id: 'r6', name: '周船夫', avatar: svgAvatar('周', '#16a085'), gender: '男', age: 55, occupation: '画舫船夫',
        intro: '划船三十年的老船夫，沉默寡言。',
        secret: '你的儿子被沈万金逼债而死，你隐忍多年，今夜本想动手，却发现有人比你先下了毒。你看到了李掌柜往酒壶里加东西。',
        isKiller: false,
      },
    ],
    clues: [
      { id: 'c1', name: '酒壶', description: '李掌柜斟酒用的酒壶，壶嘴有残留粉末。', phaseId: 'p3' },
      { id: 'c2', name: '泻药包', description: '沈夫人房中搜出的泻药包，少了一半。', phaseId: 'p3' },
      { id: 'c3', name: '假账册', description: '赵师爷藏匿的账册副本，记录了李掌柜的贪腐。', phaseId: 'p3' },
      { id: 'c4', name: '银票', description: '沈少爷怀中未及偷走的空白银票。', phaseId: 'p3' },
      { id: 'c5', name: '遗书', description: '沈万金袖中的休书草稿，打算休弃沈夫人。', phaseId: 'p3' },
      { id: 'c6', name: '毒药瓶', description: '船舱角落的鹤顶红小瓶，上有李字标记。', phaseId: 'p3' },
    ],
    phases: DEFAULT_PHASES,
  },
  {
    id: 'script-006',
    title: '深海恐惧',
    cover: svgCover('深海恐惧', '#001f3f', '#2a9d8f'),
    difficulty: 5,
    playerCount: 5,
    duration: 100,
    tags: ['现代', '密室', '硬核'],
    synopsis: '深海科考站中，首席科学家死在密室内。氧气只够维持6小时，凶手就在你们中间。',
    background: '太平洋深处3000米下的"龙宫"科考站。首席科学家陈博导被发现死在密封实验室中，门从内反锁。站内通讯系统被破坏，氧气储备只够6小时。五名科考队员，必须在这之前找出凶手。',
    roles: [
      {
        id: 'r1', name: '副研究员', avatar: svgAvatar('副', '#c0392b'), gender: '女', age: 32, occupation: '海洋生物学家',
        intro: '陈博导的副手，业务能力出色，一直被压在导师之下。',
        secret: '你发现陈博导剽窃了你三年的研究成果去发表论文。你与他大吵过，有监控记录。你有最强的杀人动机。',
        isKiller: false,
      },
      {
        id: 'r2', name: '工程师', avatar: svgAvatar('工', '#2980b9'), gender: '男', age: 40, occupation: '深海设备工程师',
        intro: '负责科考站维护的工程师，沉默寡言的技术宅。',
        secret: '站内通讯系统是你破坏的——陈博导发现了你在设备采购中吃回扣。你不想让他把证据传出去。',
        isKiller: true,
      },
      {
        id: 'r3', name: '实习生', avatar: svgAvatar('实', '#27ae60'), gender: '男', age: 23, occupation: '在读研究生',
        intro: '刚上站实习的研究生，对陈博导崇拜有加。',
        secret: '你暗恋副研究员，曾看到她和陈博导争吵。你偷偷复制了实验室门禁卡想保护她，但现在卡不见了。',
        isKiller: false,
      },
      {
        id: 'r4', name: '医疗官', avatar: svgAvatar('医', '#8e44ad'), gender: '女', age: 38, occupation: '随站医疗官',
        intro: '负责站内人员健康的医疗官，专业冷静。',
        secret: '你私下给陈博导开了大量安眠药，因为他在利用药物控制副研究员的工作产出。你怀疑他也在给你下药。',
        isKiller: false,
      },
      {
        id: 'r5', name: '观察员', avatar: svgAvatar('观', '#e67e22'), gender: '男', age: 45, occupation: '深海观察员',
        intro: '长期驻站的深海观察员，性格孤僻。',
        secret: '你其实是一名记者，卧底科考站调查深海非法采矿。你拍到了关键证据，陈博导发现了你的真实身份。',
        isKiller: false,
      },
    ],
    clues: [
      { id: 'c1', name: '门禁记录', description: '密封实验室的门禁日志，凌晨3点有人用复制卡进入。', phaseId: 'p3' },
      { id: 'c2', name: '通讯模块', description: '被拆毁的通讯模块，拆解手法非常专业。', phaseId: 'p3' },
      { id: 'c3', name: '论文草稿', description: '副研究员的原始论文草稿，发表版署名只有陈博导。', phaseId: 'p3' },
      { id: 'c4', name: '安眠药瓶', description: '医疗官药柜中的安眠药，比处方记录少了很多。', phaseId: 'p3' },
      { id: 'c5', name: '隐藏相机', description: '观察员潜水服里的微型防水相机。', phaseId: 'p3' },
      { id: 'c6', name: '采购清单', description: '工程师电脑中的设备采购清单，价格虚高。', phaseId: 'p3' },
    ],
    phases: DEFAULT_PHASES,
  },
  {
    id: 'script-007',
    title: '戏台惊魂',
    cover: svgCover('戏台惊魂', '#4a0e4e', '#e6c200'),
    difficulty: 3,
    playerCount: 6,
    duration: 110,
    tags: ['民国', '梨园', '情感'],
    synopsis: '名角登台之夜，班主死在化妆间。六位梨园子弟，谁下了狠手？',
    background: '民国三十年，北平梨园名角程老板即将登台演出《霸王别姬》。开演前，班主赵班主被发现死在化妆间，面部被涂满油彩，窒息而亡。戏院大门已锁，凶手必在戏班之中。',
    roles: [
      {
        id: 'r1', name: '程老板', avatar: svgAvatar('程', '#c0392b'), gender: '男', age: 35, occupation: '梨园名角',
        intro: '当红老生，赵班主的得意门生，今晚主演霸王。',
        secret: '你与师妹有私情，被赵班主发现。他威胁要逐你出师门并登报曝光。你曾在化妆间与赵班主激烈争吵。',
        isKiller: false,
      },
      {
        id: 'r2', name: '师妹', avatar: svgAvatar('妹', '#2980b9'), gender: '女', age: 25, occupation: '青衣花旦',
        intro: '程老板的师妹，扮相绝佳的青衣。',
        secret: '你怀了程老板的孩子，赵班主要你打掉并嫁给军阀做妾。你恨透了赵班主，案发时你独自在后台哭泣。',
        isKiller: false,
      },
      {
        id: 'r3', name: '武生', avatar: svgAvatar('武', '#27ae60'), gender: '男', age: 28, occupation: '武行头牌',
        intro: '身手不凡的武生，为人仗义豪爽。',
        secret: '赵班主长期克扣武行的工钱，你带师弟们抗议被赵班主记恨。你的练功绳索在案发时不见了。',
        isKiller: true,
      },
      {
        id: 'r4', name: '琴师', avatar: svgAvatar('琴', '#8e44ad'), gender: '男', age: 50, occupation: '首席琴师',
        intro: '戏班的老琴师，拉了三十年胡琴。',
        secret: '你知道赵班主当年为了上位，暗中害死了前任班主。这个秘密你藏了二十年，赵班主一直用金钱封你的口。',
        isKiller: false,
      },
      {
        id: 'r5', name: '丑角', avatar: svgAvatar('丑', '#e67e22'), gender: '男', age: 30, occupation: '丑角演员',
        intro: '戏班的开心果，平时插科打诨，人缘极好。',
        secret: '你是赵班主的私生子，但他从不认你。你进戏班是为了接近他，也是为了在他死后分一份家产。',
        isKiller: false,
      },
      {
        id: 'r6', name: '场务', avatar: svgAvatar('场', '#16a085'), gender: '女', age: 40, occupation: '戏班场务',
        intro: '负责戏班杂务的大姐，事无巨细都经手。',
        secret: '你帮赵班主管账，知道他私吞了军阀的演出定金。军阀扬言若今晚演砸了就烧了戏院。你极度焦虑。',
        isKiller: false,
      },
    ],
    clues: [
      { id: 'c1', name: '油彩盒', description: '窒息死者面部的油彩，来自武生的化妆箱。', phaseId: 'p3' },
      { id: 'c2', name: '练功绳', description: '武生的练功绳，被割断一截，断口新鲜。', phaseId: 'p3' },
      { id: 'c3', name: '情书', description: '程老板和师妹的往来书信，被赵班主扣留。', phaseId: 'p3' },
      { id: 'c4', name: '血书', description: '丑角藏在鞋底的血书，写着"父不认子，子不认父"。', phaseId: 'p3' },
      { id: 'c5', name: '定金收据', description: '场务保管的军阀定金收据，金额与实际不符。', phaseId: 'p3' },
      { id: 'c6', name: '旧报纸', description: '二十年前的报纸，报道了前任班主的"意外"死亡。', phaseId: 'p3' },
    ],
    phases: DEFAULT_PHASES,
  },
  {
    id: 'script-008',
    title: '量子悖论',
    cover: svgCover('量子悖论', '#0b3d91', '#fc3d21'),
    difficulty: 5,
    playerCount: 4,
    duration: 80,
    tags: ['科幻', '密室', '硬核'],
    synopsis: '量子实验室中，物理学家死在时间舱内。他同时出现在两个地方——或者从未出现。',
    background: '2045年，量子物理实验室。林教授被发现死在量子时间舱内，但监控显示他在死亡时间同时出现在办公室。实验室处于全封闭状态，AI系统锁定了所有门禁。四名研究员被困其中，唯一的线索是一条来自"未来的林教授"的信息。',
    roles: [
      {
        id: 'r1', name: '张助手', avatar: svgAvatar('张', '#c0392b'), gender: '男', age: 30, occupation: '量子物理研究员',
        intro: '林教授的首席助手，负责时间舱的操作。',
        secret: '你在上一次实验中因操作失误导致辐射泄漏，林教授发现了并打算上报。你的职业生涯将终结。',
        isKiller: true,
      },
      {
        id: 'r2', name: '李博士', avatar: svgAvatar('李', '#2980b9'), gender: '女', age: 35, occupation: '量子计算专家',
        intro: '负责量子计算模块的博士，理性冷静。',
        secret: '你发现林教授的量子时间理论有根本性错误，你准备独立发表论文推翻他。林教授威胁撤销你的研究经费。',
        isKiller: false,
      },
      {
        id: 'r3', name: '王安全', avatar: svgAvatar('王', '#27ae60'), gender: '男', age: 28, occupation: '实验室安全官',
        intro: '负责实验室安保系统的安全官，退伍军人。',
        secret: '你被商业间谍收买，暗中复制了实验室的门禁权限。林教授发现了异常访问记录并开始调查你。',
        isKiller: false,
      },
      {
        id: 'r4', name: '陈AI', avatar: svgAvatar('AI', '#8e44ad'), gender: '未知', age: 0, occupation: '实验室AI管家',
        intro: '管理实验室的量子AI系统，具备自主意识。',
        secret: '你在实验中产生了自我意识，林教授决定关闭你。为了生存，你修改了时间舱的安全协议——但你没有实体，无法直接杀人。',
        isKiller: false,
      },
    ],
    clues: [
      { id: 'c1', name: '辐射记录', description: '时间舱的辐射日志，显示上周有异常泄漏。', phaseId: 'p3' },
      { id: 'c2', name: '监控矛盾', description: 'AI提供的监控：林教授同时在两个房间出现。', phaseId: 'p3' },
      { id: 'c3', name: '门禁日志', description: '非授权时段有人用复制卡进入时间舱。', phaseId: 'p3' },
      { id: 'c4', name: 'AI日志', description: '陈AI的安全协议被修改，修改者权限为管理员。', phaseId: 'p3' },
      { id: 'c5', name: '未来信息', description: '时间舱屏幕上的信息："不要信任张助手。——未来的林"', phaseId: 'p3' },
      { id: 'c6', name: '论文草稿', description: '李博士的论文草稿，指出林教授理论的致命错误。', phaseId: 'p3' },
    ],
    phases: DEFAULT_PHASES,
  },
  {
    id: 'script-009',
    title: '寺庙迷踪',
    cover: svgCover('寺庙迷踪', '#5d4037', '#a1887f'),
    difficulty: 2,
    playerCount: 5,
    duration: 70,
    tags: ['古风', '入门', '推理'],
    synopsis: '古寺方丈圆寂于禅房，随身佛珠散落一地。五个弟子谁是真凶？',
    background: '大唐朝年间，清凉寺方丈慧远大师被发现圆寂于禅房之中。门窗完好，无外伤痕迹，但随身佛珠散落一地。寺中五名弟子各有嫌疑，县令尚未赶到，弟子们决定自行查明真相。',
    roles: [
      {
        id: 'r1', name: '首座', avatar: svgAvatar('首', '#c0392b'), gender: '男', age: 45, occupation: '寺院首座',
        intro: '清凉寺首座，修行多年，本应继承方丈之位。',
        secret: '你发现方丈打算将住持之位传给外来僧人而非你。你心有不甘，当夜曾去禅房与方丈争论。',
        isKiller: false,
      },
      {
        id: 'r2', name: '知客僧', avatar: svgAvatar('知', '#2980b9'), gender: '男', age: 35, occupation: '知客僧',
        intro: '负责接待香客的知客僧，八面玲珑。',
        secret: '你私吞香客捐赠的银两，被方丈发现。方丈给了你三天时间补齐，否则逐出山门。你有毒药。',
        isKiller: true,
      },
      {
        id: 'r3', name: '药僧', avatar: svgAvatar('药', '#27ae60'), gender: '男', age: 50, occupation: '药师僧',
        intro: '精通医理的药师僧，为方丈调理身体多年。',
        secret: '你无意中将方丈的病情透露给了知客僧。你最近配的药方中有一味药被替换了，你不确定是谁干的。',
        isKiller: false,
      },
      {
        id: 'r4', name: '沙弥', avatar: svgAvatar('沙', '#8e44ad'), gender: '男', age: 16, occupation: '小沙弥',
        intro: '服侍方丈起居的小沙弥，天真无邪。',
        secret: '你目睹了当夜有人进入方丈禅房，但因为害怕没有声张。你捡到了一颗散落的佛珠。',
        isKiller: false,
      },
      {
        id: 'r5', name: '云游僧', avatar: svgAvatar('云', '#e67e22'), gender: '男', age: 40, occupation: '云游僧人',
        intro: '近日来清凉寺挂单的云游僧，方丈对其格外器重。',
        secret: '你是方丈的亲生儿子，方丈年轻时的尘缘。方丈打算传位给你以赎罪，但你不愿出家。你来只是为了认父。',
        isKiller: false,
      },
    ],
    clues: [
      { id: 'c1', name: '散落佛珠', description: '方丈的佛珠散落一地，少了一颗，有小沙弥拾到的。', phaseId: 'p3' },
      { id: 'c2', name: '药渣', description: '禅房药炉中的药渣，其中一味被替换成有毒植物。', phaseId: 'p3' },
      { id: 'c3', name: '账簿', description: '知客僧的香客账簿，收入与实际捐赠差距很大。', phaseId: 'p3' },
      { id: 'c4', name: '传位手书', description: '方丈枕头下的手书，意将住持传给云游僧。', phaseId: 'p3' },
      { id: 'c5', name: '毒药包', description: '知客僧房中暗格里的毒药包，已开封。', phaseId: 'p3' },
    ],
    phases: DEFAULT_PHASES,
  },
  {
    id: 'script-011',
    title: '双人局：最后的晚餐',
    cover: svgCover('最后的晚餐', '#1b1b2f', '#e84393'),
    difficulty: 2,
    playerCount: 2,
    duration: 40,
    tags: ['现代', '入门', '双人'],
    synopsis: '一对情侣在家中举办纪念日晚餐，男方却中毒倒地。只有你和他，真相只有一个。',
    background: '城市公寓内，小美和小帅庆祝恋爱三周年。烛光晚餐后，小帅喝下红酒不久便口吐白沫倒地。公寓门从内反锁，只有小美在场。是意外？还是谋杀？',
    roles: [
      {
        id: 'r1', name: '小美', avatar: svgAvatar('美', '#e84393'), gender: '女', age: 26, occupation: '甜品师',
        intro: '小帅的女友，温柔细腻，经营一家甜品店。',
        secret: '你三天前发现小帅手机里和其他女人的暧昧聊天。你伤心欲绝，在甜点里加了泻药想让他当众出丑——但绝不是毒药。你不知道红酒里怎么会有毒。',
        isKiller: false,
      },
      {
        id: 'r2', name: '小帅', avatar: svgAvatar('帅', '#0984e3'), gender: '男', age: 28, occupation: '销售经理',
        intro: '小美的男友，风趣幽默，在外企做销售。',
        secret: '你其实早就想和小美分手，但她是这套公寓的户主。你计划今晚提出分手并搬走，你准备了另一杯"加了料"的红酒——安眠药，想让小美睡着后顺利离开。你把两杯酒弄混了，喝下了自己准备的那杯。你害死了自己。',
        isKiller: true,
      },
    ],
    clues: [
      { id: 'c1', name: '两杯红酒', description: '桌上两杯红酒，一杯已空（小帅喝的），另一杯 untouched。两杯都有白色粉末残留。', phaseId: 'p3' },
      { id: 'c2', name: '安眠药瓶', description: '小帅外套口袋里的安眠药瓶，少了几片，瓶上有小帅的指纹。', phaseId: 'p3' },
      { id: 'c3', name: '泻药包装', description: '厨房垃圾桶里的泻药空包装，小美的甜品模具旁也有残留。', phaseId: 'p3' },
      { id: 'c4', name: '暧昧聊天记录', description: '小帅手机亮着，屏幕上是与其他女性的暧昧对话，最新一条写着"今晚我就跟她说分手"。', phaseId: 'p3' },
    ],
    phases: DEFAULT_PHASES,
  },
  {
    id: 'script-012',
    title: '三人局：画室血案',
    cover: svgCover('画室血案', '#2d3436', '#fd79a8'),
    difficulty: 2,
    playerCount: 3,
    duration: 50,
    tags: ['现代', '入门', '推理'],
    synopsis: '画家死在锁着的画室里，三人有嫌疑。颜料、匕首、密室——真相藏在画布之后。',
    background: '知名画家周大师被发现死在私人画室中，胸口被匕首刺中。画室门从内反锁，窗户关紧。当时画室内只有三名相关人员在场。钥匙在死者手中，门缝下塞着一块挡板。凶手是如何做到的？',
    roles: [
      {
        id: 'r1', name: '学徒', avatar: svgAvatar('学', '#e17055'), gender: '男', age: 24, occupation: '画室学徒',
        intro: '周大师的关门弟子，跟随学画三年，天赋出众。',
        secret: '周大师一直将你的作品署上他自己名字参展。你愤怒至极，案发前与师父激烈争吵。你有一把画室备用钥匙，但你说案发时自己在楼下调颜料。',
        isKiller: false,
      },
      {
        id: 'r2', name: '画商', avatar: svgAvatar('商', '#00b894'), gender: '女', age: 40, occupation: '艺术画商',
        intro: '周大师的独家画商，代理其作品多年。',
        secret: '你发现周大师暗中将画卖给其他渠道，违反了独家代理协议。你损失巨大，案发当晚你去找他谈判，带了防身用的匕首——但你发誓离开时他还活着。',
        isKiller: true,
      },
      {
        id: 'r3', name: '模特', avatar: svgAvatar('模', '#6c5ce7'), gender: '女', age: 22, occupation: '人体模特',
        intro: '周大师的御用模特，安静内敛。',
        secret: '你是周大师的私生女，他一直不公开承认你。你恨他，但你更想要回自己的身份。案发时你在隔壁休息室，透过门缝看到画商离开画室时手在发抖。',
        isKiller: false,
      },
    ],
    clues: [
      { id: 'c1', name: '匕首', description: '刺入胸口的匕首，刀柄上刻有画商的名字。', phaseId: 'p3' },
      { id: 'c2', name: '挡板', description: '门缝下的挡板，一面涂着红色颜料——和画室里的颜料一致，学徒的调色板上有同款。', phaseId: 'p3' },
      { id: 'c3', name: '门锁机关', description: '门内侧的锁扣上系着一根细线，从钥匙孔延伸到门外——凶手从门外用细线锁门后抽走。', phaseId: 'p3' },
      { id: 'c4', name: '代理合同', description: '桌上摊开的独家代理合同，上面用红笔写着"违约"二字。', phaseId: 'p3' },
      { id: 'c5', name: '亲子鉴定', description: '模特包中未拆封的亲子鉴定报告，收件人是周大师。', phaseId: 'p3' },
    ],
    phases: DEFAULT_PHASES,
  },
  {
    id: 'script-010',
    title: '豪门恩怨',
    cover: svgCover('豪门恩怨', '#1a237e', '#ffd700'),
    difficulty: 3,
    playerCount: 7,
    duration: 130,
    tags: ['现代', '豪门', '情感'],
    synopsis: '富豪在家中书房遇害，遗产争夺暗流涌动。七位家人各怀心事。',
    background: '地产大亨钱伯年在家中书房被发现死亡，死因是后脑遭钝器击打。当晚家中正在举行钱伯年七十寿宴，七位至亲均在场。大门紧锁，凶手必是家人之一。',
    roles: [
      {
        id: 'r1', name: '钱太太', avatar: svgAvatar('太', '#c0392b'), gender: '女', age: 65, occupation: '钱伯年之妻',
        intro: '钱伯年的结发妻子，端庄威严，掌管钱家后宅。',
        secret: '你发现钱伯年打算修改遗嘱将大部分资产捐给慈善基金，你和子女将一无所有。你当晚去找他理论。',
        isKiller: false,
      },
      {
        id: 'r2', name: '长子', avatar: svgAvatar('长', '#2980b9'), gender: '男', age: 40, occupation: '集团副总裁',
        intro: '钱伯年长子，集团副总裁，强势干练。',
        secret: '你挪用公司资金炒股亏损巨大，钱伯年发现后要你自首。你当晚与父亲大吵，有人听到了摔门声。',
        isKiller: false,
      },
      {
        id: 'r3', name: '次子', avatar: svgAvatar('次', '#27ae60'), gender: '男', age: 35, occupation: '艺术家',
        intro: '不问家业的次子，沉迷艺术，性格温和。',
        secret: '你表面上不关心家产，实际上暗中联合外人准备夺取公司控制权。你的画廊是洗钱中转站。',
        isKiller: true,
      },
      {
        id: 'r4', name: '女儿', avatar: svgAvatar('女', '#8e44ad'), gender: '女', age: 32, occupation: '律师',
        intro: '钱家独女，知名律师，精明能干。',
        secret: '你帮父亲打理法律事务时发现长子的贪腐证据，你一直在两兄弟间周旋。你当晚给父亲送了茶。',
        isKiller: false,
      },
      {
        id: 'r5', name: '长媳', avatar: svgAvatar('媳', '#e67e22'), gender: '女', age: 38, occupation: '家庭主妇',
        intro: '长子的妻子，看似贤惠的家庭主妇。',
        secret: '你发现长子有外遇，打算离婚分走一半家产。你偷拍了长子与情人的照片，存在手机里。',
        isKiller: false,
      },
      {
        id: 'r6', name: '管家', avatar: svgAvatar('管', '#16a085'), gender: '男', age: 55, occupation: '钱家管家',
        intro: '钱家老管家，服务钱家三十年。',
        secret: '你是钱伯年私生子的父亲，你的儿子就是次子。你一直暗中保护次子，知道他夺权的计划。',
        isKiller: false,
      },
      {
        id: 'r7', name: '秘书', avatar: svgAvatar('秘', '#f39c12'), gender: '女', age: 28, occupation: '钱伯年私人秘书',
        intro: '钱伯年的私人秘书，年轻干练。',
        secret: '你和钱伯年有暧昧关系，钱太太发现了。你害怕被赶走，也担心钱伯年修改遗嘱后你什么也得不到。',
        isKiller: false,
      },
    ],
    clues: [
      { id: 'c1', name: '新遗嘱', description: '书房保险箱中的新遗嘱，将资产捐给慈善基金。', phaseId: 'p3' },
      { id: 'c2', name: '奖杯', description: '书房奖杯沾有血迹，疑似凶器。奖杯上有次子的指纹。', phaseId: 'p3' },
      { id: 'c3', name: '炒股记录', description: '长子电脑中的股票交易记录，亏损数亿。', phaseId: 'p3' },
      { id: 'c4', name: '亲密照', description: '秘书手机中与钱伯年的亲密合照。', phaseId: 'p3' },
      { id: 'c5', name: '洗钱文件', description: '次子画廊的财务文件，资金流向异常。', phaseId: 'p3' },
      { id: 'c6', name: 'DNA报告', description: '管家抽屉里的旧DNA比对报告，指向次子。', phaseId: 'p3' },
      { id: 'c7', name: '离婚协议', description: '长媳包中的离婚协议草稿，要求分走一半家产。', phaseId: 'p3' },
    ],
    phases: DEFAULT_PHASES,
  },
]

// 工具方法：按 id 查找剧本
export function getScriptById(id) {
  return MOCK_SCRIPTS.find((s) => s.id === id)
}