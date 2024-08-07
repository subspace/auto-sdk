# Autonomys SDK - Node Example

Simple list of scripts to query data and execute extrinsics:

## Install

```bash
yarn
```

## Run queries

```bash
yarn balance
yarn operators
```

## Execute extrinsics

```bash
yarn transfer
yarn register-operator
yarn nominate-operator
yarn withdraw-stake
yarn deregister-operator
yarn unlock-funds
yarn unlock-nominator
```

## Auto Id

```bash
# register certificate
yarn autoid:register

# self revoke certificate
yarn autoid:revoke-self

# revoke leaf certificate
yarn autoid:revoke-leaf

# deactivate auto id
yarn autoid:deactivate

# renew auto id for self
yarn autoid:renew-self

# renew auto id for leaf
yarn autoid:renew-leaf

# view certificate
yarn autoid:view-cert <AUTO_ID_IDENTIFIER>

# view revoked certificates
yarn autoid:view-revoked-certs <AUTO_ID_IDENTIFIER>
```

## Utility

```bash
yarn address
```

## Run All

```bash
yarn all
```
