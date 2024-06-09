import GN from 'general-number'
import fs from 'fs'
import { encrypt, decrypt, decompressStarlightKey } from './number-theory.mjs'
import config from 'config'

const { generalise } = GN

const dictName = {
  0: 'balances',
  1: 'tokenOwners',
  2: 'swapProposals',
  balances: 0,
  tokenOwners: 1,
  swapProposals: 2
}

var CacheBackupKeysSecretKey = null
var CacheBackupKeysPublicKey = null

function getKeys () {
  if (CacheBackupKeysPublicKey) {
    return { secretKey: CacheBackupKeysSecretKey, publicKey: CacheBackupKeysPublicKey }
  }
  const keyDb = '/app/orchestration/common/db/key.json'
  const keys = JSON.parse(
    fs.readFileSync(keyDb, 'utf-8', (err) => {
      console.log(err)
    })
  )
  CacheBackupKeysSecretKey = generalise(keys.secretKey)
  CacheBackupKeysPublicKey = generalise(keys.publicKey)
  return { secretKey: CacheBackupKeysSecretKey, publicKey: CacheBackupKeysPublicKey }
}

function encryptBackupData (data) {
  const { secretKey, publicKey } = getKeys()  
  const backUpData = encrypt(data, secretKey.integer,
    [
      decompressStarlightKey(
        publicKey
      )[0].integer,
      decompressStarlightKey(
        publicKey
      )[1].integer
    ]
  )
  return backUpData
}

function decryptBackupData (data) {
  const backUpData = decrypt(data, generalise(config.web3.key).integer,
    [
      decompressStarlightKey(
        config.options.defaultAccount
      )[0].integer,
      decompressStarlightKey(
        config.options.defaultAccount
      )[1].integer
    ]
  )
  return backUpData
}

function decryptBackupDataWithKeys(data, pubKey, secretKey) {
  return decrypt(
    data,
    secretKey.integer,
    [
      decompressStarlightKey(
        pubKey
      )[0].integer,
      decompressStarlightKey(
        pubKey
      )[1].integer
    ]
  )
}

function decodeCommitmentData (data) {
  const [
    hash,
    nameEnum,
    mappingKey,
    secretKey,
    isNullifiedNumber,
    stateVarId,
    salt,
    publicKey,
    ...tail
  ] = data
  const isNullified = isNullifiedNumber === 1
  const name = dictName[nameEnum]
  if (!name) {
    console.log('Decoding unexpected values. Decrypt probably didnt work.')
    return null
  }
  if (name === "balances" || name === "tokenOwners") {
    const [value] = tail
    const res = generalise({
      hash,
      preimage: {
        stateVarId,
        value,
        salt,
        publicKey
      },
      secretKey
    })
    res.name = name
    res.mappingKey = generalise(mappingKey).integer
    res.isNullified = isNullified
    return res
  }
  const [
    swapAmountSent,
    swapAmountRecieved,
    swapTokenSentId,
    swapTokenSentAmount,
    swapTokenRecievedId,
    swapTokenRecievedAmount,
    swapId,
    swapSender,
    swapReciever,
    erc20AddressSent,
    erc20AddressRecieved,
    pendingStatus
  ] = tail
  const res = generalise({
    hash,
    preimage: {
      stateVarId,
      value: {
        swapAmountSent,
        swapAmountRecieved,
        swapTokenSentId,
        swapTokenSentAmount,
        swapTokenRecievedId,
        swapTokenRecievedAmount,
        swapId,
        swapSender,
        swapReciever,
        erc20AddressSent,
        erc20AddressRecieved,
        pendingStatus
      },
      salt,
      publicKey
    },
    secretKey
  })
  res.name = name
  res.mappingKey = generalise(mappingKey).integer
  res.isNullified = isNullified
  return res
}

function encodeCommitmentData (commitment) {
  const {
    hash,
    name,
    mappingKey,
    preimage,
    secretKey,
    isNullified
  } = commitment
  const plainData = [
    hash.integer,
    dictName[name],
    mappingKey,
    secretKey ? secretKey.integer : 0,
    isNullified ? 1 : 0,
    preimage.stateVarId.integer,
    preimage.salt.integer,
    preimage.publicKey.integer
  ]

  if (name === 'balances' || name === 'tokenOwners') {
    plainData.push(preimage.value.integer)
  } else {
    const {
      swapAmountSent,
      swapAmountRecieved,
      swapTokenSentId,
      swapTokenSentAmount,
      swapTokenRecievedId,
      swapTokenRecievedAmount,
      swapId,
      swapSender,
      swapReciever,
      erc20AddressSent,
      erc20AddressRecieved,
      pendingStatus
    } = commitment.preimage.value
    plainData.push(
      swapAmountSent.integer,
      swapAmountRecieved.integer,
      swapTokenSentId.integer,
      swapTokenSentAmount.integer,
      swapTokenRecievedId.integer,
      swapTokenRecievedAmount.integer,
      swapId.integer,
      swapSender.integer,
      swapReciever.integer,
      erc20AddressSent.integer,
      erc20AddressRecieved.integer,
      pendingStatus.integer
    )
  }
  return plainData
}

export {
  encodeCommitmentData,
  decodeCommitmentData,
  encryptBackupData,
  decryptBackupData,
  decryptBackupDataWithKeys
}
