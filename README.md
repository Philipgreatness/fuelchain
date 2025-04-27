# FuelChain

A tokenized system for managing fuel logistics on the Stacks blockchain.

## Project Overview

FuelChain is a Clarity smart contract project that provides a comprehensive solution for managing fuel logistics on the Stacks blockchain. The key features and capabilities of the project include:

- Secure and decentralized fuel inventory tracking with role-based access control
- Fuel token creation, transfer, and burning with fuel grade management
- Auditable event logging for all fuel-related operations
- Customizable permission structures to control access to sensitive functions

The project consists of three primary Clarity contracts:

1. **Fuel Inventory Contract**: Handles the management of the fuel inventory, including tracking of fuel levels, fuel grade, and role-based access control.
2. **Fuel Token Contract**: Responsible for the creation, transfer, and burning of the fuel tokens, which represent the physical fuel assets.
3. **Access Control Contract**: Manages the assignment and revocation of roles, as well as the transfer of contract ownership.

## Contract Architecture

### Fuel Inventory Contract

The Fuel Inventory contract is the main component responsible for managing the fuel inventory and its associated data. It includes the following key features:

- **Fuel Inventory Tracking**: Maintains a mapping of fuel levels for each fuel grade, allowing for accurate tracking of the available fuel supply.
- **Role-based Access Control**: Implements a role-based permission system to control who can perform various inventory management actions, such as adding, removing, or adjusting fuel levels.
- **Event Logging**: Records all fuel-related events, such as fuel level changes, role assignments, and inventory adjustments, for auditability and transparency.

### Fuel Token Contract

The Fuel Token contract manages the creation, transfer, and burning of the fuel tokens. Key features include:

- **Token Minting and Burning**: Allows authorized principals to mint new fuel tokens and burn existing ones, maintaining an accurate representation of the physical fuel assets.
- **Fuel Grade Management**: Associates each fuel token with a specific fuel grade, enabling differentiation and tracking of various fuel types.
- **Authorization Checks**: Implements strict authorization checks to ensure that only authorized principals can perform token-related operations.

### Access Control Contract

The Access Control contract is responsible for managing the roles and permissions within the FuelChain system. It provides the following functionality:

- **Role Assignment and Removal**: Allows the contract owner to assign and revoke specific roles, such as "Fuel Manager" or "Token Minter".
- **Role Checking**: Provides functions to check the roles of a given principal, enabling fine-grained access control.
- **Contract Ownership Transfer**: Facilitates the transfer of contract ownership to a new principal, enabling governance changes.

## Installation & Setup

To set up the FuelChain project, you will need the following:

- Clarinet: A Clarity smart contract development and testing tool
- A Stacks blockchain node or access to a public node

1. Clone the FuelChain repository:
```
git clone https://github.com/example/fuelchain.git
```

2. Install the required dependencies using Clarinet:
```
cd fuelchain
clarinet install
```

3. Configure the project settings in the `Clarinet.toml` file, if necessary.

4. Build and deploy the contracts using Clarinet:
```
clarinet build
clarinet deploy
```

## Usage Guide

### Interacting with the Fuel Inventory Contract

1. **Add Fuel to Inventory**:
```
(contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.fuel-inventory add-fuel u100 u10)
```
This will add 10 units of fuel with a grade of 100 to the inventory.

2. **Adjust Fuel Level**:
```
(contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.fuel-inventory adjust-fuel u100 u-5)
```
This will reduce the fuel level of grade 100 fuel by 5 units.

3. **View Fuel Inventory**:
```
(contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.fuel-inventory get-fuel-level u100)
```
This will return the current fuel level for grade 100 fuel.

### Interacting with the Fuel Token Contract

1. **Mint New Fuel Tokens**:
```
(contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.fuel-token mint u100 u1000)
```
This will mint 1000 fuel tokens with a grade of 100.

2. **Transfer Fuel Tokens**:
```
(contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.fuel-token transfer u'ST2J6ZY48GV1EZ5V2V5RB9MP66CEJ6SEPEPJ6CC9.fuel-tokens u100 u500)
```
This will transfer 500 fuel tokens with a grade of 100 to the specified recipient principal.

3. **Burn Fuel Tokens**:
```
(contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.fuel-token burn u100 u250)
```
This will burn 250 fuel tokens with a grade of 100.

## Testing

The FuelChain project includes comprehensive test suites for each of the three primary contracts:

- `/workspace/tests/fuel-inventory_test.ts`: Tests the functionality of the Fuel Inventory contract, including inventory management, role-based access control, and fuel tracking.
- `/workspace/tests/fuel-token_test.ts`: Tests the Fuel Token contract, covering token minting, transfers, burning, fuel grade management, and authorization checks.
- `/workspace/tests/access-control_test.ts`: Tests the Access Control contract, including role assignment, role checking, role removal, and contract ownership transfer.

To run the tests, use the Clarinet CLI:

```
clarinet test
```

The tests cover a wide range of scenarios, ensuring the contracts' reliability and security.

## Security Considerations

The FuelChain project has been designed with security as a top priority. Some of the key security features include:

- **Role-based Access Control**: The Access Control contract ensures that only authorized principals can perform sensitive operations, such as adjusting fuel levels or minting tokens.
- **Data Validation**: The contracts perform extensive data validation, including checks for valid fuel grades, non-negative fuel levels, and authorized principals.
- **Event Logging**: All fuel-related actions are recorded in the contract's event log, providing a tamper-resistant audit trail.
- **Contract Ownership Transfer**: The ability to transfer contract ownership allows for governance changes and updates to the system over time.

Additionally, the contracts have been thoroughly tested to identify and address potential vulnerabilities.
