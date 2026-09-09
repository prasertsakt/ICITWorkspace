'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { deleteJDRecord } from '@/lib/jdService';

export default function JDDeleteModal({ isOpen, onClose, jd, onDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !jd) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await deleteJDRecord(jd.id);
      if (res.success) {
        if (onDeleted) onDeleted(jd.id);
        onClose();
      } else {
        setError(res.error || 'เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden flex flex-col animate-scale-up">
        {/* Header with warning icon */}
        <div className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">ยืนยันการลบแบบบรรยายลักษณะงาน (JD)</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            คุณต้องการลบข้อมูลแบบบรรยายลักษณะงานของ{' '}
            <span className="font-semibold text-slate-800">
              {jd.personnelName || jd.positionTitle || 'รายการนี้'}
            </span>{' '}
            ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
          </p>

          {jd.positionTitle && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1 text-slate-600 mt-3">
              <div><strong className="text-slate-800">ตำแหน่ง:</strong> {jd.positionTitle}</div>
              {jd.positionNo && <div><strong className="text-slate-800">เลขที่ตำแหน่ง:</strong> {jd.positionNo}</div>}
              {jd.department && <div><strong className="text-slate-800">สังกัด:</strong> {jd.department}</div>}
            </div>
          )}

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
          </button>
        </div>
      </div>
    </div>
  );
}
