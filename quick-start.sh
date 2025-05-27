#!/bin/bash

# 兔图项目快速启动脚本
# Node.js v20.10.0 环境

echo "========================================"
echo "⚡ 兔图项目快速启动"
echo "========================================"

# 设置环境变量
export PATH="/www/server/nodejs/v20.10.0/bin:$PATH"

# 进入项目目录
cd /www/wwwroot/tu-project

# 检查环境
echo "🔍 检查环境..."
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"

# 启动服务
echo ""
echo "🚀 启动服务..."
pm2 start ecosystem.config.js --env production
pm2 save

echo ""
echo "✅ 启动完成！"
echo "📍 访问地址: http://103.194.106.150"
