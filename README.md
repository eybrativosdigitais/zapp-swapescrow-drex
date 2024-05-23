# EY Starlight Zapp SwapEscrow para Drex - Documento em Construção (WIP)

O Starlight Zapp SwapEscrow é uma solução de privacidade e anonimidade desenvolvida e mantida pela Ernest & Young através do Starlight ([EYBlockchain/starlight: :zap: solidity --> zApp transpiler :zap: (github.com)​](https://github.com/EYBlockchain/starlight)).

A proposta da solução é simplificar a integração das provas de conhecimento zero em contratos inteligentes permitindo que o desenvolvedor possa abstrair a complexidade de circuitos criptográficos e focar apenas na lógica do contrato. Utilizando um contrato Solidity básico e anotações específicas para privacidade (decoradores), a Starlight se propõe a gerar automaticamente uma aplicação ZKP denominada ZApp (ZKP Application) com toda a infraestrutura necessária para executar os contratos mantendo a privacidade de informações.

Para o Piloto serão implementados os seguintes cenários: 

- transferência de Real Digital entre duas instituições; 
- compra e venda de TPFt com Real Digital (DvP)

As próximas seções fornecerão uma visão da estrutura da solução, seguida de um guia passo a passo elaborado para a execução dos cenários de teste.

<br />

# Estrutura do SwapEscrow

Todas as interações com as aplicações Starlight são realizadas através do cliente ZApp, que para o piloto do DREX é o SwapEscrow. Ele opera localmente em cada nó da rede. O SwapEscrow é constituído pelos seguintes serviços:

- **Orchestrator**: este é o aplicativo cliente principal. As interações com o aplicativo se dão por meio de APIs
- **Timber**: responsável por sincronizar a merkle-tree dos *commitments* com as informações privadas locais e as informações públicas registradas na rede DLT
- **Zokrates-worker**: responsável pela geração das provas de conhecimento zero
- **MongoDB**: base de dados utilizada pelo Zapp e pelo Timber para salvar os *commitments* e o estado do merkle-tree, respectivamente

<br />

## Setup da Infra
<br />

Para efetuar os testes, é necessário realizar a configuração do SwapEscrow. Com o intuito de simplificar esse processo, disponibilizamos uma série de scripts que podem ser executados em plataformas como Postman ou outras ferramentas análogas (Insomnia, etc.).”

### Geração das imagens

O primeiro passo consiste na geração das imagens dos componentes do Starlight. Para isto deve-se seguir as instruções detalhadas abaixo:

#### Build da imagem do **MongoDB**

É altamente recomendável que você crie um pequeno servidor somente para ter sua instancia de banco de dados do Zapp para evitar perda de commitments e consequentemente de operações.

* docker build -t zapp-mongo -f Dockerfile.mongo .

#### Build da imagem do **Zapp Escrow**

A imagem já esta disponível em: ghcr.io/eyblockchain/swapescrow-orchestrator:latest

#### Build da imagem do **Timber**

O build da mesma já esta disponível no arquivo docker-compose.yml. Entretanto, caso necessite criá-la manualmente siga os seguintes passos:

* git clone https://github.com/eybrativosdigitais/timber
* git checkout multiple-contracts (**IMPORTANTE:** usar essa branch)
* cd merkle-tree
* docker build -t timber .

### Configuração do Docker Compose

Com as imagens dos componentes do Starlight devidamente criadas, o passo subsequente é dar início aos serviços
* Configurar os dados abaixo no [docker-compose.yml](docker-compose.yml):
  * Apontar para o seu fullnode no parâmetro: RPC_URL=ws://host:porta (linha 37 e 62)
  * Endereço da sua conta: DEFAULT_ACCOUNT (linha 63)
  * Chave da sua conta default: KEY (linha 64)
  * Endereço da sua conta admin: ADMIN_ACCOUNT (linha 65)
  * Chave da sua conta admin: ADMIN_KEY (linha 66)

* Alterar as configurações do seu nó Besu, aumentando ou desabilitando o limite RPC para logs (parâmetro (RPC-MAX-LOGS-RANGE)[https://besu.hyperledger.org/23.4.0/public-networks/reference/cli/options#rpc-max-logs-range]) (necessário para o correto funcionamento do Timber)


### Inicialização dos Serviços

* Executar os comandos abaixo para subir os componentes:
  * docker-compose up
  * verificar se todos os containers estão up:

|  IMAGE                    | STATUS      |  PORTS                   | NAMES                 |
| ------------------------- | ----------- | ------------------------ | --------------------- |
|  zapp-escrow              | Up          |  0.0.0.0:3000->3000/tcp  | zapp-sender           |
|  timber                   | Up          |  0.0.0.0:3100->80/tcp    | timber-sender         |
|  zokrates-worker-updated  | Up          |  80/tcp                  | zokrates-sender       |
|  zapp-mongo               | Up          |  27017/tcp               | zapp-mongo-sender     |
|  timber-mongo             | Up          |  27017/tcp               | timber-mongo-sender   |

<br />

**ATENÇÃO**

O docker-compose fornecido cria volumes para ambos os bancos de dados. Recomenda-se que haja um servidor mongo para o Timber e o Zapp SwapEscrow. Caso teste em uma só maquina, cuide para que os volumes não sejam apagados durante os testes.

### Permissões nos contratos

Foi realizado o deploy do contrato inteligente denominado **SwapShield** responsável por gerenciar os *commitments* do Starlight para os testes de transferência, assegurando que os saldos permaneçam criptografados na rede. Para participar dos testes, os envolvidos no projeto piloto deverão realizar um depósito neste contrato. Isso requer a autorização do contrato **SwapShield** para retirar o Real Digital da carteira Ethereum do participante, o que é feito por meio do **approve** do valor no contrato de Real Digital. O endereço do contrato de escrow que necessita autorização está especificado na seção [Configurar scripts](#-2---Configurar-scripts-(Postman)).


## Operação

* Importe o arquivo [starlight.json](starlight.json) no [Postman](https://www.postman.com/downloads/).
* Dentro do Postman, crie um ambiente e defina as seguintes variáveis:
* * `host`: `http://localhost:3000` (servidor onde está rodando o cliente, o valor default é `http://localhost:3000`)
* * `EscrowShield`: `0xf3cBfC5c2d71CdB931B004b3B5Ca4ABEdbA3Cd43` (endereço do contrato de escrow na rede)
* * `account`: `` (preencher com conta Ethereum do participante que será utilizada para o teste)


### APIs

A interação com os testes da solução Starlight ocorrerá através de APIs configuradas de acordo com a seção [Configurar scripts](#-2---Configurar-scripts-(Postman)). O primeiro passo deve ser o depósito no contrato **SwapShield**. Após o depósito, transferências, saques e consultas ao *commitments* podem ser realizadas através das APIs conforme detalhado a seguir:

#### Realizar depósito

O operação de depósito consiste na transferência de um valor específico da carteira Ethereum de Real Digital ou NFTs do Título Publico Federal para o contrato SwapShield. Para que o depósito seja efetivado é necessário que a carteira possua saldo suficiente e que o **approve** tenha sido realizado conforme as diretrizes apresentadas em [Premissões de contratos](#-3---Permissões-contratos). 
Ao realizar a chamada à API de depósito, um novo *commitment* com o valor depositado será criado no banco de dados da sua aplicação ZApp local.

#### Transferir Real Digital

Para transferir Real Digital deve-se definir o endereço da carteira do recebedor e efetuar a chamada à API de transferência. É requisito para a operação que haja pelo menos 2 *commitments* não gastos (isNullable is false). O resultado final será a geração de 2 novos *commitments*: um no valor da transferência para o endereço da carteira recebedora e outro para o participante pagador com o valor da diferença entre o valor dos dois *commitments* gastos e o valor da transferência. É importante notar que ambos os *commitments* recém-criados passarão a integrar o conjunto de *commitments* locais. Contudo, o commitment destinado à carteira do recebedor não estará acessível para gastos pelo pagador.
Caso não haja 2 registros de *commitments* não gastos para executar a transferência o seguinte erro será apresentado: `Cannot read properties of undefined (reading 'preimage')`

#### Realizar saque

A operação de saque consiste em retirar Real Digital ou Título Publico Federal do contrato SwapShield e retornar para a carteira Ethereum do participante. Como resultado, será gerado um novo *commitment* com o valor remanescente da diferença entre o valor dos 2 *commitments* gastos e o valor do saque.
Caso não haja 2 registros de *commitments* não gastos para realizar o saque o seguinte erro será apresentado: `Cannot read properties of undefined (reading 'preimage')`

#### Consultar commitments

A API de consulta possibilita a busca de todos os *commitments* registrados na base de dados do seu ZApp. Cada operação realizada, seja de depósito, transferência ou saque, gera *commitments* que ficam registrado nesta base.

Para verificar o saldo do participante, é necessário calcular o valor por meio da busca dos *commitments* e identificar aqueles gerados especificamente para você. Vale ressaltar que, nas transferências, também são registrados na base os *commitments* gerados para a parte que recebeu os fundos. O campo **mappingKey** indica sobre quais *commitments* são seus e quais são de uma contraparte.


