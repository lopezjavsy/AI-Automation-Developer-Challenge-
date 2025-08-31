import { createClient } from "@supabase/supabase-js";

// Lee las variables desde .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Exporta una instancia única del cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
