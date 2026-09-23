import {
  DEFAULT_IDP_CORE_COMPETENCIES,
  DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_BY_POSITION,
  DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_GENERAL,
} from './constants';
import { getCurrentThaiFiscalYear } from './dateUtils';

export const KMUTNB_CORE_COMPETENCIES = [
  {
    code: 'K',
    name: '1. ความใฝ่เรียนรู้ (K)',
    desc: 'ความกระตือรือร้นในการแสวงหาความรู้ พัฒนาตนเองอย่างสม่ำเสมอ',
    defaultLevel: 3,
    expectedLevels: {
      'ปฏิบัติการ': 3,
      'ชำนาญการ': 4,
      'ชำนาญการพิเศษ': 4,
    },
  },
  {
    code: 'M',
    name: '2. คุณธรรมและความซื่อสัตย์ (M)',
    desc: 'การยึดมั่นในความถูกต้อง โปร่งใส มีจริยธรรมในการปฏิบัติงาน',
    defaultLevel: 5,
    expectedLevels: {
      'ปฏิบัติการ': 5,
      'ชำนาญการ': 5,
      'ชำนาญการพิเศษ': 5,
    },
  },
  {
    code: 'U',
    name: '3. ความมุ่งมั่นให้เกิดผลสำเร็จของงาน (U)',
    desc: 'ความตั้งใจทำงานให้บรรลุเป้าหมายอย่างมีประสิทธิภาพและประสิทธิผล',
    defaultLevel: 3,
    expectedLevels: {
      'ปฏิบัติการ': 3,
      'ชำนาญการ': 4,
      'ชำนาญการพิเศษ': 4,
    },
  },
  {
    code: 'T',
    name: '4. การทำงานเป็นทีม (T)',
    desc: 'การร่วมมือ ช่วยเหลือ และประสานงานกับเพื่อนร่วมงานอย่างราบรื่น',
    defaultLevel: 3,
    expectedLevels: {
      'ปฏิบัติการ': 3,
      'ชำนาญการ': 4,
      'ชำนาญการพิเศษ': 4,
    },
  },
  {
    code: 'N',
    name: '5. จิตสำนึกรักองค์กร (N)',
    desc: 'ความภาคภูมิใจ หวงแหน และทุ่มเทเพื่อชื่อเสียงและความก้าวหน้าของ มจพ.',
    defaultLevel: 3,
    expectedLevels: {
      'ปฏิบัติการ': 3,
      'ชำนาญการ': 4,
      'ชำนาญการพิเศษ': 4,
    },
  },
  {
    code: 'B',
    name: '6. การพัฒนางานอย่างต่อเนื่อง (B)',
    desc: 'การคิดค้น ปรับปรุงกระบวนการทำงานให้ทันสมัยและมีประสิทธิภาพยิ่งขึ้น',
    defaultLevel: 3,
    expectedLevels: {
      'ปฏิบัติการ': 3,
      'ชำนาญการ': 4,
      'ชำนาญการพิเศษ': 4,
    },
  },
];

/**
 * Resolves standard Core Competencies target levels from IDP competency configuration
 * based on position level ('ปฏิบัติการ' | 'ชำนาญการ' | 'ชำนาญการพิเศษ')
 * and the current Thai Fiscal Year (ปีงบประมาณ).
 */
export function getCoreCompetenciesForLevel(positionLevel = 'ปฏิบัติการ', fiscalYear = null, customConfig = null) {
  let normalizedLevel = 'ปฏิบัติการ';
  const str = String(positionLevel || '').trim();
  if (str.includes('ชำนาญการพิเศษ') || str.includes('ชำนาญงานพิเศษ') || str.includes('พิเศษ')) {
    normalizedLevel = 'ชำนาญการพิเศษ';
  } else if (str.includes('ชำนาญการ') || str.includes('ชำนาญงาน')) {
    normalizedLevel = 'ชำนาญการ';
  } else if (str.includes('ปฏิบัติการ') || str.includes('ปฏิบัติงาน') || str.includes('ต้น')) {
    normalizedLevel = 'ปฏิบัติการ';
  } else if (str.includes('เชี่ยวชาญ')) {
    normalizedLevel = 'ชำนาญการพิเศษ';
  }

  const currentYear = String(fiscalYear || getCurrentThaiFiscalYear());

  // Check if custom config is directly provided or stored in localStorage
  let idpCoreList = DEFAULT_IDP_CORE_COMPETENCIES;

  if (Array.isArray(customConfig?.coreCompetencies) && customConfig.coreCompetencies.length > 0) {
    idpCoreList = customConfig.coreCompetencies;
  } else if (typeof window !== 'undefined') {
    try {
      // 1. Try to read from specific current fiscal year config: icit_idp_config_{fiscalYear}
      const specificRaw = localStorage.getItem(`icit_idp_config_${currentYear}`);
      if (specificRaw) {
        const parsed = JSON.parse(specificRaw);
        if (Array.isArray(parsed?.coreCompetencies) && parsed.coreCompetencies.length > 0) {
          idpCoreList = parsed.coreCompetencies;
        }
      } else {
        // 2. Fallback search across any icit_idp_config in localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('icit_idp_config')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed?.coreCompetencies) && parsed.coreCompetencies.length > 0) {
                idpCoreList = parsed.coreCompetencies;
                break;
              }
            }
          }
        }
      }
    } catch (e) {
      // Fallback to DEFAULT_IDP_CORE_COMPETENCIES
    }
  }

  return KMUTNB_CORE_COMPETENCIES.map((c, idx) => {
    const idpItem =
      idpCoreList[idx] ||
      idpCoreList.find((item) => {
        const title = item.title || item.name || '';
        return (
          title.includes(c.code) ||
          (c.code === 'K' && title.includes('ความใฝ่เรียนรู้')) ||
          (c.code === 'M' && title.includes('คุณธรรม')) ||
          (c.code === 'U' && title.includes('ความมุ่งมั่น')) ||
          (c.code === 'T' && title.includes('การทำงานเป็นทีม')) ||
          (c.code === 'N' && title.includes('จิตสำนึก')) ||
          (c.code === 'B' && title.includes('การพัฒนางาน'))
        );
      });

    let targetLevel = 3;
    if (idpItem?.expectedLevels?.[normalizedLevel] !== undefined) {
      targetLevel = Number(idpItem.expectedLevels[normalizedLevel]);
    } else if (idpItem?.expectedLevel !== undefined && normalizedLevel === 'ชำนาญการ') {
      targetLevel = Number(idpItem.expectedLevel);
    } else if (c.expectedLevels?.[normalizedLevel] !== undefined) {
      targetLevel = Number(c.expectedLevels[normalizedLevel]);
    } else {
      targetLevel = c.defaultLevel || 3;
    }

    return {
      code: c.code,
      name: c.name,
      targetLevel,
    };
  });
}

export const STANDARD_CORE_NAMES = {
  K: '1. ความใฝ่เรียนรู้ (K)',
  M: '2. คุณธรรมและความซื่อสัตย์ (M)',
  U: '3. ความมุ่งมั่นให้เกิดผลสำเร็จของงาน (U)',
  T: '4. การทำงานเป็นทีม (T)',
  N: '5. จิตสำนึกรักองค์กร (N)',
  B: '6. การพัฒนางานอย่างต่อเนื่อง (B)',
};

export function normalizeCoreCompetencies(coreCompetencies = []) {
  if (!Array.isArray(coreCompetencies) || coreCompetencies.length === 0) {
    return KMUTNB_CORE_COMPETENCIES.map((c) => ({
      code: c.code,
      name: c.name,
      targetLevel: c.defaultLevel,
    }));
  }

  return coreCompetencies.map((item, idx) => {
    let code = item.code;
    let name = item.name || '';

    if (!code) {
      if (name.includes('(K') || name.includes('ความใฝ่เรียนรู้')) code = 'K';
      else if (name.includes('(M') || name.includes('คุณธรรม')) code = 'M';
      else if (name.includes('(U') || name.includes('ความมุ่งมั่น')) code = 'U';
      else if (name.includes('(T') || name.includes('การทำงานเป็นทีม')) code = 'T';
      else if (name.includes('(N') || name.includes('จิตสำนึก')) code = 'N';
      else if (name.includes('(B') || name.includes('การพัฒนางาน')) code = 'B';
      else {
        const codes = ['K', 'M', 'U', 'T', 'N', 'B'];
        code = codes[idx] || '';
      }
    }

    if (code && STANDARD_CORE_NAMES[code]) {
      name = STANDARD_CORE_NAMES[code];
    } else {
      name = name.replace(/\(([KMUTNB])\s*-[^)]+\)/gi, '($1)');
    }

    return {
      ...item,
      code: code || item.code,
      name,
    };
  });
}

export const DEFAULT_FUNCTIONAL_COMPETENCIES = [
  { name: '1. ความรู้ด้านการบริหารทรัพยากรบุคคล / วิชาชีพ', targetLevel: 4 },
  { name: '2. ความรู้เรื่องกฎและระเบียบที่เกี่ยวกับงาน', targetLevel: 4 },
  { name: '3. การสื่อสารและให้คำปรึกษา', targetLevel: 4 },
  { name: '4. ด้านประสานงาน', targetLevel: 4 },
  { name: '5. ความละเอียดรอบคอบและความถูกต้องของงาน', targetLevel: 4 },
  { name: '6. การมีจิตบริการ', targetLevel: 4 },
];

/**
 * Resolves standard Functional Competencies from IDP competency configuration
 * based on position name ('บุคลากร', 'นักวิชาการคอมพิวเตอร์', etc.)
 * and the current Thai Fiscal Year (ปีงบประมาณ).
 */
export function getFunctionalCompetenciesForPosition(position = '', fiscalYear = null, customConfig = null) {
  const currentYear = String(fiscalYear || getCurrentThaiFiscalYear());
  const posStr = String(position || '').trim();

  let byPositionMap = DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_BY_POSITION;
  let generalList = DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_GENERAL;

  if (customConfig?.functionalCompetenciesByPosition) {
    byPositionMap = customConfig.functionalCompetenciesByPosition;
    if (Array.isArray(customConfig.functionalCompetenciesGeneral)) {
      generalList = customConfig.functionalCompetenciesGeneral;
    }
  } else if (typeof window !== 'undefined') {
    try {
      const specificRaw = localStorage.getItem(`icit_idp_config_${currentYear}`);
      if (specificRaw) {
        const parsed = JSON.parse(specificRaw);
        if (parsed?.functionalCompetenciesByPosition) {
          byPositionMap = parsed.functionalCompetenciesByPosition;
        }
        if (Array.isArray(parsed?.functionalCompetenciesGeneral)) {
          generalList = parsed.functionalCompetenciesGeneral;
        }
      } else {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('icit_idp_config')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed?.functionalCompetenciesByPosition) {
                byPositionMap = parsed.functionalCompetenciesByPosition;
                if (Array.isArray(parsed.functionalCompetenciesGeneral)) {
                  generalList = parsed.functionalCompetenciesGeneral;
                }
                break;
              }
            }
          }
        }
      }
    } catch (e) {
      // Fallback
    }
  }

  let matchedList = null;
  if (posStr && byPositionMap[posStr]) {
    matchedList = byPositionMap[posStr];
  } else if (posStr) {
    for (const key of Object.keys(byPositionMap)) {
      if (posStr.includes(key) || key.includes(posStr)) {
        matchedList = byPositionMap[key];
        break;
      }
    }
  }

  // Fallback matching
  if (!matchedList || matchedList.length === 0) {
    if (posStr.includes('คอมพิวเตอร์') || posStr.includes('โปรแกรมเมอร์') || posStr.includes('ระบบ') || posStr.includes('สารสนเทศ')) {
      matchedList = byPositionMap['นักวิชาการคอมพิวเตอร์'];
    } else if (posStr.includes('พัสดุ') || posStr.includes('จัดซื้อ')) {
      matchedList = byPositionMap['นักวิชาการพัสดุ'];
    } else if (posStr.includes('บริหารงานทั่วไป') || posStr.includes('ธุรการ') || posStr.includes('สารบรรณ')) {
      matchedList = byPositionMap['เจ้าหน้าที่บริหารงานทั่วไป'];
    } else if (posStr.includes('บุคคล') || posStr.includes('HR') || posStr.includes('ทรัพยากรบุคคล')) {
      matchedList = byPositionMap['บุคลากร'];
    } else if (posStr.includes('แผน') || posStr.includes('นโยบาย')) {
      matchedList = byPositionMap['นักวิเคราะห์นโยบายและแผน'];
    } else if (posStr.includes('เงิน') || posStr.includes('บัญชี')) {
      matchedList = byPositionMap['นักวิชาการเงินและบัญชี'];
    } else if (posStr.includes('วิศวกร')) {
      matchedList = byPositionMap['วิศวกร'];
    } else if (posStr.includes('ช่างเครื่อง')) {
      matchedList = byPositionMap['ช่างเครื่องคอมพิวเตอร์'];
    } else if (posStr.includes('ช่าง')) {
      matchedList = byPositionMap['ช่างเทคนิค'];
    } else if (posStr.includes('ผู้บริหาร') || posStr.includes('ผู้อำนวยการ')) {
      matchedList = byPositionMap['ผู้บริหาร'];
    } else {
      matchedList = generalList;
    }
  }

  if (!Array.isArray(matchedList) || matchedList.length === 0) {
    matchedList = generalList || DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_GENERAL;
  }

  return matchedList.map((item, idx) => {
    let name = (item.title || item.name || '').trim();
    if (name && !/^\d+\./.test(name)) {
      name = `${idx + 1}. ${name}`;
    }
    const targetLevel = Number(item.expectedLevel || item.targetLevel || 3);
    return {
      name,
      targetLevel: isNaN(targetLevel) || targetLevel < 1 ? 3 : Math.min(5, Math.max(1, targetLevel)),
    };
  });
}

export const DEFAULT_MAIN_RESPONSIBILITIES = [
  {
    category: 'ด้านการปฏิบัติการ',
    activities:
      '1. ปฏิบัติงานด้านการบริหารจัดการงานบุคคล ได้แก่ การสรรหา ลาออก การปฐมนิเทศบุคลากรใหม่ การแต่งตั้ง โอนย้าย การประเมินทดลองงาน การต่อสัญญาจ้าง การดำเนินการเกี่ยวกับการขอระดับตำแหน่ง การควบคุมการมาปฏิบัติงานให้เป็นไปตามระเบียบและข้อบังคับ การจัดทำทะเบียนประวัติ การแก้ไขเปลี่ยนแปลงเกี่ยวกับประวัติการทำงาน การประเมินผลการปฏิบัติงานและการเลื่อนเงินเดือน รวมถึงการสรรหาและเลือกตั้งเพื่อดำรงตำแหน่ง\n2. ปฏิบัติงานด้านการพัฒนาบุคลากร ได้แก่ การจัดทำแผนบริหารและพัฒนาบุคลากร การจัดทำแผนพัฒนาบุคลากรรายบุคคล การจัดทำโครงการพัฒนาบุคลากร การจัดทำและสรุปผลแบบประเมินความพึงพอใจต่อการพัฒนาบุคลากร ดำเนินการขอตำแหน่งทางวิชาการเพื่อขอระดับตำแหน่งให้สูงขึ้น\n3. ด้านสวัสดิการ ได้แก่ ดำเนินการเกี่ยวกับประกันชีวิตและสุขภาพกลุ่ม ประกันอุบัติเหตุ ประกันสังคม กองทุนสำรองเลี้ยงชีพ กองทุนเพื่อการเลี้ยงชีพ\n4. ด้านอื่นๆ ที่ได้รับมอบหมาย ได้แก่ จัดทำคำสั่งที่เกี่ยวข้อง งานคณะกรรมการและเลขานุการ งานติดตามและรายงานตัวชี้วัดคำรับรองของมหาวิทยาลัยตามที่ได้รับมอบหมายให้รับผิดชอบ',
    expectedResults: 'มีผลการดำเนินงานสำเร็จตามเป้าหมายที่กำหนดไว้ในแต่ละงาน มีแผนพัฒนาบุคลากรที่สอดรับกับพันธกิจของหน่วยงาน และบุคลากรได้รับสิทธิสวัสดิการครบถ้วนตามสิทธิ',
    weight: 70,
  },
  {
    category: 'ด้านการวางแผน',
    activities: 'วางแผนการดำเนินงานให้สอดคล้องและเป็นไปตามพันธกิจของหน่วยงานและมหาวิทยาลัย',
    expectedResults: 'มีการติดตามผลการดำเนินงานตามแผนที่กำหนดไว้',
    weight: 10,
  },
  {
    category: 'ด้านประสานงาน',
    activities: 'ประสานงานร่วมกันระหว่างทีมงานหรือหน่วยงานทั้งภายในและภายนอก ได้แก่ การประสานงานด้านข้อมูลบุคลากรและทะเบียนประวัติ การประสานงานด้านการขออนุมัติตัวบุคคล การประสานงานด้านสวัสดิการ การประสานงานด้านการขอตำแหน่งทางวิชาการเพื่อขอระดับตำแหน่งให้สูงขึ้น รวมถึงการประชาสัมพันธ์และการขอความร่วมมือต่างๆ',
    expectedResults: 'มีผลการดำเนินงานสำเร็จตามเป้าหมายที่กำหนดไว้ในแต่ละงาน',
    weight: 10,
  },
  {
    category: 'ด้านการบริการ',
    activities: '1. ดำเนินการเกี่ยวกับการจัดทำเอกสารคำสั่งต่างๆ การจัดทำขั้นตอนการดำเนินงานที่เกี่ยวข้องต่างๆ การจัดทำแบบฟอร์ม การจัดเก็บข้อมูลและให้ข้อมูลเกี่ยวกับงานทรัพยากรบุคคล\n2. ให้คำปรึกษา แนะนำเบื้องต้น เผยแพร่ถ่ายทอดความรู้ ทางด้านการบริหารงานทรัพยากรบุคคล รวมทั้งตอบปัญหาและชี้แจงเรื่องต่างๆ เกี่ยวกับงานในหน้าที่',
    expectedResults: 'มีผลการดำเนินงานสำเร็จตามเป้าหมาย และบุคลากรได้รับคำปรึกษาและคำแนะนำเบื้องต้น',
    weight: 10,
  },
];

export const DEFAULT_INTERNAL_RELATIONSHIPS = [
  {
    unitName: 'กองบริหารและจัดการทรัพยากรมนุษย์',
    topics: 'การรับสมัคร การบรรจุ การลาออก เลื่อนเงินเดือน กำหนดระดับตำแหน่งที่สูงขึ้น การแต่งตั้งผู้บริหาร การสรรหา/เลือกตั้ง การโอนย้ายตำแหน่ง ทะเบียนประวัติ รายงานการมาปฏิบัติงาน การขออนุมัติตัวบุคคล',
    contactMethod: 'โทรศัพท์, Line, Email, ติดต่อโดยตรงที่หน่วยงาน',
    frequency: 'สัปดาห์ละ 2-3 ครั้ง',
  },
  {
    unitName: 'งานสิทธิประโยชน์เกื้อกูลบุคลากร',
    topics: 'ประกันสุขภาพ ประกันอุบัติเหตุ ประกันสังคม กองทุนสำรองเลี้ยงชีพ กองทุนเพื่อการเลี้ยงชีพ การลาออก การบรรจุ',
    contactMethod: 'โทรศัพท์, Line, Email, ติดต่อโดยตรงที่หน่วยงาน',
    frequency: 'ปีละ 5-10 ครั้ง',
  },
  {
    unitName: 'ศูนย์ส่งเสริมสวัสดิการและสิ่งจูงใจ',
    topics: 'การตรวจสุขภาพประจำปี การเสนอชื่อผู้ปฏิบัติงานดีเด่น การประสานงานเรื่องการเสียชีวิตของญาติบุคลากร',
    contactMethod: 'โทรศัพท์, Line, Email, ติดต่อโดยตรงที่หน่วยงาน',
    frequency: 'ปีละ 1-2 ครั้ง',
  },
];

export const DEFAULT_EXTERNAL_RELATIONSHIPS = [
  {
    unitName: '-',
    topics: '-',
    contactMethod: '-',
    frequency: '-',
  },
];

export const DEFAULT_REQUIRED_TRAININGS = [
  'การประยุกต์ใช้เทคโนโลยีมาช่วยในการปฏิบัติงานให้มีประสิทธิภาพมากยิ่งขึ้น',
  'หลักการเขียน prompt AI เพื่องานสำนักงาน',
  'การบริหารจัดการทรัพยากรบุคคลภาครัฐและมหาวิทยาลัย',
  'พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) สำหรับบุคลากรทางการศึกษา',
];

export const DEFAULT_JD_TEMPLATE = {
  docCode: 'ICIT-FM-COMMON-006',
  version: '2.0',
  securityClassification: 'ปกปิด (Restricted)',
  approvedByName: 'อาจารย์ณัฐวุฒิ สร้อยดอกสน',
  division: 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ',
  coreCompetencies: KMUTNB_CORE_COMPETENCIES.map((c) => ({
    code: c.code,
    name: c.name,
    targetLevel: c.defaultLevel,
    desc: c.desc || '',
  })),
  functionalCompetencies: DEFAULT_FUNCTIONAL_COMPETENCIES,
  mainResponsibilities: DEFAULT_MAIN_RESPONSIBILITIES,
  internalRelationships: DEFAULT_INTERNAL_RELATIONSHIPS,
  externalRelationships: DEFAULT_EXTERNAL_RELATIONSHIPS,
  qualifications: {
    educationAndMajor: 'ปริญญาตรี ในสาขาที่เกี่ยวข้องกับตำแหน่งงาน',
    experience: 'มีประสบการณ์และความชำนาญในงานที่รับผิดชอบ',
    specialQualifications: 'การสื่อสาร การติดต่อประสานงาน การนำเสนอ และการประยุกต์ใช้เทคโนโลยีสารสนเทศ',
    skills: {
      english: 'ระดับเริ่มต้น หรือ CEFR ไม่ต่ำกว่า B1',
      otherLanguage: '-',
      computer: 'Microsoft Word, Excel, PowerPoint, Google Workspace',
      otherSkills: '-',
    },
  },
  trainings: DEFAULT_REQUIRED_TRAININGS,
  updatedAt: new Date().toISOString(),
  updatedBy: 'ระบบเริ่มต้น',
};

/**
 * Creates an empty/initial JD record structure
 */
export function createBlankJD(personnel = null, fiscalYear = null, customConfig = null) {
  const now = new Date().toISOString();
  const positionLevel = personnel?.positionLevel || personnel?.level || 'ปฏิบัติการ';
  const position = personnel?.position || '';
  return {
    id: `jd-${Date.now()}`,
    personnelId: personnel?.id || '',
    personnelName: personnel?.name || '',
    personnelEmail: personnel?.email || '',
    positionNumber: personnel?.positionNumber || '',
    position: position,
    adminPosition: '-',
    positionLevel: positionLevel,
    positionType: personnel?.personnelType || 'พนักงานมหาวิทยาลัย สายสนับสนุนวิชาการ',
    division: 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ',
    department: personnel?.department || '',
    
    // Supervision
    supervisorName: '',
    supervisorPosition: '',
    subordinatesCount: '-',
    orgChartUrl: '',

    // Job Summary
    jobSummaryStandard: '',
    jobSummaryActual: '',

    // ส่วนที่ 3: หน้าที่ความรับผิดชอบหลัก (Main Responsibilities) -> Empty
    mainResponsibilities: [],

    // ส่วนที่ 4: ความสัมพันธ์ในการทำงาน (Relationships) -> Empty
    internalRelationships: [],
    externalRelationships: [],

    // ส่วนที่ 5: คุณสมบัติเฉพาะตำแหน่ง (Qualifications) -> Empty
    educationAndMajor: '',
    experience: '',
    specialQualifications: '',
    skills: {
      english: '',
      otherLanguage: '',
      computer: '',
      otherSkills: '',
    },

    // ส่วนที่ 6: สมรรถนะหลัก (Core Competencies) จาก IDP Config
    coreCompetencies: getCoreCompetenciesForLevel(positionLevel, fiscalYear, customConfig),
    
    // ส่วนที่ 7: สมรรถนะประจำตำแหน่ง (Functional Competencies) จาก IDP Config
    functionalCompetencies: getFunctionalCompetenciesForPosition(position, fiscalYear, customConfig),

    // ส่วนที่ 7: การฝึกอบรม (Trainings) -> Empty
    trainings: [],

    // ส่วนที่ 8: การลงนามรับทราบและอนุมัติ (Signatures) -> Empty
    signatures: {
      preparedBy: {
        name: '',
        date: '',
      },
      reviewedBy: {
        name: '',
        date: '',
      },
      approvedBy: {
        name: '',
        date: '',
      },
    },

    // Metadata
    docCode: 'ICIT-FM-COMMON-006',
    version: '2.0',
    securityClassification: 'ปกปิด (Restricted)',
    status: 'DRAFT', // 'DRAFT' | 'CONFIRMED' | 'REVISED'
    userConfirmed: false,
    confirmedAt: null,
    confirmedByEmail: '',
    lastUpdatedBy: personnel?.name || 'Admin',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Seed JD Record matching the sample PDF of Ms. Jarucha Jueathong
 */
export const SAMPLE_SEED_JD = {
  id: 'jd-sample-1940',
  personnelId: 'pers-sample-1940',
  personnelName: 'นางสาวจารุชา เจือทอง',
  personnelEmail: 'jarucha.j@icit.kmutnb.ac.th',
  positionNumber: '1940',
  position: 'บุคลากร',
  adminPosition: '-',
  positionLevel: 'ปฏิบัติการ',
  positionType: 'พนักงานมหาวิทยาลัย สายสนับสนุนวิชาการ',
  division: 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ',
  department: 'ฝ่ายสำนักงานผู้อำนวยการ',

  // Supervision
  supervisorName: 'นางสาวชาลินทร์ เกรียงสินยศ',
  supervisorPosition: 'หัวหน้าสำนักงานผู้อำนวยการ (นักวิชาการพัสดุ)',
  subordinatesCount: '-',
  orgChartUrl: '',

  // Job Summary
  jobSummaryStandard:
    'ปฏิบัติงานในฐานะผู้ปฏิบัติงานระดับต้นที่ต้องใช้ความรู้ความสามารถทางวิชาการในการทำงาน ปฏิบัติงานเกี่ยวกับการบริหารงานทรัพยากรบุคคล ภายใต้การกำกับ แนะนำ ตรวจสอบ และปฏิบัติงานอื่นตามที่ได้รับมอบหมาย',
  jobSummaryActual:
    'ปฏิบัติงานบริหารจัดการทรัพยากรบุคคล ซึ่งมีลักษณะงานที่ปฏิบัติเกี่ยวกับการศึกษาวิเคราะห์เพื่อกำหนดความต้องการอัตรากำลัง การจัดทำแผนบริหารและพัฒนาบุคลากร การบริหารงานบุคคลต่างๆ เช่น การสรรหาบุคคลเข้าปฏิบัติราชการ ดำเนินการเกี่ยวกับการออกจากราชการ การประเมินผลการปฏิบัติงาน การต่อสัญญาจ้าง การดำเนินการตรวจสอบเกี่ยวกับตำแหน่งและอัตราเงินเดือน การพัฒนาบุคลากร การขออนุมัติตัวบุคคล การขอระดับตำแหน่งให้สูงขึ้น การจัดทำทะเบียนประวัติ การจัดการและควบคุมการมาปฏิบัติงาน งานด้านสวัสดิการ และการจัดทำคำสั่งที่เกี่ยวข้อง รวมถึงการบริหารจัดการงานเลือกตั้งและสรรหาบุคคลเพื่อดำรงตำแหน่งต่างๆ',

  // Main Responsibilities
  mainResponsibilities: [
    {
      category: 'ด้านการปฏิบัติการ',
      activities:
        '1. ปฏิบัติงานด้านการบริหารจัดการงานบุคคล ได้แก่ การสรรหา ลาออก การปฐมนิเทศบุคลากรใหม่ การแต่งตั้ง โอนย้าย การประเมินทดลองงาน การต่อสัญญาจ้าง การดำเนินการเกี่ยวกับการขอระดับตำแหน่ง การควบคุมการมาปฏิบัติงานให้เป็นไปตามระเบียบและข้อบังคับ การจัดทำทะเบียนประวัติ การแก้ไขเปลี่ยนแปลงเกี่ยวกับประวัติการทำงาน การประเมินผลการปฏิบัติงานและการเลื่อนเงินเดือน รวมถึงการสรรหาและเลือกตั้งเพื่อดำรงตำแหน่ง\n2. ปฏิบัติงานด้านการพัฒนาบุคลากร ได้แก่ การจัดทำแผนบริหารและพัฒนาบุคลากร การจัดทำแผนพัฒนาบุคลากรรายบุคคล การจัดทำโครงการพัฒนาบุคลากร การจัดทำและสรุปผลแบบประเมินความพึงพอใจต่อการพัฒนาบุคลากร ดำเนินการขอตำแหน่งทางวิชาการเพื่อขอระดับตำแหน่งให้สูงขึ้น\n3. ด้านสวัสดิการ ได้แก่ ดำเนินการเกี่ยวกับประกันชีวิตและสุขภาพกลุ่ม ประกันอุบัติเหตุ ประกันสังคม กองทุนสำรองเลี้ยงชีพ กองทุนเพื่อการเลี้ยงชีพ\n4. ด้านอื่นๆ ที่ได้รับมอบหมาย ได้แก่ จัดทำคำสั่งที่เกี่ยวข้อง งานคณะกรรมการและเลขานุการ งานติดตามและรายงานตัวชี้วัดคำรับรองของมหาวิทยาลัยตามที่ได้รับมอบหมายให้รับผิดชอบ',
      expectedResults:
        'มีผลการดำเนินงานสำเร็จตามเป้าหมายที่กำหนดไว้ในแต่ละงาน มีแผนพัฒนาบุคลากรที่สอดรับกับพันธกิจของหน่วยงาน บุคลากรรับทราบสวัสดิการและได้รับสวัสดิการครบถ้วนตามสิทธิ',
      weight: 70,
    },
    {
      category: 'ด้านการวางแผน',
      activities: 'วางแผนการดำเนินงานให้สอดคล้องและเป็นไปตามพันธกิจของหน่วยงานและมหาวิทยาลัย',
      expectedResults: 'มีการติดตามผลการดำเนินงานตามแผนที่กำหนดไว้',
      weight: 10,
    },
    {
      category: 'ด้านประสานงาน',
      activities:
        'ประสานงานร่วมกันระหว่างทีมงานหรือหน่วยงานทั้งภายในและภายนอก ได้แก่ การประสานงานด้านข้อมูลบุคลากรและทะเบียนประวัติ การประสานงานด้านการขออนุมัติตัวบุคคล การประสานงานด้านสวัสดิการ การประสานงานด้านการขอตำแหน่งทางวิชาการเพื่อขอระดับตำแหน่งให้สูงขึ้น รวมถึงการประชาสัมพันธ์และการขอความร่วมมือต่างๆ',
      expectedResults: 'มีผลการดำเนินงานสำเร็จตามเป้าหมายที่กำหนดไว้ในแต่ละงาน',
      weight: 10,
    },
    {
      category: 'ด้านการบริการ',
      activities:
        '1. ดำเนินการเกี่ยวกับการจัดทำเอกสารคำสั่งต่างๆ การจัดทำขั้นตอนการดำเนินงานที่เกี่ยวข้องต่างๆ การจัดทำแบบฟอร์ม การจัดเก็บข้อมูลและให้ข้อมูลเกี่ยวกับงานทรัพยากรบุคคล\n2. ให้คำปรึกษา แนะนำเบื้องต้น เผยแพร่ถ่ายทอดความรู้ ทางด้านการบริหารงานทรัพยากรบุคคล รวมทั้งตอบปัญหาและชี้แจงเรื่องต่างๆ เกี่ยวกับงานในหน้าที่',
      expectedResults: 'มีผลการดำเนินงานสำเร็จตามเป้าหมาย และบุคลากรได้รับคำปรึกษาและคำแนะนำเบื้องต้น',
      weight: 10,
    },
  ],

  // Relationships
  internalRelationships: [
    {
      unitName: 'กองบริหารและจัดการทรัพยากรมนุษย์',
      topics:
        'การรับสมัคร การบรรจุ การลาออก เลื่อนเงินเดือน กำหนดระดับตำแหน่งที่สูงขึ้น การแต่งตั้งผู้บริหาร การสรรหา/เลือกตั้ง การโอนย้ายตำแหน่ง ทะเบียนประวัติ รายงานการมาปฏิบัติงาน การขออนุมัติตัวบุคคล',
      contactMethod: 'โทรศัพท์, Line, Email, ติดต่อโดยตรงที่หน่วยงาน',
      frequency: 'สัปดาห์ละ 2-3 ครั้ง',
    },
    {
      unitName: 'งานสิทธิประโยชน์เกื้อกูลบุคลากร',
      topics: 'ประกันสุขภาพ ประกันอุบัติเหตุ ประกันสังคม กองทุนสำรองเลี้ยงชีพ กองทุนเพื่อการเลี้ยงชีพ การลาออก การบรรจุ',
      contactMethod: 'โทรศัพท์, Line, Email, ติดต่อโดยตรงที่หน่วยงาน',
      frequency: 'ปีละ 5-10 ครั้ง',
    },
    {
      unitName: 'ศูนย์ส่งเสริมสวัสดิการและสิ่งจูงใจ',
      topics: 'การตรวจสุขภาพประจำปี การเสนอชื่อผู้ปฏิบัติงานดีเด่น การประสานงานเรื่องการเสียชีวิตของญาติบุคลากร',
      contactMethod: 'โทรศัพท์, Line, Email, ติดต่อโดยตรงที่หน่วยงาน',
      frequency: 'ปีละ 1-2 ครั้ง',
    },
  ],
  externalRelationships: [
    {
      unitName: '-',
      topics: '-',
      contactMethod: '-',
      frequency: '-',
    },
  ],

  // Qualifications
  educationAndMajor: 'ปริญญาตรี ด้านการบริหารจัดการ บริหารงานบุคคล รัฐศาสตร์ นิติศาสตร์ หรือสาขาอื่นที่เกี่ยวข้อง',
  experience: 'ประสบการณ์ด้านการบริหารจัดการ การวางแผน การวิเคราะห์ การติดต่อประสานงาน และการสื่อสาร',
  specialQualifications:
    'การสื่อสารด้านจิตวิทยา การพูดในที่สาธารณะ และการนำเสนอหรืออธิบาย รวมถึงความสามารถอื่นๆ ด้านเทคโนโลยีสารสนเทศ',
  skills: {
    english: 'ระดับเริ่มต้น หรือ CEFR ไม่ต่ำกว่า B1',
    otherLanguage: '-',
    computer:
      'Microsoft Word, Excel, PowerPoint, Microsoft Form, Google Form, Canva, การจัดทำสื่อประชาสัมพันธ์ (Infographic)',
    otherSkills: '-',
  },

  // Competencies
  coreCompetencies: [
    { code: 'K', name: '1. ความใฝ่เรียนรู้ (K)', targetLevel: 3 },
    { code: 'M', name: '2. คุณธรรมและความซื่อสัตย์ (M)', targetLevel: 5 },
    { code: 'U', name: '3. ความมุ่งมั่นให้เกิดผลสำเร็จของงาน (U)', targetLevel: 3 },
    { code: 'T', name: '4. การทำงานเป็นทีม (T)', targetLevel: 3 },
    { code: 'N', name: '5. จิตสำนึกรักองค์กร (N)', targetLevel: 3 },
    { code: 'B', name: '6. การพัฒนางานอย่างต่อเนื่อง (B)', targetLevel: 3 },
  ],
  functionalCompetencies: [
    { name: '1. ความรู้ด้านการบริหารทรัพยากรบุคคล', targetLevel: 4 },
    { name: '2. ความรู้เรื่องกฎและระเบียบที่เกี่ยวกับงาน', targetLevel: 4 },
    { name: '3. การสื่อสารและให้คำปรึกษา', targetLevel: 4 },
    { name: '4. ด้านประสานงาน', targetLevel: 4 },
    { name: '5. ความละเอียดรอบคอบและความถูกต้องของงาน', targetLevel: 4 },
    { name: '6. การมีจิตบริการ', targetLevel: 4 },
  ],

  // Training
  trainings: [
    'การประยุกต์ใช้เทคโนโลยีมาช่วยในการปฏิบัติงานให้มีประสิทธิภาพมากยิ่งขึ้น',
    'หลักการเขียน prompt AI',
    'การบริหารจัดการทรัพยากรบุคคล',
    'พระราชบัญญัติ คุ้มครองข้อมูลส่วนบุคคล (PDPA)',
  ],

  // Signatures
  signatures: {
    preparedBy: {
      name: 'นางสาวจารุชา เจือทอง',
      date: '',
    },
    reviewedBy: {
      name: 'นางสาวชาลินทร์ เกรียงสินยศ',
      date: '',
    },
    approvedBy: {
      name: 'อาจารย์ณัฐวุฒิ สร้อยดอกสน',
      date: '',
    },
  },

  docCode: 'ICIT-FM-COMMON-006, DD MMM 20xx',
  version: '2.0',
  securityClassification: 'ปกปิด (Restricted)',
  status: 'CONFIRMED',
  userConfirmed: true,
  confirmedAt: '2026-09-01T08:30:00.000Z',
  confirmedByEmail: 'jarucha.j@icit.kmutnb.ac.th',
  lastUpdatedBy: 'นางสาวจารุชา เจือทอง',
  createdAt: '2026-08-15T09:00:00.000Z',
  updatedAt: '2026-09-01T08:30:00.000Z',
};
