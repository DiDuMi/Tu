import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export interface User {
  id: number
  uuid: string
  name: string
  email: string
  role: string
  status: string
  image?: string | null
  createdAt: string
  userGroup?: {
    id: number
    name: string
    permissions?: Record<string, string[]>
  } | null
  userPoint?: {
    balance: number
    totalEarned: number
    totalSpent: number
  } | null
}

export interface UserGroup {
  id: number
  uuid: string
  name: string
  description?: string | null
  permissions: Record<string, string[]>
  uploadLimits?: {
    maxFileSize?: number
    allowedTypes?: string[]
  } | null
  previewPercentage: number
  userCount?: number
  createdAt: string
  updatedAt: string
}

interface AdminUserState {
  // 用户列表状态
  users: User[]
  totalUsers: number
  currentPage: number
  pageSize: number
  isLoading: boolean
  error: string | null
  searchTerm: string
  statusFilter: string | null
  roleFilter: string | null
  userGroupFilter: number | null
  emailFilter: string
  registrationDateStart: string | null
  registrationDateEnd: string | null
  sortField: string
  sortDirection: 'asc' | 'desc'

  // 多选状态
  selectedUserIds: number[]
  isAllSelected: boolean

  // 用户组列表状态
  userGroups: UserGroup[]
  totalUserGroups: number
  userGroupsCurrentPage: number
  userGroupsPageSize: number
  userGroupsIsLoading: boolean
  userGroupsError: string | null
  userGroupsSearchTerm: string

  // 当前选中的用户和用户组
  selectedUser: User | null
  selectedUserGroup: UserGroup | null

  // 用户列表操作
  setUsers: (users: User[]) => void
  setTotalUsers: (total: number) => void
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setSearchTerm: (term: string) => void
  setStatusFilter: (status: string | null) => void
  setRoleFilter: (role: string | null) => void
  setUserGroupFilter: (groupId: number | null) => void
  setEmailFilter: (email: string) => void
  setRegistrationDateRange: (start: string | null, end: string | null) => void
  setSortField: (field: string) => void
  setSortDirection: (direction: 'asc' | 'desc') => void

  // 多选操作
  selectUser: (userId: number) => void
  unselectUser: (userId: number) => void
  toggleSelectUser: (userId: number) => void
  selectAllUsers: () => void
  unselectAllUsers: () => void
  toggleSelectAllUsers: () => void

  // 用户组列表操作
  setUserGroups: (groups: UserGroup[]) => void
  setTotalUserGroups: (total: number) => void
  setUserGroupsCurrentPage: (page: number) => void
  setUserGroupsPageSize: (size: number) => void
  setUserGroupsIsLoading: (isLoading: boolean) => void
  setUserGroupsError: (error: string | null) => void
  setUserGroupsSearchTerm: (term: string) => void

  // 选中操作
  setSelectedUser: (user: User | null) => void
  setSelectedUserGroup: (group: UserGroup | null) => void

  // 重置状态
  resetUserFilters: () => void
  resetUserGroupFilters: () => void
  resetAll: () => void

  // URL参数同步
  syncWithUrl: (params: URLSearchParams) => void
  getQueryParams: () => Record<string, string>
}

export const useAdminUserStore = create<AdminUserState>()(
  devtools(
    persist(
      (set, get) => ({
        // 用户列表状态
        users: [],
        totalUsers: 0,
        currentPage: 1,
        pageSize: 10,
        isLoading: false,
        error: null,
        searchTerm: '',
        statusFilter: null,
        roleFilter: null,
        userGroupFilter: null,
        emailFilter: '',
        registrationDateStart: null,
        registrationDateEnd: null,
        sortField: 'createdAt',
        sortDirection: 'desc',

        // 多选状态
        selectedUserIds: [],
        isAllSelected: false,

        // 用户组列表状态
        userGroups: [],
        totalUserGroups: 0,
        userGroupsCurrentPage: 1,
        userGroupsPageSize: 10,
        userGroupsIsLoading: false,
        userGroupsError: null,
        userGroupsSearchTerm: '',

        // 当前选中的用户和用户组
        selectedUser: null,
        selectedUserGroup: null,

        // 用户列表操作
        setUsers: (users) => set({ users }),
        setTotalUsers: (totalUsers) => set({ totalUsers }),
        setCurrentPage: (currentPage) => set({ currentPage }),
        setPageSize: (pageSize) => set({ pageSize }),
        setIsLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setSearchTerm: (searchTerm) => set({ searchTerm }),
        setStatusFilter: (statusFilter) => set({ statusFilter }),
        setRoleFilter: (roleFilter) => set({ roleFilter }),
        setUserGroupFilter: (userGroupFilter) => set({ userGroupFilter }),
        setEmailFilter: (emailFilter) => set({ emailFilter }),
        setRegistrationDateRange: (start, end) => set({
          registrationDateStart: start,
          registrationDateEnd: end
        }),
        setSortField: (sortField) => set({ sortField }),
        setSortDirection: (sortDirection) => set({ sortDirection }),

        // 多选操作
        selectUser: (userId) => set((state) => ({
          selectedUserIds: [...state.selectedUserIds, userId]
        })),
        unselectUser: (userId) => set((state) => ({
          selectedUserIds: state.selectedUserIds.filter(id => id !== userId),
          isAllSelected: false
        })),
        toggleSelectUser: (userId) => set((state) => {
          const isSelected = state.selectedUserIds.includes(userId)
          return {
            selectedUserIds: isSelected
              ? state.selectedUserIds.filter(id => id !== userId)
              : [...state.selectedUserIds, userId],
            isAllSelected: isSelected
              ? false
              : state.selectedUserIds.length + 1 === state.users.length
          }
        }),
        selectAllUsers: () => set((state) => ({
          selectedUserIds: state.users.map(user => user.id),
          isAllSelected: true
        })),
        unselectAllUsers: () => set({
          selectedUserIds: [],
          isAllSelected: false
        }),
        toggleSelectAllUsers: () => set((state) => {
          const allSelected = state.isAllSelected
          return {
            selectedUserIds: allSelected ? [] : state.users.map(user => user.id),
            isAllSelected: !allSelected
          }
        }),

        // 用户组列表操作
        setUserGroups: (userGroups) => set({ userGroups }),
        setTotalUserGroups: (totalUserGroups) => set({ totalUserGroups }),
        setUserGroupsCurrentPage: (userGroupsCurrentPage) => set({ userGroupsCurrentPage }),
        setUserGroupsPageSize: (userGroupsPageSize) => set({ userGroupsPageSize }),
        setUserGroupsIsLoading: (userGroupsIsLoading) => set({ userGroupsIsLoading }),
        setUserGroupsError: (userGroupsError) => set({ userGroupsError }),
        setUserGroupsSearchTerm: (userGroupsSearchTerm) => set({ userGroupsSearchTerm }),

        // 选中操作
        setSelectedUser: (selectedUser) => set({ selectedUser }),
        setSelectedUserGroup: (selectedUserGroup) => set({ selectedUserGroup }),

        // 重置状态
        resetUserFilters: () => set({
          searchTerm: '',
          statusFilter: null,
          roleFilter: null,
          userGroupFilter: null,
          emailFilter: '',
          registrationDateStart: null,
          registrationDateEnd: null,
          currentPage: 1,
          sortField: 'createdAt',
          sortDirection: 'desc',
        }),

        resetUserGroupFilters: () => set({
          userGroupsSearchTerm: '',
          userGroupsCurrentPage: 1,
        }),

        resetAll: () => set({
          users: [],
          totalUsers: 0,
          currentPage: 1,
          pageSize: 10,
          isLoading: false,
          error: null,
          searchTerm: '',
          statusFilter: null,
          roleFilter: null,
          userGroupFilter: null,
          emailFilter: '',
          registrationDateStart: null,
          registrationDateEnd: null,
          sortField: 'createdAt',
          sortDirection: 'desc',
          selectedUserIds: [],
          isAllSelected: false,
          userGroups: [],
          totalUserGroups: 0,
          userGroupsCurrentPage: 1,
          userGroupsPageSize: 10,
          userGroupsIsLoading: false,
          userGroupsError: null,
          userGroupsSearchTerm: '',
          selectedUser: null,
          selectedUserGroup: null,
        }),

        // URL参数同步
        syncWithUrl: (params) => {
          const page = params.get('page') ? parseInt(params.get('page')!) : 1
          const limit = params.get('limit') ? parseInt(params.get('limit')!) : 10
          const search = params.get('search') || ''
          const status = params.get('status') || null
          const role = params.get('role') || null
          const userGroup = params.get('userGroup') ? parseInt(params.get('userGroup')!) : null
          const email = params.get('email') || ''
          const dateStart = params.get('dateStart') || null
          const dateEnd = params.get('dateEnd') || null
          const sortField = params.get('sortField') || 'createdAt'
          const sortDirection = (params.get('sortDirection') || 'desc') as 'asc' | 'desc'

          set({
            currentPage: page,
            pageSize: limit,
            searchTerm: search,
            statusFilter: status,
            roleFilter: role,
            userGroupFilter: userGroup,
            emailFilter: email,
            registrationDateStart: dateStart,
            registrationDateEnd: dateEnd,
            sortField,
            sortDirection,
          })
        },

        getQueryParams: () => {
          const state = get()
          const params: Record<string, string> = {
            page: state.currentPage.toString(),
            limit: state.pageSize.toString(),
          }

          if (state.searchTerm) params.search = state.searchTerm
          if (state.statusFilter) params.status = state.statusFilter
          if (state.roleFilter) params.role = state.roleFilter
          if (state.userGroupFilter) params.userGroup = state.userGroupFilter.toString()
          if (state.emailFilter) params.email = state.emailFilter
          if (state.registrationDateStart) params.dateStart = state.registrationDateStart
          if (state.registrationDateEnd) params.dateEnd = state.registrationDateEnd
          if (state.sortField !== 'createdAt') params.sortField = state.sortField
          if (state.sortDirection !== 'desc') params.sortDirection = state.sortDirection

          return params
        },
      }),
      {
        name: 'admin-user-store',
        partialize: (state) => ({
          pageSize: state.pageSize,
          userGroupsPageSize: state.userGroupsPageSize,
          sortField: state.sortField,
          sortDirection: state.sortDirection,
        }),
      }
    ),
    { name: 'admin-user-store' }
  )
)
