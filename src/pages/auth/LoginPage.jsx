import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();
  const [needs2FA, setNeeds2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [credentials, setCredentials] = useState({});

  const onSubmit = async (values) => {
    const code = needs2FA ? twoFactorCode : undefined;
    const email = needs2FA ? credentials.email : values.email;
    const password = needs2FA ? credentials.password : values.password;

    const result = await login(email, password, code);

    if (result.success) {
      toast.success('Welcome back!');
      navigate('/');
      return;
    }

    const data = result.data;
    if (data?.status === 'pending_2fa') {
      setCredentials({ email, password });
      setNeeds2FA(true);
      toast('Enter your 2FA code', { icon: '🔐' });
    } else {
      toast.error(data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002633] via-gray-900 to-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">Fivani</h1>
          <p className="text-gray-400 mt-2">Admin Dashboard</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold mb-6">{needs2FA ? 'Two-Factor Authentication' : 'Sign In'}</h2>

          {!needs2FA ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none dark:text-white"
                  placeholder="admin@fivani.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none dark:text-white"
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">2FA Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none text-center text-2xl tracking-widest dark:text-white"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading || twoFactorCode.length !== 6}
                className="w-full py-2.5 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>

              <button
                type="button"
                onClick={() => { setNeeds2FA(false); setTwoFactorCode(''); }}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
