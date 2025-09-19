# Migraciones de Base de Datos

Este directorio contiene las migraciones SQL necesarias para mantener la base de datos actualizada.

## Cómo ejecutar las migraciones

### Opción 1: Usando Supabase Dashboard
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a la sección "SQL Editor"
3. Copia y pega el contenido del archivo de migración
4. Ejecuta la consulta

### Opción 2: Usando Supabase CLI
```bash
# Si tienes Supabase CLI instalado
supabase db reset
# o
supabase db push
```

### Opción 3: Usando psql (si tienes acceso directo)
```bash
psql -h [HOST] -p [PORT] -U [USER] -d [DATABASE] -f add_missing_resources_to_loans.sql
```

## Migraciones Disponibles

### `add_missing_resources_to_loans.sql`
**Propósito**: Agrega el campo `missing_resources` a la tabla `loans` para almacenar información sobre recursos no devueltos.

**Cambios**:
- Agrega columna `missing_resources` de tipo JSONB con valor por defecto `[]`
- Agrega comentario explicativo
- Crea índice GIN para optimizar consultas sobre recursos faltantes

**Requerido para**: Sistema de checkboxes de devolución de préstamos

## Notas Importantes

- **Siempre haz un backup** de tu base de datos antes de ejecutar migraciones
- Las migraciones deben ejecutarse en orden cronológico
- Verifica que la migración se ejecutó correctamente antes de continuar
- Si algo sale mal, restaura desde el backup

## Verificación Post-Migración

Para verificar que la migración se ejecutó correctamente:

```sql
-- Verificar que la columna existe
\d loans

-- O usando SQL estándar
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'loans' AND column_name = 'missing_resources';

-- Verificar que el índice existe
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'loans' AND indexname = 'idx_loans_missing_resources';
```