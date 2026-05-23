import { useState } from 'react';

// Visual Direction Types
type VisualDirection = 'editorial' | 'minimal' | 'warm' | 'tech' | 'brutalist';

// Skill Types
type SkillType = 'web-prototype' | 'dashboard' | 'mobile-app';

// Device Frame Types
type DeviceFrame = 'iphone' | 'pixel' | 'ipad' | 'macbook' | 'browser';

interface Artifact {
  id: string;
  content: string;
  skill: SkillType;
  direction: VisualDirection;
  createdAt: Date;
}

interface TaskProgress {
  id: string;
  skill: SkillType;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message: string;
}

const skillDescriptions: Record<SkillType, { name: string; description: string; icon: string }> = {
  'web-prototype': {
    name: 'Web Prototype',
    description: 'Create interactive web prototypes with responsive layouts',
    icon: '🌐'
  },
  'dashboard': {
    name: 'Dashboard',
    description: 'Build data visualization dashboards and admin panels',
    icon: '📊'
  },
  'mobile-app': {
    name: 'Mobile App',
    description: 'Design mobile app interfaces with device frames',
    icon: '📱'
  }
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

// Sample artifact content
const sampleArtifact = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #18181b; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .metric { padding: 16px; background: #f4f4f5; border-radius: 8px; }
    .metric-value { font-size: 32px; font-weight: 700; color: #18181b; }
    .metric-label { font-size: 14px; color: #71717a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">Dashboard Overview</div>
    <div class="grid">
      <div class="metric">
        <div class="metric-value">1,234</div>
        <div class="metric-label">Total Users</div>
      </div>
      <div class="metric">
        <div class="metric-value">$45,678</div>
        <div class="metric-label">Revenue</div>
      </div>
      <div class="metric">
        <div class="metric-value">89%</div>
        <div class="metric-label">Conversion</div>
      </div>
      <div class="metric">
        <div class="metric-value">4.9/5</div>
        <div class="metric-label">Rating</div>
      </div>
    </div>
  </div>
</body>
</html>`;

function App() {
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<VisualDirection>('minimal');
  const [selectedFrame, setSelectedFrame] = useState<DeviceFrame>('browser');
  const [brief, setBrief] = useState('');
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [tasks, setTasks] = useState<TaskProgress[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedSkill || !brief.trim()) return;

    const taskId = Date.now().toString();
    const newTask: TaskProgress = {
      id: taskId,
      skill: selectedSkill,
      status: 'in_progress',
      message: 'Initializing design process...'
    };
    setTasks(prev => [...prev, newTask]);

    // Simulate SSE progress
    const messages = [
      'Analyzing requirements...',
      'Creating component structure...',
      'Applying visual direction...',
      'Generating artifact...',
      'Finalizing preview...'
    ];

    setIsGenerating(true);
    let msgIndex = 0;

    const interval = setInterval(() => {
      if (msgIndex < messages.length) {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, message: messages[msgIndex] } : t
        ));
        msgIndex++;
      } else {
        clearInterval(interval);
        
        // Create artifact
        const newArtifact: Artifact = {
          id: Date.now().toString(),
          content: sampleArtifact,
          skill: selectedSkill,
          direction: selectedDirection,
          createdAt: new Date()
        };
        setArtifacts(prev => [...prev, newArtifact]);
        
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status: 'completed', message: 'Complete!' } : t
        ));
        setIsGenerating(false);
        setBrief('');
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-zinc-900">AI Design</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">Direction A</span>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Skill Selector */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Select Skill</h2>
          <div className="grid grid-cols-3 gap-4">
            {(Object.keys(skillDescriptions) as SkillType[]).map(skill => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(skill)}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  selectedSkill === skill
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <span className="text-3xl mb-3 block">{skillDescriptions[skill].icon}</span>
                <h3 className="font-semibold text-zinc-900">{skillDescriptions[skill].name}</h3>
                <p className="text-sm text-zinc-500 mt-1">{skillDescriptions[skill].description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Visual Direction Selector */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Visual Direction</h2>
          <div className="flex gap-3">
            {(Object.keys(visualDirections) as VisualDirection[]).map(dir => (
              <button
                key={dir}
                onClick={() => setSelectedDirection(dir)}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  selectedDirection === dir
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                }`}
              >
                {visualDirections[dir].name}
              </button>
            ))}
          </div>
        </section>

        {/* Brief Input */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Design Brief</h2>
          <textarea
            value={brief}
            onChange={e => setBrief(e.target.value)}
            placeholder="Describe your design requirements..."
            className="w-full h-32 p-4 border border-zinc-200 rounded-xl bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleGenerate}
            disabled={!selectedSkill || !brief.trim() || isGenerating}
            className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Generate Design'}
          </button>
        </section>

        {/* Task Progress */}
        {tasks.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Progress</h2>
            <div className="space-y-2">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border ${
                    task.status === 'completed'
                      ? 'bg-green-50 border-green-200'
                      : task.status === 'failed'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{skillDescriptions[task.skill].icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-zinc-900">{task.message}</p>
                      <p className="text-sm text-zinc-500">{skillDescriptions[task.skill].name}</p>
                    </div>
                    <span className={`text-sm font-medium ${
                      task.status === 'completed' ? 'text-green-600' :
                      task.status === 'failed' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {task.status === 'in_progress' ? 'In Progress...' : task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Artifact Preview */}
        {artifacts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">Preview</h2>
              <div className="flex gap-2">
                {(Object.keys(deviceFrames) as DeviceFrame[]).map(frame => (
                  <button
                    key={frame}
                    onClick={() => setSelectedFrame(frame)}
                    className={`px-3 py-1 text-sm rounded-lg border transition-all ${
                      selectedFrame === frame
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700'
                    }`}
                  >
                    {deviceFrames[frame].name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center bg-zinc-200 p-8 rounded-xl overflow-auto">
              <div
                className="bg-white rounded-lg shadow-2xl transition-all"
                style={{
                  width: deviceFrames[selectedFrame].width,
                  height: deviceFrames[selectedFrame].height,
                  maxWidth: '100%'
                }}
              >
                <iframe
                  srcDoc={artifacts[artifacts.length - 1].content}
                  className="w-full h-full border-0 rounded-lg"
                  sandbox="allow-scripts"
                  title="Design Preview"
                />
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;