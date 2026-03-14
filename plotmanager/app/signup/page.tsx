'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus, MapPin, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { signupSchema, type SignupFormData } from '@/lib/validations'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setAuthError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            role: 'super_admin',
          },
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setAuthError('An account with this email already exists. Please sign in instead.')
        } else {
          setAuthError(error.message)
        }
        return
      }

      router.push('/onboarding')
      router.refresh()
    } catch {
      setAuthError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="w-full max-w-md space-y-8 animate-slide-up">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <MapPin className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold text-gray-900 tracking-tight">
              Create Account
            </h1>
            <p className="mt-2 text-gray-600">
              Sign up to get started
            </p>
          </div>
        </div>

        {authError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {authError}
            </p>
          </div>
        )}

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create your account</CardTitle>
            <CardDescription className="text-center">
              Enter your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                error={errors.full_name?.message}
                {...register('full_name')}
                autoComplete="name"
                autoFocus
              />
              <Input
                label="Email address"
                type="email"
                placeholder="you@company.com"
                error={errors.email?.message}
                {...register('email')}
                autoComplete="email"
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  error={errors.password?.message}
                  {...register('password')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
                autoComplete="new-password"
              />
              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                <UserPlus className="w-5 h-5 mr-2" />
                Create Account
              </Button>
              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
