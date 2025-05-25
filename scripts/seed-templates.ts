import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始创建示例模板数据...')

  // 获取第一个用户
  const user = await prisma.user.findFirst()
  if (!user) {
    console.log('没有找到用户，请先创建用户')
    return
  }

  // 获取一些标签
  const tags = await prisma.tag.findMany({ take: 5 })
  if (tags.length === 0) {
    console.log('没有找到标签，请先创建标签')
    return
  }

  // 创建示例模板
  const templates = [
    {
      title: '文章开头模板',
      content: `<h2>欢迎阅读</h2>
<p>感谢您关注我们的内容。在这篇文章中，我们将为您详细介绍...</p>
<blockquote>
<p>💡 <strong>提示：</strong>本文内容仅供参考，具体情况请以实际为准。</p>
</blockquote>`,
      type: 'HEADER',
      description: '适用于文章开头的通用模板',
      isPublic: true,
      sortOrder: 0,
      userId: user.id,
      tagIds: [tags[0]?.id, tags[1]?.id].filter(Boolean)
    },
    {
      title: '文章结尾模板',
      content: `<hr>
<h3>总结</h3>
<p>通过本文的介绍，相信您已经对相关内容有了更深入的了解。</p>
<p><strong>如果您觉得这篇文章对您有帮助，请不要忘记：</strong></p>
<ul>
<li>👍 点赞支持</li>
<li>💬 留言讨论</li>
<li>📤 分享给朋友</li>
</ul>
<p>我们会持续为您带来更多优质内容，敬请期待！</p>`,
      type: 'FOOTER',
      description: '适用于文章结尾的通用模板',
      isPublic: true,
      sortOrder: 1,
      userId: user.id,
      tagIds: [tags[0]?.id].filter(Boolean)
    },
    {
      title: '游戏攻略模板',
      content: `<h2>🎮 游戏攻略</h2>
<div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #0ea5e9; margin: 10px 0;">
<p><strong>难度等级：</strong> ⭐⭐⭐</p>
<p><strong>预计时间：</strong> 30分钟</p>
<p><strong>所需道具：</strong> 待补充</p>
</div>
<h3>📋 攻略步骤</h3>
<ol>
<li><strong>准备阶段：</strong>确保您已经...</li>
<li><strong>执行阶段：</strong>按照以下步骤...</li>
<li><strong>完成阶段：</strong>检查是否...</li>
</ol>
<h3>⚠️ 注意事项</h3>
<ul>
<li>请注意保存进度</li>
<li>建议在安全区域操作</li>
</ul>`,
      type: 'GENERAL',
      description: '游戏攻略专用模板，包含难度、时间、步骤等信息',
      isPublic: false,
      sortOrder: 2,
      userId: user.id,
      tagIds: [tags[1]?.id, tags[2]?.id].filter(Boolean)
    },
    {
      title: '产品评测模板',
      content: `<h2>📱 产品评测</h2>
<table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
<thead>
<tr style="background-color: #f8fafc;">
<th style="border: 1px solid #e2e8f0; padding: 10px; text-align: left;">评测项目</th>
<th style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">评分</th>
<th style="border: 1px solid #e2e8f0; padding: 10px; text-align: left;">说明</th>
</tr>
</thead>
<tbody>
<tr>
<td style="border: 1px solid #e2e8f0; padding: 10px;">外观设计</td>
<td style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">⭐⭐⭐⭐⭐</td>
<td style="border: 1px solid #e2e8f0; padding: 10px;">待评价</td>
</tr>
<tr>
<td style="border: 1px solid #e2e8f0; padding: 10px;">性能表现</td>
<td style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">⭐⭐⭐⭐</td>
<td style="border: 1px solid #e2e8f0; padding: 10px;">待评价</td>
</tr>
<tr>
<td style="border: 1px solid #e2e8f0; padding: 10px;">性价比</td>
<td style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">⭐⭐⭐</td>
<td style="border: 1px solid #e2e8f0; padding: 10px;">待评价</td>
</tr>
</tbody>
</table>
<h3>💰 价格信息</h3>
<p><strong>官方售价：</strong> ¥待补充</p>
<p><strong>推荐指数：</strong> ⭐⭐⭐⭐ (4/5)</p>`,
      type: 'GENERAL',
      description: '产品评测专用模板，包含评分表格和价格信息',
      isPublic: true,
      sortOrder: 3,
      userId: user.id,
      tagIds: [tags[2]?.id, tags[3]?.id].filter(Boolean)
    },
    {
      title: '教程说明模板',
      content: `<h2>📚 教程说明</h2>
<div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
<p><strong>⚡ 快速导航</strong></p>
<ul>
<li><a href="#preparation">准备工作</a></li>
<li><a href="#steps">详细步骤</a></li>
<li><a href="#troubleshooting">常见问题</a></li>
</ul>
</div>
<h3 id="preparation">🛠️ 准备工作</h3>
<p>在开始之前，请确保您已经：</p>
<ul>
<li>✅ 准备好必要的工具</li>
<li>✅ 了解基本概念</li>
<li>✅ 备份重要数据</li>
</ul>
<h3 id="steps">📝 详细步骤</h3>
<p>请按照以下步骤操作：</p>
<h3 id="troubleshooting">❓ 常见问题</h3>
<details>
<summary><strong>问题1：如果遇到错误怎么办？</strong></summary>
<p>解决方案：请检查...</p>
</details>`,
      type: 'GENERAL',
      description: '教程说明专用模板，包含导航、步骤和FAQ',
      isPublic: true,
      sortOrder: 4,
      userId: user.id,
      tagIds: [tags[3]?.id, tags[4]?.id].filter(Boolean)
    }
  ]

  // 创建模板
  for (const templateData of templates) {
    const { tagIds, ...templateInfo } = templateData
    
    const template = await prisma.contentTemplate.create({
      data: {
        ...templateInfo,
        templateTags: {
          create: tagIds.map(tagId => ({ tagId }))
        }
      }
    })

    console.log(`✅ 创建模板: ${template.title}`)
  }

  console.log('✨ 示例模板数据创建完成！')
}

main()
  .catch((e) => {
    console.error('❌ 创建示例数据时出错:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
