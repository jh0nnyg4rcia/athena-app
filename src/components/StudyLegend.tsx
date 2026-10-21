import { BookOpen, Scale, Gavel, ListChecks, RotateCcw } from 'lucide-react';

export function StudyLegend() {
  return (
    <ul className="athena-study-legend" aria-label="Eixos de estudo">
      <li data-study-category="law"><Scale aria-hidden="true" size={20} /><span>Lei</span></li>
      <li data-study-category="doctrine"><BookOpen aria-hidden="true" size={20} /><span>Doutrina</span></li>
      <li data-study-category="case-law"><Gavel aria-hidden="true" size={20} /><span>Jurisprudência</span></li>
      <li data-study-category="questions"><ListChecks aria-hidden="true" size={20} /><span>Questões</span></li>
      <li data-study-category="review"><RotateCcw aria-hidden="true" size={20} /><span>Revisão</span></li>
    </ul>
  );
}
