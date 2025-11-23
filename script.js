/* =========  ÉLÉMENTS DOM ========= */
const btnNew   = document.getElementById('btnNew');
const inpNew   = document.getElementById('inpNew');
const listConv = document.getElementById('listConv');
const convTitle= document.getElementById('convTitle');
const notifEl  = document.getElementById('notif');
const messages = document.getElementById('messages');
const formMsg  = document.getElementById('formMsg');
const inpMsg   = document.getElementById('inpMsg');
const toastEl  = document.getElementById('toast');

/* =========  CONSTANTES / ÉTAT ========= */
const ALICE = 'Alice';
const BOB   = 'Bob';
let currentUser = Math.random() < 0.5 ? ALICE : BOB; // qui est connecté
let activeConv  = null; // nom de la conv ouverte
let unreadMap   = {};   // conv → nombre de messages non lus

/* =========  UTILITAIRES ========= */
/* Petit sommeire */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Popup vert temporaire */
function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2000);
}

/* Accès localStorage simplifié */
function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function load(key, def = []) {
    try { return JSON.parse(localStorage.getItem(key)) || def; }
    catch { return def; }
}

/* =========  GESTION DES CONVERSATIONS ========= */
/* Construit / rafraîchit la liste dans la sidebar */
function buildConvList() {
    listConv.innerHTML = '';
    const names = load('conversations');
    names.forEach(name => {
        const li = document.createElement('li');
        li.dataset.name = name;
        if (name === activeConv) li.classList.add('active');

        /* Partie cliquable (texte) */
        const span = document.createElement('span');
        span.textContent = name;
        span.style.flexGrow = '1';

        /* Badge non-lus */
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = unreadMap[name] || 0;
        if (!unreadMap[name]) badge.style.display = 'none';

        /* Bouton supprimer */
        const del = document.createElement('button');
        del.textContent = '×';
        del.style.cssText = 'border:none;background:transparent;color:red;cursor:pointer';

        li.append(span, badge, del);
        listConv.appendChild(li);

        /* Événements */
        span.addEventListener('click', () => openConv(name));
        badge.addEventListener('click', e => e.stopPropagation()); /* évite ouvrir */
        del.addEventListener('click',  e => {
            e.stopPropagation();
            deleteConv(name);
        });
    });
}

/* Ouvre une conversation */
function openConv(name) {
    activeConv = name;
    document.querySelectorAll('.sidebar li').forEach(li => {
        li.classList.toggle('active', li.dataset.name === name);
    });
    convTitle.textContent = name;
    unreadMap[name] = 0;               // on marque comme lu
    save('unread', unreadMap);
    renderMessages();
    buildConvList();
    save('lastConv', name);
}

/* Supprime une conversation */
function deleteConv(name) {
    /* liste */
    let names = load('conversations');
    names = names.filter(n => n !== name);
    save('conversations', names);
    /* messages */
    let msgs = load('messages');
    msgs = msgs.filter(m => m.conv !== name);
    save('messages', msgs);
    /* unread */
    delete unreadMap[name];
    save('unread', unreadMap);

    /* si c'était la conv active → on ferme */
    if (activeConv === name) {
        activeConv = null;
        convTitle.textContent = 'Sélectionnez une conversation';
        messages.innerHTML = '';
    }
    buildConvList();
}

/* =========  MESSAGES ========= */
/* Affiche tous les messages de la conv active */
function renderMessages() {
    messages.innerHTML = '';
    if (!activeConv) return;
    const msgs = load('messages').filter(m => m.conv === activeConv);
    msgs.forEach(m => appendBubble(m.text, m.user));
    messages.scrollTop = messages.scrollHeight;
}

/* Crée une bulle (user ou bot) */
function appendBubble(text, user) {
    const div = document.createElement('div');
    div.className = 'bulle ' + (user === currentUser ? 'user' : 'bot');
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

/* Ajoute un message en mémoire + à l’écran */
function addMessage(text, user) {
    const msgs = load('messages');
    msgs.push({ conv: activeConv, user, text, date: Date.now() });
    save('messages', msgs);
    appendBubble(text, user);

    /* Si le message vient de l’interlocuteur → incrémente non-lus + notif */
    if (user !== currentUser) {
        unreadMap[activeConv] = (unreadMap[activeConv] || 0) + 1;
        save('unread', unreadMap);
        buildConvList();
        animateNotif();
    }
}

/* Animation de la pastille rouge (header) */
function animateNotif() {
    notifEl.textContent = unreadMap[activeConv] || 0;
    notifEl.classList.add('show');
    setTimeout(() => notifEl.classList.remove('show'), 1500);
}

/* Réponse simulée (l’autre personne répond) */
async function simulateReply() {
    await sleep(800 + Math.random() * 1200);
    const other = currentUser === ALICE ? BOB : ALICE;
    const reponses = [
        'D’accord avec toi !',
        'Hmm, pas sûr…',
        'Tu as raison.',
        'Et si on changeait de sujet ?',
        '😉',
        'Bonne remarque.',
        'Je n’y avais pas pensé.',
        'Totalement !'
    ];
    const pick = reponses[Math.floor(Math.random() * reponses.length)];
    addMessage(pick, other);
}

/* =========  ÉVÉNEMENTS ========= */
/* Bouton « Nouvelle discussion » */
btnNew.addEventListener('click', () => {
    btnNew.style.display = 'none';
    inpNew.style.display = 'block';
    inpNew.focus();
});

/* Validation du nom de conversation (touche Entrée) */
inpNew.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
        const name = inpNew.value.trim();
        if (!name) return;
        let names = load('conversations');
        if (!names.includes(name)) {
            names.push(name);
            save('conversations', names);
            toast('Conversation créée');
        }
        inpNew.value = '';
        inpNew.style.display = 'none';
        btnNew.style.display = 'block';
        buildConvList();
        openConv(name);
    }
});

/* Envoi d’un message (formulaire) */
formMsg.addEventListener('submit', e => {
    e.preventDefault();
    if (!activeConv) { toast('Choisissez une conversation'); return; }
    const text = inpMsg.value.trim();
    if (!text) return;
    addMessage(text, currentUser);
    inpMsg.value = '';
    simulateReply(); // l’autre va répondre
});

/* =========  INITIALISATION ========= */
window.addEventListener('DOMContentLoaded', () => {
    unreadMap = load('unread', {});
    buildConvList();
    const last = load('lastConv');
    if (last) openConv(last);
});