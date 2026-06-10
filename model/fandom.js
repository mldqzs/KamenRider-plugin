/**
 * 假面骑士数据客户端
 * 数据来源：Kamen Rider Wiki (Fandom) 标准 MediaWiki api.php
 *   - 搜索：action=query&list=search
 *   - 主图：action=parse&section=0 取信息框首张「非图标」图片（即骑士本体形态图）
 *   - 简介：action=parse&section=0&prop=text（取首段，清洗 HTML）
 *   - 翻译：百度翻译开放平台（可选，国内用户把英文简介转中文）
 * 注：Fandom 的 Wikia v1 / REST 接口受 Cloudflare 拦截，故统一走 api.php。
 */
import crypto from 'node:crypto'
import { getConfig } from './config.js'
import { readCache, writeCache } from './cache.js'
import { resolveAlias, riderCnName } from '../resources/riders.js'
import { applyGlossary } from '../resources/glossary.js'

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

// 取信息框首图 URL（即骑士本体形态图，而非角色扮演者/真人照或海报）
// pageimages 选取的「代表图」常是真人剧照/海报，故改为解析正文首段：
// 信息框图片按文档顺序排在最前，跳过形如 Icon-xxx 的标题小图标后，
// 第一张图即骑士本体形态图；真人/角色照恒排在其后。
async function getImageUrl(pageid) {
  try {
    const data = await apiGet({
      action: 'parse',
      pageid: String(pageid),
      section: '0',
      prop: 'text',
      disabletoc: '1',
    })
    const html = data?.parse?.text?.['*'] || ''
    const names = [...html.matchAll(/data-image-name="([^"]+)"/gi)].map(m => m[1])
    const name = names.find(n => !/^icon[-_ ]/i.test(n))
    if (!name) return ''
    const fi = await apiGet({
      action: 'query',
      titles: `File:${name}`,
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: '1024',
    })
    const page = Object.values(fi?.query?.pages || {})[0]
    const info = page?.imageinfo?.[0]
    return info?.thumburl || info?.url || ''
  } catch {
    return ''
  }
}

// 按句子/空格边界把长文切成 ≤size 的块（MyMemory 匿名单次 q 上限约 500 字符）
function splitChunks(text, size) {
  const chunks = []
  let rest = String(text).trim()
  while (rest.length > size) {
    let cut = rest.lastIndexOf('. ', size)
    if (cut < size * 0.5) cut = rest.lastIndexOf(' ', size)
    if (cut <= 0) cut = size
    else cut += 1
    chunks.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
  }
  if (rest) chunks.push(rest)
  return chunks
}

// MyMemory 免费翻译（英→中）：免注册、免 key，匿名约 5000 字/天，国内可直连。
// 超额或异常时返回 null（由分发器回退到其它 provider 或英文原文）。
async function transMyMemory(text) {
  const out = []
  for (const chunk of splitChunks(text, 480)) {
    const url = `https://api.mymemory.translated.net/get?${new URLSearchParams({ q: chunk, langpair: 'en|zh-CN' })}`
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const data = await res.json()
    const zh = data?.responseData?.translatedText
    // 超额时 translatedText 会塞 "MYMEMORY WARNING: YOU USED ALL ..." 提示语
    if (!zh || Number(data?.responseStatus) !== 200 || /MYMEMORY WARNING/i.test(zh)) {
      logger.warn(`[假面骑士] MyMemory 翻译失败：${data?.responseDetails || data?.responseStatus || ''}`)
      return null
    }
    out.push(zh)
  }
  return out.join('') || null
}

// 百度翻译（英→中）：质量更好，但需到 https://fanyi-api.baidu.com/ 申请 appid/key。
// 未配置时直接返回 null（不报错），由分发器回退。
async function transBaidu(text, { baiduAppid, baiduKey }) {
  if (!baiduAppid || !baiduKey) return null
  const salt = String(Date.now())
  const sign = crypto.createHash('md5').update(baiduAppid + text + salt + baiduKey).digest('hex')
  const body = new URLSearchParams({ q: text, from: 'en', to: 'zh', appid: baiduAppid, salt, sign })
  const res = await fetch('https://fanyi-api.baidu.com/api/trans/vip/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const data = await res.json()
  if (data?.error_code) {
    logger.warn(`[假面骑士] 百度翻译失败 ${data.error_code}：${data.error_msg || ''}`)
    return null
  }
  const zh = (data?.trans_result || []).map(r => r.dst).join('')
  return zh || null
}

// 翻译分发（英文 → 中文）。按配置 provider 优先，失败自动尝试其它免费 provider。
// 成功返回 { text, provider }，全部失败返回 null（由调用方回退英文原文）。
// 默认 mymemory：免 key、国内可用。
async function translateToZh(text) {
  const cfg = getConfig()
  if (cfg.translate === false || !text) return null
  const provider = cfg.translateProvider || 'mymemory'
  const order = provider === 'baidu' ? ['baidu', 'mymemory'] : ['mymemory', 'baidu']
  for (const p of order) {
    try {
      const zh = p === 'baidu' ? await transBaidu(text, cfg) : await transMyMemory(text)
      // 译后用术语对照表规范化专有名词（招式/形态/变身器/敌人组织），再清残留假名
      if (zh) return { text: tidyZh(applyGlossary(zh)), provider: p }
    } catch (err) {
      logger.warn(`[假面骑士] ${p} 翻译异常：${err?.message || err}`)
    }
  }
  return null
}

// 日文字符集合：平假名 / 片假名 / 片假名扩展 / 半角片假名 / 长音符 ー
const JA_CHARS = '\\u3040-\\u30ff\\u31f0-\\u31ff\\uff66-\\uff9f\\u30fc'
// 假名集合（不含汉字，中文绝不含假名，可安全从译文中剔除）
const KANA_RE = /[぀-ゟ゠-ヿㇰ-ㇿｦ-ﾟー]/g

// 译文兜底清理：删残留日文假名（英文阶段漏网的零散假名），并整理因此产生的空括号/孤立标点。
function tidyZh(text) {
  let t = (text || '').replace(KANA_RE, '')
  // 清空括号、只剩标点的括号，及孤立分隔符
  t = t.replace(/[（(]\s*[，、,;；]*\s*[)）]/g, '')
  t = t.replace(/[，、]\s*([)）])/g, '$1')          // 「， )」→「)」
  t = t.replace(/([（(])\s*[，、,;；]\s*/g, '$1')    // 「( ，」→「(」
  t = t.replace(/ +([，。、；：！？）)])/g, '$1')     // 标点前空格
  t = t.replace(/\s{2,}/g, ' ').trim()
  return t
}

// 去英文原文里的日文注音：形如「Ace Ukiyo ( 浮世 英寿 , Ukiyo Ēsu )」「( 仮面ライダーギーツ , Kamen Raidā Gītsu )」
// 这类括号注音含假名/日文汉字，英文正文里恒为名称注音、无信息量；连同括号内罗马音整段删除。
// 在翻译前做，既让译文干净、又减少翻译字数（省额度）。
function stripJaGloss(text) {
  let t = text || ''
  // 含日文（假名或 CJK 汉字）的半角括号注音
  t = t.replace(new RegExp(`\\s*\\([^()]*[${JA_CHARS}\\u3400-\\u9fff][^()]*\\)`, 'g'), '')
  // 同上但全角括号
  t = t.replace(new RegExp(`\\s*（[^（）]*[${JA_CHARS}\\u3400-\\u9fff][^（）]*）`, 'g'), '')
  // 删注音后整理标点前多余空格
  t = t.replace(/\s+([,.;:!?)])/g, '$1').replace(/\s{2,}/g, ' ')
  return t
}

// 把 section 0 HTML 清洗成纯文本首段简介。
// 只取正文 <p> 段落：Fandom 的引言框（台词，div.quote）、hatnote（span.dablink，
// 「另见…」）、形态切换标签（tabber，div/table）等噪声均不在 <p> 内，天然被排除。
function cleanSummary(html) {
  let h = html || ''
  h = h.replace(/<aside[\s\S]*?<\/aside>/gi, ' ')  // 去信息框（内可能含 <p>）
  // 拼接正文段落；无 <p> 时退回整体清洗（少数页面正文非 <p> 包裹）
  const paras = [...h.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(m => m[1])
    .filter(s => !/^\s*(<br\s*\/?>|\s)*$/i.test(s.replace(/<[^>]+>/g, '')))
  let t = paras.length ? paras.join(' ') : h
  t = t.replace(/<[^>]+>/g, ' ')                   // 去标签
  t = t.replace(/&[a-z]+;|&#\d+;/gi, m => ({ '&amp;': '&', '&quot;': '"', '&#39;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' }[m] || ' '))
  t = t.replace(/\[\d+\]|\[src\]/gi, '')           // 去引用角标 / [src]
  t = stripJaGloss(t)                              // 去日文注音括号（连罗马音）
  // 截断 Fandom 自动生成的 FAQ 区块
  t = t.split(/Quick Answers/i)[0]
  t = t.replace(/\s+/g, ' ').trim()
  // 翻译接口对长文本有体积/配额限制，先做粗截断（按句末标点尽量保留）
  if (t.length > 900) {
    const slice = t.slice(0, 900)
    const idx = slice.lastIndexOf('. ')
    t = idx >= 450 ? slice.slice(0, idx + 1) : slice
  }
  return t
}

// 消歧义页判定：形如「Kamen Rider Xxx may refer to any of the following characters: …」
// 这类「(Rider)」页是多重身份汇总，简介无实质内容，需跳转到主使用者条目。
function isDisambig(text) {
  return /\b(?:may|can|could)\s+refer\s+to\b/i.test(text)
}

// 从正文（已去信息框/图）取首个条目链接的页面标题，作为消歧义跳转目标。
// 消歧义列表第一项恒为「主使用者」（Ace Ukiyo / Aruto Hiden / Ryotaro Nogami…）。
function firstBodyLink(html) {
  const body = (html || '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<figure[\s\S]*?<\/figure>/gi, '')
    .replace(/<table[\s\S]*?<\/table>/gi, '')
  const re = /<a href="\/wiki\/([^":#]+)"/gi
  let m
  while ((m = re.exec(body))) {
    const title = decodeURIComponent(m[1]).replace(/_/g, ' ')
    // 跳过文件/分类/模板/帮助/特殊等命名空间页
    if (!/^(File|Category|Template|Help|Special|Module|Portal):/i.test(title)) return title
  }
  return ''
}

// 取首段简介（清洗 HTML / 模板 / FAQ），返回未截断的英文原文。
// 命中消歧义页时跳转到主使用者条目重新取简介（仅跳一次，避免循环）。
async function getSummary(pageid) {
  try {
    const html = await getSection0({ pageid: String(pageid) })
    const text = cleanSummary(html)
    if (isDisambig(text)) {
      const target = firstBodyLink(html)
      if (target) {
        const text2 = cleanSummary(await getSection0({ page: target }))
        if (text2 && !isDisambig(text2)) return text2
      }
    }
    return text
  } catch {
    return ''
  }
}

const GEN_CN = { showa: '昭和', heisei: '平成', reiwa: '令和' }

// 取某页 section 0 的 HTML（page 标题或 pageid 二选一）
async function getSection0(by) {
  const data = await apiGet({ action: 'parse', ...by, section: '0', prop: 'text', disabletoc: '1' })
  return data?.parse?.text?.['*'] || ''
}

// 解析系列页信息框，取播出年份/世代/话数/电视台等结构化字段。
// 「(Rider)」形态页本身没有信息框：先按「去掉 (Rider) 后缀」的标题猜系列页，
// 猜不中（如 Faiz→实际系列页是 Kamen Rider 555）则退回从形态页顶部 hatnote 的
// 首个 /wiki/Kamen_Rider_* 链接定位真正的系列页。最终仍查不到返回 null，不影响主流程。
// 返回 { year, generation, episodes, network }（缺项省略）。
async function getInfobox(seriesTitle, pageid) {
  try {
    let html = await getSection0({ page: seriesTitle })
    let aside = (html.match(/<aside[\s\S]*?<\/aside>/i) || [''])[0]
    // 猜的系列页没有信息框：从形态页 hatnote 找父系列链接再试一次
    if (!aside && pageid) {
      const formHtml = await getSection0({ pageid: String(pageid) })
      const link = (formHtml.match(/<a href="\/wiki\/(Kamen_Rider_[^"#]+)"/i) || [])[1]
      const parent = link && decodeURIComponent(link).replace(/_/g, ' ')
      if (parent && parent !== seriesTitle) {
        html = await getSection0({ page: parent })
        aside = (html.match(/<aside[\s\S]*?<\/aside>/i) || [''])[0]
      }
    }
    if (!aside) return null

    // 抽取信息框 data-source → 文本值（portable infobox：pi-data-value）
    const get = src => {
      const re = new RegExp(`data-source="${src}"[^>]*>\\s*<h3 class="pi-data-label[^>]*>[\\s\\S]*?<\\/h3>\\s*<div class="pi-data-value[^>]*>([\\s\\S]*?)<\\/div>`, 'i')
      const m = aside.match(re)
      if (!m) return ''
      return m[1].replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;|&#\d+;/gi, ' ').replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim()
    }

    const meta = {}
    // 首播年份：airdate 形如「September 4, 2022 - August 27, 2023」，取首个四位年份
    const airdate = get('airdate')
    const year = (airdate.match(/\b(19|20)\d{2}\b/) || [])[0]
    if (year) meta.year = year
    // 世代：Entry No. 形如「37 4 (Reiwa)」→ 总号37、世代内第4作、令和
    const entry = get('nr')
    const gm = entry.match(/(\d+)\s+(\d+)\s*\(\s*(Showa|Heisei|Reiwa)\s*\)/i)
    if (gm) {
      const genCn = GEN_CN[gm[3].toLowerCase()]
      meta.generation = genCn ? `${genCn}第${gm[2]}作` : ''
    } else {
      const g = entry.match(/Showa|Heisei|Reiwa/i)
      if (g) meta.generation = GEN_CN[g[0].toLowerCase()] || ''
    }
    if (!meta.generation) delete meta.generation
    // 话数：「49 4 movies 9 specials」取前导数字
    const eps = (get('episodes').match(/^\d+/) || [])[0]
    if (eps) meta.episodes = `${eps}话`
    // 电视台
    const network = get('network')
    if (network) meta.network = network

    return Object.keys(meta).length ? meta : null
  } catch {
    return null
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

// meta 对象 → 卡片用 [{label, value}] 列表（缺项自动跳过）
function metaChips(meta) {
  if (!meta) return []
  const chips = []
  if (meta.year) chips.push({ label: '首播', value: `${meta.year}年` })
  if (meta.generation) chips.push({ label: '世代', value: meta.generation })
  if (meta.episodes) chips.push({ label: '话数', value: meta.episodes })
  if (meta.network) chips.push({ label: '电视台', value: meta.network })
  return chips
}

// 简介截断：优先在 max 内最后一个句末标点处收尾（读起来完整、不加省略号）；
// 找不到合适断句点才硬截并补「…」。避免出现「断在词中间 + …」的观感。
function truncateSummary(text, max) {
  if (!text || text.length <= max) return text
  const slice = text.slice(0, max)
  const idx = Math.max(
    slice.lastIndexOf('。'), slice.lastIndexOf('！'), slice.lastIndexOf('？'),
    slice.lastIndexOf('；'), slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '),
  )
  // 断句点不能太靠前（至少过半），否则宁可硬截
  if (idx >= max * 0.5) return slice.slice(0, idx + 1).trim()
  return slice.trim() + '…'
}

// 命中后按 max 截断 + 生成翻译提示，组装最终卡片对象（缓存与实时共用）
function buildCard(rec, max) {
  let summary = truncateSummary(rec.summaryFull || '', max)
  // 用免费的 MyMemory 翻译时提示：术语已对照表校正，整体流畅度仍可配百度提升
  const transTip = rec.provider === 'mymemory'
    ? '※ 简介由 MyMemory 免费翻译并经术语表校正；想要更流畅，推荐用锅巴面板配置百度翻译（有免费额度）'
    : ''
  return {
    title: rec.title,
    titleEn: rec.titleEn || '',
    summary: summary || '暂无简介，可前往词条查看详情。',
    transTip,
    meta: metaChips(rec.meta),
    image: rec.image || '',
    url: rec.url,
  }
}

/**
 * 综合查询：输入名字（中文别名/英文均可），返回卡片所需数据。
 * 命中本地缓存（按 pageid，未过期）时直接复用，跳过 Wiki 解析与翻译 API（省额度、提速）。
 * @returns {Promise<null | { title, titleEn, summary, transTip, meta, image, url }>}
 */
export async function getRider(query) {
  const { summaryLen } = getConfig()
  const max = summaryLen || 160
  const q = resolveAlias(query)
  const hit = await search(q)
  if (!hit) return null

  // 缓存命中：直接组装（summaryFull 未截断，故改 summaryLen 也无需清缓存）
  const cached = readCache(hit.pageid)
  if (cached) return buildCard(cached, max)

  // 系列页（去掉「(Rider)」后缀）才有信息框，并行抓取主图/简介/信息框
  const seriesTitle = hit.title.replace(/\s*\(Rider\)\s*/i, '').trim()
  const [imageUrl, rawSummary, meta] = await Promise.all([
    getImageUrl(hit.pageid),
    getSummary(hit.pageid),
    getInfobox(seriesTitle, hit.pageid),
  ])

  // 英文原文翻译为中文（失败/未配置则回退原文），翻译后的完整文本入缓存
  let summaryFull = rawSummary
  let provider = ''
  if (rawSummary) {
    const zh = await translateToZh(rawSummary)
    if (zh) {
      summaryFull = zh.text
      provider = zh.provider
    }
  }

  const image = await fetchBase64(imageUrl)

  // 标题本地化：主标题用中文名（命中映射时），英文名作小字副标题
  const en = hit.title.replace(/\s*\(Rider\)\s*/i, '').replace(/^Kamen Rider\s*/i, '')
  const cn = riderCnName(hit.title)

  const rec = {
    title: cn || en,
    titleEn: cn ? en : '',
    summaryFull,
    provider,
    meta,
    image,
    url: `https://kamenrider.fandom.com/?curid=${hit.pageid}`,
  }
  writeCache(hit.pageid, rec)
  return buildCard(rec, max)
}

// ============ 详情查询（形态 / 终结技 / 变身器 / 武器 / 载具）============

// 取词条全部 section 目录
async function getSections(pageid) {
  const d = await apiGet({ action: 'parse', pageid: String(pageid), prop: 'sections' })
  return d?.parse?.sections || []
}

// 取某 section 渲染 HTML，去 FAQ 脚本，并从本节标题处起（跳过注入在顶部的 Quick Answers）
async function getSectionHtml(pageid, index) {
  const d = await apiGet({ action: 'parse', pageid: String(pageid), section: String(index), prop: 'text', disabletoc: '1' })
  let html = d?.parse?.text?.['*'] || ''
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  const h = html.search(/<h[2-6][^>]*>[\s\S]*?mw-headline/i)
  if (h > 0) html = html.slice(h)
  return html
}

// 收集正文 /wiki/ 条目链接标题（去命名空间页 / 自身骑士页 / 去重保序）
function linkTitles(html) {
  const out = []
  const seen = new Set()
  for (const m of (html || '').matchAll(/<a href="\/wiki\/([^":#]+)"[^>]*title="([^"]+)"/gi)) {
    const t = m[2].replace(/\s+/g, ' ').trim()
    if (/^(File|Category|Template|Help|Special|Module|Portal):/i.test(t)) continue
    if (/^Kamen Rider\b/i.test(t)) continue          // 骑士本体/系列自链接，非装备
    if (seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}

// Forms 区块的分组标签（非具体形态），过滤掉
const FORM_GROUPS = new Set([
  'standard', 'super', 'special', 'original', 'dooms', 'entry', 'theoretical',
  'legend rider', 'final form ride', 'decade forms', 'riders', 'gotochi', 'other',
  'default', 'normal', 'rider armors', 'rider armor', 'module-less', 'w/ weapon',
])
// 以变身器/扣具/水枪等装备类词结尾的，是装备而非形态
const DEVICE_SUFFIX = /(driver|buckle|riser|holder|ridewatch|watch|belt|gasher)$/i
// 名称归一（去空格/连字符/标点、小写），用于和装备名比对
const normName = s => String(s).toLowerCase().replace(/[\s\-_'’.&]/g, '')

// 从 Forms 区块的嵌套 tabber 提取形态名（data-hash）。
// 过滤分组标签 / 纯数字符号 / 与装备重名；以装备后缀词结尾的归入 extraDevices（补进变身器栏）。
// 返回 { forms, extraDevices }。
function extractForms(html, arsenalSet) {
  const forms = []
  const extraDevices = []
  const seen = new Set()
  const devSeen = new Set()
  for (const m of (html || '').matchAll(/data-hash="([^"]+)"/gi)) {
    const n = decodeURIComponent(m[1]).replace(/_/g, ' ').replace(/&amp;/g, '&').trim()
    if (!n || n.length < 2 || /^[\d\W]+$/.test(n)) continue
    const key = n.toLowerCase()
    if (FORM_GROUPS.has(key)) continue
    if (arsenalSet && arsenalSet.has(normName(n))) continue // 已在装备列表，跳过
    if (DEVICE_SUFFIX.test(n)) {                            // 变身器/扣具等：补进变身器栏
      if (!devSeen.has(normName(n))) {
        devSeen.add(normName(n))
        extraDevices.push(n)
      }
      continue
    }
    if (seen.has(key)) continue
    seen.add(key)
    forms.push(n)
  }
  return { forms, extraDevices }
}

// 从 Forms 区块的 <li> 提取终结技名：形如「… finisher: Magnum Boost Grand Victory ( 日文 )」
function extractFinishers(html) {
  const out = []
  const seen = new Set()
  for (const m of (html || '').matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)) {
    const t = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const fm = t.match(/finishers?\s*:\s*([^(（:]+?)\s*[(（]/i)
    if (!fm) continue
    const name = stripJaGloss(fm[1]).replace(/\s+/g, ' ').trim()
    if (!name || name.length < 2) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(name)
  }
  return out
}

// 取装备：变身器(Devices) / 武器(Weapons) / 载具(Vehicles)，无细分时回退整个 Equipment
async function getArsenal(pageid, sections) {
  const byName = name => sections.find(s => s.line.toLowerCase() === name)
  const pick = async name => {
    const sec = byName(name)
    return sec ? linkTitles(await getSectionHtml(pageid, sec.index)) : []
  }
  let [devices, weapons, vehicles] = await Promise.all([pick('devices'), pick('weapons'), pick('vehicles')])
  if (!devices.length && !weapons.length) {
    const eq = byName('equipment')
    if (eq) devices = linkTitles(await getSectionHtml(pageid, eq.index))
  }
  return { devices, weapons, vehicles }
}

/**
 * 详情查询：返回形态 / 终结技 / 变身器 / 武器 / 载具 等结构化数据（专有名词保留英文）。
 * 命中本地缓存（kind='detail'）直接复用。
 * @returns {Promise<null | { title, titleEn, meta, devices, weapons, vehicles, forms, finishers, url }>}
 */
export async function getDetail(query) {
  const q = resolveAlias(query)
  const hit = await search(q)
  if (!hit) return null

  const cached = readCache(hit.pageid, 'detail')
  if (cached) return cached.data

  const sections = await getSections(hit.pageid)
  const formsSec = sections.find(s => s.line.toLowerCase() === 'forms')
  const seriesTitle = hit.title.replace(/\s*\(Rider\)\s*/i, '').trim()
  const [formsHtml, arsenal, meta] = await Promise.all([
    formsSec ? getSectionHtml(hit.pageid, formsSec.index) : Promise.resolve(''),
    getArsenal(hit.pageid, sections),
    getInfobox(seriesTitle, hit.pageid),
  ])

  const en = hit.title.replace(/\s*\(Rider\)\s*/i, '').replace(/^Kamen Rider\s*/i, '')
  const cn = riderCnName(hit.title)
  // 装备名集合（归一），用于把混进形态 tabber 的变身器/武器剔除
  const arsenalSet = new Set([...arsenal.devices, ...arsenal.weapons, ...arsenal.vehicles].map(normName))
  const { forms, extraDevices } = extractForms(formsHtml, arsenalSet)
  // 把 Forms tabber 里以变身器结尾的项补进变身器栏（去重，排在已有装备之后）
  const devices = [...arsenal.devices]
  const devNorm = new Set(devices.map(normName))
  for (const d of extraDevices) {
    if (!devNorm.has(normName(d))) {
      devNorm.add(normName(d))
      devices.push(d)
    }
  }
  const data = {
    title: cn || en,
    titleEn: cn ? en : '',
    meta: metaChips(meta),
    devices: devices.slice(0, 16),
    weapons: arsenal.weapons.slice(0, 16),
    vehicles: arsenal.vehicles.slice(0, 12),
    forms: forms.slice(0, 28),
    finishers: extractFinishers(formsHtml).slice(0, 16),
    url: `https://kamenrider.fandom.com/?curid=${hit.pageid}`,
  }
  writeCache(hit.pageid, { data }, 'detail')
  return data
}
