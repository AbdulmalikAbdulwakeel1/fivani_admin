import { useState } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi2';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useApi } from '../../hooks/useApi';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [filter, setFilter] = useState('this_month');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const { data: adminData, loading, refetch } = useApi('/admin/admin-users', { filter }, [filter, page]);
  const { data: userTypes } = useApi('/admin/user-types', {}, []);

  const admins = adminData?.data?.data || [];
  const totalPages = adminData?.data?.last_page || 1;
  const total = adminData?.data?.total || 0;

  // Separate form instances for create and edit
  const createForm = useForm();
  const editForm = useForm();

  const onCreateSubmit = async (data) => {
    try {
      await api.post('/admin/admin-users', data);
      toast.success('Admin user created!');
      setShowCreate(false);
      createForm.reset();
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin user');
    }
  };

  const openEditModal = (user) => {
    setEditUser(user);
    editForm.reset({ user_type_id: String(user.userType?.id || '') });
  };

  const onEditSubmit = async (data) => {
    try {
      await api.put(`/admin/admin-users/${editUser.id}`, {
        user_type_id: parseInt(data.user_type_id),
      });
      toast.success('Admin user role updated!');
      setEditUser(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update admin user');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this admin user?')) return;
    try {
      await api.delete(`/admin/admin-users/${id}`);
      toast.success('Admin user deleted');
      refetch();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggle = async (id) => {
    try {
      const { data } = await api.patch(`/admin/admin-users/${id}/toggle-activate`);
      toast.success(data.message);
      refetch();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const columns = [
    { key: 'fullname', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone_number', label: 'Phone' },
    {
      key: 'userType',
      label: 'Role',
      render: (val) => <Badge variant="info">{val?.name || '—'}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => (
        <Badge variant={row.archived ? 'danger' : 'success'}>{row.archived ? 'Inactive' : 'Active'}</Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 text-[#3498db] hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
          >
            <HiOutlinePencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggle(row.id)}
            className={`text-xs px-2 py-1 rounded transition-colors ${row.archived
              ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
              : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'
            }`}
          >
            {row.archived ? 'Activate' : 'Suspend'}
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filtered = search
    ? admins.filter(
      (u) =>
        u.fullname?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    )
    : admins;

  const typeOptions = userTypes?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold dark:text-white">Admin Users</h1>
        <div className="flex items-center gap-3">
          <FilterBar filter={filter} onFilterChange={setFilter} search={search} onSearchChange={setSearch} />
          <button
            onClick={() => { setShowCreate(true); createForm.reset(); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg text-sm font-medium transition-colors"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Admin
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); createForm.reset(); }} title="Create Admin User">
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Full Name</label>
            <input
              {...createForm.register('name', { required: 'Name is required' })}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
              placeholder="John Admin"
            />
            {createForm.formState.errors.name && <p className="text-red-500 text-xs mt-1">{createForm.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Email</label>
            <input
              {...createForm.register('email', { required: 'Email is required' })}
              type="email"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
              placeholder="admin@example.com"
            />
            {createForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{createForm.formState.errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Phone</label>
            <input
              {...createForm.register('phone', { required: 'Phone is required' })}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
              placeholder="+1234567890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Gender</label>
            <select
              {...createForm.register('gender', { required: 'Gender is required' })}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">User Type</label>
            <select
              {...createForm.register('user_type_id', { required: 'Role is required' })}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
            >
              <option value="">Select role</option>
              {typeOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowCreate(false); createForm.reset(); }} className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:text-gray-200">Cancel</button>
            <button type="submit" disabled={createForm.formState.isSubmitting} className="flex-1 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
              {createForm.formState.isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit Admin Role">
        {editUser && (
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium dark:text-white">{editUser.fullname}</p>
              <p className="text-sm text-gray-500">{editUser.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">User Type / Role</label>
              <select
                {...editForm.register('user_type_id', { required: 'Role is required' })}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
              >
                <option value="">Select role</option>
                {typeOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditUser(null)} className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:text-gray-200">Cancel</button>
              <button type="submit" disabled={editForm.formState.isSubmitting} className="flex-1 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
                {editForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
