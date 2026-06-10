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

/** 读取云崽（TRSS-Yunzai）版本号：取运行根目录的 package.json */
export function getYunzaiVersion() {
  try {
    return JSON.parse(fs.readFileSync(join(process.cwd(), 'package.json'), 'utf8')).version || '未知'
  } catch {
    return '未知'
  }
}
