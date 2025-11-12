// assets/js/support.js
// ===============================
// URSA Support Chat (общий real-time чат с поддержкой через vip_orders)
// ===============================
import { auth, db } from "./app.js";
import {
  doc,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const messagesBox = document.getElementById("messages");
const input = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");

let currentUser = null;
let messagesUnsub = null;

// ===============================
// 🔑 Авторизация / Проверка пользователя
// ===============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("⚠️ Чтобы общаться с поддержкой, войдите в аккаунт.");
    window.location.href = "./index.html";
    return;
  }

  currentUser = user;
  const chatId = `support_${user.uid}`;

  // Проверяем, существует ли заказ (чат)
  const chatRef = doc(db, "vip_orders", chatId);
  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      uid: user.uid,
      email: user.email || null,
      type: "support",
      status: "open",
      createdAt: new Date().toISOString(),
    });
  }

  listenToMessages(chatId);
});

// ===============================
// 📨 Подписка на сообщения
// ===============================
function listenToMessages(chatId) {
  const messagesRef = collection(db, "vip_orders", chatId, "messages");
  messagesUnsub = onSnapshot(messagesRef, (snapshot) => {
    messagesBox.innerHTML = "";

    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const msg = change.doc.data();
        const isUser = msg.sender === currentUser.uid;

        const div = document.createElement("div");
        div.className = isUser ? "msg msg-user" : "msg msg-support";
        div.innerHTML = `
          <div class="msg-bubble">
            <p>${msg.text}</p>
            <span class="msg-time">${formatTime(msg.createdAt?.seconds)}</span>
          </div>`;
        messagesBox.appendChild(div);
      }
    });

    messagesBox.scrollTop = messagesBox.scrollHeight;
  });
}

// ===============================
// 💬 Отправка сообщения
// ===============================
async function sendMessage() {
  const text = input.value.trim();
  if (!text || !currentUser) return;

  const chatId = `support_${currentUser.uid}`;
  const messagesRef = collection(db, "vip_orders", chatId, "messages");

  await addDoc(messagesRef, {
    text,
    sender: currentUser.uid,
    createdAt: serverTimestamp(),
  });

  input.value = "";
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

// ===============================
// ⏱ Форматирование времени
// ===============================
function formatTime(sec) {
  if (!sec) return "";
  const d = new Date(sec * 1000);
  return d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

window.addEventListener("beforeunload", () => {
  if (messagesUnsub) messagesUnsub();
});
