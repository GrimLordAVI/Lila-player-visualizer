document.addEventListener("DOMContentLoaded", async () => {

const canvas = document.getElementById("mapCanvas")
const ctx = canvas.getContext("2d")

const mapSelect = document.getElementById("mapSelect")
const dateSelect = document.getElementById("dateSelect")
const matchSelect = document.getElementById("matchSelect")
const heatmapBtn = document.getElementById("toggleHeatmap")
const mapImage = document.getElementById("mapImage")
const slider = document.getElementById("timeSlider")

let events = []
let currentTime = null
let heatmapVisible = false
let sliderTimeout = null

// dynamic world bounds
let minX = Infinity
let maxX = -Infinity
let minZ = Infinity
let maxZ = -Infinity

const EVENT_COLORS = {
Position:"#4CAF50",
Kill:"#FF4444",
Killed:"#AA0000",
Loot:"#FFD700",
BotKill:"#FF8800",
KilledByStorm:"#00BFFF"
}

// -----------------------------
// LOAD DATA
// -----------------------------

async function loadData(){

const res = await fetch("../output/matches.json")
const data = await res.json()

// detect structure
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

// sort by time
events.sort((a,b)=> new Date(a.ts) - new Date(b.ts))

// calculate world bounds automatically
events.forEach(e=>{
if(e.x!==undefined && e.z!==undefined){
if(e.x < minX) minX = e.x
if(e.x > maxX) maxX = e.x
if(e.z < minZ) minZ = e.z
if(e.z > maxZ) maxZ = e.z
}
})

console.log("World bounds:",minX,maxX,minZ,maxZ)
console.log("Events loaded:",events.length)

updateStats()
populateFilters()
draw()

}

// -----------------------------
// UPDATE STATS
// -----------------------------

function updateStats(){

const filtered = getFilteredEvents()

document.getElementById("statEvents").textContent = filtered.length

const matches = new Set(filtered.map(e => e.match_id))
document.getElementById("statMatches").textContent = matches.size

const players = new Set(filtered.map(e => e.user_id))
document.getElementById("statPlayers").textContent = players.size

const kills = filtered.filter(e => e.event.includes("Kill")).length
document.getElementById("statKills").textContent = kills

const loot = filtered.filter(e => e.event === "Loot").length
document.getElementById("statLoot").textContent = loot

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
// WORLD → MAP COORDINATES (FIXED)
// -----------------------------

function worldToMap(x,z){

const mapWidth = canvas.width
const mapHeight = canvas.height

const padding = 0.05   // 5% crop

const mapX = ((x - minX) / ((maxX - minX) * (1 - padding))) * mapWidth
const mapY = mapHeight - ((z - minZ) / ((maxZ - minZ) * (1 - padding))) * mapHeight
return [mapX,mapY]

}

// -----------------------------
// FILTER EVENTS
// -----------------------------

function getFilteredEvents(){

let filtered = events

if(mapSelect.value)
filtered = filtered.filter(e=>e.map_id===mapSelect.value)

if(dateSelect.value)
filtered = filtered.filter(e=>e.date===dateSelect.value)

if(matchSelect.value)
filtered = filtered.filter(e=>e.match_id===matchSelect.value)

return filtered

}

// -----------------------------
// DRAW EVENTS
// -----------------------------

function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height)

let filtered = getFilteredEvents()

if(currentTime){
filtered = filtered.filter(e => new Date(e.ts) <= new Date(currentTime))
}

// performance limit
filtered = filtered.slice(-5000)

// -----------------------------
// HEATMAP
// -----------------------------

if(heatmapVisible){

filtered.forEach(p=>{

if(p.x===undefined || p.z===undefined) return

const [x,y] = worldToMap(p.x,p.z)

ctx.fillStyle="rgba(255,0,0,0.03)"

ctx.beginPath()
ctx.arc(x,y,12,0,Math.PI*2)
ctx.fill()

})

}

// -----------------------------
// DRAW EVENTS
// -----------------------------

filtered.forEach(e=>{

if(e.x===undefined || e.z===undefined) return

const [x,y] = worldToMap(e.x,e.z)

// HUMAN MOVEMENT
if(e.event==="Position"){

if(Math.random()>0.15) return

ctx.fillStyle="cyan"
ctx.beginPath()
ctx.arc(x,y,2,0,Math.PI*2)
ctx.fill()

}

// BOT MOVEMENT
if(e.event==="BotPosition"){

if(Math.random()>0.15) return

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

}

// -----------------------------
// TIMELINE
// -----------------------------

slider.addEventListener("input", () => {

clearTimeout(sliderTimeout)

sliderTimeout = setTimeout(() => {

const percent = slider.value / 100
const index = Math.floor(events.length * percent)

currentTime = events[index]?.ts

document.getElementById("timeLabel").textContent =
currentTime ? new Date(currentTime).toLocaleTimeString() : "Full Match"

draw()

},50)

})

// -----------------------------
// MAP SWITCH
// -----------------------------

mapSelect.addEventListener("change",()=>{

const maps={
"AmbroseValley":"../minimaps/AmbroseValley_Minimap.png",
"GrandRift":"../minimaps/GrandRift_Minimap.png",
"Lockdown":"../minimaps/Lockdown_Minimap.jpg"
}

if(maps[mapSelect.value]){
mapImage.src = maps[mapSelect.value]
}

updateStats()
draw()

})

dateSelect.addEventListener("change",()=>{updateStats();draw()})
matchSelect.addEventListener("change",()=>{updateStats();draw()})

// -----------------------------
// HEATMAP
// -----------------------------

heatmapBtn.addEventListener("click",()=>{

heatmapVisible = !heatmapVisible

console.log("Heatmap:",heatmapVisible)

draw()

})

// -----------------------------
// INIT
// -----------------------------

await loadData()

})
