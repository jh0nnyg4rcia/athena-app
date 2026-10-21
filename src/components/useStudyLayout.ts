import { useEffect, useRef, useState } from 'react';

export function useStudyLayout(open: boolean, close: (open: boolean) => void) {
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const sidebarRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const resize = () => {
      setDesktop(media.matches);
      const viewport = window.visualViewport;
      // Let the browser manage pinch zoom; only adapt to keyboard/browser chrome.
      if (!viewport || viewport.scale === 1) {
        document.documentElement.style.setProperty('--athena-viewport-height', `${viewport?.height ?? window.innerHeight}px`);
      }
      const header = headerRef.current?.getBoundingClientRect();
      const main = mainRef.current?.getBoundingClientRect();
      if (header && main) {
        const visibleTop = viewport && viewport.scale === 1 ? viewport.offsetTop : 0;
        const start = Math.max(main.top, header.bottom, visibleTop);
        const bottom = viewport && viewport.scale === 1 ? viewport.offsetTop + viewport.height : window.innerHeight;
        const root = document.documentElement;
        root.style.setProperty('--athena-header-height', `${header.height}px`);
        root.style.setProperty('--athena-reading-start-offset', `${Math.max(0, start - main.top)}px`);
        root.style.setProperty('--athena-reading-available-height', `${Math.max(0, Math.min(main.bottom, bottom) - start)}px`);
      }
    };
    resize();
    media.addEventListener('change', resize);
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('scroll', resize);
    const observer = new ResizeObserver(resize);
    if (headerRef.current) observer.observe(headerRef.current);
    if (mainRef.current) observer.observe(mainRef.current);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', resize);
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('scroll', resize);
    };
  }, []);
  useEffect(() => {
    if (!open || desktop) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select, [tabindex="0"]') || [])
      .filter(element => element.getClientRects().length > 0);
    focusables()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(false); }
      if (event.key !== 'Tab') return;
      const elements = focusables();
      const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [open, desktop, close]);
  return { desktop, sidebarRef, headerRef, mainRef };
}
