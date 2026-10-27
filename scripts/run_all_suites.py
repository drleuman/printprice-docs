import subprocess
import time
import sys

docs_dir = r"c:\Users\KIKE\Downloads\printprice-docs-main"

server = subprocess.Popen(
    ["python", "-m", "http.server", "3456", "--directory", r"c:\Users\KIKE\Downloads\printprice-docs-main\build"],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL
)
time.sleep(2)

try:
    print(">>> RUNNING verify_doc_ui_02.py...")
    res1 = subprocess.run([sys.executable, "scripts/verify_doc_ui_02.py"], cwd=docs_dir)
    if res1.returncode != 0:
        print("[FAIL] verify_doc_ui_02.py failed!")
        sys.exit(1)
        
    print("\n>>> RUNNING verify_deep_audits.py...")
    res2 = subprocess.run([sys.executable, "scripts/verify_deep_audits.py"], cwd=docs_dir)
    if res2.returncode != 0:
        print("[FAIL] verify_deep_audits.py failed!")
        sys.exit(1)
        
    print("\n>>> RUNNING test_mobile_hamburger.py...")
    res3 = subprocess.run([sys.executable, "scripts/test_mobile_hamburger.py"], cwd=docs_dir)
    if res3.returncode != 0:
        print("[FAIL] test_mobile_hamburger.py failed!")
        sys.exit(1)

    print("\n>>> RUNNING test_final_adjustments.py...")
    res4 = subprocess.run([sys.executable, "scripts/test_final_adjustments.py"], cwd=docs_dir)
    if res4.returncode != 0:
        print("[FAIL] test_final_adjustments.py failed!")
        sys.exit(1)
        
    print("\n==========================================")
    print("ALL 4 SUITES PASSED FLAWLESSLY!")
    print("==========================================")
finally:
    server.terminate()
