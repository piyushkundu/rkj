'use client';

import { Target } from 'lucide-react';

interface ProgressBarProps {
    current: number;
    target: number;
}

export default function ProgressBar({ current, target }: ProgressBarProps) {
    const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
    const isComplete = percentage >= 100;

    return (
        <div className="progress-section glass-card">
            <div className="progress-header">
                <div className="progress-label">
                    <Target size={18} />
                    <span>Aaj ka Target: {target.toLocaleString('en-IN')}</span>
                </div>
                <span className={`progress-percent ${isComplete ? 'progress-complete' : ''}`}>
                    {percentage}%
                </span>
            </div>

            <div className="progress-bar-track">
                <div
                    className={`progress-bar-fill ${isComplete ? 'progress-bar-complete' : ''}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {isComplete && (
                <div className="progress-celebration">
                    &#x1F389; Target poora ho gaya! Radhe Radhe! &#x1F338;
                </div>
            )}
        </div>
    );
}
