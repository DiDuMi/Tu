# 兔图内容管理系统

一个基于 Next.js 14 的现代化内容管理系统，专为内容创作者和社区管理而设计。

## 🚀 技术栈

### 前端
- **框架**: Next.js 14+ (Pages Router)
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **数据获取**: SWR
- **类型检查**: TypeScript 5+
- **编辑器**: TinyMCE (中文汉化)

### 后端
- **API**: Next.js Route Handlers
- **数据库**: Prisma 5+ ORM
- **认证**: NextAuth.js v4.24.5
- **验证**: Zod
- **图片处理**: Sharp

### 开发工具
- **代码质量**: ESLint, Prettier
- **测试**: Jest, React Testing Library
- **版本控制**: Git, GitHub

## 📦 主要功能

### 🔐 用户管理
- 用户注册/登录系统
- 社交账号登录 (Telegram, GitHub, Google)
- 用户组权限管理
- 用户审核流程

### 📝 内容管理
- 富文本编辑器 (TinyMCE)
- 内容模板系统
- 内容审核工作流
- 标签和分类管理
- 封面图片选择

### 🎬 媒体管理
- 图片/视频上传
- 媒体文件处理和压缩
- 媒体分类和标签
- 批量导入功能

### 🏠 首页展示
- 精选内容
- 近期流出
- 往期补档
- 热门推荐

### ⚙️ 系统设置
- 权限配置
- 系统日志
- 备份恢复
- 性能监控

## 🛠️ 开发环境设置

### 环境要求
- Node.js 18+
- npm 或 yarn
- SQLite (开发环境)
- MySQL 8.0+ (生产环境)

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/your-username/tu105-project.git
cd tu105-project
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库和其他环境变量
```

4. **数据库设置**
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

5. **启动开发服务器**
```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 📝 可用脚本

```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器

# 代码质量
npm run lint         # 运行 ESLint
npm run lint:fix     # 自动修复 ESLint 错误
npm run format       # 格式化代码

# 数据库
npm run prisma:generate  # 生成 Prisma 客户端
npm run prisma:migrate   # 运行数据库迁移
npm run prisma:seed      # 填充种子数据

# 测试
npm run test         # 运行测试
npm run test:watch   # 监视模式运行测试
npm run test:coverage # 生成测试覆盖率报告

# 媒体文件处理
npm run media:fix    # 修复媒体文件名
npm run media:diagnose # 诊断上传问题
```

## 📁 项目结构

```
├── components/          # React 组件
│   ├── ui/             # 基础 UI 组件
│   ├── content/        # 内容相关组件
│   ├── media/          # 媒体相关组件
│   └── layout/         # 布局组件
├── pages/              # Next.js 页面
│   ├── api/            # API 路由
│   ├── admin/          # 管理后台
│   └── dashboard/      # 用户控制台
├── lib/                # 工具函数和配置
├── hooks/              # 自定义 React Hooks
├── stores/             # Zustand 状态管理
├── types/              # TypeScript 类型定义
├── prisma/             # 数据库模型和迁移
└── docs/               # 项目文档
```

## 🔧 配置说明

### 环境变量
详细的环境变量配置请参考 `.env.example` 文件。

### 数据库
- 开发环境使用 SQLite
- 生产环境推荐使用 MySQL 8.0+

### 认证配置
支持多种认证方式，详见 `docs/SOCIAL_LOGIN_SETUP.md`。

## 📚 文档

- [API 文档](./项目文档/API文档.md)
- [技术规范](./项目文档/兔图项目技术栈统一规范.md)
- [新手指南](./项目文档/兔图项目新手入门指南.md)
- [媒体文件处理](./项目文档/README-媒体文件处理.md)

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者们！
