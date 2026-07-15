export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'trickle',
    password: process.env.DB_PASSWORD || 'trickle',
    name: process.env.DB_NAME || 'trickle',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  stellar: {
    network: process.env.STELLAR_NETWORK || 'testnet',
    horizonUrl:
      process.env.STELLAR_HORIZON_URL ||
      'https://horizon-testnet.stellar.org',
    sorobanRpcUrl:
      process.env.STELLAR_SOROBAN_RPC_URL ||
      'https://soroban-testnet.stellar.org:443',
    networkPassphrase:
      process.env.STELLAR_NETWORK_PASSPHRASE ||
      'Test SDF Network ; September 2015',
    baseFee: parseInt(process.env.STELLAR_BASE_FEE || '100', 10),
  },

  factory: {
    contractAddress: process.env.FACTORY_CONTRACT_ADDRESS || '',
  },
});
