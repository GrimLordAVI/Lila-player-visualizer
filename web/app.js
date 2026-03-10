document.addEventListener("DOMContentLoaded", async () => {

const canvas = document.getElementById("mapCanvas")
const ctx = canvas.getContext("2d")

const mapSelect = document.getElementById("mapSelect")
const dateSelect = document.getElementById("dateSelect")
const matchSelect = document.getElementById("matchSelect")
const heatmapBtn = document.getElementById("toggleHeatmap")
const mapImage = document.getElementById("mapImage")

let events = []
let currentTime = null
let heatmapVisible = false
const EVENT_COLORS = {
Position:"#4CAF50",
Kill:"#FF4444",
Killed:"#AA0000",
Loot:"#FFD700",
BotKill:"#FF8800",
KilledByStorm:"#00BFFF"
}
ctx.fillStyle = EVENT_COLORS[event.event] || "#999"
// -----------------------------
// LOAD DATA
// -----------------------------

async function loadData(){
 events.sort((a,b)=> new Date(a.ts) - new Date(b.ts))
 document.getElementById("statEvents").textContent = events.length

const matches = new Set(events.map(e => e.match_id))
document.getElementById("statMatches").textContent = matches.size

const players = new Set(events.map(e => e.user_id))
document.getElementById("statPlayers").textContent = players.size

const kills = events.filter(e => e.event.includes("Kill")).length
document.getElementById("statKills").textContent = kills

const loot = events.filter(e => e.event === "Loot").length
document.getElementById("statLoot").textContent = loot
const res = await fetch("../output/matches.json")
const data = await res.json()

// detect actual structure
if(Array.isArray(data)){
events = data
}
else if(data.events){
events = data.events
}
else if(data.data){
events = data.data
}
else{
events = Object.values(data)[0]
}

console.log("Events loaded:", events.length)

populateFilters()
draw()

}
// -----------------------------
// POPULATE FILTERS
// -----------------------------

function populateFilters(){

const maps = [...new Set(events.map(e => e.map_id))]
const dates = [...new Set(events.map(e => e.date))]
const matches = [...new Set(events.map(e => e.match_id))]

maps.forEach(m=>{
const opt=document.createElement("option")
opt.value=m
opt.textContent=m
mapSelect.appendChild(opt)
})

dates.forEach(d=>{
const opt=document.createElement("option")
opt.value=d
opt.textContent=d
dateSelect.appendChild(opt)
})

matches.slice(0,200).forEach(m=>{
const opt=document.createElement("option")
opt.value=m
opt.textContent=m
matchSelect.appendChild(opt)
})

}

// -----------------------------
// WORLD → MAP COORDINATES
// -----------------------------

function worldToMap(x,z){

const mapSize=1024
const worldMin=-5000
const worldMax=5000

const mapX=((x-worldMin)/(worldMax-worldMin))*mapSize
const mapY=((z-worldMin)/(worldMax-worldMin))*mapSize

return [mapX,mapY]

}

// -----------------------------
// FILTER EVENTS
// -----------------------------

function getFilteredEvents(){

let filtered=events

if(mapSelect.value)
filtered=filtered.filter(e=>e.map_id===mapSelect.value)

if(dateSelect.value)
filtered=filtered.filter(e=>e.date===dateSelect.value)

if(matchSelect.value)
filtered=filtered.filter(e=>e.match_id===matchSelect.value)

return filtered

}

// -----------------------------
// DRAW EVENTS
// -----------------------------

function draw(){

ctx.clearRect(0,0,1024,1024)

const filtered=getFilteredEvents()

filtered.slice(0,6000).forEach(e=>{

const [x,y]=worldToMap(e.x,e.z)

// HUMAN MOVEMENT
if(e.event==="Position"){

if(Math.random()>0.15)return

ctx.fillStyle="cyan"
ctx.beginPath()
ctx.arc(x,y,2,0,Math.PI*2)
ctx.fill()

}

// BOT MOVEMENT
if(e.event==="BotPosition"){

if(Math.random()>0.15)return

ctx.fillStyle="red"
ctx.beginPath()
ctx.arc(x,y,2,0,Math.PI*2)
ctx.fill()

}

// PLAYER KILL
if(e.event==="Kill"){

ctx.fillStyle="yellow"
ctx.fillRect(x-4,y-4,8,8)

}

// PLAYER DEATH
if(e.event==="Killed"){

ctx.strokeStyle="white"
ctx.beginPath()
ctx.arc(x,y,6,0,Math.PI*2)
ctx.stroke()

}

// BOT KILL
if(e.event==="BotKill"){

ctx.fillStyle="orange"
ctx.fillRect(x-3,y-3,6,6)

}

// BOT KILLED
if(e.event==="BotKilled"){

ctx.strokeStyle="pink"
ctx.beginPath()
ctx.arc(x,y,5,0,Math.PI*2)
ctx.stroke()

}

// STORM DEATH
if(e.event==="KilledByStorm"){

ctx.fillStyle="purple"
ctx.beginPath()
ctx.arc(x,y,4,0,Math.PI*2)
ctx.fill()

}

// LOOT
if(e.event==="Loot"){

ctx.fillStyle="lime"
ctx.fillRect(x-2,y-2,4,4)

}

})
const slider = document.getElementById("timeSlider")

slider.addEventListener("input", () => {
    let sliderTimeout

slider.addEventListener("input", () => {

clearTimeout(sliderTimeout)

sliderTimeout = setTimeout(() => {

const percent = slider.value / 100
const index = Math.floor(events.length * percent)

currentTime = events[index]?.ts
draw()

}, 50)

})

const percent = slider.value / 100
const index = Math.floor(events.length * percent)

currentTime = events[index]?.ts

document.getElementById("timeLabel").textContent =
currentTime ? new Date(currentTime).toLocaleTimeString() : "Full Match"

draw()

})

// -----------------------------
// HEATMAP
// -----------------------------

if(heatmapVisible){

filtered.forEach(p=>{

const [x,y]=worldToMap(p.x,p.z)

ctx.fillStyle="rgba(255,0,0,0.03)"

ctx.beginPath()
ctx.arc(x,y,12,0,Math.PI*2)
ctx.fill()

})

}
if(currentTime){
filtered = filtered.filter(e =>
new Date(e.ts) <= new Date(currentTime)
)
}
filtered = filtered.slice(-5000)
}

// -----------------------------
// MAP SWITCHING
// -----------------------------

mapSelect.addEventListener("change",()=>{

const maps={
"AmbroseValley":"../minimaps/AmbroseValley_Minimap.png",
"GrandRift":"../minimaps/GrandRift_Minimap.png",
"Lockdown":"../minimaps/Lockdown_Minimap.jpg"
}

if(maps[mapSelect.value]){
mapImage.src=maps[mapSelect.value]
}

draw()

})

// -----------------------------
// FILTER EVENTS
// -----------------------------

mapSelect.addEventListener("change",draw)
dateSelect.addEventListener("change",draw)
matchSelect.addEventListener("change",draw)

// -----------------------------
// HEATMAP BUTTON
// -----------------------------

heatmapBtn.addEventListener("click",()=>{

heatmapVisible=!heatmapVisible

console.log("Heatmap:",heatmapVisible)

draw()

})

// -----------------------------
// INIT
// -----------------------------

await loadData()

})