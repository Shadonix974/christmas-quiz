import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered'
}

export function Card({
  className,
  variant = 'default',
  children,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-white',
    elevated: 'bg-white shadow-xl',
    bordered: 'bg-white border-2 border-gray-200',
  }

  return (
    <div
      className={cn(
        'rounded-2xl p-6',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-2xl font-bold text-gray-900', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}
