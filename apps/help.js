import plugin from '../../../lib/plugins/plugin.js'
import { renderHelp } from '../model/render.js'
import { getPluginVersion } from '../model/version.js'

// 指令清单（图片与文字兜底共用）
const CMDS = [
  { cmd: '#假面骑士 <名字>', desc: '图鉴查询，中/英名均可，如 Geats、电王、W' },
  { cmd: '#假面骑士 <名字> 详情', desc: '查形态、终结技、变身器、武器、载具' },
  { cmd: '#随机骑士', desc: '随机来一位假面骑士' },
  { cmd: '#每日一骑', desc: '今日份的骑士（全 Bot 当天相同）' },
  { cmd: '#假面骑士更新', desc: '更新插件（主人专用，加“强制”可丢弃本地改动）' },
  { cmd: '#骑士帮助', desc: '查看本帮助' },
]

export class KRHelp extends plugin {
  constructor() {
    super({
      name: '假面骑士帮助',
      dsc: '假面骑士插件帮助',
      event: 'message',
      priority: 600,
      rule: [
        {
          reg: '^#?(假面)?骑士(插件)?帮助$',
          fnc: 'help',
        },
      ],
    })
  }

  async help(e) {
    const img = await renderHelp(CMDS)
    if (img) {
      await e.reply(img)
      return true
    }
    // 渲染失败兜底为文字
    const msg = [
      '【假面骑士插件】指令一览',
      '━━━━━━━━━━━━',
      ...CMDS.map(c => `${c.cmd}　${c.desc}`),
      '━━━━━━━━━━━━',
      '数据来源：Kamen Rider Wiki (Fandom)',
      `版本：v${getPluginVersion()}`,
    ].join('\n')
    await e.reply(msg)
    return true
  }
}
