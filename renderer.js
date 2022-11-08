let { remote } = require('electron')
let fs = require('fs')
let { exec } = require("child_process")
let dialog = remote.dialog
let mainWindow = remote.getCurrentWindow()
let fileInput = document.getElementById('file-input')
let folderInput = document.getElementById('folder-input')
let load = document.getElementsByClassName('body-table')[0]
let rangeValue = document.getElementById('rangeValue')
let range = document.getElementById('range')
let songTitle = document.getElementById('song-title')
let songArtist = document.getElementById('song-artist')
let endTime = document.getElementById('end-time')
let pausebtn = document.getElementById('pause')
let randomBtn = document.getElementById('random')
let repeatBtn = document.getElementById('repeat')
let likeBtn = document.getElementById('favorite')

/** Bien */
let play
let isPlay
let indexCur
let indexPre
let listMusic = []
let folder
let isOpenFolder = false
let seconds = 0
let minutes = 0
let prevRow = undefined
let timeTmp
let loaded
let isListSong = false

/** Menu Chon Nhac */
function myFunction() {
	document.getElementById("myDropdown").classList.toggle("show");
}

/** List Nhac */
function openListSong(evt, listName) {
	var i, navcontent, navlink;
	navcontent = document.getElementsByClassName("nav-content");
	for (i = 0; i < navcontent.length; i++) {
		navcontent[i].style.display = "none";
	}
	navlink = document.getElementsByClassName("nav-link");
	for (i = 0; i < navlink.length; i++) {
		navlink[i].className = navlink[i].className.replace(" active", "");
	}
	document.getElementById(listName).style.display = "block";
	evt.currentTarget.className += " active";
}

/** Them file nhac */
fileInput.onclick = async () => {
	let files = await dialog.showOpenDialog(mainWindow, {
		properties: ['openFile', 'multiSelections'],
		filters: [
			{
				name: 'music files',
				extensions: ['mp3', 'wav']
			}
		]
	})
	if (files != undefined) {
		files.forEach(file => {
			const ls = exec('exiftool -s -s -s -Title -Artist -Genre -Duration -n ' + file)
			ls.stdout.on('data', (data) => {
				let a = data.split("\n")
				listMusic.push({
					title: a[0],
					path: file,
					artist: a[1],
					genre: a[2],
					duration: Math.floor(a[3]),
					getInfo: function () {
						return this.title + '<|>' + this.artist + '<|>' + this.genre + '<|>' + this.duration + '<|>' + this.path
					}
				})
			})
		})
		timeTmp = setInterval(loadListSong, 1000)
	}
}

/** Chon folder chua nhac */
folderInput.onclick = async () => {
	folder = await dialog.showOpenDialog(mainWindow, {
		properties: ['openDirectory'],
	})
	if (folder === undefined) return
	else {
		isOpenFolder = true
		fs.readdir(folder[0], (err, files) => {
			listMusic = []
			stop()
			files.forEach(file => {
				if (file.substring(file.length, file.length - 3) == 'mp3') {
					const ls = exec('exiftool -s -s -s -Title -Artist -Genre -Duration -n ' + folder[0] + '/' + file)
					ls.stdout.on('data', (data) => {
						let a = data.split("\n")
						listMusic.push({
							title: a[0],
							path: folder[0] + '/' + file,
							artist: a[1],
							genre: a[2],
							duration: Math.floor(a[3]),
							getInfo: function () {
								return this.title + '<|>' + this.artist + '<|>' + this.genre + '<|>' + this.duration + '<|>' + this.path
							}
						})
					})
				}
			})
		})
	}
	timeTmp = setInterval(loadListSong, 1000)
}

/** Hien thi nhac ra table */
function loadListSong() {
	isListSong = true
	load.innerHTML = ''
	isOpenFolder = false
	indexCur = -1
	indexPre = -1
	listMusic.sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0))
	alikeSong()
	for (let index = 0; index < listMusic.length; index++) {
		let x = `
    <tr class="tr" ondblclick='SelectedRow(this)'>
                        <td class="td td-play"><div class="tooltip"> <i class="fa-solid fa-play" ></i> <p class="tooltiptext">Play</p> </div></td>
                        <td class="td td-title">${listMusic[index].title}</td>
                        <td class="td td-artist">${listMusic[index].artist}</td>
												<td class="td td-genre">${listMusic[index].genre}</td>
                        <td class="td td-time">${convertToTime(listMusic[index].duration)}</td>
                        <td style="display:none">${listMusic[index].path}</td>
                        <td class="td td-like button-choice" onclick='favoriteChange(this)'><div class="tooltip"> <i class="fa-regular fa-heart button-icon button-not"></i> <p class="tooltiptext">Save to Your Library</p> </div> <div class="tooltip"> <i class="fa-solid fa-heart button-icon button-enable"></i> <p class="tooltiptext">Remove from Your Library</p> </div></td>
                        <td class="td td-remove" onclick='removeSong(this)'><div class="tooltip"> <i class="fa-solid fa-ban"></i> <p class="tooltiptext">Remove from the list</p> </div></td>
                    </tr>
    `
		load.insertAdjacentHTML('beforeend', x)
	}
	loaded = true
	if (loaded) clearInterval(timeTmp)
}

/** Ham ho tro */
function convertToTime(x) {
	const minutes = Math.floor(x / 60),
		seconds = x - minutes * 60
	return minutes + ':' + (seconds > 9 ? seconds : '0' + seconds)
}

/** Chon bai nhac */
function SelectedRow(currentRow) {
	if (prevRow) prevRow.classList.remove('nowplay')
	currentRow.classList.add('nowplay')
	currentRow.cells[0].innerHTML = `
	<div class="equaliser">
								<span class="line n1"></span>
								<span class="line n2"></span>
								<span class="line n3"></span>
								<span class="line n4"></span>
							</div>
	`
	indexPre = indexCur
	indexCur = currentRow.rowIndex - 1
	loadSong(currentRow.cells[1].textContent, currentRow.cells[2].textContent, currentRow.cells[4].textContent)
	playSong()
	prevRow = currentRow
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
	if (!isListSong) return
	else {
		if (isPlay) {
			play.stdin.write('p\n')
			isPlay = false
		}
		isPlay = true
	}
}

/** Next song */
function next() {
	if (!isListSong) return
	else {
		indexPre = indexCur
		if (indexCur == listMusic.length - 1) {
			indexCur = 0
		} else {
			indexCur++
		}
		loadSong(listMusic[indexCur].title, listMusic[indexCur].artist, convertToTime(listMusic[indexCur].duration))
		playSong()
	}
}

/** previous song */
function prev() {
	if (!isListSong) return
	else {
		indexPre = indexCur
		if (indexCur == 0) {
			indexCur = listMusic.length - 1
		} else {
			indexCur--
		}
		loadSong(listMusic[indexCur].title, listMusic[indexCur].artist, convertToTime(listMusic[indexCur].duration))
		playSong()
	}
}

/** Random song */
randomBtn.onclick = () => {
	randomBtn.classList.toggle("is-choice")
}

function random() {
	indexPre = indexCur
	while (indexCur == indexPre) {
		indexCur = Math.floor(Math.random() * listMusic.length)
	}
	loadSong(listMusic[indexCur].title, listMusic[indexCur].artist, convertToTime(listMusic[indexCur].duration))
	playSong()
}

/** Repeat song */
repeatBtn.onclick = () => {
	repeatBtn.classList.toggle("is-choice")
}

/** Like Song */
likeBtn.onclick = () => {
	likeBtn.classList.toggle("is-choice")
}

/** Replay song */
let timeinterval

function replay() {
	stop()
	play = exec("mplayer -slave -quiet -volume " + volumeBar.value + ' ' + listMusic[indexCur].path)
	if (prevRow) prevRow.classList.remove('nowplay')
	let curRow = load.getElementsByTagName('tr')[indexCur]
	curRow.classList.add('nowplay')
	prevRow = curRow
	isPlay = true
	rangeValue.innerHTML = '0:00'
	seconds = 0
	minutes = 0
	if (indexPre != indexCur) clearInterval(timeinterval)
	timeinterval = setInterval(updateClock, 1000)
}

/** Stop Song */
function stop() {
	exec("killall -9 mplayer")
}

/** CountUp time */
function updateClock() {
	if (isOpenFolder) {
		clearInterval(timeinterval)
	} else {
		seconds++
		if (seconds == 60) {
			minutes++
			seconds = 0
		}
		const currentRange = Math.floor((seconds + minutes * 60) / listMusic[indexCur].duration * 100)
		range.value = currentRange
		rangeValue.innerHTML = `${minutes}:${seconds > 9 ? seconds : '0' + seconds}`
		range.style.backgroundSize = currentRange + "% 100%"
		if (range.value == 100) {
			clearInterval(timeinterval)
			if (repeatBtn.classList.contains('is-choice')) { replay() }
			else if (randomBtn.classList.contains('is-choice')) { random() } else { next() }
		}
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
let volumeBtn = document.getElementById('volumeBtn')
volumeBar.oninput = () => {
	if (play != null) {
		play.stdin.write('volume ' + volumeBar.value + ' 1\n')
	}
	if (volumeBar.value == 0) volumeBtn.classList.add('is-choice')
	else volumeBtn.classList.remove('is-choice')
}
volumeBtn.onclick = () => {
	if (play != null) {
		volumeBtn.classList.toggle('is-choice')
		play.stdin.write('mute\n')
	}
}

/** Xu ly trung bai */
function alikeSong() {
	for (let tmp = 0; tmp < listMusic.length - 1; tmp++) {
		while (listMusic[tmp].title == listMusic[tmp + 1].title && listMusic[tmp].artist == listMusic[tmp + 1].artist && listMusic[tmp].duration == listMusic[tmp + 1].duration) {
			listMusic.splice(tmp, 1)
			if (tmp == listMusic.length - 1) return
		}
	}
}

/** Test file*/

window.addEventListener('beforeunload', function e() {
	let content = ''
	for (let i = 0; i < listMusic.length; i++) {
		content += listMusic[i].getInfo() + '\n'
	}
	fs.writeFile('input.txt', content, err => {
		if (err) {
			console.error(err);
		}
	});
})

function loadWindow() {
	try {
		const data = fs.readFileSync('input.txt', 'utf8');
		let arr = data.split('\n')
		for (let i = 0; i < arr.length - 1; i++) {
			let a = arr[i].split('<|>')
			listMusic.push({
				title: a[0],
				artist: a[1],
				duration: Math.floor(a[2]),
				path: a[3],
				getInfo: function () {
					return this.title + '<|>' + this.artist + '<|>' + this.duration + '<|>' + this.path
				}
			})
		}
		loadListSong()
	} catch (err) {
		console.error(err);
	}
}

/** Favorite Change */
function favoriteChange(favorite) {
	let isFa = favorite.classList.contains('is-choice')
	if (isFa) favorite.classList.remove('is-choice')
	else favorite.classList.add('is-choice')
}

/** Remove Song */
function removeSong(currentRow) {
	let tr = currentRow.parentNode
	const options = {
		type: 'question',
		buttons: ['No', 'Yes'],
		defaultId: 2,
		message: 'Are you sure you want to delete this song?',
		detail: tr.cells[1].textContent,
	}
	dialog.showMessageBox(null, options, (response) => {
		if (response) {
			removeByIndex(Math.floor(tr.rowIndex - 1))
			if ((tr.rowIndex - 1) == indexCur) random()
			tr.parentNode.removeChild(tr)
		}
	})
}
function removeByIndex(index) {
	const a1 = listMusic.slice(0, index);
	const a2 = listMusic.slice(index + 1, listMusic.length);
	listMusic = a1.concat(a2)
}