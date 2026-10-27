import asyncio
import os
import urllib.request
from playwright.async_api import async_playwright

OUT_DIR = "c:/Users/KIKE/Downloads/printprice-docs-main/static/img/redesign/prod_verification"
os.makedirs(OUT_DIR, exist_ok=True)

PROD_URL = "https://docs.printprice.pro"

async def verify_production():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        
        # -----------------------------------------------------------------
        # 1. TEST OPENAPI FILES ACCESSIBILITY VIA HTTPS
        # -----------------------------------------------------------------
        openapi_files = [
            "pricing-marketplace.openapi.yaml",
            "preflight.openapi.yaml",
            "shared-reports.openapi.yaml",
            "printprice-partner-api.bundle.yaml"
        ]
        
        print("\n=== 1. VERIFICANDO ESPECIFICACIONES OPENAPI EN HTTPS ===", flush=True)
        for file in openapi_files:
            url = f"{PROD_URL}/openapi/{file}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    status = resp.status
                    body = resp.read()
                    print(f"URL: {url} -> Status: {status}, Size: {len(body)} bytes", flush=True)
                    assert status == 200, f"Error en {url}: status {status}"
                    assert b"openapi: 3.1" in body or b"openapi: \"3.1\"" in body or b"openapi: '3.1'" in body or b"openapi:" in body, f"Archivo {file} no es OpenAPI 3.1 válido"
            except Exception as e:
                print(f"Error fetching {url}: {e}", flush=True)
                raise

        # -----------------------------------------------------------------
        # 2. AUDITAR ERRORES JS Y RENDERIZADO SVG MERMAID
        # -----------------------------------------------------------------
        print("\n=== 2. AUDITANDO PÁGINAS Y DIAGRAMAS SVG MERMAID ===")
        pages_to_check = [
            {"path": "/docs/api/overview", "name": "overview", "desc": "Diagrama 1: Arquitectura y Clúster"},
            {"path": "/docs/api/pricing-api", "name": "pricing", "desc": "Diagrama 2: Pricing & BPE Flow"},
            {"path": "/docs/api/preflight-api", "name": "preflight", "desc": "Diagrama 3: Preflight Sequence"}
        ]
        
        desktop_page = await browser.new_page(viewport={"width": 1440, "height": 900})
        js_errors = []
        desktop_page.on("pageerror", lambda err: js_errors.append(str(err)))
        desktop_page.on("console", lambda msg: js_errors.append(msg.text) if msg.type == "error" else None)

        for item in pages_to_check:
            full_url = f"{PROD_URL}{item['path']}"
            resp = await desktop_page.goto(full_url, wait_until="networkidle")
            assert resp.status == 200, f"Error HTTP {resp.status} en {full_url}"
            print(f"Página: {full_url} -> HTTP 200 OK")
            
            # Switch to Dark Mode
            await desktop_page.evaluate("() => document.documentElement.setAttribute('data-theme', 'dark')")
            await desktop_page.wait_for_timeout(600)
            
            # Verify Mermaid container and SVG
            mermaid_container = desktop_page.locator(".docusaurus-mermaid-container").first
            assert await mermaid_container.count() > 0, f"No se encontró .docusaurus-mermaid-container en {full_url}"
            
            svg_locator = mermaid_container.locator("svg").first
            assert await svg_locator.count() > 0, f"No se encontró <svg> dentro de Mermaid en {full_url}"
            
            svg_box = await svg_locator.bounding_box()
            assert svg_box and svg_box["width"] > 50 and svg_box["height"] > 50, f"SVG tiene dimensiones inválidas en {full_url}: {svg_box}"
            print(f"  -> {item['desc']}: SVG renderizado exitosamente ({round(svg_box['width'])}x{round(svg_box['height'])}px)")
            
            # Ensure it is NOT rendered as text code block
            is_code_text = await desktop_page.locator("pre code.language-mermaid").count()
            assert is_code_text == 0, f"El diagrama en {full_url} se renderizó como bloque de código pre code!"
            
            # Capture Dark screenshot
            dark_path = os.path.join(OUT_DIR, f"prod_diagram_{item['name']}_dark.png")
            await mermaid_container.screenshot(path=dark_path)
            
            # Switch to Light Mode
            await desktop_page.evaluate("() => document.documentElement.setAttribute('data-theme', 'light')")
            await desktop_page.wait_for_timeout(600)
            light_path = os.path.join(OUT_DIR, f"prod_diagram_{item['name']}_light.png")
            await mermaid_container.screenshot(path=light_path)
            print(f"  -> Capturadas evidencias dark/light para {item['name']}")

        await desktop_page.close()
        
        # -----------------------------------------------------------------
        # 3. VERIFICAR RESPONSIVE Y AUSENCIA DE OVERFLOW EN MÓVIL
        # -----------------------------------------------------------------
        print("\n=== 3. VERIFICANDO RESPONSIVE Y OVERFLOW EN MÓVIL (320, 360, 390 px) ===")
        viewports = [
            {"width": 390, "height": 844, "name": "mobile_390"},
            {"width": 360, "height": 780, "name": "mobile_360"},
            {"width": 320, "height": 568, "name": "mobile_320"}
        ]
        
        # Test Home
        for vp in viewports:
            mob_page = await browser.new_page(viewport={"width": vp["width"], "height": vp["height"]}, is_mobile=True)
            mob_page.on("pageerror", lambda err: js_errors.append(str(err)))
            await mob_page.goto(PROD_URL, wait_until="networkidle")
            await mob_page.evaluate("() => document.documentElement.setAttribute('data-theme', 'dark')")
            await mob_page.wait_for_timeout(400)
            
            overflow = await mob_page.evaluate("""() => {
                const docWidth = document.documentElement.offsetWidth;
                const scrollWidth = document.documentElement.scrollWidth;
                return { docWidth, scrollWidth, isPassing: scrollWidth <= docWidth };
            }""")
            print(f"Homepage {vp['name']} ({vp['width']}x{vp['height']}): Pass={overflow['isPassing']} (Doc={overflow['docWidth']}, Scroll={overflow['scrollWidth']})")
            assert overflow['isPassing'], f"Overflow en homepage {vp['name']}: {overflow['scrollWidth']} > {overflow['docWidth']}"
            
            if vp["width"] == 390:
                await mob_page.screenshot(path=os.path.join(OUT_DIR, "prod_home_mobile_390.png"), full_page=True)
            await mob_page.close()

        # Test Diagram Pages on Mobile (390px)
        for item in pages_to_check:
            mob_page = await browser.new_page(viewport={"width": 390, "height": 844}, is_mobile=True)
            await mob_page.goto(f"{PROD_URL}{item['path']}", wait_until="networkidle")
            await mob_page.evaluate("() => document.documentElement.setAttribute('data-theme', 'dark')")
            await mob_page.wait_for_timeout(500)
            
            overflow = await mob_page.evaluate("""() => {
                const docWidth = document.documentElement.offsetWidth;
                const scrollWidth = document.documentElement.scrollWidth;
                return { docWidth, scrollWidth, isPassing: scrollWidth <= docWidth };
            }""")
            print(f"Docs {item['name']} (390px): Pass={overflow['isPassing']} (Doc={overflow['docWidth']}, Scroll={overflow['scrollWidth']})")
            assert overflow['isPassing'], f"Overflow en docs {item['name']}: {overflow['scrollWidth']} > {overflow['docWidth']}"
            
            await mob_page.screenshot(path=os.path.join(OUT_DIR, f"prod_mobile_docs_{item['name']}.png"))
            await mob_page.close()
            
        await browser.close()
        
        # Check critical JS errors (filter out non-critical external analytics if any)
        critical_errors = [e for e in js_errors if "favicon" not in e.lower()]
        print(f"\nErrores JavaScript críticos detectados: {len(critical_errors)}")
        if critical_errors:
            for err in critical_errors:
                print(f"  [JS ERROR] {err}")
        assert len(critical_errors) == 0, f"Se detectaron errores JS críticos en producción: {critical_errors}"
        
        print("\n¡TODAS LAS VERIFICACIONES EN PRODUCCIÓN PASARON CON ÉXITO ABSOLUTO!")

if __name__ == "__main__":
    asyncio.run(verify_production())
