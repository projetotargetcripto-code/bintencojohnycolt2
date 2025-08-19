const env = import.meta.env as Record<string, string | undefined>;

export const publicWidgetEnabled = env.VITE_PUBLIC_WIDGET === 'true';
