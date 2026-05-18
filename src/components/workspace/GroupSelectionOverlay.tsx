import React, { useState, useEffect } from 'react';
import { Users, Plus, X, Sparkles, FolderKanban, Edit2 } from 'lucide-react';
import { groupService } from '../../services/groupService';
import { Group } from '../../types/workspace';

export function GroupSelectionOverlay({ 
  onSelectGroup, 
  onClose, 
  renderTopRight 
}: { 
  onSelectGroup: (id: string, name: string) => void;
  onClose?: () => void;
  renderTopRight?: React.ReactNode;
}) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    const gs = await groupService.getGroups();
    setGroups(gs);
    setLoading(false);
  };

  const handleCreateNew = async () => {
    const defaultName = `未命名小组 ${new Date().toLocaleString()}`;
    const newGroup = await groupService.createGroup({ group_name: defaultName });
    await loadGroups();
    onSelectGroup(newGroup.group_id, newGroup.group_name);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('确定要删除这个小组吗？这可能会导致小组内的所有数据丢失。')) return;
    // For now we don't implement full cascade delete in mock
    onSelectGroup('', ''); // trigger re-render? No
  };

  const startEdit = (e: React.MouseEvent, group: Group) => {
    e.stopPropagation();
    setEditingGroupId(group.group_id);
    setEditName(group.group_name);
  };

  const saveEdit = async (e: React.MouseEvent | React.FocusEvent | React.KeyboardEvent, id: string) => {
    e.stopPropagation();
    if (editName.trim() === '') {
      setEditingGroupId(null);
      return;
    }
    await groupService.updateGroup(id, { group_name: editName.trim() });
    setEditingGroupId(null);
    await loadGroups();
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      saveEdit(e, id);
    } else if (e.key === 'Escape') {
      setEditingGroupId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0E0F11] flex flex-col pt-16">
      <div className="absolute top-4 right-4 z-[100] flex items-center gap-4">
        {renderTopRight}
        {onClose && (
          <button onClick={onClose} className="p-2 bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-md rounded-xl text-zinc-400 hover:text-white transition-all shadow-lg border border-zinc-700/50">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="max-w-7xl w-full mx-auto px-8 py-8 flex flex-col h-full">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Users className="text-[#00bcd4]" /> 小组工作区
            </h1>
            <p className="text-sm text-zinc-400">选择或创建一个小组，在小组内共享资源和项目。</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCreateNew}
              className="px-5 py-2.5 bg-[#00bcd4] hover:bg-[#00a6bb] text-black font-semibold rounded-xl text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(0,188,212,0.3)] flex items-center gap-2"
            >
              <Plus size={18} /> 新建小组
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
              {loading ? (
                <div className="col-span-full h-full min-h-[200px] flex items-center justify-center text-zinc-500">加载中...</div>
              ) : groups.length === 0 ? (
                <div className="col-span-full h-full min-h-[200px] flex flex-col items-center justify-center text-zinc-500">
                  <Sparkles size={40} className="mb-4 opacity-50" />
                  <p>还没有任何小组，点击上方按钮新建一个吧！</p>
                </div>
              ) : (
                groups.map(group => (
                  <div 
                    key={group.group_id}
                    onClick={() => { if (editingGroupId !== group.group_id) onSelectGroup(group.group_id, group.group_name) }}
                    className="group relative bg-[#1A1A1A] border border-zinc-700/50 hover:border-[#00bcd4]/50 hover:bg-[#222] rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between min-h-[160px]"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        {editingGroupId === group.group_id ? (
                           <input 
                              type="text" 
                              value={editName}
                              autoFocus
                              onChange={(e) => setEditName(e.target.value)}
                              onBlur={(e) => saveEdit(e, group.group_id)}
                              onKeyDown={(e) => handleEditKeyDown(e, group.group_id)}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-white bg-[#111214] border border-[#00bcd4] rounded-md px-2 py-0.5 flex-1 focus:outline-none"
                           />
                        ) : (
                           <h3 className="font-semibold text-zinc-200 text-lg line-clamp-1 flex-1 group-hover:text-[#00bcd4] transition-colors flex items-center gap-2">
                             {group.group_name} 
                             <button onClick={(e) => startEdit(e, group)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#00bcd4]/20 rounded text-[#00bcd4] transition-all">
                               <Edit2 size={12} />
                             </button>
                           </h3>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500 line-clamp-2">{group.description || '无描述'}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-4">
                      <FolderKanban size={14} />
                      <span className="flex-1">进入工作区</span>
                    </div>
                  </div>
                ))
              )}
        </div>
      </div>
    </div>
  );
}
