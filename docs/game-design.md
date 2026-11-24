# Cardume: game design

> Documento vivo. Consolida o [resumo do projeto](resumo-do-projeto.md), a apresentação "Aquariun" e as decisões tomadas na v0.1.

## A ideia em uma frase

Um jogo social de navegador em que **você é um peixe que você mesmo desenhou** e vive numa sociedade parecida com a humana, com bares, conversas, escolhas e consequências.

Referências: Habbo e Club Penguin (salas sociais, chat em bolhas), The Sims (vida cotidiana), GTA RP (sociedade e profissões).

## Decisões já tomadas

| Assunto | Decisão |
| --- | --- |
| Plataforma | Navegador, online, multiplayer |
| Público | 18+ (drogas, bebidas e sexo dentro do universo) |
| Visual | 3D simples low-poly com flat shading, no estilo do 3D do começo dos anos 2010 (ver [estilo-visual.md](estilo-visual.md)) |
| Interface | Estilo colagem/caderno de recortes (papel, fita, máquina de escrever) |
| Personagem | Cada um desenha o próprio peixe; também há peixes prontos |
| Mapa | Salas conectadas por portas (começando por navio e adega) |
| Stack | React + three.js (react-three-fiber), Node (Fastify + Socket.IO), SQLite |
| Servidor | Um processo Node; candidato a hospedagem: o Mac mini do Vitor |

## v0.1: o que entrou

1. **Login e contas reais**: cadastro com confirmação de 18+, sessão em cookie e modo visitante (só espia, sem chat).
2. **Desenhe seu peixe**:
   - Canvas 2:1 com pincel, balde, borracha e desfazer.
   - O contorno do desenho é simplificado em 40 a 60 pontos e extrudado com bevel, o que deixa o peixe "inflado". Peixes deformados e engraçados são bem-vindos.
3. **Navio naufragado (hub)**:
   - Areia, pedras, algas, corais e um cardume decorativo.
   - Convés acessível, com o sino que todos ouvem.
   - Buraco no casco que leva ao porão, onde ficam o cofre trancado e o vaso sanitário com a placa "NÃO É O BAR".
   - Garrafa com uma mensagem do dia.
   - Porta da adega.
4. **Adega / Bar do Cardume**: recriação da imagem de referência, com Seu Garoupa, o barman.
5. **Chat em bolhas**:
   - Até 120 caracteres, com histórico das últimas 30 mensagens por sala.
   - Filtro de palavras aplicado **antes** dos erros de digitação, para a bebida não servir de disfarce.
6. **Nadar / em pé**:
   - Nadando: o peixe circula livre em 3D.
   - Em pé: aparecem perninhas de tênis e o peixe anda no chão, no convés e em cima das mesas.
   - Na adega só se entra em pé.
7. **Bebida**:
   - No balcão, cada dose sobe 1 nível, até o máximo de 5. Cada nível dura 2 minutos.
   - O servidor embaralha o texto: troca letras, aperta a tecla vizinha, arrasta e engole letras. A partir do nível 3 a pontuação dobra, e no nível 4 aparece `*hic*`.
   - A partir de 2 doses vem o soluço e a câmera balança. A partir de 3, o nado fica torto.
   - No nível 5, o barman se recusa a servir mais.

## Perguntas em aberto (do grupo)

- Combate: PvP, só em arenas ou nenhum?
- Morte: existe? Tem perda de progresso?
- Moeda: o nome e o funcionamento.
- Monetização: cosméticos, passe ou assinatura?
- Regras de trocas e apostas.

## Ideias para as próximas versões

Triadas a partir da conversa do grupo e de uma rodada de ideias com o Codex. Nada disso é compromisso.

### Roteiro sugerido para a v0.2

1. **Persistência e inventário**: salvar a última sala e posição, e começar a guardar itens.
2. **Moeda e "Peix"**:
   - Sugestão: **Concha** como moeda base e **Pérola** como premium.
   - "Peix" é o nome da transferência ("manda um Peix").
   - Para começar a ganhar moeda: bônus diário e bebida paga.
3. **Tartaruga sábia (tutorial)**: ensina a nadar, ficar em pé, falar e usar o Peix.
4. **Aquário pessoal**: começa com chão de areia, e a moeda compra de 3 a 5 itens de decoração.
5. **Visitas e amizade**: lista de amigos e convite para o aquário.
6. **Pets**: um bichinho que segue o dono (caranguejo, camarão, peixinho) e consome moeda.
7. **Moderação**: denúncia de peixe e de mensagem, fila de revisão e comando de silenciar.

### Segredos baratos para o navio

- Cofre: hoje só balança. Na v0.2 pode guardar um código ou pérolas.
- Leme giratório no convés, que faz a câmera dar uma volta.
- Canhão que "cospe" o peixe com uma bolha de ar.
- Quadro torto na cabine do capitão, que o jogador endireita e que volta a entortar.
- Peixinhos decorativos que fogem quando alguém passa nadando.

### Mais efeitos de bebida e bar

- Brinde: dois peixes clicam um no outro e sai confete de bolhas.
- Caneca deslizando pelo balcão até o cliente.
- Cantoria (♪) a partir de 2 doses.
- "Bebida do dia", que dá um título cosmético.
- Ressaca cosmética: 1 minuto de bolhas cinzas depois que o efeito passa.

### Trocadilhos e placas (identidade do jogo)

Sistema Único de Sardinha, Unidade Básica de Salmão, Conselho Tutelar das Ovas, Corais de Ouro (ranking), Ostra Prime (assinatura), "Fiado só com Anzol Reconhecido", "Cuidado: Piso Escorregadio de Algas", Whatsalga (app do celular de concha).

> Evitar nomes e marcas reais (bancos, órgãos públicos, marcas de bebida) nas placas.

### Outras ideias do grupo

Casas em formato de fruta, cavalos-marinhos como transporte, baleia-ônibus, celular de concha, objetos humanos reaproveitados, pescadores vilões, eleições, comunidade hippie, religiões inventadas, farmácia e saúde, cadeia em aquário, região ilícita, restaurante de sushi da máfia, Halloween na Fossa das Marianas, itens raros de evento, pôquer e apostas temáticas.

## Riscos e cuidados

- **Skins desenhadas ofensivas**: o jogo é 18+, mas isso ainda pode ser um problema.
  - Próximo passo: botão de denúncia em cada peixe, e o admin poder restaurar a skin padrão.
- **Abuso no chat**:
  - Já existe: filtro de palavras (lista ampliável em `data/bloqueadas.txt`) e limite de 5 mensagens a cada 5 segundos.
  - Próximo passo: silenciar e denunciar.
- **Verificação de idade**: o checkbox é o mínimo. Antes de abrir para o público, precisamos de termos de uso, data de nascimento e o mínimo de dados pessoais (LGPD).
