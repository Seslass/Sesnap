// ============================================================
//  ЧАСТЬ 2 — AuthForm.jsx + ProfilePage.jsx
//  Путь: src/components/AuthForm.jsx
//       src/components/ProfilePage.jsx
// ============================================================

// ─────────────────────────────────────────────────────────────
//  lib/supabaseClient.js  (создайте этот файл один раз)
// ─────────────────────────────────────────────────────────────
//
//  import { createClient } from '@supabase/supabase-js'
//
//  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
//  const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
//
//  export const supabase = createClient(supabaseUrl, supabaseKey)
//
// ─────────────────────────────────────────────────────────────


// ═══════════════════════════════════════════════════════════════
//  FILE: src/components/AuthForm.jsx
// ═══════════════════════════════════════════════════════════════
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthForm() {
  const [tab, setTab]           = useState('login');   // 'login' | 'register'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);

  const resetMessages = () => { setError(null); setSuccess(null); };

  // ── Вход ──────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Вы вошли! Перенаправляем…');
      // next/navigation: router.push('/feed') — добавьте при необходимости
    }
    setLoading(false);
  };

  // ── Регистрация ───────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!username.trim()) {
      setError('Введите имя пользователя.');
      return;
    }

    setLoading(true);

    // Проверяем уникальность username ДО регистрации
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .maybeSingle();

    if (existing) {
      setError('Это имя пользователя уже занято.');
      setLoading(false);
      return;
    }

    // Регистрируем пользователя; триггер сам создаст профиль
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.trim() }, // передаём в raw_user_meta_data
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // После подтверждения триггер создаст профиль, но username из meta
    // автоматически НЕ подхватывается нашим триггером — обновляем вручную
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', data.user.id);
    }

    setSuccess('Регистрация успешна! Проверьте почту для подтверждения.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Логотип */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-white">
            Ses<span className="text-violet-400">nap</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Соцсеть нового поколения</p>
        </div>

        {/* Карточка */}
        <div className="bg-[#111118] border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/60">

          {/* Переключатель вкладок */}
          <div className="flex rounded-xl overflow-hidden border border-white/10 mb-8">
            {['login', 'register'].map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); resetMessages(); }}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  tab === t
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {t === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          {/* Форма */}
          <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="space-y-4">

            {tab === 'register' && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="sesnap_user"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition"
              />
            </div>

            {/* Сообщения */}
            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-all duration-200 mt-2"
            >
              {loading ? 'Загрузка…' : tab === 'login' ? 'Войти в Sesnap' : 'Создать аккаунт'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
//  FILE: src/components/ProfilePage.jsx
// ═══════════════════════════════════════════════════════════════
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Иконка галочки верификации
function VerifiedBadge() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5 text-blue-400 flex-shrink-0"
      aria-label="Верифицированный аккаунт"
    >
      <path
        fillRule="evenodd"
        d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// Пропс: userId (uuid) — чей профиль показывать
export default function ProfilePage({ userId }) {
  const [profile, setProfile]           = useState(null);
  const [posts, setPosts]               = useState([]);
  const [currentUser, setCurrentUser]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [editing, setEditing]           = useState(false);
  const [editBio, setEditBio]           = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState(null);

  // ── Загрузка данных ────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoading(true);

      // Текущий авторизованный пользователь
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Профиль
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Ошибка загрузки профиля:', profileError.message);
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setEditBio(profileData.bio || '');
      setEditUsername(profileData.username || '');

      // Посты пользователя
      const { data: postsData } = await supabase
        .from('posts')
        .select('id, content, image_url, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setPosts(postsData || []);
      setLoading(false);
    };

    load();
  }, [userId]);

  // ── Сохранение редактирования ──────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        username: editUsername.trim(),
        bio: editBio.trim(),
      })
      .eq('id', userId);

    if (error) {
      setSaveError(error.message);
    } else {
      setProfile((prev) => ({
        ...prev,
        username: editUsername.trim(),
        bio: editBio.trim(),
      }));
      setEditing(false);
    }
    setSaving(false);
  };

  // ── Загрузка аватара ───────────────────────────────────────
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext      = file.name.split('.').pop();
    const filePath = `avatars/${userId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Ошибка загрузки аватара:', uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));
  };

  // ── Рендер ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-zinc-400">
        Профиль не найден.
      </div>
    );
  }

  const isOwner = currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Обложка */}
      <div className="h-40 bg-gradient-to-r from-violet-900/50 via-purple-800/30 to-indigo-900/50" />

      <div className="max-w-2xl mx-auto px-4">

        {/* Шапка профиля */}
        <div className="relative -mt-16 mb-6">
          <div className="flex items-end justify-between">

            {/* Аватар */}
            <div className="relative">
              <div className="w-28 h-28 rounded-2xl border-4 border-[#0a0a0f] overflow-hidden bg-zinc-800">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-black text-zinc-500">
                    {profile.username?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
              </div>
              {/* Кнопка смены аватара (только для владельца) */}
              {isOwner && (
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-violet-600 hover:bg-violet-500 rounded-full flex items-center justify-center cursor-pointer transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
                    <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3h-15a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0zm12-1.5a.75.75 0 100 1.5.75.75 0 000-1.5z" clipRule="evenodd" />
                  </svg>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              )}
            </div>

            {/* Кнопки действий */}
            {isOwner && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-5 py-2 border border-white/15 hover:border-violet-500/50 hover:bg-violet-500/10 text-sm font-medium rounded-xl transition"
              >
                Редактировать
              </button>
            )}
          </div>

          {/* Имя + бейджи */}
          <div className="mt-4">
            {editing ? (
              <input
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="text-2xl font-black bg-transparent border-b border-violet-500 focus:outline-none w-full mb-1"
              />
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black">{profile.username}</h2>
                {profile.is_verified && <VerifiedBadge />}
                {profile.role === 'admin' && (
                  <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-full tracking-wide">
                    Администратор
                  </span>
                )}
              </div>
            )}

            {/* Bio */}
            <div className="mt-2">
              {editing ? (
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  placeholder="Расскажите о себе…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-violet-500 resize-none"
                />
              ) : (
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {profile.bio || 'Bio пока не заполнен.'}
                </p>
              )}
            </div>

            {/* Кнопки сохранить/отмена */}
            {editing && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-sm font-semibold rounded-xl transition"
                >
                  {saving ? 'Сохранение…' : 'Сохранить'}
                </button>
                <button
                  onClick={() => { setEditing(false); setSaveError(null); }}
                  className="px-5 py-2 border border-white/10 hover:bg-white/5 text-sm font-medium rounded-xl transition"
                >
                  Отмена
                </button>
                {saveError && <p className="text-red-400 text-xs self-center">{saveError}</p>}
              </div>
            )}
          </div>

          {/* Статистика */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-white/5">
            <div className="text-center">
              <p className="text-xl font-black">{posts.length}</p>
              <p className="text-xs text-zinc-500">Постов</p>
            </div>
          </div>
        </div>

        {/* Посты пользователя */}
        <section>
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Публикации</h3>
          {posts.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-12">Постов пока нет.</p>
          ) : (
            <div className="space-y-4 pb-12">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-[#111118] border border-white/8 rounded-2xl p-5"
                >
                  <p className="text-zinc-200 text-sm leading-relaxed">{post.content}</p>
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt=""
                      className="mt-3 rounded-xl w-full object-cover max-h-96"
                    />
                  )}
                  <p className="text-zinc-600 text-xs mt-3">
                    {new Date(post.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
