import { useEffect, useState } from 'react';
import { Check, Languages, Moon, Sun } from 'lucide-react';
import { navigate } from 'astro:transitions/client';

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
import { isLocale, type Locale } from '@/i18n/config';
import { switchLocaleUrl } from '@/lib/routes';
import { preserveScrollOnNextAstroNavigation } from '@/lib/scroll-restoration';

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

export function DisplayControls({ initialLocale }: DisplayControlsProps) {
  const locale = initialLocale;
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== 'undefined' &&
    document.documentElement.dataset.theme === 'dark'
      ? 'dark'
      : 'light',
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function changeLocale(nextLocale: string) {
    if (!isLocale(nextLocale)) return;

    preserveScrollOnNextAstroNavigation();
    window.localStorage.setItem('rundecoded-locale', nextLocale);
    document.documentElement.lang = nextLocale;
    window.dispatchEvent(
      new CustomEvent('rundecoded:locale-change', {
        detail: { locale: nextLocale },
      }),
    );
    const nextUrl = switchLocaleUrl(new URL(window.location.href), nextLocale);
    void navigate(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`, {
      history: 'push',
    });
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
