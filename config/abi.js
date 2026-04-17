const InvestmentABI = [
  {
    type: "function",
    name: "creditIncomeBatch",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "users",
        type: "address[]",
      },
      {
        name: "amounts",
        type: "uint256[]",
      },
      {
        name: "incomeType",
        type: "uint8",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "creditIncome",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "user",
        type: "address",
      },
      {
        name: "amount",
        type: "uint256",
      },
      {
        name: "incomeType",
        type: "uint8",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getIncome",
    stateMutability: "view",
    inputs: [
      {
        name: "user",
        type: "address",
      },
    ],
    outputs: [
      { type: "uint256", name: "roi" },
      { type: "uint256", name: "level" },
      { type: "uint256", name: "salary" },
      { type: "uint256", name: "bonus" },
      { type: "uint256", name: "rank" },
      { type: "uint256", name: "investment" },
    ],
  },
  {
    type: "function",
    name: "withdrawROI",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "withdrawLevel",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "withdrawSalary",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "withdrawBonus",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "withdrawRank",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "IncomeCredited",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "incomeType", type: "uint8", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Withdraw",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "incomeType", type: "uint8", indexed: false },
    ],
    anonymous: false,
  },
];

export default InvestmentABI;
