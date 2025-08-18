import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isDev = import.meta.env.DEV
const isTest = import.meta.env.MODE === 'test'

function assertEnv(value: string | undefined, name: string) {
  if (!value) {
    const msg = `❌ ${name} não definida: adicione-a ao arquivo .env.local na raiz do projeto ou configure a variável de ambiente em produção.`
    if (isDev && !isTest) {
      throw new Error(msg)
    } else {
      console.warn(msg)
    }
  }
}

assertEnv(supabaseUrl, 'VITE_SUPABASE_URL')
assertEnv(supabaseAnonKey, 'VITE_SUPABASE_ANON_KEY')

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : (new Proxy(
        {},
        {
          get() {
            throw new Error(
              'Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local ou como variáveis de produção.'
            )
          },
        }
      ) as ReturnType<typeof createClient>)
