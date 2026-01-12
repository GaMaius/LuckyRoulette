
import { GoogleGenAI } from "@google/genai";

/**
 * 이 서비스는 Gemini API를 사용하여 사용자에게 
 * 애니메이션 스타일의 운세 명대사를 제공합니다.
 */

const ANIME_FORTUNES = [
  { anime: "강철의 연금술사", quote: "사람은 무언가의 희생 없이는 아무것도 얻을 수 없다. 무언가를 얻기 위해서는 동등한 대가가 필요하다.", character: "에드워드 엘릭" },
  { anime: "원피스", quote: "사람의 꿈은!! 끝나지 않아!!!!", character: "마샬 D. 티치" },
  { anime: "죠죠의 기묘한 모험", quote: "무다무다무다무다무다무다무다무다!!", character: "DIO" },
  { anime: "진격의 거인", quote: "심장을 바쳐라!", character: "엘빈 스미스" },
  { anime: "귀멸의 칼날", quote: "마음을 불태워라! 한계를 뛰어넘어라!", character: "렌고쿠 쿄쥬로" },
  { anime: "주술회전", quote: "영역 전개, 무량공처.", character: "고죠 사토루" }
];

export const getAILuckProphecy = async (username: string, balance: number, lastResult?: string) => {
  // 1. API 키가 설정되어 있는지 확인
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.warn("⚠️ Gemini API Key가 설정되지 않았습니다. Vercel Settings에서 API_KEY를 등록해주세요.");
    return getRandomFallbackFortune();
  }

  try {
    // 2. API 호출 직전에 인스턴스 생성 (Lazy Init)
    const genAI = new GoogleGenAI({ apiKey: apiKey });
    
    // Gemini 3 Flash 모델 사용
    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `당신은 슬롯머신 게임 "럭키 스트라이크"의 점술가입니다.
사용자: ${username}, 잔액: ${balance}원, 결과: ${lastResult || '시작'}
애니메이션 오타쿠 스타일로 행운의 명대사를 1줄로 만드세요.
형식: [애니메이션] "대사" - 캐릭터`,
    });

    const text = response.text;
    if (text) return text.trim();
    return getRandomFallbackFortune();

  } catch (error) {
    console.error("❌ Gemini API 호출 중 오류 발생:", error);
    return getRandomFallbackFortune();
  }
};

// API가 안될 때 보여줄 랜덤 운세
function getRandomFallbackFortune() {
  const randomIndex = Math.floor(Math.random() * ANIME_FORTUNES.length);
  const f = ANIME_FORTUNES[randomIndex];
  return `[${f.anime}] "${f.quote}" - ${f.character}`;
}
