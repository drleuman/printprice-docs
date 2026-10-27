# PrintPrice OS — Guía de Diagramación Técnica y Accesibilidad

## 1. Reglas Inviolables de Identidad Visual

- **Acento Rojo**: Usar exclusivamente el rojo corporativo de PrintPrice OS (`#E53935`), con variaciones controladas para hover (`#FF5252`) y sombras profundas (`#B71C1C`).
- **Prohibición de Azules y Cian**: Ningún diagrama debe emplear azul (`#0000FF`, `#1E88E5`, `#2196F3`), cian (`#00BCD4`) o morados. Los acentos neutros se limitan estrictamente a grises pizarra (`#64748B`, `#94A3B8`, `#334155`).
- **Contraste WCAG AA**: Las etiquetas de texto sobre fondo oscuro (`#151820` o `#0B0D12`) deben tener contraste mínimo de 4.5:1. Usar siempre blanco puro (`#FFFFFF`) o blanco hueso (`#F8FAFC`).

## 2. Responsividad y Escalamiento en Pantallas Móviles

- **SVG Flexible**: Todo diagrama exportado o renderizado debe evitar anchos fijos en píxeles. El contenedor en CSS debe definir `overflow-x: auto; -webkit-overflow-scrolling: touch; max-width: 100%;`.
- **Densidad de Nodos**:
  - Evitar diagramas de flujo con más de 4 nodos horizontales consecutivos sin salto de línea (`direction TB` preferido sobre `direction LR` en diagramas complejos para adaptarse mejor a pantallas verticales de 360px a 390px).
  - Usar subgrafos lógicos para agrupar capas perimetrales, servicios y almacenamiento.

## 3. Principio de Verdad de Código

- Cada caja, flecha y etiqueta debe corresponder a un componente real verificado en los repositorios de PrintPrice OS:
  - Gateway: `api.printprice.pro`
  - Control Plane: Fastify Router (:8080)
  - Preflight Service: FastAPI / Python microservice (:8001)
  - Book Pricing Engine: BPE (:8004)
  - Base de Datos: MySQL y Redis
  - Webhook Worker: Outbox dispatcher con HMAC-SHA256 (`X-PPOS-Signature`)
