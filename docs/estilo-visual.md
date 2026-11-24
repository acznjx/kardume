# Estilo visual

Duas camadas com linguagens diferentes, que conversam pelas cores:

1. **Mundo 3D**: low-poly "clássico", parecido com jogos 3D casuais do começo dos anos 2010.
2. **Interface (login, HUD, editor)**: colagem e caderno de recortes, com papel, fita adesiva, alfinetes, letras de bilhete de sequestro e máquina de escrever.

Referências em [`referencias/`](referencias/):
- `estilo-bar-do-cardume.png`: o alvo do 3D.
- `login-referencia.jpeg`: o alvo da interface. A tela de login é uma réplica dela.

## Mundo 3D

**Regras**

- **Poucos polígonos, de propósito.** Cilindros de 6 a 9 lados, esferas `Icosahedron` de detalhe 0 ou 1, caixas e cones de 4 a 5 lados.
- **Flat shading sempre.** Use `mat(cor)` de [`apps/client/src/game/style/materials.ts`](../apps/client/src/game/style/materials.ts): `MeshLambertMaterial` com `flatShading`, fosco e compartilhado por cor.
- **Cores sólidas e saturadas.** Sem texturas fotográficas. Padrões (listras, manchas, barriga clara) são pintados por face com `pintarFaces`.
- **Imperfeição controlada.** `amassar(geo)` desloca os vértices de leve para tirar a cara de primitiva perfeita (pedras, chão).
- **Luz.** Hemisférica (céu azulado e chão quente) mais uma direcional com sombras PCF suaves. Ambientes internos ganham point lights quentes nas luminárias.
- **Água.** Fundo e neblina azul-petróleo, bolhas subindo e raios de luz aditivos bem sutis.
- **Personagens.** Olhos grandes (esfera branca, pupila preta e brilho), boquinha sorrindo e acessórios simples (óculos, boné, chapéu de palha, flor, chapéu de cozinheiro).
- **Sem pós-processamento pesado.** Tem que rodar num notebook comum.

**Paleta principal**

| Uso | Cor |
| --- | --- |
| Parede da adega | `#2e8a87` |
| Madeira (escura, média, clara) | `#5e3b22`, `#8a5a34`, `#a8723f` |
| Areia | `#d6b986` / `#cdb68e` |
| Água (fundo) | `#2f7f86` |
| Luz quente | `#ffd27a` |
| Peixe-palhaço | `#f07a22` + `#f6f1e6` |

**Peixes desenhados**

O desenho (512×256) vira malha 3D assim:
1. Máscara do alfa.
2. Maior mancha conectada.
3. Borda (Moore tracing).
4. Douglas-Peucker até no máximo 56 pontos.
5. `ExtrudeGeometry` com bevel.

O interior de desenhos feitos só de contorno é pintado com cor de papel, e as bordas "escorrem" para colorir as laterais. Por isso **o jogador desenha o peixe olhando para a direita**.

## Interface colagem

- **Fontes (Google Fonts):**
  - Courier Prime e Special Elite: máquina de escrever.
  - Caveat: manuscrita.
  - Abril Fatface, DM Serif Display, Alfa Slab One e Archivo Black: títulos e letras recortadas.
- **Papel:** creme `#ece6d7`, kraft `#d5b588`, azul-claro `#9fcfcd`, com textura de pontinhos.
- **Sombras:** "carimbadas", com deslocamento sólido (`3px 3px 0 #222`), e não desfocadas.
- **Botão principal:** coral `#e26a4f`, borda preta e sombra sólida.
- **Rotação:** elementos levemente girados (de -3° a +3°), como se colados à mão.
