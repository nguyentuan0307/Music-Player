let { remote } = require('electron')
let fs = require('fs')
let { exec, execSync } = require("child_process")
const { defaultCoreCipherList } = require('constants')
let dialog = remote.dialog
let mainWindow = remote.getCurrentWindow()
let fileInput = document.getElementById('file-input')
let folderInput = document.getElementById('folder-input')
let pageDefault = document.getElementsByClassName('body-table')[0]
let pageFavorite = document.getElementsByClassName('body-table')[1]
let rangeValue = document.getElementById('rangeValue')
let range = document.getElementById('range')
let songTitle = document.getElementById('song-title')
let songArtist = document.getElementById('song-artist')
let endTime = document.getElementById('end-time')
let pausebtn = document.getElementById('pause')
let randomBtn = document.getElementById('random')
let repeatBtn = document.getElementById('repeat')
let prevBtn = document.getElementById('prev')
let nextBtn = document.getElementById('next')
let likeCurBtn = document.getElementById('favorite')
let input = document.getElementById("search-input");
let showOptions = document.getElementById('showOptions')
let myDropDown = document.getElementById('myDropDown')
let volumeBar = document.getElementById('volume-bar')
let volumeBtn = document.getElementById('volumeBtn')
let listMusic = []

const app = {
  checkNext: false,
  play: undefined,
  isPlay: false,
  indexCur: -1,
  indexPre: -1,
  folder: undefined,
  isOpenFolder: false,
  seconds: 0,
  minutes: 0,
  miniseconds: 0,
  prevRow: undefined,
  curRow: undefined,
  timeTmp: undefined,
  isListSong: false,
  timeInterval: undefined,
  isChangeFavorite: true,
  isRemove: false,
  isPageFavorite: false,
  isNowDefault: true,
  /**Menu chuyen page*/
  OpenListSong: function (evt, listName) {
    if (listName == 'songs') {
      app.isPageFavorite = false;
    }
    else app.isPageFavorite = true;
    if ((app.isChangeFavorite == true) || (app.isRemove == true)) {
      app.RenderFavoriteSong()
      app.RenderSong()
      app.isChangeFavorite = false
      app.isRemove = false
      if (app.play) app.ChangeNowPlay()
    }
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
  },
  /** Doc file nhac */
  ExifSong: function (path, fa) {
    const ls = execSync('exiftool -s -s -s -Title -Artist -Genre -Duration -n -j ' + path)
    let song = JSON.parse(ls)[0]
    listMusic.push({
      title: song.Title,
      artist: song.Artist,
      genre: song.Genre,
      path: song.SourceFile,
      duration: Math.floor(song.Duration),
      favorite: fa,
      getInfo: function () {
        return this.path + ' FA:' + this.favorite + '\n'
      }
    })
  },
  /** Chuyen xx -> xx:xx */
  ConvertToTime: function (x) {
    const minutes = Math.floor(x / 60),
      seconds = x - minutes * 60
    return minutes + ':' + (seconds > 9 ? seconds : '0' + seconds)
  },
  /** Xu ly trung bai hat */
  AlikeSong: function () {
    for (let tmp = 0; tmp < listMusic.length - 1; tmp++) {
      while (listMusic[tmp].title == listMusic[tmp + 1].title && listMusic[tmp].artist == listMusic[tmp + 1].artist && listMusic[tmp].duration == listMusic[tmp + 1].duration) {
        listMusic.splice(tmp, 1)
        if (tmp == listMusic.length - 1) return
      }
    }
  },
  /** Hien thi nhac vao bang */
  RenderSong: function () {
    let tr;
    pageDefault.innerHTML = ''
    listMusic.sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0))
    app.AlikeSong()
    app.isOpenFolder = false
    for (let index = 0; index < listMusic.length; index++) {
      if (listMusic[index].favorite == 'true') {
        tr = `
        <tr class="tr" ondblclick='app.SelectedRow(this)'>
                            <td class="td td-play"><div class="tooltip"> <i class="fa-solid fa-play" ></i> <p class="tooltiptext">Play</p> </div></td>
                            <td class="td td-title">${listMusic[index].title}</td>
                            <td class="td td-artist">${listMusic[index].artist}</td>
                            <td class="td td-genre">${listMusic[index].genre}</td>
                            <td class="td td-time">${app.ConvertToTime(listMusic[index].duration)}</td>
                            <td style="display:none">${listMusic[index].path}</td>
                            <td class="td td-like button-choice is-choice" onclick='app.FavoriteChange(this)'><div class="tooltip"> <i class="fa-regular fa-heart button-icon button-not"></i> <p class="tooltiptext">Save to Your Library</p> </div> <div class="tooltip"> <i class="fa-solid fa-heart button-icon button-enable"></i> <p class="tooltiptext">Remove from Your Library</p> </div></td>
                            <td style="display:none">${index}</td>
                            <td class="td td-remove" onclick='app.RemoveSong(this)'><div class="tooltip"> <i class="fa-solid fa-ban"></i> <p class="tooltiptext">Remove from the list</p> </div></td>
                            </tr>
        `
      }
      else {
        tr = `
        <tr class="tr" ondblclick='app.SelectedRow(this)'>
                            <td class="td td-play"><div class="tooltip"> <i class="fa-solid fa-play" ></i> <p class="tooltiptext">Play</p> </div></td>
                            <td class="td td-title">${listMusic[index].title}</td>
                            <td class="td td-artist">${listMusic[index].artist}</td>
                            <td class="td td-genre">${listMusic[index].genre}</td>
                            <td class="td td-time">${app.ConvertToTime(listMusic[index].duration)}</td>
                            <td style="display:none">${listMusic[index].path}</td>
                            <td class="td td-like button-choice" onclick='app.FavoriteChange(this)'><div class="tooltip"> <i class="fa-regular fa-heart button-icon button-not"></i> <p class="tooltiptext">Save to Your Library</p> </div> <div class="tooltip"> <i class="fa-solid fa-heart button-icon button-enable"></i> <p class="tooltiptext">Remove from Your Library</p> </div></td>
                            <td style="display:none">${index}</td>
                            <td class="td td-remove" onclick='app.RemoveSong(this)'><div class="tooltip"> <i class="fa-solid fa-ban"></i> <p class="tooltiptext">Remove from the list</p> </div></td>
                            </tr>
        `
      }
      pageDefault.insertAdjacentHTML('beforeend', tr)
    }
    app.isListSong = true
    if (app.play) app.ChangeNowPlay()
  },
  /** Hien thi nhac bang yeu thich */
  RenderFavoriteSong: function () {
    pageFavorite.innerHTML = ''
    for (let index = 0; index < listMusic.length; index++) {
      if (listMusic[index].favorite == 'true') {
        let tr = `
        <tr class="tr" ondblclick='app.SelectedRow(this)'>
                            <td class="td td-play"><div class="tooltip"> <i class="fa-solid fa-play" ></i> <p class="tooltiptext">Play</p> </div></td>
                            <td class="td td-title">${listMusic[index].title}</td>
                            <td class="td td-artist">${listMusic[index].artist}</td>
                            <td class="td td-genre">${listMusic[index].genre}</td>
                            <td class="td td-time">${app.ConvertToTime(listMusic[index].duration)}</td>
                            <td style="display:none">${listMusic[index].path}</td>
                            <td class="td td-like button-choice is-choice" onclick='app.FavoriteChange(this)'><div class="tooltip"> <i class="fa-regular fa-heart button-icon button-not"></i> <p class="tooltiptext">Save to Your Library</p> </div> <div class="tooltip"> <i class="fa-solid fa-heart button-icon button-enable"></i> <p class="tooltiptext">Remove from Your Library</p> </div></td>
                            <td style="display:none">${index}</td>
                            <td class="td td-remove" onclick='app.RemoveSong(this)'><div class="tooltip"> <i class="fa-solid fa-ban"></i> <p class="tooltiptext">Remove from the list</p> </div></td>
        </tr>
        `
        pageFavorite.insertAdjacentHTML('beforeend', tr)
      }
    }
  },
  /** Hien thi thong tin bai hat */
  LoadInfor: function (title, artist, time, path, fa) {
    songTitle.innerHTML = title
    songArtist.innerHTML = artist
    endTime.innerHTML = time
    if (app.isNowDefault) likeCurBtn.style.display = 'block'
    else {
      likeCurBtn.style.display = 'none'
    }
    if (fa == 'true') likeCurBtn.classList.add('is-choice')
    else likeCurBtn.classList.remove('is-choice')
    let img = execSync("exiftool -picture -b -j " + path);
    let imgBase64 = (JSON.parse(img)[0].Picture).substring(7)
    document.getElementById("song-img").src = "data:image/jpeg;base64, " + imgBase64
  },
  /** Phat nhac */
  PlaySong: function () {
    pausebtn.classList.add('is-choice')
    if (this.indexPre != this.indexCur) {
      this.Replay()
    } else {
      this.ChangeNowPlay()
    }
  },
  /** Phat gau nhien */
  Random: function () {
    app.indexPre = app.indexCur
    if (app.isNowDefault) {
      while (app.indexCur == app.indexPre) {
        app.indexCur = Math.floor(Math.random() * listMusic.length)
      }
    } else {
      while ((app.indexCur == app.indexPre) || (listMusic[app.indexCur].favorite != 'true')) {
        app.indexCur = Math.floor(Math.random() * listMusic.length)
      }
    }
    app.LoadInfor(listMusic[app.indexCur].title, listMusic[app.indexCur].artist, app.ConvertToTime(listMusic[app.indexCur].duration), listMusic[app.indexCur].path, listMusic[app.indexCur].favorite)
    app.PlaySong()
  },
  /** Chon bai nhac */
  SelectedRow: function (currentRow) {
    if (app.isPageFavorite) {
      app.isNowDefault = false
    }
    else app.isNowDefault = true
    app.indexPre = app.indexCur
    app.indexCur = Math.floor(currentRow.cells[7].textContent)
    app.LoadInfor(currentRow.cells[1].textContent, currentRow.cells[2].textContent, currentRow.cells[4].textContent, currentRow.cells[5].textContent, (currentRow.cells[6].classList.contains('is-choice')).toString())
    app.PlaySong()
    app.prevRow = currentRow
    input.value = ""
    app.Search()
    app.curRow.scrollIntoViewIfNeeded(true)
  },
  /** Thay doi hien thi dang phat nhac */
  ChangeNowPlay: function () {
    if (app.isNowDefault) {
      for (let i = 1; i <= pageDefault.childNodes.length; i += 3) {
        if (Math.floor(pageDefault.childNodes[i].cells[7].textContent) == app.indexCur) {
          app.curRow = pageDefault.childNodes[i];
          app.indexPre = app.indexCur
          app.indexCur = Math.floor(app.curRow.cells[7].textContent)
          break
        }
      }
    }
    else {
      for (let i = 1; i <= pageFavorite.childNodes.length; i += 3) {
        if (Math.floor(pageFavorite.childNodes[i].cells[7].textContent) == app.indexCur) {
          app.curRow = pageFavorite.childNodes[i]
          app.indexPre = app.indexCur
          app.indexCur = Math.floor(app.curRow.cells[7].textContent)
          break
        }
      }
    }
    if (app.prevRow) {
      app.prevRow.classList.remove('nowplay')
      app.prevRow.cells[0].innerHTML = '<div class="tooltip"> <i class="fa-solid fa-play" ></i> <p class="tooltiptext">Play</p> </div>'
    }
    app.curRow.classList.add('nowplay')
    app.curRow.cells[0].innerHTML = `
    <div class="equaliser">
                  <span class="line n1"></span>
                  <span class="line n2"></span>
                  <span class="line n3"></span>
                  <span class="line n4"></span>
                </div>
    `
    app.prevRow = app.curRow
  },
  /** Phat bai hat moi */
  Replay: function () {
    app.Stop()
    clearInterval(app.timeInterval);
    app.play = exec("mplayer -slave -quiet -volume " + volumeBar.value + ' ' + listMusic[app.indexCur].path)
    if (volumeBtn.classList.contains('is-choice')) app.play.stdin.write('mute\n');
    app.ChangeNowPlay()
    app.curRow.scrollIntoViewIfNeeded(false)
    app.isPlay = true
    rangeValue.innerHTML = '0:00'
    app.seconds = 0
    app.minutes = 0
    if (app.indexPre != app.indexCur) clearInterval(app.timeInterval)
    app.timeInterval = setInterval(app.UpdateClock, 500)
  },
  /** Bai tiep theo*/
  Next: function () {
    if (!app.isListSong) return
    else {
      if (this.isNowDefault) {
        app.indexPre = app.indexCur
        if (app.indexCur == listMusic.length - 1) {
          app.indexCur = 0
        } else {
          app.indexCur++
        }
      }
      else {
        app.indexPre = app.indexCur
        app.checkNext = false
        for (let i = app.indexCur + 1; i < listMusic.length; i++) {
          if (listMusic[i].favorite == 'true') {
            app.indexCur = i
            app.checkNext = true
            break
          }
        }
        if (app.checkNext == false) {
          for (let i = 0; i < app.indexCur; i++) {
            if (listMusic[i].favorite == 'true') {
              app.indexCur = i
              app.checkNext = true
              break
            }
          }
        }
      }
      app.LoadInfor(listMusic[app.indexCur].title, listMusic[app.indexCur].artist, app.ConvertToTime(listMusic[app.indexCur].duration), listMusic[app.indexCur].path, listMusic[app.indexCur].favorite)
      app.PlaySong()
    }
  },
  /** Bai truoc */
  Prev: function () {
    if (!app.isListSong) return
    else {
      if (app.isNowDefault) {
        app.indexPre = app.indexCur
        if (app.indexCur == 0) {
          app.indexCur = listMusic.length - 1
        } else {
          app.indexCur--
        }
      }
      else {
        app.indexPre = app.indexCur
        app.checkNext = false
        for (let i = app.indexCur - 1; i >= 0; i--) {
          if (listMusic[i].favorite == 'true') {
            app.indexCur = i
            app.checkNext = true
            break
          }
        }
        if (app.checkNext == false) {
          for (let i = listMusic.length - 1; i > app.indexCur; i--) {
            if (listMusic[i].favorite == 'true') {
              app.indexCur = i
              app.checkNext = true
              break
            }
          }
        }
      }
      app.LoadInfor(listMusic[app.indexCur].title, listMusic[app.indexCur].artist, app.ConvertToTime(listMusic[app.indexCur].duration), listMusic[app.indexCur].path, listMusic[app.indexCur].favorite)
      app.PlaySong()
    }
  },
  /** Dem giay*/
  UpdateClock: function () {
    if (app.isOpenFolder) {
      clearInterval(app.timeInterval)
    } else {
      app.miniseconds += 500
      if (app.miniseconds >= 1000) {
        app.seconds++
        app.miniseconds -= 1000
        if (app.seconds == 60) {
          app.minutes++
          app.seconds = 0
        }
      }
      const currentRange = ((app.seconds + app.minutes * 60 + app.miniseconds / 1000) / listMusic[app.indexCur].duration) * 100
      range.value = currentRange
      rangeValue.innerHTML = `${app.minutes}:${app.seconds > 9 ? app.seconds : '0' + app.seconds}`
      range.style.backgroundSize = currentRange + "% 100%"
      if (range.value == 100) {
        clearInterval(app.timeInterval)
        if (repeatBtn.classList.contains('is-choice')) { app.Replay() }
        else if (randomBtn.classList.contains('is-choice')) { app.Random() }
        else { app.Next() }
      }
    }
  },
  /** Dung bai hat */
  Stop: function () {
    exec("killall -9 mplayer")
  },
  /** Danh sach su kien */
  HandleEvents: function () {

    /** Menu chon nhac */
    showOptions.onclick = function () {
      myDropDown.classList.toggle("show");
    }

    myDropDown.onclick = function () {
      myDropDown.classList.remove("show");
    }
    /** Them nhac theo file */
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
          app.ExifSong(file, false)
        })
        app.RenderSong()
      }
    }

    /** Mo folder chua nhac */
    folderInput.onclick = async () => {
      app.folder = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
      })
      if (app.folder === undefined) return
      else {
        app.isOpenFolder = true
        app.indexCur = -1
        app.indexPre = -1
        fs.readdir(app.folder[0], (err, files) => {
          listMusic = []
          app.Stop()
          files.forEach(file => {
            if (file.substring(file.length, file.length - 3) == 'mp3') {
              app.ExifSong(app.folder[0] + '/' + file, false)
            }
          })
          app.RenderSong()
        })
      }
    }

    /** Dung nhac */
    pausebtn.onclick = function () {
      if (!app.isListSong) return
      else {
        if (pausebtn.classList.contains('is-choice')) {
          clearInterval(app.timeInterval);
          app.play.stdin.write('p\n')
          pausebtn.classList.remove('is-choice')
        } else {
          app.play.stdin.write('p\n')
          app.timeInterval = setInterval(app.UpdateClock, 500)
          pausebtn.classList.add('is-choice')
        }
      }
    }

    /** Chuyen bai */
    nextBtn.onclick = () => { app.Next() }

    /** Lui bai*/
    prevBtn.onclick = () => { app.Prev() }

    /** Che do phat ngau nhien */
    randomBtn.onclick = () => {
      randomBtn.classList.toggle("is-choice")
    }

    /** Che do phat lap lai */
    repeatBtn.onclick = () => {
      repeatBtn.classList.toggle("is-choice")
    }

    /** Tua nhac */
    range.oninput = () => {
      let valueNow = range.value * listMusic[app.indexCur].duration / 100
      let valuePre = app.seconds + app.minutes * 60 + app.miniseconds / 1000
      app.minutes = Math.floor(valueNow / 60)
      app.seconds = Math.floor(valueNow % 60)
      app.miniseconds = (valueNow - app.minutes * 60 - app.seconds) * 1000
      app.UpdateClock()
      app.play.stdin.write('seek ' + (valueNow - valuePre) + '\n')
      pausebtn.classList.add('is-choice')
    }

    /** Dieu chinh am luong */
    volumeBar.oninput = () => {
      if (app.play != null) {
        app.play.stdin.write('volume ' + volumeBar.value + ' 1\n')
      }
      if (volumeBar.value == 0) volumeBtn.classList.add('is-choice')
      else volumeBtn.classList.remove('is-choice')
      volumeBar.style.backgroundSize = volumeBar.value + "% 100%"
    }

    /** Tat am thanh */
    volumeBtn.onclick = () => {
      if (app.play != null) {
        volumeBtn.classList.toggle('is-choice')
        app.play.stdin.write('mute\n')
      }
    }

    /** Yeu thich bai hat */
    likeCurBtn.onclick = () => {
      if (likeCurBtn.classList.contains('is-choice')) {
        listMusic[Math.floor(app.curRow.cells[7].textContent)].favorite = 'false'
      }
      else {
        listMusic[Math.floor(app.curRow.cells[7].textContent)].favorite = 'true'
      }
      likeCurBtn.classList.toggle('is-choice')
      app.curRow.cells[6].classList.toggle('is-choice')
      app.isChangeFavorite = true
    }

    /** Tim kiem bai hat */
    input.onkeyup = () => { app.Search() }

  },
  /** Yeu thich bai hat */
  FavoriteChange: function (favorite) {
    app.isChangeFavorite = true
    let isFa = favorite.classList.contains('is-choice')
    let index = Math.floor(favorite.parentNode.cells[7].textContent)
    if (app.indexCur == index && app.isNowDefault == false) { }
    else if (isFa) {
      pageDefault.childNodes[index * 3 + 1].classList.remove('is-choice')
      favorite.classList.remove('is-choice')
      if (index == app.indexCur) likeCurBtn.classList.remove('is-choice')
      listMusic[Math.floor(index)].favorite = 'false'
    }
    else {
      app.isChangeFavorite = true
      favorite.classList.add('is-choice')
      if (index == app.indexCur) likeCurBtn.classList.add('is-choice')
      listMusic[Math.floor(index)].favorite = 'true'
    }
  },
  /** Xoa tai vi tri index */
  RemoveByIndex: function (index) {
    const a1 = listMusic.slice(0, index);
    const a2 = listMusic.slice(index + 1, listMusic.length);
    listMusic = a1.concat(a2)
    if (app.indexCur <= index) { }
    else app.indexCur--
  },
  /** Xoa bai hat */
  RemoveSong: function (remove) {
    if (app.isPageFavorite) {
    }
    else {
      let tr = remove.parentNode
      let index = tr.rowIndex
      const options = {
        type: 'question',
        buttons: ['No', 'Yes'],
        defaultId: 2,
        message: 'Are you sure you want to delete this song?',
        detail: tr.cells[1].textContent + ' - ' + tr.cells[2].textContent,
      }
      dialog.showMessageBox(null, options, (response) => {
        if (response) {
          app.RemoveByIndex(Math.floor(index - 1))
          app.RenderSong()
          app.RenderFavoriteSong()
          if ((index - 1) == app.indexCur) app.Random()
        }
      })
    }
  },
  /** Luu danh sach nhac */
  SaveList: function () {
    window.addEventListener('beforeunload', function e() {
      let content = ''
      for (let i = 0; i < listMusic.length; i++) {
        content += listMusic[i].getInfo()
      }
      app.Stop()
      fs.writeFile('input.txt', content, err => {
        if (err) {
          console.error(err);
        }
      });
    })
  },
  /** Chuyen chuoi thanh unicode */
  StringToASCII: function (str) {
    try {
      return str.replace(/[àáảãạâầấẩẫậăằắẳẵặ]/g, 'a')
        .replace(/[èéẻẽẹêềếểễệ]/g, 'e')
        .replace(/[đ]/g, 'd')
        .replace(/[ìíỉĩị]/g, 'i')
        .replace(/[òóỏõọôồốổỗộơờớởỡợ]/g, 'o')
        .replace(/[ùúủũụưừứửữự]/g, 'u')
        .replace(/[ỳýỷỹỵ]/g, 'y')
    } catch {
      return ''
    }
  },
  /** Tim kiem bai hat */
  Search: function () {
    // let found, filter, table, tr, td, i, j, k;
    // filter = input.value.toLowerCase();
    // table = document.getElementById("songs");
    // tr = table.getElementsByTagName("tr");
    // input.addEventListener("search", function (event) {
    //   for (i = 0; i < tr.length; i++) {
    //     tr[i].style.display = "";
    //   }
    // })
    // for (i = 1; i < tr.length; i++) {
    //   td = tr[i].querySelectorAll(".td-title, .td-artist");
    //   for (j = 0; j < td.length; j++) {
    //     if (app.StringToASCII(td[j].textContent.toLowerCase()).includes(app.StringToASCII(filter))) {
    //       found = true;
    //     }
    //   }
    //   if (found) {
    //     tr[i].style.display = "";
    //     found = false;
    //   } else {
    //     tr[i].style.display = "none";
    //   }
    // }
    let found, filter, table, tr, td, i, j, k;
    filter = input.value.toLowerCase();
    playlist = document.getElementsByClassName("playlist");
    for (i = 0; i < playlist.length; i++) {
      tr = playlist[i].getElementsByTagName("tr");
      input.addEventListener("search", function (event) {
        for (j = 1; j < tr.length; j++) {
          tr[j].style.display = "";
        }
      })
      for (j = 1; j < tr.length; j++) {
        td = tr[j].querySelectorAll(".td-title, .td-artist");
        for (k = 0; k < td.length; k++) {
          if (app.StringToASCII(td[k].textContent.toLowerCase()).includes(app.StringToASCII(filter))) {
            found = true;
          }
        }
        if (found) {
          tr[j].style.display = "";
          found = false;
        } else {
          tr[j].style.display = "none";
        }
      }
    }
  },
  /** Load nhac tu lan hoat dong truoc */
  LoadListPrev: function () {
    try {
      const data = fs.readFileSync('input.txt', 'utf8');
      let arr = data.split('\n')
      for (let i = 0; i < arr.length - 1; i++) {
        let a = arr[i].split(' FA:')
        app.ExifSong(a[0], a[1])
      }
      app.RenderSong()
    } catch (err) {
      console.error(err);
    }
  },
  /** Let's goooooooooo */
  Start: function () {
    this.LoadListPrev()
    this.HandleEvents()
    this.SaveList()
  },
}
app.Start()
