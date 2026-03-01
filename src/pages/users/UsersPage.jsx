import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineUsers, HiOutlineBolt, HiOutlineClock, HiOutlineUserMinus } from 'react-icons/hi2';
import StatsCard from '../../components/common/StatsCard';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import Badge from '../../components/common/Badge';
import { useApi } from '../../hooks/useApi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const statusVariant = {
  Active: 'success',
  Inactive: 'warning',
  Pending: 'info',
  Deactivated: 'danger',
};

export default function UsersPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('this_month');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const { data: stats, loading: statsLoading } = useApi('/admin/dashboard/users-count', { filter }, [filter]);

  const { data: usersData, loading: usersLoading, refetch } = useApi(
    '/admin/users',
    { page, per_page: perPage, ...(search ? { search } : {}) },
    [page, search]
  );

  const users = usersData?.data || [];
  const totalPages = usersData?.last_page || 1;
  const total = usersData?.total || 0;

  const handleToggleArchive = async (id, archived) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/toggle-archive`);
      toast.success(data.message);
      refetch();
    } catch {
      toast.error('Failed to update user');
    }
  };

  const columns = [
    { key: 'fullname', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone_number', label: 'Phone' },
    {
      key: 'status_label',
      label: 'Status',
      render: (val) => <Badge variant={statusVariant[val] || 'default'}>{val}</Badge>,
    },
    { key: 'last_login', label: 'Last Login' },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/users/${row.id}`)}
            className="text-xs px-3 py-1.5 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg transition-colors"
          >
            View
          </button>
          <button
            onClick={() => handleToggleArchive(row.id, row.archived)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${row.archived
              ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {row.archived ? 'Activate' : 'Deactivate'}
          </button>
        </div>
      ),
    },
  ];

  const filtered = users;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold dark:text-white">Users ({total})</h1>
        <FilterBar filter={filter} onFilterChange={setFilter} search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Users" value={stats?.active_users} icon={HiOutlineBolt} color="green" loading={statsLoading} />
        <StatsCard title="New Users" value={stats?.new_users} icon={HiOutlineUsers} color="blue" loading={statsLoading} />
        <StatsCard title="Pending" value={stats?.pending_users} icon={HiOutlineClock} color="amber" loading={statsLoading} />
        <StatsCard title="Deactivated" value={stats?.deactivated_users} icon={HiOutlineUserMinus} color="red" loading={statsLoading} />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <DataTable
          columns={columns}
          data={filtered}
          loading={usersLoading}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
