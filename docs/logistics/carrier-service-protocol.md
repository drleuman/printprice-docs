---
title: Carrier Integration Protocol & Service Conditions
sidebar_label: Carrier Service Protocol
---

# PrintPriceOS — Protocolo de Integración y Condiciones de Servicio de Transporte

Este protocolo establece los estándares operativos vinculantes, requisitos de entrega en muelles editoriales y condiciones de tarificación aplicables a los servicios de transporte contratados a través o en nombre de la red industrial de manufactura **PrintPriceOS**.

> **Referencia Documental:** `PPOS-LOG-SLA-2026.1`  
> **Descarga PDF Oficial DIN A4 (Control Plane):** `GET /api/logistics/carrier-protocol/pdf`

---

## 1. Parámetros de Facturación y Conversión Volumétrica

1. **Régimen de Tasación por Metro Lineal de Carga (LDM):**
   * **Equivalencia unitaria:** `1 Euro-Palet EPAL (1.200 × 800 mm) = 0,40 LDM`.
   * **Ratio masa/volumen estándar:** `1 LDM = 1.850 kg` tasables.
   * **Cálculo de masa tasable por palet:** `Masa tasable = max(Masa bruta real, 740 kg)`.
   * **Condición de apilabilidad (*Strict LDM*):** Las expediciones editoriales son por defecto **no apilables en tránsito** (`STRICT_LDM_NON_STACKABLE`), salvo en semirremolques equipados con sistema de doble piso (*Doppelstock* / `DOUBLE_DECK_TRAILER`).

2. **Segregación Estricta de Costes:**
   * La tarifa de transporte cubre exclusivamente el porte, seguros y recargos aplicables (combustible y peajes).
   * Los consumibles de embalaje (cajas de cartón doble canal **FEFCO 0201**, flejes, cantoneras/esquineras y film estirable) forman parte del coste de fabricación/taller y no admiten recargos de manipulación por parte del transportista.

---

## 2. Cumplimiento Operativo en Hubs Editoriales Europeos

Las expediciones dirigidas a plataformas de distribución editorial y centros de fulfillment deben cumplir estrictamente las directrices físicas de recepción de cada centro. El transportista es responsable de respetar la ventana horaria asignada.

| Centro de Destino | Altura Máxima Carga | Masa Máxima | Requisito Crítico de Muelle | Ventana de Cita Previa (*Avis*) |
| :--- | :--- | :--- | :--- | :--- |
| **Zeitfracht Erfurt**<br/>`GLN: 4026635000006` | `1.200 mm`<br/>*(palet incluido)* | `1.000 kg` | Retranqueo perimetral interior de `>= 30 mm` (*zero overhang*). Cajas alineadas dentro del borde de las tablas del palet. | **Obligatoria `>= 48 h` antes de la entrega**. Notificación telemática de matrícula y franja horaria. |
| **VVA Arvato Gütersloh**<br/>`GLN: 4002693000002` | `1.300 mm`<br/>*(palet incluido)* | `700 kg` | Capa superior plana obligatoria (`requiresFlatTopLayer: true`). Cajas de pico o media capa deben situarse en capas intermedias. | **Obligatoria `>= 24 h`**. Reserva de slot de descarga en portal de proveedores. |
| **Amazon EU FBA**<br/>`GLN: 5450534000007` | Según ASIN / Cita (`<= 1.800 mm`) | Masa máx. por caja: `<= 15,0 kg` | Paletizado normalizado EUR-1. Prohibido remonte sin film de seguridad. | **Obligatoria vía Carrier Central (CARP)**. Cita vinculada a PO e ID de envío FBA. |

*Cualquier retraso, rechazo en muelle o sobrecoste derivado del incumplimiento de la cita previa reservada por falta imputable al transportista será repercutido según las condiciones contractuales.*

---

## 3. Circuito de Paletería EPAL y Vales de Canje (*Palettenschein*)

1. **Modalidad de Intercambio Inmediato (`1:1`):**
   En el momento de la carga en taller, el transportista debe entregar en muelle el mismo número de Euro-palets **EPAL** (`1.200 × 800 mm`, norma **UIC 435-2**) en estado apto para uso industrial (categoría A/B, sin tablas rotas ni clavos salientes).

2. **Vale de Intercambio (*Palettenschein* — Plazo improrrogable de 14 días):**
   Si en el momento de la recogida el transportista no dispone de palets vacíos para canje directo:
   * El taller emitirá un vale formal de paletería registrado en la Sección 4 del Albarán de Entrega DIN A4 (*Lieferschein*).
   * El transportista dispone de un plazo improrrogable de **14 días naturales** para retornar el saldo de palets deudores en las instalaciones del taller emisor o en el centro de consolidación designado.
   * **Penalización por no restitución:** Vencido el plazo de 14 días sin restitución física, los palets se liquidarán automáticamente a razón de **15,00 EUR / ud.** más IVA en la siguiente facturación de portes.

---

## 4. Trazabilidad Documental y Requisitos de Escaneo

1. **Etiquetado GS1-128 SSCC-18 (NVE):**
   * Cada palet cuenta con una etiqueta física (formato térmico **A6 `105 × 148 mm`** o pliego **DIN A4 4-UP**) con código de barras **GS1-128 Subset C** e Identificador de Aplicación `(00)`.
   * El transportista debe escanear el código SSCC-18 en el momento de la recogida y en cada punto de transbordo (*cross-docking*).
   * La etiqueta no debe ser rasgada, tapada con precinto opaco ni deteriorada durante el tránsito.

2. **Confirmación de Entrega (POD / CMR):**
   * **Vía Telemática (Recomendada):** Notificación de entrega (*milestone webhook*) vía API con código SSCC-18, marca de tiempo ISO-8601 y coordenadas GPS en un plazo inferior a **2 horas** tras la descarga.
   * **Vía Documental Física:** En ausencia de integración API, el transportista debe custodiar el ejemplar del Albarán de Entrega DIN A4 (*Lieferschein*), debidamente firmado y sellado por el receptor en el recuadro correspondiente (sección POD), remitiendo copia digitalizada en un plazo máximo de **24 horas**.

---

## 5. Acuse de Recibo y Adhesión

| Datos de la Empresa Transportista | Conformidad Operativa |
| :--- | :--- |
| **Razón Social:** | **Firma autorizada y sello:** |
| **CIF / NIF / VAT:** | |
| **Representante Legal / Operativo:** | |
| **Canal de notificación de tracking (Email / API Endpoint):** | **Fecha:** |

---

## 6. Generación Programática del Protocolo en PDF (Control Plane API)

El Control Plane expone el generador vectorial nativo del protocolo en formato DIN A4 listo para firma:

```http
GET /api/logistics/carrier-protocol/pdf?carrierName=DACHSER%20SE&carrierVatId=DE123456789
Authorization: Bearer <JWT_TOKEN>
```

* **Cabeceras de respuesta:**
  * `Content-Type: application/pdf`
  * `Content-Disposition: inline; filename="ppos-carrier-service-protocol-A4.pdf"`
  * `X-PPOS-Protocol-Version: PPOS-LOG-SLA-2026.1`

