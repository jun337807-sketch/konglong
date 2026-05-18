import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import InfiniteCanvasWrapper from './components/InfiniteCanvas';

import { User, CreateUserInput, UpdateUserInput } from './types/user';
import { UserService } from './services/userService';
import { StatisticsOverlay } from './components/StatisticsOverlay';

// User Management Types - Replaced by imported types in src/types/user.ts


function LoginRoute({ onLogin, usersDB }: { onLogin: (username: string) => void, usersDB: User[] }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入账号和密码');
      return;
    }
    
    const user = usersDB.find(u => u.username === username);
    if (!user) {
      setError('账号不存在');
      return;
    }
    
    if (user.password && user.password !== password) {
      setError('密码不正确');
      return;
    }

    setError('');
    onLogin(username);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#00bcd4]/10 to-purple-500/10 z-0"></div>
      
      <div className="z-10 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-10 rounded-2xl shadow-2xl w-full max-w-md flex flex-col items-center">
        <div className="w-16 h-16 bg-[#00bcd4]/20 text-[#00bcd4] rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,188,212,0.3)]">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">恐龙系统登录</h1>
        <p className="text-zinc-400 text-sm mb-8 text-center">请输入您的账号密码</p>
        
        <div className="w-full space-y-4 mb-6">
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5 ml-1">用户名</label>
            <input 
              type="text" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-[#00bcd4] transition-colors"
              placeholder="请输入账号"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5 ml-1">密码</label>
            <input 
              type="password" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-[#00bcd4] transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
        </div>

        {error && <div className="text-rose-400 text-xs mb-4 w-full text-center bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">{error}</div>}
        
        <button 
          onClick={handleLogin}
          className="w-full py-3.5 bg-gradient-to-r from-[#00bcd4] to-[#0096a8] hover:from-[#00cbe6] hover:to-[#00a2bb] text-white font-medium rounded-xl shadow-lg shadow-[#00bcd4]/20 transition-all active:scale-[0.98]"
        >
          登录系统
        </button>
      </div>
    </div>
  );
}

function UserPasswordRow({ user, updatePassword }: { user: User, updatePassword: (username: string, newPass: string) => void }) {
  const [draftPassword, setDraftPassword] = useState(user.password || '');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setDraftPassword(user.password || '');
  }, [user.password]);

  const handleUpdate = () => {
    updatePassword(user.username, draftPassword);
    alert('密码已修改');
  };

  const handleReset = () => {
    updatePassword(user.username, '123');
    setDraftPassword('123');
    alert('密码已重置为 123');
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 shrink-0">修改密码:</span>
        <div className="relative">
          <input 
            type={showPassword ? "text" : "password"}
            value={draftPassword} 
            onChange={(e) => setDraftPassword(e.target.value)} 
            className="bg-zinc-900 border border-zinc-700 rounded-md py-1.5 pl-2 pr-8 text-xs text-zinc-300 outline-none focus:border-[#00bcd4] w-36 transition-colors" 
            placeholder="设置密码" 
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showPassword ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            )}
          </button>
        </div>
        <button 
          onClick={handleUpdate}
          className="px-3 py-1.5 bg-[#00bcd4]/10 hover:bg-[#00bcd4]/20 border border-[#00bcd4]/30 rounded-md text-xs text-[#00bcd4] transition-colors"
        >
          确认
        </button>
        <button 
          onClick={handleReset}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 rounded-md text-xs text-zinc-300 transition-colors"
        >
          重置密码
        </button>
      </div>
      <span className="text-xs text-zinc-600 italic mt-2 md:mt-0">操作记录: {user.actions.length} 条</span>
    </div>
  );
}

function CanvasAppRoute({ usersDB, currentUser, onLogout, setUsersDB, addAction }: { usersDB: User[], currentUser: string, onLogout: () => void, setUsersDB: React.Dispatch<React.SetStateAction<User[]>>, addAction: (actionStr: string) => void }) {
  const [showUsers, setShowUsers] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const user = usersDB.find(u => u.username === currentUser);
  const isAdmin = user?.permissions?.isAdmin || false;
  
  const handleAddUser = () => {
    if (!newUsername.trim() || !newPassword.trim()) return;
    
    if (usersDB.some(u => u.username === newUsername)) {
      alert('用户名已存在');
      return;
    }
    
    UserService.createUser({
      username: newUsername,
      password: newPassword,
      displayName: newUsername,
      role: 'user',
    });
    
    setUsersDB(UserService.getUsers());
    setIsAddingUser(false);
    setNewUsername('');
    setNewPassword('');
  };

  const togglePermission = (username: string, field: 'workspace' | 'canvas' | 'isAdmin') => {
    const user = usersDB.find(u => u.username === username);
    if (!user || !user.permissions) return;
    UserService.updateUserByUsername(username, {
      permissions: {
        ...user.permissions,
        [field]: !user.permissions[field]
      }
    });
    setUsersDB(UserService.getUsers());
  };

  const updatePassword = (username: string, newPass: string) => {
    UserService.updateUserByUsername(username, { password: newPass });
    setUsersDB(UserService.getUsers());
  };

  useEffect(() => {
    addAction('进入了恐龙系统');
  }, []);

  const topControls = (
    <>
      {isAdmin && (
        <>
          <button 
            onClick={() => setShowStats(true)}
            className="px-4 py-2 bg-[#ff5722]/10 backdrop-blur-xl border border-[#ff5722]/30 hover:bg-[#ff5722]/20 rounded-2xl text-sm font-medium transition-colors flex items-center gap-2 text-[#ff5722]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            使用统计
          </button>
          <button 
            onClick={() => setShowUsers(true)}
            className="px-4 py-2 bg-[#1C1C1E]/80 backdrop-blur-xl border border-zinc-800/80 hover:bg-zinc-800 rounded-2xl text-sm font-medium transition-colors flex items-center gap-2 text-white"
          >
            <svg className="w-4 h-4 text-[#00bcd4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            用户管理
          </button>
        </>
      )}
      <button 
        onClick={onLogout}
        className="px-4 py-2 bg-[#1C1C1E]/80 backdrop-blur-xl border border-zinc-800/80 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400 rounded-2xl text-sm font-medium transition-colors text-white"
      >
        注销 ({currentUser})
      </button>
    </>
  );

  return (
    <>
      <div className="w-screen h-screen">
        <InfiniteCanvasWrapper renderTopRight={topControls} currentUser={currentUser} />
      </div>

      {showUsers && isAdmin && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6" onClick={() => setShowUsers(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-[#00bcd4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                系统权限与用户管理
              </h2>
              <button onClick={() => setShowUsers(false)} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <div className="flex justify-between items-center mb-2 px-2">
                <h3 className="font-semibold text-zinc-300">用户列表</h3>
                <button 
                  onClick={() => setIsAddingUser(!isAddingUser)}
                  className="px-3 py-1.5 bg-[#00bcd4]/10 hover:bg-[#00bcd4]/20 text-[#00bcd4] text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  {isAddingUser ? '取消新建' : '新建用户'}
                </button>
              </div>

              {isAddingUser && (
                <div className="bg-zinc-800/50 border border-[#00bcd4]/30 rounded-xl p-4 flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-zinc-400 block mb-1">用户名</label>
                    <input type="text" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#00bcd4]" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="输入新账号" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-zinc-400 block mb-1">初始密码</label>
                    <input type="text" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#00bcd4]" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="输入初始密码" />
                  </div>
                  <button 
                    onClick={handleAddUser}
                    className="px-6 py-2 bg-[#00bcd4] hover:bg-[#00a6bb] text-black font-semibold rounded-lg text-sm transition-colors h-[38px] flex items-center"
                  >
                    创建
                  </button>
                </div>
              )}

              {usersDB.map((user, idx) => (
                <div key={idx} className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 flex flex-col gap-4">
                  {/* Header info */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-3 border-b border-zinc-800/50 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-100 flex items-center gap-2">
                          {user.username}
                          {currentUser === user.username ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">在线</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700">离线</span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500">最后登录: {user.lastLogin}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-zinc-900 p-2 rounded-lg border border-zinc-800 flex-wrap">
                      <label className="flex items-center gap-2 cursor-pointer text-sm hidden">
                         <input type="password" value={user.password || ''} onChange={(e) => updatePassword(user.username, e.target.value)} className="w-24 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs outline-none" placeholder="修改密码" />
                      </label>
                      
                      <label className="flex items-center gap-2 cursor-pointer text-xs group">
                        <input type="checkbox" checked={user.permissions?.workspace} onChange={() => togglePermission(user.username, 'workspace')} className="accent-[#00bcd4] w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-600" />
                        <span className={`transition-colors ${user.permissions?.workspace ? 'text-[#00bcd4]' : 'text-zinc-500 group-hover:text-zinc-300'}`}>工作台权限</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs group">
                        <input type="checkbox" checked={user.permissions?.canvas} onChange={() => togglePermission(user.username, 'canvas')} className="accent-[#00bcd4] w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-600" />
                        <span className={`transition-colors ${user.permissions?.canvas ? 'text-[#00bcd4]' : 'text-zinc-500 group-hover:text-zinc-300'}`}>画布权限</span>
                      </label>
                      <div className="w-px h-4 bg-zinc-700 mx-1"></div>
                      <label className="flex items-center gap-2 cursor-pointer text-xs group">
                         <input type="checkbox" checked={user.permissions?.isAdmin} onChange={() => togglePermission(user.username, 'isAdmin')} disabled={user.username === 'admin'} className="accent-rose-500 w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-600" />
                         <span className={`transition-colors ${user.permissions?.isAdmin ? 'text-rose-400' : 'text-zinc-500 group-hover:text-zinc-300'} ${user.username === 'admin' ? 'opacity-50' : ''}`}>管理员</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Password row for admin view */}
                  <UserPasswordRow user={user} updatePassword={updatePassword} />
                  
                  {user.actions && user.actions.length > 0 && (
                    <div className="pl-1 space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-2 mt-2 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/50">
                      {user.actions.slice(0, 20).map((act) => (
                        <div key={act.id} className="flex gap-4 items-start text-xs group">
                          <div className="w-32 shrink-0 text-zinc-500 font-mono tracking-tight">{act.time}</div>
                          <div className="flex-1 text-zinc-300 group-hover:text-zinc-100 transition-colors flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00bcd4]/50"></div>
                            {act.action}
                          </div>
                        </div>
                      ))}
                      {user.actions && user.actions.length > 20 && <div className="text-xs text-zinc-600 italic">... 仅显示最近 20 条记录</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showStats && isAdmin && (
        <StatisticsOverlay users={usersDB} onClose={() => setShowStats(false)} />
      )}
    </>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem('dino_currentUser'));
  const [usersDB, setUsersDB] = useState<User[]>(() => UserService.getUsers());

  // We rely on UserService to persist users. Wait for currentUser changes to persist.
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('dino_currentUser', currentUser);
    } else {
      localStorage.removeItem('dino_currentUser');
    }
  }, [currentUser]);

  const addAction = (actionStr: string) => {
    if (!currentUser) return;
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    
    const user = UserService.getUserByUsername(currentUser);
    if (!user) return;
    
    UserService.updateUserByUsername(currentUser, {
      actions: [{ id: Date.now().toString() + Math.random(), time: timeStr, action: actionStr }, ...(user.actions || [])]
    });
    setUsersDB(UserService.getUsers());
  };

  const handleLogin = (username: string) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    
    const user = UserService.getUserByUsername(username);
    if (user) {
      UserService.updateUserByUsername(username, {
        status: 'active',
        lastLogin: timeStr,
        actions: [{ id: Date.now().toString() + Math.random(), time: timeStr, action: '登录了系统' }, ...(user.actions || [])]
      });
      setUsersDB(UserService.getUsers());
    }
    
    setCurrentUser(username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          currentUser ? <Navigate to="/app" replace /> : <LoginRoute onLogin={handleLogin} usersDB={usersDB} />
        } />
        <Route path="/app" element={
          currentUser ? <CanvasAppRoute usersDB={usersDB} currentUser={currentUser} onLogout={handleLogout} setUsersDB={setUsersDB} addAction={addAction} /> : <Navigate to="/" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

