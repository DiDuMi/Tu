module.exports = {
  extends: ['next/core-web-vitals', 'plugin:import/recommended', 'plugin:import/typescript'],
  plugins: ['import'],
  rules: {
    // 强制导入顺序：第三方库 > 项目模块 > 相对路径导入
    'import/order': [
      'error',
      {
        groups: [
          'builtin', // Node.js内置模块
          'external', // 第三方库
          'internal', // 项目模块
          ['parent', 'sibling'], // 父级和兄弟级导入
          'index', // 当前目录导入
          'object', // 对象导入
          'type', // 类型导入
        ],
        'newlines-between': 'always', // 不同组之间添加空行
        alphabetize: {
          order: 'asc', // 按字母顺序排序
          caseInsensitive: true, // 忽略大小写
        },
        pathGroups: [
          // 将@/开头的导入视为内部模块
          {
            pattern: '@/**',
            group: 'internal',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
      },
    ],
    // 限制文件最大行数为300行
    'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
    // 强制使用PascalCase命名组件
    'react/jsx-pascal-case': 'error',
    // 强制使用camelCase命名变量和函数
    'camelcase': ['error', { properties: 'never', ignoreDestructuring: true }],
    // 禁止使用var
    'no-var': 'error',
    // 优先使用const
    'prefer-const': 'error',
    // 禁止未使用的变量
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
  // 为不同类型的文件设置不同的规则
  overrides: [
    {
      // 组件文件
      files: ['**/*.tsx'],
      rules: {
        // 组件文件必须使用PascalCase命名
        'react/jsx-pascal-case': 'error',
      },
    },
    {
      // API路由文件
      files: ['pages/api/**/*.ts'],
      rules: {
        // API路由文件可以超过300行，因为它们通常包含多个HTTP方法处理
        'max-lines': 'off',
      },
    },
  ],
};
