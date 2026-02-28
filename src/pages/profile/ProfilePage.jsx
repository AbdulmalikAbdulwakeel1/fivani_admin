import { useState, useEffect, useRef } from 'react';
import { HiOutlineShieldCheck, HiOutlineKey, HiOutlineCamera } from 'react-icons/hi2';
import useAuthStore from '../../stores/authStore';
import { useApi } from '../../hooks/useApi';
import Badge from '../../components/common/Badge';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, fetchProfile } = useAuthStore();
  const { data: permissions, loading: permLoading } = useApi('/admin/admin-users/my-permissions', {}, []);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => { fetchProfile(); }, []);

  const handlePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error('Only JPEG, JPG and PNG images are allowed');
      return;
    }
    if (file.size > 2048 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    const formData = new FormData();
    formData.append('profile_picture', file);

    setUploading(true);
    try {
      await api.post('/update-profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Profile picture updated!');
      await fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload picture');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const profilePic = user?.profile_picture || user?.avatar;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold dark:text-white">My Profile</h1>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start gap-6">
          <div className="relative group flex-shrink-0">
            {profilePic ? (
              <img
                src={profilePic}
                alt={user?.fullname}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#3498db] flex items-center justify-center text-white text-3xl font-bold">
                {user?.fullname?.[0]?.toUpperCase() || 'A'}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <HiOutlineCamera className="w-6 h-6 text-white" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handlePictureUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold dark:text-white">{user?.fullname}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem label="Phone" value={user?.phone_number} />
              <InfoItem label="Gender" value={user?.gender} />
              <InfoItem label="Role" value={user?.is_admin ? 'Administrator' : 'User'} />
              <InfoItem label="Account Status" value={
                <Badge variant="success">Active</Badge>
              } />
              {user?.timezone && <InfoItem label="Timezone" value={user.timezone} />}
              {user?.language && <InfoItem label="Language" value={user.language} />}
            </div>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineShieldCheck className="w-5 h-5 text-[#3498db]" />
          <h3 className="font-semibold dark:text-white">My Permissions</h3>
        </div>
        {permLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="skeleton h-8 rounded" />)}</div>
        ) : (
          <div>
            {permissions?.user_type && (
              <p className="text-sm text-gray-500 mb-3">
                Role: <Badge variant="info">{permissions.user_type}</Badge>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {(permissions?.permissions || []).map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <HiOutlineKey className="w-3.5 h-3.5 text-[#3498db]" />
                  <span className="text-sm dark:text-gray-200">{p.name}</span>
                </div>
              ))}
              {(!permissions?.permissions || permissions.permissions.length === 0) && (
                <p className="text-sm text-gray-400">No permissions assigned</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <div className="text-sm font-medium capitalize dark:text-gray-200">{value || '—'}</div>
    </div>
  );
}
