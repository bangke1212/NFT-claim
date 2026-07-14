export const NFT_ABI=[
  "function name() view returns (string)","function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)","function maxSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)","function paused() view returns (bool)",
  "function saleActive() view returns (bool)","function publicSaleActive() view returns (bool)",
  "function price() view returns (uint256)","function mintPrice() view returns (uint256)","function cost() view returns (uint256)","function maxPerWallet() view returns (uint256)",
  "function claim() payable","function claim(uint256 amount) payable","function claim(address to, uint256 amount) payable",
  "function mint() payable","function mint(uint256 amount) payable","function mint(address to, uint256 amount) payable",
  "function freeMint()","function freeMint(uint256 amount)","function publicMint(uint256 amount) payable",
  "function safeMint(address to)","function safeMint(address to, uint256 amount)",
  "function setApprovalForAll(address operator, bool approved)","function isApprovedForAll(address owner, address operator) view returns (bool)"
];
export const METHOD_CANDIDATES=["claim","freeMint","mint","publicMint","safeMint"];
