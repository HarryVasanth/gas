from playwright.sync_api import sync_playwright
import time
import os

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Use absolute path for local file
        path = os.path.abspath("index.html")
        page.goto(f"file://{path}")

        # Wait for data to load
        page.wait_for_selector(".price-card")

        # 1. Take screenshot of Light Mode (Default)
        page.screenshot(path="verification/light_mode_v2.png")

        # 2. Toggle to Dark Mode
        page.click("#theme-toggle")
        time.sleep(1) # Wait for transition
        page.screenshot(path="verification/dark_mode_v2.png")

        # 3. Test Scroll for Navbar transparency
        # First, ensure there is enough content to scroll
        page.evaluate("window.scrollTo(0, 50)")
        time.sleep(0.5)
        page.screenshot(path="verification/scrolled_navbar.png")

        # 4. Hover over a price card to see interaction
        page.hover(".price-card:first-child")
        time.sleep(0.5)
        page.screenshot(path="verification/card_hover.png")

        # 5. Switch to Candlestick and screenshot
        page.click("#chart-style-toggle") # bar
        page.click("#chart-style-toggle") # step
        page.click("#chart-style-toggle") # candlestick
        time.sleep(1)
        page.screenshot(path="verification/candlestick_chart_v2.png")

        browser.close()

if __name__ == "__main__":
    verify_ui()
