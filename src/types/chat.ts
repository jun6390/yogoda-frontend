// 요금제 추천 카드 한 장 (백엔드 plan-recommendation.service의 PlanCard와 대응)
export interface ChatPlanCard {
  code: string;
  badge: string;
  name: string;
  price: string;
  specs: string;
  savings: string;
  matchRate: string;
}

// 채팅 화면에 표시되는 메시지 한 건
export interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  type: "text" | "plans" | "link" | "error";
  text?: string;
  textKey?: string;
  plans?: ChatPlanCard[];
}
