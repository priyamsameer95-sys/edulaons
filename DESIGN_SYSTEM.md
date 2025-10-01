# Interactive Elements Design System

## Overview
This document serves as the single source of truth for all interactive elements in the Partner Dashboard. All clickable elements follow consistent color, shadow, and state rules for a professional fintech aesthetic.

---

## 1. Color System (HSL Format)

### Primary Actions (Brand Blue)
- **Default**: `hsl(214 84% 56%)` - Professional blue
- **Hover**: `hsl(214 84% 46%)` - 10% darker
- **Active/Pressed**: `hsl(214 84% 40%)` - Darker on press
- **Disabled**: `hsl(214 84% 76%)` - 40% lighter
- **Text**: `hsl(0 0% 100%)` - White

### Secondary Actions (Neutral Gray)
- **Default**: `hsl(220 13% 95%)` - Light gray
- **Hover**: `hsl(220 13% 85%)` - 10% darker
- **Active/Pressed**: `hsl(220 13% 80%)` - Darker on press
- **Disabled**: `hsl(220 13% 97%)` - Lighter gray
- **Text**: `hsl(220 9% 46%)` - Dark gray

### Destructive Actions (Red)
- **Default**: `hsl(0 84% 60%)` - Bright red
- **Hover**: `hsl(0 84% 50%)` - Darker red
- **Active/Pressed**: `hsl(0 84% 45%)` - Even darker
- **Disabled**: `hsl(0 84% 80%)` - Muted red
- **Text**: `hsl(0 0% 100%)` - White

### Success Actions (Green)
- **Default**: `hsl(142 76% 36%)` - Professional green
- **Hover**: `hsl(142 76% 30%)` - Darker green
- **Active/Pressed**: `hsl(142 76% 26%)` - Even darker
- **Text**: `hsl(0 0% 100%)` - White

### Warning Actions (Orange)
- **Default**: `hsl(38 92% 50%)` - Vibrant orange
- **Hover**: `hsl(38 92% 45%)` - Darker orange
- **Active/Pressed**: `hsl(38 92% 40%)` - Even darker
- **Text**: `hsl(0 0% 100%)` - White

### Links (Blue)
- **Default**: `hsl(214 84% 56%)` - Same as primary
- **Hover**: `hsl(214 84% 46%)` - Darker with underline
- **Active**: `hsl(214 84% 40%)` - Even darker

### Input Fields
- **Border Default**: `hsl(220 13% 91%)` - Light border
- **Border Hover**: `hsl(220 13% 85%)` - Slightly darker
- **Border Focus**: `hsl(214 84% 56%)` - Brand blue
- **Background**: `hsl(0 0% 100%)` - White

---

## 2. Shadow System (Elevation)

### Base Shadows
- **None**: No shadow (disabled states)
- **XS**: `0 1px 2px 0 hsl(220 13% 69% / 0.05)` - Minimal depth
- **SM**: `0 1px 3px 0 hsl(220 13% 69% / 0.08)` - Subtle elevation
- **MD**: `0 4px 6px -1px hsl(220 13% 69% / 0.1), 0 2px 4px -1px hsl(220 13% 69% / 0.06)` - Medium depth
- **LG**: `0 10px 15px -3px hsl(220 13% 69% / 0.15), 0 4px 6px -2px hsl(220 13% 69% / 0.08)` - High elevation
- **XL**: `0 20px 25px -5px hsl(220 13% 69% / 0.2), 0 10px 10px -5px hsl(220 13% 69% / 0.1)` - Maximum elevation

### Interactive Shadows
- **Button Default**: `0 1px 3px 0 hsl(220 13% 69% / 0.08)`
- **Button Hover**: `0 4px 8px -2px hsl(220 13% 69% / 0.15), 0 2px 4px -1px hsl(220 13% 69% / 0.08)` - Lifted
- **Button Active**: `inset 0 2px 4px 0 hsl(220 13% 69% / 0.1)` - Pressed inward
- **Card Default**: `0 1px 3px 0 hsl(220 13% 69% / 0.08)`
- **Card Hover**: `0 8px 16px -4px hsl(220 13% 69% / 0.12), 0 4px 8px -2px hsl(220 13% 69% / 0.06)` - Elevated

---

## 3. State Requirements

### Every clickable element MUST have these states:

#### Default
- Base colors and shadows
- Clear visual affordance
- Proper contrast ratios (4.5:1 minimum)

#### Hover
- Background color shifts 10% darker
- Shadow elevation increases
- Smooth transition (200ms)
- Cursor changes to pointer

#### Active/Pressed
- Background color shifts 15-20% darker
- Inset shadow or scale down effect
- Immediate visual feedback
- Scale: 0.98 for cards

#### Focus
- 2px ring with brand color
- 2px offset from element
- Maintained elevation
- Clear keyboard navigation indicator

#### Disabled
- 50% opacity OR lighter color variant
- No pointer events
- No shadows
- Cursor: not-allowed

---

## 4. Transition Timing

All transitions use consistent timing:
- **Fast**: 150ms - Quick interactions
- **Base**: 200ms - Standard interactions (default)
- **Slow**: 250ms - Complex animations
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` - Smooth deceleration

---

## 5. Component Specifications

### Primary Buttons
```tsx
<Button variant="default">
  // bg-primary shadow-button
  // hover: bg-primary-hover shadow-button-hover
  // active: bg-primary-active shadow-button-active
  // disabled: bg-primary-disabled shadow-none
</Button>
```

### Secondary Buttons
```tsx
<Button variant="secondary">
  // bg-secondary shadow-button
  // hover: bg-secondary-hover shadow-button-hover
  // active: bg-secondary-active shadow-button-active
</Button>
```

### Outline Buttons
```tsx
<Button variant="outline">
  // border-2 border-input shadow-button
  // hover: border-input-hover bg-secondary shadow-button-hover
  // active: bg-secondary-active shadow-button-active
</Button>
```

### Ghost Buttons
```tsx
<Button variant="ghost">
  // No background or shadow
  // hover: bg-secondary
  // active: bg-secondary-active
</Button>
```

### Destructive Buttons
```tsx
<Button variant="destructive">
  // bg-destructive shadow-button
  // hover: bg-destructive-hover shadow-button-hover
  // active: bg-destructive-active shadow-button-active
</Button>
```

### Success/Warning Buttons
```tsx
<Button variant="success">
<Button variant="warning">
  // Same pattern as primary with respective colors
</Button>
```

### Links
```tsx
<a href="#">
  // text-link
  // hover: text-link-hover + underline
  // active: text-link-active
</a>
```

### Input Fields
```tsx
<Input />
  // border-2 border-input shadow-sm
  // hover: border-input-hover
  // focus: border-input-focus ring-2 ring-ring shadow-md
  // disabled: opacity-50 cursor-not-allowed
```

### Switches
```tsx
<Switch />
  // unchecked: bg-input shadow-sm
  // checked: bg-primary shadow-button
  // hover-checked: bg-primary-hover
  // hover-unchecked: bg-input-hover
```

### Toggles
```tsx
<Toggle />
  // off: bg-transparent
  // on: bg-primary shadow-button
  // hover-on: bg-primary-hover
  // active-on: bg-primary-active
```

### Badges
```tsx
<Badge variant="default">
  // bg-primary shadow-xs
  // hover: bg-primary-hover shadow-sm
</Badge>
```

### Cards (Clickable)
```tsx
<CardInteractive>
  // shadow-card
  // hover: shadow-card-hover border-primary/20
  // active: scale-[0.98]
</CardInteractive>
```

---

## 6. Visual Hierarchy Rules

### Priority Levels

1. **Primary Actions** (Highest priority)
   - Use `variant="default"` (brand blue)
   - Strongest shadows and contrast
   - Reserved for main CTAs
   - Maximum 1-2 per screen

2. **Secondary Actions**
   - Use `variant="secondary"` or `variant="outline"`
   - Medium contrast
   - Supporting actions
   - Can have multiple per screen

3. **Tertiary Actions**
   - Use `variant="ghost"` or `variant="link"`
   - Minimal visual weight
   - Optional or less important actions
   - Can have many per screen

4. **Destructive Actions**
   - Use `variant="destructive"`
   - High contrast red
   - Warning actions (delete, remove)
   - Always confirm before action

---

## 7. Accessibility Requirements

- **Contrast Ratio**: Minimum 4.5:1 for text
- **Touch Targets**: Minimum 44x44px for mobile
- **Focus Indicators**: Always visible with 2px ring
- **Keyboard Navigation**: All interactive elements must be accessible
- **ARIA Labels**: Required for icon-only buttons
- **Screen Reader**: Descriptive text for all actions

---

## 8. Dark Mode

All colors have dark mode variants that maintain the same contrast ratios and visual hierarchy. Dark mode automatically adjusts:
- Primary colors remain consistent
- Backgrounds become darker
- Shadows use black with higher opacity
- All state transitions work identically

---

## 9. Usage Guidelines

### DO:
✅ Use semantic color tokens (`bg-primary`, not `bg-blue-500`)  
✅ Apply consistent shadows to all buttons  
✅ Include all state variants (hover, active, disabled, focus)  
✅ Use appropriate variant for action priority  
✅ Test with keyboard navigation  
✅ Verify contrast ratios  

### DON'T:
❌ Use direct hex colors in components  
❌ Skip hover or focus states  
❌ Mix button styles inconsistently  
❌ Create custom shadows outside the system  
❌ Use primary variant for multiple actions on same screen  
❌ Forget disabled states  

---

## 10. Implementation Checklist

When creating new interactive elements:

- [ ] Use semantic color tokens from design system
- [ ] Include all 5 states (default, hover, active, focus, disabled)
- [ ] Apply appropriate shadow from elevation system
- [ ] Use 200ms transition with smooth easing
- [ ] Test keyboard navigation and focus states
- [ ] Verify contrast ratios meet WCAG AA standards
- [ ] Test in both light and dark modes
- [ ] Ensure touch targets are minimum 44x44px
- [ ] Add appropriate ARIA labels if needed
- [ ] Document any new patterns in this file

---

## Technical Reference

### CSS Variables Location
`src/index.css` - All color and shadow tokens

### Tailwind Config
`tailwind.config.ts` - Shadow utilities and transitions

### Component Files
- `src/components/ui/button.tsx` - Button variants
- `src/components/ui/input.tsx` - Input fields
- `src/components/ui/card.tsx` - Cards and interactive cards
- `src/components/ui/badge.tsx` - Badges
- `src/components/ui/switch.tsx` - Toggle switches
- `src/components/ui/toggle.tsx` - Toggle buttons

---

**Last Updated**: 2025-10-01  
**Version**: 1.0  
**Status**: ✅ Implemented and Active
