import plugin from '../../../lib/plugins/plugin.js'
import { createRequire } from 'module'
import _ from 'lodash'
import { Restart } from '../../other/restart.js'
import common from '../../../lib/common/common.js'

const require = createRequire(import.meta.url)
const { exec } = require('child_process')

const pluginName = 'KamenRider-plugin'
const _path = `./plugins/${pluginName}/`

// 是否在更新中
let uping = false

/**
 * 假面骑士插件更新（格式对齐云崽生态通用更新插件）
 */
export class KRUpdate extends plugin {
  constructor() {
    super({
      name: '假面骑士更新',
      dsc: '更新假面骑士插件',
      event: 'message',
      // 高于查询(600)，避免 #假面骑士更新 被查询的万能正则吞掉
      priority: 500,
      rule: [
        {
          reg: '^#?(假面)?骑士(插件)?(强制)?更新$',
          fnc: 'update',
          permission: 'master',
        },
        {
          reg: '^#?(假面)?骑士(插件)?更新(日志|记录|历史)$',
          fnc: 'updateLog',
        },
      ],
    })
  }

  /** 更新假面骑士插件 */
  async update() {
    if (!this.e.isMaster) return false

    if (uping) {
      await this.reply('已有命令更新中..请勿重复操作')
      return
    }

    if (!(await this.checkGit())) return

    const isForce = this.e.msg.includes('强制')

    await this.runUpdate(isForce)

    // 更新成功则重启生效
    if (this.isUp) {
      setTimeout(() => this.restart(), 2000)
    }
  }

  restart() {
    new Restart(this.e).restart()
  }

  async runUpdate(isForce) {
    let command = `git -C ${_path} pull --no-rebase`
    if (isForce) {
      command = `git -C ${_path} checkout . && ${command}`
      await this.reply('正在执行强制更新操作，请稍等')
    } else {
      await this.reply('正在执行更新操作，请稍等')
    }

    // 记录更新前的 commitId，用于截取本次新增的更新日志
    this.oldCommitId = await this.getCommitId(pluginName)
    uping = true
    const ret = await this.execSync(command)
    uping = false

    if (ret.error) {
      logger.mark(`${this.e.logFnc} 更新失败：${pluginName}`)
      await this.gitErr(ret.error, ret.stdout)
      return false
    }

    const time = await this.getTime(pluginName)

    if (/(Already up[ -]to[ -]date|已经是最新)/.test(ret.stdout)) {
      await this.reply(`${pluginName} 已经是最新版本\n最后更新时间：${time}`)
    } else {
      await this.reply(`${pluginName} 更新成功\n最后更新时间：${time}`)
      this.isUp = true
      const log = await this.getLog(pluginName)
      if (log) await this.reply(log)
    }

    logger.mark(`${this.e.logFnc} 最后更新时间：${time}`)
    return true
  }

  /** 获取更新日志（合并转发） */
  async getLog(plugin = pluginName) {
    const cm = `git -C ./plugins/${plugin}/ log -20 --oneline --pretty=format:"%h||[%cd] %s" --date=format:"%m-%d %H:%M"`

    let logAll
    try {
      logAll = (await this.execSync(cm)).stdout
    } catch (error) {
      logger.error(error.toString())
      await this.reply(error.toString())
      return false
    }

    if (!logAll) return false

    logAll = logAll.trim().split('\n')

    const log = []
    for (let str of logAll) {
      str = str.split('||')
      // updateLog 查看全部；update 只取本次新增（到上次 commitId 为止）
      if (this.oldCommitId && str[0] == this.oldCommitId) break
      if (str[1] && str[1].includes('Merge branch')) continue
      if (str[1]) log.push(str[1])
    }

    const line = log.length
    if (line <= 0) return ''

    const end = '更多详细信息，请前往 Gitee/GitHub 查看'
    return common.makeForwardMsg(this.e, [log.join('\n\n'), end], `${pluginName} 更新日志，共 ${line} 条`)
  }

  /** 查看更新日志 */
  async updateLog() {
    this.oldCommitId = '' // 展示全部记录
    const log = await this.getLog()
    if (!log) {
      await this.reply('暂无更新日志~')
      return
    }
    await this.reply(log)
  }

  async getCommitId(plugin = '') {
    const ret = await this.execSync(`git -C ./plugins/${plugin}/ rev-parse --short HEAD`)
    return _.trim(ret.stdout)
  }

  async getTime(plugin = '') {
    let time = ''
    try {
      const ret = await this.execSync(
        `git -C ./plugins/${plugin}/ log -1 --pretty=format:"%cd" --date=format:"%m-%d %H:%M"`,
      )
      time = _.trim(ret.stdout)
    } catch (error) {
      logger.error(error.toString())
      time = '获取时间失败'
    }
    return time
  }

  /** 处理更新失败 */
  async gitErr(err, stdout) {
    const msg = '更新失败！'
    const errMsg = err.toString()
    stdout = (stdout || '').toString()

    if (errMsg.includes('Timed out')) {
      const remote = errMsg.match(/'(.+?)'/g)?.[0]?.replace(/'/g, '') || ''
      await this.reply(`${msg}\n连接超时：${remote}`)
      return
    }

    if (/Failed to connect|unable to access/.test(errMsg)) {
      const remote = errMsg.match(/'(.+?)'/g)?.[0]?.replace(/'/g, '') || ''
      await this.reply(`${msg}\n连接失败：${remote}`)
      return
    }

    if (errMsg.includes('be overwritten by merge')) {
      await this.reply(`${msg}存在冲突：\n${errMsg}\n请解决冲突后再更新，或发送 #假面骑士强制更新 放弃本地修改`)
      return
    }

    if (stdout.includes('CONFLICT')) {
      await this.reply([msg + '存在冲突\n', errMsg, stdout, '\n请解决冲突后再更新，或发送 #假面骑士强制更新 放弃本地修改'])
      return
    }

    await this.reply([errMsg, stdout])
  }

  /** 异步执行命令 */
  execSync(cmd) {
    return new Promise(resolve => {
      exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
        resolve({ error, stdout, stderr })
      })
    })
  }

  async checkGit() {
    const ret = await this.execSync('git --version')
    if (!ret.stdout || !ret.stdout.includes('git version')) {
      await this.reply('请先安装 git')
      return false
    }
    return true
  }
}
