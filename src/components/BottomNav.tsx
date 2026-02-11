'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, BarChart3, SettingsIcon } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    const tabs = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/history', label: 'History', icon: BarChart3 },
        { href: '/settings', label: 'Settings', icon: SettingsIcon },
    ];

    return (
        <nav className="bottom-nav">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                const Icon = tab.icon;
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={`bottom-nav-tab ${isActive ? 'bottom-nav-active' : ''}`}
                    >
                        <Icon size={22} />
                        <span>{tab.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
