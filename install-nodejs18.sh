#!/bin/bash

# 手动安装 Node.js 18.19.0 LTS
# 适用于宝塔面板环境

set -e

echo "========================================"
echo "📦 手动安装 Node.js 18.19.0 LTS"
echo "========================================"

# 检查系统架构
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
    NODE_ARCH="x64"
elif [ "$ARCH" = "aarch64" ]; then
    NODE_ARCH="arm64"
else
    echo "❌ 不支持的系统架构: $ARCH"
    exit 1
fi

echo "系统架构: $ARCH -> Node.js架构: $NODE_ARCH"

# 定义版本和下载URL
NODE_VERSION="18.19.0"
NODE_FILENAME="node-v${NODE_VERSION}-linux-${NODE_ARCH}"
NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_FILENAME}.tar.xz"
INSTALL_DIR="/www/server/nodejs/v${NODE_VERSION}"

echo "下载版本: Node.js v${NODE_VERSION}"
echo "安装目录: ${INSTALL_DIR}"

# 1. 停止现有的Node.js服务
echo ""
echo "1. 停止现有服务..."
pm2 kill 2>/dev/null || true

# 2. 创建临时目录
echo "2. 准备下载..."
TMP_DIR="/tmp/nodejs-install"
mkdir -p $TMP_DIR
cd $TMP_DIR

# 3. 下载 Node.js
echo "3. 下载 Node.js v${NODE_VERSION}..."
if command -v wget &> /dev/null; then
    wget -O "${NODE_FILENAME}.tar.xz" "$NODE_URL"
elif command -v curl &> /dev/null; then
    curl -L -o "${NODE_FILENAME}.tar.xz" "$NODE_URL"
else
    echo "❌ 未找到 wget 或 curl，无法下载"
    exit 1
fi

# 4. 验证下载
if [ ! -f "${NODE_FILENAME}.tar.xz" ]; then
    echo "❌ 下载失败"
    exit 1
fi

echo "✅ 下载完成"

# 5. 解压
echo "4. 解压文件..."
tar -xf "${NODE_FILENAME}.tar.xz"

if [ ! -d "$NODE_FILENAME" ]; then
    echo "❌ 解压失败"
    exit 1
fi

echo "✅ 解压完成"

# 6. 创建安装目录
echo "5. 创建安装目录..."
mkdir -p "$INSTALL_DIR"

# 7. 复制文件
echo "6. 安装 Node.js..."
cp -r "${NODE_FILENAME}"/* "$INSTALL_DIR/"

# 8. 设置权限
chown -R root:root "$INSTALL_DIR"
chmod -R 755 "$INSTALL_DIR"

# 9. 创建软链接
echo "7. 创建系统链接..."
ln -sf "${INSTALL_DIR}/bin/node" /usr/local/bin/node
ln -sf "${INSTALL_DIR}/bin/npm" /usr/local/bin/npm
ln -sf "${INSTALL_DIR}/bin/npx" /usr/local/bin/npx

# 10. 更新宝塔面板配置
echo "8. 更新宝塔配置..."
BAOTA_NODE_CONFIG="/www/server/panel/config/config.json"
if [ -f "$BAOTA_NODE_CONFIG" ]; then
    # 备份原配置
    cp "$BAOTA_NODE_CONFIG" "${BAOTA_NODE_CONFIG}.backup"
    echo "✅ 宝塔配置已备份"
fi

# 11. 设置环境变量
echo "9. 配置环境变量..."
cat > /etc/profile.d/nodejs.sh << EOF
# Node.js 18.19.0 环境变量
export PATH="${INSTALL_DIR}/bin:\$PATH"
export NODE_PATH="${INSTALL_DIR}/lib/node_modules"
EOF

# 加载环境变量
source /etc/profile.d/nodejs.sh

# 12. 验证安装
echo "10. 验证安装..."
if command -v node &> /dev/null; then
    NODE_VER=$(node --version)
    echo "✅ Node.js: $NODE_VER"
else
    echo "❌ Node.js 安装失败"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VER=$(npm --version)
    echo "✅ npm: $NPM_VER"
else
    echo "❌ npm 安装失败"
    exit 1
fi

# 13. 配置 npm
echo "11. 配置 npm..."
npm config delete prefix 2>/dev/null || true
npm config set registry https://registry.npmmirror.com
npm config set cache ~/.npm

# 14. 全局安装 PM2
echo "12. 安装 PM2..."
npm install -g pm2

if command -v pm2 &> /dev/null; then
    PM2_VER=$(pm2 --version)
    echo "✅ PM2: $PM2_VER"
    ln -sf "${INSTALL_DIR}/bin/pm2" /usr/local/bin/pm2
else
    echo "❌ PM2 安装失败"
fi

# 15. 清理临时文件
echo "13. 清理临时文件..."
cd /
rm -rf "$TMP_DIR"

# 16. 重启相关服务
echo "14. 重启服务..."
systemctl restart bt 2>/dev/null || /etc/init.d/bt restart

echo ""
echo "========================================"
echo "🎉 Node.js 18.19.0 安装完成！"
echo "========================================"
echo ""
echo "版本信息："
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "PM2: $(pm2 --version 2>/dev/null || echo '未安装')"
echo ""
echo "安装路径: ${INSTALL_DIR}"
echo ""
echo "⚠️  重要提醒："
echo "1. 请重新登录终端以加载新的环境变量"
echo "2. 或者执行: source /etc/profile"
echo "3. 然后可以继续部署项目"
echo ""
echo "下一步："
echo "cd /www/wwwroot/tu-project"
echo "./fix-deployment.sh"
