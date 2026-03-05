(define-map communities {id: uint} {name: (string-ascii 100)})

;; Track membership: { community-id, member-principal } -> true if member
(define-map members {community-id: uint, member: principal} {joined: bool})

;; Track member count per community
(define-map member-count {community-id: uint} {count: uint})

(define-read-only (get-community (id uint))
  (match (map-get? communities {id: id})
    entry (ok entry)
    (err u404)))

;; Check if user is a member of a community
(define-read-only (is-member (community-id uint) (member principal))
  (match (map-get? members {community-id: community-id, member: member})
    entry (ok true)
    (ok false)))

;; Get member count for a community
(define-read-only (get-member-count (community-id uint))
  (match (map-get? member-count {community-id: community-id})
    count-entry (ok (get count count-entry))
    (ok u0)))

(define-constant ERR_CONFLICT u409)
(define-constant ERR_NOT_FOUND u404)
(define-constant ERR_UNAUTHORIZED u403)

(define-public (register-community (id uint) (name (string-ascii 100)))
  (begin
    (if (is-some (map-get? communities {id: id}))
        (err ERR_CONFLICT)
        (begin
          (map-set communities {id: id} {name: name})
          (ok id)))))

;; Join a community (becomes a member)
(define-public (join-community (community-id uint))
  (begin
    (if (is-none (map-get? communities {id: community-id}))
        (err ERR_NOT_FOUND)
        (begin
          ;; Check if already a member
          (if (is-some (map-get? members {community-id: community-id, member: tx-sender}))
              (err ERR_CONFLICT)
              (begin
                ;; Become a member
                (map-set members 
                         {community-id: community-id, member: tx-sender}
                         {joined: true})
                ;; Increment member count
                (let ((current-count (match (map-get? member-count {community-id: community-id})
                                        cnt (get count cnt)
                                        u0)))
                  (map-set member-count
                           {community-id: community-id}
                           {count: (+ current-count u1)})
                  (ok community-id))))))))

;; Leave a community (removes membership)
(define-public (leave-community (community-id uint))
  (begin
    (if (is-none (map-get? members {community-id: community-id, member: tx-sender}))
        (err ERR_NOT_FOUND)
        (begin
          (map-delete members {community-id: community-id, member: tx-sender})
          ;; Decrement member count
          (let ((current-count (match (map-get? member-count {community-id: community-id})
                                  cnt (get count cnt)
                                  u0)))
            (begin
              (if (> current-count u0)
                  (map-set member-count
                           {community-id: community-id}
                           {count: (- current-count u1)})
                  true)
              (ok community-id)))))))

;; TODO: add trading logic, reputation tracking.
