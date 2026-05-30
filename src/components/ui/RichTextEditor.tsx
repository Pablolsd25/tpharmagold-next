'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Upload, Link as LinkIcon, ImageIcon, X, Eye, EyeOff } from 'lucide-react'
import 'react-quill/dist/quill.snow.css'
import './rich-text-editor.css'

// ── Cargar ReactQuill dinámicamente (SSR disabled) ──────────────────────────
const ReactQuill = dynamic(
  async () => {
    const mod = await import('react-quill')
    const RQ = mod.default
    const Quill: any = (RQ as any).Quill

    if (!Quill) return RQ

    // Registrar VideoBlot personalizado
    const BlockEmbed = Quill.import('blots/block/embed')

    class VideoBlot extends BlockEmbed {
      static create(url: string) {
        const node = super.create() as HTMLDivElement
        node.setAttribute('contenteditable', 'false')
        node.setAttribute('data-video-url', url)
        node.style.textAlign = 'center'
        node.style.margin = '20px 0'

        const video = document.createElement('video')
        video.setAttribute('controls', '')
        video.setAttribute('preload', 'metadata')
        video.setAttribute('playsinline', '')
        video.style.maxWidth = '100%'
        video.style.width = '100%'
        video.style.borderRadius = '8px'
        video.style.display = 'block'
        video.style.margin = '0 auto'
        video.style.background = '#000'

        const source = document.createElement('source')
        source.setAttribute('src', url)
        source.setAttribute('type', 'video/mp4')
        video.appendChild(source)
        node.appendChild(video)

        return node
      }

      static value(node: HTMLElement) {
        return node.getAttribute('data-video-url') || ''
      }
    }

    VideoBlot.blotName = 'video-block'
    VideoBlot.tagName = 'DIV'
    VideoBlot.className = 'ql-video-block'
    Quill.register(VideoBlot, true)

    const Wrapped = ({ forwardedRef, ...props }: any) => <RQ ref={forwardedRef} {...props} />
    return Wrapped
  },
  {
    ssr: false,
    loading: () => <div className="h-64 bg-zinc-900 animate-pulse rounded-b-md" />,
  },
)

const FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'link', 'image', 'color', 'background', 'align', 'video-block',
]

interface RichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  name?: string
  defaultValue?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  name,
  defaultValue,
}: RichTextEditorProps) {
  // ── Procesar HTML inicial ──────────────────────────────────────────────
  const processInitialContent = (html: string) => {
    if (!html) return ''
    html = html.replace(/<img(?!\s[^>]*loading=)/gi, '<img loading="lazy"')
    html = html
      .replace(/<p style="text-align:\s*center;?">/gi, '<p class="ql-align-center">')
      .replace(/<p style="text-align:\s*right;?">/gi, '<p class="ql-align-right">')
      .replace(/<p style="text-align:\s*justify;?">/gi, '<p class="ql-align-justify">')
    html = html.replace(
      /<div[^>]*>\s*<video[^>]*>\s*<source\s+src="([^"]+)"[^>]*>[\s\S]*?<\/video>\s*<\/div>/gi,
      (_, url) => `<div class="ql-video-block" data-video-url="${url}"></div>`,
    )
    html = html.replace(
      /<video[^>]*>\s*<source\s+src="([^"]+)"[^>]*>[\s\S]*?<\/video>/gi,
      (_, url) => `<div class="ql-video-block" data-video-url="${url}"></div>`,
    )
    return html
  }

  const [content, setContent] = useState(processInitialContent(defaultValue || value || ''))
  const [showHtml, setShowHtml] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Modal de video
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [videoTab, setVideoTab] = useState<'upload' | 'url'>('upload')
  const videoFileRef = useRef<HTMLInputElement>(null)

  // Modal de imagen
  const [showImageModal, setShowImageModal] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageFileRef = useRef<HTMLInputElement>(null)

  const quillRef = useRef<any>(null)
  const isInternalChange = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => { setIsClient(true) }, [])

  useEffect(() => {
    if (value !== undefined && !isInternalChange.current) {
      const processed = processInitialContent(value)
      if (processed !== content) setContent(processed)
    }
    isInternalChange.current = false
  }, [value])

  // Preview con videos reales
  const previewHtml = useMemo(() => {
    return content.replace(
      /<div[^>]*class="ql-video-block"[^>]*>[\s\S]*?<\/div>/gi,
      (match) => {
        const url = match.match(/data-video-url="([^"]+)"/)?.[1] || ''
        if (!url) return match
        return `<div style="text-align:center;margin:24px 0"><video controls preload="metadata" playsinline style="max-width:100%;width:700px;height:auto;border-radius:12px;background:#000"><source src="${url}" type="video/mp4"></video></div>`
      },
    )
  }, [content])

  const hasVideos = useMemo(() => /ql-video-block|data-video-url/i.test(content), [content])

  // ── Guardar: convertir blots → HTML estándar ───────────────────────────
  const handleContentChange = useCallback((val: string) => {
    let out = val
    out = out.replace(
      /<div[^>]*class="ql-video-block"[^>]*>[\s\S]*?<\/div>/gi,
      (match) => {
        const url = match.match(/data-video-url="([^"]+)"/)?.[1] || ''
        if (!url) return match
        return `\n<div style="text-align:center;margin:30px 0">\n  <video controls preload="none" width="700" height="394" style="max-width:100%;height:auto;border-radius:8px">\n    <source src="${url}" type="video/mp4">\n  </video>\n</div>\n`
      },
    )
    out = out
      .replace(/<p class="ql-align-center">/g, '<p style="text-align:center;">')
      .replace(/<p class="ql-align-right">/g, '<p style="text-align:right;">')
      .replace(/<p class="ql-align-justify">/g, '<p style="text-align:justify;">')
    out = out.replace(/<img(?![^>]*\bloading=)/gi, '<img loading="lazy"')
    out = out.replace(/<p>\s*<\/p>/g, '')

    setContent(val)
    isInternalChange.current = true
    onChangeRef.current?.(out)
  }, [])

  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value
    const forEditor = raw.replace(
      /<div[^>]*>\s*<video[^>]*>\s*<source\s+src="([^"]+)"[^>]*>[\s\S]*?<\/video>\s*<\/div>/gi,
      (_, url) => `<div class="ql-video-block" data-video-url="${url}"></div>`,
    )
    setContent(forEditor)
    isInternalChange.current = true
    onChangeRef.current?.(raw)
  }

  // ── Video ──────────────────────────────────────────────────────────────
  const insertVideo = useCallback((url: string) => {
    const quill = quillRef.current?.getEditor?.()
    if (quill) {
      const range = quill.getSelection(true)
      const idx = range ? range.index : quill.getLength() - 1
      quill.insertText(idx, '\n', 'user')
      quill.insertEmbed(idx + 1, 'video-block', url, 'user')
      quill.insertText(idx + 2, '\n', 'user')
      quill.setSelection(idx + 3)
    }
    setShowVideoModal(false)
    setVideoUrl('')
  }, [])

  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingVideo(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `videos/desc_${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('images').upload(path, file, { upsert: false })
      if (error) throw new Error(error.message)
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
      insertVideo(publicUrl)
    } catch (err: any) {
      alert('Error subiendo video: ' + (err.message || 'desconocido'))
    } finally {
      setUploadingVideo(false)
      e.target.value = ''
    }
  }

  // ── Imagen ─────────────────────────────────────────────────────────────
  const insertImage = useCallback((url: string) => {
    const quill = quillRef.current?.getEditor?.()
    if (quill) {
      const range = quill.getSelection(true)
      const idx = range ? range.index : quill.getLength() - 1
      quill.insertEmbed(idx, 'image', url, 'user')
      quill.setSelection(idx + 1)
    }
    setShowImageModal(false)
    setImageUrl('')
  }, [])

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Máx 5 MB'); return }
    setUploadingImage(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `products/description/desc_${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('images').upload(path, file, { upsert: false })
      if (error) throw new Error(error.message)
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
      insertImage(publicUrl)
    } catch (err: any) {
      alert('Error subiendo imagen: ' + (err.message || 'desconocido'))
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  const openImageModal = useCallback(() => { setShowImageModal(true); setImageUrl('') }, [])

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: { image: () => openImageModal() },
    },
  }), [openImageModal])

  const getDisplayHtml = () =>
    content.replace(
      /<div[^>]*class="ql-video-block"[^>]*>[\s\S]*?<\/div>/gi,
      (match) => {
        const url = match.match(/data-video-url="([^"]+)"/)?.[1] || ''
        if (!url) return match
        return `\n<div style="text-align:center;margin:30px 0">\n  <video controls preload="none" width="700" height="394" style="max-width:100%;height:auto;border-radius:8px">\n    <source src="${url}" type="video/mp4">\n  </video>\n</div>\n`
      },
    )

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="rich-text-editor-wrapper">
      {/* Barra superior */}
      <div className="mb-2 flex justify-between items-center gap-2 flex-wrap">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowVideoModal(true)}
            className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 transition-colors flex items-center gap-1.5 font-medium"
          >
            <Upload className="h-3 w-3" />
            Insertar Video
          </button>
          {hasVideos && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`text-xs px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 font-medium ${
                showPreview
                  ? 'bg-accent/10 text-accent border-accent/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showPreview ? 'Ocultar Preview' : 'Vista Previa'}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowHtml(!showHtml)}
          className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded border border-zinc-700 transition-colors font-medium"
        >
          {showHtml ? '📝 Vista Visual' : '💻 Ver HTML'}
        </button>
      </div>

      {showHtml ? (
        <textarea
          value={getDisplayHtml()}
          onChange={handleHtmlChange}
          className="w-full min-h-[400px] p-4 bg-zinc-950 border border-zinc-700 rounded text-zinc-300 font-mono text-xs focus:outline-none focus:border-accent"
          placeholder="Código HTML..."
          spellCheck={false}
        />
      ) : (
        isClient && (
          // @ts-ignore
          <ReactQuill
            {...({ forwardedRef: quillRef } as any)}
            theme="snow"
            value={content}
            onChange={handleContentChange}
            modules={modules}
            formats={FORMATS}
            placeholder={placeholder}
            className="rich-text-editor"
          />
        )
      )}

      {/* Vista previa */}
      {!showHtml && hasVideos && showPreview && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-accent/30 to-transparent" />
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">Vista previa</span>
            <div className="h-px flex-1 bg-gradient-to-l from-accent/30 to-transparent" />
          </div>
          <div
            className="border border-zinc-700 rounded-xl bg-zinc-950 p-6 product-description text-zinc-300"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
            style={{ maxWidth: '100%', lineHeight: 1.75 }}
          />
        </div>
      )}

      {name && <input type="hidden" name={name} value={content} />}

      {/* ── Modal Video ── */}
      {showVideoModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-6 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">Insertar Video</h3>
              <button type="button" onClick={() => setShowVideoModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 border-b border-zinc-700">
              {(['upload', 'url'] as const).map(tab => (
                <button key={tab} type="button" onClick={() => setVideoTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    videoTab === tab ? 'border-accent text-accent' : 'border-transparent text-zinc-400 hover:text-white'
                  }`}>
                  {tab === 'upload' ? 'Subir Archivo' : 'URL'}
                </button>
              ))}
            </div>

            {videoTab === 'upload' && (
              <div className="text-center py-8">
                <input ref={videoFileRef} type="file" accept="video/*" onChange={handleVideoFileSelect} className="hidden" />
                {uploadingVideo ? (
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-zinc-400 text-sm">Subiendo video...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
                    <button type="button" onClick={() => videoFileRef.current?.click()}
                      className="px-5 py-2 bg-accent text-black font-semibold rounded-lg text-sm hover:bg-accent/90 transition-colors">
                      Seleccionar Archivo
                    </button>
                    <p className="text-zinc-500 text-xs mt-2">MP4, WebM — máx 50 MB</p>
                  </>
                )}
              </div>
            )}

            {videoTab === 'url' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300">URL del video</label>
                <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://ejemplo.com/video.mp4"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-accent" />
                <button type="button" onClick={() => videoUrl.trim() && insertVideo(videoUrl.trim())}
                  disabled={!videoUrl.trim()}
                  className="w-full py-2 bg-accent text-black font-semibold rounded-lg text-sm disabled:opacity-40 hover:bg-accent/90 transition-colors">
                  Insertar Video
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Imagen ── */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">Insertar Imagen</h3>
              <button type="button" onClick={() => setShowImageModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Upload */}
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center">
                <input ref={imageFileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleImageFileSelect} className="hidden" />
                {uploadingImage ? (
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-10 border-4 border-accent border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-zinc-400 text-sm">Subiendo imagen...</p>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
                    <button type="button" onClick={() => imageFileRef.current?.click()}
                      className="px-5 py-2 bg-accent text-black font-semibold rounded-lg text-sm hover:bg-accent/90 transition-colors">
                      Subir desde el equipo
                    </button>
                    <p className="text-zinc-500 text-xs mt-2">JPG, PNG, WebP, GIF — máx 5 MB</p>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-zinc-700" />
                <span className="text-xs text-zinc-500">O</span>
                <div className="flex-1 border-t border-zinc-700" />
              </div>

              {/* URL */}
              <div className="flex gap-2">
                <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-accent" />
                <button type="button" onClick={() => imageUrl.trim() && insertImage(imageUrl.trim())}
                  disabled={!imageUrl.trim()}
                  className="px-4 py-2 bg-accent text-black font-semibold text-sm rounded disabled:opacity-40 hover:bg-accent/90 transition-colors">
                  Insertar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
