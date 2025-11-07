/*
 popup-loader.js
 Reads Base64 JSON config from <script id="smart-popup" data-config="..."> and renders popup.
 Supports: schedule (start/end), delay, frequency, everyLoad, visibility, position, media, action types,
 show/hide close, backdrop click behavior, image link, dataURL media, and mobile/desktop hiding.
 No external dependencies, no branding.
*/
(function(){
  var script = document.getElementById('smart-popup') || document.currentScript || document.scripts[document.scripts.length-1];
  if(!script) return;
  var cfg = null;
  try {
    var b64 = script.getAttribute('data-config') || '';
    if(b64) cfg = JSON.parse(decodeURIComponent(atob(b64)));
    else if(window.__SMARTPOPUP_CONFIG) cfg = window.__SMARTPOPUP_CONFIG;
  } catch(e) {
    console.error('PopupLoader: invalid config', e);
    return;
  }
  if(!cfg) return;

  // helpers
  function isMobile(){ return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent); }
  function now(){ return Date.now(); }
  function keyFor(c){ return 'smartpop_'+(c.headline||'popup').replace(/\s+/g,'_').slice(0,40); }

  // schedule check
  function inSchedule(c){
    if(!c.addSchedule) return true;
    try {
      var nowD = new Date();
      if(c.startAt){
        var s = new Date(c.startAt);
        if(nowD < s) return false;
      }
      if(c.endAt){
        var e = new Date(c.endAt);
        if(nowD > e) return false;
      }
      return true;
    } catch(e) { return true; }
  }

  // frequency helper
  function shouldShow(c){
    if(c.everyLoad) return true;
    var k = keyFor(c);
    var f = parseInt(c.frequency || 1, 10);
    if(isNaN(f)) f = 1;
    if(f === -1) return false;
    if(f === 0){
      if(localStorage.getItem(k)) return false;
      localStorage.setItem(k, now());
      return true;
    }
    var last = parseInt(localStorage.getItem(k) || '0', 10);
    var ms = f * 24*60*60*1000;
    if(!last || now() - last > ms){
      localStorage.setItem(k, now());
      return true;
    }
    return false;
  }

  // visibility checks
  if(cfg.hideDesktop && !isMobile()) return;
  if(cfg.hideMobile && isMobile()) return;
  if(!inSchedule(cfg)) return;
  if(!shouldShow(cfg)) return;

  // exit intent support (if cfg.type === 'exit')
  function attachExitIntent(cb){
    var triggered = false;
    function onMouse(e){
      if(triggered) return;
      if(e.clientY <= 3) { triggered = true; cb(); }
    }
    // also listen to visibilitychange for some browsers
    document.addEventListener('mouseout', onMouse);
    document.addEventListener('mouseleave', onMouse);
    document.addEventListener('visibilitychange', function(){
      if(document.visibilityState === 'hidden') { /* optional: treat as exit */ }
    });
  }

  // show popup after delay or on exit
  if(cfg.type === 'exit'){
    attachExitIntent(function(){ openPopup(cfg); });
  } else {
    setTimeout(function(){ openPopup(cfg); }, (parseInt(cfg.delay || 2, 10) || 2)*1000);
  }

  // open popup builder
  function openPopup(c){
    try {
      // overlay
      var overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.display = 'flex';
      overlay.style.alignItems = (c.position === 'bottom' ? 'flex-end' : (c.position === 'top' || c.position === 'top-cover' ? 'flex-start' : 'center'));
      overlay.style.justifyContent = (c.position === 'right-cover' ? 'flex-end' : (c.position === 'left-cover' ? 'flex-start' : 'center'));
      overlay.style.background = 'rgba(0,0,0,' + (c.overlay !== undefined ? c.overlay : 0.6) + ')';
      overlay.style.zIndex = 2147483647;
      overlay.id = 'smartpop_overlay_' + Math.random().toString(36).slice(2,9);

      // container box
      var box = document.createElement('div');
      box.style.background = c.popupBg || '#fff';
      box.style.color = c.textColor || '#111';
      box.style.borderRadius = (c.position === 'top-cover') ? '0 0 12px 12px' : '12px';
      box.style.maxWidth = (c.position === 'top-cover' ? '100%' : '720px');
      box.style.width = (c.position === 'top-cover' ? '100%' : '92%');
      box.style.padding = '20px';
      box.style.boxSizing = 'border-box';
      box.style.margin = (c.position === 'bottom' ? '30px' : '0');
      box.style.position = 'relative';
      box.style.overflow = 'hidden';
      box.style.boxShadow = '0 24px 80px rgba(5,20,40,0.18)';

      // inner content
      var inner = document.createElement('div');
      inner.style.display = 'flex';
      inner.style.flexDirection = 'column';
      inner.style.gap = '10px';

      // headline + text
      var head = document.createElement('div');
      head.style.fontSize = '20px';
      head.style.fontWeight = '800';
      head.style.color = c.headlineColor || '#111';
      head.innerText = c.headline || '';
      inner.appendChild(head);

      var txt = document.createElement('div');
      txt.style.fontSize = '15px';
      txt.style.color = c.textColor || '#333';
      txt.style.lineHeight = '1.4';
      txt.innerText = c.text || '';
      inner.appendChild(txt);

      // media
      if(c.mediaType && c.mediaType !== 'none' && c.mediaUrl){
        var mediaWrap = document.createElement('div'); mediaWrap.style.marginTop='8px';
        if(c.mediaType === 'video' || (c.mediaUrl.match && c.mediaUrl.match(/\.mp4($|\?)/i))){
          var v = document.createElement('video'); v.src = c.mediaUrl; v.controls = true; v.style.width = '100%'; v.style.borderRadius='8px';
          mediaWrap.appendChild(v);
        } else if(c.mediaType === 'icon'){
          var ic = document.createElement('div'); ic.style.fontSize='44px'; ic.style.lineHeight='1'; ic.textContent = c.mediaUrl || '⭐';
          mediaWrap.appendChild(ic);
        } else {
          var img = document.createElement('img'); img.src = c.mediaUrl; img.style.width='100%'; img.style.borderRadius='8px'; img.style.objectFit='cover';
          if(c.mediaLink){
            var anc = document.createElement('a'); anc.href = c.mediaLink; anc.target = '_blank'; anc.rel = 'noopener noreferrer';
            anc.appendChild(img); mediaWrap.appendChild(anc);
          } else mediaWrap.appendChild(img);
        }
        inner.appendChild(mediaWrap);
      }

      // CTA button
      if(c.buttonText){
        var btnWrap = document.createElement('div'); btnWrap.style.marginTop='12px';
        var a = document.createElement('a');
        a.id = 'smartpop_cta';
        a.href = c.buttonLink || '#';
        a.style.display = 'inline-block';
        a.style.padding = '12px 16px';
        a.style.borderRadius = '8px';
        a.style.color = c.buttonTextColor || '#fff';
        a.style.background = c.buttonBgColor || '#0b5cff';
        a.style.textDecoration = 'none';
        a.textContent = c.buttonText;
        if(c.actionType === 'newtab'){ a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        if(c.actionType === 'close'){
          a.href = 'javascript:void(0)';
          a.addEventListener('click', function(e){ e.preventDefault(); overlay.remove(); });
        }
        btnWrap.appendChild(a);
        inner.appendChild(btnWrap);
      }

      box.appendChild(inner);

      // close button
      if(c.showClose !== false){
        var close = document.createElement('button');
        close.innerHTML = '&#10005;';
        close.style.position = 'absolute';
        close.style.top = '12px';
        close.style.right = '12px';
        close.style.width = '38px';
        close.style.height = '38px';
        close.style.border = 'none';
        close.style.borderRadius = '8px';
        close.style.background = 'transparent';
        close.style.color = c.textColor || '#111';
        close.style.fontSize = '20px';
        close.style.cursor = 'pointer';
        close.addEventListener('click', function(){ overlay.remove(); });
        box.appendChild(close);
      }

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      // backdrop click
      if(!c.noBackdropClose){
        overlay.addEventListener('click', function(e){
          if(e.target === overlay) overlay.remove();
        });
      }

      // behavior after click: remove overlay when newtab opened
      var cta = document.getElementById('smartpop_cta');
      if(cta){
        if(c.actionType === 'newtab'){
          cta.addEventListener('click', function(){ overlay.remove(); });
        }
      }

    } catch (err) {
      console.error('PopupLoader open error', err);
    }
  }

})();
