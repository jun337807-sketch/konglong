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
  NodeToolbar
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  ImagePlus, Type, Film, BrainCircuit, LayoutGrid, X, 
  Play, Maximize, Download, Sun, SplitSquareHorizontal, 
  Move3D, Eye, Sparkles, Focus, RotateCw, BookMarked, 
  Copy, CopyPlus, ClipboardPaste, Trash2, BoxSelect, Settings, HelpCircle
} from 'lucide-react';
import { getAIClient } from '../services/aiService';

// Custom Node Styling Constants
const selectedBorder = "border-[#00bcd4]"; // Cyan-blue 
const defaultBorder = "border-zinc-800/80";
const nodeBg = "bg-[#111214]/90 backdrop-blur-md";
const handleStyle = "w-2 h-2 bg-zinc-600 border border-zinc-800 opacity-20 hover:opacity-100 hover:w-3 hover:h-3 hover:bg-[#00bcd4] transition-all duration-200";

// Custom Node Components
const TextNode = ({ data, id, selected }: any) => {
  return (
    <div className={`${nodeBg} border-[1.5px] ${selected ? selectedBorder : defaultBorder} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow min-w-[240px] max-w-[320px]`}>
      <Handle type="target" position={Position.Left} className={handleStyle} />
      <div className="flex items-center gap-2 mb-3 text-zinc-400 pb-2">
        <Type size={14} className={selected ? "text-[#00bcd4]" : ""} />
        <span className="text-xs font-semibold tracking-wide">文本描述</span>
      </div>
      <textarea 
        className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3 text-sm text-zinc-300 resize-none focus:outline-none focus:border-[#00bcd4]"
        rows={4}
        value={data.text}
        onChange={(e) => data.onChange(id, e.target.value)}
        placeholder="输入内容..."
      />
      <Handle type="source" position={Position.Right} className={handleStyle} />
    </div>
  );
};

const ImageNode = ({ data, id, selected }: any) => {
  return (
    <>
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        className="flex items-center gap-1 p-1 bg-[#1a1b1e]/95 backdrop-blur-xl border border-zinc-700/80 rounded-xl shadow-2xl z-50 mb-2"
      >
        <button className="p-1.5 text-zinc-400 hover:text-[#00bcd4] hover:bg-[#00bcd4]/10 rounded-lg tooltip" title="全景"><Maximize size={15} /></button>
        <button className="p-1.5 text-zinc-400 hover:text-[#00bcd4] hover:bg-[#00bcd4]/10 rounded-lg tooltip" title="多角度"><Move3D size={15} /></button>
        <button className="p-1.5 text-zinc-400 hover:text-[#00bcd4] hover:bg-[#00bcd4]/10 rounded-lg tooltip" title="打光"><Sun size={15} /></button>
        <div className="w-px h-4 bg-zinc-700 mx-0.5"></div>
        <button className="p-1.5 text-zinc-400 hover:text-[#00bcd4] hover:bg-[#00bcd4]/10 rounded-lg tooltip" title="九宫格"><LayoutGrid size={15} /></button>
        <button className="p-1.5 text-zinc-400 hover:text-[#00bcd4] hover:bg-[#00bcd4]/10 rounded-lg tooltip" title="高清"><Sparkles size={15} /></button>
        <button className="p-1.5 text-zinc-400 hover:text-[#00bcd4] hover:bg-[#00bcd4]/10 rounded-lg tooltip" title="宫格切分"><SplitSquareHorizontal size={15} /></button>
        <div className="w-px h-4 bg-zinc-700 mx-0.5"></div>
        <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg tooltip" title="标注"><Focus size={15} /></button>
        <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg tooltip" title="旋转"><RotateCw size={15} /></button>
        <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg tooltip" title="下载"><Download size={15} /></button>
        <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg tooltip" title="预览"><Eye size={15} /></button>
      </NodeToolbar>
      
      <div className={`${nodeBg} border-[1.5px] ${selected ? selectedBorder : defaultBorder} rounded-2xl p-2 shadow-sm hover:shadow-[0_0_15px_rgba(0,188,212,0.15)] transition-shadow min-w-[280px] max-w-[400px]`}>
        <Handle type="target" position={Position.Left} className={handleStyle} />
        <div className="flex items-center gap-2 px-2 py-2 text-zinc-400">
          <ImagePlus size={14} className={selected ? "text-[#00bcd4]" : ""} />
          <span className="text-xs font-semibold tracking-wide">视觉资产</span>
        </div>
        {data.imageUrl ? (
          <div className="rounded-xl overflow-hidden border border-zinc-800/50 flex items-center justify-center bg-black/40">
            <img src={data.imageUrl} alt="Node content" className="w-full h-auto max-h-[300px] object-contain block" />
          </div>
        ) : (
          <div className="w-full h-40 bg-zinc-900/50 border border-zinc-800/50 rounded-xl flex items-center justify-center text-zinc-600 flex-col gap-2">
            <ImagePlus size={20} />
            <span className="text-xs">无可预览图像</span>
          </div>
        )}
        <Handle type="source" position={Position.Right} className={handleStyle} />
      </div>
    </>
  );
};

const VideoNode = ({ data, id, selected }: any) => {
  return (
    <div className={`${nodeBg} border-[1.5px] ${selected ? selectedBorder : defaultBorder} rounded-2xl p-2 shadow-sm hover:shadow-md transition-shadow min-w-[280px] max-w-[400px]`}>
      <Handle type="target" position={Position.Left} className={handleStyle} />
      <div className="flex items-center gap-2 px-2 py-2 text-zinc-400">
        <Film size={14} className={selected ? "text-[#00bcd4]" : ""} />
        <span className="text-xs font-semibold tracking-wide">视频片段</span>
      </div>
      {data.videoUrl ? (
        <div className="rounded-xl overflow-hidden border border-zinc-800/50">
          <video src={data.videoUrl} controls className="w-full h-auto block" />
        </div>
      ) : (
        <div className="w-full h-40 bg-zinc-900/50 border border-zinc-800/50 rounded-xl flex items-center justify-center text-zinc-600 flex-col gap-2">
          <Film size={20} />
          <span className="text-xs">无可预览视频</span>
        </div>
      )}
      <Handle type="source" position={Position.Right} className={handleStyle} />
    </div>
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

const nodeTypes = {
  textNode: TextNode,
  imageNode: ImageNode,
  videoNode: VideoNode,
  aiGenNode: AIGenNode,
  resultNode: ResultNode,
};

function Canvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [menu, setMenu] = useState<{ id: string; top: number; left: number, type?: 'node' | 'pane' } | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#FFC107' } }, eds)),
    [setEdges],
  );

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
            data: { imageUrl },
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

  const addNode = (type: string, aiType?: string) => {
    const id = `${type}-${Date.now()}`;
    const position = { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 };
    
    let newNode: Node;
    
    if (type === 'textNode') {
      newNode = { id, type, position, data: { text: '', onChange: handleTextChange } };
    } else if (type === 'imageNode') {
      // For demo, we might want a way to upload an image. Here we just create an empty one.
      // In a full implementation, we'd add a file input to the node.
      newNode = { id, type, position, data: { imageUrl: '' } };
      
      // Let's create a file input programmatically to select an image immediately
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setNodes((nds) => nds.map(n => n.id === id ? { ...n, data: { ...n.data, imageUrl: event.target?.result } } : n));
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else if (type === 'videoNode') {
      newNode = { id, type, position, data: { videoUrl: '' } };
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
  };

  const { fitView } = useReactFlow();

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      if (node.type === 'imageNode') {
        setMenu({
          id: node.id,
          top: event.clientY,
          left: event.clientX,
          type: 'node'
        });
      } else {
        setMenu(null);
      }
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

  const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

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

      {/* Floating Left Drawer */}
      <div className="absolute top-1/2 -translate-y-1/2 left-6 z-[100] bg-[#111214]/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-lg p-2 flex flex-col gap-2">
        <button onClick={() => addNode('textNode')} className="flex items-center justify-center p-3 text-zinc-400 hover:text-[#00bcd4] hover:bg-[#00bcd4]/10 rounded-xl transition-colors group relative">
          <Type size={18} />
          <span className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">文本描述</span>
        </button>
        <button onClick={() => addNode('imageNode')} className="flex items-center justify-center p-3 text-zinc-400 hover:text-[#00bcd4] hover:bg-[#00bcd4]/10 rounded-xl transition-colors group relative">
          <ImagePlus size={18} />
          <span className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">图片资产</span>
        </button>
        <div className="w-8 h-px bg-zinc-800 mx-auto my-1"></div>
        <button onClick={() => addNode('aiGenNode', 'text2image')} className="flex items-center justify-center p-3 text-zinc-400 hover:text-[#00bcd4] hover:bg-[#00bcd4]/10 rounded-xl transition-colors group relative">
          <Sparkles size={18} />
          <span className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">AI 生图</span>
        </button>
        <button onClick={() => addNode('aiGenNode', 'image2prompt')} className="flex items-center justify-center p-3 text-zinc-400 hover:text-[#00bcd4] hover:bg-[#00bcd4]/10 rounded-xl transition-colors group relative">
          <BrainCircuit size={18} />
          <span className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">反推提示词</span>
        </button>
        <button onClick={() => addNode('aiGenNode', 'autoStoryboard')} className="flex items-center justify-center p-3 text-zinc-400 hover:text-[#00bcd4] hover:bg-[#00bcd4]/10 rounded-xl transition-colors group relative">
          <LayoutGrid size={18} />
          <span className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">AI 分镜</span>
        </button>
        <div className="w-8 h-px bg-zinc-800 mx-auto my-1"></div>
        <button onClick={() => addNode('resultNode')} className="flex items-center justify-center p-3 text-zinc-400 hover:text-green-500 hover:bg-green-500/10 rounded-xl transition-colors group relative">
          <BoxSelect size={18} />
          <span className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">结果输出</span>
        </button>
      </div>
      
      <div className="w-full h-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={onPaneClick}
          onPaneContextMenu={onPaneContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[#0E0F11]"
          defaultEdgeOptions={{ animated: true, style: { stroke: '#00bcd4', strokeWidth: 1.5, opacity: 0.6 } }}
        >
          <Background color="rgba(255, 255, 255, 0.1)" gap={20} size={1} variant={BackgroundVariant.Dots} />
          <Controls className="bg-zinc-900 border border-zinc-800 fill-zinc-400 shadow-xl rounded-lg overflow-hidden" showInteractive={false} position="bottom-left" />
          <MiniMap 
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
            position="bottom-right"
          />
        </ReactFlow>

        {/* Context Menus */}
        {menu && menu.type === 'node' && (
          <div 
            className="fixed z-[1000] bg-[#242424] border border-zinc-800 rounded-xl shadow-2xl min-w-[220px] text-zinc-200 text-sm py-1.5 flex flex-col font-medium"
            style={{ top: menu.top, left: menu.left }}
          >
            <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => setMenu(null)}>
              <span>保存到我的素材</span>
            </button>
            <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => setMenu(null)}>
              <div className="flex items-center gap-1.5">
                <span>进入全景预览</span>
                <HelpCircle size={14} className="text-zinc-500" />
              </div>
            </button>
            <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => setMenu(null)}>
              <span>创建主体</span>
            </button>
            
            <div className="h-px bg-zinc-800/80 my-1.5 mx-3"></div>
            
            <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => setMenu(null)}>
              <div className="flex items-center gap-1.5">
                <span>优化工作流布局</span>
                <HelpCircle size={14} className="text-zinc-500" />
              </div>
            </button>

            <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => setMenu(null)}>
              <div className="flex items-center gap-1.5">
                <span>复制节点</span>
                <HelpCircle size={14} className="text-zinc-500" />
              </div>
              <span className="text-zinc-500 text-xs">⌘C</span>
            </button>
            <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => setMenu(null)}>
              <span>复制图片</span>
            </button>
            <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => setMenu(null)}>
              <div className="flex items-center gap-1.5">
                <span>创建副本</span>
                <HelpCircle size={14} className="text-zinc-500" />
              </div>
            </button>
            <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => setMenu(null)}>
              <span>粘贴</span>
              <span className="text-zinc-500 text-xs">⌘V</span>
            </button>
            <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => setMenu(null)}>
              <span>删除</span>
              <span className="text-zinc-500 text-xs">⌘⌫</span>
            </button>

            <div className="h-px bg-zinc-800/80 my-1.5 mx-3"></div>

            <button className="flex items-center justify-between px-3 py-2 text-zinc-200 hover:bg-[#343434] hover:text-white text-left w-full" onClick={() => setMenu(null)}>
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
            <button className="flex items-center justify-between px-4 py-2 text-zinc-300 hover:bg-[#343434] hover:text-white text-left w-full transition-colors text-sm" onClick={() => setMenu(null)}>
              <span>添加节点</span>
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

            <button className="flex items-center justify-between px-4 py-2 text-zinc-300 hover:bg-[#343434] hover:text-white text-left w-full transition-colors text-sm" onClick={() => setMenu(null)}>
              <span>粘贴</span>
              <span className="text-zinc-500 text-xs">⌘V</span>
            </button>
          </div>
        )}
      </div>
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
