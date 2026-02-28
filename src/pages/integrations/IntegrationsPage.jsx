import { useState } from 'react';
import {
  HiOutlineArrowsRightLeft, HiOutlineUsers, HiOutlineCheckCircle,
  HiOutlineXCircle, HiOutlineArrowTopRightOnSquare, HiOutlinePlus,
} from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatsCard from '../../components/common/StatsCard';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import Badge from '../../components/common/Badge';
import { useApi } from '../../hooks/useApi';

const PLATFORM_COLORS = {
  asana: '#F06A6A',
  monday: '#6C6CFF',
  google_calendar: '#4285F4',
  trello: '#0079BF',
  clickup: '#7B68EE',
  notion: '#000000',
  stripe: '#635BFF',
};

const PIE_COLORS = ['#3498db', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function IntegrationsPage() {
  const [filter, setFilter] = useState('this_month');
  const [tab, setTab] = useState('connections');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [exportPage, setExportPage] = useState(1);
  const [dateRange, setDateRange] = useState(null);

  const filterParams = dateRange
    ? { start_date: dateRange[0], end_date: dateRange[1] }
    : { filter };

  const { data: stats, loading: statsLoading } = useApi('/admin/integrations/stats', filterParams, [filter, dateRange]);
  const { data: listData, loading: listLoading } = useApi(
    '/admin/integrations/list',
    { page, per_page: 15, ...(search ? { search } : {}), ...(dateRange ? { start_date: dateRange[0], end_date: dateRange[1] } : {}) },
    [page, search, dateRange]
  );
  const { data: exportStats, loading: exportStatsLoading } = useApi('/admin/integrations/exports/stats', filterParams, [filter, dateRange]);
  const { data: exportList, loading: exportListLoading } = useApi(
    '/admin/integrations/exports/list',
    { page: exportPage, per_page: 15 },
    [exportPage]
  );

  const connections = listData?.data || [];
  const connTotalPages = listData?.last_page || 1;
  const connTotal = listData?.total || 0;

  const exports = exportList?.data || [];
  const expTotalPages = exportList?.last_page || 1;
  const expTotal = exportList?.total || 0;

  const platformChartData = (stats?.by_platform || []).map((p) => ({
    name: p.service,
    Total: p.total,
    Active: p.active,
  }));

  const connectionColumns = [
    {
      key: 'user',
      label: 'User',
      render: (val) => (
        <div>
          <p className="text-sm font-medium dark:text-white">{val?.fullname || '—'}</p>
          <p className="text-xs text-gray-400">{val?.email}</p>
        </div>
      ),
    },
    {
      key: 'service',
      label: 'Platform',
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[val] || '#3498db' }} />
          <span className="capitalize text-sm font-medium dark:text-white">{val?.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (val) => <Badge variant={val ? 'success' : 'danger'}>{val ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'created_at',
      label: 'Connected',
      render: (val) => <span className="text-sm">{val?.slice(0, 10)}</span>,
    },
  ];

  const exportColumns = [
    {
      key: 'user',
      label: 'User',
      render: (val) => (
        <div>
          <p className="text-sm font-medium dark:text-white">{val?.fullname || '—'}</p>
          <p className="text-xs text-gray-400">{val?.email}</p>
        </div>
      ),
    },
    {
      key: 'platform',
      label: 'Platform',
      render: (val) => <span className="capitalize text-sm">{val?.replace('_', ' ')}</span>,
    },
    {
      key: 'export_type',
      label: 'Type',
      render: (val) => <span className="capitalize text-sm">{val?.replace('_', ' ')}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <Badge variant={val === 'completed' ? 'success' : val === 'failed' ? 'danger' : 'warning'}>{val}</Badge>,
    },
    {
      key: 'items_exported',
      label: 'Items',
      render: (val) => val ?? '—',
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (val) => <span className="text-sm">{val?.slice(0, 10)}</span>,
    },
  ];

  const tabs = [
    { id: 'connections', label: 'Connections' },
    { id: 'exports', label: 'Export History' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold dark:text-white">Integrations</h1>
        <FilterBar
          filter={filter}
          onFilterChange={(f) => { setFilter(f); setDateRange(null); }}
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          onDateRangeChange={(s, e) => setDateRange([s, e])}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Total Connections" value={stats?.total_connections} icon={HiOutlineArrowsRightLeft} color="indigo" loading={statsLoading} />
        <StatsCard title="Active" value={stats?.active_connections} icon={HiOutlineCheckCircle} color="green" loading={statsLoading} />
        <StatsCard title="New This Period" value={stats?.new_connections} icon={HiOutlinePlus} color="blue" loading={statsLoading} />
        <StatsCard title="Unique Users" value={stats?.unique_users} icon={HiOutlineUsers} color="purple" loading={statsLoading} />
      </div>

      {/* Platform Breakdown Chart */}
      {platformChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-semibold mb-4 dark:text-white">Connections by Platform</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={platformChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} tickFormatter={(v) => v?.replace('_', ' ')} />
                <Tooltip />
                <Bar dataKey="Total" fill="#3498db" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Active" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Export Stats */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-semibold mb-4 dark:text-white">Export Overview</h3>
            {exportStatsLoading ? (
              <div className="skeleton h-48 rounded-lg" />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                  <p className="text-3xl font-bold text-green-600">{exportStats?.completed_exports ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Completed</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                  <p className="text-3xl font-bold text-red-600">{exportStats?.failed_exports ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Failed</p>
                </div>
                <div className="p-4 bg-[#3498db]/10 dark:bg-[#3498db]/10 rounded-xl text-center">
                  <p className="text-3xl font-bold text-[#3498db]">{exportStats?.total_exports ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Exports</p>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
                  <p className="text-3xl font-bold text-amber-600">{exportStats?.total_items_exported ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Items Exported</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs: Connections / Exports */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-3 px-2 mr-6 text-sm font-medium border-b-2 transition-colors ${tab === t.id
                ? 'border-[#3498db] text-[#3498db]'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'connections' && (
          <DataTable
            columns={connectionColumns}
            data={connections}
            loading={listLoading}
            page={page}
            totalPages={connTotalPages}
            total={connTotal}
            onPageChange={setPage}
            emptyMessage="No integrations found"
          />
        )}

        {tab === 'exports' && (
          <DataTable
            columns={exportColumns}
            data={exports}
            loading={exportListLoading}
            page={exportPage}
            totalPages={expTotalPages}
            total={expTotal}
            onPageChange={setExportPage}
            emptyMessage="No exports found"
          />
        )}
      </div>
    </div>
  );
}
