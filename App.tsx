
import React, { useState, useRef, useEffect } from 'react';
import { AgentID, Message, SharedMemory, WorkflowState, HistoricalRecord } from './types';
import { AGENTS, SYSTEM_DISCLAIMER } from './constants';
import { runAgent } from './services/geminiService';

const SAMPLE_HISTORY: HistoricalRecord[] = [
  {
    id: 'h1',
    season: 'Spring 2023',
    cropType: 'Tomato',
    issue: 'Early Blight symptoms on lower leaves.',
    intervention: 'Copper-based fungicide application and improved air circulation.',
    outcome: 'successful',
    notes: 'Infection halted; yield was 95% of expected.',
    timestamp: Date.now() - 31536000000
  },
  {
    id: 'h2',
    season: 'Summer 2023',
    cropType: 'Corn',
    issue: 'Nitrogen deficiency in low-lying area.',
    intervention: 'Targeted top-dressing with urea.',
    outcome: 'partial',
    notes: 'Heavy rains washed away some fertilizer shortly after application.',
    timestamp: Date.now() - 15768000000
  }
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [memory, setMemory] = useState<SharedMemory>({
    farmerProfile: {},
    observedSymptoms: [],
    environmentalFactors: '',
    history: SAMPLE_HISTORY,
    intermediateFindings: [],
    humanApprovals: [],
    status: 'idle'
  });
  const [workflow, setWorkflow] = useState<WorkflowState>({
    activeAgent: null,
    logs: []
  });
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'workflow' | 'history'>('workflow');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, workflow.logs]);

  const addLog = (agentId: AgentID, text: string, type: 'info' | 'decision' | 'warning' = 'info') => {
    setWorkflow(prev => ({
      ...prev,
      logs: [...prev.logs, { id: Date.now().toString(), agentId, text, type }]
    }));
  };

  const addMessage = (role: Message['role'], content: string, agentId?: AgentID, isApproval?: boolean) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role,
      content,
      agentId,
      timestamp: Date.now(),
      isApprovalRequired: isApproval
    }]);
  };

  const updateMemory = (update: Partial<SharedMemory>) => {
    setMemory(prev => ({ ...prev, ...update }));
  };

  const archiveRecommendation = (content: string, status: 'successful' | 'unsuccessful' | 'partial' = 'successful') => {
    const newRecord: HistoricalRecord = {
      id: `h-${Date.now()}`,
      season: memory.farmerProfile.season || 'Current',
      cropType: memory.farmerProfile.cropType || 'Various',
      issue: memory.observedSymptoms.join(', ') || 'Consultation',
      intervention: 'AI System Recommendation',
      outcome: status,
      notes: content.slice(0, 100) + '...',
      timestamp: Date.now()
    };
    setMemory(prev => ({
      ...prev,
      history: [newRecord, ...prev.history]
    }));
  };

  const runMAS = async (query: string) => {
    setIsProcessing(true);
    let currentMemory = { ...memory };
    
    // 1. Intake
    setWorkflow(prev => ({ ...prev, activeAgent: 'intake' }));
    addLog('intake', 'Processing user input and cross-referencing with historical module...');
    const intakeResult = await runAgent('intake', currentMemory, query);
    addLog('intake', 'Context extracted. Past recurring patterns checked.');
    
    currentMemory = {
      ...currentMemory,
      environmentalFactors: intakeResult || '',
      status: 'analyzing'
    };
    updateMemory(currentMemory);

    // 2. Specialized Analysis (Parallel simulation)
    const analysisAgents: AgentID[] = ['agronomy', 'pest-disease', 'weather'];
    const findings: typeof currentMemory.intermediateFindings = [];

    for (const agentId of analysisAgents) {
      setWorkflow(prev => ({ ...prev, activeAgent: agentId }));
      addLog(agentId, `Analyzing ${agentId} factors based on current state and historical trends...`);
      const result = await runAgent(agentId, currentMemory);
      findings.push({ agentId, finding: result || '', timestamp: Date.now() });
    }
    
    currentMemory = { ...currentMemory, intermediateFindings: findings };
    updateMemory(currentMemory);

    // 3. Synthesis
    setWorkflow(prev => ({ ...prev, activeAgent: 'synthesizer' }));
    addLog('synthesizer', 'Synthesizing recommendations with a preference for historically successful methods...');
    const synthesisResult = await runAgent('synthesizer', currentMemory);
    
    // 4. Quality Review
    setWorkflow(prev => ({ ...prev, activeAgent: 'quality-review' }));
    addLog('quality-review', 'Ensuring recommendations avoid previous historical failure points...');
    const reviewResult = await runAgent('quality-review', currentMemory);
    
    // Final Decision by Supervisor
    setWorkflow(prev => ({ ...prev, activeAgent: 'supervisor' }));
    addLog('supervisor', 'Final verification. Integrating historical insights with modern risk analysis.');
    
    const supervisorJson = await runAgent('supervisor', {
      ...currentMemory,
      finalRecommendations: `${synthesisResult}\n\n### Review Findings:\n${reviewResult}`
    });
    
    let supervisorDecision;
    try {
      supervisorDecision = JSON.parse(supervisorJson || '{}');
    } catch {
      supervisorDecision = { request_human: true };
    }

    if (supervisorDecision.request_human) {
      addLog('supervisor', 'DANGER: High-risk treatments or significant historical conflicts detected.', 'warning');
      addMessage('agent', synthesisResult || '', 'synthesizer', true);
    } else {
      addMessage('agent', synthesisResult || '', 'synthesizer', false);
      addMessage('system', SYSTEM_DISCLAIMER);
      archiveRecommendation(synthesisResult || '');
    }

    setWorkflow(prev => ({ ...prev, activeAgent: null }));
    setIsProcessing(false);
  };

  const handleSend = () => {
    if (!input.trim() || isProcessing) return;
    addMessage('user', input);
    const query = input;
    setInput('');
    runMAS(query);
  };

  const handleApproval = (approved: boolean) => {
    addMessage('user', approved ? "Approved. Proceed with recommendation." : "Denied. Revise plan.");
    if (approved) {
      addMessage('system', "Human override confirmed. Recommendation archived in historical records.");
      const lastAgentMsg = messages.filter(m => m.role === 'agent').pop();
      if (lastAgentMsg) archiveRecommendation(lastAgentMsg.content);
      addMessage('system', SYSTEM_DISCLAIMER);
    } else {
      addMessage('system', "Recommendation halted. Adjusting MAS focus based on human refusal.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Sidebar: Memory, Workflow & History */}
      <aside className="w-80 border-r bg-white flex flex-col shadow-sm">
        <div className="p-4 border-b flex items-center gap-2 bg-emerald-700 text-white">
          <span className="text-2xl">🚜</span>
          <h1 className="font-bold text-lg tracking-tight">AgriMind MAS</h1>
        </div>

        <div className="flex border-b text-[11px] font-bold uppercase tracking-wider">
          <button 
            onClick={() => setActiveTab('workflow')}
            className={`flex-1 py-3 transition-colors ${activeTab === 'workflow' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Workflow
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 transition-colors ${activeTab === 'history' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}
          >
            History Module
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeTab === 'workflow' ? (
            <>
              <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Workflow State</h2>
                <div className="space-y-2">
                  {Object.values(AGENTS).map(agent => (
                    <div 
                      key={agent.id}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                        workflow.activeAgent === agent.id ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'opacity-60'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${agent.color} text-white`}>
                        {agent.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{agent.name}</p>
                        {workflow.activeAgent === agent.id && (
                          <span className="text-[10px] text-emerald-600 font-bold animate-pulse uppercase">Active</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">System Logs</h2>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {workflow.logs.map(log => (
                    <div key={log.id} className="text-[11px] leading-relaxed border-l-2 border-gray-100 pl-2">
                      <span className="font-bold text-gray-400">[{AGENTS[log.agentId].name}]</span>{' '}
                      <span className={log.type === 'warning' ? 'text-red-600' : 'text-gray-600'}>{log.text}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Memory Map</h2>
                <div className="bg-gray-50 p-3 rounded-lg border text-[10px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {JSON.stringify({ ...memory, history: `${memory.history.length} records` }, null, 2)}
                </div>
              </section>
            </>
          ) : (
            <section className="space-y-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Farm History Archive</h2>
              <div className="space-y-3">
                {memory.history.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No historical records found for this profile.</p>
                )}
                {memory.history.map(record => (
                  <div key={record.id} className="p-3 bg-white border rounded-xl shadow-sm text-xs space-y-1 hover:border-emerald-200 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-emerald-800">{record.season} • {record.cropType}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                        record.outcome === 'successful' ? 'bg-emerald-100 text-emerald-700' : 
                        record.outcome === 'unsuccessful' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {record.outcome}
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-2"><span className="font-semibold text-gray-800">Issue:</span> {record.issue}</p>
                    <p className="text-gray-500 italic text-[10px]">{record.notes}</p>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <p className="text-[10px] text-blue-700 leading-normal">
                  💡 Agents automatically query these records to identify recurring pest cycles and successful nutrient strategies.
                </p>
              </div>
            </section>
          )}
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col relative">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
              <div className="bg-emerald-100 p-4 rounded-full mb-4">
                <span className="text-4xl">🌾</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Agricultural Decision Support</h2>
              <p className="text-gray-600 mt-2">
                Ask about crop health, soil conditions, or weather risks. Our MAS now features a <span className="text-emerald-700 font-bold">Historical Data Module</span> for long-term trend analysis.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3 w-full">
                <button 
                  onClick={() => setInput("The yellow spots on my tomatoes are back this year. It looks like what happened last spring.")}
                  className="text-xs bg-white p-3 rounded-xl border hover:border-emerald-300 hover:shadow-sm transition-all text-left"
                >
                  "Tomato spots are back..."
                </button>
                <button 
                  onClick={() => setInput("Plan a nutrient strategy for wheat, keeping in mind last year's nitrogen washout issues.")}
                  className="text-xs bg-white p-3 rounded-xl border hover:border-emerald-300 hover:shadow-sm transition-all text-left"
                >
                  "Wheat nutrient strategy..."
                </button>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white' 
                  : msg.role === 'system' 
                    ? 'bg-amber-50 border border-amber-200 text-amber-800' 
                    : 'bg-white border text-gray-800'
              }`}>
                {msg.agentId && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 font-bold uppercase tracking-wider text-gray-500 border">
                      {AGENTS[msg.agentId].name}
                    </span>
                    {msg.content.toLowerCase().includes('historical') && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold uppercase tracking-tighter">
                        History Matched
                      </span>
                    )}
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
                
                {msg.isApprovalRequired && (
                  <div className="mt-4 pt-4 border-t flex flex-col gap-3">
                    <p className="text-xs font-bold text-red-600 uppercase flex items-center gap-2">
                      <span className="text-lg">⚠️</span> Human Approval Required
                    </p>
                    <p className="text-xs text-gray-600 italic">
                      This plan involves significant costs or risky chemical treatments. Does history support this?
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApproval(true)}
                        className="flex-1 bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Approve Action
                      </button>
                      <button 
                        onClick={() => handleApproval(false)}
                        className="flex-1 bg-white border-2 border-red-100 text-red-600 text-xs font-bold py-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Request Revision
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white border rounded-2xl p-4 flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-xs font-medium text-gray-500 italic">Analyzing historical records & current symptoms...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Query the MAS (e.g., 'Check if this pest matches last year's outbreak')..."
              className="flex-1 bg-gray-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              disabled={isProcessing}
            />
            <button 
              onClick={handleSend}
              disabled={isProcessing || !input.trim()}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              Consult Team 🌾
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-400 mt-2 uppercase tracking-widest">
            Historical Data Engine Enabled • Academic Multi-Agent System
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;
