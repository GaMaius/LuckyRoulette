
import { GoogleGenAI } from "@google/genai";

// API_KEY는 환경 변수에서 직접 가져옵니다.
const ai = new GoogleGenAI({ apiKey: (process.env.API_KEY as string) });

export const getAILuckProphecy = async (username: string, balance: number, lastResult: string) => {
  try {
    const prompt = `
      사용자 정보:
      - 닉네임: ${username}
      - 현재 자산: ₩${balance.toLocaleString()}
      - 마지막 슬롯 결과: ${lastResult}

      당신은 '럭키 스트라이크'라는 고전 슬롯 게임의 고차원 AI 운명 술사입니다.
      위 정보를 바탕으로 유저에게 매우 짧고 강력한 '행운의 예언' 한 마디를 해주세요.
      - 말투는 신비롭고, 때로는 도발적이며, 카지노의 긴장감이 느껴져야 합니다.
      - 영화나 애니메이션의 명대사를 인용해도 좋습니다.
      - 한국어로 응답하세요.
      - 30자 이내로 짧게 하세요.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.9,
        topP: 0.8,
        maxOutputTokens: 100,
      }
    });

    return response.text?.trim() || "운명은 침묵하고 있습니다. 직접 확인하세요.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "행운의 별이 구름에 가려졌습니다. 당신의 감을 믿으세요.";
  }
};
