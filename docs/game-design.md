# Kardume: game design

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

## v0.2: salas grandes e ações sociais (em andamento)

As medidas de cada sala vivem em `packages/shared/src/salas/navio.ts` e `salas/adega.ts`, compartilhadas pelo client (que desenha) e pelo servidor (que valida).

**Navio Naufragado (260 × 220).** O naufrágio fica no centro (casco adernado, rombos, cracas, canhões, velas rasgadas, porão com baú, cofre e o vaso "NÃO É O BAR"). As zonas ficam bem espaçadas, com recifes, pradarias de algas, destroços e trilhas iluminadas entre elas, e escarpas emoldurando o horizonte:

| Zona | Centro (x, z) |
| --- | --- |
| Praça do Cardume (chegada) | (0, 66) |
| Concha Acústica | (−62, 51) |
| Porta da adega | (68, 45) |
| Jardim de Corais | (−62, −40) |
| Arcos de Pedra | (64…94, −43…−57) |
| Mirante da proa | (59, 0) |
| Pérola gigante | (−30, −77) |
| Peixaria | (57, 82) |

**Correntes marinhas:** 7 "rios" visíveis (22 u/s) ligam as zonas: praça ↔ convés, praça ↔ adega, praça → concha, navio → jardim e navio → arcos. Basta nadar para dentro de uma.

**Adega / Bar do Cardume (48 × 36, teto 8).** Ela recupera a identidade da imagem de referência e ficou maior, mas aconchegante:
- Salão principal com o balcão e 4 pontos de dose.
- Três cabines em U, recanto dos dardos e palquinho com a Radiola das Marés.
- 48 lugares para sentar.
- Paredes cheias de decoração e poças de luz quente.

**Jogabilidade no Javas (o bar):**

| O quê | Como funciona |
| --- | --- |
| Dardos | Dois alvos ("Dardos do Capitão" e "Mira de Tubarão"). Na linha de arremesso, E abre a mira, que oscila; Espaço ou clique arremessa. São 3 dardos por rodada e a pontuação é a de um alvo real (setores, dobro, triplo, 25 e mosca). Todos veem os dardos voarem e cravarem, e o quadro ao lado mostra quem está jogando e os 5 recordes do dia. A bebida treme a mira. O servidor calcula os pontos e só deixa um jogador por alvo. |
| Radiola das Marés | 7 músicas originais geradas pelo próprio jogo (sem arquivos de áudio): Forró das Ostras, Bossa do Baiacu, Brega da Maré, Lo-fi do Lodo, Samba da Sardinha, Valsa do Polvo e Shanty do Pirata Sem Rumo. No palco, E abre a votação, e a mais votada toca em seguida. Todos no bar ouvem sincronizado; a pista e as luzes pulsam na batida. Volume e mudo ficam no HUD. |
| Água | Q num ponto do balcão: o Seu Garoupa traz um copo d'água e tira uma dose. |

**Controles:**
- **Câmera:** clique no aquário e ela segue o mouse (Esc solta). Com o mouse solto, ela volta sozinha para trás do peixe.
- **Movimento:** nadando, olhar para cima ou para baixo + W sobe ou desce. Shift dá turbo (com rastro de bolhas); Espaço e C sobem e descem.

**Visual:**
- **Efeitos:** oclusão de ambiente, brilho suave nas lâmpadas e vinheta.
- **Cáusticas:** luz dançando na areia do navio.
- **Gráficos:** opção "bonito / leve".

**Ações sociais** (todos veem, e quem chega na sala recebe o estado atual):

| Ação | Como | O que os outros veem |
| --- | --- | --- |
| Emotes | teclas 1–5 ou barra no HUD | 👋 👏 ❤️ 😂 🍺 sobre o peixe, com um pulinho |
| Sentar | E perto de um banco livre | Peixe sentado de pernas para a frente. Lugar ocupado é recusado |
| Dançar | G (troca o passo) | Balanço, giro ou pulinho, sincronizados pelo horário de início |
| Brinde coletivo | emote 🍺 com amigos perto | Quem brindou em até 2,5 s e a até 7 unidades ganha "SAÚDE! 🍻" |
| Dose servida | E num ponto do balcão | O barman vai até o ponto e uma caneca desliza até você |

**Desempenho**
- Decoração parada é fundida por material (`Estatico`).
- Cada peixe tem 4 malhas.
- As algas são instanciadas.
- A sombra acompanha o jogador.
- Os nomes somem de longe.
- As posições vão arredondadas na rede.

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
