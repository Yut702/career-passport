import { useState } from 'react';

export default function OrgLogin() {
  const [email, setEmail] = useState('org@example.com');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [status, setStatus] = useState('');
  const [user, setUser] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = mode === 'login' ? '/api/org/login' : '/api/org/register';
    const body = mode === 'login' 
      ? { email, password }
      : { email, password, name };

    setStatus('processing...');
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'request failed');
      
      if (mode === 'register') {
        setStatus('Registration successful! Please login.');
        setMode('login');
      } else {
        localStorage.setItem('org_token', data.token);
        setUser(data.user);
        setStatus('Login successful');
      }
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
  };

  const checkMe = async () => {
    const token = localStorage.getItem('org_token');
    if (!token) { setStatus('No token'); return; }
    try {
      const res = await fetch(`${API_BASE}/api/org/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'not authorized');
      setUser(data);
      setStatus('Token valid');
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('org_token');
    setUser(null);
    setStatus('Logged out');
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 20 }}>
      <h2>Organization {mode === 'login' ? 'Login' : 'Register'}</h2>
      {user ? (
        <div>
          <p>Signed in as <strong>{user.name}</strong> ({user.email})</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div style={{ marginBottom: 10 }}>
              <label>
                Name
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required
                  style={{ display: 'block', width: '100%', marginTop: 5 }}
                />
              </label>
            </div>
          )}
          <div style={{ marginBottom: 10 }}>
            <label>
              Email
              <input 
                type="email"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
                style={{ display: 'block', width: '100%', marginTop: 5 }}
              />
            </label>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>
              Password
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
                style={{ display: 'block', width: '100%', marginTop: 5 }}
              />
            </label>
          </div>
          <div style={{ marginBottom: 10 }}>
            <button type="submit" style={{ marginRight: 8 }}>
              {mode === 'login' ? 'Login' : 'Register'}
            </button>
            <button 
              type="button" 
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              Switch to {mode === 'login' ? 'Register' : 'Login'}
            </button>
            <button type="button" onClick={checkMe} style={{ marginLeft: 8 }}>
              Check Token
            </button>
          </div>
        </form>
      )}
      {status && <p style={{ marginTop: 10, color: status.startsWith('Error') ? 'red' : 'green' }}>{status}</p>}
      <p style={{ fontSize: 12, color: '#666', marginTop: 20 }}>
        Dev account: org@example.com / password123
      </p>
    </div>
  );
}
