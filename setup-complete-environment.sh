#!/bin/bash

# 完整环境设置和项目部署脚本
# 从零开始配置 Node.js v20.10.0 和兔图项目

set -e

echo "========================================"
echo "🔧 完整环境设置和项目部署"
echo "========================================"

# 1. 查找 Node.js 安装
echo "1. 查找 Node.js 安装..."

POSSIBLE_PATHS=(
    "/www/server/nodejs/v20.10.0"
    "/www/server/nodejs/v20.9.0"
    "/www/server/nodejs/v20.8.0"
    "/usr/local/nodejs"
    "/opt/nodejs"
)

NODEJS_PATH=""
for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -d "$path/bin" ] && [ -f "$path/bin/node" ]; then
        NODEJS_PATH="$path/bin"
        NODE_VERSION=$($path/bin/node --version 2>/dev/null || echo "unknown")
        echo "找到 Node.js: $path ($NODE_VERSION)"
        break
    fi
done

if [ -z "$NODEJS_PATH" ]; then
    echo "❌ 未找到 Node.js 安装"
    echo "正在通过宝塔面板查找..."
    
    # 查找宝塔面板的 Node.js
    if [ -d "/www/server/nodejs" ]; then
        echo "宝塔 Node.js 目录内容:"
        ls -la /www/server/nodejs/
        
        # 尝试找到最新版本
        LATEST_VERSION=$(ls /www/server/nodejs/ | grep "^v" | sort -V | tail -1)
        if [ -n "$LATEST_VERSION" ] && [ -f "/www/server/nodejs/$LATEST_VERSION/bin/node" ]; then
            NODEJS_PATH="/www/server/nodejs/$LATEST_VERSION/bin"
            echo "使用最新版本: $LATEST_VERSION"
        else
            echo "❌ 宝塔面板中未找到可用的 Node.js"
            echo "请通过宝塔面板安装 Node.js 20.x"
            exit 1
        fi
    else
        echo "❌ 宝塔面板目录不存在"
        exit 1
    fi
fi

echo "✅ 使用 Node.js: $NODEJS_PATH"

# 2. 设置环境变量
echo ""
echo "2. 设置环境变量..."
export PATH="$NODEJS_PATH:$PATH"
export NODE_PATH="$(dirname $NODEJS_PATH)/lib/node_modules"

# 3. 创建系统软链接
echo ""
echo "3. 创建系统软链接..."
ln -sf "$NODEJS_PATH/node" /usr/local/bin/node
ln -sf "$NODEJS_PATH/npm" /usr/local/bin/npm
ln -sf "$NODEJS_PATH/npx" /usr/local/bin/npx

# 4. 验证 Node.js
echo ""
echo "4. 验证 Node.js..."
if command -v node &> /dev/null; then
    NODE_VER=$(node --version)
    NPM_VER=$(npm --version)
    echo "✅ Node.js: $NODE_VER"
    echo "✅ npm: $NPM_VER"
else
    echo "❌ Node.js 仍然无法使用"
    exit 1
fi

# 5. 配置 npm
echo ""
echo "5. 配置 npm..."
npm config delete prefix 2>/dev/null || true
npm config set registry https://registry.npmmirror.com
npm config set fund false
npm config set audit false

# 6. 安装 PM2
echo ""
echo "6. 安装 PM2..."
npm install -g pm2
ln -sf "$NODEJS_PATH/pm2" /usr/local/bin/pm2

if command -v pm2 &> /dev/null; then
    echo "✅ PM2: $(pm2 --version)"
else
    echo "❌ PM2 安装失败"
    exit 1
fi

# 7. 创建项目目录
echo ""
echo "7. 创建项目目录..."
PROJECT_DIR="/www/wwwroot/tu-project"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 8. 检查项目文件
echo ""
echo "8. 检查项目文件..."
if [ ! -f "package.json" ]; then
    echo "❌ 项目文件不存在，需要上传项目文件"
    echo "请将项目文件上传到: $PROJECT_DIR"
    echo ""
    echo "必需的文件:"
    echo "  - package.json"
    echo "  - next.config.js"
    echo "  - prisma/schema.prisma"
    echo "  - pages/ 目录"
    echo "  - components/ 目录"
    echo ""
    echo "上传完成后，重新运行此脚本"
    exit 1
fi

echo "✅ 项目文件存在"

# 9. 创建必要目录
echo ""
echo "9. 创建必要目录..."
mkdir -p logs
mkdir -p public/uploads/media
mkdir -p backups
mkdir -p prisma

# 10. 设置权限
echo ""
echo "10. 设置权限..."
chown -R www:www $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
chmod -R 777 $PROJECT_DIR/public/uploads

# 11. 清理旧依赖
echo ""
echo "11. 清理旧依赖..."
rm -rf node_modules package-lock.json .next 2>/dev/null || true

# 12. 安装依赖
echo ""
echo "12. 安装项目依赖..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ 依赖安装成功"
else
    echo "❌ 依赖安装失败"
    exit 1
fi

# 13. 生成 Prisma 客户端
echo ""
echo "13. 生成 Prisma 客户端..."
npx prisma generate

# 14. 配置环境变量
echo ""
echo "14. 配置环境变量..."
if [ ! -f ".env" ]; then
    if [ -f ".env.baota" ]; then
        cp .env.baota .env
        sed -i 's/YOUR_SERVER_IP/103.194.106.150/g' .env
        echo "✅ 环境变量文件已创建"
    else
        cat > .env << 'EOF'
NODE_ENV="production"
PORT=3000
DATABASE_URL="file:./prisma/production.db"
NEXTAUTH_URL="http://103.194.106.150"
NEXTAUTH_SECRET="tu-project-secret-key-$(date +%s)"
MEDIA_STORAGE_PATH="./public/uploads"
MAX_FILE_SIZE=52428800
EOF
        echo "✅ 基础环境变量文件已创建"
    fi
fi

# 15. 初始化数据库
echo ""
echo "15. 初始化数据库..."
if ! command -v sqlite3 &> /dev/null; then
    echo "安装 SQLite..."
    apt update && apt install -y sqlite3
fi

npx prisma db push --accept-data-loss

# 16. 构建项目
echo ""
echo "16. 构建项目..."
NODE_ENV=production npm run build

if [ $? -eq 0 ]; then
    echo "✅ 项目构建成功"
else
    echo "❌ 项目构建失败"
    exit 1
fi

# 17. 启动服务
echo ""
echo "17. 启动服务..."
pm2 delete tu-project 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save

# 18. 永久保存环境变量
echo ""
echo "18. 永久保存环境变量..."
cat >> ~/.bashrc << EOF

# Node.js 环境变量
export PATH="$NODEJS_PATH:\$PATH"
export NODE_PATH="$(dirname $NODEJS_PATH)/lib/node_modules"
EOF

cat >> /etc/profile << EOF

# Node.js 环境变量
export PATH="$NODEJS_PATH:\$PATH"
export NODE_PATH="$(dirname $NODEJS_PATH)/lib/node_modules"
EOF

# 19. 验证部署
echo ""
echo "19. 验证部署..."
sleep 5

if pm2 list | grep -q "tu-project"; then
    echo "✅ PM2 进程运行正常"
else
    echo "❌ PM2 进程未运行"
    pm2 logs tu-project
    exit 1
fi

echo ""
echo "========================================"
echo "🎉 完整环境设置和部署完成！"
echo "========================================"
echo ""
echo "📊 环境信息:"
echo "   Node.js: $(node --version)"
echo "   npm: $(npm --version)"
echo "   PM2: $(pm2 --version)"
echo "   项目目录: $PROJECT_DIR"
echo ""
echo "📍 访问信息:"
echo "   网站地址: http://103.194.106.150"
echo "   管理后台: http://103.194.106.150/admin"
echo ""
echo "🔧 管理命令:"
echo "   查看状态: pm2 status"
echo "   查看日志: pm2 logs tu-project"
echo "   重启应用: pm2 restart tu-project"
echo ""
echo "⚠️  重要提醒:"
echo "1. 请重新登录终端以加载新的环境变量"
echo "2. 或者执行: source ~/.bashrc"
echo "3. 如果网站无法访问，请检查 Nginx 配置"
