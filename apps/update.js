import plugin from '../../../lib/plugins/plugin.js'
import { createRequire } from 'node:module'
import { promisify } from 'node:util'
import { exec as _exec } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import fs from 'node:fs'
import { getConfig } from '../model/config.js'
import { getPluginVersion } from '../model/version.js'

const exec = promisify(_exec)
const require = createRequire(import.meta.url)

const _dir = dirname(fileURLToPath(import.meta.url))
const pluginRoot = join(_dir, '..')          // 插件根目录
const pluginName = '假面骑士插件'

export class KRUpdate extends plugin {
  constructor() {
    super({
      name: '假面骑士更新',
      dsc: '更新假面骑士插件',
      event: 'message',
      priority: 600,
      rule: [
        {
          reg: '^#?(假面)?骑士(插件)?(强制)?更新$',
          fnc: 'update',
          permission: 'master',
        },
      ],
    })
  }

  async update(e) {
    if (getConfig().enable === false) return false

    // 必须是 git 仓库才能拉取更新
    if (!fs.existsSync(join(pluginRoot, '.git'))) {
      await e.reply(`${pluginName}不是通过 git 安装的，无法自动更新。请手动重新克隆安装。`)
      return true
    }

    const isForce = /强制/.test(e.msg || '')
    const oldVer = getPluginVersion()
    const oldHash = await this._head()

    await e.reply(`开始${isForce ? '强制' : ''}更新${pluginName}……`)

    // 强制更新：丢弃本地改动后再拉取
    if (isForce) {
      try {
        await this._git('git checkout . --')
      } catch (err) {
        logger.error(`[假面骑士] 重置本地改动失败：${err?.message || err}`)
      }
    }

    let stdout = ''
    try {
      const ret = await this._git(`git pull ${await this._pullTarget()} --no-rebase`)
      stdout = `${ret.stdout || ''}${ret.stderr || ''}`
    } catch (err) {
      const msg = `${err?.stdout || ''}${err?.stderr || ''}${err?.message || ''}`
      logger.error(`[假面骑士] 更新失败：${msg}`)
      let tip = `${pluginName}更新失败！\n错误信息：${this._trim(msg)}`
      if (/Your local changes|Please commit|overwritten by merge|冲突|conflict/i.test(msg)) {
        tip += '\n\n本地文件有改动导致冲突，可发送【#假面骑士强制更新】丢弃改动后重试。'
      }
      await e.reply(tip)
      return true
    }

    // 已是最新
    if (/Already up[ -]to[ -]date|已经是最新/i.test(stdout)) {
      await e.reply(`${pluginName}已是最新版本~\n当前版本：v${oldVer}`)
      return true
    }

    const newVer = getPluginVersion()
    const log = await this._log(oldHash)
    let msg = `${pluginName}更新成功！`
    msg += newVer !== oldVer ? `\n版本：v${oldVer} → v${newVer}` : `\n当前版本：v${newVer}`
    if (log) msg += `\n\n更新内容：\n${log}`
    msg += '\n\n更新已完成，请发送【#重启】使插件生效。'
    await e.reply(msg)
    return true
  }

  /** 取当前 HEAD 短哈希 */
  async _head() {
    try {
      const { stdout } = await this._git('git rev-parse --short HEAD')
      return (stdout || '').trim()
    } catch {
      return ''
    }
  }

  /** 列出从 since 到现在的提交（标题 + 相对时间） */
  async _log(since) {
    if (!since) return ''
    try {
      const { stdout } = await this._git(
        `git log ${since}..HEAD --pretty=format:"%s  (%cr)" -20`
      )
      return (stdout || '').trim()
    } catch {
      return ''
    }
  }

  /**
   * 解析 pull 目标，避免依赖分支 upstream：
   *  1) 若分支已配 upstream → 返回 ''（让 git pull 走默认 upstream）
   *  2) 否则显式 <remote> <branch>：remote 优先 origin，没有则取第一个
   */
  async _pullTarget() {
    try {
      await this._git('git rev-parse --abbrev-ref --symbolic-full-name @{u}')
      return '' // 有 upstream，直接 git pull
    } catch {
      // 无 upstream，继续解析
    }
    let branch = 'HEAD'
    try {
      branch = (await this._git('git rev-parse --abbrev-ref HEAD')).stdout.trim() || 'HEAD'
    } catch {}
    let remotes = []
    try {
      remotes = (await this._git('git remote')).stdout.split('\n').map(s => s.trim()).filter(Boolean)
    } catch {}
    const remote = remotes.includes('origin') ? 'origin' : remotes[0]
    if (!remote || branch === 'HEAD') return '' // 兜底：交给 git 默认行为
    return `${remote} ${branch}`
  }

  _git(cmd) {
    return exec(cmd, { cwd: pluginRoot, windowsHide: true })
  }

  _trim(s = '', max = 500) {
    s = String(s).trim()
    return s.length > max ? s.slice(0, max) + '……' : s
  }
}
