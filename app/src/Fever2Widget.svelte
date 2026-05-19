<script>
  export let jp;
  export let gaugeStyle = 'speedometer'; // Default fallback
  export let extraAnimation = false;
  export let warpSpeedEffect = false;
  export let warpDensity = 'medium';
  export let starfieldEffect = false;
  export let starfieldDensity = 'medium';

  const formatJP = (val) => Number(val).toLocaleString('ro-RO', {minimumFractionDigits: 2, maximumFractionDigits: 2});

  $: highestLevel = [...(jp.levels || [])].sort((a, b) => b.value - a.value)[0] || { value: 0 };
  $: firstVal = highestLevel.value;
  // Progress 0 to 1 (Scale to 100k for now, or use maxRef)
  $: progress = Math.min(1, Math.max(0, firstVal / 100000));
  $: rotationAngle = (progress * 180) - 90;
  // Arc length is ~251
  $: arcOffset = 251 * (1 - progress);
  $: arcOffset = 251 * (1 - progress);

  // Marine icons for ocean-world style
  const marineIcons = ['🐟', '🐡', '🐠', '🦈', '🐋', '🦑', '🐙', '🦀'];
  const marineItems = Array(15).fill(0).map((_, i) => ({
    icon: marineIcons[i % marineIcons.length],
    left: Math.random() * 100,
    delay: Math.random() * 10,
    size: Math.random() * 10 + 10,
    depth: Math.random() * 20
  }));
</script>

{#if gaugeStyle === 'neon-glass'}
  <!-- 💎 DIAMOND SLAB 2.0 - EXTREME 3D GLASS -->
  <div class="diamond-slab-3d {extraAnimation ? 'extreme-mode' : ''}">
    <div class="diamond-glass-body">
       <div class="diamond-glass-header">
          <img src={jp.logoUrl} alt={jp.name} class="diamond-logo" />
       </div>

       <div class="diamond-amount-container">
          <div class="diamond-jackpot-title">JACKPOT</div>
          <div class="diamond-main-amount-box">
             <span class="diamond-amount-val">{formatJP(firstVal)}</span>
             <span class="diamond-currency-tag">RON</span>
          </div>
       </div>

       <div class="diamond-gauge-area">
          <div class="diamond-arc-bg">
             <div class="diamond-arc-progress" style="width: {progress * 100}%"></div>
          </div>
          {#if progress > 0.8 || extraAnimation}
             <div class="diamond-fire-pulse"></div>
             <div class="diamond-status-badge">ON FIRE</div>
          {/if}
       </div>
       
       <div class="diamond-footer-symbol">
          <span style="color: {highestLevel.color}">{highestLevel.icon}</span>
       </div>
    </div>
    <!-- 3D Optical Layers -->
    <div class="diamond-edge-refraction"></div>
    <div class="diamond-thickness-side"></div>
    <div class="diamond-prism-glint"></div>
  </div>
{:else if gaugeStyle === 'inferno'}
  <!-- 🔥 BELLLINK INFERNO - IDENTIC TO SCREENSHOT -->
  <div class="belllink-inferno-slab {extraAnimation ? 'extreme-mode' : ''}">
    <div class="inferno-glass-overlay"></div>
    <div class="inferno-top-shine"></div>
    
    <div class="inferno-content">
       <div class="inferno-header">
          <svg class="belllink-crown" viewBox="0 0 24 24" fill="#ffd700"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z"/></svg>
          <span class="belllink-text">BELLLINK</span>
       </div>

       <div class="inferno-amount-frame">
          <div class="tech-corner tl"></div><div class="tech-corner tr"></div>
          <div class="tech-corner bl"></div><div class="tech-corner br"></div>
          <div class="inferno-amount-box">
             <span class="inferno-val">{formatJP(firstVal)}</span>
             <span class="inferno-ron">RON</span>
          </div>
       </div>

       <div class="inferno-gauge-area">
          <div class="inferno-fire-circle">
             <svg viewBox="0 0 100 100" class="inferno-svg">
                <circle cx="50" cy="50" r="45" class="inferno-track" />
                <circle cx="50" cy="50" r="45" class="inferno-fill" 
                        style="stroke-dashoffset: {282 * (1 - progress)};" />
             </svg>
             <div class="inferno-flames-overlay"></div>
             <div class="inferno-status-text">ON FIRE</div>
          </div>
       </div>

       <div class="inferno-button-frame">
          <div class="btn-tech-border"></div>
          <button class="inferno-play-btn">JOACĂ ACUM</button>
       </div>
    </div>
  </div>
{:else if gaugeStyle === 'ocean-world'}
  <!-- 🌊 OCEAN WORLD - UNDERWATER ADVENTURE -->
  <div class="ocean-slab {extraAnimation ? 'extreme-mode' : ''}">
    <div class="ocean-bubbles">
      {#each Array(20) as _, i}
        <div class="ocean-bubble" style="left: {Math.random() * 100}%; animation-delay: {Math.random() * 5}s; width: {Math.random() * 10 + 5}px; height: {Math.random() * 10 + 5}px;"></div>
      {/each}
    </div>
    
    <div class="ocean-content-body">
       <div class="ocean-header-area">
          <img src={jp.logoUrl} alt={jp.name} class="ocean-logo" />
          <div class="ocean-marine-life">
             {#each marineItems as item, i}
               <span class="marine-creature" style="left: {item.left}%; animation-delay: {item.delay}s; font-size: {item.size}px; transform: translateZ({item.depth}px)">{item.icon}</span>
             {/each}
          </div>
       </div>

       <div class="ocean-amount-display">
          <div class="ocean-title">DEEP SEA JACKPOT</div>
          <div class="ocean-val-box">
             <span class="ocean-val">{formatJP(firstVal)}</span>
             <span class="ocean-currency">RON</span>
          </div>
       </div>

       <div class="ocean-gauge-wrapper">
          <div class="ocean-wave-progress" style="height: {progress * 100}%;">
             <div class="wave-top"></div>
          </div>
          <div class="ocean-progress-text">{Math.round(progress * 100)}%</div>
       </div>
       
       <button class="ocean-action-btn">EXPLOREAZĂ ADÂNCIMILE</button>
    </div>
  </div>
{:else if gaugeStyle === 'glamour'}
  <!-- GLAMOUR / ARC CARD -->
  <div class="jf2-glamour-card {extraAnimation ? 'extreme-mode' : ''}">
    <div class="glamour-header">
       <img src={jp.logoUrl} alt={jp.name} class="glamour-logo" />
    </div>

    <div class="glamour-amount-box">
       <div class="glamour-amount">{formatJP(firstVal)} <small>RON</small></div>
    </div>

    <div class="glamour-gauge-area">
       <svg viewBox="0 0 100 60" class="glamour-arc-svg">
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="6" stroke-linecap="round" />
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="{highestLevel.color || '#ff4400'}" stroke-width="6" stroke-linecap="round"
                style="stroke-dasharray: 126; stroke-dashoffset: {126 * (1 - progress)}; transition: stroke-dashoffset 2s ease-out;" />
       </svg>
       
       <div class="glamour-fire-base"></div>
       
       {#if progress > 0.8 || extraAnimation}
          <div class="glamour-on-fire-text">ON FIRE</div>
       {/if}
    </div>

    <div class="speedo-amounts-footer" style="background: transparent; border: none; box-shadow: none; padding: 0;">
       <div class="speedo-val-row" style="justify-content: center; font-size: 24px; filter: drop-shadow(0 0 8px {highestLevel.color});">
          <span>{highestLevel.icon}</span>
       </div>
    </div>
  </div>
{:else if gaugeStyle === 'volcano'}
  <!-- VOLCANO / FIRE CARD -->
  <div class="jf2-volcano-card {extraAnimation ? 'extreme-mode' : ''}">
    <div class="volcano-header">
       <img src={jp.logoUrl} alt={jp.name} class="volcano-logo" />
    </div>

    <div class="volcano-amount-box">
       <div class="volcano-amount">{formatJP(firstVal)}</div>
       <div class="volcano-currency">RON</div>
    </div>

    <div class="volcano-gauge-container">
       <div class="volcano-fire-ring-outer">
          <div class="volcano-fire-ring-inner">
             <svg viewBox="0 0 100 100" class="volcano-svg">
                <circle cx="50" cy="50" r="40" class="volcano-track" />
                <circle cx="50" cy="50" r="40" class="volcano-fill" 
                        style="stroke-dashoffset: {251 * (1 - progress)}; transition: stroke-dashoffset 2s ease-out; stroke: {highestLevel.color || '#ff4400'};" />
             </svg>
             <div class="volcano-fire-flames"></div>
             <div class="volcano-status-label" style="color: {highestLevel.color || '#fff'};">
                {progress > 0.8 ? 'ON FIRE' : (progress > 0.4 ? 'HEAT' : 'BURN')}
             </div>
          </div>
       </div>
    </div>

    <div class="speedo-amounts-footer" style="background: transparent; border: none; box-shadow: none; padding: 0;">
       <div class="speedo-val-row" style="justify-content: center; font-size: 20px; filter: drop-shadow(0 0 5px {highestLevel.color});">
          <span>{highestLevel.icon}</span>
       </div>
    </div>
  </div>
{:else if gaugeStyle === 'safe'}
  <!-- VAULT / SAFE (Seif) - 3D MASTERCLASS (RESTORED) -->
  <div class="vault-3d-box">
    <div class="vault-side-top"></div>
    <div class="vault-side-left"></div>
    
    <div class="jf2-vault-wrapper {extraAnimation ? 'extreme-mode' : ''}">
      <div class="vault-rivet top-left"></div>
      <div class="vault-rivet top-right"></div>
      <div class="vault-rivet bottom-left"></div>
      <div class="vault-rivet bottom-right"></div>
      <div class="vault-door-hinge"></div>

      <div class="speedo-header">
         <img src={jp.logoUrl} alt={jp.name} class="speedo-header-logo" style="max-height: 28px; filter: drop-shadow(0 2px 4px #000);" />
      </div>

      <div class="vault-dial-container">
         <div class="vault-fire-ring"></div>
         <div class="vault-dial-notches" style="transform: rotate({progress * 720}deg);">
            {#each Array(12) as _, i}
              <div class="dial-notch" style="transform: rotate({i * 30}deg)"></div>
            {/each}
         </div>
         <div class="vault-dial" style="transform: rotate({progress * 720}deg); transition: transform 2s cubic-bezier(0.25, 1, 0.5, 1);">
            <div class="dial-inner-plate"></div>
            <div class="dial-knob-3d"></div>
            <div class="dial-pointer"></div>
         </div>
      </div>

      <div class="vault-display-panel">
         <div class="vault-lcd-glass">
            <div class="vault-lcd-content">
               {#if extraAnimation || progress > 0.7}
                  <div class="vault-on-fire-badge-new">ON FIRE</div>
               {/if}
               <div class="vault-amount-digital">{formatJP(firstVal)}</div>
               <div class="vault-currency-tag">RON</div>
            </div>
            <div class="lcd-reflection"></div>
         </div>
      </div>

      <div class="speedo-amounts-footer" style="background: transparent; border: none; box-shadow: none; padding: 0; margin-top: 5px;">
         <div class="speedo-val-row" style="justify-content: center; font-size: 24px; filter: drop-shadow(0 0 8px {highestLevel.color});">
            <span>{highestLevel.icon}</span>
         </div>
      </div>
    </div>
  </div>
{:else if gaugeStyle === 'ocean'}
  <!-- 🌊 OCEAN AQUARIUM - THEMATIC 3D TANK -->
  <div class="jf2-ocean-card {extraAnimation ? 'extreme-mode' : ''}">
    <div class="ocean-water-tank">
      <div class="ocean-glass-front"></div>
      <div class="ocean-bubbles">
        {#each Array(10) as _, i}
          <div class="ocean-bubble" style="left: {Math.random() * 100}%; animation-delay: {Math.random() * 4}s; transform: scale({0.5 + Math.random()})"></div>
        {/each}
      </div>
      
      <div class="ocean-content">
        <div class="ocean-header">
           <img src={jp.logoUrl} alt={jp.name} class="ocean-logo-img" />
        </div>

        <div class="ocean-prize-box">
           <div class="ocean-prize-amount">{formatJP(firstVal)}</div>
           <div class="ocean-prize-currency">RON</div>
        </div>

        <div class="ocean-gauge-wrapper">
           <svg viewBox="0 0 100 100" class="ocean-circle-svg">
              <circle cx="50" cy="50" r="45" class="ocean-track" />
              <circle cx="50" cy="50" r="45" class="ocean-fill" 
                      style="stroke-dashoffset: {282 * (1 - progress)}; stroke: {highestLevel.color || '#3b82f6'};" />
           </svg>
           <div class="ocean-fish-marker" style="transform: rotate({progress * 360}deg)">
              <span>🐟</span>
           </div>
        </div>
        
        <div class="ocean-status-badge" style="background: {highestLevel.color || '#3b82f6'}22; border-color: {highestLevel.color || '#3b82f6'}44; color: {highestLevel.color || '#fff'}">
          {highestLevel.icon} {highestLevel.name}
        </div>
      </div>
      
      <div class="ocean-tank-base"></div>
    </div>
  </div>
{:else if gaugeStyle === 'safe2'}
  <!-- VAULT 2.0 - EXTREME MECHANICAL 3D -->
  <div class="vault-safe2-block {extraAnimation ? 'extreme-mode' : ''}">
    <div class="safe2-rivet s2-tl"></div>
    <div class="safe2-rivet s2-tr"></div>
    <div class="safe2-rivet s2-bl"></div>
    <div class="safe2-rivet s2-br"></div>
    
    <div class="vault-symbol-header">
       <span class="vault-symbol-icon" style="color: {highestLevel.color};">{highestLevel.icon}</span>
    </div>

    <div class="vault-prize-area">
       <div class="vault-prize-amount">{formatJP(firstVal)}</div>
       <div class="vault-prize-currency">RON</div>
    </div>

    <div class="safe2-mechanical-gauge">
       <div class="safe2-dial-bezel">
          <div class="safe2-dial-ticks">
             {#each Array(10) as _, i}
                <div class="s2-tick" style="transform: rotate({i * 36}deg)"></div>
             {/each}
          </div>
          <div class="safe2-dial-core">
             <div class="s2-keyhole-inner"></div>
             <div class="s2-core-glint"></div>
          </div>
          <div class="safe2-needle-3d" style="transform: rotate({progress * 360}deg)"></div>
       </div>
       {#if progress > 0.8}
          <div class="safe2-heat-haze"></div>
       {/if}
    </div>

    <div class="vault-status-footer">
       <div class="vault-status-label" style="color: {progress > 0.8 ? '#ef4444' : (progress > 0.5 ? '#f59e0b' : '#9ca3af')};">
          {progress > 0.8 ? 'ON FIRE' : (progress > 0.5 ? 'HEAT' : 'BURN')}
       </div>
    </div>
  </div>
{:else if gaugeStyle !== 'speedometer'}
  <!-- BATTERY (Vertical Premium Layout) -->
  <div class="jf2-speedo-wrapper {extraAnimation ? 'extreme-mode' : ''}">
    <div class="speedo-header">
       <img src={jp.logoUrl} alt={jp.name} class="speedo-header-logo" />
    </div>
    
    <div class="battery-3d-container" style="margin-top: 10px; margin-bottom: 10px;">
      <div class="battery-3d">
        <div class="battery-terminal"><div class="terminal-top"></div><div class="terminal-body"></div></div>
        <div class="battery-cap"><div class="cap-top"></div><div class="cap-body"></div></div>
        <div class="battery-glass">
          <div class="battery-lines"></div>
          <div class="battery-liquid" style="height: {progress * 90 + 5}%; transition: height 2s cubic-bezier(0.25, 1, 0.5, 1);">
            <div class="liquid-top"></div>
          </div>
          <div class="battery-reflection"></div>
        </div>
        <div class="battery-bottom"></div>
      </div>
    </div>

    <!-- Footers are now consistent across styles -->
    <div class="speedo-amounts-footer">
      {#if jp.levels && jp.levels.length > 0}
        {#each (jp.showOnlyHighestLevel ? [[...(jp.levels || [])].sort((a, b) => b.value - a.value)[0]] : jp.levels) as level}
          <div class="speedo-val-row">
            <span style="color: {level.color || '#fff'}; font-size: 16px;">{level.icon}</span> 
            <span>{formatJP(level.value)} RON</span>
          </div>
        {/each}
      {:else}
         <div class="speedo-val-row">
           <span>{formatJP(372399.84)} RON</span>
         </div>
      {/if}
    </div>
  </div>
{:else}
  <!-- SPEEDOMETER -->
  <div class="jf2-speedo-wrapper {extraAnimation ? 'extreme-mode' : ''}">
    <div class="speedo-header">
       <img src={jp.logoUrl} alt={jp.name} class="speedo-header-logo" />
    </div>
    <div class="speedo-dial">

      <svg viewBox="0 0 200 120" class="speedo-svg">
        <!-- Background Arc -->
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12" stroke-linecap="round"/>
        
        <!-- Ticks/Calibration -->
        <g class="speedo-ticks" stroke="rgba(255,255,255,0.2)" stroke-width="2">
          {#each Array(11) as _, i}
            {@const angle = (i * 18) - 180}
            {@const x1 = 100 + 72 * Math.cos(angle * Math.PI / 180)}
            {@const y1 = 100 + 72 * Math.sin(angle * Math.PI / 180)}
            {@const x2 = 100 + 88 * Math.cos(angle * Math.PI / 180)}
            {@const y2 = 100 + 88 * Math.sin(angle * Math.PI / 180)}
            <line {x1} {y1} {x2} {y2} />
          {/each}
        </g>

        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#speedo-grad-{jp.id})" stroke-width="12" stroke-linecap="round" 
              style="stroke-dasharray: 251; stroke-dashoffset: {arcOffset}; transition: stroke-dashoffset 1.5s cubic-bezier(0.25, 1, 0.5, 1);"/>
        <defs>
          <linearGradient id="speedo-grad-{jp.id}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#eab308"/> <!-- Yellow -->
            <stop offset="40%" stop-color="#ef4444"/> <!-- Red -->
            <stop offset="100%" stop-color="#b91c1c"/> <!-- Super Red -->
          </linearGradient>
        </defs>
        <!-- Parent group handles the VALUE rotation -->
        <g style="transform: rotate({rotationAngle}deg); transform-origin: 100px 100px; transition: transform 1.5s cubic-bezier(0.25, 1, 0.5, 1);">
          <!-- Child group handles the LIVE JITTER animation -->
          <g class="speedo-needle">
            <circle cx="100" cy="100" r="8" fill="#111" stroke="#b91c1c" stroke-width="2"/>
            <polygon points="96,100 104,100 100,20" fill="#b91c1c" />
          </g>
        </g>
      </svg>
      
      {#if warpSpeedEffect}
        <div class="speedo-warp-bg warp-density-{warpDensity}">
          <div class="warp-lines"></div>
        </div>
      {/if}
      
      {#if starfieldEffect}
        <div class="speedo-starfield-bg star-density-{starfieldDensity}">
          <div class="star-layer layer-1"></div>
          <div class="star-layer layer-2"></div>
          <div class="star-layer layer-3"></div>
        </div>
      {/if}
      <div class="speedo-center">
        <!-- Logo moved to header -->
      </div>
    </div>

    <!-- MOVED OUTSIDE DIAL TO PREVENT OVERLAP -->
    <div class="speedo-amounts-footer">
      {#if jp.levels && jp.levels.length > 0}
        {#each (jp.showOnlyHighestLevel ? [[...(jp.levels || [])].sort((a, b) => b.value - a.value)[0]] : jp.levels) as level}
          <div class="speedo-val-row">
            <span style="color: {level.color || '#fff'}; font-size: 16px;">{level.icon}</span> 
            <span>{formatJP(level.value)} RON</span>
          </div>
        {/each}
      {:else}
         <div class="speedo-val-row">
           <span>{formatJP(372399.84)} RON</span>
         </div>
      {/if}
    </div>
  </div>
{/if}

