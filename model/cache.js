/**
 * 本地结果缓存（按 pageid）
 * 目的：同一骑士重复查询时，跳过 Wiki 解析 + 翻译 API，省翻译额度、提速。
 * 存储：每个 pageid 一个 JSON 文件，落地 plugins/KamenRider-plugin/data/cache/<pageid>.json
 *   { v, ts, pageid, title, titleEn, summaryFull, provider, meta, image, url }
 *   - summaryFull：翻译后（或回退英文）的未截断简介，读取时再按 summaryLen 截断
 *   - 故改 summaryLen 不需清缓存
 * 过期：由 config.cacheTTL（天）控制；schema 版本 V 变更会自动作废旧缓存。
 */
import fs from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getConfig } from './config.js'

const _dir = dirname(fileURLToPath(import.meta.url))
const cacheDir = join(_dir, '..', 'data', 'cache')

// 缓存数据结构版本：字段语义变更时 +1，旧缓存自动失效
const V = 1

function ensureDir() {
  try {
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true })
  } catch (err) {
    logger.warn(`[假面骑士] 创建缓存目录失败：${err?.message || err}`)
  }
}

// kind 用于区分缓存类型：''=图鉴卡片，'detail'=详情卡片（同一 pageid 各存一份）
function filePath(pageid, kind = '') {
  return join(cacheDir, `${pageid}${kind ? '.' + kind : ''}.json`)
}

// 读缓存：命中且未过期/版本一致返回记录，否则 null
export function readCache(pageid, kind = '') {
  const cfg = getConfig()
  if (cfg.cacheEnable === false || !pageid) return null
  try {
    const fp = filePath(pageid, kind)
    if (!fs.existsSync(fp)) return null
    const rec = JSON.parse(fs.readFileSync(fp, 'utf8'))
    if (!rec || rec.v !== V) return null
    const ttlDays = Number(cfg.cacheTTL) > 0 ? Number(cfg.cacheTTL) : 30
    if (Date.now() - Number(rec.ts || 0) > ttlDays * 86400000) return null
    return rec
  } catch {
    return null
  }
}

// 写缓存（失败仅告警，不影响主流程）
export function writeCache(pageid, rec, kind = '') {
  const cfg = getConfig()
  if (cfg.cacheEnable === false || !pageid) return
  try {
    ensureDir()
    fs.writeFileSync(filePath(pageid, kind), JSON.stringify({ ...rec, v: V, ts: Date.now(), pageid }), 'utf8')
  } catch (err) {
    logger.warn(`[假面骑士] 写缓存失败：${err?.message || err}`)
  }
}

// 清空缓存，返回删除文件数（供维护指令调用）
export function clearCache() {
  try {
    if (!fs.existsSync(cacheDir)) return 0
    const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'))
    for (const f of files) fs.unlinkSync(join(cacheDir, f))
    return files.length
  } catch (err) {
    logger.warn(`[假面骑士] 清空缓存失败：${err?.message || err}`)
    return 0
  }
}
