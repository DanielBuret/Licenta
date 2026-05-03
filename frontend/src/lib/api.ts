import axios from 'axios';
import { supabase } from './supabase';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export const api = axios.create({ baseURL });

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});
