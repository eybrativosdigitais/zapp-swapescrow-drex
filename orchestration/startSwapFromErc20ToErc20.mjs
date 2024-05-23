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
	getSharedSecretskeys,
} from "./common/commitment-storage.mjs";
import { generateProof } from "./common/zokrates.mjs";
import { getMembershipWitness, getRoot } from "./common/timber.mjs";
import Web3 from "./common/web3.mjs";
import {

	decompressStarlightKey,
	poseidonHash,
} from "./common/number-theory.mjs";

const { generalise } = GN;
const db = "/app/orchestration/common/db/preimage.json";
const keyDb = "/app/orchestration/common/db/key.json";

export class StartSwapFromErc20ToErc20Manager {
	constructor(web3) {
	  this.web3 = web3;
	}
  
	async init() {
		this.instance = await getContractInstance('SwapShield');
		this.contractAddr = await getContractAddress('SwapShield');
	}

 async  startSwapFromErc20ToErc20(
	_erc20AddressSent,
	_erc20AddressRecieved,
	_counterParty,
	_amountSent,
	_amountRecieved,
	_balances_msgSender_erc20AddressSent_newOwnerPublicKey = 0,
	_swapProposals_swapIdCounter_2_newOwnerPublicKey = 0,
	_balances_msgSender_erc20AddressSent_0_oldCommitment = 0,
	_balances_msgSender_erc20AddressSent_1_oldCommitment = 0
) {
	// Initialisation of variables:

	const instance = this.instance;

	const contractAddr = this.contractAddr;
    const web3 = this.web3;

	const msgSender = generalise(config.web3.options.defaultAccount);

	const msgValue = 0;
	const erc20AddressSent = generalise(_erc20AddressSent);
	const erc20AddressRecieved = generalise(_erc20AddressRecieved);
	const counterParty = generalise(_counterParty);
	const amountSent = generalise(_amountSent);
	const amountRecieved = generalise(_amountRecieved);
	let balances_msgSender_erc20AddressSent_newOwnerPublicKey = generalise(
		_balances_msgSender_erc20AddressSent_newOwnerPublicKey
	);
	let swapProposals_swapIdCounter_2_newOwnerPublicKey = generalise(
		_swapProposals_swapIdCounter_2_newOwnerPublicKey
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

	let swapIdCounter_2 = generalise(parseInt(swapIdCounter.integer, 10) + 1);

	swapIdCounter = generalise(swapIdCounter_2);

	swapIdCounter = generalise(swapIdCounter_init);

	// Initialise commitment preimage of whole state:

	let swapProposals_swapIdCounter_2_stateVarId = 47;

	const swapProposals_swapIdCounter_2_stateVarId_key = swapIdCounter_2;

	swapProposals_swapIdCounter_2_stateVarId = generalise(
		utils.mimcHash(
			[
				generalise(swapProposals_swapIdCounter_2_stateVarId).bigInt,
				swapProposals_swapIdCounter_2_stateVarId_key.bigInt,
			],
			"ALT_BN_254"
		)
	).hex(32);

	let swapProposals_swapIdCounter_2_commitmentExists = true;
	let swapProposals_swapIdCounter_2_witnessRequired = true;

	const swapProposals_swapIdCounter_2_commitment = await getCurrentWholeCommitment(
		swapProposals_swapIdCounter_2_stateVarId
	);

	let swapProposals_swapIdCounter_2_preimage = {
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
	if (!swapProposals_swapIdCounter_2_commitment) {
		swapProposals_swapIdCounter_2_commitmentExists = false;
		swapProposals_swapIdCounter_2_witnessRequired = false;
	} else {
		swapProposals_swapIdCounter_2_preimage =
			swapProposals_swapIdCounter_2_commitment.preimage;
	}

	// read preimage for decremented state

	balances_msgSender_erc20AddressSent_newOwnerPublicKey =
		_balances_msgSender_erc20AddressSent_newOwnerPublicKey === 0
			? publicKey
			: balances_msgSender_erc20AddressSent_newOwnerPublicKey;

	let balances_msgSender_erc20AddressSent_stateVarId = 9;

	const balances_msgSender_erc20AddressSent_stateVarId_key = msgSender;

	const balances_msgSender_erc20AddressSent_stateVarId_valueKey = erc20AddressSent;

	balances_msgSender_erc20AddressSent_stateVarId = generalise(
		utils.mimcHash(
			[
				generalise(balances_msgSender_erc20AddressSent_stateVarId).bigInt,
				balances_msgSender_erc20AddressSent_stateVarId_key.bigInt,
				balances_msgSender_erc20AddressSent_stateVarId_valueKey.bigInt,
			],
			"ALT_BN_254"
		)
	).hex(32);

	let balances_msgSender_erc20AddressSent_preimage = await getCommitmentsById(
		balances_msgSender_erc20AddressSent_stateVarId
	);

	const balances_msgSender_erc20AddressSent_newCommitmentValue = generalise(
		parseInt(amountSent.integer, 10)
	);
	// First check if required commitments exist or not

	let [
		balances_msgSender_erc20AddressSent_commitmentFlag,
		balances_msgSender_erc20AddressSent_0_oldCommitment,
		balances_msgSender_erc20AddressSent_1_oldCommitment,
	] = getInputCommitments(
		publicKey.hex(32),
		balances_msgSender_erc20AddressSent_newCommitmentValue.integer,
		balances_msgSender_erc20AddressSent_preimage
	);

	let balances_msgSender_erc20AddressSent_witness_0;

	let balances_msgSender_erc20AddressSent_witness_1;

	if (
		balances_msgSender_erc20AddressSent_1_oldCommitment === null &&
		balances_msgSender_erc20AddressSent_commitmentFlag
	) {
		balances_msgSender_erc20AddressSent_witness_0 = await getMembershipWitness(
			"SwapShield",
			generalise(balances_msgSender_erc20AddressSent_0_oldCommitment._id)
				.integer
		);

		const tx = await splitCommitments(
			"SwapShield",
			"balances",
			balances_msgSender_erc20AddressSent_newCommitmentValue,
			secretKey,
			publicKey,
			[9, balances_msgSender_erc20AddressSent_stateVarId_key, balances_msgSender_erc20AddressSent_stateVarId_valueKey],
			balances_msgSender_erc20AddressSent_0_oldCommitment,
			balances_msgSender_erc20AddressSent_witness_0,
			instance,
			contractAddr,
			web3
		);
		balances_msgSender_erc20AddressSent_preimage = await getCommitmentsById(
			balances_msgSender_erc20AddressSent_stateVarId
		);

		[
			balances_msgSender_erc20AddressSent_commitmentFlag,
			balances_msgSender_erc20AddressSent_0_oldCommitment,
			balances_msgSender_erc20AddressSent_1_oldCommitment,
		] = getInputCommitments(
			publicKey.hex(32),
			balances_msgSender_erc20AddressSent_newCommitmentValue.integer,
			balances_msgSender_erc20AddressSent_preimage
		);
	}

	while (balances_msgSender_erc20AddressSent_commitmentFlag === false) {
		balances_msgSender_erc20AddressSent_witness_0 = await getMembershipWitness(
			"SwapShield",
			generalise(balances_msgSender_erc20AddressSent_0_oldCommitment._id)
				.integer
		);

		balances_msgSender_erc20AddressSent_witness_1 = await getMembershipWitness(
			"SwapShield",
			generalise(balances_msgSender_erc20AddressSent_1_oldCommitment._id)
				.integer
		);

		const tx = await joinCommitments(
			"SwapShield",
			"balances",
			secretKey,
			publicKey,
			[9, balances_msgSender_erc20AddressSent_stateVarId_key, balances_msgSender_erc20AddressSent_stateVarId_valueKey],
			[
				balances_msgSender_erc20AddressSent_0_oldCommitment,
				balances_msgSender_erc20AddressSent_1_oldCommitment,
			],
			[
				balances_msgSender_erc20AddressSent_witness_0,
				balances_msgSender_erc20AddressSent_witness_1,
			],
			instance,
			contractAddr,
			web3
		);

		balances_msgSender_erc20AddressSent_preimage = await getCommitmentsById(
			balances_msgSender_erc20AddressSent_stateVarId
		);

		[
			balances_msgSender_erc20AddressSent_commitmentFlag,
			balances_msgSender_erc20AddressSent_0_oldCommitment,
			balances_msgSender_erc20AddressSent_1_oldCommitment,
		] = getInputCommitments(
			publicKey.hex(32),
			balances_msgSender_erc20AddressSent_newCommitmentValue.integer,
			balances_msgSender_erc20AddressSent_preimage
		);
	}
	const balances_msgSender_erc20AddressSent_0_prevSalt = generalise(
		balances_msgSender_erc20AddressSent_0_oldCommitment.preimage.salt
	);
	const balances_msgSender_erc20AddressSent_1_prevSalt = generalise(
		balances_msgSender_erc20AddressSent_1_oldCommitment.preimage.salt
	);
	const balances_msgSender_erc20AddressSent_0_prev = generalise(
		balances_msgSender_erc20AddressSent_0_oldCommitment.preimage.value
	);
	const balances_msgSender_erc20AddressSent_1_prev = generalise(
		balances_msgSender_erc20AddressSent_1_oldCommitment.preimage.value
	);

	// read preimage for whole state
	swapProposals_swapIdCounter_2_newOwnerPublicKey =
		_swapProposals_swapIdCounter_2_newOwnerPublicKey === 0
			? sharedPublicKey
			: swapProposals_swapIdCounter_2_newOwnerPublicKey;

	const swapProposals_swapIdCounter_2_currentCommitment = swapProposals_swapIdCounter_2_commitmentExists
		? generalise(swapProposals_swapIdCounter_2_commitment._id)
		: generalise(0);
	const swapProposals_swapIdCounter_2_prev = generalise(
		swapProposals_swapIdCounter_2_preimage.value
	);
	const swapProposals_swapIdCounter_2_prevSalt = generalise(
		swapProposals_swapIdCounter_2_preimage.salt
	);

	// Extract set membership witness:

	// generate witness for partitioned state
	balances_msgSender_erc20AddressSent_witness_0 = await getMembershipWitness(
		"SwapShield",
		generalise(balances_msgSender_erc20AddressSent_0_oldCommitment._id).integer
	);
	balances_msgSender_erc20AddressSent_witness_1 = await getMembershipWitness(
		"SwapShield",
		generalise(balances_msgSender_erc20AddressSent_1_oldCommitment._id).integer
	);
	const balances_msgSender_erc20AddressSent_0_index = generalise(
		balances_msgSender_erc20AddressSent_witness_0.index
	);
	const balances_msgSender_erc20AddressSent_1_index = generalise(
		balances_msgSender_erc20AddressSent_witness_1.index
	);
	const balances_msgSender_erc20AddressSent_root = generalise(
		balances_msgSender_erc20AddressSent_witness_0.root
	);
	const balances_msgSender_erc20AddressSent_0_path = generalise(
		balances_msgSender_erc20AddressSent_witness_0.path
	).all;
	const balances_msgSender_erc20AddressSent_1_path = generalise(
		balances_msgSender_erc20AddressSent_witness_1.path
	).all;

	// generate witness for whole state
	const swapProposals_swapIdCounter_2_emptyPath = new Array(32).fill(0);
	const swapProposals_swapIdCounter_2_witness = swapProposals_swapIdCounter_2_witnessRequired
		? await getMembershipWitness(
				"SwapShield",
				swapProposals_swapIdCounter_2_currentCommitment.integer
		  )
		: {
				index: 0,
				path: swapProposals_swapIdCounter_2_emptyPath,
				root: (await getRoot("SwapShield")) || 0,
		  };
	const swapProposals_swapIdCounter_2_index = generalise(
		swapProposals_swapIdCounter_2_witness.index
	);
	const swapProposals_swapIdCounter_2_root = generalise(
		swapProposals_swapIdCounter_2_witness.root
	);
	const swapProposals_swapIdCounter_2_path = generalise(
		swapProposals_swapIdCounter_2_witness.path
	).all;

	// increment would go here but has been filtered out

	let swapProposals_swapIdCounter_2 = {
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

	swapProposals_swapIdCounter_2 = generalise(swapProposals_swapIdCounter_2);
	swapProposals_swapIdCounter_2.swapAmountSent = generalise(
		parseInt(amountSent.integer, 10)
	);


	swapProposals_swapIdCounter_2.swapAmountRecieved = generalise(
		parseInt(amountRecieved.integer, 10)
	);

	swapProposals_swapIdCounter_2.swapId = generalise(
		parseInt(swapIdCounter_2.integer, 10)
	);


	swapProposals_swapIdCounter_2.pendingStatus = generalise(1);


	swapProposals_swapIdCounter_2.swapSender = generalise(msgSender.integer);


	swapProposals_swapIdCounter_2.swapReciever = generalise(counterParty.integer);


	swapProposals_swapIdCounter_2.erc20AddressSent = generalise(
		erc20AddressSent.integer
	);


	swapProposals_swapIdCounter_2.erc20AddressRecieved = generalise(
		erc20AddressRecieved.integer
	);

	swapProposals_swapIdCounter_2 = generalise(swapProposals_swapIdCounter_2);

	// Calculate nullifier(s):

	let balances_msgSender_erc20AddressSent_0_nullifier = poseidonHash([
		BigInt(balances_msgSender_erc20AddressSent_stateVarId),
		BigInt(secretKey.hex(32)),
		BigInt(balances_msgSender_erc20AddressSent_0_prevSalt.hex(32)),
	]);
	let balances_msgSender_erc20AddressSent_1_nullifier = poseidonHash([
		BigInt(balances_msgSender_erc20AddressSent_stateVarId),
		BigInt(secretKey.hex(32)),
		BigInt(balances_msgSender_erc20AddressSent_1_prevSalt.hex(32)),
	]);
	balances_msgSender_erc20AddressSent_0_nullifier = generalise(
		balances_msgSender_erc20AddressSent_0_nullifier.hex(32)
	); // truncate
	balances_msgSender_erc20AddressSent_1_nullifier = generalise(
		balances_msgSender_erc20AddressSent_1_nullifier.hex(32)
	); // truncate

	let swapProposals_swapIdCounter_2_nullifier = swapProposals_swapIdCounter_2_commitmentExists
		? poseidonHash([
				BigInt(swapProposals_swapIdCounter_2_stateVarId),
				BigInt(sharedSecretKey.hex(32)),
				BigInt(swapProposals_swapIdCounter_2_prevSalt.hex(32)),
		  ])
		: poseidonHash([
				BigInt(swapProposals_swapIdCounter_2_stateVarId),
				BigInt(generalise(0).hex(32)),
				BigInt(swapProposals_swapIdCounter_2_prevSalt.hex(32)),
		  ]);

	swapProposals_swapIdCounter_2_nullifier = generalise(
		swapProposals_swapIdCounter_2_nullifier.hex(32)
	); // truncate

	// Calculate commitment(s):

	const balances_msgSender_erc20AddressSent_2_newSalt = generalise(
		utils.randomHex(31)
	);

	let balances_msgSender_erc20AddressSent_change =
		parseInt(balances_msgSender_erc20AddressSent_0_prev.integer, 10) +
		parseInt(balances_msgSender_erc20AddressSent_1_prev.integer, 10) -
		parseInt(
			balances_msgSender_erc20AddressSent_newCommitmentValue.integer,
			10
		);

	balances_msgSender_erc20AddressSent_change = generalise(
		balances_msgSender_erc20AddressSent_change
	);

	let balances_msgSender_erc20AddressSent_2_newCommitment = poseidonHash([
		BigInt(balances_msgSender_erc20AddressSent_stateVarId),
		BigInt(balances_msgSender_erc20AddressSent_change.hex(32)),
		BigInt(publicKey.hex(32)),
		BigInt(balances_msgSender_erc20AddressSent_2_newSalt.hex(32)),
	]);

	balances_msgSender_erc20AddressSent_2_newCommitment = generalise(
		balances_msgSender_erc20AddressSent_2_newCommitment.hex(32)
	); // truncate

	swapProposals_swapIdCounter_2.swapAmountSent = swapProposals_swapIdCounter_2.swapAmountSent
		? swapProposals_swapIdCounter_2.swapAmountSent
		: swapProposals_swapIdCounter_2_prev.swapAmountSent;
	swapProposals_swapIdCounter_2.swapAmountRecieved = swapProposals_swapIdCounter_2.swapAmountRecieved
		? swapProposals_swapIdCounter_2.swapAmountRecieved
		: swapProposals_swapIdCounter_2_prev.swapAmountRecieved;
	swapProposals_swapIdCounter_2.swapTokenSentId = swapProposals_swapIdCounter_2.swapTokenSentId
		? swapProposals_swapIdCounter_2.swapTokenSentId
		: swapProposals_swapIdCounter_2_prev.swapTokenSentId;
	swapProposals_swapIdCounter_2.swapTokenSentAmount = swapProposals_swapIdCounter_2.swapTokenSentAmount
		? swapProposals_swapIdCounter_2.swapTokenSentAmount
		: swapProposals_swapIdCounter_2_prev.swapTokenSentAmount;
	swapProposals_swapIdCounter_2.swapTokenRecievedId = swapProposals_swapIdCounter_2.swapTokenRecievedId
		? swapProposals_swapIdCounter_2.swapTokenRecievedId
		: swapProposals_swapIdCounter_2_prev.swapTokenRecievedId;
	swapProposals_swapIdCounter_2.swapTokenRecievedAmount = swapProposals_swapIdCounter_2.swapTokenRecievedAmount
		? swapProposals_swapIdCounter_2.swapTokenRecievedAmount
		: swapProposals_swapIdCounter_2_prev.swapTokenRecievedAmount;
	swapProposals_swapIdCounter_2.swapId = swapProposals_swapIdCounter_2.swapId
		? swapProposals_swapIdCounter_2.swapId
		: swapProposals_swapIdCounter_2_prev.swapId;
	swapProposals_swapIdCounter_2.swapSender = swapProposals_swapIdCounter_2.swapSender
		? swapProposals_swapIdCounter_2.swapSender
		: swapProposals_swapIdCounter_2_prev.swapSender;
	swapProposals_swapIdCounter_2.swapReciever = swapProposals_swapIdCounter_2.swapReciever
		? swapProposals_swapIdCounter_2.swapReciever
		: swapProposals_swapIdCounter_2_prev.swapReciever;
	swapProposals_swapIdCounter_2.erc20AddressSent = swapProposals_swapIdCounter_2.erc20AddressSent
		? swapProposals_swapIdCounter_2.erc20AddressSent
		: swapProposals_swapIdCounter_2_prev.erc20AddressSent;
	swapProposals_swapIdCounter_2.erc20AddressRecieved = swapProposals_swapIdCounter_2.erc20AddressRecieved
		? swapProposals_swapIdCounter_2.erc20AddressRecieved
		: swapProposals_swapIdCounter_2_prev.erc20AddressRecieved;
	swapProposals_swapIdCounter_2.pendingStatus = swapProposals_swapIdCounter_2.pendingStatus
		? swapProposals_swapIdCounter_2.pendingStatus
		: swapProposals_swapIdCounter_2_prev.pendingStatus;

	const swapProposals_swapIdCounter_2_newSalt = generalise(utils.randomHex(31));

	let swapProposals_swapIdCounter_2_newCommitment = poseidonHash([
		BigInt(swapProposals_swapIdCounter_2_stateVarId),
		BigInt(swapProposals_swapIdCounter_2.swapAmountSent.hex(32)),
		BigInt(swapProposals_swapIdCounter_2.swapAmountRecieved.hex(32)),
		BigInt(swapProposals_swapIdCounter_2.swapTokenSentId.hex(32)),
		BigInt(swapProposals_swapIdCounter_2.swapTokenSentAmount.hex(32)),
		BigInt(swapProposals_swapIdCounter_2.swapTokenRecievedId.hex(32)),
		BigInt(swapProposals_swapIdCounter_2.swapTokenRecievedAmount.hex(32)),
		BigInt(swapProposals_swapIdCounter_2.swapId.hex(32)),
		BigInt(swapProposals_swapIdCounter_2.swapSender.hex(32)),
		BigInt(swapProposals_swapIdCounter_2.swapReciever.hex(32)),
		BigInt(swapProposals_swapIdCounter_2.erc20AddressSent.hex(32)),
		BigInt(swapProposals_swapIdCounter_2.erc20AddressRecieved.hex(32)),
		BigInt(swapProposals_swapIdCounter_2.pendingStatus.hex(32)),
		BigInt(swapProposals_swapIdCounter_2_newOwnerPublicKey.hex(32)),
		BigInt(swapProposals_swapIdCounter_2_newSalt.hex(32)),
	]);

	swapProposals_swapIdCounter_2_newCommitment = generalise(
		swapProposals_swapIdCounter_2_newCommitment.hex(32)
	); // truncate

	// Call Zokrates to generate the proof:

	const allInputs = [
		msgSender.integer,
		erc20AddressSent.integer,
		erc20AddressRecieved.integer,
		counterParty.integer,
		amountSent.integer,
		amountRecieved.integer,
		swapIdCounter.integer,
		secretKey.integer,
		secretKey.integer,

		balances_msgSender_erc20AddressSent_0_nullifier.integer,

		balances_msgSender_erc20AddressSent_1_nullifier.integer,

		balances_msgSender_erc20AddressSent_0_prev.integer,
		balances_msgSender_erc20AddressSent_0_prevSalt.integer,
		balances_msgSender_erc20AddressSent_1_prev.integer,
		balances_msgSender_erc20AddressSent_1_prevSalt.integer,
		balances_msgSender_erc20AddressSent_root.integer,
		balances_msgSender_erc20AddressSent_0_index.integer,
		balances_msgSender_erc20AddressSent_0_path.integer,
		balances_msgSender_erc20AddressSent_1_index.integer,
		balances_msgSender_erc20AddressSent_1_path.integer,
		balances_msgSender_erc20AddressSent_newOwnerPublicKey.integer,
		balances_msgSender_erc20AddressSent_2_newSalt.integer,
		balances_msgSender_erc20AddressSent_2_newCommitment.integer,

		swapProposals_swapIdCounter_2_commitmentExists
			? sharedSecretKey.integer
			: generalise(0).integer,

		swapProposals_swapIdCounter_2_nullifier.integer,

		swapProposals_swapIdCounter_2_prev.swapAmountSent.integer,
		swapProposals_swapIdCounter_2_prev.swapAmountRecieved.integer,
		swapProposals_swapIdCounter_2_prev.swapTokenSentId.integer,
		swapProposals_swapIdCounter_2_prev.swapTokenSentAmount.integer,
		swapProposals_swapIdCounter_2_prev.swapTokenRecievedId.integer,
		swapProposals_swapIdCounter_2_prev.swapTokenRecievedAmount.integer,
		swapProposals_swapIdCounter_2_prev.swapId.integer,
		swapProposals_swapIdCounter_2_prev.pendingStatus.integer,
		swapProposals_swapIdCounter_2_prev.swapSender.integer,
		swapProposals_swapIdCounter_2_prev.swapReciever.integer,
		swapProposals_swapIdCounter_2_prev.erc20AddressSent.integer,
		swapProposals_swapIdCounter_2_prev.erc20AddressRecieved.integer,
		swapProposals_swapIdCounter_2_prevSalt.integer,
		swapProposals_swapIdCounter_2_commitmentExists ? 0 : 1,

		swapProposals_swapIdCounter_2_index.integer,
		swapProposals_swapIdCounter_2_path.integer,
		swapProposals_swapIdCounter_2_newOwnerPublicKey.integer,

		swapProposals_swapIdCounter_2_newSalt.integer,
		swapProposals_swapIdCounter_2_newCommitment.integer,
		generalise(utils.randomHex(31)).integer,
		[
			decompressStarlightKey(recipientPublicKey)[0]
				.integer,
			decompressStarlightKey(recipientPublicKey)[1]
				.integer,
		],
	].flat(Infinity);

	console.log(allInputs.join(' '));
	const res = await generateProof("startSwapFromErc20ToErc20", allInputs);
	const proof = generalise(Object.values(res.proof).flat(Infinity))
		.map((coeff) => coeff.integer)
		.flat(Infinity);
	const swapProposals_swapIdCounter_2_cipherText = res.inputs
		.slice(-16, -2)
		.map((e) => generalise(e).integer);
	const swapProposals_swapIdCounter_2_encKey = res.inputs
		.slice(-2)
		.map((e) => generalise(e).integer);

	// Send transaction to the blockchain:

	const txData = await instance.methods
		.startSwapFromErc20ToErc20(
			{ newNullifiers: [
				balances_msgSender_erc20AddressSent_0_nullifier.integer,
				balances_msgSender_erc20AddressSent_1_nullifier.integer,
				swapProposals_swapIdCounter_2_nullifier.integer,
			],
			commitmentRoot: balances_msgSender_erc20AddressSent_root.integer,
			newCommitments: [
				balances_msgSender_erc20AddressSent_2_newCommitment.integer,
				swapProposals_swapIdCounter_2_newCommitment.integer,
			],
			cipherText: [swapProposals_swapIdCounter_2_cipherText],
			encKeys: [swapProposals_swapIdCounter_2_encKey],
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
		generalise(balances_msgSender_erc20AddressSent_0_oldCommitment._id),
		secretKey.hex(32)
	);

	await markNullified(
		generalise(balances_msgSender_erc20AddressSent_1_oldCommitment._id),
		secretKey.hex(32)
	);

	await storeCommitment({
		hash: balances_msgSender_erc20AddressSent_2_newCommitment,
		name: "balances",
		mappingKey: balances_msgSender_erc20AddressSent_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(balances_msgSender_erc20AddressSent_stateVarId),
			value: balances_msgSender_erc20AddressSent_change,
			salt: balances_msgSender_erc20AddressSent_2_newSalt,
			publicKey: balances_msgSender_erc20AddressSent_newOwnerPublicKey,
		},
		secretKey:
			balances_msgSender_erc20AddressSent_newOwnerPublicKey.integer ===
			publicKey.integer
				? secretKey
				: null,
		isNullified: false,
	});

	if (swapProposals_swapIdCounter_2_commitmentExists)
		await markNullified(
			swapProposals_swapIdCounter_2_currentCommitment,
			sharedSecretKey.hex(32)
		);

	// Else we always update it in markNullified

	await storeCommitment({
		hash: swapProposals_swapIdCounter_2_newCommitment,
		name: "swapProposals",
		mappingKey: swapProposals_swapIdCounter_2_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(swapProposals_swapIdCounter_2_stateVarId),
			value: {
				swapAmountSent: swapProposals_swapIdCounter_2.swapAmountSent,
				swapAmountRecieved: swapProposals_swapIdCounter_2.swapAmountRecieved,
				swapTokenSentId: swapProposals_swapIdCounter_2.swapTokenSentId,
				swapTokenSentAmount: swapProposals_swapIdCounter_2.swapTokenSentAmount,
				swapTokenRecievedId: swapProposals_swapIdCounter_2.swapTokenRecievedId,
				swapTokenRecievedAmount:
					swapProposals_swapIdCounter_2.swapTokenRecievedAmount,
				swapId: swapProposals_swapIdCounter_2.swapId,
				swapSender: swapProposals_swapIdCounter_2.swapSender,
				swapReciever: swapProposals_swapIdCounter_2.swapReciever,
				erc20AddressSent: swapProposals_swapIdCounter_2.erc20AddressSent,
				erc20AddressRecieved:
					swapProposals_swapIdCounter_2.erc20AddressRecieved,
				pendingStatus: swapProposals_swapIdCounter_2.pendingStatus,
			},
			salt: swapProposals_swapIdCounter_2_newSalt,
			publicKey: swapProposals_swapIdCounter_2_newOwnerPublicKey,
		},
		secretKey:
			swapProposals_swapIdCounter_2_newOwnerPublicKey.integer ===
			sharedPublicKey.integer
				? sharedSecretKey
				: null,
		isNullified: false,
	});

	return { tx, encEvent };
}
}
