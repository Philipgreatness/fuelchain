;; Fuel Token Contract
;; A SIP-010 compliant fungible token representing fuel units
;; Supports minting, burning, and access-controlled transfers with fuel grade metadata

;; Errors
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_INSUFFICIENT_BALANCE u2)
(define-constant ERR_INVALID_AMOUNT u3)
(define-constant ERR_TRANSFER_FAILED u4)
(define-constant ERR_MINT_FAILED u5)
(define-constant ERR_BURN_FAILED u6)

;; Contract owner (deployer)
(define-data-var contract-owner principal tx-sender)

;; Token metadata
(define-fungible-token fuel-token)

;; Total supply tracking
(define-data-var total-supply uint u0)

;; Fuel grade metadata
(define-map fuel-grades 
  { grade: (string-ascii 20) }
  { description: (string-ascii 100), 
    energy-content: uint })

;; Authorized minters map
(define-map authorized-minters principal bool)

;; Token trait implementation
(define-trait sip010-ft-trait
  (
    (transfer (uint principal principal (optional (buff 34))) (response bool uint))
    (get-name () (response (string-ascii 32) uint))
    (get-symbol () (response (string-ascii 10) uint))
    (get-decimals () (response uint uint))
    (get-balance (principal) (response uint uint))
    (get-total-supply () (response uint uint))
  )
)

;; Authorization check
(define-private (is-authorized-minter (minter principal))
  (default-to false (map-get? authorized-minters minter))
)

;; Add a fuel grade
(define-public (add-fuel-grade 
  (grade (string-ascii 20)) 
  (description (string-ascii 100)) 
  (energy-content uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR_UNAUTHORIZED))
    (map-set fuel-grades { grade: grade } 
      { description: description, energy-content: energy-content })
    (ok true)
  )
)

;; Get fuel grade details
(define-read-only (get-fuel-grade (grade (string-ascii 20)))
  (map-get? fuel-grades { grade: grade })
)

;; Authorize a minter
(define-public (authorize-minter (minter principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR_UNAUTHORIZED))
    (map-set authorized-minters minter true)
    (ok true)
  )
)

;; Revoke minter authorization
(define-public (revoke-minter (minter principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR_UNAUTHORIZED))
    (map-delete authorized-minters minter)
    (ok true)
  )
)

;; Mint tokens (only for authorized minters)
(define-public (mint (amount uint) (recipient principal) (grade (string-ascii 20)))
  (begin
    ;; Validate minter
    (asserts! (is-authorized-minter tx-sender) (err ERR_UNAUTHORIZED))
    
    ;; Validate amount
    (asserts! (> amount u0) (err ERR_INVALID_AMOUNT))
    
    ;; Validate fuel grade exists
    (asserts! (is-some (get-fuel-grade grade)) (err ERR_MINT_FAILED))
    
    ;; Mint tokens
    (try! (ft-mint? fuel-token amount recipient))
    
    ;; Update total supply
    (var-set total-supply (+ (var-get total-supply) amount))
    
    (ok true)
  )
)

;; Burn tokens
(define-public (burn (amount uint))
  (begin
    ;; Validate amount
    (asserts! (> amount u0) (err ERR_INVALID_AMOUNT))
    
    ;; Burn tokens
    (try! (ft-burn? fuel-token amount tx-sender))
    
    ;; Update total supply
    (var-set total-supply (- (var-get total-supply) amount))
    
    (ok true)
  )
)

;; SIP-010 token transfer with access control
(define-public (transfer 
  (amount uint) 
  (sender principal) 
  (recipient principal) 
  (memo (optional (buff 34))))
  (begin
    ;; Validate sender is tx-sender
    (asserts! (is-eq tx-sender sender) (err ERR_UNAUTHORIZED))
    
    ;; Validate amount
    (asserts! (> amount u0) (err ERR_INVALID_AMOUNT))
    
    ;; Perform transfer
    (try! (ft-transfer? fuel-token amount sender recipient))
    
    ;; Optional memo handling
    (match memo 
      print-memo (print print-memo)
      true)
    
    (ok true)
  )
)

;; SIP-010 read-only functions
(define-read-only (get-name)
  (ok "Fuel Token")
)

(define-read-only (get-symbol)
  (ok "FUEL")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance fuel-token account))
)

(define-read-only (get-total-supply)
  (ok (var-get total-supply))
)

;; Implement the token trait
(impl-trait sip010-ft-trait)