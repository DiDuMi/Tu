import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import React, { useState } from 'react'

import AdminLayout from '@/components/layout/AdminLayout'
import { MediaDetail } from '@/components/media'
import { formatMediaInfo } from '@/lib/media'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { MediaResponse } from '@/types/api'

interface MediaDetailPageProps {
  media: MediaResponse
}

export const getServerSideProps: GetServerSideProps<MediaDetailPageProps> = async (context) => {
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

  // 获取媒体ID
  const { id } = context.params || {}

  if (!id || Array.isArray(id)) {
    return {
      notFound: true,
    }
  }

  // 查询媒体
  const media = await prisma.media.findUnique({
    where: { uuid: id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      category: true,
      mediaTags: true,
      versions: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: {
          versionNumber: 'desc'
        }
      }
    },
  })

  if (!media) {
    return {
      notFound: true,
    }
  }

  // 检查权限（非管理员只能查看自己的媒体）
  const isAdmin = ['ADMIN', 'OPERATOR'].includes(userRole)
  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
    select: { id: true },
  })

  if (!isAdmin && media.userId !== user?.id) {
    return {
      redirect: {
        destination: '/admin/media',
        permanent: false,
      },
    }
  }

  return {
    props: {
      session,
      media: formatMediaInfo(media),
    },
  }
}

const MediaDetailPage: React.FC<MediaDetailPageProps> = ({ media }) => {
  const [currentMedia, setCurrentMedia] = useState<MediaResponse>(media)

  // 处理媒体更新
  const handleMediaUpdate = (updatedMedia: MediaResponse) => {
    setCurrentMedia(updatedMedia)
  }

  return (
    <AdminLayout>
      <Head>
        <title>{currentMedia.title || '媒体详情'} - 兔图管理后台</title>
      </Head>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">媒体详情</h1>
            <p className="mt-1 text-sm text-gray-500">
              查看和管理媒体资源
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/admin/media"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              返回媒体列表
            </Link>
          </div>
        </div>

        <MediaDetail media={currentMedia} onUpdate={handleMediaUpdate} />
      </div>
    </AdminLayout>
  )
}

export default MediaDetailPage
