import { useEffect, useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/dataClient';
import { getSignatureProvider } from '@/lib/signatureProvider';

interface Assinatura {
  id: string;
  status: string;
}

export default function AssinaturasPage() {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [sending, setSending] = useState(false);

  async function load() {
    const { data } = await supabase
      .from('assinaturas')
      .select('id, status')
      .order('created_at', { ascending: false });
    setAssinaturas((data as Assinatura[]) || []);
  }

  useEffect(() => {
    document.title = 'Assinaturas | BlockURB';
    load();
  }, []);

  async function handleEnviar() {
    setSending(true);
    try {
      const provider = getSignatureProvider();
      const { id } = await provider.requestSignature({
        documentUrl: 'https://example.com/document.pdf',
        callbackUrl: `${window.location.origin}/functions/v1/signature-callback`,
        signerName: 'Fulano de Tal',
        signerEmail: 'fulano@example.com',
      });
      await supabase.from('assinaturas').insert({ id, status: 'pending' });
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell
      menuKey="adminfilial"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin' }, { label: 'Assinaturas' }]}
    >
      <div className="space-y-4">
        <Button onClick={handleEnviar} disabled={sending}>
          {sending ? 'Enviando...' : 'Enviar para assinatura'}
        </Button>
        <ul className="space-y-2">
          {assinaturas.map((a) => (
            <li key={a.id} className="border rounded p-2">
              <div>ID: {a.id}</div>
              <div>Status: {a.status}</div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
