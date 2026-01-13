
import { GoogleGenAI } from "@google/genai";

/**
 * Gemini API를 사용하여 오늘의 행운 예언을 생성합니다.
 * 최신 @google/genai SDK 가이드라인을 준수합니다.
 */
export const getAILuckProphecy = async () => {
  try {
    // API 호출 시점에 새로운 인스턴스를 생성하여 유효한 키를 사용하도록 보장합니다.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "당신은 신비로운 카지노 행운의 예언가입니다. 슬롯머신 게임을 시작하려는 유저에게 아주 짧고 임팩트 있는 한국어 행운의 예언 문장 하나를 들려주세요. 신비로움과 긍정적인 에너지가 느껴져야 합니다. (20자 내외)",
    });

    // response.text property를 사용하여 텍스트 추출 (method 아님)
    return response.text || "오늘 당신의 운명은 다이아몬드처럼 빛납니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "운명은 당신의 손에 있습니다.";
  }
};
