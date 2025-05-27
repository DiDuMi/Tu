import { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '@/lib/middleware'
import { withErrorHandler } from '@/lib/error-handler'
import { successResponse, errorResponse } from '@/lib/api-response'
import { uploadQueue } from '@/lib/upload-queue'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

  // 检查权限：只能查看自己的任务
  if (task.userId !== user.id) {
    return errorResponse(res, 'FORBIDDEN', '无权访问此任务', undefined, 403)
  }

  // 计算预估剩余时间
  let estimatedTime: number | undefined
  if (task.status === 'processing' && task.progress > 0) {
    const elapsed = Date.now() - task.startTime
    const totalEstimated = (elapsed / task.progress) * 100
    estimatedTime = Math.max(0, totalEstimated - elapsed)
  }

  const response = {
    taskId: task.id,
    status: task.status,
    progress: task.progress,
    stage: task.stage,
    filename: task.filename,
    fileSize: task.fileSize,
    startTime: task.startTime,
    endTime: task.endTime,
    estimatedTime,
    error: task.error,
    result: task.result
  }

  return successResponse(res, response)
}

export default withErrorHandler(withAuth(handler))
