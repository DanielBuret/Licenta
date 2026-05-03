import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { useCarModels } from '../hooks/useCarModels';
import { AuthCard, Button, Field, Input, Select } from '../components/ui';

const Schema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(6, 'Parola trebuie să aibă cel puțin 6 caractere'),
  fullName: z.string().min(2, 'Numele complet este obligatoriu'),
  carModelId: z.coerce.number().int().positive('Selectează un model de mașină'),
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

export function RegisterPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: cars, isLoading: carsLoading } = useCarModels();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    const parsed = Schema.safeParse(values);
    if (!parsed.success) return;
    setSubmitError(null);

    const signup = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { full_name: parsed.data.fullName } },
    });
    if (signup.error) {
      setSubmitError(signup.error.message);
      return;
    }

    // Wait briefly for the auth.users trigger to create the profile row.
    // The PATCH may race with the trigger: the JWT is issued before the
    // profile row exists in some cases. If we get a 403 ("Profile not
    // found"), retry once after 500ms.
    const body = { fullName: parsed.data.fullName, carModelId: parsed.data.carModelId };
    async function patchProfileWithRetry() {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await api.patch('/api/profile', body);
          return;
        } catch (e: any) {
          const status = e?.response?.status;
          if (status === 403 && attempt === 0) {
            await new Promise((r) => setTimeout(r, 500));
            continue;
          }
          throw e;
        }
      }
    }

    try {
      await patchProfileWithRetry();
    } catch (e) {
      setSubmitError(
        'Cont creat, dar nu am putut salva mașina. Te poți autentifica și actualiza din dashboard.',
      );
      return;
    }

    navigate('/', { replace: true });
  }

  return (
    <AuthCard title="Creare cont" subtitle="Completează datele pentru a începe să rezervi stații.">
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Field label="Nume complet" error={errors.fullName?.message}>
          <Input type="text" autoComplete="name" {...register('fullName')} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Parolă" error={errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...register('password')} />
        </Field>
        <Field label="Modelul mașinii" error={errors.carModelId?.message}>
          <Select disabled={carsLoading} {...register('carModelId')}>
            <option value="">— Selectează —</option>
            {cars?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.brand} {c.model} ({c.batteryCapacityKwh} kWh)
              </option>
            ))}
          </Select>
        </Field>
        {submitError && <ErrorBanner>{submitError}</ErrorBanner>}
        <Button type="submit" $full disabled={isSubmitting || carsLoading}>
          {isSubmitting ? 'Se creează contul…' : 'Creare cont'}
        </Button>
      </Form>
      <Footer>
        Ai deja cont? <Link to="/login">Autentificare</Link>
      </Footer>
    </AuthCard>
  );
}
