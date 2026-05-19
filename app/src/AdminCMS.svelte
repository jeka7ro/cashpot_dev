<script>
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import {
    cmsCategories,
    cmsJackpot,
    cmsJackpotFever,
    cmsJackpotFever2,
    cmsBanners,
    cmsPromoBanner,
    isAdminLoggedIn,
    cmsAuditLog,
    siteTheme,
    cmsToolbarConfig,
    cmsSidebarNavConfig,
    cmsHeaderWidgets,
    cmsGameEffects,
    cmsDraftGameEffects,
    isPreviewMode,
    cmsDraftCategories,
    cmsDraftJackpot,
    cmsDraftJackpotFever,
    cmsDraftJackpotFever2,
    cmsDraftBanners,
    cmsDraftPromoBanner,
    GAMES,
    cmsThemeColors,
    cmsDraftThemeColors,
    cmsWinnersConfig,
    cmsDraftWinnersConfig,
    cmsTopGamesConfig,
    cmsDraftTopGamesConfig,
    cmsDraftRtpConfig,
    cmsDraftToolbarConfig,
    cmsDraftSidebarNavConfig,
    cmsDraftSidebarWidgets,
    defaultSidebarWidgets,
    cmsPlayArenaConfig,
    cmsDraftPlayArenaConfig,
    cmsVipConfig,
    cmsDraftVipConfig,
    cmsDraftHeaderWidgets,
    cmsHeaderConfig,
    cmsDraftHeaderConfig,
    saveToServer,
  } from "./store.js";

  let isFever1Expanded = false;
  let isFever2Expanded = false;

  const getTabTitle = (tab) => {
    const titles = {
      categories: "Categorii & Layout",
      banners: "Acasă",
      jackpot: "Jackpot Cards",
      promo: "Promo Banner",
      calendar: "Calendar & Timere",
      restore: "Backup & Restore",
      gamification: "Gamification (Misiuni & Turnee)",
      winners: "Top Câștigători",
      topgames: "Top Jocuri",
      rtp: "Jocuri RTP",
      toolbar: "Toolbar Widget",
      sidebarnav: "Sidebar Nav",
      widgets: "Managament Widgets",
      design: "Design & Branding",
      playarena: "Play Arena Hub",
      history: "Istoric Modificări",
      vip: "Club VIP Setup",
      header: "Header & Logo",
    };
    return titles[tab] || "Pagina Admin";
  };
  import Gamification from "./Gamification.svelte";

  let username = "admin",
    password = "cashpot2026",
    loginError = "";
  let activeTab = "categories";
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("cms_active_tab");
    if (saved) activeTab = saved;
  }
  $: if (typeof window !== "undefined")
    localStorage.setItem("cms_active_tab", activeTab);
  let saveSuccess = false;
  let adminSearchQuery = "";
  let previewBannerModal = null;
  let backups = [];
  let restoreSuccess = "";
  let showPreviewPanel = false;
  let previewDevice = 'mobile'; // 'mobile' | 'desktop'
  let previewIframe = null;

  // Map each CMS tab to the site view it affects
  const previewTabMap = {
    banners: { view: "preview_banners", label: "Hero Bannere", hash: "" },
    categories: {
      view: "preview_categories",
      label: "Categorii Jocuri",
      hash: "",
    },
    jackpot: { view: "preview_jackpot", label: "Jackpot Cards", hash: "" },
    themes: { view: "home", label: "Design & Culori", hash: "" },
    thumbnails: { view: "preview_grid", label: "Grid Jocuri", hash: "" },
    promo: { view: "preview_promo", label: "Promo Banner", hash: "" },
    winners: { view: "preview_winners", label: "Top Câștigători", hash: "" },
    topgames: { view: "preview_top10", label: "Top Jocuri", hash: "" },
    rtp: { view: "preview_rtp", label: "Jocuri RTP", hash: "" },
    toolbar: { view: "home", label: "Toolbar Widget", hash: "" },
    sidebarnav: { view: "preview_sidebar", label: "Sidebar Nav", hash: "" },
    gamification: { view: "home", label: "Gamification", hash: "" },
    playarena: { view: "playarena", label: "Play Arena Hub", hash: "" },
    calendar: { view: "home", label: "Calendar", hash: "" },
    vip: { view: "vip", label: "Club VIP", hash: "" },
  };

  $: currentPreviewMeta = previewTabMap[activeTab] || { view: 'home', label: activeTab, hash: '' };
  $: previewUrl = `/?preview=draft&view=${currentPreviewMeta.view}${currentPreviewMeta.hash}`;

  // When tab changes while preview is open, navigate iframe
  $: if (showPreviewPanel && previewIframe && previewUrl) {
    try { previewIframe.contentWindow.location.href = previewUrl; } catch(e) {}
  }

  function togglePreview() {
    showPreviewPanel = !showPreviewPanel;
    if (showPreviewPanel) {
      isPreviewMode.set(true);
      setTimeout(() => {
        if (previewIframe) previewIframe.contentWindow.location.reload();
      }, 150);
    } else {
      isPreviewMode.set(false);
    }
  }

  function refreshPreview() {
    if (previewIframe) {
      isPreviewMode.set(true);
      previewIframe.contentWindow.location.reload();
    }
  }

  // Load backups from localStorage on mount
  try {
    backups = JSON.parse(localStorage.getItem("cms_backups") || "[]");
  } catch (e) {
    backups = [];
  }

  // Gamification State
  let gameData = {
    jackpotEnabled: true,
    jackpots: {},
    missions: [],
    tournament: { leaderboard: [] },
    wheelPrizes: [],
    playerXP: {},
    loyaltyConfig: { tiers: [] },
    cashbackConfig: {},
  };

  onMount(async () => {
    try {
      const draft = localStorage.getItem("cms_gamification_draft_autosave");
      if (draft) {
        gameData = JSON.parse(draft);
      } else {
        const res = await fetch("/api/game");
        if (res.ok) {
          const json = await res.json();
          if (json.data) gameData = json.data;
        }
      }
    } catch (e) {
      console.error("Failed to load game data:", e);
    }
  });

  $: {
    if (gameData && Object.keys(gameData.jackpots || {}).length > 0) {
      try {
        localStorage.setItem(
          "cms_gamification_draft_autosave",
          JSON.stringify(gameData),
        );
      } catch (e) {}
    }
  }

  let headerConfig = {
    showThemeToggle: true,
    showLangToggle: true,
    showIcons: true,
    showCategoryIcons: true,
    showSidebarIcons: true,
    showJackpotIcons: true,
    showToolbarIcons: true
  };
  cmsDraftHeaderConfig.subscribe(v => {
    if (v && Object.keys(v).length > 0) {
      try { headerConfig = JSON.parse(JSON.stringify(v)); } catch(e) { headerConfig = v; }
    }
  });

  let categories = [];
  cmsDraftCategories.subscribe((v) => {
    if (v) {
      try { categories = JSON.parse(JSON.stringify(v)); } catch(e) { categories = v; }
    } else {
      categories = [];
    }
  });

  let winnersConfig = {};
  cmsDraftWinnersConfig.subscribe((v) => {
    if (v) {
      try { winnersConfig = JSON.parse(JSON.stringify(v)); } catch(e) { winnersConfig = v; }
    } else {
      winnersConfig = {};
    }
  });

  let rtpConfig = {};
  cmsDraftRtpConfig.subscribe((v) => {
    if (v) {
      try { rtpConfig = JSON.parse(JSON.stringify(v)); } catch(e) { rtpConfig = v; }
    } else {
      rtpConfig = {};
    }
  });

  let playArenaConfig = {};
  cmsDraftPlayArenaConfig.subscribe((v) => {
    if (v) {
      try { playArenaConfig = JSON.parse(JSON.stringify(v)); } catch(e) { playArenaConfig = v; }
    } else {
      playArenaConfig = {};
    }
  });

  let vipConfig = {};
  cmsDraftVipConfig.subscribe((v) => {
    if (v) {
      try { vipConfig = JSON.parse(JSON.stringify(v)); } catch(e) { vipConfig = v; }
    } else {
      vipConfig = {};
    }
  });

  let jackpotConfig = [];

  // Reactive sync for all stores to ensure Live Preview works perfectly
  $: if (categories) cmsDraftCategories.set(categories);
  $: if (winnersConfig) cmsDraftWinnersConfig.set(winnersConfig);
  $: if (rtpConfig) cmsDraftRtpConfig.set(rtpConfig);
  $: if (jackpotConfig) cmsDraftJackpot.set(jackpotConfig);
  $: if (jackpotFeverConfig) cmsDraftJackpotFever.set(jackpotFeverConfig);
  $: if (jackpotFever2Config) cmsDraftJackpotFever2.set(jackpotFever2Config);
  $: if (bannersConfig) cmsDraftBanners.set(bannersConfig);
  $: if (promoConfig) cmsDraftPromoBanner.set(promoConfig);
  $: if (gameEffects) cmsDraftGameEffects.set(gameEffects);
  $: if (themeColors) cmsDraftThemeColors.set(themeColors);
  $: if (toolbarConfig) cmsDraftToolbarConfig.set(toolbarConfig);
  $: if (sidebarNavConfig) cmsDraftSidebarNavConfig.set(sidebarNavConfig);
  $: if (playArenaConfig) cmsDraftPlayArenaConfig.set(playArenaConfig);
  $: if (vipConfig) cmsDraftVipConfig.set(vipConfig);
  $: if (headerConfig) cmsDraftHeaderConfig.set(headerConfig);

  cmsDraftJackpot.subscribe((v) => {
    let config = JSON.parse(JSON.stringify(v));
    let modified = false;
    if (config.length > 0 && !config.some((jp) => jp.id === "jp_bell")) {
      config.push({
        id: "jp_bell",
        name: "VIP Bell Link",
        logoUrl:
          "https://cashpot.ro/default/images/JackpotsLive/logos/bellLink.webp",
        position: "bottom",
        showWhenLoggedOut: true,
        backgroundImage: "",
        apiUrl: "https://cashpot.ro/api/dynamic/jackpots.json",
        size: "L",
        animation: true,
        type: "bell",
        levels: [
          { name: "MINI", value: 50.0, icon: "🔔", color: "#3b82f6" },
          { name: "MINOR", value: 250.0, icon: "🔔", color: "#22c55e" },
          { name: "MAJOR", value: 1500.0, icon: "🔔", color: "#eab308" },
          { name: "GRAND", value: 15000.0, icon: "🔔", color: "#ef4444" },
        ],
      });
      modified = true;
    }
    jackpotConfig = config;
    if (modified) {
      setTimeout(() => cmsDraftJackpot.set(config), 0);
    }
  });

  async function handleToolbarIconUpload(e, itemIndex) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!toolbarConfig.items[itemIndex]) return;
      toolbarConfig.items[itemIndex].imgUrl = event.target.result;
      toolbarConfig = { ...toolbarConfig };
      cmsDraftToolbarConfig.set(toolbarConfig);
    };
    reader.readAsDataURL(file);
  }

  async function handleVipImageUpload(e, levelIndex) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!vipConfig.levels[levelIndex]) return;
      vipConfig.levels[levelIndex].img = event.target.result;
      vipConfig = { ...vipConfig };
      cmsDraftVipConfig.set(vipConfig);
    };
    reader.readAsDataURL(file);
  }

  let jackpotFeverConfig = {};
  cmsDraftJackpotFever.subscribe((v) => {
    if (v) {
      try { jackpotFeverConfig = JSON.parse(JSON.stringify(v)); } catch(e) { jackpotFeverConfig = v; }
    } else {
      jackpotFeverConfig = {};
    }
  });

  let jackpotFever2Config = {};
  cmsDraftJackpotFever2.subscribe((v) => {
    if (v) {
      try { jackpotFever2Config = JSON.parse(JSON.stringify(v)); } catch(e) { jackpotFever2Config = v; }
    } else {
      jackpotFever2Config = {};
    }
  });

  let bannersConfig = { layout: "1_big_2_small", items: [] };
  cmsDraftBanners.subscribe((v) => {
    if (v) {
      try { bannersConfig = JSON.parse(JSON.stringify(v)); } catch(e) { bannersConfig = v; }
    } else {
      bannersConfig = { layout: "1_big_2_small", items: [] };
    }
  });

  let promoConfig = [];
  cmsDraftPromoBanner.subscribe((v) => {
    if (v) {
      try { promoConfig = JSON.parse(JSON.stringify(v)); } catch(e) { promoConfig = v; }
    } else {
      promoConfig = [];
    }
  });

  let toolbarConfig = {};
  cmsDraftToolbarConfig.subscribe((v) => {
    if (v) {
      try { toolbarConfig = JSON.parse(JSON.stringify(v)); } catch(e) { toolbarConfig = v; }
    } else {
      toolbarConfig = {};
    }
  });

  let sidebarNavConfig = {};
  cmsDraftSidebarNavConfig.subscribe((v) => {
    if (v) {
      try { sidebarNavConfig = JSON.parse(JSON.stringify(v)); } catch(e) { sidebarNavConfig = v; }
    } else {
      sidebarNavConfig = {};
    }
  });

  let sidebarWidgetsConfig = JSON.parse(JSON.stringify(defaultSidebarWidgets));
  
  function sanitizeSidebarWidgets(w) {
    if (!w) w = JSON.parse(JSON.stringify(defaultSidebarWidgets));
    let parsed = JSON.parse(JSON.stringify(w));
    if (!parsed.luckyWheel) parsed.luckyWheel = defaultSidebarWidgets.luckyWheel;
    if (!parsed.cashbackProgress) parsed.cashbackProgress = defaultSidebarWidgets.cashbackProgress;
    if (!parsed.tournament) parsed.tournament = defaultSidebarWidgets.tournament;
    if (!parsed.jackpotWidget) parsed.jackpotWidget = defaultSidebarWidgets.jackpotWidget;
    if (!parsed.jackpotWidget.shape) parsed.jackpotWidget.shape = 'widget';
    if (!parsed.walletWidget) parsed.walletWidget = defaultSidebarWidgets.walletWidget;
    if (!parsed.walletWidget.shape) parsed.walletWidget.shape = 'widget';
    if (!parsed.cardStyle) parsed.cardStyle = 'widget';
    if (!parsed.cardStyleSize) parsed.cardStyleSize = 'm';
    if (!parsed.widgetOrder || !Array.isArray(parsed.widgetOrder) || parsed.widgetOrder.length === 0) {
      parsed.widgetOrder = [...defaultSidebarWidgets.widgetOrder];
    }
    if (!parsed.missions) parsed.missions = defaultSidebarWidgets.missions;
    if (!parsed.categoryTabs) {
      parsed.categoryTabs = JSON.parse(JSON.stringify(defaultSidebarWidgets.categoryTabs));
    } else {
      // merge — preserve shape/size/colors but ensure tabs array exists
      if (!parsed.categoryTabs.tabs || !Array.isArray(parsed.categoryTabs.tabs) || parsed.categoryTabs.tabs.length === 0) {
        parsed.categoryTabs.tabs = JSON.parse(JSON.stringify(defaultSidebarWidgets.categoryTabs.tabs));
      } else {
        parsed.categoryTabs.tabs.forEach(tab => {
          if (!tab.image) {
            const defaultTab = defaultSidebarWidgets.categoryTabs.tabs.find(t => t.id === tab.id);
            if (defaultTab && defaultTab.image) tab.image = defaultTab.image;
          }
        });
      }
    }
    if (!parsed.promoCards) parsed.promoCards = [];
    return parsed;
  }

  cmsDraftSidebarWidgets.subscribe((v) => { sidebarWidgetsConfig = sanitizeSidebarWidgets(v); });


  let gameEffects = {};
  cmsDraftGameEffects.subscribe((v) => {
    if (v) {
      try {
        if (JSON.stringify(v) !== JSON.stringify(gameEffects)) {
          gameEffects = JSON.parse(JSON.stringify(v));
        }
      } catch (e) {
        gameEffects = v;
      }
    } else {
      gameEffects = {};
    }
  });

  let themeColors = {};
  cmsDraftThemeColors.subscribe((v) => {
    if (v) {
      try { themeColors = JSON.parse(JSON.stringify(v)); } catch(e) { themeColors = v; }
    } else {
      themeColors = {};
    }
  });

  let topGamesConfig = {
    enabled: true,
    title: "Top 10 Păcănele 2026",
    games: [],
  };
  cmsDraftTopGamesConfig.subscribe((v) => {
    if (v) {
      try { topGamesConfig = JSON.parse(JSON.stringify(v)); } catch(e) { topGamesConfig = v; }
    } else {
      topGamesConfig = { enabled: true, title: "Top 10 Păcănele 2026", games: [] };
    }
  });

  let headerWidgetsConfig = {};
  cmsDraftHeaderWidgets.subscribe((v) => {
    if (v) {
      try { headerWidgetsConfig = JSON.parse(JSON.stringify(v)); } catch(e) { headerWidgetsConfig = v; }
    } else {
      headerWidgetsConfig = {};
    }
  });

  // Promo Banner Game Selection State
  let promoGameSearch = "";
  let promoGameProvider = "All";
  $: uniqueProviders = ["All", ...new Set(GAMES.map((g) => g.p))];
  $: filteredPromoGames = GAMES.filter((g) => {
    const matchSearch = g.n
      .toLowerCase()
      .includes(promoGameSearch.toLowerCase());
    const matchProvider =
      promoGameProvider === "All" || g.p === promoGameProvider;
    return matchSearch && matchProvider;
  });

  $: adminWheelGradient = (gameData.wheelPrizes || []).length
    ? (gameData.wheelPrizes || [])
        .map((p, i) => {
          const step = 360 / (gameData.wheelPrizes || []).length;
          return `${p.color} ${i * step}deg ${(i + 1) * step}deg`;
        })
        .join(", ")
    : "transparent";

  function selectPromoGame(game, i) {
    promoConfig[i].gameImage = game.img;
    promoConfig[i].gameName = game.n;
  }

  function addPromoBanner() {
    promoConfig = [
      ...promoConfig,
      {
        id: "promo_" + Date.now(),
        enabled: true,
        title: "Game of the Week Nou",
        size: "L",
        gameImage: "",
        backgroundImage: "/abstract_casino_bg_2.png",
        buttonText: "JOACĂ",
        positionIndex: 1,
      },
    ];
  }

  function deletePromoBanner(id) {
    promoConfig = promoConfig.filter((p) => p.id !== id);
  }

  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        themeColors.logoUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  let auditLogs = [];
  cmsAuditLog.subscribe((v) => (auditLogs = [...v]));

  // Session tracking
  let sessionStartTime = null;
  let loggedInUser = "Admin";

  // Pagination for History
  let historyPage = 1;
  let rowsPerPage = 10;
  $: totalPages = Math.ceil(auditLogs.length / rowsPerPage);
  $: paginatedLogs = auditLogs.slice(
    (historyPage - 1) * rowsPerPage,
    historyPage * rowsPerPage,
  );

  function doLogin() {
    if (username === "admin" && password === "cashpot2026") {
      isAdminLoggedIn.set(true);
      loginError = "";
      sessionStartTime = new Date();
      loggedInUser = username;
      addAuditLog(
        "SESIUNE START",
        `Utilizatorul "${username}" a început o sesiune nouă de administrare.`,
      );
    } else {
      loginError = "Credențiale incorecte!";
    }
  }

  function doLogout() {
    if (sessionStartTime) {
      const duration = Math.floor((new Date() - sessionStartTime) / 1000);
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      addAuditLog(
        "SESIUNE FINAL",
        `Utilizatorul "${loggedInUser}" a închis sesiunea. Durată totală: ${mins}m ${secs}s.`,
      );
    }
    isAdminLoggedIn.set(false);
    sessionStartTime = null;
  }

  function addAuditLog(action, details) {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleString("ro-RO"),
      user: loggedInUser,
      action,
      details,
    };
    cmsAuditLog.update((logs) => [newLog, ...logs]);
  }

  function createBackup(label = "") {
    const snapshot = {
      id: Date.now(),
      label: label || "Manual Backup",
      date: new Date().toLocaleString("ro-RO"),
      categories: JSON.parse(JSON.stringify(categories)),
      jackpot: JSON.parse(JSON.stringify(jackpotConfig)),
      jackpotFever: JSON.parse(JSON.stringify(jackpotFeverConfig)),
      jackpotFever2: JSON.parse(JSON.stringify(jackpotFever2Config)),
      banners: JSON.parse(JSON.stringify(bannersConfig)),
      promo: JSON.parse(JSON.stringify(promoConfig)),
      effects: JSON.parse(JSON.stringify(gameEffects)),
      theme: JSON.parse(JSON.stringify(themeColors)),
      winnersConfig: JSON.parse(JSON.stringify(winnersConfig)),
      topGamesConfig: JSON.parse(JSON.stringify(topGamesConfig)),
      toolbarConfig: JSON.parse(JSON.stringify(toolbarConfig)),
      sidebarNavConfig: JSON.parse(JSON.stringify(sidebarNavConfig)),
      sidebarWidgets: JSON.parse(JSON.stringify(sidebarWidgetsConfig)),
      playArenaConfig: JSON.parse(JSON.stringify(playArenaConfig)),
      vipConfig: JSON.parse(JSON.stringify(vipConfig)),
    };
    backups = [snapshot, ...backups].slice(0, 15); // max 15 backups
    try {
      localStorage.setItem("cms_backups", JSON.stringify(backups));
    } catch (e) {}
  }

  function restoreBackup(backup) {
    if (
      !confirm(
        `Restaurezi backup-ul din ${backup.label} (${backup.date || "fără dată"})? Modificările nesalvate se vor pierde.`,
      )
    )
      return;
    // Restore local state
    categories = JSON.parse(JSON.stringify(backup.categories));
    jackpotConfig = JSON.parse(JSON.stringify(backup.jackpot));
    bannersConfig = JSON.parse(JSON.stringify(backup.banners));
    promoConfig = JSON.parse(JSON.stringify(backup.promo));
    gameEffects = JSON.parse(JSON.stringify(backup.effects));
    themeColors = JSON.parse(JSON.stringify(backup.theme || {}));
    if (backup.jackpotFever) jackpotFeverConfig = JSON.parse(JSON.stringify(backup.jackpotFever));
    if (backup.jackpotFever2) jackpotFever2Config = JSON.parse(JSON.stringify(backup.jackpotFever2));
    if (backup.winnersConfig) winnersConfig = JSON.parse(JSON.stringify(backup.winnersConfig));
    if (backup.topGamesConfig) topGamesConfig = JSON.parse(JSON.stringify(backup.topGamesConfig));
    if (backup.toolbarConfig) toolbarConfig = JSON.parse(JSON.stringify(backup.toolbarConfig));
    if (backup.sidebarNavConfig) sidebarNavConfig = JSON.parse(JSON.stringify(backup.sidebarNavConfig));
    if (backup.sidebarWidgets) sidebarWidgetsConfig = sanitizeSidebarWidgets(backup.sidebarWidgets);
    if (backup.playArenaConfig) playArenaConfig = JSON.parse(JSON.stringify(backup.playArenaConfig));
    if (backup.vipConfig) vipConfig = JSON.parse(JSON.stringify(backup.vipConfig));

    // Update Draft Stores
    cmsDraftCategories.set(JSON.parse(JSON.stringify(categories)));
    cmsDraftJackpot.set(JSON.parse(JSON.stringify(jackpotConfig)));
    cmsDraftJackpotFever.set(JSON.parse(JSON.stringify(jackpotFeverConfig)));
    cmsDraftJackpotFever2.set(JSON.parse(JSON.stringify(jackpotFever2Config)));
    cmsDraftBanners.set(JSON.parse(JSON.stringify(bannersConfig)));
    cmsDraftPromoBanner.set(JSON.parse(JSON.stringify(promoConfig)));
    cmsDraftGameEffects.set(JSON.parse(JSON.stringify(gameEffects)));
    cmsDraftThemeColors.set(JSON.parse(JSON.stringify(themeColors)));
    cmsDraftWinnersConfig.set(JSON.parse(JSON.stringify(winnersConfig)));
    cmsDraftTopGamesConfig.set(JSON.parse(JSON.stringify(topGamesConfig)));
    cmsDraftToolbarConfig.set(JSON.parse(JSON.stringify(toolbarConfig)));
    cmsDraftSidebarNavConfig.set(JSON.parse(JSON.stringify(sidebarNavConfig)));
    cmsDraftSidebarWidgets.set(JSON.parse(JSON.stringify(sidebarWidgetsConfig)));
    cmsDraftPlayArenaConfig.set(JSON.parse(JSON.stringify(playArenaConfig)));
    cmsDraftVipConfig.set(JSON.parse(JSON.stringify(vipConfig)));
    cmsDraftHeaderWidgets.set(JSON.parse(JSON.stringify(headerWidgetsConfig)));
    if (backup.headerConfig) {
      headerConfig = JSON.parse(JSON.stringify(backup.headerConfig));
      cmsDraftHeaderConfig.set(JSON.parse(JSON.stringify(headerConfig)));
    }

    restoreSuccess = `✅ Backup restaurat: ${backup.label}`;
    addAuditLog("RESTORE", `S-a restaurat backup-ul din: ${backup.label}`);
    setTimeout(() => (restoreSuccess = ""), 4000);
  }

  function deleteBackup(id) {
    backups = backups.filter((b) => b.id !== id);
    try {
      localStorage.setItem("cms_backups", JSON.stringify(backups));
    } catch (e) {}
  }

  function saveAll() {
    // Persist current local state to draft stores first
    persistDrafts();
    // Auto-backup before publish
    createBackup("Auto-save înainte de Publicare");

    const payload = {
      categories: JSON.parse(JSON.stringify(categories)),
      jackpot: JSON.parse(JSON.stringify(jackpotConfig)),
      jackpotFever: JSON.parse(JSON.stringify(jackpotFeverConfig)),
      jackpotFever2: JSON.parse(JSON.stringify(jackpotFever2Config)),
      banners: JSON.parse(JSON.stringify(bannersConfig)),
      promo: JSON.parse(JSON.stringify(promoConfig)),
      gameEffects: JSON.parse(JSON.stringify(gameEffects)),
      themeColors: JSON.parse(JSON.stringify(themeColors)),
      winnersConfig: JSON.parse(JSON.stringify(winnersConfig)),
      topGamesConfig: JSON.parse(JSON.stringify(topGamesConfig)),
      toolbarConfig: JSON.parse(JSON.stringify(toolbarConfig)),
      sidebarNavConfig: JSON.parse(JSON.stringify(sidebarNavConfig)),
      sidebarWidgets: JSON.parse(JSON.stringify(sidebarWidgetsConfig)),
      playArenaConfig: JSON.parse(JSON.stringify(playArenaConfig)),
      vipConfig: JSON.parse(JSON.stringify(vipConfig)),
      headerWidgets: JSON.parse(JSON.stringify(headerWidgetsConfig)),
      headerConfig: JSON.parse(JSON.stringify(headerConfig)),
      auditLog: get(cmsAuditLog),
    };

    // Save CMS to server (also updates all stores internally)
    saveToServer(payload).then((success) => {
      if (!success) {
        alert(
          "EROARE: Salvarea a eșuat! Fișierul încărcat ar putea fi prea mare.",
        );
        return;
      }
      // Save Gamification to server
      try {
        fetch("/api/game", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gameData),
        });
        localStorage.removeItem("cms_gamification_draft_autosave");
      } catch (e) {
        console.error("Failed to save gamification data:", e);
      }

      // Update published stores immediately for live preview
      cmsCategories.set(payload.categories);
      cmsJackpot.set(payload.jackpot);
      cmsJackpotFever.set(payload.jackpotFever);
      cmsJackpotFever2.set(payload.jackpotFever2);
      cmsBanners.set(payload.banners);
      cmsPromoBanner.set(payload.promo);
      cmsGameEffects.set(payload.gameEffects);
      cmsThemeColors.set(payload.themeColors);
      cmsWinnersConfig.set(payload.winnersConfig);
      cmsTopGamesConfig.set(payload.topGamesConfig);
      cmsToolbarConfig.set(payload.toolbarConfig);
      cmsSidebarNavConfig.set(payload.sidebarNavConfig);
      cmsPlayArenaConfig.set(payload.playArenaConfig);
      cmsVipConfig.set(payload.vipConfig);
      saveSuccess = true;
      const activeCats = categories.filter((c) => c.showOnPage).length;
      const scheduledCats = categories.filter(
        (c) => c.timeStart || c.timeEnd,
      ).length;
      addAuditLog(
        "PUBLICARE",
        `S-au aplicat modificările. Configurație curentă: ${activeCats} categorii vizibile, ${scheduledCats} programate.`,
      );
      setTimeout(() => (saveSuccess = false), 3000);
    });
  }

  function persistDrafts() {
    cmsDraftCategories.set(JSON.parse(JSON.stringify(categories)));
    cmsDraftJackpot.set(JSON.parse(JSON.stringify(jackpotConfig)));
    cmsDraftJackpotFever.set(JSON.parse(JSON.stringify(jackpotFeverConfig)));
    cmsDraftJackpotFever2.set(JSON.parse(JSON.stringify(jackpotFever2Config)));
    cmsDraftBanners.set(JSON.parse(JSON.stringify(bannersConfig)));
    cmsDraftPromoBanner.set(JSON.parse(JSON.stringify(promoConfig)));
    cmsDraftGameEffects.set(JSON.parse(JSON.stringify(gameEffects)));
    cmsDraftThemeColors.set(JSON.parse(JSON.stringify(themeColors)));
    cmsDraftWinnersConfig.set(JSON.parse(JSON.stringify(winnersConfig)));
    cmsDraftTopGamesConfig.set(JSON.parse(JSON.stringify(topGamesConfig)));
    cmsDraftRtpConfig.set(JSON.parse(JSON.stringify(rtpConfig)));
    cmsDraftToolbarConfig.set(JSON.parse(JSON.stringify(toolbarConfig)));
    cmsDraftSidebarNavConfig.set(JSON.parse(JSON.stringify(sidebarNavConfig)));
    cmsDraftSidebarWidgets.set(JSON.parse(JSON.stringify(sidebarWidgetsConfig)));
    cmsDraftPlayArenaConfig.set(JSON.parse(JSON.stringify(playArenaConfig)));
    cmsDraftVipConfig.set(JSON.parse(JSON.stringify(vipConfig)));
    cmsDraftHeaderWidgets.set(JSON.parse(JSON.stringify(headerWidgetsConfig)));
    cmsDraftHeaderConfig.set(JSON.parse(JSON.stringify(headerConfig)));
  }

  function startPreview() {
    isPreviewMode.set(true);
    window.location.hash = "#home";
  }

  function addCategory() {
    const newCat = {
      id: "cat_" + Date.now(),
      name: "Categorie Nouă",
      icon: "",
      showOnPage: true,
      showInSidebar: true,
      showWhenLoggedOut: true,
      order: categories.length + 1,
      effect: "none",
      timeStart: "",
      timeEnd: "",
      filter: "all",
    };
    categories = [...categories, newCat];
    addAuditLog("Adăugare Categorie", `S-a creat categoria "${newCat.name}".`);
  }

  function moveUp(i) {
    if (i > 0) {
      let t = categories[i].order;
      categories[i].order = categories[i - 1].order;
      categories[i - 1].order = t;
      categories = [...categories].sort((a, b) => a.order - b.order);
    }
  }
  function moveDown(i) {
    if (i < categories.length - 1) {
      let t = categories[i].order;
      categories[i].order = categories[i + 1].order;
      categories[i + 1].order = t;
      categories = [...categories].sort((a, b) => a.order - b.order);
    }
  }

  let draggedCatIndex = null;
  let dragOverIndex = null;
  function dropCat(targetIndex) {
    if (draggedCatIndex === null || draggedCatIndex === targetIndex) return;
    const draggedCat = categories[draggedCatIndex];
    categories.splice(draggedCatIndex, 1);
    categories.splice(targetIndex, 0, draggedCat);
    categories.forEach((c, idx) => (c.order = idx + 1));
    categories = [...categories];
    draggedCatIndex = null;
    dragOverIndex = null;
  }

  function deleteCat(id) {
    const cat = categories.find((c) => c.id === id);
    if (confirm("Ștergi categoria?")) {
      categories = categories.filter((c) => c.id !== id);
      addAuditLog(
        "Ștergere Categorie",
        `S-a șters categoria "${cat?.name || id}".`,
      );
    }
  }

  function handleCatIconUpload(e, i) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        categories[i].icon = ev.target.result;
        categories = [...categories];
      };
      reader.readAsDataURL(file);
    }
  }

  function handleBannerUpload(e, i) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        bannersConfig.items[i].image = ev.target.result;
        bannersConfig = { ...bannersConfig };
      };
      reader.readAsDataURL(file);
    }
  }

  function handlePromoBgUpload(e, i) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        promoConfig[i].backgroundImage = ev.target.result;
        promoConfig = [...promoConfig];
      };
      reader.readAsDataURL(file);
    }
  }

  function handleBgUpload(e, index) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        jackpotConfig[index].backgroundImage = ev.target.result;
        jackpotConfig = [...jackpotConfig];
      };
      reader.readAsDataURL(file);
    }
  }

  function getItemStatus(item) {
    const t = new Date();
    if (item.timeEnd && new Date(item.timeEnd) < t) return "EXPIRATĂ";
    if (item.timeStart && new Date(item.timeStart) > t) return "PROGRAMATĂ";
    return "ACTIVĂ";
  }

  $: filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(adminSearchQuery.toLowerCase()),
  );
  $: filteredBanners = bannersConfig.items;
</script>

{#if !$isAdminLoggedIn}
  <div class="cms-login-bg cms-shell">
    <div class="cms-login-card">
      <div class="cms-login-header">
        <img src="/logo_cashpot.png" alt="CashPot" />
        <h2>Admin Access</h2>
      </div>
      <div class="cms-login-form">
        {#if loginError}<div class="cms-error">{loginError}</div>{/if}
        <div class="cms-input-group">
          <label>Username</label>
          <input type="text" bind:value={username} placeholder="admin" />
        </div>
        <div class="cms-input-group">
          <label>Password</label>
          <input
            type="password"
            bind:value={password}
            placeholder="••••••••"
            on:keydown={(e) => e.key === "Enter" && doLogin()}
          />
        </div>
        <button class="cms-login-btn" on:click={doLogin}>Autentificare</button>
      </div>
    </div>
  </div>
{:else}
  <div class="cms-shell">
    <!-- Sidebar -->
    <aside class="cms-sidebar">
      <div class="cms-sidebar-logo">
        <img src="/logo_cashpot.png" alt="CashPot" />
        <span>Smart CMS</span>
      </div>
      <nav class="cms-nav">
        <button
          class="cms-nav-item {activeTab === 'banners' ? 'active' : ''}"
          on:click={() => (activeTab = "banners")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="18"
            height="18"
            ><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line
              x1="3"
              y1="9"
              x2="21"
              y2="9"
            /><line x1="9" y1="21" x2="9" y2="9" /></svg
          >
          Acasă
        </button>
        <button
          class="cms-nav-item {activeTab === 'categories' ? 'active' : ''}"
          on:click={() => (activeTab = "categories")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          Categorii
        </button>
        <button
          class="cms-nav-item {activeTab === 'jackpot' ? 'active' : ''}"
          on:click={() => (activeTab = "jackpot")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="18"
            height="18"
            ><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg
          >
          Jackpoturi
        </button>
        <button
          class="cms-nav-item {activeTab === 'gamification' ? 'active' : ''}"
          on:click={() => (activeTab = "gamification")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="18"
            height="18"
            ><path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            /></svg
          >
          Gamification (Misiuni & Turnee)
        </button>
        <button
          class="cms-nav-item {activeTab === 'themes' ? 'active' : ''}"
          on:click={() => (activeTab = "themes")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
          Design & Branding
        </button>

        <button
          class="cms-nav-item {activeTab === 'header' ? 'active' : ''}"
          on:click={() => (activeTab = "header")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 3h18v4H3V3zM3 10h18v11H3V10z"/></svg>
          Header & Logo
        </button>

        <button
          class="cms-nav-item {activeTab === 'thumbnails' ? 'active' : ''}"
          on:click={() => (activeTab = "thumbnails")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="18"
            height="18"
            ><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle
              cx="8.5"
              cy="8.5"
              r="1.5"
            /><polyline points="21 15 16 10 5 21" /></svg
          >
          Thumbnails & Grid
        </button>


        <button
          class="cms-nav-item {activeTab === 'promo' ? 'active' : ''}"
          on:click={() => (activeTab = "promo")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="18"
            height="18"
            ><polygon
              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            /></svg
          >
          Promo Banner
        </button>
        <button
          class="cms-nav-item {activeTab === 'winners' ? 'active' : ''}"
          on:click={() => (activeTab = "winners")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="18"
            height="18"
            ><circle cx="12" cy="8" r="7" /><polyline
              points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"
            /></svg
          >
          Top Câștigători
        </button>
        <button
          class="cms-nav-item {activeTab === 'topgames' ? 'active' : ''}"
          on:click={() => (activeTab = "topgames")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="18"
            height="18"
            ><path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            /></svg
          >
          Top Jocuri
        </button>
        <button
          class="cms-nav-item {activeTab === 'rtp' ? 'active' : ''}"
          on:click={() => (activeTab = "rtp")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="18"
            height="18"
            ><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg
          >
          Jocuri RTP
        </button>
        <button
          class="cms-nav-item {activeTab === 'toolbar' ? 'active' : ''}"
          on:click={() => (activeTab = "toolbar")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          Toolbar Widget
        </button>
        <button
          class="cms-nav-item {activeTab === 'sidebarnav' ? 'active' : ''}"
          on:click={() => (activeTab = "sidebarnav")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
          Sidebar Nav
        </button>
        <button
          class="cms-nav-item {activeTab === 'widgets' ? 'active' : ''}"
          on:click={() => (activeTab = "widgets")}
          style="{activeTab === 'widgets' ? '' : 'color: #f59e0b;'}"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="2" y="3" width="8" height="8" rx="1"/><rect x="14" y="3" width="8" height="8" rx="1"/><rect x="2" y="13" width="8" height="8" rx="1"/><rect x="14" y="13" width="8" height="8" rx="1"/></svg>
          Widgets
        </button>
        <div
          style="height: 1px; background: rgba(255,255,255,0.05); margin: 15px 0;"
        ></div>
        <button
          class="cms-nav-item {activeTab === 'calendar' ? 'active' : ''}"
          on:click={() => (activeTab = "calendar")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="18"
            height="18"
            ><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line
              x1="16"
              y1="2"
              x2="16"
              y2="6"
            /><line x1="8" y1="2" x2="8" y2="6" /><line
              x1="3"
              y1="10"
              x2="21"
              y2="10"
            /></svg
          >
          Calendar & Timere
        </button>
        <button
          class="cms-nav-item {activeTab === 'history' ? 'active' : ''}"
          on:click={() => (activeTab = "history")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="18"
            height="18"
            ><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg
          >
          Istoric Modificări
        </button>
        <button
          class="cms-nav-item {activeTab === 'restore' ? 'active' : ''}"
          on:click={() => (activeTab = "restore")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="18"
            height="18"
            ><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path
              d="M3 3v5h5"
            /></svg
          >
          Backup &amp; Restore
        </button>

        <button
          class="cms-nav-item {activeTab === 'playarena' ? 'active' : ''}"
          on:click={() => (activeTab = "playarena")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="18"
            height="18"
            ><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          Play Arena Hub
        </button>

        <button
          class="cms-nav-item {activeTab === 'vip' ? 'active' : ''}"
          on:click={() => (activeTab = "vip")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Club VIP Setup
        </button>
      </nav>
      <div class="cms-sidebar-footer">
        <button class="cms-btn-ghost" on:click={doLogout}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="16"
            height="16"
            ><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline
              points="16 17 21 12 16 7"
            /><line x1="21" y1="12" x2="9" y2="12" /></svg
          >
          Ieșire
        </button>
        <a
          href="#{currentPreviewMeta.view === 'home' || currentPreviewMeta.view.startsWith('preview_') ? '' : currentPreviewMeta.view}"
          on:click|preventDefault={() => {
            window.location.hash = currentPreviewMeta.view === 'home' || currentPreviewMeta.view.startsWith('preview_') ? '' : currentPreviewMeta.view;
          }}
          class="cms-btn-ghost"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="16"
            height="16"
            ><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg
          >
          Spre Site
        </a>
      </div>
    </aside>

    <!-- Main -->
    <div class="cms-main">
      <div class="cms-topbar">
        <div style="flex: 1;"></div>
        <div class="cms-topbar-search" style="position: relative;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="text" placeholder="Caută în admin..." bind:value={adminSearchQuery} />
          {#if adminSearchQuery}
            <div class="search-bubble" style="display: flex;">{filteredCategories.length} rezultate</div>
          {/if}
        </div>
        <div class="cms-topbar-actions">
          {#if saveSuccess}<span class="cms-save-toast">✓ Salvat cu succes!</span>{/if}

          <!-- PREVIEW BUTTON -->
          <button
            on:click={togglePreview}
            style="
              display: flex; align-items: center; gap: 8px;
              padding: 10px 24px; border-radius: 99px; font-weight: 800; font-size: 13px;
              cursor: pointer; border: none; transition: all 0.2s;
              background: {showPreviewPanel ? 'linear-gradient(135deg,#7c3aed,#4c1d95)' : 'rgba(255,255,255,0.08)'};
              color: {showPreviewPanel ? '#fff' : 'var(--text-muted)'};
            "
          >
            {showPreviewPanel ? 'Închide Preview' : 'Preview Live'}
          </button>

          <button class="cms-btn-primary" on:click={saveAll}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Publică Modificările
          </button>
        </div>
      </div>

      <!-- SPLIT-SCREEN PREVIEW PANEL -->
      {#if showPreviewPanel}
        <div style="
          position: fixed; top: 0; right: 0; bottom: 0;
          width: {previewDevice === 'mobile' ? '400px' : '55%'};
          background: #0a0a1a;
          border-left: 2px solid rgba(124,58,237,0.4);
          z-index: 9999;
          display: flex; flex-direction: column;
          box-shadow: -20px 0 60px rgba(0,0,0,0.6);
          transition: width 0.3s ease;
        ">
          <!-- Preview header -->
          <div style="
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px 16px;
            background: rgba(124,58,237,0.15);
            border-bottom: 1px solid rgba(124,58,237,0.3);
            flex-shrink: 0;
          ">
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:8px; height:8px; border-radius:50%; background:#22c55e; animation: pulse 2s infinite;"></div>
              <span style="font-weight:800; font-size:13px; color:#a78bfa;">Preview: {currentPreviewMeta.label} (Draft)</span>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <!-- Device switch -->
              <div style="display:flex; gap:4px; background:rgba(0,0,0,0.3); padding:4px; border-radius:99px;">
                <button
                  on:click={() => { previewDevice = 'mobile'; }}
                  style="padding:4px 12px; border-radius:99px; border:none; font-size:11px; font-weight:700; cursor:pointer;
                    background:{previewDevice==='mobile' ? 'rgba(124,58,237,0.7)' : 'transparent'};
                    color:{previewDevice==='mobile' ? '#fff' : 'var(--text-muted)'};"
                >📱 Mobile</button>
                <button
                  on:click={() => { previewDevice = 'desktop'; }}
                  style="padding:4px 12px; border-radius:99px; border:none; font-size:11px; font-weight:700; cursor:pointer;
                    background:{previewDevice==='desktop' ? 'rgba(124,58,237,0.7)' : 'transparent'};
                    color:{previewDevice==='desktop' ? '#fff' : 'var(--text-muted)'};"
                >🖥 Desktop</button>
              </div>
              <!-- Refresh -->
              <button
                on:click={refreshPreview}
                style="width:30px; height:30px; border-radius:50%; background:rgba(255,255,255,0.08); border:none; cursor:pointer; color:var(--text-muted); display:flex; align-items:center; justify-content:center;"
                title="Reîmprospătează preview"
              >↺</button>
              <!-- Close -->
              <button
                on:click={togglePreview}
                style="width:30px; height:30px; border-radius:50%; background:rgba(255,255,255,0.08); border:none; cursor:pointer; color:var(--text-muted); display:flex; align-items:center; justify-content:center; font-size:16px;"
              >✕</button>
            </div>
          </div>

          <!-- iframe wrapper -->
          <div style="flex:1; overflow:hidden; position:relative; {previewDevice==='mobile' ? 'display:flex; align-items:center; justify-content:center; background:#111; padding:20px;' : ''}">
            {#if previewDevice === 'mobile'}
              <div style="width:375px; height:100%; max-height:calc(100% - 0px); border-radius:16px; overflow:hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.8); border:2px solid rgba(255,255,255,0.1);">
                <iframe
                  bind:this={previewIframe}
                  src={previewUrl}
                  style="width:100%; height:100%; border:none;"
                  title="Preview Mobile"
                ></iframe>
              </div>
            {:else}
              <iframe
                bind:this={previewIframe}
                src={previewUrl}
                style="width:100%; height:100%; border:none;"
                title="Preview Desktop"
              ></iframe>
            {/if}
          </div>

          <!-- Publish from preview bar -->
          <div style="
            padding: 12px 16px;
            border-top: 1px solid rgba(124,58,237,0.3);
            display: flex; gap: 10px; align-items:center;
            background: rgba(124,58,237,0.08);
            flex-shrink: 0;
          ">
            <span style="font-size:12px; color:var(--text-muted); flex:1;">Verifică modificările în preview înainte de publicare.</span>
            <button
              on:click={() => { saveAll(); showPreviewPanel = false; isPreviewMode.set(false); }}
              style="padding:10px 24px; border-radius:99px; background:linear-gradient(135deg,#f5c842,#d97706); color:#1a1200; font-weight:900; font-size:13px; border:none; cursor:pointer;"
            >✅ Publică Acum</button>
          </div>
        </div>

        <!-- Dim overlay on cms-main when preview open -->
        <div
          style="position:fixed; top:0; left:220px; right:{previewDevice==='mobile'?'400px':'55%'}; bottom:0; background:rgba(0,0,0,0.25); z-index:9998; pointer-events:none;"
        ></div>
      {/if}

      <div class="cms-content">
        <!-- TAB: CATEGORIES -->
        {#if activeTab === "categories"}
          <div class="cms-tab-content">
            <h1 class="cms-page-title-main">{getTabTitle(activeTab)}</h1>
            {#each filteredCategories as cat, i}
              <div
                class="cms-glass-card cms-row"
                draggable="true"
                on:dragstart={(e) => {
                  draggedCatIndex = i;
                  e.dataTransfer.effectAllowed = "move";
                }}
                on:dragover|preventDefault
                on:dragenter={() => (dragOverIndex = i)}
                on:dragleave={() =>
                  dragOverIndex === i ? (dragOverIndex = null) : null}
                on:drop|preventDefault={(e) => dropCat(i)}
                style="transition: all 0.2s; {dragOverIndex === i
                  ? 'border: 2px dashed var(--accent-gold); opacity: 0.7; transform: scale(1.01);'
                  : draggedCatIndex === i
                    ? 'opacity: 0.4;'
                    : ''}"
              >
                <div
                  class="cms-row-order"
                  style="cursor: grab;"
                  title="Trage pentru a reordona"
                >
                  <button
                    class="cms-btn-icon"
                    on:click={() => moveUp(i)}
                    disabled={i === 0}>↑</button
                  >
                  <span class="cms-order-num">#{cat.order}</span>
                  <button
                    class="cms-btn-icon"
                    on:click={() => moveDown(i)}
                    disabled={i === categories.length - 1}>↓</button
                  >
                </div>
                <div class="cms-row-body">
                  <div
                    style="display: flex; flex-direction: column; gap: 12px;"
                  >
                    <!-- ROW 1: Basic Info -->
                    <div
                      style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; align-items: start;"
                    >
                      <div class="cms-field">
                        <label>Nume Pagină / Categorie</label>
                        <input
                          type="text"
                          bind:value={cat.name}
                          placeholder="Numele afișat..."
                          style="border-radius: 99px;"
                        />
                      </div>
                      <div class="cms-field">
                        <label>Furnizor / Producător</label>
                        <select bind:value={cat.provider} style="border-radius: 99px;">
                          <option value="all">Toți Furnizorii</option>
                          {#each uniqueProviders.filter(p => p !== 'All') as prov}
                            <option value={prov}>{prov}</option>
                          {/each}
                        </select>
                      </div>
                      <div class="cms-field">
                        <label>Filtru Jocuri</label>
                        <select bind:value={cat.filter} style="border-radius: 99px;">
                          <option value="all">Toate Jocurile</option>
                          <option value="favorites">Jocurile Favorite</option>
                          <option value="slice_5">Top 5 Jucate</option>
                          <option value="reverse">Ultimele Adăugate</option>
                        </select>
                      </div>

                      <div class="cms-field">
                        <label>Mărime Grid Jocuri</label>
                        <select bind:value={cat.thumbnailSize} style="border-radius: 99px;">
                          <option value="S">S — 4 jocuri / rând</option>
                          <option value="M">M — 2 jocuri / rând</option>
                          <option value="L">L — 1 joc / rând (full)</option>
                        </select>
                      </div>

                      <div class="cms-field">
                        <label>Afișare Jocuri</label>
                        <label class="cms-toggle-label" style="color:#22c55e; margin-top:8px;">
                          <input type="checkbox"
                            checked={cat.showGames !== false}
                            on:change={(e) => { cat.showGames = e.target.checked; categories = [...categories]; }}
                          /> Afișează grila de jocuri
                        </label>
                        <div style="font-size:10px; color:var(--text-muted); margin-top:4px;">Dezactivat = secțiunea apare fără jocuri (doar titlu/jackpot)</div>
                      </div>

                      <div class="cms-field" style="grid-column: span 2;">
                        <label>Iconiță / Logo Custom</label>
                        <div style="display: flex; gap: 12px; align-items: center;">
                          <select
                            bind:value={cat.icon}
                            style="flex: 1; border-radius: 99px;"
                          >
                            <option value="">Nicio iconiță</option>
                            <option value="🎰">🎰 Aparate</option>
                            <option value="🃏">🃏 Live Casino</option>
                            <option value="🍒">🍒 Fructe</option>
                            <option value="⭐">⭐ Favorite</option>
                          </select>
                          <span style="font-size: 11px; color: var(--text-muted); font-weight: 800;">SAU</span>
                          <div style="position: relative; flex: 1.5;">
                              <input type="file" accept="image/*" on:change={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                          cat.icon = ev.target.result;
                                          categories = [...categories];
                                      };
                                      reader.readAsDataURL(file);
                                  }
                              }} style="position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer;" />
                              <button class="cms-btn-sm" style="width: 100%; border: 1px solid var(--border-color); background: var(--bg-hover); padding: 10px; border-radius: 99px;">Încarcă Logo Imagine</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- ROW 2: Visibility & Scheduling -->
                    <div
                      style="display: flex; gap: 24px; align-items: center; background: rgba(0,0,0,0.2); padding: 12px 20px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.05); margin-top: 10px;"
                    >
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <label class="cms-switch">
                          <input type="checkbox" bind:checked={cat.showOnPage} />
                          <span class="cms-slider"></span>
                        </label>
                        <span style="font-size: 11px; font-weight: 800; color: #22c55e;">VIZIBIL SITE</span>
                      </div>

                      <div style="display: flex; align-items: center; gap: 8px;">
                        <label class="cms-switch">
                          <input type="checkbox" bind:checked={cat.showInSidebar} />
                          <span class="cms-slider"></span>
                        </label>
                        <span style="font-size: 11px; font-weight: 800; color: #60a5fa;">SIDEBAR</span>
                      </div>

                      <div style="display: flex; align-items: center; gap: 8px;">
                        <label class="cms-switch">
                          <input type="checkbox" bind:checked={cat.showWhenLoggedOut} />
                          <span class="cms-slider"></span>
                        </label>
                        <span style="font-size: 11px; font-weight: 800; color: var(--accent-gold);">LOGOUT VIEW</span>
                      </div>
                    </div>

                      <div
                        style="display: flex; gap: 16px; align-items: center;"
                      >
                        <label class="cms-toggle-label" style="color: #60a5fa;"
                          ><input
                            type="checkbox"
                            bind:checked={cat.isScheduled}
                            on:change={(e) => {
                              if (!e.target.checked) {
                                cat.timeStart = "";
                                cat.timeEnd = "";
                              }
                            }}
                          /> Programabil</label
                        >
                        {#if cat.isScheduled}
                          <div
                            style="display: flex; gap: 8px; align-items: center;"
                          >
                            <input
                              type="datetime-local"
                              bind:value={cat.timeStart}
                              style="background:var(--bg-hover); border:1px solid var(--border-color); color:var(--text-main); padding:4px 8px; border-radius:4px; font-size:11px; outline:none;"
                            />
                            <span
                              style="color: var(--text-muted); font-size: 11px;"
                              >-</span
                            >
                            <input
                              type="datetime-local"
                              bind:value={cat.timeEnd}
                              style="background:var(--bg-hover); border:1px solid var(--border-color); color:var(--text-main); padding:4px 8px; border-radius:4px; font-size:11px; outline:none;"
                            />
                          </div>
                        {/if}
                      </div>
                  </div>
                </div>
                <button
                  class="cms-btn-danger"
                  on:click={() => deleteCat(cat.id)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    width="16"
                    height="16"
                    ><polyline points="3 6 5 6 21 6" /><path
                      d="M19 6l-1 14H6L5 6"
                    /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg
                  >
                </button>
              </div>
            {/each}
            <button class="cms-btn-add" on:click={addCategory}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                width="18"
                height="18"
                ><line x1="12" y1="5" x2="12" y2="19" /><line
                  x1="5"
                  y1="12"
                  x2="19"
                  y2="12"
                /></svg
              >
              Adaugă Categorie Nouă
            </button>

            <!-- Contextual Integrated Preview -->
            <div class="cms-context-preview">
              <div class="cms-context-preview-header">
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:6px; height:6px; border-radius:50%; background:#22c55e;"></div>
                  <span>PREVIZUALIZARE: {currentPreviewMeta.label}</span>
                </div>
                <div style="display:flex; gap:10px;">
                   <button class="cms-btn-mini" on:click={() => previewDevice = previewDevice === 'mobile' ? 'desktop' : 'mobile'}>
                     {previewDevice === 'mobile' ? '🖥️ Desktop' : '📱 Mobile'}
                   </button>
                   <button class="cms-btn-mini" on:click={refreshPreview}>🔄 Refresh</button>
                </div>
              </div>
              <div class="cms-context-preview-body {previewDevice}">
                <iframe src={previewUrl} title="Module Preview"></iframe>
              </div>
            </div>
          </div>
        {/if}

        <!-- TAB: THUMBNAILS -->
        {#if activeTab === "thumbnails"}
          <div class="cms-tab-content">
            <h1 class="cms-page-title-main">{getTabTitle(activeTab)}</h1>
            <div class="cms-glass-card" style="padding: 24px;">
              <h3 class="cms-section-title">Efecte Thumbnails & Programare</h3>
              <p
                style="color: var(--text-muted); font-size: 13px; margin-bottom: 20px;"
              >
                Aici poți aplica efecte vizuale (ex. Fulger, Blink) pe
                thumbnail-urile oricărui joc. Efectele pot fi programate și
                configurate cu interval (secunde).
              </p>

              <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                <div class="cms-field" style="flex: 1; position: relative;">
                  <input
                    type="text"
                    bind:value={promoGameSearch}
                    placeholder="Caută un joc..."
                    style="background: rgba(0,0,0,0.2); padding: 12px 100px 12px 12px; font-size: 14px; border: 1px solid var(--border-color); border-radius: 8px; width: 100%;"
                  />
                  {#if promoGameSearch}
                    <div class="search-bubble" style="display: flex;">{filteredPromoGames.length} jocuri</div>
                  {/if}
                </div>
                <div class="cms-field" style="width: 200px;">
                  <select
                    bind:value={promoGameProvider}
                    style="background: rgba(0,0,0,0.2); padding: 12px; font-size: 14px; border: 1px solid var(--border-color); border-radius: 8px;"
                  >
                    {#each uniqueProviders as prov}
                      <option value={prov}
                        >{prov === "All" ? "Toți Providerii" : prov}</option
                      >
                    {/each}
                  </select>
                </div>
              </div>

              <div
                style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;"
              >
                {#each filteredPromoGames.slice(0, 50) as game}
                  <div
                    style="background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; position: relative; overflow: hidden;"
                  >
                    {#if gameEffects[game.n] && gameEffects[game.n].effect !== "none"}
                      <div
                        style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--accent-gold);"
                      ></div>
                    {/if}
                    <div style="display: flex; gap: 12px; align-items: center;">
                      <div
                        class="game-card {gameEffects[game.n] &&
                        gameEffects[game.n].effect !== 'none'
                          ? 'effect-' + gameEffects[game.n].effect
                          : ''}"
                        style="width: 60px; height: 60px; min-height: 60px; flex-shrink: 0; padding: 0; border: none; background: transparent; {gameEffects[
                          game.n
                        ]?.effectInterval
                          ? '--effect-interval: ' +
                            gameEffects[game.n].effectInterval +
                            's;'
                          : ''}"
                      >
                        <div
                          class="img-wrapper"
                          style="width: 100%; height: 100%; border-radius: 8px;"
                        >
                          <img
                            src={game.img}
                            alt={game.n}
                            style="width: 100%; height: 100%; border-radius: 8px; object-fit: cover;"
                          />
                        </div>
                      </div>
                      <div style="flex: 1;">
                        <div
                          style="font-weight: 700; font-size: 14px; color: var(--text-main); margin-bottom: 4px;"
                        >
                          {game.n}
                        </div>
                        <div
                          style="font-size: 11px; color: var(--text-muted); padding: 2px 6px; background: rgba(255,255,255,0.05); border-radius: 4px; display: inline-block;"
                        >
                          {game.p}
                        </div>
                      </div>
                      <label
                        class="cms-switch"
                        title="Activează/Dezactivează Efect"
                      >
                        <input
                          type="checkbox"
                          checked={gameEffects[game.n] &&
                            gameEffects[game.n].effect !== "none"}
                          on:change={(e) => {
                            if (!gameEffects[game.n])
                              gameEffects[game.n] = {
                                effect: "none",
                                effectInterval: 5,
                                timeStart: "",
                                timeEnd: "",
                                isScheduled: false,
                              };
                            gameEffects[game.n].effect = e.target.checked
                              ? "blink"
                              : "none";
                            if (!e.target.checked) {
                              gameEffects[game.n].isScheduled = false;
                              gameEffects[game.n].timeStart = "";
                              gameEffects[game.n].timeEnd = "";
                            }
                            gameEffects = { ...gameEffects };
                          }}
                        />
                        <span class="cms-slider"></span>
                      </label>
                    </div>

                    {#if gameEffects[game.n] && gameEffects[game.n].effect !== "none"}
                      <div
                        style="display: flex; gap: 8px; align-items: center;"
                      >
                        <select
                          on:change={(e) => {
                            gameEffects[game.n].effect = e.target.value;
                            gameEffects = { ...gameEffects };
                          }}
                          value={gameEffects[game.n]?.effect || "blink"}
                          style="flex: 1; padding: 6px; font-size: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; color: #fff;"
                        >
                          <option value="hover-zoom">Zoom la Hover</option>
                          <option value="blink">Blink Subtil</option>
                          <option value="lightning">⚡ Fulger</option>
                          <option value="glow-border">🌟 Contur Neon</option>
                          <option value="glass-shatter"
                            >💥 Spargere Sticlă</option
                          >
                          <option value="shake">📳 Vibrație (Shake)</option>
                          <option value="float">🫧 Plutire (Float)</option>
                        </select>
                        <input
                          type="number"
                          on:input={(e) => {
                            gameEffects[game.n].effectInterval = e.target.value;
                            gameEffects = { ...gameEffects };
                          }}
                          value={gameEffects[game.n]?.effectInterval || 5}
                          min="1"
                          max="60"
                          title="Secunde"
                          style="width: 50px; padding: 6px; font-size: 12px; text-align: center; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; color: #fff;"
                        />
                      </div>

                      <div
                        style="display: flex; flex-direction: column; gap: 6px; background: rgba(0,0,0,0.1); padding: 8px; border-radius: 8px;"
                      >
                        <label
                          style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #60a5fa; cursor: pointer;"
                        >
                          <input
                            type="checkbox"
                            on:change={(e) => {
                              gameEffects[game.n].isScheduled =
                                e.target.checked;
                              if (!e.target.checked) {
                                gameEffects[game.n].timeStart = "";
                                gameEffects[game.n].timeEnd = "";
                              }
                              gameEffects = { ...gameEffects };
                            }}
                            checked={gameEffects[game.n]?.isScheduled || false}
                          /> Programabil
                        </label>
                        {#if gameEffects[game.n]?.isScheduled}
                          <div
                            style="display: flex; gap: 8px; align-items: center;"
                          >
                            <span
                              style="font-size: 10px; color: var(--text-muted); width: 40px;"
                              >De la:</span
                            >
                            <input
                              type="datetime-local"
                              on:input={(e) => {
                                gameEffects[game.n].timeStart = e.target.value;
                                gameEffects = { ...gameEffects };
                              }}
                              value={gameEffects[game.n]?.timeStart || ""}
                              style="flex: 1; padding: 4px; font-size: 11px; background: transparent; border: 1px solid var(--border-color); border-radius: 4px; color: #fff;"
                            />
                          </div>
                          <div
                            style="display: flex; gap: 8px; align-items: center;"
                          >
                            <span
                              style="font-size: 10px; color: var(--text-muted); width: 40px;"
                              >Până la:</span
                            >
                            <input
                              type="datetime-local"
                              on:input={(e) => {
                                gameEffects[game.n].timeEnd = e.target.value;
                                gameEffects = { ...gameEffects };
                              }}
                              value={gameEffects[game.n]?.timeEnd || ""}
                              style="flex: 1; padding: 4px; font-size: 11px; background: transparent; border: 1px solid var(--border-color); border-radius: 4px; color: #fff;"
                            />
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>

            <!-- Contextual Integrated Preview -->
            <div class="cms-context-preview">
              <div class="cms-context-preview-header">
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:6px; height:6px; border-radius:50%; background:#22c55e;"></div>
                  <span>PREVIZUALIZARE: GRID JOCURI & CARDURI</span>
                </div>
                <div style="display:flex; gap:10px;">
                   <button class="cms-btn-mini" on:click={() => previewDevice = previewDevice === 'mobile' ? 'desktop' : 'mobile'}>
                     {previewDevice === 'mobile' ? '🖥️ Desktop' : '📱 Mobile'}
                   </button>
                   <button class="cms-btn-mini" on:click={refreshPreview}>🔄 Refresh</button>
                </div>
              </div>
              <div class="cms-context-preview-body {previewDevice}">
                <iframe src={previewUrl} title="Module Preview"></iframe>
              </div>
            </div>
          </div>
        {/if}

        <!-- TAB: BANNERS -->
        {#if activeTab === "banners"}
          <div class="cms-tab-content">
            <h1 class="cms-page-title-main">{getTabTitle(activeTab)}</h1>
            <div class="cms-glass-card" style="padding: 28px;">
              <h3 class="cms-section-title">Layout Bannere</h3>
              <div class="cms-layout-picker">
                {#each [["slider", "Slider / Carusel Automat"], ["1_big_2_small", "1 Mare + 2 Mici"], ["4_small", "4 Mici"], ["4_medium", "4 Medii"], ["2_big", "2 Mari"]] as [val, label]}
                  <button
                    class="cms-layout-btn {bannersConfig.layout === val
                      ? 'active'
                      : ''}"
                    on:click={() =>
                      (bannersConfig = { ...bannersConfig, layout: val })}
                  >
                    {label}
                  </button>
                {/each}
              </div>
              
              {#if bannersConfig.layout === "slider"}
                <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
                  <div class="cms-field" style="display: flex; align-items: center; margin-bottom: 16px;">
                    <label class="cms-switch">
                      <input type="checkbox" bind:checked={bannersConfig.autoSlide} />
                      <span class="cms-slider"></span>
                    </label>
                    <span style="margin-left: 10px; color: var(--text-main); font-weight: 600;">Schimbare Automată a Bannerelor</span>
                  </div>
                  {#if bannersConfig.autoSlide}
                    <div class="cms-field">
                      <label>Timp între bannere (secunde)</label>
                      <input type="range" min="2" max="15" bind:value={bannersConfig.slideInterval} style="width: 200px;" />
                      <span style="margin-left: 12px; font-weight: 700; color: var(--accent-gold);">{bannersConfig.slideInterval}s</span>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>

            {#each filteredBanners as banner, i}
              <div
                class="cms-glass-card cms-banner-card"
                style="display: flex; gap: 24px; opacity: {banner.enabled !==
                false
                  ? '1'
                  : '0.5'}; transition: opacity 0.2s;"
              >
                <!-- Image Preview & Designer Info -->
                <div
                  class="cms-banner-preview"
                  style="width: 400px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px;"
                >
                  {#if banner.image}
                    <!-- svelte-ignore a11y-missing-attribute -->
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <button
                      type="button"
                      on:click={() => (previewBannerModal = banner)}
                      style="background:none; border:none; padding:0; display:block; cursor:zoom-in; position:relative; width: 100%;"
                    >
                      {#if banner.image.includes('data:video/') || banner.image.endsWith('.mp4') || banner.image.endsWith('.webm') || banner.image.endsWith('.mov')}
                        <!-- svelte-ignore a11y-media-has-caption -->
                        <video
                          src={banner.image}
                          autoplay
                          loop
                          muted
                          playsinline
                          style="width: 100%; height: auto; border-radius: 12px; border: 1px solid var(--border-color);"
                          on:loadedmetadata={(e) => {
                            banner._width = e.target.videoWidth;
                            banner._height = e.target.videoHeight;
                            bannersConfig = bannersConfig;
                          }}
                        ></video>
                      {:else}
                        <img
                          src={banner.image}
                          alt="preview"
                          style="width: 100%; height: auto; border-radius: 12px; border: 1px solid var(--border-color);"
                          on:load={(e) => {
                            banner._width = e.target.naturalWidth;
                            banner._height = e.target.naturalHeight;
                            bannersConfig = bannersConfig;
                          }}
                        />
                      {/if}
                      <div
                        style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; color: #fff; pointer-events: none; border: 1px solid rgba(255,255,255,0.2);"
                      >
                        🔍 Click pentru Detalii & Full-Size
                      </div>
                    </button>
                    {#if banner._width && banner._height}
                      <div
                        style="background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 6px; font-size: 11px; color: var(--text-muted); display: flex; justify-content: space-between;"
                      >
                        <span>📐 Rezoluție:</span>
                        <span
                          style="color: var(--accent-gold); font-weight: 700;"
                          >{banner._width} x {banner._height} px</span
                        >
                      </div>
                    {/if}
                  {:else}
                    <div
                      class="cms-banner-placeholder"
                      style="width: 100%; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); border-radius: 12px; border: 1px dashed var(--border-color);"
                    >
                      Nicio imagine / video
                    </div>
                  {/if}
                  <label
                    style="cursor:pointer; padding:10px; background:var(--bg-hover); border:1px solid var(--border-color); border-radius:var(--radius-sm); font-size:12px; font-weight: 600; text-align:center; width: 100%; transition: background 0.2s;"
                  >
                    📁 Încarcă Imagine / Video
                    <input
                      type="file"
                      accept="image/*,video/*"
                      on:change={(e) => handleBannerUpload(e, i)}
                      style="display:none;"
                    />
                  </label>
                  <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
                    <label style="font-size: 10px; font-weight: 700; color: var(--text-muted);">SAU INTRODU CALE / URL CUSTOM:</label>
                    <input
                      type="text"
                      bind:value={banner.image}
                      placeholder="Cale / URL custom imagine sau video..."
                      style="width: 100%; padding: 8px 12px; font-size: 11px; background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-main);"
                    />
                  </div>
                </div>

                <!-- Banner Fields -->
                <div class="cms-banner-fields" style="flex: 1;">
                  <div
                    style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px;"
                  >
                    <h4
                      class="cms-banner-num"
                      style="margin: 0; font-size: 16px;"
                    >
                      Banner #{i + 1}
                    </h4>
                    <label
                      class="cms-switch"
                      title="Activează/Dezactivează Banner"
                    >
                      <input
                        type="checkbox"
                        checked={banner.enabled !== false}
                        on:change={(e) => {
                          banner.enabled = e.target.checked;
                          bannersConfig = { ...bannersConfig };
                        }}
                      />
                      <span class="cms-slider"></span>
                    </label>
                  </div>

                  <div
                    style="display: grid; grid-template-columns: 1fr 1.5fr 1.5fr; gap: 12px; margin-bottom: 16px;"
                  >
                    <div class="cms-field">
                      <label>Tag</label><input
                        type="text"
                        bind:value={banner.tag}
                      />
                    </div>
                    <div class="cms-field">
                      <label>Titlu</label><input
                        type="text"
                        bind:value={banner.title}
                      />
                    </div>
                    <div class="cms-field">
                      <label>Subtitlu</label><input
                        type="text"
                        bind:value={banner.subtitle}
                      />
                    </div>
                  </div>

                  <div
                    style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;"
                  >
                    <div class="cms-field">
                      <label>Mărime Titlu</label>
                      <select
                        bind:value={banner.titleSize}
                        style="width:100%; padding:10px; background:var(--bg-dark); border:1px solid var(--border-color); border-radius:8px; color:var(--text-main); font-size:13px;"
                      >
                        <option value="">Automat (implicit)</option>
                        <option value="12px">12px — Mic</option>
                        <option value="14px">14px</option>
                        <option value="16px">16px</option>
                        <option value="18px">18px</option>
                        <option value="20px">20px</option>
                        <option value="24px">24px</option>
                        <option value="28px">28px</option>
                        <option value="32px">32px</option>
                        <option value="36px">36px</option>
                        <option value="40px">40px</option>
                        <option value="48px">48px — Mare</option>
                        <option value="56px">56px</option>
                        <option value="64px">64px</option>
                        <option value="72px">72px — Titlu XL</option>
                        <option value="80px">80px</option>
                        <option value="96px">96px — Gigant</option>
                      </select>
                    </div>
                    <div class="cms-field">
                      <label>Mărime Subtitlu</label>
                      <select
                        bind:value={banner.subtitleSize}
                        style="width:100%; padding:10px; background:var(--bg-dark); border:1px solid var(--border-color); border-radius:8px; color:var(--text-main); font-size:13px;"
                      >
                        <option value="">Automat (implicit)</option>
                        <option value="11px">11px — Mic</option>
                        <option value="13px">13px</option>
                        <option value="14px">14px</option>
                        <option value="16px">16px</option>
                        <option value="18px">18px</option>
                        <option value="20px">20px</option>
                        <option value="22px">22px</option>
                        <option value="24px">24px</option>
                        <option value="28px">28px</option>
                        <option value="32px">32px — Mare</option>
                        <option value="36px">36px</option>
                        <option value="40px">40px</option>
                      </select>
                    </div>
                  </div>

                  <div
                    style="display: flex; gap: 24px; align-items: stretch; background: rgba(0,0,0,0.15); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color);"
                  >
                    <div
                      style="display: flex; flex-direction: column; gap: 8px; width: 220px; border-right: 1px solid rgba(255,255,255,0.05); padding-right: 24px;"
                    >
                      <label
                        style="font-size: 11px; font-weight: 600; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;"
                      >
                        BUTON ACTIVAT
                        <label
                          class="cms-switch"
                          style="transform: scale(0.8); margin: 0;"
                        >
                          <input
                            type="checkbox"
                            bind:checked={banner.showButton}
                          />
                          <span class="cms-slider"></span>
                        </label>
                      </label>
                      {#if banner.showButton}
                        <input
                          type="text"
                          bind:value={banner.buttonText}
                          placeholder="Text buton..."
                          style="padding: 8px; font-size: 12px; background: rgba(0,0,0,0.3);"
                        />
                      {/if}
                    </div>

                    <div
                      style="flex: 1; display: flex; flex-direction: column; gap: 12px;"
                    >
                      <label
                        style="font-size: 11px; font-weight: 600; color: var(--text-muted);"
                        >PALETĂ CULORI CARD & BUTON</label
                      >
                      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                        <div
                          style="display: flex; align-items: center; gap: 8px;"
                        >
                          <input
                            type="color"
                            bind:value={banner.textColor}
                            style="width: 28px; height: 28px; border: none; border-radius: 4px; cursor: pointer; background: transparent; padding: 0;"
                          />
                          <span
                            style="font-size: 11px; color: var(--text-main);"
                            >Text Titlu</span
                          >
                        </div>
                        <div
                          style="display: flex; align-items: center; gap: 8px;"
                        >
                          <input
                            type="color"
                            bind:value={banner.buttonColor}
                            style="width: 28px; height: 28px; border: none; border-radius: 4px; cursor: pointer; background: transparent; padding: 0;"
                          />
                          <span
                            style="font-size: 11px; color: var(--text-main);"
                            >Fundal Buton</span
                          >
                        </div>
                        <div
                          style="display: flex; align-items: center; gap: 8px;"
                        >
                          <input
                            type="color"
                            bind:value={banner.buttonTextColor}
                            style="width: 28px; height: 28px; border: none; border-radius: 4px; cursor: pointer; background: transparent; padding: 0;"
                          />
                          <span
                            style="font-size: 11px; color: var(--text-main);"
                            >Text Buton</span
                          >
                        </div>
                        <div
                          style="display: flex; align-items: center; gap: 8px;"
                        >
                          <input
                            type="color"
                            bind:value={banner.buttonBorderColor}
                            style="width: 28px; height: 28px; border: none; border-radius: 4px; cursor: pointer; background: transparent; padding: 0;"
                          />
                          <span
                            style="font-size: 11px; color: var(--text-main);"
                            >Contur Buton</span
                          >
                        </div>
                        <div
                          style="display: flex; align-items: center; gap: 8px;"
                        >
                          <select
                            bind:value={banner.buttonBorderWidth}
                            style="padding: 4px 8px; border-radius: 4px; background: rgba(0,0,0,0.3); color: #fff; border: 1px solid var(--border-color); outline: none; font-size: 11px;"
                          >
                            <option value={0}>0px</option>
                            <option value={1}>1px</option>
                            <option value={2}>2px</option>
                            <option value={3}>3px</option>
                          </select>
                          <span
                            style="font-size: 11px; color: var(--text-main);"
                            >Grosime</span
                          >
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            {/each}

            <!-- Contextual Integrated Preview -->
            <div class="cms-context-preview">
              <div class="cms-context-preview-header">
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:6px; height:6px; border-radius:50%; background:#22c55e;"></div>
                  <span>PREVIZUALIZARE: BANNERE PRINCIPALE</span>
                </div>
                <div style="display:flex; gap:10px;">
                   <button class="cms-btn-mini" on:click={() => previewDevice = previewDevice === 'mobile' ? 'desktop' : 'mobile'}>
                     {previewDevice === 'mobile' ? '🖥️ Desktop' : '📱 Mobile'}
                   </button>
                   <button class="cms-btn-mini" on:click={refreshPreview}>🔄 Refresh</button>
                </div>
              </div>
              <div class="cms-context-preview-body {previewDevice}">
                <iframe src={previewUrl} title="Module Preview"></iframe>
              </div>
            </div>
          </div>
        {/if}

        <!-- TAB: JACKPOT -->
        {#if activeTab === "jackpot"}
          <div class="cms-tab-content">
            <h1 class="cms-page-title-main">{getTabTitle(activeTab)}</h1>
            <!-- JACKPOT FEVER MASTER CONFIG -->
            <div
              class="cms-glass-card"
              style="padding: 24px; margin-bottom: 24px; border-left: 4px solid var(--accent-gold); background: rgba(30,27,75,0.4);"
            >
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: {isFever1Expanded ? '16px' : '0'};">
                <h3 class="cms-section-title" style="margin-bottom: 0;">
                  Setări Container "Jackpot Fever"
                </h3>
                <button 
                  on:click={() => isFever1Expanded = !isFever1Expanded}
                  style="background: rgba(245,200,66,0.1); border: 1px solid rgba(245,200,66,0.2); color: var(--accent-gold); padding: 6px 16px; border-radius: 99px; font-size: 11px; font-weight: 800; cursor: pointer; text-transform: uppercase;"
                >
                  {isFever1Expanded ? 'Restrânge ↑' : 'Extinde Setări ↓'}
                </button>
              </div>

              {#if isFever1Expanded}
              <p
                style="font-size: 13px; color: var(--text-muted); margin-bottom: 24px; line-height: 1.5; margin-top: 16px;"
              >
                Acesta este panoul principal (containerul) care va apărea la
                baza paginii și care va adăposti toate jackpoturile setate să
                apară „În grila Jackpot Fever”.
              </p>

              <div class="cms-fields-grid">
                <div
                  class="cms-field"
                  style="display: flex; align-items: center; grid-column: 1/-1;"
                >
                  <label class="cms-switch">
                    <input
                      type="checkbox"
                      bind:checked={jackpotFeverConfig.enabled}
                    />
                    <span class="cms-slider"></span>
                  </label>
                  <span
                    style="margin-left: 10px; color: var(--text-main); font-weight: 600;"
                    >Activează containerul Jackpot Fever pe Site</span
                  >
                </div>

                <div class="cms-field">
                  <label>Titlu Secțiune</label>
                  <input
                    type="text"
                    bind:value={jackpotFeverConfig.title}
                    placeholder="ex: Jackpot Fever"
                  />
                </div>

                <div
                  class="cms-field"
                  style="display: flex; align-items: center; padding-top: 24px;"
                >
                  <label
                    class="cms-toggle-label"
                    style="color: var(--accent-gold);"
                  >
                    <input
                      type="checkbox"
                      bind:checked={jackpotFeverConfig.showWhenLoggedOut}
                    /> Vizibil Nelogat (Pentru Landing Page)
                  </label>
                </div>

                <div
                  style="grid-column: 1/-1; margin-top: 24px; padding-top: 24px; border-top: 1px dashed rgba(255,255,255,0.1);"
                >
                  <h4
                    style="color: var(--accent-gold); font-size: 16px; margin-bottom: 12px; text-transform: uppercase;"
                  >
                    Alege Jackpot-urile pentru Fever & Animația lor
                  </h4>
                  <p
                    style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;"
                  >
                    Bifează ce jackpot vrei să apară în Fever și dacă vrei să
                    aibă animație sau nu.
                  </p>

                  <div
                    style="display: flex; flex-direction: column; gap: 12px;"
                  >
                    {#each jackpotConfig as jp}
                      <div
                        style="display: flex; flex-direction: column; gap: 12px; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);"
                      >
                        <div
                          style="display: flex; justify-content: space-between; align-items: center;"
                        >
                          <div
                            style="display: flex; align-items: center; gap: 16px;"
                          >
                            <img
                              src={jp.logoUrl || "/logoMobile.webp"}
                              alt={jp.name}
                              style="height: 30px; object-fit: contain;"
                            />
                            <strong
                              style="color: var(--text-main); font-size: 14px;"
                              >{jp.name}</strong
                            >
                          </div>
                          <div
                            style="display: flex; gap: 24px; align-items: center;"
                          >
                            <label
                              class="cms-toggle-label"
                              style="color: #22c55e;"
                            >
                              <input
                                type="checkbox"
                                bind:checked={jp.showInFever}
                                on:change={() => {
                                  jackpotConfig = [...jackpotConfig];
                                }}
                              /> Afișează în Fever
                            </label>
                            <div
                              style="display: flex; align-items: center; gap: 8px;"
                            >
                              <span
                                style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 800;"
                                >Stare / Animație:</span
                              >
                              <select
                                bind:value={jp.animationType}
                                on:change={(e) => {
                                  jp.animation = e.target.value !== "none";
                                  jackpotConfig = [...jackpotConfig];
                                }}
                                style="background: var(--bg-dark); color: var(--text-main); border: 1px solid var(--border-color); padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; outline: none; cursor: pointer;"
                              >
                                <option value="none"
                                  >Static (Fără animație)</option
                                >
                                <option value="odometer"
                                  >Odometer (Numărătoare normală)</option
                                >
                                <option value="hot"
                                  >🔥 HOT (Aproape de Hit!)</option
                                >
                                <option value="neon"
                                  >💜 NEON (Contur Rotativ)</option
                                >
                                <option value="ocean"
                                  >🌊 OCEAN (Valuri Blue)</option
                                >
                              </select>
                            </div>
                            <div
                              style="display: flex; align-items: center; gap: 8px;"
                            >
                              <span
                                style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 800;"
                                >Stil Gauge:</span
                              >
                               <select
                                bind:value={jp.fever2Style}
                                on:change={() => {
                                  jackpotConfig = [...jackpotConfig];
                                }}
                                style="background: var(--bg-dark); color: var(--text-main); border: 1px solid var(--border-color); padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; outline: none; cursor: pointer;"
                              >
                                <option value="">Implicit</option>
                                <option value="battery">🔋 Battery</option>
                                <option value="speedometer">🏎️ Speedometer</option>
                                <option value="safe">🔒 Seif 1 (3D)</option>
                                <option value="safe2">🕋 Seif 2.0</option>
                                <option value="inferno">🔥 Inferno</option>
                                <option value="volcano">🌋 Volcano</option>
                                <option value="glamour">✨ Glamour</option>
                                <option value="neon-glass">💎 Neon Glass</option>
                                <option value="ocean-world">🌊 Ocean World (Apă)</option>
                                <option value="ocean">🌊 Aquarium</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div
                          style="display: flex; gap: 24px; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;"
                        >
                          <label
                            class="cms-toggle-label"
                            style="color: var(--text-main);"
                          >
                            <input
                              type="checkbox"
                              bind:checked={jp.showOnlyHighestLevel}
                            /> Afișează DOAR Nivelul Maxim (ex: Grand/Pică)
                          </label>
                          <span
                            style="font-size: 11px; color: var(--text-muted);"
                            >Sumele se preiau din API-ul setat mai jos.</span
                          >
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
              {/if}
            </div>

            <!-- ===== JACKPOT FEVER 2 ADMIN ===== -->
            <div
              class="cms-glass-card"
              style="padding: 24px; margin-bottom: 32px; border-left: 4px solid #f97316; background: rgba(30,27,75,0.3);"
            >
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: {isFever2Expanded ? '16px' : '0'};">
                <h3 class="cms-section-title" style="margin-bottom: 0; color: #f97316;">
                  🔥 NEW! Jackpot Fever 2 — Gauge Arena
                </h3>
                <button 
                  on:click={() => isFever2Expanded = !isFever2Expanded}
                  style="background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.2); color: #f97316; padding: 6px 16px; border-radius: 99px; font-size: 11px; font-weight: 800; cursor: pointer; text-transform: uppercase;"
                >
                  {isFever2Expanded ? 'Restrânge ↑' : 'Extinde Setări ↓'}
                </button>
              </div>

              {#if isFever2Expanded}
              <p
                style="font-size: 13px; color: var(--text-muted); margin-bottom: 24px; line-height: 1.5; margin-top: 16px;"
              >
                Configurează noul container Jackpot Fever 2. Acesta are un
                design stil "Gauge" și este optimizat pentru a evidenția un
                singur jackpot progresiv.
              </p>

              <div
                style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px;"
              >
                <div class="cms-field">
                  <label class="cms-label">Activat</label>
                  <label class="cms-toggle-label">
                    <input
                      type="checkbox"
                      bind:checked={jackpotFever2Config.enabled}
                    /> Afișează Fever 2 pe site
                  </label>
                </div>
                <div class="cms-field">
                  <label class="cms-label">Titlu Secțiune</label>
                  <input
                    type="text"
                    class="cms-input"
                    bind:value={jackpotFever2Config.title}
                    placeholder="ex: Jackpot Arena"
                  />
                </div>
                <div class="cms-field">
                  <label class="cms-label">🎨 Stil Gauge (Vizualizare)</label>
                  <select
                    class="cms-input"
                    bind:value={jackpotFever2Config.gaugeStyle}
                  >
                    <option value="battery"
                      >🔋 Battery — Baterie Electrică Încărcare</option
                    >
                    <option value="speedometer"
                      >🏎️ Speedometer — Vitezometru Turat</option
                    >
                    <option value="safe"
                      >🔒 Seif 1 (3D Master) — Cinematic</option
                    >
                    <option value="safe2"
                      >🕋 Seif 2.0 (Mechanical Detail) — NEW!</option
                    >
                    <option value="inferno"
                      >🔥 BellLink Inferno — IDENTIC SCREEN</option
                    >
                    <option value="volcano"
                      >🌋 Volcano (Fire Card) — Intense Heat</option
                    >
                    <option value="glamour"
                      >✨ Glamour (Arc Card) — Cinematic Glass</option
                    >
                    <option value="neon-glass"
                      >💎 Neon Glass Slab — Hyper-Realistic</option
                    >
                    <option value="ocean-world"
                      >🌊 Ocean World — Deep Water Animation</option
                    >
                  </select>
                  {#if jackpotFever2Config.gaugeStyle === "speedometer" || jackpotFever2Config.gaugeStyle === "ocean-world"}
                    <label
                      class="cms-toggle-label"
                      style="color: var(--accent-gold); margin-top: 8px; display: block;"
                    >
                      <input
                        type="checkbox"
                        bind:checked={jackpotFever2Config.extraAnimation}
                      /> 
                      {#if jackpotFever2Config.gaugeStyle === "ocean-world"}
                        🌊 Animație Extreme Undersea (Extreme Mode)
                      {:else}
                        Red Glow & Animație Accelerată
                      {/if}
                    </label>
                  {/if}

                  {#if jackpotFever2Config.gaugeStyle === "speedometer"}
                    <label
                      class="cms-toggle-label"
                      style="color: var(--accent-gold); margin-top: 8px; display: block;"
                    >
                      <input
                        type="checkbox"
                        bind:checked={jackpotFever2Config.warpSpeedEffect}
                      /> Efect de Viteză (Warp/Spațial)
                    </label>
                    {#if jackpotFever2Config.warpSpeedEffect}
                      <div
                        style="margin-top: 12px; margin-left: 28px; padding-left: 12px; border-left: 2px solid rgba(234, 179, 8, 0.3); margin-bottom: 12px;"
                      >
                        <label
                          class="cms-label"
                          style="font-size: 11px; margin-bottom: 6px; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px;"
                          >Densitate Warp Lines</label
                        >
                        <select
                          class="cms-input"
                          style="height: 32px; font-size: 13px; background: rgba(0,0,0,0.4);"
                          bind:value={jackpotFever2Config.warpDensity}
                        >
                          <option value="low">Scăzut (Low Density)</option>
                          <option value="medium">Mediu (Medium Density)</option>
                          <option value="high">Puternic (Strong/Dense)</option>
                        </select>
                      </div>
                    {/if}

                    <label
                      class="cms-toggle-label"
                      style="color: #60a5fa; margin-top: 8px; display: block;"
                    >
                      <input
                        type="checkbox"
                        bind:checked={jackpotFever2Config.starfieldEffect}
                      /> Efect Interstellar (Stele/MegaSonic)
                    </label>
                    {#if jackpotFever2Config.starfieldEffect}
                      <div
                        style="margin-top: 12px; margin-left: 28px; padding-left: 12px; border-left: 2px solid rgba(96, 165, 250, 0.3);"
                      >
                        <label
                          class="cms-label"
                          style="font-size: 11px; margin-bottom: 6px; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px;"
                          >Densitate Stele (Star Density)</label
                        >
                        <select
                          class="cms-input"
                          style="height: 32px; font-size: 13px; background: rgba(0,0,0,0.4);"
                          bind:value={jackpotFever2Config.starfieldDensity}
                        >
                          <option value="low">Scăzut (Low Density)</option>
                          <option value="medium">Mediu (Medium Density)</option>
                          <option value="high"
                            >Puternic (MegaSonic/Dense)</option
                          >
                        </select>
                      </div>
                    {/if}
                  {/if}
                </div>
                <div class="cms-field">
                  <label class="cms-label">Layout / Dispunere</label>
                  <select
                    class="cms-input"
                    bind:value={jackpotFever2Config.displayMode}
                  >
                    <option value="arena">Arena (Toate Grupate)</option>
                    <option value="scattered"
                      >Împrăștiate (Carduri Individuale)</option
                    >
                  </select>
                </div>
                <div class="cms-field">
                  <label class="cms-label">Vizibilitate</label>
                  <label
                    class="cms-toggle-label"
                    style="color: var(--accent-gold);"
                  >
                    <input
                      type="checkbox"
                      bind:checked={jackpotFever2Config.showWhenLoggedOut}
                    /> Vizibil Nelogat (Landing Page)
                  </label>
                </div>
              </div>

              <div
                style="grid-column: 1/-1; margin-top: 24px; padding-top: 24px; border-top: 1px dashed rgba(168,85,247,0.3);"
              >
                <h4
                  style="color: #c084fc; font-size: 16px; margin-bottom: 12px; text-transform: uppercase;"
                >
                  Alege Jackpot-urile pentru Fever 2
                </h4>
                <p
                  style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;"
                >
                  Bifează ce jackpot-uri vor fi afișate în secțiunea separată
                  Fever 2 (Gauge Arena).
                </p>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  {#each jackpotConfig as jp}
                    <div
                      style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(168,85,247,0.2);"
                    >
                      <div
                        style="display: flex; align-items: center; gap: 16px;"
                      >
                        <img
                          src={jp.logoUrl || "/logoMobile.webp"}
                          alt={jp.name}
                          style="height: 30px; object-fit: contain;"
                        />
                        <strong
                          style="color: var(--text-main); font-size: 14px;"
                          >{jp.name}</strong
                        >
                      </div>
                      <div style="display: flex; gap: 20px; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 800;">Stil:</span>
                          <select 
                            bind:value={jp.fever2Style} 
                            on:change={() => jackpotConfig = [...jackpotConfig]}
                            style="background: var(--bg-dark); color: #c084fc; border: 1px solid rgba(168,85,247,0.3); padding: 4px 8px; border-radius: 4px; font-size: 12px; outline: none;"
                          >
                            <option value="">Default</option>
                            <option value="ocean-world">🌊 Ocean (Apă)</option>
                            <option value="battery">🔋 Battery</option>
                            <option value="speedometer">🏎️ Speed</option>
                            <option value="safe">🔒 Seif 3D</option>
                            <option value="safe2">🕋 Seif 2.0</option>
                            <option value="inferno">🔥 Inferno</option>
                            <option value="volcano">🌋 Volcano</option>
                            <option value="glamour">✨ Glamour</option>
                            <option value="neon-glass">💎 Neon Glass</option>
                          </select>
                        </div>

                        <label class="cms-toggle-label" style="color: #c084fc;">
                          <input
                            type="checkbox"
                            bind:checked={jp.showInFever2}
                            on:change={() => {
                              jackpotConfig = [...jackpotConfig];
                            }}
                          /> Afișează în Fever 2
                        </label>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
              {/if}
            </div>

            <h3
              class="cms-section-title"
              style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 24px;"
            >
              Configurare Avansată (Url-uri, Mărimi, Poziții Individuale)
            </h3>
            {#each jackpotConfig as jp, i}
              <div
                class="cms-glass-card"
                style="padding: 28px; margin-bottom: 24px;"
              >
                <h3 class="cms-section-title">#{i + 1} {jp.name}</h3>

                <div
                  class="cms-field"
                  style="margin-bottom: 24px; display: flex; align-items: center;"
                >
                  <label class="cms-switch">
                    <input
                      type="checkbox"
                      checked={jp.position !== "hidden"}
                      on:change={(e) => {
                        jp.position = e.target.checked
                          ? jp.type === "cards"
                            ? "after_hero"
                            : "fever"
                          : "hidden";
                        jackpotConfig = [...jackpotConfig];
                      }}
                    />
                    <span class="cms-slider"></span>
                  </label>
                  <span
                    style="margin-left: 10px; color: var(--text-main); font-weight: 600;"
                    >Activează {jp.name} pe Site</span
                  >
                </div>

                <div class="cms-fields-grid">
                  <div class="cms-field">
                    <label>Titlu / Nume</label>
                    <input type="text" bind:value={jp.name} />
                  </div>
                  <div class="cms-field">
                    <label>Tip Jackpot (Provider)</label>
                    <select bind:value={jp.type}>
                      <option value="cards">Jackpot Cards (EGT)</option>
                      <option value="bell">Bell Link (EGT Digital)</option>
                      <option value="vipBellLink">VIP Bell Link</option>
                      <option value="clover">Clover Chance</option>
                      <option value="egypt">Egypt Quest</option>
                      <option value="highCash">High Cash</option>
                      <option value="regalJackpot">Regal Jackpot</option>
                      <option value="goldenCoinsLink">Golden Coins</option>
                      <option value="hotLuck">Hot Luck</option>
                      <option value="playJackpot">Play Jackpot</option>
                    </select>
                  </div>
                  <div class="cms-field">
                    <label>API URL</label>
                    <input
                      type="text"
                      bind:value={jp.apiUrl}
                      placeholder="https://cashpot.ro/api/dynamic/jackpots.json"
                    />
                  </div>
                  <div class="cms-field">
                    <label>Logo URL (Transparent)</label>
                    <input
                      type="text"
                      bind:value={jp.logoUrl}
                      placeholder="https://..."
                    />
                  </div>
                  <div class="cms-field">
                    <label>Poziție pe Pagină</label>
                    <select bind:value={jp.position}>
                      <option value="after_hero">Sub Bannere (Singur)</option>
                      {#each categories as cat}
                        {#if cat.showOnPage}
                          <option value="after_cat_{cat.id}"
                            >După Categoria: {cat.name} (Singur)</option
                          >
                        {/if}
                      {/each}
                      <option value="hidden">Ascuns</option>
                    </select>
                  </div>
                  <div class="cms-field">
                    <label>Mărime (S/M/L/XL)</label>
                    <select bind:value={jp.size}>
                      <option value="S">Mic (S)</option>
                      <option value="M">Mediu (M)</option>
                      <option value="L">Mare (L)</option>
                      <option value="XL">Extra Mare (XL)</option>
                    </select>
                  </div>
                  <div class="cms-field">
                    <label>Setări Arena (Fever 2)</label>
                    <div style="display: flex; gap: 12px; align-items: center;">
                      <select bind:value={jp.fever2Style} style="flex: 1;">
                        <option value="">Implicit (Setări Arena)</option>
                        <option value="speedometer">Speedometer (Tesla)</option>
                        <option value="battery">Battery 3D</option>
                        <option value="safe">Seif 1 (3D Master)</option>
                        <option value="safe2"
                          >🔒 Seif 2.0 (Mechanical Detail)</option
                        >
                        <option value="inferno"
                          >🔥 BellLink Inferno (Identic Screen)</option
                        >
                        <option value="volcano">Volcano (Fire Card)</option>
                        <option value="glamour">Glamour (Arc Card)</option>
                        <option value="neon-glass">Neon Glass Slab</option>
                      </select>
                      <label
                        class="cms-toggle-label"
                        style="color: var(--accent-gold); white-space: nowrap;"
                      >
                        <input type="checkbox" bind:checked={jp.showInFever2} />
                        Afișează în Arenă
                      </label>
                    </div>
                  </div>
                  <div class="cms-field">
                    <label>Setări Extra</label>
                    <div class="cms-toggles" style="display:flex; gap:16px;">
                      <label
                        class="cms-toggle-label"
                        style="color: var(--accent-gold);"
                      >
                        <input
                          type="checkbox"
                          bind:checked={jp.showWhenLoggedOut}
                        /> Vizibil Nelogat
                      </label>
                      <label
                        class="cms-toggle-label"
                        style="color: var(--accent-gold);"
                      >
                        <input type="checkbox" bind:checked={jp.animation} /> Animații
                        Active
                      </label>
                    </div>
                  </div>
                  <div class="cms-field" style="grid-column: 1/-1;">
                    <label>Fundal Custom (Upload)</label>
                    <input
                      type="file"
                      accept="image/*"
                      on:change={(e) => handleBgUpload(e, i)}
                      class="cms-file-input"
                    />
                    {#if jp.backgroundImage}
                      <div class="cms-bg-preview">
                        <img src={jp.backgroundImage} alt="bg preview" />
                        <button
                          class="cms-btn-danger cms-btn-sm"
                          on:click={() => {
                            jp.backgroundImage = "";
                            jackpotConfig = [...jackpotConfig];
                          }}>Șterge</button
                        >
                      </div>
                    {/if}
                  </div>

                  <!-- LEVELS MANAGEMENT -->
                  <div class="cms-field" style="grid-column: 1/-1; margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px;">
                    <label style="color: var(--accent-gold); font-size: 13px; font-weight: 700; display: block; margin-bottom: 12px;">Niveluri Jackpot</label>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                      {#if !jp.levels}
                        <button class="cms-btn-sm" on:click={() => { jp.levels = []; jackpotConfig = [...jackpotConfig]; }}>Inițializează Niveluri</button>
                      {:else}
                        {#each jp.levels as lvl, li}
                          <div style="display: flex; gap: 8px; align-items: center; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px;">
                            <input type="text" bind:value={lvl.icon} placeholder="Icon (ex: ♣)" style="width: 40px; padding: 4px; font-size: 12px; text-align: center;" />
                            <input type="text" bind:value={lvl.name} placeholder="Nume Nivel" style="flex: 2; padding: 4px; font-size: 12px;" />
                            <input type="number" bind:value={lvl.value} placeholder="Valoare" step="0.01" style="flex: 1; padding: 4px; font-size: 12px;" />
                            <input type="color" bind:value={lvl.color} style="width: 30px; height: 30px; padding: 0; border: none; background: none; cursor: pointer;" />
                            <button class="cms-btn-danger" style="padding: 4px 8px; font-size: 12px;" on:click={() => {
                                jp.levels.splice(li, 1);
                                jackpotConfig = [...jackpotConfig];
                            }}>×</button>
                          </div>
                        {/each}
                        <button class="cms-btn-add" style="font-size: 11px; padding: 4px 10px; width: fit-content;" on:click={() => {
                            jp.levels = [...jp.levels, { name: 'Nivel Nou', value: 0, icon: '💰', color: '#ffffff' }];
                            jackpotConfig = [...jackpotConfig];
                        }}>+ Adaugă Nivel</button>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>

            {/each}
            <button
              class="cms-login-btn"
              style="background: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px dashed #22c55e; width: 100%; margin-top: 16px;"
              on:click={() => {
                jackpotConfig = [
                  ...jackpotConfig,
                  {
                    id: "jp_" + Date.now(),
                    name: "Jackpot Nou",
                    type: "fever",
                    position: "hidden",
                    apiUrl: "",
                    logoUrl: "",
                    backgroundImage: "",
                    size: "M",
                    showWhenLoggedOut: false,
                    animation: true,
                    showInFever2: true,
                    fever2Style: "",
                    levels: [{ name: "Level 1", value: 100, icon: "💰", color: "#ffffff" }],
                  },
                ];
              }}>+ ADAUGĂ JACKPOT NOU</button
            >

            <!-- Contextual Integrated Preview -->
            <div class="cms-context-preview">
              <div class="cms-context-preview-header">
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:6px; height:6px; border-radius:50%; background:#22c55e;"></div>
                  <span>PREVIZUALIZARE: JACKPOT CARDS</span>
                </div>
                <div style="display:flex; gap:10px;">
                   <button class="cms-btn-mini" on:click={() => previewDevice = previewDevice === 'mobile' ? 'desktop' : 'mobile'}>
                     {previewDevice === 'mobile' ? '🖥️ Desktop' : '📱 Mobile'}
                   </button>
                   <button class="cms-btn-mini" on:click={refreshPreview}>🔄 Refresh</button>
                </div>
              </div>
              <div class="cms-context-preview-body {previewDevice}">
                <iframe src={previewUrl} title="Module Preview"></iframe>
              </div>
            </div>
          </div>
        {/if}

        <!-- TAB: PROMO BANNER -->
        {#if activeTab === "promo"}
          <div class="cms-tab-content">
            <h1 class="cms-page-title-main">{getTabTitle(activeTab)}</h1>
            {#each promoConfig as promo, i}
              <div
                class="cms-glass-card"
                style="padding: 24px; margin-bottom: 24px; position: relative;"
              >
                <button
                  class="cms-btn-danger"
                  style="position: absolute; top: 24px; right: 24px;"
                  on:click={() => deletePromoBanner(promo.id)}>Șterge</button
                >

                <h3 class="cms-section-title">
                  Setări Promo Banner #{i + 1} ({promo.title})
                </h3>

                <div
                  class="cms-field"
                  style="margin-bottom: 24px; display: flex; align-items: center;"
                >
                  <label class="cms-switch">
                    <input type="checkbox" bind:checked={promo.enabled} />
                    <span class="cms-slider"></span>
                  </label>
                  <span
                    style="margin-left: 10px; color: var(--text-main); font-weight: 600;"
                    >Activează Promo Banner pe Site</span
                  >
                </div>

                <div class="cms-grid-2">
                  <div class="cms-field">
                    <label>Titlu Banner</label>
                    <input
                      type="text"
                      bind:value={promo.title}
                      placeholder="ex: Game of the Week"
                    />
                  </div>
                  <div class="cms-field">
                    <label>Setări Acțiune & Buton</label>
                    <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 12px; margin-top: 8px;">
                      <label class="cms-switch" style="transform: scale(0.85); margin: 0;">
                        <input type="checkbox" bind:checked={promo.showButton} />
                        <span class="cms-slider"></span>
                      </label>
                      <span style="font-size: 12px; color: var(--text-main); font-weight: 600;">Afișează Buton</span>
                      
                      <label class="cms-switch" style="transform: scale(0.85); margin: 0; margin-left: 12px;">
                        <input type="checkbox" bind:checked={promo.clickableBanner} />
                        <span class="cms-slider"></span>
                      </label>
                      <span style="font-size: 12px; color: var(--text-main); font-weight: 600;">Banner Clickable</span>
                    </div>
                    {#if promo.showButton}
                      <input
                        type="text"
                        bind:value={promo.buttonText}
                        placeholder="Text Buton (ex: JOACĂ)"
                        style="width: 100%;"
                      />
                    {/if}
                  </div>
                  <div class="cms-field">
                    <label>Poziție pe Site (după câte categorii să apară)</label
                    >
                    <select
                      bind:value={promo.positionIndex}
                      style="width: 100%; padding: 12px; border-radius: 8px; background: var(--bg-dark); color: var(--text-main); border: 1px solid var(--border-color); outline: none;"
                    >
                      <option value={0}
                        >La Început (Sub Bannere Principale/Jackpot)</option
                      >
                      {#each categories as cat, catIndex}
                        <option value={catIndex + 1}
                          >După rândul "{cat.name}"</option
                        >
                      {/each}
                    </select>
                  </div>
                  <div class="cms-field">
                    <label>Înălțime Banner (S, M, L, XL) - Se va afișa pe tot rândul</label>
                    <select
                      bind:value={promo.size}
                      style="width: 100%; padding: 12px; border-radius: 8px; background: var(--bg-dark); color: var(--text-main); border: 1px solid var(--border-color); outline: none;"
                    >
                      <option value="S">Mic (S)</option>
                      <option value="M">Mediu (M)</option>
                      <option value="L">Mare (L)</option>
                      <option value="XL">Extra Mare (XL)</option>
                    </select>
                  </div>
                  <div class="cms-field">
                    <label>Mărime Imagine Joc (S, M, L)</label>
                    <select
                      bind:value={promo.gameImageSize}
                      style="width: 100%; padding: 12px; border-radius: 8px; background: var(--bg-dark); color: var(--text-main); border: 1px solid var(--border-color); outline: none;"
                    >
                      <option value="S">Mic (S)</option>
                      <option value="M">Mediu (M)</option>
                      <option value="L">Mare (L)</option>
                    </select>
                  </div>
                  <div class="cms-field" style="grid-column: 1/-1;">
                    <label>Culori Personalizate Banner & Buton</label>
                    <div
                      style="display: flex; gap: 16px; align-items: center; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; flex-wrap: wrap;"
                    >
                      <div
                        style="display: flex; align-items: center; gap: 8px;"
                      >
                        <input
                          type="color"
                          bind:value={promo.textColor}
                          style="width: 32px; height: 32px; border: none; border-radius: 4px; cursor: pointer; background: transparent; padding: 0;"
                        />
                        <span style="font-size: 12px; color: var(--text-muted);"
                          >Culoare Titlu</span
                        >
                      </div>
                      <div
                        style="display: flex; align-items: center; gap: 8px;"
                      >
                        <input
                          type="color"
                          bind:value={promo.buttonColor}
                          style="width: 32px; height: 32px; border: none; border-radius: 4px; cursor: pointer; background: transparent; padding: 0;"
                        />
                        <span style="font-size: 12px; color: var(--text-muted);"
                          >Fundal Buton</span
                        >
                      </div>
                      <div
                        style="display: flex; align-items: center; gap: 8px;"
                      >
                        <input
                          type="color"
                          bind:value={promo.buttonTextColor}
                          style="width: 32px; height: 32px; border: none; border-radius: 4px; cursor: pointer; background: transparent; padding: 0;"
                        />
                        <span style="font-size: 12px; color: var(--text-muted);"
                          >Text Buton</span
                        >
                      </div>
                      <div
                        style="display: flex; align-items: center; gap: 8px; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 16px;"
                      >
                        <input
                          type="color"
                          bind:value={promo.buttonBorderColor}
                          style="width: 32px; height: 32px; border: none; border-radius: 4px; cursor: pointer; background: transparent; padding: 0;"
                        />
                        <span style="font-size: 12px; color: var(--text-muted);"
                          >Culoare Contur</span
                        >
                      </div>
                      <div
                        style="display: flex; align-items: center; gap: 8px;"
                      >
                        <select
                          bind:value={promo.buttonBorderWidth}
                          style="padding: 4px 8px; border-radius: 4px; background: rgba(0,0,0,0.5); color: #fff; border: 1px solid var(--border-color); outline: none;"
                        >
                          <option value={0}>Fără contur</option>
                          <option value={1}>1px</option>
                          <option value={2}>2px</option>
                          <option value={3}>3px</option>
                          <option value={4}>4px</option>
                        </select>
                        <span style="font-size: 12px; color: var(--text-muted);"
                          >Grosime Contur</span
                        >
                      </div>
                    </div>
                  </div>
                  <div class="cms-field" style="grid-column: 1/-1;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <label style="margin: 0;">Imagine Fundal Banner</label>
                    </div>
                    <div
                      style="display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap; margin-bottom: 12px;"
                    >
                      {#each [1, 2, 3, 4, 5] as bgNum}
                        <div
                          on:click={() =>
                            (promo.backgroundImage = `/abstract_casino_bg_${bgNum}.png`)}
                          style="width: 120px; height: 67px; cursor: pointer; border-radius: 8px; border: 2px solid {promo.backgroundImage ===
                          `/abstract_casino_bg_${bgNum}.png`
                            ? 'var(--accent-gold)'
                            : 'transparent'}; background-image: url('/abstract_casino_bg_${bgNum}.png'); background-size: cover; background-position: center; transition: transform 0.2s;"
                          on:mouseover={(e) =>
                            (e.currentTarget.style.transform = "scale(1.05)")}
                          on:mouseout={(e) =>
                            (e.currentTarget.style.transform = "scale(1)")}
                        ></div>
                      {/each}
                    </div>

                    <div style="display: flex; gap: 8px; margin-bottom: 12px; width: 100%; align-items: center;">
                      <input
                        type="text"
                        bind:value={promo.backgroundImage}
                        placeholder="URL Imagine sau încarcă un fișier..."
                        style="flex: 1; padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-hover); color: var(--text-main); outline: none;"
                      />
                      
                      <div style="display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 6px; border: 1px solid var(--border-color);">
                        <span style="font-size: 10px; color: var(--text-muted); padding-left: 6px; white-space: nowrap;">Afișare:</span>
                        <select bind:value={promo.backgroundFit} style="padding: 6px; border-radius: 4px; background: rgba(255,255,255,0.1); color: #fff; border: none; outline: none; font-size: 11px; cursor: pointer;">
                          <option value="cover">Cover (Taie)</option>
                          <option value="contain">Contain (Toată)</option>
                          <option value="fill">Fill (Întinde)</option>
                        </select>
                      </div>

                      <div style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.3); padding: 4px 12px; border-radius: 6px; border: 1px solid var(--border-color);">
                        <label class="cms-switch" style="transform: scale(0.7); margin: 0;">
                          <input type="checkbox" bind:checked={promo.showOverlay} />
                          <span class="cms-slider"></span>
                        </label>
                        <span style="font-size: 11px; color: var(--text-muted); white-space: nowrap;">Filtru Întunecat</span>
                      </div>

                      <label
                        class="cms-btn-primary"
                        style="cursor: pointer; margin: 0; white-space: nowrap; padding: 10px 16px;"
                      >
                        📁 Încarcă
                        <input
                          type="file"
                          accept="image/*,video/*"
                          on:change={(e) => handlePromoBgUpload(e, i)}
                          style="display:none;"
                        />
                      </label>
                    </div>

                    {#if promo.backgroundImage}
                      <div
                        class="cms-bg-preview"
                        style="height: 100px; overflow: hidden; border-radius: 8px; border: 1px solid var(--border-color);"
                      >
                        {#if promo.backgroundImage.includes('data:video/') || promo.backgroundImage.endsWith('.mp4') || promo.backgroundImage.endsWith('.webm') || promo.backgroundImage.endsWith('.mov')}
                          <!-- svelte-ignore a11y-media-has-caption -->
                          <video
                            src={promo.backgroundImage}
                            autoplay
                            loop
                            muted
                            playsinline
                            style="width: 100%; height: 100%; object-fit: {promo.backgroundFit || 'cover'};"
                          ></video>
                        {:else}
                          <img
                            src={promo.backgroundImage}
                            alt="Promo Background"
                            style="width: 100%; height: 100%; object-fit: {promo.backgroundFit || 'cover'};"
                          />
                        {/if}
                      </div>
                    {/if}
                  </div>
                  <div class="cms-field" style="grid-column: 1/-1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                      <label style="margin: 0;">Selecție Joc pentru Banner (Opțional - Poți lăsa fără joc)</label>
                      {#if promo.gameImage}
                        <button 
                          class="cms-btn-ghost" 
                          style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" 
                          on:click={() => { promo.gameImage = ""; promo.gameName = ""; }}
                        >
                          ✕ Șterge Joc (Afișează doar fundalul)
                        </button>
                      {/if}
                    </div>

                    <div style="display: flex; gap: 12px; margin-bottom: 16px; width: 100%;">
                      <div style="flex: 1; position: relative;">
                        <input
                          type="text"
                          bind:value={promoGameSearch}
                          placeholder="Caută joc..."
                          style="width: 100%; padding: 10px 100px 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-hover); color: var(--text-main); outline: none;"
                        />
                        {#if promoGameSearch}
                          <div class="search-bubble" style="display: flex;">{filteredPromoGames.length} rezultate</div>
                        {/if}
                      </div>

                      <select
                        bind:value={promoGameProvider}
                        style="width: 200px; padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-hover); color: var(--text-main); outline: none;"
                      >
                        {#each uniqueProviders as prov}
                          <option value={prov}
                            >{prov === "All" ? "Toți Furnizorii" : prov}</option
                          >
                        {/each}
                      </select>
                    </div>

                    <div
                      style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; max-height: 280px; overflow-y: auto; padding: 12px; background: rgba(0,0,0,0.2); border-radius: var(--radius-md); border: 1px solid var(--border-color); scrollbar-width: thin; scrollbar-color: var(--accent-gold) rgba(0,0,0,0.2);"
                    >
                      {#each filteredPromoGames as game}
                        <div
                          on:click={() => selectPromoGame(game, i)}
                          on:mouseover={(e) =>
                            (e.currentTarget.style.transform = "scale(1.05)")}
                          on:mouseout={(e) =>
                            (e.currentTarget.style.transform = "scale(1)")}
                          style="cursor: pointer; border-radius: 8px; overflow: hidden; border: 2px solid {promo.gameImage ===
                          game.img
                            ? 'var(--accent-gold)'
                            : 'transparent'}; position: relative; transition: all 0.2s; background: #111;"
                        >
                          <img
                            src={game.img}
                            alt={game.n}
                            style="width: 100%; aspect-ratio: 1; object-fit: contain; display: block;"
                          />
                          {#if promo.gameImage === game.img}
                            <div
                              style="position: absolute; top: 4px; right: 4px; background: var(--accent-gold); color: #000; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.5);"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="3"
                                width="12"
                                height="12"
                                ><polyline points="20 6 9 17 4 12"
                                ></polyline></svg
                              >
                            </div>
                          {/if}
                          <div
                            style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); padding: 4px; text-align: center; font-size: 9px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                          >
                            {game.n}
                          </div>
                        </div>
                      {/each}
                      {#if filteredPromoGames.length === 0}
                        <div
                          style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px;"
                        >
                          Nu a fost găsit niciun joc conform filtrelor.
                        </div>
                      {/if}
                    </div>

                    <label style="margin-top: 16px;">URL Imagine Joc Central (Poate fi modificat manual)</label>
                    <input
                      type="text"
                      bind:value={promo.gameImage}
                      placeholder="https://..."
                      style="padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-hover); color: var(--text-main); width: 100%; outline: none;"
                    />

                    <label style="margin-top: 16px; display: flex; align-items: center; gap: 8px;">
                      <span>Link Personalizat pe Banner / Buton (Opțional)</span>
                      <span style="font-size: 11px; font-weight: normal; color: var(--text-muted);">(Dacă este setat, va ignora jocul selectat)</span>
                    </label>
                    <input
                      type="text"
                      bind:value={promo.bannerLink}
                      placeholder="ex: /vip sau https://alte-site.ro"
                      style="padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-hover); color: var(--text-main); width: 100%; outline: none;"
                    />
                  </div>
                </div>
              </div>
            {/each}

            <button class="cms-btn-add" on:click={addPromoBanner}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                width="18"
                height="18"
                ><line x1="12" y1="5" x2="12" y2="19" /><line
                  x1="5"
                  y1="12"
                  x2="19"
                  y2="12"
                /></svg
              >
              Adaugă Promo Banner Nou
            </button>

            <!-- Contextual Integrated Preview -->
            <div class="cms-context-preview">
              <div class="cms-context-preview-header">
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:6px; height:6px; border-radius:50%; background:#22c55e;"></div>
                  <span>PREVIZUALIZARE: PROMO BANNER</span>
                </div>
                <div style="display:flex; gap:10px;">
                   <button class="cms-btn-mini" on:click={() => previewDevice = previewDevice === 'mobile' ? 'desktop' : 'mobile'}>
                     {previewDevice === 'mobile' ? '🖥️ Desktop' : '📱 Mobile'}
                   </button>
                   <button class="cms-btn-mini" on:click={refreshPreview}>🔄 Refresh</button>
                </div>
              </div>
              <div class="cms-context-preview-body {previewDevice}">
                <iframe src={previewUrl} title="Module Preview"></iframe>
              </div>
            </div>
          </div>
        {/if}

        <!-- TAB: CALENDAR -->
        {#if activeTab === "calendar"}
          <div class="cms-tab-content">
            <h1 class="cms-page-title-main">{getTabTitle(activeTab)}</h1>
            <div class="cms-glass-card" style="padding: 24px;">
              <h3 class="cms-section-title">Programări Active & Viitoare</h3>
              <div class="cms-timeline">
                {#each categories.filter((c) => (c.timeStart || c.timeEnd) && getItemStatus(c) !== "EXPIRATĂ") as cat}
                  <div
                    class="cms-timeline-item status-{getItemStatus(
                      cat,
                    ).toLowerCase()}"
                  >
                    <div class="cms-timeline-info">
                      <span class="cms-item-tag">Categorie</span>
                      <span class="cms-item-name">{cat.name}</span>
                    </div>
                    <div class="cms-timeline-times">
                      <div class="cms-time-badge">
                        <span>De la:</span>
                        {cat.timeStart
                          ? new Date(cat.timeStart).toLocaleString("ro-RO")
                          : "N/A"}
                      </div>
                      <div class="cms-time-badge">
                        <span>Până la:</span>
                        {cat.timeEnd
                          ? new Date(cat.timeEnd).toLocaleString("ro-RO")
                          : "N/A"}
                      </div>
                    </div>
                    <div class="cms-status-pill">{getItemStatus(cat)}</div>
                  </div>
                {/each}
                {#if categories.filter((c) => (c.timeStart || c.timeEnd) && getItemStatus(c) !== "EXPIRATĂ").length === 0}
                  <div class="cms-empty-state">
                    Nicio programare activă sau viitoare.
                  </div>
                {/if}
              </div>

              <h3
                class="cms-section-title"
                style="margin-top: 48px; opacity: 0.6;"
              >
                Programări Expirate
              </h3>
              <div class="cms-timeline">
                {#each categories.filter((c) => (c.timeStart || c.timeEnd) && getItemStatus(c) === "EXPIRATĂ") as cat}
                  <div class="cms-timeline-item status-expirată">
                    <div class="cms-timeline-info">
                      <span class="cms-item-tag">Categorie</span>
                      <span class="cms-item-name">{cat.name}</span>
                    </div>
                    <div class="cms-timeline-times">
                      <div class="cms-time-badge">
                        <span>De la:</span>
                        {cat.timeStart
                          ? new Date(cat.timeStart).toLocaleString("ro-RO")
                          : "N/A"}
                      </div>
                      <div class="cms-time-badge">
                        <span>Până la:</span>
                        {cat.timeEnd
                          ? new Date(cat.timeEnd).toLocaleString("ro-RO")
                          : "N/A"}
                      </div>
                    </div>
                    <div class="cms-status-pill">EXPIRATĂ</div>
                  </div>
                {/each}
                {#if categories.filter((c) => (c.timeStart || c.timeEnd) && getItemStatus(c) === "EXPIRATĂ").length === 0}
                  <div class="cms-empty-state">Nicio programare expirată.</div>
                {/if}
              </div>
            </div>
          </div>
        {/if}

        <!-- TAB: THEMES -->
        {#if activeTab === "themes"}
          <div class="cms-tab-content">
            <h1 class="cms-page-title-main">{getTabTitle(activeTab)}</h1>
            <div class="cms-glass-card" style="padding: 28px;">
              <h3 class="cms-section-title">
                Temă & Culori Principale (Mod Întunecat)
              </h3>
              <p
                style="font-size: 13px; color: var(--text-muted); margin-bottom: 24px;"
              >
                Personalizează paleta de culori a site-ului pentru a se potrivi
                cu evenimentele curente. Culorile se aplică instant în
                previzualizare.
              </p>

              <div
                style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px;"
              >
                <div class="cms-field">
                  <label>Fundal Principal (Pagină)</label>
                  <div style="display: flex; gap: 12px; align-items: center;">
                    <input
                      type="color"
                      bind:value={themeColors.bgDark}
                      style="width: 48px; height: 48px; padding: 0; border: none; border-radius: 8px; cursor: pointer; background: transparent; overflow: hidden;"
                    />
                    <input
                      type="text"
                      bind:value={themeColors.bgDark}
                      style="flex: 1;"
                    />
                  </div>
                  <span
                    style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: block;"
                    >Recomandat: Nuanțe foarte închise (ex: #130f1c)</span
                  >
                </div>

                <div class="cms-field">
                  <label>Fundal Secundar (Meniuri / Carduri)</label>
                  <div style="display: flex; gap: 12px; align-items: center;">
                    <input
                      type="color"
                      bind:value={themeColors.bgPanel}
                      style="width: 48px; height: 48px; padding: 0; border: none; border-radius: 8px; cursor: pointer; background: transparent; overflow: hidden;"
                    />
                    <input
                      type="text"
                      bind:value={themeColors.bgPanel}
                      style="flex: 1;"
                    />
                  </div>
                  <span
                    style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: block;"
                    >Recomandat: O idee mai deschis decât fundalul principal</span
                  >
                </div>

                <div class="cms-field">
                  <label>Fundal Hover (Efect la Trecerea Mouse-ului)</label>
                  <div style="display: flex; gap: 12px; align-items: center;">
                    <input
                      type="color"
                      bind:value={themeColors.bgHover}
                      style="width: 48px; height: 48px; padding: 0; border: none; border-radius: 8px; cursor: pointer; background: transparent; overflow: hidden;"
                    />
                    <input
                      type="text"
                      bind:value={themeColors.bgHover}
                      style="flex: 1;"
                    />
                  </div>
                </div>

                <div class="cms-field">
                  <label>Culoare Text Principal</label>
                  <div style="display: flex; gap: 12px; align-items: center;">
                    <input
                      type="color"
                      bind:value={themeColors.textMain}
                      style="width: 48px; height: 48px; padding: 0; border: none; border-radius: 8px; cursor: pointer; background: transparent; overflow: hidden;"
                    />
                    <input
                      type="text"
                      bind:value={themeColors.textMain}
                      style="flex: 1;"
                    />
                  </div>
                </div>

                <div class="cms-field" style="grid-column: 1 / -1;">
                  <label>Logo Site (Imagine)</label>
                  <div
                    style="display: flex; align-items: center; gap: 16px; margin-bottom: 8px;"
                  >
                    <div
                      style="width: 100px; height: 40px; background: rgba(0,0,0,0.3); border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1);"
                    >
                      {#if themeColors.logoUrl}
                        <img
                          src={themeColors.logoUrl}
                          alt="Logo Preview"
                          style="max-width: 90%; max-height: 90%; object-fit: contain;"
                        />
                      {:else}
                        <span
                          style="font-size: 10px; color: rgba(255,255,255,0.3);"
                          >Fără logo</span
                        >
                      {/if}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      on:change={handleLogoUpload}
                      style="border-radius: 99px;"
                    />
                  </div>
                </div>
                
                <div class="cms-field" style="grid-column: 1 / -1; display: flex; flex-direction: column; gap: 12px; background: rgba(0,0,0,0.2); padding: 20px; border-radius: 12px; margin-top: 16px;">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-size: 13px; font-weight: 700; color: var(--text-main);">COMUTATOR TEMĂ (LIGHT/DARK)</span>
                    <label class="cms-switch">
                      <input type="checkbox" bind:checked={themeColors.showThemeToggle} />
                      <span class="cms-slider"></span>
                    </label>
                  </div>
                  
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-size: 13px; font-weight: 700; color: var(--text-main);">COMUTATOR LIMBĂ (RO/EN)</span>
                    <label class="cms-switch">
                      <input type="checkbox" bind:checked={themeColors.showLangToggle} />
                      <span class="cms-slider"></span>
                    </label>
                  </div>

                  <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; margin-top: 4px;">
                    <span style="font-size: 13px; font-weight: 800; color: var(--accent-gold);">AFIȘEAZĂ ICONIȚE ÎN DESIGN (GLOBAL)</span>
                    <label class="cms-switch" style="transform: scale(1.1);">
                      <input type="checkbox" bind:checked={themeColors.showIcons} />
                      <span class="cms-slider"></span>
                    </label>
                  </div>
                </div>

                <div class="cms-field" style="grid-column: 1 / -1; background: rgba(245,200,66,0.05); padding: 20px; border-radius: 12px; border: 1px solid rgba(245,200,66,0.1); margin-top: 16px;">
                    <label style="display:block; margin-bottom:16px; font-weight: 800; color: var(--accent-gold); text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Vizibilitate Detaliată Iconițe</label>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.2); padding: 10px 14px; border-radius: 99px;">
                          <span style="font-size: 11px; font-weight: 700;">CATEGORII (HOME)</span>
                          <label class="cms-switch">
                            <input type="checkbox" bind:checked={themeColors.showCategoryIcons} />
                            <span class="cms-slider"></span>
                          </label>
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.2); padding: 10px 14px; border-radius: 99px;">
                          <span style="font-size: 11px; font-weight: 700;">SIDEBAR MENU</span>
                          <label class="cms-switch">
                            <input type="checkbox" bind:checked={themeColors.showSidebarIcons} />
                            <span class="cms-slider"></span>
                          </label>
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.2); padding: 10px 14px; border-radius: 99px;">
                          <span style="font-size: 11px; font-weight: 700;">JACKPOT CARDS</span>
                          <label class="cms-switch">
                            <input type="checkbox" bind:checked={themeColors.showJackpotIcons} />
                            <span class="cms-slider"></span>
                          </label>
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.2); padding: 10px 14px; border-radius: 99px;">
                          <span style="font-size: 11px; font-weight: 700;">TOOLBAR WIDGET</span>
                          <label class="cms-switch">
                            <input type="checkbox" bind:checked={themeColors.showToolbarIcons} />
                            <span class="cms-slider"></span>
                          </label>
                        </div>
                    </div>
                </div>

              </div>

            </div>

            <!-- Contextual Integrated Preview -->
            <div class="cms-context-preview">
              <div class="cms-context-preview-header">
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:6px; height:6px; border-radius:50%; background:#22c55e;"></div>
                  <span>PREVIZUALIZARE: DESIGN & CULORI</span>
                </div>
                <div style="display:flex; gap:10px;">
                   <button class="cms-btn-mini" on:click={() => previewDevice = previewDevice === 'mobile' ? 'desktop' : 'mobile'}>
                     {previewDevice === 'mobile' ? '🖥️ Desktop' : '📱 Mobile'}
                   </button>
                   <button class="cms-btn-mini" on:click={refreshPreview}>🔄 Refresh</button>
                </div>
              </div>
              <div class="cms-context-preview-body {previewDevice}">
                <iframe src={previewUrl} title="Module Preview"></iframe>
              </div>
            </div>
          </div>
        {/if}

        <!-- TAB: RESTORE -->
        {#if activeTab === "restore"}
          <div class="cms-tab-content">
            <h1 class="cms-page-title-main">{getTabTitle(activeTab)}</h1>
            {#if restoreSuccess}
              <div
                style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; color: #10b981; font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 10px;"
              >
                {restoreSuccess}
              </div>
            {/if}

            <div
              class="cms-glass-card"
              style="padding: 24px; margin-bottom: 24px;"
            >
              <h3 class="cms-section-title">Creare Backup Manual</h3>
              <p
                style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;"
              >
                Salvează o fotografie a stării curente înainte de modificări
                importante. Backup-urile se stochează local în browser.
              </p>
              <div style="display: flex; gap: 12px; align-items: center;">
                <input
                  type="text"
                  id="backup-label-input"
                  placeholder="Ex: Înainte de lansare campanie..."
                  style="flex: 1; padding: 10px 14px; background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: 99px; color: var(--text-main); font-size: 13px;"
                />
                <button
                  on:click={() => {
                    const el = document.getElementById("backup-label-input");
                    createBackup(el.value || "");
                    el.value = "";
                    backups = backups;
                  }}
                  style="background: #10b981; color: #fff; border: none; padding: 10px 20px; border-radius: 99px; font-weight: 700; cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 8px;"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    width="16"
                    height="16"
                    ><path
                      d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                    /><polyline points="17 21 17 13 7 13 7 21" /><polyline
                      points="7 3 7 8 15 8"
                    /></svg
                  >
                  Salvează Backup
                </button>
              </div>
            </div>

            <div class="cms-glass-card" style="padding: 24px;">
              <h3 class="cms-section-title">
                Backup-uri Disponibile ({backups.length}/10)
              </h3>
              {#if backups.length === 0}
                <div
                  style="text-align: center; padding: 40px; color: var(--text-muted);"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    width="48"
                    height="48"
                    style="margin: 0 auto 16px; display:block; opacity:0.3;"
                    ><path
                      d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                    /><path d="M3 3v5h5" /></svg
                  >
                  <p>
                    Nu există backup-uri. Apasă <strong
                      >Publică Modificările</strong
                    > sau creează unul manual.
                  </p>
                </div>
              {:else}
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  {#each backups as backup, idx}
                    <div
                      style="display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: {idx ===
                      0
                        ? 'rgba(16,185,129,0.08)'
                        : 'var(--bg-dark)'}; border: 1px solid {idx === 0
                        ? 'rgba(16,185,129,0.25)'
                        : 'var(--border-color)'}; border-radius: 12px;"
                    >
                      <div
                        style="width: 40px; height: 40px; border-radius: 10px; background: {idx ===
                        0
                          ? 'rgba(16,185,129,0.2)'
                          : 'rgba(255,255,255,0.05)'}; display: flex; align-items: center; justify-content: center; flex-shrink:0;"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={idx === 0 ? "#10b981" : "var(--text-muted)"}
                          stroke-width="2"
                          width="18"
                          height="18"
                          ><path
                            d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                          /><path d="M3 3v5h5" /></svg
                        >
                      </div>
                      <div style="flex: 1; min-width: 0;">
                        <div
                          style="font-weight: 700; font-size: 14px; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                        >
                          {backup.label}
                        </div>
                        <div style="font-size: 10px; color: var(--accent-gold); margin-top: 2px; font-weight: 800;">
                           🕒 {backup.date || new Date(backup.id).toLocaleString("ro-RO")}
                        </div>
                        <div
                          style="font-size: 11px; color: var(--text-muted); margin-top: 4px;"
                        >
                          {backup.categories?.length || 0} cat. · {backup
                            .banners?.items?.length || 0} ban. · {backup.playArenaConfig ? 'Arena ✔️' : ''}
                        </div>
                      </div>
                      {#if idx === 0}<span
                          style="font-size: 10px; font-weight: 800; padding: 3px 8px; background: rgba(16,185,129,0.15); color: #10b981; border-radius: 20px; border: 1px solid rgba(16,185,129,0.3);"
                          >CEL MAI RECENT</span
                        >{/if}
                      <button
                        on:click={() => restoreBackup(backup)}
                        style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #10b981; padding: 8px 16px; border-radius: 99px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap;"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          width="14"
                          height="14"
                          ><path
                            d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                          /><path d="M3 3v5h5" /></svg
                        >
                        Restaurează
                      </button>
                      <button
                        on:click={() => deleteBackup(backup.id)}
                        style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;"
                        title="Șterge backup"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          width="14"
                          height="14"
                          ><polyline points="3 6 5 6 21 6" /><path
                            d="M19 6l-1 14H6L5 6"
                          /><path d="M10 11v6" /><path d="M14 11v6" /></svg
                        >
                      </button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- TAB: WINNERS -->
        {#if activeTab === "winners"}
          <div class="cms-tab-content">
            <h1 class="cms-page-title-main">{getTabTitle(activeTab)}</h1>
            <div class="cms-glass-card" style="padding: 24px;">
              <div style="margin-bottom: 24px;">
                <h3 class="cms-section-title">
                  Configurare Marquee Top Câștigători
                </h3>
                <p style="font-size: 13px; color: var(--text-muted);">
                  Setează cum este afișată pe site bara de câștigători (datele
                  sunt preluate automat din API).
                </p>
              </div>

              <div style="display: flex; flex-direction: column; gap: 24px;">
                <div
                  style="display: flex; gap: 16px; align-items: center; background: rgba(0,0,0,0.2); padding: 16px; border-radius: 99px; border: 1px solid var(--border-color);"
                >
                  <label
                    class="cms-toggle-label"
                    style="font-weight: bold; color: var(--accent-gold); font-size: 16px;"
                  >
                    <input
                      type="checkbox"
                      bind:checked={winnersConfig.enabled}
                    />
                    {winnersConfig.enabled
                      ? "AFIȘAT PE SITE (ON)"
                      : "ASCUNS (OFF)"}
                  </label>
                </div>

                <div class="cms-field">
                  <label>Sursă Date (URL API Endpoint)</label>
                  <input
                    type="text"
                    bind:value={winnersConfig.apiUrl}
                    placeholder="ex: https://api.cashpot.ro/winners/top"
                    style="background: var(--bg-dark); padding: 12px; border-radius: 99px; border: 1px solid var(--border-color); color: var(--text-main); width: 100%;"
                  />
                  <div
                    style="font-size: 11px; color: var(--text-muted); margin-top: 4px;"
                  >
                    Dacă e gol, se vor folosi datele de rezervă.
                  </div>
                </div>

                <div
                  style="display: flex; gap: 16px; align-items: center; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 99px; border: 1px solid var(--border-color);"
                >
                  <label
                    class="cms-toggle-label"
                    style="color: var(--text-main);"
                  >
                    <input
                      type="checkbox"
                      bind:checked={winnersConfig.useMockData}
                    /> Forțează Date Demonstrative (Mod Testare)
                  </label>
                </div>

                <div
                  style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;"
                >
                  <div class="cms-field">
                    <label>Poziție Afișare</label>
                    <select
                      bind:value={winnersConfig.position}
                      style="background: var(--bg-dark); padding: 12px; border-radius: 99px; border: 1px solid var(--border-color); color: var(--text-main); width: 100%;"
                    >
                      <option value="top">Sus (Sub Header)</option>
                      {#each categories as cat}
                        {#if cat.showOnPage}
                          <option value="after_cat_{cat.id}"
                            >După Categoria: {cat.name}</option
                          >
                        {/if}
                      {/each}
                      <option value="bottom">Jos (Deasupra Footer-ului)</option>
                    </select>
                  </div>

                  <div class="cms-field">
                    <label>Afișare Poză Joc</label>
                    <select
                      bind:value={winnersConfig.showImage}
                      style="background: var(--bg-dark); padding: 12px; border-radius: 99px; border: 1px solid var(--border-color); color: var(--text-main); width: 100%;"
                    >
                      <option value={true}
                        >Da, afișează thumbnail-ul jocului</option
                      >
                      <option value={false}>Nu, afișează doar textul</option>
                    </select>
                  </div>

                  <div class="cms-field" style="grid-column: 1 / -1;">
                    <label>Mărime Poză Joc (dacă e activată)</label>
                    <select
                      bind:value={winnersConfig.imageSize}
                      disabled={!winnersConfig.showImage}
                      style="background: var(--bg-dark); padding: 12px; border-radius: 99px; border: 1px solid var(--border-color); color: var(--text-main); width: 100%; opacity: {winnersConfig.showImage
                        ? '1'
                        : '0.5'};"
                    >
                      <option value="S">Mică (16x16px)</option>
                      <option value="M">Medie (20x20px)</option>
                      <option value="L">Mare (28x28px)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Contextual Integrated Preview -->
            <div class="cms-context-preview">
              <div class="cms-context-preview-header">
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:6px; height:6px; border-radius:50%; background:#22c55e;"></div>
                  <span>PREVIZUALIZARE: TOP CÂȘTIGĂTORI (LIVE MARQUEE)</span>
                </div>
                <div style="display:flex; gap:10px;">
                   <button class="cms-btn-mini" on:click={() => previewDevice = previewDevice === 'mobile' ? 'desktop' : 'mobile'}>
                     {previewDevice === 'mobile' ? '🖥️ Desktop' : '📱 Mobile'}
                   </button>
                   <button class="cms-btn-mini" on:click={refreshPreview}>🔄 Refresh</button>
                </div>
              </div>
              <div class="cms-context-preview-body {previewDevice}">
                <iframe src={previewUrl} title="Module Preview"></iframe>
              </div>
            </div>
          </div>
        {/if}

        <!-- TAB: RTP GAMES -->
        {#if activeTab === "rtp"}
          <div class="cms-tab-content">
            <h1 class="cms-page-title-main">{getTabTitle(activeTab)}</h1>
            <div
              class="cms-glass-card"
              style="padding: 24px; margin-bottom: 24px;"
            >
              <h3 class="cms-section-title">
                Configurare Widget RTP (Hot / Cold Games)
              </h3>
              <p
                style="font-size: 13px; color: var(--text-muted); margin-bottom: 24px;"
              >
                Controlează widgetul dual cu jocuri generoase (Hot) și în
                creștere (Cold).
              </p>

              <label
                style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin-bottom: 24px; padding: 12px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); border-radius: 99px;"
              >
                <input
                  type="checkbox"
                  bind:checked={rtpConfig.enabled}
                  style="width: 20px; height: 20px; accent-color: #10b981;"
                />
                <span style="font-weight: 700; color: #10b981;"
                  >Activează Widgetul pe Site</span
                >
              </label>

              <div
                style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px;"
              >
                <!-- HOT COLUMN -->
                <div
                  style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.1); padding: 20px; border-radius: 12px;"
                >
                  <h4
                    style="color: #f87171; margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid rgba(239,68,68,0.2); padding-bottom: 8px;"
                  >
                    Jocuri Generoase (Hot)
                  </h4>
                  <div class="cms-field">
                    <label>Titlu</label>
                    <input
                      type="text"
                      bind:value={rtpConfig.hotTitle}
                      class="cms-input"
                      style="border-radius: 99px;"
                    />
                  </div>
                  <div class="cms-field">
                    <label>Subtitlu</label>
                    <input
                      type="text"
                      bind:value={rtpConfig.hotSubtitle}
                      class="cms-input"
                      style="border-radius: 99px;"
                    />
                  </div>
                  <div class="cms-field">
                    <label>Imagine Mascotă (URL)</label>
                    <input
                      type="text"
                      bind:value={rtpConfig.hotImage}
                      class="cms-input"
                      placeholder="ex: URL mascottă de foc"
                      style="border-radius: 99px;"
                    />
                  </div>
                  <div class="cms-field" style="margin-top: 16px;">
                    <label>Sursă Date API (URL)</label>
                    <input
                      type="text"
                      bind:value={rtpConfig.apiUrl}
                      class="cms-input"
                      placeholder="ex: /api/rtp"
                      style="border-radius: 99px;"
                    />
                  </div>
                </div>

                <!-- COLD COLUMN -->
                <div
                  style="background: rgba(56, 189, 248, 0.05); border: 1px solid rgba(56, 189, 248, 0.1); padding: 20px; border-radius: 12px;"
                >
                  <h4
                    style="color: #38bdf8; margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid rgba(56,189,248,0.2); padding-bottom: 8px;"
                  >
                    Jocuri în Creștere (Cold)
                  </h4>
                  <div class="cms-field">
                    <label>Titlu</label>
                    <input
                      type="text"
                      bind:value={rtpConfig.coldTitle}
                      class="cms-input"
                      style="border-radius: 99px;"
                    />
                  </div>
                  <div class="cms-field">
                    <label>Subtitlu</label>
                    <input
                      type="text"
                      bind:value={rtpConfig.coldSubtitle}
                      class="cms-input"
                      style="border-radius: 99px;"
                    />
                  </div>
                  <div class="cms-field">
                    <label>Imagine Mascotă (URL)</label>
                    <input
                      type="text"
                      bind:value={rtpConfig.coldImage}
                      class="cms-input"
                      placeholder="ex: URL mascottă de gheață"
                      style="border-radius: 99px;"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Contextual Integrated Preview -->
            <div class="cms-context-preview">
              <div class="cms-context-preview-header">
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:6px; height:6px; border-radius:50%; background:#22c55e;"></div>
                  <span>PREVIZUALIZARE: WIDGET JOCURI RTP</span>
                </div>
                <div style="display:flex; gap:10px;">
                   <button class="cms-btn-mini" on:click={() => previewDevice = previewDevice === 'mobile' ? 'desktop' : 'mobile'}>
                     {previewDevice === 'mobile' ? '🖥️ Desktop' : '📱 Mobile'}
                   </button>
                   <button class="cms-btn-mini" on:click={refreshPreview}>🔄 Refresh</button>
                </div>
              </div>
              <div class="cms-context-preview-body {previewDevice}">
                <iframe src={previewUrl} title="Module Preview"></iframe>
              </div>
            </div>
          </div>
        {/if}

        <!-- TAB: TOP GAMES -->
        {#if activeTab === "topgames"}
          <div class="cms-tab-content">
            <h1 class="cms-page-title-main">{getTabTitle(activeTab)}</h1>
            <div class="cms-glass-card" style="padding: 24px;">
              <div
                style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;"
              >
                <div>
                  <h3 class="cms-section-title">
                    Top 10 Păcănele (Stil Netflix)
                  </h3>
                  <p style="font-size: 13px; color: var(--text-muted);">
                    Setează jocurile din top și ordinea lor. Se vor afișa cu
                    cifre mari pe fundal.
                  </p>
                </div>
                <label
                  class="cms-toggle-label"
                  style="font-weight: bold; color: var(--accent-gold); font-size: 16px;"
                >
                  <input
                    type="checkbox"
                    bind:checked={topGamesConfig.enabled}
                    on:change={persistDrafts}
                  />
                  {topGamesConfig.enabled
                    ? "AFIȘAT PE SITE (ON)"
                    : "ASCUNS (OFF)"}
                </label>
              </div>

              <div class="cms-field" style="margin-bottom: 24px;">
                <label>Titlu Secțiune</label>
                <input
                  type="text"
                  bind:value={topGamesConfig.title}
                  on:input={persistDrafts}
                  style="background: var(--bg-dark); padding: 12px; border-radius: 99px; border: 1px solid var(--border-color); color: var(--text-main); width: 100%;"
                />
              </div>

              <div style="display: flex; flex-direction: column; gap: 12px;">
                {#each topGamesConfig.games as game, idx}
                  <div
                    style="display: flex; gap: 16px; align-items: center; background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);"
                  >
                    <div
                      style="font-size: 24px; font-weight: 900; color: var(--accent-gold); width: 30px; text-align: center;"
                    >
                      {idx + 1}
                    </div>
                    <div style="flex: 1;">
                      <label
                        style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px;"
                        >Nume Joc</label
                      >
                      <select
                        bind:value={game.name}
                        on:change={(e) => {
                          game.provider =
                            GAMES.find((g) => g.n === e.target.value)?.p ||
                            "Necunoscut";
                          persistDrafts();
                        }}
                        style="background: var(--bg-dark); padding: 8px; border-radius: 99px; border: 1px solid var(--border-color); color: var(--text-main); width: 100%;"
                      >
                        {#each GAMES as g}
                          <option value={g.n}>{g.n} ({g.p})</option>
                        {/each}
                      </select>
                    </div>
                    <div style="width: 150px;">
                      <label
                        style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px;"
                        >Provider</label
                      >
                      <input
                        type="text"
                        bind:value={game.provider}
                        disabled
                        style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 99px; border: 1px solid var(--border-color); color: var(--text-muted); width: 100%;"
                      />
                    </div>
                    <button
                      on:click={() => {
                        topGamesConfig.games.splice(idx, 1);
                        topGamesConfig = topGamesConfig;
                        persistDrafts();
                      }}
                      style="background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); border-radius: 6px; padding: 8px; cursor: pointer; margin-top: 15px;"
                    >
                      Șterge
                    </button>
                  </div>
                {/each}
              </div>

              {#if topGamesConfig.games.length < 10}
                <button
                  on:click={() => {
                    topGamesConfig.games.push({
                      name: GAMES[0].n,
                      provider: GAMES[0].p,
                    });
                    topGamesConfig = topGamesConfig;
                    persistDrafts();
                  }}
                  class="btn-green"
                  style="margin-top: 24px; width: 100%; border-radius: 99px;"
                >
                  + Adaugă Joc în Top ({topGamesConfig.games.length}/10)
                </button>
              {/if}
            </div>

            <!-- Contextual Integrated Preview -->
            <div class="cms-context-preview">
              <div class="cms-context-preview-header">
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:6px; height:6px; border-radius:50%; background:#22c55e;"></div>
                  <span>PREVIZUALIZARE: TOP 10 PĂCĂNELE</span>
                </div>
                <div style="display:flex; gap:10px;">
                   <button class="cms-btn-mini" on:click={() => previewDevice = previewDevice === 'mobile' ? 'desktop' : 'mobile'}>
                     {previewDevice === 'mobile' ? '🖥️ Desktop' : '📱 Mobile'}
                   </button>
                   <button class="cms-btn-mini" on:click={refreshPreview}>🔄 Refresh</button>
                </div>
              </div>
              <div class="cms-context-preview-body {previewDevice}">
                <iframe src={previewUrl} title="Module Preview"></iframe>
              </div>
            </div>
          </div>
        {/if}

        <!-- TAB: GAMIFICATION -->
        {#if activeTab === "gamification"}
          <div class="cms-tab-content gamification-tab">
            <div
              class="cms-glass-card"
              style="padding: 24px; margin-bottom: 24px;"
            >
              <div
                style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;"
              >
                <div>
                  <h3 class="cms-section-title">Configurare Jackpot Global</h3>
                  <p
                    style="font-size: 13px; color: var(--text-muted); margin-bottom: 0;"
                  >
                    Setează numele nivelurilor, valorile de start și rata de
                    creștere.
                  </p>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span
                    style="font-weight: bold; color: {gameData.jackpotEnabled !==
                    false
                      ? '#10b981'
                      : '#ef4444'};"
                    >{gameData.jackpotEnabled !== false
                      ? "ACTIVAT"
                      : "DEZACTIVAT"}</span
                  >
                  <label class="cms-switch" style="transform: scale(1.2);">
                    <input
                      type="checkbox"
                      bind:checked={gameData.jackpotEnabled}
                      on:change={(e) => {
                        if (e.target.checked === undefined)
                          gameData.jackpotEnabled = true;
                      }}
                    />
                    <span class="cms-slider"></span>
                  </label>
                </div>
              </div>
              <div
                style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;"
              >
                {#if gameData.jackpots}
                  {#each Object.entries(gameData.jackpots) as [key, jp]}
                    <div
                      style="background: var(--bg-dark); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color);"
                    >
                      <div
                        style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;"
                      >
                        <input
                          type="text"
                          class="cms-input"
                          bind:value={gameData.jackpots[key].name}
                          style="font-weight: 800; color: {jp.color}; font-size: 16px; padding: 4px 8px; margin-bottom: 0; border-radius: 99px;"
                        />
                      </div>
                      <label class="cms-label">Valoare (RON)</label>
                      <input
                        type="number"
                        step="0.01"
                        class="cms-input"
                        bind:value={gameData.jackpots[key].amount}
                        style="margin-bottom: 10px; border-radius: 99px;"
                      />
                      <label class="cms-label">Creștere per tick</label>
                      <input
                        type="number"
                        step="0.01"
                        class="cms-input"
                        bind:value={gameData.jackpots[key].increment}
                        style="border-radius: 99px;"
                      />
                    </div>
                  {/each}
                {/if}
              </div>
              <div style="margin-top: 24px; display: flex; gap: 16px;">
                <div style="flex: 2;">
                  <label class="cms-label"
                    >Jocuri Eligibile pentru Jackpot</label
                  >
                  <input
                    type="text"
                    class="cms-input"
                    bind:value={gameData.jackpotEligibleGames}
                    placeholder="Introduceți 'Toate' sau ID-urile jocurilor (ex: burning_hot, dice_roll)"
                    style="border-radius: 99px;"
                  />
                </div>
                <div style="flex: 1;">
                  <label class="cms-label">Contribuție din Pariu (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    class="cms-input"
                    bind:value={gameData.jackpotBetContribution}
                    placeholder="ex: 1.5"
                    style="border-radius: 99px;"
                  />
                </div>
              </div>
            </div>

            <div
              class="cms-glass-card"
              style="padding: 24px; margin-bottom: 24px;"
            >
              <div
                style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;"
              >
                <h3 class="cms-section-title" style="margin: 0;">
                  Misiuni Active
                </h3>
                <button
                  class="cms-btn-primary"
                  style="border-radius: 99px;"
                  on:click={() =>
                    (gameData.missions = [
                      ...gameData.missions,
                      {
                        id: "m_" + Date.now(),
                        title: "Misiune Nouă",
                        desc: "",
                        reward: "Bonus",
                        rewardType: "bonus",
                        rewardAmount: 10,
                        target: 1,
                        progress: 0,
                        completed: false,
                        category: "daily",
                      },
                    ])}>+ Adaugă Misiune</button
                >
              </div>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                {#if gameData.missions}
                  {#each gameData.missions as mission, i}
                    <div
                      style="background: var(--bg-dark); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color); display: flex; gap: 16px; align-items: flex-start;"
                    >
                      <div
                        style="flex: 1; display: flex; flex-direction: column; gap: 12px;"
                      >
                        <div style="display: flex; gap: 16px;">
                          <div style="flex: 1;">
                            <label class="cms-label">Titlu</label><input
                              type="text"
                              class="cms-input"
                              bind:value={mission.title}
                              style="border-radius: 99px;"
                            />
                          </div>
                          <div style="flex: 2;">
                            <label class="cms-label">Descriere</label><input
                              type="text"
                              class="cms-input"
                              bind:value={mission.desc}
                              style="border-radius: 99px;"
                            />
                          </div>
                        </div>
                        <div style="display: flex; gap: 16px;">
                          <div style="width: 120px;">
                            <label class="cms-label">Target (nr.)</label><input
                              type="number"
                              class="cms-input"
                              bind:value={mission.target}
                              style="border-radius: 99px;"
                            />
                          </div>
                          <div style="flex: 2;">
                            <label class="cms-label">Recompensă (text)</label
                            ><input
                              type="text"
                              class="cms-input"
                              bind:value={mission.reward}
                              style="border-radius: 99px;"
                            />
                          </div>
                          <div style="flex: 1;">
                            <label class="cms-label">Tip</label>
                            <select
                              class="cms-input"
                              bind:value={mission.category}
                              style="border-radius: 99px;"
                            >
                              <option value="daily">Zilnică</option>
                              <option value="weekly">Săptămânală</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <button
                        class="cms-btn-danger"
                        style="margin-top: 24px; border-radius: 99px;"
                        on:click={() =>
                          (gameData.missions = gameData.missions.filter(
                            (m) => m.id !== mission.id,
                          ))}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          width="16"
                          height="16"
                          ><polyline points="3 6 5 6 21 6" /><path
                            d="M19 6l-1 14H6L5 6"
                          /><path d="M10 11v6M14 11v6" /><path
                            d="M9 6V4h6v2"
                          /></svg
                        >
                      </button>
                    </div>
                  {/each}
                {/if}
              </div>
            </div>

            <!-- Tournament Config -->
            <div
              class="cms-glass-card"
              style="padding: 24px; margin-bottom: 24px;"
            >
              <h3 class="cms-section-title">Turneu Curent</h3>
              {#if gameData.tournament}
                <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                  <div style="flex: 2;">
                    <label class="cms-label">Nume Turneu</label><input
                      type="text"
                      class="cms-input"
                      bind:value={gameData.tournament.name}
                      style="border-radius: 99px;"
                    />
                  </div>
                  <div style="flex: 1;">
                    <label class="cms-label">Data Încheierii</label><input
                      type="text"
                      class="cms-input"
                      bind:value={gameData.tournament.endsAt}
                      placeholder="ex: 2026-05-15 20:00"
                      style="border-radius: 99px;"
                    />
                  </div>
                  <div style="flex: 1;">
                    <label class="cms-label">Fond Premii</label><input
                      type="text"
                      class="cms-input"
                      bind:value={gameData.tournament.prizePool}
                      style="border-radius: 99px;"
                    />
                  </div>
                </div>
                <div style="margin-top: 16px;">
                  <label class="cms-label">Jocuri Participante la Turneu</label>
                  <input
                    type="text"
                    class="cms-input"
                    bind:value={gameData.tournament.participatingGames}
                    placeholder="Introduceți 'Toate' sau ID-urile jocurilor (ex: sweet_bonanza, dog_house)"
                    style="border-radius: 99px;"
                  />
                </div>
              {/if}
            </div>

            <div
              class="cms-glass-card"
              style="padding: 24px; margin-bottom: 24px;"
            >
              <h3 class="cms-section-title">Club Fidelizare (Program VIP)</h3>
              {#if gameData.loyaltyConfig}
                <div
                  style="display: flex; gap: 16px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border-color);"
                >
                  <div style="flex: 1;">
                    <label class="cms-label"
                      >Rata de conversie (RON rulați pentru 1 punct XP)</label
                    ><input
                      type="number"
                      class="cms-input"
                      bind:value={gameData.loyaltyConfig.conversionRate}
                      placeholder="ex: 50"
                      style="border-radius: 99px;"
                    />
                  </div>
                  <div style="flex: 2;">
                    <label class="cms-label"
                      >Jocuri care nu generează XP (Blacklist)</label
                    ><input
                      type="text"
                      class="cms-input"
                      bind:value={gameData.loyaltyConfig.excludedGames}
                      placeholder="ex: ruleta_live, blackjack"
                      style="border-radius: 99px;"
                    />
                  </div>
                </div>

                <p
                  style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;"
                >
                  Trepte și Recompense la Avansare
                </p>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  {#each gameData.loyaltyConfig.tiers as tier, i}
                    <div
                      style="display: flex; gap: 16px; align-items: flex-start; background: var(--bg-dark); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color);"
                    >
                      <div style="flex: 1;">
                        <label class="cms-label">Rang</label><input
                          type="text"
                          class="cms-input"
                          bind:value={tier.name}
                          style="border-radius: 99px;"
                        />
                      </div>
                      <div style="flex: 1;">
                        <label class="cms-label">Puncte Necesare</label><input
                          type="number"
                          class="cms-input"
                          bind:value={tier.pointsRequired}
                          style="border-radius: 99px;"
                        />
                      </div>
                      <div style="flex: 1;">
                        <label class="cms-label">Multiplicator Viteza XP</label
                        ><input
                          type="number"
                          step="0.1"
                          class="cms-input"
                          bind:value={tier.xpMultiplier}
                          style="border-radius: 99px;"
                        />
                      </div>
                      <div style="flex: 1;">
                        <label class="cms-label">Recompensă Level Up</label
                        ><input
                          type="text"
                          class="cms-input"
                          bind:value={tier.levelUpReward}
                          placeholder="ex: 100 FS sau 50 RON"
                          style="border-radius: 99px;"
                        />
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

            <div
              class="cms-glass-card"
              style="padding: 24px; margin-bottom: 24px;"
            >
              <h3 class="cms-section-title">Setări Cashback Săptămânal</h3>
              {#if gameData.cashbackConfig}
                <div
                  style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px;"
                >
                  <div>
                    <label class="cms-label">Procentaj de Bază (%)</label><input
                      type="number"
                      class="cms-input"
                      bind:value={gameData.cashbackConfig.basePercentage}
                      style="border-radius: 99px;"
                    />
                  </div>
                  <div>
                    <label class="cms-label">Pierdere Minimă (RON)</label><input
                      type="number"
                      class="cms-input"
                      bind:value={gameData.cashbackConfig.minLoss}
                      style="border-radius: 99px;"
                    />
                  </div>
                  <div>
                    <label class="cms-label">Cashback Maxim (RON)</label><input
                      type="number"
                      class="cms-input"
                      bind:value={gameData.cashbackConfig.maxAmount}
                      style="border-radius: 99px;"
                    />
                  </div>
                  <div>
                    <label class="cms-label">Ziua Acordării</label>
                    <select
                      class="cms-input"
                      bind:value={gameData.cashbackConfig.awardDay}
                      style="border-radius: 99px;"
                    >
                      <option value="Luni">Luni</option>
                      <option value="Vineri">Vineri</option>
                      <option value="Duminica">Duminica</option>
                    </select>
                  </div>
                  <div>
                    <label class="cms-label">Condiții Rulaj Cashback (x)</label
                    ><input
                      type="number"
                      class="cms-input"
                      bind:value={gameData.cashbackConfig.wagering}
                      placeholder="ex: 1 (pentru rulaj x1)"
                      style="border-radius: 99px;"
                    />
                  </div>
                  <div>
                    <label class="cms-label">Valabilitate Bonus (zile)</label
                    ><input
                      type="number"
                      class="cms-input"
                      bind:value={gameData.cashbackConfig.validityDays}
                      placeholder="ex: 3"
                      style="border-radius: 99px;"
                    />
                  </div>
                </div>
              {/if}
            </div>

            <!-- Wheel Config -->
            <div
              class="cms-glass-card"
              style="padding: 24px; margin-bottom: 24px;"
            >
              <div
                style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;"
              >
                <div>
                  <h3 class="cms-section-title">Roata Norocului - Premii</h3>
                  <p style="font-size: 13px; color: var(--text-muted);">
                    Ajustează felia și culorile. Modificările se văd direct în
                    preview-ul din dreapta.
                  </p>
                </div>

                <!-- LIVE WHEEL PREVIEW IN CMS -->
                <div
                  style="position: relative; width: 140px; height: 140px; border-radius: 50%; border: 4px solid #1e293b; box-shadow: 0 0 20px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.5); background: conic-gradient({adminWheelGradient});"
                >
                  <div
                    style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 15px solid #ef4444; z-index: 2; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));"
                  ></div>
                  <div
                    style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 30px; height: 30px; background: #0f172a; border-radius: 50%; border: 2px solid #334155; z-index: 2; box-shadow: 0 0 10px rgba(0,0,0,0.5);"
                  ></div>
                  <div
                    style="position: absolute; bottom: -24px; width: 100%; text-align: center; font-size: 11px; font-weight: 700; color: #10b981;"
                  >
                    LIVE PREVIEW
                  </div>
                </div>
              </div>

              <div
                style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;"
              >
                {#each gameData.wheelPrizes || [] as prize, i}
                  <div
                    style="background: var(--bg-dark); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); display: flex; gap: 12px; align-items: center;"
                  >
                    <input
                      type="color"
                      bind:value={prize.color}
                      style="width: 40px; height: 40px; border: none; border-radius: 8px; cursor: pointer; padding: 0; background: none;"
                    />
                    <div
                      style="flex: 1; display: flex; flex-direction: column; gap: 8px;"
                    >
                      <input
                        type="text"
                        class="cms-input"
                        bind:value={prize.label}
                        placeholder="Text felie"
                        style="border-radius: 99px;"
                      />
                      <div
                        style="display: flex; gap: 8px; align-items: center;"
                      >
                        <span style="font-size: 11px; color: var(--text-muted);"
                          >Șansă:</span
                        >
                        <input
                          type="number"
                          class="cms-input"
                          bind:value={prize.probability}
                          style="width: 60px; padding: 6px; border-radius: 99px;"
                        />
                        <span style="font-size: 11px; color: var(--text-muted);"
                          >%</span
                        >
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        {#if activeTab === "vip"}
          <div class="cms-tab-content" in:fade>
            <div class="cms-glass-card" style="padding: 24px; margin-bottom: 24px;">
              <h3 class="cms-section-title">👑 Configurare Pagină Club VIP</h3>
              <p style="font-size:13px; color: var(--text-muted); margin-bottom: 24px;">
                Personalizează textele, culorile și pozele pentru fiecare nivel VIP.
              </p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
                <div>
                  <label class="cms-label">Titlu Pagină</label>
                  <input type="text" class="cms-input" bind:value={vipConfig.title} on:input={() => cmsDraftVipConfig.set(vipConfig)} />
                  <div style="display: flex; gap: 12px; margin-top: 12px;">
                    <div>
                      <label class="cms-label" style="font-size: 11px;">Culoare Titlu</label>
                      <input type="color" bind:value={vipConfig.titleColor} on:change={() => cmsDraftVipConfig.set(vipConfig)} style="width: 100%; height: 32px; padding: 2px; border-radius: 4px; border: 1px solid var(--border-color); background: transparent;" />
                    </div>
                    <div>
                      <label class="cms-label" style="font-size: 11px;">Mărime Font (px)</label>
                      <input type="number" bind:value={vipConfig.titleSize} on:input={() => cmsDraftVipConfig.set(vipConfig)} style="width: 60px; height: 32px; padding: 4px; border-radius: 4px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: #fff;" />
                    </div>
                  </div>
                </div>
                <div>
                  <label class="cms-label">Subtitlu Pagină</label>
                  <input type="text" class="cms-input" bind:value={vipConfig.subtitle} on:input={() => cmsDraftVipConfig.set(vipConfig)} />
                  <div style="display: flex; gap: 12px; margin-top: 12px;">
                    <div>
                      <label class="cms-label" style="font-size: 11px;">Culoare Subtitlu</label>
                      <input type="color" bind:value={vipConfig.subtitleColor} on:change={() => cmsDraftVipConfig.set(vipConfig)} style="width: 100%; height: 32px; padding: 2px; border-radius: 4px; border: 1px solid var(--border-color); background: transparent;" />
                    </div>
                    <div>
                      <label class="cms-label" style="font-size: 11px;">Mărime Font (px)</label>
                      <input type="number" bind:value={vipConfig.subtitleSize} on:input={() => cmsDraftVipConfig.set(vipConfig)} style="width: 60px; height: 32px; padding: 4px; border-radius: 4px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: #fff;" />
                    </div>
                  </div>
                </div>
              </div>

              <div style="height: 1px; background: var(--border-color); margin: 32px 0;"></div>

              <h4 class="cms-section-title" style="font-size: 16px; margin-bottom: 20px;">Niveluri VIP (1 - 5)</h4>
              <div style="display: flex; flex-direction: column; gap: 16px;">
                {#each vipConfig.levels as level, i}
                  <div class="cms-field" style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color);">
                    <div style="display: flex; align-items: center; gap: 16px;">
                      <div style="width: 40px; height: 40px; background: var(--accent-gold); color: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900;">{i+1}</div>
                      <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: grid; grid-template-columns: 1.5fr 1fr 2fr; gap: 16px;">
                          <div>
                            <label class="cms-label" style="font-size: 11px;">Nume Nivel</label>
                            <input type="text" class="cms-input" bind:value={level.name} on:input={() => cmsDraftVipConfig.set(vipConfig)} style="padding: 6px 12px; width: 100%;" />
                          </div>
                          <div>
                            <label class="cms-label" style="font-size: 11px;">Rank / Text</label>
                            <input type="text" class="cms-input" bind:value={level.rank} on:input={() => cmsDraftVipConfig.set(vipConfig)} style="padding: 6px 12px; width: 100%;" />
                          </div>
                          <div>
                            <label class="cms-label" style="font-size: 11px;">Imagine</label>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                               <div style="display: flex; gap: 8px; align-items: center;">
                                 <input type="text" class="cms-input" bind:value={level.img} on:input={() => cmsDraftVipConfig.set(vipConfig)} style="padding: 6px 12px; flex: 1; font-size: 12px;" placeholder="URL sau Emoji..." />
                                 {#if level.img && (level.img.startsWith('/') || level.img.startsWith('data:'))}
                                   <img src={level.img} alt="Preview" style="width: 38px; height: 38px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color); background: #000;" />
                                 {:else if level.img}
                                   <div style="font-size: 24px; min-width: 38px; text-align: center;">{level.img}</div>
                                 {/if}
                               </div>
                               <div style="position: relative;">
                                 <input 
                                   type="file" 
                                   accept="image/*" 
                                   on:change={(e) => handleVipImageUpload(e, i)} 
                                   id="vip-img-{i}"
                                   style="display: none;" 
                                 />
                                 <label for="vip-img-{i}" class="cms-btn-primary" style="display: block; text-align: center; padding: 6px; font-size: 11px; cursor: pointer; background: rgba(255,255,255,0.05); border: 1px dashed var(--border-color); color: var(--text-muted);">
                                   📁 Încarcă Poză Nivel {i+1}
                                 </label>
                               </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label class="cms-label" style="font-size: 11px;">Beneficii Nivel (separate prin virgulă)</label>
                          <input type="text" class="cms-input" value={(level.benefits || []).join(', ')} on:input={(e) => { level.benefits = e.target.value.split(',').map(s=>s.trim()).filter(s=>s); cmsDraftVipConfig.set(vipConfig); }} style="padding: 6px 12px; width: 100%;" placeholder="Cashback: 5%, Retrageri rapide..." />
                        </div>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>

              <!-- Visual Editor for VIP Rewards Grid -->
              <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1);">
                <h3 class="cms-section-title">Niveluri și Recompense Detaliate (Carduri sub Progress)</h3>
                <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 24px;">Editați descrierile și cardurile afișate pentru fiecare nivel VIP.</p>
                
                <div style="display: flex; flex-direction: column; gap: 24px;">
                  {#each vipConfig.rewardsGrid || [] as rGrid, rIndex}
                    <div class="cms-glass-card" style="padding: 16px; background: rgba(0,0,0,0.2);">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h4 style="font-size: 14px; font-weight: 700; color: #f5c842;">Card {rGrid.levelName}</h4>
                      </div>
                      
                      <div class="cms-fields-grid" style="grid-template-columns: 1fr 1fr 1fr;">
                        <div class="cms-field">
                          <label style="font-size: 11px;">Nume Nivel (ex: NIVEL 1)</label>
                          <input type="text" class="cms-input" bind:value={rGrid.levelName} on:input={() => cmsDraftVipConfig.set(vipConfig)} />
                        </div>
                        <div class="cms-field">
                          <label style="font-size: 11px;">Puncte (ex: 0 — 2)</label>
                          <input type="text" class="cms-input" bind:value={rGrid.points} on:input={() => cmsDraftVipConfig.set(vipConfig)} />
                        </div>
                        <div class="cms-field">
                          <label style="font-size: 11px;">Cashback Săptămânal (ex: 3% sau gol)</label>
                          <input type="text" class="cms-input" bind:value={rGrid.cashback} on:input={() => cmsDraftVipConfig.set(vipConfig)} />
                        </div>
                      </div>

                      <div style="margin-top: 16px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px;">
                        <h5 style="font-size: 12px; margin-bottom: 12px; color: #cbd5e1;">Bonusuri incluse pe card:</h5>
                        {#each rGrid.bonuses || [] as bonus, bIndex}
                          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                            <input type="text" class="cms-input" style="flex: 1;" placeholder="Suma (ex: 50 FS)" bind:value={bonus.amount} on:input={() => cmsDraftVipConfig.set(vipConfig)} />
                            <input type="text" class="cms-input" style="flex: 2;" placeholder="Joc (ex: Shining Crown)" bind:value={bonus.game} on:input={() => cmsDraftVipConfig.set(vipConfig)} />
                            <input type="text" class="cms-input" style="flex: 1;" placeholder="Depunere min. (ex: 70 RON)" bind:value={bonus.minDeposit} on:input={() => cmsDraftVipConfig.set(vipConfig)} />
                            <input type="text" class="cms-input" style="flex: 1;" placeholder="Pariu (ex: 0,2 RON)" bind:value={bonus.bet} on:input={() => cmsDraftVipConfig.set(vipConfig)} />
                            <button class="cms-btn-danger" style="padding: 0 8px; border-radius: 6px;" on:click={() => { rGrid.bonuses.splice(bIndex, 1); rGrid.bonuses = rGrid.bonuses; vipConfig.rewardsGrid = vipConfig.rewardsGrid; cmsDraftVipConfig.set(vipConfig); }}>✕</button>
                          </div>
                        {/each}
                        <button class="cms-btn-secondary" style="font-size: 11px; margin-top: 8px;" on:click={() => { if(!rGrid.bonuses) rGrid.bonuses = []; rGrid.bonuses.push({amount: '10 FS', game: 'Joc', minDeposit: '0 RON', bet: ''}); rGrid.bonuses = rGrid.bonuses; vipConfig.rewardsGrid = vipConfig.rewardsGrid; cmsDraftVipConfig.set(vipConfig); }}>+ Adaugă Bonus</button>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- TAB: HISTORY -->
        <!-- TAB: TOOLBAR WIDGET -->
        {#if activeTab === "toolbar"}
          <div class="cms-tab-content">
            <h1 class="cms-page-title-main">{getTabTitle(activeTab)}</h1>
            <div class="cms-glass-card" style="padding: 24px;">
              <h3 class="cms-section-title">⚙️ Configurare Toolbar Widget</h3>
              <p style="font-size:13px; color: var(--text-muted); margin-bottom: 24px;">
                Toolbar-ul este o bară flotantă care apare pe site cu shortcut-uri rapide. Poți seta forma, poziția și ce apare.
              </p>

              <!-- Global toggles -->
              <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 24px;">
                <label class="cms-toggle-label" style="color: #22c55e; font-weight: 800;">
                  <input type="checkbox" bind:checked={toolbarConfig.enabled} /> Activat
                </label>
                <label class="cms-toggle-label">
                  <input type="checkbox" bind:checked={toolbarConfig.showWidgetBg} /> Afișează Fundal
                </label>
              </div>

              <div style="margin-bottom: 20px;">
                <label class="cms-label" style="display:block; margin-bottom:8px; font-weight: 700;">Poziție</label>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  {#each ['top','bottom','left','right','header'] as pos}
                    <button
                      on:click={() => toolbarConfig.position = pos}
                      style="padding: 8px 20px; border-radius: 99px; font-weight: 700; font-size: 13px; cursor: pointer; border: 2px solid {toolbarConfig.position === pos ? 'var(--accent-gold)' : 'var(--border-color)'}; background: {toolbarConfig.position === pos ? 'rgba(245,200,66,0.15)' : 'var(--bg-hover)'}; color: {toolbarConfig.position === pos ? 'var(--accent-gold)' : 'var(--text-muted)'}; transition: all 0.2s;"
                    >{pos}</button>
                  {/each}
                </div>
              </div>

              <div style="margin-bottom: 24px;">
                <label class="cms-label" style="display:block; margin-bottom:8px; font-weight: 700;">Grosime (Mărime)</label>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  {#each ['S','M','L','XL'] as sz}
                    <button
                      on:click={() => toolbarConfig.size = sz}
                      style="padding: 8px 20px; border-radius: 99px; font-weight: 700; font-size: 13px; cursor: pointer; border: 2px solid {(toolbarConfig.size || 'S') === sz ? 'var(--accent-gold)' : 'var(--border-color)'}; background: {(toolbarConfig.size || 'S') === sz ? 'rgba(245,200,66,0.15)' : 'var(--bg-hover)'}; color: {(toolbarConfig.size || 'S') === sz ? 'var(--accent-gold)' : 'var(--text-muted)'}; transition: all 0.2s;"
                    >{sz}</button>
                  {/each}
                </div>
              </div>

              <!-- Shape & Mode -->
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                <div>
                  <label class="cms-label" style="display:block; margin-bottom:8px; font-weight: 700;">Formă</label>
                  <div style="display: flex; gap: 8px;">
                    {#each [{v:'round', label:'● Rotund'},{v:'card', label:'■ Card'}] as sh}
                      <button
                        on:click={() => toolbarConfig.shape = sh.v}
                        style="padding: 8px 18px; border-radius: 99px; font-weight: 700; font-size: 13px; cursor: pointer; border: 2px solid {toolbarConfig.shape === sh.v ? 'var(--accent-gold)' : 'var(--border-color)'}; background: {toolbarConfig.shape === sh.v ? 'rgba(245,200,66,0.15)' : 'var(--bg-hover)'}; color: {toolbarConfig.shape === sh.v ? 'var(--accent-gold)' : 'var(--text-muted)'}; transition: all 0.2s;"
                      >{sh.label}</button>
                    {/each}
                  </div>
                </div>
                <div>
                  <label class="cms-label" style="display:block; margin-bottom:8px; font-weight: 700;">Tip Afișare</label>
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    {#each [{v:'floating', label:'🚀 Floating'},{v:'inline', label:'📜 In-line'},{v:'bottom_bar', label:'📥 Bottom Bar'}] as md}
                      <button
                        on:click={() => toolbarConfig.displayMode = md.v}
                        style="padding: 8px 18px; border-radius: 99px; font-weight: 700; font-size: 13px; cursor: pointer; border: 2px solid {toolbarConfig.displayMode === md.v ? 'var(--accent-gold)' : 'var(--border-color)'}; background: {toolbarConfig.displayMode === md.v ? 'rgba(245,200,66,0.15)' : 'var(--bg-hover)'}; color: {toolbarConfig.displayMode === md.v ? 'var(--accent-gold)' : 'var(--text-muted)'}; transition: all 0.2s;"
                      >{md.label}</button>
                    {/each}
                  </div>
                </div>
                <div>
                  <label class="cms-label" style="display:block; margin-bottom:8px; font-weight: 700;">🎨 Culoare Contur Global</label>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <input type="color" bind:value={toolbarConfig.borderColor} style="width:36px; height:36px; border:none; padding:0; background:transparent; cursor:pointer;" />
                    <input type="text" bind:value={toolbarConfig.borderColor} style="width: 100px; font-family: monospace; font-size: 11px;" />
                  </div>
                </div>
              </div>

              {#if toolbarConfig.displayMode === 'inline'}
                <div style="margin-bottom: 24px; padding: 16px; background: rgba(245,200,66,0.05); border: 1px solid var(--accent-gold); border-radius: 12px;">
                  <label class="cms-label" style="display:block; margin-bottom:8px; font-weight: 700;">Poziție în Pagină (In-line)</label>
                  <select bind:value={toolbarConfig.inlinePosition}
                    style="width: 100%; padding: 10px; border-radius: 99px; background: var(--bg-hover); border: 1px solid var(--border-color); color: #fff; outline: none;">
                    <option value="after_hero">După Bannere Principale (Hero)</option>
                    {#each (categories || []) as cat}
                      {#if cat.showOnPage}
                        <option value="after_cat_{cat.id}">După Categoria: {cat.name}</option>
                      {/if}
                    {/each}
                  </select>
                </div>
              {/if}

              <h3 class="cms-section-title" style="margin-bottom: 12px;">Elemente Toolbar</h3>
              <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px;">
                {#each (toolbarConfig.items || []) as item, i}
                  <div class="cms-glass-card cms-row" style="padding: 14px 18px; gap: 12px; align-items: center; border-radius: 99px;">
                    <span style="font-size: 22px; min-width: 32px; text-align:center;">{item.icon}</span>
                    <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
                      <div style="display:flex; gap: 10px; align-items:center; flex-wrap:wrap;">
                        <input type="text" bind:value={item.icon} placeholder="Emoji" style="width: 40px; background:var(--bg-hover); border:1px solid var(--border-color); color:var(--text-main); padding:4px 8px; border-radius:99px; font-size:16px; outline:none;" />
                        <label style="cursor:pointer; display:flex; align-items:center; gap:4px; font-size:11px; background:rgba(255,255,255,0.05); padding:4px 10px; border-radius:99px; border:1px dashed rgba(255,255,255,0.2);">
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          {item.imgUrl ? 'Schimbă' : 'Upload'}
                          <input type="file" accept="image/*" class="hidden" on:change={(e) => handleToolbarIconUpload(e, i)} />
                        </label>
                        <input type="text" bind:value={item.label} placeholder="Etichetă" style="width: 110px; background:var(--bg-hover); border:1px solid var(--border-color); color:var(--text-main); padding:4px 8px; border-radius:99px; font-size:13px; outline:none;" />
                        <select bind:value={item.type} style="background:var(--bg-hover); border:1px solid var(--border-color); color:var(--text-main); padding:4px 8px; border-radius:99px; font-size:13px; outline:none;">
                          <option value="nav">Navigare</option>
                          <option value="wallet">Portofel (User)</option>
                          <option value="jackpot">Jackpot</option>
                          <option value="wheel">Roata Norocului</option>
                          <option value="category">Categorie</option>
                          <option value="game">Joc Specific</option>
                          <option value="deposit">Depunere (Quick)</option>
                          <option value="random">Joc Norocos (Random)</option>
                          <option value="lastPlayed">Ultimul Joc (Continue)</option>
                        </select>
                        {#if item.type === 'category'}
                          <select bind:value={item.target} style="background:var(--bg-hover); border:1px solid var(--border-color); color:var(--text-main); padding:4px 8px; border-radius:99px; font-size:12px; outline:none;">
                            {#each categories as cat}<option value={cat.id}>{cat.name}</option>{/each}
                          </select>
                        {/if}
                        {#if item.type === 'game'}
                          <select bind:value={item.gameData} style="background:var(--bg-hover); border:1px solid var(--border-color); color:var(--text-main); padding:4px 8px; border-radius:99px; font-size:12px; outline:none; max-width: 150px;">
                            {#each GAMES.flatMap(c => c.games) as g}<option value={g}>{g.n}</option>{/each}
                          </select>
                        {/if}
                      </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.2); padding: 4px 10px; border-radius: 99px; border: 1px solid var(--border-color);">
                       <span style="font-size: 9px; font-weight: 800; color: var(--text-muted);">CONTUR:</span>
                       <input type="color" bind:value={item.borderColor} style="width: 18px; height: 18px; border: none; padding: 0; background: transparent; cursor: pointer;" />
                    </div>
                    <label class="cms-toggle-label"><input type="checkbox" bind:checked={item.enabled} /> Activ</label>
                    <button class="cms-btn-danger" on:click={() => toolbarConfig.items = toolbarConfig.items.filter((_, idx) => idx !== i)} style="padding:6px; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center;">×</button>
                  </div>
                {/each}
                <button class="cms-btn-add" on:click={() => toolbarConfig.items = [...(toolbarConfig.items || []), { icon: '⭐', label: 'Nou', type: 'nav', target: 'home', enabled: true }]} style="border-radius: 99px;">+ Adaugă Element Toolbar</button>
              </div>

              <hr style="border:none; border-top:1px solid var(--border-color); margin:32px 0;" />

              <h3 class="cms-section-title" style="margin-bottom: 12px;">🔝 Widget-uri Header Bar (Lângă Search)</h3>
              <p style="font-size:11px; color: var(--text-muted); margin-bottom: 16px;">Aceste widget-uri apar în partea de sus a site-ului, lângă bara de căutare. Sunt ideale pentru scurtături rapide la Arena, Roată sau Cashback.</p>
              
              <label class="cms-toggle-label" style="margin-bottom: 16px; color: #22c55e;">
                <input type="checkbox" bind:checked={headerWidgetsConfig.enabled} /> Activează Widget-uri Header
              </label>

              <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 32px;">
                {#each (headerWidgetsConfig.items || []) as item}
                  <div class="cms-glass-card" style="padding: 12px 16px; display: flex; align-items: center; gap: 12px; border-radius: 99px;">
                    <div style="width:30px; height:30px; border-radius:50%; background:{item.color}; color:#000; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:800;">{item.icon}</div>
                    <div style="flex:1;"><input type="text" bind:value={item.label} style="background:transparent; border:none; color:#fff; font-weight:700; font-size:13px; width:100%; outline:none;" /></div>
                    <div style="display:flex; align-items:center; gap:8px;">
                       <input type="color" bind:value={item.color} style="width:24px; height:24px; padding:0; border:none; background:transparent; cursor:pointer;" />
                       <label class="cms-toggle-label" style="margin:0;"><input type="checkbox" bind:checked={item.enabled} /> Activ</label>
                    </div>
                  </div>
                {/each}
              </div>

              <div style="display:flex; flex-direction:column; gap:16px; border-top:1px solid var(--border-color); padding-top: 24px;">
                <h3 class="cms-section-title" style="font-size:14px;">Elemente Adiționale Header</h3>
                
                <!-- Deposit Button -->
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:16px 20px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="font-weight:800; color:var(--text-main);">💳 Buton Depune Acum</div>
                    <label class="cms-toggle-label" style="color:#22c55e; margin:0;">
                      <input type="checkbox" bind:checked={sidebarWidgetsConfig.depositButton.enabled} /> Activ
                    </label>
                  </div>
                  <div style="display:flex; gap:8px; align-items:center;">
                    <label style="font-size:12px; color:var(--text-muted); min-width:60px;">Etichetă:</label>
                    <input type="text" bind:value={sidebarWidgetsConfig.depositButton.label}
                      style="flex:1; background:var(--bg-hover); border:1px solid var(--border-color); color:var(--text-main); padding:6px 12px; border-radius:99px; font-size:13px; outline:none;" />
                  </div>
                </div>

                <!-- Notification Bell -->
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
                  <div style="font-weight:800; color:var(--text-main);">🔔 Clopoțel Notificări</div>
                  <label class="cms-toggle-label" style="color:#22c55e; margin:0;">
                    <input type="checkbox" bind:checked={sidebarWidgetsConfig.notificationBell.enabled} /> Activ
                  </label>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- TAB: SIDEBAR NAV -->
        {#if activeTab === "sidebarnav"}
          <div class="cms-tab-content">
            <h1 class="cms-page-title-main">{getTabTitle(activeTab)}</h1>
            <div class="cms-glass-card" style="padding: 24px;">
              <h3 class="cms-section-title">📋 Configurare Sidebar Nav</h3>
              <p style="font-size:13px; color: var(--text-muted); margin-bottom: 24px;">
                Controlează vizibilitatea, poziția și modul de afișare al barei laterale.
              </p>

              <!-- Global Sidebar Controls -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; background: rgba(255,255,255,0.03); padding: 20px; border-radius: 16px; border: 1px solid var(--border-color);">
                <div>
                  <label class="cms-label" style="display:block; margin-bottom:8px; font-weight: 700;">Vizibilitate</label>
                  <label class="cms-toggle-label" style="color: #22c55e;">
                    <input type="checkbox" bind:checked={sidebarNavConfig.enabled} /> Afișează Sidebar
                  </label>
                </div>
                <div>
                  <label class="cms-label" style="display:block; margin-bottom:8px; font-weight: 700;">Poziție</label>
                  <div style="display: flex; gap: 8px;">
                    {#each ['left', 'right'] as pos}
                      <button
                        on:click={() => sidebarNavConfig.position = pos}
                        style="padding: 8px 20px; border-radius: 99px; font-weight: 700; font-size: 13px; cursor: pointer; border: 2px solid {sidebarNavConfig.position === pos ? 'var(--accent-gold)' : 'var(--border-color)'}; background: {sidebarNavConfig.position === pos ? 'rgba(245,200,66,0.15)' : 'var(--bg-hover)'}; color: {sidebarNavConfig.position === pos ? 'var(--accent-gold)' : 'var(--text-muted)'}; transition: all 0.2s;"
                      >{pos}</button>
                    {/each}
                  </div>
                </div>
                <div>
                  <label class="cms-label" style="display:block; margin-bottom:8px; font-weight: 700;">Mod Afișare</label>
                  <div style="display: flex; gap: 8px;">
                    {#each [{v:'full', l:'Complet'}, {v:'mini', l:'Compact'}] as m}
                      <button
                        on:click={() => sidebarNavConfig.mode = m.v}
                        style="padding: 8px 20px; border-radius: 99px; font-weight: 700; font-size: 13px; cursor: pointer; border: 2px solid {sidebarNavConfig.mode === m.v ? 'var(--accent-gold)' : 'var(--border-color)'}; background: {sidebarNavConfig.mode === m.v ? 'rgba(245,200,66,0.15)' : 'var(--bg-hover)'}; color: {sidebarNavConfig.mode === m.v ? 'var(--accent-gold)' : 'var(--text-muted)'}; transition: all 0.2s;"
                      >{m.l}</button>
                    {/each}
                  </div>
                </div>
                <div>
                  <label class="cms-label" style="display:block; margin-bottom:8px; font-weight: 700;">✨ Efecte Speciale</label>
                  <label class="cms-toggle-label" style="color: var(--accent-gold);">
                    <input type="checkbox" bind:checked={sidebarNavConfig.bubblesEnabled} /> Bule în fundal
                  </label>
                </div>
              </div>

              <!-- Sidebar Items -->
              <h3 class="cms-section-title" style="margin-bottom: 12px;">Elemente Navigație</h3>

              {#each sidebarNavConfig.items as item, i}
                <div class="cms-glass-card cms-row" style="padding: 16px 20px; margin-bottom: 10px; gap: 16px; align-items: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px;">
                  <div style="display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;">
                    <button class="cms-btn-icon" style="width: 32px; height: 32px; border-radius: 50%; font-size: 12px; background: rgba(0,0,0,0.3); color: var(--text-main); border: 1px solid var(--border-color);" on:click={() => {
                        if (i > 0) {
                            const tmp = sidebarNavConfig.items[i];
                            sidebarNavConfig.items[i] = sidebarNavConfig.items[i-1];
                            sidebarNavConfig.items[i-1] = tmp;
                            sidebarNavConfig.items = [...sidebarNavConfig.items];
                        }
                    }}>▲</button>
                    <button class="cms-btn-icon" style="width: 32px; height: 32px; border-radius: 50%; font-size: 12px; background: rgba(0,0,0,0.3); color: var(--text-main); border: 1px solid var(--border-color);" on:click={() => {
                        if (i < sidebarNavConfig.items.length - 1) {
                            const tmp = sidebarNavConfig.items[i];
                            sidebarNavConfig.items[i] = sidebarNavConfig.items[i+1];
                            sidebarNavConfig.items[i+1] = tmp;
                            sidebarNavConfig.items = [...sidebarNavConfig.items];
                        }
                    }}>▼</button>
                  </div>

                  <div style="display:flex; align-items:center; gap:16px; flex:1;">
                    <!-- Icon Selector -->
                    <div style="display: flex; flex-direction: column; gap: 4px; width: 100px; flex-shrink: 0;">
                      <div style="width:48px; height:48px; background:var(--bg-hover); border-radius:12px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); position:relative; margin: 0 auto;">
                          {#if item.icon && (item.icon.startsWith('http') || item.icon.startsWith('data:'))}
                              <img src={item.icon} alt="icon" style="height:28px; border-radius:6px;" />
                              <button on:click={() => { item.icon = '🔹'; sidebarNavConfig = {...sidebarNavConfig}; }} 
                                  style="position:absolute; top:-6px; right:-6px; background:#ef4444; color:white; border:none; border-radius:50%; width:16px; height:16px; font-size:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">×</button>
                          {:else}
                              <span style="font-size:24px;">{item.icon}</span>
                          {/if}
                      </div>
                      <div style="position:relative; width: 100%;">
                          <input type="file" accept="image/*" on:change={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                      item.icon = ev.target.result;
                                      sidebarNavConfig = {...sidebarNavConfig};
                                  };
                                  reader.readAsDataURL(file);
                              }
                          }} style="position:absolute; opacity:0; width:100%; height:100%; cursor:pointer;" />
                          <button class="cms-btn-sm" style="font-size:10px; padding:4px; width:100%; border: 1px solid var(--border-color); background: var(--bg-hover); border-radius: 99px;">ÎNCARCĂ IMG</button>
                      </div>
                    </div>

                    <!-- Details Inputs -->
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; gap: 8px; align-items: flex-end;">
                          <div class="cms-field" style="flex: 1;">
                            <label style="font-size: 9px; font-weight: 800; color: var(--accent-gold); margin-bottom: 4px;">ETICHETĂ (NUME)</label>
                            <input type="text" bind:value={item.label} placeholder="Nume link..." style="width: 100%; border-radius: 6px; padding: 6px 10px; font-size: 12px;" />
                          </div>
                          <div class="cms-field" style="flex: 1;">
                            <label style="font-size: 9px; font-weight: 800; color: var(--accent-gold); margin-bottom: 4px;">DESTINAȚIE (LINK)</label>
                            {#if item.type === 'category'}
                              <select bind:value={item.target} style="width: 100%; border-radius: 6px; padding: 6px 10px; font-size: 12px; background: rgba(0,0,0,0.2);">
                                <option value="">Alege categorie...</option>
                                {#each categories as cat}
                                  <option value={cat.id}>{cat.name}</option>
                                {/each}
                              </select>
                            {:else}
                              <input type="text" bind:value={item.target} placeholder="Target (ex: /vip)..." style="width: 100%; border-radius: 6px; padding: 6px 10px; font-size: 12px; background: rgba(0,0,0,0.2);" />
                            {/if}
                          </div>
                        </div>

                        <div style="display: flex; gap: 8px;">
                          <div class="cms-field" style="flex: 1; background: rgba(124,58,237,0.1); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(124,58,237,0.3);">
                            <label style="font-size: 9px; font-weight: 800; margin-bottom: 4px;">⚙️ TIP ELEMENT</label>
                            <select bind:value={item.type} style="width: 100%; border-radius: 4px; padding: 4px 6px; font-size: 11px; background: var(--bg-dark); border: 1px solid var(--border-color);">
                              <option value="nav">Navigare Internă</option>
                              <option value="category">Categorie Jocuri</option>
                              <option value="banner">Banner Promo</option>
                              <option value="mission">Misiune / Gamification</option>
                              <option value="provider">Provider Jocuri</option>
                              <option value="external">Link Extern</option>
                            </select>
                          </div>

                          <div class="cms-field" style="flex: 1; background: rgba(245,200,66,0.1); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(245,200,66,0.3);">
                            <label style="font-size: 9px; font-weight: 800; margin-bottom: 4px;">🎨 FORMĂ VIZUALĂ (SHAPE)</label>
                            <select bind:value={item.shape} style="width: 100%; border-radius: 4px; padding: 4px 6px; font-size: 11px; background: var(--bg-dark); border: 1px solid var(--border-color);">
                              <option value="default">Standard (Link)</option>
                              <option value="card">Card (Premium)</option>
                              <option value="round">Rotund (Avatar)</option>
                            </select>
                          </div>
                        </div>
                    </div>

                    <!-- Toggle -->
                    <div style="display:flex; flex-direction: column; align-items:center; gap:8px; width: 80px; flex-shrink: 0; background: rgba(0,0,0,0.2); padding: 12px 8px; border-radius: 12px;">
                        <span style="font-size:10px; font-weight:800; color:var(--text-muted);">ACTIV</span>
                        <label class="cms-switch" style="transform: scale(1.1);">
                            <input type="checkbox" bind:checked={item.enabled} />
                            <span class="cms-slider"></span>
                        </label>
                    </div>
                  </div>
                </div>
              {/each}

              <button class="cms-btn-add" style="margin-top: 12px; border-radius: 99px;" on:click={() => {
                sidebarNavConfig.items = [...sidebarNavConfig.items, { id: 'nav_'+Date.now(), type:'nav', label:'Nou', icon:'🔹', target:'home', enabled:true }];
              }}>+ Adaugă link</button>
            </div>

            <!-- ─── SIDEBAR WIDGETS (Wheel, Cashback, etc.) ─── -->
            <div class="cms-glass-card" style="padding: 24px; margin-top: 24px; border: 1px solid rgba(109,40,217,0.2);">
              <h3 class="cms-section-title">Sidebar Widgets & Cards</h3>
              <p style="font-size:13px; color:var(--text-muted); margin-bottom:20px;">Controlează modulele interactive afișate sub navigația din Sidebar.</p>

              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                <!-- Lucky Wheel -->
                <div style="background:rgba(109,40,217,0.05); border:1px solid rgba(109,40,217,0.1); border-radius:16px; padding:20px; display:flex; flex-direction:column; gap:12px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:900; color:var(--text-main); font-size:14px;">ROATA NOROCULUI</div>
                    <label class="cms-switch">
                      <input type="checkbox" bind:checked={sidebarWidgetsConfig.luckyWheel.enabled} />
                      <span class="cms-slider"></span>
                    </label>
                  </div>
                   <p style="font-size:11px; color:var(--text-muted);">Apare în partea de jos a sidebar-ului pentru utilizatorii logați.</p>
                   <div style="display: flex; align-items: center; gap: 8px;">
                     <span style="font-size:10px; color:var(--text-muted);">CONTUR:</span>
                     <input type="color" bind:value={sidebarWidgetsConfig.luckyWheel.borderColor} style="width:20px; height:20px; border:none; padding:0; background:transparent; cursor:pointer;" />
                   </div>
                   <div style="display: flex; gap: 8px; margin-top: 4px; align-items: center;">
                     <span style="font-size:10px; color:var(--text-muted); align-self:center;">MĂRIME:</span>
                     {#each ['s','m','l'] as sz}
                       <button on:click={() => { sidebarWidgetsConfig.luckyWheel.size = sz; persistDrafts(); }}
                         style="padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 11px; cursor: pointer; text-transform: uppercase; border: 1px solid {sidebarWidgetsConfig.luckyWheel.size === sz ? 'var(--accent-gold)' : 'var(--border-color)'}; background: {sidebarWidgetsConfig.luckyWheel.size === sz ? 'rgba(245,200,66,0.1)' : 'transparent'}; color: {sidebarWidgetsConfig.luckyWheel.size === sz ? 'var(--accent-gold)' : 'var(--text-muted)'};"
                       >{sz}</button>
                     {/each}
                   </div>
                 </div>

                <!-- Cashback Card -->
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:20px; display:flex; flex-direction:column; gap:12px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:900; color:var(--text-main); font-size:14px;">📊 CARD CASHBACK</div>
                    <label class="cms-switch">
                      <input type="checkbox" bind:checked={sidebarWidgetsConfig.cashbackProgress.enabled} />
                      <span class="cms-slider"></span>
                    </label>
                  </div>
                   <p style="font-size:11px; color:var(--text-muted);">Afișează progresul loialității și procentul de cashback actual.</p>
                   <div style="display: flex; align-items: center; gap: 8px;">
                     <span style="font-size:10px; color:var(--text-muted);">CONTUR:</span>
                     <input type="color" bind:value={sidebarWidgetsConfig.cashbackProgress.borderColor} style="width:20px; height:20px; border:none; padding:0; background:transparent; cursor:pointer;" />
                   </div>
                  <div style="display: flex; gap: 8px; margin-top: 4px; align-items: center;">
                    <span style="font-size:10px; color:var(--text-muted); align-self:center;">MĂRIME:</span>
                    {#each ['s','m','l'] as sz}
                      <button on:click={() => { sidebarWidgetsConfig.cashbackProgress.size = sz; persistDrafts(); }}
                        style="padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 11px; cursor: pointer; text-transform: uppercase; border: 1px solid {sidebarWidgetsConfig.cashbackProgress.size === sz ? 'var(--accent-gold)' : 'var(--border-color)'}; background: {sidebarWidgetsConfig.cashbackProgress.size === sz ? 'rgba(245,200,66,0.1)' : 'transparent'}; color: {sidebarWidgetsConfig.cashbackProgress.size === sz ? 'var(--accent-gold)' : 'var(--text-muted)'};"
                      >{sz}</button>
                    {/each}
                  </div>
                 </div>

                <!-- Tournament Widget -->
                <div style="background:rgba(251,191,36,0.05); border:1px solid rgba(251,191,36,0.1); border-radius:16px; padding:20px; display:flex; flex-direction:column; gap:12px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:900; color:var(--text-main); font-size:14px;">🏆 WIDGET TURNEU</div>
                    <label class="cms-switch">
                      <input type="checkbox" bind:checked={sidebarWidgetsConfig.tournament.enabled} on:change={persistDrafts} />
                      <span class="cms-slider"></span>
                    </label>
                  </div>
                  <p style="font-size:11px; color:var(--text-muted);">Afișează turneul activ cu fondul de premii și butonul de participare.</p>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size:10px; color:var(--text-muted);">CONTUR:</span>
                    <input type="color" bind:value={sidebarWidgetsConfig.tournament.borderColor} on:change={persistDrafts} style="width:20px; height:20px; border:none; padding:0; background:transparent; cursor:pointer;" />
                  </div>
                  <div style="display: flex; gap: 8px; margin-top: 4px; align-items: center;">
                    <span style="font-size:10px; color:var(--text-muted); align-self:center;">MĂRIME:</span>
                    {#each ['s','m','l'] as sz}
                      <button on:click={() => { sidebarWidgetsConfig.tournament.size = sz; persistDrafts(); }}
                        style="padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 11px; cursor: pointer; text-transform: uppercase; border: 1px solid {sidebarWidgetsConfig.tournament.size === sz ? 'var(--accent-gold)' : 'var(--border-color)'}; background: {sidebarWidgetsConfig.tournament.size === sz ? 'rgba(245,200,66,0.1)' : 'transparent'}; color: {sidebarWidgetsConfig.tournament.size === sz ? 'var(--accent-gold)' : 'var(--text-muted)'};"
                      >{sz}</button>
                    {/each}
                  </div>
                </div>

                <!-- Missions Widget -->
                <div style="background:rgba(59,130,246,0.05); border:1px solid rgba(59,130,246,0.1); border-radius:16px; padding:20px; display:flex; flex-direction:column; gap:12px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:900; color:var(--text-main); font-size:14px;">🎯 WIDGET MISIUNI</div>
                    <label class="cms-switch">
                      <input type="checkbox" bind:checked={sidebarWidgetsConfig.missions.enabled} on:change={persistDrafts} />
                      <span class="cms-slider"></span>
                    </label>
                  </div>
                  <p style="font-size:11px; color:var(--text-muted);">Afișează misiunile active cu progres și recompense în sidebar.</p>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size:10px; color:var(--text-muted);">CONTUR:</span>
                    <input type="color" bind:value={sidebarWidgetsConfig.missions.borderColor} on:change={persistDrafts} style="width:20px; height:20px; border:none; padding:0; background:transparent; cursor:pointer;" />
                  </div>
                  <div style="display: flex; gap: 8px; margin-top: 4px; align-items: center;">
                    <span style="font-size:10px; color:var(--text-muted); align-self:center;">MĂRIME:</span>
                    {#each ['s','m','l'] as sz}
                      <button on:click={() => { sidebarWidgetsConfig.missions.size = sz; persistDrafts(); }}
                        style="padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 11px; cursor: pointer; text-transform: uppercase; border: 1px solid {sidebarWidgetsConfig.missions.size === sz ? 'var(--accent-gold)' : 'var(--border-color)'}; background: {sidebarWidgetsConfig.missions.size === sz ? 'rgba(245,200,66,0.1)' : 'transparent'}; color: {sidebarWidgetsConfig.missions.size === sz ? 'var(--accent-gold)' : 'var(--text-muted)'};"
                      >{sz}</button>
                    {/each}
                  </div>
                </div>

                <!-- Play Arena -->
                <div style="background:rgba(245,200,66,0.05); border:1px solid rgba(245,200,66,0.1); border-radius:16px; padding:20px; display:flex; flex-direction:column; gap:12px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:900; color:var(--text-main); font-size:14px;">🎮 PLAY ARENA</div>
                    <label class="cms-switch">
                      <input type="checkbox" bind:checked={playArenaConfig.enabled} on:change={() => cmsDraftPlayArenaConfig.set(playArenaConfig)} />
                      <span class="cms-slider"></span>
                    </label>
                  </div>
                  <p style="font-size:11px; color:var(--text-muted);">Mini-dashboard-ul de gamificare (XP, Coins, Nivel).</p>
                  <div style="display: flex; gap: 8px; margin-top: 4px;">
                    <span style="font-size:10px; color:var(--text-muted); align-self:center;">MĂRIME:</span>
                    {#each ['s','m','l'] as sz}
                      <button on:click={() => { playArenaConfig.size = sz; cmsDraftPlayArenaConfig.set(playArenaConfig); }}
                        style="padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 11px; cursor: pointer; text-transform: uppercase; border: 1px solid {playArenaConfig.size === sz ? 'var(--accent-gold)' : 'var(--border-color)'}; background: {playArenaConfig.size === sz ? 'rgba(245,200,66,0.1)' : 'transparent'}; color: {playArenaConfig.size === sz ? 'var(--accent-gold)' : 'var(--text-muted)'};"
                      >{sz}</button>
                    {/each}
                  </div>
                </div>

                <!-- Jackpot Widget -->
                <div style="background:rgba(239,68,68,0.05); border:1px solid rgba(239,68,68,0.1); border-radius:16px; padding:20px; display:flex; flex-direction:column; gap:12px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:900; color:var(--text-main); font-size:14px;">🎰 JACKPOT WIDGET</div>
                    <label class="cms-switch">
                      <input type="checkbox" bind:checked={sidebarWidgetsConfig.jackpotWidget.enabled} />
                      <span class="cms-slider"></span>
                    </label>
                  </div>
                  <p style="font-size:11px; color:var(--text-muted);">Afișează valoarea unui jackpot specific.</p>
                  

                  <div style="display: flex; gap: 8px; margin-top: 4px; align-items: center;">
                    <span style="font-size:10px; color:var(--text-muted); align-self:center;">MĂRIME:</span>
                    {#each ['s','m','l'] as sz}
                      <button on:click={() => { sidebarWidgetsConfig.jackpotWidget.size = sz; persistDrafts(); }}
                        style="padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 11px; cursor: pointer; text-transform: uppercase; border: 1px solid {sidebarWidgetsConfig.jackpotWidget.size === sz ? 'var(--accent-gold)' : 'var(--border-color)'}; background: {sidebarWidgetsConfig.jackpotWidget.size === sz ? 'rgba(245,200,66,0.1)' : 'transparent'}; color: {sidebarWidgetsConfig.jackpotWidget.size === sz ? 'var(--accent-gold)' : 'var(--text-muted)'};"
                      >{sz}</button>
                    {/each}
                  </div>
                  {#if sidebarWidgetsConfig.jackpotWidget.enabled}
                    <div style="display: flex; gap: 8px; flex-direction: column; margin-top: 4px;">
                      <div>
                        <label class="cms-label" style="font-size:10px;">PROVIDER / SURSĂ</label>
                        <select bind:value={sidebarWidgetsConfig.jackpotWidget.sourceId} class="cms-input" style="padding: 4px 8px; font-size: 12px; height: 30px;">
                          {#each jackpotConfig as jp}
                            <option value={jp.id}>{jp.name}</option>
                          {/each}
                        </select>
                      </div>
                      <div>
                        <label class="cms-label" style="font-size:10px;">NIVEL JACKPOT</label>
                        <select bind:value={sidebarWidgetsConfig.jackpotWidget.level} class="cms-input" style="padding: 4px 8px; font-size: 12px; height: 30px;">
                          <option value="4">Spades / Platinum (Max)</option>
                          <option value="3">Hearts / Gold</option>
                          <option value="2">Diamonds / Silver</option>
                          <option value="1">Clubs / Bronze (Min)</option>
                        </select>
                      </div>

                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span style="font-size:10px; color:var(--text-muted);">CONTUR:</span>
                          <input type="color" bind:value={sidebarWidgetsConfig.jackpotWidget.borderColor} style="width:20px; height:20px; border:none; padding:0; background:transparent; cursor:pointer;" />
                        </div>
                      </div>
                    {/if}
                  </div>

                <!-- Wallet Widget -->
                <div style="background:rgba(16,185,129,0.05); border:1px solid rgba(16,185,129,0.1); border-radius:16px; padding:20px; display:flex; flex-direction:column; gap:12px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:900; color:var(--text-main); font-size:14px;">👛 WIDGET PORTOFEL</div>
                    <label class="cms-switch">
                      <input type="checkbox" bind:checked={sidebarWidgetsConfig.walletWidget.enabled} />
                      <span class="cms-slider"></span>
                    </label>
                  </div>
                  <p style="font-size:11px; color:var(--text-muted);">Afișează balanța și numele utilizatorului în Sidebar.</p>
                  

                  <div style="display: flex; gap: 8px; margin-top: 4px; align-items: center;">
                    <span style="font-size:10px; color:var(--text-muted); align-self:center;">MĂRIME:</span>
                    {#each ['s','m','l'] as sz}
                      <button on:click={() => { sidebarWidgetsConfig.walletWidget.size = sz; persistDrafts(); }}
                        style="padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 11px; cursor: pointer; text-transform: uppercase; border: 1px solid {sidebarWidgetsConfig.walletWidget.size === sz ? 'var(--accent-gold)' : 'var(--border-color)'}; background: {sidebarWidgetsConfig.walletWidget.size === sz ? 'rgba(245,200,66,0.1)' : 'transparent'}; color: {sidebarWidgetsConfig.walletWidget.size === sz ? 'var(--accent-gold)' : 'var(--text-muted)'};"
                      >{sz}</button>
                    {/each}
                  </div>
                  {#if sidebarWidgetsConfig.walletWidget.enabled}
                    <div style="display: flex; gap: 10px; flex-direction: column; margin-top: 4px;">
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:11px; color:var(--text-muted);">Afișează Balanță</span>
                        <label class="cms-switch" style="transform: scale(0.8);">
                          <input type="checkbox" bind:checked={sidebarWidgetsConfig.walletWidget.showBalance} />
                          <span class="cms-slider"></span>
                        </label>
                      </div>
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:11px; color:var(--text-muted);">Afișează Nume</span>
                        <label class="cms-switch" style="transform: scale(0.8);">
                          <input type="checkbox" bind:checked={sidebarWidgetsConfig.walletWidget.showName} />
                          <span class="cms-slider"></span>
                        </label>
                      </div>

                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:11px; color:var(--text-muted);">Efect Bule</span>
                        <label class="cms-switch" style="transform: scale(0.8);">
                          <input type="checkbox" bind:checked={sidebarWidgetsConfig.walletWidget.bubblesEnabled} />
                          <span class="cms-slider"></span>
                        </label>
                      </div>

                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:11px; color:var(--text-muted);">Afișează în Sidebar</span>
                        <label class="cms-switch" style="transform: scale(0.8);">
                          <input type="checkbox" bind:checked={sidebarWidgetsConfig.walletWidget.enabled} />
                          <span class="cms-slider"></span>
                        </label>
                      </div>

                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:11px; color:var(--text-muted);">Afișează în Toolbar</span>
                        <label class="cms-switch" style="transform: scale(0.8);">
                          <input type="checkbox" bind:checked={sidebarWidgetsConfig.walletWidget.showInToolbar} />
                          <span class="cms-slider"></span>
                        </label>
                      </div>

                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:11px; color:var(--text-muted);">Poziție Sidebar</span>
                        <select bind:value={sidebarWidgetsConfig.walletWidget.position} class="cms-input" style="padding: 2px 6px; font-size: 11px; height: 26px; width: 100px;">
                          <option value="top">Sus</option>
                          <option value="bottom">Jos</option>
                        </select>
                      </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span style="font-size:10px; color:var(--text-muted);">CONTUR:</span>
                          <input type="color" bind:value={sidebarWidgetsConfig.walletWidget.borderColor} style="width:20px; height:20px; border:none; padding:0; background:transparent; cursor:pointer;" />
                        </div>
                      </div>
                    {/if}
                  </div>

            <!-- ─── SIDEBAR CUSTOM CARDS ─── -->
            <div class="cms-glass-card" style="padding: 24px; margin-top: 24px; border: 1px solid rgba(245,200,66,0.2);">
              <h3 class="cms-section-title">🎴 Custom Sidebar Cards</h3>
              <p style="font-size:13px; color:var(--text-muted); margin-bottom:20px;">Creează carduri vizuale promoționale între butoanele de navigare și widget-uri.</p>

              <div style="display:flex; flex-direction:column; gap:12px;">
                {#each (sidebarWidgetsConfig.promoCards || []) as card, i}
                  <div class="cms-glass-card" style="padding:16px; background:rgba(0,0,0,0.2); display:flex; gap:16px; align-items:center; border-radius:16px;">
                    <div style="width:80px; height:80px; border-radius:12px; background:var(--bg-hover); border:1px solid var(--border-color); display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0; position:relative;">
                      {#if card.image}
                        <img src={card.image} alt="card" style="width:100%; height:100%; object-fit:fill;" />
                        <label style="position:absolute; bottom:4px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.8); color:var(--accent-gold); font-size:8px; padding:2px 6px; border-radius:4px; cursor:pointer; font-weight:bold; white-space:nowrap;">
                          EDIT
                          <input type="file" accept="image/*" on:change={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                card.image = ev.target.result;
                                sidebarWidgetsConfig = {...sidebarWidgetsConfig};
                              };
                              reader.readAsDataURL(file);
                            }
                          }} style="display:none;" />
                        </label>
                        <button on:click={() => { card.image = ''; sidebarWidgetsConfig = {...sidebarWidgetsConfig}; }} 
                          style="position:absolute; top:2px; right:2px; background:red; color:white; border:none; border-radius:50%; width:16px; height:16px; font-size:10px; cursor:pointer; display:flex; align-items:center; justify-content:center;">×</button>
                      {:else}
                        <div style="text-align:center;">
                           <span style="font-size:24px; display:block;">🖼️</span>
                           <label style="font-size:8px; color:var(--accent-gold); cursor:pointer;">
                             UPLOAD
                             <input type="file" accept="image/*" on:change={(e) => {
                               const file = e.target.files[0];
                               if (file) {
                                 const reader = new FileReader();
                                 reader.onload = (ev) => {
                                   card.image = ev.target.result;
                                   sidebarWidgetsConfig = {...sidebarWidgetsConfig};
                                 };
                                 reader.readAsDataURL(file);
                               }
                             }} style="display:none;" />
                           </label>
                        </div>
                      {/if}
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; gap:8px;">
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <input type="text" bind:value={card.title} placeholder="Titlu card..." style="flex:1; background:transparent; border:none; border-bottom:1px solid var(--border-color); color:var(--text-main); font-weight:700; outline:none;" />
                        <label class="cms-switch" style="transform: scale(0.8);">
                          <input type="checkbox" bind:checked={card.enabled} />
                          <span class="cms-slider"></span>
                        </label>
                      </div>
                      <div style="display:flex; gap:8px; align-items:center;">
                        <input type="text" bind:value={card.target} placeholder="Destinație (ex: /vip)..." style="flex:1; border-radius:99px; padding:6px 14px; font-size:11px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.05); color:var(--text-muted);" />
                        <button class="cms-btn-icon" style="color:#ef4444; background:rgba(239,68,68,0.1); width:28px; height:28px; border-radius:50%;" on:click={() => {
                          sidebarWidgetsConfig.promoCards = sidebarWidgetsConfig.promoCards.filter((_, idx) => idx !== i);
                        }}>🗑️</button>
                      </div>

                      <div style="display:flex; gap:12px; margin-top:4px;">
                        <div style="display:flex; align-items:center; gap:6px;">
                          <span style="font-size:10px; color:var(--text-muted);">FORMA:</span>
                          <select bind:value={card.shape} style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:var(--text-main); font-size:10px; border-radius:4px; padding:2px 4px;">
                            <option value="card">CARD (Wide)</option>
                            <option value="gamecard">CARD DE JOC (Portret)</option>
                            <option value="round">ROUND (Icon)</option>
                          </select>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                          <span style="font-size:10px; color:var(--text-muted);">POZIȚIE:</span>
                          <select bind:value={card.position} style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:var(--text-main); font-size:10px; border-radius:4px; padding:2px 4px;">
                            <option value="top">TOP (Sus)</option>
                            <option value="bottom">BOTTOM (Jos)</option>
                          </select>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                          <span style="font-size:10px; color:var(--text-muted);">DIMENSIUNE:</span>
                          <select bind:value={card.size} style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:var(--text-main); font-size:10px; border-radius:4px; padding:2px 4px;">
                            <option value="s">S (Small)</option>
                            <option value="m">M (Medium)</option>
                            <option value="l">L (Large)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                {/each}

                <button class="cms-btn-add" style="margin-top: 12px; border-radius: 99px; border: 2px dashed var(--accent-gold); color: var(--accent-gold); background: rgba(245,200,66,0.05);" 
                  on:click={() => {
                    sidebarWidgetsConfig.promoCards = [...(sidebarWidgetsConfig.promoCards || []), { id: 'pc_'+Date.now(), title: 'Banner Nou', image: '', target: '', enabled: true, shape: 'card', position: 'bottom', size: 'm' }];
                  }}>+ Creează Card Promo Nou</button>
              </div>
            </div>

            <!-- Contextual Integrated Preview -->
            <div class="cms-context-preview">
              <div class="cms-context-preview-header">
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:6px; height:6px; border-radius:50%; background:#22c55e;"></div>
                  <span>PREVIZUALIZARE: SIDEBAR NAVIGATION</span>
                </div>
                <div style="display:flex; gap:10px;">
                   <button class="cms-btn-mini" on:click={() => previewDevice = previewDevice === 'mobile' ? 'desktop' : 'mobile'}>
                     {previewDevice === 'mobile' ? '🖥️ Desktop' : '📱 Mobile'}
                   </button>
                   <button class="cms-btn-mini" on:click={refreshPreview}>🔄 Refresh</button>
                </div>
              </div>
              <div class="cms-context-preview-body {previewDevice}">
                <iframe src={previewUrl} title="Module Preview"></iframe>
              </div>
            </div>
          </div>
            </div>
          </div>
        {/if}

        <!-- TAB: WIDGETS -->
        {#if activeTab === "widgets"}
          <div class="cms-tab-content">
            <h1 class="cms-page-title-main">🧩 Managament Widgets</h1>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:32px;">
              Toate widget-urile disponibile pe site. Configurează fiecare widget și unde apare (pagina principală, sidebar, toolbar).
            </p>

            <!-- ═══ CONTUR GLOBAL SIDEBAR + HEADER ═══ -->
            <div class="cms-glass-card" style="padding:24px; margin-bottom:24px; border:1px solid rgba(99,102,241,0.3);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
                <div>
                  <h3 class="cms-section-title" style="margin:0 0 4px;">🎨 Contur Global Widgets</h3>
                  <p style="font-size:12px; color:var(--text-muted); margin:0;">Un contur unic aplicat tuturor widgeturilor din sidebar și header. Override contururile individuale.</p>
                </div>
                <label class="cms-switch">
                  <input type="checkbox" bind:checked={sidebarWidgetsConfig.globalBorderEnabled} on:change={persistDrafts} />
                  <span class="cms-slider"></span>
                </label>
              </div>
              {#if sidebarWidgetsConfig.globalBorderEnabled}
              <div style="display:grid; grid-template-columns:1fr 1fr 2fr; gap:16px; align-items:end;">
                <!-- Color -->
                <div>
                  <div style="font-size:10px; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:6px;">CULOARE CONTUR</div>
                  <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.04); border:1px solid var(--border-color); border-radius:10px; padding:8px 12px;">
                    <input type="color" bind:value={sidebarWidgetsConfig.globalBorderColor} on:input={persistDrafts}
                      style="width:36px; height:36px; border:none; border-radius:8px; padding:0; background:transparent; cursor:pointer; flex-shrink:0;" />
                    <span style="font-size:11px; color:var(--text-muted); font-family:monospace;">{sidebarWidgetsConfig.globalBorderColor || '#f5c842'}</span>
                  </div>
                </div>
                <!-- Width -->
                <div>
                  <div style="font-size:10px; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:6px;">GROSIME (px)</div>
                  <div style="display:flex; gap:4px;">
                    {#each [1,2,3,4] as w}
                      <button on:click={() => { sidebarWidgetsConfig.globalBorderWidth = w; persistDrafts(); }}
                        style="flex:1; padding:8px 4px; border-radius:8px; font-size:12px; font-weight:800; cursor:pointer; border:1px solid {(sidebarWidgetsConfig.globalBorderWidth||1)===w?'var(--accent-gold)':'var(--border-color)'}; background:{(sidebarWidgetsConfig.globalBorderWidth||1)===w?'rgba(245,200,66,0.1)':'transparent'}; color:{(sidebarWidgetsConfig.globalBorderWidth||1)===w?'var(--accent-gold)':'var(--text-muted)'};"
                      >{w}</button>
                    {/each}
                  </div>
                </div>
                <!-- Preview -->
                <div>
                  <div style="font-size:10px; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:6px;">PREVIEW</div>
                  <div style="height:52px; border-radius:12px; background:rgba(255,255,255,0.04); border:{sidebarWidgetsConfig.globalBorderWidth||1}px solid {sidebarWidgetsConfig.globalBorderColor||'#f5c842'}; display:flex; align-items:center; justify-content:center; gap:8px;">
                    <span style="font-size:11px; color:var(--text-muted);">Widget Exemplu</span>
                    <div style="width:8px; height:8px; border-radius:50%; background:{sidebarWidgetsConfig.globalBorderColor||'#f5c842'}; box-shadow:0 0 6px {sidebarWidgetsConfig.globalBorderColor||'#f5c842'};"></div>
                  </div>
                </div>
              </div>
              {/if}
            </div>

            <!-- ═══ ORDINEA SECȚIUNILOR PAGINA PRINCIPALĂ ═══ -->
            <div class="cms-glass-card" style="padding:24px; margin-bottom:24px; border:1px solid rgba(245,200,66,0.25);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <div>
                  <h3 class="cms-section-title" style="margin:0 0 4px;">📐 Ordinea Secțiunilor – Pagina Principală</h3>
                  <p style="font-size:12px; color:var(--text-muted); margin:0;">Reordonează secțiunile afișate pe homepage cu butoanele ▲▼. Modificările se aplică imediat în preview.</p>
                </div>
              </div>
              {#each [1] as _}
                {@const pcoMeta = {
                  heroBanners:  { label: '🖼️ Bannere Hero',        desc: 'Sliderul principal cu oferte (poate fi mutat mai jos)' },
                  categoryTabs: { label: '🏷️ Bara de Categorii', desc: 'Navigarea Slots/Live/Jackpot...' },
                  topGames:     { label: '🏆 Top 10 Jocuri',      desc: 'Cele mai jucate jocuri' },
                  tournament:   { label: '🎯 Turneu Activ',        desc: 'Widget turneu/misiuni' },
                  missions:     { label: '🎯 Misiuni Active',      desc: 'Widget misiuni gamification' },
                  rtpWidget:    { label: '🔥 RTP Live (Hot/Cold)', desc: 'Jocuri generoase și în creștere' },
                  topWinners:   { label: '🏆 TOP Câștigători',     desc: 'Bandă derulantă cu câștigătorii recenți' },
                  gameCategories: { label: '🎮 Categorii Jocuri', desc: 'Grila principală cu jocuri' },
                  jackpotFever: { label: '💰 Jackpot Fever',       desc: 'Contorizatoare jackpot live' },
                }}
                {@const pcoKeys = ['heroBanners','categoryTabs','topGames','tournament','missions','rtpWidget','topWinners','gameCategories','jackpotFever']}
                {@const currentOrder = sidebarWidgetsConfig.pageContentOrder && sidebarWidgetsConfig.pageContentOrder.length > 0
                  ? sidebarWidgetsConfig.pageContentOrder
                  : [...pcoKeys]}

                <div style="display:flex; flex-direction:column; gap:6px;">
                  {#each currentOrder as sKey, sIdx}
                    {@const sm = pcoMeta[sKey]}
                    {#if sm}
                    <div style="display:flex; align-items:center; gap:10px; background:rgba(245,200,66,0.04); border:1px solid rgba(245,200,66,0.12); border-radius:12px; padding:10px 14px;">
                      <!-- order arrows -->
                      <div style="display:flex; flex-direction:column; gap:2px; flex-shrink:0;">
                        <button
                          disabled={sIdx === 0}
                          on:click={() => {
                            const order = [...currentOrder];
                            const i = order.indexOf(sKey);
                            if (i > 0) { [order[i-1], order[i]] = [order[i], order[i-1]]; }
                            sidebarWidgetsConfig.pageContentOrder = order;
                            sidebarWidgetsConfig = {...sidebarWidgetsConfig};
                            persistDrafts();
                          }}
                          style="width:24px; height:20px; border-radius:5px; border:1px solid {sIdx===0?'rgba(255,255,255,0.05)':'rgba(245,200,66,0.3)'}; background:{sIdx===0?'transparent':'rgba(245,200,66,0.06)'}; color:{sIdx===0?'rgba(255,255,255,0.2)':'var(--accent-gold)'}; font-size:10px; cursor:{sIdx===0?'default':'pointer'}; display:flex; align-items:center; justify-content:center;"
                        >▲</button>
                        <button
                          disabled={sIdx === currentOrder.length - 1}
                          on:click={() => {
                            const order = [...currentOrder];
                            const i = order.indexOf(sKey);
                            if (i < order.length - 1) { [order[i+1], order[i]] = [order[i], order[i+1]]; }
                            sidebarWidgetsConfig.pageContentOrder = order;
                            sidebarWidgetsConfig = {...sidebarWidgetsConfig};
                            persistDrafts();
                          }}
                          style="width:24px; height:20px; border-radius:5px; border:1px solid {sIdx===currentOrder.length-1?'rgba(255,255,255,0.05)':'rgba(245,200,66,0.3)'}; background:{sIdx===currentOrder.length-1?'transparent':'rgba(245,200,66,0.06)'}; color:{sIdx===currentOrder.length-1?'rgba(255,255,255,0.2)':'var(--accent-gold)'}; font-size:10px; cursor:{sIdx===currentOrder.length-1?'default':'pointer'}; display:flex; align-items:center; justify-content:center;"
                        >▼</button>
                      </div>
                      <div style="font-size:10px; color:rgba(245,200,66,0.4); font-weight:900; width:18px; text-align:center;">#{sIdx+1}</div>
                      <div style="flex:1;">
                        <div style="font-weight:800; font-size:13px; color:var(--text-main);">{sm.label}</div>
                        <div style="font-size:11px; color:var(--text-muted);">{sm.desc}</div>
                      </div>
                    </div>
                    {/if}
                  {/each}
                </div>
              {/each}
            </div>

            <!-- Category Bar -->
            <div class="cms-glass-card" style="padding:24px; margin-bottom:24px; border:1px solid rgba(34,197,94,0.2);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <div>
                  <h3 class="cms-section-title" style="margin:0 0 4px;">🏷️ Bara de Categorii</h3>
                  <p style="font-size:12px; color:var(--text-muted); margin:0;">Navigarea principală pe categorii (Slots, Live, Jackpot...) afișată sub bannere, centrată pe conținut.</p>
                </div>
                <label class="cms-switch">
                  <input type="checkbox" bind:checked={sidebarWidgetsConfig.categoryTabs.enabled} on:change={persistDrafts} />
                  <span class="cms-slider"></span>
                </label>
              </div>
              <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px;">
                <div>
                  <div style="font-size:10px; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:8px;">FORMĂ</div>
                  <div style="display:flex; gap:8px;">
                    {#each [['round','● Pill'],['circle','⬤ Cerc'],['ghost','○ Ghost']] as [val, lbl]}
                      <button on:click={() => { sidebarWidgetsConfig.categoryTabs.shape = val; persistDrafts(); }}
                        style="flex:1; padding:8px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; border:1px solid {sidebarWidgetsConfig.categoryTabs.shape === val ? 'var(--accent-gold)' : 'var(--border-color)'}; background:{sidebarWidgetsConfig.categoryTabs.shape === val ? 'rgba(245,200,66,0.1)' : 'transparent'}; color:{sidebarWidgetsConfig.categoryTabs.shape === val ? 'var(--accent-gold)' : 'var(--text-muted)'};"
                      >{lbl}</button>
                    {/each}
                  </div>
                </div>
                <div>
                  <div style="font-size:10px; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:8px;">MĂRIME</div>
                  <div style="display:flex; gap:8px;">
                    {#each ['s','m','l'] as sz}
                      <button on:click={() => { sidebarWidgetsConfig.categoryTabs.size = sz; persistDrafts(); }}
                        style="flex:1; padding:8px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; text-transform:uppercase; border:1px solid {sidebarWidgetsConfig.categoryTabs.size === sz ? 'var(--accent-gold)' : 'var(--border-color)'}; background:{sidebarWidgetsConfig.categoryTabs.size === sz ? 'rgba(245,200,66,0.1)' : 'transparent'}; color:{sidebarWidgetsConfig.categoryTabs.size === sz ? 'var(--accent-gold)' : 'var(--text-muted)'};"
                      >{sz}</button>
                    {/each}
                  </div>
                </div>
                <div>
                  <div style="font-size:10px; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:8px;">CULOARE TEXT ACTIV</div>
                  <input type="color" bind:value={sidebarWidgetsConfig.categoryTabs.activeColor} on:change={persistDrafts}
                    style="width:100%; height:36px; border:1px solid var(--border-color); border-radius:8px; padding:2px; background:transparent; cursor:pointer;" />
                </div>
                <div style="grid-column: span 3;">
                  <div style="font-size:10px; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:8px;">FUNDAL TAB ACTIV</div>
                  <input type="text" bind:value={sidebarWidgetsConfig.categoryTabs.activeBg} on:input={persistDrafts}
                    placeholder="ex: linear-gradient(135deg,#6d28d9,#4c1d95) sau #6d28d9"
                    class="cms-input" style="border-radius:8px; font-size:12px;" />
                </div>
              </div>

              <!-- Per-Tab Editor -->
              <div style="margin-top:20px;">
                <div style="font-size:11px; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:12px;">✏️ CONFIGURARE TAB-URI INDIVIDUALE</div>
                <div style="display:flex; flex-direction:column; gap:10px;">
                  {#each (sidebarWidgetsConfig.categoryTabs.tabs || []) as tab, i}
                    <div class="cms-field" style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color);">
                      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 16px;">
                        <div>
                          <label class="cms-label" style="font-size: 11px; margin-bottom: 8px; display: block; text-transform: uppercase;">Text Etichetă</label>
                          <input type="text" class="cms-input" bind:value={tab.label} on:input={() => { sidebarWidgetsConfig = {...sidebarWidgetsConfig}; persistDrafts(); }} style="padding: 6px 12px; width: 100%;" placeholder="Slots" />
                        </div>
                        <div>
                          <label class="cms-label" style="font-size: 11px; margin-bottom: 8px; display: block; text-transform: uppercase;">Imagine (Upload sau Emoji)</label>
                          <div style="display: flex; flex-direction: column; gap: 8px;">
                             <div style="display: flex; gap: 8px; align-items: center;">
                               <input type="text" class="cms-input" bind:value={tab.image} on:input={() => { sidebarWidgetsConfig = {...sidebarWidgetsConfig}; persistDrafts(); }} style="padding: 6px 12px; flex: 1; font-size: 12px;" placeholder="URL sau Emoji..." />
                               {#if tab.image && (tab.image.startsWith('/') || tab.image.startsWith('data:'))}
                                 <div style="width: 38px; height: 38px; border-radius: 50%; overflow: hidden; border: 1px solid var(--border-color); flex-shrink: 0; background: #000; display:flex; align-items:center; justify-content:center;">
                                   <img src={tab.image} alt="Preview" style="width: 100%; height: 100%; object-fit: cover; transform: scale(1.45);" />
                                 </div>
                               {:else if tab.image}
                                 <div style="font-size: 24px; min-width: 38px; text-align: center;">{tab.image}</div>
                               {/if}
                             </div>
                             <div style="position: relative;">
                               <input 
                                 type="file" 
                                 accept="image/*" 
                                 on:change={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        sidebarWidgetsConfig.categoryTabs.tabs[i].image = ev.target.result;
                                        sidebarWidgetsConfig = {...sidebarWidgetsConfig};
                                        persistDrafts();
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                 }} 
                                 id="cat-img-{i}"
                                 style="display: none;" 
                               />
                               <label for="cat-img-{i}" class="cms-btn-primary" style="display: block; text-align: center; padding: 6px; font-size: 11px; cursor: pointer; background: rgba(255,255,255,0.05); border: 1px dashed var(--border-color); color: var(--text-muted);">
                                 📁 ÎNCARCĂ POZĂ {tab.label.toUpperCase()}
                               </label>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

            <!-- Sidebar Widgets Grid -->
            <div class="cms-glass-card" style="padding:24px; margin-bottom:24px; border:1px solid rgba(109,40,217,0.2);">
              <h3 class="cms-section-title">📦 Widgets Sidebar</h3>
              <p style="font-size:12px; color:var(--text-muted); margin-bottom:20px;">Activează/dezactivează, setează dimensiunea și <strong style="color:var(--accent-gold);">reordonează ↑↓</strong> widgeturile din sidebar.</p>
              {#each [1] as _}
                {@const wMeta = {
                  luckyWheel:       { label: 'Roata Norocului',  color: 'rgba(109,40,217,0.1)', border: 'rgba(109,40,217,0.25)' },
                  cashbackProgress: { label: '📊 Cashback',          color: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.2)' },
                  jackpotWidget:    { label: '🎰 Jackpot Widget',    color: 'rgba(239,68,68,0.07)',  border: 'rgba(239,68,68,0.2)' },
                  walletWidget:     { label: '💳 Portofel',          color: 'rgba(99,102,241,0.07)', border: 'rgba(99,102,241,0.2)' },
                  tournament:       { label: '🏆 Turneu Activ',      color: 'rgba(251,191,36,0.05)', border: 'rgba(251,191,36,0.15)' },
                  missions:         { label: '🎯 Misiuni Active',    color: 'rgba(59,130,246,0.05)', border: 'rgba(59,130,246,0.15)' },
                }}
                {@const allWidgetKeys = ['luckyWheel','cashbackProgress','jackpotWidget','walletWidget','tournament','missions','playArena']}
                {@const orderedKeys = [
                  ...(sidebarWidgetsConfig.widgetOrder || ['luckyWheel','cashbackProgress','jackpotWidget','walletWidget']),
                  ...allWidgetKeys.filter(k => !(sidebarWidgetsConfig.widgetOrder||[]).includes(k))
                ]}

              <div style="display:flex; flex-direction:column; gap:10px;">
                {#each orderedKeys as wKey, wIdx}
                  {@const w = wMeta[wKey]}
                  {@const wCfg = sidebarWidgetsConfig[wKey]}
                  {#if w && wCfg}
                  <div style="background:{w.color}; border:1px solid {w.border}; border-radius:16px; padding:14px 16px; display:flex; gap:12px; align-items:flex-start;">
                    <!-- Drag handle / order controls -->
                    <div style="display:flex; flex-direction:column; gap:3px; flex-shrink:0; padding-top:2px;">
                      <button
                        disabled={wIdx === 0}
                        on:click={() => {
                          const order = [...(sidebarWidgetsConfig.widgetOrder || [...allWidgetKeys])];
                          const i = order.indexOf(wKey);
                          if (i > 0) { [order[i-1], order[i]] = [order[i], order[i-1]]; }
                          sidebarWidgetsConfig.widgetOrder = order;
                          sidebarWidgetsConfig = {...sidebarWidgetsConfig};
                          persistDrafts();
                        }}
                        style="width:26px; height:22px; border-radius:6px; border:1px solid {wIdx===0?'rgba(255,255,255,0.05)':'var(--border-color)'}; background:{wIdx===0?'transparent':'rgba(255,255,255,0.06)'}; color:{wIdx===0?'rgba(255,255,255,0.2)':'var(--text-main)'}; font-size:12px; cursor:{wIdx===0?'default':'pointer'}; display:flex; align-items:center; justify-content:center; line-height:1;"
                      >▲</button>
                      <button
                        disabled={wIdx === orderedKeys.length - 1}
                        on:click={() => {
                          const order = [...(sidebarWidgetsConfig.widgetOrder || [...allWidgetKeys])];
                          const i = order.indexOf(wKey);
                          if (i < order.length - 1) { [order[i+1], order[i]] = [order[i], order[i+1]]; }
                          sidebarWidgetsConfig.widgetOrder = order;
                          sidebarWidgetsConfig = {...sidebarWidgetsConfig};
                          persistDrafts();
                        }}
                        style="width:26px; height:22px; border-radius:6px; border:1px solid {wIdx===orderedKeys.length-1?'rgba(255,255,255,0.05)':'var(--border-color)'}; background:{wIdx===orderedKeys.length-1?'transparent':'rgba(255,255,255,0.06)'}; color:{wIdx===orderedKeys.length-1?'rgba(255,255,255,0.2)':'var(--text-main)'}; font-size:12px; cursor:{wIdx===orderedKeys.length-1?'default':'pointer'}; display:flex; align-items:center; justify-content:center; line-height:1;"
                      >▼</button>
                      <div style="font-size:9px; color:rgba(255,255,255,0.2); text-align:center; margin-top:2px;">#{wIdx+1}</div>
                    </div>

                    <!-- Widget config -->
                    <div style="flex:1; display:flex; flex-direction:column; gap:10px; min-width:0;">
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="font-weight:800; font-size:13px; color:var(--text-main);">{w.label}</div>
                        <label class="cms-switch">
                          <input type="checkbox" bind:checked={sidebarWidgetsConfig[wKey].enabled} on:change={persistDrafts} />
                          <span class="cms-slider"></span>
                        </label>
                      </div>
                      <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; align-items:start;">
                        <!-- MĂRIME -->
                        <div>
                          <div style="font-size:10px; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:5px;">MĂRIME</div>
                          <div style="display:flex; gap:4px;">
                            {#each ['s','m','l'] as sz}
                              <button on:click={() => { sidebarWidgetsConfig[wKey].size = sz; persistDrafts(); }}
                                style="flex:1; padding:5px; border-radius:6px; font-size:10px; font-weight:700; cursor:pointer; text-transform:uppercase; border:1px solid {(wCfg.size||'m')===sz?'var(--accent-gold)':'var(--border-color)'}; background:{(wCfg.size||'m')===sz?'rgba(245,200,66,0.1)':'transparent'}; color:{(wCfg.size||'m')===sz?'var(--accent-gold)':'var(--text-muted)'};"
                              >{sz}</button>
                            {/each}
                          </div>
                        </div>
                        <!-- FORMĂ CARD -->
                        <div>
                          <div style="font-size:10px; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:5px;">FORMĂ</div>
                          <div style="display:flex; gap:4px;">
                            {#each [['widget','Widget'],['gamecard','Card']] as [shp, slbl]}
                              <button on:click={() => { sidebarWidgetsConfig[wKey].shape = shp; sidebarWidgetsConfig = {...sidebarWidgetsConfig}; persistDrafts(); }}
                                style="flex:1; padding:5px 3px; border-radius:6px; font-size:10px; font-weight:700; cursor:pointer; border:1px solid {(wCfg.shape||'widget')===shp?'var(--accent-gold)':'var(--border-color)'}; background:{(wCfg.shape||'widget')===shp?'rgba(245,200,66,0.1)':'transparent'}; color:{(wCfg.shape||'widget')===shp?'var(--accent-gold)':'var(--text-muted)'};"
                              >{slbl}</button>
                            {/each}
                          </div>
                        </div>
                        <!-- LĂȚIME -->
                        <div>
                          <div style="font-size:10px; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:5px;">LĂȚIME</div>
                          <div style="display:flex; gap:4px;">
                            {#each [['full','100%'],['half','50%'],['auto','Auto']] as [ww, wwl]}
                              <button on:click={() => { sidebarWidgetsConfig[wKey].widgetWidth = ww; sidebarWidgetsConfig = {...sidebarWidgetsConfig}; persistDrafts(); }}
                                style="flex:1; padding:5px 2px; border-radius:6px; font-size:10px; font-weight:700; cursor:pointer; border:1px solid {(wCfg.widgetWidth||'auto')===ww?'rgba(99,102,241,0.8)':'var(--border-color)'}; background:{(wCfg.widgetWidth||'auto')===ww?'rgba(99,102,241,0.15)':'transparent'}; color:{(wCfg.widgetWidth||'auto')===ww?'#a5b4fc':'var(--text-muted)'};"
                              >{wwl}</button>
                            {/each}
                          </div>
                        </div>
                        <!-- CONTUR -->
                        <div>
                          <div style="font-size:10px; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:5px;">CONTUR</div>
                          <div style="display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.04); border:1px solid var(--border-color); border-radius:8px; padding:4px 8px;">
                            <input type="color" bind:value={sidebarWidgetsConfig[wKey].borderColor} on:change={persistDrafts}
                              style="width:28px; height:28px; border:none; border-radius:5px; padding:0; background:transparent; cursor:pointer; flex-shrink:0;" />
                            <span style="font-size:10px; color:var(--text-muted); font-family:monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{wCfg.borderColor||'auto'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/if}
                {/each}
              </div>
              {/each}
            </div>

            <!-- Play Arena -->
            <div class="cms-glass-card" style="padding:24px; margin-bottom:24px; border:1px solid rgba(245,200,66,0.2);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <div>
                  <h3 class="cms-section-title" style="margin:0 0 4px;">🎮 Play Arena Hub</h3>
                  <p style="font-size:12px; color:var(--text-muted); margin:0;">Mini-dashboard gamification cu XP, Coins, Nivel.</p>
                </div>
                <label class="cms-switch">
                  <input type="checkbox" bind:checked={playArenaConfig.enabled} on:change={() => cmsDraftPlayArenaConfig.set(playArenaConfig)} />
                  <span class="cms-slider"></span>
                </label>
              </div>
              <div>
                <div style="font-size:10px; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:8px;">MĂRIME</div>
                <div style="display:flex; gap:8px;">
                  {#each ['s','m','l'] as sz}
                    <button on:click={() => { playArenaConfig.size = sz; cmsDraftPlayArenaConfig.set(playArenaConfig); }}
                      style="padding:8px 20px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; text-transform:uppercase; border:1px solid {playArenaConfig.size === sz ? 'var(--accent-gold)' : 'var(--border-color)'}; background:{playArenaConfig.size === sz ? 'rgba(245,200,66,0.1)' : 'transparent'}; color:{playArenaConfig.size === sz ? 'var(--accent-gold)' : 'var(--text-muted)'};"
                    >{sz}</button>
                  {/each}
                </div>
              </div>
            </div>

            <div class="cms-glass-card" style="padding:20px; background:rgba(245,200,66,0.05); border:1px solid rgba(245,200,66,0.2);">
              <p style="margin:0; font-size:13px; color:var(--accent-gold);">
                💡 <strong>Hint:</strong> Setările detaliate ale fiecărui widget (tooltip-uri, conținut, culori) se găsesc în tab-urile dedicate din meniu (Sidebar Nav, Gamification, etc.).
                Această pagină e centrul de control rapid — activezi/dezactivezi și setezi mărimile.
              </p>
            </div>
          </div>
        {/if}

        <!-- TAB: HEADER -->
        {#if activeTab === "header"}
          <div class="cms-tab-content">
            <h1 class="cms-page-title-main">{getTabTitle(activeTab)}</h1>
            <div class="cms-glass-card" style="padding: 32px;">
              <h3 class="cms-section-title">🖼️ Configurare Header & Logo</h3>
              <p style="font-size:13px; color: var(--text-muted); margin-bottom: 32px;">
                Personalizează elementele vizuale din partea de sus a site-ului.
              </p>

              <div class="cms-fields-grid">
                <div class="cms-field">
                  <label>Logo Site</label>
                  <div style="display: flex; align-items: center; gap: 20px; background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
                    <div style="width: 120px; height: 60px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 8px;">
                      <img src={headerConfig.logoUrl || themeColors.logoUrl} alt="Logo" style="max-height: 100%; max-width: 100%;" />
                    </div>
                    <div style="flex: 1;">
                      <input type="file" accept="image/*" on:change={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            headerConfig.logoUrl = ev.target.result;
                            headerConfig = {...headerConfig};
                            cmsDraftHeaderConfig.set(headerConfig);
                          };
                          reader.readAsDataURL(file);
                        }
                      }} style="margin-bottom: 8px; font-size: 12px;" />
                      <p style="font-size: 11px; color: var(--text-muted);">Recomandat: PNG transparent sau WebP (120x60px).</p>
                    </div>
                  </div>
                </div>

                <div class="cms-field">
                  <label>Înălțime Logo (px)</label>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <input type="range" min="15" max="60" bind:value={headerConfig.logoHeight} style="flex: 1;" />
                    <span style="font-family: monospace; font-weight: 800; color: var(--accent-gold); min-width: 40px;">{headerConfig.logoHeight}px</span>
                  </div>
                </div>

                <div class="cms-field">
                  <label>Culoare Fundal Header</label>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <input type="color" bind:value={headerConfig.bgColor} style="width: 40px; height: 40px; border: none; padding: 0; background: transparent; cursor: pointer;" />
                    <input type="text" bind:value={headerConfig.bgColor} style="flex: 1; font-family: monospace;" />
                  </div>
                </div>

                <div class="cms-field">
                   <label>Culoare Contur (Border)</label>
                   <div style="display: flex; align-items: center; gap: 12px;">
                     <input type="color" bind:value={headerConfig.borderColor} style="width: 40px; height: 40px; border: none; padding: 0; background: transparent; cursor: pointer;" />
                     <input type="text" bind:value={headerConfig.borderColor} style="flex: 1; font-family: monospace;" />
                   </div>
                </div>

                <div class="cms-field" style="display: flex; align-items: center; padding-top: 30px;">
                  <label class="cms-toggle-label" style="color: #22c55e;">
                    <input type="checkbox" bind:checked={headerConfig.sticky} /> Header Lipicios (Sticky)
                  </label>
                </div>
              </div>

              <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.05);">
                <h3 class="cms-section-title" style="font-size: 16px;">🔍 Widget-uri Header (Vizibilitate)</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-top: 16px;">
                   {#each [
                     { id: 'showArena', label: 'Play Arena' },
                     { id: 'showWheel', label: 'Roata Norocului' },
                     { id: 'showCashback', label: 'Cashback Progres' }
                   ] as w}
                    <div style="background: rgba(255,255,255,0.03); padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                       <span style="font-size: 13px; font-weight: 700; color: var(--text-main);">{w.label}</span>
                       <label class="cms-switch" style="transform: scale(0.8);">
                          <input type="checkbox" bind:checked={headerConfig[w.id]} />
                          <span class="cms-slider"></span>
                       </label>
                    </div>
                   {/each}
                </div>
              </div>
            </div>
          </div>
        {/if}

        {#if activeTab === "history"}
          <div class="cms-tab-content">
            <h1 class="cms-page-title-main">{getTabTitle(activeTab)}</h1>
            <div class="cms-glass-card" style="padding: 24px;">
              <h3 class="cms-section-title">Istoric Activitate</h3>
              <div class="cms-history-table-wrapper">
                <table class="cms-history-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Data & Ora</th>
                      <th>User</th>
                      <th>Acțiune</th>
                      <th>Detalii</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each paginatedLogs as log, idx}
                      <tr>
                        <td class="cms-td-num"
                          >{(historyPage - 1) * rowsPerPage + idx + 1}</td
                        >
                        <td class="cms-td-time">{log.timestamp}</td>
                        <td class="cms-td-user">{log.user}</td>
                        <td class="cms-td-action"
                          ><span class="cms-action-badge">{log.action}</span
                          ></td
                        >
                        <td class="cms-td-details">{log.details}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
              <div class="cms-pagination">
                <div class="cms-rows-select">
                  <span>Rânduri:</span>
                  <select bind:value={rowsPerPage}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div class="cms-page-controls">
                  <button
                    disabled={historyPage === 1}
                    on:click={() => historyPage--}>←</button
                  >
                  <span>Pagina {historyPage} din {totalPages}</span>
                  <button
                    disabled={historyPage === totalPages}
                    on:click={() => historyPage++}>→</button
                  >
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Image Preview Modal -->
{#if previewBannerModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 40px;"
    on:click={() => (previewBannerModal = null)}
  >
    <div
      style="background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 20px; padding: 32px; max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; gap: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); position: relative;"
      on:click|stopPropagation
    >
      <button
        on:click={() => (previewBannerModal = null)}
        style="position: absolute; top: -16px; right: -16px; width: 40px; height: 40px; border-radius: 50%; background: var(--bg-hover); border: 2px solid var(--border-color); color: var(--text-main); font-size: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10;"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          width="20"
          height="20"
          ><line x1="18" y1="6" x2="6" y2="18"></line><line
            x1="6"
            y1="6"
            x2="18"
            y2="18"
          ></line></svg
        >
      </button>

      <div
        style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 16px;"
      >
        <h3
          style="font-size: 20px; font-weight: 700; color: var(--text-main); margin: 0;"
        >
          Informații Imagine
        </h3>
        <div style="display: flex; gap: 16px;">
          {#if previewBannerModal._width && previewBannerModal._height}
            <div
              style="background: rgba(245,200,66,0.1); border: 1px solid rgba(245,200,66,0.2); padding: 8px 16px; border-radius: 8px; display: flex; flex-direction: column; align-items: center;"
            >
              <span
                style="font-size: 10px; color: var(--accent-gold); font-weight: 800; letter-spacing: 1px; text-transform: uppercase;"
                >Rezoluție</span
              >
              <span style="font-size: 16px; color: #fff; font-weight: 700;"
                >{previewBannerModal._width}
                <span style="color:var(--text-muted); font-size:12px;">x</span>
                {previewBannerModal._height}
                <span style="color:var(--text-muted); font-size:12px;">px</span
                ></span
              >
            </div>
            <div
              style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); padding: 8px 16px; border-radius: 8px; display: flex; flex-direction: column; align-items: center;"
            >
              <span
                style="font-size: 10px; color: #60a5fa; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;"
                >Aspect Ratio</span
              >
              <span style="font-size: 16px; color: #fff; font-weight: 700;"
                >{(
                  previewBannerModal._width / previewBannerModal._height
                ).toFixed(2)}:1</span
              >
            </div>
          {/if}
        </div>
      </div>

      <div
        style="flex: 1; min-height: 0; display: flex; justify-content: center; align-items: center; background: rgba(0,0,0,0.2); border-radius: 12px; overflow: hidden; padding: 16px;"
      >
        <img
          src={previewBannerModal.image}
          alt="Full Size"
          style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);"
        />
      </div>
    </div>
  </div>
{/if}

<!-- ─── LIVE PREVIEW WIDGET ─── -->
{#if $isAdminLoggedIn && activeTab === "gamification"}
  <!-- Removed flickering badge -->
  <Gamification />
{/if}

<style>
  .cms-live-preview-badge {
    position: fixed;
    bottom: 110px;
    left: 24px;
    background: var(--primary);
    color: #000;
    padding: 6px 12px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    z-index: 2000;
    pointer-events: none;
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
    100% {
      opacity: 1;
    }
  }
  :global(.cms-shell) {
    --primary: #4c1d95;
    --primary-hover: #5b21b6;
    --accent-gold: #f5c842;
    --bg-dark: #0c0a10;
    --bg-panel: #16141d;
    --bg-hover: #1e1b26;
    --border-color: rgba(255, 255, 255, 0.08);
    --text-main: #ffffff;
    --text-muted: #a1a1aa;
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-pill: 50px;
    --font-main: "Outfit", sans-serif;
  }

  /* ─── Login ─── */
  .cms-login-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: var(--bg-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }
  .cms-login-card {
    background: var(--bg-panel);
    border: 1px solid var(--border-color);
    border-radius: 32px;
    padding: 48px;
    width: 100%;
    max-width: 420px;
    box-shadow: var(--shadow-glass);
  }
  .cms-login-header {
    text-align: center;
    margin-bottom: 40px;
  }
  .cms-login-header img {
    height: 48px;
    margin-bottom: 16px;
  }
  .cms-login-header h2 {
    font-size: 24px;
    font-weight: 800;
    color: var(--text-main);
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .cms-input-group {
    margin-bottom: 20px;
  }
  .cms-input-group label,
  .cms-label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    margin-bottom: 8px;
    margin-left: 4px;
  }
  .cms-input-group input,
  .cms-input-group select,
  .cms-input,
  .cms-select {
    width: 100%;
    background: var(--bg-hover);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 12px 16px;
    color: var(--text-main);
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
  }
  .cms-input-group input:focus,
  .cms-input-group select:focus,
  .cms-input:focus,
  .cms-select:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(76, 29, 149, 0.2);
  }
  .cms-login-btn {
    width: 100%;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 16px;
    padding: 16px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 10px;
  }
  .cms-login-btn:hover {
    background: var(--primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
  .cms-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #ef4444;
    padding: 12px;
    border-radius: 12px;
    font-size: 13px;
    text-align: center;
    margin-bottom: 24px;
  }

  /* ─── Shell ─── */
  .cms-shell {
    display: flex;
    height: 100vh;
    background: var(--bg-dark);
    color: var(--text-main);
    font-family: var(--font-main);
  }

  /* ─── Sidebar ─── */
  .cms-sidebar {
    width: 240px;
    background: var(--bg-panel);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: sticky;
    top: 0;
    flex-shrink: 0;
    z-index: 100;
  }
  @media (max-width: 768px) {
    .cms-sidebar {
      display: none; /* Consider a hamburger menu for full mobile support later */
    }
  }
  .cms-sidebar-logo img {
    height: 32px;
  }
  .cms-sidebar-logo span {
    font-size: 12px;
    font-weight: 800;
    color: var(--accent-gold);
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .cms-nav {
    flex: 1;
    overflow-y: auto;
    padding: 0 16px 20px 16px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.1) transparent;
  }
  .cms-nav::-webkit-scrollbar {
    width: 4px;
  }
  .cms-nav::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
  }
  .cms-nav-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-muted);
    padding: 12px 16px;
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 4px;
    text-align: left;
  }
  .cms-nav-item svg {
    opacity: 0.5;
    transition: all 0.2s;
  }
  .cms-nav-item:hover {
    background: var(--bg-hover);
    color: var(--text-main);
  }
  .cms-nav-item.active {
    background: var(--bg-panel);
    color: var(--text-main);
    border-color: var(--border-color);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  .cms-nav-item.active svg {
    opacity: 1;
    color: var(--accent-gold);
  }
  .cms-sidebar-footer {
    padding: 20px 16px;
    border-top: 1px solid var(--border-color);
    background: rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .cms-sidebar-logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0;
    height: 60px;
    border-bottom: 1px solid var(--border-color);
    background: rgba(255,255,255,0.02);
  }
  .cms-sidebar-logo img {
    height: 28px;
    margin-bottom: 2px;
  }
  .cms-sidebar-logo span {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-weight: 800;
    color: var(--accent-gold);
    opacity: 0.8;
  }

  /* ─── Main Content ─── */
  .cms-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }
  .cms-topbar {
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border-color);
    padding: 10px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
  }
  .cms-page-title {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  .cms-topbar-search {
    position: relative;
    flex: 1;
    max-width: 400px;
    margin: 0 40px;
  }
  .cms-topbar-search svg {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
  }
  .cms-topbar-search input {
    width: 100%;
    background: var(--bg-hover);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-pill);
    padding: 10px 16px 10px 40px;
    color: var(--text-main);
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
  }
  .cms-topbar-search input:focus {
    border-color: var(--primary);
    background: var(--bg-panel);
  }
  .cms-topbar-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .cms-save-toast {
    font-size: 13px;
    color: #10b981;
    font-weight: 700;
    animation: fadeIn 0.3s;
  }

  .cms-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }
  .cms-tab-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 1200px;
    margin: 0 auto;
    animation: fadeIn 0.4s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .cms-glass-card {
    background: var(--bg-panel);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  /* ─── Table ─── */
  .cms-history-table-wrapper {
    overflow-x: auto;
  }
  .cms-history-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .cms-history-table th {
    text-align: left;
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-muted);
    text-transform: uppercase;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
  }
  .cms-history-table td {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-color);
  }
  .cms-td-num {
    font-weight: 800;
    color: var(--text-muted);
    width: 40px;
  }
  .cms-td-time {
    color: var(--text-main);
    font-family: monospace;
    font-size: 12px;
    white-space: nowrap;
  }
  .cms-td-user {
    font-weight: 600;
    color: var(--accent-gold);
  }
  .cms-td-action {
    font-weight: 800;
  }
  .cms-action-badge {
    padding: 5px 12px;
    background: rgba(139, 92, 246, 0.1);
    color: #a78bfa;
    border-radius: 6px;
    border: 1px solid rgba(139, 92, 246, 0.2);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .cms-td-details {
    color: var(--text-muted);
    line-height: 1.4;
  }

  /* ─── Fields ─── */
  .cms-fields-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }
  .cms-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .cms-field label {
    font-size: 11px;
    font-weight: 800;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-left: 4px;
  }
  .cms-field input[type="text"],
  .cms-field input[type="datetime-local"],
  .cms-field select {
    background: var(--bg-hover);
    border: 1px solid var(--border-color);
    color: var(--text-main);
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    width: 100%;
    transition: border-color 0.2s;
    outline: none;
  }
  .cms-field input:focus,
  .cms-field select:focus {
    border-color: rgba(59, 130, 246, 0.6);
  }

  /* ─── Toggles / Switches ─── */
  .cms-toggles {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    margin-top: 4px;
  }
  .cms-toggle-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-main);
    cursor: pointer;
  }
  .cms-toggle-label input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    width: 40px;
    height: 22px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    position: relative;
    cursor: pointer;
    outline: none;
    transition: background 0.3s;
    flex-shrink: 0;
    margin: 0;
  }
  .cms-toggle-label input[type="checkbox"]::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  .cms-toggle-label input[type="checkbox"]:checked {
    background: var(--accent-gold);
  }
  .cms-toggle-label input[type="checkbox"]:checked::after {
    transform: translateX(18px);
  }

  /* Standalone Switch */
  .cms-switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 22px;
    margin: 0;
  }
  .cms-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .cms-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.1);
    transition: 0.3s;
    border-radius: 22px;
  }
  .cms-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  input:checked + .cms-slider {
    background-color: var(--accent-gold);
  }
  input:checked + .cms-slider:before {
    transform: translateX(18px);
  } /* ─── Timeline ─── */
  .cms-timeline {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .cms-timeline-item {
    display: flex;
    align-items: center;
    gap: 20px;
    background: var(--bg-panel);
    border: 1px solid var(--border-color);
    padding: 16px 24px;
    border-radius: var(--radius-md);
    transition: all 0.2s;
  }
  .cms-timeline-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .cms-item-tag {
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    font-weight: 800;
  }
  .cms-item-name {
    font-weight: 700;
    font-size: 15px;
  }
  .cms-timeline-times {
    display: flex;
    gap: 24px;
  }
  .cms-time-badge {
    font-size: 12px;
    color: var(--text-main);
  }
  .cms-time-badge span {
    color: var(--text-muted);
    margin-right: 4px;
  }
  .cms-status-pill {
    padding: 4px 12px;
    border-radius: var(--radius-pill);
    font-size: 10px;
    font-weight: 800;
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
  .cms-timeline-item.status-expirată {
    opacity: 0.4;
    filter: grayscale(0.5);
    border-color: rgba(239, 68, 68, 0.2);
    background: rgba(239, 68, 68, 0.02);
  }
  .cms-timeline-item.status-expirată .cms-status-pill {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.2);
  }
  .cms-timeline-item.status-programată {
    border-color: rgba(245, 200, 66, 0.3);
  }
  .cms-timeline-item.status-programată .cms-status-pill {
    background: rgba(245, 200, 66, 0.1);
    color: var(--accent-gold);
    border-color: rgba(245, 200, 66, 0.2);
  }

  .cms-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    flex-wrap: wrap;
  }
  .cms-row-order {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding-top: 4px;
    min-width: 30px;
  }
  .cms-order-num {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 700;
  }
  .cms-row-body {
    flex: 1;
    min-width: 200px;
  }

  .cms-btn-primary {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--primary);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: var(--radius-pill);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .cms-btn-primary:hover {
    background: var(--primary-hover);
  }
  .cms-btn-ghost {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-muted);
    padding: 9px 16px;
    border-radius: var(--radius-pill);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }
  .cms-btn-ghost:hover {
    background: var(--bg-hover);
    color: var(--text-main);
  }
  .cms-btn-icon {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--border-color);
    color: var(--text-muted);
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: all 0.2s;
  }
  .cms-btn-icon:hover:not(:disabled) {
    background: var(--bg-hover);
    color: var(--text-main);
  }
  .cms-btn-danger {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #ef4444;
    padding: 8px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .cms-btn-add {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: rgba(76, 29, 149, 0.1);
    border: 1px dashed rgba(76, 29, 149, 0.4);
    color: #a78bfa;
    padding: 14px;
    border-radius: var(--radius-lg);
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s;
    width: 100%;
  }

  .cms-section-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 16px;
  }
  .cms-layout-picker {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .cms-layout-btn {
    padding: 8px 16px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--border-color);
    background: rgba(0, 0, 0, 0.02);
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .cms-layout-btn.active {
    background: rgba(245, 200, 66, 0.12);
    border-color: var(--accent-gold);
    color: var(--accent-gold);
  }

  .cms-banner-card {
    display: flex;
    gap: 16px;
    padding: 16px;
    flex-wrap: wrap;
  }
  .cms-banner-preview {
    width: 280px;
    flex-shrink: 0;
    border-radius: var(--radius-md);
    background: var(--bg-hover);
    border: 1px solid var(--border-color);
    padding: 12px;
  }
  .cms-banner-preview img,
  .cms-banner-preview video {
    width: 100%;
    height: auto;
    border-radius: 8px;
  }
  .cms-banner-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: var(--text-muted);
    text-align: center;
  }
  .cms-banner-fields {
    flex: 1;
    min-width: 250px;
  }
  .cms-banner-num {
    font-size: 12px;
    font-weight: 700;
    color: var(--accent-gold);
    margin-bottom: 10px;
  }
  .cms-file-input {
    color: var(--text-muted);
    font-size: 13px;
    cursor: pointer;
  }
  .cms-bg-preview {
    margin-top: 12px;
    border-radius: var(--radius-md);
    overflow: hidden;
    position: relative;
    height: 120px;
    border: 1px solid var(--border-color);
  }
  .cms-bg-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .cms-bg-preview .cms-btn-danger {
    position: absolute;
    top: 8px;
    right: 8px;
  }

  .preview-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(245, 200, 66, 0.2);
  }

  .cms-pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-top: 1px solid var(--border-color);
    margin-top: 20px;
  }
  .cms-rows-select {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .cms-rows-select select {
    background: var(--bg-hover);
    border: 1px solid var(--border-color);
    color: var(--text-main);
    border-radius: 4px;
    padding: 2px 4px;
  }
  .cms-page-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 12px;
    font-weight: 700;
  }
  .cms-page-controls button {
    background: var(--bg-hover);
    border: 1px solid var(--border-color);
    color: var(--text-main);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cms-page-controls button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .cms-context-preview {
    margin-top: 48px;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid var(--border-color);
    background: #000;
    box-shadow: 0 15px 50px rgba(0,0,0,0.4);
  }
  .cms-context-preview-header {
    padding: 14px 20px;
    background: rgba(255,255,255,0.02);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    letter-spacing: 1px;
    font-weight: 900;
    color: var(--accent-gold);
    text-transform: uppercase;
  }
  .cms-context-preview-body {
    height: 500px;
    background: #111;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    overflow: hidden;
    transition: all 0.4s ease;
  }
  .cms-context-preview-body.mobile {
    padding: 24px;
    background: #0a0a0a;
  }
  .cms-context-preview-body.mobile iframe {
    width: 375px;
    height: 100%;
    border-radius: 16px;
    border: 4px solid #333;
    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
  }
  .cms-context-preview-body.desktop iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
  .cms-btn-mini {
    padding: 4px 10px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  .cms-btn-mini:hover {
    background: rgba(124,58,237,0.3);
    border-color: #7c3aed;
  }
  .cms-page-title-main {
    font-size: 26px;
    font-weight: 900;
    color: #fff;
    margin-bottom: 28px;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
    gap: 12px;
    text-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  .cms-page-title-main::before {
    content: '';
    width: 6px;
    height: 24px;
    background: var(--accent-gold);
    border-radius: 3px;
    box-shadow: 0 0 10px var(--accent-gold);
  }
</style>
