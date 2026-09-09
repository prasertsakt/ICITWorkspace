'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  Building2,
  Edit3,
  Trash2,
  Eye,
  Settings,
  Lock,
  LogIn,
  AlertCircle,
  Sparkles,
  UserCheck,
  ShieldAlert,
  Info,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import {
  subscribeToJobDescriptions,
  subscribeToJDConfig,
  isRevisionWindowOpen,
  saveJDRecord,
} from '@/lib/jdService';
import { SAMPLE_SEED_JD, createBlankJD } from '@/lib/jdTemplateData';
import JDPreviewModal from '@/components/JDPreviewModal';
import JDModal from '@/components/JDModal';
import JDConfigModal from '@/components/JDConfigModal';
import JDDeleteModal from '@/components/JDDeleteModal';

export default function JDHubPage() {
  const { user, currentPersonnel, isAdmin, isAuthLoading, loginWithGoogle } = useAuth();

  // Data state
  const [jds, setJds] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'CONFIRMED' | 'DRAFT'
  const [myJdOnly, setMyJdOnly] = useState(false);

  // Modals state
  const [previewJD, setPreviewJD] = useState(null);
  const [editingJD, setEditingJD] = useState(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [deletingJD, setDeletingJD] = useState(null);

  // Real-time subscriptions
  useEffect(() => {
    // JD records subscription
    const unsubJDs = subscribeToJobDescriptions((data) => {
      // If empty in fresh DB, initialize with sample seed for demonstration
      if (!data || data.length === 0) {
        setJds([SAMPLE_SEED_JD]);
      } else {
        setJds(data);
      }
      setLoading(false);
    });

    // JD revision config subscription
    const unsubConfig = subscribeToJDConfig((cfg) => {
      setConfig(cfg);
    });

    return () => {
      if (unsubJDs) unsubJDs();
      if (unsubConfig) unsubConfig();
    };
  }, []);

  // Compute revision window status
  const windowStatus = useMemo(() => {
    return isRevisionWindowOpen(config);
  }, [config]);

  // Current logged in user's email
  const userEmail = (user?.email || currentPersonnel?.email || '').toLowerCase().trim();

  // Filtered JDs
  const filteredJDs = useMemo(() => {
    return jds.filter((item) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (item.personnelName || '').toLowerCase().includes(q);
        const matchesPos = (item.positionTitle || '').toLowerCase().includes(q);
        const matchesNo = (item.positionNo || '').toLowerCase().includes(q);
        const matchesDept = (item.department || '').toLowerCase().includes(q);
        const matchesEmail = (item.personnelEmail || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPos && !matchesNo && !matchesDept && !matchesEmail) {
          return false;
        }
      }

      // Dept filter
      if (selectedDept !== 'ALL' && item.department !== selectedDept) {
        return false;
      }

      // Status filter
      if (statusFilter === 'CONFIRMED' && item.status !== 'CONFIRMED') return false;
      if (statusFilter === 'DRAFT' && item.status === 'CONFIRMED') return false;

      // My JD only filter
      if (myJdOnly) {
        const itemEmail = (item.personnelEmail || '').toLowerCase().trim();
        if (!userEmail || itemEmail !== userEmail) return false;
      }

      return true;
    });
  }, [jds, searchQuery, selectedDept, statusFilter, myJdOnly, userEmail]);

  // Department list for dropdown
  const departments = useMemo(() => {
    const list = Array.from(new Set(jds.map((j) => j.department).filter(Boolean)));
    return list.sort();
  }, [jds]);

  // Minimal dashboard stats
  const stats = useMemo(() => {
    const total = jds.length;
    const confirmed = jds.filter((j) => j.status === 'CONFIRMED').length;
    const draft = total - confirmed;
    const percent = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    return { total, confirmed, draft, percent };
  }, [jds]);

  // Check if current user can edit a specific JD
  const canUserEdit = (jd) => {
    if (isAdmin) return true; // Admin can always edit
    if (!windowStatus.isOpen) return false; // Window is closed
    const itemEmail = (jd.personnelEmail || '').toLowerCase().trim();
    return userEmail && itemEmail === userEmail; // User can only edit own JD
  };

  // Handle create new JD
  const handleCreateNew = () => {
    const newJD = createBlankJD(currentPersonnel || { name: '', email: user?.email });
    setEditingJD(newJD);
  };

  // ==========================================
  // AUTH GUARD / LOGIN GATE
  // ==========================================
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium text-sm">กำลังตรวจสอบสิทธิ์การเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-orange-500/30">
            <FileText className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">ระบบจัดการ Job Description (JD Hub)</h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT)<br />
              มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
            </p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-left text-xs space-y-2 text-slate-300">
            <div className="flex items-center gap-2 text-orange-400 font-semibold">
              <Lock className="w-4 h-4" />
              <span>บริการนี้ต้องเข้าสู่ระบบ</span>
            </div>
            <p>กรุณาลงชื่อเข้าใช้ด้วยอีเมลมหาวิทยาลัย (@kmutnb.ac.th) เพื่อดูและจัดการแบบบรรยายลักษณะงานของคุณ</p>
          </div>

          <button
            onClick={loginWithGoogle}
            className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 group"
          >
            <LogIn className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            เข้าสู่ระบบด้วย Google KMUTNB
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 pb-24">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-orange-950 to-slate-900 text-white border-b border-orange-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-md">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">JD Hub</h1>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    ICIT Job Description Management System
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-300 max-w-2xl mt-2 leading-relaxed">
                ระบบจัดการและทบทวนแบบบรรยายลักษณะงาน (Job Description) ตามมาตรฐาน ICIT-FM-COMMON-006 v2.0
                ตรวจสอบหน้าที่ความรับผิดชอบ สมรรถนะ และความก้าวหน้าในสายงาน
              </p>
            </div>

            {/* Quick Actions for Admin */}
            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <>
                  <button
                    onClick={() => setIsConfigOpen(true)}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-2 backdrop-blur-sm"
                  >
                    <Settings className="w-4 h-4 text-orange-400" />
                    ตั้งค่าช่วงเวลาแก้ไข
                  </button>
                  <button
                    onClick={handleCreateNew}
                    className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl text-xs font-semibold text-white shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    สร้าง JD ใหม่
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Revisable Period Notification Banner */}
        <div className="mb-6">
          {windowStatus.isOpen ? (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-sm flex-shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-900 text-sm sm:text-base">
                      เปิดให้ทบทวนและแก้ไข Job Description ประจำปี
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                      เปิดใช้งาน
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {windowStatus.message}
                    {config?.announcement ? ` — ${config.announcement}` : ''}
                  </p>
                </div>
              </div>
              <div className="text-xs text-emerald-800 bg-white/80 border border-emerald-200 px-3.5 py-2 rounded-xl flex-shrink-0 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>บุคลากรสามารถแก้ไขและกดยืนยัน JD ของตนเองได้ทันที</span>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 via-slate-50 to-amber-50 border border-amber-200 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-900 text-sm sm:text-base">
                      ยังไม่เปิดช่วงเวลาแก้ไขสำหรับบุคลากร
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                      View Only
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {windowStatus.message}
                    {config?.announcement ? ` — ${config.announcement}` : ' (บุคลากรสามารถดูแบบบรรยายลักษณะงานในรูปแบบ PDF ได้ตามปกติ)'}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setIsConfigOpen(true)}
                  className="text-xs text-amber-900 font-semibold bg-amber-200/80 hover:bg-amber-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors self-start md:self-auto"
                >
                  <Settings className="w-3.5 h-3.5" />
                  เปิดช่วงเวลาให้บุคลากรแก้ไข
                </button>
              )}
            </div>
          )}
        </div>

        {/* Minimal Dashboard Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Total JDs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">JD ทั้งหมด</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{stats.total}</div>
              <div className="text-xs text-slate-400 mt-1">ตำแหน่งในสังกัด</div>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Confirmed JDs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ยืนยันแล้ว</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{stats.confirmed}</div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.percent}%` }}
                ></div>
              </div>
              <div className="text-[11px] text-slate-400 text-right mt-1 font-medium">{stats.percent}% ยืนยันแล้ว</div>
            </div>
          </div>

          {/* Card 3: Drafts / In progress */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ฉบับร่าง / รอทบทวน</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">{stats.draft}</div>
              <div className="text-xs text-slate-400 mt-1">ยังไม่ได้รับการยืนยัน</div>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Revision Window State */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">สถานะการแก้ไข</div>
              <div className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    windowStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                ></span>
                {windowStatus.isOpen ? 'เปิดให้แก้ไข' : 'ปิดการแก้ไข'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {isAdmin ? 'Admin แก้ไขได้ตลอดเวลา' : 'เฉพาะช่วงเวลาที่เปิด'}
              </div>
            </div>
            <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อผู้ครองตำแหน่ง, ตำแหน่ง, เลขที่ตำแหน่ง..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Department Filter */}
            <div className="relative min-w-[200px]">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700 bg-white"
              >
                <option value="ALL">ทุกฝ่าย / กลุ่มงาน</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[150px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700 bg-white"
              >
                <option value="ALL">ทุกสถานะ</option>
                <option value="CONFIRMED">ยืนยันแล้ว</option>
                <option value="DRAFT">ฉบับร่าง</option>
              </select>
            </div>
          </div>

          {/* Quick Toggle: My JD Only */}
          <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <button
              onClick={() => setMyJdOnly(!myJdOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                myJdOnly
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              เฉพาะ JD ของฉัน
            </button>
          </div>
        </div>

        {/* JD Cards Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-500 text-sm">กำลังโหลดข้อมูล Job Description...</p>
          </div>
        ) : filteredJDs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">ไม่พบแบบบรรยายลักษณะงาน</h3>
            <p className="text-xs text-slate-500 mb-4">
              {myJdOnly
                ? 'ยังไม่มี JD ที่ผูกกับอีเมลของคุณในระบบ หรือยังไม่ได้รับการสร้าง'
                : 'ไม่พบรายการที่ตรงตามคำค้นหาและตัวกรองที่เลือก'}
            </p>
            {isAdmin && (
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                สร้าง JD รายการแรก
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJDs.map((jd) => {
              const isOwner = userEmail && (jd.personnelEmail || '').toLowerCase().trim() === userEmail;
              const editable = canUserEdit(jd);

              return (
                <div
                  key={jd.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                >
                  {/* Card Header & Profile info */}
                  <div className="p-5">
                    {/* Top Row: Department & Status badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg truncate max-w-[200px]">
                        {jd.department || 'ไม่ระบุฝ่าย'}
                      </span>
                      {jd.status === 'CONFIRMED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1 flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          ยืนยันแล้ว v{jd.version || '2.0'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          ฉบับร่าง v{jd.version || '1.0'}
                        </span>
                      )}
                    </div>

                    {/* Position Title & Position No */}
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-orange-600 transition-colors line-clamp-1 mb-1">
                      {jd.positionTitle || 'ไม่ระบุชื่อตำแหน่ง'}
                    </h3>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mb-4">
                      <span>เลขที่ตำแหน่ง: <strong className="text-slate-700">{jd.positionNo || '-'}</strong></span>
                      {jd.jobLevel && (
                        <>
                          <span>•</span>
                          <span>ระดับ: <strong className="text-slate-700">{jd.jobLevel}</strong></span>
                        </>
                      )}
                    </div>

                    {/* Personnel holder badge */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                        {jd.personnelName ? jd.personnelName.charAt(0) : <UserIcon className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {jd.personnelName || 'ตำแหน่งว่าง'}
                          </span>
                          {isOwner && (
                            <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md flex-shrink-0">
                              คุณ
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {jd.personnelEmail || 'ยังไม่ได้ระบุอีเมล'}
                        </p>
                      </div>
                    </div>

                    {/* Quick highlights */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center justify-between">
                        <span>หน้าที่ความรับผิดชอบหลัก:</span>
                        <span className="font-semibold text-slate-700">
                          {jd.responsibilities?.length || 0} ด้าน
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>สมรรถนะประจำตำแหน่ง (FC):</span>
                        <span className="font-semibold text-slate-700">
                          {jd.functionalCompetencies?.length || 0} สมรรถนะ
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Left: Preview PDF Button */}
                    <button
                      onClick={() => setPreviewJD(jd)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5 text-orange-600" />
                      ดูเอกสาร (PDF)
                    </button>

                    {/* Right: Edit & Delete buttons */}
                    <div className="flex items-center gap-1.5">
                      {editable ? (
                        <button
                          onClick={() => setEditingJD(jd)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-all shadow-sm flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          แก้ไข
                        </button>
                      ) : isOwner && !windowStatus.isOpen ? (
                        <span
                          title="ยังไม่เปิดช่วงเวลาให้แก้ไข JD (ดูได้เฉพาะ PDF)"
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-400 bg-slate-200/70 rounded-xl flex items-center gap-1 cursor-not-allowed"
                        >
                          <Lock className="w-3 h-3" />
                          ปิดการแก้ไข
                        </span>
                      ) : null}

                      {isAdmin && (
                        <button
                          onClick={() => setDeletingJD(jd)}
                          title="ลบแบบบรรยายลักษณะงาน"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {previewJD && (
        <JDPreviewModal
          isOpen={!!previewJD}
          onClose={() => setPreviewJD(null)}
          jd={previewJD}
          onEditClick={() => {
            const toEdit = previewJD;
            setPreviewJD(null);
            setEditingJD(toEdit);
          }}
          canEdit={canUserEdit(previewJD)}
        />
      )}

      {editingJD && (
        <JDModal
          isOpen={!!editingJD}
          onClose={() => setEditingJD(null)}
          jd={editingJD}
          currentUser={user}
          isAdmin={isAdmin}
          onSaved={(savedJD) => {
            // Updated in firestore subscriber
          }}
        />
      )}

      {isConfigOpen && (
        <JDConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          currentConfig={config}
          onSaved={(newCfg) => setConfig(newCfg)}
        />
      )}

      {deletingJD && (
        <JDDeleteModal
          isOpen={!!deletingJD}
          onClose={() => setDeletingJD(null)}
          jd={deletingJD}
          onDeleted={(deletedId) => {
            setJds((prev) => prev.filter((item) => item.id !== deletedId));
          }}
        />
      )}
    </div>
  );
}
