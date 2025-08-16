import { PropsWithChildren } from "react";
import { Link } from "react-router-dom";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 hero-radial pointer-events-none" aria-hidden />
      <div className="absolute inset-0 pattern-dots opacity-[0.06]" aria-hidden />

      <header className="relative z-10 border-b border-border/60">
        <div className="container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight text-xl gradient-text" aria-label="Voltar à página inicial">
            <img src="/lovable-uploads/69c3ca3e-8a72-4b83-8f97-2ffdd18f9508.png" alt="Símbolo BlockURB" className="h-7 w-7 rounded-sm" loading="lazy" decoding="async" />
            <span>BlockURB</span>
          </Link>
          <Link to="/" className="story-link text-sm text-muted-foreground hover:text-foreground transition-colors">Voltar ao site</Link>
        </div>
      </header>

      <main className="relative z-10">
        <div className="container py-10 sm:py-16">
          <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-card/80 shadow-lg p-6 sm:p-8 animate-enter">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
