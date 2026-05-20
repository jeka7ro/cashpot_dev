<script>
  export let progress = 45; // Mock progress
  export let currentLevel = 2;

  const levels = [
    { id: 1, name: 'BIG BASS', provider: 'Pragmatic Play', image: '/vip3-fisher.png', points: '0 - 1,000', color: '#0ea5e9' }, // Light Blue
    { id: 2, name: 'SWEET BOSS', provider: 'Pragmatic Play', image: '/vip3-candy.png', points: '1,001 - 5,000', color: '#ec4899' }, // Pink
    { id: 3, name: 'EXPLORER', provider: 'Pragmatic/Greentube', image: '/vip3-explorer.png', points: '5,001 - 20,000', color: '#eab308' }, // Gold
    { id: 4, name: 'VAMPIRE LORD', provider: 'EGT/Amusnet', image: '/vip3-vampire.png', points: '20,001 - 50,000', color: '#dc2626' }, // Blood Red
    { id: 5, name: 'CROWN MASTER', provider: 'EGT/Amusnet', image: '/vip3-crown.png', points: '50,001 - 150,000', color: '#22c55e' }, // Burning Green
    { id: 6, name: 'THUNDER GOD', provider: 'Pragmatic Play', image: '/vip3-zeus.png', points: '150,000+', color: '#8b5cf6' } // Lightning Purple
  ];
</script>

<div class="vip3-container">
  <div class="vip3-header">
    <h1>SLOT LEGENDS</h1>
    <p>THE ULTIMATE CASINO HALL OF FAME</p>
  </div>

  <div class="vip3-progress-section">
    <div class="progress-bar-bg">
      <div class="progress-bar-fill" style="width: {progress}%;"></div>
    </div>
    <div class="progress-labels">
      <span>Current: SWEET BOSS</span>
      <span>Next: EXPLORER (55% left)</span>
    </div>
  </div>

  <div class="vip3-grid">
    {#each levels as level}
      <div class="vip3-card {currentLevel === level.id ? 'active' : ''}" style="--theme-color: {level.color};">
        <div class="card-bg" style="background-image: url('{level.image}');"></div>
        <div class="card-overlay"></div>
        
        <div class="card-content">
          <div class="level-header">
            <div class="level-badge">LVL {level.id}</div>
            <div class="provider-badge">{level.provider}</div>
          </div>
          <h2>{level.name}</h2>
          <div class="points-req">{level.points} VP</div>
          
          <ul class="rewards-list">
            <li>Cashback Bonus</li>
            <li>Faster Withdrawals</li>
            {#if level.id >= 3}<li>Dedicated Manager</li>{/if}
            {#if level.id >= 5}<li>Luxury Invites</li>{/if}
          </ul>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Inter:wght@400;600;800&display=swap');

  /* Container adapts to global theme using standard vars */
  .vip3-container {
    padding: 32px;
    background: var(--bg-main, #0f172a); 
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    color: var(--text-main, #f8fafc);
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  .vip3-header {
    text-align: center;
    margin-bottom: 40px;
  }

  .vip3-header h1 {
    font-family: 'Cinzel', serif;
    font-size: 4rem;
    font-weight: 900;
    margin: 0;
    letter-spacing: 2px;
    background: linear-gradient(to right, #fbbf24, #f59e0b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
    text-transform: uppercase;
  }

  /* Adjust shadow for light theme globally */
  :global(.light-theme) .vip3-header h1 {
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  }

  .vip3-header p {
    font-size: 1.1rem;
    color: var(--text-muted, #94a3b8);
    letter-spacing: 6px;
    margin-top: 0;
    font-weight: 600;
  }

  .vip3-progress-section {
    max-width: 800px;
    margin: 0 auto 60px;
    background: var(--bg-card, rgba(255, 255, 255, 0.05));
    padding: 24px;
    border-radius: 16px;
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  }

  .progress-bar-bg {
    height: 14px;
    background: var(--bg-dark, #1e293b);
    border-radius: 7px;
    overflow: hidden;
    position: relative;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
  }

  :global(.light-theme) .progress-bar-bg {
    background: #e2e8f0;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
  }

  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
    border-radius: 7px;
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
  }

  .progress-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
    font-weight: 600;
    color: var(--text-main, #f1f5f9);
    text-transform: uppercase;
    font-size: 0.9rem;
  }

  .vip3-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 30px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .vip3-card {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    height: 480px;
    border: 2px solid transparent;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    background: #000;
    box-shadow: 0 15px 35px rgba(0,0,0,0.2);
  }

  .vip3-card:hover {
    transform: translateY(-12px) scale(1.02);
    border-color: var(--theme-color);
    box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 20px var(--theme-color);
  }

  .vip3-card.active {
    border-color: var(--theme-color);
    box-shadow: 0 0 15px var(--theme-color);
  }

  .card-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    transition: transform 0.6s ease;
  }

  .vip3-card:hover .card-bg {
    transform: scale(1.08);
  }

  .card-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* Dark gradient so text is always readable, regardless of light/dark global theme */
    background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.95) 100%);
  }

  .card-content {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 30px 24px;
    z-index: 2;
    color: #fff; /* Always white text on card due to dark overlay */
  }

  .level-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .level-badge {
    padding: 6px 14px;
    background: var(--theme-color);
    color: #fff;
    font-weight: 800;
    font-size: 0.85rem;
    border-radius: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 0 0 15px var(--theme-color);
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }

  .provider-badge {
    font-size: 0.75rem;
    font-weight: 600;
    background: rgba(0,0,0,0.6);
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid rgba(255,255,255,0.2);
    text-transform: uppercase;
  }

  .card-content h2 {
    font-family: 'Cinzel', serif;
    font-size: 2.2rem;
    font-weight: 900;
    margin: 0 0 4px;
    letter-spacing: 1px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
  }

  .points-req {
    color: #cbd5e1;
    font-weight: 600;
    margin-bottom: 20px;
    font-size: 1rem;
  }

  .rewards-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .rewards-list li {
    font-size: 0.95rem;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    color: #f1f5f9;
    font-weight: 500;
  }

  .rewards-list li::before {
    content: '✦';
    color: var(--theme-color);
    margin-right: 10px;
    font-size: 1.1rem;
    filter: drop-shadow(0 0 4px var(--theme-color));
  }
</style>
