let currentversion = "1.0.1-rc.1"
if (version != currentversion && !currentversion.includes("rc")) {
    if (confirm(`There is a newer version (${version}) available. Do you want to update?`)) {
        window.location.href = `https://github.com/MEME-KING16/Swim-time-comparison/releases/tag/v${version}`
    }
}
function convertTimeToSeconds(timeStr) {
    if (typeof timeStr !== 'string') {
        console.log(timeStr)
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
  
      const result = { age, gender, times };
      console.log(JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('Error fetching athlete times:', error);
      return { age: null, gender: null, times: [] };
    }
  }
  let time
  let nonRegionalEvents = ["50m Breaststroke50m","50m Breaststroke25m","50m Butterfly50m","50m Butterfly25m","100m Medley50m","100m Medley25m","50m Backstroke50m","50m Backstroke25m"]
  function times(id) {
  scrapeAthleteTimes(`${id}`).then(result => {
    console.log("Final result:", result);
    time = []
    time.push(`<br>${id}<br>`)
    for (let index = 0; index < Object.keys(result.times).length; index++) {
        if(nonRegionalEvents.indexOf(result.times[index].event+result.times[index].course) != -1 || (result.times[index].event+result.times[index].course).includes("Lap"))
            continue
        console.log(result.times[index].event)
        console.log(result.times[index].time)
        console.log(standards[result.gender][`${result.age}`][result.times[index].event][`${result.times[index].course}`])
        time.push(`${result.times[index].event}(${result.times[index].course}) ${result.times[index].time} : Drop Needed for Regionals: ${((convertTimeToSeconds(result.times[index].time) - convertTimeToSeconds(standards[result.gender][`${result.age}`][result.times[index].event][`${result.times[index].course}`]))/convertTimeToSeconds(result.times[index].time)*100).toFixed(2)}% <br>`);
        
    }
    document.getElementById("regionals").innerHTML += time.join('')
  });
}
if(localStorage.getItem("Athlete Id")) {
    document.getElementById("id").value = localStorage.getItem("Athlete Id")
    getTimes()
}

function getTimes() {
    document.getElementById("regionals").innerHTML = ""
    for (let index = 0; index < document.getElementById("id").value.split(",").length; index++) {
        times(document.getElementById("id").value.split(",")[index])   
    }
}
