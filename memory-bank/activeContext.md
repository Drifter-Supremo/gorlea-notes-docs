# 🎯 Active Context: Gorlea Notes & Docs

## Current Sprint Focus
Gorlea Docs Phase 2: Basic Editor Functionality & Feature Planning

## Active Decisions

### 1. Framework Selection
- **Decision**: Starting with vanilla HTML/CSS/JS
- **Rationale**: 
  - Simpler initial implementation
  - Faster MVP development
  - Can migrate to React later if needed
- **Status**: Confirmed
- **Impact**: Affects initial project structure and development approach

### 2. Backend Architecture
- **Decision**: Express.js server with Firestore
- **Rationale**:
  - More direct control over implementation
  - Simpler local development
  - Better for learning/understanding the flow
  - Native Firebase integration
- **Status**: Implemented
- **Impact**: Backend structure and storage approach established

### 3. AI Provider
- **Decision**: Gemini 2.0 Flash
- **Rationale**:
  - Latest model with enhanced performance
  - Optimized for real-time interactions
  - Cost-effective for MVP
- **Status**: Implemented
- **Impact**: Successfully handling note rewriting with good results

### 4. Document Storage
- **Decision**: Migrating from Google Docs to Firestore
- **Rationale**:
  - More control over document structure
  - Simpler implementation
  - Better integration with existing auth
  - Reduced API complexity
- **Status**: In Progress
- **Impact**: Simplifies storage layer, removes Google API dependencies

### 5. Editor Selection
- **Decision**: Evaluating Tiptap vs Quill
- **Rationale**:
  - Both provide rich text editing
  - Modern, maintained libraries
  - Good documentation
  - Active communities
- **Status**: To be decided
- **Impact**: Will affect editor implementation approach

## Current Work Threads

### 1. Project Infrastructure
- [✓] Initialize project repository
- [✓] Set up development environment
- [ ] Configure ESLint and Prettier
- [✓] Create initial project structure
- [✓] Set up Express server
- [✓] Configure Firestore

### 2. Authentication Flow
- [✓] Configure Google OAuth
- [✓] Implement token management
- [✓] Set up secure session handling
- [✓] Create login/logout flow
- [ ] Add token refresh mechanism

### 3. Gorlea Notes Interface
- [✓] Design basic UI layout
- [✓] Implement chat input
- [✓] Create message display
- [✓] Add basic styling
- [✓] Integrate AI processing

### 4. Gorlea Docs Phase 1
- [✓] Create /docs route
- [✓] Implement document list view
- [✓] Add new document button
- [✓] Set up Firestore document storage
- [✓] Add loading/error states
- [✓] Implement editor page (Phase 2 - Basic Load/Save)

## Technical Considerations

### Active Issues
1. Editor Selection:
   - Evaluating Tiptap and Quill features
   - Considering performance implications
   - Assessing customization needs
   - Reviewing community support

2. Recent Changes (March 26):
   - Created document list view
   - Implemented Firestore document storage
   - Added document CRUD endpoints
   - Set up protected routes

3. Current Blockers:
   - Editor implementation pending
   - Export functionality not started
   - Document content storage structure TBD

### Open Questions
1. Best approach for rich text storage in Firestore
2. Export format preferences
3. Editor customization requirements
4. Future collaborative features

## Next Steps

### Immediate (Next 24-48 Hours)
1. Test basic editor load/save functionality thoroughly.
2. Implement auto-save feature for the editor.
3. Add a delete button and functionality (soft delete via `isArchived`).
4. Plan Gorlea Notes integration (saving notes to specific docs).
5. Select and integrate rich text editor (Tiptap confirmed, implementation pending).

### Short Term (This Week)
1. Implement rich text editor (Tiptap).
2. Refine editor UI/UX.
3. Implement export functionality (if still desired).

### Medium Term (Next 2 Weeks)
1. Complete Gorlea Docs MVP (including rich text).
2. Add comprehensive testing.
3. Begin user testing.
4. Implement Gorlea Notes integration.

## Recent Changes
- **(March 27)** Debugged editor page visibility:
    - Corrected HTML structure in `editor.html` (elements misplaced outside wrapper).
    - Verified asset paths and server config.
    - Added JS logging.
    - Used systematic CSS debugging to isolate cause.
    - Removed logo from `editor.html` as it was causing layout conflict.
- **(March 27)** Refactored Firestore logic (`firestore.js`):
    - Replaced `updatedAt` with `lastOpenedAt`.
    - Added update `lastOpenedAt` on `getDocument`.
    - Updated sorting in `listDocuments` to use `lastOpenedAt`.
- **(March 27)** Simplified `docList.js` UI (removed date display).
- Added document list view (March 26, 8:31 AM)
- Implemented Firestore document storage (March 26, 8:32 AM)
- Created document CRUD endpoints (March 26, 8:33 AM)
- Added protected routes for docs (March 26, 8:31 AM)
- **(March 29)** Implemented Gorlea Docs editor flow enhancements:
    - Added "Docs Home" button to `editor.html`.
    - Ensured "New Document" button state resets correctly in `docList.js` using `finally`.
    - Added title validation (defaulting to "Untitled Document") on frontend save (`editor.js`) and backend update (`docsController.js`).
    - Refactored button styling in `editor.css` using a shared `.button-accent` class for "New Document" and "Docs Home" buttons.
- **(March 29)** Added Archive (soft delete) and Delete (permanent) functionality to document list:
    - Added Archive/Delete buttons to document cards in `docList.js`.
    - Implemented backend routes (`PUT /api/docs/:id/archive`, `DELETE /api/docs/:id`) and corresponding controller/utility functions.
    - Added frontend logic in `docList.js` to call APIs and update UI.
    - Included confirmation dialog for permanent delete.
- **(March 29)** Fixed document card icon alignment:
    - Refactored card HTML structure in `docList.js` (`.doc-main`, `.doc-actions`).
    - Adjusted CSS in `editor.css` (`.doc-card`, `.doc-actions`) for correct Flexbox layout.


## Risk Register

### Active Risks
1. Editor integration complexity
2. Firestore document size limits
3. Export functionality challenges
4. Session management in production
5. Rich text storage optimization

### Mitigation Strategies
1. Thorough editor evaluation
2. Document size monitoring
3. Export format testing
4. Proper security measures
5. Storage optimization planning

---

Last Updated: 2025-03-27 4:33 PM PDT
Next Review: 2025-03-28
