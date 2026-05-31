import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import PasswordInput from '@/components/auth/PasswordInput'
import GlowLetters from '@/components/ui/GlowLetters'
import { getAuthErrorMessage, registerStudentAccount } from '@/lib/authSession'
import { setStoredUser, setToken } from '@/lib/storage'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignUp() {
  const navigate = useNavigate()
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) })

  const onSubmit = async (data: SignupForm) => {
    setFormError('')

    try {
      const response = await registerStudentAccount({
        name: data.name,
        email: data.email,
        password: data.password,
      })
      setToken(response.token)
      setStoredUser(response.user)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setFormError(getAuthErrorMessage(error))
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="bg-surface p-8 rounded-2xl shadow-sm w-full max-w-md"
      >
        <GlowLetters as="h1" text="Create account" variant="title" className="text-2xl font-bold text-navy mb-1" />
        <p className="text-muted mb-6">Join UniChase today</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-ink">Full name</label>
            <input
              {...register('name')}
              type="text"
              autoComplete="name"
              placeholder="Your name"
              className="mt-1 w-full bg-cream border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-ink">Email</label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-1 w-full bg-cream border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-ink">Password</label>
            <PasswordInput
              {...register('password')}
              autoComplete="new-password"
              placeholder="Password"
              containerClassName="mt-1"
              className="w-full bg-cream border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-ink">Confirm password</label>
            <PasswordInput
              {...register('confirmPassword')}
              autoComplete="new-password"
              placeholder="Password"
              containerClassName="mt-1"
              className="w-full bg-cream border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          {formError && <p className="text-red-500 text-sm" role="alert">{formError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-navy hover:bg-navy-light text-white py-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isSubmitting ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="text-sm text-center text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-teal hover:underline">Login</Link>
        </p>
      </motion.div>
    </div>
  )
}
