<script>
  import { onMount, onDestroy } from 'svelte';

  // ─── State ────────────────────────────────────────────
  let jackpots = {};
  let jackpotEnabled = true;
  let missions = [];
  let tournament = { name: '', endsAt: '', prizePool: '', leaderboard: [] };
  let playerXP = { level: 1, xp: 0, xpToNextLevel: 1000, rank: 'Bronze' };
  let loyalty = { rank: '', points: 0, nextRank: '', pointsToNext: 0, perks: [] };
  let cashback = { available: 0, totalClaimed: 0, history: [] };
  let wheelPrizes = [];
  let wheelSpinsLeft = 0;

  let sidebarOpen = false;
  let activeTab = 'missions';
  let spinning = false;
  let wheelResult = null;
  let toasts = [];
  let ws = null;
  let timeLeft = '';
  let wheelAngle = 0;

  // ─── WebSocket ────────────────────────────────────────
  function connectWS() {
    try {
      ws = new WebSocket('ws://localhost:3001');
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'INIT') {
          jackpotEnabled = msg.jackpotEnabled !== false;
          jackpots = msg.jackpots || {};
          tournament = msg.tournament || tournament;
          playerXP = msg.playerXP || playerXP;
          missions = msg.missions || [];
          wheelSpinsLeft = msg.wheelSpinsLeft ?? 0;
          
          if (msg.loyaltyConfig && Array.isArray(msg.loyaltyConfig.tiers) && msg.loyaltyConfig.tiers.length > 0) {
            const tiers = msg.loyaltyConfig.tiers;
            const curTier = tiers.slice().reverse().find(t => playerXP.xp >= (t.pointsRequired || 0)) || tiers[0];
            const nextTierIdx = tiers.findIndex(t => t.name === curTier.name) + 1;
            const nextTier = tiers[nextTierIdx] || curTier;
            loyalty = {
              rank: curTier.name,
              points: playerXP.xp,
              nextRank: nextTier.name,
              pointsToNext: nextTier.pointsRequired || 0,
              perks: [`Multiplicator XP: ${curTier.xpMultiplier}x`, 'Retrageri Rapide', 'Manager Cont', 'Bonus Aniversar']
            };
          }

          if (msg.cashbackConfig) {
            cashback.available = Math.random() > 0.5 ? 145.50 : 0;
            cashback.totalClaimed = 1250.00;
            cashback.history = [{ date: msg.cashbackConfig.awardDay + ' Trecut', amount: 50.50 }];
          }
          updateCountdown();
        }
        if (msg.type === 'JACKPOT_TICK') jackpots = msg.jackpots;
        if (msg.type === 'TOURNAMENT_UPDATE') tournament.leaderboard = msg.leaderboard;
        if (msg.type === 'XP_UPDATE') playerXP = msg.playerXP;
        if (msg.type === 'LEVEL_UP') { playerXP = msg.playerXP; addToast('Nivel Nou', `Ai avansat la nivelul ${playerXP.level}`); }
        if (msg.type === 'MISSION_COMPLETED') { missions = missions.map(m => m.id === msg.mission.id ? msg.mission : m); addToast('Misiune Completată', msg.mission.title); }
        if (msg.type === 'WHEEL_SPIN') { wheelResult = msg.prize; playerXP = msg.playerXP; }
      };
      ws.onclose = () => setTimeout(connectWS, 3000);
    } catch(e) { setTimeout(connectWS, 3000); }
  }

  function addToast(title, desc) {
    const id = Date.now();
    toasts = [...toasts, { id, title, desc }];
    setTimeout(() => { toasts = toasts.filter(t => t.id !== id); }, 4000);
  }

  function updateCountdown() {
    if (!tournament.endsAt) return;
    const diff = new Date(tournament.endsAt) - new Date();
    if (diff <= 0) { timeLeft = 'Încheiat'; return; }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    timeLeft = `${h}h ${m}m`;
  }

  async function spinWheel() {
    if (spinning || wheelSpinsLeft <= 0) return;
    spinning = true;
    wheelResult = null;
    const spins = 5 + Math.random() * 3;
    const targetAngle = wheelAngle + spins * 360 + Math.floor(Math.random() * 360);
    wheelAngle = targetAngle;
    setTimeout(async () => {
      const res = await fetch('/api/game/wheel/spin', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        wheelResult = data.prize;
        wheelSpinsLeft = data.spinsLeft;
        playerXP = data.playerXP;
        addToast('Câștig!', data.prize.label);
      }
      spinning = false;
    }, 3500);
  }

  async function claimMission(mission) {
    if (mission.progress < mission.target || mission.completed) return;
    const res = await fetch(`/api/game/missions/${mission.id}/complete`, { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      missions = missions.map(m => m.id === mission.id ? data.mission : m);
      playerXP = data.playerXP;
      addToast('Recompensă Revendicată', mission.reward);
    }
  }

  function claimCashback() {
    if (cashback.available > 0) {
      addToast('Cashback Aprobat', `${fmt(cashback.available)} RON`);
      cashback.totalClaimed += cashback.available;
      cashback.history.unshift({ date: 'Astăzi', amount: cashback.available });
      cashback.available = 0;
    }
  }

  onMount(() => {
    connectWS();
    const interval = setInterval(updateCountdown, 60000);
    return () => { clearInterval(interval); if (ws) ws.close(); };
  });

  function fmt(n) {
    return typeof n === 'number' ? n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
  }

  $: xpPct = playerXP.xpToNextLevel > 0 ? Math.min(100, Math.round((playerXP.xp / playerXP.xpToNextLevel) * 100)) : 0;
  $: loyaltyPct = loyalty.pointsToNext > 0 ? Math.min(100, Math.round((loyalty.points / loyalty.pointsToNext) * 100)) : 0;
</script>

<!-- ─── Ultra-Premium Glass Ticker ─── -->
{#if jackpotEnabled && Object.keys(jackpots).length > 0}
<div class="glass-ticker">
  <div class="gt-inner">
    {#each Object.values(jackpots) as jp}
      <div class="gt-item">
        <span class="gt-name" style="color:{jp.color}">{jp.name}</span>
        <span class="gt-amount">{fmt(jp.amount)} RON</span>
      </div>
    {/each}
  </div>
</div>
{/if}

<!-- ─── Floating macOS Tahoe Dock Trigger ─── -->
<div class="dock-trigger" on:click={() => sidebarOpen = true}>
  <div class="dock-icon">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  </div>
</div>

<!-- ─── Glassmorphism Modal/Sidebar ─── -->
{#if sidebarOpen}
  <div class="glass-overlay" on:click|self={() => sidebarOpen = false}>
    <div class="glass-sidebar">
      
      <!-- Top Profile Area -->
      <div class="gs-header">
        <div class="gs-header-top">
          <div class="gs-profile">
            <div class="gs-avatar"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
            <div class="gs-user-info">
              <span class="gs-level">Nivel {playerXP.level}</span>
              <span class="gs-rank gradient-text">{playerXP.rank}</span>
            </div>
          </div>
          <button class="gs-close" on:click={() => sidebarOpen = false}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="gs-xp-track">
          <div class="gs-xp-labels">
            <span>{playerXP.xp} XP</span>
            <span>{playerXP.xpToNextLevel} XP</span>
          </div>
          <div class="gs-xp-bar"><div class="gs-xp-fill" style="width: {xpPct}%"></div></div>
        </div>
      </div>

      <!-- Navigation Pill Menu -->
      <div class="gs-nav-wrapper">
        <div class="gs-nav">
          <button class="gs-nav-item {activeTab === 'missions' ? 'active' : ''}" on:click={() => activeTab = 'missions'}>Misiuni</button>
          <button class="gs-nav-item {activeTab === 'tournament' ? 'active' : ''}" on:click={() => activeTab = 'tournament'}>Turneu</button>
          <button class="gs-nav-item {activeTab === 'loyalty' ? 'active' : ''}" on:click={() => activeTab = 'loyalty'}>Fidelizare</button>
          <button class="gs-nav-item {activeTab === 'cashback' ? 'active' : ''}" on:click={() => activeTab = 'cashback'}>Cashback</button>
          {#if wheelSpinsLeft > 0}
            <button class="gs-nav-item glow {activeTab === 'wheel' ? 'active' : ''}" on:click={() => activeTab = 'wheel'}>Roată</button>
          {/if}
        </div>
      </div>

      <!-- Content Area -->
      <div class="gs-content">
        
        {#if activeTab === 'missions'}
          <div class="fade-in">
            <div class="gs-section-title">Misiuni Active</div>
            <div class="gs-card-stack">
              {#each missions as m}
                <div class="gs-card {m.completed ? 'completed' : ''}">
                  <div class="gs-card-top">
                    <span class="gs-c-title">{m.title}</span>
                    <span class="gs-pill {m.category === 'daily' ? 'blue' : 'purple'}">{m.category === 'daily' ? 'Zilnic' : 'Săptămânal'}</span>
                  </div>
                  <p class="gs-c-desc">{m.desc}</p>
                  <div class="gs-c-progress">
                    <div class="gs-prog-bar"><div class="gs-prog-fill" style="width:{Math.min(100, Math.round((m.progress/m.target)*100))}%"></div></div>
                    <span class="gs-prog-text">{m.progress}/{m.target}</span>
                  </div>
                  <div class="gs-c-actions">
                    <span class="gs-reward-text">{m.reward}</span>
                    {#if m.completed}
                      <span class="gs-status-done">Finalizat</span>
                    {:else if m.progress >= m.target}
                      <button class="gs-btn-pill accent" on:click={() => claimMission(m)}>Revendică</button>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>

        {:else if activeTab === 'tournament'}
          <div class="fade-in">
            <div class="gs-section-title">{tournament.name}</div>
            <div class="gs-tourney-stats">
              <div class="gs-t-stat"><span>Timp Rămas</span><strong>{timeLeft}</strong></div>
              <div class="gs-t-stat"><span>Fond Premiere</span><strong class="gradient-text">{tournament.prizePool}</strong></div>
            </div>
            <div class="gs-card">
              <div class="gs-lb-table">
                <div class="gs-lb-header"><span>Poz</span><span>Nume</span><span class="right">Puncte</span></div>
                {#each (tournament.leaderboard || []).slice(0, 10) as p}
                  <div class="gs-lb-row {p.rank <= 3 ? 'top' : ''}">
                    <span class="gs-lb-rank">{p.rank}</span>
                    <span class="gs-lb-name">{p.name}</span>
                    <span class="gs-lb-pts right">{p.points.toLocaleString()}</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>

        {:else if activeTab === 'loyalty'}
          <div class="fade-in">
            <div class="gs-section-title">Club Fidelizare</div>
            <div class="gs-card loyalty-hero">
              <div class="loyalty-hero-top">
                <div class="hero-ring">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <div class="hero-info">
                  <span class="hero-label">Rangul tău VIP</span>
                  <span class="hero-val gradient-text">{loyalty.rank}</span>
                </div>
              </div>
              <div class="gs-xp-track">
                <div class="gs-xp-labels">
                  <span>{loyalty.points.toLocaleString()} XP</span>
                  <span>{loyalty.pointsToNext.toLocaleString()} XP</span>
                </div>
                <div class="gs-xp-bar"><div class="gs-xp-fill" style="width: {loyaltyPct}%"></div></div>
              </div>
            </div>
            <div class="gs-section-title">Avantaje Deblocate</div>
            <div class="gs-card perks-list">
              {#each loyalty.perks as perk}
                <div class="perk-item">
                  <div class="perk-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
                  <span>{perk}</span>
                </div>
              {/each}
            </div>
          </div>

        {:else if activeTab === 'cashback'}
          <div class="fade-in">
            <div class="gs-section-title">Cashback</div>
            <!-- Unified Single Card for Cashback -->
            <div class="gs-card unified-cashback">
              <div class="uc-top">
                <span class="uc-label">Suma Disponibilă</span>
                <div class="uc-amount gradient-text">{fmt(cashback.available)} <span class="uc-curr">RON</span></div>
                <button class="gs-btn-large accent" disabled={cashback.available <= 0} on:click={claimCashback}>
                  Transferă în Balanță
                </button>
              </div>
              
              <div class="uc-divider"></div>
              
              <div class="uc-bottom">
                <span class="uc-label-small">Istoric Transferuri</span>
                <div class="uc-history">
                  {#each cashback.history as h}
                    <div class="uc-h-row">
                      <span>{h.date}</span>
                      <span class="uc-h-val">+{fmt(h.amount)} RON</span>
                    </div>
                  {/each}
                  {#if cashback.history.length === 0}
                    <div class="uc-h-empty">Nu există transferuri recente.</div>
                  {/if}
                </div>
              </div>
            </div>
          </div>

        {:else if activeTab === 'wheel'}
          {@const defaultPrizes = [{label:'10 FS',color:'#1e293b'},{label:'50 RON',color:'#0f172a'},{label:'2x',color:'#1e293b'},{label:'25 FS',color:'#0f172a'},{label:'100 RON',color:'#1e293b'},{label:'5 FS',color:'#0f172a'},{label:'Retry',color:'#1e293b'},{label:'JACKPOT',color:'#0f172a'}]}
          {@const prizes = wheelPrizes && wheelPrizes.length > 0 ? wheelPrizes : defaultPrizes}
          {@const conicString = prizes.map((p, i) => `${p.color} ${i * (100 / prizes.length)}% ${(i + 1) * (100 / prizes.length)}%`).join(', ')}
          <div class="fade-in center-wheel">
            <div class="gs-section-title" style="text-align: center;">Roata Norocului</div>
            <p class="wheel-subs" style="text-align: center; margin-bottom: 32px;">Rotiri disponibile: <strong style="color: #fbbf24; font-size: 16px;">{wheelSpinsLeft}</strong></p>
            
            <div class="premium-wheel-wrap">
              <div class="pw-pointer">
                <svg viewBox="0 0 24 24" fill="#fbbf24" stroke="#b45309" stroke-width="2" width="40" height="40"><path d="M12 2L20 10H4z"/></svg>
              </div>
              <div class="pw-wheel" style="background: conic-gradient({conicString}); transform: rotate({wheelAngle}deg); transition: transform {spinning ? '4s' : '0s'} cubic-bezier(0.1, 0.7, 0.1, 1)">
                {#each prizes as prize, i}
                  <div class="pw-segment-text" style="transform: rotate({(i * (360 / prizes.length)) + ((360 / prizes.length) / 2)}deg);">
                    <span>{prize.label}</span>
                  </div>
                {/each}
                <div class="pw-center-dot"></div>
              </div>
            </div>
            {#if wheelResult}
              <div class="pw-result fade-in" style="margin-top: 32px;">
                Ai câștigat: <strong style="color: #fbbf24; font-size: 24px; text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);">{wheelResult.label}</strong>
              </div>
            {/if}
            <button class="gs-btn-large accent" disabled={spinning || wheelSpinsLeft <= 0} on:click={spinWheel} style="margin-top: {wheelResult ? '16px' : '32px'}; background: linear-gradient(135deg, #fbbf24, #d97706); color: #000; box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4); border: none; font-weight: 800; font-size: 16px; padding: 16px 32px; border-radius: 9999px;">
              {spinning ? 'Se rotește...' : 'ÎNVÂRTE ACUM'}
            </button>
          </div>
        {/if}

      </div>
    </div>
  </div>
{/if}

<!-- ─── Glass Toasts ─── -->
<div class="glass-toasts">
  {#each toasts as t (t.id)}
    <div class="glass-toast">
      <strong>{t.title}</strong>
      <span>{t.desc}</span>
    </div>
  {/each}
</div>

<style>
/* Base Variables - macOS Tahoe / Glassmorphism Aesthetic */
:root {
  --g-bg: rgba(18, 18, 24, 0.75);
  --g-panel: rgba(30, 30, 40, 0.6);
  --g-border: rgba(255, 255, 255, 0.1);
  --g-border-hover: rgba(255, 255, 255, 0.2);
  --g-text: #ffffff;
  --g-text-muted: rgba(255, 255, 255, 0.6);
  --g-accent: #10b981;
  --g-accent-hover: #059669;
  --font-main: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Glass Ticker */
.glass-ticker {
  background: var(--g-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--g-border);
  height: 40px;
  display: flex;
  align-items: center;
  overflow: hidden;
}
.gt-inner { display: flex; gap: 48px; padding: 0 32px; justify-content: center; width: 100%; }
.gt-item { display: flex; align-items: baseline; gap: 8px; font-family: var(--font-main); }
.gt-name { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
.gt-amount { font-size: 14px; font-weight: 600; color: var(--g-text); }

/* Floating Dock Trigger */
.dock-trigger {
  position: fixed;
  right: 24px;
  bottom: 32px;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, rgba(30,30,40,0.8), rgba(20,20,30,0.9));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--g-border);
  border-radius: 9999px; /* Pill/Circle */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s;
  z-index: 100;
}
.dock-trigger:hover {
  transform: scale(1.1);
  background: linear-gradient(135deg, rgba(40,40,50,0.9), rgba(30,30,40,0.95));
  border-color: var(--g-border-hover);
}
.dock-icon { color: var(--g-text); }
.dock-icon svg { filter: drop-shadow(0 0 8px rgba(255,255,255,0.3)); }

/* Glass Overlay & Sidebar */
.glass-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}
.glass-sidebar {
  width: 440px;
  max-width: 100%;
  background: rgba(18, 18, 24, 0.85);
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  border-left: 1px solid var(--g-border);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: -20px 0 50px rgba(0,0,0,0.6);
}
@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

/* Sidebar Header */
.gs-header { padding: 32px 32px 24px; border-bottom: 1px solid var(--g-border); }
.gs-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.gs-profile { display: flex; align-items: center; gap: 16px; }
.gs-avatar { width: 48px; height: 48px; background: rgba(255,255,255,0.05); border-radius: 9999px; display: flex; align-items: center; justify-content: center; color: var(--g-text); border: 1px solid var(--g-border); box-shadow: inset 0 2px 10px rgba(0,0,0,0.5); }
.gs-user-info { display: flex; flex-direction: column; gap: 2px; }
.gs-level { font-size: 16px; font-weight: 700; color: var(--g-text); }
.gs-rank { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

/* Gradient Text Effect */
.gradient-text {
  background: linear-gradient(135deg, #fcd34d, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.gs-close { background: rgba(255,255,255,0.05); border: 1px solid transparent; width: 32px; height: 32px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; color: var(--g-text-muted); cursor: pointer; transition: all 0.2s; }
.gs-close:hover { background: rgba(255,255,255,0.1); color: var(--g-text); }

/* Progress Trackers */
.gs-xp-track { display: flex; flex-direction: column; gap: 8px; }
.gs-xp-labels { display: flex; justify-content: space-between; font-size: 12px; color: var(--g-text-muted); font-weight: 500; font-variant-numeric: tabular-nums; }
.gs-xp-bar { height: 6px; background: rgba(0,0,0,0.5); border-radius: 9999px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.5); }
.gs-xp-fill { height: 100%; background: linear-gradient(90deg, #10b981, #34d399); border-radius: 9999px; box-shadow: 0 0 10px rgba(16, 185, 129, 0.5); }

/* Navigation Pills */
.gs-nav-wrapper { padding: 16px 32px; border-bottom: 1px solid var(--g-border); }
.gs-nav { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding-bottom: 4px; }
.gs-nav::-webkit-scrollbar { display: none; }
.gs-nav-item { flex: 0 0 auto; background: rgba(255,255,255,0.03); border: 1px solid var(--g-border); color: var(--g-text-muted); padding: 8px 16px; border-radius: 9999px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.gs-nav-item:hover { background: rgba(255,255,255,0.08); color: var(--g-text); }
.gs-nav-item.active { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); color: var(--g-text); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
.gs-nav-item.glow { border-color: rgba(16,185,129,0.3); color: #34d399; }
.gs-nav-item.glow.active { background: rgba(16,185,129,0.2); border-color: #10b981; color: #fff; box-shadow: 0 0 15px rgba(16,185,129,0.3); }

/* Content Layout */
.gs-content { flex: 1; padding: 32px; overflow-y: auto; }
.fade-in { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.gs-section-title { font-size: 18px; font-weight: 600; color: var(--g-text); margin-bottom: 20px; letter-spacing: -0.5px; }

/* Cards */
.gs-card-stack { display: flex; flex-direction: column; gap: 16px; }
.gs-card { background: var(--g-panel); border: 1px solid var(--g-border); border-radius: 24px; padding: 24px; transition: transform 0.2s, box-shadow 0.2s; }
.gs-card:hover { border-color: var(--g-border-hover); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
.gs-card.completed { opacity: 0.6; }

/* Missions */
.gs-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.gs-c-title { font-size: 15px; font-weight: 600; }
.gs-pill { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; }
.gs-pill.blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
.gs-pill.purple { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
.gs-c-desc { font-size: 13px; color: var(--g-text-muted); margin: 0 0 16px; line-height: 1.5; }
.gs-c-progress { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.gs-prog-bar { flex: 1; height: 6px; background: rgba(0,0,0,0.4); border-radius: 9999px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.5); }
.gs-prog-fill { height: 100%; background: var(--g-text); border-radius: 9999px; }
.gs-prog-text { font-size: 12px; color: var(--g-text-muted); font-variant-numeric: tabular-nums; font-weight: 600; }
.gs-c-actions { display: flex; justify-content: space-between; align-items: center; }
.gs-reward-text { font-size: 13px; font-weight: 600; color: #34d399; }
.gs-status-done { font-size: 13px; color: var(--g-text-muted); font-weight: 500; }
.gs-btn-pill { background: rgba(255,255,255,0.1); border: 1px solid var(--g-border); color: var(--g-text); padding: 8px 16px; border-radius: 9999px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.gs-btn-pill.accent { background: var(--g-accent); border-color: var(--g-accent-hover); color: #fff; box-shadow: 0 2px 10px rgba(16,185,129,0.3); }
.gs-btn-pill.accent:hover { background: var(--g-accent-hover); transform: translateY(-1px); }

/* Tournament */
.gs-tourney-stats { display: flex; gap: 16px; margin-bottom: 24px; }
.gs-t-stat { flex: 1; background: var(--g-panel); border: 1px solid var(--g-border); border-radius: 16px; padding: 16px; }
.gs-t-stat span { display: block; font-size: 12px; color: var(--g-text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
.gs-t-stat strong { display: block; font-size: 18px; font-weight: 700; color: var(--g-text); }
.gs-lb-table { display: flex; flex-direction: column; }
.gs-lb-header { display: flex; font-size: 11px; text-transform: uppercase; color: var(--g-text-muted); padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 8px; font-weight: 600; }
.gs-lb-row { display: flex; align-items: center; padding: 12px 0; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.03); }
.gs-lb-row:last-child { border: none; }
.gs-lb-row.top .gs-lb-rank { color: #fbbf24; font-weight: 700; text-shadow: 0 0 10px rgba(251, 191, 36, 0.5); }
.gs-lb-rank { width: 40px; color: var(--g-text-muted); font-weight: 600; }
.gs-lb-name { flex: 1; font-weight: 500; }
.gs-lb-pts { font-variant-numeric: tabular-nums; font-weight: 600; }
.right { margin-left: auto; text-align: right; }

/* Loyalty */
.loyalty-hero { padding: 32px 24px; text-align: center; margin-bottom: 24px; background: radial-gradient(circle at center, rgba(252, 211, 77, 0.1) 0%, var(--g-panel) 100%); }
.loyalty-hero-top { display: flex; flex-direction: column; align-items: center; gap: 16px; margin-bottom: 24px; }
.hero-ring { width: 80px; height: 80px; border-radius: 9999px; background: rgba(255,255,255,0.05); border: 2px solid rgba(252, 211, 77, 0.3); display: flex; align-items: center; justify-content: center; color: #fbbf24; box-shadow: 0 0 30px rgba(251, 191, 36, 0.2), inset 0 0 20px rgba(251, 191, 36, 0.1); }
.hero-label { font-size: 12px; color: var(--g-text-muted); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px; }
.hero-val { font-size: 24px; font-weight: 700; letter-spacing: 1px; }
.perks-list { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.perk-item { display: flex; align-items: center; gap: 16px; font-size: 14px; color: var(--g-text); }
.perk-icon { width: 28px; height: 28px; border-radius: 9999px; background: rgba(16, 185, 129, 0.15); color: #10b981; display: flex; align-items: center; justify-content: center; }

/* Unified Cashback */
.unified-cashback { padding: 0; overflow: hidden; }
.uc-top { padding: 40px 32px; text-align: center; background: radial-gradient(circle at top, rgba(16, 185, 129, 0.1) 0%, transparent 80%); }
.uc-label { font-size: 13px; color: var(--g-text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; display: block; margin-bottom: 12px; }
.uc-amount { font-size: 48px; font-weight: 700; margin-bottom: 32px; line-height: 1; letter-spacing: -1px; }
.uc-curr { font-size: 18px; color: var(--g-text-muted); font-weight: 500; letter-spacing: 0; }
.gs-btn-large { width: 100%; border: none; padding: 16px; border-radius: 16px; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.2s; }
.gs-btn-large.accent { background: var(--g-accent); color: #fff; box-shadow: 0 4px 15px rgba(16,185,129,0.3); }
.gs-btn-large.accent:hover:not(:disabled) { background: var(--g-accent-hover); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16,185,129,0.4); }
.gs-btn-large:disabled { opacity: 0.4; cursor: not-allowed; }
.uc-divider { height: 1px; background: linear-gradient(90deg, transparent, var(--g-border), transparent); }
.uc-bottom { padding: 32px; }
.uc-label-small { font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--g-text-muted); display: block; margin-bottom: 20px; }
.uc-history { display: flex; flex-direction: column; gap: 4px; }
.uc-h-row { display: flex; justify-content: space-between; padding: 16px; background: rgba(255,255,255,0.02); border-radius: 12px; font-size: 14px; }
.uc-h-val { color: #34d399; font-weight: 600; }
.uc-h-empty { font-size: 14px; color: var(--g-text-muted); text-align: center; padding: 24px 0; font-style: italic; }

/* Wheel */
.center-wheel { text-align: center; display: flex; flex-direction: column; align-items: center; }
.wheel-subs { margin: 0 0 40px; font-size: 14px; color: var(--g-text-muted); }
.premium-wheel-wrap { position: relative; width: 340px; height: 340px; margin: 0 auto 40px; border-radius: 50%; box-shadow: 0 0 60px rgba(251,191,36,0.3), inset 0 0 30px rgba(0,0,0,0.8); border: 12px solid #fbbf24; background: #0f172a; padding: 4px; }
.pw-pointer { position: absolute; top: -30px; left: 50%; transform: translateX(-50%); z-index: 10; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.8)); }
.pw-wheel { width: 100%; height: 100%; border-radius: 50%; position: relative; overflow: hidden; box-shadow: inset 0 0 40px rgba(0,0,0,0.9); border: 2px solid rgba(255,255,255,0.1); }
.pw-segment-text { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; pointer-events: none; }
.pw-segment-text span { display: block; transform: translateY(-110px); color: #fff; font-weight: 800; font-size: 14px; text-shadow: 0 2px 4px rgba(0,0,0,0.9); letter-spacing: 0.5px; }
.pw-center-dot { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 48px; height: 48px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, #fbbf24, #b45309); box-shadow: 0 4px 10px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.4); border: 4px solid #fff; }
.pw-result { margin-bottom: 32px; font-size: 18px; color: var(--g-text); }

/* Toasts */
.glass-toasts { position: fixed; bottom: 32px; left: 32px; display: flex; flex-direction: column; gap: 12px; z-index: 2000; }
.glass-toast { background: rgba(18, 18, 24, 0.9); backdrop-filter: blur(20px); border: 1px solid var(--g-border); border-radius: 16px; padding: 16px 20px; display: flex; flex-direction: column; gap: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); border-left: 4px solid var(--g-accent); }
.glass-toast strong { font-size: 14px; color: var(--g-text); font-weight: 600; }
.glass-toast span { font-size: 13px; color: var(--g-text-muted); }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
</style>
