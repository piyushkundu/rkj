'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Flower2, Home, BarChart3, Settings } from 'lucide-react';

interface HeaderProps {
    displayName: string;
    onLogout: () => void;
}

export default function Header({ displayName, onLogout }: HeaderProps) {
    const pathname = usePathname();

    const navLinks = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/history', label: 'History', icon: BarChart3 },
        { href: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <header className="header">
            <div className="header-left">
                <Flower2 className="header-icon" size={28} />
                <div>
                    <h1 className="header-title">Radha Naam Jaap</h1>
                    <p className="header-quote">&ldquo;Radha Naam hi jeevan ka sahara hai&rdquo;</p>
                </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="desktop-nav">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`desktop-nav-link ${isActive ? 'desktop-nav-active' : ''}`}
                        >
                            <Icon size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

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
