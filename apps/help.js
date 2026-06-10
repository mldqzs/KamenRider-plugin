import plugin from '../../../lib/plugins/plugin.js'
import { getPluginVersion } from '../model/version.js'

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
    const msg = [
      '【假面骑士插件】指令一览',
      '━━━━━━━━━━━━',
      '#假面骑士 <名字>　图鉴查询（中/英名均可，如 Geats、电王）',
      '#随机骑士　　　　随机来一位骑士',
      '#每日一骑　　　　今日份的骑士',
      '#骑士帮助　　　　查看本帮助',
      '━━━━━━━━━━━━',
      `数据来源：Kamen Rider Wiki (Fandom)`,
      `版本：v${getPluginVersion()}`,
    ].join('\n')
    await e.reply(msg)
    return true
  }
}
