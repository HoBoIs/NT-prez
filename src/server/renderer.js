// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

lc=require('./setup_window/lent_conv')
const ipcRenderer = require('electron').ipcRenderer;
let nxt_first_line="N/A"
let prev_first_line="N/A"
var waiting=0
process.stdout.write('Starting render...'+'\n')
const server = require('./server.js')
//delete require.cache[path.join(setup.path_prefix,"songs.js")]
var songs = require('./songs.js')
var thanks = require('./thanks.js')
var musics = require('./musics.js')
const config = require('./config.js')
var talks = require(config.talks_path)
const fs = require('fs')
const path = require('path')
const NOMUSIC = '-'
const NOVIDEO = '-'
const NOIMAGE = '-'

const errors = talks.map(talk => (
  ((
    talk.music === NOMUSIC ||
    (
      talk.music != '' &&
      (
	  (!talk.isVideo && fs.existsSync(path.join(config.talkmusic_dir, talk.music)))||
	  ( talk.isVideo && fs.existsSync(path.join(config.video_dir, talk.music)))
      )
    )
  ) ? '' : `Music file missing for: ${talk.title} <br />`) /*+
  ((//TODO check the elements of the list
    !('image' in talk) ||
    (
      talk.image != '' &&
      fs.existsSync(path.join(config.images_dir, talk.image))
    )||(talk.image===NOIMAGE)
  ) ? '' : `Image file missing for: ${talk.title}  ${talk.image!="-"}<br />`)*/
)).join('')
process.stdout.write('Starting errors...'+'\n')

if (errors !== '') {
  document.body.innerHTML = /* html */`
    <style>
      body {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      div {
        color: red;
        font-size: 4vw;
      }
    </style>
    <div>
      ${errors}
    </div>
  `
}

process.stdout.write("1\n")
var idx=0
var titleList = songs.map((s) => {
    if (s.comment==undefined) s.comment=""
    warn=""
    if (lc.has_alleluja(s) && lc.is_lent_now()) {warn="ß"}
    return s.titles[0]+s.comment+warn+'×'+idx++
}).join(';')
process.stdout.write("2\n")
var musicList = musics.join(';')
var talkList = talks.map(t => `${t.name} - ${t.title}`).join(';')
server.wss.on('connection', client => {
    process.stdout.write("CONN0\n");
  client.send('SONGS:' + titleList)
  client.send('TALKS:' + talkList)
  client.send('MUSICS:' + musicList)
  client.send("PRFL:"+prev_first_line)
  client.send("NXTFL:"+nxt_first_line)
    process.stdout.write("CONN\n");
    process.stdout.write(titleList.length+"\n");
})

const status = {
  autoplay: 0,
  title: '',
  talk: undefined,
  number: 0,
  fontSize: 40,
  state: 'song',
  music: NOMUSIC,
  song_idx: 0,
  name1:"",
  name2:""
}

const outerContainer = document.getElementById('outerContainer')
const innerContainer = document.getElementById('innerContainer')
const imageContainer = document.getElementById('imageContainer')
//const talkImageContainer = document.getElementById('talkImageContainer')
const desiredWidthRatio = 9 / 10
const maxHeightRatio = 9 / 10
let margin = { t: 0, b: 0, l: 0, r: 0 }

const talkContainer = document.getElementById('talkContainer')
const talkTitle = document.getElementById('talkTitle')
const talkName = document.getElementById('talkName')
const tmAudio = document.getElementById('tmAudio')
const tmVideo = document.getElementById('tmVideo')
const tmVideoSrc = document.getElementById('tmVideoSrc')
tmAudio.addEventListener("loadeddata", function(){
    ipcRenderer.send('to_set_audioevent','dur:'+tmAudio.duration)
})
const setMargins = () => {
  window.document.body.style.top = `${margin.t}%`
  window.document.body.style.bottom = `${margin.b}%`
  window.document.body.style.left = `${margin.l}%`
  window.document.body.style.right = `${margin.r}%`
}

setMargins()
var prew=Date.now()
var start
var ptime=0
const handleMessage = (m,ws) => {
  prew=start
  start=Date.now()
  process.stdout.write(m+'\n')
  if (m.startsWith('PREV:')) {
    if (status.state=='song'){
	status.number--
    }else if (status.state=='talk'){
	status.talk.imageIdx--;
	renderTalkImage()
    }
  } else if (m.startsWith('NEXT:')) {
    if (status.state=='song'){
	status.number++
    }else if (status.state=='talk'){
	status.talk.imageIdx++;
	renderTalkImage()
    }
  } else if (m.startsWith('CUSTOMTHANKS:')) {
      st=m.substring(13)
      mode=st[0]
      specthanks(mode,st.substring(1))
  } else if (m.startsWith('SONG:')) {
    waiting=0
    st=m.substring(5)
    st=st.replace(/#.*×/,'×')
    if (checkidx(st.split('×'))) {
	sendrefr(ws)
    }else{
	status.name1=""
	status.name2=""
	status.state = 'song'
	status.number = 0
        status.title = st.split('×')[0]
	status.song_idx=1*st.split('×')[1]
    }
    ptime=0
  } else if (m.startsWith('TALK:')) {
    waiting=0
    status.state = 'talk'
    status.talk = talks.filter(t => `${t.name} - ${t.title}` === m.substring(5))[0]
    status.talk.imageIdx=0
  } else if (m.startsWith('PLAY:')) {
    if (status.talk.music !== NOMUSIC) {
      if (status.talk.isVideo){
        process.stdout.write('playing'+'\n')
        playVideo()
        ipcRenderer.send('to_set_audioevent','start:'+tmVideo.currentTime+':'+tmVideo.duration)
      }else{
        process.stdout.write('playing'+'\n')
        tmAudio.play()
        ipcRenderer.send('to_set_audioevent','start:'+tmAudio.currentTime+':'+tmAudio.duration)
      }
    }
  } else if (m.startsWith('THANKS:')) {
    hideVideo()
    renderThanks()
  } else if (m.startsWith('INVERT:')) {
    if (document.body.classList.contains('invert')) {
      document.body.classList.remove('invert')
      tmVideo.classList.remove('invert')
      //talkImageContainer.classList.remove('invert')
    } else {
      document.body.classList.add('invert')
      tmVideo.classList.add('invert')
      //talkImageContainer.classList.add('invert')
    }
  } else if (m.startsWith('MARGIN:')) {
    if (m[7] === 'x') {
      margin.t = 0
      margin.b = 0
      margin.l = 0
      margin.r = 0
    } else {
      const side = m[7]
      process.stdout.write(side+'\n')
      const direction = m[9] === '+' ? 1 : -1
      margin[side] = Math.max(0, Math.min(margin[side] + (1 * direction), 100))
    }

    setMargins()

    // window.document.body.style.height = `${100 - margin}%`
  } else if (m.startsWith("PLAYMUSIC:")){
    waiting=0
    if (status.music !== NOMUSIC) {
      tmAudio.src = status.music;
      tmAudio.currentTime = ptime
      tmAudio.play()
      status.autoplay=0
      ipcRenderer.send('to_set_audioevent','start:'+tmAudio.currentTime+':'+tmAudio.duration)
      /*tmAudio.ended=function(event){
	process.stdout.write("EMP\n");
      }*/
    }
  } else if (m.startsWith("PLAYMUSICAUTO:")){
    waiting=0
    if (status.music !== NOMUSIC) {
      tmAudio.src = status.music;
      tmAudio.currentTime = ptime
      tmAudio.play()
	status.autoplay=1
      ipcRenderer.send('to_set_audioevent','start:'+tmAudio.currentTime+':'+tmAudio.duration)
      /*tmAudio.ended=function(event){
	sleapAndPlay();
      }*/
    }
  } else if (m.startsWith('PAUSEMUSIC:')){
    ipcRenderer.send('to_set_audioevent','pause')
    ptime = tmAudio.currentTime
    tmVideo.pause()
    tmAudio.pause()
  } else if (m.startsWith('STOPMUSIC:')){
    ipcRenderer.send('to_set_audioevent','stop')
    waiting=0
    tmAudio.pause()
    tmAudio.currentTime = 0
    ptime=0
  } else if (m.startsWith('SOUNDDOWN:')){
    if (tmAudio.volume<0.11) {
      tmAudio.volume=0.1
    }else{
      tmAudio.volume=tmAudio.volume-0.10
    }
    tmVideo.volume=tmAudio.volume
  } else if (m.startsWith('SOUNDUP:')){
    if (tmAudio.volume>0.90) {
      tmAudio.volume=1.00
    }else{
      tmAudio.volume=tmAudio.volume+0.10
    }
    tmVideo.volume=tmAudio.volume
  } else if (m.startsWith('MUSIC:')) {
    waiting=0
    status.state = 'music'
    status.music = path.join( config.music_dir,musics.filter(t => t === m.substring(6))[0])
  } else if (m.startsWith('REFRESHDB:')) {
    refreshdb()
  }
    millis=-Date.now()+start
}
function checkidx(pmr){
    const idx=1*pmr[1]
    const title=pmr[0]
    return !(idx>-1 && idx<songs.length && title===songs[idx].titles[0])
}
function sendrefr(){
  server.broadcast('SONGS:' + titleList)
}
function refreshdb() {
  process.stdout.write(location+"=host\n")
  location.reload(true)
}
function removetags(str){
    return str.replace(/<[^>]*>/gi,"")
}
function logitem(item){
    text=""
    try{
    //tmVideo.style.object_fit="cover"
    for (const prop in item.style) {
	//if (Object.hasOwn(tmVideo.style, prop)) {
	    text += `${item.style[prop]} = '${prop}'\n`;
	//}
    }
    process.stdout.write(text+"\n")
    }catch(err){
    process.stdout.write(err.message+"\n")
    }
}
function playVideo(){
    tmVideo.load()
    //talkImageContainer.style.height="0%";
    //talkImageContainer.innerHTML=''
    talkContainer.style.backgroundImage = ''
    talkTitle.innerText = ''
    talkName.innerText = ''
    tmAudio.pause()
    tmVideo.style.display="flex"
    tmVideo.style.width="100vw"
    tmVideo.style.height="100vh"
    tmVideo.style.objectFit="cover"
    tmVideo.play()
}
function hideVideo(){
    tmVideo.style.display= "none";
    //tmVideo.style;
    process.stdout.write("HIDE");
    tmVideo.pause();
}
const adjustFontSize = () => {
  const widthRatio = () => innerContainer.clientWidth / outerContainer.clientWidth
  const heightRatio = () => innerContainer.clientHeight / outerContainer.clientHeight

  innerContainer.style.fontSize = `${status.fontSize}px`
  minS=1
  maxS=config.maxFontSize

  while (
    minS+1<maxS
  ) {
      status.fontSize = (minS+maxS)/2
      innerContainer.style.fontSize = `${status.fontSize}px`
      if(
    	Math.abs(widthRatio() - desiredWidthRatio) > 0.05 &&
    	heightRatio() < maxHeightRatio &&
    	widthRatio() < desiredWidthRatio&&
    	status.fontSize < config.maxFontSize
      ){
        minS=status.fontSize
      }else{
        maxS=status.fontSize
      }
  }
}
const renderSong = () => {
    hideVideo()
    try{
  if (status.title === '') {
    return
  }
  imageContainer.innerHTML =''

  talkContainer.style.display = 'none'
  ipcRenderer.send('to_set_audioevent','stop')
  tmAudio.pause()
  tmAudio.src = ''
  outerContainer.style.display = 'flex'
  lc.song_conv(songs[status.song_idx])
  const currentSectionCount = songs[status.song_idx].sections.length

  if (status.number < 0) {
    innerContainer.textContent = ''
    if (status.number < -1) {
	status.song_idx--;
	if (status.song_idx==-1) status.song_idx=songs.length-1
	status.title=songs[status.song_idx].titles[0]
        status.number = songs[status.song_idx].sections.length-1
        renderSong()
	return;
    }else{
	let pidx=status.song_idx-1
	if (pidx==-1) pidx=songs.length-1
	let sects=songs[pidx].sections
	prev_first_line = sects[sects.length-1].trim().replace(/\n.*/gi,"")
	nxt_first_line=songs[status.song_idx].sections[0].trim().replace(/\n.*/gi,"")
    }
  } else if (status.number >= currentSectionCount) {
    if (status.number==currentSectionCount){
      let nidx=status.song_idx+1
      if (nidx==songs.length)nidx=0
      prev_first_line=songs[status.song_idx].sections[status.number-1].trim().replace(/\n.*/gi,"")
      nxt_first_line= songs[nidx].sections[0].trim().replace(/\n.*/gi,"")
      
      cnt=config.imageUrls.length
      index=Math.floor(Math.random() * cnt)
      imageContainer.innerHTML =' <img src="'+config.imageUrls[index]+'" style=" height:100%;" > '
      innerContainer.innerText=''
      send_content('Logó')
      return
    }else{
      status.song_idx++;
      if (status.song_idx==songs.length) status.song_idx=0
      status.title=songs[status.song_idx].titles[0]
      status.number = 0
      renderSong()
      return;
    }
  } else {//inerHTML tud formázást
    innerContainer.innerHTML = songs[status.song_idx].sections[status.number].trim()
    if (status.name1!=""){
	innerContainer.innerHTML=innerContainer.innerHTML.replace("___-t",status.name1)
	innerContainer.innerHTML=innerContainer.innerHTML.replace("___-ért",status.name1)
	innerContainer.innerHTML=innerContainer.innerHTML.replace("...-t",status.name2)
    }
    if (status.number==0) {
	prev_first_line="Dal elötti üres";
    }else{
	prev_first_line=songs[status.song_idx].sections[status.number-1].trim().replace(/\n.*/gi,"")
    }
    if (status.number+1==currentSectionCount) {
	nxt_first_line="Dal utáni logó";
    }else{
	nxt_first_line=songs[status.song_idx].sections[status.number+1].trim().replace(/\n.*/gi,"")
    }
    adjustFontSize()
  }
  send_content(innerContainer.innerHTML)

  lc.song_conv(songs[status.song_idx])//swich back
    }catch(error){
	process.stdout.write(error.message+" "+"=ERR sr\n")
    }
  //process.stdout.write(prev_first_line+"\n"+nxt_first_line+"\n")
}
const getTalkImage=()=>{
  if (!('images' in status.talk)){return "-";}
  if (status.talk.images.length <= status.talk.imageIdx){return "-";}
  if (0 > status.talk.imageIdx){return "-";}
  res = status.talk.images[status.talk.imageIdx];
  if (res=="") return "-"
  return res;
}
const renderTalkImage=()=>{
  if (getTalkImage() != "-") {
    talkContainer.style.width="100%"
    talkContainer.style.height="100%"
    talkContainer.style.backgroundImage = `url(`+path.join(config.images_dir, getTalkImage())+`)`
    talkTitle.innerText = ''
    talkName.innerText = ''
  } else {
	//talkContainer.innerHTML=talkContainer.innerHTML.replace(/|.*/gi,"")
	/*talkContainer.innerHTML=`
      <div id='talkTitle'></div>
      <div id='talkName'></div>
      <audio id='tmAudio'></audio>
	`*/
    talkContainer.style.backgroundImage = ''
    talkTitle.innerText = status.talk.title
    talkName.innerText = status.talk.name
  }
}
const renderTalk = () => {
  outerContainer.style.display = 'none'
  talkContainer.style.display = 'flex'

  ipcRenderer.send('to_set_audioevent','stop')
  hideVideo();
  if (status.talk.music !== NOMUSIC) {
    if (!status.talk.isVideo){
	tmAudio.src = path.join(config.talkmusic_dir,status.talk.music)
    }else{
	tmVideoSrc.src = path.join(config.video_dir,status.talk.music)
	//tmVideoSrc.type="video/mp4";
    }
  }else{
    tmAudio.src =''
    tmVideoSrc.src =''
  }

  // if (status.talk.image !== NOIMAGE) {

  // }
  renderTalkImage();
}
const sleapAndPlay=()=>{
    waiting=1
    setTimeout(()=>{
	playNext()},1000*config.sleap_length)
}
const playNext=()=>{
    
    if (waiting==1 && status.music !== NOMUSIC) {
      m0=status.music.replace(/^.*[\\\/]/, '');
      idx=0;
      while (musics[idx]!=m0){
	idx+=1
      }
      idx+=1;
      if (idx==musics.length){
	idx=0
      }
      status.music = path.join( config.music_dir,musics[idx])
      tmAudio.src = status.music;
      tmAudio.currentTime = 0
      tmAudio.play()
      ipcRenderer.send('to_set_audioevent','start:'+tmAudio.currentTime+':'+tmAudio.duration)
      send_status()
    }

}
const videoend=()=>{
  renderThanks();
}
const audioend=()=>{
  ipcRenderer.send('to_set_audioevent','stop')
  if (status.state==='talk'){
    renderThanks();
  }else if (status.state==='music' && status.autoplay==1){
    ipcRenderer.send('to_set_audioevent','waiting')
	sleapAndPlay();
  }
}

const renderThanks = () => {

  if (status.state==='talk'){
      if (status.talk.thanks.id==-1) {return;}

  talkContainer.style.display = 'none'
  outerContainer.style.display = 'flex'

  let thanksText = thanks.get(status.talk.thanks.id,lc.is_lent_now())
    process.stdout.write(global.lent_force+" ==global.lent_force Y\n")
    process.stdout.write(lc.is_lent_now()+" ==lc.is_lent_now\n")

  for (let i = 0; i < status.talk.thanks.names.length; i++) {
    thanksText = thanksText.replace(`%name${i}%`, status.talk.thanks.names[i])
  }

  innerContainer.textContent = thanksText

  adjustFontSize()
  }
}
tmAudio.addEventListener('ended', audioend)
tmVideo.addEventListener('ended', videoend)
window.audioend = audioend

/*document.body.addEventListener('keydown', e => {
  if (e.key === 'T' && e.ctrlKey && e.shiftKey) {
    renderThanks()
  }
})*/

let previousRemoteAddress = ''
let previousActionTime = 0
function send_content(content){
    ipcRenderer.send('to_set_content',content)
}
function send_status(){
    ipcRenderer.send('to_set_status',status)
}
function send_flines(){
    ipcRenderer.send('to_set_flines',[prev_first_line,nxt_first_line])
}
server.subscribe((m, ws) => {
  if (
    ws._socket.remoteAddress !== previousRemoteAddress &&
    Date.now() - previousActionTime < 3000
  ) {
    return
  }

  previousRemoteAddress = ws._socket.remoteAddress
  previousActionTime = Date.now()

  handleMessage(m,ws)
  if (status.state === 'song') {
    //talkImageContainer.innerHTML=''
    renderSong()
  } else {
    imageContainer.innerHTML =''
    nxt_first_line="N/A"
    prev_first_line="N/A"
    if (status.state === 'talk' && m !== 'PLAY:' && m !== 'THANKS:') {
      renderTalk()
    } else if (status.state === 'music'){
    //talkImageContainer.innerHTML=''
      outerContainer.style.display = 'none'
      talkContainer.style.display = 'none'
    }
  }
  server.broadcast("PRFL:"+removetags(prev_first_line))
  server.broadcast("NXTFL:"+removetags(nxt_first_line))
  send_status();
  send_flines();
})

function specthanks(mode,name){
    try{
    status.state = 'song'
    status.number = 0
    //status.title = name
    //status.song_idx=1*st.split('×')[1]
    if (mode=='1'){
	title="Köszönjük 1"
	status.name1=name
    }else if (mode=='2'){
	title="Köszönjük 2"
	status.name1=name
    }else{
	title="Köszönjük páros"
	status.name1=name.split('|')[0]
	status.name2=name.split('|')[1]
    }
    status.title=title
    i=0;
    while (songs[i].titles[0]!=title){i++}
    status.song_idx=i
	process.stdout.write(i+" "+songs[i].titles+"\n")
    }catch(error){
	process.stdout.write(error.message+" "+i+" "+"=ERRst\n")
    }
}

//process.stdout.write(status.music)
ipcRenderer.on('to_m_refr', function (event, arg){
    refreshdb()
})
ipcRenderer.on('to_m_lent', function (event, arg){
    global.lent_force=arg
})
ipcRenderer.on('refreshdb', function (ev, data) {
  refreshdb()
  process.stdout.write('Refreshing...'+'\n')
})
process.stdout.write("12\n")
