import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Smile, X, FileText, Download } from 'lucide-react'
import {
  useMessages,
  useSendMessage,
  useMarkMessagesRead,
  getChatAttachmentUrl,
} from '../hooks/useMessages'
import { useAuthStore } from '../stores/authStore'

const ACCEPTED_TYPES =
  'image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv'

function formatSize(bytes) {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export default function Chat() {
  const user = useAuthStore((s) => s.user)
  const { data: messages = [], isLoading } = useMessages()
  const sendMessage = useSendMessage()
  const markRead = useMarkMessagesRead()

  const [input, setInput] = useState('')
  const [pendingFile, setPendingFile] = useState(null)
  const [error, setError] = useState(null)
  const endRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const hasUnread = messages.some(
      (m) => m.sender_id !== user?.id && !m.read_at,
    )
    if (hasUnread) markRead.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, user?.id])

  // Preview locale pour les images
  const [filePreview, setFilePreview] = useState(null)
  useEffect(() => {
    if (!pendingFile || !pendingFile.type.startsWith('image/')) {
      setFilePreview(null)
      return
    }
    const url = URL.createObjectURL(pendingFile)
    setFilePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [pendingFile])

  const onPickFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 20 * 1024 * 1024) {
      setError('Fichier trop volumineux (20 Mo max).')
      e.target.value = ''
      return
    }
    setError(null)
    setPendingFile(f)
  }

  const clearFile = () => {
    setPendingFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const send = async (e) => {
    e.preventDefault()
    setError(null)
    const text = input.trim()
    if (!text && !pendingFile) return
    try {
      await sendMessage.mutateAsync({ body: text, file: pendingFile })
      setInput('')
      clearFile()
    } catch (err) {
      setError(err.message || "Erreur d'envoi.")
    }
  }

  const canSend = (input.trim() || pendingFile) && !sendMessage.isPending

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] -mx-4">
      <div className="px-4 pb-md">
        <h1 className="h-title">Messagerie</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Échanges factuels avec le co-parent. Tout est historisé, rien n'est supprimable.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-sm scrollbar-soft">
        {isLoading && (
          <p className="text-center text-on-surface-variant py-lg">Chargement…</p>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="text-center py-lg">
            <p className="text-body-md text-on-surface-variant">
              Aucun message pour l'instant.
            </p>
            <p className="text-caption text-on-surface-variant/70 mt-1">
              Envoie le premier message au co-parent.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} message={m} currentUserId={user?.id} />
        ))}
        <div ref={endRef} />
      </div>

      {error && (
        <div className="mx-4 text-body-md text-on-error-container bg-error-container rounded-md p-2 text-center">
          {error}
        </div>
      )}

      {/* Preview de la pièce jointe en attente */}
      {pendingFile && (
        <div className="mx-4 mb-2 p-2 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex items-center gap-md">
          {filePreview ? (
            <img
              src={filePreview}
              alt=""
              className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-14 w-14 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center flex-shrink-0">
              <FileText size={24} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-body-md font-semibold text-on-surface truncate">
              {pendingFile.name}
            </p>
            <p className="text-caption text-on-surface-variant">
              {formatSize(pendingFile.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors"
            aria-label="Retirer la pièce jointe"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <form
        onSubmit={send}
        className="sticky bottom-0 bg-surface-container-lowest border-t border-outline-variant/40 px-4 py-3"
      >
        <div className="flex items-end gap-2 bg-surface-container-low rounded-2xl px-3 py-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={onPickFile}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Joindre un fichier"
            disabled={sendMessage.isPending}
          >
            <Paperclip size={20} />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(e)
              }
            }}
            rows={1}
            placeholder={pendingFile ? 'Légende (optionnel)…' : 'Message…'}
            className="flex-1 resize-none bg-transparent text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none py-1.5 max-h-32"
          />
          <button
            type="button"
            className="p-2 text-on-surface-variant/50 cursor-not-allowed"
            aria-label="Emoji (bientôt)"
            disabled
          >
            <Smile size={20} />
          </button>
          <button
            type="submit"
            disabled={!canSend}
            className="p-2.5 rounded-full bg-primary text-on-primary disabled:opacity-40 transition-all active:scale-95"
            aria-label="Envoyer"
          >
            <Send size={18} strokeWidth={2.25} />
          </button>
        </div>
      </form>
    </div>
  )
}

function Bubble({ message, currentUserId }) {
  const mine = message.sender_id === currentUserId
  const time = new Date(message.created_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const hasAttachment = !!message.attachment_path
  const hasBody = !!message.body?.trim()

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[80%] px-4 py-2.5 shadow-soft',
          mine
            ? 'bg-primary text-on-primary rounded-2xl rounded-br-md'
            : 'bg-surface-container-lowest text-on-surface rounded-2xl rounded-bl-md border border-outline-variant/40',
        ].join(' ')}
      >
        {hasAttachment && (
          <Attachment message={message} mine={mine} compact={hasBody} />
        )}
        {hasBody && (
          <p className={`text-body-md leading-snug whitespace-pre-wrap ${hasAttachment ? 'mt-2' : ''}`}>
            {message.body}
          </p>
        )}
        <p
          className={[
            'text-caption mt-1 text-right',
            mine ? 'text-on-primary/70' : 'text-on-surface-variant',
          ].join(' ')}
        >
          {time}
        </p>
      </div>
    </div>
  )
}

function Attachment({ message, mine, compact }) {
  const [url, setUrl] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const isImage = message.attachment_mime?.startsWith('image/')

  useEffect(() => {
    let cancelled = false
    getChatAttachmentUrl(message.attachment_path)
      .then((u) => {
        if (!cancelled) setUrl(u)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
    return () => {
      cancelled = true
    }
  }, [message.attachment_path])

  if (loadError) {
    return (
      <p className={`text-caption ${mine ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
        Pièce jointe indisponible.
      </p>
    )
  }

  if (isImage) {
    return (
      <a
        href={url ?? '#'}
        target="_blank"
        rel="noreferrer"
        className="block"
        aria-label={message.attachment_name}
      >
        {url ? (
          <img
            src={url}
            alt={message.attachment_name ?? ''}
            className="rounded-xl max-h-64 w-auto object-cover"
            onError={() => setLoadError(true)}
          />
        ) : (
          <div className="h-32 w-48 rounded-xl bg-black/10 animate-pulse" />
        )}
      </a>
    )
  }

  return (
    <a
      href={url ?? '#'}
      target="_blank"
      rel="noreferrer"
      download={message.attachment_name}
      className={[
        'flex items-center gap-2 rounded-xl px-3 py-2 min-w-[200px] max-w-[280px]',
        mine
          ? 'bg-white/15 hover:bg-white/25'
          : 'bg-surface-container-low hover:bg-surface-container',
        'transition-colors',
        compact ? '' : 'my-0.5',
      ].join(' ')}
    >
      <div
        className={[
          'h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',
          mine ? 'bg-white/20 text-on-primary' : 'bg-primary-container/30 text-primary',
        ].join(' ')}
      >
        <FileText size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-md font-semibold truncate">
          {message.attachment_name ?? 'Fichier'}
        </p>
        <p className={`text-caption ${mine ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
          {formatSize(message.attachment_size)}
        </p>
      </div>
      <Download size={16} className="flex-shrink-0 opacity-70" />
    </a>
  )
}
