import App from '@/App.tsx'
import { routes } from '@/lib/router.ts'
import { renderToString } from 'react-dom/server'

interface PrerenderData {
  url: string
}

type PrerenderResult = string | {
  html?: string
  head?: {
    lang?: string
    title?: string
    elements?: Set<{
      type: string
      props: Record<string, string>
      children?: string
    }>
  }
  links?: Set<string> | string[]
} | null | undefined

const paths = Object.values(routes)

export async function prerender(data: PrerenderData): Promise<PrerenderResult> {
  try {
    const html = renderToString(<App />)

    const { parseLinks } = await import('vite-prerender-plugin/parse')

    const links = [
      ...parseLinks(html),
      ...paths,
    ]

    return {
      html,
      links,
      head: {
        lang: 'en',
        title: 'Bharos Exchange - Trustworthy Crypto for Everyone | BRS Coin',
      },
    }
  } catch (e: any) {
    console.warn(`Failed to prerender "${data.url}":`, e.message)
    return null
  }
}
