import type { BranchStatus } from '@api/model/but';

export function getBranchStatusColor(status: BranchStatus): string {
  switch (status) {
    case 'nothingToPush':
      return '#5be1dc';
    case 'unpushedCommits':
    case 'unpushedCommitsRequiringForce':
    case 'completelyUnpushed':
      return '#9fd0d6';
    case 'integrated':
      return '#b51ac1';
  }
}
