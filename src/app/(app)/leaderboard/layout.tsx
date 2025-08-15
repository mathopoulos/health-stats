import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard - Health Stats',
  description: 'Compare your health metrics with other users. View HRV and VO2 Max leaderboards to see how you stack up.',
  keywords: 'health leaderboard, HRV comparison, VO2 max ranking, fitness metrics, health competition',
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
