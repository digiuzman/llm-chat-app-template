/**
 * HayvanSahipleri.com LLM Chat Frontend - Açık ve Koyu Tema Duyarlı
 */

const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");

// Koyu tema tespiti
const isDarkTheme = document.documentElement.getAttribute("data-color-scheme") === "dark";

if (isDarkTheme) {
  document.body.classList.add("darkTheme");
} else {
  document.body.classList.remove("darkTheme");
}



let chatHistory = [
  {
    role: "assistant",
    content:
      "Merhaba! HayvanSahipleri.com Yapay Zeka Asistanına hoş geldiniz. Sorularınızı buradan sorabilirsiniz.",
  },
];

let isProcessing = false;

// Temaya göre chat container ve input renkleri
function applyTheme() {
  const userBg = isDarkTheme ? "#2c2c2c" : "#e6f0ff";
  const assistantBg = isDarkTheme ? "#1f1f1f" : "#f1f1f1";
  const userColor = isDarkTheme ? "#e0e0e0" : "#111";
  const assistantColor = isDarkTheme ? "#e0e0e0" : "#111";
  const inputBg = isDarkTheme ? "#1f1f1f" : "#fff";
  const inputColor = isDarkTheme ? "#e0e0e0" : "#111";
  const buttonBg = isDarkTheme ? "#3a3a3a" : "#007bff";
  const buttonColor = isDarkTheme ? "#e0e0e0" : "#fff";

  userInput.style.backgroundColor = inputBg;
  userInput.style.color = inputColor;
  sendButton.style.backgroundColor = buttonBg;
  sendButton.style.color = buttonColor;

  // Mevcut mesajlar için renkleri güncelle
  document.querySelectorAll(".user-message").forEach(el => {
    el.style.backgroundColor = userBg;
    el.style.color = userColor;
  });
  document.querySelectorAll(".assistant-message").forEach(el => {
    el.style.backgroundColor = assistantBg;
    el.style.color = assistantColor;
  });

  typingIndicator.style.color = isDarkTheme ? "#e0e0e0" : "#333";
}

// Başlangıçta tema uygula
applyTheme();

// Kullanıcı textarea otomatik boyutlandırma
userInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});

// Enter tuşu ile gönder (Shift+Enter alt satır)
userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Send butonu
sendButton.addEventListener("click", sendMessage);

// Sistem prompt (forum temalı)
const systemPrompt = `
Sen HayvanSahipleri.com forumu için yardımcı bir asistansın.
Cevapların net, kullanıcı dostu ve güvenli olmalı.
Köpek, kedi ve diğer evcil hayvan konularında bilgi ver.
`;

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message || isProcessing) return;

  isProcessing = true;
  userInput.disabled = true;
  sendButton.disabled = true;

  addMessageToChat("user", message);
  userInput.value = "";
  userInput.style.height = "auto";

  typingIndicator.classList.add("visible");
  chatHistory.push({ role: "user", content: message });

  try {
    const assistantEl = document.createElement("div");
    assistantEl.className = "message assistant-message";
    assistantEl.innerHTML = "<p></p>";
    chatMessages.appendChild(assistantEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatHistory, system: systemPrompt }),
    });

    if (!response.ok) throw new Error("Sunucu hatası");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aiMessage = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const jsonData = JSON.parse(line);
          if (jsonData.response) {
            aiMessage += jsonData.response;
            assistantEl.querySelector("p").textContent = aiMessage;
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
        } catch (e) {
          console.error("JSON parse hatası:", e);
        }
      }
    }

    chatHistory.push({ role: "assistant", content: aiMessage });
    applyTheme(); // Mesaj eklendikten sonra renkleri güncelle
  } catch (error) {
    console.error(error);
    addMessageToChat(
      "assistant",
      "Üzgünüz, isteğiniz işlenirken bir hata oluştu."
    );
  } finally {
    typingIndicator.classList.remove("visible");
    isProcessing = false;
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
}

function addMessageToChat(role, content) {
  const messageEl = document.createElement("div");
  messageEl.className = `message ${role}-message`;

  const bgColor = isDarkTheme
    ? role === "user"
      ? "#2c2c2c"
      : "#1f1f1f"
    : role === "user"
    ? "#e6f0ff"
    : "#f1f1f1";
  const color = isDarkTheme ? "#e0e0e0" : "#111";

  messageEl.style.backgroundColor = bgColor;
  messageEl.style.color = color;
  messageEl.style.padding = "10px 14px";
  messageEl.style.borderRadius = "8px";
  messageEl.style.margin = "6px 0";
  messageEl.innerHTML = `<p>${content}</p>`;
  chatMessages.appendChild(messageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return messageEl;
}
