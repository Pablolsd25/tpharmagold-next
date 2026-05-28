import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import BlogToggle from './BlogToggle'

export const metadata = { title: 'Blog | Admin' }

export default async function AdminBlogPage() {
  await createClient() // auth check via layout
  const supabase = createAdminClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, is_published, published_at, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-display font-bold text-3xl uppercase tracking-wide">Blog</h1>
          <p className="text-zinc-500 text-sm mt-1">{(posts ?? []).length} artículos</p>
        </div>
        <Link href="/admin/blog/nuevo" className="btn-accent px-5 py-2.5 rounded text-sm">
          + Nuevo artículo
        </Link>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg divide-y divide-zinc-800">
        {(posts ?? []).map((post) => (
          <div key={post.id} className="flex items-center justify-between px-5 py-4">
            <div className="flex-1 min-w-0 mr-4">
              <p className="text-white text-sm font-medium truncate">{post.title}</p>
              <p className="text-zinc-600 text-xs font-mono mt-0.5">{post.slug}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <BlogToggle postId={post.id} isPublished={post.is_published} />
              <Link
                href={`/admin/blog/${post.id}`}
                className="text-xs text-accent hover:underline"
              >
                Editar
              </Link>
              {post.is_published && (
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  Ver →
                </Link>
              )}
            </div>
          </div>
        ))}
        {(posts ?? []).length === 0 && (
          <p className="px-5 py-12 text-center text-zinc-600 text-sm">No hay artículos aún</p>
        )}
      </div>
    </div>
  )
}
