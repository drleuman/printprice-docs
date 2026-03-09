---
title: Production Routing
---

# Production Routing

Production Routing is the stage where PrintPrice determines which printer in the network is the best destination for a manufacturing job.

This happens after pricing, preflight, and production intelligence have already enriched the document.

---

## Purpose

The purpose of routing is to convert a validated production job into a real manufacturing recommendation.

The system aims to answer:

- Which printer can produce the job?
- Which printer is safest?
- Which printer is economically strongest?
- Which printer should be selected?

---

## Inputs to Routing

The routing decision is informed by:

- production specification
- PDF analysis results
- production intelligence outputs
- compatibility evaluations
- pricing signals

---

## Routing Logic

The routing system compares available printers and scores them based on:

- physical feasibility
- technical suitability
- commercial strength

The Matchmaker then selects the best route.

---

## Output

The final output of routing is:

- selected printer
- compatibility explanation
- rejected candidates
- structured reasoning

This creates an auditable production decision.

