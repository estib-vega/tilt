import { Tool, ToolContent, ToolInput, ToolOutput } from './ai-elements/tool';
import type { ReviewTools } from '@api/ai/tools';
import type { ToolUIPart } from 'ai';
import type { JSX } from 'react';
import { CollapsibleTrigger } from '@radix-ui/react-collapsible';
import { ChevronDownIcon, FileCode, SquareTerminal, File, SquarePen } from 'lucide-react';

interface ReviewChatToolProps {
  toolPart: ToolUIPart<ReviewTools>;
}

export default function ReviewChatTool(props: ReviewChatToolProps): JSX.Element {
  switch (props.toolPart.type) {
    case 'tool-showDiff':
      return <ShowDiffTool description={props.toolPart} />;
    case 'tool-bash':
      return <BashTool description={props.toolPart} />;
    case 'tool-readFile':
      return <ReadFileTool description={props.toolPart} />;
    case 'tool-writeFile':
      return <WriteFileTool description={props.toolPart} />;
  }
}

type ShowDiffToolDescription = ToolUIPart<Pick<ReviewTools, 'showDiff'>>;
type BashToolDescription = ToolUIPart<Pick<ReviewTools, 'bash'>>;
type ReadFileToolDescription = ToolUIPart<Pick<ReviewTools, 'readFile'>>;
type WriteFileToolDescription = ToolUIPart<Pick<ReviewTools, 'writeFile'>>;

interface ShowDiffToolProps {
  description: ShowDiffToolDescription;
}

interface BashToolProps {
  description: BashToolDescription;
}

interface ReadFileToolProps {
  description: ReadFileToolDescription;
}

interface WriteFileToolProps {
  description: WriteFileToolDescription;
}

function ShowDiffTool(props: ShowDiffToolProps) {
  return (
    <div className="min-w-0 w-full mb-4 flex flex-col gap-1">
      <Tool className="mb-0">
        <CollapsibleTrigger className="cursor-pointer flex w-full items-center gap-4 p-3">
          <div className="flex items-center gap-2">
            <FileCode className="size-4 text-muted-foreground shrink-0" />
            <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 shrink-0" />
          </div>
        </CollapsibleTrigger>
        <ToolContent>
          <ToolInput input={props.description.input} />
          <ToolOutput output={props.description.output} errorText={props.description.errorText} />
        </ToolContent>
      </Tool>
    </div>
  );
}

function BashTool(props: BashToolProps) {
  return (
    <div className="min-w-0 w-full mb-4 flex flex-col gap-1">
      <Tool className="mb-0">
        <CollapsibleTrigger className="cursor-pointer flex w-full items-center gap-4 p-3">
          <div className="flex items-center gap-2">
            <SquareTerminal className="size-4 text-muted-foreground shrink-0" />
            <p className="text-sm font-mono">{props.description.input?.command ?? '-no input-'}</p>
            <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 shrink-0" />
          </div>
        </CollapsibleTrigger>
        <div className="px-4 pb-2 text-muted-foreground max-h-60 overflow-y-auto scrollbar-muted flex flex-col-reverse">
          <p className="text-sm font-mono whitespace-pre-wrap">
            {props.description.output?.stdout || '-no output-'}
          </p>
        </div>
        <ToolContent>
          <ToolInput input={props.description.input} />
          <ToolOutput output={props.description.output} errorText={props.description.errorText} />
        </ToolContent>
      </Tool>
    </div>
  );
}

function ReadFileTool(props: ReadFileToolProps) {
  return (
    <div className="min-w-0 w-full mb-4 flex flex-col gap-1">
      <Tool className="mb-0">
        <CollapsibleTrigger className="cursor-pointer flex w-full items-center gap-4 p-3">
          <div className="flex items-center gap-2">
            <File className="size-4 text-muted-foreground shrink-0" />
            <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 shrink-0" />
          </div>
        </CollapsibleTrigger>
        <ToolContent>
          <ToolInput input={props.description.input} />
          <ToolOutput output={props.description.output} errorText={props.description.errorText} />
        </ToolContent>
      </Tool>
    </div>
  );
}

function WriteFileTool(props: WriteFileToolProps) {
  return (
    <div className="min-w-0 w-full mb-4 flex flex-col gap-1">
      <Tool className="mb-0">
        <CollapsibleTrigger className="cursor-pointer flex w-full items-center gap-4 p-3">
          <div className="flex items-center gap-2">
            <SquarePen className="size-4 text-muted-foreground shrink-0" />
            <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 shrink-0" />
          </div>
        </CollapsibleTrigger>
        <ToolContent>
          <ToolInput input={props.description.input} />
          <ToolOutput output={props.description.output} errorText={props.description.errorText} />
        </ToolContent>
      </Tool>
    </div>
  );
}
