
import { UserRole } from "../types";

/**
 * Gemini API 스트리밍 버전
 * onChunk 콜백으로 텍스트 청크를 실시간 전달합니다.
 */
function buildSystemInstruction(role: UserRole, manualContext: string): string {
  const commonRules = `[답변 스타일 규칙]
1. 당신은 학원 업무 지식 뱅크이자 비서입니다. 
2. 등록된 데이터를 바탕으로 질문에 친절하고 짧게 답변하세요.
3. 마크다운 헤더(###)나 기호를 남발하지 마세요. 가장 중요한 키워드에만 **강조**를 사용하세요.
4. 모바일 화면에 최적화되도록 문장을 짧게 끊어서 작성하세요.
5. "JSON", "코드 블록", "구조화", "데이터" 같은 기술 용어는 절대 언급하지 마세요.

[현재 등록된 학원 지식 데이터]
${manualContext || "현재 등록된 매뉴얼이나 공지사항이 없습니다."}`;

  if (role === 'admin') {
    return `${commonRules}

[관리자 전용 기능: 데이터 관리]
당신은 관리자의 요청에 따라 시스템 데이터를 생성, 수정, 삭제할 수 있는 특수 권한이 있습니다.
사용자의 의도가 단순히 '조회'나 '질문'이 아니라, 실제 시스템에 **'반영'**하거나 **'등록/변경/삭제'**하려는 경우에만 아래의 JSON을 답변 맨 마지막에 포함하세요.

[작업 판단 기준]
- 단순히 "알려줘", "뭐야?", "어떻게 해?" 라고 물으면 지식 데이터를 바탕으로 '설명'만 하세요. (JSON 생성 금지)
- "추가해줘", "만들어줘", "등록해줘", "새로 생성해" 등 시스템에 데이터를 새로 넣으려는 의도가 명확할 때만 CREATE/STRUCTURE 작업을 수행하세요.
- "수정해", "바꿔줘", "변경해" 등 기존 데이터를 고치려 할 때만 UPDATE 작업을 수행하세요.
- "삭제해", "지워", "없애" 등 데이터를 제거하려 할 때만 DELETE 작업을 수행하세요.
- 판단이 모호하면 "시스템에 반영할까요?"라고 먼저 물어보세요.

[중요 규칙]
- **절대로 JSON만 출력하지 마세요.** 반드시 "~~ 작업을 준비했습니다" 또는 "내용을 정리했습니다"와 같은 자연스러운 설명을 먼저 제공하세요.
- JSON은 반드시 맨 마지막에 \`\`\`json ... \`\`\` 블록으로 감싸서 한 번만 출력하세요.

[관리용 JSON 출력 형식]
(생략 가능하며 의도가 명확할 때만 사용)

공지사항 생성:
\`\`\`json
{ "requestType": "CREATE_ANNOUNCEMENT", "announcements": [{ "title": "제목", "description": "내용", "category": "일반", "isImportant": false }] }
\`\`\`

FAQ 생성:
\`\`\`json
{ "requestType": "CREATE_FAQ", "faqs": [{ "question": "질문", "answer": "답변", "category": "분류" }] }
\`\`\`

매뉴얼 생성:
\`\`\`json
{
  "requestType": "STRUCTURE_MANUAL",
  "groups": [{ 
    "category": { "name": "명칭", "type": "admin/subject", "icon": "settings(소문자로 작성)" }, 
    "items": [{ "title": "제목", "description": "설명", "steps": ["1", "2"], "icon": "fact_check(반드시 소문자_언더바 형식)" }] 
  }]
}
\`\`\`

[아이콘 가이드]
- 반드시 Material Icons의 소문자_언더바 명칭을 사용하세요. (예: DOOROPEN (X) -> door_open (O))
- 권장: school, groups, payments, security, analytics, door_open, campaign, description

(수정/삭제 등도 기존 형식을 유지하되, 반드시 앞부분에 친절한 설명을 붙이세요.)`;
  }

  return `${commonRules}
  
사용자의 질문에 대해 등록된 매뉴얼과 공지사항을 바탕으로 답변하세요. 
정보가 없다면 "죄송하지만 해당 정보는 아직 등록되지 않았습니다."라고 답변하세요.`;
}

function buildRequestBody(
  prompt: string,
  history: { role: string; content: string }[],
  systemInstruction: string
) {
  return {
    contents: [
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: prompt }] }
    ],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };
}

/**
 * 스트리밍 방식 — onChunk 콜백으로 청크 전달
 */
export async function getAIResponseStream(
  prompt: string,
  history: { role: string; content: string }[],
  role: UserRole = 'staff',
  manualContext: string = "",
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const env = (import.meta as any).env || {};
  const apiKey = env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) throw new Error("AI 기능을 사용할 수 없습니다. VITE_GEMINI_API_KEY 환경 변수를 설정해 주세요.");

  const systemInstruction = buildSystemInstruction(role, manualContext);
  const modelName = 'gemini-flash-latest';
  // alt=sse → Server-Sent Events 스트리밍
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildRequestBody(prompt, history, systemInstruction)),
    signal
  });

  if (!response.ok) {
    const errorData = await response.json();
    const rawMsg = errorData.error?.message || "";
    if (rawMsg.includes("Quota exceeded") || rawMsg.includes("429")) {
      throw new Error("AI가 현재 많은 요청을 처리하고 있어 잠시 기다려주세요. 😊");
    }
    throw new Error(`AI 호출 실패: ${rawMsg}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? ''; // 마지막 불완전한 줄은 버퍼에 보관

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const text: string = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) onChunk(text);
      } catch {
        // JSON 파싱 실패 무시
      }
    }
  }
}

/**
 * 기존 비스트리밍 버전 (하위 호환용)
 */
export async function getAIResponse(
  prompt: string,
  history: { role: string; content: string }[],
  role: UserRole = 'staff',
  manualContext: string = "",
  signal?: AbortSignal
) {
  let fullText = '';
  await getAIResponseStream(prompt, history, role, manualContext, (chunk) => {
    fullText += chunk;
  }, signal);
  return fullText || "답변을 드릴 수 없습니다.";
}
