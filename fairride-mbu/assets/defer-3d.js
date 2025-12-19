// Auto-load Sketchfab embeds (no manual click, no overlay)
(function(){
  function loadIframe(card){
    const embedUrl = card.getAttribute('data-embed');
    if (!embedUrl) return;
    const title = card.getAttribute('data-title') || '3D Model';
    card.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.title = title;
    iframe.loading = 'lazy';
    iframe.allowFullscreen = true;
    iframe.setAttribute('mozallowfullscreen', 'true');
    iframe.setAttribute('webkitallowfullscreen', 'true');
    iframe.allow = 'autoplay; fullscreen; xr-spatial-tracking';
    iframe.setAttribute('xr-spatial-tracking', '');
    iframe.setAttribute('execution-while-out-of-viewport', '');
    iframe.setAttribute('execution-while-not-rendered', '');
    iframe.setAttribute('web-share', '');
    iframe.style.border = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    const sep = embedUrl.includes('?') ? '&' : '?';
    // Autostart to bypass Sketchfab play overlay; keep UI minimal
    iframe.src = embedUrl + sep + 'autostart=1&preload=1&ui_controls=0&ui_infos=0&ui_hint=0&autospin=0.2';
    card.appendChild(iframe);
  }

  function init(){
    document.querySelectorAll('[data-sketchfab]').forEach(loadIframe);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
