export type MissionStatus =
  "available" | "in_progress" | "completed" | "claimed";

export interface Mission {
  code: string;
  title: string;
  category: string;
  summary: string;
  requirement: string;
  reward: string;
  rewardPoints: number;
  period: { startsAt: string | null; endsAt: string | null };
  status: MissionStatus;
  progress: number;
}

export interface MissionListResponse {
  totalPoints: number;
  summary: {
    available: number;
    inProgress: number;
    completed: number;
    claimed: number;
  };
  missions: Mission[];
}
