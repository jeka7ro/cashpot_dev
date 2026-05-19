<script>
  import { onMount } from "svelte";
  import { cmsPlayArenaConfig } from "./store.js";
  import { fade, slide, fly } from "svelte/transition";

  export let activeView = "home";
  export let config = null;
  export let userAvatar = null;
  
  $: currentConfig = config || $cmsPlayArenaConfig;
  $: currentAvatar = userAvatar || currentConfig?.userAvatar;
  
  let activeTab = "home";
  
  $: if (currentConfig && currentConfig.activeSubView) {
    activeTab = currentConfig.activeSubView;
  }

  function setSubView(tab) {
    activeTab = tab;
    cmsPlayArenaConfig.update(c => {
      if (!c) return c;
      return { ...c, activeSubView: tab };
    });
  }

  const statusColors = {
    available: "var(--accent-gold)",
    completed: "var(--success)",
    in_progress: "#3b82f6"
  };

  const statusLabels = {
    available: "Disponibil",
    completed: "Finalizat",
    in_progress: "În curs"
  };

  function getIcon(val) {
    if (!val) return val;
    if (typeof val === 'string') {
      if (val.includes('🏠')) return '/icons/pa_icon_home.png';
      if (val.includes('🎯')) return '/icons/pa_icon_missions.png';
      if (val.includes('🏆')) return '/icons/pa_icon_tournaments.png';
      if (val.includes('🎁')) return '/icons/pa_icon_bonus.png';
      if (val.includes('💰')) return '/icons/pa_icon_coin.png';
      if (val.includes('🐻')) return '/icons/pa_icon_bonus.png';
      if (val.includes('📅')) return '/icons/pa_icon_missions.png';
      if (val.includes('✉')) return '/icons/pa_icon_messages.png';
      if (val.includes('🎡')) return '/icons/pa_icon_wheel.png';
    }
    return val;
  }

  // Wheel State
  let wheelRotation = 0;
  let wheelSpinning = false;
  let wheelPrize = "";
  let showWheelPrize = false;
  
  const wheelSegments = [
    { label: "3 Rotiri", color: "#16a34a" },
    { label: "50 Rotiri", color: "#2563eb" },
    { label: "10 Rotiri", color: "#0d9488" },
    { label: "50% Bonus", color: "#db2777" },
    { label: "7 Rotiri", color: "#16a34a" },
    { label: "20% Bonus", color: "#dc2626" },
    { label: "5 Rotiri", color: "#7c3aed" },
    { label: "77 Rotiri", color: "#dc2626" },
  ];

  function spinWheel() {
    if (wheelSpinning) return;
    wheelSpinning = true;
    showWheelPrize = false;
    const segCount = wheelSegments.length;
    const winIdx = Math.floor(Math.random() * segCount);
    const degPerSeg = 360 / segCount;
    const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360;
    const targetDeg = extraSpins + (360 - (winIdx * degPerSeg + degPerSeg / 2));
    wheelRotation = wheelRotation + targetDeg;
    setTimeout(() => {
      wheelSpinning = false;
      wheelPrize = wheelSegments[winIdx].label;
      showWheelPrize = true;
      setTimeout(() => { showWheelPrize = false; }, 4000);
    }, 3600);
  }

</script>

<div class="play-arena-wrapper" in:fade={{ duration: 400 }}>
  <!-- Bubbles Background -->
  <div class="bubbles-bg">
    {#each Array(20) as _, i}
      <div
        class="bubble-item"
        style="left: {Math.random() * 100}%; animation-delay: {Math.random() * 5}s; width: {Math.random() * 15 + 5}px; height: {Math.random() * 15 + 5}px;"
      ></div>
    {/each}
  </div>

  <div class="play-arena-container">
    <!-- Hero Header -->
    <div class="pa-hero glass-panel">
      <div class="pa-hero-content">
        <div class="pa-user-info">
          <div class="pa-avatar-wrapper">
          <img src={currentAvatar} alt="Avatar" class="pa-avatar" />
          <div class="pa-level-badge">{currentConfig.coins}</div>
        </div>
        <div class="pa-user-text">
          <h1>Salut, {currentConfig.userName}!</h1>
          <p>Bine ai venit în Play Arena. Verifică misiunile tale și revendică premiile.</p>
        </div>
      </div>
      
      <div class="pa-stats-grid">
        <div class="pa-stat-card glass">
          <span class="pa-stat-label">Balanță Coins</span>
          <div class="pa-stat-value">
            <img src="/icons/pa_icon_coin.png" alt="Coins" style="width: 28px; height: 28px;" />
            {currentConfig.coins}
          </div>
        </div>
        <div class="pa-stat-card glass">
          <span class="pa-stat-label">Misiuni Active</span>
          <div class="pa-stat-value">
            <img src="/icons/pa_icon_missions.png" alt="Missions" style="width: 28px; height: 28px;" />
            {currentConfig.missionsCount}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Sub-navigation -->
    <div class="pa-nav-wrapper">
      <nav class="pa-nav">
        {#each currentConfig.items as item}
          {#if item.enabled}
            <button 
              class="pa-nav-item {activeTab === item.id.replace('pa_', '') ? 'active' : ''}"
              on:click={() => setSubView(item.id.replace('pa_', ''))}
            >
              <span class="item-icon">
                {#if getIcon(item.icon) && getIcon(item.icon).startsWith('/')}
                  <img src={getIcon(item.icon)} alt={item.label} style="height: 20px; object-fit: contain;" />
                {:else}
                  {item.icon}
                {/if}
              </span>
              <span class="item-label">{item.label}</span>
            </button>
          {/if}
        {/each}
      </nav>
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="pa-content">
    {#if activeTab === "home"}
      <div class="pa-grid" in:fly={{ y: 20, duration: 400 }}>
        <!-- Quick Missions -->
        <section class="pa-section glass-panel">
          <div class="pa-section-header">
            <h2><img src="/icons/pa_icon_missions.png" alt="icon" style="height:24px; vertical-align:middle; margin-right:8px;" />Misiuni Recomandate</h2>
            <button class="btn-text" on:click={() => setSubView('missions')}>Vezi toate →</button>
          </div>
          <div class="pa-missions-list">
            {#each currentConfig.missions.slice(0, 3) as mission}
              <div class="pa-mission-card">
                <div class="mission-icon-box">
                  {#if getIcon(mission.icon) && getIcon(mission.icon).startsWith('/')}
                    <img src={getIcon(mission.icon)} alt="icon" style="height: 36px; object-fit: contain;" />
                  {:else}
                    {mission.icon}
                  {/if}
                </div>
                <div class="mission-info">
                  <h3>{mission.title}</h3>
                  <p>{mission.reward}</p>
                  {#if mission.timeRemaining}
                    <div class="mission-timer">Expiră în: {mission.timeRemaining}</div>
                  {/if}
                </div>
                <div class="mission-action">
                  {#if mission.needsEnroll}
                    <button class="pa-btn-sm secondary">Înscrie-te</button>
                  {:else}
                    <button class="pa-btn-sm primary">Joacă</button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </section>

        <!-- Bonus Factory Preview -->
        <section class="pa-section glass-panel promo-card">
          <div class="pa-section-header">
            <h2><img src="/icons/pa_icon_bonus.png" alt="icon" style="height:24px; vertical-align:middle; margin-right:8px;" />Bonus Factory</h2>
          </div>
          <div class="bonus-preview-content">
            <div class="bonus-visual">
              <img src="/icons/pa_icon_bonus.png" alt="Bonus" class="gift-box" style="width: 100%; height: 100%; object-fit: contain;" />
              <div class="glow-effect"></div>
            </div>
            <div class="bonus-text">
              <p>Ai un pachet de 50 Runde Gratuite gata de activat!</p>
              <button class="pa-btn primary">Revendică Acum</button>
            </div>
          </div>
        </section>
      </div>
    {:else if activeTab === "missions"}
      <div class="pa-full-view" in:fly={{ y: 20, duration: 400 }}>
        <h2 class="view-title">Misiunile Tale</h2>
        <div class="pa-missions-grid">
          {#each currentConfig.missions as mission}
             <div class="pa-mission-card-large">
                <div class="card-status" style="background: {statusColors[mission.status] || '#9ca3af'}">
                  {statusLabels[mission.status] || 'Inactiv'}
                </div>
                <div class="card-main">
                  <div class="large-icon">
                    {#if getIcon(mission.icon) && getIcon(mission.icon).startsWith('/')}
                      <img src={getIcon(mission.icon)} alt="icon" style="height: 60px; object-fit: contain;" />
                    {:else}
                      {mission.icon}
                    {/if}
                  </div>
                  <div class="large-info">
                    <h3>{mission.title}</h3>
                    <p class="reward-text">Recompensă: <strong>{mission.reward}</strong></p>
                  </div>
                </div>
                <div class="card-footer">
                   {#if mission.status === 'available'}
                     <button class="pa-btn block primary">Începe Misiunea</button>
                   {:else}
                     <button class="pa-btn block disabled" disabled>În desfășurare</button>
                   {/if}
                </div>
             </div>
          {/each}
        </div>
      </div>
    {:else if activeTab === "wheel"}
      <div class="pa-full-view pa-wheel-view" in:fly={{ y: 20, duration: 400 }}>
        <h2 class="view-title">Roata Norocului</h2>
        <div class="pa-wheel-container">
          <div class="pa-wheel-wrapper">
             <div class="pa-wheel-indicator">▼</div>
             <img src="/wheel.png" alt="Wheel" class="pa-wheel-img" style="transform: rotate({wheelRotation}deg); transition: transform {wheelSpinning ? '3.5s' : '0s'} cubic-bezier(0.17, 0.67, 0.12, 0.99);" />
          </div>
          
          <div class="pa-wheel-controls">
            {#if showWheelPrize}
               <div class="pa-wheel-prize" in:fade>🎉 Ai câștigat: {wheelPrize}!</div>
            {/if}
            <button class="pa-btn primary pa-spin-btn" disabled={wheelSpinning} on:click={spinWheel}>
              {wheelSpinning ? "Se rotește..." : "Învârte Acum"}
            </button>
          </div>
        </div>
      </div>
    {:else}
      <div class="pa-empty-state glass-panel" in:fade>
        <img src="/icons/pa_icon_tournaments.png" alt="Empty" style="height: 80px; margin-bottom: 20px; opacity: 0.8;" />
        <h2>Sectiunea {activeTab} este în construcție</h2>
        <p>Revenim curând cu funcționalități noi pentru tine!</p>
        <button class="pa-btn secondary" on:click={() => setSubView('home')}>Înapoi la Acasă</button>
      </div>
    {/if}
    </div>
  </div>
</div>

<style>
  .play-arena-wrapper {
    background: radial-gradient(circle at top right, rgba(245, 200, 66, 0.15), transparent 40%),
                radial-gradient(circle at bottom left, rgba(76, 29, 149, 0.2), transparent 40%),
                var(--bg-dark);
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    padding: 80px 20px;
    width: 100%;
  }

  [data-theme="light"] .play-arena-wrapper {
    background: radial-gradient(circle at top right, rgba(245, 200, 66, 0.2), transparent 40%),
                radial-gradient(circle at bottom left, rgba(76, 29, 149, 0.1), transparent 40%),
                #f8fafc;
  }

  .play-arena-container {
    max-width: 1200px;
    margin: 0 auto;
    color: var(--text-main);
    font-family: var(--font-main);
    position: relative;
    z-index: 2;
  }

  .pa-hero {
    margin-bottom: 30px;
    padding: 30px;
    border-radius: 30px;
  }

  .pa-hero-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 20px;
  }

  .pa-user-info {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .pa-avatar-wrapper {
    position: relative;
    width: 90px;
    height: 90px;
  }

  .pa-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 3px solid var(--accent-gold);
    object-fit: cover;
    box-shadow: 0 0 20px rgba(245, 200, 66, 0.3);
  }

  .pa-level-badge {
    position: absolute;
    bottom: -5px;
    right: -5px;
    background: linear-gradient(135deg, var(--accent-gold), #e6a817);
    color: #1a1200;
    font-weight: 900;
    font-size: 14px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid var(--bg-dark);
  }

  .pa-user-text h1 {
    font-size: 32px;
    font-weight: 900;
    margin: 0 0 4px 0;
    background: linear-gradient(to right, #fff, var(--accent-gold));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .pa-user-text p {
    color: var(--text-muted);
    margin: 0;
    font-size: 15px;
    font-weight: 500;
  }

  .pa-stats-grid {
    display: flex;
    gap: 16px;
  }

  .pa-stat-card {
    padding: 16px 24px;
    min-width: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .pa-stat-label {
    font-size: 11px;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 1px;
    margin-bottom: 8px;
    font-weight: 700;
  }

  .pa-stat-value {
    font-size: 28px;
    font-weight: 900;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .coin-icon { color: var(--accent-gold); }

  .pa-nav-wrapper {
    position: relative;
    z-index: 100;
    border-top: 1px solid rgba(255,255,255,0.05);
    padding-top: 20px;
  }

  .pa-nav {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .pa-nav::-webkit-scrollbar { display: none; }

  .pa-nav-item {
    padding: 12px 24px;
    border-radius: 99px;
    border: 1px solid rgba(255,255,255,0.05);
    background: rgba(255,255,255,0.02);
    color: var(--text-muted);
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    white-space: nowrap;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .pa-nav-item.active {
    background: var(--accent-gold);
    color: #1a1200;
    border-color: var(--accent-gold);
    box-shadow: 0 4px 15px rgba(245, 200, 66, 0.3);
  }

  .pa-nav-item:hover:not(.active) {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    transform: translateY(-2px);
  }

  .pa-content {
    margin-top: 0;
  }

  .pa-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 24px;
  }

  .pa-section {
    padding: 30px;
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
  }

  .pa-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .pa-section-header h2 {
    font-size: 20px;
    font-weight: 800;
    margin: 0;
  }

  .btn-text {
    background: transparent;
    border: none;
    color: var(--accent-gold);
    font-weight: 700;
    cursor: pointer;
    font-size: 14px;
    transition: opacity 0.2s;
  }
  .btn-text:hover { opacity: 0.8; }

  .pa-missions-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .pa-mission-card {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 16px 20px;
    border-radius: 20px;
    background: rgba(0,0,0,0.2);
    border: 1px solid rgba(255, 255, 255, 0.03);
    transition: transform 0.2s, background 0.2s;
  }

  .pa-mission-card:hover {
    transform: translateX(5px);
    background: rgba(255,255,255,0.03);
  }

  .mission-icon-box {
    width: 50px;
    height: 50px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }

  .mission-info {
    flex: 1;
  }

  .mission-info h3 {
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 4px 0;
  }

  .mission-info p {
    font-size: 14px;
    color: var(--accent-gold);
    margin: 0;
    font-weight: 700;
  }

  .mission-timer {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 6px;
    font-weight: 600;
  }

  .glass {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: var(--shadow-glass);
  }

  .glass-light {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .pa-btn {
    padding: 14px 28px;
    border-radius: 99px;
    border: none;
    font-weight: 800;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pa-btn.primary {
    background: linear-gradient(135deg, #7c3aed, #4c1d95);
    color: var(--accent-gold);
    box-shadow: 0 4px 15px rgba(109, 40, 217, 0.4);
  }
  .pa-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(109, 40, 217, 0.6);
  }

  .pa-btn.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  .pa-btn.secondary:hover {
    background: rgba(255,255,255,0.15);
  }

  .pa-btn-sm {
    padding: 10px 20px;
    border-radius: 99px;
    border: none;
    font-weight: 800;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pa-btn-sm.primary { background: linear-gradient(135deg, #7c3aed, #4c1d95); color: var(--accent-gold); box-shadow: 0 2px 10px rgba(109, 40, 217, 0.4); }
  .pa-btn-sm.primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(109, 40, 217, 0.6); }
  
  .pa-btn-sm.secondary { background: rgba(255, 255, 255, 0.1); color: #fff; }
  .pa-btn-sm.secondary:hover { background: rgba(255, 255, 255, 0.15); }

  .promo-card {
    background: linear-gradient(135deg, rgba(76, 29, 149, 0.2), rgba(30, 41, 59, 0.4));
    display: flex;
    flex-direction: column;
  }

  .bonus-preview-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 24px;
    flex: 1;
    justify-content: center;
  }

  .bonus-visual {
    position: relative;
    width: 140px;
    height: 140px;
    cursor: pointer;
  }

  .gift-box {
    width: 100%;
    height: 100%;
    object-fit: contain;
    position: relative;
    z-index: 2;
    animation: floating 4s infinite ease-in-out;
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    filter: drop-shadow(0 10px 15px rgba(0,0,0,0.5));
  }
  
  .bonus-visual:hover .gift-box {
    transform: scale(1.1) rotate(3deg);
    animation: none;
  }

  .glow-effect {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 150px;
    height: 150px;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, rgba(245, 200, 66, 0.3) 40%, transparent 70%);
    border-radius: 50%;
    animation: pulseGlow 3s infinite alternate;
    z-index: 1;
  }
  
  @keyframes floating {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes pulseGlow {
    0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
    100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
  }
  .pa-missions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
  }

  .pa-mission-card-large {
    border-radius: 24px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .pa-mission-card-large:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0,0,0,0.3);
  }

  .card-status {
    padding: 8px 16px;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    text-align: center;
    color: #000;
    letter-spacing: 1px;
  }

  .card-main {
    padding: 30px;
    display: flex;
    gap: 20px;
    align-items: center;
    flex: 1;
  }

  .large-icon { font-size: 48px; }

  .large-info h3 { margin: 0 0 8px 0; font-size: 20px; font-weight: 800; }
  .reward-text { margin: 0; color: var(--text-muted); font-size: 15px; }

  .card-footer { padding: 16px; border-top: 1px solid rgba(255,255,255,0.05); }

  .pa-btn.block { width: 100%; }

  .pa-empty-state {
    padding: 60px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    border-radius: 30px;
  }

  .empty-icon { font-size: 60px; }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 0.4; transform: translate(-50%, -50%) scale(1.2); }
  }

  @media (max-width: 768px) {
    .pa-grid { grid-template-columns: 1fr; }
    .pa-hero-content { flex-direction: column; align-items: flex-start; }
    .pa-stats-grid { width: 100%; }
    .pa-stat-card { flex: 1; }
  }
  
  /* Wheel Styles */
  .pa-wheel-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    background: radial-gradient(circle at center, rgba(245,200,66,0.1), transparent 70%);
  }
  .pa-wheel-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    margin-top: 20px;
  }
  .pa-wheel-wrapper {
    position: relative;
    width: 320px;
    height: 320px;
    border-radius: 50%;
    box-shadow: 0 0 50px rgba(245,200,66,0.2), inset 0 0 20px rgba(0,0,0,0.5);
    background: #0f172a;
    padding: 8px;
    border: 4px solid var(--accent-gold);
  }
  .pa-wheel-indicator {
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 32px;
    color: var(--accent-gold);
    z-index: 10;
    text-shadow: 0 4px 10px rgba(0,0,0,0.8);
  }
  .pa-wheel-img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    will-change: transform;
    display: block;
  }
  .pa-wheel-controls {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }
  .pa-wheel-prize {
    background: linear-gradient(135deg, var(--accent-gold), #d97706);
    color: #1a1200;
    font-weight: 900;
    font-size: 16px;
    padding: 8px 24px;
    border-radius: 99px;
    box-shadow: 0 4px 15px rgba(245,200,66,0.4);
  }
  .pa-spin-btn {
    font-size: 18px;
    padding: 16px 40px;
    box-shadow: 0 4px 20px rgba(109,40,217,0.4);
  }
</style>
