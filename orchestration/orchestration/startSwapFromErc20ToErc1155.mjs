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

export class StartSwapFromErc20ToErc1155Manager {
	constructor(web3) {
	  this.web3 = web3;
	}

	async init() {
		this.instance = await getContractInstance('SwapShield');
		this.contractAddr = await getContractAddress('SwapShield');
	}

 async  startSwapFromErc20ToErc1155(
	_erc20Address,
	_counterParty,
	_amountSent,
	_tokenIdRecieved,
	_tokenRecievedAmount,
	_balances_msgSender_erc20Address_newOwnerPublicKey = 0,
	_swapProposals_swapIdCounter_1_newOwnerPublicKey = 0,
	_balances_msgSender_erc20Address_0_oldCommitment = 0,
	_balances_msgSender_erc20Address_1_oldCommitment = 0
) {
	// Initialisation of variables:

	const instance = this.instance;

	const contractAddr = this.contractAddr;
	const web3 = this.web3;

	const msgSender = generalise(config.web3.options.defaultAccount);

	const msgValue = 0;
	const erc20Address = generalise(_erc20Address);
	const counterParty = generalise(_counterParty);
	const amountSent = generalise(_amountSent);
	const tokenIdRecieved = generalise(_tokenIdRecieved);
	const tokenRecievedAmount = generalise(_tokenRecievedAmount);
	let balances_msgSender_erc20Address_newOwnerPublicKey = generalise(
		_balances_msgSender_erc20Address_newOwnerPublicKey
	);
	let swapProposals_swapIdCounter_1_newOwnerPublicKey = generalise(
		_swapProposals_swapIdCounter_1_newOwnerPublicKey
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
			 let sharedPublicKey =  await getSharedSecretskeys(counterParty, recipientPublicKey);
			  keys = JSON.parse(
				fs.readFileSync(keyDb, "utf-8", (err) => {
					console.log(err);
				})
			);
				let sharedSecretKey = generalise(keys.sharedSecretKey);
				 sharedPublicKey = generalise(keys.sharedPublicKey);

	console.log('recipientPublicKey:', recipientPublicKey);
	console.log(sharedPublicKey);

	let swapIdCounter = generalise(await instance.methods.swapIdCounter().call());
	let swapIdCounter_init = swapIdCounter;

	let swapIdCounter_1 = generalise(parseInt(swapIdCounter.integer, 10) + 1);

	swapIdCounter = generalise(swapIdCounter_1);

	swapIdCounter = generalise(swapIdCounter_init);

	// Initialise commitment preimage of whole state:

	let swapProposals_swapIdCounter_1_stateVarId = 47;

	const swapProposals_swapIdCounter_1_stateVarId_key = swapIdCounter_1;

	swapProposals_swapIdCounter_1_stateVarId = generalise(
		utils.mimcHash(
			[
				generalise(swapProposals_swapIdCounter_1_stateVarId).bigInt,
				swapProposals_swapIdCounter_1_stateVarId_key.bigInt,
			],
			"ALT_BN_254"
		)
	).hex(32);

	let swapProposals_swapIdCounter_1_commitmentExists = true;
	let swapProposals_swapIdCounter_1_witnessRequired = true;

	const swapProposals_swapIdCounter_1_commitment = await getCurrentWholeCommitment(
		swapProposals_swapIdCounter_1_stateVarId
	);

	let swapProposals_swapIdCounter_1_preimage = {
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
	if (!swapProposals_swapIdCounter_1_commitment) {
		swapProposals_swapIdCounter_1_commitmentExists = false;
		swapProposals_swapIdCounter_1_witnessRequired = false;
	} else {
		swapProposals_swapIdCounter_1_preimage =
			swapProposals_swapIdCounter_1_commitment.preimage;
	}

	// read preimage for decremented state

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

	let balances_msgSender_erc20Address_preimage = await getCommitmentsById(
		balances_msgSender_erc20Address_stateVarId
	);

	const balances_msgSender_erc20Address_newCommitmentValue = generalise(
		parseInt(amountSent.integer, 10)
	);
	// First check if required commitments exist or not

	let [
		balances_msgSender_erc20Address_commitmentFlag,
		balances_msgSender_erc20Address_0_oldCommitment,
		balances_msgSender_erc20Address_1_oldCommitment,
	] = getInputCommitments(
		publicKey.hex(32),
		balances_msgSender_erc20Address_newCommitmentValue.integer,
		balances_msgSender_erc20Address_preimage
	);

	let balances_msgSender_erc20Address_witness_0;

	let balances_msgSender_erc20Address_witness_1;

	console.log('commitment_0:', balances_msgSender_erc20Address_0_oldCommitment);

	if (
		balances_msgSender_erc20Address_1_oldCommitment === null &&
		balances_msgSender_erc20Address_commitmentFlag
	) {
		balances_msgSender_erc20Address_witness_0 = await getMembershipWitness(
			"SwapShield",
			generalise(balances_msgSender_erc20Address_0_oldCommitment._id).integer
		);

	console.log('Commitment:', balances_msgSender_erc20Address_0_oldCommitment);
	console.log('witness:', balances_msgSender_erc20Address_witness_0);

		const tx = await splitCommitments(
			"SwapShield",
			"balances",
			balances_msgSender_erc20Address_newCommitmentValue,
			secretKey,
			publicKey,
			[9, balances_msgSender_erc20Address_stateVarId_key, balances_msgSender_erc20Address_stateVarId_valueKey ],
			balances_msgSender_erc20Address_0_oldCommitment,
			balances_msgSender_erc20Address_witness_0,
			instance,
			contractAddr,
			web3
		);
		balances_msgSender_erc20Address_preimage = await getCommitmentsById(
			balances_msgSender_erc20Address_stateVarId
		);

		[
			balances_msgSender_erc20Address_commitmentFlag,
			balances_msgSender_erc20Address_0_oldCommitment,
			balances_msgSender_erc20Address_1_oldCommitment,
		] = getInputCommitments(
			publicKey.hex(32),
			balances_msgSender_erc20Address_newCommitmentValue.integer,
			balances_msgSender_erc20Address_preimage
		);
	}

	while (balances_msgSender_erc20Address_commitmentFlag === false) {
		balances_msgSender_erc20Address_witness_0 = await getMembershipWitness(
			"SwapShield",
			generalise(balances_msgSender_erc20Address_0_oldCommitment._id).integer
		);

		balances_msgSender_erc20Address_witness_1 = await getMembershipWitness(
			"SwapShield",
			generalise(balances_msgSender_erc20Address_1_oldCommitment._id).integer
		);

		const tx = await joinCommitments(
			"SwapShield",
			"balances",
			secretKey,
			publicKey,
			[9, balances_msgSender_erc20Address_stateVarId_key, balances_msgSender_erc20Address_stateVarId_valueKey],
			[
				balances_msgSender_erc20Address_0_oldCommitment,
				balances_msgSender_erc20Address_1_oldCommitment,
			],
			[
				balances_msgSender_erc20Address_witness_0,
				balances_msgSender_erc20Address_witness_1,
			],
			instance,
			contractAddr,
			web3
		);

		balances_msgSender_erc20Address_preimage = await getCommitmentsById(
			balances_msgSender_erc20Address_stateVarId
		);

		[
			balances_msgSender_erc20Address_commitmentFlag,
			balances_msgSender_erc20Address_0_oldCommitment,
			balances_msgSender_erc20Address_1_oldCommitment,
		] = getInputCommitments(
			publicKey.hex(32),
			balances_msgSender_erc20Address_newCommitmentValue.integer,
			balances_msgSender_erc20Address_preimage
		);
	}
	const balances_msgSender_erc20Address_0_prevSalt = generalise(
		balances_msgSender_erc20Address_0_oldCommitment.preimage.salt
	);
	const balances_msgSender_erc20Address_1_prevSalt = generalise(
		balances_msgSender_erc20Address_1_oldCommitment.preimage.salt
	);
	const balances_msgSender_erc20Address_0_prev = generalise(
		balances_msgSender_erc20Address_0_oldCommitment.preimage.value
	);
	const balances_msgSender_erc20Address_1_prev = generalise(
		balances_msgSender_erc20Address_1_oldCommitment.preimage.value
	);

	// read preimage for whole state
	swapProposals_swapIdCounter_1_newOwnerPublicKey =
		_swapProposals_swapIdCounter_1_newOwnerPublicKey === 0
			? sharedPublicKey
			: swapProposals_swapIdCounter_1_newOwnerPublicKey;

	const swapProposals_swapIdCounter_1_currentCommitment = swapProposals_swapIdCounter_1_commitmentExists
		? generalise(swapProposals_swapIdCounter_1_commitment._id)
		: generalise(0);
	const swapProposals_swapIdCounter_1_prev = generalise(
		swapProposals_swapIdCounter_1_preimage.value
	);
	const swapProposals_swapIdCounter_1_prevSalt = generalise(
		swapProposals_swapIdCounter_1_preimage.salt
	);

	console.log('swapProposals_swapIdCounter_1_prev :', swapProposals_swapIdCounter_1_prev);

	// Extract set membership witness:

	// generate witness for partitioned state
	balances_msgSender_erc20Address_witness_0 = await getMembershipWitness(
		"SwapShield",
		generalise(balances_msgSender_erc20Address_0_oldCommitment._id).integer
	);
	balances_msgSender_erc20Address_witness_1 = await getMembershipWitness(
		"SwapShield",
		generalise(balances_msgSender_erc20Address_1_oldCommitment._id).integer
	);
	const balances_msgSender_erc20Address_0_index = generalise(
		balances_msgSender_erc20Address_witness_0.index
	);
	const balances_msgSender_erc20Address_1_index = generalise(
		balances_msgSender_erc20Address_witness_1.index
	);
	const balances_msgSender_erc20Address_root = generalise(
		balances_msgSender_erc20Address_witness_0.root
	);
	const balances_msgSender_erc20Address_0_path = generalise(
		balances_msgSender_erc20Address_witness_0.path
	).all;
	const balances_msgSender_erc20Address_1_path = generalise(
		balances_msgSender_erc20Address_witness_1.path
	).all;

	// generate witness for whole state
	const swapProposals_swapIdCounter_1_emptyPath = new Array(32).fill(0);
	const swapProposals_swapIdCounter_1_witness = swapProposals_swapIdCounter_1_witnessRequired
		? await getMembershipWitness(
				"SwapShield",
				swapProposals_swapIdCounter_1_currentCommitment.integer
		  )
		: {
				index: 0,
				path: swapProposals_swapIdCounter_1_emptyPath,
				root: (await getRoot("SwapShield")) || 0,
		  };
	const swapProposals_swapIdCounter_1_index = generalise(
		swapProposals_swapIdCounter_1_witness.index
	);
	const swapProposals_swapIdCounter_1_root = generalise(
		swapProposals_swapIdCounter_1_witness.root
	);
	const swapProposals_swapIdCounter_1_path = generalise(
		swapProposals_swapIdCounter_1_witness.path
	).all;

	// increment would go here but has been filtered out

	let swapProposals_swapIdCounter_1 = {
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
			erc20AddressRecieved:0,
	};
	swapProposals_swapIdCounter_1 = generalise(swapProposals_swapIdCounter_1);
	swapProposals_swapIdCounter_1.swapAmountSent = generalise(
		parseInt(amountSent.integer, 10)
	);


	swapProposals_swapIdCounter_1.swapTokenRecievedId = generalise(
		parseInt(tokenIdRecieved.integer, 10)
	);


	swapProposals_swapIdCounter_1.swapTokenRecievedAmount = generalise(
		parseInt(tokenRecievedAmount.integer, 10)
	);


	swapProposals_swapIdCounter_1.swapId = generalise(
		parseInt(swapIdCounter_1.integer, 10)
	);

	swapProposals_swapIdCounter_1.pendingStatus = generalise(1);

	swapProposals_swapIdCounter_1.swapSender = generalise(msgSender.integer);


	swapProposals_swapIdCounter_1.swapReciever = generalise(counterParty.integer);


	swapProposals_swapIdCounter_1.erc20AddressSent = generalise(
		erc20Address.integer
	);
console.log('swapProposals_swapIdCounter_1 :', swapProposals_swapIdCounter_1);
	swapProposals_swapIdCounter_1 = generalise(swapProposals_swapIdCounter_1);

	// Calculate nullifier(s):

	let balances_msgSender_erc20Address_0_nullifier = poseidonHash([
		BigInt(balances_msgSender_erc20Address_stateVarId),
		BigInt(secretKey.hex(32)),
		BigInt(balances_msgSender_erc20Address_0_prevSalt.hex(32)),
	]);
	let balances_msgSender_erc20Address_1_nullifier = poseidonHash([
		BigInt(balances_msgSender_erc20Address_stateVarId),
		BigInt(secretKey.hex(32)),
		BigInt(balances_msgSender_erc20Address_1_prevSalt.hex(32)),
	]);
	balances_msgSender_erc20Address_0_nullifier = generalise(
		balances_msgSender_erc20Address_0_nullifier.hex(32)
	); // truncate
	balances_msgSender_erc20Address_1_nullifier = generalise(
		balances_msgSender_erc20Address_1_nullifier.hex(32)
	); // truncate

	let swapProposals_swapIdCounter_1_nullifier = swapProposals_swapIdCounter_1_commitmentExists
		? poseidonHash([
				BigInt(swapProposals_swapIdCounter_1_stateVarId),
				BigInt(secretKey.hex(32)),
				BigInt(swapProposals_swapIdCounter_1_prevSalt.hex(32)),
		  ])
		: poseidonHash([
				BigInt(swapProposals_swapIdCounter_1_stateVarId),
				BigInt(generalise(0).hex(32)),
				BigInt(swapProposals_swapIdCounter_1_prevSalt.hex(32)),
		  ]);

	swapProposals_swapIdCounter_1_nullifier = generalise(
		swapProposals_swapIdCounter_1_nullifier.hex(32)
	); // truncate

	// Calculate commitment(s):

	const balances_msgSender_erc20Address_2_newSalt = generalise(
		utils.randomHex(31)
	);

	let balances_msgSender_erc20Address_change =
		parseInt(balances_msgSender_erc20Address_0_prev.integer, 10) +
		parseInt(balances_msgSender_erc20Address_1_prev.integer, 10) -
		parseInt(balances_msgSender_erc20Address_newCommitmentValue.integer, 10);

	balances_msgSender_erc20Address_change = generalise(
		balances_msgSender_erc20Address_change
	);

	let balances_msgSender_erc20Address_2_newCommitment = poseidonHash([
		BigInt(balances_msgSender_erc20Address_stateVarId),
		BigInt(balances_msgSender_erc20Address_change.hex(32)),
		BigInt(publicKey.hex(32)),
		BigInt(balances_msgSender_erc20Address_2_newSalt.hex(32)),
	]);

	balances_msgSender_erc20Address_2_newCommitment = generalise(
		balances_msgSender_erc20Address_2_newCommitment.hex(32)
	); // truncate

	swapProposals_swapIdCounter_1.swapAmountSent = swapProposals_swapIdCounter_1.swapAmountSent
		? swapProposals_swapIdCounter_1.swapAmountSent
		: swapProposals_swapIdCounter_1_prev.swapAmountSent;
	swapProposals_swapIdCounter_1.swapAmountRecieved = swapProposals_swapIdCounter_1.swapAmountRecieved
		? swapProposals_swapIdCounter_1.swapAmountRecieved
		: swapProposals_swapIdCounter_1_prev.swapAmountRecieved;
	console.log('Here ------->', swapProposals_swapIdCounter_1.swapAmountRecieved )
	swapProposals_swapIdCounter_1.swapTokenSentId = swapProposals_swapIdCounter_1.swapTokenSentId
		? swapProposals_swapIdCounter_1.swapTokenSentId
		: swapProposals_swapIdCounter_1_prev.swapTokenSentId;
	swapProposals_swapIdCounter_1.swapTokenSentAmount = swapProposals_swapIdCounter_1.swapTokenSentAmount
		? swapProposals_swapIdCounter_1.swapTokenSentAmount
		: swapProposals_swapIdCounter_1_prev.swapTokenSentAmount;
	swapProposals_swapIdCounter_1.swapTokenRecievedId = swapProposals_swapIdCounter_1.swapTokenRecievedId
		? swapProposals_swapIdCounter_1.swapTokenRecievedId
		: swapProposals_swapIdCounter_1_prev.swapTokenRecievedId;
	swapProposals_swapIdCounter_1.swapTokenRecievedAmount = swapProposals_swapIdCounter_1.swapTokenRecievedAmount
		? swapProposals_swapIdCounter_1.swapTokenRecievedAmount
		: swapProposals_swapIdCounter_1_prev.swapTokenRecievedAmount;
	swapProposals_swapIdCounter_1.swapId = swapProposals_swapIdCounter_1.swapId
		? swapProposals_swapIdCounter_1.swapId
		: swapProposals_swapIdCounter_1_prev.swapId;
	swapProposals_swapIdCounter_1.swapSender = swapProposals_swapIdCounter_1.swapSender
		? swapProposals_swapIdCounter_1.swapSender
		: swapProposals_swapIdCounter_1_prev.swapSender;
	swapProposals_swapIdCounter_1.swapReciever = swapProposals_swapIdCounter_1.swapReciever
		? swapProposals_swapIdCounter_1.swapReciever
		: swapProposals_swapIdCounter_1_prev.swapReciever;
	swapProposals_swapIdCounter_1.erc20AddressSent = swapProposals_swapIdCounter_1.erc20AddressSent
		? swapProposals_swapIdCounter_1.erc20AddressSent
		: swapProposals_swapIdCounter_1_prev.erc20AddressSent;
	swapProposals_swapIdCounter_1.erc20AddressRecieved = swapProposals_swapIdCounter_1.erc20AddressRecieved
		? swapProposals_swapIdCounter_1.erc20AddressRecieved
		: swapProposals_swapIdCounter_1_prev.erc20AddressRecieved;
	swapProposals_swapIdCounter_1.pendingStatus = swapProposals_swapIdCounter_1.pendingStatus
		? swapProposals_swapIdCounter_1.pendingStatus
		: swapProposals_swapIdCounter_1_prev.pendingStatus;

	const swapProposals_swapIdCounter_1_newSalt = generalise(utils.randomHex(31));

	let swapProposals_swapIdCounter_1_newCommitment = poseidonHash([
		BigInt(swapProposals_swapIdCounter_1_stateVarId),
		BigInt(swapProposals_swapIdCounter_1.swapAmountSent.hex(32)),
		BigInt(swapProposals_swapIdCounter_1.swapAmountRecieved.hex(32)),
		BigInt(swapProposals_swapIdCounter_1.swapTokenSentId.hex(32)),
		BigInt(swapProposals_swapIdCounter_1.swapTokenSentAmount.hex(32)),
		BigInt(swapProposals_swapIdCounter_1.swapTokenRecievedId.hex(32)),
		BigInt(swapProposals_swapIdCounter_1.swapTokenRecievedAmount.hex(32)),
		BigInt(swapProposals_swapIdCounter_1.swapId.hex(32)),
		BigInt(swapProposals_swapIdCounter_1.swapSender.hex(32)),
		BigInt(swapProposals_swapIdCounter_1.swapReciever.hex(32)),
		BigInt(swapProposals_swapIdCounter_1.erc20AddressSent.hex(32)),
		BigInt(swapProposals_swapIdCounter_1.erc20AddressRecieved.hex(32)),
		BigInt(swapProposals_swapIdCounter_1.pendingStatus.hex(32)),
		BigInt(swapProposals_swapIdCounter_1_newOwnerPublicKey.hex(32)),
		BigInt(swapProposals_swapIdCounter_1_newSalt.hex(32)),
	]);

	swapProposals_swapIdCounter_1_newCommitment = generalise(
		swapProposals_swapIdCounter_1_newCommitment.hex(32)
	); // truncate

	// Call Zokrates to generate the proof:

	const allInputs = [
		msgSender.integer,
		erc20Address.integer,
		counterParty.integer,
		amountSent.integer,
		tokenIdRecieved.integer,
		tokenRecievedAmount.integer,
		swapIdCounter.integer,
		secretKey.integer,
		secretKey.integer,

		balances_msgSender_erc20Address_0_nullifier.integer,

		balances_msgSender_erc20Address_1_nullifier.integer,

		balances_msgSender_erc20Address_0_prev.integer,
		balances_msgSender_erc20Address_0_prevSalt.integer,
		balances_msgSender_erc20Address_1_prev.integer,
		balances_msgSender_erc20Address_1_prevSalt.integer,
		balances_msgSender_erc20Address_root.integer,
		balances_msgSender_erc20Address_0_index.integer,
		balances_msgSender_erc20Address_0_path.integer,
		balances_msgSender_erc20Address_1_index.integer,
		balances_msgSender_erc20Address_1_path.integer,
		balances_msgSender_erc20Address_newOwnerPublicKey.integer,
		balances_msgSender_erc20Address_2_newSalt.integer,
		balances_msgSender_erc20Address_2_newCommitment.integer,

		swapProposals_swapIdCounter_1_commitmentExists
			? sharedSecretKey.integer
			: generalise(0).integer,

		swapProposals_swapIdCounter_1_nullifier.integer,

		swapProposals_swapIdCounter_1_prev.swapAmountSent.integer,
		swapProposals_swapIdCounter_1_prev.swapAmountRecieved.integer,
		swapProposals_swapIdCounter_1_prev.swapTokenSentId.integer,
		swapProposals_swapIdCounter_1_prev.swapTokenSentAmount.integer,
		swapProposals_swapIdCounter_1_prev.swapTokenRecievedId.integer,
		swapProposals_swapIdCounter_1_prev.swapTokenRecievedAmount.integer,
		swapProposals_swapIdCounter_1_prev.swapId.integer,
		swapProposals_swapIdCounter_1_prev.pendingStatus.integer,
		swapProposals_swapIdCounter_1_prev.swapSender.integer,
		swapProposals_swapIdCounter_1_prev.swapReciever.integer,
		swapProposals_swapIdCounter_1_prev.erc20AddressSent.integer,
		swapProposals_swapIdCounter_1_prev.erc20AddressRecieved.integer,
		swapProposals_swapIdCounter_1_prevSalt.integer,
		swapProposals_swapIdCounter_1_commitmentExists ? 0 : 1,

		swapProposals_swapIdCounter_1_index.integer,
		swapProposals_swapIdCounter_1_path.integer,
		swapProposals_swapIdCounter_1_newOwnerPublicKey.integer,

		swapProposals_swapIdCounter_1_newSalt.integer,
		swapProposals_swapIdCounter_1_newCommitment.integer,
		generalise(utils.randomHex(31)).integer,
		[
			decompressStarlightKey(recipientPublicKey)[0]
				.integer,
			decompressStarlightKey(recipientPublicKey)[1]
				.integer,
		],
	].flat(Infinity);
	console.log(allInputs.join(' '));
	const res = await generateProof("startSwapFromErc20ToErc1155", allInputs);
	const proof = generalise(Object.values(res.proof).flat(Infinity))
		.map((coeff) => coeff.integer)
		.flat(Infinity);
	const swapProposals_swapIdCounter_1_cipherText = res.inputs
		.slice(-16, -2)
		.map((e) => generalise(e).integer);
		console.log("swapProposals_swapIdCounter_1_cipherText:", swapProposals_swapIdCounter_1_cipherText);
	console.log('length:',swapProposals_swapIdCounter_1_cipherText.length);
	const swapProposals_swapIdCounter_1_encKey = res.inputs
		.slice(-2)
		.map((e) => generalise(e).integer);

	// Send transaction to the blockchain:

	const txData = await instance.methods
		.startSwapFromErc20ToErc1155(
			{newNullifiers:[
				balances_msgSender_erc20Address_0_nullifier.integer,
				balances_msgSender_erc20Address_1_nullifier.integer,
				swapProposals_swapIdCounter_1_nullifier.integer,
			],
			commitmentRoot: balances_msgSender_erc20Address_root.integer,
			newCommitments: [
				balances_msgSender_erc20Address_2_newCommitment.integer,
				swapProposals_swapIdCounter_1_newCommitment.integer,
			],
			cipherText: [swapProposals_swapIdCounter_1_cipherText],
			encKeys: [swapProposals_swapIdCounter_1_encKey],
			customInputs: [swapIdCounter.integer],},
			proof
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
		generalise(balances_msgSender_erc20Address_0_oldCommitment._id),
		secretKey.hex(32)
	);

	await markNullified(
		generalise(balances_msgSender_erc20Address_1_oldCommitment._id),
		secretKey.hex(32)
	);

	await storeCommitment({
		hash: balances_msgSender_erc20Address_2_newCommitment,
		name: "balances",
		mappingKey: balances_msgSender_erc20Address_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(balances_msgSender_erc20Address_stateVarId),
			value: balances_msgSender_erc20Address_change,
			salt: balances_msgSender_erc20Address_2_newSalt,
			publicKey: balances_msgSender_erc20Address_newOwnerPublicKey,
		},
		secretKey:
			balances_msgSender_erc20Address_newOwnerPublicKey.integer ===
			publicKey.integer
				? secretKey
				: null,
		isNullified: false,
	});

	if (swapProposals_swapIdCounter_1_commitmentExists)
		await markNullified(
			swapProposals_swapIdCounter_1_currentCommitment,
			sharedSecretKey.hex(32)
		);

	// Else we always update it in markNullified

	const insertedDocument = await storeCommitment({
		hash: swapProposals_swapIdCounter_1_newCommitment,
		name: "swapProposals",
		mappingKey: swapProposals_swapIdCounter_1_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(swapProposals_swapIdCounter_1_stateVarId),
			value: {
				swapAmountSent: swapProposals_swapIdCounter_1.swapAmountSent,
				swapAmountRecieved: swapProposals_swapIdCounter_1.swapAmountRecieved,
				swapTokenSentId: swapProposals_swapIdCounter_1.swapTokenSentId,
				swapTokenSentAmount: swapProposals_swapIdCounter_1.swapTokenSentAmount,
				swapTokenRecievedId: swapProposals_swapIdCounter_1.swapTokenRecievedId,
				swapTokenRecievedAmount:
					swapProposals_swapIdCounter_1.swapTokenRecievedAmount,
				swapId: swapProposals_swapIdCounter_1.swapId,
				swapSender: swapProposals_swapIdCounter_1.swapSender,
				swapReciever: swapProposals_swapIdCounter_1.swapReciever,
				erc20AddressSent: swapProposals_swapIdCounter_1.erc20AddressSent,
				erc20AddressRecieved:
					swapProposals_swapIdCounter_1.erc20AddressRecieved,
				pendingStatus: swapProposals_swapIdCounter_1.pendingStatus,
			},
			salt: swapProposals_swapIdCounter_1_newSalt,
			publicKey: swapProposals_swapIdCounter_1_newOwnerPublicKey,
		},
		secretKey:
			swapProposals_swapIdCounter_1_newOwnerPublicKey.integer ===
			sharedPublicKey.integer
				? sharedSecretKey
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
