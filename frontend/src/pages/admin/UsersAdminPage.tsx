import { useState } from 'react';
import { useAdminUsers, useUpdateAdminUser } from '@/hooks/useAdmin';
import { useAuthStore } from '@/store/authStore';
import { Shield, User as UserIcon, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User } from '@/types';

type AdminUser = User & { created_at?: string | null };

export default function UsersAdminPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminUsers(page);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const updateUser = useUpdateAdminUser();

  const handleUpdate = (id: number, body: { is_active?: boolean; is_admin?: boolean }) => {
    updateUser.mutate(
      { id, body },
      {
        onSuccess: () => {
          const action = body.is_active !== undefined
            ? (body.is_active ? 'Account unlocked' : 'Account locked')
            : (body.is_admin ? 'Granted admin role' : 'Removed admin role');
          toast.success(action);
        },
        onError: (err: unknown) => {
          toast.error(
            (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
              'Failed to update user',
          );
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">User Directory</h1>
        <p className="text-xs text-gray-500 mt-0.5">Browse registered accounts, contact details, and administration access levels.</p>
      </div>

      {/* Role Descriptions Banner */}
      <div className="bg-white border rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex gap-2">
          <div className="bg-gray-100 p-2 rounded-lg text-gray-600 h-9 w-9 flex items-center justify-center shrink-0">
            <UserIcon size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-800 block">Standard Customer Role</span>
            <p className="text-[12px] text-gray-500 mt-0.5">Can place orders, add products to carts, manage delivery addresses, and leave reviews.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="bg-purple-50 p-2 rounded-lg text-purple-600 h-9 w-9 flex items-center justify-center shrink-0">
            <Shield size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-purple-900 block">Administrator Staff Role</span>
            <p className="text-[12px] text-gray-500 mt-0.5">Full backend privileges. Can configure products, design banners, and process orders.</p>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-xl border overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-5 py-3.5 font-semibold text-xs">Customer ID</th>
              <th className="px-5 py-3.5 font-semibold text-xs">Customer Name</th>
              <th className="px-5 py-3.5 font-semibold text-xs">Registered Email Address</th>
              <th className="px-5 py-3.5 font-semibold text-xs">Contact Number</th>
              <th className="px-5 py-3.5 font-semibold text-xs">Account Authorization Level</th>
              <th className="px-5 py-3.5 font-semibold text-xs">Login Status</th>
              <th className="px-5 py-3.5 font-semibold text-xs">Account Created On</th>
              <th className="px-5 py-3.5 font-semibold text-xs text-right">Administration</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">Loading accounts register...</td></tr>
            ) : data?.items?.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">No registered users found.</td></tr>
            ) : (
              data?.items?.map((u: AdminUser) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-400 font-semibold">#{u.id}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{u.full_name}</td>
                  <td className="px-5 py-3.5 text-gray-700">{u.email}</td>
                  <td className="px-5 py-3.5 text-gray-500">{u.phone || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      u.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {u.is_admin ? <Shield size={10} /> : <UserIcon size={10} />}
                      {u.is_admin ? 'Administrator' : 'Standard Customer'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      u.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {u.is_active ? <Unlock size={10} /> : <Lock size={10} />}
                      {u.is_active ? 'Permitted' : 'Locked Account'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    {u.id === currentUserId ? (
                      <span className="text-[11px] text-gray-400 font-medium">This is you</span>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleUpdate(u.id, { is_admin: !u.is_admin })}
                          disabled={updateUser.isPending}
                          title={u.is_admin ? 'Remove admin role' : 'Grant admin role'}
                          className={`p-1.5 rounded-lg border transition disabled:opacity-40 ${
                            u.is_admin
                              ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                              : 'bg-gray-50 text-gray-400 border-gray-200 hover:text-purple-600'
                          }`}
                        >
                          <Shield size={14} />
                        </button>
                        <button
                          onClick={() => handleUpdate(u.id, { is_active: !u.is_active })}
                          disabled={updateUser.isPending}
                          title={u.is_active ? 'Lock account' : 'Unlock account'}
                          className={`p-1.5 rounded-lg border transition disabled:opacity-40 ${
                            u.is_active
                              ? 'bg-gray-50 text-gray-400 border-gray-200 hover:text-red-600'
                              : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          }`}
                        >
                          {u.is_active ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {isLoading ? (
          <p className="text-center text-gray-400 py-8 text-sm">Loading users...</p>
        ) : data?.items?.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No users found.</p>
        ) : (
          data?.items?.map((u: AdminUser) => (
            <div key={u.id} className="bg-white rounded-xl border p-3 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">{u.full_name || 'Anonymous User'}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                  {u.is_admin ? 'Admin' : 'User'}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{u.email}</p>
              <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-gray-100 text-[11px] text-gray-400 font-medium">
                <span>📞 {u.phone || 'No phone'}</span>
                <span>Created {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span>
              </div>
              {u.id !== currentUserId && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleUpdate(u.id, { is_admin: !u.is_admin })}
                    disabled={updateUser.isPending}
                    className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold transition disabled:opacity-40 ${
                      u.is_admin
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}
                  >
                    <Shield size={10} className="inline mr-1" />
                    {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                  <button
                    onClick={() => handleUpdate(u.id, { is_active: !u.is_active })}
                    disabled={updateUser.isPending}
                    className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold transition disabled:opacity-40 ${
                      u.is_active
                        ? 'bg-gray-50 text-gray-500 border-gray-200'
                        : 'bg-green-50 text-green-700 border-green-200'
                    }`}
                  >
                    {u.is_active ? <Lock size={10} className="inline mr-1" /> : <Unlock size={10} className="inline mr-1" />}
                    {u.is_active ? 'Lock Account' : 'Unlock Account'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 border bg-white rounded-lg text-xs font-semibold disabled:opacity-30">Prev</button>
          <span className="text-xs text-gray-500 font-medium">Page {page} of {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 border bg-white rounded-lg text-xs font-semibold disabled:opacity-30">Next</button>
        </div>
      )}
    </div>
  );
}
