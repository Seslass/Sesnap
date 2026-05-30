// ============================================================
//  ЧАСТЬ 3 — CreatePost.jsx + Feed.jsx
//  Путь: src/components/CreatePost.jsx
//       src/components/Feed.jsx
// ============================================================


// ═══════════════════════════════════════════════════════════════
//  FILE: src/components/CreatePost.jsx
// ═══════════════════════════════════════════════════════════════
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// onPostCreated — колбэк, который вызываем после успешного создания поста
// (Feed использует его, чтобы добавить новый пост в начало списка)
export default function CreatePost({ onPostCreated }) {
  const [content, setContent]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const MAX_CHARS = 500;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);

    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setError('Необходимо войти в аккаунт.');
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from('posts')
      .insert({ user_id: user.id, content: content.trim() })
      .select(`
        id,
        content,
        image_url,
        created_at,
        user_id,
        profiles (
          id,
          username,
          avatar_url,
          is_verified,
          role
        )
      `)
      .single();

    if (insertError) {
      setError(insertError.message);
    } else {
      setContent('');
      // передаём новый пост родителю (Feed), чтобы не делать повторный запрос
      if (onPostCreated) onPostCreated({ ...data, likes_count: 0, user_liked: false });
    }

    setLoading(false);
  };

  return (
    <div className="bg-[#111118] border border-white/8 rounded-2xl p-5 mb-6">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={MAX_CHARS}
          rows={3}
          placeholder="Что у вас нового, Sesnap?"
          className="w-full bg-transparent text-white text-sm placeholder-zinc-600 resize-none focus:outline-none leading-relaxed"
        />

        <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-2">
          <span className={`text-xs ${content.length > MAX_CHARS * 0.9 ? 'text-amber-400' : 'text-zinc-600'}`}>
            {content.length} / {MAX_CHARS}
          </span>

          <div className="flex items-center gap-3">
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200"
            >
              {loading ? 'Публикую…' : 'Опубликовать'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
//  FILE: src/components/Feed.jsx
// ═══════════════════════════════════════════════════════════════
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import CreatePost from './CreatePost';

// ── Иконка верификации (та же, что в ProfilePage) ──────────────
function VerifiedBadge() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4 text-blue-400 flex-shrink-0"
      aria-label="Верифицирован"
    >
      <path
        fillRule="evenodd"
        d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ── Один пост ─────────────────────────────────────────────────
function PostCard({ post, currentUserId, onLikeToggle }) {
  const profile       = post.profiles;
  const likesCount    = post.likes_count ?? 0;
  const userLiked     = post.user_liked  ?? false;
  const [optimistic, setOptimistic] = useState({ liked: userLiked, count: likesCount });
  const [toggling, setToggling]     = useState(false);

  // Синхронизация при обновлении поста сверху
  useEffect(() => {
    setOptimistic({ liked: post.user_liked ?? false, count: post.likes_count ?? 0 });
  }, [post.user_liked, post.likes_count]);

  const handleLike = async () => {
    if (!currentUserId || toggling) return;
    setToggling(true);

    // Оптимистичное обновление UI
    const wasLiked = optimistic.liked;
    setOptimistic((prev) => ({
      liked:  !prev.liked,
      count:  prev.liked ? prev.count - 1 : prev.count + 1,
    }));

    if (wasLiked) {
      // Убираем лайк
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', currentUserId)
        .eq('post_id', post.id);
    } else {
      // Ставим лайк
      await supabase
        .from('likes')
        .insert({ user_id: currentUserId, post_id: post.id });
    }

    // Сообщаем Feed о новом состоянии лайка
    if (onLikeToggle) onLikeToggle(post.id, !wasLiked);
    setToggling(false);
  };

  const formattedDate = new Date(post.created_at).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <article className="bg-[#111118] border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-colors duration-200">

      {/* Шапка поста — автор */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-base font-black text-zinc-500">
              {profile?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-sm text-white truncate">{profile?.username ?? 'Пользователь'}</span>
            {profile?.is_verified && <VerifiedBadge />}
            {profile?.role === 'admin' && (
              <span className="px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[10px] font-bold rounded-full">
                ADM
              </span>
            )}
          </div>
          <p className="text-zinc-600 text-xs">{formattedDate}</p>
        </div>
      </div>

      {/* Текст поста */}
      <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
        {post.content}
      </p>

      {/* Картинка поста */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt=""
          className="mt-4 rounded-xl w-full object-cover max-h-96"
        />
      )}

      {/* Действия */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
        <button
          onClick={handleLike}
          disabled={!currentUserId || toggling}
          className={`flex items-center gap-1.5 text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
            optimistic.liked
              ? 'text-rose-400 hover:text-rose-300'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          aria-label={optimistic.liked ? 'Убрать лайк' : 'Поставить лайк'}
        >
          {/* Иконка сердца */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={optimistic.liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={optimistic.liked ? 0 : 1.8}
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
          <span>{optimistic.count}</span>
        </button>
      </div>
    </article>
  );
}


// ── Главный компонент ленты ────────────────────────────────────
export default function Feed() {
  const [posts, setPosts]               = useState([]);
  const [currentUser, setCurrentUser]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [hasMore, setHasMore]           = useState(true);

  const PAGE_SIZE = 10;

  // ── Загрузка постов ────────────────────────────────────────
  const fetchPosts = useCallback(async (from = 0) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (from === 0) setCurrentUser(user);

    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        image_url,
        created_at,
        user_id,
        profiles (
          id,
          username,
          avatar_url,
          is_verified,
          role
        )
      `)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Ошибка загрузки ленты:', error.message);
      return [];
    }

    // Считаем лайки для каждого поста
    const postIds = (data ?? []).map((p) => p.id);

    let likesCountMap = {};
    let userLikedSet  = new Set();

    if (postIds.length > 0) {
      // Количество лайков по каждому посту
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', postIds);

      (likesData ?? []).forEach(({ post_id }) => {
        likesCountMap[post_id] = (likesCountMap[post_id] ?? 0) + 1;
      });

      // Лайки текущего пользователя
      if (user) {
        const { data: userLikes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);

        (userLikes ?? []).forEach(({ post_id }) => userLikedSet.add(post_id));
      }
    }

    const enriched = (data ?? []).map((post) => ({
      ...post,
      likes_count: likesCountMap[post.id] ?? 0,
      user_liked:  userLikedSet.has(post.id),
    }));

    if (enriched.length < PAGE_SIZE) setHasMore(false);

    return enriched;
  }, []);

  // ── Первоначальная загрузка ────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const initial = await fetchPosts(0);
      setPosts(initial);
      setLoading(false);
    };
    init();
  }, [fetchPosts]);

  // ── Подгрузка (infinite scroll) ───────────────────────────
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const more = await fetchPosts(posts.length);
    setPosts((prev) => [...prev, ...more]);
    setLoadingMore(false);
  };

  // ── Новый пост из CreatePost ───────────────────────────────
  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  // ── Обновление счётчика лайков локально ───────────────────
  const handleLikeToggle = (postId, nowLiked) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              user_liked:  nowLiked,
              likes_count: nowLiked ? p.likes_count + 1 : p.likes_count - 1,
            }
          : p
      )
    );
  };

  // ── Рендер ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Шапка */}
        <header className="mb-8">
          <h1 className="text-3xl font-black tracking-tight">
            Ses<span className="text-violet-400">nap</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">Лента</p>
        </header>

        {/* Форма создания поста */}
        {currentUser && (
          <CreatePost onPostCreated={handlePostCreated} />
        )}

        {/* Состояние загрузки */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            <p className="text-4xl mb-3">✦</p>
            <p className="text-sm">Пока нет ни одного поста. Будьте первым!</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUser?.id ?? null}
                  onLikeToggle={handleLikeToggle}
                />
              ))}
            </div>

            {/* Кнопка "Загрузить ещё" */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 border border-white/10 hover:border-violet-500/40 hover:bg-violet-500/5 text-sm font-medium rounded-xl transition disabled:opacity-40"
                >
                  {loadingMore ? 'Загрузка…' : 'Загрузить ещё'}
                </button>
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <p className="text-center text-zinc-700 text-xs mt-8">
                Вы достигли конца ленты ✦
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
