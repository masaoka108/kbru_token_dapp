// const { MerkleTree } = require('merkletreejs')
// const SHA256 = require('crypto-js/sha256')

// // const leaves = ['a', 'b', 'c'].map(x => SHA256(x))
// const leaves = ['0x5B38Da6a701c568545dCfcB03FcB875f56beddC4', '0xf841b0888e9397902Ed1c91FA5f43f1F0A76fdc7', '0x2585D0F329f6fea2B45363Ea0c9A15109B23876C'].map(x => SHA256(x))

// const tree = new MerkleTree(leaves, SHA256)

// const root = tree.getRoot().toString('hex')
// console.log(root) 

// const leaf = SHA256('0x5B38Da6a701c568545dCfcB03FcB875f56beddC4')
// console.log(leaf) 

// const proof = tree.getProof(leaf)
// console.log(proof) 

// console.log(tree.verify(proof, leaf, root)) // true


// const badLeaves = ['a', 'x', 'c'].map(x => SHA256(x))
// const badTree = new MerkleTree(badLeaves, SHA256)
// const badLeaf = SHA256('x')
// const badProof = tree.getProof(badLeaf)
// console.log(tree.verify(badProof, leaf, root)) // false


// Leaves = addressの塊
// tree = leaves から作成
// root = tree から作成
// leaf = address
// proof = tree と leafから作成

// やりたいことは「アドレス(leaf)」「proof」をjsで取得、コントラクトに投げてVerifyする




// const MerkleProof = artifacts.require('MerkleProof')
const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')

// const contract = await MerkleProof.new()

const leaves = ['0x5B38Da6a701c568545dCfcB03FcB875f56beddC4', '0xf841b0888e9397902Ed1c91FA5f43f1F0A76fdc7', '0x2585D0F329f6fea2B45363Ea0c9A15109B23876C'].map(v => keccak256(v))
console.log(leaves) 


const tree = new MerkleTree(leaves, keccak256, { sort: true })
console.log(tree) 

// const tree = new MerkleTree(leaves, keccak256)
const root = tree.getHexRoot()
console.log(root) 

const leaf = keccak256('0x5B38Da6a701c568545dCfcB03FcB875f56beddC4')
const proof = tree.getHexProof(leaf)
console.log(proof) 
// console.log(await contract.verify.call(root, leaf, proof)) // true

// const badLeaves = ['a', 'b', 'x', 'd'].map(v => keccak256(v))
// const badTree = new MerkleTree(badLeaves, keccak256, { sort: true })
// const badProof = badTree.getHexProof(leaf)
// console.log(await contract.verify.call(root, leaf, badProof)) // false