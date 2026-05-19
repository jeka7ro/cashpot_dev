const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'cms-data.json');
const GAME_FILE = path.join(__dirname, 'gamification-data.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─── Proxy Route for Cashpot API ─────────────────────────
app.get('/api/proxy/cashpot', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing url parameter' });
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      }
    });
    if (!response.ok) return res.status(response.status).send(await response.text());

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else {
      const buffer = await response.arrayBuffer();
      res.set('Content-Type', contentType);
      res.send(Buffer.from(buffer));
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Broadcast to all WebSocket clients ──────────────────
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

// ─── CMS DB helpers ───────────────────────────────────────
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) { }
  return getCMSDefaults();
}
function saveDB(data) {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8'); return true; }
  catch (e) { return false; }
}

// ─── Gamification DB helpers ──────────────────────────────
function loadGame() {
  try {
    if (fs.existsSync(GAME_FILE)) return JSON.parse(fs.readFileSync(GAME_FILE, 'utf8'));
  } catch (e) { }
  return getGameDefaults();
}
function saveGame(data) {
  try { fs.writeFileSync(GAME_FILE, JSON.stringify(data, null, 2), 'utf8'); return true; }
  catch (e) { return false; }
}

// ─── CMS Defaults ────────────────────────────────────────
function getCMSDefaults() {
  return {
    categories: [
      { id: 'fav', name: 'Jocurile Tale Favorite', icon: '', showOnPage: true, showInSidebar: true, showWhenLoggedOut: false, order: 1, timeStart: '', timeEnd: '', filter: 'favorites' },
      { id: 'hot', name: 'Cele Mai Jucate Acum', icon: '', showOnPage: true, showInSidebar: true, showWhenLoggedOut: true, order: 2, timeStart: '', timeEnd: '', filter: 'slice_5' },
      { id: 'rec', name: 'Recomandate pentru tine', icon: '', showOnPage: true, showInSidebar: true, showWhenLoggedOut: false, order: 3, timeStart: '', timeEnd: '', filter: 'reverse' }
    ],
    jackpot: [
      { id: 'jp_cards', name: 'Jackpot Cards', logoUrl: 'https://cashpot.ro/default/images/JackpotsLive/logos/jackpotCards.webp', position: 'after_hero', showWhenLoggedOut: true, backgroundImage: '', apiUrl: '', size: 'M', animation: true, type: 'cards', levels: [{ name: 'Treflă', value: 45.23, icon: '♣', color: '#ffffff' }, { name: 'Caro', value: 120.50, icon: '♦', color: '#ef4444' }, { name: 'Cupă', value: 1540.80, icon: '♥', color: '#ef4444' }, { name: 'Pică', value: 45200.00, icon: '♠', color: '#ffffff' }] },
      { id: 'jp_bell', name: 'VIP Bell Link', logoUrl: 'https://cashpot.ro/default/images/JackpotsLive/logos/bellLink.webp', position: 'bottom', showWhenLoggedOut: true, backgroundImage: '', apiUrl: '', size: 'L', animation: true, type: 'bell', levels: [{ name: 'MINI', value: 50.00, icon: '🔔', color: '#3b82f6' }, { name: 'MINOR', value: 250.00, icon: '🔔', color: '#22c55e' }, { name: 'MAJOR', value: 1500.00, icon: '🔔', color: '#eab308' }, { name: 'GRAND', value: 15000.00, icon: '🔔', color: '#ef4444' }] }
    ],
    jackpotFever: { enabled: true, title: 'Jackpot Fever', showWhenLoggedOut: true },
    banners: {
      layout: '1_big_2_small',
      items: [
        { id: 'b1', image: '/baner1.webp', tag: 'Ofertă de bun venit', title: '500 Rotiri +\n10.000 RON Bonus', subtitle: 'Cel mai mare pachet din România.', buttonText: 'Revendică acum', showButton: true, textColor: '#ffffff', buttonColor: '#22c55e', buttonTextColor: '#ffffff', buttonBorderColor: 'transparent', buttonBorderWidth: 0 },
        { id: 'b2', image: '/baner2.webp', tag: 'Săptămânal', title: 'Cashback 15%', subtitle: 'Pe toate pierderile tale', buttonText: '', showButton: false, textColor: '#ffffff', buttonColor: '#22c55e', buttonTextColor: '#ffffff', buttonBorderColor: 'transparent', buttonBorderWidth: 0 },
        { id: 'b3', image: '/baner4.webp', tag: 'Zilnic', title: 'Drops & Wins', subtitle: '€ 500.000 premii lunare', buttonText: '', showButton: false, textColor: '#ffffff', buttonColor: '#22c55e', buttonTextColor: '#ffffff', buttonBorderColor: 'transparent', buttonBorderWidth: 0 },
        { id: 'b4', image: '/baner3.webp', tag: 'Turneu', title: 'Slot Race', subtitle: 'Joacă și câștigă', buttonText: 'Participă', showButton: false, textColor: '#ffffff', buttonColor: '#22c55e', buttonTextColor: '#ffffff', buttonBorderColor: 'transparent', buttonBorderWidth: 0 }
      ]
    },
    promo: [{ id: 'promo_1', enabled: true, title: 'Game of the Week', size: 'L', gameImage: '', backgroundImage: '/abstract_casino_bg_1.png', buttonText: 'JOACĂ', textColor: '#ffffff', buttonColor: '#22c55e', buttonTextColor: '#ffffff', buttonBorderColor: 'transparent', buttonBorderWidth: 0, gameImageSize: 'M', positionIndex: 1 }],
    gameEffects: {
      '100 Burning Hot': { effect: 'lightning', effectInterval: 5 },
      '40 Burning Hot': { effect: 'lightning', effectInterval: 6 },
      '20 Burning Hot': { effect: 'lightning', effectInterval: 7 },
      '5 Burning Hot': { effect: 'lightning', effectInterval: 8 }
    },
    themeColors: { bgDark: '#130f1c', bgPanel: '#1a1625', bgHover: '#231e33', textMain: '#ffffff' },
    winnersConfig: { enabled: true, mode: "real", position: "bottom" },
    topGamesConfig: {
      enabled: true,
      title: "Top 10 Păcănele 2026",
      games: [
        { name: "Shining Crown", provider: "Amusnet" },
        { name: "Burning Hot", provider: "Amusnet" },
        { name: "20 Super Hot", provider: "Amusnet" },
        { name: "Zodiac Wheel", provider: "Amusnet" },
        { name: "Extra Crown Classic", provider: "Amusnet" }
      ]
    },
    auditLog: [],
    vipConfig: {
      title: "CASHPOT VIP CLUB",
      subtitle: "Progresează jucând ca să meriți nivelele superioare",
      titleColor: "#facc15",
      titleSize: "56",
      subtitleColor: "#cbd5e1",
      subtitleSize: "20",
      levels: [
        { id: 1, name: "Peștișor Koi", rank: "Nivel 1", img: "/koi_vip_v.png", bgColor: "rgba(255, 255, 255, 0.05)" },
        { id: 2, name: "Stea de Mare", rank: "Nivel 2", img: "/starfish_vip_v.png", bgColor: "rgba(255, 255, 255, 0.05)" },
        { id: 3, name: "Delfin de Argint", rank: "Nivel 3", img: "/dolphin_vip_v.png", bgColor: "rgba(255, 255, 255, 0.05)" },
        { id: 4, name: "Crab de Aur", rank: "Nivel 4", img: "/crab_vip_v.png", bgColor: "rgba(255, 255, 255, 0.05)" },
        { id: 5, name: "Caracatiță Elegantă", rank: "Nivel 5", img: "/octopus_vip_v.png", bgColor: "rgba(255, 255, 255, 0.05)" },
        { id: 6, name: "Balenă", rank: "Nivel 6", img: "/whale_vip_v.png", bgColor: "rgba(255, 255, 255, 0.05)" },
        { id: 7, name: "RECHINUL SUPREM", rank: "Nivel 7 • Mascota ta oficială", img: "/shark_vip_v2.png", bgColor: "linear-gradient(135deg, #2e1065, #1e1b4b)" }
      ]
    },
    updatedAt: null
  };
}

// ─── Gamification Defaults ────────────────────────────────
function getGameDefaults() {
  return {
    jackpots: {
      bronze: { name: 'Bronze', amount: 1243.50, color: '#cd7f32', increment: 0.03 },
      silver: { name: 'Silver', amount: 8721.80, color: '#c0c0c0', increment: 0.07 },
      gold: { name: 'Gold', amount: 34892.10, color: '#ffd700', increment: 0.15 },
      diamond: { name: 'Diamond', amount: 91373.10, color: '#00d4ff', increment: 0.25 }
    },
    missions: [
      { id: 'm1', title: 'Primul Pariu', desc: 'Plasează primul pariu al zilei', reward: '10 Free Spins', rewardType: 'free_spins', rewardAmount: 10, target: 1, progress: 0, completed: false, category: 'daily' },
      { id: 'm2', title: 'Explorator', desc: 'Joacă 5 jocuri diferite azi', reward: '20 Puncte XP', rewardType: 'xp', rewardAmount: 20, target: 5, progress: 2, completed: false, category: 'daily' },
      { id: 'm3', title: 'Depunere Rapidă', desc: 'Efectuează o depunere azi', reward: '50% Bonus', rewardType: 'bonus', rewardAmount: 50, target: 1, progress: 0, completed: false, category: 'daily' },
      { id: 'm4', title: 'Maestrul Sloturilor', desc: 'Joacă 50 de runde pe sloturi', reward: '100 Free Spins', rewardType: 'free_spins', rewardAmount: 100, target: 50, progress: 23, completed: false, category: 'weekly' },
      { id: 'm5', title: 'Campion Săptămânal', desc: 'Câștigă 5 sesiuni consecutive', reward: 'Bonus VIP', rewardType: 'vip_bonus', rewardAmount: 0, target: 5, progress: 1, completed: false, category: 'weekly' }
    ],
    tournament: {
      id: 't1',
      name: 'Slot Race Weekend',
      endsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      prizePool: '50,000 RON',
      leaderboard: [
        { rank: 1, name: 'Andrei M.', points: 12840, prize: '15,000 RON' },
        { rank: 2, name: 'Elena P.', points: 11200, prize: '10,000 RON' },
        { rank: 3, name: 'Mihai T.', points: 9750, prize: '7,500 RON' },
        { rank: 4, name: 'Radu C.', points: 8100, prize: '5,000 RON' },
        { rank: 5, name: 'Ana D.', points: 7300, prize: '3,000 RON' },
        { rank: 6, name: 'Ionuț V.', points: 6500, prize: '2,000 RON' },
        { rank: 7, name: 'Maria L.', points: 5900, prize: '1,500 RON' },
        { rank: 8, name: 'Dan F.', points: 4200, prize: '1,000 RON' },
        { rank: 9, name: 'Sorin B.', points: 3800, prize: '750 RON' },
        { rank: 10, name: 'Cristina N.', points: 2900, prize: '500 RON' }
      ]
    },
    playerXP: {
      level: 7,
      xp: 3240,
      xpToNextLevel: 5000,
      totalXP: 18240,
      rank: 'Gold'
    },
    wheelPrizes: [
      { label: '10 Free Spins', color: '#f59e0b', probability: 30, type: 'free_spins', amount: 10 },
      { label: '50 RON Bonus', color: '#10b981', probability: 15, type: 'bonus', amount: 50 },
      { label: '2x Multiplier', color: '#8b5cf6', probability: 10, type: 'multiplier', amount: 2 },
      { label: '25 Free Spins', color: '#ef4444', probability: 20, type: 'free_spins', amount: 25 },
      { label: '100 RON Bonus', color: '#3b82f6', probability: 5, type: 'bonus', amount: 100 },
      { label: '5 Free Spins', color: '#f97316', probability: 35, type: 'free_spins', amount: 5 },
      { label: 'Încearcă din nou', color: '#6b7280', probability: 40, type: 'retry', amount: 0 },
      { label: '500 RON JACKPOT', color: '#ffd700', probability: 1, type: 'jackpot', amount: 500 }
    ],
    wheelSpinsLeft: 1,
    loyaltyConfig: {
      tiers: [
        { name: 'Bronze', pointsRequired: 0, xpMultiplier: 1.0 },
        { name: 'Silver', pointsRequired: 5000, xpMultiplier: 1.2 },
        { name: 'Gold', pointsRequired: 15000, xpMultiplier: 1.5 },
        { name: 'Platinum', pointsRequired: 50000, xpMultiplier: 2.0 }
      ]
    },
    cashbackConfig: {
      basePercentage: 10,
      minLoss: 100,
      maxAmount: 5000,
      awardDay: 'Luni'
    },
    updatedAt: null
  };
}

// ─── CMS Routes ───────────────────────────────────────────
app.get('/api/cms', (req, res) => res.json({ ok: true, data: loadDB() }));
app.get('/api/cms-updated', (req, res) => res.json({ updatedAt: loadDB().updatedAt || null }));
app.get('/api/cms/:key', (req, res) => {
  const data = loadDB();
  req.params.key in data ? res.json({ ok: true, data: data[req.params.key] }) : res.status(404).json({ ok: false });
});
app.put('/api/cms', (req, res) => {
  const merged = { ...loadDB(), ...req.body, updatedAt: new Date().toISOString() };
  saveDB(merged);
  broadcast({ type: 'CMS_UPDATED', updatedAt: merged.updatedAt });
  res.json({ ok: true, updatedAt: merged.updatedAt });
});
app.patch('/api/cms/:key', (req, res) => {
  const data = loadDB();
  data[req.params.key] = req.body.value;
  data.updatedAt = new Date().toISOString();
  saveDB(data);
  res.json({ ok: true });
});

// ─── Backup Routes ────────────────────────────────────────
const BACKUPS_FILE = path.join(__dirname, 'cms-backups.json');
const loadBackups = () => { try { return JSON.parse(fs.readFileSync(BACKUPS_FILE, 'utf8')); } catch (e) { return []; } };
const saveBackups = (b) => { try { fs.writeFileSync(BACKUPS_FILE, JSON.stringify(b, null, 2)); } catch (e) { } };
app.get('/api/backups', (req, res) => res.json({ ok: true, data: loadBackups() }));
app.post('/api/backups', (req, res) => {
  const backups = loadBackups();
  const snap = { id: Date.now(), label: req.body.label || new Date().toLocaleString('ro-RO'), ...loadDB() };
  saveBackups([snap, ...backups].slice(0, 10));
  res.json({ ok: true, id: snap.id });
});
app.delete('/api/backups/:id', (req, res) => { saveBackups(loadBackups().filter(b => b.id !== parseInt(req.params.id))); res.json({ ok: true }); });
app.post('/api/backups/:id/restore', (req, res) => {
  const backup = loadBackups().find(b => b.id === parseInt(req.params.id));
  if (!backup) return res.status(404).json({ ok: false });
  const { id, label, ...data } = backup;
  data.updatedAt = new Date().toISOString();
  saveDB(data);
  res.json({ ok: true });
});

// ─── Gamification Routes ──────────────────────────────────

// GET all gamification state
app.get('/api/game', (req, res) => res.json({ ok: true, data: loadGame() }));

// PUT all gamification state (save from admin)
app.put('/api/game', (req, res) => {
  const merged = { ...loadGame(), ...req.body };
  saveGame(merged);
  broadcast({
    type: 'INIT',
    jackpotEnabled: merged.jackpotEnabled,
    jackpots: merged.jackpots,
    tournament: merged.tournament,
    missions: merged.missions,
    wheelPrizes: merged.wheelPrizes,
    playerXP: merged.playerXP,
    loyaltyConfig: merged.loyaltyConfig,
    cashbackConfig: merged.cashbackConfig
  });
  res.json({ ok: true });
});

// GET jackpots
app.get('/api/game/jackpots', (req, res) => res.json({ ok: true, data: loadGame().jackpots }));

// GET missions
app.get('/api/game/missions', (req, res) => res.json({ ok: true, data: loadGame().missions }));

// POST complete mission
app.post('/api/game/missions/:id/complete', (req, res) => {
  const g = loadGame();
  const mission = g.missions.find(m => m.id === req.params.id);
  if (!mission) return res.status(404).json({ ok: false });
  mission.progress = mission.target;
  mission.completed = true;
  // Award XP
  if (mission.rewardType === 'xp') {
    g.playerXP.xp += mission.rewardAmount;
    while (g.playerXP.xp >= g.playerXP.xpToNextLevel) {
      g.playerXP.xp -= g.playerXP.xpToNextLevel;
      g.playerXP.level += 1;
      g.playerXP.xpToNextLevel = Math.floor(g.playerXP.xpToNextLevel * 1.4);
    }
  }
  saveGame(g);
  broadcast({ type: 'MISSION_COMPLETED', mission, playerXP: g.playerXP });
  res.json({ ok: true, mission, playerXP: g.playerXP });
});

// POST spin wheel
app.post('/api/game/wheel/spin', (req, res) => {
  const g = loadGame();
  if (g.wheelSpinsLeft <= 0) return res.json({ ok: false, error: 'No spins left' });
  g.wheelSpinsLeft -= 1;
  // Weighted random prize selection
  const prizes = g.wheelPrizes;
  const total = prizes.reduce((s, p) => s + p.probability, 0);
  let rand = Math.random() * total;
  let winner = prizes[prizes.length - 1];
  for (const prize of prizes) { rand -= prize.probability; if (rand <= 0) { winner = prize; break; } }
  // Award XP for spin
  g.playerXP.xp += 5;
  saveGame(g);
  broadcast({ type: 'WHEEL_SPIN', prize: winner, playerXP: g.playerXP });
  res.json({ ok: true, prize: winner, playerXP: g.playerXP, spinsLeft: g.wheelSpinsLeft });
});

// GET tournament
app.get('/api/game/tournament', (req, res) => res.json({ ok: true, data: loadGame().tournament }));

// POST tournament score update (simulate)
app.post('/api/game/tournament/score', (req, res) => {
  const g = loadGame();
  const { playerName, points } = req.body;
  const existing = g.tournament.leaderboard.find(p => p.name === playerName);
  if (existing) {
    existing.points += points;
  } else {
    g.tournament.leaderboard.push({ rank: 0, name: playerName, points, prize: '-' });
  }
  g.tournament.leaderboard.sort((a, b) => b.points - a.points);
  g.tournament.leaderboard.forEach((p, i) => p.rank = i + 1);
  saveGame(g);
  broadcast({ type: 'TOURNAMENT_UPDATE', leaderboard: g.tournament.leaderboard.slice(0, 10) });
  res.json({ ok: true });
});

// GET player XP
app.get('/api/game/xp', (req, res) => res.json({ ok: true, data: loadGame().playerXP }));

// POST add XP
app.post('/api/game/xp/add', (req, res) => {
  const g = loadGame();
  const amount = req.body.amount || 10;
  g.playerXP.xp += amount;
  g.playerXP.totalXP += amount;
  let leveledUp = false;
  while (g.playerXP.xp >= g.playerXP.xpToNextLevel) {
    g.playerXP.xp -= g.playerXP.xpToNextLevel;
    g.playerXP.level += 1;
    g.playerXP.xpToNextLevel = Math.floor(g.playerXP.xpToNextLevel * 1.4);
    leveledUp = true;
  }
  saveGame(g);
  if (leveledUp) broadcast({ type: 'LEVEL_UP', playerXP: g.playerXP });
  broadcast({ type: 'XP_UPDATE', playerXP: g.playerXP });
  res.json({ ok: true, playerXP: g.playerXP, leveledUp });
});

// ─── WebSocket Connection Handler ─────────────────────────
wss.on('connection', (ws) => {
  // Send initial state on connect
  const g = loadGame();
  ws.send(JSON.stringify({ type: 'INIT', jackpots: g.jackpots, tournament: g.tournament, playerXP: g.playerXP, missions: g.missions, wheelSpinsLeft: g.wheelSpinsLeft, loyaltyConfig: g.loyaltyConfig, cashbackConfig: g.cashbackConfig }));

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'PING') ws.send(JSON.stringify({ type: 'PONG' }));
    } catch (e) { }
  });
});

// ─── Live Jackpot Ticker ──────────────────────────────────
// Increments jackpot values every second and broadcasts
setInterval(() => {
  const g = loadGame();
  const jp = g.jackpots;
  jp.bronze.amount = parseFloat((jp.bronze.amount + jp.bronze.increment * (Math.random() * 2 + 0.5)).toFixed(2));
  jp.silver.amount = parseFloat((jp.silver.amount + jp.silver.increment * (Math.random() * 2 + 0.5)).toFixed(2));
  jp.gold.amount = parseFloat((jp.gold.amount + jp.gold.increment * (Math.random() * 2 + 0.5)).toFixed(2));
  jp.diamond.amount = parseFloat((jp.diamond.amount + jp.diamond.increment * (Math.random() * 2 + 0.5)).toFixed(2));
  saveGame(g);
  broadcast({ type: 'JACKPOT_TICK', jackpots: jp });
}, 1500);

// ─── Live Tournament Score Simulation ────────────────────
setInterval(() => {
  const g = loadGame();
  const board = g.tournament.leaderboard;
  if (board.length > 0) {
    const idx = Math.floor(Math.random() * Math.min(5, board.length));
    board[idx].points += Math.floor(Math.random() * 150 + 10);
    board.sort((a, b) => b.points - a.points);
    board.forEach((p, i) => p.rank = i + 1);
    saveGame(g);
    broadcast({ type: 'TOURNAMENT_UPDATE', leaderboard: board.slice(0, 10) });
  }
}, 4000);

// ─── Start ───────────────────────────────────────────────
if (!fs.existsSync(DB_FILE)) saveDB(getCMSDefaults());
if (!fs.existsSync(GAME_FILE)) saveGame(getGameDefaults());

// ─── Winners API ───────────────────────────────────────────
const apiWinners = [
  { id: "w1", name: "Marian D.", amount: 14500, game: "Sweet Bonanza", time: "2m ago" },
  { id: "w2", name: "Alex V.", amount: 3240, game: "100 Burning Hot", time: "5m ago" },
  { id: "w3", name: "Ionut M.", amount: 8900, game: "Gates of Olympus", time: "8m ago" },
  { id: "w4", name: "Andrei S.", amount: 2100, game: "Book of Ra", time: "12m ago" },
  { id: "w5", name: "Florin C.", amount: 45000, game: "Big Bass Bonanza", time: "15m ago" },
];

app.get('/api/winners', (req, res) => {
  res.json({ ok: true, winners: apiWinners });
});

// ─── RTP API ───────────────────────────────────────────────
app.get('/api/rtp', (req, res) => {
  res.json({
    ok: true,
    hot: [
      { name: "Shining Crown", rtp: 104.5, trend: "up", change: "+2.1%" },
      { name: "Burning Hot", rtp: 102.8, trend: "up", change: "+1.5%" },
      { name: "Sweet Bonanza", rtp: 99.2, trend: "up", change: "+0.8%" }
    ],
    cold: [
      { name: "Book of Ra", rtp: 88.4, trend: "down", change: "-3.2%" },
      { name: "Sizzling Hot", rtp: 91.1, trend: "down", change: "-1.8%" },
      { name: "Lucky Lady", rtp: 92.5, trend: "down", change: "-1.1%" }
    ]
  });
});

server.listen(PORT, () => {
  console.log(`✅ Cashpot Server (CMS + Gamification + WebSocket) → http://localhost:${PORT}`);
});

