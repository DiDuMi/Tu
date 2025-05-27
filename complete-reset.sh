#!/bin/bash

# 兔图项目完全清理和重新部署脚本
# 适用于宝塔面板环境 - 彻底清理所有端口和实例

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================"
echo "🔧 兔图项目完全清理和重新部署"
echo "========================================"

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

# 检查是否为root用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行"
        log_info "请使用: sudo $0"
        exit 1
    fi
}

# 第一步：完全清理所有相关进程和端口
cleanup_all_processes() {
    log_info "🧹 第一步：清理所有相关进程和端口..."

    # 1. 停止并删除所有PM2进程
    log_info "停止所有PM2进程..."
    pm2 kill 2>/dev/null || true
    pm2 delete all 2>/dev/null || true

    # 2. 清理PM2配置
    log_info "清理PM2配置..."
    rm -rf ~/.pm2 2>/dev/null || true
    rm -rf /home/www/.pm2 2>/dev/null || true

    # 3. 杀死所有Node.js进程
    log_info "杀死所有Node.js进程..."
    pkill -f "node" 2>/dev/null || true
    pkill -f "npm" 2>/dev/null || true
    pkill -f "next" 2>/dev/null || true

    # 4. 释放3000端口（兔图项目专用）
    log_info "释放3000端口（兔图项目）..."
    fuser -k 3000/tcp 2>/dev/null || true

    # 5. 清理其他可能的端口（保护3001端口的Python项目）
    log_warning "保护3001端口的Python项目，不进行清理"
    for port in 3002 3003 8080 8000; do
        log_info "释放端口 $port..."
        fuser -k $port/tcp 2>/dev/null || true
    done

    # 6. 等待进程完全结束
    sleep 3

    log_success "所有进程和端口清理完成"
}

# 第二步：清理项目文件和环境
cleanup_project_files() {
    log_info "🗂️ 第二步：清理项目文件和环境..."

    # 1. 备份现有项目（如果存在）
    if [ -d "/www/wwwroot/tu-project" ]; then
        log_info "备份现有项目..."
        mkdir -p /www/backup
        mv /www/wwwroot/tu-project /www/backup/tu-project-backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
    fi

    # 2. 清理相关目录
    log_info "清理相关目录..."
    rm -rf /www/wwwroot/tu-project 2>/dev/null || true
    rm -rf /tmp/tu-project* 2>/dev/null || true

    # 3. 清理 npm 缓存
    log_info "清理npm缓存..."
    rm -rf ~/.npm 2>/dev/null || true
    rm -rf /home/www/.npm 2>/dev/null || true
    rm -rf ~/.npmrc 2>/dev/null || true

    # 4. 清理 nvm 配置
    log_info "清理nvm配置..."
    unset NVM_DIR 2>/dev/null || true
    unset NVM_CD_FLAGS 2>/dev/null || true
    unset NVM_BIN 2>/dev/null || true
    export NVM_DIR=""

    # 清理环境变量文件中的 nvm 配置
    sed -i '/nvm/d' ~/.bashrc 2>/dev/null || true
    sed -i '/NVM/d' ~/.bashrc 2>/dev/null || true
    sed -i '/\.nvm/d' ~/.bashrc 2>/dev/null || true

    log_success "项目文件和环境清理完成"
}

# 第三步：重新配置Node.js环境
setup_nodejs_environment() {
    log_info "⚙️ 第三步：重新配置Node.js环境..."

    # 查找宝塔的 Node.js 安装
    log_info "查找宝塔 Node.js 安装..."

    NODEJS_PATH=""
    # 优先查找 v20.10.0
    if [ -d "/www/server/nodejs/v20.10.0/bin" ] && [ -f "/www/server/nodejs/v20.10.0/bin/node" ]; then
        NODEJS_PATH="/www/server/nodejs/v20.10.0/bin"
        log_info "找到 Node.js v20.10.0: $NODEJS_PATH"
    else
        # 查找其他版本
        for version in /www/server/nodejs/v*; do
            if [ -d "$version/bin" ] && [ -f "$version/bin/node" ]; then
                NODE_VERSION=$($version/bin/node --version 2>/dev/null || echo "unknown")
                log_info "找到 Node.js: $version ($NODE_VERSION)"

                # 优先选择 v20 或 v18 版本
                if [[ "$version" == *"v20"* ]] || [[ "$version" == *"v18"* ]]; then
                    NODEJS_PATH="$version/bin"
                    break
                elif [ -z "$NODEJS_PATH" ]; then
                    NODEJS_PATH="$version/bin"
                fi
            fi
        done
    fi

    if [ -z "$NODEJS_PATH" ]; then
        log_error "未找到任何 Node.js 安装"
        log_info "请通过宝塔面板安装 Node.js 20.x"
        exit 1
    fi

    log_info "使用 Node.js: $NODEJS_PATH"

    # 配置环境变量
    log_info "配置环境变量..."

    # 清理旧的 PATH 配置
    export PATH=$(echo $PATH | tr ':' '\n' | grep -v nodejs | grep -v nvm | tr '\n' ':' | sed 's/:$//')

    # 添加新的 Node.js 路径
    export PATH="$NODEJS_PATH:$PATH"

    # 创建系统软链接
    log_info "创建系统软链接..."
    ln -sf "$NODEJS_PATH/node" /usr/local/bin/node
    ln -sf "$NODEJS_PATH/npm" /usr/local/bin/npm
    ln -sf "$NODEJS_PATH/npx" /usr/local/bin/npx

    # 验证 Node.js
    log_info "验证 Node.js..."
    if command -v node &> /dev/null; then
        log_success "Node.js: $(node --version)"
    else
        log_error "Node.js 仍然无法使用"
        exit 1
    fi

    if command -v npm &> /dev/null; then
        log_success "npm: $(npm --version)"
    else
        log_error "npm 仍然无法使用"
        exit 1
    fi

    # 重新配置 npm
    log_info "配置 npm..."
    npm config delete prefix 2>/dev/null || true
    npm config set registry https://registry.npmmirror.com
    npm config set cache ~/.npm

    # 全局安装 PM2
    log_info "安装 PM2..."
    npm install -g pm2

    if command -v pm2 &> /dev/null; then
        log_success "PM2: $(pm2 --version)"
        ln -sf "$NODEJS_PATH/pm2" /usr/local/bin/pm2
    else
        log_error "PM2 安装失败"
        exit 1
    fi

    # 永久保存配置
    log_info "保存环境配置..."
    cat > ~/.bashrc << 'EOF'
# Node.js 环境配置
export PATH="/usr/local/bin:$PATH"

# 清理 nvm 相关配置
unset NVM_DIR
unset NVM_CD_FLAGS
unset NVM_BIN
EOF

    log_success "Node.js环境配置完成"
}

# 第四步：重新下载和部署项目
deploy_fresh_project() {
    log_info "🚀 第四步：重新下载和部署项目..."

    # 1. 创建项目目录
    log_info "创建项目目录..."
    mkdir -p /www/wwwroot
    cd /www/wwwroot

    # 2. 下载项目代码
    log_info "下载项目代码..."
    if command -v git &> /dev/null; then
        git clone https://github.com/DiDuMi/Tu.git tu-project
    else
        log_error "未找到Git，请先安装Git"
        exit 1
    fi

    cd tu-project

    # 3. 创建必要目录
    log_info "创建必要目录..."
    mkdir -p logs public/uploads/media backups prisma

    # 4. 设置权限
    log_info "设置文件权限..."
    chown -R www:www .
    chmod -R 755 .
    chmod -R 777 public/uploads

    # 5. 清理项目依赖
    log_info "清理旧的依赖..."
    rm -rf node_modules package-lock.json .next

    # 6. 安装项目依赖
    log_info "安装项目依赖..."
    npm install --production=false

    if [ $? -eq 0 ]; then
        log_success "依赖安装成功"
    else
        log_error "依赖安装失败"
        exit 1
    fi

    # 7. 生成 Prisma 客户端
    log_info "生成 Prisma 客户端..."
    npx prisma generate

    # 8. 配置环境变量
    log_info "配置环境变量..."
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")

    cat > .env << EOF
# 数据库配置 (SQLite)
DATABASE_URL="file:./prisma/production.db"

# 应用配置
NEXTAUTH_URL="http://$SERVER_IP:3000"
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

    # 9. 初始化数据库
    log_info "初始化数据库..."
    npx prisma db push

    # 10. 构建项目
    log_info "构建项目..."
    NODE_ENV=production npm run build

    if [ $? -eq 0 ]; then
        log_success "项目构建成功"
    else
        log_error "项目构建失败"
        exit 1
    fi

    log_success "项目部署完成"
}

# 第五步：启动服务
start_services() {
    log_info "🔄 第五步：启动服务..."

    cd /www/wwwroot/tu-project

    # 1. 启动 PM2
    log_info "启动 PM2..."
    pm2 delete tu-project 2>/dev/null || true
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup

    # 2. 等待服务启动
    log_info "等待服务启动..."
    sleep 10

    # 3. 验证服务状态
    log_info "验证服务状态..."
    if pm2 list | grep -q tu-project; then
        log_success "PM2进程运行正常"
    else
        log_error "PM2进程启动失败"
        return 1
    fi

    # 4. 检查端口监听
    if netstat -tlnp | grep -q ":3000"; then
        log_success "应用端口监听正常"
    else
        log_error "应用端口未监听"
        return 1
    fi

    log_success "服务启动完成"
}

# 第六步：配置Nginx（可选）
configure_nginx() {
    log_info "🌐 第六步：配置Nginx反向代理..."

    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")

    # 创建Nginx配置文件
    cat > /www/server/panel/vhost/nginx/tu-project.conf << EOF
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
        root /www/wwwroot/tu-project/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri @nextjs;
    }

    # 媒体文件
    location /uploads/ {
        alias /www/wwwroot/tu-project/public/uploads/;
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
    access_log /www/wwwroot/tu-project/logs/access.log;
    error_log /www/wwwroot/tu-project/logs/error.log;
}
EOF

    # 重启Nginx
    systemctl reload nginx 2>/dev/null || true

    log_success "Nginx配置完成"
}

# 显示部署结果
show_deployment_result() {
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")

    echo ""
    echo "========================================"
    echo "🎉 兔图项目完全重新部署完成！"
    echo "========================================"
    echo ""
    echo "📍 访问信息:"
    echo "   网站地址: http://$SERVER_IP"
    echo "   管理后台: http://$SERVER_IP/admin"
    echo ""
    echo "📁 项目路径: /www/wwwroot/tu-project"
    echo "📊 进程管理: pm2 status"
    echo "📋 查看日志: pm2 logs tu-project"
    echo ""
    echo "🔧 常用命令:"
    echo "   重启应用: pm2 restart tu-project"
    echo "   查看状态: pm2 monit"
    echo "   重启Nginx: systemctl reload nginx"
    echo ""
    echo "✅ 验证命令："
    echo "   node --version"
    echo "   npm --version"
    echo "   pm2 status"
    echo ""
    echo "如果仍有问题，请重新登录终端或联系技术支持"
    echo "========================================"
}

# 主执行流程
main() {
    log_info "开始兔图项目完全清理和重新部署..."
    echo ""

    check_root
    cleanup_all_processes
    cleanup_project_files
    setup_nodejs_environment
    deploy_fresh_project
    start_services
    configure_nginx
    show_deployment_result

    log_success "完全重新部署完成！"
}

# 执行主函数
main "$@"
