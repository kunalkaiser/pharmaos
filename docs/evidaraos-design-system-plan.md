# EvidaraOS Design System Plan

## Brand Feel

EvidaraOS should feel like enterprise pharma evidence intelligence: serious, scientific, audit-ready, premium, and calm under scrutiny. The design should help a biotech or pharma buyer understand what the platform does, why it can be trusted, and where human review remains necessary.

The design should avoid generic AI futurism, neon dashboards, robotics language, stock photos, fake product data, fake charts, and copied aesthetics from other companies.

## Visual Language

### Evidence Graph

Use graph-like visuals to show relationships among disease, intervention, source, citation, claim, limitation, and review status. Graphs should be structural unless populated by real data.

### Source Map

Use source-category maps for PubMed, ClinicalTrials.gov, FDA/openFDA, DailyMed, RxNorm, MedlinePlus, CDC, WHO, NCI, RSS/news signals, and future restricted/licensed sources. Mark restricted sources clearly.

### Query-to-Citation Flow

Use a horizontal or vertical flow:

`query -> connector search -> evidence candidates -> review -> citation -> evidence record -> packet`

Every stage should keep `candidateOnly` separate from final evidence records.

### Audit Ledger Timeline

Use timeline rows for query runs, source events, candidate events, errors, and snapshots. Do not show fake audit rows. Blank or empty states are acceptable.

### Report Preview Cards

Show report anatomy: overview, evidence table, source appendix, methodology, limitations, and audit trail. Use blank-field placeholders until real evidence records exist.

### Regulatory-Grade Provenance Panels

Create compact panels showing source title, source URL, source identifier, access date, extraction confidence, human review status, and limitation notes.

### Command-Center Dashboard Visuals

Future authenticated workspace screens can use operational dashboards, but only with real empty states or real backend data. No fake metrics.

## Color Palette Direction

Base:

- white and off-white page backgrounds
- slate text and borders
- navy for primary brand authority

Accents:

- blue for evidence retrieval
- teal for provenance and source grounding
- green for disease burden / epidemiology
- muted purple for orchestration and EvidenceOS reasoning
- orange for safety, warnings, limitations, and review gates

Rules:

- avoid neon
- avoid dark sci-fi pages
- avoid single-hue palettes
- reserve orange for caution or review states
- use color as system meaning, not decoration

## Typography Direction

Use a clean enterprise sans-serif stack. Headings should be confident but restrained. Body copy should be dense, readable, and specific. Avoid oversized type inside cards and operational panels.

## Spacing and Grid Rules

Use fewer, stronger sections. Prefer structured layouts over stacked text cards. Keep cards at a modest radius. Use stable dimensions for architecture diagrams, source maps, audit timelines, and report previews.

## Card System

Cards should be used for:

- repeated feature groups
- source categories
- evidence candidate summaries
- empty states
- trust controls

Cards should not be nested or used as generic decoration.

## Icon System

Use simple inline SVG or text-symbol icons until the dependency policy changes. Icons should represent source, citation, review, audit, limitation, report, and access boundary concepts. Do not use robot/AI assistant metaphors.

## Data Visualization Style

Use real data only. When no real data exists, show empty states, schemas, required fields, or diagrams of process. Avoid fake charts, invented KPIs, and synthetic customer metrics.

## Motion Principles

Motion should clarify workflow state changes, source traversal, audit timeline progression, or evidence promotion. Do not add decorative animation before the product logic is clear.

## Image / Illustration Strategy

No generic stock photos. Use custom product visuals, source maps, diagrams, and report anatomy illustrations. Any screenshot-like visual must be either a real product empty state or clearly labeled as architecture/design planning.

## Recommended External Tools

Figma is recommended before major visual redesign. It should define hero compositions, page hierarchy, component states, report anatomy, evidence graph visuals, and responsive behavior.

Storybook is recommended before the component library grows further. It should document source cards, provenance panels, audit timeline states, empty states, and internal workspace shells.

Custom SVG/React diagrams are recommended for evidence, audit, source, and architecture flows because the product needs precise meaning rather than generic decoration.

Lottie can be used later for lightweight custom motion if it clarifies query-to-citation flow.

Spline or 3D visuals are optional and should be used only if a 3D EvidenceOS engine hero materially improves understanding. It should not distract from audit/provenance clarity.

Screenshot/report mockup generation should use real UI empty states or real data only. It should never invent biomedical claims.

## Premium Visual Upgrade Roadmap

### Phase V1: Design Tokens and Premium Hero System

Define tokens for color, typography, spacing, surfaces, borders, status states, and source/provenance badges. Create a hero system centered on EvidaraOS as an evidence intelligence platform.

### Phase V2: Evidence / Audit / Source Diagrams

Build source registry map, query-to-citation flow, audit ledger timeline, and evidence promotion diagrams. Use static architecture and empty states until real data exists.

### Phase V3: Product Workspace Visual Polish

Polish `/app` and `/admin` scaffold layouts with authenticated-workspace patterns while keeping clear backend/auth limitations.

### Phase V4: Report Preview Design

Design a report anatomy shell with required sections, source appendix, methodology, limitations, and audit trail. Do not populate fake claims.

### Phase V5: Motion / Animation Layer

Add small motion only where it clarifies source retrieval, candidate review, or audit progression.

### Phase V6: Optional 3D / Advanced Visuals

Consider 3D only after source, audit, and report visuals are strong. The priority remains buyer trust, not spectacle.
