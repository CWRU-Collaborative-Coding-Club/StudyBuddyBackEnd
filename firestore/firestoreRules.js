rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // All users must be authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper: check if the user is a member of the chat
    function isChatMember(chat) {
      return request.auth.uid in chat.data.users;
    }

    // USERS COLLECTION
    match /users/{userId} {
      allow read, update, delete: if isAuthenticated() && request.auth.uid == userId;
      allow create: if isAuthenticated();
    }

    // SESSIONS COLLECTION
    match /sessions/{sessionId} {
      allow create: if isAuthenticated();
      allow read: if isAuthenticated();
      allow update, delete: if isAuthenticated() && request.auth.uid == resource.data.creatorUid;
    }

    // MATCHES COLLECTION
    match /matches/{matchId} {
      allow read, write: if isAuthenticated() && request.auth.uid in resource.data.users;
    }

    // CHATS COLLECTION
    match /chats/{chatId} {
      allow read, write: if isAuthenticated() && isChatMember(resource);

      // MESSAGES SUBCOLLECTION
      match /messages/{messageId} {
        allow create: if isAuthenticated() && request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.users;
        allow read: if isAuthenticated() && isChatMember(get(/databases/$(database)/documents/chats/$(chatId)));
      }
    }
  }
}