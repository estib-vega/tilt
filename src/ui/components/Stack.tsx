import { cn } from '@/lib/utils';
import { getBranchStatusColor } from '@/model/branch';
import { parseCommitMessage } from '@/model/commit';
import type { Branch, BranchStatus, Commit, Stack } from '@api/model/but';
import { useNavigate } from '@tanstack/react-router';
import type { JSX } from 'react';
import React from 'react';

interface StackComponentProps {
  stack: Stack;
}

export default function StackComponent(props: StackComponentProps): JSX.Element {
  return (
    <div className="flex flex-col w-64 gap-4">
      {props.stack.branches.map((branch) => (
        <BranchComponent key={branch.name} branch={branch} />
      ))}
    </div>
  );
}

interface BranchComponentProps {
  branch: Branch;
}

function BranchComponent(props: BranchComponentProps): JSX.Element {
  const navigate = useNavigate();

  const handleHeaderClick = () => {
    navigate({
      to: '/branch/$branchName',
      params: {
        branchName: props.branch.name,
      },
    });
  };

  return (
    <div className="flex flex-col border rounded-md">
      <div
        className="flex gap-1 items-center p-2 border-b cursor-pointer"
        title={props.branch.name}
        onClick={handleHeaderClick}
      >
        <BranchStatusComponent status={props.branch.branchStatus} />
        <p className="truncate font-bold select-none">{props.branch.name}</p>
      </div>
      {props.branch.commits.map((commit) => (
        <CommitComponent key={commit.commitId} commit={commit} />
      ))}
    </div>
  );
}

interface BranchStatusComponentProps {
  status: BranchStatus;
}

function BranchStatusComponent(props: BranchStatusComponentProps): JSX.Element {
  const color = getBranchStatusColor(props.status);
  const styleClass = cn('rounded-full w-[12px] h-[12px] border', `bg-[${color}]`);
  return <div className={styleClass}></div>;
}

interface CommitComponentProps {
  commit: Commit;
}

function CommitComponent(props: CommitComponentProps): JSX.Element {
  const { title } = React.useMemo(
    () => parseCommitMessage(props.commit.message),
    [props.commit.message],
  );

  const navigate = useNavigate();

  const handleCommitClick = () => {
    navigate({
      to: '/commit/$commitId',
      params: {
        commitId: props.commit.commitId,
      },
    });
  };

  return (
    <div className="not-last:border-b p-2 cursor-pointer" onClick={handleCommitClick}>
      <p className="truncate text-sm select-none">{title}</p>
    </div>
  );
}
