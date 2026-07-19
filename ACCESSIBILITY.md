# Accessibility (A11y) Conformance Report

This document outlines the specific accessibility and UX polish improvements implemented across the PulsePoint platform to ensure conformance with WCAG 2.2 AA guidelines.

## 1. High-Contrast Theme Support
- **WCAG Guideline**: 1.4.3 Contrast (Minimum)
- **Implementation**: We introduced an `AccessibilityContext` and a toggleable "High Contrast" setting in the global header. When activated, a `.high-contrast` CSS class overrides Tailwind's default palette, forcing pure black/white combinations across all UI surfaces, ensuring a contrast ratio significantly higher than the required 4.5:1.

## 2. Reduced Motion
- **WCAG Guideline**: 2.3.3 Animation from Interactions
- **Implementation**: We implemented a "Reduced Motion" toggle (which also inherits from the OS-level `prefers-reduced-motion` media query). This setting:
  1. Applies a `.reduce-motion` CSS class that globally disables CSS animations and transitions via `!important`.
  2. Binds directly to the `isAnimationActive` prop in our Recharts `<Line>` components, disabling JavaScript-based SVG rendering animations.

## 3. Keyboard Navigation
- **WCAG Guideline**: 2.1.1 Keyboard, 2.4.1 Bypass Blocks, 2.4.7 Focus Visible
- **Implementation**: 
  - **Focus Rings**: Standardized Tailwind utilities (`focus-visible:ring-2 focus-visible:ring-offset-2`) are used across interactive elements (buttons, inputs) so users navigating via Tab clearly see their focus state.
  - **Skip Link**: A visually hidden "Skip to content" link is positioned at the absolute top of the DOM in `layout.tsx`. It becomes visible when focused, allowing users to bypass the header and jump directly to the `<main>` content container.

## 4. Screen Reader Enhancements
- **WCAG Guideline**: 4.1.2 Name, Role, Value, 4.1.3 Status Messages
- **Implementation**:
  - **ARIA Labels**: All icon-only buttons (such as the Microphone and Send buttons in the Fan Agent) possess explicit `aria-label` attributes.
  - **Live Regions**: The container housing the `ForecastDashboard` charts and AI Insights is wrapped in `aria-live="polite" aria-atomic="true"`. Because this dashboard automatically refreshes every 30 seconds via WebSockets, these ARIA attributes ensure that screen reader users are notified when the underlying wait times change.

## 5. End-to-End RTL (Right-to-Left) Layout
- **WCAG Guideline**: 1.3.1 Info and Relationships / Universal Design
- **Implementation**: To properly support Arabic translations, the language selection state was lifted from the `FanAgentWidget` into the global `AccessibilityContext`. When Arabic is selected, the root `<main>` wrapper dynamically receives `style={{ direction: 'rtl' }}`, guaranteeing that the entire application layout (header, dashboards, alignment) gracefully flips.

## Testing Methodology
- **Automated Testing**: Integrated `@axe-core/playwright` into the CI test suite (`e2e.spec.ts`). This enforces a strict assertion that prevents code from being merged if critical or serious violations (like missing ARIA labels or broken layouts) are detected during the Fan and Staff browser flows.
- **Manual Verification**: Keyboard navigation and manual screen reader (VoiceOver/NVDA) spot checks were used to verify focus states and live-region announcements.
