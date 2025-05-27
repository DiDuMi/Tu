#!/bin/bash

# 兔图项目宝塔面板维护脚本
# 用于日常维护、备份、监控等操作

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
LOG_DIR="$PROJECT_DIR/logs"

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

# 显示菜单
show_menu() {
    clear
    echo "=========================================="
    echo "🛠️  兔图项目宝塔面板维护工具"
    echo "=========================================="
    echo ""
    echo "1. 📊 查看项目状态"
    echo "2. 🔄 重启应用服务"
    echo "3. 📋 查看应用日志"
    echo "4. 💾 备份数据库"
    echo "5. 📁 备份媒体文件"
    echo "6. 🧹 清理日志文件"
    echo "7. 📈 系统资源监控"
    echo "8. 🔧 更新项目代码"
    echo "9. ⚙️  重新构建项目"
    echo "10. 🔍 诊断问题"
    echo "11. 📖 查看帮助信息"
    echo "0. 🚪 退出"
    echo ""
    echo "=========================================="
}

# 查看项目状态
check_status() {
    log_info "检查项目运行状态..."
    echo ""
    
    # PM2进程状态
    echo "📋 PM2进程状态:"
    pm2 list | grep $PROJECT_NAME || echo "未找到PM2进程"
    echo ""
    
    # 端口监听状态
    echo "🔌 端口监听状态:"
    netstat -tlnp | grep ":3000" || echo "端口3000未监听"
    echo ""
    
    # Nginx状态
    echo "🌐 Nginx服务状态:"
    systemctl status nginx --no-pager -l
    echo ""
    
    # 磁盘使用情况
    echo "💾 磁盘使用情况:"
    df -h $PROJECT_DIR
    echo ""
    
    # 内存使用情况
    echo "🧠 内存使用情况:"
    free -h
    echo ""
}

# 重启应用服务
restart_service() {
    log_info "重启应用服务..."
    
    # 重启PM2进程
    pm2 restart $PROJECT_NAME
    
    # 等待启动
    sleep 3
    
    # 检查状态
    if pm2 list | grep -q $PROJECT_NAME; then
        log_success "应用重启成功"
    else
        log_error "应用重启失败"
        return 1
    fi
    
    # 重启Nginx
    systemctl reload nginx
    log_success "Nginx重新加载完成"
}

# 查看应用日志
view_logs() {
    echo "选择要查看的日志类型:"
    echo "1. PM2应用日志"
    echo "2. PM2错误日志"
    echo "3. Nginx访问日志"
    echo "4. Nginx错误日志"
    echo "5. 系统日志"
    echo ""
    read -p "请选择 (1-5): " log_choice
    
    case $log_choice in
        1)
            log_info "查看PM2应用日志 (按Ctrl+C退出):"
            pm2 logs $PROJECT_NAME --lines 50
            ;;
        2)
            log_info "查看PM2错误日志:"
            pm2 logs $PROJECT_NAME --err --lines 50
            ;;
        3)
            log_info "查看Nginx访问日志:"
            tail -f $LOG_DIR/access.log 2>/dev/null || tail -f /var/log/nginx/access.log
            ;;
        4)
            log_info "查看Nginx错误日志:"
            tail -f $LOG_DIR/error.log 2>/dev/null || tail -f /var/log/nginx/error.log
            ;;
        5)
            log_info "查看系统日志:"
            journalctl -u nginx -f
            ;;
        *)
            log_error "无效选择"
            ;;
    esac
}

# 备份数据库
backup_database() {
    log_info "开始备份数据库..."
    
    # 创建备份目录
    mkdir -p $BACKUP_DIR/database
    
    # 备份文件名
    BACKUP_FILE="$BACKUP_DIR/database/tu-db-$(date +%Y%m%d-%H%M%S).db"
    
    # 执行备份
    if [ -f "$PROJECT_DIR/prisma/production.db" ]; then
        cp "$PROJECT_DIR/prisma/production.db" "$BACKUP_FILE"
        
        # 压缩备份文件
        gzip "$BACKUP_FILE"
        
        log_success "数据库备份完成: ${BACKUP_FILE}.gz"
        
        # 显示备份文件大小
        ls -lh "${BACKUP_FILE}.gz"
    else
        log_error "数据库文件不存在: $PROJECT_DIR/prisma/production.db"
    fi
    
    # 清理旧备份 (保留30天)
    find $BACKUP_DIR/database -name "*.gz" -mtime +30 -delete
    log_info "已清理30天前的旧备份"
}

# 备份媒体文件
backup_media() {
    log_info "开始备份媒体文件..."
    
    # 创建备份目录
    mkdir -p $BACKUP_DIR/media
    
    # 备份文件名
    BACKUP_FILE="$BACKUP_DIR/media/tu-media-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    # 执行备份
    if [ -d "$PROJECT_DIR/public/uploads" ]; then
        cd $PROJECT_DIR
        tar -czf "$BACKUP_FILE" public/uploads/
        
        log_success "媒体文件备份完成: $BACKUP_FILE"
        
        # 显示备份文件大小
        ls -lh "$BACKUP_FILE"
    else
        log_error "媒体目录不存在: $PROJECT_DIR/public/uploads"
    fi
    
    # 清理旧备份 (保留7天)
    find $BACKUP_DIR/media -name "*.tar.gz" -mtime +7 -delete
    log_info "已清理7天前的旧备份"
}

# 清理日志文件
clean_logs() {
    log_info "开始清理日志文件..."
    
    # 清理PM2日志
    pm2 flush $PROJECT_NAME
    log_success "PM2日志清理完成"
    
    # 清理应用日志
    if [ -d "$LOG_DIR" ]; then
        find $LOG_DIR -name "*.log" -mtime +7 -delete
        log_success "应用日志清理完成"
    fi
    
    # 清理Nginx日志 (保留最近的日志)
    if [ -f "/var/log/nginx/access.log" ]; then
        > /var/log/nginx/access.log
        log_success "Nginx访问日志清理完成"
    fi
    
    # 清理系统日志
    journalctl --vacuum-time=7d
    log_success "系统日志清理完成"
}

# 系统资源监控
monitor_system() {
    log_info "系统资源监控 (按Ctrl+C退出):"
    echo ""
    
    while true; do
        clear
        echo "=========================================="
        echo "📊 系统资源实时监控 - $(date)"
        echo "=========================================="
        echo ""
        
        # CPU使用率
        echo "🖥️  CPU使用率:"
        top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//'
        echo ""
        
        # 内存使用情况
        echo "🧠 内存使用情况:"
        free -h
        echo ""
        
        # 磁盘使用情况
        echo "💾 磁盘使用情况:"
        df -h | grep -E "/$|/www"
        echo ""
        
        # 网络连接
        echo "🌐 网络连接:"
        netstat -an | grep ":80\|:443\|:3000" | wc -l | awk '{print "活跃连接数: " $1}'
        echo ""
        
        # PM2进程状态
        echo "📋 PM2进程状态:"
        pm2 jlist | jq -r '.[] | select(.name=="'$PROJECT_NAME'") | "进程: \(.name) | 状态: \(.pm2_env.status) | CPU: \(.monit.cpu)% | 内存: \(.monit.memory/1024/1024 | floor)MB"' 2>/dev/null || echo "PM2进程信息获取失败"
        echo ""
        
        echo "=========================================="
        sleep 5
    done
}

# 更新项目代码
update_project() {
    log_info "开始更新项目代码..."
    
    cd $PROJECT_DIR
    
    # 备份当前版本
    log_info "备份当前版本..."
    cp -r $PROJECT_DIR $BACKUP_DIR/project-backup-$(date +%Y%m%d-%H%M%S)
    
    # 拉取最新代码
    log_info "拉取最新代码..."
    git pull origin main
    
    # 安装新依赖
    log_info "安装依赖..."
    npm install
    
    # 数据库迁移
    log_info "更新数据库..."
    npx prisma generate
    npx prisma db push
    
    # 重新构建
    log_info "重新构建项目..."
    npm run build
    
    # 重启服务
    log_info "重启服务..."
    pm2 restart $PROJECT_NAME
    
    log_success "项目更新完成"
}

# 重新构建项目
rebuild_project() {
    log_info "开始重新构建项目..."
    
    cd $PROJECT_DIR
    
    # 清理构建缓存
    rm -rf .next
    rm -rf node_modules/.cache
    
    # 重新安装依赖
    log_info "重新安装依赖..."
    npm ci
    
    # 重新构建
    log_info "重新构建..."
    npm run build
    
    # 重启服务
    log_info "重启服务..."
    pm2 restart $PROJECT_NAME
    
    log_success "项目重新构建完成"
}

# 诊断问题
diagnose_issues() {
    log_info "开始诊断系统问题..."
    echo ""
    
    # 检查PM2进程
    echo "🔍 检查PM2进程:"
    if pm2 list | grep -q $PROJECT_NAME; then
        echo "✅ PM2进程正常运行"
    else
        echo "❌ PM2进程未运行"
        echo "   解决方案: pm2 start ecosystem.config.js"
    fi
    echo ""
    
    # 检查端口监听
    echo "🔍 检查端口监听:"
    if netstat -tlnp | grep -q ":3000"; then
        echo "✅ 端口3000正常监听"
    else
        echo "❌ 端口3000未监听"
        echo "   可能原因: 应用未启动或端口被占用"
    fi
    echo ""
    
    # 检查Nginx配置
    echo "🔍 检查Nginx配置:"
    if nginx -t 2>/dev/null; then
        echo "✅ Nginx配置正确"
    else
        echo "❌ Nginx配置有误"
        echo "   解决方案: nginx -t 查看详细错误"
    fi
    echo ""
    
    # 检查磁盘空间
    echo "🔍 检查磁盘空间:"
    DISK_USAGE=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
    if [ $DISK_USAGE -lt 90 ]; then
        echo "✅ 磁盘空间充足 (${DISK_USAGE}%)"
    else
        echo "❌ 磁盘空间不足 (${DISK_USAGE}%)"
        echo "   解决方案: 清理日志文件或扩容磁盘"
    fi
    echo ""
    
    # 检查内存使用
    echo "🔍 检查内存使用:"
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ $MEMORY_USAGE -lt 90 ]; then
        echo "✅ 内存使用正常 (${MEMORY_USAGE}%)"
    else
        echo "❌ 内存使用过高 (${MEMORY_USAGE}%)"
        echo "   解决方案: 重启服务或增加内存"
    fi
    echo ""
    
    # 检查最近的错误日志
    echo "🔍 检查最近的错误:"
    if [ -f "$LOG_DIR/error.log" ]; then
        echo "最近的错误日志:"
        tail -5 $LOG_DIR/error.log
    else
        echo "✅ 未发现错误日志"
    fi
}

# 显示帮助信息
show_help() {
    echo "=========================================="
    echo "📖 兔图项目维护帮助信息"
    echo "=========================================="
    echo ""
    echo "🔧 常用命令:"
    echo "  pm2 status              - 查看PM2进程状态"
    echo "  pm2 restart tu-project  - 重启应用"
    echo "  pm2 logs tu-project     - 查看应用日志"
    echo "  pm2 monit              - 实时监控"
    echo ""
    echo "🌐 Nginx命令:"
    echo "  systemctl status nginx  - 查看Nginx状态"
    echo "  systemctl reload nginx  - 重新加载配置"
    echo "  nginx -t               - 测试配置文件"
    echo ""
    echo "📁 重要目录:"
    echo "  项目目录: $PROJECT_DIR"
    echo "  备份目录: $BACKUP_DIR"
    echo "  日志目录: $LOG_DIR"
    echo ""
    echo "🆘 紧急情况:"
    echo "  如果网站无法访问:"
    echo "  1. 检查PM2进程: pm2 status"
    echo "  2. 检查Nginx状态: systemctl status nginx"
    echo "  3. 查看错误日志: pm2 logs tu-project"
    echo "  4. 重启服务: pm2 restart tu-project"
    echo ""
    echo "📞 技术支持:"
    echo "  详细文档: BAOTA_DEPLOYMENT_GUIDE.md"
    echo "  部署脚本: deploy-baota.sh"
    echo "  环境检查: baota-check.sh"
    echo ""
}

# 主菜单循环
main() {
    while true; do
        show_menu
        read -p "请选择操作 (0-11): " choice
        
        case $choice in
            1) check_status ;;
            2) restart_service ;;
            3) view_logs ;;
            4) backup_database ;;
            5) backup_media ;;
            6) clean_logs ;;
            7) monitor_system ;;
            8) update_project ;;
            9) rebuild_project ;;
            10) diagnose_issues ;;
            11) show_help ;;
            0) 
                log_info "退出维护工具"
                exit 0
                ;;
            *)
                log_error "无效选择，请重新输入"
                ;;
        esac
        
        echo ""
        read -p "按Enter键继续..."
    done
}

# 检查权限
if [[ $EUID -ne 0 ]]; then
    log_error "此脚本需要root权限运行"
    log_info "请使用: sudo $0"
    exit 1
fi

# 执行主函数
main
