import { db, storage, dbRef, onValue, remove, set, sRef, deleteObject } from './firebase.js';

const uploadsContainer = document.getElementById('uploadsContainer');
const linkInput = document.getElementById('linkInput');
const sendLinkBtn = document.getElementById('sendLinkBtn');

// Show all uploads
onValue(dbRef(db, 'uploads'), snapshot => {
  const data = snapshot.val() || {};
  uploadsContainer.innerHTML = '';

  Object.keys(data).forEach(key => {
    const file = data[key];
    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `
      <img src="${file.url}" width="120">
      <button class="deleteBtn">Delete</button>
      <a href="${file.url}" download>Download</a>
    `;

    div.querySelector('.deleteBtn').addEventListener('click', () => {
      deleteObject(sRef(storage, `uploads/${file.fileName}`));
      remove(dbRef(db, `uploads/${key}`));
    });

    uploadsContainer.appendChild(div);
  });
});

// Send link
sendLinkBtn.addEventListener('click', () => {
  const link = linkInput.value.trim();
  if (!link) return alert('Enter a link');
  set(dbRef(db, 'link'), link)
    .then(() => alert('Link sent to users!'));
  linkInput.value = '';
});
