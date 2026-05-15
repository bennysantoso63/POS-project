import { useMemo } from 'react';

export function useSembahyangMode(settings) {
    return useMemo(() => {
        if (!settings) return { isActive: false };
        return {
            isActive             : settings.business_type === 'sembahyang',
            lunarDisplay         : settings.sembahyang_lunar_display === '1',
            burnrateDaysAhead    : parseInt(settings.sembahyang_burnrate_days_ahead || '2'),
            anchorItemCount      : parseInt(settings.sembahyang_anchor_item_count || '10'),
            voidAnomalyThreshold : parseInt(settings.sembahyang_void_anomaly_threshold || '5'),
        };
    }, [settings]);
}
