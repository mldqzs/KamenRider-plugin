/**
 * 假面骑士数据客户端
 * 数据来源：Kamen Rider Wiki (Fandom) 标准 MediaWiki api.php
 *   - 搜索：action=query&list=search
 *   - 主图：action=query&prop=pageimages
 *   - 简介：action=parse&section=0&prop=text（取首段，清洗 HTML）
 * 注：Fandom 的 Wikia v1 / REST 接口受 Cloudflare 拦截，故统一走 api.php。
 */
import { getConfig } from './config.js'
import { resolveAlias } from '../resources/riders.js'

const API = 'https://kamenrider.fandom.com/api.php'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 KamenRiderPlugin/1.0'

async function apiGet(params, timeout = 12000) {
  const url = `${API}?${new URLSearchParams({ format: 'json', ...params })}`
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(timeout),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// 精确标题直查（别名命中的多是精确词条），命中返回 { pageid, title }
async function resolveTitle(title) {
  try {
    const data = await apiGet({ action: 'query', titles: title, prop: 'info', redirects: '1' })
    const page = Object.values(data?.query?.pages || {})[0]
    if (page && page.pageid && !('missing' in page)) {
      return { pageid: page.pageid, title: page.title }
    }
  } catch {}
  return null
}

// 搜索，返回最佳词条 { pageid, title }，无结果返回 null
async function search(query) {
  // 1) 先按精确标题直查（别名映射后多为「Kamen Rider Xxx (Rider)」精确词条）
  const direct = await resolveTitle(query)
  if (direct) return direct

  // 2) 退回全文搜索，优先带「(Rider)」的角色页
  const data = await apiGet({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: '5',
  })
  const hits = data?.query?.search || []
  if (!hits.length) return null
  const rider = hits.find(h => /\(Rider\)/i.test(h.title))
  const hit = rider || hits[0]
  return { pageid: hit.pageid, title: hit.title }
}

// 取主图 URL（原图，失败回退缩略图）
async function getImageUrl(pageid) {
  try {
    const data = await apiGet({
      action: 'query',
      prop: 'pageimages',
      piprop: 'original|thumbnail',
      pithumbsize: '512',
      pageids: String(pageid),
    })
    const page = data?.query?.pages?.[pageid]
    return page?.original?.source || page?.thumbnail?.source || ''
  } catch {
    return ''
  }
}

// 取首段简介（清洗 HTML / 模板 / FAQ）
async function getSummary(pageid, maxLen) {
  try {
    const data = await apiGet({
      action: 'parse',
      pageid: String(pageid),
      section: '0',
      prop: 'text',
      disabletoc: '1',
    })
    let t = data?.parse?.text?.['*'] || ''
    t = t.replace(/<aside[\s\S]*?<\/aside>/gi, '')   // 去信息框
    t = t.replace(/<table[\s\S]*?<\/table>/gi, '')   // 去表格
    t = t.replace(/<figure[\s\S]*?<\/figure>/gi, '')
    t = t.replace(/<[^>]+>/g, ' ')                   // 去标签
    t = t.replace(/&[a-z]+;|&#\d+;/gi, m => ({ '&amp;': '&', '&quot;': '"', '&#39;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' }[m] || ' '))
    t = t.replace(/\[\d+\]/g, '')                    // 去引用角标
    // 截断 Fandom 自动生成的 FAQ 区块
    t = t.split(/Quick Answers/i)[0]
    t = t.replace(/\s+/g, ' ').trim()
    if (maxLen && t.length > maxLen) t = t.slice(0, maxLen).trim() + '…'
    return t
  } catch {
    return ''
  }
}

// 远程图片 → base64 data URI（确保截图时一定渲染）
async function fetchBase64(url, timeout = 10000) {
  try {
    if (!url) return ''
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(timeout),
    })
    if (!res.ok) return ''
    const buf = await res.arrayBuffer()
    const mime = res.headers.get('content-type')?.split(';')[0] || 'image/png'
    return `data:${mime};base64,${Buffer.from(buf).toString('base64')}`
  } catch {
    return ''
  }
}

/**
 * 综合查询：输入名字（中文别名/英文均可），返回卡片所需数据。
 * @returns {Promise<null | { title, summary, image, url }>}
 */
export async function getRider(query) {
  const { summaryLen } = getConfig()
  const q = resolveAlias(query)
  const hit = await search(q)
  if (!hit) return null

  const [imageUrl, summary] = await Promise.all([
    getImageUrl(hit.pageid),
    getSummary(hit.pageid, summaryLen || 160),
  ])
  const image = await fetchBase64(imageUrl)

  return {
    title: hit.title.replace(/\s*\(Rider\)\s*/i, ''),
    summary: summary || '暂无简介，可前往词条查看详情。',
    image,
    url: `https://kamenrider.fandom.com/?curid=${hit.pageid}`,
  }
}
