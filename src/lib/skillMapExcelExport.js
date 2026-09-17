import * as XLSX from 'xlsx';
import { formatDateDDMMYYYYBE } from './dateUtils';
import { calculateAssessmentSummary } from './skillMapService';

/**
 * Export Knowledge & Skill Map data to Excel (.xlsx)
 * @param {Object} options
 * @param {string} options.fiscalYear - e.g. "2569"
 * @param {Array} options.workAreas - Array of work area objects with competencies and subSkills
 * @param {Array} options.personnelList - Array of personnel records
 * @param {Array} options.assessments - Array of assessment records for this fiscal year
 */
export function exportSkillMapToExcel({ fiscalYear, workAreas = [], personnelList = [], assessments = [] }) {
  try {
    const wb = XLSX.utils.book_new();

    // Exclude Executive personnel
    const actualStaffList = (personnelList || []).filter(
      (p) => p.department !== 'คณะผู้บริหาร' && p.position !== 'ผู้บริหาร' && !p.isExecutive && p.status !== 'ลาออก'
    );

    // ----------------------------------------------------
    // Sheet 1: สรุปผลการประเมินภาพรวม (Assessment Summary)
    // ----------------------------------------------------
    const summaryRows = [];
    
    // Header Info
    summaryRows.push([`รายงานผลการประเมิน Knowledge & Skill Map สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT)`]);
    summaryRows.push([`ประจำปีงบประมาณ พ.ศ. ${fiscalYear}`, '', '', '', '', '', '', '', '', '']);
    summaryRows.push([`วันที่ส่งออกข้อมูล: ${formatDateDDMMYYYYBE(new Date().toISOString())}`, '', '', '', '', '', '', '', '', '']);
    summaryRows.push([]); // Empty row

    // Table Headers
    const areaHeaders = workAreas.map((a) => `เฉลี่ย: ${a.shortName || a.name}`);
    const headers = [
      'ลำดับ',
      'ชื่อ - นามสกุล',
      'ตำแหน่ง',
      'ฝ่ายงาน',
      'อีเมล',
      'สถานะการประเมิน',
      'จำนวนที่ประเมินแล้ว (ข้อ)',
      'ร้อยละความสมบูรณ์ (%)',
      'คะแนนเฉลี่ยรวม (เต็ม 5)',
      ...areaHeaders,
      'วันที่บันทึกล่าสุด',
    ];
    summaryRows.push(headers);

    // Total subskills count across all areas
    let totalSubSkillsCount = 0;
    workAreas.forEach((area) => {
      (area.competencies || []).forEach((c) => {
        totalSubSkillsCount += (c.subSkills || []).length;
      });
    });

    // Populate data rows for each personnel
    let no = 1;
    actualStaffList.forEach((pers) => {
      const userAssessment = assessments.find((a) => a.personnelId === pers.id);
      const ratings = userAssessment?.ratings || {};
      const summ = calculateAssessmentSummary(workAreas, ratings);

      const isDone = summ.completedCount === totalSubSkillsCount && totalSubSkillsCount > 0;
      const isStarted = summ.completedCount > 0;
      const statusText = isDone ? 'ประเมินครบถ้วน' : isStarted ? 'กำลังประเมิน' : 'ยังไม่ประเมิน';

      const areaAvgScores = workAreas.map((area) => {
        const aSumm = summ.areaSummaries[area.id];
        return aSumm ? aSumm.averageScore : 0;
      });

      const updatedDateStr = userAssessment?.updatedAt ? formatDateDDMMYYYYBE(userAssessment.updatedAt) : '-';

      summaryRows.push([
        no++,
        pers.name || '-',
        pers.position || '-',
        pers.department || '-',
        pers.email || '-',
        statusText,
        summ.completedCount,
        summ.completionPercentage,
        summ.overallAverage,
        ...areaAvgScores,
        updatedDateStr,
      ]);
    });

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    
    // Set column widths
    wsSummary['!cols'] = [
      { wch: 8 },  // ลำดับ
      { wch: 26 }, // ชื่อ-นามสกุล
      { wch: 22 }, // ตำแหน่ง
      { wch: 32 }, // ฝ่ายงาน
      { wch: 28 }, // อีเมล
      { wch: 16 }, // สถานะ
      { wch: 20 }, // จำนวนที่ประเมิน
      { wch: 20 }, // ร้อยละ
      { wch: 20 }, // เฉลี่ยรวม
      ...workAreas.map(() => ({ wch: 22 })),
      { wch: 18 }, // วันที่บันทึก
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปผลการประเมินภาพรวม');

    // ----------------------------------------------------
    // Sheet 2: เมทริกซ์ทักษะรายบุคคล (Detailed Skill Matrix)
    // ----------------------------------------------------
    const matrixRows = [];
    matrixRows.push([`เมทริกซ์ระดับคะแนนทักษะรายบุคคล (Knowledge & Skill Matrix) ปีงบประมาณ ${fiscalYear}`]);
    matrixRows.push([]);

    // Collect all subskills in order
    const allSubSkills = [];
    workAreas.forEach((area) => {
      (area.competencies || []).forEach((comp) => {
        (comp.subSkills || []).forEach((sub) => {
          allSubSkills.push({
            areaName: area.shortName || area.name,
            compName: comp.name,
            subSkillId: sub.id,
            subSkillName: sub.name,
          });
        });
      });
    });

    // Header row 1: Groups
    const groupRow = ['ลำดับ', 'ชื่อ - นามสกุล', 'ฝ่ายงาน', 'คะแนนเฉลี่ยรวม', ...allSubSkills.map((s) => s.areaName)];
    // Header row 2: Competency Name
    const compRow = ['', '', '', '', ...allSubSkills.map((s) => s.compName)];
    // Header row 3: SubSkill Name
    const subSkillRow = ['', '', '', '', ...allSubSkills.map((s) => s.subSkillName)];

    matrixRows.push(groupRow);
    matrixRows.push(compRow);
    matrixRows.push(subSkillRow);

    let matrixNo = 1;
    actualStaffList.forEach((pers) => {
      const userAssessment = assessments.find((a) => a.personnelId === pers.id);
      const ratings = userAssessment?.ratings || {};
      const summ = calculateAssessmentSummary(workAreas, ratings);

      const scores = allSubSkills.map((s) => {
        const score = ratings[s.subSkillId];
        return score !== undefined ? score : '-';
      });

      matrixRows.push([
        matrixNo++,
        pers.name || '-',
        pers.department || '-',
        summ.overallAverage,
        ...scores,
      ]);
    });

    const wsMatrix = XLSX.utils.aoa_to_sheet(matrixRows);
    wsMatrix['!cols'] = [
      { wch: 8 },
      { wch: 26 },
      { wch: 30 },
      { wch: 15 },
      ...allSubSkills.map(() => ({ wch: 25 })),
    ];
    XLSX.utils.book_append_sheet(wb, wsMatrix, 'เมทริกซ์คะแนนทักษะรายบุคคล');

    // ----------------------------------------------------
    // Sheet 3: โครงสร้างความรู้และทักษะมาตรฐาน (Competency Dictionary)
    // ----------------------------------------------------
    const structRows = [];
    structRows.push([`โครงสร้างความรู้และทักษะมาตรฐาน สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT) ปีงบประมาณ ${fiscalYear}`]);
    structRows.push([]);
    structRows.push(['ด้านงานหลัก (Work Area)', 'รหัสด้านงาน', 'สมรรถนะ (Competency)', 'รหัสสมรรถนะ', 'ทักษะย่อย / ความรู้ (Sub-Skill)', 'รหัสทักษะ', 'คำอธิบายทักษะ']);

    workAreas.forEach((area) => {
      (area.competencies || []).forEach((comp) => {
        (comp.subSkills || []).forEach((sub) => {
          structRows.push([
            area.name,
            area.id,
            comp.name,
            comp.id,
            sub.name,
            sub.id,
            sub.description || '-',
          ]);
        });
      });
    });

    const wsStruct = XLSX.utils.aoa_to_sheet(structRows);
    wsStruct['!cols'] = [
      { wch: 32 },
      { wch: 14 },
      { wch: 35 },
      { wch: 16 },
      { wch: 38 },
      { wch: 16 },
      { wch: 60 },
    ];
    XLSX.utils.book_append_sheet(wb, wsStruct, 'โครงสร้างทักษะมาตรฐาน');

    // Write and trigger download
    const filename = `ICIT_Knowledge_Skill_Map_FY${fiscalYear}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  } catch (err) {
    console.error('exportSkillMapToExcel error:', err);
    alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel: ' + (err.message || 'Unknown error'));
  }
}
