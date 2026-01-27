# Resumen Rápido: Configurar Emails de Supabase

## 🎯 Problema que resolvemos

- Los emails de confirmación no se ven profesionales
- Los enlaces redirigen a localhost:3000 en lugar de tu sitio web
- No tienen el logo de tu app

## ✅ Solución en 3 pasos

### 1. Configurar URLs en Supabase (5 minutos)

Ve a: https://supabase.com/dashboard → Tu proyecto → Authentication → URL Configuration

**Site URL:** Pon tu URL de GitHub Pages (ejemplo: `https://tuusuario.github.io/HEXTRAS`)

**Redirect URLs:** Agrega estas URLs:
```
https://tuusuario.github.io/HEXTRAS
https://tuusuario.github.io/HEXTRAS/*
https://tuusuario.github.io/HEXTRAS/**
http://localhost:5173
http://localhost:5173/*
```

### 2. Copiar plantillas de email (10 minutos)

Ve a: Authentication → Email Templates

Para cada tipo de email:
1. Abre el archivo correspondiente en `supabase/email-templates/`
2. Copia todo el contenido HTML
3. Pégalo en el editor de Supabase
4. Guarda

**Archivos:**
- `confirm-signup.html` → Confirm signup
- `invite.html` → Invite user
- `magic-link.html` → Magic Link
- `recovery.html` → Reset Password
- `change-email.html` → Change Email Address

### 3. (Opcional) Deshabilitar confirmación de email

Si quieres que los usuarios puedan iniciar sesión sin confirmar email:

Authentication → Providers → Email → Desactivar "Confirm email"

## 🎨 Características de las nuevas plantillas

- Logo de ExtraSS centrado en la parte superior
- Diseño profesional y moderno
- Botones grandes y visibles
- Responsive (se ve bien en móvil)
- Enlaces alternativos para copiar/pegar
- Footer con copyright

## 📝 Para más detalles

Revisa el archivo `CONFIGURACION_EMAILS_SUPABASE.md` para instrucciones detalladas y solución de problemas.
