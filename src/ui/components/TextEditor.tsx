import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';

interface TextEditorProps {
  initialContent?: string;
}

export default function TextEditor(props: TextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: props.initialContent ?? '# Hello World\n\n',
    contentType: 'markdown',
  });

  const handleClickOnWrapper = () => {
    editor.commands.focus('end');
  };

  return (
    <div
      onClick={handleClickOnWrapper}
      className="box-border border border-accent focus-within:border-accent-foreground/10 p-2 h-full"
    >
      <EditorContent editor={editor} />
    </div>
  );
}
