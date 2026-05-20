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
          <div style="height: 20px; color: {methods[selectedIndex].textColor};">
            <svg height="100%" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
          </div>
        {:else if methods[selectedIndex].type === 'googlepay'}
          <div style="height: 18px; color: {methods[selectedIndex].textColor};">
            <svg height="100%" viewBox="0 0 488 512" fill="currentColor"><path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/></svg>
          </div>
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
            <div style="height: 16px; color: {pm.textColor}; display: flex; align-items: center; justify-content: center;">
              <svg height="100%" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
            </div>
          {:else if pm.type === 'googlepay'}
            <div style="height: 14px; color: {pm.textColor}; display: flex; align-items: center; justify-content: center;">
              <svg height="100%" viewBox="0 0 488 512" fill="currentColor"><path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/></svg>
            </div>
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
