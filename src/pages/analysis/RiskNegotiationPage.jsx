import { useState } from 'react';
import {
    HiOutlineShieldCheck, HiOutlineUsers, HiOutlineClock, HiOutlineCheckCircle,
    HiOutlineXCircle, HiOutlineArrowTopRightOnSquare
} from 'react-icons/hi2';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatsCard from '../../components/common/StatsCard';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useApi } from '../../hooks/useApi';

const statusMap = { completed: 'success', pending: 'warning', processing: 'info', failed: 'danger' };

export default function RiskNegotiationPage() {
    const [filter, setFilter] = useState('this_month');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedId, setSelectedId] = useState(null);

    const { data: stats, loading: statsLoading } = useApi('/admin/analysis/negotiation/stats', { filter }, [filter]);
    const { data: trendsData } = useApi('/admin/analysis/negotiation/trends', { filter }, [filter]);
    const { data: listData, loading: listLoading } = useApi(
        '/admin/analysis/negotiation/list',
        { filter, page, ...(statusFilter ? { status: statusFilter } : {}), ...(search ? { search } : {}) },
        [filter, page, statusFilter, search]
    );
    const { data: detail, loading: detailLoading } = useApi(
        selectedId ? `/admin/analysis/negotiation/${selectedId}` : null,
        {},
        [selectedId]
    );

    const items = listData?.data || [];
    const totalPages = listData?.last_page || 1;
    const total = listData?.total || 0;

    const chartData = (trendsData?.trends || []).map((d) => ({
        date: d.date,
        Completed: d.completed || 0,
        Pending: d.pending || 0,
        Processing: d.processing || 0,
        Failed: d.failed || 0,
    }));

    const byStatus = stats?.by_status || {};

    const columns = [
        {
            key: 'original_name',
            label: 'File Name',
            render: (val, row) => (
                <div>
                    <p className="font-medium text-sm dark:text-white">{val || row.filename || '—'}</p>
                    {row.filename && row.filename !== val && (
                        <p className="text-xs text-gray-400 font-mono">{row.filename}</p>
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
            key: 'status',
            label: 'Status',
            render: (val) => <Badge variant={statusMap[val] || 'default'}>{val}</Badge>,
        },
        {
            key: 'file_path',
            label: 'File',
            render: (val, row) =>
                val ? (
                    <a
                        href={val.startsWith('http') ? val : `https://fivaniprod.blob.core.windows.net/contracts/${val}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#3498db] hover:underline text-xs"
                        onClick={(e) => e.stopPropagation()}
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
                <h1 className="text-2xl font-bold dark:text-white">Risk & Negotiation Analysis</h1>
                <FilterBar filter={filter} onFilterChange={setFilter} search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatsCard title="Total" value={stats?.total} icon={HiOutlineShieldCheck} color="indigo" loading={statsLoading} />
                <StatsCard title="Completed" value={byStatus.completed} icon={HiOutlineCheckCircle} color="green" loading={statsLoading} />
                <StatsCard title="Pending / Processing" value={(byStatus.pending || 0) + (byStatus.processing || 0)} icon={HiOutlineClock} color="amber" loading={statsLoading} />
                <StatsCard title="Failed" value={byStatus.failed} icon={HiOutlineXCircle} color="red" loading={statsLoading} />
            </div>

            {/* Status breakdown + unique users */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                    <h3 className="font-semibold mb-3 dark:text-white">Status Breakdown</h3>
                    <div className="space-y-2">
                        {Object.entries(byStatus).map(([status, count]) => {
                            const pct = stats?.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                            return (
                                <div key={status}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="capitalize text-gray-600 dark:text-gray-400">{status}</span>
                                        <span className="font-semibold dark:text-white">{count} ({pct}%)</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${status === 'completed' ? 'bg-green-500' :
                                                status === 'failed' ? 'bg-red-500' :
                                                    status === 'processing' ? 'bg-blue-500' : 'bg-amber-500'
                                                }`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="bg-[#3498db]/10 dark:bg-[#3498db]/10 border border-[#3498db]/30 dark:border-[#3498db]/30 rounded-xl p-5 flex flex-col items-center justify-center">
                    <p className="text-xs text-gray-500 mb-1">Unique Users</p>
                    <p className="text-5xl font-bold text-[#3498db]">{stats?.unique_users ?? '—'}</p>
                    <p className="text-sm text-gray-500 mt-1">have run analyses</p>
                </div>
            </div>

            {/* Trends Chart */}
            {chartData.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                    <h3 className="font-semibold mb-4 dark:text-white">Daily Trends</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="Pending" stroke="#f59e0b" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="Failed" stroke="#ef4444" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* List */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                    <h3 className="font-semibold flex-1 dark:text-white">All Analyses</h3>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200"
                    >
                        <option value="">All Statuses</option>
                        {['completed', 'pending', 'processing', 'failed'].map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
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
            <Modal open={!!selectedId} onClose={() => setSelectedId(null)} title="Analysis Detail" size="xl">
                {detailLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
                    </div>
                ) : detail ? (
                    <NegotiationDetailContent data={detail} />
                ) : null}
            </Modal>
        </div>
    );
}

function NegotiationDetailContent({ data }) {
    const result = data.analysis_result;
    return (
        <div className="space-y-5">
            {/* Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoItem label="File Name" value={data.original_name || data.filename} />
                <InfoItem label="Status" value={<Badge variant={statusMap[data.status] || 'default'}>{data.status}</Badge>} />
                <InfoItem label="User" value={<span>{data.user?.fullname || data.user?.name} <span className="text-xs text-gray-400">({data.user?.email})</span></span>} />
                <InfoItem label="Created" value={data.created_at?.slice(0, 10)} />
                <InfoItem label="Updated" value={data.updated_at?.slice(0, 10)} />
            </div>

            {/* File link */}
            {data.file_path && (
                <div className="p-3 bg-[#3498db]/5 dark:bg-[#3498db]/10 border border-[#3498db]/20 rounded-lg flex items-center gap-3">
                    <span className="text-sm font-medium text-[#2980b9] dark:text-[#5dade2]">Uploaded File:</span>
                    <a
                        href={data.file_path.startsWith('http') ? data.file_path : `https://fivaniprod.blob.core.windows.net/contracts/${data.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#3498db] hover:underline text-sm font-medium"
                    >
                        {data.original_name || data.filename} <HiOutlineArrowTopRightOnSquare className="w-4 h-4" />
                    </a>
                </div>
            )}

            {/* Error */}
            {data.error_message && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400"><strong>Error:</strong> {data.error_message}</p>
                </div>
            )}

            {/* Analysis Result */}
            {result && (
                <div>
                    <h3 className="font-semibold mb-3 dark:text-white">Analysis Results</h3>
                    {Array.isArray(result) ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {result.map((section, i) => (
                                <ResultSection key={i} section={section} />
                            ))}
                        </div>
                    ) : typeof result === 'object' ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {Object.entries(result).map(([key, val], i) => (
                                <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                    <h4 className="font-medium text-sm capitalize mb-2 dark:text-white">{key.replace(/_/g, ' ')}</h4>
                                    {typeof val === 'string' ? (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{val}</p>
                                    ) : Array.isArray(val) ? (
                                        <ul className="list-disc list-inside space-y-1">
                                            {val.map((item, j) => (
                                                <li key={j} className="text-sm text-gray-600 dark:text-gray-400">
                                                    {typeof item === 'string' ? item : JSON.stringify(item)}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <pre className="text-xs text-gray-500 whitespace-pre-wrap">{JSON.stringify(val, null, 2)}</pre>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <pre className="text-xs text-gray-500 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-x-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
}

function ResultSection({ section }) {
    if (!section) return null;
    const title = section.title || section.section || section.name || section.category;
    const content = section.content || section.details || section.description || section.text;
    const risk = section.risk_level || section.risk || section.severity;
    const recommendation = section.recommendation || section.suggestion;
    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                {title && <h4 className="font-medium text-sm dark:text-white">{title}</h4>}
                {risk && (
                    <Badge variant={risk === 'high' ? 'danger' : risk === 'medium' ? 'warning' : 'success'}>
                        {risk} risk
                    </Badge>
                )}
            </div>
            {content && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{content}</p>}
            {recommendation && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-[#3498db] dark:text-[#5dade2] font-medium">Recommendation</p>
                    <p className="text-xs text-gray-500 mt-1">{recommendation}</p>
                </div>
            )}
            {!content && !title && (
                <pre className="text-xs text-gray-500 whitespace-pre-wrap">{JSON.stringify(section, null, 2)}</pre>
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
