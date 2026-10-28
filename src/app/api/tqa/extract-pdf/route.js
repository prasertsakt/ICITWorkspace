import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for large PDF analysis

const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
];

/**
 * Clean and normalize JSON string from Gemini (strip markdown fences if present)
 */
function cleanJsonString(raw) {
  if (!raw) return '';
  let str = raw.trim();
  if (str.startsWith('```json')) {
    str = str.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (str.startsWith('```')) {
    str = str.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return str.trim();
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const fiscalYear = formData.get('fiscalYear') || '2568';
    const clientApiKey = formData.get('apiKey') || '';

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { success: false, message: 'กรุณาอัปโหลดไฟล์ PDF' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, message: 'ไฟล์ที่อัปโหลดต้องเป็นนามสกุล .pdf เท่านั้น' },
        { status: 400 }
      );
    }

    // Resolve API Key (Private server-side environment variable)
    const apiKey = clientApiKey.trim() || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_API_KEY',
          message:
            'ไม่พบ Google Gemini API Key กรุณากำหนดค่า GEMINI_API_KEY ใน Environment Variables ของระบบ (Vercel / .env.local)',
        },
        { status: 400 }
      );
    }

    // Convert file to base64
    const fileBytes = await file.arrayBuffer();
    const base64Data = Buffer.from(fileBytes).toString('base64');

    const prompt = `
คุณคือผู้เชี่ยวชาญระดับสูงด้านการตรวจประเมินคุณภาพองค์กรตามเกณฑ์รางวัลคุณภาพแห่งชาติ (TQA - Thailand Quality Award)
หน้าที่ของคุณคืออ่านเอกสาร "รายงานการตรวจประเมินคุณภาพ / รายงานป้อนกลับ (TQA Feedback Report)" จากไฟล์ PDF ที่แนบมานี้
และสกัดข้อเสนอแนะเพื่อการปรับปรุง (Opportunity for Improvement: OFI) ทั้งหมดที่ปรากฏในเอกสารออกมาให้ครบถ้วนทุกข้อ

เกณฑ์และข้อกำหนดสำคัญในการสกัดข้อมูล:
1. หมวดหมู่ (category): ต้องเป็นหนึ่งใน 7 หมวดตามเกณฑ์ TQA:
   - "หมวด 1 การนำองค์กร" (categoryNum: 1)
   - "หมวด 2 กลยุทธ์" (categoryNum: 2)
   - "หมวด 3 ลูกค้า" (categoryNum: 3)
   - "หมวด 4 การวัด การวิเคราะห์ และการจัดการความรู้" (categoryNum: 4)
   - "หมวด 5 บุคลากร" (categoryNum: 5)
   - "หมวด 6 ระบบปฏิบัติการ" (categoryNum: 6)
   - "หมวด 7 ผลลัพธ์" (categoryNum: 7)
2. รหัสหัวข้อ (itemRef): ระบุเลขเกณฑ์ TQA เช่น "1.1ก(2)", "2.1ก(4)", "7.1ก(1)" เป็นต้น
3. Key Theme: ระบุธีมหลักของ OFI เช่น "Key Theme B1", "Key Theme B2", "Key Theme D1", "Key Theme D2" หากในเอกสารไม่ได้ระบุ ให้จัดหมวดหมู่ตามบริบท
4. ข้อค้นพบ (finding): สรุปข้อความค้นพบหรือประเด็นโอกาสในการพัฒนา
5. หลักฐานเชิงประจักษ์ (evidence):
   ***สำคัญมากที่สุด***: ในเล่มรายงาน TQA มักมี Bullet หลายรายการ หากพบหลายประเด็น ให้ใส่เครื่องหมาย "• " นำหน้าและขึ้นบรรทัดใหม่ ("\\n") แยกแต่ละประเด็นอย่างชัดเจน ห้ามตัดทอนหรือรวมเป็นประโยคเดียว
6. ผลกระทบหรือคุณค่าเชิงกลยุทธ์ (potentialImpact):
   ***สำคัญมากที่สุด***: หากพบหลายประเด็นหรือข้อความขยายความ ให้ใส่เครื่องหมาย "• " นำหน้าและขึ้นบรรทัดใหม่ ("\\n") แยกแต่ละประเด็นอย่างชัดเจน

โปรดตอบกลับเป็น JSON Array ของ OFI items เท่านั้น (ห้ามใส่คำเกริ่นนำหรือข้อความอื่นใดนอกเหนือจาก JSON):
[
  {
    "category": "หมวด 1 การนำองค์กร",
    "categoryNum": 1,
    "itemRef": "1.1ก(2)",
    "keyTheme": "Key Theme B1",
    "finding": "ข้อความข้อค้นพบ...",
    "evidence": "• รายการหลักฐานข้อที่ 1...\\n• รายการหลักฐานข้อที่ 2...",
    "potentialImpact": "• ผลกระทบหรือคุณค่าข้อที่ 1...\\n• ผลกระทบหรือคุณค่าข้อที่ 2..."
  }
]
`;

    let lastError = null;
    let extractedItems = null;
    let successfulModel = null;

    // Try Gemini models in order of capability
    for (const model of GEMINI_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: 'application/pdf',
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          console.warn(`Gemini model ${model} failed (${response.status}):`, errBody);
          lastError = new Error(`Gemini API (${model}) error: ${response.status} - ${errBody}`);
          continue;
        }

        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!candidateText) {
          lastError = new Error(`โมเดล ${model} ไม่ได้ส่งเนื้อหากลับมา`);
          continue;
        }

        const cleanedJson = cleanJsonString(candidateText);
        const parsed = JSON.parse(cleanedJson);

        if (Array.isArray(parsed) && parsed.length > 0) {
          extractedItems = parsed;
          successfulModel = model;
          break;
        } else if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          extractedItems = parsed.items;
          successfulModel = model;
          break;
        }
      } catch (err) {
        console.warn(`Error trying model ${model}:`, err);
        lastError = err;
      }
    }

    if (!extractedItems || extractedItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            lastError?.message ||
            'ไม่สามารถสกัดข้อมูลจากไฟล์ PDF ได้ กรุณาตรวจสอบว่าไฟล์เป็นเล่มรายงาน TQA Feedback Report ที่มีข้อความสมบูรณ์',
        },
        { status: 500 }
      );
    }

    // Format & normalize extracted items
    const normalizedItems = extractedItems.map((item, idx) => {
      const catNum =
        Number(item.categoryNum) ||
        (item.category?.match(/\d+/)?.[0] ? Number(item.category.match(/\d+/)[0]) : 1);
      const catName = item.category || `หมวด ${catNum}`;

      return {
        id: `tqa-${fiscalYear}-${String(idx + 1).padStart(2, '0')}`,
        fiscalYear: String(fiscalYear),
        category: catName,
        categoryNum: catNum,
        itemRef: (item.itemRef || `ข้อที่ ${idx + 1}`).trim(),
        keyTheme: (item.keyTheme || 'Key Theme B1').trim(),
        finding: (item.finding || '').trim(),
        evidence: (item.evidence || '').trim(),
        potentialImpact: (item.potentialImpact || '').trim(),
        status: 'PENDING',
        assignedPersons: [],
        actionReport: '',
        isTracking: true,
        executionStatus: 'TRACKED',
        isExcluded: false,
        extractedAt: new Date().toISOString(),
        extractedBy: `Google Gemini AI (${successfulModel})`,
      };
    });

    return NextResponse.json({
      success: true,
      count: normalizedItems.length,
      modelUsed: successfulModel,
      fileName: file.name,
      items: normalizedItems,
    });
  } catch (error) {
    console.error('API Error in /api/tqa/extract-pdf:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการประมวลผลไฟล์ PDF',
      },
      { status: 500 }
    );
  }
}
