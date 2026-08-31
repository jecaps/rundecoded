# Styling foundation

RunDecoded uses Tailwind CSS 4 through its first-party Vite plugin. The shared
application layout imports `src/styles/global.css` once so Astro pages and React
components use the same generated stylesheet.

## Content scanning

Tailwind 4 automatically detects utility classes in the project's Astro,
TypeScript, TSX, and HTML source files. A JavaScript configuration file and a
manual content array are therefore unnecessary. If a future package contains
classes outside the detected application sources, it must be registered
explicitly with Tailwind's `@source` directive.

Utility class names must remain complete strings in source code. Do not build
class names from fragments such as `bg-${colour}-500`, because the scanner
cannot discover the resulting class reliably. Map variants to complete class
strings instead.

## Base styles and reset behavior

The `@import "tailwindcss"` statement includes Tailwind's Preflight reset. The
project adds only a minimal `@layer base` block for the application font,
minimum supported viewport width, readable line height, and system light/dark
colours.

Native focus indicators and control behavior are intentionally left intact.
Future foundational styles must preserve keyboard visibility and must not
remove accessible browser behavior without an equivalent, tested replacement.

## Future design tokens

The design-system phase will define final values. Tokens will be declared in
CSS with Tailwind 4's `@theme` directive rather than in a legacy JavaScript
Tailwind configuration file:

```css
@theme {
  --color-brand-primary: /* approved value */;
  --font-sans: /* approved font stack */;
}
```

Theme namespaces expose matching utilities automatically. For example,
`--color-brand-primary` makes utilities such as `bg-brand-primary` and
`text-brand-primary` available, while `--font-sans` backs the `font-sans`
utility.

Prefer semantic names that describe purpose rather than a fixed visual value.
Application-specific tokens may reference lower-level CSS custom properties
when the design system needs themes. The final palette, spacing scale,
typography scale, radii, shadows, and component recipes remain out of scope for
this foundation issue.
