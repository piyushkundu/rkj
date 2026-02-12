'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import UserSelectModal from '@/components/UserSelectModal';
import { useUser } from '@/hooks/useUser';
import { useSettings } from '@/hooks/useSettings';
import { resetDailyCount, resetAllData } from '@/lib/jaapService';

export default function SettingsPage() {
    const { user, selectUser, updateDisplayName, logout } = useUser();
    const { settings, updateSettings } = useSettings();
    const [showConfirm, setShowConfirm] = useState(false);
    const [showTotalReset, setShowTotalReset] = useState(false);
    const [totalResetInput, setTotalResetInput] = useState('');
    const [targetInput, setTargetInput] = useState('');
    const [nameInput, setNameInput] = useState('');
    const [showSaved, setShowSaved] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    if (!user.isSelected) {
        return <UserSelectModal onSelect={selectUser} />;
    }

    // Initialize inputs
    if (!targetInput && settings.dailyTarget) {
        setTargetInput(settings.dailyTarget.toString());
    }
    if (!nameInput && user.displayName) {
        setNameInput(user.displayName);
    }

    const handleSaveTarget = () => {
        const target = parseInt(targetInput, 10);
        if (!isNaN(target) && target > 0) {
            updateSettings({ dailyTarget: target });
            showSavedMessage();
        }
    };

    const handleSaveName = () => {
        if (nameInput.trim()) {
            updateDisplayName(nameInput.trim());
            showSavedMessage();
        }
    };

    const handleSoundToggle = () => {
        updateSettings({ soundEnabled: !settings.soundEnabled });
    };

    const handleReset = async () => {
        setIsResetting(true);
        try {
            await resetDailyCount(user.userId);
            setShowConfirm(false);
            showSavedMessage();
        } catch (error) {
            console.error('Error resetting:', error);
        }
        setIsResetting(false);
    };

    const handleTotalReset = async () => {
        if (totalResetInput !== 'RESET') return;
        setIsResetting(true);
        try {
            await resetAllData(user.userId);
            setShowTotalReset(false);
            setTotalResetInput('');
            // Force reload to clear all state
            window.location.reload();
        } catch (error) {
            console.error('Error in total reset:', error);
        }
        setIsResetting(false);
    };

    function showSavedMessage() {
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
    }

    const targetPresets = [108, 500, 1008, 5000];

    return (
        <div className="app-container">
            <Header displayName={user.displayName} onLogout={logout} />

            <div className="page-container">
                <h2 className="page-title">
                    <span>&#x2699;&#xFE0F;</span> Settings
                </h2>

                {showSaved && (
                    <div className="manual-add-success" style={{ marginBottom: '16px' }}>
                        &#x2705; Settings saved successfully!
                    </div>
                )}

                <div className="settings-list">
                    {/* Daily Target */}
                    <div className="settings-item glass-card">
                        <div className="settings-item-info">
                            <div className="settings-item-label">
                                <span>&#x1F3AF;</span> Daily Target
                            </div>
                            <p className="settings-item-desc">Set your daily jaap goal</p>
                            <div className="manual-add-presets" style={{ marginTop: '8px' }}>
                                {targetPresets.map((p) => (
                                    <button
                                        key={p}
                                        className="preset-btn"
                                        onClick={() => {
                                            setTargetInput(p.toString());
                                            updateSettings({ dailyTarget: p });
                                            showSavedMessage();
                                        }}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="number"
                                className="settings-input"
                                value={targetInput}
                                onChange={(e) => setTargetInput(e.target.value)}
                                min="1"
                            />
                            <button className="save-btn" onClick={handleSaveTarget}>
                                Save
                            </button>
                        </div>
                    </div>

                    {/* Sound Toggle */}
                    <div className="settings-item glass-card">
                        <div className="settings-item-info">
                            <div className="settings-item-label">
                                <span>&#x1F514;</span> Bell Sound
                            </div>
                            <p className="settings-item-desc">
                                Jaap button par bell bajegi ({settings.soundEnabled ? 'On' : 'Off'})
                            </p>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.soundEnabled}
                                onChange={handleSoundToggle}
                            />
                            <span className="toggle-slider" />
                        </label>
                    </div>

                    {/* Display Name */}
                    <div className="settings-item glass-card">
                        <div className="settings-item-info">
                            <div className="settings-item-label">
                                <span>&#x270F;&#xFE0F;</span> Display Name
                            </div>
                            <p className="settings-item-desc">Apna naam change karein</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="text"
                                className="settings-input settings-input-wide"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                placeholder="Your name"
                            />
                            <button className="save-btn" onClick={handleSaveName}>
                                Save
                            </button>
                        </div>
                    </div>

                    {/* Reset Daily Count */}
                    <div className="settings-item glass-card">
                        <div className="settings-item-info">
                            <div className="settings-item-label">
                                <span>&#x1F504;</span> Reset Today&apos;s Count
                            </div>
                            <p className="settings-item-desc">
                                Aaj ka saara jaap count zero ho jayega
                            </p>
                        </div>
                        <button className="reset-btn" onClick={() => setShowConfirm(true)}>
                            Reset
                        </button>
                    </div>

                    {/* TOTAL RESET */}
                    <div className="settings-item glass-card" style={{ borderLeft: '3px solid #EF5350' }}>
                        <div className="settings-item-info">
                            <div className="settings-item-label">
                                <span>&#x26A0;&#xFE0F;</span> Total Reset
                            </div>
                            <p className="settings-item-desc" style={{ color: '#EF5350' }}>
                                Saara data delete ho jayega — Firebase + Local dono se
                            </p>
                        </div>
                        <button
                            className="reset-btn"
                            style={{ borderColor: '#D32F2F', color: '#D32F2F' }}
                            onClick={() => { setShowTotalReset(true); setTotalResetInput(''); }}
                        >
                            Total Reset
                        </button>
                    </div>

                    {/* App Info */}
                    <div className="settings-item glass-card" style={{ justifyContent: 'center', flexDirection: 'column', textAlign: 'center', gap: '4px' }}>
                        <p style={{ fontSize: '1.2rem' }}>&#x1F338;</p>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--maroon)' }}>
                            Radha Naam Jaap
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Version 1.0.0 | Made with &#x2764;&#xFE0F; and Bhakti
                        </p>
                    </div>
                </div>
            </div>

            {/* Daily Reset Confirm Dialog */}
            {showConfirm && (
                <div className="confirm-overlay">
                    <div className="confirm-dialog glass-card">
                        <h3>&#x26A0;&#xFE0F; Reset Confirm</h3>
                        <p>
                            Kya aap sach mein aaj ka jaap count reset karna chahte hain?
                            Ye action undo nahi ho sakta.
                        </p>
                        <div className="confirm-buttons">
                            <button
                                className="confirm-cancel"
                                onClick={() => setShowConfirm(false)}
                                disabled={isResetting}
                            >
                                Cancel
                            </button>
                            <button
                                className="confirm-ok"
                                onClick={handleReset}
                                disabled={isResetting}
                            >
                                {isResetting ? 'Resetting...' : 'Haan, Reset karo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOTAL RESET Confirm Dialog */}
            {showTotalReset && (
                <div className="confirm-overlay">
                    <div className="confirm-dialog glass-card">
                        <h3 style={{ color: '#D32F2F' }}>&#x1F6A8; Total Reset</h3>
                        <p style={{ marginBottom: '8px' }}>
                            Saara data hamesha ke liye delete ho jayega — total jaap, daily count, history, streak, sab kuch!
                        </p>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>
                            Confirm karne ke liye neeche <span style={{ color: '#D32F2F', fontFamily: 'monospace', background: 'rgba(211,47,47,0.1)', padding: '2px 6px', borderRadius: '4px' }}>RESET</span> type karein:
                        </p>
                        <input
                            type="text"
                            value={totalResetInput}
                            onChange={(e) => setTotalResetInput(e.target.value.toUpperCase())}
                            placeholder="Type RESET here"
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: totalResetInput === 'RESET' ? '2px solid #D32F2F' : '2px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '1.1rem',
                                fontFamily: 'monospace',
                                textAlign: 'center',
                                letterSpacing: '4px',
                                fontWeight: 700,
                                color: totalResetInput === 'RESET' ? '#D32F2F' : 'var(--text-primary)',
                                outline: 'none',
                                marginBottom: '16px',
                                background: 'rgba(255,255,255,0.8)',
                            }}
                        />
                        <div className="confirm-buttons">
                            <button
                                className="confirm-cancel"
                                onClick={() => { setShowTotalReset(false); setTotalResetInput(''); }}
                                disabled={isResetting}
                            >
                                Cancel
                            </button>
                            <button
                                className="confirm-ok"
                                onClick={handleTotalReset}
                                disabled={isResetting || totalResetInput !== 'RESET'}
                                style={{
                                    background: totalResetInput === 'RESET' ? '#D32F2F' : '#ccc',
                                    cursor: totalResetInput === 'RESET' ? 'pointer' : 'not-allowed',
                                }}
                            >
                                {isResetting ? 'Deleting...' : 'Delete All Data'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
