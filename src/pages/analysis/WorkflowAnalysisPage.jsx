import { useState } from 'react';
import {
    HiOutlineDocumentMagnifyingGlass, HiOutlineUsers, HiOutlineClock, HiOutlineCheckCircle,
    HiOutlineArrowLeft, HiOutlineArrowTopRightOnSquare
} from 'react-icons/hi2';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatsCard from '../../components/common/StatsCard';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useApi } from '../../hooks/useApi';
import api from '../../services/api';

export default function WorkflowAnalysisPage() {
    const [filter, setFilter] = useState('this_month');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState(null);

    const { data: stats, loading: statsLoading } = useApi('/admin/analysis/risk/stats', { filter }, [filter]);
    const { data: trendsData } = useApi('/admin/analysis/risk/trends', { filter }, [filter]);
    const { data: listData, loading: listLoading } = useApi(
        '/admin/analysis/risk/list',
        { filter, page, ...(search ? { search } : {}) },
        [filter, page, search]
    );
    const { data: detail, loading: detailLoading } = useApi(
        selectedId ? `/admin/analysis/risk/${selectedId}` : null,
        {},
        [selectedId]
    );

    const items = listData?.data || [];
    const totalPages = listData?.last_page || 1;
    const total = listData?.total || 0;

    const chartData = (trendsData?.trends || []).map((d) => ({
        date: d.date?.slice(5),
        Total: d.total,
        Contracts: d.contracts,
        'Non-Contracts': d.non_contracts,
    }));

    const columns = [
        {
            key: 'contract_title',
            label: 'Title / File',
            render: (val, row) => (
                <div>
                    <p className="font-medium text-sm dark:text-white">{val || row.original_filename || '—'}</p>
                    {val && row.original_filename && (
                        <p className="text-xs text-gray-400">{row.original_filename}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'user',
            label: 'User',
            render: (val) => (
                <div>
                    <p className="text-sm">{val?.fullname || val?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{val?.email}</p>
                </div>
            ),
        },
        {
            key: 'is_contract',
            label: 'Type',
            render: (val) => (
                <Badge variant={val ? 'info' : 'default'}>{val ? 'Contract' : 'Document'}</Badge>
            ),
        },
        {
            key: 'processing_time',
            label: 'Processing',
            render: (val) => val ? `${val}s` : '—',
        },
        {
            key: 'azure_file_url',
            label: 'File',
            render: (val) =>
                val ? (
                    <a
                        href={val}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#3498db] hover:underline text-xs"
                    >
                        View File <HiOutlineArrowTopRightOnSquare className="w-3 h-3" />
                    </a>
                ) : (
                    <span className="text-gray-400 text-xs">—</span>
                ),
        },
        {
            key: 'created_at',
            label: 'Date',
            render: (val) => val?.slice(0, 10),
        },
        {
            key: 'actions',
            label: '',
            render: (_, row) => (
                <button
                    onClick={() => setSelectedId(row.id)}
                    className="text-xs px-3 py-1.5 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg transition-colors"
                >
                    Detail
                </button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold dark:text-white">Workflow Analysis</h1>
                <FilterBar filter={filter} onFilterChange={setFilter} search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatsCard title="Total Analyses" value={stats?.total} icon={HiOutlineDocumentMagnifyingGlass} color="indigo" loading={statsLoading} />
                <StatsCard title="Contracts" value={stats?.contract_count} icon={HiOutlineCheckCircle} color="green" loading={statsLoading} />
                <StatsCard title="Documents" value={stats?.non_contract_count} icon={HiOutlineDocumentMagnifyingGlass} color="amber" loading={statsLoading} />
                <StatsCard title="Unique Users" value={stats?.unique_users} icon={HiOutlineUsers} color="blue" loading={statsLoading} />
            </div>

            {/* Avg time banner */}
            {stats?.avg_processing_time > 0 && (
                <div className="bg-[#3498db]/10 dark:bg-[#3498db]/10 border border-[#3498db]/30 dark:border-[#3498db]/30 rounded-xl p-4 flex items-center gap-3">
                    <HiOutlineClock className="w-5 h-5 text-[#3498db] flex-shrink-0" />
                    <p className="text-sm text-[#2980b9] dark:text-[#5dade2]">
                        Average processing time: <strong>{stats.avg_processing_time}s</strong>
                    </p>
                </div>
            )}

            {/* Trend Chart */}
            {chartData.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                    <h3 className="font-semibold mb-4 dark:text-white">Daily Workflow Trends</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="Total" stroke="#3498db" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="Contracts" stroke="#10b981" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="Non-Contracts" stroke="#f59e0b" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* List */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="font-semibold dark:text-white">All Workflow Analyses</h3>
                </div>
                <DataTable
                    columns={columns}
                    data={items}
                    loading={listLoading}
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    onPageChange={setPage}
                    onRowClick={(row) => setSelectedId(row.id)}
                />
            </div>

            {/* Detail Modal */}
            <Modal open={!!selectedId} onClose={() => setSelectedId(null)} title="Workflow Analysis Detail" size="xl">
                {detailLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
                    </div>
                ) : detail ? (
                    <WorkflowDetailContent data={detail} />
                ) : null}
            </Modal>
        </div>
    );
}

function WorkflowDetailContent({ data }) {
    return (
        <div className="space-y-5">
            {/* Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoItem label="Title" value={data.contract_title || data.original_filename} />
                <InfoItem label="Type" value={<Badge variant={data.is_contract ? 'info' : 'default'}>{data.is_contract ? 'Contract' : 'Document'}</Badge>} />
                <InfoItem label="Processing Time" value={data.processing_time ? `${data.processing_time}s` : '—'} />
                <InfoItem label="Processed At" value={data.processed_at?.slice(0, 19)?.replace('T', ' ')} />
                <InfoItem label="Created At" value={data.created_at?.slice(0, 10)} />
                <InfoItem
                    label="User"
                    value={<span>{data.user?.fullname || data.user?.name} <span className="text-gray-400 text-xs">({data.user?.email})</span></span>}
                />
            </div>

            {/* File link */}
            {data.azure_file_url && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center gap-3">
                    <span className="text-sm font-medium text-[#2980b9] dark:text-[#5dade2]">Uploaded File:</span>
                    <a
                        href={data.azure_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#3498db] hover:underline text-sm font-medium"
                    >
                        {data.original_filename} <HiOutlineArrowTopRightOnSquare className="w-4 h-4" />
                    </a>
                </div>
            )}

            {/* Analysis Data */}
            {data.analysis_data && data.analysis_data.length > 0 && (
                <div>
                    <h3 className="font-semibold mb-3 dark:text-white">Analysis Results</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {data.analysis_data.map((section, i) => (
                            <AnalysisSection key={i} section={section} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function AnalysisSection({ section }) {
    if (!section) return null;
    // Handle different possible structures from the AI engine
    const title = section.title || section.section || section.name || section.category || `Section`;
    const content = section.content || section.details || section.description || section.value || section.text;
    const risk = section.risk_level || section.risk || section.severity;

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm dark:text-white">{title}</h4>
                {risk && (
                    <Badge variant={risk === 'high' ? 'danger' : risk === 'medium' ? 'warning' : 'success'}>
                        {risk}
                    </Badge>
                )}
            </div>
            {content && <p className="text-sm text-gray-600 dark:text-gray-400">{content}</p>}
            {/* If section is something else, just display as JSON */}
            {!content && !title.startsWith('Section') && (
                <pre className="text-xs text-gray-500 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(section, null, 2)}
                </pre>
            )}
        </div>
    );
}

function InfoItem({ label, value }) {
    return (
        <div>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <div className="text-sm font-medium dark:text-white">{value || '—'}</div>
        </div>
    );
}
