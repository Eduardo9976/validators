# 📐 Arquitetura Interna

```
validators/
└── src/
    ├── index.js              ← Ponto de entrada público
    ├── core/
    │   ├── validator.js      ← Orquestrador principal: validate()
    │   ├── registry.js       ← Registro de rules e adapters
    │   └── schema-builder.js ← Parser/normalizer de definições + cache
    ├── adapters/
    │   ├── default.js        ← Adapter nativo (zero dependências)
    │   └── zod.js            ← Adapter Zod v4 (opcional)
    ├── rules/
    │   ├── common.js         ← required, type, oneOf, custom
    │   ├── string.js         ← minLength, maxLength, email, url, pattern, notEmpty
    │   ├── number.js         ← min, max, integer, positive, negative
    │   ├── array.js          ← minItems, maxItems, noEmpty, unique
    │   └── object.js         ← requiredKeys
    ├── error/
    │   ├── normalizer.js     ← Normaliza erros para { field, code, params, message }
    │   └── format.js         ← Produz o objeto final { valid, errors }
    └── i18n/
        ├── index.js          ← setLocale, getLocale, translate
        ├── register.js       ← Map de locales, registerLocale
        └── locales/
            ├── en.js         ← Inglês
            └── pt-BR.js      ← Português Brasileiro
```

## Fluxo completo de validação

```
validate(definition, value, options)
        │
        ▼
  buildSchema(definition)
  ┌─────────────────────────────────┐
  │ Valida shape da definição       │
  │ Normaliza defaults              │
  │ Retorna do cache se possível    │
  └─────────────────────────────────┘
        │
        ▼
  adapter.validate(schema, value, opts)
  ┌─────────────────────────────────────────────────────┐
  │  Default adapter:                                   │
  │    1. Checa null/undefined vs nullable/optional     │
  │    2. Verifica o tipo (type rule)                   │
  │    3. Executa cada rule da lista schema.rules[]     │
  │    4. Recursão em shape (objetos) e items (arrays)  │
  │                                                     │
  │  Zod adapter:                                       │
  │    1. buildZodSchema(schema) → Zod schema           │
  │    2. zodSchema.safeParse(value)                    │
  │    3. Mapeia issues Zod → { field, code, params }   │
  └─────────────────────────────────────────────────────┘
        │
        ▼ rawErrors[]
  normalizeErrors(rawErrors, locale)
  ┌─────────────────────────────────┐
  │ Para cada erro:                 │
  │   translate(code, params)       │
  │   → { field, code, params,      │
  │         message }               │
  └─────────────────────────────────┘
        │
        ▼
  formatResult(normalizedErrors)
  → { valid: boolean, errors: [] }
```

## Princípios de design

| Princípio | Como é aplicado |
|---|---|
| **Zero acoplamento ao framework** | Nenhum import de Vue, React, Express |
| **Zero acoplamento ao Zod** | Zod só é importado dentro de `adapters/zod.js` |
| **Nunca lança exceções** | `validate()` envolve tudo em try/catch |
| **Dados como schema** | Definições são objetos JS simples (JSON-serializáveis) |
| **Extensível** | `registerRule`, `registerAdapter`, `registerLocale` |
| **Cacheável** | Schemas são cacheados por fingerprint JSON |
| **Testável** | `_reset()` restaura todo o estado global |
