# Algoritmos-SO
Aplicación que permite resolver algoritmos de SO con modo debug

## Interfaz web (React + Vite)

La UI está en [`algoritmos-SO/`](algoritmos-SO/) e incluye tres módulos:

- **Procesos**: FCFS, SJF, SJRF, Prioridad y Round Robin con diagrama de Gantt
  (con marcas de llegada), tabla de espera / finalización / penalización y
  promedio de penalización.
- **Memoria**: FIFO, LRU y Reloj (2ª oportunidad) con la tabla de marcos por
  referencia, metadata de cada algoritmo y contador de fallos.
- **Disco**: FIFO, SSTF, SCAN, C-SCAN, LOOK y C-LOOK con la tabla
  desde / hasta / diferencia, el desplazamiento total y el gráfico de línea
  del recorrido del cabezal.

Todos los módulos tienen **modo debugger**: botones de paso anterior/siguiente,
slider, autoplay con velocidad ajustable y explicación de cada paso.

### Uso

```bash
cd algoritmos-SO
npm install
npm run dev      # http://localhost:5173
npm run build    # build de producción en dist/
```

Los algoritmos (`src/algorithms/`) son módulos ES compartidos entre la UI y
Node (`import`/`require` desde Node 24+).
