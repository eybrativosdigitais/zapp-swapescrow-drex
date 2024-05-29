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

export class CompleteSwapFromErc1155ToErc20Manager {
	constructor(web3) {
	  this.web3 = web3;
	}
  
	async init() {
	  this.instance = await getContractInstance('SwapShield');
	  this.contractAddr = await getContractAddress('SwapShield');
	}

 async  completeSwapFromErc1155ToErc20(
	_swapId,
	_balances_counterParty_erc20Address_newOwnerPublicKey = 0,
	_balances_msgSender_erc20Address_newOwnerPublicKey = 0,
	_tokenOwners_msgSender_tokenIdRecieved_newOwnerPublicKey = 0,
	_swapProposals_swapId_newOwnerPublicKey = 0,
	_balances_msgSender_erc20Address_0_oldCommitment = 0,
	_balances_msgSender_erc20Address_1_oldCommitment = 0
) {
	// Initialisation of variables:

	const instance = this.instance;

	const contractAddr = this.contractAddr;
	const web3 =  this.web3;


	const msgSender = generalise(config.web3.options.defaultAccount);

	const msgValue = 0;
	const swapId = generalise(_swapId);
	let balances_counterParty_erc20Address_newOwnerPublicKey = generalise(
		_balances_counterParty_erc20Address_newOwnerPublicKey
	);
	let balances_msgSender_erc20Address_newOwnerPublicKey = generalise(
		_balances_msgSender_erc20Address_newOwnerPublicKey
	);
	let tokenOwners_msgSender_tokenIdRecieved_newOwnerPublicKey = generalise(
		_tokenOwners_msgSender_tokenIdRecieved_newOwnerPublicKey
	);
	let swapProposals_swapId_newOwnerPublicKey = generalise(
		_swapProposals_swapId_newOwnerPublicKey
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

	let sharedSecretKey = 0;
	let sharedPublicKey = 0;

	// Initialise commitment preimage of whole state:

	let swapProposals_swapId_stateVarId = 47;

	const swapProposals_swapId_stateVarId_key = swapId;

	swapProposals_swapId_stateVarId = generalise(
		utils.mimcHash(
			[
				generalise(swapProposals_swapId_stateVarId).bigInt,
				swapProposals_swapId_stateVarId_key.bigInt,
			],
			"ALT_BN_254"
		)
	).hex(32);

	let swapProposals_swapId_commitmentExists = true;
	let swapProposals_swapId_witnessRequired = true;

	const swapProposals_swapId_commitment = await getCurrentWholeCommitment(
		swapProposals_swapId_stateVarId
	);

	let swapProposals_swapId_preimage = {
		value: {
			swapReciever: 0,
			pendingStatus: 0,
			swapAmountRecieved: 0,
			swapTokenSentId: 0,
			swapTokenSentAmount: 0,
			erc20AddressSent: 0,
			swapSender: 0,
		},
		salt: 0,
		commitment: 0,
	};
	if (!swapProposals_swapId_commitment) {
		swapProposals_swapId_commitmentExists = false;
		swapProposals_swapId_witnessRequired = false;
	} else {
		swapProposals_swapId_preimage = swapProposals_swapId_commitment.preimage;
	}

	let swapProposals_swapId = generalise(swapProposals_swapId_preimage.value);

	let amountSent = generalise(parseInt(
		swapProposals_swapId.swapAmountRecieved.integer,
		10
	));

	let tokenRecievedAmount = generalise(parseInt(
		swapProposals_swapId.swapTokenSentAmount.integer,
		10
	));

	let tokenIdRecieved = generalise(parseInt(
		swapProposals_swapId.swapTokenSentId.integer,
		10
	));

	let counterParty = generalise(swapProposals_swapId.swapSender.integer);

	let erc20Address = generalise(swapProposals_swapId.erc20AddressSent.integer);

	// read preimage for incremented state
	if (_balances_counterParty_erc20Address_newOwnerPublicKey === 0) {
		balances_counterParty_erc20Address_newOwnerPublicKey = await this.instance.methods.zkpPublicKeys(counterParty.hex(20)).call();
		balances_counterParty_erc20Address_newOwnerPublicKey = generalise(balances_counterParty_erc20Address_newOwnerPublicKey);

		if (balances_counterParty_erc20Address_newOwnerPublicKey.length === 0) {
		  throw new Error("WARNING: Public key for given  eth address not found.");
		}

		sharedPublicKey  = getSharedSecretskeys(secretKey, balances_counterParty_erc20Address_newOwnerPublicKey);
			keys = JSON.parse(
				fs.readFileSync(keyDb, "utf-8", (err) => {
					console.log(err);
				})
			);
				 sharedSecretKey = generalise(keys.sharedSecretKey);
				 sharedPublicKey = generalise(keys.sharedPublicKey);

	  }
	let balances_counterParty_erc20Address_stateVarId = 9;

	const balances_counterParty_erc20Address_stateVarId_key = counterParty;

	const balances_counterParty_erc20Address_stateVarId_valueKey = erc20Address;

	balances_counterParty_erc20Address_stateVarId = generalise(
		utils.mimcHash(
			[
				generalise(balances_counterParty_erc20Address_stateVarId).bigInt,
				balances_counterParty_erc20Address_stateVarId_key.bigInt,
				balances_counterParty_erc20Address_stateVarId_valueKey.bigInt,
			],
			"ALT_BN_254"
		)
	).hex(32);

	const balances_counterParty_erc20Address_newCommitmentValue = generalise(
		parseInt(amountSent.integer, 10)
	);

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

	if (
		balances_msgSender_erc20Address_1_oldCommitment === null &&
		balances_msgSender_erc20Address_commitmentFlag
	) {
		balances_msgSender_erc20Address_witness_0 = await getMembershipWitness(
			"SwapShield",
			generalise(balances_msgSender_erc20Address_0_oldCommitment._id).integer
		);

		const tx = await splitCommitments(
			"SwapShield",
			"balances",
			balances_msgSender_erc20Address_newCommitmentValue,
			secretKey,
			publicKey,
			[9, balances_msgSender_erc20Address_stateVarId_key, balances_msgSender_erc20Address_stateVarId_valueKey],
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

	// read preimage for incremented state
	tokenOwners_msgSender_tokenIdRecieved_newOwnerPublicKey =
		_tokenOwners_msgSender_tokenIdRecieved_newOwnerPublicKey === 0
			? publicKey
			: tokenOwners_msgSender_tokenIdRecieved_newOwnerPublicKey;

	let tokenOwners_msgSender_tokenIdRecieved_stateVarId = 15;

	const tokenOwners_msgSender_tokenIdRecieved_stateVarId_key = msgSender;

	const tokenOwners_msgSender_tokenIdRecieved_stateVarId_valueKey = tokenIdRecieved;

	tokenOwners_msgSender_tokenIdRecieved_stateVarId = generalise(
		utils.mimcHash(
			[
				generalise(tokenOwners_msgSender_tokenIdRecieved_stateVarId).bigInt,
				tokenOwners_msgSender_tokenIdRecieved_stateVarId_key.bigInt,
				tokenOwners_msgSender_tokenIdRecieved_stateVarId_valueKey.bigInt,
			],
			"ALT_BN_254"
		)
	).hex(32);

	const tokenOwners_msgSender_tokenIdRecieved_newCommitmentValue = generalise(
		parseInt(tokenRecievedAmount.integer, 10)
	);

	// read preimage for whole state
	swapProposals_swapId_newOwnerPublicKey =
		_swapProposals_swapId_newOwnerPublicKey === 0
			? sharedPublicKey
			: swapProposals_swapId_newOwnerPublicKey;

	const swapProposals_swapId_currentCommitment = swapProposals_swapId_commitmentExists
		? generalise(swapProposals_swapId_commitment._id)
		: generalise(0);
	const swapProposals_swapId_prev = generalise(
		swapProposals_swapId_preimage.value
	);
	const swapProposals_swapId_prevSalt = generalise(
		swapProposals_swapId_preimage.salt
	);

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
	const swapProposals_swapId_emptyPath = new Array(32).fill(0);
	const swapProposals_swapId_witness = swapProposals_swapId_witnessRequired
		? await getMembershipWitness(
				"SwapShield",
				swapProposals_swapId_currentCommitment.integer
		  )
		: {
				index: 0,
				path: swapProposals_swapId_emptyPath,
				root: (await getRoot("SwapShield")) || 0,
		  };
	const swapProposals_swapId_index = generalise(
		swapProposals_swapId_witness.index
	);
	const swapProposals_swapId_root = generalise(
		swapProposals_swapId_witness.root
	);
	const swapProposals_swapId_path = generalise(
		swapProposals_swapId_witness.path
	).all;

	

	// increment would go here but has been filtered out

	// increment would go here but has been filtered out

	// increment would go here but has been filtered out

	swapProposals_swapId.pendingStatus = generalise(0);

	swapProposals_swapId = generalise(swapProposals_swapId);

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

	let swapProposals_swapId_nullifier = swapProposals_swapId_commitmentExists
		? poseidonHash([
				BigInt(swapProposals_swapId_stateVarId),
				BigInt(sharedSecretKey.hex(32)),
				BigInt(swapProposals_swapId_prevSalt.hex(32)),
		  ])
		: poseidonHash([
				BigInt(swapProposals_swapId_stateVarId),
				BigInt(generalise(0).hex(32)),
				BigInt(swapProposals_swapId_prevSalt.hex(32)),
		  ]);

	swapProposals_swapId_nullifier = generalise(
		swapProposals_swapId_nullifier.hex(32)
	); // truncate

	// Calculate commitment(s):

	const balances_counterParty_erc20Address_newSalt = generalise(
		utils.randomHex(31)
	);

	let balances_counterParty_erc20Address_newCommitment = poseidonHash([
		BigInt(balances_counterParty_erc20Address_stateVarId),
		BigInt(balances_counterParty_erc20Address_newCommitmentValue.hex(32)),
		BigInt(balances_counterParty_erc20Address_newOwnerPublicKey.hex(32)),
		BigInt(balances_counterParty_erc20Address_newSalt.hex(32)),
	]);

	balances_counterParty_erc20Address_newCommitment = generalise(
		balances_counterParty_erc20Address_newCommitment.hex(32)
	); // truncate

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

	const tokenOwners_msgSender_tokenIdRecieved_newSalt = generalise(
		utils.randomHex(31)
	);

	let tokenOwners_msgSender_tokenIdRecieved_newCommitment = poseidonHash([
		BigInt(tokenOwners_msgSender_tokenIdRecieved_stateVarId),
		BigInt(tokenOwners_msgSender_tokenIdRecieved_newCommitmentValue.hex(32)),
		BigInt(tokenOwners_msgSender_tokenIdRecieved_newOwnerPublicKey.hex(32)),
		BigInt(tokenOwners_msgSender_tokenIdRecieved_newSalt.hex(32)),
	]);

	tokenOwners_msgSender_tokenIdRecieved_newCommitment = generalise(
		tokenOwners_msgSender_tokenIdRecieved_newCommitment.hex(32)
	); // truncate

	swapProposals_swapId.swapAmountSent = swapProposals_swapId.swapAmountSent
		? swapProposals_swapId.swapAmountSent
		: swapProposals_swapId_prev.swapAmountSent;
	swapProposals_swapId.swapAmountRecieved = swapProposals_swapId.swapAmountRecieved
		? swapProposals_swapId.swapAmountRecieved
		: swapProposals_swapId_prev.swapAmountRecieved;
	swapProposals_swapId.swapTokenSentId = swapProposals_swapId.swapTokenSentId
		? swapProposals_swapId.swapTokenSentId
		: swapProposals_swapId_prev.swapTokenSentId;
	swapProposals_swapId.swapTokenSentAmount = swapProposals_swapId.swapTokenSentAmount
		? swapProposals_swapId.swapTokenSentAmount
		: swapProposals_swapId_prev.swapTokenSentAmount;
	swapProposals_swapId.swapTokenRecievedId = swapProposals_swapId.swapTokenRecievedId
		? swapProposals_swapId.swapTokenRecievedId
		: swapProposals_swapId_prev.swapTokenRecievedId;
	swapProposals_swapId.swapTokenRecievedAmount = swapProposals_swapId.swapTokenRecievedAmount
		? swapProposals_swapId.swapTokenRecievedAmount
		: swapProposals_swapId_prev.swapTokenRecievedAmount;
	swapProposals_swapId.swapId = swapProposals_swapId.swapId
		? swapProposals_swapId.swapId
		: swapProposals_swapId_prev.swapId;
	swapProposals_swapId.swapSender = swapProposals_swapId.swapSender
		? swapProposals_swapId.swapSender
		: swapProposals_swapId_prev.swapSender;
	swapProposals_swapId.swapReciever = swapProposals_swapId.swapReciever
		? swapProposals_swapId.swapReciever
		: swapProposals_swapId_prev.swapReciever;
	swapProposals_swapId.erc20AddressSent = swapProposals_swapId.erc20AddressSent
		? swapProposals_swapId.erc20AddressSent
		: swapProposals_swapId_prev.erc20AddressSent;
	swapProposals_swapId.erc20AddressRecieved = swapProposals_swapId.erc20AddressRecieved
		? swapProposals_swapId.erc20AddressRecieved
		: swapProposals_swapId_prev.erc20AddressRecieved;
	swapProposals_swapId.pendingStatus = swapProposals_swapId.pendingStatus
		? swapProposals_swapId.pendingStatus
		: swapProposals_swapId_prev.pendingStatus;

	const swapProposals_swapId_newSalt = generalise(utils.randomHex(31));

	let swapProposals_swapId_newCommitment = poseidonHash([
		BigInt(swapProposals_swapId_stateVarId),
		BigInt(swapProposals_swapId.swapAmountSent.hex(32)),
		BigInt(swapProposals_swapId.swapAmountRecieved.hex(32)),
		BigInt(swapProposals_swapId.swapTokenSentId.hex(32)),
		BigInt(swapProposals_swapId.swapTokenSentAmount.hex(32)),
		BigInt(swapProposals_swapId.swapTokenRecievedId.hex(32)),
		BigInt(swapProposals_swapId.swapTokenRecievedAmount.hex(32)),
		BigInt(swapProposals_swapId.swapId.hex(32)),
		BigInt(swapProposals_swapId.swapSender.hex(32)),
		BigInt(swapProposals_swapId.swapReciever.hex(32)),
		BigInt(swapProposals_swapId.erc20AddressSent.hex(32)),
		BigInt(swapProposals_swapId.erc20AddressRecieved.hex(32)),
		BigInt(swapProposals_swapId.pendingStatus.hex(32)),
		BigInt(swapProposals_swapId_newOwnerPublicKey.hex(32)),
		BigInt(swapProposals_swapId_newSalt.hex(32)),
	]);

	swapProposals_swapId_newCommitment = generalise(
		swapProposals_swapId_newCommitment.hex(32)
	); // truncate

	// Call Zokrates to generate the proof:

	const allInputs = [
		msgSender.integer,
		swapId.integer,

		balances_counterParty_erc20Address_newSalt.integer,
		balances_counterParty_erc20Address_newCommitment.integer,
		generalise(utils.randomHex(31)).integer,
		[
			decompressStarlightKey(
				balances_counterParty_erc20Address_newOwnerPublicKey
			)[0].integer,
			decompressStarlightKey(
				balances_counterParty_erc20Address_newOwnerPublicKey
			)[1].integer,
		],
		
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

		tokenOwners_msgSender_tokenIdRecieved_newOwnerPublicKey.integer,
		tokenOwners_msgSender_tokenIdRecieved_newSalt.integer,
		tokenOwners_msgSender_tokenIdRecieved_newCommitment.integer,

		swapProposals_swapId_commitmentExists
			? sharedSecretKey.integer
			: generalise(0).integer,

		swapProposals_swapId_nullifier.integer,

		swapProposals_swapId_prev.swapAmountSent.integer,
		swapProposals_swapId_prev.swapAmountRecieved.integer,
		swapProposals_swapId_prev.swapTokenSentId.integer,
		swapProposals_swapId_prev.swapTokenSentAmount.integer,
		swapProposals_swapId_prev.swapTokenRecievedId.integer,
		swapProposals_swapId_prev.swapTokenRecievedAmount.integer,
		swapProposals_swapId_prev.swapId.integer,
		swapProposals_swapId_prev.swapSender.integer,
		swapProposals_swapId_prev.swapReciever.integer,
		swapProposals_swapId_prev.erc20AddressSent.integer,
		swapProposals_swapId_prev.erc20AddressRecieved.integer,
		swapProposals_swapId_prev.pendingStatus.integer,
		swapProposals_swapId_prevSalt.integer,
		swapProposals_swapId_commitmentExists ? 0 : 1,

		swapProposals_swapId_index.integer,
		swapProposals_swapId_path.integer,
		swapProposals_swapId_newOwnerPublicKey.integer,
		swapProposals_swapId_newSalt.integer,
		swapProposals_swapId_newCommitment.integer,
	].flat(Infinity);
	console.log(allInputs.join(' '));
	const res = await generateProof("completeSwapFromErc1155ToErc20", allInputs);
	const proof = generalise(Object.values(res.proof).flat(Infinity))
		.map((coeff) => coeff.integer)
		.flat(Infinity);
	const balances_counterParty_erc20Address_cipherText = res.inputs
	.slice(-8, -2)
	.map((e) => generalise(e).integer);
	const balances_counterParty_erc20Address_encKey = res.inputs
		.slice(-2)
		.map((e) => generalise(e).integer);
	

	// Send transaction to the blockchain:

	const txData = await instance.methods
		.completeSwapFromErc1155ToErc20(
			{newNullifiers: [
				balances_msgSender_erc20Address_0_nullifier.integer,
				balances_msgSender_erc20Address_1_nullifier.integer,
				swapProposals_swapId_nullifier.integer,
			],
			commitmentRoot: balances_msgSender_erc20Address_root.integer,
			newCommitments:[
				balances_counterParty_erc20Address_newCommitment.integer,
				balances_msgSender_erc20Address_2_newCommitment.integer,
				tokenOwners_msgSender_tokenIdRecieved_newCommitment.integer,
				swapProposals_swapId_newCommitment.integer,
			],
			cipherText: [balances_counterParty_erc20Address_cipherText],
			encKeys: [balances_counterParty_erc20Address_encKey],
		    customInputs: []},
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

	await storeCommitment({
		hash: balances_counterParty_erc20Address_newCommitment,
		name: "balances",
		mappingKey: balances_counterParty_erc20Address_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(balances_counterParty_erc20Address_stateVarId),
			value: balances_counterParty_erc20Address_newCommitmentValue,
			salt: balances_counterParty_erc20Address_newSalt,
			publicKey: balances_counterParty_erc20Address_newOwnerPublicKey,
		},
		secretKey:
			balances_counterParty_erc20Address_newOwnerPublicKey.integer ===
			publicKey.integer
				? secretKey
				: null,
		isNullified: false,
	});

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

	await storeCommitment({
		hash: tokenOwners_msgSender_tokenIdRecieved_newCommitment,
		name: "tokenOwners",
		mappingKey: tokenOwners_msgSender_tokenIdRecieved_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(tokenOwners_msgSender_tokenIdRecieved_stateVarId),
			value: tokenOwners_msgSender_tokenIdRecieved_newCommitmentValue,
			salt: tokenOwners_msgSender_tokenIdRecieved_newSalt,
			publicKey: tokenOwners_msgSender_tokenIdRecieved_newOwnerPublicKey,
		},
		secretKey:
			tokenOwners_msgSender_tokenIdRecieved_newOwnerPublicKey.integer ===
			publicKey.integer
				? secretKey
				: null,
		isNullified: false,
	});

	if (swapProposals_swapId_commitmentExists)
		{
            swapProposals_swapId_prev.pendingStatus = swapProposals_swapId.pendingStatus;
			await markNullified(
			swapProposals_swapId_currentCommitment,
			sharedSecretKey.hex(32)
		);
}

	// Else we always update it in markNullified

	// await storeCommitment({
	// 	hash: swapProposals_swapId_newCommitment,
	// 	name: "swapProposals",
	// 	mappingKey: swapProposals_swapId_stateVarId_key.integer,
	// 	preimage: {
	// 		stateVarId: generalise(swapProposals_swapId_stateVarId),
	// 		value: {
	// 			swapAmountSent: swapProposals_swapId.swapAmountSent,
	// 			swapAmountRecieved: swapProposals_swapId.swapAmountRecieved,
	// 			swapTokenSentId: swapProposals_swapId.swapTokenSentId,
	// 			swapTokenSentAmount: swapProposals_swapId.swapTokenSentAmount,
	// 			swapTokenRecievedId: swapProposals_swapId.swapTokenRecievedId,
	// 			swapTokenRecievedAmount: swapProposals_swapId.swapTokenRecievedAmount,
	// 			swapId: swapProposals_swapId.swapId,
	// 			swapSender: swapProposals_swapId.swapSender,
	// 			swapReciever: swapProposals_swapId.swapReciever,
	// 			erc20AddressSent: swapProposals_swapId.erc20AddressSent,
	// 			erc20AddressRecieved: swapProposals_swapId.erc20AddressRecieved,
	// 			pendingStatus: swapProposals_swapId.pendingStatus,
	// 		},
	// 		salt: swapProposals_swapId_newSalt,
	// 		publicKey: swapProposals_swapId_newOwnerPublicKey,
	// 	},
	// 	secretKey:
	// 		swapProposals_swapId_newOwnerPublicKey.integer === sharedPublicKey.integer
	// 			? sharedSecretKey
	// 			: null,
	// 	isNullified: false,
	// });

	return { tx, encEvent };
}
}
