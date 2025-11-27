import type { JSX } from 'react'
import ReactMarkdown from 'react-markdown'

interface MarkdownProps {
  text: string
}

export default function Markdown({ text }: MarkdownProps): JSX.Element {
  return (
    <ReactMarkdown
      components={{
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-blue-600 underline"
            target="_blank"
            rel="noreferrer"
          >
            {children}
          </a>
        ),
        b: ({ children }) => <strong>{children}</strong>,
        i: ({ children }) => <em>{children}</em>,
        ul: ({ children }) => (
          <ul className="list-disc pl-6 mb-4">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 mb-4">{children}</ol>
        ),
        li: ({ children }) => <li className="mb-2">{children}</li>,
        p: ({ children }) => <p className="mb-4">{children}</p>,
        h1: ({ children }) => (
          <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-bold mt-8 mb-4">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl font-bold mt-8 mb-4">{children}</h3>
        ),
        code: ({ children }) => (
          <code className="bg-gray-100 rounded px-1 py-0.5 font-mono">
            {children}
          </code>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  )
}
