config=require('../config')
const ipcRenderer = require('electron').ipcRenderer
const fs = require('fs') 
path=require('path')
songList=require('../songs').filter((val)=>
    !('0'<=val.fn[0] && val.fn[0]<='9'))

function reloadSongs(){
    delete require.cache[path.join(config.path_prefix,"songs.js")]
    songList = require('../songs.js')
}
titleCont=document.getElementById('TitleList')
titleCnt=0
verseCont=document.getElementById('VerseList')
verseCnt=0
lentVerseCont=document.getElementById('LentVerseList')
lentVerseCnt=0
loadedSong={
    titles: [],
    sections: [],
    lent_sections: [],
    fn:""
}
function loadSong(){
    let el=document.getElementById('SongChooser')
    lst=el.value.split(':')
    if (isNaN(lst[0]*1)){
	alert("Invalid song chooice, please select from list")
	return;
    }else{
	let idx=lst[0]*1
	let potentionalSong=songList[idx]
	let titleForCheck=`${idx}: ${getConcatedTitles(potentionalSong)}`
	if (titleForCheck == el.value){
	    loadedSong.titles=[...potentionalSong.titles]
	    loadedSong.sections=[...potentionalSong.sections]
	    if (potentionalSong.hasOwnProperty('lent_sections')){
		loadedSong.lent_sections=[...potentionalSong.lent_sections]
	    }else{
		loadedSong.lent_sections=[]
	    }
	    loadedSong.fn=potentionalSong.fn
	    titleCnt=loadedSong.titles.length
	    verseCnt=loadedSong.sections.length
	    lentVerseCnt=loadedSong.lent_sections.length
	    displayContents()
	}else{
	    alert("Invalid song chooice, please select from list")
	}
    }
}
function getConcatedTitles(song){
    value="";
    for (j=0; j<song.titles.length; j++){
	if (j!=0){
	   value+=" / "
	}
	value+=song.titles[j]
    }
    return value;
}
function init(){
    newSong()
    titleList=document.getElementById('titleList')
    for (i=0; i<songList.length;i+=1){
	/*if ('0'<=songList[i].fn[0] && songList[i].fn[0]<='9'){
	    continue;
	}*/
	var opt = document.createElement('option')
	opt.value=`${i}: ${getConcatedTitles(songList[i])}`
	titleList.appendChild(opt)
    }
    //process.stdout.write(titleList.innerHTML+'=ihtml\n')
}
function displayContents(){
    setContents(loadedSong.sections,verseCnt,'Verse',true);
    setContents(loadedSong.lent_sections,lentVerseCnt,'LentVerse',true);
    setContents(loadedSong.titles,titleCnt,'Title',false);
}
function newSong(){
  loadedSong={
    titles: [''],
    sections: [''],
    lent_sections: [],
    fn:""
  }
  titleCnt=1
  verseCnt=1
  displayContents()
}
function saveSongAs(){
    loadedSong.fn=""
    saveSong()
}
function generateFN(){
    title0=loadedSong.titles[0].toLowerCase()
		.replace(/[\s,\.-]*/gi,"")
		.replace(/[óöő]/gi,'o')
		.replace(/[űúü]/gi,"u")
		.replace(/[á]/gi,"a")
		.replace(/[í]/gi,"i")
		.replace(/[é]/gi,"e")
		.replace("/","")
		.replace(":","")
		.replace("\\","")
    if ('0'<=title0[0] && title0[0]<='9'){
	title0='A'+title0
    }
    candidate=title0+".js"
    let i=0
    while (songList.find((v)=>v.fn==candidate)){
	candidate=title0+`${i}.js`
	i+=1
    }
    return candidate;
}
function convTitle(orig){
    return orig.toLowerCase().replace(/[\s,\.-]*/gi,"")
}
function getTitleSet(expectFn){
    s= new Set();
    songList.filter((v)=>v.fn!=expectFn)
	    .forEach((v)=>v.titles.forEach((t) => s.add(convTitle(t))))
    return s
}
function checkTitles(){
    ts=getTitleSet(loadedSong.fn);
    process.stdout.write(ts.size+"\n")
    for (i=0; i<loadedSong.titles.length; i+=1){
	title=convTitle(loadedSong.titles[i])
	if (ts.has(title)){
	    return loadedSong.titles[i]
	}
    }
    return ""
}
function saveSong(){
    process.stdout.write("Save start\n")
    try{
	getAllContents();
    if (loadedSong.titles.length==0){
	alert("Must hava a title")
	return;
    }
    if (loadedSong.titles.filter((v)=>v.trim()=="").length!=0){
	alert("Title can't be empty")
	return;
    }
    const ct=checkTitles()
    if (ct!=""){
	alert(`Title '${ct}' already exsists`)
	return
    }
    if (loadedSong.fn==''){
	loadedSong.fn=generateFN();
    }else{
	process.stdout.write(loadedSong.fn)
    }
	fullOutFile=path.join(config.song_dir,loadedSong.fn)
	data="module.exports = {\n"
	data+="    titles: ["
	loadedSong.titles.forEach((v)=>data+=`\`${v.replace('`',"'")}\`, `)
	
	data=data.substr(0,data.length-2)
	data+="],\n"
	data+="    sections: ["
	loadedSong.sections.forEach((v)=>data+=`\n\`${v.replace('`',"'")}\`, `)
	data=data.substr(0,data.length-2)
	data+="]\n"
	if (loadedSong.lent_sections.length>0){
	    data+=",\n    lent_sections: ["
	    loadedSong.lent_sections.forEach((v)=>data+=`\n\`${v.replace('`',"'")}\`, `)
	    data=data.substr(0,data.length-2)
	    data+="]\n"
	}
	data+="}"
	process.stdout.write(data+"\n")
	fs.writeFile(fullOutFile, data, (err) => {       

	    if (err) throw err; 
	    try{
	    reloadSongs();//TODO: give info to other windows
	    process.stdout.write(fullOutFile+"\n")
	    ipcRenderer.send('to_setup_refr')
    }catch(err){
	process.stdout.write(err+"\n")
    }
	    //ipcRenderer.send('to_main_refr')
	}) 
	//fs.
    }catch(err){
	process.stdout.write(err+"\n")
    }

}
function cancel(){
    window.close()
}

function addVerse(){
    loadedSong.sections=getContents('Verse',verseCnt)
    verseCnt+=1
    loadedSong.sections.push('');
    setContents(loadedSong.sections,verseCnt,'Verse',true);
}
function addLentVerse(){
    loadedSong.lent_sections=getContents('LentVerse',lentVerseCnt)
    lentVerseCnt+=1
    loadedSong.lent_sections.push('');
    setContents(loadedSong.lent_sections,lentVerseCnt,'LentVerse',true);
}
function addTitle(){
    loadedSong.titles=getContents('Title',titleCnt)
    titleCnt+=1
    loadedSong.titles.push('');
    setContents(loadedSong.titles,titleCnt,'Title',false);
}

function delVerse(){
    if (verseCnt==0) return;
    verseCnt-=1
    loadedSong.sections=getContents('Verse',verseCnt)
    setContents(loadedSong.sections,verseCnt,'Verse',true);
}
function delLentVerse(){
    if (lentVerseCnt==0) return;
    lentVerseCnt-=1
    loadedSong.lent_sections=getContents('LentVerse',lentVerseCnt)
    setContents(loadedSong.lent_sections,lentVerseCnt,'LentVerse',true);
}
function delTitle(){
    if (titleCnt==0) return;
    titleCnt-=1
    loadedSong.titles=getContents('Title',titleCnt)
    setContents(loadedSong.titles,titleCnt,'Title',false);
}

function setContents(from,cnt,to,isBigInput){
    try{
    mainDoc=document.getElementById(`${to}List`)
    mainDoc.innerHTML="";
    for (num=0; num<cnt; num+=1){
	if (isBigInput){
	    mainDoc.innerHTML+=`<br><textarea rows="8" cols="40" id="${to}Input${num}">${from[num]}</textarea>`
	}else{
	    mainDoc.innerHTML+=`<br><input id="${to}Input${num}" value="${from[num]}">`
	}
    }
    }catch(err){
	process.stdout.write(err+"\n");
    }

}
function getAllContents(){
    loadedSong.sections=getContents('Verse',verseCnt)
    loadedSong.lent_sections=getContents('LentVerse',lentVerseCnt)
    loadedSong.titles=getContents('Title',titleCnt)
}
function getContents(from,cnt){
    to=[]
    for (num=0; num<cnt; num+=1){
	doc=document.getElementById(`${from}Input${num}`);
	to.push(doc.value)
    }
    return to;
}

module.exports={
    delVerse,delLentVerse,delTitle,
    addVerse,addLentVerse,addTitle,
    init,cancel,saveSong,newSong,loadSong
}
