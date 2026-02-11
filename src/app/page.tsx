'use client';

import { useEffect } from 'react';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import JaapButton from '@/components/JaapButton';
import ManualAdd from '@/components/ManualAdd';
import ProgressBar from '@/components/ProgressBar';
import BottomNav from '@/components/BottomNav';
import CombinedTotal from '@/components/CombinedTotal';
import TodayLog from '@/components/TodayLog';
import UserSelectModal from '@/components/UserSelectModal';
import { useJaap } from '@/hooks/useJaap';
import { useUser } from '@/hooks/useUser';
import { useSettings } from '@/hooks/useSettings';
import { soundManager } from '@/lib/soundManager';

export default function Home() {
  const { user, selectUser, logout } = useUser();
  const { settings } = useSettings();
  const {
    dailyCount,
    totalJaap,
    streak,
    combinedTotal,
    todayLogs,
    isLoading,
    incrementJaap,
    addManual,
  } = useJaap(user.userId);

  useEffect(() => {
    soundManager.init();
  }, []);

  useEffect(() => {
    soundManager.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Show user selection modal
  if (!user.isSelected) {
    return <UserSelectModal onSelect={selectUser} />;
  }

  // Show loading
  if (isLoading) {
    return (
      <div className="app-container">
        <Header displayName={user.displayName} onLogout={logout} />
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p className="loading-text">Radhe Radhe... Loading...</p>
        </div>
      </div>
    );
  }

  const handleJaapClick = () => {
    soundManager.playBell();
    incrementJaap();
  };

  return (
    <div className="app-container">
      <Header displayName={user.displayName} onLogout={logout} />

      {/* ===== MOBILE LAYOUT ===== */}
      <div className="main-content mobile-only">
        <StatsCard dailyCount={dailyCount} totalJaap={totalJaap} streak={streak} />
        <JaapButton onClick={handleJaapClick} />
        <ManualAdd onAdd={addManual} />
        <ProgressBar current={dailyCount} target={settings.dailyTarget} />
        <CombinedTotal total={combinedTotal} />
      </div>

      {/* ===== DESKTOP LAYOUT ===== */}
      <div className="main-content desktop-only">
        <div className="desktop-layout">
          {/* Left Panel */}
          <div className="desktop-left">
            <StatsCard dailyCount={dailyCount} totalJaap={totalJaap} streak={streak} />
            <ProgressBar current={dailyCount} target={settings.dailyTarget} />
            <CombinedTotal total={combinedTotal} />
          </div>

          {/* Center Panel */}
          <div className="desktop-center">
            <JaapButton onClick={handleJaapClick} />
          </div>

          {/* Right Panel */}
          <div className="desktop-right">
            <ManualAdd onAdd={addManual} />
            <TodayLog logs={todayLogs} />
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
