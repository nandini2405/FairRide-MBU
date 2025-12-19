// Live geolocation helper: broadcast to localStorage and subscribe to updates
(function(){
  const LG = {};
  let watchId = null;

  function write(key, data){ try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {} }
  function read(key){ try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; } }

  LG.startBroadcast = function(key='driverLivePos', opts={}){
    if (!('geolocation' in navigator)) { if (opts.onError) opts.onError('Geolocation not supported'); return; }
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    watchId = navigator.geolocation.watchPosition(function(pos){
      const lat = pos.coords.latitude, lon = pos.coords.longitude, acc = pos.coords.accuracy;
      write(key, { lat: lat, lon: lon, acc: acc, ts: Date.now() });
      if (opts.onUpdate) opts.onUpdate({ lat: lat, lon: lon, acc: acc });
    }, function(err){
      if (opts.onError) opts.onError((err && err.message) || 'Location error');
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
  };

  LG.stopBroadcast = function(){ if (watchId != null) { try { navigator.geolocation.clearWatch(watchId); } catch (e) {} watchId = null; } };

  LG.get = read;

  // Subscribe to updates via storage event + polling fallback
  LG.onUpdate = function(key, cb){
    function handler(ev){ if (ev.key === key && ev.newValue) { try { cb(JSON.parse(ev.newValue)); } catch (e) {} } }
    window.addEventListener('storage', handler);
    // initial
    var v = read(key); if (v) cb(v);
    // polling fallback (in case same-origin but not cross-tab)
    var id = setInterval(function(){ var v2 = read(key); if (v2) cb(v2); }, 5000);
    return function(){ window.removeEventListener('storage', handler); clearInterval(id); };
  };

  // Map helper: update Google Maps embed to a given point
  LG.setMap = function(iframe, lat, lon, zoom){ if (zoom == null) zoom = 15; if (!iframe) return; iframe.src = 'https://www.google.com/maps?q=' + lat + ',' + lon + '&z=' + zoom + '&output=embed'; };

  window.LiveGeo = LG;
})();

