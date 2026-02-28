import clsx from 'clsx';

const variants = {
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    Active: 'success', active: 'success', verified: 'success', completed: 'success', Completed: 'success',
    Inactive: 'warning', inactive: 'warning', Pending: 'warning', pending: 'warning', processing: 'info',
    Deactivated: 'danger', deactivated: 'danger', failed: 'danger', canceled: 'danger',
    Draft: 'default', 'Sent for Review': 'info', Signed: 'purple',
    ongoing: 'info', upcoming: 'warning', overdue: 'danger',
  };
  return <Badge variant={map[status] || 'default'}>{status}</Badge>;
}
