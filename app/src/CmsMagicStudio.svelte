<script>
  import { fade } from "svelte/transition";
  import { onDestroy } from "svelte";
  import { GAMES, cmsGameEffects, cmsDraftGameEffects, saveToServer } from "./store.js";
  import { get } from "svelte/store";

  let selectedGame = null;
  let phase = "idle";
  let proposals = [];
  let saveFeedback = "";

  // ── Effect themes ──────────────────────────────────────────────────────
  const THEMES = [
    { key:"lightning", label:"⚡ Zeus Lightning",   color1:"#818cf8", color2:"#60a5fa", cats:["zei","mitologie"] },
    { key:"sand",      label:"✨ Golden Sands",      color1:"#fbbf24", color2:"#f59e0b", cats:["egipt"] },
    { key:"royal",     label:"👑 Royal Sparkle",     color1:"#facc15", color2:"#ef4444", cats:["coroane"] },
    { key:"fire",      label:"🔥 Blazing Fire",      color1:"#f97316", color2:"#fbbf24", cats:["septari","fructe","clasic"] },
    { key:"water",     label:"💧 Deep Water",        color1:"#38bdf8", color2:"#0ea5e9", cats:["pesti"] },
    { key:"stars",     label:"🌟 Stardust",          color1:"#e879f9", color2:"#818cf8", cats:["stele","zodiac"] },
    { key:"candy",     label:"🍬 Sugar Burst",       color1:"#f472b6", color2:"#fb923c", cats:["dulciuri"] },
    { key:"luxe",      label:"💎 VIP Diamond",       color1:"#22d3ee", color2:"#a78bfa", cats:["live","masa","carti"] },
  ];
  const DEFAULT = { key:"gold", label:"✨ Gold Rush", color1:"#fbbf24", color2:"#86efac", cats:[] };

  function getTheme(game) {
    if (!game) return DEFAULT;
    const n = (game.n || "").toLowerCase();
    const c = game.c || [];
    // name-first (reliable for 6000+ games)
    if (/olympus|zeus|thor|poseidon|hades|lightning|thunder/.test(n)) return THEMES[0];
    if (/egypt|book of ra|pharaoh|cleopatra|anubis|scarab|dead|legacy/.test(n)) return THEMES[1];
    if (/crown|regal|royal|noble|shining|imperial/.test(n)) return THEMES[2];
    if (/\bhot\b|fire|burning|sizzling|flaming|blazing|inferno/.test(n)) return THEMES[3];
    if (/bass|fish|ocean|shark|sea|water|dive|nemo/.test(n)) return THEMES[4];
    if (/star|zodiac|moon|galaxy|cosmic|space|astro/.test(n)) return THEMES[5];
    if (/bonanza|candy|sweet|sugar|fruit|cherry/.test(n)) return THEMES[6];
    if (/poker|blackjack|roulette|baccarat|live/.test(n)) return THEMES[7];
    // category fallback
    for (const t of THEMES) if (t.cats.some(k => c.includes(k))) return t;
    return DEFAULT;
  }

  // ── Canvas renderer ────────────────────────────────────────────────────
  const rids = {};

  function hex(h) {
    return { r:parseInt(h.slice(1,3),16), g:parseInt(h.slice(3,5),16), b:parseInt(h.slice(5,7),16) };
  }

  function renderFX(canvas, theme, variant) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width  = canvas.offsetWidth  || 220;
    const H = canvas.height = canvas.offsetHeight || 290;
    const c1 = hex(theme.color1), c2 = hex(theme.color2);
    const ity = [0.6, 0.85, 1.0][variant - 1];
    const cnt = [90, 180, 320][variant - 1];

    // Build particles
    const isEmber  = theme.key === "fire";
    const isBubble = theme.key === "water";
    const newP = () => ({
      x:    Math.random() * W,
      y:    isEmber || isBubble ? H + Math.random() * 30 : Math.random() * H,
      vx:   (Math.random() - 0.5) * (isEmber ? 1.4 : 0.8) * variant,
      vy:   isEmber  ? -(Math.random() * 3.5 + 2) * variant
          : isBubble ? -(Math.random() * 1.2 + 0.4)
          : (Math.random() - 0.5) * 1.0 * variant,
      sz:   (Math.random() * 12 + 6) * (variant * 0.35 + 0.65),
      life: Math.random(),
      spd:  (Math.random() * 0.013 + 0.007) * variant,
    });
    let pts = Array.from({ length: cnt }, newP);

    // Lightning bolt
    let boltT = 0;
    const bFreq = [65, 38, 16][variant - 1];
    function bolt(a) {
      let bx = W * 0.15 + Math.random() * W * 0.7, by = 0;
      ctx.beginPath(); ctx.moveTo(bx, by);
      while (by < H) {
        bx = Math.max(4, Math.min(W-4, bx + (Math.random()-0.5)*55));
        by += Math.random()*26+9;
        ctx.lineTo(bx, by);
      }
      ctx.lineWidth = variant * 2.5 + 1.5;
      ctx.strokeStyle = `rgba(255,255,255,${a*0.5})`;
      ctx.shadowColor = `rgba(${c1.r},${c1.g},${c1.b},1)`;
      ctx.shadowBlur = 35;
      ctx.stroke();
      ctx.strokeStyle = `rgba(${c1.r},${c1.g},${c1.b},${a})`;
      ctx.lineWidth = variant + 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);

      // ── 1. Glowing border (always visible on any card) ──
      const bw = [10, 18, 30][variant - 1];
      ctx.lineWidth = bw;
      const bgrd = ctx.createLinearGradient(0, 0, W, H);
      bgrd.addColorStop(0,   `rgba(${c1.r},${c1.g},${c1.b},${0.75*ity})`);
      bgrd.addColorStop(0.5, `rgba(${c2.r},${c2.g},${c2.b},${0.5*ity})`);
      bgrd.addColorStop(1,   `rgba(${c1.r},${c1.g},${c1.b},${0.75*ity})`);
      ctx.strokeStyle = bgrd;
      ctx.shadowColor = `rgba(${c1.r},${c1.g},${c1.b},0.95)`;
      ctx.shadowBlur  = bw * 3;
      ctx.strokeRect(bw/2, bw/2, W-bw, H-bw);
      ctx.shadowBlur = 0;

      // ── 2. Atmosphere glow ──
      const gs = [0.12, 0.22, 0.38][variant-1];
      const ag = ctx.createRadialGradient(W/2, H*0.6, 0, W/2, H*0.6, W*0.9);
      ag.addColorStop(0,   `rgba(${c1.r},${c1.g},${c1.b},${gs})`);
      ag.addColorStop(0.6, `rgba(${c2.r},${c2.g},${c2.b},${gs*0.4})`);
      ag.addColorStop(1,   "transparent");
      ctx.fillStyle = ag;
      ctx.fillRect(0, 0, W, H);

      // ── 3. Fire: dark base so white sparks pop ──
      if (isEmber) {
        const fb = ctx.createLinearGradient(0, H*0.55, 0, H);
        fb.addColorStop(0, "rgba(0,0,0,0)");
        fb.addColorStop(1, `rgba(0,0,0,${0.4*ity})`);
        ctx.fillStyle = fb;
        ctx.fillRect(0, 0, W, H);
      }

      // ── 4. Lightning bolts ──
      if (theme.key === "lightning") {
        boltT++;
        if (boltT > bFreq && Math.random() < 0.25) {
          boltT = 0;
          bolt(0.95);
          if (variant >= 2) bolt(0.55);
          if (variant === 3) bolt(0.3);
        }
      }

      // ── 5. Particles ──
      pts.forEach(p => {
        p.life += p.spd;
        if (p.life >= 1) { Object.assign(p, newP()); p.life = 0; }

        const fade = Math.sin(p.life * Math.PI) * ity;
        const m  = p.life;
        const pr = Math.round(c1.r + (c2.r-c1.r)*m);
        const pg = Math.round(c1.g + (c2.g-c1.g)*m);
        const pb = Math.round(c1.b + (c2.b-c1.b)*m);

        if (isBubble) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.sz, 0, Math.PI*2);
          ctx.strokeStyle = `rgba(${pr},${pg},${pb},${fade})`;
          ctx.lineWidth = 2;
          ctx.shadowColor = `rgba(255,255,255,${fade*0.8})`;
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          // White-hot core → theme color glow → transparent
          // This is visible on ANY background (bright or dark)
          const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz);
          gr.addColorStop(0,   `rgba(255,255,255,${fade})`);        // white-hot core
          gr.addColorStop(0.25,`rgba(${pr},${pg},${pb},${fade*0.95})`);
          gr.addColorStop(0.7, `rgba(${pr},${pg},${pb},${fade*0.4})`);
          gr.addColorStop(1,   `rgba(${pr},${pg},${pb},0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.sz, 0, Math.PI*2);
          ctx.fillStyle = gr;
          ctx.shadowColor = `rgba(${pr},${pg},${pb},0.9)`;
          ctx.shadowBlur  = p.sz * 2.5;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        p.x += p.vx;
        p.y += p.vy;
        if (isEmber) p.vx += (Math.random()-0.5)*0.18;
      });

      rids[canvas._id] = requestAnimationFrame(frame);
    }
    frame();
  }

  function mountFX(node, { theme, id, variant }) {
    node._id = id;
    setTimeout(() => renderFX(node, theme, variant), 60);
    return { destroy() { cancelAnimationFrame(rids[id]); } };
  }

  // ── Game logic ─────────────────────────────────────────────────────────
  function pickGame(g) {
    Object.keys(rids).forEach(k => { cancelAnimationFrame(rids[k]); delete rids[k]; });
    selectedGame = g;
    phase = "ready";
    proposals = [];
  }

  async function generate() {
    if (!selectedGame) return;
    phase = "generating";
    const theme = getTheme(selectedGame);
    await new Promise(r => setTimeout(r, 1000));
    proposals = [
      { id:1, cls:"anim-float", label: theme.label + " — Subtil",  theme, variant:1 },
      { id:2, cls:"anim-pulse", label: theme.label + " — Intens",  theme, variant:2 },
      { id:3, cls:"anim-storm", label: theme.label + " — Extrem",  theme, variant:3 },
    ];
    phase = "done";
  }

  function save(p) {
    if (!selectedGame) return;
    const current = get(cmsGameEffects) || {};
    const updated = {
      ...current,
      [selectedGame.n]: {
        effect: p.theme.key,
        variant: p.variant,
        intensity: p.cls,
        effectInterval: 5,
        updatedAt: Date.now()
      }
    };
    cmsGameEffects.set(updated);
    cmsDraftGameEffects.set(JSON.parse(JSON.stringify(updated)));
    try {
      localStorage.setItem('cashpot_cms_game_effects', JSON.stringify(updated));
    } catch(e) {}
    
    saveToServer({ gameEffects: updated }).catch(() => {});
    
    saveFeedback = `✓ Efectul "${p.label}" a fost salvat și activat pentru "${selectedGame.n}"!`;
    setTimeout(() => { saveFeedback = ""; }, 4000);
  }

  onDestroy(() => Object.keys(rids).forEach(k => cancelAnimationFrame(rids[k])));
</script>

<div class="studio">
  <div class="header">
    <h1>✨ AI Effect Composer</h1>
    <p>Efecte generate automat din tema cardului — foc pentru Hot games, fulgere pentru Zeus, aur pentru Egypt.</p>
  </div>

  <div class="layout">
    <!-- Sidebar -->
    <div class="sidebar">
      <p class="stitle">Selectează Jocul</p>
      <div class="glist">
        {#each GAMES as g}
          <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
          <div class="grow {selectedGame?.n === g.n ? 'sel' : ''}" on:click={() => pickGame(g)}>
            <img src={g.img} alt={g.n} />
            <div>
              <span class="gname">{g.n}</span>
              <span class="gtag">{getTheme(g).label}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Workspace -->
    <div class="work">

      {#if phase === "idle"}
        <div class="empty"><span>🎮</span><p>Selectează un joc din stânga.</p></div>

      {:else if phase === "ready"}
        <div class="stage" in:fade>
          <div class="pcard"><img src={selectedGame.img} alt={selectedGame.n} /></div>
          <div class="tbadge">
            Efect detectat: <strong>{getTheme(selectedGame).label}</strong>
          </div>
          <button class="btn" on:click={generate}>✨ GENEREAZĂ EFECTUL</button>
        </div>

      {:else if phase === "generating"}
        <div class="stage" in:fade>
          <div class="pcard">
            <img src={selectedGame.img} alt={selectedGame.n} />
            <div class="scan"></div>
          </div>
          <div class="spin-row"><span class="sp"></span> Generând...</div>
        </div>

      {:else if phase === "done"}
        <div class="results" in:fade>
          {#if saveFeedback}
            <div style="background: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; color: #4ade80; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
              <span>✓</span>
              <span>{saveFeedback}</span>
            </div>
          {/if}
          <h3>Alege Varianta</h3>
          <div class="grid">
            {#each proposals as p (p.id)}
              <div class="rcard {p.cls}">
                <div class="rim">
                  <img src={selectedGame.img} alt={selectedGame.n} />
                  <canvas class="fx"
                    use:mountFX={{ theme: p.theme, id:`${p.id}_${selectedGame.n}`, variant: p.variant }}
                  ></canvas>
                </div>
                <div class="rf">
                  <p>{p.label}</p>
                  <button on:click={() => save(p)}>Download & Set</button>
                </div>
              </div>
            {/each}
          </div>
          <button class="btn-s" on:click={() => { phase='ready'; proposals=[]; }}>↩ Alt joc</button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .studio { font-family:'Inter',sans-serif; color:#fff; }
  .header {
    background:linear-gradient(135deg,#1e1b4b,#312e81);
    padding:22px 26px; border-radius:14px; margin-bottom:18px;
    border:1px solid rgba(255,255,255,0.07);
  }
  .header h1 {
    margin:0; font-size:1.65rem;
    background:linear-gradient(90deg,#a855f7,#ec4899,#facc15);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  }
  .header p { margin:5px 0 0; color:#94a3b8; font-size:0.85rem; }
  .layout { display:grid; grid-template-columns:260px 1fr; gap:18px; }

  /* Sidebar */
  .sidebar {
    background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);
    border-radius:14px; padding:14px;
    display:flex; flex-direction:column; gap:10px;
    height:calc(100vh - 210px);
  }
  .stitle { margin:0; font-size:0.88rem; font-weight:600; color:#e2e8f0; }
  .glist  { display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1; }
  .grow {
    display:flex; align-items:center; gap:9px; padding:7px 8px;
    border-radius:8px; cursor:pointer; border:1px solid transparent;
    background:rgba(255,255,255,0.02); transition:all .15s;
  }
  .grow:hover { background:rgba(255,255,255,0.05); }
  .grow.sel   { background:rgba(168,85,247,0.12); border-color:rgba(168,85,247,0.4); }
  .grow img   { width:38px; height:38px; border-radius:6px; object-fit:cover; flex-shrink:0; }
  .gname { display:block; font-size:0.78rem; color:#cbd5e1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .gtag  { display:block; font-size:0.68rem; color:#7c3aed; margin-top:1px; }

  /* Workspace */
  .work { display:flex; flex-direction:column; }
  .empty {
    background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.07);
    border-radius:14px; height:280px;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    color:#475569; gap:10px;
  }
  .empty span { font-size:2.5rem; opacity:.35; }
  .stage {
    background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05);
    border-radius:14px; padding:26px;
    display:flex; flex-direction:column; align-items:center; gap:16px;
  }
  .pcard {
    position:relative; width:190px; height:250px;
    border-radius:12px; overflow:hidden;
    box-shadow:0 14px 35px rgba(0,0,0,0.6);
  }
  .pcard img { width:100%; height:100%; object-fit:cover; display:block; }
  .scan {
    position:absolute; left:0; right:0; height:2px; top:0;
    background:linear-gradient(90deg,transparent,#a855f7,#ec4899,transparent);
    animation:sc 1.4s linear infinite;
  }
  @keyframes sc { 0%{top:0} 100%{top:100%} }
  .tbadge {
    background:rgba(168,85,247,0.08); border:1px solid rgba(168,85,247,0.25);
    border-radius:9px; padding:9px 16px; font-size:0.86rem; color:#94a3b8;
  }
  .tbadge strong { color:#facc15; margin-left:4px; }
  .spin-row { display:flex; align-items:center; gap:10px; color:#a855f7; font-weight:600; font-size:0.88rem; }
  .sp {
    width:15px; height:15px; border-radius:50%;
    border:2px solid rgba(168,85,247,0.25); border-top-color:#a855f7;
    animation:rot .75s linear infinite;
  }
  @keyframes rot { to{transform:rotate(360deg)} }
  .btn {
    background:linear-gradient(45deg,#7c3aed,#ec4899);
    border:none; color:#fff; padding:13px 28px;
    font-size:0.95rem; font-weight:700; border-radius:99px; cursor:pointer;
    box-shadow:0 0 20px rgba(168,85,247,0.35); transition:all .25s;
  }
  .btn:hover { transform:translateY(-2px); box-shadow:0 0 32px rgba(168,85,247,0.55); }

  /* Results */
  .results { display:flex; flex-direction:column; gap:14px; }
  .results h3 { margin:0; font-size:0.98rem; font-weight:600; }
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
  .rcard {
    background:#050505; border-radius:13px; overflow:hidden;
    border:1px solid rgba(255,255,255,0.06);
    box-shadow:0 8px 24px rgba(0,0,0,0.65); transition:transform .2s;
  }
  .rcard:hover { transform:translateY(-4px); }
  .rim { position:relative; width:100%; aspect-ratio:3/4; overflow:hidden; }
  .rim img { width:100%; height:100%; object-fit:cover; display:block; }
  .fx {
    position:absolute; inset:0; width:100%; height:100%;
    pointer-events:none; z-index:2;
  }
  .rf { padding:10px 12px; text-align:center; background:#0a0a0a; }
  .rf p { margin:0 0 7px; color:#e2e8f0; font-size:0.83rem; font-weight:600; }
  .rf button {
    width:100%; padding:7px;
    background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.14);
    color:#fff; border-radius:7px; cursor:pointer;
    font-weight:600; font-size:0.82rem; transition:all .2s;
  }
  .rf button:hover { background:#7c3aed; border-color:#7c3aed; }
  .btn-s {
    background:transparent; border:1px solid rgba(255,255,255,0.1);
    color:#64748b; padding:7px 16px; border-radius:99px; cursor:pointer;
    font-size:0.82rem; align-self:flex-start; transition:all .2s;
  }
  .btn-s:hover { color:#fff; border-color:rgba(255,255,255,0.3); }

  /* Card animations (subtle) */
  .anim-float .rim img { animation:fl 4s ease-in-out infinite alternate; }
  @keyframes fl { from{transform:scale(1.0)} to{transform:scale(1.035)} }
  .anim-pulse .fx     { animation:pl 2s ease-in-out infinite alternate; }
  @keyframes pl { from{opacity:0.8} to{opacity:1} }
  .anim-storm .rim img{ animation:stm 6s ease-in-out infinite alternate; }
  @keyframes stm { from{transform:scale(1.0) rotate(-0.5deg)} to{transform:scale(1.04) rotate(0.5deg)} }
</style>
