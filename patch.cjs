const fs = require('fs');
const path = './src/components/InfiniteCanvas.tsx';
let content = fs.readFileSync(path, 'utf8');

// The string we want to find in the menu
const startStr = `<span className="text-sm">脚本</span>\n              {nodes.find(n => n.id === fullscreenNodeId)?.type === 'scriptNode' && (\n              <div className="w-full h-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl overflow-auto text-zinc-200 custom-scrollbar">`;

// We find its index
const startIndex = content.indexOf(startStr);
if (startIndex !== -1) {
  // Let's find the end of the corrupted block:
  const endStr = `                 </table>\n                )}\n              </div>\n            )}nth', screenToFlowPosition({ x: menu.left, y: menu.top }), menu.sourceNodeId); setMenu(null); }} className="flex items-center gap-3 w-full px-2 py-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-[#00bcd4]">\n                  <div className="w-6 h-6 rounded-md bg-[#00bcd4]/10 flex items-center justify-center"><Video size={12} /></div>\n                  <span className="text-sm">视频合成</span>\n                </button>\n              )}`;
  const endIndex = content.indexOf(endStr, startIndex);
  if (endIndex !== -1) {
      const replacement = `<span className="text-sm">脚本</span>
              </button>

              <div className="h-px bg-zinc-800/50 my-1"></div>
              
              <button onClick={() => { addNode('aiGenNode', 'text2image', screenToFlowPosition({ x: menu.left, y: menu.top }), menu.sourceNodeId); setMenu(null); }} className="flex items-center gap-3 w-full px-2 py-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-[#00bcd4]">
                <div className="w-6 h-6 rounded-md bg-[#00bcd4]/10 flex items-center justify-center"><BrainCircuit size={12} /></div>
                <span className="text-sm">图文生成</span>
              </button>
              <button onClick={() => { addNode('aiGenNode', 'autoStoryboard', screenToFlowPosition({ x: menu.left, y: menu.top }), menu.sourceNodeId); setMenu(null); }} className="flex items-center gap-3 w-full px-2 py-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-[#00bcd4]">
                <div className="w-6 h-6 rounded-md bg-[#00bcd4]/10 flex items-center justify-center"><LayoutGrid size={12} /></div>
                <span className="text-sm">智能分镜生成</span>
              </button>
              {menu.type === 'add-connected-node' && (
                <button onClick={() => { addNode('aiGenNode', 'videoSynth', screenToFlowPosition({ x: menu.left, y: menu.top }), menu.sourceNodeId); setMenu(null); }} className="flex items-center gap-3 w-full px-2 py-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-[#00bcd4]">
                  <div className="w-6 h-6 rounded-md bg-[#00bcd4]/10 flex items-center justify-center"><Video size={12} /></div>
                  <span className="text-sm">视频合成</span>
                </button>
              )}`;
              
      const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex + endStr.length);
      fs.writeFileSync(path, newContent, 'utf8');
      console.log('Patch 1 applied successfully!');
  } else {
      console.log('endStr not found');
  }
} else {
  console.log('startStr not found');
}
