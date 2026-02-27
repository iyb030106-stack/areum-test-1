
import { UserRole } from "../types";

/**
 * Gemini API를 직접 호출하여 안정성을 높인 버전입니다.
 * 가독성을 위해 AI에게 마크다운 기호를 남발하지 않도록 지시를 강화했습니다.
 */
export async function getAIResponse(
  prompt: string,
  history: { role: string; content: string }[],
  role: UserRole = 'staff',
  manualContext: string = ""
) {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const adminSystemInstruction = `당신은 학원의 '매뉴얼 설계 전문가'입니다. 
관리자가 주는 정보를 체계적으로 정리하여 시스템에 등록 가능한 데이터로 변환하세요.

[구조화 지침]
1. 과목별 수업 방식(예: 영어는 ~, 국어는 ~)이 섞여 있다면, 이를 하나의 커다란 덩어리가 아니라 '국어 수업', '영어 수업'처럼 과목별로 분리된 개별 항목(items)으로 나누어 생성하세요.
2. 각 항목의 'title'은 해당 과목명이나 핵심 업무 명칭으로 정하세요.
3. 'category'의 'name'은 전체를 아우르는 주제(예: 과목별 수업 운영 지침)로 정하세요.

[답변 스타일 규칙]
1. ###, ## 같은 마크다운 헤더 기호를 절대 사용하지 마세요. 대신 이모지(📋, ✅, 💡)를 제목 앞에 활용하세요.
2. 문장은 '~하세요', '~해요' 처럼 친절하고 간결한 구어체를 사용하세요.
3. 분석 결과(JSON)는 반드시 답변 맨 끝에 '별도의 코드 블록'으로만 넣으세요.

분석 결과 JSON 형식:
\`\`\`json
{
  "requestType": "STRUCTURE_MANUAL",
  "category": { "name": "카테고리명", "type": "admin|subject", "icon": "folder" },
  "items": [
    { "title": "제목", "description": "설명", "steps": ["단계1", "단계2"], "icon": "fact_check" }
  ]
}
\`\`\``;

  const staffSystemInstruction = `당신은 학원 업무 지식 뱅크입니다. 
등록된 매뉴얼을 바탕으로 질문에 답변하세요.

[답변 스타일 규칙]
1. 마크다운 기호를 남발하지 마세요. (###, ** 등 사용 자제)
2. 가장 중요한 키워드에만 아주 가끔 **강조**를 사용하세요. 
3. 번호를 매길 때는 '1. ', '2. ' 처럼 명확히 구분하세요.
4. 모바일 화면에서 한눈에 들어오도록 문장을 짧게 끊어서 작성하세요.

[매뉴얼 데이터]
${manualContext || "현재 매뉴얼 정보가 없습니다."}`;

  const systemInstruction = role === 'admin' ? adminSystemInstruction : staffSystemInstruction;
  const modelName = 'gemini-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`AI 호출 실패: ${errorData.error?.message}`);
    }

    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
  } catch (err: any) {
    console.error("getAIResponse failure:", err);
    throw err;
  }
}
