/* ----------  Eléments DOM  ---------- */
const ncB        = document.getElementById('nc');
const nomchat    = document.getElementById('nomnc');
const historique = document.getElementById('history');
const chatDiv    = document.getElementById('chat');
const form       = document.querySelector('form');
const msgInput   = document.getElementById('msg');

let nomact = '';   // chat actuellement ouvert

/* ----------  Au démarrage : restauration  ---------- */
window.addEventListener('DOMContentLoaded', () => {
    const sauvegardes = JSON.parse(localStorage.getItem('chats')) || [];
    sauvegardes.forEach(n => ajouterHistorique(n));

    const dernier = localStorage.getItem('dernierChat');
    if (dernier) {
        nomact = dernier;
        document.querySelector('header').textContent = nomact;
        chargerMessages();
    }
});

/* ----------  Créer un nouveau chat  ---------- */
ncB.addEventListener('click', () => {
    ncB.style.display    = 'none';
    nomchat.style.display = 'block';
    nomchat.focus();
});

nomchat.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const nn = nomchat.value.trim();
        if (!nn) return;

        /* 1.  sauvegarder le chat actuel dans l’historique */
        if (nomact) {
            const liste = JSON.parse(localStorage.getItem('chats')) || [];
            if (!liste.includes(nomact)) {
                liste.push(nomact);
                localStorage.setItem('chats', JSON.stringify(liste));
            }
            ajouterHistorique(nomact);
        }

        /* 2.  basculer vers le nouveau chat */
        nomact = nn;
        localStorage.setItem('dernierChat', nomact);
        document.querySelector('header').textContent = nn;
        nomchat.value = '';
        nomchat.style.display = 'none';
        ncB.style.display = 'block';
        chargerMessages();

        /* 3.  l’ajouter aussi dans la liste visuelle ➜ */
        ajouterHistorique(nn);

        /* 4.  message de bienvenue uniquement si le chat est vraiment nouveau */
        const msgs   = JSON.parse(localStorage.getItem('messages')) || [];
        const existe = msgs.some(m => m.chat === nomact);
        if (!existe) {
            const bienvenue = `Bonjour ! Bienvenue dans le chat ${nn}.`;
            ajouterMessageBot(bienvenue);
            sauvegarderMessage(nomact, bienvenue, 'bot');
        }
    }
});

/* ----------  Historique : ajout + clic + suppression  ---------- */
function ajouterHistorique(nom) {
    /* évite les doublons visuels */
    if ([...historique.querySelectorAll('li span')].some(sp => sp.textContent === nom)) return;

    const li = document.createElement('li');
    li.style.cssText = 'cursor:pointer;display:flex;justify-content:space-between;margin-bottom:4px';

    const span = document.createElement('span');
    span.textContent = nom;
    span.style.flexGrow = '1';

    const btnSupp = document.createElement('button');
    btnSupp.textContent = '×';
    btnSupp.style.cssText = 'border:none;background:transparent;color:red;cursor:pointer';

    span.addEventListener('click', () => {
        nomact = nom;
        localStorage.setItem('dernierChat', nomact);
        document.querySelector('header').textContent = nom;
        chargerMessages();
    });

    btnSupp.addEventListener('click', (e) => {
        e.stopPropagation();
        li.remove();
        let liste = JSON.parse(localStorage.getItem('chats')) || [];
        liste = liste.filter(n => n !== nom);
        localStorage.setItem('chats', JSON.stringify(liste));

        let msgs = JSON.parse(localStorage.getItem('messages')) || [];
        msgs = msgs.filter(m => m.chat !== nom);
        localStorage.setItem('messages', JSON.stringify(msgs));

        if (nomact === nom) {
            nomact = '';
            localStorage.removeItem('dernierChat');
            document.querySelector('header').textContent = 'Nom du chat';
            chatDiv.innerHTML = '';
        }
    });

    li.append(span, btnSupp);
    historique.appendChild(li);
}

/* ----------  Messages : sauvegarde, affichage, chargement  ---------- */
function sauvegarderMessage(chat, texte, auteur) {
    const msgs = JSON.parse(localStorage.getItem('messages')) || [];
    msgs.push({ chat, texte, auteur });
    localStorage.setItem('messages', JSON.stringify(msgs));
}

function afficherMessage(texte, auteur) {
    const div       = document.createElement('div');
    div.className   = 'message ' + auteur;
    div.textContent = texte;
    chatDiv.appendChild(div);
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

function ajouterMessageBot(texte) {
    afficherMessage(texte, 'bot');
}

function chargerMessages() {
    chatDiv.innerHTML = '';
    const msgs = JSON.parse(localStorage.getItem('messages')) || [];
    msgs.filter(m => m.chat === nomact)
        .forEach(m => afficherMessage(m.texte, m.auteur));
}

/* ----------  Envoi d’un message  ---------- */
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const texte = msgInput.value.trim();
    if (!texte || !nomact) return;

    afficherMessage(texte, 'user');
    sauvegarderMessage(nomact, texte, 'user');

    setTimeout(() => {
        const reponse = `Tu as dit : "${texte}"`;
        afficherMessage(reponse, 'bot');
        sauvegarderMessage(nomact, reponse, 'bot');
    }, 1000);

    msgInput.value = '';
});