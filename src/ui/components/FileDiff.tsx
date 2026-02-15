import { useUiSettingsStore } from '@/store';
import type { JsonHunk } from '@api/model/but';
import { DiffFile, DiffModeEnum, DiffView, type DiffHighlighterLang } from '@git-diff-view/react';
import type { JSX } from 'react';
import React from 'react';

interface FileDiffProps {
  filePath: string;
  oldFilePath: string | null;
  hunks: JsonHunk[];
}

const FAKE_NEWS =
  'diff --git a/packages/myreact-reactivity/src/reactive/feature.ts b/packages/myreact-reactivity/src/reactive/feature.ts\nindex 5b301628..15aac42f 100644\n--- a/packages/myreact-reactivity/src/reactive/feature.ts\n+++ b/packages/myreact-reactivity/src/reactive/feature.ts\n';

export default function FileDiff(props: FileDiffProps): JSX.Element {
  const theme = useUiSettingsStore((state) => state.theme);
  const lang = React.useMemo(() => getDiffLangFromName(props.filePath), [props.filePath]);

  const data = React.useMemo(() => {
    const diffFile = DiffFile.createInstance({
      oldFile: { fileName: props.oldFilePath },
      newFile: { fileName: props.filePath, fileLang: lang },
      hunks: props.hunks.map((hunk) => FAKE_NEWS + hunk.diff),
    });
    diffFile.init();
    diffFile.buildUnifiedDiffLines();
    return diffFile;
  }, [props.oldFilePath, props.filePath, props.hunks, lang]);

  return (
    <div className="w-full overflow-auto">
      <p className="font-mono text-xs p-2 border-t border-r border-l rounded-t-lg bg-muted text-muted-foreground">
        {props.filePath}
      </p>
      <DiffView<string>
        className="border-color overflow-hidden rounded-b-lg"
        diffFile={data}
        diffViewTheme={theme === 'dark' ? 'dark' : 'light'}
        diffViewFontSize={12}
        diffViewHighlight
        diffViewMode={DiffModeEnum.Unified}
      />
    </div>
  );
}

function getDiffLangFromName(filePath: string): DiffHighlighterLang | undefined {
  const extension = filePath.split('.').at(-1);
  if (!extension) return 'markdown';
  switch (extension) {
    case 'svelte':
      return 'ts';
    default:
      return undefined;
  }
}
