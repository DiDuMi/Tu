import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import React from 'react'

import AdminLayout from '@/components/layout/AdminLayout'
import { MediaList, MediaFilter } from '@/components/media'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/media',
        permanent: false,
      },
    }
  }

  // 检查用户角色
  const userRole = session.user.role as string
  if (!['ADMIN', 'OPERATOR', 'MEMBER', 'ANNUAL_MEMBER'].includes(userRole)) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  return {
    props: {
      session,
    },
  }
}

const MediaListPage: React.FC = () => {
  return (
    <AdminLayout>
      <Head>
        <title>媒体管理 - 兔图管理后台</title>
      </Head>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">媒体管理</h1>
            <p className="mt-1 text-sm text-gray-500">
              管理您的图片、视频和云媒体资源
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/admin/media/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              上传媒体
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <MediaFilter />
          <MediaList />
        </div>
      </div>
    </AdminLayout>
  )
}

export default MediaListPage
