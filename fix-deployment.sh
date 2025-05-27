#!/bin/bash

# 兔图项目部署修复脚本
# 解决 Node.js 版本和环境问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "========================================"
echo "🔧 兔图项目部署修复"
echo "========================================"
echo ""

PROJECT_DIR="/www/wwwroot/tu-project"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 root 用户运行此脚本"
    log_info "使用命令: sudo ./fix-deployment.sh"
    exit 1
fi

# 进入项目目录
cd $PROJECT_DIR

# 1. 停止现有PM2进程
log_info "停止现有PM2进程..."
pm2 delete tu-project 2>/dev/null || true
pm2 kill 2>/dev/null || true

# 2. 修复npm配置冲突
log_info "修复npm配置冲突..."
npm config delete prefix 2>/dev/null || true
export NVM_DIR=""
unset NVM_DIR

# 3. 检查Node.js版本
log_info "检查Node.js版本..."
NODE_VERSION=$(node --version 2>/dev/null || echo "未安装")
log_info "当前Node.js版本: $NODE_VERSION"

if [[ "$NODE_VERSION" < "v18.17.0" ]]; then
    log_error "Node.js版本过低: $NODE_VERSION"
    log_error "请在宝塔面板中安装Node.js 18.x LTS"
    log_info "路径: 软件商店 → Node.js版本管理器 → 安装18.x版本"
    exit 1
fi

# 4. 创建必要目录
log_info "创建必要目录..."
mkdir -p logs
mkdir -p public/uploads/media
mkdir -p backups
mkdir -p prisma

# 5. 设置目录权限
log_info "设置目录权限..."
chown -R www:www $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
chmod -R 777 $PROJECT_DIR/public/uploads
chmod -R 755 $PROJECT_DIR/logs

# 6. 清理旧依赖
log_info "清理旧依赖..."
rm -rf node_modules
rm -f package-lock.json
rm -rf .next

# 7. 设置npm镜像
log_info "设置npm镜像..."
npm config set registry https://registry.npmmirror.com

# 8. 安装依赖
log_info "安装项目依赖..."
npm install --production=false

if [ $? -ne 0 ]; then
    log_error "依赖安装失败"
    exit 1
fi

# 9. 生成Prisma客户端
log_info "生成Prisma客户端..."
npx prisma generate

# 10. 检查环境变量
log_info "检查环境变量..."
if [ ! -f ".env" ]; then
    if [ -f ".env.baota" ]; then
        log_info "复制环境变量模板..."
        cp .env.baota .env
        log_warning "请编辑 .env 文件，设置正确的服务器IP"
    else
        log_error "环境变量文件不存在"
        exit 1
    fi
fi

# 11. 初始化数据库
log_info "初始化数据库..."
npx prisma db push --accept-data-loss

# 12. 构建项目
log_info "构建项目..."
NODE_ENV=production npm run build

if [ $? -ne 0 ]; then
    log_error "项目构建失败"
    exit 1
fi

# 13. 启动PM2服务
log_info "启动PM2服务..."
pm2 start ecosystem.config.js --env production

# 14. 保存PM2配置
pm2 save

# 15. 设置开机自启
pm2 startup systemd -u www --hp /home/www

# 16. 验证部署
log_info "验证部署..."
sleep 5

if pm2 list | grep -q "tu-project"; then
    log_success "PM2进程启动成功"
else
    log_error "PM2进程启动失败"
    pm2 logs tu-project
    exit 1
fi

if netstat -tlnp | grep -q ":3000"; then
    log_success "端口3000监听正常"
else
    log_error "端口3000未监听"
    exit 1
fi

echo ""
log_success "部署修复完成！"
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
echo "如果网站仍无法访问，请检查Nginx配置"
