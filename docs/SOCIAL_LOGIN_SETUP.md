# 社交登录配置指南

本文档介绍如何配置Telegram、GitHub和Google社交登录功能。

## 1. GitHub OAuth配置

### 1.1 创建GitHub OAuth应用

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 "New OAuth App"
3. 填写应用信息：
   - **Application name**: 兔图内容管理平台
   - **Homepage URL**: `http://localhost:3000` (开发环境) 或您的域名
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. 点击 "Register application"
5. 复制 **Client ID** 和 **Client Secret**

### 1.2 配置环境变量

在 `.env.local` 文件中添加：

```env
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
```

## 2. Google OAuth配置

### 2.1 创建Google OAuth应用

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 转到 "凭据" > "创建凭据" > "OAuth 2.0 客户端ID"
5. 配置OAuth同意屏幕
6. 选择应用类型为 "Web应用"
7. 添加授权重定向URI：`http://localhost:3000/api/auth/callback/google`
8. 复制 **客户端ID** 和 **客户端密钥**

### 2.2 配置环境变量

在 `.env.local` 文件中添加：

```env
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

## 3. Telegram Bot配置

### 3.1 创建Telegram Bot

1. 在Telegram中搜索 [@BotFather](https://t.me/botfather)
2. 发送 `/newbot` 命令
3. 按照提示设置Bot名称和用户名
4. 复制Bot Token
5. 设置Bot域名：发送 `/setdomain` 命令，然后选择您的Bot，输入您的域名

### 3.2 配置Bot设置

发送以下命令给 @BotFather：

```
/setdomain
选择您的Bot
输入: localhost:3000 (开发环境) 或您的域名
```

### 3.3 配置环境变量

在 `.env.local` 文件中添加：

```env
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
TELEGRAM_BOT_USERNAME="your_telegram_bot_username"
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="your_telegram_bot_username"
```

## 4. 数据库迁移

运行以下命令应用数据库迁移：

```bash
npx prisma migrate dev --name add-social-accounts
npx prisma generate
```

## 5. 功能测试

### 5.1 测试GitHub登录

1. 访问登录页面
2. 点击GitHub登录按钮
3. 授权应用访问
4. 检查是否成功登录并创建社交账号关联

### 5.2 测试Google登录

1. 访问登录页面
2. 点击Google登录按钮
3. 选择Google账号并授权
4. 检查是否成功登录并创建社交账号关联

### 5.3 测试Telegram登录

1. 访问登录页面
2. 点击Telegram登录按钮
3. 在Telegram中与Bot交互
4. 检查是否成功登录并创建社交账号关联

## 6. 用户设置页面

用户可以在 `/dashboard/settings` 页面管理社交账号关联：

- 查看已关联的社交账号
- 关联新的社交账号
- 解除现有社交账号关联
- 查看关联状态和信息

## 7. 安全注意事项

1. **环境变量安全**：确保生产环境中的敏感信息安全存储
2. **HTTPS要求**：生产环境必须使用HTTPS
3. **域名验证**：确保OAuth回调URL与实际域名匹配
4. **令牌管理**：定期轮换API密钥和令牌
5. **权限最小化**：只请求必要的权限范围

## 8. 故障排除

### 8.1 GitHub登录失败

- 检查Client ID和Secret是否正确
- 确认回调URL配置正确
- 检查GitHub应用是否已激活

### 8.2 Google登录失败

- 确认Google+ API已启用
- 检查OAuth同意屏幕配置
- 验证重定向URI设置

### 8.3 Telegram登录失败

- 确认Bot Token有效
- 检查域名设置是否正确
- 验证Bot用户名配置

## 9. 生产环境部署

### 9.1 更新回调URL

将所有OAuth应用的回调URL更新为生产域名：

- GitHub: `https://yourdomain.com/api/auth/callback/github`
- Google: `https://yourdomain.com/api/auth/callback/google`
- Telegram: 设置域名为 `yourdomain.com`

### 9.2 环境变量

确保生产环境中所有必要的环境变量都已正确设置。

### 9.3 数据库

运行生产环境数据库迁移：

```bash
npx prisma migrate deploy
```
