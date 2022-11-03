const $$ = document.querySelectorAll.bind(document);

/*==================================================================*/
function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
}

let button = document.getElementsByClassName("dropdown-button");
button.onclick = function(event) {
    if (!event.target.matches(".dropdown-button")) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains("show")) {
                openDropdown.classList.remove("show");
            }
        }
    }
};

/*==================================================================*/
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

document.getElementById("defaultOpen").click();

/*==================================================================*/
const rangeInputs = $$("input[type=range]");

function handleInputChange(e) {
    let target = e.target;
    if (e.target.type !== "range") {
        target = document.getElementById("range");
    }
    const min = target.min;
    const max = target.max;
    const val = target.value;

    target.style.backgroundSize = ((val - min) * 100) / (max - min) + "% 100%";
}

rangeInputs.forEach((input) => {
    input.addEventListener("input", handleInputChange);
});

/*==================================================================*/
const playList = $$(".td-play");
for (let i = 0; i < playList.length; i++) {
    playList[i].insertAdjacentHTML(
        "afterbegin",
        '<div class="tooltip"> <i class="fa-solid fa-play"></i> <p class="tooltiptext">Play</p> </div>'
    );
}

const likeList = $$(".td-like");
for (let i = 0; i < likeList.length; i++) {
  likeList[i].classList.add("button-choice");
}

for (let i = 0; i < likeList.length; i++) {
    likeList[i].insertAdjacentHTML(
        "afterbegin",
        '<div class="tooltip"> <i class="fa-regular fa-heart button-icon button-not"></i> <p class="tooltiptext">Save to Your Library</p> </div> <div class="tooltip"> <i class="fa-solid fa-heart button-icon button-enable"></i> <p class="tooltiptext">Remove from Your Library</p> </div>'
    );
}

const dislikeList = $$(".td-remove");
for (let i = 0; i < dislikeList.length; i++) {
    dislikeList[i].insertAdjacentHTML(
        "afterbegin",
        '<div class="tooltip"> <i class="fa-solid fa-ban"></i> <p class="tooltiptext">Remove from the list</p> </div>'
    );
}

/*=============================Button choice effect=====================================*/
const repeatButton = $$(".button-choice");
for (let i = 0; i < repeatButton.length; i++) {
    repeatButton[i].addEventListener("click", (event) => {
        const button = event.currentTarget;
        button.classList.toggle("is-choice");
    });
}

/*==================================================================*/