#!/bin/bash

# SQLite 数据库初始化脚本
# 为兔图项目创建和配置 SQLite 数据库

set -e

echo "========================================"
echo "🗄️ SQLite 数据库初始化"
echo "========================================"

PROJECT_DIR="/www/wwwroot/tu-project"
DB_DIR="$PROJECT_DIR/prisma"
DB_FILE="$DB_DIR/production.db"

# 1. 检查 SQLite 是否安装
echo "1. 检查 SQLite 安装..."
if command -v sqlite3 &> /dev/null; then
    echo "✅ SQLite 版本: $(sqlite3 --version)"
else
    echo "⚠️  SQLite 未安装，正在安装..."
    apt update
    apt install -y sqlite3
    echo "✅ SQLite 安装完成"
fi

# 2. 进入项目目录
echo ""
echo "2. 进入项目目录..."
cd $PROJECT_DIR

# 3. 创建数据库目录
echo ""
echo "3. 创建数据库目录..."
mkdir -p $DB_DIR

# 4. 设置目录权限
echo ""
echo "4. 设置目录权限..."
chown -R www:www $DB_DIR
chmod -R 755 $DB_DIR

# 5. 检查环境变量
echo ""
echo "5. 检查环境变量..."
if [ ! -f ".env" ]; then
    echo "❌ .env 文件不存在"
    if [ -f ".env.baota" ]; then
        echo "📋 复制环境变量模板..."
        cp .env.baota .env
        # 确保数据库URL正确
        sed -i 's|DATABASE_URL=.*|DATABASE_URL="file:./prisma/production.db"|g' .env
        echo "✅ 环境变量文件已创建"
    else
        echo "❌ 环境变量模板不存在"
        exit 1
    fi
fi

# 验证数据库URL
if grep -q "DATABASE_URL.*sqlite" .env || grep -q "DATABASE_URL.*file:" .env; then
    echo "✅ 数据库URL配置正确"
else
    echo "⚠️  修复数据库URL配置..."
    echo 'DATABASE_URL="file:./prisma/production.db"' >> .env
fi

# 6. 生成 Prisma 客户端
echo ""
echo "6. 生成 Prisma 客户端..."
npx prisma generate

# 7. 创建数据库表结构
echo ""
echo "7. 创建数据库表结构..."
npx prisma db push --accept-data-loss

if [ $? -eq 0 ]; then
    echo "✅ 数据库表结构创建成功"
else
    echo "❌ 数据库表结构创建失败"
    exit 1
fi

# 8. 验证数据库文件
echo ""
echo "8. 验证数据库文件..."
if [ -f "$DB_FILE" ]; then
    echo "✅ 数据库文件已创建: $DB_FILE"
    echo "📊 数据库文件大小: $(du -h $DB_FILE | cut -f1)"
else
    echo "❌ 数据库文件创建失败"
    exit 1
fi

# 9. 检查数据库表
echo ""
echo "9. 检查数据库表..."
TABLES=$(sqlite3 $DB_FILE ".tables")
if [ -n "$TABLES" ]; then
    echo "✅ 数据库表创建成功:"
    echo "$TABLES" | tr ' ' '\n' | sort
else
    echo "❌ 数据库表为空"
    exit 1
fi

# 10. 设置数据库文件权限
echo ""
echo "10. 设置数据库文件权限..."
chown www:www $DB_FILE
chmod 664 $DB_FILE

# 11. 运行种子数据（如果存在）
echo ""
echo "11. 检查种子数据..."
if [ -f "prisma/seed.ts" ]; then
    echo "📦 运行种子数据..."
    npm run prisma:seed
    if [ $? -eq 0 ]; then
        echo "✅ 种子数据导入成功"
    else
        echo "⚠️  种子数据导入失败，但不影响正常使用"
    fi
else
    echo "ℹ️  未找到种子数据文件"
fi

# 12. 创建数据库备份目录
echo ""
echo "12. 创建备份目录..."
mkdir -p $PROJECT_DIR/backups/database
chown -R www:www $PROJECT_DIR/backups
chmod -R 755 $PROJECT_DIR/backups

# 13. 创建数据库备份脚本
echo ""
echo "13. 创建备份脚本..."
cat > $PROJECT_DIR/backup-database.sh << 'EOF'
#!/bin/bash
# SQLite 数据库备份脚本

BACKUP_DIR="/www/wwwroot/tu-project/backups/database"
DB_FILE="/www/wwwroot/tu-project/prisma/production.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/production_backup_$TIMESTAMP.db"

# 创建备份
sqlite3 $DB_FILE ".backup $BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 数据库备份成功: $BACKUP_FILE"
    
    # 压缩备份文件
    gzip $BACKUP_FILE
    echo "✅ 备份文件已压缩: $BACKUP_FILE.gz"
    
    # 删除7天前的备份
    find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
    echo "🧹 清理了7天前的备份文件"
else
    echo "❌ 数据库备份失败"
    exit 1
fi
EOF

chmod +x $PROJECT_DIR/backup-database.sh
chown www:www $PROJECT_DIR/backup-database.sh

# 14. 测试数据库连接
echo ""
echo "14. 测试数据库连接..."
if sqlite3 $DB_FILE "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" > /dev/null 2>&1; then
    TABLE_COUNT=$(sqlite3 $DB_FILE "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")
    echo "✅ 数据库连接正常，共有 $TABLE_COUNT 个表"
else
    echo "❌ 数据库连接失败"
    exit 1
fi

# 15. 显示数据库信息
echo ""
echo "========================================"
echo "🎉 SQLite 数据库初始化完成！"
echo "========================================"
echo ""
echo "📊 数据库信息:"
echo "   数据库文件: $DB_FILE"
echo "   文件大小: $(du -h $DB_FILE | cut -f1)"
echo "   表数量: $(sqlite3 $DB_FILE "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")"
echo ""
echo "🔧 管理命令:"
echo "   查看表: sqlite3 $DB_FILE '.tables'"
echo "   查看结构: sqlite3 $DB_FILE '.schema'"
echo "   备份数据库: ./backup-database.sh"
echo ""
echo "📁 相关文件:"
echo "   数据库文件: $DB_FILE"
echo "   备份目录: $PROJECT_DIR/backups/database"
echo "   备份脚本: $PROJECT_DIR/backup-database.sh"
echo ""
echo "⚠️  重要提醒:"
echo "1. 定期备份数据库文件"
echo "2. 确保数据库文件权限正确 (664)"
echo "3. 监控数据库文件大小"
echo "4. 生产环境建议使用 MySQL"
