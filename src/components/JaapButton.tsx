'use client';

import { useState, useCallback } from 'react';

interface JaapButtonProps {
    onClick: () => void;
}

export default function JaapButton({ onClick }: JaapButtonProps) {
    const [isPressed, setIsPressed] = useState(false);
    const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
    const [floatingTexts, setFloatingTexts] = useState<{ id: number }[]>([]);

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            setIsPressed(true);
            setTimeout(() => setIsPressed(false), 150);

            // Add ripple
            const button = e.currentTarget;
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rippleId = Date.now();
            setRipples((prev) => [...prev, { id: rippleId, x, y }]);
            setTimeout(() => {
                setRipples((prev) => prev.filter((r) => r.id !== rippleId));
            }, 600);

            // Add floating +1 text
            const floatId = Date.now() + Math.random();
            setFloatingTexts((prev) => [...prev, { id: floatId }]);
            setTimeout(() => {
                setFloatingTexts((prev) => prev.filter((f) => f.id !== floatId));
            }, 1000);

            onClick();
        },
        [onClick]
    );

    return (
        <div className="jaap-button-container">
            <div className="jaap-button-glow" />
            <button
                className={`jaap-button ${isPressed ? 'jaap-button-pressed' : ''}`}
                onClick={handleClick}
            >
                {ripples.map((ripple) => (
                    <span
                        key={ripple.id}
                        className="jaap-ripple"
                        style={{ left: ripple.x, top: ripple.y }}
                    />
                ))}
                <span className="jaap-button-text">Radha</span>
                <span className="jaap-button-subtext">&#x1F338;</span>
            </button>
            {floatingTexts.map((ft) => (
                <span key={ft.id} className="floating-plus-one">
                    +1
                </span>
            ))}
            <p className="jaap-hint">Har click par 1 jaap add hoga</p>
        </div>
    );
}
