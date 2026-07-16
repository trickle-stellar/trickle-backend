export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),

  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'trickle',
    password: process.env.POSTGRES_PASSWORD || 'trickle',
    name: process.env.POSTGRES_DB || 'trickle',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  stellar: {
    network: process.env.STELLAR_NETWORK || 'testnet',
    horizonUrl:
      process.env.HORIZON_URL ||
      'https://horizon-testnet.stellar.org',
    sorobanRpcUrl:
      process.env.SOROBAN_RPC_URL ||
      'https://soroban-rpc.testnet.stellar.org',
    networkPassphrase:
      process.env.STELLAR_NETWORK_PASSPHRASE ||
      'Test SDF Network ; September 2015',
    baseFee: parseInt(process.env.STELLAR_BASE_FEE || '100', 10),
  },

  factory: {
    contractAddress: process.env.FACTORY_CONTRACT_ADDRESS || '',
  },
});
