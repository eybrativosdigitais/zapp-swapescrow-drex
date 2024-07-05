import fs from 'fs'
import config from 'config'
import GN from 'general-number'
import utils from 'zkp-utils'
import Web3 from './web3.mjs'
import logger from './logger.mjs'

import {
  scalarMult,
  compressStarlightKey,
  poseidonHash
} from './number-theory.mjs'

const web3 = Web3.connection()
const { generalise } = GN
const keyDb = '/app/orchestration/common/db/key.json'

var CacheContractInterface = new Map()
var CacheContractAddress = new Map()
var CacheContractMetadata = new Map()
var CacheContractInstance = new Map()

export const contractPath = (contractName) => {
  return `/app/build/contracts/${contractName}.json`
}

const { options } = config.web3

export async function getContractInterface (contractName) {
  if (CacheContractInterface.has(contractName)) {
    return CacheContractInterface.get(contractName)
  }
  const path = contractPath(contractName)
  const contractInterface = JSON.parse(fs.readFileSync(path, 'utf8'))
  // logger.debug('\ncontractInterface:', contractInterface);
  CacheContractInterface.set(contractName, contractInterface)
  return contractInterface
}

export async function getContractAddress (contractName) {
  if (CacheContractAddress.has(contractName)) {
    return CacheContractAddress.get(contractName)
  }
  const contractMetadata = await getContractMetadata(contractName)
  logger.silly('deployed address:', contractMetadata.address)
  CacheContractAddress.set(contractName, contractMetadata.address)
  return contractMetadata.address
}

export async function getContractMetadata (contractName) {
  if (CacheContractMetadata.has(contractName)) {
    return CacheContractMetadata.get(contractName)
  }
  let contractMetadata
  let errorCount = 0
  console.log('contract', 'getContractMetadata', 'trying to get the contract:', contractName, ' address')

  if (!contractMetadata) {
    while (errorCount < 25) {
      try {
        const contractInterface = await getContractInterface(contractName)
        const networkId = await web3.eth.net.getId()
        console.log('contract', 'getContractAddress', 'running at networkId:', networkId)
        if (
          contractInterface &&
          contractInterface.networks &&
          contractInterface.networks[networkId]
        ) {
          contractMetadata = contractInterface.networks[networkId]
        }
        if (contractMetadata === undefined) {
          throw new Error('Shield address was undefined')
        }
        if (contractMetadata) break
      } catch (err) {
        errorCount++
        console.error('contract', 'getContractMetadata', 'Unable to get a contract address: ', err.message)
        logger.warn('contract', 'getContractMetadata', 'Orchestrator will try again in 5 seconds')
        await new Promise((resolve) => setTimeout(() => resolve(), 5000))
      }
    }
  }
  CacheContractMetadata.set(contractName, contractMetadata)
  return contractMetadata
}

// returns a web3 contract instance
export async function getContractInstance (contractName, deployedAddress) {
  if (CacheContractInstance.has(contractName)) {
    return CacheContractInstance.get(contractName)
  }
  const contractInterface = await getContractInterface(contractName)
  if (!deployedAddress) {
    // eslint-disable-next-line no-param-reassign
    deployedAddress = await getContractAddress(contractName)
  }

  const contractInstance = deployedAddress
    ? new web3.eth.Contract(contractInterface.abi, deployedAddress, options)
    : new web3.eth.Contract(contractInterface.abi, null, options)
  // logger.silly('\ncontractInstance:', contractInstance);
  logger.info(`${contractName} Address: ${deployedAddress}`)
  CacheContractInstance.set(contractName, contractInstance)
  return contractInstance
}

async function registerKeyOnChain (contractName, publicKey, walletAddress) {
  const instance = await getContractInstance(contractName)
  const contractAddr = await getContractAddress(contractName)
  const onChainKey = await instance.methods.zkpPublicKeys(walletAddress).call({ from: walletAddress })
  if (onChainKey !== generalise(publicKey).integer) {
    console.log('registerKeyOnChain - onChainKey !== generalise(publicKey).integer', onChainKey, generalise(publicKey).integer)
    const txData = await instance.methods.registerZKPPublicKey(generalise(publicKey).integer).encodeABI()
    const txParams = {
      from: walletAddress,
      to: contractAddr,
      gas: config.web3.options.defaultGas,
      gasPrice: config.web3.options.defaultGasPrice,
      data: txData,
      chainId: await web3.eth.net.getId()
    }
    const key = config.web3.key
    const signed = await web3.eth.accounts.signTransaction(txParams, key)
    console.log('tx signed')
    const tx = await web3.eth.sendSignedTransaction(signed.rawTransaction)
    console.log('sendSignedTransaction', tx)
  }
}

function registerKeyPairDisk (_secretKey) {
  let secretKey = generalise(_secretKey)
  let publicKeyPoint = generalise(
    scalarMult(secretKey.hex(32), config.BABYJUBJUB.GENERATOR)
  )
  let publicKey = compressStarlightKey(publicKeyPoint)
  while (publicKey === null) {
    logger.warn('your secret key created a large public key - resetting')
    secretKey = generalise(utils.randomHex(31))
    publicKeyPoint = generalise(
      scalarMult(secretKey.hex(32), config.BABYJUBJUB.GENERATOR)
    )
    publicKey = compressStarlightKey(publicKeyPoint)
  }
  const keyJson = {
    secretKey: secretKey.integer,
    publicKey: publicKey.integer
  }
  fs.writeFileSync(keyDb, JSON.stringify(keyJson, null, 4))
  console.log(keyJson)
  return keyJson
}

export async function registerKey (
  _secretKey,
  contractName,
  registerWithContract
) {
  let keys
  console.log('started register key')
  if (!fs.existsSync(keyDb)) {
    console.log('no keyDb found. creating key pair')
    keys = registerKeyPairDisk(_secretKey)
  } else {
    console.log('keyDb found. reading key pair')
    keys = JSON.parse(fs.readFileSync(keyDb, 'utf8'))
  }
  console.log('registerWithContract', registerWithContract)
  if (registerWithContract) {
    console.log('registering key pair onchain', keys.publicKey, config.web3.options.defaultAccount)
    await registerKeyOnChain(contractName, keys.publicKey, config.web3.options.defaultAccount)
  }

  return generalise(keys.publicKey)
}
