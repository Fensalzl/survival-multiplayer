// liveMonitor-stable.js
// Finale, stabile Live-Ansicht für die Session
// - Seitlicher See (links unten), leichte Wasseranimation
// - 1-2 Fischer-Bürger (gehen zum See & "angeln")
// - Gebäudepositionen bleiben während der Session stabil
// - Keine Gebäude im See
// - Dynamische Wall (konvexe Hülle) mit Kreis-Fallback
// - Panelsteuerung integriert (Achievement, Skill, Live)
// - Achievement-Reset beim Start, wenn vorhanden
// - Post-Apokalypse / Überwachungs-Cam Stil

document.addEventListener("DOMContentLoaded", () => {
  // --- Basis DOM / UI ---
  const toggleBtn = document.getElementById("liveToggle");
  const mainMonitor = document.getElementById("monitor");
  if (!toggleBtn || !mainMonitor) {
    console.error("Live Toggle Button (ID liveToggle) oder Hauptmonitor nicht gefunden!");
    return;
  }

  const MAP_W = 400, MAP_H = 410;
  let visible = false;
  let animFrame = null;
  let animating = false;

  // Container / Canvas
  const monitorDiv = document.createElement("div");
  monitorDiv.id = "liveMonitor";
  monitorDiv.style.display = "none";
  monitorDiv.style.flexDirection = "column";
  monitorDiv.style.alignItems = "center";
  monitorDiv.style.boxSizing = "border-box";
  monitorDiv.style.userSelect = "none";
  monitorDiv.innerHTML = `
    <div id="liveInfoBar" style="
         width:100%;
         background:#06120d;
         color:#88ff88;
         font-family:'Courier New';
         font-size:13px;
         padding:6px 8px;
         border-bottom:1px solid rgba(136,255,136,0.08);
         text-align:center;
         box-sizing:border-box;">Lade Spieldaten...</div>
    <div style="position:relative; width:${MAP_W}px; height:${MAP_H}px; overflow:hidden;">
      <canvas id="liveCanvas" width="${MAP_W}" height="${MAP_H}" style="position:absolute; top:0; left:0; z-index:0;"></canvas>
      <div id="liveTooltip" style="
           position:absolute;
           background:rgba(0,8,0,0.92);
           color:#dfffd8;
           font-family:'Courier New';
           font-size:12px;
           padding:5px 8px;
           border:1px solid rgba(200,255,200,0.08);
           border-radius:6px;
           pointer-events:none;
           display:none;
           z-index:6000;
           box-shadow:0 0 10px rgba(0,0,0,0.6);
           white-space:nowrap;
           max-width:260px; overflow-wrap:break-word;"></div>
    </div>
  `;
  mainMonitor.appendChild(monitorDiv);

  const canvas = document.getElementById("liveCanvas");
  const ctx = canvas.getContext("2d");
  const infoBar = monitorDiv.querySelector("#liveInfoBar");
  const tooltipElement = monitorDiv.querySelector("#liveTooltip");
  


  // --- Session-stabile Caches ---
  // buildingMap: id -> {x,y,size,type,name,isClosed}
  const buildingMap = new Map();
  let buildingList = []; // array view for drawing order

  // Citizens positions (session)
  const citizenPositions = {}; // id -> {x,y,state,dir,target,timer,job,resting}

  // Lake stored in session (one time creation)
  let lake = window._liveMonitor_session_lake || null; // keep on window so reload of script in same session keeps lake
  if (!lake) window._liveMonitor_session_lake = null;

  // last buildings hash for structural checks (not used to reposition existing)
  let lastHash = "";

  // --- Tuning params ---
  const MOVE_SPEED = 0.78;
  const TARGET_RANGE = 14;
  const INTERACTION_CHANCE = 0.0065;
  const INTERACTION_DURATION = 84;
  const CITIZEN_WANDER_DIST = 36;

  const CRT = {
    stripes: true,
    noiseAmount: 0.12,
    flickerIntensity: 0.26,
    vignetteAlpha: 0.46,
    zoomBreath: 0.008
  };

  // --- Helpers ---
  function hashBuildings(buildings) {
    try { return buildings.map(b => `${b.id}|${b.type}|${b.status||''}`).join(","); }
    catch(e){ return ""; }
  }
  function randRange(a,b){ return a + Math.random()*(b-a); }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }

  // --- Lake (fixed for session) ---
  function initLakeIfNeeded() {
    if (window._liveMonitor_session_lake) {
      lake = window._liveMonitor_session_lake;
      return;
    }
    // place lake left-bottom-ish within a safe margin
    const r = randRange(20,34);
    const x = clamp(randRange(36, MAP_W * 0.36), 36, MAP_W - 36);
    const y = clamp(randRange(MAP_H * 0.58, MAP_H - 40), 36, MAP_H - 36);
    lake = { x, y, r, baseR: r };
    window._liveMonitor_session_lake = lake;
  }

  // Ensure building not placed inside lake
  function pushOutOfLake(x,y,size) {
    if (!lake) return {x,y};
    const d = Math.hypot(x - lake.x, y - lake.y);
    const minD = lake.r + Math.max(8, size*0.6) + 6;
    if (d < minD) {
      // push along the vector away from lake center
      const ang = Math.atan2(y - lake.y, x - lake.x);
      const nx = lake.x + Math.cos(ang) * minD;
      const ny = lake.y + Math.sin(ang) * minD;
      // clamp within map
      return { x: clamp(nx, 6, MAP_W-6), y: clamp(ny, 6, MAP_H-6) };
    }
    return { x, y };
  }
/**
 * Aktualisiert den Status des Live Monitor Buttons basierend auf dem Skill Tree.
 */
window.updateLiveMonitorButtonStatus = function() {
    const toggleBtn = document.getElementById("liveToggle");
    const isUnlocked = window.skillTree && window.skillTree.liveMonitorUnlocked; 

    if (toggleBtn) {
        // 1. CSS-Klasse hinzufügen/entfernen
        if (isUnlocked) {
            toggleBtn.classList.remove('is-locked');
        } else {
            toggleBtn.classList.add('is-locked');
        }

        // 2. Disabled-Status setzen
        toggleBtn.disabled = !isUnlocked;
        
        // 3. Text setzen
        if (!isUnlocked) {
            toggleBtn.textContent = 'Live-Ansicht';
            if (window.stopLiveMonitorAnimation) {
                window.stopLiveMonitorAnimation();
            }
        } else {
            toggleBtn.textContent = 'Live-Ansicht'; // Oder ein Icon
        }
    }
};
  // Deterministic-ish position generator per id for session stability:
  // if id already exists, keep it. If new, derive pseudo-random using id string.
  function placeNewBuilding(b) {
    // seed from id to create repeatable position order in this session (but not persistent across reload)
    let nid = String(b.id || b.name || Math.random());
    // derive simple numeric seed from nid
    let seed = 0;
    for (let i = 0; i < nid.length; i++) seed = (seed * 31 + nid.charCodeAt(i)) & 0x7fffffff;
    // pseudo-rand from seed
    function sRand() {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 4294967295;
    }
    // size by type
    let baseSize = 14 + sRand()*6;
    switch ((b.type||"").toLowerCase()) {
      case "farm": baseSize = 22 + sRand()*8; break;
      case "house": baseSize = 12 + sRand()*10; break;
      case "barrack": baseSize = 14 + sRand()*12; break;
      case "tent": baseSize = 8 + sRand()*6; break;
      case "wall": baseSize = 0; break;
      default: baseSize = 10 + sRand()*12; break;
    }
    // circular distribution around center but biased away from lake area
    const center = { x: MAP_W/2, y: MAP_H/2 };
    const maxR = Math.min(MAP_W, MAP_H) * (0.36 + sRand()*0.18);
    const angle = sRand() * Math.PI * 2;
    const r = Math.sqrt(sRand()) * maxR * (0.55 + sRand()*0.45);
    let x = center.x + Math.cos(angle)*r + randRange(-6,6);
    let y = center.y + Math.sin(angle)*r + randRange(-6,6);

    // push out if too close to lake
    ({x,y} = pushOutOfLake(x,y, baseSize));

    // clamp inside map
    x = clamp(x, 8, MAP_W-8);
    y = clamp(y, 8, MAP_H-8);

    return { id: b.id, name: b.name||"", x, y, size: Math.max(6, baseSize), type: b.type||"house", isClosed: b.status === "closed" };
  }

  // Build building list from window.buildings, but preserve existing placements
  function syncBuildings(buildings) {
    // add new ones, leave existing where they are
    const existingIds = new Set(buildingMap.keys());
    for (const b of buildings) {
      if (!buildingMap.has(b.id)) {
        const p = placeNewBuilding(b);
        buildingMap.set(b.id, p);
      } else {
        // update metadata (name/type/isClosed) but preserve x,y,size
        const cur = buildingMap.get(b.id);
        cur.name = b.name || cur.name;
        cur.type = b.type || cur.type;
        cur.isClosed = b.status === "closed";
      }
    }
    // remove entries for buildings that were removed from game
    for (const id of Array.from(buildingMap.keys())) {
      if (!buildings.some(bb => bb.id === id)) buildingMap.delete(id);
    }
    // rebuild ordered list
    buildingList = Array.from(buildingMap.values());
  }

  // --- Simple convex hull (Monotone chain) for wall polygon ---
  function convexHullPoints(points, padding = 10) {
    if (!points || points.length < 1) return [];
    const pts = points.map(p => [p.x, p.y]).sort((a,b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);
    const cross = (o,a,b) => (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0]);
    const lower = [];
    for (const p of pts) {
      while (lower.length >= 2 && cross(lower[lower.length-2], lower[lower.length-1], p) <= 0) lower.pop();
      lower.push(p);
    }
    const upper = [];
    for (let i = pts.length-1; i>=0; i--) {
      const p = pts[i];
      while (upper.length >= 2 && cross(upper[upper.length-2], upper[upper.length-1], p) <= 0) upper.pop();
      upper.push(p);
    }
    upper.pop(); lower.pop();
    const hull = lower.concat(upper);
    if (hull.length === 0) return [];
    // expand slightly outward from centroid
    const cx = hull.reduce((s,p)=> s+p[0],0)/hull.length;
    const cy = hull.reduce((s,p)=> s+p[1],0)/hull.length;
    return hull.map(p => {
      const dx = p[0] - cx, dy = p[1] - cy;
      const d = Math.hypot(dx,dy) || 1;
      return { x: p[0] + (dx/d)*padding, y: p[1] + (dy/d)*padding };
    });
  }

  // --- Paths (simple MST-like) ---
  function buildPaths(placed) {
    if (!placed || placed.length < 2) return [];
    const nodes = placed.map((p,i)=> ({...p, i}));
    const inTree = new Set([0]);
    const paths = [];
    while (inTree.size < nodes.length) {
      let best = {d: Infinity, a:-1, b:-1};
      for (const i of inTree) {
        for (let j=0;j<nodes.length;j++){
          if (inTree.has(j)) continue;
          const d = dist(nodes[i], nodes[j]);
          if (d < best.d) best = {d,a:i,b:j};
        }
      }
      if (best.a >= 0) { paths.push({from:{x:nodes[best.a].x,y:nodes[best.a].y}, to:{x:nodes[best.b].x,y:nodes[best.b].y}}); inTree.add(best.b); }
      else break;
    }
    // add a couple of nearest-neighbour links for mesh
    for (let i=0;i<nodes.length;i++){
      const sorted = nodes.slice().sort((a,b)=> dist(nodes[i],a) - dist(nodes[i],b));
      for (let k=1;k<=2 && k<sorted.length;k++){
        const a = nodes[i], b = sorted[k];
        if (!paths.some(p => (p.from.x===a.x && p.to.x===b.x && p.from.y===a.y && p.to.y===b.y) ||
                             (p.from.x===b.x && p.to.x===a.x && p.from.y===b.y && p.to.y===a.y))) {
          paths.push({from:{x:a.x,y:a.y}, to:{x:b.x,y:b.y}});
        }
      }
    }
    return paths;
  }

  // --- Citizens: targets & updates (with fishing behavior) ---
  function getRandomBuildingOfType(type) {
    const candidates = buildingList.filter(b => (b.type||"").toLowerCase() === (type||"").toLowerCase() && b.size > 0);
    if (!candidates.length) return null;
    return candidates[Math.floor(Math.random()*candidates.length)];
  }
  function getRandomBuildingPoint() {
    if (!buildingList.length) return { x: MAP_W/2, y: MAP_H/2 };
    const bp = buildingList[Math.floor(Math.random() * buildingList.length)];
    return { x: bp.x + randRange(-10,10), y: bp.y + randRange(-10,10) };
  }
  function getWorkTargetForJob(job) {
    if (!job) return getRandomBuildingPoint();
    const j = job.toLowerCase();
    if (j.includes("bauer")) return getRandomBuildingOfType("farm") || getRandomBuildingPoint();
    if (j.includes("sold") || j.includes("wache") || j.includes("krieger")) return getRandomBuildingOfType("barrack") || getRandomBuildingPoint();
    return getRandomBuildingPoint();
  }
  function getRandomWanderPointAround(px,py) {
    const ang = Math.random()*Math.PI*2;
    return { x: px + Math.cos(ang)*CITIZEN_WANDER_DIST*(0.6+Math.random()), y: py + Math.sin(ang)*CITIZEN_WANDER_DIST*(0.6+Math.random()) };
  }

  // Choose random lake-edge point for leisure
  function lakeEdgePoint() {
    if (!lake) return null;
    const ang = Math.random()*Math.PI*2;
    const r = lake.r * (0.6 + Math.random()*0.35);
    return { x: lake.x + Math.cos(ang)*r, y: lake.y + Math.sin(ang)*r, meta: "lake" };
  }

  function updateCitizens(citizens) {
    const pts = [];
    
    // Entferne tote Bürger aus citizenPositions
    const aliveCitizenIds = new Set((citizens || []).filter(c => !c.tot).map(c => c.id));
    for (const id in citizenPositions) {
      if (!aliveCitizenIds.has(id)) {
        delete citizenPositions[id];
      }
    }
    
    // pick 1-2 fisher candidates occasionally (job or random)
    // but we'll assign leisure/fishing by state machine below
    for (const c of (citizens || []).filter(ci => !ci.tot)) {
      if (!citizenPositions[c.id]) {
        const p = getRandomBuildingPoint();
        const role = c.job || (Math.random() < 0.08 ? "Bauer" : "Bürger");
        let target = getWorkTargetForJob(role);
        if (target) target = { x: target.x + randRange(-6,6), y: target.y + randRange(-6,6) };
        citizenPositions[c.id] = {
          x: p.x, y: p.y,
          state: "idle",
          dir: Math.random()*Math.PI*2,
          timer: Math.floor(Math.random()*40 + 10),
          name: c.name || "",
          target: target || getRandomBuildingPoint(),
          job: role,
          resting: false
        };
      }
      const pos = citizenPositions[c.id];
      
      // Wichtig: Name aktualisieren falls geändert
      pos.name = c.name || pos.name;

      // state machine
      if (pos.state === "interacting") {
        pos.timer--;
        if (pos.timer <= 0) { pos.state = "idle"; pos.timer = Math.floor(Math.random()*40+20); pos.target = getRandomWanderPointAround(pos.x,pos.y); }
      } else if (pos.state === "resting") {
        pos.timer--;
        if (pos.timer <= 0) {
          if (Math.random() < 0.45) { pos.state = "goingHome"; const h = getRandomBuildingOfType("house"); pos.target = h ? {x:h.x,y:h.y} : getRandomBuildingPoint(); }
          else { pos.state = "wandering"; pos.target = getRandomWanderPointAround(pos.x,pos.y); }
        }
      } else if (pos.state === "goingToWork") {
        const dx = pos.target.x - pos.x, dy = pos.target.y - pos.y, d = Math.hypot(dx,dy);
        if (d < TARGET_RANGE) { pos.state = "idle"; pos.timer = Math.floor(Math.random()*60+12); }
        else { pos.dir = Math.atan2(dy,dx); pos.x += Math.cos(pos.dir)*MOVE_SPEED*1.02; pos.y += Math.sin(pos.dir)*MOVE_SPEED*1.02; }
      } else if (pos.state === "goingToLeisure") {
        const dx = pos.target.x - pos.x, dy = pos.target.y - pos.y, d = Math.hypot(dx,dy);
        if (d < Math.max(8, TARGET_RANGE*0.9)) {
          // if at lake -> fish/rest/walk
          if (pos.target.meta === "lake") {
            const r = Math.random();
            if (r < 0.48) { pos.state = "resting"; pos.timer = Math.floor(Math.random()*160+60); pos.resting = true; }
            else if (r < 0.86) { pos.state = "idle"; pos.timer = Math.floor(Math.random()*40+10); pos.resting = false; }
            else { pos.state = "wandering"; pos.target = getRandomWanderPointAround(pos.x,pos.y); pos.resting = false; }
          } else {
            pos.state = "idle"; pos.timer = Math.floor(Math.random()*50+18);
          }
        } else {
          pos.dir = Math.atan2(dy,dx);
          pos.x += Math.cos(pos.dir)*MOVE_SPEED*0.98;
          pos.y += Math.sin(pos.dir)*MOVE_SPEED*0.98;
        }
      } else if (pos.state === "wandering") {
        const dx = pos.target.x - pos.x, dy = pos.target.y - pos.y, d = Math.hypot(dx,dy);
        if (d < TARGET_RANGE*0.9) { pos.state = "idle"; pos.timer = Math.floor(Math.random()*40+16); }
        else { pos.dir = Math.atan2(dy,dx); pos.x += Math.cos(pos.dir)*MOVE_SPEED*0.7; pos.y += Math.sin(pos.dir)*MOVE_SPEED*0.7; }
      } else { // idle
        pos.timer--;
        if (pos.timer <= 0) {
          const r = Math.random();
          if (r < 0.18) { pos.state = "goingToWork"; pos.target = getWorkTargetForJob(pos.job) || getRandomBuildingPoint(); }
          else if (r < 0.44 && lake) { // go to leisure / lake
            pos.state = "goingToLeisure"; pos.target = lakeEdgePoint() || getRandomBuildingPoint();
          }
          else if (r < 0.72) { pos.state = "wandering"; pos.target = getRandomWanderPointAround(pos.x,pos.y); }
          else { pos.state = "goingHome"; const h = getRandomBuildingOfType("house"); pos.target = h ? {x:h.x,y:h.y} : getRandomBuildingPoint(); }
        }
        pos.x += (Math.random()-0.5)*0.3; pos.y += (Math.random()-0.5)*0.28;
      }

      // meeting logic - small chance to interact with a nearby idle/wandering
      if (pos.state !== "interacting" && pos.state !== "resting" && Math.random() < INTERACTION_CHANCE) {
        for (const cid of Object.keys(citizenPositions)) {
          if (cid === c.id) continue;
          const op = citizenPositions[cid];
          if (!op) continue;
          if (op.state === "idle" || op.state === "wandering") {
            const d = Math.hypot(pos.x - op.x, pos.y - op.y);
            if (d < 12 + Math.random()*6) {
              pos.state = op.state = "interacting";
              pos.timer = op.timer = Math.floor(INTERACTION_DURATION * (0.6 + Math.random()*0.8));
              const ang = Math.atan2(op.y - pos.y, op.x - pos.x);
              pos.dir = ang; op.dir = ang + Math.PI;
              break;
            }
          }
        }
      }

      // clamps
      pos.x = clamp(pos.x, 6, MAP_W-6); pos.y = clamp(pos.y, 6, MAP_H-6);

      pts.push({ ...pos, id: c.id, interact: pos.state === "interacting" || pos.resting, job: c.job });
    }
    return pts;
  }

  // --- Drawing functions ---
  function drawVegetation(seed) {
    ctx.save();
    for (let i=0;i<14;i++){
      const x = 10 + ((i*31 + Math.floor(i*7)) % (MAP_W-20)) + Math.sin(seed + i)*1.8;
      const y = 14 + ((i*13) % (MAP_H-36));
      const h = 5 + (i%3)*2;
      ctx.beginPath();
      ctx.fillStyle = "rgba(20,60,20,0.95)";
      ctx.ellipse(x,y,h*1.1,h*0.7,0,0,Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLake() {
    if (!lake) return;
    ctx.save();
    // water with subtle radial gradient and slight wobble
    const wobble = Math.sin(performance.now()/900) * 0.02;
    const rX = lake.r * 1.05, rY = lake.r * 0.72;
    const grd = ctx.createRadialGradient(lake.x + wobble*6, lake.y - wobble*4, lake.r*0.08, lake.x, lake.y, lake.r*1.1);
    grd.addColorStop(0, "rgba(70,110,150,0.92)");
    grd.addColorStop(1, "rgba(8,28,50,0.78)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(lake.x, lake.y, rX, rY, Math.sin(performance.now()/1200)*0.02, 0, Math.PI*2);
    ctx.fill();

    // subtle shore highlight
    ctx.strokeStyle = "rgba(200,230,210,0.06)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawPaths(paths) {
    if (!paths) return;
    ctx.save();
    ctx.strokeStyle = "rgba(120,95,62,0.36)";
    ctx.lineWidth = 4;
    for (const p of paths) {
      ctx.beginPath();
      ctx.moveTo(p.from.x, p.from.y);
      const midX = (p.from.x + p.to.x)/2 + (Math.random()-0.5)*8;
      const midY = (p.from.y + p.to.y)/2 + (Math.random()-0.5)*6;
      ctx.quadraticCurveTo(midX, midY, p.to.x, p.to.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWall(hull) {
    ctx.save();

    // Prüfe ob mindestens eine Wall gebaut wurde
    const hasWall = buildingList.some(b => b.type?.toLowerCase() === "wall");
    
    if (hasWall) {
      // Wall ist gebaut → zeichne eine VERSTÄRKTE Umrandung um ALLE Gebäude
      if (hull && hull.length >= 3) {
        // Konvexe Hülle um alle Gebäude (verstärkt)
        ctx.beginPath();
        ctx.moveTo(hull[0].x, hull[0].y);
        for (let i = 1; i < hull.length; i++) ctx.lineTo(hull[i].x, hull[i].y);
        ctx.closePath();
        
        // Hintergrund-Füllung (leicht grün)
        ctx.fillStyle = "rgba(10,40,10,0.15)";
        ctx.fill();
        
        // Dicke, leuchtende grüne Linie für die Wall
        ctx.lineWidth = 6;
        ctx.strokeStyle = "rgba(100,255,100,0.8)";
        ctx.stroke();
        
        // Zusätzlicher äußerer Glow-Effekt
        ctx.lineWidth = 10;
        ctx.strokeStyle = "rgba(100,255,100,0.3)";
        ctx.stroke();
      } else {
        // Fallback-Kreis wenn zu wenig Gebäude für konvexe Hülle
        const pts = buildingList.filter(b => b.size > 0 && b.type?.toLowerCase() !== "wall");
        if (pts.length) {
          const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
          const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
          const r = Math.max(...pts.map(p => Math.hypot(p.x - cx, p.y - cy))) + 50;
          
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          
          // Verstärkte Wall-Darstellung
          ctx.strokeStyle = "rgba(100,255,100,0.8)";
          ctx.lineWidth = 6;
          ctx.stroke();
          
          // Glow
          ctx.strokeStyle = "rgba(100,255,100,0.3)";
          ctx.lineWidth = 10;
          ctx.stroke();
        }
      }
    } else {
      // Keine Wall gebaut → schwache Standard-Umrandung
      if (hull && hull.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(hull[0].x, hull[0].y);
        for (let i = 1; i < hull.length; i++) ctx.lineTo(hull[i].x, hull[i].y);
        ctx.closePath();
        ctx.fillStyle = "rgba(4,8,4,0.06)";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(80,200,80,0.18)";
        ctx.stroke();
      } else {
        // Fallback-Kreis ohne Wall
        const pts = buildingList.filter(b => b.size > 0);
        if (pts.length) {
          const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
          const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
          const r = Math.max(...pts.map(p => Math.hypot(p.x - cx, p.y - cy))) + 40;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(80,200,80,0.18)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  function drawBuildings(list, flick) {
    for (const b of list) {
      ctx.save();
      ctx.translate(b.x, b.y);
      let fill = "#77ff77";
      switch ((b.type||"").toLowerCase()) {
        case "house": fill = b.isClosed ? "#114422" : "#66cc66"; break;
        case "tent": fill = b.isClosed ? "#444444" : "#cfcfcf"; break;
        case "farm": fill = b.isClosed ? "#553300" : "#ffcc55"; break;
        case "barrack": fill = b.isClosed ? "#552222" : "#ff6666"; break;
		case "schafsfarm": fill = b.isClosed ? "#553333" : "#ffddaa"; break;
        case "spinnerei": fill = b.isClosed ? "#443355" : "#cc88ff"; break;
        case "weberei": fill = b.isClosed ? "#334455" : "#88ccff"; break;
        case "schneiderei": fill = b.isClosed ? "#445533" : "#aaffcc"; break;
            
        default: fill = b.isClosed ? "#115511" : "#77ff77"; break;
      }
      ctx.fillStyle = fill;
      ctx.globalAlpha = 0.95 + Math.sin(flick + b.x*0.03) * 0.03;
      const s = Math.max(6, b.size);
      switch ((b.type||"").toLowerCase()) {
        case "tent":
          ctx.beginPath();
          ctx.moveTo(0,-s);
          ctx.lineTo(s*0.9, s*0.6);
          ctx.lineTo(-s*0.9, s*0.6);
          ctx.closePath();
          ctx.fill();
          break;
        case "farm":
          ctx.beginPath();
          ctx.rect(-s/1.2, -s/2, s*1.2, s*0.8);
          ctx.fill();
          break;
        case "barrack":
          ctx.beginPath();
          ctx.rect(-s*0.9, -s*0.45, s*1.8, s*0.9);
          ctx.fill();
          break;
        default:
          ctx.beginPath();
          ctx.rect(-s/2, -s/2, s, s);
          ctx.fill();
          ctx.fillStyle = "#6c3a12";
          ctx.beginPath();
          ctx.moveTo(-s/2, -s/2);
          ctx.lineTo(0, -s*0.95);
          ctx.lineTo(s/2, -s/2);
          ctx.closePath();
          ctx.fill();
          break;
      }
      ctx.font = "10px Courier New";
      ctx.fillStyle = "rgba(0,50,0,0.9)";
      ctx.fillText((b.name||"?").charAt(0).toUpperCase(), -4, -s - 6);
      ctx.restore();
    }
  }

  function drawCitizens(pts, flick) {
    for (const p of pts) {
      ctx.save();
      const jx = Math.sin(flick*2 + p.x*0.12)*0.9 + (Math.random()-0.5)*0.35;
      const jy = Math.cos(flick*3 + p.y*0.08)*0.9 + (Math.random()-0.5)*0.35;
      const px = p.x + jx, py = p.y + jy;
      const r = p.job && (String(p.job).toLowerCase().includes("sold") || String(p.job).toLowerCase().includes("wache")) ? 4.6 : 4.2;
      let color = "#88ff88";
      const job = String(p.job||"").toLowerCase();
      if (job.includes("sold") || job.includes("wache")) color = "#66ffff";
      else if (job.includes("bauer")) color = "#ffb766";
      else if (p.isPlayer) color = "#ffff88";
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI*2);
      ctx.fillStyle = color;
      if (p.interact) { ctx.shadowColor = "rgba(255,240,200,0.9)"; ctx.shadowBlur = 8; }
      else ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.9 + (p.interact ? 0.06 : 0) + Math.sin(flick*2 + p.x*0.01)*0.03;
      ctx.fill();
      ctx.shadowBlur = 0;
      // direction hint
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(p.dir||0)*(r+3), py + Math.sin(p.dir||0)*(r+3));
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();
      // resting indicator
      if (p.interact && p.resting) {
        ctx.beginPath();
        ctx.moveTo(px-5, py+6); ctx.lineTo(px+5, py+6);
        ctx.strokeStyle = "rgba(0,0,0,0.06)";
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Surveillance overlay (Post-Apocalypse look)
  function drawSurveillance(flick) {
    // scanlines and green tint
    if (CRT.stripes) {
      ctx.save();
      for (let y=0;y<MAP_H;y+=2){
        ctx.globalAlpha = (y%6===0) ? 0.22 : 0.08;
        ctx.fillStyle = "rgba(6,22,8,1)";
        ctx.fillRect(0,y,MAP_W,1);
      }
      ctx.globalAlpha = 1; ctx.restore();
    }

    // vignette & frame noise
    ctx.save();
    const g = ctx.createRadialGradient(MAP_W/2, MAP_H/2, MAP_W*0.08, MAP_W/2, MAP_H/2, MAP_W*0.95);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${CRT.vignetteAlpha})`);
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.6 * Math.abs(Math.sin(flick*0.6));
    ctx.fillRect(0,0,MAP_W,MAP_H);
    ctx.globalAlpha = 1;
    ctx.restore();

    // random noise lines
    for (let i=0;i<12 * CRT.noiseAmount;i++){
      const nx = Math.random()*MAP_W, ny = Math.random()*MAP_H, nl = Math.random()*24 + 4;
      ctx.save();
      ctx.strokeStyle = `rgba(70,220,90,${0.04 + Math.random()*0.09})`;
      ctx.globalAlpha = 0.05 + Math.abs(Math.sin(flick*1.3))*CRT.flickerIntensity;
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(nx + nl, ny);
      ctx.stroke();
      ctx.restore();
    }

    // slight horizontal roll element
    ctx.save();
    const roll = Math.sin(performance.now()/1600)*1.2;
    ctx.globalAlpha = 0.03 + Math.abs(Math.sin(flick*3))*0.02;
    ctx.fillStyle = "rgba(0,8,0,1)";
    ctx.fillRect(0, (MAP_H*0.12 + roll), MAP_W, 2);
    ctx.restore();
  }

  // --- Main animate loop ---
  let currentPaths = [];
  let currentHull = [];

  function animate() {
    if (!visible) { animating = false; return; }
    animating = true;

    // keep a single RAF loop
    if (animFrame) cancelAnimationFrame(animFrame);

    // background + zoom-breath transform
    const breath = 1 + Math.sin(performance.now()/1400) * CRT.zoomBreath;
    ctx.save();
    ctx.clearRect(0,0,MAP_W,MAP_H);
    ctx.translate(MAP_W/2, MAP_H/2);
    ctx.scale(breath, breath);
    ctx.translate(-MAP_W/2, -MAP_H/2);

    ctx.fillStyle = "#04120b";
    ctx.fillRect(0,0,MAP_W,MAP_H);

    // check game-provided arrays
    if (typeof window.buildings === "undefined" || typeof window.citizens === "undefined" || !Array.isArray(window.buildings) || !Array.isArray(window.citizens)) {
      infoBar.textContent = "Lade Spieldaten...";
      ctx.restore();
      animFrame = requestAnimationFrame(animate);
      return;
    }

    // sync building placements (new ones only)
    syncBuildings(window.buildings || []);
    
    // recompute structural things (paths/hull)
    const validBuildings = buildingList.filter(b => b.size > 0 && b.type.toLowerCase() !== "wall");
    currentPaths = buildPaths(validBuildings);
    const hullPoints = validBuildings.map(b => ({ x: b.x, y: b.y }));
    if (hullPoints.length >= 3) {
      currentHull = convexHullPoints(hullPoints, 10);
    } else if (hullPoints.length > 0) {
      // fallback circle if not enough points
      const cx = hullPoints.reduce((s,p)=>s+p.x,0)/hullPoints.length;
      const cy = hullPoints.reduce((s,p)=>s+p.y,0)/hullPoints.length;
      const maxd = Math.max(...hullPoints.map(p => Math.hypot(p.x - cx, p.y - cy))) + 24;
      currentHull = [{x:cx, y:cy, r:maxd, fallback:true}];
    }

    // lake init once (session)
    initLakeIfNeeded();

    // lake slight wave (adjust radius small)
    lake.r = lake.baseR + Math.sin(performance.now()/1000) * 0.6;

    // flicker factor
    const flick = performance.now() / 800 + Math.random()*0.25;

    // Draw order (back to front)
    drawVegetation(flick*0.8);
    drawLake();
    drawPaths(currentPaths);
    drawWall(currentHull);
    drawBuildings(buildingList, flick);

    // citizens update & draw
    const cp = updateCitizens(window.citizens || []);
    drawCitizens(cp, flick);

    ctx.restore(); // restore transform

    // surveillance overlay
    drawSurveillance(flick);

    // info bar
    const aliveCount = (window.citizens || []).filter(c => !c.tot).length;
    infoBar.textContent = `👥 Bürger: ${aliveCount} | 🏠 Gebäude: ${buildingList.length}`;

    animFrame = requestAnimationFrame(animate);
  }

  function resetAchievements() {
    localStorage.removeItem('survivalSiedlungAchievements');
    achievedState = {};
    renderBadges();
    console.log("Abzeichen-Fortschritt wurde zurückgesetzt.");
  }

  // --- Panelsteuerung (integriert) ---
  const achievementPanel = document.getElementById('achievementPanel');
  const openAchievementBtn = document.getElementById('openAchievementModalButton');
  const closeAchievementBtn = document.getElementById('closeAchievementModal');

  const skillPanel = document.getElementById('skillTreePanel');
  const openSkillBtn = document.getElementById('openSkillTreeSettingsBtn');
  const closeSkillBtn = document.getElementById('closeSkillTreePanel');

  window.checkAllAchievements = checkAllAchievements;
  window.renderAllAchievementsToModal = renderAllAchievementsToModal;
  window.resetAchievements = resetAchievements;

  function panelsList() {
    return [
      { el: monitorDiv, key: "live", className: "live-active" },
      { el: achievementPanel, key: "achievement", className: "achievement-active" },
      { el: skillPanel, key: "skill", className: "skill-active" }
    ];
  }

  function closeAllPanels(except = null) {
    for (const p of panelsList()) {
      if (!p.el) continue;
      if (except !== p.key) {
        p.el.classList.remove('active');
        mainMonitor.classList.remove(p.className);
        setTimeout(()=>{ try{ p.el.style.display = 'none'; } catch(e){} }, 300);
        if (p.key === "live") {
          visible = false;
          if (animFrame) cancelAnimationFrame(animFrame);
          animFrame = null;
          animating = false;
        }
      }
    }
  }

  function toggleAchievementPanel(forceClose = false) {
    if (!achievementPanel) return;
    const active = achievementPanel.classList.contains('active');
    if (active || forceClose) {
      achievementPanel.classList.remove('active');
      mainMonitor.classList.remove('achievement-active');
      setTimeout(()=>achievementPanel.style.display='none',300);
    } else {
      closeAllPanels("achievement");
      achievementPanel.style.display = 'block';
      if (window.renderAllAchievementsToModal) window.renderAllAchievementsToModal();
      mainMonitor.classList.add('achievement-active');
      setTimeout(()=>achievementPanel.classList.add('active'),12);
    }
  }
  if (openAchievementBtn) openAchievementBtn.addEventListener('click', ()=>toggleAchievementPanel());
  if (closeAchievementBtn) closeAchievementBtn.addEventListener('click', ()=>toggleAchievementPanel(true));

  function toggleSkillPanel(forceClose = false) {
    if (!skillPanel) return;
    const active = skillPanel.classList.contains('active');
    if (active || forceClose) {
      skillPanel.classList.remove('active');
      mainMonitor.classList.remove('skill-active');
      setTimeout(()=>skillPanel.style.display='none',300);
    } else {
      closeAllPanels("skill");
      skillPanel.style.display = 'block';
      if (window.openSkillTreePanel) window.openSkillTreePanel();
      mainMonitor.classList.add('skill-active');
      setTimeout(()=>skillPanel.classList.add('active'),12);
    }
  }
  if (openSkillBtn) openSkillBtn.addEventListener('click', ()=>toggleSkillPanel());
  if (closeSkillBtn) closeSkillBtn.addEventListener('click', ()=>toggleSkillPanel(true));

  // Live toggle
  toggleBtn.addEventListener('click', ()=>{
    window.liveCitizens = window.citizens;
    window.buildingList = window.buildings;
    const active = monitorDiv.classList.contains('active');
    if (active) {
      monitorDiv.classList.remove('active'); mainMonitor.classList.remove('live-active');
      setTimeout(()=>monitorDiv.style.display='none',300);
      visible = false;
      if (animFrame) cancelAnimationFrame(animFrame);
      animFrame = null; animating = false;
    } else {
      closeAllPanels("live");
      monitorDiv.style.display = 'flex';
      setTimeout(()=>{ monitorDiv.classList.add('active'); mainMonitor.classList.add('live-active'); }, 12);
      visible = true;
      if (!animating) animate();
    }
    toggleBtn.textContent = 'Live-Ansicht';
  });

  // Canvas tooltip interactions wurden durch das Hover-Inspect-System ersetzt

  // --- Achievement reset at start (if function exists) ---
  if (window.checkAllAchievements) {
    try { window.checkAllAchievements(); } catch(e){ /* ignore errors from external function */ }
  }

  // initial lake & ensure building sync (if game already has data)
  initLakeIfNeeded();
  if (Array.isArray(window.buildings)) syncBuildings(window.buildings || []);

  // Make a small helper available
  window.liveMonitorForceRefresh = function() {
    // use to force recompute of paths/wall without moving buildings
    buildingList = Array.from(buildingMap.values());
    // recompute paths & hull quickly
    currentPaths = buildPaths(buildingList);
    currentHull = convexHullPoints(buildingList.filter(b => b.size>0).map(b=>({x:b.x,y:b.y})), 10);
  };

  // === Hover-Inspect Funktion ===
  const tooltip = document.createElement("div");
  tooltip.style.position = "fixed";
  tooltip.style.pointerEvents = "none";
  tooltip.style.background = "rgba(0, 0, 0, 0.9)";
  tooltip.style.color = "#0f0";
  tooltip.style.padding = "6px 10px";
  tooltip.style.borderRadius = "4px";
  tooltip.style.fontSize = "13px";
  tooltip.style.fontFamily = "monospace";
  tooltip.style.display = "none";
  tooltip.style.zIndex = 9999;
  tooltip.style.border = "1px solid #0f0";
  document.body.appendChild(tooltip);

  let lastHover = null;

  canvas.addEventListener("mousemove", (e) => {
    // Nur aktiv, wenn Skill freigeschaltet ist UND Monitor sichtbar
    if (!visible || !window.skillTree || !window.skillTree.hoverInspectUnlocked) {
      if (tooltip.style.display !== "none") {
        tooltip.style.display = "none";
      }
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let found = null;

    // --- Bewohner checken (nutze citizenPositions) ---
    let closestDist = Infinity;
    let closestCitizen = null;
    
    for (const cid in citizenPositions) {
      const c = citizenPositions[cid];
      if (!c) continue;
      
      const dx = x - c.x;
      const dy = y - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 12 && dist < closestDist) { // Radius um den Bürger (vergrößert auf 12)
        closestDist = dist;
        closestCitizen = c;
      }
    }
    
    if (closestCitizen) {
      found = `👤 ${closestCitizen.name || "Bewohner"}`;
    }

    // --- Gebäude checken (nur wenn kein Bürger gefunden) ---
    if (!found) {
      for (const b of buildingList) {
        const dx = x - b.x;
        const dy = y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < Math.max(12, b.size * 0.9)) {
          found = `🏠 ${b.name || b.type || "Gebäude"}`;
          break;
        }
      }
    }

    // --- See checken ---
    if (!found && lake) {
      const dx = x - lake.x;
      const dy = y - lake.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < lake.r * 1.1) {
        found = `🌊 See – Entspannen & Angeln`;
      }
    }

    if (found !== lastHover) {
      lastHover = found;
      if (found) {
        tooltip.textContent = found;
        tooltip.style.left = (e.clientX + 15) + "px";
        tooltip.style.top = (e.clientY + 15) + "px";
        tooltip.style.display = "block";
      } else {
        tooltip.style.display = "none";
      }
    }
  });

  canvas.addEventListener("mouseleave", () => {
    tooltip.style.display = "none";
    lastHover = null;
  });

  // Export some helpers for other modules
  window.openAchievementPanel = () => toggleAchievementPanel(false);
  window.openSkillPanel = () => toggleSkillPanel(false);
  window.closeAllPanels = closeAllPanels;
  window.updateLiveMonitorButtonStatus();
});