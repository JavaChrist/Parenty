import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Smile } from 'lucide-react'
import { useMessages, useSendMessage } from '../hooks/useMessages'
import { useAuthStore } from '../stores/authStore'

export default function Chat() {
  const user = useAuthStore((s) => s.user)
  const { data: messages = [], isLoading } = useMessages()
  const sendMessage = useSendMessage()

  const [input, setInput] = useState('')
  const [error, setError] = useState(null)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (e) => {
    e.preventDefault()
    setError(null)
    const text = input.trim()
    if (!text) return
    try {
      await sendMessage.mutateAsync(text)
      setInput('')
    } catch (err) {
      setError(err.message || 'Erreur d\'envoi.')
    }
  }

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

      <form
        onSubmit={send}
        className="sticky bottom-0 bg-surface-container-lowest border-t border-outline-variant/40 px-4 py-3"
      >
        <div className="flex items-end gap-2 bg-surface-container-low rounded-2xl px-3 py-2">
          <button
            type="button"
            className="p-2 text-on-surface-variant/50 cursor-not-allowed"
            aria-label="Joindre (bientôt)"
            disabled
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
            placeholder="Message…"
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
            disabled={!input.trim() || sendMessage.isPending}
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
        <p className="text-body-md leading-snug whitespace-pre-wrap">
          {message.body}
        </p>
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
