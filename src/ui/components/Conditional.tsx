import type { JSX } from 'react';

interface ConditionalProps {
  condition: boolean;
  children: React.ReactNode;
}
export default function Conditional(props: ConditionalProps): JSX.Element | null {
  if (!props.condition) return null;
  return <>{props.children}</>;
}
