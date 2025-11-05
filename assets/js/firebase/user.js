import { onUserChanged, logout } from "./firebase/auth.js";

const avatar = document.getElementById("user-avatar");
const nickname = document.getElementById("user-nickname");

onUserChanged(user => {
    if (!user) {
        avatar.src = "https://placehold.co/100x100/121722/00b3ff?text=User";
        nickname.textContent = "Гость";
        return;
    }

    nickname.textContent = user.displayName || "Пользователь";
    avatar.src = user.photoURL || "https://placehold.co/100x100/121722/00b3ff?text=User";
});
