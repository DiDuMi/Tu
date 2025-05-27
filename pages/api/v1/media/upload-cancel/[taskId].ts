import { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '@/lib/middleware'
import { withErrorHandler } from '@/lib/error-handler'
import { successResponse, errorResponse } from '@/lib/api-response'
import { uploadQueue } from '@/lib/upload-queue'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 'METHOD_NOT_ALLOWED', '不支持的请求方法', undefined, 405)
  }

  const { taskId } = req.query
  const user = (req as any).user

  if (!taskId || typeof taskId !== 'string') {
    return errorResponse(res, 'INVALID_TASK_ID', '无效的任务ID', undefined, 400)
  }

  // 获取任务信息
  const task = uploadQueue.getTask(taskId)

  if (!task) {
    return errorResponse(res, 'TASK_NOT_FOUND', '任务不存在', undefined, 404)
  }

  // 检查权限：只能取消自己的任务
  if (task.userId !== user.id) {
    return errorResponse(res, 'FORBIDDEN', '无权取消此任务', undefined, 403)
  }

  // 检查任务状态
  if (task.status === 'completed') {
    return errorResponse(res, 'TASK_COMPLETED', '任务已完成，无法取消', undefined, 400)
  }

  if (task.status === 'failed') {
    return errorResponse(res, 'TASK_FAILED', '任务已失败', undefined, 400)
  }

  // 取消任务
  uploadQueue.cancelTask(taskId)

  return successResponse(res, { taskId, status: 'cancelled' }, '任务已取消')
}

export default withErrorHandler(withAuth(handler))
