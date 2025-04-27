;; FuelChain Access Control Contract
;; Manages role-based access control for the FuelChain logistics system
;; Provides secure, principal-based authorization mechanisms

;; Error Codes
(define-constant ERR_UNAUTHORIZED u403)
(define-constant ERR_ROLE_ALREADY_EXISTS u409)
(define-constant ERR_ROLE_NOT_FOUND u404)
(define-constant ERR_INVALID_ROLE u400)

;; Role Definitions
(define-constant ROLE_ADMIN "admin")
(define-constant ROLE_LOGISTICS_MANAGER "logistics-manager")
(define-constant ROLE_TRANSPORTER "transporter")

;; Role Storage Map
;; Stores role assignments for principals
(define-map roles-map 
  { 
    role: (string-ascii 32), 
    principal: principal 
  } 
  { 
    assigned: bool 
  }
)

;; Admin Principal (contract deployer)
(define-data-var contract-owner principal tx-sender)

;; Authorization Check: Ensures only the contract owner can perform admin actions
(define-private (is-contract-owner (sender principal))
  (is-eq sender (var-get contract-owner))
)

;; Role Assignment Function
(define-public (assign-role (role (string-ascii 32)) (assignee principal))
  (begin
    ;; Only contract owner can assign roles
    (asserts! (is-contract-owner tx-sender) (err ERR_UNAUTHORIZED))
    
    ;; Validate role
    (asserts! 
      (or 
        (is-eq role ROLE_ADMIN) 
        (is-eq role ROLE_LOGISTICS_MANAGER) 
        (is-eq role ROLE_TRANSPORTER)
      ) 
      (err ERR_INVALID_ROLE)
    )
    
    ;; Check if role is already assigned
    (asserts! 
      (is-none (map-get? roles-map { role: role, principal: assignee })) 
      (err ERR_ROLE_ALREADY_EXISTS)
    )
    
    ;; Assign role
    (map-set roles-map 
      { role: role, principal: assignee } 
      { assigned: true }
    )
    
    (ok true)
  )
)

;; Role Removal Function
(define-public (remove-role (role (string-ascii 32)) (assignee principal))
  (begin
    ;; Only contract owner can remove roles
    (asserts! (is-contract-owner tx-sender) (err ERR_UNAUTHORIZED))
    
    ;; Validate role exists for the principal
    (asserts! 
      (is-some (map-get? roles-map { role: role, principal: assignee })) 
      (err ERR_ROLE_NOT_FOUND)
    )
    
    ;; Remove role
    (map-delete roles-map { role: role, principal: assignee })
    
    (ok true)
  )
)

;; Role Checking Function
(define-read-only (has-role (role (string-ascii 32)) (principal-to-check principal))
  (is-some 
    (map-get? roles-map { 
      role: role, 
      principal: principal-to-check 
    })
  )
)

;; Administrative Function: Transfer Contract Ownership
(define-public (transfer-contract-ownership (new-owner principal))
  (begin
    ;; Only current contract owner can transfer ownership
    (asserts! (is-contract-owner tx-sender) (err ERR_UNAUTHORIZED))
    
    ;; Update contract owner
    (var-set contract-owner new-owner)
    
    (ok true)
  )
)

;; Initial setup: Assign initial admin role to contract deployer
(map-set roles-map 
  { role: ROLE_ADMIN, principal: tx-sender } 
  { assigned: true }
)