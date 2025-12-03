// === bank.js - KORRIGIERTE VERSION (Zeile 1-50) ===
(function(){

  // WICHTIG: Verwende 'let' statt 'const' für bankState, da es überschrieben werden muss
  let bankState = window.bankState || {
    deposits: 0,
    depositsHistory: [],
    loans: [],
    stock: {},
    stockHistory: [],
    marketPrices: {},
    lastTick: 0,
    daxCanvasId: 'bankDaxCanvas',
    priceHistoryMax: 120,
    loanCounter: 1
  };
  
  // Weise es dem window-Objekt zu
  window.bankState = bankState;

  // initial prices depend on resources (simple formula)
  function initMarketPrices() {
    // WICHTIG: Manuell alle Ressourcen initialisieren
    const allResources = ['holz', 'stein', 'essen', 'wasser', 'medis', 'waffen', 'wolle', 'garn', 'stoff', 'kleidung'];
    
    allResources.forEach(k => {
        const qty = (window.resources && window.resources[k]) ? window.resources[k] : 1;
        let base;
        
        switch(k) {
            case 'holz': base = 5; break;
            case 'stein': base = 8; break;
            case 'essen': base = 12; break;
            case 'wasser': base = 7; break;
            case 'medis': base = 20; break;
            case 'waffen': base = 30; break;
            case 'wolle': base = 15; break;
            case 'garn': base = 25; break;
            case 'stoff': base = 40; break;
            case 'kleidung': base = 60; break;
            default: 
                base = Math.max(1, Math.round(50 - Math.log(qty + 1) * 8));
        }
        
        bankState.marketPrices[k] = base;
    });
    pushPriceSnapshot();
  }

  function pushPriceSnapshot() {
    const snapshot = {
      t: Date.now(),
      prices: JSON.parse(JSON.stringify(bankState.marketPrices))
    };
    bankState.stockHistory.push(snapshot);
    if (bankState.stockHistory.length > bankState.priceHistoryMax) bankState.stockHistory.shift();
  }

  // UI erzeugen (Modal). Wird einmal hinzugefügt beim Laden.
  function createBankModal() {
    if (document.getElementById('bankModal')) return;

    const modal = document.createElement('div');
    modal.id = 'bankModal';
    modal.style = `
    position: absolute;
    top: 2%;
    left: 2%;
    width: 96%;
    height: 96%;
    background:#001900;
    border:3px solid #33ff33;
    box-shadow: 0 0 20px #00ff00;
    padding:14px;
    box-sizing:border-box;
    overflow:auto;
    z-index: 9999;
    display: none;
`;
    modal.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h2 style="margin:0;color:#00ff99">Bank - Filiale</h2>
        <div>
          <button id="bankCloseBtn" style="margin-right:8px;">Schließen</button>
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-top:12px;">
        <div style="flex:1;min-width:280px;">
          <h3>Kontostand & Aktionen</h3>
          <p id="bankBalance">Konto: 0 Zombify</p>
          <div>
            <input id="bankAmountInput" type="number" min="1" placeholder="Betrag" style="width:120px;margin-right:8px;">
            <button id="bankDepositBtn">Einzahlen</button>
            <button id="bankWithdrawBtn">Abheben</button>
          </div>
          <div style="margin-top:10px;">
            <h4>Sparplan</h4>
            <label>Dauer (Tage): <input id="bankSaveDuration" type="number" value="7" min="1" style="width:70px"></label>
            <button id="bankSaveBtn">Sparplan anlegen</button>
          </div>
          <div style="margin-top:10px;">
            <h4>Kredit</h4>
            <input id="bankLoanAmount" type="number" min="10" placeholder="Kreditbetrag" style="width:140px;margin-right:8px;">
            <button id="bankLoanBtn">Kredit aufnehmen</button>
            <p style="font-size:12px;color:#99ff99">Kreditzinsen: 3% pro Woche (simuliert)</p>
          </div>
          <div style="margin-top:12px;">
            <h4>Laufende Kredite</h4>
            <div id="bankLoanList" style="height:100px;overflow:auto;background:#001200;border:1px solid #004400;padding:6px;"></div>
          </div>
        </div>

        <div style="flex:1.4;min-width:360px;">
          <h3>Aktienhandel (Rohstoffbezogen)</h3>
          <div id="bankMarketList" style="background:#001200;border:1px solid #004400;padding:8px;height:260px;overflow:auto;"></div>
          <div style="margin-top:8px;">
            <input id="bankStockAmount" type="number" min="1" placeholder="Anzahl" style="width:100px;margin-right:8px;">
            <button id="bankBuyStockBtn">Kaufen</button>
            <button id="bankSellStockBtn">Verkaufen</button>
            <select id="bankStockSelect" style="margin-left:8px;"></select>
          </div>
        </div>

        <div style="flex:1;min-width:280px;">
          <h3>Portfolio & DAX</h3>
          <div id="bankPortfolio" style="background:#001200;border:1px solid #004400;padding:8px;height:200px;overflow:auto;"></div>
          <canvas id="${bankState.daxCanvasId}" width="600" height="160" style="width:100%;border:1px solid #004400;margin-top:8px;background:#001100"></canvas>
        </div>
      </div>
    `;
    document.getElementById('monitor').appendChild(modal);

    // Events
    document.getElementById('bankCloseBtn').addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('bankDepositBtn').addEventListener('click', handleDepositBtn);
    document.getElementById('bankWithdrawBtn').addEventListener('click', handleWithdrawBtn);
    document.getElementById('bankSaveBtn').addEventListener('click', handleCreateSave);
    document.getElementById('bankLoanBtn').addEventListener('click', handleTakeLoan);
    document.getElementById('bankBuyStockBtn').addEventListener('click', handleBuyStock);
    document.getElementById('bankSellStockBtn').addEventListener('click', handleSellStock);

    renderMarketList();
    renderPortfolio();
    renderBalance();
    renderLoanList();
    startMarketSimulation();
  }

  // Öffnet Bank-Modal (extern aufrufbar)
  function openBank(buildingId) {
    createBankModal();
    const modal = document.getElementById('bankModal');
    modal.style.display = 'block';
    const b = window.buildings ? window.buildings.find(x => x.id === buildingId) : null;
    if (b) {
      modal.querySelector('h2').textContent = `Bank - Filiale: ${b.name || 'Bank'}`;
    }
    renderMarketList();
    renderPortfolio();
    renderBalance();
    renderLoanList();
  }

  // ==== Aktionen ====

  function renderBalance() {
    const el = document.getElementById('bankBalance');
    if (!el) return;
    el.textContent = `Kontostand: ${bankState.deposits} Zombify  |  Verfügbar: ${window.money || 0}`;
  }

  function logCashflow(msg) {
    // Optional: wenn du ein Cashflow-Log hast
    if (window.logEvent) window.logEvent(msg);
  }

  function handleDepositBtn() {
    const input = document.getElementById('bankAmountInput');
    const amount = Math.max(0, Math.floor(Number(input.value) || 0));
    if (amount <= 0) return alert('Gib einen Betrag > 0 ein.');
    if ((window.money || 0) < amount) return alert('Nicht genug Zombify verfügbar.');
    window.money -= amount;
    bankState.deposits += amount;
    renderBalance();
    if (window.logEvent) window.logEvent(`Bank: ${amount} Zombify eingezahlt.`);
    logCashflow(`+ Einzahlung ${amount}`);
    if (window.statRender) window.statRender();
  }

  function handleWithdrawBtn() {
    const input = document.getElementById('bankAmountInput');
    const amount = Math.max(0, Math.floor(Number(input.value) || 0));
    if (amount <= 0) return alert('Gib einen Betrag > 0 ein.');
    if (bankState.deposits < amount) return alert('Nicht genug Guthaben auf dem Konto.');
    bankState.deposits -= amount;
    window.money += amount;
    renderBalance();
    if (window.logEvent) window.logEvent(`Bank: ${amount} Zombify abgehoben.`);
    logCashflow(`- Abhebung ${amount}`);
    if (window.statRender) window.statRender();
  }

  function handleCreateSave() {
    const amount = Math.max(0, Math.floor(Number(document.getElementById('bankAmountInput').value) || 0));
    const duration = Math.max(1, Math.floor(Number(document.getElementById('bankSaveDuration').value) || 7));
    if (amount <= 0) return alert('Gib einen Betrag > 0 ein.');
    if ((window.money || 0) < amount) return alert('Nicht genug Zombify zum Anlegen.');
    const interestRatePerDay = 0.002;
    const expectedGain = Math.floor(amount * interestRatePerDay * duration);
    window.money -= amount;
    bankState.depositsHistory.push({ amount, startDay: (window.stats ? window.stats.tag : 1), durationDays: duration, expectedGain });
    if (window.logEvent) window.logEvent(`Sparplan: ${amount} über ${duration} Tage angelegt (Erwarteter Gewinn: ${expectedGain}).`);
    logCashflow(`- Sparplan ${amount} für ${duration} Tage`);
    renderBalance();
    if (window.statRender) window.statRender();
  }

  function handleTakeLoan() {
    const amount = Math.max(0, Math.floor(Number(document.getElementById('bankLoanAmount').value) || 0));
    if (amount <= 0) return alert('Gib einen Kreditbetrag > 0 ein.');
    const maxLoan = Math.max(100, Math.floor((bankState.deposits || 0) * 2 + 200));
    if (amount > maxLoan) return alert(`Maximaler Kredit: ${maxLoan}`);
    const interest = 0.03;
    const dueInDays = 7;
    const dueDay = (window.stats ? window.stats.tag : 1) + dueInDays;
    const loan = { id: 'L' + (bankState.loanCounter++), amount, interest, dueDay };
    bankState.loans.push(loan);
    window.money = (window.money || 0) + amount;
    if (window.logEvent) window.logEvent(`Kredit aufgenommen: ${amount} Zombify (Zins ${interest*100}% in ${dueInDays} Tagen).`);
    logCashflow(`+ Kredit ${amount}`);
    renderBalance();
    renderLoanList();
    if (window.statRender) window.statRender();
  }

  function renderLoanList() {
    const el = document.getElementById('bankLoanList');
    if (!el) return;
    el.innerHTML = '';
    
    if (bankState.loans.length === 0) {
      el.innerHTML = '<div style="color:#666;font-style:italic;">Keine Kredite</div>';
      return;
    }
    
    bankState.loans.forEach(loan => {
      const div = document.createElement('div');
      div.style.marginBottom = '5px';
      div.style.padding = '4px';
      div.style.background = '#002200';
      div.style.border = '1px solid #004400';
      div.innerHTML = `${loan.id}: ${loan.amount} Z | Fällig: Tag ${loan.dueDay} | Zinsen: ${(loan.interest * 100).toFixed(1)}%`;
      el.appendChild(div);
    });
  }

  function renderMarketList() {
    const el = document.getElementById('bankMarketList');
    const select = document.getElementById('bankStockSelect');
    if (!el || !select) return;
    el.innerHTML = '';
    select.innerHTML = '';

    const resourceNames = {
      holz: 'Holz',
      stein: 'Stein',
      essen: 'Essen',
      wasser: 'Wasser',
      medis: 'Medis',
      waffen: 'Waffen',
      wolle: 'Wolle',
      garn: 'Garn',
      stoff: 'Stoff',
      kleidung: 'Kleidung'
    };

    Object.keys(bankState.marketPrices).forEach(k => {
      const price = bankState.marketPrices[k];
      const displayName = resourceNames[k] || k;
      
      const div = document.createElement('div');
      div.className = 'market-item';
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.padding = '4px';
      div.style.marginBottom = '3px';
      div.innerHTML = `<div style="font-family:monospace">${displayName} &nbsp; | Preis: ${price}</div>
        <div style="min-width:140px;text-align:right;font-family:monospace">Besitz: ${bankState.stock[k] || 0}</div>`;
      el.appendChild(div);

      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = `${displayName} (Preis: ${price})`;
      select.appendChild(opt);
    });
  }

  function handleBuyStock() {
    const resource = document.getElementById('bankStockSelect').value;
    const qty = Math.max(1, Math.floor(Number(document.getElementById('bankStockAmount').value) || 1));
    if (!resource) return alert('Wähle eine Aktie (Rohstoff).');
    const price = bankState.marketPrices[resource] || 1;
    const cost = price * qty;
    if ((window.money || 0) < cost) return alert('Nicht genug Zombify zum Kauf.');
    window.money -= cost;
    bankState.stock[resource] = (bankState.stock[resource] || 0) + qty;
    if (window.logEvent) window.logEvent(`Aktien: ${qty}x ${resource} gekauft für ${cost} Zombify.`);
    logCashflow(`- Kauf ${qty} ${resource} (${cost})`);
    renderMarketList();
    renderPortfolio();
    renderBalance();
    if (window.statRender) window.statRender();
  }

  function handleSellStock() {
    const resource = document.getElementById('bankStockSelect').value;
    const qty = Math.max(1, Math.floor(Number(document.getElementById('bankStockAmount').value) || 1));
    if (!resource) return alert('Wähle eine Aktie (Rohstoff).');
    if ((bankState.stock[resource] || 0) < qty) return alert('Nicht genug Anteile zum Verkaufen.');
    const price = bankState.marketPrices[resource] || 1;
    const gain = price * qty;
    bankState.stock[resource] -= qty;
    window.money = (window.money || 0) + gain;
    if (window.logEvent) window.logEvent(`Aktien: ${qty}x ${resource} verkauft für ${gain} Zombify.`);
    logCashflow(`+ Verkauf ${qty} ${resource} (${gain})`);
    renderMarketList();
    renderPortfolio();
    renderBalance();
    if (window.statRender) window.statRender();
  }

  function renderPortfolio() {
    const el = document.getElementById('bankPortfolio');
    if (!el) return;
    el.innerHTML = '';
    const list = document.createElement('div');
    list.style.fontFamily = 'monospace';
    list.innerHTML += `<div>Guthaben: ${bankState.deposits} Zombify</div>`;
    list.innerHTML += `<div style="margin-top:6px;">Kredite: ${bankState.loans.length}</div>`;
    list.innerHTML += '<div style="margin-top:6px;">Aktien:</div>';
    const ul = document.createElement('div');
    Object.keys(bankState.stock).forEach(k => {
      if (bankState.stock[k] > 0) {
        ul.innerHTML += `<div>${k.toUpperCase()}: ${bankState.stock[k]} St. (Preis: ${bankState.marketPrices[k]})</div>`;
      }
    });
    list.appendChild(ul);
    el.appendChild(list);
  }

  function simulateMarketTick() {
    Object.keys(bankState.marketPrices).forEach(k => {
      const qty = (window.resources && window.resources[k]) || 1;
      let base = Math.max(1, Math.round(40 - Math.log(qty + 1) * 6));
      const noise = (Math.random() - 0.45) * 4;
      const holding = bankState.stock[k] || 0;
      const holdingFactor = Math.log(1 + holding) * 0.7;
      let newPrice = Math.max(1, Math.round(base + noise + holdingFactor));
      const old = bankState.marketPrices[k];
      const maxChange = Math.max(2, Math.round(old * 0.12));
      newPrice = Math.min(old + maxChange, Math.max(old - maxChange, newPrice));
      bankState.marketPrices[k] = newPrice;
    });

    processSavingsAndLoans();

    if (!bankState.lastTick || Date.now() - bankState.lastTick > 1500) {
      pushPriceSnapshot();
      bankState.lastTick = Date.now();
    }

    renderMarketList();
    renderPortfolio();
    renderBalance();
    drawDax();
  }

  function processSavingsAndLoans() {
    const today = window.stats ? window.stats.tag : 1;
    
    for (let i = bankState.depositsHistory.length - 1; i >= 0; i--) {
      const s = bankState.depositsHistory[i];
      if (today >= s.startDay + s.durationDays) {
        bankState.deposits += (s.amount + s.expectedGain);
        if (window.logEvent) window.logEvent(`Sparplan fällig: +${s.amount + s.expectedGain} (inkl. Gewinn ${s.expectedGain}).`);
        logCashflow(`+ Sparplan fällig ${s.amount + s.expectedGain}`);
        bankState.depositsHistory.splice(i, 1);
      }
    }

    for (let i = bankState.loans.length - 1; i >= 0; i--) {
      const loan = bankState.loans[i];
      if (today >= loan.dueDay) {
        const repayment = Math.ceil(loan.amount * (1 + loan.interest));
        if ((window.money || 0) >= repayment) {
          window.money -= repayment;
          bankState.loans.splice(i,1);
          if (window.logEvent) window.logEvent(`Kredit zurückgezahlt: ${repayment} Zombify.`);
          logCashflow(`- Kreditrückzahlung ${repayment}`);
        } else {
          loan.interest *= 1.5;
          loan.dueDay += 3;
          if (window.logEvent) window.logEvent(`Kredit nicht zurückgezahlt! Strafzins angewandt. Neue Fälligkeit in 3 Tagen.`);
          logCashflow(`! Verzug Kredit ${loan.id}`);
        }
      }
    }
    
    renderLoanList();
  }

  function drawDax() {
    const canvas = document.getElementById(bankState.daxCanvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0,0,w,h);

    const series = bankState.stockHistory.map(snap => {
      const sum = Object.values(snap.prices).reduce((a,b)=>a+b,0);
      return sum;
    });
    if (series.length < 2) return;

    const max = Math.max(...series);
    const min = Math.min(...series);
    const range = Math.max(1, max - min);

    ctx.strokeStyle = '#003300';
    ctx.lineWidth = 1;
    for (let i=0;i<4;i++){
      ctx.beginPath();
      ctx.moveTo(0, (h/4)*i + 2);
      ctx.lineTo(w, (h/4)*i + 2);
      ctx.stroke();
    }

    ctx.beginPath();
    for (let i=0;i<series.length;i++){
      const x = (i / (series.length - 1)) * w;
      const y = h - ((series[i] - min) / range) * (h - 10) - 5;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.strokeStyle = '#00dd66';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#33ff33';
    ctx.font = '12px monospace';
    ctx.fillText('DAX (sim) ' + Math.round(series[series.length-1]), 8, 14);
  }

  let marketInterval = null;
  function startMarketSimulation() {
    if (!marketInterval) {
      initMarketPrices();
      marketInterval = setInterval(simulateMarketTick, 2500);
    }
  }

  // NEU: Export-Funktionen für Speichersystem
  window.getBankState = function() {
    return JSON.parse(JSON.stringify(bankState)); // Deep copy
  };

  window.setBankState = function(newState) {
    if (newState) {
      bankState = newState;
      window.bankState = bankState;
    }
  };

  window.renderBalance = renderBalance;
  window.renderPortfolio = renderPortfolio;
  window.renderLoanList = renderLoanList;
  window.drawDaxGraph = drawDax;

  window.initBankModule = function() {
    createBankModal();
    startMarketSimulation();
  };

  window.openBank = openBank;

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
      if (window.buildings && window.stats) initMarketPrices();
    }, 800);
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        if (window.buildings && window.stats) initMarketPrices();
      }, 800);
    });
  }

})();