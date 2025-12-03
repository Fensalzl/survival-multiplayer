const avatarOptions = {
kopfform: { 
    current: 0, 
    options: [
      '<circle cx="50" cy="50" r="45"/>', // Muss SVG sein
      '<ellipse cx="50" cy="50" rx="40" ry="48"/>',
      '<rect x="10" y="10" width="80" height="80" rx="20" ry="20"/>'
    ] 
  },

  haut: { 
    current: 1,
    options: [
      { name: 'Hell', c1: '#FFDFC4', c2:'#F0C8A0' },
      { name: 'Mittel', c1: '#D1A37A', c2:'#B98258' },
      { name: 'Dunkel', c1: '#8B5A3C', c2:'#6A3F2B' },
      { name: 'Gebräunt', c1: '#C68C53', c2:'#A06336' },
      { name: 'Rotbraun', c1: '#A0522D', c2:'#7B341F' }
    ]
  },

  augenfarbe: { current: 1, options: ['#4A6EFF', '#3AA05B', '#7A4E3A', '#5B3E2B', '#2B2B2B'] },
  augengroesse: { current: 1.0, min: 0.8, max: 1.6, step: 0.05 },
  pupillengroesse: { current: 0.7, min: 0.4, max: 1.2, step: 0.05 },
  augenabstand: { current: 0, min: -3, max: 3, step: 0.5 },
  augenbraueDicke: { current: 0.9, min: 0.4, max: 1.6, step: 0.05 },
  augenbraueWinkel: { current: 0, min: -12, max: 12, step: 1 },

  mundForm: { current: 'laecheln', options: ['neutral', 'laecheln', 'ernst', 'offen'] },
  laechelStaerke: { current: 0.5, min: 0, max: 1, step: 0.05 },

  haar: { 
    currentStyle: '-1', // Wichtig: Startwert ist String
    styles: ['kurz', 'mittellang', 'lang', 'pony', 'glatze'],
    options: { // Dieses Objekt muss die SVGs enthalten!
        '-1': '',
        'kurz': '<path d="M50,0 C20,0 20,45 50,45 C80,45 80,0 50,0 Z"/>', 
        'mittellang': '<path d="M50,0 C10,0 10,60 50,60 C90,60 90,0 50,0 Z"/>',
        'lang': '<path d="M50,0 C5,0 5,80 50,80 C95,80 95,0 50,0 Z"/>',
        'pony': '<path d="M50,0 C25,0 25,25 50,25 L50,0 Z"/>',
        'glatze': ''
    },
    colorCurrent: '#2c1b12',
    palette: ['#2c1b12', '#4a2e1a', '#a86e49', '#000000', '#b86f12', '#6a3f2b']
  },

  bart: { 
    current: '-1', 
    options: ['schnurrbart', 'dreitage', 'vollbart'],
    colorOffset: '#2c1b12'
  },

  kopfbedeckung: { 
    current: -1,
    options: [
        '<path d="M5,10 L95,10 L90,5 L10,5 Z"/>',
        '<rect x="0" y="20" width="100" height="10" fill="#654321"/>',
        '<path d="M0,45 A50,50 0 0 1 100,45 L100,0 L0,0 Z" fill="rgba(0,0,0,0.5)" opacity="0.8"/>'
    ]
  },

  narbe: { 
    current: -1,
    options: [
        '<path d="M35,40 L65,35" stroke="red" stroke-width="2" opacity="0.7"/>',
        '<path d="M70,55 L85,65" stroke="red" stroke-width="2" opacity="0.7"/>',
        '<path d="M20,60 Q50,55 80,65" stroke="red" stroke-width="3" fill="none" opacity="0.7"/>'
    ]
  },

  kriegsbemalung: { 
    current: -1,
    options: [
        '<rect x="20" y="25" width="10" height="50" fill="blue" opacity="0.4"/><rect x="70" y="25" width="10" height="50" fill="blue" opacity="0.4"/>',
        '<path d="M10,40 L50,10 L90,40" stroke="red" stroke-width="4" fill="none" opacity="0.5"/>',
        '<rect x="10" y="50" width="80" height="8" fill="yellow" opacity="0.4"/>'
    ]
  },

  akzent: { color: '#33ff33' }
};

/* -----------------------
   HTML (Tabs + Panels)
   ----------------------- */
function createAvatarBuilderHTML() {
  return `
  <div id="avatarBuilder" class="avatar-builder-wrap">
    <div class="avatar-left">
      <div id="avatarPreviewFrame" class="avatar-preview-frame">
   <svg id="avatarPreviewSvg" width="120" height="120" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"></svg>
	 </div>
      <div class="avatar-actions">
        <button id="btnZufall" class="avatar-btn">🎲 Zufall</button>
        <button id="btnReset" class="avatar-btn">↺ Zurücksetzen</button>
        <button id="btnExportSVG" class="avatar-btn">⬇ SVG kopieren</button>
      </div>
    </div>

    <div class="avatar-right">
      <div class="tabs">
        <button class="tab-btn active" data-tab="gesicht">Gesicht</button>
        <button class="tab-btn" data-tab="augen">Augen</button>
        <button class="tab-btn" data-tab="haare">Haare & Bart</button>
        <button class="tab-btn" data-tab="extras">Extras</button>
      </div>

      <div class="tab-content">
        <section id="tab-gesicht" class="tab-panel active">
          <div class="panel-scroll">
            <label>Kopfform</label>
            <div class="btn-row">
                            <button class="kopfform-btn" data-index="0">Rund</button>
              <button class="kopfform-btn" data-index="1">Oval</button>
              <button class="kopfform-btn" data-index="2">Eckig</button>
            </div>

            <label>Hautfarbe</label>
            <div id="hautPalette" class="palette-row"></div>

            <label>Akzentfarbe (Glow / Rahmen)</label>
            <input id="akzentColor" type="color" value="${avatarOptions.akzent.color}" />
          </div>
        </section>

        <section id="tab-augen" class="tab-panel">
          <div class="panel-scroll">
            <label>Augenfarbe</label>
            <div id="augePalette" class="palette-row"></div>

            <label>Augengröße</label>
            <input id="sliderAugenGroesse" type="range" min="${avatarOptions.augengroesse.min}" max="${avatarOptions.augengroesse.max}" step="${avatarOptions.augengroesse.step}" value="${avatarOptions.augengroesse.current}" />

            <label>Pupillengröße</label>
            <input id="sliderPupille" type="range" min="${avatarOptions.pupillengroesse.min}" max="${avatarOptions.pupillengroesse.max}" step="${avatarOptions.pupillengroesse.step}" value="${avatarOptions.pupillengroesse.current}" />

            <label>Augenabstand</label>
            <input id="sliderAugenAbstand" type="range" min="${avatarOptions.augenabstand.min}" max="${avatarOptions.augenabstand.max}" step="${avatarOptions.augenabstand.step}" value="${avatarOptions.augenabstand.current}" />

            <label>Augenbraue: Dicke / Winkel</label>
            <input id="sliderBrowDicke" type="range" min="${avatarOptions.augenbraueDicke.min}" max="${avatarOptions.augenbraueDicke.max}" step="${avatarOptions.augenbraueDicke.step}" value="${avatarOptions.augenbraueDicke.current}" />
            <input id="sliderBrowWinkel" type="range" min="${avatarOptions.augenbraueWinkel.min}" max="${avatarOptions.augenbraueWinkel.max}" step="${avatarOptions.augenbraueWinkel.step}" value="${avatarOptions.augenbraueWinkel.current}" />

            <label>Mundform</label>
            <div class="btn-row">
              <button class="mund-btn" data-val="neutral">Neutral</button>
              <button class="mund-btn" data-val="laecheln">Lächeln</button>
              <button class="mund-btn" data-val="ernst">Ernst</button>
              <button class="mund-btn" data-val="offen">Offen</button>
            </div>
            <label>Lächelstärke</label>
            <input id="sliderLaecheln" type="range" min="${avatarOptions.laechelStaerke.min}" max="${avatarOptions.laechelStaerke.max}" step="${avatarOptions.laechelStaerke.step}" value="${avatarOptions.laechelStaerke.current}" />
          </div>
        </section>

        <section id="tab-haare" class="tab-panel">
          <div class="panel-scroll">
            <label>Haarstil</label>
            <div class="btn-row">
              <button class="haar-btn" data-val="-1">Kein Haar</button>
              ${avatarOptions.haar.styles.map(s=>`<button class="haar-btn" data-val="${s}">${s.charAt(0).toUpperCase()+s.slice(1)}</button>`).join('')}
            </div>

            <label>Haarfarbe</label>
            <div id="haarPalette" class="palette-row"></div>

            <label>Bart</label>
            <div class="btn-row">
              <button class="bart-btn" data-val="-1">Kein Bart</button>
              ${avatarOptions.bart.options.map(b=>`<button class="bart-btn" data-val="${b}">${b.charAt(0).toUpperCase()+b.slice(1)}</button>`).join('')}
            </div>

            <label>Bartfarbe (wird standard auf Haarfarbe gesetzt)</label>
            <input id="bartFarbe" type="color" value="${avatarOptions.haar.colorCurrent}" />
          </div>
        </section>

        <section id="tab-extras" class="tab-panel">
          <div class="panel-scroll">
            <label>Kopfbedeckung</label>
            <select id="selectKopfbedeckung">
              <option value="-1">Keine</option>
              ${avatarOptions.kopfbedeckung.options.map((o,i)=>`<option value="${i}">Kopfbedeckung ${i+1}</option>`).join('')}
            </select>

            <label>Narbe</label>
            <select id="selectNarbe">
              <option value="-1">Keine</option>
              ${avatarOptions.narbe.options.map((o,i)=>`<option value="${i}">Narbe ${i+1}</option>`).join('')}
            </select>

            <label>Kriegsbemalung</label>
            <select id="selectWarpaint">
              <option value="-1">Keine</option>
              ${avatarOptions.kriegsbemalung.options.map((o,i)=>`<option value="${i}">Bemalung ${i+1}</option>`).join('')}
            </select>
          </div>
        </section>
      </div>
    </div>
  </div>
  `;
}

/* -----------------------
   Paletten rendern
   ----------------------- */
function renderPaletten() {
  const hautDiv = document.getElementById('hautPalette');
  const augeDiv = document.getElementById('augePalette');
  const haarDiv = document.getElementById('haarPalette');

  if (hautDiv) {
    hautDiv.innerHTML = '';
    avatarOptions.haut.options.forEach((t, i) => {
      const btn = document.createElement('button');
      btn.className = 'swatch';
      btn.title = t.name;
      btn.style.background = `linear-gradient(180deg, ${t.c1}, ${t.c2})`;
      btn.dataset.index = i;
      btn.addEventListener('click', () => {
        avatarOptions.haut.current = parseInt(btn.dataset.index,10);
        updateAvatarPreview();
      });
      hautDiv.appendChild(btn);
    });
  }

  if (augeDiv) {
    augeDiv.innerHTML = '';
    avatarOptions.augenfarbe.options.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'swatch round';
      b.style.background = c;
      b.title = c;
      b.dataset.index = i;
      b.addEventListener('click', () => {
        avatarOptions.augenfarbe.current = parseInt(b.dataset.index,10);
        updateAvatarPreview();
      });
      augeDiv.appendChild(b);
    });
  }

  if (haarDiv) {
    haarDiv.innerHTML = '';
    avatarOptions.haar.palette.forEach((c) => {
      const btn = document.createElement('button');
      btn.className = 'swatch round';
      btn.style.background = c;
      btn.title = c;
      btn.addEventListener('click', () => {
        avatarOptions.haar.colorCurrent = c;
        document.getElementById('bartFarbe').value = c;
        updateAvatarPreview();
      });
      haarDiv.appendChild(btn);
    });
  }
}

/* -----------------------
   SVG Builder (realistisch-ish)
   - viewBox 0 0 100 100
   ----------------------- */
/* -----------------------
   SVG Builder (korrigiert)
   ----------------------- */
/* -----------------------
   SVG Builder (ENDGÜLTIG KORRIGIERT FÜR NUR avatarOptions-Lesezugriff)
   ----------------------- */
// --- KORRIGIERTE VERSION FÜR DIE UMFANGREICHERE LOGIK (MIT SLIDERN, BART ETC.) ---

/**
 * Erstellt den vollständigen inneren SVG-String (ohne äußeres <svg>-Tag)
 * basierend auf den aktuellen avatarOptions.
 * WICHTIG: Greift NUR auf avatarOptions zu, NICHT auf DOM-Elemente!
 * @returns {string} Der komplette innere SVG-String.
 */
/* -----------------------
   SVG Builder (ENDGÜLTIG KORRIGIERT FÜR ALLE LAYERS)
   ----------------------- */
/**
 * Erstellt den vollständigen inneren SVG-String (ohne äußeres <svg>-Tag)
 * basierend auf den aktuellen avatarOptions.
 * @returns {string} Der komplette innere SVG-String.
 */
function buildAvatarSVGString() {
    let svgContent = '';
    
    // --- Allgemeine Variablen ---
    const kopfformIndex = avatarOptions.kopfform.current;
    
    // SICHERHEITS-CHECK 1: Stelle sicher, dass der Index gültig ist
    const kopfformSvg = avatarOptions.kopfform.options[kopfformIndex];
    if (!kopfformSvg) {
        console.error("FEHLER: Kopfform-Index ist ungültig oder SVG-String fehlt.", kopfformIndex);
        return ''; // Bricht ab, um Absturz zu vermeiden
    }

    // Hautfarbe abrufen (C1 ist der Standard-Farbwert aus dem Objekt)
    const hautfarbe = avatarOptions.haut.options[avatarOptions.haut.current].c1; 
    const augenfarbe = avatarOptions.augenfarbe.options[avatarOptions.augenfarbe.current];
    const bartVal = avatarOptions.bart.current;
    const haarFarbe = avatarOptions.haar.colorCurrent;
    
    // --- Dynamische Werte ---
    const augenGr = parseFloat(avatarOptions.augengroesse.current);
    const pupillenGr = parseFloat(avatarOptions.pupillengroesse.current);
    const augenAbst = parseFloat(avatarOptions.augenabstand.current);
    const augenbraueDicke = parseFloat(avatarOptions.augenbraueDicke.current);
    const augenbraueWinkel = parseFloat(avatarOptions.augenbraueWinkel.current);
    const laechelStaerke = parseFloat(avatarOptions.laechelStaerke.current);
    
    // --- Kopfform & Haut ---
    // Fügt die Hautfarbe direkt in den Kopfform-SVG-String ein
    const headSvg = kopfformSvg.replace(/\/>$/, ` fill="${hautfarbe}"/>`);
    svgContent += `<g id="head">${headSvg}</g>`;
    
    // --- Haare (Hintergrund) ---
    const currentHaarStyle = avatarOptions.haar.currentStyle;
    // SICHERHEITS-CHECK 2: Stelle sicher, dass der Haar-Style-Key existiert
    if (currentHaarStyle !== '-1' && avatarOptions.haar.options[currentHaarStyle]) {
        const haarSvg = avatarOptions.haar.options[currentHaarStyle].replace(/\/>$/, ` fill="${haarFarbe}"/>`);
        svgContent += `<g id="hair_back">${haarSvg}</g>`;
    }
    
    // --- Ohren ---
    svgContent += `<g id="ears"><circle cx="10" cy="50" r="4" fill="${hautfarbe}"/><circle cx="90" cy="50" r="4" fill="${hautfarbe}"/></g>`;
    
    // --- Augenbrauen ---
    const braueY = 32;
    const braueDicke = 4 * augenbraueDicke;
    
    const augenbrauenSvg = `
        <g id="eyebrows" stroke="black" stroke-width="1.5" stroke-linecap="round">
            <path d="M30 ${braueY} L45 ${braueY - (augenbraueWinkel * 0.5)}" stroke-width="${braueDicke}" transform="rotate(${augenbraueWinkel}, 37.5, ${braueY})"/>
            <path d="M55 ${braueY} L70 ${braueY - (augenbraueWinkel * 0.5)}" stroke-width="${braueDicke}" transform="rotate(${-augenbraueWinkel}, 62.5, ${braueY})"/>
        </g>
    `;
    svgContent += augenbrauenSvg;
    
    // --- Augen ---
    const eyeY = 45;
    const eyeBaseR = 7 * augenGr;
    const pupilR = eyeBaseR * 0.5 * pupillenGr;

    const augenSvg = `
        <g id="eyes">
            <g transform="translate(${-augenAbst}, 0)">
                <circle cx="35" cy="${eyeY}" r="${eyeBaseR}" fill="white"/>
                <circle cx="35" cy="${eyeY}" r="${pupilR}" fill="${augenfarbe}"/>
            </g>
            <g transform="translate(${augenAbst}, 0)">
                <circle cx="65" cy="${eyeY}" r="${eyeBaseR}" fill="white"/>
                <circle cx="65" cy="${eyeY}" r="${pupilR}" fill="${augenfarbe}"/>
            </g>
        </g>
    `;
    svgContent += augenSvg;
    
    // --- Nase ---
    svgContent += `<g id="nose"><path d="M50 55 L47 62 L53 62 Z" fill="#00000022"/></g>`;

    // --- Mund ---
    let mundSvg = '';
    const mundY = 70;
    const mundBreite = 20;
    const mundHoehe = 5 * laechelStaerke;
    
    if (avatarOptions.mundForm.current === 'laecheln') {
        mundSvg = `<path d="M${50 - mundBreite / 2},${mundY} Q50,${mundY + mundHoehe} ${50 + mundBreite / 2},${mundY}" stroke="black" stroke-width="1.5" fill="none"/>`;
    } else if (avatarOptions.mundForm.current === 'ernst') {
        mundSvg = `<path d="M${50 - mundBreite / 2},${mundY + 5 - mundHoehe} Q50,${mundY} ${50 + mundBreite / 2},${mundY + 5 - mundHoehe}" stroke="black" stroke-width="1.5" fill="none"/>`;
    } else { // Neutral
        mundSvg = `<line x1="${50 - mundBreite / 2}" y1="${mundY}" x2="${50 + mundBreite / 2}" y2="${mundY}" stroke="black" stroke-width="1.5"/>`;
    }
    
    svgContent += `<g id="mouth">${mundSvg}</g>`;

    // --- Bart ---
    let beardSvg = '';
    if (bartVal && bartVal !== '-1') {
        const bartColor = haarFarbe;
        if (bartVal === 'schnurrbart') {
            beardSvg = `<path d="M40 62 C44 64, 46 64, 50 62 C54 64, 56 64, 60 62" stroke="${bartColor}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`;
        } else if (bartVal === 'dreitage') {
            beardSvg = `${Array.from({length:10}).map((_,i)=>`<circle cx="${32 + i*3.6}" cy="${68 + (i%2)}" r="0.8" fill="${bartColor}" opacity="0.9"/>`).join('')}`;
        } else {
            beardSvg = `<path d="M32 66 Q50 78 68 66 Q65 78 50 84 Q35 78 32 66 Z" fill="${bartColor}" opacity="0.95"/>`;
        }
    }
    svgContent += `<g id="beard">${beardSvg}</g>`;
    
    // --- Kopfbedeckung (NEW LOGIC) ---
    if (avatarOptions.kopfbedeckung.current !== -1) {
        const kopfbedeckungSvg = avatarOptions.kopfbedeckung.options[avatarOptions.kopfbedeckung.current];
        svgContent += `<g id="headwear">${kopfbedeckungSvg}</g>`;
    }

    // --- Narbe (NEW LOGIC) ---
    if (avatarOptions.narbe.current !== -1) {
        const narbeSvg = avatarOptions.narbe.options[avatarOptions.narbe.current];
        svgContent += `<g id="scar">${narbeSvg}</g>`;
    }

    // --- Kriegsbemalung (NEW LOGIC) ---
    if (avatarOptions.kriegsbemalung.current !== -1) {
        const warPaintSvg = avatarOptions.kriegsbemalung.options[avatarOptions.kriegsbemalung.current];
        svgContent += `<g id="warPaint">${warPaintSvg}</g>`;
    }
    
    return svgContent;
}
/* -----------------------
   updatePreview
   ----------------------- */
/* -----------------------
   updateAvatarPreview (KORRIGIERT UND WIEDERHERGESTELLT)
   ----------------------- */
/* -----------------------
   updatePreview (ENDGÜLTIG)
   ----------------------- */
function updateAvatarPreview() {
  const svgEl = document.getElementById('avatarPreviewSvg');
  // WICHTIG: Diese Zeile muss drin bleiben, um die VORSCHAU zu füllen
  if (svgEl) {
    svgEl.innerHTML = buildAvatarSVGString();
  } else {
    // Wenn svgEl nicht existiert (z.B. wenn der Builder geschlossen ist),
    // können wir hier abbrechen, aber die UI-Updates versuchen trotzdem,
    // die Highlights für andere Buttons zu setzen (was kein Fehler ist).
  }

  // 2. UI highlights (Konsistent basierend auf avatarOptions)
  // Dies aktualisiert alle Button-Highlights basierend auf der EINEN Quelle der Wahrheit.
  document.querySelectorAll('.kopfform-btn').forEach(b => b.classList.toggle('selected', b.dataset.val === avatarOptions.kopfform.options[avatarOptions.kopfform.current]));
  
  document.querySelectorAll('.mund-btn').forEach(b => b.classList.toggle('selected', b.dataset.val === avatarOptions.mundForm.current));
  
  document.querySelectorAll('.haar-btn').forEach(b => b.classList.toggle('selected', b.dataset.val === String(avatarOptions.haar.currentStyle)));
  
  document.querySelectorAll('.bart-btn').forEach(b => b.classList.toggle('selected', b.dataset.val === String(avatarOptions.bart.current)));
}

/* -----------------------
   Event listeners
   ----------------------- */
/* -----------------------
   Event listeners (KORRIGIERT FÜR SPEICHERUNG ALLER WERTE)
   ----------------------- */
function initializeAvatarBuilderEventListeners() {
  // Render paletten
  renderPaletten();

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
      const panel = document.getElementById('tab-'+tab);
      if (panel) panel.classList.add('active');
    });
  });
  // Kopfform buttons (KORRIGIERT)
document.querySelectorAll('.kopfform-btn').forEach(b=>{
  b.addEventListener('click', ()=>{
    // Der Button speichert den Index als String, muss in Integer geparst werden
    avatarOptions.kopfform.current = parseInt(b.dataset.index, 10); 
    updateAvatarPreview();
  });
});
  // Augen controls (Slider)
  const sliderMap = {
    'sliderAugenGroesse': 'augengroesse',
    'sliderPupille': 'pupillengroesse',
    'sliderAugenAbstand': 'augenabstand',
    'sliderBrowDicke': 'augenbraueDicke',
    'sliderBrowWinkel': 'augenbraueWinkel',
    'sliderLaecheln': 'laechelStaerke'
  };

  Object.keys(sliderMap).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      // WICHTIG: Wert in avatarOptions speichern
      const key = sliderMap[id];
      const val = (key === 'augenbraueWinkel') ? parseInt(el.value, 10) : parseFloat(el.value);
      avatarOptions[key].current = val;
      updateAvatarPreview();
    });
  });




// Mundform buttons (KORRIGIERT)
document.querySelectorAll('.mund-btn').forEach(b=>{
  b.addEventListener('click', ()=>{
    // document.querySelectorAll('.mund-btn').forEach(x=>x.classList.remove('selected')); // ENTFALLEN
    // b.classList.add('selected'); // ENTFALLEN
    avatarOptions.mundForm.current = b.dataset.val;
    updateAvatarPreview();
  });
});

// hair style buttons (KORRIGIERT)
document.querySelectorAll('.haar-btn').forEach(b=>{
  b.addEventListener('click', ()=>{
    // document.querySelectorAll('.haar-btn').forEach(x=>x.classList.remove('selected')); // ENTFALLEN
    // b.classList.add('selected'); // ENTFALLEN
    avatarOptions.haar.currentStyle = b.dataset.val;
    updateAvatarPreview();
  });
});

// Bart buttons (KORRIGIERT)
document.querySelectorAll('.bart-btn').forEach(b=>{
  b.addEventListener('click', ()=>{
    // document.querySelectorAll('.bart-btn').forEach(x=>x.classList.remove('selected')); // ENTFALLEN
    // b.classList.add('selected'); // ENTFALLEN
    avatarOptions.bart.current = b.dataset.val;
    updateAvatarPreview();
  });
});

  // selects for extras (Kopfbedeckung, Narbe, Warpaint)
  const selectMap = {
    'selectKopfbedeckung': 'kopfbedeckung',
    'selectNarbe': 'narbe',
    'selectWarpaint': 'kriegsbemalung'
  };
  
  Object.keys(selectMap).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      // WICHTIG: Wert in avatarOptions speichern
      avatarOptions[selectMap[id]].current = parseInt(el.value, 10);
      updateAvatarPreview();
    });
  });


  // palette / color inputs
  document.getElementById('akzentColor')?.addEventListener('input', (e) => {
    avatarOptions.akzent.color = e.target.value; // WICHTIG: Akzentfarbe speichern
    updateAvatarPreview();
  });
  
  document.getElementById('bartFarbe')?.addEventListener('input', (e) => {
    // WICHTIG: Bartfarbe (wird in haar.colorCurrent gespeichert)
    avatarOptions.haar.colorCurrent = e.target.value;
    updateAvatarPreview();
  });


  // Buttons (Zufall, Reset, Export)
  document.getElementById('btnZufall')?.addEventListener('click', randomizeAvatar);
  document.getElementById('btnReset')?.addEventListener('click', resetAvatar);
  document.getElementById('btnExportSVG')?.addEventListener('click', ()=> {
    const data = getCurrentAvatarData();
    // copy svg string to clipboard (inner content)
    const svgFull = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${data.svgContent}</svg>`;
    navigator.clipboard?.writeText(svgFull).then(()=> alert('SVG in Zwischenablage kopiert.'));
  });

  // initial highlights
  document.querySelectorAll('.mund-btn').forEach(b => { if (b.dataset.val === avatarOptions.mundForm.current) b.classList.add('selected'); });
  document.querySelectorAll('.kopfform-btn').forEach(b => { if (b.dataset.val === avatarOptions.kopfform.options[avatarOptions.kopfform.current]) b.classList.add('selected'); });

  // palette click handlers already added in renderPaletten
  updateAvatarPreview();
}

/* -----------------------
   Random & Reset
   ----------------------- */
/* -----------------------
   Randomize (KORRIGIERT: Speichert Slider-Werte in avatarOptions)
   ----------------------- */
function randomizeAvatar() {
  const randomFloat = (min, max, step) => {
    const precision = (step.toString().includes('.')) ? step.toString().split('.')[1].length : 0;
    return parseFloat((Math.random() * (max - min) + min).toFixed(precision));
  };

  avatarOptions.kopfform.current = Math.floor(Math.random() * avatarOptions.kopfform.options.length);
  avatarOptions.haut.current = Math.floor(Math.random() * avatarOptions.haut.options.length);
  avatarOptions.augenfarbe.current = Math.floor(Math.random() * avatarOptions.augenfarbe.options.length);

  // SLIDER: Werte in avatarOptions speichern UND DOM aktualisieren
  avatarOptions.augengroesse.current = randomFloat(avatarOptions.augengroesse.min, avatarOptions.augengroesse.max, avatarOptions.augengroesse.step);
  document.getElementById('sliderAugenGroesse').value = avatarOptions.augengroesse.current;
  
  avatarOptions.pupillengroesse.current = randomFloat(avatarOptions.pupillengroesse.min, avatarOptions.pupillengroesse.max, avatarOptions.pupillengroesse.step);
  document.getElementById('sliderPupille').value = avatarOptions.pupillengroesse.current;

  avatarOptions.augenabstand.current = randomFloat(avatarOptions.augenabstand.min, avatarOptions.augenabstand.max, avatarOptions.augenabstand.step);
  document.getElementById('sliderAugenAbstand').value = avatarOptions.augenabstand.current;

  avatarOptions.augenbraueDicke.current = randomFloat(avatarOptions.augenbraueDicke.min, avatarOptions.augenbraueDicke.max, avatarOptions.augenbraueDicke.step);
  document.getElementById('sliderBrowDicke').value = avatarOptions.augenbraueDicke.current;

  // Winkel muss Integer sein
  avatarOptions.augenbraueWinkel.current = Math.floor(randomFloat(avatarOptions.augenbraueWinkel.min, avatarOptions.augenbraueWinkel.max, avatarOptions.augenbraueWinkel.step));
  document.getElementById('sliderBrowWinkel').value = avatarOptions.augenbraueWinkel.current;

  avatarOptions.laechelStaerke.current = randomFloat(avatarOptions.laechelStaerke.min, avatarOptions.laechelStaerke.max, avatarOptions.laechelStaerke.step);
  document.getElementById('sliderLaecheln').value = avatarOptions.laechelStaerke.current;


  // Mund
  const mouths = avatarOptions.mundForm.options;
  avatarOptions.mundForm.current = mouths[Math.floor(Math.random()*mouths.length)];

  // Haare / Bart
  const pickHair = Math.random() < 0.6 ? avatarOptions.haar.styles[Math.floor(Math.random()*avatarOptions.haar.styles.length)] : '-1';
  avatarOptions.haar.currentStyle = pickHair;

  const pickBart = Math.random() < 0.3 ? avatarOptions.bart.options[Math.floor(Math.random()*avatarOptions.bart.options.length)] : '-1';
  avatarOptions.bart.current = pickBart;

  // Farben
  const randColor = avatarOptions.haar.palette[Math.floor(Math.random()*avatarOptions.haar.palette.length)];
  avatarOptions.haar.colorCurrent = randColor;
  document.getElementById('bartFarbe').value = randColor;

  // Highlights / Update
  updateAvatarPreview();
}

/* -----------------------
   Reset (KORRIGIERT: Speichert Slider-Werte in avatarOptions)
   ----------------------- */
function resetAvatar() {
  // Optionen
  avatarOptions.kopfform.current = 0;
  avatarOptions.haut.current = 1;
  avatarOptions.augenfarbe.current = 1;

  // SLIDER: Werte in avatarOptions speichern UND DOM aktualisieren
  avatarOptions.augengroesse.current = 1.0;
  document.getElementById('sliderAugenGroesse').value = avatarOptions.augengroesse.current;
  
  avatarOptions.pupillengroesse.current = 0.7;
  document.getElementById('sliderPupille').value = avatarOptions.pupillengroesse.current;
  
  avatarOptions.augenabstand.current = 0;
  document.getElementById('sliderAugenAbstand').value = avatarOptions.augenabstand.current;
  
  avatarOptions.augenbraueDicke.current = 0.9;
  document.getElementById('sliderBrowDicke').value = avatarOptions.augenbraueDicke.current;
  
  avatarOptions.augenbraueWinkel.current = 0;
  document.getElementById('sliderBrowWinkel').value = avatarOptions.augenbraueWinkel.current;

  avatarOptions.laechelStaerke.current = 0.5;
  document.getElementById('sliderLaecheln').value = avatarOptions.laechelStaerke.current;
  
  // Mund
  avatarOptions.mundForm.current = 'laecheln';

  // Haare / Bart
  avatarOptions.haar.currentStyle = '-1';
  avatarOptions.bart.current = '-1';
  
  // Farben (Bartfarbe wird von updatePreview übernommen)
  document.getElementById('akzentColor').value = avatarOptions.akzent.color;
  document.getElementById('bartFarbe').value = avatarOptions.haar.colorCurrent;

  // UI Highlights / Update
  updateAvatarPreview();
}

/* -----------------------
   getCurrentAvatarData (API)
   ----------------------- */
function getCurrentAvatarData() {
    const accentColor = avatarOptions.haut.options[avatarOptions.haut.current].c1;

    return {
        svgContent: buildAvatarSVGString(),
        color: accentColor // Hauptfarbe für Rahmen etc.
    };
}
/* -----------------------
   renderPlayerAvatar (kompatibel mit game.js)
   ----------------------- */
window.renderPlayerAvatar = function(avatarData) {
  const avatarElement = document.getElementById('playerAvatarDisplay');
  if (!avatarElement || !avatarData || !avatarData.svgContent) return;

  const accent = avatarData.color || '#33ff33';
  avatarElement.style.backgroundColor = 'transparent';
  avatarElement.style.borderColor = accent;
  avatarElement.style.boxShadow = `0 0 8px ${accent}80`;

  // WICHTIG: Fügt den benötigten <svg>-Wrapper um den Inhalt
  const svgContent = `
    <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      ${avatarData.svgContent}
    </svg>
  `;
  avatarElement.innerHTML = svgContent;
};


/* -----------------------
   Export/Make global
   ----------------------- */
window.createAvatarBuilderHTML = createAvatarBuilderHTML;
window.initializeAvatarBuilderEventListeners = initializeAvatarBuilderEventListeners;
window.updateAvatarPreview = updateAvatarPreview;
window.getCurrentAvatarData = getCurrentAvatarData;

/* -----------------------
   Auto-init if container present
   ----------------------- */
(function autoInit() {
  const container = document.getElementById('avatarBuilderContainer');
  if (!container) return;
  container.innerHTML = createAvatarBuilderHTML();
  setTimeout(() => {
    renderPaletten();
    initializeAvatarBuilderEventListeners();
    updateAvatarPreview();
    // small UI dressing
    document.querySelectorAll('#avatarBuilder .avatar-btn, #avatarBuilder .kopfform-btn, #avatarBuilder .mund-btn, #avatarBuilder .haar-btn, #avatarBuilder .bart-btn')
      .forEach(b => {
        b.style.padding = '6px 8px';
        b.style.borderRadius = '6px';
      });
  }, 30);
})();