
    console.log('Lets write JavaScript');
    let currentSong = new Audio();
    let songs = [];
    let currFolder;

    function secondsToMinutesSeconds(seconds) {
        if (isNaN(seconds) || seconds < 0) {
            return "00:00";
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');

        return `${formattedMinutes}:${formattedSeconds}`;
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

            // Show all the songs in the playlist
            let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
            songUL.innerHTML = "";
            
            // Fetch and process info.json to get singer
            let singer = "Unknown Artist"; // Default value
            try {
                let infoResponse = await fetch(`/${folder}/info.json`);
                if (infoResponse.ok) {
                    let info = await infoResponse.json();
                    singer = info.singer || "Unknown Artist"; // Use info.singer if available
                }
            } catch (error) {
                console.error(`Error fetching info.json for folder ${folder}:`, error);
            }

            for (const song of songs) {
                songUL.innerHTML = songUL.innerHTML + `<li><img class="invert" width="34" src="img/music.svg" alt="">
                                                <div class="info">
                                                    <div>${song.replaceAll("%20", " ").replace(".mp3","")}</div>
                                                    <div>${singer}</div>
                                                </div>
                                                <div class="playnow">
                                                    <span>Play Now</span>
                                                    <img class="invert" src="img/play.svg" alt="">
                                                </div> </li>`;
            }

            // Attach an event listener to each song
            const songListItems = document.querySelector(".songList")?.getElementsByTagName("li");
            if (songListItems) {
                Array.from(songListItems).forEach(e => {
                    e.addEventListener("click", element => {
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
        
        // Ensure track has .mp3 extension if not already present
        if (!track.endsWith('.mp3')) {
            track += '.mp3';
        }
        
        // Remove previous ended event listener
        currentSong.removeEventListener('ended', handleSongEnded);
        
        currentSong.src = `/${currFolder}/` + track;
        
        // Add new ended event listener
        currentSong.addEventListener('ended', handleSongEnded);
        
        if (!pause) {
            currentSong.play()
                .then(() => {
                    document.getElementById("play").src = "img/pause.svg";
                })
                .catch(error => {
                    console.error("Playback failed:", error);
                });
        }
        document.querySelector(".songinfo").innerHTML = decodeURI(track).replace('.mp3', '');
        document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
    }

    function handleSongEnded() {
        console.log("Song ended, playing next...");
        if (songs.length === 0) return;
        
        let currentTrack = decodeURI(currentSong.src.split("/").slice(-1)[0]);
        let index = songs.indexOf(currentTrack);
        
        // If current song not found, start from beginning
        if (index === -1) {
            playMusic(songs[0]);
            return;
        }
        
        // Play next song or loop to beginning
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            playMusic(songs[0]);
        }
    }

    async function displayAlbums() {
        console.log("displaying albums");
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
                const element = anchors[index];
                let href = element.href;
                if (href.includes("/songs/") && !href.includes(".htaccess")) {
                    let parts = href.split("/songs/");
                    if (parts.length > 1) {
                        let folderName = parts[1].split("/")[0];
                        if(folderName){
                            folders.add(folderName);
                        }
                    }
                }
            }

            let foldersArray = Array.from(folders);

            for (const folder of foldersArray) {
                try {
                    let infoResponse = await fetch(`/songs/${folder}/info.json`);
                    let info = await infoResponse.json();
                    const coverPath = info.cover ? `/songs/${folder}/${info.cover}` : `/songs/${folder}/cover.png`;
                    cardContainer.innerHTML += ` <div data-folder="${folder}" class="card">
                                            <div class="play">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                                    xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                                        stroke-linejoin="round" />
                                                </svg>
                                            </div>
                                            <img src="${coverPath}" alt="">
                                            <h2>${info.title}</h2>
                                            <p>${info.description}</p>
                                        </div>`;
                } catch (error) {
                    console.error(`Error fetching info.json for ${folder}:`, error);
                    cardContainer.innerHTML += ` <div data-folder="${folder}" class="card">
                                            <div class="play">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                                    xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                                        stroke-linejoin="round" />
                                                </svg>
                                            </div>
                                            <img src="/songs/${folder}/cover.png" alt="">
                                            <h2>${folder}</h2>
                                            <p>No description available</p>
                                        </div>`;
                }
            }

            const cards = document.getElementsByClassName("card");
            if (cards) {
                Array.from(cards).forEach(e => {
                    e.addEventListener("click", async item => {
                        const folder = item.currentTarget.dataset.folder;
                        console.log("Fetching Songs for:", folder);
                        songs = await getSongs(`songs/${folder}`);
                        if (songs.length > 0) {
                            playMusic(songs[0]);
                        }
                    });
                });
            }
        } catch (error) {
            console.error("Error displaying albums:", error);
        }
    }

    async function main() {
        // Initialize volume
        currentSong.volume = 0.5;
        
        // Display all the albums on the page
        await displayAlbums();

        // Get the list of all the songs
        await getSongs("songs/ncs");
        if (songs && songs.length>0)
            playMusic(songs[0], true);

        // Attach an event listener to play, next and previous
        document.getElementById("play").addEventListener("click", () => {
            if (currentSong.paused) {
                currentSong.play()
                    .then(() => {
                        document.getElementById("play").src = "img/pause.svg";
                    })
                    .catch(error => {
                        console.error("Playback failed:", error);
                    });
            } else {
                currentSong.pause();
                document.getElementById("play").src = "img/play.svg";
            }
        });

        // Listen for timeupdate event
        currentSong.addEventListener("timeupdate", () => {
            document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        });

        // Add an event listener to seekbar
        document.querySelector(".seekbar").addEventListener("click", e => {
            let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
            document.querySelector(".circle").style.left = percent + "%";
            currentSong.currentTime = ((currentSong.duration) * percent) / 100;
        });

        // Add an event listener for hamburger
        document.querySelector(".hamburger").addEventListener("click", () => {
            document.querySelector(".left").style.left = "0";
        });

        // Add an event listener for close button
        document.querySelector(".close").addEventListener("click", () => {
            document.querySelector(".left").style.left = "-120%";
        });

        // Add an event listener to previous
        document.getElementById("previous").addEventListener("click", () => {
            if (songs.length === 0) return;
            
            currentSong.pause();
            let currentTrack = decodeURI(currentSong.src.split("/").slice(-1)[0]);
            let index = songs.indexOf(currentTrack);
            if (index === -1) index = 0;
            
            if ((index - 1) >= 0) {
                playMusic(songs[index - 1]);
            }
            else{
                playMusic(songs[songs.length-1]);
            }
        });

        // Add an event listener to next
        document.getElementById("next").addEventListener("click", () => {
            if (songs.length === 0) return;
            
            currentSong.pause();
            let currentTrack = decodeURI(currentSong.src.split("/").slice(-1)[0]);
            let index = songs.indexOf(currentTrack);
            if (index === -1) index = -1;
            
            if ((index + 1) < songs.length) {
                playMusic(songs[index + 1]);
            }
            else{
                playMusic(songs[0]);
            }
        });

        // Add an event to volume control
        const volumeControl = document.querySelector('input[name="volume"]');
        if (volumeControl) {
            volumeControl.addEventListener("input", (e) => {
                currentSong.volume = e.target.value / 100;
                if (currentSong.volume > 0) {
                    document.querySelector(".volume>img").src = "img/volume.svg";
                }
                else{
                    document.querySelector(".volume>img").src = "img/mute.svg";
                }
            });
        }

        // Add event listener to mute the track
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
