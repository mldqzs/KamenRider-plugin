import fs from 'node:fs'
import yaml from 'yaml'
import lodash from 'lodash'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const _dir = dirname(fileURLToPath(import.meta.url))
const defPath = join(_dir, 'config/defSet_config/config.yaml')
const cfgDir = join(_dir, 'config/config')
const cfgPath = join(cfgDir, 'config.yaml')

function readCfg() {
  const def = yaml.parse(fs.readFileSync(defPath, 'utf8')) || {}
  let usr = {}
  try { usr = yaml.parse(fs.readFileSync(cfgPath, 'utf8')) || {} } catch {}
  return { ...def, ...usr }
}

export function supportGuoba() {
  return {
    pluginInfo: {
      name: 'KamenRider-plugin',
      title: '假面骑士插件',
      author: 'mldqzs',
      authorLink: 'https://github.com/mldqzs',
      link: '',
      isV3: true,
      isV2: false,
      description: '假面骑士图鉴查询与娱乐',
      icon: 'mdi:motorbike',
      iconColor: '#c1272d',
    },
    configInfo: {
      schemas: [
        { component: 'Divider', label: '假面骑士设置' },
        {
          field: 'enable',
          label: '插件总开关',
          bottomHelpMessage: '关闭后所有假面骑士指令停用',
          component: 'Switch',
        },
        {
          field: 'dailyEnable',
          label: '每日一骑开关',
          bottomHelpMessage: '是否启用「#每日一骑」',
          component: 'Switch',
        },
        {
          field: 'summaryLen',
          label: '简介最大字数',
          bottomHelpMessage: '卡片简介超出该字数后截断',
          component: 'InputNumber',
          componentProps: { min: 40, max: 500, placeholder: '请输入整数' },
        },
        { component: 'Divider', label: '简介翻译（数据源为英文 Wiki）' },
        {
          field: 'translate',
          label: '翻译英文简介为中文',
          bottomHelpMessage: '翻译失败时自动回退英文原文，不影响其他功能',
          component: 'Switch',
        },
        {
          field: 'translateProvider',
          label: '翻译服务',
          bottomHelpMessage: 'mymemory：免注册免 Key、国内可直连、开箱即用；baidu：质量更好但需申请下方 Key。任一失败会自动尝试另一个',
          component: 'Select',
          componentProps: {
            options: [
              { label: 'MyMemory（免费免 Key，推荐）', value: 'mymemory' },
              { label: '百度翻译（需申请 Key）', value: 'baidu' },
            ],
          },
        },
        {
          field: 'baiduAppid',
          label: '百度翻译 APP ID',
          bottomHelpMessage: '仅「百度翻译」需要。申请地址：https://fanyi-api.baidu.com/ （免费额度）',
          component: 'Input',
          componentProps: { placeholder: '请输入百度翻译 APP ID' },
        },
        {
          field: 'baiduKey',
          label: '百度翻译 密钥',
          bottomHelpMessage: '百度翻译开放平台的密钥',
          component: 'InputPassword',
          componentProps: { placeholder: '请输入百度翻译密钥' },
        },
        { component: 'Divider', label: '本地缓存（省翻译额度、提速）' },
        {
          field: 'cacheEnable',
          label: '启用本地缓存',
          bottomHelpMessage: '按 pageid 缓存翻译后简介+图片+信息框，重复查询直接复用，省翻译额度',
          component: 'Switch',
        },
        {
          field: 'cacheTTL',
          label: '缓存有效期（天）',
          bottomHelpMessage: '超过该天数后重新抓取翻译；插件数据更新不频繁，可设大一些',
          component: 'InputNumber',
          componentProps: { min: 1, max: 3650, placeholder: '默认 30' },
        },
      ],
      getConfigData() {
        return readCfg()
      },
      setConfigData(data, { Result }) {
        const cfg = lodash.merge({}, readCfg(), data)
        if (!fs.existsSync(cfgDir)) fs.mkdirSync(cfgDir, { recursive: true })
        fs.writeFileSync(cfgPath, yaml.stringify(cfg), 'utf8')
        return Result.ok({}, '保存成功~')
      },
    },
  }
}
