import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineArrowDownTray } from 'react-icons/hi2';
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

export default function ContractDetailPage() {
    const { contractAuth } = useParams();
    const navigate = useNavigate();

    const { data, loading } = useApi(`/admin/contracts/${contractAuth}`, {}, [contractAuth]);

    const contract = data?.contract;
    const parties = data?.parties || [];
    const comments = data?.comments || [];
    const deliverables = data?.deliverables || [];
    const milestones = data?.milestones || [];
    const payments = data?.payments || [];
    const clauses = data?.['legalSections/clausesAdded'] || [];

    const handleDownload = async () => {
        try {
            const res = await api.get(`/admin/contracts/${contractAuth}/download`);
            if (res.data?.download_url) {
                window.open(res.data.download_url, '_blank');
            }
        } catch {
            toast.error('Failed to get download link');
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="skeleton h-8 w-48 rounded" />
                <div className="skeleton h-64 rounded-xl" />
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="text-center py-12 text-gray-500">Contract not found.</div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/contracts')}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <HiOutlineArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold dark:text-white">{contract.title || 'Contract Detail'}</h1>
                        <p className="text-sm text-gray-500">Auth: {contractAuth}</p>
                    </div>
                </div>
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg text-sm font-medium transition-colors"
                >
                    <HiOutlineArrowDownTray className="w-4 h-4" />
                    Download
                </button>
            </div>

            {/* Overview */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="font-semibold mb-4 dark:text-white">Overview</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <InfoItem label="Status" value={<Badge variant={statusMap[contract.status]}>{contract.status}</Badge>} />
                    <InfoItem label="Start Date" value={contract.start_date} />
                    <InfoItem label="End Date" value={contract.end_date} />
                    <InfoItem label="Duration" value={`${data.duration_in_days} days`} />
                    <InfoItem label="Sent Date" value={data.sent_date?.slice(0, 10) || '—'} />
                    <InfoItem label="Created" value={contract.created_at?.slice(0, 10)} />
                </div>
            </div>

            {/* Parties */}
            {parties.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                    <h2 className="font-semibold mb-4 dark:text-white">Parties</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {parties.map((p, i) => (
                            <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="font-medium dark:text-white">{p.first_name} {p.last_name}</p>
                                <p className="text-sm text-gray-500">{p.email_address}</p>
                                <p className="text-sm text-gray-500">{p.phone_number}</p>
                                <p className="text-xs text-gray-400 mt-1">{p.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Payments, Deliverables, Milestones, Clauses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {payments.length > 0 && (
                    <Section title="Payments">
                        {payments.map((p, i) => (
                            <div key={i} className="flex justify-between text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                                <span className="capitalize dark:text-gray-200">{p.payment_schedule}</span>
                                <span className="font-semibold dark:text-white">{p.payment_currency} {p.payment_amount?.toLocaleString()}</span>
                            </div>
                        ))}
                    </Section>
                )}
                {deliverables.length > 0 && (
                    <Section title="Deliverables">
                        {deliverables.map((d, i) => (
                            <div key={i} className="text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                                <p className="font-medium dark:text-white">{d.name}</p>
                                <p className="text-gray-500">{d.description} • Due: {d.due_date}</p>
                            </div>
                        ))}
                    </Section>
                )}
                {milestones.length > 0 && (
                    <Section title="Milestones">
                        {milestones.map((m, i) => (
                            <div key={i} className="text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                                <p className="font-medium">{m.name}</p>
                                <p className="text-gray-500">{m.description} • Due: {m.due_date}</p>
                            </div>
                        ))}
                    </Section>
                )}
                {clauses.length > 0 && (
                    <Section title="Legal Clauses">
                        {clauses.map((c, i) => (
                            <div key={i} className="text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                                <p className="font-medium dark:text-white">{c.section}</p>
                                <p className="text-gray-500 text-xs">{c.details}</p>
                            </div>
                        ))}
                    </Section>
                )}
            </div>

            {/* Comments */}
            {comments.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                    <h2 className="font-semibold mb-4 dark:text-white">Comments</h2>
                    <div className="space-y-3">
                        {comments.map((c) => (
                            <div key={c.comment_id} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-[#3498db]/10 dark:bg-[#3498db]/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#3498db]">
                                    {c.commenter?.first_name?.[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-medium dark:text-white">{c.commenter?.first_name} {c.commenter?.last_name} <span className="text-xs text-gray-400 font-normal">({c.commenter?.role})</span></p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{c.comment}</p>
                                    <p className="text-xs text-gray-400 mt-1">{c.comment_date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoItem({ label, value }) {
    return (
        <div>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <div className="font-medium text-sm dark:text-white">{value || '—'}</div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="font-semibold mb-3 dark:text-white">{title}</h2>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">{children}</div>
        </div>
    );
}
