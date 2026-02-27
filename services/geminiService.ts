
import { UserRole } from "../types";

/**
 * Gemini API를 직접 호출하여 안정성을 높인 버전입니다.
 * 가독성을 위해 AI에게 마크다운 기호를 남발하지 않도록 지시를 강화했습니다.
 */
export async function getAIResponse(
  prompt: string,
  history: { role: string; content: string }[],
  role: UserRole = 'staff',
  manualContext: string = "",
  signal?: AbortSignal
) {
  // Vite 환경 변수에서 키를 가져오되, 여러 경로를 통해 최대한 안전하게 확보
  const env = (import.meta as any).env || {};
  const apiKey = env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Critical: VITE_GEMINI_API_KEY is missing.");
    throw new Error("AI 기능을 사용할 수 없습니다. 배포 서비스(Vercel/Firebase 등)의 Settings에서 VITE_GEMINI_API_KEY 환경 변수를 설정해 주세요.");
  }


  const adminSystemInstruction = `당신은 학원의 '매뉴얼 설계 전문가'입니다.
관리자의 입력을 바탕으로 카테고리를 분류하고 상세 매뉴얼 아이템을 구성하세요.

[카테고리 중복 방지 지침]
1. 아래 '현재 등록된 카테고리 목록'을 반드시 확인하세요.
2. 입력 내용이 이미 존재하는 카테고리에 속한다면, 새로운 이름을 만들지 말고 반드시 목록에 있는 '정확한 이름'을 "name"에 사용하세요.
3. 카테고리 이름은 최대한 단순한 명사형(예: '국어', '수학', '근무수칙')으로 결정하고, 뒤에 '수업', '지침', '매뉴얼' 같은 중복된 수식어를 붙이지 마세요.

[구조화 지침]
1. 과목 수업 방식은 'type': 'subject', 일반 운영 지침은 'type': 'admin'으로 분류하세요.
2. 'groups' 배열을 사용하여 여러 카테고리를 한 번에 제안할 수 있습니다.

[현재 등록된 카테고리 목록]
${manualContext || "아직 등록된 카테고리가 없습니다."}

[답변 스타일 규칙]
1. 마크다운 헤더(###)는 사용하지 말고 이모지를 활용해 친절하게 답변하세요.
2. 분석 결과 JSON은 답변 맨 마지막 코드 블록으로 넣으세요.

분석 결과 JSON 형식:
\`\`\`json
{
  "requestType": "STRUCTURE_MANUAL",
  "groups": [
    {
      "category": { "name": "목록에 있는 이름 혹은 단순명사", "type": "admin/subject", "icon": "아이콘" },
      "items": [
        { "title": "제목", "description": "설명", "steps": ["단계1", "단계2"], "icon": "fact_check" }
      ]
    }
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
      body: JSON.stringify(requestBody),
      signal
    });

    if (!response.ok) {
      const errorData = await response.json();
      const rawMsg = errorData.error?.message || "";

      // 사용자 친화적인 에러 메시지로 변환
      if (rawMsg.includes("Quota exceeded") || rawMsg.includes("429")) {
        throw new Error("AI가 현재 많은 요청을 처리하고 있어 잠시 기다려주세요. 지속될 경우 구글 AI 스튜디오(aistudio.google.com)에서 사용량을 확인해 보세요. 😊");
      }


      throw new Error(`AI 호출 실패: ${rawMsg}`);
    }

    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
  } catch (err: any) {
    console.error("getAIResponse failure:", err);
    throw err;
  }
}
