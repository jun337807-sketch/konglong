const fs = require('fs');
const path = './src/components/InfiniteCanvas.tsx';
let content = fs.readFileSync(path, 'utf8');

const assetGroupOld = `const AssetGroupNode = ({ data, id, selected }: any) => {
  return (
    <>
      <NodeResizer minWidth={380} minHeight={200} isVisible={selected} />
      <div className={\`\${nodeBg} border-[1.5px] \${selected ? selectedBorder : defaultBorder} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow min-w-[380px] w-full h-full flex flex-col\`}>
        <Handle type="target" position={Position.Left} className={handleStyle} />
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/50">
          <div className="flex items-center gap-2 text-zinc-400">
            <Box size={14} className={selected ? "text-[#00bcd4]" : ""} />
            <span className="text-xs font-semibold tracking-wide">{data.title} ({data.assets?.length || 0})</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); if (data.onGenerateAll) data.onGenerateAll(id); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00bcd4]/10 hover:bg-[#00bcd4]/20 text-[#00bcd4] rounded-lg text-xs transition-colors border border-[#00bcd4]/30"
          >
            <Sparkles size={12} />
            <span>全部生成</span>
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto flex-1 h-full pr-1 custom-scrollbar">
          {data.assets?.map((asset: any, idx: number) => (
            <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-2 flex flex-col group relative">
              <div className="text-sm font-medium text-zinc-200 mb-1">{asset.name}</div>
              <div className="text-[10px] text-zinc-500 line-clamp-3 mb-2 flex-1">{asset.description}</div>
              
              {asset.imageUrl ? (
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-black/50 relative">
                  <img src={asset.imageUrl} className="w-full h-full object-cover" />
                </div>
              ) : asset.isGenerating ? (
                <div className="w-full aspect-square rounded-lg border border-[#00bcd4]/30 bg-[#00bcd4]/5 flex flex-col items-center justify-center">
                  <Sparkles className="text-[#00bcd4] animate-pulse mb-2" size={20} />
                  <span className="text-[10px] text-[#00bcd4]">生成中...</span>
                </div>
              ) : (
                <div className="w-full aspect-square rounded-lg border border-dashed border-zinc-700 bg-zinc-800/20 flex flex-col items-center justify-center group/btn relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); if (data.onGenerateSingle) data.onGenerateSingle(id, idx); }}
                    className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-opacity text-zinc-500 hover:text-[#00bcd4]"
                  >
                    <ImagePlus size={20} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <Handle type="source" position={Position.Right} className={handleStyle} />
      </div>
    </>
  );
};`;

const assetGroupNew = `const AssetGroupNode = ({ data, id, selected }: any) => {
  const isTextOnly = data.type === 'textOnly';
  
  return (
    <>
      <NodeResizer minWidth={380} minHeight={200} isVisible={selected} />
      <div className={\`\${nodeBg} border-[1.5px] \${selected ? selectedBorder : defaultBorder} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow min-w-[380px] w-full h-full flex flex-col relative\`}>
        <Handle type="target" position={Position.Left} className={handleStyle} />
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/50">
          <div className="flex items-center gap-2 text-zinc-400">
            <Box size={14} className={selected ? "text-[#00bcd4]" : ""} />
            <span className="text-xs font-semibold tracking-wide">{data.title} ({data.assets?.length || 0})</span>
          </div>
          {!isTextOnly && (
            <button 
              onClick={(e) => { e.stopPropagation(); if (data.onGenerateAll) data.onGenerateAll(id); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00bcd4]/10 hover:bg-[#00bcd4]/20 text-[#00bcd4] rounded-lg text-xs transition-colors border border-[#00bcd4]/30"
            >
              <Sparkles size={12} />
              <span>全部生成</span>
            </button>
          )}
        </div>
        <div className={\`\${isTextOnly ? 'flex flex-col gap-2' : 'grid grid-cols-2 lg:grid-cols-3 gap-3'} overflow-y-auto flex-1 h-full pr-1 custom-scrollbar\`}>
          {data.assets?.map((asset: any, idx: number) => (
            <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex flex-col group relative">
              <div className="text-sm font-medium text-zinc-200 mb-1">{asset.name}</div>
              
              {!isTextOnly ? (
                <textarea
                  className="w-full bg-transparent text-[10px] text-zinc-400 resize-none outline-none flex-1 custom-scrollbar min-h-[40px] pointer-events-auto"
                  value={asset.description}
                  onChange={(e) => {
                     if (data.onUpdateAssetDescription) data.onUpdateAssetDescription(id, idx, e.target.value);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="text-[11px] text-zinc-400 flex-1">{asset.description}</div>
              )}
              
              {!isTextOnly && (
                <>
                  {asset.imageUrl ? (
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-black/50 relative mt-2">
                      <img src={asset.imageUrl} className="w-full h-full object-cover" />
                    </div>
                  ) : asset.isGenerating ? (
                    <div className="w-full aspect-square rounded-lg border border-[#00bcd4]/30 bg-[#00bcd4]/5 flex flex-col items-center justify-center mt-2">
                      <Sparkles className="text-[#00bcd4] animate-pulse mb-2" size={20} />
                      <span className="text-[10px] text-[#00bcd4]">生成中...</span>
                    </div>
                  ) : (
                    <div className="w-full aspect-square rounded-lg border border-dashed border-zinc-700 bg-zinc-800/20 flex flex-col items-center justify-center group/btn relative mt-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); if (data.onGenerateSingle) data.onGenerateSingle(id, idx); }}
                        className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-opacity text-zinc-500 hover:text-[#00bcd4]"
                      >
                        <ImagePlus size={20} />
                      </button>
                    </div>
                  )}
                  {/* Handle for each asset item to connect separately */}
                  <Handle 
                    type="source" 
                    position={Position.Right} 
                    id={\`asset-\${idx}\`}
                    className="!w-3 !h-3 !bg-[#00bcd4] !border-2 !border-[#111214] opacity-0 group-hover:opacity-100 transition-opacity" 
                    style={{ top: '50%', right: -6 }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
        <Handle type="source" position={Position.Right} className={handleStyle} />
      </div>
    </>
  );
};`;
content = content.replace(assetGroupOld, assetGroupNew);
fs.writeFileSync(path, content, 'utf8');
