import { ArrowUp } from "lucide-react";

export type IconName = "arrow-up";

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
  }
};

Icon.displayName = "Icon";

export default Icon;
