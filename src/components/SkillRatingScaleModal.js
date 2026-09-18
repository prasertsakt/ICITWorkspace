'use client';

import React from 'react';
import { X, Target, Info, CheckCircle2 } from 'lucide-react';
import { SKILL_RATING_LEVELS } from '@/lib/skillMapService';

export default function SkillRatingScaleModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1.25rem',
          maxWidth: '780px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(249, 115, 22, 0.35)',
              }}
            >
              <Target size={20} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                เกณฑ์ระดับการประเมินความรู้และทักษะ (0 - 5 Rating Scale)
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8' }}>
                มาตรฐานการประเมินตนเองและจัดทำแผนพัฒนาบุคลากรรายบุคคล (IDP) สำนักฯ ICIT
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#FFFFFF',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              backgroundColor: '#EEF2FF',
              border: '1px solid #C7D2FE',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '0.82rem',
              color: '#3730A3',
              lineHeight: 1.5,
            }}
          >
            <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>คำแนะนำ:</strong> บุคลากรทุกคนทำการประเมินตนเองในทุกชุดทักษะทั้ง 4 ด้านงาน โดยให้คะแนนตามระดับความเชี่ยวชาญจริงในปัจจุบัน (เกณฑ์ระดับ 3 คือเกณฑ์มาตรฐานการปฏิบัติงาน)
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SKILL_RATING_LEVELS.map((lvl) => (
              <div
                key={lvl.score}
                style={{
                  backgroundColor: lvl.bgColor,
                  border: `1.5px solid ${lvl.color}40`,
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'transform 0.15s ease',
                }}
              >
                <div
                  style={{
                    backgroundColor: lvl.color,
                    color: '#FFFFFF',
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1.25rem',
                    boxShadow: `0 4px 10px ${lvl.color}40`,
                    flexShrink: 0,
                  }}
                >
                  <span>{lvl.score}</span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.98rem', color: lvl.badgeColor }}>
                      ระดับ {lvl.score} : {lvl.label}
                    </span>
                    {lvl.score === 3 && (
                      <span
                        style={{
                          backgroundColor: '#4F46E5',
                          color: '#FFFFFF',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                        }}
                      >
                        เกณฑ์มาตรฐาน
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.45 }}>
                    {lvl.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 22px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            เข้าใจแล้ว / ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
