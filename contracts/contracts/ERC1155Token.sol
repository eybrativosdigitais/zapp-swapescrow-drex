// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract ERC1155Token is ERC1155 {
    constructor() ERC1155("https://erc1155tokens/{id}.json") {
        _mint(0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0, 101, 300, "");
        _mint(0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0, 102, 300, "");
        _mint(0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0, 103, 100, "");

        _mint(0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1, 101, 300, "");
        _mint(0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1, 102, 300, "");
        _mint(0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1, 103, 100, "");
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data) public {
        _mint(account, id, amount, data);
    }
}
