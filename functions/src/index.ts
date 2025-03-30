import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

// Initialize Admin SDK
admin.initializeApp();

export const createUserDocuments = functions
  .region("europe-west2")
  .auth.user()
  .onCreate(async (user) => {
    const db = admin.firestore();
    const batch = db.batch();

    console.log(`Processing user creation for UID: ${user.uid}`);

    try {
      // Create user profile document with basic info
      const userProfileRef = db.collection("users").doc(user.uid);
      batch.set(userProfileRef, {
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create empty chats collection
      const chatsRef = db
        .collection("users")
        .doc(user.uid)
        .collection("chats");
      const dummyDocRef = chatsRef.doc("_dummy");
      batch.set(dummyDocRef, {
        _created: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      // Delete the dummy document
      await dummyDocRef.delete();

      console.log(
        `Successfully created Firestore documents for user ${user.uid}`
      );
    } catch (error) {
      console.error(
        `Error creating Firestore documents for user ${user.uid}`,
        error
      );
      // Re-throw error for visibility in logs
      throw error;
    }
  });

export const deleteUserDocuments = functions
  .region("europe-west2")
  .auth.user()
  .onDelete(async (user) => {
    const db = admin.firestore();
    const batch = db.batch();

    console.log(`Processing user deletion for UID: ${user.uid}`);

    try {
      // Delete user profile document
      const userProfileRef = db.collection("users").doc(user.uid);
      batch.delete(userProfileRef);

      // Delete all documents in the chats collection
      const chatsRef = db.collection("users").doc(user.uid).collection("chats");
      const chatsSnapshot = await chatsRef.get();
      chatsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(
        `Successfully deleted Firestore documents for user ${user.uid}`
      );
    } catch (error) {
      console.error(
        `Error deleting Firestore documents for user ${user.uid}`,
        error
      );
      // Re-throw error for visibility in logs
      throw error;
    }
  });
