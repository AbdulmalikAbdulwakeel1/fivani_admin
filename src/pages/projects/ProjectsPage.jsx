import { useState } from 'react';
import { HiOutlineFolder, HiOutlineCheckCircle, HiOutlineClock, HiOutlineExclamationCircle, HiOutlineBolt } from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from '../../components/common/StatsCard';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import Badge from '../../components/common/Badge';
import { useApi } from '../../hooks/useApi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['', 'active', 'ongoing', 'upcoming', 'completed', 'overdue'];
const statusMap = {
    active: 'success',
    ongoing: 'info',
    upcoming: 'default',
    completed: 'purple',
    overdue: 'danger',
};

export default function ProjectsPage() {
    const [filter, setFilter] = useState('this_month');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');

    const { data: allData, loading: l1 } = useApi('/admin/projects/all', { filter }, [filter]);
    const { data: activeData, loading: l2 } = useApi('/admin/projects/active', { filter }, [filter]);
    const { data: completedData, loading: l3 } = useApi('/admin/projects/completed', { filter }, [filter]);
    const { data: overdueData, loading: l4 } = useApi('/admin/projects/overdue', { filter }, [filter]);
    const { data: ongoingData, loading: l5 } = useApi('/admin/projects/ongoing', { filter }, [filter]);
    const { data: cvData } = useApi('/admin/projects/completed-vs-active', { filter }, [filter]);
    const { data: listData, loading: listLoading, refetch } = useApi(
        '/admin/projects/list',
        { filter, page, ...(statusFilter ? { status: statusFilter } : {}), ...(search ? { search } : {}) },
        [filter, page, statusFilter, search]
    );

    const projects = listData?.data || [];
    const totalPages = listData?.meta?.last_page || 1;
    const total = listData?.meta?.total || 0;

    const handleRemind = async (id) => {
        try {
            await api.post(`/admin/projects/${id}/remind-overdue`);
            toast.success('Reminder sent!');
            refetch();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send reminder');
        }
    };

    const cvChartData = cvData
        ? [
            { name: 'Completed', value: cvData.completed_projects, pct: cvData.completed_percentage },
            { name: 'Active', value: cvData.active_projects, pct: cvData.active_percentage },
        ]
        : [];

    const columns = [
        { key: 'project_name', label: 'Project' },
        {
            key: 'creator',
            label: 'Creator',
            render: (val) => (
                <div>
                    <p className="text-sm">{val?.name}</p>
                    <p className="text-xs text-gray-500">{val?.email}</p>
                </div>
            ),
        },
        { key: 'due_date', label: 'Due Date' },
        {
            key: 'status_text',
            label: 'Status',
            render: (val, row) => (
                <Badge variant={row.is_overdue ? 'danger' : (statusMap[row.status] || 'default')}>
                    {row.is_overdue ? 'Overdue' : val}
                </Badge>
            ),
        },
        {
            key: 'members',
            label: 'Members',
            render: (val) => <span>{val?.join(', ') || '—'}</span>,
        },
        {
            key: 'actions',
            label: '',
            render: (_, row) =>
                row.is_overdue ? (
                    <button
                        onClick={() => handleRemind(row.id)}
                        className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg transition-colors"
                    >
                        Remind
                    </button>
                ) : null,
        },
    ];

    const filtered = projects;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold dark:text-white">Projects</h1>
                <FilterBar filter={filter} onFilterChange={setFilter} search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatsCard title="Total" value={allData?.total_projects} icon={HiOutlineFolder} color="indigo" loading={l1} />
                <StatsCard title="Active" value={activeData?.active_projects} icon={HiOutlineBolt} color="green" loading={l2} />
                <StatsCard title="Ongoing" value={ongoingData?.ongoing_projects} icon={HiOutlineClock} color="blue" loading={l5} />
                <StatsCard title="Completed" value={completedData?.completed_projects} icon={HiOutlineCheckCircle} color="purple" loading={l3} />
                <StatsCard title="Overdue" value={overdueData?.overdue_projects} icon={HiOutlineExclamationCircle} color="red" loading={l4} />
            </div>

            {/* Completed vs Active chart */}
            {cvChartData.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                    <h3 className="font-semibold mb-4 dark:text-white">Completed vs Active</h3>
                    <div className="flex items-center gap-8">
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={cvChartData}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#3498db" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col gap-4">
                            {cvChartData.map((d) => (
                                <div key={d.name}>
                                    <p className="text-sm text-gray-500">{d.name}</p>
                                    <p className="text-2xl font-bold dark:text-white">{d.pct?.toFixed(1)}%</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4">
                    <h3 className="font-semibold flex-1 dark:text-white">Project List</h3>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200"
                    >
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s || 'All Statuses'}</option>
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
