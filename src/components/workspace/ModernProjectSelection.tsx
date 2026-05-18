import React, { useState, useEffect } from 'react';
import { Project } from '../../types/workspace';
import { projectService } from '../../services/projectService';
import { Layers, Plus, ArrowLeft, X, Sparkles, Trash2, RotateCw, Edit2, Share2, Users } from 'lucide-react';
import { groupService } from '../../services/groupService';

export function ModernProjectSelection({ 
  groupId, 
  groupName, 
  onSelectProject, 
  onBackToGroups,
  onClose,
  renderTopRight,
  currentUser
}: { 
  groupId: string;
  groupName: string;
  onSelectProject: (id: string, name: string) => void;
  onBackToGroups: () => void;
  onClose?: () => void;
  renderTopRight?: React.ReactNode;
  currentUser?: string;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  
  const [movingProjectId, setMovingProjectId] = useState<string | null>(null);
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);

  const isPersonal = groupId.startsWith('personal_');

  useEffect(() => {
    loadProjects();
  }, [groupId]);

  const loadProjects = async () => {
    setLoading(true);
    const projs = await projectService.getProjectsByGroup(groupId);
    setProjects(projs);
    setLoading(false);
  };

  const handleCreateNew = async () => {
    const defaultName = `未命名项目 ${new Date().toLocaleString()}`;
    const p = await projectService.createProject({ group_id: groupId, project_name: defaultName });
    await loadProjects();
    onSelectProject(p.project_id, p.project_name);
  };

  const startEdit = (e: React.MouseEvent, proj: Project) => {
    e.stopPropagation();
    setEditingProjectId(proj.project_id);
    setEditName(proj.project_name);
  };

  const saveEdit = async (e: React.MouseEvent | React.FocusEvent | React.KeyboardEvent, id: string) => {
    e.stopPropagation();
    if (editName.trim() === '') {
      setEditingProjectId(null);
      return;
    }
    await projectService.updateProject(id, { project_name: editName.trim() });
    setEditingProjectId(null);
    await loadProjects();
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      saveEdit(e, id);
    } else if (e.key === 'Escape') {
      setEditingProjectId(null);
    }
  };

  const startMove = async (e: React.MouseEvent, projId: string) => {
    e.stopPropagation();
    const gs = await groupService.getGroups();
    setAvailableGroups(gs);
    setMovingProjectId(projId);
  };

  const executeMove = async (targetGroupId: string) => {
    if (!movingProjectId) return;
    await projectService.updateProject(movingProjectId, { group_id: targetGroupId });
    setMovingProjectId(null);
    loadProjects();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0E0F11] flex flex-col pt-16 animate-in fade-in">
      <div className="absolute top-4 left-4 z-[100]">
         <button onClick={onBackToGroups} className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors">
            <ArrowLeft size={16} /> 返回小组
         </button>
      </div>

      <div className="absolute top-4 right-4 z-[100] flex items-center gap-4">
        {renderTopRight}
        {onClose && (
          <button onClick={onClose} className="p-2 bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-md rounded-xl text-zinc-400 hover:text-white transition-all shadow-lg border border-zinc-700/50">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="max-w-7xl w-full mx-auto px-8 py-8 flex flex-col h-full mt-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="text-[#00bcd4] text-xs font-semibold mb-2">{groupName}</div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Layers className="text-white" /> 项目大厅
            </h1>
            <p className="text-sm text-zinc-400">选择一个项目继续创作，或者新建一个项目。</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCreateNew}
              className="px-5 py-2.5 bg-[#00bcd4] hover:bg-[#00a6bb] text-black font-semibold rounded-xl text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(0,188,212,0.3)] flex items-center gap-2"
            >
              <Plus size={18} /> 新建项目
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4 auto-rows-max">
              {loading ? (
                <div className="col-span-full h-full min-h-[200px] flex items-center justify-center text-zinc-500">加载中...</div>
              ) : projects.length === 0 ? (
                <div className="col-span-full h-full min-h-[200px] flex flex-col items-center justify-center text-zinc-500">
                  <Sparkles size={40} className="mb-4 opacity-50" />
                  <p>该小组下还没有任何项目，点击上方按钮新建一个吧！</p>
                </div>
              ) : (
                projects.map(proj => (
                  <div 
                    key={proj.project_id}
                    onClick={() => { if (editingProjectId !== proj.project_id) onSelectProject(proj.project_id, proj.project_name) }}
                    className="group relative bg-[#1A1A1A] border border-zinc-700/50 hover:border-[#00bcd4]/50 hover:bg-[#222] rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between min-h-[160px]"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        {editingProjectId === proj.project_id ? (
                           <input 
                              type="text" 
                              value={editName}
                              autoFocus
                              onChange={(e) => setEditName(e.target.value)}
                              onBlur={(e) => saveEdit(e, proj.project_id)}
                              onKeyDown={(e) => handleEditKeyDown(e, proj.project_id)}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-white bg-[#111214] border border-[#00bcd4] rounded-md px-2 py-0.5 flex-1 focus:outline-none"
                           />
                        ) : (
                           <h3 className="font-semibold text-zinc-200 text-lg line-clamp-1 flex-1 group-hover:text-[#00bcd4] transition-colors flex items-center gap-2">
                             {proj.project_name}
                             <button onClick={(e) => startEdit(e, proj)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#00bcd4]/20 rounded text-[#00bcd4] transition-all">
                               <Edit2 size={12} />
                             </button>
                           </h3>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400">Type: {proj.project_type}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-500 mt-4 relative z-10">
                      <div className="flex items-center gap-2">
                        <RotateCw size={12} />
                        更新于: {new Date(proj.updated_at).toLocaleString()}
                      </div>
                      {isPersonal && (
                        <button 
                          onClick={(e) => startMove(e, proj.project_id)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2 py-1 bg-[#00bcd4]/10 hover:bg-[#00bcd4]/20 text-[#00bcd4] rounded transition-all"
                        >
                          <Share2 size={12} />
                          移至小组
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
        </div>
      </div>

      {movingProjectId && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center backdrop-blur-sm" onClick={() => setMovingProjectId(null)}>
          <div className="bg-[#1A1A1A] border border-zinc-700 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Users size={20} className="text-[#00bcd4]" /> 移至小组工作区
            </h3>
            <p className="text-zinc-400 mb-6 text-sm">
              选择一个小组将该项目移动过去。移动后，小组内的所有成员都可以参与该项目。
            </p>
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar mb-6">
              {availableGroups.length === 0 ? (
                <div className="text-zinc-500 text-sm text-center py-4">暂无可用小组，请先去创建一个小组工作区</div>
              ) : (
                availableGroups.map(g => (
                  <button 
                    key={g.group_id}
                    onClick={() => executeMove(g.group_id)}
                    className="flex justify-between items-center p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-[#00bcd4]/50 transition-all text-left"
                  >
                    <span className="text-white font-medium">{g.group_name}</span>
                  </button>
                ))
              )}
            </div>
            <div className="flex justify-end mt-2">
              <button 
                onClick={() => setMovingProjectId(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
