# 🚀 兔图项目安装部署指南

## 📋 系统要求

### **服务器环境**
- **操作系统**: Ubuntu 18.04+ / CentOS 7+ / Debian 9+
- **内存**: 最低 2GB，推荐 4GB+
- **存储**: 最低 20GB，推荐 50GB+
- **网络**: 稳定的互联网连接

### **软件要求**
- **Node.js**: v20.10.0 (已安装 ✅)
- **npm**: v10.0.0+ (Node.js 自带)
- **SQLite**: v3.0+ (系统自带或自动安装)
- **宝塔面板**: v7.0+ (已安装 ✅)

## 🎯 快速部署

### **一键部署命令**

```bash
# 进入项目目录
cd /www/wwwroot/tu-project

# 执行部署脚本
chmod +x deploy-node20.sh
sudo ./deploy-node20.sh
```

### **部署完成后访问**
- **网站首页**: http://103.194.106.150
- **管理后台**: http://103.194.106.150/admin

## 📝 详细安装步骤

### **步骤1: 验证环境**

```bash
# 检查 Node.js 版本
node --version  # 应显示 v20.10.0

# 检查 npm 版本
npm --version   # 应显示 10.x.x

# 检查项目目录
ls -la /www/wwwroot/tu-project
```

### **步骤2: 配置环境变量**

编辑 `.env` 文件：
```bash
nano /www/wwwroot/tu-project/.env
```

关键配置项：
```env
# 服务器配置
NEXTAUTH_URL="http://103.194.106.150"  # 修改为您的服务器IP
PORT=3000

# 数据库配置
DATABASE_URL="file:./prisma/production.db"

# 安全配置
NEXTAUTH_SECRET="your-super-secure-secret-key"  # 修改为随机字符串

# 媒体配置
MEDIA_STORAGE_PATH="./public/uploads"
MAX_FILE_SIZE=52428800  # 50MB
```

### **步骤3: 初始化数据库**

```bash
cd /www/wwwroot/tu-project

# 生成 Prisma 客户端
npx prisma generate

# 创建数据库表
npx prisma db push

# (可选) 导入种子数据
npm run prisma:seed
```

### **步骤4: 构建和启动**

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 启动服务
pm2 start ecosystem.config.js --env production
pm2 save
```

## 🔧 宝塔面板配置

### **1. 网站配置**

1. **添加站点**:
   - 域名: `103.194.106.150`
   - 根目录: `/www/wwwroot/tu-project`
   - PHP版本: 纯静态

2. **反向代理**:
   - 代理名称: `nodejs`
   - 目标URL: `http://127.0.0.1:3000`
   - 发送域名: `$host`

### **2. PM2 管理器**

1. **添加项目**:
   - 项目名称: `tu-project`
   - 启动文件: `ecosystem.config.js`
   - 运行目录: `/www/wwwroot/tu-project`

2. **监控设置**:
   - 启用自动重启
   - 设置内存限制: 1GB
   - 启用日志记录

### **3. 防火墙设置**

确保以下端口开放：
- **80**: HTTP 访问
- **443**: HTTPS 访问 (如果配置SSL)
- **3000**: Node.js 应用端口

## 📊 功能验证

### **基础功能测试**

1. **访问首页**: http://103.194.106.150
2. **用户注册/登录**: 测试认证功能
3. **文件上传**: 测试媒体上传功能
4. **管理后台**: http://103.194.106.150/admin

### **性能测试**

```bash
# 检查进程状态
pm2 status

# 查看资源使用
pm2 monit

# 测试响应时间
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000
```

## 🛠️ 常用管理命令

### **PM2 管理**

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs tu-project

# 重启应用
pm2 restart tu-project

# 停止应用
pm2 stop tu-project

# 删除应用
pm2 delete tu-project
```

### **数据库管理**

```bash
# 连接数据库
sqlite3 /www/wwwroot/tu-project/prisma/production.db

# 查看表结构
.schema

# 查看数据
SELECT * FROM User LIMIT 5;

# 备份数据库
cp prisma/production.db backups/production_$(date +%Y%m%d).db
```

### **日志管理**

```bash
# 查看应用日志
tail -f logs/combined.log

# 查看错误日志
tail -f logs/error.log

# 清理日志
> logs/combined.log
> logs/error.log
```

## 🔍 故障排除

### **常见问题**

#### **1. 502 Bad Gateway**
```bash
# 检查 PM2 状态
pm2 status

# 重启应用
pm2 restart tu-project

# 检查端口占用
netstat -tlnp | grep :3000
```

#### **2. 数据库连接失败**
```bash
# 检查数据库文件
ls -la prisma/production.db

# 重新初始化
npx prisma db push --accept-data-loss
```

#### **3. 依赖安装失败**
```bash
# 清理缓存
npm cache clean --force

# 删除依赖重新安装
rm -rf node_modules package-lock.json
npm install
```

### **性能优化**

#### **1. 内存优化**
```bash
# 设置 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=2048"
```

#### **2. 数据库优化**
```sql
-- 创建索引
CREATE INDEX idx_user_email ON User(email);
CREATE INDEX idx_page_status ON Page(status);
```

#### **3. 静态资源优化**
- 启用 Nginx gzip 压缩
- 配置静态资源缓存
- 使用 CDN 加速

## 📞 技术支持

### **日志位置**
- **应用日志**: `/www/wwwroot/tu-project/logs/`
- **PM2 日志**: `~/.pm2/logs/`
- **Nginx 日志**: `/var/log/nginx/`

### **配置文件**
- **环境变量**: `.env`
- **PM2 配置**: `ecosystem.config.js`
- **Next.js 配置**: `next.config.js`
- **数据库配置**: `prisma/schema.prisma`

### **备份策略**
```bash
# 每日自动备份脚本
0 2 * * * /www/wwwroot/tu-project/backup-database.sh
```

---

## 🎉 部署完成检查清单

- [ ] Node.js v20.10.0 已安装
- [ ] 项目依赖已安装
- [ ] 数据库已初始化
- [ ] 环境变量已配置
- [ ] PM2 服务已启动
- [ ] Nginx 反向代理已配置
- [ ] 网站可正常访问
- [ ] 管理后台可正常访问
- [ ] 文件上传功能正常
- [ ] 用户注册登录正常

**恭喜！您的兔图项目已成功部署！** 🎊
