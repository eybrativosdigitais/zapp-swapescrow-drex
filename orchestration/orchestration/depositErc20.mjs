/* eslint-disable prettier/prettier, camelcase, prefer-const, no-unused-vars */
import config from "config";
import utils from "zkp-utils";
import GN from "general-number";
import fs from "fs";

import {
	getContractInstance,
	getContractAddress,
	registerKey,
} from "./common/contract.mjs";
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
	updateNullifierTree, getCommitmentsWhere,
} from "./common/commitment-storage.mjs"
import { generateProof } from "./common/zokrates.mjs";
import { getMembershipWitness, getRoot } from "./common/timber.mjs";
import Web3 from "./common/web3.mjs";
import {
	decompressStarlightKey,
	poseidonHash,
	encrypt,
	decrypt
} from "./common/number-theory.mjs";
import logger from './common/logger.mjs'

const { generalise } = GN;
const db = "/app/orchestration/common/db/preimage.json";
const keyDb = "/app/orchestration/common/db/key.json";
const delay = function (ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export class DepositErc20Manager {
	constructor(web3) {
	  this.web3 = web3;
	}

	async init() {
		this.instance = await getContractInstance('SwapShield');
		this.contractAddr = await getContractAddress('SwapShield');
	}

 async  depositErc20(
	_erc20Address,
	_amount,
	_balances_msgSender_erc20Address_newOwnerPublicKey = 0
	) {
		// Initialisation of variables:


		const msgValue = 0;
		const msgSender = generalise(config.web3.options.defaultAccount);
		const erc20Address = generalise(_erc20Address);
		const amount = generalise(_amount);
		let balances_msgSender_erc20Address_newOwnerPublicKey = generalise(
			_balances_msgSender_erc20Address_newOwnerPublicKey
		);

		// Read dbs for keys and previous commitment values:

		if (!fs.existsSync(keyDb))
			await registerKey(utils.randomHex(31), "SwapShield", true);
		const keys = JSON.parse(
			fs.readFileSync(keyDb, "utf-8", (err) => {
				console.log(err);
			})
		);
		const secretKey = generalise(keys.secretKey);
		const publicKey = generalise(keys.publicKey);

		// read preimage for incremented state
		balances_msgSender_erc20Address_newOwnerPublicKey =
			_balances_msgSender_erc20Address_newOwnerPublicKey === 0
				? publicKey
				: balances_msgSender_erc20Address_newOwnerPublicKey;

		let balances_msgSender_erc20Address_stateVarId = 9;

		const balances_msgSender_erc20Address_stateVarId_key = msgSender;

		const balances_msgSender_erc20Address_stateVarId_valueKey = erc20Address;

		balances_msgSender_erc20Address_stateVarId = generalise(
			utils.mimcHash(
				[
					generalise(balances_msgSender_erc20Address_stateVarId).bigInt,
					balances_msgSender_erc20Address_stateVarId_key.bigInt,
					balances_msgSender_erc20Address_stateVarId_valueKey.bigInt,
				],
				"ALT_BN_254"
			)
		).hex(32);

		const balances_msgSender_erc20Address_newCommitmentValue = generalise(
			parseInt(amount.integer, 10)
		);

		// non-secret line would go here but has been filtered out

		// non-secret line would go here but has been filtered out

		// increment would go here but has been filtered out

		// Calculate commitment(s):

		const balances_msgSender_erc20Address_newSalt = generalise(
			utils.randomHex(31)
		);

		let balances_msgSender_erc20Address_newCommitment = poseidonHash([
			BigInt(balances_msgSender_erc20Address_stateVarId),
			BigInt(balances_msgSender_erc20Address_newCommitmentValue.hex(32)),
			BigInt(balances_msgSender_erc20Address_newOwnerPublicKey.hex(32)),
			BigInt(balances_msgSender_erc20Address_newSalt.hex(32)),
		]);

		balances_msgSender_erc20Address_newCommitment = generalise(
			balances_msgSender_erc20Address_newCommitment.hex(32)
		); // truncate



		//Encryption Working

		console.log('plaintext:',balances_msgSender_erc20Address_newCommitmentValue.integer);

		const encryptedPreimage = encrypt([balances_msgSender_erc20Address_newCommitmentValue.integer], secretKey.integer,
		[
			decompressStarlightKey(
				balances_msgSender_erc20Address_newOwnerPublicKey
			)[0].integer,
			decompressStarlightKey(
				balances_msgSender_erc20Address_newOwnerPublicKey
			)[1].integer,
		] )

		console.log('encryptedPreimage:', encryptedPreimage);

		const decryptMessage = decrypt(encryptedPreimage, secretKey.integer,
		[
			decompressStarlightKey(
				balances_msgSender_erc20Address_newOwnerPublicKey
			)[0].integer,
			decompressStarlightKey(
				balances_msgSender_erc20Address_newOwnerPublicKey
			)[1].integer,
		]);

		console.log('decrypted Message:', decryptMessage);


		// Call Zokrates to generate the proof:



		const allInputs = [
			erc20Address.integer,
			amount.integer,
			msgSender.integer,
			balances_msgSender_erc20Address_newOwnerPublicKey.integer,
			balances_msgSender_erc20Address_newSalt.integer,
			balances_msgSender_erc20Address_newCommitment.integer,
		].flat(Infinity);
		const res = await generateProof("depositErc20", allInputs);
		const proof = generalise(Object.values(res.proof).flat(Infinity))
			.map((coeff) => coeff.integer)
			.flat(Infinity);

		// Send transaction to the blockchain:

		const txData = await this.instance.methods
			.depositErc20(
				_erc20Address,
				amount.integer,
				[balances_msgSender_erc20Address_newCommitment.integer],
				proof
			)
			.encodeABI();

		let txParams = {
			from: config.web3.options.defaultAccount,
			to: this.contractAddr,
			gas: config.web3.options.defaultGas,
			gasPrice: config.web3.options.defaultGasPrice,
			data: txData,
			chainId: await this.web3.eth.net.getId(),
		};

		const key = config.web3.key;

		const signed = await this.web3.eth.accounts.signTransaction(txParams, key);

		const sendTxnReceipt = await this.web3.eth.sendSignedTransaction(signed.rawTransaction);
		if (!sendTxnReceipt.status) {
			console.error("depositErc20", "sendTxnReceipt:", sendTxnReceipt)
			throw new Error("Tx failed - sendTxnReceipt.status is false");
		}

		let tx;
		for (let maxGetEventAttempts = 5; maxGetEventAttempts > 0; maxGetEventAttempts--) {
			tx = await this.instance.getPastEvents("NewLeaves");
			tx = tx[0];
			if (tx) {
				break;
			}
			await delay(1000);
		}
		if (!tx) {
			throw new Error(
				"depositErc1155 - Tx is undefined. Or the commitment was not accepted on-chain, or the orchestrator was not able to get the past events."
			);
		}

		let encEvent = "";
		try {
			encEvent = await this.instance.getPastEvents("EncryptedData");
		} catch (err) {
			console.log("No encrypted event");
		}

		// Write new commitment preimage to db:

		const insertedDocument = await storeCommitment({
			hash: balances_msgSender_erc20Address_newCommitment,
			name: "balances",
			mappingKey: balances_msgSender_erc20Address_stateVarId_key.integer,
			preimage: {
				stateVarId: generalise(balances_msgSender_erc20Address_stateVarId),
				value: balances_msgSender_erc20Address_newCommitmentValue,
				salt: balances_msgSender_erc20Address_newSalt,
				publicKey: balances_msgSender_erc20Address_newOwnerPublicKey,
			},
			secretKey:
				balances_msgSender_erc20Address_newOwnerPublicKey.integer ===
				publicKey.integer
					? secretKey
					: null,
			isNullified: false,
		});

		if (!insertedDocument.acknowledged) {
			logger.error(`Commitment not inserted`)
		}

		const [commitment] = await getCommitmentsWhere({ _id: insertedDocument.insertedId })
		return { tx, encEvent, commitment };
	}
}

