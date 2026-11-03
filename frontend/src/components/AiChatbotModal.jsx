import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, ArrowRight, Loader2 } from 'lucide-react';
import { graphqlQuery } from '../services/api';
import { AI_CHAT } from '../services/graphqlQueries';

// Lightweight Markdown formatter for **bold** and bullet lists
function renderFormattedText(text) {
  if (!text) return null;
  const lines = String(text).split('\n');
  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
    const cleanLine = isBullet ? trimmed.slice(2) : line;

    // Split by **bold** segments
    const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
    const renderedParts = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
      }
      return <React.Fragment key={pIdx}>{part}</React.Fragment>;
    });

    if (isBullet) {
      return (
        <div
          key={lineIdx}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginTop: '4px',
            paddingLeft: '4px',
          }}
        >
          <span style={{ color: 'var(--primary)', fontWeight: '900' }}>•</span>
          <span>{renderedParts}</span>
        </div>
      );
    }

    return (
      <div key={lineIdx} style={{ minHeight: trimmed ? 'auto' : '8px' }}>
        {renderedParts}
      </div>
    );
  });
}

export default function AiChatbotModal({ isOpen, onClose, onSelectBook }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Xin chào! Tôi là **Trợ lý Học thuật Thư viện Đại học** 🤖✨\n\nTôi có thể giúp bạn:\n- Tìm kiếm giáo trình theo môn học, chuyên ngành hoặc mã ISBN\n- Đề xuất tài liệu tham khảo & tóm tắt nội dung học thuật\n- Gợi ý lộ trình đọc sách phục vụ tiểu luận, đồ án và khóa luận tốt nghiệp',
      books: [],
      topics: [
        'Giáo trình Công nghệ thông tin & Phần mềm',
        'Sách Trí tuệ nhân tạo & Khoa học dữ liệu',
        'Kinh tế học & Quản trị khởi nghiệp',
        'Kỹ năng nghiên cứu & Tư duy phản biện',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await graphqlQuery(AI_CHAT, { message: text });
      const aiReply = data.aiChat;

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply.reply,
          books: aiReply.recommendedBooks || [],
          topics: aiReply.suggestedTopics || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Xin lỗi, hiện tại kết nối AI đang gián đoạn hoặc API Key chưa được kích hoạt. Bạn vui lòng thử lại hoặc nhờ Admin kiểm tra cấu hình **Gemini API Key** nhé!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(15, 23, 42, 0.68)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '720px',
          height: '84vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          background: 'var(--bg-card)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border)',
          color: 'var(--text-main)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                background: 'var(--primary)',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: '900',
                    color: 'var(--text-main)',
                    margin: 0,
                  }}
                >
                  Trợ Lý Thư Viện AI
                </h3>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                  GOOGLE GEMINI PRO
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--primary)',
                  margin: 0,
                  fontWeight: '700',
                }}
              >
                Tư vấn tra cứu &amp; hỗ trợ độc giả mượn sách 24/7
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Đóng cửa sổ chat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat message list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            background: 'var(--bg-dark)',
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '12px',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}
            >
              {msg.sender === 'ai' && (
                <div
                  style={{
                    background: 'var(--primary)',
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: 'white',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <Bot size={18} />
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '16px',
                    background: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-card)',
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
                    color: msg.sender === 'user' ? '#ffffff' : 'var(--text-main)',
                    fontSize: '0.9rem',
                    lineHeight: '1.65',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {renderFormattedText(msg.text)}
                </div>

                {/* Sách được đề xuất kèm theo từ kho sách */}
                {msg.books && msg.books.length > 0 && (
                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: 'var(--primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      📚 TÀI LIỆU KHUYÊN ĐỌC TỪ KHO THƯ VIỆN:
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
                        gap: '10px',
                      }}
                    >
                      {msg.books.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => {
                            if (onSelectBook) onSelectBook(b);
                            onClose();
                          }}
                          className="card-hover-lift"
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                        >
                          <img
                            src={
                              b.coverImage ||
                              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'
                            }
                            alt={b.title}
                            style={{
                              width: '38px',
                              height: '52px',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ overflow: 'hidden' }}>
                            <div
                              style={{
                                fontSize: '0.8rem',
                                fontWeight: '800',
                                color: 'var(--text-main)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {b.title}
                            </div>
                            <div
                              style={{
                                fontSize: '0.7rem',
                                color: 'var(--primary)',
                                fontWeight: '700',
                              }}
                            >
                              Kệ: {b.shelfLocation || 'Khu A'} • ⭐ {b.rating || 5.0}
                            </div>
                            <div
                              style={{
                                fontSize: '0.675rem',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              Xem &amp; Mượn ngay <ArrowRight size={10} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Các chủ đề gợi ý tiếp theo */}
                {msg.topics && msg.topics.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {msg.topics.map((t, idx) => (
                      <span
                        key={idx}
                        onClick={() => handleSend(t)}
                        style={{
                          background: 'var(--primary-light)',
                          border: '1px solid var(--border)',
                          color: 'var(--primary)',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        💡 {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                color: 'var(--primary)',
                fontSize: '0.85rem',
                fontWeight: '700',
              }}
            >
              <Loader2 size={18} className="animate-spin" />
              <span>Google Gemini AI đang suy luận và tra cứu kho 100+ sách...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-card)',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            className="input-field"
            placeholder="Hỏi Gemini AI về môn học, đồ án, giáo trình hoặc kỹ năng..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            style={{ flex: 1, padding: '12px 16px', fontSize: '0.875rem' }}
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="btn btn-primary"
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Send size={16} /> Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
