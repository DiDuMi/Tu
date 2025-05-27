# 🚀 兔图项目宝塔面板部署详细教程

## 📋 部署环境说明
- **服务器系统**: Ubuntu 18.04
- **管理面板**: 宝塔Linux面板
- **数据库**: SQLite (无需额外配置)
- **Node.js版本**: 18.x LTS
- **部署方式**: PM2进程管理

## 🛠️ 第一阶段：宝塔面板环境准备

### 1.1 安装必要软件
在宝塔面板 → 软件商店中安装以下软件：

**必装软件：**
- [x] **Nginx** (1.20+) - Web服务器
- [x] **Node.js版本管理器** (安装Node.js 18.x LTS)
- [x] **PM2管理器** (进程管理)

**可选软件：**
- [x] **文件管理器** (方便文件操作)
- [x] **系统监控** (监控服务器状态)

### 1.2 Node.js环境配置
1. 进入 **软件商店** → **Node.js版本管理器**
2. 点击 **设置** → **版本管理**
3. 安装 **Node.js 18.x LTS** 版本
4. 设置为 **默认版本**

### 1.3 创建网站目录
1. 进入 **网站** → **添加站点**
2. 配置如下：
   - **域名**: 填写服务器IP或临时域名
   - **根目录**: `/www/wwwroot/tu-project`
   - **PHP版本**: 纯静态 (不需要PHP)

## 🚀 第二阶段：项目代码部署

### 2.1 上传项目代码

**方法一：使用Git (推荐)**
```bash
# SSH连接服务器或使用宝塔终端
cd /www/wwwroot
git clone https://github.com/DiDuMi/Tu.git tu-project
cd tu-project
```

**方法二：文件上传**
1. 将项目打包为 `tu-project.zip`
2. 通过宝塔 **文件管理器** 上传到 `/www/wwwroot/`
3. 解压并重命名为 `tu-project`

### 2.2 安装项目依赖
```bash
cd /www/wwwroot/tu-project

# 安装依赖
npm install

# 或使用国内镜像加速
npm install --registry=https://registry.npmmirror.com
```

### 2.3 环境配置
创建生产环境配置文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件内容：
```env
# 数据库配置 (SQLite)
DATABASE_URL="file:./prisma/production.db"

# 应用配置
NEXTAUTH_URL="http://YOUR_SERVER_IP:3000"
NEXTAUTH_SECRET="your-super-secure-secret-key-change-this-in-production"

# 媒体存储
MEDIA_STORAGE_PATH="./public/uploads"
MAX_FILE_SIZE=52428800

# 生产环境
NODE_ENV="production"
PORT=3000
```

### 2.4 数据库初始化
```bash
# 生成Prisma客户端
npx prisma generate

# 创建数据库表结构
npx prisma db push

# 创建必要目录
mkdir -p public/uploads/media
mkdir -p logs
mkdir -p backups
```

### 2.5 构建项目
```bash
npm run build
```

## 🔧 第三阶段：PM2进程管理配置

### 3.1 PM2配置文件
项目已包含 `ecosystem.config.js`，确认配置正确：
```javascript
module.exports = {
  apps: [{
    name: 'tu-project',
    script: 'npm',
    args: 'start',
    cwd: '/www/wwwroot/tu-project',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    }
  }]
};
```

### 3.2 启动应用
```bash
# 启动应用
pm2 start ecosystem.config.js --env production

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

### 3.3 验证运行状态
```bash
# 查看进程状态
pm2 status

# 查看日志
pm2 logs tu-project

# 查看监控
pm2 monit
```

## 🌐 第四阶段：Nginx反向代理配置

### 4.1 修改Nginx配置
1. 进入宝塔面板 → **网站** → 找到创建的站点
2. 点击 **设置** → **配置文件**
3. 替换为以下配置：

```nginx
server {
    listen 80;
    server_name YOUR_SERVER_IP;  # 替换为实际IP

    # 安全头设置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 客户端最大请求体大小
    client_max_body_size 50M;

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /www/wwwroot/tu-project/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri @nextjs;
    }

    # 媒体文件
    location /uploads/ {
        alias /www/wwwroot/tu-project/public/uploads/;
        expires 1M;
        add_header Cache-Control "public";
    }

    # API和应用代理
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 错误页面
    error_page 404 /404.html;
    error_page 500 502 503 504 /500.html;
}
```

### 4.2 重启Nginx
保存配置后，重启Nginx服务：
- 宝塔面板 → **软件商店** → **Nginx** → **重启**

## 🔒 第五阶段：安全和权限配置

### 5.1 文件权限设置
```bash
# 设置项目目录权限
chown -R www:www /www/wwwroot/tu-project
chmod -R 755 /www/wwwroot/tu-project
chmod -R 777 /www/wwwroot/tu-project/public/uploads
chmod -R 755 /www/wwwroot/tu-project/logs
```

### 5.2 防火墙配置
1. 宝塔面板 → **安全** → **防火墙**
2. 开放端口：
   - **80** (HTTP)
   - **443** (HTTPS，如需要)
   - **3000** (应用端口，可选)

### 5.3 SSL证书配置 (可选)
如果有域名，可以配置免费SSL证书：
1. 网站设置 → **SSL** → **Let's Encrypt**
2. 申请免费证书并开启强制HTTPS

## ✅ 第六阶段：部署验证

### 6.1 功能测试清单
访问 `http://YOUR_SERVER_IP` 进行测试：

- [ ] **首页加载**: 页面正常显示
- [ ] **用户注册**: 注册功能正常
- [ ] **用户登录**: 登录功能正常
- [ ] **文件上传**: 媒体上传功能正常
- [ ] **内容发布**: 创建内容功能正常
- [ ] **响应速度**: 页面加载速度正常

### 6.2 日志检查
```bash
# 查看应用日志
pm2 logs tu-project

# 查看Nginx访问日志
tail -f /www/wwwroot/tu-project/logs/access.log

# 查看Nginx错误日志
tail -f /www/wwwroot/tu-project/logs/error.log
```

### 6.3 性能监控
在宝塔面板中监控：
- **系统监控**: CPU、内存、磁盘使用率
- **PM2管理器**: 进程状态和资源占用
- **网站监控**: 访问量和响应时间

## 🚨 故障排除

### 常见问题及解决方案

**1. 应用无法启动**
```bash
# 检查端口占用
netstat -tlnp | grep :3000

# 检查PM2状态
pm2 status

# 重启应用
pm2 restart tu-project
```

**2. 502 Bad Gateway错误**
- 检查PM2进程是否正常运行
- 检查Nginx配置是否正确
- 查看应用日志排查错误

**3. 文件上传失败**
```bash
# 检查上传目录权限
ls -la /www/wwwroot/tu-project/public/uploads/

# 修复权限
chmod -R 777 /www/wwwroot/tu-project/public/uploads/
```

**4. 数据库连接错误**
```bash
# 检查数据库文件
ls -la /www/wwwroot/tu-project/prisma/

# 重新初始化数据库
npx prisma db push
```

## 📊 监控和维护

### 日常维护任务
1. **定期备份数据库**:
   ```bash
   cp /www/wwwroot/tu-project/prisma/production.db /www/backup/tu-db-$(date +%Y%m%d).db
   ```

2. **清理日志文件**:
   ```bash
   pm2 flush tu-project
   ```

3. **监控磁盘空间**:
   ```bash
   df -h
   du -sh /www/wwwroot/tu-project/public/uploads/
   ```

### 自动化脚本
可以在宝塔面板 → **计划任务** 中设置：
- 每日数据库备份
- 每周日志清理
- 每月磁盘空间检查

---

## 🚀 快速部署命令

### 一键自动部署 (推荐)
```bash
# 1. 上传脚本到服务器
# 2. 给脚本执行权限
chmod +x deploy-baota.sh

# 3. 运行自动部署
sudo ./deploy-baota.sh
```

### 环境检查 (可选)
```bash
# 部署前检查环境
chmod +x baota-check.sh
sudo ./baota-check.sh
```

### 日常维护
```bash
# 运行维护工具
chmod +x baota-maintenance.sh
sudo ./baota-maintenance.sh
```

## 📋 手动部署步骤总结

如果自动部署脚本失败，可以按以下步骤手动部署：

```bash
# 1. 克隆项目
cd /www/wwwroot
git clone https://github.com/DiDuMi/Tu.git tu-project
cd tu-project

# 2. 安装依赖
npm install

# 3. 配置环境
cp .env.baota .env
# 编辑 .env 文件，修改服务器IP

# 4. 初始化数据库
npx prisma generate
npx prisma db push

# 5. 创建目录
mkdir -p public/uploads/media logs backups

# 6. 设置权限
chown -R www:www /www/wwwroot/tu-project
chmod -R 755 /www/wwwroot/tu-project
chmod -R 777 /www/wwwroot/tu-project/public/uploads

# 7. 构建项目
npm run build

# 8. 启动服务
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 9. 配置Nginx (参考上述配置)
```

## 🎉 部署完成！

恭喜！您的兔图项目已成功部署到宝塔面板。

**访问地址**: `http://YOUR_SERVER_IP`

**管理后台**: `http://YOUR_SERVER_IP/admin`

## 📞 技术支持

**部署相关文件:**
- `BAOTA_DEPLOYMENT_GUIDE.md` - 详细部署教程
- `deploy-baota.sh` - 自动部署脚本
- `baota-check.sh` - 环境检查脚本
- `baota-maintenance.sh` - 维护工具
- `.env.baota` - 环境配置模板

**常见问题排查:**
1. 查看PM2日志: `pm2 logs tu-project`
2. 查看Nginx日志: `tail -f /var/log/nginx/error.log`
3. 检查进程状态: `pm2 status`
4. 重启服务: `pm2 restart tu-project`

如遇问题，请运行维护工具进行诊断: `sudo ./baota-maintenance.sh`
