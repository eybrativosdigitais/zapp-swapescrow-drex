

import {
	service_allCommitments,
	service_getCommitmentsByState,
	service_reinstateNullifiers,
	service_getBalance,
	service_getBalanceByState,
	service_getSharedKeys,
	service_timberProxy,
	service_getZKPPublicKey,
	service_verify,
	service_balanceOfToken,
	service_getSwaps, service_shieldedBalance, service_getParsedCommitments,
} from "./api_services.mjs"

import express from "express";

export class Router {
	constructor(serviceMgr) {
	  this.serviceMgr = serviceMgr;
	}

	addRoutes() {
		const router = express.Router();

		router.post(
		  '/depositErc20',
		  this.serviceMgr.service_depositErc20.bind(this.serviceMgr),
		);

		// eslint-disable-next-line func-names
router.post('/depositErc1155', this.serviceMgr.service_depositErc1155.bind(this.serviceMgr),);

// eslint-disable-next-line func-names
router.post(
	"/startSwapFromErc20ToErc1155",
	this.serviceMgr.service_startSwapFromErc20ToErc1155.bind(this.serviceMgr)
);

// eslint-disable-next-line func-names
router.post("/startSwapFromErc20ToErc20", this.serviceMgr.service_startSwapFromErc20ToErc20.bind(this.serviceMgr));

// eslint-disable-next-line func-names
router.post(
	"/startSwapFromErc1155ToErc1155",
	this.serviceMgr.service_startSwapFromErc1155ToErc1155.bind(this.serviceMgr)
);

// eslint-disable-next-line func-names
router.post(
	"/startSwapFromErc1155ToErc20",
	this.serviceMgr.service_startSwapFromErc1155ToErc20.bind(this.serviceMgr)
);

// eslint-disable-next-line func-names
router.post(
	"/completeSwapFromErc20ToErc1155",
	this.serviceMgr.service_completeSwapFromErc20ToErc1155.bind(this.serviceMgr)
);

// eslint-disable-next-line func-names
router.post(
	"/completeSwapFromErc1155ToErc20",
	this.serviceMgr.service_completeSwapFromErc1155ToErc20.bind(this.serviceMgr)
);

// eslint-disable-next-line func-names
router.post(
	"/completeSwapFromErc20ToErc20",
	this.serviceMgr.service_completeSwapFromErc20ToErc20.bind(this.serviceMgr)
);

// eslint-disable-next-line func-names
router.post(
	"/completeSwapFromErc1155ToErc1155",
	this.serviceMgr.service_completeSwapFromErc1155ToErc1155.bind(this.serviceMgr)
);

// eslint-disable-next-line func-names
router.post("/cancelSwap", this.serviceMgr.service_cancelSwap.bind(this.serviceMgr));

// eslint-disable-next-line func-names
router.post("/withdrawErc20", this.serviceMgr.service_withdrawErc20.bind(this.serviceMgr));

// eslint-disable-next-line func-names
router.post("/withdrawErc1155", this.serviceMgr.service_withdrawErc1155.bind(this.serviceMgr));

// commitment getter routes
router.get("/getAllCommitments", service_allCommitments);
router.get("/getCommitmentsByVariableName", service_getCommitmentsByState);
router.get("/getBalance", service_getBalance);
router.get("/getBalanceByState", service_getBalanceByState);
router.get("/getSharedKeys", service_getSharedKeys);

		// Debugging utils
		router.use("/timber", service_timberProxy);
		router.get("/getZKPPublicKey/:address", service_getZKPPublicKey);
		router.get("/parsedCommitment", service_getParsedCommitments);
		router.post("/verify", service_verify);
		router.get("/token-balance", service_balanceOfToken);
		router.get("/shielded-balance", service_shieldedBalance);
		router.get('/swap', service_getSwaps)

		return router;
	  }
	}



