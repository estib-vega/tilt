import { Conversation, ConversationContent } from '@/components/ai-elements/conversation';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { GenericMessage } from '@/components/ChatMessage';
import Conditional from '@/components/Conditional';
import FileChange from '@/components/FileChange';
import ReviewChat from '@/components/ReviewChat';
import { Button } from '@/components/ui/button';
import { useButDiff, useButDiffSummary } from '@/model/api/but';
import { useGetProjectMetadata } from '@/model/api/project';
import { useProjectsStore } from '@/store';
import type { ProjectId } from '@api/db/tables/projects';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { MessageCircleCode } from 'lucide-react';
import React, { type JSX } from 'react';

export const Route = createFileRoute('/branch/$branchName')({
  component: RouteComponent,
  loader: () => {
    const state = useProjectsStore.getState();
    const projectId = state.projectId;
    if (!projectId) {
      // If there's no projectId selected, redirect to chat
      throw redirect({
        to: '/chat',
      });
    }
    return { projectId };
  },
});

function RouteComponent() {
  const { projectId } = Route.useLoaderData();
  const params = Route.useParams();

  return (
    <div className="min-h-0 h-full w-full px-2 box-border flex overflow-y-auto scrollbar-muted">
      <React.Suspense>
        <View projectId={projectId} branchName={params.branchName} />
      </React.Suspense>
    </div>
  );
}

interface ViewProps {
  projectId: ProjectId;
  branchName: string;
}

function View(props: ViewProps): JSX.Element {
  const { projectId, branchName } = props;
  const [showChat, setShowChat] = React.useState(false);
  const { data: meta } = useGetProjectMetadata(projectId);

  if (!meta.butBinaryPath || !meta.repositoryPath) {
    return <h1>Please configure a repository path and but path in order to use this feature</h1>;
  }

  return (
    <React.Fragment>
      <div className="w-full flex flex-col gap-4">
        <Summary projectId={projectId} branchName={branchName} />
        <React.Suspense>
          <BranchView projectId={projectId} branchName={branchName} />
        </React.Suspense>
      </div>
      <Conditional condition={showChat}>
        <div className="w-full min-w-64 flex sticky top-0">
          <ReviewChat projectId={projectId} cliId={branchName} onClose={() => setShowChat(false)} />
        </div>
      </Conditional>
      <ToolKit showingChat={showChat} onChatClick={() => setShowChat((prev) => !prev)} />
    </React.Fragment>
  );
}

interface ToolKitProps {
  showingChat: boolean;
  onChatClick: () => void;
}

function ToolKit(props: ToolKitProps) {
  return (
    <Conditional condition={!props.showingChat}>
      <div className="z-50 absolute bottom-0 right-0 p-8 flex">
        <div className="flex px-8 py-4 rounded-2xl bg-accent-foreground/10 hover:bg-accent-foreground/50 transition-colors">
          <Button className="cursor-pointer rounded-full w-8 h-8" onClick={props.onChatClick}>
            <MessageCircleCode />
          </Button>
        </div>
      </div>
    </Conditional>
  );
}

interface SummaryProps {
  projectId: ProjectId;
  branchName: string;
}

function Summary(props: SummaryProps) {
  const id = `${props.projectId}:${props.branchName}`;
  const { messages, isLoading, start } = useButDiffSummary(id);
  const lastMessageIndex = React.useMemo(() => messages.length - 1, [messages.length]);

  const handleStartSummary = async () => {
    await start({
      projectId: props.projectId,
      cliId: props.branchName,
      modelIdentifier: {
        name: 'gpt-oss:20b',
        provider: 'ollama',
      },
    });
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="w-full flex justify-center">
        <Button className="cursor-pointer" onClick={handleStartSummary}>
          generate summary
        </Button>
      </div>
    );
  }

  if (messages.length === 0 && isLoading) {
    return (
      <div className="w-full flex justify-center">
        <Shimmer duration={1}>loading</Shimmer>
      </div>
    );
  }

  return (
    <div>
      <Conversation>
        <ConversationContent className="min-w-0 w-full">
          {messages.map((message, index) => (
            <GenericMessage
              key={message.id}
              message={message}
              isLast={lastMessageIndex === index}
            />
          ))}
        </ConversationContent>
      </Conversation>
    </div>
  );
}

interface BranchViewProps {
  projectId: ProjectId;
  branchName: string;
}

function BranchView(props: BranchViewProps) {
  const { data: diff } = useButDiff(props.projectId, props.branchName);
  return (
    <div className="flex flex-col gap-4 w-full">
      {diff.changes.map((change, index) => (
        <FileChange key={change.id ?? index} change={change} />
      ))}
      <div className="w-full h-60"></div>
    </div>
  );
}
