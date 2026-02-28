import { useState } from 'react';
import {
    HiOutlineBanknotes, HiOutlineUsers, HiOutlineDocumentText, HiOutlineCreditCard,
    HiOutlineShoppingBag, HiOutlineTag
} from 'react-icons/hi2';
import Badge from '../../components/common/Badge';
import { useApi } from '../../hooks/useApi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import Modal from '../../components/common/Modal';

const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'customers', label: 'Customers' },
    { id: 'charges', label: 'Charges' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'products', label: 'Products / Prices' },
];

export default function StripePage() {
    const [tab, setTab] = useState('overview');

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2 dark:text-white">
                <HiOutlineBanknotes className="w-7 h-7 text-[#3498db]" />
                Stripe
            </h1>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex border-b border-gray-200 dark:border-gray-800 px-6 overflow-x-auto">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`py-4 px-2 mr-5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab === t.id
                                    ? 'border-[#3498db] text-[#3498db]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="p-6">
                    {tab === 'overview' && <OverviewTab />}
                    {tab === 'customers' && <CustomersTab />}
                    {tab === 'charges' && <ChargesTab />}
                    {tab === 'invoices' && <InvoicesTab />}
                    {tab === 'subscriptions' && <StripeSubsTab />}
                    {tab === 'products' && <ProductsTab />}
                </div>
            </div>
        </div>
    );
}

function OverviewTab() {
    const { data: accountData, loading: aLoading } = useApi('/admin/stripe/account', {}, []);
    const { data: balanceData, loading: bLoading } = useApi('/admin/stripe/balance', {}, []);

    const account = accountData?.account;
    const balance = balanceData?.balance;

    return (
        <div className="space-y-6">
            {/* Account */}
            <div>
                <h3 className="font-semibold mb-3 dark:text-white">Account</h3>
                {aLoading ? (
                    <div className="skeleton h-32 rounded-xl" />
                ) : account ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InfoCard label="Account ID" value={<span className="font-mono text-xs">{account.id}</span>} />
                        <InfoCard label="Business Name" value={account.business_profile?.name || account.settings?.dashboard?.display_name || '—'} />
                        <InfoCard label="Country" value={account.country} />
                        <InfoCard label="Email" value={account.email} />
                        <InfoCard label="Charges Enabled" value={<Badge variant={account.charges_enabled ? 'success' : 'danger'}>{account.charges_enabled ? 'Yes' : 'No'}</Badge>} />
                        <InfoCard label="Payouts Enabled" value={<Badge variant={account.payouts_enabled ? 'success' : 'danger'}>{account.payouts_enabled ? 'Yes' : 'No'}</Badge>} />
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">No account data available.</p>
                )}
            </div>

            {/* Balance */}
            <div>
                <h3 className="font-semibold mb-3 dark:text-white">Balance</h3>
                {bLoading ? (
                    <div className="skeleton h-20 rounded-xl" />
                ) : balance ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                            <p className="text-xs text-gray-500 mb-2">Available</p>
                            {(balance.available || []).map((b, i) => (
                                <p key={i} className="text-2xl font-bold text-green-600">
                                    {(b.amount / 100).toLocaleString()} {b.currency?.toUpperCase()}
                                </p>
                            ))}
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                            <p className="text-xs text-gray-500 mb-2">Pending</p>
                            {(balance.pending || []).map((b, i) => (
                                <p key={i} className="text-2xl font-bold text-amber-600">
                                    {(b.amount / 100).toLocaleString()} {b.currency?.toUpperCase()}
                                </p>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">No balance data.</p>
                )}
            </div>
        </div>
    );
}

function CustomersTab() {
    const [showCreate, setShowCreate] = useState(false);
    const { data, loading, refetch } = useApi('/admin/stripe/customers', { limit: 20 }, []);
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

    const customers = data?.customers || [];

    const onSubmit = async (formData) => {
        try {
            await api.post('/admin/stripe/customers', formData);
            toast.success('Customer created!');
            setShowCreate(false);
            reset();
            refetch();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg text-sm font-medium">
                    + New Customer
                </button>
            </div>
            {loading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-800">
                                <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">ID</th>
                                <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Name</th>
                                <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Email</th>
                                <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((c) => (
                                <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="py-2 px-3 font-mono text-xs dark:text-gray-200">{c.id}</td>
                                    <td className="py-2 px-3 dark:text-gray-200">{c.name || '—'}</td>
                                    <td className="py-2 px-3 dark:text-gray-200">{c.email || '—'}</td>
                                    <td className="py-2 px-3 dark:text-gray-200">{c.created ? new Date(c.created * 1000).toLocaleDateString() : '—'}</td>
                                </tr>
                            ))}
                            {customers.length === 0 && (
                                <tr><td colSpan={4} className="py-6 text-center text-gray-400">No customers</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            <Modal open={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="Create Stripe Customer">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <SField label="Email" name="email" register={register} required type="email" />
                    <SField label="Name" name="name" register={register} />
                    <SField label="Phone" name="phone" register={register} />
                    <SField label="Description" name="description" register={register} />
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => { setShowCreate(false); reset(); }} className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">{isSubmitting ? 'Creating...' : 'Create'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function ChargesTab() {
    const { data, loading } = useApi('/admin/stripe/charges', { limit: 20 }, []);
    const charges = data?.charges || [];
    return (
        <StripeTable
            loading={loading}
            rows={charges}
            columns={[
                { key: 'id', label: 'ID', mono: true },
                { key: 'amount', label: 'Amount', render: (v, r) => `${(v / 100).toFixed(2)} ${r.currency?.toUpperCase()}` },
                { key: 'status', label: 'Status', badge: true },
                { key: 'description', label: 'Description' },
                { key: 'created', label: 'Date', render: (v) => v ? new Date(v * 1000).toLocaleDateString() : '—' },
            ]}
        />
    );
}

function InvoicesTab() {
    const { data, loading } = useApi('/admin/stripe/invoices', {}, []);
    const invoices = data?.invoices || [];
    return (
        <StripeTable
            loading={loading}
            rows={invoices}
            columns={[
                { key: 'id', label: 'ID', mono: true },
                { key: 'amount_due', label: 'Amount Due', render: (v, r) => `${(v / 100).toFixed(2)} ${r.currency?.toUpperCase()}` },
                { key: 'amount_paid', label: 'Amount Paid', render: (v, r) => `${(v / 100).toFixed(2)} ${r.currency?.toUpperCase()}` },
                { key: 'status', label: 'Status', badge: true },
                { key: 'created', label: 'Date', render: (v) => v ? new Date(v * 1000).toLocaleDateString() : '—' },
            ]}
        />
    );
}

function StripeSubsTab() {
    const { data, loading } = useApi('/admin/stripe/subscriptions', {}, []);
    const subs = data?.subscriptions || [];
    return (
        <StripeTable
            loading={loading}
            rows={subs}
            columns={[
                { key: 'id', label: 'ID', mono: true },
                { key: 'customer', label: 'Customer' },
                { key: 'status', label: 'Status', badge: true },
                { key: 'current_period_end', label: 'Period End', render: (v) => v ? new Date(v * 1000).toLocaleDateString() : '—' },
                { key: 'created', label: 'Created', render: (v) => v ? new Date(v * 1000).toLocaleDateString() : '—' },
            ]}
        />
    );
}

function ProductsTab() {
    const { data: productsData, loading: pLoading } = useApi('/admin/stripe/products', { limit: 20, active: true }, []);
    const { data: pricesData, loading: prLoading } = useApi('/admin/stripe/prices', { limit: 30 }, []);

    const products = productsData?.products || [];
    const prices = pricesData?.prices || [];

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 dark:text-white"><HiOutlineShoppingBag className="w-4 h-4" />Products</h3>
                <StripeTable
                    loading={pLoading}
                    rows={products}
                    columns={[
                        { key: 'id', label: 'ID', mono: true },
                        { key: 'name', label: 'Name' },
                        { key: 'description', label: 'Description' },
                        { key: 'active', label: 'Active', render: (v) => <Badge variant={v ? 'success' : 'danger'}>{v ? 'Yes' : 'No'}</Badge> },
                    ]}
                />
            </div>
            <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 dark:text-white"><HiOutlineTag className="w-4 h-4" />Prices</h3>
                <StripeTable
                    loading={prLoading}
                    rows={prices}
                    columns={[
                        { key: 'id', label: 'ID', mono: true },
                        { key: 'unit_amount', label: 'Amount', render: (v, r) => v ? `${(v / 100).toFixed(2)} ${r.currency?.toUpperCase()}` : '—' },
                        { key: 'recurring', label: 'Billing', render: (v) => v ? `${v.interval_count} ${v.interval}` : 'One-time' },
                        { key: 'active', label: 'Active', render: (v) => <Badge variant={v ? 'success' : 'danger'}>{v ? 'Yes' : 'No'}</Badge> },
                    ]}
                />
            </div>
        </div>
    );
}

function StripeTable({ loading, rows, columns }) {
    if (loading) return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}</div>;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                        {columns.map((c) => (
                            <th key={c.key} className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{c.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={row.id || i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            {columns.map((c) => (
                                <td key={c.key} className={`py-2 px-3 dark:text-gray-200 ${c.mono ? 'font-mono text-xs' : ''}`}>
                                    {c.render
                                        ? c.render(row[c.key], row)
                                        : c.badge
                                            ? <Badge variant={row[c.key] === 'active' || row[c.key] === 'succeeded' ? 'success' : row[c.key] === 'canceled' || row[c.key] === 'failed' ? 'danger' : 'default'}>{row[c.key]}</Badge>
                                            : (row[c.key] ?? '—')}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {rows.length === 0 && (
                        <tr><td colSpan={columns.length} className="py-6 text-center text-gray-400">No data</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function InfoCard({ label, value }) {
    return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <div className="font-medium text-sm dark:text-white">{value || '—'}</div>
        </div>
    );
}

function SField({ label, name, register, required, type = 'text' }) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">{label}</label>
            <input
                {...register(name, required ? { required: `${label} is required` } : {})}
                type={type}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
            />
        </div>
    );
}
