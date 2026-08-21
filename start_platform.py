import os
import sys
import time
import subprocess

def main():
    print("\n" + "="*70)
    print(" CITIZEN CALL INTELLIGENCE & INCIDENT MANAGEMENT PLATFORM")
    print(" 100% Local ML Stack • Zero External Paid APIs")
    print("="*70 + "\n")

    root_dir = os.path.abspath(os.path.dirname(__file__))
    server_dir = os.path.join(root_dir, "server")
    client_dir = os.path.join(root_dir, "client")

    print("[1/3] Starting Python ML Microservice (Port 5000)...")
    python_cmd = [sys.executable, "app.py"]
    py_proc = subprocess.Popen(python_cmd, cwd=root_dir)
    time.sleep(2)

    print("[2/3] Starting Node.js Express Backend (Port 4000)...")
    node_cmd = ["npm", "run", "dev"]
    node_proc = subprocess.Popen(node_cmd, cwd=server_dir, shell=True)
    time.sleep(2)

    print("[3/3] Starting React + Vite Frontend (Port 5173)...")
    vite_cmd = ["npm", "run", "dev"]
    vite_proc = subprocess.Popen(vite_cmd, cwd=client_dir, shell=True)

    print("\n" + "="*70)
    print(" ALL PLATFORM SERVICES LAUNCHED SUCCESSFULLY!")
    print(" Frontend Command Center: http://localhost:5173")
    print(" Node Backend API:       http://localhost:4000")
    print(" Python ML Service:      http://localhost:5000")
    print(" Press Ctrl+C to stop all services.")
    print("="*70 + "\n")

    try:
        py_proc.wait()
    except KeyboardInterrupt:
        print("\n[Shutdown] Stopping platform services...")
        py_proc.terminate()
        node_proc.terminate()
        vite_proc.terminate()
        print("[Shutdown] Done.")

if __name__ == "__main__":
    main()
