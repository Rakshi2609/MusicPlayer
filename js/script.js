console.log('Lets write JavaScript');
let currentSong = new Audio();
let songs = [];
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    try {
        let a = await fetch(`/${folder}/`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");
        songs = [];
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                let songPath = element.href.split(`/${folder}/`)[1];
                songs.push(songPath);
            }
        }

        let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
        songUL.innerHTML = "";

        let singer = "Unknown Artist";
        try {
            let infoResponse = await fetch(`/${folder}/info.json`);
            if (infoResponse.ok) {
                let info = await infoResponse.json();
                singer = info.singer || "Unknown Artist";
            }
        } catch (error) {
            console.error(`Error fetching info.json for folder ${folder}:`, error);
        }

        for (const song of songs) {
            songUL.innerHTML += `<li><img class="invert" width="34" src="img/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ").replace(".mp3","")}</div>
                    <div>${singer}</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="img/play.svg" alt="">
                </div></li>`;
        }

        const songListItems = document.querySelector(".songList")?.getElementsByTagName("li");
        if (songListItems) {
            Array.from(songListItems).forEach(e => {
                e.addEventListener("click", () => {
                    playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim() + ".mp3");
                });
            });
        }

        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

const playMusic = (track, pause = false) => {
    if (!track) return;
    if (!track.endsWith('.mp3')) track += '.mp3';
    currentSong.removeEventListener('ended', handleSongEnded);
    currentSong.src = `/${currFolder}/` + track;
    currentSong.addEventListener('ended', handleSongEnded);

    if (!pause) {
        currentSong.play().then(() => {
            document.getElementById("play").src = "img/pause.svg";
        }).catch(error => console.error("Playback failed:", error));
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track).replace('.mp3', '');
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

function handleSongEnded() {
    console.log("Song ended, playing next...");
    if (songs.length === 0) return;

    let currentTrack = decodeURI(currentSong.src.split("/").pop());
    let index = songs.indexOf(currentTrack);

    if (index === -1) return playMusic(songs[0]);
    if (index + 1 < songs.length) playMusic(songs[index + 1]);
    else playMusic(songs[0]);
}

async function displayAlbums() {
    console.log("Displaying albums");
    try {
        let a = await fetch(`/songs/`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");
        cardContainer.innerHTML = "";
        let folders = new Set();

        for (let index = 0; index < anchors.length; index++) {
            const href = anchors[index].href;
            if (href.includes("/songs/") && !href.includes(".htaccess")) {
                let parts = href.split("/songs/");
                if (parts.length > 1) {
                    let folderName = parts[1].split("/")[0];
                    if (folderName) folders.add(folderName);
                }
            }
        }

        let foldersArray = Array.from(folders);

        for (const folder of foldersArray) {
            try {
                let infoResponse = await fetch(`/songs/${folder}/info.json`);
                let info = await infoResponse.json();
                const coverPath = info.cover ? `/songs/${folder}/${info.cover}` : `/songs/${folder}/cover.png`;
                cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
                    <div class="play"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M5 20V4L19 12L5 20Z" fill="#000"/></svg></div>
                    <img src="${coverPath}" alt="">
                    <h2>${info.title}</h2>
                    <p>${info.description}</p>
                </div>`;
            } catch (error) {
                console.error(`Error fetching info.json for ${folder}:`, error);
                cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
                    <div class="play"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M5 20V4L19 12L5 20Z" fill="#000"/></svg></div>
                    <img src="/songs/${folder}/cover.png" alt="">
                    <h2>${folder}</h2>
                    <p>No description available</p>
                </div>`;
            }
        }

        const cards = document.getElementsByClassName("card");
        Array.from(cards).forEach(card => {
            card.addEventListener("click", async () => {
                const folder = card.dataset.folder;
                songs = await getSongs(`songs/${folder}`);
                if (songs.length > 0) playMusic(songs[0]);
            });
        });
    } catch (error) {
        console.error("Error displaying albums:", error);
    }
}

async function main() {
    currentSong.volume = 0.5;
    await displayAlbums();
    await getSongs("songs/ncs");
    if (songs && songs.length > 0) playMusic(songs[0], true);

    document.getElementById("play").addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play().then(() => {
                document.getElementById("play").src = "img/pause.svg";
            }).catch(error => console.error("Playback failed:", error));
        } else {
            currentSong.pause();
            document.getElementById("play").src = "img/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    document.getElementById("previous").addEventListener("click", () => {
        if (songs.length === 0) return;
        currentSong.pause();
        let currentTrack = decodeURI(currentSong.src.split("/").pop());
        let index = songs.indexOf(currentTrack);
        if (index === -1) index = 0;
        if (index - 1 >= 0) playMusic(songs[index - 1]);
        else playMusic(songs[songs.length - 1]);
    });

    document.getElementById("next").addEventListener("click", () => {
        if (songs.length === 0) return;
        currentSong.pause();
        let currentTrack = decodeURI(currentSong.src.split("/").pop());
        let index = songs.indexOf(currentTrack);
        if (index + 1 < songs.length) playMusic(songs[index + 1]);
        else playMusic(songs[0]);
    });

    const volumeControl = document.querySelector('input[name="volume"]');
    if (volumeControl) {
        volumeControl.addEventListener("input", (e) => {
            currentSong.volume = e.target.value / 100;
            document.querySelector(".volume>img").src = currentSong.volume > 0 ? "img/volume.svg" : "img/mute.svg";
        });
    }

    const volumeImg = document.querySelector(".volume>img");
    if (volumeImg) {
        volumeImg.addEventListener("click", e => {
            if (e.target.src.includes("volume.svg")) {
                e.target.src = "img/mute.svg";
                currentSong.volume = 0;
                if (volumeControl) volumeControl.value = 0;
            } else {
                e.target.src = "img/volume.svg";
                currentSong.volume = 0.5;
                if (volumeControl) volumeControl.value = 50;
            }
        });
    }
}

main();
