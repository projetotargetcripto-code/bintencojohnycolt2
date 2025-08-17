import { createContext, useContext, useState, type ReactNode } from 'react';

interface SelectedEmpreendimentoContextType {
  selectedEmpreendimento: string | null;
  setSelectedEmpreendimento: (id: string | null) => void;
}

const SelectedEmpreendimentoContext = createContext<SelectedEmpreendimentoContextType | undefined>(undefined);

export function SelectedEmpreendimentoProvider({ children }: { children: ReactNode }) {
  const [selectedEmpreendimento, setSelectedEmpreendimentoState] = useState<string | null>(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('selectedEmpreendimento') : null;
  });

  function setSelectedEmpreendimento(id: string | null) {
    setSelectedEmpreendimentoState(id);
    if (typeof localStorage === 'undefined') return;
    if (id) localStorage.setItem('selectedEmpreendimento', id);
    else localStorage.removeItem('selectedEmpreendimento');
  }

  return (
    <SelectedEmpreendimentoContext.Provider value={{ selectedEmpreendimento, setSelectedEmpreendimento }}>
      {children}
    </SelectedEmpreendimentoContext.Provider>
  );
}

export function useSelectedEmpreendimento() {
  const context = useContext(SelectedEmpreendimentoContext);
  if (!context) throw new Error('useSelectedEmpreendimento must be used within SelectedEmpreendimentoProvider');
  return context;
}
