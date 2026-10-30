import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Check, MapPin, BookOpen, AlertCircle, Download } from 'lucide-react';
import { graphqlQuery } from '../services/api';
import { GET_BOOKS, GET_CATEGORIES, CREATE_BOOK, UPDATE_BOOK, DELETE_BOOK } from '../services/graphqlQueries';

export default function BookManagementView() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [keyword, setKeyword] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [isbn, setIsbn] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [price, setPrice] = useState(150000);
  const [totalCopies, setTotalCopies] = useState(5);
  const [publishYear, setPublishYear] = useState(2024);
  const [categoryId, setCategoryId] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [publisherId, setPublisherId] = useState('');
  const [shelfLocation, setShelfLocation] = useState('Kệ A-01');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bData, cData] = await Promise.all([
        graphqlQuery(GET_BOOKS, { page: 0, size: 50, keyword: keyword || null }),
        graphqlQuery(GET_CATEGORIES)
      ]);
      setBooks(bData.books.content || []);
      setCategories(cData.categories || []);
      setAuthors(cData.authors || []);
      setPublishers(cData.publishers || []);

      if (cData.categories?.length > 0 && !categoryId) setCategoryId(cData.categories[0].id);
      if (cData.authors?.length > 0 && !authorId) setAuthorId(cData.authors[0].id);
      if (cData.publishers?.length > 0 && !publisherId) setPublisherId(cData.publishers[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!books.length) return alert('Không có dữ liệu sách để xuất');
    const headers = ['Mã Sách', 'Nhan Đề', 'Tác Giả', 'ISBN', 'Chuyên Ngành', 'Năm XB', 'Vị Trí Kệ', 'Đánh Giá', 'Tổng Bản', 'Khả Dụng', 'Tiền Cọc (VND)'];
    const rows = books.map(b => [
      b.id,
      `"${(b.title || '').replace(/"/g, '""')}"`,
      `"${(b.author?.name || '').replace(/"/g, '""')}"`,
      `"${b.isbn || ''}"`,
      `"${b.category?.name || ''}"`,
      b.publishYear || '',
      `"${b.shelfLocation || ''}"`,
      b.rating || 5.0,
      b.totalCopies || 0,
      b.availableCopies || 0,
      b.price || 0
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quan_ly_kho_sach_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenAdd = () => {
    setEditingBook(null);
    setTitle('');
    setIsbn('978-' + Math.floor(100000000 + Math.random() * 900000000));
    setDescription('');
    setCoverImage('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500');
    setPrice(150000);
    setTotalCopies(5);
    setPublishYear(2024);
    setShelfLocation('Kệ A-01');
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBook(b);
    setTitle(b.title);
    setIsbn(b.isbn);
    setDescription(b.description || '');
    setCoverImage(b.coverImage || '');
    setPrice(b.price || 150000);
    setTotalCopies(b.totalCopies);
    setPublishYear(b.publishYear || 2024);
    setCategoryId(b.category?.id || categories[0]?.id);
    setAuthorId(b.author?.id || authors[0]?.id);
    setPublisherId(b.publisher?.id || publishers[0]?.id);
    setShelfLocation(b.shelfLocation || 'Kệ A-01');
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    const input = {
      title,
      isbn,
      description,
      coverImage,
      price: parseFloat(price),
      totalCopies: parseInt(totalCopies),
      publishYear: parseInt(publishYear),
      categoryId,
      authorId,
      publisherId,
      shelfLocation
    };

    try {
      if (editingBook) {
        await graphqlQuery(UPDATE_BOOK, { id: editingBook.id, input });
      } else {
        await graphqlQuery(CREATE_BOOK, { input });
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Lỗi lưu sách');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuốn sách này?')) return;
    try {
      await graphqlQuery(DELETE_BOOK, { id });
      loadData();
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa sách');
    }
  };

  return (
    <div style={{ width: '100%', padding: '0 0 60px' }}>
      
      {/* Header & Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'inherit', marginBottom: '6px' }}>
            Quản Lý Kho Sách Thư Viện
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Dành cho Thủ thư: Thêm, sửa thông tin, vị trí lưu trữ và quản lý số lượng tồn sách
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={16} color="#38bdf8" /> Xuất Excel / CSV
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} /> Thêm Sách Mới
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Lọc sách theo tên, tác giả, ISBN..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') loadData(); }}
        />
        <button className="btn btn-secondary" onClick={loadData}>
          <Search size={16} /> Tìm
        </button>
      </div>

      {/* Books Table */}
      <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
              <th style={{ padding: '16px' }}>Sách & Bìa</th>
              <th style={{ padding: '16px' }}>Thể loại & Tác giả</th>
              <th style={{ padding: '16px' }}>Vị trí kệ</th>
              <th style={{ padding: '16px' }}>Số lượng</th>
              <th style={{ padding: '16px' }}>Giá bìa</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s ease' }}>
                <td style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={b.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=80'} alt="" style={{ width: '42px', height: '56px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div>
                    <div style={{ fontWeight: '700', color: 'inherit' }}>{b.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ISBN: {b.isbn}</div>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ color: '#1d4ed8', fontWeight: '600' }}>{b.category?.name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{b.author?.name}</div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                    <MapPin size={12} /> {b.shelfLocation || 'Kệ A-01'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span className={`badge ${b.availableCopies > 0 ? 'badge-success' : 'badge-danger'}`}>
                    {b.availableCopies} / {b.totalCopies} sẵn có
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontWeight: '700', color: '#059669' }}>
                  {(b.price || 150000).toLocaleString('vi-VN')} đ
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <button className="btn btn-outline" onClick={() => handleOpenEdit(b)} style={{ padding: '6px 10px', marginRight: '6px' }}>
                    <Edit2 size={14} />
                  </button>
                  <button className="btn btn-outline" onClick={() => handleDelete(b.id)} style={{ padding: '6px 10px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div 
            className="animate-fade-in" 
            style={{ 
              width: '100%', 
              maxWidth: '640px', 
              maxHeight: '90vh', 
              overflowY: 'auto', 
              padding: '30px', 
              position: 'relative',
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
              color: '#0f172a'
            }}
          >
            <button 
              onClick={() => setModalOpen(false)} 
              style={{ 
                position: 'absolute', 
                top: '20px', 
                right: '20px', 
                background: '#f1f5f9', 
                border: 'none', 
                color: '#475569', 
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>

            <h3 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0f172a', marginBottom: '20px', letterSpacing: '-0.02em' }}>
              {editingBook ? 'Chỉnh Sửa Sách' : 'Thêm Sách Mới Vào Kho'}
            </h3>

            {formError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#334155', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Tên cuốn sách</label>
                <input type="text" className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#334155', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Mã ISBN</label>
                  <input type="text" className="input-field" value={isbn} onChange={(e) => setIsbn(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#334155', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Vị trí kệ sách</label>
                  <input type="text" className="input-field" value={shelfLocation} onChange={(e) => setShelfLocation(e.target.value)} placeholder="Ví dụ: Kệ A-01-IT" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#334155', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Thể loại</label>
                  <select className="input-field" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#334155', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Tác giả</label>
                  <select className="input-field" value={authorId} onChange={(e) => setAuthorId(e.target.value)} required>
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#334155', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Nhà xuất bản</label>
                  <select className="input-field" value={publisherId} onChange={(e) => setPublisherId(e.target.value)} required>
                    {publishers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#334155', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Tổng số bản</label>
                  <input type="number" min="1" className="input-field" value={totalCopies} onChange={(e) => setTotalCopies(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#334155', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Giá bìa (VNĐ)</label>
                  <input type="number" min="0" className="input-field" value={price} onChange={(e) => setPrice(e.target.value)} required />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#334155', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Link ảnh bìa sách (URL)</label>
                <input type="text" className="input-field" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#334155', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Tóm tắt / Mô tả nội dung</label>
                <textarea className="input-field" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
                <Check size={18} /> Lưu Thông Tin Sách
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
