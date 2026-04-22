import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Smile } from 'lucide-react'

const DEMO_MESSAGES = [
  {
    id: 1,
    from: 'other',
    text: 'Hello, tu peux récupérer Léa à 17h30 demain ?',
    time: '09:42',
  },
  {
    id: 2,
    from: 'me',
    text: 'Oui pas de souci. Elle a son cours de piano après ?',
    time: '09:45',
  },
  {
    id: 3,
    from: 'other',
    text: 'Non piano c\'est mercredi. Juste rentrer à la maison 👍',
    time: '09:46',
  },
  {
    id: 4,
    from: 'me',
    text: 'Parfait. Je mets un rappel dans l\'agenda.',
    time: '09:47',
  },
  {
    id: 5,
    from: 'other',
    text: 'Merci 🙏',
    time: '09:48',
  },
]

export default function Chat() {
  const [messages, setMessages] = useState(DEMO_MESSAGES)
  const [input, setInput] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setMessages((m) => [
      ...m,
      {
        id: Date.now(),
        from: 'me',
        text,
        time: new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ])
    setInput('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] -mx-4">
      {/* En-tête discret */}
      <div className="px-4 pb-md">
        <h1 className="h-title">Messagerie</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Échanges factuels avec le co-parent. Tout est historisé.
        </p>
      </div>

      {/* Fil de messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-sm scrollbar-soft">
        {messages.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={send}
        className="sticky bottom-0 bg-surface-container-lowest border-t border-outline-variant/40 px-4 py-3"
      >
        <div className="flex items-end gap-2 bg-surface-container-low rounded-2xl px-3 py-2">
          <button
            type="button"
            className="p-2 text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Joindre"
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
            className="p-2 text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Emoji"
          >
            <Smile size={20} />
          </button>
          <button
            type="submit"
            disabled={!input.trim()}
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

function Bubble({ message }) {
  const mine = message.from === 'me'
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
          {message.text}
        </p>
        <p
          className={[
            'text-caption mt-1 text-right',
            mine ? 'text-on-primary/70' : 'text-on-surface-variant',
          ].join(' ')}
        >
          {message.time}
        </p>
      </div>
    </div>
  )
}
