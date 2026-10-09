'use client';

import React from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useMounted } from '@/hooks/useMounted';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const mounted = useMounted();

  if (!mounted || isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-[#b34026] text-white px-3.5 py-2 text-xs font-medium shadow-xl border border-[#ff7a35]/40 animate-pulse">
      <WifiOff size={16} />
      <span>Offline Mode — Journal entries saved locally</span>
    </div>
  );
};
