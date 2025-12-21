import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import React from 'react';

interface TextEditorProps {
  initialContent?: string;
  onChange: (editor: Editor) => void;
  onBlur: (editor: Editor) => void;
}

export default function TextEditor(props: TextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: props.initialContent ?? '# Hello World\n\n',
    contentType: 'markdown',
  });

  React.useEffect(() => {
    const handleUpdate = () => props.onChange(editor);

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, props.onChange]);

  React.useEffect(() => {
    const handleBlur = () => props.onBlur(editor);

    editor.on('blur', handleBlur);
    return () => {
      editor.off('blur', handleBlur);
    };
  }, [editor, props.onBlur]);

  const handleClickOnWrapper = () => {
    editor.commands.focus('end');
  };

  return (
    <div onClick={handleClickOnWrapper} className="box-border h-full">
      <EditorContent editor={editor} />
    </div>
  );
}
