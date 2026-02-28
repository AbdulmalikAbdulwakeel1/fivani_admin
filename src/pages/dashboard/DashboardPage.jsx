import { useState } from 'react';
import {
  HiOutlineUsers, HiOutlineBolt, HiOutlineClock,
  HiOutlineUserGroup, HiOutlineDocumentMagnifyingGlass, HiOutlineBeaker,
} from 'react-icons/hi2';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from '../../components/common/StatsCard';
import FilterBar from '../../components/common/FilterBar';
import Badge from '../../components/common/Badge';
import { useApi } from '../../hooks/useApi';

const activityColors = {
  workflow: 'bg-[#3498db]',
  negotiation: 'bg-purple-500',
  contract: 'bg-blue-500',
  export: 'bg-green-500',
  project: 'bg-amber-500',
};

const activityBadge = {
  workflow: 'info',
  negotiation: 'purple',
  contract: 'default',
  export: 'success',
  project: 'warning',
};

export default function DashboardPage() {
  const [filter, setFilter] = useState('this_month');

  const { data: activeUsers, loading: l1 } = useApi('/admin/dashboard/active-users', { filter }, [filter]);
  const { data: usersCount, loading: l3 } = useApi('/admin/dashboard/users-count', { filter }, [filter]);
  const { data: usageStats, loading: l4 } = useApi('/admin/dashboard/usage-stats', { filter }, [filter]);
  const { data: activities, loading: l6 } = useApi('/admin/dashboard/activities', { filter }, [filter]);

  // Analysis overview stats
  const { data: analysisOverview, loading: l8 } = useApi('/admin/analysis/overview', { filter }, [filter]);

  const usageChartData = usageStats?.labels?.map((label, i) => ({
    date: label,
    'Project Mgmt': usageStats.project_management?.[i] || 0,
    'Contract Gen': usageStats.contract_generation?.[i] || 0,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold dark:text-white">Dashboard</h1>
        <FilterBar filter={filter} onFilterChange={setFilter} />
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Users" value={activeUsers?.active_users} icon={HiOutlineBolt} color="green" loading={l1} />
        <StatsCard title="New Users" value={usersCount?.new_users} icon={HiOutlineUsers} color="blue" loading={l3} />
        <StatsCard title="Workflow Analyses" value={analysisOverview?.risk_analysis?.total} icon={HiOutlineDocumentMagnifyingGlass} color="indigo" loading={l8} />
        <StatsCard title="Negotiation Analyses" value={analysisOverview?.negotiation_analysis?.total} icon={HiOutlineBeaker} color="purple" loading={l8} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Inactive Users" value={usersCount?.inactive_users} icon={HiOutlineUsers} color="amber" loading={l3} />
        <StatsCard title="Pending Users" value={usersCount?.pending_users} icon={HiOutlineClock} color="cyan" loading={l3} />
        <StatsCard title="Workflow Users" value={analysisOverview?.risk_analysis?.unique_users} icon={HiOutlineUserGroup} color="blue" loading={l8} />
        <StatsCard title="Negotiation Users" value={analysisOverview?.negotiation_analysis?.unique_users} icon={HiOutlineUserGroup} color="purple" loading={l8} />
      </div>

      {/* Usage Trends - full width */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="font-semibold mb-4 dark:text-white">Usage Trends</h3>
        {l4 ? (
          <div className="skeleton h-64 rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={usageChartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="Project Mgmt" stroke="#3498db" fill="#3498db" fillOpacity={0.1} />
              <Area type="monotone" dataKey="Contract Gen" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent Activities - full width */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="font-semibold mb-4 dark:text-white">Recent Activities</h3>
        {l6 ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(activities || []).slice(0, 20).map((a, idx) => (
              <div key={`${a.activity_type}-${a.id}-${idx}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${activityColors[a.activity_type] || 'bg-gray-400'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate dark:text-white">{a.activity}</p>
                  <p className="text-xs text-gray-500">{a.parent_title} &middot; {a.created_by_name}</p>
                  <p className="text-xs text-gray-400">{a.created_at}</p>
                </div>
                <Badge variant={activityBadge[a.activity_type] || 'default'}>{a.activity_type}</Badge>
              </div>
            ))}
            {(!activities || activities.length === 0) && <p className="text-sm text-gray-400 text-center py-4">No activities found</p>}
          </div>
        )}
      </div>
    </div>
  );
}
