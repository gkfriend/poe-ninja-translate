// NOTE: Content Script - 在 poe.ninja 頁面執行文字替換（英文 → 繁體中文）

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'META', 'LINK', 'SVG'])

let itemMap = null
let normalizedStatMap = null
let passiveMap = null   // NOTE: 天賦/輿圖天賦/昇華職業（來源：poedb.tw，雙語顯示）
let baseTypeSet = null  // NOTE: 設備基底類型（namespace=ITEM+craftable），用於隱藏傳奇物品副標題
let currentLang = 'en'
let observer = null
// NOTE: 防止同一容器在同一微任務批次中重複翻譯（每次 hover 清除後可重新翻）
var pendingTippySet = new WeakSet()

// ── 導覽選單、UI 文字、Tooltip 常見詞對照────────────────
const NAV_MAP = new Map([
  ['Currency', '通貨'], ['Currency & Splinters', '通貨與碎片'],
  ['Fragments', '碎片'], ['Scarabs', '聖甲蟲'], ['Oils', '油瓶'],
  ['Incubators', '孵化器'], ['Resonators', '共振器'],
  ['Essences', '精華'], ['Fossils', '化石'],
  ['Maps', '地圖'], ['Blighted Maps', '凋落地圖'],
  ['Blight-ravaged Maps', '凋落蔓延地圖'], ['Unique Maps', '傳奇地圖'],
  ['Beasts', '野獸'], ['Divination Cards', '命運卡'],
  ['Artifacts', '文物'], ['Memories', '記憶'],
  ['Cluster Jewels', '星團珠寶'], ['Unique Jewels', '傳奇珠寶'],
  ['Unique Flasks', '傳奇藥劑'], ['Unique Weapons', '傳奇武器'],
  ['Unique Armours', '傳奇護甲'], ['Unique Accessories', '傳奇飾品'],
  ['Equipment & Gems', '裝備與寶石'], ['Awakened Gems', '覺醒寶石'],
  ['Alternate Quality Gems', '替代品質寶石'], ['Atlas & Maps', '阿特拉斯與地圖'],
  ['Base Types', '基礎類型'], ['Helmet Enchants', '頭盔附魔'],
  ['Encounters', '遭遇戰'], ['Delirium Orbs', '譫妄玉'],
  ['Vials', '藥瓶'], ['Sentinel', '哨兵'], ['Tattoos', '刺青'],
  ['Charms', '魔符'], ['Omens', '預兆'],
  ['Builds', '配裝'], ['Skills', '技能'], ['Classes', '職業'],
  ['Keystones', '天賦基石'], ['Unique Items', '傳奇物品'],
  ['Economy', '物品價格'], ['Overview', '總覽'],
  ['Standard', '標準'], ['Softcore', '一般'], ['Hardcore', '硬核'],
  ['Name', '名稱'], ['Price', '價格'], ['Count', '數量'],
  ['Change', '變化'], ['Listing Count', '上架數量'],
  ['Total Change', '總變化'], ['Usage', '使用率'],
  ['Main Skill', '主要技能'], ['Class', '職業'], ['Rank', '排名'],
  ['Normal', '普通'], ['Magic', '魔法'], ['Rare', '稀有'],
  ['Unique', '傳奇'], ['Gem', '寶石'],
  ['Corrupted', '已汙染'], ['Unidentified', '未鑑定'], ['Mirrored', '已複製'],
  ['Rarity:', '稀有度:'], ['Item Level:', '物品等級:'],
  ['Stack Size:', '堆疊數量:'], ['Quality:', '品質:'],
  ['Sockets:', '插槽:'], ['Item Class:', '物品種類:'],
  ['Physical Damage:', '物理傷害:'], ['Elemental Damage:', '元素傷害:'],
  ['Critical Strike Chance:', '暴擊率:'], ['Attacks per Second:', '每秒攻擊次數:'],
  ['Armour:', '護甲:'], ['Evasion:', '閃避值:'],
  ['Energy Shield:', '能量護盾:'], ['Block:', '格擋率:'],
  ['Map Tier:', '地圖階級:'], ['Gem Level:', '等級:'],
  ['Requirements:', '需求:'], ['Requires Level', '需求等級'],
  ['Mana Cost:', '魔力消耗:'], ['Cast Time:', '施法時間:'],
  // NOTE: 新聯盟分類詞（原 NAV_MAP 缺漏）
  ['Forbidden Jewels', '禁忌珠寶'],
  ['Unique Relics', '傳奇聖物'],
  ['Wombgifts', '胎贈'],
  ['Runegrafts', '符文之結'],
  ['Allflame Embers', '不滅之火餘燼'],
  ['Skill Gems', '技能寶石'],
  // NOTE: poe.ninja 分類詞（NAV_MAP 原缺漏）
  ['Unique Tinctures', '傳奇萃取物'],
  ['Tinctures', '萃取物'],
  ['Invitations', '邀請書'],
  ['Invitation', '邀請書'],
  ['Temples', '神廟'],
  ['Offerings', '供品'],
  ['Sanctum Relics', '聖域聖物'],
  ['Coffins', '棺材'],
  ['Filled Coffins', '封印棺材'],
  ['Expedition Logbooks', '遠征航海日誌'],
  ['Heist Contracts', '入侵合約'],
  ['Heist Blueprints', '入侵藍圖'],
  ['Replicas', '複製品'],
  ['Omen', '預兆'],
  ['Charm', '魔符'],
  ['Tattoo', '刺青'],
  ['Scarab', '聖甲蟲'],
  ['League', '聯盟'],
  ['Item', '物品'],
  ['Gem', '寶石'],
  ['Flask', '藥劑'],
  ['Weapon', '武器'],
  ['Armour', '護甲'],
  ['Accessory', '飾品'],
  ['Jewel', '珠寶'],
  ['Map', '地圖'],
  ['Fragment', '碎片'],
  ['Currency', '通貨'],
  ['Essence', '精華'],
  ['Fossil', '化石'],
  ['Resonator', '共振器'],
  ['Incubator', '孵化器'],
  ['Catalyst', '催化劑'],
  ['Oil', '油'],
  ['Prophecy', '預言'],
  ['Divination Card', '命運卡'],
  ['Unique', '傳奇'],
  ['Rare', '稀有'],
  ['Magic', '魔法'],
  ['Normal', '普通'],
  // NOTE: 頁面 UI 文字補充
  ['View', '檢視'], ['Trade', '交易'], ['Compare', '比較'],
  ['Details', '詳細'], ['Graph', '圖表'], ['History', '歷史'],
  ['Ninja', '忍者'], ['Economy', '物品價格'],
  ['per', '每'], ['of', '的'], ['and', '與'],
  // NOTE: Builds 頁面左側 sidebar 分類標題（直接替換，不雙語）
  ['WEAPON CONFIGURATIONS', '武器配置'], ['Weapon Configurations', '武器配置'],
  ['ALL SKILLS', '全部技能'], ['All Skills', '全部技能'],
  ['MAIN SKILLS', '主要技能'], ['Main Skills', '主要技能'],
  ['KEYSTONES', '天賦基石'],
  ['BOSSING', '首領打法'], ['Bossing', '首領打法'],
  ['PLAY', '玩法'],
  ['PASSIVES', '天賦被動'], ['Passives', '天賦被動'],
  ['ASCENDANCY', '昇華職業'],
  ['ASCENDANCIES', '昇華職業'], ['Ascendancies', '昇華職業'],
  ['ATLAS', '阿特拉斯'],
  ['NOTES', '備注'], ['SOURCES', '資料來源'],
  // NOTE: Builds 頁面左側 sidebar 分類標題（補充）
  ['BANDITS', '海盜'], ['Bandits', '海盜'],
  ['PANTHEON', '萬神殿'], ['Pantheon', '萬神殿'],
  ['MASTERIES', '天賦專精'], ['Masteries', '天賦專精'],
  ['SECOND ASCENDANCY', '第二昇華'], ['Second Ascendancy', '第二昇華'],
  ['ANOINTED PASSIVES', '膏抹天賦'], ['Anointed Passives', '膏抹天賦'],
  // NOTE: 個人 Build 頁面導覽
  ['Back to search', '返回搜尋'],
  ['PROFILE', '個人資料'], ['Profile', '個人資料'],
  ['ACCOUNT', '帳號'], ['Account', '帳號'],
  // NOTE: 個人 Build 頁面 Stats 面板標籤
  ['Stats', '統計數據'],
  ['CHARACTER', '角色'], ['Attributes', '屬性'],
  ['Movement Speed', '移動速度'],
  ['Pantheon Major', '主神'], ['Pantheon Minor', '次神'],
  ['CHARGES', '充能'],
  ['Endurance charges', '耐久充能'],
  ['Frenzy charges', '狂怒充能'],
  ['Power charges', '能量充能'],
  ['DEFENSIVE', '防禦'],
  ['Life', '生命'], ['Energy shield', '能量護盾'],
  ['Ward', '守護'], ['Mana', '魔力'],
  ['Evasion rating', '閃避值'], ['Block', '格擋'],
  ['Spell Supression', '法術壓制'],
  ['Physical taken as', '物理傷害轉換'],
  ['Resistances', '抗性'],
  ['SIMULATED', '模擬'],
  ['Effective Health Pool', '有效生命池'],
  ['Max Hit', '最大承受'],
  ['SKILL DPS ESTIMATION', '技能傷害估算'],
  // NOTE: Builds 頁面 Overview 欄標籤
  ['ITEMS', '裝備'], ['Main Skills', '主技能'],
  ['Active Skills', '主動技能'], ['Support Gems', '輔助寶石'],
  ['Active Skill', '主動技能'],
])

// ── 通貨/物品描述文字對照（字庫中無收錄的固定描述句）────────
const ITEM_DESC_MAP = new Map([
  // 通用操作
  ['Right click to use.', '右鍵點擊使用。'],
  ['Right click to use. Can only be used by the intended recipient.', '右鍵點擊使用。只能由指定的接收者使用。'],
  ['Can be used in a personal Map Device.', '可在個人地圖裝置中使用。'],
  ['Cannot be used in a Map device.', '不可在地圖裝置中使用。'],
  ['Shift click to unstack.', '按住 Shift 點擊以拆開堆疊。'],
  ['Right click to sacrifice this item at an Altar of Sacrifice.', '右鍵點擊在獻祭祭壇上獻祭此物品。'],
  // 通貨描述
  ['Reforges a rare item with new random modifiers.', '重新隨機生成一個稀有物品的詞綴。'],
  ['Reforges a magic item with new random modifiers.', '重新隨機生成一個魔法物品的詞綴。'],
  ['Enchants a magic item with a new random modifier.', '為魔法物品附加一個新的隨機詞綴。'],
  ['Upgrades a normal item to a magic item.', '將普通物品升級為魔法物品。'],
  ['Upgrades a normal item to a random rarity.', '將普通物品升級為隨機稀有度。'],
  ['Upgrades a normal or magic item to a rare item.', '將普通或魔法物品升級為稀有物品。'],
  ['Removes all modifiers from an item.', '移除物品上的所有詞綴。'],
  ['Removes a random modifier from an item.', '移除物品上的一個隨機詞綴。'],
  ['Enchants a rare item with a new random modifier.', '為稀有物品附加一個新的隨機詞綴。'],
  ['Creates a mirrored copy of an item.', '製作一件物品的鏡像複製品。'],
  ['Grants one Passive Skill Refund Point.', '賦予一個天賦重置點數。'],
  ['Corrupts an item, causing unpredictable and possibly powerful results.', '汙染一件物品，造成難以預測且可能強力的效果。'],
  ['Reforges the links between sockets on an item.', '重新生成物品插槽間的連接。'],
  ['Reforges the colour of sockets on an item.', '重新生成物品插槽的顏色。'],
  ['Reforges the number of sockets on an item.', '重新生成物品上的插槽數量。'],
  ['Adds quality that enhances Elemental Damage modifiers on an item.', '增加可強化物品元素傷害詞綴的品質。'],
  ['Adds quality that enhances Caster modifiers on an item.', '增加可強化物品施法者詞綴的品質。'],
  ['Adds quality that enhances Attack modifiers on an item.', '增加可強化物品攻擊詞綴的品質。'],
  ['Adds quality that enhances Defence modifiers on an item.', '增加可強化物品防禦詞綴的品質。'],
  ['Adds quality that enhances Life and Mana modifiers on an item.', '增加可強化物品生命和魔力詞綴的品質。'],
  ['Adds quality that enhances Speed modifiers on an item.', '增加可強化物品速度詞綴的品質。'],
  ['Adds quality that enhances Resistance modifiers on an item.', '增加可強化物品抗性詞綴的品質。'],
  ['Upgrades a normal item to a magic item with an Incubated Item.', '將普通物品升級為魔法物品並附帶孵化物品。'],
  ['Divination cards can be traded for the items they depict at the Act 3 Altar.', '命運卡可在第3幕的祭壇上兌換成其描述的物品。'],
  ['Reforges a corrupted magic or rare item with new random modifiers.', '重新隨機生成一個已汙染魔法或稀有物品的詞綴。'],
  ['Adds an Abyssal Socket to an item with no Abyssal Sockets.', '為沒有深淵插槽的物品增加一個深淵插槽。'],
  ['Can only be used at the Map Device.', '只能在地圖裝置中使用。'],
  ['Travel to this Map by using it in a personal Map Device. Maps can only be used once.', '在個人地圖裝置中使用此地圖以前往。地圖只能使用一次。'],
  // 附魔/聖所
  ['Enchants a helmet with a new enchantment.', '為頭盔附加一個新的附魔效果。'],
  // Vaal 相關
  ['Corrupts an item, modifying it unpredictably.', '汙染一件物品，造成難以預測的改變。'],
])

// ── Builds 頁面篩選項目對照（雙語顯示）────────────────────
// NOTE: 武器配置、昇華職業、天賦基石 → 套用雙語顯示（中文大字 + 英文小字）
//   此 Map 在 translateNode() 中優先於 statMap 查詢，確保雙語呈現。
//   中文名稱來源：poedb.tw/tw（官方繁體中文遊戲資料）
const BUILD_FILTER_MAP = new Map([
  // ── 武器配置 ──────────────────────────────────────────
  ['Wand / Shield', '魔杖 / 盾牌'], ['Sceptre / Shield', '仗 / 盾牌'],
  ['Mace / Shield', '錘 / 盾牌'], ['Axe / Shield', '斧 / 盾牌'],
  ['Sword / Shield', '劍 / 盾牌'], ['Claw / Shield', '爪 / 盾牌'],
  ['Dagger / Shield', '匕首 / 盾牌'], ['Rune Dagger / Shield', '盧恩匕首 / 盾牌'],
  ['Sword / Sword', '劍 / 劍'], ['Claw / Claw', '爪 / 爪'],
  ['Wand / Wand', '魔杖 / 魔杖'], ['Dagger / Dagger', '匕首 / 匕首'],
  ['Sceptre / Sceptre', '仗 / 仗'],
  ['Dual Claw', '雙爪'], ['Dual Wand', '雙魔杖'], ['Dual Dagger', '雙匕首'],
  ['Two Handed Axe', '雙手斧'], ['Two Handed Sword', '雙手劍'], ['Two Handed Mace', '雙手錘'],
  ['Two Hand Axe', '雙手斧'], ['Two Hand Sword', '雙手劍'], ['Two Hand Mace', '雙手錘'],
  ['Staff', '法杖'], ['Bow', '弓'], ['Unarmed', '徒手'],
  // ── POE1 基礎職業 ──────────────────────────────────────
  ['Marauder', '野蠻人'], ['Duelist', '決鬥者'], ['Ranger', '遊俠'],
  ['Shadow', '暗影'], ['Witch', '巫師'], ['Templar', '聖殿騎士'], ['Scion', '貴族'],
  // ── POE1 昇華職業（來源：poedb.tw/tw）────────────────────
  ['Juggernaut', '勇士'], ['Berserker', '暴徒'], ['Chieftain', '酋長'],
  ['Slayer', '處刑者'], ['Gladiator', '衛士'], ['Champion', '冠軍'],
  ['Deadeye', '銳眼'], ['Raider', '掠奪者'], ['Pathfinder', '追獵者'],
  ['Elementalist', '元素使'], ['Occultist', '秘術家'], ['Necromancer', '死靈師'],
  ['Inquisitor', '判官'], ['Hierophant', '聖宗'], ['Guardian', '守護者'],
  ['Assassin', '刺客'], ['Saboteur', '破壞者'], ['Trickster', '詐欺師'],
  ['Ascendant', '昇華使徒'],
  // ── 天賦基石（來源：poedb.tw/tw/Keystone，共 46 個標準基石）──
  ['Acrobatics', '移形換影'], ['Phase Acrobatics', '移靈換影'],
  ['Iron Reflexes', '霸體'], ['Resolute Technique', '堅毅之心'],
  ['Unwavering Stance', '烈士意志'], ['Chaos Inoculation', '異靈之體'],
  ['Eldritch Battery', '異能魔力'], ['Blood Magic', '祭血術'],
  ['Necromantic Aegis', '靈能神盾'], ['Pain Attunement', '苦痛靈曲'],
  ['Elemental Equilibrium', '元素之相'], ['Iron Grip', '堅鐵之力'],
  ['Point Blank', '零點射擊'], ['Arrow Dancing', '箭矢閃躍'],
  ['Ancestral Bond', '先祖魂約'], ['Ghost Reaver', '靈能護體'],
  ['Vaal Pact', '瓦爾冥約'], ['Zealot\'s Oath', '狂熱誓言'],
  ['Avatar of Fire', '火之化身'], ['Mind Over Matter', '心靈昇華'],
  ['Elemental Overload', '元素超載'], ['Perfect Agony', '絕對受難'],
  ['Crimson Dance', '緋紅舞蹈'], ['Runebinder', '束縛印'],
  ['Wicked Ward', '惡毒牢房'], ['Call to Arms', '武裝召喚'],
  ['Eternal Youth', '青春永駐'], ['Glancing Blows', '側身之擊'],
  ['Wind Dancer', '風魔舞者'], ['The Agnostic', '不可知論'],
  ['Supreme Ego', '至高．自我'], ['Imbalanced Guard', '不平衡守衛'],
  ['The Impaler', '穿刺者'], ['Hex Master', '咒術大師'],
  ['Magebane', '咒術災厄'], ['Iron Will', '鋼鐵意志'],
  ['Solipsism', '唯我論'], ['Ghost Dance', '鬼舞'],
  ['Divine Shield', '聖盾'], ['Versatile Combatant', '多重戰'],
  ['Lethe Shade', '忘卻陰影'], ['Precise Technique', '精準科技'],
  ['Minion Instability', '復仇之靈'], ['Conduit', '能量連結'],
  ['Worship the Blightheart', '崇拜凋落之心'],
  ['Arsenal of Vengeance', '復仇兵工廠'], ['Bloodsoaked Blade', '浸血之刃'],
  // ── 星群珠寶基石 ────────────────────────────────────────
  ['Disciple of Kitava', '奇塔弗之律'], ['Lone Messenger', '孤獨信使'],
  ['Nature\'s Patience', '自然之耐'], ['Secrets of Suffering', '磨難秘辛'],
  ['Kineticism', '動力學'], ['Veteran\'s Awareness', '老鳥意識'],
  ['Hollow Palm Technique', '空掌之術'], ['Pitfighter', '地獄鬥士'],
  // ── 永恆珠寶基石 ────────────────────────────────────────
  ['Divine Flesh', '神聖血肉'], ['Immortal Ambition', '不朽野望'],
  ['Corrupted Soul', '腐化之魂'], ['Strength of Blood', '血之力量'],
  ['Tempered by War', '戰爭淬煉'], ['Chainbreaker', '除鏈師'],
  ['The Traitor', '叛徒'], ['Dance with Death', '與死共舞'],
  ['Second Sight', '先見之明'], ['Transcendence', '超凡脫俗'],
  ['Inner Conviction', '內觀信念'], ['Power of Purpose', '力量之意'],
  ['Supreme Decadence', '至高．頹廢'], ['Supreme Grandstanding', '至高．譁眾'],
  ['Supreme Ostentation', '至高．炫耀'],
  // ── 其他 Builds 篩選詞 ────────────────────────────────────
  ['Mortal Conviction', '必死信念'],
  // ── 海盜選項（Act 2 Bandit）────────────────────────────────
  ['Eramir', '艾米爾'], ['Alira', '阿莉亞'],
  ['Kraityn', '克雷頓'], ['Oak', '歐克'],
  // ── 萬神殿神祇（Pantheon）──────────────────────────────────
  ['The Brine King', '海洋之王'], ['Lunaris', '月神'],
  ['Abberath', '艾貝拉斯'], ['Ralakesh', '芮勒蓋許'],
  ['Tukohama', '圖克哈瑪'], ['Arakaali', '艾爾卡莉'],
  ['Gruthkul', '葛魯斯寇'], ['Solaris', '日神'],
  // ── 第二昇華血裔（Second Ascendancy Bloodlines）────────────
  ['None', '無'],
  ['Breachlord Bloodline', '裂痕君王血裔'], ['Farrul Bloodline', '費爾羅血裔'],
  ['Lycia Bloodline', '利希亞血裔'], ['Aul Bloodline', '奧爾血裔'],
  ['Catarina Bloodline', '卡塔莉娜血裔'], ['Nameless Bloodline', '無名血裔'],
  ['Delirious Bloodline', '譫妄血裔'],
  // ── 裝備類型複合詞（Builds 篩選面板，雙語顯示）───────────
  ['Rare Gloves', '稀有手套'], ['Rare Helmet', '稀有頭盔'],
  ['Rare Ring', '稀有戒指'], ['Rare Belt', '稀有腰帶'],
  ['Rare Wand', '稀有魔杖'], ['Rare Jewel', '稀有珠寶'],
  ['Rare Boots', '稀有靴子'], ['Rare Shield', '稀有盾牌'],
  ['Rare Body Armour', '稀有護甲'], ['Rare Amulet', '稀有護符'],
  ['Rare Sceptre', '稀有法杖'], ['Rare Claw', '稀有爪'],
  ['Rare Staff', '稀有權杖'], ['Rare Sword', '稀有劍'],
  ['Rare Axe', '稀有斧'], ['Rare Mace', '稀有錘'],
  ['Rare Dagger', '稀有匕首'], ['Rare Quiver', '稀有箭筒'],
  ['Rare Flask', '稀有藥劑'], ['Rare Graft', '稀有嫁接'],
  ['Magic Flask', '魔法藥劑'], ['Magic Wand', '魔法魔杖'],
  // ── 膏抹天賦（Anointed Passives，戒指/護符塗抹的著名天賦）─
  ['Martial Prowess', '武術英勇'], ['Widespread Destruction', '毀滅擴散'],
  ['Prismatic Heart', '多稜之心'], ['Force of Darkness', '黑暗之力'],
  ['Charisma', '魅力'], ['Whispers of Doom', '滅世之語'],
  ['Disciple of the Unyielding', '不屈之徒'], ['As The Mountain', '宛如神山'],
  ['Death Attunement', '亡靈諧曲'], ["Sione's Ambition", '西奧妮的野心'],
  ['Prism Weave', '綾彩交織'],
])

// ── 注入雙語樣式 CSS ──────────────────────────────────────
function injectStyles() {
  if (document.getElementById('pnt-styles')) return
  var style = document.createElement('style')
  style.id = 'pnt-styles'
  style.textContent = [
    '/* POE Ninja 翻譯插件 - 雙語樣式 */',
    // 中文翻譯行：tooltip 詞綴的中文（排在英文前）
    '.pnt-zh {',
    '  font-family: "Microsoft JhengHei", "微軟正黑體", sans-serif !important;',
    '  color: #aad372;',
    '  font-size: 0.9em;',
    '  line-height: 1.4;',
    '  margin-left: 4px;',
    '  display: block;',
    '}',
    // 道具名稱的英文小字（主頁 / tooltip 名稱後）
    '.pnt-en {',
    '  font-family: "Microsoft JhengHei", "微軟正黑體", sans-serif !important;',
    '  font-size: 0.72em;',
    '  opacity: 0.5;',
    '  margin-left: 0.3em;',
    '  vertical-align: middle;',
    '  font-weight: normal;',
    '}',
    // 雙語道具名稱的中文部分
    '.pnt-zh-name {',
    '  font-family: "Microsoft JhengHei", "微軟正黑體", sans-serif !important;',
    '}',
  ].join('\n')
  document.head.appendChild(style)
}

// ── 向 background service worker 請求字庫（含重試）────────
async function loadDictionary() {
  if (itemMap) return

  // NOTE: 避免 ?. ?? 在舊版 Edge content script 引擎報錯，改用明確判斷
  var response = null
  try {
    response = await chrome.runtime.sendMessage({ type: 'GET_TRANSLATION' })
  } catch (e) {
    // service worker 可能在休眠，等待後重試一次
    await new Promise(function(r) { setTimeout(r, 500) })
    try {
      response = await chrome.runtime.sendMessage({ type: 'GET_TRANSLATION' })
    } catch (e2) {
      console.error('[POE翻譯] 無法連線至 background：', e2.message)
      return
    }
  }

  if (!response || !response.ok) {
    console.error('[POE翻譯] 字庫載入失敗：', response ? response.error : '無回應')
    return
  }

  itemMap = new Map(Object.entries(response.data.items))
  normalizedStatMap = new Map(Object.entries(response.data.stats))
  passiveMap = new Map(Object.entries(response.data.passives || {}))
  baseTypeSet = new Set(response.data.baseTypes || [])
  console.log('[POE翻譯] 字庫就緒：物品 ' + itemMap.size + ' 筆，詞綴 ' + normalizedStatMap.size + ' 筆，天賦 ' + passiveMap.size + ' 筆，基底類型 ' + baseTypeSet.size + ' 筆')
}

// ── 正規化空白 ────────────────────────────────────────────
function normalizeSpaces(text) {
  return text.replace(/[\u00a0\u202f\u2009\u200b\t]/g, ' ').trim()
}

// ── 詞綴查詢（將數字替換為 # 後查 Map，O(1)）────────────
// NOTE: 策略：先嘗試保留正負號（如 "+# to maximum Life"），找不到再退回無號版本（如 "#% increased Armour"）
function translateStat(trimmed) {
  if (!normalizedStatMap) return null

  // 嘗試 1：保留正負號後查找（+120 → +#）
  var keyWithSign = trimmed.replace(/([+-]?)(\d+(?:\.\d+)?)/g, function(m, sign, num) {
    return sign + '#'
  })
  var zh = normalizedStatMap.get(keyWithSign)

  // 嘗試 2：移除正負號後查找（+120 → #）
  if (!zh && keyWithSign !== trimmed.replace(/[+-]?\d+(?:\.\d+)?/g, '#')) {
    var keyNoSign = trimmed.replace(/[+-]?\d+(?:\.\d+)?/g, '#')
    zh = normalizedStatMap.get(keyNoSign)
  }

  if (!zh) return null
  var numbers = trimmed.match(/\d+(?:\.\d+)?/g) || []
  var i = 0
  return zh.replace(/#/g, function() {
    var n = numbers[i]
    i++
    return n !== undefined ? n : '#'
  })
}

// ── 道具名稱雙語插入（中文大字 + 英文小字）────────────────
// NOTE: 不使用 WeakSet，改用 DOM 結構判斷（parent.querySelector('.pnt-en')），原因：
//   React in-place update：換頁時直接修改文字節點的 .nodeValue（同一物件，WeakSet 仍有它 → 跳過）。
//   DOM 結構判斷：檢查父元素現有的 .pnt-en 英文內容是否與新英文相符，相符才跳過，不符就更新。
function insertBilingualItemName(textNode, zhName, enName) {
  var parent = textNode.parentElement
  if (!parent) { textNode.nodeValue = zhName; return }
  // NOTE: 精確比對 class（classList.contains），避免誤判 pnt-zh-name 為 pnt-zh
  //   若父元素是 .pnt-zh 或 .pnt-en，只換文字，不再插入新元素（防無窮迴圈）
  if (parent.classList.contains('pnt-zh') || parent.classList.contains('pnt-en')) {
    textNode.nodeValue = zhName; return
  }

  var expectedEnText = '\u00a0' + enName  // \u00a0 = non-breaking space
  var existingEn = parent.querySelector('.pnt-en')

  if (existingEn) {
    if (textNode.nodeValue === zhName && existingEn.textContent === expectedEnText) {
      // NOTE: 文字節點已是中文且英文小字相符 → 完全正確，跳過（避免重複操作）
      return
    }
    // NOTE: 舊 .pnt-en 存在但內容過時（React in-place 換了不同道具名稱），清除重插
    existingEn.remove()
  }

  // 中文名稱取代原文字節點，並套用字型 class
  textNode.nodeValue = textNode.nodeValue.replace(enName, zhName)
  parent.classList.add('pnt-zh-name')

  // 英文小字跟在中文後面
  var enSpan = document.createElement('span')
  enSpan.className = 'pnt-en'
  enSpan.textContent = expectedEnText
  if (textNode.nextSibling) {
    parent.insertBefore(enSpan, textNode.nextSibling)
  } else {
    parent.appendChild(enSpan)
  }
}

// ── 翻譯單一文字節點 ─────────────────────────────────────
function translateNode(node) {
  var raw = node.nodeValue
  if (!raw) return
  var trimmed = normalizeSpaces(raw)
  if (trimmed.length < 2) return

  // NOTE: 設備基底類型副標題隱藏
  //   poe.ninja 在傳奇物品頁面（URL 含 /unique 或 /builds/）中，
  //   於傳奇名稱下方顯示基底類型副標題（如「箴言法杖」）
  //   條件：當前 URL 是傳奇物品或 Builds 頁面 → 直接清空並隱藏
  //   其他頁面（如 base-types、maps）→ 繼續正常翻譯流程
  if (baseTypeSet && baseTypeSet.has(trimmed)) {
    var href = window.location.href
    if (href.indexOf('/unique') !== -1 || href.indexOf('/builds/') !== -1) {
      node.nodeValue = ''
      if (node.parentElement) node.parentElement.style.display = 'none'
      return
    }
  }

  // 道具名稱：雙語顯示（中文正常 + 英文小字）
  var item = itemMap && itemMap.get(trimmed)
  if (item) { insertBilingualItemName(node, item, trimmed); return }

  // NOTE: Foulborn 前綴處理（穢生·）
  //   items.ndjson 只收錄基礎道具，Foulborn 變體需自動組合
  //   例如 "Foulborn Mageblood" → 找 "Mageblood" → "魔血" → 顯示 "穢生·魔血"
  if (trimmed.startsWith('Foulborn ')) {
    var baseItem = itemMap && itemMap.get(trimmed.slice(9))
    if (baseItem) { insertBilingualItemName(node, '穢生·' + baseItem, trimmed); return }
  }

  // NOTE: Allocates X 前綴處理（護符膏抹被動技能，直接替換）
  //   例如 "Allocates Bastion of Hope" → passiveMap["Bastion of Hope"] → "配置 希望壁壘"
  if (trimmed.startsWith('Allocates ')) {
    var allocName = trimmed.slice(10)
    var allocZh = (passiveMap && passiveMap.get(allocName)) || BUILD_FILTER_MAP.get(allocName) || null
    if (allocZh) { node.nodeValue = raw.replace(trimmed, '配置 ' + allocZh); return }
  }

  // Builds 篩選項目：雙語顯示（武器配置、昇華職業、天賦基石）
  // NOTE: 優先於 statMap 查詢，確保這些項目顯示雙語而非直接替換
  var buildFilter = BUILD_FILTER_MAP.get(trimmed)
  if (buildFilter) { insertBilingualItemName(node, buildFilter, trimmed); return }

  // poedb.tw 天賦資料：雙語顯示（天賦基石、輿圖天賦等，需先執行 fetch-poedb.js）
  var passive = passiveMap && passiveMap.get(trimmed)
  if (passive) { insertBilingualItemName(node, passive, trimmed); return }

  var nav = NAV_MAP.get(trimmed)
  if (nav) { node.nodeValue = raw.replace(trimmed, nav); return }

  var stat = translateStat(trimmed)
  if (stat) { node.nodeValue = raw.replace(trimmed, stat) }
}

// ── 遍歷並翻譯某個 DOM 節點下所有文字 ────────────────────
function translateSubtree(root) {
  if (!itemMap || !root) return

  var walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        var p = node.parentElement
        if (!p || SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT
        // NOTE: 精確比對 class（classList.contains），避免誤判 pnt-zh-name 為 pnt-zh
        //   .pnt-zh-name 是我們加在「道具名稱父元素」的 class，其文字節點仍需被掃描（React 可能 in-place 更新它）
        //   只有 .pnt-zh 和 .pnt-en 這兩個我們「插入的新元素」才需要跳過
        if (p.classList.contains('pnt-zh') || p.classList.contains('pnt-en')) return NodeFilter.FILTER_REJECT
        // NOTE: 跳過 Tippy tooltip 容器內的節點（由 tippyObserver 專門處理，避免雙重中文）
        if (p.closest && p.closest('[data-pnt-tooltip]')) return NodeFilter.FILTER_REJECT
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT
        return NodeFilter.FILTER_ACCEPT
      }
    }
  )

  var nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  for (var i = 0; i < nodes.length; i++) translateNode(nodes[i])
}

// ── Tippy Tooltip 雙語翻譯 ───────────────────────────────
// NOTE: 參考 iwtba4188/poe_ninja_redirect_to_trade 的做法：
//   監聽 document.body 的直接子節點，用 [class*="item-body"] section 找詞綴
//   section[2]=附魔, section[3]=隱性詞綴, section[4]=顯性詞綴

// NOTE: 根本原因修正：poe.ninja 詞綴由多個 span 拼接（如 <span>+120</span> to max <span>Life</span>），
//   TreeWalker 拿到的是拆分後的 text node，無法匹配完整詞綴字串。
//   必須以整個詞綴容器的 innerText（完整字串）查詞典，仿照 iwtba4188 的做法。

// Tooltip 雙語翻譯：以 innerText 翻譯詞綴容器，在前方插入中文行
function translateTippyTooltip(container) {
  // 每次翻譯前清除舊中文行並重置翻譯標記（支持 Tippy 重用容器顯示不同裝備）
  var oldLines = container.querySelectorAll('.pnt-zh')
  for (var k = 0; k < oldLines.length; k++) oldLines[k].remove()
  // NOTE: 清除 pnt-done 標記，允許下次 hover 重新翻譯同一容器的不同道具
  var donedEls = container.querySelectorAll('[data-pnt-done]')
  for (var m = 0; m < donedEls.length; m++) delete donedEls[m].dataset.pntDone

  // NOTE: 去重 Set：確保同一文字在整個 tooltip 中只翻譯一次
  //   解決三種重複來源：
  //   1. div > div 同時匹配 wrapper div + leaf div（相同 innerText）
  //   2. 相同詞綴出現在多個 section（如 Vaal 技能寶石同時顯示普通版與 Vaal 版屬性）
  //   3. broad scan 與 section scan 處理到同一文字的不同元素
  var seenTexts = new Set()

  var sections = container.querySelectorAll('div[class*="item-body"] section')
  if (sections.length > 0) {
    // NOTE: 裝備/寶石 tooltip：依 item-body section 結構翻譯詞綴
    for (var s = 0; s < sections.length; s++) {
      var modDivs = sections[s].querySelectorAll('div > div')
      for (var d = 0; d < modDivs.length; d++) {
        var modDiv = modDivs[d]
        // NOTE: 只處理葉子 div（無直接 div 子元素），跳過容器 div
        var hasDivKid = false
        for (var kc = 0; kc < modDiv.children.length; kc++) {
          if (modDiv.children[kc].tagName === 'DIV') { hasDivKid = true; break }
        }
        if (hasDivKid) continue
        var modText = normalizeSpaces(modDiv.innerText || modDiv.textContent || '')
        if (!modText || modText.length < 2) continue
        // NOTE: 相同文字已翻譯過（另一 section 重複出現），標記為完成並跳過
        if (seenTexts.has(modText)) { modDiv.dataset.pntDone = '1'; continue }
        translateModElement(modDiv)
        if (modDiv.dataset.pntDone) seenTexts.add(modText)
      }
    }
  }

  // NOTE: 廣域掃描：翻譯所有尚未處理的短文字元素（寶石名稱、詞綴 span、Corrupted 等）
  //   - 不限制 section 內外，讓廣域掃描涵蓋 section 內的 span/div（section scan 只找 div > div）
  //   - seenTexts 負責去重：section scan 已翻譯的文字，廣域掃描遇到時直接跳過，不重複翻譯
  //   - 廣域掃描在 section scan 之後執行，section scan 翻譯後的父容器 innerText 含中文
  //     → CJK 過濾自動跳過這些父容器
  var allEls = container.querySelectorAll('div, p, span, li, h1, h2, h3, h4')
  for (var i = 0; i < allEls.length; i++) {
    var el = allEls[i]
    if (el.dataset && el.dataset.pntDone) continue
    var text = normalizeSpaces(el.innerText || el.textContent || '')
    if (!text || text.length < 2 || text.length > 120) continue
    if (/[\u4e00-\u9fff]/.test(text)) continue
    // NOTE: seenTexts 去重：同一文字只翻一次（section scan 翻過的不再翻）
    if (seenTexts.has(text)) { el.dataset.pntDone = '1'; continue }
    // NOTE: 跳過含 block 子元素的容器；允許純文字或只含 inline 子元素的短文字塊
    var hasBlockChild = false
    var ch = el.children
    for (var c = 0; c < ch.length; c++) {
      var childCls = ch[c].className || ''
      if (childCls.indexOf('pnt-zh') !== -1 || childCls.indexOf('pnt-en') !== -1) continue
      var ctag = ch[c].tagName
      if (ctag === 'DIV' || ctag === 'P' || ctag === 'SECTION' || ctag === 'UL' || ctag === 'LI') {
        hasBlockChild = true; break
      }
    }
    if (!hasBlockChild) {
      translateModElement(el)
      if (el.dataset.pntDone) seenTexts.add(text)
    }
  }
}

// 以元素的完整 innerText 查詞典，翻譯成功則在前方插入 .pnt-zh 中文行（中英中英排列）
// NOTE: 插入在英文元素「之前」，使視覺順序為：中文 → 英文 → 中文 → 英文（中英中英）
function translateModElement(el) {
  if (!el || el.classList.contains('pnt-zh') || el.classList.contains('pnt-en')) return
  // NOTE: 防止同一元素重複翻譯
  if (el.dataset.pntDone) return
  var text = normalizeSpaces(el.innerText || el.textContent || '')
  if (text.length < 2) return

  // 依序嘗試：stat 詞綴 → 物品名稱 → Foulborn 前綴 → Builds 篩選詞 → poedb 天賦 → 導覽詞 → 物品描述
  var translated = translateStat(text)
  if (!translated) translated = (itemMap && itemMap.get(text)) || null
  // NOTE: Foulborn 前綴處理（tooltip 版本，同 translateNode 邏輯）
  if (!translated && text.startsWith('Foulborn ')) {
    var baseZh = itemMap && itemMap.get(text.slice(9))
    if (baseZh) translated = '穢生·' + baseZh
  }
  // NOTE: Allocates X 前綴處理（tooltip 版本：護符膏抹被動，雙語顯示）
  //   例如 "Allocates Bastion of Hope" → "配置 希望壁壘"（中文行插入英文行之前）
  if (!translated && text.startsWith('Allocates ')) {
    var allocTxt = text.slice(10)
    var allocZhTxt = (passiveMap && passiveMap.get(allocTxt)) || BUILD_FILTER_MAP.get(allocTxt) || null
    if (allocZhTxt) translated = '配置 ' + allocZhTxt
  }
  if (!translated) translated = BUILD_FILTER_MAP.get(text) || null
  if (!translated) translated = (passiveMap && passiveMap.get(text)) || null
  if (!translated) translated = NAV_MAP.get(text) || null
  if (!translated) translated = ITEM_DESC_MAP.get(text) || null

  // NOTE: 嘗試 NAV_MAP 前綴匹配（如 "Stack Size: 1/20" → "堆疊數量: 1/20"）
  //   只匹配 key 以 ':' 結尾的 label 型條目（避免誤匹配 "Corrupted Item" 等）
  if (!translated) {
    var navResult = null
    NAV_MAP.forEach(function(zhVal, enKey) {
      if (!navResult && enKey.endsWith(':') && text.startsWith(enKey)) {
        navResult = zhVal + text.slice(enKey.length)
      }
    })
    translated = navResult
  }

  if (translated && translated !== text) {
    el.dataset.pntDone = '1'
    var zhLine = document.createElement('div')
    zhLine.className = 'pnt-zh'
    zhLine.textContent = translated
    // NOTE: 插在英文元素「之前」，形成「中→英→中→英」的視覺排列
    el.before(zhLine)
  }
}

// 等待 Tippy 容器內容填充後翻譯（兩步注入：空容器 → 填充內容）
// NOTE: pendingTippySet 防止同一容器在同一微任務批次中被翻譯多次
//   但不永久去重，每次 hover（translateTippyTooltip 清除舊行後）皆可重翻
function waitForTippyContent(node) {
  if (pendingTippySet.has(node)) return  // 已排隊，跳過
  // NOTE: 標記此節點為 Tippy tooltip 容器，讓 translateSubtree 的 TreeWalker 跳過它
  //   避免 translateTippyTooltip 與 translateSubtree 雙重處理同一容器，造成中文出現兩次
  node.setAttribute('data-pnt-tooltip', '1')

  var doTranslate = function() {
    pendingTippySet.delete(node)  // 清除標記，允許下次 hover 重新翻
    translateTippyTooltip(node)
  }

  if (node.innerText && node.innerText.trim()) {
    // 內容已存在：排入 microtask（確保 DOM 穩定後執行）
    pendingTippySet.add(node)
    queueMicrotask(doTranslate)
    return
  }

  // 內容尚未填充：設內層 Observer 等待
  var innerObserver = new MutationObserver(function(mutations, obs) {
    if (node.innerText && node.innerText.trim()) {
      obs.disconnect()
      if (!pendingTippySet.has(node)) {
        pendingTippySet.add(node)
        queueMicrotask(doTranslate)
      }
    }
  })
  innerObserver.observe(node, { childList: true, subtree: true, characterData: true })
}

// ── 啟動 MutationObserver ────────────────────────────────
var tippyObserver = null

// NOTE: 防抖計時器：等待 React 完成當前 render batch 後再統一掃描
//   React concurrent mode 可能在 150ms 內多次插入 DOM，若立即翻譯會遇到「部分渲染」狀態。
//   防抖確保 React 安靜下來後再做一次完整的 body 掃描。
var observerDebounceTimer = null
function scheduleBodyScan() {
  if (observerDebounceTimer) clearTimeout(observerDebounceTimer)
  observerDebounceTimer = setTimeout(function() {
    observerDebounceTimer = null
    if (currentLang === 'zh-TW' && itemMap) translateSubtree(document.body)
  }, 150)
}

function startObserver() {
  if (observer) observer.disconnect()
  if (tippyObserver) tippyObserver.disconnect()

  // NOTE: 主 Observer — 偵測 React SPA 動態渲染的 DOM 變化
  observer = new MutationObserver(function(mutations) {
    if (currentLang !== 'zh-TW' || !itemMap) return
    for (var i = 0; i < mutations.length; i++) {
      var added = mutations[i].addedNodes
      for (var j = 0; j < added.length; j++) {
        var node = added[j]
        // NOTE: body 直接子節點是 Tippy tooltip 容器，交由 tippyObserver 負責
        if (node.parentElement === document.body) continue
        if (node.nodeType === Node.ELEMENT_NODE) {
          // NOTE: 精確比對 class（classList.contains），跳過我們插入的 .pnt-zh / .pnt-en
          if (node.classList.contains('pnt-zh') || node.classList.contains('pnt-en')) continue
          // NOTE: 偵測到有效的 React 新節點 → 觸發防抖掃描（等 React render 完成）
          scheduleBodyScan()
          return  // 已觸發掃描，本批次的後續節點一起由掃描涵蓋
        } else if (node.nodeType === Node.TEXT_NODE) {
          // NOTE: 純文字節點直接翻譯（文字節點通常是葉子，不需等待子樹）
          var p = node.parentElement
          if (p && !p.classList.contains('pnt-zh') && !p.classList.contains('pnt-en')) {
            translateNode(node)
          }
        }
      }
    }
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })

  // NOTE: 專用 Tippy Observer — 只監聽 document.body 的直接子節點
  //   Tippy.js 將 tooltip 容器直接插入 body，不在 subtree 內層
  //   不依賴 data-tippy-root，改為在 waitForTippyContent 內用 selector 確認
  tippyObserver = new MutationObserver(function(mutations) {
    if (currentLang !== 'zh-TW' || !itemMap) return
    for (var i = 0; i < mutations.length; i++) {
      var added = mutations[i].addedNodes
      for (var j = 0; j < added.length; j++) {
        var node = added[j]
        if (node.nodeType === Node.ELEMENT_NODE) {
          waitForTippyContent(node)
        }
      }
    }
  })
  tippyObserver.observe(document.body, { childList: true })
}

// ── SPA 路由變化監聽（React pushState / popstate）────────
function onRouteChange() {
  if (currentLang !== 'zh-TW' || !itemMap) return
  // NOTE: poe.ninja 為 React SPA，路由切換後 DOM 重新渲染，需延遲重新翻譯
  //   多次掃描涵蓋不同渲染時間點：
  //   300ms  → React 初始渲染完成
  //   700ms  → 首批 API 資料回應
  //   1200ms → 較慢的 API 回應
  //   2500ms → 極慢網路環境 / 懶載入元件
  ;[300, 700, 1200, 2500].forEach(function(delay) {
    setTimeout(function() { translateSubtree(document.body) }, delay)
  })
}

function setupRouteListener() {
  // 攔截 history.pushState（React Router 的程序性跳轉）
  var origPush = history.pushState
  history.pushState = function() {
    origPush.apply(this, arguments)
    onRouteChange()
  }
  // 監聽瀏覽器前進後退
  window.addEventListener('popstate', onRouteChange)
}

// ── 套用繁體中文翻譯 ──────────────────────────────────────
async function enableZhTW() {
  await loadDictionary()
  if (!itemMap) return
  injectStyles()
  startObserver()
  setupRouteListener()
  // NOTE: 立即翻譯已可見的靜態內容（MutationObserver 負責捕捉後續動態載入的內容）
  //   原本的 500ms 固定延遲會導致 SPA 換頁後內容未被翻譯；無窮迴圈已由三層 guard 解決。
  translateSubtree(document.body)
  // NOTE: 備份掃描：部分頁面資料在首次掃描後才 render（如非同步 API 回應）
  setTimeout(function() { translateSubtree(document.body) }, 800)
}

// ── 還原英文 ─────────────────────────────────────────────
function disableTranslation() {
  if (observer) observer.disconnect()
  observer = null
  location.reload()
}

// ── 接收來自 popup 的語言切換指令 ────────────────────────
chrome.runtime.onMessage.addListener(function(msg) {
  if (msg.type !== 'SET_LANGUAGE') return
  currentLang = msg.language
  if (msg.language === 'zh-TW') enableZhTW()
  else disableTranslation()
})

// ── 初始化 ────────────────────────────────────────────────
async function init() {
  var result = await chrome.storage.local.get('language')
  currentLang = result.language || 'en'
  if (currentLang === 'zh-TW') await enableZhTW()
}

init()
