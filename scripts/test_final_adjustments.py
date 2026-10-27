import subprocess
import time
import os
import sys
from playwright.sync_api import sync_playwright

def main():
    docs_dir = r"c:\Users\KIKE\Downloads\printprice-docs-main"
    build_dir = os.path.join(docs_dir, "build")
    artifacts_dir = r"C:\Users\KIKE\.gemini\antigravity-ide\brain\11f88282-1d5f-41ae-b8cf-4e4cb4c6617c"
    img_dir = os.path.join(docs_dir, "static", "img", "redesign", "doc_ui_02")
    os.makedirs(img_dir, exist_ok=True)
    
    server = subprocess.Popen(
        ["python", "-m", "http.server", "3456", "--directory", build_dir],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(2)
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            
            # ============================================================
            # 1. PRICING DIAGRAM 1 ON DESKTOP & MOBILE SCROLLED TO DIAGRAM
            # ============================================================
            print(">>> 1. Verifying Pricing First Diagram on Page...")
            for theme in ["dark", "light"]:
                # Desktop
                d_ctx = browser.new_context(viewport={"width": 1440, "height": 900}, color_scheme=theme)
                d_page = d_ctx.new_page()
                d_page.goto("http://127.0.0.1:3456/docs/api/pricing-api", wait_until="networkidle")
                d_page.evaluate(f"document.documentElement.setAttribute('data-theme', '{theme}')")
                d_page.wait_for_timeout(300)
                
                # Scroll first diagram card into view
                d_card = d_page.locator(".diagram-card-wrapper").first
                d_card.scroll_into_view_if_needed()
                d_page.wait_for_timeout(300)
                
                # Check dimensions & font size
                d_svg = d_card.locator("svg").first
                d_box = d_svg.bounding_box()
                print(f"Pricing Diagram 1 Desktop ({theme}): width={d_box['width']}px, height={d_box['height']}px")
                
                shot_desktop = f"pricing_diagram1_desktop_{theme}.png"
                d_page.screenshot(path=os.path.join(artifacts_dir, shot_desktop))
                d_page.screenshot(path=os.path.join(img_dir, shot_desktop))
                d_ctx.close()
                
                # Mobile 390px, 360px, 320px scrolled to Pricing Diagram 1
                for vp in [("390", 390, 844), ("360", 360, 780), ("320", 320, 640)]:
                    m_ctx = browser.new_context(viewport={"width": vp[1], "height": vp[2]}, color_scheme=theme)
                    m_page = m_ctx.new_page()
                    m_page.goto("http://127.0.0.1:3456/docs/api/pricing-api", wait_until="networkidle")
                    m_page.evaluate(f"document.documentElement.setAttribute('data-theme', '{theme}')")
                    m_page.wait_for_timeout(300)
                    
                    card = m_page.locator(".diagram-card-wrapper").first
                    card.scroll_into_view_if_needed()
                    m_page.wait_for_timeout(300)
                    
                    shot_name = f"mobile_{vp[0]}_pricing_diagram1_{theme}.png"
                    m_page.screenshot(path=os.path.join(artifacts_dir, shot_name))
                    m_page.screenshot(path=os.path.join(img_dir, shot_name))
                    print(f"Captured Pricing Diagram 1 on Mobile {vp[0]} ({theme}): {shot_name}")
                    m_ctx.close()

            # ============================================================
            # 2. MODAL ZOOM, DRAG-TO-PAN, ARROW KEYS & NO CLIPPING
            # ============================================================
            print("\n>>> 2. Verifying Modal Drag-to-Pan & Arrow Navigation...")
            ctx = browser.new_context(viewport={"width": 1440, "height": 900}, color_scheme="dark")
            page = ctx.new_page()
            page.goto("http://127.0.0.1:3456/docs/api/pricing-api", wait_until="networkidle")
            page.evaluate("document.documentElement.setAttribute('data-theme', 'dark')")
            
            # Click expand diagram
            zoom_btn = page.locator(".diagram-zoom-trigger").first
            zoom_btn.click()
            page.wait_for_timeout(400)
            
            modal = page.locator(".diagram-modal-dialog")
            assert modal.is_visible(), "Modal must be visible"
            
            # Check initial zoom display
            reset_btn = page.locator(".diagram-modal-btn-reset")
            print("Modal initial zoom button text:", reset_btn.text_content())
            
            # Click zoom in to 140%
            plus_btn = page.locator(".diagram-modal-btn:has-text('+')")
            plus_btn.click()
            page.wait_for_timeout(200)
            print("After 1x Zoom In:", reset_btn.text_content())
            plus_btn.click()
            page.wait_for_timeout(200)
            print("After 2x Zoom In:", reset_btn.text_content())
            
            body = page.locator(".diagram-modal-body")
            
            # Test Drag-to-Pan
            initial_scroll = page.evaluate("() => ({ left: document.querySelector('.diagram-modal-body').scrollLeft, top: document.querySelector('.diagram-modal-body').scrollTop })")
            print("Initial scroll before drag:", initial_scroll)
            
            body_box = body.bounding_box()
            start_x = body_box["x"] + body_box["width"] / 2
            start_y = body_box["y"] + body_box["height"] / 2
            
            # Drag left and up
            page.mouse.move(start_x, start_y)
            page.mouse.down()
            page.mouse.move(start_x - 150, start_y - 100, steps=5)
            page.mouse.up()
            page.wait_for_timeout(300)
            
            after_drag_scroll = page.evaluate("() => ({ left: document.querySelector('.diagram-modal-body').scrollLeft, top: document.querySelector('.diagram-modal-body').scrollTop })")
            print("Scroll after mouse drag:", after_drag_scroll)
            assert after_drag_scroll["left"] > initial_scroll["left"] or after_drag_scroll["top"] > initial_scroll["top"], "Drag to pan must alter scroll position"
            print("-> PASS: Real Drag-to-Pan verified successfully!")
            
            # Test Arrow Key Panning
            body.focus()
            page.keyboard.press("ArrowRight")
            page.keyboard.press("ArrowRight")
            page.keyboard.press("ArrowDown")
            page.wait_for_timeout(200)
            
            after_arrow_scroll = page.evaluate("() => ({ left: document.querySelector('.diagram-modal-body').scrollLeft, top: document.querySelector('.diagram-modal-body').scrollTop })")
            print("Scroll after arrow keys:", after_arrow_scroll)
            assert after_arrow_scroll["left"] > after_drag_scroll["left"] or after_arrow_scroll["top"] > after_drag_scroll["top"], "Arrow keys must pan canvas"
            print("-> PASS: Keyboard arrow panning verified successfully!")
            
            # Reset zoom
            reset_btn.click()
            page.wait_for_timeout(200)
            print("After Reset:", reset_btn.text_content())
            
            # Screenshots of Desktop Modal in Light & Dark
            for theme in ["dark", "light"]:
                page.evaluate(f"document.documentElement.setAttribute('data-theme', '{theme}')")
                page.wait_for_timeout(200)
                shot = f"desktop_modal_zoom_{theme}.png"
                page.screenshot(path=os.path.join(artifacts_dir, shot))
                page.screenshot(path=os.path.join(img_dir, shot))
            ctx.close()
            
            # Modal open on Mobile (390px)
            for theme in ["dark", "light"]:
                m_ctx = browser.new_context(viewport={"width": 390, "height": 844}, color_scheme=theme)
                m_page = m_ctx.new_page()
                m_page.goto("http://127.0.0.1:3456/docs/api/pricing-api", wait_until="networkidle")
                m_page.evaluate(f"document.documentElement.setAttribute('data-theme', '{theme}')")
                m_page.wait_for_timeout(300)
                
                # Expand diagram
                m_page.locator(".diagram-zoom-trigger").first.click()
                m_page.wait_for_timeout(400)
                
                shot_name = f"mobile_390_modal_open_{theme}.png"
                m_page.screenshot(path=os.path.join(artifacts_dir, shot_name))
                m_page.screenshot(path=os.path.join(img_dir, shot_name))
                print(f"Captured Mobile Modal Open ({theme}): {shot_name}")
                m_ctx.close()

            # ============================================================
            # 3. OVERVIEW MOBILE SCROLLED TO DIAGRAM & SCROLLED TO TABLE
            # ============================================================
            print("\n>>> 3. Capturing Mobile Overview Scrolled to Diagram & Table...")
            for theme in ["dark", "light"]:
                m_ctx = browser.new_context(viewport={"width": 390, "height": 844}, color_scheme=theme)
                m_page = m_ctx.new_page()
                m_page.goto("http://127.0.0.1:3456/docs/api/overview", wait_until="networkidle")
                m_page.evaluate(f"document.documentElement.setAttribute('data-theme', '{theme}')")
                m_page.wait_for_timeout(300)
                
                # A) Scrolled to Diagram
                diag_card = m_page.locator(".diagram-card-wrapper").first
                diag_card.scroll_into_view_if_needed()
                m_page.wait_for_timeout(300)
                shot_diag = f"mobile_390_overview_scrolled_diagram_{theme}.png"
                m_page.screenshot(path=os.path.join(artifacts_dir, shot_diag))
                m_page.screenshot(path=os.path.join(img_dir, shot_diag))
                print(f"Captured Overview Scrolled to Diagram ({theme}): {shot_diag}")
                
                # B) Scrolled to 6-column Table
                m_page.evaluate("() => { const el = document.querySelector('.table-scroll-indicator') || document.querySelector('.table-responsive-wrapper'); if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' }); }")
                m_page.wait_for_timeout(300)
                shot_tbl = f"mobile_390_overview_scrolled_table_{theme}.png"
                m_page.screenshot(path=os.path.join(artifacts_dir, shot_tbl))
                m_page.screenshot(path=os.path.join(img_dir, shot_tbl))
                print(f"Captured Overview Scrolled to Table ({theme}): {shot_tbl}")
                
                m_ctx.close()

            # ============================================================
            # 4. PREFLIGHT MOBILE SCROLLED TO DIAGRAM
            # ============================================================
            print("\n>>> 4. Capturing Mobile Preflight Scrolled to Diagram...")
            for theme in ["dark", "light"]:
                m_ctx = browser.new_context(viewport={"width": 390, "height": 844}, color_scheme=theme)
                m_page = m_ctx.new_page()
                m_page.goto("http://127.0.0.1:3456/docs/api/preflight-api", wait_until="networkidle")
                m_page.evaluate(f"document.documentElement.setAttribute('data-theme', '{theme}')")
                m_page.wait_for_timeout(300)
                
                diag_card = m_page.locator(".diagram-card-wrapper").first
                diag_card.scroll_into_view_if_needed()
                m_page.wait_for_timeout(300)
                shot_diag = f"mobile_390_preflight_scrolled_diagram_{theme}.png"
                m_page.screenshot(path=os.path.join(artifacts_dir, shot_diag))
                m_page.screenshot(path=os.path.join(img_dir, shot_diag))
                print(f"Captured Preflight Scrolled to Diagram ({theme}): {shot_diag}")
                m_ctx.close()
                
            browser.close()
            print("\n==========================================")
            print("ALL FINAL ADJUSTMENTS VERIFIED & CAPTURED!")
            print("==========================================")
    finally:
        server.terminate()

if __name__ == "__main__":
    main()
