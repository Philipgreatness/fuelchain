import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';

Clarinet.test({
  name: "Token metadata is correctly set",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const nameResult = chain.callReadOnlyFn('fuel-token', 'get-name', [], accounts.get('deployer')!.address);
    const symbolResult = chain.callReadOnlyFn('fuel-token', 'get-symbol', [], accounts.get('deployer')!.address);
    const decimalsResult = chain.callReadOnlyFn('fuel-token', 'get-decimals', [], accounts.get('deployer')!.address);

    nameResult.result.expectOk().expectStringAscii('Fuel Token');
    symbolResult.result.expectOk().expectStringAscii('FUEL');
    decimalsResult.result.expectOk().expectUint(6);
  }
});

Clarinet.test({
  name: "Minting tokens requires authorization",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    // First authorize minter
    const authBlock = chain.mineBlock([
      Tx.contractCall('fuel-token', 'authorize-minter', 
        [types.principal(wallet1.address)], 
        deployer.address)
    ]);
    authBlock.receipts[0].result.expectOk();

    // Add a fuel grade first
    const gradeBlock = chain.mineBlock([
      Tx.contractCall('fuel-token', 'add-fuel-grade', 
        [types.string('regular'), types.string('Standard Grade'), types.uint(10)], 
        deployer.address)
    ]);
    gradeBlock.receipts[0].result.expectOk();

    // Mint tokens
    const mintBlock = chain.mineBlock([
      Tx.contractCall('fuel-token', 'mint', 
        [types.uint(1000), types.principal(wallet1.address), types.string('regular')], 
        wallet1.address)
    ]);
    mintBlock.receipts[0].result.expectOk();

    // Check balance
    const balanceResult = chain.callReadOnlyFn(
      'fuel-token', 
      'get-balance', 
      [types.principal(wallet1.address)], 
      wallet1.address
    );
    balanceResult.result.expectOk().expectUint(1000);
  }
});

Clarinet.test({
  name: "Minting fails without authorization",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;

    const block = chain.mineBlock([
      Tx.contractCall('fuel-token', 'mint', 
        [types.uint(1000), types.principal(wallet1.address), types.string('regular')], 
        wallet1.address)
    ]);

    block.receipts[0].result.expectErr().expectUint(1); // Unauthorized
  }
});

Clarinet.test({
  name: "Token transfer requires sender authorization",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;

    // First authorize minter
    const authBlock = chain.mineBlock([
      Tx.contractCall('fuel-token', 'authorize-minter', 
        [types.principal(wallet1.address)], 
        deployer.address)
    ]);
    authBlock.receipts[0].result.expectOk();

    // Add a fuel grade
    const gradeBlock = chain.mineBlock([
      Tx.contractCall('fuel-token', 'add-fuel-grade', 
        [types.string('regular'), types.string('Standard Grade'), types.uint(10)], 
        deployer.address)
    ]);
    gradeBlock.receipts[0].result.expectOk();

    // Mint tokens to wallet1
    const mintBlock = chain.mineBlock([
      Tx.contractCall('fuel-token', 'mint', 
        [types.uint(1000), types.principal(wallet1.address), types.string('regular')], 
        wallet1.address)
    ]);
    mintBlock.receipts[0].result.expectOk();

    // Transfer tokens
    const transferBlock = chain.mineBlock([
      Tx.contractCall('fuel-token', 'transfer', 
        [types.uint(500), types.principal(wallet1.address), types.principal(wallet2.address), types.none()], 
        wallet1.address)
    ]);
    transferBlock.receipts[0].result.expectOk();

    // Check balances
    const wallet1Balance = chain.callReadOnlyFn(
      'fuel-token', 
      'get-balance', 
      [types.principal(wallet1.address)], 
      wallet1.address
    );
    const wallet2Balance = chain.callReadOnlyFn(
      'fuel-token', 
      'get-balance', 
      [types.principal(wallet2.address)], 
      wallet2.address
    );

    wallet1Balance.result.expectOk().expectUint(500);
    wallet2Balance.result.expectOk().expectUint(500);
  }
});

Clarinet.test({
  name: "Fuel grade management works correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;

    // Add fuel grade
    const block = chain.mineBlock([
      Tx.contractCall('fuel-token', 'add-fuel-grade', 
        [types.string('premium'), types.string('High Performance Fuel'), types.uint(15)], 
        deployer.address)
    ]);
    block.receipts[0].result.expectOk();

    // Check fuel grade details
    const gradeDetails = chain.callReadOnlyFn(
      'fuel-token', 
      'get-fuel-grade', 
      [types.string('premium')], 
      deployer.address
    );

    const gradeResult = gradeDetails.result.expectSome();
    gradeResult.expectTuple({
      description: 'High Performance Fuel',
      'energy-content': 15
    });
  }
});

Clarinet.test({
  name: "Burning tokens works correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    // First authorize minter
    const authBlock = chain.mineBlock([
      Tx.contractCall('fuel-token', 'authorize-minter', 
        [types.principal(wallet1.address)], 
        deployer.address)
    ]);
    authBlock.receipts[0].result.expectOk();

    // Add a fuel grade
    const gradeBlock = chain.mineBlock([
      Tx.contractCall('fuel-token', 'add-fuel-grade', 
        [types.string('regular'), types.string('Standard Grade'), types.uint(10)], 
        deployer.address)
    ]);
    gradeBlock.receipts[0].result.expectOk();

    // Mint tokens
    const mintBlock = chain.mineBlock([
      Tx.contractCall('fuel-token', 'mint', 
        [types.uint(1000), types.principal(wallet1.address), types.string('regular')], 
        wallet1.address)
    ]);
    mintBlock.receipts[0].result.expectOk();

    // Burn tokens
    const burnBlock = chain.mineBlock([
      Tx.contractCall('fuel-token', 'burn', 
        [types.uint(500)], 
        wallet1.address)
    ]);
    burnBlock.receipts[0].result.expectOk();

    // Check balance after burning
    const balanceResult = chain.callReadOnlyFn(
      'fuel-token', 
      'get-balance', 
      [types.principal(wallet1.address)], 
      wallet1.address
    );
    balanceResult.result.expectOk().expectUint(500);

    // Check total supply
    const totalSupplyResult = chain.callReadOnlyFn(
      'fuel-token', 
      'get-total-supply', 
      [], 
      wallet1.address
    );
    totalSupplyResult.result.expectOk().expectUint(500);
  }
});

Clarinet.test({
  name: "Adding a fuel grade requires contract owner authorization",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;

    const block = chain.mineBlock([
      Tx.contractCall('fuel-token', 'add-fuel-grade', 
        [types.string('premium'), types.string('High Performance Fuel'), types.uint(15)], 
        wallet1.address)
    ]);

    block.receipts[0].result.expectErr().expectUint(1); // Unauthorized
  }
});