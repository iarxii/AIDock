import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  const navigate = useNavigate();
  const [adminKey, setAdminKey] = useState<string>(() => localStorage.getItem('aidock_admin_key') || '');
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

  const fetchWhitelist = async () => {
    if (!adminKey) { alert('Admin key required'); return; }
    setLoading(true);
    try {
      const res = await fetch(getBackendUrl('admin/whitelist'), { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setWhitelist(data.slugs || []);
        localStorage.setItem('aidock_admin_key', adminKey);
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

  const addSlug = async () => {
    if (!adminKey || !newSlug) return alert('Admin key and slug required');
    try {
      const res = await fetch(getBackendUrl('admin/whitelist'), { method: 'POST', headers: headers(), body: JSON.stringify({ slug: newSlug }) });
      if (res.ok) {
        const data = await res.json();
        setWhitelist(data.slugs || []);
        setNewSlug('');
      } else alert('Add failed');
    } catch (e) { alert('Add failed'); }
  };

  const removeSlug = async (slug: string) => {
    if (!adminKey) return alert('Admin key required');
    try {
      const res = await fetch(getBackendUrl('admin/whitelist'), { method: 'DELETE', headers: headers(), body: JSON.stringify({ slug }) });
      if (res.ok) {
        const data = await res.json();
        setWhitelist(data.slugs || []);
      } else alert('Remove failed');
    } catch (e) { alert('Remove failed'); }
  };

  const fetchAudit = async () => {
    if (!adminKey) return alert('Admin key required');
    try {
      const res = await fetch(getBackendUrl('admin/whitelist/audit'), { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setAudit(data.entries || []);
      } else alert('Failed to fetch audit');
    } catch (e) { alert('Failed to fetch audit'); }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Admin: Model Whitelist</h2>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="px-3 py-2 bg-[#E8ECF2] rounded">Back</button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Admin Key</label>
          <input value={adminKey} onChange={(e) => setAdminKey(e.target.value)} className="w-full p-2 rounded border" placeholder="X-Admin-Key" />
        </div>

        <div className="flex gap-2">
          <button onClick={fetchWhitelist} className="px-3 py-2 bg-[#0db7ed] text-white rounded">Load Whitelist</button>
          <button onClick={fetchAudit} className="px-3 py-2 bg-[#2D314E] text-white rounded">Load Audit</button>
          <button onClick={fetchModels} className="px-3 py-2 bg-[#1F8A70] text-white rounded">Load Models</button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Add Slug</label>
          <div className="flex gap-2">
            <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} className="flex-1 p-2 rounded border" placeholder="owner/model:tag" />
            <button onClick={addSlug} className="px-3 py-2 bg-[#0db7ed] text-white rounded">Add</button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Whitelist</label>
          <div className="bg-white p-2 rounded border max-h-64 overflow-auto">
            {loading ? <div>Loading...</div> : (
              whitelist.length === 0 ? <div className="text-sm text-gray-500">No entries</div> : (
                whitelist.map(s => (
                  <div key={s} className="flex items-center justify-between py-1 border-b">
                    <div className="truncate pr-2">{s}</div>
                    <button onClick={() => removeSlug(s)} className="text-red-600 text-xs px-2 py-1 rounded">Remove</button>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Available Models</label>
          <div className="bg-white p-2 rounded border max-h-64 overflow-auto">
            {modelsLoading ? <div>Loading...</div> : (
              models.length === 0 ? <div className="text-sm text-gray-500">No models loaded</div> : (
                models.map((m: any, i: number) => {
                  // model may be string or object
                  const slug = typeof m === 'string' ? m : (m.slug || m.id || JSON.stringify(m));
                  const name = typeof m === 'object' && m.name ? m.name : undefined;
                  const desc = typeof m === 'object' && m.description ? m.description : undefined;
                  return (
                    <div key={i} className="py-1 border-b">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium truncate">{name || slug}</div>
                          <div className="text-xs text-gray-500 truncate">{slug}</div>
                          {desc && <div className="text-xs text-gray-400">{desc}</div>}
                        </div>
                        <div className="shrink-0">
                          <button onClick={() => addSlug(slug)} className="px-2 py-1 bg-[#0db7ed] text-white rounded">Add</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Audit Log</label>
          <div className="bg-white p-2 rounded border max-h-64 overflow-auto text-xs">
            {audit.length === 0 ? <div className="text-sm text-gray-500">No entries</div> : (
              audit.map((e, i) => (
                <div key={i} className="py-1 border-b">
                  <div className="font-mono text-[11px]">{e.timestamp} · {e.action} · {e.slug || ''}</div>
                  <div className="text-[11px] text-gray-500">{e.client_ip || ''}</div>
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
