'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Calendar, Bell, Save, X, AlertCircle } from 'lucide-react';
import { saveJDConfig } from '@/lib/jdService';

export default function JDConfigModal({ isOpen, onClose, currentConfig, onSaved }) {
  const [formData, setFormData] = useState({
    isOpen: false,
    startDate: '',
    endDate: '',
    announcement: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentConfig) {
      setFormData({
        isOpen: currentConfig.isOpen || false,
        startDate: currentConfig.startDate || '',
        endDate: currentConfig.endDate || '',
        announcement: currentConfig.announcement || '',
      });
    }
  }, [currentConfig, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const res = await saveJDConfig(formData);
      if (res.success) {
        if (onSaved) onSaved(formData);
        onClose();
      } else {
        setError(res.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">ตั้งค่าช่วงเวลาแก้ไข Job Description</h2>
              <p className="text-xs text-orange-100">กำหนดช่วงเวลาที่บุคลากรสามารถแก้ไข/ยืนยัน JD ประจำปีได้</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Toggle Active Switch */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800 text-sm">สถานะเปิดรับการแก้ไข</div>
              <p className="text-xs text-slate-500">เปิดให้บุคลากรเข้ามารีวิวและแก้ไข JD ของตนเอง</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isOpen}
                onChange={(e) => setFormData({ ...formData, isOpen: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-slate-800"
              />
            </div>
          </div>

          {/* Announcement text */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-orange-600" />
              ข้อความประกาศ / คำแนะนำ
            </label>
            <textarea
              rows={3}
              value={formData.announcement}
              onChange={(e) => setFormData({ ...formData, announcement: e.target.value })}
              placeholder="เช่น เปิดให้ทบทวนและยืนยันแบบบรรยายลักษณะงาน (Job Description) ประจำปีงบประมาณ 2568 ถึงวันที่ 30 กันยายนนี้"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Quick info alert */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-800 text-xs leading-relaxed">
            💡 <strong>คำแนะนำ:</strong> เมื่อเปิดใช้งานและอยู่ในช่วงเวลา บุคลากรจะสามารถเปิดแก้ไข JD ของตนเองได้ แต่ผู้ดูแลระบบ (Admin) จะสามารถแก้ไขหรือลบ JD ได้ตลอดเวลาไม่ว่าจะเปิดหรือปิดช่วงเวลานี้
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
