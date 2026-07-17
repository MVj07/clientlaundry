# Project Design Rules & Guidelines

## UI & Aesthetics: The 60-30-10 Color System
All pages and components in this application **MUST** strictly adhere to the **60-30-10 Color Hierarchy System** to maintain a premium, cohesive, and modern visual hierarchy:

1. **60% Dominant Color (`--color-60-dominant-*`)**:
   - **Role**: Primary background, page wrappers, main surfaces, and general canvas.
   - **Usage**: Sets the overall theme (`#f8fafc` for light backgrounds or `#ffffff` for main container cards).
   - **Utility Classes**: `.bg-60-dominant`, `.surface-60-dominant`

2. **30% Secondary Color (`--color-30-secondary-*`)**:
   - **Role**: Structural grouping, secondary cards, navigation bars, headers, tables, subtle borders, and secondary typography.
   - **Usage**: Creates contrast against the dominant background without competing (`#f1f5f9` for cards/panels, `#e2e8f0` for subtle boundaries, `#475569` for subtext).
   - **Utility Classes**: `.bg-30-secondary`, `.surface-30-secondary`, `.text-30-secondary`, `.border-30-secondary`

3. **10% Accent Color (`--color-10-accent-*`)**:
   - **Role**: Call-to-action (CTA) buttons, interactive badges, primary highlights, status indicators, and key user focus points.
   - **Usage**: Used sparingly to draw immediate attention (`#6366f1` / `#8b5cf6` linear gradients for primary actions, `#10b981` for paid/success badges).
   - **Utility Classes**: `.btn-10-accent`, `.badge-10-accent`, `.text-10-accent`

### Enforcement Checklist for Components
When creating or refactoring Angular components (`*.html`, `*.css`):
- Avoid random or ad-hoc background colors (`pink`, `red`, `#b4f5ff`). Always map colors back to the `60-30-10` hierarchy.
- Ensure buttons and primary links stand out cleanly using the 10% accent tokens (`.btn-10-accent`).
- Structure modals, drawers, and form cards with 30% secondary borders/surfaces (`.surface-30-secondary`) against the 60% dominant canvas.
