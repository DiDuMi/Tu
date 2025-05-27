import { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '@/lib/middleware'
import { uploadQueue } from '@/lib/upload-queue'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { taskId } = req.query
  const session = (req as any).session

  if (!taskId || typeof taskId !== 'string') {
    res.status(400).json({ error: 'Invalid task ID' })
    return
  }

  if (!session || !session.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  // 检查任务是否存在且属于当前用户
  const task = uploadQueue.getTask(taskId)
  if (!task || task.userId !== session.user.id) {
    res.status(404).json({ error: 'Task not found' })
    return
  }

  // 设置SSE响应头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  })

  // 发送初始状态
  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  // 发送当前任务状态
  sendEvent({
    type: 'status',
    taskId: task.id,
    status: task.status,
    progress: task.progress,
    stage: task.stage,
    filename: task.filename
  })

  // 监听进度更新
  const progressHandler = (progressData: any) => {
    sendEvent({
      type: 'progress',
      ...progressData
    })
  }

  const completedHandler = (data: any) => {
    sendEvent({
      type: 'completed',
      ...data
    })
    cleanup()
  }

  const failedHandler = (data: any) => {
    sendEvent({
      type: 'failed',
      ...data
    })
    cleanup()
  }

  // 注册事件监听器
  uploadQueue.on(`progress:${taskId}`, progressHandler)
  uploadQueue.on(`completed:${taskId}`, completedHandler)
  uploadQueue.on(`failed:${taskId}`, failedHandler)

  // 清理函数
  const cleanup = () => {
    uploadQueue.removeListener(`progress:${taskId}`, progressHandler)
    uploadQueue.removeListener(`completed:${taskId}`, completedHandler)
    uploadQueue.removeListener(`failed:${taskId}`, failedHandler)
    res.end()
  }

  // 客户端断开连接时清理
  req.on('close', cleanup)
  req.on('aborted', cleanup)

  // 发送心跳包
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 30000)

  // 清理心跳包
  req.on('close', () => {
    clearInterval(heartbeat)
  })
}

export default withAuth(handler)
