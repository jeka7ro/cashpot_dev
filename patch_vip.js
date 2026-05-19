const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'server', 'cms-data.json');

if (fs.existsSync(DB_FILE)) {
  const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  data.vipConfig = {
    title: "CASHPOT VIP CLUB",
    subtitle: "Progresează jucând ca să meriți nivelele superioare",
    titleColor: "#facc15",
    titleSize: "56",
    subtitleColor: "#cbd5e1",
    subtitleSize: "20",
    levels: [
      { id: 1, name: "Peștișor Koi", rank: "Nivel 1", img: "/koi_vip.png", bgColor: "rgba(255, 255, 255, 0.05)" },
      { id: 2, name: "Delfin de Argint", rank: "Nivel 2", img: "/dolphin_vip.png", bgColor: "rgba(255, 255, 255, 0.05)" },
      { id: 3, name: "Crab de Aur", rank: "Nivel 3", img: "/crab_vip.png", bgColor: "rgba(255, 255, 255, 0.05)" },
      { id: 4, name: "Caracatiță Elegantă", rank: "Nivel 4", img: "/octopus_vip.png", bgColor: "rgba(255, 255, 255, 0.05)" },
      { id: 5, name: "RECHINUL SUPREM", rank: "Nivel 5 • Mascota ta oficială", img: "/rechin_supreme.png", bgColor: "linear-gradient(135deg, #2e1065, #1e1b4b)" }
    ]
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log('Successfully patched cms-data.json with new VIP config');
} else {
  console.error('cms-data.json not found');
}
