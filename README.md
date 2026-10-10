# Velocity Rift — Cidade das Fendas (versão 3.7.11 em teste)

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

## Velocity Rift 3.7.2 — Arquiteto, cristais e tela de derrota

- Corrigido o retorno após a tela **VOCÊ MORREU**: quando existe um checkpoint ativado, o botão agora **volta ao último checkpoint** sem executar `resetGame()`. O tempo da tentativa permanece, a penalidade por queda continua zerando os cristais e os itens coletáveis após o checkpoint reaparecem para permitir continuar; sem checkpoint, o jogo reinicia a fase normalmente.
- O checkpoint pode ser ativado ao passar perto da bandeira mesmo sem estar exatamente apoiado no chão, desde que Flux esteja na altura certa.


- O **portal final** da Cidade das Fendas tem renderização própria após a derrota do Arquiteto, com brilho, símbolo central e legenda. Foi aproximado no final da arena para aparecer mais claramente quando a câmera revela a saída.
- O Arquiteto escala de **2 para 5 projéteis por rajada** à medida que perde vida, com velocidade crescente e janelas de vulnerabilidade menores. Com 2 HP surgem fendas temporárias no chão, e com 1 HP surgem duas. Há um aviso visível antes da fase perigosa.
- **Cristais**: ao sofrer dano comum, perde-se no mínimo 8 ou 35% do total atual (limitado pelo saldo). Se Flux sofrer dano sem cristais, a tentativa acaba. Se cair em um abismo, **perde 100% dos cristais** e a tentativa acaba, mesmo que ainda tivesse cristais.
- A nova tela **VOCÊ MORREU** oferece **Reiniciar fase** (recomeça o capítulo, sem repetir cutscene) e **Menu principal**. Recordes e progresso permanente continuam preservados.
- Os coletáveis de todas as três fases deixam de ser anéis e ganham desenho vetorial procedural de **cristal facetado vermelho/laranja**, inspirado na referência visual fornecida.
- **Validar** no navegador a dificuldade da luta, o portal, os controles e a interface mobile; os testes automatizados não substituem a experiência real.

## Velocity Rift 3.7.1 — manutenção e organização

- Extração de módulos para layouts das três fases, desafios, conquistas, geometria, classificação, progresso e cenários.
- As três rotas secretas da Cidade das Fendas receberam paletas próprias, eliminando uma falha de renderização.
- Inimigos comuns agora recebem o tipo padrão `walker`; a identificação de inimigos da cidade tolera registros antigos sem `type`, evitando congelamentos em colisões.
- O dash aéreo avança **sempre na horizontal**, exclusivamente para a direção em que Flux está olhando (esquerda ou direita) ao ativar. Cursor/mouse não controlam o dash; não há dash vertical ou diagonal. Velocidade, duração e recarga permanecem as mesmas.
- Ícone local do jogo para evitar a requisição automática sem recurso `/favicon.ico` em navegadores.
- A rotina de desenho da Floresta Neon passou a ser executada apenas na primeira fase.
- Testes automáticos e guia de regressão adicionados. Execute `npm install`, `npm test` e `npm run build`.
- Corrigido o skyline urbano que desaparecia ao avançar a câmera, ajustando o culling para o fator real de parallax.
- Inserido **Corredor das Fendas**, antes do Arquiteto: novo fundo dimensional, seis vãos com dash obrigatório, cinco plataformas verticais, três plataformas intermitentes, armadilhas e dois checkpoints. O chefe e a saída foram deslocados.
- A nota da fase 3 foi ajustada para a fase maior (S abaixo de 110s, A abaixo de 155s, B abaixo de 205s).
- A física, a campanha, os chefes e os controles foram preservados; a quarta fase continua indisponível.

## Velocity Rift 3.7 — Cidade das Fendas (terceira de quatro fases)

**O jogo está planejado em quatro fases:** Floresta Neon, Cânion Prisma, Cidade das Fendas e **Fenda Original**, a futura etapa final com o Soberano da Ruptura e o resgate de Alicia. A quarta região já aparece no mapa como prévia, sem acesso antecipado.

### A terceira fase — caminhos elevados ou ruas perigosas

- Cenário original de metrópole dimensional, com **19 prédios acessíveis pelos telhados**, linhas de energia, janelas iluminadas, passagens baixas e plataformas de manutenção que se movem.
- Sete setores ao longo de **23.560 unidades**. A via superior permite caminhos de maior precisão; o percurso inferior reúne mais inimigos e tiros.
- **21 patrulhas** formadas por drones de assalto, torres de disparo e caçadores. Drones e torres atiram **pares de projéteis** com intervalos curtos, e **o boost não anula esses tiros**.
- Três vãos dimensionais de **430, 480 e 490 unidades** na cidade, mais **seis vãos de 215 unidades** no corredor pré-boss, todos protegidos por barreiras que exigem dash ativo. O dash também causa dano por contato nos inimigos, mas **não fornece imunidade a espinhos nem projéteis**.
- **3 núcleos de memória** e **3 novas rotas secretas de escalada**: Antenas Perdidas, Subsolo Fantasma e Coroa dos Arranha-céus. Cada uma combina plataformas e inimigos diferentes, com limite de 30–32 segundos e somente uma tentativa até reiniciar a fase.

### Como testar os novos desafios

Acesse a Cidade das Fendas pelo mapa após concluir o Cânion Prisma, ou use DEBUG apenas para testes. O Núcleo de Ímpeto aparece no começo da cidade; pule normalmente, solte o botão e aperte **pulo novamente no ar** para impulsionar Flux **na horizontal, para o lado em que ele está olhando**. O comando também funciona com o botão de pulo na tela.

O dash recarrega quando Flux aterrissa. Três membranas dimensionais exigem um dash ativo para passar. Os drones disparam projéteis em pares; boost e dash não bloqueiam esses tiros. O chefe Arquiteto do Vazio precisa de quatro colisões com dash durante janelas em que o escudo está aberto. O chefe possui introdução e música próprias.

**Validação:** verificações simuladas do percurso integral, dos três vãos com/sem dash, das 27 ligações entre plataformas nos desafios secretos, das regras de dano e dos quatro acertos do chefe; comparação das fases 1 e 2 com diferença zero na física. O build real e testes de navegador ainda precisam ser executados em um ambiente com acesso ao repositório e às dependências.

### Corredor das Fendas — prova de domínio

Entre a metrópole e a arena do Arquiteto, o Corredor das Fendas propõe plataforma pura, sem inimigos: seis passagens de dash horizontal obrigatório, elevadores verticais, plataformas que desaparecem conforme um ciclo visual, espinhos e checkpoints no início e no fim. A paisagem da cidade se transforma gradualmente em pilares suspensos e fendas dimensionais. Os limites de nota da fase consideram o percurso maior.

### Núcleo de Ímpeto e dash aéreo

Flux recolhe o **Núcleo de Ímpeto** ainda no começo da cidade. A coleta desbloqueia permanentemente o dash na campanha, inclusive ao voltar às fases anteriores. O dash funciona ao **apertar o pulo pela segunda vez durante um salto** (Espaço, W, ↑ ou K). O impulso segue **somente a direção em que Flux está olhando**, para a esquerda ou para a direita. Não existe mira pelo mouse, dash vertical ou diagonal. Cada salto concede um dash, recarregado ao tocar uma plataforma.

O artefato é salvo em `velocity-rift-campaign-v3`, sem apagar os recordes antigos. O DEBUG permite testar o deslocamento e o chefe sem registrar a obtenção.

### Arquiteto do Vazio — novo chefe

O **Arquiteto do Vazio** surge em uma pequena entrada cinematográfica dentro da arena final da cidade e exige **quatro golpes de dash aéreo** em seu núcleo. O escudo fica vulnerável depois de cada **rajada de dois disparos**; o chefe passa por introdução, mira, duas salvas, abertura da defesa, recuperação e colapso. A vitória libera um portal para concluir a terceira fase.

O Arquiteto é diferente do **Soberano da Ruptura**: o Soberano continua reservado para o confronto definitivo da quarta fase.

### Trilha sonora e cutscenes

- **Cidade Entre Estrelas (136 BPM):** composição original sintetizada, com linhas de baixo sincopadas, arpejos cristalinos e acordes luminosos de sétima, tornando-se mais intensa nos últimos setores.
- **Coroa do Vazio (158 BPM):** trilha de chefe original, mais pesada e dissonante, com segunda camada rítmica quando o Arquiteto perde parte da vida.
- Antes de entrar no cenário, a introdução mostra Flux contemplando a metrópole e correndo por prédios. A curta chegada automática ao nível agora inclui pequenos saltos. As cutscenes podem ser revisitadas na galeria.

A nova fase tem **7 conquistas próprias**, incluindo habilidade, vitória, nota, núcleos, chefe e rotas secretas (20 no total). A porcentagem **já reserva um quarto do progresso para a fase final**, permitindo atingir até **75%** enquanto apenas as três primeiras fases estão disponíveis. As 12 metas de núcleos e 12 metas de rotas incluem as três futuras de cada tipo.


## Velocity Rift 3.5.2 — Chegada natural às fases

Após o prólogo e a introdução do capítulo, Flux não aparece mais parado de forma repentina na pista. Em vez disso, há uma curta **corrida automática dentro do cenário jogável**:

- Flux atravessa uma extensão provisória da pista vinda de um portal visual e corre sozinho durante aproximadamente **2 segundos**, enquanto a **câmera acompanha**. A animação usa o mesmo personagem e o mesmo desenho do cenário de cada fase.
- O trecho acontece após a introdução da **Floresta Neon** ou do **Cânion Prisma**, inclusive se a cena for pulada com Esc. Não é uma nova cutscene sobreposta nem uma tela de carregamento.
- O trajeto automático é visual e **termina exatamente no spawn original de cada fase**, com a velocidade zerada. Somente então começam a física, o cronômetro e as interações; não há coleta gratuita, dano, distância extra nem alteração nos recordes.
- **Enter ou Espaço** podem adiantar a chegada; **P/Esc** continuam abrindo ou fechando o menu de pausa normalmente. A sequência funciona sem apertar nenhum botão.
- A entrada toca apenas na **primeira apresentação de cada capítulo da campanha**. Reiniciar, revisitar ou disputar um recorde em uma fase já introduzida não obriga o jogador a esperar novamente.
- A mudança não cria novas chaves de save e preserva as fases, a galeria, os núcleos e os desafios secretos.

## Velocity Rift 3.5.1 — Flux nas cutscenes, montanhas e trilha cinematográfica

- O **Flux cinematográfico agora reutiliza exatamente o desenho do personagem jogável**, com o mesmo capacete branco, crista e visor cianos, corpo escuro, cachecol e pés laranjas. A posição e a escala são ajustadas para as cenas sem modificar a física nem o sprite de jogo; a corrida usa os mesmos movimentos de braços, pernas e cachecol.
- O prólogo ganhou a última cena **“Um novo mundo à frente”**. Logo depois de Flux atravessar o portal, a câmera mostra uma vista das montanhas e um desenho do personagem **de costas, contemplando o caminho que deverá percorrer**.
- As cenas ficaram aproximadamente **20% mais rápidas por quadro**: o prólogo original de 31,9 segundos foi reequilibrado para 29,3 segundos mesmo com o novo quadro de chegada; as introduções das fases também foram encurtadas.
- Uma **trilha sonora original sintetizada no Web Audio**, chamada **“A Flor e a Ruptura”**, acompanha as cutscenes em 88 BPM. O arranjo muda entre três climas: sereno na entrega da flor, sombrio na aparição do Soberano e esperançoso na chegada ao mundo novo. A entrada na fase retorna à música original da região.
- A trilha obedece aos controles já existentes de **música, volume geral e mute**, sem interferir no volume independente dos efeitos sonoros. Nenhum arquivo de áudio externo foi adicionado.
- A **Galeria de Cenas** mostra a mesma abertura revisada; avançar ou pular cenas segue funcionando e não altera o registro de conquistas, núcleos, fases ou rotas secretas.

## Velocity Rift 3.5 — A Flor e a Ruptura

A nova etapa introduz **cutscenes inteiramente desenhadas no Canvas**, usando ilustrações vetoriais originais e efeitos sonoros sintetizados (sem vídeos, downloads ou assets externos).

### Prólogo: A Flor e a Ruptura

Ao confirmar **Novo Jogo**, a campanha recomeça pela abertura cinematográfica:

1. **Antes das fendas:** Flux e Alicia contemplam o pôr do sol em um vale.
2. **Uma flor para Alicia:** Flux entrega uma flor, que ela recebe.
3. **O céu se rompe:** uma fenda violeta se abre sobre a paisagem.
4. **O Soberano da Ruptura:** o antagonista final aparece em uma silhueta monumental, com asas de armadura fragmentada, coroa flutuante quebrada e núcleo luminoso no peito.
5. **Alicia desaparece:** a energia dimensional a leva para outra dimensão; a flor permanece.
6. **A promessa do Flux:** ele parte em direção ao portal para resgatá-la.

O Soberano é apresentado como **antagonista final**; ainda não há combate contra ele nesta versão. Seu design completo e o confronto final ficam reservados para etapas posteriores.

### Introduções das fases

- **Primeiro Impulso:** Flux atravessa um portal para a Floresta Neon e começa a correr em alta velocidade.
- **Cânion Prisma:** uma panorâmica da região cristalina antecipa a presença do Guardião.
- As introduções aparecem na **primeira entrada em cada fase por campanha**, antes da física e do cronômetro começarem. Reiniciar uma fase já apresentada não repete a cena automaticamente.

### Controles e salvamento

- As cenas avançam automaticamente após alguns segundos; **Enter/Espaço**, seta para a direita ou **Avançar** passam para o próximo quadro, e **Esc** ou **Pular cena** avançam diretamente para a próxima etapa da jornada.
- **Menu** interrompe a reprodução sem marcar uma cena ainda não assistida.
- A nova **Galeria de cenas**, acessível pelo menu principal, permite rever o prólogo e as introduções já assistidos; cenas não vistas permanecem bloqueadas.
- Os identificadores de cenas vistas são salvos em `scenesSeen` na chave existente `velocity-rift-campaign-v3`. Novo Jogo limpa apenas as cenas vistas **da campanha**, preservando os recordes, medalhas, conquistas e segredos permanentes da 2.0.
- A galeria é apenas visual: rever cenas não reinicia fases, não concede recompensas e não modifica o histórico de recordes. Partidas DEBUG não registram novos desbloqueios narrativos.

**Compatibilidade:** saves da 2.0 e da 3.0 continuam legíveis; campanhas antigas com `scenesSeen` ausente começam com a galeria bloqueada e liberam as cenas à medida que forem vistas na nova versão. A porcentagem de conclusão permanece baseada apenas em fases, núcleos e rotas secretas, não nas cutscenes.

## Porcentagem de conclusão — fases, núcleos e segredos

O indicador do menu representa a **campanha planejada em quatro fases**, incluindo a Fenda Original ainda em desenvolvimento. Os pesos são:

- **Fases principais — 40%:** 10 pontos percentuais por fase concluída.
- **Núcleos de memória — 30%:** 2,5 pontos percentuais por núcleo, em um total planejado de 12.
- **Rotas secretas — 30%:** 2,5 pontos percentuais por desafio secreto, em um total planejado de 12.

Como a quarta fase ainda não pode ser jogada, é possível chegar a **no máximo 75% nesta versão**, concluindo as três fases disponíveis e todos os seus núcleos e segredos. O restante será liberado com a fase final. As coletas são contabilizadas apenas uma vez por campanha. O painel mostra **Fases 0–3/4, Núcleos 0–9/12 e Rotas 0–9/12**, preservando os registros do arquivo permanente.

**Compatibilidade:** campanhas das versões anteriores migram para este cálculo sem apagar saves. Quando não há identificadores individuais dos extras antigos, os melhores totais de núcleos e rotas nas fases concluídas servem como aproximação inicial. **Novo Jogo** reinicia o progresso da campanha, mas mantém recordes e conquistas históricas. O **DEBUG** não grava desbloqueios nem extras.

## Mapa das Fendas — Etapa 2 da expansão 3.0 (versão 3.3)

- A antiga seleção em cartões foi substituída por um **mapa dimensional interativo**, com três nós ligados por trilhas luminosas: Floresta Neon, Cânion Prisma e Cidade das Fendas.
- Selecione uma região clicando no nó, por teclado com **Tab/Enter** ou usando as setas enquanto um nó está selecionado. O painel lateral apresenta identidade da área, descrição e, nas fases disponíveis, **melhor tempo, melhor nota, núcleos e rotas secretas descobertas**.
- **Bloqueios reais da campanha:** a fase 1 está sempre disponível; a fase 2 libera somente após concluir a primeira fase na campanha atual (ou enquanto o DEBUG está ativo). Registros arquivados continuam visíveis mesmo após usar **Novo Jogo**, mas não desbloqueiam fases novamente.
- A terceira região, **Cidade das Fendas**, já aparece como prévia da próxima expansão. Pode ser selecionada para conhecer o cenário, porém **não inicia uma fase inexistente**; o botão está desativado, e o motor também rejeita fases ainda não implementadas.
- O rodapé do mapa mostra o resumo da campanha atual (até 2/2 fases) e da coleção permanente: até **6 núcleos, 6 rotas secretas e 13 conquistas**.
- **Nenhuma migração adicional:** mantém `velocity-rift-progress-v1`, `velocity-rift-campaign-v3` e as preferências de áudio anteriores. A navegação **Próxima fase** introduzida na 3.2 continua ativa.
- Layout pensado para o **widescreen 16:9**, com disposição vertical em telas menores e suporte à preferência do sistema por movimento reduzido.

## Velocity Rift 3.2 — próxima fase na tela de resultados

- A conclusão do **Primeiro Impulso** agora exibe um botão principal **“Próxima fase: Cânion Prisma”**, iniciando diretamente a segunda fase com um único clique.
- O botão preserva a gravação de resultado, recordes, núcleos e conquistas antes da transição, e inicia a próxima fase com seu estado normal reiniciado.
- Depois do **Cânion Prisma**, o botão aparece desativado, indicando que a **Cidade das Fendas** ainda está em desenvolvimento. As opções Jogar novamente, Ver fases, Conquistas e Menu principal continuam disponíveis.
- A conclusão da fase 1 com DEBUG não desbloqueia a fase 2 de forma permanente; a navegação direta só fica disponível se a campanha já estiver liberada ou se o modo DEBUG permanecer ativo.
- Os saves da 2.0 e da campanha 3.0, o sistema de áudio, as conquistas e as rotas opcionais não foram alterados.

## Velocity Rift 3.1 — menu widescreen e pausa integrada

- **Apresentação widescreen:** o jogo passou a ocupar uma área 16:9 centralizada e limitada pela altura da janela; a barra inferior e os cartões externos com instruções foram removidos. Os controles continuam disponíveis no menu de pausa. Os controles de toque permanecem na tela durante a partida em dispositivos compatíveis.
- **Botão interno “Ⅱ PAUSA”** dentro da área de jogo, abaixo do HUD, e atalhos **P / Esc** para pausar ou retomar. Ao pausar, tempo e física congelam, a música reduz o volume e um menu de sobreposição aparece sem descarregar a fase.
- **Menu de pausa** com **Continuar**, **Reiniciar fase**, **Menu principal**, mixador completo (geral, música e efeitos), botões de silenciar e uma referência rápida aos controles.
- **Sons sintetizados nos botões** (seleção, confirmação e retorno), respeitando o volume de efeitos, volume geral e o estado de mudo. Não há novos arquivos externos.
- A tela principal troca o texto de apresentação por **“ENCONTRE ALICIA ALÉM DAS FENDAS”**, com subtítulo sobre resgatar Alicia; recordes e notas saem do cartão inicial (continuam visíveis na seleção de fases/resultados).
- O progresso da campanha é exibido como **porcentagem e barra de avanço**: **0%**, **50%** ou **100%**, calculado pelas duas fases que já estão jogáveis. Quando a terceira fase for implementada, ela entrará no cálculo.
- A versão mantém os saves separados introduzidos na etapa 3.0: campanha, conquistas, recordes, rotas secretas e configurações de áudio são preservados. As instruções dos desafios secretos e a proteção contra DEBUG continuam válidas.
- Os menus foram compactados para reduzir barras de rolagem em janelas widescreen menores. Em telas pequenas, o menu de pausa pode se expandir para permitir acesso a todos os controles.

## Velocity Rift 3.0 — Etapa 1: menu, campanha e mixagem de áudio

- **Menu principal redesenhado**, com identidade cinematográfica turquesa/violeta e as opções **Continuar**, **Novo Jogo**, **Seleção de Fases**, **Configurações** e **Conquistas**.
- **Continuar** retoma a campanha pela entrada da última fase jogada/desbloqueada. Esta etapa ainda não restaura a posição exata do Flux nem um checkpoint ao fechar o navegador; o jogo reinicia a fase selecionada.
- **Novo Jogo** sempre abre uma tela de confirmação. Confirmar reinicia apenas a **progressão da campanha**: a fase 2 volta a ficar bloqueada até a conclusão da fase 1. Cancelar não altera o progresso.
- **Recordes, segredos, melhores tempos, núcleos e medalhas da 2.0 são preservados**: permanecem no registro histórico `velocity-rift-progress-v1`. A nova campanha utiliza a chave separada `velocity-rift-campaign-v3`.
- **Migração compatível:** na primeira execução da 3.0, se ainda não existir um registro próprio da campanha, o desbloqueio anterior da 2.0 é utilizado como ponto de partida. Após iniciar um Novo Jogo, o registro da campanha prevalece, evitando que o progresso arquivado desbloqueie novamente as fases automaticamente.
- **Mixador de áudio** com sliders independentes de 0 a 100% para **volume geral**, **música** e **efeitos sonoros**. A música é suavizada em tempo real; novos efeitos sonoros seguem a mistura atual.
- As preferências são salvas em `velocity-rift-audio-settings-v3`, sem apagar os antigos controles de ligar/desligar música (`velocity-rift-music`) e som (`velocity-rift-sound`). Os atalhos e botões de mutar continuam funcionando.
- A segunda fase, o Guardião do Prisma, o Portal da Fenda, os seis desafios e o modo DEBUG foram mantidos. O mapa interativo, as cutscenes e a Cidade das Fendas serão desenvolvidos nas próximas etapas da 3.0.

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

## Rotas secretas — seis provas diferentes, uma tentativa por fase

Cada rota mantém sua localização e recompensa, mas agora usa uma geometria própria, de **8 a 10 plataformas**, inimigos distintos e um perigo central diferente:

- **Copa Esmeralda (fase 1):** saltos entre copas com molas de impulso, plataforma móvel, mariposas luminosas, drones e minas.
- **Ninho Luminoso (fase 1):** ponte espectral com plataformas que desaparecem em ciclos, um orbitador, sentinela com disparos e mariposas.
- **Horizonte Neon (fase 1):** subida em vaivém com esteiras que aceleram em direções opostas, dardos velozes, minas e drones.
- **Eco Suspenso (fase 2):** travessia por plataformas oscilantes, drones patrulheiros, disparos de sentinela e obstáculos orbitais.
- **Arco Prismático (fase 2):** plataformas espectrais, feixe pulsante com aviso visual, um orbitador e uma sentinela.
- **Zênite Violeta (fase 2):** plataformas que desmoronam depois do pouso, um perseguidor lento, minas e disparadores rápidos.

As seis rotas usam o sistema existente de câmera vertical e desafios cronometrados; os limites variam de **30 a 35 segundos**. Todos os tipos de plataforma têm aparência própria (molas verdes, pontes lilás intermitentes, esteiras alaranjadas, pedras móveis amarelas e blocos frágeis rosados). A tela **Conquistas** apresenta a mecânica característica de cada rota.

**Tentativa única:** tocar em um inimigo, receber um projétil, cair para fora da torre ou deixar o tempo acabar encerra a tentativa, mostrando somente **“Desafio perdido”**. A rota só é liberada novamente ao **reiniciar a fase**, não ao reaparecer no checkpoint. Uma vitória concede **8 cristais e 20 de boost**, além de registrar fragmento e melhor tempo. Falhas não apagam conquistas antigas.

O DEBUG permite experimentar os percursos sem afetar recordes ou medalhas. As plataformas opcionais não substituem o caminho normal, e os dois percursos principais continuam concluíveis; a fase 2 preserva os 14 abismos. Os **49 saltos individuais** entre degraus secretos passaram em simulações com física normal e sem voo.

## Sistema de conquistas

- **13 conquistas permanentes** por terminar fases, alcançar notas S, finalizar sem quedas, coletar os três núcleos, derrotar o Guardião sem receber dano, descobrir rotas e recuperar todos os seis fragmentos.
- Uma nova tela **Conquistas** pode ser acessada pelo menu principal, seleção de fases e resultados. Ela apresenta medalhas desbloqueadas, objetivos pendentes, contadores por fase e recordes dos percursos secretos.
- Conquistas desbloqueadas geram um aviso visual e um som. Os registros são carregados automaticamente do progresso salvo.
- O formato do progresso continua compatível com versões antigas: conclusões, melhores notas e núcleos previamente registrados podem reconhecer suas respectivas conquistas, sem inventar estatísticas antigas de quedas ou danos.
- Partidas que utilizaram o **DEBUG** não registram conquistas, percursos secretos nem recordes, mesmo se ele for desligado antes da chegada.

## Portal da Fenda — conclusão da fase 2

- A porta branca **GO** permanece na fase 1, mas foi completamente removida do Cânion Prisma.
- Na segunda fase, não existe saída visível antes de derrotar o Guardião; o local final permanece desativado e não encerra a tentativa.
- Depois do colapso cinematográfico do chefe, a câmera faz uma **panorâmica suave até a saída**, revelando um **portal dimensional** que se materializa ao lado da arena. A abertura leva aproximadamente **1,45 segundo**, com anéis violeta e turquesa girando em direções opostas, centro de energia, cristais orbitais, partículas e pulso luminoso.
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

## Etapa 4 — Mapa das Fendas (interface e campanha)

O mapa agora tem quatro destinos em forma de rota, com ficha contextual compacta e
somente um botão para retornar ao menu inicial. O botão de Conquistas permanece na home.

**Registros separados:**
- `velocity-rift-progress-v1` continua sendo o arquivo histórico de tempos,
  notas, segredos e conquistas. Iniciar uma campanha não o apaga.
- `velocity-rift-campaign-v3.records` guarda os tempos, notas e conclusões da
  **campanha atual**. Novas campanhas começam com esses valores zerados;
  núcleos e rotas atuais usam `campaign.extras`.
- Saves antigos em andamento sem `records` migram as estatísticas das fases já
  concluídas uma única vez. Novas campanhas não importam resultados históricos.
- O mapa mostra `--`, `0/3` e `0/3` quando uma fase ainda não foi completada.

Checklist:
- [ ] Abrir o mapa no desktop e celular; as quatro regiões e o botão Menu
  devem permanecer legíveis.
- [ ] Selecionar as fases bloqueadas; ler o resumo sem poder iniciá-las.
- [ ] Iniciar **Novo Jogo** com arquivo antigo; verificar tempo `--`,
  núcleos `0/3` e segredos `0/3` em todas as fases.
- [ ] Completar fase 1: verificar registro apenas da campanha atual e desbloqueio
  de Cânion Prisma.
- [ ] Reabrir o jogo: validar persistência da campanha atual.
- [ ] Consultar Conquistas na home: garantir que os feitos históricos
  permanecem disponíveis.



### Mapa das Fendas: seletor cartográfico refinado (Etapa 4)

O atlas da campanha mantém a ficha enxuta à direita e recupera a seleção
geográfica de regiões no painel esquerdo. Os quatro nós são posicionados
sobre um mapa de biomas dimensionais, conectados por caminhos:
- Floresta Neon: início da jornada;
- Cânion Prisma: disponível após a Floresta;
- Cidade das Fendas: disponível após o Cânion;
- Fenda Original: prévia do capítulo final, ainda bloqueado.

Clicar em qualquer nó, mesmo bloqueado, mostra a ficha da região sem
liberar o botão de jogo. Os caminhos ganham destaque conforme a campanha
desbloqueia os destinos. Controle por teclado e layout mobile preservados.

**QA manual:** testar seleção mouse/toque e teclado (setas, Home, End),
estado das linhas após concluir fases, prévia da Fenda Original e legibilidade
dos nós em telas de 320–430px; dados da campanha atual continuam separados
dos recordes históricos.



### Etapa 4 — Arquivo de conquistas com rolagem única

- Redesenhada a tela de conquistas no mesmo estilo discreto da home e do Mapa das Fendas.
- Os desafios e as rotas secretas aparecem em sequência, com **uma rolagem contínua**:
  sem barras de scroll individuais nas listas.
- Barra geral com a contagem das 20 conquistas; resumo das nove rotas.
- Mantém as conquistas, os tempos históricos, as descrições e os estados desbloqueados.
- A tela abre no cabeçalho; o foco não salta para o botão localizado no rodapé.
- No celular o documento usa a rolagem normal da página, também sem scrolls internos.

QA manual: testar com arquivos sem e com conquistas, navegar até o fim das rotas,
pressionar Voltar ao menu, reabrir a coleção e verificar que inicia no topo;
validar rolagem por mouse, touch e teclado, em desktop e celular.


### Etapa 4 — Introdução de corrida com boost (4 segundos)

- Entrada automática aumentada de 2,05 s para **4 s** no primeiro acesso
  à fase, após a cena inicial.
- Flux percorre 1.500 unidades de cenário **exclusivamente cenográfico**,
  com boost visível, pós-imagens, partículas e desaceleração suave nos
  últimos 0,5 s.
- O antigo retângulo escuro atrás do título foi removido: aparece apenas
  o nome da região com uma leve sombra.
- O trecho de estrada temporário recebe elementos cenográficos da floresta,
  do cânion ou da cidade, sem acrescentar fases ou alterar a física.
- Ao terminar, Flux é colocado exatamente no spawn original, sem energia
  extra, progresso grátis, coleta de cristais ou avanço do cronômetro.
- A animação ainda pode ser pulada com Enter/Espaço, e pausar continua
  congelando o tempo da introdução.

QA manual: verificar a primeira entrada das três fases após suas cenas
iniciais, a transição para o spawn e a câmera, a pausa durante a sequência,
a versão sem bloco cinza e o início do cronômetro só com o controle liberado.

## Android APK — versão de testes

Este projeto também pode ser empacotado como aplicativo **Android offline**
(com controles de toque e orientação horizontal) usando Capacitor 7.

### APK pelo GitHub, sem Android Studio no seu PC
1. Abra [GitHub Actions — Android APK](https://github.com/jhonyoreis/velocity-rift/actions/workflows/android-apk.yml).
2. Aguarde o workflow **Android APK (Velocity Rift)** ficar verde. Em atualizações
   futuras, use **Run workflow** para gerar novamente quando quiser.
3. Abra a execução aprovada e, em **Artifacts**, selecione
   `velocity-rift-android-debug`.
4. Descompacte o ZIP baixado para obter `app-debug.apk`. Transfira o APK
   para o celular Android e abra-o para instalar, confirmando apenas as
   permissões de instalação que o sistema solicitar.
5. Abra **Velocity Rift** e teste os botões de direção, pulo, boost, slide,
   som, pausa, derrota, checkpoints e progresso persistente após reiniciar.

**Atenção:** é um APK de desenvolvimento/debug, assinado pela chave debug
gerada na máquina de build. Serve para testes pessoais, **não** para distribuir
na Google Play. Como essa chave pode mudar entre execuções, pode ser necessário
desinstalar a versão debug anterior antes de instalar uma nova; desinstalar
pode apagar os saves locais. Faça backup manual da experiência desejada.

### Gerar localmente (Windows/macOS/Linux)
Requisitos: Node.js 22, Java 21, SDK Android 35 e Android Studio.

```bash
npm install
npm run build
npx cap add android
npx cap sync android
node scripts/configure-android.mjs
cd android
./gradlew assembleDebug
```

O APK ficará em `android/app/build/outputs/apk/debug/app-debug.apk`.
`android/` é gerado no build e ignorado pelo Git, para manter a engine web
independente do ambiente Android. A orientação `sensorLandscape` mantém o
jogo em paisagem; no celular, o espaço útil varia conforme a barra do sistema.


## Etapa 4 — Responsividade Android

O APK utiliza modo imersivo, mantendo o Canvas 16:9 sem distorção e aproveitando as telas largas. A interface é adaptada para toque e paisagem: home, mapa, conquistas, configurações, galeria, pausa, derrota, resultados e cinematográficas.

As cinematográficas mostram dicas por toque, não atalhos de teclado. O HUD e os botões de movimento/boost/pulo recebem um layout mobile específico, com áreas de segurança para recortes da tela.

QA no celular: verificar menus, status e navegação sem sobreposição, proporções de tela, cenas, combinação dos controles de toque, chefes, checkpoint, save e áudio. A geração do APK continua em GitHub Actions (workflow Android APK). O pacote debug pode ser assinado com chave diferente a cada compilação e exigir reinstalação, que pode apagar saves locais.

### Etapa 4 — Revisão mobile unificada: HUD, menus e cinematográficas

Melhorias reunidas a partir das capturas de testes Android:

- HUD limpo **durante o jogo**: cristais, tempo e boost; vida dos chefes e
  avisos críticos surgem somente quando relevantes. Sem nome da fase,
  porcentagem nem velocidade fixos na tela.
- Núcleos e rotas secretas exibem contagens **temporárias após a coleta**,
  desaparecendo sozinhas; sempre disponíveis no resumo do Pause.
- Pause refeito com tempo, cristais, núcleos, segredos e progresso; botões
  Continuar, Reiniciar e Menu; Áudio, Controles e Debug são seções
  **recolhíveis**. Debug deixou de existir como botão flutuante no jogo.
- Sem HUD desenhado por trás de menus, resultados ou Pause.
- Resultados usam cinco cartões compactos na mesma linha no Android e
  botões organizados em linhas; tela rolável sem cortar ações.
- Configurações menores, com volumes e botão Voltar acessíveis.
- Cinematográficas com diálogos estreitos e curtos para deixar os
  personagens visíveis; textos longos podem ser rolados.
- Evita abrir o menu de seleção de texto do Android por pressionamento
  prolongado sobre títulos, botões e legendas.

**QA Android necessário:** verificar tela inicial com toque longo; terminar
fase e testar todos os botões de resultado; abrir Configurações e voltar;
pausar e verificar os cinco contadores; abrir e fechar Áudio/Controles/Debug;
coletar núcleo, descobrir segredo e ver a contagem desaparecer; iniciar
cenas com legendas longas e comparar espaço de arte; conferir que chefes
continuam tendo barra de vida e que o Boost permanece legível.



### Hotfix Android — controles, diálogo e áudio (Etapa 4)

Após o teste visual do APK, foram aplicados estes ajustes:

- **Controles e Pause restaurados durante a partida:** o estado
  `gameplay-active` é marcado explicitamente quando o jogo está em execução;
  a exibição dos cinco controles e do botão de pausa não depende apenas de
  `pointer: coarse`, que alguns WebViews Android reportam incorretamente.
  A detecção da apresentação Android também aceita o user agent do aparelho.
  A captura de toques tem tratamento de falha para preservar o comando.
- **Cinematográficas mobile:** o balão de história não mostra nome do
  narrador nem título da cena, ficando menor e mantendo somente o
  parágrafo e os botões de ação. O cabeçalho do capítulo permanece.
- **Som amplificado:** música em ~3,2× e efeitos em ~2,5× da mixagem
  anterior; ambos continuam controlados pelos sliders, silenciáveis e
  ligados a um compressor de dinâmica para conter picos. A alteração
  afeta o sintetizador interno, não o volume geral do Android.

**Testes manuais no novo APK:** abrir cinematográfica, iniciar Floresta
Neon e confirmar os botões ◀ ▶ Pular Boost Slide e Pause; testar toques
simultâneos e transições entre pausa, morte, conclusão de fase e próximas
fases; ouvir música e efeitos nos volumes 0%, 50% e 100% com o
**volume físico do Android ajustado confortavelmente**, verificando
distorções; conferir legibilidade de parágrafos longos da história.
O áudio deve ser testado em alto-falantes e fones em um volume confortável.



### Android R4 — correção estrutural de controles / diálogos / volume

**Causa-raiz identificada:** o botão Pause e os cinco controles de toque
estavam aninhados dentro de `#overlay`, que fica invisível e com
`pointer-events:none` durante a partida. As regras CSS não conseguiam
fazê-los funcionar. Agora os controles são irmãos do overlay dentro de
`.game-panel`; uma proteção no JavaScript também move esses elementos
para fora caso um HTML antigo volte a aninhá-los.

**Cinematográficas:** o balão de fala mostra apenas o parágrafo da
história (sem título nem narrador), em tamanho reduzido no Android.
O título do capítulo continua no cabeçalho superior.

**Áudio:** a música está em 4× e os efeitos em 3× dos valores internos
originais, com o compressor de dinâmica já existente e sliders de áudio
funcionando em todos os volumes, inclusive 0%.

**Identificação do APK:** na tela inicial mobile aparece
`v3.7.2 · APK R4` (versão anterior). Se a indicação `APK R4` não aparecer, você está
testando a compilação anterior. Os APKs debug usam chaves de assinatura
de CI que podem mudar; nesse caso, a instalação sobreposta falha e é
preciso desinstalar o APK antigo, o que pode eliminar os saves locais.

Testes regressivos agora conferem a estrutura DOM, isto é,
Pause/gamepad como irmãos do overlay, e as alterações no áudio e no
diálogo. Teste visual adicional em viewport 1536×709 confirmou que os
controles aparecem na borda inferior depois de remover o aninhamento.


## Política de versionamento — a partir da versão 3.7.3

A pedido do usuário, **toda alteração publicada no jogo deve atualizar a versão**. A versão é mantida consistente em `package.json`, título HTML, tela inicial (incluindo o identificador do APK) e metadados nativos Android gerados no build. A verificação automatizada `tests/versionConsistency.test.js` reprova divergências entre as fontes. Por padrão, pequenas correções e melhorias elevam o último número (patch, como `3.7.3 → 3.7.4`); mudanças de escopo maior podem elevar minor/major, conforme combinado. Um conjunto de alterações publicado em um único commit/release usa um único número. Registre cada mudança no README e não modifique silenciosamente saves nem semântica de progresso.

### 3.7.3 — Validação Android R4 e controle de versão

- Os controles, modo imersivo, áudio e diálogos da revisão Android R4 foram aprovados em teste manual.
- Nenhuma alteração nas mecânicas; apenas registro de versão visível, rastreio Android e garantia automática de consistência para atualizações futuras.
- **APK R5** identifica o build de versionamento, já com a base da R4 validada. Histórico da R4 preservado acima.


## Velocity Rift 3.7.4 — Upgrades secretos, Android e polimento (Etapa 4)

Esta atualização reúne o escopo que estava previsto para 3.7.4, 3.7.5 e
3.7.6, em **um único pacote 3.7.4**. O próximo patch é 3.7.5.

### Recompensas permanentes das nove rotas

A recompensa antiga (+8 cristais e +20 boost durante a tentativa) continua;
agora, **na primeira conclusão sem DEBUG**, cada rota também concede uma
melhoria permanente de perfil, restaurada ao abrir o jogo ou iniciar campanha
nova. A fonte dos upgrades é o arquivo histórico
`velocity-rift-progress-v1.secrets`, e não apenas a campanha atual; rotas
anteriormente conquistadas são reconhecidas automaticamente.

| Rota | Melhoria permanente |
| --- | --- |
| Copa Esmeralda (1) | Capacidade de boost +10 |
| Ninho Luminoso (1) | Potência de boost +3% |
| Horizonte Neon (1) | Capacidade de boost +10 |
| Eco Suspenso (2) | Capacidade de boost +10 |
| Arco Prismático (2) | Potência de boost +3% |
| Zênite Violeta (2) | Capacidade de boost +10 |
| Antenas Perdidas (3) | Potência de boost +3% |
| Subsolo Fantasma (3) | Capacidade de boost +10 |
| Coroa dos Arranha-céus (3) | Potência de boost +3% |

Limites: barra inicial 100 → máxima 150; potência do impulso 100% → 112%
(aceleração e velocidade máxima em boost). Não acumulam em repetições
da mesma rota ou em DEBUG. O indicador de capacidade/potência aparece
no Pause e as recompensas podem ser consultadas em Conquistas.

### Tutorial e polimento para celular

Placas próximas de Flux indicam os botões **◀ ▶, Pular, Boost, Slide e
pulo duplo (dash)** em vez de teclas de PC. Surgem conforme ele se aproxima,
desaparecem após a passagem e preservam as placas originais no desktop.
Efeitos de toque mais suaves; em mobile, as partículas simultâneas são
limitadas a 95 e as pós-imagens do Flux a 5, sem mudar a física ou o tempo
dos desafios. Respeita a opção de reduzir animações.

### Android APK: assinatura estável *opcional*

GitHub Actions continua gerando o **APK debug** mesmo sem configurar nada,
mas a chave efêmera de CI NÃO permite atualizar versões anteriores de modo
confiável e pode exigir desinstalação, apagando dados locais.

Para gerar um **APK de atualização assinado de forma estável**, é necessária
uma chave privada SUA, armazenada de forma segura e permanente; **não
envie o arquivo .jks para o repositório ou para chats**. Configure os quatro
segredos do GitHub em Settings → Secrets and variables → Actions:

- `ANDROID_KEYSTORE_BASE64` — arquivo .jks codificado em Base64;
- `ANDROID_KEYSTORE_PASSWORD` — senha da keystore;
- `ANDROID_KEY_ALIAS` — alias da chave;
- `ANDROID_KEY_PASSWORD` — senha da chave.

Gere a chave em uma máquina confiável usando `keytool -genkeypair`
(disponível com o JDK), guarde o arquivo e senhas em lugar seguro e faça
backup protegido. A secret Base64 pode ser gerada localmente com
`base64 -w 0 velocity-rift-release.jks` em Linux ou
`[Convert]::ToBase64String([IO.File]::ReadAllBytes("velocity-rift-release.jks"))`
no PowerShell. O arquivo codificado nunca deve ser commitado.

Com TODOS os segredos presentes, o workflow executa
`assembleRelease → zipalign → apksigner sign → apksigner verify` e anexa
`velocity-rift-android-update`. Sem os segredos, apenas
`velocity-rift-android-debug` estará disponível. Não há chave privada
armazenada no Git.

**Importante:** atualizar a partir dos APKs debug anteriores, que usam
outra assinatura, pode exigir uma última desinstalação, perdendo os saves
locais; depois de configurar a chave permanente, instale apenas APKs
`velocity-rift-android-update` gerados COM ESSA MESMA chave. O número
`versionCode` do Android acompanha `package.json` para permitir
atualizações com assinatura idêntica.

### Checklist de QA

- [ ] Confirmar versão `3.7.4 · APK R6` na tela inicial Android.
- [ ] Testar placas mobile das três fases e confirmar que no PC elas
  continuam exibindo atalhos de teclado.
- [ ] Completar uma rota nova: ver notificação da recompensa, conferir
  Pause e Conquistas, fechar/reabrir e testar boost aumentado.
- [ ] Repetir rota já concluída, iniciar uma campanha nova e confirmar
  que o upgrade de perfil não desaparece nem duplica.
- [ ] Testar modo DEBUG: não registrar upgrades adicionais.
- [ ] Verificar FPS, partículas e efeitos no Android e desktop.
- [ ] Após configurar Secrets, gerar e verificar assinatura de um APK
  estável, depois instalar uma atualização posterior sem apagar saves.


## 3.7.5 — Etapa 4: primeiro bloco de melhorias

Primeira entrega do conjunto de 17 propostas da [issue #7](https://github.com/jhonyoreis/velocity-rift/issues/7).
Esta versão contém **4 melhorias**:
- #13: TESTE 100% isolado de DEBUG em Opções de teste; ativa acesso às fases, dash e boost máximo temporários, além de mostrar conclusão total no menu de progresso/coleção. Não salva conquistas ou recordes nem torna Flux invulnerável. Ao desligar, o save legítimo permanece inalterado.
- #14: velocímetro numérico com barra proporcional e sete cores: cinza, azul, ciano, verde, amarelo, laranja e vermelho.
- #16: tela de morte minimalista com apenas título e botões de reiniciar/menu em ícones; perda de cristais/checkpoint continuam funcionando.
- #17: confirmação de Novo Jogo reduzida a título, aviso curto e botões de confirmar/cancelar em ícones.

**Ainda pendentes:** transições cinematográficas, altar do dash, passagem por portais, escalonamento do Guardião, ecos de Alicia, apresentação dos chefes, checkpoints especiais, música dinâmica, aparência evolutiva, arquivo narrativo, desafios extras e fantasma de recorde. Não considerar a Etapa 4 concluída até implementar e validar os demais itens.

**QA manual:** inspecionar ambas as telas minimalistas; testar TESTE 100% isolado com dano fatal e save intacto após reiniciar; comparar DEBUG e TESTE 100% simultâneos; inspecionar o velocímetro em todas as bandas incluindo impulso em descidas.


## 3.7.6 — Etapa 4: narrativa, alta velocidade e chefes

Segundo lote da [issue #7](https://github.com/jhonyoreis/velocity-rift/issues/7).

- **#1 e #5:** introduções narrativas ampliadas para as fases 2 e 3, usando o cenário anterior e o Soberano levando Alicia até a fenda; a sequência mostra Flux perseguindo e atravessando o portal.
- **#2:** NÚCLEO DE ÍMPETO agora aparece sobre um altar especial com arco energético, cristais e uma aquisição animada de 2,6 s, sem afetar o cronômetro durante a aquisição.
- **#3:** Flux atravessa o portal/porta em uma breve animação ao finalizar as três fases, antes dos resultados; tempo e cristais são fotografados ao tocar a saída.
- **#4:** Guardião do Prisma adota três padrões sucessivamente mais exigentes após cada acerto, com telegráficos mais rápidos, laser mais demorado e menor janela de vulnerabilidade.
- **#7:** as apresentações/derrotas cinematográficas já existentes dos dois chefes continuam ativas, agora integradas às novas transições.
- **#8:** os checkpoints antes dos chefes são identificados por sinais luminosos especiais; mantém-se o respawn por checkpoint.
- **#9:** aceleração progressiva da trilha de combate do Guardião; música do Arquiteto já intensifica com a vida restante.
- **#10:** núcleo do Flux muda de coloração com upgrades de boost e seu visor reflete o dash desbloqueado.
- **#15:** fantasma do melhor tempo elegível por fase, com trajetória amostrada a cada 0,12 s, persistência separada e botão de exibir/ocultar no Pause. O fantasma é visual, não interage com física, inimigos ou itens; corridas com DEBUG/TESTE 100% não substituem a gravação.

**Ainda pendentes para o próximo lote:** #6 ecos de Alicia, #11 arquivo narrativo, #12 desafios extras. A implementação de cada proposta permanece acompanhada pela issue #7 e exige avaliação manual no Android e PC.


## 3.7.7 — Etapa 4: ecos narrativos e desafios extras

Terceiro lote da [issue #7](https://github.com/jhonyoreis/velocity-rift/issues/7), complementando 3.7.5 e 3.7.6:

- **#6 Ecos de Alicia:** nove pequenos hologramas opcionais (três por fase) surgem no cenário. Aproximar Flux revela um eco no arquivo sem parar a corrida; progresso salvo separadamente e permanente entre campanhas.
- **#11 Arquivo de história:** Galeria inclui a seção dobrável `ARQUIVO DE HISTÓRIA`, revelando apenas mensagens holográficas efetivamente encontradas. O modo de teste 100% permite consultar todos sem gravar alterações na coleção real.
- **#12 Desafios extras:** duas metas opcionais em cada fase — terminar sem receber dano e reunir os três núcleos numa tentativa. Os seis emblemas ficam em Conquistas, persistem em save separado e oferecem apenas um cosmético no cachecol do Flux; não alteram a potência. DEBUG ou TESTE 100% jamais gravam desafios/recordes novos.

**Etapa 4 — estado:** as 17 propostas da issue #7 possuem uma primeira implementação distribuída por 3.7.5/3.7.6/3.7.7. A aprovação final ainda exige QA manual no PC e Android e eventuais correções antes de encerrar formalmente a Etapa 4. Não declarar conclusão sem esses testes.

**QA manual:** percorrer fases e coletar hologramas; verificar arquivo ao fechar/abrir o jogo e após Novo Jogo; concluir fase sem dano e com os três núcleos; inspecionar recompensas e aparência; ativar DEBUG e TESTE 100% e confirmar que os saves legítimos não se alteram.


## 3.7.8 — Estabilidade do altar de desbloqueio

- Corrigida a tentativa repetida de iniciar a animação do altar em partidas de teste, especialmente depois de usar DEBUG. Em cada tentativa a animação de desbloqueio ocorre no máximo uma vez; no DEBUG ativo, o altar não trava o movimento.
- Esta correção não muda os poderes adquiridos nem o comportamento dos saves. O modo TESTE 100% continua independente de DEBUG.
- Versão nativa Android e identificador visual atualizados para `3.7.8 · APK R10`.


## 3.7.9 — Modularização, fantasmas longos e QA visual

- Arte vetorial de cinematográficas movida de `src/main.js` para `src/rendering/cinematicArt.js`, mantendo os mesmos comandos e a renderização original de Flux.
- Fantasmas de recordes mantêm uma gravação limitada a 2400 pontos, porém reamostram dados progressivamente quando a corrida ultrapassa o limite anterior de ~4m48s; o fim real do trajeto é incluído ao atravessar o portal. Compatível com trajetórias já salvas.
- Novos testes automatizados de Chromium desktop e Android paisagem verificam telas reais, Canvas, navegação e controles, produzindo capturas em `test-artifacts/visual/` disponíveis como artefato do CI; não substituem QA no aparelho.
- Para executar localmente: `npm install`, `npx playwright install chromium`, `npm run build` e `npm run test:visual`.
- Executar `npm test`, `npm run build` e `npm run test:visual` no CI, e gerar o APK de teste via workflow Android em cada push na `main`. Marca Android: `3.7.9 · APK R11`.

QA manual complementar: completar corrida de mais de cinco minutos e verificar o fantasma na tentativa seguinte; percorrer as cinematográficas e checar o APK R11 no aparelho.


## 3.7.10 — QA: corrigir regressão de identificação Android

- Generalizado o teste legado que exigia etiqueta `APK R10`, aceitando o identificador de revisão vigente e mantendo verificação de consistência de versão.
- A versão `3.7.10 · APK R12` atualiza web/Android e executa novamente CI, testes de navegador e compilação Android.


## 3.7.11 — Balão de cutscene no rodapé e controles por ícones

- Diálogos das cinematográficas passam a ocupar uma faixa junto à borda inferior do jogo, com duas ações compactas **ao lado direito** do balão: **➜** avança para a próxima fala e **☰** volta ao menu principal.
- O botão **Pular cena** foi removido. Progredir naturalmente pela última fala continua levando ao próximo trecho ou à partida; a tecla Esc retorna ao menu durante a cinematográfica.
- No Android horizontal, o texto permanece legível com rolagem interna apenas quando longo e respeita as áreas seguras da tela. A arte e os personagens ficam livres acima do painel.
- Controles continuam acessíveis com `aria-label`, tooltip, foco por teclado e tamanho mínimo de toque. Galeria, áudio, saves e física não mudaram.
- Testes de navegador passam a percorrer falas com o botão ➜ (sem pular) e verificam posicionamento do balão e dos dois ícones, tanto em desktop quanto em Android horizontal.
- Versão de instalação: `3.7.11 · APK R13`.

**QA manual Android:** testar abertura e transições das três fases, especialmente falas longas em tela 16:9 e telas mais largas; conferir ➜ e ☰ com toque, antes de continuar a partida e quando a cutscene é aberta pela Galeria.
