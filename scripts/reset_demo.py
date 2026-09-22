"""
reset_demo.py
One-command script to reset the CivicSense AI database and reseed demo data:
1. Resets SQLite database via Prisma
2. Runs seed.ts (departments with virtual numbers, workers, initial complaints, test accounts)
3. Seeds ChromaDB spam collection with repeat-caller scenarios for +919840499999
"""

import subprocess
import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SERVER_DIR = os.path.join(PROJECT_ROOT, "server")

def run_step(step_name, cmd, cwd):
    print(f"\n==================================================")
    print(f"[{step_name}]")
    print(f"Running: {' '.join(cmd)} in {cwd}")
    print(f"==================================================")
    result = subprocess.run(cmd, cwd=cwd, shell=True)
    if result.returncode != 0:
        print(f"❌ Error: {step_name} failed with exit code {result.returncode}")
        return False
    print(f"✅ {step_name} completed successfully.")
    return True

def main():
    print("=" * 60)
    print(" CIVICSENSE AI — DEMO ENVIRONMENT RESET")
    print("=" * 60)

    # Step 1: Push schema to reset DB
    if not run_step("1/3 Reset Database Schema", ["npx", "prisma", "db", "push", "--force-reset", "--accept-data-loss"], SERVER_DIR):
        sys.exit(1)

    # Step 2: Seed SQLite DB
    if not run_step("2/3 Seed SQLite Database", ["npx", "tsx", "prisma/seed.ts"], SERVER_DIR):
        sys.exit(1)

    # Step 3: Seed ChromaDB Spam Vector Collection
    if not run_step("3/3 Seed ChromaDB Spam History", [sys.executable, os.path.join(PROJECT_ROOT, "scripts", "seed_spam_chroma.py")], PROJECT_ROOT):
        sys.exit(1)

    print("\n" + "=" * 60)
    print("🎉 DEMO RESET COMPLETE!")
    print("   • All 9 municipal departments restored with virtual numbers")
    print("   • ChromaDB spam test vectors populated for +919840499999")
    print("   • Ready for live demonstration")
    print("=" * 60)

if __name__ == "__main__":
    main()
