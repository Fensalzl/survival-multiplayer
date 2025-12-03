function generateInfoContent() {
return `
<div class="info-content">
<h3>Survival Siedlung - Komplettanleitung</h3>

<div class="info-section">
<h4>📖 Spielziel</h4>
<p>Du bist der <strong>Kommandant</strong> in einer postapokalyptischen Welt. Baue eine Siedlung auf, manage Bürger und überlebe gegen Hunger, Krankheiten und Angriffe. Dein Kommandant ist <strong>unsterblich</strong>.</p>
</div>

<div class="info-section">
<h4>⏰ Tagesablauf (14 Sek = 1 Tag)</h4>
<ul>
<li><strong>Jeder Tag = 14 Sekunden</strong> (Game-Loop)</li>
<li>Gebäude verfallen <strong>täglich</strong> → reparieren![file:2]</li>
<li>Bürger bekommen Hunger/Durst → Essen/Wasser bauen!</li>
<li>Angriffe möglich → Verteidigung!</li>
</ul>
</div>

<div class="info-section">
<h4>🏗️ Erste Schritte</h4>
<ol>
<li><strong>🔨 Sofort bauen:</strong> Brunnen (Wasser) + Holzfällerhütte</li>
<li><strong>👥 Bürger zuweisen:</strong> "Siedlung" → Haus/Arbeit</li>
<li><strong>🍽️ Essen:</strong> Bauernhof → <strong>dann</strong> Feld</li>
<li><strong>🪵 Ressourcen:</strong> Holzfäller + Steinmetzwerkstatt</li>
<li><strong>🏠 Wohnraum:</strong> Hütten für mehr Bürger</li>
</ol>
</div>

<div class="info-section">
<h4>⚙️ Ressourcen</h4>
<table style="width:100%;border-collapse:collapse;font-size:0.9em;">
<tr><th>Ressource</th><th>Gefahr</th><th>Produktion</th></tr>
<tr><td>🍖 Essen</td><td>Hunger-Tode</td><td>Bauernhof, Feld*, Jagdhütte</td></tr>
<tr><td>💧 Wasser</td><td>Durst-Tode</td><td>Brunnen</td></tr>
<tr><td>🪵 Holz</td><td>Kein Bau</td><td>Holzfällerhütte</td></tr>
<tr><td>🪨 Stein</td><td>Kein Bau</td><td>Steinmetzwerkstatt</td></tr>
<tr><td>💊 Medis</td><td>Kranke sterben</td><td>Arztpraxis</td></tr>
<tr><td>🔫 Waffen</td><td>Schwache Verteidigung</td><td>Waffenschmiede**</td></tr>
</table>
<p><small>*Feld nur nach Bauernhof! **Skills nötig</small><br><strong>💡</strong> Rote blinkende Ressourcen = Gefahr!</p>
</div>

<div class="info-section">
<h4>👥 Bürger</h4>
<ul>
<li><strong>"Siedlung" klicken</strong> → Dropdowns für Haus/Arbeit</li>
<li><strong>Haus:</strong> Verhindert Flucht</li>
<li><strong>Arbeit:</strong> Nur in Gebäuden mit Plätzen</li>
<li><strong>Smiley:</strong> +10 Moral</li>
</ul>
</div>

<div class="info-section">
<h4>🏗️ Gebäude</h4>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.85em;">
<div><strong>🏠 Wohnen</strong><br>Zelt(2), Hütte(3), Blockhaus(5)</div>
<div><strong>🔨 Produktion</strong><br>Holzfäller, Steinmetz</div>
<div><strong>🍽️ Essen</strong><br>Bauernhof→Feld, Brunnen</div>
<div><strong>⚔️ Militär**</strong><br>Kaserne, Waffenschmiede</div>
<div><strong>🛡️ Verteidigung**</strong><br>Wall(+20), Wachturm</div>
<div><strong>💰 Wirtschaft**</strong><br>Markt, Bank</div>
</div>
</div>

<div class="info-section">
<h4>🛒 Markt & Skills</h4>
<ul>
<li><strong>Markt:</strong> 3 Händler, Slider kaufen/verkaufen</li>
<li><strong>Skills:</strong> Live-Ansicht, Militär, Auto-Reparatur</li>
<li><strong>Zombify:</strong> Vom Markt → Skills kaufen</li>
</ul>
</div>

<div style="background:#1a3a1a;padding:12px;border-left:4px solid #44ff44;margin:15px 0;font-size:0.95em;">
<strong>🎯 Schnellstart:</strong> Brunnen → Holzfäller → Bauernhof → Feld → Hütte!
</div>

<style>
.info-content{font-family:'Courier New',monospace;line-height:1.4;color:#ccffcc;}
.info-section{background:rgba(10,30,10,0.8);margin:10px 0;padding:12px;border-radius:5px;border-left:3px solid #44ff44;}
.info-section h4{color:#88ff88;margin:0 0 8px 0;font-size:1em;}
.info-section ul,.info-section ol{padding-left:18px;margin:6px 0;}
.info-section li{margin:3px 0;}
.info-section table{background:rgba(20,40,20,0.9);border:1px solid #44aa44;}
.info-section th,.info-section td{padding:4px 6px;border:1px solid #335533;text-align:left;}
</style>
`;
}


/**
 * Initialisiert die Logik für das Info-Modal.
 */
function initInfoModal() {
    const infoBtn = document.getElementById('infoBtn');
    const infoModal = document.getElementById('gameInfoModal');
    const closeBtn = document.getElementById('closeInfoModalBtn');
    const infoContent = document.getElementById('infoContent');

    if (!infoBtn || !infoModal || !closeBtn || !infoContent) {
        console.error("Info Modal DOM Elemente nicht gefunden!");
        return;
    }

    // Inhalt generieren und einfügen
    infoContent.innerHTML = generateInfoContent();

    // Event-Listener: Öffnen
    infoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Stellt sicher, dass das Modal sichtbar wird (über CSS-Klasse 'open')
        infoModal.classList.add('open');
    });

    // Event-Listener: Schließen (Button)
    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        infoModal.classList.remove('open');
    });

    // Event-Listener: Schließen (Außerhalb klicken)
    infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) {
            infoModal.classList.remove('open');
        }
    });

    // Event-Listener: Schließen (ESC-Taste)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && infoModal.classList.contains('open')) {
            infoModal.classList.remove('open');
        }
    });
}
