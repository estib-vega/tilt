import { ArrowUp, House, MessageSquareText } from "lucide-react";

export type IconName = "arrow-up" | "chat" | "home";

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
}

const Icon = (props: IconProps): JSX.Element => {
  const { name, ...rest } = props;

  switch (name) {
    case "arrow-up":
      return <ArrowUp {...rest} />;
    case "chat":
      return <MessageSquareText {...rest} />;
    case "home":
      return <House {...rest} />;
  }
};

Icon.displayName = "Icon";

export default Icon;
