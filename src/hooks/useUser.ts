'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UserState {
    userId: string;
    displayName: string;
    isSelected: boolean;
}

export function useUser() {
    const [user, setUser] = useState<UserState>({
        userId: '',
        displayName: '',
        isSelected: false,
    });

    useEffect(() => {
        const savedUser = localStorage.getItem('jaap_user');
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            setUser({ ...parsed, isSelected: true });
        }
    }, []);

    const selectUser = useCallback((userId: string, displayName: string) => {
        const userData = { userId, displayName, isSelected: true };
        localStorage.setItem('jaap_user', JSON.stringify(userData));
        setUser(userData);
    }, []);

    const updateDisplayName = useCallback((newName: string) => {
        setUser((prev) => {
            const updated = { ...prev, displayName: newName };
            localStorage.setItem('jaap_user', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('jaap_user');
        setUser({ userId: '', displayName: '', isSelected: false });
    }, []);

    return { user, selectUser, updateDisplayName, logout };
}
