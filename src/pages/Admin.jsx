import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../lib/api';

function api(path, token, options = {}) {
  return fetch(apiUrl(path), {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  }).then(async (r) => {
    try { return await r.json(); } catch { return null; }
  });
}

export default function Admin() {
  const { user, loading, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [cleanupMsg, setCleanupMsg] = useState(null);
  const [cleaning, setCleaning] = useState(false);
  const [inactiveDays, setInactiveDays] = useState(90);
  const [deletingInactive, setDeletingInactive] = useState(false);
  const [inactiveResult, setInactiveResult] = useState(null);
  const [msg, setMsg] = useState(null);

  const loadUsers = () => {
    if (!token) return;
    api('/api/admin/users', token).then((data) => {
      if (data.users) setUsers(data.users);
      else setError(data.error);
    });
  };

  useEffect(() => { loadUsers(); }, [token]);

  const openUserSessions = async (u) => {
    setSelectedUser(u);
    setLoadingSessions(true);
    const data = await api(`/api/admin/users/${u.id}/sessions`, token);
    if (data.sessions) setSessions(data.sessions);
    setLoadingSessions(false);
  };

  const handleCleanup = async () => {
    setCleaning(true);
    setCleanupMsg(null);
    const data = await api('/api/admin/cleanup', token, { method: 'POST' });
    setCleanupMsg(data?.message || 'Gagal');
    setCleaning(false);
  };

  const handleDeleteInactive = async () => {
    setDeletingInactive(true);
    setInactiveResult(null);
    const data = await api(`/api/admin/users/inactive/${inactiveDays}`, token, { method: 'DELETE' });
    setInactiveResult(data);
    setDeletingInactive(false);
    loadUsers();
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Hapus user "${u.username}" (${u.email})? Semua foto user ini akan ikut terhapus.`)) return;
    const data = await api(`/api/admin/users/${u.id}`, token, { method: 'DELETE' });
    setMsg(data?.message || 'Gagal menghapus');
    loadUsers();
  };

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;

  const now = new Date();
  const inactiveUsers = users.filter((u) => {
    if (u.role === 'admin') return false;
    if (!u.last_login) return true;
    const diff = (now - new Date(u.last_login)) / (1000 * 60 * 60 * 24);
    return diff >= inactiveDays;
  });

  return (
    <section className="w-full max-w-[1000px] mx-auto py-8 px-5">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sage-800 ornament-heading">Admin Panel</h1>
          <p className="text-xs text-sage-600 mt-1">{users.length} User Terdaftar</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCleanup}
            disabled={cleaning}
            className="text-xs bg-sage-100 hover:bg-sage-200 disabled:opacity-50 text-sage-700 px-4 py-2 rounded-full font-semibold transition-all flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 11.625l2.25-2.25M12 11.625l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            {cleaning ? 'Membersihkan...' : 'Hapus Cache'}
          </button>
        </div>
      </div>

      {cleanupMsg && (
        <div className="text-xs text-sage-700 bg-sage-100 rounded-xl px-5 py-3 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-sage-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {cleanupMsg}
        </div>
      )}

      {msg && (
        <div className="text-xs text-sage-700 bg-sage-100 rounded-xl px-5 py-3 mb-4">{msg}</div>
      )}

      {error && (
        <div className="text-xs text-red-500 bg-red-50 rounded-xl px-5 py-3 mb-6">{error}</div>
      )}

      {!selectedUser ? (
        <>
          {/* ── Inactive Users Card ── */}
          <div className="bg-white rounded-2xl border border-sage-200 p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-sage-800">Hapus Akun Tidak Aktif</h3>
                <p className="text-xs text-sage-500 mt-0.5">
                  {inactiveUsers.length} user tidak aktif &ge;{inactiveDays} hari
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={inactiveDays}
                  onChange={(e) => setInactiveDays(Number(e.target.value))}
                  className="text-xs bg-sage-50 border border-sage-200 rounded-lg px-2 py-1.5 text-sage-700 outline-none"
                >
                  <option value={30}>30 hari</option>
                  <option value={60}>60 hari</option>
                  <option value={90}>90 hari</option>
                  <option value={180}>6 bulan</option>
                  <option value={365}>1 tahun</option>
                </select>
                <button
                  onClick={handleDeleteInactive}
                  disabled={deletingInactive || inactiveUsers.length === 0}
                  className="text-xs bg-red-500 hover:bg-red-600 disabled:bg-sage-200 disabled:text-sage-400 text-white px-4 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5"
                >
                  {deletingInactive ? 'Menghapus...' : `Hapus ${inactiveUsers.length}`}
                </button>
              </div>
            </div>
            {inactiveResult && (
              <div className="text-xs text-sage-600 bg-sage-50 rounded-lg px-4 py-2.5 mt-2">
                <p className="font-semibold text-sage-700 mb-1">{inactiveResult.message}</p>
                {inactiveResult.deleted_users?.length > 0 && (
                  <ul className="space-y-0.5">
                    {inactiveResult.deleted_users.map((du) => (
                      <li key={du.username} className="text-sage-500">
                        {du.username} ({du.email})
                        {du.last_login ? ` — terakhir login ${new Date(du.last_login).toLocaleDateString('id-ID')}` : ' — belum pernah login'}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* ── User Table ── */}
          <div className="bg-white rounded-2xl border border-sage-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-sage-100 text-xs text-sage-500 font-mono">
                    <th className="px-5 py-4 font-semibold">User</th>
                    <th className="px-5 py-4 font-semibold">Foto</th>
                    <th className="px-5 py-4 font-semibold">Dibuat</th>
                    <th className="px-5 py-4 font-semibold">Terakhir Login</th>
                    <th className="px-5 py-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-sage-700">
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-sage-50 hover:bg-sage-50/50 transition-colors"
                    >
                      <td
                        className="px-5 py-4 cursor-pointer"
                        onClick={() => openUserSessions(u)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden"
                            style={{ backgroundColor: u.avatar ? 'transparent' : '#9CAF88' }}
                          >
                            {u.avatar ? (
                              <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              u.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{u.username}</div>
                            <div className="text-xs text-sage-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-sage-500">{u.session_count}</td>
                      <td className="px-5 py-4 text-xs text-sage-400">
                        {new Date(u.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-4 text-xs text-sage-400">
                        {u.last_login
                          ? new Date(u.last_login).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })
                          : <span className="text-sage-300 italic">Belum Pernah</span>}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-all font-semibold"
                          >
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div>
          <button
            onClick={() => { setSelectedUser(null); setSessions([]); }}
            className="text-xs text-sage-500 hover:text-sage-700 transition-colors mb-6 flex items-center gap-1 font-semibold"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Kembali
          </button>

          <div className="bg-white rounded-2xl border border-sage-200 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden"
                style={{ backgroundColor: selectedUser.avatar ? 'transparent' : '#9CAF88' }}
              >
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  selectedUser.username.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="font-semibold text-sage-800">{selectedUser.username}</div>
                <div className="text-xs text-sage-500">{selectedUser.email}</div>
              </div>
            </div>
          </div>

          {loadingSessions ? (
            <div className="text-center py-16">
              <p className="text-sm text-sage-500">Memuat foto...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-sage-200">
              <p className="text-sm text-sage-500">Belum Ada Foto</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-sage-200 p-6"
                >
                  <div className="flex items-center gap-4 mb-3 text-xs text-sage-500">
                    <span>Template: {s.frame_template}</span>
                    <span>&bull;</span>
                    <span>{new Date(s.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {s.images.map((url, i) => (
                      <div
                        key={i}
                        className="w-24 h-28 rounded-xl bg-cover bg-center border border-sage-100 shrink-0"
                        style={{ backgroundImage: `url('${url}')` }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
