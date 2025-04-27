import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';

// Utility function to assign role
function assignRole(chain: Chain, deployer: Account, user: Account, roleType: string) {
  return chain.mineBlock([
    Tx.contractCall('fuel-inventory', 'assign-role', 
      [types.principal(user.address), types.string(roleType), types.bool(true)], 
      deployer.address)
  ]);
}

Clarinet.test({
  name: "Adding fuel inventory requires authorized role",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    // Assign logistics manager role
    const roleBlock = assignRole(chain, deployer, wallet1, 'logistics');
    roleBlock.receipts[0].result.expectOk();

    // Add fuel inventory
    const block = chain.mineBlock([
      Tx.contractCall('fuel-inventory', 'add-fuel-inventory', 
        [types.buff('MAIN-DEPOT'), types.uint(0), types.uint(1000)], 
        wallet1.address)
    ]);

    block.receipts[0].result.expectOk();

    // Check inventory availability
    const availability = chain.callReadOnlyFn(
      'fuel-inventory', 
      'get-fuel-availability', 
      [types.buff('MAIN-DEPOT'), types.uint(0)], 
      wallet1.address
    );
    availability.result.expectSome().expectUint(1000);
  }
});

Clarinet.test({
  name: "Adding fuel inventory fails without authorization",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;

    const block = chain.mineBlock([
      Tx.contractCall('fuel-inventory', 'add-fuel-inventory', 
        [types.buff('MAIN-DEPOT'), types.uint(0), types.uint(1000)], 
        wallet1.address)
    ]);

    block.receipts[0].result.expectErr().expectUint(403); // Unauthorized
  }
});

Clarinet.test({
  name: "Transferring fuel between locations works with authorization",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    // Assign logistics manager role
    const roleBlock = assignRole(chain, deployer, wallet1, 'logistics');
    roleBlock.receipts[0].result.expectOk();

    // Add fuel to source location
    const addSourceBlock = chain.mineBlock([
      Tx.contractCall('fuel-inventory', 'add-fuel-inventory', 
        [types.buff('DEPOT-A'), types.uint(0), types.uint(1000)], 
        wallet1.address)
    ]);
    addSourceBlock.receipts[0].result.expectOk();

    // Transfer fuel to another location
    const transferBlock = chain.mineBlock([
      Tx.contractCall('fuel-inventory', 'transfer-fuel', 
        [
          types.buff('DEPOT-A'), 
          types.buff('DEPOT-B'), 
          types.uint(0), 
          types.uint(500)
        ], 
        wallet1.address)
    ]);
    transferBlock.receipts[0].result.expectOk();

    // Check source location inventory
    const sourceAvailability = chain.callReadOnlyFn(
      'fuel-inventory', 
      'get-fuel-availability', 
      [types.buff('DEPOT-A'), types.uint(0)], 
      wallet1.address
    );
    sourceAvailability.result.expectSome().expectUint(500);

    // Check destination location inventory
    const destAvailability = chain.callReadOnlyFn(
      'fuel-inventory', 
      'get-fuel-availability', 
      [types.buff('DEPOT-B'), types.uint(0)], 
      wallet1.address
    );
    destAvailability.result.expectSome().expectUint(500);
  }
});

Clarinet.test({
  name: "Recording fuel consumption reduces inventory",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    // Assign inventory clerk role
    const roleBlock = assignRole(chain, deployer, wallet1, 'inventory');
    roleBlock.receipts[0].result.expectOk();

    // Add initial fuel inventory
    const addBlock = chain.mineBlock([
      Tx.contractCall('fuel-inventory', 'add-fuel-inventory', 
        [types.buff('DEPOT-C'), types.uint(1), types.uint(1000)], 
        wallet1.address)
    ]);
    addBlock.receipts[0].result.expectOk();

    // Record fuel consumption
    const consumeBlock = chain.mineBlock([
      Tx.contractCall('fuel-inventory', 'record-fuel-consumption', 
        [types.buff('DEPOT-C'), types.uint(1), types.uint(500)], 
        wallet1.address)
    ]);
    consumeBlock.receipts[0].result.expectOk();

    // Check remaining inventory
    const availability = chain.callReadOnlyFn(
      'fuel-inventory', 
      'get-fuel-availability', 
      [types.buff('DEPOT-C'), types.uint(1)], 
      wallet1.address
    );
    availability.result.expectSome().expectUint(500);
  }
});

Clarinet.test({
  name: "Total inventory is tracked correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    // Assign logistics manager role
    const roleBlock = assignRole(chain, deployer, wallet1, 'logistics');
    roleBlock.receipts[0].result.expectOk();

    // Add fuel to multiple locations
    const addBlock = chain.mineBlock([
      Tx.contractCall('fuel-inventory', 'add-fuel-inventory', 
        [types.buff('DEPOT-A'), types.uint(0), types.uint(1000)], 
        wallet1.address),
      Tx.contractCall('fuel-inventory', 'add-fuel-inventory', 
        [types.buff('DEPOT-B'), types.uint(1), types.uint(2000)], 
        wallet1.address)
    ]);
    addBlock.receipts.forEach(receipt => receipt.result.expectOk());

    // Check total inventory
    const totalInventory = chain.callReadOnlyFn(
      'fuel-inventory', 
      'get-total-inventory', 
      [], 
      wallet1.address
    );
    totalInventory.result.expectUint(3000);
  }
});

Clarinet.test({
  name: "Role-based access control prevents unauthorized fuel management",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;

    // Assign logistics manager role to wallet1
    const roleBlock = assignRole(chain, deployer, wallet1, 'logistics');
    roleBlock.receipts[0].result.expectOk();

    // Add initial fuel inventory
    const addBlock = chain.mineBlock([
      Tx.contractCall('fuel-inventory', 'add-fuel-inventory', 
        [types.buff('DEPOT-A'), types.uint(0), types.uint(1000)], 
        wallet1.address)
    ]);
    addBlock.receipts[0].result.expectOk();

    // Attempt unauthorized transfer by wallet2
    const transferBlock = chain.mineBlock([
      Tx.contractCall('fuel-inventory', 'transfer-fuel', 
        [
          types.buff('DEPOT-A'), 
          types.buff('DEPOT-B'), 
          types.uint(0), 
          types.uint(500)
        ], 
        wallet2.address)
    ]);
    transferBlock.receipts[0].result.expectErr().expectUint(403); // Unauthorized
  }
});

Clarinet.test({
  name: "Inventory management prevents transfers exceeding available quantity",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    // Assign logistics manager role
    const roleBlock = assignRole(chain, deployer, wallet1, 'logistics');
    roleBlock.receipts[0].result.expectOk();

    // Add initial fuel inventory
    const addBlock = chain.mineBlock([
      Tx.contractCall('fuel-inventory', 'add-fuel-inventory', 
        [types.buff('DEPOT-A'), types.uint(0), types.uint(500)], 
        wallet1.address)
    ]);
    addBlock.receipts[0].result.expectOk();

    // Attempt to transfer more than available quantity
    const transferBlock = chain.mineBlock([
      Tx.contractCall('fuel-inventory', 'transfer-fuel', 
        [
          types.buff('DEPOT-A'), 
          types.buff('DEPOT-B'), 
          types.uint(0), 
          types.uint(600)
        ], 
        wallet1.address)
    ]);
    transferBlock.receipts[0].result.expectErr().expectUint(404); // Insufficient inventory
  }
});