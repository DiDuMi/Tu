#!/bin/bash

# 兔图项目部署打包脚本
# 排除 node_modules 等大文件，创建轻量级部署包

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
PROJECT_NAME="tu-project"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
ARCHIVE_NAME="${PROJECT_NAME}-deploy-${TIMESTAMP}.tar.gz"

echo "========================================"
echo "📦 兔图项目部署打包工具"
echo "========================================"
echo ""

echo -e "${BLUE}[INFO]${NC} 开始打包项目用于部署..."
echo -e "${BLUE}[INFO]${NC} 排除大文件和不必要的目录..."
echo ""

# 创建排除列表
cat > .deployignore << EOF
node_modules/
.git/
.next/
.env.local
.env.development
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
Thumbs.db
*.tmp
*.temp
coverage/
.nyc_output/
.cache/
dist/
build/
EOF

echo -e "${BLUE}[INFO]${NC} 正在创建压缩包: $ARCHIVE_NAME"
echo ""

# 使用tar创建压缩包，排除指定文件
tar -czf "$ARCHIVE_NAME" \
    --exclude-from=.deployignore \
    --exclude="$ARCHIVE_NAME" \
    .

# 清理临时文件
rm -f .deployignore

# 获取文件大小
if command -v du >/dev/null 2>&1; then
    SIZE=$(du -h "$ARCHIVE_NAME" | cut -f1)
else
    SIZE=$(ls -lh "$ARCHIVE_NAME" | awk '{print $5}')
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ 打包完成！${NC}"
echo "========================================"
echo ""
echo -e "${BLUE}📁 压缩包:${NC} $ARCHIVE_NAME"
echo -e "${BLUE}📊 文件大小:${NC} $SIZE"
echo ""
echo -e "${YELLOW}📋 已排除以下大文件/目录:${NC}"
echo "   - node_modules/ (1.15GB)"
echo "   - .git/ (版本控制)"
echo "   - .next/ (构建缓存)"
echo "   - 各种日志和临时文件"
echo ""
echo -e "${GREEN}🚀 下一步操作:${NC}"
echo "1. 将 $ARCHIVE_NAME 上传到服务器"
echo "2. 在服务器上解压: tar -xzf $ARCHIVE_NAME"
echo "3. 运行部署脚本: sudo ./deploy-baota.sh"
echo ""
echo -e "${BLUE}💡 提示:${NC} 服务器会自动安装 node_modules 依赖"
echo "========================================"
