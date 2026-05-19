const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'app/src/App.svelte');
let code = fs.readFileSync(file, 'utf8');

// Replace {bannersConfig.items[idx].title} with {#if bannersConfig.items[idx].title} ... {/if}
// Actually, it's safer to just wrap the h3 and p elements.
// Find: <h3 ...>{bannersConfig.items[idx].title}</h3>
// Replace: {#if bannersConfig.items[idx].title}<h3 ...>{bannersConfig.items[idx].title}</h3>{/if}

// Regex to wrap h3
code = code.replace(/(<h3[^>]*>\s*\{bannersConfig\.items\[idx\]\.title\}\s*<\/h3>)/g, '{#if bannersConfig.items[idx].title}$1{/if}');

// Regex to wrap p (subtitle)
code = code.replace(/(<p[^>]*>\s*\{bannersConfig\.items\[idx\]\.subtitle\}\s*<\/p>)/g, '{#if bannersConfig.items[idx].subtitle}$1{/if}');

fs.writeFileSync(file, code);
console.log('Done modifying App.svelte for banners');
