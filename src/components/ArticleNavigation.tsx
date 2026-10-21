import { ChevronRight } from 'lucide-react';
import { useId } from 'react';

export function ArticleNavigation({ subject, current, total, progress, value, onChange, onNavigate }: {
  subject: string; current: number; total: number; progress: number; value: string;
  onChange: (value: string) => void; onNavigate: (article: number) => void;
}) {
  const id = useId();
  const navigate = () => {
    const article = Number(value);
    if (Number.isInteger(article) && article >= 1 && article <= total) onNavigate(article);
  };
  return (
    <section className="athena-article-navigation" aria-label="Navegação de artigos">
      <p>{subject} · Art. {current} de {total}</p>
      <label htmlFor={id}>Ir para o artigo</label>
      <div className="flex gap-2">
        <input id={id} type="number" inputMode="numeric" min={1} max={total} value={value}
          onChange={event => onChange(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') navigate(); }} />
        <button type="button" onClick={navigate} aria-label="Ir para o artigo informado"><ChevronRight size={18} aria-hidden="true" /></button>
      </div>
      <label htmlFor={`${id}-progress`}>Progresso: {Math.round(progress)}%</label>
      <progress id={`${id}-progress`} value={Math.max(0, Math.min(100, progress))} max={100} />
    </section>
  );
}
