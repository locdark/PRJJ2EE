import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, User, BookOpen, ArrowRight, Loader2, Zap } from 'lucide-react';
import { graphqlQuery } from '../services/api';
import { AI_CHAT } from '../services/graphqlQueries';

export default function AiChatbotModal({ isOpen, onClose, onSelectBook }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý Thư viện Số SmartLibrary được hỗ trợ bởi Trí tuệ Nhân tạo Google Gemini. 🤖✨\n\nTôi có thể giúp bạn tìm kiếm sách theo môn học, đề xuất sách học tập, tóm tắt giáo trình hoặc gợi ý lộ trình nghiên cứu trong kho 100 sách của thư viện. Bạn đang cần hỗ trợ môn học nào?',
      books: [],
      topics: ['Lộ trình học Spring Boot & GraphQL', 'Sách Trí tuệ nhân tạo (AI) hay nhất', 'Kinh tế & Khởi nghiệp đổi mới', 'Kỹ năng giao tiếp & Lãnh đạo']
    }
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
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await graphqlQuery(AI_CHAT, { message: text });
      const aiReply = data.aiChat;

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: aiReply.reply,
        books: aiReply.recommendedBooks || [],
        topics: aiReply.suggestedTopics || []
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: 'Xin lỗi, hiện tại kết nối AI đang gián đoạn hoặc API Key chưa được kích hoạt. Bạn vui lòng thử lại hoặc nhờ Admin kiểm tra cấu hình Gemini API Key nhé!'
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
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
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(29, 78, 216, 0.25)',
          border: '1px solid #bfdbfe',
          color: '#0f172a'
        }}
      >
        
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #eff6ff 0%, #f0f7ff 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(29, 78, 216, 0.35)' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>Trợ Lý Thư Viện AI</h3>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                  GOOGLE GEMINI PRO
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#1d4ed8', margin: 0, fontWeight: '700' }}>
                Tư vấn tra cứu & hỗ trợ độc giả mượn sách 24/7
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            style={{ background: '#ffffff', border: '1px solid #bfdbfe', color: '#64748b', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Đóng cửa sổ chat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat message list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px', background: '#fafafa' }}>
          {messages.map((msg, index) => (
            <div 
              key={index} 
              style={{ 
                display: 'flex', 
                gap: '12px', 
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              {msg.sender === 'ai' && (
                <div style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white', boxShadow: '0 2px 8px rgba(29, 78, 216, 0.3)' }}>
                  <Bot size={18} />
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div 
                  style={{ 
                    padding: '14px 18px', 
                    borderRadius: '16px', 
                    background: msg.sender === 'user' ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' : '#ffffff',
                    border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                    color: msg.sender === 'user' ? '#ffffff' : '#0f172a',
                    fontSize: '0.9rem',
                    whiteSpace: 'pre-line',
                    lineHeight: '1.65',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  {msg.text}
                </div>

                {/* Sách được đề xuất kèm theo từ kho sách */}
                {msg.books && msg.books.length > 0 && (
                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      📚 TÀI LIỆU KHUYÊN ĐỌC TỪ KHO THƯ VIỆN:
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                      {msg.books.map((b) => (
                        <div 
                          key={b.id}
                          onClick={() => {
                            if (onSelectBook) onSelectBook(b);
                            onClose();
                          }}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #bfdbfe',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#eff6ff';
                            e.currentTarget.style.borderColor = '#1d4ed8';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.borderColor = '#bfdbfe';
                          }}
                        >
                          <img 
                            src={b.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'} 
                            alt={b.title} 
                            style={{ width: '38px', height: '52px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                          />
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {b.title}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#1d4ed8', fontWeight: '700' }}>
                              Kệ: {b.shelfLocation || 'Khu A'} • ⭐ {b.rating || 5.0}
                            </div>
                            <div style={{ fontSize: '0.675rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              Xem & Mượn ngay <ArrowRight size={10} />
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
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          color: '#1d4ed8',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#1d4ed8';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#eff6ff';
                          e.currentTarget.style.color = '#1d4ed8';
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
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#1d4ed8', fontSize: '0.85rem', fontWeight: '700' }}>
              <Loader2 size={18} className="animate-spin" />
              <span>Google Gemini AI đang suy luận và tra cứu kho 100 sách...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Hỏi Gemini AI về môn học, đồ án, giáo trình hoặc kỹ năng..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            style={{ flex: 1, padding: '12px 16px', fontSize: '0.875rem' }}
          />

          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="btn btn-primary"
            style={{ padding: '12px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Send size={16} /> Gửi
          </button>
        </div>

      </div>
    </div>
  );
}
