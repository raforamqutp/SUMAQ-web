"""
Script de prueba de carga rapida para SUMAQ Spa (Sin dependencias externas)
Simula 20 usuarios concurrentes hacia el backend y calcula metricas de ITIL v4:
- Latencia promedio (Response Time)
- Latencia P95
- Throughput (Transacciones por segundo)
- Tasa de Error HTTP
"""
import time
import urllib.request
import urllib.error
import threading
import statistics

TARGET_URL = "http://localhost:8000/api/servicios/"
NUM_USERS = 20
REQUESTS_PER_USER = 2

results = []
lock = threading.Lock()

def worker(user_id):
    for i in range(REQUESTS_PER_USER):
        start = time.perf_counter()
        status_code = None
        error = None
        try:
            req = urllib.request.Request(
                TARGET_URL,
                headers={"Accept": "application/json", "User-Agent": f"SUMAQ-LoadTester-User-{user_id}"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                status_code = resp.getcode()
        except urllib.error.HTTPError as e:
            status_code = e.code
            error = str(e)
        except Exception as e:
            status_code = 0
            error = str(e)
        duration_ms = (time.perf_counter() - start) * 1000.0
        
        with lock:
            results.append({
                "user": user_id,
                "status": status_code,
                "duration_ms": duration_ms,
                "error": error
            })
        time.sleep(0.05)

def main():
    print("=" * 70)
    print("   SUMAQ SPA - PRUEBA DE RENDIMIENTO Y CAPACIDAD (ITIL v4)")
    print(f"   Objetivo: {TARGET_URL}")
    print(f"   Usuarios concurrentes: {NUM_USERS} | Peticiones totales: {NUM_USERS * REQUESTS_PER_USER}")
    print("=" * 70)
    print("Iniciando hilos concurrentes...")
    
    start_total = time.perf_counter()
    threads = []
    for u in range(1, NUM_USERS + 1):
        t = threading.Thread(target=worker, args=(u,))
        threads.append(t)
        t.start()
        time.sleep(0.05)  # Pequeno ramp-up de 1s total
        
    for t in threads:
        t.join()
        
    total_time_s = time.perf_counter() - start_total
    
    durations = [r["duration_ms"] for r in results]
    successes = [r for r in results if r["status"] == 200]
    errors = [r for r in results if r["status"] != 200]
    
    durations.sort()
    avg_latency = statistics.mean(durations) if durations else 0
    p95_latency = durations[int(len(durations) * 0.95)] if durations else 0
    min_latency = min(durations) if durations else 0
    max_latency = max(durations) if durations else 0
    throughput = len(results) / total_time_s if total_time_s > 0 else 0
    error_rate = (len(errors) / len(results) * 100) if results else 0
    
    print("\n" + "=" * 70)
    print("   REPORTE EJECUTIVO DE RENDIMIENTO - KPI SUMMARY")
    print("=" * 70)
    print(f"  * Peticiones Totales Ejecutadas : {len(results)}")
    print(f"  * Peticiones Exitosas (HTTP 200): {len(successes)}")
    print(f"  * Peticiones Fallidas           : {len(errors)}")
    print(f"  * Tasa de Error                 : {error_rate:.2f}% (Meta SLA: < 0.1%)")
    print(f"  * Tiempo Total de la Prueba    : {total_time_s:.2f} s")
    print(f"  * Throughput (Rendimiento)      : {throughput:.2f} req/s")
    print(f"  * Latencia Minima               : {min_latency:.2f} ms")
    print(f"  * Latencia Promedio (Avg)       : {avg_latency:.2f} ms (Meta SLA: < 400 ms)")
    print(f"  * Latencia Percentil 95 (P95)   : {p95_latency:.2f} ms")
    print(f"  * Latencia Maxima               : {max_latency:.2f} ms")
    print("=" * 70)
    
    if error_rate == 0 and avg_latency < 400:
        print("  >>> EVALUACION SLA: APROBADO CUMPLE CON LOS CRITERIOS DE RENDIMIENTO <<<")
    else:
        print("  >>> EVALUACION SLA: REVISAR CUERPO DE TRABAJO Y CACHE <<<")
    print("=" * 70)

if __name__ == "__main__":
    main()
