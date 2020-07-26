const DEFAULT_RPC_URL = 'https://mainnet.infura.io/v3/'
const DEFAULT_PATH = "m/44'/60'/0'/0/0"
const DEFAULT_GAS = 50

const ABI = [
    'function withdrawablePayment(address) external view returns (uint256)',
    'function withdrawPayment(address,address,uint256) external'
]

const ethers = require('ethers')
const fs = require('fs').promises;
const Transport = require("@ledgerhq/hw-transport-node-hid").default
const EthApp = require('@ledgerhq/hw-app-eth').default
const { Transaction } = require('ethereumjs-tx')
const readline = require('readline')

const ENV_GAS_PRICE = Number(process.env.GAS_PRICE) || DEFAULT_GAS
const GAS_PRICE = (ENV_GAS_PRICE > 250 ? 250 : ENV_GAS_PRICE) * 1e9
const RPC_URL = process.env.RPC_URL || DEFAULT_RPC_URL
const PATH = process.env.PATH || DEFAULT_PATH
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS
const provider = new ethers.providers.JsonRpcProvider(RPC_URL)

const main = async () => {
    const flux_array = (await fs.readFile('jobs.txt', 'utf8')).split('\n')

    const transport = await Transport.create()
    const eth = new EthApp(transport)
    const address = await eth.getAddress(PATH)
    console.log(`Using address ${address.address}`)

    let nonce = await provider.getTransactionCount(address.address)

    for (const v of flux_array) {
        if (v.length === 0) continue

        const contract = new ethers.Contract(v, ABI, provider)
        const result = await contract.withdrawablePayment(ADMIN_ADDRESS)
        console.log(`${v} withdrawable: ${result / 1e18}`)
        if (result / 1e18 < 1) {
            console.log('Balance under 1 LINK, skipping...')
            continue
        }
        console.log('Withdrawing...')
        const confirmation = await confirm()
        if (!confirmation) {
            console.log('Skipping this contract...')
            continue
        }

        const rawTx = await contract.populateTransaction.withdrawPayment(ADMIN_ADDRESS, address.address, result)

        console.log('Sending request to Ledger. Please check device!')
        const signedTx = await signTransaction(eth, rawTx, nonce)
        const txid = await provider.sendTransaction(signedTx)
        console.log(`Sent withdraw request with tx hash ${txid.hash}`)

        nonce++
    }
}

const signTransaction = async (eth, rawTx, nonce) => {
    const txData = {
        nonce: nonce,
        gasLimit: ethers.utils.hexlify(300000),
        gasPrice: ethers.utils.hexlify(GAS_PRICE),
        to: rawTx.to,
        value: '0x00',
        data: rawTx.data
    }

    const tx = new Transaction(txData)
    tx.raw[6] = Buffer.from([1]) // v
    tx.raw[7] = Buffer.from([]) // r
    tx.raw[8] = Buffer.from([]) // s

    const signed = await eth.signTransaction(PATH, tx.serialize().toString('hex'))
    txData.v = '0x'+signed.v
    txData.r = '0x'+signed.r
    txData.s = '0x'+signed.s
    const signedTx = new Transaction(txData)
    return '0x'+signedTx.serialize().toString('hex')
}

const confirm = async () => {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface(process.stdin, process.stdout)
        rl.question('Are you sure? Y/n: ', (input) => {
            if (input === "" || input.toLowerCase() === "y") {
                resolve(true)
            } else {
                resolve(false)
            }
            rl.close()
        })
    })
}

main().then()
