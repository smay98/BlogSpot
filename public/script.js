const loginForm = document.getElementById('loginForm');
const chatForm = document.getElementById('chatForm');
const loginBox = document.getElementById('login');
const chatBox = document.getElementById('chat');
const messagesDiv = document.getElementById('messages');
const logoutBtn = document.getElementById('logoutBtn');

let username = '';

async function loadMessages(messages) {
  // messagesDiv.innerHTML = ''; 

  // Sort messages by time
  messages.sort((a, b) => new Date(a.time) - new Date(b.time));

  messages.forEach((msg) => {
    const messageElement = document.createElement('p');
    messageElement.textContent = `${msg.username}: ${msg.message} (${msg.time})`;
    messagesDiv.appendChild(messageElement);
  });
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const inputUsername = document.getElementById('username').value;
  const inputPassword = document.getElementById('password').value;

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: inputUsername, password: inputPassword })
    });

    const result = await response.json();
    if (result.success) {
      username = inputUsername;
      loginBox.classList.add('hidden');
      chatBox.classList.remove('hidden');
      // Load messages after login
      await loadMessages(result.messages);
    } else {
      alert(result.message || 'Invalid credentials');
    }
  } catch (error) {
    console.error('Error during login:', error);
    alert('Server error. Please try again later.');
  }
});

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = document.getElementById('messageInput').value;

  try {
    const response = await fetch('/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, message })
    });

    const result = await response.json();
    if (result.success) {
      // Reload the chat with the latest messages
      await loadMessages(result.messages);
      // Clear input field
      document.getElementById('messageInput').value = '';
    } else {
      alert(result.message || 'Failed to send message');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Server error. Please try again later.');
  }
});

logoutBtn.addEventListener('click', () => {
  username = '';
  loginBox.classList.remove('hidden');
  chatBox.classList.add('hidden');
});
