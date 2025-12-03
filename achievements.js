/**
 * achievements.js
 * Logik und Definitionen für das Errungenschaften-System.
 */
// Globaler Status-Tracker, geladen aus LocalStorage
let achievedState = JSON.parse(localStorage.getItem('survivalSiedlungAchievements') || '{}');
// Errungenschafts-Definitionen
const ACHIEVEMENTS = {
    // --- Vom Benutzer gewünschte Abzeichen (MEHRSTUFIG) ---

// 🏆 Bevölkerung (Citizens)
    citizens50: {
        name: 'Bevölkerungs-Meister', // NEU
        description: 'Erreiche eine Siedlungsgröße von 50 lebenden Bürgern.',
        check: () => (window.citizens ? window.citizens.filter(c => !c.tot).length : 0) >= 50, // Angepasst auf 50
        category: 'Bevölkerung'
    },
    citizens75: {
        name: 'Siedlungs-Leiter', // NEU
        description: 'Erreiche eine Siedlungsgröße von 75 lebenden Bürgern.',
        check: () => (window.citizens ? window.citizens.filter(c => !c.tot).length : 0) >= 75,
        category: 'Bevölkerung'
    },
    citizens150: {
        name: 'Metropolen-Gründer', // NEU
        description: 'Erreiche eine Siedlungsgröße von 150 lebenden Bürgern.',
        check: () => (window.citizens ? window.citizens.filter(c => !c.tot).length : 0) >= 150,
        category: 'Bevölkerung'
    },
    
    // 💰 Währung (Zombify)
    zombify5000: {
        name: 'Zombify-Baron', // NEU
        description: 'Sammle 5000 Zombify (Währung).',
        check: () => (window.money || 0) >= 5000, // HIER KORRIGIERT: Muss 5000 sein (war 500)
        category: 'Wirtschaft'
    },
    zombify7000: {
        name: 'Zombify-Lord', // NEU
        description: 'Sammle 7000 Zombify (Währung).',
        check: () => (window.money || 0) >= 7000, // HIER KORRIGIERT: Muss 7000 sein (war 5000)
        category: 'Wirtschaft'
    },
    zombify15000: {
        name: 'Zombify-König', // NEU
        description: 'Sammle 15000 Zombify (Währung).',
        check: () => (window.money || 0) >= 15000,
        category: 'Wirtschaft'
    },

    // 🔨 Bau (Builder)
    builder5: {
        name: 'Baumeister-Lehrling', // NEU
        description: 'Baue insgesamt 5 Gebäude (alle Typen).',
        check: () => (window.buildings ? window.buildings.length : 0) >= 5,
        category: 'Bau'
    },
    builder20: {
        name: 'Baumeister-Geselle', // NEU
        description: 'Baue insgesamt 20 Gebäude (alle Typen).',
        check: () => (window.buildings ? window.buildings.length : 0) >= 20,
        category: 'Bau'
    },
    builder40: {
        name: 'Baumeister-Meister', // NEU
        description: 'Baue insgesamt 40 Gebäude (alle Typen).',
        check: () => (window.buildings ? window.buildings.length : 0) >= 40,
        category: 'Bau'
    },
    
    // --- Restliche Abzeichen (UNVERÄNDERT, nur ID-Namen an Logik angepasst) ---
    births100: {
        name: 'Kindersegen',
        description: 'Erlebe 100 Geburten in deiner Siedlung.',
        check: () => (window.stats ? window.stats.geborene : 0) >= 100,
        category: 'Bevölkerung'
    },
    holz500: {
        name: 'Waldarbeiter-Meister',
        description: 'Besitze gleichzeitig 500 Holz.',
        check: () => (window.resources ? window.resources.holz : 0) >= 500,
        category: 'Ressourcen'
    },
    stein500: {
        name: 'Stein-Gigant',
        description: 'Besitze gleichzeitig 500 Stein.',
        check: () => (window.resources ? window.resources.stein : 0) >= 500,
        category: 'Ressourcen'
    },
    essen500: {
        name: 'Kornkammer-König',
        description: 'Besitze gleichzeitig 500 Essen.',
        check: () => (window.resources ? window.resources.essen : 0) >= 500,
        category: 'Ressourcen'
    },
    wasser500: {
        name: 'Wassermeister',
        description: 'Besitze gleichzeitig 500 Wasser.',
        check: () => (window.resources ? window.resources.wasser : 0) >= 500,
        category: 'Ressourcen'
    },
    medis500: {
        name: 'Apotheker-Ehre',
        description: 'Besitze gleichzeitig 500 Medikamente.',
        check: () => (window.resources ? window.resources.medis : 0) >= 500,
        category: 'Ressourcen'
    },
    waffen500: {
        name: 'Waffenkammer-Wächter',
        description: 'Besitze gleichzeitig 500 Waffen.',
        check: () => (window.resources ? window.resources.waffen : 0) >= 500,
        category: 'Ressourcen'
    },
    deaths150: { // Negativ-Abzeichen
        name: 'Der Totengräber',
        description: 'Erlebe 150 Tode in deiner Siedlung (Negativ-Abzeichen).',
        check: () => (window.stats ? window.stats.gestorben : 0) >= 150,
        category: 'Negativ'
    },
    day50: {
        name: 'Der Lange Atem',
        description: 'Überlebe bis Tag 50.',
        check: () => (window.stats ? window.stats.tag : 0) >= 50,
        category: 'Überleben'
    },
    fiveWalls: {
        name: 'Der Große Wall',
        description: 'Baue 5 Wall-Gebäude (Typ: wall).',
        check: () => (window.buildings ? window.buildings.filter(b => b.type === 'wall' && b.status !== 'building').length : 0) >= 5,
        category: 'Bau'
    },
	loneOperatorAchievement: {
    name: 'Der Einsame Funker',
    description: 'Schalte alle Radio-Skills frei und erreiche den einsamen Funker.',
    check: () => window.radioSkills && window.radioSkills.loneOperator === true,
    category: 'Funkgerät'
},
};
/**
 * Überprüft alle Errungenschaften auf Freischaltung und aktualisiert den Status.
 * Muss regelmäßig aufgerufen werden (z.B. in der Game-Loop/statRender).
 */
// achievements.js
/**
 * Fügt die Logik hinzu, um zwischen den Abzeichen-Tabs zu wechseln.
 * Wichtig: Diese Funktion MUSS global sein, um mit onclick im HTML zu funktionieren.
 * @param {Event} evt - Das Klick-Event.
 * @param {string} tabName - Der Name des Tabs ('Übersicht' oder 'Detail').
 */
window.openAchievementTab = function(evt, tabName) { // WICHTIG: window.openAchievementTab = function ... behebt das Startproblem
    let i, tabcontent, tablinks;

    // Alle Tab-Inhalte ausblenden
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Alle aktiven Tab-Buttons deaktivieren
    tablinks = document.getElementsByClassName("tab-btn");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Den aktuellen Tab anzeigen und den Button als aktiv markieren
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

    // Beim Wechsel zur Detail-Ansicht neu rendern, falls die Daten veraltet sein könnten
    if (tabName === 'Detail') {
        window.renderDetailedAchievementsToModal();
    }
};

/**
 * Erstellt den HTML-Inhalt für die detaillierte Abzeichen-Ansicht, die alle Bedingungen listet.
 */
function renderDetailedAchievementsToModal() {
    const container = document.getElementById('detailed-achievements-list');
    if (!container) return;

    const achievementData = {};
    
    // 1. Gruppiere alle Abzeichen nach Kategorie
    for (const id in ACHIEVEMENTS) {
        const achievement = ACHIEVEMENTS[id];
        if (!achievementData[achievement.category]) {
            achievementData[achievement.category] = [];
        }
        achievementData[achievement.category].push({ 
            id: id,
            name: achievement.name, 
            description: achievement.description 
        });
    }

    // 2. Generiere den HTML-Code
    let html = '';
    const sortedCategories = Object.keys(achievementData).sort();

    for (const category of sortedCategories) {
        if (achievementData[category].length > 0) {
            
            // Kategorie-Überschrift
            html += `<div class="achievement-detail-item">
                        <strong>${category}</strong>`;
            
            achievementData[category].forEach(item => {
                const isAchieved = achievedState[item.id];
                const statusClass = isAchieved ? 'unlocked' : 'locked';
                const imagePath = `image/${item.id}.png`; 
                
                // Einzelne Einträge für Icon, Name und Bedingung
                html += `
                    <div class="achievement-detail-entry ${statusClass}">
                        <div class="icon-name-wrapper">
                            <img src="${imagePath}" alt="${item.name}" class="detail-icon">
                            <span class="name">${item.name}:</span> 
                        </div>
                        <span class="condition">${item.description}</span>
                    </div>
                `;
            });
            html += `</div>`; // Schließt achievement-detail-item
        }
    }

    container.innerHTML = html;
}
window.renderDetailedAchievementsToModal = renderDetailedAchievementsToModal; // Global verfügbar machen
/**
 * Überprüft alle Errungenschaften auf Freischaltung und aktualisiert den Status.
 * Muss regelmäßig aufgerufen werden (z.B. in der Game-Loop/statRender).
 */
function checkAllAchievements() {
    let newAchievements = false;
    const newlyUnlockedIds = []; // speichert alle neu freigeschalteten Abzeichen

    for (const id in ACHIEVEMENTS) {
        if (!achievedState[id]) {
            const achievement = ACHIEVEMENTS[id];
            if (achievement.check()) {
                achievedState[id] = true;
                newAchievements = true;
                newlyUnlockedIds.push(id);

                if (window.logEvent) {
                    window.logEvent(`🎉 ERRUNGENSCHAFT FREIGESCHALTET: ${achievement.name} (${achievement.category})!`);
                }
            }
        }
    }
window.resetAchievements = function() {
    // 1. Löscht den LocalStorage-Eintrag für die Erfolge
    localStorage.removeItem('survivalSiedlungAchievements');
    
    // 2. Setzt den In-Memory-Status zurück
    achievedState = {}; 
    
    // 3. Aktualisiert die Abzeichen-Anzeige, falls bereits gerendert
    if (typeof renderBadges === 'function') {
        renderBadges(); 
    }
    console.log("Abzeichen zurückgesetzt.");
}
    if (newAchievements) {
        // Speichern im LocalStorage
        localStorage.setItem('survivalSiedlungAchievements', JSON.stringify(achievedState));

        // DOM aktualisieren
       // DOM aktualisieren
        renderBadges(); // Obere Badges aktualisieren
        window.renderAllAchievementsToModal(); // Übersicht-Tab aktualisieren

        // Aktualisiere Detail-Ansicht nur, wenn sie gerade offen ist
        if (document.getElementById('Detail').style.display !== 'none') {
             window.renderDetailedAchievementsToModal(); 
        }

        // Pop-Animation hinzufügen NACH dem Rendern
        setTimeout(() => {
            newlyUnlockedIds.forEach(id => {
                const badgeEl = document.querySelector(`.achievement-badge[data-achievement-id="${id}"]`);
                if (badgeEl) {
                    badgeEl.classList.add('newly-unlocked');
                    badgeEl.addEventListener('animationend', () => {
                        badgeEl.classList.remove('newly-unlocked');
                    }, { once: true });
                }
            });
        }, 50);
    }
}


/**
 * Hilfsfunktion, um die ID des höchsten erreichten Tiers in einer Serie zu finden.
 * @param {string[]} tierIds - Eine Liste von Abzeichen-IDs von T1 bis T3 (aufsteigend).
 * @returns {string|null} Die ID des höchsten freigeschalteten Tiers.
 */
function getHighestTierAchievedId(tierIds) {
    // Geht die Liste von hinten nach vorne (T3 -> T2 -> T1) durch.
    for (let i = tierIds.length - 1; i >= 0; i--) {
        const id = tierIds[i];
        if (achievedState[id]) {
            return id; // Gibt die ID des höchsten freigeschalteten Abzeichens zurück
        }
    }
    return null; // Nichts in dieser Serie freigeschaltet
}

/**
 * Bestimmt den Rang (Tier) einer Errungenschaft, falls sie Teil einer Serie ist.
 * @param {string} id - Die ID der Errungenschaft.
 * @returns {string} Die CSS-Klasse für den Rang ('tier-1', 'tier-2', 'tier-3' oder leer).
 */
function getAchievementTierClass(id) {
    // Stufe 3 (Gold) - Höchste Priorität (längste oder größte Zahl)
    if (id.includes('citizens150') || id.includes('zombify15000') || id.includes('builder40')) {
        return 'tier-3';
    } 
    // Stufe 2 (Silber) - Mittlere Priorität
    else if (id.includes('citizens75') || id.includes('zombify7000') || id.includes('builder20')) {
        return 'tier-2';
    } 
    // Stufe 1 (Grün/Bronze) - Niedrigste Priorität
    else if (id.includes('citizens50') || id.includes('zombify5000') || id.includes('builder5')) {
        return 'tier-1';
    }

    // Für alle anderen Abzeichen
    return '';
}
/**
 * Rendert die freigeschalteten Abzeichen in der oberen Ecke. 
 * Zeigt NUR das höchste Abzeichen pro gestufter Serie an.
 */
function renderBadges() {
    const container = document.getElementById('achievementBadges');
    if (!container) return;

    const idsToRender = [];
    
    // 1. Definiere die gestuften Serien und füge die höchste erreichte Stufe hinzu
    const tieredSeries = {
        'citizens': ['citizens50', 'citizens75', 'citizens150'],
        'zombify': ['zombify5000', 'zombify7000', 'zombify15000'],
        'builder': ['builder5', 'builder20', 'builder40']
    };
    
    for (const prefix in tieredSeries) {
        const highestId = getHighestTierAchievedId(tieredSeries[prefix]);
        if (highestId) {
            idsToRender.push(highestId);
        }
    }
    
    // 2. Füge alle NICHT-gestuften Abzeichen hinzu (z.B. births100, day50)
    const allTieredIds = Object.values(tieredSeries).flat();
    
    Object.keys(ACHIEVEMENTS).forEach(id => {
        // Prüft, ob die ID NICHT zu einer gestuften Serie gehört UND freigeschaltet ist
        if (!allTieredIds.includes(id) && achievedState[id]) {
            idsToRender.push(id);
        }
    });

    // 3. Jetzt die finalen Badges rendern
    const badgesHtml = idsToRender
        .map(id => {
            const achievement = ACHIEVEMENTS[id];
            
            // Rang-Klasse abrufen (definiert bereits die Ränder Grün/Silber/Gold)
            const tierClass = getAchievementTierClass(id); 

            const imagePath = `image/${id}.png`; 
            const tooltipText = `${achievement.name} (${achievement.category}): ${achievement.description}`;

            return `
                <div class="achievement-badge unlocked ${tierClass}" title="${achievement.description}" data-achievement-id="${id}">
                    <img src="${imagePath}" alt="${achievement.name}">
                    <span class="tooltip-text">${tooltipText}</span>
                </div>
            `;
        }).join('');
    
    container.innerHTML = badgesHtml;
}

/**
 * Rendert ALLE Abzeichen (erreicht und gesperrt) in das Modal-Fenster.
 */
function renderAllAchievementsToModal() {
    const container = document.getElementById('all-achievements-container');
    if (!container) return;

    // Alle Abzeichen-IDs (Schlüssel) abrufen
    const allAchievementIds = Object.keys(ACHIEVEMENTS);

    const achievementsHtml = Object.keys(ACHIEVEMENTS).map(id => {
    const achievement = ACHIEVEMENTS[id];
    const isAchieved = achievedState[id]; // Prüft, ob es freigeschaltet ist
    
    // NEU: Füge die Tier-Klasse hinzu
    const tierClass = getAchievementTierClass(id); // <--- HIER NEU

    const imagePath = `image/${id}.png`; 
    
    // CSS-Klasse: 'unlocked' (farbig) oder 'locked' (grau)
    const statusClass = isAchieved ? 'unlocked' : 'locked';

    const tooltipText = isAchieved 
        ? `FREIGESCHALTET: ${achievement.description}` 
        : `GESPERRT: ${achievement.description}`;

    // ÄNDERE DIE KLASSEN-LISTE: Füge ${tierClass} hinzu
    return `
        <div class="achievement-modal-item ${statusClass} ${tierClass}" data-achievement-id="${id}"> 
            <img src="${imagePath}" alt="${achievement.name}" class="achievement-icon-img" 
                 title="${tooltipText}">
            <div class="badge-name">${achievement.name}</div>
        </div>
    `;
}).join('');
    
    container.innerHTML = achievementsHtml;
}

// Stellt die Funktionen global zur Verfügung, damit andere Skripte sie aufrufen können
window.checkAllAchievements = checkAllAchievements;
window.renderAllAchievementsToModal = renderAllAchievementsToModal; 
window.getAchievementTierClass = getAchievementTierClass;

window.renderDetailedAchievementsToModal = renderDetailedAchievementsToModal; // NEU

// Initiales Rendering der gespeicherten Abzeichen beim Laden
document.addEventListener('DOMContentLoaded', () => {
    // Wenn das Spiel auf dem Game-Screen gestartet ist, direkt rendern
    if (document.getElementById('game-screen') && document.getElementById('game-screen').style.display !== 'none') {
        renderBadges();
        window.renderAllAchievementsToModal(); // NEU: Übersicht initial füllen
        // Detail-Ansicht wird erst beim Klick auf den Tab gerendert
    }
});