# IoT-WaterMonitor

Como rodar o Backend em Go: Instale air e rode o comando na raiz (ou simplesmente `go run main.go`):
Versão: Go 1.24

```bash
  air
```

rodar o banco com docker-compose:

```bash
  docker compose up -d
```

exportar db url

```bash
  export DATABASE_URL=postgres://user:password@localhost:5444/postgres
```

instalar dependencias:

```bash
  go mod tidy
```

Como rodar o Frontend React:
Instale as dependencias
```bash
  pnpm install
```

Rode o app
```bash
  pnpm dev
```
