import { NextApiRequest, NextApiResponse } from 'next'
import { createCanvas } from 'canvas'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // 创建一个简单的图案作为背景
  const width = 400
  const height = 400
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // 设置背景色
  ctx.fillStyle = '#f0f4f8'
  ctx.fillRect(0, 0, width, height)

  // 绘制简单的图案
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 2

  // 绘制网格
  for (let i = 0; i < width; i += 20) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, height)
    ctx.stroke()
  }

  for (let i = 0; i < height; i += 20) {
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(width, i)
    ctx.stroke()
  }

  // 绘制一些圆形
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const radius = 5 + Math.random() * 15

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(66, 153, 225, 0.1)'
    ctx.fill()
  }

  // 将Canvas转换为PNG图像
  const buffer = canvas.toBuffer('image/png')

  // 设置响应头
  res.setHeader('Content-Type', 'image/png')
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

  // 发送图像
  res.status(200).send(buffer)
}
