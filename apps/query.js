import plugin from '../../../lib/plugins/plugin.js'
import { getRider, getDetail } from '../model/fandom.js'
import { renderRider, renderDetail } from '../model/render.js'
import { getConfig } from '../model/config.js'
import { clearCache } from '../model/cache.js'

export class KRQuery extends plugin {
  constructor() {
    super({
      name: '假面骑士查询',
      dsc: '假面骑士图鉴查询',
      event: 'message',
      priority: 600,
      rule: [
        {
          reg: '^#?(假面骑士|骑士)清(理|空)?缓存$',
          fnc: 'clearCache',
          permission: 'master',
        },
        {
          // 详情：#假面骑士 Geats 详情 / #骑士详情 电王
          reg: '^#?(假面骑士|骑士)(图鉴)?\\s*(详情\\s*.+|.+?\\s*详情)$',
          fnc: 'detail',
        },
        {
          reg: '^#?(假面骑士|骑士图鉴)\\s*(.+)$',
          fnc: 'query',
        },
      ],
    })
  }

  async clearCache(e) {
    const n = clearCache()
    await e.reply(`已清空假面骑士缓存，共删除 ${n} 条。`)
    return true
  }

  async detail(e) {
    if (getConfig().enable === false) return false

    const name = e.msg
      .replace(/^#?(假面骑士|骑士)(图鉴)?/, '')
      .replace(/详情/, '')
      .trim()
    if (!name) {
      await e.reply('要查哪位骑士的详情？例：#假面骑士 Geats 详情')
      return true
    }

    await e.reply(`正在整理「${name}」的形态与装备，稍等喵～`, false, { recallMsg: 8 })

    let detail
    try {
      detail = await getDetail(name)
    } catch (err) {
      logger.error('[假面骑士] 详情查询异常:', err)
      await e.reply('检索失败了，可能是数据源抽风，待会再试试～')
      return true
    }

    if (!detail) {
      await e.reply(`没找到「${name}」，换个写法试试？（中文常见骑士或英文名都行）`)
      return true
    }

    const img = await renderDetail(detail)
    if (img) {
      await e.reply(img)
    } else {
      const join = (t, a) => (a && a.length ? `${t}：${a.join('、')}\n` : '')
      await e.reply(
        `【${detail.title} 详情】\n` +
          join('变身器', detail.devices) +
          join('武器', detail.weapons) +
          join('形态', detail.forms) +
          join('终结技', detail.finishers) +
          `详情：${detail.url}`,
      )
    }
    return true
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
