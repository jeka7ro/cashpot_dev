const url = "http://localhost:3001/api/proxy/cashpot?url=" + encodeURIComponent("https://cashpot.ro/api/dynamic/jackpots.json");
fetch(url).then(r => r.json()).then(data => {
  let apiLevelsCards = [];
  let apiLevelsBell = [];
  if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (data.jackpotCards && data.jackpotCards.levels) apiLevelsCards = data.jackpotCards.levels;
      if (data.bellLink && data.bellLink.levels) apiLevelsBell = data.bellLink.levels;
  }
  console.log("Cards length:", apiLevelsCards.length);
  if (apiLevelsCards.length) console.log("Cards value:", apiLevelsCards[0].value);
  console.log("Bell length:", apiLevelsBell.length);
  if (apiLevelsBell.length) console.log("Bell value:", apiLevelsBell[0].value);
}).catch(console.error);
