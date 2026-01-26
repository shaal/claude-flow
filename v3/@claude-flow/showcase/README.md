# Claude Flow V3 - Interactive Technology Showcase

An interactive visual technology showcase for Claude Flow V3, featuring architecture visualization, agent ecosystem exploration, and real-time performance metrics.

## Overview

This showcase provides an immersive way to explore Claude Flow V3's capabilities:

- **Architecture Graph**: Interactive network visualization of the 15-agent hierarchical mesh topology
- **Agent Ecosystem**: Visual exploration of 60+ agent types with capabilities and connections
- **Technology Stack**: Animated layer diagrams showing the full tech stack
- **Performance Metrics**: Real-time dashboards displaying key performance indicators
- **Feature Matrix**: Explorable architecture diagram for feature discovery

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React 18 | Component architecture |
| Visualization | D3.js | Force simulation, SVG rendering |
| Animation | Framer Motion | Declarative animations |
| Styling | Tailwind CSS | Utility-first styling |
| State | Zustand | Lightweight state management |
| Build | Vite | Fast builds, HMR |
| Testing | Vitest + Testing Library | TDD workflow |

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 8+

### Installation

```bash
# Navigate to showcase directory
cd v3/@claude-flow/showcase

# Install dependencies
pnpm install
```

### Development

```bash
# Start development server (http://localhost:3000)
pnpm dev

# Run tests in watch mode
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type checking
pnpm typecheck

# Lint code
pnpm lint

# Format code
pnpm format
```

### Build

```bash
# Build for production
pnpm build

# Preview production build locally
pnpm preview
```

## Project Structure

```
src/
  components/
    architecture/     # Architecture graph visualization
    agents/          # Agent ecosystem visualization
    stack/           # Technology stack layers
    metrics/         # Performance dashboards
    features/        # Feature matrix explorer
    layout/          # Header, navigation, footer
  hooks/
    useD3Simulation  # D3 force simulation hook
    useAnimatedValue # Animation value hook
    useResponsiveLayout # Responsive breakpoints
  data/
    architecture.json # Module and connection data
    agents.json      # Agent types and capabilities
    techstack.json   # Technology layer data
    metrics.json     # Performance metrics
  store/
    visualizationStore # Zustand state management
  types/
    index.ts         # TypeScript type definitions
  utils/
    d3-helpers       # D3 utility functions
    layout-algorithms # Layout calculation
    animation-presets # Reusable animations
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run tests |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm test:ui` | Run tests with UI |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Fix ESLint issues |
| `pnpm format` | Format with Prettier |

## Deployment

The showcase is automatically deployed to GitHub Pages when changes are pushed to the `main` branch. The deployment workflow:

1. Runs tests and linting
2. Builds the production bundle
3. Runs Lighthouse audit (on PRs)
4. Deploys to GitHub Pages

**Live URL**: https://ruvnet.github.io/claude-flow/

## Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance | > 90 |
| Lighthouse Accessibility | > 90 |
| JS Bundle Size | < 200KB |
| CSS Size | < 50KB |
| Total Bundle | < 400KB gzipped |
| Time to Interactive | < 3s |

## Accessibility

- Full keyboard navigation support
- ARIA labels for interactive elements
- Respects `prefers-reduced-motion`
- WCAG AA color contrast compliance
- 44x44px minimum touch targets

## Browser Support

- Chrome 100+
- Firefox 100+
- Safari 15+
- Edge 100+

## Contributing

1. Create a feature branch
2. Write tests first (TDD)
3. Implement the feature
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - See LICENSE file for details
