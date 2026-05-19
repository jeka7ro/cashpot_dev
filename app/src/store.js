import { writable } from 'svelte/store';

// ─── Game Catalog ─────────────────────────────────────────────────
export const GAMES = [
  { n: 'Noble Hot Crown', p: 'Amusnet', c: ['fructe', 'coroane', 'septari', 'clasic', 'jackpot', 'pacanele'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/00000004-0000-5000-9000-000000000002.png' },
  { n: 'Candy Blast', p: 'Pragmatic Play', c: ['dulciuri', 'speciala'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/def3451a-3444-40b5-9f9d-937ab16fb1b6.png' },
  { n: 'Gold of Ra', p: 'Novomatic', c: ['egipt'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/00000032-dc86-47af-8013-c46b4c000065.png' },
  { n: 'Moon Fortune', p: 'Amusnet', c: ['fructe'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/43a53a73-7d61-4cee-8d14-3ccbf36a1fe9.png' },
  { n: 'Sweet Bonanza', p: 'Pragmatic Play', c: ['fructe', 'dulciuri', 'speciala', 'cumpara speciala', 'promotii', 'jocuri noi'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/5e2cecf4-0962-4bf5-b6b0-6d7b2277e192.png' },
  { n: 'Gates of Olympus', p: 'Pragmatic Play', c: ['zei', 'speciala', 'cumpara speciala', 'mitologie', 'promotii', 'megaways'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/426c0f32-66f6-40c9-9845-e0813bef5e58.png' },
  { n: '100 Burning Hot', p: 'Amusnet', c: ['fructe', 'clasic', 'septari', 'jackpot', 'pacanele'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/00000004-0000-5000-9000-000000000002.png' },
  { n: 'Book of Ra', p: 'Novomatic', c: ['carti', 'egipt', 'clasic', 'pacanele'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/00000032-dc86-47af-8013-c46b4c000065.png' },
  { n: 'Shining Crown', p: 'Amusnet', c: ['fructe', 'coroane', 'septari', 'clasic', 'jackpot', 'pacanele'], img: 'https://prod-cdn-gaming.freetls.fastly.net/cdn/images/icore_1003601_ro/f6f5490e-f2ee-4ac3-abd4-88a99e9906df.gif' },
  { n: 'Sizzling Hot', p: 'Novomatic', c: ['fructe', 'septari', 'clasic', 'pacanele'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/00000032-dc86-47af-8013-c46b4c000285.png' },
  { n: 'Big Bass Bonanza', p: 'Pragmatic Play', c: ['pesti', 'speciala', 'cumpara speciala', 'jocuri noi', 'promotii'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/be1baeb0-5668-47a9-a03d-eb3f74204bd4.png' },
  { n: 'Sugar Rush', p: 'Pragmatic Play', c: ['dulciuri', 'speciala', 'cumpara speciala', 'jocuri noi', 'promotii'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/def3451a-3444-40b5-9f9d-937ab16fb1b6.png' },
  { n: 'The Dog House Megaways', p: 'Pragmatic Play', c: ['caini', 'megaways', 'speciala', 'cumpara speciala'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/00000011-0666-47af-8013-000000000002.png' },
  { n: '20 Super Hot', p: 'Amusnet', c: ['fructe', 'septari', 'clasic', 'jackpot', 'pacanele'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/482cf273-c979-4e45-8f01-4ada3e6e2cb5.png' },
  { n: 'Zodiac Wheel', p: 'Amusnet', c: ['stele', 'zodiac', 'jackpot', 'clasic', 'pacanele'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/00000028-dc86-47af-8013-000000000078.png' },
  { n: 'Legacy of Dead', p: 'Playn GO', c: ['egipt', 'carti', 'speciala', 'clasic'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/43a53a73-7d61-4cee-8d14-3ccbf36a1fe9.png' },
  { n: 'Reactoonz', p: 'Playn GO', c: ['extraterestri', 'speciala', 'jocuri noi'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/d18bc6f2-fc01-4e23-a275-37c417a66df3.png' },
  { n: 'Starburst', p: 'NetEnt', c: ['stele', 'clasic', 'pacanele'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/47a87f77-26ee-46bb-9471-f5483ad725f1.png' },
  { n: 'Zeus vs Hades', p: 'Pragmatic Play', c: ['zei', 'mitologie', 'speciala', 'cumpara speciala', 'jocuri noi'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/e9e071ac-930d-40f4-920e-8b747755e677.png' },
  { n: 'Roulette Live', p: 'Evolution', c: ['live', 'ruleta', 'masa'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/0bfca591-98a8-4c8f-9d22-6980ae116746.png' },
  { n: 'Extra Crown Classic', p: 'Amusnet', c: ['fructe', 'coroane', 'jackpot', 'pacanele'], img: 'https://prod-cdn-gaming.freetls.fastly.net/cdn/images/icore_1003601_ro/f6f5490e-f2ee-4ac3-abd4-88a99e9906df.gif' },
  { n: '5 Dazzling Hot', p: 'Amusnet', c: ['fructe', 'septari', 'jackpot', 'pacanele'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/482cf273-c979-4e45-8f01-4ada3e6e2cb5.png' },
  { n: '40 Bulky Fruits', p: 'Amusnet', c: ['fructe', 'clasic', 'jackpot', 'pacanele'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/00000004-0000-5000-9000-000000000002.png' },
  { n: 'Dice & Roll', p: 'Amusnet', c: ['fructe', 'zaruri', 'clasic', 'jackpot', 'pacanele'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/00000028-dc86-47af-8013-000000000078.png' },
  { n: '100 Super Hot', p: 'Amusnet', c: ['fructe', 'septari', 'jackpot', 'pacanele'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/482cf273-c979-4e45-8f01-4ada3e6e2cb5.png' },
  { n: 'Flaming Hot', p: 'Amusnet', c: ['fructe', 'clasic', 'jackpot'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/00000004-0000-5000-9000-000000000002.png' },
  { n: 'Vampire Night', p: 'Amusnet', c: ['vampiri', 'jackpot', 'pacanele'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/00000021-dc86-47af-8013-c46b4c000051.png' },
  { n: 'Supreme Hot', p: 'Amusnet', c: ['fructe', 'clasic', 'jackpot'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/482cf273-c979-4e45-8f01-4ada3e6e2cb5.png' },
  { n: '5 Juggle Fruits', p: 'Amusnet', c: ['fructe', 'jackpot', 'pacanele'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/00000004-0000-5000-9000-000000000040.png' },
  { n: 'Versailles Gold', p: 'Amusnet', c: ['aur', 'clasic', 'jackpot'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/00000028-dc86-47af-8013-000000000078.png' },
  { n: '40 Burning Hot', p: 'Amusnet', c: ['fructe', 'septari', 'jackpot'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/482cf273-c979-4e45-8f01-4ada3e6e2cb5.png' },
  { n: 'Starlight Princess', p: 'Pragmatic Play', c: ['printese', 'speciala', 'cumpara speciala'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/b08555a4-cfe6-4037-a83f-da2f2be54b6f.png' },
  { n: 'Big Bass Splash', p: 'Pragmatic Play', c: ['pesti', 'speciala', 'cumpara speciala'], img: 'https://cdn.cashpot.ro/cashpot/t1/thumbnail_games/8c446b83-c622-4ae9-8e4e-bc4c5b32ec67.png' }
];

// ─── Default Values ───────────────────────────────────────────────
const defaultCategories = [
  { id: 'cat_slots', name: 'Aparate', icon: '🎰', enabled: true, showInSidebar: true, showOnPage: true, showWhenLoggedOut: true, order: 2, games: ["Shining Crown", "Burning Hot", "20 Super Hot", "Zodiac Wheel", "Sweet Bonanza", "Gates of Olympus", "The Dog House Megaways", "Big Bass Splash"], thumbnailSize: "M" },
  { id: 'cat_fruits', name: 'Fructe', icon: '🍒', enabled: true, showInSidebar: true, showOnPage: true, showWhenLoggedOut: true, order: 3, games: ["Shining Crown", "Burning Hot", "20 Super Hot", "5 Dazzling Hot", "Extra Crown Classic"], thumbnailSize: "M" },
  { id: 'cat_live', name: 'Live Casino', icon: '🃏', enabled: true, showInSidebar: true, showOnPage: true, showWhenLoggedOut: true, order: 4, games: ["Ruleta Live", "Blackjack VIP"], thumbnailSize: "M" },
  { id: 'cat_jackpot', name: 'Jackpot', icon: '💎', enabled: true, showInSidebar: true, showOnPage: true, showWhenLoggedOut: true, order: 5, games: ["100 Burning Hot", "Shining Crown", "20 Super Hot", "Zodiac Wheel", "Extra Crown Classic"], thumbnailSize: "M" }
];

const defaultJackpots = [
  {
    id: 'jp_cards', name: "Jackpot Cards", logoUrl: "https://cashpot.ro/default/images/JackpotsLive/logos/jackpotCards.webp", position: "after_hero", showInFever: true, showInFever2: true, showWhenLoggedOut: true, backgroundImage: "", apiUrl: "", size: "M", animation: true, type: "cards", style: "ocean",
    levels: [
      { name: "Treflă", value: 45.23, icon: "♣", color: "#ffffff" },
      { name: "Caro", value: 120.50, icon: "♦", color: "#ef4444" },
      { name: "Cupă", value: 1540.80, icon: "♥", color: "#ef4444" },
      { name: "Pică", value: 45200.00, icon: "♠", color: "#ffffff" }
    ]
  },
  {
    id: 'jp_bell', name: "VIP Bell Link", logoUrl: "https://cashpot.ro/default/images/JackpotsLive/logos/bellLink.webp", position: "bottom", showInFever: true, showInFever2: true, showWhenLoggedOut: true, backgroundImage: "", apiUrl: "", size: "L", animation: true, type: "bell", style: "inferno",
    levels: [
      { name: "MINI", value: 50.00, icon: "🔔", color: "#3b82f6" },
      { name: "MINOR", value: 250.00, icon: "🔔", color: "#22c55e" },
      { name: "MAJOR", value: 1500.00, icon: "🔔", color: "#eab308" },
      { name: "GRAND", value: 15000.00, icon: "🔔", color: "#ef4444" }
    ]
  },
  {
    id: 'jp_clover', name: "Clover Chance", logoUrl: "https://cashpot.ro/default/images/JackpotsLive/logos/clover.webp", position: "after_hero", showInFever: true, showWhenLoggedOut: true, backgroundImage: "", apiUrl: "https://cashpot.ro/api/dynamic/jackpots.json", size: "S", animation: true, type: "clover",
    levels: [{ name: "Level 4", value: 10, icon: "🍀", color: "#22c55e" }, { name: "Level 3", value: 50, icon: "🍀", color: "#22c55e" }, { name: "Level 2", value: 200, icon: "🍀", color: "#22c55e" }, { name: "Level 1", value: 1000, icon: "🍀", color: "#22c55e" }]
  },
  {
    id: 'jp_regal', name: "Regal Jackpot", logoUrl: "https://cashpot.ro/default/images/JackpotsLive/logos/regalJackpot.webp", position: "after_hero", showInFever: true, showWhenLoggedOut: true, backgroundImage: "", apiUrl: "https://cashpot.ro/api/dynamic/jackpots.json", size: "S", animation: true, type: "regalJackpot",
    levels: [{ name: "Level 4", value: 10, icon: "👑", color: "#eab308" }, { name: "Level 3", value: 50, icon: "👑", color: "#eab308" }, { name: "Level 2", value: 200, icon: "👑", color: "#eab308" }, { name: "Level 1", value: 1000, icon: "👑", color: "#eab308" }]
  },
  {
    id: 'jp_egypt', name: "Egypt Quest", logoUrl: "https://cashpot.ro/default/images/JackpotsLive/logos/egypt.webp", position: "after_hero", showInFever: true, showWhenLoggedOut: true, backgroundImage: "", apiUrl: "https://cashpot.ro/api/dynamic/jackpots.json", size: "S", animation: true, type: "egypt",
    levels: [{ name: "Level 4", value: 10, icon: "𓋹", color: "#eab308" }, { name: "Level 3", value: 50, icon: "𓋹", color: "#eab308" }, { name: "Level 2", value: 200, icon: "𓋹", color: "#eab308" }, { name: "Level 1", value: 1000, icon: "𓋹", color: "#eab308" }]
  },
  {
    id: 'jp_high', name: "High Cash", logoUrl: "https://cashpot.ro/default/images/JackpotsLive/logos/highCash.webp", position: "after_hero", showInFever: true, showWhenLoggedOut: true, backgroundImage: "", apiUrl: "https://cashpot.ro/api/dynamic/jackpots.json", size: "S", animation: true, type: "highCash",
    levels: [{ name: "Level 4", value: 10, icon: "💵", color: "#22c55e" }, { name: "Level 3", value: 50, icon: "💵", color: "#22c55e" }, { name: "Level 2", value: 200, icon: "💵", color: "#22c55e" }, { name: "Level 1", value: 1000, icon: "💵", color: "#22c55e" }]
  },
  {
    id: 'jp_golden', name: "Golden Coins", logoUrl: "https://cashpot.ro/default/images/JackpotsLive/logos/goldenCoinsLink.webp", position: "after_hero", showInFever: true, showWhenLoggedOut: true, backgroundImage: "", apiUrl: "https://cashpot.ro/api/dynamic/jackpots.json", size: "S", animation: true, type: "goldenCoinsLink",
    levels: [{ name: "Level 4", value: 10, icon: "🪙", color: "#eab308" }, { name: "Level 3", value: 50, icon: "🪙", color: "#eab308" }, { name: "Level 2", value: 200, icon: "🪙", color: "#eab308" }, { name: "Level 1", value: 1000, icon: "🪙", color: "#eab308" }]
  },
  {
    id: 'jp_hotluck', name: "Hot Luck", logoUrl: "https://cashpot.ro/default/images/JackpotsLive/logos/hotLuck.webp", position: "after_hero", showInFever: true, showWhenLoggedOut: true, backgroundImage: "", apiUrl: "https://cashpot.ro/api/dynamic/jackpots.json", size: "S", animation: true, type: "hotLuck",
    levels: [{ name: "Level 4", value: 10, icon: "🔥", color: "#ef4444" }, { name: "Level 3", value: 50, icon: "🔥", color: "#ef4444" }, { name: "Level 2", value: 200, icon: "🔥", color: "#ef4444" }, { name: "Level 1", value: 1000, icon: "🔥", color: "#ef4444" }]
  }
];

const defaultBanners = {
  layout: "slider",
  autoSlide: true,
  slideInterval: 5,
  items: [
    { id: 'b1', image: '/baner1.webp', tag: 'Ofertă de bun venit', title: '500 Rotiri +\n10.000 RON Bonus', subtitle: 'Cel mai mare pachet din România.', buttonText: 'Revendică acum', showButton: true, textColor: '#ffffff', buttonColor: '#22c55e', buttonTextColor: '#ffffff', buttonBorderColor: 'transparent', buttonBorderWidth: 0 },
    { id: 'b2', image: '/baner2.webp', tag: 'Săptămânal', title: 'Cashback 15%', subtitle: 'Pe toate pierderile tale', buttonText: '', showButton: false, textColor: '#ffffff', buttonColor: '#22c55e', buttonTextColor: '#ffffff', buttonBorderColor: 'transparent', buttonBorderWidth: 0 },
    { id: 'b3', image: '/baner4.webp', tag: 'Zilnic', title: 'Drops & Wins', subtitle: '€ 500.000 premii lunare', buttonText: '', showButton: false, textColor: '#ffffff', buttonColor: '#22c55e', buttonTextColor: '#ffffff', buttonBorderColor: 'transparent', buttonBorderWidth: 0 },
    { id: 'b4', image: '/baner3.webp', tag: 'Turneu', title: 'Slot Race', subtitle: 'Joacă și câștigă', buttonText: 'Participă', showButton: false, textColor: '#ffffff', buttonColor: '#22c55e', buttonTextColor: '#ffffff', buttonBorderColor: 'transparent', buttonBorderWidth: 0 }
  ]
};

const defaultPromoBanner = [
  { id: 'promo_1', enabled: true, title: "Game of the Week", size: "L", gameImage: "", backgroundImage: "/abstract_casino_bg_1.png", backgroundFit: "cover", buttonText: "JOACĂ", showButton: true, showOverlay: true, clickableBanner: false, bannerLink: "", textColor: "#ffffff", buttonColor: "#22c55e", buttonTextColor: "#ffffff", buttonBorderColor: "transparent", buttonBorderWidth: 0, gameImageSize: "M", positionIndex: 1 }
];

export const defaultGameEffects = {
  '100 Burning Hot': { effect: 'lightning', effectInterval: 5 },
  '40 Burning Hot': { effect: 'lightning', effectInterval: 6 },
  '20 Burning Hot': { effect: 'lightning', effectInterval: 7 },
  '5 Burning Hot': { effect: 'lightning', effectInterval: 8 },
  '100 Burning Hot 6 Reels': { effect: 'lightning', effectInterval: 5 },
};

const defaultWinnersConfig = {
  enabled: true,
  useMockData: false,
  apiUrl: '/api/winners',
  showImage: true,
  imageSize: 'M',
  position: 'top'
};


const defaultJackpotFeverConfig = {
  enabled: true,
  title: 'Jackpot Fever',
  showWhenLoggedOut: true
};

const defaultJackpotFever2Config = {
  enabled: false,
  title: 'Jackpot Arena',
  showWhenLoggedOut: true,
  gaugeStyle: 'battery',
  extraAnimation: false,
  warpSpeedEffect: true,
  warpDensity: 'medium',
  starfieldEffect: false,
  starfieldDensity: 'medium',
  displayMode: 'arena' // 'arena' | 'scattered'
};

export const defaultTopGamesConfig = {
  enabled: true,
  title: "Top 10 Păcănele 2026",
  games: [
    { name: "Shining Crown", provider: "Amusnet" },
    { name: "Burning Hot", provider: "Amusnet" },
    { name: "20 Super Hot", provider: "Amusnet" },
    { name: "Zodiac Wheel", provider: "Amusnet" },
    { name: "Extra Crown Classic", provider: "Amusnet" }
  ]
};

export const defaultThemeColors = {
  bgDark: '#130f1c', bgPanel: '#1a1625', bgHover: '#231e33', textMain: '#ffffff',
  logoUrl: '/logo_cashpot.png',
  showThemeToggle: true,
  showLangToggle: true,
  showIcons: true,
  showCategoryIcons: true,
  showSidebarIcons: true,
  showJackpotIcons: true,
  showToolbarIcons: true
};

export const defaultRtpConfig = {
  enabled: true,
  apiUrl: '/api/rtp',
  hotTitle: 'Jocuri Generoase',
  hotSubtitle: 'Din ultimele 24 de ore',
  hotImage: 'https://cdn.midjourney.com/71e9a3b2-6014-41d6-b153-6bb30dc74823/0_0.webp',
  coldTitle: 'Jocuri în Creștere',
  coldSubtitle: 'Din ultimele 24 de ore',
  coldImage: 'https://cdn.midjourney.com/00e3eaee-9b0d-451e-b83c-11f4d96a7516/0_0.webp'
};

export const defaultToolbarConfig = {
  enabled: true,
  position: 'bottom',    // 'top' | 'bottom' | 'left' | 'right'
  displayMode: 'floating', // 'floating' | 'inline'
  inlinePosition: 'after_hero', // 'after_hero' | 'after_cat_...'
  shape: 'round',        // 'round' | 'card'
  borderColor: 'rgba(255, 255, 255, 0.08)',
  items: [
    { id: 'tb_home',    type: 'nav',      label: 'Acasă',        icon: '🏠', target: 'home',    enabled: true, borderColor: 'rgba(255, 255, 255, 0.08)' },
    { id: 'tb_slots',   type: 'nav',      label: 'Sloturi',      icon: '🎰', target: 'pacanele', enabled: true, borderColor: 'rgba(255, 255, 255, 0.08)' },
    { id: 'tb_deposit', type: 'deposit',  label: 'Depunere',     icon: '💳', target: '',        enabled: true, borderColor: 'rgba(255, 255, 255, 0.08)' },
    { id: 'tb_random',  type: 'random',   label: 'La noroc',      icon: '🎲', target: '',        enabled: true, borderColor: 'rgba(255, 255, 255, 0.08)' },
    { id: 'tb_jackpot', type: 'jackpot',  label: 'Jackpot',      icon: '💰', jackpotId: 'jp_cards', levelName: 'Pică', enabled: true, borderColor: 'rgba(255, 255, 255, 0.08)' },
    { id: 'tb_wheel',   type: 'wheel',    label: 'Roata',        icon: '', target: '',        enabled: true, borderColor: 'rgba(255, 255, 255, 0.08)' }
  ]
};

export const defaultSidebarNavConfig = {
  enabled: true,
  position: 'right',     // 'left' | 'right'
  mode: 'mini',          // 'full' | 'mini' (icon only)
  bubblesEnabled: false,
  items: [
    { id: 'sn_home',      label: 'Acasă',          icon: 'home',       enabled: true },
    { id: 'sn_vip',       label: 'Club VIP',        icon: 'star',       enabled: true },
    { id: 'sn_slots',     label: 'Slots',           icon: 'slots',      enabled: true },
    { id: 'sn_live',      label: 'Cazino Live',     icon: 'live',       enabled: true },
    { id: 'sn_sport',     label: 'Sport',           icon: 'sport',      enabled: true },
    { id: 'sn_loto',      label: 'Loto',            icon: 'loto',       enabled: true },
    { id: 'sn_promo',     label: 'Promoții',        icon: 'promo',      enabled: true },
    { id: 'sn_rtp',       label: 'Live RTP',        icon: 'rtp',        enabled: true },
    { id: 'sn_support',   label: 'Asistență',       icon: 'support',    enabled: true }
  ]
};

export const defaultSidebarWidgets = {
  luckyWheel:        { enabled: true,  title: 'Roata Norocului', spinsAvailable: 1, size: 's', shape: 'widget', borderColor: 'rgba(245, 200, 66, 0.4)' },
  cashbackProgress:  { enabled: true,  level: 'Silver', percentage: 12, points: 2450, nextLevel: 'Gold', size: 'm', shape: 'widget', borderColor: 'rgba(245, 200, 66, 0.4)' },
  tournament:        { enabled: true,  title: 'Turneul Săptămânii', prize: '50.000 RON', ctaLabel: 'Participă la Turneu →', size: 'm', shape: 'widget', borderColor: 'rgba(245, 200, 66, 0.4)' },
  missions:          { enabled: true,  title: 'Misiuni Active', size: 'm', shape: 'widget', borderColor: 'rgba(245, 200, 66, 0.4)' },
  categoryTabs: {
    enabled: true, shape: 'round', size: 'm',
    activeColor: '#fff', activeBg: 'linear-gradient(135deg,#6d28d9,#4c1d95)',
    inactiveColor: 'rgba(255,255,255,0.5)', inactiveBg: 'rgba(255,255,255,0.06)',
    tabs: [
      { id: 'slots',   label: 'Slots',       icon: '🎰', image: '/cat_slots.png' },
      { id: 'live',    label: 'Live Casino',  icon: '🎥', image: '/cat_live_casino.png' },
      { id: 'jackpot', label: 'Jackpot',      icon: '💎', image: '/cat_jackpot.png' },
      { id: 'promo',   label: 'Promoții',     icon: '🎁', image: '/cat_promotii.png' },
      { id: 'rtp',     label: 'Live RTP',     icon: '🔥', image: '/cat_live_rtp.png' },
      { id: 'sport',   label: 'Sport',        icon: '⚽', image: '/cat_sport.png' },
      { id: 'vip',     label: 'VIP Club',     icon: '👑', image: '/cat_vip_club.png' },
    ]
  },
  depositButton:     { enabled: true,  label: 'Depune Acum' },
  notificationBell:  { enabled: true },
  widgetOrder: ['luckyWheel', 'cashbackProgress', 'jackpotWidget', 'walletWidget'],
  pageContentOrder: ['heroBanners', 'categoryTabs', 'topGames', 'tournament', 'missions', 'rtpWidget', 'topWinners', 'gameCategories', 'jackpotFever'],
  globalBorderEnabled: false,
  globalBorderColor: '#f5c842',
  globalBorderWidth: 1,
  jackpotWidget:     { enabled: true, sourceId: 'amuserights', level: '1', size: 's', shape: 'widget', borderColor: 'rgba(245, 200, 66, 0.4)' },
  walletWidget: {
    enabled: true,
    showBalance: true,
    showName: true,
    size: 'm',
    shape: 'widget',
    position: 'top', // 'top' or 'bottom'
    showInToolbar: false,
    borderColor: 'rgba(245, 200, 66, 0.4)',
    bubblesEnabled: true
  },
  promoCards:        [] // Each card: { id, title, image, target, enabled, shape: 'card'|'round', position: 'top'|'bottom' }
};

export const defaultHeaderConfig = {
  enabled: true,
  logoHeight: 38,
  sticky: true,
  bgColor: '#130f1c',
  logoUrl: '/logo_cashpot.png',
  borderColor: 'rgba(255, 255, 255, 0.08)'
};

const defaultHeaderWidgets = {
  enabled: true,
  items: [
    { id: 'hw_arena',    label: 'Arena',    icon: 'Arena',    type: 'arena',    enabled: true,  color: '#f5c842' },
    { id: 'hw_wheel',    label: 'Roata',    icon: '',       type: 'wheel',    enabled: true,  color: '#f59e0b' },
    { id: 'hw_cashback', label: 'Cashback', icon: '📊',       type: 'cashback', enabled: true,  color: '#10b981' }
  ]
};

const defaultPlayArenaConfig = {
  enabled: true,
  coins: 1,
  missionsCount: 10,
  userName: "EUGENIU",
  userAvatar: "https://i.pravatar.cc/150?u=eugeniu",
  size: "s",
  widgetPosition: "sidebar", // "sidebar", "toolbar", "header"
  activeSubView: "home",
  items: [
    { id: 'pa_home', label: 'Play Arena', icon: '/icons/pa_icon_home.png', enabled: true },
    { id: 'pa_wheel', label: 'Roata Norocului', icon: '/icons/pa_icon_wheel.png', enabled: true },
    { id: 'pa_missions', label: 'Misiuni', icon: '/icons/pa_icon_missions.png', enabled: true },
    { id: 'pa_bonus', label: 'Bonus Factory', icon: '/icons/pa_icon_bonus.png', enabled: true },
    { id: 'pa_messages', label: 'Mesaje Primite', icon: '/icons/pa_icon_messages.png', enabled: true },
    { id: 'pa_tournaments', label: 'Turnee', icon: '/icons/pa_icon_tournaments.png', enabled: true }
  ],
  missions: [
    { id: 'm1', title: 'Depune și câștigă', reward: '10 Cashpot Coins', icon: '/icons/pa_icon_coin.png', status: 'available' },
    { id: 'm2', title: 'Login & Win', reward: '1 Cashpot Coin', icon: '📅', status: 'available', timeRemaining: '14:23:49' },
    { id: 'm3', title: 'Câștiguri Dulci', reward: '30 Runde Gratuite', icon: '/icons/pa_icon_bonus.png', status: 'available', needsEnroll: true }
  ]
};

const defaultVipConfig = {
  title: "CASHPOT VIP CLUB",
  subtitle: "Progresează jucând ca să meriți nivelele superioare",
  titleColor: "#facc15",
  titleSize: "56",
  subtitleColor: "#cbd5e1",
  subtitleSize: "20",
    levels: [
      { id: 1, name: "Peștișor Koi",       rank: "Nivel 1", img: "/koi_vip_v.png",     bgColor: "rgba(255, 255, 255, 0.05)", benefits: ["Cashback: 2%",  "Suport 24/7",                   "Bonus aniversar: 50 RON"] },
      { id: 2, name: "Stea de Mare",        rank: "Nivel 2", img: "/starfish_vip_v.png",bgColor: "rgba(255, 255, 255, 0.05)", benefits: ["Cashback: 5%",  "Suport Prioritar",               "Bonus de trecere: 100 RON"] },
      { id: 3, name: "Crab de Aur",         rank: "Nivel 3", img: "/crab_vip_v.png",    bgColor: "rgba(255, 255, 255, 0.05)", benefits: ["Cashback: 10%", "Retrageri instant",              "Manager de cont dedicat", "Bonus de trecere: 500 RON"] },
      { id: 4, name: "Caracatiță Elegantă", rank: "Nivel 4", img: "/octopus_vip_v.png", bgColor: "rgba(255, 255, 255, 0.05)", benefits: ["Cashback: 12%", "Manager VIP",                   "Cadouri fizice", "Puncte XP x1.5", "Invitații la evenimente"] },
      { id: 5, name: "Balenă",              rank: "Nivel 5", img: "/whale_vip_v.png",   bgColor: "rgba(255, 255, 255, 0.05)", benefits: ["Cashback: 15%", "Limite de pariere extinse",      "Bonusuri personalizate", "Retrageri nelimitate"] },
      { id: 6, name: "RECHINUL SUPREM",     rank: "Nivel 6 • Mascota ta oficială", img: "/shark_vip_v2.png", bgColor: "linear-gradient(135deg, #2e1065, #1e1b4b)", benefits: ["Cashback: 20%", "Recompensă secretă", "Puncte XP x2", "Vacante VIP", "Asistent personal 24/7"] }
    ],
    rewardsGrid: [
      {
        levelName: "NIVEL 1",
        points: "0 — 2",
        bonuses: [
          { amount: "400 FS", game: "Noble Hot Crown", minDeposit: "0 RON", bet: "0,1 RON" },
          { amount: "75 FS",  game: "Shining Crown",   minDeposit: "0 RON", bet: "0,2 RON" }
        ],
        cashback: null
      },
      {
        levelName: "NIVEL 2",
        points: "3 — 40",
        bonuses: [
          { amount: "50%",   game: "Activați bonusul înainte de a depune", minDeposit: "70 RON", maxBonus: "450 RON" },
          { amount: "50 FS", game: "Noble Hot Crown",                       minDeposit: "0 RON",  bet: "0,5 RON" }
        ],
        cashback: null
      },
      {
        levelName: "NIVEL 3",
        points: "41 — 214",
        bonuses: [
          { amount: "75 FS", game: "Candy Blast", minDeposit: "70 RON", bet: "0,8 RON" }
        ],
        cashback: "5%"
      },
      {
        levelName: "NIVEL 4",
        points: "215 — 584",
        bonuses: [
          { amount: "100 FS", game: "Gold of Ra", minDeposit: "100 RON", bet: "1 RON" }
        ],
        cashback: "7%"
      },
      {
        levelName: "NIVEL 5",
        points: "585 — 1.572",
        bonuses: [
          { amount: "100%",   game: "Activați bonusul înainte de a depune", minDeposit: "70 RON", maxBonus: "900 RON" },
          { amount: "100 FS", game: "Gold of Ra",                            minDeposit: "100 RON", bet: "1 RON" }
        ],
        cashback: "8%"
      },
      {
        levelName: "NIVEL 6",
        points: "1.573 — ∞",
        bonuses: [
          { amount: "150 FS", game: "Moon Fortune", minDeposit: "300 RON", bet: "2 RON" }
        ],
        cashback: "10%"
      }
    ]
};

// Helper to synchronously initialize state from localStorage to prevent layout flicker
function getInitial(key, def) {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        let parsed = JSON.parse(saved);
        if (typeof parsed === "object" && !Array.isArray(parsed) && parsed !== null) {
           parsed = { ...JSON.parse(JSON.stringify(def)), ...parsed, jackpotWidget: parsed.jackpotWidget || def.jackpotWidget };
           
           if (key === 'cashpot_cms_vip' && parsed.levels) {
             parsed.levels = parsed.levels.map((lvl, i) => ({
                 ...def.levels[i], 
                 ...lvl, 
                 benefits: (!lvl.benefits || lvl.benefits.length === 0) ? def.levels[i].benefits : lvl.benefits
             }));
           }
           if (key === 'cashpot_cms_play_arena') {
             const iconMap = {
               '🏠': '/icons/pa_icon_home.png', '🎯': '/icons/pa_icon_missions.png',
               '🏆': '/icons/pa_icon_tournaments.png', '🎁': '/icons/pa_icon_bonus.png',
               '💰': '/icons/pa_icon_coin.png', '🐻': '/icons/pa_icon_bonus.png',
               '📅': '/icons/pa_icon_missions.png', '✉️': '/icons/pa_icon_messages.png',
               '🎡': '/icons/pa_icon_wheel.png'
             };
             if (parsed.items) {
               parsed.items = parsed.items.map(item => ({...item, icon: iconMap[typeof item.icon === 'string' ? item.icon.trim() : item.icon] || item.icon}));
             }
             if (parsed.missions) {
               parsed.missions = parsed.missions.map(mission => ({...mission, icon: iconMap[typeof mission.icon === 'string' ? mission.icon.trim() : mission.icon] || mission.icon}));
             }
           }
           return parsed;
        }
        return parsed;
      }
    } catch (e) {}
  }
  return JSON.parse(JSON.stringify(def));
}

// ─── Stores (initialized from localStorage or defaults, updated from server) ──────
export const cmsCategories = writable(getInitial('cashpot_cms_categories', defaultCategories));
export const cmsJackpot = writable(getInitial('cashpot_cms_jackpot', defaultJackpots));
export const cmsJackpotFever = writable(getInitial('cashpot_cms_jackpotFever', defaultJackpotFeverConfig));
export const cmsJackpotFever2 = writable(getInitial('cashpot_cms_jackpotFever2', defaultJackpotFever2Config));
export const cmsBanners = writable(getInitial('cashpot_cms_banners', defaultBanners));
export const cmsPromoBanner = writable(getInitial('cashpot_cms_promo', defaultPromoBanner));
export const cmsHeaderWidgets = writable(getInitial('cashpot_cms_header_widgets', defaultHeaderWidgets));
export const cmsDraftHeaderWidgets = writable(JSON.parse(JSON.stringify(defaultHeaderWidgets)));
export const cmsGameEffects = writable(getInitial('cashpot_cms_game_effects', defaultGameEffects));
export const cmsThemeColors = writable(getInitial('cashpot_cms_theme_colors', defaultThemeColors));
export const cmsWinnersConfig = writable(getInitial('cashpot_cms_winners_config', defaultWinnersConfig));
export const cmsTopGamesConfig = writable(getInitial('cashpot_cms_top_games', defaultTopGamesConfig));
export const cmsRtpConfig = writable(getInitial('cashpot_cms_rtp_config', defaultRtpConfig));
export const cmsToolbarConfig = writable(getInitial('cashpot_cms_toolbar', defaultToolbarConfig));
export const cmsSidebarNavConfig = writable(getInitial('cashpot_cms_sidebar_nav', defaultSidebarNavConfig));
export const cmsSidebarWidgets = writable(getInitial('cashpot_cms_sidebar_widgets', defaultSidebarWidgets));
export const cmsPlayArenaConfig = writable(getInitial('cashpot_cms_play_arena', defaultPlayArenaConfig));
export const cmsVipConfig = writable(getInitial('cashpot_cms_vip_v10', defaultVipConfig));
export const cmsHeaderConfig = writable(getInitial('cashpot_cms_header_config', defaultHeaderConfig));
export const cmsDraftHeaderConfig = writable(JSON.parse(JSON.stringify(defaultHeaderConfig)));

// Draft stores (for in-progress edits in admin)
export const cmsDraftCategories = writable(JSON.parse(JSON.stringify(defaultCategories)));
export const cmsDraftJackpot = writable(JSON.parse(JSON.stringify(defaultJackpots)));
export const cmsDraftJackpotFever = writable(JSON.parse(JSON.stringify(defaultJackpotFeverConfig)));
export const cmsDraftJackpotFever2 = writable(JSON.parse(JSON.stringify(defaultJackpotFever2Config)));
export const cmsDraftBanners = writable(JSON.parse(JSON.stringify(defaultBanners)));
export const cmsDraftPromoBanner = writable(JSON.parse(JSON.stringify(defaultPromoBanner)));
export const cmsDraftGameEffects = writable({ ...defaultGameEffects });
export const cmsDraftThemeColors = writable({ ...defaultThemeColors });
export const cmsDraftWinnersConfig = writable(JSON.parse(JSON.stringify(defaultWinnersConfig)));
export const cmsDraftTopGamesConfig = writable(JSON.parse(JSON.stringify(defaultTopGamesConfig)));
export const cmsDraftRtpConfig = writable(JSON.parse(JSON.stringify(defaultRtpConfig)));
export const cmsDraftToolbarConfig = writable(JSON.parse(JSON.stringify(defaultToolbarConfig)));
export const cmsDraftSidebarNavConfig = writable(JSON.parse(JSON.stringify(defaultSidebarNavConfig)));
export const cmsDraftSidebarWidgets = writable(JSON.parse(JSON.stringify(defaultSidebarWidgets)));
export const cmsDraftPlayArenaConfig = writable(JSON.parse(JSON.stringify(defaultPlayArenaConfig)));
export const cmsDraftVipConfig = writable(JSON.parse(JSON.stringify(defaultVipConfig)));

// ─── Auth & UI State (still localStorage — user session) ──────────
export const isAdminLoggedIn = writable(
  typeof localStorage !== 'undefined' && localStorage.getItem('cashpot_admin_logged') === 'true'
);
export const isForcedMobile = writable(false);
isAdminLoggedIn.subscribe(val => {
  if (typeof localStorage !== 'undefined') localStorage.setItem('cashpot_admin_logged', val);
});

export const isPreviewMode = writable(false);

const savedTheme = typeof localStorage !== 'undefined' ? (localStorage.getItem('cashpot_theme') || 'dark') : 'dark';
export const siteTheme = writable(savedTheme);
siteTheme.subscribe(val => {
  if (typeof localStorage !== 'undefined') localStorage.setItem('cashpot_theme', val);
  if (typeof document !== 'undefined') {
    const el = document.documentElement;
    if (val === 'light') { el.setAttribute('data-theme', 'light'); el.style.colorScheme = 'light'; }
    else { el.removeAttribute('data-theme'); el.style.colorScheme = 'dark'; }
  }
});

export const cmsAuditLog = writable([]);

// ─── Server API helpers ───────────────────────────────────────────
const API = '/api/cms';
let _serverAvailable = false;

function applyServerData(data) {
  if (!data) return;
  // Only apply if server actually has content (not empty defaults)
  if (data.categories?.length) { cmsCategories.set(data.categories); cmsDraftCategories.set(JSON.parse(JSON.stringify(data.categories))); }
  if (data.jackpot?.length) { cmsJackpot.set(data.jackpot); cmsDraftJackpot.set(JSON.parse(JSON.stringify(data.jackpot))); }
  if (data.jackpotFever) { cmsJackpotFever.set(data.jackpotFever); cmsDraftJackpotFever.set(JSON.parse(JSON.stringify(data.jackpotFever))); }
  if (data.jackpotFever2) { cmsJackpotFever2.set(data.jackpotFever2); cmsDraftJackpotFever2.set(JSON.parse(JSON.stringify(data.jackpotFever2))); }
  if (data.banners?.items?.length) { cmsBanners.set(data.banners); cmsDraftBanners.set(JSON.parse(JSON.stringify(data.banners))); }
  if (data.promo?.length) { cmsPromoBanner.set(data.promo); cmsDraftPromoBanner.set(JSON.parse(JSON.stringify(data.promo))); }
  if (data.themeColors && Object.keys(data.themeColors).length) { cmsThemeColors.set(data.themeColors); cmsDraftThemeColors.set(JSON.parse(JSON.stringify(data.themeColors))); }
  if (data.gameEffects && Object.keys(data.gameEffects).length) {
    const merged = { ...defaultGameEffects, ...data.gameEffects };
    cmsGameEffects.set(merged);
    cmsDraftGameEffects.set(JSON.parse(JSON.stringify(merged)));
  }
  if (data.winnersConfig) { cmsWinnersConfig.set(data.winnersConfig); cmsDraftWinnersConfig.set(JSON.parse(JSON.stringify(data.winnersConfig))); }
  if (data.topGamesConfig) { cmsTopGamesConfig.set(data.topGamesConfig); cmsDraftTopGamesConfig.set(JSON.parse(JSON.stringify(data.topGamesConfig))); }
  if (data.rtpConfig) { cmsRtpConfig.set(data.rtpConfig); cmsDraftRtpConfig.set(JSON.parse(JSON.stringify(data.rtpConfig))); }
  if (data.toolbarConfig) { cmsToolbarConfig.set(data.toolbarConfig); cmsDraftToolbarConfig.set(JSON.parse(JSON.stringify(data.toolbarConfig))); }
  if (data.sidebarNavConfig) { cmsSidebarNavConfig.set(data.sidebarNavConfig); cmsDraftSidebarNavConfig.set(JSON.parse(JSON.stringify(data.sidebarNavConfig))); }
  if (data.sidebarWidgets) { cmsSidebarWidgets.set(data.sidebarWidgets); cmsDraftSidebarWidgets.set(JSON.parse(JSON.stringify(data.sidebarWidgets))); }
  if (data.playArenaConfig) { cmsPlayArenaConfig.set(data.playArenaConfig); cmsDraftPlayArenaConfig.set(JSON.parse(JSON.stringify(data.playArenaConfig))); }
  if (data.headerWidgets) { cmsHeaderWidgets.set(data.headerWidgets); cmsDraftHeaderWidgets.set(JSON.parse(JSON.stringify(data.headerWidgets))); }
  if (data.headerConfig) { cmsHeaderConfig.set(data.headerConfig); cmsDraftHeaderConfig.set(JSON.parse(JSON.stringify(data.headerConfig))); }
  if (data.vipConfig) { 
    const mergedVip = { 
        ...defaultVipConfig, 
        ...data.vipConfig,
        rewardsGrid: (!data.vipConfig.rewardsGrid || data.vipConfig.rewardsGrid.length === 0) ? defaultVipConfig.rewardsGrid : data.vipConfig.rewardsGrid
    };
    if (mergedVip.levels) {
        mergedVip.levels = mergedVip.levels.map((lvl, i) => ({
            ...defaultVipConfig.levels[i],
            ...lvl,
            benefits: (!lvl.benefits || lvl.benefits.length === 0) ? defaultVipConfig.levels[i].benefits : lvl.benefits
        }));
    }
    cmsVipConfig.set(mergedVip); 
    cmsDraftVipConfig.set(JSON.parse(JSON.stringify(mergedVip))); 
  }
  if (data.auditLog?.length) { cmsAuditLog.set(data.auditLog); }
}

/** Load all CMS data from server. Called on app mount. */
export async function loadFromServer() {
  try {
    const res = await fetch(`${API}?t=${new Date().getTime()}`, { 
      signal: AbortSignal.timeout(3000),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('Server error');
    const { data } = await res.json();
    applyServerData(data);
    _saveToLocalStorage(data); // Ensure localStorage stays in sync with server to prevent layout flicker on reload
    _serverAvailable = true;
    return true;
  } catch (e) {
    console.warn('CMS server not available, using localStorage fallback:', e.message);
    _serverAvailable = false;
    // Fallback: read from localStorage
    _loadFromLocalStorage();
    return false;
  }
}

function _loadFromLocalStorage() {
  try {
    const cats = localStorage.getItem('cashpot_cms_categories');
    if (cats) { const v = JSON.parse(cats); cmsCategories.set(v); cmsDraftCategories.set(JSON.parse(cats)); }
    const jp = localStorage.getItem('cashpot_cms_jackpot');
    if (jp) { const v = JSON.parse(jp); cmsJackpot.set(v); cmsDraftJackpot.set(JSON.parse(jp)); }
    const jpf = localStorage.getItem('cashpot_cms_jackpotFever');
    if (jpf) { const v = JSON.parse(jpf); cmsJackpotFever.set(v); cmsDraftJackpotFever.set(JSON.parse(jpf)); }
    const jpf2 = localStorage.getItem('cashpot_cms_jackpotFever2');
    if (jpf2) { const v = JSON.parse(jpf2); cmsJackpotFever2.set(v); cmsDraftJackpotFever2.set(JSON.parse(jpf2)); }
    const bn = localStorage.getItem('cashpot_cms_banners');
    if (bn) { const v = JSON.parse(bn); cmsBanners.set(v); cmsDraftBanners.set(JSON.parse(bn)); }
    const pr = localStorage.getItem('cashpot_cms_promo');
    if (pr) { const v = JSON.parse(pr); cmsPromoBanner.set(v); cmsDraftPromoBanner.set(JSON.parse(pr)); }
    const tc = localStorage.getItem('cashpot_cms_theme_colors');
    if (tc) { const v = JSON.parse(tc); cmsThemeColors.set(v); cmsDraftThemeColors.set(JSON.parse(tc)); }
    const ge = localStorage.getItem('cashpot_cms_game_effects');
    if (ge) {
      const merged = { ...defaultGameEffects, ...JSON.parse(ge) };
      cmsGameEffects.set(merged);
      cmsDraftGameEffects.set(JSON.parse(JSON.stringify(merged)));
    }
    const win = localStorage.getItem('cashpot_cms_winners_config');
    if (win) { const v = JSON.parse(win); cmsWinnersConfig.set(v); cmsDraftWinnersConfig.set(JSON.parse(win)); }
    const tb = localStorage.getItem('cashpot_cms_toolbar');
    if (tb) { const v = JSON.parse(tb); cmsToolbarConfig.set(v); cmsDraftToolbarConfig.set(JSON.parse(tb)); }
    const sb = localStorage.getItem('cashpot_cms_sidebar_nav');
    if (sb) { const v = JSON.parse(sb); cmsSidebarNavConfig.set(v); cmsDraftSidebarNavConfig.set(JSON.parse(sb)); }
    const rtp = localStorage.getItem('cashpot_cms_rtp_config');
    if (rtp) { const v = JSON.parse(rtp); cmsRtpConfig.set(v); cmsDraftRtpConfig.set(JSON.parse(rtp)); }
    const pa = localStorage.getItem('cashpot_cms_play_arena');
    if (pa) { const v = JSON.parse(pa); cmsPlayArenaConfig.set(v); cmsDraftPlayArenaConfig.set(JSON.parse(pa)); }
    const hw = localStorage.getItem('cashpot_cms_header_widgets');
    if (hw) { const v = JSON.parse(hw); cmsHeaderWidgets.set(v); cmsDraftHeaderWidgets.set(JSON.parse(hw)); }
    const hc = localStorage.getItem('cashpot_cms_header_config');
    if (hc) { const v = JSON.parse(hc); cmsHeaderConfig.set(v); cmsDraftHeaderConfig.set(JSON.parse(hc)); }
    const vip = localStorage.getItem('cashpot_cms_vip_v10');
    if (vip) { const v = JSON.parse(vip); cmsVipConfig.set(v); cmsDraftVipConfig.set(JSON.parse(vip)); }
    const sw = localStorage.getItem('cashpot_cms_sidebar_widgets');
    if (sw) { 
      const v = JSON.parse(sw); 
      // Auto-migrate missing images for category tabs
      if (v?.categoryTabs?.tabs) {
        v.categoryTabs.tabs.forEach(tab => {
          if (!tab.image) {
            const dt = defaultSidebarWidgets.categoryTabs.tabs.find(t => t.id === tab.id);
            if (dt && dt.image) tab.image = dt.image;
          }
        });
        localStorage.setItem('cashpot_cms_sidebar_widgets', JSON.stringify(v));
      }
      cmsSidebarWidgets.set(v); 
      cmsDraftSidebarWidgets.set(JSON.parse(JSON.stringify(v))); 
    }
    const tg = localStorage.getItem('cashpot_cms_top_games');
    if (tg) { const v = JSON.parse(tg); cmsTopGamesConfig.set(v); cmsDraftTopGamesConfig.set(JSON.parse(tg)); }
    const al = localStorage.getItem('cashpot_cms_audit');
    if (al) cmsAuditLog.set(JSON.parse(al));
  } catch (e) { console.error('localStorage fallback error:', e); }
}

/** Save all CMS data to server. Called on publish. */
export async function saveToServer(payload) {
  if (_serverAvailable) {
    try {
      const res = await fetch(API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000)
      });
      if (res.ok) {
        // Update all stores immediately
        applyServerData(payload);
        _saveToLocalStorage(payload); // Ensure localStorage stays in sync with server to prevent layout flicker on reload
        return true;
      }
    } catch (e) {
      console.warn('Server save failed, falling back to localStorage:', e.message);
    }
  }
  // Fallback: save to localStorage
  _saveToLocalStorage(payload);
  applyServerData(payload); // Update local stores so changes reflect even without a server
  return true; // Return true so AdminCMS doesn't show a false error when working offline
}

function _saveToLocalStorage(payload) {
  try {
    if (payload.categories) localStorage.setItem('cashpot_cms_categories', JSON.stringify(payload.categories));
    if (payload.jackpot) localStorage.setItem('cashpot_cms_jackpot', JSON.stringify(payload.jackpot));
    if (payload.jackpotFever) localStorage.setItem('cashpot_cms_jackpotFever', JSON.stringify(payload.jackpotFever));
    if (payload.jackpotFever2) localStorage.setItem('cashpot_cms_jackpotFever2', JSON.stringify(payload.jackpotFever2));
    if (payload.banners) localStorage.setItem('cashpot_cms_banners', JSON.stringify(payload.banners));
    if (payload.promo) localStorage.setItem('cashpot_cms_promo', JSON.stringify(payload.promo));
    if (payload.themeColors) localStorage.setItem('cashpot_cms_theme_colors', JSON.stringify(payload.themeColors));
    if (payload.gameEffects) localStorage.setItem('cashpot_cms_game_effects', JSON.stringify(payload.gameEffects));
    if (payload.winnersConfig) localStorage.setItem('cashpot_cms_winners_config', JSON.stringify(payload.winnersConfig));
    if (payload.toolbarConfig) localStorage.setItem('cashpot_cms_toolbar', JSON.stringify(payload.toolbarConfig));
    if (payload.sidebarNavConfig) localStorage.setItem('cashpot_cms_sidebar_nav', JSON.stringify(payload.sidebarNavConfig));
    if (payload.rtpConfig) localStorage.setItem('cashpot_cms_rtp_config', JSON.stringify(payload.rtpConfig));
    if (payload.playArenaConfig) localStorage.setItem('cashpot_cms_play_arena', JSON.stringify(payload.playArenaConfig));
    if (payload.headerWidgets) localStorage.setItem('cashpot_cms_header_widgets', JSON.stringify(payload.headerWidgets));
    if (payload.headerConfig) localStorage.setItem('cashpot_cms_header_config', JSON.stringify(payload.headerConfig));
    if (payload.vipConfig) localStorage.setItem('cashpot_cms_vip_v9', JSON.stringify(payload.vipConfig));
    if (payload.sidebarWidgets) localStorage.setItem('cashpot_cms_sidebar_widgets', JSON.stringify(payload.sidebarWidgets));
    if (payload.topGamesConfig) localStorage.setItem('cashpot_cms_top_games', JSON.stringify(payload.topGamesConfig));
    if (payload.auditLog) localStorage.setItem('cashpot_cms_audit', JSON.stringify(payload.auditLog.slice(0, 200)));
  } catch (e) { }
}

// ─── Real-time polling (checks /api/cms-updated every 3s) ─────────
// Works across all browsers connected to the same server
if (typeof window !== 'undefined') {
  let _lastUpdatedAt = null;

  setInterval(async () => {
    if (!_serverAvailable) return;
    try {
      const res = await fetch('/api/cms-updated', { signal: AbortSignal.timeout(2000) });
      if (!res.ok) return;
      const { updatedAt } = await res.json();
      if (updatedAt && updatedAt !== _lastUpdatedAt) {
        if (_lastUpdatedAt === null) {
          // First poll: just synchronize the timestamp, do not override local state
          _lastUpdatedAt = updatedAt;
        } else {
          _lastUpdatedAt = updatedAt;
          // New data available — reload from server
          const full = await fetch(API, { signal: AbortSignal.timeout(3000) });
          if (full.ok) {
            const { data } = await full.json();
            applyServerData(data);
          }
        }
      }
    } catch (e) { }
  }, 3000);
}
