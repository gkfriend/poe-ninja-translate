// NOTE: Popup 控制邏輯 - 語言切換按鈕（記住最後設定）

var LANG_BUTTONS = ['en', 'zh-TW', 'zh-CN']

function updateActiveButton(activeLang) {
  for (var i = 0; i < LANG_BUTTONS.length; i++) {
    var lang = LANG_BUTTONS[i]
    var btn = document.getElementById('btn-' + lang)
    if (btn) {
      if (lang === activeLang) btn.classList.add('active')
      else btn.classList.remove('active')
    }
  }
}

async function setLanguage(lang) {
  await chrome.storage.local.set({ language: lang })
  updateActiveButton(lang)

  // NOTE: 用 try-catch 避免「Could not establish connection」錯誤
  // 當 poe.ninja 頁面沒有 content script 時（例如非目標頁面）會拋出此錯誤
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    var tab = tabs && tabs[0]
    if (tab && tab.id && tab.url && tab.url.indexOf('poe.ninja') !== -1) {
      await chrome.tabs.sendMessage(tab.id, { type: 'SET_LANGUAGE', language: lang })
    }
  } catch (e) {
    // 頁面尚未注入 content script，忽略（下次進入頁面會自動套用）
  }
}

async function init() {
  var result = await chrome.storage.local.get('language')
  var language = result.language || 'en'
  updateActiveButton(language)

  for (var i = 0; i < LANG_BUTTONS.length; i++) {
    (function(lang) {
      var btn = document.getElementById('btn-' + lang)
      if (btn && !btn.disabled) {
        btn.addEventListener('click', function() { setLanguage(lang) })
      }
    })(LANG_BUTTONS[i])
  }
}

document.addEventListener('DOMContentLoaded', init)
