'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    addClickJaap,
    addManualJaap,
    getOrCreateDailyEntry,
    getOrCreateUser,
    getCombinedTotal,
    getTodayLogs,
    lsGet,
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

function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}

/** Read cached data from localStorage for instant render */
function getCachedState(userId: string): JaapState | null {
    if (!userId) return null;
    try {
        const today = getTodayDate();
        const userRaw = lsGet(`jaap_${userId}_userData`);
        const dailyRaw = lsGet(`jaap_${userId}_daily_${today}`);
        const logsRaw = lsGet(`jaap_${userId}_logs_${today}`);

        if (!userRaw && !dailyRaw) return null;

        const userData = userRaw ? JSON.parse(userRaw) : { totalJaap: 0, currentStreak: 0 };
        const dailyEntry = dailyRaw ? JSON.parse(dailyRaw) : { totalCount: 0 };
        const logs: DailyLog[] = logsRaw ? JSON.parse(logsRaw) : [];

        return {
            dailyCount: dailyEntry.totalCount || 0,
            totalJaap: userData.totalJaap || 0,
            streak: userData.currentStreak || 0,
            combinedTotal: userData.totalJaap || 0, // approximate until Firebase loads
            todayLogs: logs,
            isLoading: false, // show cached data immediately
        };
    } catch {
        return null;
    }
}

export function useJaap(userId: string) {
    const [state, setState] = useState<JaapState>(() => {
        // Try instant render from cache
        const cached = getCachedState(userId);
        if (cached) return cached;
        return {
            dailyCount: 0,
            totalJaap: 0,
            streak: 0,
            combinedTotal: 0,
            todayLogs: [],
            isLoading: true,
        };
    });

    const hasFetched = useRef(false);

    // Load fresh data from Firebase (parallel)
    const loadData = useCallback(async () => {
        if (!userId) return;

        try {
            // All 4 Firebase calls run in PARALLEL — much faster!
            const [userData, dailyEntry, combined, logs] = await Promise.all([
                getOrCreateUser(userId, userId === 'sevak1' ? 'Sevak 1' : 'Sevak 2'),
                getOrCreateDailyEntry(userId),
                getCombinedTotal(),
                getTodayLogs(userId).catch(() => [] as DailyLog[]),
            ]);

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
        if (!userId) return;

        // If we already have cached data, refresh silently in background
        if (!hasFetched.current) {
            hasFetched.current = true;
            loadData();
        }
    }, [userId, loadData]);

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
