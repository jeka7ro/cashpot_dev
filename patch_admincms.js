const fs = require('fs');
let content = fs.readFileSync('app/src/AdminCMS.svelte', 'utf-8');

// Replace the subscription block with a sanitize function
const sanitizeFunc = `
  function sanitizeSidebarWidgets(w) {
    if (!w) w = JSON.parse(JSON.stringify(defaultSidebarWidgets));
    let parsed = JSON.parse(JSON.stringify(w));
    if (!parsed.luckyWheel) parsed.luckyWheel = defaultSidebarWidgets.luckyWheel;
    if (!parsed.cashbackProgress) parsed.cashbackProgress = defaultSidebarWidgets.cashbackProgress;
    if (!parsed.tournament) parsed.tournament = defaultSidebarWidgets.tournament;
    if (!parsed.jackpotWidget) parsed.jackpotWidget = defaultSidebarWidgets.jackpotWidget;
    if (!parsed.missions) parsed.missions = defaultSidebarWidgets.missions;
    if (!parsed.promoCards) parsed.promoCards = [];
    return parsed;
  }
`;

content = content.replace(/cmsDraftSidebarWidgets\.subscribe\(\(v\) => \{[\s\S]*?sidebarWidgetsConfig = parsed;\n  \}\);/, sanitizeFunc + '\n  cmsDraftSidebarWidgets.subscribe((v) => { sidebarWidgetsConfig = sanitizeSidebarWidgets(v); });');

// Replace in restoreBackup
content = content.replace(/if \(backup\.sidebarWidgets\) sidebarWidgetsConfig = JSON\.parse\(JSON\.stringify\(backup\.sidebarWidgets\)\);/g, 'if (backup.sidebarWidgets) sidebarWidgetsConfig = sanitizeSidebarWidgets(backup.sidebarWidgets);');

// Replace in discardChanges
content = content.replace(/sidebarWidgetsConfig = JSON\.parse\(JSON\.stringify\(\$cmsSidebarWidgets\)\);/g, 'sidebarWidgetsConfig = sanitizeSidebarWidgets($cmsSidebarWidgets);');

fs.writeFileSync('app/src/AdminCMS.svelte', content);
