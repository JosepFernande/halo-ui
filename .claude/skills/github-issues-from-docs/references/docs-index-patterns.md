# Patrones del Índice de Documentación (`assets/document-index.json`)

## Principios

1. **Índice estático, sin freshness ni cache de contenido**: `docs/` vive en el
   mismo checkout que está usando el agente — ya es HEAD, siempre. El único rol
   de `assets/document-index.json` es mapear archivo → tags para elegir 3-5
   documentos relevantes sin leer los ~10 completos en cada ejecución. No guarda
   contenido, ni SHA de commit, ni timestamp de sincronización: nada de eso hace
   falta cuando la fuente es local.
2. **El índice viaja con la skill, no con el repo en runtime**: es un archivo
   versionado dentro de `skills/github-issues-from-docs/assets/`, se actualiza a
   mano (o con `/reindex-docs`) cuando cambia el contenido de `docs/`, igual que
   cualquier otro archivo de la skill.
3. **Sin operaciones de git ni de red**: a diferencia del mecanismo anterior
   (clone + pull + comparación de HEAD SHA contra un repo de Wiki externo), leer
   `docs/<archivo>.md` es una operación local (`Read`) que siempre devuelve el
   contenido actual — no hay nada que sincronizar.

## Ubicación y forma del archivo

```
skills/github-issues-from-docs/assets/document-index.json
```

Forma completa:

```json
{
  "docs_dir": "docs",
  "documents": [
    {
      "page": "Architecture & Foundation",
      "file": "architecture-and-foundation.md",
      "tags": ["arquitectura", "tokens", "standalone", "signals"]
    }
  ]
}
```

`file` es relativo a `docs_dir` (por convención, siempre `"docs"` en este repo).
El archivo real a leer es `${docs_dir}/${file}` →
`docs/architecture-and-foundation.md`.

## Patrones de lectura

### Cargar el índice

```typescript
async function loadIndex(): Promise<DocIndex | null> {
  try {
    const raw = await Read({
      file_path: 'skills/github-issues-from-docs/assets/document-index.json',
    });
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
```

Si `loadIndex()` devuelve `null` (archivo ausente o corrupto), no hay
auto-bootstrap silencioso: se reporta el error al usuario y se sugiere
`/reindex-docs`. Si igual hace falta continuar sin índice, el fallback es
`Glob('docs/*.md')` + leer todos los archivos encontrados.

### Filtrar documentos relevantes

```typescript
function pickRelevantDocs(index: DocIndex, keywords: string[]) {
  const scored = index.documents.map((doc) => {
    const matches = keywords.filter((k) => doc.tags.includes(k)).length;
    return { doc, score: matches / doc.tags.length };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.doc);
}
```

### Leer el contenido (siempre fresco, sin cache)

```typescript
async function readDoc(index: DocIndex, doc: DocEntry): Promise<string> {
  return await Read({ file_path: `${index.docs_dir}/${doc.file}` });
}
```

No hay una rama "cache hit" vs. "re-leer": `Read` sobre `docs/${doc.file}`
siempre devuelve el contenido actual del working tree. Esto reemplaza por
completo la validación de frescura por HEAD SHA que usaba el mecanismo anterior
basado en un clone del Wiki.

## Detectar un índice desactualizado (no bloqueante)

```typescript
async function checkIndexCoverage(index: DocIndex) {
  const actualFiles = await Glob({ pattern: 'docs/*.md' });
  const indexedFiles = new Set(index.documents.map((d) => d.file));

  const missing = actualFiles
    .map((f) => f.split('/').pop())
    .filter((f) => !indexedFiles.has(f));

  if (missing.length > 0) {
    // No bloquea el flujo actual: se reporta en el resumen final y se
    // sugiere `/reindex-docs`, no se regenera el índice a mitad de una
    // revisión de issue.
    return { upToDate: false, missing };
  }

  return { upToDate: true, missing: [] };
}
```

## Limitaciones

- **Mantenimiento manual de tags**: a diferencia de un cache autogenerado, el
  índice puede quedar con tags imprecisos si `docs/` cambia mucho de contenido
  sin correr `/reindex-docs`. El costo de este desfase es bajo: en el peor caso,
  se elige un documento levemente subóptimo para leer, pero el contenido leído
  siempre es el actual (nunca hay contenido obsoleto servido desde cache, porque
  no hay cache de contenido).
- **No cubre documentación que solo existe en la wiki todavía**: algunas páginas
  históricas de la wiki (por ejemplo, temas de versionado, Nx workspace setup, o
  guías que ya no aplican tras remover Storybook) no tienen todavía su
  equivalente en `docs/`. Esta skill no las lee. Si se migran a `docs/` en el
  futuro, agregarlas al índice con `/reindex-docs`.
