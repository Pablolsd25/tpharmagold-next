import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { canonicalImageUrl } from '@/lib/wix-media'
import type { BlogPost } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Blog' }

export default async function BlogPage() {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-white font-black text-3xl mb-8">Blog</h1>

      {!posts || posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500 text-lg">Próximamente artículos y contenido.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(posts as BlogPost[]).map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl overflow-hidden transition-all"
            >
              <div className="relative aspect-video bg-zinc-800 overflow-hidden">
                {post.cover_image ? (
                  <Image
                    src={canonicalImageUrl(post.cover_image)}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-5">
                {post.published_at && (
                  <p className="text-zinc-500 text-xs mb-2">
                    {new Date(post.published_at).toLocaleDateString('es-MX', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                )}
                <h2 className="text-white font-semibold leading-snug group-hover:text-zinc-300 transition-colors line-clamp-2">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-zinc-400 text-sm mt-2 line-clamp-2">{post.excerpt}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
