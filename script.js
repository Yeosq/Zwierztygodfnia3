// Firebase config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const database = firebase.database();
const storage = firebase.storage();

const petForm = document.getElementById('petForm');
const photoGallery = document.getElementById('photoGallery');
const formMessage = document.getElementById('formMessage');

// Helper: get user IP (simple)
async function getIP() {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
}

// Load gallery
function loadGallery() {
    database.ref('photos').once('value', snapshot => {
        photoGallery.innerHTML = '';
        snapshot.forEach(child => {
            const data = child.val();
            const card = document.createElement('div');
            card.className = 'photoCard';
            card.innerHTML = `
                <img src="${data.url}" alt="${data.petName}">
                <h3>${data.petName}</h3>
                <p>${data.discordNick}</p>
                <button class="voteBtn" data-id="${child.key}">Głosuj (${data.votes || 0})</button>
            `;
            photoGallery.appendChild(card);
        });
        addVoteListeners();
    });
}

// Vote buttons
async function addVoteListeners() {
    const buttons = document.querySelectorAll('.voteBtn');
    const ip = await getIP();

    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const voteRef = database.ref(`votes/${id}/${ip}`);
            voteRef.once('value', snap => {
                if(snap.exists()) {
                    alert('Już głosowałeś na to zdjęcie!');
                } else {
                    voteRef.set(true);
                    const photoRef = database.ref(`photos/${id}/votes`);
                    photoRef.transaction(current => (current || 0) + 1);
                    loadGallery();
                }
            });
        });
    });
}

// Submit form
petForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const petName = document.getElementById('petName').value.trim();
    const discordNick = document.getElementById('discordNick').value.trim();
    const petPhoto = document.getElementById('petPhoto').files[0];

    if(!petPhoto) return alert('Dodaj zdjęcie zwierzaka!');

    const storageRef = storage.ref(`photos/${Date.now()}_${petPhoto.name}`);
    storageRef.put(petPhoto).then(snapshot => {
        snapshot.ref.getDownloadURL().then(url => {
            database.ref('photos').push({
                petName,
                discordNick,
                url,
                votes: 0
            });
            formMessage.textContent = 'Zdjęcie przesłane pomyślnie!';
            petForm.reset();
            loadGallery();
        });
    });
});

loadGallery();
