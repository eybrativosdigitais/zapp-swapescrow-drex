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
	updateNullifierTree,
	getSharedSecretskeys, getCommitmentsWhere,
} from "./common/commitment-storage.mjs"
import { generateProof } from "./common/zokrates.mjs";
import { encodeCommitmentData, encryptBackupData } from "./common/backupData.mjs";
import { getMembershipWitness, getRoot } from "./common/timber.mjs";
import Web3 from "./common/web3.mjs";
import {
	decompressStarlightKey,
	poseidonHash,
} from "./common/number-theory.mjs";
import logger from './common/logger.mjs'

const { generalise } = GN;
const db = "/app/orchestration/common/db/preimage.json";
const keyDb = "/app/orchestration/common/db/key.json";

export class StartSwapFromErc1155ToErc1155Manager {
	constructor(web3) {
	  this.web3 = web3;
	}

	async init() {
		this.instance = await getContractInstance('SwapShield');
		this.contractAddr = await getContractAddress('SwapShield');
	}

 async  startSwapFromErc1155ToErc1155(
	_counterParty,
	_tokenIdSent,
	_tokenSentAmount,
	_tokenIdRecieved,
	_tokenRecievedAmount,
	_tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey = 0,
	_swapProposals_swapIdCounter_3_newOwnerPublicKey = 0,
	_tokenOwners_msgSender_tokenIdSent_0_oldCommitment = 0,
	_tokenOwners_msgSender_tokenIdSent_1_oldCommitment = 0
) {
	// Initialisation of variables:

	const instance = this.instance;

	const contractAddr = this.contractAddr;
	const web3 =  this.web3;

	const msgSender = generalise(config.web3.options.defaultAccount);

	const msgValue = 0;
	const counterParty = generalise(_counterParty);
	const tokenIdSent = generalise(_tokenIdSent);
	const tokenSentAmount = generalise(_tokenSentAmount);
	const tokenIdRecieved = generalise(_tokenIdRecieved);
	const tokenRecievedAmount = generalise(_tokenRecievedAmount);
	let tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey = generalise(
		_tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey
	);
	let swapProposals_swapIdCounter_3_newOwnerPublicKey = generalise(
		_swapProposals_swapIdCounter_3_newOwnerPublicKey
	);

	// Read dbs for keys and previous commitment values:

	if (!fs.existsSync(keyDb))
		await registerKey(utils.randomHex(31), "SwapShield", true);
		let keys = JSON.parse(
			fs.readFileSync(keyDb, "utf-8", (err) => {
				console.log(err);
			})
		);
		const secretKey = generalise(keys.secretKey);
		const publicKey = generalise(keys.publicKey);

		let recipientPublicKey = await this.instance.methods.zkpPublicKeys(counterParty.hex(20)).call();
		recipientPublicKey = generalise(recipientPublicKey);

			if (recipientPublicKey.length === 0) {
				throw new Error("WARNING: Public key for given  eth address not found.");
			  }
			 let sharedPublicKey =   await getSharedSecretskeys(counterParty, recipientPublicKey);
			  keys = JSON.parse(
				fs.readFileSync(keyDb, "utf-8", (err) => {
					console.log(err);
				})
			);
				let sharedSecretKey = generalise(keys.sharedSecretKey);
				 sharedPublicKey = generalise(keys.sharedPublicKey);



	let swapIdCounter = generalise(await instance.methods.swapIdCounter().call());
	let swapIdCounter_init = swapIdCounter;

	let swapIdCounter_3 = generalise(parseInt(swapIdCounter.integer, 10) + 1);

	swapIdCounter = generalise(swapIdCounter_3);

	swapIdCounter = generalise(swapIdCounter_init);

	// Initialise commitment preimage of whole state:

	let swapProposals_swapIdCounter_3_stateVarId = 47;

	const swapProposals_swapIdCounter_3_stateVarId_key = swapIdCounter_3;

	swapProposals_swapIdCounter_3_stateVarId = generalise(
		utils.mimcHash(
			[
				generalise(swapProposals_swapIdCounter_3_stateVarId).bigInt,
				swapProposals_swapIdCounter_3_stateVarId_key.bigInt,
			],
			"ALT_BN_254"
		)
	).hex(32);

	let swapProposals_swapIdCounter_3_commitmentExists = true;
	let swapProposals_swapIdCounter_3_witnessRequired = true;

	const swapProposals_swapIdCounter_3_commitment = await getCurrentWholeCommitment(
		swapProposals_swapIdCounter_3_stateVarId
	);

	let swapProposals_swapIdCounter_3_preimage = {
		value: {
			swapAmountSent: 0,
			swapAmountRecieved: 0,
			swapTokenSentId: 0,
			swapTokenSentAmount: 0,
			swapTokenRecievedId: 0,
			swapTokenRecievedAmount: 0,
			swapId: 0,
			pendingStatus: 0,
			swapSender: 0,
			swapReciever: 0,
			erc20AddressSent: 0,
			erc20AddressRecieved: 0,
		},
		salt: 0,
		commitment: 0,
	};
	if (!swapProposals_swapIdCounter_3_commitment) {
		swapProposals_swapIdCounter_3_commitmentExists = false;
		swapProposals_swapIdCounter_3_witnessRequired = false;
	} else {
		swapProposals_swapIdCounter_3_preimage =
			swapProposals_swapIdCounter_3_commitment.preimage;
	}

	// read preimage for decremented state

	tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey =
		_tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey === 0
			? publicKey
			: tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey;

	let tokenOwners_msgSender_tokenIdSent_stateVarId = 15;

	const tokenOwners_msgSender_tokenIdSent_stateVarId_key = msgSender;

	const tokenOwners_msgSender_tokenIdSent_stateVarId_valueKey = tokenIdSent;

	tokenOwners_msgSender_tokenIdSent_stateVarId = generalise(
		utils.mimcHash(
			[
				generalise(tokenOwners_msgSender_tokenIdSent_stateVarId).bigInt,
				tokenOwners_msgSender_tokenIdSent_stateVarId_key.bigInt,
				tokenOwners_msgSender_tokenIdSent_stateVarId_valueKey.bigInt,
			],
			"ALT_BN_254"
		)
	).hex(32);

	let tokenOwners_msgSender_tokenIdSent_preimage = await getCommitmentsById(
		tokenOwners_msgSender_tokenIdSent_stateVarId
	);

	const tokenOwners_msgSender_tokenIdSent_newCommitmentValue = generalise(
		parseInt(tokenSentAmount.integer, 10)
	);
	// First check if required commitments exist or not

	let [
		tokenOwners_msgSender_tokenIdSent_commitmentFlag,
		tokenOwners_msgSender_tokenIdSent_0_oldCommitment,
		tokenOwners_msgSender_tokenIdSent_1_oldCommitment,
	] = getInputCommitments(
		publicKey.hex(32),
		tokenOwners_msgSender_tokenIdSent_newCommitmentValue.integer,
		tokenOwners_msgSender_tokenIdSent_preimage
	);

	let tokenOwners_msgSender_tokenIdSent_witness_0;

	let tokenOwners_msgSender_tokenIdSent_witness_1;

	if (
		tokenOwners_msgSender_tokenIdSent_1_oldCommitment === null &&
		tokenOwners_msgSender_tokenIdSent_commitmentFlag
	) {
		tokenOwners_msgSender_tokenIdSent_witness_0 = await getMembershipWitness(
			"SwapShield",
			generalise(tokenOwners_msgSender_tokenIdSent_0_oldCommitment._id).integer
		);

		const tx = await splitCommitments(
			"SwapShield",
			"tokenOwners",
			tokenOwners_msgSender_tokenIdSent_newCommitmentValue,
			secretKey,
			publicKey,
			[15, tokenOwners_msgSender_tokenIdSent_stateVarId_key, tokenOwners_msgSender_tokenIdSent_stateVarId_valueKey],
			tokenOwners_msgSender_tokenIdSent_0_oldCommitment,
			tokenOwners_msgSender_tokenIdSent_witness_0,
			instance,
			contractAddr,
			web3
		);
		tokenOwners_msgSender_tokenIdSent_preimage = await getCommitmentsById(
			tokenOwners_msgSender_tokenIdSent_stateVarId
		);

		[
			tokenOwners_msgSender_tokenIdSent_commitmentFlag,
			tokenOwners_msgSender_tokenIdSent_0_oldCommitment,
			tokenOwners_msgSender_tokenIdSent_1_oldCommitment,
		] = getInputCommitments(
			publicKey.hex(32),
			tokenOwners_msgSender_tokenIdSent_newCommitmentValue.integer,
			tokenOwners_msgSender_tokenIdSent_preimage
		);
	}

	while (tokenOwners_msgSender_tokenIdSent_commitmentFlag === false) {
		tokenOwners_msgSender_tokenIdSent_witness_0 = await getMembershipWitness(
			"SwapShield",
			generalise(tokenOwners_msgSender_tokenIdSent_0_oldCommitment._id).integer
		);

		tokenOwners_msgSender_tokenIdSent_witness_1 = await getMembershipWitness(
			"SwapShield",
			generalise(tokenOwners_msgSender_tokenIdSent_1_oldCommitment._id).integer
		);

		const tx = await joinCommitments(
			"SwapShield",
			"tokenOwners",
			secretKey,
			publicKey,
			[15, tokenOwners_msgSender_tokenIdSent_stateVarId_key, tokenOwners_msgSender_tokenIdSent_stateVarId_valueKey],
			[
				tokenOwners_msgSender_tokenIdSent_0_oldCommitment,
				tokenOwners_msgSender_tokenIdSent_1_oldCommitment,
			],
			[
				tokenOwners_msgSender_tokenIdSent_witness_0,
				tokenOwners_msgSender_tokenIdSent_witness_1,
			],
			instance,
			contractAddr,
			web3
		);

		tokenOwners_msgSender_tokenIdSent_preimage = await getCommitmentsById(
			tokenOwners_msgSender_tokenIdSent_stateVarId
		);

		[
			tokenOwners_msgSender_tokenIdSent_commitmentFlag,
			tokenOwners_msgSender_tokenIdSent_0_oldCommitment,
			tokenOwners_msgSender_tokenIdSent_1_oldCommitment,
		] = getInputCommitments(
			publicKey.hex(32),
			tokenOwners_msgSender_tokenIdSent_newCommitmentValue.integer,
			tokenOwners_msgSender_tokenIdSent_preimage
		);
	}
	const tokenOwners_msgSender_tokenIdSent_0_prevSalt = generalise(
		tokenOwners_msgSender_tokenIdSent_0_oldCommitment.preimage.salt
	);
	const tokenOwners_msgSender_tokenIdSent_1_prevSalt = generalise(
		tokenOwners_msgSender_tokenIdSent_1_oldCommitment.preimage.salt
	);
	const tokenOwners_msgSender_tokenIdSent_0_prev = generalise(
		tokenOwners_msgSender_tokenIdSent_0_oldCommitment.preimage.value
	);
	const tokenOwners_msgSender_tokenIdSent_1_prev = generalise(
		tokenOwners_msgSender_tokenIdSent_1_oldCommitment.preimage.value
	);

	// read preimage for whole state
	swapProposals_swapIdCounter_3_newOwnerPublicKey =
		_swapProposals_swapIdCounter_3_newOwnerPublicKey === 0
			? sharedPublicKey
			: swapProposals_swapIdCounter_3_newOwnerPublicKey;

	const swapProposals_swapIdCounter_3_currentCommitment = swapProposals_swapIdCounter_3_commitmentExists
		? generalise(swapProposals_swapIdCounter_3_commitment._id)
		: generalise(0);
	const swapProposals_swapIdCounter_3_prev = generalise(
		swapProposals_swapIdCounter_3_preimage.value
	);
	const swapProposals_swapIdCounter_3_prevSalt = generalise(
		swapProposals_swapIdCounter_3_preimage.salt
	);

	// Extract set membership witness:

	// generate witness for partitioned state
	tokenOwners_msgSender_tokenIdSent_witness_0 = await getMembershipWitness(
		"SwapShield",
		generalise(tokenOwners_msgSender_tokenIdSent_0_oldCommitment._id).integer
	);
	tokenOwners_msgSender_tokenIdSent_witness_1 = await getMembershipWitness(
		"SwapShield",
		generalise(tokenOwners_msgSender_tokenIdSent_1_oldCommitment._id).integer
	);
	const tokenOwners_msgSender_tokenIdSent_0_index = generalise(
		tokenOwners_msgSender_tokenIdSent_witness_0.index
	);
	const tokenOwners_msgSender_tokenIdSent_1_index = generalise(
		tokenOwners_msgSender_tokenIdSent_witness_1.index
	);
	const tokenOwners_msgSender_tokenIdSent_root = generalise(
		tokenOwners_msgSender_tokenIdSent_witness_0.root
	);
	const tokenOwners_msgSender_tokenIdSent_0_path = generalise(
		tokenOwners_msgSender_tokenIdSent_witness_0.path
	).all;
	const tokenOwners_msgSender_tokenIdSent_1_path = generalise(
		tokenOwners_msgSender_tokenIdSent_witness_1.path
	).all;

	// generate witness for whole state
	const swapProposals_swapIdCounter_3_emptyPath = new Array(32).fill(0);
	const swapProposals_swapIdCounter_3_witness = swapProposals_swapIdCounter_3_witnessRequired
		? await getMembershipWitness(
				"SwapShield",
				swapProposals_swapIdCounter_3_currentCommitment.integer
		  )
		: {
				index: 0,
				path: swapProposals_swapIdCounter_3_emptyPath,
				root: (await getRoot("SwapShield")) || 0,
		  };
	const swapProposals_swapIdCounter_3_index = generalise(
		swapProposals_swapIdCounter_3_witness.index
	);
	const swapProposals_swapIdCounter_3_root = generalise(
		swapProposals_swapIdCounter_3_witness.root
	);
	const swapProposals_swapIdCounter_3_path = generalise(
		swapProposals_swapIdCounter_3_witness.path
	).all;

	// increment would go here but has been filtered out

	let swapProposals_swapIdCounter_3 = {swapAmountSent: 0,
		swapAmountRecieved: 0,
		swapTokenSentId: 0,
			swapTokenSentAmount: 0,
			swapTokenRecievedId: 0,
			swapTokenRecievedAmount: 0,
			swapId: 0,
			pendingStatus: 0,
			swapSender: 0,
			swapReciever: 0,
			erc20AddressSent: 0,
			erc20AddressRecieved:0,};

			swapProposals_swapIdCounter_3 = generalise(swapProposals_swapIdCounter_3);
	swapProposals_swapIdCounter_3.swapTokenSentId = generalise(
		parseInt(tokenIdSent.integer, 10)
	);



	swapProposals_swapIdCounter_3.swapTokenSentAmount = generalise(
		parseInt(tokenSentAmount.integer, 10)
	);



	swapProposals_swapIdCounter_3.swapTokenRecievedId = generalise(
		parseInt(tokenIdRecieved.integer, 10)
	);



	swapProposals_swapIdCounter_3.swapTokenRecievedAmount = generalise(
		parseInt(tokenRecievedAmount.integer, 10)
	);



	swapProposals_swapIdCounter_3.swapId = generalise(
		parseInt(swapIdCounter_3.integer, 10)
	);



	swapProposals_swapIdCounter_3.pendingStatus = generalise(1);



	swapProposals_swapIdCounter_3.swapSender = generalise(msgSender.integer);



	swapProposals_swapIdCounter_3.swapReciever = generalise(counterParty.integer);

	swapProposals_swapIdCounter_3 = generalise(swapProposals_swapIdCounter_3);

	// Calculate nullifier(s):

	let tokenOwners_msgSender_tokenIdSent_0_nullifier = poseidonHash([
		BigInt(tokenOwners_msgSender_tokenIdSent_stateVarId),
		BigInt(secretKey.hex(32)),
		BigInt(tokenOwners_msgSender_tokenIdSent_0_prevSalt.hex(32)),
	]);
	let tokenOwners_msgSender_tokenIdSent_1_nullifier = poseidonHash([
		BigInt(tokenOwners_msgSender_tokenIdSent_stateVarId),
		BigInt(secretKey.hex(32)),
		BigInt(tokenOwners_msgSender_tokenIdSent_1_prevSalt.hex(32)),
	]);
	tokenOwners_msgSender_tokenIdSent_0_nullifier = generalise(
		tokenOwners_msgSender_tokenIdSent_0_nullifier.hex(32)
	); // truncate
	tokenOwners_msgSender_tokenIdSent_1_nullifier = generalise(
		tokenOwners_msgSender_tokenIdSent_1_nullifier.hex(32)
	); // truncate

	let swapProposals_swapIdCounter_3_nullifier = swapProposals_swapIdCounter_3_commitmentExists
		? poseidonHash([
				BigInt(swapProposals_swapIdCounter_3_stateVarId),
				BigInt(sharedSecretKey.hex(32)),
				BigInt(swapProposals_swapIdCounter_3_prevSalt.hex(32)),
		  ])
		: poseidonHash([
				BigInt(swapProposals_swapIdCounter_3_stateVarId),
				BigInt(generalise(0).hex(32)),
				BigInt(swapProposals_swapIdCounter_3_prevSalt.hex(32)),
		  ]);

	swapProposals_swapIdCounter_3_nullifier = generalise(
		swapProposals_swapIdCounter_3_nullifier.hex(32)
	); // truncate

	// Calculate commitment(s):

	const tokenOwners_msgSender_tokenIdSent_2_newSalt = generalise(
		utils.randomHex(31)
	);

	let tokenOwners_msgSender_tokenIdSent_change =
		parseInt(tokenOwners_msgSender_tokenIdSent_0_prev.integer, 10) +
		parseInt(tokenOwners_msgSender_tokenIdSent_1_prev.integer, 10) -
		parseInt(tokenOwners_msgSender_tokenIdSent_newCommitmentValue.integer, 10);

	tokenOwners_msgSender_tokenIdSent_change = generalise(
		tokenOwners_msgSender_tokenIdSent_change
	);

	let tokenOwners_msgSender_tokenIdSent_2_newCommitment = poseidonHash([
		BigInt(tokenOwners_msgSender_tokenIdSent_stateVarId),
		BigInt(tokenOwners_msgSender_tokenIdSent_change.hex(32)),
		BigInt(publicKey.hex(32)),
		BigInt(tokenOwners_msgSender_tokenIdSent_2_newSalt.hex(32)),
	]);

	tokenOwners_msgSender_tokenIdSent_2_newCommitment = generalise(
		tokenOwners_msgSender_tokenIdSent_2_newCommitment.hex(32)
	); // truncate

	swapProposals_swapIdCounter_3.swapAmountSent = swapProposals_swapIdCounter_3.swapAmountSent
		? swapProposals_swapIdCounter_3.swapAmountSent
		: swapProposals_swapIdCounter_3_prev.swapAmountSent;
	swapProposals_swapIdCounter_3.swapAmountRecieved = swapProposals_swapIdCounter_3.swapAmountRecieved
		? swapProposals_swapIdCounter_3.swapAmountRecieved
		: swapProposals_swapIdCounter_3_prev.swapAmountRecieved;
	swapProposals_swapIdCounter_3.swapTokenSentId = swapProposals_swapIdCounter_3.swapTokenSentId
		? swapProposals_swapIdCounter_3.swapTokenSentId
		: swapProposals_swapIdCounter_3_prev.swapTokenSentId;
	swapProposals_swapIdCounter_3.swapTokenSentAmount = swapProposals_swapIdCounter_3.swapTokenSentAmount
		? swapProposals_swapIdCounter_3.swapTokenSentAmount
		: swapProposals_swapIdCounter_3_prev.swapTokenSentAmount;
	swapProposals_swapIdCounter_3.swapTokenRecievedId = swapProposals_swapIdCounter_3.swapTokenRecievedId
		? swapProposals_swapIdCounter_3.swapTokenRecievedId
		: swapProposals_swapIdCounter_3_prev.swapTokenRecievedId;
	swapProposals_swapIdCounter_3.swapTokenRecievedAmount = swapProposals_swapIdCounter_3.swapTokenRecievedAmount
		? swapProposals_swapIdCounter_3.swapTokenRecievedAmount
		: swapProposals_swapIdCounter_3_prev.swapTokenRecievedAmount;
	swapProposals_swapIdCounter_3.swapId = swapProposals_swapIdCounter_3.swapId
		? swapProposals_swapIdCounter_3.swapId
		: swapProposals_swapIdCounter_3_prev.swapId;
	swapProposals_swapIdCounter_3.swapSender = swapProposals_swapIdCounter_3.swapSender
		? swapProposals_swapIdCounter_3.swapSender
		: swapProposals_swapIdCounter_3_prev.swapSender;
	swapProposals_swapIdCounter_3.swapReciever = swapProposals_swapIdCounter_3.swapReciever
		? swapProposals_swapIdCounter_3.swapReciever
		: swapProposals_swapIdCounter_3_prev.swapReciever;
	swapProposals_swapIdCounter_3.erc20AddressSent = swapProposals_swapIdCounter_3.erc20AddressSent
		? swapProposals_swapIdCounter_3.erc20AddressSent
		: swapProposals_swapIdCounter_3_prev.erc20AddressSent;
	swapProposals_swapIdCounter_3.erc20AddressRecieved = swapProposals_swapIdCounter_3.erc20AddressRecieved
		? swapProposals_swapIdCounter_3.erc20AddressRecieved
		: swapProposals_swapIdCounter_3_prev.erc20AddressRecieved;
	swapProposals_swapIdCounter_3.pendingStatus = swapProposals_swapIdCounter_3.pendingStatus
		? swapProposals_swapIdCounter_3.pendingStatus
		: swapProposals_swapIdCounter_3_prev.pendingStatus;

	const swapProposals_swapIdCounter_3_newSalt = generalise(utils.randomHex(31));

	let swapProposals_swapIdCounter_3_newCommitment = poseidonHash([
		BigInt(swapProposals_swapIdCounter_3_stateVarId),
		BigInt(swapProposals_swapIdCounter_3.swapAmountSent.hex(32)),
		BigInt(swapProposals_swapIdCounter_3.swapAmountRecieved.hex(32)),
		BigInt(swapProposals_swapIdCounter_3.swapTokenSentId.hex(32)),
		BigInt(swapProposals_swapIdCounter_3.swapTokenSentAmount.hex(32)),
		BigInt(swapProposals_swapIdCounter_3.swapTokenRecievedId.hex(32)),
		BigInt(swapProposals_swapIdCounter_3.swapTokenRecievedAmount.hex(32)),
		BigInt(swapProposals_swapIdCounter_3.swapId.hex(32)),
		BigInt(swapProposals_swapIdCounter_3.swapSender.hex(32)),
		BigInt(swapProposals_swapIdCounter_3.swapReciever.hex(32)),
		BigInt(swapProposals_swapIdCounter_3.erc20AddressSent.hex(32)),
		BigInt(swapProposals_swapIdCounter_3.erc20AddressRecieved.hex(32)),
		BigInt(swapProposals_swapIdCounter_3.pendingStatus.hex(32)),
		BigInt(swapProposals_swapIdCounter_3_newOwnerPublicKey.hex(32)),
		BigInt(swapProposals_swapIdCounter_3_newSalt.hex(32)),
	]);

	swapProposals_swapIdCounter_3_newCommitment = generalise(
		swapProposals_swapIdCounter_3_newCommitment.hex(32)
	); // truncate

	// Call Zokrates to generate the proof:

	const allInputs = [
		msgSender.integer,
		counterParty.integer,
		tokenIdSent.integer,
		tokenSentAmount.integer,
		tokenIdRecieved.integer,
		tokenRecievedAmount.integer,
		swapIdCounter.integer,
		secretKey.integer,
		secretKey.integer,

		tokenOwners_msgSender_tokenIdSent_0_nullifier.integer,

		tokenOwners_msgSender_tokenIdSent_1_nullifier.integer,

		tokenOwners_msgSender_tokenIdSent_0_prev.integer,
		tokenOwners_msgSender_tokenIdSent_0_prevSalt.integer,
		tokenOwners_msgSender_tokenIdSent_1_prev.integer,
		tokenOwners_msgSender_tokenIdSent_1_prevSalt.integer,
		tokenOwners_msgSender_tokenIdSent_root.integer,
		tokenOwners_msgSender_tokenIdSent_0_index.integer,
		tokenOwners_msgSender_tokenIdSent_0_path.integer,
		tokenOwners_msgSender_tokenIdSent_1_index.integer,
		tokenOwners_msgSender_tokenIdSent_1_path.integer,
		tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey.integer,
		tokenOwners_msgSender_tokenIdSent_2_newSalt.integer,
		tokenOwners_msgSender_tokenIdSent_2_newCommitment.integer,

		swapProposals_swapIdCounter_3_commitmentExists
			? sharedSecretKey.integer
			: generalise(0).integer,

		swapProposals_swapIdCounter_3_nullifier.integer,

		swapProposals_swapIdCounter_3_prev.swapAmountSent.integer,
		swapProposals_swapIdCounter_3_prev.swapAmountRecieved.integer,
		swapProposals_swapIdCounter_3_prev.swapTokenSentId.integer,
		swapProposals_swapIdCounter_3_prev.swapTokenSentAmount.integer,
		swapProposals_swapIdCounter_3_prev.swapTokenRecievedId.integer,
		swapProposals_swapIdCounter_3_prev.swapTokenRecievedAmount.integer,
		swapProposals_swapIdCounter_3_prev.swapId.integer,
		swapProposals_swapIdCounter_3_prev.pendingStatus.integer,
		swapProposals_swapIdCounter_3_prev.swapSender.integer,
		swapProposals_swapIdCounter_3_prev.swapReciever.integer,
		swapProposals_swapIdCounter_3_prev.erc20AddressSent.integer,
		swapProposals_swapIdCounter_3_prev.erc20AddressRecieved.integer,
		swapProposals_swapIdCounter_3_prevSalt.integer,
		swapProposals_swapIdCounter_3_commitmentExists ? 0 : 1,

		swapProposals_swapIdCounter_3_index.integer,
		swapProposals_swapIdCounter_3_path.integer,
		swapProposals_swapIdCounter_3_newOwnerPublicKey.integer,

		swapProposals_swapIdCounter_3_newSalt.integer,
		swapProposals_swapIdCounter_3_newCommitment.integer,
		generalise(utils.randomHex(31)).integer,
		[
			decompressStarlightKey(recipientPublicKey)[0]
				.integer,
			decompressStarlightKey(recipientPublicKey)[1]
				.integer,
		],
	].flat(Infinity);

	console.log(allInputs.join(' '));
	const res = await generateProof("startSwapFromErc1155ToErc1155", allInputs);
	const proof = generalise(Object.values(res.proof).flat(Infinity))
		.map((coeff) => coeff.integer)
		.flat(Infinity);
	const swapProposals_swapIdCounter_3_cipherText = res.inputs
		.slice(-16, -2)
		.map((e) => generalise(e).integer);
	const swapProposals_swapIdCounter_3_encKey = res.inputs
		.slice(-2)
		.map((e) => generalise(e).integer);

	const tokenCommit = {
		hash: tokenOwners_msgSender_tokenIdSent_2_newCommitment,
		name: "tokenOwners",
		mappingKey: tokenOwners_msgSender_tokenIdSent_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(tokenOwners_msgSender_tokenIdSent_stateVarId),
			value: tokenOwners_msgSender_tokenIdSent_change,
			salt: tokenOwners_msgSender_tokenIdSent_2_newSalt,
			publicKey: tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey,
		},
		secretKey:
			tokenOwners_msgSender_tokenIdSent_newOwnerPublicKey.integer ===
			publicKey.integer
				? secretKey
				: null,
		isNullified: false,
	}
	const backUpDataToken = encryptBackupData(
		encodeCommitmentData(tokenCommit)
	)

	const proposalCommit = {
		hash: swapProposals_swapIdCounter_3_newCommitment,
		name: "swapProposals",
		mappingKey: swapProposals_swapIdCounter_3_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(swapProposals_swapIdCounter_3_stateVarId),
			value: {
				swapAmountSent: swapProposals_swapIdCounter_3.swapAmountSent,
				swapAmountRecieved: swapProposals_swapIdCounter_3.swapAmountRecieved,
				swapTokenSentId: swapProposals_swapIdCounter_3.swapTokenSentId,
				swapTokenSentAmount: swapProposals_swapIdCounter_3.swapTokenSentAmount,
				swapTokenRecievedId: swapProposals_swapIdCounter_3.swapTokenRecievedId,
				swapTokenRecievedAmount:
					swapProposals_swapIdCounter_3.swapTokenRecievedAmount,
				swapId: swapProposals_swapIdCounter_3.swapId,
				swapSender: swapProposals_swapIdCounter_3.swapSender,
				swapReciever: swapProposals_swapIdCounter_3.swapReciever,
				erc20AddressSent: swapProposals_swapIdCounter_3.erc20AddressSent,
				erc20AddressRecieved:
					swapProposals_swapIdCounter_3.erc20AddressRecieved,
				pendingStatus: swapProposals_swapIdCounter_3.pendingStatus,
			},
			salt: swapProposals_swapIdCounter_3_newSalt,
			publicKey: swapProposals_swapIdCounter_3_newOwnerPublicKey,
		},
		secretKey:
			swapProposals_swapIdCounter_3_newOwnerPublicKey.integer ===
			sharedPublicKey.integer
				? sharedSecretKey
				: null,
		isNullified: false,
	}
	const backUpDataProposal = encryptBackupData(
		encodeCommitmentData(proposalCommit)
	)

	// Send transaction to the blockchain:

	const txData = await instance.methods
		.startSwapFromErc1155ToErc1155(
			{newNullifiers: [
				tokenOwners_msgSender_tokenIdSent_0_nullifier.integer,
				tokenOwners_msgSender_tokenIdSent_1_nullifier.integer,
				swapProposals_swapIdCounter_3_nullifier.integer,
			],
			commitmentRoot: tokenOwners_msgSender_tokenIdSent_root.integer,
			newCommitments: [
				tokenOwners_msgSender_tokenIdSent_2_newCommitment.integer,
				swapProposals_swapIdCounter_3_newCommitment.integer,
			],
			cipherText: [swapProposals_swapIdCounter_3_cipherText],
			encKeys: [swapProposals_swapIdCounter_3_encKey],
		    customInputs: [swapIdCounter.integer]},
			proof,
			[
				backUpDataProposal,
				backUpDataToken,
			]
		)
		.encodeABI();

	let txParams = {
		from: config.web3.options.defaultAccount,
		to: contractAddr,
		gas: config.web3.options.defaultGas,
		gasPrice: config.web3.options.defaultGasPrice,
		data: txData,
		chainId: await web3.eth.net.getId(),
	};

	const key = config.web3.key;

	const signed = await web3.eth.accounts.signTransaction(txParams, key);

	const sendTxn = await web3.eth.sendSignedTransaction(signed.rawTransaction);

	let tx = await instance.getPastEvents("NewLeaves");

	tx = tx[0];

	if (!tx) {
		throw new Error(
			"Tx failed - the commitment was not accepted on-chain, or the contract is not deployed."
		);
	}

	let encEvent = "";

	try {
		encEvent = await instance.getPastEvents("EncryptedData");
	} catch (err) {
		console.log("No encrypted event");
	}

	// Write new commitment preimage to db:

	await markNullified(
		generalise(tokenOwners_msgSender_tokenIdSent_0_oldCommitment._id),
		secretKey.hex(32)
	);

	await markNullified(
		generalise(tokenOwners_msgSender_tokenIdSent_1_oldCommitment._id),
		secretKey.hex(32)
	);

	await storeCommitment(tokenCommit);

	if (swapProposals_swapIdCounter_3_commitmentExists)
		await markNullified(
			swapProposals_swapIdCounter_3_currentCommitment,
			sharedSecretKey.hex(32)
		);

	// Else we always update it in markNullified

	const insertedDocument = await storeCommitment(proposalCommit);

	 if (!insertedDocument.acknowledged) {
		 logger.error(`Commitment not inserted`)
	 }

	 const [commitment] = await getCommitmentsWhere({ _id: insertedDocument.insertedId })
	return { tx, encEvent, commitment };
}
}
