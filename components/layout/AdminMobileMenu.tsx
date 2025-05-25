import Link from 'next/link'
import { Session } from 'next-auth'
import { useUIStore } from '@/stores/uiStore'
import AdminNavLinks from './AdminNavLinks'

interface AdminMobileMenuProps {
  session: Session
  isOpen: boolean
  onSignOut: () => void
}

export default function AdminMobileMenu({ session, isOpen, onSignOut }: AdminMobileMenuProps) {
  const { setSidebarOpen } = useUIStore()
  
  if (!isOpen) {
    return null
  }
  
  return (
    <div className="sm:hidden bg-white">
      <AdminNavLinks 
        session={session} 
        mobile={true} 
        onClick={() => setSidebarOpen(false)} 
      />
      
      <div className="pt-4 pb-3 border-t border-gray-200">
        <div className="flex items-center px-4">
          <div className="flex-shrink-0">
            <img
              className="h-10 w-10 rounded-full"
              src={session.user.image || 'https://via.placeholder.com/40'}
              alt={session.user.name || '用户头像'}
            />
          </div>
          <div className="ml-3">
            <div className="text-base font-medium text-gray-800">
              {session.user.name}
            </div>
            <div className="text-sm font-medium text-gray-500">
              {session.user.email}
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <Link
            href="/"
            className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
          >
            返回前台
          </Link>
          <button
            onClick={() => {
              setSidebarOpen(false)
              onSignOut()
            }}
            className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          >
            退出
          </button>
        </div>
      </div>
    </div>
  )
}
