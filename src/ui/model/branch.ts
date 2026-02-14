import type { BranchStatus } from '@api/model/but';

export function getBranchStatusColor(status: BranchStatus): string {
  switch (status) {
    case 'nothingToPush':
      return '#5BE1DC';
    case 'unpushedCommits':
    case 'unpushedCommitsRequiringForce':
    case 'completelyUnpushed':
      return '#9FD0D6';
    case 'integrated':
      return '#B51AC1';
  }
}
