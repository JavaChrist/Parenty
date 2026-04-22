---
name: Parenty
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d5e3fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#3d4947'
  inverse-surface: '#233144'
  inverse-on-surface: '#eaf1ff'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#5c5f61'
  on-secondary: '#ffffff'
  secondary-container: '#e0e3e5'
  on-secondary-container: '#626567'
  tertiary: '#994100'
  on-tertiary: '#ffffff'
  tertiary-container: '#c05400'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#e0e3e5'
  secondary-fixed-dim: '#c4c7c9'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#444749'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783200'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d5e3fc'
typography:
  h1:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  caption:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  container-margin: 32px
  gutter: 16px
---

## Brand & Style

The brand personality is rooted in **Reassuring Professionalism**. Co-parenting requires a neutral, stable, and empathetic environment; the UI reflects this by prioritizing clarity and reducing cognitive load. 

This design system utilizes a **Modern Minimalist** style with a focus on "Softness." By combining generous whitespace with large-radius geometry, the interface feels approachable rather than clinical. The visual language avoids sharp edges or aggressive contrasts to foster a sense of calm and cooperation between users during potentially stressful interactions.

## Colors

The palette is designed to be functional and soothing. 
- **Primary (Soft Teal):** Used for navigation, brand presence, and primary states. It is chosen for its associations with stability and growth.
- **Secondary (Slate/White):** Provides a clean foundation. Surfaces use subtle gray-blues to prevent the "starkness" of pure white while maintaining high legibility.
- **Accent (Subtle Orange):** Reserved strictly for high-priority actions or notifications. This creates a clear visual hierarchy for items requiring immediate attention (e.g., "New Request," "Urgent Update").
- **Success/Info/Warning:** Follow standard semantic conventions but are desaturated to match the soft brand aesthetic.

## Typography

This design system uses **Manrope** for all text levels. Its modern, geometric construction offers excellent legibility at small sizes (essential for scheduling and messaging) while feeling warm and contemporary in headlines.

- **Headlines:** Use tighter letter spacing and heavier weights to provide structure.
- **Body Text:** Uses a generous line-height (1.6) to ensure long-form messages or legal documentation are easy to digest.
- **Labels:** Set in semi-bold to distinguish form headers from user input.

## Layout & Spacing

The layout philosophy is based on a **Fluid Grid** with a 12-column system for desktop and a 4-column system for mobile. 

The rhythm is dictated by an 8px base unit. To achieve the requested "spacious" feel, the design system utilizes larger-than-standard internal padding for cards and containers (typically 24px or 32px). This creates "breathing room," making the app feel less cluttered and more intuitive for parents who may be checking the app quickly on the go.

## Elevation & Depth

This design system conveys depth through **Ambient Shadows** and **Tonal Layering**. 

1. **Surface Tiers:** Backgrounds are `#FFFFFF`. Secondary containers (like sidebars or info panels) use `#F8FAFC`.
2. **Shadows:** Instead of harsh black shadows, this system uses low-opacity teal-tinted shadows (e.g., `rgba(13, 148, 136, 0.08)`). This keeps the "Soft Blue" brand present even in the shadows.
3. **Levels:** 
   - *Flat:* Inputs and inactive cards.
   - *Raised:* Interactive cards and buttons (hover state).
   - *Overlay:* Modals and dropdowns, featuring a soft backdrop blur to maintain focus on the task at hand.

## Shapes

The shape language is defined by large, friendly radii. 

- **Base Radius:** 0.5rem (8px) for small elements like buttons and inputs.
- **Large Radius:** 1rem (16px) for standard cards and containers.
- **Extra Large Radius:** 1.5rem (24px) for major dashboard sections and modal containers.

Consistent rounding across all elements—including progress bars and image containers—reinforces the "soft" brand tone. Use "Pill" shapes for tags and status indicators to differentiate them from interactive buttons.

## Components

### Buttons & Actions
- **Primary:** Filled Teal with white text. Rounded-full or large-radius (12px+).
- **Secondary:** Ghost style with teal border and text.
- **Accent:** Subtle Orange backgrounds for critical CTAs (e.g., "Confirm Swap").

### Cards
Cards are the primary container for information. They feature a subtle 1px border in a light gray-blue and a soft ambient shadow. Internal padding should be at least 24px to maintain the spacious layout.

### Input Fields
Inputs use a light gray background with no shadow in their default state. Upon focus, they transition to a teal border with a soft outer glow. Labels are always positioned above the field for maximum accessibility.

### Icons
Use **Lucide-style icons** with a 2px stroke weight. Icons should be monochrome (Slate 500) except when used as a primary action or status indicator.

### Specialized Components
- **The Calendar:** The heart of the app. It should use soft-colored blocks (light teal or light orange) with rounded corners to represent custody days, avoiding harsh lines or grid borders.
- **Shared Journal:** Uses a "Message Bubble" style with large corner radii to facilitate a friendly tone in communication.