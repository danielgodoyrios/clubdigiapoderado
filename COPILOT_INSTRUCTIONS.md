# CLUB DIGI APP — Instrucciones para GitHub Copilot con Claude Sonnet 4.6

## TU MISIÓN
Eres el agente de desarrollo de la **Club Digi App** — la plataforma móvil multi-rol para la gestión integral de clubes deportivos digitales (ClubDigi).
La app no es exclusiva de apoderados: soporta múltiples roles (apoderado, profesor, admin, y más según la institución).
Todo el desarrollo está en Expo React Native siguiendo el sistema de diseño azul `#1A3A7C`.

## IDENTIDAD DE LA APP
- **Nombre oficial**: Club Digi App
- **Marca**: ClubDigi / Club Digi
- **Plataforma**: Portal de gestión de clubes deportivos digitales
- **Entorno**: Producción → `https://api.clubdigital.cl/v1`
- **Siempre referirse como**: "Club Digi App" o "ClubDigi" — NUNCA solo "app de apoderado"

## ROLES SOPORTADOS
| Rol | Screen raíz | Descripción |
|---|---|---|
| `apoderado` | `AppTabs` | Seguimiento de pupilos, pagos, comunicados |
| `profesor` | `ProfesorHome` | Gestión de clases, asistencia, notas |
| `admin` | `AdminHome` | Panel de control institucional |

Un usuario puede tener múltiples roles y cambiar entre ellos desde el SideMenu o Configuración.

## REGLAS DE DISEÑO (NO NEGOCIABLES)
1. **Color primario**: `#1A3A7C` (azul ClubDigi) en header, botones primarios, acentos.
2. **Carnet**: usar `<CarnetIcon>` — SOLO icono + punto verde. Sin texto.
3. **Estados**: punto de color (verde=ok, amarillo=pendiente, rojo=acción requerida).
4. **Selector de pupilo**: siempre visible en el header si hay más de 1 pupilo (solo rol apoderado).
5. **Sin gamificación**: no hay XP ni retos. Solo información real del club/pupilo.
6. **SideMenu**: accesible desde hamburguesa en pantallas principales. Muestra "Cambiar de rol" si el usuario tiene 2+ roles.

## ESTADO ACTUAL DE PANTALLAS

### Onboarding (completas)
- [x] SplashScreen.tsx
- [x] WelcomeScreen.tsx — onboarding 3 slides (se muestra 1 sola vez)
- [x] PhoneScreen.tsx — login con teléfono
- [x] OTPScreen.tsx — código 6 dígitos con autoFocus
- [x] RoleSelectorScreen.tsx — selección de rol (login + cambio in-app con `fromApp` param)
- [x] PupilSelectorScreen.tsx — seleccionar pupilo al iniciar sesión (solo apoderado)

### Rol: Apoderado (completas)
- [x] HomeScreen.tsx
- [x] AgendaScreen.tsx
- [x] GestionScreen.tsx
- [x] AsistenciaScreen.tsx
- [x] AsistenciaDetalleScreen.tsx
- [x] PagosScreen.tsx
- [x] PagoDetalleScreen.tsx
- [x] ComunicadosScreen.tsx
- [x] ComunicadoDetalleScreen.tsx
- [x] DocumentosScreen.tsx
- [x] DocumentoFirmaScreen.tsx
- [x] CarnetScreen.tsx — carnet digital con QR + token rotativo cada 5 min
- [x] CarnetEnrolarScreen.tsx
- [x] PerfilScreen.tsx
- [x] EditarPupilo.tsx
- [x] ConfiguracionScreen.tsx — notificaciones + logout (auth context) + cambiar rol

### Rol: Profesor
- [x] HomeScreen.tsx (básico)

### Rol: Admin
- [x] HomeScreen.tsx (básico)

## AUTENTICACIÓN Y ROLES
- JWT Bearer tokens en AsyncStorage: `auth_access_token`, `auth_refresh_token`, `active_role`
- `AuthContext` exporta: `state`, `requestOTP`, `verifyOTP`, `setActiveRole`, `setActivePupil`, `refreshPupils`, `logout`
- `state.user.roles[]` — lista de roles del usuario autenticado
- `state.activeRole` — rol activo actual
- `logout()` limpia storage + resetea estado → navega a Splash automáticamente

## FLUJO DE CAMBIO DE ROL
1. Usuario abre SideMenu (hamburguesa) → ve "Cambiar de rol" si tiene 2+ roles
2. O desde Configuración → "Cambiar de rol"
3. Ambos navegan a `RoleSelector` con param `{ fromApp: true }`
4. `RoleSelectorScreen` llama `setActiveRole(rol)` + `CommonActions.reset` al stack del nuevo rol

## COMPONENTES DISPONIBLES
- `<SideMenu>` — panel lateral con menú, info usuario, cambiar rol, logout
- `<Header>` — header azul con selector pupilo integrado
- `<CarnetIcon>` — icono carnet + punto verde
- `<CarnetModal>` — carnet del pupilo con QR + token
- `<XPBar>` — barra de progreso (reservada)

## NAVEGACIÓN
```
App.tsx → AuthProvider → AppNavigation
├── Splash / Welcome / Phone / OTP / RoleSelector / PupilSelector
├── AppTabs (apoderado)
│   ├── Home → SideMenu → todas las sub-pantallas
│   ├── Agenda
│   └── Gestión → Asistencia, Pagos, Comunicados, Documentos, Carnet, Perfil
├── ProfesorHome (profesor)
└── AdminHome (admin)
```

## COMANDOS
```bash
npm install --legacy-peer-deps   # instalar dependencias
npx expo start --lan --clear     # dev server local (Expo Go SDK 54)
eas build --profile preview --platform android   # APK para pruebas
eas build --profile production --platform android  # AAB producción
git add -A && git commit -m "..." && git push
```

## STACK TÉCNICO
- Expo SDK ~54.0.0 / React Native 0.81.5 / React 19.1.0
- expo-router ~6.0.23, react-native-reanimated ~4.1.1
- @react-navigation/stack + bottom-tabs v7
- API base: `https://api.clubdigital.cl/v1`
