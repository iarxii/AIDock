import { useState, useEffect, useRef } from 'react';
import { 
  Send, User, Activity,
  Download, FileText, ChevronDown, Save, X, Edit, FileCode,
  Folder, Plus, RefreshCw, Trash2, Settings, Moon, Sun,
  PanelLeft, Layers, Search, Check, FolderGit2, ChevronsUpDown,
  Bot, Boxes, Sparkles, Globe, Cloud, LayoutGrid, Box
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import spiritDockLogo from './assets/SpiritDock_Logo.svg';
import spiritDockWallpaper from './assets/wallpaper/SpiritDock_Wallpaper1.png';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'standard' | 'spaces'>('standard');
  const [showFunctionShortcuts, setShowFunctionShortcuts] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [activeStandardWorkspace, setActiveStandardWorkspace] = useState<'local' | 'ollama' | 'codex-root'>('local');

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
      const numLines = 5;
      for (let i = 0; i < numLines; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(13, 183, 237, ${0.12 + i * 0.08})`;
        ctx.lineWidth = 1.5;

        for (let x = 0; x < width; x += 8) {
          const y = height * 0.5 + Math.sin(x * 0.015 + t + i * 0.8) * 16 + Math.cos(x * 0.008 + t * 0.5) * 10;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

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
  const [sessionId] = useState(`session_${Date.now()}`);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(true);
  
  // Latency timer state
  const [elapsedMs, setElapsedMs] = useState(0);
  const [activeModel, setActiveModel] = useState('Gemma4 E4B');
  
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
  const [cloudModels, setCloudModels] = useState<CloudModel[]>([]);
  const [cloudModelsLoading, setCloudModelsLoading] = useState(false);
  const [cloudSelectedModel, setCloudSelectedModel] = useState<string>(() =>
    localStorage.getItem('aidock_cloud_model') || ''
  );
  // Local models fetched from backend `/models`
  const [localModels, setLocalModels] = useState<string[]>([]);
  const [localModelsLoading, setLocalModelsLoading] = useState(false);
  const [localSelectedModel, setLocalSelectedModel] = useState<string>(() =>
    localStorage.getItem('aidock_local_model') || ''
  );
  const [cloudSelectedProvider, setCloudSelectedProvider] = useState<string>(() =>
    localStorage.getItem('aidock_cloud_provider') || ''
  );
  const [cloudAuthStatus, setCloudAuthStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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
    if (!provider || provider === 'local') {
      setCloudModels([]);
      return;
    }
    setCloudModelsLoading(true);
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
        setCloudModels(data);
        // Pre-select recommended model or first result
        const recommended = space.recommended_model;
        const match = recommended ? data.find(m => m.id === recommended) : null;
        const best = match ? match.id : data[0]?.id || '';
        if (best) {
          setCloudSelectedModel(best);
          localStorage.setItem('aidock_cloud_model', best);
        }
        setCloudSelectedProvider(provider);
        localStorage.setItem('aidock_cloud_provider', provider);
      } else {
        setCloudModels([]);
      }
    } catch (e) {
      console.error('Failed to fetch cloud models:', e);
      setCloudModels([]);
    } finally {
      setCloudModelsLoading(false);
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
  const fetchFiles = async () => {
    try {
      const headers: HeadersInit = isCloudMode() ? cloudAuthHeaders() : {};
      const res = await fetch(getBackendUrl(`files?session_id=${sessionId}`), { headers });
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
            setActiveModel(data.model_name);
          } else if (data.status === 'healthy') {
            setActiveModel(`AICodex Cloud · ${cloudSpaceSlug}`);
          }
          setConnected(true);
        } else if (res.status === 401 && isCloudMode()) {
          setActiveModel('Auth Required');
          setConnected(false);
        } else {
          setActiveModel('Disconnected');
          setConnected(false);
        }
      } catch (err) {
        console.error('Error fetching model info:', err);
        setActiveModel('Connection Error');
        setConnected(false);
      }
    };
    fetchInfo();
  }, [backendMode]);

  // Fetch local /models when in local backend mode
  const fetchLocalModels = async () => {
    if (isCloudMode()) return;
    setLocalModelsLoading(true);
    try {
      const res = await fetch(getBackendUrl('models'));
      if (res.ok) {
        const data = await res.json();
        const slugs: string[] = data.models || [];
        setLocalModels(slugs);
        // Pre-select first if none selected
        if (!localSelectedModel && slugs.length > 0) {
          setLocalSelectedModel(slugs[0]);
          localStorage.setItem('aidock_local_model', slugs[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch local models:', e);
    } finally {
      setLocalModelsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalModels();
  }, [backendMode]);

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

    // Guard: cloud mode requires a JWT
    if (isCloudMode() && !cloudToken) {
      const errorMessage: Message = {
        id: `msg_${Date.now()}_e`,
        sender: 'bot',
        content: '⚠️ Cloud inference requires credentials. Open Settings (⚙️) and sign in to AICodex Cloud first.',
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

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

    logToContainer('info', `User interaction submitted - Session: ${sessionId} - Prompt: "${currentInput.substring(0, 60)}..."`);

    try {
      const chatUrl = getBackendUrl('chat');

      // Cloud uses the codegen spaces endpoint; local uses the standard chat endpoint
      const cloudBody: Record<string, string> = { prompt: currentInput };
      if (cloudSelectedModel) cloudBody.model = cloudSelectedModel;
      if (cloudSelectedProvider) cloudBody.provider = cloudSelectedProvider;

      const fetchOptions: RequestInit = isCloudMode()
        ? {
            method: 'POST',
            headers: cloudAuthHeaders(),
            body: JSON.stringify(cloudBody),
          }
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: currentInput, session_id: sessionId, model_slug: localSelectedModel || undefined }),
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
      }]);

    } catch (err: any) {
      const isConnectionError = err.message === 'Failed to fetch';
      logToContainer('error', `Handler output failure - Session: ${sessionId} - Error: ${err.message}`);
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}_e`,
        sender: 'bot',
        content: isConnectionError
          ? 'Error: Failed to connect to backend. Check that Docker is running or your cloud credentials are valid.'
          : `Error: ${err.message || 'An unknown error occurred.'}`,
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
    <div className="flex flex-col min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Expressive Horizon Header with P5 Strings Wave Animation */}
      <header className="sticky top-0 z-40 header-horizon text-white px-6 py-3 flex items-center justify-between shadow-md relative overflow-hidden" style={{ background: "var(--header-gradient)" }}>
        {/* P5 Strings Generative Canvas Animation behind right-justified function buttons */}
        <canvas
          ref={p5CanvasRef}
          className="absolute top-0 right-0 w-[540px] h-full pointer-events-none opacity-65 z-0"
        />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center p-1 shadow-[0_2px_10px_rgba(0,0,0,0.18)] shrink-0">
            <img src={spiritDockLogo} alt="SpiritDock Logo" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">AIDOCK</h1>
              <span className="text-[10px] font-mono bg-[#0db7ed]/25 text-cyan-300 border border-[#0db7ed]/40 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Orchestrator v2.0
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 relative z-10">
          <button 
            onClick={() => setIsDark(!isDark)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-md transition-all focus:outline-none flex items-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer"
            title="Toggle theme (Light / Dark)"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-cyan-300" />}
            <span>{isDark ? 'Light' : 'Dark'}</span>
          </button>

          <button 
            onClick={() => window.location.href = '/admin'}
            className="px-2.5 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-all focus:outline-none flex items-center gap-1.5 text-xs font-medium border border-white/10"
            title="Admin"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          <button 
            onClick={() => setShowSettingsModal(true)}
            className="px-3 py-1.5 bg-[#0db7ed] hover:bg-[#0099cc] text-white rounded-md transition-all focus:outline-none flex items-center gap-1.5 text-xs font-medium shadow-sm"
            title="Connection Settings"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Connection</span>
          </button>
        </div>
      </header>

      {/* Docked SpiritLlama-style Harness Bar */}
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border-default)] px-6 py-2 flex flex-wrap items-center justify-between gap-3 shadow-[var(--shadow-l1)]">
        <div className="flex items-center gap-3 text-xs">
          {/* Sidepanel trigger for SpiritLlama-style Left Sidepanel */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center justify-center border transition-all cursor-pointer ${
              isSidebarOpen
                ? 'bg-[#0db7ed] text-white border-[#0aa5d6] shadow-sm'
                : 'bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border-[var(--border-subtle)]'
            }`}
            title="Toggle Left Sidepanel (SpiritLlama UI)"
          >
            <PanelLeft className="w-4 h-4 text-[#0db7ed]" />
          </button>

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
            <Folder className="w-3.5 h-3.5 text-[#0db7ed]" />
            <span>Workspace & Files</span>
            {files.length > 0 && (
              <span className="font-mono text-[10px] bg-black/10 dark:bg-white/10 px-1.5 py-0.2 rounded font-bold">
                {files.length}
              </span>
            )}
          </button>

          <div className="h-4 w-px bg-[var(--border-subtle)]" />

          <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[#0db7ed] shadow-[0_0_8px_rgba(13,183,237,0.7)] animate-pulse' : 'bg-red-500'}`} />
            <span>{connected ? 'Neural Link Active' : 'Offline'}</span>
          </div>

          <div className="h-4 w-px bg-[var(--border-subtle)]" />

          <div className="font-mono text-[11px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] px-2.5 py-0.5 rounded text-[var(--text-secondary)] flex items-center gap-1.5">
            <span>Model:</span>
            <b className="text-[var(--text-primary)]">{activeModel}</b>
          </div>

          <div className="font-mono text-[11px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] px-2.5 py-0.5 rounded text-[var(--text-secondary)] flex items-center gap-1.5">
            <span>Space:</span>
            <b className="text-[var(--text-primary)]">{cloudSpaceSlug || 'Local'}</b>
          </div>

          <div className="font-mono text-[11px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] px-2.5 py-0.5 rounded text-[var(--text-secondary)] flex items-center gap-1.5">
            <span>Mode:</span>
            <b className="text-[var(--text-primary)] capitalize">{backendMode.replace('-', ' ')}</b>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            Session: <span className="text-[var(--text-secondary)] font-semibold bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] px-2 py-0.5 rounded">{sessionId.slice(-12)}</span>
          </span>
        </div>
      </div>

            {/* ── SpiritLlama-style Left Sidepanel Drawer (1:1 Reproduction in Docker Blue) ── */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[92vw] bg-[var(--bg-surface)] border-r border-[var(--border-default)] shadow-[var(--shadow-modal)] flex flex-col justify-between transform transition-transform duration-200 ease-in-out ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
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
              className="w-18 h-18 rounded-2xl bg-white shadow-md flex items-center justify-center p-2 mb-1.5 border-2 border-[#0db7ed] hover:scale-105 transition-transform cursor-pointer"
              onClick={() => {
                setMessages([]);
                setIsSidebarOpen(false);
              }}
              title="Start New Session"
            >
              <img src={spiritDockLogo} alt="SpiritDock" className="w-14 h-14 object-contain" />
            </div>

            <div className="font-extrabold text-base tracking-tight text-[var(--text-primary)] flex items-center gap-0.5">
              Spirit<span className="text-[#0db7ed]">Dock</span><span className="text-[var(--text-muted)] font-mono text-xs font-normal">.ai</span>
            </div>

            <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] font-bold mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0db7ed] shadow-[0_0_6px_rgba(13,183,237,0.7)] animate-pulse" />
              <span>ORCHESTRATOR CORE</span>
            </div>
          </div>

          {/* 2. ACTIVE PROJECT / WORKSPACE SELECTOR BAR */}
          <div className="px-3 pt-2.5 pb-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <div className="flex items-center justify-between mb-1 px-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Active Workspace</span>
              <button 
                type="button" 
                onClick={() => {
                  setMessages([]);
                  setIsSidebarOpen(false);
                }}
                className="text-[9px] font-bold text-[#0db7ed] hover:underline cursor-pointer flex items-center gap-0.5"
                title="Create New Session"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>

            <div 
              className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[#0db7ed]/5 border border-[var(--border-subtle)] hover:border-[#0db7ed]/50 text-left transition-all cursor-pointer shadow-sm"
              onClick={() => setActiveSidebarTab('standard')}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FolderGit2 className="w-4 h-4 text-[#0db7ed] shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {cloudSpaceSlug === 'spirit-llama' ? 'SpiritLlama Harness' : (cloudSpaceSlug || 'Local Session')}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 text-[8px] font-mono font-bold shrink-0">
                      active
                    </span>
                  </div>
                  <div className="text-[9px] font-mono text-[var(--text-muted)] truncate" title={`/workspace/${sessionId.slice(-12)}`}>
                    /workspace/{sessionId.slice(-12)}
                  </div>
                </div>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            </div>
          </div>

          {/* 3. BACKEND MODELS QUICK-BAR */}
          <div className="px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Models</span>
                <span className="px-1.5 py-0.2 rounded bg-[#0db7ed]/15 text-[#0db7ed] border border-[#0db7ed]/30 text-[8px] font-mono font-bold uppercase">
                  {backendMode}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  type="button" 
                  onClick={() => fetchLocalModels()}
                  className="p-0.5 rounded text-[var(--text-muted)] hover:text-[#0db7ed] transition-colors cursor-pointer"
                  title="Refresh Backend Models"
                >
                  <RefreshCw className={`w-3 h-3 ${localModelsLoading ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowSettingsModal(true)}
                  className="text-[9px] font-bold text-[#0db7ed] hover:underline cursor-pointer" 
                  title="Open Engine & Connection Settings"
                >
                  Engine ▸
                </button>
              </div>
            </div>
            <div className="text-[11px] font-mono bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2.5 py-1.5 rounded-lg flex items-center justify-between">
              <span className="font-bold text-[var(--text-primary)] truncate">{activeModel}</span>
              <span className="text-[9px] text-[#0db7ed] font-semibold">Active Runner</span>
            </div>
            {localModels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5 max-h-16 overflow-y-auto">
                {localModels.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setLocalSelectedModel(m);
                      setActiveModel(m);
                      localStorage.setItem('aidock_local_model', m);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition-all cursor-pointer ${
                      (localSelectedModel === m || activeModel === m)
                        ? 'border-[#0db7ed] bg-[#0db7ed]/15 text-[#0db7ed] font-bold'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[#0db7ed]/40'
                    }`}
                  >
                    {m}
                  </button>
                ))}
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
                {/* Standard Workspaces items */}
                <div className="space-y-1.5">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                    Workspaces
                  </div>

                  {/* Local Session */}
                  <div
                    onClick={() => {
                      setActiveStandardWorkspace('local');
                      setCloudSpaceSlug('local-session');
                      localStorage.setItem('aidock_cloud_space', 'local-session');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                      activeStandardWorkspace === 'local'
                        ? 'border-[#0db7ed] bg-[#0db7ed]/10 shadow-sm'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[var(--text-primary)]">Local Session</span>
                        <span className="text-[8px] font-mono bg-black/10 dark:bg-white/10 px-1 py-0.2 rounded text-[var(--text-secondary)]">/workspace</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] truncate">Ephemeral sandbox & files</div>
                    </div>
                    {activeStandardWorkspace === 'local' && <Check className="w-3.5 h-3.5 text-[#0db7ed] shrink-0 mt-0.5" />}
                  </div>

                  {/* OllamaOpt Engine */}
                  <div
                    onClick={() => {
                      setActiveStandardWorkspace('ollama');
                      setCloudSpaceSlug('ollama-opt');
                      localStorage.setItem('aidock_cloud_space', 'ollama-opt');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                      activeStandardWorkspace === 'ollama'
                        ? 'border-[#0db7ed] bg-[#0db7ed]/10 shadow-sm'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[var(--text-primary)]">OllamaOpt Engine</span>
                        <span className="text-[8px] font-mono bg-[#0db7ed]/15 text-[#0db7ed] px-1 py-0.2 rounded font-bold">11434</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] truncate">Local GGUF model runner</div>
                    </div>
                    {activeStandardWorkspace === 'ollama' && <Check className="w-3.5 h-3.5 text-[#0db7ed] shrink-0 mt-0.5" />}
                  </div>

                  {/* AI_Codex Knowledge Base */}
                  <div
                    onClick={() => {
                      setActiveStandardWorkspace('codex-root');
                      setCloudSpaceSlug('ai-codex');
                      localStorage.setItem('aidock_cloud_space', 'ai-codex');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                      activeStandardWorkspace === 'codex-root'
                        ? 'border-[#0db7ed] bg-[#0db7ed]/10 shadow-sm'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[var(--text-primary)]">AI_Codex Root</span>
                        <span className="text-[8px] font-mono bg-black/10 dark:bg-white/10 px-1 py-0.2 rounded text-[var(--text-secondary)]">Repo</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] truncate">Architecture & specs</div>
                    </div>
                    {activeStandardWorkspace === 'codex-root' && <Check className="w-3.5 h-3.5 text-[#0db7ed] shrink-0 mt-0.5" />}
                  </div>
                </div>

                {/* Workspace Files Section */}
                <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between px-1">
                    <span 
                      onClick={() => setIsFileTreeExpanded(!isFileTreeExpanded)}
                      className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)] flex items-center gap-1"
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform ${isFileTreeExpanded ? '' : '-rotate-90'}`} />
                      Workspace Files ({files.length})
                    </span>
                    <button
                      onClick={() => fetchFiles()}
                      className="text-[9px] text-[#0db7ed] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Refresh
                    </button>
                  </div>

                  {isFileTreeExpanded && (
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                      {files.length === 0 ? (
                        <p className="text-[11px] text-[var(--text-muted)] italic px-1 py-1">No files in sandbox</p>
                      ) : (
                        files.map(f => (
                          <div 
                            key={f.name} 
                            onClick={() => openFileInEditor(f.path)}
                            className="flex items-center justify-between p-1.5 rounded-lg bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] hover:border-[#0db7ed]/40 text-xs cursor-pointer transition-all"
                            title="Click to open in editor"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <FileCode className="w-3.5 h-3.5 text-[#0db7ed] shrink-0" />
                              <span className="font-mono text-[11px] truncate text-[var(--text-primary)]">{f.name}</span>
                            </div>
                            <span className="text-[9px] font-mono text-[var(--text-muted)]">{(f.size / 1024).toFixed(1)}k</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* CodexSpaces items */}
                <div className="space-y-1.5">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                    CodexSpaces
                  </div>

                  {/* SpiritLlama */}
                  <div
                    onClick={() => {
                      setCloudSpaceSlug('spirit-llama');
                      localStorage.setItem('aidock_cloud_space', 'spirit-llama');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                      cloudSpaceSlug === 'spirit-llama'
                        ? 'border-[#0db7ed] bg-[#0db7ed]/10 shadow-sm'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[var(--text-primary)]">🟧 SpiritLlama.cpp</span>
                        <span className="text-[8px] font-mono bg-[#0db7ed]/15 text-[#0db7ed] px-1 py-0.2 rounded font-bold">8080</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] truncate">WPF Native Vulkan/CUDA GGUF</div>
                    </div>
                    {cloudSpaceSlug === 'spirit-llama' && <Check className="w-3.5 h-3.5 text-[#0db7ed] shrink-0 mt-0.5" />}
                  </div>

                  {/* VSCodex */}
                  <div
                    onClick={() => {
                      setCloudSpaceSlug('vscodex-bridge');
                      localStorage.setItem('aidock_cloud_space', 'vscodex-bridge');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                      cloudSpaceSlug === 'vscodex-bridge'
                        ? 'border-[#0db7ed] bg-[#0db7ed]/10 shadow-sm'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[var(--text-primary)]">⬜ VSCodex Bridge</span>
                        <span className="text-[8px] font-mono bg-black/10 dark:bg-white/10 px-1 py-0.2 rounded text-[var(--text-secondary)]">VSCode</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] truncate">Monaco Canvas & extension sync</div>
                    </div>
                    {cloudSpaceSlug === 'vscodex-bridge' && <Check className="w-3.5 h-3.5 text-[#0db7ed] shrink-0 mt-0.5" />}
                  </div>

                  {/* Cloud Spaces */}
                  {cloudSpaces.length > 0 ? (
                    cloudSpaces.map(s => (
                      <div
                        key={s.slug}
                        onClick={() => {
                          setCloudSpaceSlug(s.slug);
                          localStorage.setItem('aidock_cloud_space', s.slug);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                          cloudSpaceSlug === s.slug
                            ? 'border-[#0db7ed] bg-[#0db7ed]/10 shadow-sm'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)]'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[var(--text-primary)]">{s.name}</span>
                          <div className="text-[10px] text-[var(--text-secondary)] truncate">{s.description || s.slug}</div>
                        </div>
                        {cloudSpaceSlug === s.slug && <Check className="w-3.5 h-3.5 text-[#0db7ed] shrink-0 mt-0.5" />}
                      </div>
                    ))
                  ) : (
                    <div
                      onClick={() => {
                        setCloudSpaceSlug('spirit-book');
                        localStorage.setItem('aidock_cloud_space', 'spirit-book');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                        cloudSpaceSlug === 'spirit-book'
                          ? 'border-[#0db7ed] bg-[#0db7ed]/10 shadow-sm'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[var(--text-primary)]">☁️ Spirit Book</span>
                        <div className="text-[10px] text-[var(--text-secondary)] truncate">Default cloud space</div>
                      </div>
                      {cloudSpaceSlug === 'spirit-book' && <Check className="w-3.5 h-3.5 text-[#0db7ed] shrink-0 mt-0.5" />}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all bg-[var(--bg-surface-elevated)] hover:bg-[#0db7ed]/10 border border-[var(--border-subtle)] hover:border-[#0db7ed]/40 text-[var(--text-secondary)] hover:text-[#0db7ed] shadow-sm mt-3 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-[#0db7ed]" />
                  <span>Browse Cloud Spaces</span>
                </button>
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
                setMessages([]);
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

      {/* ── Main Workspace Column with P5 Wave & Wallpaper (OllamaOpt 1:1) ── */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden bg-[var(--bg-canvas)]">
        {/* Dynamic P5 Graphic Canvas Layer in Docker Blue */}
        <canvas
          ref={workspaceP5CanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />

        {/* Wallpaper Watermark Overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-0 bg-cover bg-bottom opacity-35 dark:opacity-15 mix-blend-multiply dark:mix-blend-overlay transition-opacity duration-300"
          style={{ backgroundImage: `url(${spiritDockWallpaper})` }}
        />

        {/* Main Container (Spacious SpiritLlama Workspace) */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
        {/* Middle column: Chat Area */}
        <section className={`${isTextEditorOpen ? "lg:col-span-7" : "lg:col-span-12"} flex flex-col h-[calc(100vh-125px)] min-h-[500px] transition-all duration-300`}>

          <div className="flex-1 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)] shadow-[var(--shadow-l1)] p-5 flex flex-col overflow-hidden">
            
            {/* Chat Area Header with Export Menu */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-[var(--text-primary)] tracking-wide uppercase">Active Session Stream</span>
              </div>
              
              {messages.length > 0 && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0db7ed] hover:bg-[#0099cc] text-white text-xs font-semibold rounded-md shadow-sm transition-all duration-150"
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


            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin">
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
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 max-w-[85%] ${
                      msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 shadow-sm ${
                      msg.sender === 'user' ? 'bg-[#0db7ed] text-white' : 'bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[#0db7ed]'
                    }`}>
                      {msg.sender === 'user' ? <User className="w-4 h-4" /> : <MascotLogo className="w-4 h-4 text-[#0db7ed]" />}
                    </div>

                    <div className="flex flex-col gap-1 max-w-[85%]">
                      {/* LLM Logo & Model Badge inside Assistant bubbles */}
                      {msg.sender === 'bot' && msg.id.indexOf('_sys') === -1 && (
                        <div className="flex items-center gap-1.5 pb-1 border-b border-[var(--border-subtle)] mb-1 text-[11px] text-[var(--text-muted)] font-semibold">
                          <div className="w-3.5 h-3.5 rounded bg-[#0db7ed] flex items-center justify-center text-white shrink-0">
                            <MascotLogo className="w-2.5 h-2.5 text-white" />
                          </div>
                          <span className="font-bold text-[var(--text-primary)]">{activeModel}</span>
                          <span className="text-[9px] font-mono bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] px-1.5 py-0.2 rounded text-[var(--text-secondary)]">Model Runner</span>
                        </div>
                      )}
                      
                      <div
                        className={`p-3.5 rounded-md text-sm border ${
                          msg.sender === 'user'
                            ? 'bg-[#0db7ed] text-white user-corner-glow font-medium border-[#0aa5d6] shadow-sm'
                            : 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] bot-corner-glow border-[var(--border-subtle)] shadow-[var(--shadow-l1)]'
                        }`}
                      >
                        {msg.sender === 'user' ? (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                          <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-[var(--text-primary)] text-[var(--text-primary)] prose-a:text-[#0db7ed] prose-code:bg-black/5 dark:prose-code:bg-white/10 prose-code:px-1 prose-code:rounded">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between gap-4 px-1 text-[10px] text-[var(--text-muted)]">
                        {msg.workspaceUsed && (
                          <div className="font-mono truncate max-w-[150px]" title={msg.workspaceUsed}>
                            Workspace: {msg.workspaceUsed}
                          </div>
                        )}
                        {msg.latencyMs !== undefined && (
                          <div className="font-mono flex items-center gap-1 shrink-0 ml-auto">
                            <Activity className="w-3 h-3 text-[#0db7ed]" />
                            <span>Latency: {msg.latencyMs.toLocaleString()} ms ({(msg.latencyMs / 1000).toFixed(2)}s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
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

            {/* Input Toolbar Area */}
            <div className="flex flex-col gap-2 pt-3 border-t border-[var(--border-subtle)]">
              {/* Function buttons toolbar */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  {/* Plus context file selector */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-7 h-7 rounded-md bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center justify-center shadow-sm transition-all focus:outline-none"
                    title="Attach Context File (RAG)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <button
                    onClick={() => setInput("Write a python file-editor tool that can edit a source file.")}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-md transition-all"
                  >
                    Write Code
                  </button>
                  <button
                    onClick={() => setInput("Scan all workspace files and summarize their contents.")}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-md transition-all"
                  >
                    Scan Workspace
                  </button>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={fetchFiles}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors focus:outline-none"
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
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors focus:outline-none"
                    title="Clear Chat Log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dynamic Chat Textarea Box */}
              <div className="flex gap-2.5 items-end">
                <textarea
                  ref={chatInputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  rows={1}
                  className="flex-1 bg-[var(--bg-surface-elevated)] focus:bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] border border-[var(--border-default)] rounded-md px-3.5 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0db7ed]/25 focus:border-[#0db7ed] resize-none min-h-[44px] max-h-[180px] overflow-y-auto scrollbar-thin"
                  placeholder="Instruct the AI model in your workspace..."
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="bg-[#0db7ed] hover:bg-[#0099cc] active:scale-95 disabled:opacity-40 disabled:scale-100 text-white w-11 h-11 rounded-md flex items-center justify-center shadow-sm hover:shadow transition-all duration-150 shrink-0 mb-[1px]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* Right column: Text Editor Pane */}
        {isTextEditorOpen && (
          <section className="lg:col-span-4 flex flex-col h-[calc(100vh-125px)] min-h-[500px] bg-[var(--bg-editor)] text-[#E8ECF2] rounded-lg border border-[var(--border-default)] shadow-[var(--shadow-l1)] p-4 overflow-hidden transition-all duration-300">
            {/* Editor Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-2.5">
              <div className="flex items-center gap-2 truncate mr-2">
                <FileCode className="w-4 h-4 text-[#0db7ed] shrink-0" />
                <span className="text-xs font-mono font-bold tracking-wide truncate" title={editorFilename}>{editorFilename}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${editorSaved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} title={editorSaved ? 'Saved' : 'Unsaved changes'} />
              </div>
              <button
                onClick={() => setIsTextEditorOpen(false)}
                className="text-[#7A7D8E] hover:text-white transition-colors duration-150 focus:outline-none"
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
                  className={`px-2.5 py-1 rounded font-bold transition-all ${editorFormat === 'markdown' ? 'bg-[#0db7ed] text-white shadow-sm' : 'text-[#7A7D8E] hover:text-white'}`}
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
                  className={`px-2.5 py-1 rounded font-bold transition-all ${editorFormat === 'json' ? 'bg-[#0db7ed] text-white shadow-sm' : 'text-[#7A7D8E] hover:text-white'}`}
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
                className="flex-1 bg-[#0db7ed] hover:bg-[#0099cc] text-white text-xs font-semibold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save to Workspace</span>
              </button>
              <button
                onClick={() => triggerDownload(editorContent, editorFilename)}
                className="bg-white/10 hover:bg-white/15 text-white text-xs font-semibold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 border border-white/10 transition-all"
                title="Download locally"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>
        )}
      </main>
      </div>

      {/* Premium Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg w-full max-w-lg shadow-[var(--shadow-modal)] p-6 relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto text-[var(--text-primary)]">
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border-subtle)]">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#0db7ed] to-[#008bb9] flex items-center justify-center text-white shadow-sm">
                <MascotLogo className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Connection Settings</h3>
                <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">Orchestration & Backend Routing</p>
              </div>
            </div>

            <div className="space-y-4 py-1">
              {/* Backend Mode Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Active Inference Backend</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'local', name: 'Local Ollama', desc: 'WSL Local Container' },
                    { id: 'cloud-standard', name: 'Cloud Standard', desc: 'AICodex Cloud Run' },
                    { id: 'cloud-premium', name: 'Cloud Premium', desc: 'Advanced Reasoning' },
                    { id: 'custom', name: 'Custom URL', desc: 'User-specified base URL' }
                  ].map((prov) => (
                    <button
                      key={prov.id}
                      onClick={() => {
                        setBackendMode(prov.id);
                        localStorage.setItem('aidock_backend_mode', prov.id);
                      }}
                      className={`p-3 rounded-md border text-left transition-all flex flex-col gap-0.5 ${
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

              {/* Custom URL override */}
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
                    className="w-full bg-[var(--bg-surface-elevated)] focus:bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#0db7ed] transition-all"
                  />
                </div>
              )}

              {/* ── AICodex Cloud Credentials ─────────────────────── */}
              {isCloudMode() && (
                <div className="flex flex-col gap-3 bg-[var(--bg-surface-elevated)] p-4 rounded-md border border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">AICodex Credentials</span>
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
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md px-3 py-2 text-xs font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#0db7ed] transition-all"
                    />
                    <input
                      type="password"
                      value={cloudPassword}
                      onChange={(e) => setCloudPassword(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') loginToCloud(); }}
                      placeholder="Password"
                      autoComplete="current-password"
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md px-3 py-2 text-xs font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#0db7ed] transition-all"
                    />
                  </div>

                  {/* ── Dynamic Space Selector ── */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-bold text-[#7A7D8E] uppercase tracking-wider">
                        CodexSpace
                      </label>
                      {cloudSpacesLoading && (
                        <span className="text-[9px] text-[#0db7ed] font-medium flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full border border-[#0db7ed] border-t-transparent animate-spin" />
                          Loading spaces…
                        </span>
                      )}
                      {!cloudSpacesLoading && cloudSpaces.length > 0 && (
                        <span className="text-[9px] text-[#7A7D8E]">{cloudSpaces.length} available</span>
                      )}
                    </div>

                    {cloudSpaces.length > 0 ? (
                      <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                        {cloudSpaces.map(space => (
                          <button
                            key={space.slug}
                            onClick={() => {
                              setCloudSpaceSlug(space.slug);
                              localStorage.setItem('aidock_cloud_space', space.slug);
                            }}
                            className={`p-2.5 rounded-md border text-left transition-all flex items-start gap-2.5 ${
                              cloudSpaceSlug === space.slug
                                ? 'border-[#0db7ed] bg-[#0db7ed]/10'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)]'
                            }`}
                          >
                            {/* Color swatch */}
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

                  {/* ── Model Selector ── */}
                  {cloudSpaces.find(s => s.slug === cloudSpaceSlug) && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                          Inference Model
                        </label>
                        {cloudModelsLoading && (
                          <span className="text-[9px] text-[#0db7ed] font-medium flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full border border-[#0db7ed] border-t-transparent animate-spin" />
                            Loading models…
                          </span>
                        )}
                        {!cloudModelsLoading && cloudSelectedProvider && (
                          <span className="text-[9px] font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
                            via {cloudSelectedProvider}
                          </span>
                        )}
                      </div>

                      {cloudModels.length > 0 ? (
                        <select
                          value={cloudSelectedModel}
                          onChange={(e) => {
                            setCloudSelectedModel(e.target.value);
                            localStorage.setItem('aidock_cloud_model', e.target.value);
                          }}
                          className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md px-3 py-2 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[#0db7ed] transition-all cursor-pointer"
                        >
                          {cloudModels.map(m => (
                            <option key={m.id} value={m.id}>{m.name || m.id}</option>
                          ))}
                        </select>
                      ) : (
                        !cloudModelsLoading && (
                          <p className="text-[10px] text-[var(--text-muted)] italic">
                            No models available for this space's provider.
                          </p>
                        )
                      )}
                    </div>
                  )}


                  {/* Auth status feedback */}
                  {cloudAuthStatus === 'error' && (
                    <p className="text-[10px] text-red-600 font-medium">
                      ✗ Sign-in failed. Check your username and password.
                    </p>
                  )}

                  <button
                    onClick={async () => {
                      const token = await loginToCloud();
                      if (token) {
                        setCloudAuthStatus('ok');
                      }
                    }}
                    disabled={cloudAuthStatus === 'loading'}
                    className="w-full py-2 bg-[#0db7ed] hover:bg-[#008bb9] disabled:opacity-60 text-white text-xs font-bold rounded-md shadow-sm transition-all active:scale-[0.98] uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {cloudAuthStatus === 'loading' ? (
                      <><span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> Signing In…</>
                    ) : cloudAuthStatus === 'ok' ? (
                      '✓ Signed In — Refresh Token'
                    ) : (
                      'Sign In to AICodex Cloud'
                    )}
                  </button>

                  {cloudToken && (
                    <div className="text-[9px] text-[var(--text-muted)] font-mono break-all select-all bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md px-2 py-1.5 leading-relaxed">
                      {cloudToken.substring(0, 40)}…
                    </div>
                  )}
                </div>
              )}

              {/* Diagnostics */}
              <div className="bg-[var(--bg-surface-elevated)] p-4 rounded-md border border-[var(--border-subtle)] flex flex-col gap-3">
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
                        alert(`✓ Connection Successful!\n${info}`);
                        setConnected(true);
                      } else {
                        throw new Error(`Server returned ${res.status}`);
                      }
                    } catch (err: any) {
                      alert(`✗ Connection Failed: ${err.message}`);
                      setConnected(false);
                    }
                  }}
                  className="w-full py-2 bg-[var(--text-primary)] hover:opacity-90 text-[var(--bg-surface)] text-xs font-bold rounded-md transition-all active:scale-[0.98] uppercase tracking-wider"
                >
                  Test Connection
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2.5 bg-[#0db7ed] hover:bg-[#0099cc] text-white text-xs font-bold rounded-md transition-all uppercase tracking-wider shadow-sm"
            >
              Close & Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

