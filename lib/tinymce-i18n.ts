/**
 * TinyMCE 汉化配置
 * 扩展的中文翻译配置，包括表情包和自定义功能
 */

// 表情包分类的中文翻译
export const emojiCategoryTranslations = {
  'all': '全部',
  'people': '人物',
  'animals_and_nature': '动物和自然',
  'food_and_drink': '食物和饮料',
  'activity': '活动',
  'travel_and_places': '旅行和地点',
  'objects': '物体',
  'symbols': '符号',
  'flags': '旗帜',
  'smileys_and_emotion': '笑脸和情感'
}

// 扩展的TinyMCE中文翻译
export const extendedChineseTranslations = {
  // 表情包相关
  'Emojis': '表情符号',
  'Emojis...': '表情符号...',
  'Search': '搜索',
  'All': '全部',
  'People': '人物',
  'Animals and Nature': '动物和自然',
  'Food and Drink': '食物和饮料',
  'Activity': '活动',
  'Travel and Places': '旅行和地点',
  'Objects': '物体',
  'Symbols': '符号',
  'Flags': '旗帜',
  'Smileys & Emotion': '笑脸和情感',
  'Animals & Nature': '动物和自然',
  'Food & Drink': '食物和饮料',
  'Travel & Places': '旅行和地点',

  // 自定义按钮
  'Media Processing': '媒体处理',
  'Process images and videos': '处理图片和视频',
  'Cloud Media': '云媒体',
  'Insert cloud media': '插入云端媒体',
  'Media Sort': '媒体排序',
  'Sort media elements': '对媒体元素进行排序',

  // 对话框
  'Media URL': '媒体URL',
  'Paste cloud media link': '粘贴云媒体链接',
  'Alternative Text': '替代文本',
  'Width': '宽度',
  'Height': '高度',
  'Apply': '应用',
  'Insert': '插入',

  // 通知消息
  'No media elements found': '没有找到媒体元素',
  'Cloud media link converted successfully': '云媒体链接转换成功',
  'Unsupported cloud media format': '不支持的云媒体格式',
  'Please enter media URL': '请输入媒体URL',

  // 菜单项
  'Insert menu': '插入菜单',
  'Format menu': '格式菜单',
  'Tools menu': '工具菜单',
  'View menu': '查看菜单',
  'Help menu': '帮助菜单'
}

// 应用扩展翻译到TinyMCE
export const applyExtendedTranslations = () => {
  if (typeof window !== 'undefined' && (window as any).tinymce) {
    const tinymce = (window as any).tinymce

    // 扩展现有的中文翻译
    if (tinymce.util && tinymce.util.I18n) {
      const i18n = tinymce.util.I18n

      // 添加扩展翻译
      Object.keys(extendedChineseTranslations).forEach(key => {
        i18n.add('zh_CN', {
          [key]: extendedChineseTranslations[key as keyof typeof extendedChineseTranslations]
        })
      })
    }
  }
}

// 获取表情包分类的中文名称
export const getEmojiCategoryName = (category: string): string => {
  return emojiCategoryTranslations[category as keyof typeof emojiCategoryTranslations] || category
}

// 常用表情包的中文关键词映射
export const chineseEmojiKeywords = {
  // 笑脸和情感
  '😀': ['笑', '开心', '高兴', '快乐'],
  '😃': ['笑', '开心', '兴奋'],
  '😄': ['笑', '开心', '大笑'],
  '😁': ['笑', '开心', '咧嘴笑'],
  '😆': ['笑', '开心', '大笑', '哈哈'],
  '😅': ['笑', '尴尬', '冷汗'],
  '🤣': ['笑', '大笑', '笑哭'],
  '😂': ['笑', '哭笑', '笑哭'],
  '🙂': ['微笑', '笑'],
  '🙃': ['倒脸', '调皮'],
  '😉': ['眨眼', '调皮'],
  '😊': ['微笑', '开心'],
  '😇': ['天使', '纯洁'],
  '🥰': ['爱', '喜欢', '心'],
  '😍': ['爱', '喜欢', '心眼'],
  '🤩': ['星眼', '崇拜'],
  '😘': ['飞吻', '亲吻'],
  '😗': ['亲吻', '吻'],
  '☺️': ['微笑', '开心'],
  '😚': ['亲吻', '吻'],
  '😙': ['亲吻', '吻'],
  '🥲': ['哭笑', '感动'],

  // 手势
  '👍': ['赞', '好', '棒', '点赞'],
  '👎': ['踩', '不好', '差'],
  '👌': ['好', '棒', 'OK'],
  '✌️': ['胜利', '和平'],
  '🤞': ['祈祷', '希望'],
  '🤟': ['爱你', '我爱你'],
  '🤘': ['摇滚', '酷'],
  '🤙': ['打电话', '联系'],
  '👈': ['左', '指左'],
  '👉': ['右', '指右'],
  '👆': ['上', '指上'],
  '👇': ['下', '指下'],
  '☝️': ['一', '第一'],
  '✋': ['停', '手'],
  '🤚': ['手', '停'],
  '🖐️': ['手', '五'],
  '🖖': ['长寿', '繁荣'],
  '👋': ['挥手', '再见'],
  '🤝': ['握手', '合作'],
  '👏': ['鼓掌', '棒'],
  '🙌': ['举手', '万岁'],

  // 心形符号
  '❤️': ['爱', '心', '红心'],
  '🧡': ['橙心', '爱'],
  '💛': ['黄心', '爱'],
  '💚': ['绿心', '爱'],
  '💙': ['蓝心', '爱'],
  '💜': ['紫心', '爱'],
  '🖤': ['黑心', '爱'],
  '🤍': ['白心', '爱'],
  '🤎': ['棕心', '爱'],
  '💔': ['心碎', '伤心'],
  '❣️': ['心', '爱'],
  '💕': ['心', '爱'],
  '💞': ['心', '爱'],
  '💓': ['心跳', '爱'],
  '💗': ['心', '爱'],
  '💖': ['心', '爱'],
  '💘': ['心', '爱'],
  '💝': ['心', '礼物'],

  // 其他常用
  '🔥': ['火', '热', '厉害'],
  '⭐': ['星', '棒', '好', '星星', '夜晚'],
  '✨': ['闪', '亮', '棒'],
  '💯': ['百分百', '满分', '棒'],
  '💪': ['肌肉', '强', '加油'],
  '🚀': ['火箭', '快', '冲'],
  '🎉': ['庆祝', '派对'],
  '🎊': ['庆祝', '彩带'],
  '🏆': ['奖杯', '冠军', '第一'],
  '🥇': ['金牌', '第一'],
  '🎯': ['目标', '准确'],
  '💎': ['钻石', '珍贵'],
  '🌟': ['星', '亮'],
  '⚡': ['闪电', '快'],
  '💥': ['爆炸', '厉害'],
  '💫': ['眩晕', '星'],
  '🌈': ['彩虹', '美好'],
  '☀️': ['太阳', '晴天'],
  '🌙': ['月亮', '夜晚']
}

export default {
  emojiCategoryTranslations,
  extendedChineseTranslations,
  applyExtendedTranslations,
  getEmojiCategoryName,
  chineseEmojiKeywords
}
