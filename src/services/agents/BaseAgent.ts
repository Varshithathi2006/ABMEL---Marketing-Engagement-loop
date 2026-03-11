import type { AgentStatus, AgentResult } from '../../types/abmel';

export abstract class BaseAgent {
    public name: string;
    public status: AgentStatus = 'idle';
    protected logs: string[] = [];

    constructor(name: string) {
        this.name = name;
    }

    abstract execute(input: any): Promise<AgentResult>;

    protected log(message: string) {
        const timestamp = new Date().toISOString();
        const entry = `[${timestamp}] [${this.name}] ${message}`;
        this.logs.push(entry);
        console.log(entry); // In a real app, this might go to a centralized logger
    }

    public getLogs(): string[] {
        return this.logs;
    }
}
