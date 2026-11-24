# Rodar o Cardume no Mac mini

O servidor é um único processo Node que entrega a API, o Socket.IO e o client compilado. O banco é um arquivo SQLite em `data/cardume.db`.

## 1. Instalar

```bash
# Node 24 (via Homebrew ou nvm)
brew install node@24

git clone https://github.com/acznjx/oceanclub.git cardume
cd cardume
npm install
npm run build
```

## 2. Subir

```bash
PORT=3000 npm start
# 🐟 Cardume nadando em http://localhost:3000
```

Na rede de casa, os amigos acessam por `http://<ip-do-mac>:3000`.

Variáveis úteis:

| Variável | Padrão | Para quê |
| --- | --- | --- |
| `PORT` | 3000 | porta HTTP |
| `HOST` | 0.0.0.0 | interface de rede |
| `CARDUME_DB` | `data/cardume.db` | caminho do banco |
| `CARDUME_HTTPS` | — | `1` marca o cookie como `Secure` (use atrás de HTTPS) |
| `LOG_LEVEL` | warn | `info` mostra cada requisição |
| `CARDUME_TRUST_PROXY` | — | IP do proxy confiável (ex.: `127.0.0.1` com cloudflared), para o limite de tentativas usar o IP real |

## 3. Deixar rodando sempre (pm2)

```bash
npm install -g pm2
pm2 start npm --name cardume -- start
pm2 save
pm2 startup   # segue a instrução que ele imprimir
```

## 4. Abrir para a internet (quando for a hora)

Fora da v0.1. O caminho mais simples, sem abrir portas no roteador, é o **Cloudflare Tunnel**:

```bash
brew install cloudflared
cloudflared tunnel login
cloudflared tunnel create cardume
cloudflared tunnel route dns cardume cardume.seudominio.com
cloudflared tunnel run --url http://localhost:3000 cardume
```

Atrás do túnel (HTTPS), suba com `CARDUME_HTTPS=1 CARDUME_TRUST_PROXY=127.0.0.1`.

## Backup

O banco inteiro é o arquivo `data/cardume.db`, mais os arquivos `-wal` e `-shm` enquanto o servidor estiver rodando. Para um backup consistente:

```bash
sqlite3 data/cardume.db ".backup 'backup-$(date +%F).db'"
```

## Palavras bloqueadas

Crie `data/bloqueadas.txt`, com uma palavra por linha (linhas com `#` são comentários), e reinicie o servidor.
