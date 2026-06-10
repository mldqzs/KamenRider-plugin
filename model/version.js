import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const _dir = dirname(fileURLToPath(import.meta.url))
const pluginRoot = join(_dir, '..')

/** 读取插件版本号 */
export function getPluginVersion() {
  try {
    return JSON.parse(fs.readFileSync(join(pluginRoot, 'package.json'), 'utf8')).version || '未知'
  } catch {
    return '未知'
  }
}
