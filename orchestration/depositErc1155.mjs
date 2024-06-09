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
  getCommitmentsWhere,
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
  updateNullifierTree
} from './common/commitment-storage.mjs'
import {
  encodeCommitmentData,
  encryptBackupData
} from './common/backupData.mjs'
import { generateProof } from './common/zokrates.mjs'
import { getMembershipWitness, getRoot } from './common/timber.mjs'
import Web3 from './common/web3.mjs'
import {
  poseidonHash
} from './common/number-theory.mjs'
import logger from './common/logger.mjs'

const { generalise } = GN
const db = '/app/orchestration/common/db/preimage.json'
const keyDb = '/app/orchestration/common/db/key.json'
const delay = function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export class DepositErc1155Manager {
  constructor (web3) {
    this.web3 = web3
  }

  async init () {
    this.instance = await getContractInstance('SwapShield')
    this.contractAddr = await getContractAddress('SwapShield')
  }

  async depositErc1155 (
    _erc1155Address,
    _amount,
    _tokenId,
    _tokenOwners_msgSender_tokenId_newOwnerPublicKey = 0
  ) {
    // Initialisation of variables:
    const msgValue = 0
    const msgSender = generalise(config.web3.options.defaultAccount)
    const erc1155Address = generalise(_erc1155Address)
    const amount = generalise(_amount)
    const tokenId = generalise(_tokenId)
    let tokenOwners_msgSender_tokenId_newOwnerPublicKey = generalise(
      _tokenOwners_msgSender_tokenId_newOwnerPublicKey
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

    // read preimage for incremented state
    tokenOwners_msgSender_tokenId_newOwnerPublicKey =
    _tokenOwners_msgSender_tokenId_newOwnerPublicKey === 0
      ? publicKey
      : tokenOwners_msgSender_tokenId_newOwnerPublicKey

    let tokenOwners_msgSender_tokenId_stateVarId = 15

    const tokenOwners_msgSender_tokenId_stateVarId_key = msgSender

    const tokenOwners_msgSender_tokenId_stateVarId_valueKey = tokenId

    tokenOwners_msgSender_tokenId_stateVarId = generalise(
      utils.mimcHash(
        [
          generalise(tokenOwners_msgSender_tokenId_stateVarId).bigInt,
          tokenOwners_msgSender_tokenId_stateVarId_key.bigInt,
          tokenOwners_msgSender_tokenId_stateVarId_valueKey.bigInt
        ],
        'ALT_BN_254'
      )
    ).hex(32)

    const tokenOwners_msgSender_tokenId_newCommitmentValue = generalise(
      parseInt(amount.integer, 10)
    )

    // non-secret line would go here but has been filtered out

    // non-secret line would go here but has been filtered out

    // increment would go here but has been filtered out

    // Calculate commitment(s):

    const tokenOwners_msgSender_tokenId_newSalt = generalise(utils.randomHex(31))

    let tokenOwners_msgSender_tokenId_newCommitment = poseidonHash([
      BigInt(tokenOwners_msgSender_tokenId_stateVarId),
      BigInt(tokenOwners_msgSender_tokenId_newCommitmentValue.hex(32)),
      BigInt(tokenOwners_msgSender_tokenId_newOwnerPublicKey.hex(32)),
      BigInt(tokenOwners_msgSender_tokenId_newSalt.hex(32))
    ])

    tokenOwners_msgSender_tokenId_newCommitment = generalise(
      tokenOwners_msgSender_tokenId_newCommitment.hex(32)
    ) // truncate

    const commitmentDoc = {
      hash: tokenOwners_msgSender_tokenId_newCommitment,
      name: 'tokenOwners',
      mappingKey: tokenOwners_msgSender_tokenId_stateVarId_key.integer,
      preimage: {
        stateVarId: generalise(tokenOwners_msgSender_tokenId_stateVarId),
        value: tokenOwners_msgSender_tokenId_newCommitmentValue,
        salt: tokenOwners_msgSender_tokenId_newSalt,
        publicKey: tokenOwners_msgSender_tokenId_newOwnerPublicKey
      },
      secretKey:
      tokenOwners_msgSender_tokenId_newOwnerPublicKey.integer ===
      publicKey.integer
        ? secretKey
        : null,
      isNullified: false
    }

    const plainTextCommitments = encodeCommitmentData(commitmentDoc)

    const backUpData = encryptBackupData(plainTextCommitments)

    // Call Zokrates to generate the proof:

    const allInputs = [
      amount.integer,
      tokenId.integer,
      msgSender.integer,
      tokenOwners_msgSender_tokenId_newOwnerPublicKey.integer,
      tokenOwners_msgSender_tokenId_newSalt.integer,
      tokenOwners_msgSender_tokenId_newCommitment.integer
    ].flat(Infinity)
    const res = await generateProof('depositErc1155', allInputs)
    const proof = generalise(Object.values(res.proof).flat(Infinity))
      .map((coeff) => coeff.integer)
      .flat(Infinity)

    // Send transaction to the blockchain:

    const txData = await this.instance.methods
      .depositErc1155(
        _erc1155Address,
        amount.integer,
        tokenId.integer,
        [tokenOwners_msgSender_tokenId_newCommitment.integer],
        proof,
        [backUpData]
      )
      .encodeABI()

    let txParams = {
      from: config.web3.options.defaultAccount,
      to: this.contractAddr,
      gas: config.web3.options.defaultGas,
      gasPrice: config.web3.options.defaultGasPrice,
      data: txData,
      chainId: await this.web3.eth.net.getId()
    }

    const key = config.web3.key

    const signed = await this.web3.eth.accounts.signTransaction(txParams, key)

    const sendTxnReceipt = await this.web3.eth.sendSignedTransaction(signed.rawTransaction)
    if (!sendTxnReceipt.status) {
      console.error('depositErc1155', 'sendTxnReceipt:', sendTxnReceipt)
      throw new Error('depositErc1155 - sendTxnReceipt.status is false')
    }

    let tx
    for (let maxGetEventAttempts = 5; maxGetEventAttempts > 0; maxGetEventAttempts--) {
      tx = await this.instance.getPastEvents('NewLeaves')
      tx = tx[0]
      if (tx) {
        break
      }
      await delay(1000)
    }
    if (!tx) {
      throw new Error(
        'depositErc1155 - Tx is undefined. Or the commitment was not accepted on-chain, or the orchestrator was not able to get the past events.'
      )
    }

    let encEvent = ''

    try {
      encEvent = await this.instance.getPastEvents('EncryptedData')
    } catch (err) {
      console.log('No encrypted event')
    }

    // Write new commitment preimage to db:

    const insertedDocument = await storeCommitment(commitmentDoc)

    if (!insertedDocument.acknowledged) {
      logger.error('Commitment not inserted')
    }

    const [commitment] = await getCommitmentsWhere({ _id: insertedDocument.insertedId })
    return { tx, encEvent, commitment }
  }
}
