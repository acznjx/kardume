# 🐟 Kardume

*bons peixes, maus hábitos*

Um aquário social em 3D no navegador, para maiores de 18 anos. Cada jogador é um peixe (desenhado por ele mesmo) que nada, conversa, fica em pé e vai beber na adega com os amigos.

![Bar do Kardume, referência de estilo](docs/referencias/estilo-bar-do-cardume.png)

## O que tem na v0.1

- **Tela de login** no estilo colagem: carteirinha de sócio, cadastro com confirmação de 18+ e modo visitante, que só espia.
- **Contas reais**: usuário e senha com hash bcrypt, sessão em cookie httpOnly e "lembrar de mim" por 30 dias.
- **Desenhe seu peixe**: o desenho em 2D vira um peixe 3D "inflado". Também dá para escolher um dos 7 peixes prontos.
- **Duas salas multiplayer em tempo real**:
  - **Navio naufragado**: convés, porão com cofre, sino e garrafa com a mensagem do dia.
  - **Adega / Bar do Kardume**: balcão, Seu Garoupa (o barman), mesas, timão, escotilhas e alvo de dardos.
- **Chat em bolhas** sobre os peixes, com filtro de palavras.
- **Nadar / em pé**: com a tecla F aparecem perninhas de tênis. Na adega só se entra em pé.
- **Bebida tem consequência**: cada dose embaralha o que você digita. A partir de 3 doses dá soluço, o nado fica torto e a câmera balança. O efeito passa com o tempo.

## Rodando localmente

Requisitos: **Node 22.13+** (recomendado 24).

```bash
npm install
npm run dev
```

- Jogo: http://localhost:5173
- API/Socket: http://localhost:3000 (o Vite faz proxy de `/api` e `/socket.io`)

Para testar o multiplayer, abra uma janela anônima e crie outro peixe.

### Produção (um processo só)

```bash
npm run build   # compila o client em apps/client/dist
npm start       # servidor entrega API + socket + client em http://localhost:3000
```

Veja [docs/rodar-no-mac-mini.md](docs/rodar-no-mac-mini.md).

### Testes

```bash
npm test          # vitest: embaralhar texto, filtro, contorno do desenho, rotas de conta
npm run typecheck # tsc nos três pacotes
```

## Controles

| Tecla | Ação |
| --- | --- |
| W A S D / setas | nadar (relativo à câmera) |
| Espaço / Shift | subir / descer |
| F | ficar em pé ↔ nadar |
| E | interagir (porta, balcão, sino, garrafa) |
| Enter | falar no chat |
| Clique no chão | nadar até o ponto |
| Arrastar / roda | girar câmera / zoom |

## Estrutura

```
packages/shared   protocolo, constantes das salas, embaralharTexto, filtro de palavras
apps/server       Fastify + Socket.IO + SQLite (node:sqlite): contas, salas, chat, bebida
apps/client       React + three.js (react-three-fiber): login, editor, mundo 3D, HUD
docs/             game design, estilo visual, referências, como rodar no Mac mini
data/             banco SQLite (fora do git) e lista extra de palavras bloqueadas
```

## Documentos

- [docs/game-design.md](docs/game-design.md): o que é o jogo, o que entrou na v0.1 e ideias para as próximas versões.
- [docs/estilo-visual.md](docs/estilo-visual.md): regras do visual low-poly e da interface colagem.
- [docs/resumo-do-projeto.md](docs/resumo-do-projeto.md): resumo original das conversas do grupo.
