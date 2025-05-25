import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import React, { useState } from 'react'

import AdminLayout from '@/components/layout/AdminLayout'
import { MediaUploader } from '@/components/media'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { MediaUploadResponse } from '@/types/api'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/media/upload',
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

const MediaUploadPage: React.FC = () => {
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResponse[]>([])
  const [uploadSuccess, setUploadSuccess] = useState(false)

  // 处理上传成功
  const handleUploadSuccess = (media: MediaUploadResponse[]) => {
    setUploadedMedia(media)
    setUploadSuccess(true)
  }

  return (
    <AdminLayout>
      <Head>
        <title>上传媒体 - 兔图管理后台</title>
      </Head>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">上传媒体</h1>
            <p className="mt-1 text-sm text-gray-500">
              上传图片、视频或添加云媒体链接
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

        <div className="bg-white rounded-lg shadow-sm p-6">
          {uploadSuccess ? (
            <div className="space-y-6">
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      上传成功！共上传了 {uploadedMedia.length} 个媒体文件。
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="text-lg font-medium text-gray-900">上传结果</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {uploadedMedia.map((media) => (
                  <div key={media.uuid} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                      {media.type === 'IMAGE' ? (
                        <Image
                          src={media.url}
                          alt={media.title || '图片'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{media.title}</h3>
                      <div className="mt-2 flex justify-between">
                        <Link
                          href={`/admin/media/${media.uuid}`}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          查看详情
                        </Link>
                        <span className="text-xs text-gray-500">
                          {media.type === 'IMAGE' ? '图片' : '视频'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setUploadedMedia([])
                    setUploadSuccess(false)
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  继续上传
                </button>
                <Link
                  href="/admin/media"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  返回媒体列表
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-5">
                <h2 className="text-lg font-medium text-gray-900">上传媒体文件</h2>
                <p className="mt-1 text-sm text-gray-500">
                  支持的文件类型: 图片(JPG, PNG, GIF, WebP), 视频(MP4, WebM, OGG)
                </p>
              </div>

              <MediaUploader
                onSuccess={handleUploadSuccess}
                maxFiles={10}
                maxSize={20 * 1024 * 1024} // 20MB
              />

              <div className="border-t border-gray-200 pt-5">
                <h3 className="text-sm font-medium text-gray-700">上传提示</h3>
                <ul className="mt-2 text-sm text-gray-500 list-disc pl-5 space-y-1">
                  <li>图片将自动压缩和优化，以提高加载速度</li>
                  <li>上传后可以编辑媒体的标题和描述</li>
                  <li>上传的媒体可以在内容编辑器中使用</li>
                  <li>请确保您拥有上传内容的版权或使用权</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default MediaUploadPage
