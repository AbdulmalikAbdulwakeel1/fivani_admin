import { useState } from 'react';
import { HiOutlineCreditCard, HiOutlineUsers, HiOutlineClock, HiOutlineCurrencyDollar, HiOutlineArrowTrendingDown } from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StatsCard from '../../components/common/StatsCard';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import Badge from '../../components/common/Badge';
import { useApi } from '../../hooks/useApi';

const COLORS = ['#3498db', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const stripeStatusMap = {
    active: 'success',
    canceled: 'danger',
    trialing: 'info',
    past_due: 'warning',
    incomplete: 'amber',
};

export default function SubscriptionsPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);

    const { data: stats, loading: statsLoading } = useApi('/admin/subscriptions/stats', {}, []);
    const { data: revenue, loading: revLoading } = useApi('/admin/subscriptions/revenue', {}, []);
    const { data: listData, loading: listLoading } = useApi(
        '/admin/subscriptions/list',
        { page, ...(statusFilter ? { status: statusFilter } : {}), ...(search ? { search } : {}) },
        [page, statusFilter, search]
    );

    const subs = listData?.data || [];
    const totalPages = listData?.last_page || 1;
    const total = listData?.total || 0;

    // Build plan stats from stats.by_plan_and_status
    const planMap = {};
    (stats?.by_plan_and_status || []).forEach((row) => {
        if (!planMap[row.plan_name]) planMap[row.plan_name] = 0;
        planMap[row.plan_name] += row.count;
    });
    const planChartData = Object.entries(planMap).map(([name, count]) => ({ name, count }));

    const columns = [
        {
            key: 'user',
            label: 'User',
            render: (val) => (
                <div>
                    <p className="text-sm font-medium dark:text-white">{val?.name}</p>
                    <p className="text-xs text-gray-500">{val?.email}</p>
                </div>
            ),
        },
        {
            key: 'plan',
            label: 'Plan',
            render: (val) => <Badge variant="info">{val?.name || '—'}</Badge>,
        },
        {
            key: 'stripe_status',
            label: 'Status',
            render: (val) => <Badge variant={stripeStatusMap[val] || 'default'}>{val}</Badge>,
        },
        { key: 'stripe_id', label: 'Stripe ID', render: (v) => <span className="text-xs font-mono dark:text-gray-200">{v}</span> },
        { key: 'trial_ends_at', label: 'Trial Ends', render: (v) => v?.slice(0, 10) || '—' },
        { key: 'ends_at', label: 'Ends At', render: (v) => v?.slice(0, 10) || '—' },
        { key: 'created_at', label: 'Created', render: (v) => v?.slice(0, 10) },
    ];

    const filtered = search ? subs.filter(s => s.user?.name?.toLowerCase().includes(search.toLowerCase()) || s.user?.email?.toLowerCase().includes(search.toLowerCase())) : subs;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold dark:text-white">Subscriptions</h1>
                <FilterBar search={search} onSearchChange={setSearch} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatsCard title="Total Users" value={stats?.total_users} icon={HiOutlineUsers} color="indigo" loading={statsLoading} />
                <StatsCard title="Paid Users" value={stats?.paid_users} icon={HiOutlineCreditCard} color="green" loading={statsLoading} />
                <StatsCard title="Free Users" value={stats?.free_users} icon={HiOutlineUsers} color="amber" loading={statsLoading} />
                <StatsCard title="Trials" value={stats?.trial_count} icon={HiOutlineClock} color="blue" loading={statsLoading} />
            </div>

            {/* Revenue + Plan breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue card */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
                    <h3 className="font-semibold dark:text-white">Revenue Overview</h3>
                    {revLoading ? (
                        <div className="skeleton h-32 rounded-lg" />
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">MRR</p>
                                    <p className="text-2xl font-bold text-green-600">${revenue?.mrr?.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">New This Month</p>
                                    <p className="text-2xl font-bold text-[#3498db]">{revenue?.new_this_month}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Churn Rate</p>
                                    <p className="text-2xl font-bold text-red-500">{revenue?.churn_rate?.toFixed(2)}%</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {(revenue?.revenue_by_plan || []).map((r, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                                        <span className="dark:text-gray-200">{r.plan_name}</span>
                                        <div className="text-right">
                                            <p className="font-semibold dark:text-white">${r.total?.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">{r.subscribers} subs</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                {/* Plan chart */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                    <h3 className="font-semibold mb-4 dark:text-white">Subscribers by Plan</h3>
                    {statsLoading ? (
                        <div className="skeleton h-40 rounded-lg" />
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={planChartData}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {planChartData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Subscription List */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                    <h3 className="font-semibold flex-1 dark:text-white">Subscription List</h3>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200"
                    >
                        <option value="">All Statuses</option>
                        {['active', 'canceled', 'trialing', 'past_due', 'incomplete'].map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
                <DataTable
                    columns={columns}
                    data={filtered}
                    loading={listLoading}
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    onPageChange={setPage}
                />
            </div>
        </div>
    );
}

