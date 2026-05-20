<script>
  import { onMount } from "svelte";
  import "./app.css";

  // ─── Lucky Wheel State ───
  let wheelRotation = 0;
  let wheelSpinning = false;
  let wheelPrize = "";
  let showWheelPrize = false;
  let wheelSpins = 0;
  const wheelSegments = [
    { label: "3 Rotiri\nGratuite", color: "#16a34a" },
    { label: "50 Rotiri\nDepunere", color: "#2563eb" },
    { label: "10 Rotiri\nGratuite", color: "#0d9488" },
    { label: "50% Bani\nBonus", color: "#db2777" },
    { label: "7 Rotiri\nGratuite", color: "#16a34a" },
    { label: "20% Bani\nBonus", color: "#dc2626" },
    { label: "5 Rotiri\nGratuite", color: "#7c3aed" },
    { label: "77 Rotiri\nDepunere", color: "#dc2626" },
  ];
  function wheelPath(index, total, radius) {
    const cx = 100,
      cy = 100;
    const angleStep = (2 * Math.PI) / total;
    const startAngle = index * angleStep - Math.PI / 2;
    const endAngle = startAngle + angleStep;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
  }

  function spinSidebarWheel() {
    if (wheelSpinning) return;
    wheelSpinning = true;
    showWheelPrize = false;
    const segCount = wheelSegments.length;
    const winIdx = Math.floor(Math.random() * segCount);
    const degPerSeg = 360 / segCount;
    const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360;
    const targetDeg = extraSpins + (360 - (winIdx * degPerSeg + degPerSeg / 2));
    wheelRotation = wheelRotation + targetDeg;
    setTimeout(() => {
      wheelSpinning = false;
      wheelPrize = wheelSegments[winIdx].label.replace('\\n', ' ');
      showWheelPrize = true;
      setTimeout(() => { showWheelPrize = false; }, 4000);
    }, 3600);
  }

  let searchQuery = "";
  let activeView = "home";
  let activeWalletCard = 0;
  let isAdminRoute = false;

  if (typeof window !== "undefined") {
    const checkAdmin = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      isAdminRoute =
        hash === "#admin" || path.startsWith("/admin");
      
      // Restore client activeView from hash if it's a valid SPA route, otherwise from localStorage
      if (!isAdminRoute) {
        if (hash && hash !== "#admin") {
          const view = hash.substring(1);
          if (["vip", "playarena", "home", "slots", "live", "sport", "promo", "loto", "rtp", "support"].includes(view)) {
            activeView = view;
          }
        } else {
          try {
            const savedView = localStorage.getItem("cashpot_activeView");
            const savedQuery = localStorage.getItem("cashpot_searchQuery");
            if (savedView && !savedView.startsWith("preview_")) {
              activeView = savedView;
            } else if (savedView && savedView.startsWith("preview_")) {
              activeView = "home"; // fallback to home if stuck in preview
              localStorage.setItem("cashpot_activeView", "home");
            }
            if (savedQuery) searchQuery = savedQuery;
          } catch (e) {}
        }
      }
    };
    checkAdmin();
    window.addEventListener("hashchange", checkAdmin);
    window.addEventListener("popstate", checkAdmin);
  }

  // Synchronize activeView and searchQuery changes to window location hash & localStorage for deep-linking & page-refresh persistence
  $: if (typeof window !== "undefined" && activeView && !isAdminRoute) {
    if (activeView === "home") {
      if (window.location.hash && window.location.hash !== "#admin") {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    } else if (!activeView.startsWith("preview_")) {
      window.location.hash = activeView;
    }
    try {
      if (!activeView.startsWith("preview_")) {
        localStorage.setItem("cashpot_activeView", activeView);
      }
      localStorage.setItem("cashpot_searchQuery", searchQuery);
    } catch (e) {}
  }

  // Visual CMS pencils removed as requested by user
  $: isVisualCMSActive = false;
  let showCmsToolbar = false; // Hidden by default — admin must explicitly open it

  $: filteredGames = GAMES.filter(
    (g) =>
      g.n.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.p.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.c &&
        g.c.some((cat) =>
          cat.toLowerCase().includes(searchQuery.toLowerCase()),
        )),
  );
  import {
    GAMES,
    cmsCategories,
    cmsJackpot,
    cmsJackpotFever,
    cmsJackpotFever2,
    cmsBanners,
    cmsPromoBanner,
    siteTheme,
    isPreviewMode,
    isAdminLoggedIn,
    cmsDraftCategories,
    cmsDraftJackpot,
    cmsDraftJackpotFever,
    cmsDraftJackpotFever2,
    cmsDraftBanners,
    cmsDraftPromoBanner,
    cmsDraftGameEffects,
    cmsGameEffects,
    cmsThemeColors,
    cmsDraftThemeColors,
    cmsWinnersConfig,
    cmsDraftWinnersConfig,
    cmsTopGamesConfig,
    cmsDraftTopGamesConfig,
    cmsRtpConfig,
    cmsDraftRtpConfig,
    cmsToolbarConfig,
    cmsDraftToolbarConfig,
    cmsSidebarNavConfig,
    cmsDraftSidebarNavConfig,
    cmsSidebarWidgets,
    cmsDraftSidebarWidgets,
    cmsPlayArenaConfig,
    cmsDraftPlayArenaConfig,
    cmsVipConfig,
    cmsDraftVipConfig,
    isForcedMobile,
    cmsHeaderWidgets,
    cmsDraftHeaderWidgets,
    cmsHeaderConfig,
    cmsDraftHeaderConfig,
    loadFromServer,
    defaultSidebarWidgets,
  } from "./store.js";
  import AdminCMS from "./AdminCMS.svelte";
  import Gamification from "./Gamification.svelte";
  import Fever2Widget from "./Fever2Widget.svelte";
  import ToolbarWidget from "./ToolbarWidget.svelte";
  import PlayArena from "./PlayArena.svelte";
  import PaymentCardStack from "./PaymentCardStack.svelte";
  import DepositModal from "./DepositModal.svelte";

  $: isDarkTheme = $siteTheme === "dark";
  let isNoCookie = false;
  let showLoginModal = false;
  let showRegisterModal = false;

  let isVisualEditorMinimized = false;

  let jackpotVals = {
    spades: 90673.69,
    hearts: 12225.84,
    diamonds: 430.41,
    clubs: 69.41,
  };

  $: ctTabs = (widgetsSource.sidebar?.categoryTabs?.tabs || []).map((tab) => ({
    id: tab.label.toLowerCase().replace(/[^a-z0-9]/g, "_"),
    label: tab.label,
    icon: tab.icon,
    image: tab.image
  }));

  let favoriteGames = new Set();
  function toggleFavorite(gameName) {
    if (favoriteGames.has(gameName)) {
      favoriteGames.delete(gameName);
    } else {
      favoriteGames.add(gameName);
    }
    favoriteGames = new Set(favoriteGames);
  }

  function clearAllState() {
    activeView = "home";
    searchQuery = "";
    if (typeof document !== "undefined") {
      const searchInput = document.getElementById("mobileSearchInput");
      if (searchInput) {
        searchInput.value = "";
        searchInput.blur();
      }
    }
    // Double-tap the state to be absolutely sure
    setTimeout(() => {
      searchQuery = "";
      activeView = "home";
    }, 10);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setView(view, query = "", subView = "") {
    if (view === "home" && !query) {
      clearAllState();
      if (typeof window !== "undefined" && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      return;
    }
    activeView = view;
    searchQuery = query;

    if (view === "playarena" && subView) {
      playArenaConfig.activeSubView = subView;
      cmsPlayArenaConfig.set({ ...playArenaConfig });
    }
    
    if (typeof window !== "undefined") {
      const newHash = query ? `#${view}/${query}` : `#${view}`;
      if (window.location.hash !== newHash) {
        window.history.pushState(null, '', newHash);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleDeposit() {
    showUserPanel = false;
    showMobileWallet = false;
    showDepositModal = true;
    addAuditLog(
      "DEPOSIT_CLICK",
      "S-a deschis fereastra de Depunere.",
    );
  }

  // CMS stores — Dynamic source selection (Live vs Draft)
  $: categoriesSource = $isPreviewMode ? $cmsDraftCategories : $cmsCategories;
  $: jackpotSource = $isPreviewMode ? $cmsDraftJackpot : $cmsJackpot;
  $: jackpotFeverSource = $isPreviewMode
    ? $cmsDraftJackpotFever
    : $cmsJackpotFever;
  $: jackpotFever2Source = $isPreviewMode
    ? $cmsDraftJackpotFever2
    : $cmsJackpotFever2;
  $: bannersSource = $isPreviewMode ? $cmsDraftBanners : $cmsBanners;
  $: bannersConfig = (() => {
    if (!bannersSource) return bannersSource;
    let clean = JSON.parse(JSON.stringify(bannersSource));
    if (clean.items) {
      clean.items = clean.items.map((item) => ({
        ...item,
        title: item.title?.trim() ? item.title : "",
        subtitle: item.subtitle?.trim() ? item.subtitle : "",
        tag: item.tag?.trim() ? item.tag : "",
        buttonText: item.buttonText?.trim() ? item.buttonText : ""
      }));
    }
    return clean;
  })();
  $: promoSource = $isPreviewMode ? $cmsDraftPromoBanner : $cmsPromoBanner;
  $: gameEffectsSource = $isPreviewMode
    ? $cmsDraftGameEffects
    : $cmsGameEffects;
  $: themeColorsSource = $isPreviewMode
    ? $cmsDraftThemeColors
    : $cmsThemeColors;
  $: winnersSource = $isPreviewMode
    ? $cmsDraftWinnersConfig
    : $cmsWinnersConfig;
  $: topGamesConfig = $isPreviewMode
    ? $cmsDraftTopGamesConfig
    : $cmsTopGamesConfig;
  $: rtpConfig = $isPreviewMode ? $cmsDraftRtpConfig : $cmsRtpConfig;
  $: toolbarSource = $isPreviewMode
    ? $cmsDraftToolbarConfig
    : $cmsToolbarConfig;
  $: sidebarNavSource = $isPreviewMode
    ? $cmsDraftSidebarNavConfig
    : $cmsSidebarNavConfig;
  // Draft always overrides published — CMS changes are immediately visible
  $: widgetsSource = {
    ...defaultSidebarWidgets,
    ...($cmsSidebarWidgets || {}),
    ...($cmsDraftSidebarWidgets || {}),
  };

  // Reactive CSS variables — injected into :root via svelte:head
  $: _gbEnabled = widgetsSource?.globalBorderEnabled;
  $: _gbColor   = widgetsSource?.globalBorderColor || '#f5c842';
  $: _gbWidth   = widgetsSource?.globalBorderWidth || 1;
  $: cssWidgetBorder      = _gbEnabled ? `${_gbWidth}px solid ${_gbColor}` : '1px solid rgba(255,255,255,0.08)';
  $: cssWidgetBorderColor = _gbEnabled ? _gbColor : 'rgba(255,255,255,0.08)';
  $: cssCatActiveColor    = widgetsSource?.categoryTabs?.activeColor   || '#fff';
  $: cssCatInactiveColor  = widgetsSource?.categoryTabs?.inactiveColor || 'rgba(255,255,255,0.5)';
  $: playArenaConfig = $isPreviewMode
    ? $cmsDraftPlayArenaConfig
    : $cmsPlayArenaConfig;
  $: headerWidgetsSource = $isPreviewMode
    ? $cmsDraftHeaderWidgets
    : $cmsHeaderWidgets;
  $: vipConfig = $isPreviewMode ? $cmsDraftVipConfig : $cmsVipConfig;
  $: headerConfigSource = $isPreviewMode
    ? $cmsDraftHeaderConfig
    : $cmsHeaderConfig;

  let lastPlayedGame = null;
  try {
    const saved = localStorage.getItem("cashpot_last_played");
    if (saved) lastPlayedGame = JSON.parse(saved);
  } catch (e) {}

  function playGame(game) {
    lastPlayedGame = game;
    localStorage.setItem("cashpot_last_played", JSON.stringify(game));
    // Simulation: in real app this would open the game URL
    alert(`Se încarcă jocul: ${game.n}\nProvider: ${game.p}`);
    addAuditLog("PLAY_GAME", `S-a deschis jocul "${game.n}".`);
  }

  function triggerRandomGame() {
    const allGames = GAMES.flatMap((cat) => cat.games);
    if (allGames.length > 0) {
      const randomGame = allGames[Math.floor(Math.random() * allGames.length)];
      playGame(randomGame);
    }
  }

  // Mock API Winners Data
  const apiWinners = [
    { id: "w1", name: "Marian D.", amount: 14500, game: "Sweet Bonanza" },
    { id: "w2", name: "Alex V.", amount: 3240, game: "100 Burning Hot" },
    { id: "w3", name: "Ionut M.", amount: 8900, game: "Gates of Olympus" },
    { id: "w4", name: "Andrei S.", amount: 2100, game: "Book of Ra" },
    { id: "w5", name: "Florin C.", amount: 45000, game: "Big Bass Bonanza" },
  ];

  let liveWinners = apiWinners;

  $: {
    if (winnersSource?.useMockData) {
      liveWinners = apiWinners;
    } else if (winnersSource?.apiUrl) {
      fetch(winnersSource.apiUrl)
        .then((res) => res.json())
        .then((data) => {
          liveWinners = Array.isArray(data) ? data : data.winners || apiWinners;
        })
        .catch((err) => {
          console.error("Failed to fetch winners API:", err);
          liveWinners = apiWinners;
        });
    } else {
      liveWinners = apiWinners;
    }
  }

  let liveHotGames = [];
  let liveColdGames = [];
  $: {
    if (rtpConfig?.apiUrl) {
      fetch(rtpConfig.apiUrl)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            liveHotGames = data.hot || [];
            liveColdGames = data.cold || [];
          }
        })
        .catch((err) => console.error("Failed to fetch RTP API:", err));
    }
  }

  let isSidebarScrolling = false;
  let sidebarScrollTimeout;
  function handleSidebarScroll() {
    isSidebarScrolling = true;
    clearTimeout(sidebarScrollTimeout);
    sidebarScrollTimeout = setTimeout(() => {
      isSidebarScrolling = false;
    }, 1000);
  }

  let jackpotConfig;
  let jackpotFeverConfig;
  let bannersConfig;
  let promoConfig;

  let slidersState = {
    general: 0,
    big: 0,
    small_1: 0,
    small_2: 0
  };
  let masterSliderInterval;

  $: jackpotConfig = jackpotSource;
  $: jackpotFeverConfig = jackpotFeverSource;
  $: bannersConfig = bannersSource;
  $: promoConfig = promoSource;
  
  $: if (bannersConfig?.autoSlide) {
    if (masterSliderInterval) clearInterval(masterSliderInterval);
    masterSliderInterval = setInterval(() => {
      slidersState = {
         general: (slidersState.general + 1) % Math.max(1, bannersConfig.items.filter(b => b.enabled !== false && (b.position === 'general' || !b.position)).length),
         big: (slidersState.big + 1) % Math.max(1, bannersConfig.items.filter(b => b.enabled !== false && b.position === 'big').length),
         small_1: (slidersState.small_1 + 1) % Math.max(1, bannersConfig.items.filter(b => b.enabled !== false && b.position === 'small_1').length),
         small_2: (slidersState.small_2 + 1) % Math.max(1, bannersConfig.items.filter(b => b.enabled !== false && b.position === 'small_2').length)
      };
    }, (bannersConfig.slideInterval || 5) * 1000);
  } else {
    if (masterSliderInterval) clearInterval(masterSliderInterval);
  }

  function getGameEffect(gameName, effectsSource) {
    const ef = effectsSource[gameName];
    if (!ef || ef.effect === "none") return null;
    if (ef.isScheduled && (ef.timeStart || ef.timeEnd)) {
      const now = new Date();
      if (ef.timeStart && now < new Date(ef.timeStart)) return null;
      if (ef.timeEnd && now > new Date(ef.timeEnd)) return null;
    }
    return ef;
  }

  $: allCategories = categoriesSource;

  let now = new Date();

  let animatedJackpots = [];
  $: {
    if (jackpotConfig) {
      if (
        !animatedJackpots.length ||
        animatedJackpots.length !== jackpotConfig.length
      ) {
        animatedJackpots = JSON.parse(JSON.stringify(jackpotConfig));
      } else {
        jackpotConfig.forEach((jc, i) => {
          animatedJackpots[i].id = jc.id;
          animatedJackpots[i].name = jc.name;
          animatedJackpots[i].position = jc.position;
          animatedJackpots[i].showWhenLoggedOut = jc.showWhenLoggedOut;
          animatedJackpots[i].showInFever = jc.showInFever;
          animatedJackpots[i].showInFever2 = jc.showInFever2;
          animatedJackpots[i].showOnlyHighestLevel = jc.showOnlyHighestLevel;
          animatedJackpots[i].animation = jc.animation;
          animatedJackpots[i].animationType =
            jc.animationType || (jc.animation ? "odometer" : "none");
          animatedJackpots[i].type = jc.type;
          animatedJackpots[i].logoUrl = jc.logoUrl;
          if (
            jc.levels &&
            (!animatedJackpots[i].levels ||
              animatedJackpots[i].levels.length !== jc.levels.length)
          ) {
            animatedJackpots[i].levels = JSON.parse(JSON.stringify(jc.levels));
          }
        });
      }
    }
  }

  onMount(async () => {
    // Force refresh VIP config if on old version
    if (typeof localStorage !== "undefined") {
      const v = localStorage.getItem("cashpot_cms_vip_version");
      if (v !== "9") {
        localStorage.removeItem("cashpot_cms_vip");
        localStorage.removeItem("cashpot_cms_vip_v2");
        localStorage.removeItem("cashpot_cms_vip_v3");
        localStorage.removeItem("cashpot_cms_vip_v4");
        localStorage.removeItem("cashpot_cms_vip_v5");
        localStorage.removeItem("cashpot_cms_vip_v6");
        localStorage.removeItem("cashpot_cms_vip_v7");
        localStorage.removeItem("cashpot_cms_vip_v8");
        localStorage.setItem("cashpot_cms_vip_version", "9");
        window.location.reload();
      }
    }

    await loadFromServer();

    // Initial check for preview parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const previewParam = urlParams.get("preview");
    const viewParam = urlParams.get("view");

    if (previewParam === "draft") {
      isPreviewMode.set(true);
      console.log("CMS Preview Mode Active: Draft Data");
    }

    // Handle hash routing
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const parts = hash.split('/').filter(Boolean);
        const view = parts[0] || 'home';
        const query = parts[1] || '';
        
        if (activeView !== view || searchQuery !== query) {
          activeView = view;
          searchQuery = query;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        if (activeView !== 'home') {
          activeView = 'home';
          searchQuery = '';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Initial route load
    if (window.location.hash) {
       handleHashChange();
    } else if (viewParam) {
       activeView = viewParam;
    }

    // Handle hash anchors on load (e.g. #categories)
    if (window.location.hash && window.location.hash !== "#admin") {
      setTimeout(() => {
        const id = window.location.hash.substring(1);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }

    const interval = setInterval(() => {
      now = new Date();
    }, 60000);
    const jpInterval = setInterval(() => {
      animatedJackpots = animatedJackpots.map((jp) => {
        // Only increment if animation is ON and we don't have a recent API value
        if (jp.animation && jp.levels) {
          jp.levels.forEach((l) => {
            const increment = l.value * (0.0000005 + Math.random() * 0.000002);
            l.value += increment;
          });
        }
        return jp;
      });
    }, 100);

    const fetchJackpots = async () => {
      let needsUpdate = false;
      for (let i = 0; i < jackpotConfig.length; i++) {
        let jc = jackpotConfig[i];
        if (jc.apiUrl && animatedJackpots[i]) {
          try {
            const targetUrl = jc.apiUrl.startsWith("http")
              ? `/api/proxy/cashpot?url=${encodeURIComponent(jc.apiUrl)}`
              : jc.apiUrl;
            const res = await fetch(targetUrl);
            if (res.ok) {
              const data = await res.json();

              let apiLevels = [];

              // Cashpot dynamic API structure detection
              if (data && typeof data === "object" && !Array.isArray(data)) {
                let typeMap = { cards: "jackpotCards", bell: "bellLink" };
                const apiKey = typeMap[jc.type] || jc.type;
                if (data[apiKey] && data[apiKey].levels) {
                  apiLevels = data[apiKey].levels;
                } else if (data.levels) {
                  apiLevels = data.levels;
                } else if (data.data && data.data.levels) {
                  apiLevels = data.data.levels;
                } else if (data.jackpots) {
                  apiLevels = data.jackpots;
                } else {
                  const firstKey = Object.keys(data)[0];
                  if (firstKey && Array.isArray(data[firstKey]))
                    apiLevels = data[firstKey];
                  else if (firstKey && data[firstKey].levels)
                    apiLevels = data[firstKey].levels;
                }
              } else if (Array.isArray(data)) {
                apiLevels = data;
              }

              if (apiLevels.length > 0) {
                if (
                  !animatedJackpots[i].levels ||
                  animatedJackpots[i].levels.length === 0
                ) {
                  // Dynamically create levels from API data if missing
                  animatedJackpots[i].levels = apiLevels.map((lvl, idx) => ({
                    id: "l" + (idx + 1),
                    value: Number(lvl.value || lvl.amount || lvl.val || 0),
                    icon:
                      jc.type === "bell"
                        ? "🔔"
                        : idx === 0
                          ? "♠"
                          : idx === 1
                            ? "♥"
                            : idx === 2
                              ? "♦"
                              : "♣",
                    color: jc.type === "bell" ? "#f5c842" : "#ff0000",
                  }));
                  needsUpdate = true;
                } else {
                  apiLevels.forEach((apiLvl, idx) => {
                    if (animatedJackpots[i].levels[idx]) {
                      animatedJackpots[i].levels[idx].value =
                        Number(
                          apiLvl.value || apiLvl.amount || apiLvl.val || 0,
                        ) || animatedJackpots[i].levels[idx].value;
                      needsUpdate = true;
                    }
                  });
                }
              }
            }
          } catch (e) {
            // Ignore CORS or network errors
            console.error("API Fetch Error for " + jc.apiUrl, e);
          }
        }
      }
      if (needsUpdate) animatedJackpots = [...animatedJackpots];
    };

    // Fetch immediately on mount, then every 5 seconds
    fetchJackpots();
    const apiPollInterval = setInterval(fetchJackpots, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(jpInterval);
      clearInterval(apiPollInterval);
    };
  });

  // Timer check — accepts optional `now` param for reactivity
  function isActiveCat(cat, _now) {
    const t = _now || new Date();
    if (cat.timeStart && new Date(cat.timeStart) > t) return false;
    if (cat.timeEnd && new Date(cat.timeEnd) < t) return false;
    return true;
  }

  function getGamesForCategory(cat) {
    if (!cat) return GAMES;
    if (cat.filter === "favorites")
      return GAMES.filter((g) => favoriteGames.has(g.n));

    // Explicit game list provided by CMS
    if (cat.games && Array.isArray(cat.games) && cat.games.length > 0) {
      return GAMES.filter((g) => cat.games.includes(g.n));
    }

    // Improved slicing logic to avoid duplicates across sections
    if (cat.filter === "slice_5") {
      if (cat.id === "hot") return GAMES.slice(0, 5);
      if (cat.id === "rec") return GAMES.slice(5, 10);
      return GAMES.slice(0, 5);
    }

    if (cat.filter === "reverse") return [...GAMES].reverse();
    if (cat.filter === "all") return GAMES;

    // Filter by provider if the filter string looks like a provider name
    const byProv = GAMES.filter(
      (g) => g.p.toLowerCase() === cat.filter.toLowerCase(),
    );
    if (byProv.length > 0) return byProv;

    return GAMES;
  }

  let favGamesList = [];
  let categoriesConfig = [];
  let sidebarCategoriesConfig = [];
  let isMobileMenuOpen = false;
  let showAllSidebarItems = false;

  $: favGamesList = GAMES.filter((g) => favoriteGames.has(g.n));

  let isLoggedIn = typeof localStorage !== "undefined" && localStorage.getItem("isLoggedIn") === "true";
  let loginEmail = "";
  let loginPassword = "";
  let loginErrorMsg = "";
  let loggedInUsername = isLoggedIn ? "Eugen Cazmal" : "";
  let userBalance = 80249.8;
  let showDepositModal = false;
  let userBonus = 0;
  let userLevel = 1;
  let userXP = 750;
  $: xpPercentage = Math.round((userXP / 1000) * 100);
  $: levelIcons = [
    "/koi_vip.png",
    "/crab_vip.png",
    "/dolphin_vip.png",
    "/octopus_vip.png",
    "/rechin_supreme.png",
  ];
  $: currentLevelIcon = levelIcons[userLevel - 1] || levelIcons[0];
  $: totalProgressPercentage = (userLevel - 1) * 20 + xpPercentage / 5;
  let showUserPanel = false;
  let showMobileWallet = false;
  function formatBalance(bal) {
    if (bal === undefined || bal === null) return "";
    const parts = bal.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split(",");
    return `${parts[0]}<span style="font-size: 0.7em;">,${parts[1]}</span>`;
  }

  let userPanelRect = { top: 70, right: 20 };

  function openUserPanel(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;
    const panelHeight = 520;
    const panelWidth = 320;

    let isSidebarWidget = rect.left < 300; // Sidebar is usually on the left

    let top = isMobile ? 60 : rect.bottom + 10;
    let left = isMobile ? 0 : rect.left;
    let right = isMobile ? 0 : window.innerWidth - rect.right;
    let useLeft = isSidebarWidget;

    if (!isMobile) {
      if (isSidebarWidget) {
        // Position to the RIGHT of the sidebar widget
        left = rect.right + 15;
        // ALWAYS position at the top (under header) to ensure 100% visibility
        top = 60;
      } else {
        // Position BELOW (e.g. header)
        top = rect.bottom + 10;
        right = window.innerWidth - rect.right;
      }

      // Ensure vertical bounds for non-sidebar widgets
      if (!isSidebarWidget) {
        if (top < 60) top = 60;
        if (top + panelHeight > window.innerHeight - 20) {
          top = window.innerHeight - panelHeight - 20;
        }
      }
    }

    userPanelRect = {
      top,
      right,
      left,
      useLeft: !isMobile && useLeft,
      isMobile,
    };
    showUserPanel = !showUserPanel;
  }

  function handleLogin() {
    if (
      (loginEmail === "jeka7ro@gmail.com" && loginPassword === "12Mai2026!") ||
      (loginEmail === "teste@cashpot.ro" && loginPassword === "parola123")
    ) {
      isLoggedIn = true;
      loggedInUsername =
        loginEmail === "teste@cashpot.ro" ? "Eugen Cazmal" : "Eugen Cazmal";
      localStorage.setItem("isLoggedIn", "true");
      showLoginModal = false;
      loginErrorMsg = "";
    } else {
      loginErrorMsg = "Email sau parolă incorectă!";
    }
  }

  function handleLogout() {
    isLoggedIn = false;
    localStorage.removeItem("isLoggedIn");
    loginEmail = "";
    loginPassword = "";
    showUserPanel = false;
  }
  // Reactive: re-filter whenever allCategories, now, or favoriteGames changes
  $: categoriesConfig = allCategories
    .filter((c) => c.showOnPage && isActiveCat(c, now))
    .filter((c) => isLoggedIn || c.showWhenLoggedOut)
    .sort((a, b) => a.order - b.order);

  $: sidebarCategoriesConfig = allCategories
    .filter((c) => c.showInSidebar && isActiveCat(c, now))
    .filter((c) => isLoggedIn || c.showWhenLoggedOut)
    .sort((a, b) => a.order - b.order);

  function formatJP(num) {
    return num.toLocaleString("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function toggleTheme() {
    siteTheme.update((t) => (t === "dark" ? "light" : "dark"));
  }

  let currentLang = "RO";
  function toggleLang() {
    currentLang = currentLang === "RO" ? "EN" : "RO";
  }

  // Visual Editor Panel Dragging Logic
  let editorPanelPos = { top: 80, right: 20 };
  let isDraggingEditor = false;
  let dragOffset = { x: 0, y: 0 };

  function onEditorDragStart(e) {
    if (e.target.closest("button")) return; // don't drag if clicking a button
    isDraggingEditor = true;
    dragOffset = { x: e.clientX, y: e.clientY };
    window.addEventListener("mousemove", onEditorDragMove);
    window.addEventListener("mouseup", onEditorDragEnd);
  }

  function onEditorDragMove(e) {
    if (!isDraggingEditor) return;
    const dx = e.clientX - dragOffset.x;
    const dy = e.clientY - dragOffset.y;
    dragOffset = { x: e.clientX, y: e.clientY };
    editorPanelPos.top += dy;
    editorPanelPos.right -= dx;
  }

  function onEditorDragEnd() {
    isDraggingEditor = false;
    window.removeEventListener("mousemove", onEditorDragMove);
    window.removeEventListener("mouseup", onEditorDragEnd);
  }

  let contentArea;
  let scrollY = 0;
  $: isHeaderSnapped =
    scrollY > 30 &&
    toolbarSource.enabled &&
    toolbarSource.displayMode === "floating" &&
    toolbarSource.position !== "header" &&
    !!toolbarSource.snapToHeaderOnScroll;

  function handleContentScroll(e) {
    scrollY = e.currentTarget.scrollTop;
  }
</script>

<svelte:head>
  <style>:root{--widget-border:{cssWidgetBorder};--widget-border-color:{cssWidgetBorderColor};--cat-active-color:{cssCatActiveColor};--cat-inactive-color:{cssCatInactiveColor};}</style>
</svelte:head>
<svelte:window />



<div
  class="layout"
  class:force-mobile={$isForcedMobile}
  style="flex-direction: column; {isDarkTheme && themeColorsSource
    ? `--bg-dark: ${themeColorsSource.bgDark}; --bg-panel: ${themeColorsSource.bgPanel}; --bg-hover: ${themeColorsSource.bgHover};`
    : ''}"
>
  {#if !isAdminRoute && !activeView.startsWith("preview_")}
    <header
      class="topbar"
      style="background: {isDarkTheme ? (headerConfigSource.bgColor || '#130f1c') : 'var(--bg-panel)'}; border-bottom: 1px solid {headerConfigSource.borderColor ||
        'rgba(255, 255, 255, 0.08)'}; position: {headerConfigSource.sticky
        ? 'sticky'
        : 'relative'}; top: 0; z-index: 100;"
    >
      <div class="topbar-left">
        <!-- svelte-ignore a11y-invalid-attribute -->
        <a href="/" class="logo" style="display: flex; align-items: center;" on:click|preventDefault={() => setView('home')}>
          <img
            src={headerConfigSource.logoUrl ||
              themeColorsSource?.logoUrl ||
              "/logo_cashpot.png"}
            alt="CashPot"
            style="height: {headerConfigSource.logoHeight ||
              38}px; width: auto; object-fit: contain;"
          />
        </a>
      </div>

      <div class="topbar-center">
        {#if toolbarSource.enabled && (toolbarSource.position === "header" || isHeaderSnapped)}
          <ToolbarWidget
            config={{ ...toolbarSource, position: "header" }}
            themeColors={themeColorsSource}
            jackpots={animatedJackpots}
            {activeView}
            {isLoggedIn}
            {userBalance}
            {loggedInUsername}
            {widgetsSource}
            {lastPlayedGame}
            on:navigate={(e) => setView(e.detail.view, e.detail.query || "")}
            on:wheel={() => setView("playarena", "", "wheel")}
            on:play={(e) => playGame(e.detail.game)}
            on:deposit={() => setView("playarena", "cashback")}
            on:scrollToTop={() =>
              window.scrollTo({ top: 0, behavior: "smooth" })}
            on:random={triggerRandomGame}
          />
        {/if}
      </div>

      <!-- Search bar — anchored at left edge of content area -->
      <div class="topbar-search-wrapper">
        <div class="topbar-search">
          <svg viewBox="0 0 24 24"
            ><path
              d="M10 2a8 8 0 1 0 5.29 14.71l5 5a1 1 0 0 0 1.42-1.42l-5-5A8 8 0 0 0 10 2zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 10 4z"
            /></svg
          >
          <input
            id="mobileSearchInput"
            type="text"
            bind:value={searchQuery}
            placeholder="Caută joc..."
            style="width: 100%; padding-right: {searchQuery ? '65px' : '0px'};"
          />
          {#if searchQuery.length > 0}
            <div class="search-bubble">{filteredGames.length}</div>
          {/if}
          <button
            class="search-close-btn {searchQuery.length > 0 ? 'visible' : ''}"
            on:click={() => { searchQuery = ""; document.getElementById("mobileSearchInput")?.blur(); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              ><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg
            >
          </button>
        </div>
      </div>

      <div class="topbar-right">
        <!-- Header Bar Widgets (Dynamic List from CMS) -->
        {#if isLoggedIn && headerWidgetsSource?.enabled}
          <div
            class="header-widgets-list"
            style="display: flex; align-items: center; gap: 8px; margin-right: 8px;"
          >
            {#each headerWidgetsSource.items || [] as item}
              {#if item.enabled}
                <button
                  on:click={() => {
                    if (item.type === "arena") setView("playarena", "", "home");
                    else if (item.type === "wheel")
                      setView("playarena", "", "wheel");
                    else if (item.type === "cashback")
                      setView("playarena", "", "cashback");
                  }}
                  class="header-widget-item"
                  style="--accent: {item.color};"
                  title={item.label}
                >
                  <div class="widget-icon-mini">
                    {item.icon === "Arena" ? playArenaConfig.coins : item.icon}
                  </div>
                  <div class="widget-label-mini">{item.label}</div>
                </button>
              {/if}
            {/each}
          </div>
        {/if}

        <!-- Notification Bell (logged in only) -->
        {#if isLoggedIn && widgetsSource?.notificationBell?.enabled !== false}
          <button
            class="btn-theme-toggle notification-bell-btn"
            style="position:relative; flex-shrink:0;"
            title="Notificări"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              width="18"
              height="18"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <!-- Notification badge -->
            <span
              style="position:absolute; top:-2px; right:-2px; width:16px; height:16px; border-radius:50px; background:#ef4444; font-size:9px; font-weight:900; color:#fff; display:flex; align-items:center; justify-content:center; border:2px solid {isDarkTheme ? 'var(--bg-dark)' : 'var(--bg-panel)'};"
              >3</span
            >
          </button>
        {/if}

        {#if (themeColorsSource?.showLangToggle ?? headerConfigSource.showLangToggle)}
          <button class="btn-lang-toggle" on:click={toggleLang}>
            {#if currentLang === "RO"}
              <span style="font-size: 16px; line-height: 1;">🇷🇴</span> RO
            {:else}
              <span style="font-size: 16px; line-height: 1;">🇬🇧</span> EN
            {/if}
          </button>
        {/if}

        {#if (themeColorsSource?.showThemeToggle ?? headerConfigSource.showThemeToggle)}
          <button
            class="btn-theme-toggle"
            title="Schimbă tema"
            on:click={() =>
              siteTheme.update((t) => (t === "dark" ? "light" : "dark"))}
          >
            {#if $siteTheme === "dark"}
              <!-- Sun icon (switch to light) -->
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                ><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg
              >
            {:else}
              <!-- Moon icon (switch to dark) -->
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                ><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg
              >
            {/if}
          </button>
        {/if}

        {#if isLoggedIn}
          <!-- Balance Only (Button removed per request) -->
          <div style="display:flex; align-items:center; gap:8px;">
            <button
              class="header-wallet-btn"
              on:click={openUserPanel}
            >
              <div class="header-wallet-ring">
                <div class="header-wallet-img-container">
                  <img
                    src={vipConfig.levels[userLevel - 1]?.img || "/koi_vip.png"}
                    alt="VIP"
                    style="width:100%; height:100%; object-fit:cover;"
                  />
                </div>
              </div>
              <div style="display:flex; flex-direction:column; align-items:flex-start; text-align:left;">
                <div class="header-wallet-text-top">Portofel</div>
                <div class="header-wallet-balance">
                  {@html formatBalance(userBalance)} <span>RON</span>
                  <svg
                    class="header-wallet-chevron"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke-width="2"
                    width="12"
                    height="12"
                    ><path d="M6 9l6 6 6-6" /></svg
                  >
                </div>
                <div class="header-wallet-level">
                  Nivel {userLevel} • {vipConfig.levels[userLevel - 1]?.name || 'Membru'}
                </div>
                <div class="header-wallet-xp">
                  2.340 / 5.000 XP
                </div>
              </div>
            </button>
          </div>
        {:else}
          <button class="btn btn-login" on:click={() => (showLoginModal = true)}
            >Conectare</button
          >
          <button
            class="btn btn-register"
            style="background: linear-gradient(135deg,#f5c842,#e6a817); color:#1a1200; font-weight:900;"
            on:click={() => (showRegisterModal = true)}>Înregistrare</button
          >
        {/if}
      </div>
    </header>
  {/if}

  <!-- User Account Panel (fixed portal - works over all layers) -->
  {#if isLoggedIn && showUserPanel}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      style="position:fixed; inset:0; z-index:9998;"
      on:click={() => (showUserPanel = false)}
    ></div>
    <div
      id="user-panel-dropdown"
      style="position:fixed; top:{userPanelRect.top}px; {userPanelRect.useLeft
        ? 'left:' + userPanelRect.left + 'px'
        : 'right:' +
          (userPanelRect.isMobile
            ? '0'
            : userPanelRect.right + 'px')}; width:{userPanelRect.isMobile
        ? '100vw'
        : '640px'}; max-height:calc(100vh - 40px); overflow-y:auto; background:var(--bg-panel); backdrop-filter:blur(16px); border:1px solid var(--border-color); border-radius:{userPanelRect.isMobile
        ? '16px 16px 0 0'
        : '16px'}; box-shadow: var(--shadow-glass); z-index:9999; display:flex; flex-direction:{userPanelRect.isMobile ? 'column' : 'row'};"
    >
      <div style="width:{userPanelRect.isMobile ? '100%' : '320px'}; display:flex; flex-direction:column; border-right:{userPanelRect.isMobile ? 'none' : '1px solid var(--border-color)'};">
      <!-- Header -->
      <div
        style="padding: 24px 24px 20px 24px; border-bottom: 1px solid var(--border-color);"
      >
        <div
          style="display:flex; align-items:center; gap:12px; margin-bottom:20px;"
        >
          <div
            style="width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg,#4c1d95,#7c3aed); display:flex; align-items:center; justify-content:center; font-weight:900; font-size:18px; color:#fff; border:2px solid rgba(255,255,255,0.2); flex-shrink:0; box-shadow: 0 4px 12px rgba(124,58,237,0.3);"
          >
            {#if userLevel === 1}
              <img
                src="/koi_vip.png"
                alt="Koi"
                style="width:100%; height:100%; border-radius:50%; object-fit:cover;"
              />
            {:else}
              {loggedInUsername.charAt(0).toUpperCase()}
            {/if}
          </div>
          <div style="flex:1; min-width:0;">
            <div
              style="color:var(--text-main); font-weight:800; font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing: -0.3px;"
            >
              {loggedInUsername}
            </div>
            <div style="color:var(--text-muted); font-size:12px;">
              ID utilizator #617034
            </div>
          </div>
          <button
            on:click={() => (showUserPanel = false)}
            style="background:var(--bg-hover); border:1px solid var(--border-color); border-radius:50%; width:32px; height:32px; color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition: all 0.2s;"
            on:mouseover={(e) =>
              (e.currentTarget.style.color = "var(--text-main)")}
            on:mouseout={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              width="14"
              height="14"
              ><line x1="18" y1="6" x2="6" y2="18" /><line
                x1="6"
                y1="6"
                x2="18"
                y2="18"
              /></svg
            >
          </button>
        </div>

        <!-- Level bar -->
        <!-- Level Progress -->
        <div
          style="background:rgba(255,255,255,0.03); border-radius:12px; padding:12px; border:1px solid rgba(255,255,255,0.05); margin-bottom: 16px;"
        >
          <div
            style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"
          >
            <div
              style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;"
            >
              Progres Nivel
            </div>
            <div
              style="font-size:12px; font-weight:900; color:var(--accent-gold);"
            >
              Nivel {userLevel}
            </div>
          </div>
          <div
            style="height:8px; background:rgba(255,255,255,0.08); border-radius:10px; margin-bottom:8px; overflow:hidden; position:relative;"
          >
            <div
              style="height:100%; width:75%; background:linear-gradient(90deg, #8b5cf6, #c084fc); border-radius:10px; box-shadow: 0 0 15px rgba(139,92,246,0.5);"
            ></div>
          </div>
          <div
            style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted); font-weight:700;"
          >
            <span>75% completat</span>
            <span style="color:var(--accent-gold);"
              >Nivel {userLevel + 1} →</span
            >
          </div>
        </div>

        <!-- Balances -->
        <div
          style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;"
        >
          <div
            style="background:var(--bg-hover); border: 1px solid var(--border-color); border-radius:10px; padding:12px;"
          >
            <div
              style="font-size:10px; color:var(--text-muted); margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px; font-weight: 600;"
            >
              Balanță reală
            </div>
            <div
              style="color:var(--text-main); font-weight:800; font-size:16px;"
            >
              {@html formatBalance(userBalance)}
              <span style="font-size:10px; opacity:0.6; font-weight: 600;"
                >RON</span
              >
            </div>
          </div>
          <div
            style="background:var(--bg-hover); border: 1px solid var(--border-color); border-radius:10px; padding:12px;"
          >
            <div
              style="font-size:10px; color:var(--text-muted); margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px; font-weight: 600;"
            >
              Bonus
            </div>
            <div
              style="color:var(--accent-gold); font-weight:800; font-size:16px;"
            >
              {@html formatBalance(userBonus)}
              <span style="font-size:10px; opacity:0.6; font-weight: 600;"
                >RON</span
              >
            </div>
          </div>
        </div>

        <!-- Deposit -->
        <button
          class="btn-gold"
          on:click={handleDeposit}
          style="width:100%; border:none; border-radius:12px; padding:14px; font-weight:800; font-size:15px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow: 0 4px 15px rgba(252,211,77,0.3);"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            width="18"
            height="18"
            ><rect x="2" y="5" width="20" height="14" rx="2" /><line
              x1="2"
              y1="10"
              x2="22"
              y2="10"
            /></svg
          >
          DEPUNERE
        </button>
      </div>

      <!-- Menu Links -->
      <div
        style="padding:12px; display: flex; flex-direction: column; gap: 4px;"
      >
        {#each [{ icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', label: "Profil", badge: null }, { icon: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>', label: "Portofel", badge: null }, { icon: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>', label: "Bonusuri", badge: null }, { icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', label: "Joc responsabil", badge: null }, { icon: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>', label: "Notificări", badge: 1 }] as item}
          <button
            style="width:100%; display:flex; align-items:center; gap:12px; padding:12px 16px; background:transparent; border:none; color:var(--text-main); font-size:14px; cursor:pointer; text-align:left; border-radius: 8px; transition: all 0.2s;"
            on:mouseover={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            on:mouseout={(e) =>
              (e.currentTarget.style.background = "transparent")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              width="18"
              height="18"
              style="opacity: 0.8;"
            >
              {@html item.icon}
            </svg>
            <span style="flex:1; font-weight:600;">{item.label}</span>
            {#if item.badge}<span
                style="background:#ef4444; color:#fff; border-radius:12px; padding: 2px 8px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; flex-shrink:0;"
                >{item.badge}</span
              >{/if}
          </button>
        {/each}

        <div
          style="height:1px; background:var(--border-color); margin:8px;"
        ></div>

        <!-- Mobile-only: Setări afișate în profil -->
        <div class="mobile-profile-settings" style="display:none;">
          <!-- Theme toggle -->
          {#if (themeColorsSource?.showThemeToggle ?? headerConfigSource.showThemeToggle)}
            <button
              style="width:100%; display:flex; align-items:center; gap:12px; padding:12px 16px; background:transparent; border:none; color:var(--text-main); font-size:14px; cursor:pointer; text-align:left; border-radius: 8px; transition: all 0.2s; justify-content:space-between;"
              on:click={() => siteTheme.update((t) => (t === "dark" ? "light" : "dark"))}
              on:mouseover={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              on:mouseout={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style="display:flex; align-items:center; gap:12px;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.8;">
                  {#if $siteTheme === "dark"}
                    <circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  {:else}
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  {/if}
                </svg>
                <span style="font-weight:600;">Temă {$siteTheme === "dark" ? "Luminoasă" : "Întunecată"}</span>
              </div>
              <span style="font-size:11px; color:var(--text-muted); font-weight:600;">{$siteTheme === "dark" ? "🌙" : "☀️"}</span>
            </button>
          {/if}

          <!-- Lang toggle -->
          {#if (themeColorsSource?.showLangToggle ?? headerConfigSource.showLangToggle)}
            <button
              style="width:100%; display:flex; align-items:center; gap:12px; padding:12px 16px; background:transparent; border:none; color:var(--text-main); font-size:14px; cursor:pointer; text-align:left; border-radius: 8px; transition: all 0.2s; justify-content:space-between;"
              on:click={toggleLang}
              on:mouseover={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              on:mouseout={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-size:18px; opacity:0.8;">{currentLang === "RO" ? "🇷🇴" : "🇬🇧"}</span>
                <span style="font-weight:600;">Limbă</span>
              </div>
              <span style="font-size:11px; color:var(--text-muted); font-weight:700;">{currentLang}</span>
            </button>
          {/if}

          <!-- Notifications -->
          <button
            style="width:100%; display:flex; align-items:center; gap:12px; padding:12px 16px; background:transparent; border:none; color:var(--text-main); font-size:14px; cursor:pointer; text-align:left; border-radius: 8px; transition: all 0.2s; justify-content:space-between;"
            on:mouseover={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            on:mouseout={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style="display:flex; align-items:center; gap:12px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="opacity:0.8;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span style="font-weight:600;">Notificări</span>
            </div>
            <span style="background:#ef4444; color:#fff; border-radius:12px; padding:2px 8px; font-size:11px; font-weight:800;">3</span>
          </button>

          <div style="height:1px; background:var(--border-color); margin:8px;"></div>
        </div>

        <button
          on:click={handleLogout}
          style="width:100%; display:flex; align-items:center; gap:12px; padding:12px 16px; background:transparent; border:none; color:#ef4444; font-size:14px; cursor:pointer; font-weight:600; border-radius: 8px; transition: all 0.2s;"
          on:mouseover={(e) =>
            (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
          on:mouseout={(e) =>
            (e.currentTarget.style.background = "transparent")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="18"
            height="18"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline
              points="16 17 21 12 16 7"
            /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Deconectare</span>
        </button>
      </div>
      </div> <!-- End Left Column -->

      <!-- Right Column: Recent Games & Quick Deposit (Desktop only) -->
      {#if !userPanelRect.isMobile}
      <div style="width:320px; padding:24px; display:flex; flex-direction:column;">
        <!-- Depunere rapida -->
        <div style="margin-bottom: 24px;">
          <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; font-weight:700; margin-bottom:10px;">Depunere rapidă</div>
          
          <!-- Saved Card Widget -->
          <PaymentCardStack />

          <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px;">
            {#each [100, 200, 500, 1000] as amount}
              <button style="padding:10px 0; border-radius:10px; background:var(--bg-hover); border:1px solid var(--border-color); color:var(--text-main); font-weight:800; font-size:13px; cursor:pointer; transition:all 0.2s; display:flex; flex-direction:column; align-items:center; gap:2px;"
                on:click={() => { userBalance += amount; showUserPanel = false; alert(`Apple Pay: Depunere de ${amount} RON aprobată!`); }}
                on:mouseover={(e) => { e.currentTarget.style.borderColor='var(--accent-gold)'; e.currentTarget.style.color='var(--accent-gold)'; e.currentTarget.style.transform='scale(1.05)'; }}
                on:mouseout={(e) => { e.currentTarget.style.borderColor='var(--border-color)'; e.currentTarget.style.color='var(--text-main)'; e.currentTarget.style.transform='scale(1)'; }}
              >
                <span style="font-size:14px; font-weight:900;">{amount}</span>
                <span style="font-size:8px; opacity:0.5; font-weight:600;">LEI</span>
              </button>
            {/each}
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h3 style="font-size:16px; font-weight:800; color:var(--text-main); margin:0;">Ultimele Jocuri</h3>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
          {#each (topGamesConfig?.games || []).slice(0, 4) as topGame}
            {@const game = GAMES.find((g) => g.n === topGame.name) || { n: topGame.name, img: '' }}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
              style="aspect-ratio:3/4; border-radius:12px; overflow:hidden; position:relative; cursor:pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2); transition:transform 0.2s;"
              on:click={() => { showUserPanel = false; selectGame(game); }}
              on:mouseover={(e) => e.currentTarget.style.transform='scale(1.03)'}
              on:mouseout={(e) => e.currentTarget.style.transform='scale(1)'}
            >
              <img src={game.img} alt={game.n} style="width:100%; height:100%; object-fit:cover;" />
              <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.8), transparent); display:flex; align-items:flex-end; padding:10px;">
                <span style="color:#fff; font-size:10px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{game.n}</span>
              </div>
            </div>
          {/each}
        </div>
        <button style="margin-top:auto; width:100%; padding:12px; background:rgba(255,255,255,0.05); border:1px solid var(--border-color); border-radius:12px; color:var(--text-main); font-weight:700; cursor:pointer; transition:all 0.2s;" on:mouseover={(e) => e.currentTarget.style.background='rgba(255,255,255,0.1)'} on:mouseout={(e) => e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
          Toate Jocurile Jucate
        </button>
      </div>
      {/if}
    </div>
  {/if}

  <div
    class="main-wrapper"
    style="display: flex; flex: 1; min-height: 0; background-color: var(--bg-dark);"
  >
    {#if isAdminRoute}
      <div style="flex: 1; overflow-y: auto; background: var(--bg-dark);">
        <AdminCMS />
      </div>
    {:else}
      <!-- Mobile Sidebar Overlay -->
      {#if isMobileMenuOpen}
        <div
          class="sidebar-overlay"
          on:click={() => (isMobileMenuOpen = false)}
          style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; backdrop-filter: blur(2px);"
        ></div>
      {/if}

      <!-- SITE BACKGROUND IMAGE LAYER -->
      {#if themeColorsSource.bgImage}
        <div
          class="site-bg-image"
          style="position: fixed; inset: 0; background-image: url({themeColorsSource.bgImage}); background-size: cover; background-position: center; z-index: -1; opacity: 0.4; pointer-events: none;"
        ></div>
      {/if}

      <!-- Play Arena Floating Widget (Toolbar position) -->
      {#if isLoggedIn && playArenaConfig.enabled && playArenaConfig.widgetPosition === "toolbar"}
        <div
          class="play-arena-floating-widget"
          style="position: fixed; bottom: 100px; right: 20px; z-index: 1000;"
        >
          <button
            on:click={() => setView("playarena")}
            style="width: 56px; height: 56px; border-radius: 50%; background: rgba(18, 14, 26, 0.82); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: var(--widget-border); color: var(--accent-gold); cursor: pointer; box-shadow: 0 8px 32px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; transition: all 0.2s; position: relative;"
            on:mouseover={(e) =>
              (e.currentTarget.style.transform = "scale(1.1) translateY(-5px)")}
            on:mouseout={(e) =>
              (e.currentTarget.style.transform = "scale(1) translateY(0)")}
          >
            <span style="font-size: 26px;">🎮</span>
            {#if playArenaConfig.missionsCount > 0}
              <span
                style="position: absolute; top: -4px; right: -4px; background: #ef4444; color: #fff; font-size: 10px; font-weight: 900; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 2px solid #120e1a; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"
                >{playArenaConfig.missionsCount}</span
              >
            {/if}

            {#if playArenaConfig.size === "l"}
              <div
                style="position: absolute; right: 64px; background: rgba(18, 14, 26, 0.82); backdrop-filter: blur(10px); padding: 8px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); white-space: nowrap; pointer-events: none; opacity: 0; transform: translateX(10px); transition: all 0.3s;"
                class="pa-floating-label"
              >
                <div
                  style="font-size: 10px; font-weight: 800; color: var(--accent-gold); text-transform: uppercase;"
                >
                  Play Arena
                </div>
                <div style="font-size: 14px; font-weight: 900; color: #fff;">
                  {playArenaConfig.coins} Coins
                </div>
              </div>
            {/if}
          </button>
        </div>
      {/if}

      <!-- FLOATING TOOLBAR WIDGET (Centered on screen) -->
      {#if (toolbarSource.displayMode === "floating" || toolbarSource.displayMode === "bottom_bar") && toolbarSource.position !== "header" && !isHeaderSnapped}
        <div
          style="position: fixed; bottom: 0; left: 0; width: 100vw; height: 120px; z-index: 9999; display: flex; justify-content: center; pointer-events: none; align-items: flex-end; padding-bottom: 20px;"
        >
          <div
            style="pointer-events: auto; width: fit-content; position: relative;"
          >
            <ToolbarWidget
              config={toolbarSource}
              themeColors={themeColorsSource}
              jackpots={animatedJackpots}
              {activeView}
              {lastPlayedGame}
              {isLoggedIn}
              {userBalance}
              {loggedInUsername}
              {userLevel}
              {widgetsSource}
              isVisualEditor={isVisualCMSActive}
              on:navigate={(e) => setView(e.detail.view, e.detail.query || "")}
              on:wheel={() => setView("home", "")}
              on:random={triggerRandomGame}
              on:play={(e) => playGame(e.detail.game)}
              on:deposit={handleDeposit}
              on:scrollToTop={() =>
                window.scrollTo({ top: 0, behavior: "smooth" })}
              on:updatePosition={(e) => {
                if (isVisualCMSActive) {
                  $cmsDraftToolbarConfig = {
                    ...$cmsDraftToolbarConfig,
                    position: e.detail.position,
                  };
                }
              }}
            />
          </div>
        </div>
      {/if}

      <!-- SIDEBAR: Driven by CMS (Visibility, Position, Mode) -->
      {#if !isAdminRoute && sidebarNavSource.enabled}
        <aside
          on:scroll={handleSidebarScroll}
          class="sidebar {sidebarNavSource.mode === 'mini'
            ? 'icon-only'
            : ''} {isMobileMenuOpen ? 'open' : ''} {isSidebarScrolling
            ? 'scrolling'
            : ''}"
          style="padding-top: 16px; {isMobileMenuOpen
            ? 'z-index: 101;'
            : ''} order: {sidebarNavSource.position === 'right' ? '2' : '0'};"
        >
          <div
            class="sidebar-card"
            style="padding-bottom: 40px; flex-shrink: 0; position: relative; overflow: hidden; background: {isDarkTheme ? themeColorsSource.bgPanel : 'var(--bg-panel)'};"
          >
            {#if sidebarNavSource.bubblesEnabled}
              <div class="bubbles-bg" style="opacity: 0.3;">
                {#each Array(12) as _, i}
                  <div
                    class="bubble-item"
                    style="left: {Math.random() *
                      100}%; animation-delay: {Math.random() *
                      5}s; width: {Math.random() * 12 +
                      4}px; height: {Math.random() * 12 +
                      4}px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.05);"
                  ></div>
                {/each}
              </div>
            {/if}

            <div
              style="position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column;"
            >
              <nav class="sidebar-nav">
                <!-- TOP WALLET WIDGET -->
                {#if isLoggedIn && widgetsSource?.walletWidget?.enabled && widgetsSource?.walletWidget?.position === "top"}
                  <div
                    style="display: flex; flex-wrap: wrap; gap: 8px; padding: 0 12px 12px; justify-content: center;"
                  >
                    <div
                      style="order:{(widgetsSource.widgetOrder||[]).indexOf('walletWidget')>=0?(widgetsSource.widgetOrder||[]).indexOf('walletWidget'):99}; flex: {widgetsSource.walletWidget.size === 's' ? '0 1 calc(33.333% - 6px)' : widgetsSource.walletWidget.size === 'm' ? '0 1 calc(50% - 4px)' : '1 1 100%'}; max-width: {widgetsSource.walletWidget.size === 's' ? '80px' : widgetsSource.walletWidget.size === 'm' ? '114px' : 'none'}; min-width: 0;"
                    >
                      <div
                        on:click={openUserPanel}
                        style="width: 100%; {widgetsSource.walletWidget.size ===
                        's'
                          ? 'height: 52px;'
                          : 'padding: 16px;'} border-radius: 12px; background: linear-gradient(135deg, rgba(109,40,217,0.15), rgba(0,0,0,0.5)); border: 1px solid {widgetsSource
                          .walletWidget.borderColor ||
                          'rgba(245,200,66,0.4)'}; cursor: pointer; position: relative; overflow: hidden; display: flex; align-items: center; gap: 10px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"
                      >
                        {#if widgetsSource.walletWidget.bubblesEnabled}
                          <div class="bubbles-bg" style="opacity: 0.5;">
                            {#each Array(15) as _, i}
                              <div
                                class="bubble-item"
                                style="left: {Math.random() *
                                  100}%; animation-delay: {Math.random() *
                                  3}s; width: {Math.random() * 6 +
                                  2}px; height: {Math.random() * 6 +
                                  2}px; background: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 0 5px rgba(255,255,255,0.2);"
                              ></div>
                            {/each}
                          </div>
                        {/if}

                        {#if widgetsSource.walletWidget.size === "s"}
                          <div
                            style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 0 8px; position: relative; z-index: 2;"
                          >
                            <div
                              style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg,#6d28d9,#8b5cf6); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; color: #fff; flex-shrink: 0; border: var(--widget-border);"
                            >
                              {#if userLevel === 1}
                                <img
                                  src="/koi_vip.png"
                                  alt="Koi"
                                  style="width:100%; height:100%; border-radius:50%; object-fit:cover;"
                                />
                              {:else}
                                {loggedInUsername.charAt(0).toUpperCase()}
                              {/if}
                            </div>
                            <div style="flex: 1; min-width: 0;">
                              {#if widgetsSource.walletWidget.showBalance}
                                <div
                                  style="font-size: 13px; font-weight: 900; color: var(--accent-gold); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.1;"
                                >
                                  {@html formatBalance(userBalance)} <span style="font-size: 8px;">RON</span>
                                </div>
                              {/if}
                              {#if widgetsSource.walletWidget.showName}
                                <div
                                  style="font-size: 8px; color: rgba(255,255,255,0.5); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1;"
                                >
                                  {loggedInUsername}
                                </div>
                              {/if}
                            </div>
                          </div>
                        {:else}
                          <div
                            style="width: 100%; display: flex; flex-direction: column; gap: 12px; position: relative; z-index: 2;"
                          >
                            <div
                              style="display: flex; flex-direction: {widgetsSource
                                .walletWidget.size === 'l'
                                ? 'row'
                                : 'column'}; align-items: center; gap: 12px; width: 100%; text-align: {widgetsSource
                                .walletWidget.size === 'l'
                                ? 'left'
                                : 'center'};"
                            >
                              <div
                                style="width: {widgetsSource.walletWidget
                                  .size === 'l'
                                  ? '48px'
                                  : '40px'}; height: {widgetsSource.walletWidget
                                  .size === 'l'
                                  ? '48px'
                                  : '40px'}; border-radius: 50%; background: linear-gradient(135deg,#6d28d9,#8b5cf6); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: {widgetsSource
                                  .walletWidget.size === 'l'
                                  ? '20px'
                                  : '18px'}; color: #fff; flex-shrink: 0; box-shadow: 0 4px 12px rgba(109,40,217,0.3); border: var(--widget-border);"
                              >
                                {#if userLevel === 1}
                                  <img
                                    src="/koi_vip.png"
                                    alt="Koi"
                                    style="width:100%; height:100%; border-radius:50%; object-fit:cover;"
                                  />
                                {:else}
                                  {loggedInUsername.charAt(0).toUpperCase()}
                                {/if}
                              </div>
                              <div style="flex: 1;">
                                {#if widgetsSource.walletWidget.showName}
                                  <div
                                    style="font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;"
                                  >
                                    {loggedInUsername}
                                  </div>
                                {/if}
                                {#if widgetsSource.walletWidget.showBalance}
                                  <div
                                    style="font-size: {widgetsSource
                                      .walletWidget.size === 'l'
                                      ? '22px'
                                      : '18px'}; font-weight: 900; color: var(--accent-gold); font-family: 'Inter', monospace;"
                                  >
                                    {@html formatBalance(userBalance)}
                                    <span style="font-size: 12px;">RON</span>
                                  </div>
                                {/if}
                              </div>
                            </div>

                            <!-- Level Progress Row -->
                            <div
                              style="width: 100%; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);"
                            >
                              <div
                                style="display:flex; justify-content:space-between; align-items:center; font-size:10px; color:rgba(255,255,255,0.5); font-weight:700; margin-bottom:6px; text-transform:uppercase;"
                              >
                                <div
                                  style="display:flex; align-items:center; gap:4px;"
                                >
                                  <span style="color:#fff;"
                                    >Nivel {userLevel}</span
                                  >
                                  <span
                                    style="color:var(--accent-gold); font-size:9px; opacity:0.8;"
                                    >• 75%</span
                                  >
                                </div>
                                <span
                                  style="color:var(--accent-gold); font-size:8px;"
                                  >KOI</span
                                >
                              </div>
                              <div
                                style="height:6px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden; border:1px solid rgba(255,255,255,0.05);"
                              >
                                <div
                                  style="height:100%; width:75%; background:linear-gradient(90deg, #8b5cf6, #c084fc); border-radius:4px; box-shadow: 0 0 8px rgba(139,92,246,0.4);"
                                ></div>
                              </div>
                            </div>
                          </div>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/if}

                <!-- CMS TOP PROMO CARDS -->
                {#if (widgetsSource?.promoCards || []).filter((c) => c.enabled && c.position === "top").length > 0}
                  <div
                    class="sidebar-promos-container top"
                    style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:center; gap:8px; padding: 0 12px; margin-bottom: 8px;"
                  >
                    {#each widgetsSource.promoCards.filter((c) => c.enabled && c.position === "top") as card}
                      <a
                        href={card.target || "#"}
                        on:click|preventDefault={() => {
                          if (card.target) {
                            if (card.target.startsWith("http"))
                              window.open(card.target, "_blank");
                            else setView(card.target);
                          }
                        }}
                        class="sidebar-promo-card shape-{card.shape || 'card'}"
                        style={card.shape === "round"
                          ? "display:flex; flex-direction:column; align-items:center; text-align:center; padding:10px 0; flex: 0 0 auto;"
                          : "display:block; border-radius: 14px; overflow:hidden; border: var(--widget-border); position:relative; aspect-ratio: 18/9; background: var(--bg-hover); transition: transform 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.2); flex: " +
                            (card.size === "s"
                              ? "1 1 calc(50% - 4px)"
                              : "1 1 100%") +
                            ";"}
                      >
                        {#if card.shape === "round"}
                          {@const circleSize =
                            card.size === "s"
                              ? "44px"
                              : card.size === "l"
                                ? "80px"
                                : "60px"}
                          <div
                            style="width:{circleSize}; height:{circleSize}; border-radius:50%; border: var(--widget-border); overflow:hidden; margin-bottom:6px; box-shadow:0 0 15px rgba(245,200,66,0.15); background:rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;"
                          >
                            {#if card.image}
                              <img
                                src={card.image}
                                alt="p"
                                style="width:100%; height:100%; object-fit:fill;"
                              />
                            {:else}
                              <span style="font-size:24px;">🎯</span>
                            {/if}
                          </div>
                          <div
                            style="font-size:{card.size === 's'
                              ? '8px'
                              : '10px'}; font-weight:900; color:var(--accent-gold); text-transform:uppercase; letter-spacing:0.5px;"
                          >
                            {card.title}
                          </div>
                        {:else if card.shape === "gamecard"}
                          <!-- GAMECARD: portret ca o carte de joc -->
                          {#if card.image}
                            <img src={card.image} alt="promo" style="width:100%; height:100%; object-fit:cover; display:block; flex:1;" />
                          {:else}
                            <div style="flex:1; display:flex; align-items:center; justify-content:center; background:linear-gradient(160deg,#1e1b4b,#4c1d95);">
                              <span style="font-size:40px;">🎯</span>
                            </div>
                          {/if}
                          <div style="padding:8px; background:linear-gradient(to top, rgba(0,0,0,0.98), rgba(0,0,0,0.7)); text-align:center;">
                            <div style="font-size:9px; font-weight:900; color:#fff; text-transform:uppercase; letter-spacing:0.5px; line-height:1.3;">{card.title}</div>
                          </div>
                        {:else}
                          {#if card.image}
                            <img
                              src={card.image}
                              alt="promo"
                              style="width:100%; height:100%; object-fit:fill;"
                            />
                          {:else}
                            <div
                              style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:linear-gradient(45deg, #1e1b4b, #312e81);"
                            >
                              <span style="font-size:24px;">🎯</span>
                            </div>
                          {/if}
                          <div
                            style="position:absolute; bottom:0; left:0; right:0; padding:12px 10px; background:linear-gradient(to top, rgba(0,0,0,0.9), transparent);"
                          >
                            <div
                              style="font-size:11px; font-weight:900; color:#fff; line-height:1.2; text-transform:uppercase; letter-spacing:0.5px;"
                            >
                              {card.title}
                            </div>
                          </div>
                        {/if}
                      </a>
                    {/each}
                  </div>
                {/if}

                <!-- CMS-driven sidebar items -->
                {#each (sidebarNavSource?.items || []).filter((sni) => sni.enabled) as sni, i}
                  {#if i < 5 || showAllSidebarItems}
                    {#if sidebarNavSource.mode !== "mini" || sni.id === "sn_home"}
                      {#if sni.id === "sn_home"}
                        <a
                          href="#"
                          class="nav-item {activeView === 'home' && !searchQuery
                            ? 'active'
                            : ''}"
                          on:click|preventDefault={() => setView("home")}
                          title={sni.label}
                        >
                          {#if themeColorsSource.showSidebarIcons || themeColorsSource.showIcons}
                            <svg viewBox="0 0 24 24"
                              ><path
                                d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z"
                              /></svg
                            >
                          {/if}
                          <span class="nav-label">{sni.label}</span>
                        </a>
                      {:else if sni.id === "sn_vip"}
                        <a
                          href="#"
                          class="nav-item {activeView === 'vip'
                            ? 'active'
                            : ''}"
                          on:click|preventDefault={() => setView("vip")}
                          style="color: {activeView === 'vip'
                            ? 'var(--text-main)'
                            : 'var(--accent-gold)'};"
                          title={sni.label}
                        >
                          {#if themeColorsSource.showSidebarIcons || themeColorsSource.showIcons}
                            <svg viewBox="0 0 24 24"
                              ><path
                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                              /></svg
                            >
                          {/if}
                          <span class="nav-label">{sni.label}</span>
                        </a>
                      {:else if sni.id === "sn_slots"}
                        <a
                          href="#"
                          class="nav-item"
                          on:click|preventDefault={() =>
                            setView("home", "pacanele")}
                          title={sni.label}
                        >
                          {#if themeColorsSource.showSidebarIcons || themeColorsSource.showIcons}
                            <svg viewBox="0 0 24 24"
                              ><path
                                d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"
                              /><path
                                d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"
                              /></svg
                            >
                          {/if}
                          <span class="nav-label">{sni.label}</span>
                        </a>
                      {:else if sni.id === "sn_live"}
                        <a
                          href="#"
                          class="nav-item"
                          on:click|preventDefault={() =>
                            setView("home", "live")}
                          title={sni.label}
                        >
                          {#if themeColorsSource.showSidebarIcons || themeColorsSource.showIcons}
                            <svg viewBox="0 0 24 24"
                              ><path
                                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
                              /></svg
                            >
                          {/if}
                          <span class="nav-label">{sni.label}</span>
                        </a>
                      {:else if sni.id === "sn_sport"}
                        <a href="#" class="nav-item" title={sni.label}>
                          {#if themeColorsSource.showSidebarIcons || themeColorsSource.showIcons}
                            <svg viewBox="0 0 24 24"
                              ><path
                                d="M20.5 6c-2.61.7-5.67 1-8.5 1s-5.89-.3-8.5-1L3 8c1.86.5 4 .83 6 1v13h2v-6h2v6h2V9c2-.17 4.14-.5 6-1l-.5-2zM12 6c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"
                              /></svg
                            >
                          {/if}
                          <span class="nav-label">{sni.label}</span>
                        </a>
                      {:else if sni.id === "sn_loto"}
                        <a href="#" class="nav-item" title={sni.label}>
                          {#if themeColorsSource.showSidebarIcons || themeColorsSource.showIcons}
                            <svg viewBox="0 0 24 24"
                              ><circle cx="12" cy="12" r="10"></circle><path
                                d="M12 6v6l4 2"
                              ></path></svg
                            >
                          {/if}
                          <span class="nav-label">{sni.label}</span>
                        </a>
                      {:else if sni.id === "sn_promo"}
                        <a
                          href="#"
                          class="nav-item"
                          on:click|preventDefault={() =>
                            setView("home", "promotii")}
                          title={sni.label}
                        >
                          {#if themeColorsSource.showSidebarIcons || themeColorsSource.showIcons}
                            <svg viewBox="0 0 24 24"
                              ><path
                                d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                              ></path><polyline
                                points="3.27 6.96 12 12.01 20.73 6.96"
                              ></polyline><line
                                x1="12"
                                y1="22.08"
                                x2="12"
                                y2="12"
                              ></line></svg
                            >
                          {/if}
                          <span class="nav-label">{sni.label}</span>
                        </a>
                      {:else if sni.id === "sn_rtp"}
                        <a href="#" class="nav-item" title={sni.label}>
                          {#if themeColorsSource.showSidebarIcons || themeColorsSource.showIcons}
                            <svg viewBox="0 0 24 24"
                              ><polyline
                                points="22 12 18 12 15 21 9 3 6 12 2 12"
                              /></svg
                            >
                          {/if}
                          <span class="nav-label">{sni.label}</span>
                        </a>
                      {:else if sni.id === "sn_support"}
                        <a href="#" class="nav-item" title={sni.label}>
                          {#if themeColorsSource.showSidebarIcons || themeColorsSource.showIcons}
                            <svg viewBox="0 0 24 24"
                              ><path
                                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                              /></svg
                            >
                          {/if}
                          <span class="nav-label">{sni.label}</span>
                        </a>
                      {:else}
                        <!-- CMS DYNAMIC ITEM (Banners, Missions, Providers, etc.) -->
                        <a
                          href="#"
                          class="nav-item shape-{sni.shape ||
                            'default'} type-{sni.type || 'nav'}"
                          on:click|preventDefault={() => {
                            if (sni.type === "category")
                              setView("home", sni.target);
                            else if (sni.type === "nav") setView(sni.target);
                            else if (sni.type === "external")
                              window.open(sni.target, "_blank");
                          }}
                          title={sni.label}
                          style="{sni.shape === 'card'
                            ? 'background:rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius:14px; margin: 4px 10px; padding: 14px; height: auto; display: flex; flex-direction: column; align-items: flex-start;'
                            : ''}
                            {sni.shape === 'round'
                            ? 'flex-direction:column; align-items:center; text-align:center; padding: 12px 0; border: none; background: transparent;'
                            : ''}"
                        >
                          {#if themeColorsSource.showSidebarIcons || themeColorsSource.showIcons}
                            <div
                              class="nav-icon-wrapper"
                              style="{sni.shape === 'round'
                                ? 'width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02)); display:flex; align-items:center; justify-content:center; border: var(--widget-border); margin-bottom: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);'
                                : ''}
                                              {sni.shape === 'card'
                                ? 'width: 100%; height: 80px; background: rgba(0,0,0,0.2); border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);'
                                : ''}"
                            >
                              {#if sni.icon && (sni.icon.startsWith("http") || sni.icon.startsWith("data:"))}
                                <img
                                  src={sni.icon}
                                  alt="icon"
                                  style="height: {sni.shape === 'round'
                                    ? '32px'
                                    : sni.shape === 'card'
                                      ? '100%'
                                      : '22px'}; width: {sni.shape === 'card'
                                    ? '100%'
                                    : 'auto'}; object-fit: {sni.shape === 'card'
                                    ? 'cover'
                                    : 'contain'};"
                                />
                              {:else}
                                <span
                                  style="font-size: {sni.shape === 'round'
                                    ? '24px'
                                    : '18px'};">{sni.icon || "🔹"}</span
                                >
                              {/if}
                            </div>
                          {/if}
                          <span
                            class="nav-label"
                            style="{sni.shape === 'round'
                              ? 'font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--accent-gold);'
                              : ''}
                                                  {sni.shape === 'card'
                              ? 'font-weight: 900; font-size: 13px; color: #fff;'
                              : ''}">{sni.label}</span
                          >
                        </a>
                      {/if}
                    {/if}
                  {/if}
                {/each}

                {#if (sidebarNavSource?.items || []).filter((sni) => sni.enabled).length > 5}
                  <button
                    on:click={() =>
                      (showAllSidebarItems = !showAllSidebarItems)}
                    class="nav-item"
                    style="justify-content: center; background: transparent; border: none; cursor: pointer; padding: 12px 10px; margin-top: 4px; color: var(--text-muted); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; transition: color 0.2s;"
                    on:mouseover={(e) =>
                      (e.currentTarget.style.color = "var(--text-main)")}
                    on:mouseout={(e) =>
                      (e.currentTarget.style.color = "var(--text-muted)")}
                  >
                    {showAllSidebarItems
                      ? "▲ Vezi mai puțin"
                      : "▼ Vezi toate (" +
                        ((sidebarNavSource?.items || []).filter(
                          (sni) => sni.enabled,
                        ).length -
                          5) +
                        ")"}
                  </button>
                {/if}

                <!-- ─── SIDEBAR BOTTOM PROMO CARDS (CMS) ─── -->
                {#if (widgetsSource?.promoCards || []).filter((c) => c.enabled && (c.position === "bottom" || !c.position)).length > 0}
                  <div
                    class="sidebar-promos-container bottom"
                    style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:center; gap:8px; padding: 0 12px; margin-bottom: 8px;"
                  >
                    {#each widgetsSource.promoCards.filter((c) => c.enabled && (c.position === "bottom" || !c.position)) as card}
                      <a
                        href={card.target || "#"}
                        on:click|preventDefault={() => {
                          if (card.target) {
                            if (card.target.startsWith("http"))
                              window.open(card.target, "_blank");
                            else setView(card.target);
                          }
                        }}
                        class="sidebar-promo-card shape-{card.shape || 'card'}"
                        style={card.shape === "round"
                          ? "display:flex; flex-direction:column; align-items:center; text-align:center; padding:10px 0; flex: 0 0 auto;"
                          : card.shape === "gamecard"
                          ? `display:flex; flex-direction:column; align-items:stretch; border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); background:linear-gradient(160deg,rgba(20,5,50,0.98),rgba(0,0,0,0.9)); box-shadow:0 8px 24px rgba(0,0,0,0.5); flex:${card.size==='s'?'0 1 calc(33.333% - 6px)':card.size==='m'?'0 1 calc(50% - 4px)':'1 1 100%'}; max-width:${card.size==='s'?'80px':card.size==='m'?'114px':'none'}; aspect-ratio:3/4; position:relative;`
                          : `display:block; border-radius: 14px; overflow:hidden; border: var(--widget-border); position:relative; aspect-ratio: 18/9; background: var(--bg-hover); transition: transform 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.2); flex: ${card.size === 's' ? '0 1 calc(33.333% - 6px)' : card.size === 'm' ? '0 1 calc(50% - 4px)' : '1 1 100%'}; max-width: ${card.size === 's' ? '80px' : card.size === 'm' ? '114px' : 'none'};`}
                      >
                        {#if card.shape === "round"}
                          {@const circleSize =
                            card.size === "s"
                              ? "44px"
                              : card.size === "l"
                                ? "80px"
                                : "60px"}
                          <div
                            style="width:{circleSize}; height:{circleSize}; border-radius:50%; border: var(--widget-border); overflow:hidden; margin-bottom:6px; box-shadow:0 0 15px rgba(245,200,66,0.15); background:rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;"
                          >
                            {#if card.image}
                              <img
                                src={card.image}
                                alt="p"
                                style="width:100%; height:100%; object-fit:fill;"
                              />
                            {:else}
                              <span style="font-size:24px;">🎯</span>
                            {/if}
                          </div>
                          <div
                            style="font-size:{card.size === 's'
                              ? '8px'
                              : '10px'}; font-weight:900; color:var(--accent-gold); text-transform:uppercase; letter-spacing:0.5px;"
                          >
                            {card.title}
                          </div>
                        {:else if card.shape === "gamecard"}
                          <!-- GAMECARD: portret ca o carte de joc -->
                          {#if card.image}
                            <img src={card.image} alt="promo" style="width:100%; height:100%; object-fit:cover; display:block; flex:1;" />
                          {:else}
                            <div style="flex:1; display:flex; align-items:center; justify-content:center; background:linear-gradient(160deg,#1e1b4b,#4c1d95);">
                              <span style="font-size:40px;">🎯</span>
                            </div>
                          {/if}
                          <div style="padding:8px; background:linear-gradient(to top, rgba(0,0,0,0.98), rgba(0,0,0,0.7)); text-align:center;">
                            <div style="font-size:9px; font-weight:900; color:#fff; text-transform:uppercase; letter-spacing:0.5px; line-height:1.3;">{card.title}</div>
                          </div>
                        {:else}
                          {#if card.image}
                            <img
                              src={card.image}
                              alt="promo"
                              style="width:100%; height:100%; object-fit:fill;"
                            />
                          {:else}
                            <div
                              style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:linear-gradient(45deg, #1e1b4b, #312e81);"
                            >
                              <span style="font-size:24px;">🎯</span>
                            </div>
                          {/if}
                          <div
                            style="position:absolute; bottom:0; left:0; right:0; padding:12px 10px; background:linear-gradient(to top, rgba(0,0,0,0.9), transparent);"
                          >
                            <div
                              style="font-size:11px; font-weight:900; color:#fff; line-height:1.2; text-transform:uppercase; letter-spacing:0.5px;"
                            >
                              {card.title}
                            </div>
                          </div>
                        {/if}
                      </a>
                    {/each}
                  </div>
                {/if}
              </nav>

              <div
                class="sidebar-widgets"
                style="display: flex; flex-wrap: wrap; gap: 8px; padding: 0 12px; margin-bottom: 8px; justify-content: center; flex-direction: {(widgetsSource.widgetsLayoutStyle === 'vertical') ? 'column' : 'row'};"
              >
                <!-- WALLET WIDGET -->
                {#if isLoggedIn && widgetsSource?.walletWidget?.enabled && widgetsSource?.walletWidget?.position === "bottom"}
                  <div
                    style="flex: {widgetsSource.walletWidget.size === 's'
                      ? '0 1 calc(50% - 4px)'
                      : '1 1 100%'}; max-width: {widgetsSource.walletWidget
                      .size === 's'
                      ? '114px'
                      : 'none'}; min-width: 0;"
                  >
                    <div
                      on:click={openUserPanel}
                      style="width: 100%; {widgetsSource.walletWidget.size ===
                      's'
                        ? 'height: 52px;'
                        : 'padding: 16px;'} border-radius: 12px; background: linear-gradient(135deg, rgba(109,40,217,0.15), rgba(0,0,0,0.5)); border: 2px solid {widgetsSource.walletWidget.borderColor || 'rgba(255,255,255,0.08)'}; cursor: pointer; position: relative; overflow: hidden; display: flex; align-items: center; gap: 10px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"
                    >
                      {#if widgetsSource.walletWidget.bubblesEnabled}
                        <div class="bubbles-bg" style="opacity: 0.5;">
                          {#each Array(15) as _, i}
                            <div
                              class="bubble-item"
                              style="left: {Math.random() *
                                100}%; animation-delay: {Math.random() *
                                3}s; width: {Math.random() * 6 +
                                2}px; height: {Math.random() * 6 +
                                2}px; background: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 0 5px rgba(255,255,255,0.2);"
                            ></div>
                          {/each}
                        </div>
                      {/if}
                      {#if widgetsSource.walletWidget.size === "s"}
                        <div
                          style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 0 8px;"
                        >
                          <div
                            style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg,#6d28d9,#8b5cf6); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; color: #fff; flex-shrink: 0; border: var(--widget-border);"
                          >
                            {#if userLevel === 1}
                              <img
                                src="/koi_vip.png"
                                alt="Koi"
                                style="width:100%; height:100%; border-radius:50%; object-fit:cover;"
                              />
                            {:else}
                              {loggedInUsername.charAt(0).toUpperCase()}
                            {/if}
                          </div>
                          <div style="flex: 1; min-width: 0;">
                            {#if widgetsSource.walletWidget.showBalance}
                              <div
                                style="font-size: 13px; font-weight: 900; color: var(--accent-gold); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.1;"
                              >
                                {@html formatBalance(userBalance)} <span style="font-size: 8px;">RON</span>
                              </div>
                            {/if}
                            {#if widgetsSource.walletWidget.showName}
                              <div
                                style="font-size: 8px; color: rgba(255,255,255,0.5); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1;"
                              >
                                {loggedInUsername}
                              </div>
                            {/if}
                          </div>
                        </div>
                      {:else}
                        <div
                          style="width: 100%; display: flex; flex-direction: column; gap: 12px;"
                        >
                          <div
                            style="display: flex; flex-direction: {widgetsSource
                              .walletWidget.size === 'l'
                              ? 'row'
                              : 'column'}; align-items: center; gap: 12px; width: 100%; text-align: {widgetsSource
                              .walletWidget.size === 'l'
                              ? 'left'
                              : 'center'};"
                          >
                            <div
                              style="width: {widgetsSource.walletWidget.size ===
                              'l'
                                ? '48px'
                                : '40px'}; height: {widgetsSource.walletWidget
                                .size === 'l'
                                ? '48px'
                                : '40px'}; border-radius: 50%; background: linear-gradient(135deg,#6d28d9,#8b5cf6); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: {widgetsSource
                                .walletWidget.size === 'l'
                                ? '20px'
                                : '18px'}; color: #fff; flex-shrink: 0; box-shadow: 0 4px 12px rgba(109,40,217,0.3); border: 1px solid rgba(255,255,255,0.1);"
                            >
                              {#if userLevel === 1}
                                <img
                                  src="/koi_vip.png"
                                  alt="Koi"
                                  style="width:100%; height:100%; border-radius:50%; object-fit:cover;"
                                />
                              {:else}
                                {loggedInUsername.charAt(0).toUpperCase()}
                              {/if}
                            </div>
                            <div style="flex: 1;">
                              {#if widgetsSource.walletWidget.showName}
                                <div
                                  style="font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;"
                                >
                                  {loggedInUsername}
                                </div>
                              {/if}
                              {#if widgetsSource.walletWidget.showBalance}
                                <div
                                  style="font-size: {widgetsSource.walletWidget
                                    .size === 'l'
                                    ? '22px'
                                    : '18px'}; font-weight: 900; color: var(--accent-gold); font-family: 'Inter', monospace;"
                                >
                                  {@html formatBalance(userBalance)} <span style="font-size: 12px;">RON</span>
                                </div>
                              {/if}
                            </div>
                          </div>

                          <!-- Level Progress Row -->
                          <div
                            style="width: 100%; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); position: relative; z-index: 2;"
                          >
                            <div
                              style="display:flex; justify-content:space-between; align-items:center; font-size:10px; color:rgba(255,255,255,0.5); font-weight:700; margin-bottom:6px; text-transform:uppercase;"
                            >
                              <div
                                style="display:flex; align-items:center; gap:4px;"
                              >
                                <span style="color:#fff;"
                                  >Nivel {userLevel}</span
                                >
                                <span
                                  style="color:var(--accent-gold); font-size:9px; opacity:0.8;"
                                  >• {xpPercentage}%</span
                                >
                              </div>
                              <span
                                style="color:var(--accent-gold); font-size:8px;"
                                >KOI</span
                              >
                            </div>
                            <div
                              style="height:6px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden; border:1px solid rgba(255,255,255,0.05);"
                            >
                              <div
                                style="height:100%; width:{xpPercentage}%; background:linear-gradient(90deg, #8b5cf6, #c084fc); border-radius:4px; box-shadow: 0 0 8px rgba(139,92,246,0.4);"
                              ></div>
                            </div>
                          </div>
                        </div>
                      {/if}
                    </div>
                  </div>
                {/if}

                <!-- JACKPOT WIDGET -->
                {#if widgetsSource.jackpotWidget?.enabled}
                  {@const specJp = animatedJackpots.find(
                    (j) => j.id === widgetsSource.jackpotWidget.sourceId,
                  )}
                  {@const lvlIdx =
                    specJp && specJp.levels
                      ? specJp.levels.length -
                        parseInt(widgetsSource.jackpotWidget.level)
                      : 0}
                  {@const specLevel =
                    specJp && specJp.levels && specJp.levels[lvlIdx]
                      ? specJp.levels[lvlIdx]
                      : null}

                  {#if specJp && specLevel}
                    <div
                      style="order:{(widgetsSource.widgetOrder||[]).indexOf('jackpotWidget') >= 0 ? (widgetsSource.widgetOrder||[]).indexOf('jackpotWidget') : 99}; flex: {widgetsSource.jackpotWidget.size === 's' ? '0 1 calc(33.333% - 6px)' : widgetsSource.jackpotWidget.size === 'm' ? '0 1 calc(50% - 4px)' : '1 1 100%'}; max-width: {widgetsSource.jackpotWidget.size === 's' ? '80px' : widgetsSource.jackpotWidget.size === 'm' ? '114px' : 'none'}; min-width: 0;"
                    >
                      {#if widgetsSource.jackpotWidget.size === "s"}
                        <div
                          style="width: 100%; height: 52px; padding: 4px 6px; border-radius: 10px; background: linear-gradient(135deg, rgba(109,40,217,0.1), rgba(0,0,0,0.5)); border: 1px solid {widgetsSource.jackpotWidget.borderColor || 'rgba(255,255,255,0.08)'}; cursor: pointer; position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"
                        >
                          <div
                            style="height: 18px; display: flex; align-items: center; justify-content: center;"
                          >
                            <img
                              src={specJp.logoUrl &&
                              specJp.logoUrl.includes("cashpot.ro")
                                ? `/api/proxy/cashpot?url=${encodeURIComponent(specJp.logoUrl)}`
                                : specJp.logoUrl || ""}
                              alt={specJp.name}
                              style="height: 100%; width: auto; object-fit: contain;"
                            />
                          </div>
                          <div
                            style="display: flex; align-items: center; gap: 4px; line-height: 1;"
                          >
                            <div
                              style="font-size: 13px; font-weight: 900; color: #fff; font-family: 'Inter', monospace; letter-spacing: -0.5px;"
                            >
                              {formatJP(specLevel.value)}
                            </div>
                            <div
                              style="width: 4px; height: 4px; border-radius: 50%; background: #22c55e; animation: pulse 2s infinite; flex-shrink: 0; box-shadow: 0 0 6px #22c55e;"
                            ></div>
                          </div>
                          <div
                            style="font-size: 7px; font-weight: 800; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px;"
                          >
                            {specLevel.name}
                          </div>
                        </div>
                      {:else}
                        <div
                          style="padding: 16px; background: linear-gradient(135deg, rgba(109,40,217,0.1), rgba(0,0,0,0.5)); border: 1px solid {widgetsSource
                            .jackpotWidget.borderColor ||
                            'rgba(255,255,255,0.08)'}; border-radius: 16px; display:flex; flex-direction:column; align-items:center; gap:8px;"
                        >
                          <img
                            src={specJp.logoUrl &&
                            specJp.logoUrl.includes("cashpot.ro")
                              ? `/api/proxy/cashpot?url=${encodeURIComponent(specJp.logoUrl)}`
                              : specJp.logoUrl || ""}
                            alt={specJp.name}
                            style="height: 32px; object-fit: contain; margin-bottom: 4px;"
                          />
                          <div
                            style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 800; display:flex; align-items:center; gap:4px;"
                          >
                            <span
                              style="color:{specLevel.color ||
                                'var(--accent-gold)'}"
                              >{specLevel.icon || "💎"}</span
                            >
                            {specLevel.name}
                          </div>
                          <div
                            style="font-size: {widgetsSource.jackpotWidget
                              .size === 'l'
                              ? '24px'
                              : '20px'}; font-weight: 900; color: {specLevel.color ||
                              'var(--accent-gold)'}; font-family: 'Inter', monospace; display:flex; align-items:center; gap: 8px;"
                          >
                            {formatJP(specLevel.value)}
                            <div
                              style="width: 6px; height: 6px; border-radius: 50%; background: #22c55e; animation: pulse 2s infinite; box-shadow: 0 0 8px #22c55e;"
                            ></div>
                          </div>
                        </div>
                      {/if}
                    </div>
                  {/if}
                {/if}

                <!-- PLAY ARENA WIDGET -->
                {#if isLoggedIn && playArenaConfig.enabled && playArenaConfig.widgetPosition === "sidebar"}
                  <div
                    style="order: {(widgetsSource.widgetOrder||[]).indexOf('playArena')>=0?(widgetsSource.widgetOrder||[]).indexOf('playArena'):99}; flex: {playArenaConfig.size === 's' ||
                    !playArenaConfig.size
                      ? '0 1 calc(50% - 4px)'
                      : '1 1 100%'}; max-width: {playArenaConfig.size === 's' ||
                    !playArenaConfig.size
                      ? '114px'
                      : 'none'}; min-width: 0;"
                  >
                    {#if playArenaConfig.size === "s" || !playArenaConfig.size}
                      <button
                        on:click={() => setView("playarena")}
                        style="width: 100%; height: 52px; padding: 6px 10px; border-radius: 12px; background: linear-gradient(135deg, rgba(109,40,217,0.15), rgba(0,0,0,0.5)); border: 1px solid {widgetsSource.cashbackProgress.borderColor||'rgba(255,255,255,0.08)'}; cursor: pointer; text-align: left; transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center;"
                      >
                        <div
                          style="display: flex; align-items: center; gap: 8px; position: relative; z-index: 2; width: 100%;"
                        >
                          <div
                            style="width: 30px; height: 30px; border-radius: 50%; border: var(--widget-border); background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 0 8px rgba(245,200,66,0.3); flex-shrink: 0;"
                          >
                            🎮
                          </div>
                          <div style="flex: 1; min-width: 0;">
                            <div
                              style="font-size: 8px; font-weight: 800; color: var(--accent-gold); text-transform: uppercase; letter-spacing: 0.5px; line-height: 1;"
                            >
                              Play Arena
                            </div>
                            <div
                              style="font-size: 11px; font-weight: 900; color: #fff; margin-top: 1px;"
                            >
                              {playArenaConfig.coins}
                              <span
                                style="font-size: 8px; color: var(--accent-gold); opacity: 0.8;"
                                >Coins</span
                              >
                            </div>
                          </div>
                          <div
                            style="color: var(--accent-gold); font-size: 12px; flex-shrink: 0;"
                          >
                            ⚡
                          </div>
                        </div>
                      </button>
                    {:else}
                      <div
                        style="padding: 16px; background: linear-gradient(135deg, rgba(109,40,217,0.15), rgba(0,0,0,0.5)); border: var(--widget-border); border-radius: 16px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"
                      >
                        <div
                          style="font-size: 10px; color: var(--accent-gold); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 4px;"
                        >
                          <img src="/icons/pa_icon_home.png" alt="home" style="height:12px; object-fit:contain;" /> PLAY ARENA
                        </div>
                        <div
                          style="font-size: 18px; font-weight: 900; color: #fff; margin-bottom: 12px;"
                        >
                          Nivel 5
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px;">
                          <button style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 10px 4px; cursor: pointer; transition: all 0.2s;" on:click={() => setView('playarena', '', 'missions')} on:mouseover={(e) => e.currentTarget.style.background='rgba(255,255,255,0.1)'} on:mouseout={(e) => e.currentTarget.style.background='rgba(0,0,0,0.4)'}>
                            <div style="font-size: 16px; margin-bottom: 4px;"><img src="/icons/pa_icon_missions.png" alt="missions" style="height:20px; object-fit:contain;" /></div>
                            <div style="font-size: 9px; font-weight: 800; color: #fff; text-transform: uppercase;">{playArenaConfig.missionsCount || 2} Misiuni Active</div>
                          </button>
                          <button style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 10px 4px; cursor: pointer; transition: all 0.2s;" on:click={() => setView('playarena', '', 'tournaments')} on:mouseover={(e) => e.currentTarget.style.background='rgba(255,255,255,0.1)'} on:mouseout={(e) => e.currentTarget.style.background='rgba(0,0,0,0.4)'}>
                            <div style="font-size: 16px; margin-bottom: 4px;"><img src="/icons/pa_icon_tournaments.png" alt="tournaments" style="height:20px; object-fit:contain;" /></div>
                            <div style="font-size: 9px; font-weight: 800; color: #fff; text-transform: uppercase;">Turneu Săptămânal</div>
                          </button>
                        </div>
                        <button
                          on:click={() => setView("playarena")}
                          style="width: 100%; padding: 10px; border-radius: 99px; font-weight: 900; font-size: 12px; border: none; cursor: pointer; transition: all 0.2s; letter-spacing: 0.3px; background: var(--accent-gold); color: #1a1200;"
                          >INTRĂ ÎN ARENĂ</button
                        >
                      </div>
                    {/if}
                  </div>
                {/if}

                <!-- CASHBACK PROGRESS -->
                {#if isLoggedIn && widgetsSource?.cashbackProgress?.enabled !== false}
                  <div
                    style="order:{(widgetsSource.widgetOrder||[]).indexOf('cashbackProgress')>=0?(widgetsSource.widgetOrder||[]).indexOf('cashbackProgress'):99}; flex: {widgetsSource.cashbackProgress.size === 's' ? '0 1 calc(33.333% - 6px)' : widgetsSource.cashbackProgress.size === 'm' ? '0 1 calc(50% - 4px)' : '1 1 100%'}; max-width: {widgetsSource.cashbackProgress.size === 's' ? '80px' : widgetsSource.cashbackProgress.size === 'm' ? '114px' : 'none'}; min-width: 0;"
                  >
                    {#if widgetsSource.cashbackProgress.size === "s"}
                      <button
                        style="width: 100%; height: 52px; padding: 6px 10px; border-radius: 12px; background: linear-gradient(135deg, rgba(109,40,217,0.15), rgba(0,0,0,0.5)); border: 1px solid {widgetsSource.cashbackProgress.borderColor||'rgba(255,255,255,0.08)'}; cursor: pointer; text-align: left; transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center;"
                      >
                        <div
                          style="display: flex; align-items: center; gap: 8px; position: relative; z-index: 2; width: 100%;"
                        >
                          <div
                            style="width: 30px; height: 30px; border-radius: 50%; border: var(--widget-border); background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px rgba(245,200,66,0.3); flex-shrink: 0; overflow: hidden;"
                          >
                            <img
                              src="/rechin1.png"
                              alt="Shark"
                              style="width: 100%; height: 100%; object-fit: cover;"
                            />
                          </div>
                          <div style="flex: 1; min-width: 0;">
                            <div
                              style="font-size: 8px; font-weight: 800; color: var(--accent-gold); text-transform: uppercase; letter-spacing: 0.5px; line-height: 1;"
                            >
                              Cashback
                            </div>
                            <div
                              style="font-size: 11px; font-weight: 900; color: #fff; margin-top: 1px;"
                            >
                              {widgetsSource.cashbackProgress.level}
                              <span
                                style="font-size: 8px; color: var(--accent-gold); opacity: 0.8;"
                                >{widgetsSource.cashbackProgress
                                  .percentage}%</span
                              >
                            </div>
                          </div>
                        </div>
                      </button>
                    {:else if (widgetsSource?.cashbackProgress?.shape || 'widget') === 'gamecard'}
                      <button
                        style="width: 100%; aspect-ratio: 3/4; padding: 0; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: linear-gradient(160deg, rgba(20,5,50,0.98), rgba(0,0,0,0.9)); box-shadow: 0 8px 24px rgba(0,0,0,0.5); position: relative; cursor: pointer; display: flex; flex-direction: column; align-items: stretch; transition: transform 0.2s;"
                        on:mouseover={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                        on:mouseout={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <img src="/shark_cash.png" alt="Cashback" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.8;" />
                        <div style="position: absolute; top: 12px; left: 50%; transform: translateX(-50%); width: calc(100% - 24px); text-align: center; z-index: 5; background: rgba(0,0,0,0.6); backdrop-filter: blur(6px); padding: 8px 0; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                          <div style="font-size: 15px; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 1px;">Cashback</div>
                          <div style="font-size: 12px; color: var(--accent-gold); font-weight: 800;">{widgetsSource.cashbackProgress.level} - {widgetsSource.cashbackProgress.percentage}%</div>
                        </div>
                        <div style="position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); width: calc(100% - 24px); padding: 12px; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); z-index: 5; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
                          <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 6px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.5) inset;">
                            <div style="height: 100%; width: {widgetsSource.cashbackProgress.percentage}%; background: linear-gradient(90deg, #f5c842, #d97706); box-shadow: 0 0 10px #f5c842;"></div>
                          </div>
                          <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 10px; color: rgba(255,255,255,0.9); font-weight: 700;">
                            <span>{widgetsSource.cashbackProgress.points} pts</span>
                            <span style="color: var(--accent-gold); font-size: 11px;">{widgetsSource.cashbackProgress.nextLevel}</span>
                          </div>
                        </div>
                      </button>
                    {:else if widgetsSource.cashbackProgress.size === "l"}
                      <div
                        style="padding: 16px; background: {isDarkTheme ? 'linear-gradient(135deg, rgba(109,40,217,0.1), rgba(0,0,0,0.5))' : 'var(--bg-panel)'}; border: 1px solid {isDarkTheme ? (widgetsSource.cashbackProgress.borderColor || 'rgba(255,255,255,0.08)') : 'var(--border-color)'}; border-radius: 16px; box-shadow: {isDarkTheme ? 'none' : '0 4px 15px rgba(0,0,0,0.05)'};"
                      >
                        <div
                          style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;"
                        >
                          <div>
                            <div
                              style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; font-weight:700;"
                            >
                              Cashback
                            </div>
                            <div
                              style="font-size:13px; font-weight:900; color:{isDarkTheme ? '#94a3b8' : 'var(--text-main)'};"
                            >
                              {vipConfig?.levels?.[userLevel - 1]?.name || 'Membru'}
                            </div>
                          </div>
                          <div
                            style="font-size:18px; font-weight:900; color:var(--accent-gold);"
                          >
                            {userLevel * 2 + 10}%
                          </div>
                        </div>
                        <div
                          style="height:5px; background:{isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}; border-radius:5px; margin-bottom:8px; overflow:hidden;"
                        >
                          <div
                            style="height:100%; width:{xpPercentage}%; background:linear-gradient(90deg,var(--accent-gold),#fef08a); border-radius:5px; box-shadow: 0 0 10px rgba(234,179,8,0.5);"
                          ></div>
                        </div>
                        <div
                          style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted);"
                        >
                          <span>{userXP} puncte</span>
                          <span style="color:var(--accent-gold);">{vipConfig?.levels?.[userLevel]?.name || 'Max'} →</span>
                        </div>
                      </div>
                    {/if}
                  </div>
                {/if}

                <!-- LUCKY WHEEL WIDGET -->
                {#if isLoggedIn && widgetsSource?.luckyWheel?.enabled !== false}
                  <div
                    style="order:{(widgetsSource.widgetOrder||[]).indexOf('luckyWheel')>=0?(widgetsSource.widgetOrder||[]).indexOf('luckyWheel'):99}; flex: {widgetsSource.luckyWheel.size === 's' ? '0 1 calc(33.333% - 6px)' : widgetsSource.luckyWheel.size === 'm' ? '0 1 calc(50% - 4px)' : '1 1 100%'}; max-width: {widgetsSource.luckyWheel.size === 's' ? '80px' : widgetsSource.luckyWheel.size === 'm' ? '114px' : 'none'}; min-width: 0;"
                  >
                    {#if (widgetsSource?.luckyWheel?.shape || 'widget') === 'gamecard'}
                      <button
                        on:click|stopPropagation={spinSidebarWheel}
                        style="width: 100%; aspect-ratio: 3/4; padding: 0; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: linear-gradient(160deg, rgba(40,10,80,0.98), rgba(0,0,0,0.9)); box-shadow: 0 8px 24px rgba(0,0,0,0.5); position: relative; cursor: pointer; display: flex; flex-direction: column; align-items: stretch; transition: transform 0.2s;"
                        on:mouseover={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                        on:mouseout={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <div style="position: absolute; top: 12px; left: 0; width: 100%; text-align: center; z-index: 5;">
                          <div style="font-size: 16px; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 1px; text-shadow: 0 2px 10px rgba(0,0,0,0.8);">{widgetsSource.luckyWheel.title || "Roata Norocului"}</div>
                        </div>
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; aspect-ratio: 1; z-index: 2;">
                          <div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 12px solid #f5c842; z-index: 10; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));"></div>
                          <img src="/wheel.png" alt="Wheel" style="width: 100%; height: 100%; transform: rotate({wheelRotation}deg); transition: transform {wheelSpinning ? '3.5s' : '0s'} cubic-bezier(0.17,0.67,0.12,0.99); will-change: transform; display: block; filter: drop-shadow(0 0 20px rgba(245,200,66,0.3));" />
                        </div>
                        <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 16px; background: linear-gradient(to top, rgba(0,0,0,0.95), transparent); z-index: 5; text-align: center;">
                          <div style="padding: 10px; border-radius: 99px; background: linear-gradient(135deg, #f5c842, #d97706); color: #1a1200; font-weight: 900; font-size: 12px; box-shadow: 0 4px 15px rgba(245,200,66,0.4);">
                            {wheelSpinning ? "⏳ SE ROTEȘTE..." : (showWheelPrize ? `🎉 ${wheelPrize}` : "ÎNVÂRTE ACUM")}
                          </div>
                        </div>
                      </button>
                    {:else if widgetsSource.luckyWheel.size === "s"}
                      <button
                        on:click|stopPropagation={spinSidebarWheel}
                        style="width: 100%; height: 52px; padding: 6px 10px; border-radius: 12px; background: linear-gradient(135deg, rgba(109,40,217,0.15), rgba(0,0,0,0.5)); border: var(--widget-border); cursor: pointer; text-align: left; transition: all 0.3s; position: relative; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; align-items: center;"
                      >
                        <div
                          style="display: flex; align-items: center; gap: 8px; position: relative; z-index: 2; width: 100%;"
                        >
                          <div
                            style="width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(245,200,66,0.3); flex-shrink: 0; position: relative; overflow: visible;"
                          >
                            <div
                              style="position:absolute; top:-3px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:3px solid transparent; border-right:3px solid transparent; border-top:6px solid #f5c842; z-index:10; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5));"
                            ></div>
                            <img
                              src="/wheel.png"
                              alt="Wheel"
                              style="width:100%; height:100%; transform: rotate({wheelRotation}deg); transition: transform {wheelSpinning
                                ? '3.5s'
                                : '0s'} cubic-bezier(0.17, 0.67, 0.12, 0.99); will-change: transform; display: block;"
                            />
                          </div>
                          <div style="flex: 1; min-width: 0;">
                            <div
                              style="font-size: 8px; font-weight: 800; color: var(--accent-gold); text-transform: uppercase; letter-spacing: 0.5px; line-height: 1;"
                            >
                              Roata Norocului
                            </div>
                            <div
                              style="font-size: 11px; font-weight: 900; color: #fff; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                            >
                              {wheelSpinning ? "Se rotește..." : (showWheelPrize ? `🎉 ${wheelPrize}` : "1 Rotire disponibilă")}
                            </div>
                          </div>
                        </div>
                      </button>
                    {:else if widgetsSource.luckyWheel.size === "m"}
                      <div style="padding: 14px; background: linear-gradient(135deg, rgba(109,40,217,0.12), rgba(0,0,0,0.4)); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; text-align: center;">
                        <div style="font-size:9px; color:#a78bfa; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Roata Norocului</div>
                        <div style="position:relative; width:100px; height:100px; margin: 0 auto 8px;">
                          <div style="position:absolute; top:-6px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:12px solid #f5c842; z-index:10; filter:drop-shadow(0 1px 3px rgba(0,0,0,0.6));"></div>
                            <img src="/wheel.png" alt="Wheel" style="width:100%; height:100%; transform: rotate({wheelRotation}deg); transition: transform {wheelSpinning ? '3.5s' : '0s'} cubic-bezier(0.17, 0.67, 0.12, 0.99); will-change: transform; display: block;" />
                        </div>
                        {#if showWheelPrize}
                          <div style="background: linear-gradient(135deg,#f5c842,#d97706); color:#1a1200; font-weight:900; font-size:10px; padding:4px 10px; border-radius:99px; margin-bottom:6px;">🎉 {wheelPrize}!</div>
                        {:else}
                          <div style="font-size:10px; color:var(--text-muted); margin-bottom:8px;">{wheelSpinning ? "Se rotește..." : "1 rotire disponibilă"}</div>
                        {/if}
                        <button
                          style="width:100%; padding:10px; border-radius:99px; background:{wheelSpinning ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#f5c842,#d97706)'}; color:{wheelSpinning ? 'var(--text-muted)' : '#1a1200'}; font-weight:900; font-size:12px; border:none; cursor:{wheelSpinning ? 'not-allowed' : 'pointer'}; transition: all 0.2s; letter-spacing:0.3px;"
                          on:click={spinSidebarWheel}
                        >{wheelSpinning ? "⏳ Se rotește..." : "ÎNVÂRTE"}</button>
                      </div>

                    {:else}
                      <div
                        style="padding: 20px 14px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; text-align: center;"
                      >
                        <div
                          style="font-size:10px; color:#a78bfa; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px;"
                        >
                          Roata Norocului
                        </div>
                        <div
                          style="position:relative; width:140px; height:140px; margin: 0 auto 10px;"
                        >
                          <div
                            style="position:absolute; top:-8px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:8px solid transparent; border-right:8px solid transparent; border-top:16px solid #f5c842; z-index:10; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));"
                          ></div>
                          <img
                            src="/wheel.png"
                            alt="Wheel"
                            style="width:100%; height:100%; transform: rotate({wheelRotation}deg); transition: transform {wheelSpinning
                              ? '3.5s'
                              : '0s'} cubic-bezier(0.17, 0.67, 0.12, 0.99); will-change: transform; display: block;"
                          />
                        </div>
                        {#if showWheelPrize}
                          <div
                            style="background: linear-gradient(135deg,#f5c842,#d97706); color:#1a1200; font-weight:900; font-size:12px; padding:6px 12px; border-radius:99px; margin-bottom:8px; animation: pulse 0.5s ease;"
                          >
                            🎉 Ai câștigat: {wheelPrize}!
                          </div>
                        {:else}
                          <div
                            style="font-size:10px; color:var(--text-muted); margin-bottom:10px;"
                          >
                            {wheelSpinning
                              ? "Se rotește..."
                              : "1 rotire disponibilă"}
                          </div>
                        {/if}
                        <button
                          style="width:100%; padding:8px; border-radius:99px; background:{wheelSpinning
                            ? 'rgba(255,255,255,0.1)'
                            : 'linear-gradient(135deg,#f5c842,#d97706)'}; color:{wheelSpinning
                            ? 'var(--text-muted)'
                            : '#1a1200'}; font-weight:900; font-size:12px; border:none; cursor:{wheelSpinning
                            ? 'not-allowed'
                            : 'pointer'}; transition: all 0.2s;"
                          on:click={spinSidebarWheel}
                          >{wheelSpinning
                            ? "⏳ Se rotește..."
                            : "ÎNVÂRTE"}</button
                        >
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </aside>
      {/if}

      <main
        class="content-area"
        on:scroll={handleContentScroll}
        bind:this={contentArea}
      >
        {#if searchQuery.trim() !== ""}
          <section class="category-row" style="padding-top: 24px; min-height: 100vh;">
            <div class="category-header">
              <h3>Rezultate Căutare pentru "{searchQuery}"</h3>
            </div>
            <div class="games-slider search-grid size-s">
              {#each filteredGames as game}
                {@const gEffect = getGameEffect(game.n, gameEffectsSource)}
                <div class="game-card {gEffect ? 'effect-' + gEffect.effect : ''}" style={gEffect ? `--effect-interval: ${gEffect.effectInterval || 5}s;` : ""} on:click={() => playGame(game)}>
                  <div class="img-wrapper">
                    <img src={game.img} alt={game.n} loading="lazy" />
                    <div class="game-hover-overlay">
                      <div class="play-btn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></div>
                      <div class="hover-details">
                        <span class="hover-prov">{game.p}</span>
                        {#if game.c && game.c.length > 0}<span class="hover-tag">{game.c[0]}</span>{/if}
                      </div>
                    </div>
                    <button class="btn-fav {favoriteGames.has(game.n) ? 'active' : ''}" on:click|stopPropagation={() => toggleFavorite(game.n)}>
                      <img src="/logoMobile.webp" alt="Fav" />
                    </button>
                  </div>
                  <div class="game-info">
                    <div class="g-name">{game.n}</div>
                    <div class="g-prov">{game.p}</div>
                  </div>
                </div>
              {/each}
            </div>
            {#if filteredGames.length === 0}
              <div style="padding: 40px 24px; text-align: center; color: var(--text-muted); font-size: 16px;">Niciun rezultat găsit.</div>
            {/if}
          </section>
        {:else if activeView.startsWith("preview_")}
          <div
            class="cms-isolated-preview"
            style="padding: 24px; min-height: 100vh; background: var(--bg-dark); display: flex; flex-direction: column; align-items: center; gap: 40px; width: 100%;"
          >
            {#if activeView === "preview_jackpot"}
              {#if jackpotFever2Source?.enabled}
                <div
                  style="width: 100%; display: flex; justify-content: center; margin-bottom: 20px;"
                >
                  <Fever2Widget
                    jp={animatedJackpots[0] || {}}
                    gaugeStyle={jackpotFever2Source.gaugeStyle}
                    extraAnimation={jackpotFever2Source.extraAnimation}
                    warpSpeedEffect={jackpotFever2Source.warpSpeedEffect}
                    warpDensity={jackpotFever2Source.warpDensity}
                    starfieldEffect={jackpotFever2Source.starfieldEffect}
                    starfieldDensity={jackpotFever2Source.starfieldDensity}
                  />
                </div>
              {/if}
              {#each animatedJackpots as heroJp}
                <section
                  class="jackpot-cards-section size-{heroJp.size?.toLowerCase() ||
                    'm'}"
                  style="width: 100%; max-width: 1200px; {heroJp.backgroundImage
                    ? `background-image: url('${heroJp.backgroundImage}'); background-size: cover;`
                    : ''}"
                >
                  <!-- Simplified internal jackpot render -->
                  <div class="jc-header">
                    {#if heroJp.logoUrl}<img
                        src={heroJp.logoUrl}
                        alt={heroJp.name}
                        class="jc-logo"
                        style="height: 60px;"
                      />{:else}<h2
                        style="color:var(--accent-gold); font-size:32px; font-style:italic;"
                      >
                        {heroJp.name}
                      </h2>{/if}
                  </div>
                  <div class="jc-tickers">
                    {#each heroJp.levels || [] as level}
                      <div
                        class="jc-ticker"
                        style="border-top-color: {level.color};"
                      >
                        <span class="suit" style="color: {level.color};"
                          >{level.icon}</span
                        >
                        <span class="val"
                          >{formatJP(level.value)}
                          <span class="curr">RON</span></span
                        >
                      </div>
                    {/each}
                  </div>
                </section>
              {/each}
            {:else if activeView === "preview_rtp"}
              <div style="width: 100%; max-width: 1200px;">
                <!-- RTP Widget simplified for preview -->
                <h2
                  style="color: var(--accent-gold); margin-bottom: 24px; text-align: center;"
                >
                  Vizu RTP (Hot / Cold)
                </h2>
                <div
                  style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;"
                >
                  <div
                    class="rtp-card hot"
                    style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); padding: 20px; border-radius: 12px;"
                  >
                    <h3 style="color:#10b981;">🔥 HOT GAMES</h3>
                    <div
                      style="height: 200px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-top: 10px; display: flex; align-items: center; justify-content: center;"
                    >
                      [Lista Jocuri Hot]
                    </div>
                  </div>
                  <div
                    class="rtp-card cold"
                    style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); padding: 20px; border-radius: 12px;"
                  >
                    <h3 style="color:#3b82f6;">❄️ COLD GAMES</h3>
                    <div
                      style="height: 200px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-top: 10px; display: flex; align-items: center; justify-content: center;"
                    >
                      [Lista Jocuri Cold]
                    </div>
                  </div>
                </div>
              </div>
            {:else if activeView === "preview_banners"}
              <div style="width: 100%; max-width: 1200px;">
                <h2
                  style="color: var(--accent-gold); margin-bottom: 24px; text-align: center;"
                >
                  Bannere Hero
                </h2>
                <div
                  class="banners-grid-preview"
                  style="display: grid; gap: 20px;"
                >
                  {#each bannersConfig.items as b}
                    <div
                      style="background: #222; border-radius: 12px; height: 120px; display: flex; align-items: center; padding: 20px; gap: 20px;"
                    >
                      <img
                        src={b.img}
                        alt="Banner"
                        style="height: 100%; border-radius: 8px;"
                      />
                      <div>
                        <div style="font-weight: 800;">{b.title}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">
                          {b.subtitle}
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {:else if activeView === "preview_promo"}
              <div style="width: 100%; max-width: 1200px;">
                <h2
                  style="color: var(--accent-gold); margin-bottom: 24px; text-align: center;"
                >
                  Promo Banner Preview
                </h2>
                {#each promoConfig as promo}
                  <section
                    class="promo-banner"
                    style="background-image: url('{promo.backgroundImage}'); height: 200px; border-radius: 16px; margin-bottom: 20px;"
                  >
                    <!-- Internal promo render -->
                    <div style="padding: 40px;">
                      <h2 style="color: #fff;">{promo.title}</h2>
                      <p style="color: rgba(255,255,255,0.7);">
                        {promo.subtitle}
                      </p>
                    </div>
                  </section>
                {/each}
              </div>
            {:else if activeView === "preview_categories"}
              <div style="width: 100%; max-width: 1200px;">
                <h2
                  style="color: var(--accent-gold); margin-bottom: 24px; text-align: center;"
                >
                  Categorii & Layout
                </h2>
                <div
                  style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;"
                >
                  {#each categoriesSource.filter((c) => c.showOnPage) as cat}
                    <div
                      style="background: rgba(255,255,255,0.05); padding: 10px 20px; border-radius: 99px; border: 1px solid var(--accent-gold);"
                    >
                      {cat.icon || ""}
                      {cat.name}
                    </div>
                  {/each}
                </div>
              </div>
            {:else if activeView === "preview_grid"}
              <div style="width: 100%; max-width: 1200px;">
                <h2
                  style="color: var(--accent-gold); margin-bottom: 24px; text-align: center;"
                >
                  Vizu Grid Jocuri
                </h2>
                <div
                  class="games-slider"
                  style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 20px;"
                >
                  {#each GAMES.slice(0, 8) as game}
                    <div class="game-card">
                      <img
                        src={game.img}
                        alt={game.n}
                        style="width: 100%; border-radius: 12px;"
                      />
                      <div style="font-size: 11px; margin-top: 8px;">
                        {game.n}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {:else if activeView === "preview_winners"}
              <div
                style="width: 100%; max-width: 1200px; background: #111; padding: 40px; border-radius: 16px;"
              >
                <h2
                  style="color: var(--accent-gold); margin-bottom: 24px; text-align: center;"
                >
                  Top Câștigători Marquee
                </h2>
                <div
                  style="background: var(--bg-dark); padding: 12px; border-radius: 99px; overflow: hidden; border: 1px solid var(--accent-gold);"
                >
                  <div
                    style="display: flex; gap: 30px; animation: marquee 20s linear infinite;"
                  >
                    {#each liveWinners as w}
                      <span style="white-space: nowrap; font-weight: 700;"
                        >{w.name} - {w.amount} RON</span
                      >
                    {/each}
                  </div>
                </div>
              </div>
            {:else if activeView === "preview_top10"}
              <div style="width: 100%; max-width: 1200px;">
                <h2
                  style="color: var(--accent-gold); margin-bottom: 24px; text-align: center;"
                >
                  Top 10 Păcănele (Netflix Style)
                </h2>
                <div
                  style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; padding: 20px;"
                >
                  {#each topGamesConfig.games.slice(0, 5) as tg, i}
                    <div style="position: relative; min-width: 160px;">
                      <span
                        style="position: absolute; left: -10px; bottom: -10px; font-size: 80px; font-weight: 900; color: rgba(255,255,255,0.1); font-style: italic;"
                        >{i + 1}</span
                      >
                      <div
                        style="background: #222; border-radius: 12px; height: 220px;"
                      ></div>
                    </div>
                  {/each}
                </div>
              </div>
            {:else if activeView === "preview_sidebar"}
              <div style="width: 100%; max-width: 1200px;">
                <h2
                  style="color: var(--accent-gold); margin-bottom: 24px; text-align: center;"
                >
                  Sidebar Navigation Preview
                </h2>
                <div
                  style="background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 16px; width: 220px; margin: 0 auto; padding: 10px; display: flex; flex-direction: column; gap: 4px;"
                >
                  {#each sidebarNavSource.items.filter((i) => i.enabled) as item}
                    <div
                      style="padding: 10px; display: flex; {item.shape ===
                      'round'
                        ? 'flex-direction:column; align-items:center;'
                        : 'align-items:center;'} gap: 10px; color: var(--text-main); font-size: 13px; {item.shape ===
                      'card'
                        ? 'background:rgba(255,255,255,0.05); border-radius:12px; margin:2px;'
                        : ''}"
                    >
                      <div
                        style={item.shape === "round"
                          ? "width:40px; height:40px; border-radius:50%; border:1px solid var(--accent-gold); display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.3);"
                          : ""}
                      >
                        {#if item.icon && (item.icon.startsWith("http") || item.icon.startsWith("data:"))}
                          <img src={item.icon} alt="i" style="height:20px;" />
                        {:else}
                          <span>{item.icon}</span>
                        {/if}
                      </div>
                      <span
                        style={item.shape === "round"
                          ? "font-size:10px; font-weight:800; color:var(--accent-gold);"
                          : item.shape === "card"
                            ? "font-weight:900;"
                            : ""}>{item.label}</span
                      >
                    </div>
                  {/each}
                </div>
              </div>
            {:else if activeView === "preview_widgets"}
              <div style="width: 100%; max-width: 1200px;">
                <h2
                  style="color: var(--accent-gold); margin-bottom: 24px; text-align: center;"
                >
                  Header & Sidebar Widgets
                </h2>
                <div
                  style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;"
                >
                  <div
                    style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 16px;"
                  >
                    <h3 style="font-size: 14px; margin-bottom: 10px;">
                      HEADER AREA
                    </h3>
                    <div style="display: flex; gap: 10px;">
                      <button
                        class="btn-gold"
                        style="padding: 6px 16px; font-size: 11px;"
                        >{widgetsSource.depositButton.label}</button
                      >
                      {#if widgetsSource.notificationBell.enabled}<div
                          style="width: 32px; height: 32px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center;"
                        >
                          🔔
                        </div>{/if}
                    </div>
                  </div>
                  <div
                    style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 16px;"
                  >
                    <h3 style="font-size: 14px; margin-bottom: 10px;">
                      SIDEBAR AREA
                    </h3>
                    <div
                      style="display: flex; flex-direction: column; gap: 10px;"
                    >
                      {#if widgetsSource.cashbackProgress.enabled}<div
                          style="height: 40px; background: #333; border-radius: 8px; padding: 10px; font-size: 11px;"
                        >
                          📊 Cashback Progress
                        </div>{/if}
                      {#if widgetsSource.luckyWheel.enabled}<div
                          style="height: 40px; background: #333; border-radius: 8px; padding: 10px; font-size: 11px;"
                        >
                          Lucky Wheel
                        </div>{/if}
                    </div>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {:else if activeView === "playarena"}
          <PlayArena
            {activeView}
            config={playArenaConfig}
            userAvatar={vipConfig?.levels?.find(l => l.id === userLevel)?.img}
            on:navigate={(e) => setView(e.detail.view)}
          />
        {:else if activeView === "vip"}
          <section class="vip-page-wrapper">
            <div class="bubbles-bg">
              {#each Array(30) as _, i}
                <div
                  class="bubble-item"
                  style="left: {Math.random() *
                    100}%; animation-delay: {Math.random() *
                    5}s; width: {Math.random() * 15 +
                    5}px; height: {Math.random() * 15 + 5}px;"
                ></div>
              {/each}
            </div>

            <div class="vip-content-container">
              <div class="vip-hero-box-container">
                <div class="vip-hero-box">
                  <h1 class="vip-hero-title">CASHPOT VIP CLUB</h1>
                  <p class="vip-hero-subtitle">Progresează jucând ca să meriți nivelele superioare</p>
                </div>
              </div>

              <div class="vip-steps-container">
                {#each vipConfig.levels as level, i}
                  <div
                    class="vip-step-item {isLoggedIn && i + 1 === userLevel
                      ? 'item-active'
                      : 'item-inactive'}"
                  >
                    <div
                      class="vip-step-card level-{i + 1} {isLoggedIn && i + 1 === userLevel
                        ? 'active-current-level'
                        : ''} {i === vipConfig.levels.length - 1 ? 'active-maxim' : ''}"
                      style="background: {level.bgColor};"
                    >
                      {#if i === vipConfig.levels.length - 1}
                        <div class="maxim-tag">MAXIM</div>
                      {/if}

                      {#if level.img && (level.img.includes("/") || level.img.includes("data:image"))}
                        <img
                          src={level.img}
                          alt={level.name}
                          class="vip-card-bg-img"
                        />
                      {:else}
                        <div class="step-image">{level.img || ""}</div>
                      {/if}

                      {#if isLoggedIn}
                        {#if i + 1 === userLevel}
                          <div class="active-level-indicator">NIVELUL TĂU</div>
                        {:else if i + 1 < userLevel}
                          <div class="level-status-badge completed">
                            FINALIZAT
                          </div>
                        {:else}
                          <div class="level-status-badge upcoming">URMEAZĂ</div>
                        {/if}
                      {:else}
                        <div class="level-status-badge upcoming">URMEAZĂ</div>
                      {/if}
                    </div>

                    <div class="vip-step-info-under">
                      <div class="vsi-top">
                        <span class="vsi-name">{level.name}</span>
                        <span class="vsi-lvl">Nivel {i + 1}</span>
                      </div>
                      {#if level.benefits && level.benefits.length > 0}
                        <div class="vsi-benefits">
                          {#each level.benefits as benefit}
                            <div class="benefit-item">
                              <span class="benefit-icon">✓</span>
                              <span class="benefit-text">{benefit}</span>
                            </div>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>

              {#if isLoggedIn}
                <!-- Global Ocean Progress Bar -->
                <div class="vip-global-progress-wrapper">
                  <div class="ocean-progress-labels">
                    <span>STADIUL TĂU VIP</span>
                    <span class="highlight-val"
                      >{xpPercentage}% spre Nivel {userLevel + 1}</span
                    >
                  </div>

                  <div class="ocean-progress-bar-container" style="position: relative; padding: 10px 0;">
                    <div class="ocean-track">
                      <div
                        class="ocean-fill"
                        style="width: {totalProgressPercentage}%"
                      >
                        <div class="ocean-wave"></div>
                        <div class="ocean-bubbles">
                          {#each Array(10) as _, i}
                            <div
                              class="bubble"
                              style="--left: {Math.random() *
                                100}%; --size: {4 +
                                Math.random() * 6}px; --duration: {2 +
                                Math.random() *
                                  3}s; animation-delay: {Math.random() * 5}s;"
                            ></div>
                          {/each}
                        </div>
                      </div>

                      <!-- Level Markers -->
                      <div class="level-markers">
                        {#each vipConfig.levels as lvl, idx}
                          <div
                            class="marker {userLevel > idx
                              ? 'completed'
                              : userLevel === idx + 1
                                ? 'current'
                                : ''}"
                          >
                            <div class="marker-dot"></div>
                            <span>Nivel {idx + 1}</span>
                          </div>
                        {/each}
                      </div>
                    </div>

                    {#if totalProgressPercentage > 2}
                      <!-- Floating Player Avatar (Round & Nested outside track to slide dynamically & overflow nicely) -->
                      <div class="fish-indicator" style="left: {totalProgressPercentage}%;">
                        <img src={currentLevelIcon} alt="Level Icon" />
                      </div>
                    {/if}
                  </div>
                </div>
              {/if}

              {#if !isLoggedIn}
                <div
                  style="margin-top: 50px; display: flex; justify-content: center;"
                >
                  <button
                    class="btn-vip-action-premium"
                    on:click={() => (showRegisterModal = true)}
                  >
                    Devino Membru VIP
                  </button>
                </div>
              {/if}

              <!-- VIP Rewards Grid -->
              {#if vipConfig.rewardsGrid && vipConfig.rewardsGrid.length > 0}
                <div class="vip-rewards-grid-container">
                  <h2 style="font-size: 2.2rem; color: #fff; text-align: left; margin: 30px 0 20px 20px; font-weight: 700;">Niveluri</h2>
                  <div class="vip-rewards-grid">
                    {#each vipConfig.rewardsGrid as level, i}
                      <div class="vip-reward-card">
                         <!-- CARD HEADER -->
                         <div class="vrc-header">
                           <div class="vrc-icon-box">
                             <img src={vipConfig.levels[i]?.img || '/koi_vip.png'} alt={level.levelName} />
                           </div>
                           <div class="vrc-header-info">
                             <h3>{level.levelName}</h3>
                             <p>{level.points}</p>
                           </div>
                         </div>
                         
                         <!-- CASHBACK BADGE -->
                         {#if level.cashback}
                           <div class="vrc-cashback-row">
                             <div class="vrc-cb-pill">
                               <span>Cashback</span>
                               <strong>{level.cashback}</strong>
                             </div>
                             <div class="vrc-cb-pill weekly">
                               <strong>CASHBACK SĂPTĂMÂNAL</strong>
                             </div>
                           </div>
                         {/if}

                         <!-- BONUSES -->
                         {#if level.bonuses && level.bonuses.length > 0}
                           <div class="vrc-bonuses">
                             {#each level.bonuses as bonus}
                               {@const bonusGame = (GAMES || []).find(g => g.n === bonus.game)}
                               <div class="vrc-bonus-item">
                                 <img src={bonusGame?.img || vipConfig.levels[i]?.img || '/koi_vip.png'} class="vrc-bonus-icon" alt={bonus.game} />
                                 <div class="vrc-bonus-details">
                                   <div class="vrc-bd-amount">{bonus.amount}</div>
                                   <div class="vrc-bd-game">{bonus.game}</div>
                                   <div class="vrc-bd-req">Depunere minima: {bonus.minDeposit}</div>
                                   {#if bonus.maxBonus}<div class="vrc-bd-req">Suma maxima a bonusului: {bonus.maxBonus}</div>{/if}
                                   {#if bonus.bet}<div class="vrc-bd-req">Pariu: {bonus.bet}</div>{/if}
                                 </div>
                               </div>
                             {/each}
                           </div>
                         {/if}
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}

            </div>
          </section>
        {:else}
          <!-- Hero Banners -->
          <div style="order:{pco.indexOf('heroBanners')>=0?pco.indexOf('heroBanners'):-1};">
          <section class="hero-section" style="position: relative;">
            <div
              class="hero-grid"
              style={bannersConfig.layout === "1_big_2_small"
                ? ""
                : "display: block;"}
            >
              <!-- VISUAL EDITOR HOTSPOT: BANNERS -->
              {#if isVisualCMSActive}
                <div
                  class="visual-hotspot"
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 2px solid transparent; pointer-events: none; z-index: 10; border-radius: 20px; transition: all 0.3s; cursor: pointer;"
                ></div>
                <button
                  class="visual-edit-btn"
                  on:click={() => {
                    isPreviewMode.set(true);
                  }}
                  style="position: absolute; top: 20px; right: 20px; z-index: 20; background: var(--accent-gold); color: #000; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0; transform: scale(0.8); transition: all 0.3s; cursor: pointer; pointer-events: auto; box-shadow: 0 10px 20px rgba(0,0,0,0.3);"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    width="16"
                    height="16"
                    ><path d="M12 20h9" /><path
                      d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
                    /></svg
                  >
                </button>
              {/if}

              {#if bannersConfig.layout === "slider"}
                {@const activeItems = bannersConfig.items.filter(i => i.enabled !== false && (i.position === 'general' || !i.position))}
                {#if activeItems.length > 0}
                  <div class="banner-slider-container" style="width: 100%; position: relative; overflow: hidden; border-radius: var(--card-radius); border: 1px solid rgba(255, 255, 255, 0.1); min-height: 400px; display: flex;">
                    {#each activeItems as slide, idx}
                      <div class="banner banner-large" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: {idx === slidersState.general ? '1' : '0'}; transition: opacity 0.8s ease-in-out; z-index: {idx === slidersState.general ? '2' : '1'};">
                        {#if slide.image}
                          {#if slide.image.includes('data:video/') || slide.image.endsWith('.mp4') || slide.image.endsWith('.webm') || slide.image.endsWith('.mov')}
                            <!-- svelte-ignore a11y-media-has-caption -->
                            <video
                              src={slide.image}
                              class="banner-bg"
                              autoplay
                              loop
                              muted
                              playsinline
                              style="object-fit: cover; width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 1;"
                            ></video>
                          {:else}
                            <img src={slide.image} class="banner-bg" alt="Banner Slide" />
                          {/if}
                        {/if}
                        <div class="banner-content ${(slide.tag && slide.tag.trim() !== '') || (slide.title && slide.title.trim() !== '') || (slide.subtitle && slide.subtitle.trim() !== '') || (slide.showButton && slide.buttonText && slide.buttonText.trim() !== '') ? '' : 'hide-banner-bg'}" style="color: {slide.textColor};">
                          {#if slide.tag}<span class="banner-tag">{slide.tag}</span>{/if}
                          <h2 style="color: {slide.textColor}; {slide.titleSize ? `font-size: ${slide.titleSize};` : ''}">{slide.title}</h2>
                          <p style="color: {slide.textColor}; opacity: 0.9; {slide.subtitleSize ? `font-size: ${slide.subtitleSize};` : ''}">{slide.subtitle}</p>
                          {#if slide.showButton}
                            <button class="btn-gold" style="background: {slide.buttonColor}; color: {slide.buttonTextColor}; border: {slide.buttonBorderWidth || 0}px solid {slide.buttonBorderColor || 'transparent'};">
                              {slide.buttonText}
                            </button>
                          {/if}
                        </div>
                      </div>
                    {/each}
                    {#if activeItems.length > 1}
                    <div class="slider-dots" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 10;">
                      {#each activeItems as _, idx}
                        <button on:click={() => (slidersState.general = idx)} style="width: 12px; height: 12px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.8); background: {idx === slidersState.general ? '#fff' : 'transparent'}; cursor: pointer; padding: 0; transition: all 0.3s;"></button>
                      {/each}
                    </div>
                    {/if}
                  </div>
                {/if}
              {:else if bannersConfig.layout === "1_big_2_small"}
                {@const bigItems = bannersConfig.items.filter(i => i.enabled !== false && i.position === 'big')}
                {@const small1Items = bannersConfig.items.filter(i => i.enabled !== false && i.position === 'small_1')}
                {@const small2Items = bannersConfig.items.filter(i => i.enabled !== false && i.position === 'small_2')}
                
                {#if bigItems.length > 0}
                  <div class="banner-slider-container" style="width: 100%; position: relative; overflow: hidden; border-radius: var(--card-radius); border: 1px solid rgba(255, 255, 255, 0.1); display: flex;">
                    {#each bigItems as slide, idx}
                      <div class="banner banner-large" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: {idx === slidersState.big ? '1' : '0'}; transition: opacity 0.8s ease-in-out; z-index: {idx === slidersState.big ? '2' : '1'};">
                        {#if slide.image}
                          {#if slide.image.includes('data:video/') || slide.image.endsWith('.mp4') || slide.image.endsWith('.webm') || slide.image.endsWith('.mov')}
                            <!-- svelte-ignore a11y-media-has-caption -->
                            <video src={slide.image} class="banner-bg" autoplay loop muted playsinline style="object-fit: cover; width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 1;"></video>
                          {:else}
                            <img src={slide.image} class="banner-bg" alt="Welcome Banner" />
                          {/if}
                        {/if}
                        <div class="banner-content ${(slide.tag && slide.tag.trim() !== '') || (slide.title && slide.title.trim() !== '') || (slide.subtitle && slide.subtitle.trim() !== '') || (slide.showButton && slide.buttonText && slide.buttonText.trim() !== '') ? '' : 'hide-banner-bg'}" style="color: {slide.textColor};">
                          {#if slide.tag}<span class="banner-tag">{slide.tag}</span>{/if}
                          <h2 style="color: {slide.textColor}; {slide.titleSize ? `font-size: ${slide.titleSize};` : ''}">{slide.title}</h2>
                          <p style="color: {slide.textColor}; opacity: 0.9; {slide.subtitleSize ? `font-size: ${slide.subtitleSize};` : ''}">{slide.subtitle}</p>
                          {#if slide.showButton}
                            <button class="btn-gold" style="background: {slide.buttonColor}; color: {slide.buttonTextColor}; border: {slide.buttonBorderWidth || 0}px solid {slide.buttonBorderColor || 'transparent'};">{slide.buttonText}</button>
                          {/if}
                        </div>
                      </div>
                    {/each}
                    <div class="banner banner-large" style="opacity: 0; pointer-events: none;"></div>
                    {#if bigItems.length > 1}
                      <div class="slider-dots" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 10;">
                        {#each bigItems as _, idx}
                          <button on:click={() => (slidersState.big = idx)} style="width: 12px; height: 12px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.8); background: {idx === slidersState.big ? '#fff' : 'transparent'}; cursor: pointer; padding: 0; transition: all 0.3s;"></button>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/if}
                <div class="banner-stack">
                  {#if small1Items.length > 0}
                    <div class="banner-slider-container banner-small" style="position: relative; overflow: hidden; border-radius: var(--card-radius); border: 1px solid rgba(255, 255, 255, 0.1); width: 100%; height: 100%; min-height: 190px;">
                      {#each small1Items as slide, idx}
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: {idx === slidersState.small_1 ? '1' : '0'}; transition: opacity 0.8s ease-in-out; z-index: {idx === slidersState.small_1 ? '2' : '1'};">
                          {#if slide.image}
                            {#if slide.image.includes('data:video/') || slide.image.endsWith('.mp4') || slide.image.endsWith('.webm') || slide.image.endsWith('.mov')}
                              <!-- svelte-ignore a11y-media-has-caption -->
                              <video src={slide.image} class="banner-bg" autoplay loop muted playsinline style="object-fit: cover; width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 1;"></video>
                            {:else}
                              <img src={slide.image} alt="Promo" class="banner-bg" style="object-position: center;" />
                            {/if}
                          {/if}
                          <div class="banner-content ${(slide.tag && slide.tag.trim() !== '') || (slide.title && slide.title.trim() !== '') || (slide.subtitle && slide.subtitle.trim() !== '') || (slide.showButton && slide.buttonText && slide.buttonText.trim() !== '') ? '' : 'hide-banner-bg'}" style="color: {slide.textColor};">
                            {#if slide.tag && slide.tag.trim() !== ""}<span class="banner-tag">{slide.tag}</span>{/if}
                            {#if slide.title && slide.title.trim() !== ""}<h3 style="color: {slide.textColor}; {slide.titleSize ? `font-size: ${slide.titleSize};` : ''}">{slide.title}</h3>{/if}
                            {#if slide.subtitle && slide.subtitle.trim() !== ""}<p style="color: {slide.textColor}; opacity: 0.9; {slide.subtitleSize ? `font-size: ${slide.subtitleSize};` : ''}">{slide.subtitle}</p>{/if}
                            {#if slide.showButton && slide.buttonText && slide.buttonText.trim() !== ""}<button class="btn-gold" style="padding: 6px 12px; font-size: 12px; margin-top: 8px; background: {slide.buttonColor}; color: {slide.buttonTextColor}; border: {slide.buttonBorderWidth || 0}px solid {slide.buttonBorderColor || 'transparent'};">{slide.buttonText}</button>{/if}
                          </div>
                        </div>
                      {/each}
                      <div class="banner banner-small" style="opacity: 0; pointer-events: none; min-height: 190px;"></div>
                      {#if small1Items.length > 1}
                        <div class="slider-dots" style="position: absolute; bottom: 10px; right: 10px; display: flex; gap: 6px; z-index: 10;">
                          {#each small1Items as _, idx}
                            <button on:click={() => (slidersState.small_1 = idx)} style="width: 8px; height: 8px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.8); background: {idx === slidersState.small_1 ? '#fff' : 'transparent'}; cursor: pointer; padding: 0; transition: all 0.3s;"></button>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/if}
                  {#if small2Items.length > 0}
                    <div class="banner-slider-container banner-small" style="position: relative; overflow: hidden; border-radius: var(--card-radius); border: 1px solid rgba(255, 255, 255, 0.1); width: 100%; height: 100%; min-height: 190px;">
                      {#each small2Items as slide, idx}
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: {idx === slidersState.small_2 ? '1' : '0'}; transition: opacity 0.8s ease-in-out; z-index: {idx === slidersState.small_2 ? '2' : '1'};">
                          {#if slide.image}
                            {#if slide.image.includes('data:video/') || slide.image.endsWith('.mp4') || slide.image.endsWith('.webm') || slide.image.endsWith('.mov')}
                              <!-- svelte-ignore a11y-media-has-caption -->
                              <video src={slide.image} class="banner-bg" autoplay loop muted playsinline style="object-fit: cover; width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 1;"></video>
                            {:else}
                              <img src={slide.image} alt="Promo" class="banner-bg" style="object-position: center;" />
                            {/if}
                          {/if}
                          <div class="banner-content ${(slide.tag && slide.tag.trim() !== '') || (slide.title && slide.title.trim() !== '') || (slide.subtitle && slide.subtitle.trim() !== '') || (slide.showButton && slide.buttonText && slide.buttonText.trim() !== '') ? '' : 'hide-banner-bg'}" style="color: {slide.textColor};">
                            {#if slide.tag && slide.tag.trim() !== ""}<span class="banner-tag">{slide.tag}</span>{/if}
                            {#if slide.title && slide.title.trim() !== ""}<h3 style="color: {slide.textColor}; {slide.titleSize ? `font-size: ${slide.titleSize};` : ''}">{slide.title}</h3>{/if}
                            {#if slide.subtitle && slide.subtitle.trim() !== ""}<p style="color: {slide.textColor}; opacity: 0.9; {slide.subtitleSize ? `font-size: ${slide.subtitleSize};` : ''}">{slide.subtitle}</p>{/if}
                            {#if slide.showButton && slide.buttonText && slide.buttonText.trim() !== ""}<button class="btn-gold" style="padding: 6px 12px; font-size: 12px; margin-top: 8px; background: {slide.buttonColor}; color: {slide.buttonTextColor}; border: {slide.buttonBorderWidth || 0}px solid {slide.buttonBorderColor || 'transparent'};">{slide.buttonText}</button>{/if}
                          </div>
                        </div>
                      {/each}
                      <div class="banner banner-small" style="opacity: 0; pointer-events: none; min-height: 190px;"></div>
                      {#if small2Items.length > 1}
                        <div class="slider-dots" style="position: absolute; bottom: 10px; right: 10px; display: flex; gap: 6px; z-index: 10;">
                          {#each small2Items as _, idx}
                            <button on:click={() => (slidersState.small_2 = idx)} style="width: 8px; height: 8px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.8); background: {idx === slidersState.small_2 ? '#fff' : 'transparent'}; cursor: pointer; padding: 0; transition: all 0.3s;"></button>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/if}
                </div>
              {:else if bannersConfig.layout === "4_medium"}
                <div
                  class="banner-grid-dynamic"
                  style="gap: 12px; width: 100%;"
                >
                  {#each [0, 1, 2, 3] as idx}
                    {#if bannersConfig.items[idx] && bannersConfig.items[idx].enabled !== false}
                      <div
                        class="banner banner-small"
                        style="min-height: 260px; padding: 16px;"
                      >
                        {#if bannersConfig.items[idx].image}
                          {#if bannersConfig.items[idx].image.includes('data:video/') || bannersConfig.items[idx].image.endsWith('.mp4') || bannersConfig.items[idx].image.endsWith('.webm') || bannersConfig.items[idx].image.endsWith('.mov')}
                            <!-- svelte-ignore a11y-media-has-caption -->
                            <video
                              src={bannersConfig.items[idx].image}
                              class="banner-bg"
                              autoplay
                              loop
                              muted
                              playsinline
                              style="object-fit: cover; width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 1;"
                            ></video>
                          {:else}
                            <img
                              src={bannersConfig.items[idx].image}
                              alt="Promo"
                              class="banner-bg"
                              style="object-position: center;"
                            />
                          {/if}
                        {/if}
                        <div
                          class="banner-content ${(bannersConfig.items[idx].tag && bannersConfig.items[idx].tag.trim() !== '') || (bannersConfig.items[idx].title && bannersConfig.items[idx].title.trim() !== '') || (bannersConfig.items[idx].subtitle && bannersConfig.items[idx].subtitle.trim() !== '') || (bannersConfig.items[idx].showButton && bannersConfig.items[idx].buttonText && bannersConfig.items[idx].buttonText.trim() !== '') ? '' : 'hide-banner-bg'}"
                          style="height: 100%; color: {bannersConfig.items[idx]
                            .textColor};"
                        >
                          {#if bannersConfig.items[idx].tag && bannersConfig.items[idx].tag.trim() !== ""}<span
                              class="banner-tag"
                              style="font-size: 9px;"
                              >{bannersConfig.items[idx].tag}</span
                            >{/if}
                          {#if bannersConfig.items[idx].title && bannersConfig.items[idx].title.trim() !== ""}<h3
                            style="line-height: 1.2; color: {bannersConfig
                              .items[idx].textColor}; {bannersConfig.items[idx]
                              .titleSize
                              ? `font-size: ${bannersConfig.items[idx].titleSize};`
                              : 'font-size: 1rem;'}"
                          >
                            {bannersConfig.items[idx].title}
                          </h3>{/if}
                          {#if bannersConfig.items[idx].subtitle && bannersConfig.items[idx].subtitle.trim() !== ""}<p
                            style="margin-bottom: 12px; line-height: 1.3; color: {bannersConfig
                              .items[idx]
                              .textColor}; opacity: 0.9; {bannersConfig.items[
                              idx
                            ].subtitleSize
                              ? `font-size: ${bannersConfig.items[idx].subtitleSize};`
                              : 'font-size: 11px;'}"
                          >
                            {bannersConfig.items[idx].subtitle}
                          </p>{/if}
                          {#if bannersConfig.items[idx].showButton && bannersConfig.items[idx].buttonText && bannersConfig.items[idx].buttonText.trim() !== ""}<button
                              class="btn-gold"
                              style="padding: 6px 12px; font-size: 11px; margin-top: auto; width: fit-content; background: {bannersConfig
                                .items[idx].buttonColor}; color: {bannersConfig
                                .items[idx]
                                .buttonTextColor}; border: {bannersConfig.items[
                                idx
                              ].buttonBorderWidth || 0}px solid {bannersConfig
                                .items[idx].buttonBorderColor ||
                                'transparent'};"
                              >{bannersConfig.items[idx].buttonText}</button
                            >{/if}
                        </div>
                      </div>
                    {/if}
                  {/each}
                </div>
              {:else if bannersConfig.layout === "4_small"}
                <div
                  class="banner-grid-dynamic"
                  style="gap: 16px; width: 100%;"
                >
                  {#each [0, 1, 2, 3] as idx}
                    {#if bannersConfig.items[idx] && bannersConfig.items[idx].enabled !== false}
                      <div
                        class="banner banner-small"
                        style="min-height: 200px;"
                      >
                        {#if bannersConfig.items[idx].image}
                          {#if bannersConfig.items[idx].image.includes('data:video/') || bannersConfig.items[idx].image.endsWith('.mp4') || bannersConfig.items[idx].image.endsWith('.webm') || bannersConfig.items[idx].image.endsWith('.mov')}
                            <!-- svelte-ignore a11y-media-has-caption -->
                            <video
                              src={bannersConfig.items[idx].image}
                              class="banner-bg"
                              autoplay
                              loop
                              muted
                              playsinline
                              style="object-fit: cover; width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 1;"
                            ></video>
                          {:else}
                            <img
                              src={bannersConfig.items[idx].image}
                              alt="Promo"
                              class="banner-bg"
                              style="object-position: center;"
                            />
                          {/if}
                        {/if}
                        <div
                          class="banner-content ${(bannersConfig.items[idx].tag && bannersConfig.items[idx].tag.trim() !== '') || (bannersConfig.items[idx].title && bannersConfig.items[idx].title.trim() !== '') || (bannersConfig.items[idx].subtitle && bannersConfig.items[idx].subtitle.trim() !== '') || (bannersConfig.items[idx].showButton && bannersConfig.items[idx].buttonText && bannersConfig.items[idx].buttonText.trim() !== '') ? '' : 'hide-banner-bg'}"
                          style="color: {bannersConfig.items[idx].textColor};"
                        >
                          {#if bannersConfig.items[idx].tag && bannersConfig.items[idx].tag.trim() !== ""}<span
                              class="banner-tag"
                              >{bannersConfig.items[idx].tag}</span
                            >{/if}
                          {#if bannersConfig.items[idx].title && bannersConfig.items[idx].title.trim() !== ""}<h3
                            style="color: {bannersConfig.items[idx]
                              .textColor}; {bannersConfig.items[idx].titleSize
                              ? `font-size: ${bannersConfig.items[idx].titleSize};`
                              : ''}"
                          >
                            {bannersConfig.items[idx].title}
                          </h3>{/if}
                          {#if bannersConfig.items[idx].subtitle && bannersConfig.items[idx].subtitle.trim() !== ""}<p
                            style="color: {bannersConfig.items[idx]
                              .textColor}; opacity: 0.9; {bannersConfig.items[
                              idx
                            ].subtitleSize
                              ? `font-size: ${bannersConfig.items[idx].subtitleSize};`
                              : ''}"
                          >
                            {bannersConfig.items[idx].subtitle}
                          </p>{/if}
                          {#if bannersConfig.items[idx].showButton && bannersConfig.items[idx].buttonText && bannersConfig.items[idx].buttonText.trim() !== ""}<button
                              class="btn-gold"
                              style="padding: 6px 12px; font-size: 12px; margin-top: 8px; background: {bannersConfig
                                .items[idx].buttonColor}; color: {bannersConfig
                                .items[idx]
                                .buttonTextColor}; border: {bannersConfig.items[
                                idx
                              ].buttonBorderWidth || 0}px solid {bannersConfig
                                .items[idx].buttonBorderColor ||
                                'transparent'};"
                              >{bannersConfig.items[idx].buttonText}</button
                            >{/if}
                        </div>
                      </div>
                    {/if}
                  {/each}
                </div>
              {:else if bannersConfig.layout === "2_big"}
                <div
                  style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; width: 100%;"
                >
                  {#each [0, 1] as idx}
                    {#if bannersConfig.items[idx] && bannersConfig.items[idx].enabled !== false}
                      <div
                        class="banner banner-large"
                        style="min-height: 280px;"
                      >
                        {#if bannersConfig.items[idx].image}
                          {#if bannersConfig.items[idx].image.includes('data:video/') || bannersConfig.items[idx].image.endsWith('.mp4') || bannersConfig.items[idx].image.endsWith('.webm') || bannersConfig.items[idx].image.endsWith('.mov')}
                            <!-- svelte-ignore a11y-media-has-caption -->
                            <video
                              src={bannersConfig.items[idx].image}
                              class="banner-bg"
                              autoplay
                              loop
                              muted
                              playsinline
                              style="object-fit: cover; width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 1;"
                            ></video>
                          {:else}
                            <img
                              src={bannersConfig.items[idx].image}
                              alt="Promo"
                              class="banner-bg"
                              style="object-position: center;"
                            />
                          {/if}
                        {/if}
                        <div
                          class="banner-content ${(bannersConfig.items[idx].tag && bannersConfig.items[idx].tag.trim() !== '') || (bannersConfig.items[idx].title && bannersConfig.items[idx].title.trim() !== '') || (bannersConfig.items[idx].subtitle && bannersConfig.items[idx].subtitle.trim() !== '') || (bannersConfig.items[idx].showButton && bannersConfig.items[idx].buttonText && bannersConfig.items[idx].buttonText.trim() !== '') ? '' : 'hide-banner-bg'}"
                          style="color: {bannersConfig.items[idx].textColor};"
                        >
                          {#if bannersConfig.items[idx].tag && bannersConfig.items[idx].tag.trim() !== ""}<span
                              class="banner-tag"
                              >{bannersConfig.items[idx].tag}</span
                            >{/if}
                          {#if bannersConfig.items[idx].title && bannersConfig.items[idx].title.trim() !== ""}<h3
                            style="color: {bannersConfig.items[idx]
                              .textColor}; {bannersConfig.items[idx].titleSize
                              ? `font-size: ${bannersConfig.items[idx].titleSize};`
                              : 'font-size: 1.8rem;'}"
                          >
                            {bannersConfig.items[idx].title}
                          </h3>{/if}
                          {#if bannersConfig.items[idx].subtitle && bannersConfig.items[idx].subtitle.trim() !== ""}<p
                            style="margin-bottom: 16px; color: {bannersConfig
                              .items[idx]
                              .textColor}; opacity: 0.9; {bannersConfig.items[
                              idx
                            ].subtitleSize
                              ? `font-size: ${bannersConfig.items[idx].subtitleSize};`
                              : 'font-size: 14px;'}"
                          >
                            {bannersConfig.items[idx].subtitle}
                          </p>{/if}
                          {#if bannersConfig.items[idx].showButton && bannersConfig.items[idx].buttonText && bannersConfig.items[idx].buttonText.trim() !== ""}<button
                              class="btn-gold"
                              style="background: {bannersConfig.items[idx]
                                .buttonColor}; color: {bannersConfig.items[idx]
                                .buttonTextColor}; border: {bannersConfig.items[
                                idx
                              ].buttonBorderWidth || 0}px solid {bannersConfig
                                .items[idx].buttonBorderColor ||
                                'transparent'};"
                              >{bannersConfig.items[idx].buttonText}</button
                            >{/if}
                        </div>
                      </div>
                    {/if}
                  {/each}
                </div>
              {/if}
            </div>
          </section>
          </div><!-- /heroBanners -->

          <!-- ─── PAGE CONTENT ORDERED SECTIONS ─── -->
          {@const pco = widgetsSource?.pageContentOrder || ['categoryTabs','topGames','tournament','missions','rtpWidget','gameCategories','jackpotFever']}
          <div style="display:flex; flex-wrap:wrap; flex-direction:row;">

          <!-- ─── CATEGORY TABS BAR (after hero) ─── -->
          <div class="cms-widget-wrapper" style="order:{pco.indexOf('categoryTabs')>=0?pco.indexOf('categoryTabs'):0}; --widget-w: {(widgetsSource?.categoryTabs?.size || '').toLowerCase() === 's' ? '33.333%' : (widgetsSource?.categoryTabs?.size || '').toLowerCase() === 'm' ? '50%' : '100%'};">
          {#if widgetsSource?.categoryTabs?.enabled !== false}
            {@const ctCfg = widgetsSource?.categoryTabs || {}}
            {@const ctShape = ctCfg.shape || 'round'}
            {@const ctSize = ctCfg.size || 'm'}
            {@const ctActiveBg = ctCfg.activeBg || 'linear-gradient(135deg,#6d28d9,#4c1d95)'}
            {@const ctActiveColor = ctCfg.activeColor || '#fff'}
            {@const ctInactiveColor = ctCfg.inactiveColor || 'rgba(255,255,255,0.5)'}
            {@const ctInactiveBg = ctShape === 'ghost' ? 'transparent' : (ctCfg.inactiveBg || 'rgba(255,255,255,0.06)')}
            {@const ctBorder = ctShape === 'ghost' ? '1px solid rgba(255,255,255,0.15)' : 'none'}
            {@const tabDefaultImages = {slots:'/cat_slots.png',live:'/cat_live_casino.png',jackpot:'/cat_jackpot.png',promo:'/cat_promotii.png',rtp:'/cat_live_rtp.png',sport:'/cat_sport.png',vip:'/cat_vip_club.png'}}
            {@const ctTabs = ctCfg.tabs?.length > 0 ? ctCfg.tabs : [
              { id: 'slots', label: 'Slots', icon: '🎰', image: '/cat_slots.png' },
              { id: 'live', label: 'Live Casino', icon: '🎥', image: '/cat_live_casino.png' },
              { id: 'jackpot', label: 'Jackpot', icon: '💎', image: '/cat_jackpot.png' },
              { id: 'promo', label: 'Promoții', icon: '🎁', image: '/cat_promotii.png' },
              { id: 'rtp', label: 'Live RTP', icon: '🔥', image: '/cat_live_rtp.png' },
              { id: 'sport', label: 'Sport', icon: '⚽', image: '/cat_sport.png' },
              { id: 'vip', label: 'VIP Club', icon: '👑', image: '/cat_vip_club.png' },
            ]}
            <!-- circle mode: icon-only circles with label below -->
            {#if ctShape === 'circle'}
              {@const cSize = ctSize === 's' ? 48 : ctSize === 'l' ? 72 : 58}
              {@const cFont = ctSize === 's' ? '18px' : ctSize === 'l' ? '28px' : '22px'}
              {@const cLabel = ctSize === 's' ? '9px' : ctSize === 'l' ? '12px' : '10px'}
              <div style="width:100%; padding: 16px 24px 4px; box-sizing:border-box;">
                <div class="cat-tabs-mobile-wrap" style="display:flex; gap:24px; flex-wrap:wrap; justify-content:center; align-items:flex-start;">
                  {#each ctTabs as tab}
                    {@const isActive = activeView === tab.id}
                    {@const tabImg = tab.image || tabDefaultImages[tab.id]}
                    <button
                      class="cat-tab-btn-circle"
                      on:click={() => setView(tab.id, '')}
                      style="display:flex; flex-direction:column; align-items:center; gap:5px; background:none; border:none; cursor:pointer; padding:0; min-width:{cSize}px;"
                    >
                      <div style="
                        width:{cSize}px; height:{cSize}px; border-radius:50%;
                        background:{tabImg ? 'transparent' : (isActive ? ctActiveBg : ctInactiveBg)};
                        box-shadow:{isActive ? '0 4px 14px rgba(109,40,217,0.55)' : 'none'};
                        transition:all 0.2s; overflow:hidden;
                        outline:{isActive ? '2px solid rgba(255,255,255,0.5)' : '2px solid rgba(255,255,255,0.10)'};
                      ">
                        {#if tabImg}
                          <img src={tabImg} alt={tab.label} style="width:100%; height:100%; object-fit:cover; display:block; transform: scale(1.45);" />
                        {:else}
                          <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:{isActive ? ctActiveBg : ctInactiveBg};">
                            <span style="font-size:{cFont}; line-height:1;">{tab.icon}</span>
                          </div>
                        {/if}
                      </div>
                      <span style="font-size:{cLabel}; font-weight:700; color:{isActive ? 'var(--cat-active-color)' : 'var(--cat-inactive-color)'}; text-align:center; line-height:1.2; white-space:nowrap;">{tab.label}</span>
                    </button>
                  {/each}
                </div>
              </div>
            {:else}
              <!-- pill or ghost mode -->
              {@const ctPadding = ctSize === 's' ? '6px 14px' : ctSize === 'l' ? '12px 28px' : '8px 20px'}
              {@const ctFontSize = ctSize === 's' ? '11px' : ctSize === 'l' ? '15px' : '13px'}
              {@const ctRadius = ctShape === 'round' ? '99px' : '10px'}
              <div style="width:100%; padding: 16px 24px 4px; box-sizing:border-box;">
                <div class="cat-tabs-mobile-wrap" style="display:flex; gap:16px; flex-wrap:wrap; justify-content:center;">
                  {#each ctTabs as tab}
                    {@const isActive = activeView === tab.id}
                    <button
                      class="cat-tab-btn-pill"
                      on:click={() => setView(tab.id, '')}
                      style="
                        display:flex; align-items:center; gap:6px;
                        padding:{ctPadding}; border-radius:{ctRadius};
                        font-size:{ctFontSize}; font-weight:700;
                        cursor:pointer; white-space:nowrap; transition:all 0.2s;
                        background:{isActive ? ctActiveBg : ctInactiveBg};
                        color:{isActive ? 'var(--cat-active-color)' : 'var(--cat-inactive-color)'};
                        border:{isActive ? 'none' : ctBorder};
                        box-shadow:{isActive ? '0 4px 12px rgba(109,40,217,0.35)' : 'none'};
                        overflow:hidden;
                      "
                      on:mouseover={(e) => { if (!isActive) { e.currentTarget.style.background='rgba(255,255,255,0.12)'; e.currentTarget.style.color='var(--cat-active-color)'; } }}
                      on:mouseout={(e) => { if (activeView !== tab.id) { e.currentTarget.style.background=ctInactiveBg; e.currentTarget.style.color='var(--cat-inactive-color)'; } }}
                    >
                      {#if (tab.image || tabDefaultImages[tab.id])}
                        <img src={tab.image || tabDefaultImages[tab.id]} alt="" style="width:18px; height:18px; object-fit:cover; border-radius:50%; flex-shrink:0;" />
                      {:else}
                        <span style="font-size:14px; line-height:1;">{tab.icon}</span>
                      {/if}
                      {tab.label}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          {/if}

          <!-- ─── TOURNAMENTS SECTION ─── -->
          </div>
          <div class="cms-widget-wrapper" style="order:{pco.indexOf('tournament')>=0?pco.indexOf('tournament'):2}; --widget-w: {(widgetsSource?.tournament?.size || '').toLowerCase() === 's' ? '33.333%' : (widgetsSource?.tournament?.size || '').toLowerCase() === 'm' ? '50%' : '100%'};">
          {#if activeView === "home" && widgetsSource?.tournament?.enabled !== false}
            <div style="padding: 0 24px 16px; height: 100%; box-sizing: border-box;">
              <div
                style="background: {isDarkTheme ? 'rgba(15,23,42,0.7)' : 'var(--bg-panel)'}; border: 1px solid {isDarkTheme ? 'rgba(255,255,255,0.07)' : 'var(--border-color)'}; border-radius: 20px; padding: 24px; backdrop-filter: blur(12px); box-shadow: {isDarkTheme ? 'none' : '0 8px 30px rgba(0,0,0,0.04)'}; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; position: relative; overflow: hidden;"
              >
                <div
                  style="position:absolute; top:-40px; right:-40px; width:200px; height:200px; background:radial-gradient(circle, rgba(109,40,217,0.3) 0%, transparent 70%); pointer-events:none;"
                ></div>
                <div
                  style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; position:relative; z-index:1;"
                >
                  <div>
                    <div
                      style="font-size:11px; color:#a78bfa; font-weight:700; text-transform:uppercase; letter-spacing:1px;"
                    >
                      <img src="/icons/pa_icon_tournaments.png" alt="turneu" style="height:14px; vertical-align:middle; margin-right:4px;" /> Turneu Activ
                    </div>
                    <h3
                      style="font-size:20px; font-weight:900; color:{isDarkTheme ? '#fff' : 'var(--text-main)'}; margin:4px 0 0; font-family: var(--font-condensed);"
                    >
                      Turneul Săptămânii
                    </h3>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:11px; color:{isDarkTheme ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)'};">
                      Premiu Total
                    </div>
                    <div
                      style="font-size:24px; font-weight:900; color:var(--accent-gold); font-family: var(--font-condensed);"
                    >
                      50.000 <span style="font-size:13px;">RON</span>
                    </div>
                  </div>
                </div>
                <div
                  style="display:flex; gap:10px; flex-wrap: wrap; padding-bottom:4px; position:relative; z-index:1; overflow: hidden; height: {(widgetsSource?.tournament?.size || '').toLowerCase() === 's' ? '124px' : '258px'};"
                >
                  {#each (GAMES || []).slice(0, 7) as game}
                    <div
                      style="flex-shrink:0; cursor:pointer; border-radius:10px; overflow:hidden; width:90px; position:relative; transition: transform 0.2s;"
                      on:click={() => setView("home")}
                      on:mouseover={(e) =>
                        (e.currentTarget.style.transform = "scale(1.05)")}
                      on:mouseout={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")}
                    >
                      <img
                        src={game.img}
                        alt={game.n}
                        style="width:90px; height:70px; object-fit:contain; display:block; background:rgba(0,0,0,0.3);"
                      />
                      <div
                        style="position:absolute; bottom:0; left:0; right:0; padding:3px 5px; background:linear-gradient(transparent,rgba(0,0,0,0.85)); font-size:8px; color:#fff; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                      >
                        {game.n}
                      </div>
                    </div>
                  {/each}
                </div>
                <button
                  style="margin-top:16px; width:100%; padding:10px; border-radius:99px; background:linear-gradient(135deg,#7c3aed,#4c1d95); color:#fff; font-weight:800; font-size:13px; border:none; cursor:pointer; letter-spacing:0.3px; position:relative; z-index:1; transition: all 0.2s;"
                  on:click={() => setView("promo")}
                  on:mouseover={(e) =>
                    (e.currentTarget.style.background =
                      "linear-gradient(135deg,#6d28d9,#3b0764)")}
                  on:mouseout={(e) =>
                    (e.currentTarget.style.background =
                      "linear-gradient(135deg,#7c3aed,#4c1d95)")}
                  >Participă la Turneu →</button
                >
              </div>
            </div>
          {/if}
          <!-- ─── MISIUNI ACTIVE ─── -->
          </div>
          <div class="cms-widget-wrapper" style="order:{pco.indexOf('missions')>=0?pco.indexOf('missions'):3}; --widget-w: {(widgetsSource?.missions?.size || '').toLowerCase() === 's' ? '33.333%' : (widgetsSource?.missions?.size || '').toLowerCase() === 'm' ? '50%' : '100%'};">
          {#if activeView === "home" && isLoggedIn && widgetsSource?.missions?.enabled !== false}
            <div style="padding: 0 24px 16px; height: 100%; box-sizing: border-box;">
              <div
                style="background: {isDarkTheme ? 'rgba(15,23,42,0.7)' : 'var(--bg-panel)'}; border: 1px solid {isDarkTheme ? 'rgba(255,255,255,0.07)' : 'var(--border-color)'}; border-radius: 20px; padding: 24px; backdrop-filter: blur(12px); box-shadow: {isDarkTheme ? 'none' : '0 8px 30px rgba(0,0,0,0.04)'}; height: 100%; box-sizing: border-box; display: flex; flex-direction: column;"
              >
                <div
                  style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;"
                >
                  <h3 style="font-size: 16px; font-weight: 900; color: {isDarkTheme ? '#fff' : 'var(--text-main)'}; margin: 0; font-family: var(--font-condensed); display: flex; align-items: center;">
                    <img src="/icons/pa_icon_missions.png" alt="misiuni" style="height:16px; margin-right:6px;" /> Misiuni Active
                  </h3>
                  <button
                    style="font-size:12px; color:#a78bfa; font-weight:700; background:none; border:none; cursor:pointer; padding:0;"
                    >Vezi toate →</button
                  >
                </div>
                <div style="display:flex; flex-direction:column; gap:12px; overflow: hidden; height: {(widgetsSource?.missions?.size || '').toLowerCase() === 's' ? '124px' : '258px'};">
                  <div
                    style="display:flex; align-items:center; gap:16px; background: {isDarkTheme ? 'rgba(255,255,255,0.03)' : 'var(--bg-hover)'}; border-radius:14px; padding:14px 16px; border:1px solid {isDarkTheme ? 'rgba(255,255,255,0.05)' : 'var(--border-color)'};"
                  >
                    <div
                      style="width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,#f59e0b,#d97706); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;"
                    >
                      🎰
                    </div>
                    <div style="flex:1; min-width:0;">
                      <div
                        style="font-size:13px; font-weight:700; color:var(--text-main); margin-bottom:4px;"
                      >
                        Misiune Zilnică
                      </div>
                      <div
                        style="font-size:11px; color:var(--text-muted); margin-bottom:6px;"
                      >
                        Petrece 100 RON în orice joc — 75/100
                      </div>
                      <div
                        style="height:4px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden;"
                      >
                        <div
                          style="height:100%; width:75%; background:linear-gradient(90deg,#f59e0b,#fcd34d); border-radius:4px;"
                        ></div>
                      </div>
                    </div>
                    <div style="text-align:right; flex-shrink:0;">
                      <div
                        style="font-size:16px; font-weight:900; color:#fcd34d;"
                      >
                        25
                      </div>
                      <div style="font-size:9px; color:var(--text-muted);">
                        puncte
                      </div>
                    </div>
                  </div>
                  <div
                    style="display:flex; align-items:center; gap:16px; background: {isDarkTheme ? 'rgba(255,255,255,0.03)' : 'var(--bg-hover)'}; border-radius:14px; padding:14px 16px; border:1px solid {isDarkTheme ? 'rgba(255,255,255,0.05)' : 'var(--border-color)'};"
                  >
                    <div
                      style="width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,#ef4444,#dc2626); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;"
                    >
                      🔥
                    </div>
                    <div style="flex:1; min-width:0;">
                      <div
                        style="font-size:13px; font-weight:700; color:var(--text-main); margin-bottom:4px;"
                      >
                        Streak 7 Zile
                      </div>
                      <div
                        style="font-size:11px; color:var(--text-muted); margin-bottom:6px;"
                      >
                        Joacă la Live Casino 7 zile la rând — 5/7
                      </div>
                      <div
                        style="height:4px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden;"
                      >
                        <div
                          style="height:100%; width:71%; background:linear-gradient(90deg,#ef4444,#f87171); border-radius:4px;"
                        ></div>
                      </div>
                    </div>
                    <div style="text-align:right; flex-shrink:0;">
                      <div
                        style="font-size:16px; font-weight:900; color:#f87171;"
                      >
                        150
                      </div>
                      <div style="font-size:9px; color:var(--text-muted);">
                        puncte
                      </div>
                    </div>
                  </div>
                  <div
                    style="display:flex; align-items:center; gap:16px; background: {isDarkTheme ? 'rgba(255,255,255,0.03)' : 'var(--bg-hover)'}; border-radius:14px; padding:14px 16px; border:1px solid {isDarkTheme ? 'rgba(109,40,217,0.2)' : 'var(--border-color)'};"
                  >
                    <div
                      style="width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,#7c3aed,#4c1d95); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;"
                    >
                      <img src="/icons/pa_icon_tournaments.png" alt="trophy" style="height:24px; object-fit:contain;" />
                    </div>
                    <div style="flex:1; min-width:0;">
                      <div
                        style="font-size:13px; font-weight:700; color:var(--text-main); margin-bottom:4px;"
                      >
                        Provocare Săptămânală
                      </div>
                      <div
                        style="font-size:11px; color:var(--text-muted); margin-bottom:6px;"
                      >
                        Câștigă 20 rotiri gratuite — 12/20
                      </div>
                      <div
                        style="height:4px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden;"
                      >
                        <div
                          style="height:100%; width:60%; background:linear-gradient(90deg,#7c3aed,#a78bfa); border-radius:4px;"
                        ></div>
                      </div>
                    </div>
                    <div style="text-align:right; flex-shrink:0;">
                      <div
                        style="font-size:16px; font-weight:900; color:#a78bfa;"
                      >
                        50
                      </div>
                      <div style="font-size:9px; color:var(--text-muted);">
                        puncte
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <!-- Jackpot Cards Section -->
          <div
            class="jackpots-wrapper"
            style="display: flex; flex-wrap: wrap; gap: 24px; width: 100%;"
          >
            <!-- IN-LINE TOOLBAR (After Hero) -->
            {#if toolbarSource.displayMode === "inline" && toolbarSource.inlinePosition === "after_hero"}
              <div
                style="width: 100%; display: flex; justify-content: center; margin: 8px 0;"
              >
                <ToolbarWidget
                  config={{ ...toolbarSource, position: "inline" }}
                  themeColors={themeColorsSource}
                  jackpots={animatedJackpots}
                  {activeView}
                  {lastPlayedGame}
                  {isLoggedIn}
                  {userBalance}
                  {loggedInUsername}
                  {widgetsSource}
                  isVisualEditor={isVisualCMSActive}
                  on:navigate={(e) =>
                    setView(e.detail.view, e.detail.query || "")}
                  on:wheel={() => setView("playarena", "", "wheel")}
                  on:random={triggerRandomGame}
                  on:play={(e) => playGame(e.detail.game)}
                  on:deposit={handleDeposit}
                  on:scrollToTop={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })}
                />
              </div>
            {/if}

            {#each animatedJackpots.filter((j) => j.position === "after_hero" && (isLoggedIn || j.showWhenLoggedOut)) as heroJp}
              {#if heroJp.showInFever2 && jackpotFever2Source?.enabled && jackpotFever2Source?.displayMode === "scattered"}
                <div
                  style="display: flex; justify-content: center; width: 100%; margin-bottom: 24px;"
                >
                  <Fever2Widget
                    jp={heroJp}
                    gaugeStyle={heroJp.style || jackpotFever2Source.gaugeStyle}
                    extraAnimation={jackpotFever2Source.extraAnimation}
                    warpSpeedEffect={jackpotFever2Source.warpSpeedEffect}
                    warpDensity={jackpotFever2Source.warpDensity}
                    starfieldEffect={jackpotFever2Source.starfieldEffect}
                    starfieldDensity={jackpotFever2Source.starfieldDensity}
                  />
                </div>
              {:else}
                <section
                  class="jackpot-cards-section size-{heroJp.size?.toLowerCase() ||
                    'm'}"
                  style={heroJp.backgroundImage
                    ? `background-image: url('${heroJp.backgroundImage}'); background-size: cover; background-position: center; opacity: 1;`
                    : ""}
                >
                  <div class="jc-header">
                    {#if heroJp.logoUrl}
                      <img
                        src={heroJp.logoUrl &&
                        heroJp.logoUrl.includes("cashpot.ro")
                          ? `/api/proxy/cashpot?url=${encodeURIComponent(heroJp.logoUrl)}`
                          : heroJp.logoUrl}
                        alt={heroJp.name}
                        class="jc-logo"
                        style="height: 60px; filter: drop-shadow(0 2px 10px rgba(0,0,0,0.5));"
                        on:error={(e) => {
                          if (e.currentTarget.src.includes("/api/proxy")) {
                            e.currentTarget.src = heroJp.logoUrl;
                          }
                        }}
                      />
                    {:else}
                      <h2
                        style="color: var(--accent-gold); font-size: 32px; font-style: italic; margin:0;"
                      >
                        {heroJp.name}
                      </h2>
                    {/if}
                  </div>
                  <div class="jc-tickers">
                    {#if heroJp.levels && heroJp.levels.length > 0}
                      {#each [...heroJp.levels] as level}
                        <div
                          class="jc-ticker {heroJp.animationType === 'hot'
                            ? 'jc-ticker-hot'
                            : heroJp.animationType === 'ocean'
                              ? 'jc-ticker-ocean'
                              : heroJp.animationType === 'neon'
                                ? 'jc-ticker-neon'
                                : ''}"
                          style="border-top-color: {level.color};"
                        >
                          {#if themeColorsSource.showJackpotIcons || themeColorsSource.showIcons}
                            <span class="suit" style="color: {level.color};"
                              >{level.icon}</span
                            >
                          {/if}

                          <span class="val"
                            >{formatJP(level.value)}
                            <span class="curr">RON</span></span
                          >
                        </div>
                      {/each}
                    {:else}
                      <div class="jc-ticker" style="border-top-color: #ef4444;">
                        <span class="val"
                          >{formatJP(372399.84)}
                          <span class="curr">RON</span></span
                        >
                      </div>
                    {/if}
                  </div>
                  {#if heroJp.size !== "S"}
                    <div class="jc-games-slider">
                      {#each (heroJp.type === "bell" ? [...GAMES.filter((g) => g.p === "Amusnet")].reverse() : GAMES.filter((g) => g.p === "Amusnet")).slice(0, 7) as game}
                        {@const gEffect = getGameEffect(
                          game.n,
                          gameEffectsSource,
                        )}
                        <div
                          class="game-card {gEffect
                            ? 'effect-' + gEffect.effect
                            : ''}"
                          style={gEffect
                            ? `--effect-interval: ${gEffect.effectInterval || 5}s;`
                            : ""}
                        >
                          <div class="img-wrapper">
                            <img
                              src={game.img}
                              alt={game.n}
                              loading="lazy"
                              on:error={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.parentElement.classList.add(
                                  "broken-img",
                                );
                              }}
                            />
                            <div class="img-placeholder">
                              <span class="placeholder-icon">$</span>
                            </div>
                            <div class="game-hover-overlay">
                              <div class="play-btn">
                                <svg viewBox="0 0 24 24" fill="currentColor"
                                  ><path d="M8 5v14l11-7z" /></svg
                                >
                              </div>
                              <div class="hover-details">
                                <span class="hover-prov">{game.p}</span>
                                {#if game.c && game.c.length > 0}
                                  <span class="hover-tag">{game.c[0]}</span>
                                {/if}
                              </div>
                            </div>
                            <button
                              class="btn-fav {favoriteGames.has(game.n)
                                ? 'active'
                                : ''}"
                              on:click={() => toggleFavorite(game.n)}
                            >
                              <img src="/logoMobile.webp" alt="Fav" />
                            </button>
                          </div>
                          <div class="game-info">
                            <div class="g-name">{game.n}</div>
                            <div class="g-prov">{game.p}</div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </section>
              {/if}
            {/each}
          </div>

          </div>
          <!-- Top Games Widget -->
          <div class="cms-widget-wrapper" style="order:{pco.indexOf('topGames')>=0?pco.indexOf('topGames'):1}; --widget-w: {(widgetsSource?.topGames?.size || '').toLowerCase() === 's' ? '33.333%' : (widgetsSource?.topGames?.size || '').toLowerCase() === 'm' ? '50%' : '100%'};">
          {#if topGamesConfig.enabled}
            <section class="top-games-section">
              <h2
                style="color: #fff; font-size: 24px; margin-bottom: 24px; font-weight: 800;"
              >
                {topGamesConfig.title}
              </h2>
              <div class="top-games-slider">
                {#each topGamesConfig.games as topGame, index}
                  {@const gObj = GAMES.find((g) => g.n === topGame.name) || {
                    img: "",
                    p: topGame.provider,
                  }}
                  <div class="top-game-card">
                    <div class="top-number">{index + 1}</div>
                    <img src={gObj.img} alt={topGame.name} class="top-img" />
                    <div class="top-badge">{topGame.provider}</div>
                  </div>
                {/each}
              </div>
            </section>
          {/if}

          </div>
          <!-- RTP Widget (Hot / Cold Games) -->
          <div class="cms-widget-wrapper" style="order:{pco.indexOf('rtpWidget')>=0?pco.indexOf('rtpWidget'):4}; --widget-w: {(widgetsSource?.rtpWidget?.size || '').toLowerCase() === 's' ? '33.333%' : (widgetsSource?.rtpWidget?.size || '').toLowerCase() === 'm' ? '50%' : '100%'};">
          {#if rtpConfig?.enabled}
            <section
              class="rtp-widget-section"
              style="width: 100%; display: flex; gap: 24px; margin-bottom: 32px; padding: 0 24px; box-sizing: border-box;"
            >
              <div
                class="rtp-card rtp-hot"
                style="flex: 1; min-width: 0; background: var(--bg-panel); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); padding: 24px; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);"
              >
                <div
                  style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; position: relative; z-index: 2;"
                >
                  <div>
                    <h3
                      style="font-size: 18px; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px;"
                    >
                      {#if rtpConfig.hotImage}
                        {#if rtpConfig.hotImage.startsWith('http') || rtpConfig.hotImage.startsWith('/')}
                          <img src={rtpConfig.hotImage} alt="Hot" style="height: 28px; width: auto; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(239,68,68,0.5));" />
                        {:else}
                          <span style="font-size: 24px; line-height: 1; filter: drop-shadow(0 4px 8px rgba(239,68,68,0.5));">{rtpConfig.hotImage}</span>
                        {/if}
                      {/if}
                      {rtpConfig.hotTitle}
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        ><circle cx="12" cy="12" r="10" /><path
                          d="M12 16v-4"
                        /><path d="M12 8h.01" /></svg
                      >
                    </h3>
                    <div
                      style="font-size: 13px; color: var(--text-muted); margin-top: 4px;"
                    >
                      {rtpConfig.hotSubtitle}
                    </div>
                  </div>
                  <a
                    href="#"
                    style="color: #fff; font-size: 13px; font-weight: 700; text-decoration: none; display: flex; align-items: center; white-space: nowrap;"
                    >Tot <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      style="margin-left: 2px;"><path d="M9 18l6-6-6-6" /></svg
                    ></a
                  >
                </div>


                <div
                  class="rtp-list"
                  style="display: flex; flex-direction: column; gap: 8px; position: relative; z-index: 2;"
                >
                  {#each liveHotGames.length > 0 ? liveHotGames : rtpConfig.hotGames || [] as game}
                    {@const gameObj =
                      GAMES.find((g) => g.n === game.name) || GAMES[0]}
                    <div
                      class="rtp-row"
                      style="display: flex; align-items: center; background: {isDarkTheme ? 'rgba(255,255,255,0.03)' : 'transparent'}; border-radius: 8px; padding: 8px 16px; border: 1px solid {isDarkTheme ? 'rgba(255,255,255,0.02)' : 'var(--border-color)'}; transition: background 0.2s; cursor: pointer;"
                      on:mouseover={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.08)")}
                      on:mouseout={(e) =>
                        (e.currentTarget.style.background = isDarkTheme ? 'rgba(255,255,255,0.03)' : 'transparent')}
                    >
                      <img
                        src={gameObj.img}
                        alt={game.name}
                        style="width: 48px; height: 32px; border-radius: 4px; object-fit: cover; margin-right: 16px; border: 1px solid rgba(255,255,255,0.1);"
                      />
                      <div style="flex: 1; min-width: 0;">
                        <div
                          style="color: var(--text-main); font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                        >
                          {game.name}
                        </div>
                        <div style="color: var(--text-muted); font-size: 11px;">
                          {game.provider}
                        </div>
                      </div>
                      <div
                        style="color: #f97316; font-weight: 800; font-size: 15px; display: flex; align-items: center; gap: 4px;"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          width="14"
                          height="14"
                          ><path
                            d="M17.5 10c0 4.14-3.36 7.5-7.5 7.5S2.5 14.14 2.5 10a7.5 7.5 0 0 1 15 0zm-7.5-5a2.5 2.5 0 0 0-2.5 2.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z"
                          /></svg
                        >
                        {game.rtp}%
                      </div>
                    </div>
                  {/each}
                </div>
              </div>

              <div
                class="rtp-card rtp-cold"
                style="flex: 1; min-width: 0; background: var(--bg-panel); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); padding: 24px; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);"
              >
                <div
                  style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; position: relative; z-index: 2;"
                >
                  <div>
                    <h3
                      style="font-size: 18px; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px;"
                    >
                      {#if rtpConfig.coldImage}
                        {#if rtpConfig.coldImage.startsWith('http') || rtpConfig.coldImage.startsWith('/')}
                          <img src={rtpConfig.coldImage} alt="Cold" style="height: 28px; width: auto; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(56,189,248,0.5));" />
                        {:else}
                          <span style="font-size: 24px; line-height: 1; filter: drop-shadow(0 4px 8px rgba(56,189,248,0.5));">{rtpConfig.coldImage}</span>
                        {/if}
                      {/if}
                      {rtpConfig.coldTitle}
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        ><circle cx="12" cy="12" r="10" /><path
                          d="M12 16v-4"
                        /><path d="M12 8h.01" /></svg
                      >
                    </h3>
                    <div
                      style="font-size: 13px; color: var(--text-muted); margin-top: 4px;"
                    >
                      {rtpConfig.coldSubtitle}
                    </div>
                  </div>
                  <a
                    href="#"
                    style="color: #fff; font-size: 13px; font-weight: 700; text-decoration: none; display: flex; align-items: center; white-space: nowrap;"
                    >Tot <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      style="margin-left: 2px;"><path d="M9 18l6-6-6-6" /></svg
                    ></a
                  >
                </div>


                <div
                  class="rtp-list"
                  style="display: flex; flex-direction: column; gap: 8px; position: relative; z-index: 2;"
                >
                  {#each liveColdGames.length > 0 ? liveColdGames : rtpConfig.coldGames || [] as game}
                    {@const gameObj =
                      GAMES.find((g) => g.n === game.name) || GAMES[0]}
                    <div
                      class="rtp-row"
                      style="display: flex; align-items: center; background: rgba(255,255,255,0.03); border-radius: 8px; padding: 8px 16px; border: 1px solid rgba(255,255,255,0.02); transition: background 0.2s; cursor: pointer;"
                      on:mouseover={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.08)")}
                      on:mouseout={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.03)")}
                    >
                      <img
                        src={gameObj.img}
                        alt={game.name}
                        style="width: 48px; height: 32px; border-radius: 4px; object-fit: cover; margin-right: 16px; border: 1px solid rgba(255,255,255,0.1);"
                      />
                      <div style="flex: 1; min-width: 0;">
                        <div
                          style="color: #fff; font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                        >
                          {game.name}
                        </div>
                        <div style="color: var(--text-muted); font-size: 11px;">
                          {game.provider}
                        </div>
                      </div>
                      <div
                        style="color: #38bdf8; font-weight: 800; font-size: 15px; display: flex; align-items: center; gap: 4px;"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          width="14"
                          height="14"
                          ><path
                            d="M12 2v20M17 5l-10 14M22 12H2M19 17L5 7"
                          /></svg
                        >
                        {game.rtp}%
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </section>
          {/if}
          </div>
          
          <!-- Top Promos (Index 0) -->
          <div style="order:{pco.indexOf('categoryTabs')>=0?pco.indexOf('categoryTabs'):0}; width: 100%;">
          {#each promoConfig.filter((p) => p.enabled && p.positionIndex === 0) as promo}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <section
              class="promo-banner-section size-{promo.size?.toLowerCase() ||
                'l'}"
              style="{promo.clickableBanner ? 'cursor: pointer;' : ''}"
              on:click={promo.clickableBanner ? () => { 
                if (promo.bannerLink) { window.location.href = promo.bannerLink; }
                else if(promo.gameName) { selectGame(GAMES.find(g => g.n === promo.gameName) || GAMES[0]); } 
              } : null}
            >
              {#if promo.backgroundImage}
                {#if promo.backgroundImage.includes('data:video/') || promo.backgroundImage.endsWith('.mp4') || promo.backgroundImage.endsWith('.webm') || promo.backgroundImage.endsWith('.mov')}
                  <!-- svelte-ignore a11y-media-has-caption -->
                  <video
                    src={promo.backgroundImage}
                    autoplay
                    loop
                    muted
                    playsinline
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: {promo.backgroundFit || 'cover'}; z-index: 0;"
                  ></video>
                {:else}
                  <img
                    src={promo.backgroundImage}
                    alt="Promo Background"
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: {promo.backgroundFit || 'cover'}; z-index: 0;"
                  />
                {/if}
              {/if}
              {#if promo.showOverlay !== false}
                <div class="promo-overlay"></div>
              {/if}
              <div class="promo-content">
                {#if promo.title && promo.title.trim() !== ""}
                <h2
                  class="promo-title"
                  style="color: {promo.textColor || '#ffffff'};"
                >
                  {promo.title}
                </h2>
                {/if}
                {#if promo.gameImage}
                  <img
                    src={promo.gameImage}
                    alt="Promo Game"
                    class="promo-game-img img-size-{promo.gameImageSize?.toLowerCase() ||
                      'm'}"
                    on:error={(e) => (e.target.style.display = "none")}
                  />
                {/if}
                {#if promo.showButton !== false && promo.buttonText}
                  <button
                    class="btn-green"
                    style="background: {promo.buttonColor ||
                      '#22c55e'}; color: {promo.buttonTextColor ||
                      '#ffffff'}; border: {promo.buttonBorderWidth ||
                      0}px solid {promo.buttonBorderColor || 'transparent'}; pointer-events: {promo.clickableBanner ? 'none' : 'auto'};"
                    on:click={!promo.clickableBanner ? () => {
                      if (promo.bannerLink) { window.location.href = promo.bannerLink; }
                      else if(promo.gameName) { selectGame(GAMES.find(g => g.n === promo.gameName) || GAMES[0]); }
                    } : null}
                  >{promo.buttonText}</button>
                {/if}
              </div>
            </section>
          {/each}
          </div>
          
          <!-- ─── Top Winners ─── -->
          <div class="cms-widget-wrapper" style="order:{pco.indexOf('topWinners')>=0?pco.indexOf('topWinners'):4}; --widget-w: {(widgetsSource?.topWinners?.size || '').toLowerCase() === 's' ? '33.333%' : (widgetsSource?.topWinners?.size || '').toLowerCase() === 'm' ? '50%' : '100%'};">
          <!-- ─── Standalone Top Winners Marquee (Glass Card Style) ─── -->
          {#if activeView === "home" && winnersSource?.enabled}
            <div style="padding: 0 20px; margin-bottom: 24px;">
              <div
                style="background: {isDarkTheme ? 'rgba(26, 22, 37, 0.6)' : 'var(--bg-panel)'}; backdrop-filter: blur(10px); border: 1px solid {isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'var(--border-color)'}; border-radius: 16px; color: var(--text-main); font-size: 11px; padding: 10px 0; overflow: hidden; white-space: nowrap; display: flex; align-items: center; position: relative; z-index: 10; box-shadow: {isDarkTheme ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 30px rgba(0,0,0,0.04)'};"
              >
                <div
                  style="padding: 0 20px; font-weight: 800; color: var(--accent-gold); z-index: 2; background: {isDarkTheme ? 'rgba(26, 22, 37, 1)' : 'var(--bg-panel)'}; border-radius: 16px 0 0 16px; box-shadow: 10px 0 20px {isDarkTheme ? 'rgba(26, 22, 37, 1)' : 'var(--bg-panel)'}; position: absolute; left: 0; display: flex; align-items: center; height: 100%;"
                >
                  <img src="/icons/pa_icon_tournaments.png" alt="top" style="height:14px; vertical-align:middle; margin-right:4px;" /> TOP CÂȘTIGĂTORI
                </div>
                <div
                  style="display: inline-block; padding-left: 200px; animation: marquee 40s linear infinite; gap: 32px;"
                >
                  {#each liveWinners as winner}
                    <span
                      style="margin-right: 32px; display: inline-flex; align-items: center; gap: 10px; vertical-align: middle;"
                    >
                      {#if winnersSource.showImage && winner.game}
                        {@const gameObj =
                          GAMES.find((g) => g.n === winner.game) || GAMES[0]}
                        {@const sizePx =
                          winnersSource.imageSize === "S"
                            ? "20px"
                            : winnersSource.imageSize === "L"
                              ? "32px"
                              : "26px"}
                        <img
                          src={gameObj.img}
                          alt={winner.game}
                          style="width: {sizePx}; height: {sizePx}; border-radius: 6px; object-fit: cover; border: 1px solid rgba(255,255,255,0.1);"
                        />
                      {/if}
                      <span style="font-size: 12px;"
                        ><span
                          style="color:var(--accent-gold); font-weight: 700;"
                          >{winner.name}</span
                        >
                        a câștigat
                        <strong style="color: #22c55e; font-size: 13px;"
                          >{Number(winner.amount).toLocaleString("ro-RO")} RON</strong
                        >{#if winner.game}
                          la <span style="color: var(--text-main); font-weight: 600;"
                            >{winner.game}</span
                          >{/if}</span
                      >
                    </span>
                  {/each}
                </div>
              </div>
            </div>
          {/if}

          </div><!-- /topWinners -->
          <!-- ─── Game Categories ─── -->
          <div class="cms-widget-wrapper" style="order:{pco.indexOf('gameCategories')>=0?pco.indexOf('gameCategories'):5}; --widget-w: {(widgetsSource?.gameCategories?.size || '').toLowerCase() === 's' ? '33.333%' : (widgetsSource?.gameCategories?.size || '').toLowerCase() === 'm' ? '50%' : '100%'};">

          {#each categoriesConfig as cat, i}
            {#if cat.filter !== "favorites" || favGamesList.length > 0}
              <section class="category-row" style="position: relative;">
                <!-- VISUAL EDITOR HOTSPOT: CATEGORY -->
                {#if isVisualCMSActive}
                  <div
                    class="visual-hotspot"
                    style="position: absolute; top: -10px; left: -10px; right: -10px; bottom: -10px; border: 1px solid transparent; pointer-events: none; z-index: 5; border-radius: 12px; transition: all 0.3s;"
                  ></div>
                  <button
                    class="visual-edit-btn"
                    on:click={() => {
                      isPreviewMode.set(true);
                    }}
                    style="position: absolute; top: -15px; right: 0px; z-index: 10; background: #000; color: var(--accent-gold); border: 1px solid var(--accent-gold); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0; transform: scale(0.8); transition: all 0.3s; cursor: pointer; pointer-events: auto; box-shadow: 0 5px 15px rgba(0,0,0,0.5);"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      width="14"
                      height="14"
                      ><path d="M12 20h9" /><path
                        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
                      /></svg
                    >
                  </button>
                {/if}

                <div class="category-header">
                  <h3>
                    {#if (themeColorsSource.showCategoryIcons || themeColorsSource.showIcons) && cat.icon}
                      {#if cat.icon.startsWith("http") || cat.icon.startsWith("/") || cat.icon.startsWith("data:")}
                        <img
                          src={cat.icon}
                          alt=""
                          style="width:20px;height:20px;border-radius:4px;object-fit:cover;margin-right:6px;vertical-align:middle;"
                        />
                      {:else}
                        <span
                          style="margin-right:6px; font-size: 18px; vertical-align: middle;"
                          >{cat.icon}</span
                        >
                      {/if}
                    {/if}
                    {cat.name}
                  </h3>

                  <a href="#" class="view-all">Vezi toate</a>
                </div>
                {#if cat.showGames !== false}
                  <div
                    class="games-slider size-{cat.thumbnailSize?.toLowerCase() ||
                      'm'}"
                  >
                    {#each cat.filter === "favorites" ? favGamesList : getGamesForCategory(cat) as game}
                      {@const gEffect = getGameEffect(
                        game.n,
                        gameEffectsSource,
                      )}
                      <div
                        class="game-card {gEffect
                          ? 'effect-' + gEffect.effect
                          : ''}"
                        style={gEffect
                          ? `--effect-interval: ${gEffect.effectInterval || 5}s;`
                          : ""}
                      >
                        <div class="img-wrapper">
                          <img
                            src={game.img}
                            alt={game.n}
                            loading="lazy"
                            on:error={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.parentElement.classList.add(
                                "broken-img",
                              );
                            }}
                          />
                          <div class="img-placeholder">
                            <span class="placeholder-icon">$</span>
                          </div>
                          <div class="game-hover-overlay">
                            <div class="play-btn">
                              <svg viewBox="0 0 24 24" fill="currentColor"
                                ><path d="M8 5v14l11-7z" /></svg
                              >
                            </div>
                            <div class="hover-details">
                              <span class="hover-prov">{game.p}</span>
                              {#if game.c && game.c.length > 0}
                                <span class="hover-tag">{game.c[0]}</span>
                              {/if}
                            </div>
                          </div>
                          <button
                            class="btn-fav {favoriteGames.has(game.n)
                              ? 'active'
                              : ''}"
                            on:click={() => toggleFavorite(game.n)}
                          >
                            <img src="/logoMobile.webp" alt="Fav" />
                          </button>
                        </div>
                        <div class="game-info">
                          <div class="g-name">{game.n}</div>
                          <div class="g-prov">{game.p}</div>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </section>
            {/if}

            <!-- ─── STANDALONE WIDGETS (AFTER CATEGORY) ─── -->
            {#if activeView === "home"}
              {@const catJackpots = animatedJackpots.filter((jp) => jp.position === `after_cat_${cat.id}` && (isLoggedIn || jp.showWhenLoggedOut))}
              {@const catPromos = promoConfig.filter((p) => p.enabled && p.positionIndex === i + 1)}
              
              {#if catJackpots.length > 0 || catPromos.length > 0}
                <div style="display: flex; flex-wrap: wrap; gap: 24px; padding: 0 24px 24px; width: 100%; justify-content: center; box-sizing: border-box;">
                  {#each catJackpots as heroJp}
                    {#if heroJp.showInFever2 && jackpotFever2Source?.enabled && jackpotFever2Source?.displayMode === "scattered"}
                      <div
                        style="display: flex; justify-content: center; width: 100%; margin-bottom: 24px;"
                      >
                        <Fever2Widget
                          jp={heroJp}
                          gaugeStyle={jackpotFever2Source.gaugeStyle}
                          extraAnimation={jackpotFever2Source.extraAnimation}
                          warpSpeedEffect={jackpotFever2Source.warpSpeedEffect}
                          warpDensity={jackpotFever2Source.warpDensity}
                          starfieldEffect={jackpotFever2Source.starfieldEffect}
                          starfieldDensity={jackpotFever2Source.starfieldDensity}
                        />
                      </div>
                    {:else}
                      <section
                        class="jackpot-cards-section size-{heroJp.size?.toLowerCase() ||
                          'm'}"
                        style={heroJp.backgroundImage
                          ? `background-image: url('${heroJp.backgroundImage}'); background-size: cover; background-position: center; opacity: 1; margin: 0;`
                          : "margin: 0;"}
                      >
                        <div class="jc-header">
                          {#if heroJp.logoUrl}
                            <img
                              src={heroJp.logoUrl}
                              alt={heroJp.name}
                              class="jc-logo"
                              style="height: 60px; filter: drop-shadow(0 2px 10px rgba(0,0,0,0.5));"
                            />
                          {:else}
                            <h2
                              style="color: var(--accent-gold); font-size: 32px; font-style: italic; margin:0;"
                            >
                              {heroJp.name}
                            </h2>
                          {/if}
                        </div>
                        <div class="jc-tickers">
                          {#if heroJp.levels && heroJp.levels.length > 0}
                            {#each [...heroJp.levels] as level}
                              <div
                                class="jc-ticker {heroJp.animationType === 'hot'
                                  ? 'jc-ticker-hot'
                                  : ''}"
                                style="border-top-color: {level.color};"
                              >
                                <span class="suit" style="color: {level.color};"
                                  >{level.icon}</span
                                >
                                <span class="val"
                                  >{formatJP(level.value)}
                                  <span class="curr">RON</span></span
                                >
                              </div>
                            {/each}
                          {:else}
                            <div
                              class="jc-ticker"
                              style="border-top-color: #ef4444;"
                            >
                              <span class="val"
                                >{formatJP(372399.84)}
                                <span class="curr">RON</span></span
                              >
                            </div>
                          {/if}
                        </div>
                        <div class="jc-games-slider">
                          {#each (heroJp.type === "bell" ? [...GAMES.filter((g) => g.p === "Amusnet")].reverse() : GAMES.filter((g) => g.p === "Amusnet")).slice(0, 7) as game}
                            {@const gEffect = getGameEffect(
                              game.n,
                              gameEffectsSource,
                            )}
                            <div
                              class="game-card {gEffect
                                ? 'effect-' + gEffect.effect
                                : ''}"
                              style={gEffect
                                ? `--effect-interval: ${gEffect.effectInterval || 5}s;`
                                : ""}
                            >
                              <div class="img-wrapper">
                                <img
                                  src={game.img}
                                  alt={game.n}
                                  loading="lazy"
                                  on:error={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.parentElement.classList.add(
                                      "broken-img",
                                    );
                                  }}
                                />
                                <div class="img-placeholder">
                                  <span class="placeholder-icon">$</span>
                                </div>
                                <div class="game-hover-overlay">
                                  <div class="play-btn">
                                    <svg viewBox="0 0 24 24" fill="currentColor"
                                      ><path d="M8 5v14l11-7z" /></svg
                                    >
                                  </div>
                                  <div class="hover-details">
                                    <span class="hover-prov">{game.p}</span>
                                    {#if game.c && game.c.length > 0}
                                      <span class="hover-tag">{game.c[0]}</span>
                                    {/if}
                                  </div>
                                </div>
                                <button
                                  class="btn-fav {favoriteGames.has(game.n)
                                    ? 'active'
                                    : ''}"
                                  on:click={() => toggleFavorite(game.n)}
                                >
                                  <img src="/logoMobile.webp" alt="Fav" />
                                </button>
                              </div>
                              <div class="game-info">
                                <div class="g-name">{game.n}</div>
                                <div class="g-prov">{game.p}</div>
                              </div>
                            </div>
                          {/each}
                        </div>
                      </section>
                    {/if}
                  {/each}

                  {#each catPromos as promo}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <section
                      class="promo-banner-section size-{promo.size?.toLowerCase() ||
                        'l'}"
                      style="margin: 32px 0; width: 100%; {promo.clickableBanner ? 'cursor: pointer;' : ''}"
                      on:click={promo.clickableBanner ? () => { 
                        if (promo.bannerLink) { window.location.href = promo.bannerLink; }
                        else if(promo.gameName) { selectGame(GAMES.find(g => g.n === promo.gameName) || GAMES[0]); } 
                      } : null}
                    >
                      {#if promo.backgroundImage}
                        {#if promo.backgroundImage.includes('data:video/') || promo.backgroundImage.endsWith('.mp4') || promo.backgroundImage.endsWith('.webm') || promo.backgroundImage.endsWith('.mov')}
                          <!-- svelte-ignore a11y-media-has-caption -->
                          <video
                            src={promo.backgroundImage}
                            autoplay
                            loop
                            muted
                            playsinline
                            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: {promo.backgroundFit || 'cover'}; z-index: 0;"
                          ></video>
                        {:else}
                          <img
                            src={promo.backgroundImage}
                            alt="Promo Background"
                            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: {promo.backgroundFit || 'cover'}; z-index: 0;"
                          />
                        {/if}
                      {/if}
                      {#if promo.showOverlay !== false}
                        <div class="promo-overlay"></div>
                      {/if}
                      <div class="promo-content">
                        {#if promo.title && promo.title.trim() !== ""}
                        <h2
                          class="promo-title"
                          style="color: {promo.textColor || '#ffffff'};"
                        >
                          {promo.title}
                        </h2>
                        {/if}
                        {#if promo.gameImage}
                          <img
                            src={promo.gameImage}
                            alt="Promo Game"
                            class="promo-game-img img-size-{promo.gameImageSize?.toLowerCase() ||
                              'm'}"
                            on:error={(e) => (e.target.style.display = "none")}
                          />
                        {/if}
                        {#if promo.showButton !== false && promo.buttonText}
                          <button
                            class="btn-green"
                            style="background-color: {promo.buttonColor ||
                              'var(--accent-gold)'}; color: {promo.buttonTextColor ||
                              '#000000'}; border: {promo.buttonBorderWidth ||
                              0}px solid {promo.buttonBorderColor || 'transparent'}; pointer-events: {promo.clickableBanner ? 'none' : 'auto'};"
                            on:click={!promo.clickableBanner ? () => {
                              if (promo.bannerLink) { window.location.href = promo.bannerLink; }
                              else if(promo.gameName) { selectGame(GAMES.find(g => g.n === promo.gameName) || GAMES[0]); }
                            } : null}
                          >
                            {promo.buttonText}
                          </button>
                        {/if}
                      </div>
                    </section>
                  {/each}
                </div>
              {/if}
            {/if}
          {/each}

          </div><!-- /gameCategories -->
          <!-- JACKPOT FEVER SECTION -->
          <div class="cms-widget-wrapper" style="order:{pco.indexOf('jackpotFever')>=0?pco.indexOf('jackpotFever'):6}; --widget-w: {(widgetsSource?.jackpotFever?.size || '').toLowerCase() === 's' ? '33.333%' : (widgetsSource?.jackpotFever?.size || '').toLowerCase() === 'm' ? '50%' : '100%'};">
          {#if jackpotFeverConfig?.enabled && jackpotConfig && jackpotConfig.some((jp) => jp.showInFever && (isLoggedIn || jp.showWhenLoggedOut))}
            <section
              class="jackpot-fever-section"
              style="width: 100%; margin: 0 auto 32px; max-width: 1400px; padding: 0 20px;"
            >
              <div class="jf-header">
                <h2>
                  {jackpotFeverConfig.title || "Jackpot Fever"}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent-gold)"
                    stroke-width="2"
                    width="16"
                    height="16"
                    ><circle cx="12" cy="12" r="10" /><path
                      d="M12 16v-4"
                    /><path d="M12 8h.01" /></svg
                  >
                </h2>
              </div>
              <div class="jf-container">
                {#each animatedJackpots.filter((jp) => jp.showInFever) as jp}
                  {#if isLoggedIn || jp.showWhenLoggedOut}
                    <div class="jf-item">
                      <div class="jf-arc-container">
                        <svg
                          viewBox="0 0 100 50"
                          class="jf-arc {jp.animationType === 'neon'
                            ? 'jf-arc-neon-glow'
                            : jp.animationType === 'hot'
                              ? 'jf-arc-hot-glow'
                              : ''}"
                        >
                          <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            stroke-width="8"
                            stroke-linecap="round"
                          />
                          <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke={jp.animationType === "neon"
                              ? "#c084fc"
                              : jp.animationType === "hot"
                                ? "#ef4444"
                                : jp.animation
                                  ? "#ef4444"
                                  : "#f97316"}
                            stroke-width="8"
                            stroke-linecap="round"
                            stroke-dasharray="125"
                            stroke-dashoffset={jp.animationType === "neon"
                              ? "15"
                              : jp.type === "cards" || jp.animation
                                ? "15"
                                : "45"}
                          />
                        </svg>
                        <img
                          src={jp.logoUrl.includes("cashpot.ro")
                            ? `/api/proxy/cashpot?url=${encodeURIComponent(jp.logoUrl)}`
                            : jp.logoUrl}
                          alt={jp.name}
                          class="jf-logo"
                          on:error={(e) => {
                            if (e.currentTarget.src.includes("/api/proxy"))
                              e.currentTarget.src = jp.logoUrl;
                          }}
                        />
                      </div>
                      <div class="jf-levels-container">
                        {#each (jp.levels || []).slice(0, jp.showOnlyHighestLevel ? 1 : 4) as level}
                          <div
                            class="jf-level-pill {jp.animationType === 'hot'
                              ? 'jf-level-pill-hot'
                              : ''}"
                          >
                            <div
                              style="display: flex; align-items: center; justify-content: space-between; width: 100%;"
                            >
                              <div
                                style="display: flex; align-items: center; gap: 8px;"
                              >
                                <div
                                  class="jf-level-icon"
                                  style="color: {level.color};"
                                >
                                  {level.icon}
                                </div>
                                <div
                                  class="jf-level-amount"
                                  style="color: #fff;"
                                >
                                  {Number(level.value).toLocaleString("ro-RO", {
                                    minimumFractionDigits: 2,
                                  })} RON
                                </div>
                              </div>
                            </div>
                          </div>
                        {/each}
                      </div>
                      <button class="jf-play-btn">JOACĂ ACUM</button>
                    </div>
                  {/if}
                {/each}
              </div>
            </section>
          {/if}

          <!-- ===== JACKPOT FEVER 2 (LOGGED IN) ===== -->
          {#if jackpotFever2Source?.enabled && jackpotFever2Source?.displayMode !== "scattered"}
            <section
              class="jackpot-fever-section"
              style="width: 100%; max-width: 1400px; padding: 24px; margin: 0 auto 32px;"
            >
              <div class="jf-header">
                <h2
                  class={jackpotFever2Source.gaugeStyle === "safe"
                    ? "vault-embossed-title"
                    : ""}
                >
                  {jackpotFever2Source.title || "Jackpot Arena"}
                </h2>
              </div>
              <div class="jf-container">
                {#each animatedJackpots.filter((jp) => jp.showInFever2) as jp}
                  {#if isLoggedIn || jp.showWhenLoggedOut}
                    <div class="jf2-item">
                      <Fever2Widget
                        {jp}
                        gaugeStyle={jp.fever2Style ||
                          jackpotFever2Source.gaugeStyle ||
                          "speedometer"}
                      />
                      <button class="jf-play-btn">JOACĂ ACUM</button>
                    </div>
                  {/if}
                {/each}
              </div>
            </section>
          {/if}

          {#each animatedJackpots.filter((jp) => jp.position === "bottom" && (isLoggedIn || jp.showWhenLoggedOut)) as heroJp}
            <section
              class="jackpot-cards-section"
              style="margin-bottom: 24px; max-width: 1400px; margin-left: auto; margin-right: auto;"
            >
              <!-- Simplified content to ensure stability -->
              <div class="jc-header">
                <img src={heroJp.logoUrl} alt={heroJp.name} class="jc-logo" />
              </div>
              <div class="jc-tickers">
                {#each heroJp.levels || [] as level}
                  <div class="jc-ticker">
                    <span class="val">{formatJP(level.value)} RON</span>
                  </div>
                {/each}
              </div>
            </section>
          {/each}
          </div><!-- /jackpotFever -->
          </div><!-- /page-content-order-container -->
        {/if}
      </main>

      {#if showDepositModal}
        <DepositModal 
          bind:userBalance={userBalance} 
          on:close={() => showDepositModal = false} 
          on:deposit={(e) => { 
            userBalance += e.detail;
            alert(`Depunere de ${e.detail} RON realizată cu succes!`);
          }} 
        />
      {/if}

      <!-- ─── Top Winners Marquee (BOTTOM) ─── -->
      {#if activeView === "home" && winnersSource?.enabled && winnersSource?.position === "bottom" && !activeView.startsWith("preview_")}
        <div
          style="background: var(--bg-dark); border-top: 1px solid var(--border-color); color: var(--text-main); font-size: 11px; padding: 6px 0; overflow: hidden; white-space: nowrap; display: flex; align-items: center; position: relative; z-index: 10;"
        >
          <div
            style="padding: 0 16px; font-weight: 800; color: var(--accent-gold); z-index: 2; background: var(--bg-dark); box-shadow: 10px 0 15px var(--bg-dark); position: absolute; left: 0; display: flex; align-items: center; height: 100%;"
          >
            <img src="/icons/pa_icon_tournaments.png" alt="top" style="height:14px; vertical-align:middle; margin-right:4px;" /> TOP CÂȘTIGĂTORI
          </div>
          <div
            style="display: inline-block; padding-left: max(100%, 200px); animation: marquee 40s linear infinite; gap: 32px;"
          >
            {#each liveWinners as winner}
              <span
                style="margin-right: 32px; display: inline-flex; align-items: center; gap: 8px; vertical-align: middle;"
              >
                {#if winnersSource.showImage && winner.game}
                  {@const gameObj =
                    GAMES.find((g) => g.n === winner.game) || GAMES[0]}
                  {@const sizePx =
                    winnersSource.imageSize === "S"
                      ? "16px"
                      : winnersSource.imageSize === "L"
                        ? "28px"
                        : "20px"}
                  <img
                    src={gameObj.img}
                    alt={winner.game}
                    style="width: {sizePx}; height: {sizePx}; border-radius: 4px; object-fit: cover;"
                  />
                {/if}
                <span
                  ><span style="color:var(--accent-gold);">{winner.name}</span>
                  a câștigat
                  <strong
                    >{Number(winner.amount).toLocaleString("ro-RO")} RON</strong
                  >{#if winner.game}
                    la {winner.game}{/if}</span
                >
              </span>
            {/each}
          </div>
        </div>
      {/if}

      {#if !activeView.startsWith("preview_")}
        <nav class="mobile-bottom-nav">
          <a
            href="#"
            class="nav-item {activeView === 'home' && !searchQuery
              ? 'active'
              : ''}"
            on:click|preventDefault={() => setView("home")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <text
                x="12"
                y="18"
                text-anchor="middle"
                font-size="20"
                font-weight="900"
                font-family="Arial, sans-serif"
                stroke-width="1.5">7</text
              >
              <circle cx="5" cy="7" r="1" fill="currentColor" stroke="none" />
              <circle cx="19" cy="9" r="1" fill="currentColor" stroke="none" />
              <circle cx="8" cy="2" r="1" fill="currentColor" stroke="none" />
            </svg>
            <span>SLOTS</span>
          </a>

          <a
            href="#"
            class="nav-item {activeView === 'playarena' ? 'active' : ''}"
            on:click|preventDefault={() => setView("playarena")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="8" cy="12" r="1"></circle><circle cx="16" cy="12" r="1"></circle><path d="M12 12v.01"></path>
            </svg>
            <span>ARENA</span>
          </a>

          <!-- CENTRAL WALLET BUTTON -->
          <div
            class="nav-item-center"
            on:click={() => { isMobileMenuOpen = false; if (isLoggedIn) showMobileWallet = true; else showLoginModal = true; }}
          >
            {#if isLoggedIn}
              <div class="center-btn-inner {showMobileWallet ? 'active' : ''}" style="padding:5px; border:none; background:conic-gradient(from 180deg, #3b82f6 0%, #a855f7 40%, #f5c842 100%); box-shadow: -4px 0 15px rgba(59,130,246,0.4), 4px 0 15px rgba(245,200,66,0.3);">
                <div class="vip-nav-avatar" style="width:100%; height:100%; border-radius:50%; overflow:hidden; display:flex; align-items:center; justify-content:center; background:var(--bg-dark); border:3px solid var(--bg-dark);">
                  <img src={vipConfig.levels[userLevel - 1]?.img || "/koi_vip.png"} alt="VIP" style="width:100%; height:100%; object-fit:cover;" />
                </div>
              </div>
            {:else}
              <div class="center-btn-inner {showMobileWallet ? 'active' : ''}" style="border-color: var(--accent-gold);">
                <img src="/logoMobile.webp" alt="Home" />
              </div>
            {/if}
          </div>

          <a href="#" class="nav-item" on:click|preventDefault={() => { isMobileMenuOpen = false; setView("vip"); }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>VIP CLUB</span>
          </a>

          <a
            href="#"
            class="nav-item"
            on:click|preventDefault={() => {
              isMobileMenuOpen = !isMobileMenuOpen;
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <span>MENIU</span>
          </a>
        </nav>
      {/if}

      <!-- ═══ MOBILE WALLET DRAWER ═══ -->
      {#if showMobileWallet && isLoggedIn}
        <!-- Backdrop -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          style="position:fixed; inset:0; z-index:9998; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px);"
          on:click={() => showMobileWallet = false}
        ></div>

        <!-- Drawer panel -->
        <div style="position:fixed; bottom:0; left:0; right:0; z-index:9999; background:{isDarkTheme ? (headerConfigSource.bgColor || '#130f1c') : 'var(--bg-panel)'}; border-radius:24px 24px 0 0; padding:0 0 32px; box-shadow:0 -8px 40px rgba(0,0,0,0.5); max-height:90vh; overflow-y:auto;">
          
          <!-- Handle bar -->
          <div style="display:flex; justify-content:center; padding:12px 0 4px;">
            <div style="width:40px; height:4px; background:rgba(255,255,255,0.2); border-radius:99px;"></div>
          </div>

          <!-- Header with VIP avatar (Centered with Progress Ring) -->
          <div style="position:relative; display:flex; flex-direction:column; align-items:center; text-align:center; padding:16px 20px 24px;">
            <button on:click={() => showMobileWallet = false} style="position:absolute; top:16px; right:20px; width:32px; height:32px; border-radius:50%; background:var(--bg-hover); border:1px solid var(--border-color); color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:2;">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            
            <div style="width:72px; height:72px; border-radius:50%; background:conic-gradient(from 180deg, #3b82f6 0%, #a855f7 40%, #f5c842 100%); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:-4px 0 15px rgba(59,130,246,0.4), 4px 0 15px rgba(245,200,66,0.3); padding:5px; margin-bottom:12px;">
              <div style="width:100%; height:100%; border-radius:50%; overflow:hidden; background:var(--bg-dark); border:3px solid var(--bg-dark);">
                <img src={vipConfig.levels[userLevel - 1]?.img || "/koi_vip.png"} alt="VIP" style="width:100%; height:100%; object-fit:cover;" />
              </div>
            </div>
            
            <div style="font-size:12px; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Portofelul meu</div>
            <div style="font-size:26px; font-weight:900; color:var(--text-main); letter-spacing:-0.5px;">{@html formatBalance(userBalance)} <span style="font-size:14px; color:var(--text-muted); font-weight:600;">RON</span></div>
            <div style="font-size:12px; color:var(--accent-gold); font-weight:700; margin-top:4px;">⭐ 2.340 / 5.000 XP · Nivel {userLevel}</div>
            
            <div style="width:100%; max-width:240px; height:6px; background:rgba(255,255,255,0.1); border-radius:4px; margin-top:12px; overflow:hidden;">
              <div style="height:100%; width: 46%; background:linear-gradient(90deg, #f5c842, #e6a817); border-radius:4px; box-shadow: 0 0 10px rgba(245,200,66,0.5);"></div>
            </div>
          </div>

          <!-- Balance boxes -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:0 20px 20px;">
            <div style="background:var(--bg-hover); border:1px solid var(--border-color); border-radius:14px; padding:14px;">
              <div style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; font-weight:600;">Balanță reală</div>
              <div style="font-size:18px; font-weight:900; color:var(--text-main);">{@html formatBalance(userBalance)} <span style="font-size:10px; opacity:0.6;">RON</span></div>
            </div>
            <div style="background:var(--bg-hover); border:1px solid var(--border-color); border-radius:14px; padding:14px;">
              <div style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; font-weight:600;">Bonus</div>
              <div style="font-size:18px; font-weight:900; color:var(--accent-gold);">{@html formatBalance(userBonus)} <span style="font-size:10px; opacity:0.6;">RON</span></div>
            </div>
          </div>

          <!-- Deposit button full width -->
          <div style="margin:0 20px 16px;">
            <button on:click={() => { userBalance += 50; showMobileWallet = false; alert("Depunere inițiată (Apple Pay Simulation)"); }} style="width:100%; padding:16px; border-radius:16px; background:linear-gradient(135deg,#f5c842,#e6a817); color:#1a1200; font-weight:900; font-size:17px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 20px rgba(245,200,66,0.4); letter-spacing:0.5px;">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
              DEPUNE ACUM
            </button>
          </div>

          <!-- Depunere rapida - Apple Pay style -->
          <div style="padding:0 20px 24px;">
            <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; font-weight:700; margin-bottom:10px;">Depunere rapidă</div>
            
            <!-- Saved Card Widget -->
            <PaymentCardStack />

            <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px;">
              {#each [100, 200, 500, 1000] as amount}
                <button style="padding:12px 0; border-radius:12px; background:var(--bg-hover); border:1px solid var(--border-color); color:var(--text-main); font-weight:800; font-size:13px; cursor:pointer; transition:all 0.2s; display:flex; flex-direction:column; align-items:center; gap:2px;"
                  on:click={() => { userBalance += amount; showMobileWallet = false; alert(`Apple Pay: Depunere de ${amount} RON aprobată!`); }}
                  on:mouseover={(e) => { e.currentTarget.style.borderColor='var(--accent-gold)'; e.currentTarget.style.color='var(--accent-gold)'; e.currentTarget.style.transform='scale(1.05)'; }}
                  on:mouseout={(e) => { e.currentTarget.style.borderColor='var(--border-color)'; e.currentTarget.style.color='var(--text-main)'; e.currentTarget.style.transform='scale(1)'; }}
                >
                  <span style="font-size:15px; font-weight:900;">{amount}</span>
                  <span style="font-size:9px; opacity:0.5; font-weight:600;">LEI</span>
                </button>
              {/each}
            </div>
          </div>

          <!-- Cards & Recent Games split section -->
          <div style="padding:0 20px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
              <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; font-weight:700;">Cardurile mele</div>
              <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; font-weight:700;">Ultimele Jocuri</div>
            </div>
            
            <div style="display:flex; gap:16px;">
              <!-- Left Column: Cascade Cards -->
              <div style="flex: 1; position: relative; height: 170px;">
                <!-- Card 1 -->
                <div style="position:absolute; top:0; left:0; right:0; height:100px; border-radius:12px; background:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460); padding:12px; z-index:3; box-shadow:0 4px 10px rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1);">
                  <div style="position:absolute; top:-10px; right:-10px; width:60px; height:60px; background:rgba(255,255,255,0.03); border-radius:50%;"></div>
                  <div style="font-size:8px; color:rgba(255,255,255,0.5); margin-bottom:16px; font-weight:600; letter-spacing:1px;">VISA</div>
                  <div style="font-size:12px; font-weight:800; color:#fff; letter-spacing:1px;">•••• •••• 4821</div>
                  <div style="display:flex; justify-content:space-between; margin-top:12px;">
                    <div style="font-size:8px; color:rgba(255,255,255,0.5);">09/27</div>
                    <div style="font-size:8px; color:rgba(255,255,255,0.7); font-weight:700;">Eugen C.</div>
                  </div>
                </div>
                <!-- Card 2 -->
                <div style="position:absolute; top:35px; left:0; right:0; height:100px; border-radius:12px; background:linear-gradient(135deg,#1a0533,#2d1b69,#11998e); padding:12px; z-index:2; box-shadow:0 4px 10px rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); transform:scale(0.95); transform-origin:top center;">
                  <div style="font-size:8px; color:rgba(255,255,255,0.5); margin-bottom:16px; font-weight:600; letter-spacing:1px;">MASTERCARD</div>
                  <div style="font-size:12px; font-weight:800; color:#fff; letter-spacing:1px;">•••• •••• 7293</div>
                </div>
                <!-- Add card -->
                <div style="position:absolute; top:70px; left:0; right:0; height:100px; border-radius:12px; background:var(--bg-hover); border:2px dashed var(--border-color); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; z-index:1; transform:scale(0.9); transform-origin:top center; cursor:pointer;">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <div style="font-size:8px; color:var(--text-muted); font-weight:600;">Adaugă card</div>
                </div>
              </div>

              <!-- Right Column: Recent Games Grid -->
              <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-content: start;">
                {#each (topGamesConfig?.games || []).slice(0, 4) as topGame}
                  {@const game = GAMES.find((g) => g.n === topGame.name) || { n: topGame.name, img: '' }}
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <!-- svelte-ignore a11y-no-static-element-interactions -->
                  <div style="aspect-ratio:3/4; border-radius:8px; overflow:hidden; position:relative; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.3);" on:click={() => { showMobileWallet = false; selectGame(game); }}>
                    <img src={game.img} alt={game.n} style="width:100%; height:100%; object-fit:cover;" />
                    <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%); display:flex; align-items:flex-end; padding:6px;">
                      <span style="color:#fff; font-size:9px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{game.n}</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Floating Chat (Temporarily hidden per request) -->
      <button
        class="floating-chat"
        aria-label="Chat Support"
        style="display: none;"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          ></path></svg
        >
      </button>

      <!-- MODALS -->
      <!-- MODALS -->
      {#if showLoginModal}
        <div class="modal-overlay" on:click={() => (showLoginModal = false)}>
          <div class="modal-content" on:click|stopPropagation>
            <div
              class="modal-header"
              style="border-bottom: 1px solid var(--border-color); background: transparent; padding: 24px 32px; display: flex; align-items: center; justify-content: space-between;"
            >
              <div style="display: flex; align-items: center; gap: 12px;">
                <div
                  style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--primary-hover)); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(76, 29, 149, 0.4);"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    width="20"
                    height="20"
                    ><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
                    ></path><polyline points="10 17 15 12 10 7"></polyline><line
                      x1="15"
                      y1="12"
                      x2="3"
                      y2="12"
                    ></line></svg
                  >
                </div>
                <h2
                  style="margin: 0; font-family: var(--font-condensed); font-size: 1.8rem; color: var(--text-main); letter-spacing: 1px;"
                >
                  AUTENTIFICARE
                </h2>
              </div>
              <button
                class="btn-close"
                on:click={() => (showLoginModal = false)}>&times;</button
              >
            </div>
            <div class="modal-body" style="padding: 32px;">
              <p
                style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px;"
              >
                Te rugăm să introduci datele contului tău CashPot pentru a
                continua.
              </p>

              <div style="position: relative; margin-bottom: 16px;">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-muted)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  width="18"
                  height="18"
                  style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); pointer-events: none;"
                  ><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                  ></path><circle cx="12" cy="7" r="4"></circle></svg
                >
                <input
                  type="text"
                  bind:value={loginEmail}
                  placeholder="Nume de utilizator sau Email"
                  class="modal-input"
                  style="padding-left: 44px; margin-bottom: 0;"
                />
              </div>

              <div style="position: relative; margin-bottom: 8px;">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-muted)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  width="18"
                  height="18"
                  style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); pointer-events: none;"
                  ><rect x="3" y="11" width="18" height="11" rx="2" ry="2"
                  ></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg
                >
                <input
                  type="password"
                  bind:value={loginPassword}
                  placeholder="Parolă"
                  class="modal-input"
                  style="padding-left: 44px; margin-bottom: 0;"
                  on:keydown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>

              {#if loginErrorMsg}
                <div style="color: #ef4444; font-size: 13px; margin-top: 8px;">
                  {loginErrorMsg}
                </div>
              {/if}

              <div
                style="display: flex; justify-content: flex-end; margin-bottom: 24px; margin-top: 8px;"
              >
                <a
                  href="#"
                  style="color: var(--text-muted); font-size: 13px; text-decoration: none; transition: color 0.2s;"
                  on:mouseover={(e) =>
                    (e.target.style.color = "var(--accent-gold)")}
                  on:mouseout={(e) =>
                    (e.target.style.color = "var(--text-muted)")}
                  >Ai uitat parola?</a
                >
              </div>

              <button
                class="btn-gold"
                on:click={handleLogin}
                style="width: 100%; padding: 16px; font-size: 16px; font-weight: 800; border-radius: var(--radius-md); box-shadow: 0 4px 15px rgba(234, 179, 8, 0.3);"
                >INTRARE ÎN CONT</button
              >

              <div
                style="text-align: center; margin-top: 32px; font-size: 14px; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 24px;"
              >
                Nu ai cont încă? <a
                  href="#"
                  style="color: var(--accent-gold); text-decoration: none; font-weight: 700; margin-left: 4px;"
                  on:click|preventDefault={() => {
                    showLoginModal = false;
                    showRegisterModal = true;
                  }}>Înregistrează-te gratuit</a
                >
              </div>
            </div>
          </div>
        </div>
      {/if}

      {#if showRegisterModal}
        <div class="modal-overlay" on:click={() => (showRegisterModal = false)}>
          <div
            class="modal-content"
            on:click|stopPropagation
            style="max-width: 500px;"
          >
            <div
              class="modal-header"
              style="border-bottom: 1px solid var(--border-color); background: transparent; padding: 24px 32px; display: flex; align-items: center; justify-content: space-between;"
            >
              <div style="display: flex; align-items: center; gap: 12px;">
                <div
                  style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-gold), #ca8a04); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(234, 179, 8, 0.4);"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#000"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    width="20"
                    height="20"
                    ><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                    ></path><circle cx="8.5" cy="7" r="4"></circle><line
                      x1="20"
                      y1="8"
                      x2="20"
                      y2="14"
                    ></line><line x1="23" y1="11" x2="17" y2="11"></line></svg
                  >
                </div>
                <h2
                  style="margin: 0; font-family: var(--font-condensed); font-size: 1.8rem; color: var(--text-main); letter-spacing: 1px;"
                >
                  ÎNREGISTRARE
                </h2>
              </div>
              <button
                class="btn-close"
                on:click={() => (showRegisterModal = false)}>&times;</button
              >
            </div>
            <div class="modal-body" style="padding: 32px;">
              <div
                style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.2); border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent-gold)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  width="24"
                  height="24"
                  style="flex-shrink: 0;"
                  ><polyline points="20 6 9 17 4 12"></polyline></svg
                >
                <span
                  style="font-size: 13px; color: var(--text-main); line-height: 1.4;"
                  >Primești <strong style="color: var(--accent-gold);"
                    >500 Rotiri Gratuite</strong
                  > imediat după validarea contului!</span
                >
              </div>

              <div
                style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;"
              >
                <div style="position: relative;">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--text-muted)"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    width="18"
                    height="18"
                    style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); pointer-events: none;"
                    ><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                    ></path><circle cx="12" cy="7" r="4"></circle></svg
                  >
                  <input
                    type="text"
                    placeholder="Prenume"
                    class="modal-input"
                    style="padding-left: 44px; margin-bottom: 0;"
                  />
                </div>
                <div style="position: relative;">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--text-muted)"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    width="18"
                    height="18"
                    style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); pointer-events: none;"
                    ><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                    ></path><circle cx="12" cy="7" r="4"></circle></svg
                  >
                  <input
                    type="text"
                    placeholder="Nume"
                    class="modal-input"
                    style="padding-left: 44px; margin-bottom: 0;"
                  />
                </div>
              </div>

              <div style="position: relative; margin-bottom: 16px;">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-muted)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  width="18"
                  height="18"
                  style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); pointer-events: none;"
                  ><path
                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  ></path><polyline points="22,6 12,13 2,6"></polyline></svg
                >
                <input
                  type="email"
                  placeholder="Adresă Email"
                  class="modal-input"
                  style="padding-left: 44px; margin-bottom: 0;"
                />
              </div>

              <div style="position: relative; margin-bottom: 24px;">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-muted)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  width="18"
                  height="18"
                  style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); pointer-events: none;"
                  ><rect x="5" y="2" width="14" height="20" rx="2" ry="2"
                  ></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg
                >
                <input
                  type="tel"
                  placeholder="Număr de Telefon"
                  class="modal-input"
                  style="padding-left: 44px; margin-bottom: 0;"
                />
              </div>

              <div
                style="display: flex; gap: 12px; margin-bottom: 24px; align-items: flex-start; background: var(--bg-hover); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);"
              >
                <input
                  type="checkbox"
                  style="margin-top: 2px; width: 18px; height: 18px; accent-color: var(--accent-gold); cursor: pointer;"
                />
                <span
                  style="font-size: 13px; color: var(--text-muted); line-height: 1.5;"
                  >Confirm pe propria răspundere că am <strong
                    style="color: var(--text-main);">peste 18 ani</strong
                  >
                  și sunt de acord cu
                  <a
                    href="#"
                    style="color: var(--accent-gold); text-decoration: none;"
                    >Termenii și Condițiile</a
                  >
                  și
                  <a
                    href="#"
                    style="color: var(--accent-gold); text-decoration: none;"
                    >Politica de Confidențialitate</a
                  >.</span
                >
              </div>

              <button
                class="btn-gold"
                style="width: 100%; padding: 16px; font-size: 16px; font-weight: 800; border-radius: var(--radius-md); box-shadow: 0 4px 15px rgba(234, 179, 8, 0.3);"
                >CREEAZĂ CONTUL</button
              >

              <div
                style="text-align: center; margin-top: 24px; font-size: 14px; color: var(--text-muted);"
              >
                Ai deja un cont? <a
                  href="#"
                  style="color: var(--accent-gold); text-decoration: none; font-weight: 700; margin-left: 4px;"
                  on:click|preventDefault={() => {
                    showRegisterModal = false;
                    showLoginModal = true;
                  }}>Conectează-te aici</a
                >
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- VISUAL SIDE EDITOR PANEL (PRISMIC STYLE) -->
      {#if isVisualCMSActive && $isPreviewMode}
        <div
          style="position: fixed; top: {editorPanelPos.top}px; right: {editorPanelPos.right}px; width: 360px; max-height: calc(100vh - 160px); background: rgba(12, 10, 16, 0.45); backdrop-filter: blur(35px); -webkit-backdrop-filter: blur(35px); border: 1px solid rgba(255,255,255,0.15); z-index: 1000000; border-radius: 24px; box-shadow: 0 40px 100px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.05); display: flex; flex-direction: column; animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1); overflow: hidden; transition: height 0.3s ease;"
        >
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            on:mousedown={onEditorDragStart}
            style="padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); cursor: grab; {isDraggingEditor
              ? 'cursor: grabbing;'
              : ''}"
          >
            <div style="display: flex; align-items: center; gap: 10px;">
              <div
                style="width: 8px; height: 8px; background: var(--accent-gold); border-radius: 50%; box-shadow: 0 0 10px var(--accent-gold);"
              ></div>
              <h2
                style="font-size: 12px; font-weight: 800; color: #fff; letter-spacing: 1.5px; text-transform: uppercase; margin: 0;"
              >
                Editor Vizual
              </h2>
            </div>
            <div style="display: flex; gap: 8px;">
              <button
                on:click={() =>
                  (isVisualEditorMinimized = !isVisualEditorMinimized)}
                style="background: rgba(255,255,255,0.05); border: none; color: #fff; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s;"
                on:mouseover={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                on:mouseout={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              >
                {#if isVisualEditorMinimized}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    width="14"
                    height="14"
                    ><polyline points="15 3 21 3 21 9" /><polyline
                      points="9 21 3 21 3 15"
                    /><line x1="21" y1="3" x2="14" y2="10" /><line
                      x1="3"
                      y1="21"
                      x2="10"
                      y2="14"
                    /></svg
                  >
                {:else}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    width="14"
                    height="14"><line x1="5" y1="12" x2="19" y2="12" /></svg
                  >
                {/if}
              </button>
              <button
                on:click={() => {
                  isPreviewMode.set(false);
                }}
                style="background: rgba(255,255,255,0.05); border: none; color: #fff; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s;"
                on:mouseover={(e) =>
                  (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
                on:mouseout={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  width="14"
                  height="14"
                  ><line x1="18" y1="6" x2="6" y2="18" /><line
                    x1="6"
                    y1="6"
                    x2="18"
                    y2="18"
                  /></svg
                >
              </button>
            </div>
          </div>
          {#if !isVisualEditorMinimized}
            <div
              style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 32px;"
            >
              <!-- QUICK EDIT BANNERS -->
              <section>
                <h3
                  style="font-size: 10px; font-weight: 800; color: var(--accent-gold); margin-bottom: 16px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;"
                >
                  Layout Bannere
                </h3>
                <div
                  style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;"
                >
                  {#each [["1_big_2_small", "1 Mare + 2 Mici"], ["4_small", "4 Mici Grid"], ["4_medium", "4 Medii Grid"], ["2_big", "2 Mari Full"]] as [val, lbl]}
                    <button
                      on:click={() =>
                        cmsDraftBanners.update((b) => ({ ...b, layout: val }))}
                      style="padding: 12px; border-radius: 12px; font-size: 11px; font-weight: 700; border: 1px solid {bannersConfig.layout ===
                      val
                        ? 'var(--accent-gold)'
                        : 'rgba(255,255,255,0.1)'}; background: {bannersConfig.layout ===
                      val
                        ? 'rgba(245,200,66,0.1)'
                        : 'rgba(255,255,255,0.02)'}; color: {bannersConfig.layout ===
                      val
                        ? 'var(--accent-gold)'
                        : '#fff'}; cursor: pointer; transition: all 0.2s;"
                      >{lbl}</button
                    >
                  {/each}
                </div>
              </section>

              <!-- QUICK EDIT CATEGORIES -->
              <section>
                <h3
                  style="font-size: 10px; font-weight: 800; color: var(--accent-gold); margin-bottom: 16px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;"
                >
                  Vizibilitate Secțiuni
                </h3>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  {#each $cmsDraftCategories as cat}
                    <label
                      style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02); padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: all 0.2s;"
                    >
                      <div
                        style="display: flex; align-items: center; gap: 10px;"
                      >
                        {#if cat.icon}<img
                            src={cat.icon}
                            alt=""
                            style="width: 16px; height: 16px; border-radius: 4px; opacity: {cat.showOnPage
                              ? 1
                              : 0.3};"
                          />{/if}
                        <span
                          style="font-size: 12px; font-weight: 600; color: {cat.showOnPage
                            ? '#fff'
                            : 'rgba(255,255,255,0.3)'}">{cat.name}</span
                        >
                      </div>
                      <div
                        style="width: 36px; height: 20px; background: {cat.showOnPage
                          ? 'var(--accent-gold)'
                          : 'rgba(255,255,255,0.1)'}; border-radius: 20px; position: relative; transition: all 0.3s;"
                      >
                        <div
                          style="position: absolute; top: 2px; left: {cat.showOnPage
                            ? '18px'
                            : '2px'}; width: 16px; height: 16px; background: {cat.showOnPage
                            ? '#000'
                            : '#fff'}; border-radius: 50%; transition: all 0.3s;"
                        ></div>
                        <input
                          type="checkbox"
                          checked={cat.showOnPage}
                          on:change={(e) => {
                            cmsDraftCategories.update((list) => {
                              const idx = list.findIndex(
                                (c) => c.id === cat.id,
                              );
                              list[idx].showOnPage = e.target.checked;
                              return [...list];
                            });
                          }}
                          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;"
                        />
                      </div>
                    </label>
                  {/each}
                </div>
              </section>

              <!-- QUICK EDIT PROMO & JACKPOT -->
              <section>
                <h3
                  style="font-size: 10px; font-weight: 800; color: var(--accent-gold); margin-bottom: 16px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;"
                >
                  Widget-uri Speciale
                </h3>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <!-- Promo Banner Toggle -->
                  {#if $cmsDraftPromoBanner && $cmsDraftPromoBanner.length > 0}
                    <label
                      style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02); padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: all 0.2s;"
                    >
                      <span
                        style="font-size: 12px; font-weight: 600; color: {$cmsDraftPromoBanner[0]
                          .enabled
                          ? '#fff'
                          : 'rgba(255,255,255,0.3)'}">Promo Banner (GOTW)</span
                      >
                      <div
                        style="width: 36px; height: 20px; background: {$cmsDraftPromoBanner[0]
                          .enabled
                          ? 'var(--accent-gold)'
                          : 'rgba(255,255,255,0.1)'}; border-radius: 20px; position: relative; transition: all 0.3s;"
                      >
                        <div
                          style="position: absolute; top: 2px; left: {$cmsDraftPromoBanner[0]
                            .enabled
                            ? '18px'
                            : '2px'}; width: 16px; height: 16px; background: {$cmsDraftPromoBanner[0]
                            .enabled
                            ? '#000'
                            : '#fff'}; border-radius: 50%; transition: all 0.3s;"
                        ></div>
                        <input
                          type="checkbox"
                          checked={$cmsDraftPromoBanner[0].enabled}
                          on:change={(e) => {
                            cmsDraftPromoBanner.update((list) => {
                              list[0].enabled = e.target.checked;
                              return [...list];
                            });
                          }}
                          style="position: absolute; opacity: 0; cursor: pointer; width: 100%; height: 100%; top:0; left:0;"
                        />
                      </div>
                    </label>
                  {/if}

                  <!-- Jackpot Toggles -->
                  {#if $cmsDraftJackpot}
                    {#each $cmsDraftJackpot as jp, jpIdx}
                      <label
                        style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02); padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: all 0.2s;"
                      >
                        <span
                          style="font-size: 12px; font-weight: 600; color: {jp.position !==
                          'hidden'
                            ? '#fff'
                            : 'rgba(255,255,255,0.3)'}">Jackpot: {jp.name}</span
                        >
                        <div
                          style="width: 36px; height: 20px; background: {jp.position !==
                          'hidden'
                            ? 'var(--accent-gold)'
                            : 'rgba(255,255,255,0.1)'}; border-radius: 20px; position: relative; transition: all 0.3s;"
                        >
                          <div
                            style="position: absolute; top: 2px; left: {jp.position !==
                            'hidden'
                              ? '18px'
                              : '2px'}; width: 16px; height: 16px; background: {jp.position !==
                            'hidden'
                              ? '#000'
                              : '#fff'}; border-radius: 50%; transition: all 0.3s;"
                          ></div>
                          <input
                            type="checkbox"
                            checked={jp.position !== "hidden"}
                            on:change={(e) => {
                              cmsDraftJackpot.update((list) => {
                                list[jpIdx].position = e.target.checked
                                  ? jp.type === "cards"
                                    ? "after_hero"
                                    : "bottom"
                                  : "hidden";
                                return [...list];
                              });
                            }}
                            style="position: absolute; opacity: 0; cursor: pointer; width: 100%; height: 100%; top:0; left:0;"
                          />
                        </div>
                      </label>
                    {/each}
                  {/if}
                </div>
              </section>

              <!-- PUBLISH ACTIONS -->
              <div
                style="margin-top: auto; padding-top: 20px; display: flex; flex-direction: column; gap: 12px;"
              >
                <button
                  on:click={() => {
                    cmsCategories.set(
                      JSON.parse(JSON.stringify($cmsDraftCategories)),
                    );
                    cmsJackpot.set(
                      JSON.parse(JSON.stringify($cmsDraftJackpot)),
                    );
                    cmsBanners.set(
                      JSON.parse(JSON.stringify($cmsDraftBanners)),
                    );
                    cmsPromoBanner.set(
                      JSON.parse(JSON.stringify($cmsDraftPromoBanner)),
                    );
                    isPreviewMode.set(false);
                  }}
                  style="background: var(--accent-gold); color: #000; border: none; padding: 16px; border-radius: 16px; font-weight: 900; font-size: 13px; cursor: pointer; box-shadow: 0 15px 30px rgba(245,200,66,0.2); text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s;"
                  on:mouseover={(e) =>
                    (e.currentTarget.style.transform = "translateY(-2px)")}
                  on:mouseout={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")}
                  >PUBLICĂ LIVE</button
                >
                <button
                  on:click={() => {
                    isPreviewMode.set(false);
                  }}
                  style="background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 14px; border-radius: 16px; font-weight: 700; font-size: 12px; cursor: pointer; transition: all 0.2s;"
                  on:mouseover={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.1)")}
                  on:mouseout={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.05)")}>ÎNCHIDE EDITOR</button
                >
              </div>
            </div>
          {/if}
        </div>
      {/if}

      <!-- VISUAL EDITOR TOOLBAR HAS BEEN REMOVED FOR CLEANER PREVIEWS -->

      <!-- PREVIEW MODE INDICATOR (FLOATING) -->
      {#if $isPreviewMode}
        <div
          style="position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 100000; background: linear-gradient(135deg, #111827, #1f2937); border: 2px solid var(--accent-gold); padding: 12px 24px; border-radius: 50px; display: flex; align-items: center; gap: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); animation: slideUpIndicator 0.5s ease-out;"
        >
          <div style="display: flex; align-items: center; gap: 8px;">
            <div
              style="width: 10px; height: 10px; border-radius: 50%; background: var(--accent-gold); animation: pulseIndicator 1.5s infinite;"
            ></div>
            <span
              style="color: var(--accent-gold); font-weight: 800; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;"
              >Mod Preview Activ (Nesalvat)</span
            >
          </div>
          <button
            on:click={() => {
              isPreviewMode.set(false);
              isAdminRoute = true;
              window.location.hash = "#admin";
            }}
            style="background: var(--accent-gold); color: #000; border: none; padding: 6px 16px; border-radius: 50px; font-weight: 800; font-size: 10px; cursor: pointer; transition: transform 0.2s;"
            on:mouseenter={(e) => (e.target.style.transform = "scale(1.1)")}
            on:mouseleave={(e) => (e.target.style.transform = "scale(1)")}
          >
            ÎNAPOI ÎN ADMIN
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
  @keyframes slideUpIndicator {
    from {
      bottom: -100px;
      opacity: 0;
    }
    to {
      bottom: 30px;
      opacity: 1;
    }
  }
  @keyframes pulseIndicator {
    0% {
      opacity: 0.4;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.3);
    }
    100% {
      opacity: 0.4;
      transform: scale(1);
    }
  }

  .category-row:hover .visual-hotspot,
  .hero-section:hover .visual-hotspot {
    border-color: var(--accent-gold) !important;
    background: rgba(245, 200, 66, 0.05);
  }
  .category-row:hover .visual-edit-btn,
  .hero-section:hover .visual-edit-btn {
    opacity: 1 !important;
    transform: scale(1) !important;
  }

  /* MODALS CSS */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 24px;
  }

  .modal-content {
    background: var(--surface);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 440px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    padding: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.2);
  }

  .btn-close {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 24px;
    cursor: pointer;
    line-height: 1;
    transition: color 0.2s;
  }
  .btn-close:hover {
    color: var(--text-main);
  }

  .modal-body {
    padding: 32px 24px;
  }

  .modal-input {
    width: 100%;
    padding: 14px 16px;
    margin-bottom: 16px;
    background: var(--bg-hover);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    color: var(--text-main);
    font-size: 16px !important; /* CRITICAL: Prevent iOS Safari auto-zoom bug */
    outline: none;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }
  .modal-input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(76, 29, 149, 0.2);
  }
  .modal-input::placeholder {
    color: var(--text-muted);
    opacity: 0.7;
  }
  @keyframes scroll-left {
    0% {
      transform: translateX(50vw);
    }
    100% {
      transform: translateX(-100%);
    }
  }
  .ticker-content {
    animation: scroll-left 25s linear infinite;
  }
  .ticker-content:hover {
    animation-play-state: paused;
  }

  .floating-chat {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--accent-gold);
    color: var(--bg-panel);
    border: none;
    box-shadow: 0 8px 32px rgba(234, 179, 8, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1000;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }
  .floating-chat:hover {
    transform: scale(1.1);
    box-shadow: 0 12px 40px rgba(234, 179, 8, 0.6);
  }
  .floating-chat svg {
    width: 24px;
    height: 24px;
  }
  @media (max-width: 768px) {
    .floating-chat {
      bottom: 88px; /* Above mobile bottom nav */
    }
  }
  /* HERO BANNERS */
  .hero-section {
    padding: 16px;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: 2.2fr 1fr;
    gap: 16px;
    height: auto;
    min-height: 280px;
  }

  .banner {
    border-radius: var(--radius-lg);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.05) inset,
      var(--shadow-glass);
    padding: 32px;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  @keyframes slow-pan {
    0% {
      transform: scale(1) translate(0, 0);
    }
    50% {
      transform: scale(1.08) translate(-1.5%, 1%);
    }
    100% {
      transform: scale(1) translate(0, 0);
    }
  }

  .banner-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
    transition:
      transform 0.4s ease,
      filter 0.4s ease;
  }

  .banner-small:hover .banner-bg {
    transform: scale(1.1);
    filter: brightness(1.05);
  }

  .banner-large .banner-bg {
    animation: slow-pan 20s ease-in-out infinite;
    will-change: transform;
  }

  .banner-large:hover .banner-bg {
    animation-play-state: paused;
    filter: brightness(1.1);
  }

  .banner-stack {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
  }

  .banner-small {
    flex: 1;
    padding: 20px;
    justify-content: center;
    transition:
      transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1),
      box-shadow 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .banner-small:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(255, 255, 255, 0.2) inset;
    z-index: 10;
  }

  .banner-tag {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--accent-gold);
    margin-bottom: 8px;
    display: block;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .banner-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    position: relative;
    z-index: 1;
  }

  .banner-content h2 {
    font-family: var(--font-condensed);
    font-size: 2.5rem;
    font-weight: 900;
    line-height: 1.1;
    margin-bottom: 8px;
    color: #ffffff;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  }

  .banner-content h2 em {
    font-style: normal;
    color: var(--accent-gold);
  }

  .banner-content h3 {
    font-family: var(--font-condensed);
    font-size: 1.3rem;
    font-weight: 900;
    margin-bottom: 4px;
    color: #ffffff;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  }

  .banner-content p {
    font-size: 12px;
    opacity: 0.9;
    margin-bottom: 16px;
    color: #ffffff;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  }

  .btn-gold {
    background: var(--accent-gold);
    color: #000;
    border: none;
    border-radius: var(--radius-pill);
    padding: 8px 20px;
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
    transition: transform 0.2s;
    font-family: var(--font-main);
  }

  .btn-gold:hover {
    transform: scale(1.05);
  }


  /* BUTTONS & MAC OS TAHOE FEEL */
  .btn-theme-toggle {
    background: transparent;
    border: 1px solid var(--border-color);
    cursor: pointer;
    color: var(--text-muted);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s ease;
    margin-right: 8px;
  }

  .btn-theme-toggle:hover {
    background: var(--bg-hover);
    color: var(--text-main);
    transform: scale(1.05);
  }

  .btn-theme-toggle svg {
    width: 18px;
    height: 18px;
  }

  /* GAMES SLIDER */
  .category-row {
    padding: 0 24px 32px;
  }

  .category-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 16px;
  }

  .category-header h3 {
    font-family: var(--font-condensed);
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .view-all {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
    text-decoration: none;
  }
  .view-all:hover {
    color: var(--text-main);
  }
  .game-card {
    flex: 0 0 160px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: var(--radius-md);
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .game-card:hover {
    transform: translateY(-8px) scale(1.02);
    background: rgba(255, 255, 255, 0.06);
    border-color: var(--accent-gold);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    z-index: 10;
  }

  .game-card.size-s {
    flex: 0 0 120px;
  }
  .game-card.size-m {
    flex: 0 0 160px;
  }
  .game-card.size-l {
    flex: 0 0 220px;
  }

  .img-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #222, #111);
    z-index: 1;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }

  .placeholder-icon {
    font-size: 48px;
    font-weight: 900;
    color: var(--accent-gold);
    opacity: 0.2;
    font-family: var(--font-condensed);
  }

  .broken-img .img-placeholder {
    opacity: 1;
    z-index: 10;
  }

  .broken-img .placeholder-icon {
    opacity: 0.6;
    text-shadow: 0 0 20px rgba(245, 200, 66, 0.4);
  }

  .game-card .img-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  @keyframes borderLoop {
    0% {
      box-shadow:
        inset 0 0 0 2px var(--accent-gold),
        inset 0 0 15px rgba(251, 194, 36, 0.3);
    }
    50% {
      box-shadow:
        inset 0 0 0 2px #f59e0b,
        inset 0 0 30px rgba(245, 158, 11, 0.6);
    }
    100% {
      box-shadow:
        inset 0 0 0 2px var(--accent-gold),
        inset 0 0 15px rgba(251, 194, 36, 0.3);
    }
  }

  .play-btn {
    width: 70%;
    height: 30px;
    background: linear-gradient(to bottom, var(--accent-gold), #d97706);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #000;
    transform: translateY(20px);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: auto;
  }

  .play-btn::after {
    content: "Joacă";
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    margin-left: 6px;
  }

  .game-card:hover .play-btn {
    transform: translateY(0);
    box-shadow: 0 4px 15px rgba(251, 194, 36, 0.5);
  }

  .play-btn svg {
    width: 14px;
    height: 14px;
  }

  .hover-details {
    display: none; /* Ascundem textele din mijloc care blocau imaginea */
  }

  /* HEADER WIDGETS */
  .header-widget-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 99px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    cursor: pointer;
    transition: all 0.2s;
    height: 32px;
  }
  .header-widget-item:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--accent);
    transform: translateY(-1px);
  }
  .widget-icon-mini {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--accent);
    color: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 900;
  }
  .widget-label-mini {
    font-size: 10px;
    font-weight: 800;
    color: var(--text-muted);
    text-transform: uppercase;
  }
  .header-widget-item:hover .widget-label-mini {
    color: #fff;
  }

  .hover-prov {
    color: rgba(255, 255, 255, 0.9);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  @media (max-width: 768px) {
    .banner-content h2 {
      font-size: 1.8rem !important;
    }
    .banner-content h3 {
      font-size: 1.1rem !important;
    }
    .banner-content p {
      font-size: 11px !important;
      margin-bottom: 12px !important;
    }
    .banner-large {
      padding: 24px !important;
    }
    .banner-small {
      padding: 16px !important;
    }
  }
  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-15px);
    }
  }
  @keyframes pulse-glow {
    0%,
    100% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
  }
  @keyframes pulse-btn {
    0% {
      box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.7);
    }
    70% {
      box-shadow: 0 0 0 20px rgba(234, 179, 8, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(234, 179, 8, 0);
    }
  }
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    z-index: 1;
    opacity: 0.4;
    animation: float 10s ease-in-out infinite alternate;
  }
  .orb-1 {
    width: 400px;
    height: 400px;
    background: #4c1d95;
    top: -100px;
    left: -100px;
  }
  .orb-2 {
    width: 500px;
    height: 500px;
    background: #854d0e;
    bottom: -150px;
    right: -100px;
    animation-delay: -5s;
  }
  .vip-card:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  }
  .vip-card.gold:hover {
    transform: translateY(-10px) scale(1.08) !important;
  }
  .btn-vip-action:hover {
    transform: scale(1.05);
    box-shadow: 0 0 40px rgba(234, 179, 8, 0.8) !important;
  }
</style>
