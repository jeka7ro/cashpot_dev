<script>
  import { createEventDispatcher } from 'svelte';
  export let config = {};      // toolbarConfig from CMS
  export let themeColors = {}; // themeColors from CMS
  export let jackpots = [];    // animatedJackpots from App
  export let activeView = 'home';
  export let lastPlayedGame = null;
  export let isVisualEditor = false;
  export let isLoggedIn = false;
  export let userBalance = 0;
  export let loggedInUsername = '';
  export let userLevel = 1;
  export let widgetsSource = {};

  const dispatch = createEventDispatcher();

  let isDragging = false;
  let mouseX = 0;
  let mouseY = 0;
  let snapPreview = '';
  let isCollapsed = false; // New state for hiding the bar

  $: isInline = config?.displayMode === 'inline';
  $: isBottomBar = config?.displayMode === 'bottom_bar';

  let dragStartX, dragStartY;
  let dragThreshold = 5;

  function handleMouseDown(e) {
    if (!isVisualEditor || isInline) return;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    isDragging = false; 

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(e) {
    const dx = Math.abs(e.clientX - dragStartX);
    const dy = Math.abs(e.clientY - dragStartY);
    
    if (dx > dragThreshold || dy > dragThreshold) {
      isDragging = true;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const distTop = e.clientY;
      const distBottom = h - e.clientY;
      const distLeft = e.clientX;
      const distRight = w - e.clientX;
      const minDist = Math.min(distTop, distBottom, distLeft, distRight);
      
      if (minDist === distTop) snapPreview = 'top';
      else if (minDist === distBottom) snapPreview = 'bottom';
      else if (minDist === distLeft) snapPreview = 'left';
      else if (minDist === distRight) snapPreview = 'right';
    }
  }

  function handleMouseUp() {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    if (isDragging) {
      if (snapPreview !== config.position) {
        dispatch('updatePosition', { position: snapPreview });
      }
      // Delay resetting isDragging to avoid firing click events
      setTimeout(() => { { isDragging = false; } }, 50);
    }
  }

  function handleItem(item) {
    if (isDragging) return;
    
    // Priority: Always handle Home/Acasă correctly
    if (item.target === 'home' || (item.label && item.label.toLowerCase() === 'acasă') || item.id === 'tb_home' || item.id === 'sn_home') {
      dispatch('navigate', { view: 'home', query: '' });
      dispatch('scrollToTop');
      if (isCollapsed) isCollapsed = false;
      return;
    }

    if (isCollapsed) {
      isCollapsed = false;
      return;
    }

    if (!item.enabled) return;

    if (item.type === 'nav') {
      dispatch('navigate', { view: item.target, query: '' });
    } else if (item.type === 'jackpot') {
      dispatch('navigate', { view: 'home', query: 'jackpot' });
    } else if (item.type === 'wheel') {
      dispatch('wheel');
    } else if (item.type === 'category') {
      dispatch('navigate', { view: 'home', query: item.target });
    } else if (item.type === 'game') {
      dispatch('play', { game: item.gameData });
    } else if (item.type === 'lastPlayed' && lastPlayedGame) {
      dispatch('navigate', { view: 'home', query: lastPlayedGame.n });
    } else if (item.type === 'wallet') {
      dispatch('navigate', { view: 'account' });
    } else if (item.type === 'deposit') {
      dispatch('deposit');
    } else if (item.type === 'random') {
      dispatch('random');
    }
  }

  function formatJP(num) {
    if (!num) return '0';
    return num.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  $: topJackpot = jackpots?.flatMap(j => j.levels || []).sort((a,b) => b.value - a.value)[0];

  function getSpecificJackpot(item) {
    if (!item.jackpotId || !item.levelName) return null;
    const jp = jackpots?.find(j => String(j.id) === String(item.jackpotId));
    if (!jp) return null;
    const level = jp.levels?.find(l => String(l.name) === String(item.levelName));
    return { level, logoUrl: jp.logoUrl };
  }

  $: enabled = config?.enabled !== false;
  $: items = (config?.items || []).filter(i => i.enabled !== false).filter(i => isLoggedIn || i.type !== 'wallet');
  $: shape = config?.shape || 'round';
  $: position = config?.position || 'top';
  $: size = config?.size || 'S';
  $: showWidgetBg = config?.showWidgetBg !== false;
  $: isHeader = position === 'header';
  $: isVertical = !isInline && !isHeader && ((isDragging ? snapPreview : position) === 'left' || (isDragging ? snapPreview : position) === 'right');

   // For dragging style
  $: dragStyle = isDragging ? `position: fixed; left: ${mouseX}px; top: ${mouseY}px; transform: translate(-50%, -50%); z-index: 9999; pointer-events: none;` : '';

  function toggleCollapse() {
    isCollapsed = !isCollapsed;
  }
</script>

<svelte:window on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} />

{#if enabled && items.length > 0}
  <!-- Snap Preview Ghost -->
  {#if isDragging}
    <div class="snap-ghost pos-{snapPreview} shape-{shape} {snapPreview === 'left' || snapPreview === 'right' ? 'vertical' : 'horizontal'}"></div>
  {/if}

  <nav
    class="toolbar-widget {isInline ? 'inline' : (isBottomBar ? 'bottom_bar' : (isHeader ? 'pos-header' : `pos-${position}`))} shape-{shape} size-{size} {isVertical ? 'vertical' : 'horizontal'} {isVisualEditor ? 'visual-mode' : ''} {isDragging ? 'dragging' : ''} {!showWidgetBg ? 'no-bg' : ''} {isCollapsed ? 'collapsed' : ''}"
    role="navigation"
    aria-label="Quick toolbar"
    style="{dragStyle} border-color: {config.borderColor || 'rgba(255,255,255,0.08)'}; --tw-size-multiplier: {size === 'S' ? 0.4 : size === 'M' ? 0.7 : size === 'L' ? 1.0 : 1.3};"
  >
    <!-- Drag handle removed -->
    {#if isLoggedIn && widgetsSource?.walletWidget?.showInToolbar && !isCollapsed}
       <div
         class="tb-item {shape} tb-wallet"
         on:click|stopPropagation={() => dispatch('navigate', { view: 'account' })}
         role="button"
         tabindex="0"
         title="Portofel"
       >
         <div class="tb-icon-container" style="height: calc(80px * var(--tw-size-multiplier)); width: calc(80px * var(--tw-size-multiplier)); background: linear-gradient(135deg, #6d28d9, #8b5cf6); border: none;">
             <img src="/koi_vip.png" alt="Koi" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />
         </div>
         <div class="tb-label-container">
            {#if widgetsSource.walletWidget.showBalance}
               <span class="tb-label" style="color: var(--accent-gold); font-weight: 900; font-family: 'Inter', monospace;">{userBalance.toLocaleString("ro-RO", { minimumFractionDigits: 0 })} <small style="font-size: 0.7em;">RON</small></span>
            {:else if widgetsSource.walletWidget.showName}
               <span class="tb-label">{loggedInUsername}</span>
            {/if}
         </div>
       </div>
    {/if}

     {#each items as item}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      {#if !isCollapsed || ((item.target === 'home' || item.id === 'sn_home' || item.id === 'tb_home') && item.type === 'nav')}
        <div
          class="tb-item {shape} {item.type === 'jackpot' ? 'tb-jackpot' : ''} {activeView === item.target ? 'tb-active' : ''}"
          on:click|stopPropagation={() => handleItem(item)}
          on:keydown={(e) => e.key === 'Enter' && handleItem(item)}
          role="button"
          tabindex="0"
          title={item.label}
        >
          <div class="tb-icon-container" style="height: calc(80px * var(--tw-size-multiplier)); width: calc(80px * var(--tw-size-multiplier)); border-color: {item.borderColor || 'rgba(245,200,66,0.4)'};">
            {#if themeColors.showToolbarIcons !== false || themeColors.showIcons}
              {#if (item.target === 'home' || item.id === 'tb_home' || item.id === 'sn_home') && item.type !== 'wallet'}
                <span class="tb-icon">🏠</span>
              {:else if item.imgUrl}
                <img src={item.imgUrl} alt={item.label} class="tb-custom-icon" />
              {:else if item.type === 'wheel'}
                 <div class="tb-wheel-sidebar-style" style="width: 100%; height: 100%; position: relative;">
                   <div style="position:absolute; top:-3px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:3px solid transparent; border-right:3px solid transparent; border-top:6px solid #f5c842; z-index:10;"></div>
                   <svg width="100%" height="100%" viewBox="0 0 200 200">
                     <circle cx="100" cy="100" r="98" fill="#f5c842" />
                     <circle cx="100" cy="100" r="92" fill="#1a0a40" />
                     {#each [0,45,90,135,180,225,270,315] as deg, i}
                       <path d="M100 100 L100 8 A92 92 0 0 1 165 35 Z" fill={i%2===0?'#f5c842':'#1a0a40'} transform="rotate({deg} 100 100)" />
                     {/each}
                     <circle cx="100" cy="100" r="18" fill="#f5c842" />
                     <circle cx="100" cy="100" r="14" fill="#1a0a40" />
                     <text x="100" y="105" text-anchor="middle" font-size="12" fill="#f5c842" font-weight="900">$</text>
                   </svg>
                 </div>
              {:else if item.type === 'jackpot'}
                {@const sj = getSpecificJackpot(item)}
                {#if sj && sj.logoUrl}
                  <img 
                    src={sj.logoUrl && sj.logoUrl.includes('cashpot.ro') ? `/api/proxy/cashpot?url=${encodeURIComponent(sj.logoUrl)}` : (sj.logoUrl || '')} 
                    alt="Jackpot" 
                    class="tb-logo-img" 
                    on:error={(e) => {
                      if (e.currentTarget.src.includes('/api/proxy')) {
                        e.currentTarget.src = sj.logoUrl;
                      }
                    }}
                  />
                {:else}
                  <span class="tb-icon">{item.icon}</span>
                {/if}
              {:else if item.type === 'wallet'}
                  <div style="width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, #6d28d9, #8b5cf6); display: flex; align-items: center; justify-content: center; font-weight: 800; color: #fff; font-size: calc(32px * var(--tw-size-multiplier)); overflow: hidden; border: 1px solid rgba(245,200,66,0.4);">
                     <img src="/koi_vip.png" alt="Koi" style="width:100%; height:100%; object-fit:cover;" />
                  </div>
              {:else}
                <span class="tb-icon">{item.icon}</span>
              {/if}
            {/if}
          </div>
          
          {#if !isCollapsed}
            <div class="tb-label-container">
              {#if item.type === 'jackpot'}
                {@const sj = getSpecificJackpot(item)}
                {#if sj && sj.level}
                  <span class="tb-label tb-jp-label">{formatJP(sj.level.value)}</span>
                {:else if topJackpot}
                  <span class="tb-label tb-jp-label">{formatJP(topJackpot.value)}</span>
                {/if}
              {:else if item.type === 'lastPlayed' && lastPlayedGame}
                <span class="tb-label tb-last-played">{lastPlayedGame.n}</span>
              {:else if item.type === 'wallet'}
                <span class="tb-label" style="color: var(--accent-gold); font-weight: 900; font-family: 'Inter', monospace;">{userBalance.toLocaleString("ro-RO", { minimumFractionDigits: 0 })} <small style="font-size: 0.7em;">RON</small></span>
              {:else}
                <span class="tb-label">{item.label}</span>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    {/each}

    <!-- Hide/Show Toggle -->
    <button class="tb-toggle-btn" on:click|stopPropagation={toggleCollapse} title={isCollapsed ? 'Arată bara' : 'Ascunde bara'}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        {#if isCollapsed}
          <polyline points="13 17 18 12 13 7"></polyline>
          <polyline points="6 17 11 12 6 7"></polyline>
        {:else}
          <polyline points="11 17 6 12 11 7"></polyline>
          <polyline points="18 17 13 12 18 7"></polyline>
        {/if}
      </svg>
    </button>
  </nav>
{/if}

<style>
  .toolbar-widget {
    z-index: 900;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: rgba(18, 14, 26, 0.7);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 12px 40px rgba(0,0,0,0.7), inset 0 0 20px rgba(255,255,255,0.02);
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    width: auto;
    max-width: fit-content;
  }
  .toolbar-widget.collapsed {
    min-width: unset !important;
    padding: 8px 12px !important;
  }
  .tb-toggle-btn {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent-gold);
    cursor: pointer;
    transition: all 0.3s;
    margin-left: 4px;
    opacity: 0.6;
  }
  .tb-toggle-btn:hover {
    background: rgba(255,255,255,0.1);
    transform: scale(1.1);
    opacity: 1;
  }
  .toolbar-widget.vertical {
    width: fit-content;
    height: auto;
    min-width: unset;
  }
  .toolbar-widget.inline {
    position: relative;
    top: auto !important; left: auto !important; right: auto !important; bottom: auto !important;
    transform: none !important;
    margin: 12px auto;
    width: fit-content;
    z-index: 10;
  }
  .toolbar-widget.bottom_bar {
    position: fixed;
    bottom: 20px; 
    left: 50%;
    transform: translateX(-50%) !important;
    width: auto;
    min-width: 320px;
    max-width: 90vw;
    z-index: 999;
    border-radius: 99px;
    border: 1px solid rgba(255,255,255,0.12);
    justify-content: center;
    padding: 8px 20px;
    background: rgba(18, 14, 26, 0.9);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.4);
    margin: 0;
  }
  .toolbar-widget.no-bg {
    background: transparent !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    border-color: transparent !important;
    box-shadow: none !important;
  }
  .toolbar-widget.pos-header {
    position: relative;
    top: auto !important; left: auto !important; right: auto !important; bottom: auto !important;
    transform: none !important;
    background: transparent !important;
    backdrop-filter: none !important;
    border: none !important;
    box-shadow: none !important;
    height: 100%;
    margin: 0;
    padding: 0 10px;
    gap: 8px;
  }
  .pos-header .tb-icon-container { height: 40px !important; }
  .pos-header .tb-logo-img { height: 32px !important; width: 32px !important; }
  .pos-header .tb-custom-icon { height: 28px !important; width: 28px !important; }
  .pos-header .tb-icon { font-size: 20px !important; }
  .pos-header .tb-label { font-size: 9px !important; }
  .pos-header .tb-label-container { height: 16px !important; margin-top: 0 !important; }
  .pos-header .tb-item { min-width: 50px !important; padding: 4px !important; }

  .toolbar-widget.dragging {
    transition: none !important;
    opacity: 0.9;
    background: var(--accent-gold);
    color: #000;
    border-color: #fff;
    box-shadow: 0 20px 50px rgba(0,0,0,0.8);
  }
  .toolbar-widget.dragging .tb-label { color: #000; }
  .toolbar-widget.dragging .tb-icon { color: #000; }

  /* Snap Ghost */
  .snap-ghost {
    position: fixed;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
    z-index: 850;
    pointer-events: none;
    opacity: 0.6;
    transition: all 0.2s ease;
    border-radius: 99px;
  }
  .snap-ghost.horizontal { width: 300px; height: 50px; }
  .snap-ghost.vertical   { width: 60px; height: 300px; }

  .toolbar-widget.horizontal { flex-direction: row; }
  .toolbar-widget.vertical   { flex-direction: column; }

  /* positions */
  .pos-top    { top: 74px; left: 50%; transform: translateX(-50%); border-radius: 99px; }
  .pos-bottom { bottom: 80px; left: 50%; transform: translateX(-50%); border-radius: 99px; }
  .pos-left   { left: 16px; top: 50%; transform: translateY(-50%); right: auto !important; }
  .pos-right  { right: 16px !important; top: 50%; transform: translateY(-50%); left: auto !important; }

  .visual-mode {
    /* No more dashed border as requested */
  }
  .visual-mode:not(.inline) { cursor: grab; }
  .visual-mode:hover { border: 1px solid rgba(255, 255, 255, 0.1); }

  .drag-handle {
    padding: 4px;
    color: var(--accent-gold);
    opacity: 0.6;
    display: flex;
    align-items: center;
  }

  /* ── ITEMS ──────────────────────────────────────────── */
  .tb-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    text-align: center;
    justify-content: flex-end; /* Align labels to bottom */
  }
  .tb-icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .tb-label-container {
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin-top: 4px;
  }
  .tb-label {
    font-weight: 800;
    text-transform: uppercase;
    color: rgba(255,255,255,0.7);
    white-space: nowrap;
    transition: all 0.2s;
  }
  .tb-item:hover .tb-label, .tb-active .tb-label {
    color: #fff;
    opacity: 1;
  }
  .tb-active {
    background: linear-gradient(135deg, rgba(109, 40, 217, 0.2), rgba(76, 29, 149, 0.1));
    border-radius: 12px;
    box-shadow: inset 0 0 10px rgba(109, 40, 217, 0.2);
  }
  .tb-item.round.tb-active .tb-icon-container {
    border-color: var(--accent-gold);
    box-shadow: 0 0 15px rgba(245,200,66,0.3);
  }
  .tb-item.round .tb-icon-container {
    border: 2px solid rgba(255,255,255,0.1);
    border-radius: 50%;
    background: rgba(0,0,0,0.2);
    transition: all 0.2s;
  }
  .tb-item.card .tb-icon-container {
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    background: rgba(0,0,0,0.2);
    transition: all 0.2s;
  }

  /* Sizes */
  .size-S .tb-item { padding: 4px !important; min-width: 40px !important; gap: 2px !important; }
  .size-S .tb-label { font-size: 8px !important; opacity: 0.8; margin-top: 2px; }
  .size-S .tb-icon { font-size: 16px !important; }
  .size-S .tb-icon-container { height: 28px !important; width: 28px !important; }
  .size-S .tb-logo-img, .size-S .tb-custom-icon { width: 20px !important; height: 20px !important; }
  .size-S.vertical { width: 50px !important; padding: 10px 4px !important; }

  .size-M .tb-item { padding: 6px 10px; min-width: 50px; gap: 3px; }
  .size-M .tb-label { font-size: 9px; opacity: 0.8; }
  .size-M .tb-icon { font-size: 24px; }
  .size-M .tb-icon-container { height: 40px !important; width: 40px !important; }
  .size-M.vertical { width: 65px; padding: 12px 6px; }

  .size-L .tb-item { padding: 16px 24px; min-width: 100px; gap: 6px; }
  .size-L .tb-label { font-size: 11px; opacity: 0.8; }
  .size-L .tb-icon { font-size: 56px; }
  .size-L .tb-icon-container { height: 72px !important; width: 72px !important; }

  .size-XL .tb-item { padding: 24px 36px; min-width: 140px; gap: 10px; }
  .size-XL .tb-label { font-size: 13px; opacity: 0.8; }
  .size-XL .tb-icon { font-size: 72px; }
  .size-XL .tb-icon-container { height: 96px !important; width: 96px !important; }

  .tb-logo-img, .tb-custom-icon {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 0 12px rgba(234, 179, 8, 0.6));
    transition: transform 0.2s;
  }
  .tb-jackpot .tb-logo-img {
    height: 96px;
    width: 96px;
    object-fit: contain;
    margin-bottom: 4px;
    flex-shrink: 0;
  }
  .tb-item:hover .tb-custom-icon { transform: scale(1.1); }

  .tb-jp-label { 
    color: var(--accent-gold); 
    font-size: 14px !important;
    font-weight: 900;
    font-variant-numeric: tabular-nums;
    font-family: 'Inter', monospace;
    display: inline-block;
  }

  @media (max-width: 768px) {
    .toolbar-widget { gap: 2px; padding: 4px 6px; }
    .tb-item { padding: 5px 6px; min-width: 40px; }
    .tb-icon { font-size: 18px; }
  }
  .tb-wheel-mini {
    width: 100%;
    height: 100%;
    position: relative;
    padding: 4px;
  }
  .tb-wheel-mini.spinning .wheel-g {
    animation: tb-wheel-spin 4s cubic-bezier(0.1, 0.7, 0.1, 1) forwards;
  }
  .tb-wheel-mini:not(.spinning) .wheel-g {
    animation: tb-wheel-idle 12s linear infinite;
  }
  @keyframes tb-wheel-spin {
    from { transform: rotate(0); }
    to { transform: rotate(1440deg); }
  }
  @keyframes tb-wheel-idle {
    from { transform: rotate(0); }
    to { transform: rotate(360deg); }
  }
  .wheel-g {
    transform-origin: 50% 50%;
  }
</style>
