import plugin from '../../../lib/plugins/plugin.js'
import { getRider } from '../model/fandom.js'
import { renderRider } from '../model/render.js'
import { getConfig } from '../model/config.js'
import { RIDERS } from '../resources/riders.js'

// 日期种子 → 当日固定索引（全 Bot 当天同一位「每日一骑」）
function dailyIndex() {
  const d = new Date()
  const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  let h = 0
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % RIDERS.length
}

export class KRRandom extends plugin {
  constructor() {
    super({
      name: '随机假面骑士',
      dsc: '随机/每日 假面骑士',
      event: 'message',
      priority: 600,
      rule: [
        {
          reg: '^#?随机(假面)?骑士$',
          fnc: 'random',
        },
        {
          reg: '^#?每日一骑$',
          fnc: 'daily',
        },
      ],
    })
  }

  async random(e) {
    if (getConfig().enable === false) return false
    const pick = RIDERS[Math.floor(Math.random() * RIDERS.length)]
    return this._send(e, pick, '随机骑士')
  }

  async daily(e) {
    if (getConfig().enable === false) return false
    if (getConfig().dailyEnable === false) {
      await e.reply('每日一骑功能已关闭~')
      return true
    }
    const pick = RIDERS[dailyIndex()]
    return this._send(e, pick, '每日一骑')
  }

  async _send(e, pick, tag) {
    let rider
    try {
      rider = await getRider(pick.q)
    } catch (err) {
      logger.error('[假面骑士] 获取异常:', err)
    }
    if (!rider) {
      await e.reply(`今天抽到了 ${pick.name}，但数据源没拉到详情，待会再试试~`)
      return true
    }

    const img = await renderRider(rider, tag)
    if (img) {
      await e.reply(img)
    } else {
      await e.reply(`【${rider.title}】\n${rider.summary}\n\n详情：${rider.url}`)
    }
    return true
  }
}
