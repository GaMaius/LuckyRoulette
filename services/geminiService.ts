
/**
 * 이 서비스는 더 이상 외부 AI(Gemini)를 호출하지 않으며
 * 로컬에 정의된 애니메이션 명대사 데이터베이스에서 운세를 제공합니다.
 */

const ANIME_FORTUNES = [
  // 강철의 연금술사
  { anime: "강철의 연금술사", quote: "사람은 무언가의 희생 없이는 아무것도 얻을 수 없다. 무언가를 얻기 위해서는 동등한 대가가 필요하다.", character: "에드워드 엘릭" },
  { anime: "강철의 연금술사", quote: "할 수 있는지 없는지가 아니야. 해야만 하는 거야.", color: "text-blue-400" },
  { anime: "강철의 연금술사", quote: "일어서서 걸어라. 앞으로 나아가라. 너에겐 훌륭한 다리가 붙어있지 않나.", character: "에드워드 엘릭" },
  
  // 원피스
  { anime: "원피스", quote: "사람의 꿈은!! 끝나지 않아!!!!", character: "마샬 D. 티치", color: "text-yellow-500" },
  { anime: "원피스", quote: "사람이 언제 죽는다고 생각하나? ... 사람들에게 잊혀졌을 때다.", character: "닥터 히루루크" },
  { anime: "원피스", quote: "난 해적왕이 될 사나이다!", character: "몽키 D. 루피", color: "text-red-500" },
  { anime: "원피스", quote: "이 세상 누구에게나 이길 수 없는 강적이 있다. 하지만 도망치면 안 돼. 절대!", character: "루피" },
  
  // 죠죠의 기묘한 모험
  { anime: "죠죠의 기묘한 모험", quote: "네가 울 때까지 때리는 걸 멈추지 않겠다!", character: "죠나단 죠스타" },
  { anime: "죠죠의 기묘한 모험", quote: "무다무다무다무다무다무다무다무다!!", character: "DIO", color: "text-yellow-400" },
  { anime: "죠죠의 기묘한 모험", quote: "이 맛은... 거짓말을 하는 '맛'이구나!", character: "브루노 부차라티" },
  { anime: "죠죠의 기묘한 모험", quote: "나는 인간을 그만두겠다! 죠죠!", character: "DIO" },
  
  // 진격의 거인
  { anime: "진격의 거인", quote: "심장을 바쳐라!", character: "엘빈 스미스", color: "text-red-600" },
  { anime: "진격의 거인", quote: "아무것도 버릴 수 없는 사람은 아무것도 바꿀 수 없다.", character: "아르민 알레르토" },
  { anime: "진격의 거인", quote: "싸워라! 싸우지 않으면 이길 수 없다.", character: "에렌 예거" },
  { anime: "진격의 거인", quote: "이 세상은 잔혹하다... 그리고 무척 아름다워.", character: "미카사 아커만" },
  
  // 귀멸의 칼날
  { anime: "귀멸의 칼날", quote: "마음을 불태워라! 한계를 뛰어넘어라!", character: "렌고쿠 쿄쥬로", color: "text-orange-500" },
  { anime: "귀멸의 칼날", quote: "강한 자는 약한 자를 돕기 위해 태어난 것이다.", character: "렌고쿠 신쥬로" },
  { anime: "귀멸의 칼날", quote: "잃어도 잃어도 살아가는 수밖에 없습니다. 아무리 때려눕혀져도.", character: "카마도 탄지로" },
  { anime: "귀멸의 칼날", quote: "부끄러워하며 살아가는 게 아닙니다. 당당하게 죽는 겁니다.", character: "우부야시키 카가야" },
  
  // 주술회전
  { anime: "주술회전", quote: "고개 들어라. 영역 전개, 무량공처.", character: "고죠 사토루", color: "text-purple-400" },
  { anime: "주술회전", quote: "우리는 최강이니까.", character: "고죠 & 게토" },
  { anime: "주술회전", quote: "부정적인 감정에서 나오는 힘, 그것이 주력이다.", character: "고죠 사토루" },
  { anime: "주술회전", quote: "스스로를 규정짓는 한계가 가장 무의미한 거야.", character: "양면 스쿠나" }
];

export const getAILuckProphecy = async (username: string, balance: number, lastResult?: string) => {
  // 랜덤 지연시간을 주어 마치 서버에서 가져오는 듯한 효과만 연출합니다.
  await new Promise(r => setTimeout(r, 200));
  
  const randomIndex = Math.floor(Math.random() * ANIME_FORTUNES.length);
  const fortune = ANIME_FORTUNES[randomIndex];
  
  const prefix = `[${fortune.anime}] `;
  const suffix = fortune.character ? ` - ${fortune.character}` : "";
  
  return `${prefix}${fortune.quote}${suffix}`;
};
