# Plataforma de Inclusión Digital y Prevención de Fraude para Adultos Mayores 🇨🇷

Este proyecto es una plataforma web interactiva diseñada específicamente para disminuir la brecha tecnológica y mitigar el riesgo de fraude financiero en la población de adultos mayores en Costa Rica. A través de simuladores visuales y accesibles, los usuarios aprenden a reconocer e identificar vectores de ataque comunes en el entorno nacional, como el Phishing bancario y estafas mediante SINPE Móvil o Smishing.

Desarrollado bajo el marco del curso **AN-405 Fundamentos de Administración de Proyectos**, el proyecto integra de manera transversal la ingeniería de sistemas, la ciberseguridad, la ciencia de datos y el cumplimiento legal normativo (Ley Prodhab).

---

## 🚀 Características del MVP Actual (Primer Avance)

El prototipo actual está construido utilizando tecnologías web nativas (**Vanilla Architecture**), garantizando un rendimiento óptimo, carga instantánea y nula dependencia de librerías externas pesadas:

* **Accesibilidad Web (A11y):** Interfaz diseñada con fuentes grandes (mínimo `20px`), elementos con alto contraste adaptados para fatiga visual (`--bg: #071028`, `--panel: #0b2a4a`), padding amplio para facilitar la interacción táctil y etiquetas semánticas de accesibilidad (`aria-hidden`, `role="dialog"`).
* **Simulador de Phishing Bancario:** Replicación visual de una bandeja de entrada de correo electrónico simulando entidades locales (Banco Nacional / BCR). Incluye análisis interactivo de "pistas rojas" al interactuar con enlaces maliciosos.
* **Simulador de Mensajes / SINPE Móvil:** Interfaz que simula un entorno móvil para mensajería SMS. Replica el fraude de "falso depósito por error" solicitando códigos de verificación por mensaje.
* **Motor de Retroalimentación Educativa:** Sistema basado en capas de superposición funcionales (`modal-overlay`) que bloquea la interfaz y guía de manera interactiva con reglas de oro ante riesgos cibernéticos.

---

## 🛠️ Stack Tecnológico

* **Frontend:** HTML5 Semántico, CSS3 Personalizado (Custom Variables) y JavaScript Vanilla (ES6+).
* **Infraestructura de Producción:** Servidor local privado (On-Premises Homelab).
* **Gobernanza y Red:** Exposición segura mediante túneles cifrados (Cloudflare Tunnels) con terminación TLS/HTTPS obligatoria y mitigación DDoS.

---

## 🗺️ Roadmap del Proyecto (Entregas cada 3-4 semanas)

Para garantizar un producto vendible ante jurados corporativos de alto nivel, el desarrollo se divide en los siguientes bloques de maduración:

```mermaid
gantt
    title Plan de Lanzamiento e Iteración del MVP
    dateFormat  YYYY-MM-DD
    section MVP 1: Validación
    Arquitectura Base e Interfaz Accesible  :done, 2026-05-01, 2026-05-18
    section MVP 2: Backend e Infra (S7-S8)
    Despliegue en Servidor + Base de Datos  :active, 2026-05-19, 2026-06-08
    Modelado del Negocio y Monetización B2B : 2026-05-19, 2026-06-08
    section MVP 3: Analítica e IA (S11-S12)
    Pipeline de Ciencia de Datos y Métricas : 2026-06-09, 2026-06-29
    Auditoría de Ciberseguridad y Prodhab   : 2026-06-09, 2026-06-29
    section Entrega Final (S15)
    Simulación General y Pitch ante Jurado  : 2026-06-30, 2026-07-20