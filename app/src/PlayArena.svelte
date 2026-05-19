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

</script>

<div class="play-arena-container" in:fade={{ duration: 400 }}>
  <!-- Hero Header -->
  <div class="pa-hero">
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
            <span class="coin-icon">💰</span>
            {currentConfig.coins}
          </div>
        </div>
        <div class="pa-stat-card glass">
          <span class="pa-stat-label">Misiuni Active</span>
          <div class="pa-stat-value">
            <span class="mission-icon">🎯</span>
            {currentConfig.missionsCount}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Sub-navigation -->
    <div class="pa-nav-wrapper">
      <nav class="pa-nav glass">
        {#each currentConfig.items as item}
          {#if item.enabled}
            <button 
              class="pa-nav-item {activeTab === item.id.replace('pa_', '') ? 'active' : ''}"
              on:click={() => setSubView(item.id.replace('pa_', ''))}
            >
              <span class="item-icon">{item.icon}</span>
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
        <section class="pa-section glass">
          <div class="pa-section-header">
            <h2>🎯 Misiuni Recomandate</h2>
            <button class="btn-text" on:click={() => setSubView('missions')}>Vezi toate →</button>
          </div>
          <div class="pa-missions-list">
            {#each currentConfig.missions.slice(0, 3) as mission}
              <div class="pa-mission-card glass-light">
                <div class="mission-icon-box">{mission.icon}</div>
                <div class="mission-info">
                  <h3>{mission.title}</h3>
                  <p>{mission.reward}</p>
                  {#if mission.timeRemaining}
                    <div class="mission-timer">⏳ Expira in: {mission.timeRemaining}</div>
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
        <section class="pa-section glass promo-card">
          <div class="pa-section-header">
            <h2>🎁 Bonus Factory</h2>
          </div>
          <div class="bonus-preview-content">
            <div class="bonus-visual">
              <div class="gift-box">📦</div>
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
             <div class="pa-mission-card-large glass">
                <div class="card-status" style="background: {statusColors[mission.status] || '#9ca3af'}">
                  {statusLabels[mission.status] || 'Inactiv'}
                </div>
                <div class="card-main">
                  <div class="large-icon">{mission.icon}</div>
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
    {:else}
      <div class="pa-empty-state glass" in:fade>
        <div class="empty-icon">🏗️</div>
        <h2>Sectiunea {activeTab} este în construcție</h2>
        <p>Revenim curând cu funcționalități noi pentru tine!</p>
        <button class="pa-btn secondary" on:click={() => setSubView('home')}>Înapoi la Acasă</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .play-arena-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    color: var(--text-main);
    font-family: var(--font-main);
  }

  .pa-hero {
    margin-bottom: 30px;
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
    width: 80px;
    height: 80px;
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
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--bg-dark);
  }

  .pa-user-text h1 {
    font-size: 28px;
    font-weight: 900;
    margin: 0 0 4px 0;
    background: linear-gradient(to right, #fff, var(--accent-gold));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .pa-user-text p {
    color: var(--text-muted);
    margin: 0;
    font-size: 14px;
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
    border-radius: 20px;
  }

  .pa-stat-label {
    font-size: 11px;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 1px;
    margin-bottom: 8px;
  }

  .pa-stat-value {
    font-size: 24px;
    font-weight: 900;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .coin-icon { color: var(--accent-gold); }

  .pa-nav-wrapper {
    position: sticky;
    top: 10px;
    z-index: 100;
  }

  .pa-nav {
    display: flex;
    gap: 8px;
    padding: 8px;
    border-radius: 40px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .pa-nav::-webkit-scrollbar { display: none; }

  .pa-nav-item {
    padding: 10px 20px;
    border-radius: 30px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    transition: all 0.2s;
  }

  .pa-nav-item.active {
    background: var(--accent-gold);
    color: #1a1200;
    box-shadow: 0 4px 15px rgba(245, 200, 66, 0.4);
  }

  .pa-nav-item:hover:not(.active) {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }

  .pa-content {
    margin-top: 24px;
  }

  .pa-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 24px;
  }

  .pa-section {
    padding: 24px;
    border-radius: 24px;
  }

  .pa-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .pa-section-header h2 {
    font-size: 18px;
    font-weight: 800;
    margin: 0;
  }

  .btn-text {
    background: transparent;
    border: none;
    color: var(--accent-gold);
    font-weight: 700;
    cursor: pointer;
    font-size: 13px;
  }

  .pa-missions-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .pa-mission-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    border-radius: 16px;
    transition: transform 0.2s;
  }

  .pa-mission-card:hover {
    transform: translateX(5px);
  }

  .mission-icon-box {
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  .mission-info {
    flex: 1;
  }

  .mission-info h3 {
    font-size: 15px;
    font-weight: 700;
    margin: 0 0 2px 0;
  }

  .mission-info p {
    font-size: 13px;
    color: var(--accent-gold);
    margin: 0;
    font-weight: 600;
  }

  .mission-timer {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 4px;
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
    padding: 12px 24px;
    border-radius: 12px;
    border: none;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pa-btn.primary {
    background: linear-gradient(135deg, var(--accent-gold), #e6a817);
    color: #1a1200;
  }

  .pa-btn.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .pa-btn-sm {
    padding: 8px 16px;
    border-radius: 10px;
    border: none;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
  }

  .pa-btn-sm.primary { background: var(--accent-gold); color: #1a1200; }
  .pa-btn-sm.secondary { background: rgba(255, 255, 255, 0.1); color: #fff; }

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
    gap: 20px;
    flex: 1;
    justify-content: center;
  }

  .bonus-visual {
    position: relative;
    width: 100px;
    height: 100px;
  }

  .gift-box {
    font-size: 60px;
    position: relative;
    z-index: 2;
    animation: bounce 2s infinite;
  }

  .glow-effect {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, var(--accent-gold) 0%, transparent 70%);
    opacity: 0.3;
    animation: pulse 2s infinite;
  }

  .pa-missions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  .pa-mission-card-large {
    border-radius: 20px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .card-status {
    padding: 4px 12px;
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    text-align: center;
    color: #000;
  }

  .card-main {
    padding: 24px;
    display: flex;
    gap: 16px;
    align-items: center;
    flex: 1;
  }

  .large-icon { font-size: 40px; }

  .large-info h3 { margin: 0 0 4px 0; font-size: 18px; }
  .reward-text { margin: 0; color: var(--text-muted); font-size: 14px; }

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
</style>
