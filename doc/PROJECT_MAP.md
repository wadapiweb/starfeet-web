# PROJECT_MAP

Registro centralizado de componentes bajo la estricta jerarquía de Diseño Atómico.

## Distribución de Componentes por Repositorio

### 1. Repositorio `starfeet-landing` (Landing / Cloud)
Componentes puramente visuales y de presentación para la Landing Page:

| Jerarquía | Componente | Propósito | Estado |
| :--- | :--- | :--- | :--- |
| Organisms | `Hero` | Pantalla inicial de impacto de página principal. | Activo |
| Organisms | `Manifesto` | Propuesta de valor a pantalla completa con scrollytelling. | Activo |
| Organisms | `Technology` | Sección de tecnología del producto con dots y líneas interactivas. | Activo |
| Organisms | `ProductStages` | Sección explicativa de las 3 etapas del producto. | Activo |
| Organisms | `CuandoPisasBien` | Banner de transición a pantalla completa con marquesina y efecto parallax. | Activo |
| Organisms | `HealthSolution` | Sección explicativa de soluciones de salud (dolor, recuperación, sobrecarga, pisada). | Activo |
| Organisms | `UnerValidation` | Sección de comprobación científica basada en el informe de la UNER. | Activo |
| Organisms | `Testimonials` | Sección de testimonios en formato 9:16 con soporte para Texto/Video/Audio. | Activo |
| Organisms | `Garantia` | Sección de garantía de resultados con fondo de imagen y sello dorado. | Activo |
| Organisms | `Navbar` | Barra de navegación estática con enlaces absolutos a la tienda. | Activo |
| Organisms | `Footer` | Pie de página moderno e interactivo con animaciones y firma Sumak. | Activo |
| Molecules | `ProductCard` | Tarjeta de producto con enlace absoluto de compra rápida. | Activo |
| Atoms | `UserAvatar` | Avatar de usuario con iniciales y control de carga de imagen fallida. | Activo |

### 2. Repositorio `starfeet-web` (Plataforma Core / VPS)
Componentes transaccionales, de control, formularios de registro, checkout y paneles privados:

- **admin/**: Vistas de gestión, tablas financieras, asignación de cupones, listado de kinesiólogos.
- **kinesio/**: Perfil del profesional, métricas del uso de cupones asignados, listado de pacientes.
- **cliente/**: Órdenes del usuario final y seguimiento.
- **shop/**: Flujo de checkout y pasarela.
- **auth/**: Formularios de Login, Recuperación y Registro transaccionales.
