
# Design tokens

```ts
// tokens.ts
export const color = {
  brand: "#00B140",            // primary
  brandFg: "#FFFFFF",
  text: "#111111",
  textMuted: "#6B7280",        // gray-500
  border: "#E5E7EB",           // gray-200
  bg: "#FFFFFF",
  bgMuted: "#F9FAFB",
  danger: "#DC2626",
  success: "#00B140",          // mirrors brand
};

export const radius = { none: 0 }; // brutalism: no rounding
export const border = { width: 1 };

export const space = {           // 4px base
  0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 10: 40, 12: 48,
};

export const shadow = { none: "none" }; // no shadows

export const type = {
  // Use one sans family with two weights; optional mono for meta
  family: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
  size: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, h3: 24, h2: 28, h1: 36 },
  weight: { regular: 400, medium: 500, bold: 700 },
  letterSpacingCaps: "0.06em",
  line: { tight: 1.15, snug: 1.3, normal: 1.5 },
};

export const motion = {
  duration: { fast: "150ms", base: "220ms", slow: "380ms" },
  easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
};
```

**Accessibility guardrails**

* Text contrast ≥ 4.5:1 (text vs bg); don’t use brand green for body copy.
* Respect `prefers-reduced-motion` for all transitions/animations.
* Minimum hit target 44×44px for interactive elements.

# Component spec (React/TypeScript examples)

## 1) Button

Purpose: primary action with brutalist look.
States: `default | loading | success | disabled`.

```tsx
// Button.tsx
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  state?: "default" | "loading" | "success";
};

export function Button({
  variant = "primary",
  state = "default",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || state === "loading";
  return (
    <button
      {...props}
      aria-busy={state === "loading" || undefined}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center h-10 px-4 select-none",
        "border",
        "uppercase tracking-wider",           // brutalist voice
        "text-[13px]",
        variant === "primary" && "bg-black text-white border-black",
        variant === "secondary" && "bg-white text-black border-black",
        variant === "ghost" && "bg-transparent text-black border-black",
        "transition-[background,transform,opacity]",
        "duration-200", "ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black",
        "disabled:opacity-60 disabled:cursor-not-allowed"
      ].join(" ")}
    >
      {state === "loading" ? <Spinner /> :
       state === "success" ? <GreenSquare /> :
       children}
    </button>
  );
}

function Spinner() {
  return (
    <span className="relative w-4 h-4" aria-hidden>
      <span className="absolute inset-0 animate-spin border border-black border-t-transparent" />
    </span>
  );
}
function GreenSquare() {
  return (
    <span
      aria-hidden
      className="w-3 h-3"
      style={{ background: "#00B140" }}
    />
  );
}
```

**Motion note:** when toggling to `success`, keep it for \~900ms then revert to `default`. Respect `prefers-reduced-motion`.

## 2) SizePill (Variant selector)

States: default, selected, disabled, focus, error.

```tsx
// SizePill.tsx
type SizePillProps = {
  label: string; selected?: boolean; disabled?: boolean; onSelect: () => void;
};
export function SizePill({ label, selected, disabled, onSelect }: SizePillProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onSelect}
      className={[
        "h-9 min-w-[44px] px-3 border text-sm",
        selected ? "bg-black text-white border-black" : "bg-white text-black",
        disabled && "opacity-40 cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black",
        "transition-colors duration-150"
      ].join(" ")}
    >
      {label}
    </button>
  );
}
```

Error handling: on `Add` without size, show inline error: `Select a size` (red text), and move focus to first enabled size.

## 3) AddToCart pattern

* Composition: `<Button state /> + aria-live toast + cart badge bump`.
* On success: emit event `cart:item-added` for cart drawer preloading.

```tsx
// AddToCart.tsx (sketch)
const [state, setState] = useState<"default"|"loading"|"success">("default");
const liveRef = useRef<HTMLDivElement>(null);

async function handleAdd() {
  if (!size) { setError("Select a size"); return; }
  setState("loading");
  try {
    await addItem({ id, size, qty: 1 });
    setState("success");
    liveRef.current?.textContent = "Added to cart";
    dispatchEvent(new CustomEvent("cart:item-added"));
    setTimeout(() => setState("default"), 900);
  } catch {
    toast.error("Network error. Retry.");
    setState("default");
  }
}

return (
  <>
    <Button onClick={handleAdd} state={state}>Add</Button>
    <div role="status" aria-live="polite" className="sr-only" ref={liveRef} />
  </>
);
```

## 4) CartDrawer

* Opens from right, traps focus, closes on `Esc` + overlay click.
* Provides undo on remove, stepper with announced values.

```tsx
// CartDrawer.tsx (key a11y bits)
useEffect(() => {
  function onKey(e: KeyboardEvent){ if (e.key === "Escape") onClose(); }
  if (open) document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}, [open]);

// Focus trap: on open, focus the drawer; on close, return focus to trigger.
```

Line item:

* Title, price, meta (size/color) in mono.
* Qty stepper buttons are 44×44px; announce `Quantity: N` via `aria-live="polite"`.

Empty state: minimal—“Cart is empty” + “Continue browsing” ghost button.

## 5) StickyAddBar (mobile PDP)

* Visible when PDP scrolls beyond hero.
* Contains size selector (horizontal scroll) + `Add` button.
* Height 56–64px; safe-area insets respected.

## 6) Badge system (brandable flags)

* Rectangular, uppercase, no rounding.
* Variants:

  * `DROP/` (brand green background, white text),
  * `LOW/` (white bg, black border + text),
  * `RESTOCK/` (white bg, black dashed border + text).

```tsx
export function Badge({ tone, children }:{tone:"drop"|"low"|"restock", children:React.ReactNode}) {
  const base = "px-2 h-6 inline-flex items-center border text-[11px] uppercase tracking-wider";
  if (tone==="drop") return <span className={`${base} border-[#00B140] bg-[#00B140] text-white`}>{children}</span>;
  if (tone==="low") return <span className={`${base} border-black text-black`}>{children}</span>;
  return <span className={`${base} border-black border-dashed text-black`}>{children}</span>;
}
```

## 7) Breadcrumb

* Increase affordance: icon + text, 44px target; position in a thin left rail on desktop.

## 8) ProductCard

* Fixed aspect ratio to prevent CLS, normalized padding.
* Hover: light translateY(-1px) (no shadow) OR green square pip appears top-left for `DROP/`.

```tsx
// CSS hints
.card { aspect-ratio: 4/5; border: 1px solid #E5E7EB; }
@media (prefers-reduced-motion: no-preference) {
  .card:hover { transform: translateY(-1px); transition: transform 200ms cubic-bezier(0.2,0.8,0.2,1); }
}
```

# Interaction motifs (make the green square your signature)

* Add success: small 8–12px green square replaces label briefly.
* Cart badge: green square with count overlay (mono).
* “Live drop” banner: green rectangle behind `/DATARAN.` slug.

# Content & editorial rules

* Product titles: **ALL CAPS**, tracking `0.06em`.
* Meta line (price, SKU, material): mono, lowercase or small caps.
* Microcopy verbs: `ADD`, `ADDED`, `CHECKOUT`, `BACK`.
* Status copy: `adding…`, `retry`.

# Performance notes

* `next/image` with `priority` on first PDP image; `sizes` attribute set correctly.
* Lazy-load cart drawer chunk on first `cart:item-added` or icon hover (preload).
* Defer non-critical fonts; use `font-display: swap`.
* Serve WebP/AVIF if available; cap hero widths for DPR > 2.

# QA matrix (what to manually test)

* Keyboard-only: tab order PDP → size → add → toast → open cart → close → return focus.
* Screen reader: announce add success and qty changes.
* Error simulation: offline add, OOS size, network 500.
* Responsive: 320–1440 widths; sticky bar overlap; notch safe areas.

# PR checklist (paste into description)

**Design tokens**

* [ ] Tokens added (`color`, `space`, `type`, `motion`, `radius`, `border`, `shadow`) with no ad-hoc hex/px in components.
* [ ] Contrast checked (≥ 4.5:1) for text on all backgrounds.

**Components**

* [ ] `Button` implements `default/loading/success/disabled`; success shows green square ≤ 900ms with reduced-motion guard.
* [ ] `SizePill` supports `selected/disabled` and has `:focus-visible` styles.
* [ ] `AddToCart` announces success via `aria-live` and prevents double-submit.
* [ ] `CartDrawer` traps focus, closes on `Esc` & overlay click, restores focus to trigger.
* [ ] Qty stepper announces new value; remove has **Undo** snackbar.
* [ ] `StickyAddBar` on mobile with size scroll + Add; respects safe-area.
* [ ] `Badge` variants (`DROP/`, `LOW/`, `RESTOCK/`) implemented.

**Flow & states**

* [ ] PDP without size selection shows inline error and moves focus to variants.
* [ ] OOS sizes are disabled; “Restock me” capture appears (if available).
* [ ] Empty cart screen implemented.
* [ ] Network error on add shows retry.

**Performance**

* [ ] `next/image` used with `priority` on first PDP image; correct `sizes`.
* [ ] Cart chunk/code split & preloaded on intent.
* [ ] Fonts loaded with `font-display: swap`.

**Accessibility**

* [ ] All interactive elements ≥ 44×44px.
* [ ] `role="status"` or `aria-live` used for async updates.
* [ ] `prefers-reduced-motion` respected globally.

**Visual rhythm**

* [ ] Grid & spacing use the tokenized scale; no mixed paddings.
* [ ] Breadcrumb affordance enlarged and aligned to left rail.
