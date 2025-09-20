#!/usr/bin/env node
const fs = require('fs');
const p = 'web/index.html';
let s = fs.readFileSync(p,'utf8');
const blocks = [...s.matchAll(/<div class="feature-icon">[\s\S]*?<\/div>/g)].map(m=>({start:m.index, end:m.index+m[0].length}));
if (blocks.length >= 3) {
  const icons = [
    `<div class="feature-icon" aria-hidden="true">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Standards icon">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
  </svg>
</div>`,
    `<div class="feature-icon" aria-hidden="true">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Lock icon">
    <rect x="4" y="11" width="16" height="9" rx="2"></rect>
    <path d="M8 11V7a4 4 0 0 1 8 0v4"></path>
  </svg>
</div>`,
    `<div class="feature-icon" aria-hidden="true">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Globe icon">
    <circle cx="12" cy="12" r="9"></circle>
    <path d="M3 12h18M12 3c3 4 3 14 0 18M5.5 16.5c3 .5 9 .5 13 0"></path>
  </svg>
</div>`
  ];
  // replace from end to start to preserve indices
  for (let i=0; i<3; i++){
    const b = blocks[i];
    s = s.slice(0,b.start) + icons[i] + s.slice(b.end);
  }
  fs.writeFileSync(p,s);
  console.log('Updated feature icons');
} else {
  console.log('Did not find 3 feature icons to replace');
}