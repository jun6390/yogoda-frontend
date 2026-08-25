export interface AttendanceSummary {
  month: string;
  today: string;
  checkedInToday: boolean;
  streak: number;
  monthlyCount: number;
  pointsPerCheckIn: number;
  dates: string[];
}
export interface PointWallet {
  balance: number;
  history: {
    id: string;
    amount: number;
    reason: string;
    sourceKey: string;
    createdAt: string;
  }[];
}
