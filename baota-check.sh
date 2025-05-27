#!/bin/bash

# 兔图项目宝塔面板环境检查脚本
# 用于检查部署前的环境准备情况

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查结果统计
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# 检查函数
check_item() {
    local name="$1"
    local command="$2"
    local required="$3"
    
    echo -n "检查 $name ... "
    
    if eval "$command" &>/dev/null; then
        echo -e "${GREEN}✓ 通过${NC}"
        ((PASS_COUNT++))
        return 0
    else
        if [ "$required" = "required" ]; then
            echo -e "${RED}✗ 失败${NC}"
            ((FAIL_COUNT++))
            return 1
        else
            echo -e "${YELLOW}⚠ 警告${NC}"
            ((WARN_COUNT++))
            return 2
        fi
    fi
}

# 显示标题
echo "=========================================="
echo "🔍 兔图项目宝塔面板环境检查"
echo "=========================================="
echo ""

# 系统基础检查
echo "📋 系统基础环境检查:"
echo "----------------------------------------"

check_item "操作系统版本" "lsb_release -d | grep -i ubuntu" "required"
if [ $? -eq 1 ]; then
    echo "   建议: 使用Ubuntu 18.04或更高版本"
fi

check_item "系统架构" "uname -m | grep -E 'x86_64|amd64'" "required"

check_item "内存容量" "[ $(free -m | awk 'NR==2{print $2}') -ge 1024 ]" "required"
if [ $? -eq 1 ]; then
    echo "   建议: 至少2GB内存，推荐4GB+"
fi

check_item "磁盘空间" "[ $(df / | awk 'NR==2{print $4}') -ge 10485760 ]" "required"
if [ $? -eq 1 ]; then
    echo "   建议: 至少20GB可用磁盘空间"
fi

echo ""

# 宝塔面板检查
echo "🎛️ 宝塔面板环境检查:"
echo "----------------------------------------"

check_item "宝塔面板安装" "[ -f '/www/server/panel/BT-Panel' ]" "required"
if [ $? -eq 1 ]; then
    echo "   安装命令: wget -O install.sh http://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh"
fi

check_item "宝塔面板运行" "systemctl is-active bt" "required"
if [ $? -eq 1 ]; then
    echo "   启动命令: systemctl start bt"
fi

check_item "Nginx安装" "[ -f '/www/server/nginx/sbin/nginx' ]" "required"
if [ $? -eq 1 ]; then
    echo "   安装方法: 宝塔面板 → 软件商店 → Nginx"
fi

check_item "Nginx运行" "systemctl is-active nginx" "required"
if [ $? -eq 1 ]; then
    echo "   启动命令: systemctl start nginx"
fi

echo ""

# Node.js环境检查
echo "🟢 Node.js环境检查:"
echo "----------------------------------------"

check_item "Node.js安装" "command -v node" "required"
if [ $? -eq 1 ]; then
    echo "   安装方法: 宝塔面板 → 软件商店 → Node.js版本管理器"
fi

if command -v node &>/dev/null; then
    NODE_VERSION=$(node --version | sed 's/v//')
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    check_item "Node.js版本(18+)" "[ $MAJOR_VERSION -ge 18 ]" "required"
    if [ $? -eq 1 ]; then
        echo "   当前版本: v$NODE_VERSION"
        echo "   建议版本: v18.x LTS或更高"
    fi
fi

check_item "npm安装" "command -v npm" "required"

check_item "PM2安装" "command -v pm2" "optional"
if [ $? -ne 0 ]; then
    echo "   安装命令: npm install -g pm2"
fi

echo ""

# Git环境检查
echo "📦 Git环境检查:"
echo "----------------------------------------"

check_item "Git安装" "command -v git" "required"
if [ $? -eq 1 ]; then
    echo "   安装命令: apt update && apt install git -y"
fi

check_item "Git配置" "git config --global user.name && git config --global user.email" "optional"
if [ $? -ne 0 ]; then
    echo "   配置命令: git config --global user.name 'Your Name'"
    echo "            git config --global user.email 'your.email@example.com'"
fi

echo ""

# 网络环境检查
echo "🌐 网络环境检查:"
echo "----------------------------------------"

check_item "外网连接" "ping -c 1 8.8.8.8" "required"
check_item "DNS解析" "nslookup github.com" "required"
check_item "GitHub连接" "curl -s --connect-timeout 5 https://github.com" "required"

if [ $? -eq 1 ]; then
    echo "   可能需要配置代理或使用国内镜像"
fi

echo ""

# 端口检查
echo "🔌 端口检查:"
echo "----------------------------------------"

check_item "端口80可用" "! netstat -tlnp | grep ':80 '" "required"
if [ $? -eq 1 ]; then
    echo "   端口80被占用，请检查其他Web服务"
fi

check_item "端口3000可用" "! netstat -tlnp | grep ':3000 '" "required"
if [ $? -eq 1 ]; then
    echo "   端口3000被占用，请停止相关服务"
fi

check_item "端口443可用" "! netstat -tlnp | grep ':443 '" "optional"

echo ""

# 权限检查
echo "🔐 权限检查:"
echo "----------------------------------------"

check_item "root权限" "[ $EUID -eq 0 ]" "required"
if [ $? -eq 1 ]; then
    echo "   请使用sudo运行此脚本"
fi

check_item "www用户存在" "id www" "required"
if [ $? -eq 1 ]; then
    echo "   创建命令: useradd -r -s /bin/false www"
fi

check_item "网站目录权限" "[ -w '/www/wwwroot' ]" "required"
if [ $? -eq 1 ]; then
    echo "   修复命令: chmod 755 /www/wwwroot"
fi

echo ""

# 系统资源检查
echo "📊 系统资源检查:"
echo "----------------------------------------"

# CPU核心数
CPU_CORES=$(nproc)
echo "CPU核心数: $CPU_CORES"

# 内存使用情况
MEMORY_TOTAL=$(free -m | awk 'NR==2{print $2}')
MEMORY_USED=$(free -m | awk 'NR==2{print $3}')
MEMORY_USAGE=$((MEMORY_USED * 100 / MEMORY_TOTAL))
echo "内存使用: ${MEMORY_USED}MB / ${MEMORY_TOTAL}MB (${MEMORY_USAGE}%)"

# 磁盘使用情况
DISK_USAGE=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
echo "磁盘使用: ${DISK_USAGE}%"

# 负载平均值
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}')
echo "系统负载:$LOAD_AVG"

echo ""

# 显示检查结果
echo "=========================================="
echo "📋 检查结果统计:"
echo "=========================================="
echo -e "✅ 通过: ${GREEN}$PASS_COUNT${NC} 项"
echo -e "❌ 失败: ${RED}$FAIL_COUNT${NC} 项"
echo -e "⚠️  警告: ${YELLOW}$WARN_COUNT${NC} 项"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 环境检查通过！可以开始部署兔图项目${NC}"
    echo ""
    echo "下一步操作:"
    echo "1. 运行部署脚本: chmod +x deploy-baota.sh && sudo ./deploy-baota.sh"
    echo "2. 或参考详细教程: BAOTA_DEPLOYMENT_GUIDE.md"
else
    echo -e "${RED}❌ 环境检查未通过，请先解决上述问题${NC}"
    echo ""
    echo "建议操作:"
    echo "1. 根据上述提示解决环境问题"
    echo "2. 重新运行检查脚本确认"
    echo "3. 参考详细教程: BAOTA_DEPLOYMENT_GUIDE.md"
fi

echo ""
echo "=========================================="
