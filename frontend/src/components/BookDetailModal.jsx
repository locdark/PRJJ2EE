import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  BookOpen,
  MapPin,
  Calendar,
  Building,
  User,
  Send,
  CheckCircle2,
  Volume2,
  Square,
  Quote,
  Copy,
  Heart,
} from 'lucide-react';
import { graphqlQuery } from '../services/api';
import { GET_BOOK_BY_ID, ADD_REVIEW } from '../services/graphqlQueries';
import { showToast } from './Toast';

export default function BookDetailModal({
  bookId,
  isOpen,
  onClose,
  onBorrowClick,
  user,
  wishlistIds = [],
  onToggleWishlist,
}) {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [citationFormat, setCitationFormat] = useState('APA'); // APA, IEEE, BIBTEX
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (isOpen && bookId) {
      loadBookDetail();
    }
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    };
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

  const handleToggleSpeech = () => {
    if (!window.speechSynthesis) {
      showToast('Trình duyệt của bạn không hỗ trợ đọc giọng nói (SpeechSynthesis).', 'warning');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      showToast('Đã dừng đọc tóm tắt sách.', 'info', 1800);
      return;
    }

    window.speechSynthesis.cancel();
    const speechText = `Tài liệu: ${book.title}. Tác giả: ${
      book.author?.name || 'Chưa rõ'
    }. Chuyên ngành: ${book.category?.name || 'Học thuật'}. Xuất bản năm ${
      book.publishYear || 2024
    }. Tóm tắt nội dung: ${book.description || 'Tài liệu nghiên cứu và học tập tại thư viện.'}`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang && v.lang.toLowerCase().includes('vi'));
    if (viVoice) utterance.voice = viVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    showToast('🔊 Đang phát tóm tắt âm thanh tài liệu...', 'info', 2500);
  };

  const getFormattedCitation = () => {
    if (!book) return '';
    const author = book.author?.name || 'Tác giả';
    const year = book.publishYear || 2024;
    const title = book.title || 'Tài liệu học thuật';
    const publisher = book.publisher?.name || 'Nhà xuất bản Đại học';
    const isbn = book.isbn || '978-604-000-000-0';

    if (citationFormat === 'IEEE') {
      return `[1] ${author}, "${title}," ${publisher}, ${year}, ISBN: ${isbn}.`;
    }
    if (citationFormat === 'BIBTEX') {
      const citeKey = `${author.split(' ').pop()?.toLowerCase() || 'author'}${year}`;
      return `@book{${citeKey},\n  author    = {${author}},\n  title     = {${title}},\n  publisher = {${publisher}},\n  year      = {${year}},\n  isbn      = {${isbn}}\n}`;
    }
    // Default APA 7th
    return `${author} (${year}). ${title}. ${publisher}. ISBN: ${isbn}.`;
  };

  const handleCopyCitation = () => {
    const text = getFormattedCitation();
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép trích dẫn chuẩn ${citationFormat} vào bộ nhớ tạm!`, 'success', 2500);
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await graphqlQuery(ADD_REVIEW, { bookId, rating: parseInt(rating, 10), comment });
      setComment('');
      setReviewSuccess(true);
      showToast('Đã gửi nhận xét và đánh giá sách thành công!', 'success');
      setTimeout(() => setReviewSuccess(false), 3000);
      loadBookDetail();
    } catch (err) {
      showToast(err.message || 'Lỗi thêm đánh giá', 'error');
    }
  };

  if (!isOpen || !book) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="modal-responsive-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          background: 'var(--bg-card)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
          color: 'var(--text-main)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease',
            zIndex: 10,
          }}
        >
          <X size={18} />
        </button>

        <div className="responsive-modal-2col">
          {/* Cover & Fast Stats */}
          <div>
            <img
              src={
                book.coverImage ||
                'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'
              }
              alt={book.title}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500';
              }}
              style={{
                width: '100%',
                height: '330px',
                objectFit: 'cover',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-md)',
              }}
            />
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
                  Vị trí kệ sách:
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                  }}
                >
                  <MapPin size={12} /> {book.shelfLocation || 'Kệ A-01'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
                  Tình trạng kho:
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    backgroundColor: book.availableCopies > 0 ? '#ecfdf5' : '#fef2f2',
                    color: book.availableCopies > 0 ? '#047857' : '#b91c1c',
                    border: book.availableCopies > 0 ? '1px solid #a7f3d0' : '1px solid #fecaca',
                  }}
                >
                  {book.availableCopies > 0
                    ? `Còn ${book.availableCopies}/${book.totalCopies} cuốn`
                    : 'Hết sách'}
                </span>
              </div>
            </div>
          </div>

          {/* Details & Actions */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-primary">
                {book.category?.name || 'Giáo trình chung'}
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#d97706',
                  fontSize: '0.85rem',
                  fontWeight: '800',
                }}
              >
                <Star size={16} fill="#f59e0b" color="#f59e0b" /> {book.rating || 5.0} / 5.0
              </div>
            </div>

            <h2
              style={{
                fontSize: '1.65rem',
                fontWeight: '900',
                color: 'var(--text-main)',
                marginBottom: '12px',
                lineHeight: '1.3',
                letterSpacing: '-0.02em',
              }}
            >
              {book.title}
            </h2>

            {/* Author, Publisher, Year */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                marginBottom: '18px',
                fontWeight: '600',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} color="var(--primary)" />{' '}
                <span>{book.author?.name || 'Tác giả'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={15} color="var(--primary)" />{' '}
                <span>{book.publisher?.name || 'NXB'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} color="var(--primary)" />{' '}
                <span>Năm XB: {book.publishYear || 2024}</span>
              </div>
            </div>

            {/* Book Description Box */}
            <div style={{ marginBottom: '18px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  gap: '8px',
                }}
              >
                <h4
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: '800',
                    color: 'var(--text-main)',
                    margin: 0,
                  }}
                >
                  Tóm tắt nội dung:
                </h4>
                <button
                  type="button"
                  onClick={handleToggleSpeech}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    border: isSpeaking ? '1px solid #ef4444' : '1px solid var(--border)',
                    background: isSpeaking ? '#fef2f2' : 'var(--bg-elevated)',
                    color: isSpeaking ? '#dc2626' : 'var(--primary)',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  {isSpeaking ? 'Dừng đọc' : 'Nghe tóm tắt sách'}
                </button>
              </div>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.65',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  margin: 0,
                }}
              >
                {book.description || 'Chưa có mô tả chi tiết cho cuốn sách này.'}
              </p>
            </div>

            {/* Academic Citation Generator (APA 7th, IEEE, BibTeX) */}
            <div
              style={{
                marginBottom: '20px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '12px 14px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    color: 'var(--text-main)',
                  }}
                >
                  <Quote size={14} color="var(--primary)" /> Trích dẫn Học thuật (Citation)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {['APA', 'IEEE', 'BIBTEX'].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setCitationFormat(fmt)}
                      style={{
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        border:
                          citationFormat === fmt
                            ? '1px solid var(--primary)'
                            : '1px solid var(--border)',
                        background: citationFormat === fmt ? 'var(--primary)' : 'var(--bg-card)',
                        color: citationFormat === fmt ? '#ffffff' : 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      {fmt === 'APA' ? 'APA 7th' : fmt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleCopyCitation}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      border: '1px solid var(--primary)',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <Copy size={12} /> Sao chép trích dẫn
                  </button>
                </div>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--bg-card)',
                  border: '1px dashed var(--border)',
                  fontSize: '0.76rem',
                  color: 'var(--text-main)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: citationFormat === 'BIBTEX' ? 'var(--font-mono)' : 'var(--font-sans)',
                  lineHeight: 1.5,
                }}
              >
                {getFormattedCitation()}
              </pre>
            </div>

            {/* Borrow & Wishlist Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  onClose();
                  onBorrowClick(book);
                }}
                disabled={book.availableCopies <= 0}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '13px',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: '800',
                }}
              >
                <BookOpen size={18} /> Đăng Ký Mượn Sách
              </button>
              {onToggleWishlist && (
                <button
                  type="button"
                  onClick={(e) => onToggleWishlist(book, e)}
                  className="btn btn-secondary"
                  style={{
                    padding: '13px 16px',
                    borderRadius: '10px',
                    fontSize: '0.88rem',
                    fontWeight: '800',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderColor: wishlistIds.includes(String(book.id)) ? '#fecdd3' : 'var(--border)',
                    background: wishlistIds.includes(String(book.id)) ? '#fff1f2' : 'var(--bg-elevated)',
                    color: wishlistIds.includes(String(book.id)) ? '#e11d48' : 'var(--text-main)',
                  }}
                >
                  <Heart
                    size={17}
                    fill={wishlistIds.includes(String(book.id)) ? '#e11d48' : 'none'}
                    color={wishlistIds.includes(String(book.id)) ? '#e11d48' : 'currentColor'}
                  />
                  {wishlistIds.includes(String(book.id)) ? 'Đã lưu' : 'Lưu đọc sau'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
          <h3
            style={{
              fontSize: '1.15rem',
              fontWeight: '800',
              color: 'var(--text-main)',
              marginBottom: '16px',
            }}
          >
            Đánh Giá &amp; Nhận Xét Từ Độc Giả ({book.reviews ? book.reviews.length : 0})
          </h3>

          {user ? (
            <form
              onSubmit={handleAddReview}
              style={{
                marginBottom: '24px',
                background: 'var(--bg-elevated)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '700' }}>
                  Chọn số sao:
                </span>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="input-field"
                  style={{ width: 'auto', fontWeight: '700', fontSize: '0.85rem' }}
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
                  className="input-field"
                  placeholder="Viết cảm nghĩ của bạn về cuốn sách này..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }}>
                  <Send size={15} /> Gửi
                </button>
              </div>

              {reviewSuccess && (
                <div
                  style={{
                    marginTop: '8px',
                    color: '#10b981',
                    fontWeight: '700',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={14} /> Cảm ơn bạn! Đánh giá đã được ghi nhận.
                </div>
              )}
            </form>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Vui lòng đăng nhập để gửi đánh giá và nhận xét về cuốn sách.
            </p>
          )}

          {/* Reviews List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {book.reviews && book.reviews.length > 0 ? (
              book.reviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={
                          rev.user?.avatar ||
                          'https://api.dicebear.com/7.x/bottts/svg?seed=user'
                        }
                        alt="User"
                        style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                      />
                      <span
                        style={{
                          fontWeight: '800',
                          fontSize: '0.85rem',
                          color: 'var(--text-main)',
                        }}
                      >
                        {rev.user?.fullName || 'Độc giả ẩn danh'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    {rev.comment}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                Chưa có đánh giá nào cho sách này. Hãy là người đầu tiên nhận xét!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
