<script>
  import { onMount } from "svelte";
  import { CASHPOT_FIGMA_SPEC } from "./cashpotTestSpec.js";

  // ── Responsive Viewport + Pure Figma State ──
  let windowWidth = typeof window !== "undefined" ? window.innerWidth : 1440;
  let activePage = "home"; // home | category | jackpots | live-rtp | live-casino | vip | vip-mecanica | shop-premii | shop-misiuni | design-system
  let authMode = "logged-in"; // logged-in | pre-login | pre-lander
  let viewportMode = "desktop"; // desktop | mobile
  let activeModal = null; // null | search | balance | deposit-missions | providers | burger | account | vip | prize-drawer | prize | shop-popup | login-existing
  let selectedPrize = null;

  // ── Page & Modal Interactive State ──────────────────────────────
  let activeCategoryId = "lobby";
  let selectedProvider = "Toți";
  let selectedProvidersMulti = new Set();
  let draftProvidersMulti = new Set();
  let providerSearchQuery = "";
  let sortMode = "Alfabetic A-Z";
  let showSortDropdown = false;
  let liveCasinoTab = "toate-live";
  let bannerOffset = 0;
  let openAccordions = new Set();
  let openFaqIdx = 0;
  let showRtpTooltip = false;
  let searchQuery = "";
  let spotlightIdx = 0;
  let heroSignupEmail = "";
  let selectedDeposit = 100;
  let selectedDepositBonusId = "b125";
  let shopPoints = 241604;
  let openAccountAccs = new Set(["setari-acc"]);
  let collapsedBalSections = new Set();
  let activeDrawerCategory = "Bani Bonus";
  let showStreakBanner = true;
  let activeVipModalId = "rewards";
  let activeShopPopupId = "upsell";
  let popupFeedbackText = "";
  let popupRatingChoice = "positive";
  let shopEmailCheck = "andrei.pop@email.ro";
  let loginEmail = "andrei.pop@email.ro";
  let loginPassword = "••••••••";
  let sportTabActive = false;
  let toastText = "";
  let toastTimer = null;

  // Carousel DOM refs
  let bannersRowEl;
  let catScrollEl;
  let populareRowEl;
  let recRowEl;
  let top10RowEl;
  let jpGamesRowEl;
  let jpCardsRowEl;
  let providersRowEl;
  let themesRowEl;
  let showcaseRowEl;

  function toast(msg) {
    toastText = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastText = "";
    }, 2400);
  }

  function scrollStrip(el, px) {
    el?.scrollBy({ left: px, behavior: "smooth" });
  }

  function toggleAccordion(name) {
    const next = new Set(openAccordions);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    openAccordions = next;
  }

  function toggleAccountAcc(id) {
    const next = new Set(openAccountAccs);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    openAccountAccs = next;
  }

  function toggleBalSection(id) {
    const next = new Set(collapsedBalSections);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    collapsedBalSections = next;
  }

  function balIconSvg(key) {
    return CASHPOT_FIGMA_SPEC.balanceDrawerData?.icons?.[key] || null;
  }

  // Axis-lock nested horizontal carousels against 2D scroll tremble on mobile touch
  function lockStripScroll(node) {
    const STRIP_SEL =
      ".ft-games-strip, .ft-top10-strip, .ft-jp-cards-strip, .ft-themes-strip, .ft-catbar-scroll, .ft-live-catbar-scroll, .ft-sec-banners-row, .ft-providers-grid, .ft-showcase-rows, .ft-claimed-strip, .ft-bal-thumbs, .ft-dep-bstrip";
    let strip = null;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let axis = null;

    const reset = () => {
      if (strip) strip.classList.remove("is-axis-locked-x");
      node.classList.remove("is-axis-locked-y");
      strip = null;
      axis = null;
    };

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      strip = e.target?.closest?.(STRIP_SEL) || null;
      if (!strip) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startLeft = strip.scrollLeft;
      axis = null;
    };

    const onTouchMove = (e) => {
      if (!strip || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (axis === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        axis = Math.abs(dy) >= Math.abs(dx) ? "y" : "x";
        if (axis === "y") {
          strip.classList.add("is-axis-locked-x");
          strip.scrollLeft = startLeft;
        } else {
          node.classList.add("is-axis-locked-y");
        }
      }
    };

    node.addEventListener("touchstart", onTouchStart, { passive: true });
    node.addEventListener("touchmove", onTouchMove, { passive: true });
    node.addEventListener("touchend", reset, { passive: true });
    node.addEventListener("touchcancel", reset, { passive: true });
    return {
      destroy() {
        node.removeEventListener("touchstart", onTouchStart);
        node.removeEventListener("touchmove", onTouchMove);
        node.removeEventListener("touchend", reset);
        node.removeEventListener("touchcancel", reset);
      },
    };
  }

  function applySubHash() {
    if (typeof window === "undefined") return;
    const h = window.location.hash || "";
    if (!h.startsWith("#cashpot-test/")) return;
    const sub = h.slice("#cashpot-test/".length).split("?")[0];
    if (sub === "prelander") authMode = "pre-lander";
    else if (sub === "pre-login") authMode = "pre-login";
    else if (sub === "mobile") viewportMode = "mobile";
    else if (sub === "desktop") viewportMode = "desktop";
    else if (sub === "shop") { authMode = "logged-in"; activePage = "shop-premii"; }
    else if (sub === "vip") { authMode = "logged-in"; activePage = "vip"; }
    else if (["vip-mecanica", "shop-misiuni", "jackpots", "live-rtp", "live-casino", "category", "design-system"].includes(sub)) {
      authMode = "logged-in";
      activePage = sub;
    }
  }

  onMount(() => {
    applySubHash();
    const onResize = () => {
      // Width-only update ignores mobile browser bar height animations during scroll
      if (Math.abs(window.innerWidth - windowWidth) > 2) {
        windowWidth = window.innerWidth;
      }
    };
    window.addEventListener("hashchange", applySubHash);
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("hashchange", applySubHash);
      window.removeEventListener("resize", onResize);
    };
  });

  function selectCategoryTab(tab) {
    sportTabActive = false;
    activeCategoryId = tab.id;
    if (tab.id === "lobby") {
      activePage = "home";
      return;
    }
    if (tab.id === "jackpot-uri") {
      activePage = "jackpots";
      return;
    }
    if (tab.id === "live-rtp") {
      activePage = "live-rtp";
      return;
    }
    if (tab.id === "teme-jocuri") {
      activePage = "home";
      setTimeout(() => {
        document.getElementById("ft-themes-section")?.scrollIntoView({ behavior: "smooth" });
      }, 40);
      return;
    }
    activePage = "category";
  }

  function openLiveRtp(target = "all") {
    sportTabActive = false;
    activeCategoryId = "live-rtp";
    activePage = "live-rtp";
    if (target !== "all") {
      setTimeout(() => {
        document.getElementById(`ft-rtp-${target}`)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }

  function openJackpotsLobby() {
    sportTabActive = false;
    activeCategoryId = "jackpot-uri";
    activePage = "jackpots";
  }

  function openProviderModal() {
    draftProvidersMulti = new Set(selectedProvidersMulti);
    providerSearchQuery = "";
    activeModal = "providers";
  }

  function toggleDraftProvider(name) {
    const next = new Set(draftProvidersMulti);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    draftProvidersMulti = next;
  }

  function toggleMultiProvider(name) {
    const next = new Set(selectedProvidersMulti);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    selectedProvidersMulti = next;
  }

  function applyProviderFilter() {
    selectedProvidersMulti = new Set(draftProvidersMulti);
    selectedProvider = "Toți";
    if (activePage !== "jackpots") activePage = "category";
    activeModal = null;
  }

  function openPrize(prize) {
    selectedPrize = prize;
    activeModal = "prize";
  }

  function openPrizeDrawer(category = "Bani Bonus") {
    activeDrawerCategory = category;
    activeModal = "prize-drawer";
  }

  function openVipModal(id = "rewards") {
    activeVipModalId = id;
    activeModal = "vip";
  }

  function openShopPopup(id = "upsell") {
    activeShopPopupId = id;
    activeModal = "shop-popup";
  }

  function navigateToSidebarItem(label) {
    sportTabActive = false;
    if (label === "Slots") {
      activeCategoryId = "lobby";
      activePage = "home";
    } else if (label === "Cazino Live") {
      activePage = "live-casino";
    } else if (label === "VIP Club") {
      activePage = "vip";
    } else if (label === "Live RTP") {
      openLiveRtp("all");
    } else if (label === "Balanță") {
      activeModal = "balance";
    } else if (label === "Depunere") {
      activeModal = "deposit-missions";
    } else if (label === "Turnee" || label === "Bonusurile mele") {
      activePage = "shop-misiuni";
    } else if (label === "Sport" || label === "Loto") {
      if (label === "Sport") sportTabActive = true;
      toast(`${label} · CashPot`);
    } else {
      toast(label);
    }
  }

  // Derived responsive & catalog state
  $: isLoggedIn = authMode === "logged-in";
  $: isPreLander = authMode === "pre-lander";
  $: isMobile = viewportMode === "mobile" || windowWidth <= 860;
  $: isPhonePreview = viewportMode === "mobile" && windowWidth > 860;

  $: rtpFlatPool = (CASHPOT_FIGMA_SPEC.liveRtpPageSections || []).flatMap((s) => s.cards || []);

  $: allSearchPool = [
    ...CASHPOT_FIGMA_SPEC.populareGames,
    ...CASHPOT_FIGMA_SPEC.jackpotRowGames,
    ...CASHPOT_FIGMA_SPEC.categoryPageGames,
    ...rtpFlatPool,
  ].filter((g, i, arr) => arr.findIndex((x) => x.title === g.title) === i);

  $: searchSpotlights = allSearchPool.slice(0, 6);
  $: activeSpotlight =
    searchSpotlights[spotlightIdx % Math.max(1, searchSpotlights.length)] ||
    CASHPOT_FIGMA_SPEC.populareGames[0];

  $: filteredSearchGames = allSearchPool
    .filter((g) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        (g.provider || "").toLowerCase().includes(q)
      );
    })
    .slice(0, 12);

  $: activeTabObj =
    CASHPOT_FIGMA_SPEC.categoryTabs.find((t) => t.id === activeCategoryId) ||
    CASHPOT_FIGMA_SPEC.categoryTabs[0];

  $: categoryPoolByTab = (() => {
    if (activeCategoryId === "hot") {
      return [...CASHPOT_FIGMA_SPEC.populareGames, ...(CASHPOT_FIGMA_SPEC.liveRtpPageSections[0]?.cards || [])];
    }
    if (activeCategoryId === "superslots" || activeCategoryId === "bell-link" || activeCategoryId === "clover-chance") {
      const kw = activeCategoryId === "bell-link" ? "bell" : activeCategoryId === "clover-chance" ? "clover" : "";
      const matched = allSearchPool.filter((g) => !kw || g.title.toLowerCase().includes(kw) || (g.provider || "").includes("EGT"));
      return matched.length ? matched : CASHPOT_FIGMA_SPEC.jackpotRowGames;
    }
    if (activeCategoryId === "jocuri-noi") {
      return CASHPOT_FIGMA_SPEC.categoryPageGames;
    }
    if (activeCategoryId === "cump-r-speciale" || activeCategoryId === "megaways") {
      const prag = allSearchPool.filter((g) => /pragmatic|olympus|sweet|bass|sugar/i.test(`${g.title} ${g.provider}`));
      return prag.length ? prag : allSearchPool.slice(0, 24);
    }
    return allSearchPool;
  })().filter((g, i, arr) => arr.findIndex((x) => x.title === g.title) === i);

  $: filteredCategoryGames = (() => {
    const base = categoryPoolByTab.filter((g) => {
      if (selectedProvidersMulti.size > 0 && !selectedProvidersMulti.has(g.provider)) return false;
      if (selectedProvider !== "Toți" && selectedProvidersMulti.size === 0 && g.provider !== selectedProvider) return false;
      return true;
    });
    if (sortMode === "Alfabetic Z-A") return [...base].sort((a, b) => b.title.localeCompare(a.title));
    if (sortMode === "Alfabetic A-Z") return [...base].sort((a, b) => a.title.localeCompare(b.title));
    return base;
  })();

  $: providerTilesByName = new Map(
    CASHPOT_FIGMA_SPEC.providersColumns.flat().map((p) => [p.name, p.img])
  );

  // Dev note 2336:36247: Show ONLY providers with >=1 game in the current category (A–Z + "0-9")
  $: groupedProvidersModal = (() => {
    const counts = new Map();
    const pool = activePage === "category" ? categoryPoolByTab : allSearchPool;
    for (const g of pool) {
      if (!g.provider) continue;
      counts.set(g.provider, (counts.get(g.provider) || 0) + 1);
    }
    if (activePage === "jackpots") {
      for (const jp of CASHPOT_FIGMA_SPEC.jackpotCardsLobby) {
        if (jp.provider) counts.set(jp.provider, (counts.get(jp.provider) || 0) + 1);
      }
    }
    const baseList = [...counts.keys()].sort((a, b) => a.localeCompare(b));
    const q = providerSearchQuery.trim().toLowerCase();
    const filtered = baseList.filter((n) => !q || n.toLowerCase().includes(q));
    const map = new Map();
    for (const name of filtered) {
      const first = name[0].toUpperCase();
      const bucket = /^\d/.test(first) ? "0-9" : first;
      if (!map.has(bucket)) map.set(bucket, []);
      map.get(bucket).push({ name, count: counts.get(name) || 1, img: providerTilesByName.get(name) || "" });
    }
    return [...map.entries()].sort(([a], [b]) => (a === "0-9" ? -1 : b === "0-9" ? 1 : a.localeCompare(b)));
  })();

  $: filteredJackpotsLobby = (() => {
    const base = CASHPOT_FIGMA_SPEC.jackpotCardsLobby.filter((jp) => {
      if (selectedProvidersMulti.size > 0 && !selectedProvidersMulti.has(jp.provider)) return false;
      if (selectedProvider !== "Toți" && selectedProvidersMulti.size === 0 && jp.provider !== selectedProvider) return false;
      return true;
    });
    if (sortMode === "Alfabetic Z-A") return [...base].sort((a, b) => b.brand.localeCompare(a.brand));
    if (sortMode === "Alfabetic A-Z") return [...base].sort((a, b) => a.brand.localeCompare(b.brand));
    return base;
  })();

  $: liveCasinoRowsFiltered = (() => {
    const rows = CASHPOT_FIGMA_SPEC.liveCasinoRows || [];
    if (liveCasinoTab === "toate-live") return rows;
    const kwMap = { ruleta: /rulet|roulette/i, blackjack: /blackjack/i, baccarat: /baccarat/i };
    const rx = kwMap[liveCasinoTab];
    if (!rx) return rows;
    const matched = rows
      .map((r) => {
        if (rx.test(r.title)) return r;
        const games = r.games.filter((g) => rx.test(g.title));
        return games.length ? { ...r, games } : null;
      })
      .filter(Boolean);
    return matched.length ? matched : rows;
  })();

  $: activeDrawerData =
    (CASHPOT_FIGMA_SPEC.shopData.prizeDrawers || []).find((d) => d.category === activeDrawerCategory) ||
    CASHPOT_FIGMA_SPEC.shopData.prizeDrawers?.[0] ||
    { category: "Premii VIP", items: [] };

  $: activeShopPopupData =
    (CASHPOT_FIGMA_SPEC.shopData.shopPopups || []).find((p) => p.id === activeShopPopupId) ||
    CASHPOT_FIGMA_SPEC.shopData.shopPopups?.[0];
</script>

{#snippet figmaIcon(svg, size = 18)}
  {#if svg?.shapes?.length}
    <svg
      viewBox={svg.vb || "0 0 24 24"}
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      class="ft-svg-icon"
    >
      {#each svg.shapes as sh, idx}
        <g transform="matrix({sh.m.join(',')})">
          <path
            d={sh.d}
            fill="currentColor"
            fill-rule={sh.rule || "nonzero"}
            fill-opacity={svg.shapes.length >= 2 && idx === 0 ? Math.min(sh.fillOpacity ?? 1, 0.52) : (sh.fillOpacity ?? 1)}
          />
        </g>
      {/each}
    </svg>
  {/if}
{/snippet}

{#snippet topNavHeader()}
  <!-- ═══════════════ TOP NAV (DESKTOP 1888x70 r=24 | MOBILE 360x60 MARK+ACTIONS) ═══════════════ -->
  <header class="ft-topnav-outer {isMobile ? 'is-mob' : ''}">
    <div class="ft-topnav {isMobile ? 'is-mob' : ''}">
      <div class="ft-tn-left">
        <button
          type="button"
          class="ft-logo-btn"
          on:click={() => {
            if (isPreLander) authMode = "logged-in";
            activeCategoryId = "lobby";
            activePage = "home";
            activeModal = null;
          }}
          aria-label="CashPot Acasă"
        >
          {#if isMobile && CASHPOT_FIGMA_SPEC.headerAssets.mobileLogoMark}
            <img src={CASHPOT_FIGMA_SPEC.headerAssets.mobileLogoMark} alt="CashPot" class="ft-logo-mark-mob" />
          {:else}
            <img src={CASHPOT_FIGMA_SPEC.headerAssets.logo} alt="CashPot" />
          {/if}
        </button>
      </div>

      {#if !isMobile}
        <button type="button" class="ft-search-pill" on:click={() => (activeModal = "search")}>
          {@render figmaIcon(CASHPOT_FIGMA_SPEC.topNavIcons.search, 18)}
          <span>Caută jocuri, furnizori sau categorii</span>
        </button>
      {/if}

      <div class="ft-tn-actions {isMobile ? 'is-mob' : ''}">
        {#if isLoggedIn && !isPreLander}
          <button
            type="button"
            class="ft-tn-iconbtn {isMobile ? 'is-mob' : ''}"
            title="Shop & Promoții"
            on:click={() => { activeModal = null; activePage = "shop-premii"; }}
          >
            <img src={CASHPOT_FIGMA_SPEC.headerAssets.promotionsIcon} alt="Promoții" />
            <span class="ft-red-badge">1</span>
          </button>

          <button
            type="button"
            class="ft-tn-iconbtn {isMobile ? 'is-mob' : ''}"
            title="Contul meu"
            on:click={() => (activeModal = "account")}
          >
            <img src={CASHPOT_FIGMA_SPEC.headerAssets.smarticoAvatar} alt="Smartico" class="is-avatar" />
            <span class="ft-red-badge">{isMobile ? "3" : "1"}</span>
          </button>

          <div class="ft-balance-capsule {isMobile ? 'is-mob' : ''}">
            <button
              type="button"
              class="ft-plus-circle {isMobile ? 'is-mob' : ''}"
              aria-label="Depunere rapidă"
              on:click={() => (activeModal = "deposit-missions")}
            >
              {@render figmaIcon(CASHPOT_FIGMA_SPEC.topNavIcons.plus, isMobile ? 12 : 14)}
            </button>
            <button
              type="button"
              class="ft-balance-readout {isMobile ? 'is-mob' : ''}"
              on:click={() => (activeModal = "balance")}
            >
              <strong>999,999.99</strong>
              <span>RON</span>
              {@render figmaIcon(CASHPOT_FIGMA_SPEC.topNavIcons.chevronDown, 12)}
            </button>
            <span class="ft-bal-dot" aria-hidden="true"></span>
          </div>

          {#if isMobile}
            <button
              type="button"
              class="ft-mob-searchbtn"
              aria-label="Caută"
              on:click={() => (activeModal = "search")}
            >
              {@render figmaIcon(CASHPOT_FIGMA_SPEC.topNavIcons.search, 16)}
            </button>
          {/if}
        {:else}
          <button
            type="button"
            class="ft-btn-outline {isMobile ? 'is-sm' : ''}"
            on:click={() => (activeModal = "login-existing")}
          >Conectare</button>
          <button
            type="button"
            class="ft-btn-gold {isMobile ? 'is-sm' : ''}"
            on:click={() => { authMode = "logged-in"; toast("Cont activat · Bun venit!"); }}
          >Înregistrare</button>
          {#if isMobile}
            <button
              type="button"
              class="ft-mob-searchbtn"
              aria-label="Caută"
              on:click={() => (activeModal = "search")}
            >
              {@render figmaIcon(CASHPOT_FIGMA_SPEC.topNavIcons.search, 16)}
            </button>
          {/if}
        {/if}
      </div>
    </div>
  </header>
{/snippet}

{#snippet mobileBottomNavBar()}
  {#if isMobile}
    <nav class="ft-mob-bnav" aria-label="Navigare Mobile Figma">
      <button
        type="button"
        class="ft-mb-tab {!activeModal && activePage === 'home' && !sportTabActive && !isPreLander ? 'active' : ''}"
        on:click={() => {
          if (isPreLander) authMode = "logged-in";
          sportTabActive = false;
          activeModal = null;
          activeCategoryId = "lobby";
          activePage = "home";
        }}
      >
        {@render figmaIcon(CASHPOT_FIGMA_SPEC.mobileBottomNav.tabs[0].svg, 20)}
        <span>Slots</span>
      </button>
      <button
        type="button"
        class="ft-mb-tab {!activeModal && activePage === 'live-casino' ? 'active' : ''}"
        on:click={() => {
          if (isPreLander) authMode = "logged-in";
          sportTabActive = false;
          activeModal = null;
          activePage = "live-casino";
        }}
      >
        {@render figmaIcon(CASHPOT_FIGMA_SPEC.mobileBottomNav.tabs[1].svg, 20)}
        <span>Live</span>
      </button>
      <button
        type="button"
        class="ft-mb-menu {activeModal === 'burger' || activeModal === 'account' ? 'is-open' : ''}"
        aria-label={activeModal === "burger" || activeModal === "account" ? "Închide meniul" : "Meniu"}
        on:click={() => (activeModal = activeModal === "burger" || activeModal === "account" ? null : "burger")}
      >
        {#if activeModal === "burger" || activeModal === "account"}
          <span style="font-size: 18px; line-height: 1;">✕</span>
        {:else}
          {@render figmaIcon(CASHPOT_FIGMA_SPEC.mobileBottomNav.tabs[2].svg, 22)}
        {/if}
      </button>
      <button
        type="button"
        class="ft-mb-tab {!activeModal && sportTabActive ? 'active' : ''}"
        on:click={() => {
          activeModal = null;
          sportTabActive = true;
          toast("Sport · secțiune pariuri CashPot");
        }}
      >
        {@render figmaIcon(CASHPOT_FIGMA_SPEC.mobileBottomNav.tabs[3].svg, 20)}
        <span>Sport</span>
      </button>
      <button
        type="button"
        class="ft-mb-tab {activeModal === 'account' || activeModal === 'login-existing' ? 'active' : ''}"
        on:click={() => {
          if (isLoggedIn && !isPreLander) {
            activeModal = activeModal === "account" ? null : "account";
          } else {
            activeModal = "login-existing";
          }
        }}
      >
        {@render figmaIcon(CASHPOT_FIGMA_SPEC.mobileBottomNav.tabs[4].svg, 20)}
        <span>Cont</span>
      </button>
    </nav>
  {/if}
{/snippet}

{#snippet vipHpWidgetCard(mobileBanner = false)}
  <button
    type="button"
    class="ft-vip-hp-widget {mobileBanner ? 'is-mob-full' : ''}"
    on:click={() => (activePage = "shop-premii")}
  >
    <img src={CASHPOT_FIGMA_SPEC.recommendedEntry && mobileBanner ? (CASHPOT_FIGMA_SPEC.headerAssets.mobileVipHpWidgetImg || CASHPOT_FIGMA_SPEC.recommendedEntry.widgetImg) : CASHPOT_FIGMA_SPEC.recommendedEntry.widgetImg}
      alt="Bentley Continental"
      class="ft-vw-bg"
      decoding="async"
    />
    <div class="ft-vw-overlay {mobileBanner ? 'is-mob-full' : ''}">
      {#if mobileBanner}
        <span class="ft-vw-pill">{CASHPOT_FIGMA_SPEC.recommendedEntry?.widgetTexts?.[0] || "MISIUNI ZILNICE"}</span>
        <strong class="ft-vw-goldtitle">Bentley Continental + premii de peste 1M Euro</strong>
        <span class="ft-vw-cta">Câștigă puncte</span>
        {#if isLoggedIn}
          <div class="ft-vw-pts">
            <span>Punctele tale</span>
            <strong class="is-gold">{shopPoints.toLocaleString("ro-RO")}</strong>
          </div>
        {/if}
      {:else}
        <span class="ft-banner-tag">{CASHPOT_FIGMA_SPEC.recommendedEntry?.widgetTexts?.[0] || "MISIUNI ZILNICE"}</span>
        <strong>Bentley Continental + premii de peste 1M Euro</strong>
        {#if isLoggedIn}
          <div class="ft-vw-pts">
            <span>Punctele tale</span>
            <strong class="is-gold">214</strong>
          </div>
        {/if}
        <span class="ft-vw-cta">Câștigă puncte</span>
      {/if}
    </div>
  </button>
{/snippet}

{#snippet secondaryBannersStrip()}
  <section class="ft-sec-banners">
    <div class="ft-sec-banners-row {isMobile ? 'is-mob' : ''}" bind:this={bannersRowEl}>
      {#each CASHPOT_FIGMA_SPEC.secondaryBanners as b}
        <div class="ft-sec-banner-card {isMobile ? 'is-mob' : ''}">
          <img src={b.img} alt={b.title} class="ft-banner-bg" decoding="async" />
          <div class="ft-banner-scrim">
            <span class="ft-banner-tag">{b.tag}</span>
            <h3>{b.title}</h3>
            {#if b.sub}<p>{b.sub}</p>{/if}
            <button type="button" class="ft-banner-purple-cta" on:click={() => (activePage = "shop-premii")}>
              {b.cta}
            </button>
          </div>
        </div>
      {/each}
    </div>
    {#if !isMobile}
      <button type="button" class="ft-edge-arrow left" aria-label="Înapoi" on:click={() => { scrollStrip(bannersRowEl, -400); bannerOffset = Math.max(0, bannerOffset - 1); }}>‹</button>
      <button type="button" class="ft-edge-arrow right" aria-label="Înainte" on:click={() => { scrollStrip(bannersRowEl, 400); bannerOffset = Math.min(4, bannerOffset + 1); }}>›</button>
    {/if}
    <div class="ft-dots">
      {#each [0, 1, 2, 3, 4] as d}
        <span class="ft-dot {bannerOffset === d ? 'active' : ''}"></span>
      {/each}
    </div>
  </section>
{/snippet}

{#snippet categoryBarStrip()}
  <div class="ft-catbar {isMobile ? 'is-mob' : ''}">
    <div class="ft-catbar-scroll" bind:this={catScrollEl}>
      {#each CASHPOT_FIGMA_SPEC.categoryTabs as tab}
        {@const tabActive =
          (tab.id === "lobby" && activePage === "home" && activeCategoryId === "lobby") ||
          (tab.id === "jackpot-uri" && activePage === "jackpots") ||
          (tab.id !== "lobby" && tab.id !== "jackpot-uri" && activeCategoryId === tab.id && activePage === "category")}
        <button
          type="button"
          class="ft-cat-tile {isMobile ? 'is-mob' : ''} {tabActive ? 'active' : ''}"
          on:click={() => selectCategoryTab(tab)}
        >
          {@render figmaIcon(tab.svg, isMobile ? 16 : 18)}
          <span>{tab.label}</span>
        </button>
      {/each}
    </div>
    {#if !isMobile}
      <div class="ft-catbar-fade" aria-hidden="true"></div>
      <div class="ft-catbar-arrows">
        <button type="button" class="ft-round-arrow" aria-label="Stânga" on:click={() => scrollStrip(catScrollEl, -280)}>‹</button>
        <button type="button" class="ft-round-arrow" aria-label="Dreapta" on:click={() => scrollStrip(catScrollEl, 280)}>›</button>
      </div>
    {/if}
  </div>
{/snippet}

{#snippet jackpotCardItem(jp, lobbyMode = false)}
  <div class="ft-jp-card {lobbyMode ? 'is-lobby' : ''}" style="--jp-bg: {jp.bg}; --jp-bg2: {jp.bg2}; --jp-glow: {jp.glow};">
    <div class="ft-jp-glow" aria-hidden="true"></div>
    <div class="ft-jp-brand">
      <img src={jp.logoImg} alt={jp.brand} />
      <span>{jp.provider}</span>
    </div>

    <div class="ft-jp-tiers">
      <div class="ft-jp-row is-grand">
        <img src={jp.tiers.grand.icon} alt="Grand" />
        <div class="ft-jp-row-txt">
          <span>Grand</span>
          <strong>{jp.tiers.grand.amount}</strong>
        </div>
        <span class="ft-jp-status">{jp.badge}</span>
      </div>
      <div class="ft-jp-row">
        <img src={jp.tiers.major.icon} alt="Major" />
        <div class="ft-jp-row-txt">
          <span>Major</span>
          <strong>{jp.tiers.major.amount}</strong>
        </div>
      </div>
      <div class="ft-jp-split">
        <div class="ft-jp-row is-mini">
          <img src={jp.tiers.minor.icon} alt="Minor" />
          <div class="ft-jp-row-txt">
            <span>Minor</span>
            <strong>{jp.tiers.minor.amount}</strong>
          </div>
        </div>
        <div class="ft-jp-row is-mini">
          <img src={jp.tiers.mini.icon} alt="Mini" />
          <div class="ft-jp-row-txt">
            <span>Mini</span>
            <strong>{jp.tiers.mini.amount}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="ft-jp-thumbs">
      {#each jp.thumbs as th}
        <img src={th} alt={jp.brand} loading="lazy" decoding="async" />
      {/each}
    </div>

    <button
      type="button"
      class="ft-jp-purple-cta"
      on:click={() => {
        selectedProvider = jp.provider;
        if (lobbyMode) {
          activeCategoryId = "superslots";
          activePage = "category";
        } else {
          openJackpotsLobby();
        }
      }}
    >
      {jp.ctaText}
    </button>
  </div>
{/snippet}

{#snippet categoryActionHeader(headingText, iconSvg)}
  <div class="ft-cat-sechead {isMobile ? 'is-mob' : ''}">
    <div class="ft-sec-title">
      {@render figmaIcon(iconSvg, 20)}
      <h2>{headingText}</h2>
    </div>

    <div class="ft-cat-actions">
      <button type="button" class="ft-cat-ctrlbtn {isMobile ? 'is-mob' : ''}" on:click={openProviderModal}>
        <span>{selectedProvidersMulti.size ? `Furnizori (${selectedProvidersMulti.size})` : "Furnizori"}</span>
        {@render figmaIcon(CASHPOT_FIGMA_SPEC.topNavIcons.chevronDown, 12)}
      </button>

      <div class="ft-sort-wrap">
        <button
          type="button"
          class="ft-cat-ctrlbtn {isMobile ? 'is-mob' : ''}"
          on:click={() => (showSortDropdown = !showSortDropdown)}
        >
          <span>{isMobile ? (sortMode === "Alfabetic Z-A" ? "Z-A" : "A-Z") : sortMode}</span>
          {@render figmaIcon(CASHPOT_FIGMA_SPEC.topNavIcons.chevronDown, 12)}
        </button>
        {#if showSortDropdown}
          <div class="ft-sort-menu" role="menu">
            {#each ["Alfabetic A-Z", "Alfabetic Z-A"] as opt}
              <button
                type="button"
                class="ft-sort-opt {sortMode === opt ? 'active' : ''}"
                on:click={() => { sortMode = opt; showSortDropdown = false; }}
              >{opt}</button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

  {#if selectedProvidersMulti.size > 0 || selectedProvider !== "Toți"}
    <div class="ft-filter-chips is-subbar">
      {#each [...selectedProvidersMulti] as pv}
        <button type="button" class="ft-chip-active" on:click={() => toggleMultiProvider(pv)}>
          {pv} ✕
        </button>
      {/each}
      {#if selectedProvider !== "Toți" && selectedProvidersMulti.size === 0}
        <button type="button" class="ft-chip-active" on:click={() => (selectedProvider = "Toți")}>
          {selectedProvider} ✕
        </button>
      {/if}
      <button type="button" class="ft-seeall" on:click={() => { selectedProvidersMulti = new Set(); selectedProvider = "Toți"; }}>
        Resetează
      </button>
    </div>
  {/if}
{/snippet}

{#snippet footerSection()}
  {@const fd = CASHPOT_FIGMA_SPEC.footerData}
  <footer class="ft-footer">
    <!-- USP Strip (2465:48627) -->
    <div class="ft-usp-grid {isMobile ? 'is-mob' : ''}">
      {#each fd?.uspItems || [] as usp}
        <div class="ft-usp-card">
          <span class="ft-usp-circle {isMobile ? 'is-mob' : ''}">
            {@render figmaIcon(usp.svg, isMobile ? 24 : 36)}
          </span>
          <span>{usp.text}</span>
        </div>
      {/each}
    </div>

    <div class="ft-footer-body {isMobile ? 'is-mob' : ''}">
      <div class="ft-footer-cols">
        <div class="ft-fcol">
          <h4>Meniu</h4>
          <div class="ft-flinks-2col">
            {#each ["Contact", "Despre Noi", "Politica de confidențialitate", "Joc responsabil", "Termeni și Condiții", "Întrebări frecvente", "Casierie", "Cum folosești un Freebet", "Ofertă de pariuri", "Regulament pariuri", "Pariuri pe numere", "Regulament Jocuri Virtuale", "Săli de Joc", "Decizie Licentiere", "Decizie Autorizare"] as lnk}
              <button type="button" class="ft-flink" on:click={() => toast(lnk)}>{lnk}</button>
            {/each}
          </div>
        </div>
        <div class="ft-fcol is-legal">
          <h4>Info</h4>
          <p>
            Site-ul și aplicația CashPot, parte din Winvia Entertainment Group, este deținut și operat de către Crowd Entertainment Limited, societate înmatricată conform legii societăţilor comerciale din Malta, cu sediul social în 2 Spinola Road, St. Julians STJ 3014, Malta, număr de înregistrare C97517. Licența nr. L1213823W001269, emisă de Comitetul de Supraveghere din cadrul O.N.J.N., valabilă din data de 01.03.2021 până la data de 28.02.2031 și autorizație de exploatare obținută prin Decizia nr. 312 din 10.04.2025.
          </p>
          <p>
            Cod unic de identificare fiscală 43557448, eliberat de Administrația Fiscală pentru Contribuabili Nerezidenți. Accesul la site-urile online cu jocuri pe bani reali este interzis în conformitate cu unele legislații naționale. Este responsabilitatea fiecărui jucător în parte de a se asigura că acționează în conformitate cu legislația în vigoare atunci când accesează site-ul și/sau aplicația CashPot.
          </p>
          <p>
            (18+) Jocurile de noroc pot crea dependență, vă rugăm să jucați în mod responsabil. Consultă cu încredere informațiile din secțiunea Joc Responsabil sau apelează la ajutor de specialitate aici: Clinica Aliat.
          </p>
        </div>
        {#if fd?.storeBadges?.length}
          <div class="ft-store-col">
            {#each fd.storeBadges as sb, idx}
              <button type="button" class="ft-store-badgebtn" on:click={() => { if (isPreLander) authMode = "logged-in"; activePage = "shop-premii"; }}>
                <img src={sb} alt={`CashPot App Store ${idx + 1}`} loading="lazy" decoding="async" />
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="ft-footer-bottom {isMobile ? 'is-mob' : ''}">
        <div class="ft-social-row">
          {#each fd?.socialIcons || [] as soc, idx}
            <button type="button" class="ft-social-btn" aria-label={idx === 0 ? "Instagram" : "Facebook"} on:click={() => toast(idx === 0 ? "Instagram CashPot" : "Facebook CashPot")}>
              {@render figmaIcon(soc, 20)}
            </button>
          {/each}
        </div>
        <div class="ft-regulators">
          <img src={fd?.onjn} alt="ONJN" />
          <img src={fd?.anpc} alt="ANPC" />
        </div>
      </div>
    </div>
  </footer>
{/snippet}

{#snippet sidebarInner(inDrawer = false)}
  <!-- 1. Featured Entries (3 vertical blue cards: Play Arena / Roata Norocului / Promoții) -->
  <div class="ft-sb-featured">
    {#each CASHPOT_FIGMA_SPEC.sidebarFeatured as card}
      <button
        type="button"
        class="ft-sb-feat-card"
        on:click={() => {
          if (card.id === "promo") activePage = "shop-premii";
          else toast(`${card.title.replace(/\n/g, " ")}`);
          if (inDrawer) activeModal = null;
        }}
      >
        <span class="ft-sb-feat-lbl">{card.title}</span>
        <img src={card.img} alt={card.title} />
      </button>
    {/each}
  </div>

  <!-- 2. VIP Progress Widget (268x62 inside Sidebar, Logat only!) -->
  {#if isLoggedIn}
    <button
      type="button"
      class="ft-sb-vip {activePage === 'vip' || activePage === 'vip-mecanica' ? 'active' : ''}"
      on:click={() => {
        activePage = "vip";
        if (inDrawer) activeModal = null;
      }}
    >
      <img src={CASHPOT_FIGMA_SPEC.vipClubData.levelStatus.badgeImg} alt="Argint 1" class="ft-sb-vip-badge" />
      <div class="ft-sb-vip-info">
        <div class="ft-sb-vip-top">
          <strong>{CASHPOT_FIGMA_SPEC.vipClubData.levelStatus.tierName}</strong>
          <span class="ft-sb-vip-pill">VIP Club</span>
        </div>
        <div class="ft-sb-vip-bot">
          <div class="ft-sb-vip-track"><div class="ft-sb-vip-fill" style="width: 70%;"></div></div>
          <span>{CASHPOT_FIGMA_SPEC.vipClubData.levelStatus.points}</span>
        </div>
      </div>
    </button>

    <!-- 3. Primary Gold Deposit Button (268x48) -->
    <button
      type="button"
      class="ft-sb-deposit"
      on:click={() => (activeModal = "deposit-missions")}
    >
      Depunere
    </button>
  {/if}

  <!-- 4. Group 1: Joc -->
  <div class="ft-sb-card">
    {#each CASHPOT_FIGMA_SPEC.sidebarGroups.joc as item}
      {@const isActive = (item.label === "Slots" && activePage === "home") || (item.label === "Cazino Live" && activePage === "live-casino")}
      <button
        type="button"
        class="ft-sb-item {isActive ? 'is-gold-active' : ''}"
        on:click={() => {
          if (isPreLander) authMode = "logged-in";
          navigateToSidebarItem(item.label);
          if (inDrawer) activeModal = null;
        }}
      >
        {@render figmaIcon(item.svg, 20)}
        <span>{item.label}</span>
      </button>
    {/each}
  </div>

  <!-- 5. Group 1b: Bonusuri (Logat) -->
  {#if isLoggedIn && CASHPOT_FIGMA_SPEC.sidebarGroups.jocOferteParent}
    <div class="ft-sb-card">
      <button
        type="button"
        class="ft-sb-item"
        on:click={() => toggleAccordion("Bonusuri")}
      >
        {@render figmaIcon(CASHPOT_FIGMA_SPEC.sidebarGroups.jocOferteParent.svg, 20)}
        <span>{CASHPOT_FIGMA_SPEC.sidebarGroups.jocOferteParent.label}</span>
        <span class="ft-sb-chev {openAccordions.has('Bonusuri') ? 'is-open' : ''}">▾</span>
      </button>
      {#if openAccordions.has("Bonusuri")}
        {#each CASHPOT_FIGMA_SPEC.sidebarGroups.jocOferteSub as sub}
          <button
            type="button"
            class="ft-sb-item is-sub"
            on:click={() => {
              navigateToSidebarItem(sub.label);
              if (inDrawer) activeModal = null;
            }}
          >
            <span>{sub.label}</span>
          </button>
        {/each}
      {/if}
    </div>
  {/if}

  <!-- 6. Group 2: Club & extra -->
  <div class="ft-sb-card">
    {#each CASHPOT_FIGMA_SPEC.sidebarGroups.clubExtra.filter((x) => isLoggedIn || x.label !== "Favorite") as item}
      {@const isActive =
        (item.label === "VIP Club" && (activePage === "vip" || activePage === "vip-mecanica")) ||
        (item.label === "Live RTP" && activePage === "live-rtp")}
      <button
        type="button"
        class="ft-sb-item {isActive ? 'is-active' : ''}"
        on:click={() => {
          if (isPreLander) authMode = "logged-in";
          navigateToSidebarItem(item.label);
          if (inDrawer) activeModal = null;
        }}
      >
        {@render figmaIcon(item.svg, 20)}
        <span>{item.label}</span>
        {#if item.badge}
          <span class="ft-sb-nou">{item.badge}</span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- 7. Plăți + Contul meu (Logat) -->
  {#if isLoggedIn}
    <div class="ft-sb-card">
      {#each CASHPOT_FIGMA_SPEC.sidebarGroups.plati as item}
        <button
          type="button"
          class="ft-sb-item"
          on:click={() => navigateToSidebarItem(item.label)}
        >
          {@render figmaIcon(item.svg, 20)}
          <span>{item.label}</span>
        </button>
      {/each}
    </div>

    <div class="ft-sb-card">
      {#each CASHPOT_FIGMA_SPEC.sidebarGroups.contulMeuTop as item}
        <button
          type="button"
          class="ft-sb-item"
          on:click={() => navigateToSidebarItem(item.label)}
        >
          {@render figmaIcon(item.svg, 20)}
          <span>{item.label}</span>
        </button>
      {/each}
      {#if CASHPOT_FIGMA_SPEC.sidebarGroups.istoricParent}
        <button type="button" class="ft-sb-item" on:click={() => toggleAccordion("Istoric")}>
          {@render figmaIcon(CASHPOT_FIGMA_SPEC.sidebarGroups.istoricParent.svg, 20)}
          <span>{CASHPOT_FIGMA_SPEC.sidebarGroups.istoricParent.label}</span>
          <span class="ft-sb-chev {openAccordions.has('Istoric') ? 'is-open' : ''}">▾</span>
        </button>
        {#if openAccordions.has("Istoric")}
          {#each CASHPOT_FIGMA_SPEC.sidebarGroups.istoricSub as sub}
            <button type="button" class="ft-sb-item is-sub" on:click={() => toast(sub.label)}>
              <span>{sub.label}</span>
            </button>
          {/each}
        {/if}
      {/if}
    </div>

    <div class="ft-sb-card">
      {#if CASHPOT_FIGMA_SPEC.sidebarGroups.setariParent}
        <button type="button" class="ft-sb-item" on:click={() => toggleAccordion("Setari")}>
          {@render figmaIcon(CASHPOT_FIGMA_SPEC.sidebarGroups.setariParent.svg, 20)}
          <span>{CASHPOT_FIGMA_SPEC.sidebarGroups.setariParent.label}</span>
          <span class="ft-sb-chev {openAccordions.has('Setari') ? 'is-open' : ''}">▾</span>
        </button>
        {#if openAccordions.has("Setari")}
          {#each CASHPOT_FIGMA_SPEC.sidebarGroups.setariSub as sub}
            <button type="button" class="ft-sb-item is-sub" on:click={() => toast(sub.label)}>
              <span>{sub.label}</span>
            </button>
          {/each}
        {/if}
      {/if}
      {#if CASHPOT_FIGMA_SPEC.sidebarGroups.asistenta}
        <button type="button" class="ft-sb-item" on:click={() => toast("Asistență Live Chat 24/7")}>
          {@render figmaIcon(CASHPOT_FIGMA_SPEC.sidebarGroups.asistenta.svg, 20)}
          <span>{CASHPOT_FIGMA_SPEC.sidebarGroups.asistenta.label}</span>
        </button>
      {/if}
    </div>
  {:else}
    <div class="ft-sb-card">
      {#if CASHPOT_FIGMA_SPEC.sidebarGroups.asistenta}
        <button type="button" class="ft-sb-item" on:click={() => toast("Asistență Live Chat 24/7")}>
          {@render figmaIcon(CASHPOT_FIGMA_SPEC.sidebarGroups.asistenta.svg, 20)}
          <span>{CASHPOT_FIGMA_SPEC.sidebarGroups.asistenta.label}</span>
        </button>
      {/if}
    </div>
  {/if}

  <!-- 8. Sidebar App Banner (268x106) -->
  <button
    type="button"
    class="ft-sb-app"
    on:click={() => {
      if (isPreLander) authMode = "logged-in";
      activePage = "shop-premii";
      if (inDrawer) activeModal = null;
    }}
  >
    <img src={CASHPOT_FIGMA_SPEC.sidebarAppBannerImg} alt="Descarcă aplicația CashPot" />
    <div class="ft-sb-app-overlay">
      <span class="ft-sb-app-title">Descarcă aplicația</span>
    </div>
  </button>
{/snippet}

<!-- ═══════════════ PURE CASHPOT_TEST.FIG VIEWPORT ═══════════════ -->
<div class="ft-canvas {isPhonePreview ? 'is-mobile-stage' : ''}">
  <div class="ft-viewport {isPhonePreview ? 'is-mobile-360' : 'is-desktop-1920'} {isMobile ? 'is-mobile-layout' : ''}">
    {@render topNavHeader()}

    <div class="ft-scroll-area {isMobile ? 'is-phone-scroll' : ''}" use:lockStripScroll>
      {#if isPreLander}
        <!-- ═══════════════ PRE-LANDER (2203:5518 & 2204:5886 MOBILE) ═══════════════ -->
        <div class="ft-body {isMobile ? 'is-mob' : ''}">
          {#if !isMobile}
            <aside class="ft-sidebar">
              {@render sidebarInner(false)}
            </aside>
          {/if}

          <main class="ft-main {isMobile ? 'is-mob' : ''}">
            <section class="ft-prelogin-hero {isMobile ? 'is-mob' : ''}">
              <div class="ft-ph-main">
                <img src={CASHPOT_FIGMA_SPEC.preloginHero.main.img} alt={CASHPOT_FIGMA_SPEC.preloginHero.main.title} class="ft-banner-bg" decoding="async" />
                <div class="ft-banner-scrim is-big">
                  <span class="ft-banner-tag">{CASHPOT_FIGMA_SPEC.prelanderData.hero.tag}</span>
                  <h1>{CASHPOT_FIGMA_SPEC.prelanderData.hero.title}</h1>
                  <div class="ft-hero-signup {isMobile ? 'is-mob' : ''}">
                    <input
                      type="email"
                      class="ft-hero-email"
                      placeholder="E-mail"
                      aria-label="E-mail"
                      bind:value={heroSignupEmail}
                    />
                    <button
                      type="button"
                      class="ft-btn-gold {isMobile ? 'is-sm' : 'is-lg'}"
                      on:click={() => { authMode = "logged-in"; toast("Înscriere realizată!"); }}
                    >
                      Înscrie-te
                    </button>
                  </div>
                </div>
              </div>
              {#if !isMobile}
                <div class="ft-ph-sides">
                  {#each CASHPOT_FIGMA_SPEC.preloginHero.sides as side}
                    <div class="ft-sec-banner-card is-side">
                      <img src={side.img} alt={side.title} class="ft-banner-bg" decoding="async" />
                      <div class="ft-banner-scrim">
                        <span class="ft-banner-tag">{side.tag}</span>
                        <h3>{side.title}</h3>
                        <p>{side.sub}</p>
                        <button type="button" class="ft-btn-gold is-sm" on:click={() => (authMode = "logged-in")}>
                          {side.cta}
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </section>

            <!-- Stepper înregistrare (2203:5889) -->
            <section class="ft-pl-stepper {isMobile ? 'is-mob' : ''}">
              {#each [
                ["1", "Înregistrează-te", "Îți faci contul în câțiva pași și alegi bonusul potrivit pentru tine."],
                ["2", "Fă o depunere", "Alimentezi contul și activezi bonusul de bun venit."],
                ["3", "Distrează-te", "Descoperă jocurile, jackpot-urile și promoțiile zilnice Cashpot."]
              ] as [num, title, desc]}
                <div class="ft-pl-step">
                  <span class="ft-pl-num">{num}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{desc}</p>
                  </div>
                </div>
              {/each}
            </section>

            <section class="ft-sec">
              <div class="ft-sec-head">
                <div class="ft-sec-title"><h2>Selecția Cashpot</h2></div>
              </div>
              <div class="ft-games-strip">
                {#each CASHPOT_FIGMA_SPEC.prelanderData.jocuriNoi as g}
                  <button type="button" class="ft-game-poster" on:click={() => toast(`Deschide ${g.title}`)}>
                    <img src={g.img} alt={g.title} loading="lazy" decoding="async" />
                    <span class="ft-game-hover"><span>Joacă</span></span>
                  </button>
                {/each}
              </div>
              <div class="ft-center-cta">
                <button type="button" class="ft-btn-gold is-wide-cta" on:click={() => { authMode = "logged-in"; activePage = "category"; }}>
                  Descoperă toate jocurile
                </button>
              </div>
            </section>

            <!-- Banner / Promoție (2203:5954) -->
            {#if CASHPOT_FIGMA_SPEC.prelanderData.featureBanners?.[0]}
              {@const b0 = CASHPOT_FIGMA_SPEC.prelanderData.featureBanners[0]}
              <section class="ft-pl-featbanner {isMobile ? 'is-mob' : ''}">
                <div class="ft-pl-fb-copy">
                  <span class="ft-banner-tag">{b0.texts[0] || "PROMOȚIA SĂPTĂMÂNII"}</span>
                  <h2>{b0.texts[1] || "[Titlu promoție]"}</h2>
                  <p>{b0.texts[2] || "[Descriere scurtă a promoției. Condițiile complete sunt în pagina promoției.]"}</p>
                  <button type="button" class="ft-btn-gold" on:click={() => { authMode = "logged-in"; activePage = "shop-premii"; }}>
                    {b0.texts[3] || "Vezi promoția"}
                  </button>
                </div>
                {#if b0.img}<img src={b0.img} alt="Promoție CashPot" class="ft-pl-fb-img" />{/if}
              </section>
            {/if}

            <section class="ft-sec">
              <div class="ft-sec-head">
                <div class="ft-sec-title"><h2>Jocuri populare</h2></div>
              </div>
              <div class="ft-games-grid {isMobile ? 'cols-mob' : ''}">
                {#each CASHPOT_FIGMA_SPEC.prelanderData.jocuriPopulare as g}
                  <button type="button" class="ft-game-poster is-grid" on:click={() => toast(`Deschide ${g.title}`)}>
                    <img src={g.img} alt={g.title} loading="lazy" decoding="async" />
                    <span class="ft-game-hover"><span>Joacă</span></span>
                  </button>
                {/each}
              </div>
              <div class="ft-center-cta">
                <button type="button" class="ft-btn-gold is-wide-cta" on:click={() => { authMode = "logged-in"; activePage = "home"; }}>
                  Vezi jocurile populare
                </button>
              </div>
            </section>

            <!-- Banner / Păcănele (2203:6056) & Banner / Cazino Live (2203:6194) -->
            <section class="ft-spotlights {isMobile ? 'is-mob' : ''}">
              {#each (CASHPOT_FIGMA_SPEC.prelanderData.featureBanners || []).slice(1) as fb, idx}
                <div class="ft-pl-featbanner is-compact {isMobile ? 'is-mob' : ''}">
                  <div class="ft-pl-fb-copy">
                    <span class="ft-banner-tag">{fb.texts[0]}</span>
                    <h3>{fb.texts[1]}</h3>
                    <p>{fb.texts[2]}</p>
                    {#if fb.texts.length > 4}
                      <ul class="ft-pl-bullets">
                        {#each fb.texts.slice(3, -1) as bul}
                          <li>{bul}</li>
                        {/each}
                      </ul>
                    {/if}
                    <button
                      type="button"
                      class="ft-btn-outline is-sm"
                      on:click={() => { authMode = "logged-in"; activePage = idx === 1 ? "live-casino" : "category"; }}
                    >
                      {fb.texts[fb.texts.length - 1] || "Vezi detalii"}
                    </button>
                  </div>
                  {#if fb.img}<img src={fb.img} alt={fb.texts[1]} class="ft-pl-fb-thumb" />{/if}
                </div>
              {/each}
            </section>

            {@render footerSection()}
          </main>
        </div>
      {:else}
        <!-- ═══════════════ BODY: 300px SIDEBAR + MAIN CONTENT ═══════════════ -->
        <div class="ft-body {isMobile ? 'is-mob' : ''}">
          {#if !isMobile}
            <aside class="ft-sidebar">
              {@render sidebarInner(false)}
            </aside>
          {/if}

          <main class="ft-main {isMobile ? 'is-mob' : ''}">
            {#if activePage === "home"}
              <!-- ── 1. HERO: LOGAT = SECONDARY CAROUSEL | NELOGAT = MAIN (+ 2 SIDE ON DESKTOP) ── -->
              {#if isLoggedIn}
                {@render secondaryBannersStrip()}
              {:else}
                <section class="ft-prelogin-hero {isMobile ? 'is-mob' : ''}">
                  <div class="ft-ph-main">
                    <img src={CASHPOT_FIGMA_SPEC.preloginHero.main.img} alt={CASHPOT_FIGMA_SPEC.preloginHero.main.title} class="ft-banner-bg" decoding="async" />
                    <div class="ft-banner-scrim is-big">
                      <span class="ft-banner-tag">{CASHPOT_FIGMA_SPEC.preloginHero.main.tag}</span>
                      <h1>{CASHPOT_FIGMA_SPEC.preloginHero.main.title}</h1>
                      <div class="ft-hero-signup {isMobile ? 'is-mob' : ''}">
                        <input
                          type="email"
                          class="ft-hero-email"
                          placeholder="E-mail"
                          aria-label="E-mail"
                          bind:value={heroSignupEmail}
                        />
                        <button
                          type="button"
                          class="ft-btn-gold {isMobile ? 'is-sm' : ''}"
                          on:click={() => { authMode = "logged-in"; toast("Înscriere realizată!"); }}
                        >
                          Înscrie-te
                        </button>
                      </div>
                    </div>
                  </div>
                  {#if !isMobile}
                    <div class="ft-ph-sides">
                      {#each CASHPOT_FIGMA_SPEC.preloginHero.sides as side}
                        <div class="ft-sec-banner-card is-side">
                          <img src={side.img} alt={side.title} class="ft-banner-bg" decoding="async" />
                          <div class="ft-banner-scrim">
                            <span class="ft-banner-tag">{side.tag}</span>
                            <h3>{side.title}</h3>
                            <p>{side.sub}</p>
                            <button type="button" class="ft-btn-gold is-sm" on:click={() => (authMode = "logged-in")}>
                              {side.cta}
                            </button>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </section>
              {/if}

              <!-- ── 2. CATEGORY TABS BAR ── -->
              {@render categoryBarStrip()}

              <!-- Figma 2508:15719: On Mobile 360, VIP HP widget sits directly between Category Bar and Recomandate -->
              {#if isMobile && CASHPOT_FIGMA_SPEC.recommendedEntry}
                {@render vipHpWidgetCard(true)}
                <section class="ft-sec">
                  <div class="ft-sec-head">
                    <div class="ft-sec-title">
                      <h2>{CASHPOT_FIGMA_SPEC.recommendedEntry.title}</h2>
                    </div>
                    <button type="button" class="ft-seeall" on:click={() => (activePage = "shop-premii")}>Vezi toate</button>
                  </div>
                  <div class="ft-games-strip" bind:this={recRowEl}>
                    {#each CASHPOT_FIGMA_SPEC.recommendedEntry.games as g}
                      <button type="button" class="ft-game-poster" on:click={() => toast(`Deschide ${g.title}`)}>
                        <img src={g.img} alt={g.title} loading="lazy" decoding="async" />
                        <span class="ft-game-hover"><span>Joacă</span></span>
                      </button>
                    {/each}
                  </div>
                </section>
              {/if}

              <!-- ── 3. HOT (2222:6395) ── -->
              <section class="ft-sec">
                <div class="ft-sec-head">
                  <div class="ft-sec-title">
                    {@render figmaIcon(CASHPOT_FIGMA_SPEC.categoryTabs[1]?.svg, isMobile ? 18 : 20)}
                    <h2>Hot</h2>
                  </div>
                  <div class="ft-sec-ctrls">
                    <button
                      type="button"
                      class="ft-seeall"
                      on:click={() => { activeCategoryId = "hot"; activePage = "category"; }}
                    >Vezi toate</button>
                    {#if !isMobile}
                      <button type="button" class="ft-round-arrow is-sm" aria-label="Înapoi" on:click={() => scrollStrip(populareRowEl, -450)}>‹</button>
                      <button type="button" class="ft-round-arrow is-sm" aria-label="Înainte" on:click={() => scrollStrip(populareRowEl, 450)}>›</button>
                    {/if}
                  </div>
                </div>
                <div class="ft-games-strip" bind:this={populareRowEl}>
                  {#each CASHPOT_FIGMA_SPEC.populareGames as g}
                    <button type="button" class="ft-game-poster" on:click={() => toast(`Deschide ${g.title} (${g.provider})`)}>
                      <img src={g.img} alt={g.title} loading="lazy" decoding="async" />
                      <span class="ft-game-hover"><span>Joacă</span></span>
                    </button>
                  {/each}
                </div>
              </section>

              <!-- ── 3B. RECOMANDATE + VIP SHOP WIDGET ON DESKTOP (2508:14852) ── -->
              {#if !isMobile && CASHPOT_FIGMA_SPEC.recommendedEntry}
                <section class="ft-sec">
                  <div class="ft-sec-head">
                    <div class="ft-sec-title">
                      <h2>{CASHPOT_FIGMA_SPEC.recommendedEntry.title}</h2>
                    </div>
                    <div class="ft-sec-ctrls">
                      <button type="button" class="ft-seeall" on:click={() => (activePage = "shop-premii")}>Vezi toate</button>
                      <button type="button" class="ft-round-arrow is-sm" aria-label="Înapoi" on:click={() => scrollStrip(recRowEl, -450)}>‹</button>
                      <button type="button" class="ft-round-arrow is-sm" aria-label="Înainte" on:click={() => scrollStrip(recRowEl, 450)}>›</button>
                    </div>
                  </div>
                  <div class="ft-games-strip" bind:this={recRowEl}>
                    {@render vipHpWidgetCard(false)}
                    {#each CASHPOT_FIGMA_SPEC.recommendedEntry.games as g}
                      <button type="button" class="ft-game-poster" on:click={() => toast(`Deschide ${g.title}`)}>
                        <img src={g.img} alt={g.title} loading="lazy" decoding="async" />
                        <span class="ft-game-hover"><span>Joacă</span></span>
                      </button>
                    {/each}
                  </div>
                </section>
              {/if}

              <!-- ── 4. TOP 10 PĂCĂNELE 2026 (2222:6414 & 2222:8386) ── -->
              <section class="ft-sec">
                <div class="ft-sec-head">
                  <div class="ft-sec-title">
                    <h2>Top 10 Păcănele 2026</h2>
                  </div>
                  {#if !isMobile}
                    <div class="ft-sec-ctrls">
                      <button type="button" class="ft-seeall" on:click={() => { activeCategoryId = "hot"; activePage = "category"; }}>Vezi toate</button>
                      <button type="button" class="ft-round-arrow is-sm" aria-label="Înapoi" on:click={() => scrollStrip(top10RowEl, -540)}>‹</button>
                      <button type="button" class="ft-round-arrow is-sm" aria-label="Înainte" on:click={() => scrollStrip(top10RowEl, 540)}>›</button>
                    </div>
                  {/if}
                </div>
                <div class="ft-top10-strip" bind:this={top10RowEl}>
                  {#each CASHPOT_FIGMA_SPEC.top10Games as t10}
                    <button type="button" class="ft-top10-item" on:click={() => toast(`Top #${t10.rank} · ${t10.title}`)}>
                      <span class="ft-top10-rank">{t10.rank}</span>
                      <div class="ft-top10-poster">
                        <img src={t10.img} alt={t10.title} loading="lazy" decoding="async" />
                      </div>
                    </button>
                  {/each}
                </div>
              </section>

              <!-- ── 5. SUPERSLOTS (2222:6427) ── -->
              <section class="ft-sec">
                <div class="ft-sec-head">
                  <div class="ft-sec-title">
                    {@render figmaIcon(CASHPOT_FIGMA_SPEC.categoryTabs[3]?.svg, isMobile ? 18 : 20)}
                    <h2>Superslots</h2>
                  </div>
                  <div class="ft-sec-ctrls">
                    <button
                      type="button"
                      class="ft-seeall"
                      on:click={() => { activeCategoryId = "superslots"; activePage = "category"; }}
                    >Vezi toate</button>
                    {#if !isMobile}
                      <button type="button" class="ft-round-arrow is-sm" aria-label="Înapoi" on:click={() => scrollStrip(jpGamesRowEl, -450)}>‹</button>
                      <button type="button" class="ft-round-arrow is-sm" aria-label="Înainte" on:click={() => scrollStrip(jpGamesRowEl, 450)}>›</button>
                    {/if}
                  </div>
                </div>
                <div class="ft-games-strip" bind:this={jpGamesRowEl}>
                  {#each CASHPOT_FIGMA_SPEC.jackpotRowGames as g}
                    <button type="button" class="ft-game-poster" on:click={() => toast(`Deschide ${g.title}`)}>
                      <img src={g.img} alt={g.title} loading="lazy" decoding="async" />
                      <span class="ft-game-hover"><span>Joacă</span></span>
                    </button>
                  {/each}
                </div>
              </section>

              <!-- ── 6. JACKPOTS (2222:6454 & 2222:8425) ── -->
              <section class="ft-sec">
                <div class="ft-sec-head">
                  <div class="ft-sec-title">
                    {@render figmaIcon(CASHPOT_FIGMA_SPEC.categoryTabs[2]?.svg, isMobile ? 18 : 20)}
                    <h2>Jackpots</h2>
                  </div>
                  <div class="ft-sec-ctrls">
                    <button type="button" class="ft-seeall" on:click={openJackpotsLobby}>Vezi toate</button>
                    {#if !isMobile}
                      <button type="button" class="ft-round-arrow is-sm" aria-label="Înapoi" on:click={() => scrollStrip(jpCardsRowEl, -620)}>‹</button>
                      <button type="button" class="ft-round-arrow is-sm" aria-label="Înainte" on:click={() => scrollStrip(jpCardsRowEl, 620)}>›</button>
                    {/if}
                  </div>
                </div>
                <div class="ft-jp-cards-strip" bind:this={jpCardsRowEl}>
                  {#each CASHPOT_FIGMA_SPEC.jackpotCardsHome as jp}
                    {@render jackpotCardItem(jp, false)}
                  {/each}
                </div>
              </section>

              <!-- ── 7. TOP CÂȘTIGĂTORI TICKER (2222:6466 & 2222:8440) ── -->
              <section class="ft-winners-bar">
                <div class="ft-winners-lbl">
                  <span class="ft-live-dot" aria-hidden="true"></span>
                  <span>TOP CÂȘTIGĂTORI</span>
                </div>
                <div class="ft-winners-list">
                  {#each CASHPOT_FIGMA_SPEC.winnersTicker as w}
                    <button type="button" class="ft-winner-chip" on:click={() => toast(`${w.user} · ${w.amount}`)}>
                      <img src={w.img} alt={w.game} loading="lazy" decoding="async" />
                      <div class="ft-winner-txt">
                        <span><strong>{w.user}</strong> a câștigat <strong class="is-gold">{w.amount}</strong></span>
                        <small>{w.game}</small>
                      </div>
                    </button>
                  {/each}
                </div>
              </section>

              <!-- ── 8. LIVE RTP (HOURLY HOT & HOURLY COLD) ── -->
              <section class="ft-rtp-pair {isMobile ? 'is-mob' : ''}">
                <div class="ft-rtp-box">
                  <div class="ft-rtp-box-head">
                    <div class="ft-rtp-box-title">
                      <span class="ft-rtp-ico is-hot">{@render figmaIcon(CASHPOT_FIGMA_SPEC.uiIcons?.flame, 20)}</span>
                      <div class="ft-rtp-titles">
                        <div class="ft-rtp-titleline">
                          <h3>{CASHPOT_FIGMA_SPEC.liveRtpHome.hot.title}</h3>
                          <button
                            type="button"
                            class="ft-info-i"
                            aria-label="Informații Live RTP"
                            on:click={() => (showRtpTooltip = !showRtpTooltip)}
                          >{@render figmaIcon(CASHPOT_FIGMA_SPEC.uiIcons?.infoCircle, 16)}</button>
                        </div>
                        <span class="ft-rtp-sub">Din ultimele 24 de ore</span>
                      </div>
                      {#if showRtpTooltip}
                        <div class="ft-rtp-tooltip">{CASHPOT_FIGMA_SPEC.liveRtpHome.tooltip}</div>
                      {/if}
                    </div>
                    <button type="button" class="ft-seeall" on:click={() => openLiveRtp("hourly-hot")}>Vezi toate</button>
                  </div>
                  <div class="ft-rtp-rows">
                    {#each CASHPOT_FIGMA_SPEC.liveRtpHome.hot.rows as r}
                      <button type="button" class="ft-rtp-row is-hot" on:click={() => toast(`${r.title} (${r.rtp})`)}>
                        <span class="ft-rtp-rank">{r.rank}</span>
                        <img src={r.img} alt={r.title} loading="lazy" decoding="async" />
                        <div class="ft-rtp-meta">
                          <strong>{r.title}</strong>
                          <span>{r.provider}</span>
                        </div>
                        <span class="ft-rtp-pct">RTP: <strong>{r.rtp}</strong></span>
                        <span class="ft-rtp-play">{@render figmaIcon(CASHPOT_FIGMA_SPEC.uiIcons?.play, 13)}</span>
                      </button>
                    {/each}
                  </div>
                </div>

                <div class="ft-rtp-box">
                  <div class="ft-rtp-box-head">
                    <div class="ft-rtp-box-title">
                      <span class="ft-rtp-ico is-cold">{@render figmaIcon(CASHPOT_FIGMA_SPEC.uiIcons?.snowflake, 20)}</span>
                      <div class="ft-rtp-titles">
                        <h3>{CASHPOT_FIGMA_SPEC.liveRtpHome.cold.title}</h3>
                        <span class="ft-rtp-sub">Din ultimele 24 de ore</span>
                      </div>
                    </div>
                    <button type="button" class="ft-seeall" on:click={() => openLiveRtp("hourly-cold")}>Vezi toate</button>
                  </div>
                  <div class="ft-rtp-rows">
                    {#each CASHPOT_FIGMA_SPEC.liveRtpHome.cold.rows as r}
                      <button type="button" class="ft-rtp-row is-cold" on:click={() => toast(`${r.title} (${r.rtp})`)}>
                        <span class="ft-rtp-rank">{r.rank}</span>
                        <img src={r.img} alt={r.title} loading="lazy" decoding="async" />
                        <div class="ft-rtp-meta">
                          <strong>{r.title}</strong>
                          <span>{r.provider}</span>
                        </div>
                        <span class="ft-rtp-pct">RTP: <strong>{r.rtp}</strong></span>
                        <span class="ft-rtp-play">{@render figmaIcon(CASHPOT_FIGMA_SPEC.uiIcons?.play, 13)}</span>
                      </button>
                    {/each}
                  </div>
                </div>
              </section>

              <!-- ── 9. FURNIZORI (2222:6478 & 2222:8447) ── -->
              <section class="ft-sec">
                <div class="ft-sec-head">
                  <div class="ft-sec-title">
                    <h2>Furnizori</h2>
                  </div>
                  {#if !isMobile}
                    <div class="ft-sec-ctrls">
                      <button type="button" class="ft-seeall" on:click={openProviderModal}>Vezi toate</button>
                      <button type="button" class="ft-round-arrow is-sm" aria-label="Înapoi" on:click={() => scrollStrip(providersRowEl, -560)}>‹</button>
                      <button type="button" class="ft-round-arrow is-sm" aria-label="Înainte" on:click={() => scrollStrip(providersRowEl, 560)}>›</button>
                    </div>
                  {/if}
                </div>
                <div class="ft-providers-grid" bind:this={providersRowEl}>
                  {#each CASHPOT_FIGMA_SPEC.providersColumns as col}
                    <div class="ft-prov-col">
                      {#each col as tile}
                        <button
                          type="button"
                          class="ft-prov-tile"
                          title={tile.name}
                          on:click={() => { selectedProvider = tile.name; selectedProvidersMulti = new Set([tile.name]); activePage = "category"; }}
                        >
                          <img src={tile.img} alt={tile.name} loading="lazy" decoding="async" />
                        </button>
                      {/each}
                    </div>
                  {/each}
                </div>
              </section>

              <!-- ── 10. JOCUL SĂPTĂMÂNII & JOCUL LUNII (2660:37562 & 2222:8557) ── -->
              <section class="ft-sec">
                {#if isMobile}
                  <div class="ft-sec-head">
                    <div class="ft-sec-title"><h2>Jocul săptămânii</h2></div>
                  </div>
                {/if}
                <div class="ft-spotlights {isMobile ? 'is-mob' : ''}">
                  {#each CASHPOT_FIGMA_SPEC.spotlights as sp}
                    <div class="ft-spot-card">
                      <div class="ft-spot-top">
                        <div class="ft-spot-logo">
                          <img src={sp.provLogo} alt={sp.title} />
                        </div>
                        <div class="ft-spot-info">
                          <span>{sp.overline}</span>
                          <h3>{sp.title}</h3>
                        </div>
                        <button type="button" class="ft-btn-gold {isMobile ? 'is-sm' : ''}" on:click={() => toast(`Joacă ${sp.title}`)}>
                          {sp.cta}
                        </button>
                      </div>
                      <img src={sp.artImg} alt={sp.title} class="ft-spot-art" loading="lazy" decoding="async" />
                    </div>
                  {/each}
                </div>
              </section>

              <!-- ── 11. TEME JOCURI (2222:6594 & 2222:8561) ── -->
              <section class="ft-sec" id="ft-themes-section">
                <div class="ft-sec-head">
                  <div class="ft-sec-title">
                    <h2>Teme jocuri</h2>
                  </div>
                  {#if !isMobile}
                    <div class="ft-sec-ctrls">
                      <button type="button" class="ft-seeall" on:click={() => { activeCategoryId = "hot"; activePage = "category"; }}>Vezi toate</button>
                      <button type="button" class="ft-round-arrow is-sm" aria-label="Înapoi" on:click={() => scrollStrip(themesRowEl, -580)}>‹</button>
                      <button type="button" class="ft-round-arrow is-sm" aria-label="Înainte" on:click={() => scrollStrip(themesRowEl, 580)}>›</button>
                    </div>
                  {/if}
                </div>
                <div class="ft-themes-strip" bind:this={themesRowEl}>
                  {#each CASHPOT_FIGMA_SPEC.themes as th}
                    <button type="button" class="ft-theme-card" on:click={() => { activeCategoryId = "hot"; activePage = "category"; }}>
                      <img src={th.img} alt={th.name} loading="lazy" decoding="async" />
                      <div class="ft-theme-scrim">
                        <strong>{th.name}</strong>
                        <span>{th.count}</span>
                      </div>
                    </button>
                  {/each}
                </div>
              </section>

            {:else if activePage === "category"}
              <!-- ═══════════════ PAGINA DE CATEGORIE (2336:23653, 2336:29143, 2336:30540 MOBILE) ═══════════════ -->
              {@render secondaryBannersStrip()}
              {@render categoryBarStrip()}

              <section class="ft-sec">
                {@render categoryActionHeader(activeTabObj?.label || "Jocuri noi", activeTabObj?.svg)}
                <div class="ft-games-grid {isMobile ? 'cols-mob' : ''}">
                  {#each filteredCategoryGames as g}
                    <button type="button" class="ft-game-poster is-grid" on:click={() => toast(`Deschide ${g.title} (${g.provider || "CashPot"})`)}>
                      <img src={g.img} alt={g.title} loading="lazy" decoding="async" />
                      <span class="ft-game-hover"><span>Joacă</span></span>
                    </button>
                  {/each}
                </div>
              </section>

            {:else if activePage === "jackpots"}
              <!-- ═══════════════ JACKPOT-URI LOBBY (2376:37557 & 2381:53529 MOBILE) ═══════════════ -->
              {@render secondaryBannersStrip()}
              {@render categoryBarStrip()}

              <section class="ft-sec">
                {@render categoryActionHeader("Jackpot-uri", CASHPOT_FIGMA_SPEC.categoryTabs[2]?.svg)}
                <div class="ft-jp-lobby-grid {isMobile ? 'is-mob' : ''}">
                  {#each filteredJackpotsLobby as jp}
                    {@render jackpotCardItem(jp, true)}
                  {/each}
                </div>
              </section>

            {:else if activePage === "live-rtp"}
              <!-- ═══════════════ LIVE RTP PAGE (2381:88679 DESKTOP & 2381:92281 MOBILE) ═══════════════ -->
              {@render secondaryBannersStrip()}

              {#each CASHPOT_FIGMA_SPEC.liveRtpPageSections as sec}
                {@const slugId = `ft-rtp-${sec.title.toLowerCase().replace(/\s+/g, "-")}`}
                <section class="ft-sec" id={slugId}>
                  <div class="ft-sec-head">
                    <div class="ft-sec-title">
                      {@render figmaIcon(CASHPOT_FIGMA_SPEC.liveCasinoHeaderIcon, 20)}
                      <h2>{sec.title}</h2>
                    </div>
                  </div>
                  <div class="ft-games-strip">
                    {#each sec.cards as c}
                      <button type="button" class="ft-rtp-card {isMobile ? 'is-mob' : ''}" on:click={() => toast(`${c.title} · ${c.provider} · RTP ${c.rtp}`)}>
                        <div class="ft-rtp-card-poster {isMobile ? 'is-mob' : ''}">
                          <img src={c.img} alt={c.title} loading="lazy" decoding="async" />
                          <span class="ft-rtp-badge {sec.isCold ? 'is-cold' : 'is-hot'}">
                            {@render figmaIcon(sec.isCold ? CASHPOT_FIGMA_SPEC.uiIcons?.snowflake : CASHPOT_FIGMA_SPEC.uiIcons?.fireLinear, 13)}
                            <span>{c.rtp}</span>
                          </span>
                        </div>
                        <div class="ft-rtp-card-info">
                          <strong>{c.title}</strong>
                          <span>{c.provider}</span>
                        </div>
                      </button>
                    {/each}
                  </div>
                </section>
              {/each}

              <!-- Info · Secțiuni & Info · Actualizare BETA -->
              <div class="ft-rtp-info-grid {isMobile ? 'is-mob' : ''}">
                <div class="ft-rtp-info-card">
                  <div class="ft-ric-head">
                    {@render figmaIcon(CASHPOT_FIGMA_SPEC.vipDuotoneIcons?.["info-circle"], 20)}
                    <strong>Secțiuni Live RTP</strong>
                  </div>
                  {#each CASHPOT_FIGMA_SPEC.liveRtpInfo?.sectiuni || [] as line}
                    <p>{line}</p>
                  {/each}
                </div>
                <div class="ft-rtp-info-card">
                  <div class="ft-ric-head">
                    {@render figmaIcon(CASHPOT_FIGMA_SPEC.vipDuotoneIcons?.bolt, 20)}
                    <strong>Actualizare &amp; Versiune BETA</strong>
                  </div>
                  {#each CASHPOT_FIGMA_SPEC.liveRtpInfo?.actualizare || [] as line}
                    <p>{line}</p>
                  {/each}
                </div>
              </div>

            {:else if activePage === "live-casino"}
              <!-- ═══════════════ LIVE CASINO (2381:94954 DESKTOP & 2381:98421 MOBILE) ═══════════════ -->
              {@render secondaryBannersStrip()}
              <div class="ft-live-catbar {isMobile ? 'is-mob' : ''}">
                <div class="ft-live-catbar-scroll">
                  {#each CASHPOT_FIGMA_SPEC.liveCasinoTabs || [] as ltab}
                    <button
                      type="button"
                      class="ft-cat-tile {isMobile ? 'is-mob' : ''} {liveCasinoTab === ltab.id ? 'active' : ''}"
                      on:click={() => (liveCasinoTab = ltab.id)}
                    >
                      {@render figmaIcon(ltab.svg, isMobile ? 16 : 18)}
                      <span>{ltab.label}</span>
                    </button>
                  {/each}
                </div>
              </div>

              {#each liveCasinoRowsFiltered as row}
                <section class="ft-sec">
                  <div class="ft-sec-head">
                    <div class="ft-sec-title">
                      {@render figmaIcon(CASHPOT_FIGMA_SPEC.liveCasinoHeaderIcon, isMobile ? 18 : 20)}
                      <h2>{row.title}</h2>
                    </div>
                    <button type="button" class="ft-seeall" on:click={() => toast(`${row.title}: ${row.games.length} mese`)}>Vezi toate</button>
                  </div>
                  <div class="ft-games-strip">
                    {#each row.games as g}
                      <button type="button" class="ft-game-poster" on:click={() => toast(`Intră la ${g.title}`)}>
                        <img src={g.img} alt={g.title} loading="lazy" decoding="async" />
                        <span class="ft-game-hover"><span>Intră</span></span>
                      </button>
                    {/each}
                  </div>
                </section>
              {/each}

            {:else if activePage === "vip" || activePage === "vip-mecanica"}
              <!-- ═══════════════ VIP CLUB & MECANICA VIP (2537:38224 DESKTOP & 2537:41687 MOBILE) ═══════════════ -->
              {#if activePage === "vip-mecanica"}
                <section class="ft-vip-status-card {isMobile ? 'is-mob' : ''}">
                  <div>
                    <span class="ft-banner-tag">{CASHPOT_FIGMA_SPEC.vipClubData.mecanicaVip?.antet?.[0] || "PROPUNERE MECANICĂ VIP"}</span>
                    <h1>{CASHPOT_FIGMA_SPEC.vipClubData.mecanicaVip?.antet?.[1] || "Menținere nivel · lună calendaristică"}</h1>
                    <p class="ft-mcopy">{CASHPOT_FIGMA_SPEC.vipClubData.mecanicaVip?.antet?.[2] || ""}</p>
                  </div>
                </section>

                <div class="ft-mecanica-grid {isMobile ? 'is-mob' : ''}">
                  {#each CASHPOT_FIGMA_SPEC.vipClubData.mecanicaVip?.cards || [] as mc}
                    <div class="ft-vip-cb-card">
                      <span class="ft-banner-tag">{mc.name}</span>
                      <h3>{mc.texts[1] || mc.texts[0] || mc.name}</h3>
                      <div class="ft-mecanica-lines">
                        {#each mc.texts.slice(2) as ln}
                          <p>{ln}</p>
                        {/each}
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="ft-vip-pagehead {isMobile ? 'is-mob' : ''}">
                  <h1>VIP Club</h1>
                  <p>Strângi puncte VIP din depuneri și misiuni. La fiecare nivel primești o recompensă, iar cashback-ul crește.</p>
                </div>

                {#if !isLoggedIn}
                  <section class="ft-vip-status-card {isMobile ? 'is-mob' : ''}">
                    <div class="ft-vs-left">
                      <img src={CASHPOT_FIGMA_SPEC.vipClubData.levelStatus.badgeImg} alt="VIP" class="ft-vs-shield" />
                      <div>
                        <h2>Intră în cont și vezi nivelul tău VIP</h2>
                        <p>Fiecare depunere și misiune îți aduce puncte VIP. La fiecare nivel primești o recompensă: rotiri, bonus sau bani cash.</p>
                      </div>
                    </div>
                    <div class="ft-vs-stats">
                      <button type="button" class="ft-btn-gold" on:click={() => (authMode = "logged-in")}>Conectare</button>
                    </div>
                  </section>
                {:else}
                  <section class="ft-vip-status-card {isMobile ? 'is-mob' : ''}">
                    <div class="ft-vs-left">
                      <img src={CASHPOT_FIGMA_SPEC.vipClubData.levelStatus.badgeImg} alt="Argint 1" class="ft-vs-shield" />
                      <div>
                        <span class="ft-banner-tag">NIVELUL TĂU</span>
                        <h2>{CASHPOT_FIGMA_SPEC.vipClubData.levelStatus.tierName}</h2>
                        <button type="button" class="ft-vs-ptsbtn" on:click={() => openVipModal("points")}>
                          <span>Puncte VIP:</span>
                          <strong class="is-gold">{CASHPOT_FIGMA_SPEC.vipClubData.levelStatus.points}</strong>
                        </button>
                        <div class="ft-sb-vip-track is-lg"><div class="ft-sb-vip-fill" style="width: 70%;"></div></div>
                        <p>{isMobile ? "Încă 180 puncte până la Argint 2" : CASHPOT_FIGMA_SPEC.vipClubData.levelStatus.nextHint}</p>
                      </div>
                    </div>
                    <div class="ft-vs-stats">
                      <button type="button" class="ft-vs-stat" on:click={() => openVipModal("cashback")}>
                        <span>Cashback acumulat:</span>
                        <strong>{CASHPOT_FIGMA_SPEC.vipClubData.levelStatus.cashbackAccumulated}</strong>
                      </button>
                      <button type="button" class="ft-vs-stat" on:click={() => openVipModal("rewards")}>
                        <span>Următoarea recompensă:</span>
                        <strong>{CASHPOT_FIGMA_SPEC.vipClubData.levelStatus.nextReward}</strong>
                      </button>
                      <button type="button" class="ft-btn-gold" on:click={() => (activeModal = "deposit-missions")}>Depune acum</button>
                      {#if isMobile}
                        <button type="button" class="ft-btn-outline is-sm" on:click={() => (activePage = "shop-misiuni")}>Vezi misiunile</button>
                      {/if}
                    </div>
                  </section>
                {/if}

                <section class="ft-sec">
                  <div class="ft-sec-head">
                    <div class="ft-sec-title"><h2>Cum funcționează</h2></div>
                  </div>
                  <div class="ft-vip-how-grid {isMobile ? 'is-mob' : ''}">
                    {#each CASHPOT_FIGMA_SPEC.vipClubData.howItWorks as step}
                      <div class="ft-vip-how-card">
                        {#if step.img}<img src={step.img} alt={step.title} />{/if}
                        <div>
                          <h3>{step.title}</h3>
                          {#each step.lines as ln}
                            <p>{ln}</p>
                          {/each}
                        </div>
                      </div>
                    {/each}
                  </div>
                </section>

                <section class="ft-sec">
                  <div class="ft-sec-head">
                    <div class="ft-sec-title"><h2>Nivelurile VIP</h2></div>
                  </div>
                  <div class="ft-vip-tiers-grid {isMobile ? 'is-mob' : ''}">
                    {#each CASHPOT_FIGMA_SPEC.vipClubData.tiers as tier}
                      <div class="ft-vip-tier {tier.isCurrent ? 'is-current' : ''}">
                        {#if tier.isCurrent}<span class="ft-vt-badge">NIVELUL TĂU</span>{/if}
                        <div class="ft-vt-head">
                          <img src={tier.img} alt={tier.name} />
                          <div>
                            <h3>{tier.name}</h3>
                            <span>{tier.texts[1] || ""}</span>
                          </div>
                        </div>
                        <div class="ft-vt-reward">
                          <span>{tier.texts[2] || "Recompensă totală"}</span>
                          <strong>{tier.texts[3] || ""}</strong>
                        </div>
                        <ul class="ft-vt-benefits">
                          {#each tier.benefits || [] as ben}
                            <li class={ben.unlocked ? "" : "is-locked"}>
                              {@render figmaIcon(
                                ben.unlocked
                                  ? CASHPOT_FIGMA_SPEC.vipDuotoneIcons?.["check-circle"]
                                  : CASHPOT_FIGMA_SPEC.vipDuotoneIcons?.lock,
                                16
                              )}
                              <span>{ben.label}</span>
                            </li>
                          {/each}
                        </ul>
                        <button type="button" class="ft-btn-outline is-full" on:click={() => openVipModal("rewards")}>
                          Detalii recompense
                        </button>
                      </div>
                    {/each}
                  </div>
                </section>

                <section class="ft-vip-cb-card">
                  <div class="ft-cb-head">
                    <span class="ft-banner-tag">BONUS</span>
                    <h2>Cashback săptămânal</h2>
                    <p>Primești în fiecare luni un procent din rulajul tău la sloturi din săptămâna trecută.</p>
                  </div>
                  <div class="ft-cb-table">
                    <div class="ft-cb-row is-header">
                      <span>NIVEL</span>
                      <span>%</span>
                      <span>MAXIM</span>
                    </div>
                    {#each [["Bronz", "0,1%", "100 RON"], ["Argint", "0,2%", "250 RON"], ["Aur", "0,3%", "500 RON"], ["Platină", "0,5%", "1.000 RON"], ["Diamant", "0,8%", "2.500 RON"]] as row, idx}
                      <div class="ft-cb-row {idx === 1 ? 'is-current' : ''}">
                        <strong>{row[0]}</strong>
                        <span class="is-gold">{row[1]}</span>
                        <strong>{row[2]}</strong>
                      </div>
                    {/each}
                  </div>
                </section>

                <section class="ft-sec">
                  <div class="ft-sec-head"><div class="ft-sec-title"><h2>Întrebări frecvente</h2></div></div>
                  <div class="ft-faq-grid {isMobile ? 'is-mob' : ''}">
                    {#each CASHPOT_FIGMA_SPEC.vipClubData.faq as item, i}
                      <div class="ft-faq-item">
                        <button type="button" class="ft-faq-q" on:click={() => (openFaqIdx = openFaqIdx === i ? -1 : i)}>
                          <span>{item.q}</span>
                          <span>{openFaqIdx === i ? "−" : "+"}</span>
                        </button>
                        {#if openFaqIdx === i}
                          <p class="ft-faq-a">{item.a}</p>
                        {/if}
                      </div>
                    {/each}
                  </div>
                </section>
              {/if}

            {:else if activePage === "shop-premii" || activePage === "shop-misiuni"}
              <!-- ═══════════════ SHOP & MISIUNI (2490:6746, 2490:10221, 2507:10572, 2507:10716) ═══════════════ -->
              {@const shc = CASHPOT_FIGMA_SPEC.shopData.heroCopy}
              {@const sab = CASHPOT_FIGMA_SPEC.shopData.appBanner}
              <section class="ft-shop-hero {isMobile ? 'is-mob' : ''}">
                <img src={CASHPOT_FIGMA_SPEC.shopData.heroImg} alt="CashPot Shop VIP" class="ft-banner-bg" decoding="async" />
                <div class="ft-shop-hero-scrim {isMobile ? 'is-mob' : ''}">
                  {#if !isLoggedIn}
                    <div class="ft-shop-hcopy">
                      <h1>{shc?.preloginTitle || "Câștigă puncte. Revendică premii."}</h1>
                      <p>{shc?.preloginSub || "Depune, joacă și finalizează misiuni pentru a câștiga puncte."}</p>
                    </div>
                    <div class="ft-shop-hero-stats">
                      <div class="ft-sh-pts">
                        <small>{shc?.totalPrizesLabel || "Total premii"}</small>
                        <strong>{shc?.totalPrizesValue || "241.604"}</strong>
                      </div>
                      <div class="ft-sh-pts">
                        <small>{shc?.totalValueLabel || "Valoarea premiilor"}</small>
                        <strong class="is-gold">{shc?.totalValueAmount || "+7,8M RON"}</strong>
                      </div>
                    </div>
                    <div class="ft-hero-signup {isMobile ? 'is-mob' : ''}">
                      <input type="email" class="ft-hero-email" bind:value={shopEmailCheck} aria-label="Email existent" />
                      <button type="button" class="ft-btn-gold {isMobile ? 'is-sm' : ''}" on:click={() => (activeModal = "login-existing")}>Continuă</button>
                    </div>
                  {:else}
                    <div class="ft-shop-hcopy">
                      <h1>{shc?.loggedTitle || "Depune, joacă și finalizează misiuni pentru a câștiga puncte"}</h1>
                    </div>
                    <div class="ft-shop-hero-actions">
                      <div class="ft-sh-pts">
                        <small>{shc?.pointsLabel || "PUNCTELE MELE"}</small>
                        <strong class="is-gold">{shopPoints.toLocaleString("ro-RO")}</strong>
                      </div>
                      <button type="button" class="ft-btn-gold" on:click={() => (activePage = "shop-misiuni")}>
                        {shc?.ctaLabel || "Câștigă puncte"}
                      </button>
                    </div>
                  {/if}
                </div>
              </section>

              {#if isLoggedIn && showStreakBanner && activePage === "shop-premii"}
                <div class="ft-streak-bar {isMobile ? 'is-mob' : ''}">
                  <span>{CASHPOT_FIGMA_SPEC.shopData.streakTexts?.[0] || "Nu pierde streak-ul de 2 zile. Depune minim 50 lei."}</span>
                  <div class="ft-sec-ctrls">
                    <button type="button" class="ft-btn-gold is-sm" on:click={() => (activeModal = "deposit-missions")}>Depune</button>
                    <button type="button" class="ft-mclose" aria-label="Închide streak" on:click={() => (showStreakBanner = false)}>✕</button>
                  </div>
                </div>
              {/if}

              <!-- VIP tabs (480x40 centered / 100% mobile) -->
              <div class="ft-vip-tabs {isMobile ? 'is-mob' : ''}">
                <button
                  type="button"
                  class="ft-vip-tab {activePage === 'shop-premii' ? 'active' : ''}"
                  on:click={() => (activePage = "shop-premii")}
                >Premii</button>
                <button
                  type="button"
                  class="ft-vip-tab {activePage === 'shop-misiuni' ? 'active' : ''}"
                  on:click={() => (activePage = "shop-misiuni")}
                >Misiuni</button>
              </div>

              {#if activePage === "shop-premii"}
                <!-- VIP prize categories (2488:207) -->
                <section class="ft-sec">
                  <div class="ft-shop-cats {isMobile ? 'is-mob' : ''}">
                    {#each CASHPOT_FIGMA_SPEC.shopData.categories as cat}
                      <button
                        type="button"
                        class="ft-shop-catcard"
                        on:click={() => openPrizeDrawer(cat.title)}
                      >
                        <img src={cat.img} alt={cat.title} loading="lazy" decoding="async" />
                        <strong>{cat.title}</strong>
                        <span>{cat.count || ""}</span>
                        <span class="ft-cat-detlink">{cat.cta || "Vezi detalii"}</span>
                      </button>
                    {/each}
                  </div>
                </section>

                {#if !isLoggedIn}
                  <!-- VIP how it works pre-login (2507:10883) -->
                  <section class="ft-sec">
                    <div class="ft-sec-head">
                      <div class="ft-sec-title"><h2>Cum particip?</h2></div>
                      <button type="button" class="ft-seeall" on:click={() => openShopPopup("how-points")}>Cum câștig puncte?</button>
                    </div>
                    <div class="ft-pl-stepper {isMobile ? 'is-mob' : ''}">
                      <div class="ft-pl-step">
                        <span class="ft-pl-num">1</span>
                        <div>
                          <strong>Deschide cont</strong>
                          <p>Înscrie-te pe Cashpot și primești automat primul tău punct.</p>
                        </div>
                      </div>
                      <div class="ft-pl-step">
                        <span class="ft-pl-num">2</span>
                        <div>
                          <strong>Completează misiunile</strong>
                          <p>Depune, joacă și avansează pentru a-ți crește numărul de puncte.</p>
                        </div>
                      </div>
                    </div>
                  </section>
                {/if}
              {:else}
                <!-- VIP missions (2490:12783 / 2488:734) -->
                <section class="ft-sec">
                  <div class="ft-sec-stackhead">
                    <h2>Câștigă puncte</h2>
                    <p>Completează misiuni pentru a câștiga puncte și a debloca premii.</p>
                  </div>
                  <div class="ft-shop-missions {isMobile ? 'is-mob' : ''}">
                    {#each CASHPOT_FIGMA_SPEC.shopData.missions as m}
                      <div class="ft-mission-card">
                        <div class="ft-mc-top">
                          <div class="ft-mc-titles">
                            <strong>{m.title}</strong>
                            {#if m.repeatable}<span class="ft-mc-rep">Repetabil</span>{/if}
                          </div>
                          <span class="ft-banner-tag">{m.points || "+5p"}</span>
                        </div>
                        <p>{m.desc || ""}</p>
                        <div class="ft-mc-foot">
                          <span><strong>{m.progress || "0 / 1"}</strong></span>
                          <button type="button" class="ft-btn-gold is-sm" on:click={() => (activeModal = "deposit-missions")}>
                            {m.cta || "Completează"}
                          </button>
                        </div>
                      </div>
                    {/each}
                  </div>
                </section>
              {/if}

              <!-- VIP prize showcase (2490:781) -->
              {#if CASHPOT_FIGMA_SPEC.shopData.showcase?.length}
                <section class="ft-sec">
                  <div class="ft-sec-head">
                    <div class="ft-sec-stackhead">
                      <h2>Peste 240.000 de premii te așteaptă!</h2>
                      <p>Depune minimum 100 RON și primești 5 puncte instant</p>
                    </div>
                    {#if !isMobile}
                      <div class="ft-sec-ctrls">
                        <button type="button" class="ft-round-arrow is-sm" aria-label="Înapoi" on:click={() => scrollStrip(showcaseRowEl, -420)}>‹</button>
                        <button type="button" class="ft-round-arrow is-sm" aria-label="Înainte" on:click={() => scrollStrip(showcaseRowEl, 420)}>›</button>
                      </div>
                    {/if}
                  </div>
                  <div class="ft-showcase-rows" bind:this={showcaseRowEl}>
                    {#each CASHPOT_FIGMA_SPEC.shopData.showcase as sc}
                      <button type="button" class="ft-showcase-pill" on:click={() => openPrize({ title: sc.title, category: "Premii VIP", points: parseInt(sc.points, 10) || 100, img: sc.img })}>
                        <img src={sc.img} alt={sc.title} loading="lazy" decoding="async" />
                        <div>
                          <strong>{sc.title}</strong>
                          <span>{sc.points}</span>
                        </div>
                      </button>
                    {/each}
                  </div>
                  <div class="ft-center-cta">
                    <button type="button" class="ft-btn-outline is-gold-border" on:click={() => openPrizeDrawer("Premii VIP")}>
                      Descoperă premiile
                    </button>
                  </div>
                </section>
              {/if}

              <!-- VIP claimed prizes (2490:962) -->
              <section class="ft-sec">
                <div class="ft-sec-stackhead">
                  <span class="ft-live-pill"><span class="ft-live-dot" aria-hidden="true"></span> LIVE</span>
                  <h2>Premii revendicate chiar acum!</h2>
                  <p>Fii următorul pe listă — fiecare punct te aduce mai aproape de premiul tău.</p>
                </div>
                <div class="ft-claimed-strip">
                  {#each CASHPOT_FIGMA_SPEC.shopData.claimed as cl}
                    <div class="ft-claimed-card">
                      <img src={cl.img} alt={cl.prize} />
                      <div>
                        <strong>{cl.user}</strong>
                        <small>{cl.action}</small>
                        <span class="is-gold">{cl.prize}</span>
                        {#if cl.time}<small>{cl.time}</small>{/if}
                      </div>
                    </div>
                  {/each}
                </div>
              </section>

              <!-- Next goal banner (2487:187 Logat) -->
              {#if isLoggedIn && CASHPOT_FIGMA_SPEC.shopData.nextGoal}
                <div class="ft-next-goal-card {isMobile ? 'is-mob' : ''}">
                  <img src={CASHPOT_FIGMA_SPEC.shopData.nextGoal.img} alt="AirPods Pro" />
                  <div class="ft-ng-info">
                    <span class="ft-banner-tag">BEST DEAL</span>
                    <p>Mai ai de strâns 15.423 puncte până la</p>
                    <h3>Apple AirPods Pro (3rd Generation)</h3>
                  </div>
                  <button type="button" class="ft-btn-gold is-sm" on:click={() => (activePage = "shop-misiuni")}>Câștigă puncte</button>
                </div>
              {/if}

              <!-- App download banner (2487:224) -->
              <section class="ft-app-purple {isMobile ? 'is-mob' : ''}">
                <div class="ft-ap-copy">
                  <h2>{sab?.title || "Descarcă aplicația Cashpot și câștigă puncte în fiecare zi"}</h2>
                  {#if !isMobile}
                    <ul class="ft-ap-bullets">
                      {#each sab?.bullets || ["Conectează-te zilnic și primești 1 punct", "Revendică premiile cu punctele tale"] as btxt}
                        <li>{btxt}</li>
                      {/each}
                    </ul>
                    <div class="ft-ap-qrrow">
                      <img src={CASHPOT_FIGMA_SPEC.shopData.qrCode} alt="QR Code" class="ft-qr" />
                      <span>{sab?.qrLabel || "Scanează codul QR"}</span>
                    </div>
                  {:else}
                    <div class="ft-ap-stores">
                      <button type="button" class="ft-btn-outline is-sm" on:click={() => toast("Descarcă din App Store")}>Descarcă din App Store</button>
                      <button type="button" class="ft-btn-outline is-sm" on:click={() => toast("Disponibil pe Google Play")}>Disponibil pe Google Play</button>
                    </div>
                  {/if}
                </div>
                <img src={CASHPOT_FIGMA_SPEC.shopData.phoneMockup} alt="CashPot App" class="ft-phone-mock" />
              </section>

            {:else if activePage === "design-system"}
              <!-- ═══════════════ DESIGN SYSTEM + COVER (CANVAS 120:19745 & 0:1) ═══════════════ -->
              {#if CASHPOT_FIGMA_SPEC.headerAssets.coverBannerImg}
                <section class="ft-sec">
                  <div class="ft-sec-head">
                    <div class="ft-sec-title"><h2>Figma Cover · Cashpot_test.fig</h2></div>
                    <button type="button" class="ft-seeall" on:click={() => (activePage = "home")}>← Homepage</button>
                  </div>
                  <div class="ft-cover-card">
                    <img src={CASHPOT_FIGMA_SPEC.headerAssets.coverBannerImg} alt="Cashpot Cover Figma" />
                  </div>
                </section>
              {/if}

              <section class="ft-sec">
                <div class="ft-sec-head">
                  <div class="ft-sec-title"><h2>Design System · Colours &amp; Primitives</h2></div>
                </div>
                <div class="ft-ds-swatches">
                  {#each CASHPOT_FIGMA_SPEC.designSystem?.colors || [] as c}
                    <div class="ft-ds-swatch">
                      <span class="ft-ds-color" style="background: {c.hex};"></span>
                      <strong>{c.token}</strong>
                      <code>{c.hex}</code>
                    </div>
                  {/each}
                </div>
              </section>

              <section class="ft-sec">
                <div class="ft-sec-head"><div class="ft-sec-title"><h2>Typography &amp; Components</h2></div></div>
                <div class="ft-vip-cb-card">
                  {#each CASHPOT_FIGMA_SPEC.designSystem?.typography || [] as ty}
                    <div class="ft-ds-typorow {isMobile ? 'is-mob' : ''}">
                      <span class="is-gold">{ty.role}</span>
                      <code>{ty.size}</code>
                      <strong>{ty.sample}</strong>
                    </div>
                  {/each}
                  <div class="ft-ds-btns">
                    <button type="button" class="ft-btn-gold">Primary Gold CTA</button>
                    <button type="button" class="ft-banner-purple-cta">Purple Promo CTA</button>
                    <button type="button" class="ft-btn-outline">Outline Secondary</button>
                  </div>
                </div>
              </section>

              <section class="ft-sec">
                <div class="ft-sec-head"><div class="ft-sec-title"><h2>VIP Club · 15 Iconițe Bold Duotone (2529:3)</h2></div></div>
                <div class="ft-ds-icons">
                  {#each Object.entries(CASHPOT_FIGMA_SPEC.vipDuotoneIcons || {}) as [name, svg]}
                    <div class="ft-ds-iconcard">
                      {@render figmaIcon(svg, 26)}
                      <span>{name}</span>
                    </div>
                  {/each}
                </div>
              </section>
            {/if}

            {@render footerSection()}
          </main>
        </div>
      {/if}
    </div>

    <!-- Mobile Shop Sticky Bar (2504:9474 / 2507:10572 / 2507:10716) -->
    {#if isMobile && (activePage === "shop-premii" || activePage === "shop-misiuni") && !isPreLander}
      <div class="ft-mob-stickybar">
        {#if !isLoggedIn}
          <div>
            <strong>Finalizează misiuni și transformă punctele în premii.</strong>
          </div>
          <button type="button" class="ft-btn-gold is-sm" on:click={() => (activeModal = "login-existing")}>Câștigă puncte</button>
        {:else if activePage === "shop-misiuni"}
          <div>
            <span class="ft-banner-tag">STREAK ACTIV</span>
            <strong>{CASHPOT_FIGMA_SPEC.shopData.stickyBars?.streak || "Nu rata depunerea de azi!"}</strong>
          </div>
          <button type="button" class="ft-btn-gold is-sm" on:click={() => (activeModal = "deposit-missions")}>
            {CASHPOT_FIGMA_SPEC.shopData.stickyBars?.ctaStreak || "Continuă streak-ul"}
          </button>
        {:else}
          <div>
            <span class="ft-banner-tag">URMĂTORUL PREMIU</span>
            <strong>{CASHPOT_FIGMA_SPEC.shopData.stickyBars?.nextPrize || "Mai ai nevoie de 55 puncte"}</strong>
          </div>
          <button type="button" class="ft-btn-gold is-sm" on:click={() => (activePage = "shop-misiuni")}>
            {CASHPOT_FIGMA_SPEC.shopData.stickyBars?.ctaPoints || "Câștigă puncte"}
          </button>
        {/if}
      </div>
    {/if}

    <!-- Mobile Bottom Nav (ALL Mobile 360 views including Pre-lander!) -->
    {@render mobileBottomNavBar()}

    <!-- ═══════════════ FIGMA MODALS, SHEETS & DRAWERS (BOUNDED INSIDE 360px WHEN IN PHONE PREVIEW) ═══════════════ -->
    {#if activeModal}
      <div class="ft-modal-layer {isPhonePreview ? 'in-phone' : ''} {isMobile ? 'is-mob-layer' : ''}">
        <button type="button" class="ft-modal-backdrop" aria-label="Închide fereastra" on:click={() => (activeModal = null)}></button>

        {#if activeModal === "search"}
          <!-- Search Desktop 1120x720 (2174:4698) / Search Mobile 360x800 (2175:4736) -->
          <div class="ft-modal {isMobile ? 'is-mob-full' : 'ft-modal-search'}" role="dialog" aria-label="Search Modal">
            <div class="ft-search-hrow">
              <div class="ft-search-inputbox">
                {@render figmaIcon(CASHPOT_FIGMA_SPEC.topNavIcons.search, 18)}
                <input
                  type="text"
                  class="ft-search-bareinput"
                  placeholder={isMobile ? "Caută jocuri sau furnizori" : "Caută jocuri, furnizori sau categorii"}
                  bind:value={searchQuery}
                />
              </div>
              <button type="button" class="ft-mclose is-40" aria-label="Închide căutarea" on:click={() => (activeModal = null)}>
                {@render figmaIcon(CASHPOT_FIGMA_SPEC.uiIcons?.closeX, 18)}
              </button>
            </div>

            <div class="ft-search-top {isMobile ? 'is-mob' : ''}">
              {#if activeSpotlight}
                <div class="ft-search-spotlight">
                  <img src={activeSpotlight.img} alt={activeSpotlight.title} />
                  <div class="ft-ss-copy">
                    <span class="ft-banner-tag">Încearcă ceva nou</span>
                    <strong>{activeSpotlight.title}</strong>
                    <small>{activeSpotlight.provider}</small>
                    <div class="ft-sec-ctrls is-wrap">
                      <button type="button" class="ft-btn-gold is-sm" on:click={() => { activeModal = null; toast(`Deschide ${activeSpotlight.title}`); }}>Joacă</button>
                      <button type="button" class="ft-icon-refresh" aria-label="Schimbă recomandarea" on:click={() => (spotlightIdx += 1)}>
                        {@render figmaIcon(CASHPOT_FIGMA_SPEC.searchModalData?.refreshSvg, 16)}
                      </button>
                    </div>
                  </div>
                </div>
              {/if}

              <div class="ft-search-suggestions">
                <div class="ft-mhead">
                  <span class="ft-dp-lbl">Descoperă mai multe</span>
                  <button type="button" class="ft-icon-refresh" aria-label="Reîncarcă sugestii" on:click={() => (spotlightIdx += 1)}>
                    {@render figmaIcon(CASHPOT_FIGMA_SPEC.searchModalData?.refreshSvg, 16)}
                  </button>
                </div>
                <div class="ft-search-tags">
                  {#each (isMobile
                    ? (CASHPOT_FIGMA_SPEC.searchModalData?.mobileSuggestions || ["Sweet Bonanza 1000", "Gates of Olympus 1000", "Big Bass Splash", "Book of Ra", "Shining Crown", "Burning Hot"])
                    : (CASHPOT_FIGMA_SPEC.searchModalData?.suggestions || ["Fruit", "Fruity", "Fruits Go", "Fruitopolis", "Fruit Shop Megaways"])) as tag}
                    <button type="button" class="ft-cat-tile is-sm" on:click={() => (searchQuery = tag)}>{tag}</button>
                  {/each}
                </div>
              </div>
            </div>

            {#if searchQuery.trim()}
              <div class="ft-dp-lbl">Rezultate pentru „{searchQuery}” ({filteredSearchGames.length})</div>
              <div class="ft-search-results {isMobile ? 'is-mob' : ''}">
                {#each filteredSearchGames as g}
                  <button type="button" class="ft-game-poster is-grid" on:click={() => { activeModal = null; toast(`Deschide ${g.title}`); }}>
                    <img src={g.img} alt={g.title} />
                  </button>
                {/each}
              </div>
            {:else}
              <div class="ft-search-dual {isMobile ? 'is-mob' : ''}">
                <div class="ft-search-cardcol">
                  <div class="ft-dp-lbl">Cele mai căutate</div>
                  <div class="ft-search-results is-pair">
                    {#each (CASHPOT_FIGMA_SPEC.searchModalData?.mostSearched || allSearchPool.slice(0, 6)).slice(0, 3) as g}
                      <button type="button" class="ft-game-poster is-grid" on:click={() => { activeModal = null; toast(`Deschide ${g.title}`); }}>
                        <img src={g.img} alt={g.title} />
                      </button>
                    {/each}
                  </div>
                </div>
                <div class="ft-search-cardcol">
                  <div class="ft-dp-lbl">Cele mai jucate</div>
                  <div class="ft-search-results is-pair">
                    {#each (CASHPOT_FIGMA_SPEC.searchModalData?.mostPlayed || allSearchPool.slice(6, 12)).slice(0, 3) as g}
                      <button type="button" class="ft-game-poster is-grid" on:click={() => { activeModal = null; toast(`Deschide ${g.title}`); }}>
                        <img src={g.img} alt={g.title} />
                      </button>
                    {/each}
                  </div>
                </div>
              </div>
            {/if}
          </div>

        {:else if activeModal === "balance"}
          <!-- Balance overview updated (2296:30457 Desktop / 2336:22792 Mobile) -->
          {@const bd = CASHPOT_FIGMA_SPEC.balanceDrawerData}
          <div class="ft-drawer-right {isMobile ? 'is-mob-full-panel' : 'is-bal-bg'}" role="dialog" aria-label="Balanță cont">
            <div class="ft-bal-mhead">
              {#if isMobile}
                <button type="button" class="ft-bal-navbtn" aria-label="Înapoi" on:click={() => (activeModal = "account")}>
                  {@render figmaIcon(bd?.icons?.arrowBack, 16)}
                </button>
              {:else}
                <span></span>
              {/if}
              <button type="button" class="ft-bal-navbtn" aria-label="Închide" on:click={() => (activeModal = null)}>
                {@render figmaIcon(bd?.icons?.close, 16)}
              </button>
            </div>

            <div class="ft-bal-scroll">
              <div class="ft-bal-greet">
                <h3>{bd?.greetingTitle || "Hello, Name"}</h3>
                <p>{bd?.greetingSub || "Please see your balance details below:"}</p>
              </div>

              <!-- Card 1: Balanță + Cash + Bonus Progress -->
              <div class="ft-bal-card">
                <div class="ft-bal-line is-top">
                  <span class="ft-bal-l">
                    {@render figmaIcon(bd?.icons?.wallet, 20)}
                    <strong class="is-w">{bd?.totalLabel || "Balanță"}</strong>
                  </span>
                  <strong class="is-gold">{bd?.totalValue || "12000.00 RON"}</strong>
                </div>

                <div class="ft-bal-line">
                  <span>{bd?.cashLabel || "Cash"}</span>
                  <span>{bd?.cashValue || "7000.00 RON"}</span>
                </div>

                <button type="button" class="ft-bal-line is-btn" on:click={() => toggleBalSection("bonus")}>
                  <span>{bd?.bonusLabel || "Bonus"}</span>
                  <span class="ft-bal-r">
                    <span>{bd?.bonusValue || "5000.00 RON"}</span>
                    <span class="ft-sb-chev {collapsedBalSections.has('bonus') ? '' : 'is-open'}">⌄</span>
                  </span>
                </button>

                {#if !collapsedBalSections.has("bonus")}
                  <div class="ft-bal-bprogress">
                    {#each bd?.bonuses || [] as b}
                      <div class="ft-bal-bitem">
                        <div class="ft-bal-brow">
                          <span>{b.label}</span>
                          <div class="ft-bal-ptrack"><div class="ft-bal-pfill" style="width: {b.pct}%;"></div></div>
                          <span>{b.amount}</span>
                        </div>
                      </div>
                    {/each}
                    <div class="ft-bal-bnote">
                      {@render figmaIcon(bd?.icons?.info, 16)}
                      <span>{bd?.bonusNote || "Bonusurile vor fi plătite la 100%"}</span>
                    </div>
                  </div>
                {/if}
              </div>

              <!-- Card 2: Retrageri în așteptare -->
              <div class="ft-bal-card is-pad">
                <div class="ft-bal-line is-nopad">
                  <span class="ft-bal-l">
                    {@render figmaIcon(bd?.icons?.pendingWithdrawal, 20)}
                    <span>{bd?.withdrawalsLabel || "Retrageri în așteptare"}</span>
                  </span>
                  <strong class="is-gold">{bd?.withdrawalsValue || "25000.00 RON"}</strong>
                </div>
                <button type="button" class="ft-btn-outline is-full" on:click={() => toast("Retrageri anulate")}>
                  {bd?.cancelWithdrawalsLabel || "Anulează retrageri"}
                </button>
                <span class="ft-bal-or">{bd?.orLabel || "SAU"}</span>
                <button type="button" class="ft-btn-gold is-full" on:click={() => (activeModal = "deposit-missions")}>
                  {bd?.depositLabel || "Depunere"}
                </button>
              </div>

              <!-- Card Groups: 6 Reward Sections -->
              {#each bd?.rewardSections || [] as sec}
                <div class="ft-bal-card">
                  <button type="button" class="ft-bal-line is-btn" on:click={() => toggleBalSection(sec.id)}>
                    <span class="ft-bal-l">
                      {@render figmaIcon(balIconSvg(sec.iconKey), 20)}
                      <span>{sec.title}</span>
                    </span>
                    <span class="ft-bal-r">
                      <strong class="is-gold">{sec.total}</strong>
                      <span class="ft-sb-chev {collapsedBalSections.has(sec.id) ? '' : 'is-open'}">⌄</span>
                    </span>
                  </button>

                  {#if !collapsedBalSections.has(sec.id)}
                    {#if sec.items?.length}
                      <div class="ft-bal-thumbs">
                        {#each sec.items as it}
                          <button type="button" class="ft-bal-thumb" on:click={() => { activeModal = null; toast(sec.title); }}>
                            <img src={it.img} alt={sec.title} loading="lazy" decoding="async" />
                            {#if it.overlayImg}
                              <img src={it.overlayImg} alt="Roata Norocului" class="ft-bal-wheel-ov" />
                            {/if}
                            {#if it.badge}
                              <span class="ft-bal-tbadge">{it.badge}</span>
                            {/if}
                          </button>
                        {/each}
                      </div>
                    {:else if sec.freeBetTicket}
                      <div class="ft-bal-freebet">
                        <div class="ft-fb-ticket">
                          <span>{sec.freeBetTicket.amount}</span>
                        </div>
                        <span class="ft-bal-tbadge is-static">{sec.freeBetTicket.badge}</span>
                      </div>
                    {/if}
                  {/if}
                </div>
              {/each}
            </div>
          </div>

        {:else if activeModal === "deposit-missions"}
          <!-- Depunere cu misiuni (2507:9619 Desktop / 2507:10351 Mobile) -->
          {@const dm = CASHPOT_FIGMA_SPEC.shopData.depositMissionsModal}
          <div class="ft-modal {isMobile ? 'is-mob-full-panel' : ''}" role="dialog" aria-label="Depunere cu misiuni">
            <div class="ft-dep-header">
              <div class="ft-dep-hcopy">
                <h3>{dm?.title || "Fă o depunere"}</h3>
                <p>{dm?.subtitle || "Fiecare depunere poate fi răsplătită! Alege-ți mai jos bonusul."}</p>
              </div>
              <button type="button" class="ft-mclose" on:click={() => (activeModal = null)}>✕</button>
            </div>

            <div class="ft-dep-field">
              <div>
                <small>{dm?.methodLabel || "ALEGE METODA"}</small>
                <strong>{dm?.methodValue || "Plată cu cardul"}</strong>
              </div>
              <button type="button" class="ft-btn-gold is-sm" on:click={() => toast("Metodă selectată: Card bancar")}>
                {dm?.methodAction || "Schimbă"}
              </button>
            </div>

            <div class="ft-dep-field">
              <div>
                <small>{dm?.sumLabel || "SUMĂ (RON)"}</small>
                <strong>{selectedDeposit} RON</strong>
              </div>
            </div>

            <div class="ft-dep-amts">
              {#each dm?.amounts || [60, 100, 199, 500, 900] as amt}
                <button
                  type="button"
                  class="ft-cat-tile is-sm is-amt {selectedDeposit === amt ? 'active' : ''}"
                  on:click={() => (selectedDeposit = amt)}
                >{amt}</button>
              {/each}
            </div>

            <div class="ft-dep-missions">
              <div class="ft-dm-head">
                {@render figmaIcon(CASHPOT_FIGMA_SPEC.vipDuotoneIcons?.["crown"], 18)}
                <span>{dm?.missionsTitle || "Misiuni active (2)"}</span>
              </div>
              {#each dm?.missions || [] as m}
                {@const ok = selectedDeposit >= (m.minAmount || 0)}
                <div class="ft-dm-row {ok ? 'is-done' : ''}">
                  <span class="ft-dm-txt">{m.title}</span>
                  {#if m.progress}<span class="ft-dm-prog">{m.progress}</span>{/if}
                  <span class="ft-dm-pts">{m.points}</span>
                </div>
              {/each}
            </div>

            <div class="ft-dep-blbl">
              {@render figmaIcon(CASHPOT_FIGMA_SPEC.vipDuotoneIcons?.gift, 18)}
              <span>{dm?.bonusSectionTitle || "Alege bonusul"}</span>
            </div>

            <div class="ft-dep-bstrip">
              {#each dm?.bonuses || [] as bon}
                <button
                  type="button"
                  class="ft-dep-bcard {selectedDepositBonusId === bon.id ? 'is-sel' : ''}"
                  on:click={() => (selectedDepositBonusId = bon.id)}
                >
                  {#if bon.badge}<span class="ft-dep-bbadge">{bon.badge}</span>{/if}
                  <strong>{bon.headline}</strong>
                  {#if bon.game}<span class="ft-dep-bgame">{bon.game}</span>{/if}
                  {#if bon.extra}<span class="ft-dep-bextra">{bon.extra}</span>{/if}
                  {#if bon.minText}<small>{bon.minText}</small>{/if}
                </button>
              {/each}
            </div>

            <button type="button" class="ft-btn-gold is-full is-lg" on:click={() => { activeModal = null; shopPoints += selectedDeposit >= 100 ? 5 : 1; toast(`Depunere ${selectedDeposit} RON procesată`); }}>
              {dm?.submitLabel || "Depune"}
            </button>

            <p class="ft-dep-tax">{dm?.taxNote || "Taxa de 2% este adăugată la depunerea ta."}</p>

            <div class="ft-dep-summary">
              <div class="ft-dep-sumrow">
                <div><small>PLĂTEȘTI</small><strong>{Math.round(selectedDeposit * 1.02)} RON</strong></div>
                <span>›</span>
                <div><small>PRIMEȘTI</small><strong>{selectedDeposit} RON</strong></div>
              </div>
              <div class="ft-dep-sumbonus">
                <span>Puncte bonus</span>
                <strong class="is-gold">+{selectedDeposit >= 100 ? 5 : 0}p</strong>
              </div>
            </div>

            <button type="button" class="ft-seeall" on:click={() => (activeModal = null)}>
              {dm?.laterLabel || "Depune mai târziu"}
            </button>
          </div>

        {:else if activeModal === "providers"}
          <!-- Modal Furnizori Desktop / Sheet Furnizori Mobile (2381:47311 & 2381:55805) -->
          <div class="ft-modal {isMobile ? 'is-mob-sheet' : 'ft-modal-prov'}" role="dialog" aria-label="Furnizori">
            {#if isMobile}<span class="ft-sheet-handle" aria-hidden="true"></span>{/if}
            <div class="ft-mhead">
              <h3>Furnizori{draftProvidersMulti.size ? ` (${draftProvidersMulti.size})` : ""}</h3>
              <button type="button" class="ft-mclose" on:click={() => (activeModal = null)}>✕</button>
            </div>
            <input type="text" class="ft-minput" placeholder="Caută furnizori" bind:value={providerSearchQuery} />
            <div class="ft-prov-az-list">
              {#each groupedProvidersModal as [letter, items]}
                <div class="ft-prov-az-row">
                  <span class="ft-prov-letter">{letter}</span>
                  <div class="ft-prov-pills">
                    {#each items as p}
                      <button
                        type="button"
                        class="ft-prov-modal-tile {draftProvidersMulti.has(p.name) ? 'active' : ''}"
                        title={p.name}
                        on:click={() => toggleDraftProvider(p.name)}
                      >
                        {#if p.img}
                          <img src={p.img} alt={p.name} loading="lazy" decoding="async" />
                        {:else}
                          <span>{p.name}</span>
                        {/if}
                        {#if draftProvidersMulti.has(p.name)}
                          <span class="ft-pm-check" aria-hidden="true">✓</span>
                        {/if}
                      </button>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
            <div class="ft-mhead">
              <button type="button" class="ft-seeall" on:click={() => { draftProvidersMulti = new Set(); selectedProvidersMulti = new Set(); selectedProvider = "Toți"; }}>
                Resetează{draftProvidersMulti.size ? ` (${draftProvidersMulti.size})` : ""}
              </button>
              <button type="button" class="ft-btn-gold is-sm" on:click={applyProviderFilter}>Arată rezultatele</button>
            </div>
          </div>

        {:else if activeModal === "account"}
          <!-- Contul Meu (2296:19907 Mobile / 2263:10360 Desktop) -->
          {@const am = CASHPOT_FIGMA_SPEC.accountMenuData}
          <div class="ft-drawer-right {isMobile ? 'is-mob-account-full' : 'is-account-bg'}" role="dialog" aria-label="Contul meu">
            <div class="ft-acc-scroll">
              <div class="ft-mhead">
                <div class="ft-acc-head">
                  <div class="ft-acc-av-ring">
                    <img src={CASHPOT_FIGMA_SPEC.headerAssets.smarticoAvatar} alt="Avatar" class="ft-acc-av" />
                  </div>
                  <h3>{am?.username || "Nume utilizator"}</h3>
                </div>
                <button type="button" class="ft-mclose is-40" aria-label="Închide contul" on:click={() => (activeModal = null)}>
                  {@render figmaIcon(am?.closeIcon, 18)}
                </button>
              </div>

              <button type="button" class="ft-sb-deposit" on:click={() => (activeModal = "deposit-missions")}>
                {am?.depositCta || "Depunere"}
              </button>

              {#each am?.groups || [] as grp}
                <div class="ft-sb-card">
                  {#each grp.items as item}
                    {#if item.children?.length}
                      {@const open = openAccountAccs.has(item.id)}
                      <button type="button" class="ft-sb-item is-acc-main" on:click={() => toggleAccountAcc(item.id)}>
                        <span class="ft-sb-il">
                          {@render figmaIcon(item.svg, 20)}
                          <span>{item.label}</span>
                        </span>
                        <span class="ft-sb-chev {open ? 'is-open' : ''}">⌄</span>
                      </button>
                      {#if open}
                        <div class="ft-sb-sublist">
                          {#each item.children as ch}
                            <button type="button" class="ft-sb-item is-sub" on:click={() => toast(ch)}>
                              {@render figmaIcon(item.svg, 18)}
                              <span>{ch}</span>
                            </button>
                          {/each}
                        </div>
                      {/if}
                    {:else}
                      <button
                        type="button"
                        class="ft-sb-item {item.action === 'logout' ? 'is-danger' : ''}"
                        on:click={() => {
                          if (item.action === "deposit-missions") activeModal = "deposit-missions";
                          else if (item.action === "balance") activeModal = "balance";
                          else if (item.action === "logout") {
                            authMode = "pre-login";
                            activeModal = null;
                            toast("Te-ai deconectat");
                          } else toast(item.label);
                        }}
                      >
                        <span class="ft-sb-il">
                          {@render figmaIcon(item.svg, 20)}
                          <span>{item.label}</span>
                        </span>
                      </button>
                    {/if}
                  {/each}
                </div>
              {/each}
            </div>

            {#if isMobile}
              {@render mobileBottomNavBar()}
            {/if}
          </div>

        {:else if activeModal === "burger"}
          <!-- Full Mobile Burger Menu (2296:19906 Logat / 2296:20679 Pre-login + 2508:15405 VIP Banner) -->
          <div class="ft-drawer-left {isMobile ? 'is-mob-full-nav' : ''}" role="dialog" aria-label="Burger Menu Mobile">
            <div class="ft-acc-scroll">
              <div class="ft-mhead">
                <img src={CASHPOT_FIGMA_SPEC.headerAssets.logo} alt="CashPot" style="height: 22px;" />
                <button type="button" class="ft-mclose is-40" aria-label="Închide meniul" on:click={() => (activeModal = null)}>
                  {@render figmaIcon(CASHPOT_FIGMA_SPEC.uiIcons?.closeX, 18)}
                </button>
              </div>

              {#if !isLoggedIn || isPreLander}
                <div class="ft-dp-grid">
                  <button type="button" class="ft-btn-outline" on:click={() => (activeModal = "login-existing")}>Conectare</button>
                  <button type="button" class="ft-btn-gold" on:click={() => { authMode = "logged-in"; activeModal = null; }}>Înregistrare</button>
                </div>
              {/if}

              <!-- Featured entries (2493:53903 / 2493:53868) -->
              <div class="ft-sb-featured">
                {#each CASHPOT_FIGMA_SPEC.sidebarFeatured as card}
                  <button
                    type="button"
                    class="ft-sb-feat-card"
                    on:click={() => {
                      if (card.id === "promo") activePage = "shop-premii";
                      else toast(`${card.title.replace(/\n/g, " ")}`);
                      activeModal = null;
                    }}
                  >
                    <span class="ft-sb-feat-lbl">{card.title}</span>
                    <img src={card.img} alt={card.title} />
                  </button>
                {/each}
              </div>

              {#if isLoggedIn && !isPreLander}
                <!-- VIP progress widget (2493:92062) -->
                <button
                  type="button"
                  class="ft-sb-vip {activePage === 'vip' ? 'active' : ''}"
                  on:click={() => { activePage = "vip"; activeModal = null; }}
                >
                  <img src={CASHPOT_FIGMA_SPEC.vipClubData.levelStatus.badgeImg} alt="Argint 1" class="ft-sb-vip-badge" />
                  <div class="ft-sb-vip-info">
                    <div class="ft-sb-vip-top">
                      <strong>{CASHPOT_FIGMA_SPEC.vipClubData.levelStatus.tierName}</strong>
                      <span class="ft-sb-vip-pill">VIP Club</span>
                    </div>
                    <div class="ft-sb-vip-bot">
                      <div class="ft-sb-vip-track"><div class="ft-sb-vip-fill" style="width: 70%;"></div></div>
                      <span>{CASHPOT_FIGMA_SPEC.vipClubData.levelStatus.points}</span>
                    </div>
                  </div>
                </button>

                <!-- VIP sidebar banner (2508:15405) -->
                <button
                  type="button"
                  class="ft-mob-vipbanner"
                  on:click={() => { activePage = "shop-premii"; activeModal = null; }}
                >
                  <img src={CASHPOT_FIGMA_SPEC.headerAssets.vipSidebarBannerImg || CASHPOT_FIGMA_SPEC.vipClubData.levelStatus.badgeImg} alt="MISIUNI ZILNICE" />
                  <div class="ft-mvb-copy">
                    <span class="ft-banner-tag">MISIUNI ZILNICE</span>
                    <strong>Premii de peste 1,5M euro</strong>
                  </div>
                  <span class="ft-mvb-chev">{@render figmaIcon(CASHPOT_FIGMA_SPEC.uiIcons?.chevronRight, 14)}</span>
                </button>

                <!-- Deposit CTA (2269:11335) -->
                <button type="button" class="ft-sb-deposit" on:click={() => (activeModal = "deposit-missions")}>
                  Depunere
                </button>

                <!-- Group 1 · Joc & oferte: Bonusuri (2251:15699) -->
                {#if CASHPOT_FIGMA_SPEC.sidebarGroups.jocOferteParent}
                  <div class="ft-sb-card">
                    <button type="button" class="ft-sb-item" on:click={() => toggleAccordion("BurgerBonusuri")}>
                      {@render figmaIcon(CASHPOT_FIGMA_SPEC.sidebarGroups.jocOferteParent.svg, 20)}
                      <span>{CASHPOT_FIGMA_SPEC.sidebarGroups.jocOferteParent.label}</span>
                      <span class="ft-sb-chev {openAccordions.has('BurgerBonusuri') ? 'is-open' : ''}">▾</span>
                    </button>
                    {#if openAccordions.has("BurgerBonusuri")}
                      {#each CASHPOT_FIGMA_SPEC.sidebarGroups.jocOferteSub as sub}
                        <button type="button" class="ft-sb-item is-sub" on:click={() => { navigateToSidebarItem(sub.label); activeModal = null; }}>
                          <span>{sub.label}</span>
                        </button>
                      {/each}
                    {/if}
                  </div>
                {/if}
              {/if}

              <!-- Group 2 · Club & extra (2251:15431 / 2251:15002): Loto + VIP Club NOU + Live RTP + Turnee (+ Favorite when logat) -->
              <div class="ft-sb-card">
                <button type="button" class="ft-sb-item" on:click={() => { if (isPreLander) authMode = "logged-in"; navigateToSidebarItem("Loto"); activeModal = null; }}>
                  {@render figmaIcon(CASHPOT_FIGMA_SPEC.uiIcons?.loto, 20)}
                  <span>Loto</span>
                </button>
                {#each CASHPOT_FIGMA_SPEC.sidebarGroups.clubExtra.filter((x) => (isLoggedIn && !isPreLander) || x.label !== "Favorite") as item}
                  <button
                    type="button"
                    class="ft-sb-item"
                    on:click={() => {
                      if (isPreLander) authMode = "logged-in";
                      navigateToSidebarItem(item.label);
                      activeModal = null;
                    }}
                  >
                    {@render figmaIcon(item.svg, 20)}
                    <span>{item.label}</span>
                    {#if item.badge}<span class="ft-sb-nou">{item.badge}</span>{/if}
                  </button>
                {/each}
              </div>

              <!-- Group · Ajutor: Asistență (2269:11751 / 2269:12237) -->
              {#if CASHPOT_FIGMA_SPEC.sidebarGroups.asistenta}
                <div class="ft-sb-card">
                  <button type="button" class="ft-sb-item" on:click={() => { toast("Asistență Live Chat 24/7"); activeModal = null; }}>
                    {@render figmaIcon(CASHPOT_FIGMA_SPEC.sidebarGroups.asistenta.svg, 20)}
                    <span>{CASHPOT_FIGMA_SPEC.sidebarGroups.asistenta.label}</span>
                  </button>
                </div>
              {/if}

              <!-- Sidebar app banner (2336:26202) -->
              <button
                type="button"
                class="ft-sb-app"
                on:click={() => { if (isPreLander) authMode = "logged-in"; activePage = "shop-premii"; activeModal = null; }}
              >
                <img src={CASHPOT_FIGMA_SPEC.sidebarAppBannerImg} alt="Descarcă aplicația CashPot" />
                <div class="ft-sb-app-overlay">
                  <span class="ft-sb-app-title">Descarcă aplicația</span>
                </div>
              </button>
            </div>

            {#if isMobile}
              {@render mobileBottomNavBar()}
            {/if}
          </div>

        {:else if activeModal === "vip"}
          <!-- 4 VIP Club Modals 1:1 (2537:44456, 2537:44599, 2537:44684, 2537:44751) -->
          <div class="ft-modal {isMobile ? 'is-mob-sheet' : ''}" role="dialog" aria-label="VIP Club Modal">
            {#if isMobile}<span class="ft-sheet-handle" aria-hidden="true"></span>{/if}
            {#if activeVipModalId === "rewards"}
              <div class="ft-mhead">
                <h3>Recompense Argint</h3>
                <button type="button" class="ft-mclose" on:click={() => (activeModal = null)}>✕</button>
              </div>
              <p class="ft-mcopy">La fiecare nivel din Argint primești bani bonus. Îi poți retrage după rulaj x10.</p>
              <div class="ft-bal-rows">
                <div><strong>Argint 1 · 300 puncte VIP</strong><span class="is-gold">20 RON bonus</span></div>
                <div><strong>Argint 2 · 600 puncte VIP · Încă 180 puncte VIP</strong><span class="is-gold">30 RON bonus</span></div>
                <div><strong>Argint 3 · 1.000 puncte VIP</strong><span class="is-gold">50 RON bonus</span></div>
                <div><strong>Total pe Argint</strong><strong class="is-gold">100 RON bonus</strong></div>
              </div>
              <div class="ft-dp-grid">
                <button type="button" class="ft-btn-gold" on:click={() => (activeModal = "deposit-missions")}>Depune acum</button>
                <button type="button" class="ft-btn-outline" on:click={() => { activeModal = null; activePage = "shop-misiuni"; }}>Vezi misiunile</button>
              </div>
            {:else if activeVipModalId === "points"}
              <div class="ft-mhead">
                <h3>Ce sunt punctele VIP?</h3>
                <button type="button" class="ft-mclose" on:click={() => (activeModal = null)}>✕</button>
              </div>
              <div class="ft-bal-rows">
                <div><span>Primești 1 punct VIP la fiecare 10 RON depuși.</span></div>
                <div><span>Primești între 5 și 40 puncte VIP pentru fiecare misiune completată.</span></div>
                <div><span>Nu se cheltuiesc și nu expiră. Arată doar nivelul tău.</span></div>
                <div><span>Sunt separate de punctele din Shop, cu care cumperi premii.</span></div>
              </div>
              <button type="button" class="ft-btn-gold is-full" on:click={() => (activeModal = "deposit-missions")}>Depune acum</button>
            {:else if activeVipModalId === "levelUp"}
              <div class="ft-mhead">
                <h3>Felicitări! Ai ajuns la Argint 2</h3>
                <button type="button" class="ft-mclose" on:click={() => (activeModal = null)}>✕</button>
              </div>
              <p class="ft-mcopy">Ai primit <strong class="is-gold">30 RON bonus</strong>. Îl găsești în Bonusurile mele.</p>
              <button type="button" class="ft-btn-gold is-full" on:click={() => { activeModal = null; toast("Deschide Bonusurile mele"); }}>Vezi bonusurile mele</button>
            {:else}
              <div class="ft-mhead">
                <h3>Cashback-ul săptămânii: 20 RON</h3>
                <button type="button" class="ft-mclose" on:click={() => (activeModal = null)}>✕</button>
              </div>
              <p class="ft-mcopy">0,2% din rulajul de 10.000 RON. Valabil 72 de ore.</p>
              <button type="button" class="ft-btn-gold is-full" on:click={() => { activeModal = null; toast("Deschide Bonusurile mele"); }}>Vezi în Bonusurile mele</button>
            {/if}
          </div>

        {:else if activeModal === "prize-drawer"}
          <!-- All 5 Category Prize Drawers (2498:7450 / 2497:7413 header) -->
          <div class="ft-modal {isMobile ? 'is-mob-sheet' : 'is-prize-drawer-modal'}" role="dialog" aria-label="Prize Drawer">
            {#if isMobile}<span class="ft-sheet-handle" aria-hidden="true"></span>{/if}
            <div class="ft-mhead">
              <div class="ft-pd-summary">
                <div class="ft-pd-pts">
                  <small>PUNCTE</small>
                  <strong class="is-gold">{shopPoints.toLocaleString("ro-RO")}</strong>
                </div>
                <span class="ft-pd-avail"><strong>3/7</strong> premii disponibile</span>
              </div>
              <button type="button" class="ft-mclose" on:click={() => (activeModal = null)}>✕</button>
            </div>
            <div class="ft-search-tags">
              {#each CASHPOT_FIGMA_SPEC.shopData.prizeDrawers || [] as dr}
                <button
                  type="button"
                  class="ft-cat-tile is-sm {activeDrawerCategory === dr.category ? 'active' : ''}"
                  on:click={() => (activeDrawerCategory = dr.category)}
                >{dr.category}</button>
              {/each}
            </div>
            <div class="ft-shop-prizes-grid {isMobile ? 'is-mob' : 'is-drawer'}">
              {#each activeDrawerData.items as item}
                {#if item.isGrandPrize}
                  <div class="ft-grand-prize-card {isMobile ? 'is-mob' : 'is-span2'}">
                    <span class="ft-gp-ribbon">{item.ribbon || "PREMIUL CEL MARE"}</span>
                    <div class="ft-gp-body">
                      {#if item.img}<img src={item.img} alt={item.title} />{/if}
                      <div class="ft-gp-copy">
                        <strong>{item.title}</strong>
                        <p>Preț: <strong class="is-gold">{item.pointsLabel}</strong> · {item.stock}</p>
                        {#if item.missing}<small>{item.missing}</small>{/if}
                      </div>
                      <button
                        type="button"
                        class="ft-btn-gold is-sm"
                        on:click={() => {
                          if (shopPoints >= item.points) {
                            shopPoints -= item.points;
                            openShopPopup("congrats");
                          } else {
                            openShopPopup("almost");
                          }
                        }}
                      >Revendică</button>
                    </div>
                  </div>
                {:else}
                  <div class="ft-shop-prize">
                    {#if item.img}<img src={item.img} alt={item.title} />{/if}
                    <strong>{item.title}</strong>
                    {#if item.subtitle}<small class="ft-sp-cat">{item.subtitle}</small>{/if}
                    {#if item.stock}<small class="ft-sp-cat">{item.stock}</small>{/if}
                    <span class="ft-sp-pts">{item.pointsLabel}</span>
                    {#if item.missing}<small class="ft-sp-cat">{item.missing}</small>{/if}
                    <button
                      type="button"
                      class="ft-btn-gold is-sm is-full"
                      on:click={() => {
                        if (shopPoints >= item.points) {
                          shopPoints -= item.points;
                          openShopPopup("congrats");
                        } else {
                          openShopPopup("almost");
                        }
                      }}
                    >Revendică</button>
                  </div>
                {/if}
              {/each}
            </div>
          </div>

        {:else if activeModal === "shop-popup"}
          <!-- All 11 Shop & VIP Popups (2502:8848) -->
          <div class="ft-modal {isMobile ? 'is-mob-sheet' : ''}" role="dialog" aria-label={activeShopPopupData?.label || "Popup Shop"}>
            {#if isMobile}<span class="ft-sheet-handle" aria-hidden="true"></span>{/if}
            <div class="ft-mhead">
              <h3>{activeShopPopupData?.texts?.[0] || activeShopPopupData?.label}</h3>
              <button type="button" class="ft-mclose" on:click={() => (activeModal = null)}>✕</button>
            </div>
            {#if activeShopPopupData?.imgs?.[0]}
              <img src={activeShopPopupData.imgs[0]} alt={activeShopPopupData.label} class="ft-prize-drawer-img" />
            {/if}
            {#each (activeShopPopupData?.texts || []).slice(1) as txt}
              <p class="ft-mcopy">{txt}</p>
            {/each}

            {#if activeShopPopupId === "rating"}
              <div class="ft-dp-grid">
                <button type="button" class="ft-btn-outline {popupRatingChoice === 'negative' ? 'is-gold-border' : ''}" on:click={() => { popupRatingChoice = "negative"; activeShopPopupId = "feedback"; }}>Nu mi-a plăcut</button>
                <button type="button" class="ft-btn-gold" on:click={() => { popupRatingChoice = "positive"; toast("Mulțumim pentru evaluare!"); activeModal = null; }}>Mi-a plăcut</button>
              </div>
            {:else if activeShopPopupId === "feedback"}
              <input type="text" class="ft-minput" placeholder="Mesajul tău..." bind:value={popupFeedbackText} />
              <button type="button" class="ft-btn-gold is-full" on:click={() => { toast("Feedback trimis!"); popupFeedbackText = ""; activeModal = null; }}>Trimite feedback</button>
            {:else}
              <button type="button" class="ft-btn-gold is-full" on:click={() => { activeModal = null; toast(`Acțiune: ${activeShopPopupData?.label}`); }}>
                Continuă
              </button>
            {/if}
          </div>

        {:else if activeModal === "login-existing"}
          <!-- Login modal (Email existent 2505:9578) -->
          <div class="ft-modal {isMobile ? 'is-mob-sheet' : ''}" role="dialog" aria-label="Conectare">
            {#if isMobile}<span class="ft-sheet-handle" aria-hidden="true"></span>{/if}
            <div class="ft-mhead">
              <h3>Conectare</h3>
              <button type="button" class="ft-mclose" on:click={() => (activeModal = null)}>✕</button>
            </div>
            <p class="ft-mcopy">
              {CASHPOT_FIGMA_SPEC.shopData.loginModalTexts?.[1] || "Ai deja un cont cu acest email. Conectează-te pentru a continua să aduni puncte."}
            </p>
            <span class="ft-dp-lbl">EMAIL</span>
            <input type="email" class="ft-minput" placeholder="Email" bind:value={loginEmail} aria-label="Email" />
            <input type="password" class="ft-minput" placeholder="Parola" bind:value={loginPassword} aria-label="Parola" />
            <button type="button" class="ft-seeall" style="align-self: flex-end;" on:click={() => toast("Link resetare parolă trimis")}>Ai uitat parola?</button>
            <button
              type="button"
              class="ft-btn-gold is-full"
              on:click={() => { authMode = "logged-in"; activeModal = null; toast("Conectat cu succes!"); }}
            >Conectare</button>
            <div class="ft-login-foot">
              <span>Nu ai un cont?</span>
              <button type="button" class="ft-seeall is-gold" on:click={() => { authMode = "logged-in"; activeModal = null; }}>Înregistrează-te</button>
            </div>
          </div>

        {:else if activeModal === "prize" && selectedPrize}
          <div class="ft-drawer-right {isMobile ? 'is-mob-sheet' : ''}" role="dialog" aria-label="Detalii Premiu">
            <div class="ft-mhead">
              <h3>{selectedPrize.title}</h3>
              <button type="button" class="ft-mclose" on:click={() => (activeModal = null)}>✕</button>
            </div>
            <img src={selectedPrize.img} alt={selectedPrize.title} class="ft-prize-drawer-img" />
            <p class="ft-mcopy">Categorie: <strong>{selectedPrize.category}</strong> · Cost: <strong>{selectedPrize.points.toLocaleString("ro-RO")} puncte</strong></p>
            <button
              type="button"
              class="ft-btn-gold is-full"
              on:click={() => {
                if (shopPoints >= selectedPrize.points) {
                  shopPoints -= selectedPrize.points;
                  openShopPopup("congrats");
                } else {
                  openShopPopup("upsell");
                }
              }}
            >
              Revendică Premiul
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

{#if toastText}
  <div class="ft-toast" role="status">{toastText}</div>
{/if}

<style>
  /* ── Host Scroll-Container Lock Scoped Strictly to #cashpot-test ── */
  :global(.main-wrapper:has(.ft-canvas)) {
    min-width: 0;
    max-width: 100vw;
    overflow-x: hidden;
  }

  :global(.figma-scroll-container:has(.ft-canvas)) {
    min-width: 0;
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden !important;
    overscroll-behavior-x: none;
  }

  :global(html:has(.ft-viewport.is-mobile-layout:not(.is-mobile-360))),
  :global(body:has(.ft-viewport.is-mobile-layout:not(.is-mobile-360))),
  :global(.layout:has(.ft-viewport.is-mobile-layout:not(.is-mobile-360))),
  :global(.main-wrapper:has(.ft-viewport.is-mobile-layout:not(.is-mobile-360))),
  :global(.figma-scroll-container:has(.ft-viewport.is-mobile-layout:not(.is-mobile-360))) {
    height: 100dvh !important;
    max-height: 100dvh !important;
    overflow: hidden !important;
    overscroll-behavior: none;
  }

  /* ── Canvas & Viewport ── */
  .ft-canvas {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    min-height: 100vh;
    overflow-x: clip;
    background: #0e0c10;
    color: #ffffff;
    font-family: "Inter", system-ui, -apple-system, sans-serif;
    padding-top: 1px;
  }

  .ft-canvas :global(button) {
    -webkit-tap-highlight-color: transparent;
  }

  .ft-canvas:has(.ft-viewport.is-mobile-layout:not(.is-mobile-360)) {
    height: 100dvh;
    min-height: 0;
    padding-top: 0;
    overflow: hidden;
  }

  .ft-canvas.is-mobile-stage {
    padding: 20px 12px 40px;
    background: #070509;
    display: flex;
    justify-content: center;
  }

  .ft-viewport.is-desktop-1920 {
    width: 100%;
    max-width: 1920px;
    margin: 0 auto;
    background: #0e0c10;
  }

  .ft-viewport.is-mobile-360 {
    width: 360px;
    max-width: 100%;
    height: 780px;
    overflow: hidden;
    background: #0e0c10;
    border-radius: 26px;
    border: 2px solid #2e2838;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75);
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .ft-viewport.is-mobile-layout {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: clip;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .ft-viewport.is-mobile-layout:not(.is-mobile-360) {
    height: 100dvh;
    min-height: 0;
    overflow: hidden;
    position: relative;
  }

  .ft-scroll-area {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: clip;
  }

  .ft-scroll-area.is-phone-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    display: flex;
    flex-direction: column;
    scrollbar-width: none;
  }

  .ft-scroll-area:global(.is-axis-locked-y) {
    overflow-y: hidden !important;
  }

  .ft-scroll-area :global(.is-axis-locked-x) {
    overflow-x: hidden !important;
  }

  .ft-scroll-area.is-phone-scroll::-webkit-scrollbar {
    display: none;
  }

  .ft-svg-icon {
    display: inline-block;
    flex-shrink: 0;
  }

  /* ── Top Nav (1888x70 floating #1f1b24 r=24) ── */
  .ft-topnav-outer {
    position: sticky;
    top: 0;
    z-index: 40;
    background: #0e0c10;
    padding: 16px 16px 0;
  }

  .ft-topnav-outer.is-mob {
    position: relative;
    top: auto;
    padding: 0;
    flex-shrink: 0;
  }

  .ft-topnav {
    height: 70px;
    background: #1f1b24;
    border-radius: 24px;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }

  .ft-topnav.is-mob {
    height: 60px;
    border-radius: 0;
    padding: 0 10px;
    gap: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .ft-tn-left {
    width: 268px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .ft-topnav.is-mob .ft-tn-left {
    width: auto;
  }

  .ft-logo-btn {
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .ft-logo-btn img {
    height: 28px;
    width: auto;
    display: block;
  }

  .ft-logo-btn .ft-logo-mark-mob {
    width: 44px;
    height: 44px;
    object-fit: contain;
  }

  .ft-search-pill {
    flex: 1;
    max-width: 998px;
    height: 48px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 0 20px;
    color: #8f84a4;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-family: inherit;
    cursor: pointer;
    text-align: left;
  }

  @media (hover: hover) and (pointer: fine) {
    .ft-search-pill:hover {
      background: rgba(255, 255, 255, 0.11);
    }
  }

  .ft-tn-actions {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
  }

  .ft-tn-actions.is-mob {
    gap: 6px;
  }

  .ft-tn-iconbtn {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .ft-tn-iconbtn.is-mob {
    width: 32px;
    height: 32px;
  }

  .ft-tn-iconbtn img {
    width: 38px;
    height: 38px;
    object-fit: contain;
  }

  .ft-tn-iconbtn.is-mob img {
    width: 30px;
    height: 30px;
  }

  .ft-tn-iconbtn img.is-avatar {
    border-radius: 50%;
    object-fit: cover;
  }

  .ft-red-badge {
    position: absolute;
    top: -3px;
    right: -3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ed3030;
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .ft-mob-searchbtn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #27222d;
    border: none;
    color: #d2cddb;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .ft-balance-capsule {
    position: relative;
    height: 40px;
    background: #27222d;
    border: 1px solid #464050;
    border-radius: 999px;
    padding: 4px 12px 4px 4px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .ft-balance-capsule.is-mob {
    height: 34px;
    padding: 3px 9px 3px 3px;
    gap: 6px;
  }

  .ft-plus-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #eeb665;
    color: #0e0c10;
    border: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .ft-plus-circle.is-mob {
    width: 26px;
    height: 26px;
  }

  .ft-balance-readout {
    background: transparent;
    border: none;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    font-family: inherit;
    padding: 0;
  }

  .ft-balance-readout strong {
    font-size: 13.5px;
    font-weight: 700;
  }

  .ft-balance-readout.is-mob strong {
    font-size: 12px;
  }

  .ft-balance-readout span {
    font-size: 12px;
    color: #8f84a4;
    font-weight: 600;
  }

  .ft-balance-readout.is-mob span {
    font-size: 10.5px;
  }

  .ft-bal-dot {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #eeb665;
  }

  /* Buttons */
  .ft-btn-gold {
    background: #f2b94b;
    color: #0e0c10;
    border: none;
    border-radius: 12px;
    height: 40px;
    padding: 0 22px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
  }

  .ft-btn-outline {
    background: transparent;
    color: #ffffff;
    border: 1px solid #464050;
    border-radius: 12px;
    height: 40px;
    padding: 0 20px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
  }

  .ft-btn-gold.is-sm,
  .ft-btn-outline.is-sm {
    height: 32px;
    padding: 0 12px;
    font-size: 12px;
    border-radius: 9px;
  }

  .ft-btn-gold.is-lg {
    height: 48px;
    padding: 0 28px;
    font-size: 15px;
  }

  .ft-btn-gold.is-wide-cta {
    height: 48px;
    padding: 0 32px;
  }

  .ft-btn-gold.is-full,
  .ft-btn-outline.is-full {
    width: 100%;
  }

  /* ── Body & 300px Sidebar ── */
  .ft-body {
    display: flex;
    align-items: flex-start;
  }

  .ft-body.is-mob {
    display: block;
    flex: 1;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: clip;
  }

  .ft-sidebar {
    width: 300px;
    flex-shrink: 0;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ft-sb-featured {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }

  .ft-sb-feat-card {
    height: 112px;
    border-radius: 14px;
    background: linear-gradient(180deg, #00337d 0%, #00132e 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 10px 6px 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    font-family: inherit;
  }

  .ft-sb-feat-lbl {
    color: #d2cddb;
    font-size: 11.5px;
    font-weight: 700;
    line-height: 1.2;
    text-align: center;
    white-space: pre-line;
  }

  .ft-sb-feat-card img {
    width: 56px;
    height: 56px;
    object-fit: contain;
  }

  .ft-sb-vip {
    width: 100%;
    height: 62px;
    border-radius: 14px;
    background: #1f1b24;
    border: 1px solid rgba(255, 255, 255, 0.06);
    padding: 9px 10px;
    display: flex;
    align-items: center;
    gap: 9px;
    cursor: pointer;
    font-family: inherit;
    color: #fff;
    text-align: left;
  }

  .ft-sb-vip.active {
    border-color: #eeb665;
  }

  .ft-sb-vip-badge {
    width: 44px;
    height: 44px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .ft-sb-vip-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ft-sb-vip-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ft-sb-vip-top strong {
    font-size: 13px;
  }

  .ft-sb-vip-pill {
    background: rgba(18, 18, 18, 0.75);
    color: #d2cddb;
    font-size: 10.5px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
  }

  .ft-sb-vip-bot {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 700;
  }

  .ft-sb-vip-track {
    flex: 1;
    height: 6px;
    border-radius: 999px;
    background: #464050;
    overflow: hidden;
  }

  .ft-sb-vip-track.is-lg {
    height: 10px;
    max-width: 420px;
    margin: 8px 0;
  }

  .ft-sb-vip-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #eab949, #eeb665);
  }

  .ft-sb-deposit {
    width: 100%;
    height: 48px;
    border-radius: 12px;
    background: #f2b94b;
    color: #0e0c10;
    border: none;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    font-family: inherit;
  }

  .ft-sb-card {
    background: #1f1b24;
    border-radius: 16px;
    padding: 5px;
    display: flex;
    flex-direction: column;
  }

  .ft-sb-item {
    height: 48px;
    border-radius: 12px;
    background: transparent;
    border: none;
    padding: 0 14px;
    color: #d2cddb;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
  }

  @media (hover: hover) and (pointer: fine) {
    .ft-sb-item:hover {
      background: rgba(255, 255, 255, 0.04);
      color: #ffffff;
    }
  }

  .ft-sb-item.is-gold-active {
    background: #f2b94b;
    color: #0e0c10;
    font-weight: 700;
  }

  .ft-sb-item.is-active {
    background: #464050;
    color: #eeb665;
  }

  .ft-sb-item.is-sub {
    height: 42px;
    padding-left: 46px;
    font-size: 13px;
    color: #8f84a4;
  }

  .ft-sb-item.is-acc-main {
    justify-content: space-between;
  }

  .ft-sb-il {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .ft-sb-sublist {
    display: flex;
    flex-direction: column;
  }

  .ft-sb-nou {
    margin-left: auto;
    background: #6000c7;
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 999px;
  }

  .ft-sb-chev {
    margin-left: auto;
    font-size: 12px;
    transition: transform 0.15s ease;
  }

  .ft-sb-chev.is-open {
    transform: rotate(180deg);
  }

  .ft-sb-app {
    position: relative;
    height: 106px;
    border-radius: 16px;
    overflow: hidden;
    background: #27222d;
    border: 1px solid rgba(255, 255, 255, 0.06);
    padding: 0;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
  }

  .ft-sb-app img {
    width: 100%;
    height: 106px;
    object-fit: cover;
    display: block;
  }

  .ft-sb-app-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(16, 13, 26, 0.94) 42%, rgba(16, 13, 26, 0.25) 100%);
    padding: 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .ft-sb-app-title {
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
    max-width: 130px;
    line-height: 1.2;
  }

  /* ── Main Content ── */
  .ft-main {
    flex: 1;
    min-width: 0;
    padding: 16px 24px 36px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .ft-main.is-mob {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: clip;
    padding: 12px 12px 24px;
    gap: 22px;
  }

  /* Pre-lander Stepper & Feature Banners (2203:5518) */
  .ft-pl-stepper {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .ft-pl-stepper.is-mob {
    grid-template-columns: minmax(0, 1fr);
  }

  .ft-pl-step {
    background: #1f1b24;
    border-radius: 16px;
    padding: 18px;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .ft-pl-num {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(242, 185, 75, 0.14);
    color: #f2b94b;
    font-size: 16px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ft-pl-step strong {
    display: block;
    font-size: 15px;
  }

  .ft-pl-step p {
    margin: 4px 0 0;
    font-size: 12.5px;
    color: #8f84a4;
  }

  .ft-pl-featbanner {
    background: #1f1b24;
    border-radius: 20px;
    padding: 28px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    overflow: hidden;
  }

  .ft-pl-featbanner.is-compact {
    padding: 22px;
  }

  .ft-pl-featbanner.is-mob {
    flex-direction: column;
    text-align: center;
  }

  .ft-pl-fb-copy h2,
  .ft-pl-fb-copy h3 {
    margin: 6px 0;
  }

  .ft-pl-fb-copy p {
    margin: 0 0 14px;
    font-size: 13.5px;
    color: #d2cddb;
    max-width: 520px;
  }

  .ft-pl-fb-img {
    height: 170px;
    width: 280px;
    border-radius: 14px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .ft-pl-fb-thumb {
    width: 120px;
    height: 160px;
    border-radius: 12px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .ft-hero-signup {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    max-width: 420px;
    width: 100%;
  }

  .ft-hero-signup.is-mob {
    max-width: 100%;
  }

  .ft-hero-email {
    flex: 1;
    min-width: 0;
    height: 44px;
    border-radius: 12px;
    background: rgba(14, 12, 16, 0.86);
    border: 1px solid #464050;
    padding: 0 14px;
    color: #ffffff;
    font-size: 14px;
    font-family: inherit;
  }

  .ft-hero-signup.is-mob .ft-hero-email {
    height: 36px;
    font-size: 13px;
  }

  .ft-pl-bullets {
    margin: 0 0 14px;
    padding-left: 18px;
    color: #d2cddb;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* Hero & 4-up Secondary Banners */
  .ft-sec-banners {
    position: relative;
    min-width: 0;
    max-width: 100%;
  }

  .ft-sec-banners-row {
    display: grid;
    grid-template-columns: repeat(9, calc((100% - 48px) / 4));
    gap: 16px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    min-width: 0;
    max-width: 100%;
    scrollbar-width: none;
  }

  .ft-sec-banners-row.is-mob {
    grid-template-columns: repeat(9, 100%);
    gap: 0;
    scroll-snap-type: x mandatory;
  }

  .ft-sec-banners-row::-webkit-scrollbar {
    display: none;
  }

  .ft-sec-banner-card {
    position: relative;
    height: 152px;
    border-radius: 16px;
    overflow: hidden;
    background: #1f1b24;
  }

  .ft-sec-banner-card.is-side {
    height: 165px;
  }

  .ft-banner-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ft-banner-scrim {
    position: relative;
    z-index: 2;
    height: 100%;
    padding: 16px 18px;
    background: linear-gradient(90deg, #0e0c10 0%, rgba(14, 12, 16, 0.72) 52%, transparent 100%);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 4px;
  }

  .ft-banner-scrim.is-big {
    padding: 32px;
    gap: 10px;
  }

  .ft-banner-tag {
    color: #eeb665;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .ft-sec-banner-card h3 {
    margin: 0;
    font-size: 15.5px;
    line-height: 1.2;
    max-width: 210px;
  }

  .ft-sec-banner-card p {
    margin: 0;
    font-size: 11.5px;
    color: #d2cddb;
  }

  .ft-banner-purple-cta {
    margin-top: 6px;
    height: 28px;
    padding: 0 12px;
    border-radius: 8px;
    background: linear-gradient(180deg, #6000c7 0%, #43008f 100%);
    color: #fff;
    border: none;
    font-size: 11.5px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }

  .ft-edge-arrow {
    position: absolute;
    top: 58px;
    z-index: 4;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #27222d;
    border: 1px solid #464050;
    color: #fff;
    font-size: 18px;
    cursor: pointer;
  }

  .ft-edge-arrow.left { left: -16px; }
  .ft-edge-arrow.right { right: -16px; }

  .ft-dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-top: 10px;
  }

  .ft-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #464050;
  }

  .ft-dot.active {
    width: 16px;
    border-radius: 999px;
    background: #eeb665;
  }

  /* Pre-login Hero */
  .ft-prelogin-hero {
    display: grid;
    grid-template-columns: 2.75fr 1fr;
    gap: 16px;
  }

  .ft-prelogin-hero.is-mob {
    grid-template-columns: minmax(0, 1fr);
  }

  .ft-ph-main {
    position: relative;
    min-height: 345px;
    border-radius: 20px;
    overflow: hidden;
    background: #1f1b24;
  }

  .ft-ph-main h1 {
    margin: 0;
    font-size: 32px;
    max-width: 480px;
  }

  .ft-ph-sides {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  /* Category & Jackpots Action Header (2336:26213 & 2366:32953) */
  .ft-cat-sechead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .ft-cat-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .ft-cat-ctrlbtn {
    height: 48px;
    min-width: 170px;
    padding: 0 16px;
    border-radius: 14px;
    background: #1f1b24;
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #ffffff;
    font-size: 13.5px;
    font-weight: 700;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    cursor: pointer;
  }

  .ft-cat-ctrlbtn.is-mob {
    height: 38px;
    min-width: 0;
    padding: 0 12px;
    font-size: 12.5px;
    border-radius: 10px;
  }

  .ft-sort-wrap {
    position: relative;
  }

  .ft-sort-menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 25;
    width: 207px;
    background: #1f1b24;
    border: 1px solid #464050;
    border-radius: 14px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.65);
  }

  .ft-sort-opt {
    height: 42px;
    border-radius: 10px;
    background: transparent;
    border: none;
    padding: 0 12px;
    color: #d2cddb;
    font-size: 13px;
    font-weight: 600;
    text-align: left;
    font-family: inherit;
    cursor: pointer;
  }

  .ft-sort-opt.active {
    background: #464050;
    color: #eeb665;
  }

  .ft-filter-chips {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .ft-filter-chips.is-subbar {
    margin-top: -4px;
  }

  .ft-chip-active {
    height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    background: #27222d;
    border: 1px solid #464050;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-family: inherit;
  }

  /* Live Casino Tabs Bar (2381:94976 & 2460:3658) */
  .ft-live-catbar {
    background: #1f1b24;
    border-radius: 16px;
    padding: 6px 10px;
    align-self: flex-start;
    max-width: 100%;
  }

  .ft-live-catbar.is-mob {
    align-self: stretch;
    border-radius: 14px;
    padding: 4px 8px;
  }

  .ft-live-catbar-scroll {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
  }

  .ft-live-catbar-scroll::-webkit-scrollbar {
    display: none;
  }

  /* Recomandate VIP HP Widget (2508:14897) */
  .ft-vip-hp-widget {
    position: relative;
    width: 280px;
    height: 200px;
    flex-shrink: 0;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(238, 182, 101, 0.45);
    background: #1f1b24;
    padding: 0;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    color: #fff;
  }

  .ft-vw-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ft-vw-overlay {
    position: relative;
    z-index: 2;
    height: 100%;
    padding: 14px;
    background: linear-gradient(90deg, rgba(14, 12, 16, 0.94) 45%, rgba(14, 12, 16, 0.35) 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
  }

  .ft-vw-overlay.is-mob-full {
    padding: 12px 14px 12px 124px;
    background: linear-gradient(270deg, rgba(14, 12, 16, 0.94) 48%, rgba(14, 12, 16, 0.08) 100%);
    align-items: flex-end;
    justify-content: space-between;
    text-align: right;
  }

  .ft-vw-pill {
    background: #eeb665;
    color: #0e0c10;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 999px;
    letter-spacing: 0.3px;
  }

  .ft-vw-overlay strong {
    font-size: 14px;
    line-height: 1.25;
    max-width: 180px;
  }

  .ft-vw-goldtitle {
    color: #eeb665;
    max-width: 196px;
  }

  .ft-vw-pts {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    color: #d2cddb;
  }

  .ft-vw-cta {
    background: #f2b94b;
    color: #0e0c10;
    font-size: 11.5px;
    font-weight: 800;
    padding: 5px 12px;
    border-radius: 8px;
  }

  /* Category Tabs (56px #1f1b24 r=16 + fade + 40x40 arrows) */
  .ft-catbar {
    position: relative;
    height: 56px;
    min-width: 0;
    max-width: 100%;
    background: #1f1b24;
    border-radius: 16px;
    padding: 6px 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ft-catbar-scroll {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
  }

  .ft-catbar-scroll::-webkit-scrollbar {
    display: none;
  }

  .ft-cat-tile {
    height: 44px;
    padding: 0 14px;
    border-radius: 12px;
    background: transparent;
    border: 1px solid transparent;
    color: #d2cddb;
    font-size: 13px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .ft-cat-tile.is-sm {
    height: 34px;
    padding: 0 12px;
    font-size: 12px;
    background: #27222d;
  }

  @media (hover: hover) and (pointer: fine) {
    .ft-cat-tile:hover {
      background: #27222d;
      color: #ffffff;
    }
  }

  .ft-cat-tile.active {
    background: #464050;
    color: #eeb665;
    border-color: rgba(238, 182, 101, 0.35);
  }

  .ft-catbar-fade {
    position: absolute;
    right: 100px;
    top: 6px;
    bottom: 6px;
    width: 48px;
    background: linear-gradient(90deg, transparent, #1f1b24);
    pointer-events: none;
  }

  .ft-catbar-arrows {
    display: flex;
    gap: 4px;
    z-index: 2;
  }

  .ft-round-arrow {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #27222d;
    border: none;
    color: #fff;
    font-size: 18px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .ft-round-arrow.is-sm {
    width: 34px;
    height: 34px;
    font-size: 16px;
  }

  /* Section Header & Strips */
  .ft-sec {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    max-width: 100%;
  }

  .ft-sec-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ft-sec-title {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #eeb665;
  }

  .ft-sec-title h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    color: #ffffff;
  }

  .ft-sec-ctrls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ft-seeall {
    background: transparent;
    border: none;
    color: #d2cddb;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }

  /* Pure 138x200 Vertical Posters */
  .ft-games-strip {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    min-width: 0;
    max-width: 100%;
    scrollbar-width: none;
  }

  .ft-games-strip::-webkit-scrollbar {
    display: none;
  }

  .ft-game-poster {
    position: relative;
    width: 138px;
    height: 200px;
    flex-shrink: 0;
    border-radius: 12px;
    overflow: hidden;
    background: #27222d;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .ft-game-poster.is-grid {
    width: 100%;
    height: auto;
    aspect-ratio: 138 / 200;
  }

  .ft-games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(138px, 1fr));
    gap: 12px;
  }

  .ft-games-grid.cols-mob {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .ft-game-poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .ft-game-hover {
    position: absolute;
    inset: 0;
    background: rgba(14, 12, 16, 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .ft-game-hover span {
    background: #f2b94b;
    color: #0e0c10;
    font-size: 12px;
    font-weight: 800;
    padding: 6px 14px;
    border-radius: 999px;
  }

  @media (hover: hover) and (pointer: fine) {
    .ft-game-poster:hover .ft-game-hover {
      opacity: 1;
    }
  }

  /* Top 10 Păcănele 2026 */
  .ft-top10-strip {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    min-width: 0;
    max-width: 100%;
    scrollbar-width: none;
  }

  .ft-top10-strip::-webkit-scrollbar {
    display: none;
  }

  .ft-top10-item {
    position: relative;
    width: 245px;
    height: 260px;
    flex-shrink: 0;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
  }

  .ft-top10-rank {
    position: absolute;
    left: 0;
    bottom: -10px;
    font-size: 136px;
    font-weight: 900;
    line-height: 0.9;
    color: #16131a;
    -webkit-text-stroke: 2px #6b5e82;
    letter-spacing: -6px;
    pointer-events: none;
    user-select: none;
  }

  .ft-top10-poster {
    width: 180px;
    height: 260px;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    z-index: 2;
    background: #27222d;
  }

  .ft-top10-poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* 294x441 Vertical Jackpot Cards */
  .ft-jp-cards-strip {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    min-width: 0;
    max-width: 100%;
    scrollbar-width: none;
  }

  .ft-jp-cards-strip::-webkit-scrollbar {
    display: none;
  }

  .ft-jp-lobby-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 16px;
  }

  .ft-jp-lobby-grid.is-mob {
    grid-template-columns: 1fr;
  }

  .ft-jp-card {
    position: relative;
    width: 294px;
    height: 441px;
    flex-shrink: 0;
    border-radius: 16px;
    overflow: hidden;
    background: linear-gradient(180deg, var(--jp-bg) 0%, var(--jp-bg2) 100%);
    padding: 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .ft-jp-card.is-lobby {
    width: 100%;
  }

  .ft-jp-glow {
    position: absolute;
    top: -60px;
    left: 20px;
    width: 255px;
    height: 255px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--jp-glow) 0%, transparent 70%);
    opacity: 0.36;
    pointer-events: none;
  }

  .ft-jp-brand {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .ft-jp-brand img {
    height: 40px;
    max-width: 150px;
    object-fit: contain;
  }

  .ft-jp-brand span {
    font-size: 11px;
    color: #d2cddb;
  }

  .ft-jp-tiers {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ft-jp-row {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 6px 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ft-jp-row.is-grand {
    min-height: 50px;
  }

  .ft-jp-row img {
    width: 26px;
    height: 26px;
    object-fit: contain;
  }

  .ft-jp-row-txt {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
    min-width: 0;
  }

  .ft-jp-row-txt span {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.55);
  }

  .ft-jp-row-txt strong {
    font-size: 14px;
  }

  .ft-jp-row.is-grand strong {
    font-size: 17px;
  }

  .ft-jp-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .ft-jp-row.is-mini img {
    width: 20px;
    height: 20px;
  }

  .ft-jp-row.is-mini strong {
    font-size: 12px;
  }

  .ft-jp-status {
    margin-left: auto;
    background: rgba(238, 182, 101, 0.22);
    color: #eeb665;
    font-size: 9.5px;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 999px;
    text-transform: uppercase;
  }

  .ft-jp-thumbs {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .ft-jp-thumbs img {
    width: 100%;
    height: 118px;
    border-radius: 8px;
    object-fit: cover;
  }

  .ft-jp-purple-cta {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 32px;
    border-radius: 9px;
    background: #6000c7;
    color: #ffffff;
    border: none;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }

  /* Winners Ticker */
  .ft-winners-bar {
    min-height: 89px;
    background: #1f1b24;
    border-radius: 16px;
    padding: 12px 18px;
    display: flex;
    align-items: center;
    gap: 18px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .ft-winners-bar::-webkit-scrollbar {
    display: none;
  }

  .ft-winners-lbl {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 800;
    color: #eeb665;
    white-space: nowrap;
  }

  .ft-live-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
  }

  .ft-winners-list {
    display: flex;
    gap: 14px;
  }

  .ft-winner-chip {
    background: #27222d;
    border: none;
    border-radius: 12px;
    padding: 8px 12px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #fff;
    cursor: pointer;
    font-family: inherit;
    flex-shrink: 0;
    text-align: left;
  }

  .ft-winner-chip img {
    width: 36px;
    height: 50px;
    border-radius: 6px;
    object-fit: cover;
  }

  .ft-winner-txt {
    display: flex;
    flex-direction: column;
    font-size: 12px;
  }

  .ft-winner-txt small {
    color: #8f84a4;
    font-size: 11px;
  }

  .is-gold {
    color: #eeb665;
  }

  /* Live RTP Dual Panel */
  .ft-rtp-pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .ft-rtp-pair.is-mob {
    grid-template-columns: minmax(0, 1fr);
  }

  .ft-rtp-box {
    background: #1f1b24;
    border-radius: 16px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .ft-rtp-box-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ft-rtp-box-title {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .ft-rtp-ico {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: #27222d;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .ft-rtp-ico.is-hot { color: #22c55e; }
  .ft-rtp-ico.is-cold { color: #38bdf8; }

  .ft-rtp-titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .ft-rtp-titleline {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ft-rtp-box-title h3 {
    margin: 0;
    font-size: 18px;
  }

  .ft-rtp-sub {
    font-size: 12px;
    color: #8f84a4;
    font-weight: 600;
  }

  .ft-info-i {
    width: 20px;
    height: 20px;
    padding: 0;
    border-radius: 50%;
    background: transparent;
    border: none;
    color: #8f84a4;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .ft-rtp-tooltip {
    position: absolute;
    top: 28px;
    left: 0;
    z-index: 15;
    width: 280px;
    max-width: calc(100vw - 56px);
    background: #27222d;
    border: 1px solid #464050;
    border-radius: 10px;
    padding: 10px;
    font-size: 11.5px;
    color: #d2cddb;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.55);
  }

  .ft-rtp-rows {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ft-rtp-row {
    background: #27222d;
    border: none;
    border-radius: 12px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: #fff;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
  }

  .ft-rtp-row img {
    width: 48px;
    height: 66px;
    border-radius: 8px;
    object-fit: cover;
  }

  .ft-rtp-rank {
    width: 22px;
    font-size: 15px;
    font-weight: 800;
    color: #8f84a4;
    text-align: center;
  }

  .ft-rtp-meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .ft-rtp-meta strong {
    font-size: 13.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ft-rtp-meta span {
    font-size: 11.5px;
    color: #8f84a4;
  }

  .ft-rtp-pct {
    font-size: 12px;
    color: #8f84a4;
  }

  .ft-rtp-row.is-hot .ft-rtp-pct strong {
    color: #22c55e;
  }

  .ft-rtp-row.is-cold .ft-rtp-pct strong {
    color: #38bdf8;
  }

  .ft-rtp-play {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #464050;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* Live RTP 138x244 Card (2390:33463 / 2390:33478) */
  .ft-rtp-card {
    width: 138px;
    flex-shrink: 0;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    color: #fff;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ft-rtp-card-poster {
    position: relative;
    width: 138px;
    height: 200px;
    border-radius: 12px;
    overflow: hidden;
    background: #27222d;
  }

  .ft-rtp-card-poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .ft-rtp-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 11.5px;
    font-weight: 800;
    background: rgba(14, 12, 16, 0.92);
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .ft-rtp-badge.is-hot {
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.4);
  }

  .ft-rtp-badge.is-cold {
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.4);
  }

  .ft-rtp-card-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .ft-rtp-card-info strong {
    font-size: 12.5px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ft-rtp-card-info span {
    font-size: 11px;
    color: #8f84a4;
  }

  .ft-rtp-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .ft-rtp-info-grid.is-mob {
    grid-template-columns: 1fr;
  }

  .ft-rtp-info-card {
    background: #1f1b24;
    border-radius: 16px;
    padding: 18px;
    font-size: 13px;
    color: #d2cddb;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ft-rtp-info-card p {
    margin: 0;
    line-height: 1.45;
  }

  .ft-ric-head {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #eeb665;
    font-size: 15px;
  }

  /* Providers (36 cols x 2 rows = 72 tiles of 132x72) */
  .ft-providers-grid {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .ft-providers-grid::-webkit-scrollbar {
    display: none;
  }

  .ft-prov-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
  }

  .ft-prov-tile {
    width: 132px;
    height: 72px;
    border-radius: 12px;
    background: #27222d;
    border: 1px solid rgba(255, 255, 255, 0.04);
    padding: 10px 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  @media (hover: hover) and (pointer: fine) {
    .ft-prov-tile:hover {
      border-color: #eeb665;
    }
  }

  .ft-prov-tile img {
    max-width: 100%;
    max-height: 46px;
    object-fit: contain;
  }

  /* Spotlights (774x262) */
  .ft-spotlights {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .ft-spotlights.is-mob {
    grid-template-columns: 1fr;
  }

  .ft-spot-card {
    background: #1f1b24;
    border-radius: 16px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ft-spot-top {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .ft-spot-logo {
    width: 108px;
    height: 51px;
    background: #27222d;
    border-radius: 10px;
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ft-spot-logo img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .ft-spot-info {
    flex: 1;
    min-width: 0;
  }

  .ft-spot-info span {
    font-size: 11px;
    font-weight: 800;
    color: #eeb665;
  }

  .ft-spot-info h3 {
    margin: 2px 0 0;
    font-size: 18px;
  }

  .ft-spot-art {
    width: 100%;
    height: 172px;
    border-radius: 12px;
    object-fit: cover;
  }

  /* Themes (20 x 180x180) */
  .ft-themes-strip {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    min-width: 0;
    max-width: 100%;
    scrollbar-width: none;
  }

  .ft-themes-strip::-webkit-scrollbar {
    display: none;
  }

  .ft-theme-card {
    position: relative;
    width: 180px;
    height: 180px;
    flex-shrink: 0;
    border-radius: 16px;
    overflow: hidden;
    background: #1f1b24;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
  }

  .ft-theme-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ft-theme-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 35%, rgba(14, 12, 16, 0.92) 100%);
    padding: 14px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    color: #fff;
  }

  .ft-theme-scrim strong {
    font-size: 15px;
  }

  .ft-theme-scrim span {
    font-size: 11.5px;
    color: #eeb665;
    font-weight: 700;
  }

  /* VIP Club Page */
  .ft-vip-pagehead {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ft-vip-pagehead h1 {
    margin: 0;
    font-size: 32px;
    font-weight: 800;
  }

  .ft-vip-pagehead.is-mob h1 {
    font-size: 24px;
  }

  .ft-vip-pagehead p {
    margin: 0;
    font-size: 14px;
    color: #d2cddb;
    max-width: 680px;
  }

  .ft-vip-status-card {
    background: linear-gradient(135deg, #464050 0%, #1f1b24 100%);
    border-radius: 20px;
    padding: 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }

  .ft-vs-left {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .ft-vs-shield {
    width: 88px;
    height: 88px;
    object-fit: contain;
  }

  .ft-vs-left h2 {
    margin: 4px 0;
    font-size: 24px;
  }

  .ft-vs-ptsbtn {
    background: transparent;
    border: none;
    padding: 2px 0;
    color: #d2cddb;
    font-size: 13px;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-color: rgba(238, 182, 101, 0.45);
    text-underline-offset: 3px;
  }

  .ft-vs-left p {
    margin: 0;
    font-size: 13px;
    color: #d2cddb;
  }

  .ft-vs-stats {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .ft-vs-stat {
    background: rgba(14, 12, 16, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    color: inherit;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
  }

  .ft-vs-stat span { font-size: 11px; color: #8f84a4; }
  .ft-vs-stat strong { font-size: 15px; color: #eeb665; }

  .ft-vip-how-grid,
  .ft-vip-tiers-grid,
  .ft-faq-grid {
    display: grid;
    gap: 16px;
  }

  .ft-vip-how-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .ft-vip-tiers-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
  .ft-faq-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ft-vip-how-grid.is-mob,
  .ft-vip-tiers-grid.is-mob,
  .ft-faq-grid.is-mob { grid-template-columns: minmax(0, 1fr); }

  .ft-vip-how-card,
  .ft-vip-tier,
  .ft-vip-cb-card,
  .ft-faq-item {
    background: #1f1b24;
    border-radius: 16px;
    padding: 16px;
  }

  .ft-vip-how-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .ft-vip-how-card img {
    width: 44px;
    height: 44px;
    object-fit: contain;
  }

  .ft-vip-how-card h3 { margin: 0 0 6px; font-size: 15px; }
  .ft-vip-how-card p { margin: 0 0 4px; font-size: 12px; color: #d2cddb; }

  .ft-vip-tier {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .ft-vip-tier.is-current {
    border-color: #eeb665;
    background: linear-gradient(180deg, #2d2538 0%, #1f1b24 100%);
  }

  .ft-vt-badge {
    align-self: flex-start;
    background: #eeb665;
    color: #0e0c10;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 999px;
  }

  .ft-vt-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .ft-vt-head img { width: 48px; height: 48px; object-fit: contain; }
  .ft-vt-head h3 { margin: 0; font-size: 17px; }
  .ft-vt-head span { font-size: 11.5px; color: #8f84a4; }

  .ft-vt-reward {
    background: #27222d;
    border-radius: 10px;
    padding: 10px;
    display: flex;
    flex-direction: column;
  }

  .ft-vt-reward span { font-size: 11px; color: #8f84a4; }
  .ft-vt-reward strong { font-size: 15px; color: #eeb665; }

  .ft-vt-benefits {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .ft-vt-benefits li {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 11.5px;
    color: #d2cddb;
  }

  .ft-vt-benefits li :global(svg) {
    color: #22c55e;
  }

  .ft-vt-benefits li.is-locked {
    color: #6b6180;
  }

  .ft-vt-benefits li.is-locked :global(svg) {
    color: #6b6180;
  }

  .ft-mecanica-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .ft-mecanica-grid.is-mob {
    grid-template-columns: minmax(0, 1fr);
  }

  .ft-mecanica-lines {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
  }

  .ft-mecanica-lines p {
    margin: 0;
    font-size: 13px;
    color: #d2cddb;
    line-height: 1.45;
  }

  .ft-cb-head h2 {
    margin: 4px 0;
    font-size: 20px;
    font-weight: 800;
  }

  .ft-cb-head p {
    margin: 0;
    font-size: 13px;
    color: #d2cddb;
  }

  .ft-cb-table {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
  }

  .ft-cb-row {
    background: #27222d;
    border-radius: 10px;
    padding: 10px 14px;
    display: grid;
    grid-template-columns: 1.4fr 0.7fr 1fr;
    gap: 10px;
    font-size: 13px;
  }

  .ft-cb-row.is-header {
    background: transparent;
    padding: 4px 14px;
    font-size: 11px;
    font-weight: 800;
    color: #8f84a4;
  }

  .ft-cb-row.is-current {
    border: 1px solid #eeb665;
  }

  .ft-faq-q {
    width: 100%;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
  }

  .ft-faq-a {
    margin: 10px 0 0;
    font-size: 13px;
    color: #d2cddb;
    line-height: 1.45;
  }

  /* Shop & Misiuni (2483:64, 2484:78, 2488:207, 2490:781, 2490:962, 2487:187, 2487:224) */
  .ft-shop-hero {
    position: relative;
    min-height: 280px;
    border-radius: 20px;
    overflow: hidden;
    background: #1f1b24;
  }

  .ft-shop-hero-scrim {
    position: relative;
    z-index: 2;
    min-height: 280px;
    padding: 36px;
    background: linear-gradient(90deg, #0e0c10 0%, rgba(14, 12, 16, 0.78) 54%, rgba(14, 12, 16, 0.18) 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 18px;
  }

  .ft-shop-hero-scrim.is-mob {
    min-height: 220px;
    padding: 20px;
    gap: 14px;
  }

  .ft-shop-hcopy h1 {
    margin: 0;
    font-size: 28px;
    line-height: 1.2;
    max-width: 620px;
  }

  .ft-shop-hcopy p {
    margin: 6px 0 0;
    font-size: 14px;
    color: #d2cddb;
  }

  .ft-shop-hero-actions,
  .ft-shop-hero-stats {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .ft-sh-pts {
    background: rgba(31, 27, 36, 0.88);
    border: 1px solid #464050;
    border-radius: 12px;
    padding: 8px 14px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .ft-sh-pts small {
    font-size: 10px;
    font-weight: 800;
    color: #8f84a4;
  }

  .ft-sh-pts strong {
    font-size: 18px;
    font-weight: 800;
  }

  .ft-vip-tabs {
    width: 100%;
    max-width: 480px;
    height: 40px;
    margin: 0 auto;
    background: #1f1b24;
    border-radius: 12px;
    padding: 4px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
  }

  .ft-vip-tabs.is-mob {
    max-width: 100%;
  }

  .ft-vip-tab {
    border: none;
    border-radius: 9px;
    background: transparent;
    color: #8f84a4;
    font-size: 13px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
  }

  .ft-vip-tab.active {
    background: #464050;
    color: #eeb665;
  }

  .ft-streak-bar {
    background: linear-gradient(90deg, rgba(242, 185, 75, 0.16), #1f1b24);
    border: 1px solid rgba(242, 185, 75, 0.4);
    border-radius: 14px;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
    font-weight: 700;
  }

  .ft-next-goal-card,
  .ft-grand-prize-card {
    background: #1f1b24;
    border-radius: 16px;
    padding: 18px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    gap: 16px;
    position: relative;
    min-width: 0;
  }

  .ft-next-goal-card {
    max-width: 640px;
    width: 100%;
    margin: 0 auto;
  }

  .ft-next-goal-card.is-mob {
    flex-direction: column;
    align-items: stretch;
  }

  .ft-grand-prize-card {
    border-color: rgba(238, 182, 101, 0.45);
    flex-direction: column;
    align-items: stretch;
  }

  .ft-grand-prize-card.is-span2 {
    grid-column: span 2;
  }

  .ft-grand-prize-card.is-mob {
    grid-column: 1 / -1;
  }

  .ft-gp-ribbon {
    align-self: flex-start;
    background: #eeb665;
    color: #0e0c10;
    font-size: 10px;
    font-weight: 900;
    padding: 3px 10px;
    border-radius: 999px;
  }

  .ft-gp-body {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  .ft-gp-copy {
    flex: 1;
    min-width: 160px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ft-gp-copy strong {
    font-size: 14px;
  }

  .ft-next-goal-card img,
  .ft-gp-body img {
    width: 96px;
    height: 76px;
    object-fit: contain;
    background: #27222d;
    border-radius: 12px;
    padding: 6px;
    flex-shrink: 0;
  }

  .ft-ng-info {
    flex: 1;
    min-width: 0;
  }

  .ft-ng-info p {
    margin: 4px 0 2px;
    font-size: 12.5px;
    color: #d2cddb;
  }

  .ft-ng-info h3 {
    margin: 0 0 4px;
    font-size: 15px;
  }

  .ft-gp-body p {
    margin: 0;
    font-size: 12.5px;
  }

  .ft-gp-body small {
    color: #8f84a4;
    font-size: 11px;
  }

  .ft-sec-stackhead {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ft-sec-stackhead h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
  }

  .ft-sec-stackhead p {
    margin: 0;
    font-size: 13px;
    color: #8f84a4;
  }

  .ft-live-pill {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(34, 197, 94, 0.16);
    color: #22c55e;
    font-size: 10.5px;
    font-weight: 800;
    padding: 2px 9px;
    border-radius: 999px;
  }

  .ft-cat-detlink {
    font-size: 12px;
    font-weight: 700;
    color: #eeb665;
  }

  .ft-mc-titles {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .ft-mc-rep {
    align-self: flex-start;
    background: #27222d;
    color: #8f84a4;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 999px;
  }

  .ft-ap-bullets {
    margin: 8px 0 14px;
    padding-left: 18px;
    font-size: 13.5px;
    color: #d2cddb;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ft-ap-stores {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 10px;
  }

  .ft-modal.is-prize-drawer-modal {
    width: 1120px;
    max-width: 94vw;
  }

  .ft-pd-summary {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .ft-pd-pts {
    background: #27222d;
    border-radius: 10px;
    padding: 5px 12px;
    display: flex;
    flex-direction: column;
    line-height: 1.15;
  }

  .ft-pd-pts small {
    font-size: 9px;
    color: #8f84a4;
    font-weight: 700;
  }

  .ft-pd-pts strong {
    font-size: 15px;
  }

  .ft-pd-avail {
    font-size: 13px;
    color: #d2cddb;
  }

  .ft-shop-prizes-grid.is-drawer {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .ft-showcase-rows {
    display: grid;
    grid-template-rows: repeat(2, auto);
    grid-auto-flow: column;
    gap: 10px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    min-width: 0;
    max-width: 100%;
    scrollbar-width: none;
  }

  .ft-showcase-rows::-webkit-scrollbar {
    display: none;
  }

  .ft-showcase-pill {
    width: 240px;
    background: #1f1b24;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 8px 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #fff;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
  }

  .ft-showcase-pill img {
    width: 44px;
    height: 44px;
    object-fit: contain;
    background: #27222d;
    border-radius: 8px;
    padding: 4px;
  }

  .ft-showcase-pill strong {
    display: block;
    font-size: 12px;
  }

  .ft-showcase-pill span {
    font-size: 11px;
    color: #eeb665;
    font-weight: 700;
  }

  /* Design System Page */
  .ft-ds-swatches {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }

  .ft-ds-swatch {
    background: #1f1b24;
    border-radius: 12px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
  }

  .ft-ds-color {
    height: 40px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.14);
  }

  .ft-ds-typorow {
    display: grid;
    grid-template-columns: 140px 110px 1fr;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 13px;
  }

  .ft-ds-btns {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 14px;
  }

  .ft-ds-icons {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 10px;
  }

  .ft-ds-iconcard {
    background: #1f1b24;
    border-radius: 12px;
    padding: 14px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: #eeb665;
  }

  .ft-shop-cats,
  .ft-shop-prizes-grid,
  .ft-shop-missions {
    display: grid;
    gap: 14px;
  }

  .ft-shop-cats { grid-template-columns: repeat(5, minmax(0, 1fr)); }
  .ft-shop-prizes-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
  .ft-shop-missions { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .ft-shop-cats.is-mob,
  .ft-shop-prizes-grid.is-mob,
  .ft-shop-missions.is-mob { grid-template-columns: repeat(2, minmax(0, 1fr)); }

  .ft-shop-catcard,
  .ft-shop-prize,
  .ft-mission-card {
    background: #1f1b24;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    padding: 16px;
    color: #fff;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
  }

  .ft-shop-catcard img { height: 72px; object-fit: contain; }
  .ft-shop-prize img { height: 108px; object-fit: contain; }
  .ft-sp-cat { font-size: 11px; color: #8f84a4; }
  .ft-sp-pts { background: #27222d; color: #eeb665; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 999px; }

  .ft-mission-card { align-items: stretch; text-align: left; }
  .ft-mc-top { display: flex; justify-content: space-between; gap: 8px; }
  .ft-mission-card p { margin: 0; font-size: 12px; color: #d2cddb; }
  .ft-mc-foot { margin-top: auto; display: flex; justify-content: space-between; align-items: center; font-size: 12px; }

  .ft-claimed-strip {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    min-width: 0;
    max-width: 100%;
    scrollbar-width: none;
  }

  .ft-claimed-card {
    background: #1f1b24;
    border-radius: 14px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .ft-claimed-card img { width: 48px; height: 48px; object-fit: contain; }
  .ft-claimed-card div { display: flex; flex-direction: column; font-size: 12px; }
  .ft-claimed-card small { color: #8f84a4; font-size: 11px; }

  .ft-app-purple {
    background: linear-gradient(90deg, #340070 0%, #160030 100%);
    border-radius: 20px;
    padding: 24px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }

  .ft-app-purple.is-mob { flex-direction: column; text-align: center; }
  .ft-ap-copy h2 { margin: 6px 0; font-size: 24px; }
  .ft-ap-qrrow { display: inline-flex; align-items: center; gap: 12px; }
  .ft-qr { width: 64px; height: 64px; border-radius: 8px; background: #fff; padding: 4px; }
  .ft-phone-mock { height: 180px; object-fit: contain; }

  /* Footer */
  .ft-footer {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .ft-usp-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .ft-usp-grid.is-mob { grid-template-columns: minmax(0, 1fr); }

  .ft-usp-card {
    background: #1f1b24;
    border-radius: 14px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    font-weight: 700;
  }

  .ft-usp-circle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #27222d;
    color: #eeb665;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ft-usp-circle.is-mob {
    width: 48px;
    height: 48px;
  }

  .ft-footer-body {
    background: #1f1b24;
    border-radius: 20px;
    padding: 28px;
  }

  .ft-footer-cols {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 2fr) auto;
    gap: 24px;
  }

  .ft-footer-body.is-mob .ft-footer-cols {
    grid-template-columns: minmax(0, 1fr);
  }

  .ft-fcol h4 { margin: 0 0 12px; font-size: 14px; color: #ffffff; }
  .ft-flinks-2col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 18px; justify-items: start; }
  .ft-store-col { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
  .ft-footer-body.is-mob .ft-store-col { flex-direction: row; flex-wrap: wrap; }
  .ft-store-badgebtn { background: transparent; border: none; padding: 0; cursor: pointer; }
  .ft-store-badgebtn img { height: 40px; width: auto; display: block; border-radius: 8px; }

  .ft-footer-bottom {
    margin-top: 22px;
    padding-top: 18px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .ft-footer-bottom.is-mob {
    flex-direction: column;
    align-items: flex-start;
  }

  .ft-social-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .ft-social-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: #27222d;
    border: none;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .ft-flink {
    background: transparent;
    border: none;
    padding: 0;
    color: #8f84a4;
    font-size: 12.5px;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
  }

  @media (hover: hover) and (pointer: fine) {
    .ft-flink:hover { color: #ffffff; }
  }
  .ft-fcol.is-legal p { margin: 0 0 10px; font-size: 11.5px; color: #8f84a4; line-height: 1.5; }
  .ft-regulators { display: flex; align-items: center; gap: 12px; }
  .ft-regulators img { height: 28px; width: auto; }

  /* Mobile Bottom Nav (glued 360x60 #1f1b24) & Sticky Shop Bar */
  .ft-mob-stickybar {
    position: relative;
    z-index: 44;
    width: 100%;
    background: #1f1b24;
    border-top: 1px solid rgba(238, 182, 101, 0.45);
    padding: 8px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    font-size: 12px;
    font-weight: 700;
    color: #ffffff;
    flex-shrink: 0;
  }

  .ft-mob-bnav {
    position: relative;
    z-index: 45;
    width: 100%;
    height: 60px;
    background: #1f1b24;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    align-items: center;
    flex-shrink: 0;
  }

  .ft-mb-tab {
    background: transparent;
    border: none;
    color: #8f84a4;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    font-size: 10.5px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }

  .ft-mb-tab.active {
    color: #eeb665;
  }

  .ft-mb-menu {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #1f1b24;
    border: 2px solid #464050;
    color: #ffffff;
    margin: -14px auto 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.55);
  }

  .ft-mb-menu.is-open {
    border-color: #f2b94b;
    color: #f2b94b;
  }

  /* Shared Modal Utility Grid */
  .ft-dp-lbl { font-size: 11px; font-weight: 700; color: #8f84a4; text-transform: uppercase; margin-top: 2px; }
  .ft-dp-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; }

  /* Modals & Drawers */
  .ft-modal-layer {
    position: fixed;
    inset: 0;
    z-index: 120;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .ft-modal-layer.is-mob-layer {
    position: fixed;
    inset: 0;
    height: 100dvh;
    align-items: flex-end;
    padding: 0;
  }

  .ft-modal-layer.in-phone {
    position: absolute;
    inset: 0;
    height: 100%;
    z-index: 70;
    padding: 0;
  }

  .ft-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(14, 12, 16, 0.78);
    backdrop-filter: blur(6px);
    border: none;
    cursor: pointer;
  }

  .ft-modal-layer.in-phone .ft-modal-backdrop {
    position: absolute;
    inset: 0;
  }

  .ft-modal {
    position: relative;
    z-index: 2;
    width: 460px;
    max-width: 100%;
    max-height: 86vh;
    overflow-y: auto;
    background: #1f1b24;
    border: 1px solid #464050;
    border-radius: 20px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .ft-modal-search { width: 1120px; max-width: 96vw; }
  .ft-modal-prov { width: 540px; }

  .ft-modal.is-mob-full {
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
    border: none;
    padding: 14px;
  }

  .ft-modal.is-mob-sheet {
    width: 100%;
    max-width: 100%;
    max-height: 85%;
    border-radius: 20px 20px 0 0;
    border-left: none;
    border-right: none;
    border-bottom: none;
    margin-top: auto;
    padding: 10px 14px 18px;
  }

  .ft-drawer-left,
  .ft-drawer-right {
    position: fixed;
    top: 0;
    bottom: 0;
    z-index: 2;
    width: 375px;
    max-width: 92vw;
    background: #1f1b24;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow-y: auto;
  }

  .ft-drawer-left { left: 0; border-right: 1px solid #464050; }
  .ft-drawer-right { right: 0; border-left: 1px solid #464050; }

  .ft-drawer-right.is-mob-sheet {
    position: relative;
    top: auto;
    bottom: 0;
    right: auto;
    width: 100%;
    max-width: 100%;
    height: auto;
    max-height: 86%;
    border-left: none;
    border-top: 1px solid #464050;
    border-radius: 20px 20px 0 0;
    margin-top: auto;
    padding: 14px 14px 18px;
  }

  .ft-drawer-left.is-mob-full-nav {
    position: relative;
    top: auto;
    bottom: auto;
    left: auto;
    width: 100%;
    max-width: 100%;
    height: 100%;
    background: #0e0c10;
    border-right: none;
    padding: 0;
    gap: 0;
    overflow: hidden;
  }

  .ft-drawer-right.is-account-bg {
    background: #0e0c10;
  }

  .ft-drawer-right.is-mob-account-full {
    position: relative;
    top: auto;
    bottom: auto;
    right: auto;
    width: 100%;
    max-width: 100%;
    height: 100%;
    background: #0e0c10;
    border-left: none;
    padding: 0;
    gap: 0;
    overflow: hidden;
  }

  .ft-drawer-right.is-bal-bg {
    background: #1f1b24;
    padding: 0;
    gap: 0;
    overflow: hidden;
  }

  .ft-drawer-right.is-mob-full-panel {
    position: relative;
    top: auto;
    bottom: auto;
    right: auto;
    width: 100%;
    max-width: 100%;
    height: 100%;
    background: #1f1b24;
    border-left: none;
    padding: 0;
    gap: 0;
    overflow: hidden;
  }

  .ft-modal.is-mob-full-panel {
    width: 100%;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
    border: none;
    background: #16131a;
    padding: 16px;
  }

  .ft-sheet-handle {
    display: block;
    width: 40px;
    height: 4px;
    border-radius: 999px;
    background: #464050;
    margin: 0 auto 2px;
    flex-shrink: 0;
  }

  .ft-mhead { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .ft-mhead h3 { margin: 0; font-size: 17px; }
  .ft-mclose { width: 32px; height: 32px; border-radius: 8px; background: #27222d; border: none; color: #fff; cursor: pointer; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; }
  .ft-mclose.is-40 { width: 40px; height: 40px; border-radius: 12px; }
  .ft-minput { width: 100%; height: 44px; border-radius: 12px; background: #0e0c10; border: 1px solid #464050; padding: 0 14px; color: #fff; font-size: 14px; font-family: inherit; }

  .ft-search-hrow { display: flex; align-items: center; gap: 12px; }
  .ft-search-inputbox { flex: 1; height: 48px; border-radius: 12px; background: #0e0c10; border: 1px solid #464050; padding: 0 14px; display: flex; align-items: center; gap: 10px; color: #8f84a4; }
  .ft-search-bareinput { flex: 1; min-width: 0; height: 100%; background: transparent; border: none; outline: none; color: #ffffff; font-size: 14px; font-family: inherit; }
  .ft-icon-refresh { width: 28px; height: 28px; border-radius: 8px; background: #27222d; border: none; color: #d2cddb; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
  .ft-search-suggestions { display: flex; flex-direction: column; gap: 8px; }
  .ft-search-tags { display: flex; gap: 6px; flex-wrap: wrap; }
  .ft-search-results { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; }
  .ft-search-results.is-mob { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .ft-search-results.is-pair { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .ft-search-dual { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  .ft-search-dual.is-mob { grid-template-columns: minmax(0, 1fr); }
  .ft-search-cardcol { background: #16131a; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }

  .ft-search-top {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
    gap: 14px;
    align-items: center;
  }

  .ft-search-top.is-mob {
    grid-template-columns: minmax(0, 1fr);
  }

  .ft-search-spotlight {
    background: #27222d;
    border-radius: 14px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ft-search-spotlight img {
    width: 68px;
    height: 94px;
    border-radius: 10px;
    object-fit: cover;
  }

  .ft-ss-copy {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ft-ss-copy small {
    color: #8f84a4;
    font-size: 11.5px;
  }

  /* 1:1 Balance Drawer & Mobile Panel (2336:22792) */
  .ft-bal-mhead {
    height: 52px;
    padding: 0 12px;
    background: #1f1b24;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .ft-bal-navbtn {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: #27222d;
    border: none;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .ft-bal-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ft-bal-greet {
    padding: 4px 12px 0;
  }

  .ft-bal-greet h3 {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 800;
  }

  .ft-bal-greet p {
    margin: 0;
    font-size: 13px;
    color: #d2cddb;
  }

  .ft-bal-card {
    background: #27222d;
    border-radius: 12px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .ft-bal-card.is-pad {
    padding: 12px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ft-bal-line {
    min-height: 48px;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    font-size: 13.5px;
    color: #d2cddb;
  }

  .ft-bal-line.is-top {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .ft-bal-line.is-nopad {
    padding: 4px 0;
    min-height: 36px;
  }

  .ft-bal-line.is-btn {
    width: 100%;
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
  }

  .ft-bal-l {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    color: #d2cddb;
  }

  .ft-bal-r {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .is-w {
    color: #ffffff;
  }

  .ft-bal-bprogress {
    padding: 4px 16px 12px 32px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ft-bal-bitem {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ft-bal-brow {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: #8f84a4;
  }

  .ft-bal-ptrack {
    height: 6px;
    border-radius: 999px;
    background: #1f1b24;
    overflow: hidden;
  }

  .ft-bal-pfill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #eab949, #eeb665);
  }

  .ft-bal-bnote {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #8f84a4;
    padding-top: 2px;
  }

  .ft-bal-or {
    text-align: center;
    font-size: 11px;
    font-weight: 700;
    color: #8f84a4;
  }

  .ft-bal-thumbs {
    display: flex;
    gap: 10px;
    padding: 0 16px 14px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
  }

  .ft-bal-thumbs::-webkit-scrollbar {
    display: none;
  }

  .ft-bal-thumb {
    position: relative;
    width: 92px;
    height: 132px;
    flex-shrink: 0;
    border-radius: 10px;
    overflow: hidden;
    border: none;
    padding: 0;
    background: #1f1b24;
    cursor: pointer;
  }

  .ft-bal-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .ft-bal-thumb img.ft-bal-wheel-ov {
    position: absolute;
    left: 15px;
    top: 33px;
    width: 62px;
    height: 66px;
    object-fit: contain;
    z-index: 2;
  }

  .ft-bal-tbadge {
    position: absolute;
    right: 0;
    bottom: 0;
    min-width: 24px;
    height: 24px;
    padding: 0 7px;
    border-radius: 8px 0 0 0;
    background: #0e0c10;
    color: #eeb665;
    font-size: 11px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    z-index: 3;
  }

  .ft-bal-tbadge.is-static {
    position: static;
    border-radius: 8px;
  }

  .ft-bal-freebet {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px 14px;
  }

  .ft-fb-ticket {
    width: 96px;
    height: 48px;
    border-radius: 10px;
    background: #1f1b24;
    border: 1px dashed #eeb665;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
    color: #ffffff;
  }

  .ft-bal-rows { display: flex; flex-direction: column; gap: 8px; }
  .ft-bal-rows > div { background: #27222d; border-radius: 10px; padding: 10px 12px; display: flex; justify-content: space-between; font-size: 13px; }

  /* 1:1 Depunere cu misiuni (2507:10351) */
  .ft-dep-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .ft-dep-hcopy {
    flex: 1;
    text-align: center;
  }

  .ft-dep-hcopy h3 {
    margin: 0 0 4px;
    font-size: 20px;
    font-weight: 800;
  }

  .ft-dep-hcopy p {
    margin: 0;
    font-size: 13px;
    color: #d2cddb;
  }

  .ft-dep-field {
    min-height: 56px;
    border-radius: 12px;
    background: #1f1b24;
    border: 1px solid #3f3749;
    padding: 8px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .ft-dep-field small {
    display: block;
    font-size: 10px;
    font-weight: 700;
    color: #8f84a4;
  }

  .ft-dep-field strong {
    font-size: 14px;
    color: #ffffff;
  }

  .ft-dep-amts { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
  .ft-cat-tile.is-amt { justify-content: center; padding: 0; height: 40px; }

  .ft-dep-missions { display: flex; flex-direction: column; gap: 8px; }
  .ft-dm-head { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; color: #ffffff; }
  .ft-dm-row { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #d2cddb; }
  .ft-dm-row.is-done .ft-dm-txt { color: #27ae60; }
  .ft-dm-prog { font-size: 12px; color: #8f84a4; }
  .ft-dm-pts { margin-left: auto; background: #27222d; color: #eeb665; padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 800; }

  .ft-dep-blbl { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; color: #ffffff; }
  .ft-dep-bstrip { display: flex; gap: 8px; overflow-x: auto; overscroll-behavior-x: contain; padding-bottom: 2px; scrollbar-width: none; }
  .ft-dep-bstrip::-webkit-scrollbar { display: none; }

  .ft-dep-bcard {
    position: relative;
    width: 132px;
    min-height: 186px;
    flex-shrink: 0;
    border-radius: 12px;
    background: #1f1b24;
    border: 1.5px solid #3f3749;
    padding: 24px 10px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 6px;
    color: #fff;
    cursor: pointer;
    font-family: inherit;
    overflow: hidden;
  }

  .ft-dep-bcard.is-sel {
    border-color: #eeb665;
    background: #27222d;
  }

  .ft-dep-bbadge {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: #eeb665;
    color: #0e0c10;
    font-size: 9px;
    font-weight: 900;
    padding: 2px 4px;
  }

  .ft-dep-bcard strong { font-size: 13px; white-space: pre-line; line-height: 1.25; }
  .ft-dep-bgame { font-size: 11px; color: #d2cddb; }
  .ft-dep-bextra { font-size: 11px; color: #eeb665; font-weight: 700; }
  .ft-dep-bcard small { font-size: 10px; color: #84789c; margin-top: auto; border-top: 1px solid #3f3749; padding-top: 6px; width: 100%; }

  .ft-dep-tax { margin: 0; font-size: 12px; color: #d2cddb; text-align: center; }

  .ft-dep-summary {
    background: #1f1b24;
    border-radius: 12px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ft-dep-sumrow {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ft-dep-sumrow small { display: block; font-size: 10px; font-weight: 700; color: #84789c; }
  .ft-dep-sumrow strong { font-size: 16px; color: #ffffff; }
  .ft-dep-sumrow span { font-size: 18px; color: #8f84a4; }
  .ft-dep-sumbonus { display: flex; justify-content: space-between; font-size: 12.5px; color: #d2cddb; border-top: 1px solid #3f3749; padding-top: 8px; }

  .ft-prov-az-list { display: flex; flex-direction: column; gap: 12px; max-height: 46vh; overflow-y: auto; }
  .ft-prov-az-row { display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 8px; align-items: start; }
  .ft-prov-letter { font-size: 13px; font-weight: 800; color: #eeb665; padding-top: 16px; }
  .ft-prov-pills { display: grid; grid-template-columns: repeat(auto-fill, minmax(126px, 1fr)); gap: 8px; }

  .ft-prov-modal-tile {
    position: relative;
    height: 56px;
    border-radius: 10px;
    background: #27222d;
    border: 1.5px solid rgba(255, 255, 255, 0.06);
    padding: 8px 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
  }

  .ft-prov-modal-tile.active {
    border-color: #eeb665;
    background: #332c3d;
  }

  .ft-prov-modal-tile img {
    max-width: 100%;
    max-height: 36px;
    object-fit: contain;
  }

  .ft-pm-check {
    position: absolute;
    top: 4px;
    right: 6px;
    font-size: 11px;
    font-weight: 900;
    color: #eeb665;
  }

  .ft-mob-vipbanner {
    width: 100%;
    min-height: 56px;
    border-radius: 14px;
    background: linear-gradient(90deg, rgba(242, 185, 75, 0.22), #27222d);
    border: 1px solid rgba(238, 182, 101, 0.45);
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #ffffff;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
  }

  .ft-mob-vipbanner img {
    width: 38px;
    height: 38px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .ft-mvb-copy {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .ft-mvb-copy strong {
    font-size: 13px;
  }

  .ft-mvb-chev {
    color: #d2cddb;
    display: inline-flex;
    align-items: center;
  }

  .ft-login-foot {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12.5px;
    color: #8f84a4;
  }

  /* 1:1 Contul Meu & Burger Scroll Body (2296:19907) */
  .ft-acc-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ft-acc-head {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .ft-acc-av-ring {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    overflow: hidden;
    background: #1f1b24;
    padding: 2px;
    flex-shrink: 0;
  }

  .ft-acc-av {
    width: 100%;
    height: 100%;
    border-radius: 14px;
    object-fit: cover;
    display: block;
  }

  .ft-acc-head h3 {
    margin: 0;
    font-size: 17px;
    font-weight: 800;
  }

  .ft-sb-item.is-danger {
    color: #ed3030;
  }

  .ft-mcopy { margin: 0; font-size: 13px; color: #d2cddb; line-height: 1.45; }
  .ft-prize-drawer-img { width: 100%; height: 200px; object-fit: contain; background: #27222d; border-radius: 14px; padding: 12px; }
  .ft-center-cta { display: flex; justify-content: center; margin-top: 8px; }
  .ft-btn-outline.is-gold-border { border-color: #eeb665; color: #eeb665; }

  /* Mobile 360 Scale Overrides */
  .ft-viewport.is-mobile-layout .ft-ph-main { min-height: 220px; }
  .ft-viewport.is-mobile-layout .ft-banner-scrim.is-big { padding: 18px; gap: 6px; }
  .ft-viewport.is-mobile-layout .ft-ph-main h1 { font-size: 20px; line-height: 1.2; }
  .ft-viewport.is-mobile-layout .ft-sec-banner-card.is-side { height: 112px; }
  .ft-sec-banner-card.is-mob { height: 144px; scroll-snap-align: start; }
  .ft-catbar.is-mob { height: 48px; padding: 4px 8px; border-radius: 14px; }
  .ft-cat-tile.is-mob { height: 38px; padding: 0 10px; font-size: 12px; gap: 6px; }
  .ft-catbar.is-mob .ft-catbar-arrows,
  .ft-catbar.is-mob .ft-catbar-fade { display: none; }
  .ft-vip-hp-widget.is-mob-full { width: 100%; height: 178px; }
  .ft-viewport.is-mobile-layout .ft-sec-title h2 { font-size: 17px; }
  .ft-viewport.is-mobile-layout .ft-games-strip { gap: 8px; }
  .ft-viewport.is-mobile-layout .ft-game-poster:not(.is-grid) { width: 96px; height: 139px; border-radius: 10px; }
  .ft-viewport.is-mobile-layout .ft-top10-item { width: 152px; height: 160px; }
  .ft-viewport.is-mobile-layout .ft-top10-rank { font-size: 86px; bottom: -6px; -webkit-text-stroke: 1.5px #6b5e82; letter-spacing: -4px; }
  .ft-viewport.is-mobile-layout .ft-top10-poster { width: 111px; height: 160px; }
  .ft-viewport.is-mobile-layout .ft-prov-tile { width: 104px; height: 56px; padding: 8px 10px; }
  .ft-viewport.is-mobile-layout .ft-spot-top { flex-wrap: wrap; gap: 10px; }
  .ft-viewport.is-mobile-layout .ft-spot-logo { width: 88px; height: 42px; }
  .ft-viewport.is-mobile-layout .ft-theme-card { width: 148px; height: 148px; }
  .ft-viewport.is-mobile-layout .ft-showcase-pill { width: 204px; }
  .ft-viewport.is-mobile-layout .ft-jp-card { height: 390px; }
  .ft-viewport.is-mobile-layout .ft-jp-card:not(.is-lobby) { width: 248px; }
  .ft-viewport.is-mobile-layout .ft-shop-hcopy h1 { font-size: 20px; }
  .ft-viewport.is-mobile-layout .ft-vip-status-card { padding: 18px; }
  .ft-viewport.is-mobile-layout .ft-vs-shield { width: 64px; height: 64px; }
  .ft-viewport.is-mobile-layout .ft-vs-left h2 { font-size: 19px; }
  .ft-rtp-card.is-mob { width: 104px; }
  .ft-rtp-card-poster.is-mob { width: 104px; height: 148px; border-radius: 10px; }
  .ft-streak-bar.is-mob { flex-direction: column; align-items: stretch; gap: 8px; padding: 10px 12px; }
  .ft-sec-ctrls.is-wrap { flex-wrap: wrap; }
  .ft-cover-card { border-radius: 16px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.08); background: #1f1b24; }
  .ft-cover-card img { width: 100%; display: block; object-fit: cover; max-height: 360px; }
  .ft-ds-typorow.is-mob { grid-template-columns: minmax(0, 1fr); gap: 4px; }

  .ft-toast {
    position: fixed;
    bottom: 72px;
    right: 16px;
    z-index: 150;
    background: #f2b94b;
    color: #0e0c10;
    font-size: 12.5px;
    font-weight: 800;
    padding: 9px 15px;
    border-radius: 10px;
  }

  @media (max-width: 960px) {
    .ft-sidebar { display: none; }
    .ft-search-pill { display: none; }
    .ft-search-results { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .ft-prelogin-hero { grid-template-columns: minmax(0, 1fr); }
    .ft-rtp-pair,
    .ft-spotlights,
    .ft-usp-grid,
    .ft-footer-cols { grid-template-columns: minmax(0, 1fr); }
  }
</style>
