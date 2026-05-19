function getInitial(key, def) {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Simple top-level merge to ensure new default properties exist
        if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
           return { ...JSON.parse(JSON.stringify(def)), ...parsed, jackpotWidget: parsed.jackpotWidget || def.jackpotWidget };
        }
        return parsed;
      }
    } catch (e) {}
  }
  return JSON.parse(JSON.stringify(def));
}
