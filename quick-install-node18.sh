#!/bin/bash

# 快速安装 Node.js 18.x 脚本
# 使用 NodeSource 官方仓库

echo "========================================"
echo "🚀 快速安装 Node.js 18.x LTS"
echo "========================================"

# 1. 更新系统包
echo "1. 更新系统包..."
apt update

# 2. 安装必要工具
echo "2. 安装必要工具..."
apt install -y curl software-properties-common

# 3. 添加 NodeSource 仓库
echo "3. 添加 NodeSource 仓库..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

# 4. 安装 Node.js 18.x
echo "4. 安装 Node.js 18.x..."
apt install -y nodejs

# 5. 验证安装
echo "5. 验证安装..."
node --version
npm --version

# 6. 配置 npm
echo "6. 配置 npm..."
npm config set registry https://registry.npmmirror.com

# 7. 安装 PM2
echo "7. 安装 PM2..."
npm install -g pm2

# 8. 创建软链接（确保宝塔面板能找到）
echo "8. 创建软链接..."
ln -sf $(which node) /www/server/nodejs/node
ln -sf $(which npm) /www/server/nodejs/npm
ln -sf $(which pm2) /www/server/nodejs/pm2

echo ""
echo "✅ Node.js 18.x 安装完成！"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "PM2: $(pm2 --version)"
