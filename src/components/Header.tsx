'use client';

import { LogOut, Flower2 } from 'lucide-react';

interface HeaderProps {
    displayName: string;
    onLogout: () => void;
}

export default function Header({ displayName, onLogout }: HeaderProps) {
    return (
        <header className="header">
            <div className="header-left">
                <Flower2 className="header-icon" size={28} />
                <div>
                    <h1 className="header-title">Radha Naam Jaap</h1>
                    <p className="header-quote">&ldquo;Radha Naam hi jeevan ka sahara hai&rdquo;</p>
                </div>
            </div>
            <div className="header-right">
                <div className="user-badge">
                    <span className="user-avatar">&#x1F64F;</span>
                    <span className="user-name">{displayName}</span>
                </div>
                <button className="logout-btn" onClick={onLogout} title="Logout">
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
}
