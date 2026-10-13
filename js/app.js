let animeList = JSON.parse(localStorage.getItem('aura_anime_standalone')) || [];

function renderList() {
    const listDiv = document.getElementById('anime-list');
    listDiv.innerHTML = '';

    if (animeList.length === 0) {
        listDiv.innerHTML = '<p style="text-align:center; color:#888;">هیچ ئەنیمییەک نەدۆزرایەوە.</p>';
        return;
    }

    animeList.forEach((anime, index) => {
        const item = document.createElement('div');
        item.className = 'anime-item';
        item.innerHTML = `
            <div>
                <strong>${anime.title}</strong> - ${anime.season || ''} - ${anime.episode || ''}
            </div>
            <button style="width: auto; padding: 8px 15px;" onclick="playVideo(animeList[${index}])">سەیرکردن ▶</button>
        `;
        listDiv.appendChild(item);
    });
}

document.getElementById('save-btn').addEventListener('click', () => {
    const title = document.getElementById('title').value;
    const season = document.getElementById('season').value;
    const episode = document.getElementById('episode').value;
    const link = document.getElementById('videoLink').value;

    if (!title || !link) {
        alert('تکایە ناوی ئەنیمی و لینکی ڤیدیۆ پڕبکەرەوە!');
        return;
    }

    const newAnime = { title, season, episode, link };
    animeList.push(newAnime);
    localStorage.setItem('aura_anime_standalone', JSON.stringify(animeList));

    alert('ئەنیمییەکە بە سەرکەوتوویی پاشەکەوتکرا!');
    document.getElementById('title').value = '';
    document.getElementById('season').value = '';
    document.getElementById('episode').value = '';
    document.getElementById('videoLink').value = '';

    renderList();
});

renderList();
