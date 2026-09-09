import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type TextProps = HTMLAttributes<HTMLParagraphElement> & {
  as?: 'p' | 'span';
  tone?: 'primary' | 'secondary' | 'tertiary';
  /** Type roles: default 14/24, body 16/28, label 12/16, caption 11/16 at the default root size. */
  size?: 'default' | 'body' | 'label' | 'caption';
};

const toneClass = {
  primary: 'text-text-primary',
  secondary: 'text-text-secondary',
  tertiary: 'text-text-tertiary',
} as const;

const sizeClass = {
  default: 'text-sm leading-6',
  body: 'text-base leading-7',
  label: 'text-xs',
  caption: 'text-caption',
} as const;

export function Text({
  as: Comp = 'p',
  tone = 'primary',
  size = 'default',
  className,
  ...props
}: TextProps) {
  return <Comp className={cn(sizeClass[size], toneClass[tone], className)} {...props} />;
}
