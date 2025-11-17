let ncB = document.getElementById('nc');
let nomchat = document.getElementById('nomnc');
let historique = document.getElementById('history');
let nomact = '';

/* ----------  Chargement de l’historique au démarrage  ---------- */
window.addEventListener('DOMContentLoaded', () => {
    const sauvegardes = JSON.parse(localStorage.getItem('chats')) || [];
    sauvegardes.forEach(nom => ajouterHistorique(nom));   // 
});

/* ----------  Clic sur « Nouvelle chat »  ---------- */
ncB.addEventListener('click', () => {
    ncB.style.display = 'none';
    nomchat.style.display = 'block';
    nomchat.focus();
});

/* ----------  Validation du nom de chat (Entrée)  ---------- */
nomchat.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const nn = nomchat.value.trim();
        if (!nn) return;

        /* ---- on archive l’ancien chat (s’il existe) ---- */
        if (nomact) {
            ajouterHistorique(nomact);
            const sauvegardes = JSON.parse(localStorage.getItem('chats')) || [];
            sauvegardes.push(nomact);
            localStorage.setItem('chats', JSON.stringify(sauvegardes));
        }

        /* ---- on bascule sur le nouveau chat ---- */
        nomact = nn;
        ncB.textContent = nn;
        document.querySelector('header').textContent = nn;
        nomchat.value = '';
        nomchat.style.display = 'none';
        ncB.style.display = 'block';
    }
});

/* ----------  Ajout d’un chat dans l’historique (avec ouverture & suppression)  ---------- */
function ajouterHistorique(nom) {
    const li = document.createElement('li');
    li.style.cursor = 'pointer';
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.marginBottom = '4px';

    const span = document.createElement('span');
    span.textContent = nom;
    span.style.flexGrow = '1';

    const btnSupp = document.createElement('button');
    btnSupp.textContent = '×';
    btnSupp.style.border = 'none';
    btnSupp.style.background = 'transparent';
    btnSupp.style.color = 'red';
    btnSupp.style.cursor = 'pointer';

    /* ---- rouvrir ce chat ---- */
    span.addEventListener('click', () => {
        nomact = nom;
        ncB.textContent = nom;
        document.querySelector('header').textContent = nom;
    });

    /* ---- supprimer ce chat ---- */
    btnSupp.addEventListener('click', (e) => {
        e.stopPropagation();
        li.remove();
        let sauvegardes = JSON.parse(localStorage.getItem('chats')) || [];
        sauvegardes = sauvegardes.filter(n => n !== nom);
        localStorage.setItem('chats', JSON.stringify(sauvegardes));
    });

    li.appendChild(span);
    li.appendChild(btnSupp);
    historique.appendChild(li);
}