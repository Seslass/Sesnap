'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const MAX = 500

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true); setError(null)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) { setError('Необходимо войти в аккаунт.'); setLoading(false); return }

    const { data, error: insertError } = await supabase
      .from('posts')
      .insert({ user_id: user.id, content: content.trim() })
      .select(`id, content, image_url, created_at, user_id, profiles(id, username, avatar_url, is_verified, role)`)
      .single()

    if (insertError) { setError(insertError.message) }
    else {
      setContent('')
      if (onPostCreated) onPostCreated({ ...data, likes_count: 0, user_liked: false })
    }
    setLoading(false)
  }

  return (
    <div className="bg-[#111118] border border-white/8 rounded-2xl p-5 mb-6">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={MAX}
          rows={3}
          placeholder="Что у вас нового, Sesnap?"
          className="w-full bg-transparent text-white text-sm placeholder-zinc-600 resize-none focus:outline-none leading-relaxed"
        />
        <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-2">
          <span className={`text-xs ${content.length > MAX * 0.9 ? 'text-amber-400' : 'text-zinc-600'}`}>
            {content.length} / {MAX}
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
  )
}
