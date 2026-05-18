import fs from 'fs';
let content = fs.readFileSync('src/components/InfiniteCanvas.tsx', 'utf8');

// replace the button by index matching
const startIdx = content.indexOf('<button className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white transition-colors shrink-0"');
if (startIdx !== -1) {
  const endIdx = content.indexOf('</button>', startIdx) + '</button>'.length;
  const chunk = content.substring(startIdx, endIdx);
  if (chunk.includes('摄像机')) {
     content = content.substring(0, startIdx) + content.substring(endIdx);
  }
}

fs.writeFileSync('src/components/InfiniteCanvas.tsx', content);
console.log('done camera');
