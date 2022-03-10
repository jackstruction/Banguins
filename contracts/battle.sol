// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./nft.sol";
import "./players.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./GameConstants.sol";

contract Battle is AccessControl {
    // Instance of BTokens to access balances of tokens for each player
    BTokens private tokens;
    Players private players;

    constructor(BTokens _tokens, Players _players) {
        tokens = _tokens;
        players = _players;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    modifier checkAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Must have admin role to run this function");
        _;
    }

    // Players submit their energy before a battle starts
    // In cases of disconnecting or rage quitting the energy will still be consumed
    function startBattle(address playerOne, address playerTwo, uint256 energyAmountOne, uint256 energyAmountTwo) external checkAdmin {
        // Burn tokens
        tokens.burn(playerOne, GameConstants.NRGY, energyAmountOne);
        tokens.burn(playerTwo, GameConstants.NRGY, energyAmountTwo);
    }

    // Reward CRNCY to victor and update player stats
    function endBattle(address victor, address loser) external checkAdmin {
        players.increaseWins(victor);
        players.increaseLosses(loser);
        tokens.mint(victor, GameConstants.CRNCY, GameConstants.CRNCY_WIN_AMOUNT, "");
    }
}
