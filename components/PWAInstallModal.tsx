'use client';

import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import {
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  CheckCircle2,
  X,
  Flame,
  Check,
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PWAInstallModal({ isOpen, onClose }: PWAInstallModalProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [platform, setPlatform] = useState<'ios' | 'android'>(
    isIOS ? 'ios' : 'android'
  );
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Install EMBER on iPhone & Android"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#202121',
          border: '1px solid #3d403a',
          borderRadius: '16px',
          padding: '24px',
          color: '#efefed',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#ff7a35',
                color: '#1a1a1a',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Flame size={22} fill="currentColor" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 650, margin: 0, lineHeight: 1.2 }}>Install EMBER</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#969895' }}>
                Full-screen app for iPhone & Android
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'none',
              border: 0,
              color: '#969895',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {isInstalled ? (
          <div
            style={{
              textAlign: 'center',
              padding: '28px 16px',
              backgroundColor: '#262923',
              borderRadius: '12px',
              border: '1px solid #3f4735',
            }}
          >
            <CheckCircle2 size={42} color="#9ec47e" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', margin: '0 0 6px', fontWeight: 600 }}>EMBER is Installed!</h3>
            <p style={{ fontSize: '13px', color: '#a0a39d', margin: 0 }}>
              You are currently running EMBER in standalone app mode on your device.
            </p>
          </div>
        ) : (
          <>
            {/* Direct Android / Chrome 1-click button if available */}
            {isInstallable && (
              <div
                style={{
                  backgroundColor: '#2b231c',
                  border: '1px solid #63391e',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#ffb38a', display: 'block' }}>Quick Install Ready</strong>
                    <span style={{ fontSize: '12px', color: '#c7a793' }}>Install EMBER directly to your home screen</span>
                  </div>
                  <button
                    onClick={handleNativeInstall}
                    className="primary"
                    style={{
                      backgroundColor: '#ff7a35',
                      color: '#1a1715',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontWeight: 650,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    {installSuccess ? <Check size={16} /> : <Download size={16} />}
                    {installSuccess ? 'Installed' : 'Install Now'}
                  </button>
                </div>
              </div>
            )}

            {/* Platform Selector Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                backgroundColor: '#191a1a',
                padding: '4px',
                borderRadius: '10px',
                marginBottom: '20px',
              }}
            >
              <button
                type="button"
                onClick={() => setPlatform('ios')}
                style={{
                  border: 0,
                  backgroundColor: platform === 'ios' ? '#333533' : 'transparent',
                  color: platform === 'ios' ? '#ff9a60' : '#8f928e',
                  fontWeight: platform === 'ios' ? 600 : 400,
                  fontSize: '13px',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.15s',
                }}
              >
                <Smartphone size={16} /> iPhone / iPad
              </button>
              <button
                type="button"
                onClick={() => setPlatform('android')}
                style={{
                  border: 0,
                  backgroundColor: platform === 'android' ? '#333533' : 'transparent',
                  color: platform === 'android' ? '#ff9a60' : '#8f928e',
                  fontWeight: platform === 'android' ? 600 : 400,
                  fontSize: '13px',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.15s',
                }}
              >
                <Smartphone size={16} /> Android
              </button>
            </div>

            {/* Step-by-Step Instructions */}
            {platform === 'ios' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '12px 14px',
                    backgroundColor: '#262726',
                    borderRadius: '10px',
                    border: '1px solid #333533',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#373a35',
                      color: '#ff985d',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    1
                  </div>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#e5e6e1', display: 'block', marginBottom: '2px' }}>
                      Open in Safari
                    </strong>
                    <p style={{ margin: 0, fontSize: '12px', color: '#939791' }}>
                      Make sure you are browsing in <strong>Safari</strong> on iOS.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '12px 14px',
                    backgroundColor: '#262726',
                    borderRadius: '10px',
                    border: '1px solid #333533',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#373a35',
                      color: '#ff985d',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    2
                  </div>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#e5e6e1', display: 'block', marginBottom: '2px' }}>
                      Tap the Share button
                    </strong>
                    <p style={{ margin: 0, fontSize: '12px', color: '#939791', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Look for the <Share2 size={14} color="#ff985d" /> Share icon in the Safari navigation bar (bottom on iPhone, top on iPad).
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '12px 14px',
                    backgroundColor: '#262726',
                    borderRadius: '10px',
                    border: '1px solid #333533',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#373a35',
                      color: '#ff985d',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    3
                  </div>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#e5e6e1', display: 'block', marginBottom: '2px' }}>
                      Tap &quot;Add to Home Screen&quot;
                    </strong>
                    <p style={{ margin: 0, fontSize: '12px', color: '#939791', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Scroll down the share sheet and tap <PlusSquare size={14} color="#ff985d" /> <strong>Add to Home Screen</strong>.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '12px 14px',
                    backgroundColor: '#262726',
                    borderRadius: '10px',
                    border: '1px solid #333533',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#373a35',
                      color: '#ff985d',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    4
                  </div>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#e5e6e1', display: 'block', marginBottom: '2px' }}>
                      Tap &quot;Add&quot; in top-right
                    </strong>
                    <p style={{ margin: 0, fontSize: '12px', color: '#939791' }}>
                      Confirm the name <strong>EMBER</strong>. The app icon will appear on your iPhone home screen!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '12px 14px',
                    backgroundColor: '#262726',
                    borderRadius: '10px',
                    border: '1px solid #333533',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#373a35',
                      color: '#ff985d',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    1
                  </div>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#e5e6e1', display: 'block', marginBottom: '2px' }}>
                      Open in Chrome or Edge
                    </strong>
                    <p style={{ margin: 0, fontSize: '12px', color: '#939791' }}>
                      Visit this app on your Android phone using Chrome, Brave, or Samsung Internet.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '12px 14px',
                    backgroundColor: '#262726',
                    borderRadius: '10px',
                    border: '1px solid #333533',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#373a35',
                      color: '#ff985d',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    2
                  </div>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#e5e6e1', display: 'block', marginBottom: '2px' }}>
                      Tap the Menu (⋮) or Install banner
                    </strong>
                    <p style={{ margin: 0, fontSize: '12px', color: '#939791' }}>
                      Tap the 3 dots in the top-right corner of Chrome.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '12px 14px',
                    backgroundColor: '#262726',
                    borderRadius: '10px',
                    border: '1px solid #333533',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#373a35',
                      color: '#ff985d',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    3
                  </div>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#e5e6e1', display: 'block', marginBottom: '2px' }}>
                      Select &quot;Install app&quot; or &quot;Add to Home screen&quot;
                    </strong>
                    <p style={{ margin: 0, fontSize: '12px', color: '#939791' }}>
                      Android will generate an standalone WebAPK with full-screen access and splash screen.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: '20px',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: '#1b1d1b',
                border: '1px solid #30332e',
                fontSize: '12px',
                color: '#9ba098',
                lineHeight: 1.5,
              }}
            >
              💡 <strong>Why install?</strong> Running EMBER as an app removes browser URL bars, gives you faster instant loading, standalone fitness timer tracking, and saves entries directly on your device.
            </div>
          </>
        )}

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2c2e2c',
              border: '1px solid #3d403a',
              color: '#d6dad3',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
