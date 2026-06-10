import plugin from '../../../lib/plugins/plugin.js'
import { getRider } from '../model/fandom.js'
import { renderRider } from '../model/render.js'
import { getConfig } from '../model/config.js'

export class KRQuery extends plugin {
  constructor() {
    super({
      name: '假面骑士查询',
      dsc: '假面骑士图鉴查询',
      event: 'message',
      priority: 600,
      rule: [
        {
          reg: '^#?(假面骑士|骑士图鉴)\\s*(.+)$',
          fnc: 'query',
        },
      ],
    })
  }

  async query(e) {
    if (getConfig().enable === false) return false

    const name = e.msg.replace(/^#?(假面骑士|骑士图鉴)\s*/, '').trim()
    if (!name) {
      await e.reply('要查哪位骑士？例：#假面骑士 Geats 或 #假面骑士 电王')
      return true
    }

    await e.reply(`正在检索「${name}」，稍等喵～`, false, { recallMsg: 8 })

    let rider
    try {
      rider = await getRider(name)
    } catch (err) {
      logger.error('[假面骑士] 查询异常:', err)
      await e.reply('检索失败了，可能是数据源抽风，待会再试试～')
      return true
    }

    if (!rider) {
      await e.reply(`没找到「${name}」，换个写法试试？（中文常见骑士或英文名都行）`)
      return true
    }

    const img = await renderRider(rider, '图鉴查询')
    if (img) {
      await e.reply(img)
    } else {
      await e.reply(`【${rider.title}】\n${rider.summary}\n\n详情：${rider.url}`)
    }
    return true
  }
}
