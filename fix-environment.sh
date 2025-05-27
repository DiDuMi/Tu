#!/bin/bash

# 完全修复 Node.js 环境脚本
# 解决 npm 和 pm2 命令找不到的问题

set -e

echo "========================================"
echo "🔧 完全修复 Node.js 环境"
echo "========================================"

# 1. 查找宝塔安装的 Node.js
echo "1. 查找 Node.js 安装..."

NODEJS_PATHS=(
    "/www/server/nodejs/v16.20.2"
    "/www/server/nodejs/v18.19.0"
    "/www/server/nodejs/v18.18.0"
    "/www/server/nodejs/v18.17.0"
    "/usr/local/nodejs"
    "/usr/bin"
)

NODEJS_PATH=""
for path in "${NODEJS_PATHS[@]}"; do
    if [ -f "$path/bin/node" ]; then
        NODEJS_PATH="$path/bin"
        NODE_VERSION=$($path/bin/node --version 2>/dev/null || echo "unknown")
        echo "找到 Node.js: $path ($NODE_VERSION)"
        break
    fi
done

if [ -z "$NODEJS_PATH" ]; then
    echo "❌ 未找到任何 Node.js 安装"
    echo "请通过宝塔面板安装 Node.js"
    exit 1
fi

echo "✅ 使用 Node.js: $NODEJS_PATH"

# 2. 设置环境变量
echo ""
echo "2. 设置环境变量..."
export PATH="$NODEJS_PATH:$PATH"
export NODE_PATH="$(dirname $NODEJS_PATH)/lib/node_modules"

# 3. 创建系统软链接
echo ""
echo "3. 创建系统软链接..."
ln -sf "$NODEJS_PATH/node" /usr/local/bin/node
ln -sf "$NODEJS_PATH/npm" /usr/local/bin/npm
ln -sf "$NODEJS_PATH/npx" /usr/local/bin/npx

# 4. 验证 Node.js 和 npm
echo ""
echo "4. 验证 Node.js 和 npm..."
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js 仍然无法使用"
    exit 1
fi

if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm 仍然无法使用"
    exit 1
fi

# 5. 修复 npm 配置
echo ""
echo "5. 修复 npm 配置..."
npm config delete prefix 2>/dev/null || true
npm config set registry https://registry.npmmirror.com
npm config set engine-strict false
npm config set legacy-peer-deps true
npm config set unsafe-perm true

# 6. 全局安装 PM2
echo ""
echo "6. 安装 PM2..."
npm install -g pm2

if command -v pm2 &> /dev/null; then
    echo "✅ PM2: $(pm2 --version)"
    ln -sf "$NODEJS_PATH/pm2" /usr/local/bin/pm2
else
    echo "❌ PM2 安装失败"
    exit 1
fi

# 7. 永久保存环境变量
echo ""
echo "7. 永久保存环境变量..."

# 更新 /etc/profile
cat >> /etc/profile << EOF

# Node.js 环境变量
export PATH="$NODEJS_PATH:\$PATH"
export NODE_PATH="$(dirname $NODEJS_PATH)/lib/node_modules"
EOF

# 更新 ~/.bashrc
cat >> ~/.bashrc << EOF

# Node.js 环境变量
export PATH="$NODEJS_PATH:\$PATH"
export NODE_PATH="$(dirname $NODEJS_PATH)/lib/node_modules"
EOF

# 8. 创建启动脚本
echo ""
echo "8. 创建启动脚本..."

cat > /usr/local/bin/node-env << EOF
#!/bin/bash
# Node.js 环境启动脚本
export PATH="$NODEJS_PATH:\$PATH"
export NODE_PATH="$(dirname $NODEJS_PATH)/lib/node_modules"
exec "\$@"
EOF

chmod +x /usr/local/bin/node-env

echo ""
echo "========================================"
echo "🎉 环境修复完成！"
echo "========================================"
echo ""
echo "📊 环境信息："
echo "   Node.js: $(node --version)"
echo "   npm: $(npm --version)"
echo "   PM2: $(pm2 --version)"
echo "   路径: $NODEJS_PATH"
echo ""
echo "⚠️  重要提醒："
echo "1. 请重新登录终端以加载新的环境变量"
echo "2. 或者执行: source /etc/profile"
echo "3. 然后可以继续部署项目"
