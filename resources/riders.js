/**
 * 内置主役假面骑士清单（用于「随机骑士 / 每日一骑」）
 * 及 中文/常见叫法 → Fandom 搜索词 的别名表（用于查询时把中文映射到英文词条）
 *
 * Fandom 角色页标题多为「Kamen Rider Xxx (Rider)」，直接用作搜索词命中率最高。
 */

// { 显示名, 搜索词 }
export const RIDERS = [
  // —— 令和 Reiwa ——
  { name: 'Zero-One', q: 'Kamen Rider Zero-One (Rider)' },
  { name: 'Saber', q: 'Kamen Rider Saber (Rider)' },
  { name: 'Revice', q: 'Kamen Rider Revi' },
  { name: 'Geats', q: 'Kamen Rider Geats (Rider)' },
  { name: 'Gotchard', q: 'Kamen Rider Gotchard (Rider)' },
  { name: 'Gavv', q: 'Kamen Rider Gavv (Rider)' },
  // —— 平成 Heisei ——
  { name: 'Kuuga', q: 'Kamen Rider Kuuga (Rider)' },
  { name: 'Agito', q: 'Kamen Rider Agito (Rider)' },
  { name: 'Ryuki', q: 'Kamen Rider Ryuki (Rider)' },
  { name: 'Faiz', q: 'Kamen Rider Faiz' },
  { name: 'Blade', q: 'Kamen Rider Blade (Rider)' },
  { name: 'Hibiki', q: 'Kamen Rider Hibiki (Rider)' },
  { name: 'Kabuto', q: 'Kamen Rider Kabuto (Rider)' },
  { name: 'Den-O', q: 'Kamen Rider Den-O (Rider)' },
  { name: 'Kiva', q: 'Kamen Rider Kiva (Rider)' },
  { name: 'Decade', q: 'Kamen Rider Decade (Rider)' },
  { name: 'Double', q: 'Kamen Rider Double (Rider)' },
  { name: 'OOO', q: 'Kamen Rider OOO (Rider)' },
  { name: 'Fourze', q: 'Kamen Rider Fourze (Rider)' },
  { name: 'Wizard', q: 'Kamen Rider Wizard (Rider)' },
  { name: 'Gaim', q: 'Kamen Rider Gaim (Rider)' },
  { name: 'Drive', q: 'Kamen Rider Drive (Rider)' },
  { name: 'Ghost', q: 'Kamen Rider Ghost (Rider)' },
  { name: 'Ex-Aid', q: 'Kamen Rider Ex-Aid (Rider)' },
  { name: 'Build', q: 'Kamen Rider Build (Rider)' },
  { name: 'Zi-O', q: 'Kamen Rider Zi-O (Rider)' },
  // —— 昭和 Showa（代表） ——
  { name: 'Ichigo', q: 'Kamen Rider Ichigo (Rider)' },
  { name: 'V3', q: 'Kamen Rider V3 (Rider)' },
  { name: 'X', q: 'Kamen Rider X (Rider)' },
  { name: 'Amazon', q: 'Kamen Rider Amazon (Rider)' },
  { name: 'Stronger', q: 'Kamen Rider Stronger (Rider)' },
  { name: 'Super-1', q: 'Kamen Rider Super-1 (Rider)' },
  { name: 'ZO', q: 'Kamen Rider ZO (Rider)' },
  { name: 'BLACK', q: 'Kamen Rider Black (Rider)' },
  { name: 'BLACK RX', q: 'Kamen Rider Black RX (Rider)' },
]

// 中文/常见别名 → Fandom 搜索词
const ALIAS = {
  // 令和
  '零一': 'Kamen Rider Zero-One (Rider)', '01': 'Kamen Rider Zero-One (Rider)', '零之一': 'Kamen Rider Zero-One (Rider)',
  '圣刃': 'Kamen Rider Saber (Rider)', '剑斗': 'Kamen Rider Saber (Rider)',
  '利维斯': 'Kamen Rider Revi', '复活': 'Kamen Rider Revi',
  'geats': 'Kamen Rider Geats (Rider)', '极狐': 'Kamen Rider Geats (Rider)', '狐骑': 'Kamen Rider Geats (Rider)',
  '加查德': 'Kamen Rider Gotchard (Rider)', '炼金': 'Kamen Rider Gotchard (Rider)',
  '加布': 'Kamen Rider Gavv (Rider)',
  // 平成
  '空我': 'Kamen Rider Kuuga (Rider)',
  '亚极陀': 'Kamen Rider Agito (Rider)', '阿基多': 'Kamen Rider Agito (Rider)',
  '龙骑': 'Kamen Rider Ryuki (Rider)',
  '555': 'Kamen Rider Faiz', '法伊兹': 'Kamen Rider Faiz', 'faiz': 'Kamen Rider Faiz',
  '剑': 'Kamen Rider Blade (Rider)', 'blade': 'Kamen Rider Blade (Rider)',
  '响鬼': 'Kamen Rider Hibiki (Rider)',
  '甲斗': 'Kamen Rider Kabuto (Rider)', '甲斗王': 'Kamen Rider Kabuto (Rider)',
  '电王': 'Kamen Rider Den-O (Rider)', 'deno': 'Kamen Rider Den-O (Rider)',
  '基途': 'Kamen Rider Kiva (Rider)', '月骑': 'Kamen Rider Kiva (Rider)',
  '帝骑': 'Kamen Rider Decade (Rider)', 'decade': 'Kamen Rider Decade (Rider)',
  'w': 'Kamen Rider Double (Rider)', '双骑': 'Kamen Rider Double (Rider)', 'double': 'Kamen Rider Double (Rider)',
  'ooo': 'Kamen Rider OOO (Rider)', '欧兹': 'Kamen Rider OOO (Rider)',
  '锻造': 'Kamen Rider Fourze (Rider)', 'fourze': 'Kamen Rider Fourze (Rider)',
  '巫骑': 'Kamen Rider Wizard (Rider)', 'wizard': 'Kamen Rider Wizard (Rider)',
  '铠武': 'Kamen Rider Gaim (Rider)', 'gaim': 'Kamen Rider Gaim (Rider)',
  '驱动': 'Kamen Rider Drive (Rider)', 'drive': 'Kamen Rider Drive (Rider)',
  '幽灵': 'Kamen Rider Ghost (Rider)', 'ghost': 'Kamen Rider Ghost (Rider)',
  'exaid': 'Kamen Rider Ex-Aid (Rider)', '艾克赛德': 'Kamen Rider Ex-Aid (Rider)',
  '创骑': 'Kamen Rider Build (Rider)', 'build': 'Kamen Rider Build (Rider)',
  '时王': 'Kamen Rider Zi-O (Rider)', 'zio': 'Kamen Rider Zi-O (Rider)',
  // 昭和
  '1号': 'Kamen Rider Ichigo (Rider)', '一号': 'Kamen Rider Ichigo (Rider)',
  'black': 'Kamen Rider Black (Rider)', '黑骑': 'Kamen Rider Black (Rider)',
  'rx': 'Kamen Rider Black RX (Rider)',
  '二号': 'Kamen Rider 2', '2号': 'Kamen Rider 2', 'nigo': 'Kamen Rider 2',
  'v3': 'Kamen Rider V3 (Rider)', '三号': 'Kamen Rider V3 (Rider)',
  'x': 'Kamen Rider X (Rider)', 'x骑士': 'Kamen Rider X (Rider)',
  '亚马逊': 'Kamen Rider Amazon (Rider)', 'amazon': 'Kamen Rider Amazon (Rider)',
  '强人': 'Kamen Rider Stronger (Rider)', 'stronger': 'Kamen Rider Stronger (Rider)',
  '超级一号': 'Kamen Rider Super-1 (Rider)', 'super1': 'Kamen Rider Super-1 (Rider)',
  'zo': 'Kamen Rider ZO (Rider)',
  '骑士人': 'Riderman', 'riderman': 'Riderman',
  '真': 'Kamen Rider Shin', 'shin': 'Kamen Rider Shin',
  'j': 'Kamen Rider J',
  // 平成 / 令和 二号·副骑士
  '盖兹': 'Kamen Rider Geiz', 'geiz': 'Kamen Rider Geiz',
  '瓦尔肯': 'Kamen Rider Vulcan', 'vulcan': 'Kamen Rider Vulcan',
  '瓦尔基里': 'Kamen Rider Valkyrie', 'valkyrie': 'Kamen Rider Valkyrie',
  '布雷兹': 'Kamen Rider Blades', 'blades': 'Kamen Rider Blades',
  '男爵': 'Kamen Rider Baron', 'baron': 'Kamen Rider Baron',
  '加速': 'Kamen Rider Accel', 'accel': 'Kamen Rider Accel',
  '马赫': 'Kamen Rider Mach', 'mach': 'Kamen Rider Mach',
  '流星': 'Kamen Rider Meteor', 'meteor': 'Kamen Rider Meteor',
  '比斯特': 'Kamen Rider Beast', 'beast': 'Kamen Rider Beast',
  '斯佩克特': 'Kamen Rider Specter', 'specter': 'Kamen Rider Specter',
  '诞生': 'Kamen Rider Birth', 'birth': 'Kamen Rider Birth',
  'knight': 'Kamen Rider Knight',
  'cross-z': 'Kamen Rider Cross-Z', 'crossz': 'Kamen Rider Cross-Z',
}

// 英文骑士名（去掉「Kamen Rider」前缀，小写） → 中文显示名
// 用于卡片标题本地化。键以 toLowerCase 归一，查不到则回退英文名。
// 同时被 glossary.js 复用，自动生成「Kamen Rider X → 假面骑士X」译后替换条目。
export const CN_NAME = {
  // 令和
  'zero-one': '零一', 'saber': '圣刃', 'revi': '利维斯', 'revice': '利维斯',
  'geats': '极狐', 'gotchard': '加查德', 'gavv': '加布',
  // 平成
  'kuuga': '空我', 'agito': '亚极陀', 'ryuki': '龙骑', 'faiz': '555',
  'blade': '剑', 'hibiki': '响鬼', 'kabuto': '甲斗', 'den-o': '电王',
  'kiva': '月骑', 'decade': '帝骑', 'double': 'W', 'ooo': '欧兹',
  'fourze': '锻造', 'wizard': '巫骑', 'gaim': '铠武', 'drive': '驱动',
  'ghost': '幽灵', 'ex-aid': '艾克赛德', 'build': '创骑', 'zi-o': '时王',
  // 昭和
  'ichigo': '一号', 'black': 'BLACK', 'black rx': 'BLACK RX',
  '2': '二号', 'v3': 'V3', 'x': 'X', 'amazon': '亚马逊', 'stronger': '强人',
  'super-1': '超级一号', 'zo': 'ZO', 'j': 'J', 'riderman': '骑士人', 'shin': '真',
  // 平成 / 令和 二号·副骑士（人气）
  'geiz': '盖兹', 'baron': '男爵', 'accel': '加速', 'mach': '马赫',
  'meteor': '流星', 'specter': '斯佩克特', 'vulcan': '瓦尔肯',
  'valkyrie': '瓦尔基里', 'blades': '布雷兹',
}

/**
 * 取骑士的中文显示名：传入 Fandom 标题（可含/不含「Kamen Rider」前缀及「(Rider)」后缀）。
 * 命中返回中文名，否则返回 null（由调用方回退英文名）。
 */
export function riderCnName(title) {
  if (!title) return null
  const key = String(title)
    .replace(/\s*\(Rider\)\s*/i, '')
    .replace(/^kamen\s*rider\s*/i, '')
    .trim()
    .toLowerCase()
  return CN_NAME[key] || null
}

/**
 * 把用户输入解析成 Fandom 搜索词：
 *   命中别名 → 返回对应英文词条；否则原样返回（让 Fandom 全文搜索处理）。
 */
export function resolveAlias(input) {
  if (!input) return ''
  let q = String(input).trim()
  const key = q.toLowerCase().replace(/^假面骑士|^kamen\s*rider/i, '').trim()
  if (ALIAS[key]) return ALIAS[key]
  if (ALIAS[q]) return ALIAS[q]
  // 英文输入但没写 Kamen Rider 前缀时补上，命中率更高
  if (/^[a-z0-9\- ]+$/i.test(q) && !/kamen\s*rider/i.test(q)) {
    return `Kamen Rider ${q}`
  }
  return q
}
