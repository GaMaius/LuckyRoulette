
import { GoogleGenAI } from "@google/genai";

/**
 * 환경 변수를 모든 환경(Vercel, Vite, Node)에서 안전하게 가져오는 함수
 */
const getEnv = (key: string): string => {
  try {
    // 1. Standard process.env
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key] as string;
    // 2. Vite / Meta env
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) return import.meta.env[key] as string;
    // 3. Window injected process
    if (typeof window !== 'undefined' && (window as any).process?.env?.[key]) return (window as any).process.env[key];
    return "";
  } catch (e) {
    return "";
  }
};

const ANIME_FORTUNES = [
  { anime: "강철의 연금술사", quote: "사람은 무언가의 희생 없이는 아무것도 얻을 수 없다. 무언가를 얻기 위해서는 동등한 대가가 필요하다.", character: "에드워드 엘릭" },
  { anime: "원피스", quote: "사람의 꿈은!! 끝나지 않아!!!!", character: "마샬 D. 티치" },
  { anime: "죠죠의 기묘한 모험", quote: "무다무다무다무다무다무다무다무다!!", character: "DIO" },
  { anime: "진격의 거인", quote: "심장을 바쳐라!", character: "엘빈 스미스" },
  { anime: "귀멸의 칼날", quote: "마음을 불태워라! 한계를 뛰어넘어라!", character: "렌고쿠 쿄쥬로" },
  { anime: "주술회전", quote: "영역 전개, 무량공처.", character: "고죠 사토루" }
];

export const getAILuckProphecy = async (username: string, balance: number, lastResult?: string) => {
  // Vercel 클라이언트 측 접근을 위해 NEXT_PUBLIC_ 접두사가 붙은 키를 우선 확인
  const apiKey = getEnv("NEXT_PUBLIC_API_KEY") || getEnv("API_KEY");

  if (!apiKey || apiKey === "undefined" || apiKey === "null") {
    console.warn("⚠️ Gemini API Key가 감지되지 않았습니다. Vercel에서 NEXT_PUBLIC_API_KEY를 설정하고 Redeploy 하세요.");
    return getRandomFallbackFortune();
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const response = await ai.models.generateContent({
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
    console.error("❌ Gemini API Error:", error);
    return getRandomFallbackFortune();
  }
};

function getRandomFallbackFortune() {
  const randomIndex = Math.floor(Math.random() * ANIME_FORTUNES.length);
  const f = ANIME_FORTUNES[randomIndex];
  return `[${f.anime}] "${f.quote}" - ${f.character}`;
}
