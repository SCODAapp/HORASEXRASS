# Configuración de Emails en Supabase

Esta guía te ayudará a configurar los emails personalizados de Supabase para que incluyan tu logo y redirijan correctamente a tu sitio web.

## Paso 1: Obtener la URL de tu sitio web

Tu aplicación está configurada para GitHub Pages con el repositorio **HEXTRAS**. Tu URL será:

```
https://[tu-usuario-github].github.io/HEXTRAS
```

**Por ejemplo:** Si tu usuario de GitHub es `juanperez`, tu URL sería: `https://juanperez.github.io/HEXTRAS`

**Importante:** Anota tu URL completa, la necesitarás en los siguientes pasos.

## Paso 2: Configurar la URL de redirección en Supabase

1. Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard)
2. Selecciona tu proyecto **yoyoukjbhauuarjhweyb**
3. En el menú lateral, ve a **Authentication** → **URL Configuration**
4. En **Site URL**, ingresa la URL completa de tu aplicación (reemplaza `tu-usuario` con tu usuario de GitHub):
   ```
   https://tu-usuario.github.io/HEXTRAS
   ```
5. En **Redirect URLs**, agrega las siguientes URLs (una por línea, reemplazando `tu-usuario`):
   ```
   https://tu-usuario.github.io/HEXTRAS
   https://tu-usuario.github.io/HEXTRAS/*
   https://tu-usuario.github.io/HEXTRAS/**
   http://localhost:5173
   http://localhost:5173/*
   ```
6. Haz clic en **Save**

## Paso 3: Configurar las plantillas de email

1. En el Dashboard de Supabase, ve a **Authentication** → **Email Templates**

2. Para cada tipo de email (Confirm signup, Invite user, Magic Link, Change Email Address, Reset Password), haz lo siguiente:

### A. Confirm signup (Confirmar registro)

1. Haz clic en **Confirm signup**
2. Borra el contenido HTML existente
3. Copia el contenido del archivo `supabase/email-templates/confirm-signup.html`
4. Pégalo en el editor
5. Haz clic en **Save**

### B. Invite user (Invitar usuario)

1. Haz clic en **Invite user**
2. Borra el contenido HTML existente
3. Copia el contenido del archivo `supabase/email-templates/invite.html`
4. Pégalo en el editor
5. Haz clic en **Save**

### C. Magic Link (Enlace mágico)

1. Haz clic en **Magic Link**
2. Borra el contenido HTML existente
3. Copia el contenido del archivo `supabase/email-templates/magic-link.html`
4. Pégalo en el editor
5. Haz clic en **Save**

### D. Change Email Address (Cambiar email)

1. Haz clic en **Change Email Address**
2. Borra el contenido HTML existente
3. Copia el contenido del archivo `supabase/email-templates/change-email.html`
4. Pégalo en el editor
5. Haz clic en **Save**

### E. Reset Password (Recuperar contraseña)

1. Haz clic en **Reset Password**
2. Borra el contenido HTML existente
3. Copia el contenido del archivo `supabase/email-templates/recovery.html`
4. Pégalo en el editor
5. Haz clic en **Save**

## Paso 4: Deshabilitar confirmación de email (Opcional)

Si NO quieres que los usuarios tengan que confirmar su email antes de poder iniciar sesión:

1. Ve a **Authentication** → **Providers**
2. Haz clic en **Email**
3. Desactiva la opción **"Confirm email"**
4. Haz clic en **Save**

**Nota:** Si dejas la confirmación de email activada, los usuarios deberán hacer clic en el enlace del email antes de poder iniciar sesión.

## Paso 5: Verificar que funciona

1. Regístrate con un nuevo usuario de prueba
2. Revisa tu bandeja de entrada
3. Verifica que:
   - El email tenga el logo de ExtraSS
   - El diseño se vea profesional
   - Al hacer clic en el botón, te redirija a tu sitio web (no a localhost:3000)
   - Después de la redirección, la sesión se inicie correctamente

## Solución de problemas

### El logo no aparece en los emails

- Asegúrate de que el archivo `logoextrass.png` esté en la carpeta `public/` de tu proyecto
- Verifica que el archivo esté desplegado correctamente en tu sitio web
- Prueba accediendo directamente a `https://tu-sitio.com/logoextrass.png` en el navegador

### Los enlaces redirigen a localhost:3000

- Verifica que hayas configurado correctamente la **Site URL** en el Paso 2
- Asegúrate de haber agregado todas las **Redirect URLs**
- Espera unos minutos después de guardar los cambios

### Los emails no llegan

- Revisa la carpeta de spam
- Verifica que el email esté correctamente escrito
- En el Dashboard de Supabase, ve a **Authentication** → **Logs** para ver si hay errores

## Variables disponibles en las plantillas

Las plantillas de email de Supabase tienen acceso a estas variables:

- `{{ .ConfirmationURL }}` - URL de confirmación con el token
- `{{ .SiteURL }}` - URL configurada en Site URL
- `{{ .Token }}` - Token de verificación
- `{{ .TokenHash }}` - Hash del token
- `{{ .Email }}` - Email del usuario

## Notas adicionales

- Los emails son enviados por el servidor SMTP de Supabase
- Para personalizar el remitente, necesitas configurar un servidor SMTP personalizado en **Settings** → **Auth** → **SMTP Settings**
- Las plantillas usan Go templates (sintaxis `{{ }}`)
