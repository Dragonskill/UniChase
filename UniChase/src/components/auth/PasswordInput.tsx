import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

type PasswordInputProps = InputHTMLAttributes<HTMLInputElement> & {
  containerClassName?: string
}

export default function PasswordInput({ className, containerClassName, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye

  return (
    <div className={cn('relative', containerClassName)}>
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn(className, 'pr-10')}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-teal transition-colors"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
