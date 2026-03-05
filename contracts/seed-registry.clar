(define-map seeds { id: uint } { owner: principal, species: (string-ascii 100), variety: (string-ascii 100), origin: (string-ascii 100), viability: uint })

;; history maps track the owner chain for each seed
(define-map seed-history-count { id: uint } { count: uint })
(define-map seed-history { id: uint, idx: uint } { owner: principal })

(define-constant ERR_NOT_FOUND u404)
(define-constant ERR_CONFLICT u409)
(define-constant ERR_UNAUTHORIZED u403)
(define-constant ERR_BAD_INPUT u400)

(define-read-only (get-seed (id uint))
  (match (map-get? seeds {id: id})
    entry (ok entry)
    (err ERR_NOT_FOUND)))

;; Register a new seed entry. Fails if `id` already exists or viability > 100.
(define-public (register-seed (id uint)
                              (species (string-ascii 100))
                              (variety (string-ascii 100))
                              (origin (string-ascii 100))
                              (viability uint))
  (begin
    (if (is-some (map-get? seeds {id: id}))
        (err ERR_CONFLICT)
        (if (not (<= viability u100))
            (err ERR_BAD_INPUT)
            (begin
              ;; store seed itself
              (map-set seeds {id: id}
                       { owner: tx-sender,
                         species: species,
                         variety: variety,
                         origin: origin,
                         viability: viability })
              ;; initialize history: first owner is the registrant
              (map-set seed-history {id: id, idx: u0} {owner: tx-sender})
              (map-set seed-history-count {id: id} {count: u1})
              (ok id))))))

;; Update metadata for a seed. Only the owner may update.
(define-public (update-seed (id uint)
                            (species (string-ascii 100))
                            (variety (string-ascii 100))
                            (origin (string-ascii 100))
                            (viability uint))
  (match (map-get? seeds {id: id})
    entry
      (begin
        (if (is-eq tx-sender (get owner entry))
            (if (not (<= viability u100))
                (err ERR_BAD_INPUT)
                (begin
                  (map-set seeds {id: id}
                           { owner: (get owner entry),
                             species: species,
                             variety: variety,
                             origin: origin,
                             viability: viability })
                  (ok id)))
            (err ERR_UNAUTHORIZED)))
    (err ERR_NOT_FOUND)))

;; Transfer ownership of a seed record to another principal.
(define-public (transfer-seed (id uint) (new-owner principal))
  (match (map-get? seeds {id: id})
    entry
      (begin
        (if (is-eq tx-sender (get owner entry))
            (begin
              ;; update seed owner
              (map-set seeds {id: id}
                       { owner: new-owner,
                         species: (get species entry),
                         variety: (get variety entry),
                         origin: (get origin entry),
                         viability: (get viability entry) })
              ;; append to history
              (let ((old-count (match (map-get? seed-history-count {id: id})
                                       c (get count c) u0)))
                (map-set seed-history {id: id, idx: old-count} {owner: new-owner})
                (map-set seed-history-count {id: id} {count: (+ old-count u1)}))
              (ok id))
            (err ERR_UNAUTHORIZED)))
    (err ERR_NOT_FOUND)))


;; -----------------------------------------------------------------
;; History query helpers

(define-read-only (get-seed-history-count (id uint))
  (let ((cnt (match (map-get? seed-history-count {id: id})
                    c (get count c) u0)))
    (ok cnt)))

(define-read-only (get-seed-history-owner-at (id uint) (idx uint))
  (match (map-get? seed-history {id: id, idx: idx})
    rec (ok (get owner rec))
    (err ERR_NOT_FOUND)))

;; TODO: expand with provenance records, certifications, and richer metadata.
