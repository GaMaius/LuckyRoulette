
/**
 * Fortune Service (Local Engine)
 * Gemini API를 사용하지 않고 로컬 데이터셋을 사용하여 운세를 제공합니다.
 */

const ANIME_FORTUNES = [
  { anime: "강철의 연금술사", quote: "사람은 무언가의 희생 없이는 아무것도 얻을 수 없다. 무언가를 얻기 위해서는 동등한 대가가 필요하다.", character: "에드워드 엘릭" },
  { anime: "원피스", quote: "사람의 꿈은!! 끝나지 않아!!!!", character: "마샬 D. 티치" },
  { anime: "죠죠의 기묘한 모험", quote: "무다무다무다무다무다무다무다무다!!", character: "DIO" },
  { anime: "진격의 거인", quote: "심장을 바쳐라!", character: "엘빈 스미스" },
  { anime: "귀멸의 칼날", quote: "마음을 불태워라! 한계를 뛰어넘어라!", character: "렌고쿠 쿄쥬로" },
  { anime: "주술회전", quote: "영역 전개, 무량공처.", character: "고죠 사토루" },
  { anime: "슬램덩크", quote: "영광의 시대는 언제였죠? 난 지금입니다!", character: "강백호" },
  { anime: "나루토", quote: "내가 포기하는 것을 포기해라!", character: "우즈마키 나루토" },
  { anime: "하이큐!!", quote: "아래를 내려다보지 마! 배구는 언제나 위를 보는 스포츠다!", character: "우카이 케이신" },
  { anime: "천원돌파 그렌라간", quote: "너를 믿는 내가 아냐. 나를 믿는 너도 아냐. 너를 믿는 너를 믿어!", character: "카미나" }
];

/**
 * AI 대신 로컬 엔진을 사용하여 행운의 예언을 반환합니다.
 * 컴포넌트와의 호환성을 위해 async 형식을 유지합니다.
 */
export const getAILuckProphecy = async (username: string, balance: number, lastResult?: string) => {
  // 로직을 단순화하여 로컬 리스트에서 무작위 추출
  return getRandomFallbackFortune();
};

function getRandomFallbackFortune() {
  const randomIndex = Math.floor(Math.random() * ANIME_FORTUNES.length);
  const f = ANIME_FORTUNES[randomIndex];
  return `[${f.anime}] "${f.quote}" - ${f.character}`;
}
