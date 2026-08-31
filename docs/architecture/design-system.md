# RunDecoded design system

Phase 3 translates the approved minimal, sporty RunDecoded interface into a
small semantic token system and a focused set of reusable components. The
catalogue and Running Basics routes use the same `AppLayout`, banner,
navigation, footer, typography, and responsive rules.

## Visual tokens

The source of truth is `src/styles/global.css`. Component styles consume roles
such as `background`, `surface`, `foreground`, `muted-foreground`, `border`,
`primary`, and `ring`; they do not choose page-specific light or dark colors.

The token groups cover:

- accessible light and dark surface and text roles;
- brand-gradient and navigation roles;
- type families and fluid type sizes;
- small, control, panel, and shell radii;
- restrained panel elevation;
- fast and default interaction durations;
- page gutters and maximum content width.

The initial theme follows the operating-system preference. A visitor's explicit
choice is stored as `rundecoded-theme` and applied before the page renders to
avoid a light/dark flash.

## Responsive contract

RunDecoded uses three named layout thresholds:

| Name    | Minimum width | Intended behavior                                                   |
| ------- | ------------: | ------------------------------------------------------------------- |
| Phone   |   below 48rem | Single-column content, compact controls, stable banner type         |
| Tablet  |         48rem | Multi-column content where useful without changing shell typography |
| Desktop |         64rem | Full navigation and content density                                 |
| Wide    |         80rem | Maximum-width layout; content does not continue stretching          |

Fluid type and spacing use `clamp()` within those modes. Both primary routes
share the same banner markup and rules, preventing type or height changes when
navigating between them.

## Component adoption rule

Use native HTML and a project component when semantics and behavior are simple.
For example, the primary route tabs remain links because they navigate to real
pages.

Use a Radix primitive when the behavior benefits from managed focus, keyboard
navigation, dismissal, or layered content. Phase 3 adopts only:

- Dialog for focused overlays;
- Dropdown Menu for language selection;
- Tabs for layered content within one page;
- Tooltip for supplementary control labels.

The wrappers in `src/components/ui` own RunDecoded styling. `components.json`
configures future shadcn/ui additions to use the same CSS-variable token system.
Do not install or generate a component until an active feature needs it.

## Preview and review

Run the app and open `/rundecoded/design-system/` to inspect tokens, buttons,
dialog behavior, in-page tabs, tooltips, and both themes. During review, verify:

1. keyboard focus is visible;
2. the dialog returns focus to its trigger and closes with Escape;
3. the language menu supports arrow-key navigation;
4. light and dark surfaces retain readable contrast;
5. banner dimensions and typography remain identical on both primary routes;
6. phone, tablet, and desktop layouts do not add a separate control row.
