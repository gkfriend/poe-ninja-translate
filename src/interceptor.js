;(function() {
  if (window._pntFetchWrapped) return
  window._pntFetchWrapped = true
  var orig = window.fetch
  window.fetch = function() {
    var p = orig.apply(this, arguments)
    p.then(function(res) {
      var c = res.clone()
      c.json().then(function(d) {
        if (!d || !Array.isArray(d.items) || !d.items.length) return
        var first = d.items[0].itemData
        if (!first || typeof first.inventoryId === 'undefined') return
        var found = []
        for (var i = 0; i < d.items.length; i++) {
          var data = d.items[i].itemData
          if (!data) continue
          var inv = (data.inventoryId || '').toLowerCase()
          if (inv !== 'amulet' && inv !== 'belt') continue
          var mods = (data.implicitMods || []).concat(data.enchantMods || [])
          var al = []
          for (var j = 0; j < mods.length; j++) {
            if ((mods[j] || '').indexOf('Allocates ') === 0) al.push(mods[j].slice(10).trim())
          }
          if (al.length) found.push({ itemClass: inv, allocates: al })
        }
        if (found.length) window.postMessage({ source: 'pnt-item-data', items: found }, '*')
      }).catch(function() {})
    }).catch(function() {})
    return p
  }
})()
