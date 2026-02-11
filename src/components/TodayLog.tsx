'use client';

import type { DailyLog } from '@/types';

interface TodayLogProps {
    logs: DailyLog[];
}

function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function TodayLog({ logs }: TodayLogProps) {
    if (logs.length === 0) {
        return (
            <div className="today-log glass-card">
                <h3 className="today-log-title">&#x1F4CA; Today&apos;s Log</h3>
                <p className="today-log-empty">Abhi tak koi jaap nahi hua</p>
            </div>
        );
    }

    return (
        <div className="today-log glass-card">
            <h3 className="today-log-title">&#x1F4CA; Today&apos;s Log</h3>
            <div className="today-log-list">
                {logs.slice(0, 15).map((log, index) => (
                    <div key={index} className="today-log-item" style={{ animationDelay: `${index * 0.05}s` }}>
                        <span className={`log-type ${log.type === 'click' ? 'log-type-click' : 'log-type-manual'}`}>
                            {log.type === 'click' ? 'Click' : 'Manual'}
                        </span>
                        <span className="log-count">+{log.count.toLocaleString('en-IN')}</span>
                        <span className="log-time">{formatTime(log.timestamp)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
