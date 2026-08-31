import { useEffect, useState } from 'react';
import { Check, Languages, Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Locale = 'de' | 'en' | 'fr';
type Theme = 'dark' | 'light';

const locales: Array<{ label: string; value: Locale }> = [
  { label: 'English', value: 'en' },
  { label: 'Deutsch', value: 'de' },
  { label: 'Français', value: 'fr' },
];

const labels = {
  de: { language: 'Sprache', theme: 'Farbschema wechseln' },
  en: { language: 'Language', theme: 'Change color theme' },
  fr: { language: 'Langue', theme: 'Changer le thème' },
} satisfies Record<Locale, { language: string; theme: string }>;

interface DisplayControlsProps {
  initialLocale: Locale;
}

function isLocale(value: string | null): value is Locale {
  return value === 'de' || value === 'en' || value === 'fr';
}

function updateLocaleAwareLinks(locale: Locale) {
  document
    .querySelectorAll<HTMLAnchorElement>('[data-locale-aware]')
    .forEach((link) => {
      const url = new URL(link.href);
      url.searchParams.set('lang', locale);
      link.href = url.toString();
    });
}

export function DisplayControls({ initialLocale }: DisplayControlsProps) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === 'undefined') return initialLocale;
    const urlLocale = new URL(window.location.href).searchParams.get('lang');
    const storedLocale = window.localStorage.getItem('rundecoded-locale');
    return isLocale(urlLocale)
      ? urlLocale
      : isLocale(storedLocale)
        ? storedLocale
        : initialLocale;
  });
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== 'undefined' &&
    document.documentElement.dataset.theme === 'dark'
      ? 'dark'
      : 'light',
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    updateLocaleAwareLinks(locale);
  }, [locale]);

  function changeLocale(nextLocale: string) {
    if (!isLocale(nextLocale)) return;

    setLocale(nextLocale);
    window.localStorage.setItem('rundecoded-locale', nextLocale);
    document.documentElement.lang = nextLocale;
    const url = new URL(window.location.href);
    url.searchParams.set('lang', nextLocale);
    window.history.replaceState({}, '', url);
    updateLocaleAwareLinks(nextLocale);
  }

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem('rundecoded-theme', nextTheme);
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="flex items-center gap-0.5"
        aria-label="Display preferences"
      >
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={`${labels[locale].language}: ${locale.toUpperCase()}`}
                  className="gap-1.5 px-2"
                  size="sm"
                  variant="ghost"
                >
                  <Languages aria-hidden="true" className="size-4" />
                  <span className="text-[0.7rem] font-bold tracking-wide">
                    {locale.toUpperCase()}
                  </span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>{labels[locale].language}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>{labels[locale].language}</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={locale} onValueChange={changeLocale}>
              {locales.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                  {locale === option.value ? (
                    <Check
                      aria-hidden="true"
                      className="ml-auto size-3.5 opacity-0"
                    />
                  ) : null}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={labels[locale].theme}
              onClick={toggleTheme}
              size="icon"
              variant="ghost"
            >
              {theme === 'dark' ? (
                <Sun aria-hidden="true" className="size-4" />
              ) : (
                <Moon aria-hidden="true" className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{labels[locale].theme}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
