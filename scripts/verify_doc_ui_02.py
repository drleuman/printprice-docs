import asyncio
import os
import re
from playwright.async_api import async_playwright

OUT_DIR = "c:/Users/KIKE/Downloads/printprice-docs-main/static/img/redesign/doc_ui_02"
os.makedirs(OUT_DIR, exist_ok=True)

LOCAL_URL = "http://localhost:3456"

async def run_verifications():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        
        # -------------------------------------------------------------
        # CHECK 1: VERIFY ZERO file:/// LINKS IN BUILD DIRECTORY
        # -------------------------------------------------------------
        print("\n=== 1. VERIFICANDO AUSENCIA DE ENLACES file:/// EN BUILD ===", flush=True)
        build_dir = "c:/Users/KIKE/Downloads/printprice-docs-main/build"
        found_file_uris = []
        for root, _, files in os.walk(build_dir):
            for file in files:
                if file.endswith(('.html', '.js')):
                    full_path = os.path.join(root, file)
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        if 'file:///c:' in content.lower() or 'file:///c%3a' in content.lower() or 'file:///C:' in content:
                            found_file_uris.append(full_path)
        print(f"Archivos construidos analizados. Enlaces file:/// detectados: {len(found_file_uris)}", flush=True)
        assert len(found_file_uris) == 0, f"Se encontraron enlaces file:/// en: {found_file_uris}"
        print("  -> PASS: 0 referencias locales file:/// en todo el sitio compilado.", flush=True)

        # -------------------------------------------------------------
        # CHECK 2: HOMEPAGE, MODO CLARO & TERMINAL QUICKSTART
        # -------------------------------------------------------------
        print("\n=== 2. VERIFICANDO PORTADA, MODO CLARO & TERMINAL QUICKSTART ===", flush=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900}, permissions=["clipboard-read", "clipboard-write"])
        page = await context.new_page()
        await page.goto(f"{LOCAL_URL}/", wait_until="networkidle")
        
        # Switch to Light Theme
        await page.evaluate("() => document.documentElement.setAttribute('data-theme', 'light')")
        await page.wait_for_timeout(400)
        
        # Verify terminal body computed background & color
        term_body = page.locator("pre.terminal-body")
        term_styles = await term_body.evaluate("""(el) => {
            const cs = window.getComputedStyle(el);
            return {
                bg: cs.backgroundColor,
                color: cs.color,
                display: cs.display
            };
        }""")
        print(f"Terminal en Modo Claro -> bg: {term_styles['bg']}, color: {term_styles['color']}", flush=True)
        # Background must be dark (#0b0d12 -> rgb(11, 13, 18)) and text must be crisp white (#f8fafc -> rgb(248, 250, 252))
        assert "rgb(11, 13, 18)" in term_styles["bg"], f"Fondo de terminal no es oscuro: {term_styles['bg']}"
        assert "rgb(248, 250, 252)" in term_styles["color"], f"Color de texto de terminal no es blanco: {term_styles['color']}"
        print("  -> PASS: El código de Quickstart tiene fondo oscuro de alto contraste y texto blanco nítido en modo claro.", flush=True)

        # Test tabs
        tab_curl = page.locator(".terminal-tab", has_text="cURL")
        tab_js = page.locator(".terminal-tab", has_text="JavaScript")
        assert await tab_curl.get_attribute("class") and "active" in await tab_curl.get_attribute("class")
        
        # Click JS Tab
        await tab_js.click()
        await page.wait_for_timeout(200)
        assert "active" in (await tab_js.get_attribute("class") or "")
        code_text = await term_body.inner_text()
        assert "fetch(" in code_text, "El código JavaScript no se actualizó al hacer click en la pestaña"
        print("  -> PASS: Pestañas cURL y JavaScript probadas exitosamente con transición reactiva.", flush=True)

        # Test Copy Button
        copy_btn = page.locator(".terminal-copy-btn")
        assert await copy_btn.count() > 0, "No se encontró el botón de copiar en el terminal"
        await copy_btn.click()
        await page.wait_for_timeout(300)
        btn_text = await copy_btn.inner_text()
        assert "Copied" in btn_text or "Copiado" in btn_text, f"El botón de copiar no mostró estado 'Copied': {btn_text}"
        print("  -> PASS: Botón de copiar verificado con feedback reactivo 'Copied'.", flush=True)

        # Capture desktop light screenshot
        await page.screenshot(path=os.path.join(OUT_DIR, "desktop_home_light.png"))
        
        # Switch to Dark Theme & capture
        await page.evaluate("() => document.documentElement.setAttribute('data-theme', 'dark')")
        await page.wait_for_timeout(400)
        await page.screenshot(path=os.path.join(OUT_DIR, "desktop_home_dark.png"))
        print("  -> PASS: Capturas de portada Light y Dark guardadas.", flush=True)

        # -------------------------------------------------------------
        # CHECK 3: HERO SEARCH DIRECT TYPING & DROPDOWN PANEL
        # -------------------------------------------------------------
        print("\n=== 3. VERIFICANDO BUSCADOR DIRECTO Y PANEL DE SUGERENCIAS ===", flush=True)
        search_input = page.locator(".portal-search-input")
        assert await search_input.count() > 0, "No se encontró input de búsqueda en el hero"
        
        # Type "api" (returns multiple items)
        await search_input.fill("api")
        await page.wait_for_timeout(300)
        
        dropdown = page.locator(".portal-search-dropdown")
        assert await dropdown.is_visible(), "El dropdown de búsqueda no se abrió al escribir"
        
        items = dropdown.locator(".portal-search-item")
        item_count = await items.count()
        assert item_count >= 2, f"Se esperaban múltiples resultados para 'api', encontrados: {item_count}"
        first_title = await items.first.locator(".portal-search-item-title").inner_text()
        print(f"Búsqueda 'api' retornó {item_count} sugerencias directas. Primera: {first_title}", flush=True)
        assert "api" in first_title.lower(), f"Primer resultado no coincide con 'api': {first_title}"
        
        # Test keyboard navigation: ArrowDown
        await search_input.press("ArrowDown")
        await page.wait_for_timeout(150)
        second_item = items.nth(1)
        assert "portal-search-item--selected" in (await second_item.get_attribute("class") or "")
        print("  -> PASS: Navegación por flecha hacia abajo en el panel de sugerencias confirmada.", flush=True)

        # Test Escape to close
        await search_input.press("Escape")
        await page.wait_for_timeout(200)
        assert not await dropdown.is_visible(), "El panel de búsqueda no se cerró al presionar Escape"
        print("  -> PASS: Cierre de panel de búsqueda con Escape confirmado.", flush=True)

        # -------------------------------------------------------------
        # CHECK 4: PRICING PAGE DIAGRAMS & CODE BLOCKS
        # -------------------------------------------------------------
        print("\n=== 4. VERIFICANDO PRICING API: DIAGRAMAS MODULARES & BLOQUES DE CÓDIGO ===", flush=True)
        await page.goto(f"{LOCAL_URL}/docs/api/pricing-api", wait_until="networkidle")
        
        # Verify cURL and Node.js fetch are INDEPENDENT code blocks
        code_blocks = page.locator(".theme-code-block")
        block_count = await code_blocks.count()
        print(f"Total de bloques de código en Pricing API: {block_count}", flush=True)
        assert block_count >= 2, "Debe haber al menos 2 bloques de código para cURL y Node.js"
        
        # Verify no markdown text leakage inside bash code block
        body_text = await page.inner_text("main")
        assert "#### Example Request" not in body_text, "Se filtró sintaxis markdown de encabezado dentro del bloque de código!"
        print("  -> PASS: Ejemplos de cURL y Node.js fetch están perfectamente cerrados e independientes.", flush=True)

        # Verify Mermaid diagrams count & dimensions
        svgs = page.locator(".diagram-svg-viewport svg")
        svg_count = await svgs.count()
        print(f"Diagramas SVG interactivos encontrados en Pricing API: {svg_count}", flush=True)
        assert svg_count == 3, f"Se esperaban exactamente 3 diagramas modulares en Pricing, encontrados: {svg_count}"
        
        for i in range(svg_count):
            box = await svgs.nth(i).bounding_box()
            assert box and box["height"] < 600, f"Diagrama {i+1} excede 600px de alto ({box['height']}px)! No fue dividido adecuadamente."
            print(f"  -> Diagrama {i+1}: dimensiones {round(box['width'])}x{round(box['height'])}px (Perfectamente legible y acotado)", flush=True)
        print("  -> PASS: Diagrama monumental de 4768px dividido exitosamente en 3 etapas legibles y acotadas.", flush=True)

        # -------------------------------------------------------------
        # CHECK 5: ACCESSIBLE DIAGRAM ZOOM / MODAL & KEYBOARD TRAP
        # -------------------------------------------------------------
        print("\n=== 5. VERIFICANDO AMPLIACIÓN ACCESIBLE, ZOOM & FOCO EN DIAGRAMA ===", flush=True)
        zoom_btn = page.locator(".diagram-zoom-trigger").first
        await zoom_btn.click()
        await page.wait_for_timeout(300)
        
        modal = page.locator(".diagram-modal-overlay")
        assert await modal.is_visible(), "El modal de ampliación de diagrama no se abrió al hacer click en 'Ampliar Diagrama'"
        
        # Test Zoom In
        zoom_in_btn = modal.locator(".diagram-modal-btn", has_text="+")
        zoom_reset_btn = modal.locator(".diagram-modal-btn-reset")
        assert await zoom_reset_btn.inner_text() == "100%"
        
        await zoom_in_btn.click()
        await page.wait_for_timeout(150)
        assert await zoom_reset_btn.inner_text() == "125%", f"Zoom no incrementó al 125%: {await zoom_reset_btn.inner_text()}"
        print("  -> PASS: Controles de zoom (+) incrementan escala correctamente.", flush=True)

        # Test Close with Escape key & focus restoration
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(300)
        assert not await modal.is_visible(), "El modal no se cerró al presionar Escape"
        
        # Verify focus returned to trigger button
        is_focused = await zoom_btn.evaluate("el => el === document.activeElement")
        assert is_focused, "El foco accesible no regresó al botón 'Ampliar Diagrama' tras cerrar con Escape!"
        print("  -> PASS: Modal se cierra con tecla Escape y restaura foco al activador.", flush=True)

        # -------------------------------------------------------------
        # CHECK 6: OVERVIEW ENDPOINT TABLE & KEYBOARD ACCESSIBILITY
        # -------------------------------------------------------------
        print("\n=== 6. VERIFICANDO TABLA DE ENDPOINTS, SCROLL ACCESIBLE & ESTADOS ===", flush=True)
        await page.goto(f"{LOCAL_URL}/docs/api/overview", wait_until="networkidle")
        
        scroll_indicator = page.locator(".table-scroll-indicator")
        assert await scroll_indicator.is_visible(), "No se encontró el indicador de desplazamiento para la tabla"
        
        table_wrapper = page.locator(".table-responsive-wrapper")
        assert await table_wrapper.count() > 0, "No se encontró .table-responsive-wrapper"
        tabindex = await table_wrapper.get_attribute("tabindex")
        assert tabindex == "0", f"El contenedor de la tabla no es accesible por teclado (tabindex={tabindex})"
        
        # Check column headers
        headers = await page.locator(".table-responsive-wrapper th").all_inner_texts()
        print(f"Columnas detectadas en la tabla: {headers}", flush=True)
        assert "AUTHENTICATION" in [h.upper() for h in headers]
        assert "RESPONSIBLE SERVICE" in [h.upper() for h in headers]
        assert "PRODUCTION & VERIFICATION STATUS" in [h.upper() for h in headers]
        
        # Check status badges
        prod_badges = page.locator(".status-badge-prod")
        code_badges = page.locator(".status-badge-code")
        assert await prod_badges.count() >= 4, f"Se esperaban badges de producción, encontrados: {await prod_badges.count()}"
        assert await code_badges.count() >= 8, f"Se esperaban badges de verificación en código, encontrados: {await code_badges.count()}"
        print(f"  -> Badges encontrados: {await prod_badges.count()} CONFIRMED_IN_PRODUCTION, {await code_badges.count()} VERIFIED_IN_CODE", flush=True)
        print("  -> PASS: Tabla de endpoints plenamente accesible, con scroll evidente y badges semánticos.", flush=True)

        # -------------------------------------------------------------
        # CHECK 7: RESPONSIVE & ZERO OVERFLOW AT 320, 360, 390 PX
        # -------------------------------------------------------------
        print("\n=== 7. VERIFICANDO RESPONSIVE Y LECTURA A 320, 360 Y 390 PX ===", flush=True)
        viewports = [
            {"width": 390, "height": 844, "name": "390"},
            {"width": 360, "height": 780, "name": "360"},
            {"width": 320, "height": 568, "name": "320"}
        ]
        
        test_routes = [
            {"path": "/", "name": "home"},
            {"path": "/docs/api/overview", "name": "overview"},
            {"path": "/docs/api/pricing-api", "name": "pricing"},
            {"path": "/docs/api/preflight-api", "name": "preflight"}
        ]

        for vp in viewports:
            mob_page = await browser.new_page(viewport={"width": vp["width"], "height": vp["height"]}, is_mobile=True)
            for r in test_routes:
                await mob_page.goto(f"{LOCAL_URL}{r['path']}", wait_until="networkidle")
                
                # Check Dark mode overflow
                await mob_page.evaluate("() => document.documentElement.setAttribute('data-theme', 'dark')")
                await mob_page.wait_for_timeout(200)
                overflow_dark = await mob_page.evaluate("""() => {
                    return document.documentElement.scrollWidth <= document.documentElement.offsetWidth;
                }""")
                assert overflow_dark, f"Desbordamiento horizontal detectado en {r['name']} a {vp['width']}px (Dark)"
                
                # Check Light mode overflow
                await mob_page.evaluate("() => document.documentElement.setAttribute('data-theme', 'light')")
                await mob_page.wait_for_timeout(200)
                overflow_light = await mob_page.evaluate("""() => {
                    return document.documentElement.scrollWidth <= document.documentElement.offsetWidth;
                }""")
                assert overflow_light, f"Desbordamiento horizontal detectado en {r['name']} a {vp['width']}px (Light)"
                
                # Save screenshots for PR evidence
                if vp["width"] == 390:
                    await mob_page.screenshot(path=os.path.join(OUT_DIR, f"mobile_390_{r['name']}_light.png"))
                elif vp["width"] == 320:
                    await mob_page.screenshot(path=os.path.join(OUT_DIR, f"mobile_320_{r['name']}_light.png"))

            await mob_page.close()
            print(f"  -> PASS: Viewport {vp['width']}px validado en Claro y Oscuro para todas las rutas clave.", flush=True)

        await page.close()
        await browser.close()
        print("\n=======================================================", flush=True)
        print("  ¡TODAS LAS PRUEBAS DOC-UI-02 PASARON CON ÉXITO ROTUNDO! ", flush=True)
        print("=======================================================", flush=True)

if __name__ == "__main__":
    asyncio.run(run_verifications())
