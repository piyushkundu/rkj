'use client';

import { Flower2 } from 'lucide-react';

interface UserSelectModalProps {
    onSelect: (userId: string, displayName: string) => void;
}

export default function UserSelectModal({ onSelect }: UserSelectModalProps) {
    return (
        <div className="modal-overlay">
            <div className="modal glass-card">
                <div className="modal-icon">
                    <Flower2 size={48} />
                </div>
                <h2 className="modal-title">Radha Naam Jaap</h2>
                <p className="modal-subtitle">
                    &ldquo;Radha Naam hi jeevan ka sahara hai&rdquo;
                </p>
                <p className="modal-instruction">Apna parichay chunein:</p>

                <div className="modal-buttons">
                    <button
                        className="modal-user-btn"
                        onClick={() => onSelect('sevak1', 'Sevak 1')}
                    >
                        <span className="modal-user-emoji">&#x1F64F;</span>
                        <span className="modal-user-name">Sevak 1</span>
                    </button>
                    <button
                        className="modal-user-btn"
                        onClick={() => onSelect('sevak2', 'Sevak 2')}
                    >
                        <span className="modal-user-emoji">&#x1F64F;</span>
                        <span className="modal-user-name">Sevak 2</span>
                    </button>
                </div>

                <p className="modal-footer">Radhe Radhe &#x1F338;</p>
            </div>
        </div>
    );
}
