import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColor = 'blue' | 'purple' | 'green' | 'orange';
export type LayoutMode = 'comfortable' | 'compact' | 'spacious';
export type FontSize = 'small' | 'medium' | 'large';
export type HomeLayoutMode = 'default' | 'sidebar';

interface UIState {
  sidebarOpen: boolean;
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  layoutMode: LayoutMode;
  fontSize: FontSize;
  animationsEnabled: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  homeLayoutMode: HomeLayoutMode;
  homeSidebarExpanded: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleThemeMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeColor: (color: ThemeColor) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setFontSize: (size: FontSize) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  resetToDefaults: () => void;
  getEffectiveThemeMode: () => 'light' | 'dark';
  setHomeLayoutMode: (mode: HomeLayoutMode) => void;
  toggleHomeSidebar: () => void;
  setHomeSidebarExpanded: (expanded: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      themeMode: 'system',
      themeColor: 'blue',
      layoutMode: 'comfortable',
      fontSize: 'medium',
      animationsEnabled: true,
      highContrast: false,
      reducedMotion: false,
      homeLayoutMode: 'default',
      homeSidebarExpanded: true,
      toggleSidebar: () => set((state) => {
        const newState = !state.sidebarOpen
        console.log(`[UIStore] 切换侧边栏: ${state.sidebarOpen} → ${newState}`)
        return { sidebarOpen: newState }
      }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleThemeMode: () => set((state) => {
        // 循环切换：亮色 -> 暗色 -> 系统 -> 亮色
        const nextMode = state.themeMode === 'light'
          ? 'dark'
          : state.themeMode === 'dark'
            ? 'system'
            : 'light';
        return { themeMode: nextMode };
      }),
      setThemeMode: (mode) => set({ themeMode: mode }),
      setThemeColor: (color) => set({ themeColor: color }),
      setLayoutMode: (mode) => set({ layoutMode: mode }),
      setFontSize: (size) => set({ fontSize: size }),
      setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),
      setHighContrast: (enabled) => set({ highContrast: enabled }),
      setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
      resetToDefaults: () => set({
        themeMode: 'system',
        themeColor: 'blue',
        layoutMode: 'comfortable',
        fontSize: 'medium',
        animationsEnabled: true,
        highContrast: false,
        reducedMotion: false,
        homeLayoutMode: 'default',
        homeSidebarExpanded: true,
      }),
      setHomeLayoutMode: (mode) => set({ homeLayoutMode: mode }),
      toggleHomeSidebar: () => set((state) => ({ homeSidebarExpanded: !state.homeSidebarExpanded })),
      setHomeSidebarExpanded: (expanded) => set({ homeSidebarExpanded: expanded }),
      getEffectiveThemeMode: () => {
        const state = get();
        if (state.themeMode === 'system' && typeof window !== 'undefined') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return state.themeMode === 'dark' ? 'dark' : 'light';
      },
    }),
    {
      name: 'rabbit-ui-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        themeMode: state.themeMode,
        themeColor: state.themeColor,
        layoutMode: state.layoutMode,
        fontSize: state.fontSize,
        animationsEnabled: state.animationsEnabled,
        highContrast: state.highContrast,
        reducedMotion: state.reducedMotion,
        homeLayoutMode: state.homeLayoutMode,
        homeSidebarExpanded: state.homeSidebarExpanded,
      }),
    }
  )
)
