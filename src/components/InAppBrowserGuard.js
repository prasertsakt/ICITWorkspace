'use client';

import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  X,
  Compass,
  AlertTriangle,
  Smartphone,
} from 'lucide-react';
import {
  isInAppBrowser,
  isLineBrowser,
  isAndroid,
  isIOS,
  navigateToExternalBrowser,
  appendOpenExternalBrowser,
} from '@/lib/inAppBrowser';

export default function InAppBrowserGuard() {
  const [inApp, setInApp] = useState(false);
  const [appName, setAppName] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if in an in-app browser
    const detected = isInAppBrowser();
    if (!detected) {
      // If we are in a regular external browser and URL has openExternalBrowser=1, cleanly remove it from URL bar
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('openExternalBrowser')) {
        urlParams.delete('openExternalBrowser');
        const newSearch = urlParams.toString() ? `?${urlParams.toString()}` : '';
        const cleanUrl = `${window.location.pathname}${newSearch}${window.location.hash}`;
        window.history.replaceState({}, '', cleanUrl);
      }
      return;
    }

    setInApp(true);

    // Identify specific app name
    const ua = navigator.userAgent || '';
    if (/Line\//i.test(ua)) setAppName('LINE');
    else if (/FBAN|FBAV/i.test(ua)) setAppName('Facebook');
    else if (/Instagram/i.test(ua)) setAppName('Instagram');
    else if (/Twitter/i.test(ua)) setAppName('X (Twitter)');
    else setAppName('In-App Browser');

    // For LINE: if URL doesn't have openExternalBrowser=1 yet, automatically navigate
    if (isLineBrowser()) {
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.has('openExternalBrowser')) {
        navigateToExternalBrowser();
        return;
      }
    }
  }, []);

  const handleOpenExternal = () => {
    navigateToExternalBrowser();
  };

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    try {
      const targetUrl = appendOpenExternalBrowser(window.location.href);
      await navigator.clipboard.writeText(targetUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      // Fallback copy
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  if (!inApp || isDismissed) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
        color: '#FFFFFF',
        padding: '12px 16px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
        borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
        fontFamily: "'Kanit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.25)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} color="#FCA5A5" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>ตรวจพบการเปิดในแอป {appName} (In-App Browser)</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: 'rgba(255,255,255,0.2)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  ความปลอดภัย
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', opacity: 0.9, lineHeight: 1.4 }}>
                ระบบล็อกอิน Google (@cit.kmutnb.ac.th) มีนโยบายความปลอดภัยบล็อก In-App Browser 
                กรุณาเปิดใน <strong>{isIOS() ? 'Safari' : isAndroid() ? 'Google Chrome' : 'เบราว์เซอร์หลัก'}</strong> เพื่อใช้งานได้ครบทุกฟังก์ชัน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="ปิดการแจ้งเตือน"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Controls & Instructions */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            paddingTop: '6px',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div style={{ fontSize: '0.78rem', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Compass size={14} />
            <span>
              {isIOS() 
                ? 'วิธีเปิด: แตะปุ่ม ⋯ หรือ ⋮ ที่มุมหน้าจอ แล้วเลือก "เปิดด้วย Safari"'
                : 'วิธีเปิด: แตะปุ่ม ⋮ ที่มุมหน้าจอ แล้วเลือก "เปิดใน Chrome / เบราว์เซอร์ภายนอก"'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleOpenExternal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)',
              }}
            >
              <ExternalLink size={14} />
              <span>เปิดในเบราว์เซอร์หลัก</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {isCopied ? <Check size={14} color="#86EFAC" /> : <Copy size={14} />}
              <span>{isCopied ? 'คัดลอกลิงก์แล้ว!' : 'คัดลอกลิงก์'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
