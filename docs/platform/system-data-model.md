---
title: System Data Model
---

# PrintPrice System Data Model

The PrintPrice platform operates around a structured data model designed to represent the full lifecycle of a print production job.

This model allows different engines of the platform to exchange information in a deterministic and consistent way.

---

## Core Entities

The system revolves around several primary entities.

### Document

Represents the uploaded PDF file.

Key attributes include:

- file identifier
- page count
- trim size
- bleed values
- color spaces
- image resolution
- total ink coverage

These attributes are extracted by the Preflight Engine.

---

### Production Job

A production job represents a manufacturable unit within the platform.

Attributes include:

- document reference
- production specification
- requested quantity
- selected binding type
- paper specifications
- estimated price

The job is the central object that moves through the production pipeline.

---

### Production Specification

Defines the intended production parameters for a job.

Typical attributes:

- trim size
- binding type
- interior paper
- cover paper
- printing type (color / black & white)
- finishing options

This specification is validated against the document during Production Intelligence analysis.

---

### Printer

Represents a production partner within the PrintPrice network.

Attributes include:

- supported formats
- binding capabilities
- page count limits
- supported grammages
- pricing models
- production capacity

Printers are evaluated by the Matchmaker Engine.

---

### Compatibility Evaluation

Represents the compatibility score between a production job and a printer.

Attributes include:

- physical compatibility score
- operational compatibility score
- commercial suitability score
- overall compatibility score
- blocking reasons

These evaluations form the basis for printer selection.

---

## Data Flow

The entities interact through the production pipeline:

Document → Preflight Analysis → Production Intelligence → Compatibility Engine → Matchmaker → Production Routing

Each stage enriches the job with additional data.

---

## Structured Reporting

The platform generates structured reports containing:

- findings
- compatibility scores
- production intelligence results
- routing decisions

These reports can be used for both human review and automated workflows.

---

## Extensibility

The data model is designed to evolve as new capabilities are introduced.

Future extensions may include:

- logistics entities
- delivery scheduling
- supplier reliability metrics
- sustainability metrics

This flexible architecture allows PrintPrice to expand beyond pricing into full production orchestration.

