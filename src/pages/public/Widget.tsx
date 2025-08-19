import { Widget } from '@/components/public/Widget';
import { useSearchParams } from 'react-router-dom';

export default function PublicWidgetPage() {
  const [params] = useSearchParams();
  const empreendimentoId = params.get('empreendimentoId');

  if (!empreendimentoId) {
    return <p>Empreendimento não especificado</p>;
  }

  return <Widget empreendimentoId={empreendimentoId} />;
}
