(define-map communities {id: uint} {name: (string-ascii 100)})

(define-read-only (get-community (id uint))
  (match (map-get? communities {id: id})
    entry (ok entry)
    (err u404)))

(define-constant ERR_CONFLICT u409)

(define-public (register-community (id uint) (name (string-ascii 100)))
  (begin
    (if (is-some (map-get? communities {id: id}))
        (err ERR_CONFLICT)
        (begin
          (map-set communities {id: id} {name: name})
          (ok id)))))

;; TODO: add membership, trading logic, reputation tracking.
