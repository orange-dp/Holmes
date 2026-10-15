#!/bin/sh
# 等待数据库就绪
echo "[Start] 等待数据库就绪..."
until node -e "
  const { Client } = require('pg');
  const c = new Client({ host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  c.connect().then(() => c.end()).catch(() => process.exit(1));
" 2>/dev/null; do
  echo "[Start] 数据库未就绪，2 秒后重试..."
  sleep 2
done
echo "[Start] 数据库已就绪"

# 导入种子数据
echo "[Start] 导入种子数据..."
node db/seed.js

# 启动 API 服务
echo "[Start] 启动 API 服务..."
node index.js