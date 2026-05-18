import fs from 'fs';

let content = fs.readFileSync('src/components/InfiniteCanvas.tsx', 'utf8');

// 1. Remove 尝试: 图生图 / 图片高清
const tryBlockRegex = /<div className="w-full px-8 mb-4">\s*<div className="text-xs text-zinc-500 font-medium mb-3">尝试:<\/div>[\s\S]*?<\/div>\s*<\/div>/g;
content = content.replace(tryBlockRegex, '');

// 2. Remove 风格 / 标记 / 聚焦
// Looking at lines 664-690
const styleMarkFocusStartStr = `<div className="relative">\n               <button \n                 onClick={(e) => { e.stopPropagation(); setShowStyleMenu(!showStyleMenu); setShowFormatMenu(false); setShowCountMenu(false); }}\n                 className={\`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors rounded-lg border \${showStyleMenu ? 'bg-zinc-700 text-white border-zinc-600' : 'bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300 border-zinc-700'}\`}\n               >\n                 <Box size={14} /> 风格: {stylePreset} <ChevronDown size={12} className={\`transition-transform \${showStyleMenu ? 'rotate-180' : ''}\`} />\n               </button>`;
// It extends up to the 聚焦 button.
const styleMarkFocusRegex = /<div className="relative">[\s\S]*?<Box size={14} \/> 风格[\s\S]*?<\/button>[\s\S]*?<\/div>\s*<\/div>\s*<button className="flex items-center gap-1\.5 px-3 py-1\.5 bg-zinc-800\/50 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors">\s*<MapPin size={14} \/> 标记\s*<\/button>\s*<button className="flex items-center gap-1\.5 px-3 py-1\.5 bg-zinc-800\/50 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors">\s*<Focus size={14} \/> 聚焦\s*<\/button>/;

content = content.replace(styleMarkFocusRegex, '');

// 3. Remove 摄像机
const cameraRegex = /<button className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white transition-colors shrink-0">\s*<Camera size={14} className="text-zinc-400" \/> 摄像机\s*<\/button>/;
content = content.replace(cameraRegex, '');

fs.writeFileSync('src/components/InfiniteCanvas.tsx', content);
console.log('Done');
