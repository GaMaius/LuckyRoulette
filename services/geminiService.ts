
import { GoogleGenAI } from "@google/genai";

// Initialize with named parameter and exclusive use of process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAILuckProphecy = async (username: string, balance: number, lastResult?: string) => {
  try {
    const prompt = `You are a mystical "Lucky Strike" slot machine oracle. 
    User: ${username}
    Current Balance: ${balance.toLocaleString()} KRW
    Last Spin Result: ${lastResult || 'None yet'}
    
    Provide a short, witty, and mystical fortune or strategy for their next spin in 1-2 Korean sentences. 
    Be encouraging but slightly mysterious. Use emojis relevant to slots.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.9,
        topP: 0.8,
        maxOutputTokens: 100,
      }
    });

    return response.text || "운명의 수레바퀴가 돌고 있습니다. 다음 번엔 다를지도 모르죠.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "별들이 당신의 대박을 속삭이고 있습니다. 한 번 더 도전하세요!";
  }
};
