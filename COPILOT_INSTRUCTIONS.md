# CLUBDIGI — Instrucciones para GitHub Copilot con Claude Sonnet 4.6

## TU MISIÓN
Eres el agente de desarrollo de CLUBDIGI — la app exclusiva para apoderados de clubes deportivos.
Completa todas las pantallas en Expo React Native siguiendo el sistema de diseño azul `#1A3A7C`.

## REGLAS DE DISEÑO (NO NEGOCIABLES)
1. **Color primario**: `#1A3A7C` (azul ClubDigi) en header, botones primarios, acentos.
2. **Carnet**: usar `<CarnetIcon>` — SOLO icono + punto verde. Sin texto.
3. **Estados**: punto de color (verde=ok, amarillo=pendiente, rojo=acción requerida).
4. **Selector de pupilo**: siempre visible en el header si hay más de 1 pupilo.
5. **Sin gamificación**: no hay XP ni retos. Solo información del pupilo.

## PANTALLAS A COMPLETAR

### Onboarding Apoderado
- [ ] SplashScreen.tsx — splash azul ClubDigi
- [ ] PhoneScreen.tsx — login con teléfono (sin contraseña)
- [ ] OTPScreen.tsx — código 6 dígitos
- [ ] PupilSelectorScreen.tsx — seleccionar pupilo al iniciar sesión

### Principal
- [x] HomeScreen.tsx — COMPLETADO (referencia)
- [ ] AgendaScreen.tsx — calendario pupilo: entrenamientos + partidos
- [ ] GestionScreen.tsx — centro de gestión

### Asistencia
- [ ] AsistenciaScreen.tsx — historial asistencia con barras y %
- [ ] AsistenciaDetalleScreen.tsx — mes a mes detallado

### Pagos
- [ ] PagosScreen.tsx — pendientes + historial + botón pagar
- [ ] PagoDetalleScreen.tsx — detalle de un pago + recibo

### Comunicados
- [ ] ComunicadosScreen.tsx — lista con unread dots
- [ ] ComunicadoDetalleScreen.tsx — detalle de mensaje

### Documentos
- [ ] DocumentosScreen.tsx — lista: autorización, contratos, médicos
- [ ] DocumentoFirmaScreen.tsx — firma digital de documentos pendientes

### Carnet Pupilo
- [ ] CarnetScreen.tsx — carnet completo del pupilo con QR + token
- [ ] CarnetEnrolarScreen.tsx — enrolar pupilo en nueva liga via QR/código

### Perfil
- [ ] PerfilScreen.tsx — datos del apoderado + pupilos
- [ ] EditarPupilo.tsx — editar datos del pupilo
- [ ] ConfiguracionScreen.tsx — notificaciones + logout

## NAVEGACIÓN
```
App.tsx
├── AuthNavigator (stack)
│   └── Splash → Phone → OTP
└── AppNavigator
    ├── HomeScreen (tab: Inicio)
    ├── AgendaScreen (tab: Agenda)
    └── GestionScreen (tab: Gestión)
        ├── Asistencia
        ├── Pagos
        ├── Comunicados
        └── Documentos
```

## COMPONENTES DISPONIBLES
- `<AppHeader>` — header azul con selector pupilo integrado
- `<CarnetIcon>` — icono carnet + punto verde
- `<CarnetModal>` — carnet del pupilo con QR + token
- `<PupilSelector>` — bottom sheet selector de pupilo
- `<StatusPill>` — pill con punto de color + texto + valor

## PASOS PARA EJECUTAR
```bash
npm install
npm start
```

## DATOS DE PRUEBA
El proyecto incluye `src/mock/data.ts` con datos de ejemplo para desarrollar sin backend.
Pupilos de prueba: Carlos Muñoz Jr. (Alevín #8) y Ana Muñoz (Sub-14 #5)
