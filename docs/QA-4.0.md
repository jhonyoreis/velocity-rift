# Velocity Rift 4.2.2 — APK R25

A quarta fase encerra a campanha. O portão inicial continua exigindo nove
núcleos distintos das primeiras três regiões da campanha atual. Há retorno
para o mapa quando a coleção ainda está incompleta.

## Travessia e decisões

O mundo de 48.000 unidades tem nove setores. Os seis símbolos precisam de
Dash na gravidade e realidade correspondentes. Três portas exigem pares
completos; Boost não atravessa portas fechadas. As fendas de retorno do teto
exigem o símbolo anterior, evitando deixar um símbolo obrigatório para trás.

Pedestais de realidade respondem a uma nova pressão de **Baixo / Slide / X**.
É possível voltar a alternar a realidade. O salto continua usando **Pular**;
uma segunda pressão no ar executa Dash. Soltar Pular encurta o salto.
As rotas elevadas exigem sustentar Pular para os saltos mais altos.

Três faróis opcionais iniciam desafios cronometrados com Baixo / Slide / X.
Os núcleos podem ser coletados sem vencer o cronômetro. Os faróis permitem
repetir uma tentativa, inclusive após coletar o núcleo. Os selos, núcleos e
rotas já encontrados permanecem durante a tentativa após uma morte.

## Inimigos e confrontos

- Sentinela laser: mira travada e aviso tracejado antes do feixe ativo.
- Sentinela triplo: três disparos em leque. Os dois sentinelas só morrem por
  Dash; Boost não os elimina. Feixes e disparos já emitidos continuam ativos
  depois da morte do emissor e causam dano durante Boost e Dash.
- Perseguição: cinco acertos no núcleo exposto por Dash; barreira móvel
  consome todos os cristais. Um impacto sem cristais é fatal. Derrotar esse
  encontro desarma a barreira e libera a catedral.
- Arena: cinco acertos, rajadas, feixes, invocações e inversões avisadas.
  Portais laterais permitem escolher o chão ou o teto.
- Segunda forma invulnerável: derrota narrativa de Flux, sem tela de morte.
  Alicia o encoraja e os nove núcleos despertam Flux Rubro.
- Última forma: seis acertos. Dash ou Boost com poder Rubro ferem o núcleo
  exposto. Cada acerto consome o poder; novas ressonâncias aparecem com aviso,
  concedendo 7,5 segundos de poder, energia de Boost e oito cristais.
  Um acerto na arena recupera três cristais. Não há regeneração passiva.

A morte na arena recomeça a forma atual, mantendo o despertar já ocorrido.
A vitória é salva antes dos créditos. Flux volta à forma normal, Alicia é
libertada, ambos voltam pela cidade, cânion e floresta até o vale do prólogo.
A flor, cuja entrega foi interrompida no prólogo, termina na mão de Alicia.

## Música e apresentação

Nove movimentos originais sintetizados, entre 76 e 156 BPM. Forma de 32
compassos, mudanças harmônicas, inversões, contraponto e pausas de melodia.
A catedral usa um arranjo espaçado; perseguição, arena e poder Rubro têm
arranjos próprios. O epílogo termina em uma reprise mais serena.

Arquitetura fragmentada em parallax, eclipse rachado, arcos de catedral,
plataformas de realidade inativa em transparência, inimigos com emissores
visíveis, sinais de ataque e aura elétrica escarlate. Arte e música continuam
nativas, sem dependência de mídia externa ou downloads durante a partida.

## Progresso e compatibilidade

Quatro fases, doze núcleos, doze rotas e 25 conquistas. Três novas recompensas
permanentes elevam os limites completos a 170 de reserva e +15% de potência.
Saves 3.x sem stage4 migram com registros finais vazios. Campanha antiga
completa passa a continuar na Fenda Original. Novo Jogo limpa a campanha e
preserva arquivos de conquistas, melhorias e melhores ghosts.

Ghost final registra gravidade e dimensão; ghosts antigos de quatro valores
continuam válidos. Registros e coleções de DEBUG / TESTE 100% não são salvos.
O teste 100% simula as novas melhorias máximas, mantendo dano e morte ativos.

## Verificação automática

`npm run check` executa testes de lógica, build de produção e Playwright.

O driver usa somente entradas de jogador, sem teleportar, editar coordenadas,
fornecer cristais ou ativar invulnerabilidade. Duas rotas vencem os três
confrontos: uma direta e outra com os três núcleos e desafios opcionais.
Os testes verificam portas, regras de dano, consumo de poder, avisos,
barreira, pausa narrativa, checkpoint e forma preservada após morte.

No navegador, desktop e Android horizontal percorrem toda a rota opcional,
assistindo às cenas por seus controles normais. São verificados 100%, save,
ghost, galeria, menu de resultados, pausa e morte/retorno com gravidade
invertida. Capturas ficam em `test-artifacts/visual/` no workflow de validação.

## Conferência em aparelho

A validação de navegador não substitui jogar no aparelho físico. No APK:

1. Conferir **v4.2.2 · APK R25** e a coleção anterior após instalar.
2. Testar Pular, segunda pressão para Dash, Boost e Slide simultâneos.
3. Alternar os pedestais e conferir legibilidade dos sinais em tela pequena.
4. Ouvir os movimentos e ajustar volumes de música/efeitos conforme desejado.
5. Conferir desempenho e áudio numa luta longa, fundo/retorno do aplicativo,
   créditos, flor recebida e campanha salva após reiniciar.

## Polimento e Rubro — R22

- Comparar o núcleo roxo/dourado no coletável, altar e cena Nove Corações.
  No altar parcial, verificar silhuetas pretas exatamente nos slots faltantes.
- Conferir energia com raio e muros altos em Floresta, Cânion e Cidade.
- No primeiro túnel do Cânion, passar com Slide pela rampa sem atravessar
  visualmente o teto. Ficar em pé deve bloquear a entrada.
- Derrotar o Soberano: conferir destruição, dissolução da prisão e caminhada
  até Alicia no cenário. Apenas depois aparece a cutscene; tempo fica parado.
- Depois da vitória, testar 19 cristais (botão oculto) e 20 (núcleo visível).
  Ativar com toque/F; conferir nove núcleos orbitando durante 0,9s.
- Comparar salto, corrida, Boost e Dash em todas as fases. Confirmar que
  Rubro destrói os tiros durante Boost/Dash e que Flux base continua sofrendo dano.
- Receber impactos até zero cristais: Rubro se desfaz. Recarregar o jogo e
  começar outra campanha: o desbloqueio histórico permanece.

## Ruptura — R22

- Entrar na arena final com Rubro pós-jogo: deve retornar à base, manter
  os cristais e impedir reativação pelo botão/F durante o encontro.
- Comparar aura Rubro ativável e da ressonância: seis traços giratórios.
  Conferir rastros, brilho e partículas vermelhos do Boost em todas as fases.
- Confirmar última forma grande, energia pulsante e núcleo exposto legível.
  Rajadas do Soberano são fragmentos violetas; tiros dos lacaios não mudam.
- Receber raio com cristais: zero cristais, breve proteção e retorno à base.
  Outro acerto depois da proteção deve iniciar a animação de derrota.
- Conferir pressão do muro na perseguição e terminar os três encontros.
- Morrer nas quatro fases: animação no cenário primeiro; tela de morte depois.
  Recomeçar no checkpoint e verificar que a animação não reaparece.
- Encostar nos três faróis sem Slide na dimensão correta: cronômetro inicia
  uma vez. Ficar encostado não renova o tempo; concluir as três rotas.

## Realidades estilhaçadas — R23

- Validar frequência crescente de rajadas após cada acerto no Soberano Rubro.
- Colisão da Orbe inicia exílio de 5 segundos; laser causa dano, pausa congela contagem e retorno preserva estado da arena.
- Os três faróis elevados transportam a mapas exclusivos; núcleo antigo não concede recompensa.
- Laser ou queda no desafio devolve ao farol sem morte; reentrada permanece bloqueada até iniciar a fase novamente.
- Vitória concede núcleo e eficiência uma única vez; consumo reduzido persiste no save.
- Núcleos orbitam visivelmente durante a transformação na fase 4.

## Ruínas entre realidades — R24

- Concluir cada percurso com controles reais, incluindo vãos, pares de lasers e sentinelas.
- Falhar, afastar e retornar ao farol: permanece bloqueado. Checkpoint não remove bloqueio; nova fase remove.
- Conferir Orbe perseguindo mudanças de direção e desaparecendo no fim da vida útil.
- Confirmar cristais inalterados após acerto no Soberano e coleta de ressonância.
- Inspecionar cenários e perigos em desktop e Android horizontal, além da campanha completa.

## Apoio nas batalhas — R25

- Coletar energia Rubro: +8 cristais, uma única vez por energia. Acertar o Soberano continua sem dar cristais.
- Entrar na arena do Arquiteto com zero cristais, coletar o cristal próximo à entrada pelo chão e confirmar proteção contra um dano.
- Confirmar que não há coleta repetida; retornar pelo checkpoint restaura o cristal.
