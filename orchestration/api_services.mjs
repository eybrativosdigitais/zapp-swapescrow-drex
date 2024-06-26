/* eslint-disable camelcase, prefer-const, no-unused-vars */
import { WithdrawErc1155Manager } from './withdrawErc1155.mjs'

import { WithdrawErc20Manager } from './withdrawErc20.mjs'

import { CancelSwapManager } from './cancelSwap.mjs'

import { BackupService } from './backup-service.mjs'

import { CompleteSwapFromErc1155ToErc1155Manager } from './completeSwapFromErc1155ToErc1155.mjs'

import { CompleteSwapFromErc20ToErc20Manager } from './completeSwapFromErc20ToErc20.mjs'

import { CompleteSwapFromErc1155ToErc20Manager } from './completeSwapFromErc1155ToErc20.mjs'

import { CompleteSwapFromErc20ToErc1155Manager } from './completeSwapFromErc20ToErc1155.mjs'

import { StartSwapFromErc1155ToErc20Manager } from './startSwapFromErc1155ToErc20.mjs'

import { StartSwapFromErc1155ToErc1155Manager } from './startSwapFromErc1155ToErc1155.mjs'

import { StartSwapFromErc20ToErc20Manager } from './startSwapFromErc20ToErc20.mjs'

import { StartSwapFromErc20ToErc1155Manager } from './startSwapFromErc20ToErc1155.mjs'

import { DepositErc1155Manager } from './depositErc1155.mjs'

import { DepositErc20Manager } from './depositErc20.mjs'

import { startEventFilter } from './common/timber.mjs'
import logger from './common/logger.mjs'
import {
  getAllCommitments,
  getBalance,
  getBalanceByState,
  getCommitmentsByState,
  getCommitmentsWhere,
  getSharedSecretskeys,
  reinstateNullifiers
} from './common/commitment-storage.mjs'
import web3 from './common/web3.mjs'
import { getContractInstance, getContractMetadata } from './common/contract.mjs'
import axios from 'axios'
import { generalise } from 'general-number'
import parseCommitments from './common/parseCommitments.js'
import formatCommitments from './common/format-commitments.mjs'
import { EncryptedDataEventListener } from './encrypted-data-listener.mjs'
import {
  hasERC1155Approval,
  hasShieldedERC1155Balance,
  hasERC20Allowance,
  hasShieldedERC20Balance,
  hasERC20Balance, hasERC1155Balance
} from './common/validateBalance.mjs'
import { ZeroAddress } from './common/constants.mjs'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let leafIndex
let encryption = {}

export class ServiceManager {
  constructor (web3) {
    this.web3 = web3
    this.depositErc20 = new DepositErc20Manager(web3)
    this.depositErc1155 = new DepositErc1155Manager(web3)
    this.withdrawErc1155 = new WithdrawErc1155Manager(web3)
    this.withdrawErc20 = new WithdrawErc20Manager(web3)
    this.startSwapFromErc1155ToErc1155 = new StartSwapFromErc1155ToErc1155Manager(web3)
    this.startSwapFromErc20ToErc1155 = new StartSwapFromErc20ToErc1155Manager(web3)
    this.startSwapFromErc1155ToErc20 = new StartSwapFromErc1155ToErc20Manager(web3)
    this.startSwapFromErc20ToErc20 = new StartSwapFromErc20ToErc20Manager(web3)
    this.completeSwapFromErc1155ToErc1155 = new CompleteSwapFromErc1155ToErc1155Manager(web3)
    this.completeSwapFromErc1155ToErc20 = new CompleteSwapFromErc1155ToErc20Manager(web3)
    this.completeSwapFromErc20ToErc1155 = new CompleteSwapFromErc20ToErc1155Manager(web3)
    this.completeSwapFromErc20ToErc20 = new CompleteSwapFromErc20ToErc20Manager(web3)
    this.cancelSwap = new CancelSwapManager(web3)
    this.backupData = new BackupService()
  }

  async init () {
    await this.depositErc20.init()
    await this.depositErc1155.init()
    await this.startSwapFromErc1155ToErc1155.init()
    await this.startSwapFromErc1155ToErc20.init()
    await this.startSwapFromErc20ToErc1155.init()
    await this.startSwapFromErc20ToErc20.init()
    await this.withdrawErc1155.init()
    await this.withdrawErc20.init()
    await this.completeSwapFromErc1155ToErc1155.init()
    await this.completeSwapFromErc1155ToErc20.init()
    await this.completeSwapFromErc20ToErc1155.init()
    await this.completeSwapFromErc20ToErc20.init()
    await this.cancelSwap.init()
    await this.backupData.init()
  }

  /**
      NOTE: this is the api service file, if you need to call any function use the correct url and if Your input contract has two functions, add() and minus().
      minus() cannot be called before an initial add(). */

  // eslint-disable-next-line func-names

  // eslint-disable-next-line func-names
  async service_depositErc20 (req, res, next) {
    try {
      await startEventFilter('SwapShield')
      const { erc20Address } = req.body
      const { amount } = req.body
      const balances_msgSender_erc20Address_newOwnerPublicKey =
      req.body.balances_msgSender_erc20Address_newOwnerPublicKey || 0

      if (!await hasERC20Balance(erc20Address, amount)) {
        logger.warn('The account does not have enough funds to perform this operation.')
        return res.status(403).send('The account does not have enough funds to perform this operation.')
      }

      if (!await hasERC20Allowance(erc20Address, amount)) {
        const SwapShieldMetadata = await getContractMetadata('SwapShield')
        const swapShieldAddress =
          web3.connection().utils.isAddress(SwapShieldMetadata?.address) ? SwapShieldMetadata.address : ZeroAddress

        logger.warn(`Insufficient ERC20 approval. Please ensure you have approved enough ERC20 tokens for SwapEscrow: ${swapShieldAddress}.`)
        return res.status(403).send(`Insufficient ERC20 approval. Please ensure you have approved enough ERC20 tokens for SwapEscrow: ${swapShieldAddress}.`)
      }

      const { tx, encEvent, commitment } = await this.depositErc20.depositErc20(
        erc20Address,
        amount,
        balances_msgSender_erc20Address_newOwnerPublicKey
      )
      res.send({ tx, encEvent, commitment })
      // reassigns leafIndex to the index of the first commitment added by this function
      if (tx.event) {
        leafIndex = tx.returnValues[0]
        // prints the new leaves (commitments) added by this function call
        console.log('Merkle tree event returnValues:')
        console.log(tx.returnValues)
      }
      if (encEvent.event) {
        encryption.msgs = encEvent[0].returnValues[0]
        encryption.key = encEvent[0].returnValues[1]
        console.log('EncryptedMsgs:')
        console.log(encEvent[0].returnValues[0])
      }
      await sleep(10)
    } catch (err) {
      logger.error(err)
      return res.status(422).send({ errors: [err.message] })
    }
  }

  // eslint-disable-next-line func-names
  async service_depositErc1155 (req, res, next) {
    try {
      await startEventFilter('SwapShield')
      const { erc1155Address } = req.body
      const { amount } = req.body
      const { tokenId } = req.body
      const tokenOwners_msgSender_tokenId_newOwnerPublicKey =
      req.body.tokenOwners_msgSender_tokenId_newOwnerPublicKey || 0

      if (!await hasERC1155Balance(tokenId, amount)) {
        logger.warn('The account does not have enough funds to perform this operation.')
        return res.status(403).send('The account does not have enough funds to perform this operation.')
      }

      if (!await hasERC1155Approval()) {
        const SwapShieldMetadata = await getContractMetadata('SwapShield')
        const swapShieldAddress =
          web3.connection().utils.isAddress(SwapShieldMetadata?.address) ? SwapShieldMetadata.address : ZeroAddress

        logger.warn(`Insufficient ERC1155 approval. Please ensure you have approved ERC1155 tokens for SwapEscrow: ${swapShieldAddress}.`)
        return res.status(403).send(`Insufficient ERC1155 approval. Please ensure you have approved ERC1155 tokens for SwapEscrow: ${swapShieldAddress}.`)
      }

      const { tx, encEvent, commitment } = await this.depositErc1155.depositErc1155(
        erc1155Address,
        amount,
        tokenId,
        tokenOwners_msgSender_tokenId_newOwnerPublicKey
      )
      res.send({ tx, encEvent, commitment })
      // reassigns leafIndex to the index of the first commitment added by this function
      if (tx.event) {
        leafIndex = tx.returnValues[0]
        // prints the new leaves (commitments) added by this function call
        console.log('Merkle tree event returnValues:')
        console.log(tx.returnValues)
      }
      if (encEvent.event) {
        encryption.msgs = encEvent[0].returnValues[0]
        encryption.key = encEvent[0].returnValues[1]
        console.log('EncryptedMsgs:')
        console.log(encEvent[0].returnValues[0])
      }
      await sleep(10)
    } catch (err) {
      logger.error(err)
      return res.status(422).send({ errors: [err.message] })
    }
  }

  // eslint-disable-next-line func-names
  async service_startSwapFromErc20ToErc1155 (req, res, next) {
    try {
      await startEventFilter('SwapShield')
      const { erc20Address } = req.body
      const { counterParty } = req.body
      const { amountSent } = req.body
      const { tokenIdReceived } = req.body
      const { tokenReceivedAmount } = req.body
      const balances_msgSender_erc20Address_newOwnerPublicKey =
      req.body.balances_msgSender_erc20Address_newOwnerPublicKey || 0
      const swapProposals_swapIdCounter_1_newOwnerPublicKey =
      req.body.swapProposals_swapIdCounter_1_newOwnerPublicKey || 0

      if (!await hasShieldedERC20Balance(erc20Address, amountSent)) {
        logger.warn('The account does not have enough funds to perform this operation.')
        return res.status(403).send('The account does not have enough funds to perform this operation.')
      }

      const { tx, encEvent, commitment } = await this.startSwapFromErc20ToErc1155.startSwapFromErc20ToErc1155(
        erc20Address,
        counterParty,
        amountSent,
        tokenIdReceived,
        tokenReceivedAmount,
        balances_msgSender_erc20Address_newOwnerPublicKey,
        swapProposals_swapIdCounter_1_newOwnerPublicKey
      )
      res.send({ tx, encEvent, commitment })
      // reassigns leafIndex to the index of the first commitment added by this function
      if (tx.event) {
        leafIndex = tx.returnValues[0]
        // prints the new leaves (commitments) added by this function call
        console.log('Merkle tree event returnValues:')
        console.log(tx.returnValues)
      }
      if (encEvent.event) {
        encryption.msgs = encEvent[0].returnValues[0]
        encryption.key = encEvent[0].returnValues[1]
        console.log('EncryptedMsgs:')
        console.log(encEvent[0].returnValues[0])
      }
      await sleep(10)
    } catch (err) {
      logger.error(err)
      return res.status(422).send({ errors: [err.message] })
    }
  }

  // eslint-disable-next-line func-names
  async service_startSwapFromErc20ToErc20 (req, res, next) {
    try {
      await startEventFilter('SwapShield')
      const { erc20AddressSent } = req.body
      const { erc20AddressReceived } = req.body
      const { counterParty } = req.body
      const { amountSent } = req.body
      const { amountReceived } = req.body
      const balances_msgSender_erc20AddressSent_newOwnerPublicKey =
      req.body.balances_msgSender_erc20AddressSent_newOwnerPublicKey || 0
      const swapProposals_swapIdCounter_2_newOwnerPublicKey =
      req.body.swapProposals_swapIdCounter_2_newOwnerPublicKey || 0

      if (!await hasShieldedERC20Balance(erc20AddressSent, amountSent)) {
        logger.warn('The account does not have enough funds to perform this operation.')
        return res.status(403).send('The account does not have enough funds to perform this operation.')
      }

      const { tx, encEvent, commitment } = await this.startSwapFromErc20ToErc20.startSwapFromErc20ToErc20(
        erc20AddressSent,
        erc20AddressReceived,
        counterParty,
        amountSent,
        amountReceived,
        balances_msgSender_erc20AddressSent_newOwnerPublicKey,
        swapProposals_swapIdCounter_2_newOwnerPublicKey
      )
      res.send({ tx, encEvent, commitment })
      // reassigns leafIndex to the index of the first commitment added by this function
      if (tx.event) {
        leafIndex = tx.returnValues[0]
        // prints the new leaves (commitments) added by this function call
        console.log('Merkle tree event returnValues:')
        console.log(tx.returnValues)
      }
      if (encEvent.event) {
        encryption.msgs = encEvent[0].returnValues[0]
        encryption.key = encEvent[0].returnValues[1]
        console.log('EncryptedMsgs:')
        console.log(encEvent[0].returnValues[0])
      }
      await sleep(10)
    } catch (err) {
      logger.error(err)
      return res.status(422).send({ errors: [err.message] })
    }
  }

  // eslint-disable-next-line func-names
  async service_startSwapFromErc1155ToErc1155 (req, res, next) {
    try {
      await startEventFilter('SwapShield')
      const { counterParty } = req.body
      const { tokenIdSent } = req.body
      const { tokenSentAmount } = req.body
      const { tokenIdReceived } = req.body
      const { tokenReceivedAmount } = req.body
      const tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey =
      req.body.tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey || 0
      const swapProposals_swapIdCounter_3_newOwnerPublicKey =
      req.body.swapProposals_swapIdCounter_3_newOwnerPublicKey || 0

      if (!await hasShieldedERC1155Balance(tokenIdSent, tokenSentAmount)) {
        logger.warn('The account does not have enough funds to perform this operation.')
        return res.status(403).send('The account does not have enough funds to perform this operation.')
      }

      const { tx, encEvent, commitment } = await this.startSwapFromErc1155ToErc1155.startSwapFromErc1155ToErc1155(
        counterParty,
        tokenIdSent,
        tokenSentAmount,
        tokenIdReceived,
        tokenReceivedAmount,
        tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey,
        swapProposals_swapIdCounter_3_newOwnerPublicKey
      )
      res.send({ tx, encEvent, commitment })
      // reassigns leafIndex to the index of the first commitment added by this function
      if (tx.event) {
        leafIndex = tx.returnValues[0]
        // prints the new leaves (commitments) added by this function call
        console.log('Merkle tree event returnValues:')
        console.log(tx.returnValues)
      }
      if (encEvent.event) {
        encryption.msgs = encEvent[0].returnValues[0]
        encryption.key = encEvent[0].returnValues[1]
        console.log('EncryptedMsgs:')
        console.log(encEvent[0].returnValues[0])
      }
      await sleep(10)
    } catch (err) {
      logger.error(err)
      return res.status(422).send({ errors: [err.message] })
    }
  }

  // eslint-disable-next-line func-names
  async service_startSwapFromErc1155ToErc20 (req, res, next) {
    try {
      await startEventFilter('SwapShield')
      const { counterParty } = req.body
      const { tokenIdSent } = req.body
      const { tokenSentAmount } = req.body
      const { erc20Address } = req.body
      const { amountReceived } = req.body
      const tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey =
      req.body.tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey || 0
      const swapProposals_swapIdCounter_4_newOwnerPublicKey =
      req.body.swapProposals_swapIdCounter_4_newOwnerPublicKey || 0

      if (!await hasShieldedERC1155Balance(tokenIdSent, tokenSentAmount)) {
        logger.warn('The account does not have enough funds to perform this operation.')
        return res.status(403).send('The account does not have enough funds to perform this operation.')
      }

      const { tx, encEvent, commitment } = await this.startSwapFromErc1155ToErc20.startSwapFromErc1155ToErc20(
        counterParty,
        tokenIdSent,
        tokenSentAmount,
        erc20Address,
        amountReceived,
        tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey,
        swapProposals_swapIdCounter_4_newOwnerPublicKey
      )
      res.send({ tx, encEvent, commitment })
      // reassigns leafIndex to the index of the first commitment added by this function
      if (tx.event) {
        leafIndex = tx.returnValues[0]
        // prints the new leaves (commitments) added by this function call
        console.log('Merkle tree event returnValues:')
        console.log(tx.returnValues)
      }
      if (encEvent.event) {
        encryption.msgs = encEvent[0].returnValues[0]
        encryption.key = encEvent[0].returnValues[1]
        console.log('EncryptedMsgs:')
        console.log(encEvent[0].returnValues[0])
      }
      await sleep(10)
    } catch (err) {
      logger.error(err)
      return res.status(422).send({ errors: [err.message] })
    }
  }

  // eslint-disable-next-line func-names
  async service_completeSwapFromErc20ToErc1155 (req, res, next) {
    try {
      await startEventFilter('SwapShield')
      const { swapId } = req.body
      const balances_msgSender_erc20Address_newOwnerPublicKey =
      req.body.balances_msgSender_erc20Address_newOwnerPublicKey || 0
      const tokenOwners_counterParty_tokenIdSent_newOwnerPublicKey =
      req.body.tokenOwners_counterParty_tokenIdSent_newOwnerPublicKey || 0
      const tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey =
      req.body.tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey || 0
      const swapProposals_swapId_newOwnerPublicKey =
      req.body.swapProposals_swapId_newOwnerPublicKey || 0

      const [swapCommitment] = await getCommitmentsWhere({
        name: 'swapProposals',
        'preimage.value.swapId': swapId.toString()
      })

      if (!swapCommitment) {
        logger.warn(`Swap: "${swapId}" not found. Either it was not found or it was not synced yet.`)
        return res.status(404).send('Not found.')
      }

      const tokenId = swapCommitment.preimage.value.swapTokenRecievedId
      const swapAmount = swapCommitment.preimage.value.swapTokenRecievedAmount

      if (!await hasShieldedERC1155Balance(tokenId, swapAmount)) {
        logger.warn('The account does not have enough funds to perform this operation.')
        return res.status(403).send('The account does not have enough funds to perform this operation.')
      }

      const { tx, encEvent } = await this.completeSwapFromErc20ToErc1155.completeSwapFromErc20ToErc1155(
        swapId,
        balances_msgSender_erc20Address_newOwnerPublicKey,
        tokenOwners_counterParty_tokenIdSent_newOwnerPublicKey,
        tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey,
        swapProposals_swapId_newOwnerPublicKey
      )
      res.send({ tx, encEvent })
      // reassigns leafIndex to the index of the first commitment added by this function
      if (tx.event) {
        leafIndex = tx.returnValues[0]
        // prints the new leaves (commitments) added by this function call
        console.log('Merkle tree event returnValues:')
        console.log(tx.returnValues)
      }
      if (encEvent.event) {
        encryption.msgs = encEvent[0].returnValues[0]
        encryption.key = encEvent[0].returnValues[1]
        console.log('EncryptedMsgs:')
        console.log(encEvent[0].returnValues[0])
      }
      await sleep(10)
    } catch (err) {
      logger.error(err)
      return res.status(422).send({ errors: [err.message] })
    }
  }

  // eslint-disable-next-line func-names
  async service_completeSwapFromErc1155ToErc20 (req, res, next) {
    try {
      await startEventFilter('SwapShield')
      const { swapId } = req.body
      const balances_counterParty_erc20Address_newOwnerPublicKey =
      req.body.balances_counterParty_erc20Address_newOwnerPublicKey || 0
      const balances_msgSender_erc20Address_newOwnerPublicKey =
      req.body.balances_msgSender_erc20Address_newOwnerPublicKey || 0
      const tokenOwners_msgSender_tokenIdReceived_newOwnerPublicKey =
      req.body.tokenOwners_msgSender_tokenIdReceived_newOwnerPublicKey || 0
      const swapProposals_swapId_newOwnerPublicKey =
      req.body.swapProposals_swapId_newOwnerPublicKey || 0

      const [swapCommitment] = await getCommitmentsWhere({
        name: 'swapProposals',
        'preimage.value.swapId': swapId.toString()
      })

      if (!swapCommitment) {
        logger.warn(`Swap: "${swapId}" not found. Either it was not found or it was not synced yet.`)
        return res.status(404).send('Not found.')
      }
      const erc20Address = generalise(swapCommitment.preimage.value.erc20AddressSent).hex()
      const swapAmount = swapCommitment.preimage.value.swapAmountRecieved

      if (!await hasShieldedERC20Balance(erc20Address, swapAmount)) {
        logger.warn('The account does not have enough funds to perform this operation.')
        return res.status(403).send('The account does not have enough funds to perform this operation.')
      }

      const { tx, encEvent } = await this.completeSwapFromErc1155ToErc20.completeSwapFromErc1155ToErc20(
        swapId,
        balances_counterParty_erc20Address_newOwnerPublicKey,
        balances_msgSender_erc20Address_newOwnerPublicKey,
        tokenOwners_msgSender_tokenIdReceived_newOwnerPublicKey,
        swapProposals_swapId_newOwnerPublicKey
      )
      res.send({ tx, encEvent })
      // reassigns leafIndex to the index of the first commitment added by this function
      if (tx.event) {
        leafIndex = tx.returnValues[0]
        // prints the new leaves (commitments) added by this function call
        console.log('Merkle tree event returnValues:')
        console.log(tx.returnValues)
      }
      if (encEvent.event) {
        encryption.msgs = encEvent[0].returnValues[0]
        encryption.key = encEvent[0].returnValues[1]
        console.log('EncryptedMsgs:')
        console.log(encEvent[0].returnValues[0])
      }
      await sleep(10)
    } catch (err) {
      logger.error(err)
      return res.status(422).send({ errors: [err.message] })
    }
  }

  // eslint-disable-next-line func-names
  async service_completeSwapFromErc20ToErc20 (req, res, next) {
    try {
      await startEventFilter('SwapShield')
      const { swapId } = req.body
      const balances_counterParty_erc20AddressSent_newOwnerPublicKey =
      req.body.balances_counterParty_erc20AddressSent_newOwnerPublicKey || 0
      const balances_msgSender_erc20AddressSent_newOwnerPublicKey =
      req.body.balances_msgSender_erc20AddressSent_newOwnerPublicKey || 0
      const balances_msgSender_erc20AddressReceived_newOwnerPublicKey =
      req.body.balances_msgSender_erc20AddressReceived_newOwnerPublicKey || 0
      const swapProposals_swapId_newOwnerPublicKey =
      req.body.swapProposals_swapId_newOwnerPublicKey || 0

      const [swapCommitment] = await getCommitmentsWhere({
        name: 'swapProposals',
        'preimage.value.swapId': swapId.toString()
      })

      if (!swapCommitment) {
        logger.warn(`Swap: "${swapId}" not found. Either it was not found or it was not synced yet.`)
        return res.status(404).send('Not found.')
      }

      const erc20Address = generalise(swapCommitment.preimage.value.erc20AddressRecieved).hex()
      const swapAmount = swapCommitment.preimage.value.swapAmountRecieved

      if (!await hasShieldedERC20Balance(erc20Address, swapAmount)) {
        logger.warn('The account does not have enough funds to perform this operation.')
        return res.status(403).send('The account does not have enough funds to perform this operation.')
      }

      const { tx, encEvent } = await this.completeSwapFromErc20ToErc20.completeSwapFromErc20ToErc20(
        swapId,
        balances_counterParty_erc20AddressSent_newOwnerPublicKey,
        balances_msgSender_erc20AddressSent_newOwnerPublicKey,
        balances_msgSender_erc20AddressReceived_newOwnerPublicKey,
        swapProposals_swapId_newOwnerPublicKey
      )
      res.send({ tx, encEvent })
      // reassigns leafIndex to the index of the first commitment added by this function
      if (tx.event) {
        leafIndex = tx.returnValues[0]
        // prints the new leaves (commitments) added by this function call
        console.log('Merkle tree event returnValues:')
        console.log(tx.returnValues)
      }
      if (encEvent.event) {
        encryption.msgs = encEvent[0].returnValues[0]
        encryption.key = encEvent[0].returnValues[1]
        console.log('EncryptedMsgs:')
        console.log(encEvent[0].returnValues[0])
      }
      await sleep(10)
    } catch (err) {
      logger.error(err)
      return res.status(422).send({ errors: [err.message] })
    }
  }

  // eslint-disable-next-line func-names
  async service_completeSwapFromErc1155ToErc1155 (req, res, next) {
    try {
      await startEventFilter('SwapShield')
      const { swapId } = req.body
      const tokenOwners_msgSender_tokenIdReceived_newOwnerPublicKey =
      req.body.tokenOwners_msgSender_tokenIdReceived_newOwnerPublicKey || 0
      const tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey =
      req.body.tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey || 0
      const tokenOwners_counterParty_tokenIdSent_newOwnerPublicKey =
      req.body.tokenOwners_counterParty_tokenIdSent_newOwnerPublicKey || 0
      const swapProposals_swapId_newOwnerPublicKey =
      req.body.swapProposals_swapId_newOwnerPublicKey || 0

      const [swapCommitment] = await getCommitmentsWhere({
        name: 'swapProposals',
        'preimage.value.swapId': swapId.toString()
      })

      if (!swapCommitment) {
        logger.warn(`Swap: "${swapId}" not found. Either it was not found or it was not synced yet.`)
        return res.status(404).send('Not found.')
      }

      const tokenId = swapCommitment.preimage.value.swapTokenRecievedId
      const swapAmount = swapCommitment.preimage.value.swapTokenRecievedAmount

      if (!await hasShieldedERC1155Balance(tokenId, swapAmount)) {
        logger.warn('The account does not have enough funds to perform this operation.')
        return res.status(403).send('The account does not have enough funds to perform this operation.')
      }

      const { tx, encEvent } = await this.completeSwapFromErc1155ToErc1155.completeSwapFromErc1155ToErc1155(
        swapId,
        tokenOwners_msgSender_tokenIdReceived_newOwnerPublicKey,
        tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey,
        tokenOwners_counterParty_tokenIdSent_newOwnerPublicKey,
        swapProposals_swapId_newOwnerPublicKey
      )
      res.send({ tx, encEvent })
      // reassigns leafIndex to the index of the first commitment added by this function
      if (tx.event) {
        leafIndex = tx.returnValues[0]
        // prints the new leaves (commitments) added by this function call
        console.log('Merkle tree event returnValues:')
        console.log(tx.returnValues)
      }
      if (encEvent.event) {
        encryption.msgs = encEvent[0].returnValues[0]
        encryption.key = encEvent[0].returnValues[1]
        console.log('EncryptedMsgs:')
        console.log(encEvent[0].returnValues[0])
      }
      await sleep(10)
    } catch (err) {
      logger.error(err)
      return res.status(422).send({ errors: [err.message] })
    }
  }

  // eslint-disable-next-line func-names
  async service_cancelSwap (req, res, next) {
    try {
      await startEventFilter('SwapShield')
      const { swapId } = req.body
      const balances_msgSender_erc20Address_newOwnerPublicKey =
      req.body.balances_msgSender_erc20Address_newOwnerPublicKey || 0
      const tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey =
      req.body.tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey || 0
      const swapProposals_swapId_newOwnerPublicKey =
      req.body.swapProposals_swapId_newOwnerPublicKey || 0
      const { tx, encEvent } = await this.cancelSwap.cancelSwap(
        swapId,
        balances_msgSender_erc20Address_newOwnerPublicKey,
        tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey,
        swapProposals_swapId_newOwnerPublicKey
      )
      res.send({ tx, encEvent })
      // reassigns leafIndex to the index of the first commitment added by this function
      if (tx.event) {
        leafIndex = tx.returnValues[0]
        // prints the new leaves (commitments) added by this function call
        console.log('Merkle tree event returnValues:')
        console.log(tx.returnValues)
      }
      if (encEvent.event) {
        encryption.msgs = encEvent[0].returnValues[0]
        encryption.key = encEvent[0].returnValues[1]
        console.log('EncryptedMsgs:')
        console.log(encEvent[0].returnValues[0])
      }
      await sleep(10)
    } catch (err) {
      logger.error(err)
      return res.status(422).send({ errors: [err.message] })
    }
  }

  // eslint-disable-next-line func-names
  async service_withdrawErc20 (req, res, next) {
    try {
      await startEventFilter('SwapShield')
      const { erc20Address } = req.body
      const { amount } = req.body
      const balances_msgSender_erc20Address_newOwnerPublicKey =
      req.body.balances_msgSender_erc20Address_newOwnerPublicKey || 0
      const { tx, encEvent } = await this.withdrawErc20.withdrawErc20(
        erc20Address,
        amount,
        balances_msgSender_erc20Address_newOwnerPublicKey
      )
      res.send({ tx, encEvent })
      // reassigns leafIndex to the index of the first commitment added by this function
      if (tx.event) {
        leafIndex = tx.returnValues[0]
        // prints the new leaves (commitments) added by this function call
        console.log('Merkle tree event returnValues:')
        console.log(tx.returnValues)
      }
      if (encEvent.event) {
        encryption.msgs = encEvent[0].returnValues[0]
        encryption.key = encEvent[0].returnValues[1]
        console.log('EncryptedMsgs:')
        console.log(encEvent[0].returnValues[0])
      }
      await sleep(10)
    } catch (err) {
      logger.error(err)
      return res.status(422).send({ errors: [err.message] })
    }
  }

  // eslint-disable-next-line func-names
  async service_withdrawErc1155 (req, res, next) {
    try {
      await startEventFilter('SwapShield')
      const { erc1155Address } = req.body
      const { tokenId } = req.body
      const { amount } = req.body
      const tokenOwners_msgSender_tokenId_newOwnerPublicKey =
      req.body.tokenOwners_msgSender_tokenId_newOwnerPublicKey || 0
      const { tx, encEvent } = await this.withdrawErc1155.withdrawErc1155(
        erc1155Address,
        tokenId,
        amount,
        tokenOwners_msgSender_tokenId_newOwnerPublicKey
      )
      res.send({ tx, encEvent })
      // reassigns leafIndex to the index of the first commitment added by this function
      if (tx.event) {
        leafIndex = tx.returnValues[0]
        // prints the new leaves (commitments) added by this function call
        console.log('Merkle tree event returnValues:')
        console.log(tx.returnValues)
      }
      if (encEvent.event) {
        encryption.msgs = encEvent[0].returnValues[0]
        encryption.key = encEvent[0].returnValues[1]
        console.log('EncryptedMsgs:')
        console.log(encEvent[0].returnValues[0])
      }
      await sleep(10)
    } catch (err) {
      logger.error(err)
      return res.status(422).send({ errors: [err.message] })
    }
  }

  async service_BackupData (req, res, next) {
    try {
      await startEventFilter('SwapShield')
      res.send({ status: 'backup service will start. please check the backend logs for more details' })
      const eventListener = new EncryptedDataEventListener(this.web3)
      await eventListener.start()
      await this.backupData.performBackup()
    } catch (err) {
      logger.error('service_BackupData', err)
      return res.status(422).send({ errors: [err.message] })
    }
  }

  async service_ReadBackupData (req, res, next) {
    try {
      await startEventFilter('SwapShield')
      const backupData = await this.backupData.fetchBackupData()
      return res.send(backupData)
    } catch (err) {
      logger.error('service_ReadBackupData', err)
      return res.status(422).send({ errors: [err.message] })
    }
  }
}

export async function service_allCommitments (req, res, next) {
  try {
    const commitments = await getAllCommitments()
    return res.send({ commitments })
  } catch (err) {
    logger.error(err)
    return res.status(422).send({ errors: [err.message] })
  }
}
export async function service_getBalance (req, res, next) {
  try {
    const sum = await getBalance()
    return res.send({ ' Total Balance': sum })
  } catch (error) {
    console.error('Error in calculation :', error)
    return res.status(500).send({ error: error.message })
  }
}

export async function service_getBalanceByState (req, res, next) {
  try {
    const { name, mappingKey } = req.body
    const balance = await getBalanceByState(name, mappingKey)
    return res.send({ ' Total Balance': balance })
  } catch (error) {
    console.error('Error in calculation :', error)
    return res.status(500).send({ error: error.message })
  }
}

export async function service_getCommitmentsByState (req, res, next) {
  try {
    const { name, mappingKey } = req.body
    const commitments = await getCommitmentsByState(name, mappingKey)
    return res.send({ commitments })
  } catch (err) {
    logger.error(err)
    return res.status(422).send({ errors: [err.message] })
  }
}

export async function service_reinstateNullifiers (req, res, next) {
  try {
    await reinstateNullifiers()
    return res.send('Complete')
  } catch (err) {
    logger.error(err)
    return res.status(422).send({ errors: [err.message] })
  }
}

export async function service_getSharedKeys (req, res, next) {
  try {
    const { recipientAddress } = req.body
    const recipientPubKey = req.body.recipientPubKey || 0
    const SharedKeys = await getSharedSecretskeys(recipientAddress, recipientPubKey)
    return res.send({ SharedKeys })
  } catch (err) {
    logger.error(err)
    return res.status(422).send({ errors: [err.message] })
  }
}

export async function service_timberProxy (req, res) {
  try {
    const originalUrl = req.originalUrl.replace(/\?.*$/, '')
    const forwardUrl = `${process.env.TIMBER_URL}${req.path}`
    logger.info(`[PROXY] ${req.method} ${originalUrl} -> ${forwardUrl}`)

    let payload = req.body

    if (req.method === 'GET') {
      payload = {
        ...req.body,
        ...req.query
      }
    }

    const response = await axios({
      method: req.method,
      url: forwardUrl,
      data: payload
    })

    return res.status(response.status).send(response.data)
  } catch (err) {
    logger.error(err)
    return res.status(422).send({ errors: [err.message] })
  }
}

export async function service_getZKPPublicKey (req, res, next) {
  try {
    let { address } = req.params
    if (!web3.connection().utils.isAddress(address)) {
      return res.status(422).send({ errors: [`Invalid address, received: ${address}`] })
    }

    address = web3.connection().utils.toChecksumAddress(address)

    const SwapShield = await getContractInstance('SwapShield')
    const publicKey = await SwapShield.methods.zkpPublicKeys(address).call()

    return res.send({ address, publicKey })
  } catch (err) {
    logger.error(err)
    return res.status(422).send({ errors: [err.message] })
  }
}

export async function service_verify (req, res, next) {
  try {
    const { proof, inputs, verificationKeys } = req.body
    const errors = []

    if (!Array.isArray(proof)) {
      errors.push({
        name: 'proof',
        message: 'proof is not an array',
        received: proof
      })
    }

    if (!Array.isArray(inputs)) {
      errors.push({
        name: 'inputs',
        message: 'inputs is not an array',
        received: inputs
      })
    }

    if (!Array.isArray(verificationKeys)) {
      errors.push({
        name: 'verificationKeys',
        message: 'verificationKeys is not an array',
        received: verificationKeys
      })
    }

    if (errors.length > 0) {
      return res.status(422).send({ errors })
    }

    const SwapShield = await getContractInstance('SwapShield')
    const verifierAddress = await SwapShield.methods.verifier().call()
    const Verifier = await getContractInstance('Verifier', verifierAddress)

    let result = false

    try {
      const result = await Verifier.methods.verify(proof, inputs, verificationKeys).call()
      logger.info(`VerifierResponse: ${JSON.stringify(result)}`)
    } catch {
      logger.info('VerifierResponse: Wrong parameters')
    }

    return res.send({ result })
  } catch (err) {
    logger.error(err)
    return res.status(422).send({ errors: [err.message] })
  }
}

export async function service_publicBalance (req, res, next) {
  try {
    let { erc20Address = [], erc1155TokenIds = [], owner = process.env.DEFAULT_ACCOUNT } = { ...req.body, ...req.query }
    const web3Instance = web3.connection()
    const errors = []

    if (!web3Instance.utils.isAddress(owner)) {
      errors.push({
        path: 'owner',
        message: `Invalid address, received: ${owner}`
      })
    }

    if (!Array.isArray(erc1155TokenIds)) {
      errors.push({
        path: 'erc1155TokenIds',
        message: `Invalid array, received: ${erc1155TokenIds}`
      })
    } else {
      erc1155TokenIds.forEach((id, index) => {
        if (isNaN(parseInt(id))) {
          errors.push({
            path: `erc1155TokenIds[${index}]`,
            message: `Invalid integer at position ${index}, received: ${id}`
          })
        }
      })
    }

    if (!Array.isArray(erc20Address)) {
      errors.push({
        path: 'erc20Address',
        message: `Invalid array, received: ${erc20Address}`
      })
    } else {
      erc20Address.forEach((token, index) => {
        if (!web3Instance.utils.isAddress(token)) {
          errors.push({
            path: `erc20Address[${index}]`,
            message: `Invalid address at position ${index}, received: ${token}`
          })
        }
      })
    }

    if (errors.length > 0) {
      return res.status(422).send({ errors })
    }

    owner = web3Instance.utils.toChecksumAddress(owner)

    const balances = {
      balances: {},
      tokenOwners: {}
    }

    for (const token of erc20Address) {
      try {
        const Token = await getContractInstance('ERC20', token)
        balances.balances[token] = await Token.methods.balanceOf(owner).call()
      } catch {
        balances.balances[token] = '-1'
      }
    }

    const ERC1155Token = await getContractInstance('ERC1155Token')
    for (const tokenId of erc1155TokenIds) {
      balances.tokenOwners[tokenId] = await ERC1155Token.methods.balanceOf(owner, tokenId).call()
    }

    return res.send({
      owner,
      balances
    })
  } catch (err) {
    logger.error(err)
    return res.status(422).send({ errors: [err.message] })
  }
}

export async function service_shieldedBalance (req, res, next) {
  try {
    let { erc20Address = [], erc1155TokenIds = [], owner = process.env.DEFAULT_ACCOUNT } = { ...req.body, ...req.query }
    const web3Instance = web3.connection()
    const errors = []

    if (!web3Instance.utils.isAddress(owner)) {
      errors.push({
        path: 'owner',
        message: `Invalid address, received: ${owner}`
      })
    }

    if (!Array.isArray(erc1155TokenIds)) {
      errors.push({
        path: 'erc1155TokenIds',
        message: `Invalid array, received: ${erc1155TokenIds}`
      })
    } else {
      erc1155TokenIds.forEach((id, index) => {
        if (isNaN(parseInt(id))) {
          errors.push({
            path: `erc1155TokenIds[${index}]`,
            message: `Invalid integer at position ${index}, received: ${id}`
          })
        }
      })
    }

    if (!Array.isArray(erc20Address)) {
      errors.push({
        path: 'erc20Address',
        message: `Invalid array, received: ${erc20Address}`
      })
    } else {
      erc20Address.forEach((token, index) => {
        if (!web3Instance.utils.isAddress(token)) {
          errors.push({
            path: `erc20Address[${index}]`,
            message: `Invalid address at position ${index}, received: ${token}`
          })
        }
      })
    }

    if (errors.length > 0) {
      return res.status(422).send({ errors })
    }

    owner = web3Instance.utils.toChecksumAddress(owner)

    const extractBalances = parseCommitments(owner, erc20Address, erc1155TokenIds)
    const commitments = await getAllCommitments()

    return res.send({
      owner,
      balances: extractBalances(commitments)
    })
  } catch (err) {
    logger.error(err)
    return res.status(422).send({ errors: [err.message] })
  }
}

export async function service_getSwaps (req, res, next) {
  try {
    const web3Instance = web3.connection()

    const payload = {
      ...req.body,
      ...req.query
    }

    if (payload.isNullified === 'true' || payload.isNullified === 'false') {
      payload.isNullified = payload.isNullified === 'true'
    }

    const errors = []

    if (payload.swapReceiver != null && !web3Instance.utils.isAddress(payload.swapReceiver)) {
      errors.push({
        path: 'swapReceiver',
        message: `Invalid address, received: ${payload.swapReceiver}`
      })
    }

    if (payload.swapSender != null && !web3Instance.utils.isAddress(payload.swapSender)) {
      errors.push({
        path: 'swapSender',
        message: `Invalid address, received: ${payload.swapSender}`
      })
    }

    if (payload.isNullified != null && typeof payload.isNullified !== 'boolean') {
      errors.push({
        path: 'isNullified',
        message: `Invalid address, received: ${payload.isNullified}`
      })
    }

    if (errors.length > 0) {
      return res.status(422).send({ errors })
    }

    const conditions = {
      name: 'swapProposals'
    }

    if (payload.isNullified != null) {
      conditions.isNullified = payload.isNullified
    }

    if (payload.swapReceiver) {
      conditions['preimage.value.swapReciever'] = generalise(payload.swapReceiver).integer
    }

    if (payload.swapSender) {
      conditions['preimage.value.swapSender'] = generalise(payload.swapSender).integer
    }

    const commitments = await getCommitmentsWhere(conditions)
    const normalizedCommitments = commitments.map(commitment => {
      commitment.preimage.value.swapReciever = '0x' + BigInt(commitment.preimage.value.swapReciever).toString(16)
      commitment.preimage.value.swapSender = '0x' + BigInt(commitment.preimage.value.swapSender).toString(16)
      return commitment
    })

    return res.send({ commitments: normalizedCommitments })
  } catch (err) {
    logger.error(err)
    return res.status(422).send({ errors: [err.message] })
  }
}

export async function service_backupData (req, res) {
  const eventListener = new EncryptedDataEventListener(web3)
  const backupData = await eventListener.fetchBackupData()
  res.send(backupData)
}

export async function service_getParsedCommitments (req, res, next) {
  try {
    let { erc20Address = [], erc1155TokenIds = [], owner = process.env.DEFAULT_ACCOUNT } = { ...req.body, ...req.query }
    const web3Instance = web3.connection()
    const errors = []

    if (!web3Instance.utils.isAddress(owner)) {
      errors.push({
        path: 'owner',
        message: `Invalid address, received: ${owner}`
      })
    }

    if (!Array.isArray(erc1155TokenIds)) {
      errors.push({
        path: 'erc1155TokenIds',
        message: `Invalid array, received: ${erc1155TokenIds}`
      })
    } else {
      erc1155TokenIds.forEach((id, index) => {
        if (isNaN(parseInt(id))) {
          errors.push({
            path: `erc1155TokenIds[${index}]`,
            message: `Invalid integer at position ${index}, received: ${id}`
          })
        }
      })
    }

    if (!Array.isArray(erc20Address)) {
      errors.push({
        path: 'erc20Address',
        message: `Invalid array, received: ${erc20Address}`
      })
    } else {
      erc20Address.forEach((token, index) => {
        if (!web3Instance.utils.isAddress(token)) {
          errors.push({
            path: `erc20Address[${index}]`,
            message: `Invalid address at position ${index}, received: ${token}`
          })
        }
      })
    }

    if (errors.length > 0) {
      return res.status(422).send({ errors })
    }

    owner = web3Instance.utils.toChecksumAddress(owner)

    const commitments = await getAllCommitments()

    return res.send({
      owner,
      commitments: formatCommitments(commitments, owner, erc20Address, erc1155TokenIds)
    })
  } catch (err) {
    logger.error(err)
    return res.status(422).send({ errors: [err.message] })
  }
}
