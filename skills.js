// skills.js

window.skillTree = {
  maxBuildProjectsLevel: 0,
  regionExpansionLevel: 0,
  liveMonitorUnlocked: false,
  militaryUnlocked: false,
  defenseUnlocked: false,
  monumentUnlocked: false,
  autoRepairUnlocked: false,
  repairAllButtonUnlocked: false,
  partySkillUnlocked: false, 
  hoverInspectUnlocked: false,
  massToggleUnlocked: false,
  skills: [
    {
      key: 'maxBuildProjects',
      name: 'Bau-Limit erhöhen',
      description: 'Erhöht gleichzeitige Bauprojekte von 2 auf 3, dann auf 4.',
      cost: [50, 150],
      icon: '🔨'
    },
    {
      key: 'liveMonitor',
      name: 'Live-Ansicht freischalten',
      description: 'Erlaubt Zugriff auf die animierte Live-Ansicht deiner Siedlung.',
      cost: [100],
      icon: '👁️'
    },
    {
      key: 'militaryUnlock',
      name: 'Militär freischalten',
      description: 'Erlaubt Bau militärischer Gebäude.',
      cost: [80],
      icon: '⚔️'
    },
    {
      key: 'defenseUnlock',
      name: 'Verteidigung freischalten',
      description: 'Erlaubt Bau von Verteidigungsgebäuden.',
      cost: [120],
      icon: '🛡️',
      prerequisite: 'militaryUnlock'
    },
    {
      key: 'monumentUnlock',
      name: 'Sondergebäude freischalten',
      description: 'Erlaubt Bau von Monumenten und exklusiven Sondergebäuden.',
      cost: [200],
      icon: '🏛️',
      prerequisite: 'defenseUnlock'
    },
	{
  key: 'autoRepair',
  name: 'Automatische Reparatur',
  description: 'Alle Gebäude werden automatisch repariert, sobald ihr Zustand unter 50% fällt.',
  cost: [180],
  icon: '🔁',
  group: 'Komfort'
},
{
  key: 'repairAllButton',
  name: 'Massenreparatur',
  description: 'Schaltet einen Button frei, um alle Gebäude mit einem Klick zu reparieren.',
  cost: [170],
  icon: '🛠️',
  group: 'Komfort'
},
{
  key: "hoverInspect",
  name: "Beobachter-Interface",
  description: "Zeigt beim Überfahren von Bewohnern oder Gebäuden deren Namen bzw. Typ an.",
  cost: [120],
  icon: "🛰️",
  group: "Komfort"
},
{
  key: "partySkill",
  name: "Fest ausrichten",
  description: "Lässt alle Bewohner eine Party feiern und macht sie glücklich. Kostet 200 Zombify.",
  cost: [200], // Kosten beim Kauf / Nutzung
  icon: "🎉",
  group: "Komfort",
  infiniteUse: true // Eigene Markierung, damit unendlich oft nutzbar
},
{
  key: 'radioRange1',
  name: 'Erweiterte Reichweite I',
  description: 'Erhöht die maximale Anzahl entdeckbarer Siedlungen um 3.',
  cost: [250],
  icon: '📡',
  group: 'Funkgerät'
},
{
  key: 'radioRange2',
  name: 'Erweiterte Reichweite II',
  description: 'Erhöht die maximale Anzahl entdeckbarer Siedlungen um 1.',
  cost: [350],
  icon: '📡',
  group: 'Funkgerät',
  prerequisite: 'radioRange1'
},
{
  key: 'radioRange3',
  name: 'Erweiterte Reichweite III',
  description: 'Erhöht die maximale Anzahl entdeckbarer Siedlungen um 2.',
  cost: [500],
  icon: '📻',
  group: 'Funkgerät',
  prerequisite: 'radioRange2'
},
{
  key: 'loneOperator',
  name: 'Einsamer Funker',
  description: 'Schaltet mysteriöse Nachrichten eines einsamen Funkers frei.',
  cost: [600],
  icon: '🎙️',
  group: 'Funkgerät',
  prerequisite: 'radioRange3'
},
{
  key: 'massToggle',
  name: 'Massen-Steuerung',
  description: 'Ermöglicht das gleichzeitige Öffnen oder Schließen aller Gebäude.',
  cost: [150],
  icon: '🏢',
  group: 'Komfort'
},
{
  key: "regionExpansion",
  name: "Neue Gebiete beanspruchen",
  description: "Kaufe neue Gebiete, um die maximale Zahl gleichzeitig gebauter Gebäude zu erhöhen.",
  // Diese Stufen: 5, 10, 20, 40, 80, 160, 320 Gebäude
  cost: [150, 350, 800, 2400, 7500, 22000, 70000],
  levels: [
    {maxBuildings: 5, text: "Starte mit 5 Gebäuden"},
    {maxBuildings: 10, text: "Erweitere auf 10 Gebäude"},
    {maxBuildings: 20, text: "Erweitere auf 20 Gebäude"},
    {maxBuildings: 40, text: "Erweitere auf 40 Gebäude"},
    {maxBuildings: 80, text: "Erweitere auf 80 Gebäude"},
    {maxBuildings: 160, text: "Erweitere auf 160 Gebäude"},
    {maxBuildings: 320, text: "Erweitere auf 320 Gebäude"}
  ],
  icon: "🌄", // Optional: eigenes Icon für die Anzeige
  group: "Kapazität"
}
  ]
};

function openSkillTreePanel() {
  const panel = document.getElementById('skillTreePanel');
 const skillList = document.getElementById('skillList');
  skillList.innerHTML = ""; // Hier wird der neue Inhalt gebaut!
  skillTree.skills.forEach(skill => {
	  
    let buttonHtml = '';
	if (skill.key === "regionExpansion") {
    let lvl = window.skillTree.regionExpansionLevel;
    if (lvl >= skill.levels.length - 1) {
        buttonHtml += '<span style="color:lime;font-weight:bold">Max. Stufe erreicht: ' +
          skill.levels[lvl].maxBuildings + ' Gebäude</span>';
    } else {
        buttonHtml += '<button onclick="buySkill(\'regionExpansion\')" ' +
          (window.money < skill.cost[lvl] ? 'disabled class="disabled"' : '') + '>' +
          'Kaufen für ' + skill.cost[lvl] + ' Zombify (' + skill.levels[lvl + 1].text + ')</button>';
    }
}
    // Prerequisite-Check für gestaffelte Skills
    if (skill.prerequisite && !skillTree[`${skill.prerequisite.replace('Unlock', '')}Unlocked`]) {
      buttonHtml = `<button disabled class="disabled">Vorher "${skillTree.skills.find(s=>s.key===skill.prerequisite).name}" nötig</button>`;
    } else if (skill.key === "maxBuildProjects") {
      const lvl = skillTree.maxBuildProjectsLevel;
      if (lvl >= skill.cost.length) {
        buttonHtml = '<span style="color:lime;font-weight:bold;">Max. Stufe erreicht</span>';
      } else {
        buttonHtml = `<button onclick="buySkill('maxBuildProjects')" 
          ${window.money < skill.cost[lvl] ? 'disabled class="disabled"' : ''}>
            Kaufen für ${skill.cost[lvl]} Zombify
          </button>`;
      }
    } else if (skill.key === "liveMonitor") {
      buttonHtml = skillTree.liveMonitorUnlocked
        ? '<span style="color:lime;font-weight:bold;">Freigeschaltet!</span>'
        : `<button onclick="buySkill('liveMonitor')" 
            ${window.money < skill.cost[0] ? 'disabled class="disabled"' : ''}>
            Freischalten für ${skill.cost[0]} Zombify
          </button>`;
    } else if (skill.key === "militaryUnlock") {
      buttonHtml = skillTree.militaryUnlocked
        ? '<span style="color:lime;font-weight:bold;">Freigeschaltet!</span>'
        : `<button onclick="buySkill('militaryUnlock')" 
            ${window.money < skill.cost[0] ? 'disabled class="disabled"' : ''}>
            Freischalten für ${skill.cost[0]} Zombify
          </button>`;
    } else if (skill.key === "defenseUnlock") {
      buttonHtml = skillTree.defenseUnlocked
        ? '<span style="color:lime;font-weight:bold;">Freigeschaltet!</span>'
        : `<button onclick="buySkill('defenseUnlock')" 
            ${window.money < skill.cost[0] ? 'disabled class="disabled"' : ''}>
            Freischalten für ${skill.cost[0]} Zombify
          </button>`;
    } else if (skill.key === "monumentUnlock") {
      buttonHtml = skillTree.monumentUnlocked
        ? '<span style="color:lime;font-weight:bold;">Freigeschaltet!</span>'
        : `<button onclick="buySkill('monumentUnlock')" 
            ${window.money < skill.cost[0] ? 'disabled class="disabled"' : ''}>
            Freischalten für ${skill.cost[0]} Zombify
          </button>`;
    }
else if (skill.key === "autoRepair") {
  buttonHtml = skillTree.autoRepairUnlocked
    ? '<span style="color:lime;font-weight:bold;">Freigeschaltet!</span>'
    : `<button onclick="buySkill('autoRepair')" 
        ${window.money < skill.cost[0] || skillTree.repairAllButtonUnlocked ? 'disabled class="disabled"' : ''}>
      Freischalten für ${skill.cost[0]} Zombify
      </button>`;
}
else if (skill.key === "repairAllButton") {
  buttonHtml = skillTree.repairAllButtonUnlocked
    ? '<span style="color:lime;font-weight:bold;">Freigeschaltet!</span>'
    : `<button onclick="buySkill('repairAllButton')" 
        ${window.money < skill.cost[0] || skillTree.autoRepairUnlocked ? 'disabled class="disabled"' : ''}>
      Freischalten für ${skill.cost[0]} Zombify
      </button>`;
}
else if (skill.key === "partySkill") {
  if (!skillTree.partySkillUnlocked) {
    buttonHtml = `<button onclick="buySkill('partySkill')" 
      ${window.money < skill.cost[0] ? 'disabled class="disabled"' : ''}>
      Freischalten für ${skill.cost[0]} Zombify
    </button>`;
  } else {
    buttonHtml = `<button onclick="usePartySkill()" 
      ${window.money < skill.cost[0] ? 'disabled class="disabled"' : ''}>
      Fest ausrichten für ${skill.cost[0]} Zombify
    </button>
    <span style="color:lime;font-weight:bold;">Freigeschaltet!</span>`;
  }
}
else if (skill.key === "radioRange1" || skill.key === "radioRange2" || skill.key === "radioRange3" || skill.key === "loneOperator") {
  const isUnlocked = skillTree[`${skill.key}Unlocked`];
  if (!isUnlocked) {
    buttonHtml = `<button onclick="buySkill('${skill.key}')" 
      ${window.money < skill.cost[0] ? 'disabled class="disabled"' : ''}>
      Freischalten für ${skill.cost[0]} Zombify
    </button>`;
  } else {
    buttonHtml = `<span style="color:lime;font-weight:bold;">Freigeschaltet!</span>`;
  }
}
else if (skill.key === "massToggle") {
  buttonHtml = skillTree.massToggleUnlocked
    ? '<span style="color:lime;font-weight:bold;">Freigeschaltet!</span>'
    : `<button onclick="buySkill('massToggle')" 
        ${window.money < skill.cost[0] ? 'disabled class="disabled"' : ''}>
        Freischalten für ${skill.cost[0]} Zombify
      </button>`;
}
else if (skill.key === "hoverInspect") {
  if (!window.skillTree.hoverInspectUnlocked) {
    buttonHtml = `<button onclick="buySkill('hoverInspect')"
      ${window.money < skill.cost[0] ? 'disabled class="disabled"' : ''}>
      Freischalten für ${skill.cost[0]} Zombify
    </button>`;
  } else {
    buttonHtml = `<span style="color:lime;font-weight:bold;">Freigeschaltet!</span>`;
  }
}
    skillList.innerHTML += `
      <div style="margin:15px 0; padding:8px; border-bottom:1px solid #33ff33;">
        <span style="font-size:1.6em;">${skill.icon}</span>
        <strong>${skill.name}</strong><br>
        ${skill.description}<br>
        ${buttonHtml}
      </div>
    `;
  });
}
window.buySkill = function(skillKey) {
  const skill = skillTree.skills.find(s => s.key === skillKey);
  if (!skill) return;
if (skillKey === 'hoverInspect') {
   window.skillTree.hoverInspectUnlocked = true;
  logEvent("Du kannst nun Bewohner und Gebäude im Live-Monitor inspizieren!");
  openSkillTreePanel();
  return;
}

  if ((skillKey === 'autoRepair' && skillTree.repairAllButtonUnlocked) ||
      (skillKey === 'repairAllButton' && skillTree.autoRepairUnlocked)) {
      return;
  }
  if (skill.prerequisite && !skillTree[`${skill.prerequisite.replace('Unlock','')}Unlocked`]) return;

  // Kostenhandling
  let cost = skill.key === "maxBuildProjects"
    ? skill.cost[skillTree.maxBuildProjectsLevel]
    : skill.cost[0];

  // === HIER NEU EINBAUEN: Freischalt-Block für Party-Skill ===
  if (skillKey === "partySkill" && !skillTree.partySkillUnlocked) {
    if (window.money < cost) return;
    window.money -= cost;
    skillTree.partySkillUnlocked = true;
    logEvent("Du kannst jetzt Partys ausrichten!");
    openSkillTreePanel();
    if (window.updateBuildMenu) window.updateBuildMenu();
    return;
  }
  if (skillKey === 'massToggle') { 
  window.skillTree.massToggleUnlocked = true;
  logEvent("Du kannst jetzt alle Gebäude gleichzeitig öffnen/schließen!");
  openSkillTreePanel();
  if (window.updateBuildingInfoBar) window.updateBuildingInfoBar();
  return;
}
  // === ENDE Party-Freischaltung ===
if (skill.key === "regionExpansion") {
    // Block wenn alle Stufen gekauft sind
    if (window.skillTree.regionExpansionLevel >= skill.levels.length - 1) return;

    let currentLevel = window.skillTree.regionExpansionLevel;
    let price = skill.cost[currentLevel];
    if (window.money < price) return;  // Abbrechen wenn nicht genug Geld

    window.money -= price;
    window.skillTree.regionExpansionLevel++;
    logEvent("Du hast ein neues Gebiet freigeschaltet und kannst jetzt bis zu " +
       skill.levels[window.skillTree.regionExpansionLevel].maxBuildings + " Gebäude bauen!");
    openSkillTreePanel();
    if (window.updateBuildMenu) window.updateBuildMenu();
    return;
}

  if (window.money < cost) return; // Abbruch wenn kein Geld
  window.money -= cost;

  // Behandlung für maxBuildProjects mit Levels
  if (skill.key === "maxBuildProjects") {
    const lvl = skillTree.maxBuildProjectsLevel;
    if (lvl >= skill.cost.length) return;
    skillTree.maxBuildProjectsLevel++;
  } else {
    // Für "Fest ausrichten" keine Veränderungen im Skill-Status speichern,
    // sondern direkt Effekt ausführen:
    if (skillKey === "partySkill") {
      usePartySkill(); // Deine Party-Funktion ausführen
    } else {
      // Andere Skills 
      if (skill.key === "liveMonitor") {
        skillTree.liveMonitorUnlocked = true;
        if (window.updateLiveMonitorButtonStatus) window.updateLiveMonitorButtonStatus();
      }
      if (skill.key === 'militaryUnlock') skillTree.militaryUnlocked = true;
      if (skill.key === 'defenseUnlock') skillTree.defenseUnlocked = true;
      if (skill.key === 'monumentUnlock') skillTree.monumentUnlocked = true;
      if (skillKey === 'autoRepair') skillTree.autoRepairUnlocked = true;
      if (skillKey === 'repairAllButton') skillTree.repairAllButtonUnlocked = true;
    }
  }
// Radio-Skills
if (skillKey === 'radioRange1') {
  skillTree.radioRange1Unlocked = true;
  if (window.radioState) window.radioState.maxSettlements += 3;
  if (window.radioSkills) window.radioSkills.scanRange1 = true;
  logEvent("📡 Funkbereich erweitert! Bis zu 5 Siedlungen entdeckbar.");
}

if (skillKey === 'radioRange2') {
  skillTree.radioRange2Unlocked = true;
  if (window.radioState) window.radioState.maxSettlements += 1;
  if (window.radioSkills) window.radioSkills.scanRange2 = true;
  logEvent("📡 Funkbereich erweitert! Bis zu 6 Siedlungen entdeckbar.");
}

if (skillKey === 'radioRange3') {
  skillTree.radioRange3Unlocked = true;
  if (window.radioState) window.radioState.maxSettlements += 2;
  if (window.radioSkills) window.radioSkills.scanRange3 = true;
  logEvent("📡 Funkbereich erweitert! Bis zu 8 Siedlungen entdeckbar.");
}

if (skillKey === 'loneOperator') {
  skillTree.loneOperatorUnlocked = true;
  if (window.radioSkills) window.radioSkills.loneOperator = true;
  
  // Einsamen Funker freischalten
  if (window.unlockLoneOperator) {
    window.unlockLoneOperator();
  }
  
  logEvent("🏆 Einsamer Funker freigeschaltet!");
}
  openSkillTreePanel();
  if (window.updateBuildMenu) window.updateBuildMenu();
};


// CSS in deine style.css:
///
/// button.disabled:disabled,
/// button:disabled {
///   background-color: #888 !important;
///   color: #eee !important;
///   cursor: not-allowed !important;
///   box-shadow: none;
///   opacity: 0.62;
/// }
