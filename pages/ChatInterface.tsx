
import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Download, Sparkles, Globe, RefreshCw, ChevronDown, Trash2, Settings, X, FileCode, Monitor, CheckCircle, Key, AlertTriangle, Cpu, MessageCircle, FileText, ChevronRight } from 'lucide-react';
import JSZip from 'jszip';
import { Message, CompanionState, WebsiteContent } from '../types';
import Avatar from '../components/Avatar';
// Fixed the missing member error by ensuring geminiService now exports AVAILABLE_MODELS
import { generateResponse, AVAILABLE_MODELS, DEFAULT_SYSTEM_INSTRUCTION } from '../services/geminiService';

const ChatInterface: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(() => localStorage.getItem('nexo_has_started') === 'true');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [state, setState] = useState<CompanionState>(CompanionState.IDLE);
  const [showSettings, setShowSettings] = useState(false);
  const [currentContent, setCurrentContent] = useState<WebsiteContent | null>(null);
  
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'chat'>('chat');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentContent && !selectedFileName) {
        setSelectedFileName(currentContent.mainFile);
    }
  }, [currentContent]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages, state]);

  const handleSendMessage = async (textOverride?: string) => {
    const text = textOverride || inputText;
    if (!text.trim() || state !== CompanionState.IDLE) return;

    setMessages(prev => [...prev, { role: 'user', text, timestamp: Date.now() }]);
    setInputText('');
    if (!hasStarted) setHasStarted(true);
    
    setState(CompanionState.THINKING);
    // Updated to use 'gemini-3-pro-preview' as per guidelines for complex coding tasks
    // Passing setState as the onStateChange callback to enable the BUILDING animation during generation
    const response = await generateResponse(messages, text, 'gemini-3-pro-preview', setState);
    
    if (response.websiteContent) {
        setCurrentContent(response.websiteContent);
        setPreviewKey(k => k + 1);
        setActiveTab('preview');
    }

    setMessages(prev => [...prev, { 
        role: 'model', 
        text: response.text, 
        timestamp: Date.now(), 
        websiteContent: response.websiteContent,
        isError: response.isError 
    }]);
    setState(CompanionState.IDLE);
  };

  const downloadZip = async () => {
    if (!currentContent) return;
    const zip = new JSZip();
    Object.entries(currentContent.files).forEach(([name, code]) => zip.file(name, code));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nexo_project.zip";
    a.click();
  };

  const generatePreviewDoc = () => {
    if (!currentContent) return '';
    const files = currentContent.files;
    const isReact = Object.keys(files).some(f => f.endsWith('.tsx'));

    if (!isReact) {
        // Native Mode (HTML/JS/CSS)
        const html = files['index.html'] || '<html><body><h1>No index.html found</h1></body></html>';
        const css = files['styles.css'] || files['style.css'] || '';
        const js = files['script.js'] || files['main.js'] || '';
        
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>${css}</style>
                </head>
                <body>
                    ${html.includes('<body>') ? html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || html : html}
                    <script>${js}</script>
                </body>
            </html>
        `;
    }

    // React Mode
    const appCode = files['App.tsx'] || Object.values(files)[0];
    return `
        <!DOCTYPE html>
        <html>
            <head>
                <script src="https://cdn.tailwindcss.com"></script>
                <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
                <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
                <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
                <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>
                <style>body { font-family: sans-serif; }</style>
            </head>
            <body>
                <div id="root"></div>
                <script type="text/babel" data-presets="react,typescript">
                    const { useState, useEffect, useRef } = React;
                    const { motion, AnimatePresence } = FramerMotion;
                    ${appCode}
                    const root = ReactDOM.createRoot(document.getElementById('root'));
                    root.render(<App />);
                </script>
            </body>
        </html>
    `;
  };

  if (!hasStarted) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white p-6">
        <div className="max-w-2xl w-full space-y-8 text-center animate-in fade-in zoom-in duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Multi-File IDE • OpenLovable Clone</span>
          </div>
          <h1 className="text-6xl font-black tracking-tight leading-none">
            Build projects <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-amber-300">at light speed.</span>
          </h1>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl">
            <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="What are we building? (e.g., 'A multi-page React dashboard' or 'A simple landing page')"
                className="w-full bg-transparent border-none text-xl text-white placeholder-stone-600 focus:ring-0 resize-none h-32"
            />
            <div className="flex justify-end pt-4">
                <button onClick={() => handleSendMessage()} className="bg-white text-black px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-stone-200 transition-all">
                    Generate <ChevronRight className="w-4 h-4" />
                </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-4rem)] flex flex-col bg-stone-50 overflow-hidden font-sans">
      {/* Navbar */}
      <div className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white"><Terminal className="w-5 h-5" /></div>
            <div>
                <h2 className="text-sm font-black tracking-tight">NEXO WORKSPACE</h2>
                <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${state === CompanionState.IDLE ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></span>
                    {state}
                </div>
            </div>
        </div>
        
        <div className="hidden lg:flex bg-stone-100 p-1 rounded-xl border border-stone-200">
            {['preview', 'code'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setActiveTab(t as any)}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white shadow-sm text-black' : 'text-stone-400 hover:text-stone-600'}`}
                >
                    {t}
                </button>
            ))}
        </div>

        <div className="flex items-center gap-3">
            <button onClick={downloadZip} className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-[10px] font-black uppercase transition-all">
                <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2.5 hover:bg-stone-100 rounded-xl text-stone-400"><Settings className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        <div className={`flex-1 flex flex-col bg-white transition-all duration-300 ${activeTab === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
            {activeTab === 'preview' ? (
                <div className="flex-1 flex flex-col">
                    <div className="h-10 bg-stone-50 border-b border-stone-200 flex items-center justify-between px-4">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400">
                            <Globe className="w-3 h-3" /> sandbox:3000
                        </div>
                        <button onClick={() => setPreviewKey(k => k + 1)} className="p-1 hover:bg-stone-200 rounded"><RefreshCw className="w-3.5 h-3.5 text-stone-400" /></button>
                    </div>
                    <iframe key={previewKey} title="Preview" className="flex-1 border-none" srcDoc={generatePreviewDoc()} />
                </div>
            ) : (
                <div className="flex-1 flex overflow-hidden">
                    {/* File Explorer Sidebar */}
                    <div className="w-64 bg-stone-50 border-r border-stone-200 flex flex-col">
                        <div className="p-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-200">Files</div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {currentContent && Object.keys(currentContent.files).map(filename => (
                                <button 
                                    key={filename}
                                    onClick={() => setSelectedFileName(filename)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedFileName === filename ? 'bg-black text-white' : 'text-stone-600 hover:bg-stone-200'}`}
                                >
                                    <FileCode className="w-4 h-4 opacity-50" />
                                    {filename}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Code Editor */}
                    <div className="flex-1 bg-[#0d0d0d] relative">
                        <div className="absolute top-4 right-6 text-[10px] font-black text-white/20 uppercase tracking-widest">{selectedFileName}</div>
                        <textarea 
                            value={currentContent?.files[selectedFileName || ''] || ''}
                            readOnly
                            className="w-full h-full bg-transparent text-indigo-300/90 font-mono text-sm p-8 outline-none resize-none leading-relaxed"
                            spellCheck={false}
                        />
                    </div>
                </div>
            )}
        </div>

        {/* Chat Sidebar */}
        <div className={`w-full lg:w-[450px] bg-white border-l border-stone-200 flex flex-col relative z-30 transition-transform ${activeTab === 'chat' ? 'translate-x-0' : 'lg:translate-x-0 translate-x-full absolute inset-0 lg:static'}`}>
            <div className="h-16 border-b border-stone-100 flex items-center justify-between px-6 shrink-0">
                <span className="font-bold text-sm">Builder Chat</span>
                <button onClick={() => setActiveTab('preview')} className="lg:hidden p-2"><X className="w-5 h-5 text-stone-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50/50">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                        <div className={`max-w-[90%] p-4 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-black text-white rounded-3xl rounded-tr-none' : 'bg-white text-stone-800 border border-stone-200 rounded-3xl rounded-tl-none'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {state === CompanionState.THINKING && (
                    <div className="flex justify-start items-center gap-3 text-stone-400 text-xs font-bold uppercase tracking-widest px-4">
                        <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
                        Generating Files...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-6 bg-white border-t border-stone-100">
                <div className="flex items-center bg-stone-50 rounded-2xl border border-stone-200 focus-within:ring-2 focus-within:ring-black/5 transition-all">
                    <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder="Change the button color to blue..."
                        className="w-full bg-transparent p-4 outline-none resize-none h-[60px] text-sm"
                        rows={1}
                    />
                    <button onClick={() => handleSendMessage()} className="p-3 mr-2 bg-black text-white rounded-xl hover:opacity-80 transition-opacity">
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
