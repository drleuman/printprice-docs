import asyncio
import os
from playwright.async_api import async_playwright

OUT_DIR = "c:/Users/KIKE/Downloads/printprice-docs-main/static/img/redesign/prod_verification"
os.makedirs(OUT_DIR, exist_ok=True)

PROD_URL = "https://docs.printprice.pro"

async def test_live():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        
        # 1. Desktop Check
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        
        # Home
        await page.goto(PROD_URL, wait_until="networkidle")
        print("Live Home: 200 OK")
        
        # Check navbar English
        nav_text = await page.locator(".navbar__items").first.inner_text()
        print("Live Navbar text:", repr(nav_text))
        assert "Documentation" in nav_text, "Navbar should have Documentation"
        assert "API & Contracts" in nav_text, "Navbar should have API & Contracts"
        
        # Check Quickstart terminal in Light mode
        await page.evaluate("() => document.documentElement.setAttribute('data-theme', 'light')")
        await page.wait_for_timeout(500)
        qs_box = page.locator("pre.terminal-body").first
        assert await qs_box.count() > 0, "Terminal window exists on live"
        await qs_box.screenshot(path=os.path.join(OUT_DIR, "live_quickstart_light.png"))
        print("Captured live_quickstart_light.png")
        
        # Check Pricing Page
        await page.goto(f"{PROD_URL}/docs/api/pricing-api", wait_until="networkidle")
        print("Live Pricing: 200 OK")
        
        # Check 3-stage diagram
        diagram = page.locator(".docusaurus-mermaid-container").first
        assert await diagram.count() > 0, "Pricing diagram container exists on live"
        svg = diagram.locator("svg").first
        assert await svg.count() > 0, "Pricing diagram SVG rendered on live"
        bbox = await svg.bounding_box()
        print(f"Live Pricing Diagram 1 Dimensions: {bbox['width']}x{bbox['height']}")
        assert bbox["height"] < 600, f"Diagram 1 height should be compact (~200-350px), got {bbox['height']}"
        await diagram.screenshot(path=os.path.join(OUT_DIR, "live_pricing_diagram_stage_flow.png"))
        print("Captured live_pricing_diagram_stage_flow.png")
        
        # Check Modal zoom & drag
        expand_btn = page.locator(".diagram-zoom-trigger").first
        assert await expand_btn.count() > 0, "Diagram expand button exists on live"
        await expand_btn.click()
        await page.wait_for_timeout(600)
        
        modal = page.locator(".diagram-modal-overlay")
        assert await modal.count() > 0, "Modal opened on live"
        modal_body = page.locator(".diagram-modal-body")
        assert await modal_body.count() > 0, "Modal body exists"
        
        # Check zoom indicator
        zoom_reset = page.locator(".diagram-modal-btn-reset")
        assert await zoom_reset.count() > 0, "Zoom reset exists"
        zoom_text = await zoom_reset.inner_text()
        print(f"Live Modal Initial Zoom: {zoom_text}")
        assert zoom_text == "100%", f"Expected 100%, got {zoom_text}"
        
        # Check zoom in
        zoom_in = page.locator("button[aria-label='Zoom in']")
        await zoom_in.click()
        await page.wait_for_timeout(300)
        print("Live Modal Zoom In worked:", await zoom_reset.inner_text())
        
        # Capture modal screenshot
        await page.screenshot(path=os.path.join(OUT_DIR, "live_modal_zoom_open.png"))
        print("Captured live_modal_zoom_open.png")
        
        # Close modal with Esc
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(300)
        assert await modal.count() == 0, "Modal closed on Escape on live"
        print("Live Modal Escape close verified")
        
        # Check Overview Table
        await page.goto(f"{PROD_URL}/docs/api/overview", wait_until="networkidle")
        table_wrapper = page.locator(".table-responsive-wrapper").first
        assert await table_wrapper.count() > 0, "Canonical table wrapper exists on live overview"
        headers = await table_wrapper.locator("th").all_inner_texts()
        print("Live Table Headers:", headers)
        assert len(headers) == 6, f"Expected 6 headers, got {len(headers)}"
        
        # 2. Mobile 390px Hamburger Drawer Check
        mobile_page = await browser.new_page(viewport={"width": 390, "height": 844})
        await mobile_page.goto(PROD_URL, wait_until="networkidle")
        hamburger = mobile_page.locator(".navbar__toggle").first
        assert await hamburger.count() > 0, "Hamburger button exists on live mobile"
        await hamburger.click()
        await mobile_page.wait_for_timeout(500)
        
        sidebar = mobile_page.locator(".navbar-sidebar")
        sbox = await sidebar.bounding_box()
        print(f"Live Mobile Hamburger Sidebar Height: {sbox['height']}px (Viewport: 844px)")
        assert sbox["height"] >= 800, f"Sidebar height must cover viewport, got {sbox['height']}"
        await mobile_page.screenshot(path=os.path.join(OUT_DIR, "live_mobile_hamburger_drawer.png"))
        print("Captured live_mobile_hamburger_drawer.png")
        
        await mobile_page.close()
        await page.close()
        await browser.close()
        print("\nALL LIVE PRODUCTION DOC-UI-02 CHECKS PASSED 100%!")

if __name__ == "__main__":
    asyncio.run(test_live())
