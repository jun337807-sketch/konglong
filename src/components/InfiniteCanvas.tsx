import React, { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  Panel,
  Handle,
  Position,
  ReactFlowProvider,
  BackgroundVariant,
  useReactFlow,
  NodeToolbar,
  NodeResizer,
  useEdges,
  useNodes,
  MarkerType,
  BaseEdge,
  getBezierPath
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  ImagePlus, Type, Film, BrainCircuit, LayoutGrid, X, 
  Play, Maximize, Download, Sun, SplitSquareHorizontal, 
  Move3D, Eye, Sparkles, Focus, RotateCw, BookMarked, 
  Copy, CopyPlus, ClipboardPaste, Trash2, BoxSelect, Settings, HelpCircle,
  Plus, Share2, Shapes, Clock, Headphones, AlignLeft, Image as ImageIcon, Video, Scissors, AudioLines, FileText, Upload, Box, MapPin, Monitor, Camera, Languages, Settings2, Zap, ChevronDown, ArrowUp, User, RefreshCw, CheckCircle
} from 'lucide-react';
import { getAIClient, runImageGeneration, runMegaBreakdown, runScriptReview } from '../services/aiService';

// Custom Node Styling Constants
const selectedBorder = "border-[#00bcd4]"; // Cyan-blue 
const defaultBorder = "border-zinc-800/80";
const nodeBg = "bg-[#111214]/90 backdrop-blur-md";
const handleStyle = "!w-5 !h-5 !min-w-[20px] !min-h-[20px] !bg-[#1E1E1E] !border-2 !border-zinc-500 hover:!bg-[#00bcd4] hover:!border-[#00bcd4] hover:!scale-125 hover:shadow-[0_0_12px_rgba(0,188,212,0.8)] transition-all duration-200 cursor-crosshair opacity-80 z-50 rounded-full";
const resizerHandleStyle = "!w-4 !h-4 !min-w-[16px] !min-h-[16px] !bg-zinc-800 !border-2 !border-[#00bcd4] !rounded-sm opacity-90";

// Custom Node Components
const TextNode = ({ data, id, selected }: any) => {
  const [showReviewMenu, setShowReviewMenu] = useState(false);
  const [reviewMode, setReviewMode] = useState<'full' | 'scene' | 'beat'>('full');
  const [reviewOptions, setReviewOptions] = useState({ compliance: true, dialogue: true });

  const reviewModeConfig = {
    'full': { label: '全文审查', icon: Zap, type: 'script-review-full' },
    'scene': { label: '单场审查', icon: MapPin, type: 'script-review-scene' },
    'beat': { label: 'Beat 审查', icon: Clock, type: 'script-review-beat' },
  };

  const currentReview = reviewModeConfig[reviewMode];
  const CurrentIcon = currentReview.icon;

  return (
    <>
      <NodeResizer color="#00bcd4" handleClassName={resizerHandleStyle} minWidth={240} minHeight={150} isVisible={selected} />
      <div className={`${nodeBg} border-[1.5px] ${selected ? selectedBorder : defaultBorder} rounded-2xl p-4 shadow-sm hover:shadow-[0_0_15px_rgba(0,188,212,0.15)] transition-shadow min-w-[240px] w-full h-full flex flex-col group`} onClick={() => setShowReviewMenu(false)}>
        <Handle type="target" position={Position.Left} className={handleStyle} />
        <div className="flex items-center gap-2 mb-3 text-zinc-400 pb-2 border-b border-zinc-800/50">
          <Type size={14} className={selected ? "text-[#00bcd4]" : ""} />
          <span className="text-xs font-semibold tracking-wide flex-1">文本 / 剧本</span>
          <label className="cursor-pointer text-zinc-500 hover:text-[#00bcd4] transition-colors" title="上传TXT/MD剧本">
            <Upload size={14} />
            <input 
              type="file" 
              accept=".txt,.md,.csv" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const text = ev.target?.result as string;
                    if (data.onChange) data.onChange(id, text);
                  };
                  reader.readAsText(file);
                }
              }} 
            />
          </label>
        </div>
        <textarea 
          className="w-full flex-1 bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3 text-sm text-zinc-300 resize-none focus:outline-none focus:border-[#00bcd4] mb-3 focus:bg-zinc-900/80 transition-colors"
          value={data.text || ''}
          onChange={(e) => data.onChange(id, e.target.value)}
          placeholder="输入剧本内容..."
        />
        <div className="flex items-start justify-end gap-2 mt-auto pt-2 border-t border-zinc-800/50 flex-wrap relative">
          {!data.isReviewResult && (
            <>
              <div className="relative flex">
                <div className="flex items-stretch bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-400 rounded-lg text-xs transition-colors border border-zinc-700/50 hover:border-rose-500/50">
                  <button 
                    onClick={(e) => { e.stopPropagation(); if (data.onAddNode) data.onAddNode('textNode', currentReview.type, undefined, id, { reviewOptions }); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border-r border-zinc-700/50 hover:bg-rose-500/10 rounded-l-lg transition-colors"
                  >
                    <CurrentIcon size={12} />
                    <span>{currentReview.label}</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowReviewMenu(!showReviewMenu); }}
                    className="flex items-center px-2 py-1.5 hover:bg-rose-500/10 rounded-r-lg transition-colors"
                  >
                    <ChevronDown size={12} className={`transition-transform duration-200 ${showReviewMenu ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                
                {showReviewMenu && (
                  <div className="absolute bottom-full mb-1 left-0 w-44 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-20 flex flex-col">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setReviewMode('full'); 
                        setShowReviewMenu(false); 
                      }}
                      className={`flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-zinc-700 transition-colors ${reviewMode === 'full' ? 'text-rose-400 bg-zinc-700/50' : 'text-zinc-300'}`}
                    >
                      <Zap size={12} />
                      <div className="flex flex-col">
                        <span>全文审查</span>
                      </div>
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setReviewMode('scene'); 
                        setShowReviewMenu(false); 
                      }}
                      className={`flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-zinc-700 transition-colors border-t border-zinc-700/50 ${reviewMode === 'scene' ? 'text-rose-400 bg-zinc-700/50' : 'text-zinc-300'}`}
                    >
                      <MapPin size={12} />
                      <div className="flex flex-col">
                        <span>单场审查</span>
                      </div>
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setReviewMode('beat'); 
                        setShowReviewMenu(false); 
                      }}
                      className={`flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-zinc-700 transition-colors border-t border-zinc-700/50 ${reviewMode === 'beat' ? 'text-rose-400 bg-zinc-700/50' : 'text-zinc-300'}`}
                    >
                      <Clock size={12} />
                      <div className="flex flex-col">
                        <span>Beat 审查</span>
                      </div>
                    </button>
                    
                    <div className="border-t border-zinc-700/50 mt-1 pt-1 pb-1">
                      <div className="px-3 py-1 text-[10px] text-zinc-500 font-medium">审查选项</div>
                      <label 
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input 
                          type="checkbox" 
                          checked={reviewOptions.compliance} 
                          onChange={(e) => setReviewOptions(prev => ({...prev, compliance: e.target.checked}))} 
                          className="w-3 h-3 rounded bg-zinc-900 border-zinc-600 text-rose-500 focus:ring-rose-500/50" 
                        />
                        <span>内容合规风险</span>
                      </label>
                      <label 
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input 
                          type="checkbox" 
                          checked={reviewOptions.dialogue} 
                          onChange={(e) => setReviewOptions(prev => ({...prev, dialogue: e.target.checked}))} 
                          className="w-3 h-3 rounded bg-zinc-900 border-zinc-600 text-rose-500 focus:ring-rose-500/50" 
                        />
                        <span>台词 / OS 问题</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); if (data.onAddNode) data.onAddNode('scriptNode', 'director-breakdown', undefined, id); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 hover:bg-[#00bcd4]/20 text-zinc-300 hover:text-[#00bcd4] rounded-lg text-xs transition-colors border border-zinc-700/50 hover:border-[#00bcd4]/50"
              >
                <Film size={12} />
                <span>剧本拆解</span>
              </button>
            </>
          )}

          {data.isReviewResult && (
            <>
              {data.repairedText && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (data.onApplyRepair) data.onApplyRepair(data.sourceId, data.repairedText); 
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs transition-colors border border-emerald-500/30 hover:border-emerald-500/50"
                >
                  <CheckCircle size={12} />
                  <span>应用修复</span>
                </button>
              )}
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (data.onAddNode) {
                    data.onAddNode('textNode', `script-review-${data.reviewType}`, undefined, data.sourceId, { problem: data.problem }); 
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs transition-colors border border-blue-500/30 hover:border-blue-500/50"
              >
                <RefreshCw size={12} />
                <span>重新审查</span>
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  const problem = prompt("请输入您发现的具体问题：");
                  if (problem && data.onAddNode) data.onAddNode('textNode', 'script-review-repair', undefined, data.sourceId, { problem }); 
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 hover:bg-orange-500/20 text-zinc-300 hover:text-orange-400 rounded-lg text-xs transition-colors border border-zinc-700/50 hover:border-orange-500/50"
              >
                <Focus size={12} />
                <span>定点返修</span>
              </button>
            </>
          )}
        </div>
        <Handle type="source" position={Position.Right} className={handleStyle} />
      </div>
    </>
  );
};

const ImageNode = ({ data, id, selected }: any) => {
  const edges = useEdges();
  const nodes = useNodes();
  const { setNodes, getNode } = useReactFlow();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [resolution, setResolution] = useState('2K');
  const [aspectRatio, setAspectRatio] = useState('16:9');

  const incomingEdges = edges.filter((e: any) => e.target === id);
  const referenceNodes = incomingEdges.map((e: any) => nodes.find((n: any) => n.id === e.source)).filter(Boolean);
  const referenceImages = referenceNodes.filter((n: any) => n?.type === 'imageNode' && n?.data?.imageUrl);

  const handleAction = (action: string, payload?: any) => {
    setActiveDropdown(null);
    if (action === 'preview') {
      setIsPreviewOpen(true);
      return;
    }
    if (data.onAction) {
      data.onAction(id, action, payload);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight && data.aspectRatioLockedFor !== data.imageUrl) {
      const node = getNode(id);
      if (node) {
        const aspect = naturalWidth / naturalHeight;
        const currentWidth = node.style?.width ? parseInt(node.style.width as string) : 320;
        const targetHeight = Math.round(currentWidth / aspect);
        
        if (Math.abs((node.style?.height as number || 0) - targetHeight) > 2) {
          setNodes(nds => nds.map(n => {
            if (n.id === id) {
              return {
                ...n,
                style: { ...n.style, width: currentWidth, height: targetHeight },
                data: { ...n.data, aspectRatioLockedFor: data.imageUrl }
              };
            }
            return n;
          }));
        } else {
          setNodes(nds => nds.map(n => {
            if (n.id === id) {
              return { ...n, data: { ...n.data, aspectRatioLockedFor: data.imageUrl } };
            }
            return n;
          }));
        }
      }
    }
  };

  return (
    <>
      <NodeResizer color="#00bcd4" handleClassName={resizerHandleStyle} minWidth={240} minHeight={100} isVisible={selected} keepAspectRatio={!!data.imageUrl} />
      
      {/* Node Label (Above Node) */}
      <div className="absolute -top-7 left-0 text-zinc-400 text-xs flex items-center gap-1.5 font-medium px-1">
        <ImageIcon size={14} />
        图片节点
      </div>
      
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        className="flex items-center gap-1 p-1 bg-[#1a1b1e]/95 backdrop-blur-xl border border-zinc-700/80 rounded-xl shadow-2xl z-50 mb-2 relative"
      >
        <button onClick={() => handleAction('panorama')} className="p-1.5 text-zinc-400 hover:text-[#00bcd4] hover:bg-[#00bcd4]/10 rounded-lg tooltip relative" title="全景"><Maximize size={15} /></button>
        <button onClick={() => handleAction('multi-angle')} className="p-1.5 text-zinc-400 hover:text-[#00bcd4] hover:bg-[#00bcd4]/10 rounded-lg tooltip" title="多角度"><Move3D size={15} /></button>
        <button onClick={() => handleAction('relight')} className="p-1.5 text-zinc-400 hover:text-[#00bcd4] hover:bg-[#00bcd4]/10 rounded-lg tooltip" title="打光"><Sun size={15} /></button>
        <div className="w-px h-4 bg-zinc-700 mx-0.5"></div>
        <div className="relative">
          <button onClick={() => setActiveDropdown(activeDropdown === '9grid' ? null : '9grid')} className={`p-1.5 rounded-lg tooltip ${activeDropdown === '9grid' ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-[#00bcd4] hover:bg-[#00bcd4]/10'}`} title="九宫格"><LayoutGrid size={15} /></button>
          {activeDropdown === '9grid' && (
             <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-[#242424] border border-zinc-800 rounded-lg shadow-xl w-32 py-1 z-[100] text-sm text-zinc-300">
               <button onClick={() => handleAction('9grid-multi')} className="w-full text-left px-3 py-1.5 hover:bg-[#343434] hover:text-white">多视图网格</button>
               <button onClick={() => handleAction('9grid-story')} className="w-full text-left px-3 py-1.5 hover:bg-[#343434] hover:text-white">分镜推演</button>
               <button onClick={() => handleAction('9grid-character')} className="w-full text-left px-3 py-1.5 hover:bg-[#343434] hover:text-white">角色三视图</button>
             </div>
          )}
        </div>
        <div className="relative">
          <button onClick={() => setActiveDropdown(activeDropdown === 'hd' ? null : 'hd')} className={`p-1.5 rounded-lg tooltip ${activeDropdown === 'hd' ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-[#00bcd4] hover:bg-[#00bcd4]/10'}`} title="高清"><Sparkles size={15} /></button>
          {activeDropdown === 'hd' && (
             <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-[#242424] border border-zinc-800 rounded-lg shadow-xl w-32 py-1 z-[100] text-sm text-zinc-300">
               <button onClick={() => handleAction('hd-enhance')} className="w-full text-left px-3 py-1.5 hover:bg-[#343434] hover:text-white">高清增强</button>
               <button onClick={() => handleAction('hd-expand')} className="w-full text-left px-3 py-1.5 hover:bg-[#343434] hover:text-white">扩图</button>
               <button onClick={() => handleAction('hd-redraw')} className="w-full text-left px-3 py-1.5 hover:bg-[#343434] hover:text-white">重绘</button>
               <button onClick={() => handleAction('hd-erase')} className="w-full text-left px-3 py-1.5 hover:bg-[#343434] hover:text-white">擦除</button>
             </div>
          )}
        </div>
        <div className="relative">
          <button onClick={() => setActiveDropdown(activeDropdown === 'split' ? null : 'split')} className={`p-1.5 rounded-lg tooltip ${activeDropdown === 'split' ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-[#00bcd4] hover:bg-[#00bcd4]/10'}`} title="宫格切分"><SplitSquareHorizontal size={15} /></button>
          {activeDropdown === 'split' && (
             <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-[#242424] border border-zinc-800 rounded-lg shadow-xl w-24 py-1 z-[100] text-sm text-zinc-300">
               <button onClick={() => handleAction('split-4')} className="w-full text-left px-3 py-1.5 hover:bg-[#343434] hover:text-white">4宫格</button>
               <button onClick={() => handleAction('split-9')} className="w-full text-left px-3 py-1.5 hover:bg-[#343434] hover:text-white">9宫格</button>
               <button onClick={() => handleAction('split-16')} className="w-full text-left px-3 py-1.5 hover:bg-[#343434] hover:text-white">16宫格</button>
             </div>
          )}
        </div>
        <div className="w-px h-4 bg-zinc-700 mx-0.5"></div>
        <button onClick={() => handleAction('annotate')} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg tooltip" title="标注"><Focus size={15} /></button>
        <button onClick={() => handleAction('rotate')} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg tooltip" title="旋转"><RotateCw size={15} /></button>
        <button onClick={() => handleAction('download')} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg tooltip" title="下载"><Download size={15} /></button>
        <button onClick={() => handleAction('preview')} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg tooltip" title="预览"><Eye size={15} /></button>
      </NodeToolbar>
      
      <div className={`${nodeBg} border-[1.5px] ${selected ? selectedBorder : defaultBorder} rounded-2xl p-0 shadow-sm hover:shadow-[0_0_15px_rgba(0,188,212,0.15)] transition-shadow w-full h-full flex flex-col relative group`}>
        
        <Handle type="target" position={Position.Left} className={handleStyle} />
        
        {/* Right '+' Button / Handle */}
        <div className="absolute top-1/2 -translate-y-1/2 -right-8 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
             onClick={(e) => { e.stopPropagation(); setShowAddMenu(!showAddMenu); }}
             className="w-6 h-6 rounded-full bg-[#2A2A2A] border border-zinc-600 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700 hover:scale-110 transition-all shadow-md"
           >
             <Plus size={14} />
           </button>

           {showAddMenu && (
             <div className="absolute top-0 left-full ml-2 bg-[#2A2A2A] border border-zinc-700/80 rounded-xl shadow-2xl p-2 w-48 flex flex-col gap-1 z-[100]" onClick={e => e.stopPropagation()}>
               <div className="text-xs text-zinc-500 font-medium px-2 py-1.5 mb-1">引用该节点生成</div>
               <button onClick={(e) => { e.stopPropagation(); if(data.onAddNode) data.onAddNode('textNode', undefined, undefined, id); setShowAddMenu(false); }} className="flex items-center gap-3 w-full px-2 py-2 hover:bg-zinc-700/50 rounded-lg transition-colors text-zinc-300">
                 <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center"><Type size={12} /></div>
                 <span className="text-sm">文本</span>
               </button>
               <button onClick={(e) => { e.stopPropagation(); if(data.onAddNode) data.onAddNode('imageNode', undefined, undefined, id); setShowAddMenu(false); }} className="flex items-center gap-3 w-full px-2 py-2 hover:bg-zinc-700/50 rounded-lg transition-colors text-zinc-300">
                 <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center"><ImageIcon size={12} /></div>
                 <span className="text-sm">图片</span>
               </button>
               <button onClick={(e) => { e.stopPropagation(); if(data.onAddNode) data.onAddNode('videoNode', undefined, undefined, id); setShowAddMenu(false); }} className="flex items-center gap-3 w-full px-2 py-2 hover:bg-zinc-700/50 rounded-lg transition-colors text-zinc-300">
                 <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center"><Video size={12} /></div>
                 <span className="text-sm">视频</span>
               </button>
             </div>
           )}
        </div>
        <Handle type="source" position={Position.Right} className={handleStyle} />

        {data.imageUrl ? (
          <div className="flex-1 rounded-2xl overflow-hidden relative group/img bg-transparent m-1 flex flex-col justify-center">
            <img 
              src={data.imageUrl} 
              onLoad={handleImageLoad}
              alt="Node content" 
              className={`w-full h-full object-contain block ${data.rotation ? 'rotate-90 transition-transform' : ''}`} 
            />
            <button onClick={(e) => { e.stopPropagation(); if(data.onAction) data.onAction(id, 'download'); }} className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity z-10">
               <Upload size={16} />
            </button>
            {data.thumbnails && data.thumbnails.length > 0 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto py-1 px-2 shrink-0 scrollbar-hide bg-black/60 backdrop-blur-md rounded-xl max-w-[90%] z-10">
                {data.thumbnails.map((thumb: string, idx: number) => (
                  <div 
                    key={idx} 
                    onClick={(e) => { e.stopPropagation(); if(data.onAction) data.onAction(id, 'select-thumbnail', thumb) }} 
                    className={`w-10 h-10 shrink-0 rounded-lg overflow-hidden border ${data.imageUrl === thumb ? 'border-[#00bcd4] shadow-[0_0_8px_rgba(0,188,212,0.4)]' : 'border-zinc-800/50 hover:border-zinc-500'} cursor-pointer transition-all relative`}
                  >
                     <img src={thumb} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            
            {/* Generate Video Action Button */}
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (data.onAddNode) data.onAddNode('videoNode', 'generate-video', undefined, id); 
              }} 
              className="absolute bottom-3 right-3 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity z-10 flex items-center gap-1.5 shadow-lg shadow-purple-500/20 backdrop-blur"
            >
              <Video size={14} /> 生成视频
            </button>

            {data.isGenerating && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                <Sparkles className="text-[#00bcd4] animate-pulse mb-2" size={32} />
                <span className="text-sm text-zinc-300 font-medium">处理中...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 rounded-2xl bg-[#2A2A2A]/50 border-2 border-transparent hover:border-zinc-700 transition-colors flex flex-col items-center justify-center relative m-1">
             <div className="text-zinc-600 mb-6 mt-4">
               <ImageIcon size={64} className="opacity-40 mx-auto" />
             </div>
             
             <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="flex items-center gap-2 px-3 py-1.5 bg-[#2A2A2A] border border-zinc-700 hover:bg-zinc-700 text-zinc-300 rounded-lg cursor-pointer text-sm shadow-lg">
                  <Upload size={14} /> 上传
                  <input type="file" accept="image/*" className="hidden" onClick={e => e.stopPropagation()} onChange={(e) => {
                     e.stopPropagation();
                     const file = e.target.files?.[0];
                     if(file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                           if(data.onUpload) data.onUpload(id, ev.target?.result as string, 'image');
                        }
                        reader.readAsDataURL(file);
                     }
                  }}/>
                </label>
             </div>
             
             <div className="w-full px-8 mb-4">
               <div className="text-xs text-zinc-500 font-medium mb-3">尝试:</div>
               <div className="flex flex-col gap-2">
                 <button onClick={(e) => { e.stopPropagation(); const inp = document.getElementById(`upload-${id}`); if(inp) inp.click(); }} className="flex items-center gap-3 hover:bg-zinc-800 p-2.5 rounded-lg text-sm text-zinc-300 w-full transition-colors border border-transparent hover:border-zinc-700 text-left">
                   <Upload size={16} className="text-zinc-400" /> 图生图
                   <input id={`upload-${id}`} type="file" accept="image/*" className="hidden" onClick={e => e.stopPropagation()} onChange={(e) => {
                     e.stopPropagation();
                     const file = e.target.files?.[0];
                     if(file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                           if(data.onUpload) data.onUpload(id, ev.target?.result as string, 'image');
                        }
                        reader.readAsDataURL(file);
                     }
                  }}/>
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); if(data.onAction) data.onAction(id, 'hd'); }} className="flex items-center gap-3 hover:bg-zinc-800 p-2.5 rounded-lg text-sm text-zinc-300 w-full transition-colors border border-transparent hover:border-zinc-700 text-left">
                   <Sparkles size={16} className="text-zinc-400" /> 图片高清
                 </button>
               </div>
             </div>
          </div>
        )}
      </div>

      {/* Bottom Generation Panel (only show on selected) */}
      {(selected && !isPreviewOpen) && (
        <div 
          className="absolute top-[calc(100%+16px)] left-0 bg-[#2A2A2A] border border-zinc-700 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 min-w-[560px] z-[60] cursor-default"
          onClick={e => {
            e.stopPropagation();
            setShowFormatMenu(false);
          }}
        >
           {/* Top tools & Reference Images */}
           <div className="flex items-center gap-2">
             <button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors">
               <Box size={14} /> 风格
             </button>
             <button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors">
               <MapPin size={14} /> 标记
             </button>
             <button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors">
               <Focus size={14} /> 聚焦
             </button>

             {referenceImages.length > 0 && (
               <div className="ml-auto pl-4 border-l border-zinc-700 flex items-center gap-2">
                 {referenceImages.map((refNode: any, i: number) => (
                   <div key={refNode.id} className="relative w-8 h-8 rounded-md overflow-hidden border border-zinc-600 shadow-sm">
                     <img src={refNode.data.imageUrl} className="w-full h-full object-cover" />
                     <div className="absolute -top-1 -right-1 bg-[#242424] text-white border border-zinc-600 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                       {i + 1}
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>

           {/* Input Area */}
           <textarea 
             className="w-full h-16 bg-transparent border-none text-sm text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none focus:ring-0 my-2"
             placeholder="描述你想要生成的画面内容，按/呼出指令，@引用素材"
             value={data.prompt || ''}
             onChange={e => {
                if(data.onChange) data.onChange(id, 'prompt', e.target.value);
             }}
           />

           {/* Bottom Bar */}
           <div className="flex items-center justify-between border-t border-zinc-700/50 pt-3 flex-nowrap">
             <div className="flex items-center gap-2 shrink-0">
               <button className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white transition-colors">
                 <X size={14} className="text-zinc-400" /> Lib Nano Pro <ChevronDown size={12} />
               </button>
               <div className="relative">
                 <button 
                   onClick={(e) => { e.stopPropagation(); setShowFormatMenu(!showFormatMenu); }}
                   className={`flex items-center gap-1 text-xs transition-colors px-2 py-1 rounded-md whitespace-nowrap shrink-0 ${showFormatMenu ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'}`}
                 >
                   <Monitor size={14} className={showFormatMenu ? 'text-[#00bcd4]' : 'text-zinc-400'} /> {aspectRatio} • {resolution} <ChevronDown size={12} className={`transition-transform ${showFormatMenu ? 'rotate-180' : ''}`} />
                 </button>
                 
                 {showFormatMenu && (
                   <div 
                     className="absolute bottom-full left-0 mb-2 w-[340px] bg-[#1E1E1E] border border-zinc-700/80 rounded-xl shadow-2xl p-4 z-50 flex flex-col gap-4"
                     onClick={(e) => e.stopPropagation()}
                   >
                     {/* 分辨率 */}
                     <div>
                       <div className="text-xs text-zinc-500 mb-2 font-medium">分辨率</div>
                       <div className="grid grid-cols-3 gap-2">
                         {['1K', '2K', '4K'].map(res => (
                           <button 
                             key={res}
                             onClick={(e) => { e.stopPropagation(); setResolution(res); }}
                             className={`py-1.5 text-xs rounded-lg border transition-colors ${resolution === res ? 'border-zinc-300 text-white font-medium' : 'border-zinc-700/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'}`}
                           >
                             {res}
                           </button>
                         ))}
                       </div>
                     </div>
                     
                     {/* 比例 */}
                     <div>
                       <div className="text-xs text-zinc-500 mb-2 font-medium">比例</div>
                       <div className="grid grid-cols-5 gap-2">
                         {[
                           { label: '自适应', aspect: 'auto' },
                           { label: '1:1', aspect: '1/1' },
                           { label: '9:16', aspect: '9/16' },
                           { label: '16:9', aspect: '16/9' },
                           { label: '3:4', aspect: '3/4' },
                           { label: '4:3', aspect: '4/3' },
                           { label: '3:2', aspect: '3/2' },
                           { label: '2:3', aspect: '2/3' },
                           { label: '4:5', aspect: '4/5' },
                           { label: '5:4', aspect: '5/4' },
                           { label: '21:9', aspect: '21/9' },
                         ].map(ratio => {
                           const isSelected = aspectRatio === ratio.label;
                           // Parse aspect ratio numbers for icon sizing
                           let w = 12, h = 12;
                           if (ratio.aspect !== 'auto') {
                             const [x, y] = ratio.aspect.split('/').map(Number);
                             const maxDim = 16;
                             if (x > y) {
                               w = maxDim;
                               h = (y / x) * maxDim;
                             } else {
                               h = maxDim;
                               w = (x / y) * maxDim;
                             }
                           }
                           
                           return (
                             <button
                               key={ratio.label}
                               onClick={(e) => { e.stopPropagation(); setAspectRatio(ratio.label); }}
                               className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${isSelected ? 'border-zinc-300 bg-zinc-800' : 'border-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300'}`}
                             >
                               <div className="h-6 flex items-center justify-center mb-1">
                                 {ratio.aspect === 'auto' ? (
                                    <div className={`border-2 rounded-[2px] transition-colors w-4 h-4 ${isSelected ? 'border-white' : 'border-zinc-500'}`} />
                                 ) : (
                                    <div className={`border-2 rounded-[2px] transition-colors ${isSelected ? 'border-white' : 'border-zinc-500'}`} style={{ width: Math.max(8, w), height: Math.max(8, h) }} />
                                 )}
                               </div>
                               <div className={`text-[10px] ${isSelected ? 'text-white font-medium' : 'text-zinc-500'}`}>
                                 {ratio.label}
                               </div>
                             </button>
                           );
                         })}
                       </div>
                     </div>
                   </div>
                 )}
               </div>
               <button className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white transition-colors shrink-0">
                 <Camera size={14} className="text-zinc-400" /> 摄像机
               </button>
             </div>

             <div className="flex items-center gap-2 shrink-0">
               <button className="text-zinc-400 hover:text-white"><Languages size={14} /></button>
               <button className="text-zinc-400 hover:text-white"><Settings2 size={14} /></button>
               <button className="text-zinc-300 text-xs flex items-center gap-1">1张 <ChevronDown size={12}/></button>
               
               <button 
                 className="w-8 h-8 rounded-full bg-zinc-600 hover:bg-[#00bcd4] text-white flex items-center justify-center transition-all shadow-lg ml-1"
                 onClick={() => { if(data.onGenerate) data.onGenerate(id); }}
               >
                 <ArrowUp size={16} />
               </button>
             </div>
           </div>
        </div>
      )}

      {isPreviewOpen && data.imageUrl && (
        <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center backdrop-blur-sm" onClick={() => setIsPreviewOpen(false)}>
          <button className="absolute top-6 right-6 p-2 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700">
            <X size={20} />
          </button>
          <img src={data.imageUrl} alt="Preview" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
};

const VideoNode = ({ data, id, selected }: any) => {
  return (
    <>
      <NodeResizer color="#00bcd4" handleClassName={resizerHandleStyle} minWidth={280} minHeight={150} isVisible={selected} />
      <div className={`${nodeBg} border-[1.5px] ${selected ? selectedBorder : defaultBorder} rounded-2xl p-2 shadow-sm hover:shadow-md transition-shadow min-w-[280px] w-full h-full flex flex-col`}>
        <Handle type="target" position={Position.Left} className={handleStyle} />
        <div className="flex items-center gap-2 px-2 py-2 text-zinc-400">
          <Film size={14} className={selected ? "text-[#00bcd4]" : ""} />
          <span className="text-xs font-semibold tracking-wide">视频片段</span>
        </div>
        {data.isGenerating ? (
          <div className="rounded-xl overflow-hidden border border-[#00bcd4]/30 flex-1 min-h-[120px] flex flex-col items-center justify-center bg-[#00bcd4]/10">
            <Sparkles className="text-[#00bcd4] animate-pulse mb-3" size={32} />
            <span className="text-sm text-[#00bcd4] font-medium animate-pulse">视频生成中...</span>
          </div>
        ) : data.videoUrl ? (
          <div className="rounded-xl overflow-hidden border border-zinc-800/50 flex-1 min-h-[120px] flex items-center bg-black/40">
            <video src={data.videoUrl} controls className="w-full h-full object-contain block" autoPlay loop />
          </div>
        ) : (
          <label className="w-full flex-1 min-h-[120px] bg-zinc-900/50 hover:bg-zinc-800/50 border border-dashed border-zinc-800/50 hover:border-[#00bcd4]/50 hover:text-[#00bcd4] rounded-xl flex items-center justify-center text-zinc-500 flex-col gap-2 cursor-pointer transition-colors group">
            <Upload size={20} className="group-hover:-translate-y-1 transition-transform" />
            <span className="text-xs">点击上传文件</span>
            <input 
              type="file" 
              accept="video/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  if (data.onUpload) data.onUpload(id, url, 'video');
                }
              }} 
            />
          </label>
        )}
        <Handle type="source" position={Position.Right} className={handleStyle} />
      </div>
    </>
  );
};

const AIGenNode = ({ data, id, selected }: any) => {
  return (
    <div className={`${nodeBg} border-[1.5px] ${selected ? selectedBorder : "border-[#00bcd4]/30"} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow min-w-[240px] max-w-[320px]`}>
      <Handle type="target" position={Position.Left} className={handleStyle} />
      <div className="flex items-center gap-2 mb-3 text-[#00bcd4] pb-2">
        <BrainCircuit size={14} />
        <span className="text-xs font-semibold tracking-wide">{data.title || 'AI 处理流'}</span>
      </div>
      <div className="space-y-3">
        <div className="text-xs text-zinc-400 leading-relaxed">{data.description}</div>
        <button 
          onClick={() => data.onRun(id)}
          disabled={data.isGenerating}
          className="w-full py-2 bg-[#00bcd4]/10 hover:bg-[#00bcd4]/20 text-[#00bcd4] border border-[#00bcd4]/30 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
        >
          {data.isGenerating ? (
            <span className="animate-pulse">处理中...</span>
          ) : (
            <>
              <Play size={14} />
              执行运算
            </>
          )}
        </button>
      </div>
      <Handle type="source" position={Position.Right} className={handleStyle} />
    </div>
  );
};

const ResultNode = ({ data, id, selected }: any) => {
  return (
    <div className={`${nodeBg} border-[1.5px] ${selected ? "border-green-500" : "border-green-500/30"} rounded-2xl p-4 shadow-sm hover:shadow-[0_0_15px_rgba(34,197,94,0.15)] transition-shadow min-w-[240px] max-w-[320px]`}>
      <Handle type="target" position={Position.Left} className={handleStyle} />
      <div className="flex items-center gap-2 mb-3 text-green-500 pb-2">
        <BrainCircuit size={14} />
        <span className="text-xs font-semibold tracking-wide">结果节点</span>
      </div>
      <div className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
        {data.content || '等待生成结果...'}
      </div>
      <Handle type="source" position={Position.Right} className={handleStyle} />
    </div>
  );
};

const AudioNode = ({ data, id, selected }: any) => {
  return (
    <>
      <NodeResizer color="#00bcd4" handleClassName={resizerHandleStyle} minWidth={280} minHeight={120} isVisible={selected} />
      <div className={`${nodeBg} border-[1.5px] ${selected ? selectedBorder : defaultBorder} rounded-2xl p-2 shadow-sm hover:shadow-md transition-shadow min-w-[280px] w-full h-full flex flex-col`}>
        <Handle type="target" position={Position.Left} className={handleStyle} />
        <div className="flex items-center gap-2 px-2 py-2 text-zinc-400">
          <AudioLines size={14} className={selected ? "text-[#00bcd4]" : ""} />
          <span className="text-xs font-semibold tracking-wide">音频</span>
        </div>
        {data.audioUrl ? (
          <div className="rounded-xl overflow-hidden border border-zinc-800/50 p-2 flex-1 flex items-center justify-center">
            <audio src={data.audioUrl} controls className="w-full" />
          </div>
        ) : (
          <label className="w-full flex-1 min-h-[60px] bg-zinc-900/50 hover:bg-zinc-800/50 border border-dashed border-zinc-800/50 hover:border-[#00bcd4]/50 hover:text-[#00bcd4] rounded-xl flex items-center justify-center text-zinc-500 flex-col gap-2 cursor-pointer transition-colors group">
            <Upload size={16} className="group-hover:-translate-y-1 transition-transform" />
            <span className="text-[10px]">点击上传文件</span>
            <input 
              type="file" 
              accept="audio/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  if (data.onUpload) data.onUpload(id, url, 'audio');
                }
              }} 
            />
          </label>
        )}
        <Handle type="source" position={Position.Right} className={handleStyle} />
      </div>
    </>
  );
};

const ScriptNode = ({ data, id, selected }: any) => {
  const [activeTab, setActiveTab] = React.useState('overview');

  const tabs = [
    { id: 'overview', label: '总览' },
    { id: 'scenes', label: '场次' },
    { id: 'characters', label: '人物' },
    { id: 'locations', label: '场景' },
    { id: 'props', label: '道具' },
    { id: 'beats', label: '节拍 & 动作' },
    { id: 'risks', label: '连贯性与风险' },
  ];

  return (
    <>
      <NodeResizer color="#00bcd4" handleClassName={resizerHandleStyle} minWidth={440} minHeight={350} isVisible={selected} />
      <div className={`${nodeBg} border-[1.5px] ${selected ? selectedBorder : defaultBorder} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow min-w-[440px] w-full h-full flex flex-col relative`}>
        <Handle type="target" position={Position.Left} className={handleStyle} />
        <div className="flex items-center justify-between mb-3 text-zinc-400 pb-2 border-b border-zinc-800/50 shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={14} className={selected ? "text-[#00bcd4]" : ""} />
            <span className="text-xs font-semibold tracking-wide flex-1 text-[#00bcd4]">剧本拆解工作台</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); if(data.onReBreakdown) data.onReBreakdown(id); }} className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800/50 hover:bg-zinc-700/80 rounded transition-colors text-zinc-400 hover:text-white border border-zinc-700">
            {data.isGenerating ? <RefreshCw size={12} className="animate-spin text-[#00bcd4]" /> : <RefreshCw size={12} />}
            <span className="text-[10px]">重新拆解</span>
          </button>
        </div>
        {data.isGenerating && (
          <div className="absolute inset-0 z-50 bg-[#111214]/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3">
             <RefreshCw className="animate-spin text-[#00bcd4]" size={24} />
             <div className="text-sm font-medium text-[#00bcd4] animate-pulse">AI 正在深度拆解剧本...</div>
          </div>
        )}
        
        {data.breakdown ? (
          <div className="flex flex-col flex-1 h-full overflow-hidden border border-zinc-800/50 rounded-lg">
            {/* Tabs Header */}
            <div className="flex items-center gap-1 overflow-x-auto p-1 border-b border-zinc-800/50 bg-zinc-900/80 shrink-0 scrollbar-hide">
              {tabs.map(tab => (
                <button 
                  key={tab.id}
                  onClick={(e) => { e.stopPropagation(); setActiveTab(tab.id); }}
                  className={`px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-zinc-800 text-[#00bcd4] font-medium' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-auto bg-zinc-900/50 p-3 pr-2 custom-scrollbar text-xs text-zinc-300">
              {activeTab === 'overview' && (
                <div className="flex flex-col gap-3">
                  <div className="text-[#00bcd4] font-medium text-sm mb-1">{data.breakdown.overview.title}</div>
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="text-zinc-500">主题/主旨:</span><span>{data.breakdown.overview.theme}</span>
                    <span className="text-zinc-500">时空背景:</span><span>{data.breakdown.overview.timePeriod}</span>
                    <span className="text-zinc-500">情绪基调:</span><span>{data.breakdown.overview.overallMood}</span>
                  </div>
                  <div className="mt-2 text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-3">
                    <span className="text-zinc-500 block mb-1">剧情梗概:</span>
                    {data.breakdown.overview.synopsis}
                  </div>
                </div>
              )}

              {activeTab === 'scenes' && (
                <div className="flex flex-col gap-4">
                  {data.breakdown.scenes.map((scene: any, idx: number) => (
                    <div key={idx} className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-800/50">
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800/50">
                        <span className="text-[#00bcd4] font-medium">场次 {scene.sceneNo}: {scene.name}</span>
                        <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{scene.setting} · {scene.time}</span>
                      </div>
                      <div className="grid grid-cols-[60px_1fr] gap-y-1.5 gap-x-2 text-[11px]">
                        <span className="text-zinc-500">地点:</span><span>{scene.location}</span>
                        <span className="text-zinc-500">人物:</span><span>{scene.characters.join('、')}</span>
                        <span className="text-zinc-500">事件:</span><span>{scene.events}</span>
                        <span className="text-zinc-500">情绪:</span><span>{scene.mood}</span>
                        <span className="text-zinc-500">前后场:</span><span>{scene.relation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'characters' && (
                <div className="flex flex-col gap-4">
                  {data.breakdown.characters.map((char: any, idx: number) => (
                    <div key={idx} className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-800/50">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-800/50">
                        <span className="font-medium text-zinc-100">{char.name}</span>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">{char.role}</span>
                        <span className="text-[10px] text-zinc-500">{char.ageGroup}</span>
                      </div>
                      <div className="grid grid-cols-[60px_1fr] gap-y-1.5 gap-x-2 text-[11px]">
                        <span className="text-zinc-500">外观:</span><span className="text-zinc-300">{char.appearance}</span>
                        <span className="text-zinc-500">状态:</span><span><span className="text-orange-400/80">当前: </span>{char.currentState} <span className="text-rose-400/80 ml-2">情绪: </span>{char.emotionalState}</span>
                        <span className="text-zinc-500">目标:</span><span className="text-emerald-400/80">{char.goal}</span>
                        <span className="text-zinc-500">关系:</span><span>{char.relationships}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'locations' && (
                <div className="flex flex-col gap-4">
                  {data.breakdown.locations.map((loc: any, idx: number) => (
                    <div key={idx} className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-800/50">
                      <div className="font-medium text-zinc-200 mb-2 pb-2 border-b border-zinc-800/50">{loc.name}</div>
                      <div className="grid grid-cols-[60px_1fr] gap-y-1.5 gap-x-2 text-[11px]">
                        <span className="text-zinc-500">空间类型:</span><span>{loc.spaceType}</span>
                        <span className="text-zinc-500">空间锚点:</span><span>{loc.spatialAnchors}</span>
                        <span className="text-zinc-500">门窗出入:</span><span>{loc.ports}</span>
                        <span className="text-zinc-500">家具构件:</span><span>{loc.furniture}</span>
                        <span className="text-zinc-500">光线氛围:</span><span>{loc.lighting} · {loc.atmosphere}</span>
                        <span className="text-zinc-500">状态变化:</span><span className="text-yellow-500/80">{loc.statusChange}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'props' && (
                <div className="grid grid-cols-1 gap-2">
                  {data.breakdown.props.map((prop: any, idx: number) => (
                    <div key={idx} className="bg-zinc-800/30 rounded-lg p-2.5 border border-zinc-800/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-amber-500">{prop.name}</span>
                        <span className="text-[10px] text-zinc-500">归属: {prop.owner}</span>
                      </div>
                      <div className="text-[10px] flex flex-col gap-1 mt-2 text-zinc-400">
                        <div className="flex gap-2"><span className="text-zinc-500 shrink-0">流转:</span> <span>初始{prop.initPosition} → {prop.appearTime}出现 → 离手于{prop.dropTime}</span></div>
                        <div className="flex gap-2"><span className="text-zinc-500 shrink-0">动作:</span> <span>{prop.usage}</span></div>
                        <div className="flex gap-2"><span className="text-zinc-500 shrink-0">续场:</span> <span>{prop.nextScene ? '进入下一场' : '本场结束'}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'beats' && (
                <div className="flex flex-col gap-4">
                  <div className="bg-zinc-800/30 p-2 rounded-lg border border-zinc-800/50">
                    <div className="text-xs text-zinc-400 font-medium mb-1.5 flex items-center gap-1.5"><ArrowUp size={12} className="rotate-90"/> 核心动作链</div>
                    <div className="text-[11px] text-[#00bcd4]">{data.breakdown.actionChain.join(' → ')}</div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-zinc-500 font-medium">Beats 拆解</div>
                    {data.breakdown.beats.map((beat: any, idx: number) => (
                      <div key={idx} className="bg-zinc-800/20 rounded-lg p-2.5 border-l-2 border-l-purple-500/50 border border-zinc-800/50 relative pl-4">
                        <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center -translate-x-1/2 opacity-30">
                          <div className="w-4 h-4 rounded-full bg-zinc-900 border-2 border-purple-500 flex items-center justify-center text-[8px] font-bold">{beat.beatNo}</div>
                        </div>
                        <div className="text-[10px] text-zinc-500 mb-1">属于: 场次 {beat.sceneNo}</div>
                        <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-200 mb-1">
                          <span>{beat.start}</span>
                          <span className="text-zinc-600">→</span>
                          <span>{beat.end}</span>
                        </div>
                        <div className="grid grid-cols-[50px_1fr] gap-y-1 gap-x-1 text-[10px] mt-1.5">
                          <span className="text-zinc-500">主要动作:</span><span className="text-zinc-300">{beat.action}</span>
                          <span className="text-zinc-500">情绪变化:</span><span className="text-rose-400/80">{beat.emotionChange}</span>
                          <span className="text-zinc-500">视觉重点:</span><span className="text-[#00bcd4]">{beat.visualFocus}</span>
                          <span className="text-zinc-500">台词承载:</span><span className="text-zinc-400">{beat.dialogueLoad}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'risks' && (
                <div className="flex flex-col gap-2">
                  {data.breakdown.continuityRisks.map((risk: string, idx: number) => (
                    <div key={idx} className="flex gap-2 bg-rose-500/5 border border-rose-500/20 rounded-lg p-2.5 text-[11px]">
                      <div className="text-rose-500 shrink-0 mt-0.5"><Zap size={12} /></div>
                      <span className="text-zinc-300">{risk}</span>
                    </div>
                  ))}
                  {(!data.breakdown.continuityRisks || data.breakdown.continuityRisks.length === 0) && (
                    <div className="text-zinc-500 text-center py-4">暂无发现明显连贯性风险</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3 overflow-auto flex-1 h-full mb-3 text-zinc-300 text-xs">
            {data.script ? (
              <table className="w-full text-left">
                <thead className="text-zinc-500 border-b border-zinc-800/50 sticky top-0 bg-zinc-900/90 backdrop-blur">
                  <tr>
                    <th className="pb-2 font-medium w-12">镜号</th>
                    <th className="pb-2 font-medium">画面描述</th>
                    <th className="pb-2 font-medium w-16">景别</th>
                  </tr>
                </thead>
                <tbody>
                  {data.script.map((row: any, i: number) => (
                    <tr key={i} className="border-b border-zinc-800/20 last:border-0 hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2 text-zinc-500 align-top">{i + 1}</td>
                      <td className="py-2 pr-2 align-top">{row.description}</td>
                      <td className="py-2 text-zinc-500 align-top">{row.shotType || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 flex-col gap-2">
                <span className="text-xs">拆解内容为空</span>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-zinc-800/50 shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); if (data.onConfirmBreakdown) data.onConfirmBreakdown(id); }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00bcd4]/15 hover:bg-[#00bcd4]/30 text-[#00bcd4] rounded-lg text-xs font-medium transition-all border border-[#00bcd4]/40 hover:scale-[1.02] shadow-[0_0_10px_rgba(0,188,212,0.2)]"
          >
            <CheckCircle size={14} />
            <span>确认拆解结果</span>
          </button>
        </div>
        <Handle type="source" position={Position.Right} className={handleStyle} />
      </div>
    </>
  );
};

const AssetGroupNode = ({ data, id, selected }: any) => {
  const isTextOnly = data.type === 'textOnly';
  
  return (
    <>
      <NodeResizer color="#00bcd4" handleClassName={resizerHandleStyle} minWidth={380} minHeight={200} isVisible={selected} />
      <div className={`${nodeBg} border-[1.5px] ${selected ? selectedBorder : defaultBorder} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow min-w-[380px] w-full h-full flex flex-col relative`}>
        <Handle type="target" position={Position.Left} className={handleStyle} />
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/50">
          <div className="flex items-center gap-2 text-zinc-400">
            <Box size={14} className={selected ? "text-[#00bcd4]" : ""} />
            <span className="text-xs font-semibold tracking-wide">{data.title} ({data.assets?.length || 0})</span>
          </div>
          {!isTextOnly && data.assets && data.assets.length > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); if (data.onGenerateAll) data.onGenerateAll(id); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00bcd4]/10 hover:bg-[#00bcd4]/20 text-[#00bcd4] rounded-lg text-xs transition-colors border border-[#00bcd4]/30"
            >
              <Sparkles size={12} />
              <span>全部生成</span>
            </button>
          )}
        </div>
        
        {!isTextOnly && (
          <div className="mb-3">
             <textarea 
               className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-2 text-[11px] text-zinc-300 resize-none outline-none focus:border-[#00bcd4]/50 custom-scrollbar"
               placeholder={`统一定义${data.title}的专属Prompt指令 (可选)...`}
               rows={2}
               value={data.prompt || ''}
               onChange={(e) => {
                 if (data.onUpdateGroupPrompt) data.onUpdateGroupPrompt(id, e.target.value);
               }}
               onPointerDown={(e) => e.stopPropagation()}
             />
          </div>
        )}

        <div className={`${isTextOnly ? 'flex flex-col gap-2' : 'grid grid-cols-2 lg:grid-cols-3 gap-3'} overflow-y-auto flex-1 h-full pr-1 custom-scrollbar`}>
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
                        <span className="text-[10px]">点击生成</span>
                      </button>
                    </div>
                  )}
                  <Handle 
                    type="source" 
                    position={Position.Right} 
                    id={`asset-${idx}`}
                    className="!w-3 !h-3 !bg-[#00bcd4] !border-2 !border-[#111214] opacity-0 group-hover:opacity-100 transition-opacity" 
                    style={{ top: '50%', right: -6 }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
        {!isTextOnly && <Handle type="source" position={Position.Right} className={handleStyle} />}
      </div>
    </>
  );
};

const nodeTypes = {
  textNode: TextNode,
  imageNode: ImageNode,
  videoNode: VideoNode,
  audioNode: AudioNode,
  scriptNode: ScriptNode,
  aiGenNode: AIGenNode,
  resultNode: ResultNode,
  assetGroupNode: AssetGroupNode,
};

const AnimatedEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: any) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge path={edgePath} style={{ ...style, strokeDasharray: 'none', opacity: 0.5 }} markerEnd={markerEnd} />
      <BaseEdge path={edgePath} style={style} className="animated-edge-path" />
    </>
  );
};

const edgeTypes = {
  animated: AnimatedEdge,
};

function Canvas() {
  const { getNode } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [menu, setMenu] = useState<{ id: string; top: number; left: number, type?: 'node' | 'pane' | 'add-node' | 'add-connected-node', sourceNodeId?: string, nodeType?: string } | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [clipboard, setClipboard] = useState<{ type: 'node' | 'image', data: any } | null>(null);
  const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });
  const [activeSidebarPopover, setActiveSidebarPopover] = useState<'add' | 'assets' | null>(null);
  const [activeRightPanel, setActiveRightPanel] = useState<{ type: string, nodeId: string } | null>(null);

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 2500);
  }, []);

  const handleSaveProject = useCallback(() => {
    const projectData = { nodes, edges };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('项目已下载');
  }, [nodes, edges, showToast]);

  const handleLoadProject = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.nodes && data.edges) {
            setNodes(data.nodes);
            setEdges(data.edges);
            showToast('项目已读取');
          } else {
            showToast('无效的项目文件');
          }
        } catch(err) {
          showToast('读取项目失败');
        }
      };
      reader.readAsText(file);
    }
  }, [setNodes, setEdges, showToast]);

  const handleNewProject = useCallback(() => {
    if (confirm("确定要新建项目吗？未保存的内容将丢失。")) {
      setNodes([]);
      setEdges([]);
      showToast('已新建项目');
    }
  }, [setNodes, setEdges, showToast]);

  const handleOpenGenerate = useCallback(async (nodeId: string) => {
    // setActiveRightPanel({ type: 'i2i', nodeId });
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const incomingEdges = edges.filter((e: any) => e.target === nodeId);
    const referenceNodes = incomingEdges.map((e: any) => nodes.find((n: any) => n.id === e.source)).filter(Boolean);
    const referenceImages = referenceNodes.filter((n: any) => n?.type === 'imageNode' && n?.data?.imageUrl);
    const referenceTexts = referenceNodes.filter((n: any) => n?.type === 'textNode' && n?.data?.text).map((n: any) => n.data.text);

    const refImage = referenceImages.length > 0 ? referenceImages[0].data.imageUrl : undefined;
    let prompt = node.data.prompt || "Generate a beautiful scenery";
    if (referenceTexts.length > 0) {
      prompt = referenceTexts.join('\n') + '\n\n' + prompt;
    }

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return { ...n, data: { ...n.data, isGenerating: true } };
        }
        return n;
      })
    );

    try {
      showToast('Generating image...');
      const generatedImageUrl = await runImageGeneration(prompt, refImage);
      
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            const currentThumbnails = n.data.thumbnails || [];
            if (n.data.imageUrl && !currentThumbnails.includes(n.data.imageUrl)) {
              currentThumbnails.push(n.data.imageUrl);
            }
            if (!currentThumbnails.includes(generatedImageUrl)) {
              currentThumbnails.push(generatedImageUrl);
            }
            return {
              ...n,
              data: {
                ...n.data,
                imageUrl: generatedImageUrl,
                thumbnails: currentThumbnails,
                isGenerating: false,
              },
            };
          }
          return n;
        })
      );
      showToast('Image generated successfully!');
    } catch (error: any) {
      console.error(error);
      showToast('Error generating image: ' + error.message);
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            return { ...n, data: { ...n.data, isGenerating: false } };
          }
          return n;
        })
      );
    }

  }, [nodes, edges, setNodes, showToast]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
      ...params, 
      type: 'animated',
      animated: true, 
      style: { stroke: '#00bcd4', strokeWidth: 2.5, filter: 'drop-shadow(0 0 8px rgba(0,188,212,0.8))' }
    }, eds)),
    [setEdges],
  );

  const handleImageAction = useCallback((id: string, action: string, payload?: any) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    if (action === 'download') {
      if (node.data.imageUrl) {
        const a = document.createElement('a');
        a.href = node.data.imageUrl;
        a.download = `image-${id}.png`;
        a.click();
        showToast('图片开始下载');
      } else {
        showToast('无可用图片下载');
      }
      return;
    }

    if (action === 'rotate') {
      updateNodeData(id, 'rotation', !node.data.rotation);
      return;
    }

    if (action === 'select-thumbnail') {
      updateNodeData(id, 'imageUrl', payload);
      return;
    }

    if (action === 'annotate') {
      showToast('进入标注模式...');
      return;
    }

    // For generative actions: panorama, multi-angle, relight, 9grid-*, hd-*, split-*
    // We simulate creating a new version or node.
    updateNodeData(id, 'isGenerating', true);
    
    setTimeout(() => {
      updateNodeData(id, 'isGenerating', false);
      const newNodeId = `image-${Date.now()}`;
      
      let title = '';
      if (action.startsWith('9grid')) title = '九宫格结果';
      else if (action.startsWith('hd')) title = '高清处理结果';
      else if (action.startsWith('split')) title = '切分结果';
      else if (action === 'panorama') title = '全景图';
      else if (action === 'multi-angle') title = '多角度';
      else if (action === 'relight') title = '打光衍生';

      const newNode = {
        id: newNodeId,
        type: 'imageNode',
        position: { x: node.position.x + 350, y: node.position.y },
        style: { width: 320, height: 320 },
        data: { 
          imageUrl: node.data.imageUrl, 
          title,
          onAction: handleImageAction,
          onUpload: handleNodeFileUpload,
          onGenerate: handleOpenGenerate
        },
      };
      setNodes(nds => [...nds, newNode]);
      setEdges(eds => [...eds, { id: `e-${id}-${newNodeId}`, source: id, target: newNodeId, animated: true, style: { stroke: '#00bcd4' } }]);
      showToast(`${title}生成完毕`);
    }, 1500);
  }, [nodes, setNodes, setEdges, showToast]);

  const updateNodeData = useCallback((id: string, key: string, value: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, [key]: value } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const handleTextChange = useCallback((id: string, text: string) => {
    updateNodeData(id, 'text', text);
  }, [updateNodeData]);

  const handleImageChange = useCallback((id: string, key: string, value: any) => {
    updateNodeData(id, key, value);
  }, [updateNodeData]);

  const handleContextMenuAction = useCallback((action: string) => {
    if (!menu || menu.type !== 'node') {
      setMenu(null);
      return;
    }
    const nodeId = menu.id;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      setMenu(null);
      return;
    }

    switch (action) {
      case 'save-asset':
        showToast('已保存到我的素材库');
        break;
      case 'enter-panorama':
        showToast('正在进入全景预览...');
        break;
      case 'create-subject':
        showToast('已提取并创建主体资源');
        break;
      case 'optimize-layout':
        showToast('工作流布局已优化');
        // Simple mock: just space out connected nodes
        break;
      case 'copy-node':
        setClipboard({ type: 'node', data: node });
        showToast('节点已复制');
        break;
      case 'copy-image':
        if (node.data?.imageUrl) {
          setClipboard({ type: 'image', data: node.data.imageUrl });
          showToast('图片资源已复制');
        } else {
          showToast('该节点没有图片');
        }
        break;
      case 'duplicate': {
        const newNodeId = `${node.type}-${Date.now()}`;
        const newNode = {
          ...node,
          id: newNodeId,
          position: { x: node.position.x + 50, y: node.position.y + 50 }
        };
        setNodes(nds => [...nds, newNode]);
        showToast('已创建副本');
        break;
      }
      case 'paste': {
        if (clipboard) {
          if (clipboard.type === 'node') {
            const newNodeId = `${clipboard.data.type}-${Date.now()}`;
            const newNode = {
              ...clipboard.data,
              id: newNodeId,
              position: { x: node.position.x + 50, y: node.position.y + 50 }
            };
            setNodes(nds => [...nds, newNode]);
            showToast('已粘贴节点');
          } else if (clipboard.type === 'image') {
            const newNodeId = `image-${Date.now()}`;
            const newNode = {
              id: newNodeId,
              type: 'imageNode',
              position: { x: node.position.x + 50, y: node.position.y + 50 },
              style: { width: 320, height: 320 },
              data: { imageUrl: clipboard.data, onAction: handleImageAction, onUpload: handleNodeFileUpload, onGenerate: handleOpenGenerate }
            };
            setNodes(nds => [...nds, newNode]);
            showToast('已粘贴图片');
          }
        } else {
          showToast('剪贴板为空');
        }
        break;
      }
      case 'delete':
        setNodes(nds => nds.filter(n => n.id !== nodeId));
        setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
        showToast('节点已删除');
        break;
      case 'copy-clipboard':
        const contentToCopy = node.data.imageUrl || node.data.text || node.data.content || JSON.stringify(node.data);
        navigator.clipboard.writeText(contentToCopy || '').then(() => {
          showToast('已复制到系统剪贴板');
        }).catch(() => {
          showToast('复制到剪贴板失败');
        });
        break;
      default:
        break;
    }
    setMenu(null);
  }, [menu, nodes, setNodes, setEdges, showToast, setClipboard]);

  const handlePaneContextMenuAction = useCallback((action: string) => {
    if (!menu || menu.type !== 'pane') {
      setMenu(null);
      return;
    }
    if (action === 'paste' && clipboard) {
      if (clipboard.type === 'node') {
        const newNodeId = `${clipboard.data.type}-${Date.now()}`;
        const newNode = {
          ...clipboard.data,
          id: newNodeId,
          position: { x: menu.left, y: menu.top }
        };
        setNodes(nds => [...nds, newNode]);
        showToast('已粘贴节点');
      } else if (clipboard.type === 'image') {
        const newNodeId = `image-${Date.now()}`;
        const newNode = {
          id: newNodeId,
          type: 'imageNode',
          position: { x: menu.left, y: menu.top },
          style: { width: 320, height: 320 },
          data: { imageUrl: clipboard.data, onAction: handleImageAction, onUpload: handleNodeFileUpload, onGenerate: handleOpenGenerate }
        };
        setNodes(nds => [...nds, newNode]);
        showToast('已粘贴图片');
      }
    }
    setMenu(null);
  }, [menu, clipboard, setNodes, showToast, handleImageAction]);

  const runAIGeneration = useCallback(async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Find incoming edges to get input data
    const incomingEdges = edges.filter(e => e.target === nodeId);
    const inputNodes = incomingEdges.map(e => nodes.find(n => n.id === e.source)).filter(Boolean);

    updateNodeData(nodeId, 'isGenerating', true);

    try {
      if (node.data.type === 'text2image') {
        const textInput = inputNodes.find(n => n?.type === 'textNode')?.data.text;
        if (!textInput) throw new Error("Requires text input");
        
        const ai = getAIClient();
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: textInput,
        });
        
        let imageUrl = '';
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
        
        if (imageUrl) {
          // Create a new image node connected to this AI node
          const newNodeId = `image-${Date.now()}`;
          const newNode = {
            id: newNodeId,
            type: 'imageNode',
            position: { x: node.position.x, y: node.position.y + 200 },
            style: { width: 320, height: 320 },
            data: { imageUrl, onAction: handleImageAction, onUpload: handleNodeFileUpload, onGenerate: handleOpenGenerate },
          };
          setNodes(nds => [...nds, newNode]);
          setEdges(eds => [...eds, { id: `e-${nodeId}-${newNodeId}`, source: nodeId, target: newNodeId, animated: true }]);
        }
      } else if (node.data.type === 'image2prompt') {
        const imageInput = inputNodes.find(n => n?.type === 'imageNode')?.data.imageUrl;
        if (!imageInput) throw new Error("Requires image input");
        
        const base64Data = imageInput.split(',')[1];
        const mimeType = imageInput.split(';')[0].split(':')[1];
        
        const ai = getAIClient();
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            { inlineData: { data: base64Data, mimeType } },
            "Analyze the style, composition, lighting, and subject of this image. Generate a highly detailed, comma-separated prompt that could be used to recreate this image or generate something in the exact same style. Focus on visual keywords."
          ]
        });
        
        const promptText = response.text;
        
        // Create a new text node
        const newNodeId = `text-${Date.now()}`;
        const newNode = {
          id: newNodeId,
          type: 'textNode',
          position: { x: node.position.x, y: node.position.y + 200 },
          style: { width: 320, height: 180 },
          data: { text: promptText, onChange: handleTextChange },
        };
        setNodes(nds => [...nds, newNode]);
        setEdges(eds => [...eds, { id: `e-${nodeId}-${newNodeId}`, source: nodeId, target: newNodeId, animated: true }]);
      } else if (node.data.type === 'autoStoryboard') {
        const imageInput = inputNodes.find(n => n?.type === 'imageNode')?.data.imageUrl;
        if (!imageInput) throw new Error("Requires image input");
        
        // Simulate storyboard generation (in reality, would call AI to generate 9 images or a grid)
        // For demonstration, we'll just create a text node describing the storyboard
        const base64Data = imageInput.split(',')[1];
        const mimeType = imageInput.split(';')[0].split(':')[1];
        
        const ai = getAIClient();
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            { inlineData: { data: base64Data, mimeType } },
            "Based on this image, generate a 9-grid storyboard description. For each of the 9 shots, describe the shot type (e.g., Close-up, Wide shot), angle, and action. Format as a numbered list 1-9."
          ]
        });
        
        const newNodeId = `text-${Date.now()}`;
        const newNode = {
          id: newNodeId,
          type: 'textNode',
          position: { x: node.position.x, y: node.position.y + 200 },
          style: { width: 320, height: 180 },
          data: { text: response.text, onChange: handleTextChange },
        };
        setNodes(nds => [...nds, newNode]);
        setEdges(eds => [...eds, { id: `e-${nodeId}-${newNodeId}`, source: nodeId, target: newNodeId, animated: true }]);
      }
    } catch (error: any) {
      console.error("AI Generation failed:", error);
      alert(`Generation failed: ${error.message}`);
    } finally {
      updateNodeData(nodeId, 'isGenerating', false);
    }
  }, [nodes, edges, setNodes, setEdges, updateNodeData, handleTextChange]);

  const handleNodeFileUpload = useCallback((nodeId: string, url: string, fileType: 'image' | 'video' | 'audio') => {
    setNodes(nds => nds.map(n => {
      if (n.id === nodeId) {
        if (fileType === 'image') return { ...n, data: { ...n.data, imageUrl: url } };
        if (fileType === 'video') return { ...n, data: { ...n.data, videoUrl: url } };
        if (fileType === 'audio') return { ...n, data: { ...n.data, audioUrl: url } };
      }
      return n;
    }));
  }, [setNodes]);


  const handleConfirmBreakdown = useCallback((nodeId: string) => {
    setNodes(nds => {
      const node = nds.find(n => n.id === nodeId);
      if (!node || !node.data.breakdown) {
        showToast('无法确认：未找到拆解数据');
        return nds;
      }
      
      const bd = node.data.breakdown;

      const generateSingleAsset = (groupId: string, itemIdx: number) => {
        setNodes(currNds => currNds.map(n => {
          if (n.id === groupId) {
            const newAssets = [...(n.data.assets || [])];
            newAssets[itemIdx] = { ...newAssets[itemIdx], isGenerating: true };
            return { ...n, data: { ...n.data, assets: newAssets } };
          }
          return n;
        }));
        setTimeout(() => {
          setNodes(currNds => currNds.map(n => {
            if (n.id === groupId) {
              const newAssets = [...(n.data.assets || [])];
              newAssets[itemIdx] = { 
                ...newAssets[itemIdx], 
                isGenerating: false,
                imageUrl: `https://images.unsplash.com/photo-${Math.floor(1500000000000 + Math.random() * 100000000000)}?auto=format&fit=crop&q=80&w=400&h=400`
              };
              return { ...n, data: { ...n.data, assets: newAssets } };
            }
            return n;
          }));
        }, 2000);
      };

      const generateAllAssets = (groupId: string) => {
        setNodes(currNds => currNds.map(n => {
          if (n.id === groupId) {
            const newAssets = (n.data.assets || []).map((a: any) => ({ ...a, isGenerating: !a.imageUrl }));
            return { ...n, data: { ...n.data, assets: newAssets } };
          }
          return n;
        }));
        setTimeout(() => {
          setNodes(currNds => currNds.map(n => {
            if (n.id === groupId) {
              const newAssets = (n.data.assets || []).map((a: any) => {
                 if (!a.imageUrl) {
                   return {
                     ...a, 
                     isGenerating: false,
                     imageUrl: `https://images.unsplash.com/photo-${Math.floor(1500000000000 + Math.random() * 100000000000)}?auto=format&fit=crop&q=80&w=400&h=400`
                   };
                 }
                 return a;
              });
              return { ...n, data: { ...n.data, assets: newAssets } };
            }
            return n;
          }));
        }, 2500);
      };

      const handleUpdateAssetDescription = (groupId: string, itemIdx: number, newDesc: string) => {
        setNodes(currNds => currNds.map(n => {
          if (n.id === groupId) {
            const newAssets = [...(n.data.assets || [])];
            newAssets[itemIdx] = { ...newAssets[itemIdx], description: newDesc };
            return { ...n, data: { ...n.data, assets: newAssets } };
          }
          return n;
        }));
      };

      const handleUpdateGroupPrompt = (groupId: string, newPrompt: string) => {
        setNodes(currNds => currNds.map(n => {
          if (n.id === groupId) {
            return { ...n, data: { ...n.data, prompt: newPrompt } };
          }
          return n;
        }));
      };

      const characters = {
        title: '人物列表',
        assets: bd.characters.map((c: any) => ({ name: c.name, description: c.appearance + ' | ' + c.role }))
      };
      const scenes = {
        title: '场次列表',
        assets: bd.scenes.map((s: any) => ({ name: `场次 ${s.sceneNo}: ${s.name}`, description: s.setting + ' · ' + s.time + ' | ' + s.events }))
      };
      const locations = {
        title: '场景列表',
        assets: bd.locations.map((l: any) => ({ name: l.name, description: l.spaceType + ' | ' + l.atmosphere }))
      };
      const props = {
        title: '道具列表',
        assets: bd.props.map((p: any) => ({ name: p.name, description: p.usage + (p.owner ? ` (归属: ${p.owner})` : '') }))
      };
      const beats = {
        title: 'Beats列表',
        assets: bd.beats.map((b: any) => ({ name: `Beat ${b.beatNo} (场次 ${b.sceneNo})`, description: b.action + ' | 情绪: ' + b.emotionChange }))
      };

      const groups = [
        { ...scenes, type: 'textOnly' }, 
        { ...characters, type: 'generative' }, 
        { ...locations, type: 'generative' }, 
        { ...props, type: 'generative' }, 
        { ...beats, type: 'textOnly' },
        { 
          title: '连贯性与风险', 
          type: 'textOnly', 
          assets: bd.continuityRisks && bd.continuityRisks.length > 0 
            ? bd.continuityRisks.map((r: string) => ({name: '风险提示', description: r})) 
            : [{name: '无重大风险', description: 'AI分析未发现明显逻辑漏洞'}] 
        }
      ];
      
      const newNodes = groups.map((g, index) => {
        const groupId = `assetGroup-${Date.now()}-${index}`;
        return {
          id: groupId,
          type: 'assetGroupNode',
          position: { x: node.position.x + 550, y: node.position.y + (index * 260) - 200 },
          data: { 
            title: g.title,
            type: g.type,
            assets: g.assets,
            onGenerateSingle: generateSingleAsset,
            onGenerateAll: generateAllAssets,
            onUpdateAssetDescription: handleUpdateAssetDescription,
            onUpdateGroupPrompt: handleUpdateGroupPrompt
          }
        };
      });

      setEdges(eds => [
        ...eds, 
        ...newNodes.map(n => ({
          id: `e-${nodeId}-${n.id}`,
          source: nodeId,
          target: n.id,
          animated: true,
          style: { stroke: '#00bcd4', strokeWidth: 2, opacity: 0.5 }
        }))
      ]);

      showToast('已确认拆解结果并生成分类面板');
      return [...nds, ...newNodes];
    });
  }, [setNodes, setEdges, showToast]);

  const handleReBreakdown = useCallback((nodeId: string) => {
    showToast('已申请重新拆解，AI 正在分析...');
    updateNodeData(nodeId, 'isGenerating', true);
    setTimeout(() => {
      showToast('重新拆解完成');
      updateNodeData(nodeId, 'isGenerating', false);
    }, 2000);
  }, [updateNodeData, showToast]);

  const addNode = (type: string, aiType?: string, pos?: { x: number, y: number }, sourceNodeId?: string, extraParams?: any) => {
    const id = `${type}-${Date.now()}`;
    const position = pos || { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 };
    
    // Auto-generate script audit
    if (aiType && aiType.startsWith('script-review') && sourceNodeId) {
      const reviewTypeMap: Record<string, string> = {
        'script-review-full': 'full',
        'script-review-scene': 'scene',
        'script-review-beat': 'beat',
        'script-review-repair': 'repair'
      };
      
      const rType = reviewTypeMap[aiType] as any;
      if (!rType) return;
      
      showToast('AI 正在审核剧本...');
      updateNodeData(sourceNodeId, 'isGenerating', true);
      
      const sourceNode = getNode(sourceNodeId);
      const scriptText = sourceNode?.data?.text || "Unknown Script";

      let prevContext = "";
      let nextContext = "";
      let problem = extraParams?.problem || "";
      let reviewOptions = extraParams?.reviewOptions;
      
      if (rType === 'scene') {
        prevContext = prompt("请输入上一场摘要（选填/取消则为空）：") || "";
        nextContext = prompt("请输入下一场摘要（选填/取消则为空）：") || "";
      } else if (rType === 'repair' && !problem) {
        problem = prompt("请输入您发现的具体问题：") || "";
        if (!problem) {
          showToast("已取消维修");
          updateNodeData(sourceNodeId, 'isGenerating', false);
          return;
        }
      }

      runScriptReview(rType, { text: scriptText, prevContext, nextContext, problem, reviewOptions })
        .then((analysis) => {
          updateNodeData(sourceNodeId, 'isGenerating', false);
          
          let resultText = "";
          if (rType === 'repair') {
            resultText = `【返修对象】\n${analysis.target || ''}\n\n【问题原因】\n${analysis.problemCause || ''}\n\n【修复后文本】\n${analysis.repairedText || ''}\n\n【需确认事项】\n${analysis.requiresConfirmation || '无'}`;
          } else {
            resultText = `【诊断报告】\n${analysis.diagnosticReport || ''}\n\n【修复策略】\n${analysis.fixingStrategy || ''}\n\n【机读剧本】\n${analysis.aiReadyScript || ''}\n\n【需确认事项】\n${analysis.requiresConfirmation || '无'}`;
          }

          const newNode = { 
            id, 
            type: 'textNode', 
            position: { x: position.x + 350, y: position.y }, 
            style: { width: 440, height: 600 }, 
            data: { 
              text: resultText,
              isReviewResult: true,
              sourceId: sourceNodeId,
              reviewType: rType,
              problem: problem,
              repairedText: analysis.repairedText || analysis.aiReadyScript,
              onChange: handleTextChange, 
              onAddNode: addNode,
              onApplyRepair: (origId: string, repaired: string) => {
                setNodes(currNds => currNds.map(n => {
                  if (n.id === origId) {
                    return { ...n, data: { ...n.data, text: repaired } };
                  }
                  return n;
                }));
                showToast("已将修复文本应用到原节点");
              }
            } 
          };
          
          setNodes(nds => [...nds, newNode]);
          setEdges(eds => [...eds, {
            id: `e-${sourceNodeId}-${id}`,
            source: sourceNodeId,
            target: id,
            animated: true,
            style: { stroke: '#e11d48', strokeWidth: 2 } // rose-600
          }]);
          showToast('剧本审核完成');
        })
        .catch(err => {
          updateNodeData(sourceNodeId, 'isGenerating', false);
          showToast('审核失败：' + err.message);
        });

      return;
    }

    // Auto-generate script breakdown
    if (aiType === 'director-breakdown' && sourceNodeId) {
      showToast('AI 正在拆解剧本...');
      updateNodeData(sourceNodeId, 'isGenerating', true);
      
      const sourceNode = getNode(sourceNodeId!);
      const scriptText = sourceNode?.data?.text || "Unknown Script";

      runMegaBreakdown(scriptText)
        .then((bd) => {
          updateNodeData(sourceNodeId, 'isGenerating', false);
          
          const mappedBreakdown = {
            overview: {
              title: "剧本总览",
              theme: bd.script_overview?.theme || "-",
              synopsis: bd.script_overview?.synopsis || "-",
              timePeriod: JSON.stringify(bd.script_overview?.time_space || []) || "-",
              overallMood: bd.script_overview?.tone || "-"
            },
            scenes: (bd.scenes || []).map((s: any) => ({
              sceneNo: s.scene_number || s.scene_id || "-",
              name: s.scene_name || "-",
              setting: s.interior_exterior || "-",
              time: s.time || "-",
              location: s.location_id || "-",
              characters: s.characters || [],
              events: s.key_event || "-",
              mood: s.emotion || "-",
              relation: s.previous_next_relation || "-"
            })),
            characters: (bd.characters || []).map((c: any) => ({
              name: c.name || "-",
              role: c.identity || "-",
              ageGroup: c.age_range || "-",
              appearance: c.appearance || "-",
              currentState: c.current_state || "-",
              emotionalState: c.psychology || "-",
              goal: c.goal || "-",
              relationships: JSON.stringify(c.relationships || [])
            })),
            locations: (bd.locations || []).map((l: any) => ({
              name: l.name || "-",
              spaceType: l.space_type || "-",
              spatialAnchors: JSON.stringify(l.anchors || []),
              ports: JSON.stringify(l.entrances_exits || {}),
              furniture: JSON.stringify(l.specific_components || []),
              lighting: l.lighting_atmosphere || "-",
              atmosphere: l.lighting_atmosphere || "-",
              statusChange: JSON.stringify(l.state_changes || [])
            })),
            props: (bd.props || []).map((p: any) => ({
              name: p.name || "-",
              owner: p.owner || "-",
              initPosition: p.initial_position || "-",
              appearTime: p.appearance_timing || "-",
              dropTime: p.release_timing || "-",
              usage: JSON.stringify(p.interactions || []),
              nextScene: JSON.stringify(p.scene_flow || [])
            })),
            actionChain: (bd.beats || []).map((b: any) => b.beat_summary || ""),
            beats: (bd.beats || []).map((b: any, index: number) => ({
              beatNo: index + 1,
              sceneNo: b.scene_id || "-",
              start: "Beat Start",
              end: "Beat End",
              action: JSON.stringify(b.action_chain || []),
              emotionChange: b.emotion || "-",
              visualFocus: b.visual_focus || "-",
              dialogueLoad: b.dialogue_load || "-"
            })),
            continuityRisks: (bd.continuity_risks || []).map((r: any) => 
               `[${r.risk_type}] ${r.description} (建议: ${r.suggested_fix})`
            )
          };

          const newNode = { 
            id, 
            type: 'scriptNode', 
            position, 
            style: { width: 480, height: 480 }, 
            data: { 
              breakdown: mappedBreakdown, 
              onConfirmBreakdown: handleConfirmBreakdown,
              onReBreakdown: handleReBreakdown,
              isGenerating: false,
              script: null,
              onAddNode: addNode 
            } 
          };
          
          setNodes(nds => [...nds, newNode]);
          setEdges(eds => [...eds, {
            id: `e-${sourceNodeId}-${id}`,
            source: sourceNodeId,
            target: id,
            animated: true,
            style: { stroke: '#00bcd4', strokeWidth: 2 }
          }]);
          showToast('剧本拆解完成');
        })
        .catch(err => {
          updateNodeData(sourceNodeId, 'isGenerating', false);
          showToast('拆解失败：' + err.message);
        });

      return;
    }

    // Auto-generate video from image
    if (aiType === 'generate-video' && typeof sourceNodeId === 'string') {
      showToast('AI 正在生成视频...');
      
      // We first create an empty generating video node to show some loading state
      const newNode: Node = { 
        id, 
        type: 'videoNode', 
        position: { x: position.x, y: position.y + 350 },
        style: { width: 360, height: 240 }, 
        data: { videoUrl: '', isGenerating: true, onUpload: handleNodeFileUpload, onAddNode: addNode } 
      };
      
      setNodes(nds => [...nds, newNode]);
      setEdges(eds => [...eds, {
        id: `e-${sourceNodeId}-${id}`,
        source: sourceNodeId,
        target: id,
        animated: true,
        style: { stroke: '#00bcd4', strokeWidth: 2 }
      }]);

      // Mock completion
      setTimeout(() => {
        setNodes(nds => nds.map(n => {
          if (n.id === id) {
             return {
               ...n,
               data: { 
                 ...n.data, 
                 isGenerating: false,
                 // Placeholder video URL (using a sample open source video)
                 videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4' 
               }
             };
          }
          return n;
        }));
        showToast('视频生成完成');
      }, 3000);
      return;
    }

    // Auto-generate frames from script
    if (aiType === 'generate-frames' && sourceNodeId) {
      showToast('AI 正在生成画面...');
      setTimeout(() => {
        const frames = [
          { image: 'https://images.unsplash.com/photo-1542157585-ef20bfcce579?auto=format&fit=crop&q=80&w=400&h=400', title: '镜号 1' },
          { image: 'https://images.unsplash.com/photo-1590483866874-5bebc2de714f?auto=format&fit=crop&q=80&w=400&h=400', title: '镜号 2' },
          { image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=400&h=400', title: '镜号 3' },
          { image: 'https://images.unsplash.com/photo-1517441589136-1c210518bead?auto=format&fit=crop&q=80&w=400&h=400', title: '镜号 4' }
        ];
        
        const newNodes = frames.map((frame, index) => {
          const frameId = `imageNode-${Date.now()}-${index}`;
          // Layout in a grid below the script
          const row = Math.floor(index / 2);
          const col = index % 2;
          return {
            id: frameId,
            type: 'imageNode',
            position: { x: position.x + (col * 340), y: position.y + 350 + (row * 340) },
            style: { width: 320, height: 320 },
            data: { 
              imageUrl: frame.image, 
              text: frame.title,
              onAction: handleImageAction, 
              onUpload: handleNodeFileUpload, 
              onGenerate: handleOpenGenerate, 
              onChange: handleImageChange, 
              onAddNode: addNode 
            }
          };
        });

        const newEdges = newNodes.map(node => ({
          id: `e-${sourceNodeId}-${node.id}`,
          source: sourceNodeId,
          target: node.id,
          animated: true,
          style: { stroke: '#00bcd4', strokeWidth: 2 }
        }));

        setNodes(nds => [...nds, ...newNodes]);
        setEdges(eds => [...eds, ...newEdges]);
        showToast('生成画面完成');
      }, 2000);
      return;
    }

    let newNode: Node;
    
    if (type === 'textNode') {
      newNode = { id, type, position, style: { width: 320, height: 180 }, data: { text: '', onChange: handleTextChange, onAddNode: addNode } };
    } else if (type === 'imageNode') {
      newNode = { id, type, position, style: { width: 320, height: 320 }, data: { imageUrl: '', onAction: handleImageAction, onUpload: handleNodeFileUpload, onGenerate: handleOpenGenerate, onChange: handleImageChange, onAddNode: addNode } };
    } else if (type === 'videoNode') {
      newNode = { id, type, position, style: { width: 360, height: 240 }, data: { videoUrl: '', onUpload: handleNodeFileUpload, onAddNode: addNode } };
    } else if (type === 'audioNode') {
      newNode = { id, type, position, style: { width: 320, height: 140 }, data: { audioUrl: '', onUpload: handleNodeFileUpload, onAddNode: addNode } };
    } else if (type === 'scriptNode') {
      newNode = { id, type, position, style: { width: 480, height: 380 }, data: { script: null, onAddNode: addNode, onConfirmBreakdown: handleConfirmBreakdown, onReBreakdown: handleReBreakdown, isGenerating: false } };
    } else if (type === 'aiGenNode') {
      let title = 'AI Generation';
      let description = '';
      if (aiType === 'text2image') {
        title = 'Text to Image';
        description = 'Connect a Text Node to generate an image.';
      } else if (aiType === 'image2prompt') {
        title = 'Image to Prompt';
        description = 'Connect an Image Node to reverse-engineer its prompt.';
      } else if (aiType === 'autoStoryboard') {
        title = 'Auto Storyboard (9-Grid)';
        description = 'Connect an Image Node to generate a 9-shot storyboard.';
      } else if (aiType === 'videoSynth') {
        title = '视频合成';
        description = 'Merge multiple video or audio nodes into one final composition.';
      }
      
      newNode = { 
        id, 
        type, 
        position, 
        data: { type: aiType, title, description, onRun: runAIGeneration, isGenerating: false } 
      };
    } else {
      return;
    }
    
    setNodes((nds) => nds.concat(newNode));
    if (sourceNodeId) {
      setEdges((eds) => [...eds, {
        id: `e-${sourceNodeId}-${id}`,
        source: sourceNodeId,
        target: id,
        animated: true,
        style: { stroke: '#00bcd4', strokeWidth: 1.5, opacity: 0.6 }
      }]);
    }
  };

  const { fitView, screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        Array.from(event.dataTransfer.files).forEach((file, index) => {
          const offset = index * 40;
          const nodePosition = { x: position.x + offset, y: position.y + offset };
          
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const newNodeId = `image-${Date.now()}-${index}`;
              const newNode = {
                id: newNodeId,
                type: 'imageNode',
                position: nodePosition,
                style: { width: 320, height: 320 },
                data: { 
                  imageUrl: e.target?.result as string,
                  onAction: handleImageAction,
                  onUpload: handleNodeFileUpload,
                  onGenerate: handleOpenGenerate
                },
              };
              setNodes((nds) => nds.concat(newNode));
              if (index === 0) showToast('图片上传成功');
            };
            reader.readAsDataURL(file);
          } else if (file.type.startsWith('video/')) {
            const videoUrl = URL.createObjectURL(file);
            const newNodeId = `video-${Date.now()}-${index}`;
            const newNode = {
              id: newNodeId,
              type: 'videoNode',
              position: nodePosition,
              style: { width: 360, height: 240 },
              data: { videoUrl, onUpload: handleNodeFileUpload },
            };
            setNodes((nds) => nds.concat(newNode));
            if (index === 0) showToast('视频上传成功');
          } else if (file.type.startsWith('audio/')) {
            const audioUrl = URL.createObjectURL(file);
            const newNodeId = `audio-${Date.now()}-${index}`;
            const newNode = {
              id: newNodeId,
              type: 'audioNode',
              position: nodePosition,
              style: { width: 320, height: 140 },
              data: { audioUrl, onUpload: handleNodeFileUpload },
            };
            setNodes((nds) => nds.concat(newNode));
            if (index === 0) showToast('音频上传成功');
          } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const textContent = e.target?.result as string;
              
              if (file.name.endsWith('.csv')) {
                // Determine if it's a script
                const lines = textContent.split('\n');
                if (lines.length > 1) {
                  const scriptData = lines.slice(1).map(l => {
                    const params = l.split(',');
                    return { description: params[0] || '', shotType: params[1] || '' };
                  });
                  const newNode = {
                    id: `script-${Date.now()}-${index}`,
                    type: 'scriptNode',
                    position: nodePosition,
                    style: { width: 480, height: 300 },
                    data: { script: scriptData },
                  };
                  setNodes((nds) => nds.concat(newNode));
                  if (index === 0) showToast('脚本上传成功');
                  return;
                }
              }
              
              const newNode = {
                id: `text-${Date.now()}-${index}`,
                type: 'textNode',
                position: nodePosition,
                style: { width: 320, height: 180 },
                data: { text: textContent, onChange: handleTextChange },
              };
              setNodes((nds) => nds.concat(newNode));
              if (index === 0) showToast('文本上传成功');
            };
            reader.readAsText(file);
          }
        });
      }
    },
    [screenToFlowPosition, setNodes, handleImageAction, showToast]
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setMenu({
        id: node.id,
        top: event.clientY,
        left: event.clientX,
        type: 'node',
        nodeType: node.type
      });
    },
    [setMenu]
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      setMenu({
        id: 'pane',
        top: event.clientY,
        left: event.clientX,
        type: 'pane'
      });
    },
    [setMenu]
  );

  const [fullscreenNodeId, setFullscreenNodeId] = useState<string | null>(null);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    setFullscreenNodeId(node.id);
  }, []);

  const onPaneClick = useCallback((event: React.MouseEvent) => {
    setMenu(null);
    if (event.detail === 2) {
      setMenu({ id: 'add-node', top: event.clientY, left: event.clientX, type: 'add-node' });
    }
  }, [setMenu]);

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: any) => {
      if (!connectionState.isValid) {
        const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;
        setMenu({ 
          id: 'add-connected-node', 
          top: clientY, 
          left: clientX, 
          type: 'add-connected-node',
          sourceNodeId: connectionState.fromNode?.id
        } as any);
      }
    },
    [setMenu]
  );

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        fitView({ duration: 800 });
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        // Find selected node
        const selectedNode = nodes.find(n => n.selected);
        if (selectedNode) setClipboard({ type: 'node', data: selectedNode });
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'v' && clipboard) {
        if (clipboard.type === 'node') {
          const newNodeId = `${clipboard.data.type}-${Date.now()}`;
          const newNode = {
            ...clipboard.data,
            id: newNodeId,
            position: { x: clipboard.data.position.x + 50, y: clipboard.data.position.y + 50 },
            selected: true
          };
          setNodes(nds => nds.map(n => ({...n, selected: false})).concat(newNode));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fitView, nodes, clipboard, setNodes, setClipboard]);

  return (
    <div className="w-full h-full relative bg-[#0E0F11]">
      {/* Floating Top Toolbar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] bg-[#111214]/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-lg flex items-center p-1.5 gap-1">
        <button className="px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-colors">
          项目设置
        </button>
        <div className="w-px h-5 bg-zinc-800 mx-1"></div>
        <button onClick={() => fitView({ duration: 800 })} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-colors tooltip" title="居中对齐">
          <Eye size={16} />
        </button>
        <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-colors tooltip" title="项目历史记录">
          <RotateCw size={16} />
        </button>
        <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-colors tooltip" title="更多">
          <Settings size={16} />
        </button>
      </div>

      {/* Sidebar UI */}
      <div className="absolute top-1/2 -translate-y-1/2 left-6 z-[100] flex gap-4 pointer-events-none">
        {/* Main Icon Column */}
        <div className="bg-[#1C1C1E] border border-zinc-800/80 rounded-[20px] shadow-2xl p-2 flex flex-col gap-3 items-center w-[52px] h-fit pointer-events-auto">
          <button 
            onClick={() => setActiveSidebarPopover(p => p === 'add' ? null : 'add')} 
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors group relative ${activeSidebarPopover === 'add' ? 'bg-[#E5E5E5] text-black' : 'bg-[#E5E5E5] text-black hover:bg-white'}`}
          >
            <Plus size={20} strokeWidth={2.5} />
            <span className="absolute left-full ml-3 px-2 py-1 bg-[#2D2D2D] border border-zinc-700/50 text-xs text-zinc-200 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">新建节点</span>
          </button>
          
          <button className="flex items-center justify-center w-10 h-10 text-zinc-400 hover:text-white rounded-xl transition-colors group relative">
            <ClipboardPaste size={18} />
            <span className="absolute left-full ml-3 px-2 py-1 bg-[#2D2D2D] border border-zinc-700/50 text-xs text-zinc-200 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">我的工具箱</span>
          </button>

          <button className="flex items-center justify-center w-10 h-10 text-zinc-400 hover:text-white rounded-xl transition-colors group relative">
            <Clock size={18} />
            <span className="absolute left-full ml-3 px-2 py-1 bg-[#2D2D2D] border border-zinc-700/50 text-xs text-zinc-200 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">历史记录</span>
          </button>
          
          <button 
            onClick={() => setActiveSidebarPopover(p => p === 'assets' ? null : 'assets')} 
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors group relative ${activeSidebarPopover === 'assets' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
          >
            <Shapes size={18} />
            {activeSidebarPopover !== 'assets' && (
              <span className="absolute left-full ml-3 px-2 py-1 bg-[#2D2D2D] border border-zinc-700/50 text-xs text-zinc-200 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">我的素材</span>
            )}
          </button>
          
          <button className="flex items-center justify-center w-10 h-10 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-colors group relative">
            <Clock size={18} />
            <span className="absolute left-full ml-3 px-2 py-1 bg-[#2D2D2D] border border-zinc-700/50 text-xs text-zinc-200 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">历史记录</span>
          </button>
          
          <div className="w-6 h-px bg-zinc-800 my-1"></div>
          
          <button className="flex items-center justify-center w-10 h-10 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-colors group relative">
            <HelpCircle size={18} />
            <span className="absolute left-full ml-3 px-2 py-1 bg-[#2D2D2D] border border-zinc-700/50 text-xs text-zinc-200 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">帮助</span>
          </button>
        </div>

        {/* Add Node Popover */}
        {activeSidebarPopover === 'add' && (
          <div className="bg-[#1C1C1E] border border-zinc-800/80 rounded-[20px] shadow-2xl p-4 w-56 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 h-fit pointer-events-auto">
            <div>
              <h3 className="text-zinc-500 text-xs mb-2 px-2 font-medium">添加节点</h3>
              <div className="flex flex-col gap-0.5">
                <button onClick={() => { addNode('textNode'); setActiveSidebarPopover(null); }} className="flex items-center gap-3 w-full px-2 py-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-200">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                    <AlignLeft size={14} />
                  </div>
                  <span className="text-sm">文本</span>
                </button>
                <button onClick={() => { addNode('imageNode'); setActiveSidebarPopover(null); }} className="flex items-center gap-3 w-full px-2 py-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-200">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                    <ImageIcon size={14} />
                  </div>
                  <span className="text-sm">图片</span>
                </button>
                <button onClick={() => { addNode('videoNode'); setActiveSidebarPopover(null); }} className="flex items-center gap-3 w-full px-2 py-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-200">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                    <Video size={14} />
                  </div>
                  <span className="text-sm">视频</span>
                </button>
                <button onClick={() => { addNode('audioNode'); setActiveSidebarPopover(null); }} className="flex items-center gap-3 w-full px-2 py-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-200">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                    <AudioLines size={14} />
                  </div>
                  <span className="text-sm flex-1 text-left">音频</span>
                </button>
                <button onClick={() => { addNode('scriptNode'); setActiveSidebarPopover(null); }} className="flex items-center gap-3 w-full px-2 py-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-200">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                    <FileText size={14} />
                  </div>
                  <span className="text-sm flex-1 text-left">脚本</span>
                </button>
                <button className="flex items-center gap-3 w-full px-2 py-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-200">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                    <Scissors size={14} />
                  </div>
                  <span className="text-sm flex-1 text-left">视频合成</span>
                  <span className="bg-zinc-800 text-zinc-500 text-[10px] px-1.5 py-0.5 rounded leading-none">Beta</span>
                </button>
                <button className="flex items-center gap-3 w-full px-2 py-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-200">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                    <AudioLines size={14} />
                  </div>
                  <span className="text-sm">音频</span>
                </button>
                <button className="flex items-center gap-3 w-full px-2 py-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-200">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                    <FileText size={14} />
                  </div>
                  <span className="text-sm flex-1 text-left">脚本</span>
                  <span className="bg-zinc-800 text-zinc-500 text-[10px] px-1.5 py-0.5 rounded leading-none">Beta</span>
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-zinc-500 text-xs mb-2 px-2 font-medium">添加资源</h3>
              <div className="flex flex-col gap-0.5">
                <button onClick={() => {
                   const input = document.createElement('input');
                   input.type = 'file';
                   input.accept = 'image/*';
                   input.onchange = (e: any) => {
                     const file = e.target.files?.[0];
                     if (file) {
                       const reader = new FileReader();
                       reader.onload = (ev) => {
                         const newNode = {
                           id: `image-${Date.now()}`,
                           type: 'imageNode',
                           position: { x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 150 },
                           style: { width: 320, height: 320 },
                           data: { imageUrl: ev.target?.result, onAction: handleImageAction, onUpload: handleNodeFileUpload, onGenerate: handleOpenGenerate }
                         };
                         setNodes(nds => nds.concat(newNode));
                         showToast('上传成功');
                         setActiveSidebarPopover(null);
                       };
                       reader.readAsDataURL(file);
                     }
                   };
                   input.click();
                }} className="flex items-center gap-3 w-full px-2 py-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-200">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                    <Upload size={14} />
                  </div>
                  <span className="text-sm">上传</span>
                </button>
                <button onClick={() => {
                  setActiveSidebarPopover('assets');
                }} className="flex items-center gap-3 w-full px-2 py-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-200">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                    <Shapes size={14} />
                  </div>
                  <span className="text-sm">从图库选择</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Assets Popover */}
        {activeSidebarPopover === 'assets' && (
          <div className="bg-[#1C1C1E] border border-zinc-800/80 rounded-[20px] shadow-2xl w-[480px] h-[520px] flex flex-col animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-baseline gap-3">
                <h2 className="text-zinc-200 font-medium text-[15px]">我的素材</h2>
                <span className="text-zinc-500 text-sm">我的主体库</span>
              </div>
              <button onClick={() => setActiveSidebarPopover(null)} className="text-zinc-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex items-center gap-6 px-5 pb-4 text-sm text-zinc-400 overflow-x-auto no-scrollbar border-b border-zinc-800/50">
              <button className="shrink-0 bg-zinc-700/50 text-white px-3 py-1 rounded-md text-xs font-medium">全部</button>
              <button className="shrink-0 hover:text-zinc-200 transition-colors text-xs font-medium">人物</button>
              <button className="shrink-0 hover:text-zinc-200 transition-colors text-xs font-medium">场景</button>
              <button className="shrink-0 hover:text-zinc-200 transition-colors text-xs font-medium">物品</button>
              <button className="shrink-0 hover:text-zinc-200 transition-colors text-xs font-medium">风格</button>
              <button className="shrink-0 hover:text-zinc-200 transition-colors text-xs font-medium">音效</button>
              <button className="shrink-0 hover:text-zinc-200 transition-colors text-xs font-medium">其他</button>
            </div>
            
            <div className="flex-1 p-5 overflow-y-auto grid grid-cols-3 gap-4">
              {/* Mock items */}
              <div 
                className="flex flex-col gap-2 group cursor-pointer"
                onClick={() => {
                  const newNode = {
                    id: `image-${Date.now()}`,
                    type: 'imageNode',
                    position: { x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 150 },
                    style: { width: 320, height: 320 },
                    data: { imageUrl: 'https://images.unsplash.com/photo-1590483866874-5bebc2de714f?auto=format&fit=crop&q=80&w=400&h=400', onAction: handleImageAction, onUpload: handleNodeFileUpload, onGenerate: handleOpenGenerate }
                  };
                  setNodes(nds => nds.concat(newNode));
                  showToast('已添加到画布');
                  setActiveSidebarPopover(null);
                }}
              >
                <div className="aspect-square bg-zinc-800 rounded-xl overflow-hidden relative border border-transparent group-hover:border-zinc-500 transition-colors">
                  <img src="https://images.unsplash.com/photo-1590483866874-5bebc2de714f?auto=format&fit=crop&q=80&w=200&h=200" className="w-full h-full object-cover" alt="东吴居所关闭" />
                </div>
                <span className="text-zinc-400 text-xs px-1 truncate">东吴居所关闭</span>
              </div>
              <div 
                className="flex flex-col gap-2 group cursor-pointer"
                onClick={() => {
                  const newNode = {
                    id: `image-${Date.now()}`,
                    type: 'imageNode',
                    position: { x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 150 },
                    style: { width: 320, height: 320 },
                    data: { imageUrl: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=400&h=400', onAction: handleImageAction, onUpload: handleNodeFileUpload, onGenerate: handleOpenGenerate }
                  };
                  setNodes(nds => nds.concat(newNode));
                  showToast('已添加到画布');
                  setActiveSidebarPopover(null);
                }}
              >
                <div className="aspect-square bg-zinc-800 rounded-xl overflow-hidden relative border border-transparent group-hover:border-zinc-500 transition-colors">
                  <img src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=200&h=200" className="w-full h-full object-cover" alt="图片素材" />
                </div>
                <span className="text-zinc-400 text-xs px-1 truncate">图片素材</span>
              </div>
              <div 
                className="flex flex-col gap-2 group cursor-pointer"
                onClick={() => {
                  const newNode = {
                    id: `image-${Date.now()}`,
                    type: 'imageNode',
                    position: { x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 150 },
                    style: { width: 320, height: 320 },
                    data: { imageUrl: 'https://images.unsplash.com/photo-1542157585-ef20bfcce579?auto=format&fit=crop&q=80&w=400&h=400', onAction: handleImageAction, onUpload: handleNodeFileUpload, onGenerate: handleOpenGenerate }
                  };
                  setNodes(nds => nds.concat(newNode));
                  showToast('已添加到画布');
                  setActiveSidebarPopover(null);
                }}
              >
                <div className="aspect-square bg-zinc-800 rounded-xl overflow-hidden relative border border-transparent group-hover:border-zinc-500 transition-colors">
                  <img src="https://images.unsplash.com/photo-1542157585-ef20bfcce579?auto=format&fit=crop&q=80&w=200&h=200" className="w-full h-full object-cover" alt="图片素材" />
                </div>
                <span className="text-zinc-400 text-xs px-1 truncate">图片素材</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="w-full h-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          onPaneClick={onPaneClick}
          onPaneContextMenu={onPaneContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          onNodeDoubleClick={onNodeDoubleClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionRadius={30}
          fitView
          className="bg-[#0E0F11]"
          defaultEdgeOptions={{ 
            type: 'animated', 
            animated: true, 
            style: { stroke: '#00bcd4', strokeWidth: 2.5, filter: 'drop-shadow(0 0 8px rgba(0,188,212,0.8))' }
          }}
        >
          <Background color="rgba(255, 255, 255, 0.1)" gap={20} size={1} variant={BackgroundVariant.Dots} />
          
          <Panel position="top-left" className="flex items-center gap-2 m-4 pointer-events-auto">
            <button
              onClick={handleNewProject}
              className="px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-md text-zinc-300 font-medium rounded-xl shadow-lg border border-zinc-700/50 hover:border-zinc-500 transition-all flex items-center gap-2 cursor-pointer"
              title="新建项目"
            >
              <Plus size={16} />
              <span className="text-sm">新建项目</span>
            </button>
            <label
              className="px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-md text-zinc-300 font-medium rounded-xl shadow-lg border border-zinc-700/50 hover:border-zinc-500 transition-all flex items-center gap-2 cursor-pointer"
              title="打开项目"
            >
              <Upload size={16} />
              <span className="text-sm">打开项目</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleLoadProject}
              />
            </label>
            <button
              onClick={handleSaveProject}
              className="px-4 py-2 bg-[#00bcd4]/10 hover:bg-[#00bcd4]/20 backdrop-blur-md text-[#00bcd4] font-medium rounded-xl shadow-lg border border-[#00bcd4]/20 hover:border-[#00bcd4]/50 transition-all flex items-center gap-2 cursor-pointer"
              title="保存项目"
            >
              <Download size={16} />
              <span className="text-sm">保存项目</span>
            </button>
          </Panel>

          <Controls className="bg-zinc-900 border border-zinc-800 fill-zinc-400 shadow-xl rounded-lg overflow-hidden" showInteractive={false} position="bottom-left" />
          <MiniMap 
            pannable
            zoomable
            nodeColor={(node) => {
              switch (node.type) {
                case 'textNode': return '#71717a';
                case 'imageNode': return '#00bcd4';
                case 'aiGenNode': return '#00bcd4';
                case 'resultNode': return '#22c55e';
                default: return '#eee';
              }
            }}
            className="bg-[#111214] border-zinc-800 rounded-lg overflow-hidden shadow-xl"
            maskColor="rgba(0, 0, 0, 0.8)"
            maskStrokeColor="#00bcd4"
            maskStrokeWidth={2}
            position="bottom-right"
          />
        </ReactFlow>

        {/* Context Menus */}
        {menu && menu.type === 'node' && (
          <div 
            className="fixed z-[1000] bg-[#242424] border border-zinc-800 rounded-xl shadow-2xl min-w-[220px] text-zinc-200 text-sm py-1.5 flex flex-col font-medium"
            style={{ top: menu.top, left: menu.left }}
          >
            {menu.nodeType === 'imageNode' && (
              <>
                <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => handleContextMenuAction('save-asset')}>
                  <span>保存到我的素材</span>
                </button>
                <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => handleContextMenuAction('enter-panorama')}>
                  <div className="flex items-center gap-1.5">
                    <span>进入全景预览</span>
                    <HelpCircle size={14} className="text-zinc-500" />
                  </div>
                </button>
                <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => handleContextMenuAction('create-subject')}>
                  <span>创建主体</span>
                </button>
                
                <div className="h-px bg-zinc-800/80 my-1.5 mx-3"></div>
                
                <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => handleContextMenuAction('optimize-layout')}>
                  <div className="flex items-center gap-1.5">
                    <span>优化工作流布局</span>
                    <HelpCircle size={14} className="text-zinc-500" />
                  </div>
                </button>
              </>
            )}

            <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => handleContextMenuAction('copy-node')}>
              <div className="flex items-center gap-1.5">
                <span>复制节点</span>
                <HelpCircle size={14} className="text-zinc-500" />
              </div>
              <span className="text-zinc-500 text-xs">⌘C</span>
            </button>
            <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => handleContextMenuAction('copy-image')}>
              <span>复制图片</span>
            </button>
            <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => handleContextMenuAction('duplicate')}>
              <div className="flex items-center gap-1.5">
                <span>创建副本</span>
                <HelpCircle size={14} className="text-zinc-500" />
              </div>
            </button>
            <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => handleContextMenuAction('paste')}>
              <span>粘贴</span>
              <span className="text-zinc-500 text-xs">⌘V</span>
            </button>
            <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => handleContextMenuAction('delete')}>
              <span>删除</span>
              <span className="text-zinc-500 text-xs">⌘⌫</span>
            </button>

            <div className="h-px bg-zinc-800/80 my-1.5 mx-3"></div>

            <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => handleContextMenuAction('copy-clipboard')}>
              <span>复制到剪贴板</span>
            </button>
          </div>
        )}

        {menu && menu.type === 'pane' && (
          <div 
            className="fixed z-[1000] bg-[#242424] border border-zinc-800 rounded-xl shadow-2xl min-w-[200px] py-2 flex flex-col font-medium"
            style={{ top: menu.top, left: menu.left }}
          >
            <button className="flex items-center justify-between px-4 py-2 hover:bg-[#343434] text-white text-left w-full transition-colors text-sm" onClick={() => setMenu(null)}>
              <span>上传</span>
            </button>
            <button className="flex items-center justify-between px-4 py-2 text-zinc-500 text-left w-full cursor-not-allowed text-sm" disabled>
              <span>保存到我的素材</span>
            </button>
            
            <div className="h-px bg-zinc-800 my-2 mx-4"></div>
            
            <button className="flex items-center justify-between px-4 py-2 text-zinc-300 hover:bg-[#343434] hover:text-white text-left w-full transition-colors text-sm" onClick={() => setMenu(null)}>
              <span>撤销</span>
              <span className="text-zinc-500 text-xs">⌘Z</span>
            </button>
            <button className="flex items-center justify-between px-4 py-2 text-zinc-500 text-left w-full cursor-not-allowed text-sm" disabled>
              <span>重做</span>
              <span className="text-zinc-600 text-xs">⇧⌘Z</span>
            </button>

            <div className="h-px bg-zinc-800 my-2 mx-4"></div>

            <button className="flex items-center justify-between px-4 py-2 text-zinc-300 hover:bg-[#343434] hover:text-white text-left w-full transition-colors text-sm" onClick={() => handlePaneContextMenuAction('paste')}>
              <span>粘贴</span>
              <span className="text-zinc-500 text-xs">⌘V</span>
            </button>
          </div>
        )}

        {menu && (menu.type === 'add-node' || menu.type === 'add-connected-node') && (
          <div 
            className="fixed z-[1000] bg-[#1C1C1E] border border-zinc-800/80 rounded-xl shadow-2xl p-2 w-48 flex flex-col animate-in fade-in zoom-in-95 duration-200"
            style={{ top: menu.top, left: menu.left }}
          >
            <h3 className="text-zinc-500 text-xs mb-2 px-2 pt-1 font-medium">添加节点 {menu.type === 'add-connected-node' && '(连接)'}</h3>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => { addNode('textNode', undefined, screenToFlowPosition({ x: menu.left, y: menu.top }), menu.sourceNodeId); setMenu(null); }} className="flex items-center gap-3 w-full px-2 py-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-200">
                <div className="w-6 h-6 rounded-md bg-zinc-800/80 flex items-center justify-center text-zinc-400"><Type size={12} /></div>
                <span className="text-sm">文本描述</span>
              </button>
              <button onClick={() => { addNode('imageNode', undefined, screenToFlowPosition({ x: menu.left, y: menu.top }), menu.sourceNodeId); setMenu(null); }} className="flex items-center gap-3 w-full px-2 py-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-200">
                <div className="w-6 h-6 rounded-md bg-zinc-800/80 flex items-center justify-center text-zinc-400"><ImageIcon size={12} /></div>
                <span className="text-sm">视觉资产</span>
              </button>
              <button onClick={() => { addNode('videoNode', undefined, screenToFlowPosition({ x: menu.left, y: menu.top }), menu.sourceNodeId); setMenu(null); }} className="flex items-center gap-3 w-full px-2 py-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-200">
                <div className="w-6 h-6 rounded-md bg-zinc-800/80 flex items-center justify-center text-zinc-400"><Video size={12} /></div>
                <span className="text-sm">视频片段</span>
              </button>
              <button onClick={() => { addNode('audioNode', undefined, screenToFlowPosition({ x: menu.left, y: menu.top }), menu.sourceNodeId); setMenu(null); }} className="flex items-center gap-3 w-full px-2 py-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-200">
                <div className="w-6 h-6 rounded-md bg-zinc-800/80 flex items-center justify-center text-zinc-400"><AudioLines size={12} /></div>
                <span className="text-sm">音频</span>
              </button>
              <button onClick={() => { addNode('scriptNode', undefined, screenToFlowPosition({ x: menu.left, y: menu.top }), menu.sourceNodeId); setMenu(null); }} className="flex items-center gap-3 w-full px-2 py-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-200">
                <div className="w-6 h-6 rounded-md bg-zinc-800/80 flex items-center justify-center text-zinc-400"><FileText size={12} /></div>
                <span className="text-sm">脚本</span>
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
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Node Overlay */}
      {fullscreenNodeId && (
        <div 
          className="fixed inset-0 z-[1500] bg-black/90 backdrop-blur-xl flex items-center justify-center animate-in fade-in zoom-in-95 duration-200"
          onDoubleClick={() => setFullscreenNodeId(null)}
        >
          <button 
            className="absolute top-6 right-6 p-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors"
            onClick={() => setFullscreenNodeId(null)}
          >
            <X size={24} />
          </button>
          
          <div className="w-[80vw] h-[80vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {nodes.find(n => n.id === fullscreenNodeId)?.type === 'imageNode' && (
              <img src={nodes.find(n => n.id === fullscreenNodeId)?.data?.imageUrl} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" alt="" />
            )}
            {nodes.find(n => n.id === fullscreenNodeId)?.type === 'videoNode' && (
              <video src={nodes.find(n => n.id === fullscreenNodeId)?.data?.videoUrl} controls className="max-w-full max-h-full rounded-xl shadow-2xl" />
            )}
            {nodes.find(n => n.id === fullscreenNodeId)?.type === 'textNode' && (
              <div className="w-full h-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                <textarea 
                  className="w-full h-full bg-transparent text-zinc-200 text-xl resize-none outline-none" 
                  value={nodes.find(n => n.id === fullscreenNodeId)?.data?.text || ''} 
                  readOnly 
                />
              </div>
            )}
            {nodes.find(n => n.id === fullscreenNodeId)?.type === 'scriptNode' && (
              <div className="w-full h-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl overflow-auto text-zinc-200 custom-scrollbar">
                {nodes.find(n => n.id === fullscreenNodeId)?.data?.breakdown ? (() => {
                  const bd = nodes.find(n => n.id === fullscreenNodeId)?.data?.breakdown;
                  return (
                    <div className="flex flex-col gap-12 max-w-4xl mx-auto pb-12">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-[#00bcd4] mb-4">{bd.overview.title}</h2>
                        <div className="flex items-center justify-center gap-6 text-sm text-zinc-400 mb-6">
                          <span><strong className="text-zinc-500">主题:</strong> {bd.overview.theme}</span>
                          <span><strong className="text-zinc-500">基调:</strong> {bd.overview.overallMood}</span>
                          <span><strong className="text-zinc-500">时空:</strong> {bd.overview.timePeriod}</span>
                        </div>
                        <p className="text-zinc-300 bg-zinc-800/30 p-6 rounded-xl text-left border border-zinc-800/50 leading-relaxed shadow-inner">
                          {bd.overview.synopsis}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-zinc-100 mb-4 pb-2 border-b border-zinc-800 flex flex-col"><span>场次列表 (Scenes)</span></h3>
                        <div className="grid gap-4">
                          {bd.scenes.map((scene, i) => (
                            <div key={i} className="bg-zinc-800/20 p-5 rounded-xl border border-zinc-800/50">
                              <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-800/50">
                                <span className="text-[#00bcd4] font-medium text-lg">场次 {scene.sceneNo}: {scene.name}</span>
                                <span className="bg-zinc-800 px-3 py-1 rounded-full text-xs text-zinc-400">{scene.setting} · {scene.time}</span>
                              </div>
                              <div className="grid grid-cols-[80px_1fr] gap-y-3 gap-x-4 text-sm">
                                <span className="text-zinc-500">地点</span><span className="text-zinc-200">{scene.location}</span>
                                <span className="text-zinc-500">人物</span><span className="text-zinc-200">{scene.characters.join('、')}</span>
                                <span className="text-zinc-500">事件</span><span className="text-zinc-200">{scene.events}</span>
                                <span className="text-zinc-500">情绪</span><span className="text-zinc-200">{scene.mood}</span>
                                <span className="text-zinc-500">前后场</span><span className="text-zinc-400">{scene.relation}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-zinc-100 mb-4 pb-2 border-b border-zinc-800">人物列表 (Characters)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {bd.characters.map((char, i) => (
                            <div key={i} className="bg-zinc-800/20 p-5 rounded-xl border border-zinc-800/50">
                              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-zinc-800/50">
                                <span className="text-lg font-medium text-zinc-100">{char.name}</span>
                                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">{char.role}</span>
                                <span className="text-xs text-zinc-500">{char.ageGroup}</span>
                              </div>
                              <div className="grid gap-y-2 text-sm">
                                <div><span className="text-zinc-500 mr-2">外观:</span><span className="text-zinc-300">{char.appearance}</span></div>
                                <div><span className="text-zinc-500 mr-2">当前状态:</span><span className="text-orange-400/80">{char.currentState}</span></div>
                                <div><span className="text-zinc-500 mr-2">情绪状态:</span><span className="text-rose-400/80">{char.emotionalState}</span></div>
                                <div><span className="text-zinc-500 mr-2">目标:</span><span className="text-emerald-400/80">{char.goal}</span></div>
                                <div><span className="text-zinc-500 mr-2">人物关系:</span><span className="text-zinc-300">{char.relationships}</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-zinc-100 mb-4 pb-2 border-b border-zinc-800">场景列表 (Locations)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {bd.locations.map((loc, i) => (
                            <div key={i} className="bg-zinc-800/20 p-5 rounded-xl border border-zinc-800/50">
                              <div className="text-lg font-medium text-zinc-200 mb-3 pb-3 border-b border-zinc-800/50">{loc.name}</div>
                              <div className="grid grid-cols-[80px_1fr] gap-y-2 gap-x-2 text-sm">
                                <span className="text-zinc-500">空间类型</span><span className="text-zinc-300">{loc.spaceType}</span>
                                <span className="text-zinc-500">空间锚点</span><span className="text-zinc-300">{loc.spatialAnchors}</span>
                                <span className="text-zinc-500">门窗出入</span><span className="text-zinc-300">{loc.ports}</span>
                                <span className="text-zinc-500">家具构件</span><span className="text-zinc-300">{loc.furniture}</span>
                                <span className="text-zinc-500">光线氛围</span><span className="text-zinc-300">{loc.lighting} · {loc.atmosphere}</span>
                                <span className="text-zinc-500">状态变化</span><span className="text-yellow-500/80">{loc.statusChange}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-zinc-100 mb-4 pb-2 border-b border-zinc-800">道具列表 (Props)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {bd.props.map((prop, i) => (
                            <div key={i} className="bg-zinc-800/20 p-5 rounded-xl border border-zinc-800/50 flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-amber-500 text-lg">{prop.name}</span>
                                <span className="text-xs text-zinc-400 bg-zinc-800/50 px-2 py-1 rounded">归属: {prop.owner}</span>
                              </div>
                              <div className="text-sm space-y-2 text-zinc-300 bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/30">
                                <div><span className="text-zinc-500 mr-2">初始位置:</span>{prop.initPosition}</div>
                                <div><span className="text-zinc-500 mr-2">出现时机:</span>{prop.appearTime}</div>
                                <div><span className="text-zinc-500 mr-2">离手时机:</span>{prop.dropTime}</div>
                                <div><span className="text-zinc-500 mr-2">使用动作:</span>{prop.usage}</div>
                                <div><span className="text-zinc-500 mr-2">进入下场:</span>{prop.nextScene ? '是' : '否 - 本场结束'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-zinc-100 mb-4 pb-2 border-b border-zinc-800">核心动作链 (Action Chain)</h3>
                        <div className="bg-zinc-800/30 p-6 rounded-xl border border-zinc-800/50 flex flex-wrap items-center gap-3 text-[#00bcd4] font-medium text-base">
                          {bd.actionChain.map((a, i) => (
                            <React.Fragment key={i}>
                              <div className="bg-zinc-900/50 px-4 py-2 rounded-lg border border-[#00bcd4]/20 shadow-sm">{a}</div>
                              {i < bd.actionChain.length - 1 && <span className="text-zinc-600">→</span>}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-zinc-100 mb-4 pb-2 border-b border-zinc-800">Beat 列表</h3>
                        <div className="space-y-4">
                          {bd.beats.map((beat, i) => (
                            <div key={i} className="bg-zinc-800/20 rounded-xl p-5 border-l-4 border-l-purple-500 border border-zinc-800/50 pl-6 relative">
                              <div className="absolute left-0 top-6 -translate-x-1/2 w-6 h-6 rounded-full bg-zinc-900 border-2 border-purple-500 flex items-center justify-center text-xs font-bold font-mono text-zinc-300 shadow-md">
                                {beat.beatNo}
                              </div>
                              <div className="text-xs text-zinc-500 mb-3">属于: 场次 {beat.sceneNo}</div>
                              <div className="flex items-center gap-3 text-sm font-medium text-zinc-200 mb-4 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/30">
                                <span>{beat.start}</span>
                                <span className="text-zinc-600">→</span>
                                <span>{beat.end}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                  <div><span className="text-zinc-500 block mb-1">主要动作</span><span className="text-zinc-200">{beat.action}</span></div>
                                  <div><span className="text-zinc-500 block mb-1">台词承载</span><span className="text-zinc-400">{beat.dialogueLoad}</span></div>
                                </div>
                                <div className="space-y-2">
                                  <div><span className="text-zinc-500 block mb-1">情绪变化</span><span className="text-rose-400/90 font-medium">{beat.emotionChange}</span></div>
                                  <div><span className="text-zinc-500 block mb-1">视觉重点</span><span className="text-[#00bcd4]">{beat.visualFocus}</span></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-zinc-100 mb-4 pb-2 border-b border-zinc-800 text-rose-400">连贯性与风险预警</h3>
                        <div className="space-y-2 bg-rose-500/5 p-6 rounded-xl border border-rose-500/20">
                          {bd.continuityRisks.map((risk, i) => (
                            <div key={i} className="flex gap-3 items-start text-sm bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                              <div className="text-rose-500 mt-0.5 shrink-0"><Zap size={16} /></div>
                              <span className="text-zinc-200 leading-relaxed">{risk}</span>
                            </div>
                          ))}
                          {(!bd.continuityRisks || bd.continuityRisks.length === 0) && (
                            <div className="text-zinc-500 text-center py-4">暂无发现明显连贯性风险</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                 <table className="w-full text-base text-left">
                  <thead className="text-zinc-500 border-b border-zinc-800">
                    <tr><th className="pb-4 font-medium w-16">镜号</th><th className="pb-4 font-medium">画面描述</th><th className="pb-4 font-medium w-32">景别</th></tr>
                  </thead>
                  <tbody className="text-zinc-300">
                    {nodes.find(n => n.id === fullscreenNodeId)?.data?.script?.map((row, i) => (
                      <tr key={i} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                        <td className="py-4 text-zinc-500 align-top">{i + 1}</td>
                        <td className="py-4 pr-4 align-top">{row.description}</td>
                        <td className="py-4 text-zinc-500 align-top">{row.shotType || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                 </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] bg-zinc-800 text-white px-4 py-2 rounded-xl shadow-2xl text-sm animate-in slide-in-from-bottom-5">
          {toast.message}
        </div>
      )}

      {/* Right Properties Panel */}
      {activeRightPanel && activeRightPanel.type === 'i2i' && (
         <div className="absolute top-0 right-0 h-full w-[400px] bg-[#1C1C1E] border-l border-zinc-800 flex flex-col z-[100] shadow-2xl animate-in slide-in-from-right-8 duration-300">
           {/* Header */}
           <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
             <div className="flex items-center gap-2">
               <Sparkles size={16} className="text-[#00bcd4]" />
               <h3 className="text-zinc-200 font-medium">生成控制台</h3>
             </div>
             <button onClick={() => setActiveRightPanel(null)} className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors">
               <X size={16} />
             </button>
           </div>
           
           {/* Content */}
           <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
              {/* Tabs */}
              <div className="flex bg-zinc-900 rounded-lg p-1">
                <button className="flex-1 py-1.5 text-sm rounded bg-[#2D2D2D] text-white shadow-sm font-medium">图生图</button>
                <button className="flex-1 py-1.5 text-sm rounded text-zinc-400 hover:text-white font-medium">局部重绘</button>
                <button className="flex-1 py-1.5 text-sm rounded text-zinc-400 hover:text-white font-medium">扩图</button>
              </div>
              
              {/* Reference */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                   <label className="text-sm text-zinc-300 font-medium">参考强度</label>
                   <span className="text-xs text-zinc-500">0.7</span>
                </div>
                <input type="range" min="0" max="1" step="0.01" defaultValue="0.7" className="w-full accent-[#00bcd4]" />
                <span className="text-[10px] text-zinc-500 leading-tight">控制参考图的影响程度，0 为基本重绘，1 为近似原图。</span>
              </div>
              
              {/* Prompt */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-zinc-300 font-medium">正面提示词</label>
                <textarea rows={4} placeholder="描述画面内容... (支持 / 快捷命令)" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 resize-none focus:outline-none focus:border-[#00bcd4]" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm text-zinc-300 font-medium">负面提示词</label>
                <textarea rows={2} defaultValue="lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-400 resize-none focus:outline-none focus:border-zinc-700" />
              </div>
              
              {/* Simple Controls */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-zinc-300">模型</label>
                  <select className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-sm text-zinc-300 focus:outline-none focus:border-[#00bcd4]">
                    <option>Realistic 写实模型</option>
                    <option>Anime 立体二次元</option>
                    <option>Stylized 风格化</option>
                    <option>General 通用模型</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm text-zinc-300">生成尺寸</label>
                  <select className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-sm text-zinc-300 focus:outline-none focus:border-[#00bcd4]">
                    <option>与参考图一致</option>
                    <option>1:1 (1024x1024)</option>
                    <option>16:9 (1920x1080)</option>
                    <option>9:16 (1080x1920)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-zinc-300">生成数量</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(num => (
                      <button key={num} className={`w-8 h-8 rounded-lg text-sm border ${num === 4 ? 'border-[#00bcd4] bg-[#00bcd4]/10 text-[#00bcd4]' : 'border-zinc-800 text-zinc-400 hover:text-white'}`}>{num}</button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Advance settings mock */}
              <div className="border border-zinc-800 rounded-xl overflow-hidden mt-2">
                <div className="bg-zinc-900/50 px-3 py-2 flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-zinc-400">高级参数</span>
                  <div className="w-4 h-4 text-zinc-500">▼</div>
                </div>
              </div>
           </div>
           
           {/* Footer Action */}
           <div className="p-4 border-t border-zinc-800 shrink-0">
             <button 
                className="w-full bg-gradient-to-r from-[#00bcd4] to-[#0092a8] hover:from-[#00cbe6] hover:to-[#00a2bb] text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#00bcd4]/20 transition-all active:scale-[0.98]"
                onClick={() => {
                   updateNodeData(activeRightPanel.nodeId, 'isGenerating', true);
                   const targetNodeId = activeRightPanel.nodeId;
                   setActiveRightPanel(null);
                   setTimeout(() => {
                      updateNodeData(targetNodeId, 'isGenerating', false);
                      
                      // Check if node exists and what its image url is, mock some thumbnails
                      setNodes(nds => nds.map(n => {
                        if (n.id === targetNodeId) {
                           // Try to make up some variants based on the original structure or unsplash
                           // For simulation, let's just use some unsplash ones, or just copy the current image to thumbnails
                           const thumbs = n.data.thumbnails || [];
                           const newThumb = `https://images.unsplash.com/photo-${Math.floor(1500000000000 + Math.random() * 100000000000)}?auto=format&fit=crop&q=80&w=400&h=400`;
                           // we can use a small set of mock images
                           const mockVariations = [
                             'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=400&h=400',
                             'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400&h=400',
                             'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&q=80&w=400&h=400',
                             'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=400&h=400'
                           ];
                           const randomThumb = mockVariations[Math.floor(Math.random() * mockVariations.length)];
                           return {
                             ...n,
                             data: {
                               ...n.data,
                               imageUrl: randomThumb,
                               thumbnails: [randomThumb, ...thumbs].slice(0, 4) // keep up to 4
                             }
                           };
                        }
                        return n;
                      }));
                      showToast('图生图生成完成');
                   }, 3000);
                }}
             >
               <Sparkles size={16} />
               立即生成
             </button>
           </div>
         </div>
      )}
    </div>
  );
}

export default function InfiniteCanvasWrapper({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] bg-[#0E0F11] flex flex-col animate-in fade-in duration-300">
      <div className="absolute top-6 right-6 z-[210]">
        <button 
          onClick={onClose}
          className="p-3 bg-[#111214]/80 backdrop-blur-xl border border-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl shadow-lg transition-all"
        >
          <X size={20} />
        </button>
      </div>
      <ReactFlowProvider>
        <Canvas />
      </ReactFlowProvider>
    </div>
  );
}
