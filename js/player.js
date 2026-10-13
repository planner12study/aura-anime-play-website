function playVideo(anime) {
    const playerContainer = document.getElementById('player-container');
    const playingTitle = document.getElementById('playing-title');
    const videoWrapper = document.getElementById('video-wrapper');

    playerContainer.style.display = 'block';
    playingTitle.innerText = `${anime.title} - ${anime.season || ''} - ${anime.episode || ''}`;

    if (anime.link.includes('<iframe') || anime.link.startsWith('http')) {
        if (anime.link.startsWith('http') && !anime.link.includes('iframe')) {
            videoWrapper.innerHTML = `<video controls src="${anime.link}"></video>`;
        } else {
            videoWrapper.innerHTML = anime.link;
        }
    } else {
        videoWrapper.innerHTML = `<iframe src="${anime.link}" frameborder="0" allowfullscreen></iframe>`;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}
