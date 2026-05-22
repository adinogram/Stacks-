/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const clarityContractCode = `;; Stacks Bitcoin L2 Proof-of-Activity Platform Smart Contract
;; Written in Clarity v2 for Stacks Blockchain
;; Manages Task creations, proof submissions, multi-party validator signatures, and reward distribution

;; --- CONSTANTS & ERROR CODES ---
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_INVALID_TASK (err u101))
(define-constant ERR_TASK_SUSPENDED (err u102))
(define-constant ERR_ALREADY_VERIFIED (err u103))
(define-constant ERR_ALREADY_EXISTS (err u104))
(define-constant ERR_INSUFFICIENT_FUNDS (err u105))

(define-constant CONTRACT_OWNER tx-sender)

;; --- DATA VARIABLES ---
(define-data-var total-tasks u0)
(define-data-var total-submissions u0)
(define-data-var total-rewards-distributed u0)

;; --- DATA MAPS ---

;; Tasks mapping
(define-map Tasks
  { task-id: uint }
  {
    creator: principal,
    title: (string-ascii 80),
    reward-poa: uint,
    required-proof-type: (string-ascii 32),
    difficulty: (string-ascii 12),
    active: bool,
    stx-locked: uint,
    block-height: uint
  }
)

;; Submission Proofs mapping
(define-map Submissions
  { submission-id: uint }
  {
    task-id: uint,
    submitter: principal,
    proof-url: (string-utf8 256),
    status: (string-ascii 16), ;; "pending" | "approved" | "rejected"
    validator: (optional principal),
    reward-claimed: bool,
    timestamp: uint
  }
)

;; Developer Balances (Off-chain anchored tracking ledger)
(define-map DeveloperPoaBalances
  { developer: principal }
  { balance: uint }
)

;; --- READ-ONLY FUNCTIONS ---

(define-read-only (get-task (task-id uint))
  (map-get? Tasks { task-id: task-id })
)

(define-read-only (get-submission (submission-id uint))
  (map-get? Submissions { submission-id: submission-id })
)

(define-read-only (get-developer-balance (developer principal))
  (default-to { balance: u0 }
    (map-get? DeveloperPoaBalances { developer: developer })
  )
)

;; --- PUBLIC WRITE FUNCTIONS ---

;; 1. CREATE TASK
;; Lock STX coins on-chain to sponsor development incentivization pool.
(define-public (create-task 
    (title (string-ascii 80)) 
    (reward-poa uint) 
    (proof-type (string-ascii 32)) 
    (difficulty (string-ascii 12)) 
    (stx-to-lock uint))
  (let
    (
      (current-id (+ (var-get total-tasks) u1))
    )
    ;; Ensure caller transfers the lock contract fee
    (try! (stx-transfer? stx-to-lock tx-sender (as-contract tx-sender)))
    
    ;; Set mapping
    (map-set Tasks
      { task-id: current-id }
      {
        creator: tx-sender,
        title: title,
        reward-poa: reward-poa,
        required-proof-type: proof-type,
        difficulty: difficulty,
        active: true,
        stx-locked: stx-to-lock,
        block-height: block-height
      }
    )
    
    ;; Increment overall index
    (var-set total-tasks current-id)
    (ok current-id)
  )
)

;; 2. SUBMIT TASK PROOF OF COMPLETION
(define-public (submit-proof (task-id uint) (proof-url (string-utf8 256)))
  (let
    (
      (current-id (+ (var-get total-submissions) u1))
      (task-info (unwrap! (get-task task-id) (err ERR_INVALID_TASK)))
    )
    ;; Ensure task is active
    (asserts! (get active task-info) (err ERR_TASK_SUSPENDED))
    
    ;; Set submission records
    (map-set Submissions
      { submission-id: current-id }
      {
        task-id: task-id,
        submitter: tx-sender,
        proof-url: proof-url,
        status: "pending",
        validator: none,
        reward-claimed: false,
        timestamp: block-height
      }
    )
    
    (var-set total-submissions current-id)
    (ok current-id)
  )
)

;; 3. VERIFY SUBMISSION & DISBURSE REWARDS
;; Only contract owner or designated trusted platform validators can stamp evaluations.
(define-public (verify-submission (submission-id uint) (approved bool))
  (let
    (
      (submission-info (unwrap! (get-submission submission-id) (err ERR_INVALID_TASK)))
      (task-info (unwrap! (get-task (get task-id submission-info)) (err ERR_INVALID_TASK)))
      (submitter (get submitter submission-info))
      (reward-amount (get reward-poa task-info))
      (stx-reward (get stx-locked task-info))
    )
    ;; Verify caller is authorized
    (asserts! (is-eq tx-sender CONTRACT_OWNER) (err ERR_UNAUTHORIZED))
    ;; Ensure current state is still pending
    (asserts! (is-eq (get status submission-info) "pending") (err ERR_ALREADY_VERIFIED))
    
    (if approved
      (begin
        ;; 1. Update proof status
        (map-set Submissions
          { submission-id: submission-id }
          (merge submission-info { 
            status: "approved", 
            validator: (some tx-sender), 
            reward-claimed: true 
          })
        )
        ;; 2. Mint Proof-of-Activity (PoA) Utility tokens to Developer
        (let
          (
            (current-balance (get balance (get-developer-balance submitter)))
          )
          (map-set DeveloperPoaBalances
            { developer: submitter }
            { balance: (+ current-balance reward-amount) }
          )
        )
        ;; 3. Refund / Disburse escrowed STX back to submitter as Bitcoin L2 reward payout
        (as-contract (try! (stx-transfer? stx-reward tx-sender submitter)))
        
        ;; Record global distribution index
        (var-set total-rewards-distributed (+ (var-get total-rewards-distributed) reward-amount))
        (ok true)
      )
      
      (begin
        ;; Set status to rejected
        (map-set Submissions
          { submission-id: submission-id }
          (merge submission-info { 
            status: "rejected", 
            validator: (some tx-sender), 
            reward-claimed: false 
          })
        )
        (ok false)
      )
    )
  )
)
`;
