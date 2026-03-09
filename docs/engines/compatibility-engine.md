---
title: Compatibility Engine
---

# Compatibility Engine

The Compatibility Engine determines whether a specific print job can be manufactured by a given printer node.

Its role is to transform raw production requirements into an explainable compatibility decision.

---

## Purpose

The engine answers questions such as:

- Can this printer manufacture the requested format?
- Is the binding method supported?
- Is the paper range compatible?
- Are there operational or commercial constraints that block production?
- Which printer is the strongest candidate among all compatible options?

The result is not only a yes or no answer, but a structured evaluation.

---

## Inputs

The Compatibility Engine consumes structured inputs from multiple domains:

- production specification
- PDF technical analysis
- Production Intelligence output
- printer capability profiles
- pricing constraints
- operational rules

These inputs are normalized before scoring begins.

---

## Evaluation Layers

### Physical Compatibility

This layer checks hard manufacturing feasibility:

- trim size support
- page extent limits
- paper compatibility
- binding support
- finishing availability

If a job fails here, the printer is considered non-compatible.

### Technical Compatibility

This layer evaluates whether the uploaded document is technically suitable for the printer workflow:

- bleed expectations
- color profile alignment
- image resolution suitability
- font embedding status
- file preparation requirements

This layer may produce warnings even when the job remains feasible.

### Operational Compatibility

This layer checks non-physical factors such as:

- minimum and maximum run length
- production slot suitability
- regional constraints
- service restrictions
- workflow exclusions

### Commercial Compatibility

This layer compares the job against pricing and business constraints:

- cost viability
- margin thresholds
- route efficiency
- strategic partner fit

---

## Scoring Model

The engine uses weighted scoring to compare compatible printers.

Typical dimensions include:

- physical score
- technical score
- operational score
- commercial score

These dimensions can be combined into an overall compatibility score.

The platform can also define minimum thresholds that must be satisfied before a printer is considered selectable.

---

## Output

The Compatibility Engine returns structured output such as:

- compatibility status
- score breakdown
- blocking constraints
- warnings
- explainable reasoning
- normalized candidate data for the Matchmaker

This output is designed to support auditability.

---

## Explainability

A central requirement of the Compatibility Engine is explainability.

The platform should always be able to say:

- why a printer was accepted
- why a printer was rejected
- which factors reduced the score
- which constraints are hard blockers versus soft penalties

This is essential for trust and operational debugging.

---

## Relationship with the Matchmaker

The Compatibility Engine does not make the final production routing decision on its own.

Its role is to evaluate suitability.

The Matchmaker then compares the resulting candidates and selects the best route based on the weighted decision framework.

---

## Long-Term Evolution

Over time, the Compatibility Engine can become more sophisticated through:

- richer printer capability graphs
- historical production outcomes
- risk-adjusted scoring
- learning from rejection patterns
- policy-based routing layers

This makes it one of the core intelligence components of the PrintPrice platform.
