import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    increment,
} from 'firebase/firestore';
import { db } from './firebase';
import type { DailySummary, DailyLog } from '@/types';

function getTodayDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

// ===== Timeout helper: prevents Firebase calls from hanging forever =====
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => {
            console.warn(`[Firebase] ⏱️ Request timed out after ${ms}ms, using fallback`);
            resolve(fallback);
        }, ms)),
    ]);
}

// ===== Helper: localStorage backup =====
export function lsGet(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
}
function lsSet(key: string, val: unknown) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(val));
}

// ===== USER FUNCTIONS =====

export async function getOrCreateUser(userId: string, displayName: string) {
    const defaultData = {
        id: userId,
        displayName,
        totalJaap: 0,
        currentStreak: 0,
        dailyTarget: 108,
        soundEnabled: true,
        lastJaapDate: '',
    };

    try {
        console.log('[Firebase] 🔄 getOrCreateUser for:', userId);
        const userRef = doc(db, 'users', userId);
        const userSnap = await withTimeout(getDoc(userRef), 8000, null);

        if (userSnap === null) {
            // Timed out — try setDoc and use localStorage
            try {
                await withTimeout(setDoc(userRef, defaultData, { merge: true }), 5000, null);
            } catch { /* ignore */ }
            const stored = lsGet(`jaap_${userId}_userData`);
            if (stored) return JSON.parse(stored);
            return defaultData;
        }

        if (!userSnap.exists()) {
            await setDoc(userRef, defaultData);
            console.log('[Firebase] ✅ New user created:', userId);
            lsSet(`jaap_${userId}_userData`, defaultData);
            return defaultData;
        }

        const data = userSnap.data();
        console.log('[Firebase] ✅ User loaded:', userId, 'totalJaap:', data.totalJaap);
        lsSet(`jaap_${userId}_userData`, data);
        return data;
    } catch (err) {
        console.error('[Firebase] ❌ User load failed:', err);
        const stored = lsGet(`jaap_${userId}_userData`);
        if (stored) return JSON.parse(stored);
        return defaultData;
    }
}

// ===== DAILY ENTRY =====

export async function getOrCreateDailyEntry(userId: string) {
    const today = getTodayDate();
    const entryId = `${userId}_${today}`;
    const defaultData = {
        id: entryId,
        userId,
        date: today,
        clickCount: 0,
        manualCount: 0,
        totalCount: 0,
        timestamp: Date.now(),
    };

    try {
        console.log('[Firebase] 🔄 getOrCreateDailyEntry for:', entryId);
        const entryRef = doc(db, 'jaapEntries', entryId);
        const entrySnap = await withTimeout(getDoc(entryRef), 8000, null);

        if (entrySnap === null) {
            // Timed out
            try {
                await withTimeout(setDoc(entryRef, defaultData, { merge: true }), 5000, null);
            } catch { /* ignore */ }
            const stored = lsGet(`jaap_${userId}_daily_${today}`);
            if (stored) return JSON.parse(stored);
            return defaultData;
        }

        if (!entrySnap.exists()) {
            await setDoc(entryRef, defaultData);
            console.log('[Firebase] ✅ New daily entry created:', entryId);
            lsSet(`jaap_${userId}_daily_${today}`, defaultData);
            return defaultData;
        }

        const data = entrySnap.data();
        console.log('[Firebase] ✅ Daily entry loaded:', entryId, 'total:', data.totalCount);
        lsSet(`jaap_${userId}_daily_${today}`, data);
        return data;
    } catch (err) {
        console.error('[Firebase] ❌ Daily entry failed:', err);
        const stored = lsGet(`jaap_${userId}_daily_${today}`);
        if (stored) return JSON.parse(stored);
        return defaultData;
    }
}

// ===== ADD CLICK JAAP =====

export async function addClickJaap(userId: string) {
    const today = getTodayDate();
    const entryId = `${userId}_${today}`;

    try {
        console.log('[Firebase] 🔄 addClickJaap for:', userId);
        await getOrCreateDailyEntry(userId);

        const entryRef = doc(db, 'jaapEntries', entryId);
        const userRef = doc(db, 'users', userId);

        await Promise.all([
            updateDoc(entryRef, {
                clickCount: increment(1),
                totalCount: increment(1),
                timestamp: Date.now(),
            }),
            updateDoc(userRef, {
                totalJaap: increment(1),
                lastJaapDate: today,
            }),
        ]);
        console.log('[Firebase] ✅ Click jaap counts updated');

        // Streak update (non-blocking)
        updateStreak(userId).catch(() => { });

        // Daily log (non-blocking)
        addDailyLog(userId, 'click', 1).catch(() => { });

        // Read back confirmed data
        const [entrySnap, userSnap] = await Promise.all([
            withTimeout(getDoc(entryRef), 5000, null),
            withTimeout(getDoc(userRef), 5000, null),
        ]);
        if (entrySnap?.exists()) lsSet(`jaap_${userId}_daily_${today}`, entrySnap.data());
        if (userSnap?.exists()) lsSet(`jaap_${userId}_userData`, userSnap.data());

        console.log('[Firebase] ✅ Click jaap saved!');
        return entrySnap?.exists() ? entrySnap.data() : { clickCount: 1, totalCount: 1, date: today };
    } catch (err) {
        console.error('[Firebase] ❌ Click jaap failed:', err);
        return addClickLocal(userId);
    }
}

function addClickLocal(userId: string) {
    const today = getTodayDate();
    const dKey = `jaap_${userId}_daily_${today}`;
    const uKey = `jaap_${userId}_userData`;
    const stored = lsGet(dKey);
    const entry = stored ? JSON.parse(stored) : { clickCount: 0, manualCount: 0, totalCount: 0, date: today };
    entry.clickCount += 1;
    entry.totalCount += 1;
    lsSet(dKey, entry);

    const uStored = lsGet(uKey);
    const userData = uStored ? JSON.parse(uStored) : { totalJaap: 0, currentStreak: 0, lastJaapDate: '' };
    userData.totalJaap += 1;
    userData.lastJaapDate = today;
    lsSet(uKey, userData);

    addLogLocal(userId, 'click', 1);
    return entry;
}

// ===== ADD MANUAL JAAP =====

export async function addManualJaap(userId: string, count: number) {
    const today = getTodayDate();
    const entryId = `${userId}_${today}`;

    try {
        console.log('[Firebase] 🔄 addManualJaap for:', userId, 'count:', count);
        await getOrCreateDailyEntry(userId);

        const entryRef = doc(db, 'jaapEntries', entryId);
        const userRef = doc(db, 'users', userId);

        await Promise.all([
            updateDoc(entryRef, {
                manualCount: increment(count),
                totalCount: increment(count),
                timestamp: Date.now(),
            }),
            updateDoc(userRef, {
                totalJaap: increment(count),
                lastJaapDate: today,
            }),
        ]);
        console.log('[Firebase] ✅ Manual jaap counts updated');

        updateStreak(userId).catch(() => { });
        addDailyLog(userId, 'manual', count).catch(() => { });

        const [entrySnap, userSnap] = await Promise.all([
            withTimeout(getDoc(entryRef), 5000, null),
            withTimeout(getDoc(userRef), 5000, null),
        ]);
        if (entrySnap?.exists()) lsSet(`jaap_${userId}_daily_${today}`, entrySnap.data());
        if (userSnap?.exists()) lsSet(`jaap_${userId}_userData`, userSnap.data());

        console.log('[Firebase] ✅ Manual jaap saved! Count:', count);
        return entrySnap?.exists() ? entrySnap.data() : { manualCount: count, totalCount: count, date: today };
    } catch (err) {
        console.error('[Firebase] ❌ Manual jaap failed:', err);
        return addManualLocal(userId, count);
    }
}

function addManualLocal(userId: string, count: number) {
    const today = getTodayDate();
    const dKey = `jaap_${userId}_daily_${today}`;
    const uKey = `jaap_${userId}_userData`;
    const stored = lsGet(dKey);
    const entry = stored ? JSON.parse(stored) : { clickCount: 0, manualCount: 0, totalCount: 0, date: today };
    entry.manualCount += count;
    entry.totalCount += count;
    lsSet(dKey, entry);

    const uStored = lsGet(uKey);
    const userData = uStored ? JSON.parse(uStored) : { totalJaap: 0, currentStreak: 0, lastJaapDate: '' };
    userData.totalJaap += count;
    userData.lastJaapDate = today;
    lsSet(uKey, userData);

    addLogLocal(userId, 'manual', count);
    return entry;
}

// ===== DAILY LOGS =====

async function addDailyLog(userId: string, type: 'click' | 'manual', count: number) {
    const today = getTodayDate();
    const logId = `${userId}_${today}_${Date.now()}`;
    try {
        const logRef = doc(db, 'dailyLogs', logId);
        await setDoc(logRef, {
            userId,
            date: today,
            type,
            count,
            timestamp: Date.now(),
        });
        console.log('[Firebase] ✅ Daily log saved');
    } catch (err) {
        console.error('[Firebase] ❌ Daily log failed:', err);
    }
    addLogLocal(userId, type, count);
}

function addLogLocal(userId: string, type: 'click' | 'manual', count: number) {
    const today = getTodayDate();
    const key = `jaap_${userId}_logs_${today}`;
    const stored = lsGet(key);
    const logs: DailyLog[] = stored ? JSON.parse(stored) : [];
    logs.unshift({ type, count, timestamp: Date.now() });
    if (logs.length > 50) logs.length = 50;
    lsSet(key, logs);
}

export async function getTodayLogs(userId: string): Promise<DailyLog[]> {
    const today = getTodayDate();

    try {
        const logsRef = collection(db, 'dailyLogs');
        const q = query(
            logsRef,
            where('userId', '==', userId),
            where('date', '==', today)
        );
        const snapshot = await withTimeout(getDocs(q), 8000, null);
        if (snapshot === null) {
            const key = `jaap_${userId}_logs_${today}`;
            const stored = lsGet(key);
            return stored ? JSON.parse(stored) : [];
        }
        const logs = snapshot.docs.map((d) => ({
            type: d.data().type as 'click' | 'manual',
            count: d.data().count as number,
            timestamp: d.data().timestamp as number,
        }));
        logs.sort((a, b) => b.timestamp - a.timestamp);
        console.log('[Firebase] ✅ Today logs loaded:', logs.length, 'entries');
        if (logs.length > 0) return logs;
    } catch (err) {
        console.error('[Firebase] ❌ Today logs failed:', err);
    }

    const key = `jaap_${userId}_logs_${today}`;
    const stored = lsGet(key);
    return stored ? JSON.parse(stored) : [];
}

// ===== STREAK =====

async function updateStreak(userId: string) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await withTimeout(getDoc(userRef), 5000, null);
        if (!userSnap?.exists()) return;
        const userData = userSnap.data();
        if (!userData) return;

        const today = getTodayDate();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let streak = userData.currentStreak || 0;

        if (userData.lastJaapDate === today) {
            return;
        } else if (userData.lastJaapDate === yesterdayStr) {
            streak += 1;
        } else {
            streak = 1;
        }

        await updateDoc(userRef, { currentStreak: streak });
    } catch {
        // non-critical
    }
}

// ===== HISTORY =====

export async function getHistory(
    userId: string,
    filter: 'today' | 'week' | 'month' | 'all' = 'all'
): Promise<DailySummary[]> {
    const now = new Date();
    let startDate = '';

    switch (filter) {
        case 'today':
            startDate = getTodayDate();
            break;
        case 'week': {
            const d = new Date(now);
            d.setDate(d.getDate() - 7);
            startDate = d.toISOString().split('T')[0];
            break;
        }
        case 'month': {
            const d = new Date(now);
            d.setMonth(d.getMonth() - 1);
            startDate = d.toISOString().split('T')[0];
            break;
        }
    }

    try {
        const jaapRef = collection(db, 'jaapEntries');
        let q;
        if (startDate) {
            q = query(jaapRef, where('userId', '==', userId), where('date', '>=', startDate));
        } else {
            q = query(jaapRef, where('userId', '==', userId));
        }
        const snapshot = await withTimeout(getDocs(q), 8000, null);
        if (snapshot === null) return getHistoryLocal(userId, startDate);

        const results = snapshot.docs.map((d) => ({
            date: d.data().date,
            clickCount: d.data().clickCount,
            manualCount: d.data().manualCount,
            totalCount: d.data().totalCount,
        }));
        results.sort((a, b) => b.date.localeCompare(a.date));
        if (results.length > 0) return results;
    } catch {
        // fallback
    }

    return getHistoryLocal(userId, startDate);
}

function getHistoryLocal(userId: string, startDate: string): DailySummary[] {
    if (typeof window === 'undefined') return [];
    const entries: DailySummary[] = [];
    const prefix = `jaap_${userId}_daily_`;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
            const raw = localStorage.getItem(key);
            if (raw) {
                const e = JSON.parse(raw);
                if (e.totalCount > 0 && (!startDate || e.date >= startDate)) {
                    entries.push({ date: e.date, clickCount: e.clickCount, manualCount: e.manualCount, totalCount: e.totalCount });
                }
            }
        }
    }
    entries.sort((a, b) => b.date.localeCompare(a.date));
    return entries;
}

// ===== COMBINED TOTAL =====

export async function getCombinedTotal(): Promise<number> {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await withTimeout(getDocs(usersRef), 8000, null);
        if (snapshot === null) {
            const s1 = lsGet('jaap_sevak1_userData');
            const s2 = lsGet('jaap_sevak2_userData');
            const t1 = s1 ? JSON.parse(s1).totalJaap || 0 : 0;
            const t2 = s2 ? JSON.parse(s2).totalJaap || 0 : 0;
            return t1 + t2;
        }
        let total = 0;
        snapshot.docs.forEach((d) => {
            total += d.data().totalJaap || 0;
        });
        console.log('[Firebase] ✅ Combined total:', total);
        if (total > 0) return total;
    } catch (err) {
        console.error('[Firebase] ❌ Combined total failed:', err);
    }

    const s1 = lsGet('jaap_sevak1_userData');
    const s2 = lsGet('jaap_sevak2_userData');
    const t1 = s1 ? JSON.parse(s1).totalJaap || 0 : 0;
    const t2 = s2 ? JSON.parse(s2).totalJaap || 0 : 0;
    return t1 + t2;
}

// ===== RESET DAILY COUNT =====

export async function resetDailyCount(userId: string) {
    const today = getTodayDate();
    const entryId = `${userId}_${today}`;

    try {
        const entryRef = doc(db, 'jaapEntries', entryId);
        const entrySnap = await withTimeout(getDoc(entryRef), 5000, null);

        if (entrySnap?.exists()) {
            const data = entrySnap.data();
            const totalToRemove = data.totalCount || 0;

            await setDoc(entryRef, {
                id: entryId,
                userId,
                date: today,
                clickCount: 0,
                manualCount: 0,
                totalCount: 0,
                timestamp: Date.now(),
            });

            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                totalJaap: increment(-totalToRemove),
            });
        }
    } catch {
        // fallback
    }

    // Also reset localStorage
    const dKey = `jaap_${userId}_daily_${today}`;
    const stored = lsGet(dKey);
    if (stored) {
        const entry = JSON.parse(stored);
        const toRemove = entry.totalCount || 0;
        entry.clickCount = 0;
        entry.manualCount = 0;
        entry.totalCount = 0;
        lsSet(dKey, entry);

        const uKey = `jaap_${userId}_userData`;
        const uStored = lsGet(uKey);
        if (uStored) {
            const u = JSON.parse(uStored);
            u.totalJaap = Math.max(0, (u.totalJaap || 0) - toRemove);
            lsSet(uKey, u);
        }
    }

    const logKey = `jaap_${userId}_logs_${today}`;
    if (typeof window !== 'undefined') localStorage.removeItem(logKey);
}
