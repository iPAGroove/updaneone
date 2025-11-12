// assets/js/support.js
// ===============================
// URSA Support Chat (реальный чат с поддержкой через support_orders)
// ===============================
import { auth, db } from "./app.js";
import {
  doc,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  getDoc,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// ------------------------------
// 🔧 DOM-элементы
// ------------------------------
const messagesBox = document.getElementById("messages");
const input = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");

let currentUser = null;
let messagesUnsub = null;

// ===============================
// 🔑 Авторизация / Инициализация
// ===============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("⚠️ Чтобы открыть чат поддержки, войдите в аккаунт.");
    window.location.href = "./index.html";
    return;
  }

  currentUser = user;
  const chatId = `support_${user.uid}`;
  const chatRef = doc(db, "support_orders", chatId);

  // Проверяем существование чата
  try {
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        uid: user.uid,
        email: user.email || null,
        status: "open",
        type: "support",
        createdAt: new Date().toISOString(),
      });
      console.log("✅ Новый чат поддержки создан:", chatId);
    } else {
      console.log("ℹ️ Чат уже существует:", chatId);
    }
    listenToMessages(chatId);
  } catch (err) {
    console.error("❌ Ошибка инициализации чата поддержки:", err);
    alert("Не удалось подключиться к чату поддержки.");
  }
});

// ===============================
// 📨 Подписка на сообщения
// ===============================
function listenToMessages(chatId) {
  const messagesRef = collection(db, "support_orders", chatId, "messages");
  const q = query(messagesRef, orderBy("createdAt"));
  if (messagesUnsub) messagesUnsub(); // очистка старых слушателей

  messagesUnsub = onSnapshot(q, (snapshot) => {
    messagesBox.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const msg = docSnap.data();
      const isUser = msg.sender === currentUser.uid;

      const div = document.createElement("div");
      div.className = isUser ? "msg msg-user" : "msg msg-support";

      // текст сообщения
      const bubble = document.createElement("div");
      bubble.className = "msg-bubble";

      const textEl = document.createElement("p");
      textEl.textContent = msg.text || "";

      const timeEl = document.createElement("span");
      timeEl.className = "msg-time";
      timeEl.textContent = formatTime(msg.createdAt?.seconds);

      bubble.appendChild(textEl);
      bubble.appendChild(timeEl);
      div.appendChild(bubble);
      messagesBox.appendChild(div);
    });

    messagesBox.scrollTop = messagesBox.scrollHeight;
  }, (err) => {
    console.error("Ошибка при чтении сообщений:", err);
    alert("⚠️ Нет доступа к чату поддержки.");
  });
}

// ===============================
// 💬 Отправка сообщения
// ===============================
async function sendMessage() {
  const text = input.value.trim();
  if (!text || !currentUser) return;

  const chatId = `support_${currentUser.uid}`;
  const messagesRef = collection(db, "support_orders", chatId, "messages");

  try {
    await addDoc(messagesRef, {
      text,
      sender: currentUser.uid,
      createdAt: serverTimestamp(),
    });

    input.value = "";
    messagesBox.scrollTop = messagesBox.scrollHeight;
  } catch (err) {
    console.error("❌ Ошибка отправки:", err);
    alert("Не удалось отправить сообщение.");
  }
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

// ===============================
// 🧩 События
// ===============================
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

window.addEventListener("beforeunload", () => {
  if (messagesUnsub) messagesUnsub();
});
