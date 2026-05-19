sed -i '' -e '/cmsDraftSidebarWidgets.subscribe(/,/);/c\
  cmsDraftSidebarWidgets.subscribe((v) => {\
    let parsed = JSON.parse(JSON.stringify(v));\
    if (!parsed.luckyWheel) parsed.luckyWheel = defaultSidebarWidgets.luckyWheel;\
    if (!parsed.cashbackProgress) parsed.cashbackProgress = defaultSidebarWidgets.cashbackProgress;\
    if (!parsed.tournament) parsed.tournament = defaultSidebarWidgets.tournament;\
    if (!parsed.jackpotWidget) parsed.jackpotWidget = defaultSidebarWidgets.jackpotWidget;\
    if (!parsed.missions) parsed.missions = defaultSidebarWidgets.missions;\
    if (!parsed.promoCards) parsed.promoCards = [];\
    sidebarWidgetsConfig = parsed;\
  });\
' app/src/AdminCMS.svelte
