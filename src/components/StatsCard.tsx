'use client';

import { Hash, Flower, Flame } from 'lucide-react';

interface StatsCardProps {
    dailyCount: number;
    totalJaap: number;
    streak: number;
}

function formatNumber(num: number): string {
    return num.toLocaleString('en-IN');
}

export default function StatsCard({ dailyCount, totalJaap, streak }: StatsCardProps) {
    return (
        <div className="stats-card glass-card">
            <div className="stat-item">
                <div className="stat-icon stat-icon-daily">
                    <Hash size={20} />
                </div>
                <div className="stat-info">
                    <span className="stat-label">Aaj ke Jaap</span>
                    <span className="stat-value">{formatNumber(dailyCount)}</span>
                </div>
            </div>

            <div className="stat-divider" />

            <div className="stat-item">
                <div className="stat-icon stat-icon-total">
                    <Flower size={20} />
                </div>
                <div className="stat-info">
                    <span className="stat-label">Total Jaap</span>
                    <span className="stat-value">{formatNumber(totalJaap)}</span>
                </div>
            </div>

            <div className="stat-divider" />

            <div className="stat-item">
                <div className="stat-icon stat-icon-streak">
                    <Flame size={20} />
                </div>
                <div className="stat-info">
                    <span className="stat-label">Streak</span>
                    <span className="stat-value">{streak} Days</span>
                </div>
            </div>
        </div>
    );
}
