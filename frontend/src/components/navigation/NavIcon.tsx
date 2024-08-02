import Icon, { IconName } from "../icon/Icon";

interface NavIconProps {
  name: IconName;
}

const NavIcon = (props: NavIconProps): JSX.Element => {
  const { name } = props;

  return (
    <div className="p-1 group-[.active]:bg-primary group-[.active]:text-primary-foreground rounded-md">
      <Icon name={name} size={16} />
    </div>
  );
};

NavIcon.displayName = "NavIcon";

export default NavIcon;
