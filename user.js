import { db, ref, push, onValue } from './firebase.js';

const CLOUD_NAME = 'drt1pkzu4';
const UPLOAD_PRESET = 'designsnap_unsigned';

const uploadInput = document.getElementById('photoUpload');
const uploadBtn = document.getElementById('uploadBtn');
const statusMsg = document.getElementById('statusMsg');
const previewDiv = document.getElementById('preview');
const userLinkDiv = document.getElementById('userLink');

const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

uploadInput.addEventListener('change', () => {
  previewDiv.innerHTML = '';
  Array.from(uploadInput.files).forEach(file => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    previewDiv.appendChild(img);
  });
});

uploadBtn.addEventListener('click', async () => {
  const files = Array.from(uploadInput.files);
  if (!files.length) return alert('Select files first');

  statusMsg.textContent = 'Uploading... ⏳';

  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      console.log('Uploaded:', data.secure_url);

      // Save URL in Firebase DB
      push(ref(db, 'uploads'), { fileName: file.name, url: data.secure_url });
    } catch(err) {
      console.error(err);
      alert('Upload failed for ' + file.name);
    }
  }

  statusMsg.textContent = 'Uploaded successfully! Wait for the link.';
  previewDiv.innerHTML = '';
  uploadInput.value = '';
});

// Listen for admin link
onValue(ref(db, 'link'), snapshot => {
  const link = snapshot.val();
  if (link) userLinkDiv.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
  else userLinkDiv.textContent = '⏳ Waiting for Design Snap to send your link...';
});

// Real-time chat
const messagesRef = ref(db, 'messages');

function appendMessage(msg) {
  const div = document.createElement('div');
  div.textContent = `${msg.sender === 'user' ? 'You' : 'Design Snap'}: ${msg.text}`;
  div.style.margin = '5px 0';
  div.style.color = msg.sender === 'user' ? '#1abc9c' : '#f39c12';
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

onValue(messagesRef, snapshot => {
  chatBox.innerHTML = '';
  const data = snapshot.val() || {};
  Object.values(data).forEach(msg => appendMessage(msg));
});

chatSend.addEventListener('click', () => {
  const text = chatInput.value.trim();
  if (!text) return;
  push(messagesRef, { sender: 'user', text, timestamp: Date.now() });
  chatInput.value = '';
});
