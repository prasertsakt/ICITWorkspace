import { NextResponse } from 'next/server';
import { generateIntelligentAnalysis, ICIT_VISION, ICIT_MISSIONS } from '@/lib/skillMapService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { personnel, assessment, workAreas } = body;

    if (!personnel || !assessment || !workAreas) {
      return NextResponse.json(
        { success: false, message: 'Missing required payload: personnel, assessment, or workAreas' },
        { status: 400 }
      );
    }

    // 1. Generate baseline Intelligent Analysis
    const baselineAnalysis = generateIntelligentAnalysis(personnel, assessment, workAreas);

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // 2. If Gemini API Key is available, enhance with Google Gemini
    if (apiKey) {
      try {
        const prompt = `
คุณคือผู้เชี่ยวชาญด้านการพัฒนาบุคลากร (HRD / Technology Competency Specialist) ของ สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT) มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (มจพ.)

บริบทองค์กร:
- วิสัยทัศน์: "${ICIT_VISION}"
- พันธกิจ 5 ด้าน:
  1) พัฒนาโครงสร้างพื้นฐานระบบเทคโนโลยีสารสนเทศและการสื่อสารทางดิจิทัลของมหาวิทยาลัย
  2) พัฒนาระบบเทคโนโลยีสารสนเทศเพื่อสนับสนุนการบริหารจัดการงานของมหาวิทยาลัย
  3) บริการเทคโนโลยีสารสนเทศเพื่อสนับสนุนการเรียนการสอน การค้นคว้าวิจัย และการปฏิบัติงานในมหาวิทยาลัย
  4) บริการวิชาการด้านเทคโนโลยีสารสนเทศ เพื่อการพัฒนาทักษะทางดิจิทัลแก่นักศึกษาและบุคลากร
  5) บริการพื้นที่แลกเปลี่ยนรู้และห้องปฏิบัติการเพื่อการเรียนการสอน และการอบรม

ข้อมูลผู้รับการประเมิน:
- ชื่อ-สกุล: ${personnel.name || 'ไม่ระบุ'}
- ฝ่ายงาน: ${personnel.department || 'ไม่ระบุ'}
- ตำแหน่ง: ${personnel.position || 'ไม่ระบุ'}
- คะแนนเฉลี่ยรวม: ${baselineAnalysis.overallAverage} / 5.00
- อัตราการประเมิน: ${baselineAnalysis.completionPercentage}%

จุดแข็งเบื้องต้น:
${JSON.stringify(baselineAnalysis.strengths, null, 2)}

ทักษะที่ควรพัฒนา:
${JSON.stringify(baselineAnalysis.developmentAreas, null, 2)}

โปรดสร้างบทวิเคราะห์เชิงลึกที่สร้างสรรค์และเป็นรูปธรรม ตอบกลับเป็น JSON เท่านั้น โดยมีโครงสร้างดังนี้:
{
  "strengths": ["จุดเด่นข้อที่ 1", "จุดเด่นข้อที่ 2", "จุดเด่นข้อที่ 3"],
  "developmentAreas": ["ทักษะที่ควรเสริมข้อที่ 1", "ทักษะที่ควรเสริมข้อที่ 2", "ทักษะที่ควรเสริมข้อที่ 3"],
  "strategicRecommendations": ["คำแนะนำเชิงกลยุทธ์ตามวิสัยทัศน์ข้อที่ 1", "คำแนะนำเชิงกลยุทธ์ข้อที่ 2", "คำแนะนำเชิงกลยุทธ์ข้อที่ 3"],
  "recommendedCourses": ["ชื่อหลักสูตรอบรมแนะนำ 1", "ชื่อหลักสูตรอบรมแนะนำ 2", "ชื่อหลักสูตรอบรมแนะนำ 3"]
}
`;

        const geminiResp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.4,
              },
            }),
          }
        );

        if (geminiResp.ok) {
          const geminiData = await geminiResp.json();
          const textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResponse) {
            const parsed = JSON.parse(textResponse);
            return NextResponse.json({
              success: true,
              source: 'gemini_ai',
              analysis: {
                ...baselineAnalysis,
                strengths: parsed.strengths || baselineAnalysis.strengths,
                developmentAreas: parsed.developmentAreas || baselineAnalysis.developmentAreas,
                strategicRecommendations: parsed.strategicRecommendations || baselineAnalysis.strategicRecommendations,
                recommendedCourses: parsed.recommendedCourses || baselineAnalysis.recommendedCourses,
                analyzedAt: new Date().toISOString(),
              },
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API call error, falling back to Intelligent Rule Engine:', geminiErr);
      }
    }

    // 3. Return Intelligent Rule-Based Analysis
    return NextResponse.json({
      success: true,
      source: 'intelligent_rule_engine',
      analysis: baselineAnalysis,
    });
  } catch (error) {
    console.error('Error in /api/skill-map/ai-analyze:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
