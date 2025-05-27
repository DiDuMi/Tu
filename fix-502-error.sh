#!/bin/bash

# 修复 502 Bad Gateway 错误脚本
# 诊断和解决 Node.js 应用连接问题

set -e

echo "========================================"
echo "🔧 修复 502 Bad Gateway 错误"
echo "========================================"

# 定义路径
NODEJS_BIN="/www/server/nodejs/v20.10.0/bin"
NODE="$NODEJS_BIN/node"
NPM="$NODEJS_BIN/npm"
PM2="$NODEJS_BIN/pm2"
PROJECT_DIR="/www/wwwroot/tu-project"

# 1. 检查 Node.js 环境
echo "1. 检查 Node.js 环境..."
if [ -f "$NODE" ]; then
    echo "✅ Node.js: $($NODE --version)"
    export PATH="$NODEJS_BIN:$PATH"
else
    echo "❌ Node.js 不存在，查找其他版本..."
    for version in /www/server/nodejs/v*; do
        if [ -f "$version/bin/node" ]; then
            NODEJS_BIN="$version/bin"
            NODE="$NODEJS_BIN/node"
            NPM="$NODEJS_BIN/npm"
            PM2="$NODEJS_BIN/pm2"
            echo "找到 Node.js: $version"
            export PATH="$NODEJS_BIN:$PATH"
            break
        fi
    done
fi

# 2. 检查项目目录
echo ""
echo "2. 检查项目目录..."
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ 项目目录不存在: $PROJECT_DIR"
    exit 1
fi

cd $PROJECT_DIR
echo "✅ 项目目录存在"

# 3. 检查关键文件
echo ""
echo "3. 检查关键文件..."
REQUIRED_FILES=("package.json" "next.config.js" "ecosystem.config.js")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file 不存在"
    fi
done

# 4. 停止现有进程
echo ""
echo "4. 停止现有进程..."
$PM2 delete tu-project 2>/dev/null || true
$PM2 kill 2>/dev/null || true

# 杀死可能占用端口的进程
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 5. 检查依赖
echo ""
echo "5. 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules 不存在，重新安装依赖..."
    $NPM install
fi

if [ ! -d ".next" ]; then
    echo "⚠️  .next 不存在，重新构建项目..."
    NODE_ENV=production $NPM run build
fi

# 6. 检查环境变量
echo ""
echo "6. 检查环境变量..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env 文件不存在，创建基础配置..."
    cat > .env << 'EOF'
NODE_ENV="production"
PORT=3000
DATABASE_URL="file:./prisma/production.db"
NEXTAUTH_URL="http://103.194.106.150"
NEXTAUTH_SECRET="tu-project-secret-$(date +%s)"
MEDIA_STORAGE_PATH="./public/uploads"
MAX_FILE_SIZE=52428800
EOF
fi

# 确保端口配置正确
if ! grep -q "PORT=3000" .env; then
    echo "PORT=3000" >> .env
fi

# 7. 检查数据库
echo ""
echo "7. 检查数据库..."
if [ ! -f "prisma/production.db" ]; then
    echo "⚠️  数据库不存在，初始化数据库..."
    $NPM run prisma:generate 2>/dev/null || $NODEJS_BIN/npx prisma generate
    $NODEJS_BIN/npx prisma db push --accept-data-loss
fi

# 8. 测试应用启动
echo ""
echo "8. 测试应用启动..."
echo "尝试手动启动应用..."

# 创建测试启动脚本
cat > test-start.js << 'EOF'
const { spawn } = require('child_process');

console.log('测试启动 Next.js 应用...');

const child = spawn('npm', ['start'], {
    env: { ...process.env, NODE_ENV: 'production', PORT: '3000' },
    stdio: 'pipe'
});

let output = '';
let hasError = false;

child.stdout.on('data', (data) => {
    output += data.toString();
    console.log('STDOUT:', data.toString());
    
    if (data.toString().includes('ready') || data.toString().includes('started')) {
        console.log('✅ 应用启动成功');
        child.kill();
        process.exit(0);
    }
});

child.stderr.on('data', (data) => {
    console.log('STDERR:', data.toString());
    hasError = true;
});

child.on('close', (code) => {
    if (hasError) {
        console.log('❌ 应用启动失败');
        console.log('输出:', output);
        process.exit(1);
    }
});

// 10秒后超时
setTimeout(() => {
    console.log('⚠️  启动测试超时');
    child.kill();
    process.exit(1);
}, 10000);
EOF

# 运行测试
timeout 15s $NODE test-start.js || {
    echo "❌ 应用启动测试失败"
    echo "查看详细错误信息:"
    NODE_ENV=production $NPM start &
    sleep 5
    kill $! 2>/dev/null || true
}

# 清理测试文件
rm -f test-start.js

# 9. 启动 PM2
echo ""
echo "9. 启动 PM2..."

# 确保 ecosystem.config.js 存在且正确
if [ ! -f "ecosystem.config.js" ]; then
    echo "创建 ecosystem.config.js..."
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'tu-project',
    script: '$NPM',
    args: 'start',
    cwd: '$PROJECT_DIR',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    max_memory_restart: '1G',
    restart_delay: 4000,
  }]
};
EOF
fi

# 创建日志目录
mkdir -p logs

# 启动 PM2
$PM2 start ecosystem.config.js --env production

# 10. 验证启动
echo ""
echo "10. 验证启动..."
sleep 10

# 检查 PM2 状态
if $PM2 list | grep -q "tu-project"; then
    echo "✅ PM2 进程运行正常"
    $PM2 status
else
    echo "❌ PM2 进程未运行"
    $PM2 logs tu-project
    exit 1
fi

# 检查端口监听
if netstat -tlnp | grep -q ":3000"; then
    echo "✅ 端口 3000 监听正常"
else
    echo "❌ 端口 3000 未监听"
    echo "当前监听的端口:"
    netstat -tlnp | grep node
    exit 1
fi

# 11. 测试 HTTP 响应
echo ""
echo "11. 测试 HTTP 响应..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")

if [[ "$HTTP_CODE" =~ ^[23] ]]; then
    echo "✅ HTTP 响应正常 (状态码: $HTTP_CODE)"
else
    echo "⚠️  HTTP 响应异常 (状态码: $HTTP_CODE)"
    echo "查看应用日志:"
    $PM2 logs tu-project --lines 20
fi

# 12. 保存 PM2 配置
$PM2 save

echo ""
echo "========================================"
echo "🎉 502 错误修复完成！"
echo "========================================"
echo ""
echo "📊 状态检查:"
echo "   PM2 进程: $($PM2 list | grep tu-project | awk '{print $10}' || echo '未知')"
echo "   端口监听: $(netstat -tlnp | grep :3000 | wc -l) 个进程"
echo "   HTTP 状态: $HTTP_CODE"
echo ""
echo "📍 访问地址: http://103.194.106.150"
echo ""
echo "🔧 如果仍有问题，请检查:"
echo "   1. Nginx 配置: 确保反向代理到 localhost:3000"
echo "   2. 防火墙设置: 确保 3000 端口开放"
echo "   3. 应用日志: pm2 logs tu-project"
