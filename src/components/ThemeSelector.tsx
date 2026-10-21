import { useEffect, useId, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
function useReadingPreferences() {
  const read = () => ({ theme: document.documentElement.dataset.theme || 'dark', preference: document.documentElement.dataset.themePreference || 'dark', size: Number(document.documentElement.dataset.readingSize || 0) });
  const [state, setState] = useState(read);
  useEffect(() => {
    const sync = () => setState(read());
    window.addEventListener('athena-theme-applied', sync);
    window.addEventListener('athena-reading-size-applied', sync);
    return () => { window.removeEventListener('athena-theme-applied', sync); window.removeEventListener('athena-reading-size-applied', sync); };
  }, []);
  return state;
}
const changeTheme = (value: string) => window.dispatchEvent(new CustomEvent('athena-theme-change', { detail: value }));
const changeSize = (value: number) => window.dispatchEvent(new CustomEvent('athena-reading-size-change', { detail: value }));
export function ThemeSelector() {
  const { theme, size } = useReadingPreferences();
  const label = theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro';
  return (
    <div className="athena-reading-toolbar" role="group" aria-label="Aparência e tamanho da leitura">
      <button type="button" aria-label={label} title={label} onClick={() => changeTheme(theme === 'dark' ? 'light' : 'dark')}>
        {theme === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
      </button>
      <button type="button" aria-label="A− Diminuir fonte da leitura" title="Diminuir fonte da leitura" disabled={size === 0} onClick={() => changeSize(size - 1)}>A−</button>
      <button type="button" aria-label="A+ Aumentar fonte da leitura" title="Aumentar fonte da leitura" disabled={size === 4} onClick={() => changeSize(size + 1)}>A+</button>
      <span className="sr-only" role="status" aria-live="polite">Fonte da leitura: {100 + size * 12.5}%</span>
    </div>
  );
}
export function ReadingSettings() {
  const id = useId();
  const { preference, size } = useReadingPreferences();
  return (
    <fieldset className="athena-reading-settings">
      <legend>Configurações de leitura</legend>
      <label htmlFor={id}>Tema de aparência</label>
      <select id={id} value={preference} onChange={event => changeTheme(event.target.value)}>
        <option value="light">Claro</option><option value="dark">Escuro</option><option value="system">Sistema</option>
      </select>
      <button type="button" onClick={() => changeSize(0)} disabled={size === 0}>Restaurar fonte padrão</button>
    </fieldset>
  );
}
