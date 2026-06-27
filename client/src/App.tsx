import { useState, useEffect, useRef } from 'react';
import { 
  Send, Terminal, Database, Cpu, Activity, User, Sparkles, 
  Download, FileText, ChevronDown, Save, X, Edit, FileCode,
  Folder, Plus, RefreshCw, Trash2
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  workspaceUsed?: string;
  latencyMs?: number;
}

interface WorkspaceFile {
  name: string;
  path: string;
  size: number;
}

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [loading, setLoading] = useState(false);
  const [connected] = useState(true);
  
  // Latency timer state
  const [elapsedMs, setElapsedMs] = useState(0);
  const [activeModel, setActiveModel] = useState('Gemma4 E4B');
  
  // Export/Editor states
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isTextEditorOpen, setIsTextEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [editorFilename, setEditorFilename] = useState('chat_export.md');
  const [editorFormat, setEditorFormat] = useState<'markdown' | 'json'>('markdown');
  const [editorSaved, setEditorSaved] = useState(true);
  const [saveStatusText, setSaveStatusText] = useState('');

  // Workspace Files state
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [isFileTreeExpanded, setIsFileTreeExpanded] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      }, 43);
    } else {
      setElapsedMs(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loading]);

  // Scroll synchronization for editor line numbers
  const handleEditorScroll = () => {
    if (editorTextareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = editorTextareaRef.current.scrollTop;
    }
  };

  // Auto-grow chat input textarea
  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
      chatInputRef.current.style.height = `${Math.min(chatInputRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Fetch workspace files list
  const fetchFiles = async () => {
    try {
      const res = await fetch(`/api/files?session_id=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  };

  // Fetch files when messages list changes
  useEffect(() => {
    fetchFiles();
  }, [messages]);

  // Fetch active model info on mount
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch('/api/info');
        if (res.ok) {
          const data = await res.json();
          if (data.model_name) {
            setActiveModel(data.model_name);
          }
        }
      } catch (err) {
        console.error("Error fetching model info:", err);
      }
    };
    fetchInfo();
  }, []);

  // Load a file from tree into editor
  const openFileInEditor = async (filePath: string) => {
    try {
      const res = await fetch(`/api/file-content?session_id=${sessionId}&path=${encodeURIComponent(filePath)}`);
      if (res.ok) {
        const data = await res.json();
        const ext = filePath.split('.').pop() || '';
        const format = (ext === 'json') ? 'json' : 'markdown';
        
        setEditorFormat(format);
        setEditorFilename(filePath);
        setEditorContent(data.content);
        setEditorSaved(true);
        setIsTextEditorOpen(true);
      } else {
        alert("Failed to load file contents.");
      }
    } catch (err: any) {
      alert(`Error loading file: ${err.message}`);
    }
  };

  // File Upload logic
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/upload?session_id=${sessionId}`, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        // Insert system alert bubble
        const systemMsg: Message = {
          id: `msg_${Date.now()}_sys`,
          sender: 'bot',
          content: `System Context Loaded: "${data.file_name}" uploaded successfully to sandboxed workspace.`,
        };
        setMessages(prev => [...prev, systemMsg]);
        fetchFiles();
      } else {
        throw new Error("Upload failed on server");
      }
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

  const handleSaveFile = async (content: string, filename: string) => {
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
      fetchFiles();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

      {/* Main Container WIDENED to fluid screen size */}
      <main className="flex-1 max-w-none px-8 w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Sidebar Info */}
        <section className="lg:col-span-3 flex flex-col gap-6">
          {/* Workspace context card */}
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
                  <Database className="w-3.5 h-3.5 text-[#fd3b12]" /> {activeModel}
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

          {/* Mount Collapsible Node File-Tree */}
          <div className="bg-[#D8DCE4] rounded-2xl border border-black/5 p-5 shadow-lg flex flex-col gap-3">
            <button 
              onClick={() => setIsFileTreeExpanded(!isFileTreeExpanded)}
              className="text-sm font-bold text-[#1A1D2E] uppercase tracking-wider flex items-center justify-between w-full focus:outline-none"
            >
              <span className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-[#fd3b12]" /> Workspace Files
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFileTreeExpanded ? '' : '-rotate-90'}`} />
            </button>
            
            {isFileTreeExpanded && (
              <div className="space-y-1.5 mt-1 max-h-[220px] overflow-y-auto pr-1">
                {files.length === 0 ? (
                  <div className="text-[11px] text-[#7A7D8E] italic p-3 bg-[#E8ECF2] rounded-xl border border-black/5 text-center">
                    No files in workspace yet. Click the + uploader below to attach one.
                  </div>
                ) : (
                  files.map(file => (
                    <button
                      key={file.path}
                      onClick={() => openFileInEditor(file.path)}
                      className="w-full text-left bg-[#E8ECF2] hover:bg-[#E2E6EC] p-2.5 rounded-xl border border-black/5 text-xs font-semibold text-[#4A4D5E] flex items-center justify-between group transition-all"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-[#fd3b12]" />
                        <span className="truncate">{file.path}</span>
                      </span>
                      <span className="text-[9px] text-[#7A7D8E] font-mono group-hover:text-[#fd3b12] transition-colors shrink-0">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
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
                          handleSaveFile(content, `chat_export_${sessionId}.json`);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#E8ECF2] text-xs font-semibold text-[#1A1D2E] flex items-center gap-2"
                      >
                        <Save className="w-4 h-4 text-[#fd3b12]" /> Save to Workspace (JSON)
                      </button>
                      <button
                        onClick={() => {
                          setShowExportDropdown(false);
                          const content = generateMarkdown(messages);
                          handleSaveFile(content, `chat_export_${sessionId}.md`);
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

                    <div className="flex flex-col gap-1.5 max-w-[85%]">
                      {/* LLM Logo & Model Badge inside Assistant bubbles */}
                      {msg.sender === 'bot' && msg.id.indexOf('_sys') === -1 && (
                        <div className="flex items-center gap-1.5 pb-1 border-b border-black/5 mb-1 text-[11px] text-[#7A7D8E] font-semibold">
                          <div className="w-3.5 h-3.5 rounded bg-[#fd3b12] flex items-center justify-center text-white shrink-0">
                            <Sparkles className="w-2.5 h-2.5" />
                          </div>
                          <span className="font-bold text-[#1A1D2E]">{activeModel}</span>
                          <span className="text-[8px] font-mono bg-[#BFC4CC]/50 px-1 py-0.2 rounded text-[#4A4D5E]">Model Runner</span>
                        </div>
                      )}
                      
                      <div
                        className={`p-4 rounded-2xl shadow-sm text-sm border border-black/5 ${
                          msg.sender === 'user'
                            ? 'bg-[#fd3b12] text-white user-corner-glow user-corner-glow-secondary font-medium rounded-tr-none'
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
                          <div className="font-mono flex items-center gap-1 shrink-0 ml-auto">
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

            {/* Input Toolbar Area */}
            <div className="flex flex-col gap-2 pt-4 border-t border-black/5">
              {/* Function buttons toolbar */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  {/* Plus context file selector */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-7 h-7 rounded-lg bg-[#BFC4CC]/60 hover:bg-[#BFC4CC] text-[#1A1D2E] flex items-center justify-center shadow-sm transition-all focus:outline-none"
                    title="Attach Context File (RAG)"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <button
                    onClick={() => setInput("Write a python file-editor tool that can edit a source file.")}
                    className="px-2.5 py-1 text-[11px] font-bold bg-[#E8ECF2] hover:bg-[#E2E6EC] border border-black/5 text-[#4A4D5E] rounded-lg transition-all"
                  >
                    Write Code
                  </button>
                  <button
                    onClick={() => setInput("Scan all workspace files and summarize their contents.")}
                    className="px-2.5 py-1 text-[11px] font-bold bg-[#E8ECF2] hover:bg-[#E2E6EC] border border-black/5 text-[#4A4D5E] rounded-lg transition-all"
                  >
                    Scan Workspace
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchFiles}
                    className="p-1 text-[#7A7D8E] hover:text-[#1A1D2E] transition-colors focus:outline-none"
                    title="Refresh Files"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Reset current chat log?")) {
                        setMessages([]);
                      }
                    }}
                    className="p-1 text-[#7A7D8E] hover:text-[#1A1D2E] transition-colors focus:outline-none"
                    title="Clear Chat Log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dynamic Chat Textarea Box */}
              <div className="flex gap-3 items-end">
                <textarea
                  ref={chatInputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  rows={1}
                  className="flex-1 bg-[#BFC4CC] hover:bg-[#BFC4CC]/80 focus:bg-[#E8ECF2] text-[#1A1D2E] placeholder-[#7A7D8E] border border-black/5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#fd3b12]/30 focus:border-[#fd3b12]/50 resize-none min-h-[44px] max-h-[180px] overflow-y-auto scrollbar-thin"
                  placeholder="Instruct the AI model in your workspace..."
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="bg-[#fd3b12] hover:bg-[#E65C00] active:scale-95 disabled:opacity-50 disabled:scale-100 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 shrink-0 mb-[1px]"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* Right column: Text Editor Pane */}
        {isTextEditorOpen && (
          <section className="lg:col-span-4 flex flex-col h-[calc(100vh-140px)] min-h-[500px] bg-[#1A1D2E] text-[#E8ECF2] rounded-2xl border border-black/10 shadow-2xl p-5 overflow-hidden transition-all duration-300">
            {/* Editor Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
              <div className="flex items-center gap-2 truncate mr-2">
                <FileCode className="w-4 h-4 text-[#fd3b12] shrink-0" />
                <span className="text-xs font-mono font-bold tracking-wide truncate" title={editorFilename}>{editorFilename}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${editorSaved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} title={editorSaved ? 'Saved' : 'Unsaved changes'} />
              </div>
              <button
                onClick={() => setIsTextEditorOpen(false)}
                className="text-[#7A7D8E] hover:text-white transition-colors duration-200 focus:outline-none"
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
                ref={editorTextareaRef}
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
                onClick={() => handleSaveFile(editorContent, editorFilename)}
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
