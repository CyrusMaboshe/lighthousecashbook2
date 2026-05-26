import { useAuth } from '@/hooks/useAuth';

interface InfoBarProps {
  selectedMonth: number;
  selectedYear: number;
}

export function InfoBar({ selectedMonth, selectedYear }: InfoBarProps) {
  const { currentUser, isAdmin } = useAuth();

  // Remove all header text content for mobile, keep minimal desktop version
  return (
    <div className="hidden md:block bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-slate-600 text-sm md:text-base">
            Financial Overview
            {!isAdmin && (
              <span className="text-sm text-orange-600 block">
                (Limited access as set by admin)
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
