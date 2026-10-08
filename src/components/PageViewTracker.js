'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { logPageView } from '@/lib/activityLogService';

const ROUTE_NAMES = {
  '/': 'หน้าหลักพอร์ทัล (Portal Dashboard)',
  '/organization': 'โครงสร้างองค์กรและบุคลากร (Organization & Directory)',
  '/profile': 'ประวัติและข้อมูลส่วนบุคคล (Profile)',
  '/time-attendance': 'ขอลงเวลาปฏิบัติงาน / WFH / OT (Time Attendance)',
  '/leave': 'ปฏิทินวันลาและสถิติ (Leave Calendar)',
  '/jd-hub': 'แบบบรรยายลักษณะงาน (JD Hub)',
  '/idp-hub': 'แผนพัฒนารายบุคคล (IDP Hub)',
  '/idp-hub/action-plan': 'แผนปฏิบัติการ IDP (IDP Action Plan)',
  '/skill-map': 'แผนที่ทักษะบุคลากร (Skill Map)',
  '/km-hub': 'จัดการองค์ความรู้ & ติดตามผลการอบรม (KM Hub)',
  '/ims': 'ระบบบริหารจัดการมาตรฐานสากล (IMS Hub)',
  '/tqa': 'รายงานผลหมวด TQA OFI (TQA Hub)',
  '/admin': 'แผงควบคุมระบบของผู้ดูแล (Admin Console)',
};

export default function PageViewTracker() {
  const pathname = usePathname();
  const { currentUser, currentPersonnel } = useAuth();
  const prevPathRef = useRef(null);

  useEffect(() => {
    if (!pathname) return;

    // Resolve human-friendly title
    let title = ROUTE_NAMES[pathname];
    if (!title) {
      if (pathname.startsWith('/admin')) title = 'แผงควบคุมระบบ (Admin Console)';
      else if (pathname.startsWith('/idp-hub')) title = 'แผนพัฒนารายบุคคล (IDP Hub)';
      else if (pathname.startsWith('/ims')) title = 'ระบบบริหารจัดการมาตรฐาน (IMS Hub)';
      else title = pathname;
    }

    const userForLog = currentPersonnel || currentUser || null;

    // Trigger logPageView with 15s debounce built-in
    logPageView(pathname, title, userForLog);
    prevPathRef.current = pathname;
  }, [pathname, currentUser, currentPersonnel]);

  return null;
}
