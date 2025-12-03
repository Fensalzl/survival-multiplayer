
// Sichere Render-Funktionen (mit Null-Checks)
function safeRenderBuildingList() {
    try {
        if (document.getElementById('buildingDisplay')) {
            renderBuildingList();
        }
    } catch (e) {
        console.warn("Fehler beim Rendern der Gebäudeliste:", e);
    }
}

function safeStatRender() {
    try {
        if (document.getElementById('statDay')) {
            // Rufe die vorhandene Stat-Render-Funktion auf, wenn sie existiert
            if (window.statRender) window.statRender();
        }
        
    } catch (e) {
        console.warn("Fehler beim Rendern der Stats/Ressourcen:", e);
    }
}
window.safeStatRender = safeStatRender;

function safeSettlementRender() {
    try {
        if (document.getElementById('settlement')) {
            settlementRender();
        }
    } catch (e) {
        console.warn("Fehler beim Rendern der Siedlung:", e);
    }
}

// Exportiere die sicheren Versionen
window.safeRenderBuildingList = safeRenderBuildingList;
window.safeStatRender = safeStatRender;
window.safeSettlementRender = safeSettlementRender;


/**
 * Zeigt einen bestimmten Hauptbildschirm an und versteckt alle anderen, 
 * die die Klasse 'screen' haben.
 * @param {string} screenId - Die ID des anzuzeigenden Bildschirms (z.B. 'game-screen', 'intro-screen').
 */
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.style.display = 'none';
        screen.classList.remove('active');
    });

    const activeScreen = document.getElementById(screenId);
    if (activeScreen) {
        activeScreen.style.display = 'flex'; 
        activeScreen.classList.add('active');
    }
}
window.showScreen = showScreen;

let buildingListState = {
    categoryOpen: {},
    detailsOpen: {}
};

function logEvent(message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const today = new Date();
    const timeString = `[${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}:${today.getSeconds().toString().padStart(2, '0')}]`;
    
    const newMessage = document.createElement('div');
    newMessage.innerHTML = `${timeString} ${message}`;
    
    chatMessages.insertBefore(newMessage, chatMessages.firstChild);
}

window.logEvent = logEvent;

const RANK_DATA = [
    { days: 0, title: "Aspirant" },
    { days: 50, title: "Inspektor" },
    { days: 150, title: "Suboffizier" },
    { days: 350, title: "Vorsteher" },
    { days: 700, title: "Kommissar" },
    { days: 1200, title: "Major" },
    { days: 3000, title: "Obermechanarch" },
    { days: 5000, title: "Kommandant" },
    { days: 7000, title: "Regent" },
    { days: 15000, title: "Archon" }
];

window.updatePlayerRank = function(daysInService) {
    const rankDisplay = document.getElementById('playerRankDisplay');
    if (!rankDisplay) return;

    let currentRank = RANK_DATA[0].title; 
    
    for (let i = RANK_DATA.length - 1; i >= 0; i--) {
        if (daysInService >= RANK_DATA[i].days) {
            currentRank = RANK_DATA[i].title;
            break;
        }
    }

    rankDisplay.textContent = currentRank;

    if (window.citizens) {
        const playerCitizen = window.citizens.find(c => c.isPlayer === true); 
        if (playerCitizen) {
            playerCitizen.job = currentRank; 
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
 // 1. SOCKET.IO initialisieren (global)
  if (typeof io === 'function') {
    window.socket = io();

    window.socket.on('stateUpdate', (state) => {
      if (state.resources) window.resources = state.resources;
      if (state.buildings) window.buildings = state.buildings;
      if (state.citizens) window.citizens = state.citizens;
      if (state.stats) window.stats = state.stats;

      if (window.statRender) window.statRender();
      if (window.renderBuildingList) window.renderBuildingList();
      console.log('State Update:', state);
    });
  }
    const introScreen = document.getElementById('intro-screen');
    const introText = document.getElementById('introText');
    const introNextBtn = document.getElementById('introNextBtn');
    const startScreen = document.getElementById('start-screen');
    const avatarBuilderContainer = document.getElementById('avatarBuilderContainer');
    const playerAvatarDisplay = document.getElementById('playerAvatarDisplay');
    const avatarBuilderWrapper = document.getElementById('avatarBuilderWrapper');
    const avatarToggle = document.getElementById('avatarToggle');
    const avatarHeaderText = document.querySelector('#avatarToggle .header-text');
    const SAVE_PREFIX = 'survivalSiedlungSave_';
    
    const savedPlayerName = localStorage.getItem('playerName'); 
    // Die Auto-Save-Prüfung und -Abfrage am Start wurde entfernt.
    
    if (introScreen && introText && introNextBtn && startScreen) {
        window.showScreen('intro-screen');
        
        const introLines = [
            ">> SYSTEMBOOT SEQUENCE INITIATED ...",
            ">> PROTOKOLL: ÜBERLEBENSPROGRAMM ALPHA-9 WIRD GELADEN ...",
            ">> JAHRE NACH DEM ZUSAMMENBRUCH DER ZIVILISATION ...",
            ">> DIE LETZTEN MENSCHEN SUCHEN ZUFLUCHT IN DEN TRÜMMERN ALTER STÄDTE ...",
            ">> DU WURDEST AUSGEWÄHLT, EINE NEUE SIEDLUNG ZU GRÜNDEN ...",
            ">> ZIEL: WIEDERAUFBAU DER MENSCHHEIT. SICHERUNG VON RESSOURCEN. ÜBERLEBEN.",
            ">> INITIALISIERUNG DES KOMMANDOSYSTEMS...",
            ">> WARTEN AUF EINGABE DES Aspiranten UND DER SIEDLUNG..."
        ];

        let index = 0;
        let lineIndex = 0;

        function typeIntroText() {
            if (index >= introLines.length) {
                introNextBtn.style.display = 'inline-block';
                return;
            }
            if (lineIndex < introLines[index].length) {
                introText.textContent += introLines[index][lineIndex];
                lineIndex++;
                setTimeout(typeIntroText, 25);
            } else {
                introText.textContent += "\n";
                index++;
                lineIndex = 0;
                setTimeout(typeIntroText, 300);
            }
        }

        setTimeout(typeIntroText, 300);

        introNextBtn.addEventListener('click', () => {
            introScreen.style.display = 'none';
            startScreen.style.display = 'block';
            
            if (avatarBuilderContainer && typeof window.createAvatarBuilderHTML === 'function') {
                avatarBuilderContainer.innerHTML = window.createAvatarBuilderHTML();
                
                if (typeof window.initializeAvatarBuilderEventListeners === 'function') {
                    window.initializeAvatarBuilderEventListeners();
                }
                
                window.updateAvatarPreview();
            }
        });
    } else {
    window.showScreen('start-screen');  
    }
    
    if (avatarToggle && avatarBuilderWrapper && avatarHeaderText) {
        avatarToggle.addEventListener('click', () => {
            const isActive = avatarBuilderWrapper.classList.toggle('active');

            if (isActive) {
                avatarHeaderText.textContent = ">> ZUWEISUNGSPROTOKOLL AVATAR (AKTIVIERT)";
            } else {
                avatarHeaderText.textContent = ">> ZUWEISUNGSPROTOKOLL AVATAR (DEAKTIVIERT)";
            }
        });
    }

 let citizens = [];
let nextCitizenId = 1;
let commandantCitizenId = null;
let buildings = [];
let nextBuildingId = 1;
let activeBuilds = [];
let activeExplorations = [];
let nextExplorationId = 1;
let gameLoopIntervalId = null;
    let resources = {
        holz: 60, 
        stein: 40,
        essen: 50, 
        wasser: 40, 
        medis: 5,
        waffen: 0,
		wolle: 0,      
        garn: 0,       
        stoff: 0,      
        kleidung: 0
    };
    
    let stats = {
        tag: 1,
        geborene: 0,
        gestorben: 0,
    };
    
    let calendar = {
        dayOfWeek: 1,
        weekOfMonth: 1,
        month: 0,
        year: 0,
    };
    
    const MONTH_COLORS = [
        { color: '#00ffff', season: 'winter' }, 
        { color: '#00ffff', season: 'winter' }, 
        { color: '#00ffff', season: 'winter' }, 
        { color: '#00ff00', season: 'spring' }, 
        { color: '#00ff00', season: 'spring' }, 
        { color: '#00ff00', season: 'spring' }, 
        { color: '#ffff00', season: 'summer' }, 
        { color: '#ffff00', season: 'summer' }, 
        { color: '#ffff00', season: 'summer' }, 
        { color: '#ff6600', season: 'fall' }, 
        { color: '#ff6600', season: 'fall' }, 
        { color: '#ff6600', season: 'fall' }  
    ];

    let eventActive = false;
        activeBuilds = [];
        activeExplorations = [];
        nextExplorationId = 1;

window.citizens = citizens;
window.buildings = buildings;
window.resources = resources; 
window.stats = stats;
window.calendar = calendar;
window.money = 0;
window.activeBuilds = activeBuilds;
window.activeExplorations = activeExplorations;
window.nextCitizenId = nextCitizenId;
window.nextBuildingId = nextBuildingId;
window.nextExplorationId = nextExplorationId;

    const jobs = ['Aspirant', 'Inspektor', 'Vorsteher', 'Suboffizier', 'Wache', 'Kommissar', 'Soldat']; 
    const names = [
        "Erik", "Mira", "Caro", "Len", "Ina", "Tom", "Oli",
        "Hanna", "Johann", "Fritz", "Magda", "Greta", "Klara", "Nils", "Mathis",
        "Helene", "Rolf", "Bente", "Sven", "Dora", "Kurt", "Rieke", "Anja",
        "Hanno", "Birte", "Finn", "Rieke", "Magnus", "Tilda", "Helga", "Kai",
        "Gustav", "Ralf", "Else", "Ida", "Emil", "Lilly", "Hedwig", "Konrad",
        "Gerda", "Karl", "Matti", "Runa", "Wilma", "Jonte", "Frieda", "Lars",
        "Benno", "Meta", "Oskar", "Thea", "Malte", "Henrik", "Elis", "Agnes",
        "Bertil", "Friedrich", "Lucie", "Kuno", "Tarja", "Toni", "Ragnar", "Anselm",
        "Alina", "Torge", "Irma", "Bjarne", "Selma", "Renke", "Janne", "Lene",
        "Moritz", "Marit", "Darius", "Lisanne", "Silas", "Fenja", "Arne", "Grete",
        "Senta", "Mattes", "Pia", "Till", "Noah", "Jördis", "Svea", "Leif",
        "Tobias", "Marlis", "Gido", "Kjell", "Runa", "Edda", "Björn", "Solveig"
    ];

    const buildingTypes = {
        zelt: { name: 'Zelt', category: 'Wohnen', costs: { holz: 10 }, capacity: 2, maxWorkers: 0, buildTime: 1, isDwelling: true },
        huette: { name: 'Kleine Hütte', category: 'Wohnen', costs: { holz: 20 }, capacity: 3, maxWorkers: 0, buildTime: 2, isDwelling: true },
        blockhaus: { name: 'Blockhaus', category: 'Wohnen', costs: { holz: 40, stein: 10 }, capacity: 5, maxWorkers: 0, buildTime: 3, isDwelling: true },
        
        holzfaellerhuette: { name: 'Holzfällerhütte', category: 'Erzeugung', costs: { holz: 15 }, capacity: 0, maxWorkers: 2, buildTime: 1, production: { holz: 5 } },
        steinmetzwerkstatt: { name: 'Steinmetzwerkstatt', category: 'Erzeugung', costs: { holz: 10, stein: 15 }, capacity: 0, maxWorkers: 2, buildTime: 2, production: { stein: 4 } },
        schmiede: { name: 'Schmiede', category: 'Erzeugung', costs: { holz: 18, stein: 10 }, capacity: 0, maxWorkers: 2, buildTime: 2, production: {}, prerequisite: 'holzfaellerhuette' },
        
        bauernhof: { name: 'Bauernhof', category: 'Lebensmittel', costs: { holz: 20 }, capacity: 0, maxWorkers: 3, buildTime: 2, production: { essen: 5 } },
        feld: { name: 'Feld', category: 'Lebensmittel', costs: { holz: 8 }, capacity: 0, maxWorkers: 1, buildTime: 1, production: { essen: 3 }, prerequisite: 'bauernhof' },
        schafsfarm: { name: 'Schafsfarm', category: 'Lebensmittel', costs: { holz: 16 }, capacity: 0, maxWorkers: 2, buildTime: 2, production: { essen: 4, wolle: 2 }, prerequisite: 'bauernhof' },
        baeckerei: { name: 'Bäckerei', category: 'Lebensmittel', costs: { holz: 16 }, capacity: 0, maxWorkers: 2, buildTime: 2, production: { essen: 6 }, prerequisite: 'bauernhof' },
        muehle: { name: 'Mühle', category: 'Lebensmittel', costs: { holz: 15 }, capacity: 0, maxWorkers: 1, buildTime: 2, production: { essen: 5 }, prerequisite: 'bauernhof' },
        brunnen: { name: 'Brunnen', category: 'Lebensmittel', costs: { holz: 25, stein: 15 }, capacity: 0, maxWorkers: 1, buildTime: 3, production: { wasser: 10 } },
        jagdhuette: { name: 'Jagdhütte', category: 'Lebensmittel', costs: { holz: 20 }, capacity: 0, maxWorkers: 2, buildTime: 2, production: { essen: 6 }, prerequisite: 'holzfaellerhuette' },
        fischerhuette: { name: 'Fischerhütte', category: 'Lebensmittel', costs: { holz: 20, stein: 5 }, capacity: 0, maxWorkers: 2, buildTime: 2, production: { essen: 8 }, prerequisite: 'huette' },
         spinnerei: { 
        name: 'Spinnerei', 
        category: 'Textilproduktion', 
        costs: { holz: 20, stein: 10 }, 
        capacity: 0, 
        maxWorkers: 2, 
        buildTime: 2, 
        production: { garn: 3 },
        prerequisite: 'schafsfarm',
        consumption: { wolle: 2 }  // Verbraucht Wolle
    },
    
    // NEU: Weberei
    weberei: { 
        name: 'Weberei', 
        category: 'Textilproduktion', 
        costs: { holz: 25, stein: 15 }, 
        capacity: 0, 
        maxWorkers: 2, 
        buildTime: 3, 
        production: { stoff: 2 },
        prerequisite: 'spinnerei',
        consumption: { garn: 3 }  // Verbraucht Garn
    },
	schneiderei: { 
        name: 'Schneiderei', 
        category: 'Textilproduktion', 
        costs: { holz: 30, stein: 20 }, 
        capacity: 0, 
        maxWorkers: 3, 
        buildTime: 3, 
        production: { kleidung: 1 },
        prerequisite: 'weberei',
        consumption: { stoff: 2 }  // Verbraucht Stoff
    },
        arzt: { name: 'Arztpraxis', category: 'Gesundheit & Bildung', costs: { holz: 22 }, capacity: 0, maxWorkers: 1, buildTime: 2, production: { medis: 2 } },
        schule: { name: 'Schule', category: 'Gesundheit & Bildung', costs: { holz: 30, stein: 15 }, capacity: 0, maxWorkers: 2, buildTime: 3, production: {} },
        
        waffenschmiede: { name: 'Waffenschmiede', category: 'Militär', costs: { holz: 30, stein: 20 }, capacity: 0, maxWorkers: 3, buildTime: 4, production: { waffen: 3 }, prerequisite: 'schmiede' },
        kaserne: { name: 'Kaserne', category: 'Militär', costs: { holz: 40, stein: 20 }, capacity: 0, maxWorkers: 5, buildTime: 3, defense: 0, prerequisite: 'huette', unlocksJob: 'Soldat', isDwelling: false },
        
        wall: { name: 'Wall', category: 'Verteidigung', costs: { stein: 50, holz: 20 }, capacity: 0, maxWorkers: 0, buildTime: 4, defense: 20, isDwelling: false },
        wachturm: { name: 'Wachturm', category: 'Verteidigung', costs: { holz: 30, stein: 10 }, capacity: 0, maxWorkers: 1, buildTime: 2, defense: 5, prerequisite: 'wall', isDwelling: false },
        
        marktplatz: { name: 'Marktplatz', category: 'Handel', costs: { holz: 50 }, capacity: 0, maxWorkers: 1, buildTime: 3, production: {}, prerequisite: 'huette' },
        
        lager: { name: 'Lager', category: 'Lager & Infrastruktur', costs: { holz: 25, stein: 15 }, capacity: 0, maxWorkers: 0, buildTime: 2, storageBonus: 50 },
        
        rathaus: { name: 'Rathaus', category: 'Sondergebäude', costs: { holz: 100, stein: 80, money: 500 }, capacity: 0, maxWorkers: 2, buildTime: 5, prerequisite: 'huette', unique: true },
        statue: { name: 'Heldenstatue', category: 'Sondergebäude', costs: { stein: 150, money: 1000 }, capacity: 0, maxWorkers: 0, buildTime: 6, defense: 10, unique: true },
        
        bank: {
            name: 'Bank',
            category: 'Handel',
            costs: { holz: 60, stein: 40, money: 300 },
            capacity: 0,
            maxWorkers: 2,
            buildTime: 4,
            production: {},
            prerequisite: 'marktplatz',
            isDwelling: false
        }
    };

    const buildingCategories = {};
    for (const key in buildingTypes) {
        const cat = buildingTypes[key].category;
        if (!buildingCategories[cat]) {
            buildingCategories[cat] = [];
        }
        buildingCategories[cat].push(key);
    }

    const playerDisplayName = document.getElementById('playerDisplayName');
    const startBtn = document.getElementById('startBtn');
    const playerNameInput = document.getElementById('playerName');
    const gameTitleHeader = document.getElementById('gameTitle');
    const settlementNameInput = document.getElementById('settlementName');
    const loadingArea = document.getElementById('loadingArea');
    const playerRankDisplay = document.getElementById('playerRankDisplay');
    const gameScreen = document.getElementById('game-screen');
    const settlementDiv = document.getElementById('settlement');
    const buildingListDiv = document.getElementById('buildingDisplay');
    const chatDiv = document.getElementById('chatMessages');
    const buildBtn = document.getElementById('buildBtn');
	 const buildSelect = document.getElementById('buildSelect');
  const confirmBuildBtn = document.getElementById('confirmBuildBtn');
  const cancelBuildBtn = document.getElementById('cancelBuildBtn');
    const exploreBtn = document.getElementById('exploreBtn');
    const marketBtn = document.getElementById('marketBtn');
    const buildMenu = document.getElementById('buildMenu');
    const buildSelect = document.getElementById('buildSelect');
    const confirmBuildBtn = document.getElementById('confirmBuildBtn');
    const cancelBuildBtn = document.getElementById('cancelBuildBtn');

    const exploreMenu = document.getElementById('exploreMenu');
    const exploreCount = document.getElementById('exploreCount');
    const exploreDuration = document.getElementById('exploreDuration');
    const confirmExploreBtn = document.getElementById('confirmExploreBtn');
    const cancelExploreBtn = document.getElementById('cancelExploreBtn');
	  if (confirmBuildBtn && buildSelect && window.socket) {
    confirmBuildBtn.onclick = () => {
      const type = buildSelect.value;
      window.socket.emit('buildRequest', { type });
      // Wichtig: KEIN lokales startBuild(type) mehr hier, sonst doppelt.
      const buildMenu = document.getElementById('buildMenu');
      if (buildMenu) buildMenu.style.display = 'none';
    };
  }
    const exploreType = document.getElementById('exploreType'); 

    const marketMenu = document.getElementById('marketMenu');
    const closeMarketBtn = document.getElementById('closeMarketBtn');
    const buildStatusDiv = document.getElementById('buildStatus');
    const exploreStatusDiv = document.getElementById('exploreStatus');
    const housingStatusDiv = document.getElementById('housingStatus');
    const workStatusDiv = document.getElementById('workStatus'); 
    const soldierStatusDiv = document.getElementById('soldierStatus');

    const eventModal = document.getElementById('eventModal');
    const eventModalMsg = document.getElementById('eventModalMsg');
    const eventYesBtn = document.getElementById('eventYesBtn');
    const eventNoBtn = document.getElementById('eventNoBtn');
  // --- Start ---
startBtn.addEventListener('click', () => {
	// game.js (Ausschnitt: Im startBtn.addEventListener, wo window.playerAvatar gesetzt wird)

// NEU: Avatar-Daten über die Funktion aus avatarBuilder.js abrufen
if (typeof window.getCurrentAvatarData === 'function') {
    window.playerAvatar = window.getCurrentAvatarData();
} else {
    // Fallback, sollte nicht passieren
    window.playerAvatar = { svgContent: '', color: '#33ff33' }; // Fallback anpassen
}
  const playerName = playerNameInput.value.trim();
  // KORREKTUR: Holen Sie den tatsächlichen Wert des Input-Feldes und speichern Sie ihn in 'settlementName'.
  const settlementName = settlementNameInput.value.trim(); // settlementNameInput wurde global definiert.
  window.settlementName = settlementName;
if (playerName.length < 3 || settlementName.length < 3) {
      alert("Name und Siedlungsname müssen mindestens 3 Zeichen lang sein.");
      return;
    }
  if (window.resetAchievements) {
        window.resetAchievements();
    }

  if (!playerName || !settlementName) {
    alert("Bitte gib sowohl deinen Namen als auch den Namen deiner Siedlung ein!");
    return;
  }
// NEUE ZEILE: Updates-Block sofort ausblenden, damit er während des Ladens nicht sichtbar ist.
  const updatesBox = document.getElementById("updatesBox");
  updatesBox.style.display = 'none';
gameTitleHeader.textContent = `Siedlung: ${settlementName.toUpperCase()}`;
gameTitleHeader.style.display = 'block';
  // Alte Korrekturen (die Elemente, die den Start-Screen bilden, ausblenden)
  playerNameInput.style.display = 'none';
  settlementNameInput.style.display = 'none';
  startBtn.style.display = 'none';
  document.querySelector('#start-screen h1').style.display = 'none';
  document.querySelector('label[for="playerName"]').style.display = 'none';
  document.querySelector('label[for="settlementName"]').style.display = 'none';
 // NEU: HIER WIRD DER AVATAR-BUILDER SOFORT AUSGEBLENDET (Lösung des Problems)
    if (avatarBuilderContainer) {
        avatarBuilderContainer.style.display = 'none'; 
    }
	if (window.avatarBuilderWrapper) {
      window.avatarBuilderWrapper.style.display = 'none';
  }
    // --- ENDE PHASE 2 -> PHASE 3 ---
 loadingArea.style.display = 'block';
    loadingArea.textContent = ">> STARTE INITIALISIERUNG...\n";
    let step = 0;

  const introSteps = [
    ">> SYSTEME WERDEN HOCHGEFAHREN...",
    ">> UMWELTANALYSE AKTIV...",
    ">> STRUKTUREN DER SIEDLUNG WERDEN ERRICHTET...",
    ">> BEWOHNER WERDEN ZUGEWIESEN...",
    ">> INITIALISIERUNG ABGESCHLOSSEN ✅"
  ];

  const interval = setInterval(() => {
    if (step < introSteps.length) {
      loadingArea.textContent += introSteps[step] + "\n";
      step++;
    } else {
      clearInterval(interval);
      setTimeout(() => {
        loadingArea.textContent += "\n>> Deine Siedlung '" + settlementName + "' ist errichtet und wartet auf deine Anweisungen.\n";
        loadingArea.textContent += ">> Baue zuerst ein Gebäude für Nahrung und Wasser.\n";
        loadingArea.textContent += ">> Viel Glück auf deiner Reise, Aspirant " + playerName + ".\n\n";
        loadingArea.innerHTML += '<button id="finalStartBtn">Start</button>';

        document.getElementById('finalStartBtn').addEventListener('click', () => {
          
          // NEU: Setzt den initialen Rang (0 Tage = Aspirant)
          window.updatePlayerRank(0);
          
          playerDisplayName.textContent = playerName;
		  // NEU: Avatar beim Start rendern (Funktion ist jetzt in avatarBuilder.js)
          if (window.playerAvatar) {
              window.renderPlayerAvatar(window.playerAvatar);
          }
          
          // --- KORREKTUR: HIER BLENDEN WIR DEN BUILDER EXPLIZIT AUS ---
          // Da der Start-Screen nicht ausgeblendet wird, muss der Builder manuell weg.
          if (avatarBuilderContainer) {
              avatarBuilderContainer.style.display = 'none'; // Die Lösung für dein Problem
          }
          loadingArea.style.display = 'none';
          // --- ENDE KORREKTUR ---

          document.getElementById('game-screen').style.display = 'block';
          initializeGame();
		  if (window.updateLiveMonitorButtonStatus) window.updateLiveMonitorButtonStatus();  
		  setTimeout(startGameLoop, 500);
        });
      }, 500);
    }
  }, 900);
});

// Event-Listener zum Öffnen des Modals
const creatorLink = document.getElementById('creatorLink');
const infoModal = document.getElementById('infoModal');
const closeInfoModal = document.getElementById('closeInfoModal');

if (creatorLink && infoModal) {
  creatorLink.addEventListener('click', function(event) {
    event.preventDefault();
    infoModal.style.display = 'flex'; // oder block
  });
}

if (closeInfoModal) {
  closeInfoModal.addEventListener('click', function() {
    infoModal.style.display = 'none';
  });
}
function updateBuildButtonStatus() {
    const baseBuildLimit = 2;
    const maxActiveBuilds = baseBuildLimit + (window.skillTree?.maxBuildProjectsLevel || 0);

    const buildBtn = document.getElementById('buildBtn');

    // NEU: Sperrung auch wenn das Gebäudelimit durch Skill erreicht ist!
    if (activeBuilds.length >= maxActiveBuilds || buildings.length >= getMaxBuildings()) {
        buildBtn.disabled = true;
        buildBtn.style.color = 'gray';
        buildBtn.textContent = 'Gebäude Bauen (Limit erreicht)';
    } else {
        buildBtn.disabled = false;
        buildBtn.style.color = '';
        buildBtn.textContent = 'Gebäude Bauen';
    }

    // Tooltip immer aktuell!
    buildBtn.title = "Max. Gebäude: " + getMaxBuildings() + ". Upgrade im Skill-Baum 'Neue Gebiete'!";
}

 // --- Hilfsfunktionen ---
function getResourceColor(amount, cap) {
  if (amount === 0) return 'red';
  if (amount <= 5) return '#ff6666'; // Helleres Rot bei sehr niedrigem Wert
  if (amount <= Math.max(1, Math.floor(0.1 * cap))) return 'red';
  if (amount >= cap) return 'darkorange'; // Sichtbarere „voll“ Farbe
  return 'inherit';
}

// Für Zombify separat:
const zombifyElem = document.getElementById("window.moneyAmount");
if (zombifyElem) {
  zombifyElem.innerText = `Zombify: ${window.money}`;
  zombifyElem.style.color = window.money < 0 ? 'red' : 'inherit';
}

 function getMaxActiveBuilds() {
  return 2 + (window.skillTree?.maxBuildProjectsLevel || 0);
}

function calculateResourceLimit() {
    const baseLimit = 50;
    const warehouseCount = buildings.filter(b => b.type === "lager").length;
    return baseLimit + (warehouseCount * 50);
}
function getMaxBuildings() {
  // Basis: 5, dann nach Skill-Level!
  if (window.skillTree?.regionExpansionLevel === undefined) return 5;
  return window.skillTree.regionExpansionLevel !== undefined
    ? window.skillTree.skills.find(s => s.key === "regionExpansion").levels[window.skillTree.regionExpansionLevel].maxBuildings
    : 5;
}
function calculateDefense() {
    let baseDefense = 0;
    
    // 1. Definiere ALLE verfügbaren Verteidigungseinheiten (Wache/Soldat)
    // Die Filtern entfernt Einheiten, die tot sind oder auf Expedition/Plünderung.
    // Dies ist die EINZIGE Liste, die für Einheiten-Boni verwendet wird.
    const availableDefensePersonnel = citizens.filter(c => 
        !c.tot && 
        (c.job === 'Wache' || c.job === 'Soldat') && 
        c.workBuildingId !== 'exploration' && 
        c.workBuildingId !== 'raid'
    );

    // 2. Grundbeitrag der Einheiten (Wache: 5, Soldat: 10)
    availableDefensePersonnel.forEach(c => {
        // Basisbeitrag für jede verfügbare Einheit: +5
        baseDefense += 5; 
        
        // Soldat-Bonus: zusätzliche +5 Punkte (Total 10 pro Soldat)
        if (c.job === 'Soldat') {
            baseDefense += 5; 
        }
    });
    
// ----------------------------------------------------------------------
    
    // 3. Bonus durch Verteidigungsgebäude
    buildings.forEach(b => {
        const bType = buildingTypes[b.type];
        if (bType.category === 'Verteidigung') {
            
            // A) Passive Verteidigung (Wall: 20, Wachturm: 5, Statue: 10)
            baseDefense += (bType.defense || 0); 
            
            // B) Aktiver Bonus durch bemannte Türme
            if (b.type === 'wachturm') {
                // Zähle nur Wachen/Soldaten, die dem Wachturm zugewiesen sind
                const guardCount = b.workers.filter(id => {
                    const c = citizens.find(c => c.id === id);
                    return c && (c.job === 'Wache' || c.job === 'Soldat');
                }).length;
                
                // Extra-Bonus für die Bemannung (+5 pro Einheit, ZUSÄTZLICH zum Grundbeitrag)
                baseDefense += guardCount * 5; 
            }
        }
    });

// ----------------------------------------------------------------------

    // 4. Waffen-Bonus (Bezug auf die Gesamtanzahl aller verfügbaren Einheiten)
    const availableDefenseUnitsCount = availableDefensePersonnel.length; 
    const weaponBonus = Math.min(availableDefenseUnitsCount, resources.waffen);
    baseDefense += weaponBonus * 2; 

    return Math.floor(baseDefense);
}
  // --- Kalender Rendering Funktionen ---

function renderMonthBulbs() {
    const monthBulbsDiv = document.getElementById('monthBulbs');
    if (!monthBulbsDiv) return;

    // Erstellt die 12 Birnen beim ersten Laden
    if (monthBulbsDiv.children.length === 0) {
        MONTH_COLORS.forEach((data, index) => {
            const bulb = document.createElement('div');
            bulb.className = `month-bulb ${data.season}`;
            bulb.style.borderColor = data.color; // Setzt die Rahmenfarbe
            bulb.dataset.monthIndex = index;
            monthBulbsDiv.appendChild(bulb);
        });
    }

    // Aktualisiert den Zustand der Birnen
    document.querySelectorAll('#monthBulbs .month-bulb').forEach(bulb => {
        const monthIndex = parseInt(bulb.dataset.monthIndex);
        
        // Die Birne leuchtet, wenn der Zyklus (Monat) abgeschlossen ist.
        // Die Birne für den aktuellen Monat leuchtet erst, wenn dieser abgeschlossen ist 
        // und der Fortschrittsbalken auf 100% war (d.h. der nächste Monat beginnt).
        if (monthIndex < calendar.month) {
            bulb.classList.add('on');
            bulb.style.backgroundColor = bulb.style.borderColor; 
        } else {
            bulb.classList.remove('on');
            bulb.style.backgroundColor = '#222222';
        }
    });
}

function updateCalendarDisplay() {
    // 1. Tageslichter (7-Tage-Zyklus)
    const dayLights = document.querySelectorAll('#dailyLights .day-light');
    dayLights.forEach((light, index) => {
        // Licht leuchtet für jeden Tag, der bereits vergangen ist (index < current day)
        if (index < calendar.dayOfWeek) {
            light.classList.add('on');
        } else {
            light.classList.remove('on');
        }
    });

    // 3. Monats-Fortschrittsbalken (Wochen-Anzeige)
    const progressBar = document.getElementById('monthlyProgressBar');
    
    // 🔥 KORRIGIERTE LOGIK: Fortschritt basiert auf der aktuellen Woche (1 bis 4)
    // Fortschritt ist 25%, 50%, 75%, 100%
    const weeklyProgress = (calendar.weekOfMonth / 4) * 100; 
    
   if (progressBar) {
        progressBar.style.width = `${weeklyProgress}%`;
    }
    // ENDE KORRIGIERTE LOGIK

    // 4. Monatsbirnen aktualisieren
    renderMonthBulbs();
    
    // 5. Jahreszähler
    const yearDisplay = document.getElementById('yearDisplay');
    if (yearDisplay) {
        yearDisplay.textContent = String(calendar.year).padStart(3, '0');
    }
}

function handleDailyCalendarUpdate() {
    // 1. Tag voranschreiten (7-Tage-Zyklus)
    calendar.dayOfWeek++;

    if (calendar.dayOfWeek > 7) {
        calendar.dayOfWeek = 1; // Tag zurücksetzen
        
        // 2. Woche voranschreiten (4-Wochen-Zyklus)
        calendar.weekOfMonth++;
        
        if (calendar.weekOfMonth > 4) {
            calendar.weekOfMonth = 1; // Woche zurücksetzen
            
            // 3. Monat voranschreiten (12-Monate-Zyklus)
            calendar.month++;
            
            if (calendar.month > 11) {
                calendar.month = 0; // Monat zurücksetzen (Januar)
                
                // 4. Jahr voranschreiten
                calendar.year++;
            }
        }
    }
    
    // Immer die Anzeige aktualisieren
    updateCalendarDisplay(); 
}
  // --- SPIEL INITIALISIERUNG ---

  function initializeGame() {
    // Hole den Spielernamen vom Display-Element
    const commandantName = document.getElementById('playerDisplayName').textContent;

    // NEU: Erstelle den unsterblichen Kommandanten-Bürger
    const commandantId = `c_${nextCitizenId++}`;
    citizens.push({
        id: commandantId,
        name: commandantName, // Verwende den eingegebenen Namen
        alter: 35, // Feste Altersangabe
        mood: 100, 
        health: 100, 
        job: RANK_DATA[0].title, // Standard-Startjob (kann später zugewiesen werden)
        houseId: null,
        workBuildingId: null,
        tot: false,
        krank: false,
        training: { isTraining: false, startDay: 0, buildingId: null },
        undying: true, // HIER: Markiert den Bürger als unsterblich
        isPlayer: true, 
    });
    commandantCitizenId = commandantId; 

    buildings.push({ 
      id: `b_${nextBuildingId++}`, 
      type: 'zelt', 
      name: 'Zelt', 
      residents: [], 
      workers: [], 
      health: 100, 
      maxHealth: 100, 
      status: 'open' 
    });
    buildings.push({ 
      id: `b_${nextBuildingId++}`, 
      type: 'holzfaellerhuette', 
      name: 'Holzfällerhütte', 
      residents: [], 
      workers: [], 
      health: 100, 
      maxHealth: 100, 
      status: 'open' 
    });
    window.citizens = citizens;
    window.buildings = buildings;
    // Reduziere die Anzahl der zufälligen Startbürger von 6 auf 5
    for (let i = 0; i < 5; i++) addCitizen(); 
    
    autoAssignWork();
    autoAssignHousing();
	
// game.js (Am besten ganz am Ende der Datei)

window.usePartySkill = function() { // <<-- WICHTIG: window. davor!
    const cost = 200;
    
    // Hinzufügen der Prüfung auf Freischaltung (für stärkere Sicherheit)
    if (!window.skillTree || !window.skillTree.partySkillUnlocked) {
        window.logEvent("Fehler: Party Skill ist noch nicht freigeschaltet.");
        return;
    }
    
    // Prüft Geld
    if (window.money < cost) {
        window.logEvent("Nicht genug Zombify, um das Fest auszurichten!");
        return;
    }
    
    // Geld abziehen
    window.money -= cost;
    
    // Laune auf 100 setzen
    window.citizens.forEach(citizen => { // Verwenden Sie window.citizens
        if (!citizen.tot) {
            citizen.mood = 100;
        }
    });
    
    // Loggen und Rendern
    window.logEvent("Party! Alle Bewohner sind jetzt glücklich! 🎉");
    
    // Diese Funktionen sind kritisch und MÜSSEN in Ihrer game.js existieren
    if (window.statRender) window.statRender();
    if (window.settlementRender) window.settlementRender();
};
    logEvent(`Siedlung von ${commandantName} gestartet. ${commandantName} und 5 Überlebende sind bereit.`);
    statRender();
    settlementRender();
    renderBuildingList();
    updateHousingStatus();
    updateMarketButtonStatus();
	renderMonthBulbs();
    updateCalendarDisplay();
	updateBuildButtonStatus();
  }

  function statRender() {
    const aliveCount = citizens.filter(c => !c.tot).length;

    document.getElementById('statDay').innerText = `Tag: ${stats.tag}`;
    document.getElementById('statCitizens').innerText = `Bürger: ${aliveCount}`;
    document.getElementById('statBorn').innerText = `Geboren: ${stats.geborene}`;
    document.getElementById('statDead').innerText = `Tote: ${stats.gestorben}`;
const cap = calculateResourceLimit();
document.getElementById('resWood').innerText = `Holz: ${resources.holz || 0}`;
document.getElementById('resStone').innerText = `Stein: ${resources.stein || 0}`;
document.getElementById('resWater').innerText = `Wasser: ${resources.wasser || 0}`;
document.getElementById('resWaffen').innerText = `Waffen: ${resources.waffen || 0}`;
document.getElementById('resWolle').innerText = `Wolle: ${resources.wolle || 0}`;
document.getElementById('resGarn').innerText = `Garn: ${resources.garn || 0}`;
document.getElementById('resStoff').innerText = `Stoff: ${resources.stoff || 0}`;
document.getElementById('resKleidung').innerText = `Kleidung: ${resources.kleidung || 0}`;
document.getElementById('resFood').innerText = `Essen: ${resources.essen || 0}`;
document.getElementById('resMedis').innerText = `Medis: ${resources.medis || 0}`;
    
// Holz
const elWood = document.getElementById('resWood');
const valWood = Number(resources.holz) || 0;
elWood.style.color = getResourceColor(valWood, cap);
if (valWood === 0) elWood.classList.add('blink-red'); else elWood.classList.remove('blink-red');

// Stein
const elStone = document.getElementById('resStone');
const valStone = Number(resources.stein) || 0;
elStone.style.color = getResourceColor(valStone, cap);
if (valStone === 0) elStone.classList.add('blink-red'); else elStone.classList.remove('blink-red');

// Wasser
const elWater = document.getElementById('resWater');
const valWater = Number(resources.wasser) || 0;
elWater.style.color = getResourceColor(valWater, cap);
if (valWater === 0) elWater.classList.add('blink-red'); else elWater.classList.remove('blink-red');

// Waffen
const elWaffen = document.getElementById('resWaffen');
const valWaffen = Number(resources.waffen) || 0;
elWaffen.style.color = getResourceColor(valWaffen, cap);
if (valWaffen === 0) elWaffen.classList.add('blink-red'); else elWaffen.classList.remove('blink-red');

// Wolle
const elWolle = document.getElementById('resWolle');
const valWolle = Number(resources.wolle) || 0;
elWolle.style.color = getResourceColor(valWolle, cap);
if (valWolle === 0) elWolle.classList.add('blink-red'); else elWolle.classList.remove('blink-red');

// Garn
const elGarn = document.getElementById('resGarn');
const valGarn = Number(resources.garn) || 0;
elGarn.style.color = getResourceColor(valGarn, cap);
if (valGarn === 0) elGarn.classList.add('blink-red'); else elGarn.classList.remove('blink-red');

// Stoff
const elStoff = document.getElementById('resStoff');
const valStoff = Number(resources.stoff) || 0;
elStoff.style.color = getResourceColor(valStoff, cap);
if (valStoff === 0) elStoff.classList.add('blink-red'); else elStoff.classList.remove('blink-red');

// Kleidung
const elKleidung = document.getElementById('resKleidung');
const valKleidung = Number(resources.kleidung) || 0;
elKleidung.style.color = getResourceColor(valKleidung, cap);
if (valKleidung === 0) elKleidung.classList.add('blink-red'); else elKleidung.classList.remove('blink-red');
 
// NEU: Essen (Fehlendes Coloring hinzugefügt)
const elFood = document.getElementById('resFood');
const valFood = Number(resources.essen) || 0;
elFood.style.color = getResourceColor(valFood, cap);
if (valFood === 0) elFood.classList.add('blink-red'); else elFood.classList.remove('blink-red');

// NEU: Medis (Die gewünschte Ergänzung)
const elMedis = document.getElementById('resMedis');
const valMedis = Number(resources.medis) || 0;
elMedis.style.color = getResourceColor(valMedis, cap);
if (valMedis === 0) elMedis.classList.add('blink-red'); else elMedis.classList.remove('blink-red');

    const defenseValue = calculateDefense();
    const defenseElement = document.getElementById('statDefense');
    if (defenseElement) {
        defenseElement.innerText = `Abwehr: ${defenseValue}`;
    }

const hasBank = buildings.some(b => b.type === 'bank');

if (!hasBank) {
    window.money = Math.min(window.money || 0, 500);
}
    document.getElementById('window.moneyAmount').innerText = `Zombify: ${window.money}`;
    updateMarketButtonStatus();
	updateBankButtonStatus();
const zombifyElem = document.getElementById('window.moneyAmount');
if (zombifyElem) {
  zombifyElem.innerText = `Zombify: ${window.money}`;
  zombifyElem.style.color = window.money < 0 ? 'red' : 'inherit';
}
  // ENDE Buttonblock
	window.window.money = window.money; //
	// NEU: Errungenschaften-Check aufrufen
  
  if (window.checkAllAchievements) {
        window.checkAllAchievements();
 }
}

function renderBuildingInfoBar() {
  const infoBar = document.getElementById("buildingInfoBar");
  if (!infoBar) return;

  // Wie viele von wieviel gebaut:
  const currentCount = buildings.length;
  const limit = getMaxBuildings();

  // Optional: Zeige Kategorien als Übersicht
  const categoryCounts = {};
  buildings.forEach(b => {
    const cat = buildingTypes[b.type].category;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
// Massenreparatur-Button anzeigen, falls freigeschaltet
  let repairBtnHtml = "";
  if (window.skillTree.repairAllButtonUnlocked) {
    repairBtnHtml = `<button id="repairAllBtn" class="actionButton" style="margin-left:8px;font-size:10.5px;padding:2px 8px;">Alle Gebäude reparieren</button>`;
  }
 // NEU: Massen-Toggle Buttons
 let massToggleHtml = "";
if (window.skillTree.massToggleUnlocked) {
    const mostOpen = areMostBuildingsOpen();
    const buttonText = mostOpen ? "Alle Schließen" : "Alle Öffnen 🔓";
    const buttonId = mostOpen ? "massCloseToggleBtn" : "massOpenToggleBtn";
    
    massToggleHtml = `
      <button id="${buttonId}" class="actionButton" style="min-width: 140px;">${buttonText}</button>
    `;
}
  
infoBar.innerHTML =
  `<div style="display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:3px;">
     <strong>Gebaut: ${currentCount} von ${limit}</strong>
    </div>
    <div style="margin-top: 0; font-size: 13px; text-align:center;"> ${massToggleHtml} ${repairBtnHtml} </div>
    <div style="margin-top: 0; font-size: 13px; text-align:center;"> ${Object.keys(categoryCounts).map(cat =>`<span style="margin-right:14px;">${cat}: ${categoryCounts[cat]}</span>`
     ).join('')}
   </div>`;

  // Event für Massenreparatur-Button anhängen
 if (window.skillTree.repairAllButtonUnlocked) {
  document.getElementById("repairAllBtn").onclick = repairAllBuildings;
}

// NEUE SINGLE-TOGGLE LOGIK
if (window.skillTree.massToggleUnlocked) {
    const mostOpen = areMostBuildingsOpen();
    const buttonId = mostOpen ? "massCloseToggleBtn" : "massOpenToggleBtn";
    const toggleButton = document.getElementById(buttonId);

    if (toggleButton) { // Null-Check, um TypError zu vermeiden
        toggleButton.onclick = () => {
            if (mostOpen) {
                // FALL 1: Die meisten sind offen -> Alle schließen
                buildings.forEach(b => {
                    if (b.status === 'open') {
                        b.status = 'closed';
                        // Bürger sofort aus dem geschlossenen Gebäude entfernen
                        [...b.residents].forEach(cId => assignCitizenToHouse(cId, null));
                        [...b.workers].forEach(cId => assignCitizenToWork(cId, null));
                        b.residents = [];
                        b.workers = [];
                    }
                });
                logEvent("🏢 Alle Gebäude wurden geschlossen.");
                
            } else {
                // FALL 2: Die meisten sind geschlossen -> Alle öffnen
                buildings.forEach(b => {
                    if (b.status === 'closed' && b.type !== 'wall' && b.health > 0) {
                        b.status = 'open';
                    }
                });
                logEvent("🔓 Alle Gebäude wurden geöffnet.");
                autoAssignHousing(); // Neu Zuweisen
                autoAssignWork();    // Neu Zuweisen
            }
            
            // Wichtig: UI aktualisieren, um den Button-Text sofort zu wechseln!
            renderBuildingList();
            statRender();
            settlementRender(); 
        };
    }
}
}

  // --- HILFSFUNKTIONEN FÜR REPARATUR/ZERSTÖRUNG ---
let buildingToDestroyId = null; // Speichert die ID des zu zerstörenden Gebäudes

function openDestroyConfirmation(buildingId) {
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return;

    buildingToDestroyId = buildingId;
    const buildingName = buildingTypes[building.type].name;
    
    // Gebäudenamen in das Modal einfügen
    document.getElementById('destroyBuildingName').textContent = buildingName;
    
    // Modal anzeigen
    document.getElementById('confirmationModal').style.display = 'flex';
}

function closeDestroyConfirmation() {
    buildingToDestroyId = null;
    document.getElementById('confirmationModal').style.display = 'none';
}
// NEUE HILFSFUNKTION FÜR DEN TOGGLE-BUTTON
function areMostBuildingsOpen() {
    const relevantBuildings = window.buildings.filter(b => b.type !== 'wall' && b.health > 0);
    if (relevantBuildings.length === 0) return true; // Keine Gebäude, also "offen"
    
    const openCount = relevantBuildings.filter(b => b.status === 'open').length;
    const closedCount = relevantBuildings.length - openCount;
    
    // Gibt true zurück, wenn 50% oder mehr Gebäude geöffnet sind
    return openCount >= closedCount;
}
function handleDestroyConfirmation() {
    if (buildingToDestroyId) {
        // Die eigentliche Zerstörungsfunktion (von game.js) aufrufen
        if (typeof destroyBuilding === 'function') {
            destroyBuilding(buildingToDestroyId);
            // Liste neu rendern
            renderBuildingList(); 
        } else {
            console.error('destroyBuilding Funktion nicht gefunden.');
        }
    }
    closeDestroyConfirmation();
}
  function repairAllBuildings() {
  buildings.forEach(b => {
    repairBuilding(b.id);
  });
  renderBuildingList();
}
function updateLiveMonitorButtonStatus() {
  const liveToggleBtn = document.getElementById('liveToggle');
  if (!liveToggleBtn) return;
  if (!window.skillTree?.liveMonitorUnlocked) {
    liveToggleBtn.disabled = true;
    liveToggleBtn.style.color = 'gray';
    liveToggleBtn.style.cursor = 'not-allowed';
    liveToggleBtn.title = 'Mit Fertigkeit freischalten!';
  } else {
    liveToggleBtn.disabled = false;
    liveToggleBtn.style.color = '';
    liveToggleBtn.style.cursor = 'pointer';
    liveToggleBtn.title = 'Live-Ansicht';
  }
}
window.updateLiveMonitorButtonStatus = updateLiveMonitorButtonStatus;
function trySpendResources(costs) {
    // 1. Phase: Verfügbarkeit prüfen (Check-Pass)
    for (const res in costs) {
        const required = costs[res];
        
        // NEU: Unterscheidung zwischen Währung und Material
        if (res === 'money' || res === 'zombify') { 
            // Währung (money/zombify) wird gegen die globale Variable geprüft
            if (window.money < required) {
                return false; // Nicht genug Währung
            }
        } else if (window.resources[res] < required) {
            // Normale Ressourcen werden gegen das resources-Objekt geprüft
            return false; // Nicht genug Material
        }
    }

    // 2. Phase: Ressourcen abziehen (Spend-Pass)
    for (const res in costs) {
        const required = costs[res];
        
        if (res === 'money' || res === 'zombify') {
            // Währung von der globalen Variable abziehen
            window.money -= required;
        } else {
            // Material vom resources-Objekt abziehen
            window.resources[res] -= required;
        }
    }
    
    return true; // Alle Kosten geprüft und abgezogen
}

  function repairBuilding(buildingId) {
    const building = buildings.find(b => b.id === buildingId);
    if (!building || building.status === 'closed') return;

    const bType = buildingTypes[building.type];
    const damage = building.maxHealth - building.health;
    
    if (damage <= 0) {
        logEvent(`${building.name} ist bereits voll repariert.`);
        return;
    }

    let repairCosts = {};
    for (const res in bType.costs) {
        repairCosts[res] = Math.max(1, Math.ceil(bType.costs[res] * (damage / building.maxHealth) * 0.5));
    }
    
    if (trySpendResources(repairCosts)) {
        building.health = building.maxHealth;
        logEvent(`${building.name} wurde repariert. Kosten: ${Object.entries(repairCosts).map(([r, a]) => `${a} ${r}`).join(', ')}.`);
        statRender();
        renderBuildingList(); 
    } else {
        logEvent(`FEHLER: Nicht genügend Ressourcen zur Reparatur von ${building.name}. Benötigt: ${Object.entries(repairCosts).map(([r, a]) => `${a} ${r}`).join(', ')}.`);
    }
  }

  function destroyBuilding(buildingId) {
    const index = buildings.findIndex(b => b.id === buildingId);
    if (index === -1) return;

    const building = buildings[index];
    const bType = buildingTypes[building.type];

    [...building.residents, ...building.workers].forEach(cId => {
        assignCitizenToHouse(cId, null); 
        assignCitizenToWork(cId, null);  
    });

    buildings.splice(index, 1);
    window.buildings = buildings;
    let refund = {};
    for (const res in bType.costs) {
        refund[res] = Math.floor(bType.costs[res] * 0.5);
        resources[res] = (resources[res] || 0) + refund[res];
    }

    logEvent(`GEBÄUDE ZERSTÖRT: ${building.name}. 50% der Ressourcen zurückerstattet.`);

    autoAssignHousing();
    autoAssignWork();
    statRender();
    renderBuildingList();
    updateBuildMenu(); 
  }

  function toggleBuildingStatus(buildingId) {
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return;

    if (building.status === 'open') {
        building.status = 'closed';
        [...building.residents].forEach(cId => assignCitizenToHouse(cId, null));
        [...building.workers].forEach(cId => assignCitizenToWork(cId, null));
        building.residents = [];
        building.workers = [];
        logEvent(`${building.name} wurde GESCHLOSSEN. Bewohner/Arbeiter freigegeben.`);
        autoAssignHousing();
        autoAssignWork();
    } else {
        building.status = 'open';
        logEvent(`${building.name} wurde GEÖFFNET.`);
        autoAssignHousing();
        autoAssignWork();
    }
    
    renderBuildingList(); 
    statRender();
  }

window.renderBuildingList = function() {
 const buildingListDiv = document.getElementById('buildingDisplay');
    if (!buildingListDiv) {
        console.warn("buildingDisplay Element nicht gefunden - UI noch nicht geladen");
        return;
    }
    
    window.repairBuilding = repairBuilding;
    window.toggleBuildingStatus = toggleBuildingStatus;
    window.destroyBuilding = destroyBuilding;
    window.renderBuildingList = renderBuildingList;
    
    buildingListDiv.innerHTML = '<div id="buildingInfoBar" style="margin-bottom:6px;"></div>';

    if (buildings.length === 0) {
        buildingListDiv.textContent = 'Keine Gebäude gebaut.';
        return;
    }

    const groupedByType = {};
    
    // Erste Gruppierung: Nach Kategorie
    buildings.forEach(b => {
        const cat = buildingTypes[b.type].category;
        if (!groupedByType[cat]) {
            groupedByType[cat] = {};
        }
        // Zweite Gruppierung: Nach Typ (z.B. zelt, huette)
        if (!groupedByType[cat][b.type]) {
            groupedByType[cat][b.type] = [];
        }
        groupedByType[cat][b.type].push(b);
    });

    for (const category in groupedByType) {
        const categoryId = category.replace(/\s/g, '_');
        
        // ZUSTAND WIEDERHERSTELLEN: Prüfen, ob die Kategorie offen war
        const isCategoryOpen = buildingListState.categoryOpen[categoryId] !== false; // Standardmäßig offen (initial)
        
        // 1. Kategorie-Header (Collapsible)
        const h4 = document.createElement('h4');
        h4.textContent = category;
        // Klasse basierend auf gespeichertem Zustand setzen
        h4.className = isCategoryOpen ? 'category-header collapsible-active' : 'category-header';
        h4.setAttribute('data-category', categoryId);
        h4.style.marginTop = '15px';
        h4.style.cursor = 'pointer'; 
        h4.innerHTML += isCategoryOpen 
                        ? ' <i class="fas fa-caret-down"></i>' 
                        : ' <i class="fas fa-caret-right"></i>';
        buildingListDiv.appendChild(h4);

        // 2. Container für die Gebäude dieser Kategorie (Collapsible Content)
        const categoryContainer = document.createElement('div');
        categoryContainer.className = isCategoryOpen ? 'building-category-container active' : 'building-category-container';
        categoryContainer.id = `cat-${categoryId}`;
        buildingListDiv.appendChild(categoryContainer);

        // 3. Iteration über die Gebäudetypen innerhalb der Kategorie
        for (const typeKey in groupedByType[category]) {
            const buildingInstances = groupedByType[category][typeKey];
            const count = buildingInstances.length;
            const bType = buildingTypes[typeKey];
            
            // ZUSTAND WIEDERHERSTELLEN: Prüfen, ob die Details offen waren
            const isDetailsOpen = buildingListState.detailsOpen[typeKey] === true;

            // --- SUMMARY DIV (Building Type Group) ---
            const groupDiv = document.createElement('div');
            groupDiv.className = 'building-type-group building-item';

            // ... (Zusammenfassungslogik beibehalten) ...
            const totalCapacity = bType.capacity * count;
            const totalResidents = buildingInstances.reduce((sum, b) => sum + b.residents.length, 0);
            const totalWorkers = buildingInstances.reduce((sum, b) => sum + b.workers.length, 0);
            const maxWorkers = bType.maxWorkers * count;
            const damagedCount = buildingInstances.filter(b => b.health < b.maxHealth).length;
            const closedCount = buildingInstances.filter(b => b.status === 'closed').length;
            
            let summaryHTML = `<h4 class="group-header">
                ${bType.name} <span style="color:#00ff00;">(x${count})</span>
            </h4>`;

            summaryHTML += `<div class="building-summary">`;
            if (bType.isDwelling) {
                summaryHTML += `<p>Bewohner: ${totalResidents} / ${totalCapacity}</p>`;
            }
            if (bType.maxWorkers > 0) {
                summaryHTML += `<p>Arbeiter: ${totalWorkers} / ${maxWorkers}</p>`;
            }
            if (damagedCount > 0) {
                summaryHTML += `<p style="color:yellow;">Beschädigt: ${damagedCount}</p>`;
            }
            if (closedCount > 0) {
                summaryHTML += `<p style="color:red;">Geschlossen: ${closedCount}</p>`;
            }
            summaryHTML += `</div>`;
            
            // Aktionen für die Gruppe
            const detailsButtonText = isDetailsOpen ? 'Details Ausblenden' : `Details (${count})`;
            summaryHTML += `<div class="building-actions group-actions">`;
            summaryHTML += `<button class="details-toggle-btn" data-type="${typeKey}">${detailsButtonText}</button>`;
            summaryHTML += `</div>`;
            
            groupDiv.innerHTML = summaryHTML;
            
            // --- DETAILS DIV (Individual Buildings) ---
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'building-type-details';
            detailsDiv.id = `details-${typeKey}`;
            // Zustand wiederherstellen
            detailsDiv.style.display = isDetailsOpen ? 'flex' : 'none'; 
            
            buildingInstances.forEach(b => {
                 const barColor = b.health > (b.maxHealth / 2) ? '#00ff00' : (b.health > 0 ? 'yellow' : 'red');
                 const toggleBtnText = b.status === 'open' ? 'Schließen' : 'Öffnen';
                 const healthText = `${b.health}/${b.maxHealth}`;
                 
                 // **FIX FÜR BUTTONS (Problem 2)**: 
                 // Statt nur data-id, verwenden wir ein globales Event-System. 
                 // Wir stellen sicher, dass die Klicks durch das Zuweisen von Funktionen im Listener funktionieren.
                 const repairBtnHtml = `<button class="action-repair-btn" data-id="${b.id}" ${b.health === b.maxHealth || b.status === 'closed' ? 'disabled' : ''}>Reparieren</button>`;
                 
                 let individualDiv = document.createElement('div');
                 individualDiv.className = 'individual-building-item';
                 individualDiv.innerHTML = `
                     <p style="margin: 0; font-weight: bold; font-size: 14px;">${bType.name} (ID: ${b.id.replace('b_', '')})</p>
                     <p style="margin: 0 0 5px 0; font-size: 12px;">${bType.isDwelling ? `Bewohner: ${b.residents.length}/${bType.capacity}` : ''} ${bType.maxWorkers > 0 ? `Arbeiter: ${b.workers.length}/${bType.maxWorkers}` : ''} | Status: ${b.status === 'open' ? 'Offen' : 'Geschlossen'}</p>
                     <div class="health-bar-container">
                         <div class="health-bar" style="width: ${(b.health / b.maxHealth) * 100}%; background-color: ${barColor};"></div>
                         <span style="position: absolute; width: 100%; text-align: center; font-size: 10px; line-height: 10px; color: #33ff33; text-shadow: 0 0 1px #000;">${healthText}</span>
                     </div>
                     <div class="building-actions">
                         ${repairBtnHtml}
                         <button class="action-toggle-status-btn" data-id="${b.id}">${toggleBtnText}</button>
                         <button class="action-destroy-btn dangerButton" data-id="${b.id}">Zerstören</button>
                     </div>
                 `;
                 detailsDiv.appendChild(individualDiv);
            });
            
            categoryContainer.appendChild(groupDiv);
            categoryContainer.appendChild(detailsDiv);
        }
    }
    // --- EVENT LISTENER ZUWEISUNG ---
    
    // 1. Event Listener für das Umschalten der Kategorien (mit Zustands-Speicherung)
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', (e) => {
            const categoryId = e.currentTarget.getAttribute('data-category');
            const container = document.getElementById(`cat-${categoryId}`);
            const icon = e.currentTarget.querySelector('.fas');

            e.currentTarget.classList.toggle('collapsible-active');
            container.classList.toggle('active');
            
            const isOpen = e.currentTarget.classList.contains('collapsible-active');
            buildingListState.categoryOpen[categoryId] = isOpen; // Zustand speichern!
            
            if (icon) {
                icon.classList.toggle('fa-caret-down', isOpen);
                icon.classList.toggle('fa-caret-right', !isOpen);
            }
        });
    });

    // 2. Event-Listener für das Umschalten der Details (mit Zustands-Speicherung)
    document.querySelectorAll('.details-toggle-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const typeKey = e.currentTarget.getAttribute('data-type');
            const detailsDiv = document.getElementById(`details-${typeKey}`);
            const isCurrentlyHidden = detailsDiv.style.display === 'none';

            if (isCurrentlyHidden) {
                detailsDiv.style.display = 'flex';
                e.currentTarget.textContent = 'Details Ausblenden';
                buildingListState.detailsOpen[typeKey] = true; // Zustand speichern!
            } else {
                detailsDiv.style.display = 'none';
                const categoryHeader = e.currentTarget.closest('.building-category-container').previousElementSibling;
                const categoryName = categoryHeader.textContent.trim();
                const currentCount = groupedByType[categoryName][typeKey].length;

                e.currentTarget.textContent = `Details (${currentCount})`;
                buildingListState.detailsOpen[typeKey] = false; // Zustand speichern!
            }
        });
    });

    // 3. Event-Listener für EINZELNE AKTIONEN in den Details (Problem 2 Fix)
    // Wir verwenden jetzt die globalen Fenster-Funktionen direkt.
    
    // Reparieren
    document.querySelectorAll('.action-repair-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            // Prüfen, ob die Funktion global definiert ist
            if (typeof window.repairBuilding === 'function') {
                window.repairBuilding(id);
                window.renderBuildingList(); // Neu rendern, um Status zu aktualisieren
            } else {
                console.error('repairBuilding Funktion nicht gefunden.');
            }
        });
    });
    
    // Status umschalten (Schließen/Öffnen)
    document.querySelectorAll('.action-toggle-status-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            if (typeof window.toggleBuildingStatus === 'function') {
                window.toggleBuildingStatus(id);
                window.renderBuildingList(); 
            } else {
                console.error('toggleBuildingStatus Funktion nicht gefunden.');
            }
        });
    });
    
    // Zerstören
// Zerstören (Verwendet jetzt das In-Game Modal statt des Pop-ups)
document.querySelectorAll('.action-destroy-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        // Ruft die Funktion auf, die das HTML-Modal im Monitor öffnet
        openDestroyConfirmation(id); 
    });
});

    renderBuildingInfoBar();
}

  function updateBuildMenu() {
    buildSelect.innerHTML = '<option value="">--- Gebäude auswählen ---</option>';

    const builtCounts = buildings.reduce((acc, b) => {
        acc[b.type] = (acc[b.type] || 0) + 1;
        return acc;
    }, {});
const isMilitaryVisible  = window.skillTree?.militaryUnlocked;
const isDefenseVisible   = window.skillTree?.defenseUnlocked;
const isMonumentVisible  = window.skillTree?.monumentUnlocked;
    for (const category in buildingCategories) {
		if (category === 'Militär'      && !isMilitaryVisible)  continue;
  if (category === 'Verteidigung' && !isDefenseVisible)   continue;
  if (category === 'Sondergebäude'&& !isMonumentVisible)  continue;
        let optgroup = document.createElement('optgroup');
        optgroup.label = category;

        buildingCategories[category].forEach(typeKey => {
            const bType = buildingTypes[typeKey];
            
            let isPrerequisiteMet = true;
            if (bType.prerequisite) {
                isPrerequisiteMet = buildings.some(b => b.type === bType.prerequisite);
            }

            if (isPrerequisiteMet || !bType.prerequisite) {
                const option = document.createElement('option');
                option.value = typeKey;

                const count = builtCounts[typeKey] || 0;
                let optionText = `${bType.name} (${count}x gebaut)`; 
                
                const costs = Object.entries(bType.costs).map(([res, amt]) => `${amt} ${res}`).join(', ');
                optionText += ` [Kosten: ${costs}]`;
if (typeKey === 'lager') {
    optionText += ' | erhöht Lagerkapazität um 50 für Stein, Holz, Wasser, Waffen';
}

option.textContent = optionText;
optgroup.appendChild(option);

                option.textContent = optionText;
                optgroup.appendChild(option);
            }
        });
        buildSelect.appendChild(optgroup);
    }
  }

  function updateHousingStatus() {
    const isExploringOrTraining = (c) => c.workBuildingId === 'exploration' || c.workBuildingId === 'raid' || c.training.isTraining;

    const homelessCount = citizens.filter(c => !c.tot && !c.houseId && !isExploringOrTraining(c)).length;
    const joblessCount = citizens.filter(c => !c.tot && !c.workBuildingId && !isExploringOrTraining(c)).length; 
    const soldierCount = citizens.filter(c => !c.tot && c.job === 'Soldat').length;

    housingStatusDiv.innerHTML = `Obdachlose: <span style="color: ${homelessCount > 0 ? 'red' : 'lime'};">${homelessCount}</span>`; 
    workStatusDiv.innerHTML = `Untätige: <span style="color: ${joblessCount > 0 ? 'yellow' : 'lime'};">${joblessCount}</span>`;
    soldierStatusDiv.innerHTML = `Soldaten: <span style="color: ${soldierCount > 0 ? 'cyan' : 'gray'};">${soldierCount}</span>`; 
  }

  function updateActionStatusDisplay() {
    let buildAndTrainingStatus = '';
    
    if (activeBuilds.length > 0) {
        buildAndTrainingStatus += activeBuilds.map(activeBuild => {
            const daysPassed = stats.tag - activeBuild.startDay;
            const totalDuration = activeBuild.duration;
            const progress = Math.min(100, (daysPassed / totalDuration) * 100);
            return `
                <p style="margin: 0; font-weight: bold;">Baue ${buildingTypes[activeBuild.buildingType].name} (Tag ${daysPassed} von ${totalDuration}):</p>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${progress}%"></div>
                    <div class="progress-text">${Math.floor(progress)}%</div>
                </div>
            `;
        }).join('');
    }

    const trainingCitizens = citizens.filter(c => c.training.isTraining);
    if (trainingCitizens.length > 0) {
        buildAndTrainingStatus += trainingCitizens.map(c => {
            const daysPassed = stats.tag - c.training.startDay;
            const totalDuration = 10;
            const progress = Math.min(100, (daysPassed / totalDuration) * 100);
            return `
                <p style="margin: 0; font-weight: bold;">Training ${c.name} (${c.job}) (Tag ${daysPassed} von ${totalDuration}):</p>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${progress}%"></div>
                    <div class="progress-text">${Math.floor(progress)}%</div>
                </div>
            `;
        }).join('');
    }

    buildStatusDiv.innerHTML = buildAndTrainingStatus || 'Kein Bauprojekt aktiv.';

    if (activeExplorations.length > 0) {
      exploreStatusDiv.innerHTML = activeExplorations.map(exp => {
        const daysPassed = stats.tag - exp.startDay;
        const totalDuration = exp.duration;
        const progress = Math.min(100, (daysPassed / totalDuration) * 100);
        const typeDisplay = exp.type === 'raid' ? 'Plünderung' : 'Erkundung';

        return `
          <p style="margin: 0; font-weight: bold;">${typeDisplay}sgruppe ${exp.id} (${exp.citizens.length} Pers.):</p>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${progress}%"></div>
            <div class="progress-text">Rückkehr in ${totalDuration - daysPassed} Tagen</div>
          </div>
        `;
      }).join('');
    } else {
      exploreStatusDiv.innerHTML = 'Keine Erkundungs-/Plünderungsgruppe unterwegs.';
    }
  }

 window.settlementRender = function() {
    const activeCitizens = citizens.filter(c => !c.tot && c.workBuildingId !== 'exploration' && c.workBuildingId !== 'raid' && !c.training.isTraining);
    const allBuildings = buildings;

    const availableHouses = allBuildings
      .filter(b => buildingTypes[b.type].isDwelling)
      .map(b => ({
        id: b.id,
        name: b.name,
        capacity: buildingTypes[b.type].capacity,
        free: buildingTypes[b.type].capacity - b.residents.length
      }));

    const availableWorkplaces = allBuildings
      .filter(b => buildingTypes[b.type].maxWorkers > 0)
      .map(b => ({
        id: b.id,
        name: b.name,
        type: b.type,
        maxWorkers: buildingTypes[b.type].maxWorkers,
        workers: b.workers.length
      }));

    settlementDiv.innerHTML = activeCitizens.map((c, idx) => {
      const houseOptions = availableHouses.map(h => {
        const selected = c.houseId === h.id ? 'selected' : '';
        const disabled = c.houseId !== h.id && h.free <= 0 ? 'disabled' : '';
        return `<option value="${h.id}" ${selected} ${disabled}>🏠 ${h.name} (${h.free}/${h.capacity} frei)</option>`;
      }).join('');

      const workOptions = availableWorkplaces.map(w => {
        const selected = c.workBuildingId === w.id ? 'selected' : '';
        let disabled = c.workBuildingId !== w.id && w.workers >= w.maxWorkers ? 'disabled' : '';
        
        let workplaceLabel = w.name;
        if (w.type === 'kaserne') {
            if (c.job === 'Soldat') {
                disabled = 'disabled';
                workplaceLabel = `⚔️ ${w.name} (Soldaten benötigen kein Training)`;
            } else {
                workplaceLabel = `⚔️ ${w.name} (Ausbildung, ${w.workers}/${w.maxWorkers})`;
            }
        } else {
            workplaceLabel = `🛠️ ${w.name} (${w.workers}/${w.maxWorkers} Arbeiter)`;
        }
        
        return `<option value="${w.id}" ${selected} ${disabled}>${workplaceLabel}</option>`;
      }).join('');

      const nameColor = c.krank ? 'red' : 'inherit'; 
      const moodColor = c.mood > 70 ? 'lime' : c.mood < 30 ? 'orange' : 'yellow';
      
      let jobColor = 'inherit';
      if (c.job === 'Soldat' || c.job === 'Wache') {
          jobColor = 'cyan';
      }

      return `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;">
          <span style="color:${nameColor};font-weight:bold;min-width:100px;">${c.name} (A: ${c.alter})</span>
          <span style="min-width:100px; color:${jobColor};">${c.job}</span>
          <span style="font-size:1.1em;color:${moodColor};">☺</span>
          
          <div class="citizen-assignment" style="min-width: 350px;">
            <select data-id="${c.id}" class="houseSelect" style="min-width:170px;">
              <option value="null" ${!c.houseId ? 'selected' : ''}>${!c.houseId ? '🏠 Obdachlos' : '🏠 Kein Wechsel'}</option>
              ${houseOptions}
            </select>
            
            <select data-id="${c.id}" class="workSelect" style="min-width:170px;">
              <option value="null" ${!c.workBuildingId ? 'selected' : ''}>🛠️ Keine Aufgabe</option>
              ${workOptions}
            </select>
          </div>

          <button class="btnMood" data-id="${c.id}" title="Loben" style="margin-left:5px;cursor:pointer;">👍</button>
          <button class="btnKick" data-id="${c.id}" title="Rauswerfen" style="margin-left:5px;color:red;cursor:pointer;">❌</button>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.houseSelect').forEach(el => {
      el.addEventListener('change', e => {
        const citizenId = e.target.getAttribute('data-id');
        const houseId = e.target.value === 'null' ? null : e.target.value;
        assignCitizenToHouse(citizenId, houseId);
        settlementRender();
        updateHousingStatus();
      });
    });

    document.querySelectorAll('.workSelect').forEach(el => {
      el.addEventListener('change', e => {
        const citizenId = e.target.getAttribute('data-id');
        const workBuildingId = e.target.value === 'null' ? null : e.target.value;
        assignCitizenToWork(citizenId, workBuildingId);
        settlementRender();
      });
    });

    document.querySelectorAll('.btnMood').forEach(el => {
      el.addEventListener('click', e => {
        const id = e.target.getAttribute('data-id');
        const citizen = citizens.find(c => c.id === id);
        if (citizen) {
          citizen.mood = Math.min(100, citizen.mood + 10);
          logEvent(`${citizen.name} wurde gelobt. Laune: ${citizen.mood}`);
          settlementRender();
        }
      });
    });

    document.querySelectorAll('.btnKick').forEach(el => {
      el.addEventListener('click', e => {
        const id = e.target.getAttribute('data-id');
        const index = citizens.findIndex(c => c.id === id);
        if (index !== -1) {
          const name = citizens[index].name;
          assignCitizenToHouse(id, null);
          assignCitizenToWork(id, null);
          citizens.splice(index, 1);
          logEvent(`${name} wurde aus der Siedlung entfernt.`);
          settlementRender();
          updateHousingStatus();
        }
      });
    });
  }

  function assignCitizenToHouse(citizenId, newHouseId) {
    const citizen = citizens.find(c => c.id === citizenId);
    if (!citizen) return;

    if (citizen.houseId) {
      const oldHouse = buildings.find(b => b.id === citizen.houseId);
      if (oldHouse) {
        oldHouse.residents = oldHouse.residents.filter(id => id !== citizenId);
      }
    }

    citizen.houseId = newHouseId;

    if (newHouseId) {
      const newHouse = buildings.find(b => b.id === newHouseId);
      const bType = buildingTypes[newHouse.type];
      if (newHouse && newHouse.residents.length < bType.capacity) {
        newHouse.residents.push(citizenId);
      } else {
        citizen.houseId = null;
        logEvent(`FEHLER: ${newHouse.name} ist voll, ${citizen.name} bleibt obdachlos.`);
      }
    }
  }
window.assignCitizenToHouse = assignCitizenToHouse;
  function assignCitizenToWork(citizenId, newWorkId) {
    const citizen = citizens.find(c => c.id === citizenId);
    if (!citizen) return;

    if (citizen.training.isTraining) {
        const oldWork = buildings.find(b => b.id === citizen.training.buildingId);
        if (oldWork) {
            oldWork.workers = oldWork.workers.filter(id => id !== citizenId);
        }
        citizen.training = { isTraining: false, startDay: 0, buildingId: null };
    }

    if (citizen.workBuildingId && citizen.workBuildingId !== 'exploration' && citizen.workBuildingId !== 'raid') {
      const oldWork = buildings.find(b => b.id === citizen.workBuildingId);
      if (oldWork) {
        oldWork.workers = oldWork.workers.filter(id => id !== citizenId);
      }
    }

    if ((citizen.workBuildingId === 'exploration' || citizen.workBuildingId === 'raid') && newWorkId !== 'exploration' && newWorkId !== 'raid') {
        activeExplorations.forEach(exp => {
            exp.citizens = exp.citizens.filter(id => id !== citizenId);
        });
    }

    citizen.workBuildingId = newWorkId;

    if (newWorkId && newWorkId !== 'exploration' && newWorkId !== 'raid') {
      const newWork = buildings.find(b => b.id === newWorkId);
      const bType = buildingTypes[newWork.type];
      
      if (newWork && newWork.workers.length < bType.maxWorkers) {
        
        if (newWork.type === 'kaserne') {
            if (citizen.job === 'Soldat') {
                 logEvent(`FEHLER: ${citizen.name} ist bereits Soldat und benötigt kein Training.`);
                 citizen.workBuildingId = null;
                 return;
            }
            citizen.training = { isTraining: true, startDay: stats.tag, buildingId: newWorkId };
            logEvent(`${citizen.name} beginnt Training zum Soldaten (Dauer: 10 Tage).`);
        }
        
        newWork.workers.push(citizenId);

      } else {
        citizen.workBuildingId = null;
        logEvent(`FEHLER: ${newWork.name} ist voll, ${citizen.name} bleibt untätig.`);
      }
    }
  }
window.assignCitizenToWork = assignCitizenToWork;
  function logEvent(text) {
    const ts = new Date().toLocaleTimeString();
    chatDiv.innerHTML = `<div>[${ts}] ${text}</div>` + chatDiv.innerHTML;
  }

function simulatePopulation() {
    let newborns = 0;
    let desertedCitizens = [];
    let killedCitizens = [];

    // --- NEUE LOGIK: TÄGLICHE ALTERUNG & JOB-FREIGABE ---
    // Diese Schleife geht einmal alle Bürger durch.

    for (const c of citizens) {
        if (!c.tot) {
          // Nur alle 5 Tage wird das Alter erhöht.
            if (window.stats.tag % 5 === 0) {
                c.alter++; // <-- Nur diese Zeile darf das Alter hochzählen
            }

            // Job-Wechsel von 'Kind' zu arbeitsfähig mit 12 Jahren
            // Prüfung: Muss genau 12 Jahre alt werden UND der Job muss noch 'Kind' sein.
            if (c.alter === 12 && c.job === 'Kind') {
                
                // 1. Job auf null setzen (macht ihn arbeitslos/verfügbar)
                c.job = randomJob();
autoAssignWork(c.id);
                
                // 2. workBuildingId zurücksetzen
                c.workBuildingId = null; 
                
                logEvent(`🎉 Jubel: ${c.name} (12) ist kein Kind mehr und bereit für einen Job!`);
            }
        }
    }
	
    // --- BESTEHENDE LOGIK: SIMULATION VON BEDÜRFNISSEN (Hunger, Durst, Krankheit) ---
    for (let c of citizens) {
        // Ignoriert tote oder auf Expedition befindliche Bürger
        if (c.tot || c.workBuildingId === 'exploration' || c.workBuildingId === 'raid') continue;

        c.hunger += 10;
        c.thirst = (c.thirst || 0) + 10;

        if (resources.essen > 0) {
            resources.essen--;
            c.hunger = Math.max(0, c.hunger - 15);
        } else {
            c.hunger += 5;
        }

        if (resources.wasser > 0) {
            resources.wasser--;
            c.thirst = Math.max(0, c.thirst - 15);
        } else {
            c.thirst += 5;
        }

        if (c.krank) {
            if (resources.medis > 0) {
                resources.medis--;
                c.krank = false;
                c.mood = Math.min(100, c.mood + 10);
                logEvent(`${c.name} wurde mit Medikamenten behandelt.`);
            } else {
                c.leben -= 5;
                c.mood = Math.max(0, c.mood - 10);
                logEvent(`${c.name} ist krank und verschlechtert sich.`);
            }
        }

        if (c.hunger > 75 || c.thirst > 75) {
            c.leben -= 5;
            c.mood = Math.max(0, c.mood - 5);
        }
        if (!c.houseId) {
            c.leben -= 2;
            c.mood = Math.max(0, c.mood - 10);
        }

        let badCondition = false;
        if (!c.houseId || c.hunger > 85 || c.thirst > 85 || c.mood < 25) {
            c.desertionRisk += 0.25;
            badCondition = true;
        }
        if (!badCondition) {
            c.desertionRisk = Math.max(0, c.desertionRisk - 1);
        }

if (c.desertionRisk >= 10 && Math.random() < 0.10) { 
    
    // NEU: Unsterblichkeits-/Permanenzprüfung für den Kommandanten
    if (c.undying) {
        logEvent(`${c.name} (Kommandant) hat darüber nachgedacht, die Siedlung zu verlassen, ist aber geblieben.`);
        // Setze das Risiko zurück, um das Spaming von Events zu verhindern
        c.desertionRisk = 0; 
        c.mood = Math.max(10, c.mood - 15); // Bestrafung für den Versuch
        continue; // Springt zur nächsten Schleifeniteration, der Kommandant bleibt
    }
    // ENDE DER PERMANENZPRÜFUNG
    
    desertedCitizens.push(c.id);
    logEvent(`${c.name} hat die Siedlung verlassen (Obdachlos, hungrig oder sehr unzufrieden)!`);
    continue; 
}
      
      // game.js

if (c.leben <= 0) {
    
    // NEU: Unsterblichkeitsprüfung für den Kommandanten
    if (c.undying) {
        logEvent(`${c.name} (Kommandant) hat Hunger/Krankheit getrotzt!`);
        c.leben = 1; // Setzt die Lebenspunkte auf das Minimum
        c.mood = Math.max(10, c.mood - 20); // Großer Launen-Strafabzug
        continue; // Springt zur nächsten Schleifeniteration, der Kommandant stirbt nicht
    }
    // ENDE DER UNSTERBLICHKEITSPRÜFUNG
    
    killedCitizens.push(c.id);
    logEvent(`${c.name} ist an Erschöpfung/Krankheit gestorben.`);
    continue;
}

     if (c.alter >= 60) { 
    let deathChance = (c.alter - 60) * 0.005; 
    if (c.alter > 80) deathChance += 0.05; 
    
    if (Math.random() < deathChance) {
        
        // NEU: Unsterblichkeitsprüfung für den Kommandanten
        if (c.undying) {
            logEvent(`${c.name} (Kommandant) hat dem Tod durch Alter getrotzt!`);
            // Setzt das Alter auf einen hohen, aber stabilen Wert und beendet die Tötung
            c.alter = 80; 
            c.mood = Math.max(10, c.mood - 10); // Moral sinkt
            continue; // Springt zur nächsten Schleifeniteration, der Kommandant stirbt nicht
        }
        // ENDE DER UNSTERBLICHKEITSPRÜFUNG
        
        killedCitizens.push(c.id);
        logEvent(`${c.name} ist an Altersschwäche gestorben (Alter: ${c.alter}).`);
        continue;
    }
}

      if (Math.random() < 0.02) {
        addCitizen(true);
        newborns++;
        
      }
    }
    
  const removedCitizenIds = [...killedCitizens, ...desertedCitizens];
    
    if (removedCitizenIds.length > 0) {
        buildings.forEach(building => {
            building.residents = building.residents.filter(id => !removedCitizenIds.includes(id));
            building.workers = building.workers.filter(id => !removedCitizenIds.includes(id));
        });
        
        // Sofort aus citizens-Array entfernen für konsistente Anzeige
        citizens = citizens.filter(c => !removedCitizenIds.includes(c.id));
		window.citizens = citizens;
        stats.gestorben += killedCitizens.length;
    }

    if (newborns > 0) logEvent(`${newborns} Kinder sind geboren.`);
  }
function simulateBuildingDecay() {
  let decayedBuildings = 0;
  
  // *** HIER kannst du die tägliche Wahrscheinlichkeit anpassen, dass ein Gebäude Schaden nimmt ***
  // 0.3 bedeutet 30% Chance
  const decayChance = 0.3; 

  buildings.forEach(building => {
    // 1. Zuerst prüfen: Soll das Gebäude heute überhaupt Schaden nehmen?
    if (Math.random() > decayChance) {
        // Wenn die Zufallszahl (0.0 bis 1.0) größer ist als die Chance,
        // nimmt das Gebäude heute keinen Schaden und wir gehen zum nächsten Gebäude über.
        return; 
    }

    // Geschlossene Gebäude verfallen langsamer, zerstörte Gebäude nicht
    if (building.health <= 0) return; 

    // Täglichen Verfall festlegen (z.B. 1 bis 3 Lebenspunkte pro Tag)
    // Dieser Wert ist der Schaden, WENN der Verfall eintritt.
    const decayRate = building.status === 'closed' ? 1 : 2; 

    building.health = Math.max(0, building.health - decayRate);
    
    if (building.health === 0) {
      logEvent(`ACHTUNG: ${building.name} ist zerstört und muss abgerissen oder repariert werden!`);
      // Gebäude, das zerstört ist, kann nicht mehr bewohnt/bearbeitet werden.
      building.status = 'closed'; 
      building.residents.forEach(cId => assignCitizenToHouse(cId, null));
      building.workers.forEach(cId => assignCitizenToWork(cId, null));
      building.residents = [];
      building.workers = [];
      autoAssignHousing();
      autoAssignWork();
    } else if (building.health < building.maxHealth) {
      decayedBuildings++;
    }
  });

  if (decayedBuildings > 0) {
    // Aktualisiere die Gebäudeliste, damit die Health-Bars neu gerendert werden
    renderBuildingList(); 
  }
}

/**
 * Berechnet tägliche Einnahmen (Steuern) für bewohnte Häuser und
 * tägliche Kosten für leere Wohnhäuser und alle anderen Gebäude in Zombify.
 */
function simulateHousingFinance() {
    let dailyRevenue = 0;
    // Tägliche Raten in Zombify festlegen (ANPASSEN!)
    const HOUSING_TAX_PER_RESIDENT = 5;       // Zombify-Einkommen pro Bewohner (Miete/Steuer)
    const HOUSING_COST_PER_EMPTY_HOUSE = 3;   // Zombify-Kosten für ein leeres, offenes Wohnhaus (Unterhalt)
    const PRODUCTION_MAINTENANCE_COST = 4;    // Zombify-Kosten für ALLE ANDEREN Gebäude (z.B. Produktions-/Militärgebäude)

    // --- 1. Wohnhäuser (Einnahmen ODER Kosten) ---
    const allDwellingHouses = buildings.filter(b => buildingTypes[b.type].isDwelling);

    allDwellingHouses.forEach((building) => {
        // Ein geschlossenes oder zerstörtes Haus wird ignoriert
        if (building.status === 'closed' || building.health <= 0) {
            return;
        }

        const occupied = building.residents.length;
        
        if (occupied > 0) {
            // Einnahme: Steuern/Miete
            dailyRevenue += HOUSING_TAX_PER_RESIDENT * occupied;
        } else {
            // Kosten: Abzug für UNBEWOHNTES Haus
            dailyRevenue -= HOUSING_COST_PER_EMPTY_HOUSE;
        }
    });

    // --- 2. Andere Gebäude (Nur Kosten) ---
    // Filtert alle Gebäude, die KEINE Wohnhäuser sind
    const otherBuildings = buildings.filter(b => !buildingTypes[b.type].isDwelling);
    let maintenanceCost = 0;

    otherBuildings.forEach((building) => {
         // Ein geschlossenes oder zerstörtes Gebäude verursacht keine Unterhaltskosten
        if (building.status === 'closed' || building.health <= 0) {
            return;
        }
        
        // Kosten für jedes aktive, nicht-Wohngebäude abziehen
        maintenanceCost += PRODUCTION_MAINTENANCE_COST;
    });
    
    dailyRevenue -= maintenanceCost; // Gesamtunterhaltskosten abziehen

    // --- 3. Finanzielle Aktualisierung und Logging ---
    if (dailyRevenue !== 0) {
        window.money += dailyRevenue;
        
        let logMsg = 'FINANZEN: ';
        let housingLog = allDwellingHouses.length > 0 ? `Wohn: (${dailyRevenue - (-maintenanceCost)} Zombify)` : '';
        let maintenanceLog = otherBuildings.length > 0 ? `Unterhalt: (-${maintenanceCost} Zombify)` : '';

        // Gesamte tägliche Bilanz loggen
        logEvent(`${logMsg} Bilanz: ${dailyRevenue} Zombify. ${housingLog} ${maintenanceLog}`); 
    }
}







  function simulateBuildingProduction() {
    let productionEvents = [];
    buildings.forEach((building) => {
      if (building.status === 'closed' || building.health <= 0) {
          return; 
      }
      const bType = buildingTypes[building.type];

      if (building.type !== 'kaserne' && building.workers.length > 0 && bType.production) {
        const workerFactor = building.workers.length;
   // NEU: Prüfe ob Rohstoffe für Verbrauch vorhanden sind
            let canProduce = true;
            if (bType.consumption) {
                for (const [res, baseAmount] of Object.entries(bType.consumption)) {
                    const needed = baseAmount * workerFactor;
                    if ((resources[res] || 0) < needed) {
                        canProduce = false;
                        productionEvents.push(`${bType.name} fehlt ${res} (benötigt: ${needed})`);
                        break;
                    }
                }
            }
            
            if (!canProduce) return; // Keine Produktion ohne Rohstoffe
			
			  // NEU: Verbrauche Rohstoffe
            if (bType.consumption) {
                for (const [res, baseAmount] of Object.entries(bType.consumption)) {
                    const amount = baseAmount * workerFactor;
                    resources[res] = Math.max(0, (resources[res] || 0) - amount);
                }
            }
			
        for (const [res, baseAmount] of Object.entries(bType.production)) {
          const amount = baseAmount * workerFactor;
          
          if (res === 'waffen') {
            resources.waffen = (resources.waffen || 0) + amount;
          } else {
            resources[res] = (resources[res] || 0) + amount;
          }
          
          productionEvents.push(`${bType.name} produziert ${amount} ${res}`);
        }
      }
    });
    if (productionEvents.length > 0) {
        logEvent(productionEvents.join(', '));
        statRender();
    }
	 // --- HIER die Begrenzung einfügen ---
    const limit = calculateResourceLimit();
    resources.holz   = Math.min(resources.holz, limit);
    resources.stein  = Math.min(resources.stein, limit);
    resources.wasser = Math.min(resources.wasser, limit);
    resources.waffen = Math.min(resources.waffen, limit);
	resources.essen = Math.min(resources.essen, limit);
	resources.wolle = Math.min(resources.wolle, limit);
    resources.garn = Math.min(resources.garn, limit);
    resources.stoff = Math.min(resources.stoff, limit);
	 resources.medis = Math.min(resources.medis, limit);
    resources.kleidung = Math.min(resources.kleidung, limit);
  }

  buildBtn.addEventListener('click', () => {
    if (activeBuilds.length >= getMaxActiveBuilds()) {
        alert(`Es sind bereits ${activeBuilds.length} Bauprojekte aktiv. Warte, bis eines fertig ist!`);
        return;
    }

    buildMenu.style.display = 'block';
    buildSelect.innerHTML = '';
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '--- Gebäude auswählen ---';
    buildSelect.appendChild(defaultOption);
const isMilitaryVisible  = window.skillTree?.militaryUnlocked;
const isDefenseVisible   = window.skillTree?.defenseUnlocked;
const isMonumentVisible  = window.skillTree?.monumentUnlocked;
    for (const category in buildingCategories) {
		if (category === 'Militär'      && !isMilitaryVisible)  continue;
  if (category === 'Verteidigung' && !isDefenseVisible)   continue;
  if (category === 'Sondergebäude'&& !isMonumentVisible)  continue;
        const optgroup = document.createElement('optgroup');
        optgroup.label = category;

        buildingCategories[category].forEach(key => {
            const b = buildingTypes[key];
            const costMsg = Object.entries(b.costs).map(([res, cost]) => `${cost} ${res}`).join(' & ');
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${b.name} (Kosten: ${costMsg}, Bauzeit: ${b.buildTime} T)`;
            
            let canBuild = true;
            let reason = '';

           for (const [res, cost] of Object.entries(b.costs)) {
    if (res === 'money') {
        if (window.money < cost) {
            canBuild = false;
            reason = 'Nicht genug Geld';
            break;
        }
    } else {
        if (resources[res] < cost) {
            canBuild = false;
            reason = `Nicht genug ${res}`;
            break;
        }
    }
}

            if (canBuild && b.prerequisite) {
                const hasPrerequisite = buildings.some(built => built.type === b.prerequisite);
                if (!hasPrerequisite) {
                    canBuild = false;
                    reason = `Benötigt: ${buildingTypes[b.prerequisite].name}`;
                }
            }

            if (!canBuild) {
                option.disabled = true;
                option.style.color = 'gray';
                option.textContent += ` [X ${reason}]`;
            }
            
            optgroup.appendChild(option);
        });
        buildSelect.appendChild(optgroup);
    }

    buildSelect.value = '';
  });

  confirmBuildBtn.addEventListener('click', () => {
    const key = buildSelect.value;
    if (!key) return; 
    const building = buildingTypes[key];
// NEU: Gebäudelimit aus Skill
    if (buildings.length >= getMaxBuildings()) {
        alert("Du hast das maximale Gebäudelimit erreicht! Kaufe neue Gebiete im Skill-Baum.");
        return;
    }
    if (activeBuilds.length >= getMaxActiveBuilds()) {
        alert(`Es sind bereits ${activeBuilds.length} Bauprojekte aktiv. Warte, bis eines fertig ist!`);
        return;
    }

    let canBuild = true;
    for (const [res, cost] of Object.entries(building.costs)) {
        if (resources[res] < cost) {
            alert(`Nicht genug ${res} (${cost} benötigt)!`);
            canBuild = false;
            break;
        }
    }
    if (canBuild && building.prerequisite) {
        const hasPrerequisite = buildings.some(built => built.type === building.prerequisite);
        if (!hasPrerequisite) {
            alert(`Du musst zuerst ${buildingTypes[building.prerequisite].name} bauen!`);
            canBuild = false;
        }
    }
    if (!canBuild) return;
    
    for (const [res, cost] of Object.entries(building.costs)) {
        resources[res] -= cost;
    }
// Nach Ressourcenabzug ergänzen (confirmBuildBtn Event)
if (building.costs.money && window.money < building.costs.money) {
    alert("Nicht genug Geld! Benötigt: " + building.costs.money);
    return; // Bau abbrechen, falls zu wenig Geld
}
if (building.costs.money) {
    window.money -= building.costs.money;
}
    activeBuilds.push({
        buildingId: `b_${nextBuildingId++}`,
        buildingType: key,
        startDay: stats.tag,
        duration: building.buildTime,
    });

    logEvent(`Bau von ${building.name} gestartet (Dauer: ${building.buildTime} Tage).`);
    statRender();
    buildMenu.style.display = 'none';
    updateActionStatusDisplay();
	updateBuildButtonStatus(); 
  });

  cancelBuildBtn.addEventListener('click', () => {
    buildMenu.style.display = 'none';
  });

  exploreBtn.addEventListener('click', () => {
    exploreMenu.style.display = 'block';
    
    const currentType = exploreType.value;
    let availableCitizens;
    let minNeeded = 2;

    if (currentType === 'exploration') {
        availableCitizens = citizens.filter(c => !c.tot && !c.workBuildingId && !c.training.isTraining && c.job !== 'Soldat');
    } else {
        const hasBarracks = buildings.some(b => b.type === 'kaserne');
        if (!hasBarracks) {
             alert("Plünderungen erfordern eine Kaserne und ausgebildete Soldaten!");
             exploreType.value = 'exploration';
             availableCitizens = citizens.filter(c => !c.tot && !c.workBuildingId && !c.training.isTraining && c.job !== 'Soldat');
        } else {
             availableCitizens = citizens.filter(c => !c.tot && !c.workBuildingId && c.job === 'Soldat');
        }
    }

    exploreCount.max = availableCitizens.length >= minNeeded ? availableCitizens.length : 0;
    exploreCount.min = availableCitizens.length >= minNeeded ? minNeeded : 0;
    exploreCount.value = Math.min(minNeeded, availableCitizens.length);
  });
  
  exploreType.addEventListener('change', () => {
      const currentType = exploreType.value;
      let availableCitizens;
      let minNeeded = 2;

      if (currentType === 'exploration') {
          availableCitizens = citizens.filter(c => !c.tot && !c.workBuildingId && !c.training.isTraining && c.job !== 'Soldat').length;
      } else {
          const hasBarracks = buildings.some(b => b.type === 'kaserne');
          if (!hasBarracks) {
              alert("Plünderungen erfordern eine Kaserne und ausgebildete Soldaten!");
              exploreType.value = 'exploration';
              availableCitizens = citizens.filter(c => !c.tot && !c.workBuildingId && !c.training.isTraining && c.job !== 'Soldat').length;
          } else {
              availableCitizens = citizens.filter(c => !c.tot && !c.workBuildingId && c.job === 'Soldat').length;
          }
      }
      
      exploreCount.max = availableCitizens >= minNeeded ? availableCitizens : 0;
      exploreCount.min = availableCitizens >= minNeeded ? minNeeded : 0;
      exploreCount.value = Math.min(minNeeded, availableCitizens);
  });

  confirmExploreBtn.addEventListener('click', () => {
    const n = parseInt(exploreCount.value);
    const duration = parseInt(exploreDuration.value);
    const type = exploreType.value;

    let availableCitizens;
    
    if (type === 'exploration') {
        availableCitizens = citizens.filter(c => !c.tot && !c.workBuildingId && !c.training.isTraining && c.job !== 'Soldat');
    } else {
        availableCitizens = citizens.filter(c => !c.tot && !c.workBuildingId && c.job === 'Soldat');
    }

    if (isNaN(n) || n < 2 || n > availableCitizens.length) {
      alert(`Ungültige Anzahl. Mindestens 2 (verfügbar: ${availableCitizens.length} für ${type}).`);
      return;
    }
    if (isNaN(duration) || duration < 1 || duration > 5) {
      alert('Ungültige Dauer. Wähle 1 bis 5 Tage.');
      return;
    }

    const assignedCitizens = availableCitizens.slice(0, n);
    
    assignedCitizens.forEach(c => {
        c.workBuildingId = type;
    });

    activeExplorations.push({
      id: `exp_${nextExplorationId++}`,
      citizens: assignedCitizens.map(c => c.id),
      startDay: stats.tag,
      duration: duration,
      returnDay: stats.tag + duration,
      type: type
    });
    
    const names = assignedCitizens.map(c => c.name).join(', ');
    const typeDisplay = type === 'raid' ? 'Plünderung' : 'Erkundung';
    logEvent(`${n} Bewohner (${names}) zur ${typeDisplay} geschickt (Dauer: ${duration} Tage).`);

    exploreMenu.style.display = 'none';
    settlementRender();
    updateActionStatusDisplay();
    updateHousingStatus(); 
  });

  cancelExploreBtn.addEventListener('click', () => {
    exploreMenu.style.display = 'none';
  });

  marketBtn.addEventListener('click', () => {
    if (buildings.some(b => b.type === 'marktplatz')) {
      updateMarketDisplay();
      document.getElementById('marketMenu').style.display = 'block';
    } else {
      alert('Baue zuerst einen Marktplatz!');
      logEvent('Marktplatz nicht gebaut. Handel gesperrt.');
    }
  });
bankBtn.addEventListener('click', () => {
  if (buildings.some(b => b.type === 'bank')) {
    if (typeof window.openBank === 'function') {
      window.openBank();
    } else {
      alert("Bank-Modul nicht geladen.");
    }
  } else {
    alert('Baue zuerst eine Bank!');
    logEvent('Bank nicht gebaut. Bank-Funktionen gesperrt.');
  }
});

function applyClothingBonus() {
    if (!resources.kleidung || resources.kleidung < 1) return;
    
    const citizensNeedingClothes = citizens.filter(c => 
        !c.tot && 
        c.workBuildingId !== 'exploration' && 
        c.workBuildingId !== 'raid'
    );
    
    let clothedCount = 0;
    
    citizensNeedingClothes.forEach(c => {
        if (resources.kleidung > 0) {
            // +5 Laune pro Bürger mit Kleidung
           if (c.mood < 100) { c.mood = Math.min(100, c.mood + 5); }
            resources.kleidung--;
            clothedCount++;
        }
    });
    
    if (clothedCount > 0) {
        logEvent(`🧥 ${clothedCount} Bürger erhielten neue Kleidung (+5 Laune)`);
    }
}
  function updateMarketDisplay() {
    const marketList = document.getElementById('marketList');
    const marketBuyList = document.getElementById('marketBuyList');
    marketList.innerHTML = '';
    marketBuyList.innerHTML = '';

    for (const [res, qty] of Object.entries(resources)) {
      if (qty > 0 && res !== 'window.money') {
        const price = marketInventory[res] ? marketInventory[res].price / 2 : 1;
        const div = document.createElement('div');
        div.textContent = `${res}: ${qty} | VK-Preis: ${price} Zombify`;
        const btn = document.createElement('button');
        btn.textContent = 'Verkaufen';
        btn.onclick = () => sellResource(res, 1, price);
        div.appendChild(btn);
        marketList.appendChild(div);
      }
    }

    for (const [res, data] of Object.entries(marketInventory)) {
      if (data.amount > 0) {
        const div = document.createElement('div');
        div.textContent = `${res}: ${data.amount} | Kauf-Preis: ${data.price} Zombify`;
        const btn = document.createElement('button');
        btn.textContent = 'Kaufen';
        btn.onclick = () => buyResource(res, 1, data.price);
        div.appendChild(btn);
        marketBuyList.appendChild(div);
      }
    }
  }

  function isMarketBuilt() {
    return buildings.some(b => b.type === 'marktplatz'); 
  }
function isBankBuilt() {
    return buildings.some(b => b.type === 'bank'); 
}
  function updateMarketButtonStatus() {
    const marketBuilt = isMarketBuilt();
    const marketBtn = document.getElementById('marketBtn'); 

    if (!marketBtn) return;

    if (marketBuilt) {
        marketBtn.disabled = false;
        marketBtn.textContent = 'Marktplatz';
        marketBtn.classList.remove('market-unavailable');
    } else {
        marketBtn.disabled = true;
        marketBtn.textContent = 'Markt muss erst gebaut werden';
        marketBtn.classList.add('market-unavailable');
    }
  }
function updateBankButtonStatus() {
    const bankBuilt = isBankBuilt();
    const bankBtn = document.getElementById('bankBtn'); 

    if (!bankBtn) return;

    if (bankBuilt) {
        bankBtn.disabled = false;
        bankBtn.textContent = 'Bank';
        bankBtn.classList.remove('market-unavailable');
        bankBtn.classList.remove('hud-disabled');  // <---- WICHTIG!!!
    } else {
        bankBtn.disabled = true;
        bankBtn.textContent = 'Bank (bauen!)';
        bankBtn.classList.add('market-unavailable');
        bankBtn.classList.add('hud-disabled');     // <---- WICHTIG!!!
    }
}


  // Einstellungen
  const colorSelect = document.getElementById("colorSelect");
  const fontSizeSelect = document.getElementById("fontSizeSelect");
  const presetDefault = document.getElementById("presetDefault");
  const presetHighContrast = document.getElementById("presetHighContrast");
  const restartGame = document.getElementById("restartGame");

  colorSelect.addEventListener("change", () => {
    const color = colorSelect.value;
    switch (color) {
      case "green":
        document.body.style.color = "#33ff33";
        document.getElementById("monitor").style.backgroundColor = "#001100";
        break;
      case "amber":
        document.body.style.color = "#ffbf00";
        document.getElementById("monitor").style.backgroundColor = "#2e1f00";
        break;
      case "red":
        document.body.style.color = "#ff3333";
        document.getElementById("monitor").style.backgroundColor = "#2e0000";
        break;
    }
  });

  fontSizeSelect.addEventListener("change", () => {
    let fontSize;
    switch (fontSizeSelect.value) {
      case "small":
        fontSize = "12px";
        break;
      case "medium":
        fontSize = "16px";
        break;
      case "large":
        fontSize = "20px";
        break;
    }
    document.getElementById("monitor").style.fontSize = fontSize;
  });

  presetDefault.addEventListener("click", () => {
    colorSelect.value = "green";
    fontSizeSelect.value = "medium";
    colorSelect.dispatchEvent(new Event("change"));
    fontSizeSelect.dispatchEvent(new Event("change"));
  });

  presetHighContrast.addEventListener("click", () => {
    colorSelect.value = "red";
    fontSizeSelect.value = "large";
    colorSelect.dispatchEvent(new Event("change"));
    fontSizeSelect.dispatchEvent(new Event("change"));
  });

  restartGame.classList.add("dangerButton");
  restartGame.innerText = "Dorf zerstören";

 restartGame.addEventListener("click", () => {
    if(confirm("Willst du wirklich das Dorf zerstören? Das Spiel wird neu gestartet!")) {
		// NEU: Abzeichen zurücksetzen, bevor die Seite neu geladen wird
   
	 if (window.resetAchievements) {
          window.resetAchievements(); 
      }
	  if (window.updateLiveMonitorButtonStatus) window.updateLiveMonitorButtonStatus();

      location.reload();
    }
});

  function calculateDefenseValue() {
    let defense = 0;

 buildings.forEach(b => {
        // HIER IST DIE KORREKTUR: Holen Sie den Wert aus der Definition
        const typeDefinition = buildingTypes[b.type]; 
        if (typeDefinition && typeDefinition.defense) {
            defense += typeDefinition.defense; 
        }
    });

    const soldierDefensePerUnit = 15;
    const soldiers = citizens.filter(c => c.job === 'Soldat' && !c.tot).length;
    defense += soldiers * soldierDefensePerUnit;
    
    const guardDefensePerUnit = 5;
    const guards = citizens.filter(c => c.job === 'Wache' && !c.tot).length;
    defense += guards * guardDefensePerUnit;

    return defense;
  }
window.calculateDefenseValue = calculateDefenseValue;
  function sellResource(res, qty, price) {
    if (resources[res] >= qty) {
      resources[res] -= qty;
      window.money += price * qty;
      marketInventory[res] = marketInventory[res] || { amount: 0, price: price };
      marketInventory[res].amount += qty;
      logEvent(`Verkauft: ${qty} ${res} für ${price * qty} Zombify.`);
      statRender();
      updateMarketDisplay();
    } else {
      logEvent(`FEHLER: Nicht genügend ${res} zum Verkauf.`);
    }
  }

  function buyResource(res, qty, price) {
    if (window.money >= price * qty && marketInventory[res].amount >= qty) {
      window.money -= price * qty;
      resources[res] = (resources[res] || 0) + qty;
      marketInventory[res].amount -= qty;
	     // --- HIER Kapazitätsbegrenzung ---
      const limit = calculateResourceLimit();
      resources.holz   = Math.min(resources.holz, limit);
      resources.stein  = Math.min(resources.stein, limit);
      resources.wasser = Math.min(resources.wasser, limit);
      resources.waffen = Math.min(resources.waffen, limit);
      logEvent(`Gekauft: ${qty} ${res} für ${price * qty} Zombify.`);
      statRender();
      updateMarketDisplay();
    } else {
      logEvent('FEHLER: Nicht genügend Zombify oder kein Angebot!');
    }
  }

 function showEventDialog(msg, yesLabel = 'Ja', noLabel = 'Nein') {
     return new Promise((resolve) => {
         eventModalMsg.innerHTML = msg;
        eventModal.style.display = 'flex';
        
        // NEU: Fügt die 'active'-Klasse hinzu, um das Slide-In zu starten
        eventModal.style.display = 'block'; // Muss sichtbar sein, um die Klasse zu toggeln
        eventModal.classList.add('active');
        
         eventYesBtn.textContent = yesLabel;
         eventNoBtn.textContent = noLabel;
         eventYesBtn.onclick = null;
         eventNoBtn.onclick = null;
        
        const hideNotification = () => {
            eventModal.classList.remove('active');
           // Füge ein Delay hinzu, um die Slide-Out Animation abzuwarten (0.6s > 0.5s Transition)
           setTimeout(() => eventModal.style.display = 'none', 600);
       };
 
         eventYesBtn.onclick = () => {
          eventModal.style.display = 'none';
            hideNotification();
             resolve(true);
         };
         eventNoBtn.onclick = () => {
            eventModal.style.display = 'none';
           hideNotification();
             resolve(false);
         };
     });
 }

  function randomName() {
    return names[Math.floor(Math.random() * names.length)];
  }

  function randomJob() { 
    const baseJobs = ['Aspirant', 'Inspektor', 'Vorsteher', 'Suboffizier', 'Wache', 'Kommissar'];
    return baseJobs[Math.floor(Math.random() * baseJobs.length)];
  }

  function randomPersonality() {
    return ['hilfsbereit', 'egoistisch', 'mutig', 'ängstlich'][Math.floor(Math.random() * 4)];
  }

  function runLoading(callback) {
    const lines = [
      'Prozess startet...',
      'Lade Ressourcen...',
      'Initialisiere Bürger...',
      'Erstelle Gebäude...',
      'Simulationsprozess startet...',
      'Willkommen in der Siedlung!'
    ];
    let index = 0;
    const loadingArea = document.getElementById('loadingArea');
    loadingArea.textContent = '';

    const interval = setInterval(() => {
      if (index < lines.length) {
        loadingArea.textContent += lines[index] + '\n';
        loadingArea.scrollTop = loadingArea.scrollHeight;
        index++;
      } else {
        clearInterval(interval);
        if (callback) callback();
      }
    }, 600);
  }

function addCitizen(isBorn = false) {
    // HIER wird das Alter jetzt bedingt gesetzt:
    const citizenAge = isBorn ? 0 : Math.floor(Math.random() * 25) + 18; 
    
    // HIER wird der Job gesetzt (Neugeborene sind Kinder)
    const citizenJob = isBorn ? 'Kind' : randomJob();
    
    const newCitizen = {
      id: `c_${nextCitizenId++}`,
      name: randomName(),
      alter: citizenAge,
      job: citizenJob,
      pers: randomPersonality(),
      leben: 100,
      hunger: 0,
      thirst: 0,
      krank: Math.random() < 0.2,
      tot: false,
      houseId: null,
      workBuildingId: null,
      mood: 50,
      desertionRisk: 0,
      training: { isTraining: false, startDay: 0, buildingId: null },
      
      // NEU: Hinzufügen der Eigenschaft für alle zufällig generierten Bürger
      undying: false, 
      isPlayer: false, // Füge dies optional hinzu, falls du es verwendest
    };
    
    citizens.push(newCitizen);
window.citizens = citizens; 
// NEU: Nur loggen und stats erhöhen, wenn es eine Geburt ist
    if (isBorn) {
        // Angenommen, du hast eine `stats` Variable und eine `logEvent` Funktion
        stats.geborene = (stats.geborene || 0) + 1; 
        logEvent(`Jubel: ${newCitizen.name} wurde geboren!`);
    }
    
    autoAssignWork(newCitizen.id);
    autoAssignHousing(newCitizen.id);
    
    settlementRender();
}

// 1. IN DER triggerRandomEvent() FUNKTION (ca. Zeile 2850)
// ERSETZE DIE KOMPLETTE FUNKTION MIT:

async function triggerRandomEvent() {
  const eventChance = Math.random();
  
  if (eventChance < 0.4) {
    // === FLÜCHTLINGE EVENT ===
    const newResidentsCount = Math.floor(Math.random() * 5) + 1;
    
    // RADIO-INTEGRATION: Callback für Antwort
    const eventData = {
      count: newResidentsCount,
      callback: function(allow) {
        if (allow) {
          for (let i = 0; i < newResidentsCount; i++) addCitizen();
          logEvent(`${newResidentsCount} neue Bewohner wurden aufgenommen.`);
          statRender();
          settlementRender();
        } else {
          logEvent("Neue Bewohner wurden abgewiesen.");
        }
      }
    };
    
    // Sende Event ans Funkgerät
    if (window.radioInterceptEvent) {
      window.radioInterceptEvent('refugees', eventData);
    }
    
  } else {
    // === ANGRIFFS EVENT ===
    const totalDefense = calculateDefenseValue();
    const baseAttackStrength = 100;
    const randomizedAttack = baseAttackStrength + Math.floor(Math.random() * 50) - 25;
    
    // RADIO-INTEGRATION: Callback für Antwort
    const eventData = {
      strength: randomizedAttack,
      defense: totalDefense,
      callback: function(defend) {
        logEvent(`Überfall! Angriffsstärke: ${randomizedAttack} vs Verteidigung: ${totalDefense}`);
        
        if (defend) {
          if (randomizedAttack > totalDefense) {
            const stolenWood = Math.min(resources.holz, Math.floor(Math.random() * 10) + 5);
            const stolenFood = Math.min(resources.essen, Math.floor(Math.random() * 6) + 2);
            resources.holz -= stolenWood;
            resources.essen -= stolenFood;

            const lostWeapons = Math.min(resources.waffen, Math.floor(Math.random() * 3));
            resources.waffen -= lostWeapons;

            const defenseUnits = citizens.filter(c => !c.tot && (c.job === 'Wache' || c.job === 'Soldat') && c.workBuildingId !== 'exploration' && c.workBuildingId !== 'raid');
            
            let fatalities = Math.floor((randomizedAttack - totalDefense) / 5) + 1;
            let deadNames = [];

            for (let i = 0; i < fatalities; i++) {
              let victim;
              if (defenseUnits.length > 0) {
                const randomIndex = Math.floor(Math.random() * defenseUnits.length);
                victim = defenseUnits.splice(randomIndex, 1)[0];
              } else {
                break;
              }
              if (victim) {
                victim.tot = true;
                stats.gestorben++;
                deadNames.push(victim.name);
                assignCitizenToHouse(victim.id, null);
                assignCitizenToWork(victim.id, null);
              }
            }
            
            const deathMsg = deadNames.length > 0 ? ` Tote: ${deadNames.join(', ')}.` : '';
            logEvent(`[NIEDERLAGE] Die Siedlung unterlag! Holz: -${stolenWood}, Essen: -${stolenFood}. ${deathMsg}`);
          } else {
            logEvent(`[ERFOLG] Die Verteidigung hielt stand!`);
          }
        } else {
          logEvent("Die Siedlung hat sich versteckt und den Angriff ignoriert.");
        }
        
        const limit = calculateResourceLimit();
        resources.holz = Math.min(resources.holz, limit);
        resources.stein = Math.min(resources.stein, limit);
        resources.wasser = Math.min(resources.wasser, limit);
        resources.waffen = Math.min(resources.waffen, limit);
        
        citizens = citizens.filter(c => !c.tot);
        window.citizens = citizens;
        statRender();
        settlementRender();
      }
    };
    
    // Sende Event ans Funkgerät
    if (window.radioInterceptEvent) {
      window.radioInterceptEvent('attack', eventData);
    }
  }
}
// === NEUE INTERNE EREIGNISSE (KORRIGIERTE VERSION FÜR RADIO.JS) ===
async function triggerInternalEvent() {
  const eventTypes = ['fire', 'theft', 'zombie'];
  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  
  if (eventType === 'fire') {
      const vulnerableBuildings = buildings.filter(b => b.type !== 'wall' && b.health > 0);
      if (vulnerableBuildings.length === 0) return;
      
      const targetBuilding = vulnerableBuildings[Math.floor(Math.random() * vulnerableBuildings.length)];
      
      targetBuilding.health = 0;
      targetBuilding.status = 'closed';
      
      [...targetBuilding.residents, ...targetBuilding.workers].forEach(cId => {
          assignCitizenToHouse(cId, null);
          assignCitizenToWork(cId, null);
      });
      targetBuilding.residents = [];
      targetBuilding.workers = [];
      
      logEvent(`🔥 FEUER! ${targetBuilding.name} ist niedergebrannt und vollständig zerstört!`);
      
      // 🔥 KORRIGIERT: Verwende 'fire' als Type statt 'internal'
      if (window.radioInterceptEvent) {
          window.radioInterceptEvent('fire', {
              message: `BRAND: ${targetBuilding.name} wurde durch ein Feuer zerstört!`
          });
      }
      
      renderBuildingList();
      
  } else if (eventType === 'theft') {
      const stolenResources = {};
      const resourceTypes = ['holz', 'stein', 'essen', 'wasser', 'medis', 'waffen'];
      const numStolen = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numStolen; i++) {
          const res = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
          if (resources[res] > 0) {
              const amount = Math.min(resources[res], Math.floor(Math.random() * 20) + 10);
              resources[res] -= amount;
              stolenResources[res] = amount;
          }
      }
      
      const stolenMsg = Object.entries(stolenResources)
          .map(([res, amt]) => `${amt} ${res}`)
          .join(', ');
      
      logEvent(`🦹 DIEBSTAHL! Unbekannte haben uns bestohlen: ${stolenMsg}`);
      
      // 🔥 KORRIGIERT: Verwende 'theft' als Type statt 'internal'
      if (window.radioInterceptEvent) {
          window.radioInterceptEvent('theft', {
              message: `EINBRUCH: Diebe haben uns bestohlen! Verluste: ${stolenMsg}`
          });
      }
      
      statRender();
      
  } else if (eventType === 'zombie') {
      const vulnerableCitizens = citizens.filter(c => 
          !c.tot && 
          !c.undying && 
          c.workBuildingId !== 'exploration' && 
          c.workBuildingId !== 'raid'
      );
      
      if (vulnerableCitizens.length === 0) return;
      
      const zombie = vulnerableCitizens[Math.floor(Math.random() * vulnerableCitizens.length)];
      
      const casualties = [];
      const numVictims = Math.min(
          Math.floor(Math.random() * 3) + 1,
          vulnerableCitizens.length - 1
      );
      
      for (let i = 0; i < numVictims; i++) {
          const availableVictims = vulnerableCitizens.filter(c => 
              !c.tot && 
              c.id !== zombie.id && 
              !casualties.includes(c.id)
          );
          
          if (availableVictims.length === 0) break;
          
          const victim = availableVictims[Math.floor(Math.random() * availableVictims.length)];
          victim.tot = true;
          stats.gestorben++;
          casualties.push(victim.id);
          
          assignCitizenToHouse(victim.id, null);
          assignCitizenToWork(victim.id, null);
      }
      
      zombie.tot = true;
      stats.gestorben++;
      assignCitizenToHouse(zombie.id, null);
      assignCitizenToWork(zombie.id, null);
      
      const victimNames = casualties
          .map(id => citizens.find(c => c.id === id)?.name)
          .filter(Boolean);
      
      const deathMsg = victimNames.length > 0 
          ? ` Opfer: ${victimNames.join(', ')}`
          : '';
      
      logEvent(`🧟 ZOMBIE-ANGRIFF! ${zombie.name} hat sich verwandelt und ${casualties.length} Bürger getötet!${deathMsg}`);
      
      // 🔥 KORRIGIERT: Verwende 'zombie' als Type statt 'internal'
      if (window.radioInterceptEvent) {
          window.radioInterceptEvent('zombie', {
              message: `INFEKTION: ${zombie.name} wurde zum Zombie! ${casualties.length} Tote.${deathMsg}`
          });
      }
      
      citizens = citizens.filter(c => !c.tot);
      window.citizens = citizens;
      
      settlementRender();
      statRender();
  }
}
  function checkActionCompletion() {
    activeBuilds = activeBuilds.filter(activeBuild => {
        if (stats.tag >= activeBuild.startDay + activeBuild.duration) {
            const bType = buildingTypes[activeBuild.buildingType];
            const maxHealthValue = bType.maxHealth || 100;
            
            buildings.push({
                id: activeBuild.buildingId,
                type: activeBuild.buildingType,
                name: bType.name,
                residents: [],
                workers: [],
                health: maxHealthValue,
                maxHealth: maxHealthValue,
                status: 'open'
            });
			window.buildings = buildings;
            logEvent(`${bType.name} fertiggestellt!`);
            autoAssignWork();
            autoAssignHousing();
            return false;
        }
        return true;
    });
  updateBuildButtonStatus(); // <--- Hier der Aufruf!
    citizens.forEach(c => {
        if (c.training.isTraining && stats.tag >= c.training.startDay + 10) {
            c.job = 'Soldat';
            c.training = { isTraining: false, startDay: 0, buildingId: null };

            const barracks = buildings.find(b => b.id === c.workBuildingId);
            if (barracks) {
                barracks.workers = barracks.workers.filter(id => id !== c.id);
            }
            c.workBuildingId = null; 

            logEvent(`${c.name} hat die Ausbildung abgeschlossen und ist jetzt Soldat!`);
            autoAssignWork(c.id);
            settlementRender();
        }
    });

    activeExplorations = activeExplorations.filter(exp => {
      if (stats.tag >= exp.returnDay) {
        let foundResources = {};
        let casualties = 0;
        
        const riskFactor = exp.type === 'raid' ? 0.35 : 0.1;

        exp.citizens.forEach(cId => {
          const citizen = citizens.find(c => c.id === cId);
          if (citizen) {
            if (Math.random() < riskFactor * exp.duration / 5) {
                citizen.tot = true;
				if (citizen.workBuildingId) {
                    // Idealerweise hier auch eine Funktion aufrufen, die ihn aus dem 
                    // 'workers'-Array des Gebäudes entfernt (z.B. unassignCitizenFromWork(citizen.id);)
                    // Da wir die Funktion nicht sehen, setzen wir nur das Feld auf null:
                    citizen.workBuildingId = null; 
                }
                citizen.job = "Tot";
				stats.gestorben++;
                casualties++;
                logEvent(`${citizen.name} ist während des ${exp.type}s gestorben.`);
            } else {
                citizen.workBuildingId = null;
                
                const resourcesFound = exp.type === 'raid' ? ['holz', 'stein', 'essen', 'waffen', 'window.money'] : ['holz', 'stein', 'essen', 'wasser', 'medis'];
                const foundRes = resourcesFound[Math.floor(Math.random() * resourcesFound.length)];
                
                let amount;
                let logRes = foundRes;

                if (foundRes === 'window.money') {
                    amount = Math.floor(Math.random() * 10 * exp.duration * exp.citizens.length) + 1;
                    window.money += amount;
                    logRes = 'Zombify';
                } else if (foundRes === 'waffen') {
                    amount = Math.floor(Math.random() * 2 * exp.duration) + 1;
                    resources.waffen = (resources.waffen || 0) + amount;
                } else {
                    amount = Math.floor(Math.random() * 5 * exp.duration * exp.citizens.length) + 1;
                    resources[foundRes] = (resources[foundRes] || 0) + amount;
                }
                foundResources[logRes] = (foundResources[logRes] || 0) + amount;
            }
          }
        });

        const typeDisplay = exp.type === 'raid' ? 'Plünderungsgruppe' : 'Erkundungsgruppe';
        const foundMsg = Object.entries(foundResources).map(([res, amt]) => `${amt} ${res}`).join(', ');
        
        if (casualties > 0) {
            logEvent(`${typeDisplay} (${exp.id}) ist mit ${casualties} Verlust(en) zurückgekehrt und hat ${foundMsg || 'nichts'} gefunden.`);
        } else {
            logEvent(`${typeDisplay} (${exp.id}) ist sicher zurückgekehrt und hat ${foundMsg || 'nichts'} gefunden.`);
        }
        
        citizens = citizens.filter(c => !c.tot);
window.citizens = citizens;
        autoAssignWork();
        autoAssignHousing();

        settlementRender();
        return false;
      }
      return true;
    });
  }
function updateCapacityDisplays() {
    // Placeholder - fügt später Funktionalität hinzu
}

function updateDefenseDisplay(defenseValue) {
    const defenseElement = document.getElementById('statDefense');
    if (defenseElement) {
        defenseElement.innerText = `Verteidigung: ${defenseValue}`;
    }
}




function startGameLoop() {
    // 1. FIX: Alten Game Loop stoppen, falls er läuft
    if (gameLoopIntervalId) {
        clearInterval(gameLoopIntervalId);
        // Optional: window.logEvent?.('Alter Game-Loop gestoppt.');
    }
    
    // 2. FIX: Neuen Game Loop starten und die ID speichern (damit er beim nächsten Mal gestoppt werden kann)
    gameLoopIntervalId = setInterval(async () => { 
        // Event-Modal blockiert den Game Loop nicht mehr
        
        eventActive = false; 
        
        // *** NEUE KALENDER-LOGIK HIER EINFÜGEN ***
        window.stats.tag++;
        handleDailyCalendarUpdate(); // 🔥 NEU: Aktualisiert den Kalender-Zyklus
// 🔥 NEU: HIER MUSS DER AUFRUF ZUR BEREINIGUNG HIN
    if (window.cleanupOldMessages) {
        window.cleanupOldMessages(); // Ruft die global definierte Funktion aus radio.js auf
    }
        if (window.updatePlayerRank) {
            window.updatePlayerRank(stats.tag);
        }
        if (window.updateMarketIfNeeded) {
            updateMarketIfNeeded();
        }
        if (window.dailyRadioUpdate) {
        window.dailyRadioUpdate(window.stats.tag);
    }
        // 1. Aktionen & Simulationen
        checkActionCompletion();
        simulatePopulation();
        simulateBuildingProduction();
        simulateBuildingDecay();
        simulateHousingFinance();
	if (window.radioGameLoop) {
  window.radioGameLoop();
}
        autoAssignHousing();
		if (stats.tag % 3 === 0) {
            applyClothingBonus();
        }
        if (Math.random() < 0.10) {
  await triggerInternalEvent();
}
        autoAssignHousing();
        const autoRepairThreshold = 0.5; // 50%, optional konfigurierbar!

        if (window.skillTree.autoRepairUnlocked) {
            buildings.forEach(b => {
                if (b.health / b.maxHealth < autoRepairThreshold) {
                    repairBuilding(b.id);
                }
            });
        }

        // 2. Daten berechnen
        const defenseValue = calculateDefenseValue();
        
        // 3. Status aktualisieren
        updateHousingStatus();
        updateActionStatusDisplay();
        updateCapacityDisplays();
        updateDefenseDisplay(defenseValue);

        // 4. Ereignisse (z. B. 40 % Chance)
        if (Math.random() < 0.4) {
            eventActive = true;
            triggerRandomEvent().finally(() => {});
        }

        // 5. UI rendern (WICHTIG: Hier wird der Kalender mit `statRender()` oder separat aktualisiert)
        statRender();
        settlementRender();
        renderBuildingList();
        
    }, 14000); // 7000 Millisekunden = 7 Sekunden pro Tag

    // Optional: Macht die ID auch über das window-Objekt zugänglich
    window.gameLoopIntervalId = gameLoopIntervalId; 
}
  // --- AUTO-ZUWEISUNGS FUNKTIONEN ---
window.triggerEnemyAttack = function(attackStrength) {
  const totalDefense = calculateDefenseValue();
  
  logEvent(`⚠️ Feindlicher Angriff! Stärke: ${attackStrength} vs Verteidigung: ${totalDefense}`);
  
  if (attackStrength > totalDefense) {
    // Verluste erleiden
    const stolenWood = Math.min(resources.holz, Math.floor(Math.random() * 15) + 10);
    const stolenFood = Math.min(resources.essen, Math.floor(Math.random() * 10) + 5);
    resources.holz -= stolenWood;
    resources.essen -= stolenFood;
    
    const lostWeapons = Math.min(resources.waffen, Math.floor(Math.random() * 5));
    resources.waffen -= lostWeapons;
    
    // Mögliche Tote
    const defenseUnits = citizens.filter(c => !c.tot && (c.job === 'Wache' || c.job === 'Soldat'));
    let fatalities = Math.floor((attackStrength - totalDefense) / 10);
    
    for (let i = 0; i < fatalities && defenseUnits.length > 0; i++) {
      const victim = defenseUnits.splice(Math.floor(Math.random() * defenseUnits.length), 1)[0];
      if (victim) {
        victim.tot = true;
        stats.gestorben++;
        logEvent(`💀 ${victim.name} fiel im Kampf gegen die Angreifer.`);
      }
    }
    
    logEvent(`[NIEDERLAGE] Verluste: ${stolenWood} Holz, ${stolenFood} Essen, ${lostWeapons} Waffen, ${fatalities} Tote.`);
  } else {
    logEvent(`[ABGEWEHRT] Die Verteidigung hielt stand!`);
  }
  
  citizens = citizens.filter(c => !c.tot);
  window.citizens = citizens;
  statRender();
  settlementRender();
};
  function autoAssignHousing(specificCitizenId = null) {
      let targetCitizens = [];
      if (specificCitizenId) {
          const c = citizens.find(c => c.id === specificCitizenId);
          if (c && !c.tot && !c.houseId && c.workBuildingId !== 'exploration' && c.workBuildingId !== 'raid') {
              targetCitizens.push(c);
          }
      } else {
          targetCitizens = citizens.filter(c => !c.tot && !c.houseId && c.workBuildingId !== 'exploration' && c.workBuildingId !== 'raid');
      }

      if (targetCitizens.length === 0) return;

      let housedCount = 0;
      
      for (const c of targetCitizens) {
          const availableHouses = buildings
              .filter(b => buildingTypes[b.type].isDwelling && b.residents.length < buildingTypes[b.type].capacity)
              .sort((a, b) => a.residents.length - b.residents.length); 

          if (availableHouses.length > 0) {
              const bestHouse = availableHouses[0];
              assignCitizenToHouse(c.id, bestHouse.id);
              housedCount++;
          } else {
              break;
          }
      }
      if (housedCount > 0 && !specificCitizenId) {
          logEvent(`Automatische Zuweisung: ${housedCount} obdachlose Bürger in Wohnungen verteilt.`);
      }
  }

  function autoAssignWork(specificCitizenId = null) {
      let availableCitizens = [];
      if (specificCitizenId) {
          const c = citizens.find(c => c.id === specificCitizenId);
          if (c && !c.tot && !c.workBuildingId && !c.training.isTraining) {
              availableCitizens.push(c);
          }
      } else {
          availableCitizens = citizens.filter(c => !c.tot && !c.workBuildingId && !c.training.isTraining);
      }
      
      if (availableCitizens.length === 0) return;

      let assignedWorkCount = 0;

      const availableWorkplaces = buildings
          .filter(b => buildingTypes[b.type].maxWorkers > b.workers.length && b.type !== 'kaserne')
          .sort((a, b) => a.type.localeCompare(b.type)); 

      if (availableWorkplaces.length === 0) return;
      
      const citizensToAssign = [...availableCitizens];

      for (const workplace of availableWorkplaces) {
          const citizenIndex = citizensToAssign.findIndex(c => !c.workBuildingId);
          
          const isSlotFree = workplace.workers.length < buildingTypes[workplace.type].maxWorkers;

          if (citizenIndex !== -1 && isSlotFree) {
              const citizen = citizensToAssign[citizenIndex];
              
              // Wichtig: assignCitizenToWork muss aufgerufen werden, um die building.workers zu aktualisieren
              assignCitizenToWork(citizen.id, workplace.id);
              assignedWorkCount++;
              
              // Bürger aus der Liste entfernen, damit er nicht doppelt zugewiesen wird
              citizensToAssign.splice(citizenIndex, 1);
          }
          // Wenn nur ein spezifischer Bürger zugewiesen werden sollte, breche ab, sobald er zugewiesen ist
          if (specificCitizenId && assignedWorkCount > 0) break;
      }
      
      if (assignedWorkCount > 0 && !specificCitizenId) {
          logEvent(`Automatische Zuweisung: ${assignedWorkCount} Bürger haben einen Job angenommen.`);
      }
  }


    // --- Monitor Toggle Button Logik ---
    const monitorToggleButton = document.getElementById('monitorToggleButton');
    const monitor = document.getElementById('monitor'); // Das Haupt-Monitor-Element

    // Initialen Zustand festlegen
    let isMonitorOn = true; 

    if (monitorToggleButton && monitor) {
        // Sicherstellen, dass die Übergangseigenschaften des Monitors am Anfang gesetzt sind
        monitor.style.transition = 'opacity 1s ease-out, transform 0.8s ease-out';
        monitor.style.pointerEvents = 'auto'; // Hinzufügen, um Klicks zu erlauben

        monitorToggleButton.addEventListener('click', () => {
            isMonitorOn = !isMonitorOn; // Zustand umschalten

            if (isMonitorOn) {
                // Monitor einschalten (Sichtbar machen, Klicks erlauben)
                monitor.style.opacity = '1';
                monitor.style.transform = 'scaleY(1)';
                monitor.style.pointerEvents = 'auto'; // Klicks wieder zulassen

                monitorToggleButton.classList.remove('off');
                monitorToggleButton.classList.add('on');
            } else {
                // Monitor ausschalten (Platz behalten, unsichtbar machen, Klicks blockieren)
                monitor.style.opacity = '0';
                monitor.style.transform = 'scaleY(0.1)'; // Schrumpfen
                monitor.style.pointerEvents = 'none'; // Klicks blockieren

                // ACHTUNG: display: none wurde ENTFERNT, damit der Platz erhalten bleibt

                monitorToggleButton.classList.remove('on');
                monitorToggleButton.classList.add('off');
            }
        });
    }

// Listener für das Zerstörungs-Modal
    const confirmBtn = document.getElementById('confirmDestroyBtn');
    const cancelBtn = document.getElementById('cancelDestroyBtn');

    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleDestroyConfirmation);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeDestroyConfirmation);
    }
	if (typeof initInfoModal === 'function') {
        initInfoModal();
    }

// -----------------------------------------------------------------------
// HIER WIRD DIE HELLIGKEITS-STEUERUNG EINGEFÜGT (NEU)
// -----------------------------------------------------------------------
  // game.js (Am Ende des DOMContentLoaded-Blocks, VOR der letzten '});')

    // --- Helligkeitssteuerung initialisieren (Mittelpunkt 1.0) ---
    // Wir verwenden die bereits existierende 'monitor' Variable.
    const monitorBrightnessSlider = document.getElementById('monitorBrightness');

    if (monitorBrightnessSlider && monitor) { 
        // Helligkeit aus localStorage laden, falls vorhanden (Standard 1.0)
        const savedBrightness = localStorage.getItem('monitorBrightness');
        
        let initialBrightness = 1.0; 
        
        if (savedBrightness !== null) {
            const parsedBrightness = parseFloat(savedBrightness);
            // Wir verwenden den gespeicherten Wert, falls er im neuen gültigen Bereich liegt
            if (!isNaN(parsedBrightness) && parsedBrightness >= 0.5 && parsedBrightness <= 1.5) {
                initialBrightness = parsedBrightness;
            }
        }
        
        // Initialen Wert setzen
        monitorBrightnessSlider.value = initialBrightness.toString();
        
        // Funktion zur Anwendung der Helligkeit (neue Logik)
        const applyBrightness = (value) => {
            let floatValue = parseFloat(value);
            
            // 1. DUNKELHEIT STEUERN (Werte < 1.0):
            // Wir nutzen den Wert direkt für den CSS brightness() Filter (z.B. 0.5 = 50% Helligkeit)
            monitor.style.filter = `brightness(${floatValue})`;
            
            // 2. HELLIGKEIT STEUERN (Werte > 1.0):
            // Da brightness() über 1.0 nicht viel bewirkt, nutzen wir einen Schatten- oder Glow-Effekt.
            // In diesem Beispiel erhöhen wir den Glow-Effekt des Monitors, um den "heller"-Eindruck zu verstärken.
            
            // Berechnung des Glow-Faktors: 1.0 = 20px Shadow, 1.5 = 40px Shadow
            let glowFactor = 20; 
            if (floatValue > 1.0) {
                // Skaliert von 20px bis max. 40px (bei 1.5)
                glowFactor = 20 + ((floatValue - 1.0) * 40); 
            }
            // Hinweis: Dies erfordert, dass Sie in style.css den box-shadow als Variable definieren oder diesen Wert dort direkt setzen.
            // Der einfachste Weg ist, eine eigene Variable für den Shadow-Wert zu nutzen, wir setzen hier den Wert direkt:
            
            // Dies ist ein schneller Fix, WICHTIG: Sie müssen Ihre style.css so anpassen, dass sie auf diese Variable reagiert!
            monitor.style.setProperty('--monitor-glow-size', `${glowFactor.toFixed(1)}px`);
        };
        
        // Helligkeit sofort anwenden
        applyBrightness(initialBrightness);

        // Event Listener für die Änderung des Schiebereglers
        monitorBrightnessSlider.addEventListener('input', (event) => {
            const brightness = event.target.value;
            applyBrightness(brightness);
            localStorage.setItem('monitorBrightness', brightness);
        });
    }
    // --- Ende Helligkeitssteuerung ---
	// game.js (Fügen Sie diese Logik am Ende der Datei ein, aber VOR dem schließenden }); des DOMContentLoaded-Listeners)

/* --------------------------------------
   Modul: Spielstände & Einstellungen
   -------------------------------------- */

/**
 * Gibt eine Liste aller gespeicherten Spielstände zurück.
 * @returns {Array<{key: string, data: Object}>}
 */
function getAllSavedGames() {
    const savedGames = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(SAVE_PREFIX)) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data && data.saveTime) { 
                    savedGames.push({ key: key, data: data });
                }
            } catch (e) {
                console.error("Fehler beim Parsen des Spielstands:", key, e);
            }
        }
    }
    savedGames.sort((a, b) => b.data.saveTime - a.data.saveTime); // Neueste zuerst
    return savedGames;
}
/**
 * Serialisiert den aktuellen Spielzustand.
 * WICHTIG: Erfasst zentrale Variablen wie Geld, Tag und Einwohnerzahl.
 */
function getCurrentGameState() {
    return {
        saveTime: new Date().getTime(), 
        inGameDay: stats ? stats.tag : 1, 
        
        // Kern-Zustände
        money: window.money || 0,
        resources: resources || {},
        stats: stats || { tag: 1, geborene: 0, gestorben: 0 },
        calendar: calendar || { dayOfWeek: 1, weekOfMonth: 1, month: 0, year: 0 },
         bankState: (typeof window.getBankState === 'function') ? window.getBankState() : null,
        radioState: window.radioState,
        radioSkills: window.radioSkills,
        playerName: localStorage.getItem('playerName') || document.getElementById('playerDisplayName')?.textContent || 'Unbekannt',
        settlementName: localStorage.getItem('settlementName') || 'Siedlung',
        buildingListState: buildingListState || { categoryOpen: {}, detailsOpen: {} }, 
        
        // Spiel-Objekte
        citizens: citizens || [],
        buildings: buildings || [],
        nextCitizenId: nextCitizenId || 1,
        nextBuildingId: nextBuildingId || 1,
        
        // Aktive Aktionen
        activeBuilds: activeBuilds || [],
        activeExplorations: activeExplorations || [],
        nextExplorationId: nextExplorationId || 1,
        settlementName: window.settlementName || '',
        // Modul-Zustände
        skillTree: window.skillTree || {},
        avatarData: window.getCurrentAvatarData ? window.getCurrentAvatarData() : (window.playerAvatar || null),
       // bankState: window.getBankState ? window.getBankState() : null,
        marketState: window.getMarketState ? window.getMarketState() : null,
        achievedState: window.getAchievedState ? window.getAchievedState() : null
    };
}
window.getCurrentGameState = getCurrentGameState;


/**
 * Speichert den aktuellen Spielstand.
 * @param {string} slotName - Name für den Speicher-Slot
 */
function saveGameState(slotName) {
	
    const state = getCurrentGameState();
    const key = SAVE_PREFIX + slotName;
    try {
        localStorage.setItem(key, JSON.stringify(state));
        window.logEvent(`Spielstand erfolgreich gespeichert als: ${slotName}`);
    } catch (e) {
        window.logEvent(`FEHLER: Spielstand konnte nicht gespeichert werden! ${e.message}`);
    }
}
/**
 * Lädt einen gespeicherten Spielstand und stellt den Zustand wieder her.
 * Diese Funktion muss ALLE globalen Variablen wiederherstellen und die UI aktualisieren.
 * @param {string} slotName - Name des Speicher-Slots
 */
function loadGameState(slotName) {
    const key = SAVE_PREFIX + slotName;
    const json = localStorage.getItem(key);

    if (!json) {
        return false;
    }
    
    if (window.gameLoopIntervalId) {
        clearInterval(window.gameLoopIntervalId);
        window.logEvent?.('Alter Spiel-Loop gestoppt.');
    }
    
    try {
        const data = JSON.parse(json);

        // === 1. ROHDATEN EINLADEN ===
        window.money = data.money || 0;
        window.resources = resources = data.resources || {}; 
        window.stats = stats = data.stats || { tag: 1 };
        window.calendar = calendar = data.calendar || {}; 

        window.citizens = citizens = data.citizens || [];
        window.buildings = buildings = data.buildings || [];

        window.activeBuilds = activeBuilds = data.activeBuilds || []; 
        window.activeExplorations = activeExplorations = data.activeExplorations || []; 
        
        window.nextCitizenId = nextCitizenId = data.nextCitizenId || 1; 
        window.nextBuildingId = nextBuildingId = data.nextBuildingId || 1; 
        window.nextExplorationId = nextExplorationId = data.nextExplorationId || 1; 
        window.settlementName = data.settlementName || "";
        if (data.bankState && typeof window.setBankState === 'function') {
            window.setBankState(data.bankState);
            window.logEvent?.("Bank-Aktivitäten geladen.");
        }
        
        window.skillTree = skillTree = data.skillTree || {};
        window.playerAvatar = playerAvatar = data.avatarData || null; 
        window.buildingListState = buildingListState = data.buildingListState || {};
    
        // === 2. PLAYER INFO ===
        if (data.playerName) {
            localStorage.setItem("playerName", data.playerName);
            const d = document.getElementById("playerDisplayName");
            if (d) d.textContent = data.playerName;
        }

        if (data.settlementName) {
            window.settlementName = data.settlementName;
            localStorage.setItem("settlementName", data.settlementName);
            const t = document.getElementById("gameTitle");
            if (t) {
                t.textContent = "Siedlung: " + data.settlementName.toUpperCase();
                t.style.display = "block";
            }
        }

        // === 3. UI–SCREEN AKTIVIEREN ===
        const introScreen = document.getElementById('intro-screen');
        const startScreen = document.getElementById('start-screen');
        const gameScreen = document.getElementById('game-screen');
        
        if (introScreen) introScreen.style.display = 'none';
        if (startScreen) startScreen.style.display = 'none';
        if (gameScreen) gameScreen.style.display = 'block';

        // === 4. UI RENDER–FUNKTIONEN MIT VERZÖGERUNG ===
        // WICHTIG: Warte bis DOM vollständig geladen ist
        setTimeout(() => {
            if (window.statRender) window.statRender();
            if (window.settlementRender) window.settlementRender();
            if (window.renderBuildingList) window.renderBuildingList();
            if (window.updateBuildMenu) window.updateBuildMenu();
            if (window.updateHousingStatus) window.updateHousingStatus();
            if (window.updateActionStatusDisplay) window.updateActionStatusDisplay();
            if (window.updateCalendarDisplay) window.updateCalendarDisplay();
            if (window.renderMonthBulbs) window.renderMonthBulbs();
            if (window.updateMarketButtonStatus) window.updateMarketButtonStatus();
            if (window.updateBankButtonStatus) window.updateBankButtonStatus();
            if (window.updateBuildButtonStatus) window.updateBuildButtonStatus();
            
            if (window.updatePlayerRank) window.updatePlayerRank(stats.tag);
            if (window.renderSkillTreeUI) window.renderSkillTreeUI(); 
            if (window.updateLiveMonitorButtonStatus) window.updateLiveMonitorButtonStatus();
            if (data.radioState) window.radioState = data.radioState;
            if (data.radioSkills) window.radioSkills = data.radioSkills;
            if (window.renderPlayerAvatar && window.playerAvatar) {
                window.renderPlayerAvatar(window.playerAvatar);
            }
        }, 200); // Erhöht von 0 auf 200ms
        
        // Bank-UI noch später rendern
        setTimeout(() => {
	  	    if (window.safeStatRender) window.safeStatRender();
            if (window.safeSettlementRender) window.safeSettlementRender();
            if (window.safeRenderBuildingList) window.safeRenderBuildingList();
            if (window.renderBalance) window.renderBalance();
            if (window.renderPortfolio) window.renderPortfolio(); 
            if (window.renderLoanList) window.renderLoanList(); 
            if (window.drawDaxGraph) window.drawDaxGraph();
        },200); // Erhöht von 500 auf 800ms

        // === 5. ENGINE STARTEN ===
        setTimeout(startGameLoop, 1000); // Erhöht von 300 auf 1000ms

        window.logEvent?.(`Spielstand '${slotName}' erfolgreich geladen.`);
        return true;

    } catch (error) {
        console.error("Fehler beim Laden:", error);
        window.logEvent?.(`FEHLER beim Laden: ${error.message}`);
        return false;
    }
}


window.loadGameState = loadGameState;

/**
 * Löscht ALLE Spielstände.
 */
function deleteAllGames() {
    if (!confirm("Bist du SICHER, dass du ALLE gespeicherten Spielstände löschen möchtest? Dies kann nicht rückgängig gemacht werden!")) {
        return;
    }

    const savedGames = getAllSavedGames();
    if (savedGames.length === 0) {
        window.logEvent('Keine Spielstände zum Löschen gefunden.');
        return;
    }

    savedGames.forEach(game => {
        localStorage.removeItem(game.key);
    });

    window.logEvent(`ERFOLG: ${savedGames.length} Spielstände gelöscht.`);
    renderSavedGames(); // Liste neu rendern
}

/**
 * Lädt alle gespeicherten Spielstände und rendert sie in das Settings-Modal,
 * inkl. separater Buttons für Laden und Löschen.
 */
function renderSavedGames() {
    const container = document.getElementById('savedGamesList'); 
    if (!container) {
        console.error("Container #savedGamesList nicht gefunden.");
        return;
    }

    const getSavedGamesList = () => {
        const games = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(SAVE_PREFIX)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data && data.saveTime) {
                        games.push({ key: key, data: data }); 
                    }
                } catch (e) {
                    console.error("Fehler beim Parsen:", key, e);
                }
            }
        }
        return games.sort((a, b) => b.data.saveTime - a.data.saveTime);
    };

    const savedGames = getSavedGamesList();
    container.innerHTML = '';

    if (savedGames.length === 0) {
        container.innerHTML = '<p>Keine gespeicherten Spielstände gefunden.</p>';
        return;
    }

    savedGames.forEach(game => {
        const inGameDay = game.data.inGameDay || 'N/A';
        const citizenCount = game.data.citizens ? game.data.citizens.length : 0;
        const date = new Date(game.data.saveTime).toLocaleDateString('de-DE');
        const time = new Date(game.data.saveTime).toLocaleTimeString('de-DE');
        const slotName = game.key.replace(SAVE_PREFIX, '');

        const listItem = document.createElement('div');
        listItem.className = 'saved-game-item';
        
        listItem.innerHTML = `
            <div class="saved-game-info">
                <strong>${slotName}</strong>
                <p>Tag: ${inGameDay} | Bürger: ${citizenCount}<br>Gespeichert: ${date} ${time}</p>
            </div>
            <div class="saved-game-actions">
                <button class="save-game-load" data-slot="${slotName}">Laden</button>
                <button class="save-game-delete" data-slot="${slotName}">Löschen</button>
            </div>
        `;
        
        container.appendChild(listItem);
    });
	
// game.js: ERSETZEN Sie den kompletten Block der Event-Listener und der Löschfunktionen.
// Event Listener für Lade-Buttons (FUNKTIONIERT: Schließt das Modal am Ende)
container.querySelectorAll('.save-game-load').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const slotName = e.target.getAttribute('data-slot');
        console.log("Lade Spielstand:", slotName);
        if (window.loadGameState) {
            window.loadGameState(slotName);
            // Diese Zeile ist für das Schließen des Fensters nach dem Laden zuständig.
            if (window.closeSettingsModal) window.closeSettingsModal();
        }
    });
});
   
// Event Listener für LÖSCHEN-Buttons (NEU: Ruft deleteGame DIREKT auf, OHNE POPUP)
container.querySelectorAll('.save-game-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const slotName = e.target.getAttribute('data-slot');
        window.deleteGame(slotName); 

    });
});
}

window.renderSavedGames = renderSavedGames;

// Funktion zum Starten der Lösch-Bestätigung (EXISTIERT, ABER OHNE POPUP)
function deleteGameConfirmation(slotName) {
    window.deleteGame(slotName); 
}
window.deleteGameConfirmation = deleteGameConfirmation;

function deleteGame(slotName) {
    const key = SAVE_PREFIX + slotName; 
    
    // Die robustere Version mit Überprüfung:
    if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        window.logEvent(`Spielstand gelöscht: ${slotName}`);
        renderSavedGames(); 
    } else {
        window.logEvent(`Fehler: Spielstand "${slotName}" nicht gefunden.`);
    }
}
window.deleteGame = deleteGame;
const AUTO_SAVE_KEY = 'survivalSiedlungAutoSaveEnabled';
/**
 * Verwaltet den Auto-Speichern-Toggle und Status-Anzeige.
 */
function setupAutoSaveToggle() {
    const toggle = document.getElementById('autoSaveToggle');
    const statusSpan = document.getElementById('autoSaveStatus');
    if (!toggle || !statusSpan) return;

    // Zustand beim Laden setzen
    let isEnabled = localStorage.getItem(AUTO_SAVE_KEY) === 'true';
    toggle.checked = isEnabled;
    statusSpan.textContent = isEnabled ? '(Aktiviert)' : '(Deaktiviert)';
    
    // Event Listener
    toggle.addEventListener('change', (e) => {
        isEnabled = e.target.checked;
        localStorage.setItem(AUTO_SAVE_KEY, isEnabled);
        statusSpan.textContent = isEnabled ? '(Aktiviert)' : '(Deaktiviert)';
        window.logEvent(`Automatisches Speichern: ${isEnabled ? 'Aktiviert' : 'Deaktiviert'}`);
    });
}

window.setupAutoSaveToggle = setupAutoSaveToggle;

// --- Event Listener für das Settings Modal initialisieren ---

// Schritt 1: Definiere globale Handler-Funktionen (nur einmal)
if (!window.settingsHandlersInitialized) {
    
    window.openSettingsHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const settingsModal = document.getElementById('settingsModal');
        if (!settingsModal) {
            console.error("Settings Modal nicht gefunden!");
            return;
        }
        
        console.log("Settings Modal wird geöffnet");
        settingsModal.style.display = 'flex';
        
        // Rendere Spielstände
        if (window.renderSavedGames) {
            window.renderSavedGames();
        } else {
            console.error("renderSavedGames nicht gefunden");
        }
        
        // Setup Auto-Save Toggle
        if (window.setupAutoSaveToggle) {
            window.setupAutoSaveToggle();
        }
    };
    
    window.closeSettingsHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            console.log("Settings Modal wird geschlossen");
            settingsModal.style.display = 'none';
        }
    };
    
    window.closeOnOutsideClickHandler = function(e) {
        const settingsModal = document.getElementById('settingsModal');
        if (e.target === settingsModal) {
            console.log("Klick außerhalb - Modal schließen");
            settingsModal.style.display = 'none';
        }
    };
/**
 * Interne Hilfsfunktion: Speichert den Zustand in den localStorage unter dem gegebenen Schlüssel.
 * (Wird von handleSaveGame und handleSaveGameAs aufgerufen)
 * @param {string} key - Der vollständige localStorage Schlüssel (inkl. Präfix).
 */
function saveGameInternal(key) {
    // Ruft die bestehende Funktion getCurrentGameState() auf.
    const gameState = getCurrentGameState();
    const jsonState = JSON.stringify(gameState);
    localStorage.setItem(key, jsonState);
    
    // Protokolliert den Speichervorgang ohne Präfix
    window.logEvent(`Spielstand gespeichert: ${key.replace(SAVE_PREFIX, "")}`);
    
    // Liste der Spielstände im Modal neu rendern (falls das Modal offen ist)
    if (window.renderSavedGames) window.renderSavedGames();
}

/**
 * [NEUE LÖSUNG] - Ersetzt die Popup-Funktion und wird vom Haupt-Speicher-Button aufgerufen.
 * Speichert das Spiel automatisch OHNE POPUP unter dem aktuellen Siedlungsnamen.
 */
window.handleSaveGame = function() {
    // 1. Hole den aktuellen Siedlungsnamen (Fallback auf 'Siedlung' falls nicht gesetzt)
    const saveName = window.settlementName || 'Siedlung'; 
    
    // 2. Erstelle den Schlüssel (z.B. survivalSiedlungSave_MeineBasis)
    const key = SAVE_PREFIX + saveName.trim();
    
    // 3. Speichern OHNE Prompt
    saveGameInternal(key);
};

/**
 * [MANUELLE OPTION] - Fügt die Möglichkeit hinzu, den Namen manuell zu ändern.
 * Falls du diese Funktion nutzen willst, musst du einen separaten Button im HTML 
 * (z.B. "Speichern unter...") hinzufügen und diesen an window.handleSaveGameAs binden.
 */
window.handleSaveGameAs = function() {
    const defaultSaveName = window.settlementName || 'Siedlung';
    
    // Öffnet das Popup, um den Namen manuell zu ändern.
    const newSaveName = prompt(
        "Unter welchem Namen soll der Spielstand gespeichert werden?",
        defaultSaveName
    );

    if (newSaveName === null || newSaveName.trim() === "") {
        window.logEvent("Speichern unter neuem Namen abgebrochen.");
        return;
    }

    const key = SAVE_PREFIX + newSaveName.trim();
    saveGameInternal(key);
};
    
// Funktion zum Öffnen des Bestätigungs-Modals
window.handleDeleteAllGames = function(e) {
    e.preventDefault();
    const confirmModal = document.getElementById('deleteAllConfirmModal');
    if (confirmModal) {
        confirmModal.style.display = 'flex'; // Modal anzeigen
    } else {
        // Fallback zu einfachem confirm(), falls Modal nicht da
        if (confirm('Bist du SICHER, dass du ALLE Spielstände löschen möchtest?')) {
            window.deleteAllGamesNow();
        }
    }
};

// Funktion, die alle Spielstände löscht und Modal schließt
window.deleteAllGamesNow = function() {
    if (window.deleteAllGames) {
        window.deleteAllGames();
        if (window.renderSavedGames) window.renderSavedGames();
    }
    const confirmModal = document.getElementById('deleteAllConfirmModal');
    if (confirmModal) confirmModal.style.display = 'none'; // Modal schließen
};

// Funktion, die die Spielstände aus localStorage löscht
window.deleteAllGames = function() {
    const SAVE_PREFIX = 'survivalSiedlungSave_';
    let deletedCount = 0;
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(SAVE_PREFIX)) {
            localStorage.removeItem(key);
            deletedCount++;
        }
    }
    window.logEvent?.(`✅ ${deletedCount} Spielstände gelöscht.`);
};


window.settingsHandlersInitialized = true;
    console.log("Settings Handlers initialisiert");
}

// Schritt 2: Hole DOM Elemente
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
const newGameSaveBtn = document.getElementById('newGameSaveBtn');
const deleteAllSavesBtn = document.getElementById('deleteAllSavesBtn');

console.log("Settings Modal Elemente:", {
    settingsBtn: !!settingsBtn,
    settingsModal: !!settingsModal,
    closeSettingsModalBtn: !!closeSettingsModalBtn,
    newGameSaveBtn: !!newGameSaveBtn,
    deleteAllSavesBtn: !!deleteAllSavesBtn
});

// Schritt 3: Registriere Event Listener
if (settingsBtn && settingsModal && closeSettingsModalBtn) {
    
    // Entferne alte Listener (falls vorhanden)
    settingsBtn.removeEventListener('click', window.openSettingsHandler);
    closeSettingsModalBtn.removeEventListener('click', window.closeSettingsHandler);
    settingsModal.removeEventListener('click', window.closeOnOutsideClickHandler);
    
    // Füge neue Listener hinzu
    settingsBtn.addEventListener('click', window.openSettingsHandler);
    closeSettingsModalBtn.addEventListener('click', window.closeSettingsHandler);
    settingsModal.addEventListener('click', window.closeOnOutsideClickHandler);
    
    console.log("Settings Modal Event Listener registriert");
    
    // Speichern Button
    if (newGameSaveBtn) {
        newGameSaveBtn.removeEventListener('click', window.handleSaveGame);
        newGameSaveBtn.addEventListener('click', window.handleSaveGame);
    }

    // Alle löschen Button
    if (deleteAllSavesBtn) {
        deleteAllSavesBtn.removeEventListener('click', window.handleDeleteAllGames);
        deleteAllSavesBtn.addEventListener('click', window.handleDeleteAllGames);
    }
    
} else {
    console.error("FEHLER: Settings Modal Elemente nicht gefunden!", {
        settingsBtn: !!settingsBtn,
        settingsModal: !!settingsModal,
        closeSettingsModalBtn: !!closeSettingsModalBtn
    });
}

// --- Ende Event Listener für das Settings Modal ---
function showSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        // Sicherstellen, dass die Liste der Savegames aktualisiert wird
        if (window.updateSaveGameList) {
            window.updateSaveGameList();
        }
        settingsModal.style.display = 'flex'; // Wichtig: Setzt das Modal auf sichtbar
        window.logEvent?.("Einstellungen geöffnet.");
    }
}
window.showSettingsModal = showSettingsModal;

function autoSaveGame() {
    const isEnabled = localStorage.getItem('survivalSiedlungAutoSaveEnabled') === 'true';
    
    if (isEnabled) {
        // Verwenden Sie einen speziellen Schlüssel für das Auto-Save
        const autoSaveSlotName = 'Auto_Save_Slot'; 
        saveGameState(autoSaveSlotName); 
        // WICHTIG: Die logEvent-Meldung für Auto-Save ist im saveGameState
        // window.logEvent(`Automatischer Spielstand gespeichert.`);
    }

}
window.autoSaveGame = autoSaveGame;
window.saveGameState = saveGameState;
window.loadGameState = loadGameState;
window.deleteGame = deleteGame; // KRITISCH für den behobenen ReferenceError
window.deleteGameConfirmation = deleteGameConfirmation;
window.closeSettingsModal = function() {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        console.log("closeSettingsModal aufgerufen");
        settingsModal.style.display = 'none';
    }
};
// === AUTO SAVE – NUR SPEICHERN, KEIN LADEN! ===
let autoSaveTimer = null;

function startAutoSaveIfEnabled() {
    const isEnabled = localStorage.getItem('survivalSiedlungAutoSaveEnabled') === 'true';
    
    // Settings-Status updaten
    const toggle = document.getElementById('autoSaveToggle');
    const statusEl = document.getElementById('autoSaveStatus');
    if (toggle) toggle.checked = isEnabled;
    if (statusEl) statusEl.textContent = isEnabled ? '(Aktiv – alle 5 Min)' : '(Deaktiviert)';
    
    // Timer nur STARTEN, wenn aktiviert (speichert, lädt NICHT!)
    if (isEnabled && !autoSaveTimer) {
        autoSaveTimer = setInterval(() => {
            autoSaveGame();  // Speichert 'Auto_Save_Slot'
        }, 60000);  // 5 Minuten
        
        // Sofort 1x speichern
        autoSaveGame();
        console.log('🛡️ AutoSave läuft (alle 5 Min)');
    }
}

// Toggle-Event (in Settings)
const autoSaveToggle = document.getElementById('autoSaveToggle');
if (autoSaveToggle) {
    autoSaveToggle.addEventListener('change', function(e) {
        const enabled = e.target.checked;
        localStorage.setItem('survivalSiedlungAutoSaveEnabled', enabled);
        
        if (enabled && !autoSaveTimer) {
            // Timer starten
            autoSaveTimer = setInterval(autoSaveGame, 60000);
            //autoSaveGame();  // Sofort
            logEvent('🛡️ AutoSave aktiviert');
        } else if (!enabled && autoSaveTimer) {
            // Timer stoppen
            clearInterval(autoSaveTimer);
            autoSaveTimer = null;
            logEvent('🛑 AutoSave deaktiviert');
        }
    });
}
window.usePartySkill = function() {
    const cost = 200; // Party-Skill kostet 200 Zombify
    
    // Prüfen, ob der Skill freigeschaltet ist und Geld vorhanden ist
    if (!window.skillTree.partySkillUnlocked) {
        window.logEvent("Fest kann noch nicht ausgerichtet werden (nicht freigeschaltet).");
        return;
    }
    
    if (window.money < cost) {
        window.logEvent("Nicht genug Zombify, um das Fest auszurichten!");
        return;
    }
    
    // 1. Kosten abziehen
    window.money -= cost;
	
    // 2. Glücklichkeit aller Bürger erhöhen (setze Laune auf 100)
    if (window.citizens && window.citizens.length > 0) {
        window.citizens.forEach(citizen => {
            if (!citizen.tot) { // Nur lebende Bürger
                citizen.mood = 100; // Setzt die Laune auf das Maximum (100)
            }
        });
    }
    if (window.statRender) window.statRender();       // Aktualisiert Geld/Ressourcen
    if (window.settlementRender) window.settlementRender(); // Aktualisiert die Bürgerliste und färbt die Smiles grün
    
    window.logEvent("🎉 Fest ausgerichtet! Die Laune der Bürger ist auf 100 gestiegen.");
    
    // Aktualisiert den Button-Status im Skill Tree (optional)
    if (window.openSkillTreePanel) window.openSkillTreePanel(); 
};
// AutoSave nur starten, WENN IM GAME-SCREEN (nicht Start-Menü!)
if (document.getElementById('game-screen') && document.getElementById('game-screen').classList.contains('active')) {
    startAutoSaveIfEnabled();
}
});

document.addEventListener('DOMContentLoaded', () => {
  const deleteAllBtn = document.getElementById('deleteAllSavesBtn');
  const confirmModal = document.getElementById('deleteAllConfirmModal');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

  if (!deleteAllBtn || !confirmModal || !confirmDeleteBtn || !cancelDeleteBtn) {
    console.error("Delete-All Button oder Modal-Elemente nicht gefunden!");
    return;
  }

  // Modal öffnen bei Klick auf „Alle Spielstände Löschen“
  deleteAllBtn.addEventListener('click', (e) => {
    e.preventDefault();
    confirmModal.style.display = 'flex';
  });

  // Bestätigen – alle Spielstände löschen
  confirmDeleteBtn.addEventListener('click', () => {
    const SAVE_PREFIX = 'survivalSiedlungSave_';
    let count = 0;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SAVE_PREFIX)) {
        localStorage.removeItem(key);
        count++;
      }
    }
    window.logEvent?.(`🗑️ ${count} Spielstände gelöscht!`);
    if (window.renderSavedGames) window.renderSavedGames();
    confirmModal.style.display = 'none';
  });

  // Abbrechen – Modal schließen ohne zu löschen
  cancelDeleteBtn.addEventListener('click', () => {
    confirmModal.style.display = 'none';
  });
});


