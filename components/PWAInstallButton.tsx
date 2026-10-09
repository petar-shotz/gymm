'use client';

import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useMounted } from '@/hooks/useMounted';
import { PWAInstallModal } from './PWAInstallModal';
import { Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'topbar' | 'sidebar' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'topbar' }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);
  const mounted = useMounted();

  // Avoid SSR / client mismatch during hydration
  if (!mounted || isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        setModalOpen(true);
      }
    } else {
      setModalOpen(true);
    }
  };

  if (variant === 'sidebar') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#26201b',
            border: '1px solid #543422',
            color: '#ff985d',
            padding: '10px 14px',
            borderRadius: '9px',
            fontSize: '13px',
            fontWeight: 550,
            cursor: 'pointer',
            marginTop: '10px',
            marginBottom: '10px',
            transition: 'background 0.15s',
          }}
        >
          <Smartphone size={16} />
          <span>Get Mobile App</span>
        </button>
        <PWAInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          backgroundColor: '#30261f',
          border: '1px solid #5e3b23',
          color: '#ff9b62',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        title="Install on iPhone & Android"
      >
        <Smartphone size={14} />
        <span className="install-label">Install App</span>
      </button>
      <PWAInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
