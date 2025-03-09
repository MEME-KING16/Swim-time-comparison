let currentversion = "1.3.0"
let settings
if (localStorage.getItem("settings")) {
    settings = JSON.parse(localStorage.getItem("settings"))
    document.getElementById("MinDaysForHighlight").value = settings.MinDaysForHighlight
} else {
    settings = {
        MinDaysForHighlight:365
    }
}

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}
if (version != currentversion && !currentversion.includes("rc")) {
    if (confirm(`There is a newer version (${version}) available. Do you want to update?`)) {
        window.location.href = `https://github.com/MEME-KING16/Swim-time-comparison/releases/tag/v${version}`
    }
}
function convertTimeToSeconds(timeStr) {
    if (typeof timeStr !== 'string') {
    }

    if (!timeStr.includes(':')) {
        return parseFloat(timeStr); // Return as a number if there's no minutes part
    }

    // Split the input string into minutes and seconds parts
    const parts = timeStr.split(':');

    if (parts.length !== 2) {
        throw new Error("Invalid time format");
    }

    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1]);

    if (isNaN(minutes) || isNaN(seconds)) {
        throw new Error("Invalid time values");
    }

    // Calculate total time in seconds and return
    return minutes * 60 + seconds;
}

function calculateScore(percentDropNeeded, days, gender, alphaMale = 0.03, alphaFemale = 0.05) {
    if (percentDropNeeded < 0) return Infinity;
    let alpha = gender === "male" ? alphaMale : alphaFemale;
    let normalizedPercent = 100 - percentDropNeeded;
    let timeBoost = 1 + Math.log1p(days) * alpha

    return Math.max(0, normalizedPercent * timeBoost * 100);
}

function daysAgo(dateString) {
    const givenDate = new Date(dateString);
    const today = new Date();
    const difference = today - givenDate;
    return Math.floor(difference / (1000 * 60 * 60 * 24));
}

  async function scrapeAthleteTimes(athleteId) {
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const targetUrl = `https://www.swimrankings.net/index.php?page=athleteDetail&athleteId=${athleteId}`;
  
    try {
      // Fetch the page using the proxy
      const response = await fetch(proxyUrl + targetUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();
  
      // Parse the HTML using DOMParser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
  
      // Extract the athlete's age from the element with id "name"
      let age = null;
      const nameDiv = doc.querySelector('#name');
      let name = nameDiv.innerHTML.split(" <br>")[0].split(", ")
      if (nameDiv) {
        const text = nameDiv.textContent;
        // Match a 4-digit number after an opening parenthesis, e.g., "(2010"
        const match = text.match(/\((\d{4})/);
        if (match) {
          const birthYear = parseInt(match[1], 10);
          const currentYear = new Date().getFullYear();
          age = currentYear - birthYear;
        }
      }
  
      // Extract the athlete's gender from the photo element
      let gender = null;
      const photoImg = doc.querySelector("#photo img");
      if (photoImg) {
        const src = photoImg.getAttribute("src").toLowerCase();
        if (src.includes("male")) {
          gender = "male";
        } else if (src.includes("female")) {
          gender = "female";
        }
      }
  
      // Select rows from the table with class "athleteBest"
      const rows = doc.querySelectorAll(
        "table.athleteBest tr.athleteBest0, table.athleteBest tr.athleteBest1"
      );
      const times = [];
  
      rows.forEach(row => {
        // For some cells the text may be inside an <a> tag
        const getText = (selector) => {
          const cell = row.querySelector(selector);
          if (!cell) return "";
          const link = cell.querySelector("a");
          return (link ? link.textContent : cell.textContent).trim();
        };
  
        const event = getText("td.event");
        const course = getText("td.course");
        const time = getText("td.time");
        const code = getText("td.code");
        const date = getText("td.date");
        const city = getText("td.city");
        const meet = getText("td.name");
  
        if (event && time) {
          times.push({ event, course, time, code, date, city, meet });
        }
      });
  
      const result = { age, gender, times, name };
      return result;
    } catch (error) {
      console.error('Error fetching athlete times:', error);
      return { age: null, gender: null, times: [], name: null };
    }
  }
  let time
  let nonRegionalEvents = ["50m Breaststroke50m","50m Breaststroke25m","50m Butterfly50m","50m Butterfly25m","100m Medley50m","100m Medley25m","50m Backstroke50m","50m Backstroke25m"]
  function times(id) {
  scrapeAthleteTimes(`${id}`).then(result => {
    time = []
    time.push(`<br>${result.name[1]} ${capitalizeFirstLetter(result.name[0].toLocaleLowerCase())} (${id})<br>`)
    for (let index = 0; index < Object.keys(result.times).length; index++) {
        if(nonRegionalEvents.indexOf(result.times[index].event+result.times[index].course) != -1 || (result.times[index].event+result.times[index].course).includes("Lap"))
            continue
        time.push(`<span class="${result.name[1]}_${capitalizeFirstLetter(result.name[0].toLocaleLowerCase())}">${result.times[index].event}(${result.times[index].course})(<span class="date ${result.name[1]}_${capitalizeFirstLetter(result.name[0].toLocaleLowerCase())}">${result.times[index].date}</span>) ${result.times[index].time} : Drop Needed for Regionals: <span class="percent ${result.name[1]}_${capitalizeFirstLetter(result.name[0].toLocaleLowerCase())}">${((convertTimeToSeconds(result.times[index].time) - convertTimeToSeconds(standards[result.gender][`${result.age}`][result.times[index].event][`${result.times[index].course}`]))/convertTimeToSeconds(result.times[index].time)*100).toFixed(2)}%</span></span> Score: (<span class="score ${result.name[1]}_${capitalizeFirstLetter(result.name[0].toLocaleLowerCase())}">${calculateScore(((convertTimeToSeconds(result.times[index].time) - convertTimeToSeconds(standards[result.gender][`${result.age}`][result.times[index].event][`${result.times[index].course}`]))/convertTimeToSeconds(result.times[index].time)*100).toFixed(2),daysAgo(result.times[index].date),result.gender).toFixed(0)}</span>) <br>`);
    }
    document.getElementById("regionals").innerHTML += time.join('')
    highlightTimes(`${result.name[1]}_${capitalizeFirstLetter(result.name[0].toLocaleLowerCase())}`);
    highlightDates(`${result.name[1]}_${capitalizeFirstLetter(result.name[0].toLocaleLowerCase())}`);
    highlightScores(`${result.name[1]}_${capitalizeFirstLetter(result.name[0].toLocaleLowerCase())}`);
  });
}
if(localStorage.getItem("Athlete Id")) {
    document.getElementById("id").value = localStorage.getItem("Athlete Id")
    getTimes()
}

function highlightTimes(name) {
    let elements = document.getElementsByClassName(name+" percent")
    let values = Array.from(elements, el => parseFloat(el.innerHTML.split("%")[0]) || Infinity);
    let minIndex = values.indexOf(Math.min(...values));
    let minElement = elements[minIndex];
    let maxIndex = values.indexOf(Math.max(...values));
    let maxElement = elements[maxIndex];
    minElement.classList.add("min")
    maxElement.classList.add("max")
}

function highlightDates(name) {
    let elements = Array.from(document.getElementsByClassName(name + " date"));
    let values = Array.from(elements, el => daysAgo(el.innerHTML.replaceAll("&nbsp;"," ")) || Infinity);
    elements.forEach((el, i) => {
        if (values[i] > 100) {
            el.classList.add("max");
        }
    });
}

function highlightScores(name) {
    let elements = document.getElementsByClassName(name + " score");
    let values = Array.from(elements, el => parseFloat(el.innerHTML));

    let finiteValues = values.filter(value => isFinite(value));

    if (finiteValues.length === 0) return;

    let minValue = Math.min(...finiteValues);
    let maxValue = Math.max(...finiteValues);

    let minIndex = values.indexOf(minValue);
    let maxIndex = values.indexOf(maxValue);

    if (minIndex !== -1) elements[minIndex].classList.add("max");
    if (maxIndex !== -1) elements[maxIndex].classList.add("min");
}


function getTimes() {
    localStorage.setItem("Athlete Id",document.getElementById("id").value)
    document.getElementById("regionals").innerHTML = ""
    for (let index = 0; index < document.getElementById("id").value.split(",").length; index++) {
        times(document.getElementById("id").value.split(",")[index])
    }
}

function openSettings() {
    document.getElementById("content").style.display = "none"
    document.getElementById("settings").style.display = "block"
}

function closeSettings() {
    document.getElementById("content").style.display = "block"
    document.getElementById("settings").style.display = "none"
}
