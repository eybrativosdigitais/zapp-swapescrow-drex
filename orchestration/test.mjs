/* eslint-disable camelcase, prefer-const, no-unused-vars */
import config from 'config'
import assert from 'assert'

import withdrawErc1155 from './withdrawErc1155.mjs'

import withdrawErc20 from './withdrawErc20.mjs'

import cancelSwap from './cancelSwap.mjs'

import completeSwapFromErc1155ToErc1155 from './completeSwapFromErc1155ToErc1155.mjs'

import completeSwapFromErc20ToErc20 from './completeSwapFromErc20ToErc20.mjs'

import completeSwapFromErc1155ToErc20 from './completeSwapFromErc1155ToErc20.mjs'

import completeSwapFromErc20ToErc1155 from './completeSwapFromErc20ToErc1155.mjs'

import startSwapFromErc1155ToErc20 from './startSwapFromErc1155ToErc20.mjs'

import startSwapFromErc1155ToErc1155 from './startSwapFromErc1155ToErc1155.mjs'

import startSwapFromErc20ToErc20 from './startSwapFromErc20ToErc20.mjs'

import startSwapFromErc20ToErc1155 from './startSwapFromErc20ToErc1155.mjs'

import depositErc1155 from './depositErc1155.mjs'

import depositErc20 from './depositErc20.mjs'

import { startEventFilter, getSiblingPath } from './common/timber.mjs'
import fs from 'fs'
import GN from 'general-number'
import { getAllCommitments } from './common/commitment-storage.mjs'
import logger from './common/logger.mjs'
import { decrypt } from './common/number-theory.mjs'
import web3 from './common/web3.mjs'

/**
      Welcome to your zApp's integration test!
      Depending on how your functions interact and the range of inputs they expect, the below may need to be changed.
      e.g. Your input contract has two functions, add() and minus(). minus() cannot be called before an initial add() - the compiler won't know this! You'll need to rearrange the below.
      e.g. The function add() only takes numbers greater than 100. The compiler won't know this, so you'll need to change the call to add() below.
      The transpiler automatically fills in any ZKP inputs for you and provides some dummy values for the original zol function.
      NOTE: if any non-secret functions need to be called first, the transpiler won't know! You'll need to add those calls below.
      NOTE: if you'd like to keep track of your commitments, check out ./common/db/preimage. Remember to delete this file if you'd like to start fresh with a newly deployed contract.
      */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const { generalise } = GN
let leafIndex
let encryption = {}
// eslint-disable-next-line func-names
describe('SwapShield', async function () {
  this.timeout(3660000)
  try {
    await web3.connect()
  } catch (err) {
    throw new Error(err)
  }
  // eslint-disable-next-line func-names
  describe('depositErc20', async function () {
    this.timeout(3660000)
    try {
      await web3.connect()
    } catch (err) {
      throw new Error(err)
    }
    // eslint-disable-next-line func-names
    describe('First call', async function () {
      this.timeout(3660000)
      it('should call depositErc20', async () => {
        try {
          // this starts up the merkle tree's event filter
          await startEventFilter('SwapShield')
          // this calls your function! It returns the tx from the shield contract
          // you can replace the values below - numbers are randomly generated
          const { tx, encEvent } = await depositErc20(
            config.web3.options.defaultAccount,
            97
          )
          // prints the tx
          console.log(tx)
          // reassigns leafIndex to the index of the first commitment added by this function
          if (tx.event) {
            leafIndex = tx.returnValues[0]
            // prints the new leaves (commitments) added by this function call
            console.log('Merkle tree event returnValues:')
            console.log(tx.returnValues[0])
          }
          if (encEvent[0].event) {
            encryption.msgs = encEvent[0].returnValues[0]
            encryption.key = encEvent[0].returnValues[1]
            console.log('EncryptedMsgs:')
            console.log(encEvent[0].returnValues[0])
          }
          await sleep(10)
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
      it('should update the merkle tree', async () => {
        try {
          // this is the path from your new commitment to the root of the tree - it's needed to show the commitment exists when you want to edit your secret state
          const path = await getSiblingPath('SwapShield', leafIndex)
          console.log('Queried sibling path:')
          console.table(path, ['value', 'nodeIndex'])
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
    })
    // eslint-disable-next-line func-names
    describe('Second Call', async function () {
      this.timeout(3660000)
      it('should call depositErc20 again', async () => {
        try {
          // this calls your function a second time for incremental cases
          const { tx } = await depositErc20(
            config.web3.options.defaultAccount,
            181
          )
          if (tx.event) {
            console.log('Merkle tree event returnValues:')
            console.log(tx.returnValues[0])
          }
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
    })
  })

  // eslint-disable-next-line func-names
  describe('depositErc1155', async function () {
    this.timeout(3660000)
    try {
      await web3.connect()
    } catch (err) {
      throw new Error(err)
    }
    // eslint-disable-next-line func-names
    describe('First call', async function () {
      this.timeout(3660000)
      it('should call depositErc1155', async () => {
        try {
          // this starts up the merkle tree's event filter
          await startEventFilter('SwapShield')
          // this calls your function! It returns the tx from the shield contract
          // you can replace the values below - numbers are randomly generated
          const { tx, encEvent } = await depositErc1155(
            config.web3.options.defaultAccount,
            91,
            22
          )
          // prints the tx
          console.log(tx)
          // reassigns leafIndex to the index of the first commitment added by this function
          if (tx.event) {
            leafIndex = tx.returnValues[0]
            // prints the new leaves (commitments) added by this function call
            console.log('Merkle tree event returnValues:')
            console.log(tx.returnValues[0])
          }
          if (encEvent[0].event) {
            encryption.msgs = encEvent[0].returnValues[0]
            encryption.key = encEvent[0].returnValues[1]
            console.log('EncryptedMsgs:')
            console.log(encEvent[0].returnValues[0])
          }
          await sleep(10)
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
      it('should update the merkle tree', async () => {
        try {
          // this is the path from your new commitment to the root of the tree - it's needed to show the commitment exists when you want to edit your secret state
          const path = await getSiblingPath('SwapShield', leafIndex)
          console.log('Queried sibling path:')
          console.table(path, ['value', 'nodeIndex'])
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
    })
    // eslint-disable-next-line func-names
    describe('Second Call', async function () {
      this.timeout(3660000)
      it('should call depositErc1155 again', async () => {
        try {
          // this calls your function a second time for incremental cases
          const { tx } = await depositErc1155(
            config.web3.options.defaultAccount,
            158,
            46
          )
          if (tx.event) {
            console.log('Merkle tree event returnValues:')
            console.log(tx.returnValues[0])
          }
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
    })
  })

  // eslint-disable-next-line func-names
  describe('startSwapFromErc20ToErc1155', async function () {
    this.timeout(3660000)
    try {
      await web3.connect()
    } catch (err) {
      throw new Error(err)
    }
    // eslint-disable-next-line func-names
    describe('First call', async function () {
      this.timeout(3660000)
      it('should call startSwapFromErc20ToErc1155', async () => {
        try {
          // this starts up the merkle tree's event filter
          await startEventFilter('SwapShield')
          // this calls your function! It returns the tx from the shield contract
          // you can replace the values below - numbers are randomly generated
          const { tx, encEvent } = await startSwapFromErc20ToErc1155(
            config.web3.options.defaultAccount,
            config.web3.options.defaultAccount,
            115,
            135,
            127
          )
          // prints the tx
          console.log(tx)
          // reassigns leafIndex to the index of the first commitment added by this function
          if (tx.event) {
            leafIndex = tx.returnValues[0]
            // prints the new leaves (commitments) added by this function call
            console.log('Merkle tree event returnValues:')
            console.log(tx.returnValues[0])
          }
          if (encEvent[0].event) {
            encryption.msgs = encEvent[0].returnValues[0]
            encryption.key = encEvent[0].returnValues[1]
            console.log('EncryptedMsgs:')
            console.log(encEvent[0].returnValues[0])
          }
          await sleep(10)
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })

      it('should receive and decrypt messages', async () => {
        try {
          const { secretKey } = JSON.parse(
            fs.readFileSync(
              '/app/orchestration/common/db/key.json',
              'utf-8',
              (err) => {
                console.log(err)
              }
            )
          )
          const plainText = decrypt(encryption.msgs, secretKey, encryption.key)
          console.log('Decrypted plainText:')
          console.log(plainText)
          const salt = plainText[plainText.length - 1]
          const commitmentSet = await getAllCommitments()
          const thisCommit = commitmentSet.find(
            (c) =>
              generalise(c.preimage.salt).integer === generalise(salt).integer
          )
          assert.equal(!!thisCommit, true)
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })

      it('should update the merkle tree', async () => {
        try {
          // this is the path from your new commitment to the root of the tree - it's needed to show the commitment exists when you want to edit your secret state
          const path = await getSiblingPath('SwapShield', leafIndex)
          console.log('Queried sibling path:')
          console.table(path, ['value', 'nodeIndex'])
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
    })
    // eslint-disable-next-line func-names
  })
  // eslint-disable-next-line func-names
  describe('startSwapFromErc20ToErc20', async function () {
    this.timeout(3660000)
    try {
      await web3.connect()
    } catch (err) {
      throw new Error(err)
    }
    // eslint-disable-next-line func-names
    describe('First call', async function () {
      this.timeout(3660000)
      it('should call startSwapFromErc20ToErc20', async () => {
        try {
          // this starts up the merkle tree's event filter
          await startEventFilter('SwapShield')
          // this calls your function! It returns the tx from the shield contract
          // you can replace the values below - numbers are randomly generated
          const { tx, encEvent } = await startSwapFromErc20ToErc20(
            config.web3.options.defaultAccount,
            config.web3.options.defaultAccount,
            config.web3.options.defaultAccount,
            17,
            98
          )
          // prints the tx
          console.log(tx)
          // reassigns leafIndex to the index of the first commitment added by this function
          if (tx.event) {
            leafIndex = tx.returnValues[0]
            // prints the new leaves (commitments) added by this function call
            console.log('Merkle tree event returnValues:')
            console.log(tx.returnValues[0])
          }
          if (encEvent[0].event) {
            encryption.msgs = encEvent[0].returnValues[0]
            encryption.key = encEvent[0].returnValues[1]
            console.log('EncryptedMsgs:')
            console.log(encEvent[0].returnValues[0])
          }
          await sleep(10)
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })

      it('should receive and decrypt messages', async () => {
        try {
          const { secretKey } = JSON.parse(
            fs.readFileSync(
              '/app/orchestration/common/db/key.json',
              'utf-8',
              (err) => {
                console.log(err)
              }
            )
          )
          const plainText = decrypt(encryption.msgs, secretKey, encryption.key)
          console.log('Decrypted plainText:')
          console.log(plainText)
          const salt = plainText[plainText.length - 1]
          const commitmentSet = await getAllCommitments()
          const thisCommit = commitmentSet.find(
            (c) =>
              generalise(c.preimage.salt).integer === generalise(salt).integer
          )
          assert.equal(!!thisCommit, true)
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })

      it('should update the merkle tree', async () => {
        try {
          // this is the path from your new commitment to the root of the tree - it's needed to show the commitment exists when you want to edit your secret state
          const path = await getSiblingPath('SwapShield', leafIndex)
          console.log('Queried sibling path:')
          console.table(path, ['value', 'nodeIndex'])
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
    })
    // eslint-disable-next-line func-names
  })
  // eslint-disable-next-line func-names
  describe('startSwapFromErc1155ToErc1155', async function () {
    this.timeout(3660000)
    try {
      await web3.connect()
    } catch (err) {
      throw new Error(err)
    }
    // eslint-disable-next-line func-names
    describe('First call', async function () {
      this.timeout(3660000)
      it('should call startSwapFromErc1155ToErc1155', async () => {
        try {
          // this starts up the merkle tree's event filter
          await startEventFilter('SwapShield')
          // this calls your function! It returns the tx from the shield contract
          // you can replace the values below - numbers are randomly generated
          const { tx, encEvent } = await startSwapFromErc1155ToErc1155(
            config.web3.options.defaultAccount,
            45,
            34,
            199,
            124
          )
          // prints the tx
          console.log(tx)
          // reassigns leafIndex to the index of the first commitment added by this function
          if (tx.event) {
            leafIndex = tx.returnValues[0]
            // prints the new leaves (commitments) added by this function call
            console.log('Merkle tree event returnValues:')
            console.log(tx.returnValues[0])
          }
          if (encEvent[0].event) {
            encryption.msgs = encEvent[0].returnValues[0]
            encryption.key = encEvent[0].returnValues[1]
            console.log('EncryptedMsgs:')
            console.log(encEvent[0].returnValues[0])
          }
          await sleep(10)
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })

      it('should receive and decrypt messages', async () => {
        try {
          const { secretKey } = JSON.parse(
            fs.readFileSync(
              '/app/orchestration/common/db/key.json',
              'utf-8',
              (err) => {
                console.log(err)
              }
            )
          )
          const plainText = decrypt(encryption.msgs, secretKey, encryption.key)
          console.log('Decrypted plainText:')
          console.log(plainText)
          const salt = plainText[plainText.length - 1]
          const commitmentSet = await getAllCommitments()
          const thisCommit = commitmentSet.find(
            (c) =>
              generalise(c.preimage.salt).integer === generalise(salt).integer
          )
          assert.equal(!!thisCommit, true)
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })

      it('should update the merkle tree', async () => {
        try {
          // this is the path from your new commitment to the root of the tree - it's needed to show the commitment exists when you want to edit your secret state
          const path = await getSiblingPath('SwapShield', leafIndex)
          console.log('Queried sibling path:')
          console.table(path, ['value', 'nodeIndex'])
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
    })
    // eslint-disable-next-line func-names
  })
  // eslint-disable-next-line func-names
  describe('startSwapFromErc1155ToErc20', async function () {
    this.timeout(3660000)
    try {
      await web3.connect()
    } catch (err) {
      throw new Error(err)
    }
    // eslint-disable-next-line func-names
    describe('First call', async function () {
      this.timeout(3660000)
      it('should call startSwapFromErc1155ToErc20', async () => {
        try {
          // this starts up the merkle tree's event filter
          await startEventFilter('SwapShield')
          // this calls your function! It returns the tx from the shield contract
          // you can replace the values below - numbers are randomly generated
          const { tx, encEvent } = await startSwapFromErc1155ToErc20(
            config.web3.options.defaultAccount,
            64,
            119,
            config.web3.options.defaultAccount,
            37
          )
          // prints the tx
          console.log(tx)
          // reassigns leafIndex to the index of the first commitment added by this function
          if (tx.event) {
            leafIndex = tx.returnValues[0]
            // prints the new leaves (commitments) added by this function call
            console.log('Merkle tree event returnValues:')
            console.log(tx.returnValues[0])
          }
          if (encEvent[0].event) {
            encryption.msgs = encEvent[0].returnValues[0]
            encryption.key = encEvent[0].returnValues[1]
            console.log('EncryptedMsgs:')
            console.log(encEvent[0].returnValues[0])
          }
          await sleep(10)
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })

      it('should receive and decrypt messages', async () => {
        try {
          const { secretKey } = JSON.parse(
            fs.readFileSync(
              '/app/orchestration/common/db/key.json',
              'utf-8',
              (err) => {
                console.log(err)
              }
            )
          )
          const plainText = decrypt(encryption.msgs, secretKey, encryption.key)
          console.log('Decrypted plainText:')
          console.log(plainText)
          const salt = plainText[plainText.length - 1]
          const commitmentSet = await getAllCommitments()
          const thisCommit = commitmentSet.find(
            (c) =>
              generalise(c.preimage.salt).integer === generalise(salt).integer
          )
          assert.equal(!!thisCommit, true)
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })

      it('should update the merkle tree', async () => {
        try {
          // this is the path from your new commitment to the root of the tree - it's needed to show the commitment exists when you want to edit your secret state
          const path = await getSiblingPath('SwapShield', leafIndex)
          console.log('Queried sibling path:')
          console.table(path, ['value', 'nodeIndex'])
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
    })
    // eslint-disable-next-line func-names
  })
  // eslint-disable-next-line func-names
  describe('completeSwapFromErc20ToErc1155', async function () {
    this.timeout(3660000)
    try {
      await web3.connect()
    } catch (err) {
      throw new Error(err)
    }
    // eslint-disable-next-line func-names
    describe('First call', async function () {
      this.timeout(3660000)
      it('should call completeSwapFromErc20ToErc1155', async () => {
        try {
          // this starts up the merkle tree's event filter
          await startEventFilter('SwapShield')
          // this calls your function! It returns the tx from the shield contract
          // you can replace the values below - numbers are randomly generated
          const { tx, encEvent } = await completeSwapFromErc20ToErc1155(155)
          // prints the tx
          console.log(tx)
          // reassigns leafIndex to the index of the first commitment added by this function
          if (tx.event) {
            leafIndex = tx.returnValues[0]
            // prints the new leaves (commitments) added by this function call
            console.log('Merkle tree event returnValues:')
            console.log(tx.returnValues[0])
          }
          if (encEvent[0].event) {
            encryption.msgs = encEvent[0].returnValues[0]
            encryption.key = encEvent[0].returnValues[1]
            console.log('EncryptedMsgs:')
            console.log(encEvent[0].returnValues[0])
          }
          await sleep(10)
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
      it('should update the merkle tree', async () => {
        try {
          // this is the path from your new commitment to the root of the tree - it's needed to show the commitment exists when you want to edit your secret state
          const path = await getSiblingPath('SwapShield', leafIndex)
          console.log('Queried sibling path:')
          console.table(path, ['value', 'nodeIndex'])
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
    })
    // eslint-disable-next-line func-names
  })
  // eslint-disable-next-line func-names
  describe('completeSwapFromErc1155ToErc20', async function () {
    this.timeout(3660000)
    try {
      await web3.connect()
    } catch (err) {
      throw new Error(err)
    }
    // eslint-disable-next-line func-names
    describe('First call', async function () {
      this.timeout(3660000)
      it('should call completeSwapFromErc1155ToErc20', async () => {
        try {
          // this starts up the merkle tree's event filter
          await startEventFilter('SwapShield')
          // this calls your function! It returns the tx from the shield contract
          // you can replace the values below - numbers are randomly generated
          const { tx, encEvent } = await completeSwapFromErc1155ToErc20(78)
          // prints the tx
          console.log(tx)
          // reassigns leafIndex to the index of the first commitment added by this function
          if (tx.event) {
            leafIndex = tx.returnValues[0]
            // prints the new leaves (commitments) added by this function call
            console.log('Merkle tree event returnValues:')
            console.log(tx.returnValues[0])
          }
          if (encEvent[0].event) {
            encryption.msgs = encEvent[0].returnValues[0]
            encryption.key = encEvent[0].returnValues[1]
            console.log('EncryptedMsgs:')
            console.log(encEvent[0].returnValues[0])
          }
          await sleep(10)
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
      it('should update the merkle tree', async () => {
        try {
          // this is the path from your new commitment to the root of the tree - it's needed to show the commitment exists when you want to edit your secret state
          const path = await getSiblingPath('SwapShield', leafIndex)
          console.log('Queried sibling path:')
          console.table(path, ['value', 'nodeIndex'])
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
    })
    // eslint-disable-next-line func-names
  })
  // eslint-disable-next-line func-names
  describe('completeSwapFromErc20ToErc20', async function () {
    this.timeout(3660000)
    try {
      await web3.connect()
    } catch (err) {
      throw new Error(err)
    }
    // eslint-disable-next-line func-names
    describe('First call', async function () {
      this.timeout(3660000)
      it('should call completeSwapFromErc20ToErc20', async () => {
        try {
          // this starts up the merkle tree's event filter
          await startEventFilter('SwapShield')
          // this calls your function! It returns the tx from the shield contract
          // you can replace the values below - numbers are randomly generated
          const { tx, encEvent } = await completeSwapFromErc20ToErc20(117)
          // prints the tx
          console.log(tx)
          // reassigns leafIndex to the index of the first commitment added by this function
          if (tx.event) {
            leafIndex = tx.returnValues[0]
            // prints the new leaves (commitments) added by this function call
            console.log('Merkle tree event returnValues:')
            console.log(tx.returnValues[0])
          }
          if (encEvent[0].event) {
            encryption.msgs = encEvent[0].returnValues[0]
            encryption.key = encEvent[0].returnValues[1]
            console.log('EncryptedMsgs:')
            console.log(encEvent[0].returnValues[0])
          }
          await sleep(10)
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
      it('should update the merkle tree', async () => {
        try {
          // this is the path from your new commitment to the root of the tree - it's needed to show the commitment exists when you want to edit your secret state
          const path = await getSiblingPath('SwapShield', leafIndex)
          console.log('Queried sibling path:')
          console.table(path, ['value', 'nodeIndex'])
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
    })
    // eslint-disable-next-line func-names
  })
  // eslint-disable-next-line func-names
  describe('completeSwapFromErc1155ToErc1155', async function () {
    this.timeout(3660000)
    try {
      await web3.connect()
    } catch (err) {
      throw new Error(err)
    }
    // eslint-disable-next-line func-names
    describe('First call', async function () {
      this.timeout(3660000)
      it('should call completeSwapFromErc1155ToErc1155', async () => {
        try {
          // this starts up the merkle tree's event filter
          await startEventFilter('SwapShield')
          // this calls your function! It returns the tx from the shield contract
          // you can replace the values below - numbers are randomly generated
          const { tx, encEvent } = await completeSwapFromErc1155ToErc1155(133)
          // prints the tx
          console.log(tx)
          // reassigns leafIndex to the index of the first commitment added by this function
          if (tx.event) {
            leafIndex = tx.returnValues[0]
            // prints the new leaves (commitments) added by this function call
            console.log('Merkle tree event returnValues:')
            console.log(tx.returnValues[0])
          }
          if (encEvent[0].event) {
            encryption.msgs = encEvent[0].returnValues[0]
            encryption.key = encEvent[0].returnValues[1]
            console.log('EncryptedMsgs:')
            console.log(encEvent[0].returnValues[0])
          }
          await sleep(10)
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
      it('should update the merkle tree', async () => {
        try {
          // this is the path from your new commitment to the root of the tree - it's needed to show the commitment exists when you want to edit your secret state
          const path = await getSiblingPath('SwapShield', leafIndex)
          console.log('Queried sibling path:')
          console.table(path, ['value', 'nodeIndex'])
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
    })
    // eslint-disable-next-line func-names
  })
  // eslint-disable-next-line func-names
  describe('cancelSwap', async function () {
    this.timeout(3660000)
    try {
      await web3.connect()
    } catch (err) {
      throw new Error(err)
    }
    // eslint-disable-next-line func-names
    describe('First call', async function () {
      this.timeout(3660000)
      it('should call cancelSwap', async () => {
        try {
          // this starts up the merkle tree's event filter
          await startEventFilter('SwapShield')
          // this calls your function! It returns the tx from the shield contract
          // you can replace the values below - numbers are randomly generated
          const { tx, encEvent } = await cancelSwap(165)
          // prints the tx
          console.log(tx)
          // reassigns leafIndex to the index of the first commitment added by this function
          if (tx.event) {
            leafIndex = tx.returnValues[0]
            // prints the new leaves (commitments) added by this function call
            console.log('Merkle tree event returnValues:')
            console.log(tx.returnValues[0])
          }
          if (encEvent[0].event) {
            encryption.msgs = encEvent[0].returnValues[0]
            encryption.key = encEvent[0].returnValues[1]
            console.log('EncryptedMsgs:')
            console.log(encEvent[0].returnValues[0])
          }
          await sleep(10)
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
      it('should update the merkle tree', async () => {
        try {
          // this is the path from your new commitment to the root of the tree - it's needed to show the commitment exists when you want to edit your secret state
          const path = await getSiblingPath('SwapShield', leafIndex)
          console.log('Queried sibling path:')
          console.table(path, ['value', 'nodeIndex'])
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
    })
    // eslint-disable-next-line func-names
    describe('Second Call', async function () {
      this.timeout(3660000)
      it('should call cancelSwap again', async () => {
        try {
          // this calls your function a second time for incremental cases
          const { tx } = await cancelSwap(187)
          if (tx.event) {
            console.log('Merkle tree event returnValues:')
            console.log(tx.returnValues[0])
          }
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
    })
  })

  // eslint-disable-next-line func-names
  describe('withdrawErc20', async function () {
    this.timeout(3660000)
    try {
      await web3.connect()
    } catch (err) {
      throw new Error(err)
    }
    // eslint-disable-next-line func-names
    describe('First call', async function () {
      this.timeout(3660000)
      it('should call withdrawErc20', async () => {
        try {
          // this starts up the merkle tree's event filter
          await startEventFilter('SwapShield')
          // this calls your function! It returns the tx from the shield contract
          // you can replace the values below - numbers are randomly generated
          const { tx, encEvent } = await withdrawErc20(
            config.web3.options.defaultAccount,
            163
          )
          // prints the tx
          console.log(tx)
          // reassigns leafIndex to the index of the first commitment added by this function
          if (tx.event) {
            leafIndex = tx.returnValues[0]
            // prints the new leaves (commitments) added by this function call
            console.log('Merkle tree event returnValues:')
            console.log(tx.returnValues[0])
          }
          if (encEvent[0].event) {
            encryption.msgs = encEvent[0].returnValues[0]
            encryption.key = encEvent[0].returnValues[1]
            console.log('EncryptedMsgs:')
            console.log(encEvent[0].returnValues[0])
          }
          await sleep(10)
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
      it('should update the merkle tree', async () => {
        try {
          // this is the path from your new commitment to the root of the tree - it's needed to show the commitment exists when you want to edit your secret state
          const path = await getSiblingPath('SwapShield', leafIndex)
          console.log('Queried sibling path:')
          console.table(path, ['value', 'nodeIndex'])
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
    })
    // eslint-disable-next-line func-names
  })
  // eslint-disable-next-line func-names
  describe('withdrawErc1155', async function () {
    this.timeout(3660000)
    try {
      await web3.connect()
    } catch (err) {
      throw new Error(err)
    }
    // eslint-disable-next-line func-names
    describe('First call', async function () {
      this.timeout(3660000)
      it('should call withdrawErc1155', async () => {
        try {
          // this starts up the merkle tree's event filter
          await startEventFilter('SwapShield')
          // this calls your function! It returns the tx from the shield contract
          // you can replace the values below - numbers are randomly generated
          const { tx, encEvent } = await withdrawErc1155(
            config.web3.options.defaultAccount,
            116,
            114
          )
          // prints the tx
          console.log(tx)
          // reassigns leafIndex to the index of the first commitment added by this function
          if (tx.event) {
            leafIndex = tx.returnValues[0]
            // prints the new leaves (commitments) added by this function call
            console.log('Merkle tree event returnValues:')
            console.log(tx.returnValues[0])
          }
          if (encEvent[0].event) {
            encryption.msgs = encEvent[0].returnValues[0]
            encryption.key = encEvent[0].returnValues[1]
            console.log('EncryptedMsgs:')
            console.log(encEvent[0].returnValues[0])
          }
          await sleep(10)
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
      it('should update the merkle tree', async () => {
        try {
          // this is the path from your new commitment to the root of the tree - it's needed to show the commitment exists when you want to edit your secret state
          const path = await getSiblingPath('SwapShield', leafIndex)
          console.log('Queried sibling path:')
          console.table(path, ['value', 'nodeIndex'])
        } catch (err) {
          logger.error(err)
          process.exit(1)
        }
      })
    })
    // eslint-disable-next-line func-names
  })
})
