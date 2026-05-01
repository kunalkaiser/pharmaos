# Premium Website Visual Audit

## Purpose

This audit reviews the current EvidaraOS public website from a premium enterprise biotech/pharma presentation perspective. It is intentionally a planning document only. It does not approve fake dashboards, fake evidence, fake citations, fake customers, or copied visual systems.

## Current Visual State

The website is structurally credible: it has separate public pages for platform, solutions, evidence engine, methodology, trust, resources, company, and demo. It also has internal `/app` and `/admin` route boundaries. The main weakness is presentation density. Many sections explain the product in text, but few let a pharma buyer quickly see the evidence workflow, source lineage, query audit trail, or report structure.

## Main Gaps

### Text-Heavy Sections

Several pages rely on paragraph copy and card groups. This makes the site honest, but it does not yet feel like high-end enterprise software. Buyers need visible proof of how EvidaraOS moves from question to source candidates to citations, review, and output.

Recommended direction: add real workflow diagrams, source maps, audit timeline visuals, and blank-state product frames that show structure without inventing data.

### Weak Visual Hierarchy

The current hierarchy is clean but flat. Cards often have similar weight, and page sections can feel equivalent even when one concept is more important. The site needs stronger first-screen composition, clearer product architecture anchors, and more deliberate use of contrast.

Recommended direction: create a premium hero system with one dominant platform promise, one structured product visual, and one focused next action.

### Missing Product Screenshots / Diagrams

The public site should not show fake product data. However, it can show authentic blank-state UI, architecture diagrams, query audit flow, source registry maps, and report anatomy diagrams.

Recommended direction: build custom React/SVG diagrams from actual product architecture and route boundaries, not stock imagery or fake screenshots.

### Missing Data / Source / Audit Visuals

EvidaraOS differentiates on provenance, but provenance is not yet visually dominant. The public site should show the chain:

`query -> public sources -> evidence candidates -> citation review -> evidence record -> packet/report`

Recommended direction: use source chips, citation badges, candidate-only labels, and audit ledger rows as recurring visual motifs.

### Missing Premium Hero Image

The current site should not use generic stock photography. A better hero image would be a custom product-style visual: source map, evidence graph, or command-center surface. It should be clearly structural and should not pretend to show live customer data.

Recommended direction: design a custom EvidaraOS visual system in Figma before major frontend redesign.

### Missing Report Preview Visuals

The resources page now avoids fake evidence rows. The next visual step is a report anatomy preview with blank/field-level placeholders: source appendix, methodology section, limitation notes, review state, and audit trail.

Recommended direction: create a report layout shell that shows required fields without sample biomedical claims.

### Trust / Provenance Graphics

Trust is central but mostly textual. The site needs visual treatment for:

- source identity
- confidence/provenance status
- human review
- limitation notes
- audit events
- candidate-only versus final evidence record

Recommended direction: use a consistent provenance panel component across methodology, trust, resources, and future app workspace pages.

### Layout Density

Enterprise SaaS buyers benefit from dense but scannable layouts. The current pages are orderly, but the visual density is often card-driven rather than workflow-driven.

Recommended direction: shift some card groups into structured systems: matrices, swimlanes, timelines, source maps, and report anatomy panels.

### Responsive Concerns Visible From Code

Most layouts use responsive grids and should degrade safely. The risk is not breakage; it is information sequencing. On mobile, card stacks can bury the key buyer story.

Recommended direction: define mobile-first ordering for each strategic visual: promise, workflow, proof, limitation, action.

## Page-Level Notes

Home should show the platform in action without fake results. A query-to-source-candidate flow is stronger than additional prose.

Platform and Evidence Engine should show the EvidenceOS operating model as architecture, not agent-themed novelty.

Data & Methodology should show source categories, provenance metadata, and claim-promotion rules.

Security / Trust should avoid certification-style claims unless certifications are achieved. It can show trust principles, access boundary, redaction, and audit design.

Resources should explain what a real packet must contain and avoid fake sample claims.

Demo should stay focused on request/access workflow until authenticated product functionality is real.

## Design Risk

The largest risk is making the site look more premium by adding fake product screens, fake charts, or synthetic evidence. That would damage enterprise trust. Premium design should come from clarity, hierarchy, source/provenance visuals, and honest empty states.
