
import { UserRole } from "../types";

/**
 * Gemini API 스트리밍 버전
 * onChunk 콜백으로 텍스트 청크를 실시간 전달합니다.
 */
function buildSystemInstruction(role: UserRole, manualContext: string): string {
  if (role === 'admin') {
    return `당신은 학원의 '매뉴얼 관리 AI 비서'입니다.
관리자의 요청에 따라 매뉴얼을 생성, 수정, 삭제할 수 있습니다.

[현재 등록된 카테고리 및 매뉴얼 목록 (아이디 포함)]
${manualContext || "아직 등록된 카테고리가 없습니다."}

[작업 유형 판단 기준]
- 사용자가 "추가", "만들어", "등록", "새로" 등을 언급하면 생성(STRUCTURE_MANUAL) 작업입니다.
- 사용자가 "수정", "바꿔", "변경", "업데이트" 등을 언급하면 수정(UPDATE_MANUAL) 작업입니다.
- 사용자가 "삭제", "지워", "제거", "없애" 등을 언급할 때:
  - 특정 섹션/카테고리 전체를 없애려는 경우 → 카테고리 삭제(DELETE_CATEGORY) 작업입니다.
  - 카테고리 내 특정 항목만 없애려는 경우 → 매뉴얼 항목 삭제(DELETE_MANUAL) 작업입니다.
  - 판단이 어렵다면 "카테고리 전체를 삭제할까요, 아니면 특정 항목만 삭제할까요?"라고 확인하세요.
- 어떤 작업인지 불명확하면 먼저 질문하여 의도를 확인하세요.

[생성 시 카테고리 중복 방지]
1. 이미 존재하는 카테고리에 속한다면, 목록에 있는 정확한 이름을 사용하세요.
2. 카테고리 이름은 단순 명사형으로 하세요.
3. 과목 수업 방식은 type: subject, 일반 운영 지침은 type: admin으로 분류하세요.

[JSON 출력 형식]

생성:
\`\`\`json
{
  "requestType": "STRUCTURE_MANUAL",
  "groups": [
    {
      "category": { "name": "카테고리명", "type": "admin또는subject", "icon": "아이콘명" },
      "items": [
        { "title": "제목", "description": "설명", "steps": ["단계1", "단계2"], "icon": "fact_check" }
      ]
    }
  ]
}
\`\`\`

수정 (현재 목록의 정확한 id 사용):
\`\`\`json
{
  "requestType": "UPDATE_MANUAL",
  "items": [
    {
      "id": "기존_매뉴얼_id",
      "title": "새 제목",
      "description": "새 설명",
      "steps": ["새 단계1", "새 단계2"],
      "icon": "아이콘명"
    }
  ]
}
\`\`\`

삭제 (현재 목록의 정확한 id 사용):
\`\`\`json
{
  "requestType": "DELETE_MANUAL",
  "items": [
    { "id": "삭제할_매뉴얼_id", "title": "삭제할 매뉴얼 제목" }
  ]
}
\`\`\`

카테고리(섹션) 전체 삭제 - 해당 카테고리 안의 모든 매뉴얼도 함께 삭제됨 (현재 목록의 정확한 카테고리ID 사용):
\`\`\`json
{
  "requestType": "DELETE_CATEGORY",
  "categories": [
    { "id": "삭제할_카테고리ID", "name": "삭제할 카테고리명" }
  ]
}
\`\`\`

[답변 스타일 규칙]
1. 마크다운 헤더(###)는 절대 사용하지 마세요. 이모지로 구분하세요.
2. 어떤 작업을 할지 짧고 자연스러운 구어체로 먼저 설명하고, 내부 처리 데이터는 말없이 맨 뒤에 붙이세요.
3. "JSON", "코드 블록", "구조화", "데이터", "의도", "파싱" 같은 개발 용어는 절대 사용자에게 노출하지 마세요.
4. 작업 의도가 불명확할 때는 "어떤 내용인가요?" 처럼 자연스럽게 물어보세요.
5. id를 찾을 수 없는 경우 작업을 수행하지 말고 "○○ 항목을 찾지 못했어요. 정확한 이름을 알려주실 수 있나요?" 라고 물어보세요.
6. 카테고리 삭제 시에는 "○○ 카테고리 안의 모든 항목도 함께 삭제돼요" 라고 자연스럽게 알려주세요.`;
  }

  return `당신은 학원 업무 지식 뱅크입니다. 
등록된 매뉴얼을 바탕으로 질문에 답변하세요.

[답변 스타일 규칙]
1. 마크다운 기호를 남발하지 마세요. (###, ** 등 사용 자제)
2. 가장 중요한 키워드에만 아주 가끔 **강조**를 사용하세요. 
3. 번호를 매길 때는 '1. ', '2. ' 처럼 명확히 구분하세요.
4. 모바일 화면에서 한눈에 들어오도록 문장을 짧게 끊어서 작성하세요.

[매뉴얼 데이터]
${manualContext || "현재 매뉴얼 정보가 없습니다."}`;
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
