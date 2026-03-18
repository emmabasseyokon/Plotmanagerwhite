'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LogIn, MapPin, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorCode = params.get('error')
    if (errorCode) {
      const safeMessages: Record<string, string> = {
        invalid_credentials: 'Invalid email or password. Please try again.',
        email_not_confirmed: 'Your email has not been confirmed. Please contact your administrator.',
        session_expired: 'Your session has expired. Please sign in again.',
        access_denied: 'Access denied. Please contact your administrator.',
      }
      setAuthError(safeMessages[errorCode] || 'An authentication error occurred. Please try again.')
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setAuthError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setAuthError('Invalid email or password. Please try again.')
        } else if (error.message.includes('Email not confirmed')) {
          setAuthError('Your email has not been confirmed. Please contact your administrator.')
        } else {
          setAuthError(error.message)
        }
      } else {
        // Full reload so the proxy picks up the new auth cookies
        window.location.href = '/dashboard'
        return
      }
    } catch (error: any) {
      setAuthError(error?.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="w-full max-w-md space-y-8 animate-slide-up">
        <div className="text-center space-y-4">
          <Link href="/" className="inline-block">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <MapPin className="w-10 h-10 text-white" />
            </div>
          </Link>
          <div>
            <h1 className="font-display text-4xl font-bold text-gray-900 tracking-tight">
              {process.env.NEXT_PUBLIC_APP_NAME || 'PlotManager'}
            </h1>
            <p className="mt-2 text-gray-600">
              Land buyers management made simple
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
            <CardTitle className="text-2xl text-center">Sign in to continue</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Email address"
                type="email"
                placeholder="you@company.com"
                error={errors.email?.message}
                {...register('email')}
                autoComplete="email"
                autoFocus
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  error={errors.password?.message}
                  {...register('password')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                <LogIn className="w-5 h-5 mr-2" />
                Sign in
              </Button>

              <p className="text-center text-sm text-gray-500">
                Contact your administrator for access.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
