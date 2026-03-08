# Neo-Energy Design System

## 🎨 Color Tokens

### Primary Palette
- `neon-green`: `#22ff88` (Primary actions, success states)
- `electric-blue`: `#00f0ff` (Secondary elements, info states)
- `power-orange`: `#ff8800` (Accent elements, warnings)

### Backgrounds
- `deep-space`: `#07111f` (Dark mode backgrounds)
- `void-blue`: `#0c1f34` (Alternative dark surfaces)
- `midnight`: `#030712` (Night mode backgrounds)
- `polar-mist`: `#eaf7ff` (Light mode backgrounds)
- `solar-sand`: `#fff3dc` (Light mode surfaces)

## 🧩 Utility Classes

### Glassmorphism
```tsx
<div className="glass-panel">
  <!-- Rounded 3xl, backdrop-blur-3xl, theme-aware border -->
</div>
```

### Neon Glow Text
```tsx
<h1 className="neon-glow-green">Energy Flow</h1>
<h2 className="neon-glow-blue">Status</h2>
<span className="neon-glow-orange">Alert</span>
```

### Neon Borders
```tsx
<div className="neon-border-green"><!-- Green glow border --></div>
<div className="neon-border-blue"><!-- Blue glow border --></div>
<div className="neon-border-orange"><!-- Orange glow border --></div>
```

### Animations
```tsx
<!-- Energy pulse (for live indicators) -->
<div className="energy-pulse">⚡</div>

<!-- Cyber shimmer (loading states) -->
<div className="cyber-shimmer">Loading...</div>

<!-- Skeleton loader -->
<div className="skeleton h-24 w-full" />
```

### Pattern Grid
```tsx
<div className="pattern-grid">
  <!-- Subtle grid pattern background -->
</div>
```

### Navigation
```tsx
<button className="nav-pill">Dashboard</button>
<button className="nav-pill nav-pill-active">Settings</button>
```

### Buttons
```tsx
<button className="btn-primary">Optimize Now</button>
<button className="btn-secondary">Cancel</button>
```

### Status Indicators
```tsx
<span className="status-indicator status-online" />
<span className="status-indicator status-offline" />
```

### Metric Cards
```tsx
<div className="metric-card">
  <h3>PV Generation</h3>
  <p>3.2 kW</p>
</div>
```

### Labels
```tsx
<span className="eyebrow">Live Data</span>
<span className="price-pill">0.18 €/kWh</span>
```

### Accessibility
```tsx
<!-- WCAG 2.2 AA compliant focus ring -->
<button className="focus-ring">Accessible Button</button>
```

## 🌈 Themes

### Available Themes
1. **cyber-energy-dark** (default) - High-contrast dark mode with neon green
2. **solar-light** - Light mode with warm solar tones
3. **night-mode** - Deep dark mode with blue accents

### Theme Switching
```tsx
import { useAppStore } from './store';

function ThemeSwitcher() {
  const setTheme = useAppStore(state => state.setTheme);
  
  return (
    <button onClick={() => setTheme('solar-light')}>
      Switch to Light Mode
    </button>
  );
}
```

### CSS Variables
Each theme provides CSS variables:
- `--color-primary` - Primary brand color
- `--color-secondary` - Secondary brand color
- `--color-accent` - Accent color
- `--color-background` - Page background
- `--color-surface` - Card/panel backgrounds
- `--color-surface-strong` - Strong surface (modals, dropdowns)
- `--color-text` - Primary text color
- `--color-muted` - Muted/secondary text
- `--color-border` - Border color
- `--color-glow` - Glow effect color

### Using CSS Variables
```tsx
<div className="bg-[color:var(--color-background)] text-[color:var(--color-text)]">
  Dynamic theme-aware content
</div>
```

## 📐 Spacing & Sizing

### Extended Spacing
- `spacing-18`: `4.5rem`
- `spacing-88`: `22rem`
- `spacing-100`: `25rem`
- `spacing-112`: `28rem`
- `spacing-128`: `32rem`

### Border Radius
- `rounded-4xl`: `2rem`
- `rounded-5xl`: `2.5rem`

## ⏱️ Animations

### Keyframes
- `energy-pulse` - 2.5s infinite pulse (for live data indicators)
- `cyber-shimmer` - 2s infinite shimmer (loading states)
- `fade-in` - 0.45s ease-out
- `slide-up` - 0.4s ease-out
- `slide-down` - 0.4s ease-out
- `scale-in` - 0.35s ease-out

### Usage
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.45 }}
  className="animate-fade-in"
>
  Content
</motion.div>
```

## 🔤 Typography

### Font Families
- `font-sans`: Inter (body text)
- `font-mono`: JetBrains Mono (code, numbers)

### Usage
```tsx
<h1 className="font-sans text-4xl font-bold">Nexus-HEMS</h1>
<code className="font-mono text-sm">192.168.1.100</code>
```

## 🎯 Best Practices

1. **Always use CSS variables** for colors to ensure theme-switching works
2. **Use `.glass-panel`** for cards instead of custom styles
3. **Apply `.focus-ring`** to interactive elements for WCAG 2.2 AA compliance
4. **Use `.energy-pulse`** for real-time data indicators
5. **Apply `.cyber-shimmer`** or `.skeleton`** for loading states
6. **Prefer `.btn-primary`** and `.btn-secondary`** over custom button styles

## 📱 Responsive Design

### Mobile-First Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Example
```tsx
<div className="p-4 sm:p-6 lg:p-8">
  <!-- Mobile: 1rem, Tablet: 1.5rem, Desktop: 2rem -->
</div>
```
