import fs from 'fs';

let ic = fs.readFileSync('src/components/InfiniteCanvas.tsx', 'utf8');
ic = ic.replace(`          nodes={nodes}
          edges={edges}
          edges={edges}`, `          nodes={nodes}
          edges={edges}`);
fs.writeFileSync('src/components/InfiniteCanvas.tsx', ic);

let files = [
  'src/services/canvasStateManager.ts',
  'src/hooks/useCanvasHistory.ts',
  'src/components/VersionPanel.tsx'
];

for (let file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/'reactflow'/g, "'@xyflow/react'");
  fs.writeFileSync(file, content);
}

console.log('Fixed imports and duplicate prop!');
