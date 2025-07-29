document.addEventListener("DOMContentLoaded", () => {
  const inputBox = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");

  inputBox.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendButton.click();
    }
  });
});

// Time formatting
function getTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Typing animation
function typeText(element, text, speed = 20) {
  let index = 0;
  function type() {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      index++;
      setTimeout(type, speed);
    }
  }
  type();
}

// Emotion detection from input
function detectEmotion(text) {
  const lower = text.toLowerCase();
  if (lower.includes("happy") || lower.includes("joy") || lower.includes("glad")) return "happy";
  if (lower.includes("sad") || lower.includes("sorry") || lower.includes("depressed")) return "sad";
  if (lower.includes("angry") || lower.includes("mad") || lower.includes("annoyed")) return "angry";
  return "neutral";
}

// Set background blob color
function getBlobColor(emotion) {
  switch (emotion) {
    case "happy": return "#ffeaa7";
    case "sad": return "#74b9ff";
    case "angry": return "#ff7675";
    default: return "#a29bfe";
  }
}

// Main chat logic
async function sendMessage() {
  const userInput = document.getElementById("user-input");
  const chatbox = document.getElementById("chatbox");
  const message = userInput.value.trim();
  if (!message) return;

  // User message
  const userDiv = document.createElement("div");
  userDiv.classList.add("user");
  userDiv.innerHTML = `<span class="msg-text">You: ${message}</span><span class="timestamp">${getTime()}</span>`;
  chatbox.appendChild(userDiv);
  chatbox.scrollTop = chatbox.scrollHeight;
  userInput.value = "";

  // Bot placeholder
  const botDiv = document.createElement("div");
  botDiv.classList.add("bot");
  const msgSpan = document.createElement("span");
  msgSpan.classList.add("msg-text");
  msgSpan.textContent = "FeelBot is typing...";
  const timeSpan = document.createElement("span");
  timeSpan.classList.add("timestamp");
  timeSpan.textContent = getTime();
  botDiv.appendChild(msgSpan);
  botDiv.appendChild(timeSpan);
  chatbox.appendChild(botDiv);
  chatbox.scrollTop = chatbox.scrollHeight;

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message }),
    });

    const data = await response.json();
    const emotion = detectEmotion(data.response);
    updateMoodHistory(emotion);
    botDiv.classList.add(emotion);
    document.querySelector(".blob-background path").setAttribute("fill", getBlobColor(emotion));
    msgSpan.textContent = "";

    // Suggestions
    const suggestionsDiv = document.createElement("div");
    suggestionsDiv.classList.add("suggestions");
    const suggestions = ["Tell me more 💬", "Motivate me 🚀", "Give me a tip 💡"];
    suggestions.forEach((text) => {
      const button = document.createElement("button");
      button.classList.add("suggestion-btn");
      button.textContent = text;
      button.onclick = () => {
        document.getElementById("user-input").value = text;
        sendMessage();
        suggestionsDiv.remove();
      };
      suggestionsDiv.appendChild(button);
    });
    chatbox.appendChild(suggestionsDiv);
    chatbox.scrollTop = chatbox.scrollHeight;

    // Create message container
    const messageContainer = document.createElement("div");
    messageContainer.style.display = "flex";
    messageContainer.style.alignItems = "center";
    messageContainer.style.gap = "10px";

    // Create speaker icon
    const speakerIcon = document.createElement("span");
    speakerIcon.innerHTML = "🔊";
    speakerIcon.title = "Click to listen";
    speakerIcon.style.cursor = "pointer";
    speakerIcon.style.fontSize = "1.1rem";
    speakerIcon.addEventListener("click", () => {
      speakText(data.response);
    });

    const textNode = document.createElement("span");
    textNode.classList.add("msg-text-inner");
    typeText(textNode, "FeelBot: " + data.response);

    messageContainer.appendChild(textNode);
    messageContainer.appendChild(speakerIcon);
    msgSpan.appendChild(messageContainer);

    chatbox.scrollTop = chatbox.scrollHeight;
  } catch (error) {
    msgSpan.textContent = "😔 FeelBot couldn't respond. Try again.";
    console.error("Fetch error:", error);
  }
}

// Optional text-to-speech
function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = 1;
  utterance.rate = 1;
  speechSynthesis.speak(utterance);
}

// Mood analytics
function updateMoodHistory(emotion) {
  let moodHistory = JSON.parse(localStorage.getItem("moodHistory")) || [];
  moodHistory.push(emotion);
  localStorage.setItem("moodHistory", JSON.stringify(moodHistory));
}

function countEmotions() {
  let moodHistory = JSON.parse(localStorage.getItem("moodHistory")) || [];
  return moodHistory.reduce((acc, mood) => {
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {});
}

function showMoodChart() {
  const data = countEmotions();
  const ctx = document.getElementById("mood-chart").getContext("2d");

  if (window.moodChart) window.moodChart.destroy();

  window.moodChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: ["#ffeaa7", "#74b9ff", "#ff7675", "#a29bfe"],
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: 'FeelBot Mood Analytics'
        }
      }
    }
  });
}

// Mood chart toggle
document.getElementById("mood-button").addEventListener("click", () => {
  const chartContainer = document.getElementById("mood-chart-container");
  chartContainer.style.display = chartContainer.style.display === "none" ? "block" : "none";
  showMoodChart();
});
function addMessage(message, sender) {
  const chatContainer = document.getElementById("chat-container");
  const msgBubble = document.createElement("div");
  msgBubble.classList.add(sender === "user" ? "user-bubble" : "bot-bubble");
  msgBubble.innerHTML = message; // message with emoji
  chatContainer.appendChild(msgBubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Example usage:
addMessage("Hi, I feel 😔 today.", "user");
addMessage("I'm here for you 💖", "bot");
function toggleTheme() {
  const body = document.body;
  body.classList.toggle("dark-mode");
  body.classList.toggle("light-mode");

  const toggleBtn = document.getElementById("theme-toggle");
  if (body.classList.contains("dark-mode")) {
    toggleBtn.textContent = "☀️ Light Mode";
  } else {
    toggleBtn.textContent = "🌙 Dark Mode";
  }
}

// Default to light
document.body.classList.add("light-mode");
const moodData = {};

function saveMood() {
  const date = document.getElementById("mood-date").value;
  const mood = document.getElementById("mood-select").value;
  if (date && mood) {
    moodData[date] = mood;
    updateMoodLog();
  }
}

function updateMoodLog() {
  const log = document.getElementById("mood-log");
  log.innerHTML = "";
  for (const date in moodData) {
    const li = document.createElement("li");
   li.textContent = `${date}: ${moodData[date]}`;
    log.appendChild(li);
  }
}
