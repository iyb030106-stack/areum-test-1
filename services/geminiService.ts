
import { GoogleGenAI } from "@google/genai";

// Fetches a response from the AI assistant with given prompt and conversation history
export async function getAIResponse(prompt: string, history: { role: string; content: string }[]) {
  // Always initialize with process.env.API_KEY inside the function as per coding guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';

  // Format the history for the generateContent API
  const contents = history.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
  
  // Add current user prompt to the sequence
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  // Call generateContent with model name, structured contents, and system instructions
  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: `당신은 학원 및 교육 시설 관리 시스템의 AI 어시스턴트입니다. 
      당신은 직원들이 다음 업무를 수행하는 것을 돕습니다:
      1. 학부모 상담 및 응대 가이드 제공
      2. 수강료 환불 규정 및 행정 절차 안내
      3. 강의실 기기(프로젝터, PC) 문제 해결
      4. 학생 출결 및 생활 지도 관련 조언
      5. 교대 근무 인수인계 메모 작성
      모든 답변은 한국어로 제공하며, 친절하고 교육 전문가다운 전문성을 갖춘 형태로 작성하세요. 
      단계별 설명에는 글머리 기호를 사용하고, 필요시 법적 규정(교육법 등)에 근거한 안내를 하세요.`,
    },
  });

  // Return text directly from the response object
  return response.text;
}
