import Head from 'next/head'

interface PageTitleProps {
  title: string
  description?: string
  keywords?: string[]
  image?: string
  suffix?: string
}

/**
 * 通用页面标题组件，用于设置页面的标题、描述、关键词等元数据
 * 解决标题元素接收数组作为子元素的警告问题
 */
export function PageTitle({
  title,
  description,
  keywords,
  image,
  suffix = '兔图'
}: PageTitleProps) {
  // 构建完整标题
  const fullTitle = suffix ? `${title} - ${suffix}` : title

  return (
    <Head>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      {image && <meta property="og:image" content={image} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
    </Head>
  )
}
