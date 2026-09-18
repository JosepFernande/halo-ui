# Script de Mantenimiento: `/reindex-docs`

## Propósito

Regenerar `assets/document-index.json` escaneando `docs/*.md`. A diferencia del
mecanismo anterior (clonar y sincronizar un repo de Wiki externo), esto es una
operación puramente local, sin git ni red: `docs/` ya está en el working tree.

No es parte del flujo normal de crear/revisar issues — solo hace falta correrlo
cuando:

- Se agrega o renombra un archivo en `docs/`
- El contenido de un archivo existente cambia lo bastante como para que sus tags
  queden desactualizados

## Flujo de ejecución

### Paso 1: Listar los archivos de `docs/`

```typescript
const files = await Glob({ pattern: 'docs/*.md' });
// → ['docs/architecture-and-foundation.md', 'docs/ci-cd-pipeline.md', ...]
```

### Paso 2: Para cada archivo, leer contenido y generar tags

```typescript
const documents = [];

for (const filePath of files) {
  const file = filePath.replace(/^docs\//, '');
  const content = await Read({ file_path: filePath });
  const page = firstH1(content) ?? file.replace(/\.md$/, '');
  const tags = generateTags(content, file);

  documents.push({ page, file, tags });
}
```

### Paso 3: Escribir el índice

```typescript
await Write({
  file_path: 'skills/github-issues-from-docs/assets/document-index.json',
  content: JSON.stringify({ docs_dir: 'docs', documents }, null, 2),
});
```

A diferencia del índice anterior, este archivo **sí se versiona** (vive en
`skills/`, no en un directorio gitignoreado): un cambio en el índice se revisa
como cualquier otro cambio de la skill, en el mismo PR que agrega o modifica el
documento que lo motivó.

## Algoritmo de generación de tags

```typescript
function generateTags(content: string, file: string): string[] {
  const tags = new Set<string>();
  const contentLower = content.toLowerCase();
  const fileLower = file.toLowerCase();

  // 1. Tags por nombre de archivo
  if (fileLower.includes('architecture')) tags.add('arquitectura');
  if (fileLower.includes('css')) tags.add('css');
  if (fileLower.includes('theming')) tags.add('theme-engine');
  if (fileLower.includes('testing')) tags.add('testing');
  if (fileLower.includes('release')) tags.add('release');
  if (fileLower.includes('ci-cd')) tags.add('ci');
  if (fileLower.includes('cva')) tags.add('cva');
  if (fileLower.includes('showcase')) tags.add('showcase');
  if (fileLower.includes('contribution')) tags.add('contributing');
  if (fileLower.includes('components')) tags.add('components');

  // 2. Tags por contenido
  if (contentLower.includes('token')) tags.add('tokens');
  if (contentLower.includes('signal')) tags.add('signals');
  if (contentLower.includes('standalone')) tags.add('standalone');
  if (
    contentLower.includes('css variables') ||
    contentLower.includes('custom properties')
  )
    tags.add('css-variables');
  if (contentLower.includes('viewencapsulation'))
    tags.add('view-encapsulation');
  if (contentLower.includes('providehatheme')) tags.add('provideHaTheme');
  if (contentLower.includes('themeservice')) tags.add('ThemeService');
  if (contentLower.includes('controlvalueaccessor')) tags.add('cva');
  if (contentLower.includes('nx')) tags.add('nx');
  if (contentLower.includes('changeset')) tags.add('changesets');
  if (contentLower.includes('stylelint')) tags.add('stylelint');
  if (contentLower.includes('eslint')) tags.add('eslint');
  if (contentLower.includes('button')) tags.add('button');
  if (contentLower.includes('input-text')) tags.add('input-text');
  if (contentLower.includes('select')) tags.add('select');
  if (contentLower.includes('pre-commit')) tags.add('pre-commit');
  if (
    contentLower.includes('trusted publishing') ||
    contentLower.includes('oidc')
  )
    tags.add('trusted-publishing');

  // 3. Limitar a 15 tags
  return Array.from(tags).slice(0, 15);
}

function firstH1(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}
```

## Manejo de errores

### Archivo de `docs/` no legible

```typescript
try {
  const content = await Read({ file_path: filePath });
} catch (error) {
  console.warn(`No se pudo leer ${filePath}, se omite del índice.`);
  continue;
}
```

### Falla la escritura del índice

```typescript
try {
  const content = JSON.stringify({ docs_dir: 'docs', documents }, null, 2);
  JSON.parse(content); // validar antes de escribir
  await Write({
    file_path: 'skills/github-issues-from-docs/assets/document-index.json',
    content,
  });
} catch (error) {
  console.error('Error escribiendo document-index.json:', error);
  console.warn('El índice anterior sigue vigente hasta la próxima corrida.');
}
```

## Recomendaciones

1. Correr `/reindex-docs` como parte del mismo PR que agrega, renombra o
   reescribe significativamente un archivo de `docs/`
2. No hace falta correrlo por rutina (no hay nada que se desactualice solo con
   el paso del tiempo, a diferencia del clone de un repo externo)
3. Si `docs/` incorpora contenido migrado desde la wiki (ver
   `references/docs-index-patterns.md`, sección "Limitaciones"), agregarlo al
   índice en el mismo cambio
