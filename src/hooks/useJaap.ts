'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    addClickJaap,
    addManualJaap,
    getOrCreateDailyEntry,
    getOrCreateUser,
    getCombinedTotal,
    getTodayLogs,
} from '@/lib/jaapService';
import type { DailyLog } from '@/types';

interface JaapState {
    dailyCount: number;
    totalJaap: number;
    streak: number;
    combinedTotal: number;
    todayLogs: DailyLog[];
    isLoading: boolean;
}

export function useJaap(userId: string) {
    const [state, setState] = useState<JaapState>({
        dailyCount: 0,
        totalJaap: 0,
        streak: 0,
        combinedTotal: 0,
        todayLogs: [],
        isLoading: true,
    });

    // Load initial data
    const loadData = useCallback(async () => {
        if (!userId) return;

        try {
            setState((prev) => ({ ...prev, isLoading: true }));

            const userData = await getOrCreateUser(userId, userId === 'sevak1' ? 'Sevak 1' : 'Sevak 2');
            const dailyEntry = await getOrCreateDailyEntry(userId);
            const combined = await getCombinedTotal();

            let logs: DailyLog[] = [];
            try {
                logs = await getTodayLogs(userId);
            } catch {
                // Index might not be ready yet
                logs = [];
            }

            setState({
                dailyCount: dailyEntry?.totalCount || 0,
                totalJaap: userData?.totalJaap || 0,
                streak: userData?.currentStreak || 0,
                combinedTotal: combined,
                todayLogs: logs,
                isLoading: false,
            });
        } catch (error) {
            console.error('Error loading jaap data:', error);
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    }, [userId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const incrementJaap = useCallback(async () => {
        if (!userId) return;

        // Optimistic update
        setState((prev) => ({
            ...prev,
            dailyCount: prev.dailyCount + 1,
            totalJaap: prev.totalJaap + 1,
            combinedTotal: prev.combinedTotal + 1,
            todayLogs: [
                { type: 'click', count: 1, timestamp: Date.now() },
                ...prev.todayLogs,
            ],
        }));

        try {
            await addClickJaap(userId);
        } catch (error) {
            console.error('Error adding click jaap:', error);
            // Revert on error
            loadData();
        }
    }, [userId, loadData]);

    const addManual = useCallback(
        async (count: number) => {
            if (!userId || count <= 0) return;

            // Optimistic update
            setState((prev) => ({
                ...prev,
                dailyCount: prev.dailyCount + count,
                totalJaap: prev.totalJaap + count,
                combinedTotal: prev.combinedTotal + count,
                todayLogs: [
                    { type: 'manual', count, timestamp: Date.now() },
                    ...prev.todayLogs,
                ],
            }));

            try {
                await addManualJaap(userId, count);
            } catch (error) {
                console.error('Error adding manual jaap:', error);
                loadData();
            }
        },
        [userId, loadData]
    );

    return {
        ...state,
        incrementJaap,
        addManual,
        refreshData: loadData,
    };
}
