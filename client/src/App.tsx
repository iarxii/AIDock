import { useState, useEffect, useRef } from 'react';
import { Send, Terminal, Database, Cpu, Activity, User, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  workspaceUsed?: string;
}

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [loading, setLoading] = useState(false);
  const [connected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, session_id: sessionId })
      });
      
      if (!res.ok) {
        throw new Error('API server returned error');
      }
      
      const data = await res.json();
      
      const botMessage: Message = {
        id: `msg_${Date.now()}_b`,
        sender: 'bot',
        content: data.response,
        workspaceUsed: data.workspace_used
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: `msg_${Date.now()}_e`,
        sender: 'bot',
        content: 'Error: Failed to connect to AIDock backend. Ensure the Docker containers are healthy.',
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column: Sidebar Info */}
        <section className="lg:col-span-1 flex flex-col gap-6">
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

        {/* Right column: Chat Area */}
        <section className="lg:col-span-3 flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
          <div className="flex-1 bg-[#D8DCE4]/60 backdrop-blur-md rounded-2xl border border-black/5 shadow-2xl p-6 flex flex-col overflow-hidden">
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
                      
                      {msg.workspaceUsed && (
                        <div className="text-[10px] text-[#7A7D8E] font-mono px-2">
                          Workspace: {msg.workspaceUsed}
                        </div>
                      )}
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
                    Thinking...
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
      </main>
    </div>
  );
}

export default App;
