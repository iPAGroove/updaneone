import { auth, db } from "../app.js";
import { ref, uploadBytes, getDownloadURL, getStorage } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const storage = getStorage();

export async function uploadCertificate(file, password) {
  const user = auth.currentUser;
  if (!user) return alert("Сначала войдите в аккаунт.");

  const certRef = ref(storage, `certificates/${user.uid}/${file.name}`);
  await uploadBytes(certRef, file);
  const certUrl = await getDownloadURL(certRef);

  // Пока UDID и Дата — временные (мы позже их извлечём автоматически)
  const certData = {
    certUrl,
    password: password || "",
    udid: "Определяем...",
    expiresAt: "Определяем...",
    uploadedAt: Date.now()
  };

  await setDoc(doc(db, "users", user.uid, "config", "certificate"), certData);
  return certData;
}

export async function getCertificate() {
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await getDoc(doc(db, "users", user.uid, "config", "certificate"));
  return snap.exists() ? snap.data() : null;
}

export async function deleteCertificate() {
  const user = auth.currentUser;
  if (!user) return;
  await deleteDoc(doc(db, "users", user.uid, "config", "certificate"));
}
