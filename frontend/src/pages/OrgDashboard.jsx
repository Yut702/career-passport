import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OrgDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    const token = localStorage.getItem('org_token');
    if (!token) {
      navigate('/org-login');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/org/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.status === 401) {
        localStorage.removeItem('org_token');
        navigate('/org-login');
        return;
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch dashboard');
      
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('org_token');
    navigate('/org-login');
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <button onClick={() => navigate('/org-login')}>Back to Login</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Organization Dashboard</h1>
        <button onClick={logout}>Logout</button>
      </div>

      <p style={{ color: '#666', marginBottom: 20 }}>Organization ID: {dashboard.orgId}</p>

      {/* サマリーカード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 30 }}>
        <div style={cardStyle}>
          <h3 style={{ margin: 0, color: '#666', fontSize: 14 }}>Total Stamps</h3>
          <p style={{ margin: '10px 0 0', fontSize: 32, fontWeight: 'bold', color: '#2563eb' }}>
            {dashboard.summary.totalStamps}
          </p>
        </div>
        <div style={cardStyle}>
          <h3 style={{ margin: 0, color: '#666', fontSize: 14 }}>Total Participants</h3>
          <p style={{ margin: '10px 0 0', fontSize: 32, fontWeight: 'bold', color: '#16a34a' }}>
            {dashboard.summary.totalParticipants}
          </p>
        </div>
        <div style={cardStyle}>
          <h3 style={{ margin: 0, color: '#666', fontSize: 14 }}>Total NFTs</h3>
          <p style={{ margin: '10px 0 0', fontSize: 32, fontWeight: 'bold', color: '#9333ea' }}>
            {dashboard.summary.totalNfts ?? 0}
          </p>
        </div>
      </div>

      {/* イベント一覧 */}
      <h2 style={{ marginBottom: 16 }}>Events</h2>
      {dashboard.events.length === 0 ? (
        <p style={{ color: '#666' }}>No events yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={thStyle}>Event Title</th>
              <th style={thStyle}>Participants</th>
              <th style={thStyle}>Stamps</th>
              <th style={thStyle}>Satisfaction</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.events.map((event) => (
              <tr key={event.eventId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={tdStyle}>{event.title}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{event.participantCount}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{event.stampCount}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  {event.satisfactionScore !== null ? (
                    <span style={{ color: '#f59e0b' }}>★ {event.satisfactionScore.toFixed(1)}</span>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const cardStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 14
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: 14
};
