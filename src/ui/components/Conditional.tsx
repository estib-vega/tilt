interface ConditionalProps {
  condition: boolean;
  className?: string;
  children: React.ReactNode;
}
export default function Conditional(props: ConditionalProps): React.ReactNode | null {
  if (!props.condition) return null;
  return props.children;
}
