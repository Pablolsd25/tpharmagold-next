import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { canonicalImageUrl } from '@/lib/wix-media'
import type { BlogPost } from '@/types'
import type { Metadata } from 'next'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('blog_posts').select('title, excerpt').eq('slug', slug).single()
  return { title: data?.title ?? 'Artículo', description: data?.excerpt ?? undefined }
}

export default async function EntradaPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!post) notFound()

  const p = post as BlogPost

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/blog" className="text-zinc-500 hover:text-white text-sm transition-colors inline-block mb-6">
        ← Volver al blog
      </Link>

      {p.cover_image && (
        <div className="relative aspect-video rounded-xl overflow-hidden mb-8">
          <Image src={canonicalImageUrl(p.cover_image)} alt={p.title} fill className="object-cover" priority />
        </div>
      )}

      {p.published_at && (
        <p className="text-zinc-500 text-sm mb-3">
          {new Date(p.published_at).toLocaleDateString('es-MX', {
            year: 'numeric', month: 'long', day: 'numeric'
          })}
        </p>
      )}

      <h1 className="text-white font-black text-4xl leading-tight mb-6">{p.title}</h1>

      {p.excerpt && (
        <p className="text-zinc-300 text-lg leading-relaxed mb-8 border-l-2 border-zinc-700 pl-4">
          {p.excerpt}
        </p>
      )}

      <div
        className="prose prose-invert prose-zinc max-w-none text-zinc-300 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: p.content }}
      />
    </article>
  )
}
