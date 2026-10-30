import React, { useState, useEffect } from 'react';
import { Shield, User, Lock, Unlock, CheckCircle2, UserCheck, Download } from 'lucide-react';
import { graphqlQuery } from '../services/api';
import { GET_USERS, UPDATE_USER_ROLE, TOGGLE_USER_STATUS } from '../services/graphqlQueries';

export default function UserManagementView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await graphqlQuery(GET_USERS);
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await graphqlQuery(UPDATE_USER_ROLE, { userId, role: newRole });
      setSuccessMsg('Đã cập nhật quyền thành công!');
      setTimeout(() => setSuccessMsg(''), 2500);
      loadUsers();
    } catch (err) {
      alert(err.message || 'Lỗi cập nhật quyền');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await graphqlQuery(TOGGLE_USER_STATUS, { userId });
      loadUsers();
    } catch (err) {
      alert(err.message || 'Lỗi thay đổi trạng thái');
    }
  };

  const handleExportCSV = () => {
    if (!users.length) return alert('Không có dữ liệu người dùng để xuất');
    const headers = ['Mã Độc Giả', 'Họ Và Tên', 'Email', 'Vai Trò', 'Trạng Thái', 'Hình Thức Đăng Nhập'];
    const rows = users.map(u => [
      u.id,
      `"${(u.fullName || '').replace(/"/g, '""')}"`,
      `"${u.email || ''}"`,
      `"${u.role || ''}"`,
      u.enabled !== false ? 'Hoạt động' : 'Đã khóa',
      u.provider || 'LOCAL'
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_sach_nguoi_dung_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ width: '100%', padding: '0 0 60px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'inherit', marginBottom: '6px' }}>
            Quản Lý Người Dùng &amp; Phân Quyền
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Dành cho Quản trị viên (Admin): Cấp quyền ADMIN, LIBRARIAN, READER và khóa/mở khóa tài khoản
          </p>
        </div>

        <button className="btn btn-secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Download size={16} color="#38bdf8" /> Xuất Excel / CSV
        </button>

        {successMsg && (
          <div style={{ marginTop: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
              <th style={{ padding: '16px' }}>Người dùng</th>
              <th style={{ padding: '16px' }}>Phương thức</th>
              <th style={{ padding: '16px' }}>Vai trò hiện tại</th>
              <th style={{ padding: '16px' }}>Thay đổi quyền</th>
              <th style={{ padding: '16px' }}>Trạng thái</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={u.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + u.email} 
                    alt="" 
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  <div>
                    <div style={{ fontWeight: '700', color: 'inherit' }}>{u.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</div>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span className={`badge ${u.provider === 'GOOGLE' ? 'badge-primary' : 'badge-info'}`}>
                    {u.provider === 'GOOGLE' ? 'Gmail OAuth2' : 'Email thường'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span className={`badge ${
                    u.role === 'ROLE_ADMIN' ? 'badge-danger' :
                    u.role === 'ROLE_LIBRARIAN' ? 'badge-warning' : 'badge-info'
                  }`}>
                    {u.role === 'ROLE_ADMIN' ? 'Admin' :
                     u.role === 'ROLE_LIBRARIAN' ? 'Thủ thư' : 'Độc giả'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <select 
                    className="input-field"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    style={{ width: '150px', padding: '6px 10px', fontSize: '0.8rem' }}
                  >
                    <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                    <option value="ROLE_LIBRARIAN">ROLE_LIBRARIAN</option>
                    <option value="ROLE_READER">ROLE_READER</option>
                  </select>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span className={`badge ${u.enabled ? 'badge-success' : 'badge-danger'}`}>
                    {u.enabled ? 'Đang hoạt động' : 'Bị khóa'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <button 
                    className="btn btn-outline"
                    onClick={() => handleToggleStatus(u.id)}
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    {u.enabled ? <Lock size={14} color="#f87171" /> : <Unlock size={14} color="#34d399" />}
                    {u.enabled ? ' Khóa' : ' Mở khóa'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
