import React from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

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
    <div className="flex gap-2 my-2">
      <Textarea
        placeholder="Type a message..."
        className="w-full resize-none"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button disabled={props.disabled} onClick={handleClick} className="bg-primary">
        Send
      </Button>
    </div>
  );
};

ChatInput.displayName = "ChatInput";

export default ChatInput;
