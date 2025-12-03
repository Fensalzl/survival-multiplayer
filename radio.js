document.addEventListener("DOMContentLoaded", () => {
  
  // ==========================================
  // GLOBALE RADIO-VARIABLEN
  // ==========================================
  
  window.radioState = {
    isOpen: false,
    hasUnread: false,
    unreadCount: 0,
    messages: [], // Alle Nachrichten
    settlements: [], // Entdeckte Siedlungen
    maxSettlements: 2, // Startwert
    nextMessageId: 1,
    nextSettlementId: 1,
    lastScanDay: 0,
    scanCooldown: 5, // Tage zwischen Scans
    
    // Diplomatie-Werte
    relationshipThresholds: {
      allied: 80,
      friendly: 40,
      neutral: 0,
      hostile: -40,
      enemy: -80
    }
  };

  // Skills-Integration
  window.radioSkills = {
    scanRange1: false,  // +3 Siedlungen
    scanRange2: false,  // +1 Siedlung  
    scanRange3: false,  // +2 Siedlungen
    loneOperator: false // Einsamer Funker freigeschaltet
  };

  // ==========================================
  // SIEDLUNGS-GENERIERUNG
  // ==========================================
  
  const SETTLEMENT_NAMES = [
    "Eisenstadt", "Waldheim", "Steinbrück", "Nebelhain", "Frostburg",
    "Rotfels", "Grüntal", "Silberhafen", "Dunkelwald", "Lichtmark",
    "Bernsteinfurt", "Kupferkuppe", "Rabenfels", "Wolfshügel", "Adlernest",
    "Bärengrund", "Hirschtal", "Fuchsburg", "Kranichsee", "Eulenhain"
  ];

  const SETTLEMENT_TYPES = [
    { type: "mining", name: "Bergbau-Kolonie", resources: ["stein", "holz", "waffen"] },
    { type: "farming", name: "Agrar-Siedlung", resources: ["essen", "wolle", "wasser"] },
    { type: "medical", name: "Sanitäts-Station", resources: ["medis", "wasser", "essen"] },
    { type: "military", name: "Militär-Außenposten", resources: ["waffen", "stein", "holz"] },
    { type: "trading", name: "Handelsposten", resources: ["garn", "stoff", "kleidung"] }
  ];

  function generateSettlement() {
    const usedNames = window.radioState.settlements.map(s => s.name);
    const availableNames = SETTLEMENT_NAMES.filter(n => !usedNames.includes(n));
    
    if (availableNames.length === 0) return null;
    
    const name = availableNames[Math.floor(Math.random() * availableNames.length)];
    const typeData = SETTLEMENT_TYPES[Math.floor(Math.random() * SETTLEMENT_TYPES.length)];
    
    return {
      id: `settlement_${window.radioState.nextSettlementId++}`,
      name: name,
      type: typeData.type,
      typeName: typeData.name,
      resources: typeData.resources,
      reputation: 0, // -100 bis +100
      status: "neutral", // neutral, friendly, allied, hostile, enemy
      lastContact: window.stats.tag,
      tradeOffers: [],
      gifts: []
    };
  }

  // ==========================================
  // NACHRICHTEN-SYSTEM
  // ==========================================
  
function addMessage(type, content, settlementId = null) {
    
    // Wir erstellen nur EIN EINZIGES, korrektes Nachrichtenobjekt
    const finalMessage = {
        // ID nur einmal inkrementieren, mit dem korrekten Format
        id: `msg_${window.radioState.nextMessageId++}`, 
        type: type, 
        content: content,
        settlementId: settlementId,
        
        // 🔥 KRITISCH: Speichere den Spieltag UNTER dem Schlüssel 'day'
        day: window.stats.tag, 
        
        // Speichere den echten, großen Timestamp (für Sortierung) UNTER dem Schlüssel 'timestamp'
        timestamp: new Date().getTime(), 
        
        read: false,
        isNew: true
    };
    
    // Füge NUR das korrigierte Objekt ein
    window.radioState.messages.unshift(finalMessage); 
    
    window.radioState.hasUnread = true;
    window.radioState.unreadCount++;
    if (window.updateRadioButton) updateRadioButton(); 
    
    if (window.logEvent) {
      window.logEvent(`📻 Neue Funknachricht empfangen!`);
    }
}
  
  function cleanupOldMessages() {
    // Nachrichten löschen, die älter als 10 Tage sind
    const MAX_AGE_DAYS = 10; 
    const currentDay = window.stats.tag;

    // Filtert alle Nachrichten heraus, die nicht älter als MAX_AGE_DAYS sind.
    const newMessages = window.radioState.messages.filter(msg => {
        // Wenn kein Tag gespeichert ist (altes Savegame), behalte die Nachricht
        if (!msg.day) return true; 
        
        const messageAge = currentDay - msg.day;
        return messageAge < MAX_AGE_DAYS; 
    });

    // Prüfe, ob Nachrichten gelöscht wurden und aktualisiere bei Bedarf
    if (newMessages.length < window.radioState.messages.length) {
        // console.log(`[RADIO] ${window.radioState.messages.length - newMessages.length} Nachrichten gelöscht.`);
        window.radioState.messages = newMessages;
        
        // UI neu rendern, falls das Funkgerät geöffnet ist
        if (window.radioState.isOpen) {
            renderMessages();
        }
    }
}
window.cleanupOldMessages = cleanupOldMessages;

  // ==========================================
  // DIPLOMATIE & REPUTATION
  // ==========================================
  
  function changeReputation(settlementId, amount) {
    const settlement = window.radioState.settlements.find(s => s.id === settlementId);
    if (!settlement) return;
    
    settlement.reputation = Math.max(-100, Math.min(100, settlement.reputation + amount));
    settlement.lastContact = window.stats.tag;
    
    // Status-Update basierend auf Reputation
    const thresh = window.radioState.relationshipThresholds;
    if (settlement.reputation >= thresh.allied) {
      if (settlement.status !== "allied") {
        settlement.status = "allied";
        addMessage("internal", `🤝 ${settlement.name} ist nun unser Verbündeter!`, settlementId);
      }
    } else if (settlement.reputation >= thresh.friendly) {
      settlement.status = "friendly";
    } else if (settlement.reputation >= thresh.neutral) {
      settlement.status = "neutral";
    } else if (settlement.reputation >= thresh.hostile) {
      if (settlement.status !== "hostile") {
        settlement.status = "hostile";
        addMessage("threat", `⚠️ ${settlement.name} ist uns gegenüber feindselig geworden!`, settlementId);
      }
    } else {
      if (settlement.status !== "enemy") {
        settlement.status = "enemy";
        addMessage("threat", `💀 ${settlement.name} hat uns den Krieg erklärt!`, settlementId);
      }
    }
  }

  // ==========================================
  // HANDELS-ANGEBOTE GENERIEREN
  // ==========================================
  
  function generateTradeOffer(settlement) {
    const offerTypes = ["request_resources", "offer_resources", "request_citizens", "trade_resources"];
    const type = offerTypes[Math.floor(Math.random() * offerTypes.length)];
    
    let content = "";
    let offerData = {};
    
    if (type === "request_resources") {
      const resource = settlement.resources[Math.floor(Math.random() * settlement.resources.length)];
      const amount = Math.floor(Math.random() * 20) + 10;
      const payment = Math.floor(amount * (Math.random() * 2 + 1.5) * 10);
      
      content = `${settlement.name} bittet um ${amount} ${resource}. Bezahlung: ${payment} Zombify.`;
      offerData = { type, resource, amount, payment };
      
    } else if (type === "offer_resources") {
      const resource = settlement.resources[Math.floor(Math.random() * settlement.resources.length)];
      const amount = Math.floor(Math.random() * 15) + 5;
      const cost = Math.floor(amount * (Math.random() * 1.5 + 1) * 8);
      
      content = `${settlement.name} bietet ${amount} ${resource} für ${cost} Zombify an.`;
      offerData = { type, resource, amount, cost };
      
    } else if (type === "request_citizens") {
      const count = Math.floor(Math.random() * 2) + 1;
      const payment = count * (Math.floor(Math.random() * 100) + 150);
      
      content = `${settlement.name} benötigt ${count} Siedler. Bezahlung: ${payment} Zombify.`;
      offerData = { type, count, payment };
      
    } else if (type === "trade_resources") {
      // NEU: Ressourcen-Tausch
      const wantResource = settlement.resources[Math.floor(Math.random() * settlement.resources.length)];
      const offerResource = settlement.resources[Math.floor(Math.random() * settlement.resources.length)];
      const wantAmount = Math.floor(Math.random() * 15) + 5;
      const offerAmount = Math.floor(Math.random() * 15) + 5;
      
      content = `${settlement.name} bietet ${offerAmount} ${offerResource} im Tausch gegen ${wantAmount} ${wantResource}.`;
      offerData = { type, wantResource, wantAmount, offerResource, offerAmount };
    }
    
   const msg = {
    id: `msg_${window.radioState.nextMessageId++}`,
    type: "trade",
    content: content,
    settlementId: settlement.id,
    day: window.stats.tag,       // ← TAG KORREKT!
    timestamp: Date.now(),       // ← richtiger Zeitstempel
    read: false,
    tradeData: offerData
  };
    
    window.radioState.messages.unshift(msg);
    window.radioState.hasUnread = true;
    window.radioState.unreadCount++;
    updateRadioButton();
  }

  // ==========================================
  // GESCHENKE-SYSTEM
  // ==========================================
  
  function sendGift(settlementId) {
    const settlement = window.radioState.settlements.find(s => s.id === settlementId);
    if (!settlement) return;
    
    const giftOptions = [
      { resource: "essen", amount: 10, rep: 5 },
      { resource: "medis", amount: 5, rep: 8 },
      { resource: "waffen", amount: 3, rep: 10 }
    ];
    
    const gift = giftOptions[Math.floor(Math.random() * giftOptions.length)];
    
    if ((window.resources[gift.resource] || 0) < gift.amount) {
      addMessage("internal", `❌ Nicht genug ${gift.resource} für ein Geschenk!`);
      return;
    }
    
    window.resources[gift.resource] -= gift.amount;
    changeReputation(settlementId, gift.rep);
    
    addMessage("internal", `🎁 Geschenk an ${settlement.name} gesendet: ${gift.amount} ${gift.resource}. (+${gift.rep} Ruf)`, settlementId);
    
    if (window.statRender) window.statRender();
  }

  function receiveGift(settlement) {
    const gifts = [
      { resource: "essen", amount: 15 },
      { resource: "medis", amount: 8 },
      { resource: "holz", amount: 20 }
    ];
    
    const gift = gifts[Math.floor(Math.random() * gifts.length)];
    window.resources[gift.resource] = (window.resources[gift.resource] || 0) + gift.amount;
    
    addMessage("gift", `🎁 ${settlement.name} hat uns ${gift.amount} ${gift.resource} geschenkt!`, settlement.id);
    
    if (window.statRender) window.statRender();
  }

  // ==========================================
  // SCAN-FUNKTION
  // ==========================================
function scanForSettlements() {
    
    const state = window.radioState;
    const currentDay = window.stats.tag;

    // 1. Cooldown prüfen und setzen
    const daysSinceLastScan = currentDay - state.lastScanDay;
    if (daysSinceLastScan < state.scanCooldown) {
      addMessage("internal", `⏳ Scan-Cooldown aktiv. Nächster Scan in ${state.scanCooldown - daysSinceLastScan} Tagen.`);
      return;
    }
    
    // 2. Maximale Siedlungen prüfen (Logik aus Originalcode beibehalten)
    if (state.settlements.length >= state.maxSettlements) {
      addMessage("internal", `📡 Maximale Anzahl an Siedlungen erreicht. Schalte Skills frei!`);
      return;
    }
    
    // Setze den neuen Cooldown, BEVOR wir den Scan versuchen
    // Setzt lastScanDay auf den aktuellen Tag und erzwingt Cooldown für die nächsten Tage.
    state.lastScanDay = currentDay; 
    
    // 3. 50% Erfolgschance prüfen
    const successChance = 0.80;
    const success = Math.random() < successChance;

    if (!success) {
      // Nachricht: Scan fehlgeschlagen
      addMessage("internal", "Der Scanner konnte keine Siedlung lokalisieren.");
      
      // Rendern Sie den Scan-Tab neu, um den Cooldown anzuzeigen
      renderScanTab(); 
      return;
    }

    // 4. Erfolgreicher Scan
    const newSettlement = generateSettlement();
    if (newSettlement) {
      state.settlements.push(newSettlement);
      addMessage("internal", `📡 Neue Siedlung entdeckt: ${newSettlement.name} (${newSettlement.typeName})`);
      renderSettlementList();
    }
    
    // Rendern Sie den Scan-Tab neu, um den neuen Cooldown/Status anzuzeigen
    renderScanTab();
}

  // ==========================================
  // UI-RENDERING
  // ==========================================
  
  function renderRadioPanel() {
    const panel = document.getElementById("radioPanel");
    if (!panel) return;
    
    panel.innerHTML = `
      <div class="radio-header">
        <h3>📻 Funkgerät</h3>
        <button id="closeRadioBtn" class="radio-close">✕</button>
      </div>
      
      <div class="radio-tabs">
        <button class="radio-tab active" data-tab="messages">Nachrichten (${window.radioState.unreadCount})</button>
        <button class="radio-tab" data-tab="settlements">Siedlungen (${window.radioState.settlements.length}/${window.radioState.maxSettlements})</button>
        <button class="radio-tab" data-tab="scan">Scannen</button>
      </div>
      
      <div class="radio-content">
        <div id="radio-messages" class="radio-tab-content active"></div>
        <div id="radio-settlements" class="radio-tab-content"></div>
        <div id="radio-scan" class="radio-tab-content"></div>
      </div>
    `;
    
    renderMessages();
    renderSettlementList();
    renderScanTab();
    attachRadioListeners();
  }

  function renderMessages() {
    const container = document.getElementById("radio-messages");
    if (!container) return;
    
    if (window.radioState.messages.length === 0) {
      container.innerHTML = '<p class="radio-empty">Keine Nachrichten vorhanden.</p>';
      return;
    }
    
    container.innerHTML = window.radioState.messages.map(msg => {
      const settlement = msg.settlementId ? window.radioState.settlements.find(s => s.id === msg.settlementId) : null;
      const icon = {
        internal: "🔔",
        trade: "💼",
        request: "📦",
        threat: "⚠️",
        gift: "🎁",
        lone_operator: "📡"
      }[msg.type] || "📻";
      
      return `
        <div class="radio-message ${msg.read ? 'read' : 'unread'}" data-msg-id="${msg.id}">
          <div class="message-header">
            <span class="message-icon">${icon}</span>
            <span class="message-day">Tag ${msg.day || 'N/A'}</span>
            ${settlement ? `<span class="settlement-badge status-${settlement.status}">${settlement.name}</span>` : ''}
          </div>
          <div class="message-content">${msg.content}</div>
          ${msg.type === 'trade' ? renderTradeActions(msg) : ''}
          ${msg.type === 'request' ? renderRequestActions(msg) : ''}
          ${msg.type === 'threat' && msg.eventData ? renderThreatActions(msg) : ''}
        </div>
      `;
    }).join('');
    
    // Nachrichten als gelesen markieren
    window.radioState.messages.forEach(m => m.read = true);
    window.radioState.hasUnread = false;
    window.radioState.unreadCount = 0;
    updateRadioButton();
  }

  function renderTradeActions(msg) {
    return `
      <div class="trade-actions">
        <button class="radio-btn accept" onclick="acceptTrade('${msg.id}')">✓ Akzeptieren</button>
        <button class="radio-btn decline" onclick="declineTrade('${msg.id}')">✕ Ablehnen</button>
      </div>
    `;
  }

  function renderRequestActions(msg) {
    return `
      <div class="trade-actions">
        <button class="radio-btn accept" onclick="acceptRequest('${msg.id}')">✓ Aufnehmen</button>
        <button class="radio-btn decline" onclick="declineRequest('${msg.id}')">✕ Abweisen</button>
      </div>
    `;
  }

  function renderThreatActions(msg) {
    return `
      <div class="trade-actions">
        <button class="radio-btn accept" onclick="respondToThreat('${msg.id}', true)">⚔️ Verteidigen</button>
        <button class="radio-btn decline" onclick="respondToThreat('${msg.id}', false)">🏃 Verstecken</button>
      </div>
    `;
  }

  function renderSettlementList() {
    const container = document.getElementById("radio-settlements");
    if (!container) return;
    
    if (window.radioState.settlements.length === 0) {
      container.innerHTML = '<p class="radio-empty">Noch keine Siedlungen entdeckt. Nutze die Scan-Funktion!</p>';
      return;
    }
    
    container.innerHTML = window.radioState.settlements.map(s => {
     const statusText = {
       allied: "🤝 Verbündet",
       friendly: "😊 Freundlich",
       neutral: "😐 Neutral",
       hostile: "😠 Feindselig",
       enemy: "💀 Feindlich"
     }[s.status];

     // NEU: Fügt die Klasse 'allied' hinzu, wenn der Status stimmt.
     const alliedClass = s.status === 'allied' ? 'allied' : ''; // <<< HIER IST DIE NEUE VARIABLE
      
     return `
        <div class="settlement-item status-${s.status} ${alliedClass}">
          <div class="settlement-header">
            <strong>${s.name}</strong>
            <span class="settlement-status">${statusText}</span>
          </div>
          <div class="settlement-info">
            <p>Typ: ${s.typeName}</p>
            <p>Ruf: ${s.reputation}/100</p>
            <div class="reputation-bar">
              <div class="reputation-fill" style="width: ${(s.reputation + 100) / 2}%; background-color: ${s.reputation > 0 ? '#33ff33' : '#ff3333'}"></div>
            </div>
          </div>
          <div class="settlement-actions">
            <button class="radio-btn" onclick="sendGiftToSettlement('${s.id}')">🎁 Geschenk senden</button>
			<button class="radio-btn decline" onclick="raidSettlement('${s.id}')">Siedlung ausrauben</button>
           </div>
        </div>
      `;
    }).join('');
  }

  function renderScanTab() {
    const container = document.getElementById("radio-scan");
    if (!container) return;
    
    const daysSinceLastScan = window.stats.tag - window.radioState.lastScanDay;
    const canScan = daysSinceLastScan >= window.radioState.scanCooldown;
    const atMax = window.radioState.settlements.length >= window.radioState.maxSettlements;
    
    container.innerHTML = `
      <div class="scan-panel">
        <h4>Frequenz-Scanner</h4>
        <p>Suche nach neuen Siedlungen in der Umgebung.</p>
        <p><strong>Entdeckt:</strong> ${window.radioState.settlements.length} / ${window.radioState.maxSettlements}</p>
        ${!canScan ? `<p class="scan-cooldown">⏳ Cooldown: ${window.radioState.scanCooldown - daysSinceLastScan} Tage</p>` : ''}
        ${atMax ? `<p class="scan-max">📡 Maximum erreicht. Schalte Radio-Skills frei!</p>` : ''}
        <button class="radio-btn scan-btn" onclick="performScan()" ${!canScan || atMax ? 'disabled' : ''}>
          📡 Scan starten
        </button>
      </div>
    `;
  }

  function attachRadioListeners() {
    // Tab-Wechsel
    document.querySelectorAll('.radio-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.getAttribute('data-tab');
        
        document.querySelectorAll('.radio-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.radio-tab-content').forEach(c => c.classList.remove('active'));
        
        e.target.classList.add('active');
        document.getElementById(`radio-${tabName}`).classList.add('active');
      });
    });
    
    // Schließen-Button
    document.getElementById('closeRadioBtn').addEventListener('click', closeRadio);
  }
// ==========================================
// ZUSÄTZLICHE FUNKTION: RADIO BUTTON UI UPDATE
// ==========================================
function updateRadioButton() {
  const radioBtn = document.getElementById('radioBtn');
  if (radioBtn) {
    // Fügt die Klasse 'has-unread' hinzu oder entfernt sie basierend auf dem Status
    if (window.radioState.hasUnread) {
      radioBtn.classList.add('has-unread');
    } else {
      radioBtn.classList.remove('has-unread');
    }
  }
}
window.updateRadioButton = updateRadioButton; // Global zugänglich machen

// OPTIONAL: Beim Öffnen des Panels sollte der Status auf "gelesen" gesetzt werden, 
// um das Blinken zu stoppen.
// Wenn Sie die Funktion markAllMessagesAsRead noch nicht haben, fügen Sie diese hinzu
function markAllMessagesAsRead() {
    window.radioState.messages.forEach(msg => msg.read = true);
    window.radioState.hasUnread = false;
    window.radioState.unreadCount = 0;
    if (window.renderRadioMessages) window.renderRadioMessages();
    updateRadioButton(); // Button-Status aktualisieren!
}
window.markAllMessagesAsRead = markAllMessagesAsRead;

  function openRadio() {
    const panel = document.getElementById('radioPanel');
    if (!panel || window.radioState.isOpen) return;
    
    renderRadioPanel();
    panel.style.display = 'block';
    setTimeout(() => panel.classList.add('active'), 10);
    window.radioState.isOpen = true;
  }

  function closeRadio() {
    const panel = document.getElementById('radioPanel');
    if (!panel) return;
    
    panel.classList.remove('active');
    setTimeout(() => {
      panel.style.display = 'none';
      window.radioState.isOpen = false;
    }, 300);
  }

  // ==========================================
  // GLOBALE FUNKTIONEN (für onclick)
  // ==========================================
  
  window.performScan = scanForSettlements;
  window.sendGiftToSettlement = sendGift;
  window.raidSettlement = function (settlementId) {
  const s = window.radioState.settlements.find(ss => ss.id === settlementId);
  if (!s) return;

  // verhindern dass man Verbündete einfach so überfällt
  if (s.status === "allied") {
    addMessage("internal", `❌ ${s.name} ist ein Verbündeter – ein Angriff wäre Verrat.`);
    return;
  }

  // 4–7 zufällige Ressourcen generieren
  const lootResources = ["holz", "stein", "essen", "wasser", "medis", "waffen", "wolle", "garn", "stoff", "kleidung"];
  const lootCount = Math.floor(Math.random() * 4) + 4;

  let lootMsg = "Beute:\n";

  for (let i = 0; i < lootCount; i++) {
    const res = lootResources[Math.floor(Math.random() * lootResources.length)];
    const amount = Math.floor(Math.random() * 15) + 5;

    window.resources[res] = (window.resources[res] || 0) + amount;
    lootMsg += `+ ${amount} ${res}\n`;
  }

  // Ruf hart auf –100 setzen
  s.reputation = -100;
  s.status = "enemy";

  addMessage("internal", `💥 Wir haben ${s.name} ausgeraubt!\n${lootMsg}`, s.id);

  if (window.statRender) window.statRender();
  renderSettlementList();
};

  window.acceptRequest = function(msgId) {
    const msg = window.radioState.messages.find(m => m.id === msgId);
    if (!msg || !msg.eventData) return;
    
    // Callback ausführen (Flüchtlinge aufnehmen)
    if (msg.eventData.callback) {
      msg.eventData.callback(true);
    }
    
    // Nachricht entfernen
    const index = window.radioState.messages.indexOf(msg);
    if (index > -1) window.radioState.messages.splice(index, 1);
    
    renderMessages();
  };
  
  window.declineRequest = function(msgId) {
    const msg = window.radioState.messages.find(m => m.id === msgId);
    if (!msg || !msg.eventData) return;
    
    // Callback ausführen (Flüchtlinge abweisen)
    if (msg.eventData.callback) {
      msg.eventData.callback(false);
    }
    
    // Nachricht entfernen
    const index = window.radioState.messages.indexOf(msg);
    if (index > -1) window.radioState.messages.splice(index, 1);
    
    renderMessages();
  };
  
  window.respondToThreat = function(msgId, defend) {
    const msg = window.radioState.messages.find(m => m.id === msgId);
    if (!msg || !msg.eventData) return;
    
    // Callback ausführen (Verteidigen oder Verstecken)
    if (msg.eventData.callback) {
      msg.eventData.callback(defend);
    }
    
    // Nachricht entfernen
    const index = window.radioState.messages.indexOf(msg);
    if (index > -1) window.radioState.messages.splice(index, 1);
    
    renderMessages();
  };
  
  window.acceptTrade = function(msgId) {
    const msg = window.radioState.messages.find(m => m.id === msgId);
    if (!msg || !msg.tradeData) return;
    
    const settlement = window.radioState.settlements.find(s => s.id === msg.settlementId);
    if (!settlement) return;
    
    const trade = msg.tradeData;
    let success = false;
    
    // RESSOURCEN-ANFRAGE (Settlement will Ressource kaufen)
    if (trade.type === "request_resources") {
      if ((window.resources[trade.resource] || 0) >= trade.amount) {
        window.resources[trade.resource] -= trade.amount;
        window.money = (window.money || 0) + trade.payment;
        success = true;
        addMessage("internal", `✓ ${trade.amount} ${trade.resource} an ${settlement.name} verkauft. +${trade.payment} Zombify`, settlement.id);
      } else {
        addMessage("internal", `❌ Nicht genug ${trade.resource} verfügbar!`);
        return;
      }
    }
    
    // RESSOURCEN-ANGEBOT (Settlement verkauft Ressource)
    else if (trade.type === "offer_resources") {
      if ((window.money || 0) >= trade.cost) {
        window.money -= trade.cost;
        window.resources[trade.resource] = (window.resources[trade.resource] || 0) + trade.amount;
        success = true;
        addMessage("internal", `✓ ${trade.amount} ${trade.resource} von ${settlement.name} gekauft. -${trade.cost} Zombify`, settlement.id);
      } else {
        addMessage("internal", `❌ Nicht genug Zombify! (Benötigt: ${trade.cost})`);
        return;
      }
    }
    
    // SIEDLER-ANFRAGE
    else if (trade.type === "request_citizens") {
      const available = window.citizens.filter(c => !c.tot && c.workBuildingId !== 'exploration' && c.workBuildingId !== 'raid').length;
      if (available >= trade.count) {
        // Entferne Siedler
        for (let i = 0; i < trade.count; i++) {
          const citizen = window.citizens.find(c => !c.tot && !c.workBuildingId && !c.houseId);
          if (citizen) {
            const index = window.citizens.indexOf(citizen);
            window.citizens.splice(index, 1);
          }
        }
        window.money = (window.money || 0) + trade.payment;
        success = true;
        addMessage("internal", `✓ ${trade.count} Siedler zu ${settlement.name} geschickt. +${trade.payment} Zombify`, settlement.id);
      } else {
        addMessage("internal", `❌ Nicht genug verfügbare Siedler! (Verfügbar: ${available})`);
        return;
      }
    }
    
    // RESSOURCEN-TAUSCH
    else if (trade.type === "trade_resources") {
      if ((window.resources[trade.wantResource] || 0) >= trade.wantAmount) {
        window.resources[trade.wantResource] -= trade.wantAmount;
        window.resources[trade.offerResource] = (window.resources[trade.offerResource] || 0) + trade.offerAmount;
        success = true;
        addMessage("internal", `✓ Tausch mit ${settlement.name}: ${trade.wantAmount} ${trade.wantResource} gegen ${trade.offerAmount} ${trade.offerResource}`, settlement.id);
      } else {
        addMessage("internal", `❌ Nicht genug ${trade.wantResource} verfügbar!`);
        return;
      }
    }
    
    if (success) {
      changeReputation(settlement.id, 10);
      // Nachricht entfernen
      const index = window.radioState.messages.indexOf(msg);
      if (index > -1) window.radioState.messages.splice(index, 1);
      
      if (window.statRender) window.statRender();
      if (window.settlementRender) window.settlementRender();
      renderMessages();
    }
  };
  
  window.declineTrade = function(msgId) {
    const msg = window.radioState.messages.find(m => m.id === msgId);
    if (!msg) return;
    
    const settlement = window.radioState.settlements.find(s => s.id === msg.settlementId);
    if (!settlement) return;
    
    changeReputation(settlement.id, -5);
    
    // Nachricht entfernen
    const index = window.radioState.messages.indexOf(msg);
    if (index > -1) window.radioState.messages.splice(index, 1);
    
    addMessage("internal", `✕ Handel mit ${settlement.name} abgelehnt. (-5 Ruf)`, settlement.id);
    renderMessages();
  };

  // ==========================================
  // GAME-LOOP INTEGRATION
  // ==========================================
  
  window.radioGameLoop = function() {
    if (!window.radioState || window.radioState.settlements.length === 0) return;
    
    // Zufällige Handelsangebote (nur nicht-feindliche)
    if (Math.random() < 0.15) {
      const friendlySettlements = window.radioState.settlements.filter(s => s.status !== "enemy");
      if (friendlySettlements.length > 0) {
        const settlement = friendlySettlements[Math.floor(Math.random() * friendlySettlements.length)];
        generateTradeOffer(settlement);
      }
    }
    
    // Geschenke von Verbündeten
    window.radioState.settlements.forEach(s => {
      if (s.status === "allied" && Math.random() < 0.05) {
        receiveGift(s);
      }
    });
    
// Feindliche Siedlungen greifen an
window.radioState.settlements.forEach(s => {
  if (s.status === "enemy" && Math.random() < 0.08) {
    const attackStrength = Math.floor(Math.random() * 80) + 60;
    const totalDefense = calculateDefenseValue();
    
    // Kampfberechnung
    let result = {
      attackerName: s.name,
      strength: attackStrength,
      defense: totalDefense,
      stolenResources: {},
      casualties: []
    };
    
    if (attackStrength > totalDefense) {
      // NIEDERLAGE - Verluste erleiden
      const stolenWood = Math.min(resources.holz, Math.floor(Math.random() * 20) + 10);
      const stolenFood = Math.min(resources.essen, Math.floor(Math.random() * 15) + 8);
      const stolenStone = Math.min(resources.stein, Math.floor(Math.random() * 10) + 5);
      
      resources.holz -= stolenWood;
      resources.essen -= stolenFood;
      resources.stein -= stolenStone;
      
      result.stolenResources = {
        holz: stolenWood,
        essen: stolenFood,
        stein: stolenStone
      };
      
      // Tote Verteidiger
      const defenseUnits = citizens.filter(c => 
        !c.tot && 
        (c.job === 'Wache' || c.job === 'Soldat') &&
        c.workBuildingId !== 'exploration' && 
        c.workBuildingId !== 'raid'
      );
      
      let fatalities = Math.floor((attackStrength - totalDefense) / 8) + 1;
      
      for (let i = 0; i < fatalities && defenseUnits.length > 0; i++) {
        const victim = defenseUnits.splice(Math.floor(Math.random() * defenseUnits.length), 1)[0];
        if (victim) {
          victim.tot = true;
          stats.gestorben++;
          result.casualties.push(victim.name);
          assignCitizenToHouse(victim.id, null);
          assignCitizenToWork(victim.id, null);
        }
      }
      
      const stolenMsg = Object.entries(result.stolenResources)
        .map(([res, amt]) => `${amt} ${res}`)
        .join(', ');
      
      const casualtyMsg = result.casualties.length > 0 
        ? ` Tote: ${result.casualties.join(', ')}.`
        : '';
      
      const attackMsg = `💀 ${s.name} hat uns angegriffen! [NIEDERLAGE]<br>` +
        `Stärke: ${attackStrength} vs Verteidigung: ${totalDefense}<br>` +
        `Gestohlene Ressourcen: ${stolenMsg}${casualtyMsg}`;
      
      addMessage("threat", attackMsg, s.id);
      logEvent(`[ANGRIFF] ${s.name}: ${result.casualties.length} Tote, ${stolenMsg} gestohlen`);
      
    } else {
      // SIEG
      const attackMsg = `⚔️ ${s.name} hat uns angegriffen! [ABGEWEHRT]<br>` +
        `Stärke: ${attackStrength} vs Verteidigung: ${totalDefense}<br>` +
        `Die Verteidigung hielt stand!`;
      
      addMessage("threat", attackMsg, s.id);
      logEvent(`[ABGEWEHRT] ${s.name} wurde zurückgeschlagen!`);
    }
    
    citizens = citizens.filter(c => !c.tot);
    window.citizens = citizens;
    
    if (window.statRender) window.statRender();
    if (window.settlementRender) window.settlementRender();
  }
});
    
    // Einsamer Funker (wenn freigeschaltet)
    const loneOperatorSettlement = window.radioState.settlements.find(s => s.type === "lone_operator");
    if (loneOperatorSettlement && Math.random() < 0.08) {
      const messages = [
        "Hier spricht Station Omega-7. Die Nacht ist still, aber wir bleiben wachsam.",
        "Ich empfange eure Signale. Gut zu wissen, dass noch andere da draußen sind.",
        "Die alten Kommunikationsnetze funktionieren noch. Ein Hoffnungsschimmer.",
        "Über mir kreisen die Sterne. Manchmal vergesse ich, wie schön die Welt war.",
        "Meine Vorräte halten noch. Vielleicht sehen wir uns eines Tages.",
        "Die Funkwellen tragen unsere Stimmen weit. Wir sind nicht allein.",
        "Station Omega-7 meldet sich. Alle Systeme funktional. Haltet durch, Freunde."
      ];
      addMessage("lone_operator", `📡 Einsamer Funker: "${messages[Math.floor(Math.random() * messages.length)]}"`, loneOperatorSettlement.id);
    }
  };
  
  // ==========================================
  // EVENT-HANDLER FÜR GAME.JS EVENTS
  // ==========================================
  
  window.radioInterceptEvent = function(type, data) {
    
    // 1. Initialisierung und Standardwerte
    let messageContent = data.message || "Unbekanntes Ereignis"; 
    let msgType = type; // Standardmäßig ist der Nachrichtentyp der Event-Typ
    let icon = "📻";
    let logMessage = `📻 Ereignis (${type}) empfangen.`;
    
    // 2. Spezialisierte Handler und Content-Erstellung
    
    if (type === 'attack') {
        // WICHTIG: Setze den ursprünglichen Typ für die Buttons
        msgType = "threat"; 
        icon = "⚠️";
        // Detaillierter Content aus der Originalfunktion beibehalten
        messageContent = `⚠️ ALARM: Unsere Siedlung wird angegriffen!<br>Angriffsstärke: <b>${data.strength}</b> | Verteidigung: <b>${data.defense}</b>`;
        logMessage = `📻 ALARM: Wir werden angegriffen!`;
        
    } else if (type === 'refugees') {
        // WICHTIG: Setze den ursprünglichen Typ für die Buttons
        msgType = "request"; 
        icon = "👥";
        // Detaillierter Content aus der Originalfunktion beibehalten
        messageContent = `👥 ${data.count} Zivilisten bitten um Aufnahme in unsere Siedlung.`;
        logMessage = `📻 ${data.count} Zivilisten bitten um Einlass!`;
        
    } 
	else if (type === 'settlement_attack') {
        msgType = "threat"; // Wie der allgemeine Angriff, da es eine Bedrohung ist
        icon = "💀"; 
        
        // Die Nachricht wird direkt von game.js übermittelt, um den Siedlungsnamen zu enthalten
        // Bsp.: "ANGRIFF von [Siedlungsname]! Stärke: 150 vs. Verteidig.: 120."
        messageContent = `${icon} ${data.message}`; 
        logMessage = `📻 WICHTIG: Feindlicher Angriff von Siedlung gemeldet.`;
    }
    // NEU: Handler für interne Events (behalten den Event-Namen als msgType)
    else if (type === 'fire') {
        icon = "🔥";
        messageContent = `${icon} ${messageContent}`;
        logMessage = `📻 FEUER: ${messageContent}`;
        
    } else if (type === 'theft') {
        icon = "🦹";
        messageContent = `${icon} ${messageContent}`;
        logMessage = `📻 DIEBSTAHL: ${messageContent}`;
        
    } else if (type === 'zombie') {
        icon = "🧟";
        messageContent = `${icon} ${messageContent}`;
        logMessage = `📻 INFEKTION: ${messageContent}`;
    } else {
         // Füge Icon zum Content hinzu, wenn es ein Standard/Unbekannt-Event ist
         messageContent = `${icon} ${messageContent}`;
    }

    // 3. Allgemeine Nachrichtenerstellung
    const msg = {
        id: `msg_${window.radioState.nextMessageId++}`,
        type: msgType, // <-- HIER: Verwendet den korrigierten/speziellen Typ
        content: messageContent,
        settlementId: null,
        day: window.stats.tag,
        timestamp: Date.now(),
        read: false,
        eventData: data // Speichert Callback für Buttons
    };
    
    // 4. Speichern und Benachrichtigung
    window.radioState.messages.unshift(msg);
    
    window.radioState.hasUnread = true;
    window.radioState.unreadCount++;
    
    // UI-Aktualisierungen
    if (window.updateRadioButton) updateRadioButton(); 
    
    if (window.logEvent && logMessage) {
        window.logEvent(logMessage);
    }
    
    // UI sofort rendern wenn Radio offen ist (aus der zweiten Funktion)
    if (window.radioState.isOpen && window.renderMessages) {
        window.renderMessages();
    }
};
  
  // ==========================================
  // LONE OPERATOR FREISCHALTUNG
  // ==========================================
  
  window.unlockLoneOperator = function() {
    // Prüfe ob schon existiert
    if (window.radioState.settlements.find(s => s.type === "lone_operator")) {
      return;
    }
    
    const loneOperator = {
      id: `settlement_${window.radioState.nextSettlementId++}`,
      name: "Station Omega-7",
      type: "lone_operator",
      typeName: "Einsamer Funker",
      resources: [],
      reputation: 50, // Startet freundlich
      status: "friendly",
      lastContact: window.stats.tag,
      tradeOffers: [],
      gifts: []
    };
    
    window.radioState.settlements.push(loneOperator);
    addMessage("lone_operator", `📡 Neue Frequenz entdeckt! Station Omega-7 antwortet auf unsere Rufe.`, loneOperator.id);
    
    if (window.logEvent) {
      window.logEvent("📡 Der Einsame Funker wurde freigeschaltet!");
    }
    
    renderSettlementList();
  };
function openRadio() {
    // 1. Panel abrufen!
    const panel = document.getElementById('radioPanel');
    if (!panel || window.radioState.isOpen) return; // Zusätzliche Prüfung
    
    // Ruft renderRadioPanel() auf, das den Inhalt rendert und Listener hinzufügt
    renderRadioPanel(); 
    
    // 2. Zustand umschalten
    panel.style.display = 'block';
    setTimeout(() => panel.classList.add('active'), 10);
    window.radioState.isOpen = true;
}

function closeRadio() {
    // 1. Panel abrufen!
    const panel = document.getElementById('radioPanel');
    if (!panel) return;
    
    // 2. Zustand umschalten
    panel.classList.remove('active');
    setTimeout(() => {
        panel.style.display = 'none';
        window.radioState.isOpen = false;
    }, 300);
}
  // ==========================================
  // INITIALISIERUNG
  // ==========================================
  
  const radioBtn = document.createElement('button');
  radioBtn.id = 'radioBtn';
  radioBtn.className = 'control-icon-btn radio-btn';
  radioBtn.innerHTML = '<i class="fas fa-broadcast-tower"></i>';
  radioBtn.title = 'Funkgerät';
  // *** KORRIGIERTE NEUE LOGIK ***
radioBtn.addEventListener("click", () => {
    if (window.radioState.isOpen) {
        // Wenn offen, schließen (ruft closeRadio() auf)
        closeRadio();
    } else {
        // Wenn geschlossen, öffnen (ruft openRadio() auf, das auch rendert)
        openRadio();
    }
});
  
  const gameControls = document.getElementById('game-controls');
  if (gameControls) {
    gameControls.appendChild(radioBtn);
  }
  
  // Panel erstellen
  const radioPanel = document.createElement('div');
  radioPanel.id = 'radioPanel';
  radioPanel.className = 'radio-panel';
  document.getElementById('monitor').appendChild(radioPanel);
  
  console.log("📻 Funkgerät-System geladen!");
});
// ==========================================
  // EVENT-HANDLER FÜR GAME.JS EVENTS
  // ==========================================
  window.radioInterceptEvent = function(type, data) {
    
    // 1. ZENTRAL: Extrahiere die Nachricht und setze Standardwerte
    let messageContent = data.message || "Unbekanntes Ereignis"; 
    let icon = "📻";
    let logMessage = `📻 Ereignis (${type}) empfangen.`;
    
    // 2. Icon und Log-Nachricht basierend auf dem Typ setzen
    if (type === 'attack') {
      icon = "⚠️";
      messageContent = data.message || `ALARM: Unsere Siedlung wird angegriffen!`;
      logMessage = `📻 ALARM: Wir werden angegriffen!`;
    } else if (type === 'refugees') {
      icon = "👥";
      messageContent = data.message || `${data.count} Zivilisten bitten um Aufnahme in unsere Siedlung.`;
      logMessage = `📻 ${data.count} Zivilisten bitten um Einlass!`;
    } 
    
    // === BEHANDLUNG INTERNER EREIGNISSE ===
    else if (type === 'internal') {
        if (data.type === 'fire') {
            icon = "🔥";
            logMessage = `📻 WICHTIG: Internes Ereignis (Feuer) gemeldet.`;
        } else if (data.type === 'theft') {
            icon = "🦹";
            logMessage = `📻 WICHTIG: Internes Ereignis (Diebstahl) gemeldet.`;
        } else if (data.type === 'zombie') {
            icon = "🧟";
            logMessage = `📻 WICHTIG: Internes Ereignis (Infektion) gemeldet.`;
        }
        // messageContent bleibt der Wert aus data.message von game.js
    }
    // 3. Nachrichtenobjekt erstellen und hinzufügen
    const msg = {
        id: `msg_${window.radioState.nextMessageId++}`,
        type: type, // attack, refugees, internal
        content: `${icon} ${messageContent}`, // Führt Icon und Text zusammen
        settlementId: null, // Interne Events haben keine Siedlungs-ID
        day: window.stats.tag,
        timestamp: Date.now(),
        read: false,
        eventData: data
    };
    
    window.radioState.messages.unshift(msg);
    
    // 4. UI aktualisieren
    window.radioState.hasUnread = true;
    window.radioState.unreadCount++;
    if (window.updateRadioButton) updateRadioButton();
    
    if (window.logEvent && logMessage) {
      window.logEvent(logMessage);
    }
    
    // Optional: Wenn das Radio geöffnet ist, Nachrichten sofort rendern
    if (window.radioState.isOpen && window.renderMessages) {
        window.renderMessages();
    }
  };