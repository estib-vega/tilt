import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { useChat } from '@ai-sdk/react'
import ElectronTransport from '@/model/api/electronTransport'
import { ChatMessage } from '@/components/ChatMessage'

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
    <div className="min-h-0 h-full w-full flex flex-col">
      <div className="h-full w-full overflow-scroll">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
      </div>
      <div className="w-full p-8 flex shrink-0 gap-2 border-t">
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
