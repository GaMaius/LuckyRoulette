
/**
 * Local Luck Prophecy Service (No API Key Required)
 * Gemini API 대신 로컬 데이터베이스를 사용하여 즉각적인 예언을 제공합니다.
 */

const PROPHECIES = [
  "포기하면 그 순간이 바로 시합 종료예요. (슬램덩크)",
  "똑바로 봐, 그리고 두려워 마. 미래는 네 손에 달려 있어. (에반게리온)",
  "운명은 스스로 개척하는 자의 편이다. 당신의 직감을 믿으세요.",
  "별들이 당신의 승리를 속삭이고 있습니다. 지금이 기회일지도?",
  "잃는 것을 두려워하지 마세요. 그것이 진정한 도박사의 자세입니다.",
  "보여줄게, 완전히 달라진 나의 행운을. (어느 도박사의 노래)",
  "한 번의 선택이 모든 것을 바꿉니다. 신중하지만 대담하게.",
  "지금 이 순간, 당신의 영혼이 떨리고 있군요. 배팅은 정직합니다.",
  "잭팟의 향기가 가까운 곳에서 느껴집니다. 레버를 당기세요.",
  "꿈은 도망가지 않아, 도망가는 건 언제나 자신이지. (짱구는 못말려)",
  "진실은 언제나 하나! 당신의 다음 패는 승리입니다. (코난)",
  "강한 자가 살아남는 것이 아니라, 살아남는 자가 강한 것이다."
];

const WIN_QUOTES = [
  "승리의 여신이 당신에게 입맞춤하고 있습니다!",
  "압도적인 승리! 당신은 이미 전설입니다.",
  "이 기세를 몰아 하늘 끝까지 올라가 보시겠습니까?"
];

const LOSS_QUOTES = [
  "실패는 성공의 어머니일 뿐, 다음은 다를 겁니다.",
  "바람이 차갑군요. 하지만 곧 따뜻한 행운이 찾아올 겁니다.",
  "잠시 숨을 고르세요. 운명은 다시 회전하기 시작했습니다."
];

export const getAILuckProphecy = async (username: string, balance: number, lastResult: string) => {
  // 인위적인 지연시간을 주어 '생각하는 AI' 느낌을 연출 (0.5초)
  await new Promise(resolve => setTimeout(resolve, 200));

  // 잭팟 여부 판단 (마지막 결과에 '잭팟'이나 '대박'이 포함된 경우)
  if (lastResult.includes('잭팟') || lastResult.includes('대박')) {
    return WIN_QUOTES[Math.floor(Math.random() * WIN_QUOTES.length)];
  }

  // 잔액이 매우 적을 때 (10만 원 미만)
  if (balance < 100000) {
    return "벼랑 끝에 선 자가 가장 무서운 법입니다. 기적을 믿으세요.";
  }

  // 일반적인 경우 랜덤 예언 반환
  return PROPHECIES[Math.floor(Math.random() * PROPHECIES.length)];
};
