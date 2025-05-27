import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始生成社区种子数据...')

  try {
    // 1. 创建用户组
    console.log('📝 创建用户组...')

    const userGroups = [
      {
        name: '游客',
        description: '未注册用户，只能浏览公开内容',
        permissions: JSON.stringify({
          pages: { read: true },
          comments: { read: true },
          media: { read: true }
        })
      },
      {
        name: '注册用户',
        description: '已注册用户，可以发布内容和评论',
        permissions: JSON.stringify({
          pages: { read: true, create: true, update: true },
          comments: { read: true, create: true, update: true },
          media: { read: true, create: true, update: true },
          likes: { create: true, delete: true }
        })
      },
      {
        name: '月费会员',
        description: '月费会员，享受更多权限和功能',
        permissions: JSON.stringify({
          pages: { read: true, create: true, update: true },
          comments: { read: true, create: true, update: true },
          media: { read: true, create: true, update: true },
          likes: { create: true, delete: true },
          downloads: { unlimited: true }
        })
      },
      {
        name: '年费会员',
        description: '年费会员，享受更多权限和优先支持',
        permissions: JSON.stringify({
          pages: { read: true, create: true, update: true },
          comments: { read: true, create: true, update: true },
          media: { read: true, create: true, update: true },
          likes: { create: true, delete: true },
          downloads: { unlimited: true },
          homepage: { featured: true }
        })
      },
      {
        name: '终身会员',
        description: '终身会员，享受所有会员权限',
        permissions: JSON.stringify({
          pages: { read: true, create: true, update: true },
          comments: { read: true, create: true, update: true },
          media: { read: true, create: true, update: true },
          likes: { create: true, delete: true },
          downloads: { unlimited: true },
          homepage: { featured: true, latest: true }
        })
      },
      {
        name: '操作员',
        description: '操作员，可以管理内容和用户',
        permissions: JSON.stringify({
          pages: { read: true, create: true, update: true, delete: true, publish: true },
          comments: { read: true, create: true, update: true, delete: true, moderate: true },
          media: { read: true, create: true, update: true, delete: true },
          users: { read: true, update: true },
          likes: { create: true, delete: true },
          downloads: { unlimited: true },
          homepage: { featured: true, latest: true, archive: true, trending: true }
        })
      },
      {
        name: '管理员',
        description: '管理员，拥有所有权限',
        permissions: JSON.stringify({
          pages: { read: true, create: true, update: true, delete: true, publish: true },
          comments: { read: true, create: true, update: true, delete: true, moderate: true },
          media: { read: true, create: true, update: true, delete: true },
          users: { read: true, create: true, update: true, delete: true },
          userGroups: { read: true, create: true, update: true, delete: true },
          categories: { read: true, create: true, update: true, delete: true },
          tags: { read: true, create: true, update: true, delete: true },
          likes: { create: true, delete: true },
          downloads: { unlimited: true },
          homepage: { featured: true, latest: true, archive: true, trending: true },
          system: { read: true, update: true }
        })
      }
    ]

    for (const group of userGroups) {
      const existingGroup = await prisma.userGroup.findFirst({
        where: { name: group.name }
      })

      if (!existingGroup) {
        await prisma.userGroup.create({
          data: group
        })
        console.log(`✅ 创建用户组: ${group.name}`)
      } else {
        console.log(`⏭️  用户组已存在: ${group.name}`)
      }
    }

    // 2. 创建分类
    console.log('📂 创建分类...')

    const categories = [
      {
        name: '精选推荐',
        slug: 'featured',
        description: '平台推荐的高质量内容',
        order: 1
      },
      {
        name: '近期流出',
        slug: 'latest',
        description: '最新发布的内容',
        order: 2
      },
      {
        name: '往期补档',
        slug: 'archive',
        description: '历史内容或补充资料',
        order: 3
      },
      {
        name: '热门推荐',
        slug: 'trending',
        description: '热门或推荐的内容',
        order: 4
      },
      {
        name: 'Cosplay',
        slug: 'cosplay',
        description: 'Cosplay相关内容',
        order: 5
      },
      {
        name: '写真',
        slug: 'photo',
        description: '写真摄影相关内容',
        order: 6
      },
      {
        name: '视频',
        slug: 'video',
        description: '视频内容',
        order: 7
      },
      {
        name: '图集',
        slug: 'gallery',
        description: '图片集合',
        order: 8
      },
      {
        name: '资源分享',
        slug: 'resources',
        description: '各类资源分享',
        order: 9
      },
      {
        name: '讨论交流',
        slug: 'discussion',
        description: '用户讨论和交流',
        order: 10
      }
    ]

    for (const category of categories) {
      const existingCategory = await prisma.category.findUnique({
        where: { slug: category.slug }
      })

      if (!existingCategory) {
        await prisma.category.create({
          data: category
        })
        console.log(`✅ 创建分类: ${category.name}`)
      } else {
        console.log(`⏭️  分类已存在: ${category.name}`)
      }
    }

    // 3. 创建标签
    console.log('🏷️  创建标签...')

    const tags = [
      { name: '原创', slug: 'original' },
      { name: '转载', slug: 'repost' },
      { name: '高清', slug: 'hd' },
      { name: '4K', slug: '4k' },
      { name: '独家', slug: 'exclusive' },
      { name: '热门', slug: 'hot' },
      { name: '新人', slug: 'newcomer' },
      { name: '知名', slug: 'famous' },
      { name: '日系', slug: 'japanese' },
      { name: '韩系', slug: 'korean' },
      { name: '欧美', slug: 'western' },
      { name: '国产', slug: 'domestic' },
      { name: '动漫', slug: 'anime' },
      { name: '游戏', slug: 'game' },
      { name: '影视', slug: 'movie' },
      { name: '古风', slug: 'ancient' },
      { name: '现代', slug: 'modern' },
      { name: '制服', slug: 'uniform' },
      { name: '泳装', slug: 'swimwear' },
      { name: '私房', slug: 'private' }
    ]

    for (const tag of tags) {
      const existingTag = await prisma.tag.findFirst({
        where: {
          OR: [
            { name: tag.name },
            { slug: tag.slug }
          ]
        }
      })

      if (!existingTag) {
        await prisma.tag.create({
          data: tag
        })
        console.log(`✅ 创建标签: ${tag.name}`)
      } else {
        console.log(`⏭️  标签已存在: ${tag.name}`)
      }
    }

    // 4. 创建管理员用户（如果不存在）
    console.log('👤 创建管理员用户...')

    const adminGroup = await prisma.userGroup.findFirst({
      where: { name: '管理员' }
    })

    if (adminGroup) {
      const existingAdmin = await prisma.user.findUnique({
        where: { email: 'admin@tu105.com' }
      })

      if (!existingAdmin) {
        await prisma.user.create({
          data: {
            name: '系统管理员',
            email: 'admin@tu105.com',
            role: 'ADMIN',
            status: 'ACTIVE',
            userGroupId: adminGroup.id
          }
        })
        console.log('✅ 创建管理员用户: admin@tu105.com')
      } else {
        console.log('⏭️  管理员用户已存在')
      }
    }

    // 5. 创建示例内容
    console.log('📄 创建示例内容...')

    const featuredCategory = await prisma.category.findUnique({
      where: { slug: 'featured' }
    })

    const latestCategory = await prisma.category.findUnique({
      where: { slug: 'latest' }
    })

    const cosplayCategory = await prisma.category.findUnique({
      where: { slug: 'cosplay' }
    })

    const admin = await prisma.user.findUnique({
      where: { email: 'admin@tu105.com' }
    })

    if (admin && featuredCategory && latestCategory && cosplayCategory) {
      const sampleContents = [
        {
          title: '欢迎来到兔图社区！',
          content: `<h2>欢迎来到兔图社区！</h2>
<p>这里是一个专注于Cosplay和写真资源分享的社区平台。</p>
<h3>社区特色：</h3>
<ul>
<li>🎭 高质量的Cosplay作品分享</li>
<li>📸 精美的写真摄影作品</li>
<li>🤝 友好的交流讨论环境</li>
<li>⚡ 快速的资源下载体验</li>
</ul>
<p>希望大家在这里能够找到喜欢的内容，也欢迎分享自己的作品！</p>`,
          excerpt: '欢迎来到兔图社区！这里是一个专注于Cosplay和写真资源分享的社区平台。',
          status: 'PUBLISHED',
          featured: true,
          categoryId: featuredCategory.id,
          userId: admin.id,
          publishedAt: new Date()
        },
        {
          title: '社区使用指南',
          content: `<h2>社区使用指南</h2>
<h3>如何发布内容：</h3>
<ol>
<li>点击"发布新内容"按钮</li>
<li>选择合适的分类和标签</li>
<li>上传相关的图片或视频</li>
<li>填写详细的描述信息</li>
<li>提交审核或直接发布</li>
</ol>
<h3>社区规则：</h3>
<ul>
<li>🚫 禁止发布违法违规内容</li>
<li>🤝 尊重他人，文明交流</li>
<li>📝 原创内容请标明来源</li>
<li>💎 鼓励分享高质量内容</li>
</ul>`,
          excerpt: '详细的社区使用指南，帮助新用户快速上手。',
          status: 'PUBLISHED',
          featured: false,
          categoryId: latestCategory.id,
          userId: admin.id,
          publishedAt: new Date()
        },
        {
          title: '精选Cosplay作品推荐',
          content: `<h2>精选Cosplay作品推荐</h2>
<p>为大家推荐一些优秀的Cosplay作品：</p>
<h3>本周精选：</h3>
<ul>
<li>🌟 原神角色Cosplay合集</li>
<li>🌟 经典动漫角色还原</li>
<li>🌟 游戏角色精美演绎</li>
</ul>
<p>这些作品在服装制作、妆容设计、摄影技巧等方面都有很高的水准，值得大家学习和欣赏。</p>`,
          excerpt: '为大家推荐一些优秀的Cosplay作品，包含原神、经典动漫等热门角色。',
          status: 'PUBLISHED',
          featured: true,
          categoryId: cosplayCategory.id,
          userId: admin.id,
          publishedAt: new Date()
        }
      ]

      for (const content of sampleContents) {
        const existingContent = await prisma.page.findFirst({
          where: { title: content.title }
        })

        if (!existingContent) {
          await prisma.page.create({
            data: content
          })
          console.log(`✅ 创建示例内容: ${content.title}`)
        } else {
          console.log(`⏭️  示例内容已存在: ${content.title}`)
        }
      }
    }

    console.log('🎉 社区种子数据生成完成！')

  } catch (error) {
    console.error('❌ 生成种子数据时出错:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
