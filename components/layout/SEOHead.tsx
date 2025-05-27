import Head from 'next/head'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
}

export default function SEOHead({
  title = '兔图内容平台',
  description = '兔图内容平台，提供自主可控的内容创建、编辑和发布功能',
  keywords = [],
  image
}: SEOHeadProps) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      {image && <meta property="og:image" content={image} />}
      <link rel="icon" href="/favicon.ico" />
    </Head>
  )
}

export type { SEOHeadProps }
