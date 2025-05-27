#!/bin/bash

# 紧急修复脚本 - 解决 Node.js 环境问题
# 适用于宝塔面板环境

set -e

echo "========================================"
echo "🚨 紧急修复 - Node.js 环境问题"
echo "========================================"
echo ""

# 1. 检查系统状态
echo "1. 检查系统状态..."
echo "当前用户: $(whoami)"
echo "系统版本: $(cat /etc/os-release | grep PRETTY_NAME)"
echo ""

# 2. 查找已安装的 Node.js
echo "2. 查找已安装的 Node.js..."
echo "宝塔 Node.js 目录:"
ls -la /www/server/nodejs/ 2>/dev/null || echo "未找到宝塔 Node.js 安装"
echo ""

echo "系统 Node.js 位置:"
which node 2>/dev/null || echo "系统中未找到 node 命令"
which npm 2>/dev/null || echo "系统中未找到 npm 命令"
echo ""

# 3. 检查环境变量
echo "3. 当前 PATH 环境变量:"
echo $PATH
echo ""

# 4. 尝试修复环境变量
echo "4. 尝试修复环境变量..."

# 查找可用的 Node.js 版本
NODEJS_VERSIONS=(
    "/www/server/nodejs/v18.19.0"
    "/www/server/nodejs/v18.18.0"
    "/www/server/nodejs/v18.17.0"
    "/www/server/nodejs/v16.20.2"
)

NODEJS_PATH=""
for version in "${NODEJS_VERSIONS[@]}"; do
    if [ -d "$version/bin" ]; then
        NODEJS_PATH="$version/bin"
        echo "找到 Node.js: $version"
        break
    fi
done

if [ -z "$NODEJS_PATH" ]; then
    echo "❌ 未找到任何可用的 Node.js 安装"
    echo ""
    echo "请通过宝塔面板安装 Node.js:"
    echo "1. 登录宝塔面板"
    echo "2. 软件商店 → Node.js版本管理器"
    echo "3. 安装 Node.js 18.19.0 LTS"
    echo "4. 设置为默认版本"
    exit 1
fi

# 5. 设置环境变量
echo "5. 设置环境变量..."
export PATH="$NODEJS_PATH:$PATH"

# 验证 Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js 版本: $NODE_VERSION"
else
    echo "❌ Node.js 仍然无法使用"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm 版本: $NPM_VERSION"
else
    echo "❌ npm 仍然无法使用"
    exit 1
fi

# 6. 修复 npm 配置
echo ""
echo "6. 修复 npm 配置..."
npm config delete prefix 2>/dev/null || true
npm config set registry https://registry.npmmirror.com

# 7. 永久保存环境变量
echo ""
echo "7. 永久保存环境变量..."
echo "export PATH=\"$NODEJS_PATH:\$PATH\"" >> ~/.bashrc
echo "环境变量已添加到 ~/.bashrc"

# 8. 进入项目目录并修复
echo ""
echo "8. 修复项目环境..."
cd /www/wwwroot/tu-project

# 创建必要目录
mkdir -p logs
mkdir -p public/uploads/media
mkdir -p backups
mkdir -p prisma

echo "✅ 目录创建完成"

# 设置权限
chown -R www:www .
chmod -R 755 .
chmod -R 777 public/uploads

echo "✅ 权限设置完成"

# 9. 清理并重新安装依赖
echo ""
echo "9. 清理并重新安装依赖..."
rm -rf node_modules package-lock.json .next 2>/dev/null || true

echo "开始安装依赖..."
npm install --production=false

if [ $? -eq 0 ]; then
    echo "✅ 依赖安装成功"
else
    echo "❌ 依赖安装失败"
    exit 1
fi

# 10. 生成 Prisma 客户端
echo ""
echo "10. 生成 Prisma 客户端..."
npx prisma generate

# 11. 检查环境变量文件
echo ""
echo "11. 检查环境变量文件..."
if [ ! -f ".env" ]; then
    if [ -f ".env.baota" ]; then
        cp .env.baota .env
        echo "✅ 环境变量文件已创建"
        echo "⚠️  请编辑 .env 文件，设置正确的服务器IP"
    else
        echo "❌ 环境变量模板文件不存在"
    fi
fi

# 12. 构建项目
echo ""
echo "12. 构建项目..."
NODE_ENV=production npm run build

if [ $? -eq 0 ]; then
    echo "✅ 项目构建成功"
else
    echo "❌ 项目构建失败"
    exit 1
fi

# 13. 停止旧的 PM2 进程
echo ""
echo "13. 停止旧的 PM2 进程..."
pm2 delete tu-project 2>/dev/null || true

# 14. 启动新的 PM2 进程
echo ""
echo "14. 启动 PM2 进程..."
pm2 start ecosystem.config.js --env production

if [ $? -eq 0 ]; then
    echo "✅ PM2 启动成功"
    pm2 save
else
    echo "❌ PM2 启动失败"
    exit 1
fi

# 15. 最终验证
echo ""
echo "15. 最终验证..."
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

echo ""
echo "========================================"
echo "🎉 修复完成！"
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
echo "⚠️  重要提醒:"
echo "1. 请重新登录终端以加载新的环境变量"
echo "2. 如果网站无法访问，请检查 Nginx 配置"
echo "3. 确保在 .env 文件中设置了正确的服务器IP"
