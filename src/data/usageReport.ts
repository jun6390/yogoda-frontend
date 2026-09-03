interface UsageHistoryItem {
  month: string;
  amount: number;
}

export interface UsageReportData {
  period: string;
  dataUsed: number;
  dataLimit: number;
  callMinutes: number;
  subscriptionCount: number;
  monthlyFee: number;
  history: UsageHistoryItem[];
  insightAverage: number;
  potentialSavings: number;
  insightSources: string[];
}

// 사용량 API 연결 전 화면과 데이터 계약을 검증하기 위한 목업임
export const usageReport: UsageReportData = {
  period: "2026-08",
  dataUsed: 43.8,
  dataLimit: 80,
  callMinutes: 182,
  subscriptionCount: 2,
  monthlyFee: 69_000,
  history: [
    { month: "2026-06", amount: 48.2 },
    { month: "2026-07", amount: 49 },
    { month: "2026-08", amount: 43.8 },
  ],
  insightAverage: 47,
  potentialSavings: 10_000,
  insightSources: ["recentUsage", "monthlyFee", "ottPattern", "interests"],
};
