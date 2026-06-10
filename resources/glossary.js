/**
 * 假面骑士术语对照表（机翻后处理）
 *
 * 背景：免费机翻（MyMemory 等）对骑士专有名词（系列名、变身器、招式、敌人组织）
 *      常「原样留英文」或「音译走样」，如 Rider Kick → 骑手踢踏板、Form → 形式。
 * 方案：对译文做「译后替换」——比「译前替换」更稳，不会打乱机翻语序。
 *      实测：先翻译再替换，可在保持通顺语序的同时把术语全部规范化。
 *
 * 两类规则：
 *   TERMS：英文 → 中文。机翻把专有名词留在英文时，按词替换为规范中文。
 *   FIXES：中文 → 中文。修订机翻常见错译（如「骑手踢」→「骑士踢」）。
 *
 * 扩展方式：直接往下面两个数组加条目即可，无需改其它代码。
 *   - 系列名（Kamen Rider Xxx）已由 resources/riders.js 的 CN_NAME 自动生成，
 *     新增骑士只需维护 CN_NAME，这里会自动带上。
 */
import { CN_NAME } from './riders.js'

// —— 英文残留 → 中文（跨系列通用术语 + 著名敌人/组织）——
const TERMS = [
  // 通用名词
  ['Kamen Rider', '假面骑士'],
  ['Masked Rider', '假面骑士'],
  ['Rider Kick', '骑士踢'],
  ['Rider Punch', '骑士拳'],
  ['Rider Slash', '骑士斩'],
  ['finishing move', '终结技'],
  ['finishing attack', '终结技'],
  ['finisher', '终结技'],
  ['Henshin', '变身'],
  ['transformation', '变身'],
  ['Kaijin', '怪人'],
  ['protagonist', '主角'],
  ['secondary Rider', '二号骑士'],
  ['primary Rider', '主役骑士'],
  ['main Rider', '主役骑士'],
  ['final form', '最终形态'],
  ['default form', '基本形态'],
  ['base form', '基本形态'],
  ['super form', '超级形态'],
  ['upgrade form', '强化形态'],
  ['hybrid form', '混合形态'],
  ['movie-exclusive', '剧场版限定'],
  ['transformation device', '变身器'],
  ['transformation belt', '变身腰带'],
  ['Legend Rider', '传说骑士'],
  ['Singularity Point', '奇点'],
  ['theme song', '主题曲'],
  // 著名组织 / 敌人（按系列）
  ['Shocker', '修卡'],
  ['Foundation X', 'X 基金会'],
  ['Greeed', '格里德'],
  ['Yummy', '亚米'],
  ['Worm', '虫族'],
  ['Orphnoch', '奥菲诺克'],
  ['Bugster', '巴格斯特'],
  ['Smash', '斯马修'],
  ['Roidmude', '类魂'],
  ['Time Jacker', '时间窃贼'],
  ['Horoscopes', '十二星宫'],
  ['Jamato', '贾马托'],
  ['Deadman', '死亡人'],
  ['Gifu', '吉夫'],
  ['Mirror Monster', '镜像怪物'],
  ['Undead', '不死者'],
  ['Makamou', '魔化魍'],
  ['Fangire', '牙血鬼'],
  ['Imagin', '异魔神'],
  ['Phantom', '幻影'],
  ['Inves', '因贝斯'],
  ['Helheim', '赫尔海姆'],
  ['Ganma', '眼魔'],
  ['Dopant', '掺杂者'],
]

// —— 中文错译 → 规范译名（修机翻常见走样）——
const FIXES = [
  ['骑手踢踏板', '骑士踢'],
  ['骑手踢', '骑士踢'],
  ['骑手', '骑士'],
  ['终结动作', '终结技'],
  ['必杀技动作', '必杀技'],
  ['转化为', '变身为'],
  ['转变为', '变身为'],
  ['变身成', '变身为'],
  ['各种形式', '各种形态'],
  ['默认形式', '基本形态'],
  ['默认形态', '基本形态'],
  ['最终形式', '最终形态'],
  ['蒙面骑士', '假面骑士'],
  ['面具骑士', '假面骑士'],
  ['化身为', '变身为'],
]

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

// 由 CN_NAME 自动生成「Kamen Rider Xxx → 假面骑士<中文名>」（含/不含连字符均匹配）
const SERIES = Object.entries(CN_NAME).map(([en, cn]) => [`Kamen Rider ${en}`, `假面骑士${cn}`])

// 合并英文条目：系列名 + 通用术语，按英文长度降序（长词优先，避免 Form 抢吃 Magnum Form）
const EN_RULES = [...SERIES, ...TERMS]
  .sort((a, b) => b[0].length - a[0].length)
  .map(([en, zh]) => {
    const head = /^[a-z0-9]/i.test(en) ? '\\b' : ''
    const tail = /[a-z0-9]$/i.test(en) ? '\\b' : ''
    return [new RegExp(head + escapeRe(en) + tail, 'gi'), zh]
  })

/**
 * 对译文做术语规范化：先把残留英文术语换成中文，再修订常见错译。
 * @param {string} zh 机翻得到的中文（可能夹带英文专有名词）
 * @returns {string} 规范化后的中文
 */
export function applyGlossary(zh) {
  if (!zh) return zh
  let t = String(zh)
  for (const [re, cn] of EN_RULES) t = t.replace(re, cn)
  for (const [a, b] of FIXES) t = t.split(a).join(b)
  return t
}
