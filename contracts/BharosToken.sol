// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ╔══════════════════════════════════════════╗
 * ║         BHAROS TOKEN (BRS)               ║
 * ║         BEP-20 on BSC Mainnet            ║
 * ║         Total Supply: 1,500,000,000      ║
 * ║         3% Auto-Burn on Transfer         ║
 * ╚══════════════════════════════════════════╝
 * 
 * Features:
 * - 3% auto-burn on every transfer (deflationary)
 * - Manual burn function (owner only)
 * - Ownership management
 * - Total burned tracker
 *
 * Deploy Instructions:
 * 1. Go to https://remix.ethereum.org
 * 2. Create new file: BharosToken.sol
 * 3. Paste this code
 * 4. Compiler: 0.8.20+
 * 5. Connect MetaMask (BSC Mainnet)
 * 6. Deploy → Pay gas (~$10-20 BNB)
 */

// ═══════════════════════════════════════════
// OpenZeppelin Interfaces (built-in)
// ═══════════════════════════════════════════

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

// ═══════════════════════════════════════════
// BRS TOKEN CONTRACT (with Burn)
// ═══════════════════════════════════════════

contract BharosToken is IERC20 {

    string public constant name = "Bharos Token";
    string public constant symbol = "BRS";
    uint8  public constant decimals = 18;

    uint256 private _totalSupply;
    uint256 public totalBurned;
    address public owner;

    // 3% burn on transfers (300 = 3.00%)
    uint256 public burnRate = 300;
    uint256 private constant RATE_DENOMINATOR = 10000;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // Addresses exempt from burn (owner, liquidity pools, etc.)
    mapping(address => bool) public burnExempt;

    // ═══ EVENTS ═══
    event Burn(address indexed from, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event BurnRateUpdated(uint256 oldRate, uint256 newRate);

    // ═══ MODIFIERS ═══
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ═══ CONSTRUCTOR ═══
    constructor() {
        owner = msg.sender;

        // 1.5 Billion BRS
        _totalSupply = 1_500_000_000 * 10**18;

        // All tokens go to deployer (your MetaMask wallet)
        _balances[msg.sender] = _totalSupply;

        // Owner is exempt from burn (so you can distribute without losing 3%)
        burnExempt[msg.sender] = true;

        emit Transfer(address(0), msg.sender, _totalSupply);
    }

    // ═══ READ FUNCTIONS ═══

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    function allowance(address _owner, address spender) external view override returns (uint256) {
        return _allowances[_owner][spender];
    }

    // Circulating supply = total - burned
    function circulatingSupply() external view returns (uint256) {
        return _totalSupply;
    }

    // ═══ TRANSFER (with 3% auto-burn) ═══

    function transfer(address to, uint256 amount) external override returns (bool) {
        require(to != address(0), "Transfer to zero address");
        require(_balances[msg.sender] >= amount, "Insufficient balance");

        _executeTransfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        require(_balances[from] >= amount, "Insufficient balance");
        require(_allowances[from][msg.sender] >= amount, "Allowance exceeded");

        _allowances[from][msg.sender] -= amount;
        _executeTransfer(from, to, amount);
        return true;
    }

    // Internal transfer logic with auto-burn
    function _executeTransfer(address from, address to, uint256 amount) private {
        uint256 burnAmount = 0;
        uint256 sendAmount = amount;

        // Apply 3% burn if sender is NOT exempt
        if (!burnExempt[from] && !burnExempt[to] && burnRate > 0) {
            burnAmount = (amount * burnRate) / RATE_DENOMINATOR;
            sendAmount = amount - burnAmount;
        }

        _balances[from] -= amount;
        _balances[to] += sendAmount;

        emit Transfer(from, to, sendAmount);

        // Burn the 3%
        if (burnAmount > 0) {
            _totalSupply -= burnAmount;
            totalBurned += burnAmount;
            emit Transfer(from, address(0), burnAmount);
            emit Burn(from, burnAmount);
        }
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        require(spender != address(0), "Approve to zero address");

        _allowances[msg.sender][spender] = amount;

        emit Approval(msg.sender, spender, amount);
        return true;
    }

    // ═══ BURN FUNCTIONS ═══

    // Owner can burn tokens from own balance (for quarterly burns)
    function burn(uint256 amount) external onlyOwner {
        require(_balances[msg.sender] >= amount, "Burn exceeds balance");

        _balances[msg.sender] -= amount;
        _totalSupply -= amount;
        totalBurned += amount;

        emit Transfer(msg.sender, address(0), amount);
        emit Burn(msg.sender, amount);
    }

    // ═══ OWNER FUNCTIONS ═══

    // Set burn-exempt address (for liquidity pools, etc.)
    function setBurnExempt(address account, bool exempt) external onlyOwner {
        burnExempt[account] = exempt;
    }

    // Update burn rate (max 5%)
    function setBurnRate(uint256 newRate) external onlyOwner {
        require(newRate <= 500, "Max 5%");
        emit BurnRateUpdated(burnRate, newRate);
        burnRate = newRate;
    }

    // Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        burnExempt[owner] = false;
        owner = newOwner;
        burnExempt[newOwner] = true;
    }

    // Renounce ownership (irreversible — no more owner functions!)
    function renounceOwnership() external onlyOwner {
        emit OwnershipTransferred(owner, address(0));
        burnExempt[owner] = false;
        owner = address(0);
    }
}
