# 🔧 兔图项目依赖环境更新指南

## 📋 更新概述

本次更新主要解决了项目部署时的依赖环境问题，确保项目能够在宝塔面板环境中正常运行。

### 🎯 更新目标
- 修复 502 Bad Gateway 错误
- 优化依赖版本兼容性
- 增强部署稳定性
- 提供自动化环境检查

## 🔄 主要更新内容

### 1. **package.json 优化**

#### 添加引擎要求
```json
{
  "engines": {
    "node": ">=18.17.0",
    "npm": ">=9.0.0"
  }
}
```

#### 更新关键依赖
- **Next.js**: `14.0.4` → `14.2.18`
- **Prisma**: `5.7.1` → `5.22.0`
- **ESLint Config**: 同步更新到 `14.2.18`

#### 添加生产环境脚本
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build:production": "NODE_ENV=production npm run build",
    "start:production": "NODE_ENV=production npm start"
  }
}
```

### 2. **PM2 配置优化**

#### 内存管理
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3000,
  NODE_OPTIONS: '--max-old-space-size=2048'
}
```

### 3. **自动化脚本**

#### 依赖更新脚本 (`scripts/update-dependencies.sh`)
- 自动检查 Node.js 和 npm 版本
- 清理缓存和旧依赖
- 安装最新依赖
- 生成 Prisma 客户端
- 验证关键依赖
- 安全漏洞检查

#### 环境检查脚本 (`scripts/check-environment.js`)
- Node.js 版本验证
- npm 版本检查
- package.json 完整性
- 依赖安装状态
- Prisma 客户端状态
- 环境变量配置
- 构建文件检查

### 4. **部署流程优化**

#### 新增环境验证步骤
```bash
install_dependencies → verify_environment → setup_environment
```

## 🚀 使用方法

### 1. **本地开发环境**

```bash
# 检查环境
node scripts/check-environment.js

# 更新依赖
./scripts/update-dependencies.sh

# 构建项目
npm run build:production
```

### 2. **服务器部署**

```bash
# 自动部署（推荐）
sudo ./deploy-baota.sh

# 手动更新依赖
chmod +x scripts/update-dependencies.sh
./scripts/update-dependencies.sh
```

### 3. **宝塔面板操作**

#### 通过 PM2 管理器
1. 停止现有进程
2. 重新安装依赖
3. 重新启动进程

#### 通过终端
```bash
cd /www/wwwroot/tu-project
./scripts/update-dependencies.sh
pm2 restart tu-project
```

## 🔍 问题诊断

### 常见问题及解决方案

#### 1. **502 Bad Gateway**
```bash
# 检查 PM2 状态
pm2 status

# 查看错误日志
pm2 logs tu-project

# 重启服务
pm2 restart tu-project
```

#### 2. **依赖安装失败**
```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

#### 3. **Prisma 客户端错误**
```bash
# 重新生成客户端
npx prisma generate

# 推送数据库架构
npx prisma db push
```

#### 4. **环境变量问题**
```bash
# 复制环境配置
cp .env.baota .env

# 编辑配置文件
nano .env
```

## 📊 版本兼容性

### 支持的环境
- **Node.js**: 18.17.0+
- **npm**: 9.0.0+
- **Ubuntu**: 18.04+
- **宝塔面板**: 7.0+

### 依赖版本
- **Next.js**: 14.2.18
- **React**: 18.x
- **Prisma**: 5.22.0
- **NextAuth.js**: 4.24.5
- **TypeScript**: 5.x

## 🛠️ 维护建议

### 定期检查
```bash
# 每月运行一次
node scripts/check-environment.js

# 检查安全漏洞
npm audit

# 更新依赖（谨慎）
npm update
```

### 监控指标
- PM2 进程状态
- 内存使用情况
- 错误日志频率
- 响应时间

## 📞 技术支持

### 日志位置
- **PM2 日志**: `./logs/`
- **Nginx 日志**: `/var/log/nginx/`
- **应用日志**: `pm2 logs tu-project`

### 常用命令
```bash
# 查看进程状态
pm2 monit

# 重启所有服务
pm2 restart all

# 查看系统资源
htop

# 检查端口占用
netstat -tlnp | grep :3000
```

### 紧急恢复
```bash
# 回滚到上一个版本
git reset --hard HEAD~1
npm install
npm run build
pm2 restart tu-project
```

---

**注意**: 在生产环境中进行任何更新操作前，请务必备份数据库和项目文件。
