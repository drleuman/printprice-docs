---
title: Matchmaker Engine
---

# Matchmaker Engine

The **Matchmaker Engine** is responsible for selecting the optimal printer for a given production job.

It operates after the document has passed through pricing, preflight validation, and production intelligence analysis.

The Matchmaker transforms compatibility results into a final production routing decision.

---

## Purpose

The goal of the Matchmaker Engine is to determine which printer in the network is best suited to produce the job.

The decision is based on a weighted evaluation of several factors.

---

## Candidate Evaluation

Each available printer is evaluated against the job using multiple scoring dimensions.

### Physical Compatibility

Determines whether the printer can physically produce the job.

Checks include:

- supported binding types
- format limits
- page count limits
- supported paper grammage

---

### Operational Compatibility

Determines whether the job respects the technical production constraints of the printer.

Examples include:

- TAC limits
- minimum image resolution
- bleed requirements
- color compatibility

---

### Commercial Suitability

Evaluates whether the printer is economically suitable for the job.

Factors may include:

- relative pricing
- printer cost index
- geographic considerations
- production capacity

---

## Weighted Scoring

Each printer receives a score calculated from weighted dimensions.

Typical dimensions include:

- physical score
- operational score
- commercial score

These scores are combined into an overall compatibility score.

---

## Threshold Enforcement

The Matchmaker can enforce minimum thresholds to ensure safe routing.

For example:

- minimum physical compatibility
- minimum overall score

Printers that fail these thresholds are excluded from consideration.

---

## Tie-Breaking Logic

If multiple printers achieve similar compatibility scores, additional rules may apply.

These can include:

- cost preference
- geographic proximity
- network priority rules

This ensures consistent and explainable decisions.

---

## Final Decision

The output of the Matchmaker includes:

- selected printer
- compatibility scores
- rejected candidates
- explanation of the routing decision

This transparency is critical for trust in automated production workflows.

---

## Strategic Importance

The Matchmaker Engine transforms PrintPrice from a simple analysis tool into a **production routing platform**.

By automating the selection of manufacturing partners, the system enables scalable print networks and intelligent production orchestration.

