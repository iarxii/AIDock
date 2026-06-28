import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  const navigate = useNavigate();
  const [adminKey, setAdminKey] = useState<string>(() => localStorage.getItem('aidock_admin_key') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newSlug, setNewSlug] = useState('');
  const [audit, setAudit] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  const getBackendUrl = (path: string) => `/api/${path}`;

  const headers = () => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminKey) h['X-Admin-Key'] = adminKey;
    return h;
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminKey) { alert('Admin key required'); return; }
    setLoading(true);
    try {
      const res = await fetch(getBackendUrl('admin/whitelist'), { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setWhitelist(data.slugs || []);
        localStorage.setItem('aidock_admin_key', adminKey);
        setIsAuthenticated(true);
      } else {
        alert('Invalid admin key or unauthorized');
      }
    } catch (e) {
      alert('Error verifying admin key');
    } finally { setLoading(false); }
  };

  const fetchWhitelist = async () => {
    setLoading(true);
    try {
      const res = await fetch(getBackendUrl('admin/whitelist'), { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setWhitelist(data.slugs || []);
      } else {
        alert('Failed to load whitelist');
      }
    } catch (e) {
      alert('Error fetching whitelist');
    } finally { setLoading(false); }
  };

  const fetchModels = async () => {
    setModelsLoading(true);
    try {
      const res = await fetch(getBackendUrl('models'));
      if (res.ok) {
        const data = await res.json();
        // server may return { models: [...] } or a raw list
        const list = data.models || data;
        setModels(Array.isArray(list) ? list : []);
      } else {
        alert('Failed to load models');
      }
    } catch (e) {
      console.error('fetchModels error', e);
      alert('Error fetching models');
    } finally { setModelsLoading(false); }
  };

  const addSlug = async (slug?: string) => {
    const slugToAdd = slug || newSlug;
    if (!slugToAdd) return alert('Slug required');
    try {
      const res = await fetch(getBackendUrl('admin/whitelist'), { method: 'POST', headers: headers(), body: JSON.stringify({ slug: slugToAdd }) });
      if (res.ok) {
        const data = await res.json();
        setWhitelist(data.slugs || []);
        if (!slug) setNewSlug('');
      } else alert('Add failed');
    } catch (e) { alert('Add failed'); }
  };

  const removeSlug = async (slug: string) => {
    try {
      const res = await fetch(getBackendUrl('admin/whitelist'), { method: 'DELETE', headers: headers(), body: JSON.stringify({ slug }) });
      if (res.ok) {
        const data = await res.json();
        setWhitelist(data.slugs || []);
      } else alert('Remove failed');
    } catch (e) { alert('Remove failed'); }
  };

  const fetchAudit = async () => {
    try {
      const res = await fetch(getBackendUrl('admin/whitelist/audit'), { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setAudit(data.entries || []);
      } else alert('Failed to fetch audit');
    } catch (e) { alert('Failed to fetch audit'); }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#C8CDD5]">
        <form onSubmit={handleLogin} className="bg-[#D8DCE4] p-8 rounded-2xl shadow-xl w-96 flex flex-col gap-5 border border-black/5">
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-2xl font-bold text-[#1A1D2E]">Admin Access</h2>
            <p className="text-sm text-[#7A7D8E] text-center">Enter your administrator key to manage models and workspaces.</p>
          </div>
          <div>
            <input 
              type="password" 
              value={adminKey} 
              onChange={(e) => setAdminKey(e.target.value)} 
              className="w-full p-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#0db7ed] bg-white text-[#1A1D2E]" 
              placeholder="Admin Key" 
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-[#0db7ed] text-white rounded-xl font-bold hover:bg-[#0ca3d4] transition-colors shadow-md disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Unlock'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="w-full py-3 bg-[#E8ECF2] text-[#4A4D5E] rounded-xl font-bold hover:bg-[#D8DCE4] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto text-[#1A1D2E]">
      <div className="flex items-center justify-between mb-8 bg-[#D8DCE4] p-4 rounded-2xl shadow-sm border border-black/5">
        <h2 className="text-2xl font-bold tracking-tight">Admin: Model Whitelist</h2>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-[#E8ECF2] text-[#4A4D5E] font-bold rounded-xl hover:bg-black/5 transition-all">Back</button>
      </div>

      <div className="space-y-6">
        <div className="flex gap-2">
          <button onClick={fetchWhitelist} className="px-4 py-2 bg-[#0db7ed] text-white font-bold rounded-xl hover:bg-[#0ca3d4] shadow-sm transition-all">Refresh Whitelist</button>
          <button onClick={fetchAudit} className="px-4 py-2 bg-[#2D314E] text-white font-bold rounded-xl hover:bg-[#1A1D2E] shadow-sm transition-all">Load Audit Log</button>
          <button onClick={fetchModels} className="px-4 py-2 bg-[#1F8A70] text-white font-bold rounded-xl hover:bg-[#166451] shadow-sm transition-all">Load All Models</button>
        </div>

        <div className="bg-[#D8DCE4] p-5 rounded-2xl shadow-sm border border-black/5">
          <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-[#4A4D5E]">Add Slug</label>
          <div className="flex gap-2">
            <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} className="flex-1 p-3 rounded-xl border border-black/5 focus:outline-none focus:ring-2 focus:ring-[#0db7ed]" placeholder="owner/model:tag" />
            <button onClick={() => addSlug()} className="px-6 py-3 bg-[#0db7ed] text-white font-bold rounded-xl hover:bg-[#0ca3d4] shadow-sm transition-all">Add</button>
          </div>
        </div>

        <div className="bg-[#D8DCE4] p-5 rounded-2xl shadow-sm border border-black/5">
          <label className="block text-sm font-bold mb-3 uppercase tracking-wider text-[#4A4D5E]">Whitelist</label>
          <div className="bg-[#E8ECF2] p-3 rounded-xl border border-black/5 max-h-64 overflow-auto">
            {loading ? <div className="text-sm p-2 text-[#7A7D8E]">Loading...</div> : (
              whitelist.length === 0 ? <div className="text-sm p-2 text-[#7A7D8E]">No entries</div> : (
                whitelist.map(s => (
                  <div key={s} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
                    <div className="truncate pr-2 font-mono text-sm">{s}</div>
                    <button onClick={() => removeSlug(s)} className="text-red-500 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Remove</button>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        <div className="bg-[#D8DCE4] p-5 rounded-2xl shadow-sm border border-black/5">
          <label className="block text-sm font-bold mb-3 uppercase tracking-wider text-[#4A4D5E]">Available Models</label>
          <div className="bg-[#E8ECF2] p-3 rounded-xl border border-black/5 max-h-64 overflow-auto">
            {modelsLoading ? <div className="text-sm p-2 text-[#7A7D8E]">Loading...</div> : (
              models.length === 0 ? <div className="text-sm p-2 text-[#7A7D8E]">No models loaded</div> : (
                models.map((m: any, i: number) => {
                  const slug = typeof m === 'string' ? m : (m.slug || m.id || JSON.stringify(m));
                  const name = typeof m === 'object' && m.name ? m.name : undefined;
                  const desc = typeof m === 'object' && m.description ? m.description : undefined;
                  return (
                    <div key={i} className="py-3 border-b border-black/5 last:border-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-bold text-sm">{name || slug}</div>
                          <div className="text-xs text-[#7A7D8E] font-mono mt-0.5">{slug}</div>
                          {desc && <div className="text-xs text-[#4A4D5E] mt-1">{desc}</div>}
                        </div>
                        <div className="shrink-0">
                          <button onClick={() => addSlug(slug)} className="px-3 py-1.5 bg-[#0db7ed] text-white font-bold text-xs rounded-lg hover:bg-[#0ca3d4] transition-colors">Add</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        <div className="bg-[#D8DCE4] p-5 rounded-2xl shadow-sm border border-black/5">
          <label className="block text-sm font-bold mb-3 uppercase tracking-wider text-[#4A4D5E]">Audit Log</label>
          <div className="bg-[#E8ECF2] p-3 rounded-xl border border-black/5 max-h-64 overflow-auto text-xs">
            {audit.length === 0 ? <div className="text-sm p-2 text-[#7A7D8E]">No entries</div> : (
              audit.map((e, i) => (
                <div key={i} className="py-2 border-b border-black/5 last:border-0">
                  <div className="font-mono font-semibold text-[#4A4D5E]">{e.timestamp} &middot; {e.action} &middot; {e.slug || ''}</div>
                  <div className="text-[#7A7D8E] mt-0.5">IP: {e.client_ip || ''}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
