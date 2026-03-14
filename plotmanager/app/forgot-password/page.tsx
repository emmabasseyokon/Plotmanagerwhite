'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [email, setEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setEmail(data.email)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })

      if (error) {
        alert(error.message)
      } else {
        setEmailSent(true)
      }
    } catch (error: any) {
      alert(error?.message || 'An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
        <Card className="w-full max-w-md animate-scale-in">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary-600" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription className="text-base">
              We&apos;ve sent a password reset link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                Click the link in your email to reset your password. The link will expire in 1 hour.
              </p>
            </div>
            <Link href="/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="w-full max-w-md space-y-8 animate-slide-up">
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Reset your password</CardTitle>
            <CardDescription className="text-center">
              Enter your email and we&apos;ll send you a reset link
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
              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Send reset link
              </Button>
              <Link href="/login" className="block">
                <Button variant="ghost" className="w-full" type="button">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Button>
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
