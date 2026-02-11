'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

interface ManualAddProps {
    onAdd: (count: number) => void;
}

export default function ManualAdd({ onAdd }: ManualAddProps) {
    const [inputValue, setInputValue] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastAdded, setLastAdded] = useState(0);

    const handleAdd = () => {
        const count = parseInt(inputValue, 10);
        if (isNaN(count) || count <= 0) return;

        onAdd(count);
        setLastAdded(count);
        setInputValue('');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2500);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAdd();
    };

    const presets = [108, 500, 1008];

    return (
        <div className="manual-add glass-card">
            <h3 className="manual-add-title">
                <span>&#x1F522;</span> Add from Counter
            </h3>

            <div className="manual-add-presets">
                {presets.map((preset) => (
                    <button
                        key={preset}
                        className="preset-btn"
                        onClick={() => {
                            setInputValue(preset.toString());
                        }}
                    >
                        {preset}
                    </button>
                ))}
            </div>

            <div className="manual-add-input-group">
                <input
                    type="number"
                    className="manual-add-input"
                    placeholder="Jaise: 108, 500, 2000"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    min="1"
                />
                <button className="manual-add-btn" onClick={handleAdd} disabled={!inputValue}>
                    <Plus size={18} />
                    <span>Add Jaap</span>
                </button>
            </div>

            {showSuccess && (
                <div className="manual-add-success">
                    &#x2705; {lastAdded.toLocaleString('en-IN')} jaap successfully add ho gaye!
                </div>
            )}

            <p className="manual-add-note">
                Ye value aaj aur total dono mein add ho jayegi
            </p>
        </div>
    );
}
