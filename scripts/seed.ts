import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  try {
    // 清理现有数据 - 按照外键依赖顺序删除
    await prisma.pointPurchase.deleteMany()
    await prisma.pointProduct.deleteMany()
    await prisma.pointTransaction.deleteMany()
    await prisma.userPoint.deleteMany()
    await prisma.signInRecord.deleteMany()
    await prisma.like.deleteMany()
    await prisma.favorite.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.pageTag.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.pageVersion.deleteMany()
    await prisma.reviewFeedback.deleteMany()
    await prisma.page.deleteMany()
    await prisma.category.deleteMany()
    await prisma.mediaVersion.deleteMany()
    await prisma.media.deleteMany()
    await prisma.socialAccount.deleteMany()
    await prisma.contentTemplate.deleteMany()
    await prisma.user.deleteMany()
    await prisma.userGroup.deleteMany()

    console.log('🧹 清理数据完成')

    // 创建用户组
    const adminGroup = await prisma.userGroup.create({
      data: {
        name: '管理员组',
        description: '拥有所有权限的管理员组',
        permissions: JSON.stringify({
          users: ['create', 'read', 'update', 'delete'],
          pages: ['create', 'read', 'update', 'delete'],
          media: ['create', 'read', 'update', 'delete'],
          settings: ['read', 'update'],
        }),
        uploadLimits: JSON.stringify({
          maxFileSize: 104857600, // 100MB
          allowedTypes: ['image/*', 'video/*', 'application/pdf'],
        }),
      },
    })

    const memberGroup = await prisma.userGroup.create({
      data: {
        name: '普通会员组',
        description: '普通会员权限组',
        permissions: JSON.stringify({
          users: ['read'],
          pages: ['create', 'read', 'update'],
          media: ['create', 'read', 'update'],
          settings: ['read'],
        }),
        uploadLimits: JSON.stringify({
          maxFileSize: 10485760, // 10MB
          allowedTypes: ['image/*', 'video/*'],
        }),
      },
    })

    console.log('👥 用户组创建完成')

    // 创建管理员用户
    const adminPassword = await hash('admin123', 10)
    const admin = await prisma.user.create({
      data: {
        name: '管理员',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        userGroupId: adminGroup.id,
      },
    })

    // 创建普通用户
    const userPassword = await hash('user123', 10)
    const user = await prisma.user.create({
      data: {
        name: '测试用户',
        email: 'user@example.com',
        password: userPassword,
        role: 'MEMBER',
        status: 'ACTIVE',
        userGroupId: memberGroup.id,
      },
    })

    console.log('👤 用户创建完成')

    // 创建用户积分
    await prisma.userPoint.create({
      data: {
        userId: admin.id,
        balance: 1000,
        totalEarned: 1000,
      },
    })

    await prisma.userPoint.create({
      data: {
        userId: user.id,
        balance: 500,
        totalEarned: 500,
      },
    })

    console.log('💰 用户积分创建完成')

    // 创建分类
    const featuredCategory = await prisma.category.create({
      data: {
        name: '精选内容',
        slug: 'featured',
        description: '首页精选内容分类',
        order: 1,
      },
    })

    const latestCategory = await prisma.category.create({
      data: {
        name: '近期流出',
        slug: 'latest',
        description: '最新发布的内容',
        order: 2,
      },
    })

    const archiveCategory = await prisma.category.create({
      data: {
        name: '往期补档',
        slug: 'archive',
        description: '历史内容补档',
        order: 3,
      },
    })

    const trendingCategory = await prisma.category.create({
      data: {
        name: '热门推荐',
        slug: 'trending',
        description: '热门推荐内容',
        order: 4,
      },
    })

    const announcementCategory = await prisma.category.create({
      data: {
        name: '公告',
        slug: 'announcements',
        description: '系统公告和通知',
        order: 5,
      },
    })

    const tutorialCategory = await prisma.category.create({
      data: {
        name: '教程',
        slug: 'tutorials',
        description: '使用教程和指南',
        order: 6,
      },
    })

    const guideCategory = await prisma.category.create({
      data: {
        name: '说明文档',
        slug: 'guides',
        description: '详细的功能说明和帮助文档',
        order: 7,
      },
    })

    console.log('📂 分类创建完成')

    // 创建标签
    const tags = await Promise.all([
      prisma.tag.create({
        data: {
          name: '技术',
          slug: 'technology',
        },
      }),
      prisma.tag.create({
        data: {
          name: '设计',
          slug: 'design',
        },
      }),
      prisma.tag.create({
        data: {
          name: '教程',
          slug: 'tutorial',
        },
      }),
    ])

    console.log('🏷️ 标签创建完成')

    // 创建页面
    const page1 = await prisma.page.create({
      data: {
        title: '欢迎使用兔图内容管理平台',
        content: '<h1>欢迎使用兔图内容管理平台</h1><p>这是一个功能强大的内容管理平台，为您提供完整的内容创作、管理和发布解决方案。</p><h2>主要功能</h2><ul><li>内容创作和编辑</li><li>媒体文件管理</li><li>用户权限管理</li><li>积分系统</li></ul>',
        excerpt: '欢迎使用兔图内容管理平台，这是一个功能强大的内容管理解决方案。',
        status: 'PUBLISHED',
        featured: true,
        categoryId: featuredCategory.id,
        userId: admin.id,
        publishedAt: new Date(),
      },
    })

    const page2 = await prisma.page.create({
      data: {
        title: '如何使用兔图平台创建内容',
        content: '<h1>如何使用兔图平台创建内容</h1><p>本教程将指导您如何使用兔图平台创建、编辑和发布内容。</p><h2>步骤说明</h2><ol><li>登录您的账户</li><li>点击"创建内容"按钮</li><li>填写标题和内容</li><li>选择合适的分类和标签</li><li>预览并发布</li></ol>',
        excerpt: '详细的内容创建教程，帮助您快速上手兔图平台。',
        status: 'PUBLISHED',
        categoryId: tutorialCategory.id,
        userId: admin.id,
        publishedAt: new Date(),
      },
    })

    const _page3 = await prisma.page.create({
      data: {
        title: '平台使用指南',
        content: '<h1>平台使用指南</h1><p>这里是详细的平台使用说明文档。</p><h2>基本操作</h2><p>了解平台的基本操作方法。</p><h2>高级功能</h2><p>探索平台的高级功能特性。</p>',
        excerpt: '完整的平台使用指南和说明文档。',
        status: 'PUBLISHED',
        categoryId: guideCategory.id,
        userId: admin.id,
        publishedAt: new Date(),
      },
    })

    const _page4 = await prisma.page.create({
      data: {
        title: '系统更新公告',
        content: '<h1>系统更新公告</h1><p>我们很高兴地宣布平台的最新更新。</p><h2>新功能</h2><ul><li>改进的用户界面</li><li>更快的加载速度</li><li>新的搜索功能</li></ul>',
        excerpt: '最新的系统更新和功能改进公告。',
        status: 'PUBLISHED',
        categoryId: announcementCategory.id,
        userId: admin.id,
        publishedAt: new Date(),
      },
    })

    const page5 = await prisma.page.create({
      data: {
        title: '最新技术分享',
        content: '<h1>最新技术分享</h1><p>分享最新的技术趋势和开发经验。</p><h2>技术要点</h2><p>介绍当前热门的技术栈和最佳实践。</p>',
        excerpt: '最新的技术分享和开发经验总结。',
        status: 'PUBLISHED',
        categoryId: latestCategory.id,
        userId: user.id,
        publishedAt: new Date(),
        viewCount: 150,
        likeCount: 25,
      },
    })

    const page6 = await prisma.page.create({
      data: {
        title: '经典内容回顾',
        content: '<h1>经典内容回顾</h1><p>回顾平台上的经典内容和精彩时刻。</p><h2>精选回顾</h2><p>这些内容代表了我们平台的精华。</p>',
        excerpt: '回顾平台历史上的经典内容和精彩时刻。',
        status: 'PUBLISHED',
        categoryId: archiveCategory.id,
        userId: admin.id,
        publishedAt: new Date(),
        viewCount: 300,
        likeCount: 45,
      },
    })

    const page7 = await prisma.page.create({
      data: {
        title: '热门话题讨论',
        content: '<h1>热门话题讨论</h1><p>当前最受关注的话题和讨论。</p><h2>热点分析</h2><p>深入分析当前的热门话题。</p>',
        excerpt: '当前最受关注的热门话题和深度讨论。',
        status: 'PUBLISHED',
        categoryId: trendingCategory.id,
        userId: user.id,
        publishedAt: new Date(),
        viewCount: 500,
        likeCount: 80,
      },
    })

    console.log('📄 页面创建完成')

    // 关联页面和标签
    await prisma.pageTag.createMany({
      data: [
        { pageId: page1.id, tagId: tags[0].id }, // 技术
        { pageId: page2.id, tagId: tags[2].id }, // 教程
        { pageId: page5.id, tagId: tags[0].id }, // 技术
        { pageId: page5.id, tagId: tags[1].id }, // 设计
        { pageId: page7.id, tagId: tags[0].id }, // 技术
      ],
    })

    console.log('🔗 页面标签关联完成')

    // 创建评论
    await prisma.comment.createMany({
      data: [
        {
          content: '这是一个很棒的平台！功能很全面。',
          pageId: page1.id,
          userId: user.id,
        },
        {
          content: '教程很详细，对新手很友好。',
          pageId: page2.id,
          userId: user.id,
        },
        {
          content: '感谢分享，学到了很多。',
          pageId: page5.id,
          userId: user.id,
        },
        {
          content: '这个话题很有意思，期待更多讨论。',
          pageId: page7.id,
          userId: admin.id,
        },
      ],
    })

    console.log('💬 评论创建完成')

    // 创建点赞
    await prisma.like.createMany({
      data: [
        { pageId: page1.id, userId: user.id },
        { pageId: page1.id, userId: admin.id },
        { pageId: page2.id, userId: user.id },
        { pageId: page5.id, userId: user.id },
        { pageId: page5.id, userId: admin.id },
        { pageId: page6.id, userId: user.id },
        { pageId: page6.id, userId: admin.id },
        { pageId: page7.id, userId: admin.id },
        { pageId: page7.id, userId: user.id },
      ],
    })

    console.log('👍 点赞创建完成')

    // 创建积分产品
    await prisma.pointProduct.create({
      data: {
        name: 'VIP会员月卡',
        description: '获得30天VIP会员权限',
        pointCost: 500,
        type: 'TEMPORARY_PERMISSION',
        duration: 720, // 30天（小时）
      },
    })

    console.log('🎁 积分产品创建完成')

    console.log('✅ 数据库种子数据创建完成')
  } catch (error) {
    console.error('❌ 数据库种子数据创建失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
