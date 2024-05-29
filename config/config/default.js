module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'silly',
  zokrates: {
    url: process.env.ZOKRATES_URL || 'http://zokrates',
  },
  merkleTree: {
    url: process.env.TIMBER_URL || 'http://timber',
  },
  // merkle-tree stuff:
  ZERO: '0',
  HASH_TYPE: 'mimc',
  CURVE: 'ALT_BN_254',
  LEAF_HASHLENGTH: 32, // expected length of leaves' values in bytes
  NODE_HASHLENGTH: 32, // expected length of nodes' values up the merkle tree, in bytes
  POLLING_FREQUENCY: 6000, // milliseconds
  FILTER_GENESIS_BLOCK_NUMBER: process.env.FILTER_GENESIS_BLOCK_NUMBER || 1, // blockNumber

  BN128_GROUP_ORDER: BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617',
  ),
  BN128_PRIME_FIELD: BigInt(
    '21888242871839275222246405745257275088696311157297823662689037894645226208583',
  ),
  // the various parameters needed to describe the Babyjubjub curve
  // BABYJUBJUB
  // Montgomery EC form is y^2 = x^3 + Ax^2 + Bx
  // Montgomery EC form of BabyJubJub is y^2 = x^3 + 168698x^2 + x
  // A = 168698 and B = 1
  BABYJUBJUB: {
    JUBJUBA: BigInt(168700),
    JUBJUBD: BigInt(168696),
    INFINITY: [BigInt(0), BigInt(1)],
    GENERATOR: [
      BigInt(
        '16540640123574156134436876038791482806971768689494387082833631921987005038935',
      ),
      BigInt(
        '20819045374670962167435360035096875258406992893633759881276124905556507972311',
      ),
    ],
    JUBJUBE: BigInt(
      '21888242871839275222246405745257275088614511777268538073601725287587578984328',
    ),
    JUBJUBC: BigInt(8),
    MONTA: BigInt(168698),
    MONTB: BigInt(1),
  },

  tolerances: {
    LAG_BEHIND_CURRENT_BLOCK: 1, // add warnings for use of tree data which lags further behind the current block (e.g. due to anonymity concerns)
  },
  BULK_WRITE_BUFFER_SIZE: 1000, // number of documents to add to a buffer before bulk-writing them to the db
  contractOrigin: process.env.CONTRACT_LOCATION,
  // contracts to filter:
  contracts: {
    // contract name:
    SwapShield: {
      treeHeight: 32,
      events: {
        // filter for the following event names:
        NewLeaf: {
          // filter for these event parameters:
          parameters: ['leafIndex', 'leafValue'],
        },
        NewLeaves: {
          // filter for these event parameters:
          parameters: ['minLeafIndex', 'leafValues'],
        },
      },
    },
  },
  // mongodb:
  // TODO: The latest Timber image has been edited... not sure how to create a 'user' for Timber anymore...
  mongo: {
    host: process.env.MONGO_HOST || 'timber-mongo',
    port: process.env.MONGO_PORT || 27017,
    databaseName: process.env.DB_NAME || 'merkle_tree',
    admin: 'admin',
    adminPassword: 'admin',
    dbUrl: process.env.DB_URL || 'mongodb://admin:admin@timber-mongo:27017',
  },
  MONGO_URL: process.env.MONGO_URL || 'mongodb://admin:admin@zapp-mongo:27017',
  COMMITMENTS_DB: process.env.MONGO_NAME || 'zapp_db',
  COMMITMENTS_COLLECTION: 'commitments',
  isLoggerEnabled: true,
  // web3:
  deployer: {
    host: process.env.BLOCKCHAIN_HOST,
    port: process.env.BLOCKCHAIN_PORT,
  },
  // web3:
  web3: {
    url: process.env.RPC_URL,
    rpcUrl: process.env.RPC_URL,
    key: process.env.KEY,
    options: {
      defaultAccount: process.env.DEFAULT_ACCOUNT,
      defaultGas: process.env.DEFAULT_GAS,
      defaultGasPrice: process.env.DEFAULT_GAS_PRICE,
      reconnect: {
        auto: true,
        delay: 5000, // ms
        maxAttempts: 10,
        onTimeout: false
      },
      clientConfig: {
        // Useful to keep a connection alive
        keepalive: true,
        keepaliveInterval: 60000 // ms
      },
    },
  },
};
