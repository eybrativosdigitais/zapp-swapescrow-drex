- [Starlight](#starlight)
- [Estrutura do Starlight](#estrutura-do-starlight)
- [Requisitos mínimos](#requisitos-mínimos)
- [1) Configuração inicial](#1-configuração-inicial)
  - [1.1) Configuração tipo 1 (recomendado)](#11-configuração-tipo-1-recomendado)
      - [1.1.1) Observações](#111-observações)
    - [2 - Permissões dos contratos](#2---permissões-dos-contratos)
    - [3 - Configurar scripts](#3---configurar-scripts)
      - [3.1 - Configurar scripts - via Postman](#31---configurar-scripts---via-postman)
      - [3.2 - Configurar scripts - via Postman (StepByStep)](#32---configurar-scripts---via-postman-stepbystep)
    - [4 - Consultar de informações da aplicações](#4---consultar-de-informações-da-aplicações)
    - [5 - Configuração inicial alternativa](#5---configuração-inicial-alternativa)
      - [5.1) Configuração tipo 2 (Criando a imagem localmente)](#51-configuração-tipo-2-criando-a-imagem-localmente)
      - [5.2) Configuração tipo 3 (Hospedando Mongo localmente)](#52-configuração-tipo-3-hospedando-mongo-localmente)
    - [6 - Interação com contratos alternativa](#6---interação-com-contratos-alternativa)
      - [6.1 - Interação via frontend](#61---interação-via-frontend)

# Starlight

O Starlight é uma solução de privacidade e anonimidade desenvolvida e mantida pela Ernest & Young ([EYBlockchain/starlight: :zap: solidity --> zApp transpiler :zap: (github.com)​](https://github.com/EYBlockchain/starlight)).

A proposta da solução é simplificar a integração das provas de conhecimento zero em contratos inteligentes permitindo que o desenvolvedor possa abstrair a complexidade de circuitos criptográficos e focar apenas na lógica do contrato. Utilizando um contrato Solidity básico e anotações específicas para privacidade (decoradores), a Starlight se propõe a gerar automaticamente uma aplicação ZKP denominada ZApp (ZKP Application) com toda a infraestrutura necessária para executar os contratos mantendo a privacidade de informações.

Para o Piloto serão implementados os seguintes cenários:
- transferência de Real Digital entre duas instituições;
- compra e venda de TPFt com Real Digital.

As próximas seções fornecerão uma visão da estrutura da solução, seguida de um guia passo a passo elaborado para a execução dos cenários de teste.

# Estrutura do Starlight

Todas as interações com as aplicações Starlight são realizadas através do cliente ZApp, que opera localmente em cada nó da rede. Cada aplicação Zapp é constituída pelos seguintes serviços:

- **Zapp-escrow**: este é o aplicativo cliente principal. As interações com o aplicativo se dão por meio de APIs
- **Timber**: responsável por sincronizar a merkle-tree dos *commitments* com as informações privadas locais e as informações públicas registradas na rede DLT
- **Zokrates-worker**: responsável pela geração das provas de conhecimento zero
- **MongoDB**: base de dados utilizada pelo Zapp e pelo Timber para salvar os *commitments* e o estado do merkle-tree, respectivamente

# Requisitos mínimos

Abaixo segue os requisitos mínimos de Sistema Operacional, Docker, Ambiente de Execução e de Hardware do mesmo:

- Execução em Servidor em Máquina Virtual Dedicada - não Desktop
- Sistema operacional Linux, distribuição Red Hat ou Ubuntu
- Docker Engine versão v26.1 ou superior
- 8 Gb de Memória RAM
- 32 GB de Disco SSD
- 2 vCPU
- Conexão a um nó Besu que esteja conectado a rede Blockchain DREX via Websocket

> Não podemos garantir o correto funcionamento da aplicação se a mesma for executada em máquinas Desktop ou com requisitos inferiores aos citados acima.

# 1) Configuração inicial

A primeira etapa será a configuração inicial do sistema. Há 3 formas diferentes de realizar a configuração inicial do sistema. O foco deste guia será a configuração tipo 1, na qual utiliza um Mongo externo e a imagem do zapp hospedadas no Ghcr(Github Container Registry). Para checar as outras formas, vá em [Configurações alternativas](#).

* Observação: Caso deseje utilizar o Mongo interno, esteja ciente que o mesmo será apagado toda vez que o container for reiniciado. Isso poderá gerar erros ou complicações para a aplicação.

## 1.1) Configuração tipo 1 (recomendado)

1) git clone https://github.com/eybrativosdigitais/zapp-swapescrow-drex
2) cd zapp-swapescrow-drex
3) Crie o arquivo env copiando o exemplo: `cp env.example .env`
4) Preencher o arquivo .env com as informações necessárias
   * Apontar para o seu fullnode no parâmetro: SWAPESCROW_RPC_URL=ws://host:porta
   * Endereço da sua conta: DEFAULT_ACCOUNT
   * Chave da sua conta default: KEY
   * Bloco inicial para sincronização: FILTER_GENESIS_BLOCK_NUMBER
   * Host do mongo externo: MONGO_HOST
   * Port do mongo externo: MONGO_PORT
   * Username do mongo externo: MONGO_USERNAME
   * Senha do mongo externo: MONGO_PASSWORD

5) Crie o arquivo docker-compose.yml copiando o exemplo: `cp docker-compose.external-db-using-image.yml docker-compose.yml`
6) `chmod +x ./bin/startup.sh`
7) `./bin/startup.sh`
8) Verificar se todos os containers estão up: `docker ps`. O log deverá ser semelhante ao abaixo:

 | CONTAINER ID | IMAGE                                                 | COMMAND                  | CREATED     | STATUS   | PORTS                                       | NAMES                             |
|--------------|-------------------------------------------------------|--------------------------|-------------|----------|---------------------------------------------|-----------------------------------|
| 3e52d5d9a6ea | zapp-swapescrow-zapp                                  | "docker-entrypoint.s…"   | 4 days ago  | Up 4 days| 0.0.0.0:3000->3000/tcp, :::3000->3000/tcp   | zapp-swapescrow-zapp-1            |
| 0594e1178515 | zapp-swapescrow-timber                                | "docker-entrypoint.s…"   | 4 days ago  | Up 4 days| 0.0.0.0:3100->80/tcp, :::3100->80/tcp       | zapp-swapescrow-timber-1          |
| b7b53b8b0a63 | ghcr.io/eyblockchain/zokrates-worker-updated:latest   | "/bin/sh -c 'npm sta…"   | 4 days ago  | Up 4 days| 0.0.0.0:8080->80/tcp, :::8080->80/tcp       | zapp-swapescrow-zokrates-1        |

1) Exibir os logs: `docker compose logs -f -n 1000 timber zapp zokrates`
2) A configuração inicial está completa! Se os logs não apresentaram erros. Caso tenha aconteido algum erro, vá até a seção [Erros comuns](#./ProblemasComuns.md) checar se há alguma solução já conhecida.

#### 1.1.1) Observações

* Alterar as configurações do seu nó Besu, aumentando ou desabilitando o limite RPC para logs (parâmetro (RPC-MAX-LOGS-RANGE)[https://besu.hyperledger.org/23.4.0/public-networks/reference/cli/options#rpc-max-logs-range]) (necessário para o correto funcionamento do Timber)

<br />

### 2 - Permissões dos contratos

Foi realizado o deploy do contrato inteligente denominado **SwapShield** responsável por gerenciar os *commitments* do Starlight para os testes de transferência, assegurando que os saldos permaneçam criptografados na rede. Para participar dos testes, os envolvidos no projeto piloto deverão realizar um depósito de Real tokenizado (ERC20) e de TPFt (ERC1155) neste contrato.

Isso requer a autorização do contrato **SwapShield** para duas ações:
-  a) Retirar o Real Digital da carteira Ethereum do participante. É feito por meio do **approve** do valor no contrato de Real Digital. O endereço do contrato de SwapShield que necessita autorização está especificado na seção [Endereços](#).
-  b) Retirar os Títulos Públicos Federais tokenizados (TPFt) da carteira Ethereum do participante. É feito por meio do **setApprovalForAll**. O endereço do contrato de SwapShield que necessita autorização está especificado na seção [Endereços](#).

<br />

### 3 - Configurar scripts

Nesta etapa configurar um formato de interação com os contratos. O foco será a interação via Postman, mas também é possível interagir via frontend da aplicação ou cURL. Você pode checar essas outras formas de interação na seção [Interações alternativas](#).

#### 3.1 - Configurar scripts - via Postman

Existem duas coleções do Postman na raiz do projeto. Na coleção StepByStep, encontram-se as sequências padrão de interação com os contratos. Na coleção SwapEscrow.postman_collection.json, há rotas adicionais para depuração da aplicação.

Para configurar o Postman, siga os passos abaixo:

* Importe o arquivo [SwapEscrow.postman_collection.json](SwapEscrow.postman_collection) no [Postman](https://www.postman.com/downloads/).
* Dentro do Postman, clique no nome da pasta e defina as seguintes propriedades na aba variáveis:
* * `bank_a_zapp`: Servidor onde está rodando a aplicação, o valor default é `http://localhost:3000`)
* * `swapShield_address`: Endereço do contrato de SwapShield na rede Besu, o valor default é `0x79dEf25c56d2F980dE1e8fAB77b22846fd7Ae557` 
* * `accountBankA`: `` Preencher com conta Ethereum do participante que será utilizada para o teste)
* * `accountBankB`: `` O endereço do banco que irá propor uma troca
* * `erc_1155_address`: `` Endereço do contrato do TPFt na rede Besu
* * `erc_20_address`: `` Endereço do contrato de real tokenizado utilizado na troca na rede Besu
* * `erc_20_address_test`: `` Endereço de outro contrato de real tokenizado utilizado na troca na rede Besu
* * `bank_b_zapp`: *Campo não obrigatório* - Servidor onde está rodando a aplicação de sua contra-parte o valor default é `http://localhost:3003`. Este campo é útil caso esteja testando entre dois bancos próprios.

<p align="center">
  <img src="https://starlight-readme.s3.amazonaws.com/postman-config.png" alt="Configuração Postman"/>
</p>

#### 3.2 - Configurar scripts - via Postman (StepByStep)

A coleção StepByStep já contém pastas com os passos específicos dos testes do piloto. Será necessário a configuração de mesmas variáveis do passo anterior para que os scripts funcionem corretamente. Para isso, repita o processo de configuração de variáveis descrito na seção [Configurar scripts - via Postman](#31---configurar-scripts---via-postman).

### 4 - Consultar de informações da aplicações

Na aplicação, há um frontend com rotas para consultar o status da aplicação. Para acessar, basta acessar o endereço `http://<endpoint_da_aplicação>:3000` no navegador. Neste frontend, é possível consultar o *status da aplicação*, os *commitments* e os *balanços privados* (ou também chamados de shielded) do seu endereço. Para isso, você pode ir nas páginas "Info", "Balanços" e "Commitments".

<p align="center">
  <img src="https://starlight-readme.s3.amazonaws.com/starlight-frontend.png" alt="Frontend - Info"/>
</p>

### 5 - Configuração inicial alternativa

Nesta etapa será apresentado duas formas alternativas de configuração inicial do sistema. A primeira é a criação da imagem localmente e a segunda é a hospedagem do Mongo localmente.

#### 5.1) Configuração tipo 2 (Criando a imagem localmente)

Repita os passos 1 a 4 da seção [Configuração tipo 1](#11-configuração-tipo-1-recomendado). O único passo que haveŕa diferença é o passo 5, onde será necessário criar o arquivo docker-compose.yml copiando o exemplo: `cp docker-compose.external-db-using-dockerfile.yml docker-compose.yml`.

#### 5.2) Configuração tipo 3 (Hospedando Mongo localmente)

Repita os passos 1 a 4 da seção [Configuração tipo 1](#11-configuração-tipo-1-recomendado). O único passo que haveŕa diferença é o passo 5, onde será necessário criar o arquivo docker-compose.yml copiando o exemplo: `cp docker-compose.unsafe-local-db-using-dockerfile docker-compose.yml`.

> *Observação: A configuração tipo 3 não é recomendada para ambientes de produção, pois o Mongo será apagado toda vez que o container for reiniciado. Apesar de a aplicação ter um mecanismo de recuperação de dados, isso poderá gerar erros ou complicações para a aplicação.*

### 6 - Interação com contratos alternativa

#### 6.1 - Interação via frontend

A aplicação possui um frontend que permite a interação com os contratos. Para acessar, basta acessar o endereço `http://<endereço_da_aplicação>:3000` no navegador. Neste frontend, é possível realizar todos os passos de interação com os contratos que estão disponíveis nas rotas do Postman. Para isso, você pode começar pela tela de Depósito da aplicação. 

Na seção já foi coberta [Consultar de informações da aplicações](#4---consultar-de-informações-da-aplicações) as informações que podem ser consultadas no frontend.



