import { toast } from "sonner";

interface RequestMessages {
  success?: string;
  error?: string;
}

export async function supabaseRequest<T>(
  action: () => Promise<{ data: T | null; error: any }>,
  messages: RequestMessages = {}
): Promise<T | null> {
  try {
    const { data, error } = await action();
    if (error) {
      console.error(error);
      toast.error(messages.error ? `${messages.error}: ${error.message}` : error.message);
      return null;
    }
    if (messages.success) toast.success(messages.success);
    return data;
  } catch (err) {
    console.error(err);
    toast.error(messages.error || "Erro inesperado");
    return null;
  }
}
