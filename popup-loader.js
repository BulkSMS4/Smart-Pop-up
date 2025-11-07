(function () {
  // Create popup container
  const popup = document.createElement('div');
  popup.id = 'smartPopup';
  popup.style.position = 'fixed';
  popup.style.display = 'none';
  popup.style.justifyContent = 'center';
  popup.style.alignItems = 'center';
  popup.style.width = '100%';
  popup.style.height = '100%';
  popup.style.top = '0';
  popup.style.left = '0';
  popup.style.backgroundColor = 'rgba(0,0,0,0.6)';
  popup.style.zIndex = '999999';

  // Inner box
  const box = document.createElement('div');
  box.id = 'popupBox';
  box.style.background = '#fff';
  box.style.borderRadius = '12px';
  box.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
  box.style.maxWidth = '400px';
  box.style.width = '90%';
  box.style.padding = '20px';
  box.style.position = 'relative';
  box.style.textAlign = 'center';
  box.style.animation = 'popupFadeIn 0.5s ease';

  // Headline
  const headline = document.createElement('h2');
  headline.id = 'popupHeadline';
  headline.style.marginTop = '0';
  headline.style.color = '#111827';
  headline.style.fontSize = '1.5em';

  // Text
  const text = document.createElement('p');
  text.id = 'popupText';
  text.style.color = '#374151';
  text.style.fontSize = '1em';

  // Image or Video placeholder
  const mediaContainer = document.createElement('div');
  mediaContainer.id = 'popupMedia';
  mediaContainer.style.margin = '15px 0';

  // Button
  const btn = document.createElement('a');
  btn.id = 'popupBtn';
  btn.style.display = 'inline-block';
  btn.style.padding = '10px 20px';
  btn.style.borderRadius = '8px';
  btn.style.color = '#fff';
  btn.style.background = '#0b5cff';
  btn.style.textDecoration = 'none';
  btn.style.fontWeight = 'bold';
  btn.style.marginTop = '10px';

  // Close button
  const closeBtn = document.createElement('span');
  closeBtn.id = 'popupClose';
  closeBtn.innerHTML = '&times;';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '10px';
  closeBtn.style.right = '15px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontSize = '24px';
  closeBtn.style.color = '#555';

  // Append structure
  box.appendChild(closeBtn);
  box.appendChild(headline);
  box.appendChild(text);
  box.appendChild(mediaContainer);
  box.appendChild(btn);
  popup.appendChild(box);
  document.body.appendChild(popup);

  // Animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes popupFadeIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Load config
  function loadConfig() {
    try {
      const cfg = window.smartPopConfig || {};
      headline.textContent = cfg.headline || 'Welcome!';
      headline.style.color = cfg.headlineColor || '#111827';
      text.textContent = cfg.text || 'This is your Smartarget popup.';
      text.style.color = cfg.textColor || '#374151';
      btn.textContent = cfg.buttonText || 'Learn More';
      btn.href = cfg.buttonLink || '#';
      btn.style.background = cfg.buttonBgColor || '#0b5cff';
      btn.style.color = cfg.buttonTextColor || '#fff';
      box.style.background = cfg.popupBg || '#fff';

      // Media
      mediaContainer.innerHTML = '';
      if (cfg.mediaType === 'image' && cfg.mediaUrl) {
        const img = document.createElement('img');
        img.src = cfg.mediaUrl;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '8px';
        mediaContainer.appendChild(img);
      } else if (cfg.mediaType === 'video' && cfg.mediaUrl) {
        const vid = document.createElement('video');
        vid.src = cfg.mediaUrl;
        vid.controls = true;
        vid.style.maxWidth = '100%';
        vid.style.borderRadius = '8px';
        mediaContainer.appendChild(vid);
      }

      // Close button
      if (cfg.showClose === false) closeBtn.style.display = 'none';
      else closeBtn.style.display = 'block';

      // Schedule
      const now = new Date();
      if (cfg.startAt && cfg.endAt) {
        const start = new Date(cfg.startAt);
        const end = new Date(cfg.endAt);
        if (now < start || now > end) return; // outside schedule
      }

      // Frequency / Every page load
      const freqKey = 'smartPop_lastShown';
      const lastShown = localStorage.getItem(freqKey);
      const freqDays = parseInt(cfg.frequency || 0);
      if (!cfg.everyLoad && freqDays >= 0 && lastShown) {
        const diffDays = (now - new Date(parseInt(lastShown))) / (1000 * 60 * 60 * 24);
        if (diffDays < freqDays) return;
      }

      // Show popup
      setTimeout(() => {
        popup.style.display = 'flex';
        localStorage.setItem(freqKey, Date.now().toString());
      }, (cfg.delay || 2) * 1000);

      // Close behavior
      closeBtn.onclick = () => popup.style.display = 'none';
      if (!cfg.noBackdropClose) {
        popup.addEventListener('click', e => {
          if (e.target === popup) popup.style.display = 'none';
        });
      }
    } catch (e) {
      console.error('Smartarget Popup Error:', e);
    }
  }

  loadConfig();
})();
