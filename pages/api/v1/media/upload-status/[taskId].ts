import { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '@/lib/middleware'
import { uploadQueue } from '@/lib/upload-queue'
import { successResponse, errorResponse } from '@/lib/api'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return errorResponse(res, 'METHOD_NOT_ALLOWED', '不支持的请求方法', undefined, 405)
  }

  const { taskId } = req.query
  const session = (req as any).session

  if (!taskId || typeof taskId !== 'string') {
    return errorResponse(res, 'INVALID_TASK_ID', '无效的任务ID', undefined, 400)
  }

  if (!session || !session.user) {
    return errorResponse(res, 'UNAUTHORIZED', '未授权访问', undefined, 401)
  }

  // 检查任务是否存在且属于当前用户
  const task = uploadQueue.getTask(taskId)
  if (!task) {
    return errorResponse(res, 'TASK_NOT_FOUND', '任务不存在', undefined, 404)
  }

  if (task.userId !== session.user.id) {
    return errorResponse(res, 'TASK_ACCESS_DENIED', '无权访问此任务', undefined, 403)
  }

  // 返回任务状态
  const taskData = {
    taskId: task.id,
    status: task.status,
    progress: task.progress,
    stage: task.stage,
    filename: task.filename,
    startTime: task.startTime,
    endTime: task.endTime,
    error: task.error,
    result: task.result
  }

  return successResponse(res, taskData, '获取任务状态成功')
}

export default withAuth(handler)
