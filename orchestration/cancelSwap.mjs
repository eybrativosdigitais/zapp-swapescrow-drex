/* eslint-disable camelcase, prefer-const, no-unused-vars */
import config from 'config'
import utils from 'zkp-utils'
import GN from 'general-number'
import fs from 'fs'

import {
  getContractInstance,
  getContractAddress,
  registerKey
} from './common/contract.mjs'
import {
  storeCommitment,
  getCurrentWholeCommitment,
  getCommitmentsById,
  getAllCommitments,
  getInputCommitments,
  joinCommitments,
  splitCommitments,
  markNullified,
  getnullifierMembershipWitness,
  getupdatedNullifierPaths,
  temporaryUpdateNullifier,
  updateNullifierTree,
  getSharedSecretskeys
} from './common/commitment-storage.mjs'
import { generateProof } from './common/zokrates.mjs'
import { getMembershipWitness, getRoot } from './common/timber.mjs'
import { encodeCommitmentData, encryptBackupData } from './common/backupData.mjs'
import Web3 from './common/web3.mjs'
import {
  poseidonHash
} from './common/number-theory.mjs'

const { generalise } = GN
const db = '/app/orchestration/common/db/preimage.json'
const keyDb = '/app/orchestration/common/db/key.json'

export class CancelSwapManager {
  constructor (web3) {
    this.web3 = web3
  }

  async init () {
    this.instance = await getContractInstance('SwapShield')
    this.contractAddr = await getContractAddress('SwapShield')
  }

  async cancelSwap (
    _swapId,
    _balances_msgSender_erc20Address_newOwnerPublicKey = 0,
    _tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey = 0,
    _swapProposals_swapId_newOwnerPublicKey = 0
  ) {
    // Initialisation of variables:

    const instance = this.instance

    const contractAddr = this.contractAddr
    const web3 = this.web3

    const msgSender = generalise(config.web3.options.defaultAccount)

    const msgValue = 0
    const swapId = generalise(_swapId)
    let balances_msgSender_erc20Address_newOwnerPublicKey = generalise(
      _balances_msgSender_erc20Address_newOwnerPublicKey
    )
    let tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey = generalise(
      _tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey
    )
    let swapProposals_swapId_newOwnerPublicKey = generalise(
      _swapProposals_swapId_newOwnerPublicKey
    )

    // Read dbs for keys and previous commitment values:

    if (!fs.existsSync(keyDb)) { await registerKey(utils.randomHex(31), 'SwapShield', true) }
    let keys = JSON.parse(
      fs.readFileSync(keyDb, 'utf-8', (err) => {
        console.log(err)
      })
    )
    const secretKey = generalise(keys.secretKey)
    const publicKey = generalise(keys.publicKey)
    let sharedSecretKey = 0
    let sharedPublicKey = 0

    // Initialise commitment preimage of whole state:

    let swapProposals_swapId_stateVarId = 47

    const swapProposals_swapId_stateVarId_key = swapId

    swapProposals_swapId_stateVarId = generalise(
      utils.mimcHash(
        [
          generalise(swapProposals_swapId_stateVarId).bigInt,
          swapProposals_swapId_stateVarId_key.bigInt
        ],
        'ALT_BN_254'
      )
    ).hex(32)

    let swapProposals_swapId_commitmentExists = true
    let swapProposals_swapId_witnessRequired = true

    const swapProposals_swapId_commitment = await getCurrentWholeCommitment(
      swapProposals_swapId_stateVarId
    )

    let swapProposals_swapId_preimage = {
      value: {
        swapReciever: 0,
        swapAmountRecieved: 0,
        swapAmountSent: 0,
        swapTokenSentId: 0,
        swapTokenSentAmount: 0,
        swapTokenRecievedId: 0,
        swapTokenRecievedAmount: 0,
        pendingStatus: 0,
        swapSender: 0,
        erc20AddressRecieved: 0,
        erc20AddressSent: 0,
        swapId: 0
      },
      salt: 0,
      commitment: 0
    }
    if (!swapProposals_swapId_commitment) {
      swapProposals_swapId_commitmentExists = false
      swapProposals_swapId_witnessRequired = false
    } else {
      swapProposals_swapId_preimage = swapProposals_swapId_commitment.preimage
    }

    let swapProposals_swapId = generalise(swapProposals_swapId_preimage.value)

    console.log('swapProposals_swapId :', swapProposals_swapId)

    let erc20Address = generalise(swapProposals_swapId.erc20AddressSent.integer)

    let tokenIdSent = generalise(parseInt(swapProposals_swapId.swapTokenSentId.integer, 10))

    let amountSent = generalise(parseInt(swapProposals_swapId.swapAmountSent.integer, 10))

    let tokenSentAmount = generalise(parseInt(
      swapProposals_swapId.swapTokenSentAmount.integer,
      10
    )
    )

    let counterParty = generalise(swapProposals_swapId.swapReciever.integer)
    let recipientPublicKey = await this.instance.methods.zkpPublicKeys(counterParty.hex(20)).call()
    recipientPublicKey = generalise(recipientPublicKey)

    if (recipientPublicKey.length === 0) {
      throw new Error('WARNING: Public key for given  eth address not found.')
    }
    sharedPublicKey = await getSharedSecretskeys(counterParty, recipientPublicKey)
    keys = JSON.parse(
      fs.readFileSync(keyDb, 'utf-8', (err) => {
        console.log(err)
      })
    )
    sharedSecretKey = generalise(keys.sharedSecretKey)
    sharedPublicKey = generalise(keys.sharedPublicKey)

    // read preimage for incremented state
    balances_msgSender_erc20Address_newOwnerPublicKey =
    _balances_msgSender_erc20Address_newOwnerPublicKey === 0
      ? publicKey
      : balances_msgSender_erc20Address_newOwnerPublicKey

    let balances_msgSender_erc20Address_stateVarId = 9

    const balances_msgSender_erc20Address_stateVarId_key = msgSender

    const balances_msgSender_erc20Address_stateVarId_valueKey = erc20Address

    balances_msgSender_erc20Address_stateVarId = generalise(
      utils.mimcHash(
        [
          generalise(balances_msgSender_erc20Address_stateVarId).bigInt,
          balances_msgSender_erc20Address_stateVarId_key.bigInt,
          balances_msgSender_erc20Address_stateVarId_valueKey.bigInt
        ],
        'ALT_BN_254'
      )
    ).hex(32)

    const balances_msgSender_erc20Address_newCommitmentValue = generalise(
      parseInt(amountSent.integer, 10)
    )

    // read preimage for incremented state
    tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey =
    _tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey === 0
      ? publicKey
      : tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey

    let tokenOwners_msgSender_tokenIdSent_stateVarId = 15

    const tokenOwners_msgSender_tokenIdSent_stateVarId_key = msgSender

    const tokenOwners_msgSender_tokenIdSent_stateVarId_valueKey = tokenIdSent

    tokenOwners_msgSender_tokenIdSent_stateVarId = generalise(
      utils.mimcHash(
        [
          generalise(tokenOwners_msgSender_tokenIdSent_stateVarId).bigInt,
          tokenOwners_msgSender_tokenIdSent_stateVarId_key.bigInt,
          tokenOwners_msgSender_tokenIdSent_stateVarId_valueKey.bigInt
        ],
        'ALT_BN_254'
      )
    ).hex(32)

    const tokenOwners_msgSender_tokenIdSent_newCommitmentValue = generalise(
      parseInt(tokenSentAmount.integer, 10)
    )

    // read preimage for whole state
    swapProposals_swapId_newOwnerPublicKey =
    _swapProposals_swapId_newOwnerPublicKey === 0
      ? sharedPublicKey
      : swapProposals_swapId_newOwnerPublicKey

    const swapProposals_swapId_currentCommitment = swapProposals_swapId_commitmentExists
      ? generalise(swapProposals_swapId_commitment._id)
      : generalise(0)
    const swapProposals_swapId_prev = generalise(
      swapProposals_swapId_preimage.value
    )
    const swapProposals_swapId_prevSalt = generalise(
      swapProposals_swapId_preimage.salt
    )

    // Extract set membership witness:

    // generate witness for whole state
    const swapProposals_swapId_emptyPath = new Array(32).fill(0)
    const swapProposals_swapId_witness = swapProposals_swapId_witnessRequired
      ? await getMembershipWitness(
        'SwapShield',
        swapProposals_swapId_currentCommitment.integer
      )
      : {
          index: 0,
          path: swapProposals_swapId_emptyPath,
          root: (await getRoot('SwapShield')) || 0
        }
    const swapProposals_swapId_index = generalise(
      swapProposals_swapId_witness.index
    )
    const swapProposals_swapId_root = generalise(
      swapProposals_swapId_witness.root
    )
    const swapProposals_swapId_path = generalise(
      swapProposals_swapId_witness.path
    ).all

    // increment would go here but has been filtered out

    // increment would go here but has been filtered out

    swapProposals_swapId.pendingStatus = generalise(2)

    swapProposals_swapId = generalise(swapProposals_swapId)

    // Calculate nullifier(s):

    let swapProposals_swapId_nullifier = swapProposals_swapId_commitmentExists
      ? poseidonHash([
        BigInt(swapProposals_swapId_stateVarId),
        BigInt(sharedSecretKey.hex(32)),
        BigInt(swapProposals_swapId_prevSalt.hex(32))
      ])
      : poseidonHash([
        BigInt(swapProposals_swapId_stateVarId),
        BigInt(generalise(0).hex(32)),
        BigInt(swapProposals_swapId_prevSalt.hex(32))
      ])

    swapProposals_swapId_nullifier = generalise(
      swapProposals_swapId_nullifier.hex(32)
    ) // truncate

    // Calculate commitment(s):

    const balances_msgSender_erc20Address_newSalt = generalise(
      utils.randomHex(31)
    )

    let balances_msgSender_erc20Address_newCommitment = poseidonHash([
      BigInt(balances_msgSender_erc20Address_stateVarId),
      BigInt(balances_msgSender_erc20Address_newCommitmentValue.hex(32)),
      BigInt(balances_msgSender_erc20Address_newOwnerPublicKey.hex(32)),
      BigInt(balances_msgSender_erc20Address_newSalt.hex(32))
    ])

    balances_msgSender_erc20Address_newCommitment = generalise(
      balances_msgSender_erc20Address_newCommitment.hex(32)
    ) // truncate

    const tokenOwners_msgSender_tokenIdSent_newSalt = generalise(
      utils.randomHex(31)
    )

    let tokenOwners_msgSender_tokenIdSent_newCommitment = poseidonHash([
      BigInt(tokenOwners_msgSender_tokenIdSent_stateVarId),
      BigInt(tokenOwners_msgSender_tokenIdSent_newCommitmentValue.hex(32)),
      BigInt(tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey.hex(32)),
      BigInt(tokenOwners_msgSender_tokenIdSent_newSalt.hex(32))
    ])

    tokenOwners_msgSender_tokenIdSent_newCommitment = generalise(
      tokenOwners_msgSender_tokenIdSent_newCommitment.hex(32)
    ) // truncate

    swapProposals_swapId.swapAmountSent = swapProposals_swapId.swapAmountSent
      ? swapProposals_swapId.swapAmountSent
      : swapProposals_swapId_prev.swapAmountSent
    swapProposals_swapId.swapAmountRecieved = swapProposals_swapId.swapAmountRecieved
      ? swapProposals_swapId.swapAmountRecieved
      : swapProposals_swapId_prev.swapAmountRecieved
    swapProposals_swapId.swapTokenSentId = swapProposals_swapId.swapTokenSentId
      ? swapProposals_swapId.swapTokenSentId
      : swapProposals_swapId_prev.swapTokenSentId
    swapProposals_swapId.swapTokenSentAmount = swapProposals_swapId.swapTokenSentAmount
      ? swapProposals_swapId.swapTokenSentAmount
      : swapProposals_swapId_prev.swapTokenSentAmount
    swapProposals_swapId.swapTokenRecievedId = swapProposals_swapId.swapTokenRecievedId
      ? swapProposals_swapId.swapTokenRecievedId
      : swapProposals_swapId_prev.swapTokenRecievedId
    swapProposals_swapId.swapTokenRecievedAmount = swapProposals_swapId.swapTokenRecievedAmount
      ? swapProposals_swapId.swapTokenRecievedAmount
      : swapProposals_swapId_prev.swapTokenRecievedAmount
    swapProposals_swapId.swapId = swapProposals_swapId.swapId
      ? swapProposals_swapId.swapId
      : swapProposals_swapId_prev.swapId
    swapProposals_swapId.swapSender = swapProposals_swapId.swapSender
      ? swapProposals_swapId.swapSender
      : swapProposals_swapId_prev.swapSender
    console.log(swapProposals_swapId.swapSender.integer)
    swapProposals_swapId.swapReciever = swapProposals_swapId.swapReciever
      ? swapProposals_swapId.swapReciever
      : swapProposals_swapId_prev.swapReciever
    swapProposals_swapId.erc20AddressSent = swapProposals_swapId.erc20AddressSent
      ? swapProposals_swapId.erc20AddressSent
      : swapProposals_swapId_prev.erc20AddressSent
    swapProposals_swapId.erc20AddressRecieved = swapProposals_swapId.erc20AddressRecieved
      ? swapProposals_swapId.erc20AddressRecieved
      : swapProposals_swapId_prev.erc20AddressRecieved
    swapProposals_swapId.pendingStatus = swapProposals_swapId.pendingStatus
      ? swapProposals_swapId.pendingStatus
      : swapProposals_swapId_prev.pendingStatus

    const swapProposals_swapId_newSalt = generalise(utils.randomHex(31))

    let swapProposals_swapId_newCommitment = poseidonHash([
      BigInt(swapProposals_swapId_stateVarId),
      BigInt(swapProposals_swapId.swapAmountSent.hex(32)),
      BigInt(swapProposals_swapId.swapAmountRecieved.hex(32)),
      BigInt(swapProposals_swapId.swapTokenSentId.hex(32)),
      BigInt(swapProposals_swapId.swapTokenSentAmount.hex(32)),
      BigInt(swapProposals_swapId.swapTokenRecievedId.hex(32)),
      BigInt(swapProposals_swapId.swapTokenRecievedAmount.hex(32)),
      BigInt(swapProposals_swapId.swapId.hex(32)),
      BigInt(swapProposals_swapId.swapSender.hex(32)),
      BigInt(swapProposals_swapId.swapReciever.hex(32)),
      BigInt(swapProposals_swapId.erc20AddressSent.hex(32)),
      BigInt(swapProposals_swapId.erc20AddressRecieved.hex(32)),
      BigInt(swapProposals_swapId.pendingStatus.hex(32)),
      BigInt(swapProposals_swapId_newOwnerPublicKey.hex(32)),
      BigInt(swapProposals_swapId_newSalt.hex(32))
    ])

    swapProposals_swapId_newCommitment = generalise(
      swapProposals_swapId_newCommitment.hex(32)
    ) // truncate

    // Call Zokrates to generate the proof:

    const allInputs = [
      msgSender.integer,
      swapId.integer,

      balances_msgSender_erc20Address_newOwnerPublicKey.integer,
      balances_msgSender_erc20Address_newSalt.integer,
      balances_msgSender_erc20Address_newCommitment.integer,

      tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey.integer,
      tokenOwners_msgSender_tokenIdSent_newSalt.integer,
      tokenOwners_msgSender_tokenIdSent_newCommitment.integer,

      swapProposals_swapId_commitmentExists
        ? sharedSecretKey.integer
        : generalise(0).integer,

      swapProposals_swapId_nullifier.integer,

      swapProposals_swapId_prev.swapAmountSent.integer,
      swapProposals_swapId_prev.swapAmountRecieved.integer,
      swapProposals_swapId_prev.swapTokenSentId.integer,
      swapProposals_swapId_prev.swapTokenSentAmount.integer,
      swapProposals_swapId_prev.swapTokenRecievedId.integer,
      swapProposals_swapId_prev.swapTokenRecievedAmount.integer,
      swapProposals_swapId_prev.swapId.integer,
      swapProposals_swapId_prev.swapSender.integer,
      swapProposals_swapId_prev.swapReciever.integer,
      swapProposals_swapId_prev.erc20AddressSent.integer,
      swapProposals_swapId_prev.erc20AddressRecieved.integer,
      swapProposals_swapId_prev.pendingStatus.integer,
      swapProposals_swapId_prevSalt.integer,
      swapProposals_swapId_commitmentExists ? 0 : 1,
      swapProposals_swapId_root.integer,
      swapProposals_swapId_index.integer,
      swapProposals_swapId_path.integer,
      swapProposals_swapId_newOwnerPublicKey.integer,
      swapProposals_swapId_newSalt.integer,
      swapProposals_swapId_newCommitment.integer
    ].flat(Infinity)

    console.log(allInputs.join(' '))
    const res = await generateProof('cancelSwap', allInputs)
    const proof = generalise(Object.values(res.proof).flat(Infinity))
      .map((coeff) => coeff.integer)
      .flat(Infinity)

    const proposalCommit = {
      hash: swapProposals_swapId_newCommitment,
      name: 'swapProposals',
      mappingKey: swapProposals_swapId_stateVarId_key.integer,
      preimage: {
        stateVarId: generalise(swapProposals_swapId_stateVarId),
        value: {
          swapAmountSent: swapProposals_swapId.swapAmountSent,
          swapAmountRecieved: swapProposals_swapId.swapAmountRecieved,
          swapTokenSentId: swapProposals_swapId.swapTokenSentId,
          swapTokenSentAmount: swapProposals_swapId.swapTokenSentAmount,
          swapTokenRecievedId: swapProposals_swapId.swapTokenRecievedId,
          swapTokenRecievedAmount: swapProposals_swapId.swapTokenRecievedAmount,
          swapId: swapProposals_swapId.swapId,
          swapSender: swapProposals_swapId.swapSender,
          swapReciever: swapProposals_swapId.swapReciever,
          erc20AddressSent: swapProposals_swapId.erc20AddressSent,
          erc20AddressRecieved: swapProposals_swapId.erc20AddressRecieved,
          pendingStatus: swapProposals_swapId.pendingStatus
        },
        salt: swapProposals_swapId_newSalt,
        publicKey: swapProposals_swapId_newOwnerPublicKey
      },
      secretKey:
      swapProposals_swapId_newOwnerPublicKey.integer === sharedPublicKey.integer
        ? sharedSecretKey
        : null,
      isNullified: false
    }

    const backUpDataProposal = encryptBackupData(
      encodeCommitmentData(proposalCommit)
    )

    const tokensCommit = {
      hash: tokenOwners_msgSender_tokenIdSent_newCommitment,
      name: 'tokenOwners',
      mappingKey: tokenOwners_msgSender_tokenIdSent_stateVarId_key.integer,
      preimage: {
        stateVarId: generalise(tokenOwners_msgSender_tokenIdSent_stateVarId),
        value: tokenOwners_msgSender_tokenIdSent_newCommitmentValue,
        salt: tokenOwners_msgSender_tokenIdSent_newSalt,
        publicKey: tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey
      },
      secretKey:
      tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey.integer ===
      publicKey.integer
        ? secretKey
        : null,
      isNullified: false
    }
    const backUpDataTokens = encryptBackupData(
      encodeCommitmentData(tokensCommit)
    )

    const balancesCommit = {
      hash: balances_msgSender_erc20Address_newCommitment,
      name: 'balances',
      mappingKey: balances_msgSender_erc20Address_stateVarId_key.integer,
      preimage: {
        stateVarId: generalise(balances_msgSender_erc20Address_stateVarId),
        value: balances_msgSender_erc20Address_newCommitmentValue,
        salt: balances_msgSender_erc20Address_newSalt,
        publicKey: balances_msgSender_erc20Address_newOwnerPublicKey
      },
      secretKey:
      balances_msgSender_erc20Address_newOwnerPublicKey.integer ===
      publicKey.integer
        ? secretKey
        : null,
      isNullified: false
    }
    const backUpDataBalances = encryptBackupData(
      encodeCommitmentData(balancesCommit)
    )
    // Send transaction to the blockchain:

    const txData = await instance.methods
      .cancelSwap(
        [swapProposals_swapId_nullifier.integer],
        swapProposals_swapId_root.integer,
        [
          balances_msgSender_erc20Address_newCommitment.integer,
          tokenOwners_msgSender_tokenIdSent_newCommitment.integer,
          swapProposals_swapId_newCommitment.integer
        ],
        proof,
        [
          backUpDataBalances,
          backUpDataTokens,
          backUpDataProposal
        ]
      )
      .encodeABI()

    let txParams = {
      from: config.web3.options.defaultAccount,
      to: contractAddr,
      gas: config.web3.options.defaultGas,
      gasPrice: config.web3.options.defaultGasPrice,
      data: txData,
      chainId: await web3.eth.net.getId()
    }

    const key = config.web3.key

    const signed = await web3.eth.accounts.signTransaction(txParams, key)

    const sendTxn = await web3.eth.sendSignedTransaction(signed.rawTransaction)

    let tx = await instance.getPastEvents('NewLeaves')

    tx = tx[0]

    if (!tx) {
      throw new Error(
        'Tx failed - the commitment was not accepted on-chain, or the contract is not deployed.'
      )
    }

    let encEvent = ''

    try {
      encEvent = await instance.getPastEvents('EncryptedData')
    } catch (err) {
      console.log('No encrypted event')
    }

    // Write new commitment preimage to db:

    await storeCommitment(balancesCommit)

    await storeCommitment(tokensCommit)

    if (swapProposals_swapId_commitmentExists) {
      await markNullified(
        swapProposals_swapId_currentCommitment,
        sharedSecretKey.hex(32)
      )
    }

    // Else we always update it in markNullified

    await storeCommitment(proposalCommit)

    return { tx, encEvent }
  }
}
