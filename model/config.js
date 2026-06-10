import fs from 'node:fs'
import yaml from 'yaml'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const _dir = dirname(fileURLToPath(import.meta.url))
const pluginRoot = join(_dir, '..')
const defPath = join(pluginRoot, 'config/defSet_config/config.yaml')
const cfgDir = join(pluginRoot, 'config/config')
const cfgPath = join(cfgDir, 'config.yaml')

// 首次运行：用户配置不在仓库中，从默认配置生成
function ensure() {
  try {
    if (!fs.existsSync(cfgDir)) fs.mkdirSync(cfgDir, { recursive: true })
    if (!fs.existsSync(cfgPath)) fs.copyFileSync(defPath, cfgPath)
  } catch (err) {
    logger.error(`[假面骑士] 初始化配置失败：${err?.message || err}`)
  }
}
ensure()

let _cache = null
let _mtime = 0

// 带 mtime 缓存的热加载：被锅巴/外部改写后自动重读
export function getConfig() {
  try {
    const stat = fs.statSync(cfgPath)
    if (!_cache || stat.mtimeMs !== _mtime) {
      const def = yaml.parse(fs.readFileSync(defPath, 'utf8')) || {}
      const usr = yaml.parse(fs.readFileSync(cfgPath, 'utf8')) || {}
      _cache = { ...def, ...usr }
      _mtime = stat.mtimeMs
    }
  } catch (err) {
    logger.error(`[假面骑士] 读取配置失败：${err?.message || err}`)
    _cache = _cache || {}
  }
  return _cache
}
