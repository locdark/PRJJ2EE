import React, { useState, useEffect } from 'react';
import { X, Star, BookOpen, MapPin, Calendar, Building, User, Send, CheckCircle2 } from 'lucide-react';
import { graphqlQuery } from '../services/api';
import { GET_BOOK_BY_ID, ADD_REVIEW } from '../services/graphqlQueries';

export default function BookDetailModal({ bookId, isOpen, onClose, onBorrowClick, user }) {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && bookId) {
      loadBookDetail();
    }
  }, [isOpen, bookId]);

  const loadBookDetail = async () => {
    setLoading(true);
    try {
      const data = await graphqlQuery(GET_BOOK_BY_ID, { id: bookId });
      setBook(data.bookById);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await graphqlQuery(ADD_REVIEW, { bookId, rating: parseInt(rating), comment });
      setComment('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
      loadBookDetail();
    } catch (err) {
      alert(err.message || 'Lỗi thêm đánh giá');
    }
  };

  if (!isOpen || !book) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div 
        className="animate-fade-in" 
        style={{ 
          width: '100%', 
          maxWidth: '780px', 
          maxHeight: '90vh', 
          overflowY: 'auto', 
          position: 'relative',
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          color: '#0f172a'
        }}
        className="modal-responsive-card"
      >
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
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
            justifyContent: 'center',
            transition: 'background 0.2s ease',
            zIndex: 10
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
          onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
        >
          <X size={18} />
        </button>

        <div className="responsive-modal-2col">
          
          {/* Cover & Fast Stats */}
          <div>
            <img 
              src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'} 
              alt={book.title} 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500';
              }}
              style={{ width: '100%', height: '330px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)' }} 
            />
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Vị trí kệ sách:</span>
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  background: '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '0.75rem'
                }}>
                  <MapPin size={12} /> {book.shelfLocation || 'Kệ A-01'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Tình trạng kho:</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '0.75rem',
                  backgroundColor: book.availableCopies > 0 ? '#ecfdf5' : '#fef2f2',
                  color: book.availableCopies > 0 ? '#047857' : '#b91c1c',
                  border: book.availableCopies > 0 ? '1px solid #a7f3d0' : '1px solid #fecaca'
                }}>
                  {book.availableCopies > 0 ? `Còn ${book.availableCopies}/${book.totalCopies} cuốn` : 'Hết sách'}
                </span>
              </div>
            </div>
          </div>

          {/* Details & Actions */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ 
                background: '#eff6ff', 
                color: '#1d4ed8', 
                border: '1px solid #bfdbfe', 
                padding: '3px 10px', 
                borderRadius: '6px', 
                fontSize: '0.75rem', 
                fontWeight: '800' 
              }}>
                {book.category?.name || 'Giáo trình chung'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#d97706', fontSize: '0.85rem', fontWeight: '800' }}>
                <Star size={16} fill="#f59e0b" color="#f59e0b" /> {book.rating || 5.0} / 5.0
              </div>
            </div>

            {/* Title - Bold High Contrast */}
            <h2 style={{ fontSize: '1.65rem', fontWeight: '900', color: '#0f172a', marginBottom: '12px', lineHeight: '1.3', letterSpacing: '-0.02em' }}>
              {book.title}
            </h2>

            {/* Author, Publisher, Year */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: '#475569', fontSize: '0.85rem', marginBottom: '18px', fontWeight: '600' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} color="#1d4ed8" /> <span>{book.author?.name || 'Tác giả'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={15} color="#1d4ed8" /> <span>{book.publisher?.name || 'NXB'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} color="#1d4ed8" /> <span>Năm XB: {book.publishYear || 2024}</span>
              </div>
            </div>

            {/* Book Description Box */}
            <div style={{ marginBottom: '22px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                Tóm tắt nội dung:
              </h4>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#334155', 
                lineHeight: '1.65', 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0',
                padding: '14px 18px', 
                borderRadius: '10px' 
              }}>
                {book.description || 'Chưa có mô tả chi tiết cho cuốn sách này.'}
              </p>
            </div>

            {/* Borrow Action Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                onClick={() => {
                  onClose();
                  onBorrowClick(book);
                }}
                disabled={book.availableCopies <= 0}
                style={{ 
                  flex: 1, 
                  padding: '13px', 
                  borderRadius: '10px',
                  background: book.availableCopies > 0 ? '#1d4ed8' : '#94a3b8',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.95rem',
                  fontWeight: '800',
                  cursor: book.availableCopies > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(29, 78, 216, 0.35)'
                }}
              >
                <BookOpen size={18} /> Đăng Ký Mượn Sách
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>
            Đánh Giá &amp; Nhận Xét Từ Độc Giả ({book.reviews ? book.reviews.length : 0})
          </h3>

          {/* Form thêm đánh giá */}
          {user ? (
            <form onSubmit={handleAddReview} style={{ marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '700' }}>Chọn số sao:</span>
                <select 
                  value={rating} 
                  onChange={(e) => setRating(e.target.value)}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid #cbd5e1', 
                    background: '#ffffff', 
                    color: '#0f172a',
                    fontWeight: '700',
                    fontSize: '0.85rem' 
                  }}
                >
                  <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
                  <option value="4">⭐⭐⭐⭐ (4 sao)</option>
                  <option value="3">⭐⭐⭐ (3 sao)</option>
                  <option value="2">⭐⭐ (2 sao)</option>
                  <option value="1">⭐ (1 sao)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Viết cảm nghĩ của bạn về cuốn sách này..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required 
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
                <button 
                  type="submit" 
                  style={{ 
                    padding: '0 20px', 
                    borderRadius: '8px', 
                    background: '#1d4ed8', 
                    color: '#ffffff', 
                    border: 'none', 
                    fontWeight: '800', 
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Send size={15} /> Gửi
                </button>
              </div>

              {reviewSuccess && (
                <div style={{ marginTop: '8px', color: '#15803d', fontWeight: '700', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> Cảm ơn bạn! Đánh giá đã được ghi nhận.
                </div>
              )}
            </form>
          ) : (
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>
              Vui lòng đăng nhập để gửi đánh giá và nhận xét về cuốn sách.
            </p>
          )}

          {/* Reviews List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {book.reviews && book.reviews.length > 0 ? (
              book.reviews.map((rev) => (
                <div key={rev.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img src={rev.user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'} alt="User" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                      <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0f172a' }}>{rev.user?.fullName || 'Độc giả ẩn danh'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#334155', margin: '4px 0 0 0' }}>{rev.comment}</p>
                </div>
              ))
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>
                Chưa có đánh giá nào cho sách này. Hãy là người đầu tiên nhận xét!
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
