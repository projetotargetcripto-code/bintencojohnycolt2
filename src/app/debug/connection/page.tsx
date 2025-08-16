'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/dataClient'

export default function DebugConnection() {
  const [msg, setMsg] = useState('Carregando…')

  useEffect(() => {
    (async () => {
      try {
        const { error } = await supabase.from('empreendimentos').select('id').limit(1)
        setMsg(error ? `Conectado, mas erro de consulta: ${error.message}` : 'Conectado — consulta OK.')
      } catch (e: any) {
        setMsg(`Erro de conexão: ${e?.message || 'Erro desconhecido'}`)
      }
    })()
  }, [])

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white p-6">
      <h1 className="text-2xl font-semibold mb-2">Debug de Conexão</h1>
      <div className="rounded-xl border border-[#1E2A24] p-4">
        <pre className="text-xs text-[#D1D5DB] whitespace-pre-wrap">{msg}</pre>
      </div>
    </div>
  )
}