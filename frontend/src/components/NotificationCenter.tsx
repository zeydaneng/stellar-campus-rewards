import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationCenter({ notifications, unreadCount, markAllRead }: { notifications: any[], unreadCount: number, markAllRead: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) markAllRead();
        }}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid var(--glass-border)',
          borderRadius: '50%',
          width: '45px',
          height: '45px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.3s',
          fontSize: '20px'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: 'var(--danger, #ef4444)',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontWeight: 'bold',
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="glass-panel" style={{
          position: 'absolute',
          top: '55px',
          right: '0',
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          zIndex: 1000,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Notifications</h3>
            {notifications.length > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--accent-blue)', cursor: 'pointer' }} onClick={markAllRead}>
                Mark all read
              </span>
            )}
          </div>
          
          {notifications.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '24px', opacity: 0.5 }}>📭</span>
              <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>No new notifications</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {notifications.map(n => (
                <div key={n.id} style={{
                  padding: '16px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  gap: '12px',
                  background: n.read ? 'transparent' : 'rgba(168, 85, 247, 0.05)',
                  transition: 'background 0.3s'
                }}>
                  <div style={{ fontSize: '20px' }}>{n.icon}</div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>{n.title}</h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</p>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', opacity: 0.7 }}>
                      {n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
