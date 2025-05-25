import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { apiCache, withCache, CACHE_KEYS, CACHE_TTL } from '@/lib/api-cache'

// 用户角色类型
type UserRole = 'ADMIN' | 'OPERATOR' | 'REGISTERED' | 'GUEST'

// 内容项接口
interface ContentItem {
  id: number;
  uuid: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
  author?: {
    id: string;
    name: string;
    image?: string;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  tags?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

// 用户状态接口
interface UserState {
  // 用户信息
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    image?: string | null;
    avatar?: string;
    bio?: string;
    status?: string;
    createdAt?: string;
  } | null;

  // 收藏和点赞内容
  favorites: ContentItem[];
  likedContents: ContentItem[];

  // 加载状态
  isLoading: boolean;
  isFavoritesLoading: boolean;
  isLikesLoading: boolean;
  error: string | null;

  // 缓存状态
  lastFavoritesUpdate: number;
  lastLikesUpdate: number;

  // 基础操作
  setUser: (user: UserState['user']) => void;
  clearUser: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // 高级操作
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (data: Partial<NonNullable<UserState['user']>>) => Promise<void>;
  updateUserAvatar: (file: File) => Promise<void>;

  // 收藏和点赞操作
  fetchFavorites: () => Promise<void>;
  fetchLikedContents: () => Promise<void>;
  addToFavorites: (contentId: string) => Promise<void>;
  removeFromFavorites: (contentId: string) => Promise<void>;
  toggleLike: (contentId: string) => Promise<{ isLiked: boolean; likeCount: number }>;
}

export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      user: null,
      favorites: [],
      likedContents: [],
      isLoading: false,
      isFavoritesLoading: false,
      isLikesLoading: false,
      error: null,
      lastFavoritesUpdate: 0,
      lastLikesUpdate: 0,

      // 基础操作
      setUser: (user) => set({ user, error: null }),
      clearUser: () => set({ user: null, favorites: [], likedContents: [] }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // 获取用户资料
      fetchUserProfile: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch('/api/v1/users/me');

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || '获取用户资料失败');
          }

          const data = await response.json();

          set({
            user: data.data,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('获取用户资料失败:', error);

          set({
            isLoading: false,
            error: error.message || '获取用户资料失败',
          });
        }
      },

      // 更新用户资料
      updateUserProfile: async (data) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch('/api/v1/users/me', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || '更新用户资料失败');
          }

          const responseData = await response.json();

          set({
            user: responseData.data,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('更新用户资料失败:', error);

          set({
            isLoading: false,
            error: error.message || '更新用户资料失败',
          });

          throw error;
        }
      },

      // 更新用户头像
      updateUserAvatar: async (file) => {
        try {
          set({ isLoading: true, error: null });

          const formData = new FormData();
          formData.append('avatar', file);

          const response = await fetch('/api/v1/users/me/avatar', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || '更新头像失败');
          }

          const data = await response.json();

          set(state => ({
            user: state.user ? {
              ...state.user,
              avatar: data.data.avatar,
            } : null,
            isLoading: false,
          }));
        } catch (error: any) {
          console.error('更新头像失败:', error);

          set({
            isLoading: false,
            error: error.message || '更新头像失败',
          });

          throw error;
        }
      },

      // 获取用户收藏内容
      fetchFavorites: async () => {
        const state = get();

        // 防止重复请求
        if (state.isFavoritesLoading) {
          return;
        }

        // 检查缓存是否有效（5分钟内）
        const now = Date.now();
        if (state.lastFavoritesUpdate && (now - state.lastFavoritesUpdate) < CACHE_TTL.MEDIUM) {
          return;
        }

        try {
          set({ isFavoritesLoading: true, error: null });

          const data = await withCache(
            CACHE_KEYS.USER_FAVORITES,
            async () => {
              const response = await fetch('/api/v1/users/me/favorites');
              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || '获取收藏内容失败');
              }
              return response.json();
            },
            CACHE_TTL.MEDIUM
          );

          set({
            favorites: data.data,
            isFavoritesLoading: false,
            lastFavoritesUpdate: now,
          });
        } catch (error: any) {
          console.error('获取收藏内容失败:', error);

          set({
            isFavoritesLoading: false,
            error: error.message || '获取收藏内容失败',
          });
        }
      },

      // 获取用户点赞内容
      fetchLikedContents: async () => {
        const state = get();

        // 防止重复请求
        if (state.isLikesLoading) {
          return;
        }

        // 检查缓存是否有效（5分钟内）
        const now = Date.now();
        if (state.lastLikesUpdate && (now - state.lastLikesUpdate) < CACHE_TTL.MEDIUM) {
          return;
        }

        try {
          set({ isLikesLoading: true, error: null });

          const data = await withCache(
            CACHE_KEYS.USER_LIKES,
            async () => {
              const response = await fetch('/api/v1/users/me/likes');
              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || '获取点赞内容失败');
              }
              return response.json();
            },
            CACHE_TTL.MEDIUM
          );

          set({
            likedContents: data.data,
            isLikesLoading: false,
            lastLikesUpdate: now,
          });
        } catch (error: any) {
          console.error('获取点赞内容失败:', error);

          set({
            isLikesLoading: false,
            error: error.message || '获取点赞内容失败',
          });
        }
      },

      // 添加收藏
      addToFavorites: async (contentId: string) => {
        try {
          set({ isFavoritesLoading: true, error: null });

          const response = await fetch('/api/v1/users/me/favorites', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contentId }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || '添加收藏失败');
          }

          const data = await response.json();

          // 更新收藏列表
          set(state => ({
            favorites: [...state.favorites, data.data],
            isFavoritesLoading: false,
          }));
        } catch (error: any) {
          console.error('添加收藏失败:', error);

          set({
            isFavoritesLoading: false,
            error: error.message || '添加收藏失败',
          });

          throw error;
        }
      },

      // 移除收藏
      removeFromFavorites: async (contentId: string) => {
        try {
          set({ isFavoritesLoading: true, error: null });

          const response = await fetch(`/api/v1/users/me/favorites/${contentId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || '移除收藏失败');
          }

          // 更新收藏列表
          set(state => ({
            favorites: state.favorites.filter(item => item.uuid !== contentId),
            isFavoritesLoading: false,
          }));
        } catch (error: any) {
          console.error('移除收藏失败:', error);

          set({
            isFavoritesLoading: false,
            error: error.message || '移除收藏失败',
          });

          throw error;
        }
      },

      // 切换点赞状态
      toggleLike: async (contentId: string) => {
        try {
          set({ isLikesLoading: true, error: null });

          const response = await fetch(`/api/v1/pages/${contentId}/like`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || '操作失败');
          }

          const data = await response.json();
          const isLiked = data.data.liked;
          const likeCount = data.data.likeCount;

          // 更新点赞列表
          if (isLiked) {
            // 获取内容详情并添加到点赞列表
            try {
              const contentResponse = await fetch(`/api/v1/pages/${contentId}`);
              const contentData = await contentResponse.json();

              if (contentData.success) {
                set(state => ({
                  likedContents: [...state.likedContents, contentData.data],
                  isLikesLoading: false
                }));
              } else {
                set({ isLikesLoading: false });
              }
            } catch (contentError) {
              console.error('获取内容详情失败:', contentError);
              set({ isLikesLoading: false });
            }
          } else {
            set(state => ({
              likedContents: state.likedContents.filter(item => item.uuid !== contentId),
              isLikesLoading: false,
            }));
          }

          return { isLiked, likeCount };
        } catch (error: any) {
          console.error('点赞操作失败:', error);

          set({
            isLikesLoading: false,
            error: error.message || '点赞操作失败',
          });

          throw error;
        }
      },
    }),
    { name: 'user-store' }
  )
)
