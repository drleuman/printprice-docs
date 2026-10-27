import subprocess
import time
import os
from playwright.sync_api import sync_playwright

def main():
    docs_dir = r"c:\Users\KIKE\Downloads\printprice-docs-main"
    build_dir = os.path.join(docs_dir, "build")
    artifacts_dir = r"C:\Users\KIKE\.gemini\antigravity-ide\brain\11f88282-1d5f-41ae-b8cf-4e4cb4c6617c"
    img_dir = os.path.join(docs_dir, "static", "img", "redesign", "doc_ui_02")
    os.makedirs(img_dir, exist_ok=True)
    
    server = subprocess.Popen(
        ["python", "-m", "http.server", "3475", "--directory", build_dir],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(1.5)
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            
            viewports = [
                {"name": "mobile_390", "width": 390, "height": 844},
                {"name": "mobile_360", "width": 360, "height": 780},
                {"name": "mobile_320", "width": 320, "height": 640},
            ]
            
            results = {}
            all_passed = True
            
            for vp in viewports:
                for theme in ["dark", "light"]:
                    for page_path, page_name in [("/", "home"), ("/docs/api/overview", "overview")]:
                        context = browser.new_context(
                            viewport={"width": vp["width"], "height": vp["height"]},
                            color_scheme=theme
                        )
                        page = context.new_page()
                        url = f"http://127.0.0.1:3475{page_path}"
                        page.goto(url, wait_until="networkidle")
                        page.evaluate(f"document.documentElement.setAttribute('data-theme', '{theme}')")
                        page.wait_for_timeout(300)
                        
                        key = f"{vp['name']}_{page_name}_{theme}"
                        
                        # 1. Toggle button
                        toggle_btn = page.locator(".navbar__toggle")
                        if not toggle_btn.is_visible():
                            print(f"[FAIL] Toggle button not visible on {key}")
                            all_passed = False
                            context.close()
                            continue
                            
                        # 2. Click to open
                        toggle_btn.click()
                        page.wait_for_timeout(400)
                        
                        # 3. Assert sidebar dimensions and visibility
                        sidebar = page.locator(".navbar-sidebar")
                        sidebar_rect = sidebar.bounding_box()
                        items = page.locator(".navbar-sidebar__items")
                        items_rect = items.bounding_box()
                        
                        sidebar_height = sidebar_rect["height"] if sidebar_rect else 0
                        items_height = items_rect["height"] if items_rect else 0
                        
                        # 4. Check links
                        links = page.evaluate("""() => {
                            return Array.from(document.querySelectorAll('.navbar-sidebar__items a'))
                                .map(a => a.textContent.trim())
                                .filter(Boolean);
                        }""")
                        
                        # Check close button
                        close_btn = page.locator(".navbar-sidebar__close")
                        has_close_btn = close_btn.is_visible()
                        
                        # Check backdrop
                        backdrop = page.locator(".navbar-sidebar__backdrop")
                        backdrop_rect = backdrop.bounding_box()
                        backdrop_height = backdrop_rect["height"] if backdrop_rect else 0
                        
                        # Screenshots
                        shot_name = f"hamburger_{key}.png"
                        artifact_shot = os.path.join(artifacts_dir, shot_name)
                        repo_shot = os.path.join(img_dir, shot_name)
                        
                        page.screenshot(path=artifact_shot)
                        page.screenshot(path=repo_shot)
                        
                        # Assertions
                        sidebar_ok = sidebar_height >= (vp["height"] - 10)
                        items_ok = items_height >= (vp["height"] - 100)
                        backdrop_ok = backdrop_height >= (vp["height"] - 10)
                        links_ok = len(links) >= 5
                        
                        # Test closing
                        close_btn.click()
                        page.wait_for_timeout(350)
                        closed_ok = not page.locator(".navbar.navbar-sidebar--show").is_visible()
                        
                        passed = sidebar_ok and items_ok and backdrop_ok and links_ok and closed_ok
                        if not passed:
                            all_passed = False
                            
                        status = "PASS" if passed else "FAIL"
                        clean_links = [l.encode('ascii', 'replace').decode('ascii') for l in links[:5]]
                        print(f"[{status}] {key}: sidebarH={sidebar_height}px, itemsH={items_height}px, links={len(links)}, closeWorks={closed_ok}")
                        print(f"       Items sample: {', '.join(clean_links)}")
                        
                        context.close()
                        
            browser.close()
            print(f"\n==========================================")
            print(f"OVERALL MOBILE HAMBURGER VERDICT: {'ALL PASS' if all_passed else 'FAILURES DETECTED'}")
            print(f"==========================================")
            if not all_passed:
                exit(1)
                
    finally:
        server.terminate()

if __name__ == "__main__":
    main()
