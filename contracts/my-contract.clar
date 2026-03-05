;; Seed Exchange Contract: enables peer-to-peer seed trading
;; Allows community members to propose and accept seed exchanges

(define-map trades
  { id: uint }
  { offerer: principal,
    offered-seed-id: uint,
    requested-seed-id: uint,
    community-id: uint,
    accepter: (optional principal),
    status: (string-ascii 20)})

;; Track trade IDs by offerer for efficient querying
(define-map trades-by-offerer
  { offerer: principal, index: uint }
  { trade-id: uint })

;; Count trades per offerer
(define-map trades-count-by-offerer
  { offerer: principal }
  { count: uint })

(define-data-var next-trade-id uint u1)

(define-constant ERR_NOT_FOUND u404)
(define-constant ERR_CONFLICT u409)
(define-constant ERR_UNAUTHORIZED u403)
(define-constant ERR_BAD_INPUT u400)
(define-constant TRADE_STATUS_OPEN "open")
(define-constant TRADE_STATUS_COMPLETED "completed")
(define-constant TRADE_STATUS_CANCELLED "cancelled")

(define-read-only (get-trade (id uint))
  (match (map-get? trades {id: id})
    entry (ok entry)
    (err ERR_NOT_FOUND)))

;; helper: return the status string of a given trade
(define-read-only (get-trade-status (id uint))
  (match (map-get? trades {id: id})
    entry (ok (get status entry))
    (err ERR_NOT_FOUND)))

;; helper: check whether a trade is still open
(define-read-only (is-trade-open (id uint))
  (match (map-get? trades {id: id})
    entry (ok (is-eq (get status entry) TRADE_STATUS_OPEN))
    (err ERR_NOT_FOUND)))

;; Get count of trades initiated by an offerer
(define-read-only (get-trades-count-by-offerer (offerer principal))
  (match (map-get? trades-count-by-offerer {offerer: offerer})
    count-entry (ok (get count count-entry))
    (ok u0)))

;; Get a specific trade ID by offerer and index (0-based)
(define-read-only (get-trade-by-offerer-at-index (offerer principal) (index uint))
  (match (map-get? trades-by-offerer {offerer: offerer, index: index})
    entry (ok (get trade-id entry))
    (err ERR_NOT_FOUND)))

;; Initiate a seed trade offer within a community
;; Both offerer and accepter must be members of the community
(define-public (initiate-trade (offered-seed-id uint) (requested-seed-id uint) (community-id uint))
  (begin
    (if (is-eq offered-seed-id requested-seed-id)
        (err ERR_BAD_INPUT)
        (begin
          (let ((trade-id (var-get next-trade-id))
                (current-count (match (map-get? trades-count-by-offerer {offerer: tx-sender})
                                  cnt (get count cnt)
                                  u0)))
            (map-set trades
                     {id: trade-id}
                     {offerer: tx-sender,
                      offered-seed-id: offered-seed-id,
                      requested-seed-id: requested-seed-id,
                      community-id: community-id,
                      accepter: none,
                      status: TRADE_STATUS_OPEN})
            (map-set trades-by-offerer
                     {offerer: tx-sender, index: current-count}
                     {trade-id: trade-id})
            (map-set trades-count-by-offerer
                     {offerer: tx-sender}
                     {count: (+ current-count u1)})
            (var-set next-trade-id (+ trade-id u1))
            (ok trade-id))))))

;; Accept a trade offer: caller becomes the accepter
(define-public (accept-trade (trade-id uint))
  (match (map-get? trades {id: trade-id})
    entry
      (begin
        (if (not (is-eq (get status entry) TRADE_STATUS_OPEN))
            (err ERR_CONFLICT)
            (if (is-eq tx-sender (get offerer entry))
                (err ERR_UNAUTHORIZED)
                (begin
                  (map-set trades
                           {id: trade-id}
                           {offerer: (get offerer entry),
                            offered-seed-id: (get offered-seed-id entry),
                            requested-seed-id: (get requested-seed-id entry),
                            community-id: (get community-id entry),
                            accepter: (some tx-sender),
                            status: TRADE_STATUS_COMPLETED})
                  (ok trade-id)))))
    (err ERR_NOT_FOUND)))

;; Cancel a trade offer if not yet accepted (offerer only)
(define-public (cancel-trade (trade-id uint))
  (match (map-get? trades {id: trade-id})
    entry
      (begin
        (if (not (is-eq tx-sender (get offerer entry)))
            (err ERR_UNAUTHORIZED)
            (if (not (is-eq (get status entry) TRADE_STATUS_OPEN))
                (err ERR_CONFLICT)
                (begin
                  (map-set trades
                           {id: trade-id}
                           {offerer: (get offerer entry),
                            offered-seed-id: (get offered-seed-id entry),
                            requested-seed-id: (get requested-seed-id entry),
                            community-id: (get community-id entry),
                            accepter: (get accepter entry),
                            status: TRADE_STATUS_CANCELLED})
                  (ok trade-id)))))
    (err ERR_NOT_FOUND)))

;; Get the next trade ID that would be assigned
(define-read-only (get-next-trade-id)
  (ok (var-get next-trade-id)))
