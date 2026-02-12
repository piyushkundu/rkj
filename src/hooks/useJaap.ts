'use client';

import { useState, useEffect, useCallback } from 'react';
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

/** Read cached data from localStorage — only works on client side */
function readLocalCache(userId: string): Partial<JaapState> | null {
    if (typeof window === 'undefined' || !userId) return null;
    try {
        const today = getTodayDate();
        const userRaw = lsGet(`jaap_${userId}_userData`);
        const dailyRaw = lsGet(`jaap_${userId}_daily_${today}`);
        const logsRaw = lsGet(`jaap_${userId}_logs_${today}`);

        if (!userRaw && !dailyRaw) return null;

        const userData = userRaw ? JSON.parse(userRaw) : {};
        const dailyEntry = dailyRaw ? JSON.parse(dailyRaw) : {};
        const logs: DailyLog[] = logsRaw ? JSON.parse(logsRaw) : [];

        console.log('[Cache] LocalStorage data found — dailyCount:', dailyEntry.totalCount, 'totalJaap:', userData.totalJaap);

        return {
            dailyCount: dailyEntry.totalCount || 0,
            totalJaap: userData.totalJaap || 0,
            streak: userData.currentStreak || 0,
            combinedTotal: userData.totalJaap || 0,
            todayLogs: logs,
        };
    } catch {
        return null;
    }
}

export function useJaap(userId: string) {
    // Always start with loading state (SSR safe — no localStorage access here)
    const [state, setState] = useState<JaapState>({
        dailyCount: 0,
        totalJaap: 0,
        streak: 0,
        combinedTotal: 0,
        todayLogs: [],
        isLoading: true,
    });

    // Load fresh data from Firebase (parallel)
    const loadData = useCallback(async () => {
        if (!userId) return;

        try {
            console.log('[useJaap] 🔄 Loading data for user:', userId);

            // Step 1: Ensure user exists FIRST (important for new users)
            const userData = await getOrCreateUser(userId, userId === 'sevak1' ? 'Sevak 1' : 'Sevak 2');
            console.log('[useJaap] ✅ User data loaded:', userData?.totalJaap);

            // Step 2: Load daily entry, combined total, and logs in parallel
            const [dailyEntry, combined, logs] = await Promise.all([
                getOrCreateDailyEntry(userId),
                getCombinedTotal(),
                getTodayLogs(userId).catch(() => [] as DailyLog[]),
            ]);

            const firebaseData = {
                dailyCount: dailyEntry?.totalCount || 0,
                totalJaap: userData?.totalJaap || 0,
                streak: userData?.currentStreak || 0,
                combinedTotal: combined,
                todayLogs: logs,
            };

            console.log('[useJaap] ✅ All data loaded — dailyCount:', firebaseData.dailyCount, 'totalJaap:', firebaseData.totalJaap, 'combined:', firebaseData.combinedTotal);

            setState((prev) => {
                // Take the HIGHER values between current state (localStorage) and Firebase
                // This prevents Firebase zeros from overwriting good localStorage data
                return {
                    dailyCount: Math.max(prev.dailyCount, firebaseData.dailyCount),
                    totalJaap: Math.max(prev.totalJaap, firebaseData.totalJaap),
                    streak: Math.max(prev.streak, firebaseData.streak),
                    combinedTotal: Math.max(prev.combinedTotal, firebaseData.combinedTotal),
                    todayLogs: firebaseData.todayLogs.length > 0 ? firebaseData.todayLogs : prev.todayLogs,
                    isLoading: false,
                };
            });
        } catch (error) {
            console.error('[useJaap] ❌ Error loading jaap data:', error);
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        // STEP 1: Immediately read localStorage cache (only runs on CLIENT after hydration)
        const cached = readLocalCache(userId);
        if (cached) {
            setState({
                dailyCount: cached.dailyCount || 0,
                totalJaap: cached.totalJaap || 0,
                streak: cached.streak || 0,
                combinedTotal: cached.combinedTotal || 0,
                todayLogs: cached.todayLogs || [],
                isLoading: false, // Show cached data immediately — no loading spinner!
            });
        }

        // STEP 2: Fetch fresh data from Firebase in background
        loadData();
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
