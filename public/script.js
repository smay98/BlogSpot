const loginForm = document.getElementById("loginForm");
const chatForm = document.getElementById("chatForm");
const loginBox = document.getElementById("login");
const chatBox = document.getElementById("chat");
const messagesDiv = document.getElementById("messages");
const logoutBtn = document.getElementById("logoutBtn");

let username = "";

// Format date  ==> MM/DD/YYYY: HH:MM
function formatDate(dateString) {
  const date = new Date(dateString);

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `(${month}/${day}/${year}: ${hours}:${minutes})`;
}

async function loadMessages(messages) {
  messagesDiv.innerHTML = "";

  // Sort messages by time
  messages.sort((a, b) => new Date(a.time) - new Date(b.time));

  messages.forEach((msg) => {
    const messageElement = document.createElement("p");
    const formattedTime = formatDate(msg.time);
    messageElement.textContent = `${msg.username}: ${msg.message} ${formattedTime}`;

    // Add classes based on who sent the message
    if (msg.username === username) {
      messageElement.classList.add("own-message");
    } else {
      messageElement.classList.add("other-message");
    }

    messagesDiv.appendChild(messageElement);
  });

  // Scroll to bottom of chat window ==> auto-scroll # it got annoying to scroll manually
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Add a function to refresh messages
async function refreshMessages() {
  try {
    const response = await fetch("/messages");
    const result = await response.json();

    if (result.success) {
      await loadMessages(result.messages);
    } else {
      console.error("Failed to refresh messages:", result.message);
    }
  } catch (error) {
    console.error("Error refreshing messages:", error);
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const inputUsername = document.getElementById("username").value;
  const inputPassword = document.getElementById("password").value;

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: inputUsername,
        password: inputPassword,
      }),
    });

    const result = await response.json();
    if (result.success) {
      username = inputUsername;
      loginBox.classList.add("hidden");
      chatBox.classList.remove("hidden");
      await loadMessages(result.messages);
    } else {
      alert(result.message || "Invalid credentials");
    }
  } catch (error) {
    console.error("Error during login:", error);
    alert("Server error. Please try again later.");
  }
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const messageText = document.getElementById("messageInput").value;
  if (!messageText.trim()) return; // Ignore empty messages ==> it glitches the UI

  try {
    const response = await fetch("/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, message: messageText }),
    });

    const result = await response.json();
    if (result.success) {
      // Append the new message to the chat array
      const newMessage = result.newMessage;
      const messageElement = document.createElement("p");
      const formattedTime = formatDate(newMessage.time);
      messageElement.textContent = `${newMessage.username}: ${newMessage.message} ${formattedTime}`;

      // Add class for the message window ==> user vs non-user
      messageElement.classList.add("own-message");

      messagesDiv.appendChild(messageElement);

      // Auto-scroll to the bottom... again
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

      // Clear input field ==> otherwise the previous message will be there
      document.getElementById("messageInput").value = "";
    } else {
      alert(result.message || "Failed to send message");
    }
  } catch (error) {
    console.error("Error sending message:", error);
    alert("Server error. Please try again later.");
  }
});

logoutBtn.addEventListener("click", () => {
  username = "";
  loginBox.classList.remove("hidden");
  chatBox.classList.add("hidden");
});
