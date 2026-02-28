import clsx from 'clsx';

export default function StatsCard({ title, value, icon: Icon, trend, trendLabel, color = 'indigo', loading }) {
  const colors = {
    indigo: 'bg-[#3498db]/10 text-[#3498db] dark:bg-[#3498db]/20 dark:text-[#5dade2]',
    green: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400',
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-8 w-16 rounded" />
          </div>
          <div className="skeleton h-12 w-12 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-1 dark:text-white">{value ?? '—'}</p>
          {trend !== undefined && (
            <p className={clsx('text-xs mt-1 font-medium', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel || ''}
            </p>
          )}
        </div>
        {Icon && (
          <div className={clsx('p-3 rounded-xl', colors[color])}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
