import puppeteer from '../../../lib/puppeteer/puppeteer.js'
import { getPluginVersion } from './version.js'

const _path = process.cwd().replace(/\\/g, '/')

/**
 * 把骑士数据渲染成图片卡片
 * @param {{title, summary, image, url}} rider
 * @param {string} tag 左上角标签，如「图鉴查询 / 随机骑士 / 每日一骑」
 * @returns 图片 segment，失败返回 false
 */
export async function renderRider(rider, tag = '图鉴查询') {
  const data = {
    tplFile: './plugins/KamenRider-plugin/resources/html/rider/rider.html',
    pluResPath: _path,
    saveId: 'rider',
    tag,
    title: rider.title,
    summary: rider.summary,
    image: rider.image,
    url: rider.url,
    pluginVersion: getPluginVersion(),
  }
  return puppeteer.screenshot('rider', data)
}
