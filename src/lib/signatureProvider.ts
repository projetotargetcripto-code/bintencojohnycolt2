
export interface SignatureRequest {
  documentUrl: string;
  callbackUrl: string;
  signerName: string;
  signerEmail: string;
}

export type SignatureStatus = 'pending' | 'signed' | 'rejected' | 'error';

export interface SignatureProvider {
  requestSignature(req: SignatureRequest): Promise<{ id: string }>;
  getStatus(id: string): Promise<SignatureStatus>;
}

function assertEnv(value: string | undefined, name: string) {
  if (!value) {
    const msg = `Missing environment variable: ${name}`;
    if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
      throw new Error(msg);
    } else {
      console.warn(msg);
    }
  }
}

export function getSignatureProvider(): SignatureProvider {
  const baseUrl = import.meta.env.VITE_SIGNATURE_PROVIDER_URL;
  const apiKey = import.meta.env.VITE_SIGNATURE_PROVIDER_KEY;

  assertEnv(baseUrl, 'VITE_SIGNATURE_PROVIDER_URL');
  assertEnv(apiKey, 'VITE_SIGNATURE_PROVIDER_KEY');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  return {
    async requestSignature(req) {
      const res = await fetch(`${baseUrl}/signatures`, {
        method: 'POST',
        headers,
        body: JSON.stringify(req),
      });
      if (!res.ok) {
        throw new Error('Failed to create signature');
      }
      const data = await res.json();
      return { id: data.id };
    },
    async getStatus(id) {
      const res = await fetch(`${baseUrl}/signatures/${id}`, { headers });
      if (!res.ok) {
        throw new Error('Failed to get signature status');
      }
      const data = await res.json();
      return data.status as SignatureStatus;
    },
  };
}
