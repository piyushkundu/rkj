'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import UserSelectModal from '@/components/UserSelectModal';
import { useUser } from '@/hooks/useUser';
import { getHistory } from '@/lib/jaapService';
import type { DailySummary } from '@/types';

type FilterType = 'today' | 'week' | 'month' | 'all';

export default function HistoryPage() {
    const { user, selectUser, logout } = useUser();
    const [history, setHistory] = useState<DailySummary[]>([]);
    const [filter, setFilter] = useState<FilterType>('all');
    const [isLoading, setIsLoading] = useState(true);

    const loadHistory = useCallback(async () => {
        if (!user.userId) return;
        setIsLoading(true);
        try {
            const data = await getHistory(user.userId, filter);
            setHistory(data);
        } catch (error) {
            console.error('Error loading history:', error);
        }
        setIsLoading(false);
    }, [user.userId, filter]);

    useEffect(() => {
        if (user.isSelected) {
            loadHistory();
        }
    }, [user.isSelected, loadHistory]);

    if (!user.isSelected) {
        return <UserSelectModal onSelect={selectUser} />;
    }

    const filters: { label: string; value: FilterType }[] = [
        { label: 'Today', value: 'today' },
        { label: 'This Week', value: 'week' },
        { label: 'This Month', value: 'month' },
        { label: 'All Time', value: 'all' },
    ];

    function formatDate(dateStr: string): string {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }

    const totalAll = history.reduce((sum, h) => sum + h.totalCount, 0);

    return (
        <div className="app-container">
            <Header displayName={user.displayName} onLogout={logout} />

            <div className="page-container">
                <h2 className="page-title">
                    <span>&#x1F4CA;</span> Jaap History
                </h2>

                {/* Filter Tabs */}
                <div className="filter-tabs">
                    {filters.map((f) => (
                        <button
                            key={f.value}
                            className={`filter-tab ${filter === f.value ? 'filter-tab-active' : ''}`}
                            onClick={() => setFilter(f.value)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="loading-screen" style={{ minHeight: '30vh' }}>
                        <div className="loading-spinner" />
                        <p className="loading-text">Loading history...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="history-empty glass-card">
                        <div className="history-empty-icon">&#x1F4FF;</div>
                        <p>Abhi tak koi jaap record nahi hai</p>
                        <p style={{ fontSize: '0.8rem', marginTop: '8px', color: 'var(--text-light)' }}>
                            Jaap karein aur yahan record dikhega
                        </p>
                    </div>
                ) : (
                    <div className="glass-card" style={{ overflow: 'hidden' }}>
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Click</th>
                                    <th>Manual</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((entry) => (
                                    <tr key={entry.date}>
                                        <td>{formatDate(entry.date)}</td>
                                        <td>{entry.clickCount.toLocaleString('en-IN')}</td>
                                        <td>{entry.manualCount.toLocaleString('en-IN')}</td>
                                        <td className="total-cell">{entry.totalCount.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3} style={{ fontWeight: 600, textAlign: 'right', paddingRight: '16px' }}>
                                        Grand Total:
                                    </td>
                                    <td className="total-cell" style={{ fontSize: '1.1rem' }}>
                                        {totalAll.toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
