import { useState, useEffect } from 'react';
import { X, MessageSquare, Clock, Plus } from 'lucide-react';
import routeMap from '../route_map.json';

interface Session {
  id: number;
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  space_type?: string;
}

interface SessionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  isCloudMode: () => boolean;
  cloudSpaceSlug: string;
  cloudToken: string;
  customEndpoint?: string;
}

export default function SessionHistoryPanel({
  isOpen,
  onClose,
  activeSessionId,
  onSelectSession,
  isCloudMode,
  cloudSpaceSlug,
  cloudToken,
  customEndpoint
}: SessionHistoryPanelProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBackendUrl = (endpoint: string) => {
    if (isCloudMode()) {
      return `${routeMap.backend_url}/api/spaces/${cloudSpaceSlug}/${endpoint}`;
    }
    return customEndpoint || `http://localhost:${window.location.port === '3000' ? '8080' : window.location.port}/${endpoint}`;
  };

  const cloudAuthHeaders = (): Record<string, string> => {
    return isCloudMode() ? { 'Authorization': `Bearer ${cloudToken}` } : {};
  };

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      // In cloud mode, fetch conversations for the current space.
      // In local mode, fetch local sessions.
      const endpoint = isCloudMode() ? 'conversations' : 'sessions';
      const url = getBackendUrl(endpoint);
      
      const res = await fetch(url, { headers: cloudAuthHeaders() });
      if (!res.ok) {
        throw new Error(`Failed to fetch history: ${res.statusText}`);
      }
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen, isCloudMode(), cloudSpaceSlug]);

  const handleNewSession = () => {
    const newSessionId = `session_${Date.now()}`;
    onSelectSession(newSessionId);
    onClose();
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-[#FAFAFA] border-l border-black/10 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-black/5 bg-white">
          <h2 className="text-sm font-bold text-[#1A1D2E] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F97316]" />
            History
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-black/5 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-[#7A7D8E]" />
          </button>
        </div>

        <div className="p-4 bg-white border-b border-black/5">
          <button
            onClick={handleNewSession}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Workspace
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-xs font-medium text-[#7A7D8E]">Loading history...</div>
          ) : error ? (
            <div className="text-center py-8 text-xs font-medium text-red-500 bg-red-50 rounded-lg border border-red-100">{error}</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-xs font-medium text-[#7A7D8E]">No past workspaces found.</div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id || session.session_id}
                onClick={() => {
                  onSelectSession(session.session_id);
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all group relative ${
                  activeSessionId === session.session_id || activeSessionId === String(session.id)
                    ? 'bg-[#FFEDD5] border-[#F97316] shadow-sm'
                    : 'bg-white border-black/5 hover:border-[#F97316]/30 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                    activeSessionId === session.session_id ? 'text-[#F97316]' : 'text-[#7A7D8E]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${
                      activeSessionId === session.session_id ? 'text-[#C2410C]' : 'text-[#1A1D2E]'
                    }`}>
                      {session.title || session.session_id}
                    </p>
                    <p className="text-[10px] text-[#7A7D8E] mt-1 font-medium flex items-center justify-between">
                      {formatDate(session.updated_at || session.created_at)}
                      {session.space_type && (
                        <span className="bg-black/5 px-1.5 py-0.5 rounded uppercase tracking-wider text-[8px]">
                          {session.space_type}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
