// NOTE: 從 poedb.tw/tw/ 批量抓取 POE 繁體中文翻譯資料（天賦基石、輿圖天賦、昇華職業等）
// 執行方式：node data/fetch-poedb.js
// 完成後請執行：node data/build-translation.js 重建字庫

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, 'raw', 'poedb-passives.json')

// NOTE: 請求間隔（ms），避免對 poedb.tw 造成過大負擔
const DELAY_MS = 500

const sleep = ms => new Promise(r => setTimeout(r, ms))

// NOTE: poedb.tw 的個別項目連結使用「相對路徑」格式，例如：
//   <a href="Eldritch_Gateway">異能大門</a>
//   而非 /tw/Eldritch_Gateway
//
// 過濾原則：
//   1. href 必須是相對路徑（不含 / 或 # 開頭，不含 http）
//   2. 連結文字必須含有 CJK 中文字元
//   3. slug 必須看起來像一個具名遊戲內容（PascalCase，首字母大寫）
//   4. 跳過明顯的導覽詞（Maps, Items, Gem, Quest... 等）

// NOTE: 常見導覽連結 slug 黑名單（避免誤抓導覽列項目）
const SKIP_SLUGS = new Set([
  'Maps', 'Items', 'Quest', 'Economy', 'Atlas',
  'Currency', 'Oil', 'Oils', 'Flask', 'Flasks', 'Weapon', 'Weapons',
  'Armour', 'Armours', 'Jewel', 'Jewels', 'Map', 'Fragment',
  'Fragments', 'Scarab', 'Scarabs', 'Essence', 'Essences',
  'Fossil', 'Fossils', 'Resonator', 'Resonators', 'Incubator',
  'Incubators', 'Catalyst', 'Catalysts', 'Prophecy', 'Prophecies',
  'Keystone', 'Keystones',
  'Atlas_passive_skill', 'Passive_mastery', 'Ascendancy_class',
  // NOTE: 寶石分類頁（抓取目標，不應被誤抓為單個條目）
  'Skill_Gems', 'Support_Gems', 'Transfigured_Gems', 'Gem_Tag',
])

function extractPairs(html, opts = {}) {
  const pairs = {}
  // NOTE: 寶石分類頁使用 /tw/GemName 絕對路徑，其他分類頁使用相對路徑
  const re = opts.twPrefix
    ? /<a\s[^>]*?href="\/tw\/([A-Za-z][A-Za-z0-9_'\-.()]*)"[^>]*?>([^<]{1,80})<\/a>/g
    : /<a\s[^>]*?href="([A-Za-z][A-Za-z0-9_'\-.()]*)"[^>]*?>([^<]{1,80})<\/a>/g
  let m
  while ((m = re.exec(html)) !== null) {
    const slug = m[1]
    const rawText = m[2]
    const text = rawText
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#\d+;/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    // 過濾：只接受含有 CJK 中文字元的連結文字
    if (!/[\u4e00-\u9fff]/.test(text)) continue
    // 過濾：文字不得過短
    if (text.length < 2) continue
    // 過濾：slug 必須首字母大寫（像 PascalCase 具名內容）
    if (!/^[A-Z]/.test(slug)) continue
    // 過濾：跳過黑名單 slug
    if (SKIP_SLUGS.has(slug)) continue
    // 過濾：跳過含有特殊字元的文字
    if (/[<>{}[\]|\\]/.test(text)) continue

    // 英文名：底線→空格（Eldritch_Gateway → "Eldritch Gateway"）
    // 同時處理 URL 百分比編碼（如 %27 → '）
    const enName = decodeURIComponent(slug).replace(/_/g, ' ')

    // 不覆蓋已存在的 key（保留第一個出現的翻譯）
    if (!pairs[enName]) {
      pairs[enName] = text
    }
  }
  return pairs
}

async function fetchPage(url, label, opts = {}) {
  process.stdout.write(`  → ${label}...`)
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8'
      }
    })
    if (!res.ok) { console.log(` ✗ HTTP ${res.status}`); return {} }
    const html = await res.text()
    const pairs = extractPairs(html, opts)
    console.log(` ${Object.keys(pairs).length} 筆`)
    return pairs
  } catch (e) {
    console.log(` ✗ ${e.message}`)
    return {}
  }
}

async function main() {
  console.log('=== 從 poedb.tw/tw/ 抓取 POE 繁體中文翻譯資料 ===\n')

  const result = {}

  // NOTE: 抓取目標頁面清單
  //   每個列表頁包含多個項目，連結使用相對路徑（無 /tw/ 前綴）
  const targets = [
    {
      url: 'https://poedb.tw/tw/Keystone',
      label: '天賦基石（Keystones）'
    },
    {
      url: 'https://poedb.tw/tw/Atlas_passive_skill',
      label: '輿圖天賦（Atlas Passive Skills）'
    },
    {
      url: 'https://poedb.tw/tw/Passive_mastery',
      label: '天賦專精（Passive Masteries）'
    },
    {
      url: 'https://poedb.tw/tw/Ascendancy_class',
      label: '昇華職業（Ascendancy Classes）'
    },
    {
      url: 'https://poedb.tw/tw/Notable',
      label: '著名天賦（Notable Passives，含膏抹天賦）'
    },
    {
      url: 'https://poedb.tw/tw/Oil',
      label: '護符塗抹天賦（Oil Anoints）'
    },
    {
      url: 'https://poedb.tw/tw/Skill_Gems',
      label: '主動技能寶石（Skill Gems）',
      twPrefix: true
    },
    {
      url: 'https://poedb.tw/tw/Support_Gems',
      label: '輔助技能寶石（Support Gems）',
      twPrefix: true
    },
    {
      url: 'https://poedb.tw/tw/Transfigured_Gems',
      label: '變形寶石（Transfigured Gems）',
      twPrefix: true
    },
  ]

  for (let i = 0; i < targets.length; i++) {
    const { url, label, twPrefix } = targets[i]
    console.log(`\n[${i + 1}/${targets.length}] ${label}`)
    const pairs = await fetchPage(url, url, { twPrefix })
    const before = Object.keys(result).length
    Object.assign(result, pairs)
    const added = Object.keys(result).length - before
    if (added > 0) console.log(`    （新增 ${added} 筆）`)
    if (i < targets.length - 1) await sleep(DELAY_MS)
  }

  const total = Object.keys(result).length
  console.log(`\n✓ 合計：${total} 筆英中對照`)

  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf-8')
  console.log(`✓ 已儲存至 data/raw/poedb-passives.json`)
  console.log('\n接下來請執行：node data/build-translation.js  重建翻譯字庫')
}

main().catch(console.error)
