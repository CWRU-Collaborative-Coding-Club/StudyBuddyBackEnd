// src/services/firestoreService.js
import { db } from "../config/firebase.js";

/**
 * Get a document by ID.
 */
export const getDoc = async (collection, docId) => {
  const ref = db.collection(collection).doc(docId);
  const doc = await ref.get();

  if (!doc.exists) return null;

  return { id: doc.id, ...doc.data() };
};

/**
 * Set (overwrite) a document.
 */
export const setDoc = async (collection, docId, data, merge = false) => {
  const ref = db.collection(collection).doc(docId);
  await ref.set(data, { merge });
  return { id: docId, ...data };
};

/**
 * Update a document (partial update).
 */
export const updateDoc = async (collection, docId, data) => {
  const ref = db.collection(collection).doc(docId);
  await ref.update(data);
  return true;
};

/**
 * Delete a document.
 */
export const deleteDoc = async (collection, docId) => {
  const ref = db.collection(collection).doc(docId);
  await ref.delete();
  return true;
};

/**
 * Get all documents in a collection.
 */
export const getCollection = async (collection) => {
  const snapshot = await db.collection(collection).get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/**
 * Query a collection using where conditions.
 * Example: queryCollection("users", ["major", "==", "Computer Science"])
 */
export const queryCollection = async (collection, whereClause) => {
  const [field, operator, value] = whereClause;

  const snapshot = await db
    .collection(collection)
    .where(field, operator, value)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/**
 * Create a new document with auto-generated ID.
 */
export const addDoc = async (collection, data) => {
  const ref = await db.collection(collection).add(data);
  return { id: ref.id, ...data };
};

/**
 * Run a Firestore transaction safely.
 */
export const runTransaction = async (handler) => {
  return await db.runTransaction(async (transaction) => {
    try {
      return await handler(transaction);
    } catch (err) {
      console.error("❌ Transaction failed:", err);
      throw err;
    }
  });
};

/**
 * Get subcollection documents.
 */
export const getSubcollection = async (collection, docId, subcollection) => {
  const snapshot = await db
    .collection(collection)
    .doc(docId)
    .collection(subcollection)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/**
 * Add a doc to a subcollection.
 */
export const addSubcollectionDoc = async (
  collection,
  docId,
  subcollection,
  data
) => {
  const ref = await db
    .collection(collection)
    .doc(docId)
    .collection(subcollection)
    .add(data);

  return { id: ref.id, ...data };
};