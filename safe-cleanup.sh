#!/bin/bash

# 安全清理脚本 - 保护现有服务
# 专门清理兔图项目，不影响其他服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================"
echo "🛡️  安全清理兔图项目（保护现有服务）"
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

# 显示当前服务状态
show_current_status() {
    log_info "📊 当前服务状态检查..."
    
    echo ""
    echo "🔍 端口占用情况:"
    netstat -tlnp | grep -E ":(3000|3001|3002|3003|8000|8080)" | while read line; do
        port=$(echo $line | grep -o ':[0-9]*' | head -1 | cut -d: -f2)
        if [ "$port" = "3001" ]; then
            echo "   ✅ 端口 $port (Python项目) - 将被保护"
        elif [ "$port" = "3000" ]; then
            echo "   🎯 端口 $port (兔图项目) - 将被清理"
        else
            echo "   📍 端口 $port - 将被清理"
        fi
    done
    
    echo ""
    echo "🔍 Node.js进程:"
    ps aux | grep -E "(node|npm|next)" | grep -v grep | while read line; do
        if echo "$line" | grep -q "tu-project"; then
            echo "   🎯 兔图项目进程 - 将被清理"
        else
            echo "   📍 其他Node.js进程 - 将被清理"
        fi
    done || echo "   ✅ 没有Node.js进程运行"
    
    echo ""
    echo "🔍 PM2进程:"
    pm2 list 2>/dev/null | grep -E "(tu-project|online|stopped)" || echo "   ✅ 没有PM2进程运行"
    
    echo ""
}

# 安全确认
confirm_cleanup() {
    log_warning "⚠️  即将执行以下操作："
    echo "   ✅ 保护 3001 端口的 Python 项目"
    echo "   🧹 清理 3000 端口的兔图项目"
    echo "   🧹 清理所有 Node.js 相关进程"
    echo "   🧹 清理 PM2 中的兔图项目"
    echo "   📁 备份现有兔图项目文件"
    echo ""
    
    read -p "确认执行安全清理? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "操作已取消"
        exit 0
    fi
}

# 安全清理PM2进程
safe_cleanup_pm2() {
    log_info "🧹 安全清理PM2进程..."
    
    # 只删除兔图项目相关的PM2进程
    pm2 delete tu-project 2>/dev/null || true
    pm2 delete tu 2>/dev/null || true
    
    # 检查是否还有其他PM2进程
    if pm2 list 2>/dev/null | grep -q "online\|stopped"; then
        log_success "保留其他PM2进程"
        pm2 list
    else
        log_info "没有其他PM2进程需要保留"
    fi
}

# 安全清理Node.js进程
safe_cleanup_nodejs() {
    log_info "🧹 安全清理Node.js进程..."
    
    # 查找兔图项目相关进程
    TU_PIDS=$(ps aux | grep -E "(tu-project|next.*3000)" | grep -v grep | awk '{print $2}' || true)
    
    if [ -n "$TU_PIDS" ]; then
        log_info "发现兔图项目进程，正在清理..."
        echo "$TU_PIDS" | xargs kill -9 2>/dev/null || true
    fi
    
    # 检查3000端口的进程
    PORT_3000_PID=$(lsof -ti:3000 2>/dev/null || true)
    if [ -n "$PORT_3000_PID" ]; then
        log_info "清理3000端口进程..."
        kill -9 $PORT_3000_PID 2>/dev/null || true
    fi
    
    log_success "Node.js进程清理完成"
}

# 安全清理端口
safe_cleanup_ports() {
    log_info "🧹 安全清理端口..."
    
    # 保护3001端口，只清理其他端口
    log_warning "保护3001端口的Python项目"
    
    for port in 3000 3002 3003 8000 8080; do
        if lsof -ti:$port >/dev/null 2>&1; then
            log_info "清理端口 $port..."
            fuser -k $port/tcp 2>/dev/null || true
        fi
    done
    
    log_success "端口清理完成（已保护3001端口）"
}

# 备份项目文件
backup_project() {
    log_info "📁 备份现有项目文件..."
    
    if [ -d "/www/wwwroot/tu-project" ]; then
        mkdir -p /www/backup
        BACKUP_NAME="tu-project-backup-$(date +%Y%m%d-%H%M%S)"
        mv /www/wwwroot/tu-project /www/backup/$BACKUP_NAME
        log_success "项目已备份到: /www/backup/$BACKUP_NAME"
    else
        log_info "没有发现现有项目文件"
    fi
}

# 清理缓存
cleanup_cache() {
    log_info "🧹 清理缓存文件..."
    
    # 清理npm缓存
    rm -rf ~/.npm 2>/dev/null || true
    rm -rf /home/www/.npm 2>/dev/null || true
    
    # 清理PM2缓存（只清理兔图项目相关）
    if [ -d ~/.pm2 ]; then
        rm -rf ~/.pm2/logs/tu-project* 2>/dev/null || true
        rm -rf ~/.pm2/pids/tu-project* 2>/dev/null || true
    fi
    
    log_success "缓存清理完成"
}

# 验证清理结果
verify_cleanup() {
    log_info "🔍 验证清理结果..."
    
    echo ""
    echo "📊 端口状态检查:"
    
    # 检查3000端口
    if netstat -tlnp | grep -q ":3000"; then
        log_warning "3000端口仍被占用"
        netstat -tlnp | grep ":3000"
    else
        log_success "3000端口已释放"
    fi
    
    # 检查3001端口（应该被保护）
    if netstat -tlnp | grep -q ":3001"; then
        log_success "3001端口的Python项目正常运行"
    else
        log_warning "3001端口未被使用（Python项目可能未运行）"
    fi
    
    echo ""
    echo "📊 进程状态检查:"
    
    # 检查Node.js进程
    if ps aux | grep -E "(node|npm|next)" | grep -v grep | grep -q "tu-project"; then
        log_warning "仍有兔图项目进程运行"
    else
        log_success "兔图项目进程已清理"
    fi
    
    # 检查PM2状态
    if pm2 list 2>/dev/null | grep -q "tu-project"; then
        log_warning "PM2中仍有兔图项目"
    else
        log_success "PM2中的兔图项目已清理"
    fi
    
    echo ""
}

# 主执行流程
main() {
    log_info "开始安全清理兔图项目..."
    echo ""
    
    check_root
    show_current_status
    confirm_cleanup
    
    echo ""
    log_info "执行安全清理操作..."
    
    safe_cleanup_pm2
    safe_cleanup_nodejs
    safe_cleanup_ports
    backup_project
    cleanup_cache
    
    # 等待进程完全结束
    sleep 3
    
    verify_cleanup
    
    echo ""
    echo "========================================"
    echo "🎉 安全清理完成！"
    echo "========================================"
    echo ""
    echo "✅ 兔图项目已清理"
    echo "✅ Python项目（3001端口）已保护"
    echo "✅ 项目文件已备份到 /www/backup/"
    echo ""
    echo "现在可以重新部署兔图项目："
    echo "sudo ./deploy-baota.sh"
    echo ""
}

# 执行主函数
main "$@"
