# TODO.md - UX Improvements: Auto-Read, Infinite Scroll & Responsive Labels

## Status: 🚀 In Progress (0/15 complete)

### 1. Backend Updates ✅ COMPLETE
- ✅ Create/Update `NotificationRepository.java` - Add `marquerLuesParRoute` query
- ✅ Create/Update `NotificationController.java` - Add PATCH `/marquer-lus-par-route` endpoint

### 2. Frontend Hooks ✅ COMPLETE
- ✅ Create `useIntersectionObserver.ts` hook

### 3. Auto-Read Notifications ✅ COMPLETE
- ✅ Update `MessagesPage.tsx` - Call new endpoint on active conversation

### 4. Infinite Scroll Implementation ✅ COMPLETE
- ✅ Update `FeedPage.tsx` - Replace Load More button with observer
- ✅ Update `AnnoncesPage.tsx` - Replace Load More button with observer
- ✅ Update `NotificationsPage.tsx` - Replace Load More button with observer
- [ ] Update `AnnoncesPage.tsx` - Replace Load More button with observer  
- [ ] Update `NotificationsPage.tsx` - Replace Load More button with observer

### 5. Responsive UI Polish ✅ COMPLETE
 - ✅ Update `AppLayout.tsx` - Bottom nav & top icons have clear labels
 - ✅ Update `AnnonceDetailsPage.tsx` - All action buttons have descriptive labels (Like/Share/Reserve/Contact)

### 6. Testing & Verification ✅ Pending
- [ ] Backend: Test new endpoint with Postman/curl
- [ ] Frontend: Test infinite scroll on all 3 pages
- [ ] Test auto-read: Open chat → notification count decreases
- [ ] Mobile: Verify all labels visible
- [ ] Performance: Monitor scroll loading threshold

### 7. Completion
- [ ] Update this TODO with completion status
- [ ] Run `attempt_completion` with demo commands
