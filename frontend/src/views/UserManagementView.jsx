import React, { useState, useEffect } from 'react';
import { Lock, Unlock, CheckCircle2, Download } from 'lucide-react';
import { graphqlQuery } from '../services/api';
import {
  GET_USERS,
  UPDATE_USER_ROLE,
  TOGGLE_USER_STATUS,
} from '../services/graphqlQueries';
import { showToast } from '../components/Toast';

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
      showToast('Không thể tải danh sách người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await graphqlQuery(UPDATE_USER_ROLE, { userId, role: newRole });
      setSuccessMsg('Đã cập nhật quyền thành công!');
      showToast(`Đã cập nhật vai trò người dùng thành ${newRole}`, 'success');
      setTimeout(() => setSuccessMsg(''), 2500);
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Lỗi cập nhật quyền', 'error');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await graphqlQuery(TOGGLE_USER_STATUS, { userId });
      showToast('Đã cập nhật trạng thái hoạt động của tài khoản', 'info');
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Lỗi thay đổi trạng thái', 'error');
    }
  };

  const handleExportCSV = () => {
    if (!users.length) {
      showToast('Không có dữ liệu người dùng để xuất', 'warning');
      return;
    }
    const headers = [
      'Mã Độc Giả',
      'Họ Và Tên',
      'Email',
      'Vai Trò',
      'Trạng Thái',
      'Hình Thức Đăng Nhập',
    ];
    const rows = users.map((u) => [
      u.id,
      `"${(u.fullName || '').replace(/"/g, '""')}"`,
      `"${u.email || ''}"`,
      `"${u.role || ''}"`,
      u.enabled !== false ? 'Hoạt động' : 'Đã khóa',
      u.provider || 'LOCAL',
    ]);
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `danh_sach_nguoi_dung_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Đã xuất ${users.length} tài khoản người dùng ra tệp CSV`, 'success');
  };

  return (
    <div style={{ width: '100%', padding: '0 0 60px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.8rem',
              fontWeight: '900',
              color: 'var(--text-main)',
              marginBottom: '6px',
            }}
          >
            Quản Lý Người Dùng &amp; Phân Quyền
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Dành cho Quản trị viên (Admin): Cấp quyền ADMIN, LIBRARIAN, READER và khóa/mở khóa tài khoản
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleExportCSV}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Download size={16} color="var(--primary)" /> Xuất Excel / CSV
        </button>

        {successMsg && (
          <div
            style={{
              marginTop: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '700',
            }}
          >
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: '16px' }}>
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Phương thức</th>
              <th>Vai trò hiện tại</th>
              <th>Thay đổi quyền</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx}>
                  <td colSpan={6}>
                    <div className="skeleton" style={{ height: '46px', width: '100%' }} />
                  </td>
                </tr>
              ))
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={
                          u.avatar ||
                          'https://api.dicebear.com/7.x/bottts/svg?seed=' + u.email
                        }
                        alt=""
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                          {u.fullName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        u.provider === 'GOOGLE' ? 'badge-primary' : 'badge-info'
                      }`}
                    >
                      {u.provider === 'GOOGLE' ? 'Gmail OAuth2' : 'Email thường'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        u.role === 'ROLE_ADMIN'
                          ? 'badge-danger'
                          : u.role === 'ROLE_LIBRARIAN'
                          ? 'badge-warning'
                          : 'badge-info'
                      }`}
                    >
                      {u.role === 'ROLE_ADMIN'
                        ? 'Admin'
                        : u.role === 'ROLE_LIBRARIAN'
                        ? 'Thủ thư'
                        : 'Độc giả'}
                    </span>
                  </td>
                  <td>
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
                  <td>
                    <span className={`badge ${u.enabled ? 'badge-success' : 'badge-danger'}`}>
                      {u.enabled ? 'Đang hoạt động' : 'Bị khóa'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => handleToggleStatus(u.id)}
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      {u.enabled ? (
                        <Lock size={14} color="#ef4444" />
                      ) : (
                        <Unlock size={14} color="#10b981" />
                      )}
                      {u.enabled ? ' Khóa' : ' Mở khóa'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
