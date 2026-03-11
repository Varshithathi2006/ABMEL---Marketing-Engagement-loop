import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaignStore } from '../store/useCampaignStore';
import { Loader2, CheckCircle2, Circle, AlertTriangle, FileText, Bot } from 'lucide-react';
import type { TaskNode } from '../types/graph';
import { motion } from 'framer-motion';

export const AgentExecutionView = () => {
    const { graph, status, logs, creatives } = useCampaignStore();

    // --- DEBUG OVERLAY (REMOVE IN PROD) ---
    const debugOverlay = (
        <div className="fixed top-20 right-4 p-4 bg-black/90 text-green-400 font-mono text-xs z-50 rounded shadow-2xl border border-green-500/30 opacity-80 hover:opacity-100 transition-opacity">
            <h3 className="font-bold border-b border-green-500/50 mb-2 pb-1 text-white">DEBUG STATE</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-slate-400">Status:</span>
                <span className={status === 'CREATIVES_READY' ? 'text-yellow-400 font-bold' : 'text-white'}>{status}</span>

                <span className="text-slate-400">Creatives:</span>
                <span className={(creatives?.length || 0) === 5 ? 'text-green-400 font-bold' : 'text-red-400'}>{creatives?.length || 0}</span>

                <span className="text-slate-400">Graph Nodes:</span>
                <span>{graph ? Object.keys(graph.nodes).length : 'null'}</span>

                <span className="text-slate-400">Last Log:</span>
                <span className="col-span-2 text-slate-500 truncate max-w-[200px]" title={logs[logs.length - 1]}>{logs[logs.length - 1] || 'None'}</span>
            </div>
            <button
                onClick={() => useCampaignStore.setState({ status: 'CREATIVES_READY', creatives: [{ id: '1', headline: 'FORCE MOCK', rationale: 'Debug', platform: 'Debug', body: 'Debug' }] })}
                className="mt-3 w-full bg-red-900/50 hover:bg-red-700 text-white py-1 px-2 rounded text-[10px]"
            >
                FORCE FORCE STATE
            </button>
        </div>
    );

    // If data is initializing, show loader
    if (!graph && status === 'running') {
        return (
            <>
                {debugOverlay}
                <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                    <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-500" />
                    <p>Initializing Agents...</p>
                </div>
            </>
        );
    }

    // If failed, show error
    if (status === 'failed') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
                <AlertTriangle className="w-16 h-16 mb-4 text-red-500" />
                <h3 className="text-xl font-bold text-slate-200 mb-2">Refinement Needed</h3>
                <p className="max-w-md text-center text-slate-400 mb-6">
                    {logs[logs.length - 1] || "The agents encountered a blocker. Please adjust your inputs or try again."}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                >
                    Retry Execution
                </button>
            </div>
        );
    }

    // Safety fallback
    if (!graph) return (
        <>
            {debugOverlay}
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-500" />
                <p>Waiting for State...</p>
            </div>
        </>
    );

    // Sort nodes roughly by dependency depth (simplified for visual flow)
    // In a real DAG visualizer we'd use a layout library like Dagre
    const layers = [
        ['planning'],
        ['market_research'],
        ['persona_modeling'],
        ['creative_generation'],
        ['evaluation_ctr', 'evaluation_mem', 'evaluation_brand'],
        ['decision'],
        ['guardrails'],
        ['learning']
    ];

    // --------------------------------------------------------------------------------
    // TERMINAL STATE: CREATIVES READY (Single Source of Truth)
    // --------------------------------------------------------------------------------
    // We check creatives.length directly to be resilient against status race conditions
    // --------------------------------------------------------------------------------
    // TERMINAL STATE: CREATIVES READY (Navigation Handoff)
    // --------------------------------------------------------------------------------
    const navigate = useNavigate();

    useEffect(() => {
        if (creatives && creatives.length > 0 && graph?.context?.campaignId) {
            // slightly delayed to allow user to see "Complete" state
            const timer = setTimeout(() => {
                console.log("Creatives Ready. Navigating to results...");
                navigate(`/campaigns/${graph.context.campaignId}/creatives`);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [creatives, graph, navigate]);

    if ((creatives && creatives.length > 0) || status === 'CREATIVES_READY') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 animate-in fade-in">
                <CheckCircle2 className="w-16 h-16 mb-4 text-green-500" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Optimization Complete</h3>
                <p className="text-slate-500 mb-4">Redirecting to results...</p>
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />

                {/* Fallback Manual Button as requested (though auto-redirect is primary) */}
                {/* "The user must see: All 5 creatives immediately" - Wait, user said immediately show creatives on NEW PAGE. 
                     So this intermediate loading state is fine as long as it's fast. */}
                {graph?.context?.campaignId && (
                    <button
                        onClick={() => navigate(`/campaigns/${graph.context.campaignId}/creatives`)}
                        className="mt-4 text-xs underline text-slate-400 hover:text-blue-500"
                    >
                        Click if not redirected
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
            {debugOverlay}
            {/* Left Col: Pipeline Visualizer */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                        <Bot className="w-5 h-5 text-blue-600 animate-pulse" />
                        Live Agent Execution Stream
                        <span className="flex h-2 w-2 relative ml-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-700`}>
                        {status}
                    </span>
                </div>

                <div className="space-y-8 relative flex flex-col items-center py-8">
                    {/* Connecting Line (Centered) */}
                    <div className="absolute left-1/2 top-4 bottom-4 w-px bg-slate-200 -z-10 -translate-x-1/2"></div>

                    {layers.map((layer, idx) => (
                        <div key={idx} className="relative w-full flex justify-center">
                            <div className="flex items-center justify-center gap-4 flex-wrap max-w-2xl px-4">
                                {layer.map(nodeId => {
                                    // SAFETY CHECK: Ensure graph and nodes exist
                                    const node = graph?.nodes?.[nodeId];
                                    if (!node) return null;
                                    return <NodeCard key={nodeId} node={node} />;
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Col: Live Logs & Output Preview */}
            <div className="flex flex-col gap-6 h-full">
                {/* Logs Console */}
                <div className="bg-slate-900 text-slate-300 rounded-xl p-4 font-mono text-xs h-full overflow-y-auto shadow-sm">
                    <div className="text-slate-500 mb-2 border-b border-slate-800 pb-2">Create_System_Logs</div>
                    <div className="space-y-1">
                        {logs.map((log, i) => (
                            <div key={i} className="break-all opacity-80 hover:opacity-100 transition-opacity">
                                <span className="text-blue-500 mr-2">{'>'}</span>
                                {log.split(']').pop()?.trim()}
                            </div>
                        ))}
                        {status === 'running' && (
                            <div className="animate-pulse text-blue-500 pt-2">_ Processing...</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const NodeStatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        case 'running': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
        case 'failed': return <AlertTriangle className="w-5 h-5 text-red-500" />;
        default: return <Circle className="w-5 h-5 text-slate-300" />;
    }
};

const NodeCard = ({ node }: { node: TaskNode }) => {
    const isActive = node.status === 'running';

    return (
        <motion.div
            initial={{ opacity: 0.5, scale: 0.95 }}
            animate={{
                opacity: node.status === 'idle' ? 0.5 : 1,
                scale: 1,
                borderColor: isActive ? 'rgb(59, 130, 246)' : 'rgb(226, 232, 240)'
            }}
            className={`
                bg-white p-4 rounded-lg border shadow-sm w-64 min-w-[250px]
                ${isActive ? 'ring-2 ring-blue-100' : ''}
                transition-all duration-300
            `}
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {node.agentName.replace('Agent', '')}
                </span>
                <NodeStatusIcon status={node.status} />
            </div>
            <div className="text-sm font-medium text-slate-900 mb-1 capitalize">
                {node.id.replace('_', ' ')}
            </div>

            {/* Context/Output Preview Snippet */}
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 bg-slate-50 p-2 rounded">
                <div className="flex items-center gap-1 mb-1 text-slate-400">
                    <FileText size={10} />
                    <span>Output</span>
                </div>
                {/* Heuristic to show relevant data string SAFE SUBSTRING */}
                <div className="truncate">
                    {String(Object.values(node.result || {})[0] || "").substring(0, 30)}...
                </div>
            </div>
        </motion.div>
    );
}
