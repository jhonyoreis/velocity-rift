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
- O tema do Cânion Prisma tem melodia de 64 passos, progressão harmônica de quatro compassos e camadas que se intensificam conforme avançam os nove setores. Os últimos setores acrescentam arpejos e vozes mais agudas.
- Ambas as trilhas são geradas localmente com Web Audio, sem importar músicas ou amostras externas; cada fase seleciona automaticamente sua própria trilha.
- A faixa atual aparece abaixo da identidade do Flux. A tecla **N** liga/desliga a música, **M** silencia o áudio geral, e a pausa/menu interrompem a reprodução.
- Valores de frequência/duração são validados e erros do sintetizador são isolados do loop do jogo para não travar a física.

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
