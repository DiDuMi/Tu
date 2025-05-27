# 🔄 服务器安全重置和重新部署指南

## 📋 概述

本指南将帮助您安全地清理兔图项目相关的端口和实例，同时保护现有的其他服务（如Python项目），然后重新部署兔图项目。

## 🛡️ 服务保护说明

**本指南已针对您的环境进行优化：**
- ✅ **保护3001端口的Python项目** - 不会被清理
- 🎯 **仅清理3000端口的兔图项目** - 精确清理
- 🔒 **保护其他宝塔面板服务** - 确保安全

## 🚨 重要提醒

**在执行清理操作前，请确保：**
- 已备份重要数据
- 了解清理操作的影响范围
- 确认3001端口的Python项目需要保护
- 有足够的权限执行操作

## 🛠️ 方案选择

### 方案一：安全清理（强烈推荐）

使用专门的安全清理脚本，保护您的Python项目：

```bash
# 1. 给脚本执行权限
chmod +x safe-cleanup.sh

# 2. 运行安全清理
sudo ./safe-cleanup.sh
```

**此脚本特点：**
- 🛡️ **保护3001端口的Python项目**
- 🎯 **仅清理兔图项目相关进程**
- 📁 **自动备份现有项目文件**
- 🔍 **详细的状态检查和确认**

### 方案二：完全自动化重置（已优化保护）

使用完整的重置脚本，一键完成所有操作：

```bash
# 1. 给脚本执行权限
chmod +x complete-reset.sh

# 2. 运行完全重置
sudo ./complete-reset.sh
```

**此脚本将执行：**
- ✅ 保护3001端口的Python项目
- ✅ 清理兔图项目相关进程和端口
- ✅ 备份现有项目文件
- ✅ 重新配置Node.js环境
- ✅ 下载最新项目代码
- ✅ 安装依赖和构建项目
- ✅ 配置环境变量
- ✅ 启动服务和配置Nginx

### 方案三：分步清理（适合排查问题）

#### 第一步：快速清理（已保护Python项目）
```bash
# 使用快速清理脚本
chmod +x quick-cleanup.sh
sudo ./quick-cleanup.sh
```

#### 第二步：手动重新部署
```bash
# 使用标准部署脚本
chmod +x deploy-baota.sh
sudo ./deploy-baota.sh
```

### 方案四：手动清理（完全控制，保护Python项目）

#### 1. 安全清理进程
```bash
# 只删除兔图项目的PM2进程
pm2 delete tu-project

# 杀死兔图项目相关的Node.js进程
sudo pkill -f "tu-project"
sudo pkill -f "next.*3000"

# 释放端口（保护3001端口）
sudo fuser -k 3000/tcp
# 注意：不要清理3001端口，保护Python项目
sudo fuser -k 3002/tcp
sudo fuser -k 8000/tcp
```

#### 2. 清理项目文件
```bash
# 备份现有项目
sudo mkdir -p /www/backup
sudo mv /www/wwwroot/tu-project /www/backup/tu-project-backup-$(date +%Y%m%d)

# 清理缓存
sudo rm -rf ~/.npm
sudo rm -rf ~/.pm2
```

#### 3. 重新部署
```bash
# 下载项目
cd /www/wwwroot
sudo git clone https://github.com/DiDuMi/Tu.git tu-project
cd tu-project

# 安装依赖
sudo npm install

# 配置环境
sudo cp .env.example .env
# 编辑 .env 文件

# 构建项目
sudo npm run build

# 启动服务
sudo pm2 start ecosystem.config.js --env production
```

## 🔍 验证清理结果

### 检查端口占用
```bash
# 查看端口占用
netstat -tlnp | grep -E ":(3000|3001|8000)"

# 应该没有输出，表示端口已释放
```

### 检查进程状态
```bash
# 查看Node.js进程
ps aux | grep -E "(node|npm|next)" | grep -v grep

# 查看PM2状态
pm2 status
```

### 检查项目文件
```bash
# 查看项目目录
ls -la /www/wwwroot/

# 查看备份目录
ls -la /www/backup/
```

## 🚀 重新部署验证

部署完成后，验证以下项目：

### 1. 服务状态检查
```bash
# PM2进程状态
pm2 status

# 端口监听
netstat -tlnp | grep :3000

# 应用响应
curl -I http://localhost:3000
```

### 2. 功能测试
- [ ] 访问首页：`http://YOUR_SERVER_IP`
- [ ] 用户注册功能
- [ ] 用户登录功能
- [ ] 文件上传功能
- [ ] 管理后台：`http://YOUR_SERVER_IP/admin`

### 3. 日志检查
```bash
# 查看应用日志
pm2 logs tu-project

# 查看错误日志
tail -f /www/wwwroot/tu-project/logs/error.log
```

## 🆘 故障排除

### 常见问题

**1. 端口仍被占用**
```bash
# 强制释放端口
sudo lsof -ti:3000 | xargs kill -9
```

**2. PM2无法启动**
```bash
# 重新安装PM2
npm uninstall -g pm2
npm install -g pm2
```

**3. 权限问题**
```bash
# 修复权限
sudo chown -R www:www /www/wwwroot/tu-project
sudo chmod -R 755 /www/wwwroot/tu-project
sudo chmod -R 777 /www/wwwroot/tu-project/public/uploads
```

**4. 数据库问题**
```bash
# 重新初始化数据库
cd /www/wwwroot/tu-project
npx prisma generate
npx prisma db push
```

## 📞 技术支持

如果遇到问题，请提供以下信息：

1. **错误日志**：`pm2 logs tu-project`
2. **系统信息**：`uname -a`
3. **Node.js版本**：`node --version`
4. **端口状态**：`netstat -tlnp | grep :3000`

## 📋 脚本文件说明

- `complete-reset.sh` - 完全重置脚本（推荐）
- `quick-cleanup.sh` - 快速清理脚本
- `deploy-baota.sh` - 标准部署脚本
- `baota-check.sh` - 环境检查脚本

选择适合您需求的脚本执行即可。
