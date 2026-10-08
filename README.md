# Velocity Rift — rumo à versão 2.0

Um prototipo web 2D inspirado em jogos de plataforma de alta velocidade. Ele usa
HTML, CSS e Canvas, sem assets oficiais. O Vite é uma dependência de desenvolvimento.

## Requisitos

- Node.js 20.19+ ou 22.12+ e npm (compatíveis com Vite 7).

## Desenvolvimento local

Na pasta do projeto, execute:

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite no terminal (normalmente http://localhost:5173).
O servidor permanece rodando até você pressionar Ctrl+C.

Para gerar e testar a versão de produção:

```bash
npm run build
npm run preview
```

O build é gerado em `dist/`. O projeto continua usando HTML, CSS e Canvas
com JavaScript, sem precisar migrar a engine.

## Repositório

https://github.com/jhonyoreis/velocity-rift

## Fase 1 — Primeiro Impulso (estendida)

- Uma única rota, com 22.700 unidades de cenário (antes 4.850) e seis trechos: introdução, ritmo e saltos, slide, boost, domínio das mecânicas e final.
- Velocidade normal limitada a 480 e boost limitado a 590 (nerf de 25%); aceleração adicional do boost reduzida de 1.750 para 850. Ao deslizar numa descida, o impulso da ladeira pode chegar a 870 (limite controlado).
- Energia começa vazia e **somente orbes de boost** recarregam o medidor (+55 por coleta). Não há regeneração passiva; cristais e inimigos não recarregam boost.
- Dois portões que precisam de boost ativo (velocidade superior a 510), três túneis baixos para slide, saltos, molas, inimigos, cristais e obstáculos.
- Cinco checkpoints, orientação visual com placas e HUD com progresso por trecho.
- Floresta Neon com novas cores, vegetação e parallax no cenário.
- Câmera dinâmica: mostra mais terreno à frente quanto mais rápido o personagem corre, inclusive ao virar para a esquerda.
- Slide nas descidas: velocidade cresce exponencialmente enquanto desliza morro abaixo; ao sair da ladeira, o impulso extra diminui progressivamente sem frear de uma vez. A velocidade adicional das ladeiras não autoriza aceleração ilimitada ao usar boost.

## Funcionalidades da versão 2.0 (primeira entrega)

- Simulação física em passos fixos de 120 Hz.
- Pulo com coyote time, jump buffer e altura variável.
- Cinco checkpoints com reaparecimento após quedas.
- Pausa (P), recorde local no navegador e nota S/A/B/C ao terminar.
- Câmera suavizada e controles de toque em telas sensíveis ao toque.
- Slide com menor atrito no solo, efeito de derrapagem, botão de toque e túneis de passagem baixa.
- Cenário Floresta Neon com montanhas e camadas adicionais de parallax.

## Animações expressivas e polimento visual do Flux

- Corrida com balanço dos braços sincronizado com as passadas, inclinação conforme a velocidade e gestos ao mudar de direção.
- Pulo e queda com posturas distintas e leve alongamento/compressão visual na decolagem e aterrissagem; a hitbox nunca muda.
- Aterrissagens produzem ondas luminosas ao redor dos pés; impactos mais fortes aumentam a intensidade do efeito.
- Boost emite ondas de energia e **imagens residuais** que seguem o personagem em altas velocidades.
- Slide preserva a silhueta baixa corrigida para rampas e ganha pequenas faíscas e partículas de atrito.
- Efeitos de impacto após sofrer dano, poeira discreta durante corridas e piscar ocasional do visor.
- Sistema cosmético com limites de até **10 imagens residuais, 16 ondas e 180 partículas**, limpo ao reiniciar a fase ou reaparecer após uma queda.
- Todas as animações usam Canvas, sem novos arquivos de imagem, bibliotecas ou alteração das mecânicas. Verificação automatizada comparou as duas fases quadro a quadro com a versão anterior, sem diferenças na física.

## Identidade visual e áudio do Flux

- Personagem desenhado diretamente no Canvas: capacete branco com visor turquesa, cachecol âmbar, núcleo luminoso e botas douradas.
- Poses procedurais para parado, corrida, salto/queda, slide e impulso com boost, acompanhando o estado real da física.
- Partículas de movimento e eventos: pulo, aterrissagem, boost, deslize, cristais, orbes de energia, inimigos, molas, checkpoints, portões e chegada.
- Efeitos sonoros gerados localmente pela Web Audio API, sem baixar arquivos de áudio. O navegador só ativa o som após uma interação.
- Controle **Som ligado / Som desligado** abaixo do jogo ou tecla **M**. A preferência fica salva no navegador quando o armazenamento está disponível.
- Se o navegador não suportar áudio, a jogabilidade continua funcionando normalmente.

## Trilha sonora autoral por fase

- **Fase 1 — Neon Canopy (108 BPM):** tema eletrônico melódico e leve; sua composição, andamento e arranjo permanecem independentes.
- **Fase 2 — Ecos do Prisma (126 BPM):** composição nova e própria do Cânion Prisma, com modo frígio, padrão de bateria sincopado, baixo grave filtrado, sinos sintéticos cristalinos e pads atmosféricos.
- **Boss da fase 2 — Ruptura do Prisma (142 BPM):** terceira composição original, iniciada automaticamente dentro da arena do Guardião.
- O tema do Cânion Prisma tem melodia de 64 passos, progressão harmônica de quatro compassos e camadas que se intensificam conforme avançam os nove setores. Os últimos setores acrescentam arpejos e vozes mais agudas.
- Ambas as trilhas são geradas localmente com Web Audio, sem importar músicas ou amostras externas; cada fase seleciona automaticamente sua própria trilha.
- A faixa atual aparece abaixo da identidade do Flux. A tecla **N** liga/desliga a música, **M** silencia o áudio geral, e a pausa/menu interrompem a reprodução.
- Valores de frequência/duração são validados e erros do sintetizador são isolados do loop do jogo para não travar a física.

## Portal da Fenda — conclusão da fase 2

- A porta branca **GO** permanece na fase 1, mas foi completamente removida do Cânion Prisma.
- Na segunda fase, não existe saída visível antes de derrotar o Guardião; o local final permanece desativado e não encerra a tentativa.
- Depois do colapso cinematográfico do chefe, um **portal dimensional** se materializa ao lado da arena. A abertura leva aproximadamente **1,45 segundo**, com anéis violeta e turquesa girando em direções opostas, centro de energia, cristais orbitais, partículas e pulso luminoso.
- **Som próprio de materialização** e som de travessia, gerados pelo Web Audio existente sem depender de arquivos externos.
- O HUD passa de **“PORTAL DA FENDA SE MATERIALIZANDO...”** para **“PORTAL DA FENDA ABERTO · ENTRE NA FENDA”**.
- Somente entrar no portal **totalmente aberto** conclui a fase 2. A nota, os recordes, o DEBUG e o salvamento de progresso permanecem como antes.
- Reiniciar a fase ou ser derrotado durante a luta restaura o portal ao estado invisível; depois de vencer o chefe, o portal continua aberto caso o Flux sofra uma queda antes de atravessá-lo.

## Polimento cinematográfico do Guardião — atualização visual

- **Entrada cinematográfica:** ao entrar na arena, o Guardião surge do alto com um pulso violeta, avisos no HUD e uma faixa breve de apresentação (1,85 s). O laser não causa dano durante a apresentação e os controles permanecem disponíveis.
- **Retentativas mais rápidas:** se o Flux for derrotado dentro da arena, a nova entrada dura apenas 0,85 s, sem obrigar a rever toda a apresentação.
- **Danos por fase:** primeiro impacto turquesa com uma rachadura; segundo impacto âmbar com novas fraturas e maior tremor; terceiro impacto dourado desencadeia a destruição.
- **Sequência de derrota:** o corpo do Guardião se desestabiliza, solta fragmentos e ondas de energia, enquanto uma mensagem de reativação do portal é exibida por 2,75 s.
- **Portal só abre após a sequência:** a terceira pancada não encerra o confronto instantaneamente; o laser para, a arena permanece fechada durante a animação e só então as barreiras são removidas.
- **Efeitos limitados:** até 90 fragmentos e 12 ondas luminosas, com brilho contido e limpeza ao reiniciar ou reaparecer; não interferem na física.
- Sons adicionais na entrada, no segundo impacto e na destruição, preservando a trilha `Ruptura do Prisma` durante o confronto. As outras duas trilhas e o DEBUG continuam operando como antes.

## Guardião do Prisma — arena reformulada

- **Arena isolada e reta**, com chão contínuo e três plataformas elevadas. Objetos comuns (espinhos, placas, cristais, inimigos, túneis e plataformas móveis) foram retirados da sala.
- **Câmera fixa** durante o confronto, ocupando toda a arena. Barreiras laterais impedem a fuga; a passagem à chegada só libera depois da vitória.
- **Laser direcional**: o Guardião acompanha o Flux durante a preparação, **trava a mira** com antecedência e dispara na última direção marcada. O feixe fica limitado à própria arena.
- **Três posições de núcleo** em sequência: frente, topo e costas. Os ataques exigem rotas diferentes e uso das plataformas para alcançar o núcleo pelo lado certo.
- O núcleo recebe dano durante a janela de vulnerabilidade com **boost ativo acima de 510 de velocidade** ou **golpe descendente**. Três acertos encerram o confronto.
- **Três orbes de boost do chefe**, no chão e nas plataformas, com reposição automática após aproximadamente 4,2 segundos quando coletados. Eles não mudam a economia de boost do restante das fases.
- Ao perder sem cristais ou cair durante o confronto, o Flux retorna ao início da arena, com chefe e recargas reiniciados.
- Trilha musical própria **Ruptura do Prisma (142 BPM)**, com bateria pesada, baixo sincopado e sintetizadores tensos. As camadas se intensificam conforme a vida do chefe diminui; a trilha normal retorna após derrotá-lo.
- **Sentinelas do Cânion Prisma** agora miram no Flux e lançam projéteis de plasma com intervalo e aviso visual. Eles podem ser desviados ou destruídos com boost em alta velocidade. Não aparecem dentro da arena do chefe.
- Controles do DEBUG continuam: **F3** ativa o modo, **B** teleporta até a arena, voo/invencibilidade/boost ilimitado e tentativas sem recordes.

## Modo DEBUG temporário

- Botão acessível **DEBUG: OFF / ON** ao lado do contador de cristais no Canvas, ou atalho **F3**.
- Quando ligado: **boost infinito**, **invencibilidade** e **voo**. Segure `W`, `Espaço` ou `↑` para subir, `S` ou `↓` para descer; `A`/`D` ou setas laterais movem na horizontal. Soltar os comandos de voo mantém a altitude.
- Pressione **B** durante a fase 2 com DEBUG ativo para teleportar diretamente para a arena do Guardião (com checkpoint preparado).
- DEBUG permite selecionar a fase 2 sem desbloqueá-la, apenas para testar. Desligar DEBUG volta à física normal.
- A opção **não é persistida** e qualquer tentativa em que DEBUG foi ativado é considerada **não ranqueada**: não salva recordes, classificações ou desbloqueios, mesmo se for desligada antes da chegada.

## Fase 2 — Cânion Prisma

- **Fase 2 reformulada: 34.000 unidades de extensão (antes 17.600), nove setores**, com desafios progressivos de precisão, ritmo e domínio das mecânicas.
- Disponível na seleção de fases após concluir **Primeiro Impulso**; a fase 3 continua planejada e indisponível.
- **14 abismos reais** (antes sete): quedas causam respawn no início ou no último checkpoint. Saltos e trechos de pouso foram revistos para garantir continuidade.
- **16 plataformas elevadas e sete plataformas móveis** (antes oito e três), com rotas opcionais de risco/recompensa e movimentos estáveis desde o primeiro frame.
- Encontros mais exigentes com **drones aéreos**, **sentinelas blindadas** e robôs terrestres, incluindo um setor de gauntlet e inimigos em sequências de aproximação/pouso.
- **Nove checkpoints, três portões de boost, cinco túneis baixos**, eletropulsos, novas áreas de espinhos, molas, orbes de energia, cristais e três núcleos opcionais.
- HUD específico com contador de quedas, progresso da fase e núcleos; a pontuação, o melhor tempo e as conclusões ficam salvos separadamente da fase 1.
- **Slide corrigido:** pose compacta alinhada ao ângulo do chão; brilho também fica acima da superfície. Colisão de pista e plataformas ajustada para evitar encaixes indevidos.
- As regras de movimento, o boost equilibrado e a aceleração do slide continuam iguais à fase 1.
- A fase 1 permanece com 22.700 unidades e funciona como introdução; a fase 2 foi projetada como o primeiro grande desafio.

## Circuito Eletro-Neon e trilha original

- Cinco barreiras temporizadas: eletropulso vermelho (perigo), aviso âmbar e janela verde livre.
- Três núcleos de memória opcionais em trajetórias que estimulam pulos de precisão.
- HUD de núcleos e recorde de núcleos recuperados na tela de resultados.
- Trilha original **Neon Canopy** em 108 BPM exclusiva da fase 1; a fase 2 utiliza a nova composição **Ecos do Prisma** em 126 BPM.
- Música sem arquivos externos: só toca durante o jogo, respeita pausa, menu, som geral e o novo controle de música.
- Tecla **N** ativa/desativa apenas a trilha. Preferência salva localmente.

## Menu e progressão

- Menu principal com início rápido, melhor tempo, melhor classificação e status da primeira fase.
- Tela de seleção: **Primeiro Impulso** jogável, **Cânion Prisma** desbloqueada após concluir a fase 1, e fase 3 ainda planejada.
- Tela de conclusão com nota S/A/B/C, tempo da tentativa, melhor tempo, cristais coletados, núcleos e quantidade de conclusões por fase.
- Progresso separado por fase e salvo no navegador (`velocity-rift-progress-v1`), incluindo melhor nota, recorde, cristais, núcleos e conclusões. Recordes antigos da fase 1 são preservados.
- Menu principal acessível após a fase ou pelo botão **Menu principal**; botão de pausa e tecla **P** durante o jogo.
- Concluir a fase 1 desbloqueia a fase 2. A fase 3 permanece indisponível até ser desenvolvida.

## Controles

- A/D ou setas: mover
- Space, W ou seta para cima: pular
- Shift ou J: boost (consome energia; recarrega somente com orbes)
- S ou seta para baixo: deslizar em túneis e acelerar ao descer morros
- R: reiniciar
- P: pausar/continuar
- M: ligar/desligar efeitos sonoros
- Esc: retornar ao menu principal durante a partida
- Em dispositivos de toque: botões de direção, pulo, boost e slide

## O que ja existe

- Movimento com aceleracao, inercia e velocidade alta.
- Boost com barra de energia.
- Orbes de energia que recarregam boost (cristais comuns pontuam apenas).
- Inimigos derrotaveis por pisao ou velocidade.
- Espinhos e dano.
- Portoes que exigem boost/velocidade.
- Primeira fase longa, com uma rota principal e seis seções.
- Camera seguindo o jogador.

## Plano da versão 2.0

Experimento com implementação diretamente na `main`.

1. Física consistente e controle de salto (coyote time, jump buffer e altura variável).
2. Checkpoints, pausa, recorde local e classificação da fase.
3. Controles de toque e interface adaptada a celulares.
4. Melhorias de câmera, colisões, efeitos e identidade visual original.

## Proximas melhorias

- Avaliar migração para TypeScript futuramente (Vite já configurado).
- Separar entidades em arquivos.
- Criar editor simples de fase.
- Refinar as animações procedurais e considerar sprites autorais futuramente.
- Melhorar fisica de rampas e loopings.
- Publicar no GitHub Pages.
