# 兔图项目API文档

**版本**: 1.0.0
**最后更新**: 2023-11-16
**维护人**: 后端架构组

## 目录

1. [API设计原则](#1-api设计原则)
2. [API版本控制](#2-api版本控制)
3. [统一响应格式](#3-统一响应格式)
4. [认证与授权](#4-认证与授权)
5. [错误处理](#5-错误处理)
6. [API端点参考](#6-api端点参考)
7. [常见集成场景](#7-常见集成场景)

## 1. API设计原则

兔图项目API遵循以下设计原则：

### 1.1 RESTful设计

- 使用HTTP方法表示操作类型（GET、POST、PUT、DELETE）
- 使用URL路径表示资源
- 使用查询参数进行过滤和分页
- 使用HTTP状态码表示操作结果

### 1.2 命名约定

- API路径使用小写字母和连字符（kebab-case）
- 资源名称使用复数形式（如users、posts）
- 查询参数使用camelCase
- 版本号使用v1、v2等格式

### 1.3 安全性原则

- 所有API请求必须通过HTTPS
- 敏感操作必须进行身份验证和授权
- 实施速率限制防止滥用
- 验证所有输入数据

## 2. API版本控制

### 2.1 版本控制策略

兔图项目使用URL路径版本控制：

```
/api/v1/resource
```

### 2.2 版本兼容性

- 主版本号（v1、v2）表示不兼容的API更改
- 同一主版本内的更新必须保持向后兼容
- API废弃前会提前通知，并在响应头中添加`Deprecation`标记

### 2.3 版本迁移

当需要进行不兼容的更改时：

1. 创建新的API版本（如v2）
2. 保持旧版本（v1）可用一段时间
3. 在文档中明确标记废弃的API
4. 提供迁移指南

## 3. 统一响应格式

所有API响应必须遵循以下统一格式：

### 3.1 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据，根据API不同而不同
  },
  "message": "操作成功" // 可选
}
```

### 3.2 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述信息",
    "details": {} // 可选，提供详细错误信息
  }
}
```

### 3.3 分页数据格式

```json
{
  "success": true,
  "data": {
    "items": [...], // 数据项数组
    "pagination": {
      "total": 100,   // 总数据条数
      "page": 1,      // 当前页码
      "limit": 10,    // 每页条数
      "totalPages": 10 // 总页数
    }
  }
}
```

## 4. 认证与授权

### 4.1 认证方式

兔图项目API使用JWT令牌进行认证：

1. 客户端通过登录API获取JWT令牌
2. 后续请求在Authorization头中携带令牌
3. 令牌格式：`Bearer {token}`

### 4.2 授权机制

- 基于用户角色的访问控制（RBAC）
- 用户组权限系统
- API级别的权限检查

### 4.3 认证相关API

| 端点 | 方法 | 描述 | 认证要求 |
|-----|-----|------|---------|
| `/api/v1/auth/login` | POST | 用户登录 | 无 |
| `/api/v1/auth/refresh` | POST | 刷新令牌 | 有效的刷新令牌 |
| `/api/v1/auth/logout` | POST | 用户登出 | 有效的访问令牌 |

## 5. 错误处理

### 5.1 HTTP状态码

| 状态码 | 描述 | 使用场景 |
|-------|------|---------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证或认证失败 |
| 403 | Forbidden | 权限不足 |
| 404 | Not Found | 资源不存在 |
| 422 | Unprocessable Entity | 验证错误 |
| 429 | Too Many Requests | 请求频率超限 |
| 500 | Internal Server Error | 服务器错误 |

### 5.2 错误码

| 错误码 | 描述 | HTTP状态码 |
|-------|------|-----------|
| `AUTH_INVALID_CREDENTIALS` | 无效的认证凭据 | 401 |
| `AUTH_TOKEN_EXPIRED` | 认证令牌已过期 | 401 |
| `AUTH_INSUFFICIENT_PERMISSIONS` | 权限不足 | 403 |
| `RESOURCE_NOT_FOUND` | 请求的资源不存在 | 404 |
| `VALIDATION_ERROR` | 请求数据验证失败 | 422 |
| `RATE_LIMIT_EXCEEDED` | 请求频率超限 | 429 |
| `SERVER_ERROR` | 服务器内部错误 | 500 |

### 5.3 错误响应示例

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求数据验证失败",
    "details": {
      "email": "无效的邮箱格式",
      "password": "密码长度必须至少为8个字符"
    }
  }
}
```

## 6. API端点参考

### 6.1 用户管理API

#### 6.1.1 获取用户列表

- **URL**: `/api/v1/users`
- **方法**: GET
- **描述**: 获取用户列表，支持分页和筛选
- **认证要求**: 需要管理员权限
- **查询参数**:

| 参数 | 类型 | 必填 | 描述 | 默认值 |
|-----|-----|------|------|-------|
| page | number | 否 | 页码 | 1 |
| limit | number | 否 | 每页数量 | 10 |
| status | string | 否 | 用户状态筛选 | 所有状态 |
| role | string | 否 | 用户角色筛选 | 所有角色 |

- **成功响应**:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "uuid": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
        "name": "张三",
        "email": "zhangsan@example.com",
        "role": "MEMBER",
        "status": "ACTIVE",
        "createdAt": "2023-01-01T00:00:00Z"
      },
      // 更多用户...
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

- **错误响应**:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INSUFFICIENT_PERMISSIONS",
    "message": "权限不足，需要管理员权限"
  }
}
```

#### 6.1.2 创建用户

- **URL**: `/api/v1/users`
- **方法**: POST
- **描述**: 创建新用户
- **认证要求**: 需要管理员权限
- **请求体**:

```json
{
  "name": "李四",
  "email": "lisi@example.com",
  "password": "securepassword",
  "role": "MEMBER",
  "status": "ACTIVE",
  "userGroupId": 1
}
```

- **成功响应**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "uuid": "b2c3d4e5-f6g7-8901-bcde-2345678901cd",
      "name": "李四",
      "email": "lisi@example.com",
      "role": "MEMBER",
      "status": "ACTIVE",
      "createdAt": "2023-11-16T00:00:00Z"
    }
  },
  "message": "用户创建成功"
}
```

### 6.2 内容管理API

#### 6.2.1 获取页面列表

- **URL**: `/api/v1/pages`
- **方法**: GET
- **描述**: 获取页面列表，支持分页和筛选
- **认证要求**: 可选（未认证用户只能获取已发布页面）
- **查询参数**:

| 参数 | 类型 | 必填 | 描述 | 默认值 |
|-----|-----|------|------|-------|
| page | number | 否 | 页码 | 1 |
| limit | number | 否 | 每页数量 | 10 |
| status | string | 否 | 页面状态筛选 | "PUBLISHED" |
| featured | boolean | 否 | 是否精选 | 所有 |
| categoryId | number | 否 | 分类ID | 所有分类 |
| tag | string | 否 | 标签筛选 | 所有标签 |

- **成功响应**:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "uuid": "c3d4e5f6-g7h8-9012-cdef-3456789012de",
        "title": "示例页面",
        "content": "页面内容...",
        "status": "PUBLISHED",
        "featured": true,
        "createdAt": "2023-01-01T00:00:00Z",
        "user": {
          "id": 1,
          "name": "张三"
        },
        "tags": ["示例", "教程"]
      },
      // 更多页面...
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

## 7. 常见集成场景

### 7.1 用户认证流程

1. 客户端调用登录API获取令牌
2. 将令牌存储在客户端（如localStorage）
3. 在后续请求中添加Authorization头
4. 处理令牌过期情况，使用刷新令牌获取新令牌

```javascript
// 登录示例
async function login(email, password) {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.data.token);
    return data.data.user;
  } else {
    throw new Error(data.error.message);
  }
}

// API请求示例
async function fetchData(url) {
  const token = localStorage.getItem('token');
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
}
```

### 7.2 分页数据获取

```javascript
// 获取分页数据示例
async function fetchPages(page = 1, limit = 10) {
  const response = await fetchData(`/api/v1/pages?page=${page}&limit=${limit}`);
  
  if (response.success) {
    return {
      items: response.data.items,
      pagination: response.data.pagination
    };
  } else {
    throw new Error(response.error.message);
  }
}
```

## 版本历史

| 版本 | 日期 | 更新内容 | 更新人 |
|-----|------|---------|-------|
| 1.0.0 | 2023-11-16 | 初始版本 | 后端架构组 |
