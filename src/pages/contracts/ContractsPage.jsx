import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlineDocumentText, HiOutlineCheckCircle, HiOutlinePaperAirplane,
    HiOutlinePencil, HiOutlineClipboardDocument
} from 'react-icons/hi2';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import StatsCard from '../../components/common/StatsCard';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import Badge from '../../components/common/Badge';
import { useApi } from '../../hooks/useApi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const statusMap = {
    Draft: 'default',
    'Sent for Review': 'info',
    Signed: 'success',
    Completed: 'purple',
};

const COLORS = ['#3498db', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ContractsPage() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('this_month');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

    const { data: allData, loading: l1 } = useApi('/admin/contracts/all', { filter }, [filter]);
    const { data: completedData, loading: l2 } = useApi('/admin/contracts/completed', { filter }, [filter]);
    const { data: signedData, loading: l3 } = useApi('/admin/contracts/signed', { filter }, [filter]);
    const { data: draftedData, loading: l4 } = useApi('/admin/contracts/drafted', { filter }, [filter]);
    const { data: jurisdictionData } = useApi('/admin/contracts/by-jurisdiction', { filter }, [filter]);
    const { data: clauseData } = useApi('/admin/contracts/clause-trends', { filter }, [filter]);
    const { data: funnelData } = useApi('/admin/contracts/conversion-funnel', { month }, [month]);
    const { data: listData, loading: listLoading } = useApi('/admin/contracts/list', { filter, page, ...(search ? { search } : {}) }, [filter, page, search]);

    const contracts = listData?.data || [];
    const totalPages = listData?.meta?.last_page || 1;
    const total = listData?.meta?.total || 0;

    const handleRemind = async (contractId) => {
        try {
            await api.post(`/admin/contracts/${contractId}/remind-draft`);
            toast.success('Reminder sent!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send reminder');
        }
    };

    const columns = [
        { key: 'contract_id', label: 'ID' },
        {
            key: 'client',
            label: 'Client',
            render: (val) => (
                <div>
                    <p className="text-sm font-medium dark:text-white">{val?.name}</p>
                    <p className="text-xs text-gray-500">{val?.email}</p>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (val) => <Badge variant={statusMap[val] || 'default'}>{val}</Badge>,
        },
        { key: 'last_action', label: 'Last Action' },
        { key: 'created_at', label: 'Created', render: (v) => v?.slice(0, 10) },
        {
            key: 'actions',
            label: '',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(`/contracts/${row.contract_auth}`)}
                        className="text-xs px-3 py-1.5 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg transition-colors"
                    >
                        View
                    </button>
                    {row.status === 'Draft' && (
                        <button
                            onClick={() => handleRemind(row.contract_auth)}
                            className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg transition-colors"
                        >
                            Remind
                        </button>
                    )}
                </div>
            ),
        },
    ];

    const filtered = contracts;

    const jurisdictions = jurisdictionData?.contracts_by_jurisdiction || [];
    const clauses = clauseData?.clause_usage_trends || [];
    const funnel = funnelData?.funnel || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold dark:text-white">Contracts</h1>
                <FilterBar filter={filter} onFilterChange={setFilter} search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Total Contracts" value={allData?.total_contracts} icon={HiOutlineDocumentText} color="indigo" loading={l1} />
                <StatsCard title="Completed" value={completedData?.completed_contracts} icon={HiOutlineCheckCircle} color="green" loading={l2} />
                <StatsCard title="Signed" value={signedData?.signed_contracts} icon={HiOutlinePaperAirplane} color="blue" loading={l3} />
                <StatsCard title="Drafted" value={draftedData?.draft_contracts} icon={HiOutlinePencil} color="amber" loading={l4} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Funnel */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold dark:text-white">Conversion Funnel</h3>
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-transparent dark:text-white"
                        />
                    </div>
                    <div className="space-y-3">
                        {funnel.map((stage, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600 dark:text-gray-400">{stage.stage}</span>
                                    <span className="font-semibold dark:text-white">{stage.count}</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${stage.percentage || 0}%`, background: COLORS[i] }}
                                    />
                                </div>
                            </div>
                        ))}
                        {funnel.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data</p>}
                    </div>
                </div>

                {/* Jurisdiction */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                    <h3 className="font-semibold mb-4 dark:text-white">By Jurisdiction</h3>
                    {jurisdictions.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={jurisdictions} dataKey="total" nameKey="jurisdiction" cx="50%" cy="50%" outerRadius={80}>
                                    {jurisdictions.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-8">No data</p>
                    )}
                </div>

                {/* Clause Trends */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                    <h3 className="font-semibold mb-4 dark:text-white">Clause Trends</h3>
                    {clauses.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={clauses} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis dataKey="clause" type="category" tick={{ fontSize: 10 }} width={80} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3498db" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-8">No data</p>
                    )}
                </div>
            </div>

            {/* Contract List */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="font-semibold dark:text-white">Contract List</h3>
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
