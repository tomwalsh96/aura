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

export const onBookingUpdate = functions
  .region("europe-west2")
  .firestore
  .document("businesses/{businessId}/bookings/{bookingId}")
  .onWrite(async (change, context) => {
    const {bookingId} = context.params;
    // Get an admin firestore instance
    const db = admin.firestore();
    // If the document was deleted
    if (!change.after.exists) {
      // Find the user ID from the old document
      const userId = change.before.data()?.userId;
      if (userId) {
        // Delete the corresponding user booking
        await db.doc(`users/${userId}/bookings/${bookingId}`).delete();
      }
      return;
    }
    // Get the updated booking data
    const bookingData = change.after.data();
    if (!bookingData) {
      console.error("No booking data found");
      return;
    }
    const userId = bookingData.userId;
    // Update the corresponding user booking
    await db.doc(`users/${userId}/bookings/${bookingId}`).set(bookingData);
  });

export const onUserBookingUpdate = functions
  .region("europe-west2")
  .firestore
  .document("users/{userId}/bookings/{bookingId}")
  .onWrite(async (change, context) => {
    const {bookingId} = context.params;
    // Get an admin firestore instance
    const db = admin.firestore();
    // If the document was deleted
    if (!change.after.exists) {
      // Find the business ID from the old document
      const businessId = change.before.data()?.businessId;
      if (businessId) {
        // Delete the corresponding business booking
        await db.doc(`businesses/${businessId}/bookings/${bookingId}`).delete();
      }
      return;
    }
    // Get the updated booking data
    const bookingData = change.after.data();
    if (!bookingData) {
      console.error("No booking data found");
      return;
    }
    const businessId = bookingData.businessId;
    // Update the corresponding business booking
    await db
      .doc(`businesses/${businessId}/bookings/${bookingId}`)
      .set(bookingData);
  });
