// assets/js/firebase.js
import { getApps, getApp, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDFj9gOYU49Df6ohUR5CnbRv3qdY2i_OmU",
  authDomain: "ipa-panel.firebaseapp.com",
  projectId: "ipa-panel",
  storageBucket: "ipa-panel.firebasestorage.app",
  messagingSenderId: "239982196215",
  appId: "1:239982196215:web:9de387c51952da428daaf2"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true
});

export { db };
