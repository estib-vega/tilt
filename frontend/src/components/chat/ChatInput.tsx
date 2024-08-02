import React from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import Icon from "../icon/Icon";

interface ChatInputProps {
  onEnterInput: (value: string) => void;
  disabled: boolean;
}

const ChatInput = (props: ChatInputProps): JSX.Element => {
  const [value, setValue] = React.useState<string | undefined>(undefined);

  const handleClick = () => {
    if (value) {
      props.onEnterInput(value);
      setValue("");
    }
  };

  return (
    <div className="flex gap-2 my-2 border rounded-md">
      <div className="w-full">
        <Textarea
          placeholder="Type a message..."
          className="w-full text-base min-h-20 resize-none border-none"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <div className="pt-2 pr-2 flex-shrink-0">
        <Button
          disabled={props.disabled}
          onClick={handleClick}
          size="icon"
          className="bg-primary"
        >
          <Icon name="arrow-up" />
        </Button>
      </div>
    </div>
  );
};

ChatInput.displayName = "ChatInput";

export default ChatInput;
