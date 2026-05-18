import fs from 'fs';
let content = fs.readFileSync('src/components/InfiniteCanvas.tsx', 'utf8');

// remove 摄像机
content = content.replace(/<button className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white transition-colors shrink-0">\s*<Camera size={14} className="text-zinc-400" \/> 摄像机\s*<\/button>/g, '');

fs.writeFileSync('src/components/InfiniteCanvas.tsx', content);
console.log('done camera');
