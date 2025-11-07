(function() {
  // Prevent multiple popups from being loaded
  if (window.smartPopLoaded) return;
  window.smartPopLoaded = true;

  // === Load Configuration (from localStorage for testing) ===
  const allConfigs = JSON.parse(localStorage.getItem('smartpop_configs') || '[]');
  const activeConfig = allConfigs.length ? allConfigs[allConfigs.length - 1].cfg : null;
  if (!activeConfig) {
    console.warn('⚠️ No SmartPop configuration found.');
    return;
  }

  // === Date Schedule Check ===
  const now = new Date();
  if (activeConfig.addSchedule) {
    const start = activeConfig.startAt ? new Date(activeConfig.startAt) : null;
    const end = activeConfig.endAt ? new Date(activeConfig.endAt) : null;
    if ((start && now < start) || (end && now > end)) {
      console.log('Popup schedule not active.');
      return;
    }
  }

  // === Frequency Control ===
  const lastShown = localStorage.getItem('smartpop_last_shown');
  if (activeConfig.everyLoad !== true && activeConfig.freqToggle === true) {
    const freqDays = parseInt(activeConfig.frequency) || 0;
    if (freqDays > 0 && lastShown) {
      const diff = (now - new Date(lastShown)) / (1000 * 60 * 60 * 24);
      if (diff < freqDays) {
        console.log('Popup skipped (frequency limit).');
        return;
      }
    }
  }

  // === Helper Function to Create Elements ===
  const el = (tag, attrs = {}, html = '') => {
    const e = document.createElement(tag);
    for (let a in attrs) e.setAttribute(a, attrs[a]);
    e.innerHTML = html;
    return e;
  };

  // === Overlay ===
  const overlay = el('div', { id: 'smartpop-overlay', style: `
    position:fixed;inset:0;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.4);
    z-index:999999;
    ${activeConfig.noBackdropClose ? 'pointer-events:none;' : ''}
  `});

  // === Popup Container ===
  const popup = el('div', { id: 'smartpop-popup', style: `
    position:relative;
    background:${activeConfig.popupBg || '#ffffff'};
    border-radius:16px;
    max-width:640px;
    width:90%;
    padding:25px;
    box-shadow:0 10px 25px rgba(0,0,0,0.25);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    text-align:center;
    animation:fadeIn 0.5s ease;
  `});

  // === Media (Image, Video, Icon) ===
  if (activeConfig.mediaType && activeConfig.mediaType !== 'none' && activeConfig.mediaUrl) {
    let mediaEl;
    if (activeConfig.mediaType === 'video') {
      mediaEl = el('video', { controls: true, src: activeConfig.mediaUrl, style: 'width:100%;border-radius:10px;margin-bottom:15px;' });
    } else if (activeConfig.mediaType === 'icon') {
      mediaEl = el('div', { style: 'font-size:48px;margin-bottom:10px;' }, '⭐');
    } else {
      mediaEl = el('img', { src: activeConfig.mediaUrl, style: 'width:100%;border-radius:10px;margin-bottom:15px;' });
    }

    // If image/video link exists
    if (activeConfig.mediaLink) {
      const linkWrap = el('a', { href: activeConfig.mediaLink, target: '_blank' });
      linkWrap.appendChild(mediaEl);
      popup.appendChild(linkWrap);
    } else {
      popup.appendChild(mediaEl);
    }
  }

  // === Header ===
  const header = el('h2', { style: `
    margin-top:0;
    color:${activeConfig.headlineColor || '#111827'};
    font-size:1.6em;
    font-weight:700;
  `}, activeConfig.headline || '🔥 15% OFF SALE');
  popup.appendChild(header);

  // === Text Description ===
  const desc = el('p', { style: `
    color:${activeConfig.textColor || '#374151'};
    font-size:1.05em;
    line-height:1.6;
    margin:10px 0 18px;
  `}, activeConfig.text || 'Up to 15% off for limited time and free shipping for the first 100 buyers.');
  popup.appendChild(desc);

  // === Button ===
  if (activeConfig.buttonText) {
    const btn = el('a', {
      href: activeConfig.buttonLink || '#',
      target: activeConfig.actionType === 'newtab' ? '_blank' :
              activeConfig.actionType === 'sametab' ? '_self' : '_self',
      style: `
        display:inline-block;
        margin-top:10px;
        padding:12px 26px;
        background:${activeConfig.buttonBgColor || '#0b5cff'};
        color:${activeConfig.buttonTextColor || '#ffffff'};
        border-radius:8px;
        text-decoration:none;
        font-weight:600;
        transition:opacity .25s;
      `
    }, activeConfig.buttonText);
    btn.onmouseover = () => btn.style.opacity = '0.85';
    btn.onmouseout = () => btn.style.opacity = '1';
    popup.appendChild(btn);
  }

  // === Close Button ===
  if (activeConfig.showClose !== false) {
    const closeBtn = el('div', { style: `
      position:absolute;
      top:10px;
      right:14px;
      cursor:pointer;
      font-size:22px;
      color:#444;
      transition:color 0.2s;
    `}, '✖');
    closeBtn.onmouseenter = () => closeBtn.style.color = '#000';
    closeBtn.onmouseleave = () => closeBtn.style.color = '#444';
    closeBtn.onclick = () => overlay.remove();
    popup.appendChild(closeBtn);

    // Backdrop close
    if (!activeConfig.noBackdropClose) {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.remove();
      });
    }
  }

  overlay.appendChild(popup);

  // === Delay Before Showing ===
  const delaySec = parseInt(activeConfig.delay) || 0;
  setTimeout(() => {
    document.body.appendChild(overlay);
    localStorage.setItem('smartpop_last_shown', new Date().toISOString());
  }, delaySec * 1000);

  // === CSS Animation ===
  const style = document.createElement('style');
  style.textContent = `
  @keyframes fadeIn {
    from {opacity:0;transform:scale(0.95);}
    to {opacity:1;transform:scale(1);}
  }`;
  document.head.appendChild(style);

})();
