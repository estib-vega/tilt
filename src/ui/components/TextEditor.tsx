// src/Tiptap.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';

export default function TextEditor() {
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: '# Hello World\n\nThis is a **Tiptap** editor with _Markdown_ support!',
    contentType: 'markdown',
  });

  return (
    <div className="focus-within:border focus-within:border-accent p-2">
      <EditorContent editor={editor} />
    </div>
  );
}
