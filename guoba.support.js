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
