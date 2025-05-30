import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jsmfjeifckdyggrueivc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzbWZqZWlmY2tkeWdncnVlaXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MDAwODcsImV4cCI6MjA2NDE3NjA4N30.L3JoQEX_jlpePq_MLyXnr4bXFQYEZQEUl-DHIX8Mk4Y',
  {
    global: {
      headers: {
        'Accept-Charset': 'UTF-8',
        'Content-Type': 'application/json; charset=UTF-8',
        'Accept': 'application/json; charset=UTF-8',
      },
    },
  }
);

const updateUserEmailHeader = (email) => {
  if (supabase) {
    supabase._rest = supabase._rest || supabase.rest;
    supabase._rest.headers['x-user-email'] = email || '';
  }
};

const compressPhoto = (file, callback) => {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const maxSize = 300;
      let width = img.width, height = img.height;
      if (width > height) {
        if (width > maxSize) { height *= maxSize / width; width = maxSize; }
      } else {
        if (height > maxSize) { width *= maxSize / height; height = maxSize; }
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => callback(blob), 'image/jpeg', 0.7);
    };
  };
  reader.readAsDataURL(file);
};

function RoleSelection({ onSelect }) {
  return (
    <div className="container">
      <h1>AdProof Lite</h1>
      <h2>Выберите роль</h2>
      <button onClick={() => onSelect('admin')}>Администратор</button>
      <button onClick={() => onSelect('promoter')}>Промоутер</button>
    </div>
  );
}

function LoginPage({ role, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setError(null);
    if (role === 'admin') {
      if (email === 'admin' && password === 'admin123') {
        updateUserEmailHeader(email);
        onLogin({ role: 'admin', email });
      } else {
        setError('Неверный email или пароль');
      }
    } else {
      if (!supabase) { setError('Supabase недоступен'); return; }
      updateUserEmailHeader(email);
      const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('role', 'promoter').single();
      if (error || !data) { setError('Пользователь не найден'); return; }
      if (data.password !== password) { setError('Неверный пароль'); return; }
      onLogin({ role: 'promoter', email, full_name: data.full_name });
    }
  };

  return (
    <div className="container">
      <h1>Вход ({role === 'admin' ? 'Администратор' : 'Промоутер'})</h1>
      {error && <p className="error">{error}</p>}
      <input
        type="text"
        placeholder="Email (для админа: admin)"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Пароль (для админа: admin123)"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Войти</button>
      {role === 'promoter' && (
        <button
          onClick={() => onLogin({ role: 'promoter', email: null, register: true })}
          className="secondary-button"
        >
          Зарегистрироваться
        </button>
      )}
    </div>
  );
}

function RegisterPage({ onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [error, setError] = useState(null);

  const handleRegister = async () => {
    if (!email || !password || !fullName || !phoneNumber || !district) {
      setError('Заполните все поля');
      return;
    }
    if (!supabase) {
      setError('Supabase недоступен');
      return;
    }
    setError(null);
    updateUserEmailHeader(email);
    const { error } = await supabase.from('registration_requests').insert({
      email, password, full_name: fullName, phone_number: phoneNumber, district, status: 'pending'
    });
    if (error) {
      setError('Ошибка регистрации: ' + error.message);
      return;
    }
    alert('Заявка отправлена. Ожидайте подтверждения.');
    onRegister();
  };

  return (
    <div className="container">
      <h1>Регистрация промоутера</h1>
      {error && <p className="error">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <input
        type="text"
        placeholder="ФИО"
        value={fullName}
        onChange={e => setFullName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Номер телефона"
        value={phoneNumber}
        onChange={e => setPhoneNumber(e.target.value)}
      />
      <input
        type="text"
        placeholder="Район"
        value={district}
        onChange={e => setDistrict(e.target.value)}
      />
      <button onClick={handleRegister}>Зарегистрироваться</button>
    </div>
  );
}

function ModerationPage({ onBack, adminEmail }) {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    updateUserEmailHeader(adminEmail);
    supabase.from('registration_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError('Error loading requests: ' + error.message);
        else setRequests(data || []);
      });
  }, [adminEmail]);

  const approveRequest = async (request) => {
    if (!supabase) return;
    updateUserEmailHeader(adminEmail);
    const { error: insertError } = await supabase.from('users').insert({
      email: request.email, password: request.password, role: 'promoter',
      full_name: request.full_name, phone_number: request.phone_number, district: request.district
    });
    if (insertError) { setError('Approval error: ' + insertError.message); return; }
    await supabase.from('registration_requests').delete().eq('id', request.id);
    setRequests(requests.filter(r => r.id !== request.id));
    alert('Request approved');
  };

  const rejectRequest = async (id) => {
    if (!supabase) return;
    updateUserEmailHeader(adminEmail);
    await supabase.from('registration_requests').delete().eq('id', id);
    setRequests(requests.filter(r => r.id !== id));
    alert('Request rejected');
  };

  return (
    <div style={{ padding: '16px', maxWidth: '960px', margin: '0 auto', backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      <h1>Moderation Panel</h1>
      {error && <p className="error">{error}</p>}
      {!supabase && <p className="error">Error: Supabase is unavailable</p>}
      <button onClick={onBack} className="secondary-button">Back</button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {requests.map(request => (
          <div key={request.id} style={{ border: '1px solid #D1D5DB', padding: '8px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
            <p style={{ fontSize: '14px' }}>Email: {request.email}</p>
            <p style={{ fontSize: '14px' }}>Full Name: {request.full_name}</p>
            <p style={{ fontSize: '14px' }}>Phone: {request.phone_number}</p>
            <p style={{ fontSize: '14px' }}>District: {request.district}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={() => approveRequest(request)} style={{ backgroundColor: '#10B981', padding: '4px', borderRadius: '4px', fontSize: '14px' }}>Approve</button>
              <button onClick={() => rejectRequest(request.id)} style={{ backgroundColor: '#EF4444', padding: '4px', borderRadius: '4px', fontSize: '14px' }}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromoterPage({ user, onLogout }) {
  const [promoterId, setPromoterId] = useState(user.email);
  const [type, setType] = useState('board');
  const [photo, setPhoto] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async () => {
    if (!promoterId || !photo) return alert('Please enter ID and select a photo');
    if (!supabase) return alert('Supabase is unavailable');
    setLoading(true);
    setError(null);
    try {
      compressPhoto(photo, async blob => {
        const fileName = `${promoterId}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, blob);
        if (uploadError) throw new Error('Upload error: ' + uploadError.message);
        const { publicUrl } = supabase.storage.from('photos').getPublicUrl(fileName).data;
        updateUserEmailHeader(promoterId);
        const { error: dbError } = await supabase.from('photos').insert({ promoter_id: promoterId, type, photo_url: publicUrl });
        if (dbError) throw new Error('Save error: ' + dbError.message);
        setPhoto(null);
        alert('Photo uploaded');
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!promoterId || !supabase) return;
    updateUserEmailHeader(promoterId);
    supabase.from('photos').select('*').eq('promoter_id', promoterId).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError('Error loading photos: ' + error.message);
        else setPhotos(data || []);
      });
  }, [promoterId]);

  return (
    <div style={{ padding: '16px', maxWidth: '480px', margin: '0 auto', backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      <h1>AdProof Lite</h1>
      <p style={{ fontSize: '14px', marginBottom: '8px' }}>Logged in as: {user.full_name} ({user.email})</p>
      <button onClick={onLogout} style={{ backgroundColor: '#EF4444', marginBottom: '16px' }}>Logout</button>
      {error && <p className="error">{error}</p>}
      {!supabase && <p className="error">Error: Supabase is unavailable</p>}
      <input
        type="text"
        placeholder="Your ID (email)"
        value={promoterId}
        onChange={e => setPromoterId(e.target.value)}
        disabled
      />
      <select
        value={type}
        onChange={e => setType(e.target.value)}
      >
        <option value="board">Billboard</option>
        <option value="mailbox">Mailboxes</option>
      </select>
      <input
        type="file"
        accept="image/*"
        onChange={e => setPhoto(e.target.files[0])}
        style={{ width: '100%', marginBottom: '8px', color: '#6B7280' }}
      />
      <button
        onClick={handleUpload}
        disabled={loading || !supabase}
        style={{ backgroundColor: loading || !supabase ? '#6B7280' : '#003087' }}
      >
        {loading ? 'Uploading...' : 'Upload Photo'}
      </button>
      <h2 style={{ fontSize: '18px', fontWeight: '600', marginTop: '16px' }}>Your Photos</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
        {photos.map(photo => (
          <img key={photo.id} src={photo.photo_url} alt="Photo" style={{ width: '100%', height: '96px', objectFit: 'cover', borderRadius: '4px' }} />
        ))}
      </div>
    </div>
  );
}

function AdminPage({ onLogout, onModerate, adminEmail }) {
  const [photos, setPhotos] = useState([]);
  const [filterId, setFilterId] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    updateUserEmailHeader(adminEmail);
    let query = supabase.from('photos').select('*').order('created_at', { ascending: false });
    if (filterId) query = query.eq('promoter_id', filterId);
    query.then(({ data, error }) => {
      if (error) setError('Error loading photos: ' + error.message);
      else setPhotos(data || []);
    });
  }, [filterId, adminEmail]);

  const updateStatus = async (id, status) => {
    if (!supabase) return alert('Supabase is unavailable');
    updateUserEmailHeader(adminEmail);
    const { error } = await supabase.from('photos').update({ status }).eq('id', id);
    if (error) return alert('Error: ' + error.message);
    setPhotos(photos.map(p => (p.id === id ? { ...p, status } : p)));
  };

  const exportCSV = () => {
    const uniquePhotos = photos.filter(p => p.status === 'unique');
    const csv = ['PromoterID,Type,Count', ...Object.entries(uniquePhotos.reduce((acc, p) => {
      acc[p.promoter_id] = (acc[p.promoter_id] || 0) + 1;
      return acc;
    }, {})).map(([id, count]) => `${id},,${count}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.csv';
    a.click();
  };

  return (
    <div style={{ padding: '16px', maxWidth: '960px', margin: '0 auto', backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      <h1>Admin Panel</h1>
      <button onClick={onLogout} style={{ backgroundColor: '#EF4444', marginBottom: '16px' }}>Logout</button>
      <button onClick={onModerate} style={{ backgroundColor: '#003087', marginBottom: '16px', marginLeft: '8px' }}>Moderate Requests</button>
      {error && <p className="error">{error}</p>}
      {!supabase && <p className="error">Error: Supabase is unavailable</p>}
      <input
        type="text"
        placeholder="Filter by Promoter ID"
        value={filterId}
        onChange={e => setFilterId(e.target.value)}
      />
      <button
        onClick={exportCSV}
        disabled={!supabase}
        style={{ backgroundColor: !supabase ? '#6B7280' : '#10B981', marginBottom: '16px' }}
      >
        Export to CSV
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        {photos.map(photo => (
          <div key={photo.id} style={{ border: '1px solid #D1D5DB', padding: '8px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
            <img src={photo.photo_url} alt="Photo" style={{ width: '100%', height: '128px', objectFit: 'cover', marginBottom: '8px', borderRadius: '4px' }} />
            <p style={{ fontSize: '14px' }}>ID: {photo.promoter_id}</p>
            <p style={{ fontSize: '14px' }}>Type: {photo.type === 'board' ? 'Billboard' : 'Mailboxes'}</p>
            <p style={{ fontSize: '14px' }}>Status: {photo.status}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={() => updateStatus(photo.id, 'unique')} style={{ backgroundColor: '#003087', padding: '4px', borderRadius: '4px', fontSize: '14px' }}>Unique</button>
              <button onClick={() => updateStatus(photo.id, 'duplicate')} style={{ backgroundColor: '#EF4444', padding: '4px', borderRadius: '4px', fontSize: '14px' }}>Duplicate</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('role');
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setPage('login');
  };

  const handleLogin = (userData) => {
    if (userData.register) {
      setPage('register');
    } else {
      setUser(userData);
      setPage(userData.role === 'admin' ? 'admin' : 'promoter');
    }
  };

  const handleRegister = () => {
    setPage('login');
  };

  const handleLogout = () => {
    updateUserEmailHeader('');
    setUser(null);
    setRole(null);
    setPage('role');
  };

  const handleModerate = () => {
    setPage('moderation');
  };

  const handleBackFromModeration = () => {
    setPage('admin');
  };

  if (page === 'role') return <RoleSelection onSelect={handleRoleSelect} />;
  if (page === 'login') return <LoginPage role={role} onLogin={handleLogin} />;
  if (page === 'register') return <RegisterPage onRegister={handleRegister} />;
  if (page === 'promoter' && user) return <PromoterPage user={user} onLogout={handleLogout} />;
  if (page === 'admin' && user) return <AdminPage onLogout={handleLogout} onModerate={handleModerate} adminEmail={user.email} />;
  if (page === 'moderation' && user) return <ModerationPage onBack={handleBackFromModeration} adminEmail={user.email} />;
  return <div>Error: Invalid page</div>;
}