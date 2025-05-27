#!/bin/bash

# 快速清理所有端口和进程脚本
# 用于快速清理服务器环境

echo "========================================"
echo "🧹 快速清理所有端口和进程"
echo "========================================"

# 检查是否为root用户
if [[ $EUID -ne 0 ]]; then
    echo "❌ 此脚本需要root权限运行"
    echo "请使用: sudo $0"
    exit 1
fi

echo "🔄 开始清理..."

# 1. 停止并删除所有PM2进程
echo "1. 清理PM2进程..."
pm2 kill 2>/dev/null || true
pm2 delete all 2>/dev/null || true
rm -rf ~/.pm2 2>/dev/null || true
rm -rf /home/www/.pm2 2>/dev/null || true

# 2. 杀死所有Node.js相关进程
echo "2. 杀死Node.js进程..."
pkill -f "node" 2>/dev/null || true
pkill -f "npm" 2>/dev/null || true
pkill -f "next" 2>/dev/null || true
pkill -f "tu-project" 2>/dev/null || true

# 3. 释放常用端口（保护3001端口的Python项目）
echo "3. 释放端口..."
echo "   ⚠️  保护3001端口的Python项目，跳过清理"
for port in 3000 3002 3003 8000 8080 8888; do
    echo "   释放端口 $port..."
    fuser -k $port/tcp 2>/dev/null || true
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
done

# 4. 清理项目文件（可选）
read -p "是否删除现有项目文件? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "4. 清理项目文件..."
    if [ -d "/www/wwwroot/tu-project" ]; then
        echo "   备份现有项目..."
        mkdir -p /www/backup
        mv /www/wwwroot/tu-project /www/backup/tu-project-backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
    fi
    rm -rf /www/wwwroot/tu-project 2>/dev/null || true
    echo "   ✅ 项目文件已清理"
else
    echo "4. 跳过项目文件清理"
fi

# 5. 清理npm缓存
echo "5. 清理npm缓存..."
rm -rf ~/.npm 2>/dev/null || true
rm -rf /home/www/.npm 2>/dev/null || true
npm cache clean --force 2>/dev/null || true

# 6. 等待进程完全结束
echo "6. 等待进程结束..."
sleep 3

# 7. 验证清理结果
echo "7. 验证清理结果..."
echo ""
echo "📊 当前端口占用情况:"
echo "   检查兔图项目相关端口（保护3001端口）:"
netstat -tlnp | grep -E ":(3000|3002|3003|8000|8080)" || echo "   ✅ 兔图项目相关端口已释放"
echo "   3001端口状态（Python项目）:"
netstat -tlnp | grep ":3001" && echo "   ✅ Python项目端口正常运行" || echo "   ⚠️  3001端口未被使用"

echo ""
echo "📋 当前Node.js进程:"
ps aux | grep -E "(node|npm|next)" | grep -v grep || echo "   ✅ 没有Node.js进程运行"

echo ""
echo "📊 PM2状态:"
pm2 status 2>/dev/null || echo "   ✅ PM2已清理"

echo ""
echo "========================================"
echo "🎉 清理完成！"
echo "========================================"
echo ""
echo "现在可以重新部署项目了"
echo "运行部署命令: sudo ./complete-reset.sh"
echo ""
