const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'app/src/App.svelte');
let code = fs.readFileSync(file, 'utf8');

// Add formatBalance function
const funcCode = `
  function formatBalance(bal) {
    if (bal === undefined || bal === null) return "";
    const parts = bal.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split(",");
    return \`\${parts[0]}<span style="font-size: 0.7em;">,\${parts[1]}</span>\`;
  }
`;
if (!code.includes('function formatBalance(')) {
    code = code.replace('let showMobileWallet = false;', 'let showMobileWallet = false;' + funcCode);
}

// Replace occurrences
code = code.replace(/\{userBalance\.toLocaleString\(['"]ro-RO['"],\s*\{\s*minimumFractionDigits:\s*2,?\s*\}\)\}/g, '{@html formatBalance(userBalance)}');
code = code.replace(/\{userBonus\.toLocaleString\(['"]ro-RO['"],\s*\{\s*minimumFractionDigits:\s*2,?\s*\}\)\}/g, '{@html formatBalance(userBonus)}');

// For any single-line ones
code = code.replace(/\{userBalance\.toLocaleString\(['"]ro-RO['"]\s*,\s*\{\s*minimumFractionDigits:\s*2\s*\}\s*\)\}/g, '{@html formatBalance(userBalance)}');
code = code.replace(/\{userBonus\.toLocaleString\(['"]ro-RO['"]\s*,\s*\{\s*minimumFractionDigits:\s*2\s*\}\s*\)\}/g, '{@html formatBalance(userBonus)}');

fs.writeFileSync(file, code);
console.log('Done modifying App.svelte');
