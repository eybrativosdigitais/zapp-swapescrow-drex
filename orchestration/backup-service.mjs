/* eslint-disable camelcase, prefer-const, no-unused-vars */
import fs from 'fs'
import GN from 'general-number'
import utils from 'zkp-utils'
import config from 'config'
import { decodeCommitmentData, decryptBackupDataWithKeys } from './common/backupData.mjs'
import { getContractInstance, getContractMetadata, registerKey } from './common/contract.mjs'
import { formatCommitment, persistCommitment } from './common/commitment-storage.mjs'
const { generalise } = GN

export class BackupService {

  constructor () {  }

  async init () {
    this.instance = await getContractInstance('SwapShield')
    this.contractMetadata = await getContractMetadata('SwapShield')
    this.contractAddr = this.contractMetadata.address
    this.keyDb = '/app/orchestration/common/db/key.json'
    this.ethAddress = generalise(config.web3.options.defaultAccount)
    // Read dbs for keys and previous commitment values:
    if (!fs.existsSync(this.keyDb)) { await registerKey(utils.randomHex(31), 'SwapShield', true) }
    const { secretKey, publicKey } = JSON.parse(
      fs.readFileSync(this.keyDb, 'utf-8', (err) => {
        console.error('backup-service - init - error:', err)
        return
      })
    )
    this.secretKey = generalise(secretKey)
    this.publicKey = generalise(publicKey)
  }

  async performBackup () {
    const backupData = await this.fetchBackupData()
    await this.saveBackupData(backupData)  
  }

  async fetchBackupData () {
    if (!this.instance) {
      await this.init()
    }
    const instance = this.instance
    const eventName = 'BackupData'
    const eventJsonInterface = this.instance._jsonInterface.find(
      o => o.name === eventName && o.type === 'event'
    )
    console.log('fetchBackupData - Getting data from past events. This can take a while...')
    const backupEvents = await instance.getPastEvents('BackupData', {
      fromBlock: this.contractMetadata.blockNumber || 1,
      topics: [eventJsonInterface.signature, this.ethAddress.hex(32)]
    })
    console.log('fetchBackupData - Getting nullifiers. This can take a while...')
    const nullifierEvents = await instance.getPastEvents('Nullifiers', {
      fromBlock: this.contractMetadata.blockNumber || 1
    })
    console.log('fetchBackupData - nullifiers collected.')

    const nullifiers = nullifierEvents
      .flatMap(e => e.returnValues.nullifiers)

    console.log('fetchBackupData - start to decryptBackupData, decodeCommitmentData, formatCommitment ...')
    return Promise.all(
      backupEvents
        .map(e => decryptBackupDataWithKeys(e.returnValues.cipherText, this.publicKey, this.secretKey))
        .map(decodeCommitmentData)
        .filter(c => c)
        .map(formatCommitment)
        .map(c => {
          c.isNullified = nullifiers.includes(BigInt(c.nullifier).toString())
          return c
        })
    )
  }

  async saveBackupData (allCommitments) {
    console.log('saveBackupData - start to save', allCommitments.length, 'commitments')
    var totalCommitments = allCommitments.length
    allCommitments.map(async commit => {
      try {
        await persistCommitment(commit)        
      } catch (e) {
        if (e.toString().includes('E11000 duplicate key')) {
          // console.log('saveBackupData - Commitment already exists. Thats fine.')
        } else {
          console.error('saveBackupData - Error saving commitment', e)
          return
        }
      }
      totalCommitments = totalCommitments - 1
      if (totalCommitments == 0) {
        console.log('saveBackupData - operation completed. ', allCommitments.length, 'commitments restored.')
      }
    })
  }
}
