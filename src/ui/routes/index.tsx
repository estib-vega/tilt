import { createFileRoute } from '@tanstack/react-router'
import React from 'react'

export const Route = createFileRoute('/')({
  component: App,
})

function streamChat(message: string) {
  const chatId = window.api.chatStart(message)
  window.api.onChunk((event) => {
    if (event.id === chatId) {
      console.log('Received chunk:', event.text)
    }
  })

  window.api.onEnd((event) => {
    if (event.id === chatId) {
      console.log('Chat ended. Full response:', event.text)
    }
  })
}

function App() {
  React.useEffect(() => {
    streamChat('Hello, how are you?')
  }, [])

  return <div className="text-center">hello</div>
}
