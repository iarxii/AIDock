import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, User, Activity,
  Download, FileText, ChevronDown, Save, X, Edit, FileCode,
  Plus, RefreshCw, Trash2, Settings, Moon, Sun,
  PanelLeft, Layers, Search, Check, FolderGit2, ChevronsUpDown,
  Bot, Boxes, Sparkles, Globe, Cloud, LayoutGrid, Box,
  SlidersHorizontal, Key, Eye, EyeOff, Server,
  Volume2, VolumeX, LogOut, Paperclip, Code, MessageSquare, PenTool, Cpu,
  FolderPlus, Copy, Clock, AlignJustify, TextQuote, Undo2, Terminal, ListOrdered
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import spiritDockLogo from './assets/SpiritDock_Logo.svg';
import FileTree from './components/FileTree';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  workspaceUsed?: string;
  latencyMs?: number;
  provider?: string;
  model?: string;
  providerLabel?: string;
  timestamp?: number;
}

interface CodeBlockProps {
  language?: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(() => {
    return localStorage.getItem('aidock_code_linenos') !== 'false';
  });

  useEffect(() => {
    const handleSync = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      if (typeof custom.detail === 'boolean') {
        setShowLineNumbers(custom.detail);
      }
    };
    window.addEventListener('aidock:code-linenos-change', handleSync);
    return () => window.removeEventListener('aidock:code-linenos-change', handleSync);
  }, []);

  const toggleLineNumbers = () => {
    const next = !showLineNumbers;
    setShowLineNumbers(next);
    localStorage.setItem('aidock_code_linenos', String(next));
    window.dispatchEvent(new CustomEvent('aidock:code-linenos-change', { detail: next }));
  };

  const handleCopy = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const displayLang = (language || 'code').toLowerCase();

  const lines = useMemo(() => {
    const normalized = code.replace(/\r\n/g, '\n');
    const split = normalized.split('\n');
    if (split.length > 1 && split[split.length - 1] === '') {
      return split.slice(0, -1);
    }
    return split;
  }, [code]);

  return (
    <div className="not-prose my-3 rounded-xl border border-[var(--border-subtle)] bg-[#070b12] overflow-hidden shadow-md group/code">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#0d131f] border-b border-[var(--border-subtle)]/60 text-[11px] font-mono select-none">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Terminal className="w-3.5 h-3.5 text-[#0db7ed]" />
          <span className="font-semibold uppercase tracking-wider text-[10px] text-[#0db7ed]">{displayLang}</span>
          <span className="text-[10px] text-slate-500 font-mono">({lines.length} {lines.length === 1 ? 'line' : 'lines'})</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Line Numbers Toggle */}
          <button
            type="button"
            onClick={toggleLineNumbers}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-sans transition-colors cursor-pointer ${
              showLineNumbers
                ? 'bg-[#0db7ed]/15 text-[#0db7ed] border border-[#0db7ed]/30'
                : 'hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
            }`}
            title={showLineNumbers ? "Hide line numbers" : "Show line numbers"}
          >
            <ListOrdered className="w-3 h-3" />
            <span>{showLineNumbers ? "Lines" : "No Lines"}</span>
          </button>

          {/* Copy Code Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer text-[10.5px] font-sans border border-transparent"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Body */}
      <div className="flex font-mono text-xs leading-relaxed overflow-hidden">
        {showLineNumbers && (
          <div
            aria-hidden="true"
            className="select-none text-right pr-3 pl-3.5 py-3.5 bg-[#090d16]/70 border-r border-white/10 text-slate-500/70 shrink-0 font-mono text-xs leading-relaxed select-none code-line-gutter"
            style={{ userSelect: 'none', WebkitUserSelect: 'none', minWidth: `${Math.max(2, String(lines.length).length + 1)}ch` }}
          >
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        )}
        <div className="p-3.5 overflow-x-auto flex-1 font-mono text-xs leading-relaxed text-slate-200 scrollbar-thin scrollbar-thumb-white/10">
          <pre className="!bg-transparent !p-0 !m-0 !border-0 !shadow-none font-mono text-xs leading-relaxed whitespace-pre">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

interface WorkspaceFile {
  name: string;
  path: string;
  size: number;
}

interface CloudSpace {
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  color: string | null;
  recommended_provider: string | null;
  recommended_model: string | null;
}

interface CloudModel {
  id: string;
  name: string;
}

export interface AIProvider {
  id: string;
  label: string;
  desc: string;
  badge: string;
  requiresKey: boolean;
  defaultUrl: string;
  coreGroup: 'neural' | 'cloud';
  placeholder?: boolean;
  defaultModels: string[];
}

export const PROVIDERS: AIProvider[] = [
  // Neural Core (Local)
  { id: 'local', label: 'Local LLM', desc: 'Docker Models / Ollama / vLLM local runners', badge: 'LOCAL', requiresKey: false, defaultUrl: 'http://model-runner.docker.internal', coreGroup: 'neural', defaultModels: [] },
  { id: 'litert', label: 'LiteRT (Web Local)', desc: 'On-device client inference (WebGPU/WASM)', badge: 'LITERT', requiresKey: false, defaultUrl: '', coreGroup: 'neural', placeholder: true, defaultModels: [] },
  { id: 'transformers', label: 'Transformers (HF)', desc: 'Local Hugging Face runtime (Coming Soon)', badge: 'TRANSFORMERS', requiresKey: false, defaultUrl: '', coreGroup: 'neural', placeholder: true, defaultModels: [] },

  // Cloud Core (BYOK Cloud API Providers)
  { id: 'nvidia', label: 'NVIDIA NIM', desc: 'Optimized enterprise models (Llama 3.3, Nemotron, DeepSeek)', badge: 'NVIDIA', requiresKey: true, defaultUrl: 'https://integrate.api.nvidia.com/v1', coreGroup: 'cloud', defaultModels: [] },
  { id: 'openai', label: 'OpenAI', desc: 'Direct GPT-4o, o1, and o3-mini models', badge: 'OPENAI', requiresKey: true, defaultUrl: 'https://api.openai.com/v1', coreGroup: 'cloud', defaultModels: [] },
  { id: 'gemini', label: 'Gemini', desc: 'Google Gemini 2.0 & 1.5 Flash/Pro', badge: 'GEMINI', requiresKey: true, defaultUrl: 'https://generativelanguage.googleapis.com/v1beta', coreGroup: 'cloud', defaultModels: [] },
  { id: 'anthropic', label: 'Anthropic', desc: 'Claude 3.7 & 3.5 Sonnet / Haiku', badge: 'ANTHROPIC', requiresKey: true, defaultUrl: 'https://api.anthropic.com', coreGroup: 'cloud', defaultModels: [] },
  { id: 'groq', label: 'Groq', desc: 'Ultra-fast LPU inference (Llama 3.3)', badge: 'GROQ', requiresKey: true, defaultUrl: 'https://api.groq.com/openai/v1', coreGroup: 'cloud', defaultModels: [] },
  { id: 'openrouter', label: 'OpenRouter', desc: 'Multi-model gateway & unified routing', badge: 'OPENROUTER', requiresKey: true, defaultUrl: 'https://openrouter.ai/api/v1', coreGroup: 'cloud', defaultModels: [] },
  { id: 'deepseek', label: 'DeepSeek', desc: 'DeepSeek-V3 & DeepSeek-R1 reasoning', badge: 'DEEPSEEK', requiresKey: true, defaultUrl: 'https://api.deepseek.com/v1', coreGroup: 'cloud', defaultModels: [] },
  { id: 'xai', label: 'xAI', desc: 'Grok-2 & Grok-beta models direct', badge: 'XAI', requiresKey: true, defaultUrl: 'https://api.x.ai/v1', coreGroup: 'cloud', defaultModels: [] },
  { id: 'together', label: 'Together AI', desc: 'Fast open-source model hosting', badge: 'TOGETHER', requiresKey: true, defaultUrl: 'https://api.together.xyz/v1', coreGroup: 'cloud', defaultModels: [] },
  { id: 'fireworks', label: 'Fireworks AI', desc: 'Low-latency serverless model inference', badge: 'FIREWORKS', requiresKey: true, defaultUrl: 'https://api.fireworks.ai/inference/v1', coreGroup: 'cloud', defaultModels: [] },
  { id: 'mistral', label: 'Mistral AI', desc: 'Mistral Large & Codestral models', badge: 'MISTRAL', requiresKey: true, defaultUrl: 'https://api.mistral.ai/v1', coreGroup: 'cloud', defaultModels: [] },
  { id: 'perplexity', label: 'Perplexity', desc: 'Search-augmented real-time reasoning', badge: 'PERPLEXITY', requiresKey: true, defaultUrl: 'https://api.perplexity.ai', coreGroup: 'cloud', defaultModels: [] },
  { id: 'cohere', label: 'Cohere', desc: 'Command R+ enterprise multilingual', badge: 'COHERE', requiresKey: true, defaultUrl: 'https://api.cohere.com/v1', coreGroup: 'cloud', defaultModels: [] },
  { id: 'cerebras', label: 'Cerebras', desc: 'Wafer-scale instantaneous generation', badge: 'CEREBRAS', requiresKey: true, defaultUrl: 'https://api.cerebras.ai/v1', coreGroup: 'cloud', defaultModels: [] },
  { id: 'ollama_cloud', label: 'Ollama Cloud', desc: 'Remote Ollama server instances', badge: 'OLLAMA_CLOUD', requiresKey: false, defaultUrl: 'https://ollama.com', coreGroup: 'cloud', defaultModels: [] },
  { id: 'workers_ai', label: 'Cloudflare Workers AI', desc: 'Cloudflare edge serverless AI inference', badge: 'WORKERS_AI', requiresKey: false, defaultUrl: 'https://api.cloudflare.com/client/v4/accounts', coreGroup: 'cloud', defaultModels: [] },
  { id: 'cloudflare_ai_gateway', label: 'Cloudflare AI Gateway', desc: 'Universal AI gateway with smart fallbacks', badge: 'CF_GATEWAY', requiresKey: false, defaultUrl: 'https://gateway.ai.cloudflare.com', coreGroup: 'cloud', defaultModels: [] },
  { id: 'azure', label: 'Azure OpenAI', desc: 'Enterprise OpenAI deployed on Microsoft Azure', badge: 'AZURE', requiresKey: true, defaultUrl: 'https://{resource}.openai.azure.com/openai/deployments', coreGroup: 'cloud', defaultModels: [] },
];

export interface WorkspaceProject {
  id: string;
  name: string;
  path: string;
  isGit?: boolean;
}

export interface ChatSessionItem {
  id?: number;
  session_id: string;
  title: string;
  created_at: string;
  updated_at?: string;
  workspaceId?: string;
  space_type?: string;
}

export const DEFAULT_WORKSPACES: WorkspaceProject[] = [
  { id: 'default', name: 'Local Session', path: '/workspace', isGit: true },
  { id: 'spirit-book', name: 'spirit-book', path: '/workspace/spirit-book', isGit: false },
  { id: 'ai-codex', name: 'AI_Codex Root', path: 'C:/AppDev/My_Linkdin/projects/iarxii', isGit: true },
];

export const CODEX_SPACES_CATALOG = [
  { id: 'space_code_lab', slug: 'gemma4-code-lab', name: 'Gemma 4 Code Lab', tag: 'CODE LAB', color: '#0db7ed', desc: 'MTP Speculative Decoding', date: 'Active' },
  { id: 'space_trading', slug: 'fintrader', name: 'FinTrader Analytics Lab', tag: 'TRADING', color: '#ea580c', desc: 'Market & Technical Analysis', date: 'Active' },
  { id: 'space_health', slug: 'med-gemma', name: 'MedGemma Soft Lab', tag: 'HEALTH', color: '#10b981', desc: 'Clinical Q&A & Research', date: 'Active' },
  { id: 'space_artgen', slug: 'artgen', name: 'ArtGen Design Lab', tag: 'CREATIVE', color: '#8b5cf6', desc: 'Visual Prompting & UI/UX', date: 'Active' },
  { id: 'space_spiritbook', slug: 'spiritbook', name: 'SpiritBook Audio Lab', tag: 'LINGUISTIC', color: '#f59e0b', desc: 'Language & Educational Tutor', date: 'Active' },
];

function MascotLogo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920.63 921.86" className={className} fill="currentColor">
      <g id="Layer_2" data-name="Layer 2">
        <g id="Layer_1-2" data-name="Layer 1">
          <path d="M436.74,237l17.14,7.41C432.46,304.6,444.75,354.17,502,386.7c42.35,24.05,90.25,12.34,121.29-14.27,30.64-26.26,49.41-77.85,25.28-127.43,4.61-2.33,9.2-4.73,13.89-6.91.54-.25,2,.48,2.39,1.13a40.46,40.46,0,0,1,2.87,6.7,161.49,161.49,0,0,1,7,66.35c-2.17,21.25-4.22,42.49-8.58,63.46A387.18,387.18,0,0,1,636.3,465a447.67,447.67,0,0,1-56.22,89,588.74,588.74,0,0,1-95.14,93.61c-19.45,15.14-39.89,28.87-61.94,40-30.39,15.31-62.38,25.21-96.56,27-12.71.66-25.46.83-38.19,1.23l-.75-1.27a35.56,35.56,0,0,1,2.61-5.62c18.5-26.66,33-55.26,40.71-86.87a234.75,234.75,0,0,0,3.44-93.38c-6.44-40.36-21.81-77-44.25-111-15.68-23.74-34.9-44.35-55.74-63.42-25.94-23.75-52.58-46.74-78.91-70.06-20.43-18.09-41.67-35.34-61.08-54.46-27.64-27.23-44.9-60.52-50.2-99.23A180.41,180.41,0,0,1,58.7,30C63.18,20.09,68,10.32,72.91,0c3.36,3,6.24,5.42,9,8Q109.1,33,136.23,58q37.59,34.53,75.25,69c31,28.41,62.26,56.51,92.85,85.33,22,20.72,40.11,44.69,55.84,70.54s28,52.91,36,82c5,18.21,7.45,36.85,8.47,55.68.24,4.47.52,8.94.78,13.41l1.08.13c1.27-5.32,2.68-10.61,3.77-16,5.8-28.72,4-57-4.48-85-1.4-4.63-.27-10.36.78-15.35a286.73,286.73,0,0,1,22.5-66.85c2-4.17,4.33-8.21,6.53-12.3A15.23,15.23,0,0,1,436.74,237Z" />
          <path d="M672.9,512.77c45.73-9.58,89.24-25.27,130-48.61l.72.78c-1.56,3.93-2.88,8-4.73,11.76-15.41,31.74-38.4,56.24-69.31,73.53-24.91,13.94-51.8,21.67-79.67,26-17,2.66-34.39,3.44-51.6,5-1.7.15-3.42,0-6.07,0,1.71-2.2,2.8-3.76,4-5.19a426.34,426.34,0,0,0,39.81-53.21C659.45,486,677.56,446.56,687.85,404c5.27-21.83,8-44.29,12-66.43a11.82,11.82,0,0,1,3.22-5.82c15.06-14.82,30.62-29.15,45.32-44.31,17.17-17.7,32.15-37.24,46.05-57.64a487.53,487.53,0,0,0,48.7-89.49c11.07-27,20.47-54.57,26.06-83.32,3.41-17.53,6.85-35,10.36-53a61.64,61.64,0,0,1,3.27,5.57C895,36.13,905.75,63.2,911.77,91.9c5.93,28.26,9.8,56.75,8.66,85.75a328.12,328.12,0,0,1-25.52,114.57A351.83,351.83,0,0,1,854,364.46C836.81,388,817,409.33,795.39,429.08c-27.48,25.13-57.72,46.35-89.83,65-9.83,5.71-20.1,10.64-30.17,15.94-1,.52-2,1.06-2.95,1.59Z" />
          <path d="M152.49,833.73c11.92-8.05,24.1-15.73,35.69-24.22a420.17,420.17,0,0,0,60.12-53.35c4.18-4.51,8.09-9.28,12.29-13.77a5.57,5.57,0,0,1,3.79-1.82c9.85.63,19.68,1.5,29.51,2.33a11.76,11.76,0,0,1,2.09.62c-.66,1.16-1.16,2.15-1.77,3.06-15.78,23.52-31.5,47.09-47.39,70.54-12.44,18.36-24.56,37-37.79,54.75-20,26.82-46.46,43.78-80,48.63-21.53,3.12-42.68.77-63.3-5.82-9.37-3-18.43-6.92-27.62-10.48A39.65,39.65,0,0,1,34,901.92L170.56,760.49l-.81-.81c-4.9,3.6-9.84,7.14-14.68,10.82-15,11.36-29.81,23-46.37,32.09-13,7.16-26.5,12.89-41.52,14.29-21.6,2-40-5.14-55.79-19.5C7.46,793.82,4,789.75,0,785.6c4.71-2.26,9.37-4.56,14.07-6.75,13.15-6.12,26.45-11.94,39.45-18.36C74.65,750.07,96,740,116.5,728.43c27.67-15.63,55-31.91,81.73-49.14,19.28-12.43,37.66-26.37,55.71-40.57,17.77-14,34.62-29.14,51.87-43.78a2.83,2.83,0,0,1,2.16-.64c-2.3,9.53-4.25,19.16-7,28.56-9.38,32.38-24.39,62.17-42.37,90.53a484.4,484.4,0,0,1-86.15,101.8c-6.73,6-13.68,11.83-20.53,17.73Z" />
          <path d="M295.14,487.38c-10.53-1.48-20.43-2.6-30.22-4.3-25.68-4.48-50.88-10.73-75-20.9-28-11.85-54.59-26.29-78.67-45.05-24.62-19.2-46.51-41.07-64-67A268.14,268.14,0,0,1,6.69,253.82c-3.59-17.32-6.6-41-6.06-52.4a8,8,0,0,1,1.8.69c14.32,10.11,28.74,20.08,42.9,30.4,19.52,14.22,39,28.47,58.19,43.16q22,16.84,43,34.86c22.14,18.93,44.19,38,65.76,57.59,17.63,16,34.24,33.09,47.74,52.92,13.11,19.24,25.06,39.09,33.29,61C293.9,483.51,294.36,485,295.14,487.38Z" />
          <path d="M418.88,721.29c-6.66,15.9-13,32-20.07,47.68-14.05,31.22-32,60-55.5,85.06-27.5,29.25-60.72,49.11-99.82,58.5-10.32,2.48-21.11,3-31.68,4.41a18.59,18.59,0,0,1-3.39-.3c1.19-2.25,2-4.1,3.1-5.8Q254,843.78,296.61,776.75c6.54-10.29,13.31-20.43,19.87-30.71a6.47,6.47,0,0,1,5.34-3.17c12-1.31,24-2.33,35.92-4.34,18.52-3.12,43.17-10.82,59.92-17.83Z" />
          <path d="M681.33,159.77c4.28,22.91-4.66,48.58-28.4,62.52-10.38,6.09-21.78,8.88-33.23,12-16.64,4.53-33,10.38-45.12,23.47-5.73,6.21-9.91,13.86-14.84,20.93-1.67-2-3.91-4.77-6.17-7.5C540,254.83,522,245.58,502.2,239.31c-10.59-3.36-21.49-5.76-32.21-8.75-16.83-4.71-31.15-13.09-40.81-28.26-6.51-10.22-8.32-21.51-8-33.33.08-2.77.41-5.53.68-9,1.62,1.73,2.95,3.08,4.19,4.5a68.28,68.28,0,0,0,42.67,23.49c5.79.87,11.57.54,17-2.26,13.45-6.95,27.92-10.79,42.71-13.33a135.66,135.66,0,0,1,61.41,3.12,218.86,218.86,0,0,1,28,10.31,30.64,30.64,0,0,0,21.38,1.44c16-4.4,30.26-11.76,40.41-25.52C680.05,161.14,680.54,160.66,681.33,159.77Z" />
          <path d="M309.35,563c-1,.07-2,.22-3,.2-24-.61-47.73-2.91-71-9.08-32-8.48-59.46-24.57-82.17-48.67-8.9-9.44-15.67-20.41-22.09-31.6-.32-.57-.53-1.21-1-2.29,1.66.51,2.86.82,4,1.25a554.28,554.28,0,0,0,101.69,27.39c21.38,3.7,42.85,6.88,64.26,10.4,1,.16,2.47,1.13,2.67,2a291.75,291.75,0,0,1,7,49.22A4.41,4.41,0,0,1,309.35,563Z" />
          <path d="M564.32,322.34c.53-2,1-3.86,1.46-5.68,3.06-13.39,6.8-26.54,13.56-38.64,7-12.57,18.88-18.36,31.78-22.66,3-1,4.74-.2,5.13,3.35.71,6.4,1.13,12.78-1.17,18.92-4.33,11.58-13.68,17.08-27.09,16.17-3.09-.21-6.19-.47-10-.76,2.68,25.35-1.48,48.27-22.57,66.39.16-2.56.21-4.12.36-5.68,2.1-21.75-3.81-40.6-19.95-55.87-3.87-3.66-7.9-5.4-13.46-4.47a39.46,39.46,0,0,1-13.14-.25c-14.64-2.58-22.41-13.68-20.52-29.3,1.36-11.28.68-10.36,11.22-7.32,14.46,4.17,27.7,10.77,39.05,20.74a71.25,71.25,0,0,1,23.48,40.51c.25,1.25.53,2.5.84,3.73C563.35,321.69,563.64,321.8,564.32,322.34Z" />
        </g>
      </g>
    </svg>
  );
}

export function ProviderBrandIcon({
  providerId,
  localEngine,
  className = "w-4 h-4",
  alt = ""
}: {
  providerId: string;
  localEngine?: string;
  className?: string;
  alt?: string;
}) {
  const [error, setError] = useState(false);
  const activeEngine = localEngine || (typeof window !== 'undefined' ? localStorage.getItem('aidock_local_engine') : null);
  const localIcon = activeEngine === 'ollama' ? '/assets/brand-icons/ollama.svg' : '/assets/aicodex-spirit-bird.svg';
  const iconMap: Record<string, string> = {
    local: localIcon,
    litert: '/assets/brand-icons/litert.png',
    transformers: '/assets/brand-icons/huggingface.svg',
    openai: '/assets/brand-icons/openai.svg',
    nvidia: '/assets/brand-icons/nvidia.svg',
    gemini: '/assets/brand-icons/gemini.svg',
    anthropic: '/assets/brand-icons/anthropic.svg',
    groq: '/assets/brand-icons/groq.svg',
    openrouter: '/assets/brand-icons/openrouter.svg',
    deepseek: '/assets/brand-icons/deepseek.svg',
    xai: '/assets/brand-icons/xai.svg',
    together: '/assets/brand-icons/together.svg',
    fireworks: '/assets/brand-icons/fireworks.svg',
    mistral: '/assets/brand-icons/mistral.svg',
    perplexity: '/assets/brand-icons/perplexity.svg',
    cohere: '/assets/brand-icons/cohere.svg',
    cerebras: '/assets/brand-icons/cerebras.svg',
    ollama_cloud: '/assets/brand-icons/ollama.svg',
    azure: '/assets/brand-icons/azure.svg',
    cloudflare: '/assets/brand-icons/cloudflare.svg',
    workers_ai: '/assets/brand-icons/workers_ai.svg',
  };

  const src = iconMap[providerId] || `/assets/brand-icons/${providerId}.svg`;

  if (error) {
    if (providerId === 'local' || providerId === 'litert') {
      return <Cpu className={className} />;
    }
    return <Cloud className={className} />;
  }

  return (
    <img
      src={src}
      alt={alt || providerId}
      className={`${className} object-contain`}
      onError={() => setError(true)}
    />
  );
}

const isNeuralCore = (pid: string) => pid === 'local' || pid === 'litert' || pid === 'transformers';

const SPECIALIZATIONS = [
  { id: 'coding' as const, name: 'Coding', icon: Code },
  { id: 'conversational' as const, name: 'Conversational', icon: MessageSquare },
  { id: 'writing' as const, name: 'Writing', icon: PenTool },
  { id: 'researcher' as const, name: 'Researcher', icon: Search },
];

function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('aidock_theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('aidock_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('aidock_theme', 'light');
    }
  }, [isDark]);

  // SpiritLlama Left Sidepanel State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('aidock_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });
  const [activeSidebarTab, setActiveSidebarTab] = useState<'standard' | 'spaces'>('standard');
  const [showFunctionShortcuts, setShowFunctionShortcuts] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Alert Sounds state and acoustic feedback
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('aidock_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const playAlertSound = (type: 'success' | 'warning' = 'success') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(311.13, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      }
    } catch {
      // Audio context may require user gesture on first load
    }
  };

  // SpiritLlama Floating Command Dock states
  const [isProviderDrawerOpen, setIsProviderDrawerOpen] = useState(false);
  const [isProviderListboxOpen, setIsProviderListboxOpen] = useState(false);
  const [isModelListboxOpen, setIsModelListboxOpen] = useState(false);
  const [providerSearch, setProviderSearch] = useState('');
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [activeSpecialization, setActiveSpecialization] = useState<'coding' | 'conversational' | 'writing' | 'researcher'>('coding');
  const [isSpecializationMenuOpen, setIsSpecializationMenuOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ id: string; name: string; size: number }[]>([]);

  // Header Horizon P5 Strings Canvas Animation
  const p5CanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = p5CanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (!canvas || !ctx) return;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Generative dynamic wave arcs (Signature Spirit Bird strings in Electric Blue)
      // Strand 0 is 100% full width (right to left). Strands 1-4 reduce in width originating from right-to-left.
      const strandConfigs = [
        { widthRatio: 1.0, alpha: 0.45 },
        { widthRatio: 0.82, alpha: 0.36 },
        { widthRatio: 0.65, alpha: 0.28 },
        { widthRatio: 0.48, alpha: 0.22 },
        { widthRatio: 0.32, alpha: 0.16 },
      ];

      strandConfigs.forEach((strand, i) => {
        const minX = width * (1 - strand.widthRatio);
        const fadeZone = Math.max(20, width * 0.14);
        ctx.lineWidth = 1.5;

        for (let x = width; x >= minX; x -= 6) {
          const nextX = Math.max(minX, x - 6);

          // Dampened vertical amplitude to prevent any vertical clipping against 60px header
          const y1 = height * 0.5 + Math.sin(x * 0.015 + t + i * 0.8) * 8 + Math.cos(x * 0.008 + t * 0.5) * 5;
          const y2 = height * 0.5 + Math.sin(nextX * 0.015 + t + i * 0.8) * 8 + Math.cos(nextX * 0.008 + t * 0.5) * 5;

          const distFromEnd = x - minX;
          const fadeFactor = Math.min(1, Math.max(0, distFromEnd / fadeZone));
          const effectiveAlpha = strand.alpha * fadeFactor * fadeFactor;

          if (effectiveAlpha > 0.005) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(13, 183, 237, ${effectiveAlpha.toFixed(3)})`;
            ctx.moveTo(x, y1);
            ctx.lineTo(nextX, y2);
            ctx.stroke();
          }
        }
      });

      t += 0.02;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Main Workspace Full Background P5 Wave Animation (OllamaOpt / SpiritLlama 1:1 in Docker Blue)
  const workspaceP5CanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = workspaceP5CanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frameCount = 0;
    const numWaves = 3;
    let waves: Array<{ yOffset: number; speed: number; amplitude: number; frequency: number }> = [];

    const buildWaves = (h: number) => {
      waves = [];
      for (let i = 0; i < numWaves; i++) {
        waves.push({
          yOffset: h * (0.30 + i * 0.22),
          speed: 0.008 + i * 0.004,
          amplitude: 35 + i * 15,
          frequency: 0.003 + i * 0.001
        });
      }
    };

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      buildWaves(canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const step = 20;

    const draw = () => {
      if (!canvas || !ctx) return;
      const width = canvas.width;
      const height = canvas.height;
      if (width <= 0 || height <= 0) return;

      ctx.clearRect(0, 0, width, height);

      const fadeHeight = Math.max(220, height * 0.35);

      ctx.save();
      for (let i = 0; i < waves.length; i++) {
        const w = waves[i];
        const pts: Array<{ x: number; y: number }> = [];
        let minY = height;

        for (let x = -step; x <= width + step * 2; x += step) {
          const y = w.yOffset + Math.sin(x * w.frequency + frameCount * w.speed) * w.amplitude;
          pts.push({ x, y });
          if (y < minY) minY = y;
        }

        if (pts.length < 2) continue;

        // Smooth wave curve path with quadratic Bézier curves
        const curvePath = new Path2D();
        curvePath.moveTo(pts[0].x, pts[0].y);
        for (let j = 1; j < pts.length - 1; j++) {
          const xc = (pts[j].x + pts[j + 1].x) * 0.5;
          const yc = (pts[j].y + pts[j + 1].y) * 0.5;
          curvePath.quadraticCurveTo(pts[j].x, pts[j].y, xc, yc);
        }
        const lastPt = pts[pts.length - 1];
        curvePath.lineTo(lastPt.x, lastPt.y);

        // Fill path down to canvas bottom
        const fillPath = new Path2D(curvePath);
        fillPath.lineTo(lastPt.x, height);
        fillPath.lineTo(pts[0].x, height);
        fillPath.closePath();

        // Docker Blue accent visual style (#0db7ed)
        const isMiddleWave = (waves.length > 2 && i === Math.floor(waves.length / 2));
        const isBottom = (i === waves.length - 1);

        let gradStops: Array<[number, string]>;
        let strokeColor: string;
        let strokeWidth = 1.35;

        if (!isMiddleWave) {
          // Top & bottom waves in Docker blue
          gradStops = [
            [0, isBottom ? 'rgba(13, 183, 237, 0.16)' : 'rgba(13, 183, 237, 0.22)'],
            [0.45, isBottom ? 'rgba(13, 183, 237, 0.06)' : 'rgba(13, 183, 237, 0.08)'],
            [1, 'rgba(13, 183, 237, 0)']
          ];
          strokeColor = isBottom ? 'rgba(13, 183, 237, 0.32)' : 'rgba(13, 183, 237, 0.40)';
          strokeWidth = isBottom ? 1.25 : 1.35;
        } else {
          // Middle veil wave
          gradStops = isDark ? [
            [0, 'rgba(255, 255, 255, 0.12)'],
            [0.55, 'rgba(13, 183, 237, 0.05)'],
            [1, 'rgba(13, 183, 237, 0)']
          ] : [
            [0, 'rgba(255, 255, 255, 0.90)'],
            [0.55, 'rgba(255, 255, 255, 0.32)'],
            [1, 'rgba(255, 255, 255, 0)']
          ];
          strokeColor = isDark ? 'rgba(13, 183, 237, 0.25)' : 'rgba(13, 183, 237, 0.20)';
          strokeWidth = 1.2;
        }

        const grad = ctx.createLinearGradient(0, minY, 0, minY + fadeHeight);
        for (const [offset, color] of gradStops) {
          grad.addColorStop(offset, color);
        }
        ctx.fillStyle = grad;
        ctx.fill(fillPath);

        // Stroke the crisp top edge
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke(curvePath);
      }
      ctx.restore();

      frameCount++;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [isDark]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState(`session_${Date.now()}`);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(true);
  
  // Latency timer state
  const [elapsedMs, setElapsedMs] = useState(0);
  const [activeModel, setActiveModel] = useState<string>(() => {
    const savedProv = localStorage.getItem('ai_provider') || 'local';
    return localStorage.getItem(`ai_model_${savedProv}`) || '';
  });

  // Message format density ('roomy' | 'compact') benchmarked from SpiritLlama Desktop
  const [messageDensity, setMessageDensity] = useState<'roomy' | 'compact'>(() => {
    return (localStorage.getItem('spirit_msg_density') as 'roomy' | 'compact') || 'roomy';
  });
  const [messageDensityOverrides, setMessageDensityOverrides] = useState<Record<string, 'roomy' | 'compact'>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Global Code Line Numbers state
  const [codeLineNumbers, setCodeLineNumbers] = useState<boolean>(() => {
    return localStorage.getItem('aidock_code_linenos') !== 'false';
  });

  useEffect(() => {
    const handleSync = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      if (typeof custom.detail === 'boolean') {
        setCodeLineNumbers(custom.detail);
      }
    };
    window.addEventListener('aidock:code-linenos-change', handleSync);
    return () => window.removeEventListener('aidock:code-linenos-change', handleSync);
  }, []);

  const toggleGlobalLineNumbers = () => {
    const next = !codeLineNumbers;
    setCodeLineNumbers(next);
    localStorage.setItem('aidock_code_linenos', String(next));
    window.dispatchEvent(new CustomEvent('aidock:code-linenos-change', { detail: next }));
  };

  const getEffectiveDensity = (msgId: string): 'roomy' | 'compact' => {
    return messageDensityOverrides[msgId] || messageDensity;
  };

  const toggleMessageDensity = (msgId: string) => {
    setMessageDensityOverrides(prev => {
      const current = prev[msgId] || messageDensity;
      const next = current === 'compact' ? 'roomy' : 'compact';
      return { ...prev, [msgId]: next };
    });
  };

  const toggleGlobalDensity = () => {
    const next = messageDensity === 'compact' ? 'roomy' : 'compact';
    setMessageDensity(next);
    localStorage.setItem('spirit_msg_density', next);
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 1500);
  };

  const handleRestorePrompt = (text: string) => {
    setInput(text);
    if (chatInputRef.current) {
      chatInputRef.current.focus();
      chatInputRef.current.style.height = 'auto';
      chatInputRef.current.style.height = `${Math.min(chatInputRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleReferenceMessage = (msg: Message) => {
    const singleLine = msg.content.replace(/\s+/g, ' ').trim();
    const excerpt = singleLine.length > 220 ? singleLine.slice(0, 220) + '...' : singleLine;
    const modelName = msg.model ? msg.model.split('/').pop() : 'Assistant';
    const header = `[Ref: ${msg.providerLabel || 'Spirit Bird'} • ${modelName}]`;
    const refBlock = `> ${header}\n> ${excerpt}\n\n`;
    setInput(prev => (prev.trim() ? `${refBlock}${prev}` : refBlock));
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };
  
  // ── Cloud Credentials ─────────────────────────────────────────────────────
  const CLOUD_BE = 'https://aicodex-be-1096425756328.us-central1.run.app';

  const [backendMode, setBackendMode] = useState<string>(() =>
    localStorage.getItem('aidock_backend_mode') || 'local'
  );
  const [customEndpoint, setCustomEndpoint] = useState<string>(() =>
    localStorage.getItem('aidock_custom_endpoint') || ''
  );
  const [cloudUsername, setCloudUsername] = useState<string>(() =>
    localStorage.getItem('aidock_cloud_username') || ''
  );
  const [cloudPassword, setCloudPassword] = useState<string>('');
  const [cloudToken, setCloudToken] = useState<string>(() =>
    localStorage.getItem('aidock_cloud_token') || ''
  );
  const [cloudSpaceSlug, setCloudSpaceSlug] = useState<string>(() =>
    localStorage.getItem('aidock_cloud_space') || 'spirit-book'
  );
  const [cloudSpaces, setCloudSpaces] = useState<CloudSpace[]>([]);
  const [cloudSpacesLoading, setCloudSpacesLoading] = useState(false);
  const [localSelectedModel, setLocalSelectedModel] = useState<string>(() =>
    localStorage.getItem('aidock_local_model') || ''
  );
  const [cloudAuthStatus, setCloudAuthStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // ── AI Provider & Cloud Settings (SpiritLlama Desktop Harness Style) ──────
  const [activeProviderId, setActiveProviderId] = useState<string>(() =>
    localStorage.getItem('ai_provider') || 'local'
  );
  const [selectedModalProvId, setSelectedModalProvId] = useState<string>(() =>
    localStorage.getItem('ai_provider') || 'local'
  );
  const [settingsTab, setSettingsTab] = useState<'providers' | 'server' | 'cloud' | 'diagnostics'>('providers');
  const [showKeyPassword, setShowKeyPassword] = useState(false);
  const [providerConfigStatus, setProviderConfigStatus] = useState<string>('');

  // Per-provider state cache
  const [providerApiKeys, setProviderApiKeys] = useState<Record<string, string>>(() => {
    const keys: Record<string, string> = {};
    PROVIDERS.forEach(p => {
      const saved = localStorage.getItem(`${p.id}_api_key`);
      if (saved) keys[p.id] = saved;
    });
    return keys;
  });

  const [providerBaseUrls, setProviderBaseUrls] = useState<Record<string, string>>(() => {
    const urls: Record<string, string> = {};
    PROVIDERS.forEach(p => {
      const saved = localStorage.getItem(`${p.id}_base_url`);
      if (saved) urls[p.id] = saved;
    });
    return urls;
  });

  const [providerAccountIds, setProviderAccountIds] = useState<Record<string, string>>(() => {
    const accs: Record<string, string> = {};
    PROVIDERS.forEach(p => {
      const saved = localStorage.getItem(`${p.id}_account_id`);
      if (saved) accs[p.id] = saved;
    });
    return accs;
  });

  const [providerGatewayIds, setProviderGatewayIds] = useState<Record<string, string>>(() => {
    const gws: Record<string, string> = {};
    PROVIDERS.forEach(p => {
      const saved = localStorage.getItem(`${p.id}_gateway_id`);
      if (saved) gws[p.id] = saved;
    });
    return gws;
  });

  type LocalEngine = 'docker' | 'ollama' | 'vllm';
  const [localEngine, setLocalEngine] = useState<LocalEngine>(() => 
    (localStorage.getItem('aidock_local_engine') as LocalEngine) || 'docker'
  );

  const [providerDiscoveredModels, setProviderDiscoveredModels] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    PROVIDERS.forEach(p => {
      try {
        const saved = JSON.parse(localStorage.getItem(`discovered_models_${p.id}`) || 'null');
        if (Array.isArray(saved) && saved.length > 0) map[p.id] = saved;
        else map[p.id] = [];
      } catch {
        map[p.id] = [];
      }
    });
    return map;
  });

  const [providerSelectedModels, setProviderSelectedModels] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    PROVIDERS.forEach(p => {
      const saved = localStorage.getItem(`ai_model_${p.id}`);
      map[p.id] = saved || '';
    });
    return map;
  });

  const selectActiveProvider = (provId: string) => {
    setActiveProviderId(provId);
    localStorage.setItem('ai_provider', provId);
    const chosenModel = providerSelectedModels[provId] || (provId === 'local' ? localSelectedModel : (providerDiscoveredModels[provId] || [])[0] || '');
    if (chosenModel) {
      setActiveModel(chosenModel);
    }
  };

  const saveAndTestProviderConfig = async (provId: string) => {
    setProviderConfigStatus('Querying models...');
    const prov = PROVIDERS.find(p => p.id === provId) || PROVIDERS[0];
    const key = (providerApiKeys[provId] || '').trim();
    const url = (providerBaseUrls[provId] || '').trim();
    const acc = (providerAccountIds[provId] || '').trim();
    const gw = (providerGatewayIds[provId] || '').trim();

    if (key) localStorage.setItem(`${provId}_api_key`, key);
    else localStorage.removeItem(`${provId}_api_key`);

    if (url) localStorage.setItem(`${provId}_base_url`, url);
    else localStorage.removeItem(`${provId}_base_url`);

    if (acc) localStorage.setItem(`${provId}_account_id`, acc);
    else localStorage.removeItem(`${provId}_account_id`);

    if (gw) localStorage.setItem(`${provId}_gateway_id`, gw);
    else localStorage.removeItem(`${provId}_gateway_id`);

    if (prov.placeholder) {
      setProviderConfigStatus('Placeholder provider active.');
      return;
    }

    try {
      let discovered: string[] = [];
      const effectiveUrl = url || prov.defaultUrl;

      // 1. Try backend proxy first to avoid any CORS issues with remote API endpoints
      try {
        const pRes = await fetch(getBackendUrl('proxy/models'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: provId,
            base_url: effectiveUrl,
            api_key: key,
            account_id: acc
          })
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          if (Array.isArray(pData.models) && pData.models.length > 0) {
            discovered = pData.models;
          }
        }
      } catch {}

      // 2. Direct browser queries as secondary fallback
      if (discovered.length === 0) {
        if (provId === 'gemini' && key) {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.models)) {
              discovered = data.models
                .map((m: any) => m.name.replace(/^models\//, ''))
                .filter((id: string) => id.includes('gemini'));
            }
          }
        } else if (provId === 'local') {
          if (localEngine === 'docker') {
            const res = await fetch(getBackendUrl('models/local')).catch(() => null);
            if (res && res.ok) {
              const data = await res.json();
              discovered = data.models || [];
            }
            if (discovered.length === 0) {
              const infoRes = await fetch(getBackendUrl('info')).catch(() => null);
              if (infoRes && infoRes.ok) {
                const infoData = await infoRes.json();
                if (infoData.model_name) discovered = [infoData.model_name];
              }
            }
          } else if (localEngine === 'ollama') {
            const res = await fetch(`${effectiveUrl}/api/tags`).catch(() => null);
            if (res && res.ok) {
              const data = await res.json();
              if (Array.isArray(data.models)) {
                discovered = data.models.map((m: any) => m.name || m.model || m);
              }
            }
          } else if (localEngine === 'vllm') {
            const endpoint = effectiveUrl.endsWith('/v1') ? `${effectiveUrl}/models` : `${effectiveUrl}/v1/models`;
            const res = await fetch(endpoint).catch(() => null);
            if (res && res.ok) {
              const data = await res.json();
              const items = Array.isArray(data.data) ? data.data : Array.isArray(data.models) ? data.models : [];
              discovered = items.map((m: any) => m.id || m.name).filter(Boolean);
            }
          }
        } else if (key || provId === 'ollama_cloud') {
          const endpoint = effectiveUrl.replace(/\/+$/, '') + (effectiveUrl.includes('/v1') ? '/models' : '/v1/models');
          const hdrs: Record<string, string> = {};
          if (key) hdrs['Authorization'] = `Bearer ${key}`;
          if (provId === 'openrouter') {
            hdrs['HTTP-Referer'] = 'http://localhost:3000';
            hdrs['X-Title'] = 'AIDock Orchestrator';
          }
          const res = await fetch(endpoint, { headers: hdrs }).catch(() => null);
          if (res && res.ok) {
            const data = await res.json();
            const items = Array.isArray(data.data) ? data.data : Array.isArray(data.models) ? data.models : [];
            discovered = items.map((m: any) => m.id || m.name).filter(Boolean).slice(0, 60);
          }
        }
      }

      if (discovered.length > 0) {
        setProviderDiscoveredModels(prev => {
          const updated = { ...prev, [provId]: discovered };
          localStorage.setItem(`discovered_models_${provId}`, JSON.stringify(discovered));
          return updated;
        });
        setProviderConfigStatus(`Discovered ${discovered.length} live model(s)!`);
        if (!providerSelectedModels[provId] || !discovered.includes(providerSelectedModels[provId])) {
          setProviderSelectedModels(prev => ({ ...prev, [provId]: discovered[0] }));
          localStorage.setItem(`ai_model_${provId}`, discovered[0]);
          if (activeProviderId === provId) setActiveModel(discovered[0]);
        }
      } else {
        setProviderConfigStatus('Config saved. (No live models returned from endpoint)');
      }
    } catch (err: any) {
      setProviderConfigStatus(`Config saved locally. Note: ${err.message || 'Direct probe skipped'}`);
    }
  };

  // Determine the correct base URL for the active cloud backend
  const getCloudBase = (): string => {
    if (backendMode === 'custom' && customEndpoint)
      return customEndpoint.replace(/\/+$/, '');
    // Both cloud-standard and cloud-premium use the same BE for now;
    // premium gets injected via the space slug / model override.
    return CLOUD_BE;
  };

  // Fetch available spaces from cloud after authentication
  const fetchSpaces = async (token: string) => {
    setCloudSpacesLoading(true);
    try {
      const base = getCloudBase();
      const res = await fetch(`${base}/api/spaces/`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data: CloudSpace[] = await res.json();
        setCloudSpaces(data);
        // If current slug isn't in the list, pick the first available
        const slugs = data.map(s => s.slug);
        const currentSlug = localStorage.getItem('aidock_cloud_space') || 'spirit-book';
        if (!slugs.includes(currentSlug) && data.length > 0) {
          const fallback = data[0].slug;
          setCloudSpaceSlug(fallback);
          localStorage.setItem('aidock_cloud_space', fallback);
        }
      }
    } catch (e) {
      console.error('Failed to fetch cloud spaces:', e);
    } finally {
      setCloudSpacesLoading(false);
    }
  };

  // Fetch models for the selected space's recommended provider
  const fetchCloudModels = async (token: string, space: CloudSpace) => {
    const provider = space.recommended_provider;
    if (!provider || provider === 'local') return;
    try {
      const base = getCloudBase();
      const res = await fetch(
        `${base}/api/models?provider=${encodeURIComponent(provider)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Space-Slug': space.slug,
          }
        }
      );
      if (res.ok) {
        const data: CloudModel[] = await res.json();
        const modelNames = data.map(m => m.id);
        if (modelNames.length > 0) {
          setProviderDiscoveredModels(prev => ({ ...prev, [provider]: modelNames }));
          const recommended = space.recommended_model;
          const match = recommended ? data.find(m => m.id === recommended) : null;
          const best = match ? match.id : data[0]?.id || '';
          if (best) {
            setProviderSelectedModels(prev => ({ ...prev, [provider]: best }));
            localStorage.setItem(`ai_model_${provider}`, best);
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch cloud models:', e);
    }
  };

  // Authenticate against the AICodex Cloud Run backend and persist JWT
  const loginToCloud = async (): Promise<string | null> => {
    if (!cloudUsername.trim() || !cloudPassword.trim()) {
      setCloudAuthStatus('error');
      return null;
    }
    setCloudAuthStatus('loading');
    try {
      const base = getCloudBase();
      const body = new URLSearchParams();
      body.append('username', cloudUsername.trim());
      body.append('password', cloudPassword.trim());

      const res = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
        throw new Error(err.detail || `Login failed (${res.status})`);
      }

      const data = await res.json();
      const token: string = data.access_token;
      setCloudToken(token);
      localStorage.setItem('aidock_cloud_token', token);
      setCloudAuthStatus('ok');
      // Eagerly load spaces after successful login
      await fetchSpaces(token);
      return token;
    } catch (err: any) {
      setCloudAuthStatus('error');
      return null;
    }
  };

  // Build Authorization header object for cloud requests
  const cloudAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (cloudToken) headers['Authorization'] = `Bearer ${cloudToken}`;
    return headers;
  };

  // Admin functions moved to dedicated AdminPage

  // ── Routing helper ────────────────────────────────────────────────────────
  const isCloudMode = (): boolean =>
    ['cloud-standard', 'cloud-premium', 'custom'].includes(backendMode);

  const getBackendUrl = (path: string): string => {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Workspace-bound ops are always local
    const localPrefixes = ['files', 'file-content', 'export', 'upload', 'log'];
    if (localPrefixes.some(pref => cleanPath.startsWith(pref)))
      return `/api/${cleanPath}`;

    if (!isCloudMode()) return `/api/${cleanPath}`;

    const base = getCloudBase();
    // chat → codegen spaces endpoint on cloud
    if (cleanPath === 'chat')
      return `${base}/api/spaces/${cloudSpaceSlug}/codegen`;
    // info → healthz on cloud
    if (cleanPath === 'info')
      return `${base}/api/healthz`;
    return `${base}/api/${cleanPath}`;
  };
  
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
  const [isSidebarModelListExpanded, setIsSidebarModelListExpanded] = useState(false);

  // Workspaces (Projects) state
  const [workspaces, setWorkspaces] = useState<WorkspaceProject[]>(() => {
    try {
      const saved = localStorage.getItem('aidock_workspaces');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_WORKSPACES;
  });
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    return localStorage.getItem('aidock_active_workspace') || 'default';
  });
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspacePath, setNewWorkspacePath] = useState('');

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0] || DEFAULT_WORKSPACES[0];

  // Sessions (Chats) state
  const [sessionsList, setSessionsList] = useState<ChatSessionItem[]>([]);

  const fetchSessionsList = async () => {
    try {
      const res = await fetch(getBackendUrl('sessions'));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSessionsList(data);
        }
      }
    } catch (e) {
      console.debug('Failed to fetch sessions:', e);
    }
  };

  const handleSelectSession = async (sId: string) => {
    setSessionId(sId);
    try {
      const res = await fetch(getBackendUrl(`sessions/${sId}/messages`));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          const mapped: Message[] = data.messages.map((m: any) => ({
            id: m.id || `msg_${Date.now()}`,
            sender: m.sender || 'bot',
            content: m.content || '',
            workspaceUsed: m.workspaceUsed,
            provider: m.provider,
            model: m.model,
            providerLabel: m.providerLabel,
            timestamp: m.created_at ? new Date(m.created_at).getTime() : Date.now()
          }));
          setMessages(mapped);
        }
      }
      fetchFiles(sId);
    } catch (e) {
      console.error('Failed to load session messages:', e);
    }
  };

  const handleNewChat = () => {
    const newId = `session_${Date.now()}`;
    setSessionId(newId);
    setMessages([]);
    setFiles([]);
    fetchFiles(newId);
  };

  const formatSessionDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  // Auto-load spaces when token already exists on mount
  useEffect(() => {
    if (cloudToken && isCloudMode()) {
      fetchSpaces(cloudToken);
    }
  }, [cloudToken, backendMode]);

  // When space selection changes, load its models
  useEffect(() => {
    if (!cloudToken || !cloudSpaceSlug || !isCloudMode()) return;
    const space = cloudSpaces.find(s => s.slug === cloudSpaceSlug);
    if (space) fetchCloudModels(cloudToken, space);
  }, [cloudSpaceSlug, cloudSpaces, cloudToken]);

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
  const fetchFiles = async (targetSessionId?: string) => {
    try {
      const sId = targetSessionId || sessionId;
      const headers: HeadersInit = isCloudMode() ? cloudAuthHeaders() : {};
      const res = await fetch(getBackendUrl(`files?session_id=${sId}`), { headers });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  };

  // Fetch files and sessions when messages list or session changes
  useEffect(() => {
    fetchFiles();
    fetchSessionsList();
  }, [messages, sessionId]);

  // Fetch active model info on mount and when backendMode/token changes
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const url = getBackendUrl('info');
        const headers: HeadersInit = isCloudMode() ? cloudAuthHeaders() : {};
        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          // Local: { model_name }  |  Cloud: { status, timestamp }
          if (data.model_name) {
            setLocalSelectedModel(data.model_name);
            if (activeProviderId === 'local') {
              setActiveModel(data.model_name);
            }
          } else if (data.status === 'healthy') {
            if (isCloudMode()) {
              setActiveModel(`AICodex Cloud · ${cloudSpaceSlug}`);
            }
          }
          setConnected(true);
        } else if (res.status === 401 && isCloudMode()) {
          if (isCloudMode()) setActiveModel('Auth Required');
          setConnected(false);
        } else {
          if (activeProviderId === 'local') setActiveModel('Disconnected');
          setConnected(false);
        }
      } catch (err) {
        console.error('Error fetching model info:', err);
        if (activeProviderId === 'local') setActiveModel('Connection Error');
        setConnected(false);
      }
    };
    fetchInfo();
  }, [backendMode]);

  // Fetch local /models when in local backend mode
  const fetchLocalModels = async () => {
    if (isCloudMode()) return;
    try {
      let slugs: string[] = [];
      if (localEngine === 'docker') {
        const res = await fetch(getBackendUrl('models/local')).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          slugs = data.models || [];
        }
        if (slugs.length === 0) {
          const infoRes = await fetch(getBackendUrl('info')).catch(() => null);
          if (infoRes && infoRes.ok) {
            const infoData = await infoRes.json();
            if (infoData.model_name) slugs = [infoData.model_name];
          }
        }
      } else if (localEngine === 'ollama') {
        const ollamaUrl = providerBaseUrls['local'] || 'http://127.0.0.1:11434';
        const res = await fetch(`${ollamaUrl}/api/tags`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          slugs = (data.models || []).map((m: any) => m.name || m.model || m);
        }
        if (slugs.length === 0) {
          try {
            const pRes = await fetch(getBackendUrl('proxy/models'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                provider: 'local',
                base_url: ollamaUrl
              })
            });
            if (pRes.ok) {
              const pData = await pRes.json();
              if (Array.isArray(pData.models) && pData.models.length > 0) {
                slugs = pData.models;
              }
            }
          } catch {}
        }
      } else if (localEngine === 'vllm') {
        const vllmUrl = providerBaseUrls['local'] || 'http://127.0.0.1:8000/v1';
        const endpoint = vllmUrl.endsWith('/v1') ? `${vllmUrl}/models` : `${vllmUrl}/v1/models`;
        const res = await fetch(endpoint).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          slugs = (data.data || []).map((m: any) => m.id || m.name);
        }
        if (slugs.length === 0) {
          try {
            const pRes = await fetch(getBackendUrl('proxy/models'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                provider: 'local',
                base_url: vllmUrl
              })
            });
            if (pRes.ok) {
              const pData = await pRes.json();
              if (Array.isArray(pData.models) && pData.models.length > 0) {
                slugs = pData.models;
              }
            }
          } catch {}
        }
      }

      if (slugs.length > 0) {
        setProviderDiscoveredModels(prev => ({ ...prev, local: slugs }));
        localStorage.setItem('discovered_models_local', JSON.stringify(slugs));
        setLocalSelectedModel(slugs[0]);
        if (!providerSelectedModels['local'] || !slugs.includes(providerSelectedModels['local'])) {
          setProviderSelectedModels(prev => ({ ...prev, local: slugs[0] }));
          localStorage.setItem('ai_model_local', slugs[0]);
          if (activeProviderId === 'local') setActiveModel(slugs[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch local models:', e);
    }
  };

  useEffect(() => {
    fetchLocalModels();
  }, [backendMode, localEngine]);

  // Load a file from tree into editor
  const openFileInEditor = async (filePath: string) => {
    try {
      const res = await fetch(getBackendUrl(`file-content?session_id=${sessionId}&path=${encodeURIComponent(filePath)}`));
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
      const res = await fetch(getBackendUrl(`upload?session_id=${sessionId}`), {
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
        setAttachedFiles(prev => [...prev, { id: `att_${Date.now()}`, name: file.name, size: file.size }]);
        playAlertSound('success');
        fetchFiles();
      } else {
        throw new Error("Upload failed on server");
      }
    } catch (err: any) {
      playAlertSound('warning');
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
      const res = await fetch(getBackendUrl('export'), {
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

  const logToContainer = async (level: string, message: string) => {
    try {
      await fetch(getBackendUrl('log'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, message })
      });
    } catch (e) {
      console.error('Failed to log to container:', e);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const provId = activeProviderId;
    const provDef = PROVIDERS.find(p => p.id === provId) || PROVIDERS[0];
    const apiKey = (providerApiKeys[provId] || '').trim();
    const baseUrl = (providerBaseUrls[provId] || '').trim();
    const modelSlug = providerSelectedModels[provId] || (provId === 'local' ? localSelectedModel : activeModel);
    const effectiveBaseUrl = baseUrl || provDef.defaultUrl || undefined;
    const effectiveProviderLabel = provId === 'local' ? (localEngine === 'docker' ? 'Docker Models' : (localEngine === 'ollama' ? 'Ollama' : 'vLLM')) : provDef.label;
    const effectiveModelName = modelSlug || (provId === 'local' ? localSelectedModel : (providerSelectedModels[provId] || activeModel || 'Model'));

    // Guard: cloud mode requires a JWT
    if (isCloudMode() && !cloudToken) {
      playAlertSound('warning');
      const errorMessage: Message = {
        id: `msg_${Date.now()}_e`,
        sender: 'bot',
        content: 'Cloud inference requires credentials. Open Settings and sign in to AICodex Cloud first.',
        provider: provId,
        model: effectiveModelName,
        providerLabel: effectiveProviderLabel
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Guard: if provider requires API key and not provided
    if (provDef.requiresKey && !apiKey && !isCloudMode()) {
      playAlertSound('warning');
      const errorMessage: Message = {
        id: `msg_${Date.now()}_e`,
        sender: 'bot',
        content: `API Key required for **${effectiveProviderLabel}**. Click the **${effectiveProviderLabel}** pill in the top header or open Connection Settings to enter your API key.`,
        provider: provId,
        model: effectiveModelName,
        providerLabel: effectiveProviderLabel
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      content: input,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);
    const startTime = Date.now();

    logToContainer('info', `User interaction submitted - Session: ${sessionId} - Provider: ${provId} - Model: ${modelSlug} - Prompt: "${currentInput.substring(0, 60)}..."`);

    try {
      const chatUrl = getBackendUrl('chat');

      // Cloud uses the codegen spaces endpoint; local uses the standard chat endpoint
      const cloudBody: Record<string, string> = { prompt: currentInput };
      if (modelSlug) cloudBody.model = modelSlug;
      if (provId) cloudBody.provider = provId;

      const fetchOptions: RequestInit = isCloudMode()
        ? {
            method: 'POST',
            headers: cloudAuthHeaders(),
            body: JSON.stringify(cloudBody),
          }
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: currentInput, 
              session_id: sessionId, 
              provider: provId,
              model_slug: modelSlug || (provId === 'local' ? localSelectedModel : undefined),
              api_key: apiKey || undefined,
              base_url: effectiveBaseUrl,
              spiritcloud_token: cloudToken || undefined,
              spirit_cloud_api_url: getCloudBase(),
              cloud_token: cloudToken || undefined,
              cloud_api_url: getCloudBase()
            }),
          };

      let res = await fetch(chatUrl, fetchOptions);

      // Auto-retry once with fresh token if 401
      if (res.status === 401 && isCloudMode()) {
        logToContainer('info', 'Cloud token expired, attempting re-auth...');
        const newToken = await loginToCloud();
        if (newToken) {
          const retryHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${newToken}` };
          res = await fetch(chatUrl, { ...fetchOptions, headers: retryHeaders });
        } else {
          throw new Error('Session expired. Please re-enter your credentials in Settings.');
        }
      }

      if (!res.ok) {
        let errorDetail = `Server error (${res.status})`;
        try { const e = await res.json(); errorDetail = e.detail || errorDetail; } catch (_) {}
        throw new Error(errorDetail);
      }

      const data = await res.json();
      const latency = Date.now() - startTime;

      // Map cloud codegen response (generatedCode) OR local response (response)
      const responseText: string = data.generatedCode ?? data.response ?? JSON.stringify(data);
      const workspaceUsed: string | undefined = data.workspace_used;

      logToContainer('info', `LLM handler success - Session: ${sessionId} - Latency: ${latency}ms`);

      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}_b`,
        sender: 'bot',
        content: responseText,
        workspaceUsed,
        latencyMs: latency,
        provider: data.provider || provId,
        model: data.model_used || effectiveModelName,
        providerLabel: effectiveProviderLabel,
        timestamp: Date.now(),
      }]);
      playAlertSound('success');

    } catch (err: any) {
      playAlertSound('warning');
      const isConnectionError = err.message === 'Failed to fetch';
      logToContainer('error', `Handler output failure - Session: ${sessionId} - Error: ${err.message}`);
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}_e`,
        sender: 'bot',
        content: isConnectionError
          ? 'Error: Failed to connect to backend. Check that Docker is running or your cloud credentials are valid.'
          : `Error: ${err.message || 'An unknown error occurred.'}`,
        provider: provId,
        model: effectiveModelName,
        providerLabel: effectiveProviderLabel
      }]);
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
    <div className="flex h-screen w-screen overflow-hidden overscroll-none bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200 antialiased select-none">
      {/* ── SpiritLlama Left Sidebar (Docked 1:1) ── */}
      <aside className={`bg-[var(--bg-surface)] border-r border-[var(--border-default)] flex flex-col justify-between shrink-0 z-40 transition-all duration-300 h-full overflow-hidden select-none ${
        isSidebarOpen ? "w-[260px]" : "w-0 border-none"
      }`}>
        {/* TOP SCROLLABLE SECTION */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">

          {/* 1. BRAND & MASCOT HERO (SpiritLlama 1:1) */}
          <div className="p-4 pb-3 flex flex-col items-center border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] relative">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-2.5 right-2.5 p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-all cursor-pointer"
              title="Close Sidepanel (Esc)"
            >
              <X className="w-4 h-4" />
            </button>

            <div
              className="w-18 h-18 rounded-2xl bg-transparent shadow-md flex items-center justify-center p-2 mb-1.5 border-2 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => {
                setMessages([]);
                setIsSidebarOpen(false);
              }}
              title="Start New Session"
            >
              <img src={spiritDockLogo} alt="SpiritDock" className="w-14 h-14 object-contain" />
            </div>

            <div className="font-extrabold text-base tracking-tight text-[var(--text-primary)] flex items-center gap-0.5">
              AI<span className="text-[#0db7ed]">Dock</span><span className="text-[var(--text-muted)] font-mono text-xs font-normal">.dc</span>
            </div>

            <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] font-bold mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isNeuralCore(activeProviderId) ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]' : 'bg-[#0db7ed] shadow-[0_0_6px_rgba(13,183,237,0.7)]'} animate-pulse`} />
              <span>{isNeuralCore(activeProviderId) ? 'NEURAL CORE' : 'CLOUD CORE'}</span>
            </div>
          </div>

          {/* 2. ACTIVE PROJECT / WORKSPACE SELECTOR BAR */}
          <div className="px-3 pt-2.5 pb-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] relative">
            <div className="flex items-center justify-between mb-1 px-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Active Workspace</span>
              <button 
                type="button" 
                onClick={() => setIsNewWorkspaceModalOpen(true)}
                className="text-[9px] font-bold text-[#0db7ed] hover:underline cursor-pointer flex items-center gap-0.5"
                title="Create New Workspace"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>

            <div 
              className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[#0db7ed]/5 border border-[var(--border-subtle)] hover:border-[#0db7ed]/50 text-left transition-all cursor-pointer shadow-sm"
              onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FolderGit2 className="w-4 h-4 text-[#0db7ed] shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {activeWorkspace.name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 text-[8px] font-mono font-bold shrink-0">
                      git
                    </span>
                  </div>
                  <div className="text-[9px] font-mono text-[var(--text-muted)] truncate" title={activeWorkspace.path}>
                    {activeWorkspace.path}
                  </div>
                </div>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            </div>

            {/* Dropdown list of workspaces */}
            {isWorkspaceDropdownOpen && (
              <div className="absolute left-3 right-3 top-[100%] z-50 mt-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-xl overflow-hidden py-1">
                <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                  Available Workspaces
                </div>
                <div className="max-h-48 overflow-y-auto py-1">
                  {workspaces.map(w => {
                    const isActive = w.id === activeWorkspaceId;
                    return (
                      <div
                        key={w.id}
                        onClick={() => {
                          setActiveWorkspaceId(w.id);
                          localStorage.setItem('aidock_active_workspace', w.id);
                          setIsWorkspaceDropdownOpen(false);
                        }}
                        className={`px-2.5 py-2 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          isActive ? 'bg-[#0db7ed]/10 text-[#0db7ed] font-semibold' : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{w.name}</span>
                            {w.isGit && <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 text-[var(--text-secondary)]">git</span>}
                          </div>
                          <div className="text-[9px] font-mono text-[var(--text-muted)] truncate">{w.path}</div>
                        </div>
                        {isActive && <Check className="w-3.5 h-3.5 text-[#0db7ed] shrink-0" />}
                      </div>
                    );
                  })}
                </div>
                <div className="pt-1 border-t border-[var(--border-subtle)] px-2 pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsWorkspaceDropdownOpen(false);
                      setIsNewWorkspaceModalOpen(true);
                    }}
                    className="w-full py-1.5 px-2 rounded-lg text-[10px] font-bold text-[#0db7ed] hover:bg-[#0db7ed]/10 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> New Workspace...
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. MODELS SECTION PANEL (Dynamic for ALL providers!) */}
          <div className="px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <button
                type="button"
                onClick={() => setIsSidebarModelListExpanded(!isSidebarModelListExpanded)}
                className="flex items-center gap-1.5 min-w-0 cursor-pointer group text-left max-w-[200px]"
                title={isSidebarModelListExpanded ? "Collapse Models List" : "Expand Models List"}
              >
                <ChevronDown className={`w-3 h-3 text-[var(--text-muted)] group-hover:text-[#0db7ed] transition-transform duration-200 shrink-0 ${isSidebarModelListExpanded ? '' : '-rotate-90'}`} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--text-primary)] shrink-0">Models</span>
                {isSidebarModelListExpanded ? (
                  <span className="px-1.5 py-0.2 rounded bg-[#0db7ed]/15 text-[#0db7ed] border border-[#0db7ed]/30 text-[8px] font-mono font-bold uppercase shrink-0">
                    {PROVIDERS.find(p => p.id === activeProviderId)?.badge || 'LOCAL'}
                  </span>
                ) : (
                  <span 
                    className="max-w-[125px] truncate px-1.5 py-0.2 rounded bg-[#0db7ed]/15 text-[#0db7ed] border border-[#0db7ed]/30 text-[8px] font-mono font-bold uppercase"
                    title={`${PROVIDERS.find(p => p.id === activeProviderId)?.badge || 'LOCAL'} | ${(providerSelectedModels[activeProviderId] || activeModel || '').split('/').pop() || 'None'}`}
                  >
                    {PROVIDERS.find(p => p.id === activeProviderId)?.badge || 'LOCAL'} | {(providerSelectedModels[activeProviderId] || activeModel || '').split('/').pop() || 'None'}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-1">
                <button 
                  type="button" 
                  onClick={() => saveAndTestProviderConfig(activeProviderId)}
                  className="p-0.5 rounded text-[var(--text-muted)] hover:text-[#0db7ed] transition-colors cursor-pointer"
                  title="Discover Live Models"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setSelectedModalProvId(activeProviderId);
                    setSettingsTab('providers');
                    setShowSettingsModal(true);
                  }}
                  className="text-[9px] font-bold text-[#0db7ed] hover:underline cursor-pointer" 
                  title="Configure Providers & API Keys"
                >
                  Providers ▸
                </button>
              </div>
            </div>

            {/* Collapsible Container (Active Model Strip + Selectable Models) */}
            {isSidebarModelListExpanded && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                {/* Active Model Header Display Strip */}
                <div 
                  onClick={() => setIsSidebarModelListExpanded(false)}
                  className="text-[11px] font-mono bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] hover:border-[#0db7ed]/40 px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-1.5 shadow-sm cursor-pointer transition-all select-none"
                  title="Click to collapse model selection list"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-white border border-black/10 flex items-center justify-center p-0.5 shrink-0 shadow-sm">
                      <ProviderBrandIcon providerId={activeProviderId} className="w-3.5 h-3.5 object-contain" />
                    </div>
                    <span className="font-bold text-[var(--text-primary)] truncate" title={activeModel}>
                      {activeModel ? activeModel.split('/').pop() : 'Scanning...'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] text-[#0db7ed] font-semibold">Active</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  </div>
                </div>

                {/* Selectable Model Pills */}
                {(() => {
                  const activeProv = PROVIDERS.find(p => p.id === activeProviderId);
              const discovered = providerDiscoveredModels[activeProviderId] || [];
              const hasKey = Boolean(providerApiKeys[activeProviderId]);

              if (activeProv?.coreGroup === 'cloud' && !hasKey) {
                return (
                  <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-dashed border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] text-center space-y-1">
                    <div>API Key Required</div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedModalProvId(activeProviderId);
                        setSettingsTab('providers');
                        setShowSettingsModal(true);
                      }}
                      className="text-[9px] font-bold text-[#0db7ed] hover:underline cursor-pointer block w-full"
                    >
                      Configure Key ▸
                    </button>
                  </div>
                );
              }

              if (discovered.length === 0) {
                return (
                  <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-dashed border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] text-center space-y-1">
                    <div>No models loaded</div>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeProviderId === 'local') fetchLocalModels();
                        else saveAndTestProviderConfig(activeProviderId);
                      }}
                      className="text-[9px] font-bold text-[#0db7ed] hover:underline cursor-pointer block w-full"
                    >
                      Scan Models ↻
                    </button>
                  </div>
                );
              }

              return (
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-0.5">
                  {discovered.map(m => {
                    const isSelected = (providerSelectedModels[activeProviderId] === m || activeModel === m);
                    const shortName = m.split('/').pop() || m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setProviderSelectedModels(prev => ({ ...prev, [activeProviderId]: m }));
                          setActiveModel(m);
                          localStorage.setItem(`ai_model_${activeProviderId}`, m);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition-all cursor-pointer truncate max-w-[190px] ${
                          isSelected
                            ? 'border-[#0db7ed] bg-[#0db7ed]/15 text-[#0db7ed] font-bold shadow-xs'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[#0db7ed]/40 hover:text-[var(--text-primary)]'
                        }`}
                        title={m}
                      >
                        {shortName}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
              </div>
            )}
          </div>

          {/* 4. SUB-NAVIGATION TABS: Standard vs CodexSpaces */}
          <div className="px-2.5 py-2 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
            <div className="w-full grid grid-cols-2 gap-1 p-1 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setActiveSidebarTab('standard')}
                className={`py-1 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeSidebarTab === 'standard'
                    ? 'bg-[#0db7ed] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>Standard</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSidebarTab('spaces')}
                className={`py-1 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeSidebarTab === 'spaces'
                    ? 'bg-[#0db7ed] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>CodexSpaces</span>
              </button>
            </div>
          </div>

          {/* 5. SEARCH FILTER */}
          <div className="p-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder={activeSidebarTab === 'standard' ? "Filter standard workspaces & files..." : "Filter CodexSpaces..."}
                className="w-full pl-8 pr-6 py-1 text-xs bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#0db7ed] transition-all"
              />
              {sidebarSearch && (
                <button
                  onClick={() => setSidebarSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* 6. DYNAMIC TAB CONTENT */}
          <div className="p-3 flex-1 overflow-y-auto space-y-3">
            {activeSidebarTab === 'standard' ? (
              <>
                {/* Standard Tab: Chats (Sessions) inside Active Workspace */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Chats ({sessionsList.filter(s => !sidebarSearch || s.title.toLowerCase().includes(sidebarSearch.toLowerCase())).length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleNewChat();
                        setIsSidebarOpen(false);
                      }}
                      className="text-[9px] font-bold text-[#0db7ed] hover:underline flex items-center gap-0.5 cursor-pointer"
                      title="Start New Chat Session"
                    >
                      <Plus className="w-3 h-3" /> New Chat
                    </button>
                  </div>

                  <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                    {sessionsList
                      .filter(s => !sidebarSearch || s.title.toLowerCase().includes(sidebarSearch.toLowerCase()))
                      .map(s => {
                        const sid = s.session_id || String(s.id || '');
                        const isActive = sid === sessionId;
                        return (
                          <div
                            key={sid}
                            onClick={() => {
                              handleSelectSession(sid);
                              setIsSidebarOpen(false);
                            }}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                              isActive
                                ? 'border-[#0db7ed] bg-[#0db7ed]/10 shadow-sm'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                isActive
                                  ? 'bg-[#0db7ed] border-[#0db7ed] text-white shadow-xs'
                                  : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                              }`}>
                                <Layers className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[var(--text-primary)] truncate" title={s.title}>
                                  {s.title}
                                </div>
                                <div className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                                  {formatSessionDate(s.created_at)}
                                </div>
                              </div>
                            </div>
                            {isActive && <Check className="w-3.5 h-3.5 text-[#0db7ed] shrink-0" />}
                          </div>
                        );
                      })}
                    {sessionsList.length === 0 && (
                      <p className="text-[11px] text-[var(--text-muted)] italic px-1 py-1">No chats found</p>
                    )}
                  </div>
                </div>

                {/* Workspace Files (Collapsible Recursive File Tree) */}
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <FileTree
                    files={files}
                    onOpenFile={openFileInEditor}
                    onRefresh={() => fetchFiles(sessionId)}
                    isExpanded={isFileTreeExpanded}
                    onToggleExpanded={() => setIsFileTreeExpanded(!isFileTreeExpanded)}
                  />
                </div>
              </>
            ) : (
              <>
                {/* CodexSpaces Catalog Tab */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      CodexSpaces ({CODEX_SPACES_CATALOG.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSettingsModal(true)}
                      className="text-[9px] font-bold text-[#0db7ed] hover:underline flex items-center gap-0.5 cursor-pointer"
                      title="Configure Cloud Spaces"
                    >
                      <Plus className="w-3 h-3" /> Browse
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                    {CODEX_SPACES_CATALOG
                      .filter(space => !sidebarSearch || space.name.toLowerCase().includes(sidebarSearch.toLowerCase()) || space.desc.toLowerCase().includes(sidebarSearch.toLowerCase()))
                      .map(space => {
                        const isActiveSpace = cloudSpaceSlug === space.slug;
                        return (
                          <div
                            key={space.id}
                            onClick={() => {
                              setCloudSpaceSlug(space.slug);
                              localStorage.setItem('aidock_cloud_space', space.slug);
                              setIsSidebarOpen(false);
                            }}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                              isActiveSpace
                                ? 'border-[#0db7ed] bg-[#0db7ed]/10 shadow-sm'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                isActiveSpace
                                  ? 'bg-[#0db7ed] border-[#0db7ed] text-white shadow-xs'
                                  : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[#0db7ed]'
                              }`}>
                                <Box className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-[var(--text-primary)] truncate">{space.name}</span>
                                  <span className="text-[8px] font-mono bg-black/10 dark:bg-white/10 px-1 py-0.2 rounded text-[var(--text-secondary)] font-bold">{space.tag}</span>
                                </div>
                                <div className="text-[10px] text-[var(--text-secondary)] truncate">{space.desc}</div>
                              </div>
                            </div>
                            {isActiveSpace && <Check className="w-3.5 h-3.5 text-[#0db7ed] shrink-0" />}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Workspace Files */}
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <FileTree
                    files={files}
                    onOpenFile={openFileInEditor}
                    onRefresh={() => fetchFiles(sessionId)}
                    isExpanded={isFileTreeExpanded}
                    onToggleExpanded={() => setIsFileTreeExpanded(!isFileTreeExpanded)}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* 7. SIDEBAR BOTTOM ACTIONS (SpiritLlama 1:1) */}
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                handleNewChat();
                setIsSidebarOpen(false);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-[#0db7ed] hover:bg-[#0099cc] active:bg-[#0aa5d6] text-white text-xs font-bold shadow-[0_4px_14px_rgba(13,183,237,0.35)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>NEW CHAT</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[#0db7ed]/10 border border-[var(--border-subtle)] hover:border-[#0db7ed]/35 text-[var(--text-primary)] hover:text-[#0db7ed] transition-all cursor-pointer shadow-sm shrink-0"
              title="Sync with Cloud Backend"
            >
              <Cloud className="w-4 h-4 text-[#0db7ed]" />
            </button>

            <button
              type="button"
              onClick={() => setShowFunctionShortcuts(!showFunctionShortcuts)}
              className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm shrink-0 ${
                showFunctionShortcuts
                  ? 'bg-[#0db7ed] text-white border-[#0db7ed]'
                  : 'bg-[var(--bg-surface-elevated)] hover:bg-[#0db7ed]/10 border-[var(--border-subtle)] hover:border-[#0db7ed]/35 text-[var(--text-primary)]'
              }`}
              title="Toggle Functions (Agents, Integrations, Studio, Browser)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* FUNCTION SHORTCUTS GRID (SpiritLlama 1:1) */}
          {showFunctionShortcuts && (
            <div className="grid grid-cols-4 gap-1 p-1 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => {
                  setInput("Run autonomous multi-agent analysis on current workspace.");
                  setIsSidebarOpen(false);
                }}
                className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[var(--text-secondary)] hover:text-[#0db7ed] hover:bg-[var(--bg-surface)] transition-all cursor-pointer"
                title="Agents — Autonomous agent swarms"
              >
                <Bot className="w-3.5 h-3.5 text-[#0db7ed]" />
                <span className="text-[9px] font-semibold mt-0.5">Agents</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(true);
                  setIsSidebarOpen(false);
                }}
                className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[var(--text-secondary)] hover:text-[#0db7ed] hover:bg-[var(--bg-surface)] transition-all cursor-pointer"
                title="Integrations — Tools & Connectors"
              >
                <Boxes className="w-3.5 h-3.5 text-[#0db7ed]" />
                <span className="text-[9px] font-semibold mt-0.5">Tools</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInput("Generate optimized system prompt and eval benchmarks.");
                  setIsSidebarOpen(false);
                }}
                className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[var(--text-secondary)] hover:text-[#0db7ed] hover:bg-[var(--bg-surface)] transition-all cursor-pointer"
                title="Studio — Model playground"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0db7ed]" />
                <span className="text-[9px] font-semibold mt-0.5">Studio</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInput("Open web browser and search for latest documentation.");
                  setIsSidebarOpen(false);
                }}
                className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[var(--text-secondary)] hover:text-[#0db7ed] hover:bg-[var(--bg-surface)] transition-all cursor-pointer"
                title="Browser — Web navigation"
              >
                <Globe className="w-3.5 h-3.5 text-[#0db7ed]" />
                <span className="text-[9px] font-semibold mt-0.5">Browser</span>
              </button>
            </div>
          )}
        </div>

        {/* 8. SIDEBAR FOOTER (SpiritLlama 1:1) */}
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] flex items-center justify-between">
          <div 
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
            onClick={() => setShowSettingsModal(true)}
            title="Account & Sync Settings"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0db7ed] to-blue-600 text-white font-bold text-[10px] flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              {cloudUsername ? cloudUsername[0].toUpperCase() : 'G'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[var(--text-primary)] truncate leading-tight group-hover:text-[#0db7ed] transition-colors">
                {cloudUsername || 'Guest User'}
              </div>
              <div className="text-[9px] text-[var(--text-muted)] font-mono truncate flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate">{cloudToken ? 'Cloud Active' : 'Local Mode'}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 hover:text-[#0db7ed] hover:bg-[var(--bg-surface)] text-[var(--text-muted)] rounded-lg transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ── Main App Content Column ── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
      {/* Expressive Horizon Header with P5 Strings Wave Animation */}
      <header className="shrink-0 z-40 header-horizon text-white px-6 py-3 flex items-center justify-between shadow-md relative overflow-hidden" style={{ background: "var(--header-gradient)" }}>
        {/* P5 Strings Generative Canvas Animation behind right-justified function buttons */}
        <canvas
          ref={p5CanvasRef}
          className="absolute top-0 right-0 w-[540px] h-full pointer-events-none opacity-65 z-0"
        />

        {/* Left: Branding + Blue 'New Chat' Icon Button */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-md flex items-center justify-center p-1 shadow-[0_2px_10px_rgba(0,0,0,0.18)] shrink-0">
            {/* <img src={spiritDockLogo} alt="SpiritDock Logo" className="w-6 h-6 object-contain" /> */}
            <MascotLogo className="w-8 h-8 text-[#0db7ed]" />
          </div>
          <div className="flex items-center gap-2.5 me-2">
            <h1 className="text-base font-bold tracking-tight text-white"><span className="hidden lg:inline-block">Spirit Bird</span> <span className='text-[#0db7ed]'>AIDock</span></h1>
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                const newId = `session_${Date.now()}`;
                setSessionId(newId);
                playAlertSound('success');
              }}
              className="group relative flex items-center h-7 px-2 rounded-full bg-[#0db7ed] hover:bg-[#0099cc] text-white transition-all duration-300 ease-in-out cursor-pointer hover:px-2.5 shadow-sm"
              title="Start New Chat Session"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[11px] font-bold group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out">
                New Chat
              </span>
            </button>
          </div>
        </div>

        {/* Right Function Buttons: Animated Hover Slide-Out Suite */}
        <div className="flex items-center gap-2 relative z-10">
          {/* a. Theme toggle icon button */}
          <button 
            type="button"
            onClick={() => setIsDark(!isDark)}
            className="group relative flex items-center h-8 px-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-300 ease-in-out cursor-pointer hover:px-3 shadow-sm"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 shrink-0 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 shrink-0 text-cyan-300" />
            )}
            <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-xs font-semibold group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out">
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {/* b. Toggle Alert Sounds */}
          <button 
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              localStorage.setItem('aidock_sound_enabled', String(next));
              if (next) playAlertSound('success');
            }}
            className="group relative flex items-center h-8 px-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-300 ease-in-out cursor-pointer hover:px-3 shadow-sm"
            title={soundEnabled ? "Mute Alert Sounds" : "Enable Alert Sounds"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 shrink-0 text-cyan-300" />
            ) : (
              <VolumeX className="w-4 h-4 shrink-0 text-white/50" />
            )}
            <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-xs font-semibold group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out">
              {soundEnabled ? 'Sound On' : 'Muted'}
            </span>
          </button>

          {/* c. [ provider brand icon | Model Name ] */}
          <button
            type="button"
            onClick={() => {
              setSelectedModalProvId(activeProviderId);
              setSettingsTab('providers');
              setShowSettingsModal(true);
            }}
            className="group relative flex items-center h-8 px-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white transition-all duration-300 ease-in-out cursor-pointer hover:px-3 shadow-sm"
            title="Active AI Provider & Model Configuration"
          >
            <div className="w-5 h-5 rounded-md bg-white border border-black/10 flex items-center justify-center p-0.5 shrink-0 shadow-sm">
              <ProviderBrandIcon providerId={activeProviderId} className="w-3.5 h-3.5 object-contain" />
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-[#0db7ed] shrink-0 ml-1.5 animate-pulse" />
            <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-xs font-semibold group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out flex items-center gap-1.5">
              <span className="font-bold text-white uppercase text-[10px] tracking-tight">
                {activeProviderId === 'local' ? (localEngine === 'docker' ? 'Docker Models' : (localEngine === 'ollama' ? 'Ollama' : 'vLLM')) : (PROVIDERS.find(p => p.id === activeProviderId)?.label || 'Local LLM')}
              </span>
              <span className="text-[10px] font-mono text-[#0db7ed] bg-black/40 px-1.5 py-0.5 rounded border border-[#0db7ed]/30">
                {(providerSelectedModels[activeProviderId] || activeModel || '').split('/').pop() || 'No Model Loaded'}
              </span>
            </span>
          </button>

          {/* d. Profile Avatar + logout button */}
          <div className="group relative flex items-center h-8 pl-1.5 pr-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-300 ease-in-out cursor-pointer hover:pr-3 shadow-sm">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#0db7ed] to-blue-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0 shadow-sm">
              {cloudUsername ? cloudUsername[0].toUpperCase() : 'G'}
            </div>
            <div className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-xs font-semibold group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out flex items-center gap-2">
              <span className="text-white text-[11px] truncate max-w-[100px]">
                {cloudUsername || 'Guest User'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCloudToken('');
                  setCloudUsername('');
                  localStorage.removeItem('aidock_cloud_token');
                  localStorage.removeItem('aidock_cloud_username');
                  setMessages([]);
                  playAlertSound('warning');
                }}
                className="p-1 rounded hover:bg-white/20 text-red-400 hover:text-red-300 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Docked SpiritLlama-style Harness Bar */}
      <div className="shrink-0 z-30 bg-[var(--bg-surface)] border-b border-[var(--border-default)] px-6 py-2 flex flex-wrap items-center justify-between gap-3 shadow-[var(--shadow-l1)]">
        <div className="flex items-center gap-3 text-xs">
          {/* Workspace & Files drawer trigger button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isSidebarOpen
                ? 'bg-[#0db7ed] text-white border-[#0aa5d6] shadow-sm'
                : 'bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border-[var(--border-subtle)]'
            }`}
            title="Toggle Workspace & Files Sidepanel"
          >
            <PanelLeft className={`w-4 h-4 ${
              isSidebarOpen
                ? 'text-white'
                : 'text-[#0db7ed]'
            }`} />
            <span>Workspace</span>
            {files.length > 0 && (
              <span className="font-mono text-[10px] bg-black/10 dark:bg-white/10 px-1.5 py-0.2 rounded font-bold">
                {files.length}
              </span>
            )}
          </button>

          <div className="h-4 w-px bg-[var(--border-subtle)]" />

          {/* Clickable Provider Badge */}
          <button
            type="button"
            onClick={() => {
              setSelectedModalProvId(activeProviderId);
              setSettingsTab('providers');
              setShowSettingsModal(true);
            }}
            className="font-mono text-[11px] bg-[var(--bg-surface-elevated)] hover:bg-[#0db7ed]/10 border border-[var(--border-subtle)] hover:border-[#0db7ed]/50 px-2.5 py-0.5 rounded text-[var(--text-secondary)] hover:text-[#0db7ed] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Configure Active Provider & API Keys"
          >
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[#0db7ed] shadow-[0_0_8px_rgba(13,183,237,0.7)] animate-pulse' : 'bg-red-500'}`} />
            <span>{connected ? 'Active' : 'Offline'}</span>
            <span> | </span>
            <b className="text-[var(--text-primary)]">{activeProviderId === 'local' ? (localEngine === 'docker' ? 'Docker Models' : (localEngine === 'ollama' ? 'Ollama' : 'vLLM')) : (PROVIDERS.find(p => p.id === activeProviderId)?.label || 'Cloud API')}</b>
            <span> | </span>
            <b className="text-[var(--text-primary)]">{(providerSelectedModels[activeProviderId] || activeModel || '').split('/').pop() || 'No Model'}</b>
            <span> | </span>
            <b className="text-[var(--text-primary)] capitalize">
              {activeProviderId === 'local' ? 'Local Engine' : (isCloudMode() ? 'Spirit Cloud' : 'Cloud BYOK')}
            </b>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            Session: <span className="text-[var(--text-secondary)] font-semibold bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] px-2 py-0.5 rounded">{sessionId.slice(-12)}</span>
          </span>
        </div>
      </div>

            

      {/* ── Main Workspace Column with P5 Wave (OllamaOpt 1:1) ── */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden bg-[var(--bg-canvas)]">
        {/* Dynamic P5 Graphic Canvas Layer in Docker Blue */}
        <canvas
          ref={workspaceP5CanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />

        {/* Main Container: Full width filling available workspace space without artificial max-w-7xl constraint */}
        <main className="flex-1 min-h-0 w-full px-4 lg:px-6 py-3.5 flex flex-col lg:flex-row gap-4 lg:gap-5 relative z-10 overflow-hidden">
        {/* Left column: Workspace File Preview & Text Editor Pane */}
        {isTextEditorOpen && (
          <section className="w-full lg:w-[38%] xl:w-[35%] 2xl:w-[32%] min-w-[340px] max-w-[640px] shrink-0 flex flex-col h-full min-h-0 bg-[var(--bg-editor)] text-[#E8ECF2] rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-l1)] p-4 overflow-hidden transition-all duration-300">
            {/* Editor Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-2.5">
              <div className="flex items-center gap-2 truncate mr-2">
                <FileCode className="w-4 h-4 text-[#0db7ed] shrink-0" />
                <span className="text-xs font-mono font-bold tracking-wide truncate" title={editorFilename}>{editorFilename}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${editorSaved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} title={editorSaved ? 'Saved' : 'Unsaved changes'} />
              </div>
              <button
                onClick={() => setIsTextEditorOpen(false)}
                className="text-[#7A7D8E] hover:text-white transition-colors duration-150 focus:outline-none cursor-pointer"
                title="Close file preview (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Format toggle & status bar */}
            <div className="flex items-center justify-between mb-2.5 text-xs">
              <div className="flex bg-white/10 rounded-md p-0.5 border border-white/10">
                <button
                  onClick={() => {
                    if (!editorSaved && !confirm('Discard unsaved changes?')) return;
                    setEditorFormat('markdown');
                    setEditorFilename(`chat_export_${sessionId}.md`);
                    setEditorContent(generateMarkdown(messages));
                    setEditorSaved(true);
                  }}
                  className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${editorFormat === 'markdown' ? 'bg-[#0db7ed] text-white shadow-sm' : 'text-[#7A7D8E] hover:text-white'}`}
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
                  className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${editorFormat === 'json' ? 'bg-[#0db7ed] text-white shadow-sm' : 'text-[#7A7D8E] hover:text-white'}`}
                >
                  JSON
                </button>
              </div>

              {saveStatusText ? (
                <span className="text-emerald-400 font-medium animate-pulse">{saveStatusText}</span>
              ) : (
                <span className="text-[#7A7D8E] font-mono text-[11px]">
                  {editorSaved ? 'All changes saved' : 'Unsaved changes*'}
                </span>
              )}
            </div>

            {/* Textarea container */}
            <div className="flex-1 relative flex bg-[#0d0e15] rounded-md border border-white/5 overflow-hidden p-3 font-mono text-xs">
              {/* Line numbers */}
              <div ref={lineNumbersRef} className="select-none text-right pr-3 border-r border-white/10 text-white/30 font-mono leading-6 overflow-hidden">
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
            <div className="flex gap-2 mt-3 pt-2.5 border-t border-white/10">
              <button
                onClick={() => handleSaveFile(editorContent, editorFilename)}
                className="flex-1 bg-[#0db7ed] hover:bg-[#0099cc] text-white text-xs font-semibold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save to Workspace</span>
              </button>
              <button
                onClick={() => triggerDownload(editorContent, editorFilename)}
                className="bg-white/10 hover:bg-white/15 text-white text-xs font-semibold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 border border-white/10 transition-all cursor-pointer"
                title="Download locally"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>
        )}

        {/* Right column: Main Chat Area (fills 100% of remaining width) */}
        <section className="flex-1 min-w-0 flex flex-col h-full min-h-0 transition-all duration-300">

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            
            {/* Chat Area Header with Export Menu & Global Density Toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-[var(--text-primary)] tracking-wide uppercase">Active Session Stream</span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Global Code Line Numbers Toggle */}
                <button
                  type="button"
                  onClick={toggleGlobalLineNumbers}
                  title={codeLineNumbers ? 'Code line numbers: ON — click to hide' : 'Code line numbers: OFF — click to show'}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-md shadow-xs transition-colors cursor-pointer border ${
                    codeLineNumbers
                      ? 'bg-[#0db7ed]/15 border-[#0db7ed]/40 text-[#0db7ed]'
                      : 'bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5 text-[#0db7ed]" />
                  <span>{codeLineNumbers ? 'Lines: On' : 'Lines: Off'}</span>
                </button>

                {/* Global Density Toggle Pill (Compact / Roomy benchmarked from SpiritLlama) */}
                <button
                  type="button"
                  onClick={toggleGlobalDensity}
                  title={messageDensity === 'compact' ? 'Format: Compact — click to switch to Roomy view globally' : 'Format: Roomy — click to switch to Compact view globally'}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  <AlignJustify className="w-3.5 h-3.5 text-[#0db7ed]" />
                  <span className="capitalize">{messageDensity}</span>
                </button>

                {messages.length > 0 && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-[#0db7ed] hover:bg-[#0099cc] text-white text-xs font-semibold rounded-md shadow-sm transition-all duration-150"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Chat</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    
                    {showExportDropdown && (
                      <div className="absolute right-0 mt-1.5 w-56 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md shadow-[var(--shadow-l2)] z-50 overflow-hidden py-1">
                        <button
                          onClick={() => {
                            setShowExportDropdown(false);
                            const content = generateJSON(messages);
                            triggerDownload(content, `chat_export_${sessionId}.json`);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-[var(--bg-surface-hover)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2"
                        >
                          <FileCode className="w-4 h-4 text-[#0db7ed]" /> Download JSON
                        </button>
                        <button
                          onClick={() => {
                            setShowExportDropdown(false);
                            const content = generateMarkdown(messages);
                            triggerDownload(content, `chat_export_${sessionId}.md`);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-[var(--bg-surface-hover)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4 text-[#0db7ed]" /> Download Markdown
                        </button>
                        <hr className="border-[var(--border-subtle)]" />
                        <button
                          onClick={() => {
                            setShowExportDropdown(false);
                            const content = generateJSON(messages);
                            handleSaveFile(content, `chat_export_${sessionId}.json`);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-[var(--bg-surface-hover)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2"
                        >
                          <Save className="w-4 h-4 text-[#0db7ed]" /> Save to Workspace (JSON)
                        </button>
                        <button
                          onClick={() => {
                            setShowExportDropdown(false);
                            const content = generateMarkdown(messages);
                            handleSaveFile(content, `chat_export_${sessionId}.md`);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-[var(--bg-surface-hover)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2"
                        >
                          <Save className="w-4 h-4 text-[#0db7ed]" /> Save to Workspace (MD)
                        </button>
                        <hr className="border-[var(--border-subtle)]" />
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
                          className="w-full text-left px-4 py-2 hover:bg-[var(--bg-surface-hover)] text-xs font-bold text-[#0db7ed] flex items-center gap-2 bg-[#0db7ed]/5"
                        >
                          <Edit className="w-4 h-4 text-[#0db7ed]" /> Open in Text Editor
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>


            {/* Message Stream */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-2 pb-36 scrollbar-thin overscroll-contain">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-14 h-14 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] mb-3">
                    <MascotLogo className="w-8 h-8 text-[#0db7ed]" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Initialize Your Sandbox</h3>
                  <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                    Instruct the local AI model to write code or perform tasks. An isolated project directory will be created under your container workspace.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isBot = msg.sender === 'bot';
                  const density = getEffectiveDensity(msg.id);
                  const isCompact = density === 'compact';
                  const isCopied = copiedMessageId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      data-msg-wrap="1"
                      data-msg-role={msg.sender}
                      data-msg-density={density}
                      className={`group flex flex-col w-full ${
                        msg.sender === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`flex gap-2.5 max-w-[90%] lg:max-w-[84%] ${
                          msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 shadow-sm ${
                          msg.sender === 'user'
                            ? 'bg-[#0db7ed] text-white'
                            : 'bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[#0db7ed]'
                        }`}>
                          {msg.sender === 'user' ? <User className="w-4 h-4" /> : <MascotLogo className="w-4 h-4 text-[#0db7ed]" />}
                        </div>

                        {/* Message Content & Card */}
                        <div className="flex flex-col gap-1 min-w-0 max-w-full">
                          <div
                            data-msg-card
                            className={`rounded-xl border transition-all ${
                              msg.sender === 'user'
                                ? 'bg-[#0db7ed] text-white user-corner-glow font-medium border-[#0aa5d6] shadow-sm p-3.5 text-sm'
                                : 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] bot-corner-glow border-[var(--border-subtle)] shadow-[var(--shadow-l1)]'
                            }`}
                          >
                            {/* LLM Logo & Model Badge inside Assistant bubbles */}
                            {isBot && msg.id.indexOf('_sys') === -1 && (
                              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[var(--border-subtle)] mb-2 text-[11px] text-[var(--text-muted)] font-semibold select-none">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className="w-4 h-4 rounded bg-white border border-black/10 flex items-center justify-center p-0.5 shrink-0 shadow-sm">
                                    <ProviderBrandIcon providerId={msg.provider || activeProviderId} className="w-3 h-3 object-contain" />
                                  </div>
                                  <span className="font-bold text-[var(--text-primary)] truncate">
                                    {((msg.model || (msg.provider ? providerSelectedModels[msg.provider] : '') || activeModel || '').split('/').pop()) || 'Assistant'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[9px] font-mono bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">
                                    {msg.providerLabel || ((msg.provider === 'local' || (!msg.provider && activeProviderId === 'local')) ? (localEngine === 'docker' ? 'Docker Models' : (localEngine === 'ollama' ? 'Ollama' : 'vLLM')) : (PROVIDERS.find(p => p.id === (msg.provider || activeProviderId))?.label || 'Cloud API'))}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Message Body */}
                            {msg.sender === 'user' ? (
                              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                            ) : (
                              <div
                                className="prose-chat w-full max-w-none min-w-0"
                                data-msg-body
                                data-density={density}
                              >
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm, remarkMath]}
                                  rehypePlugins={[rehypeKatex]}
                                  components={{
                                    pre(props: any) {
                                      const child = props?.children;
                                      if (child && child.props) {
                                        const className = child.props.className || '';
                                        const match = /language-(\w+)/.exec(className);
                                        const codeString = String(child.props.children || '').replace(/\n$/, '');
                                        return <CodeBlock language={match ? match[1] : ''} code={codeString} />;
                                      }
                                      return <div className="not-prose my-3">{props.children}</div>;
                                    },
                                    code({ className, children, ...props }: any) {
                                      return (
                                        <code className="px-1.5 py-0.5 rounded bg-[#0db7ed]/10 border border-[#0db7ed]/20 text-[#0db7ed] font-mono text-[0.88em]" {...props}>
                                          {children}
                                        </code>
                                      );
                                    },
                                    table({ children }: any) {
                                      return (
                                        <div className="msg-table-scroll my-3 overflow-x-auto border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)] shadow-sm">
                                          <table className="w-full text-left border-collapse text-xs">
                                            {children}
                                          </table>
                                        </div>
                                      );
                                    },
                                    th({ children }: any) {
                                      return (
                                        <th className="px-3 py-2 font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] bg-[#0db7ed]/5 text-[11px] uppercase tracking-wider">
                                          {children}
                                        </th>
                                      );
                                    },
                                    td({ children }: any) {
                                      return (
                                        <td className="px-3 py-2 text-[var(--text-secondary)] border-b border-[var(--border-subtle)]/60 text-xs">
                                          {children}
                                        </td>
                                      );
                                    },
                                    blockquote({ children }: any) {
                                      return (
                                        <blockquote className="my-2.5 pl-3 py-1 border-l-2 border-[#0db7ed] bg-[#0db7ed]/5 rounded-r-lg text-[var(--text-secondary)] italic">
                                          {children}
                                        </blockquote>
                                      );
                                    },
                                    a({ href, children }: any) {
                                      return (
                                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#0db7ed] hover:underline font-medium">
                                          {children}
                                        </a>
                                      );
                                    }
                                  }}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>

                          {/* Action Toolbar Below Message */}
                          {isBot ? (
                            <div
                              data-msg-actions
                              className="flex items-center gap-2 mt-1.5 pl-1 text-[11px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 select-none"
                            >
                              {msg.latencyMs !== undefined && (
                                <span
                                  className="inline-flex items-center gap-1 font-mono text-[10.5px] text-[var(--text-muted)]"
                                  title="Time taken to generate response"
                                >
                                  <Clock className="w-3 h-3 text-[#0db7ed]" />
                                  <span>{(msg.latencyMs / 1000).toFixed(2)}s</span>
                                </span>
                              )}

                              {/* Copy response */}
                              <button
                                type="button"
                                onClick={() => handleCopyMessage(msg.id, msg.content)}
                                title="Copy response"
                                className="p-1 rounded-md hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1"
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Density toggle button */}
                              <button
                                type="button"
                                data-btn-density-toggle
                                onClick={() => toggleMessageDensity(msg.id)}
                                title={isCompact ? 'Format: Compact — click to switch to Roomy view' : 'Format: Roomy — click to switch to Compact view'}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-[10.5px] font-mono transition-colors cursor-pointer"
                              >
                                <AlignJustify className="w-3.5 h-3.5 text-[#0db7ed]" />
                                <span>{isCompact ? 'Compact' : 'Roomy'}</span>
                              </button>

                              {/* Reference this chat */}
                              <button
                                type="button"
                                onClick={() => handleReferenceMessage(msg)}
                                title="Reference this chat in input"
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] hover:bg-[#0db7ed]/10 hover:border-[#0db7ed]/40 hover:text-[#0db7ed] text-[var(--text-secondary)] text-[10.5px] font-medium transition-colors cursor-pointer"
                              >
                                <TextQuote className="w-3 h-3" />
                                <span>Reference this chat</span>
                              </button>

                              {msg.workspaceUsed && (
                                <span className="font-mono text-[9px] text-[var(--text-muted)] truncate max-w-[150px] ml-auto" title={msg.workspaceUsed}>
                                  {msg.workspaceUsed.split('/').pop()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div
                              data-msg-actions
                              className="flex items-center justify-end gap-1.5 mt-1 pr-1 text-[11px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 select-none"
                            >
                              {msg.timestamp && (
                                <span className="text-[11px] font-sans text-[var(--text-muted)] mr-1">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              {/* Copy prompt button */}
                              <button
                                type="button"
                                onClick={() => handleCopyMessage(msg.id, msg.content)}
                                title="Copy prompt"
                                className="p-1 rounded-md hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              {/* Restore prompt button */}
                              <button
                                type="button"
                                onClick={() => handleRestorePrompt(msg.content)}
                                title="Restore to input dock"
                                className="p-1 rounded-md hover:bg-white/10 text-[var(--text-muted)] hover:text-[#0db7ed] transition-colors cursor-pointer"
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {loading && (
                <div className="flex gap-2.5 mr-auto max-w-[80%]">
                  <div className="w-7 h-7 rounded-md bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 shadow-sm">
                    <MascotLogo className="w-4 h-4 text-[#0db7ed] animate-spin" />
                  </div>
                  <div className="p-3 rounded-md bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] bot-corner-glow border border-[var(--border-subtle)] text-xs flex items-center gap-2 shadow-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#0db7ed] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#0db7ed] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#0db7ed] animate-bounce" style={{ animationDelay: '300ms' }} />
                    Thinking ({elapsedMs.toLocaleString()} ms)...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── FLOATING USER CHAT INPUT DOCK (SpiritLlama UI 1:1) ── */}
      <div className="pt-2 z-20 shrink-0 w-full max-w-4xl mx-auto relative">
        
        {/* SPECIALIZATION MENU POPUP */}
        {isSpecializationMenuOpen && (
          <div className="absolute bottom-full left-12 mb-2 w-60 bg-white dark:bg-[#151928] border border-black/[0.08] dark:border-white/[0.12] rounded-2xl shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-[var(--text-muted)] font-bold border-b border-[var(--border-subtle)] mb-1 flex items-center justify-between">
              <span>Specialization Mode</span>
              <span className="text-[9px] font-normal text-[#0db7ed]">Agent Scope</span>
            </div>
            {SPECIALIZATIONS.map(spec => {
              const IconComp = spec.icon;
              const isSelected = activeSpecialization === spec.id;
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => {
                    setActiveSpecialization(spec.id);
                    setIsSpecializationMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#0db7ed]/15 text-[#0db7ed] font-bold'
                      : 'hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-[var(--text-primary)]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <IconComp className="w-3.5 h-3.5" />
                    <span>{spec.name}</span>
                  </span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#0db7ed]" />}
                </button>
              );
            })}
          </div>
        )}

        {/* DOCK CONTAINER CARD */}
        <div className="bg-white/95 dark:bg-[#141724]/95 backdrop-blur-2xl rounded-2xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.22)] border border-black/[0.08] dark:border-white/[0.12] p-3.5 transition-all">

          {/* COLLAPSIBLE PROVIDER & ENGINE DRAWER */}
          {isProviderDrawerOpen && (
            <div className="mb-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Local Engine</span>
                  <div className="flex rounded-lg bg-[var(--bg-surface-elevated)] border border-black/[0.06] dark:border-white/[0.08] p-0.5">
                    {[
                      { id: 'docker', label: 'Docker Models', url: 'http://model-runner.docker.internal' },
                      { id: 'ollama', label: 'Ollama', url: 'http://127.0.0.1:11434' },
                      { id: 'vllm', label: 'vLLM', url: 'http://127.0.0.1:8000/v1' }
                    ].map(eng => {
                      const isAct = (activeProviderId === 'local' && localEngine === eng.id);
                      return (
                        <button
                          key={eng.id}
                          type="button"
                          onClick={() => {
                            selectActiveProvider('local');
                            setLocalEngine(eng.id as LocalEngine);
                            localStorage.setItem('aidock_local_engine', eng.id);
                            setProviderBaseUrls(prev => ({ ...prev, local: eng.url }));
                            fetchLocalModels();
                          }}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-tight transition-all cursor-pointer ${
                            isAct
                              ? 'bg-[#0db7ed]/20 text-[#0db7ed] shadow-sm border border-[#0db7ed]/40'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {eng.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hardware NGL & GPU status button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModalProvId(activeProviderId);
                    setSettingsTab('providers');
                    setShowSettingsModal(true);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-surface-elevated)] hover:bg-[#0db7ed]/10 border border-[var(--border-subtle)] hover:border-[#0db7ed]/40 text-[10px] font-mono font-bold text-[var(--text-primary)] transition-all cursor-pointer"
                  title="Engine Hardware Configuration"
                >
                  <Cpu className="w-3.5 h-3.5 text-[#0db7ed]" />
                  <span>-ngl <b className="text-[#0db7ed]">24</b>/36</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#0db7ed] text-white text-[8px]">GPU Offload</span>
                </button>
              </div>

              {/* Row 2: NEURO + AI PROVIDER + MODEL CONFIGURATION (SpiritLlama 1:1) */}
              <div className="flex gap-2.5 items-end">
                {/* NEURO Telemetry Button */}
                <div className="flex-none">
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-1 ml-1">
                    Neuro
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedModalProvId(activeProviderId);
                      setSettingsTab('server');
                      setShowSettingsModal(true);
                    }}
                    className="h-[38px] px-3 rounded-xl border border-[#0db7ed]/30 bg-[#0db7ed]/10 text-[#0db7ed] shadow-sm transition-all active:scale-95 flex items-center justify-center cursor-pointer hover:bg-[#0db7ed]/20"
                    title="Hardware Compute & Telemetry"
                  >
                    <Cpu className="w-4 h-4 text-[#0db7ed]" />
                  </button>
                </div>

                {/* AI PROVIDER SELECTOR BUTTON */}
                <div className="flex-1 min-w-0 relative">
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-1 ml-1">
                    AI Provider
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProviderListboxOpen(!isProviderListboxOpen);
                      setIsModelListboxOpen(false);
                    }}
                    className="relative w-full cursor-pointer rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] py-2 pl-3 pr-8 text-left shadow-sm transition-all flex items-center gap-2.5 h-[38px]"
                  >
                    <div className="w-6 h-6 rounded-md bg-white border border-black/10 flex items-center justify-center p-0.5 shrink-0 shadow-sm">
                      <ProviderBrandIcon providerId={activeProviderId} className="w-4 h-4 object-contain" />
                    </div>
                    <span className="truncate text-xs font-semibold text-[var(--text-primary)]">
                      {activeProviderId === 'local' ? (localEngine === 'docker' ? 'Docker Models' : (localEngine === 'ollama' ? 'Ollama' : 'vLLM')) : (PROVIDERS.find(p => p.id === activeProviderId)?.label || 'Local LLM')}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                      <ChevronsUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </span>
                  </button>

                  {/* FLOATING PROVIDER LISTBOX DROPDOWN */}
                  {isProviderListboxOpen && (
                    <div className="absolute bottom-[calc(100%+8px)] left-0 w-80 max-h-[380px] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.25)] p-2.5 z-50 flex flex-col gap-2 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={providerSearch}
                          onChange={(e) => setProviderSearch(e.target.value)}
                          placeholder="Search AI providers..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#0db7ed]"
                          autoFocus
                        />
                      </div>

                      <div className="overflow-y-auto space-y-2 max-h-[260px] pr-1">
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 py-1">
                            Neural Core (Local)
                          </div>
                          <div className="space-y-0.5">
                            {PROVIDERS.filter(p => p.coreGroup === 'neural' && (
                              p.label.toLowerCase().includes(providerSearch.toLowerCase()) ||
                              p.id.toLowerCase().includes(providerSearch.toLowerCase())
                            )).map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  selectActiveProvider(p.id);
                                  setIsProviderListboxOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                                  activeProviderId === p.id
                                    ? 'bg-[#0db7ed]/15 text-[#0db7ed] font-bold border border-[#0db7ed]/30'
                                    : 'hover:bg-[var(--bg-surface-elevated)] text-[var(--text-primary)]'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-md bg-white border border-black/10 flex items-center justify-center p-0.5 shrink-0 shadow-sm">
                                    <ProviderBrandIcon providerId={p.id} className="w-4 h-4 object-contain" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold truncate">{p.label}</div>
                                    <div className="text-[9px] text-[var(--text-muted)] truncate">{p.desc}</div>
                                  </div>
                                </div>
                                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 text-[var(--text-secondary)]">
                                  {p.badge}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 py-1">
                            Cloud Core (BYOK)
                          </div>
                          <div className="space-y-0.5">
                            {PROVIDERS.filter(p => p.coreGroup === 'cloud' && (
                              p.label.toLowerCase().includes(providerSearch.toLowerCase()) ||
                              p.id.toLowerCase().includes(providerSearch.toLowerCase())
                            )).map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  selectActiveProvider(p.id);
                                  setIsProviderListboxOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                                  activeProviderId === p.id
                                    ? 'bg-[#0db7ed]/15 text-[#0db7ed] font-bold border border-[#0db7ed]/30'
                                    : 'hover:bg-[var(--bg-surface-elevated)] text-[var(--text-primary)]'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-md bg-white border border-black/10 flex items-center justify-center p-0.5 shrink-0 shadow-sm">
                                    <ProviderBrandIcon providerId={p.id} className="w-4 h-4 object-contain" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold truncate">{p.label}</div>
                                    <div className="text-[9px] text-[var(--text-muted)] truncate">{p.desc}</div>
                                  </div>
                                </div>
                                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 text-[var(--text-secondary)]">
                                  {p.badge}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-[var(--border-subtle)] flex items-center justify-between px-1 text-[10px]">
                        <span className="text-[var(--text-muted)]">Keys &amp; endpoints</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsProviderListboxOpen(false);
                            setSelectedModalProvId(activeProviderId);
                            setSettingsTab('providers');
                            setShowSettingsModal(true);
                          }}
                          className="text-[#0db7ed] font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Settings className="w-3 h-3" /> Configure Providers
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* MODEL CONFIGURATION SELECTOR BUTTON */}
                <div className="flex-1 min-w-0 relative">
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-1 ml-1">
                    Model Configuration
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModelListboxOpen(!isModelListboxOpen);
                      setIsProviderListboxOpen(false);
                    }}
                    className="relative w-full cursor-pointer rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] py-2 pl-3 pr-8 text-left shadow-sm transition-all flex items-center gap-2 h-[38px]"
                  >
                    <span className="truncate text-xs font-semibold text-[var(--text-primary)] font-mono">
                      {(providerSelectedModels[activeProviderId] || activeModel || '').split('/').pop() || 'Select model...'}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                      <ChevronsUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </span>
                  </button>

                  {/* FLOATING MODEL LISTBOX DROPDOWN */}
                  {isModelListboxOpen && (
                    <div className="absolute bottom-[calc(100%+8px)] right-0 w-84 max-h-[380px] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.25)] p-2.5 z-50 flex flex-col gap-2 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={modelSearchQuery}
                            onChange={(e) => setModelSearchQuery(e.target.value)}
                            placeholder={`Search ${PROVIDERS.find(p => p.id === activeProviderId)?.label} models...`}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#0db7ed]"
                            autoFocus
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => saveAndTestProviderConfig(activeProviderId)}
                          className="p-1.5 rounded-lg bg-[var(--bg-surface-elevated)] hover:bg-[#0db7ed]/15 text-[var(--text-secondary)] hover:text-[#0db7ed] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                          title="Refresh live models"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="overflow-y-auto space-y-1 max-h-[220px] pr-1">
                        {(() => {
                          const activeProv = PROVIDERS.find(p => p.id === activeProviderId);
                          const hasKey = Boolean(providerApiKeys[activeProviderId]);
                          const modelsList = providerDiscoveredModels[activeProviderId] || [];

                          if (activeProv?.coreGroup === 'cloud' && !hasKey) {
                            return (
                              <div className="py-4 px-3 text-center text-xs space-y-2">
                                <div className="font-semibold text-[var(--text-secondary)]">API Key Required</div>
                                <div className="text-[10px] text-[var(--text-muted)]">
                                  Configure your {activeProv.label} API key in Settings to view available live models.
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedModalProvId(activeProviderId);
                                    setSettingsTab('providers');
                                    setShowSettingsModal(true);
                                    setIsModelListboxOpen(false);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-[#0db7ed] hover:bg-[#0099cc] text-white text-[10px] font-bold shadow-sm cursor-pointer"
                                >
                                  Configure in Settings
                                </button>
                              </div>
                            );
                          }

                          const filtered = modelsList.filter(m => m.toLowerCase().includes(modelSearchQuery.toLowerCase()));

                          if (filtered.length === 0) {
                            return (
                              <div className="py-4 text-center text-xs text-[var(--text-muted)] space-y-1">
                                <div>No live models detected.</div>
                                <div className="text-[10px]">Enter custom model slug below.</div>
                              </div>
                            );
                          }

                          return filtered.map(m => {
                            const isSelected = (providerSelectedModels[activeProviderId] === m || activeModel === m);
                            return (
                              <button
                                key={m}
                                type="button"
                                onClick={() => {
                                  setProviderSelectedModels(prev => ({ ...prev, [activeProviderId]: m }));
                                  setActiveModel(m);
                                  localStorage.setItem(`ai_model_${activeProviderId}`, m);
                                  setIsModelListboxOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#0db7ed]/15 text-[#0db7ed] font-bold border border-[#0db7ed]/30'
                                    : 'hover:bg-[var(--bg-surface-elevated)] text-[var(--text-primary)]'
                                }`}
                              >
                                <span className="text-xs font-mono truncate mr-2" title={m}>{m}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#0db7ed] shrink-0" />}
                              </button>
                            );
                          });
                        })()}
                      </div>

                      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Custom model slug..."
                          className="flex-1 px-2.5 py-1 text-[11px] font-mono bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#0db7ed]"
                          id="customModelInput"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              const val = e.currentTarget.value.trim();
                              setProviderSelectedModels(prev => ({ ...prev, [activeProviderId]: val }));
                              setActiveModel(val);
                              localStorage.setItem(`ai_model_${activeProviderId}`, val);
                              setIsModelListboxOpen(false);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('customModelInput') as HTMLInputElement | null;
                            if (el && el.value.trim()) {
                              const val = el.value.trim();
                              setProviderSelectedModels(prev => ({ ...prev, [activeProviderId]: val }));
                              setActiveModel(val);
                              localStorage.setItem(`ai_model_${activeProviderId}`, val);
                              setIsModelListboxOpen(false);
                            }
                          }}
                          className="px-2.5 py-1 bg-[#0db7ed] hover:bg-[#0aa5d6] text-white text-[11px] font-bold rounded-lg shadow-sm cursor-pointer"
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FUNCTION BUTTONS ROW */}
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Provider Drawer Toggle */}
              <button
                type="button"
                onClick={() => setIsProviderDrawerOpen(!isProviderDrawerOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  isProviderDrawerOpen
                    ? 'bg-[#0db7ed]/15 text-[#0db7ed] shadow-sm border border-[#0db7ed]/30'
                    : 'text-[var(--text-secondary)] hover:text-[#0db7ed] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
                }`}
                title="Toggle Provider & Backend bar"
              >
                <div className="w-5 h-5 rounded-md bg-white border border-black/10 flex items-center justify-center p-0.5 shrink-0 shadow-sm">
                  <ProviderBrandIcon providerId={activeProviderId} className="w-3.5 h-3.5 object-contain" />
                </div>
                <span>Provider</span>
              </button>

              {/* Specialization Mode Pill */}
              <button
                type="button"
                onClick={() => setIsSpecializationMenuOpen(!isSpecializationMenuOpen)}
                className="px-2.5 py-1.5 rounded-lg bg-[#0db7ed] text-white text-[11px] font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer hover:bg-[#0099cc]"
                title="Select Specialization Profile"
              >
                {activeSpecialization === 'coding' && <Code className="w-3 h-3" />}
                {activeSpecialization === 'conversational' && <MessageSquare className="w-3 h-3" />}
                {activeSpecialization === 'writing' && <PenTool className="w-3 h-3" />}
                {activeSpecialization === 'researcher' && <Search className="w-3 h-3" />}
                <span className="capitalize">{activeSpecialization}</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-80" />
              </button>

              {/* Attach File Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[#0db7ed] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Attach Context File (RAG)"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Attach</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Quick action buttons */}
              <button
                type="button"
                onClick={() => setInput("Write a python file-editor tool that can edit a source file.")}
                className="px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-md transition-all hidden md:inline-block cursor-pointer"
              >
                Write Code
              </button>
              <button
                type="button"
                onClick={() => setInput("Scan all workspace files and summarize their contents.")}
                className="px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-md transition-all hidden md:inline-block cursor-pointer"
              >
                Scan Workspace
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fetchFiles()}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-md transition-colors cursor-pointer"
                title="Refresh Files"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Reset current chat log?")) {
                    setMessages([]);
                    playAlertSound('warning');
                  }
                }}
                className="p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-md transition-colors cursor-pointer"
                title="Clear Chat Log"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Attached file chips */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2 px-1">
              {attachedFiles.map(file => (
                <div
                  key={file.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-primary)]"
                >
                  <Paperclip className="w-3 h-3 text-[#0db7ed]" />
                  <span className="font-semibold max-w-[160px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachedFiles(prev => prev.filter(f => f.id !== file.id))}
                    className="text-[var(--text-muted)] hover:text-red-400 ml-1 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* PROMPT INPUT FORM */}
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <div className="flex-1 relative flex items-end min-w-0">
              <textarea
                ref={chatInputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                rows={1}
                placeholder="What would you like to build today? (/tools /goal /skills /find-skill /folder @)"
                className="w-full bg-[var(--bg-surface-elevated)] focus:bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-xs leading-[18px] focus:outline-none focus:ring-2 focus:ring-[#0db7ed]/25 focus:border-[#0db7ed] transition-[background-color,border-color,box-shadow] resize-none overflow-y-auto max-h-36 block scrollbar-thin"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 p-2.5 rounded-xl bg-[#0db7ed] hover:bg-[#0099cc] active:scale-95 disabled:opacity-40 disabled:scale-100 text-white shadow-sm flex items-center justify-center transition-all cursor-pointer"
              title="Send Message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* FOOTER INFERENCE METRICS STRIP */}
          <div className="mt-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] px-1">
            <div className="flex items-center gap-3">
              <span>Speed: <b className="text-[var(--text-primary)]">42.8 T/s</b></span>
              <span>TTFT: <b className="text-[var(--text-primary)]">{messages.length > 0 && messages[messages.length - 1].latencyMs ? `${messages[messages.length - 1].latencyMs} ms` : '-- ms'}</b></span>
              <span>Ctx: <b className="text-[var(--text-primary)]">{messages.reduce((acc, m) => acc + m.content.length, 0)} / 8,192</b></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[#0db7ed] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0db7ed]" />
                8-bit KV Cache (q8_0)
              </span>
              <span className="text-[var(--text-muted)]">| Local Hardware</span>
            </div>
          </div>

        </div>

      </div>


          </div>
        </section>
      </main>

      
      </div>

            </div>

      
      {/* New Workspace Creation Modal */}
      {isNewWorkspaceModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl w-full max-w-md shadow-2xl p-5 relative flex flex-col gap-4 text-[var(--text-primary)]">
            <button
              onClick={() => setIsNewWorkspaceModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--border-subtle)]">
              <div className="w-8 h-8 rounded-lg bg-[#0db7ed]/15 text-[#0db7ed] flex items-center justify-center">
                <FolderPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Create New Workspace</h3>
                <p className="text-[10px] text-[var(--text-muted)]">Configure a local folder mount for your project chats.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="e.g. My Next.js Project"
                  className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#0db7ed]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Folder Path (Local Mount)
                </label>
                <input
                  type="text"
                  value={newWorkspacePath}
                  onChange={(e) => setNewWorkspacePath(e.target.value)}
                  placeholder="e.g. /workspace/my-project or C:\\Projects\\MyProject"
                  className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[#0db7ed]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setIsNewWorkspaceModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newWorkspaceName.trim()}
                onClick={() => {
                  if (!newWorkspaceName.trim()) return;
                  const newWs: WorkspaceProject = {
                    id: `ws_${Date.now()}`,
                    name: newWorkspaceName.trim(),
                    path: newWorkspacePath.trim() || `/workspace/${newWorkspaceName.trim().toLowerCase().replace(/\s+/g, '-')}`,
                    isGit: true
                  };
                  setWorkspaces(prev => [...prev, newWs]);
                  setActiveWorkspaceId(newWs.id);
                  localStorage.setItem('aidock_active_workspace', newWs.id);
                  setNewWorkspaceName('');
                  setNewWorkspacePath('');
                  setIsNewWorkspaceModalOpen(false);
                  playAlertSound('success');
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#0db7ed] hover:bg-[#0099cc] text-white transition-all shadow-sm disabled:opacity-40 cursor-pointer"
              >
                Create Workspace
              </button>
            </div>
          </div>
        </div>
      )}

{/* SpiritLlama Harness-style System Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl w-full max-w-4xl shadow-[var(--shadow-modal)] p-6 relative flex flex-col gap-4 h-[86vh] max-h-[760px] text-[var(--text-primary)]">
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors focus:outline-none cursor-pointer"
              title="Close Settings (Esc)"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-subtle)] shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#0db7ed]/30 flex items-center justify-center p-1.5 shadow-sm shrink-0">
                <ProviderBrandIcon providerId={selectedModalProvId} className="w-7 h-7 object-contain" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <span>Connection &amp; Provider Settings</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0db7ed]/15 text-[#0db7ed] border border-[#0db7ed]/30 font-bold uppercase">
                    {PROVIDERS.find(p => p.id === activeProviderId)?.label || 'LOCAL'} ACTIVE
                  </span>
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] font-medium">
                  Configure local neural runtimes, cloud BYOK API providers, server execution routes, and AICodex synchronization.
                </p>
              </div>
            </div>

            {/* Modal Tab Bar */}
            <div className="flex items-center gap-1.5 border-b border-[var(--border-subtle)] pb-2.5 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setSettingsTab('providers')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  settingsTab === 'providers'
                    ? 'bg-[#0db7ed] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>AI Providers</span>
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('server')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  settingsTab === 'server'
                    ? 'bg-[#0db7ed] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>Execution Route</span>
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('cloud')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  settingsTab === 'cloud'
                    ? 'bg-[#0db7ed] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>AICodex Cloud Sync</span>
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('diagnostics')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  settingsTab === 'diagnostics'
                    ? 'bg-[#0db7ed] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Diagnostics</span>
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {/* TAB 1: AI PROVIDERS (SPLIT PANE) */}
              {settingsTab === 'providers' && (() => {
                const selectedProv = PROVIDERS.find(p => p.id === selectedModalProvId) || PROVIDERS[0];
                return (
                  <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
                    {/* Left Column: Grouped Providers List */}
                    <div className="w-64 border-r border-[var(--border-subtle)] pr-3 overflow-y-auto space-y-3 shrink-0">
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 mb-1.5">
                          Neural Core (Local)
                        </div>
                        <div className="space-y-1">
                          {PROVIDERS.filter(p => p.coreGroup === 'neural').map(p => {
                            const isSel = selectedModalProvId === p.id;
                            const isAct = activeProviderId === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedModalProvId(p.id);
                                  setProviderConfigStatus('');
                                }}
                                className={`w-full p-2 rounded-xl text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                  isSel
                                    ? 'bg-[#0db7ed]/15 border border-[#0db7ed] text-[var(--text-primary)]'
                                    : 'hover:bg-[var(--bg-surface-elevated)] border border-transparent text-[var(--text-secondary)]'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-md bg-white border border-black/10 flex items-center justify-center p-0.5 shrink-0 shadow-sm">
                                    <ProviderBrandIcon providerId={p.id} className="w-4 h-4 object-contain" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold truncate flex items-center gap-1.5">
                                      <span>{p.label}</span>
                                      {isAct && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#0db7ed] animate-pulse" />
                                      )}
                                    </div>
                                    <div className="text-[9px] text-[var(--text-muted)] truncate">{p.desc}</div>
                                  </div>
                                </div>
                                <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] shrink-0 font-bold">
                                  {p.badge}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 mb-1.5">
                          Cloud Core (BYOK)
                        </div>
                        <div className="space-y-1">
                          {PROVIDERS.filter(p => p.coreGroup === 'cloud').map(p => {
                            const isSel = selectedModalProvId === p.id;
                            const isAct = activeProviderId === p.id;
                            const hasKey = Boolean(providerApiKeys[p.id]);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedModalProvId(p.id);
                                  setProviderConfigStatus('');
                                }}
                                className={`w-full p-2 rounded-xl text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                  isSel
                                    ? 'bg-[#0db7ed]/15 border border-[#0db7ed] text-[var(--text-primary)]'
                                    : 'hover:bg-[var(--bg-surface-elevated)] border border-transparent text-[var(--text-secondary)]'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-md bg-white border border-black/10 flex items-center justify-center p-0.5 shrink-0 shadow-sm">
                                    <ProviderBrandIcon providerId={p.id} className="w-4 h-4 object-contain" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold truncate flex items-center gap-1.5">
                                      <span>{p.label}</span>
                                      {isAct && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#0db7ed] animate-pulse" />
                                      )}
                                      {hasKey && (
                                        <Key className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                                      )}
                                    </div>
                                    <div className="text-[9px] text-[var(--text-muted)] truncate">{p.desc}</div>
                                  </div>
                                </div>
                                <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] shrink-0 font-bold">
                                  {p.badge}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Selected Provider Config */}
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                      {/* Provider Header Card */}
                      <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-[#0db7ed]/30 flex items-center justify-center p-1.5 shadow-sm shrink-0">
                            <ProviderBrandIcon providerId={selectedProv.id} className="w-7 h-7 object-contain" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                              <span>{selectedProv.label}</span>
                              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#0db7ed]/15 text-[#0db7ed] border border-[#0db7ed]/30 font-bold">
                                {selectedProv.badge}
                              </span>
                              {activeProviderId === selectedProv.id && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                                  ACTIVE IN SESSION
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{selectedProv.desc}</div>
                          </div>
                        </div>

                        {activeProviderId !== selectedProv.id && (
                          <button
                            type="button"
                            onClick={() => selectActiveProvider(selectedProv.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#0db7ed] hover:bg-[#0099cc] text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                          >
                            Set Active
                          </button>
                        )}
                      </div>

                      {/* Local Engine Switch (Docker Models / Ollama / vLLM) */}
                      {selectedProv.id === 'local' && (
                        <div className="space-y-1.5 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                            Local Engine Runtime
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'docker', label: 'Docker Models', desc: 'Container Runner', url: 'http://model-runner.docker.internal' },
                              { id: 'ollama', label: 'Ollama', desc: 'Daemon :11434', url: 'http://127.0.0.1:11434' },
                              { id: 'vllm', label: 'vLLM', desc: 'vLLM Server :8000', url: 'http://127.0.0.1:8000/v1' }
                            ].map(eng => {
                              const isSel = localEngine === eng.id;
                              return (
                                <button
                                  key={eng.id}
                                  type="button"
                                  onClick={() => {
                                    setLocalEngine(eng.id as LocalEngine);
                                    localStorage.setItem('aidock_local_engine', eng.id);
                                    setProviderBaseUrls(prev => ({ ...prev, local: eng.url }));
                                    fetchLocalModels();
                                  }}
                                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                                    isSel
                                      ? 'bg-[#0db7ed]/20 border-[#0db7ed] text-[var(--text-primary)] shadow-xs'
                                      : 'bg-[var(--bg-surface-elevated)] border-[var(--border-default)] hover:border-[#0db7ed]/40 text-[var(--text-secondary)]'
                                  }`}
                                >
                                  <div className="text-xs font-bold flex items-center justify-between">
                                    <span>{eng.label}</span>
                                    {isSel && <span className="w-1.5 h-1.5 rounded-full bg-[#0db7ed]" />}
                                  </div>
                                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{eng.desc}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* API Key Field */}
                      {selectedProv.requiresKey && (
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                            API Key / Bearer Token
                          </label>
                          <div className="relative">
                            <input
                              type={showKeyPassword ? 'text' : 'password'}
                              value={providerApiKeys[selectedProv.id] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProviderApiKeys(prev => ({ ...prev, [selectedProv.id]: val }));
                              }}
                              placeholder={
                                selectedProv.id === 'gemini' ? 'AIzaSy...' :
                                selectedProv.id === 'openai' ? 'sk-...' :
                                selectedProv.id === 'anthropic' ? 'sk-ant-...' :
                                selectedProv.id === 'groq' ? 'gsk_...' :
                                'Enter provider API key...'
                              }
                              className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 pr-9 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[#0db7ed] transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => setShowKeyPassword(!showKeyPassword)}
                              className="absolute right-2.5 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                              title="Toggle Visibility"
                            >
                              {showKeyPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Cloudflare Account / Gateway IDs */}
                      {(selectedProv.id === 'workers_ai' || selectedProv.id === 'cloudflare_ai_gateway') && (
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                              Cloudflare Account ID
                            </label>
                            <input
                              type="text"
                              value={providerAccountIds[selectedProv.id] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProviderAccountIds(prev => ({ ...prev, [selectedProv.id]: val }));
                              }}
                              placeholder="Account ID"
                              className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[#0db7ed]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                              Gateway ID
                            </label>
                            <input
                              type="text"
                              value={providerGatewayIds[selectedProv.id] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProviderGatewayIds(prev => ({ ...prev, [selectedProv.id]: val }));
                              }}
                              placeholder="Gateway ID"
                              className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[#0db7ed]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Base URL Endpoint */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          Base URL Endpoint
                        </label>
                        <input
                          type="text"
                          value={providerBaseUrls[selectedProv.id] ?? selectedProv.defaultUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProviderBaseUrls(prev => ({ ...prev, [selectedProv.id]: val }));
                          }}
                          placeholder={selectedProv.defaultUrl || 'http://localhost:...'}
                          className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[#0db7ed]"
                        />
                      </div>

                      {/* Model Selector & Chips */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          Active Model for {selectedProv.label}
                        </label>
                        <input
                          type="text"
                          value={providerSelectedModels[selectedProv.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProviderSelectedModels(prev => ({ ...prev, [selectedProv.id]: val }));
                            localStorage.setItem(`ai_model_${selectedProv.id}`, val);
                            if (activeProviderId === selectedProv.id) setActiveModel(val);
                          }}
                          placeholder="Select or enter model ID..."
                          className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[#0db7ed]"
                        />

                        {/* Discovered Model Chips */}
                        {(() => {
                          const discovered = providerDiscoveredModels[selectedProv.id] || [];
                          const hasKey = Boolean(providerApiKeys[selectedProv.id]);

                          return (
                            <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-2.5 rounded-xl space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                  Available Models (Click to Select)
                                </div>
                                {discovered.length > 0 && (
                                  <span className="text-[9px] font-mono text-[#0db7ed] font-bold">
                                    {discovered.length} LIVE DISCOVERED
                                  </span>
                                )}
                              </div>

                              {selectedProv.coreGroup === 'cloud' && !hasKey ? (
                                <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-dashed border-[var(--border-subtle)] text-center space-y-1">
                                  <div className="text-xs font-semibold text-[var(--text-secondary)]">API Key Required</div>
                                  <div className="text-[10px] text-[var(--text-muted)]">
                                    Enter your {selectedProv.label} API key above and click &quot;Save &amp; Discover Live Models&quot; to load your account&apos;s available models.
                                  </div>
                                </div>
                              ) : discovered.length === 0 ? (
                                <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-dashed border-[var(--border-subtle)] text-center space-y-1">
                                  <div className="text-xs font-semibold text-[var(--text-secondary)]">No Models Discovered Yet</div>
                                  <div className="text-[10px] text-[var(--text-muted)]">
                                    Click &quot;Save &amp; Discover Live Models&quot; below to query the endpoint, or enter a model ID above.
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                                  {discovered.map(m => {
                                    const isChosen = providerSelectedModels[selectedProv.id] === m;
                                    return (
                                      <button
                                        key={m}
                                        type="button"
                                        onClick={() => {
                                          setProviderSelectedModels(prev => ({ ...prev, [selectedProv.id]: m }));
                                          localStorage.setItem(`ai_model_${selectedProv.id}`, m);
                                          if (activeProviderId === selectedProv.id) setActiveModel(m);
                                        }}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer ${
                                          isChosen
                                            ? 'border-[#0db7ed] bg-[#0db7ed]/20 text-[#0db7ed] font-bold shadow-sm'
                                            : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[#0db7ed]/50'
                                        }`}
                                      >
                                        {m}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border-subtle)]">
                        <button
                          type="button"
                          onClick={() => saveAndTestProviderConfig(selectedProv.id)}
                          className="px-4 py-2 rounded-xl bg-[#0db7ed] hover:bg-[#0099cc] text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Save &amp; Discover Live Models
                        </button>
                        <button
                          type="button"
                          onClick={() => selectActiveProvider(selectedProv.id)}
                          className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[#0db7ed]/10 border border-[var(--border-subtle)] text-[var(--text-primary)] hover:text-[#0db7ed] text-xs font-bold transition-all cursor-pointer"
                        >
                          Set as Active Provider
                        </button>
                        {providerConfigStatus && (
                          <span className="text-[11px] font-mono font-medium text-[#0db7ed]">
                            {providerConfigStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TAB 2: EXECUTION ROUTE */}
              {settingsTab === 'server' && (
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Active Inference Backend</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'local', name: 'Local Ollama / AIDock', desc: 'Docker Container / Model Runner' },
                        { id: 'cloud-standard', name: 'Cloud Standard', desc: 'AICodex Cloud Run (route_map.json)' },
                        { id: 'cloud-premium', name: 'Cloud Premium', desc: 'AICodex Premium Reasoning' },
                        { id: 'custom', name: 'Custom Endpoint', desc: 'User-specified base URL' }
                      ].map((prov) => (
                        <button
                          key={prov.id}
                          onClick={() => {
                            setBackendMode(prov.id);
                            localStorage.setItem('aidock_backend_mode', prov.id);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-0.5 cursor-pointer ${
                            backendMode === prov.id
                              ? 'border-[#0db7ed] bg-[#0db7ed]/10 text-[var(--text-primary)]'
                              : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'
                          }`}
                        >
                          <span className="text-xs font-bold">{prov.name}</span>
                          <span className="text-[9px] text-[var(--text-muted)] leading-normal">{prov.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {backendMode === 'custom' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Custom Base URL</label>
                      <input
                        type="text"
                        value={customEndpoint}
                        onChange={(e) => {
                          setCustomEndpoint(e.target.value);
                          localStorage.setItem('aidock_custom_endpoint', e.target.value);
                        }}
                        placeholder="e.g. https://my-backend.run.app"
                        className="w-full bg-[var(--bg-surface-elevated)] focus:bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#0db7ed] transition-all"
                      />
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-2">
                    <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0db7ed]" />
                      <span>Resolved Routing Summary</span>
                    </div>
                    <div className="text-[11px] font-mono text-[var(--text-muted)] leading-relaxed">
                      Active Chat URL: <span className="text-[var(--text-primary)] font-bold">{getBackendUrl('chat')}</span><br />
                      Active Provider: <span className="text-[#0db7ed] font-bold">{PROVIDERS.find(p => p.id === activeProviderId)?.label}</span><br />
                      Active Model: <span className="text-[#0db7ed] font-bold">{providerSelectedModels[activeProviderId] || activeModel}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: AICODEX CLOUD SYNC */}
              {settingsTab === 'cloud' && (
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  <div className="flex flex-col gap-3 bg-[var(--bg-surface-elevated)] p-4 rounded-xl border border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">AICodex Account</span>
                      {cloudToken ? (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> JWT Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Not Signed In
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={cloudUsername}
                        onChange={(e) => {
                          setCloudUsername(e.target.value);
                          localStorage.setItem('aidock_cloud_username', e.target.value);
                        }}
                        placeholder="AICodex username"
                        autoComplete="username"
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#0db7ed] transition-all"
                      />
                      <input
                        type="password"
                        value={cloudPassword}
                        onChange={(e) => setCloudPassword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') loginToCloud(); }}
                        placeholder="Password"
                        autoComplete="current-password"
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#0db7ed] transition-all"
                      />
                    </div>

                    {/* CodexSpace Selector */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                          CodexSpace
                        </label>
                        {cloudSpacesLoading && (
                          <span className="text-[9px] text-[#0db7ed] font-medium flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full border border-[#0db7ed] border-t-transparent animate-spin" />
                            Loading spaces…
                          </span>
                        )}
                        {!cloudSpacesLoading && cloudSpaces.length > 0 && (
                          <span className="text-[9px] text-[var(--text-muted)]">{cloudSpaces.length} available</span>
                        )}
                      </div>

                      {cloudSpaces.length > 0 ? (
                        <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                          {cloudSpaces.map(space => (
                            <button
                              key={space.slug}
                              type="button"
                              onClick={() => {
                                setCloudSpaceSlug(space.slug);
                                localStorage.setItem('aidock_cloud_space', space.slug);
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                                cloudSpaceSlug === space.slug
                                  ? 'border-[#0db7ed] bg-[#0db7ed]/10'
                                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)]'
                              }`}
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
                                style={{ backgroundColor: space.color || '#0db7ed' }}
                              />
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-[11px] font-bold text-[var(--text-primary)] leading-tight">{space.name}</span>
                                <span className="text-[9px] text-[var(--text-muted)] leading-snug line-clamp-1">{space.description}</span>
                                {space.recommended_model && (
                                  <span className="text-[8px] font-mono text-[#0db7ed] bg-[#0db7ed]/10 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                    {space.recommended_provider} · {space.recommended_model}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        !cloudSpacesLoading && (
                          <p className="text-[10px] text-[var(--text-muted)] font-medium italic">
                            Sign in above to load your available spaces.
                          </p>
                        )
                      )}
                    </div>

                    {cloudAuthStatus === 'error' && (
                      <p className="text-[10px] text-red-600 font-medium">
                        Sign-in failed. Check your username and password.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={async () => {
                        const token = await loginToCloud();
                        if (token) setCloudAuthStatus('ok');
                      }}
                      disabled={cloudAuthStatus === 'loading'}
                      className="w-full py-2 bg-[#0db7ed] hover:bg-[#0099cc] disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      {cloudAuthStatus === 'loading' ? (
                        <><span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> Signing In…</>
                      ) : cloudAuthStatus === 'ok' ? (
                        'Signed In — Refresh Token'
                      ) : (
                        'Sign In to AICodex Cloud'
                      )}
                    </button>

                    {cloudToken && (
                      <div className="text-[9px] text-[var(--text-muted)] font-mono break-all select-all bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-2 py-1.5 leading-relaxed">
                        {cloudToken.substring(0, 40)}…
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: DIAGNOSTICS */}
              {settingsTab === 'diagnostics' && (
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  <div className="bg-[var(--bg-surface-elevated)] p-4 rounded-xl border border-[var(--border-subtle)] flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Diagnostics</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-semibold text-[var(--text-secondary)]">
                          {connected ? 'Active Link' : 'No Connection'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-[var(--text-muted)] font-medium leading-relaxed">
                      Active Chat Endpoint:<br />
                      <span className="font-mono text-[var(--text-primary)] break-all select-all">{getBackendUrl('chat')}</span>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const url = getBackendUrl('info');
                          const headers: HeadersInit = isCloudMode() ? cloudAuthHeaders() : {};
                          const res = await fetch(url, { headers });
                          if (res.ok) {
                            const data = await res.json();
                            const info = data.model_name
                              ? `Model: ${data.model_name}`
                              : data.status === 'healthy'
                                ? `Cloud Run: healthy (${data.timestamp || ''})`
                                : JSON.stringify(data);
                            alert(`Connection Successful!\n${info}`);
                            setConnected(true);
                          } else {
                            throw new Error(`Server returned ${res.status}`);
                          }
                        } catch (err: any) {
                          alert(`Connection Failed: ${err.message}`);
                          setConnected(false);
                        }
                      }}
                      className="w-full py-2 bg-[var(--text-primary)] hover:opacity-90 text-[var(--bg-surface)] text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-[0.98] uppercase tracking-wider"
                    >
                      Test Connection
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Modal Footer */}
            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3 shrink-0">
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                Active Provider: <b className="text-[#0db7ed]">{PROVIDERS.find(p => p.id === activeProviderId)?.label}</b> · Active Model: <b className="text-[var(--text-primary)]">{providerSelectedModels[activeProviderId] || activeModel}</b>
              </span>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 bg-[#0db7ed] hover:bg-[#0099cc] text-white text-xs font-bold rounded-xl transition-all uppercase tracking-wider shadow-sm cursor-pointer"
              >
                Close &amp; Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

