import { db, storage, dbRef, push, set, onValue, sRef, uploadBytesResumable, getDownloadURL } from './firebase.js';

// Elements
const uploadInput = document.getElementById('photoUpload');
const uploadBtn = document.getElementById('uploadBtn');
const statusMsg = document.getElementById('statusMsg');
const previewDiv = document.getElementById('preview');
const userLinkDiv = document.getElementById('userLink');

// Preview images
uploadInput.addEventListener('change', () => {
  previewDiv.innerHTML = '';
  Array.from(uploadInput.files).forEach(file => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    previewDiv.appendChild(img);
  });
});

// Upload files
uploadBtn.addEventListener('click', () => {
  const files = Array.from(uploadInput.files);
  if (!files.length) return alert('Select files to upload');

  statusMsg.textContent = 'Uploading... ⏳';

  files.forEach(file => {
    const storageRef = sRef(storage, `uploads/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', null, err => console.error(err), () => {
      getDownloadURL(uploadTask.snapshot.ref).then(url => {
        push(dbRef(db, 'uploads'), {
          fileName: file.name,
          url: url,
          timestamp: Date.now()
        });
      });
    });
  });

  statusMsg.textContent = 'Uploaded successfully! Wait for the link.';
  previewDiv.innerHTML = '';
  uploadInput.value = '';
});

// Listen for link from admin
onValue(dbRef(db, 'link'), snapshot => {
  const link = snapshot.val();
  if (link) {
    userLinkDiv.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
  }
});
