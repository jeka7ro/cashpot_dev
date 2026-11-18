<script>
  import { fade, slide } from "svelte/transition";
  import { onDestroy, onMount } from "svelte";
  import { GAMES, cmsGameEffects, cmsDraftGameEffects, saveToServer } from "./store.js";
  import { get } from "svelte/store";

  // ── State ─────────────────────────────────────────────────────────
  let activeTab = "studio"; // "studio" | "manager" | "batch"
  let searchQuery = "";
  let providerFilter = "All";
  let statusFilter = "all"; // "all" | "active" | "no_effect"
  let selectedGame = null;
  let saveFeedback = "";
  let feedbackType = "success"; // "success" | "info" | "warning"

  // Studio FX controls
  let effectKey = "fire";
  let variant = 2; // 1: Subtil, 2: Intens, 3: Extrem
  let triggerMode = "always"; // "always" | "interval" | "hover"
  let effectInterval = 5; // seconds
  let showBadge = true;
  let badgeText = "🔥 HOT";
  let previewDevice = "desktop"; // "desktop" | "mobile"
  let isAiDetecting = false;

  // ── Effect Themes Definition ──────────────────────────────────────
  const THEMES = [
    { key: "fire",          label: "Foc Arzător",         icon: "🔥", color1: "#f97316", color2: "#ef4444", defaultBadge: "🔥 HOT",     desc: "Flăcări intense și particule de jar aprins", cats: ["hot", "fructe", "septari", "burning"] },
    { key: "lightning",     label: "Zeus Lightning",      icon: "⚡", color1: "#818cf8", color2: "#60a5fa", defaultBadge: "⚡ EPIC",    desc: "Descărcări electrice și fulgere de neon",     cats: ["olympus", "zeus", "mitologie", "lightning"] },
    { key: "royal",         label: "Royal Sparkle",       icon: "👑", color1: "#facc15", color2: "#ef4444", defaultBadge: "👑 ROYAL",   desc: "Aur 24K, sclipiri regale și strălucire de coroană", cats: ["crown", "regal", "royal", "shining"] },
    { key: "halloween",     label: "Spooky Halloween",    icon: "🎃", color1: "#ff7700", color2: "#9333ea", defaultBadge: "🎃 SPOOKY",  desc: "Ceață spectrală, dovleci și nuanțe gotice", cats: ["halloween", "vampire", "witch", "horror", "spooky", "dead"] },
    { key: "sand",          label: "Golden Sands",        icon: "🏺", color1: "#fbbf24", color2: "#d97706", defaultBadge: "🏺 EGYPT",   desc: "Nisip auriu deșertic și mistere egiptene",   cats: ["egypt", "ra", "pharaoh", "cleopatra", "anubis"] },
    { key: "luxe",          label: "Diamond Luxe",        icon: "💎", color1: "#22d3ee", color2: "#a78bfa", defaultBadge: "💎 VIP",     desc: "Prisme de diamant, reflexii platină VIP",    cats: ["live", "roulette", "blackjack", "poker", "diamond"] },
    { key: "water",         label: "Deep Ocean",          icon: "💧", color1: "#38bdf8", color2: "#0284c7", defaultBadge: "💧 AQUA",    desc: "Unduiri acvatice turcoaz și bule strălucitoare", cats: ["bass", "fish", "ocean", "shark", "sea"] },
    { key: "stars",         label: "Cosmic Stardust",     icon: "🌟", color1: "#e879f9", color2: "#818cf8", defaultBadge: "🌟 COSMIC",  desc: "Praf cosmic, stele sclipitoare și nebuloasă", cats: ["star", "galaxy", "moon", "cosmic"] },
    { key: "candy",         label: "Sugar Burst",         icon: "🍬", color1: "#f472b6", color2: "#fb923c", defaultBadge: "🍬 SWEET",   desc: "Explozie dulce de culori pastel și jeleuri", cats: ["candy", "sweet", "bonanza", "sugar"] },
    { key: "glow-border",   label: "Contur Neon",         icon: "💡", color1: "#22c55e", color2: "#10b981", defaultBadge: "⭐ TOP",     desc: "Barieră luminoasă neon pulsantă",            cats: [] },
    { key: "blink",         label: "Blink Atenție",       icon: "🚨", color1: "#ef4444", color2: "#f59e0b", defaultBadge: "🚨 ATENȚIE", desc: "Pulsare ritmică pentru a atrage privirea",  cats: [] },
    { key: "glass-shatter", label: "Glass Shatter",       icon: "🪟", color1: "#ffffff", color2: "#60a5fa", defaultBadge: "💥 HIT",     desc: "Fulgere de sticlă cristalizată",             cats: [] },
    { key: "shake",         label: "Shake Rumble",        icon: "🌪️", color1: "#f59e0b", color2: "#ef4444", defaultBadge: "🎰 JACKPOT", desc: "Vibrație seismică și energie brută",        cats: [] },
    { key: "float",         label: "Levitație 3D",        icon: "🛸", color1: "#a855f7", color2: "#3b82f6", defaultBadge: "✨ MAGIC",   desc: "Mișcare plutitoare anti-gravitațională",     cats: [] },
  ];

  // ── Reactive Store subscriptions ──────────────────────────────────
  let effectsMap = {};
  cmsDraftGameEffects.subscribe(val => {
    if (val && typeof val === "object") {
      effectsMap = { ...val };
    } else {
      effectsMap = {};
    }
  });

  // Providers list
  $: uniqueProviders = ["All", ...new Set(GAMES.map(g => g.p))].sort();

  // Filtered games
  $: filteredGames = GAMES.filter(g => {
    const matchSearch = !searchQuery || g.n.toLowerCase().includes(searchQuery.toLowerCase()) || (g.p && g.p.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchProvider = providerFilter === "All" || g.p === providerFilter;
    const hasEffect = !!effectsMap[g.n] && effectsMap[g.n].effect !== "none";
    const matchStatus = statusFilter === "all" || (statusFilter === "active" && hasEffect) || (statusFilter === "no_effect" && !hasEffect);
    return matchSearch && matchProvider && matchStatus;
  });

  // Active effects list
  $: activeEffectsList = Object.entries(effectsMap)
    .filter(([_, ef]) => ef && ef.effect && ef.effect !== "none")
    .map(([gameName, ef]) => {
      const g = GAMES.find(x => x.n === gameName) || { n: gameName, p: "General", img: "/logoMobile.webp" };
      const theme = THEMES.find(t => t.key === ef.effect) || THEMES[0];
      return { game: g, effect: ef, theme };
    });

  // Current theme object
  $: currentTheme = THEMES.find(t => t.key === effectKey) || THEMES[0];

  // Pick game in Studio
  function selectGame(g) {
    selectedGame = g;
    const existing = effectsMap[g.n];
    if (existing && existing.effect && existing.effect !== "none") {
      effectKey = existing.effect;
      variant = existing.variant || 2;
      triggerMode = existing.triggerMode || "always";
      effectInterval = existing.effectInterval || 5;
      showBadge = existing.badgeText !== undefined ? !!existing.badgeText : true;
      badgeText = existing.badgeText || (THEMES.find(t => t.key === existing.effect)?.defaultBadge || "🔥 HOT");
    } else {
      // Auto-suggest best initial theme
      autoDetectTheme(g, false);
    }
  }

  // AI Auto-detect theme
  function autoDetectTheme(game, animate = true) {
    if (!game) return;
    if (animate) isAiDetecting = true;

    const n = (game.n || "").toLowerCase();
    const c = (game.c || []).map(x => (x || "").toLowerCase());

    let match = THEMES.find(t => t.cats.some(cat => n.includes(cat) || c.includes(cat)));
    if (!match) {
      if (/burning|hot|fire|flame|inferno|sizzling|chilli|pepper/.test(n)) match = THEMES.find(t => t.key === "fire");
      else if (/olympus|zeus|thor|thunder|lightning|strike|gods/.test(n)) match = THEMES.find(t => t.key === "lightning");
      else if (/crown|shining|regal|royal|king|queen|imperial/.test(n)) match = THEMES.find(t => t.key === "royal");
      else if (/halloween|vampire|witch|spooky|dead|blood|zombie|horror/.test(n)) match = THEMES.find(t => t.key === "halloween");
      else if (/egypt|ra|cleopatra|pharaoh|pyramid|scarab|anubis/.test(n)) match = THEMES.find(t => t.key === "sand");
      else if (/bass|fish|ocean|sea|shark|underwater|water|float/.test(n)) match = THEMES.find(t => t.key === "water");
      else if (/diamond|luxe|roulette|blackjack|vip|gold/.test(n)) match = THEMES.find(t => t.key === "luxe");
      else if (/sweet|bonanza|sugar|candy|fruit|berry/.test(n)) match = THEMES.find(t => t.key === "candy");
      else if (/star|galaxy|space|cosmic|astro/.test(n)) match = THEMES.find(t => t.key === "stars");
      else match = THEMES[0];
    }

    const apply = () => {
      effectKey = match.key;
      variant = 2;
      triggerMode = "always";
      effectInterval = 5;
      showBadge = true;
      badgeText = match.defaultBadge;
      if (animate) {
        isAiDetecting = false;
        showToast(`🪄 AI a analizat grafica jocului și a aplicat profilul "${match.label}"!`, "info");
      }
    };

    if (animate) {
      setTimeout(apply, 450);
    } else {
      apply();
    }
  }

  // Save effect for current game
  function saveEffect() {
    if (!selectedGame) return;
    const updated = {
      ...effectsMap,
      [selectedGame.n]: {
        effect: effectKey,
        variant: Number(variant),
        triggerMode: triggerMode,
        effectInterval: Number(effectInterval),
        badgeText: showBadge ? badgeText : "",
        badgeColor: currentTheme.color1,
        glowColor1: currentTheme.color1,
        glowColor2: currentTheme.color2,
        updatedAt: Date.now()
      }
    };

    effectsMap = updated;
    cmsGameEffects.set(updated);
    cmsDraftGameEffects.set(JSON.parse(JSON.stringify(updated)));
    try {
      localStorage.setItem("cashpot_cms_game_effects", JSON.stringify(updated));
    } catch(e) {}

    saveToServer({ gameEffects: updated }).catch(() => {});
    showToast(`✓ Efectul "${currentTheme.label}" a fost salvat și activat pentru "${selectedGame.n}"!`, "success");
  }

  // Remove effect
  function removeEffect(gameName) {
    const target = gameName || (selectedGame ? selectedGame.n : null);
    if (!target) return;
    const updated = { ...effectsMap };
    delete updated[target];

    effectsMap = updated;
    cmsGameEffects.set(updated);
    cmsDraftGameEffects.set(JSON.parse(JSON.stringify(updated)));
    try {
      localStorage.setItem("cashpot_cms_game_effects", JSON.stringify(updated));
    } catch(e) {}

    saveToServer({ gameEffects: updated }).catch(() => {});
    showToast(`Efectul pentru "${target}" a fost dezactivat.`, "info");
  }

  // Clear all effects
  function clearAllEffects() {
    if (!confirm("Sigur dorești să ștergi TOATE efectele vizuale active de pe jocuri?")) return;
    effectsMap = {};
    cmsGameEffects.set({});
    cmsDraftGameEffects.set({});
    try {
      localStorage.setItem("cashpot_cms_game_effects", JSON.stringify({}));
    } catch(e) {}
    saveToServer({ gameEffects: {} }).catch(() => {});
    showToast("Toate efectele vizuale au fost resetate.", "warning");
  }

  // Batch recipes
  const BATCH_RECIPES = [
    {
      id: "halloween_all",
      title: "🎃 Pachetul Spooky Halloween",
      desc: "Aplică tema Halloween cu violet & dovleac pe toate jocurile cu vampiri, horror, spooky și vrăjitoare.",
      theme: "halloween",
      variant: 2,
      badge: "🎃 SPOOKY",
      interval: 4,
      pattern: /halloween|vampire|witch|vrajitoare|horror|spooky|dead|zombie|werewolf|blood|mental/i
    },
    {
      id: "fire_hot",
      title: "🔥 Foc & Fructe Arzătore",
      desc: "Aplică flăcări vibrante și badge HOT pe toate jocurile din seria Burning Hot, Flaming Hot și fructe.",
      theme: "fire",
      variant: 2,
      badge: "🔥 HOT",
      interval: 3.5,
      pattern: /burning|hot\b|flaming|sizzling|fire|inferno/i
    },
    {
      id: "zeus_storm",
      title: "⚡ Zeus & Furtuna Zeilor",
      desc: "Aplică fulgere electrice albastre pe jocurile mitologice (Gates of Olympus, Zeus, Thor, Poseidon).",
      theme: "lightning",
      variant: 3,
      badge: "⚡ EPIC",
      interval: 4,
      pattern: /olympus|zeus|thor|poseidon|lightning|strike|gods/i
    },
    {
      id: "royal_crowns",
      title: "👑 Coroane & Aur Regal",
      desc: "Aplică aur regal 24K strălucitor pe Shining Crown, 40 Shining Crown, Royal Secrets etc.",
      theme: "royal",
      variant: 2,
      badge: "👑 ROYAL",
      interval: 4.5,
      pattern: /crown|regal|royal|shining|imperial|king|noble/i
    },
    {
      id: "egypt_pharaoh",
      title: "🏺 Aurul Faraonilor",
      desc: "Aplică nisip auriu strălucitor pe Book of Ra, Cleopatra, Egypt Quest etc.",
      theme: "sand",
      variant: 2,
      badge: "🏺 EGYPT",
      interval: 4.5,
      pattern: /egypt|book of ra|cleopatra|pharaoh|pyramid|anubis|scarab/i
    },
    {
      id: "diamond_luxe",
      title: "💎 VIP High Roller",
      desc: "Aplică reflexii de diamant și platină pe jocurile de live casino, ruletă și mese VIP.",
      theme: "luxe",
      variant: 3,
      badge: "💎 VIP",
      interval: 3.5,
      pattern: /diamond|vip|roulette|blackjack|poker|baccarat|live/i
    }
  ];

  function countMatchingGames(pattern) {
    return GAMES.filter(g => pattern.test(g.n) || (g.c || []).some(c => pattern.test(c))).length;
  }

  function applyBatchRecipe(recipe) {
    const matched = GAMES.filter(g => recipe.pattern.test(g.n) || (g.c || []).some(c => recipe.pattern.test(c)));
    if (matched.length === 0) {
      showToast("Nu s-au găsit jocuri potrivite pentru această rețetă.", "warning");
      return;
    }

    if (!confirm(`Aplici rețeta "${recipe.title}" pe ${matched.length} jocuri găsite?`)) return;

    const updated = { ...effectsMap };
    matched.forEach(g => {
      updated[g.n] = {
        effect: recipe.theme,
        variant: recipe.variant,
        triggerMode: "always",
        effectInterval: recipe.interval,
        badgeText: recipe.badge,
        badgeColor: THEMES.find(t => t.key === recipe.theme)?.color1 || "#ff7700",
        glowColor1: THEMES.find(t => t.key === recipe.theme)?.color1 || "#ff7700",
        glowColor2: THEMES.find(t => t.key === recipe.theme)?.color2 || "#ef4444",
        updatedAt: Date.now()
      };
    });

    effectsMap = updated;
    cmsGameEffects.set(updated);
    cmsDraftGameEffects.set(JSON.parse(JSON.stringify(updated)));
    try {
      localStorage.setItem("cashpot_cms_game_effects", JSON.stringify(updated));
    } catch(e) {}
    saveToServer({ gameEffects: updated }).catch(() => {});
    showToast(`✓ S-a aplicat cu succes pe ${matched.length} jocuri!`, "success");
  }

  // Toast feedback
  let toastTimer;
  function showToast(msg, type = "success") {
    saveFeedback = msg;
    feedbackType = type;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { saveFeedback = ""; }, 4000);
  }

  // Select initial game
  onMount(() => {
    if (GAMES && GAMES.length > 0 && !selectedGame) {
      selectGame(GAMES[0]);
    }
  });

  onDestroy(() => {
    if (toastTimer) clearTimeout(toastTimer);
  });
</script>

<div class="magic-studio-root">
  <!-- Toast Notification -->
  {#if saveFeedback}
    <div class="magic-toast toast-{feedbackType}" transition:slide={{ duration: 200 }}>
      <span class="toast-icon">
        {feedbackType === 'success' ? '✓' : feedbackType === 'warning' ? '⚠️' : 'ℹ️'}
      </span>
      <span>{saveFeedback}</span>
    </div>
  {/if}

  <!-- Studio Header -->
  <div class="studio-header">
    <div class="header-main">
      <div class="badge-tag">AI VISUAL FX ENGINE</div>
      <h1>✨ Magic Studio <span class="ai-spark">PRO</span></h1>
      <p class="subtitle">
        Creează, personalizează și generează efecte cinematice animate (Foc, Fulger, Aur Regal, Halloween, Ocean etc.) direct pe thumbnail-urile sloturilor.
      </p>
    </div>

    <!-- Stat Badges -->
    <div class="header-stats">
      <div class="stat-pill">
        <span class="stat-num">{GAMES.length}</span>
        <span class="stat-label">Jocuri Totale</span>
      </div>
      <div class="stat-pill active-stat">
        <span class="stat-dot"></span>
        <span class="stat-num">{activeEffectsList.length}</span>
        <span class="stat-label">Efecte Active</span>
      </div>
      <div class="stat-pill">
        <span class="stat-num">{THEMES.length}</span>
        <span class="stat-label">Preseturi Tematice</span>
      </div>
    </div>
  </div>

  <!-- Main Navigation Tabs -->
  <div class="studio-nav">
    <button class="nav-tab {activeTab === 'studio' ? 'active' : ''}" on:click={() => activeTab = 'studio'}>
      <span class="tab-icon">🎨</span>
      <span class="tab-text">Studio de Creație</span>
    </button>
    <button class="nav-tab {activeTab === 'manager' ? 'active' : ''}" on:click={() => activeTab = 'manager'}>
      <span class="tab-icon">📋</span>
      <span class="tab-text">Efecte Active pe Site</span>
      <span class="tab-count">{activeEffectsList.length}</span>
    </button>
    <button class="nav-tab {activeTab === 'batch' ? 'active' : ''}" on:click={() => activeTab = 'batch'}>
      <span class="tab-icon">⚡</span>
      <span class="tab-text">Aplicare în Masă (Batch FX)</span>
      <span class="tab-pill">Rețete AI</span>
    </button>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- TAB 1: STUDIO DE CREATIE (LIVE CUSTOMIZER & AI GENERATOR)      -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  {#if activeTab === 'studio'}
    <div class="studio-workspace" in:fade={{ duration: 150 }}>
      <!-- Left Column: Game Explorer -->
      <aside class="game-explorer">
        <div class="explorer-header">
          <h3>Alege Jocul</h3>
          <span class="count-badge">{filteredGames.length}</span>
        </div>

        <!-- Search & Filter Controls -->
        <div class="explorer-filters">
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" bind:value={searchQuery} placeholder="Caută slot sau provider..." />
            {#if searchQuery}
              <button class="clear-btn" on:click={() => searchQuery = ""}>✕</button>
            {/if}
          </div>

          <div class="filter-row">
            <select bind:value={providerFilter} class="filter-select">
              {#each uniqueProviders as p}
                <option value={p}>{p === "All" ? "Toți Providerii" : p}</option>
              {/each}
            </select>

            <select bind:value={statusFilter} class="filter-select">
              <option value="all">Toate Stările</option>
              <option value="active">Doar cu Efecte Active</option>
              <option value="no_effect">Fără Efecte</option>
            </select>
          </div>
        </div>

        <!-- Games List -->
        <div class="games-scrollable">
          {#each filteredGames as g}
            {@const hasFx = !!effectsMap[g.n] && effectsMap[g.n].effect !== "none"}
            {@const curFxTheme = hasFx ? THEMES.find(t => t.key === effectsMap[g.n].effect) : null}
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div class="game-item-card {selectedGame?.n === g.n ? 'selected' : ''} {hasFx ? 'has-active-fx' : ''}" on:click={() => selectGame(g)}>
              <div class="thumb-wrap">
                <img src={g.img} alt={g.n} loading="lazy" />
                {#if hasFx}
                  <span class="mini-fx-badge" style="background: {curFxTheme?.color1 || '#22c55e'};">
                    {curFxTheme?.icon || '✨'}
                  </span>
                {/if}
              </div>
              <div class="item-meta">
                <div class="item-title" title={g.n}>{g.n}</div>
                <div class="item-prov">{g.p}</div>
                {#if hasFx}
                  <div class="active-fx-label" style="color: {curFxTheme?.color1 || '#22c55e'};">
                    {curFxTheme?.label}
                  </div>
                {/if}
              </div>
            </div>
          {/each}
          {#if filteredGames.length === 0}
            <div class="no-results">
              <span>🔍</span>
              <p>Niciun joc găsit pentru filtrele selectate.</p>
            </div>
          {/if}
        </div>
      </aside>

      <!-- Right Column: Live Laboratory & Controls -->
      <main class="studio-main">
        {#if selectedGame}
          <div class="selected-game-bar">
            <div class="sg-info">
              <img src={selectedGame.img} alt={selectedGame.n} class="sg-avatar" />
              <div>
                <h2>{selectedGame.n}</h2>
                <div class="sg-tags">
                  <span class="tag-prov">{selectedGame.p}</span>
                  {#if effectsMap[selectedGame.n] && effectsMap[selectedGame.n].effect !== "none"}
                    <span class="tag-status active">Efect Activ pe Site</span>
                  {:else}
                    <span class="tag-status none">Fără Efect</span>
                  {/if}
                </div>
              </div>
            </div>

            <!-- AI Detect Button -->
            <button class="ai-detect-btn {isAiDetecting ? 'analyzing' : ''}" on:click={() => autoDetectTheme(selectedGame, true)} disabled={isAiDetecting}>
              <span class="wand-icon">🪄</span>
              <span>{isAiDetecting ? "Analizând grafica jocului..." : "AI Auto-Detect & Sugestie"}</span>
            </button>
          </div>

          <div class="studio-split">
            <!-- 1. Live Interactive Card Preview -->
            <div class="preview-panel">
              <div class="preview-header">
                <div class="preview-title-row">
                  <span class="p-dot"></span>
                  <h4>Previzualizare Live în Cazinou</h4>
                </div>
                <div class="preview-device-toggle">
                  <button class="{previewDevice === 'desktop' ? 'active' : ''}" on:click={() => previewDevice = 'desktop'}>💻 Desktop</button>
                  <button class="{previewDevice === 'mobile' ? 'active' : ''}" on:click={() => previewDevice = 'mobile'}>📱 Mobil</button>
                </div>
              </div>

              <div class="preview-stage {previewDevice}">
                <!-- Simulated Live Game Card -->
                <div
                  class="mock-game-card effect-{effectKey} variant-{variant} trigger-{triggerMode}"
                  style="--effect-interval: {triggerMode === 'always' ? '0s' : `${effectInterval}s`};"
                >
                  <div class="mock-img-wrapper">
                    {#if showBadge && badgeText}
                      <span class="game-effect-badge" style="background: {currentTheme.color1};">
                        {badgeText}
                      </span>
                    {/if}
                    <img src={selectedGame.img} alt={selectedGame.n} />
                    <div class="mock-hover-overlay">
                      <div class="mock-play-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                      <div class="mock-details">
                        <span class="m-prov">{selectedGame.p}</span>
                        <span class="m-tag">{selectedGame.c?.[0] || 'SLOT'}</span>
                      </div>
                    </div>
                  </div>
                  <div class="mock-card-footer">
                    <div class="m-name">{selectedGame.n}</div>
                    <div class="m-pname">{selectedGame.p}</div>
                  </div>
                </div>

                <div class="preview-caption">
                  <span class="caption-icon">⚡</span>
                  Efectul configurat va fi redat exact astfel în caruselurile și listele de pe Homepage.
                </div>
              </div>
            </div>

            <!-- 2. FX Configuration Controls -->
            <div class="controls-panel">
              <!-- Preset Selector -->
              <div class="control-group">
                <label class="group-label">
                  <span>1. Alege Tema Vizuală</span>
                  <span class="curr-label" style="color: {currentTheme.color1};">{currentTheme.icon} {currentTheme.label}</span>
                </label>
                <div class="themes-grid">
                  {#each THEMES as t}
                    <button
                      class="theme-chip {effectKey === t.key ? 'active' : ''}"
                      style="{effectKey === t.key ? `--active-border: ${t.color1}; --active-glow: ${t.color1}40;` : ''}"
                      on:click={() => { effectKey = t.key; badgeText = t.defaultBadge; }}
                    >
                      <span class="t-icon">{t.icon}</span>
                      <div class="t-text">
                        <span class="t-name">{t.label}</span>
                        <span class="t-desc">{t.desc}</span>
                      </div>
                      <span class="color-dot" style="background: {t.color1};"></span>
                    </button>
                  {/each}
                </div>
              </div>

              <!-- Intensity & Variants -->
              <div class="control-group">
                <label class="group-label">2. Intensitate & Varianță</label>
                <div class="variant-toggle-group">
                  <button class="var-btn {variant === 1 ? 'active' : ''}" on:click={() => variant = 1}>
                    <span class="var-icon">🟢</span>
                    <span class="var-name">Subtil</span>
                    <span class="var-sub">Contur discret & strălucire fină</span>
                  </button>
                  <button class="var-btn {variant === 2 ? 'active' : ''}" on:click={() => variant = 2}>
                    <span class="var-icon">🟡</span>
                    <span class="var-name">Intens</span>
                    <span class="var-sub">Aura puternică & particule vii</span>
                  </button>
                  <button class="var-btn {variant === 3 ? 'active' : ''}" on:click={() => variant = 3}>
                    <span class="var-icon">🔴</span>
                    <span class="var-name">Extrem</span>
                    <span class="var-sub">Pulsare maximă de impact</span>
                  </button>
                </div>
              </div>

              <!-- Trigger & Interval Settings -->
              <div class="control-row-grid">
                <div class="control-group">
                  <label class="group-label">3. Mod de Declanșare</label>
                  <select bind:value={triggerMode} class="cms-select-dark">
                    <option value="always">🔁 Mereu Activ (Continuu)</option>
                    <option value="interval">⏱️ Pulsare la Interval</option>
                    <option value="hover">🖱️ Doar la Hover (Cursor)</option>
                  </select>
                </div>

                {#if triggerMode === 'interval'}
                  <div class="control-group" transition:slide>
                    <label class="group-label">Interval (Secunde): <strong>{effectInterval}s</strong></label>
                    <input type="range" min="2" max="15" step="1" bind:value={effectInterval} class="cms-range" />
                  </div>
                {/if}
              </div>

              <!-- Badge on card -->
              <div class="control-group">
                <div class="badge-toggle-row">
                  <label class="group-label" style="margin: 0;">4. Insignă Festivă pe Card (Badge)</label>
                  <input type="checkbox" bind:checked={showBadge} class="cms-toggle-cb" />
                </div>

                {#if showBadge}
                  <div class="badge-input-wrapper" transition:slide>
                    <input type="text" bind:value={badgeText} placeholder="Ex: 🔥 HOT, ⚡ NOU..." class="cms-input-dark" />
                    <div class="quick-badge-chips">
                      {#each ["🔥 HOT", "⚡ EPIC", "👑 ROYAL", "🎃 SPOOKY", "💎 VIP", "⭐ RECOMANDAT", "✨ HIT"] as qb}
                        <button class="q-chip {badgeText === qb ? 'active' : ''}" on:click={() => badgeText = qb}>{qb}</button>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>

              <!-- Action Buttons -->
              <div class="studio-actions-bar">
                <button class="save-fx-btn" on:click={saveEffect}>
                  <span>💾</span>
                  <span>Salvează & Activează pe Site</span>
                </button>

                {#if effectsMap[selectedGame.n] && effectsMap[selectedGame.n].effect !== "none"}
                  <button class="remove-fx-btn" on:click={() => removeEffect(selectedGame.n)}>
                    <span>🗑️</span>
                    <span>Dezactivează Efectul</span>
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {:else}
          <div class="no-game-selected">
            <span class="empty-icon">🎮</span>
            <h3>Niciun joc selectat</h3>
            <p>Alege un slot din lista din stânga pentru a-i aplica efecte magice.</p>
          </div>
        {/if}
      </main>
    </div>
  {/if}

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- TAB 2: MANAGER EFECTE ACTIVE                                   -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  {#if activeTab === 'manager'}
    <div class="manager-workspace" in:fade={{ duration: 150 }}>
      <div class="manager-top-bar">
        <div>
          <h3>Jocuri cu Efecte Active ({activeEffectsList.length})</h3>
          <p class="manager-desc">Toate sloturile care au efecte animate active pe homepage și în categoriile din site.</p>
        </div>
        {#if activeEffectsList.length > 0}
          <button class="clear-all-btn" on:click={clearAllEffects}>
            <span>🗑️</span>
            <span>Resetează Toate Efectele</span>
          </button>
        {/if}
      </div>

      {#if activeEffectsList.length === 0}
        <div class="empty-manager">
          <span class="big-icon">✨</span>
          <h4>Nu există efecte active</h4>
          <p>Mergi în Studio de Creație sau folosește Rețetele din Aplicare în Masă pentru a activa efecte spectaculoase.</p>
          <button class="goto-studio-btn" on:click={() => activeTab = 'studio'}>Deschide Studio de Creație</button>
        </div>
      {:else}
        <div class="effects-table-wrapper">
          <table class="effects-table">
            <thead>
              <tr>
                <th>Joc & Provider</th>
                <th>Efect Aplicat</th>
                <th>Intensitate</th>
                <th>Declanșare</th>
                <th>Insignă (Badge)</th>
                <th style="text-align: right;">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {#each activeEffectsList as item}
                <tr>
                  <td>
                    <div class="tbl-game-cell">
                      <img src={item.game.img} alt={item.game.n} class="tbl-thumb" />
                      <div>
                        <div class="tbl-name">{item.game.n}</div>
                        <div class="tbl-prov">{item.game.p}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="tbl-fx-chip" style="background: {item.theme.color1}25; color: {item.theme.color1}; border: 1px solid {item.theme.color1}50;">
                      {item.theme.icon} {item.theme.label}
                    </span>
                  </td>
                  <td>
                    <span class="tbl-badge-neutral">
                      {item.effect.variant === 1 ? '🟢 Subtil' : item.effect.variant === 3 ? '🔴 Extrem' : '🟡 Intens'}
                    </span>
                  </td>
                  <td>
                    <span class="tbl-mode-text">
                      {item.effect.triggerMode === 'hover' ? '🖱️ Doar la Hover' : item.effect.triggerMode === 'interval' ? `⏱️ La ${item.effect.effectInterval || 5}s` : '🔁 Mereu Activ'}
                    </span>
                  </td>
                  <td>
                    {#if item.effect.badgeText}
                      <span class="tbl-badge-preview" style="background: {item.theme.color1};">
                        {item.effect.badgeText}
                      </span>
                    {:else}
                      <span style="opacity: 0.4;">—</span>
                    {/if}
                  </td>
                  <td style="text-align: right;">
                    <div class="tbl-actions">
                      <button class="tbl-btn-edit" on:click={() => { selectGame(item.game); activeTab = 'studio'; }}>
                        ✏️ Editează
                      </button>
                      <button class="tbl-btn-del" on:click={() => removeEffect(item.game.n)}>
                        🗑️ Șterge
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- TAB 3: APLICARE IN MASA (BATCH FX)                             -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  {#if activeTab === 'batch'}
    <div class="batch-workspace" in:fade={{ duration: 150 }}>
      <div class="batch-intro">
        <h3>Rețete Inteligente de Aplicare în Masă</h3>
        <p>Aplică efecte vizuale coordonate pe grupuri de jocuri (toate sloturile cu fructe, toate jocurile horror de Halloween, mesele de Live Casino etc.) cu un singur click.</p>
      </div>

      <div class="recipes-grid">
        {#each BATCH_RECIPES as r}
          {@const matchCount = countMatchingGames(r.pattern)}
          {@const rTheme = THEMES.find(t => t.key === r.theme) || THEMES[0]}
          <div class="recipe-card" style="--r-color: {rTheme.color1};">
            <div class="recipe-top">
              <span class="recipe-badge">{r.badge}</span>
              <span class="recipe-count-pill">{matchCount} Jocuri Identificate</span>
            </div>
            <h4>{r.title}</h4>
            <p class="recipe-desc">{r.desc}</p>

            <div class="recipe-specs">
              <div class="spec-item">
                <span class="spec-label">Temă FX:</span>
                <span class="spec-val" style="color: {rTheme.color1};">{rTheme.icon} {rTheme.label}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Intensitate:</span>
                <span class="spec-val">{r.variant === 3 ? 'Extrem' : 'Intens'}</span>
              </div>
            </div>

            <button
              class="apply-recipe-btn"
              on:click={() => applyBatchRecipe(r)}
              disabled={matchCount === 0}
            >
              <span>⚡</span>
              <span>Aplică pe Toate ({matchCount})</span>
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .magic-studio-root {
    display: flex;
    flex-direction: column;
    gap: 20px;
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  /* Toast Notification */
  .magic-toast {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 9999;
    padding: 12px 20px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }
  .toast-success { background: rgba(34, 197, 94, 0.95); color: #fff; border: 1px solid #4ade80; }
  .toast-info { background: rgba(59, 130, 246, 0.95); color: #fff; border: 1px solid #93c5fd; }
  .toast-warning { background: rgba(245, 158, 11, 0.95); color: #000; border: 1px solid #fde68a; }

  /* Header */
  .studio-header {
    background: linear-gradient(135deg, rgba(30, 27, 75, 0.7), rgba(49, 46, 129, 0.5));
    border: 1px solid rgba(168, 85, 247, 0.3);
    border-radius: 16px;
    padding: 24px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }
  .header-main .badge-tag {
    display: inline-block;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.5px;
    padding: 3px 8px;
    background: linear-gradient(90deg, #a855f7, #ec4899);
    border-radius: 6px;
    margin-bottom: 8px;
  }
  .header-main h1 {
    font-size: 26px;
    font-weight: 900;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ai-spark {
    font-size: 11px;
    background: linear-gradient(90deg, #ec4899, #f59e0b);
    padding: 2px 8px;
    border-radius: 20px;
  }
  .subtitle {
    font-size: 13px;
    color: #94a3b8;
    margin: 6px 0 0;
    max-width: 650px;
    line-height: 1.5;
  }
  .header-stats {
    display: flex;
    gap: 12px;
  }
  .stat-pill {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 10px 16px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 85px;
  }
  .stat-pill.active-stat {
    border-color: rgba(34, 197, 94, 0.5);
    background: rgba(34, 197, 94, 0.1);
    position: relative;
  }
  .stat-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #22c55e;
    position: absolute;
    top: 8px;
    right: 8px;
    box-shadow: 0 0 6px #22c55e;
  }
  .stat-num { font-size: 18px; font-weight: 800; color: #fff; }
  .stat-label { font-size: 11px; color: #94a3b8; margin-top: 2px; }

  /* Navigation Tabs */
  .studio-nav {
    display: flex;
    gap: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 4px;
  }
  .nav-tab {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 14px;
    font-weight: 700;
    padding: 10px 18px;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.18s;
  }
  .nav-tab:hover { color: #fff; background: rgba(255, 255, 255, 0.04); }
  .nav-tab.active {
    color: #fff;
    background: rgba(168, 85, 247, 0.2);
    border-bottom: 2px solid #a855f7;
  }
  .tab-count {
    background: #22c55e;
    color: #000;
    font-size: 11px;
    font-weight: 800;
    padding: 1px 6px;
    border-radius: 10px;
  }
  .tab-pill {
    background: linear-gradient(90deg, #ec4899, #f59e0b);
    color: #fff;
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 4px;
  }

  /* ── Studio Workspace Layout ── */
  .studio-workspace {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 20px;
  }

  /* Left Column: Explorer */
  .game-explorer {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    height: 720px;
  }
  .explorer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .explorer-header h3 { font-size: 14px; font-weight: 800; margin: 0; color: #e2e8f0; }
  .count-badge { font-size: 11px; font-weight: 700; color: #a855f7; background: rgba(168, 85, 247, 0.15); padding: 2px 8px; border-radius: 10px; }

  .explorer-filters { display: flex; flex-direction: column; gap: 8px; }
  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }
  .search-icon { position: absolute; left: 10px; width: 14px; height: 14px; color: #64748b; }
  .search-box input {
    width: 100%;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 8px 30px 8px 32px;
    color: #fff;
    font-size: 12px;
  }
  .search-box input:focus { outline: none; border-color: #a855f7; }
  .clear-btn { position: absolute; right: 8px; background: none; border: none; color: #94a3b8; cursor: pointer; }
  .filter-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .filter-select {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #cbd5e1;
    font-size: 11px;
    padding: 6px;
    border-radius: 6px;
    outline: none;
  }

  .games-scrollable {
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow-y: auto;
    flex: 1;
    padding-right: 4px;
  }
  .game-item-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.15s;
  }
  .game-item-card:hover { background: rgba(255, 255, 255, 0.06); }
  .game-item-card.selected {
    background: rgba(168, 85, 247, 0.15);
    border-color: #a855f7;
  }
  .game-item-card.has-active-fx {
    border-left: 3px solid #22c55e;
  }
  .thumb-wrap {
    position: relative;
    width: 42px;
    height: 42px;
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .thumb-wrap img { width: 100%; height: 100%; object-fit: cover; }
  .mini-fx-badge {
    position: absolute;
    bottom: 2px;
    right: 2px;
    font-size: 9px;
    border-radius: 4px;
    padding: 1px 3px;
  }
  .item-meta { flex: 1; min-width: 0; }
  .item-title { font-size: 12px; font-weight: 700; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .item-prov { font-size: 10px; color: #64748b; margin-top: 1px; }
  .active-fx-label { font-size: 10px; font-weight: 700; margin-top: 2px; }
  .no-results { text-align: center; padding: 40px 10px; color: #64748b; font-size: 12px; }

  /* Right Column: Studio Main */
  .studio-main {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .selected-game-bar {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 14px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  .sg-info { display: flex; align-items: center; gap: 14px; }
  .sg-avatar { width: 48px; height: 48px; border-radius: 10px; object-fit: cover; }
  .sg-info h2 { font-size: 17px; font-weight: 800; margin: 0; }
  .sg-tags { display: flex; gap: 8px; margin-top: 4px; }
  .tag-prov { font-size: 11px; background: rgba(255, 255, 255, 0.08); padding: 2px 8px; border-radius: 4px; color: #cbd5e1; }
  .tag-status.active { font-size: 11px; background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4); padding: 2px 8px; border-radius: 4px; font-weight: 700; }
  .tag-status.none { font-size: 11px; background: rgba(148, 163, 184, 0.15); color: #94a3b8; padding: 2px 8px; border-radius: 4px; }

  .ai-detect-btn {
    background: linear-gradient(135deg, #7c3aed, #ec4899);
    border: none;
    color: #fff;
    padding: 9px 18px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 15px rgba(168, 85, 247, 0.3);
    transition: all 0.2s;
  }
  .ai-detect-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(168, 85, 247, 0.5); }
  .ai-detect-btn.analyzing { opacity: 0.7; animation: pulse-btn 1s infinite alternate; }
  @keyframes pulse-btn { 0% { opacity: 0.6; } 100% { opacity: 1; } }

  .studio-split {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 20px;
  }

  /* Preview Panel */
  .preview-panel {
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .preview-header { display: flex; justify-content: space-between; align-items: center; }
  .preview-title-row { display: flex; align-items: center; gap: 8px; }
  .p-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e; }
  .preview-title-row h4 { font-size: 12px; font-weight: 800; margin: 0; color: #cbd5e1; }
  .preview-device-toggle { display: flex; background: rgba(255, 255, 255, 0.05); border-radius: 6px; padding: 2px; }
  .preview-device-toggle button { background: none; border: none; color: #94a3b8; font-size: 10px; font-weight: 700; padding: 3px 6px; border-radius: 4px; cursor: pointer; }
  .preview-device-toggle button.active { background: #a855f7; color: #fff; }

  .preview-stage {
    background: radial-gradient(circle at center, rgba(168, 85, 247, 0.1) 0%, rgba(0, 0, 0, 0.5) 100%);
    border-radius: 12px;
    padding: 30px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 380px;
  }

  /* Mock Card Replica */
  .mock-game-card {
    width: 170px;
    border-radius: 12px;
    background: #111;
    overflow: hidden;
    position: relative;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
    transition: transform 0.2s;
  }
  .preview-stage.mobile .mock-game-card { width: 130px; }
  .mock-img-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 3/4;
    overflow: hidden;
    border-radius: 10px;
  }
  .mock-img-wrapper img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .mock-hover-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .mock-game-card:hover .mock-hover-overlay { opacity: 1; }
  .mock-play-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #a855f7, #ec4899);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }
  .mock-play-btn svg { width: 18px; height: 18px; }
  .mock-details { position: absolute; bottom: 8px; text-align: center; }
  .m-prov { font-size: 10px; color: #fff; font-weight: 700; display: block; }
  .m-tag { font-size: 9px; color: #facc15; font-weight: 600; }
  .mock-card-footer { padding: 8px 10px; background: #0c0a14; }
  .m-name { font-size: 11px; font-weight: 800; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .m-pname { font-size: 9px; color: #64748b; }

  .preview-caption {
    font-size: 11px;
    color: #94a3b8;
    text-align: center;
    margin-top: 20px;
    line-height: 1.4;
    max-width: 220px;
  }
  .caption-icon { color: #facc15; }

  /* Controls Panel */
  .controls-panel {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .group-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    font-weight: 800;
    color: #cbd5e1;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .curr-label { font-size: 12px; font-weight: 800; }

  .themes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 8px;
  }
  .theme-chip {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 8px 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
    position: relative;
  }
  .theme-chip:hover { background: rgba(255, 255, 255, 0.05); }
  .theme-chip.active {
    border-color: var(--active-border, #a855f7);
    background: var(--active-glow, rgba(168, 85, 247, 0.2));
  }
  .t-icon { font-size: 16px; flex-shrink: 0; }
  .t-text { flex: 1; min-width: 0; }
  .t-name { font-size: 11.5px; font-weight: 800; color: #fff; display: block; }
  .t-desc { font-size: 9.5px; color: #94a3b8; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .color-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  .variant-toggle-group {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .var-btn {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 10px;
    cursor: pointer;
    text-align: center;
    transition: all 0.15s;
  }
  .var-btn:hover { background: rgba(255, 255, 255, 0.05); }
  .var-btn.active { border-color: #a855f7; background: rgba(168, 85, 247, 0.2); }
  .var-icon { font-size: 14px; display: block; margin-bottom: 2px; }
  .var-name { font-size: 12px; font-weight: 800; color: #fff; display: block; }
  .var-sub { font-size: 9px; color: #94a3b8; display: block; margin-top: 2px; }

  .control-row-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .cms-select-dark, .cms-input-dark {
    width: 100%;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    outline: none;
  }
  .cms-range { width: 100%; accent-color: #a855f7; cursor: pointer; }

  .badge-toggle-row { display: flex; justify-content: space-between; align-items: center; }
  .badge-input-wrapper { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
  .quick-badge-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .q-chip {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
    cursor: pointer;
  }
  .q-chip:hover, .q-chip.active { background: #a855f7; color: #fff; border-color: #a855f7; }

  .studio-actions-bar {
    display: flex;
    gap: 12px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
  .save-fx-btn {
    flex: 1;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border: none;
    color: #fff;
    font-size: 13px;
    font-weight: 800;
    padding: 12px 20px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
    transition: all 0.2s;
  }
  .save-fx-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(34, 197, 94, 0.6); }
  .remove-fx-btn {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid #ef4444;
    color: #f87171;
    font-size: 12px;
    font-weight: 700;
    padding: 10px 16px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .remove-fx-btn:hover { background: #ef4444; color: #fff; }

  .no-game-selected {
    height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #64748b;
    border: 1px dashed rgba(255, 255, 255, 0.08);
    border-radius: 14px;
  }
  .empty-icon { font-size: 40px; margin-bottom: 10px; opacity: 0.5; }

  /* ── Manager Tab Styles ── */
  .manager-workspace { display: flex; flex-direction: column; gap: 16px; }
  .manager-top-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
  .manager-top-bar h3 { font-size: 18px; font-weight: 800; margin: 0; }
  .manager-desc { font-size: 12px; color: #94a3b8; margin: 4px 0 0; }
  .clear-all-btn {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid #ef4444;
    color: #f87171;
    font-size: 12px;
    font-weight: 700;
    padding: 8px 14px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .clear-all-btn:hover { background: #ef4444; color: #fff; }

  .empty-manager {
    background: rgba(255, 255, 255, 0.02);
    border: 1px dashed rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 60px 20px;
    text-align: center;
  }
  .big-icon { font-size: 44px; display: block; margin-bottom: 12px; opacity: 0.5; }
  .empty-manager h4 { font-size: 16px; margin: 0 0 6px; }
  .empty-manager p { font-size: 13px; color: #94a3b8; max-width: 450px; margin: 0 auto 16px; }
  .goto-studio-btn {
    background: #a855f7;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
  }

  .effects-table-wrapper {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    overflow: hidden;
  }
  .effects-table { width: 100%; border-collapse: collapse; text-align: left; }
  .effects-table th {
    background: rgba(0, 0, 0, 0.3);
    padding: 12px 16px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: #94a3b8;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .effects-table td {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    font-size: 13px;
  }
  .tbl-game-cell { display: flex; align-items: center; gap: 10px; }
  .tbl-thumb { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; }
  .tbl-name { font-weight: 700; color: #fff; }
  .tbl-prov { font-size: 11px; color: #64748b; }
  .tbl-fx-chip { font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; }
  .tbl-badge-neutral { font-size: 11px; background: rgba(255, 255, 255, 0.06); padding: 3px 8px; border-radius: 4px; color: #cbd5e1; }
  .tbl-mode-text { font-size: 11px; color: #94a3b8; }
  .tbl-badge-preview { font-size: 10px; font-weight: 800; color: #fff; padding: 2px 7px; border-radius: 12px; }
  .tbl-actions { display: flex; gap: 8px; justify-content: flex-end; }
  .tbl-btn-edit { background: rgba(168, 85, 247, 0.15); border: 1px solid #a855f7; color: #d8b4fe; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }
  .tbl-btn-del { background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #f87171; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }

  /* ── Batch Tab Styles ── */
  .batch-workspace { display: flex; flex-direction: column; gap: 16px; }
  .batch-intro h3 { font-size: 18px; font-weight: 800; margin: 0; }
  .batch-intro p { font-size: 12px; color: #94a3b8; margin: 4px 0 0; }
  .recipes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
    gap: 16px;
  }
  .recipe-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
    overflow: hidden;
  }
  .recipe-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--r-color, #a855f7);
  }
  .recipe-top { display: flex; justify-content: space-between; align-items: center; }
  .recipe-badge { background: var(--r-color, #a855f7); color: #fff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; }
  .recipe-count-pill { font-size: 11px; color: #94a3b8; background: rgba(255, 255, 255, 0.06); padding: 3px 8px; border-radius: 6px; font-weight: 700; }
  .recipe-card h4 { font-size: 15px; font-weight: 800; margin: 0; color: #fff; }
  .recipe-desc { font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.4; flex: 1; }
  .recipe-specs { display: flex; gap: 14px; background: rgba(0, 0, 0, 0.2); padding: 8px 12px; border-radius: 8px; }
  .spec-item { display: flex; flex-direction: column; gap: 2px; }
  .spec-label { font-size: 9.5px; color: #64748b; text-transform: uppercase; font-weight: 700; }
  .spec-val { font-size: 11px; font-weight: 800; color: #fff; }

  .apply-recipe-btn {
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.3));
    border: 1px solid var(--r-color, #a855f7);
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    padding: 10px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
  }
  .apply-recipe-btn:hover:not(:disabled) {
    background: var(--r-color, #a855f7);
    color: #000;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  }
  .apply-recipe-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
