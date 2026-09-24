import { useEffect, useState } from 'react';
import { Check, Languages, Moon, Settings, Sun } from 'lucide-react';
import { navigate } from 'astro:transitions/client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { isLocale, type Locale } from '@/i18n/config';
import { localizedRoute, switchLocaleUrl } from '@/lib/routes';
import { preserveScrollOnNextAstroNavigation } from '@/lib/scroll-restoration';

type Theme = 'dark' | 'light';

const locales: Array<{ label: string; value: Locale }> = [
  { label: 'English', value: 'en' },
  { label: 'Deutsch', value: 'de' },
  { label: 'Français', value: 'fr' },
];

const labels = {
  de: {
    darkMode: 'Dunkelmodus',
    language: 'Sprache',
    settings: 'Einstellungen',
    theme: 'Farbschema wechseln',
  },
  en: {
    darkMode: 'Dark mode',
    language: 'Language',
    settings: 'Settings',
    theme: 'Change color theme',
  },
  fr: {
    darkMode: 'Mode sombre',
    language: 'Langue',
    settings: 'Réglages',
    theme: 'Changer le thème',
  },
} satisfies Record<
  Locale,
  { darkMode: string; language: string; settings: string; theme: string }
>;

interface DisplayControlsProps {
  compact?: boolean;
  initialLocale: Locale;
}

export function DisplayControls({
  compact = false,
  initialLocale,
}: DisplayControlsProps) {
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
    setColorTheme(theme === 'dark' ? 'light' : 'dark');
  }

  function setColorTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem('rundecoded-theme', nextTheme);
  }

  if (compact) {
    return (
      <>
        <a
          aria-label={labels[locale].settings}
          className="text-foreground tablet:hidden flex size-11 items-center justify-center rounded-[var(--radius-control)]"
          href={localizedRoute(locale, 'settings')}
          onClick={() =>
            window.sessionStorage.setItem(
              'rundecoded:phone-settings-return',
              `${window.location.pathname}${window.location.search}${window.location.hash}`,
            )
          }
        >
          <Settings aria-hidden="true" className="size-4" />
        </a>
        <div className="tablet:block hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={labels[locale].settings}
                className="max-[35.99rem]:size-11"
                size="icon"
                variant="ghost"
              >
                <Settings aria-hidden="true" className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{labels[locale].language}</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={locale}
                onValueChange={changeLocale}
              >
                {locales.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <div className="flex items-center justify-between gap-6 px-2 py-2 text-sm">
                <label className="cursor-pointer" htmlFor="tablet-dark-mode">
                  {labels[locale].darkMode}
                </label>
                <Switch
                  checked={theme === 'dark'}
                  id="tablet-dark-mode"
                  onCheckedChange={(checked) =>
                    setColorTheme(checked ? 'dark' : 'light')
                  }
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </>
    );
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
