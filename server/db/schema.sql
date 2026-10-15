-- Holmes 剧本杀平台数据库 Schema
-- PostgreSQL

-- 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ 用户表 ============
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username    VARCHAR(50) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,          -- bcrypt hash
  nickname    VARCHAR(50),
  avatar      TEXT,                            -- 头像 URL 或 SVG data URI
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============ 剧本表 ============
-- 剧本主表
CREATE TABLE IF NOT EXISTS scripts (
  id          VARCHAR(30) PRIMARY KEY,         -- script-001 等
  title       VARCHAR(100) NOT NULL,
  cover       TEXT,
  difficulty  SMALLINT DEFAULT 1,              -- 1-5
  player_count SMALLINT NOT NULL,
  duration    INT DEFAULT 120,                 -- 分钟
  tags        JSONB DEFAULT '[]'::jsonb,       -- ['民国','推理']
  synopsis    TEXT,
  background  TEXT,
  roles       JSONB DEFAULT '[]'::jsonb,       -- 角色列表（含 secret/isKiller）
  clues       JSONB DEFAULT '[]'::jsonb,       -- 线索列表
  phases      JSONB DEFAULT '[]'::jsonb,       -- 阶段定义
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============ 房间表 ============
CREATE TABLE IF NOT EXISTS rooms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        VARCHAR(6) UNIQUE NOT NULL,      -- 6位房间码
  script_id   VARCHAR(30) NOT NULL REFERENCES scripts(id),
  host_id     UUID NOT NULL REFERENCES users(id),
  status      VARCHAR(20) DEFAULT 'waiting',   -- waiting / playing / finished
  current_phase  INT DEFAULT 0,                -- 当前阶段索引
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============ 房间玩家表 ============
CREATE TABLE IF NOT EXISTS room_players (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  role_id     VARCHAR(20),                     -- 分配的角色 id（r1, r2...）
  is_ready    BOOLEAN DEFAULT FALSE,
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- ============ 游戏记录表 ============
CREATE TABLE IF NOT EXISTS game_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  script_id   VARCHAR(30) NOT NULL REFERENCES scripts(id),
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  ended_at    TIMESTAMPTZ,
  winner      VARCHAR(50),                     -- 'killers' / 'civilians'
  final_phase INT,                             -- 完成到哪个阶段
  replay_data JSONB                            -- 完整复盘数据
);

-- ============ 投票记录表 ============
CREATE TABLE IF NOT EXISTS votes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id      UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  voter_id     UUID NOT NULL REFERENCES users(id),
  target_role_id VARCHAR(20) NOT NULL,         -- 投票目标角色 id
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, voter_id)                    -- 每人每房间一票
);

-- ============ 索引 ============
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_players_room ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_room_players_user ON room_players(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_room ON votes(room_id);
CREATE INDEX IF NOT EXISTS idx_scripts_tags ON scripts USING GIN(tags);