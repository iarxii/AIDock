import { useState, useEffect, useRef } from 'react';
import { 
  Send, Terminal, Database, Cpu, Activity, User, Sparkles, 
  Download, FileText, ChevronDown, Save, X, Edit, FileCode 
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  workspaceUsed?: string;
  latencyMs?: number;
}

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [loading, setLoading] = useState(false);
  const [connected] = useState(true);
  
  // Latency timer state
  const [elapsedMs, setElapsedMs] = useState(0);
  
  // Export states
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isTextEditorOpen, setIsTextEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [editorFilename, setEditorFilename] = useState('chat_export.md');
  const [editorFormat, setEditorFormat] = useState<'markdown' | 'json'>('markdown');
  const [editorSaved, setEditorSaved] = useState(true);
  const [saveStatusText, setSaveStatusText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Click outside to close export dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Latency timer ticker
  useEffect(() => {
    let intervalId: any;
    if (loading) {
      const startTime = Date.now();
      setElapsedMs(0);
      intervalId = setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 43); // Update ~23 times a second for high-res ticking
    } else {
      setElapsedMs(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loading]);

  // Scroll synchronization for editor line numbers
  const handleEditorScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Helper: Generate exports
  const generateMarkdown = (msgs: Message[]) => {
    let md = `# AIDock Chat Export\n`;
    md += `**Session ID:** \`${sessionId}\`\n`;
    md += `**Export Date:** ${new Date().toLocaleString()}\n\n`;
    md += `---\n\n`;
    msgs.forEach(msg => {
      const role = msg.sender === 'user' ? 'User' : 'AIDock';
      const latencyStr = msg.latencyMs ? ` (Latency: ${(msg.latencyMs / 1000).toFixed(2)}s)` : '';
      md += `## ${role}${latencyStr}\n\n`;
      md += `${msg.content}\n\n`;
      if (msg.workspaceUsed) {
        md += `*Workspace: ${msg.workspaceUsed}*\n\n`;
      }
      md += `---\n\n`;
    });
    return md.trim();
  };

  const generateJSON = (msgs: Message[]) => {
    const data = {
      session_id: sessionId,
      export_date: new Date().toISOString(),
      messages: msgs.map(msg => ({
        id: msg.id,
        sender: msg.sender,
        content: msg.content,
        workspace_used: msg.workspaceUsed,
        latency_ms: msg.latencyMs
      }))
    };
    return JSON.stringify(data, null, 2);
  };

  // Actions
  const triggerDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const saveToWorkspace = async (content: string, filename: string) => {
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          filename,
          content
        })
      });
      if (!res.ok) {
        throw new Error('Save to workspace failed');
      }
      setEditorSaved(true);
      setSaveStatusText('Saved successfully to workspace!');
      setTimeout(() => setSaveStatusText(''), 3000);
    } catch (err: any) {
      alert(`Error saving to workspace: ${err.message}`);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage: Message = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      content: input,
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, session_id: sessionId })
      });
      
      if (!res.ok) {
        let errorDetail = 'API server returned error';
        try {
          const errData = await res.json();
          if (errData && errData.detail) {
            errorDetail = errData.detail;
          }
        } catch (_) {}
        throw new Error(errorDetail);
      }
      
      const data = await res.json();
      const endTime = Date.now();
      
      const botMessage: Message = {
        id: `msg_${Date.now()}_b`,
        sender: 'bot',
        content: data.response,
        workspaceUsed: data.workspace_used,
        latencyMs: endTime - startTime
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      const isConnectionError = err.message === 'Failed to fetch';
      const errorMessage: Message = {
        id: `msg_${Date.now()}_e`,
        sender: 'bot',
        content: isConnectionError
          ? 'Error: Failed to connect to AIDock backend. Ensure the Docker containers are healthy.'
          : `Error: ${err.message || 'An unknown error occurred.'}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#C8CDD5] text-[#1A1D2E]">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-[#D8DCE4]/80 backdrop-blur-md border-b border-black/5 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fd3b12] flex items-center justify-center text-white shadow-[0_4px_20px_rgba(253,59,18,0.35)]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1A1D2E]">AIDOCK</h1>
            <span className="text-[10px] text-[#7A7D8E] font-medium tracking-widest uppercase">Orchestrator v2.0</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#E8ECF2] px-3 py-1.5 rounded-full border border-black/5">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs font-semibold text-[#4A4D5E]">
              {connected ? 'Neural Link Active' : 'Offline'}
            </span>
          </div>
          <div className="text-xs text-[#7A7D8E]">
            Session ID: <span className="font-mono bg-[#BFC4CC]/50 px-2 py-0.5 rounded text-[#1A1D2E] font-semibold">{sessionId}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Sidebar Info */}
        <section className={`${isTextEditorOpen ? 'lg:col-span-3' : 'lg:col-span-3'} flex flex-col gap-6 transition-all duration-300`}>
          <div className="bg-[#D8DCE4] rounded-2xl border border-black/5 p-5 shadow-lg flex flex-col gap-4">
            <h2 className="text-sm font-bold text-[#1A1D2E] uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#fd3b12]" /> Workspace Context
            </h2>
            
            <div className="space-y-3">
              <div className="bg-[#E8ECF2] p-3 rounded-xl border border-black/5">
                <span className="text-[10px] text-[#7A7D8E] block uppercase font-medium">Mount Point</span>
                <span className="text-xs font-mono font-semibold text-[#4A4D5E] break-all">/workspace/{sessionId}</span>
              </div>

              <div className="bg-[#E8ECF2] p-3 rounded-xl border border-black/5">
                <span className="text-[10px] text-[#7A7D8E] block uppercase font-medium">Orchestrator LLM</span>
                <span className="text-xs font-semibold text-[#4A4D5E] flex items-center gap-1.5 mt-1">
                  <Database className="w-3.5 h-3.5 text-[#fd3b12]" /> DeepSeek-R1-Distill-Llama
                </span>
              </div>

              <div className="bg-[#E8ECF2] p-3 rounded-xl border border-black/5">
                <span className="text-[10px] text-[#7A7D8E] block uppercase font-medium">Docker Network</span>
                <span className="text-xs font-semibold text-[#4A4D5E] flex items-center gap-1.5 mt-1">
                  <Activity className="w-3.5 h-3.5 text-[#fd3b12]" /> aidock_default
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#D8DCE4] rounded-2xl border border-black/5 p-5 shadow-lg flex flex-col gap-3">
            <h2 className="text-sm font-bold text-[#1A1D2E] uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#fd3b12]" /> Available Capabilities
            </h2>
            <ul className="text-xs text-[#4A4D5E] space-y-2 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fd3b12]" /> File Reader / Writer
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fd3b12]" /> Sandboxed Code execution
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fd3b12]" /> Multi-agent reasoning loops
              </li>
            </ul>
          </div>
        </section>

        {/* Middle column: Chat Area */}
        <section className={`${isTextEditorOpen ? 'lg:col-span-5' : 'lg:col-span-9'} flex flex-col h-[calc(100vh-140px)] min-h-[500px] transition-all duration-300`}>
          <div className="flex-1 bg-[#D8DCE4]/60 backdrop-blur-md rounded-2xl border border-black/5 shadow-2xl p-6 flex flex-col overflow-hidden">
            
            {/* Chat Area Header with Export Menu */}
            <div className="flex items-center justify-between pb-4 border-b border-black/5 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-[#1A1D2E] tracking-wide uppercase">Active Session Stream</span>
              </div>
              
              {messages.length > 0 && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fd3b12] hover:bg-[#E65C00] text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Chat</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  
                  {showExportDropdown && (
                    <div className="absolute right-0 mt-1.5 w-56 bg-white border border-black/10 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                      <button
                        onClick={() => {
                          setShowExportDropdown(false);
                          const content = generateJSON(messages);
                          triggerDownload(content, `chat_export_${sessionId}.json`);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#E8ECF2] text-xs font-semibold text-[#1A1D2E] flex items-center gap-2"
                      >
                        <FileCode className="w-4 h-4 text-[#fd3b12]" /> Download JSON
                      </button>
                      <button
                        onClick={() => {
                          setShowExportDropdown(false);
                          const content = generateMarkdown(messages);
                          triggerDownload(content, `chat_export_${sessionId}.md`);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#E8ECF2] text-xs font-semibold text-[#1A1D2E] flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-[#fd3b12]" /> Download Markdown
                      </button>
                      <hr className="border-black/5" />
                      <button
                        onClick={() => {
                          setShowExportDropdown(false);
                          const content = generateJSON(messages);
                          saveToWorkspace(content, `chat_export_${sessionId}.json`);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#E8ECF2] text-xs font-semibold text-[#1A1D2E] flex items-center gap-2"
                      >
                        <Save className="w-4 h-4 text-[#fd3b12]" /> Save to Workspace (JSON)
                      </button>
                      <button
                        onClick={() => {
                          setShowExportDropdown(false);
                          const content = generateMarkdown(messages);
                          saveToWorkspace(content, `chat_export_${sessionId}.md`);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#E8ECF2] text-xs font-semibold text-[#1A1D2E] flex items-center gap-2"
                      >
                        <Save className="w-4 h-4 text-[#fd3b12]" /> Save to Workspace (MD)
                      </button>
                      <hr className="border-black/5" />
                      <button
                        onClick={() => {
                          setShowExportDropdown(false);
                          const content = generateMarkdown(messages);
                          setEditorFormat('markdown');
                          setEditorFilename(`chat_export_${sessionId}.md`);
                          setEditorContent(content);
                          setEditorSaved(true);
                          setIsTextEditorOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#E8ECF2] text-xs font-bold text-[#1A1D2E] flex items-center gap-2 bg-[#fd3b12]/5"
                      >
                        <Edit className="w-4 h-4 text-[#fd3b12]" /> Open in Text Editor
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-4 scrollbar-thin">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-[#E2E6EC] flex items-center justify-center text-[#7A7D8E] mb-4 shadow-inner">
                    <Sparkles className="w-8 h-8 text-[#fd3b12]" />
                  </div>
                  <h3 className="text-base font-bold text-[#1A1D2E] mb-1">Initialize Your Sandbox</h3>
                  <p className="text-xs text-[#4A4D5E] max-w-sm">
                    Instruct the local AI model to write code or perform tasks. An isolated project directory will be created under your container workspace.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] ${
                      msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                      msg.sender === 'user' ? 'bg-[#fd3b12] text-white' : 'bg-[#E2E6EC] text-[#1A1D2E]'
                    }`}>
                      {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-[#fd3b12]" />}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div
                        className={`p-4 rounded-2xl shadow-sm text-sm border border-black/5 ${
                          msg.sender === 'user'
                            ? 'bg-[#fd3b12] text-white user-corner-glow user-corner-glow-secondary font-medium'
                            : 'bg-[#E2E6EC] text-[#1A1D2E] bot-corner-glow bot-corner-glow-secondary whitespace-pre-wrap'
                        }`}
                      >
                        {msg.content}
                      </div>
                      
                      <div className="flex items-center justify-between gap-4 px-2 text-[10px] text-[#7A7D8E]">
                        {msg.workspaceUsed && (
                          <div className="font-mono truncate max-w-[150px]" title={msg.workspaceUsed}>
                            Workspace: {msg.workspaceUsed}
                          </div>
                        )}
                        {msg.latencyMs !== undefined && (
                          <div className="font-mono flex items-center gap-1 shrink-0">
                            <Activity className="w-3 h-3 text-[#fd3b12]" />
                            <span>Latency: {msg.latencyMs.toLocaleString()} ms ({(msg.latencyMs / 1000).toFixed(2)}s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex gap-3 mr-auto max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-[#E2E6EC] flex items-center justify-center shrink-0 shadow-md">
                    <Sparkles className="w-4 h-4 text-[#fd3b12] animate-spin" />
                  </div>
                  <div className="p-4 rounded-2xl bg-[#E2E6EC] text-[#1A1D2E] bot-corner-glow border border-black/5 text-sm flex items-center gap-2 shadow-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#fd3b12] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#fd3b12] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#fd3b12] animate-bounce" style={{ animationDelay: '300ms' }} />
                    Thinking ({elapsedMs.toLocaleString()} ms)...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="flex gap-3 pt-4 border-t border-black/5">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={loading}
                className="flex-1 bg-[#BFC4CC] hover:bg-[#BFC4CC]/80 focus:bg-[#E8ECF2] text-[#1A1D2E] placeholder-[#7A7D8E] border border-black/5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#fd3b12]/30 focus:border-[#fd3b12]/50"
                placeholder="Instruct the AI model in your workspace..."
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-[#fd3b12] hover:bg-[#E65C00] active:scale-95 disabled:opacity-50 disabled:scale-100 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Right column: Text Editor Pane */}
        {isTextEditorOpen && (
          <section className="lg:col-span-4 flex flex-col h-[calc(100vh-140px)] min-h-[500px] bg-[#1A1D2E] text-[#E8ECF2] rounded-2xl border border-black/10 shadow-2xl p-5 overflow-hidden transition-all duration-300">
            {/* Editor Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#fd3b12]" />
                <span className="text-xs font-mono font-bold tracking-wide truncate max-w-[150px]">{editorFilename}</span>
                <span className={`w-2 h-2 rounded-full ${editorSaved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} title={editorSaved ? 'Saved' : 'Unsaved changes'} />
              </div>
              <button
                onClick={() => setIsTextEditorOpen(false)}
                className="text-[#7A7D8E] hover:text-white transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Format toggle & status bar */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex bg-[#2D314E] rounded-lg p-0.5 border border-white/5">
                <button
                  onClick={() => {
                    if (!editorSaved && !confirm('Discard unsaved changes?')) return;
                    setEditorFormat('markdown');
                    setEditorFilename(`chat_export_${sessionId}.md`);
                    setEditorContent(generateMarkdown(messages));
                    setEditorSaved(true);
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all ${editorFormat === 'markdown' ? 'bg-[#fd3b12] text-white shadow-sm' : 'text-[#7A7D8E] hover:text-white'}`}
                >
                  MD
                </button>
                <button
                  onClick={() => {
                    if (!editorSaved && !confirm('Discard unsaved changes?')) return;
                    setEditorFormat('json');
                    setEditorFilename(`chat_export_${sessionId}.json`);
                    setEditorContent(generateJSON(messages));
                    setEditorSaved(true);
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all ${editorFormat === 'json' ? 'bg-[#fd3b12] text-white shadow-sm' : 'text-[#7A7D8E] hover:text-white'}`}
                >
                  JSON
                </button>
              </div>

              {saveStatusText ? (
                <span className="text-emerald-400 font-medium animate-pulse">{saveStatusText}</span>
              ) : (
                <span className="text-[#7A7D8E] font-mono">
                  {editorSaved ? 'All changes saved' : 'Unsaved changes*'}
                </span>
              )}
            </div>

            {/* Textarea container */}
            <div className="flex-1 relative flex bg-[#121420] rounded-xl border border-white/5 overflow-hidden p-3 font-mono text-xs">
              {/* Line numbers */}
              <div ref={lineNumbersRef} className="select-none text-right pr-3 border-r border-white/5 text-[#4A4D5E] font-mono leading-6 overflow-hidden">
                {Array.from({ length: Math.max(editorContent.split('\n').length, 15) }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                value={editorContent}
                onScroll={handleEditorScroll}
                onChange={(e) => {
                  setEditorContent(e.target.value);
                  setEditorSaved(false);
                }}
                className="flex-1 bg-transparent resize-none pl-3 outline-none border-none text-[#E8ECF2] font-mono leading-6 overflow-y-auto scrollbar-thin placeholder-white/20"
                placeholder="Edit file contents..."
              />
            </div>

            {/* Editor Actions */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
              <button
                onClick={() => saveToWorkspace(editorContent, editorFilename)}
                className="flex-1 bg-[#fd3b12] hover:bg-[#E65C00] text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save to Workspace</span>
              </button>
              <button
                onClick={() => triggerDownload(editorContent, editorFilename)}
                className="bg-[#2D314E] hover:bg-[#3D426A] text-white text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 border border-white/5 transition-all"
                title="Download locally"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
