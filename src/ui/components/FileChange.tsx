import FileDiff from './FileDiff';
import type { JsonChange } from '@api/model/but';

interface FileChangeProps {
  change: JsonChange;
}

export default function FileChange(props: FileChangeProps) {
  switch (props.change.diff.type) {
    case 'binary':
      return (
        <div>
          <p>binary</p>
        </div>
      );
    case 'tooLarge':
      return (
        <div>
          <p>too large</p>
        </div>
      );
    case 'patch':
      return (
        <FileDiff
          filePath={props.change.path}
          oldFilePath={props.change.oldPath}
          hunks={props.change.diff.hunks}
        />
      );
  }
}
