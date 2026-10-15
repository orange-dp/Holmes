/**
 * 种子数据脚本：将 Mock 剧本数据导入 PostgreSQL
 * 运行: npm run seed
 */
import { initDB, query } from './index.js'
import { MOCK_SCRIPTS, DEFAULT_PHASES } from './mock-scripts.js'

async function seedScripts() {
  console.log('[Seed] 开始导入剧本数据...')

  for (const script of MOCK_SCRIPTS) {
    const {
      id, title, cover, difficulty, playerCount, duration,
      tags, synopsis, background, roles, clues, phases,
    } = script

    await query(
      `INSERT INTO scripts (id, title, cover, difficulty, player_count, duration, tags, synopsis, background, roles, clues, phases)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         cover = EXCLUDED.cover,
         difficulty = EXCLUDED.difficulty,
         player_count = EXCLUDED.player_count,
         duration = EXCLUDED.duration,
         tags = EXCLUDED.tags,
         synopsis = EXCLUDED.synopsis,
         background = EXCLUDED.background,
         roles = EXCLUDED.roles,
         clues = EXCLUDED.clues,
         phases = EXCLUDED.phases,
         updated_at = NOW()`,
      [
        id, title, cover, difficulty, playerCount, duration,
        JSON.stringify(tags), synopsis, background,
        JSON.stringify(roles), JSON.stringify(clues),
        JSON.stringify(phases || DEFAULT_PHASES),
      ]
    )
    console.log(`  ✓ 导入: ${title} (${id})`)
  }

  console.log(`[Seed] 完成，共导入 ${MOCK_SCRIPTS.length} 个剧本`)
}

async function seedAdminUser() {
  console.log('[Seed] 创建默认管理员账号...')

  const bcrypt = await import('bcryptjs')
  const hash = bcrypt.hashSync('admin123', 10)

  await query(
    `INSERT INTO users (username, password, nickname)
     VALUES ($1, $2, $3)
     ON CONFLICT (username) DO NOTHING`,
    ['admin', hash, '管理员']
  )
  console.log('  ✓ admin / admin123')
}

async function main() {
  try {
    await initDB()
    await seedScripts()
    await seedAdminUser()
    console.log('\n[Seed] 全部完成！')
    process.exit(0)
  } catch (err) {
    console.error('[Seed] 失败:', err)
    process.exit(1)
  }
}

main()