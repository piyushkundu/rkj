'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Settings } from '@/types';

const DEFAULT_SETTINGS: Settings = {
    dailyTarget: 108,
    soundEnabled: true,
    displayName: '',
};

export function useSettings() {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

    useEffect(() => {
        const saved = localStorage.getItem('jaap_settings');
        if (saved) {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
        }
    }, []);

    const updateSettings = useCallback((updates: Partial<Settings>) => {
        setSettings((prev) => {
            const newSettings = { ...prev, ...updates };
            localStorage.setItem('jaap_settings', JSON.stringify(newSettings));
            return newSettings;
        });
    }, []);

    return { settings, updateSettings };
}
