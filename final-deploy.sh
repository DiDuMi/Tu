#!/bin/bash

# 最终部署脚本 - 使用完整路径避免环境变量问题
# 适用于 Node.js 16.20.2

set -e

echo "========================================"
echo "🚀 最终部署 - 使用完整路径"
echo "========================================"

# 定义路径
NODEJS_BIN="/www/server/nodejs/v16.20.2/bin"
NODE="$NODEJS_BIN/node"
NPM="$NODEJS_BIN/npm"
NPX="$NODEJS_BIN/npx"
PM2="$NODEJS_BIN/pm2"
PROJECT_DIR="/www/wwwroot/tu-project"

# 1. 验证 Node.js 环境
echo "1. 验证 Node.js 环境..."
if [ ! -f "$NODE" ]; then
    echo "❌ Node.js 不存在: $NODE"
    echo "请检查 Node.js 安装路径"
    exit 1
fi

echo "✅ Node.js: $($NODE --version)"
echo "✅ npm: $($NPM --version)"

# 2. 停止现有服务
echo ""
echo "2. 停止现有服务..."
$PM2 delete tu-project 2>/dev/null || true

# 3. 进入项目目录
echo ""
echo "3. 进入项目目录..."
cd $PROJECT_DIR

# 4. 创建必要目录
echo ""
echo "4. 创建必要目录..."
mkdir -p logs public/uploads/media backups prisma
chown -R www:www .
chmod -R 755 .
chmod -R 777 public/uploads

# 5. 清理依赖
echo ""
echo "5. 清理依赖..."
rm -rf node_modules package-lock.json .next

# 6. 配置 npm
echo ""
echo "6. 配置 npm..."
$NPM config delete prefix 2>/dev/null || true
$NPM config set registry https://registry.npmmirror.com
$NPM config set engine-strict false
$NPM config set legacy-peer-deps true
$NPM config set unsafe-perm true

# 7. 创建最小化 package.json
echo ""
echo "7. 创建最小化配置..."
cat > package.json << 'EOF'
{
  "name": "tu-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "prisma:generate": "prisma generate"
  },
  "dependencies": {
    "@headlessui/react": "^2.2.4",
    "@heroicons/react": "^2.2.0",
    "@next-auth/prisma-adapter": "^1.0.7",
    "@prisma/client": "^5.22.0",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "bcryptjs": "^3.0.2",
    "clsx": "^2.1.1",
    "formidable": "^3.5.1",
    "lucide-react": "^0.511.0",
    "next": "13.5.6",
    "next-auth": "4.24.5",
    "postcss": "^8",
    "prisma": "^5.22.0",
    "react": "^18",
    "react-dom": "^18",
    "swr": "^2.2.4",
    "tailwindcss": "^3.3.0",
    "typescript": "^5",
    "zod": "^3.22.4",
    "zustand": "^4.4.7"
  },
  "engines": {
    "node": ">=16.20.0",
    "npm": ">=8.0.0"
  }
}
EOF

# 8. 安装依赖
echo ""
echo "8. 安装依赖..."
$NPM install --no-engine-strict --legacy-peer-deps --unsafe-perm

# 9. 生成 Prisma 客户端
echo ""
echo "9. 生成 Prisma 客户端..."
$NPX prisma generate

# 10. 配置环境变量
echo ""
echo "10. 配置环境变量..."
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
NODE_ENV="production"
PORT=3000
DATABASE_URL="file:./prisma/production.db"
NEXTAUTH_URL="http://103.194.106.150"
NEXTAUTH_SECRET="your-super-secure-secret-key-change-this"
MEDIA_STORAGE_PATH="./public/uploads"
MAX_FILE_SIZE=52428800
EOF
    echo "✅ 环境变量文件已创建"
fi

# 11. 初始化数据库
echo ""
echo "11. 初始化数据库..."
$NPX prisma db push --accept-data-loss

# 12. 创建简化配置
echo ""
echo "12. 创建简化配置..."
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: false,
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
EOF

# 13. 构建项目
echo ""
echo "13. 构建项目..."
NODE_ENV=production $NPM run build

if [ $? -eq 0 ]; then
    echo "✅ 项目构建成功"
else
    echo "❌ 项目构建失败"
    exit 1
fi

# 14. 更新 PM2 配置
echo ""
echo "14. 更新 PM2 配置..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'tu-project',
    script: '$NPM',
    args: 'start',
    cwd: '$PROJECT_DIR',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    max_memory_restart: '1G',
  }]
};
EOF

# 15. 启动 PM2
echo ""
echo "15. 启动 PM2..."
$PM2 start ecosystem.config.js --env production
$PM2 save

# 16. 验证部署
echo ""
echo "16. 验证部署..."
sleep 5

if $PM2 list | grep -q "tu-project"; then
    echo "✅ PM2 进程运行正常"
else
    echo "❌ PM2 进程未运行"
    $PM2 logs tu-project
    exit 1
fi

echo ""
echo "========================================"
echo "🎉 最终部署完成！"
echo "========================================"
echo ""
echo "📍 访问地址: http://103.194.106.150"
echo "🔧 管理命令:"
echo "   查看状态: $PM2 status"
echo "   查看日志: $PM2 logs tu-project"
echo "   重启应用: $PM2 restart tu-project"
echo ""
echo "📊 版本信息:"
echo "   Node.js: $($NODE --version)"
echo "   npm: $($NPM --version)"
echo "   Next.js: 13.5.6"
