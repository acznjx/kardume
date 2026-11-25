# Pendências da página de entrada

O que ficou para depois na nova entrada (`apps/client/src/entrada/`).

- [ ] **Imagens das salas**: os cartões de "Lugares" usam gradientes provisórios. Trocar por capturas reais do Hall do Naufrágio, da Praça do Kardume e do Bar JAVAS (`apps/client/public/entrada/`).
- [ ] **Trailer**: botão "Ver trailer" ainda não existe; entra quando houver um vídeo curto (servido pelo próprio site, por causa do CSP).
- [ ] **Novidades**: seção com as últimas atualizações do jogo (pode ler de um JSON em `public/`).
- [ ] **Recuperar senha**: hoje o link mostra um aviso; depende de envio de e-mail no servidor.
- [ ] **Imagens dos peixes**: são renders dos modelos com roupa. Vale gerar versões maiores e em WebP para carregar mais rápido.

## Próximo passo: sala pessoal depois do login

Ideia (estilo perfil do Avakin Life): depois de entrar, o jogador cai primeiro na **própria sala**, onde não anda. A câmera mostra o peixe em destaque e dali ele:

- vê e edita o perfil (nome, "sócio desde", conta);
- troca de roupa e redesenha o peixe (o Camarim pode virar esta tela);
- clica em **Entrar no aquário** para ir para a sala compartilhada atual.

Pontos a decidir: se a sala pessoal tem decoração própria, se outros jogadores podem visitar e se ela substitui o Hall do Naufrágio como primeira tela.
