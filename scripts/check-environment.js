#!/usr/bin/env node

/**
 * 兔图项目环境检查脚本
 * 检查 Node.js 环境和依赖是否满足项目要求
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色定义
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// 日志函数
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

console.log('========================================');
console.log('🔍 兔图项目环境检查');
console.log('========================================');
console.log('');

// 检查 Node.js 版本
function checkNodeVersion() {
  log.info('检查 Node.js 版本...');
  
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  const minorVersion = parseInt(nodeVersion.slice(1).split('.')[1]);
  
  if (majorVersion < 18 || (majorVersion === 18 && minorVersion < 17)) {
    log.error(`Node.js 版本过低: ${nodeVersion}`);
    log.error('要求版本: v18.17.0 或更高');
    return false;
  }
  
  log.success(`Node.js 版本检查通过: ${nodeVersion}`);
  return true;
}

// 检查 npm 版本
function checkNpmVersion() {
  log.info('检查 npm 版本...');
  
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(npmVersion.split('.')[0]);
    
    if (majorVersion < 9) {
      log.warning(`npm 版本较低: v${npmVersion}`);
      log.warning('建议升级到 v9.0.0 或更高');
      return false;
    }
    
    log.success(`npm 版本检查通过: v${npmVersion}`);
    return true;
  } catch (error) {
    log.error('无法获取 npm 版本');
    return false;
  }
}

// 检查 package.json
function checkPackageJson() {
  log.info('检查 package.json...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    log.error('package.json 文件不存在');
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // 检查引擎要求
    if (packageJson.engines) {
      if (packageJson.engines.node) {
        log.success(`Node.js 引擎要求: ${packageJson.engines.node}`);
      }
      if (packageJson.engines.npm) {
        log.success(`npm 引擎要求: ${packageJson.engines.npm}`);
      }
    }
    
    // 检查关键依赖
    const criticalDeps = [
      'next',
      'react',
      'react-dom',
      '@prisma/client',
      'next-auth',
      'typescript'
    ];
    
    const missingDeps = criticalDeps.filter(dep => 
      !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
    );
    
    if (missingDeps.length > 0) {
      log.error(`缺少关键依赖: ${missingDeps.join(', ')}`);
      return false;
    }
    
    log.success('package.json 检查通过');
    return true;
  } catch (error) {
    log.error('package.json 格式错误');
    return false;
  }
}

// 检查依赖安装
function checkDependencies() {
  log.info('检查依赖安装...');
  
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    log.error('node_modules 目录不存在，请运行 npm install');
    return false;
  }
  
  // 检查关键包是否安装
  const criticalPackages = [
    'next',
    'react',
    'react-dom',
    '@prisma/client',
    'next-auth',
    'typescript'
  ];
  
  for (const pkg of criticalPackages) {
    const pkgPath = path.join(nodeModulesPath, pkg);
    if (!fs.existsSync(pkgPath)) {
      log.error(`关键依赖未安装: ${pkg}`);
      return false;
    }
  }
  
  log.success('依赖安装检查通过');
  return true;
}

// 检查 Prisma 客户端
function checkPrismaClient() {
  log.info('检查 Prisma 客户端...');
  
  const prismaClientPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
  
  if (!fs.existsSync(prismaClientPath)) {
    log.error('Prisma 客户端未生成，请运行 npx prisma generate');
    return false;
  }
  
  log.success('Prisma 客户端检查通过');
  return true;
}

// 检查环境变量
function checkEnvironment() {
  log.info('检查环境变量...');
  
  const envPath = path.join(process.cwd(), '.env');
  const envBaotaPath = path.join(process.cwd(), '.env.baota');
  
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envBaotaPath)) {
      log.warning('.env 文件不存在，但找到 .env.baota 模板');
      log.warning('请复制并配置: cp .env.baota .env');
    } else {
      log.error('环境变量文件不存在');
    }
    return false;
  }
  
  log.success('环境变量文件检查通过');
  return true;
}

// 检查构建文件
function checkBuildFiles() {
  log.info('检查构建文件...');
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  
  if (!fs.existsSync(nextConfigPath)) {
    log.error('next.config.js 文件不存在');
    return false;
  }
  
  if (!fs.existsSync(tsconfigPath)) {
    log.error('tsconfig.json 文件不存在');
    return false;
  }
  
  log.success('构建文件检查通过');
  return true;
}

// 主检查函数
function main() {
  const checks = [
    checkNodeVersion,
    checkNpmVersion,
    checkPackageJson,
    checkDependencies,
    checkPrismaClient,
    checkEnvironment,
    checkBuildFiles
  ];
  
  let passedChecks = 0;
  const totalChecks = checks.length;
  
  for (const check of checks) {
    if (check()) {
      passedChecks++;
    }
    console.log('');
  }
  
  console.log('========================================');
  console.log(`检查结果: ${passedChecks}/${totalChecks} 项通过`);
  console.log('========================================');
  
  if (passedChecks === totalChecks) {
    log.success('所有检查通过！环境配置正确');
    console.log('');
    console.log('下一步操作：');
    console.log('1. 构建项目: npm run build');
    console.log('2. 启动服务: npm start');
    process.exit(0);
  } else {
    log.error('部分检查未通过，请修复上述问题');
    console.log('');
    console.log('常见解决方案：');
    console.log('1. 更新 Node.js: 访问 https://nodejs.org/');
    console.log('2. 安装依赖: npm install');
    console.log('3. 生成 Prisma 客户端: npx prisma generate');
    console.log('4. 配置环境变量: cp .env.baota .env');
    process.exit(1);
  }
}

// 执行检查
main();
