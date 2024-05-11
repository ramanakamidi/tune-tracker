function fetchSongs(e) {
    e.preventDefault(); 

    let inp = document.getElementById("search-btn"); 
    let input = inp.value;
    inp.value = ""; // Clear the input value

    console.log(input);
    if (!input || input === "") {
        alert("Please enter your song name");
    } else {
        let url = `https://saavn.dev/api/search/songs?query=${input}&limit=30`;
        

        fetcher(url);
    }
}

async function fetcher(url) {
    try {
        let response = await fetch(url);
        if (response.ok) {
            let res = await response.json();
            let sungs = res.data.results;

            const songsContainer = document.getElementById("songs");
            songsContainer.innerHTML = "";

            // Track the index of the currently playing song
            let currentlyPlayingIndex = -1;

            // Find the currently playing song and render it first
            sungs.forEach((item, index) => {
                if (item.isPlaying) {
                    currentlyPlayingIndex = index;
                    renderSong(item, songsContainer, true);
                }
            });

            // Render the rest of the songs
            sungs.forEach((item, index) => {
                if (!item.isPlaying) {
                    renderSong(item, songsContainer, false);
                }
            });

            songsContainer.style.display = "block";

            // Add event listener to detect when a song ends
            const audioElements = document.querySelectorAll("audio");
            audioElements.forEach((audio, index) => {
                audio.addEventListener("ended", () => {
                    playNextSong(index);
                });
            });

            // Function to play the next song
            function playNextSong(currentIndex) {
                const nextIndex = (currentIndex + 1) % sungs.length;
                const nextAudio = audioElements[nextIndex];
                nextAudio.play();
            }
        } else {
            console.error('Failed to fetch:', response.status);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to render a song
function renderSong(item, container, isCurrentlyPlaying) {
    const songBox = document.createElement("div");
    songBox.classList.add("song-box");

    const song = document.createElement("h3");
    const audio = document.createElement("audio");
    const audioSource = document.createElement("source");
    const img = document.createElement("img");

    song.textContent = item.name;
    audioSource.src = item.downloadUrl[4].url;
    audioSource.type = "audio/mp4";
    audio.controls = true;
    img.src = item.image[1].url;

    songBox.appendChild(song);
    songBox.appendChild(audio);
    audio.appendChild(audioSource);
    songBox.appendChild(img);

    container.appendChild(songBox);

    if (isCurrentlyPlaying) {
        container.prepend(songBox);
    }
}

// Function to fetch playlist IDs based on the selected option
async function fetchPlaylistIds(selectedOption) {
    const playlistIds = [];
    const response = await fetch(`https://saavn.dev/api/search/playlists?query=${selectedOption}&offset=0&limit=50`);
    const resp = await response.json();
    const tot = resp.data.results;
    for (let i = 0; i < tot.length; i++) {
        playlistIds.push(resp.data.results[i].id);
    }
    return playlistIds;
}

// Function to fetch and display playlists based on the selected option
async function fetchAndDisplayPlaylists(selectedOption) {
    // Call fetchPlaylistIds function
    const playlistIds = await fetchPlaylistIds(selectedOption);

    // Clear the playlists container
    const playlistsContainer = document.getElementById('playlists');
    playlistsContainer.innerHTML = '';

    // Display playlists
    for (let i = 0; i < playlistIds.length; i++) {
        const response = await fetch(`https://saavn.dev/api/playlists?id=${playlistIds[i]}`);
        const result = await response.json();
        const playlist = result.data;
        const playlistElement = createPlaylistElement(playlist);
        playlistsContainer.appendChild(playlistElement);
    }
}

// Function to create playlist element
function createPlaylistElement(playlist) {
    const playlistDiv = document.createElement('div');
    playlistDiv.classList.add('playlist');

    // Add click event listener to playlist link
    playlistDiv.addEventListener('click', function() {
        displayPlaylistSongs(playlist.id);
    });

    const playlistLink = document.createElement('a');
    playlistLink.innerHTML = `
        <h2>${playlist.name}</h2>
        <img style="height:250px; width:250px;" src="${playlist.image[1].url}">
    `;
    playlistDiv.appendChild(playlistLink);

    return playlistDiv;
}

// Function to display songs of the clicked playlist
async function displayPlaylistSongs(playlistId) {
    const response = await fetch(`https://saavn.dev/api/playlists?id=${playlistId}&limit=30`);
    const data = await response.json();
    const songs = data.data.songs;

    // Clear the currently displayed songs
    const songsContainer = document.getElementById('songs');
    songsContainer.innerHTML = '';

    // Render songs of the playlist
    songs.forEach((song, index) => {
        renderSong(song, songsContainer, index);

        // Add event listener to play the next song when the current one ends
        const audio = document.getElementById(`audio-${index}`);
        audio.addEventListener('ended', () => {
            const nextIndex = (index + 1) % songs.length;
            const nextAudio = document.getElementById(`audio-${nextIndex}`);
            nextAudio.play();
        });
        
    });

    // Autoplay the first song in the playlist
    const firstAudio = document.getElementById('audio-0');
    if (firstAudio) {
        firstAudio.play();
    }

    songsContainer.style.display = "block";
}

// Function to render a song
function renderSong(song, container, index) {
    const songBox = document.createElement('div');
    songBox.classList.add('song-box');

    const songTitle = document.createElement('h3');
    songTitle.textContent = song.name;

    const audio = document.createElement('audio');
    audio.id = `audio-${index}`;
    const audioSource = document.createElement('source');
    audioSource.src = song.downloadUrl[4].url;
    audioSource.type = 'audio/mp4';
    audio.controls = true;
    audio.appendChild(audioSource);

    const img = document.createElement('img');
    img.src = song.image[1].url;

    songBox.appendChild(songTitle);
    songBox.appendChild(audio);
    songBox.appendChild(img);

    container.appendChild(songBox);
}

// Event listener for dropdown change
const dropdown = document.getElementById('lang');
dropdown.addEventListener('change', async function(event) {
    const selectedOption = dropdown.value;
    await fetchAndDisplayPlaylists(selectedOption);
});

// Fetch and display playlists for the default option (Telugu) when the page loads
window.onload = async function() {
    const defaultOption = dropdown.value; // Get the default option value (Telugu)
    await fetchAndDisplayPlaylists(defaultOption);
};
