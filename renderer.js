let { remote } = require('electron')
let fs = require('fs');
let { exec } = require("child_process");
let dialog = remote.dialog
let mainWindow = remote.getCurrentWindow()
let fileInput = document.getElementById('file-input')
let load = document.getElementsByClassName('body-table')[0]
let rangeValue = document.getElementById('rangeValue')
let range = document.getElementById('range')
let songTitle = document.getElementById('song-title')
let songArtist = document.getElementById('song-artist')
let endTime = document.getElementById('end-time')
let pausebtn = document.getElementById('pause')

/** Bien */
let play
let isPlay
let indexCur
let indexPre
let listMusic = []
let folder
let isOpenFolder = false
let isStart = false
let seconds = 0
let minutes = 0
let isRepeat = false

/** Chon folder chua nhac */
fileInput.onclick = async() => {
    folder = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
    })
    if (folder === undefined) return
    else {
        isOpenFolder = true
        fs.readdir(folder[0], (err, files) => {
            listMusic = []
            isStart = false
            stop()
            files.forEach(file => {
                if (file.substring(file.length, file.length - 3) == 'mp3') {
                    const ls = exec('exiftool -s -s -s -Title -Artist -Duration -n ' + folder[0] + '/' + file)
                    ls.stdout.on('data', (data) => {
                        console.log(data);
                        let a = data.split("\n")
                        listMusic.push({
                            title: a[0],
                            path: folder[0] + '/' + file,
                            artist: a[1],
                            duration: Math.floor(a[2]),
                        })
                    });
                }
            });
        });
    }
}

/** Bat dau chuong trinh */
function start() {
    if (isStart) {} else {
        while (listMusic.length != 0) {
            loadListSong()
            isStart = true
            break
        }
    }
}

/** Hien thi nhac ra table */
function loadListSong() {
    if (isOpenFolder) {
        isOpenFolder = false
        load.innerHTML = ''
        indexCur = -1
        indexPre = -1
        listMusic.sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0))
        for (let i = 0; i < listMusic.length; i++) {
            let x = `
    <tr class="tr" ondblclick='SelectedRow(this)'>
                        <td class="td td-play"><div class="tooltip"> <i class="fa-solid fa-play"></i> <p class="tooltiptext">Play</p> </div></td>
                        <td class="td td-title">${listMusic[i].title}</td>
                        <td class="td td-artist">${listMusic[i].artist}</td>
                        <td class="td td-time">${convertToTime(listMusic[i].duration)}</td>
                        <td style="display:none">${listMusic[i].path}</td>
                        <td style="display:none">${i}</td>
                        <td class="td td-like button-choice"><div class="tooltip"> <i class="fa-regular fa-heart button-icon button-not"></i> <p class="tooltiptext">Save to Your Library</p> </div> <div class="tooltip"> <i class="fa-solid fa-heart button-icon button-enable"></i> <p class="tooltiptext">Remove from Your Library</p> </div></td>
                        <td class="td td-remove"><div class="tooltip"> <i class="fa-solid fa-ban"></i> <p class="tooltiptext">Remove from the list</p> </div></td>
                    </tr>
    `
            load.insertAdjacentHTML('beforeend', x)
        }
    }
}

/** Ham ho tro */
function convertToTime(x) {
    const minutes = Math.floor(x / 60),
        seconds = x - minutes * 60
    return minutes + ':' + (seconds > 9 ? seconds : '0' + seconds)
}

/** Chon bai nhac */
function SelectedRow(currentRow) {
    indexPre = indexCur
    indexCur = parseInt(currentRow.cells[5].textContent)
    loadSong(currentRow.cells[1].textContent, currentRow.cells[2].textContent, currentRow.cells[3].textContent)
    playSong()
}

/** Hien thi nhac hien tai */
function loadSong(title, artist, time) {
    songTitle.innerHTML = title
    songArtist.innerHTML = artist
    endTime.innerHTML = time
}

/** Phat nhac */
function playSong() {
    pausebtn.classList.add('is-choice')
    if (indexPre != indexCur) {
        replay()
    }
}

/** Pause */
function pause() {
    if (isPlay) {
        play.stdin.write('p\n')
        isPlay = false
    }
    isPlay = true
}

/** Next song */
function next() {
    indexPre = indexCur
    if (indexCur == listMusic.length - 1) {
        indexCur = 0
    } else {
        indexCur++
    }
    loadSong(listMusic[indexCur].title, listMusic[indexCur].artist, convertToTime(listMusic[indexCur].duration))
    playSong()
}

/** previous song */
function prev() {
    indexPre = indexCur
    if (indexCur == 0) {
        indexCur = listMusic.length - 1
    } else {
        indexCur--
    }
    loadSong(listMusic[indexCur].title, listMusic[indexCur].artist, convertToTime(listMusic[indexCur].duration))
    playSong()
}

/** random song */
function random() {
    indexPre = indexCur
    indexCur = Math.floor(Math.random() * listMusic.length);
    loadSong(listMusic[indexCur].title, listMusic[indexCur].artist, convertToTime(listMusic[indexCur].duration))
    playSong()
}

/** Repeat song */



/** replay song */
let timeinterval

function replay() {
    stop()
    play = exec("mplayer -slave -quiet -volume " + volumeBar.value + ' ' + listMusic[indexCur].path)
    play.stdout.on('data', (data) => {
        console.log(data);
    })
    isPlay = true
    rangeValue.innerHTML = '0:00'
    seconds = 0
    minutes = 0
    if (indexPre != indexCur) clearInterval(timeinterval);
    timeinterval = setInterval(updateClock, 1000);
}

/** Stop Song */
function stop() {
    exec("killall -9 mplayer")
}

/** CountUp time */
function updateClock() {
    seconds++
    if (seconds == 60) {
        minutes++
        seconds = 0
    }
    const currentRange = Math.floor((seconds + minutes * 60) / listMusic[indexCur].duration * 100);
    range.value = currentRange;
    rangeValue.innerHTML = `${minutes}:${seconds>9?seconds:'0'+seconds}`
    if (range.value == 100) {
        clearInterval(timeinterval);
        next()
    }
}

/** Tua nhac */
range.onclick = () => {
    let valueNow = Math.floor(range.value * listMusic[indexCur].duration / 100)
    let valuePre = seconds + minutes * 60
    minutes = Math.floor(valueNow / 60)
    seconds = valueNow % 60
    updateClock()
    play.stdin.write('seek ' + (valueNow - valuePre) + '\n')
    pausebtn.classList.add('is-choice')
}

/** Change Volume */
let volumeBar = document.getElementById('volume-bar')
volumeBar.oninput = () => {
    if (play != null) {
        play.stdin.write('volume ' + volumeBar.value + ' 1\n')
    }
}
let volumeBtn = document.getElementById('volumeBtn')
volumeBtn.onclick = () => {
    if (play != null) {
        play.stdin.write('mute\n')
    }
}