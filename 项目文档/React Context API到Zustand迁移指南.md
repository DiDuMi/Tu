# React Context API到Zustand迁移指南

**版本**: 1.0.0
**最后更新**: 2023-11-15
**维护人**: 前端架构组

## 目录

1. [迁移背景与原因](#1-迁移背景与原因)
2. [迁移策略](#2-迁移策略)
3. [迁移步骤详解](#3-迁移步骤详解)
4. [最佳实践](#4-最佳实践)
5. [常见问题与解决方案](#5-常见问题与解决方案)
6. [性能优化](#6-性能优化)

## 1. 迁移背景与原因

### 1.1 为什么从React Context API迁移到Zustand

- **性能优化**：Context API在状态变化时会导致所有消费组件重新渲染，而Zustand支持选择性订阅，只有使用特定状态的组件才会重新渲染
- **简化代码**：Zustand提供了更简洁的API，减少样板代码
- **更好的开发体验**：Zustand支持中间件、devtools等，提供更好的调试体验
- **更灵活的状态管理**：Zustand可以在组件树外部访问和修改状态，更适合复杂应用
- **更好的TypeScript支持**：Zustand提供了优秀的TypeScript类型推断

### 1.2 迁移目标

- 完全移除React Context API用于全局状态管理的用例
- 使用Zustand重新实现所有状态管理逻辑
- 保持状态管理API的一致性，减少迁移对业务代码的影响
- 提高应用性能和开发体验

## 2. 迁移策略

### 2.1 渐进式迁移

1. **准备工作**：
   - 安装Zustand：`npm install zustand`
   - 分析现有Context的使用情况，识别全局状态和局部状态
   - 为每个Context创建对应的Zustand store

2. **迁移优先级**：
   - 第一阶段：简单的全局状态（如主题、用户信息等）
   - 第二阶段：中等复杂度的状态（如表单状态、列表状态等）
   - 第三阶段：复杂的状态管理（如多层嵌套状态、异步状态等）

3. **迁移方法**：
   - 创建与Context等效的Zustand store
   - 保持相同的状态结构和操作方法
   - 在组件中替换useContext为Zustand的hook
   - 移除Context Provider包装
   - 更新测试用例

### 2.2 依赖清理

- 识别并移除不再需要的Context相关代码
- 使用ESLint规则检测和禁止使用Context API进行全局状态管理
- 保留Context API用于非状态管理的场景（如主题、国际化等）

## 3. 迁移步骤详解

### 3.1 从Context到Zustand的映射

以下是一个典型的Context到Zustand的迁移示例：

**原Context实现**：

```tsx
// UserContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 初始化逻辑
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (err) {
        setError('Failed to fetch user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
```

**迁移到Zustand**：

```tsx
// userStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        loading: false,
        error: null,

        fetchUser: async () => {
          set({ loading: true, error: null });
          try {
            const response = await fetch('/api/user');
            if (response.ok) {
              const userData = await response.json();
              set({ user: userData, loading: false });
            } else {
              set({ loading: false });
            }
          } catch (err) {
            set({ 
              error: err instanceof Error ? err.message : 'Failed to fetch user', 
              loading: false 
            });
          }
        },

        login: async (email, password) => {
          set({ loading: true, error: null });
          try {
            const response = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
              throw new Error('Login failed');
            }

            const userData = await response.json();
            set({ user: userData, loading: false });
          } catch (err) {
            set({ 
              error: err instanceof Error ? err.message : 'Login failed', 
              loading: false 
            });
          }
        },

        logout: () => {
          set({ user: null });
        },
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({ user: state.user }),
      }
    )
  )
);

// 初始化函数 - 在应用启动时调用
export function initializeUserStore() {
  useUserStore.getState().fetchUser();
}
```

### 3.2 组件中的使用更新

**原Context使用**：

```tsx
import { useUser } from './UserContext';

function Profile() {
  const { user, loading, error, logout } = useUser();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Please login</div>;

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// 在应用根组件中
function App() {
  return (
    <UserProvider>
      <Profile />
    </UserProvider>
  );
}
```

**迁移到Zustand**：

```tsx
import { useEffect } from 'react';
import { useUserStore } from './userStore';

function Profile() {
  // 选择性订阅状态，提高性能
  const user = useUserStore(state => state.user);
  const loading = useUserStore(state => state.loading);
  const error = useUserStore(state => state.error);
  const logout = useUserStore(state => state.logout);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Please login</div>;

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// 在应用根组件中 - 不再需要Provider
function App() {
  useEffect(() => {
    // 初始化用户状态
    useUserStore.getState().fetchUser();
  }, []);

  return <Profile />;
}
```

## 4. 最佳实践

### 4.1 Store设计原则

- **单一职责**：每个store应该管理单一领域的状态
- **状态规范化**：避免状态嵌套过深，保持扁平结构
- **不可变更新**：使用不可变方式更新状态
- **选择性暴露**：只暴露必要的状态和操作
- **中间件使用**：合理使用devtools、persist等中间件

### 4.2 Store组织

- 按功能域划分store（用户、产品、订单等）
- 对于大型应用，可以使用store切片（slices）组合
- 创建统一的store入口点

```tsx
// 使用切片组织大型store
import { create } from 'zustand';
import { userSlice, UserSlice } from './slices/userSlice';
import { cartSlice, CartSlice } from './slices/cartSlice';
import { uiSlice, UISlice } from './slices/uiSlice';

type StoreState = UserSlice & CartSlice & UISlice;

export const useStore = create<StoreState>()((...args) => ({
  ...userSlice(...args),
  ...cartSlice(...args),
  ...uiSlice(...args),
}));
```

## 5. 常见问题与解决方案

### 5.1 初始化问题

**问题**：Context Provider通常在应用启动时自动初始化状态，而Zustand需要手动触发初始化。

**解决方案**：
- 在应用根组件的useEffect中调用初始化函数
- 使用Next.js的_app.tsx或类似入口点进行初始化
- 考虑使用React Query等工具处理数据获取和缓存

### 5.2 组件测试

**问题**：使用Context时，测试组件通常需要包装Provider，迁移到Zustand后需要调整测试策略。

**解决方案**：
- 使用jest.mock()模拟Zustand store
- 创建测试辅助函数设置初始状态
- 使用@testing-library/react的renderHook测试自定义hooks

## 6. 性能优化

### 6.1 选择性订阅

Zustand的主要优势之一是支持选择性订阅，只有使用特定状态的组件才会重新渲染：

```tsx
// 不推荐 - 订阅整个store
const { user, cart, ui } = useStore();

// 推荐 - 只订阅需要的状态
const user = useStore(state => state.user);
const addToCart = useStore(state => state.addToCart);
```

### 6.2 状态分割

将大型状态分割成多个独立的store，减少状态变化导致的不必要重渲染：

```tsx
// 不推荐 - 单个大型store
const useAppStore = create<{
  user: User;
  products: Product[];
  cart: CartItem[];
  ui: UIState;
  // ...各种操作
}>();

// 推荐 - 多个独立store
const useUserStore = create<UserState>();
const useProductStore = create<ProductState>();
const useCartStore = create<CartState>();
const useUIStore = create<UIState>();
```

### 6.3 使用中间件优化

- 使用persist中间件持久化关键状态
- 使用immer中间件简化状态更新
- 使用devtools中间件便于调试
