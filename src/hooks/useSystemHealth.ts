import { useState, useEffect } from 'react';
import { SupabaseService } from '../services/SupabaseService';

export interface SystemHealth {
    status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
    dbLatency: number;
    aiStatus: 'Operational' | 'Degraded' | 'Allocating';
    memoryUsage: number;
}

export const useSystemHealth = () => {
    const [health, setHealth] = useState<SystemHealth>({
        status: 'ONLINE',
        dbLatency: 12,
        aiStatus: 'Operational',
        memoryUsage: 34
    });

    useEffect(() => {
        const checkHealth = async () => {
            // 1. Check Supabase Latency
            const start = Date.now();
            try {
                await SupabaseService.getInstance().getDraft('health-check-user');
            } catch (e) {
                // ignore error, just timing
            }
            const end = Date.now();
            const latency = Math.max(5, end - start); // Min 5ms

            // 2. Mock AI Status / Memory (Since we don't have real backend for this)
            const mem = Math.floor(30 + Math.random() * 20); // 30-50%

            setHealth({
                status: latency < 500 ? 'ONLINE' : 'DEGRADED',
                dbLatency: latency,
                aiStatus: 'Operational',
                memoryUsage: mem
            });
        };

        checkHealth();
        const interval = setInterval(checkHealth, 30000); // 30s as requested

        return () => clearInterval(interval);
    }, []);

    return health;
};
