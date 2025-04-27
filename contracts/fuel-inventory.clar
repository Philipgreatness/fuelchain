;; FuelChain: Fuel Inventory Management Contract
;; 
;; This contract provides a comprehensive system for tracking and managing fuel inventory
;; across different locations and grades, with role-based access control and event logging.

;; Error Codes
(define-constant ERR_UNAUTHORIZED u403)
(define-constant ERR_INSUFFICIENT_INVENTORY u404)
(define-constant ERR_INVALID_QUANTITY u405)
(define-constant ERR_LOCATION_NOT_FOUND u406)

;; Fuel Grades Enum (as constants)
(define-constant FUEL_GRADE_REGULAR u0)
(define-constant FUEL_GRADE_PREMIUM u1)
(define-constant FUEL_GRADE_DIESEL u2)

;; Roles
(define-map roles 
  principal 
  (tuple 
    (is-admin bool) 
    (is-logistics-manager bool)
    (is-inventory-clerk bool)
  )
)

;; Inventory Tracking Map
(define-map fuel-inventory 
  {
    location: (buff 50),  ;; Location identifier 
    grade: uint           ;; Fuel grade 
  }
  uint  ;; Quantity of fuel
)

;; Total Inventory Tracker
(define-data-var total-inventory uint u0)

;; Event Definitions
(define-event fuel-added 
  (location (buff 50))
  (grade uint)
  (quantity uint)
)

(define-event fuel-transferred
  (from-location (buff 50))
  (to-location (buff 50))
  (grade uint)
  (quantity uint)
)

(define-event fuel-consumed
  (location (buff 50))
  (grade uint)
  (quantity uint)
)

;; Authorization Check
(define-private (is-authorized-role)
  (let 
    ((sender-role (map-get? roles tx-sender)))
    (if (is-some sender-role)
        (or 
          (get is-admin (unwrap-panic sender-role))
          (get is-logistics-manager (unwrap-panic sender-role))
          (get is-inventory-clerk (unwrap-panic sender-role))
        )
        false
    )
  )
)

;; Private: Update Inventory
(define-private (update-inventory 
    (location (buff 50)) 
    (grade uint) 
    (quantity uint) 
    (is-adding bool)
  )
  (let 
    ((current-inventory 
      (default-to u0 
        (map-get? fuel-inventory 
          {location: location, grade: grade}
        )
      )
    )
     (new-inventory 
      (if is-adding 
          (+ current-inventory quantity)
          (- current-inventory quantity)
      )
    ))
    ;; Validate quantity
    (asserts! (>= current-inventory quantity) (err ERR_INSUFFICIENT_INVENTORY))
    
    ;; Update inventory map
    (map-set fuel-inventory 
      {location: location, grade: grade} 
      new-inventory
    )
    
    ;; Update total inventory
    (var-set total-inventory 
      (if is-adding 
          (+ (var-get total-inventory) quantity)
          (- (var-get total-inventory) quantity)
      )
    )
    
    (ok new-inventory)
  )
)

;; Add New Fuel Inventory
(define-public (add-fuel-inventory 
    (location (buff 50)) 
    (grade uint) 
    (quantity uint)
  )
  (begin
    ;; Authorization check
    (asserts! (is-authorized-role) (err ERR_UNAUTHORIZED))
    
    ;; Validate quantity
    (asserts! (> quantity u0) (err ERR_INVALID_QUANTITY))
    
    ;; Update inventory
    (try! (update-inventory location grade quantity true))
    
    ;; Emit event
    (print (fuel-added location grade quantity))
    
    (ok true)
  )
)

;; Transfer Fuel Between Locations
(define-public (transfer-fuel 
    (from-location (buff 50)) 
    (to-location (buff 50)) 
    (grade uint) 
    (quantity uint)
  )
  (begin
    ;; Authorization check
    (asserts! (is-authorized-role) (err ERR_UNAUTHORIZED))
    
    ;; Validate quantity
    (asserts! (> quantity u0) (err ERR_INVALID_QUANTITY))
    
    ;; Reduce source inventory
    (try! (update-inventory from-location grade quantity false))
    
    ;; Add to destination inventory
    (try! (update-inventory to-location grade quantity true))
    
    ;; Emit transfer event
    (print (fuel-transferred from-location to-location grade quantity))
    
    (ok true)
  )
)

;; Record Fuel Consumption
(define-public (record-fuel-consumption 
    (location (buff 50)) 
    (grade uint) 
    (quantity uint)
  )
  (begin
    ;; Authorization check
    (asserts! (is-authorized-role) (err ERR_UNAUTHORIZED))
    
    ;; Validate quantity
    (asserts! (> quantity u0) (err ERR_INVALID_QUANTITY))
    
    ;; Reduce inventory
    (try! (update-inventory location grade quantity false))
    
    ;; Emit consumption event
    (print (fuel-consumed location grade quantity))
    
    (ok true)
  )
)

;; Read-Only: Check Fuel Availability
(define-read-only (get-fuel-availability 
    (location (buff 50)) 
    (grade uint)
  )
  (map-get? fuel-inventory {location: location, grade: grade})
)

;; Read-Only: Get Total Inventory
(define-read-only (get-total-inventory)
  (var-get total-inventory)
)

;; Admin Function: Assign Role
(define-public (assign-role 
    (user principal) 
    (role-type (string-ascii 20)) 
    (is-assigned bool)
  )
  (let 
    ((current-roles 
      (default-to 
        {is-admin: false, is-logistics-manager: false, is-inventory-clerk: false} 
        (map-get? roles user)
      )
    ))
    ;; Only admin can assign roles
    (asserts! (is-authorized-role) (err ERR_UNAUTHORIZED))
    
    (map-set roles user
      (if (is-eq role-type "admin")
          (merge current-roles {is-admin: is-assigned})
          (if (is-eq role-type "logistics")
              (merge current-roles {is-logistics-manager: is-assigned})
              (if (is-eq role-type "inventory")
                  (merge current-roles {is-inventory-clerk: is-assigned})
                  current-roles
              )
          )
      )
    )
    
    (ok true))
)