import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    increment,
} from 'firebase/firestore';
import { db } from './firebase';
import type { DailySummary, DailyLog } from '@/types';

function getTodayDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

// ===== Helper: localStorage backup =====
function lsGet(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
}
function lsSet(key: string, val: unknown) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(val));
}

// ===== USER FUNCTIONS =====

export async function getOrCreateUser(userId: string, displayName: string) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const data = {
                id: userId,
                displayName,
                totalJaap: 0,
                currentStreak: 0,
                dailyTarget: 108,
                soundEnabled: true,
                lastJaapDate: '',
            };
            await setDoc(userRef, data);
            lsSet(`jaap_${userId}_userData`, data);
            return data;
        }

        const data = userSnap.data();
        lsSet(`jaap_${userId}_userData`, data);
        return data;
    } catch (err) {
        console.warn('Firebase error, using localStorage:', err);
        const stored = lsGet(`jaap_${userId}_userData`);
        if (stored) return JSON.parse(stored);
        return { totalJaap: 0, currentStreak: 0, lastJaapDate: '' };
    }
}

// ===== DAILY ENTRY =====

export async function getOrCreateDailyEntry(userId: string) {
    const today = getTodayDate();
    const entryId = `${userId}_${today}`;

    try {
        const entryRef = doc(db, 'jaapEntries', entryId);
        const entrySnap = await getDoc(entryRef);

        if (!entrySnap.exists()) {
            const data = {
                id: entryId,
                userId,
                date: today,
                clickCount: 0,
                manualCount: 0,
                totalCount: 0,
                timestamp: Date.now(),
            };
            await setDoc(entryRef, data);
            lsSet(`jaap_${userId}_daily_${today}`, data);
            return data;
        }

        const data = entrySnap.data();
        lsSet(`jaap_${userId}_daily_${today}`, data);
        return data;
    } catch (err) {
        console.warn('Firebase error, using localStorage:', err);
        const stored = lsGet(`jaap_${userId}_daily_${today}`);
        if (stored) return JSON.parse(stored);
        return { clickCount: 0, manualCount: 0, totalCount: 0, date: today };
    }
}

// ===== ADD CLICK JAAP =====

export async function addClickJaap(userId: string) {
    const today = getTodayDate();
    const entryId = `${userId}_${today}`;

    try {
        await getOrCreateDailyEntry(userId);

        const entryRef = doc(db, 'jaapEntries', entryId);
        await updateDoc(entryRef, {
            clickCount: increment(1),
            totalCount: increment(1),
            timestamp: Date.now(),
        });

        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            totalJaap: increment(1),
            lastJaapDate: today,
        });

        // Update streak
        await updateStreak(userId);

        // Add to daily log
        await addDailyLog(userId, 'click', 1);

        // Update local backup
        const snap = await getDoc(entryRef);
        if (snap.exists()) lsSet(`jaap_${userId}_daily_${today}`, snap.data());
        const uSnap = await getDoc(userRef);
        if (uSnap.exists()) lsSet(`jaap_${userId}_userData`, uSnap.data());

        return snap.data();
    } catch (err) {
        console.warn('Firebase error, using localStorage:', err);
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
        await getOrCreateDailyEntry(userId);

        const entryRef = doc(db, 'jaapEntries', entryId);
        await updateDoc(entryRef, {
            manualCount: increment(count),
            totalCount: increment(count),
            timestamp: Date.now(),
        });

        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            totalJaap: increment(count),
            lastJaapDate: today,
        });

        await updateStreak(userId);
        await addDailyLog(userId, 'manual', count);

        const snap = await getDoc(entryRef);
        if (snap.exists()) lsSet(`jaap_${userId}_daily_${today}`, snap.data());
        const uSnap = await getDoc(userRef);
        if (uSnap.exists()) lsSet(`jaap_${userId}_userData`, uSnap.data());

        return snap.data();
    } catch (err) {
        console.warn('Firebase error, using localStorage:', err);
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
    } catch {
        // fallback
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
            where('date', '==', today),
            orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        const logs = snapshot.docs.map((d) => ({
            type: d.data().type as 'click' | 'manual',
            count: d.data().count as number,
            timestamp: d.data().timestamp as number,
        }));
        if (logs.length > 0) return logs;
    } catch {
        // fallback
    }

    // Fallback to localStorage
    const key = `jaap_${userId}_logs_${today}`;
    const stored = lsGet(key);
    return stored ? JSON.parse(stored) : [];
}

// ===== STREAK =====

async function updateStreak(userId: string) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        if (!userData) return;

        const today = getTodayDate();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let streak = userData.currentStreak || 0;

        if (userData.lastJaapDate === today) {
            // Already counted today
            return;
        } else if (userData.lastJaapDate === yesterdayStr) {
            streak += 1;
        } else {
            streak = 1;
        }

        await updateDoc(userRef, { currentStreak: streak });
    } catch {
        // Streak update failed, not critical
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
            q = query(jaapRef, where('userId', '==', userId), where('date', '>=', startDate), orderBy('date', 'desc'));
        } else {
            q = query(jaapRef, where('userId', '==', userId), orderBy('date', 'desc'));
        }
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map((d) => ({
            date: d.data().date,
            clickCount: d.data().clickCount,
            manualCount: d.data().manualCount,
            totalCount: d.data().totalCount,
        }));
        if (results.length > 0) return results;
    } catch {
        // fallback
    }

    // Fallback: gather from localStorage
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
        const snapshot = await getDocs(usersRef);
        let total = 0;
        snapshot.docs.forEach((d) => {
            total += d.data().totalJaap || 0;
        });
        if (total > 0) return total;
    } catch {
        // fallback
    }

    // Fallback
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
        const entrySnap = await getDoc(entryRef);

        if (entrySnap.exists()) {
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
