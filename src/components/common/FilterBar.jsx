import { useState } from 'react';
import { HiMagnifyingGlass, HiOutlineCalendarDays } from 'react-icons/hi2';

const FILTER_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
];

export default function FilterBar({ filter, onFilterChange, search, onSearchChange, onDateRangeChange, extra }) {
  const [showDateRange, setShowDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleDateApply = () => {
    if (startDate && endDate && onDateRangeChange) {
      onDateRangeChange(startDate, endDate);
      if (onFilterChange) onFilterChange('custom');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {onFilterChange && (
        <div className="flex bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-0.5">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onFilterChange(opt.value); setShowDateRange(false); }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
                filter === opt.value
                  ? 'bg-[#3498db] text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {onDateRangeChange && (
            <button
              onClick={() => setShowDateRange(!showDateRange)}
              className={`px-2 py-1.5 rounded-md transition-colors ${
                filter === 'custom'
                  ? 'bg-[#3498db] text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Custom date range"
            >
              <HiOutlineCalendarDays className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {showDateRange && onDateRangeChange && (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-1.5">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-sm bg-transparent border-none outline-none dark:text-white px-1"
          />
          <span className="text-gray-400 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-sm bg-transparent border-none outline-none dark:text-white px-1"
          />
          <button
            onClick={handleDateApply}
            disabled={!startDate || !endDate}
            className="px-2 py-1 text-xs bg-[#3498db] text-white rounded-md disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      )}

      {onSearchChange && (
        <div className="relative">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
          />
        </div>
      )}

      {extra}
    </div>
  );
}
