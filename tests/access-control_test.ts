import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';

Clarinet.test({
  name: "Verify contract owner is initially set to contract deployer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const block = chain.mineBlock([]);
    const result = chain.callReadOnlyFn(
      'access-control', 
      'is-contract-owner', 
      [types.principal(deployer.address)], 
      deployer.address
    );
    result.result.expectBool(true);
  }
});

Clarinet.test({
  name: "Role assignment succeeds for contract owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    const block = chain.mineBlock([
      Tx.contractCall('access-control', 'assign-role', 
        [types.string('logistics-manager'), types.principal(wallet1.address)], 
        deployer.address)
    ]);

    block.receipts[0].result.expectOk().expectBool(true);

    // Verify role was assigned
    const roleCheck = chain.callReadOnlyFn(
      'access-control', 
      'has-role', 
      [types.string('logistics-manager'), types.principal(wallet1.address)], 
      deployer.address
    );
    roleCheck.result.expectBool(true);
  }
});

Clarinet.test({
  name: "Role assignment fails for unauthorized sender",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;

    const block = chain.mineBlock([
      Tx.contractCall('access-control', 'assign-role', 
        [types.string('logistics-manager'), types.principal(wallet2.address)], 
        wallet1.address)
    ]);

    block.receipts[0].result.expectErr().expectUint(403);
  }
});

Clarinet.test({
  name: "Role assignment fails for invalid role",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;

    const block = chain.mineBlock([
      Tx.contractCall('access-control', 'assign-role', 
        [types.string('invalid-role'), types.principal(deployer.address)], 
        deployer.address)
    ]);

    block.receipts[0].result.expectErr().expectUint(400);
  }
});

Clarinet.test({
  name: "Role removal succeeds for contract owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    // First assign role
    const assignBlock = chain.mineBlock([
      Tx.contractCall('access-control', 'assign-role', 
        [types.string('transporter'), types.principal(wallet1.address)], 
        deployer.address)
    ]);
    assignBlock.receipts[0].result.expectOk();

    // Then remove role
    const removeBlock = chain.mineBlock([
      Tx.contractCall('access-control', 'remove-role', 
        [types.string('transporter'), types.principal(wallet1.address)], 
        deployer.address)
    ]);

    removeBlock.receipts[0].result.expectOk();

    // Verify role was removed
    const roleCheck = chain.callReadOnlyFn(
      'access-control', 
      'has-role', 
      [types.string('transporter'), types.principal(wallet1.address)], 
      deployer.address
    );
    roleCheck.result.expectBool(false);
  }
});

Clarinet.test({
  name: "Transfer contract ownership succeeds",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    const block = chain.mineBlock([
      Tx.contractCall('access-control', 'transfer-contract-ownership', 
        [types.principal(wallet1.address)], 
        deployer.address)
    ]);

    block.receipts[0].result.expectOk();

    // Verify new owner
    const ownerCheck = chain.callReadOnlyFn(
      'access-control', 
      'is-contract-owner', 
      [types.principal(wallet1.address)], 
      wallet1.address
    );
    ownerCheck.result.expectBool(true);
  }
});

Clarinet.test({
  name: "Transfer contract ownership fails for unauthorized sender",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;

    const block = chain.mineBlock([
      Tx.contractCall('access-control', 'transfer-contract-ownership', 
        [types.principal(wallet2.address)], 
        wallet1.address)
    ]);

    block.receipts[0].result.expectErr().expectUint(403);
  }
});