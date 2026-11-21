# PDF Master Design System

## Tokens (`src/config/designTokens.ts` & `src/index.css`)
- **Primary Brand Palette:** Cobalt Blue (`#1D4ED8` primary, `#1E40AF` hover, `#1E3A8A` active, `#EFF6FF` soft tint) paired with Neutral Slate (`#F8FAFC` canvas, `#FFFFFF` surface, `#0F172A` primary text).
- **Theme Variables:** Light-theme semantic variables (`--pm-*`) are defined on `:root` in `src/index.css` so dark-theme overrides can be added cleanly later.
- **Typography:** `Plus Jakarta Sans` (display/headings), `DM Sans` (body copy), `JetBrains Mono` (tabular file sizes, counts, formats).
- **RTL Support:** All directional utilities use Tailwind logical properties (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`, `text-start`, `rtl:rotate-180`, `rtl:-translate-x-5`).

## Interaction Rules
- **Hover:** Interactive buttons, links, and cards transition colors in `150ms` (`duration-150`) without layout shifts.
- **Active:** Buttons step one shade darker (`active:bg-blue-900`, `active:bg-slate-100`).
- **Focus:** Every interactive control exposes `:focus-visible` with a `2px` high-contrast outline (`outline-blue-700`, `outline-offset-2`).
- **Disabled:** Sets native `disabled`, `disabled:opacity-50`, and `disabled:cursor-not-allowed`; `FileDropzone` also sets `aria-disabled` and muted slate surface.
- **Loading:** `Button` and `IconButton` accept `isLoading`, apply `aria-busy="true"`, disable clicks, and render `Spinner` (`motion-reduce:animate-none`).
- **Touch Targets:** Mobile buttons and icon triggers enforce at least `44px` (`min-h-[44px]`).
- **Overlays (`Modal` / `Drawer`):** Trap Tab/Shift+Tab focus inside the panel, lock body scroll while open, close on `Escape` or backdrop click, and restore focus to the triggering element on close.
