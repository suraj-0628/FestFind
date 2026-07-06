# TypeScript / React Rules

## Component Guidelines
- Use functional components with hooks
- Keep components small and focused (<200 lines)
- Extract complex logic into custom hooks
- Use TypeScript interfaces for all props
- Avoid inline styles, use Tailwind CSS classes

## State Management
- Use useState for local state
- Use useEffect for side effects with proper cleanup
- Avoid unnecessary re-renders with React.memo
- Use useCallback for stable function references

## File Organization
```
src/
├── components/    # Reusable UI components
├── hooks/         # Custom React hooks
├── data/          # Static data and constants
├── styles/        # Global CSS and animations
└── utils/         # Helper functions and API calls
```

## Naming Conventions
- Components: PascalCase (e.g., `IndiaMap.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`)
- Utils: camelCase (e.g., `apiHelpers.ts`)
- Types: PascalCase (e.g., `Event.ts`)

## TypeScript
- Use strict mode
- Define interfaces for all data structures
- Avoid `any` type
- Use union types for limited options

## Performance
- Lazy load heavy components (maps, images)
- Use React.lazy for route-based splitting
- Optimize images and assets
- Implement proper loading states
