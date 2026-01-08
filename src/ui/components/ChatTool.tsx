import type { ToolUIPart } from 'ai';
import type { JSX } from 'react';
import type { Tools } from '@api/ai/tools';
import { Tool, ToolContent, ToolInput, ToolOutput } from './ai-elements/tool';
import { useWatchChatToolUpdates } from '@/model/api/chat';
import type { UIChatToolUpdateEventContent } from '@api/api';
import React from 'react';
import type { WebSearchEvent } from '@api/ai/webSearch';
import { Shimmer } from './ai-elements/shimmer';
import { CollapsibleTrigger } from '@radix-ui/react-collapsible';
import { ChevronDownIcon, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatToolProps {
  chatId: string;
  toolPart: ToolUIPart<Tools>;
}

export default function ChatTool(props: ChatToolProps): JSX.Element {
  switch (props.toolPart.type) {
    case 'tool-searchWeb':
      return <WebTool chatId={props.chatId} description={props.toolPart} />;
    default:
      return <div>Unknown Tool</div>;
  }
}

type WebToolDescription = ToolUIPart<Pick<Tools, 'searchWeb'>>;

interface WebToolProps {
  chatId: string;
  description: WebToolDescription;
}

function WebTool(props: WebToolProps): JSX.Element {
  const [isDone, lastEvent, icons] = useWatchWebToolUpdates(
    props.chatId,
    props.description.toolCallId,
  );

  return (
    <div className="min-w-0 w-full mb-4 flex flex-col gap-1">
      <Tool className="mb-0">
        <CollapsibleTrigger className="cursor-pointer flex  w-full items-center justify-between gap-4 p-3">
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-muted-foreground" />
            <WebToolStatus isDone={isDone} lastEvent={lastEvent} description={props.description} />
            <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </div>
          {icons.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto">
              {icons.map((icon, index) => (
                <WebPageIcon key={index} url={icon.url} title={icon.title} index={index} />
              ))}
            </div>
          )}
        </CollapsibleTrigger>
        <ToolContent>
          <ToolInput input={props.description.input} />
          <ToolOutput output={props.description.output} errorText={props.description.errorText} />
        </ToolContent>
      </Tool>
    </div>
  );
}

interface WebPageIconProps {
  url: string;
  title: string;
  index: number;
}

function WebPageIcon(props: WebPageIconProps): JSX.Element {
  const [loaded, setLoaded] = React.useState(false);
  const delay = props.index * 300;
  return (
    <img
      src={props.url}
      title={props.title}
      alt={props.title}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      className={cn(
        'size-5 rounded-sm object-contain bg-muted transition-opacity duration-300',
        !loaded && 'opacity-0',
        loaded && 'opacity-100 animate-appear-up',
        `transition-delay-[${delay}ms]`,
      )}
    />
  );
}
interface WebToolStatusProps {
  isDone: boolean;
  lastEvent: WebSearchEvent | undefined;
  description: WebToolDescription;
}

function WebToolStatus(props: WebToolStatusProps): JSX.Element {
  if (props.lastEvent === undefined) {
    switch (props.description.state) {
      case 'input-streaming':
      case 'input-available':
        return <></>;
      case 'output-available':
        return (
          <div className="w-full">
            <p className="text-muted-foreground">search complete</p>
          </div>
        );
      case 'output-error':
        return (
          <div className="w-full">
            <p className="text-muted-foreground">error during search</p>
          </div>
        );
    }
  }
  if (props.isDone)
    return (
      <div className="w-full">
        <p className="text-muted-foreground">{getWebSearchEventTitle(props.lastEvent)}</p>
      </div>
    );

  return (
    <div className="w-full">
      <Shimmer duration={1}>{getWebSearchEventTitle(props.lastEvent)}</Shimmer>
    </div>
  );
}

function getWebSearchEventTitle(event: WebSearchEvent): string {
  switch (event.type) {
    case 'start':
      return `beginning search: ${event.query}`;
    case 'received-results':
      return `processing ${event.results.length} results`;
    case 'processed-results':
      return `finished processing results`;
    case 'started-summarization':
      return `starting summarization`;
    case 'completed-summarization':
      return `summary completed`;
    case 'error':
      return `error encountered`;
    case 'end':
      return `done`;
  }
}

function useWatchWebToolUpdates(chatId: string, toolCallId: string) {
  const [events, setEvents] = React.useState<WebSearchEvent[]>([]);
  const lastEvent = React.useMemo(() => {
    if (events.length === 0) {
      return undefined;
    }
    return events[events.length - 1];
  }, [events]);

  const isDone = React.useMemo(() => {
    if (events.length === 0 || lastEvent === undefined) {
      return false;
    }
    return lastEvent.type === 'end' || lastEvent.type === 'error';
  }, [events, lastEvent]);

  const icons = React.useMemo(() => {
    const results = events.find((event) => event.type === 'processed-results')?.processedResults;
    if (!results) {
      return [];
    }
    const urlMap = new Map<string, string>();
    results.forEach((result) => {
      if (result.icon) {
        urlMap.set(result.icon, result.title);
      }
    });

    const urls: { url: string; title: string }[] = [];
    urlMap.forEach((title, url) => {
      urls.push({ url, title });
    });
    urls.sort((a, b) => a.title.localeCompare(b.title));
    return urls;
  }, [events]);

  const watcher = React.useCallback(
    (content: UIChatToolUpdateEventContent) => {
      if (content.tool !== 'web-search' || content.callId !== toolCallId) {
        // Ignore if it's not this tool.
        return;
      }
      setEvents((prev) => [...prev, content.event]);
    },
    [setEvents, toolCallId],
  );
  useWatchChatToolUpdates(chatId, watcher);

  return [isDone, lastEvent, icons, events] as const;
}
