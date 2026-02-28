import { useState } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineKey, HiOutlineUserGroup } from 'react-icons/hi2';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import { useApi } from '../../hooks/useApi';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function PermissionsPage() {
    const [activeTab, setActiveTab] = useState('permissions');

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold dark:text-white">Permissions & User Types</h1>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex border-b border-gray-200 dark:border-gray-800 px-6">
                    {[
                        { id: 'permissions', label: 'Permissions', icon: HiOutlineKey },
                        { id: 'user-types', label: 'User Types', icon: HiOutlineUserGroup },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 py-4 px-2 mr-6 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id
                                    ? 'border-[#3498db] text-[#3498db]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <t.icon className="w-4 h-4" />
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="p-6">
                    {activeTab === 'permissions' ? <PermissionsTab /> : <UserTypesTab />}
                </div>
            </div>
        </div>
    );
}

function PermissionsTab() {
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const { data, loading, refetch } = useApi('/admin/permissions', {}, []);
    const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm();

    const permissions = Array.isArray(data) ? data : (data?.data || []);

    const openEdit = (p) => {
        setEditItem(p);
        setValue('name', p.name);
        setValue('slug', p.slug);
        setValue('description', p.description || '');
        setShowModal(true);
    };

    const onSubmit = async (formData) => {
        try {
            if (editItem) {
                await api.put(`/admin/permissions/${editItem.id}`, formData);
                toast.success('Permission updated');
            } else {
                await api.post('/admin/permissions', formData);
                toast.success('Permission created');
            }
            setShowModal(false);
            setEditItem(null);
            reset();
            refetch();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this permission?')) return;
        try {
            await api.delete(`/admin/permissions/${id}`);
            toast.success('Permission deleted');
            refetch();
        } catch { toast.error('Failed to delete'); }
    };

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'slug', label: 'Slug', render: (v) => <span className="font-mono text-xs dark:text-gray-200">{v}</span> },
        { key: 'description', label: 'Description', render: (v) => v || '—' },
        {
            key: 'actions',
            label: '',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(row)} className="p-1.5 text-[#3498db] hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"><HiOutlinePencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(row.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><HiOutlineTrash className="w-4 h-4" /></button>
                </div>
            ),
        },
    ];

    return (
        <>
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => { setEditItem(null); reset(); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg text-sm font-medium"
                >
                    <HiOutlinePlus className="w-4 h-4" /> New Permission
                </button>
            </div>
            <DataTable columns={columns} data={permissions} loading={loading} />
            <Modal open={showModal} onClose={() => { setShowModal(false); setEditItem(null); reset(); }} title={editItem ? 'Edit Permission' : 'New Permission'}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <FormField label="Name" name="name" register={register} required />
                    <FormField label="Slug" name="slug" register={register} required placeholder="e.g. manage-users" />
                    <FormField label="Description" name="description" register={register} />
                    <FormActions onCancel={() => { setShowModal(false); reset(); }} isSubmitting={isSubmitting} submitLabel={editItem ? 'Save' : 'Create'} />
                </form>
            </Modal>
        </>
    );
}

function UserTypesTab() {
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const { data, loading, refetch } = useApi('/admin/user-types', {}, []);
    const { data: permissionsData } = useApi('/admin/permissions', {}, []);
    const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm();
    const [selectedPerms, setSelectedPerms] = useState([]);

    const userTypes = data?.data || [];
    const allPerms = Array.isArray(permissionsData) ? permissionsData : (permissionsData?.data || []);

    const openEdit = (ut) => {
        setEditItem(ut);
        setValue('name', ut.name);
        setValue('description', ut.description || '');
        setSelectedPerms(ut.permissions?.map((p) => p.id) || []);
        setShowModal(true);
    };

    const togglePerm = (id) => {
        setSelectedPerms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
    };

    const onSubmit = async (formData) => {
        try {
            const body = { ...formData, permissions: selectedPerms };
            if (editItem) {
                await api.put(`/admin/user-types/${editItem.id}`, body);
                toast.success('User type updated');
            } else {
                await api.post('/admin/user-types', body);
                toast.success('User type created');
            }
            setShowModal(false);
            setEditItem(null);
            reset();
            setSelectedPerms([]);
            refetch();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this user type?')) return;
        try {
            await api.delete(`/admin/user-types/${id}`);
            toast.success('User type deleted');
            refetch();
        } catch { toast.error('Failed to delete'); }
    };

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description', render: (v) => v || '—' },
        {
            key: 'permissions',
            label: 'Permissions',
            render: (val) => (
                <div className="flex flex-wrap gap-1">
                    {(val || []).slice(0, 3).map((p) => (
                        <Badge key={p.id} variant="info">{p.name}</Badge>
                    ))}
                    {(val || []).length > 3 && <Badge variant="default">+{val.length - 3}</Badge>}
                </div>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(row)} className="p-1.5 text-[#3498db] hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"><HiOutlinePencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(row.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><HiOutlineTrash className="w-4 h-4" /></button>
                </div>
            ),
        },
    ];

    return (
        <>
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => { setEditItem(null); reset(); setSelectedPerms([]); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg text-sm font-medium"
                >
                    <HiOutlinePlus className="w-4 h-4" /> New User Type
                </button>
            </div>
            <DataTable columns={columns} data={userTypes} loading={loading} />
            <Modal open={showModal} onClose={() => { setShowModal(false); setEditItem(null); reset(); }} title={editItem ? 'Edit User Type' : 'New User Type'} size="lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <FormField label="Name" name="name" register={register} required />
                    <FormField label="Description" name="description" register={register} />
                    <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">Permissions</label>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            {allPerms.map((p) => (
                                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded dark:text-gray-200">
                                    <input
                                        type="checkbox"
                                        checked={selectedPerms.includes(p.id)}
                                        onChange={() => togglePerm(p.id)}
                                        className="rounded border-gray-300 text-[#3498db]"
                                    />
                                    {p.name}
                                </label>
                            ))}
                        </div>
                    </div>
                    <FormActions onCancel={() => { setShowModal(false); reset(); }} isSubmitting={isSubmitting} submitLabel={editItem ? 'Save' : 'Create'} />
                </form>
            </Modal>
        </>
    );
}

function FormField({ label, name, register, required, placeholder }) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">{label}</label>
            <input
                {...register(name, required ? { required: `${label} is required` } : {})}
                placeholder={placeholder}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
            />
        </div>
    );
}

function FormActions({ onCancel, isSubmitting, submitLabel }) {
    return (
        <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:text-gray-200">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
                {isSubmitting ? 'Saving...' : submitLabel}
            </button>
        </div>
    );
}
