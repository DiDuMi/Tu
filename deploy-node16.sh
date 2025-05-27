#!/bin/bash

# 兔图项目部署脚本 - Node.js v16.20.2 版本
# 修复环境并部署项目

set -e

echo "========================================"
echo "🚀 兔图项目部署 (Node.js v16.20.2)"
echo "========================================"

PROJECT_DIR="/www/wwwroot/tu-project"

# 1. 修复 Node.js 环境
echo "1. 修复 Node.js 环境..."

# 清理 nvm 冲突
unset NVM_DIR 2>/dev/null || true
export NVM_DIR=""

# 设置 Node.js 路径
NODEJS_PATH="/www/server/nodejs/v16.20.2/bin"
export PATH="$NODEJS_PATH:$PATH"

# 创建软链接
ln -sf "$NODEJS_PATH/node" /usr/local/bin/node
ln -sf "$NODEJS_PATH/npm" /usr/local/bin/npm
ln -sf "$NODEJS_PATH/npx" /usr/local/bin/npx

# 验证 Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js 仍然无法使用"
    exit 1
fi

if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm 仍然无法使用"
    exit 1
fi

# 2. 修复 npm 配置
echo ""
echo "2. 修复 npm 配置..."
npm config delete prefix 2>/dev/null || true
npm config set registry https://registry.npmmirror.com

# 3. 安装 PM2
echo ""
echo "3. 安装 PM2..."
npm install -g pm2

if command -v pm2 &> /dev/null; then
    echo "✅ PM2: $(pm2 --version)"
    ln -sf "$NODEJS_PATH/pm2" /usr/local/bin/pm2
else
    echo "❌ PM2 安装失败"
    exit 1
fi

# 4. 进入项目目录
echo ""
echo "4. 进入项目目录..."
cd $PROJECT_DIR

# 5. 停止现有服务
echo ""
echo "5. 停止现有服务..."
pm2 delete tu-project 2>/dev/null || true

# 6. 创建必要目录
echo ""
echo "6. 创建必要目录..."
mkdir -p logs
mkdir -p public/uploads/media
mkdir -p backups
mkdir -p prisma

# 7. 设置权限
echo ""
echo "7. 设置权限..."
chown -R www:www .
chmod -R 755 .
chmod -R 777 public/uploads

# 8. 清理旧依赖
echo ""
echo "8. 清理旧依赖..."
rm -rf node_modules
rm -rf package-lock.json
rm -rf .next

# 9. 修复 Node.js 16 兼容性并安装依赖
echo ""
echo "9. 修复 Node.js 16 兼容性..."

# 运行兼容性修复脚本
if [ -f "fix-node16-compatibility.sh" ]; then
    chmod +x fix-node16-compatibility.sh
    ./fix-node16-compatibility.sh
else
    # 备用方案：手动修复
    echo "⚠️  兼容性脚本不存在，使用备用方案"

    # 清理依赖
    rm -rf node_modules package-lock.json .next

    # 配置 npm
    npm config set engine-strict false
    npm config set legacy-peer-deps true
    npm config set registry https://registry.npmmirror.com

    # 安装依赖
    npm install --no-engine-strict --legacy-peer-deps

    if [ $? -eq 0 ]; then
        echo "✅ 依赖安装成功"
    else
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

# 10. 生成 Prisma 客户端
echo ""
echo "10. 生成 Prisma 客户端..."
npx prisma generate

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
        echo "❌ 环境变量模板文件不存在"
        exit 1
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

# 运行 SQLite 初始化脚本
if [ -f "init-sqlite.sh" ]; then
    chmod +x init-sqlite.sh
    ./init-sqlite.sh
else
    # 备用方案：直接初始化
    npx prisma db push --accept-data-loss
fi

# 13. 构建项目
echo ""
echo "13. 构建项目..."
NODE_ENV=production npm run build

if [ $? -eq 0 ]; then
    echo "✅ 项目构建成功"
else
    echo "❌ 项目构建失败"
    exit 1
fi

# 14. 启动 PM2 服务
echo ""
echo "14. 启动 PM2 服务..."
pm2 start ecosystem.config.js --env production

if [ $? -eq 0 ]; then
    echo "✅ PM2 启动成功"
else
    echo "❌ PM2 启动失败"
    exit 1
fi

# 15. 保存 PM2 配置
pm2 save
pm2 startup systemd -u www --hp /home/www

# 16. 验证部署
echo ""
echo "15. 验证部署..."
sleep 5

if pm2 list | grep -q "tu-project"; then
    echo "✅ PM2 进程运行正常"
else
    echo "❌ PM2 进程未运行"
    pm2 logs tu-project
    exit 1
fi

if netstat -tlnp | grep -q ":3000"; then
    echo "✅ 端口 3000 监听正常"
else
    echo "❌ 端口 3000 未监听"
fi

# 17. 测试 HTTP 响应
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo "✅ HTTP 响应正常"
else
    echo "⚠️  HTTP 响应异常，请检查应用日志"
fi

echo ""
echo "========================================"
echo "🎉 部署完成！"
echo "========================================"
echo ""
echo "📍 访问信息:"
echo "   网站地址: http://103.194.106.150"
echo "   管理后台: http://103.194.106.150/admin"
echo ""
echo "🔧 常用命令:"
echo "   查看状态: pm2 status"
echo "   查看日志: pm2 logs tu-project"
echo "   重启应用: pm2 restart tu-project"
echo ""
echo "📊 版本信息:"
echo "   Node.js: $(node --version)"
echo "   npm: $(npm --version)"
echo "   PM2: $(pm2 --version)"
echo "   Next.js: 13.5.6"
echo ""
echo "⚠️  注意事项:"
echo "1. 如果网站无法访问，请检查 Nginx 配置"
echo "2. 确保防火墙开放 3000 端口"
echo "3. 定期查看 PM2 日志确保服务正常"
