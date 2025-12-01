import type { ToolUIPart } from 'ai';
import type { JSX } from 'react';
import type { Tools } from '@api/ai/tools';
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from './ai-elements/tool';

interface ChatToolProps {
  toolPart: ToolUIPart<Tools>;
}

export default function ChatTool(props: ChatToolProps): JSX.Element {
  switch (props.toolPart.type) {
    case 'tool-searchWeb':
      return (
        <Tool>
          <ToolHeader type={props.toolPart.type} state={props.toolPart.state} />
          <ToolContent>
            <ToolInput input={props.toolPart.input} />
            <ToolOutput output={props.toolPart.output} errorText={props.toolPart.errorText} />
          </ToolContent>
        </Tool>
      );
    default:
      return <div>Unknown Tool</div>;
  }
}
