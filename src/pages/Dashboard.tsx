import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { useAuthStore } from '@/auth/authStore';
import { useFileSystemStore } from '@/store/useFileSystemStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import {
  FolderOpen, Plus, Play, GitFork, RotateCcw,
  Sparkles, CheckCircle2, Layout, Database, ArrowRight,
  LogOut, ShieldAlert, Cpu, Heart, Check, Loader2, ArrowLeft,
  LayoutGrid, Blocks, UserCircle2
} from 'lucide-react';
import logoImage from '@/logo/image.png';

const Dashboard: React.FC = () => {
  const { user, logout, isMock } = useAuth();
  console.log("DASHBOARD PAGE LOADED, user:", user);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const { recentProjects, openFolder } = useFileSystemStore();
  const showToast = useNotificationStore((s) => s.showToast);
  const navigate = useNavigate();

  // Wizard state: 1 = Workspace Naming, 2 = AI Onboarding, 3 = Setup Process
  const [setupStep, setSetupStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState(user?.displayName ? `${user.displayName}'s Workspace` : 'MyWorkspace');
  const [preferredStack, setPreferredStack] = useState('Web Apps');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [interests, setInterests] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [logsComplete, setLogsComplete] = useState(false);
  const [cloningRepo, setCloningRepo] = useState(false);
  const [gitUrl, setGitUrl] = useState('');
  const [importPath, setImportPath] = useState('');
  const [newProjName, setNewProjName] = useState('');

  // Auto-redirect if somehow not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Log simulation during Step 3 Onboarding Setup
  useEffect(() => {
    if (setupStep === 3) {
      setLogs([]);
      setLogsComplete(false);
      const setupLogs = [
        'Creating secure local user record... Done.',
        `Setting workspace root to: c:/NexoWorkspaces/${workspaceName.replace(/\s+/g, '_')}... Done.`,
        'Configuring Llama 3.3 70B Instruct chat settings... Done.',
        'Calibrating Qwen Coder assistant models... Done.',
        'Initializing project-wide memory stores... Done.',
        'Indexing system config templates... Ready.',
        'Nexo OS successfully initialized! launching dashboard...'
      ];

      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < setupLogs.length) {
          setLogs((prev) => [...prev, setupLogs[currentIndex]]);
          currentIndex++;
        } else {
          clearInterval(interval);
          setLogsComplete(true);
        }
      }, 700);

      return () => clearInterval(interval);
    }
  }, [setupStep, workspaceName]);

  const handleFinishSetup = () => {
    // Save state to store
    completeOnboarding(workspaceName, {
      preferredStack,
      experienceLevel,
      interests
    });
    showToast('Onboarding setup complete!', 'success');
  };

  const handleOpenIDE = async (path: string) => {
    try {
      showToast(`Loading project: ${path.split(/[\\/]/).pop()}`, 'info');
      await openFolder(path);
      navigate('/ide');
    } catch (e) {
      showToast('Failed to open project workspace', 'error');
    }
  };

  const handleCreateNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    const sanitized = newProjName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const fullPath = `c:/NexoWorkspaces/${sanitized}`;
    try {
      showToast(`Creating folder ${sanitized}...`, 'info');
      await openFolder(fullPath);
      showToast(`Project created successfully!`, 'success');
      setNewProjName('');
      navigate('/ide');
    } catch (e) {
      showToast('Failed to create new project', 'error');
    }
  };

  const handleImportFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importPath.trim()) return;
    try {
      await openFolder(importPath.trim());
      showToast('Workspace imported successfully', 'success');
      setImportPath('');
      navigate('/ide');
    } catch (e) {
      showToast('Failed to import path directory', 'error');
    }
  };

  const handleCloneRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gitUrl.trim()) return;
    setCloningRepo(true);
    const repoName = gitUrl.split('/').pop()?.replace(/\.git$/, '') || 'cloned-repo';
    const targetPath = `c:/NexoWorkspaces/${repoName}`;
    
    showToast(`Cloning git repository: ${gitUrl}...`, 'info');
    
    // Simulate git clone logs delay
    setTimeout(async () => {
      try {
        await openFolder(targetPath);
        showToast('Repository cloned successfully!', 'success');
        setGitUrl('');
        setCloningRepo(false);
        navigate('/ide');
      } catch (e) {
        showToast('Failed to clone repository', 'error');
        setCloningRepo(false);
      }
    }, 2000);
  };

  const handleResetOnboarding = () => {
    if (confirm('Are you sure you want to reset your Onboarding profile and preferences?')) {
      const updatedUser = {
        ...user!,
        onboardingComplete: false,
        aiProfile: null
      };
      useAuthStore.getState().setUser(updatedUser);
      localStorage.setItem('nexo-session-user', JSON.stringify(updatedUser));
      setSetupStep(1);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  // If user object is not yet populated
  if (!user) {
    return (
      <div style={containerStyle}>
        <div style={glow1Style} />
        <div style={glow2Style} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 10 }}>
          <Loader2 size={32} style={{ color: '#06b6d4', animation: 'rotateSpinner 0.75s linear infinite' }} />
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>Loading Developer Workspace...</span>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes rotateSpinner {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  // If user hasn't completed onboarding, render the setup wizard
  if (!user.onboardingComplete) {
    return (
      <div style={containerStyle}>
        <div style={glow1Style} />
        <div style={glow2Style} />

        <div style={cardStyle}>
          {/* Logo Title */}
          <div style={logoHeaderStyle}>
            <img src={logoImage} alt="Nexo Logo" style={logoStyle} />
            <h1 style={titleStyle}>NEXO <span style={titleAccentStyle}>V3</span></h1>
            <p style={subtitleStyle}>Workspace AI Onboarding Setup</p>
          </div>

          {/* Stepper dots */}
          <div style={stepperStyle}>
            <div style={{ ...stepDotStyle, background: setupStep >= 1 ? '#06b6d4' : '#1f2937' }} />
            <div style={{ ...stepDotStyle, background: setupStep >= 2 ? '#06b6d4' : '#1f2937' }} />
            <div style={{ ...stepDotStyle, background: setupStep >= 3 ? '#06b6d4' : '#1f2937' }} />
          </div>

          {/* STEP 1: Workspace Naming */}
          {setupStep === 1 && (
            <div style={wizardStepContainer}>
              <h2 style={sectionTitleStyle}>1. Set Personal Workspace</h2>
              <p style={infoTextClass}>Name your local developer namespace workspace folder. Nexo stores project indices here.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', marginBottom: '20px' }}>
                <label style={inputLabelStyle}>Workspace Name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. Chetan's Workspace"
                  style={inputStyle}
                />
              </div>

              <button
                onClick={() => setSetupStep(2)}
                disabled={!workspaceName.trim()}
                style={primaryBtnStyle}
              >
                Continue Setup <ArrowRight size={14} style={{ marginLeft: '6px' }} />
              </button>
            </div>
          )}

          {/* STEP 2: AI Onboarding */}
          {setupStep === 2 && (
            <div style={wizardStepContainer}>
              <h2 style={sectionTitleStyle}>2. Initialize AI Developer Profile</h2>
              <p style={infoTextClass}>Choose your preferred developer environment options to calibrate assistant context layers.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', marginBottom: '24px' }}>
                <div>
                  <label style={inputLabelStyle}>What do you build?</label>
                  <div style={stackGridStyle}>
                    {['Web Apps', 'Mobile Apps', 'Games', 'AI Apps'].map((stack) => (
                      <div
                        key={stack}
                        onClick={() => setPreferredStack(stack)}
                        style={{
                          ...stackCardStyle,
                          borderColor: preferredStack === stack ? '#06b6d4' : 'rgba(255,255,255,0.05)',
                          background: preferredStack === stack ? 'rgba(6, 182, 212, 0.05)' : 'rgba(31, 41, 55, 0.25)',
                        }}
                      >
                        <Sparkles size={12} color={preferredStack === stack ? '#06b6d4' : '#4b5563'} />
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{stack}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={inputLabelStyle}>Experience Level</label>
                  <div style={levelRowStyle}>
                    {['Beginner', 'Intermediate', 'Expert'].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setExperienceLevel(lvl)}
                        style={{
                          ...levelBtnStyle,
                          borderColor: experienceLevel === lvl ? '#8b5cf6' : '#1f2937',
                          color: experienceLevel === lvl ? '#c084fc' : '#9ca3af',
                          background: experienceLevel === lvl ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button onClick={() => setSetupStep(1)} style={secondaryBtnStyle}>
                  <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Back
                </button>
                <button onClick={() => setSetupStep(3)} style={primaryBtnStyle}>
                  Build Workspace <ArrowRight size={14} style={{ marginLeft: '6px' }} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Setup Engine Process */}
          {setupStep === 3 && (
            <div style={wizardStepContainer}>
              <h2 style={sectionTitleStyle}>3. Configuring Environment</h2>
              
              <div style={logsContainerStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {logs.map((log, i) => (
                    <div key={i} style={logLineStyle}>
                      <span style={{ color: '#06b6d4', marginRight: '6px' }}>&gt;</span>
                      {log}
                    </div>
                  ))}
                  {!logsComplete && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6366f1', fontSize: '11px', marginTop: '4px' }}>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Configuring core agents...</span>
                    </div>
                  )}
                </div>
              </div>

              {logsComplete && (
                <button onClick={handleFinishSetup} style={finishBtnStyle}>
                  Launch NEXO Developer Dashboard <CheckCircle2 size={14} style={{ marginLeft: '6px' }} />
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    );
  }

  // RETURNED USER: Antigravity-Style Dashboard
  const lastWorkspace = localStorage.getItem('nexo-last-workspace');

  return (
    <div className="bg-[#10141a] text-[#dfe2eb] font-sans h-screen flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="flex flex-col h-full bg-surface-container-low border-r border-outline-variant w-sidebar-width py-container-padding gap-element-gap">
        <div className="px-4 mb-4 flex items-center gap-3">
          <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
            <Cpu size={14} className="text-on-primary" />
          </div>
          <span className="font-headline-sm text-headline-sm font-bold text-primary">NEXO V3</span>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          <button className="flex items-center gap-3 px-4 py-2 text-primary border-l-2 border-primary bg-primary-container/10 transition-all font-label-md text-label-md">
            <FolderOpen size={16} />
            <span>Explorer</span>
          </button>
          <button onClick={() => navigate('/ide')} className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-label-md text-label-md">
            <Search size={16} />
            <span>Search</span>
          </button>
          <button onClick={() => navigate('/ide')} className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-label-md text-label-md">
            <LayoutGrid size={16} />
            <span>Source Control</span>
          </button>
          <button onClick={() => navigate('/chat')} className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-label-md text-label-md">
            <Sparkles size={16} />
            <span>AI Chat</span>
          </button>
          <button onClick={() => navigate('/ide')} className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-label-md text-label-md">
            <Cpu size={16} />
            <span>Agents</span>
          </button>
          <button onClick={() => navigate('/ide')} className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-label-md text-label-md">
            <Database size={16} />
            <span>Project Brain</span>
          </button>
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          <button className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-label-md text-label-md">
            <Blocks size={16} />
            <span>Extensions</span>
          </button>
          <button onClick={handleResetOnboarding} className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-label-md text-label-md">
            <RotateCcw size={16} />
            <span>Reset Profile</span>
          </button>
          <div className="px-4 py-4 mt-2 border-t border-outline-variant flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
              {user?.photoURL ? (
                <img className="w-full h-full object-cover" src={user.photoURL} alt="Avatar" />
              ) : (
                <UserCircle2 size={24} className="text-on-surface-variant" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface">{user.displayName || 'Developer'}</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Premium Plan</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#10141a]">
        {/* Top Toolbar */}
        <header className="flex items-center w-full px-container-padding gap-element-gap bg-surface border-b border-outline-variant h-toolbar-height shrink-0">
          <div className="flex gap-4 items-center">
            <div className="flex gap-3">
              <span className="text-on-surface-variant font-body-sm text-body-sm hover:text-on-surface cursor-default">File</span>
              <span className="text-on-surface-variant font-body-sm text-body-sm hover:text-on-surface cursor-default">Edit</span>
              <span className="text-on-surface-variant font-body-sm text-body-sm hover:text-on-surface cursor-default">View</span>
              <span className="text-on-surface-variant font-body-sm text-body-sm hover:text-on-surface cursor-default">Go</span>
              <span className="text-on-surface-variant font-body-sm text-body-sm hover:text-on-surface cursor-default">Run</span>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-surface-container px-3 py-1 rounded border border-outline-variant text-[11px] text-on-surface-variant flex items-center gap-2">
              <Search size={14} />
              <span>Search files, commands, and templates...</span>
              <span className="ml-4 opacity-50">Ctrl+P</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span onClick={logout} title="Logout" className="material-symbols-outlined text-on-surface-variant hover:text-red-400 cursor-pointer">logout</span>
          </div>
        </header>

        {/* Scrollable Content */}
        <section className="flex-1 overflow-y-auto no-scrollbar p-8">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Hero Section */}
            <div>
              <h1 className="font-headline-sm text-4xl font-extrabold tracking-tight text-on-surface mb-2">
                Welcome back, {user.displayName?.split(' ')?.[0] || 'Developer'}
              </h1>
              <p className="text-on-surface-variant font-body-md">Pick up where you left off or start something new with AI assistance.</p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Large Card: Continue Last Project */}
              <div 
                onClick={() => lastWorkspace && handleOpenIDE(lastWorkspace)}
                className={`md:col-span-2 group relative overflow-hidden bg-surface-container rounded-lg border border-outline-variant p-6 flex flex-col justify-between hover:border-primary/50 transition-colors cursor-pointer ${!lastWorkspace ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">Recent Session</span>
                    <h3 className="font-headline-sm text-xl text-on-surface">
                      {lastWorkspace ? lastWorkspace.split(/[\\/]/).pop() : 'No active session'}
                    </h3>
                    <p className="text-on-surface-variant text-body-sm mt-1">
                      {lastWorkspace || 'Open a project to begin'}
                    </p>
                  </div>
                  <Play size={20} className="text-primary group-hover:scale-110 transition-transform" />
                </div>
                <div className="mt-8 flex items-center justify-between">
                  <span className="text-body-sm text-on-surface-variant">Last active recently</span>
                  <button className="bg-primary text-on-primary px-4 py-1.5 rounded font-label-md text-label-md flex items-center gap-2">
                    Continue <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Action Form Cards */}
              <div className="bg-surface-container rounded-lg border border-outline-variant p-5 flex flex-col justify-between hover:bg-surface-container-high transition-colors">
                <form onSubmit={handleCreateNewProject} className="flex flex-col h-full justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <span className="font-label-md text-on-surface font-semibold">New Project</span>
                    <input 
                      type="text" 
                      placeholder="Folder Name"
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      className="bg-background border border-outline-variant rounded p-1.5 text-xs text-on-surface outline-none w-full"
                    />
                  </div>
                  <button type="submit" className="bg-primary text-on-primary py-1 px-3 rounded text-xs font-label-md flex items-center justify-center gap-1">
                    <Plus size={14} /> Create
                  </button>
                </form>
              </div>

              <div className="bg-surface-container rounded-lg border border-outline-variant p-5 flex flex-col justify-between hover:bg-surface-container-high transition-colors">
                <form onSubmit={handleImportFolder} className="flex flex-col h-full justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <span className="font-label-md text-on-surface font-semibold">Import Folder</span>
                    <input 
                      type="text" 
                      placeholder="Local Path (e.g. D:\Projects\App)"
                      value={importPath}
                      onChange={(e) => setImportPath(e.target.value)}
                      className="bg-background border border-outline-variant rounded p-1.5 text-xs text-on-surface outline-none w-full"
                    />
                  </div>
                  <button type="submit" className="bg-purple text-on-primary py-1 px-3 rounded text-xs font-label-md flex items-center justify-center gap-1">
                    <FolderOpen size={13} /> Open Folder
                  </button>
                </form>
              </div>

              <div className="bg-surface-container rounded-lg border border-outline-variant p-5 flex flex-col justify-between hover:bg-surface-container-high transition-colors">
                <form onSubmit={handleCloneRepo} className="flex flex-col h-full justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <span className="font-label-md text-on-surface font-semibold">Clone Repository</span>
                    <input 
                      type="text" 
                      placeholder="Git Clone URL"
                      value={gitUrl}
                      onChange={(e) => setGitUrl(e.target.value)}
                      disabled={cloningRepo}
                      className="bg-background border border-outline-variant rounded p-1.5 text-xs text-on-surface outline-none w-full"
                    />
                  </div>
                  <button type="submit" disabled={cloningRepo} className="bg-blue-500 text-on-primary py-1 px-3 rounded text-xs font-label-md flex items-center justify-center gap-1">
                    {cloningRepo ? <Loader2 size={13} className="animate-spin" /> : <GitFork size={13} />} Clone
                  </button>
                </form>
              </div>
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Recent Projects */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-sm text-lg text-on-surface">Recent Projects</h2>
                </div>
                <div className="space-y-px rounded-lg border border-outline-variant overflow-hidden bg-outline-variant/20">
                  {recentProjects.length > 0 ? (
                    recentProjects.map((path) => {
                      const name = path.split(/[\\/]/).pop() || path;
                      return (
                        <div 
                          key={path}
                          onClick={() => handleOpenIDE(path)}
                          className="flex items-center justify-between p-4 bg-surface hover:bg-surface-container-high transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 flex items-center justify-center bg-surface-container-highest rounded border border-outline-variant">
                              <FolderOpen size={16} className="text-primary" />
                            </div>
                            <div>
                              <div className="font-label-md text-on-surface">{name}</div>
                              <div className="text-[11px] text-on-surface-variant font-code-sm">{path}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <span className="text-[11px] text-on-surface-variant uppercase tracking-tighter">Project</span>
                            <Play size={12} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-on-surface-variant text-sm italic bg-surface">
                      No recent project history. Build or import a project folder.
                    </div>
                  )}
                </div>
              </div>

              {/* AI Templates */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-sm text-lg text-on-surface">AI Templates</h2>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-surface-container border border-outline-variant rounded-lg hover:border-primary/30 transition-all cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Sparkles className="text-primary" size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="font-label-md text-on-surface font-semibold">Next.js + Tailwind</div>
                        <p className="text-[11px] text-on-surface-variant mt-1">Full-stack with Auth & DB pre-configured.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-surface-container border border-outline-variant rounded-lg hover:border-tertiary/30 transition-all cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                        <Database className="text-tertiary" size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="font-label-md text-on-surface font-semibold">Python Microservice</div>
                        <p className="text-[11px] text-on-surface-variant mt-1">FastAPI with Redis caching and Docker.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-surface-container border border-outline-variant rounded-lg hover:border-on-surface/30 transition-all cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded bg-on-surface/5 flex items-center justify-center border border-on-surface/10">
                        <Cpu className="text-on-surface-variant" size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="font-label-md text-on-surface font-semibold">Rust CLI Tool</div>
                        <p className="text-[11px] text-on-surface-variant mt-1">Optimized binary scaffolding with Clap.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-primary-container/5 border border-primary/20 flex flex-col gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Pro Tip</span>
                  <p className="text-[12px] text-on-surface leading-relaxed">Type <code className="bg-surface-container-highest px-1 rounded text-primary">nexo-ai gen [idea]</code> in any terminal to bootstrap instantly.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Status Bar */}
        <footer className="h-6 bg-primary border-t border-outline-variant flex items-center justify-between px-3 text-[10px] text-on-primary select-none shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <RotateCcw size={12} className="animate-spin" style={{ animationDuration: '3s' }} />
              <span>Ready</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork size={12} />
              <span>main</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span>UTF-8</span>
            <span>Space: 4</span>
            <span>v3.0.4-stable</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

// Vanilla styling configuration
const containerStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  width: '100vw',
  background: '#070a0f',
  color: '#e2e8f0',
  fontFamily: "'Inter', sans-serif",
  overflowY: 'auto',
  boxSizing: 'border-box',
  padding: '24px 0',
};

const glow1Style: React.CSSProperties = {
  position: 'fixed',
  top: '10%',
  left: '10%',
  width: '600px',
  height: '600px',
  background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, rgba(0,0,0,0) 70%)',
  borderRadius: '50%',
  filter: 'blur(80px)',
  pointerEvents: 'none',
  zIndex: 1,
};

const glow2Style: React.CSSProperties = {
  position: 'fixed',
  bottom: '10%',
  right: '10%',
  width: '600px',
  height: '600px',
  background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, rgba(0,0,0,0) 70%)',
  borderRadius: '50%',
  filter: 'blur(80px)',
  pointerEvents: 'none',
  zIndex: 1,
};

const cardStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  width: '420px',
  background: 'rgba(17, 24, 39, 0.55)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: '16px',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 50px rgba(6, 182, 212, 0.01)',
  padding: '32px',
  zIndex: 10,
};

const logoHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  marginBottom: '20px',
};

const logoStyle: React.CSSProperties = {
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  marginBottom: '10px',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '22px',
  fontWeight: 900,
  letterSpacing: '0.06em',
  color: '#ffffff',
};

const titleAccentStyle: React.CSSProperties = {
  background: 'linear-gradient(to right, #06b6d4, #8b5cf6)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const subtitleStyle: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: '11.5px',
  color: '#8b949e',
};

const stepperStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '8px',
  marginBottom: '24px',
};

const stepDotStyle: React.CSSProperties = {
  width: '24px',
  height: '4px',
  borderRadius: '2px',
  transition: 'background 200ms ease',
};

const wizardStepContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '15px',
  fontWeight: 700,
  color: '#ffffff',
  textAlign: 'center',
  letterSpacing: '0.02em',
};

const infoTextClass: React.CSSProperties = {
  margin: '0 0 20px 0',
  fontSize: '12px',
  color: '#8b949e',
  textAlign: 'center',
  lineHeight: '1.5',
};

const inputLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#4b5563',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '38px',
  background: '#0d1117',
  border: '1px solid #1f2937',
  borderRadius: '6px',
  color: '#e2e8f0',
  fontSize: '13px',
  padding: '0 12px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 150ms',
};

const stackGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px',
  width: '100%',
};

const stackCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 12px',
  border: '1px solid',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 120ms ease',
};

const levelRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '6px',
  width: '100%',
};

const levelBtnStyle: React.CSSProperties = {
  height: '34px',
  border: '1px solid',
  borderRadius: '6px',
  fontSize: '11.5px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 120ms ease',
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '40px',
  background: '#06b6d4',
  border: 'none',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'background 120ms',
};

const secondaryBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '80px',
  height: '40px',
  background: 'transparent',
  border: '1px solid #1f2937',
  borderRadius: '8px',
  color: '#9ca3af',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 120ms',
};

const finishBtnStyle: React.CSSProperties = {
  ...primaryBtnStyle,
  background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
};

const logsContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '180px',
  background: '#0d1117',
  border: '1px solid #1f2937',
  borderRadius: '8px',
  padding: '12px',
  boxSizing: 'border-box',
  overflowY: 'auto',
  marginBottom: '20px',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '11px',
};

const logLineStyle: React.CSSProperties = {
  color: '#e2e8f0',
  lineHeight: '1.6',
};

// Dashboard Styles
const dashboardContainerStyle: React.CSSProperties = {
  width: '880px',
  display: 'flex',
  flexDirection: 'column',
  padding: '0 24px',
  zIndex: 10,
  boxSizing: 'border-box',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '56px',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  marginBottom: '24px',
};

const logoutBtnStyle: React.CSSProperties = {
  background: 'rgba(239, 68, 68, 0.08)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  borderRadius: '8px',
  color: '#ef4444',
  width: '28px',
  height: '28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 120ms',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '24px',
};

const sessionCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
  border: '1px solid rgba(6, 182, 212, 0.2)',
  borderRadius: '12px',
  padding: '16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
};

const launchIDEBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  height: '38px',
  padding: '0 16px',
  background: '#06b6d4',
  border: 'none',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '12.5px',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
};

const dashboardSectionBox: React.CSSProperties = {
  background: 'rgba(17, 24, 39, 0.55)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: '12px',
  padding: '18px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
};

const boxTitleStyle: React.CSSProperties = {
  margin: '0 0 14px 0',
  fontSize: '11px',
  fontWeight: 800,
  color: '#4b5563',
  letterSpacing: '0.08em',
};

const listContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  maxHeight: '260px',
  overflowY: 'auto',
};

const projectListItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 12px',
  border: '1px solid #1f2937',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 120ms ease',
};

const actionLabelStyle: React.CSSProperties = {
  fontSize: '10.5px',
  fontWeight: 700,
  color: '#4b5563',
  marginBottom: '4px',
};

const actionInputStyle: React.CSSProperties = {
  flex: 1,
  height: '32px',
  background: '#0d1117',
  border: '1px solid #1f2937',
  borderRadius: '6px',
  color: '#e2e8f0',
  fontSize: '12px',
  padding: '0 10px',
  outline: 'none',
};

const actionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  height: '32px',
  padding: '0 12px',
  border: 'none',
  borderRadius: '6px',
  fontSize: '11.5px',
  fontWeight: 700,
  cursor: 'pointer',
};

const prefRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
};

const prefColStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.01)',
  border: '1px solid #1f2937',
  borderRadius: '8px',
  padding: '10px',
};

const prefLabelClass: React.CSSProperties = {
  display: 'block',
  fontSize: '9px',
  fontWeight: 800,
  color: '#4b5563',
  letterSpacing: '0.04em',
  marginBottom: '2px',
};

const prefValueClass: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#e2e8f0',
};

const resetBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #1f2937',
  borderRadius: '6px',
  color: '#9ca3af',
  padding: '5px 10px',
  fontSize: '10.5px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  transition: 'all 120ms',
};

export default Dashboard;
