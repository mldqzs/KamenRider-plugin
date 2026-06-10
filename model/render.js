import puppeteer from '../../../lib/puppeteer/puppeteer.js'
import { getPluginVersion, getYunzaiVersion } from './version.js'

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
    titleEn: rider.titleEn || '',
    meta: rider.meta || [],
    summary: rider.summary,
    transTip: rider.transTip || '',
    image: rider.image,
    url: rider.url,
    pluginVersion: getPluginVersion(),
  }
  return puppeteer.screenshot('rider', data)
}

/**
 * 把骑士详情（形态/终结技/装备）渲染成图片卡片
 * @returns 图片 segment，失败返回 false
 */
export async function renderDetail(detail) {
  const data = {
    tplFile: './plugins/KamenRider-plugin/resources/html/detail/detail.html',
    pluResPath: _path,
    saveId: 'detail',
    title: detail.title,
    titleEn: detail.titleEn || '',
    meta: detail.meta || [],
    devices: detail.devices || [],
    weapons: detail.weapons || [],
    vehicles: detail.vehicles || [],
    forms: detail.forms || [],
    finishers: detail.finishers || [],
    url: detail.url,
    pluginVersion: getPluginVersion(),
  }
  return puppeteer.screenshot('detail', data)
}

/**
 * 渲染帮助卡片
 * @param {Array<{cmd, desc}>} cmds 指令列表
 * @returns 图片 segment，失败返回 false
 */
export async function renderHelp(cmds) {
  const data = {
    tplFile: './plugins/KamenRider-plugin/resources/html/help/help.html',
    pluResPath: _path,
    saveId: 'help',
    cmds,
    yunzaiVersion: getYunzaiVersion(),
    pluginVersion: getPluginVersion(),
  }
  return puppeteer.screenshot('help', data)
}
