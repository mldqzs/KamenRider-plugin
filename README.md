# KamenRider-plugin

> 基于 [TRSS-Yunzai](https://github.com/TimeRainStarSky/Yunzai) 的假面骑士图鉴查询插件。

## 功能概述

- **图鉴查询**：中文常见名或英文名均可查询，返回图片卡片，含本体形态图、中文简介、首播年份 / 世代 / 话数 / 电视台等资料。
- **详情查询**：查骑士的形态、终结技、变身器、武器、载具。
- **娱乐**：随机骑士 / 每日一骑。
- **中文友好**：英文 Wiki 简介自动翻译为中文，并经术语对照表规范专有名词；卡片标题、系列名本地化。
- **本地缓存**：查询结果按词条缓存（翻译后简介 + 图片 + 结构化信息），重复查询直接复用，提速并节省翻译额度。
- **锅巴面板**：主要配置支持可视化修改与热加载。

| 指令 | 说明 |
| --- | --- |
| `#假面骑士 <名字>` | 图鉴查询（如 `#假面骑士 Geats`、`#假面骑士 电王`） |
| `#假面骑士 <名字> 详情` | 形态 / 终结技 / 变身器 / 武器 / 载具 |
| `#随机骑士` | 随机来一位假面骑士 |
| `#每日一骑` | 当日固定的一位骑士（全 Bot 当天相同） |
| `#骑士帮助` | 查看指令一览 |
| `#假面骑士清缓存` | 清空本地缓存（仅主人） |

## 安装方式

进入云崽根目录，克隆本插件到 `plugins` 目录（二选一）：

```bash
# GitHub
git clone --depth=1 https://github.com/mldqzs/KamenRider-plugin ./plugins/KamenRider-plugin

# Gitee
git clone --depth=1 https://gitee.com/aayhg/kamen-rider-plugin ./plugins/KamenRider-plugin
```

再在根目录安装依赖并重启：

```bash
pnpm install
```

> 请务必用 `git clone` 安装（如上），这样插件目录是带远程上游的 git 仓库，云崽本体的更新指令才能识别并更新它。

## 更新方式

本插件是标准 git 仓库，下列方式均可更新：

- `#假面骑士更新` —— 更新本插件（主人专用，`#假面骑士强制更新` 可丢弃本地改动）
- `#假面骑士更新日志` —— 查看最近更新记录
- 云崽本体指令同样适用：`#全部更新` 会一并更新本插件；`#更新KamenRider-plugin`、`#强制更新KamenRider-plugin` 可单独更新（注意此处用插件目录名，非中文名）

## 翻译配置

数据源为英文 Wiki，简介默认翻译为中文。配置可在 `锅巴面板` 修改，或编辑 `config/config/config.yaml`：

| 字段 | 说明 | 默认 |
| --- | --- | --- |
| `translate` | 是否翻译英文简介为中文 | `true` |
| `translateProvider` | 翻译服务：`mymemory` / `baidu` | `mymemory` |
| `baiduAppid` / `baiduKey` | 百度翻译密钥（仅 `baidu` 需要） | 空 |

- **MyMemory**（默认）：免注册、免 Key、国内可直连，开箱即用，匿名约 5000 字/天。
- **百度翻译**：质量更好，需到 [百度翻译开放平台](https://fanyi-api.baidu.com/) 申请 `appid`/`key`（有免费额度）填入，并把 `translateProvider` 切到 `baidu`。
- 任一服务失败会自动尝试另一个，全部失败则回退英文原文，不影响其他功能。

## 友情链接

- [TRSS-Yunzai](https://github.com/TimeRainStarSky/Yunzai) · [Gitee 镜像](https://gitee.com/TimeRainStarSky/Yunzai) —— 本插件依赖的机器人框架
- [Kamen Rider Wiki (Fandom)](https://kamenrider.fandom.com) —— 数据来源，内容遵循 [CC BY-SA](https://www.fandom.com/licensing) 许可，准确性与可用性由该来源决定

## 免责声明

- 本插件仅供学习与个人娱乐使用，请勿用于商业或违规用途。
- 插件不存储、不修改源站内容，仅做查询与展示；数据版权归原 Wiki 及其贡献者所有。
- 「假面骑士 / Kamen Rider」相关名称与形象版权归东映（Toei）及石森プロ所有，本插件与版权方无任何关联。
