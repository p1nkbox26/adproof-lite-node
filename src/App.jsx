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
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm p-6 bg-gray-50 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-blue-900 mb-6">AdProof Lite</h1>
        <h2 className="text-lg font-semibold text-center text-gray-600 mb-4">Выберите роль</h2>
        <button
          onClick={() => onSelect('admin')}
          className="w-full mb-3 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
        >
          Администратор
        </button>
        <button
          onClick={() => onSelect('promoter')}
          className="w-full py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
        >
          Промоутер
        </button>
      </div>
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
        setError('Неверный логин или пароль');
      }
    } else {
      if (!supabase) { setError('Supabase не доступен'); return; }
      updateUserEmailHeader(email);
      const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('role', 'promoter').single();
      if (error || !data) { setError('Пользователь не найден'); return; }
      if (data.password !== password) { setError('Неверный пароль'); return; }
      onLogin({ role: 'promoter', email, full_name: data.full_name });
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm p-6 bg-gray-50 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-blue-900 mb-6">
          Вход ({role === 'admin' ? 'Администратор' : 'Промоутер'})
        </h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <input
          type="text"
          placeholder="Email (для админа: admin)"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900"
        />
        <input
          type="password"
          placeholder="Пароль (для админа: admin123)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900"
        />
        <button
          onClick={handleLogin}
          className="w-full py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
        >
          Войти
        </button>
        {role === 'promoter' && (
          <button
            onClick={() => onLogin({ role: 'promoter', email: null, register: true })}
            className="w-full mt-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Зарегистрироваться
          </button>
        )}
      </div>
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
      setError('Supabase не доступен');
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
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm p-6 bg-gray-50 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-blue-900 mb-6">Регистрация промоутера</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900"
        />
        <input
          type="text"
          placeholder="ФИО"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900"
        />
        <input
          type="text"
          placeholder="Номер телефона"
          value={phoneNumber}
          onChange={e => setPhoneNumber(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900"
        />
        <input
          type="text"
          placeholder="Район"
          value={district}
          onChange={e => setDistrict(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900"
        />
        <button
          onClick={handleRegister}
          className="w-full py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
        >
          Зарегистрироваться
        </button>
      </div>
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
        if (error) setError('Ошибка загрузки заявок: ' + error.message);
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
    if (insertError) { setError('Ошибка подтверждения: ' + insertError.message); return; }
    await supabase.from('registration_requests').delete().eq('id', request.id);
    setRequests(requests.filter(r => r.id !== request.id));
    alert('Заявка подтверждена');
  };

  const rejectRequest = async (id) => {
    if (!supabase) return;
    updateUserEmailHeader(adminEmail);
    await supabase.from('registration_requests').delete().eq('id', id);
    setRequests(requests.filter(r => r.id !== id));
    alert('Заявка отклонена');
  };

  return (
    <div className="p-4 max-w-4xl mx-auto bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-blue-600">Модерация регистраций</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {!supabase && <p className="text-red-500 mb-2">Ошибка: Supabase не доступен</p>}
      <button onClick={onBack} className="mb-4 p-2 bg-gray-500 text-white rounded hover:bg-gray-600">Назад</button>
      <div className="grid grid-cols-1 gap-4">
        {requests.map(request => (
          <div key={request.id} className="border p-2 rounded shadow-sm">
            <p className="text-sm">Email: {request.email}</p>
            <p className="text-sm">ФИО: {request.full_name}</p>
            <p className="text-sm">Телефон: {request.phone_number}</p>
            <p className="text-sm">Район: {request.district}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => approveRequest(request)} className="bg-green-500 text-white p-1 rounded hover:bg-green-600 text-sm">Подтвердить</button>
              <button onClick={() => rejectRequest(request.id)} className="bg-red-500 text-white p-1 rounded hover:bg-red-600 text-sm">Отклонить</button>
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
    if (!promoterId || !photo) return alert('Введите ID и выберите фото');
    if (!supabase) return alert('Supabase не доступен');
    setLoading(true);
    setError(null);
    try {
      compressPhoto(photo, async blob => {
        const fileName = `${promoterId}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, blob);
        if (uploadError) throw new Error('Ошибка загрузки: ' + uploadError.message);
        const { publicUrl } = supabase.storage.from('photos').getPublicUrl(fileName).data;
        updateUserEmailHeader(promoterId);
        const { error: dbError } = await supabase.from('photos').insert({ promoter_id: promoterId, type, photo_url: publicUrl });
        if (dbError) throw new Error('Ошибка сохранения: ' + dbError.message);
        setPhoto(null);
        alert('Фото загружено');
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
        if (error) setError('Ошибка загрузки фото: ' + error.message);
        else setPhotos(data || []);
      });
  }, [promoterId]);

  return (
    <div className="p-4 max-w-md mx-auto bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-blue-600">AdProof Lite</h1>
      <p className="text-sm mb-2">Вы вошли как: {user.full_name} ({user.email})</p>
      <button onClick={onLogout} className="mb-4 p-2 bg-red-500 text-white rounded hover:bg-red-600">Выйти</button>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {!supabase && <p className="text-red-500 mb-2">Ошибка: Supabase не доступен</p>}
      <input
        type="text"
        placeholder="Ваш ID (email)"
        value={promoterId}
        onChange={e => setPromoterId(e.target.value)}
        className="w-full p-2 mb-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled
      />
      <select
        value={type}
        onChange={e => setType(e.target.value)}
        className="w-full p-2 mb-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="board">Доска объявлений</option>
        <option value="mailbox">Почтовые ящики</option>
      </select>
      <input
        type="file"
        accept="image/*"
        onChange={e => setPhoto(e.target.files[0])}
        className="w-full mb-2 text-gray-600"
      />
      <button
        onClick={handleUpload}
        disabled={loading || !supabase}
        className={`w-full p-2 rounded text-white ${loading || !supabase ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
      >
        {loading ? 'Загрузка...' : 'Загрузить фото'}
      </button>
      <h2 className="text-lg font-semibold mt-4">Ваши фото</h2>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {photos.map(photo => (
          <img key={photo.id} src={photo.photo_url} alt="Фото" className="w-full h-24 object-cover rounded" />
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
      if (error) setError('Ошибка загрузки фото: ' + error.message);
      else setPhotos(data || []);
    });
  }, [filterId, adminEmail]);

  const updateStatus = async (id, status) => {
    if (!supabase) return alert('Supabase не доступен');
    updateUserEmailHeader(adminEmail);
    const { error } = await supabase.from('photos').update({ status }).eq('id', id);
    if (error) return alert('Ошибка: ' + error.message);
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
    <div className="p-4 max-w-4xl mx-auto bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-blue-600">Админ-панель</h1>
      <button onClick={onLogout} className="mb-4 p-2 bg-red-500 text-white rounded hover:bg-red-600">Выйти</button>
      <button onClick={onModerate} className="mb-4 ml-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600">Модерация регистраций</button>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {!supabase && <p className="text-red-500 mb-2">Ошибка: Supabase не доступен</p>}
      <input
        type="text"
        placeholder="Фильтр по ID промоутера"
        value={filterId}
        onChange={e => setFilterId(e.target.value)}
        className="w-full p-2 mb-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={exportCSV}
        disabled={!supabase}
        className={`mb-4 p-2 rounded text-white ${!supabase ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
      >
        Экспорт в CSV
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map(photo => (
          <div key={photo.id} className="border p-2 rounded shadow-sm">
            <img src={photo.photo_url} alt="Фото" className="w-full h-32 object-cover mb-2 rounded" />
            <p className="text-sm">ID: {photo.promoter_id}</p>
            <p className="text-sm">Тип: {photo.type === 'board' ? 'Доска' : 'Ящики'}</p>
            <p className="text-sm">Статус: {photo.status}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => updateStatus(photo.id, 'unique')} className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600 text-sm">Уникальное</button>
              <button onClick={() => updateStatus(photo.id, 'duplicate')} className="bg-red-500 text-white p-1 rounded hover:bg-red-600 text-sm">Повтор</button>
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
  return <div>Ошибка: Неверная страница</div>;
}