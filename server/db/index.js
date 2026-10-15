import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'holmes',
  password: process.env.DB_PASSWORD || 'holmes123',
  database: process.env.DB_NAME || 'holmes',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// 初始化：执行 schema.sql
export async function initDB() {
  const fs = await import('fs')
  const path = await import('path')
  const { fileURLToPath } = await import('url')
  const __dirname = path.dirname(fileURLToPath(import.meta.url))

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8')
  await pool.query(schema)
  console.log('[DB] Schema 初始化完成')
}

// 便捷查询封装
export const query = (text, params) => pool.query(text, params)

// 单行查询
export async function queryOne(text, params) {
  const res = await pool.query(text, params)
  return res.rows[0] || null
}

// 多行查询
export async function queryAll(text, params) {
  const res = await pool.query(text, params)
  return res.rows
}

export default pool