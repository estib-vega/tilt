import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/chat")({
  component: Chat,
});

enum ChatMessageAuthor {
  User = "user",
  Bot = "bot",
}

interface ChatMessageInfo {
  author: ChatMessageAuthor;
  content: string;
}

const fakeMessages: ChatMessageInfo[] = [
  {
    author: ChatMessageAuthor.User,
    content: "Hello, how are you?",
  },
  {
    author: ChatMessageAuthor.Bot,
    content: "I'm good, thanks for asking!",
  },
  {
    author: ChatMessageAuthor.User,
    content: "What's the weather like today?",
  },
  {
    author: ChatMessageAuthor.Bot,
    content: "It's sunny and warm!",
  },
  {
    author: ChatMessageAuthor.User,
    content: "That sounds great!",
  },
  {
    author: ChatMessageAuthor.Bot,
    content: "Yes, it's a perfect day to go outside.",
  },
  {
    author: ChatMessageAuthor.User,
    content: "Do you have any plans for the weekend?",
  },
  {
    author: ChatMessageAuthor.Bot,
    content: "I'm planning to relax and catch up on some reading.",
  },
  {
    author: ChatMessageAuthor.User,
    content: "Sounds like a good plan!",
  },
  {
    author: ChatMessageAuthor.Bot,
    content: "Thank you! Enjoy your day!",
  },
];

const ChatMessage = (props: ChatMessageInfo): JSX.Element => {
  const isUser = props.author === ChatMessageAuthor.User;
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`p-2 rounded-md ${isUser ? "bg-primary-foreground" : "bg-secondary"}`}
      >
        {props.content}
      </div>
    </div>
  );
};

const ChatContent = (): JSX.Element => {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4">
        {fakeMessages.map((m, i) => (
          <ChatMessage {...m} key={i} />
        ))}
      </div>
    </ScrollArea>
  );
};

const ChatInput = (): JSX.Element => {
  return (
    <div className="flex gap-2 my-2">
      <Textarea
        placeholder="Type a message..."
        className="w-full resize-none"
      />
      <Button className="bg-primary">Send</Button>
    </div>
  );
};

function Chat() {
  return (
    <div className="h-full flex flex-col flex-grow-0 overflow-hidden">
      <div className="container flex-grow overflow-hidden">
        <ChatContent />
      </div>
      <div className="container flex-shrink-0">
        <ChatInput />
      </div>
    </div>
  );
}
