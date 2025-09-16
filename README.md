# AIP - Sistema de Gestión Académica

Sistema integral de gestión académica desarrollado con Next.js 15, TypeScript y Supabase.

## 🚀 Características

- **Gestión de Usuarios**: Sistema completo de autenticación y roles
- **Reservas**: Sistema de reservas de recursos académicos
- **Préstamos**: Gestión de préstamos de materiales
- **Reuniones**: Programación y gestión de reuniones
- **Personalización**: Configuración personalizable de la aplicación
- **Tiempo Real**: Actualizaciones en tiempo real con Supabase
- **Responsive**: Diseño adaptable a todos los dispositivos

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: Vercel
- **Icons**: Lucide React

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta en Supabase
- Cuenta en Vercel (para deploy)

## 🔧 Instalación Local

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd AIP-3
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   
   Edita `.env.local` con tus credenciales de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
   SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio
   ```

4. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```

   La aplicación estará disponible en `http://localhost:3000`

## 🗄️ Configuración de Base de Datos

La aplicación utiliza Supabase como backend. Asegúrate de:

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Configurar las tablas necesarias (usuarios, reservas, préstamos, etc.)
3. Habilitar Row Level Security (RLS) en las tablas
4. Configurar las políticas de acceso apropiadas

## 🚀 Deploy en Vercel

### Opción 1: Deploy Automático desde GitHub

1. **Subir código a GitHub**
   ```bash
   git add .
   git commit -m "Preparar para deploy"
   git push origin main
   ```

2. **Conectar con Vercel**
   - Ve a [Vercel Dashboard](https://vercel.com/dashboard)
   - Haz clic en "New Project"
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente que es un proyecto Next.js

3. **Configurar Variables de Entorno**
   En Vercel Dashboard → Tu Proyecto → Settings → Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
   SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio
   ```

4. **Deploy**
   - Haz clic en "Deploy"
   - Vercel construirá y desplegará automáticamente

### Opción 2: Deploy Manual con Vercel CLI

1. **Instalar Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login y Deploy**
   ```bash
   vercel login
   vercel --prod
   ```

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── api/               # API Routes
│   ├── dashboard/         # Páginas del dashboard
│   ├── login/            # Página de login
│   └── register/         # Página de registro
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes de UI (shadcn)
│   └── dashboard/        # Componentes específicos del dashboard
├── context/              # Context providers
├── lib/                  # Utilidades y configuraciones
└── types/                # Definiciones de tipos TypeScript
```

## 🔒 Seguridad

- Autenticación manejada por Supabase Auth
- Row Level Security (RLS) habilitado
- Variables de entorno para credenciales sensibles
- Headers de seguridad configurados
- Validación de tipos con TypeScript

## 🎨 Personalización

La aplicación incluye un sistema de personalización que permite:
- Cambiar el nombre de la aplicación
- Personalizar el logo
- Configurar imagen de fondo
- Ajustar colores y temas

Accede a través de: Dashboard → Ajustes → Personalización

## 📱 Responsive Design

La aplicación está optimizada para:
- 📱 Móviles (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1440px+)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes problemas o preguntas:
1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue si es necesario

---

**Desarrollado con ❤️ para la gestión académica moderna**
