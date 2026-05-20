<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let userBalance = 0;

  let showModal = true;
  let customAmount = "";
  
  // Real methods based on Cashpot production
  let paymentMethods = [
    { id: 'paycom', name: 'Plata cu Cardul', provider: 'Pay.com', type: 'card', bg: 'linear-gradient(135deg, #1f1f1f, #0a0a0a)', textColor: '#fff', logos: ['mastercard', 'visa', 'revolut', 'gpay', 'applepay'] },
    { id: 'nuvei', name: 'Plata cu Cardul', provider: 'Nuvei Secured', type: 'card', bg: 'linear-gradient(135deg, #0f172a, #1e3a8a)', textColor: '#fff', logos: ['mastercard', 'visa'] },
    { id: 'paysafecard', name: 'PaySafeCard', provider: '', type: 'paysafecard', bg: 'linear-gradient(135deg, #005a9c, #0087e0)', textColor: '#fff', logos: ['paysafecard'] },
    { id: 'aircash', name: 'Aircash', provider: '', type: 'aircash', bg: 'linear-gradient(135deg, #e3000f, #ff1a2b)', textColor: '#fff', logos: ['aircash'] },
    { id: 'abon', name: 'Abon', provider: '', type: 'abon', bg: 'linear-gradient(135deg, #2c3e50, #34495e)', textColor: '#fff', logos: ['abon'] }
  ];
  let selectedMethodIndex = 0;

  let predefinedAmounts = [50, 100, 500, 1000, 2500, 5000];
  let selectedAmount = 100;

  let bonuses = [
    { id: 'b1', title: '77', subtitle: 'Rotiri la Burning Hot', tag: 'CEA MAI BUNĂ OFERTĂ', minDeposit: 75, bg: 'linear-gradient(180deg, rgba(30,30,30,1) 0%, rgba(15,15,15,1) 100%)', borderColor: '#f5c842' },
    { id: 'b2', title: '50', subtitle: 'Rotiri la Shining Crown', tag: '', minDeposit: 50, bg: 'linear-gradient(180deg, rgba(30,30,30,1) 0%, rgba(15,15,15,1) 100%)', borderColor: 'transparent' },
    { id: 'b3', title: 'Fără bonus', subtitle: '', tag: '', minDeposit: 0, bg: 'linear-gradient(180deg, rgba(30,30,30,1) 0%, rgba(15,15,15,1) 100%)', borderColor: 'transparent' }
  ];
  let selectedBonusId = 'b1';

  function closeModal() {
    dispatch('close');
  }

  function handleDeposit() {
    const amountToDeposit = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (amountToDeposit > 0) {
      dispatch('deposit', amountToDeposit);
      closeModal();
    }
  }

  function nextMethod() {
    selectedMethodIndex = (selectedMethodIndex + 1) % paymentMethods.length;
  }
</script>

<div class="modal-overlay" on:click={closeModal}>
  <div class="modal-content" on:click|stopPropagation>
    <button class="close-btn" on:click={closeModal}>✕</button>

    <div class="modal-header">
      <h2>Fă o depunere</h2>
      <p>Fiecare depunere poate fi răsplătită!<br/>Alege-ți mai jos bonusul:</p>
    </div>

    <!-- Payment Method Selector (Card + Miniatures) -->
    <div class="section-label">ALEGE METODA:</div>
    <div class="payment-selector-container">
      <!-- Main Active Card -->
      <div class="active-card" style="background: {paymentMethods[selectedMethodIndex].bg}; color: {paymentMethods[selectedMethodIndex].textColor};">
        <div class="active-card-top">
          <div class="active-card-name">{paymentMethods[selectedMethodIndex].name}</div>
          {#if paymentMethods[selectedMethodIndex].provider}
            <div class="active-card-provider">{paymentMethods[selectedMethodIndex].provider}</div>
          {/if}
        </div>
        
        <div class="active-card-middle">
          {#if paymentMethods[selectedMethodIndex].type === 'card'}
            <div class="card-chip"></div>
            <div class="card-nfc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M5.5 19.5A11 11 0 0 1 5.5 4.5" stroke-opacity="0.2"/><path d="M9 16.5A7 7 0 0 1 9 7.5" stroke-opacity="0.5"/><path d="M12.5 13.5a3 3 0 0 1 0-3" stroke-opacity="0.8"/></svg></div>
          {/if}
        </div>

        <div class="active-card-bottom">
          <div class="active-card-number">
            {#if paymentMethods[selectedMethodIndex].type === 'card'}
              **** **** **** 8421
            {:else if paymentMethods[selectedMethodIndex].type === 'paysafecard'}
              PIN: **** **** **** ****
            {:else}
              ID: eugen.cazmal
            {/if}
          </div>
          <div class="active-card-logos">
            {#each paymentMethods[selectedMethodIndex].logos as logo}
              <div class="mock-logo {logo}"></div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Miniatures on the right -->
      <div class="miniatures-sidebar">
        {#each paymentMethods as pm, idx}
          {#if idx !== selectedMethodIndex}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div 
              class="miniature-card" 
              style="background: {pm.bg};" 
              on:click={() => selectedMethodIndex = idx}
              title={pm.name}
            >
              {#if pm.logos.length > 0}
                <div class="mock-logo {pm.logos[0]}"></div>
              {:else}
                <div class="miniature-text">{pm.name.substring(0,3).toUpperCase()}</div>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    </div>

    <!-- Amount Selection -->
    <div class="amount-input-container">
      <input type="number" placeholder="SUMĂ RON" bind:value={customAmount} class="amount-input" on:focus={() => selectedAmount = null} />
    </div>
    
    <div class="amount-grid">
      {#each predefinedAmounts as amount}
        <button 
          class="amount-btn {selectedAmount === amount && !customAmount ? 'active' : ''}" 
          on:click={() => { selectedAmount = amount; customAmount = ""; }}
        >
          {amount}
        </button>
      {/each}
    </div>

    <!-- Bonus Selection -->
    <div class="section-title">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5c842" stroke-width="2"><rect x="3" y="8" width="18" height="14" rx="2" /><path d="M12 5a3 3 0 1 0-3 3" /><path d="M12 5a3 3 0 1 1 3 3" /><path d="M12 8v14" /></svg>
      Alege-ți Bonusul
    </div>
    
    <div class="bonus-grid">
      {#each bonuses as bonus}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div 
          class="bonus-card {selectedBonusId === bonus.id ? 'active' : ''}"
          on:click={() => selectedBonusId = bonus.id}
          style="border-color: {selectedBonusId === bonus.id ? '#10b981' : 'rgba(255,255,255,0.1)'};"
        >
          {#if bonus.tag}<div class="bonus-tag">{bonus.tag}</div>{/if}
          <div class="bonus-content">
            {#if bonus.title !== 'Fără bonus'}
              <div class="bonus-title">{bonus.title}</div>
              <div class="bonus-subtitle">{bonus.subtitle}</div>
            {:else}
              <div class="bonus-title" style="font-size: 16px; margin: auto;">{bonus.title}</div>
            {/if}
          </div>
          {#if bonus.minDeposit > 0}
            <div class="bonus-footer">
              Depunere de minimum<br/><strong>{bonus.minDeposit} RON</strong>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <button class="deposit-submit-btn" on:click={handleDeposit}>
      DEPUNE
    </button>
    
    <div class="tax-notice">
      ⚠️ TAXA DE 0 RON ESTE INCLUSĂ ÎN DEPUNEREA TA.
    </div>

    <div class="deposit-summary">
      <div>PLĂTEȘTI <strong>{customAmount || selectedAmount || 0} RON</strong></div>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      <div>PRIMEȘTI <strong>{customAmount || selectedAmount || 0} RON</strong></div>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    backdrop-filter: blur(10px);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .modal-content {
    width: 100%;
    max-width: 500px;
    background: #111;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    padding: 32px;
    position: relative;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    max-height: 90vh;
    overflow-y: auto;
  }
  .close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 20px;
    cursor: pointer;
    transition: color 0.2s;
  }
  .close-btn:hover { color: #fff; }
  
  .modal-header {
    text-align: center;
    margin-bottom: 30px;
  }
  .modal-header h2 {
    font-size: 28px;
    font-weight: 800;
    margin: 0 0 8px 0;
  }
  .modal-header p {
    color: var(--text-muted);
    font-size: 14px;
    margin: 0;
    line-height: 1.4;
  }

  /* Modern Card + Miniatures UI */
  .section-label {
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    font-weight: 800;
    margin-bottom: 8px;
    letter-spacing: 0.5px;
  }
  .payment-selector-container {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    height: 180px;
  }
  
  /* Main Card */
  .active-card {
    flex: 1;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.15);
    transition: all 0.3s ease;
  }
  .active-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .active-card-name {
    font-size: 20px;
    font-weight: 900;
    line-height: 1.1;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  .active-card-provider {
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(4px);
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
  }
  .active-card-middle {
    display: flex;
    align-items: center;
    gap: 10px;
    opacity: 0.8;
  }
  .card-chip {
    width: 38px;
    height: 28px;
    background: linear-gradient(135deg, #d4af37, #aa8000);
    border-radius: 6px;
    position: relative;
    overflow: hidden;
  }
  .card-chip::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(90deg, rgba(0,0,0,0.2) 1px, transparent 1px),
      linear-gradient(0deg, rgba(0,0,0,0.2) 1px, transparent 1px);
    background-size: 12px 10px;
  }
  .card-nfc {
    color: inherit;
  }
  .active-card-bottom {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .active-card-number {
    font-size: 15px;
    font-family: monospace;
    opacity: 0.9;
    letter-spacing: 2px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  .active-card-logos {
    display: flex;
    gap: 6px;
  }

  /* Miniatures Sidebar */
  .miniatures-sidebar {
    width: 70px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    padding-right: 4px;
  }
  .miniatures-sidebar::-webkit-scrollbar {
    width: 4px;
  }
  .miniatures-sidebar::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.2);
    border-radius: 4px;
  }
  .miniature-card {
    width: 100%;
    aspect-ratio: 1.58;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.1);
    opacity: 0.5;
    transition: all 0.2s ease;
  }
  .miniature-card:hover {
    opacity: 0.8;
    transform: scale(1.05);
  }
  .miniature-text {
    font-size: 11px;
    font-weight: 900;
    color: #fff;
  }

  .amount-input-container {
    margin-bottom: 16px;
  }
  .amount-input {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 16px;
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    outline: none;
    transition: border-color 0.2s;
  }
  .amount-input:focus {
    border-color: #f5c842;
  }
  .amount-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 30px;
  }
  .amount-btn {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 20px;
    padding: 12px;
    color: var(--text-main);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  .amount-btn:hover {
    background: rgba(255,255,255,0.05);
  }
  .amount-btn.active {
    border-color: #f5c842;
    color: #f5c842;
    background: rgba(252,211,77,0.1);
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 800;
    margin-bottom: 16px;
  }

  .bonus-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 30px;
  }
  .bonus-card {
    background: #1a1a1a;
    border: 2px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    position: relative;
    cursor: pointer;
    transition: all 0.2s;
    height: 140px;
  }
  .bonus-card.active {
    background: rgba(16, 185, 129, 0.05);
  }
  .bonus-tag {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: #f5c842;
    color: #000;
    font-size: 9px;
    font-weight: 900;
    padding: 2px 8px;
    border-radius: 10px;
    white-space: nowrap;
  }
  .bonus-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 16px 8px;
  }
  .bonus-title {
    font-size: 24px;
    font-weight: 900;
    line-height: 1;
    margin-bottom: 4px;
  }
  .bonus-subtitle {
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.2;
  }
  .bonus-footer {
    border-top: 1px solid rgba(255,255,255,0.1);
    padding: 8px;
    text-align: center;
    font-size: 9px;
    color: var(--text-muted);
  }
  .bonus-footer strong {
    color: #fff;
    font-size: 11px;
  }

  .deposit-submit-btn {
    width: 100%;
    background: #008000;
    color: #fff;
    border: none;
    padding: 16px;
    border-radius: 12px;
    font-size: 18px;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 128, 0, 0.3);
    margin-bottom: 16px;
    transition: transform 0.2s, background 0.2s;
  }
  .deposit-submit-btn:hover {
    background: #009900;
    transform: scale(1.02);
  }

  .tax-notice {
    text-align: center;
    font-size: 11px;
    color: #f5c842;
    margin-bottom: 20px;
    font-weight: 600;
  }

  .deposit-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255,255,255,0.1);
    padding-top: 16px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .deposit-summary strong {
    color: #fff;
    font-size: 14px;
  }
</style>
