# Algoritmos-SO

Aplicación web interactiva para resolver y visualizar algoritmos clásicos de **Sistemas Operativos** con un **modo debugger** paso a paso. Ideal para estudiantes y docentes que necesitan entender el comportamiento interno de cada algoritmo.

## Tabla de contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Uso](#uso)
- [Módulos y algoritmos](#módulos-y-algoritmos)
  - [Planificación de procesos](#planificación-de-procesos)
  - [Gestión de memoria](#gestión-de-memoria)
  - [Planificación de disco](#planificación-de-disco)
- [Modo debugger](#modo-debugger)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Convenciones de los algoritmos](#convenciones-de-los-algoritmos)
- [Scripts disponibles](#scripts-disponibles)
- [Licencia](#licencia)

## Características

- **Tres módulos independientes**: Procesos, Memoria y Disco.
- **15 algoritmos** en total, con visualización paso a paso.
- **Modo debugger** en todos los módulos: avanza o retrocede paso a paso, autoplay con velocidad ajustable y explicación textual de cada estado.
- **Diagrama de Gantt** para procesos.
- **Tablas dinámicas** con métricas (espera, penalización, fallos de página, desplazamiento del cabezal, etc.).
- **Gráfico de recorrido** para algoritmos de disco.
- **Motor de algoritmos puro en JavaScript ES modules**, reusable tanto en el frontend como en Node.js (v24+).

## Tecnologías

- **Frontend**: React 19 + Vite 8 + React Router DOM
- **Lenguaje**: JavaScript (ES Modules)
- **Estilos**: CSS vanilla
- **Build tool**: Vite

## Requisitos previos

- [Node.js](https://nodejs.org/) v24 o superior (para soportar `import`/`require` nativo de ES modules)
- npm (incluido con Node.js)

## Instalación

1. Cloná el repositorio:

```bash
git clone https://github.com/IvanLSanchez/Algoritmos-SO.git
cd Algoritmos-SO/algoritmos-SO
```

2. Instalá las dependencias:

```bash
npm install
```

## Uso

### Modo desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

### Build de producción

```bash
npm run build
```

Genera los archivos estáticos en `dist/`.

### Preview del build

```bash
npm run preview
```

## Módulos y algoritmos

La interfaz web está en [`algoritmos-SO/`](algoritmos-SO/) y se divide en tres módulos:

### Planificación de procesos

Algoritmos de scheduling de CPU con diagrama de Gantt (con marcas de llegada), tabla de tiempos de espera, finalización, penalización y promedio de penalización.

| Algoritmo | Descripción |
|-----------|-------------|
| **FCFS** | First-Come, First-Served. Atiende por orden de llegada. |
| **SJF** | Shortest Job First. Elige el proceso con la ráfaga más corta. |
| **SJRF** | Shortest Job Remaining First. Versión expropiativa del SJF. |
| **Prioridad** | Elige el proceso con mayor prioridad (menor valor = mayor prioridad). |
| **Round Robin** | Asigna un quantum de tiempo a cada proceso en forma circular. |

### Gestión de memoria

Algoritmos de reemplazo de páginas con tabla de marcos por referencia, metadata específica de cada algoritmo y contador de fallos de página.

| Algoritmo | Descripción |
|-----------|-------------|
| **FIFO** | First-In, First-Out. Reemplaza la página más antigua. |
| **LRU** | Least Recently Used. Reemplaza la página menos recientemente usada. |
| **Reloj** | Segunda oportunidad. Variante de FIFO con bit de referencia. |

### Planificación de disco

Algoritmos de scheduling del cabezal del disco duro con tabla de movimientos (desde / hasta / diferencia), desplazamiento total y gráfico de línea del recorrido.

| Algoritmo | Descripción |
|-----------|-------------|
| **FIFO** | First-In, First-Out. Atiende las peticiones en orden de llegada. |
| **SSTF** | Shortest Seek Time First. Elige la petición más cercana. |
| **SCAN** | Elevador. Recorre de extremo a extremo atendiendo a su paso. |
| **C-SCAN** | SCAN circular. Solo atiende de ida, vuelve al inicio sin atender. |
| **LOOK** | Variante de SCAN que no llega hasta el extremo si no hay peticiones. |
| **C-LOOK** | Variante circular de LOOK. |

## Modo debugger

Todos los módulos incluyen un **debugger interactivo** que permite:

- **Paso anterior / siguiente**: Navegar manualmente por cada estado del algoritmo.
- **Slider**: Moverte rápidamente a cualquier paso.
- **Autoplay**: Reproducir la ejecución automáticamente con velocidad ajustable.
- **Explicación textual**: Descripción de qué ocurre en cada paso.

Ideal para comprender el comportamiento interno de cada algoritmo y detectar errores de comprensión.

## Estructura del proyecto

```
Algoritmos-SO/
├── algoritmos-SO/              # Aplicación React + Vite
│   ├── src/
│   │   ├── algorithms/           # Motores puros de los algoritmos (JS modules)
│   │   │   ├── GestionDeProcesos.js
│   │   │   ├── GestionDeMemoria.js
│   │   │   ├── GestionDeDisco.js
│   │   │   └── validaciones.js
│   │   ├── components/         # Componentes React reutilizables
│   │   │   └── Debugger.jsx
│   │   ├── pages/              # Páginas principales de cada módulo
│   │   │   ├── ProcesosPage.jsx
│   │   │   ├── MemoriaPage.jsx
│   │   │   └── DiscoPage.jsx
│   │   ├── utils/              # Utilidades auxiliares
│   │   ├── main.jsx            # Punto de entrada
│   │   └── styles.css          # Estilos globales
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── README.md
└── .gitignore
```

## Convenciones de los algoritmos

Los archivos en `src/algorithms/` son módulos ES puros, sin dependencias de React, por lo que pueden importarse tanto en el frontend como en scripts de Node.js.

### Procesos

Parámetros (listas en paralelo, mismo índice = mismo proceso):

- `c`: tiempos de creación / llegada
- `t`: ráfagas de CPU (burst times)
- `p`: prioridades (menor valor = mayor prioridad)
- `q`: quantum (`-1` = no expropiativo, `0` = expropiativo, `> 0` = con quantum)

Retorno: array de pasos `{ proceso, inicio, fin, rafagasRestantes }`, donde `inicio` y `fin` son inclusivos y el tiempo arranca en 0.

### Memoria

- `demanda`: lista de páginas demandadas
- `slots`: cantidad de marcos disponibles

Retorno: array de pasos `{ memoria, metadata, puntero, fallo }`.

### Disco

- `inicio`: posición inicial del cabezal
- `demanda`: lista de pistas solicitadas
- `maxPista`: pista máxima (por defecto 199)

Retorno: array de pasos con el recorrido del cabezal.

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo en `http://localhost:5173` |
| `npm run build` | Genera el build de producción en `dist/` |
| `npm run preview` | Previsualiza el build de producción localmente |

## Licencia

Este proyecto es de código abierto. Sentite libre de usarlo, modificarlo y distribuirlo para fines educativos.
