<script>
  import { onMount } from "svelte";
  import { GAMES } from "./store.js";

  const STORAGE_KEY = "cashpot_figma_proposal_v1";
  const DEFAULTS = {
    isLoggedIn: true,
    vipPlacement: "header",
    vipBarOrientation: "horizontal",
    headerVipMode: "free",
    vipRightOffset: 100,
    searchWidth: 265,
    vipShape: "pill",
    vipFillColor: "gold",
    catBarStyle: "figma-bar",
    catBarWidthMode: "fit",
    catIconStyle: "svg",
    sidebarMode: "full",
    currentPage: "home",
  };

  // ─── Interactive Preview Controls State ──────────────────────────
  let isLoggedIn = DEFAULTS.isLoggedIn;
  let vipPlacement = DEFAULTS.vipPlacement; // "header" | "sidebar" | "both"
  let vipBarOrientation = DEFAULTS.vipBarOrientation; // "vertical-br" | "horizontal"
  let vipVertFlyoutOpen = false;
  let headerVipMode = DEFAULTS.headerVipMode; // "free" | "right-clean" | "merged-with-icons" | "merged-replace"
  let vipRightOffset = DEFAULTS.vipRightOffset; // 0 (right after search) .. 100 (flush right)
  let searchWidth = DEFAULTS.searchWidth; // 180 .. 900
  let vipShape = DEFAULTS.vipShape; // "card" | "pill"
  let currentPage = DEFAULTS.currentPage; // "home" | "vip"
  let searchQuery = "";
  let activePill = "hot";
  let catBarStyle = DEFAULTS.catBarStyle; // "figma-bar" | "pills"
  let catBarWidthMode = DEFAULTS.catBarWidthMode; // "fit" | "full"
  let catIconStyle = DEFAULTS.catIconStyle; // "svg" | "emoji"
  let vipFillColor = DEFAULTS.vipFillColor; // "gold" | "green"
  let sidebarMode = DEFAULTS.sidebarMode; // "full" | "mini" | "hidden"
  let showConfigurator = false;
  let showControls = true;
  let showHotTooltip = false;
  let emailPromo = "";
  let activeSidebarNav = "slots";
  let pillsScrollEl;
  let pillsCanScroll = false;
  let shellEl;
  let fpMobileBarsHidden = false;
  let fpMobileMenuOpen = false;
  let fpLastScrollTop = 0;
  let fpScrollDeltaAcc = 0;
  let configLoaded = false;
  let saveStatus = "";
  let saveStatusTimer;

  function toggleSidebar() {
    if (typeof window !== "undefined" && window.innerWidth <= 960) {
      fpMobileMenuOpen = !fpMobileMenuOpen;
      fpMobileBarsHidden = false;
      return;
    }
    sidebarMode = sidebarMode === "hidden" ? "full" : "hidden";
  }

  function handleFpScrollMetrics(rawScrollTop, scrollHeight, clientHeight) {
    if (typeof window !== "undefined" && window.innerWidth > 960) {
      if (fpMobileBarsHidden) fpMobileBarsHidden = false;
      return;
    }
    const maxScroll = Math.max(0, (scrollHeight || 0) - (clientHeight || 0));
    const clampedY = Math.max(
      0,
      maxScroll > 0 ? Math.min(rawScrollTop, maxScroll) : rawScrollTop,
    );

    if (clampedY <= 24 || fpMobileMenuOpen) {
      fpMobileBarsHidden = false;
      fpLastScrollTop = clampedY;
      fpScrollDeltaAcc = 0;
      return;
    }

    const delta = clampedY - fpLastScrollTop;
    fpLastScrollTop = clampedY;
    if (Math.abs(delta) < 0.5) return;

    if (
      (delta > 0 && fpScrollDeltaAcc < 0) ||
      (delta < 0 && fpScrollDeltaAcc > 0)
    ) {
      fpScrollDeltaAcc = 0;
    }
    fpScrollDeltaAcc += delta;

    if (fpScrollDeltaAcc > 10 && clampedY > 48) {
      fpMobileBarsHidden = true;
      fpScrollDeltaAcc = 0;
    } else if (fpScrollDeltaAcc < -6) {
      fpMobileBarsHidden = false;
      fpScrollDeltaAcc = 0;
    }
  }

  function applySavedConfig(cfg) {
    if (!cfg || typeof cfg !== "object") return;
    if (typeof cfg.isLoggedIn === "boolean") isLoggedIn = cfg.isLoggedIn;
    if (typeof cfg.vipPlacement === "string") vipPlacement = cfg.vipPlacement;
    if (showConfigurator && typeof cfg.vipBarOrientation === "string") vipBarOrientation = cfg.vipBarOrientation;
    if (typeof cfg.headerVipMode === "string") headerVipMode = cfg.headerVipMode;
    if (typeof cfg.vipRightOffset === "number") vipRightOffset = cfg.vipRightOffset;
    if (typeof cfg.searchWidth === "number") searchWidth = cfg.searchWidth;
    if (typeof cfg.vipShape === "string") vipShape = cfg.vipShape;
    if (typeof cfg.vipFillColor === "string") vipFillColor = cfg.vipFillColor;
    if (typeof cfg.catBarStyle === "string") catBarStyle = cfg.catBarStyle;
    if (typeof cfg.catBarWidthMode === "string")
      catBarWidthMode = cfg.catBarWidthMode;
    if (typeof cfg.catIconStyle === "string") catIconStyle = cfg.catIconStyle;
    if (typeof cfg.sidebarMode === "string") sidebarMode = cfg.sidebarMode;
    if (typeof cfg.currentPage === "string") currentPage = cfg.currentPage;
  }

  onMount(() => {
    if (
      typeof window !== "undefined" &&
      window.location.href.includes("config=1")
    ) {
      showConfigurator = true;
    }
    if (typeof window !== "undefined" && window.innerWidth <= 960) {
      showControls = false;
    }

    (async () => {
      let loadedLocally = false;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          applySavedConfig(JSON.parse(raw));
          loadedLocally = true;
        }
      } catch (e) {}

      if (!loadedLocally) {
        try {
          const res = await fetch("/api/cms/figmaProposalConfig");
          if (res.ok) {
            const json = await res.json();
            if (json?.ok && json?.data) {
              applySavedConfig(json.data);
            }
          }
        } catch (e) {}
      }
      configLoaded = true;
    })();

    const scrollParent =
      shellEl?.closest(".figma-scroll-container") || shellEl?.parentElement;
    const onParentScroll = () => {
      if (!scrollParent) return;
      handleFpScrollMetrics(
        scrollParent.scrollTop,
        scrollParent.scrollHeight,
        scrollParent.clientHeight,
      );
    };
    const onWindowScroll = () => {
      const doc = document.documentElement;
      if (doc && doc.scrollHeight > window.innerHeight + 4) {
        handleFpScrollMetrics(
          window.scrollY,
          doc.scrollHeight,
          window.innerHeight,
        );
      }
    };

    scrollParent?.addEventListener("scroll", onParentScroll, { passive: true });
    window.addEventListener("scroll", onWindowScroll, { passive: true });

    return () => {
      scrollParent?.removeEventListener("scroll", onParentScroll);
      window.removeEventListener("scroll", onWindowScroll);
    };
  });

  $: currentConfigSnapshot = {
    isLoggedIn,
    vipPlacement,
    vipBarOrientation,
    headerVipMode,
    vipRightOffset,
    searchWidth,
    vipShape,
    vipFillColor,
    catBarStyle,
    catBarWidthMode,
    catIconStyle,
    sidebarMode,
    currentPage,
  };

  $: if (fpMobileBarsHidden && vipVertFlyoutOpen) {
    vipVertFlyoutOpen = false;
  }

  $: if (configLoaded && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfigSnapshot));
    } catch (e) {}
  }

  async function saveFigmaConfig() {
    clearTimeout(saveStatusTimer);
    saveStatus = "saving";
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfigSnapshot));
    } catch (e) {}
    try {
      await fetch("/api/cms/figmaProposalConfig", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: currentConfigSnapshot }),
      });
    } catch (e) {}
    saveStatus = "saved";
    saveStatusTimer = setTimeout(() => {
      saveStatus = "";
    }, 2500);
  }

  function resetFigmaConfig() {
    applySavedConfig(DEFAULTS);
    saveFigmaConfig();
  }

  function scrollPills(dir) {
    pillsScrollEl?.scrollBy({ left: dir * 220, behavior: "smooth" });
  }

  function updatePillsOverflow() {
    if (!pillsScrollEl) {
      pillsCanScroll = false;
      return;
    }
    pillsCanScroll = pillsScrollEl.scrollWidth > pillsScrollEl.clientWidth + 2;
  }

  function observePillsOverflow(node) {
    updatePillsOverflow();
    const raf = requestAnimationFrame(updatePillsOverflow);
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => updatePillsOverflow());
      ro.observe(node);
      if (node.parentElement) ro.observe(node.parentElement);
      if (node.parentElement?.parentElement)
        ro.observe(node.parentElement.parentElement);
    }
    window.addEventListener("resize", updatePillsOverflow);
    return {
      destroy() {
        cancelAnimationFrame(raf);
        ro?.disconnect();
        window.removeEventListener("resize", updatePillsOverflow);
      },
    };
  }

  $: if (
    pillsScrollEl &&
    (catBarStyle || catIconStyle || catBarWidthMode || sidebarMode)
  ) {
    requestAnimationFrame(updatePillsOverflow);
  }

  // Safe game selector helper
  const pickGames = (indices) =>
    indices.map((i) => GAMES[i % GAMES.length]).filter(Boolean);

  const categoryPills = [
    { id: "hot", label: "Hot", icon: "🔥" },
    { id: "jackpots", label: "Jackpot-uri", icon: "💎" },
    { id: "superslots", label: "Superslots", icon: "👑" },
    { id: "buy", label: "Cumpără speciale", icon: "⚡" },
    { id: "new", label: "Jocuri noi", icon: "✨" },
    { id: "bell", label: "Bell Link", icon: "🔔" },
    { id: "clover", label: "Clover Chance", icon: "🍀" },
    { id: "megaways", label: "Megaways", icon: "📊" },
    { id: "cards", label: "Cărți și zaruri", icon: "🎲" },
    { id: "pacanele", label: "Păcănele", icon: "🍒" },
  ];

  const hotGames = pickGames([12, 6, 4, 5, 10, 11, 22, 17, 13, 3]);
  const top10Games = pickGames([12, 24, 34, 6, 17, 19]);
  const superslotGames = pickGames([32, 25, 5, 10, 29, 16, 11, 4, 22, 31]);

  const jackpotCards = [
    {
      id: "high-cash",
      brand: "VIP BELL LINK",
      logo: "/figma/jp-vip-bell.png",
      provider: "EGT Digital",
      badge: "ON FIRE",
      badgeTone: "fire",
      theme: "purple",
      grand: "530.118,39 RON",
      major: "98.055,76 RON",
      minor: "981,73 RON",
      mini: "181,73 RON",
      thumbs: pickGames([17, 25, 10]),
    },
    {
      id: "clover-chance",
      brand: "CLOVER CHANCE",
      logo: "/figma/jp-clover.png",
      provider: "EGT Digital",
      badge: "ON FIRE",
      badgeTone: "fire",
      theme: "green",
      grand: "128.410,91 RON",
      major: "5.800,65 RON",
      minor: "638,22 RON",
      mini: "97,83 RON",
      thumbs: pickGames([12, 17, 29]),
    },
    {
      id: "jackpot-cards",
      brand: "JACKPOT CARDS",
      logo: "/figma/jp-cards.png",
      provider: "Amusnet",
      badge: "BURN",
      badgeTone: "warm",
      theme: "blue",
      grand: "47.849,02 RON",
      major: "5.933,66 RON",
      minor: "233,59 RON",
      mini: "86,30 RON",
      thumbs: pickGames([12, 24, 6]),
    },
    {
      id: "bell-link",
      brand: "BELL LINK",
      logo: "/figma/jp-bell-link.png",
      provider: "EGT Digital",
      badge: "ON FIRE",
      badgeTone: "fire",
      theme: "crimson",
      grand: "118.153,77 RON",
      major: "3.482,82 RON",
      minor: "45,64 RON",
      mini: "9,64 RON",
      thumbs: pickGames([34, 29, 28]),
    },
    {
      id: "regal-jackpot",
      brand: "Regal JACKPOT",
      logo: "/figma/jp-regal.png",
      provider: "Pateplay",
      badge: "HEAT",
      badgeTone: "heat",
      theme: "bronze",
      grand: "44.191,02 RON",
      major: "1.255,78 RON",
      minor: "156,30 RON",
      mini: "26,06 RON",
      thumbs: pickGames([24, 26, 33]),
    },
  ];

  const winnersList = [
    {
      user: "Marian D.",
      amount: "14.500 RON",
      game: "Gems",
      img: GAMES[4].img,
    },
    {
      user: "Alex V.",
      amount: "3.240 RON",
      game: "VIP Flaming Hot Extreme",
      img: GAMES[13].img,
    },
    {
      user: "Ionut M.",
      amount: "8.900 RON",
      game: "40 Shining Crown Bell Link",
      img: GAMES[12].img,
    },
    {
      user: "Andrei S.",
      amount: "2.100 RON",
      game: "Speed Blackjack",
      img: GAMES[23].img,
    },
    {
      user: "Florin C.",
      amount: "45.000 RON",
      game: "Big Bass Vegas Double",
      img: GAMES[10].img,
    },
  ];

  const hourlyHot = [
    {
      rank: 1,
      name: "Club Tropicana Happy Hour",
      provider: "Pragmatic Play",
      rtp: "177.34%",
      img: GAMES[32].img,
    },
    {
      rank: 2,
      name: "VIP 40 Super Hot Bell Link",
      provider: "EGT Digital",
      rtp: "152.89%",
      img: GAMES[34].img,
    },
    {
      rank: 3,
      name: "VIP 20 Super Hot Bell Link",
      provider: "EGT Digital",
      rtp: "151.06%",
      img: GAMES[17].img,
    },
  ];

  const hourlyCold = [
    {
      rank: 1,
      name: "Club Tropicana Happy Hour",
      provider: "Pragmatic Play",
      rtp: "78.12%",
      img: GAMES[32].img,
    },
    {
      rank: 2,
      name: "VIP 40 Super Hot Bell Link",
      provider: "EGT Digital",
      rtp: "81.45%",
      img: GAMES[34].img,
    },
    {
      rank: 3,
      name: "VIP 20 Super Hot Bell Link",
      provider: "EGT Digital",
      rtp: "83.20%",
      img: GAMES[17].img,
    },
  ];

  const providers = [
    { name: "Pateplay", accent: "#facc15" },
    { name: "AMUSNET", accent: "#a3e635" },
    { name: "PLAY'n GO", accent: "#38bdf8" },
    { name: "PLAYSON", accent: "#ef4444" },
    { name: "YGGDRASIL", accent: "#f97316" },
    { name: "HACKSAW GAMING", accent: "#e2e8f0" },
    { name: "BOOMING GAMES", accent: "#fb7185" },
    { name: "ICONIC21", accent: "#f43f5e" },
    { name: "WAZDAN", accent: "#f8fafc" },
    { name: "Big Time Gaming", accent: "#fb923c" },
    { name: "endorphina", accent: "#38bdf8" },
    { name: "PRAGMATIC PLAY", accent: "#f59e0b" },
    { name: "EGT DIGITAL", accent: "#f43f5e" },
    { name: "PUSH GAMING", accent: "#cbd5e1" },
    { name: "BGAMING", accent: "#facc15" },
    { name: "greentube", accent: "#22c55e" },
    { name: "GAMES GLOBAL", accent: "#94a3b8" },
    { name: "SYNOT", accent: "#ef4444" },
    { name: "INSPIRED", accent: "#e2e8f0" },
    { name: "RELAX GAMING", accent: "#cbd5e1" },
    { name: "Evolution", accent: "#f8fafc" },
    { name: "Spinomenal", accent: "#38bdf8" },
  ];

  const themes = [
    {
      name: "Fructe",
      count: "967 jocuri",
      img: "/figma/theme-fructe.png",
      bg: "linear-gradient(160deg, #3b1d0a, #170d1f)",
    },
    {
      name: "Lumea Apelor",
      count: "225 jocuri",
      img: "/figma/theme-ape.png",
      bg: "linear-gradient(160deg, #0c4a6e, #0f172a)",
    },
    {
      name: "Aventură",
      count: "239 jocuri",
      img: "/figma/theme-aventura.png",
      bg: "linear-gradient(160deg, #422006, #1c1917)",
    },
    {
      name: "Sexy",
      count: "79 jocuri",
      img: "/figma/theme-sexy.png",
      bg: "linear-gradient(160deg, #701a75, #1e102e)",
    },
    {
      name: "Fantezie",
      count: "57 jocuri",
      img: "/figma/theme-fantezie.png",
      bg: "linear-gradient(160deg, #312e81, #130f26)",
    },
    {
      name: "Animale",
      count: "312 jocuri",
      img: "/figma/theme-animale.png",
      bg: "linear-gradient(160deg, #431407, #1a1118)",
    },
    {
      name: "Cinema",
      count: "105 jocuri",
      img: "/figma/theme-cinema.png",
      bg: "linear-gradient(160deg, #450a0a, #140c1c)",
    },
    {
      name: "Civilizații Antice",
      count: "568 jocuri",
      img: "/figma/theme-antice.png",
      bg: "linear-gradient(160deg, #422006, #151020)",
    },
  ];

  const vipTiers = [
    {
      id: "bronz",
      name: "Bronz",
      range: "0 — 200 puncte",
      cashback: "5% Cashback",
      status: "completed",
      img: "/koi_vip_v.png",
      perks: [
        "50 Rotiri Gratuite la trecere",
        "Suport Live Chat 24/7",
        "Bonus săptămânal personalizat",
      ],
    },
    {
      id: "argint-1",
      name: "Argint 1",
      range: "200 — 600 puncte",
      cashback: "8% Cashback",
      status: "active",
      points: "420 / 600",
      percent: 70,
      img: "/starfish_vip_v.png",
      perks: [
        "100 Rotiri Gratuite fără rulaj",
        "Retrageri prioritare",
        "Turnee exclusive Argint",
      ],
    },
    {
      id: "aur",
      name: "Aur",
      range: "600 — 1.500 puncte",
      cashback: "10% Cashback",
      status: "locked",
      img: "/crab_vip_v.png",
      perks: [
        "250 RON Bonus Cash",
        "Limite mărite de retragere",
        "Cadou aniversar dedicat",
      ],
    },
    {
      id: "platina",
      name: "Platină",
      range: "1.500 — 4.000 puncte",
      cashback: "12% Cashback",
      status: "locked",
      img: "/octopus_vip_v.png",
      perks: [
        "Manager VIP dedicat",
        "500 RON Bonus fără rulaj",
        "Invitații la evenimente",
      ],
    },
    {
      id: "diamant",
      name: "Diamant",
      range: "4.000 — 10.000 puncte",
      cashback: "15% Cashback",
      status: "locked",
      img: "/whale_vip_v.png",
      perks: [
        "Retrageri instant",
        "Oferte zilnice personalizate",
        "1.500 RON Bonus de nivel",
      ],
    },
    {
      id: "rechin",
      name: "Rechin Suprem",
      range: "10.000+ puncte",
      cashback: "20% Cashback",
      status: "locked",
      img: "/shark_vip_v2.png",
      perks: [
        "Concierge personal 24/7",
        "Vacanțe & premii fizice",
        "Fără limite la retrageri",
      ],
    },
  ];

  $: filteredSearchGames = searchQuery.trim()
    ? GAMES.filter(
        (g) =>
          g.n.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.p.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (g.c &&
            g.c.some((cat) =>
              cat.toLowerCase().includes(searchQuery.toLowerCase()),
            )),
      )
    : [];

  function openGamePreview(game) {
    alert(`Preview Figma Cashpot: ${game.n} (${game.p})`);
  }
</script>

{#snippet vipShieldIcon(gradId, size = 28)}
  <div class="fp-vip-emblem" aria-hidden="true">
    <svg viewBox="0 0 36 36" width={size} height={size}>
      <defs>
        <linearGradient id={`${gradId}Shield`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="48%" stop-color="#cbd5e1" />
          <stop offset="100%" stop-color="#64748b" />
        </linearGradient>
        <linearGradient id={`${gradId}Inner`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#334155" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <circle
        cx="18"
        cy="18"
        r="16"
        fill="rgba(255,255,255,0.06)"
        stroke={`url(#${gradId}Shield)`}
        stroke-width="1.5"
      />
      <path
        d="M18 6 L27 10 V17 C27 23 22.8 27.2 18 29 C13.2 27.2 9 23 9 17 V10 Z"
        fill={`url(#${gradId}Inner)`}
        stroke={`url(#${gradId}Shield)`}
        stroke-width="1.6"
      />
      <text
        x="18"
        y="21.5"
        text-anchor="middle"
        fill="#f8fafc"
        font-size="11.5"
        font-weight="900"
        font-family="Barlow, sans-serif">1</text
      >
    </svg>
  </div>
{/snippet}

{#snippet vipProgressRows()}
  <div class="fp-vip-row-top">
    <span class="fp-vip-level-name">Argint 1</span>
    <span class="fp-vip-link">VIP Club ›</span>
  </div>
  <div class="fp-vip-row-bottom">
    <div class="fp-vip-track">
      <div class="fp-vip-fill" style="width: 70%;"></div>
    </div>
    <span class="fp-vip-score"><strong>420</strong> / 600</span>
  </div>
{/snippet}

{#snippet vipHeaderBar(gradId)}
  <button
    type="button"
    class="fp-vip-bar {vipShape === 'pill'
      ? 'is-pill'
      : 'is-card'} {currentPage === 'vip' ? 'is-active' : ''}"
    on:click={() => (currentPage = currentPage === "vip" ? "home" : "vip")}
    title="Deschide VIP Club"
  >
    {@render vipShieldIcon(gradId, 28)}
    <div class="fp-vip-info">
      {@render vipProgressRows()}
    </div>
  </button>
{/snippet}

{#snippet headerQuickIcons()}
  <button type="button" class="fp-icon-badge-btn" title="Recompense & Cadouri">
    <img src="/figma/icon-gift.png" alt="Promoții" class="fp-gift-img" />
    <span class="fp-notif-dot">1</span>
  </button>

  <button
    type="button"
    class="fp-avatar-btn"
    title="Profil Jucător"
    on:click={() => (currentPage = "vip")}
  >
    <img src="/figma/avatar-smartico.png" alt="Avatar" />
    <span class="fp-notif-dot">1</span>
  </button>
{/snippet}

{#snippet catVectorIcon(id)}
  {#if id === "hot"}
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M13.5 2.2c.3 2.5-.9 4.5-2.6 5.9-1.5 1.2-2.4 2.5-2.4 4.2 0 1.4.8 2.6 2 3.2-.5-.8-.6-1.9.1-2.8.6-.8 1.6-1.3 2-2.3.9 1.1 1.5 2.4 1.5 3.7 0 .6-.1 1.2-.4 1.7 1.6-.8 2.8-2.5 2.8-4.6 0-3.1-2-5.9-3-9zm-1.5 19.3a6.5 6.5 0 0 1-6.5-6.5c0-3.4 2-6 4.2-7.8 1.5-1.2 2.4-2.5 2.6-4.7 3.2 2.5 5.2 6.2 5.2 10.1a6.5 6.5 0 0 1-5.5 8.9z"
      />
    </svg>
  {:else if id === "jackpots"}
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path
        d="M6 4h12l4 5-10 11L2 9l4-5z"
        fill="currentColor"
        fill-opacity="0.22"
      />
      <path d="M2 9h20M7 4l2.5 5L12 20l2.5-11L17 4" />
    </svg>
  {:else if id === "superslots"}
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M3.5 18.5h17v1.8h-17v-1.8zm0-2L2.3 7.8l5.3 4.1L12 5.2l4.4 6.7 5.3-4.1-1.2 8.7h-17z"
      />
    </svg>
  {:else if id === "buy"}
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path
        d="M12 3l2.2 4.8L19.5 8.5l-3.9 3.6 1 5.2L12 14.8l-4.6 2.5 1-5.2L4.5 8.5l5.3-.7L12 3z"
        fill="currentColor"
        fill-opacity="0.22"
      />
      <path d="M19.5 16.5v3M18 18h3M4.5 16.5v2M3.5 17.5h2" />
    </svg>
  {:else if id === "new"}
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" fill="currentColor" fill-opacity="0.18" />
      <path
        d="M12 6.8l1.3 3.9 3.9 1.3-3.9 1.3L12 17.2l-1.3-3.9L6.8 12l3.9-1.3L12 6.8z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  {:else if id === "bell"}
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M12 3a1.5 1.5 0 0 1 1.5 1.5v.6A6 6 0 0 1 18 11v4.4l1.6 2.1a.6.6 0 0 1-.5.95H4.9a.6.6 0 0 1-.5-.95L6 15.4V11a6 6 0 0 1 4.5-5.9v-.6A1.5 1.5 0 0 1 12 3zm0 18.5a2.5 2.5 0 0 1-2.45-2h4.9a2.5 2.5 0 0 1-2.45 2z"
      />
    </svg>
  {:else if id === "clover"}
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M12 11.2a3.3 3.3 0 1 1 3.3-3.3c0 1.4-.9 2.6-2.1 3.1a3.3 3.3 0 1 1 3.1 4.4c-1.4 0-2.6-.9-3.1-2.1v6.2h-1.8v-6.1a3.3 3.3 0 1 1-4.1-4.3 3.3 3.3 0 1 1 4.7-2.2z"
      />
    </svg>
  {:else if id === "megaways"}
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="4" y="6" width="3.8" height="12" rx="1.6" />
      <rect x="10.1" y="4" width="3.8" height="16" rx="1.6" />
      <rect x="16.2" y="7.5" width="3.8" height="9" rx="1.6" />
    </svg>
  {:else if id === "cards"}
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      aria-hidden="true"
    >
      <rect
        x="5.5"
        y="3.5"
        width="13"
        height="17"
        rx="2.5"
        fill="currentColor"
        fill-opacity="0.16"
      />
      <path d="M12 8l3 4-3 4-3-4 3-4z" fill="currentColor" stroke="none" />
    </svg>
  {:else}
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <path
        d="M15.5 4.2c-2.8 2-4.8 5.2-6.2 8.4M15.5 4.2c1.2 2.4 1.6 5.6 1 8.6"
      />
      <circle cx="8" cy="16" r="3.4" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16.4" r="3.4" fill="currentColor" stroke="none" />
    </svg>
  {/if}
{/snippet}

{#snippet sidebarVectorIcon(id)}
  {#if id === "slots"}
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M5.5 4.5h13v3.3L11.2 19.5H7.1l6.8-11.4H5.5V4.5z" />
    </svg>
  {:else if id === "live"}
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
      <path
        d="M12 3.5v4.5M12 16v4.5M3.5 12H8M16 12h4.5M6 6l3.2 3.2M14.8 14.8L18 18M18 6l-3.2 3.2M9.2 14.8L6 18"
      />
    </svg>
  {:else if id === "sport"}
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <polygon
        points="12,7.8 15.6,10.4 14.2,14.6 9.8,14.6 8.4,10.4"
        fill="currentColor"
        stroke="none"
      />
      <path
        d="M12 3.5v4.3M19.8 9.2l-4.2 1.2M17 18.6l-2.8-4M7 18.6l2.8-4M4.2 9.2l4.2 1.2"
      />
    </svg>
  {:else if id === "loto"}
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" fill="currentColor" fill-opacity="0.16" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3.5v4.5M12 16v4.5M3.5 12H8M16 12h4.5" />
    </svg>
  {:else if id === "vip"}
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M4.5 17.5h15v1.8h-15v-1.8zm0-2L3.2 8.2l5 3.8L12 5.6l3.8 6.4 5-3.8-1.3 7.3h-15z"
      />
    </svg>
  {:else if id === "rtp"}
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M4 17l5-5 4 3 7-8" />
      <path d="M16 7h4v4" />
    </svg>
  {:else if id === "turnee"}
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M7 4.5h10v4.8a5 5 0 0 1-10 0V4.5zm-2.5 1.5H7v2.8a2.5 2.5 0 0 1-2.5-2.8zm12.5 0h2.5a2.5 2.5 0 0 1-2.5 2.8V6zm-6 8.3h2v3.2h3v1.8H8v-1.8h3v-3.2z"
      />
    </svg>
  {:else}
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H10l-4.5 3.5V16A2.5 2.5 0 0 1 4 13.5v-8z"
        fill-opacity="0.24"
        stroke="currentColor"
        stroke-width="1.6"
      />
      <circle cx="9" cy="9.5" r="1.1" />
      <circle cx="12" cy="9.5" r="1.1" />
      <circle cx="15" cy="9.5" r="1.1" />
    </svg>
  {/if}
{/snippet}

<div
  class="fp-shell"
  bind:this={shellEl}
  style="--vip-fill-bg: {vipFillColor === 'gold'
    ? 'linear-gradient(90deg, #d89e28, #f3c65f)'
    : 'linear-gradient(90deg, #16a34a, #22c55e)'}; --vip-fill-vert-bg: {vipFillColor ===
  'gold'
    ? 'linear-gradient(0deg, #c98a18 0%, #eab949 55%, #fde68a 100%)'
    : 'linear-gradient(0deg, #15803d 0%, #22c55e 60%, #86efac 100%)'}; --vip-fill-glow: {vipFillColor ===
  'gold'
    ? 'rgba(243, 198, 95, 0.45)'
    : 'rgba(34, 197, 94, 0.45)'};"
>
  <!-- ═══════════════════════ STICKY HEADER ═══════════════════════ -->
  <header class="fp-header" class:is-mobile-hidden={fpMobileBarsHidden}>
    <!-- Left: Sidebar Toggle + Brand Logo -->
    <div class="fp-header-left {sidebarMode !== 'full' ? 'is-compact' : ''}">
      <button
        type="button"
        class="fp-sidebar-toggle-btn {sidebarMode === 'hidden'
          ? 'is-collapsed'
          : ''}"
        on:click={toggleSidebar}
        title={sidebarMode === "hidden"
          ? "Afișează sidebar-ul"
          : "Ascunde sidebar-ul"}
        aria-label={sidebarMode === "hidden"
          ? "Afișează sidebar-ul"
          : "Ascunde sidebar-ul"}
      >
        <svg
          viewBox="0 0 24 24"
          width="17"
          height="17"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="4" width="18" height="16" rx="3"></rect>
          <line x1="9" y1="4" x2="9" y2="20"></line>
        </svg>
      </button>

      <button
        type="button"
        class="fp-logo-btn"
        on:click={() => (currentPage = "home")}
        title="Înapoi la Homepage Figma"
      >
        <img src="/figma/logo-cashpot.png" alt="CASHPOT" class="fp-logo-img" />
      </button>
    </div>

    <!-- Center: Shrunken Search Bar + Movable VIP Club Progress Bar -->
    <div class="fp-header-center">
      <div
        class="fp-search"
        style="width: {searchWidth}px; flex: 0 1 {searchWidth}px;"
      >
        <svg
          class="fp-search-icon"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder={searchWidth <= 230
            ? "Caută jocuri..."
            : "Caută jocuri, furnizori..."}
        />
        {#if searchQuery}
          <button
            type="button"
            class="fp-search-clear"
            on:click={() => (searchQuery = "")}
            title="Șterge căutarea"
          >
            ✕
          </button>
        {/if}
      </div>

      {#if isLoggedIn && vipBarOrientation === "horizontal" && (vipPlacement === "header" || vipPlacement === "both") && headerVipMode === "free"}
        <div
          class="fp-header-spacer"
          style="flex: {vipRightOffset / 100};"
        ></div>
        {@render vipHeaderBar("fpSilverCenter")}
        <div
          class="fp-header-spacer"
          style="flex: {(100 - vipRightOffset) / 100};"
        ></div>
      {/if}
    </div>

    <!-- Right: Account Actions / Unified VIP + Balance Modes -->
    <div class="fp-header-right">
      {#if isLoggedIn}
        {#if headerVipMode === "free"}
          {@render headerQuickIcons()}
          <div class="fp-balance-pill">
            <button
              type="button"
              class="fp-balance-plus"
              title="Depunere rapidă">+</button
            >
            <span class="fp-balance-amount">2.450,80 RON</span>
          </div>
        {:else if headerVipMode === "right-clean"}
          {#if vipBarOrientation === "horizontal" && (vipPlacement === "header" || vipPlacement === "both")}
            {@render vipHeaderBar("fpSilverRight")}
          {/if}
          <div class="fp-balance-pill">
            <button
              type="button"
              class="fp-balance-plus"
              title="Depunere rapidă">+</button
            >
            <span class="fp-balance-amount">2.450,80 RON</span>
          </div>
        {:else}
          {#if headerVipMode === "merged-with-icons"}
            {@render headerQuickIcons()}
          {/if}

          {#if vipBarOrientation === "horizontal" && (vipPlacement === "header" || vipPlacement === "both")}
            <div
              class="fp-merged-wallet {vipShape === 'pill'
                ? 'is-pill'
                : 'is-card'}"
            >
              {#if headerVipMode === "merged-replace"}
                <div class="fp-merged-avatar">
                  <img src="/figma/avatar-smartico.png" alt="Avatar" />
                  <span class="fp-merged-lvl">1</span>
                </div>
              {:else}
                {@render vipShieldIcon("fpSilverMerged", 28)}
              {/if}

              <button
                type="button"
                class="fp-merged-vip-zone"
                on:click={() =>
                  (currentPage = currentPage === "vip" ? "home" : "vip")}
                title="Deschide VIP Club"
              >
                {@render vipProgressRows()}
              </button>

              <span class="fp-merged-divider"></span>

              <div class="fp-merged-bal-zone">
                <div class="fp-merged-bal-text">
                  <span class="fp-merged-bal-lbl">Balanță</span>
                  <strong>2.450,80 RON</strong>
                </div>
                <button
                  type="button"
                  class="fp-balance-plus"
                  title="Depunere rapidă">+</button
                >
              </div>
            </div>
          {:else}
            <div class="fp-balance-pill">
              <button
                type="button"
                class="fp-balance-plus"
                title="Depunere rapidă">+</button
              >
              <span class="fp-balance-amount">2.450,80 RON</span>
            </div>
          {/if}
        {/if}
      {:else}
        <button
          type="button"
          class="fp-btn-login"
          on:click={() => (isLoggedIn = true)}
        >
          CONECTARE
        </button>
        <button
          type="button"
          class="fp-btn-register"
          on:click={() => (isLoggedIn = true)}
        >
          ÎNREGISTRARE
        </button>
      {/if}
    </div>
  </header>

  <!-- ═══════════════════════ BODY: SIDEBAR + MAIN ═══════════════════════ -->
  <div class="fp-body mode-{sidebarMode}">
    {#if fpMobileMenuOpen}
      <button
        type="button"
        class="fp-mobile-backdrop"
        aria-label="Închide meniul"
        on:click={() => (fpMobileMenuOpen = false)}
      ></button>
    {/if}

    <!-- Left Sidebar -->
    {#if sidebarMode !== "hidden" || fpMobileMenuOpen}
      <aside
        class="fp-sidebar {sidebarMode === 'mini' && !fpMobileMenuOpen
          ? 'is-mini'
          : ''}"
        class:mobile-open={fpMobileMenuOpen}
      >
        <!-- Top 3 Blue Feature Cards -->
        <div class="fp-quick-tiles">
          <button
            type="button"
            class="fp-quick-tile"
            on:click={() => (fpMobileMenuOpen = false)}
          >
            <span class="fp-qt-title">Play<br />Arena</span>
            <img src="/figma/icon-play-arena.png" alt="Play Arena" />
          </button>
          <button
            type="button"
            class="fp-quick-tile"
            on:click={() => (fpMobileMenuOpen = false)}
          >
            <span class="fp-qt-title">Roata<br />Norocului</span>
            <img src="/figma/icon-wheel.png" alt="Roata Norocului" />
          </button>
          <button
            type="button"
            class="fp-quick-tile"
            on:click={() => (fpMobileMenuOpen = false)}
          >
            <span class="fp-qt-title">Promoții</span>
            <img src="/figma/icon-promotii.png" alt="Promoții" />
          </button>
        </div>

        <!-- Optional Original Sidebar VIP Progress Card (for A/B comparison) -->
        {#if isLoggedIn && vipBarOrientation === "horizontal" && (vipPlacement === "sidebar" || vipPlacement === "both")}
          <button
            type="button"
            class="fp-sidebar-vip-card"
            on:click={() => {
              currentPage = currentPage === "vip" ? "home" : "vip";
              fpMobileMenuOpen = false;
            }}
          >
            <div class="fp-vip-emblem" aria-hidden="true">
              <svg viewBox="0 0 36 36" width="32" height="32">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="rgba(255,255,255,0.06)"
                  stroke="#cbd5e1"
                  stroke-width="1.5"
                />
                <path
                  d="M18 6 L27 10 V17 C27 23 22.8 27.2 18 29 C13.2 27.2 9 23 9 17 V10 Z"
                  fill="#1e293b"
                  stroke="#e2e8f0"
                  stroke-width="1.5"
                />
                <text
                  x="18"
                  y="21.5"
                  text-anchor="middle"
                  fill="#fff"
                  font-size="11.5"
                  font-weight="900">1</text
                >
              </svg>
            </div>
            <div class="fp-vip-info">
              <div class="fp-vip-row-top">
                <span class="fp-vip-level-name">Argint 1</span>
                <span class="fp-vip-link">VIP Club ›</span>
              </div>
              <div class="fp-vip-row-bottom">
                <div class="fp-vip-track">
                  <div class="fp-vip-fill" style="width: 70%;"></div>
                </div>
                <span class="fp-vip-score"><strong>420</strong> / 600</span>
              </div>
            </div>
          </button>
        {/if}

        {#if isLoggedIn}
          <button
            type="button"
            class="fp-btn-deposit"
            title="Depunere"
            on:click={() => (fpMobileMenuOpen = false)}
          >
            {sidebarMode === "mini" && !fpMobileMenuOpen ? "+" : "DEPUNERE"}
          </button>
        {/if}

        <!-- Nav Group 1 -->
        <div class="fp-nav-group">
          <button
            type="button"
            class="fp-nav-item {activeSidebarNav === 'slots' &&
            currentPage === 'home'
              ? 'active'
              : ''}"
            on:click={() => {
              activeSidebarNav = "slots";
              currentPage = "home";
              fpMobileMenuOpen = false;
            }}
            title="Slots"
          >
            <span class="fp-nav-ico">
              {#if catIconStyle === "svg"}{@render sidebarVectorIcon(
                  "slots",
                )}{:else}777{/if}
            </span>
            <span class="fp-nav-lbl">Slots</span>
          </button>
          <button
            type="button"
            class="fp-nav-item {activeSidebarNav === 'live' ? 'active' : ''}"
            on:click={() => {
              activeSidebarNav = "live";
              currentPage = "home";
              fpMobileMenuOpen = false;
            }}
            title="Cazino Live"
          >
            <span class="fp-nav-ico">
              {#if catIconStyle === "svg"}{@render sidebarVectorIcon(
                  "live",
                )}{:else}🎡{/if}
            </span>
            <span class="fp-nav-lbl">Cazino Live</span>
          </button>
          <button
            type="button"
            class="fp-nav-item {activeSidebarNav === 'sport' ? 'active' : ''}"
            on:click={() => {
              activeSidebarNav = "sport";
              currentPage = "home";
              fpMobileMenuOpen = false;
            }}
            title="Sport"
          >
            <span class="fp-nav-ico">
              {#if catIconStyle === "svg"}{@render sidebarVectorIcon(
                  "sport",
                )}{:else}⚽{/if}
            </span>
            <span class="fp-nav-lbl">Sport</span>
          </button>
          <button
            type="button"
            class="fp-nav-item {activeSidebarNav === 'loto' ? 'active' : ''}"
            on:click={() => {
              activeSidebarNav = "loto";
              currentPage = "home";
              fpMobileMenuOpen = false;
            }}
            title="Loto"
          >
            <span class="fp-nav-ico">
              {#if catIconStyle === "svg"}{@render sidebarVectorIcon(
                  "loto",
                )}{:else}🎱{/if}
            </span>
            <span class="fp-nav-lbl">Loto</span>
          </button>
        </div>

        <!-- Nav Group 2 -->
        <div class="fp-nav-group">
          <button
            type="button"
            class="fp-nav-item {currentPage === 'vip' ? 'active' : ''}"
            on:click={() => {
              currentPage = "vip";
              fpMobileMenuOpen = false;
            }}
            title="VIP Club"
          >
            <span class="fp-nav-ico">
              {#if catIconStyle === "svg"}{@render sidebarVectorIcon(
                  "vip",
                )}{:else}👑{/if}
            </span>
            <span class="fp-nav-lbl">VIP Club</span>
            <span class="fp-badge-nou">NOU</span>
          </button>
          <button
            type="button"
            class="fp-nav-item {activeSidebarNav === 'rtp' ? 'active' : ''}"
            on:click={() => {
              activeSidebarNav = "rtp";
              currentPage = "home";
              fpMobileMenuOpen = false;
            }}
            title="Live RTP"
          >
            <span class="fp-nav-ico">
              {#if catIconStyle === "svg"}{@render sidebarVectorIcon(
                  "rtp",
                )}{:else}📈{/if}
            </span>
            <span class="fp-nav-lbl">Live RTP</span>
          </button>
          <button
            type="button"
            class="fp-nav-item {activeSidebarNav === 'turnee' ? 'active' : ''}"
            on:click={() => {
              activeSidebarNav = "turnee";
              currentPage = "home";
              fpMobileMenuOpen = false;
            }}
            title="Turnee"
          >
            <span class="fp-nav-ico">
              {#if catIconStyle === "svg"}{@render sidebarVectorIcon(
                  "turnee",
                )}{:else}🏆{/if}
            </span>
            <span class="fp-nav-lbl">Turnee</span>
          </button>
        </div>

        <!-- Nav Group 3 -->
        <div class="fp-nav-group">
          <button
            type="button"
            class="fp-nav-item"
            title="Asistență"
            on:click={() => (fpMobileMenuOpen = false)}
          >
            <span class="fp-nav-ico">
              {#if catIconStyle === "svg"}{@render sidebarVectorIcon(
                  "support",
                )}{:else}🎧{/if}
            </span>
            <span class="fp-nav-lbl">Asistență</span>
          </button>
        </div>

        <!-- Download App Card -->
        <div
          class="fp-app-card"
          style="background-image: linear-gradient(90deg, rgba(16,13,26,0.95) 45%, rgba(16,13,26,0.35) 100%), url('/figma/sidebar-app-banner.jpg');"
        >
          <div class="fp-app-card-title">Descarcă aplicația</div>
          <div class="fp-store-badges">
            <div class="fp-store-badge"> App Store</div>
            <div class="fp-store-badge">▶ Google Play</div>
          </div>
        </div>
      </aside>
    {/if}

    <!-- Main Content Column -->
    <main class="fp-main">
      {#if searchQuery.trim()}
        <section class="fp-section fp-search-results">
          <div class="fp-sec-head">
            <h2>
              Rezultate căutare: „{searchQuery}” ({filteredSearchGames.length})
            </h2>
            <button
              type="button"
              class="fp-link-btn"
              on:click={() => (searchQuery = "")}
            >
              Închide căutarea ✕
            </button>
          </div>
          {#if filteredSearchGames.length > 0}
            <div class="fp-search-grid">
              {#each filteredSearchGames as game}
                <button
                  type="button"
                  class="fp-game-card"
                  on:click={() => openGamePreview(game)}
                >
                  <img src={game.img} alt={game.n} loading="lazy" />
                  <div class="fp-game-overlay">
                    <span class="fp-game-name">{game.n}</span>
                    <span class="fp-game-prov">{game.p}</span>
                  </div>
                </button>
              {/each}
            </div>
          {:else}
            <div class="fp-empty-search">
              Niciun joc găsit pentru „{searchQuery}”.
            </div>
          {/if}
        </section>
      {/if}

      {#if currentPage === "vip"}
        <!-- ══════════ VIP CLUB SUB-VIEW ══════════ -->
        <section class="fp-vip-page">
          <div class="fp-vip-page-top">
            <div>
              <h1>VIP Club</h1>
              <p>
                Strângi puncte VIP din depuneri și misiuni. La fiecare nivel
                primești o recompensă, iar cashback-ul crește.
              </p>
            </div>
            <button
              type="button"
              class="fp-btn-back-home"
              on:click={() => (currentPage = "home")}
            >
              ← Înapoi la Homepage
            </button>
          </div>

          <!-- Active Progress Banner -->
          <div class="fp-vip-hero-status">
            <div class="fp-vip-hero-left">
              <img
                src="/starfish_vip_v.png"
                alt="Argint 1"
                class="fp-vip-hero-img"
              />
              <div>
                <div class="fp-vip-hero-tag">NIVELUL TĂU ACTUAL</div>
                <h2>Argint 1 • 8% Cashback Săptămânal</h2>
                <p>
                  Mai ai nevoie de <strong>180 puncte</strong> până la nivelul Aur
                  (250 RON Bonus Cash).
                </p>
              </div>
            </div>
            <div class="fp-vip-hero-meter">
              <div class="fp-vip-meter-labels">
                <span>Progres nivel</span>
                <strong>420 / 600 puncte (70%)</strong>
              </div>
              <div class="fp-vip-track lg">
                <div class="fp-vip-fill" style="width: 70%;"></div>
              </div>
            </div>
          </div>

          <div class="fp-vip-tiers-grid">
            {#each vipTiers as tier}
              <div class="fp-vip-tier-card {tier.status}">
                <div class="fp-vip-tier-head">
                  <img src={tier.img} alt={tier.name} />
                  <div>
                    <span class="fp-tier-range">{tier.range}</span>
                    <h3>{tier.name}</h3>
                    <span class="fp-tier-cashback">{tier.cashback}</span>
                  </div>
                </div>
                {#if tier.status === "active"}
                  <div class="fp-tier-progress-box">
                    <div class="fp-vip-track">
                      <div
                        class="fp-vip-fill"
                        style="width: {tier.percent}%;"
                      ></div>
                    </div>
                    <span>{tier.points}</span>
                  </div>
                {/if}
                <ul class="fp-tier-perks">
                  {#each tier.perks as perk}
                    <li>✓ {perk}</li>
                  {/each}
                </ul>
              </div>
            {/each}
          </div>
        </section>
      {:else}
        <!-- ══════════ HOMEPAGE VIEW ══════════ -->
        <!-- 1. Hero Section (Big + 2 Stacked Right) -->
        <section class="fp-hero-grid">
          <div
            class="fp-hero-main"
            style="background-image: linear-gradient(90deg, rgba(11,10,20,0.92) 0%, rgba(11,10,20,0.58) 45%, rgba(11,10,20,0.06) 100%), url('/figma/hero-main.jpg');"
          >
            {#if isLoggedIn}
              <span class="fp-hero-kicker gold">RECOMPENSE SPECIALE</span>
              <h1>Totul fără Rulaj,<br />Câștiguri Infinite!</h1>
              <p class="fp-hero-sub">
                Activează ofertele zilnice și urcă mai rapid în VIP Club.
              </p>
              <button
                type="button"
                class="fp-hero-cta"
                on:click={() => (currentPage = "vip")}
              >
                VEZI RECOMPENSELE
              </button>
            {:else}
              <span class="fp-hero-kicker">OFERTĂ DE BUN VENIT</span>
              <h1>500 Rotiri + 10.000<br />RON Bonus</h1>
              <form
                class="fp-hero-email-form"
                on:submit|preventDefault={() => (isLoggedIn = true)}
              >
                <input
                  type="email"
                  bind:value={emailPromo}
                  placeholder="E-mail"
                />
                <button type="submit">ÎNSCRIE-TE</button>
              </form>
            {/if}
          </div>

          <div class="fp-hero-side">
            <div
              class="fp-hero-mini"
              style="background-image: linear-gradient(90deg, rgba(14,12,24,0.92) 10%, rgba(14,12,24,0.18) 100%), url('/figma/hero-side-1.png');"
            >
              <span class="fp-mini-kicker">MEGA BONUS LA VALIDARE</span>
              <h3>500 Rotiri fără<br />depunere</h3>
            </div>
            <div
              class="fp-hero-mini"
              style="background-image: linear-gradient(90deg, rgba(14,12,24,0.92) 10%, rgba(14,12,24,0.18) 100%), url('/figma/hero-side-2.png');"
            >
              <span class="fp-mini-kicker">SĂPTĂMÂNAL</span>
              <h3>Cashback 15%</h3>
            </div>
          </div>
        </section>

        <!-- 2. Category Pills Row -->
        <section
          class="fp-pills-row {catBarStyle === 'figma-bar'
            ? 'is-figma-bar'
            : 'is-pills'} {catBarWidthMode === 'fit'
            ? 'is-fit'
            : 'is-full'} {!pillsCanScroll && catBarWidthMode === 'fit'
            ? 'no-overflow'
            : ''}"
        >
          <div
            class="fp-pills-scroll"
            bind:this={pillsScrollEl}
            use:observePillsOverflow
          >
            {#each categoryPills as pill}
              <button
                type="button"
                class="fp-pill {activePill === pill.id ? 'active' : ''}"
                on:click={() => (activePill = pill.id)}
              >
                {#if catIconStyle === "svg"}
                  <span class="fp-pill-svg"
                    >{@render catVectorIcon(pill.id)}</span
                  >
                {:else}
                  <span>{pill.icon}</span>
                {/if}
                <span>{pill.label}</span>
              </button>
            {/each}
          </div>
          {#if pillsCanScroll || catBarWidthMode === "full"}
            <div class="fp-arrows">
              <button
                type="button"
                class="fp-arrow-btn"
                aria-label="Înapoi"
                on:click={() => scrollPills(-1)}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><polyline points="15 18 9 12 15 6"></polyline></svg
                >
              </button>
              <button
                type="button"
                class="fp-arrow-btn"
                aria-label="Înainte"
                on:click={() => scrollPills(1)}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><polyline points="9 18 15 12 9 6"></polyline></svg
                >
              </button>
            </div>
          {/if}
        </section>

        <!-- 3. Hot Games Row -->
        <section class="fp-section">
          <div class="fp-sec-head">
            <h2><span class="fp-sec-ico">🔥</span> Hot</h2>
            <div class="fp-sec-actions">
              <button type="button" class="fp-link-btn">Vezi toate</button>
              <button type="button" class="fp-arrow-btn" aria-label="Înapoi">
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><polyline points="15 18 9 12 15 6"></polyline></svg
                >
              </button>
              <button type="button" class="fp-arrow-btn" aria-label="Înainte">
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><polyline points="9 18 15 12 9 6"></polyline></svg
                >
              </button>
            </div>
          </div>
          <div class="fp-games-row-10">
            {#each hotGames as game}
              <button
                type="button"
                class="fp-game-card"
                on:click={() => openGamePreview(game)}
              >
                <img src={game.img} alt={game.n} loading="lazy" />
                <div class="fp-game-overlay">
                  <span class="fp-game-name">{game.n}</span>
                  <span class="fp-game-prov">{game.p}</span>
                </div>
              </button>
            {/each}
          </div>
        </section>

        <!-- 4. Top 10 Pacanele 2026 -->
        <section class="fp-section">
          <div class="fp-sec-head">
            <h2>Top 10 Păcănele 2026</h2>
            <div class="fp-sec-actions">
              <button type="button" class="fp-arrow-btn" aria-label="Înapoi">
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><polyline points="15 18 9 12 15 6"></polyline></svg
                >
              </button>
              <button type="button" class="fp-arrow-btn" aria-label="Înainte">
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><polyline points="9 18 15 12 9 6"></polyline></svg
                >
              </button>
            </div>
          </div>
          <div class="fp-top10-row">
            {#each top10Games as game, idx}
              <button
                type="button"
                class="fp-top10-item"
                on:click={() => openGamePreview(game)}
              >
                <span class="fp-top10-num">{idx + 1}</span>
                <div class="fp-top10-poster">
                  <img src={game.img} alt={game.n} loading="lazy" />
                </div>
              </button>
            {/each}
          </div>
        </section>

        <!-- 5. Superslots -->
        <section class="fp-section">
          <div class="fp-sec-head">
            <h2><span class="fp-sec-ico">👑</span> Superslots</h2>
            <div class="fp-sec-actions">
              <button type="button" class="fp-link-btn">Vezi toate</button>
              <button type="button" class="fp-arrow-btn" aria-label="Înapoi">
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><polyline points="15 18 9 12 15 6"></polyline></svg
                >
              </button>
              <button type="button" class="fp-arrow-btn" aria-label="Înainte">
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><polyline points="9 18 15 12 9 6"></polyline></svg
                >
              </button>
            </div>
          </div>
          <div class="fp-games-row-10">
            {#each superslotGames as game}
              <button
                type="button"
                class="fp-game-card"
                on:click={() => openGamePreview(game)}
              >
                <img src={game.img} alt={game.n} loading="lazy" />
                <span class="fp-jackpot-play-tag">JACKPOT PLAY</span>
                <div class="fp-game-overlay">
                  <span class="fp-game-name">{game.n}</span>
                  <span class="fp-game-prov">{game.p}</span>
                </div>
              </button>
            {/each}
          </div>
        </section>

        <!-- 6. Jackpots (5 Provider Cards) -->
        <section class="fp-section">
          <div class="fp-sec-head">
            <h2><span class="fp-sec-ico">💎</span> Jackpots</h2>
            <div class="fp-sec-actions">
              <button type="button" class="fp-link-btn">Vezi toate</button>
              <button type="button" class="fp-arrow-btn" aria-label="Înapoi">
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><polyline points="15 18 9 12 15 6"></polyline></svg
                >
              </button>
              <button type="button" class="fp-arrow-btn" aria-label="Înainte">
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><polyline points="9 18 15 12 9 6"></polyline></svg
                >
              </button>
            </div>
          </div>
          <div class="fp-jackpots-grid">
            {#each jackpotCards as jp}
              <div class="fp-jp-card theme-{jp.theme}">
                <div class="fp-jp-head">
                  <img src={jp.logo} alt={jp.brand} class="fp-jp-logo" />
                  <div class="fp-jp-prov">{jp.provider}</div>
                </div>

                <div class="fp-jp-tier-box grand">
                  <div class="fp-jp-tier-left">
                    <span class="fp-jp-tier-label">Grand</span>
                    <strong>{jp.grand}</strong>
                  </div>
                  <span class="fp-jp-badge {jp.badgeTone}">{jp.badge}</span>
                </div>

                <div class="fp-jp-tier-box">
                  <span class="fp-jp-tier-label">Major</span>
                  <strong>{jp.major}</strong>
                </div>

                <div class="fp-jp-sub-row">
                  <div class="fp-jp-tier-box mini">
                    <span class="fp-jp-tier-label">Minor</span>
                    <strong>{jp.minor}</strong>
                  </div>
                  <div class="fp-jp-tier-box mini">
                    <span class="fp-jp-tier-label">Mini</span>
                    <strong>{jp.mini}</strong>
                  </div>
                </div>

                <div class="fp-jp-thumbs">
                  {#each jp.thumbs as thumb}
                    <img src={thumb.img} alt={thumb.n} loading="lazy" />
                  {/each}
                </div>

                <button type="button" class="fp-jp-btn">VEZI TOATE 267</button>
              </div>
            {/each}
          </div>
        </section>

        <!-- 7. Top Castigatori Ticker Strip -->
        <section class="fp-winners-strip">
          <div class="fp-winners-label">
            <span class="fp-live-dot"></span> TOP CÂȘTIGĂTORI
          </div>
          <div class="fp-winners-items">
            {#each winnersList as w}
              <div class="fp-winner-chip">
                <img src={w.img} alt={w.game} />
                <div>
                  <div class="fp-winner-line">
                    <strong>{w.user}</strong> a câștigat
                    <span class="fp-win-sum">{w.amount}</span>
                  </div>
                  <div class="fp-winner-game">la {w.game}</div>
                </div>
              </div>
            {/each}
          </div>
        </section>

        <!-- 8. Hourly Hot & Hourly Cold -->
        <section class="fp-rtp-grid">
          <!-- Hourly Hot -->
          <div class="fp-rtp-box">
            <div class="fp-rtp-head">
              <div>
                <div class="fp-rtp-title-row">
                  <h3>🔥 Hourly Hot</h3>
                  <button
                    type="button"
                    class="fp-info-dot"
                    on:mouseenter={() => (showHotTooltip = true)}
                    on:mouseleave={() => (showHotTooltip = false)}
                    on:click={() => (showHotTooltip = !showHotTooltip)}
                    aria-label="Informații Hourly Hot"
                  >
                    i
                  </button>
                  {#if showHotTooltip}
                    <div class="fp-rtp-tooltip">
                      Hourly Hot - prezintă în timp real topul jocurilor
                      ordonate în funcție de cel mai mare și cel mai mic RTP în
                      decurs de 1h, actualizat la fiecare 3 secunde.
                    </div>
                  {/if}
                </div>
                <span class="fp-rtp-sub">Din ultimele 24 de ore</span>
              </div>
              <button type="button" class="fp-link-btn gold">Vezi toate</button>
            </div>

            <div class="fp-rtp-list">
              {#each hourlyHot as item}
                <div class="fp-rtp-row hot">
                  <span class="fp-rtp-rank hot">{item.rank}</span>
                  <img src={item.img} alt={item.name} />
                  <div class="fp-rtp-meta">
                    <strong>{item.name}</strong>
                    <span>{item.provider}</span>
                  </div>
                  <div class="fp-rtp-val">
                    <span>RTP:</span> <strong>{item.rtp}</strong>
                  </div>
                  <button
                    type="button"
                    class="fp-rtp-play hot"
                    aria-label="Joacă"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"><path d="M8 5.5v13l10-6.5z" /></svg
                    >
                  </button>
                </div>
              {/each}
            </div>
          </div>

          <!-- Hourly Cold -->
          <div class="fp-rtp-box">
            <div class="fp-rtp-head">
              <div>
                <div class="fp-rtp-title-row">
                  <h3>❄️ Hourly Cold</h3>
                  <span class="fp-info-dot">i</span>
                </div>
                <span class="fp-rtp-sub">Din ultimele 24 de ore</span>
              </div>
              <button type="button" class="fp-link-btn gold">Vezi toate</button>
            </div>

            <div class="fp-rtp-list">
              {#each hourlyCold as item}
                <div class="fp-rtp-row cold">
                  <span class="fp-rtp-rank cold">{item.rank}</span>
                  <img src={item.img} alt={item.name} />
                  <div class="fp-rtp-meta">
                    <strong>{item.name}</strong>
                    <span>{item.provider}</span>
                  </div>
                  <div class="fp-rtp-val">
                    <span>RTP:</span> <strong>{item.rtp}</strong>
                  </div>
                  <button
                    type="button"
                    class="fp-rtp-play cold"
                    aria-label="Joacă"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"><path d="M8 5.5v13l10-6.5z" /></svg
                    >
                  </button>
                </div>
              {/each}
            </div>
          </div>
        </section>

        <!-- 9. Furnizori -->
        <section class="fp-section">
          <div class="fp-sec-head">
            <h2>Furnizori</h2>
            <div class="fp-sec-actions">
              <button type="button" class="fp-arrow-btn" aria-label="Înapoi">
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><polyline points="15 18 9 12 15 6"></polyline></svg
                >
              </button>
              <button type="button" class="fp-arrow-btn" aria-label="Înainte">
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><polyline points="9 18 15 12 9 6"></polyline></svg
                >
              </button>
            </div>
          </div>
          <div class="fp-providers-grid">
            {#each providers as prov}
              <button
                type="button"
                class="fp-provider-tile"
                style="--prov-color: {prov.accent};"
              >
                <span>{prov.name}</span>
              </button>
            {/each}
          </div>
        </section>

        <!-- 10. Jocul Saptamanii & Jocul Lunii -->
        <section class="fp-spotlight-grid">
          <div class="fp-spotlight-card">
            <div class="fp-spotlight-top">
              <div class="fp-spotlight-prov">
                <img src="/figma/prov-pateplay.png" alt="Pateplay" />
              </div>
              <div class="fp-spotlight-meta">
                <span>★ JOCUL SĂPTĂMÂNII</span>
                <h3>Fruits & Gold Dice</h3>
              </div>
              <button type="button" class="fp-spotlight-btn">JOACĂ ACUM</button>
            </div>
            <div
              class="fp-spotlight-art"
              style="background-image: url('/figma/spotlight-fruits.png');"
            ></div>
          </div>

          <div class="fp-spotlight-card">
            <div class="fp-spotlight-top">
              <div class="fp-spotlight-prov">
                <img src="/figma/prov-pragmatic.png" alt="Pragmatic Play" />
              </div>
              <div class="fp-spotlight-meta">
                <span>★ JOCUL LUNII</span>
                <h3>Big Bass Blast</h3>
              </div>
              <button type="button" class="fp-spotlight-btn">JOACĂ ACUM</button>
            </div>
            <div
              class="fp-spotlight-art"
              style="background-image: url('/figma/spotlight-bass.png');"
            ></div>
          </div>
        </section>

        <!-- 11. Teme Jocuri -->
        <section class="fp-section">
          <div class="fp-sec-head">
            <h2><span class="fp-sec-ico">🎭</span> Teme jocuri</h2>
            <div class="fp-sec-actions">
              <button type="button" class="fp-arrow-btn" aria-label="Înapoi">
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><polyline points="15 18 9 12 15 6"></polyline></svg
                >
              </button>
              <button type="button" class="fp-arrow-btn" aria-label="Înainte">
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  ><polyline points="9 18 15 12 9 6"></polyline></svg
                >
              </button>
            </div>
          </div>
          <div class="fp-themes-row">
            {#each themes as theme}
              <button
                type="button"
                class="fp-theme-card"
                style="background: {theme.bg};"
              >
                <img src={theme.img} alt={theme.name} loading="lazy" />
                <div class="fp-theme-foot">
                  <strong>{theme.name}</strong>
                  <span>{theme.count}</span>
                </div>
              </button>
            {/each}
          </div>
        </section>
      {/if}

      <!-- 12. USP Strip & Footer -->
      <section class="fp-usp-strip">
        <div class="fp-usp-item">
          <span class="fp-usp-ico">💳</span><span
            >Depuneri și retrageri rapide</span
          >
        </div>
        <div class="fp-usp-item">
          <span class="fp-usp-ico">🎁</span><span
            >Promoții și turnee în fiecare săptămână</span
          >
        </div>
        <div class="fp-usp-item">
          <span class="fp-usp-ico">👤</span><span
            >Cazino Live cu dealeri reali</span
          >
        </div>
        <div class="fp-usp-item">
          <span class="fp-usp-ico">🎰</span><span
            >2.400+ de jocuri de la furnizori licențiați</span
          >
        </div>
      </section>

      <footer class="fp-footer">
        <div class="fp-footer-cols">
          <div>
            <h4>Meniu</h4>
            <div class="fp-footer-links">
              <a href="#figma">Contact</a>
              <a href="#figma">Despre Noi</a>
              <a href="#figma">Politica de confidențialitate</a>
              <a href="#figma">Joc responsabil</a>
              <a href="#figma">Termeni și Condiții</a>
              <a href="#figma">Întrebări frecvente</a>
              <a href="#figma">Casierie</a>
              <a href="#figma">Regulament pariuri</a>
            </div>
          </div>
          <div>
            <h4>Info</h4>
            <p class="fp-footer-legal">
              Site-ul și aplicația CashPot, parte din WinVia Entertainment
              Group, este deținut și operat de către Crowd Entertainment
              Limited. Licența nr. L1213823W001269 emisă de ONJN, valabilă până
              la 28.02.2031 și autorizația de exploatare obținută prin Decizia
              nr. 312 din 10.04.2025.
            </p>
            <p class="fp-footer-legal">
              (18+) Jocurile de noroc pot crea dependență, vă rugăm să jucați în
              mod responsabil.
            </p>
          </div>
          <div class="fp-footer-apps">
            <div class="fp-app-btn">
               Descoperă-o în <strong>App Store</strong>
            </div>
            <div class="fp-app-btn">
              ▶ Descarcă de pe <strong>Google Play</strong>
            </div>
            <div class="fp-app-btn">
              🛍️ Explorează în <strong>AppGallery</strong>
            </div>
          </div>
        </div>
      </footer>
    </main>
  </div>

  <!-- ═══════════════ VERTICAL VIP PROGRESS BAR (BOTTOM-RIGHT) ═══════════════ -->
  {#if isLoggedIn && vipBarOrientation === "vertical-br"}
    <div class="fp-vip-vert-dock {vipVertFlyoutOpen ? 'is-open' : ''}">
      <div class="fp-vip-vert-flyout">
        <div class="fp-vip-vert-fly-head">
          <span class="fp-vip-vert-fly-tier">Argint 1</span>
          <span class="fp-vip-vert-fly-xp"><strong>420</strong> / 600 XP</span>
        </div>
        <p class="fp-vip-vert-fly-sub">Mai ai 180 XP până la Argint 2</p>
        <button
          type="button"
          class="fp-vip-vert-fly-btn"
          on:click={() => {
            currentPage = currentPage === "vip" ? "home" : "vip";
            vipVertFlyoutOpen = false;
          }}
        >
          {currentPage === "vip" ? "← Înapoi la Jocuri" : "VIP Club ›"}
        </button>
      </div>

      <button
        type="button"
        class="fp-vip-vert-pill {currentPage === 'vip' ? 'is-active' : ''}"
        aria-label="Progres VIP Club: Argint 1, 70%"
        aria-expanded={vipVertFlyoutOpen}
        on:click={() => (vipVertFlyoutOpen = !vipVertFlyoutOpen)}
      >
        {@render vipShieldIcon("fpSilverVert", 30)}

        <div class="fp-vip-vert-track">
          <span class="fp-vip-vert-tick" style="bottom: 25%;"></span>
          <span class="fp-vip-vert-tick" style="bottom: 50%;"></span>
          <span class="fp-vip-vert-tick" style="bottom: 75%;"></span>
          <div class="fp-vip-vert-fill" style="height: 70%;"></div>
        </div>

        <div class="fp-vip-vert-meta">
          <span class="fp-vip-vert-pct">70%</span>
          <span class="fp-vip-vert-lbl">VIP</span>
        </div>
      </button>
    </div>
  {/if}

  <!-- ═══════════════ MOBILE BOTTOM NAV BAR ═══════════════ -->
  <nav
    class="fp-mobile-bottom-nav {fpMobileBarsHidden ? 'is-hidden' : ''}"
    aria-label="Navigare mobil"
  >
    <div class="fp-mnav-side">
      <button
        type="button"
        class="fp-mnav-item {activeSidebarNav === 'slots' &&
        currentPage === 'home'
          ? 'active'
          : ''}"
        on:click={() => {
          activeSidebarNav = "slots";
          currentPage = "home";
          fpMobileMenuOpen = false;
        }}
      >
        <span class="fp-mnav-ico">{@render sidebarVectorIcon("slots")}</span>
        <span>SLOTS</span>
      </button>

      <button
        type="button"
        class="fp-mnav-item {activeSidebarNav === 'arena' &&
        currentPage === 'home'
          ? 'active'
          : ''}"
        on:click={() => {
          activeSidebarNav = "arena";
          currentPage = "home";
          fpMobileMenuOpen = false;
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="6" width="20" height="12" rx="3" />
          <circle cx="8" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="16" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <path d="M12 12v.01" />
        </svg>
        <span>ARENA</span>
      </button>
    </div>

    <button
      type="button"
      class="fp-mnav-center"
      aria-label="Acasă Cashpot"
      on:click={() => {
        activeSidebarNav = "slots";
        currentPage = "home";
        fpMobileMenuOpen = false;
      }}
    >
      <img
        src="/figma/logo-mark-spade.png"
        alt="CashPot"
        class="fp-mnav-spade-img"
      />
    </button>

    <div class="fp-mnav-side">
      <button
        type="button"
        class="fp-mnav-item {currentPage === 'vip' ? 'active' : ''}"
        on:click={() => { currentPage = "vip"; fpMobileMenuOpen = false; }}
      >
        <span class="fp-mnav-ico">{@render sidebarVectorIcon("vip")}</span>
        <span>VIP CLUB</span>
      </button>

      <button
        type="button"
        class="fp-mnav-item {fpMobileMenuOpen ? 'active' : ''}"
        on:click={() => {
          fpMobileMenuOpen = !fpMobileMenuOpen;
          fpMobileBarsHidden = false;
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
        <span>MENIU</span>
      </button>
    </div>
  </nav>

  <!-- ═══════════════ FLOATING PREVIEW CONFIGURATOR ═══════════════ -->
  {#if showConfigurator}
    <div
      class="fp-floating-dock {showControls ? 'open' : 'minimized'}"
      class:bars-hidden={fpMobileBarsHidden}
    >
      <div class="fp-dock-head">
        <span>🧪 Comparator Figma (Localhost)</span>
        <button
          type="button"
          class="fp-dock-toggle"
          on:click={() => (showControls = !showControls)}
        >
          {showControls ? "−" : "+"}
        </button>
      </div>

      {#if showControls}
        <div class="fp-dock-body">
          <div class="fp-dock-group">
            <span class="fp-dock-label">Stare utilizator</span>
            <div class="fp-dock-btns">
              <button
                type="button"
                class:active={isLoggedIn}
                on:click={() => (isLoggedIn = true)}>Logat</button
              >
              <button
                type="button"
                class:active={!isLoggedIn}
                on:click={() => (isLoggedIn = false)}>Pre-login</button
              >
            </div>
          </div>

          <div class="fp-dock-group">
            <span class="fp-dock-label">Sidebar Stânga</span>
            <div class="fp-dock-btns">
              <button
                type="button"
                class:active={sidebarMode === "full"}
                on:click={() => (sidebarMode = "full")}>Complet</button
              >
              <button
                type="button"
                class:active={sidebarMode === "mini"}
                on:click={() => (sidebarMode = "mini")}>Mini (Iconițe)</button
              >
              <button
                type="button"
                class:active={sidebarMode === "hidden"}
                on:click={() => (sidebarMode = "hidden")}>Ascuns</button
              >
            </div>
          </div>

          <div class="fp-dock-group">
            <span class="fp-dock-label">Lățime bară căutare</span>
            <div class="fp-dock-slider-wrap">
              <div class="fp-dock-slider-head">
                <span>Lățime: <strong>{searchWidth}px</strong></span>
                <div class="fp-dock-mini-presets">
                  <button
                    type="button"
                    class:active={searchWidth === 220}
                    on:click={() => (searchWidth = 220)}>220</button
                  >
                  <button
                    type="button"
                    class:active={searchWidth === 340}
                    on:click={() => (searchWidth = 340)}>340</button
                  >
                  <button
                    type="button"
                    class:active={searchWidth === 560}
                    on:click={() => (searchWidth = 560)}>560</button
                  >
                  <button
                    type="button"
                    class:active={searchWidth === 800}
                    on:click={() => (searchWidth = 800)}>800</button
                  >
                </div>
              </div>
              <input
                type="range"
                min="180"
                max="900"
                step="1"
                bind:value={searchWidth}
                class="fp-dock-slider"
              />
            </div>
          </div>

          <div class="fp-dock-group">
            <span class="fp-dock-label">Poziție VIP Progress</span>
            <div class="fp-dock-btns">
              <button
                type="button"
                class:active={vipBarOrientation === "vertical-br"}
                on:click={() => (vipBarOrientation = "vertical-br")}
                >Vertical Dreapta-Jos</button
              >
              <button
                type="button"
                class:active={vipBarOrientation === "horizontal"}
                on:click={() => (vipBarOrientation = "horizontal")}
                >Orizontal</button
              >
              <button
                type="button"
                class:active={vipPlacement === "header"}
                on:click={() => (vipPlacement = "header")}>În Header</button
              >
              <button
                type="button"
                class:active={vipPlacement === "sidebar"}
                on:click={() => (vipPlacement = "sidebar")}>În Sidebar</button
              >
              <button
                type="button"
                class:active={vipPlacement === "both"}
                on:click={() => (vipPlacement = "both")}>Ambele</button
              >
            </div>
          </div>

          {#if isLoggedIn && (vipPlacement === "header" || vipPlacement === "both")}
            <div class="fp-dock-group">
              <span class="fp-dock-label">Zonă VIP & Balanță în Header</span>
              <div class="fp-dock-btns">
                <button
                  type="button"
                  class:active={headerVipMode === "free"}
                  on:click={() => (headerVipMode = "free")}
                  >Liber (Slider)</button
                >
                <button
                  type="button"
                  class:active={headerVipMode === "right-clean"}
                  on:click={() => (headerVipMode = "right-clean")}
                  >Fără 🎁/Avatar</button
                >
                <button
                  type="button"
                  class:active={headerVipMode === "merged-with-icons"}
                  on:click={() => (headerVipMode = "merged-with-icons")}
                  >Unificat + Balanță</button
                >
                <button
                  type="button"
                  class:active={headerVipMode === "merged-replace"}
                  on:click={() => (headerVipMode = "merged-replace")}
                  >Înlocuiește tot</button
                >
              </div>

              {#if headerVipMode === "free"}
                <div class="fp-dock-slider-wrap">
                  <div class="fp-dock-slider-head">
                    <span
                      >Mută spre dreapta: <strong>{vipRightOffset}%</strong
                      ></span
                    >
                    <div class="fp-dock-mini-presets">
                      <button
                        type="button"
                        class:active={vipRightOffset === 0}
                        on:click={() => (vipRightOffset = 0)}>0%</button
                      >
                      <button
                        type="button"
                        class:active={vipRightOffset === 50}
                        on:click={() => (vipRightOffset = 50)}>50%</button
                      >
                      <button
                        type="button"
                        class:active={vipRightOffset === 100}
                        on:click={() => (vipRightOffset = 100)}>100%</button
                      >
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    bind:value={vipRightOffset}
                    class="fp-dock-slider"
                  />
                </div>
              {/if}
            </div>
          {/if}

          <div class="fp-dock-group">
            <span class="fp-dock-label">Stil VIP Bar & Pagină</span>
            <div class="fp-dock-btns">
              <button
                type="button"
                class:active={vipShape === "card"}
                on:click={() => (vipShape = "card")}>Card</button
              >
              <button
                type="button"
                class:active={vipShape === "pill"}
                on:click={() => (vipShape = "pill")}>Capsulă</button
              >
              <button
                type="button"
                class:active={vipFillColor === "gold"}
                on:click={() => (vipFillColor = "gold")}>Bară Galbenă</button
              >
              <button
                type="button"
                class:active={vipFillColor === "green"}
                on:click={() => (vipFillColor = "green")}>Bară Verde</button
              >
              <button
                type="button"
                class:active={currentPage === "home"}
                on:click={() => (currentPage = "home")}>Homepage</button
              >
              <button
                type="button"
                class:active={currentPage === "vip"}
                on:click={() => (currentPage = "vip")}>VIP Club</button
              >
            </div>
          </div>

          {#if currentPage === "home"}
            <div class="fp-dock-group">
              <span class="fp-dock-label">Bară Categorii</span>
              <div class="fp-dock-btns">
                <button
                  type="button"
                  class:active={catBarWidthMode === "fit"}
                  on:click={() => (catBarWidthMode = "fit")}
                  >Centrat (Fit)</button
                >
                <button
                  type="button"
                  class:active={catBarWidthMode === "full"}
                  on:click={() => (catBarWidthMode = "full")}
                  >100% Lățime</button
                >
                <button
                  type="button"
                  class:active={catBarStyle === "figma-bar"}
                  on:click={() => (catBarStyle = "figma-bar")}
                  >Bară Unică (Figma)</button
                >
                <button
                  type="button"
                  class:active={catBarStyle === "pills"}
                  on:click={() => (catBarStyle = "pills")}>Capsule (Noi)</button
                >
                <button
                  type="button"
                  class:active={catIconStyle === "svg"}
                  on:click={() => (catIconStyle = "svg")}>Iconițe SVG</button
                >
                <button
                  type="button"
                  class:active={catIconStyle === "emoji"}
                  on:click={() => (catIconStyle = "emoji")}>Emoji</button
                >
              </div>
            </div>
          {/if}

          <div class="fp-dock-save-row">
            <button
              type="button"
              class="fp-btn-save-cfg {saveStatus === 'saved' ? 'is-saved' : ''}"
              on:click={saveFigmaConfig}
            >
              {saveStatus === "saved"
                ? "✓ Salvat!"
                : saveStatus === "saving"
                  ? "Se salvează..."
                  : "💾 Salvează setările"}
            </button>
            <button
              type="button"
              class="fp-btn-reset-cfg"
              on:click={resetFigmaConfig}
              title="Resetează la valorile implicite"
            >
              ↺ Reset
            </button>
          </div>

          <a href="/" class="fp-back-actual">← Înapoi la site-ul actual</a>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .fp-shell {
    min-height: 100vh;
    background: #0c0912;
    color: #f8fafc;
    font-family:
      "Barlow",
      -apple-system,
      BlinkMacSystemFont,
      sans-serif;
    padding-bottom: 48px;
  }

  /* ─── Header ─── */
  .fp-header {
    height: 64px;
    margin: 12px 16px 0;
    padding: 0 20px;
    background: #161320;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    position: sticky;
    top: 12px;
    z-index: 90;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  }

  .fp-header-left {
    width: 204px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .fp-header-left.is-compact {
    width: auto;
  }

  .fp-sidebar-toggle-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: #211d2e;
    color: #cbd5e1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .fp-sidebar-toggle-btn:hover,
  .fp-sidebar-toggle-btn.is-collapsed {
    border-color: rgba(234, 185, 73, 0.55);
    color: #eab949;
  }

  .fp-logo-btn {
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .fp-logo-img {
    height: 30px;
    width: auto;
    object-fit: contain;
  }

  .fp-header-center {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .fp-header-spacer {
    min-width: 0;
  }

  /* Shrunken Search Bar */
  .fp-search {
    max-width: 100%;
    min-width: 160px;
    height: 40px;
    border-radius: 999px;
    background: #211d2e;
    border: 1px solid rgba(255, 255, 255, 0.09);
    padding: 0 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
    flex-shrink: 1;
  }

  .fp-search:focus-within {
    border-color: rgba(234, 185, 73, 0.6);
    box-shadow: 0 0 0 3px rgba(234, 185, 73, 0.12);
  }

  .fp-search-icon {
    color: #94a3b8;
    flex-shrink: 0;
  }

  .fp-search input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    outline: none;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
  }

  .fp-search input::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }

  .fp-search-clear {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #e2e8f0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    font-size: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* Header VIP Club Progress Bar right after Search */
  .fp-vip-bar {
    height: 40px;
    width: 252px;
    flex-shrink: 0;
    padding: 4px 12px 4px 8px;
    background: linear-gradient(135deg, #201a31 0%, #161221 100%);
    border: 1px solid rgba(167, 139, 250, 0.26);
    display: flex;
    align-items: center;
    gap: 9px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    font-family: inherit;
  }

  .fp-vip-bar.is-card {
    border-radius: 11px;
  }

  .fp-vip-bar.is-pill {
    border-radius: 999px;
    padding-left: 7px;
    padding-right: 14px;
  }

  .fp-vip-bar:hover,
  .fp-vip-bar.is-active {
    border-color: rgba(167, 139, 250, 0.65);
    background: linear-gradient(135deg, #2a2142 0%, #1b1629 100%);
    box-shadow: 0 4px 16px rgba(109, 40, 217, 0.25);
  }

  .fp-vip-emblem {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .fp-vip-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .fp-vip-row-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    line-height: 1;
  }

  .fp-vip-level-name {
    font-size: 12px;
    font-weight: 800;
    color: #fff;
    white-space: nowrap;
  }

  .fp-vip-link {
    font-size: 11px;
    font-weight: 700;
    color: #a78bfa;
    white-space: nowrap;
  }

  .fp-vip-row-bottom {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .fp-vip-track {
    flex: 1;
    height: 5px;
    background: rgba(255, 255, 255, 0.11);
    border-radius: 99px;
    overflow: hidden;
  }

  .fp-vip-track.lg {
    height: 8px;
  }

  .fp-vip-fill {
    height: 100%;
    border-radius: 99px;
    background: var(--vip-fill-bg, linear-gradient(90deg, #d89e28, #f3c65f));
    box-shadow: 0 0 8px var(--vip-fill-glow, rgba(243, 198, 95, 0.45));
  }

  .fp-vip-score {
    font-size: 10.5px;
    color: rgba(255, 255, 255, 0.55);
    white-space: nowrap;
    line-height: 1;
  }

  .fp-vip-score strong {
    color: #fff;
    font-weight: 800;
  }

  /* Header Right */
  .fp-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .fp-icon-badge-btn,
  .fp-avatar-btn {
    position: relative;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #211d2e;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }

  .fp-avatar-btn {
    border: 1.5px solid #eab949;
    overflow: visible;
  }

  .fp-avatar-btn img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .fp-gift-img {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }

  .fp-notif-dot {
    position: absolute;
    top: -3px;
    right: -3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ef4444;
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #161320;
  }

  .fp-balance-pill {
    height: 40px;
    background: #211d2e;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 999px;
    padding: 4px 14px 4px 5px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .fp-balance-plus {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, #f3c65f, #d89e28);
    color: #151000;
    font-size: 18px;
    font-weight: 900;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .fp-balance-amount {
    font-size: 13px;
    font-weight: 800;
    color: #fff;
    white-space: nowrap;
  }

  .fp-btn-login {
    height: 38px;
    padding: 0 20px;
    border-radius: 999px;
    background: #211d2e;
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.4px;
    cursor: pointer;
  }

  .fp-btn-register {
    height: 38px;
    padding: 0 20px;
    border-radius: 999px;
    border: none;
    background: linear-gradient(135deg, #eab949, #d89e28);
    color: #161100;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.4px;
    cursor: pointer;
  }

  /* Unified VIP + Balance Capsule */
  .fp-merged-wallet {
    height: 44px;
    padding: 4px 6px 4px 8px;
    background: linear-gradient(135deg, #211b34 0%, #161222 100%);
    border: 1px solid rgba(167, 139, 250, 0.3);
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.2s ease;
  }

  .fp-merged-wallet.is-pill {
    border-radius: 999px;
  }

  .fp-merged-wallet.is-card {
    border-radius: 14px;
  }

  .fp-merged-wallet:hover {
    border-color: rgba(167, 139, 250, 0.65);
    box-shadow: 0 4px 18px rgba(109, 40, 217, 0.22);
  }

  .fp-merged-avatar {
    position: relative;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1.5px solid #eab949;
    flex-shrink: 0;
  }

  .fp-merged-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    display: block;
  }

  .fp-merged-lvl {
    position: absolute;
    bottom: -3px;
    right: -4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #eab949;
    color: #161000;
    border: 2px solid #161222;
    font-size: 9px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .fp-merged-vip-zone {
    width: 195px;
    min-width: 0;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .fp-merged-divider {
    width: 1px;
    height: 24px;
    background: rgba(255, 255, 255, 0.12);
    flex-shrink: 0;
  }

  .fp-merged-bal-zone {
    display: flex;
    align-items: center;
    gap: 9px;
    flex-shrink: 0;
  }

  .fp-merged-bal-text {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    line-height: 1.1;
  }

  .fp-merged-bal-lbl {
    font-size: 9.5px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.52);
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .fp-merged-bal-text strong {
    font-size: 13px;
    font-weight: 800;
    color: #fff;
    white-space: nowrap;
  }

  /* ─── Body Layout ─── */
  .fp-body {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 16px;
    padding: 16px;
    align-items: start;
  }

  .fp-body.mode-hidden {
    grid-template-columns: minmax(0, 1fr);
  }

  .fp-body.mode-mini {
    grid-template-columns: 64px minmax(0, 1fr);
  }

  /* ─── Sidebar ─── */
  .fp-sidebar {
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: sticky;
    top: 90px;
  }

  .fp-sidebar.is-mini .fp-quick-tiles {
    grid-template-columns: 1fr;
  }

  .fp-sidebar.is-mini .fp-quick-tile {
    height: 50px;
    justify-content: center;
    padding: 6px;
  }

  .fp-sidebar.is-mini .fp-qt-title,
  .fp-sidebar.is-mini .fp-nav-lbl,
  .fp-sidebar.is-mini .fp-badge-nou,
  .fp-sidebar.is-mini .fp-sidebar-vip-card,
  .fp-sidebar.is-mini .fp-app-card {
    display: none;
  }

  .fp-sidebar.is-mini .fp-nav-item {
    justify-content: center;
    padding: 0;
    width: 44px;
    height: 44px;
    margin: 0 auto;
  }

  .fp-sidebar.is-mini .fp-btn-deposit {
    width: 44px;
    height: 44px;
    margin: 0 auto;
    font-size: 20px;
  }

  .fp-quick-tiles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .fp-quick-tile {
    height: 82px;
    border-radius: 16px;
    border: 1px solid rgba(96, 165, 250, 0.25);
    background: linear-gradient(180deg, #0c4a8f 0%, #062854 100%);
    padding: 8px 4px 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    color: #fff;
    cursor: pointer;
    font-family: inherit;
    transition: transform 0.18s;
  }

  .fp-quick-tile:hover {
    transform: translateY(-2px);
  }

  .fp-qt-title {
    font-size: 10px;
    font-weight: 700;
    line-height: 1.1;
    text-align: center;
  }

  .fp-quick-tile img {
    width: 34px;
    height: 34px;
    object-fit: contain;
  }

  .fp-sidebar-vip-card {
    padding: 10px 12px;
    border-radius: 18px;
    background: #171421;
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
  }

  .fp-btn-deposit {
    height: 40px;
    border-radius: 999px;
    border: none;
    background: linear-gradient(135deg, #f3c65f, #d89e28);
    color: #161000;
    font-size: 12.5px;
    font-weight: 900;
    letter-spacing: 0.5px;
    cursor: pointer;
  }

  .fp-nav-group {
    background: #161320;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .fp-nav-item {
    height: 36px;
    padding: 0 14px;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.72);
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition:
      background 0.15s,
      color 0.15s;
  }

  .fp-nav-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }

  .fp-nav-item.active {
    background: rgba(255, 255, 255, 0.09);
    color: #fff;
    font-weight: 700;
  }

  .fp-nav-ico {
    width: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #9f95c4;
    font-size: 12px;
    font-weight: 800;
    transition: color 0.15s;
    flex-shrink: 0;
  }

  .fp-nav-item:hover .fp-nav-ico,
  .fp-nav-item.active .fp-nav-ico {
    color: #c4b5fd;
  }

  .fp-badge-nou {
    margin-left: auto;
    padding: 2px 7px;
    border-radius: 999px;
    background: #ef4444;
    color: #fff;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.4px;
  }

  .fp-app-card {
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 12px;
    background-size: cover;
    background-position: center;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .fp-app-card-title {
    font-size: 11px;
    font-weight: 700;
    color: #fff;
  }

  .fp-store-badges {
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 110px;
  }

  .fp-store-badge {
    background: rgba(0, 0, 0, 0.78);
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
  }

  /* ─── Main Content ─── */
  .fp-main {
    display: flex;
    flex-direction: column;
    gap: 22px;
    min-width: 0;
  }

  /* Hero */
  .fp-hero-grid {
    display: grid;
    grid-template-columns: 1fr 310px;
    gap: 12px;
  }

  .fp-hero-main {
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background-size: cover;
    background-position: center;
    padding: 32px 36px;
    min-height: 220px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
  }

  .fp-hero-kicker {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.8px;
    color: rgba(255, 255, 255, 0.7);
  }

  .fp-hero-kicker.gold {
    color: #eab949;
  }

  .fp-hero-main h1 {
    margin: 0;
    font-size: 32px;
    line-height: 1.12;
    font-weight: 900;
    color: #fff;
  }

  .fp-hero-sub {
    margin: 0;
    font-size: 13.5px;
    color: rgba(255, 255, 255, 0.78);
  }

  .fp-hero-cta {
    align-self: flex-start;
    margin-top: 6px;
    padding: 11px 24px;
    border-radius: 999px;
    border: none;
    background: linear-gradient(135deg, #eab949, #d89e28);
    color: #161000;
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
  }

  .fp-hero-email-form {
    margin-top: 6px;
    width: 340px;
    max-width: 100%;
    height: 44px;
    background: #fff;
    border-radius: 999px;
    padding: 4px 4px 4px 10px;
    display: flex;
    align-items: center;
  }

  .fp-hero-email-form input {
    flex: 1;
    border: none;
    outline: none;
    padding: 0 12px;
    font-size: 13px;
    color: #0f172a;
    background: transparent;
  }

  .fp-hero-email-form button {
    height: 36px;
    padding: 0 20px;
    border-radius: 999px;
    border: none;
    background: #eab949;
    color: #161000;
    font-size: 11.5px;
    font-weight: 900;
    cursor: pointer;
  }

  .fp-hero-side {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .fp-hero-mini {
    flex: 1;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background-size: cover;
    background-position: center;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
  }

  .fp-mini-kicker {
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.7px;
    color: rgba(255, 255, 255, 0.65);
  }

  .fp-hero-mini h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
    line-height: 1.2;
    color: #fff;
  }

  /* Category Pills & Unified Figma Bar */
  .fp-pills-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .fp-pills-row.is-fit {
    align-self: center;
    width: fit-content;
    max-width: 100%;
    margin: 0 auto;
  }

  .fp-pills-scroll {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .fp-pills-row.is-fit .fp-pills-scroll {
    flex: 0 1 auto;
    min-width: 0;
  }

  .fp-pills-scroll::-webkit-scrollbar {
    display: none;
  }

  .fp-pill {
    height: 34px;
    padding: 0 13px;
    border-radius: 999px;
    background: #171421;
    border: 1px solid rgba(255, 255, 255, 0.07);
    color: rgba(255, 255, 255, 0.78);
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.18s ease;
  }

  .fp-pill.active,
  .fp-pill:hover {
    background: #252036;
    border-color: rgba(255, 255, 255, 0.22);
    color: #fff;
  }

  .fp-pill-svg {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #9f95c4;
    transition: color 0.18s ease;
    flex-shrink: 0;
  }

  .fp-pill:hover .fp-pill-svg,
  .fp-pill.active .fp-pill-svg {
    color: #c4b5fd;
  }

  /* Unified Single Pill Bar (Figma layout) */
  .fp-pills-row.is-figma-bar {
    height: 50px;
    padding: 0 8px 0 20px;
    border-radius: 999px;
    background: #171422;
    border: 1px solid rgba(255, 255, 255, 0.06);
    gap: 0;
    position: relative;
  }

  .fp-pills-row.is-figma-bar .fp-pills-scroll {
    gap: 24px;
    padding-right: 28px;
  }

  .fp-pills-row.is-figma-bar.is-fit.no-overflow {
    padding: 0 22px;
  }

  .fp-pills-row.is-figma-bar.is-fit.no-overflow .fp-pills-scroll {
    padding-right: 0;
  }

  .fp-pills-row.is-figma-bar .fp-pill {
    height: 36px;
    padding: 0 4px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.82);
    font-size: 12.5px;
    font-weight: 600;
    gap: 8px;
  }

  .fp-pills-row.is-figma-bar .fp-pill:hover,
  .fp-pills-row.is-figma-bar .fp-pill.active {
    background: transparent;
    border: none;
    color: #ffffff;
  }

  .fp-pills-row.is-figma-bar .fp-arrows {
    position: relative;
    z-index: 2;
    margin-left: -20px;
    padding-left: 20px;
    background: linear-gradient(90deg, rgba(23, 20, 34, 0) 0%, #171422 32%);
  }

  .fp-pills-row.is-figma-bar .fp-arrow-btn {
    width: 34px;
    height: 34px;
    background: #241f34;
    border-color: rgba(255, 255, 255, 0.08);
  }

  .fp-arrows,
  .fp-sec-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .fp-arrow-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: 50%;
    background: #1e192c;
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #e2e8f0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .fp-arrow-btn:hover {
    background: #2c2541;
    border-color: rgba(234, 185, 73, 0.55);
    color: #facc15;
    transform: translateY(-1px);
  }

  /* Section Headings */
  .fp-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .fp-sec-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .fp-sec-head h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 7px;
    color: #fff;
  }

  .fp-sec-ico {
    font-size: 15px;
  }

  .fp-link-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.65);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    margin-right: 4px;
    font-family: inherit;
  }

  .fp-link-btn.gold {
    color: #eab949;
  }

  /* 10-column Game Row */
  .fp-games-row-10 {
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    gap: 10px;
  }

  .fp-search-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
    gap: 12px;
  }

  .fp-game-card {
    position: relative;
    aspect-ratio: 3 / 4;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: #181424;
    padding: 0;
    cursor: pointer;
    transition:
      transform 0.2s,
      border-color 0.2s;
  }

  .fp-game-card:hover {
    transform: translateY(-4px);
    border-color: rgba(234, 185, 73, 0.6);
  }

  .fp-game-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .fp-jackpot-play-tag {
    position: absolute;
    bottom: 6px;
    right: 6px;
    padding: 2px 7px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(250, 204, 21, 0.5);
    color: #facc15;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 0.3px;
  }

  .fp-game-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(10, 8, 18, 0.94) 5%,
      transparent 65%
    );
    opacity: 0;
    transition: opacity 0.2s;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 8px;
    text-align: left;
  }

  .fp-game-card:hover .fp-game-overlay {
    opacity: 1;
  }

  .fp-game-name {
    font-size: 11px;
    font-weight: 800;
    color: #fff;
    line-height: 1.15;
  }

  .fp-game-prov {
    font-size: 9.5px;
    color: #cbd5e1;
  }

  .fp-empty-search {
    padding: 24px;
    border-radius: 12px;
    background: #161320;
    color: #94a3b8;
    font-size: 14px;
  }

  /* Top 10 Ranked Row */
  .fp-top10-row {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 14px;
  }

  .fp-top10-item {
    position: relative;
    display: flex;
    align-items: flex-end;
    background: transparent;
    border: none;
    padding: 0 0 0 32px;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .fp-top10-item:hover {
    transform: translateY(-4px);
  }

  .fp-top10-num {
    position: absolute;
    left: 0;
    bottom: -10px;
    font-size: 92px;
    line-height: 0.85;
    font-weight: 900;
    color: #0c0912;
    -webkit-text-stroke: 2px rgba(255, 255, 255, 0.32);
    user-select: none;
    z-index: 1;
  }

  .fp-top10-poster {
    position: relative;
    z-index: 2;
    width: 100%;
    aspect-ratio: 3 / 4;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: -8px 8px 20px rgba(0, 0, 0, 0.65);
  }

  .fp-top10-poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Jackpots 5 Cards */
  .fp-jackpots-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
  }

  .fp-jp-card {
    border-radius: 14px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .fp-jp-card.theme-purple {
    background: linear-gradient(180deg, #3b175c 0%, #190d28 100%);
  }
  .fp-jp-card.theme-green {
    background: linear-gradient(180deg, #114732 0%, #091e17 100%);
  }
  .fp-jp-card.theme-blue {
    background: linear-gradient(180deg, #103968 0%, #0a172e 100%);
  }
  .fp-jp-card.theme-crimson {
    background: linear-gradient(180deg, #5e1326 0%, #220a14 100%);
  }
  .fp-jp-card.theme-bronze {
    background: linear-gradient(180deg, #512b17 0%, #1e110c 100%);
  }

  .fp-jp-head {
    text-align: center;
    padding: 4px 0 2px;
  }

  .fp-jp-logo {
    height: 34px;
    max-width: 140px;
    width: auto;
    object-fit: contain;
    display: block;
    margin: 0 auto 2px;
  }

  .fp-jp-prov {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
  }

  .fp-jp-tier-box {
    background: rgba(0, 0, 0, 0.34);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 6px 9px;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .fp-jp-tier-box.grand {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .fp-jp-tier-left {
    display: flex;
    flex-direction: column;
  }

  .fp-jp-tier-label {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.65);
  }

  .fp-jp-tier-box strong {
    font-size: 12.5px;
    font-weight: 800;
    color: #fff;
  }

  .fp-jp-sub-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .fp-jp-tier-box.mini strong {
    font-size: 11px;
  }

  .fp-jp-badge {
    padding: 2px 7px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 900;
    color: #fff;
  }

  .fp-jp-badge.fire {
    background: #ef4444;
  }
  .fp-jp-badge.warm {
    background: #d97706;
  }
  .fp-jp-badge.heat {
    background: #f97316;
  }

  .fp-jp-thumbs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin-top: 2px;
  }

  .fp-jp-thumbs img {
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
    border-radius: 7px;
  }

  .fp-jp-btn {
    margin-top: 2px;
    height: 30px;
    border-radius: 999px;
    border: none;
    background: #4c1d95;
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.4px;
    cursor: pointer;
  }

  /* Winners Ticker Strip */
  .fp-winners-strip {
    background: #161320;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 8px 14px;
    display: flex;
    align-items: center;
    gap: 16px;
    overflow-x: auto;
  }

  .fp-winners-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.5px;
    color: #cbd5e1;
    white-space: nowrap;
    padding-right: 12px;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
  }

  .fp-live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #ef4444;
    box-shadow: 0 0 8px #ef4444;
  }

  .fp-winners-items {
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 1;
    justify-content: space-between;
  }

  .fp-winner-chip {
    display: flex;
    align-items: center;
    gap: 9px;
    white-space: nowrap;
  }

  .fp-winner-chip img {
    width: 30px;
    height: 30px;
    border-radius: 6px;
    object-fit: cover;
  }

  .fp-winner-line {
    font-size: 11px;
    color: #e2e8f0;
  }

  .fp-win-sum {
    color: #facc15;
    font-weight: 800;
  }

  .fp-winner-game {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.48);
  }

  /* Hourly Hot / Cold */
  .fp-rtp-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .fp-rtp-box {
    background: #161320;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .fp-rtp-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  .fp-rtp-title-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .fp-rtp-title-row h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
  }

  .fp-info-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    font-size: 10px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .fp-rtp-tooltip {
    position: absolute;
    left: 90px;
    top: -10px;
    width: 240px;
    background: #231e33;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 10px;
    padding: 10px;
    font-size: 11px;
    line-height: 1.35;
    color: #e2e8f0;
    z-index: 20;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.6);
  }

  .fp-rtp-sub {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }

  .fp-rtp-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .fp-rtp-row {
    position: relative;
    border-radius: 10px;
    padding: 8px 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .fp-rtp-row.hot {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.03) 40%,
      rgba(220, 38, 38, 0.52) 100%
    );
  }

  .fp-rtp-row.cold {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.03) 40%,
      rgba(37, 99, 235, 0.52) 100%
    );
  }

  .fp-rtp-rank {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    font-size: 10px;
    font-weight: 900;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .fp-rtp-rank.hot {
    background: #dc2626;
  }
  .fp-rtp-rank.cold {
    background: #2563eb;
  }

  .fp-rtp-row img {
    width: 34px;
    height: 34px;
    border-radius: 7px;
    object-fit: cover;
  }

  .fp-rtp-meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .fp-rtp-meta strong {
    font-size: 12.5px;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fp-rtp-meta span {
    font-size: 10.5px;
    color: rgba(255, 255, 255, 0.55);
  }

  .fp-rtp-val {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    white-space: nowrap;
  }

  .fp-rtp-val strong {
    color: #fff;
    font-weight: 900;
  }

  .fp-rtp-play {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    color: #fff;
    font-size: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .fp-rtp-play.hot {
    background: #b91c1c;
  }
  .fp-rtp-play.cold {
    background: #1d4ed8;
  }

  /* Providers */
  .fp-providers-grid {
    display: grid;
    grid-template-columns: repeat(11, minmax(0, 1fr));
    gap: 8px;
  }

  .fp-provider-tile {
    height: 46px;
    border-radius: 999px;
    background: #171421;
    border: 1px solid rgba(255, 255, 255, 0.06);
    color: var(--prov-color, #e2e8f0);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.3px;
    padding: 0 8px;
    cursor: pointer;
    font-family: inherit;
    transition:
      border-color 0.15s,
      background 0.15s;
  }

  .fp-provider-tile:hover {
    border-color: rgba(255, 255, 255, 0.25);
    background: #201c2d;
  }

  /* Spotlights */
  .fp-spotlight-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .fp-spotlight-card {
    background: #161320;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .fp-spotlight-top {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .fp-spotlight-prov {
    width: 84px;
    height: 36px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .fp-spotlight-prov img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .fp-spotlight-meta {
    flex: 1;
  }

  .fp-spotlight-meta span {
    font-size: 9.5px;
    font-weight: 800;
    color: #eab949;
    letter-spacing: 0.5px;
  }

  .fp-spotlight-meta h3 {
    margin: 2px 0 0;
    font-size: 16px;
    font-weight: 800;
  }

  .fp-spotlight-btn {
    padding: 9px 18px;
    border-radius: 999px;
    border: none;
    background: #eab949;
    color: #161000;
    font-size: 11px;
    font-weight: 900;
    cursor: pointer;
  }

  .fp-spotlight-art {
    height: 132px;
    border-radius: 12px;
    background-size: cover;
    background-position: center;
  }

  /* Themes */
  .fp-themes-row {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 10px;
  }

  .fp-theme-card {
    position: relative;
    height: 128px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    overflow: hidden;
    padding: 0;
    cursor: pointer;
    text-align: left;
  }

  .fp-theme-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.85;
  }

  .fp-theme-foot {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(10, 8, 18, 0.92) 8%,
      transparent 70%
    );
    padding: 10px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  .fp-theme-foot strong {
    font-size: 12px;
    color: #fff;
  }

  .fp-theme-foot span {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.65);
  }

  /* USP Strip & Footer */
  .fp-usp-strip {
    background: #171421;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    padding: 18px 24px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .fp-usp-item {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12.5px;
    font-weight: 600;
    color: #e2e8f0;
  }

  .fp-usp-ico {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.07);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .fp-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.07);
    padding: 20px 8px 32px;
  }

  .fp-footer-cols {
    display: grid;
    grid-template-columns: 1.2fr 1.6fr 200px;
    gap: 28px;
  }

  .fp-footer h4 {
    margin: 0 0 12px;
    font-size: 13px;
    color: #fff;
  }

  .fp-footer-links {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
  }

  .fp-footer-links a {
    color: rgba(255, 255, 255, 0.55);
    text-decoration: none;
    font-size: 11.5px;
  }

  .fp-footer-legal {
    margin: 0 0 10px;
    font-size: 11px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.5);
  }

  .fp-footer-apps {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .fp-app-btn {
    background: #171421;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 999px;
    padding: 8px 16px;
    font-size: 11px;
    color: #cbd5e1;
  }

  .fp-app-btn strong {
    color: #fff;
  }

  /* ─── VIP Club Page ─── */
  .fp-vip-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .fp-vip-page-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .fp-vip-page-top h1 {
    margin: 0 0 6px;
    font-size: 28px;
    font-weight: 900;
  }

  .fp-vip-page-top p {
    margin: 0;
    font-size: 13.5px;
    color: rgba(255, 255, 255, 0.72);
    max-width: 580px;
  }

  .fp-btn-back-home {
    height: 36px;
    padding: 0 16px;
    border-radius: 999px;
    background: #211d2e;
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .fp-vip-hero-status {
    background: linear-gradient(135deg, #211b36 0%, #151120 100%);
    border: 1px solid rgba(167, 139, 250, 0.28);
    border-radius: 16px;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .fp-vip-hero-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .fp-vip-hero-img {
    width: 64px;
    height: 64px;
    object-fit: contain;
  }

  .fp-vip-hero-tag {
    font-size: 10px;
    font-weight: 800;
    color: #a78bfa;
    letter-spacing: 0.7px;
  }

  .fp-vip-hero-left h2 {
    margin: 3px 0;
    font-size: 18px;
    font-weight: 800;
  }

  .fp-vip-hero-left p {
    margin: 0;
    font-size: 12.5px;
    color: rgba(255, 255, 255, 0.7);
  }

  .fp-vip-hero-meter {
    width: 300px;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .fp-vip-meter-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
  }

  .fp-vip-tiers-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .fp-vip-tier-card {
    background: #161320;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .fp-vip-tier-card.active {
    border-color: #eab949;
    background: linear-gradient(160deg, rgba(234, 185, 73, 0.12), #161320);
  }

  .fp-vip-tier-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .fp-vip-tier-head img {
    width: 50px;
    height: 50px;
    object-fit: contain;
  }

  .fp-tier-range {
    font-size: 10.5px;
    color: rgba(255, 255, 255, 0.55);
  }

  .fp-vip-tier-head h3 {
    margin: 2px 0;
    font-size: 16px;
    font-weight: 800;
  }

  .fp-tier-cashback {
    font-size: 11.5px;
    font-weight: 700;
    color: #eab949;
  }

  .fp-tier-progress-box {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 11px;
    font-weight: 700;
  }

  .fp-tier-perks {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.78);
  }

  /* ─── Floating Preview Configurator Dock ─── */
  .fp-floating-dock {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 200;
    width: 332px;
    max-height: calc(100vh - 32px);
    display: flex;
    flex-direction: column;
    background: rgba(18, 14, 29, 0.94);
    backdrop-filter: blur(14px);
    border: 1px solid rgba(167, 139, 250, 0.35);
    border-radius: 14px;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.65);
    overflow: hidden;
  }

  .fp-floating-dock.minimized {
    width: auto;
  }

  .fp-dock-head {
    padding: 10px 12px;
    background: rgba(109, 40, 217, 0.18);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 12px;
    font-weight: 800;
    flex-shrink: 0;
  }

  .fp-dock-toggle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    font-weight: 800;
    cursor: pointer;
  }

  .fp-dock-body {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
  }

  .fp-dock-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .fp-dock-label {
    font-size: 10.5px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .fp-dock-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .fp-dock-btns button {
    padding: 5px 11px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.05);
    color: #cbd5e1;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }

  .fp-dock-btns button.active {
    background: #eab949;
    border-color: #eab949;
    color: #161000;
  }

  .fp-dock-slider-wrap {
    margin-top: 4px;
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .fp-dock-slider-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 11px;
    color: #cbd5e1;
  }

  .fp-dock-slider-head strong {
    color: #eab949;
  }

  .fp-dock-mini-presets {
    display: flex;
    gap: 4px;
  }

  .fp-dock-mini-presets button {
    padding: 2px 7px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.05);
    color: #cbd5e1;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }

  .fp-dock-mini-presets button.active {
    background: #eab949;
    border-color: #eab949;
    color: #161000;
  }

  .fp-dock-slider {
    width: 100%;
    accent-color: #eab949;
    cursor: pointer;
  }

  .fp-dock-save-row {
    display: flex;
    gap: 8px;
    margin-top: 2px;
  }

  .fp-btn-save-cfg {
    flex: 1;
    height: 34px;
    border-radius: 999px;
    border: none;
    background: linear-gradient(135deg, #f3c65f, #d89e28);
    color: #161000;
    font-size: 11.5px;
    font-weight: 900;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
  }

  .fp-btn-save-cfg.is-saved {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #fff;
  }

  .fp-btn-reset-cfg {
    height: 34px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: #cbd5e1;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }

  .fp-back-actual {
    display: block;
    text-align: center;
    margin-top: 2px;
    padding: 7px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    text-decoration: none;
    font-size: 11.5px;
    font-weight: 700;
  }

  /* ─── Bottom-Right Vertical VIP Club Progress Bar ─── */
  .fp-vip-vert-dock {
    position: fixed;
    right: 18px;
    bottom: 22px;
    z-index: 950;
    display: flex;
    align-items: flex-end;
    gap: 10px;
    transition:
      transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.22s ease;
  }

  .fp-vip-vert-pill {
    width: 48px;
    padding: 7px 6px 9px;
    border-radius: 999px;
    background: linear-gradient(
      180deg,
      rgba(32, 26, 50, 0.94) 0%,
      rgba(18, 15, 29, 0.94) 100%
    );
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(234, 185, 73, 0.3);
    box-shadow:
      0 12px 30px rgba(0, 0, 0, 0.62),
      0 0 18px rgba(234, 185, 73, 0.12);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-family: inherit;
    color: #f8fafc;
    transition:
      border-color 0.2s ease,
      transform 0.18s ease,
      box-shadow 0.2s ease;
  }

  .fp-vip-vert-pill:hover,
  .fp-vip-vert-pill.is-active,
  .fp-vip-vert-dock.is-open .fp-vip-vert-pill {
    border-color: rgba(243, 198, 95, 0.72);
    box-shadow:
      0 14px 34px rgba(0, 0, 0, 0.7),
      0 0 22px rgba(243, 198, 95, 0.24);
  }

  .fp-vip-vert-pill:active {
    transform: scale(0.96);
  }

  .fp-vip-vert-track {
    position: relative;
    width: 9px;
    height: 76px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.09);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.55);
    overflow: hidden;
    display: flex;
    align-items: flex-end;
  }

  .fp-vip-vert-tick {
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.16);
    z-index: 2;
    pointer-events: none;
  }

  .fp-vip-vert-fill {
    width: 100%;
    border-radius: 999px;
    background: var(
      --vip-fill-vert-bg,
      linear-gradient(0deg, #c98a18 0%, #eab949 55%, #fde68a 100%)
    );
    box-shadow: 0 0 10px var(--vip-fill-glow);
    transition: height 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .fp-vip-vert-meta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    line-height: 1;
  }

  .fp-vip-vert-pct {
    font-size: 10.5px;
    font-weight: 900;
    color: #f3c65f;
  }

  .fp-vip-vert-lbl {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.58);
  }

  .fp-vip-vert-flyout {
    width: 196px;
    padding: 12px 14px;
    border-radius: 20px;
    background: rgba(20, 16, 33, 0.96);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(234, 185, 73, 0.32);
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.68);
    display: flex;
    flex-direction: column;
    gap: 6px;
    opacity: 0;
    visibility: hidden;
    transform: translateX(10px) scale(0.96);
    pointer-events: none;
    transition:
      opacity 0.2s ease,
      transform 0.2s ease,
      visibility 0.2s;
  }

  .fp-vip-vert-dock.is-open .fp-vip-vert-flyout {
    opacity: 1;
    visibility: visible;
    transform: translateX(0) scale(1);
    pointer-events: auto;
  }

  @media (hover: hover) and (min-width: 961px) {
    .fp-vip-vert-dock:hover .fp-vip-vert-flyout {
      opacity: 1;
      visibility: visible;
      transform: translateX(0) scale(1);
      pointer-events: auto;
    }
  }

  .fp-vip-vert-fly-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .fp-vip-vert-fly-tier {
    font-size: 13px;
    font-weight: 900;
    color: #fff;
  }

  .fp-vip-vert-fly-xp {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.68);
  }

  .fp-vip-vert-fly-xp strong {
    color: #f3c65f;
    font-weight: 800;
  }

  .fp-vip-vert-fly-sub {
    margin: 0;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.65);
    line-height: 1.3;
  }

  .fp-vip-vert-fly-btn {
    margin-top: 2px;
    height: 32px;
    border-radius: 999px;
    border: none;
    background: linear-gradient(135deg, #f3c65f, #d89e28);
    color: #161000;
    font-size: 11.5px;
    font-weight: 900;
    cursor: pointer;
    font-family: inherit;
    transition: transform 0.16s ease;
  }

  .fp-vip-vert-fly-btn:active {
    transform: scale(0.96);
  }

  /* ─── Mobile Bottom Nav & Slide-over Backdrop ─── */
  .fp-mobile-backdrop {
    display: none;
  }

  .fp-mobile-bottom-nav {
    display: none;
  }

  @media (max-width: 1280px) {
    .fp-games-row-10 {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
    .fp-providers-grid {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
    .fp-jackpots-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .fp-themes-row {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (max-width: 960px) {
    .fp-shell {
      padding-bottom: 104px;
    }

    .fp-header {
      top: 8px;
      margin: 8px 10px 0;
      height: 54px;
      padding: 0 12px;
      border-radius: 999px;
      flex-wrap: nowrap;
      gap: 8px;
      background: rgba(22, 19, 32, 0.9);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .fp-header.is-mobile-hidden {
      transform: translateY(calc(-100% - 24px));
      pointer-events: none;
    }

    .fp-sidebar-toggle-btn {
      display: none;
    }

    .fp-header-left {
      width: auto;
      gap: 6px;
      flex-shrink: 0;
    }

    .fp-logo-img {
      height: 22px;
    }

    .fp-header-center {
      order: 0;
      flex: 1 1 auto;
      min-width: 0;
      justify-content: flex-start;
      flex-wrap: nowrap;
      gap: 8px;
    }

    .fp-search {
      width: 100% !important;
      max-width: 240px;
      min-width: 0 !important;
      flex: 1 1 auto !important;
      height: 36px;
      padding: 0 11px;
      gap: 6px;
    }

    .fp-search input {
      font-size: 12px;
    }

    .fp-header-spacer {
      display: none;
    }

    .fp-merged-wallet {
      flex-wrap: nowrap;
      height: 38px;
      padding: 3px 6px 3px 8px;
      border-radius: 999px;
      gap: 8px;
    }

    .fp-merged-vip-zone {
      width: 135px;
    }

    .fp-body,
    .fp-body.mode-mini,
    .fp-body.mode-hidden {
      grid-template-columns: 1fr;
    }

    .fp-mobile-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 1190;
      border: none;
      background: rgba(5, 4, 10, 0.65);
      backdrop-filter: blur(4px);
      cursor: pointer;
    }

    .fp-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: 268px;
      max-width: 82vw;
      z-index: 1200;
      background: #13101c;
      padding: 16px 14px 32px;
      overflow-y: auto;
      transform: translateX(-105%);
      transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
      box-shadow: 16px 0 40px rgba(0, 0, 0, 0.65);
    }

    .fp-sidebar.mobile-open {
      transform: translateX(0);
    }

    .fp-mobile-bottom-nav {
      display: flex;
      position: fixed;
      left: 10px;
      right: 10px;
      bottom: calc(10px + env(safe-area-inset-bottom, 0px));
      height: 60px;
      padding: 0 6px;
      border-radius: 999px;
      background: rgba(18, 15, 29, 0.9);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow:
        0 12px 32px rgba(0, 0, 0, 0.65),
        0 0 0 1px rgba(0, 0, 0, 0.35);
      z-index: 1050;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
      transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .fp-mobile-bottom-nav.is-hidden {
      transform: translateY(
        calc(100% + 56px + env(safe-area-inset-bottom, 0px))
      );
      pointer-events: none;
    }

    .fp-mnav-side {
      flex: 1 1 0%;
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: space-evenly;
      gap: 4px;
    }

    .fp-mnav-item {
      flex: 1;
      height: 46px;
      border: none;
      border-radius: 999px;
      background: transparent;
      color: rgba(255, 255, 255, 0.68);
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.3px;
      cursor: pointer;
      font-family: inherit;
      transition:
        color 0.18s ease,
        background 0.18s ease;
    }

    .fp-mnav-item.active {
      color: #f3c65f;
    }

    .fp-mnav-ico {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .fp-mnav-center {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      margin: 0 4px;
      padding: 0;
      border-radius: 50%;
      border: none;
      background: transparent;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      filter: drop-shadow(0 2px 8px rgba(234, 185, 73, 0.3));
      transition:
        transform 0.18s ease,
        filter 0.18s ease;
    }

    .fp-mnav-center:active {
      transform: scale(0.93);
    }

    .fp-mnav-spade-img {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
    }

    .fp-floating-dock {
      right: 12px;
      bottom: calc(82px + env(safe-area-inset-bottom, 0px));
      max-width: calc(100vw - 24px);
      transition: bottom 0.28s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .fp-floating-dock.bars-hidden {
      bottom: 14px;
    }

    .fp-vip-vert-dock {
      display: none;
    }

    .fp-hero-grid,
    .fp-rtp-grid,
    .fp-spotlight-grid,
    .fp-vip-tiers-grid,
    .fp-usp-strip,
    .fp-footer-cols {
      grid-template-columns: 1fr;
    }
    .fp-top10-row {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 820px) {
    .fp-header .fp-vip-bar,
    .fp-merged-vip-zone,
    .fp-merged-divider,
    .fp-merged-bal-lbl,
    .fp-icon-badge-btn {
      display: none;
    }

    .fp-header-right {
      gap: 6px;
    }

    .fp-avatar-btn {
      width: 32px;
      height: 32px;
    }

    .fp-balance-pill {
      height: 34px;
      padding: 3px 10px 3px 4px;
      gap: 6px;
    }

    .fp-balance-plus {
      width: 26px;
      height: 26px;
      font-size: 16px;
    }

    .fp-balance-amount,
    .fp-merged-bal-text strong {
      font-size: 12px;
    }

    .fp-merged-wallet {
      height: 36px;
      padding: 3px 5px 3px 6px;
      gap: 6px;
    }

    .fp-merged-avatar {
      width: 28px;
      height: 28px;
    }

    .fp-btn-login,
    .fp-btn-register {
      height: 32px;
      padding: 0 10px;
      font-size: 10.5px;
      white-space: nowrap;
    }
  }

  @media (max-width: 680px) {
    .fp-search:focus-within {
      position: absolute;
      left: 8px;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      max-width: none;
      width: auto !important;
      height: 38px;
      z-index: 30;
      background: #211d2e;
      border-color: rgba(234, 185, 73, 0.75);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55);
    }
  }

  @media (max-width: 400px) {
    .fp-logo-img {
      height: 19px;
    }
    .fp-avatar-btn {
      display: none;
    }
  }
</style>
