#!/bin/bash

# 兔图项目依赖更新脚本
# 用于服务器部署时更新和验证依赖环境

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
echo "🔧 兔图项目依赖环境更新"
echo "========================================"
echo ""

# 检查 Node.js 版本
check_node_version() {
    log_info "检查 Node.js 版本..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | sed 's/v//')
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
    MINOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f2)
    
    if [ "$MAJOR_VERSION" -lt 18 ] || ([ "$MAJOR_VERSION" -eq 18 ] && [ "$MINOR_VERSION" -lt 17 ]); then
        log_error "Node.js 版本过低: v$NODE_VERSION"
        log_error "要求版本: v18.17.0 或更高"
        exit 1
    fi
    
    log_success "Node.js 版本检查通过: v$NODE_VERSION"
}

# 检查 npm 版本
check_npm_version() {
    log_info "检查 npm 版本..."
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    MAJOR_VERSION=$(echo $NPM_VERSION | cut -d'.' -f1)
    
    if [ "$MAJOR_VERSION" -lt 9 ]; then
        log_warning "npm 版本较低: v$NPM_VERSION"
        log_info "建议升级到 v9.0.0 或更高"
        log_info "升级命令: npm install -g npm@latest"
    else
        log_success "npm 版本检查通过: v$NPM_VERSION"
    fi
}

# 清理缓存
clean_cache() {
    log_info "清理缓存..."
    
    # 清理 npm 缓存
    npm cache clean --force
    
    # 删除 node_modules
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        log_success "已删除 node_modules"
    fi
    
    # 删除 package-lock.json
    if [ -f "package-lock.json" ]; then
        rm -f package-lock.json
        log_success "已删除 package-lock.json"
    fi
    
    # 清理 .next 构建缓存
    if [ -d ".next" ]; then
        rm -rf .next
        log_success "已删除 .next 构建缓存"
    fi
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 设置国内镜像
    npm config set registry https://registry.npmmirror.com
    
    # 安装依赖
    npm install --production=false
    
    if [ $? -eq 0 ]; then
        log_success "依赖安装完成"
    else
        log_error "依赖安装失败"
        exit 1
    fi
}

# 生成 Prisma 客户端
generate_prisma() {
    log_info "生成 Prisma 客户端..."
    
    npx prisma generate
    
    if [ $? -eq 0 ]; then
        log_success "Prisma 客户端生成完成"
    else
        log_error "Prisma 客户端生成失败"
        exit 1
    fi
}

# 验证依赖
verify_dependencies() {
    log_info "验证关键依赖..."
    
    # 检查关键包
    CRITICAL_PACKAGES=(
        "next"
        "react"
        "react-dom"
        "@prisma/client"
        "next-auth"
        "typescript"
    )
    
    for package in "${CRITICAL_PACKAGES[@]}"; do
        if npm list "$package" &> /dev/null; then
            VERSION=$(npm list "$package" --depth=0 | grep "$package" | awk '{print $2}' | sed 's/@//')
            log_success "$package@$VERSION"
        else
            log_error "关键依赖缺失: $package"
            exit 1
        fi
    done
}

# 检查安全漏洞
check_security() {
    log_info "检查安全漏洞..."
    
    npm audit --audit-level=high
    
    if [ $? -eq 0 ]; then
        log_success "安全检查通过"
    else
        log_warning "发现安全漏洞，建议运行: npm audit fix"
    fi
}

# 主函数
main() {
    check_node_version
    check_npm_version
    clean_cache
    install_dependencies
    generate_prisma
    verify_dependencies
    check_security
    
    echo ""
    log_success "依赖环境更新完成！"
    echo ""
    echo "下一步操作："
    echo "1. 配置环境变量: cp .env.baota .env"
    echo "2. 初始化数据库: npx prisma db push"
    echo "3. 构建项目: npm run build"
    echo "4. 启动服务: pm2 start ecosystem.config.js"
}

# 执行主函数
main "$@"
