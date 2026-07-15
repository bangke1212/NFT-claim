// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TestNFT {
    string public name = "Test NFT Claim";
    string public symbol = "TNFT";
    uint256 public totalSupply;
    uint256 public maxSupply = 100;
    uint256 public price;
    bool public paused;
    bool public saleActive = true;
    uint256 public maxPerWallet = 5;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public minted;
    
    event Claimed(address indexed to, uint256 amount);
    
    modifier whenNotPaused() { require(!paused, "Paused"); _; }
    modifier saleIsActive() { require(saleActive, "Sale not active"); _; }
    
    // === FREE CLAIM (whitelist style) ===
    function claim() external whenNotPaused saleIsActive {
        _mint(msg.sender, 1);
    }
    
    function claim(uint256 amount) external whenNotPaused saleIsActive {
        require(amount > 0 && amount <= 10, "Amount 1-10");
        require(minted[msg.sender] + amount <= maxPerWallet, "Exceeds max per wallet");
        _mint(msg.sender, amount);
    }
    
    function claim(address to, uint256 amount) external whenNotPaused saleIsActive {
        require(amount > 0 && amount <= 10, "Amount 1-10");
        _mint(to, amount);
    }
    
    // === FREE MINT ===
    function freeMint() external whenNotPaused saleIsActive {
        _mint(msg.sender, 1);
    }
    
    function freeMint(uint256 amount) external whenNotPaused saleIsActive {
        require(amount > 0 && amount <= 10, "Amount 1-10");
        _mint(msg.sender, amount);
    }
    
    // === PAID MINT ===
    function mint(uint256 amount) external payable whenNotPaused saleIsActive {
        require(msg.value >= price * amount, "Insufficient payment");
        _mint(msg.sender, amount);
    }
    
    function publicMint(uint256 amount) external payable whenNotPaused saleIsActive {
        require(msg.value >= price * amount, "Insufficient payment");
        _mint(msg.sender, amount);
    }
    
    // === INTERNAL ===
    function _mint(address to, uint256 amount) internal {
        require(totalSupply + amount <= maxSupply, "Max supply reached");
        for (uint256 i = 0; i < amount; i++) {
            balanceOf[to]++;
            totalSupply++;
        }
        minted[to] += amount;
        emit Claimed(to, amount);
    }
    
    // === ADMIN ===
    function setPrice(uint256 _price) external { price = _price; }
    function togglePause() external { paused = !paused; }
    function toggleSale() external { saleActive = !saleActive; }
}
