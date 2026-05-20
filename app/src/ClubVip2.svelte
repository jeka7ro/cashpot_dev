<script>
  export let progress = 45; // Mock progress
  export let currentLevel = 2;

  const levels = [
    { id: 1, name: 'HUSTLER', image: '/gta-vip-1.png', points: '0 - 1,000', color: '#ff2a6d' }, 
    { id: 2, name: 'DRIVER', image: '/gta-vip-2.png', points: '1,001 - 5,000', color: '#05d9e8' },
    { id: 3, name: 'FIXER', image: '/gta-vip-3.png', points: '5,001 - 20,000', color: '#d1f7ff' },
    { id: 4, name: 'ENFORCER', image: '/gta-vip-4.png', points: '20,001 - 50,000', color: '#f15bb5' },
    { id: 5, name: 'CAPO', image: '/gta-vip-5.png', points: '50,001 - 150,000', color: '#fee440' },
    { id: 6, name: 'KINGPIN', image: '/gta-vip-6.png', points: '150,000+', color: '#9b5de5' }
  ];
</script>

<div class="vip2-container">
  <div class="vip2-header">
    <h1>VICE CLUB</h1>
    <p>URBAN LOYALTY REWARDS</p>
  </div>

  <div class="vip2-progress-section">
    <div class="progress-bar-bg">
      <div class="progress-bar-fill" style="width: {progress}%;"></div>
    </div>
    <div class="progress-labels">
      <span>Current: DRIVER</span>
      <span>Next: FIXER (55% left)</span>
    </div>
  </div>

  <div class="vip2-grid">
    {#each levels as level}
      <div class="vip2-card {currentLevel === level.id ? 'active' : ''}" style="--theme-color: {level.color};">
        <div class="card-bg" style="background-image: url('{level.image}');"></div>
        <div class="card-overlay"></div>
        
        <div class="card-content">
          <div class="level-badge">LVL {level.id}</div>
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
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Outfit:wght@300;500;800&display=swap');

  .vip2-container {
    padding: 32px;
    background: #09090b; /* Very dark background to make neon pop */
    min-height: 100vh;
    font-family: 'Outfit', sans-serif;
    color: #fff;
  }

  .vip2-header {
    text-align: center;
    margin-bottom: 40px;
  }

  .vip2-header h1 {
    font-family: 'Anton', sans-serif;
    font-size: 5rem;
    margin: 0;
    letter-spacing: 4px;
    background: linear-gradient(to right, #ff2a6d, #05d9e8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 10px rgba(255, 42, 109, 0.4));
    text-transform: uppercase;
  }

  .vip2-header p {
    font-size: 1.2rem;
    color: #a1a1aa;
    letter-spacing: 8px;
    margin-top: -10px;
  }

  .vip2-progress-section {
    max-width: 800px;
    margin: 0 auto 60px;
    background: rgba(255, 255, 255, 0.03);
    padding: 24px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .progress-bar-bg {
    height: 12px;
    background: #18181b;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
  }

  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #05d9e8, #ff2a6d);
    border-radius: 6px;
    box-shadow: 0 0 15px #ff2a6d;
  }

  .progress-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
    font-weight: 500;
    color: #e4e4e7;
    text-transform: uppercase;
    font-size: 0.9rem;
  }

  .vip2-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .vip2-card {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    height: 450px;
    border: 2px solid transparent;
    transition: all 0.3s ease;
    background: #111;
  }

  .vip2-card:hover {
    transform: translateY(-10px);
    border-color: var(--theme-color);
    box-shadow: 0 15px 30px rgba(0,0,0,0.8), 0 0 20px var(--theme-color);
  }

  .vip2-card.active {
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
    transition: transform 0.5s ease;
  }

  .vip2-card:hover .card-bg {
    transform: scale(1.05);
  }

  .card-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 70%, rgba(0,0,0,0.95) 100%);
  }

  .card-content {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 30px 24px;
    z-index: 2;
  }

  .level-badge {
    display: inline-block;
    padding: 4px 12px;
    background: var(--theme-color);
    color: #000;
    font-weight: 800;
    font-size: 0.8rem;
    border-radius: 4px;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 0 0 10px var(--theme-color);
  }

  .card-content h2 {
    font-family: 'Anton', sans-serif;
    font-size: 2.5rem;
    margin: 0 0 4px;
    letter-spacing: 2px;
    text-shadow: 2px 2px 0px #000;
  }

  .points-req {
    color: #a1a1aa;
    font-weight: 500;
    margin-bottom: 16px;
    font-size: 0.95rem;
  }

  .rewards-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .rewards-list li {
    font-size: 0.9rem;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    color: #e4e4e7;
  }

  .rewards-list li::before {
    content: '★';
    color: var(--theme-color);
    margin-right: 8px;
    font-size: 1rem;
    text-shadow: 0 0 5px var(--theme-color);
  }
</style>
