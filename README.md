# ✂ BarberBooks — Sistema de Gestión Financiera para Barberías

Sistema web completo para registrar, visualizar y analizar ingresos y gastos de una barbería.

---

## 🚀 Uso inmediato (sin instalar nada)

La versión **standalone** funciona directamente en el navegador sin servidor ni base de datos.

1. Abre el archivo `index.html` directamente en tu navegador (doble clic).
2. ¡Listo! Los datos se guardan automáticamente en tu navegador (localStorage).

> ⚠️ Los datos del modo standalone viven en el navegador. Si limpias el caché, se pierden.
> Usa **Exportar → JSON** para hacer backup antes de limpiar el navegador.

---

## ⚙️ Instalación con Backend (Node.js + SQLite)

Este modo guarda los datos en una base de datos real. Recomendado para uso profesional.

### Requisitos
- Node.js 18 o superior → https://nodejs.org
- npm (incluido con Node.js)

### Pasos

```bash
# 1. Entra a la carpeta del proyecto
cd barberbooks

# 2. Instala las dependencias
npm install

# 3. Copia el frontend al directorio public
mkdir public
cp index.html public/

# 4. Inicia el servidor
npm start

# 5. Abre en el navegador
# http://localhost:3000
```

### Modo desarrollo (recarga automática)

```bash
npm run dev
```

---

## 📁 Estructura del proyecto

```
barberbooks/
├── index.html        ← Frontend completo (standalone)
├── server.js         ← Backend Node.js + Express
├── package.json      ← Dependencias npm
├── README.md         ← Este archivo
├── barberbooks.db    ← Base de datos SQLite (se crea automáticamente)
└── public/           ← Frontend servido por el backend
    └── index.html
```

---

## 🔌 API REST (modo backend)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/records` | Listar registros (acepta filtros) |
| GET | `/api/records/:id` | Obtener un registro |
| POST | `/api/records` | Crear nuevo registro |
| PUT | `/api/records/:id` | Actualizar registro |
| DELETE | `/api/records/:id` | Eliminar registro |
| GET | `/api/stats` | Estadísticas del dashboard |

### Filtros disponibles en GET /api/records

```
?type=income          → solo ingresos
?type=expense         → solo gastos
?from=2024-01-01      → desde fecha
?to=2024-01-31        → hasta fecha
?search=corte         → búsqueda en descripción/categoría
?limit=100            → máximo de resultados
?offset=0             → paginación
```

### Ejemplo de body para POST/PUT

```json
{
  "type": "income",
  "amount": 15.00,
  "date": "2024-03-30",
  "description": "Corte de cabello - Carlos",
  "category": "Cortes",
  "extra": "Efectivo",
  "notes": "Cliente frecuente"
}
```

---

## ✨ Funcionalidades

- ✅ Registrar ingresos y gastos con categorías
- ✅ Filtrar por día, semana, mes o rango personalizado
- ✅ Búsqueda en tiempo real
- ✅ Editar y eliminar cualquier registro
- ✅ Dashboard con resumen (ingresos, gastos, ganancia neta, movimientos de hoy)
- ✅ Gráficas: barras 7 días, dona de categorías, línea 30 días
- ✅ Exportar a Excel (.xlsx) con hojas separadas
- ✅ Exportar a PDF con reporte imprimible
- ✅ Backup/restaurar en JSON
- ✅ Responsive (funciona en móvil y computadora)
- ✅ Validación de todos los campos del formulario

---

## 🎨 Tecnologías usadas

**Frontend**
- HTML5, CSS3 (variables CSS, Grid, Flexbox)
- JavaScript vanilla (sin frameworks)
- Chart.js 4 — gráficas
- SheetJS (xlsx) — exportar Excel
- jsPDF — exportar PDF
- Google Fonts: DM Serif Display + DM Sans

**Backend**
- Node.js + Express 4
- better-sqlite3 (base de datos SQLite)
- CORS habilitado

---

## 💡 Consejos de uso

1. **Primera vez**: El sistema te ofrece cargar datos de ejemplo para explorar las funciones.
2. **Backup**: Exporta tu JSON mensualmente como respaldo.
3. **Filtros**: Usa el filtro "Mes" para ver el balance mensual completo.
4. **Excel**: El archivo exportado tiene 3 hojas: Ingresos, Gastos y Resumen.

---

## 🔧 Personalización fácil

Para agregar categorías, edita estas líneas en `index.html`:

```javascript
const INCOME_CATS = ['Servicios','Cortes','Barbas y Afeitados', ...];
const EXPENSE_CATS = ['Alquiler','Productos/Insumos', ...];
```

Para cambiar el nombre del negocio, busca "BarberBooks" en el HTML y reemplázalo.

---

Desarrollado para pequeños negocios · BarberBooks v1.0
