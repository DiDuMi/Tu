import { EventEmitter } from 'events'

export interface UploadTask {
  id: string
  userId: number
  filename: string
  fileSize: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  stage: 'upload' | 'processing' | 'saving' | 'completed'
  startTime: number
  endTime?: number
  error?: string
  result?: any
}

export interface UploadProgress {
  taskId: string
  progress: number
  stage: string
  message: string
  estimatedTime?: number
}

class UploadQueue extends EventEmitter {
  private tasks: Map<string, UploadTask> = new Map()
  private activeUploads: Set<string> = new Set()
  private maxConcurrentUploads = 3

  // 创建新的上传任务
  createTask(userId: number, filename: string, fileSize: number): string {
    const taskId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const task: UploadTask = {
      id: taskId,
      userId,
      filename,
      fileSize,
      status: 'pending',
      progress: 0,
      stage: 'upload',
      startTime: Date.now()
    }

    this.tasks.set(taskId, task)
    console.log(`📋 创建上传任务: ${taskId} - ${filename}`)

    return taskId
  }

  // 更新任务进度
  updateProgress(taskId: string, progress: number, stage: string, message: string, estimatedTime?: number) {
    const task = this.tasks.get(taskId)
    if (!task) return

    task.progress = progress
    task.stage = stage as any

    // 根据阶段更新状态
    if (stage === 'upload' && progress < 100) {
      task.status = 'uploading'
    } else if (stage === 'processing') {
      task.status = 'processing'
    } else if (stage === 'completed') {
      task.status = 'completed'
      task.endTime = Date.now()
    }

    const progressData: UploadProgress = {
      taskId,
      progress,
      stage,
      message,
      estimatedTime
    }

    console.log(`📊 任务进度更新: ${taskId} - ${stage} ${progress}% - ${message}`)

    // 发送进度事件
    this.emit('progress', progressData)
    this.emit(`progress:${taskId}`, progressData)
  }

  // 标记任务完成
  completeTask(taskId: string, result: any) {
    const task = this.tasks.get(taskId)
    if (!task) return

    task.status = 'completed'
    task.progress = 100
    task.stage = 'completed'
    task.endTime = Date.now()
    task.result = result

    this.activeUploads.delete(taskId)

    console.log(`✅ 任务完成: ${taskId} - 耗时: ${((task.endTime - task.startTime) / 1000).toFixed(1)}秒`)

    this.emit('completed', { taskId, result })
    this.emit(`completed:${taskId}`, { taskId, result })
  }

  // 标记任务失败
  failTask(taskId: string, error: string) {
    const task = this.tasks.get(taskId)
    if (!task) return

    task.status = 'failed'
    task.endTime = Date.now()
    task.error = error

    this.activeUploads.delete(taskId)

    console.log(`❌ 任务失败: ${taskId} - ${error}`)

    this.emit('failed', { taskId, error })
    this.emit(`failed:${taskId}`, { taskId, error })
  }

  // 取消任务
  cancelTask(taskId: string) {
    const task = this.tasks.get(taskId)
    if (!task) return

    task.status = 'failed'
    task.endTime = Date.now()
    task.error = '用户取消'

    this.activeUploads.delete(taskId)

    console.log(`🚫 任务取消: ${taskId}`)

    this.emit('cancelled', { taskId })
    this.emit(`cancelled:${taskId}`, { taskId })
  }

  // 获取任务状态
  getTask(taskId: string): UploadTask | undefined {
    return this.tasks.get(taskId)
  }

  // 获取用户的所有任务
  getUserTasks(userId: number): UploadTask[] {
    return Array.from(this.tasks.values()).filter(task => task.userId === userId)
  }

  // 清理旧任务（保留最近24小时的任务）
  cleanupOldTasks() {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000

    for (const [taskId, task] of this.tasks.entries()) {
      if (task.startTime < oneDayAgo && (task.status === 'completed' || task.status === 'failed')) {
        this.tasks.delete(taskId)
        console.log(`🧹 清理旧任务: ${taskId}`)
      }
    }
  }

  // 获取活跃上传数量
  getActiveUploadCount(): number {
    return this.activeUploads.size
  }

  // 检查是否可以开始新的上传
  canStartNewUpload(): boolean {
    return this.activeUploads.size < this.maxConcurrentUploads
  }

  // 开始上传
  startUpload(taskId: string) {
    this.activeUploads.add(taskId)
    this.updateProgress(taskId, 0, 'upload', '开始上传文件...')
  }
}

// 全局上传队列实例
export const uploadQueue = new UploadQueue()

// 定期清理旧任务
setInterval(() => {
  uploadQueue.cleanupOldTasks()
}, 60 * 60 * 1000) // 每小时清理一次
