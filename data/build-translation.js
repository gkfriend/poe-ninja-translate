// NOTE: 此腳本將 cmn-Hant 原始資料解析並合併為插件可用的 translation.json
// 執行方式：node data/build-translation.js

import { readFileSync, writeFileSync, createReadStream, existsSync } from 'fs'
import { createInterface } from 'readline'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RAW_DIR = join(__dirname, 'raw')
const DIST_DIR = join(__dirname, 'dist')

// 解析 NDJSON 檔案（每行一個 JSON 物件）
async function parseNdjson(filePath) {
  const results = []
  const rl = createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity
  })
  for await (const line of rl) {
    const trimmed = line.trim()
    if (trimmed) {
      try {
        results.push(JSON.parse(trimmed))
      } catch {
        // 跳過解析失敗的行
      }
    }
  }
  return results
}

// 從 client_strings.js 提取純字串對應（跳過 RegExp）
function parseClientStrings(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const result = {}
  // 匹配 KEY: '值' 格式（跳過 RegExp）
  const matches = content.matchAll(/^\s+(\w+):\s+'([^']+)',?$/gm)
  for (const m of matches) {
    result[m[1]] = m[2]
  }
  return result
}

async function main() {
  console.log('[1/4] 解析 items.ndjson...')
  const items = await parseNdjson(join(RAW_DIR, 'items.ndjson'))

  // items 字典：英文名 -> 繁體中文名
  const itemMap = {}
  for (const item of items) {
    if (item.refName && item.name && item.refName !== item.name) {
      itemMap[item.refName] = item.name
    }
  }
  console.log(`  → ${Object.keys(itemMap).length} 筆物品翻譯`)

  console.log('[2/4] 解析 stats.ndjson...')
  const stats = await parseNdjson(join(RAW_DIR, 'stats.ndjson'))

  // stats 字典：英文詞綴 ref -> 繁體中文（取第一個 matcher）
  // NOTE: stats.ndjson 有兩種格式：
  //   1. 平坦格式：{ ref, matchers, ... }
  //   2. resolve 包裝格式：{ resolve: {...}, stats: [{ ref, matchers, ... }, ...] }
  const statMap = {}
  function processStatEntry(stat) {
    if (stat.ref && stat.matchers && stat.matchers.length > 0) {
      const firstMatcher = stat.matchers[0]
      if (firstMatcher.string && firstMatcher.string !== stat.ref) {
        // NOTE: 不覆蓋已存在的 key（保留第一個出現的翻譯）
        if (!statMap[stat.ref]) {
          statMap[stat.ref] = firstMatcher.string
        }
      }
    }
  }
  for (const entry of stats) {
    if (entry.resolve && Array.isArray(entry.stats)) {
      // resolve 包裝格式：展開 stats 陣列
      for (const stat of entry.stats) {
        processStatEntry(stat)
      }
    } else {
      // 平坦格式
      processStatEntry(entry)
    }
  }
  console.log(`  → ${Object.keys(statMap).length} 筆詞綴翻譯`)

  console.log('[3/4] 解析 client_strings.js...')
  const clientStrings = parseClientStrings(join(RAW_DIR, 'client_strings.js'))
  console.log(`  → ${Object.keys(clientStrings).length} 筆 UI 字串翻譯`)

  console.log('[4/4] 解析 app_i18n.json...')
  const appI18n = JSON.parse(readFileSync(join(RAW_DIR, 'app_i18n.json'), 'utf-8'))
  console.log(`  → ${Object.keys(appI18n).length} 筆應用字串翻譯`)

  console.log('[5/5] 解析 poedb-passives.json（若存在）...')
  let passiveMap = {}
  const passivePath = join(RAW_DIR, 'poedb-passives.json')
  if (existsSync(passivePath)) {
    passiveMap = JSON.parse(readFileSync(passivePath, 'utf-8'))
    console.log(`  → ${Object.keys(passiveMap).length} 筆天賦/輿圖天賦翻譯`)
  } else {
    console.log('  → 未找到（執行 node data/fetch-poedb.js 可下載）')
  }

  // NOTE: 設備基底類型清單（用於在 content.js 中辨識並隱藏傳奇物品副標題）
  //   條件：namespace = ITEM + 有 craftable 欄位（代表可製作的裝備基底，非通貨/化石/地圖等）
  const baseTypes = items
    .filter(item => item.namespace === 'ITEM' && item.craftable && item.refName)
    .map(item => item.refName)
  console.log(`  → ${baseTypes.length} 筆設備基底類型（用於隱藏副標題）`)

  // 合併成最終翻譯字典
  const translation = {
    // 元資料
    _meta: {
      source: 'SnosMe/awakened-poe-trade (cmn-Hant) + poedb.tw',
      generated: new Date().toISOString(),
      counts: {
        items: Object.keys(itemMap).length,
        stats: Object.keys(statMap).length,
        clientStrings: Object.keys(clientStrings).length,
        appI18n: Object.keys(appI18n).length,
        passives: Object.keys(passiveMap).length,
        baseTypes: baseTypes.length
      }
    },
    // 物品名稱對照（英文 -> 繁體中文）
    items: itemMap,
    // 詞綴對照（英文 ref -> 繁體中文）
    stats: statMap,
    // 遊戲 UI 字串（稀有度、屬性標籤等）
    clientStrings,
    // 應用 UI 字串
    appI18n,
    // 天賦/輿圖天賦/昇華職業對照（來源：poedb.tw，執行 fetch-poedb.js 取得）
    passives: passiveMap,
    // NOTE: 設備基底類型 refName 陣列（用於隱藏傳奇物品列表中的副標題）
    //   隱藏條件：同一容器中有已翻譯的傳奇名稱（.pnt-zh-name），才確認為副標題
    baseTypes
  }

  const outputPath = join(DIST_DIR, 'translation.json')
  writeFileSync(outputPath, JSON.stringify(translation, null, 2), 'utf-8')

  const sizeKb = Math.round(
    Buffer.byteLength(JSON.stringify(translation)) / 1024
  )
  console.log(`\n✓ 完成！輸出至 data/dist/translation.json（${sizeKb} KB）`)
  console.log(`  物品：${Object.keys(itemMap).length} 筆`)
  console.log(`  詞綴：${Object.keys(statMap).length} 筆`)
  console.log(`  天賦/輿圖天賦：${Object.keys(passiveMap).length} 筆`)
}

main().catch(console.error)
