<script>
  import { fade, slide } from "svelte/transition";
  import { GAMES } from "./store.js";

  let selectedGame = null;
  let customImage = null;
  let isProcessing = false;
  let proposals = [];
  let processingStep = 0;
  
  const steps = [
    "Analyzing image topology...",
    "Extracting subject layers...",
    "Applying cinematic lighting...",
    "Generating 3D AI variants...",
    "Finalizing render..."
  ];

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        customImage = ev.target.result;
        selectedGame = null;
        proposals = [];
      };
      reader.readAsDataURL(file);
    }
  }

  function selectGame(game) {
    selectedGame = game;
    customImage = null;
    proposals = [];
  }

  async function generateMagic() {
    if (!selectedGame && !customImage) return;
    isProcessing = true;
    proposals = [];
    
    // Simulate AI steps
    for (let i = 0; i < steps.length; i++) {
      processingStep = i;
      await new Promise(r => setTimeout(r, 800));
    }
    
    const baseImage = customImage || selectedGame.img;
    
    proposals = [
      { id: 1, name: "Neon Synthwave", cssClass: "ai-neon", image: baseImage },
      { id: 2, name: "Cinematic Glitch", cssClass: "ai-glitch", image: baseImage },
      { id: 3, name: "Golden Aura 3D", cssClass: "ai-gold", image: baseImage }
    ];
    
    isProcessing = false;
  }

  function downloadAndSet(proposal) {
    // Mocking download and set action
    alert(`Proposal "${proposal.name}" saved and set to CDN!`);
  }
</script>

<div class="magic-studio">
  <div class="header-banner">
    <h1>✨ Magic Studio AI</h1>
    <p>Transform static game thumbnails into ultra-premium animated interactive cards.</p>
  </div>

  <div class="studio-layout">
    <div class="sidebar">
      <h3>1. Select Source</h3>
      
      <div class="upload-box">
        <label for="magic-upload" class="upload-label">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
          Upload Custom Card
        </label>
        <input type="file" id="magic-upload" accept="image/*" on:change={handleImageUpload} hidden />
      </div>

      <div class="divider">OR CHOOSE FROM CDN</div>

      <div class="games-list">
        {#each GAMES as game}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class="game-item {selectedGame?.n === game.n ? 'active' : ''}" on:click={() => selectGame(game)}>
            <img src={game.img} alt={game.n} loading="lazy" />
            <span>{game.n}</span>
          </div>
        {/each}
      </div>
    </div>

    <div class="main-workspace">
      <h3>2. AI Processing</h3>
      
      {#if !selectedGame && !customImage}
        <div class="empty-state">
          <span class="icon">🪄</span>
          <p>Select an image from the left to start the magic.</p>
        </div>
      {:else}
        <div class="preview-stage">
          <div class="original-image">
            <img src={customImage || selectedGame.img} alt="Original" />
            <div class="badge">Original</div>
          </div>
          
          <div class="actions">
            <button class="btn-magic" on:click={generateMagic} disabled={isProcessing}>
              {#if isProcessing}
                <span class="spinner"></span> {steps[processingStep]}
              {:else}
                ✨ GENERATE AI ANIMATIONS
              {/if}
            </button>
          </div>
        </div>
      {/if}

      {#if proposals.length > 0}
        <div class="proposals-grid" in:fade>
          <h3>3. Select Your Masterpiece</h3>
          <div class="grid">
            {#each proposals as proposal (proposal.id)}
              <div class="proposal-card" in:slide>
                <div class="img-wrapper {proposal.cssClass}">
                  <img src={proposal.image} alt={proposal.name} />
                </div>
                <div class="info">
                  <h4>{proposal.name}</h4>
                  <button on:click={() => downloadAndSet(proposal)}>Download & Set</button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .magic-studio {
    color: #fff;
    font-family: 'Inter', sans-serif;
  }

  .header-banner {
    background: linear-gradient(135deg, #1e1b4b, #312e81);
    padding: 30px;
    border-radius: 16px;
    margin-bottom: 24px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }

  .header-banner h1 {
    margin: 0;
    font-size: 2rem;
    background: linear-gradient(to right, #a855f7, #ec4899, #facc15);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .header-banner p {
    color: #94a3b8;
    margin: 8px 0 0;
  }

  .studio-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 24px;
  }

  .sidebar {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 20px;
    height: calc(100vh - 250px);
    display: flex;
    flex-direction: column;
  }

  .sidebar h3, .main-workspace h3 {
    margin: 0 0 16px 0;
    color: #e2e8f0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .upload-box {
    margin-bottom: 16px;
  }

  .upload-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: rgba(99, 102, 241, 0.1);
    border: 2px dashed #6366f1;
    color: #818cf8;
    padding: 16px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .upload-label:hover {
    background: rgba(99, 102, 241, 0.2);
  }

  .divider {
    text-align: center;
    color: #475569;
    font-size: 0.8rem;
    font-weight: 700;
    margin: 16px 0;
    letter-spacing: 1px;
  }

  .games-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-right: 8px;
  }

  .games-list::-webkit-scrollbar { width: 6px; }
  .games-list::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
  .games-list::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }

  .game-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    border-radius: 8px;
    background: rgba(255,255,255,0.02);
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
  }

  .game-item:hover {
    background: rgba(255,255,255,0.05);
  }

  .game-item.active {
    background: rgba(168, 85, 247, 0.15);
    border-color: #a855f7;
  }

  .game-item img {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    object-fit: cover;
  }

  .game-item span {
    font-size: 0.9rem;
    color: #cbd5e1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .main-workspace {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .empty-state {
    background: rgba(255, 255, 255, 0.02);
    border: 1px dashed rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #64748b;
  }

  .empty-state .icon {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .preview-stage {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .original-image {
    position: relative;
    width: 240px;
    height: 320px;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    overflow: hidden;
  }

  .original-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .badge {
    position: absolute;
    top: 12px;
    left: 12px;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .btn-magic {
    background: linear-gradient(45deg, #8b5cf6, #ec4899);
    border: none;
    color: white;
    padding: 16px 32px;
    font-size: 1.1rem;
    font-weight: 700;
    border-radius: 99px;
    cursor: pointer;
    box-shadow: 0 0 20px rgba(236, 72, 153, 0.4);
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .btn-magic:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 0 30px rgba(236, 72, 153, 0.6);
  }

  .btn-magic:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .proposals-grid {
    background: rgba(255, 255, 255, 0.02);
    padding: 24px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .proposal-card {
    background: #000;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 20px rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.1);
  }

  .img-wrapper {
    position: relative;
    width: 100%;
    height: 240px;
    overflow: hidden;
  }

  .img-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s;
  }

  /* --- AI ANIMATIONS --- */
  
  /* 1. Neon Synthwave */
  .ai-neon::after {
    content: '';
    position: absolute;
    inset: 0;
    box-shadow: inset 0 0 40px rgba(236, 72, 153, 0.8);
    pointer-events: none;
    animation: pulseNeon 2s infinite alternate;
  }
  @keyframes pulseNeon {
    0% { box-shadow: inset 0 0 20px rgba(236, 72, 153, 0.4); }
    100% { box-shadow: inset 0 0 60px rgba(236, 72, 153, 0.9), inset 0 0 20px rgba(139, 92, 246, 0.6); }
  }

  /* 2. Cinematic Glitch */
  .ai-glitch img {
    animation: glitchAnim 4s infinite;
    filter: contrast(1.2) saturate(1.5);
  }
  @keyframes glitchAnim {
    0% { transform: scale(1); filter: hue-rotate(0deg); }
    2% { transform: scale(1.05) translate(2px, -2px); filter: hue-rotate(90deg); }
    4% { transform: scale(1) translate(-2px, 2px); filter: hue-rotate(-90deg); }
    6% { transform: scale(1); filter: hue-rotate(0deg); }
    100% { transform: scale(1); }
  }

  /* 3. Golden Aura 3D */
  .ai-gold {
    perspective: 1000px;
  }
  .ai-gold img {
    animation: float3D 6s infinite ease-in-out;
    filter: drop-shadow(0 0 15px rgba(250, 204, 21, 0.6)) brightness(1.1);
  }
  @keyframes float3D {
    0%, 100% { transform: rotateY(-10deg) rotateX(5deg) scale(1.05); }
    50% { transform: rotateY(10deg) rotateX(-5deg) scale(1.1); }
  }

  .info {
    padding: 16px;
    text-align: center;
    background: #111;
  }

  .info h4 {
    margin: 0 0 12px 0;
    color: #fff;
    font-size: 1rem;
  }

  .info button {
    width: 100%;
    padding: 10px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #fff;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .info button:hover {
    background: #3b82f6;
    border-color: #3b82f6;
  }
</style>
