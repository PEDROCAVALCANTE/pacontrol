# Evolution API — Railway Deploy

## Variáveis de ambiente para configurar no Railway

| Variável | Valor |
|---|---|
| `SERVER_URL` | `https://SEU-APP.railway.app` |
| `AUTHENTICATION_TYPE` | `apikey` |
| `AUTHENTICATION_API_KEY` | uma senha secreta sua |
| `AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES` | `true` |
| `DEL_INSTANCE` | `false` |
| `LANGUAGE` | `pt-BR` |

## Após o deploy

1. Acesse `https://SEU-APP.railway.app/manager`
2. Crie uma instância com o nome `pacontrol`
3. Escaneie o QR Code com seu WhatsApp
4. Copie a API Key e cole nas variáveis da Vercel
