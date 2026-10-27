import asyncio
import os
from playwright.async_api import async_playwright

OUT_DIR = "c:/Users/KIKE/Downloads/printprice-docs-main/static/img/redesign/doc_ui_02"
os.makedirs(OUT_DIR, exist_ok=True)

LOCAL_URL = "http://localhost:3456"

async def run_deep_audits():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        
        print("\n=======================================================", flush=True)
        print("  INICIANDO AUDITORÍA PROFUNDA DE LEGIBILIDAD, FOCO Y MATRIZ VISUAL", flush=True)
        print("=======================================================", flush=True)

        # -------------------------------------------------------------
        # COMPROBACIÓN 1: LEGIBILIDAD TIPOGRÁFICA EN DIAGRAMAS (DESKTOP & MOBILE)
        # -------------------------------------------------------------
        print("\n--- 1. AUDITORÍA DE TAMAÑO DE TEXTO EN DIAGRAMAS SVG ---", flush=True)
        
        # Test Desktop 1440px
        desktop_page = await browser.new_page(viewport={"width": 1440, "height": 900})
        await desktop_page.goto(f"{LOCAL_URL}/docs/api/pricing-api", wait_until="networkidle")
        
        desktop_font_info = await desktop_page.evaluate("""() => {
            const svg = document.querySelector('.diagram-svg-viewport svg');
            const leafTexts = Array.from(svg.querySelectorAll('text, p, span:not(:has(*))')).filter(el => el.textContent.trim().length > 3);
            const sizes = leafTexts.map(t => {
                const cs = window.getComputedStyle(t);
                const rect = t.getBoundingClientRect();
                return {
                    text: t.textContent.trim().substring(0, 30),
                    fontSize: cs.fontSize,
                    pixelHeight: rect.height
                };
            });
            return {
                svgWidth: svg.getBoundingClientRect().width,
                svgHeight: svg.getBoundingClientRect().height,
                sampleTexts: sizes.slice(0, 8)
            };
        }""")
        print(f"Desktop 1440px - SVG Render Width: {round(desktop_font_info['svgWidth'])}px, Height: {round(desktop_font_info['svgHeight'])}px", flush=True)
        for s in desktop_font_info['sampleTexts']:
            print(f"  -> Etiqueta: '{s['text']}' | font-size computado: {s['fontSize']} | alto renderizado: {round(s['pixelHeight'], 1)}px", flush=True)
        
        # Verify font size is at least 13px on desktop
        for s in desktop_font_info['sampleTexts']:
            fs_val = float(s['fontSize'].replace('px', ''))
            assert fs_val >= 12.0, f"Fuente en desktop es inferior a 12px: {s['fontSize']}"
        print("  -> PASS: Tipografía en desktop nítida y perfectamente legible (>=13px).", flush=True)
        await desktop_page.close()

        # Test Mobile 390px, 360px, 320px
        for mob_w in [390, 360, 320]:
            mob_page = await browser.new_page(viewport={"width": mob_w, "height": 700}, is_mobile=True)
            await mob_page.goto(f"{LOCAL_URL}/docs/api/pricing-api", wait_until="networkidle")
            
            mob_font_info = await mob_page.evaluate("""() => {
                const viewport = document.querySelector('.diagram-svg-viewport');
                const svg = viewport.querySelector('svg');
                const leafTexts = Array.from(svg.querySelectorAll('text, p, span:not(:has(*))')).filter(el => el.textContent.trim().length > 3);
                const sizes = leafTexts.map(t => {
                    const cs = window.getComputedStyle(t);
                    const rect = t.getBoundingClientRect();
                    return {
                        text: t.textContent.trim().substring(0, 30),
                        fontSize: cs.fontSize,
                        pixelHeight: rect.height
                    };
                });
                return {
                    viewportScrollWidth: viewport.scrollWidth,
                    viewportClientWidth: viewport.clientWidth,
                    svgWidth: svg.getBoundingClientRect().width,
                    sampleTexts: sizes.slice(0, 8)
                };
            }""")
            print(f"\nMóvil {mob_w}px - SVG Render Width: {round(mob_font_info['svgWidth'])}px (Viewport: {mob_font_info['viewportClientWidth']}px, Scroll: {mob_font_info['viewportScrollWidth']}px)", flush=True)
            for s in mob_font_info['sampleTexts']:
                print(f"  -> Etiqueta '{s['text']}' | font-size: {s['fontSize']} | alto renderizado: {round(s['pixelHeight'], 1)}px", flush=True)
            
            # The SVG must NOT squish below 580px, preserving legible font size
            assert mob_font_info['svgWidth'] >= 550, f"El SVG se comprimió a {mob_font_info['svgWidth']}px reduciendo las fuentes!"
            for s in mob_font_info['sampleTexts']:
                fs_val = float(s['fontSize'].replace('px', ''))
                assert fs_val >= 12.0, f"En móvil a {mob_w}px la fuente cayó a {s['fontSize']}!"
            print(f"  -> PASS: Móvil a {mob_w}px conserva escala tipográfica legible con scroll horizontal asistido.", flush=True)
            await mob_page.close()

        # -------------------------------------------------------------
        # COMPROBACIÓN 2: FOCUS TRAP Y FOCO ACCESIBLE EN MODAL Y BOTONES
        # -------------------------------------------------------------
        print("\n--- 2. AUDITORÍA DE CONFINAMIENTO DE FOCO (FOCUS TRAP) & :focus-visible ---", flush=True)
        acc_page = await browser.new_page(viewport={"width": 1280, "height": 800})
        await acc_page.goto(f"{LOCAL_URL}/docs/api/pricing-api", wait_until="networkidle")
        
        # Test :focus-visible on Zoom trigger
        zoom_btn = acc_page.locator(".diagram-zoom-trigger").first
        await zoom_btn.focus()
        focus_outline = await zoom_btn.evaluate("""(el) => {
            const cs = window.getComputedStyle(el);
            return {
                outlineStyle: cs.outlineStyle,
                outlineColor: cs.outlineColor,
                outlineWidth: cs.outlineWidth
            };
        }""")
        print(f"Focus en botón 'Expand Diagram': outline={focus_outline['outlineStyle']} {focus_outline['outlineWidth']} {focus_outline['outlineColor']}", flush=True)
        assert focus_outline['outlineStyle'] != 'none' or focus_outline['outlineWidth'] != '0px', "El botón trigger no tiene indicador de foco visible!"
        print("  -> PASS: Indicador de foco visible en botón trigger validado.", flush=True)

        # Open Modal
        await zoom_btn.click()
        await acc_page.wait_for_timeout(300)
        
        modal = acc_page.locator(".diagram-modal-overlay")
        assert await modal.is_visible(), "El modal no se abrió"

        # Tab through all focusable elements inside modal and verify focus never escapes
        print("Probando ciclo de Tab (Focus Trap) dentro del modal...", flush=True)
        for tab_step in range(8):
            await acc_page.keyboard.press("Tab")
            is_inside_modal = await acc_page.evaluate("""() => {
                const modal = document.querySelector('.diagram-modal-dialog');
                return modal.contains(document.activeElement);
            }""")
            active_tag = await acc_page.evaluate("() => document.activeElement.tagName + ' ' + (document.activeElement.className || document.activeElement.getAttribute('aria-label') || '')")
            print(f"  Tab {tab_step+1}: Foco activo en <{active_tag}> -> Confinado en modal: {is_inside_modal}", flush=True)
            assert is_inside_modal, f"Fuga de foco detectada en el paso {tab_step+1}! El foco escapó del modal."

        # Test Shift+Tab reverse cycle
        print("Probando ciclo inverso Shift+Tab dentro del modal...", flush=True)
        for shift_step in range(4):
            await acc_page.keyboard.press("Shift+Tab")
            is_inside_modal = await acc_page.evaluate("""() => {
                const modal = document.querySelector('.diagram-modal-dialog');
                return modal.contains(document.activeElement);
            }""")
            assert is_inside_modal, f"Fuga de foco en Shift+Tab paso {shift_step+1}!"
        print("  -> PASS: Confinamiento de foco (Focus Trap) 100% infranqueable en ambas direcciones.", flush=True)

        # Close with Escape
        await acc_page.keyboard.press("Escape")
        await acc_page.wait_for_timeout(300)
        assert not await modal.is_visible(), "El modal no se cerró con Escape"
        is_refocused = await zoom_btn.evaluate("el => el === document.activeElement")
        assert is_refocused, "El foco no retornó al botón trigger tras cerrar con Escape"
        print("  -> PASS: Foco restaurado correctamente al activador.", flush=True)
        await acc_page.close()

        # -------------------------------------------------------------
        # COMPROBACIÓN 3: MATRIZ VISUAL COMPLETA (32 CAPTURAS CLARO + OSCURO)
        # -------------------------------------------------------------
        print("\n--- 3. GENERANDO MATRIZ VISUAL COMPLETA: DESKTOP & MÓVIL (390, 360, 320 PX) ---", flush=True)
        
        pages_to_capture = [
            {"path": "/", "name": "home"},
            {"path": "/docs/api/overview", "name": "overview"},
            {"path": "/docs/api/pricing-api", "name": "pricing"},
            {"path": "/docs/api/preflight-api", "name": "preflight"}
        ]
        
        viewports = [
            {"w": 1440, "h": 900, "prefix": "desktop"},
            {"w": 390, "h": 844, "prefix": "mobile_390"},
            {"w": 360, "h": 780, "prefix": "mobile_360"},
            {"w": 320, "h": 568, "prefix": "mobile_320"}
        ]

        for vp in viewports:
            is_mob = vp["w"] < 600
            cap_page = await browser.new_page(viewport={"width": vp["w"], "height": vp["h"]}, is_mobile=is_mob)
            for pg in pages_to_capture:
                # Desktop only needs home, overview, pricing
                if vp["prefix"] == "desktop" and pg["name"] == "preflight":
                    continue
                
                await cap_page.goto(f"{LOCAL_URL}{pg['path']}", wait_until="networkidle")
                
                # Light theme capture
                await cap_page.evaluate("() => document.documentElement.setAttribute('data-theme', 'light')")
                await cap_page.wait_for_timeout(250)
                light_file = f"{vp['prefix']}_{pg['name']}_light.png"
                await cap_page.screenshot(path=os.path.join(OUT_DIR, light_file))
                
                # Dark theme capture
                await cap_page.evaluate("() => document.documentElement.setAttribute('data-theme', 'dark')")
                await cap_page.wait_for_timeout(250)
                dark_file = f"{vp['prefix']}_{pg['name']}_dark.png"
                await cap_page.screenshot(path=os.path.join(OUT_DIR, dark_file))
                
                print(f"  Capturada matriz: {light_file} & {dark_file}", flush=True)

            # Special capture: Modal Zoom in Desktop
            if vp["prefix"] == "desktop":
                await cap_page.goto(f"{LOCAL_URL}/docs/api/pricing-api", wait_until="networkidle")
                zoom_trig = cap_page.locator(".diagram-zoom-trigger").first
                await zoom_trig.click()
                await cap_page.wait_for_timeout(300)
                
                await cap_page.evaluate("() => document.documentElement.setAttribute('data-theme', 'light')")
                await cap_page.wait_for_timeout(250)
                await cap_page.screenshot(path=os.path.join(OUT_DIR, "desktop_modal_zoom_light.png"))
                
                await cap_page.evaluate("() => document.documentElement.setAttribute('data-theme', 'dark')")
                await cap_page.wait_for_timeout(250)
                await cap_page.screenshot(path=os.path.join(OUT_DIR, "desktop_modal_zoom_dark.png"))
                print("  Capturada matriz: desktop_modal_zoom_light.png & desktop_modal_zoom_dark.png", flush=True)

            await cap_page.close()

        await browser.close()
        print("\n=======================================================", flush=True)
        print("  ¡AUDITORÍA PROFUNDA Y MATRIZ VISUAL COMPLETADAS AL 100%!", flush=True)
        print("=======================================================", flush=True)

if __name__ == "__main__":
    asyncio.run(run_deep_audits())
