import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { useChat } from '@ai-sdk/react'
import ElectronTransport from '@/model/api/electronTransport'

export const Route = createFileRoute('/')({
  component: App,
})

function useElectronChat() {
  return useChat({
    transport: new ElectronTransport(),
  })
}

function App() {
  const { messages, sendMessage } = useElectronChat()
  const [inputValue, setInputValue] = React.useState('')

  const handleSend = () => {
    if (inputValue.trim() === '') return
    sendMessage({ role: 'user', parts: [{ type: 'text', text: inputValue }] })
    setInputValue('')
  }

  return (
    <div className="h-full w-full flex flex-col border border-red-500">
      <div className="border w-full h-full">
        {messages.map((message, index) => (
          <div key={index} className="p-2">
            <strong>{message.role}:</strong>{' '}
            {message.parts.map((part, partIndex) => (
              <React.Fragment key={partIndex}>
                <div>
                  {part.type !== 'text' ? (
                    <pre className="text-xs">
                      {JSON.stringify(part, null, 2)}
                    </pre>
                  ) : null}
                </div>
                <span>{part.type === 'text' ? part.text : null}</span>
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
      <div className="w-full p-8 flex gap-2 border">
        <input
          className="w-full border p-2 rounded-sm"
          type="text"
          name="chat-input"
          placeholder="What is up"
          id="chat-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />

        <button
          type="button"
          className="bg-accent text-accent-foreground py-2 px-4 rounded-sm"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  )
}
