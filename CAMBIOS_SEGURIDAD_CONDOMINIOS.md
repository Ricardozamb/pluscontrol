# Mejoras de seguridad y condominios — rama de revisión

Este cambio NO debe fusionarse en producción sin configurar variables de entorno y validar sus funciones.

## Configuración requerida en Render
- `PC_ADMIN_PASSWORD`: contraseña nueva y robusta de la cuenta administradora.
- `PC_ALAN_PASSWORD`: contraseña nueva y robusta de la cuenta revisora.
- `ANTHROPIC_API_KEY`: secreto existente de Anthropic, mantener en Render.
- `PC_AI_REQUESTS_PER_HOUR`: opcional, límite horario (predeterminado 30).

**No publicar ni compartir las contraseñas antiguas**: se encontraban en el JavaScript público, por lo que deben considerarse expuestas.

## Cambios aplicados
- Inicio de sesión validado en el servidor, con cookie HttpOnly, límite básico de intentos y permisos del endpoint de IA.
- El servidor elige el contexto de condensación legal por tipo de documento y no acepta un `system` arbitrario del navegador.
- Se elimina el borrado silencioso de documentos locales cuando se llena `localStorage`.
- En el módulo Condominios se añaden los campos de pisos por torre (por ejemplo `A:5; B:5; C:4; D:4`), inventario por piso `C|detector|5|4`, información de planos y zonas de encuentro.
- Se informan errores de equipos en pisos que no existen, situación jurídica no determinada, falta de planos y zonas pendientes.
- Los PDF del módulo se rotulan como **BORRADOR NO FIRMADO**. Una aprobación registrada en la interfaz no es firma electrónica.

## Limitaciones
- Los documentos y formularios existentes continúan mayoritariamente en almacenamiento local del navegador: no hay respaldo centralizado.
- El campo de planos no adjunta archivos reales todavía; es un registro descriptivo que se valida como pendiente si no hay evidencia.
- La app sigue necesitando revisión jurídica y técnica humana, especialmente el procedimiento de firma, zonas de seguridad, inventario real de instalaciones y el texto normativo.
- Las sesiones de servidor se almacenan en memoria y expiran al reiniciar Render.
- No se ha ejecutado una generación real de Anthropic ni una prueba final del navegador en esta rama.
- Antes de unir a `main`: probar recuperación de sesión, generación empresarial, generación de condominios, Safari móvil y copias de respaldo. Un merge a main podría generar un despliegue automático en Render.

## Recomendación
Desplegar esta rama en un servicio de prueba separado. No configurar `PC_ADMIN_PASSWORD` ni `PC_ALAN_PASSWORD` en el archivo .env de GitHub; mantenerlos solamente en las variables protegidas de Render.
