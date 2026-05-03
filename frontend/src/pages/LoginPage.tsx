import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { AuthCard, Button, Field, Input } from '../components/ui';

const Schema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(6, 'Parola trebuie să aibă cel puțin 6 caractere'),
});
type FormValues = z.infer<typeof Schema>;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const Footer = styled.p`
  margin-top: ${({ theme }) => theme.spacing(4)};
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`;

const ErrorBanner = styled.div`
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(4)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.dangerSoft};
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.875rem;
  font-weight: 500;
`;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    const parsed = Schema.safeParse(values);
    if (!parsed.success) return;
    setSubmitError(null);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      setSubmitError(error.message);
      return;
    }
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';
    navigate(redirectTo, { replace: true });
  }

  return (
    <AuthCard title="Autentificare" subtitle="Bine ai revenit la Charging Station Oradea.">
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Parolă" error={errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...register('password')} />
        </Field>
        {submitError && <ErrorBanner>{submitError}</ErrorBanner>}
        <Button type="submit" $full disabled={isSubmitting}>
          {isSubmitting ? 'Se autentifică…' : 'Autentificare'}
        </Button>
      </Form>
      <Footer>
        Nu ai cont? <Link to="/register">Înregistrează-te</Link>
      </Footer>
    </AuthCard>
  );
}
