// === market.js - KOMPLETT KORRIGIERTE VERSION ===
// Neues Marktsystem mit dynamischen Händlern, Preisen & Slide-Animation

document.addEventListener("DOMContentLoaded", () => {
  const marketBtn = document.getElementById("marketBtn");
  const marketPanel = document.getElementById("marketPanel");

  // --- Globale Marktvariablen ---
  let traders = [];
  let lastMarketUpdateDay = 0;
  let isMarketOpen = false; // NEU: Status-Tracking

  const traderNames = ["Bjorn", "Freya", "Rolf", "Inga", "Torsten", "Edda", "Kjell", "Sigrun", "Magnus", "Thora"];
  const resourcesList = ["holz", "stein", "essen", "wasser", "medis", "waffen", "wolle", "garn", "stoff", "kleidung"];
  const basePrices = { holz:5, stein:8, essen:12, wasser:7, medis:20, waffen:30, wolle: 15, garn: 25, stoff: 40, kleidung: 60   };
 const resourceDisplayNames = {
      holz: "Holz",
      stein: "Stein",
      essen: "Essen",
      wasser: "Wasser",
      medis: "Medis",
      waffen: "Waffen",
      wolle: "Wolle",
      garn: "Garn",
      stoff: "Stoff",
      kleidung: "Kleidung"
  };
  const safeLog = (msg) => { if(typeof logEvent==="function") logEvent(msg); else console.log(msg); };
  const safeStatRender = () => { if(typeof statRender==="function") statRender(); };

  // --- MARKT INITIALISIERUNG ---
  function generateMarketTraders() {
    traders = [];
    for(let i=0;i<3;i++){
      const name = traderNames[Math.floor(Math.random()*traderNames.length)];
      const numItems = Math.floor(Math.random()*2)+2;
      const items=[];
      const shuffled=[...resourcesList].sort(()=>0.5-Math.random());
      for(let j=0;j<numItems;j++){
        const res=shuffled[j];
        const base=basePrices[res];
        const price=Math.max(1, Math.round(base*(0.8+Math.random()*0.4)));
        const amount=Math.floor(5+Math.random()*20);
        const mode=Math.random()<0.5?"sell":"buy";
        items.push({res,price,amount,mode});
      }
      traders.push({name,items});
    }
    safeLog("🧺 Markt erneuert!");
  }

  // --- RENDER ---
  function renderMarketPanel() {
    if(!marketPanel){ console.warn("marketPanel nicht gefunden"); return; }
    
    // Panel komplett leeren und neu aufbauen
    marketPanel.innerHTML="";
    
    // Styling für das Panel
    marketPanel.style.maxHeight = "70vh"; // Maximal 70% der Viewport-Höhe
    marketPanel.style.overflowY = "auto"; // Scrollbar wenn Inhalt zu groß
    marketPanel.style.padding = "15px";
    marketPanel.style.boxSizing = "border-box";
    
    const title = document.createElement("h3");
    title.textContent = "🧾 Marktplatz";
    title.style.marginTop = "0";
    marketPanel.appendChild(title);

    traders.forEach(trader=>{
      const traderDiv=document.createElement("div");
      traderDiv.className="market-trader";
      
      const traderTitle = document.createElement("h4");
      traderTitle.textContent = `Händler ${trader.name}`;
      traderDiv.appendChild(traderTitle);

      trader.items.forEach(item=>{
        const icon={holz:"🪵",stein:"🪨",essen:"🍞",wasser:"💧",medis:"💊",waffen:"⚔️",stoff:"🧶",garn:"🧵",wolle:"양",kleidung: "👔"}[item.res];
        
        const itemDiv=document.createElement("div");
        itemDiv.className="market-item";
        itemDiv.style.display="flex";
        itemDiv.style.alignItems="center";
        itemDiv.style.justifyContent="space-between";
        itemDiv.style.marginBottom="6px";
        itemDiv.style.gap="10px";
        const displayName = resourceDisplayNames[item.res] || item.res;
        // Icon/Name
        const nameSpan = document.createElement("span");
        nameSpan.textContent = `${icon} ${item.res}`;
        nameSpan.style.minWidth = "80px";
        itemDiv.appendChild(nameSpan);
        
        // Slider
        const slider = document.createElement("input");
        slider.type = "range";
        slider.style.flex = "1";
        slider.style.cursor = "pointer";
        slider.style.minWidth = "100px";
        
        // Menge Label
        const qtyLabel = document.createElement("span");
        qtyLabel.style.minWidth = "60px";
        qtyLabel.style.textAlign = "center";
        itemDiv.appendChild(slider);
        itemDiv.appendChild(qtyLabel);
        
        // Preis Label
        const priceLabel = document.createElement("span");
        priceLabel.style.minWidth = "120px";
        priceLabel.style.textAlign = "right";
        itemDiv.appendChild(priceLabel);
        
        // Button
        const button = document.createElement("button");
        button.className = `market-button ${item.mode === 'sell' ? 'kaufen' : 'verkaufen'}`;
        button.style.minWidth = "100px";
        button.textContent = item.mode === "sell" ? "Kaufen" : "Verkaufen";
        itemDiv.appendChild(button);
        
        traderDiv.appendChild(itemDiv);
        
        // === SLIDER INITIALISIERUNG ===
        const availableResources = (window.resources && window.resources[item.res]) ? window.resources[item.res] : 0;
        const maxQuantity = (item.mode === "sell") ? item.amount : availableResources;

        if (maxQuantity < 1) {
          slider.min = "0"; 
          slider.max = "0"; 
          slider.value = "0";
          slider.disabled = true; 
          slider.style.opacity = "0.5";
        } else {
          slider.min = "1"; 
          slider.max = String(maxQuantity);
          slider.value = "1"; 
          slider.disabled = false;
          slider.style.opacity = "1";
        }

        qtyLabel.textContent = `${slider.value}/${slider.max}`;
        priceLabel.textContent = `${item.price * slider.value} Z`;

        // === UPDATE FUNKTION ===
        function updateButtonState() {
          const quantity = Number(slider.value) || 0;
          const totalPrice = quantity * item.price;

          if(item.mode === "sell") {
            if(item.amount < 1) {
              button.disabled = true;
              button.textContent = "Keine Ware";
              slider.disabled = true;
            } else if((window.money || 0) < totalPrice) {
              button.disabled = true;
              button.textContent = "Zu teuer";
              slider.disabled = false;
            } else {
              button.disabled = false;
              button.textContent = "Kaufen";
              slider.disabled = false;
            }
          } else {
            const hasResource = (window.resources && window.resources[item.res]) ? window.resources[item.res] : 0;
            if(hasResource < 1) {
              button.disabled = true;
              button.textContent = "Keine Ressource";
              slider.disabled = true;
            } else {
              button.disabled = false;
              button.textContent = "Verkaufen";
              slider.disabled = false;
            }
          }
        }

        updateButtonState();

        // === SLIDER EVENT - KOMPLETT OHNE STOPpropagation ===
        slider.oninput = function() {
          const quantity = Number(this.value) || 0;
          qtyLabel.textContent = `${quantity}/${this.max}`;
          priceLabel.textContent = `${item.price * quantity} Z`;
          updateButtonState();
        };
        
        slider.onchange = function() {
          const quantity = Number(this.value) || 0;
          qtyLabel.textContent = `${quantity}/${this.max}`;
          priceLabel.textContent = `${item.price * quantity} Z`;
          updateButtonState();
        };

        // === BUTTON EVENT ===
        button.onclick = function(e) {
          e.stopPropagation();
          e.preventDefault();
          
          const quantity = parseInt(slider.value, 10) || 0;
          const totalPrice = quantity * item.price;
          
          if(quantity < 1) { 
            safeLog("❌ Menge muss >=1 sein"); 
            return; 
          }

          if(item.mode === "sell"){
            if((window.money || 0) >= totalPrice && item.amount >= quantity){
              window.money = (window.money || 0) - totalPrice;
              window.resources[item.res] = (window.resources[item.res] || 0) + quantity;
              item.amount -= quantity;
              safeLog(`💰 Gekauft: ${quantity}x ${item.res} (${totalPrice} Zombify)`);
            } else {
              safeLog("❌ Nicht genug Zombify oder Ware!");
              return;
            }
          } else {
            const hasResource = (window.resources && window.resources[item.res]) ? window.resources[item.res] : 0;
            if(hasResource >= quantity){
              window.resources[item.res] -= quantity;
              window.money = (window.money || 0) + totalPrice;
              item.amount += quantity;
              safeLog(`📦 Verkauft: ${quantity}x ${item.res} (+${totalPrice} Zombify)`);
            } else {
              safeLog("❌ Nicht genug Ressourcen!");
              return;
            }
          }

          // Slider neu berechnen
          const newMaxQuantity = (item.mode === "sell") ? item.amount : ((window.resources && window.resources[item.res]) ? window.resources[item.res] : 0);
          
          if(newMaxQuantity < 1) {
            slider.value = "0";
            slider.min = "0";
            slider.max = "0";
            slider.disabled = true;
            slider.style.opacity = "0.5";
          } else {
            slider.max = String(newMaxQuantity);
            slider.value = String(Math.min(1, newMaxQuantity));
            slider.disabled = false;
            slider.style.opacity = "1";
          }

          qtyLabel.textContent = `${slider.value}/${slider.max}`;
          priceLabel.textContent = `${item.price * slider.value} Z`;

          updateButtonState();
          safeStatRender();
        };
      });

      marketPanel.appendChild(traderDiv);
    });
  }

  // === MARKT ÖFFNEN/SCHLIESSEN ===
  function openMarket() {
    if(isMarketOpen) return;
    
    try {
      renderMarketPanel();
    } catch(e) {
      console.error("Render-Fehler:", e);
      return;
    }
    
    marketPanel.style.display = "block";
    requestAnimationFrame(() => {
      marketPanel.classList.add("active");
      isMarketOpen = true;
    });
  }

  function closeMarket() {
    if(!isMarketOpen) return;
    
    marketPanel.classList.remove("active");
    isMarketOpen = false;
    
    setTimeout(() => {
      if(!isMarketOpen) {
        marketPanel.style.display = "none";
      }
    }, 400);
  }

  // === MARKET BUTTON EVENT ===
  if(marketBtn){
    marketBtn.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      if(isMarketOpen) {
        closeMarket();
      } else {
        openMarket();
      }
    });
  }

  // === PANEL CLICKS NICHT PROPAGIEREN (außer Slider und Inputs) ===
  if(marketPanel) {
    marketPanel.addEventListener("click", (e) => {
      // Lasse Slider und alle Input-Elemente durch
      const tagName = e.target.tagName;
      if(tagName === 'INPUT' || tagName === 'BUTTON') {
        return; // Nicht stoppen
      }
      e.stopPropagation();
    });
  }

  // === AUSSERHALB KLICKEN = SCHLIESSEN ===
  document.addEventListener("click", (e) => {
    if(isMarketOpen && !marketPanel.contains(e.target) && e.target !== marketBtn) {
      closeMarket();
    }
  });

  // === UPDATE FUNKTION ===
  window.updateMarketIfNeeded = function(){
    try{
      if(typeof stats !== "undefined" && (stats.tag - lastMarketUpdateDay >= 10)){
        generateMarketTraders();
        lastMarketUpdateDay = stats.tag;
        if(isMarketOpen) {
          renderMarketPanel();
        }
      }
    }catch(e){
      console.warn("Market Update Error:", e);
    }
  };

  // Initiale Generierung
  setTimeout(generateMarketTraders, 2000);
});