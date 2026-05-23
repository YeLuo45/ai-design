import { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';

type VisualDirection = 'editorial' | 'minimal' | 'warm' | 'tech' | 'brutalist';
type SkillType = 'web-prototype' | 'dashboard' | 'mobile-app';
type DeviceFrame = 'iphone' | 'pixel' | 'ipad' | 'macbook' | 'browser';
type PreviewMode = 'light' | 'dark';

interface Artifact {
  id: string;
  content: string;
  skill: SkillType;
  direction: VisualDirection;
  createdAt: Date;
}

interface AgentInfo {
  name: string;
  status: string;
}

interface DaemonStatus {
  status: 'connected' | 'disconnected';
  agents: string[];
  activeAgents: number;
}

const skillDescriptions: Record<SkillType, { name: string; description: string; icon: string }> = {
  'web-prototype': { name: 'Web Prototype', description: 'Create interactive web prototypes', icon: '🌐' },
  'dashboard': { name: 'Dashboard', description: 'Build data visualization dashboards', icon: '📊' },
  'mobile-app': { name: 'Mobile App', description: 'Design mobile app interfaces', icon: '📱' }
};

const visualDirections: Record<VisualDirection, { name: string; description: string }> = {
  editorial: { name: 'Editorial Monocle', description: 'Classic, refined, editorial' },
  minimal: { name: 'Modern Minimal', description: 'Clean, simple, functional' },
  warm: { name: 'Warm Soft', description: 'Cozy, approachable, friendly' },
  tech: { name: 'Tech Utility', description: 'Professional, technical, utility' },
  brutalist: { name: 'Brutalist Experimental', description: 'Bold, raw, unconventional' }
};

const deviceFrames: Record<DeviceFrame, { name: string; width: string; height: string }> = {
  iphone: { name: 'iPhone 15 Pro', width: '393px', height: '852px' },
  pixel: { name: 'Pixel 8', width: '412px', height: '915px' },
  ipad: { name: 'iPad Pro', width: '1024px', height: '1366px' },
  macbook: { name: 'MacBook Pro', width: '1512px', height: '982px' },
  browser: { name: 'Browser Chrome', width: '1440px', height: '900px' }
};

const sampleArtifact = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script><style>body{font-family:Inter,sans-serif;margin:0;padding:20px;background:#f5f5f5}.card{background:white;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.1)}.header{font-size:24px;font-weight:700;margin-bottom:16px;color:#18181b}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}.metric{padding:16px;background:#f4f4f5;border-radius:8px}.metric-value{font-size:32px;font-weight:700;color:#18181b}.metric-label{font-size:14px;color:#71717a}</style></head><body><div class="card"><div class="header">Dashboard Overview</div><div class="grid"><div class="metric"><div class="metric-value">1,234</div><div class="metric-label">Total Users</div></div><div class="metric"><div class="metric-value">$45,678</div><div class="metric-label">Revenue</div></div><div class="metric"><div class="metric-value">89%</div><div class="metric-label">Conversion</div></div><div class="metric"><div class="metric-value">4.9/5</div><div class="metric-label">Rating</div></div></div></div></body></html>`;

function App() {
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<VisualDirection>('minimal');
  const [selectedFrame, setSelectedFrame] = useState<DeviceFrame>('browser');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('light');
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brief, setBrief] = useState('');
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [daemonStatus, setDaemonStatus] = useState<DaemonStatus>({ status: 'disconnected', agents: [], activeAgents: 0 });
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agentOutputs, setAgentOutputs] = useState<{ sessionId: number; name: string; data: string }[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const agentOutputRef = useRef<string[]>([]);

  useEffect(() => {
    const connectDaemon = async () => {
      try {
        const res = await fetch('http://localhost:3001/health');
        if (res.ok) {
          const data = await res.json();
          setDaemonStatus({ status: 'connected', agents: data.agents || [], activeAgents: data.activeAgents || 0 });
        }
      } catch {
        setDaemonStatus({ status: 'disconnected', agents: [], activeAgents: 0 });
      }
    };
    connectDaemon();
    const sse = new EventSource('http://localhost:3001/api/sse');
    sse.onmessage = (e) => { try { const data = JSON.parse(e.data); if (data.type === 'connected') setDaemonStatus(prev => ({ ...prev, agents: data.agents || prev.agents })); } catch {} };
    sse.onerror = () => setDaemonStatus(prev => ({ ...prev, status: 'disconnected' }));
    eventSourceRef.current = sse;
    return () => { eventSourceRef.current?.close(); };
  }, []);

  const handleGenerate = async () => {
    if (!selectedSkill || !brief.trim()) return;
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    const newArtifact: Artifact = { id: Date.now().toString(), content: sampleArtifact, skill: selectedSkill!, direction: selectedDirection, createdAt: new Date() };
    setArtifacts(prev => [...prev, newArtifact]);
    setIsGenerating(false);
    setBrief('');
  };

  const spawnAgent = async (agentName: string) => {
    try {
      const res = await fetch('http://localhost:3001/api/agents/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentName })
      });
      if (res.ok) {
        setSelectedAgent(agentName);
        const reader = res.body?.getReader();
      }
    } catch (e) { console.error('Spawn failed:', e); }
  };

  const stopAgent = async (sessionId: number) => {
    await fetch(`http://localhost:3001/api/agents/stop?sessionId=${sessionId}`, { method: 'POST' });
    setSelectedAgent(null);
  };

  const copyToClipboard = async (artifact: Artifact) => {
    await navigator.clipboard.writeText(artifact.content);
    setCopiedId(artifact.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportHTML = (artifact: Artifact) => {
    const blob = new Blob([artifact.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artifact-${artifact.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportZIP = async (artifactsToExport: Artifact[]) => {
    const zip = new JSZip();
    artifactsToExport.forEach((artifact, i) => zip.file(`artifact-${i + 1}.html`, artifact.content));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artifacts-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentArtifact = artifacts[artifacts.length - 1];
  const previewBg = previewMode === 'dark' ? '#1a1a1a' : '#e4e4e7';

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-zinc-900">AI Design</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">Direction A (Iter 2)</span>
            <div className={`w-3 h-3 rounded-full ${daemonStatus.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-zinc-400">Agents: {daemonStatus.agents.length} | Active: {daemonStatus.activeAgents}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Agent Panel */}
        <section className="mb-6 p-4 bg-zinc-100 rounded-xl">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-zinc-700">Agents:</span>
            {daemonStatus.agents.length > 0 ? daemonStatus.agents.map(agent => (
              <button key={agent} onClick={() => spawnAgent(agent)}
                className={`px-3 py-1 text-sm rounded-lg border transition-all ${selectedAgent === agent ? 'border-green-500 bg-green-100' : 'border-zinc-200 bg-white hover:bg-zinc-50'}`}>
                {agent} {selectedAgent === agent ? '●' : ''}
              </button>
            )) : <span className="text-sm text-zinc-500">No agents detected</span>}
            {selectedAgent && <button onClick={() => stopAgent(0)} className="px-3 py-1 text-sm rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100">Stop</button>}
          </div>
        </section>

        {/* Skill Selector */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Select Skill</h2>
          <div className="grid grid-cols-3 gap-4">
            {(Object.keys(skillDescriptions) as SkillType[]).map(skill => (
              <button key={skill} onClick={() => setSelectedSkill(skill)}
                className={`p-6 rounded-xl border-2 transition-all text-left ${selectedSkill === skill ? 'border-blue-500 bg-blue-50' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}>
                <span className="text-3xl mb-3 block">{skillDescriptions[skill].icon}</span>
                <h3 className="font-semibold text-zinc-900">{skillDescriptions[skill].name}</h3>
                <p className="text-sm text-zinc-500 mt-1">{skillDescriptions[skill].description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Visual Direction */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Visual Direction</h2>
          <div className="flex gap-3 flex-wrap">
            {(Object.keys(visualDirections) as VisualDirection[]).map(dir => (
              <button key={dir} onClick={() => setSelectedDirection(dir)}
                className={`px-4 py-2 rounded-lg border transition-all ${selectedDirection === dir ? 'border-blue-500 bg-blue-500 text-white' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'}`}>
                {visualDirections[dir].name}
              </button>
            ))}
          </div>
        </section>

        {/* Brief Input */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Design Brief</h2>
          <textarea value={brief} onChange={e => setBrief(e.target.value)} placeholder="Describe your design requirements..."
            className="w-full h-32 p-4 border border-zinc-200 rounded-xl bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={handleGenerate} disabled={!selectedSkill || !brief.trim() || isGenerating}
            className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isGenerating ? 'Generating...' : 'Generate Design'}
          </button>
        </section>

        {/* Preview */}
        {currentArtifact && (
          <section>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">Preview</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setPreviewMode(m => m === 'light' ? 'dark' : 'light')} className="px-3 py-1 text-sm rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100">
                  {previewMode === 'light' ? '🌙' : '☀️'}
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => setZoom(z => Math.max(50, z - 25))} className="px-2 py-1 text-sm rounded border border-zinc-200 bg-white">-</button>
                  <span className="text-sm text-zinc-600 w-12 text-center">{zoom}%</span>
                  <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="px-2 py-1 text-sm rounded border border-zinc-200 bg-white">+</button>
                </div>
                {(Object.keys(deviceFrames) as DeviceFrame[]).map(frame => (
                  <button key={frame} onClick={() => setSelectedFrame(frame)}
                    className={`px-3 py-1 text-sm rounded-lg border transition-all ${selectedFrame === frame ? 'border-blue-500 bg-blue-500 text-white' : 'border-zinc-200 bg-white text-zinc-700'}`}>
                    {deviceFrames[frame].name}
                  </button>
                ))}
                <div className="relative">
                  <button onClick={() => setShowExportMenu(m => !m)} className="px-3 py-1 text-sm rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100">📦 Export</button>
                  {showExportMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 min-w-40">
                      <button onClick={() => { exportHTML(currentArtifact); setShowExportMenu(false); }} className="block w-full px-4 py-2 text-sm text-left hover:bg-zinc-100 rounded-lg">HTML</button>
                      <button onClick={() => { exportZIP(artifacts); setShowExportMenu(false); }} className="block w-full px-4 py-2 text-sm text-left hover:bg-zinc-100 rounded-lg">ZIP (All)</button>
                      <button onClick={() => { copyToClipboard(currentArtifact); setShowExportMenu(false); }} className="block w-full px-4 py-2 text-sm text-left hover:bg-zinc-100 rounded-lg">{copiedId === currentArtifact.id ? '✓ Copied!' : '📋 Copy Code'}</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-center p-8 rounded-xl overflow-auto" style={{ background: previewBg }}>
              <div className="bg-white rounded-lg shadow-2xl" style={{ width: deviceFrames[selectedFrame].width, height: deviceFrames[selectedFrame].height, maxWidth: '100%', transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
                <iframe srcDoc={currentArtifact.content} className="w-full h-full border-0 rounded-lg" sandbox="allow-scripts" title="Preview" />
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;