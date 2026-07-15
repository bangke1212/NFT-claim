export const NFT_ABI=[
  // === READ ===
  "function name() view returns (string)","function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)","function maxSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)","function paused() view returns (bool)",
  "function saleActive() view returns (bool)","function publicSaleActive() view returns (bool)","function isActive() view returns (bool)",
  "function price() view returns (uint256)","function mintPrice() view returns (uint256)","function cost() view returns (uint256)",
  "function maxPerWallet() view returns (uint256)","function maxMintPerWallet() view returns (uint256)",
  "function alreadyMinted(address) view returns (uint256)","function merkleRoot() view returns (bytes32)",

  // === CLAIM ===
  "function claim() payable","function claim(uint256 amount) payable","function claim(address to, uint256 amount) payable",

  // === MINT ===
  "function mint() payable","function mint(uint256 amount) payable","function mint(address to, uint256 amount) payable",
  "function mint(address to) payable",

  // === FREE MINT ===
  "function freeMint()","function freeMint(uint256 amount)","function freeMint(address to)",

  // === PUBLIC MINT ===
  "function publicMint(uint256 amount) payable","function publicMint() payable",
  "function publicSaleMint(uint256 amount) payable",

  // === SAFE MINT ===
  "function safeMint(address to)","function safeMint(address to, uint256 amount)",

  // === WHITELIST / LISTED MINT ===
  "function mintListed(uint256 amount, bytes32[] proof, uint256 maxAmount) payable",
  "function whitelistMint(uint256 amount, bytes32[] proof) payable",
  "function presaleMint(uint256 amount, bytes32[] proof, uint256 maxAmount) payable",

  // === PURCHASE / BUY ===
  "function purchase(uint256 amount) payable","function buy(uint256 amount) payable",
  "function buyMint(uint256 amount) payable",

  // === APPROVAL ===
  "function setApprovalForAll(address operator, bool approved)","function isApprovedForAll(address owner, address operator) view returns (bool)"
];

// Method candidates diurut dari yang paling umum
export const METHOD_CANDIDATES=["claim","mint","freeMint","publicMint","safeMint","mintListed","whitelistMint","publicSaleMint","purchase","buy","buyMint","presaleMint"];
