import fs from 'fs';

let content = fs.readFileSync('src/components/InfiniteCanvas.tsx', 'utf8');

// 1. Add imports for history
const importInjection = `import { useCanvasHistory } from '../hooks/useCanvasHistory';
import { HistoryPanel } from './HistoryPanel';
import { VersionPanel } from './VersionPanel';
`;
content = content.replace("import { CapabilityPanel } from './CapabilityPanel';", importInjection + "import { CapabilityPanel } from './CapabilityPanel';");

// 2. Add history, version, soft delete logic to `Canvas` component
const useNodesStateRegex = /const \[nodes,\s*setNodes,\s*onNodesChange\]\s*=\s*useNodesState\(\[\]\);/;
const useEdgesStateRegex = /const \[edges,\s*setEdges,\s*onEdgesChange\]\s*=\s*useEdgesState\(\[\]\);/;

content = content.replace(useNodesStateRegex, "const [nodes, setNodes, onNodesChangeOriginal] = useNodesState([]);");
content = content.replace(useEdgesStateRegex, "const [edges, setEdges, onEdgesChangeOriginal] = useEdgesState([]);");

const interceptorsInjection = `
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const { saveHistory, undo, redo, canUndo, canRedo } = useCanvasHistory(projectId, nodes, edges, setNodes as any, setEdges as any);

  const onNodesChange = useCallback((changes: any[]) => {
    const removeChanges = changes.filter(c => c.type === 'remove');
    if (removeChanges.length > 0) {
      saveHistory('delete_node');
      setNodes(nds => nds.map(n => removeChanges.some(c => c.id === n.id) ? { ...n, hidden: true, data: { ...n.data, isDeleted: true } } : n));
      changes = changes.filter(c => c.type !== 'remove');
    }
    if (changes.length > 0) onNodesChangeOriginal(changes);
  }, [onNodesChangeOriginal, saveHistory, setNodes]);

  const onEdgesChange = useCallback((changes: any[]) => {
    const removeChanges = changes.filter(c => c.type === 'remove');
    if (removeChanges.length > 0) {
      saveHistory('delete_edge');
      setEdges(eds => eds.map(e => removeChanges.some(c => c.id === e.id) ? { ...e, hidden: true, data: { ...e.data, isDeleted: true } } : e));
      changes = changes.filter(c => c.type !== 'remove');
    }
    if (changes.length > 0) onEdgesChangeOriginal(changes);
  }, [onEdgesChangeOriginal, saveHistory, setEdges]);
`;

// Insert the interceptors after the original hooks
content = content.replace(
  "const [edges, setEdges, onEdgesChangeOriginal] = useEdgesState([]);", 
  "const [edges, setEdges, onEdgesChangeOriginal] = useEdgesState([]);" + interceptorsInjection
);

// 3. Update updateNodeData to save history FIRST before mutation
const updateNodeDataSearch = `const updateNodeData = useCallback((id: string, key: string, value: any) => {`;
const updateNodeDataReplace = `const updateNodeData = useCallback((id: string, key: string, value: any) => {
    saveHistory('update_node', id);`;

content = content.replace(updateNodeDataSearch, updateNodeDataReplace);

// Update connect
const connectSearch = `const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ `;
const connectReplace = `const onConnect = useCallback(
    (params: Connection) => {
      saveHistory('connect_edge');
      setEdges((eds) => addEdge({ `;
content = content.replace(connectSearch, connectReplace);

// We need an extra closing brace for onConnect now if we modified it
// Actually it's better to replace the whole thing:
const fullConnectSearch = `const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
      ...params, 
      type: 'animated',
      animated: true, 
      style: { stroke: '#00bcd4', strokeWidth: 2.5, filter: 'drop-shadow(0 0 8px rgba(0,188,212,0.8))' }
    }, eds)),
    [setEdges],
  );`;
const fullConnectReplace = `const onConnect = useCallback(
    (params: Connection) => {
      saveHistory('connect_edge');
      return setEdges((eds) => addEdge({ 
        ...params, 
        type: 'animated',
        animated: true, 
        style: { stroke: '#00bcd4', strokeWidth: 2.5, filter: 'drop-shadow(0 0 8px rgba(0,188,212,0.8))' }
      }, eds));
    },
    [setEdges, saveHistory],
  );`;
content = content.replace(fullConnectSearch, fullConnectReplace);


// Add onNodeDragStop to ReactFlow
const reactFlowSearch = `<ReactFlow
          nodes={nodes}`;
const reactFlowReplace = `<ReactFlow
          onNodeDragStop={(event, node) => saveHistory('move_node', node.id)}
          nodes={nodes.filter(n => !n.data?.isDeleted)}
          edges={edges.filter(e => !e.data?.isDeleted)}`;
content = content.replace(reactFlowSearch, reactFlowReplace);

// Also filter out deleted ones in onEdgesChange Original in the prop bindings?
// No, the node.hidden=true ensures it's invisible if we didn't filter.
// But filtering them in `nodes={nodes.filter()}` makes ReactFlow think they are removed and fires remove changes!
// So if we filter them out of `nodes` prop, it will try to remove from state.
// We should ONLY use `node.hidden: true`. 
content = content.replace(reactFlowReplace, `<ReactFlow
          onNodeDragStop={(event, node) => saveHistory('move_node', node.id)}
          nodes={nodes}
          edges={edges}`);


// Add buttons to top-left Panel
const topLeftPanelSearch = `<button
              onClick={() => navigate('/select')}
              className="px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-md text-zinc-300 font-medium rounded-xl shadow-lg border border-zinc-700/50 hover:border-zinc-500 transition-all flex items-center gap-2 cursor-pointer"
              title="返回系统主页"
            >`;

const topLeftPanelReplace = `<button
              onClick={() => navigate('/select')}
              className="px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-md text-zinc-300 font-medium rounded-xl shadow-lg border border-zinc-700/50 hover:border-zinc-500 transition-all flex items-center gap-2 cursor-pointer"
              title="返回系统主页"
            >
              <svg className="w-4 h-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm">主页</span>
            </button>
            <div className="flex items-center bg-zinc-800/80 backdrop-blur-md rounded-xl shadow-lg border border-zinc-700/50 p-1 mx-2">
              <button onClick={undo} disabled={!canUndo} className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors" title="撤销 (Ctrl+Z)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
              </button>
              <button onClick={redo} disabled={!canRedo} className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors" title="重做 (Ctrl+Y)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
              </button>
            </div>
            <button onClick={() => setShowVersionPanel(true)} className="px-3 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-md text-emerald-400 font-medium rounded-xl shadow-lg border border-zinc-700/50 hover:border-emerald-500/50 transition-all flex items-center gap-2 cursor-pointer text-sm">
               <RotateCw size={14} /> 版本
            </button>
            <button onClick={() => setShowHistoryPanel(true)} className="px-3 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-md text-amber-400 font-medium rounded-xl shadow-lg border border-zinc-700/50 hover:border-amber-500/50 transition-all flex items-center gap-2 cursor-pointer text-sm">
               <Clock size={14} /> 日志
            </button>
            
            <button className="hidden`;

content = content.replace(topLeftPanelSearch, topLeftPanelReplace);


// Add the rendered panels at the end of Canvas JSX
const rightPanelSearch = `{/* Right Properties Panel */}`;
const rightPanelReplace = `
{showHistoryPanel && <HistoryPanel projectId={projectId} onClose={() => setShowHistoryPanel(false)} />}
{showVersionPanel && <VersionPanel projectId={projectId} onClose={() => setShowVersionPanel(false)} onRestore={(state) => {
  setNodes(state.nodes);
  setEdges(state.edges);
  showToast('已恢复至历史版本');
}} />}
      {/* Right Properties Panel */}`;

content = content.replace(rightPanelSearch, rightPanelReplace);

fs.writeFileSync('src/components/InfiniteCanvas.tsx', content);

console.log('Modified InfiniteCanvas.tsx');
