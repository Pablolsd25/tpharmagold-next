'use client'

import { useRouter } from 'next/navigation'

export default function BlogToggle({ postId, isPublished }: { postId: string; isPublished: boolean }) {
  const router = useRouter()

  const toggle = async () => {
    await fetch(`/api/admin/blog/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !isPublished }),
    })
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
        isPublished
          ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400'
          : 'bg-zinc-700 text-zinc-400 hover:bg-green-500/20 hover:text-green-400'
      }`}
    >
      {isPublished ? 'Publicado' : 'Borrador'}
    </button>
  )
}
