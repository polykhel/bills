import { useEffect, useMemo, useState } from 'react';
import type { VisibilityState, ColumnSizingState } from '@tanstack/react-table';
import { Storage } from '../../../../lib/storage';

export interface ColumnLayoutState {
  visibility: VisibilityState;
  sizing: ColumnSizingState;
}

interface UseColumnLayoutProps {
  tableId: string;
  profileId?: string | null;
  initialVisibility?: VisibilityState;
  initialSizing?: ColumnSizingState;
}

export function useColumnLayout({
  tableId,
  profileId,
  initialVisibility,
  initialSizing,
}: UseColumnLayoutProps) {
  const [visibility, setVisibility] = useState<VisibilityState>(initialVisibility ?? {});
  const [sizing, setSizing] = useState<ColumnSizingState>(initialSizing ?? {});

  // Load saved layout when profile or table changes
  useEffect(() => {
    if (!profileId) return;
    const saved = Storage.getColumnLayout(profileId, tableId);
    if (!saved) return;

    if (saved.visibility) {
      setVisibility(saved.visibility as VisibilityState);
    }
    if (saved.sizing) {
      setSizing(saved.sizing as ColumnSizingState);
    }
  }, [profileId, tableId]);

  // Persist whenever the layout changes
  useEffect(() => {
    if (!profileId) return;
    Storage.saveColumnLayout(profileId, tableId, {
      visibility,
      sizing,
    });
  }, [visibility, sizing, profileId, tableId]);

  const layout = useMemo<ColumnLayoutState>(
    () => ({ visibility, sizing }),
    [visibility, sizing]
  );

  const resetLayout = (next: Partial<ColumnLayoutState>) => {
    if (next.visibility) setVisibility(next.visibility);
    if (next.sizing) setSizing(next.sizing);
  };

  return {
    layout,
    setVisibility,
    setSizing,
    resetLayout,
  };
}
