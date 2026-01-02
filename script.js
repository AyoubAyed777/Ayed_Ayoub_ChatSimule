/* ========= DOM ========= */
const btnNew = document.getElementById('btnNew');
const inpNew = document.getElementById('inpNew');
const listConv = document.getElementById('listConv');
const convTitle = document.getElementById('convTitle');
const notifEl = document.getElementById('notif');
const messages = document.getElementById('messages');
const formMsg = document.getElementById('formMsg');
const inpMsg = document.getElementById('inpMsg');
const toastEl = document.getElementById('toast');
const modeBtn = document.getElementById('modeToggle');

/* ========= STATE ========= */
const ALICE = 'Alice';
const BOB = 'Bob';

let currentUser = Math.random() < 0.5 ? ALICE : BOB;
let activeConv = null;
let unreadMap = {};
let autoMode = false;
let autoTimer = null;

/* ========= UTILS ========= */
const sleep = ms => new Promise(r => setTimeout(r, ms));

function save(k, d) { localStorage.setItem(k, JSON.stringify(d)); }
function load(k, d = []) {
    try { return JSON.parse(localStorage.getItem(k)) || d; }
    catch { return d; }
}

function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2000);
}

/* ========= CONVERSATIONS ========= */
function buildConvList() {
    listConv.innerHTML = '';
    const names = load('conversations');

    names.forEach(name => {
        const li = document.createElement('li');
        li.dataset.name = name;
        if (name === activeConv) li.classList.add('active');

        const span = document.createElement('span');
        span.textContent = name;
        span.style.flexGrow = '1';

        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = unreadMap[name] || 0;
        if (!unreadMap[name]) badge.style.display = 'none';

        const del = document.createElement('button');
        del.textContent = '×';
        del.style.cssText = 'border:none;background:none;color:red;cursor:pointer';

        li.append(span, badge, del);
        listConv.appendChild(li);

        span.onclick = () => openConv(name);
        del.onclick = e => {
            e.stopPropagation();
            deleteConv(name);
        };
    });
}

function openConv(name) {
    activeConv = name;
    convTitle.textContent = name;
    unreadMap[name] = 0;
    save('unread', unreadMap);
    renderMessages();
    buildConvList();
    save('lastConv', name);
}

function deleteConv(name) {
    save('conversations', load('conversations').filter(n => n !== name));
    save('messages', load('messages').filter(m => m.conv !== name));
    delete unreadMap[name];
    save('unread', unreadMap);

    if (activeConv === name) {
        activeConv = null;
        convTitle.textContent = 'Sélectionnez une conversation';
        messages.innerHTML = '';
    }
    buildConvList();
}

/* ========= MESSAGES ========= */
function renderMessages() {
    messages.innerHTML = '';
    if (!activeConv) return;

    load('messages')
        .filter(m => m.conv === activeConv)
        .forEach(m => appendBubble(m.text, m.user, m.date));

    messages.scrollTop = messages.scrollHeight;
}

function appendBubble(text, user, date) {
    const div = document.createElement('div');
    div.className = 'bulle ' + (user === currentUser ? 'user' : 'bot');
    div.textContent = text;
    div.setAttribute(
        'data-time',
        new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function addMessage(text, user) {
    const date = Date.now();
    const msgs = load('messages');
    msgs.push({ conv: activeConv, user, text, date });
    save('messages', msgs);
    appendBubble(text, user, date);
}

/* ========= MANUAL REPLY (FIX) ========= */
async function simulateReply() {
    await sleep(800 + Math.random() * 1200);
    if (!activeConv || autoMode) return;

    const other = currentUser === ALICE ? BOB : ALICE;
    const replies = [
        'D’accord.',
        'Intéressant.',
        'Je vois.',
        'Pas faux.',
        'Bonne remarque.',
        'Exact.',
        'Pourquoi pas ?'
    ];

    addMessage(
        replies[Math.floor(Math.random() * replies.length)],
        other
    );
}

/* ========= AUTO CHAT ========= */
function autoConversation() {
    if (!activeConv) return;

    const users = [ALICE, BOB];
    const replies = [
        'Oui.',
        'Exact.',
        'Je suis d’accord.',
        'Hmm.',
        'Continuons.',
        'Bonne idée.',
        'Clairement.'
    ];

    addMessage(
        replies[Math.floor(Math.random() * replies.length)],
        users[Math.floor(Math.random() * users.length)]
    );
}

/* ========= EVENTS ========= */
btnNew.onclick = () => {
    btnNew.style.display = 'none';
    inpNew.style.display = 'block';
    inpNew.focus();
};

inpNew.onkeypress = e => {
    if (e.key === 'Enter') {
        const name = inpNew.value.trim();
        if (!name) return;

        const names = load('conversations');
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
};

/* ========= SEND MESSAGE (FIXED) ========= */
formMsg.onsubmit = e => {
    e.preventDefault();
    if (!activeConv || autoMode) return;

    const text = inpMsg.value.trim();
    if (!text) return;

    addMessage(text, currentUser);
    inpMsg.value = '';

    simulateReply(); // ✅ FIX: reply restored
};

/* ========= MODE TOGGLE ========= */
modeBtn.onclick = () => {
    autoMode = !autoMode;

    if (autoMode) {
        modeBtn.textContent = '🤖';
        inpMsg.disabled = true;
        inpMsg.placeholder = 'Auto conversation…';
        autoTimer = setInterval(autoConversation, 1500);
    } else {
        modeBtn.textContent = '👤';
        inpMsg.disabled = false;
        inpMsg.placeholder = 'Tapez un message…';
        clearInterval(autoTimer);
    }
};

/* ========= THEME ========= */
const themeBtn = document.getElementById('themeToggle');
themeBtn.onclick = () => {
    document.documentElement.classList.toggle('light');
    save('theme',
        document.documentElement.classList.contains('light') ? 'light' : 'dark'
    );
};
if (load('theme') === 'light') document.documentElement.classList.add('light');

/* ========= INIT ========= */
window.onload = () => {
    unreadMap = load('unread', {});
    buildConvList();
    const last = load('lastConv');
    if (last) openConv(last);
};
