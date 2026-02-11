'use client';

import { Heart } from 'lucide-react';

interface CombinedTotalProps {
    total: number;
}

export default function CombinedTotal({ total }: CombinedTotalProps) {
    return (
        <div className="combined-total glass-card">
            <div className="combined-total-icon">
                <Heart size={22} fill="currentColor" />
            </div>
            <p className="combined-total-label">Hum dono ne milkar:</p>
            <p className="combined-total-value">
                {total.toLocaleString('en-IN')} Jaap
            </p>
            <p className="combined-total-emoji">&#x1F64F; Radhe Radhe</p>
        </div>
    );
}
