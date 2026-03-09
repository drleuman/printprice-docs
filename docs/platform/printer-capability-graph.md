
# Printer Capability Graph

```mermaid
flowchart LR

BOOK[Book Specification]

SIZE[Trim Size]
PAPER[Paper Type]
PRINT[Print Technology]
BIND[Binding]

BOOK --> SIZE
BOOK --> PAPER
BOOK --> PRINT
BOOK --> BIND

SIZE --> FILTER[Capability Filter]
PAPER --> FILTER
PRINT --> FILTER
BIND --> FILTER

FILTER --> PRINTERS[Compatible Printers]

```

