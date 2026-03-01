import { useState } from 'react';
import { HiOutlineDocumentMagnifyingGlass, HiOutlineUsers, HiOutlineChartBar, HiOutlineClock } from 'react-icons/hi2';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatsCard from '../../components/common/StatsCard';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import Badge from '../../components/common/Badge';
import { useApi } from '../../hooks/useApi';

const negStatusMap = { completed: 'success', pending: 'warning', processing: 'info', failed: 'danger' };

export default function AnalysisPage() {
    const [filter, setFilter] = useState('this_month');
    const [tab, setTab] = useState('risk');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [negStatus, setNegStatus] = useState('');

    const { data: overview, loading: ovLoading } = useApi('/admin/analysis/overview', { filter }, [filter]);
    const { data: riskStats, loading: rsLoading } = useApi('/admin/analysis/risk/stats', { filter }, [filter]);
    const { data: riskTrends } = useApi('/admin/analysis/risk/trends', { filter }, [filter]);
    const { data: riskList, loading: rListLoading } = useApi('/admin/analysis/risk/list', { filter, page, search }, [filter, page, search]);
    const { data: negStats, loading: nsLoading } = useApi('/admin/analysis/negotiation/stats', { filter }, [filter]);
    const { data: negTrends } = useApi('/admin/analysis/negotiation/trends', { filter }, [filter]);
    const { data: negList, loading: nListLoading } = useApi(
        '/admin/analysis/negotiation/list',
        { filter, page, ...(negStatus ? { status: negStatus } : {}), search },
        [filter, page, negStatus, search]
    );

    const riskChartData = (riskTrends?.trends || []).map((d) => ({
        date: d.date?.slice(5),
        Total: d.total,
        Contracts: d.contracts,
        'Non-Contracts': d.non_contracts,
    }));

    const negChartData = (negTrends?.trends || []).map((d) => ({
        date: d.date?.slice(5),
        Completed: d.completed,
        Pending: d.pending,
        Failed: d.failed,
    }));

    const riskItems = riskList?.data || [];
    const riskTotal = riskList?.total || 0;
    const riskPages = riskList?.last_page || 1;
    const negItems = negList?.data || [];
    const negTotal = negList?.total || 0;
    const negPages = negList?.last_page || 1;

    const riskColumns = [
        { key: 'contract_title', label: 'Title', render: (v, r) => v || r.original_filename },
        {
            key: 'user',
            label: 'User',
            render: (val) => <span className="text-sm">{val?.fullname || val?.name || val?.email || '—'}</span>,
        },
        {
            key: 'is_contract',
            label: 'Type',
            render: (val) => <Badge variant={val ? 'info' : 'default'}>{val ? 'Contract' : 'Document'}</Badge>,
        },
        { key: 'processing_time', label: 'Processing (s)', render: (v) => v ? Number(v).toFixed(1) : '—' },
        { key: 'processed_at', label: 'Processed', render: (v) => v?.slice(0, 10) },
    ];

    const negColumns = [
        { key: 'original_name', label: 'File' },
        {
            key: 'user',
            label: 'User',
            render: (val) => <span className="text-sm">{val?.fullname || val?.name || val?.email || '—'}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            render: (val) => <Badge variant={negStatusMap[val] || 'default'}>{val}</Badge>,
        },
        { key: 'created_at', label: 'Created', render: (v) => v?.slice(0, 10) },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold dark:text-white">Analysis</h1>
                <FilterBar filter={filter} onFilterChange={setFilter} search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} />
            </div>

            {/* Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatsCard title="Risk Analyses" value={overview?.risk_analysis?.total} icon={HiOutlineDocumentMagnifyingGlass} color="indigo" loading={ovLoading} />
                <StatsCard title="Negotiation Analyses" value={overview?.negotiation_analysis?.total} icon={HiOutlineChartBar} color="blue" loading={ovLoading} />
                <StatsCard title="Combined Total" value={overview?.combined_total} icon={HiOutlineUsers} color="purple" loading={ovLoading} />
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex border-b border-gray-200 dark:border-gray-800 px-6">
                    {['risk', 'negotiation'].map((t) => (
                        <button
                            key={t}
                            onClick={() => { setTab(t); setPage(1); }}
                            className={`py-4 px-2 mr-6 text-sm font-medium border-b-2 capitalize transition-colors ${tab === t
                                    ? 'border-[#3498db] text-[#3498db]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {t} Analysis
                        </button>
                    ))}
                </div>

                <div className="p-6 space-y-6">
                    {tab === 'risk' && (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <StatsCard title="Total" value={riskStats?.total} icon={HiOutlineDocumentMagnifyingGlass} color="indigo" loading={rsLoading} />
                                <StatsCard title="Contracts" value={riskStats?.contract_count} icon={HiOutlineChartBar} color="blue" loading={rsLoading} />
                                <StatsCard title="Non-Contracts" value={riskStats?.non_contract_count} icon={HiOutlineChartBar} color="amber" loading={rsLoading} />
                                <StatsCard title="Unique Users" value={riskStats?.unique_users} icon={HiOutlineUsers} color="green" loading={rsLoading} />
                            </div>
                            {riskChartData.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3 dark:text-white">Risk Trends</h3>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <LineChart data={riskChartData}>
                                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="Total" stroke="#3498db" dot={false} />
                                            <Line type="monotone" dataKey="Contracts" stroke="#10b981" dot={false} />
                                            <Line type="monotone" dataKey="Non-Contracts" stroke="#f59e0b" dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                            <DataTable columns={riskColumns} data={riskItems} loading={rListLoading} page={page} totalPages={riskPages} total={riskTotal} onPageChange={setPage} />
                        </>
                    )}

                    {tab === 'negotiation' && (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <StatsCard title="Total" value={negStats?.total} icon={HiOutlineChartBar} color="blue" loading={nsLoading} />
                                <StatsCard title="Completed" value={negStats?.by_status?.completed} icon={HiOutlineUsers} color="green" loading={nsLoading} />
                                <StatsCard title="Pending" value={negStats?.by_status?.pending} icon={HiOutlineClock} color="amber" loading={nsLoading} />
                                <StatsCard title="Failed" value={negStats?.by_status?.failed} icon={HiOutlineClock} color="red" loading={nsLoading} />
                            </div>
                            {negChartData.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3 dark:text-white">Negotiation Trends</h3>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <LineChart data={negChartData}>
                                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="Completed" stroke="#10b981" dot={false} />
                                            <Line type="monotone" dataKey="Pending" stroke="#f59e0b" dot={false} />
                                            <Line type="monotone" dataKey="Failed" stroke="#ef4444" dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <select
                                    value={negStatus}
                                    onChange={(e) => { setNegStatus(e.target.value); setPage(1); }}
                                    className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200"
                                >
                                    <option value="">All Statuses</option>
                                    {['completed', 'pending', 'processing', 'failed'].map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <DataTable columns={negColumns} data={negItems} loading={nListLoading} page={page} totalPages={negPages} total={negTotal} onPageChange={setPage} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
