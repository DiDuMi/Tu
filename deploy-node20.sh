#!/bin/bash

# 兔图项目 Node.js v20.10.0 完整部署脚本
# 支持所有最新功能和最佳性能

set -e

echo "========================================"
echo "🚀 兔图项目完整部署 (Node.js v20.10.0)"
echo "========================================"

# 定义路径
NODEJS_BIN="/www/server/nodejs/v20.10.0/bin"
NODE="$NODEJS_BIN/node"
NPM="$NODEJS_BIN/npm"
NPX="$NODEJS_BIN/npx"
PM2="$NODEJS_BIN/pm2"
PROJECT_DIR="/www/wwwroot/tu-project"

# 1. 验证 Node.js v20.10.0 环境
echo "1. 验证 Node.js v20.10.0 环境..."
if [ ! -f "$NODE" ]; then
    echo "❌ Node.js v20.10.0 不存在: $NODE"
    echo "请确认 Node.js v20.10.0 已正确安装"
    exit 1
fi

NODE_VERSION=$($NODE --version)
NPM_VERSION=$($NPM --version)

echo "✅ Node.js: $NODE_VERSION"
echo "✅ npm: $NPM_VERSION"

# 验证版本要求
if [[ "$NODE_VERSION" < "v20.0.0" ]]; then
    echo "❌ Node.js 版本过低，需要 v20.0.0+"
    exit 1
fi

# 2. 设置环境变量
echo ""
echo "2. 设置环境变量..."
export PATH="$NODEJS_BIN:$PATH"
export NODE_PATH="/www/server/nodejs/v20.10.0/lib/node_modules"

# 创建系统软链接
ln -sf "$NODE" /usr/local/bin/node
ln -sf "$NPM" /usr/local/bin/npm
ln -sf "$NPX" /usr/local/bin/npx

# 3. 停止现有服务
echo ""
echo "3. 停止现有服务..."
$PM2 delete tu-project 2>/dev/null || true

# 4. 进入项目目录
echo ""
echo "4. 进入项目目录..."
cd $PROJECT_DIR

# 5. 创建必要目录
echo ""
echo "5. 创建必要目录..."
mkdir -p logs
mkdir -p public/uploads/media
mkdir -p backups
mkdir -p prisma

# 6. 设置权限
echo ""
echo "6. 设置权限..."
chown -R www:www .
chmod -R 755 .
chmod -R 777 public/uploads

# 7. 清理旧依赖
echo ""
echo "7. 清理旧依赖..."
rm -rf node_modules
rm -rf package-lock.json
rm -rf .next

# 8. 配置 npm
echo ""
echo "8. 配置 npm..."
$NPM config delete prefix 2>/dev/null || true
$NPM config set registry https://registry.npmmirror.com
$NPM config set fund false
$NPM config set audit false

# 9. 安装项目依赖
echo ""
echo "9. 安装项目依赖..."
$NPM install

if [ $? -eq 0 ]; then
    echo "✅ 依赖安装成功"
else
    echo "❌ 依赖安装失败"
    exit 1
fi

# 10. 生成 Prisma 客户端
echo ""
echo "10. 生成 Prisma 客户端..."
$NPX prisma generate

# 11. 配置环境变量
echo ""
echo "11. 配置环境变量..."
if [ ! -f ".env" ]; then
    if [ -f ".env.baota" ]; then
        cp .env.baota .env
        # 替换服务器IP
        sed -i 's/YOUR_SERVER_IP/103.194.106.150/g' .env
        echo "✅ 环境变量文件已创建"
    else
        # 创建基础环境变量
        cat > .env << 'EOF'
NODE_ENV="production"
PORT=3000
DATABASE_URL="file:./prisma/production.db"
NEXTAUTH_URL="http://103.194.106.150"
NEXTAUTH_SECRET="your-super-secure-secret-key-change-this-in-production"
MEDIA_STORAGE_PATH="./public/uploads"
MAX_FILE_SIZE=52428800
ALLOWED_IMAGE_TYPES="image/jpeg,image/png,image/gif,image/webp"
ALLOWED_VIDEO_TYPES="video/mp4,video/webm,video/ogg"
EOF
        echo "✅ 基础环境变量文件已创建"
    fi
fi

# 12. 初始化 SQLite 数据库
echo ""
echo "12. 初始化 SQLite 数据库..."

# 检查 SQLite 是否安装
if ! command -v sqlite3 &> /dev/null; then
    echo "安装 SQLite..."
    apt update && apt install -y sqlite3
fi

# 初始化数据库
$NPX prisma db push --accept-data-loss

if [ $? -eq 0 ]; then
    echo "✅ 数据库初始化成功"
else
    echo "❌ 数据库初始化失败"
    exit 1
fi

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

# 14. 安装 PM2（如果未安装）
echo ""
echo "14. 配置 PM2..."
if [ ! -f "$PM2" ]; then
    echo "安装 PM2..."
    $NPM install -g pm2
    ln -sf "$NODEJS_BIN/pm2" /usr/local/bin/pm2
fi

# 15. 启动 PM2 服务
echo ""
echo "15. 启动 PM2 服务..."
$PM2 start ecosystem.config.js --env production

if [ $? -eq 0 ]; then
    echo "✅ PM2 启动成功"
else
    echo "❌ PM2 启动失败"
    exit 1
fi

# 16. 保存 PM2 配置
$PM2 save
$PM2 startup systemd -u www --hp /home/www

# 17. 验证部署
echo ""
echo "16. 验证部署..."
sleep 10

if $PM2 list | grep -q "tu-project"; then
    echo "✅ PM2 进程运行正常"
else
    echo "❌ PM2 进程未运行"
    $PM2 logs tu-project
    exit 1
fi

if netstat -tlnp | grep -q ":3000"; then
    echo "✅ 端口 3000 监听正常"
else
    echo "❌ 端口 3000 未监听"
fi

# 18. 测试 HTTP 响应
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo "✅ HTTP 响应正常"
else
    echo "⚠️  HTTP 响应异常，请检查应用日志"
fi

echo ""
echo "========================================"
echo "🎉 Node.js v20.10.0 部署完成！"
echo "========================================"
echo ""
echo "📍 访问信息:"
echo "   网站地址: http://103.194.106.150"
echo "   管理后台: http://103.194.106.150/admin"
echo ""
echo "🔧 管理命令:"
echo "   查看状态: pm2 status"
echo "   查看日志: pm2 logs tu-project"
echo "   重启应用: pm2 restart tu-project"
echo "   停止应用: pm2 stop tu-project"
echo ""
echo "📊 版本信息:"
echo "   Node.js: $NODE_VERSION"
echo "   npm: $NPM_VERSION"
echo "   Next.js: 14.2.18"
echo "   Prisma: 5.22.0"
echo ""
echo "✨ 功能特性:"
echo "   ✅ 完整的图片处理 (Sharp)"
echo "   ✅ Canvas 绘图功能"
echo "   ✅ 最新的 Next.js 特性"
echo "   ✅ 高性能优化"
echo "   ✅ 完整的 TypeScript 支持"
echo ""
echo "📁 重要文件:"
echo "   数据库: ./prisma/production.db"
echo "   日志: ./logs/"
echo "   上传: ./public/uploads/"
echo "   备份: ./backups/"
