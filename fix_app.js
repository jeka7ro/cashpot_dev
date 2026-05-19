const fs = require('fs');
let lines = fs.readFileSync('app/src/App.svelte', 'utf-8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<!-- ─── LUCKY WHEEL (sidebar widget) ─── -->')) {
    // The structure is:
    // <!-- ─── LUCKY WHEEL (sidebar widget) ─── -->
    // {#if isLoggedIn && widgetsSource?.luckyWheel?.enabled !== false}
    //   <div style="margin: 12px; padding: ... text-align:center;">
    //     <button ...>
    
    // So we need to insert `{#if widgetsSource.luckyWheel.size === 's'}` right before the `<button ` that follows.
    let j = i + 1;
    while (j < lines.length && !lines[j].includes('<button ')) {
      j++;
    }
    
    if (j < lines.length) {
      lines.splice(j, 0, "                {#if widgetsSource.luckyWheel.size === 's'}");
      break;
    }
  }
}

fs.writeFileSync('app/src/App.svelte', lines.join('\n'));
