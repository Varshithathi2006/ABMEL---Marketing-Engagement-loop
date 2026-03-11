import type { AgentStatus } from './abmel';

export interface TaskNode {
    id: string;
    agentName: string;
    dependencies: string[]; // IDs of tasks that must complete first
    status: AgentStatus;
    inputContextKeys: string[];
    outputContextKeys: string[];
    result?: any;
}

export interface TaskGraph {
    nodes: Record<string, TaskNode>;
    context: Record<string, any>; // Shared blackboard for data exchange
}

export type GraphState = TaskGraph;

export type GraphEventType = 'node_start' | 'node_complete' | 'node_fail' | 'graph_complete' | 'node_reset' | 'WORKFLOW_COMPLETED';

export interface GraphEvent {
    type: GraphEventType;
    nodeId?: string;
    stage?: string;
    data?: any;
    timestamp: string;
}
