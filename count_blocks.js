const fs = require('fs');
const content = fs.readFileSync('app/src/App.svelte', 'utf-8');

const starts = (content.match(/{#if/g) || []).length;
const ends = (content.match(/{\/if}/g) || []).length;
const eachStarts = (content.match(/{#each/g) || []).length;
const eachEnds = (content.match(/{\/each}/g) || []).length;

console.log(`IF starts: ${starts}, ends: ${ends}`);
console.log(`EACH starts: ${eachStarts}, ends: ${eachEnds}`);

// Let's also find all {:else} and {:else if}
const elses = (content.match(/{:else/g) || []).length;
console.log(`ELSEs: ${elses}`);
