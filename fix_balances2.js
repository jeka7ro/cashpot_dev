const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'app/src/App.svelte');
let code = fs.readFileSync(file, 'utf8');

// Replace any occurrence of userBalance.toLocaleString(...) spanning multiple lines
code = code.replace(/\{userBalance\.toLocaleString\([^}]+\)\}/g, '{@html formatBalance(userBalance)}');
code = code.replace(/\{userBonus\.toLocaleString\([^}]+\)\}/g, '{@html formatBalance(userBonus)}');

fs.writeFileSync(file, code);
console.log('Done modifying App.svelte with greedy regex');
