#!/bin/bash

# 兔图项目宝塔面板自动化部署脚本
# 适用于Ubuntu 18.04 + 宝塔面板 + SQLite数据库

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
PROJECT_NAME="tu-project"
PROJECT_DIR="/www/wwwroot/$PROJECT_NAME"
BACKUP_DIR="/www/backup"
LOG_FILE="/tmp/deploy-tu-project.log"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a $LOG_FILE
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOG_FILE
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行"
        log_info "请使用: sudo $0"
        exit 1
    fi
}

# 检查宝塔面板是否安装
check_baota() {
    if [ ! -f "/www/server/panel/BT-Panel" ]; then
        log_error "未检测到宝塔面板，请先安装宝塔面板"
        log_info "安装命令: wget -O install.sh http://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh"
        exit 1
    fi
    log_success "宝塔面板检测通过"
}

# 检查Node.js环境
check_nodejs() {
    log_info "检查Node.js环境..."

    if ! command -v node &> /dev/null; then
        log_error "未找到Node.js，请在宝塔面板安装Node.js 18.x LTS"
        log_info "安装路径: 软件商店 → Node.js版本管理器"
        exit 1
    fi

    NODE_VERSION=$(node --version)
    log_info "当前Node.js版本: $NODE_VERSION"

    # 检查版本是否为18+
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        log_warning "建议使用Node.js 18+版本"
    fi

    log_success "Node.js环境检查通过"
}

# 检查PM2
check_pm2() {
    log_info "检查PM2环境..."

    if ! command -v pm2 &> /dev/null; then
        log_info "安装PM2..."
        npm install -g pm2
    fi

    log_success "PM2环境检查通过"
}

# 创建项目目录
create_project_dir() {
    log_info "创建项目目录..."

    # 备份现有项目
    if [ -d "$PROJECT_DIR" ]; then
        log_warning "发现现有项目，创建备份..."
        mkdir -p $BACKUP_DIR
        mv "$PROJECT_DIR" "$BACKUP_DIR/${PROJECT_NAME}-backup-$(date +%Y%m%d-%H%M%S)"
    fi

    mkdir -p "$PROJECT_DIR"
    log_success "项目目录创建完成: $PROJECT_DIR"
}

# 下载项目代码
download_project() {
    log_info "下载项目代码..."

    cd /www/wwwroot

    if command -v git &> /dev/null; then
        log_info "使用Git克隆项目..."
        git clone https://github.com/DiDuMi/Tu.git $PROJECT_NAME
    else
        log_error "未找到Git，请手动上传项目代码到 $PROJECT_DIR"
        log_info "或安装Git: apt update && apt install git -y"
        exit 1
    fi

    cd $PROJECT_DIR
    log_success "项目代码下载完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."

    cd $PROJECT_DIR

    # 运行依赖更新脚本
    if [ -f "scripts/update-dependencies.sh" ]; then
        chmod +x scripts/update-dependencies.sh
        ./scripts/update-dependencies.sh
    else
        # 备用方案：手动安装
        log_warning "依赖更新脚本不存在，使用备用方案"

        # 使用国内镜像加速
        npm config set registry https://registry.npmmirror.com

        # 清理缓存
        npm cache clean --force
        rm -rf node_modules package-lock.json

        # 安装依赖
        npm install --production=false

        # 生成 Prisma 客户端
        npx prisma generate
    fi

    if [ $? -eq 0 ]; then
        log_success "依赖安装完成"
    else
        log_error "依赖安装失败"
        exit 1
    fi
}

# 配置环境变量
setup_environment() {
    log_info "配置环境变量..."

    cd $PROJECT_DIR

    # 创建生产环境配置
    cat > .env << EOF
# 数据库配置 (SQLite)
DATABASE_URL="file:./prisma/production.db"

# 应用配置
NEXTAUTH_URL="http://$(curl -s ifconfig.me):3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# 媒体存储
MEDIA_STORAGE_PATH="./public/uploads"
MAX_FILE_SIZE=52428800

# 生产环境
NODE_ENV="production"
PORT=3000

# 安全配置
SECURE_COOKIES=false
CSRF_SECRET="$(openssl rand -base64 32)"

# 日志配置
LOG_LEVEL="info"
LOG_FILE_PATH="./logs"
EOF

    log_success "环境变量配置完成"
}

# 初始化数据库
setup_database() {
    log_info "初始化数据库..."

    cd $PROJECT_DIR

    # 生成Prisma客户端
    npx prisma generate

    # 创建数据库表结构
    npx prisma db push

    log_success "数据库初始化完成"
}

# 创建必要目录
create_directories() {
    log_info "创建必要目录..."

    cd $PROJECT_DIR

    mkdir -p public/uploads/media
    mkdir -p logs
    mkdir -p backups

    log_success "目录创建完成"
}

# 设置文件权限
set_permissions() {
    log_info "设置文件权限..."

    # 设置项目目录所有者为www用户
    chown -R www:www $PROJECT_DIR

    # 设置基本权限
    chmod -R 755 $PROJECT_DIR

    # 设置上传目录权限
    chmod -R 777 $PROJECT_DIR/public/uploads

    # 设置日志目录权限
    chmod -R 755 $PROJECT_DIR/logs

    log_success "文件权限设置完成"
}

# 构建项目
build_project() {
    log_info "构建项目..."

    cd $PROJECT_DIR

    npm run build

    if [ $? -eq 0 ]; then
        log_success "项目构建完成"
    else
        log_error "项目构建失败"
        exit 1
    fi
}

# 配置PM2
setup_pm2() {
    log_info "配置PM2进程管理..."

    cd $PROJECT_DIR

    # 停止现有进程
    pm2 delete $PROJECT_NAME 2>/dev/null || true

    # 启动新进程
    pm2 start ecosystem.config.js --env production

    # 保存PM2配置
    pm2 save

    # 设置开机自启
    pm2 startup systemd -u www --hp /home/www

    log_success "PM2配置完成"
}

# 配置Nginx
setup_nginx() {
    log_info "配置Nginx反向代理..."

    # 获取服务器IP
    SERVER_IP=$(curl -s ifconfig.me)

    # 创建Nginx配置文件
    cat > /www/server/panel/vhost/nginx/${PROJECT_NAME}.conf << EOF
server {
    listen 80;
    server_name $SERVER_IP;

    # 安全头设置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 客户端最大请求体大小
    client_max_body_size 50M;

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root $PROJECT_DIR/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri @nextjs;
    }

    # 媒体文件
    location /uploads/ {
        alias $PROJECT_DIR/public/uploads/;
        expires 1M;
        add_header Cache-Control "public";
    }

    # API和应用代理
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 日志设置
    access_log $PROJECT_DIR/logs/access.log;
    error_log $PROJECT_DIR/logs/error.log;
}
EOF

    # 重启Nginx
    systemctl reload nginx

    log_success "Nginx配置完成"
    log_info "访问地址: http://$SERVER_IP"
}

# 验证环境
verify_environment() {
    log_info "验证环境配置..."

    cd $PROJECT_DIR

    # 运行环境检查脚本
    if [ -f "scripts/check-environment.js" ]; then
        node scripts/check-environment.js
        if [ $? -ne 0 ]; then
            log_error "环境检查失败"
            exit 1
        fi
    else
        log_warning "环境检查脚本不存在，跳过检查"
    fi

    log_success "环境验证完成"
}

# 验证部署
verify_deployment() {
    log_info "验证部署状态..."

    # 检查PM2进程
    if pm2 list | grep -q $PROJECT_NAME; then
        log_success "PM2进程运行正常"
    else
        log_error "PM2进程未运行"
        return 1
    fi

    # 检查端口监听
    if netstat -tlnp | grep -q ":3000"; then
        log_success "应用端口监听正常"
    else
        log_error "应用端口未监听"
        return 1
    fi

    # 检查HTTP响应
    sleep 5
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
        log_success "HTTP响应正常"
    else
        log_warning "HTTP响应异常，请检查应用日志"
    fi

    log_success "部署验证完成"
}

# 显示部署信息
show_deployment_info() {
    SERVER_IP=$(curl -s ifconfig.me)

    echo ""
    echo "=========================================="
    echo "🎉 兔图项目部署完成！"
    echo "=========================================="
    echo ""
    echo "📍 访问信息:"
    echo "   网站地址: http://$SERVER_IP"
    echo "   管理后台: http://$SERVER_IP/admin"
    echo ""
    echo "📁 项目路径: $PROJECT_DIR"
    echo "📊 进程管理: pm2 status"
    echo "📋 查看日志: pm2 logs $PROJECT_NAME"
    echo ""
    echo "🔧 常用命令:"
    echo "   重启应用: pm2 restart $PROJECT_NAME"
    echo "   查看状态: pm2 monit"
    echo "   重启Nginx: systemctl reload nginx"
    echo ""
    echo "📖 详细文档: BAOTA_DEPLOYMENT_GUIDE.md"
    echo "=========================================="
}

# 主部署流程
main() {
    log_info "开始兔图项目宝塔面板部署..."
    echo "日志文件: $LOG_FILE"
    echo ""

    check_root
    check_baota
    check_nodejs
    check_pm2
    create_project_dir
    download_project
    install_dependencies
    verify_environment
    setup_environment
    setup_database
    create_directories
    set_permissions
    build_project
    setup_pm2
    setup_nginx
    verify_deployment
    show_deployment_info

    log_success "部署完成！"
}

# 执行主函数
main "$@"
