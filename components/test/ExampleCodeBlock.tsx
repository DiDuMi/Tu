// 代码示例常量
export const CODE_EXAMPLES = {
  avatar: {
    before: `<img
  src={user.avatar}
  alt={user.name}
  className="w-12 h-12 rounded-full object-cover"
/>`,
    after: `<AvatarImage
  src={user.avatar}
  alt={user.name}
  size={48}
  onLoadComplete={() => recordEvent('load_success')}
  onErrorOccurred={() => recordEvent('load_error')}
/>`
  },
  
  cover: {
    before: `<div className="relative w-full aspect-video">
  <img
    src={content.coverImage}
    alt={content.title}
    className="w-full h-full object-cover"
  />
</div>`,
    after: `<CoverImage
  src={content.coverImage}
  alt={content.title}
  aspectRatio="16/9"
  onLoadComplete={() => recordEvent('load_success')}
  onErrorOccurred={() => recordEvent('load_error')}
/>`
  },
  
  mediaPreview: {
    before: `<img
  src={media.preview}
  alt={media.name}
  className="w-full max-h-32 object-contain"
/>`,
    after: `<MediaPreviewImage
  src={media.preview}
  alt={media.name}
  type={media.type}
  maxWidth={200}
  maxHeight={128}
  showInfo={true}
  useOptimized={true}
/>`
  }
}

// 模拟数据
export const MOCK_DATA = {
  user: {
    id: '1',
    name: '张三',
    avatar: 'https://picsum.photos/200/200?random=10',
    email: 'zhangsan@example.com'
  },
  
  content: {
    id: '1',
    title: '美丽的风景照片',
    coverImage: 'https://picsum.photos/800/450?random=11',
    description: '这是一张非常美丽的风景照片，展示了大自然的壮丽景色。'
  },
  
  media: [
    {
      id: '1',
      type: 'image' as const,
      preview: 'https://picsum.photos/600/400?random=12',
      name: '高清风景图.jpg'
    },
    {
      id: '2',
      type: 'image' as const,
      preview: 'https://picsum.photos/400/600?random=13',
      name: '人物肖像.jpg'
    }
  ]
}
