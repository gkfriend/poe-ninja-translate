// NOTE: Service Worker - 載入字庫並回應 content script 的請求

let cachedTranslation = null

// 依瀏覽器語言判斷預設語言
function detectLanguage() {
  const lang = chrome.i18n.getUILanguage()
  if (lang.startsWith('zh-TW') || lang.startsWith('zh-Hant')) return 'zh-TW'
  if (lang.startsWith('zh')) return 'zh-CN'
  return 'en'
}

// NOTE: Service worker 可以直接 fetch extension 內部資源，content script 不行
async function loadTranslation() {
  if (cachedTranslation) return cachedTranslation
  const url = chrome.runtime.getURL('data/translation.json')
  const res = await fetch(url)
  cachedTranslation = await res.json()
  console.log('[POE翻譯] 字庫載入完成')
  return cachedTranslation
}

// 回應 content script 的字庫請求
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_TRANSLATION') {
    loadTranslation()
      .then(data => sendResponse({ ok: true, data }))
      .catch(err => sendResponse({ ok: false, error: err.message }))
    return true // NOTE: 必須 return true 才能非同步 sendResponse
  }
})

// 第一次安裝時自動偵測語言
chrome.runtime.onInstalled.addListener(async () => {
  const { language } = await chrome.storage.local.get('language')
  if (!language) {
    const detected = detectLanguage()
    await chrome.storage.local.set({ language: detected })
    console.log(`[POE翻譯] 自動偵測語言：${detected}`)
  }
  // 預先載入字庫，減少第一次翻譯的延遲
  loadTranslation().catch(() => {})
})
