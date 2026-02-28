import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowLeft, HiOutlineDocumentText, HiOutlineFolder, HiOutlineCheckCircle,
  HiOutlinePaperAirplane, HiOutlineClock, HiOutlineUsers, HiOutlineDocumentMagnifyingGlass,
  HiOutlineBeaker, HiOutlineShieldCheck, HiOutlineXCircle,
} from 'react-icons/hi2';
import StatsCard from '../../components/common/StatsCard';
import Badge from '../../components/common/Badge';
import { useApi } from '../../hooks/useApi';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('workflow');

  const { data: user, loading: userLoading, refetch } = useApi(`/admin/users/${id}`, {}, [id]);
  const { data: contractStats, loading: cLoading } = useApi(`/admin/users/${id}/contract-stats`, {}, [id]);
  const { data: projectStats, loading: pLoading } = useApi(`/admin/users/${id}/project-stats`, {}, [id]);

  const tabs = [
    { id: 'workflow', label: 'Workflow Analysis' },
    { id: 'risk', label: 'Risk & Negotiation' },
    { id: 'contracts', label: 'Contract Stats' },
    { id: 'projects', label: 'Project Stats' },
  ];

  const handleToggleArchive = async () => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/toggle-archive`);
      toast.success(data.message);
      refetch();
    } catch {
      toast.error('Failed to update user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/users')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold dark:text-white">User Detail</h1>
      </div>

      {/* User Info Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        {userLoading ? (
          <div className="space-y-3">
            <div className="skeleton h-8 w-48 rounded" />
            <div className="skeleton h-5 w-64 rounded" />
          </div>
        ) : user && !user.error ? (
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="w-16 h-16 rounded-full bg-[#3498db]/20 dark:bg-[#3498db]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-[#3498db] dark:text-[#5dade2]">
                {user.fullname?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Full Name</p>
                <p className="font-semibold dark:text-white">{user.fullname}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="dark:text-gray-200">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Phone</p>
                <p className="dark:text-gray-200">{user.phone_number || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Gender</p>
                <p className="capitalize dark:text-gray-200">{user.gender || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <Badge variant={user.status_label === 'Active' ? 'success' : user.status_label === 'Deactivated' ? 'danger' : 'warning'}>{user.status_label}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Last Login</p>
                <p className="dark:text-gray-200">{user.last_login || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Most Used Feature</p>
                <p className="dark:text-gray-200">{user.most_used_feature || '—'}</p>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleToggleArchive}
                  className={`text-xs px-4 py-2 rounded-lg transition-colors ${user.archived
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {user.archived ? 'Reactivate User' : 'Deactivate User'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">User not found or this is an admin account.</p>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-4 px-2 mr-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id
                ? 'border-[#3498db] text-[#3498db]'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'workflow' && <WorkflowTab userId={id} />}
          {tab === 'risk' && <RiskNegotiationTab userId={id} />}
          {tab === 'contracts' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatsCard title="Total" value={contractStats?.total_contracts} icon={HiOutlineDocumentText} color="indigo" loading={cLoading} />
              <StatsCard title="Drafted" value={contractStats?.drafted_contracts} icon={HiOutlineClock} color="amber" loading={cLoading} />
              <StatsCard title="Sent for Review" value={contractStats?.sent_for_review_contracts} icon={HiOutlinePaperAirplane} color="blue" loading={cLoading} />
              <StatsCard title="Signed" value={contractStats?.signed} icon={HiOutlineCheckCircle} color="green" loading={cLoading} />
              <StatsCard title="Completed" value={contractStats?.completed_contracts} icon={HiOutlineCheckCircle} color="purple" loading={cLoading} />
            </div>
          )}
          {tab === 'projects' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatsCard title="Total Projects" value={projectStats?.total_projects} icon={HiOutlineFolder} color="indigo" loading={pLoading} />
                <StatsCard title="Total Tasks" value={projectStats?.total_tasks} icon={HiOutlineCheckCircle} color="blue" loading={pLoading} />
                <StatsCard title="Ongoing" value={projectStats?.ongoing_projects} icon={HiOutlineClock} color="amber" loading={pLoading} />
                <StatsCard title="Upcoming" value={projectStats?.upcoming_projects} icon={HiOutlineClock} color="purple" loading={pLoading} />
                <StatsCard title="Completed" value={projectStats?.completed_projects} icon={HiOutlineCheckCircle} color="green" loading={pLoading} />
                <StatsCard title="Overdue" value={projectStats?.overdue_projects} icon={HiOutlineFolder} color="red" loading={pLoading} />
              </div>
              {projectStats?.project_members_count?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 dark:text-white">Project Members</h3>
                  <div className="space-y-2">
                    {projectStats.project_members_count.map((p) => (
                      <div key={p.project_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm dark:text-gray-200">{p.project_name}</span>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <HiOutlineUsers className="w-4 h-4" />
                          <span>{p.member_count} members</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkflowTab({ userId }) {
  const { data, loading } = useApi(`/admin/analysis/risk/list`, { per_page: 100 }, [userId]);
  const items = (data?.data || []).filter((i) => String(i.user_id) === String(userId));

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-lg" />)}</div>;

  const totalAnalyses = items.length;
  const contracts = items.filter(i => i.is_contract).length;
  const documents = items.filter(i => !i.is_contract).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Total Analyses" value={totalAnalyses} icon={HiOutlineDocumentMagnifyingGlass} color="indigo" />
        <StatsCard title="Contracts" value={contracts} icon={HiOutlineCheckCircle} color="green" />
        <StatsCard title="Documents" value={documents} icon={HiOutlineDocumentMagnifyingGlass} color="amber" />
      </div>
      {items.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm dark:text-white">Recent Workflow Analyses</h4>
          {items.slice(0, 10).map((item) => (
            <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm font-medium dark:text-white">{item.contract_title || item.original_filename}</p>
                <p className="text-xs text-gray-400">{item.created_at?.slice(0, 10)} &middot; {item.processing_time}s</p>
              </div>
              <Badge variant={item.is_contract ? 'info' : 'default'}>{item.is_contract ? 'Contract' : 'Document'}</Badge>
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No workflow analyses found for this user</p>}
    </div>
  );
}

function RiskNegotiationTab({ userId }) {
  const { data, loading } = useApi(`/admin/analysis/negotiation/list`, { per_page: 100 }, [userId]);
  const items = (data?.data || []).filter((i) => String(i.user_id) === String(userId));

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-lg" />)}</div>;

  const total = items.length;
  const completed = items.filter(i => i.status === 'completed').length;
  const failed = items.filter(i => i.status === 'failed').length;
  const pending = items.filter(i => i.status === 'pending' || i.status === 'processing').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Total" value={total} icon={HiOutlineBeaker} color="indigo" />
        <StatsCard title="Completed" value={completed} icon={HiOutlineCheckCircle} color="green" />
        <StatsCard title="Pending" value={pending} icon={HiOutlineClock} color="amber" />
        <StatsCard title="Failed" value={failed} icon={HiOutlineXCircle} color="red" />
      </div>
      {items.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm dark:text-white">Recent Analyses</h4>
          {items.slice(0, 10).map((item) => (
            <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm font-medium dark:text-white">{item.original_name || item.filename}</p>
                <p className="text-xs text-gray-400">{item.created_at?.slice(0, 10)}</p>
              </div>
              <Badge variant={item.status === 'completed' ? 'success' : item.status === 'failed' ? 'danger' : 'warning'}>{item.status}</Badge>
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No negotiation analyses found for this user</p>}
    </div>
  );
}
