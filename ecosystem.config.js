// PM2 配置文件 - 兔图项目
module.exports = {
  apps: [
    {
      name: 'tu-project',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1, // 可以根据服务器CPU核心数调整
      exec_mode: 'fork', // 或 'cluster' 用于多实例

      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=2048',
      },

      // 日志配置
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // 自动重启配置
      watch: false, // 生产环境建议关闭文件监听
      ignore_watch: [
        'node_modules',
        'logs',
        'public/uploads',
        '.git'
      ],

      // 内存和CPU限制
      max_memory_restart: '1G',

      // 重启策略
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',

      // 健康检查
      health_check_grace_period: 3000,

      // 其他配置
      kill_timeout: 5000,
      listen_timeout: 3000,

      // 环境特定配置
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=2048',
      },

      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
      }
    }
  ],

  // 部署配置 (可选)
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/DiDuMi/Tu.git',
      path: '/var/www/tu-project',
      'post-deploy': 'npm ci && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y'
    }
  }
};
