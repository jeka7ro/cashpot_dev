<script>
  export let methods = [
    { id: 'c1', type: 'mastercard', name: 'Mastercard Premium', number: '**** **** **** 8421', bg: 'linear-gradient(135deg, #111, #222)', textColor: '#fff' },
    { id: 'c2', type: 'visa', name: 'Visa Platinum', number: '**** **** **** 1234', bg: 'linear-gradient(135deg, #0f172a, #1e3a8a)', textColor: '#fff' },
    { id: 'c3', type: 'applepay', name: 'Apple Pay', number: 'eugen.cazmal@apple.com', bg: 'linear-gradient(135deg, #000, #111)', textColor: '#fff' },
    { id: 'c4', type: 'googlepay', name: 'Google Pay', number: 'eugen.cazmal@gmail.com', bg: 'linear-gradient(135deg, #fff, #f0f0f0)', textColor: '#000' }
  ];
  export let selectedIndex = 0;

  function nextMethod() {
    if (methods.length <= 1) return;
    selectedIndex = (selectedIndex + 1) % methods.length;
  }
</script>

<div class="payment-widget">
  <!-- Active Card -->
  <div class="active-card" style="background: {methods[selectedIndex].bg}; color: {methods[selectedIndex].textColor};" on:click={nextMethod}>
    <div class="card-top">
      <span class="card-name">{methods[selectedIndex].name}</span>
      <span class="card-change-btn">SCHIMBĂ</span>
    </div>
    
    <div class="card-bottom">
      <span class="card-number">{methods[selectedIndex].number}</span>
      <div class="card-logo">
        {#if methods[selectedIndex].type === 'mastercard'}
          <div class="mc-red"></div>
          <div class="mc-yellow"></div>
        {:else if methods[selectedIndex].type === 'visa'}
          <div class="visa-logo">VISA</div>
        {:else if methods[selectedIndex].type === 'applepay'}
          <svg width="24" height="24" viewBox="0 0 24 24" fill={methods[selectedIndex].textColor}><path d="M17.05 20.28c-.98.19-2.05.8-3.04.8-1.04 0-2.02-.59-3.02-.79-1.29-.26-2.61.12-3.48 1.09-.85.95-1.57 2.15-1.92 3.44C5.07 26.68 5.72 28.53 6.96 30c1.07 1.25 2.5 1.94 4.09 1.94 1.13 0 2.22-.39 3.19-.39.95 0 2.01.4 3.15.4 1.83 0 3.44-.94 4.41-2.48a6.38 6.38 0 0 0-2.92-5.41c1.33-1.89 3.03-2.98 4.96-3.05-.18-1.54-1.2-2.88-2.6-3.52-1.3-.6-2.81-.66-4.19-.21zm-1.87-8.1c.97-1.15 1.54-2.67 1.34-4.18-1.34.07-2.9.84-3.87 1.98-.85.98-1.5 2.45-1.26 3.93 1.48.16 2.87-.62 3.79-1.73z" transform="scale(0.8) translate(2, 2)"/></svg>
        {:else if methods[selectedIndex].type === 'googlepay'}
          <svg width="24" height="24" viewBox="0 0 24 24" fill={methods[selectedIndex].textColor}><path d="M11.9 12.4v-2.9h8.4c.1.5.1 1.1.1 1.7 0 2-.6 3.9-1.6 5.4-1.5 1.6-3.6 2.6-6.1 2.6-4.6 0-8.4-3.8-8.4-8.4s3.8-8.4 8.4-8.4c2.3 0 4.3.8 5.9 2.3l-2.2 2.2c-.9-.8-2.2-1.3-3.6-1.3-2.8 0-5.2 1.9-6.1 4.5-.2.7-.3 1.5-.3 2.3s.1 1.5.3 2.3c.9 2.6 3.3 4.5 6.1 4.5 1.6 0 3.2-.5 4.3-1.4 1.4-1 2.3-2.7 2.5-4.6h-7.7z" /></svg>
        {/if}
      </div>
    </div>
  </div>

  <!-- Miniatures -->
  <div class="miniatures">
    {#each methods as pm, idx}
      {#if idx !== selectedIndex}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="miniature" style="background: {pm.bg};" on:click={() => selectedIndex = idx}>
          {#if pm.type === 'mastercard'}
            <div class="mc-red" style="width:14px; height:14px; left:6px;"></div>
            <div class="mc-yellow" style="width:14px; height:14px; right:6px;"></div>
          {:else if pm.type === 'visa'}
            <span style="font-size:11px; font-weight:900; font-style:italic; color:#1a1f71; background:#fff; padding:2px 4px; border-radius:2px;">VISA</span>
          {:else if pm.type === 'applepay'}
            <svg width="18" height="18" viewBox="0 0 24 24" fill={pm.textColor}><path d="M17.05 20.28c-.98.19-2.05.8-3.04.8-1.04 0-2.02-.59-3.02-.79-1.29-.26-2.61.12-3.48 1.09-.85.95-1.57 2.15-1.92 3.44C5.07 26.68 5.72 28.53 6.96 30c1.07 1.25 2.5 1.94 4.09 1.94 1.13 0 2.22-.39 3.19-.39.95 0 2.01.4 3.15.4 1.83 0 3.44-.94 4.41-2.48a6.38 6.38 0 0 0-2.92-5.41c1.33-1.89 3.03-2.98 4.96-3.05-.18-1.54-1.2-2.88-2.6-3.52-1.3-.6-2.81-.66-4.19-.21zm-1.87-8.1c.97-1.15 1.54-2.67 1.34-4.18-1.34.07-2.9.84-3.87 1.98-.85.98-1.5 2.45-1.26 3.93 1.48.16 2.87-.62 3.79-1.73z" transform="scale(0.8) translate(1, 1)"/></svg>
          {:else if pm.type === 'googlepay'}
            <svg width="18" height="18" viewBox="0 0 24 24" fill={pm.textColor}><path d="M11.9 12.4v-2.9h8.4c.1.5.1 1.1.1 1.7 0 2-.6 3.9-1.6 5.4-1.5 1.6-3.6 2.6-6.1 2.6-4.6 0-8.4-3.8-8.4-8.4s3.8-8.4 8.4-8.4c2.3 0 4.3.8 5.9 2.3l-2.2 2.2c-.9-.8-2.2-1.3-3.6-1.3-2.8 0-5.2 1.9-6.1 4.5-.2.7-.3 1.5-.3 2.3s.1 1.5.3 2.3c.9 2.6 3.3 4.5 6.1 4.5 1.6 0 3.2-.5 4.3-1.4 1.4-1 2.3-2.7 2.5-4.6h-7.7z" /></svg>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .payment-widget {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    height: 110px;
  }

  /* Main Card */
  .active-card {
    flex: 1;
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 6px 20px rgba(0,0,0,0.6);
    border: 1px solid rgba(255,255,255,0.1);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .active-card:hover {
    transform: translateY(-2px);
  }
  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .card-name {
    font-size: 16px;
    font-weight: 900;
    line-height: 1.2;
    letter-spacing: -0.5px;
  }
  .card-change-btn {
    font-size: 10px;
    font-weight: 800;
    background: rgba(255,255,255,0.15);
    padding: 6px 10px;
    border-radius: 20px;
    letter-spacing: 0.5px;
    backdrop-filter: blur(4px);
    transition: background 0.2s;
  }
  .card-change-btn:hover {
    background: rgba(255,255,255,0.25);
  }
  .card-bottom {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .card-number {
    font-size: 16px;
    font-family: monospace;
    opacity: 0.85;
    letter-spacing: 1.5px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  .card-logo {
    display: flex;
    align-items: center;
    position: relative;
    width: 38px;
    height: 24px;
  }

  /* Miniature Sidebar */
  .miniatures {
    width: 54px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    padding-right: 4px;
  }
  .miniatures::-webkit-scrollbar {
    width: 3px;
  }
  .miniatures::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.2);
    border-radius: 3px;
  }
  .miniature {
    width: 100%;
    aspect-ratio: 1.58;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.1);
    opacity: 0.6;
    transition: all 0.2s ease;
    position: relative;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .miniature:hover {
    opacity: 1;
    transform: scale(1.05);
  }

  /* Logos */
  .mc-red {
    border-radius: 50%; background: #eb001b; position: absolute; opacity: 0.9;
    width: 20px; height: 20px; left: 0;
  }
  .mc-yellow {
    border-radius: 50%; background: #f79e1b; position: absolute; mix-blend-mode: screen; opacity: 0.9;
    width: 20px; height: 20px; right: 0;
  }
  .visa-logo {
    font-weight: 900; font-style: italic; font-size: 18px; color: #1a1f71; background: #fff; padding: 2px 6px; border-radius: 4px; line-height: 1;
  }
</style>
