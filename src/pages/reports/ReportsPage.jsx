import { useState } from 'react';
import {
  HiOutlineExclamationTriangle, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlineUsers, HiOutlineEye, HiOutlineDocumentText,
} from 'react-icons/hi2';
import StatsCard from '../../components/common/StatsCard';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useApi } from '../../hooks/useApi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const issueStatusMap = { open: 'warning', resolved: 'success', closed: 'default', dismissed: 'danger' };

export default function ReportsPage() {
  const [filter, setFilter] = useState('this_year');
  const [tab, setTab] = useState('contract');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Contract Issues
  const { data: ciStats, loading: ciStatsLoading } = useApi(
    '/admin/reports/contract-issues/stats', { filter }, [filter]
  );
  const { data: ciList, loading: ciListLoading, refetch: ciRefetch } = useApi(
    '/admin/reports/contract-issues',
    { filter, page, per_page: 15, ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}) },
    [filter, page, search, statusFilter]
  );

  // Analysis Issues
  const { data: aiStats, loading: aiStatsLoading } = useApi(
    '/admin/reports/analysis-issues/stats', { filter }, [filter]
  );
  const { data: aiList, loading: aiListLoading, refetch: aiRefetch } = useApi(
    '/admin/reports/analysis-issues',
    { filter, page, per_page: 15, ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}) },
    [filter, page, search, statusFilter]
  );

  const activeStats = tab === 'contract' ? ciStats : aiStats;
  const statsLoading = tab === 'contract' ? ciStatsLoading : aiStatsLoading;

  const viewDetail = async (id, type) => {
    setDetailLoading(true);
    try {
      const endpoint = type === 'contract'
        ? `/admin/reports/contract-issues/${id}`
        : `/admin/reports/analysis-issues/${id}`;
      const { data } = await api.get(endpoint);
      setSelectedIssue({ ...data, _type: type });
    } catch {
      toast.error('Failed to load issue details');
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (id, type, newStatus) => {
    try {
      const endpoint = type === 'contract'
        ? `/admin/reports/contract-issues/${id}/status`
        : `/admin/reports/analysis-issues/${id}/status`;
      await api.patch(endpoint, { status: newStatus });
      toast.success('Status updated');
      setSelectedIssue((prev) => prev ? { ...prev, status: newStatus } : null);
      if (type === 'contract') ciRefetch(); else aiRefetch();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const contractColumns = [
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
      key: 'contract',
      label: 'Contract',
      render: (val) => (
        <span className="text-sm dark:text-gray-200">{val?.title || '—'}</span>
      ),
    },
    {
      key: 'details',
      label: 'Issue',
      render: (val) => (
        <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[300px]" title={val}>
          {val || '—'}
        </p>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <Badge variant={issueStatusMap[val] || 'default'}>{val}</Badge>,
    },
    {
      key: 'created_at',
      label: 'Reported',
      render: (val) => val?.slice(0, 10),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); viewDetail(row.id, 'contract'); }}
          className="text-xs px-3 py-1.5 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg transition-colors"
        >
          View
        </button>
      ),
    },
  ];

  const analysisColumns = [
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
      key: 'contract_analysis',
      label: 'Analysis',
      render: (val) => (
        <div>
          <p className="text-sm dark:text-gray-200">{val?.original_name || val?.filename || '—'}</p>
          {val?.status && <Badge variant={val.status === 'completed' ? 'success' : 'warning'} className="mt-1">{val.status}</Badge>}
        </div>
      ),
    },
    {
      key: 'details',
      label: 'Issue',
      render: (val) => (
        <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[300px]" title={val}>
          {val || '—'}
        </p>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <Badge variant={issueStatusMap[val] || 'default'}>{val}</Badge>,
    },
    {
      key: 'created_at',
      label: 'Reported',
      render: (val) => val?.slice(0, 10),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); viewDetail(row.id, 'analysis'); }}
          className="text-xs px-3 py-1.5 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg transition-colors"
        >
          View
        </button>
      ),
    },
  ];

  const currentList = tab === 'contract' ? ciList : aiList;
  const currentLoading = tab === 'contract' ? ciListLoading : aiListLoading;
  const currentColumns = tab === 'contract' ? contractColumns : analysisColumns;
  const items = currentList?.data || [];
  const totalPages = currentList?.last_page || 1;
  const total = currentList?.total || 0;

  const tabs = [
    { id: 'contract', label: 'Contract Issues' },
    { id: 'analysis', label: 'Analysis Issues' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold dark:text-white">Reports</h1>
        <FilterBar
          filter={filter}
          onFilterChange={(f) => { setFilter(f); setPage(1); }}
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Total Issues" value={activeStats?.total} icon={HiOutlineExclamationTriangle} color="indigo" loading={statsLoading} />
        <StatsCard title="Open" value={activeStats?.open} icon={HiOutlineDocumentText} color="amber" loading={statsLoading} />
        <StatsCard title="Resolved" value={activeStats?.resolved} icon={HiOutlineCheckCircle} color="green" loading={statsLoading} />
        <StatsCard title="Unique Users" value={activeStats?.unique_users} icon={HiOutlineUsers} color="blue" loading={statsLoading} />
      </div>

      {/* Tabs + List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6">
          <div className="flex overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setPage(1); setStatusFilter(''); }}
                className={`py-4 px-2 mr-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? 'border-[#3498db] text-[#3498db]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        <DataTable
          columns={currentColumns}
          data={items}
          loading={currentLoading}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
          onRowClick={(row) => viewDetail(row.id, tab)}
          emptyMessage={`No ${tab === 'contract' ? 'contract' : 'analysis'} issues found`}
        />
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!selectedIssue || detailLoading}
        onClose={() => setSelectedIssue(null)}
        title="Issue Details"
        size="xl"
      >
        {detailLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
          </div>
        ) : selectedIssue ? (
          <IssueDetailContent
            issue={selectedIssue}
            onUpdateStatus={(newStatus) => updateStatus(selectedIssue.id, selectedIssue._type, newStatus)}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function IssueDetailContent({ issue, onUpdateStatus }) {
  const isContract = issue._type === 'contract';

  return (
    <div className="space-y-5">
      {/* Meta info */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <InfoItem label="Reported By" value={
          <span>
            {issue.user?.fullname || '—'}
            {issue.user?.email && <span className="text-xs text-gray-400 ml-1">({issue.user.email})</span>}
          </span>
        } />
        <InfoItem label="Status" value={<Badge variant={issueStatusMap[issue.status] || 'default'}>{issue.status}</Badge>} />
        <InfoItem label="Reported On" value={issue.created_at?.slice(0, 10)} />
        {isContract && issue.contract && (
          <InfoItem label="Contract" value={issue.contract.title || `#${issue.contract_id}`} />
        )}
        {!isContract && issue.contract_analysis && (
          <InfoItem label="Analysis File" value={issue.contract_analysis.original_name || issue.contract_analysis.filename || `#${issue.contract_analysis_id}`} />
        )}
        <InfoItem label="Last Updated" value={issue.updated_at?.slice(0, 10)} />
      </div>

      {/* Issue Details */}
      <div>
        <h3 className="font-semibold mb-2 dark:text-white">Issue Details</h3>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {issue.details || 'No details provided.'}
          </p>
        </div>
      </div>

      {/* Contract details if available */}
      {isContract && issue.contract && (
        <div>
          <h3 className="font-semibold mb-2 dark:text-white">Contract Information</h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 grid grid-cols-2 gap-3">
            {issue.contract.title && <MiniInfo label="Title" value={issue.contract.title} />}
            {issue.contract.status && <MiniInfo label="Status" value={issue.contract.status} />}
            {issue.contract.jurisdiction && <MiniInfo label="Jurisdiction" value={issue.contract.jurisdiction} />}
            {issue.contract.created_at && <MiniInfo label="Created" value={issue.contract.created_at?.slice(0, 10)} />}
          </div>
        </div>
      )}

      {/* Analysis details if available */}
      {!isContract && issue.contract_analysis && (
        <div>
          <h3 className="font-semibold mb-2 dark:text-white">Analysis Information</h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 grid grid-cols-2 gap-3">
            {issue.contract_analysis.original_name && <MiniInfo label="File" value={issue.contract_analysis.original_name} />}
            {issue.contract_analysis.status && <MiniInfo label="Status" value={issue.contract_analysis.status} />}
            {issue.contract_analysis.created_at && <MiniInfo label="Created" value={issue.contract_analysis.created_at?.slice(0, 10)} />}
          </div>
        </div>
      )}

      {/* Update Status */}
      <div>
        <h3 className="font-semibold mb-2 dark:text-white">Update Status</h3>
        <div className="flex flex-wrap gap-2">
          {['open', 'resolved', 'closed', 'dismissed'].map((s) => (
            <button
              key={s}
              onClick={() => onUpdateStatus(s)}
              disabled={issue.status === s}
              className={`px-4 py-2 text-sm rounded-lg capitalize transition-colors ${
                issue.status === s
                  ? 'bg-[#3498db] text-white cursor-default'
                  : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
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

function MiniInfo({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm dark:text-gray-200">{value}</p>
    </div>
  );
}
