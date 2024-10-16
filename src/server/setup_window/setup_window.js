shell = require('shelljs');
cfn=require('./conv_fname')
lc=require('./lent_conv')
pauseable=require('pauseable')
is=require('./importsong')
so=require('./songorder')
config=require('../config')
path=require('path')
fs=require('fs')
qrcode=require('qrcode')
let talks = require(config.talks_path)
const ipcRenderer = require('electron').ipcRenderer
const sofname=config.songorder_path
let timer=pauseable.setTimeout(()=>{},0);
let sidetimer=0
async function makeQR(ip){
    const res = await qrcode.toDataURL("http://"+ip);
    document.getElementById('adressqr').innerHTML=`<img src="${res}">`
}
process.stdout.write('BEEP\n')

function get_all_title_set(){
    //delete require.cache[path.join(setup.path_prefix,"songs.js")]
    songs=require('../songs')
    title_list=songs.map((x)=>
	{
	    return x.titles//.map(y=>y.toLowerCase())
	}).filter((x)=>x[0][0]<'0'||x[0][0]>'9').flat()
    st={}
    songs.forEach((x)=>{
	x.titles.forEach((y)=>{
	    y=y.toLowerCase().replace(/[\s,\.]/gi,"")
	    if (st.hasOwnProperty(y)){
		process.stdout.write(y+" : '"+ x.fn+"' '"+st[y]+ "'\n");
	    }
	    st[y]=x.fn
	})
    });
    return st;
}


searcher=require("./searcher")
title_set=get_all_title_set();
var title_list;
function search(){
    try{
    searchInput=document.getElementById("searchInput")
    searchOut=document.getElementById("searchOut")
    phrase=searchInput.value
    searchOut.innerText=searcher.title_search(title_list,phrase,"mid-loose").join("\n")
    }catch(err){
    process.stdout.write(err.message);
    }
}
function getSongList(){
    lines= (fs.readFileSync(sofname).toString()).split('\n')
    //while (lines[lines.length-1]==""){lines.pop()}
    comm=""
    for (i=0; i<lines.length-1;++i){
      if (lines[i][0]=="#") {
	if (comm!=""){
	  lines[i][0]="|"
	  lines[i]=comm+"<br/>"+lines[i];
	}
        comm=lines[i];
        lines[i]="";
        /*lines[i+1]=lines[i]+"<br/>"+lines[i+1]
        lines[i]=""
         ++i;*/
      }else{
	if (comm!=""){
	  lines[i]=comm+"<br/>"+lines[i];
	}
	comm="";
      }
      
    }
    //get_to_from();
    return lines.filter((x)=>x!="")
}

var songOrderlist=getSongList()
var to=-1
var from=999
function get_to_from(){
  to=-1
  from=999
  fs.readdirSync(config.song_dir).forEach((filename)=> {
    if ('0'<=filename[0] && filename[0]<='9'){
      i=1*filename.substring(0,3)
      if (i>to){
	to=i
      }
      if (i<from){
	from=i
      }
    }
  })
} 
get_to_from();

function showSongorderList(){
    process.stdout.write(from+" "+to+"\n");
    strin=""
    str="<ol>"
    for (i=0; i<songOrderlist.length;++i){
      strin+=songOrderlist[i].replace(/<br\/>/g,"\n")+"\n"
      if (i+1>=from && i<to){
        str+="<li> <b>"+songOrderlist[i]+"</b> </li>"
      }else{
        str+="<li>"+songOrderlist[i]+"</li>"
      }
    }
    str+="</ol>"
    document.getElementById('PsongorderList').innerHTML=str
    document.getElementById('songorderIn').innerHTML=strin
    document.getElementById('so_to').max=songOrderlist.length
    document.getElementById('so_to').min=1
    document.getElementById('so_to').value=songOrderlist.length
    document.getElementById('so_from').value=1
    document.getElementById('so_from').min=1
    document.getElementById('so_from').max=songOrderlist.length
}


function songordercall(){
  from=parseInt(document.getElementById('so_from').value)
  to=parseInt(document.getElementById('so_to').value)
  if (from>to) {
    return
  }
  fails=so.songorder(from,to,songOrderlist.map((x)=>x.replace(/.*<br\/>/,(x)=>{return `{${x}}`})))
  //process.stdout.write("Failed:"+fails+'\n')//TODO show user
    process.stdout.write(from+" "+to+"\n");
  showSongorderList()
  refreshdb()
}
const ef=require('./existfinder')
function importcall(){
    ex=ef.exsist_list(config.songinport_dir);
    if (ex.length > 10){
	ex=ex.slice(0,10)+" és "+ ex.length-10 +" másik"
    }
    if (confirm('Biztos vagy benne? Ezzel fellülírhatod a már kijavított dalokat ha hibás verziók vannak a"'+config.songinport_dir+'"mappában\n'+"a következő fileok az érintettek:\n"+ex)){
	try{
	is.importsong(config.songinport_dir,title_set)
	}catch(err){
	    process.stdout.write(err.message)
	}
	refreshdb()
	title_set=get_all_title_set();
    }
}
/*function validate(name){
      isgood=false
    fn=cfn.conv_fname(name)
      fs.readdirSync(config.song_dir).forEach((filename)=> {
    if (fn==filename){
      isgood=true}
      })
      return isgood;
}*/
function exportsongorder(){
    warnings=[]
    data=document.getElementById('songorderIn').value//.replace(/\n\s*\n*/,"\n")
    fs.writeFile(sofname, data, (err) => {
	if (err) throw err;
	//to=from=0;
        songOrderlist=getSongList()
	showSongorderList();
    })
}
function insert_nth_line(ins,x,p){
    l=0
    i=0
    while (l!=x){
	if (ins[i]=='\n'&&ins[i+1]!='#'&&ins[i+1]!="|")++l
	++i
    }
    return [ins.slice(0, i), p, ins.slice(i)].join('');
}
function set_satus_music(status){
    document.getElementById("music_params").style.display='inline'
    document.getElementById('music_title').innerText=status.music
    if (status.autoplay)
	document.getElementById('music_auto').innerText="Auto"
    else
	document.getElementById('music_auto').innerText="Not Auto"
}
function set_satus_talk(status){
    document.getElementById("talk_params").style.display='inline'
    const thidx=status.talk.thanks.id
    let thanks="Páros"
    if (thidx==0)thanks="Hála néked..."
    if (thidx==1)thanks="Köszönjük néked..."
    if (thidx==-1)thanks="Nincs"
    document.getElementById('talk_title').innerText=status.talk.title
    document.getElementById('talk_name').innerText=status.talk.name
    document.getElementById('talk_music').innerText=status.talk.music
    document.getElementById('talk_image').innerText=status.talk.images[0]
    document.getElementById('talk_thanks').innerText=thanks+'\n'+status.talk.thanks.names
}
function set_satus_song(status){
    document.getElementById("song_params").style.display='inline'
    document.getElementById("song_title_idx").innerText=status.title.split('#')[0].trim()+" - "+status.song_idx
    document.getElementById("song_num").innerText=status.number
}
process.stdout.write("----1\n")
ipcRenderer.on('to_s_flines', function (event, arg){
    document.getElementById('song_prev_first_line').innerHTML=arg[0]
    document.getElementById('song_nxt_first_line').innerHTML=arg[1]
})
process.stdout.write("----2\n")
let dur=0
let cur=0
ipcRenderer.on('to_s_audioevent', function (event, arg){
    process.stdout.write('to_s_audioevent'+arg+'\n')
    try{
    talk_music_state=document.getElementById('talk_music_state')
    //talk_music_time=document.getElementById('talk_music_time')
    if (arg.startsWith('start')){
	talk_music_state.innerText="Megy ▶";
	cur=arg.split(':')[1]
	d=arg.split(':')[2]
	if (d==dur){
	    timer=pauseable.setTimeout(()=>{},(dur-cur)*1000)
	    sleepuntil(dur-cur)
	}
    }else if ('stop'==arg){
	talk_music_state.innerText="Áll ⏹";
	cur=timer.next()/1000
	get_times(0)
	try{
	sidetimer.clear()
	timer.clear()
	}catch(error){}
    }else if ('pause'==arg){
	talk_music_state.innerText="Szünetel ⏸";
	try{
	sidetimer.pause()
	timer.pause()
	}catch(error){}
    }else if ('waiting'==arg){
	talk_music_state.innerText="Vár ...";
	dur=config.sleap_length
	cur=0
	timer=pauseable.setTimeout(()=>{},(dur-cur)*1000)
	sleepuntil(dur-cur)
    }else if (arg.startsWith('dur:')){
	dur=arg.split(':')[1]
	if (talk_music_state.innerText.startsWith('Megy')){
	    timer=pauseable.setTimeout(()=>{},(dur-cur)*1000)
	    sleepuntil(dur-cur)
	} else if (talk_music_state.innerText.startsWith('Áll')){
	    get_times(0)
	}
    }
    document.getElementById('music_state').innerText=talk_music_state.innerText;
    }catch (err){
process.stdout.write(err.message+"\n")
    }
    //document.getElementById('music_time').innerText=talk_music_time.innerText;
})
ipcRenderer.on('to_s_content', function (event, arg){
    document.getElementById('song_content').innerHTML=arg.replace(/\n/gi,'<br/>')
})
ipcRenderer.on('to_s_status', function (event, arg){
    document.getElementById("talk_params").style.display='none'
    document.getElementById("song_params").style.display='none'
    document.getElementById("music_params").style.display='none'
    process.stdout.write('setup got status\n')
    if (arg.state=="talk")
	set_satus_talk(arg)
    if (arg.state=="music")
	set_satus_music(arg)
    if (arg.state=='song')
	set_satus_song(arg)
})
function newsongorder(){
    process.stdout.write("XXX\n")
    try{
	lines=document.getElementById('songorderIn').value.split('\n')
	pandw=so.getsongorder(lines.filter((x)=>x[0]!="#"))
	problems=pandw.fails
	warnings=pandw.warnings
    /*
      problems+=lines[i]+"("+(i+1)+". sor)<br/>"
      */
	if (problems.length!=0){
	    //problems_b=problems.map((x)=>x+"<br/>")
	    document.getElementById('errors').innerHTML=''+problems.length+"Ismeretlen dal<br/>"
	    for (j=0; j<problems.length;++j){
		document.getElementById('errors').innerHTML+=problems[j].join(' ')+'<br/>'
		document.getElementById('songorderIn').value=insert_nth_line(document.getElementById('songorderIn').value,problems[j][2],'     ==========>')
	    }
	}else{
	    document.getElementById('errors').innerHTML=warnings.join('<br/>')
	    exportsongorder()
//XXX
	}  
    }catch(error){
	process.stdout.write(error.message+"=ERRXX\n")
    }
    //refreshdb()
    process.stdout.write("XXX\n")
    songordercall()
}
var WebSocket = require('ws')

function refreshdb(){
    try{
	ipcRenderer.send('to_main_refr','')
    }catch(error){
	process.stdout.write(error.message+"(errrefresh)\n")
    }
}
let isopen=false

ip= '0.0.0.0';
if (config.server_on){
ip = Object.values(require("os").networkInterfaces()).
  flat().
  filter((item) => !item.internal && item.family === "IPv4").
  find(Boolean).address
}
vs=require('./vilagsarkai')
function makeplaces(){
    lines=document.getElementById('vilagsarkok').value.split('\n')
    vs.makesong(lines)
    refreshdb()
}
function move_talk(from,to){
    process.stdout.write(from+" "+to+"\n")
    if (to<0) {to=0}
    if (to>=talks.length){
	to=talks.length-1
    }
    if (to>from){
	tmp=talks[to]
	talks[to]=talks[from]
	i=to
	while (i>from){
	    ttmp=talks[i-1]
	    talks[i-1]=tmp
	    tmp=ttmp
	    i--
	}
    }else{
	tmp=talks[to]
	talks[to]=talks[from]
	i=to
	while (i<from){
	    ttmp=talks[i+1]
	    talks[i+1]=tmp
	    tmp=ttmp
	    i++
	}
    }
    process.stdout.write(from+" "+to+"\n")
    json_new=format_json(JSON.stringify(talks))
    fs.writeFileSync(config.talks_path,json_new);
    make_talk_inputs()
    refreshdb();
}
function get_file_names(path){
  musics=["-"]
  fs.readdirSync(path).forEach((file)=> {musics.push(file)})
  return musics
}
let music_names=get_file_names(config.talkmusic_dir);
let video_names=get_file_names(config.video_dir);
process.stdout.write(music_names+"\n")


function make_talk_musics(selected,isVideo){
  res="";
  names=isVideo?video_names:music_names
  for (_i=0; _i!=names.length; _i++){
    res+=`<option value='${names[_i]}' ${names[_i]==selected?"selected":""}>${names[_i]}</option>`;
  }
  return res;
}
function make_talkinput_html_iner(title,name,images,music,thankid,thanknames,num,paird,isVideo){
    try{
    if (paird===undefined) paird=thanknames.length==2
    if (images===undefined) images=["-"]
    image=images.join(" ")
    if (paird && thanknames.length==1) thanknames.push("")
    title=title.replace("\n","\\n")
    //old_music=`<label for="music${num}">Zene:</label><input id="music${num}" type="text" value="${music}"style="width:60px;">`
    return `<label for="title${num}">Cím:</label><input id="title${num}" type="text" value="${title}">
	<label for="paird${num}">Páros?:</label><input id="paird${num}" type="checkbox" ${paird?"checked":""} onclick=sw.refresh_talk(${num});>
	<label for="name${num}">${paird?"Nevek":"Név"}:</label><input id="name${num}" type="text" value="${name}"style="width:${paird?120:60}px;">
	<label for="image${num}">Kép:</label><input id="image${num}" type="text" value="${image}"style="width:60px;"> 
	<label for="isVideo${num}">Video?:</label><input id="isVideo${num}" type="checkbox" ${isVideo?"checked":""} onclick=sw.refresh_talk(${num});>
	<label for="music${num}">${isVideo?"Video:":"Zene:"}</label><select id=music${num} value=${music} style="width: 150px;">`+
	make_talk_musics(music,isVideo)
	+`</select>
	<label for="thankid${num}">Köszönjük típus:</label><select id="thankid${num}" value="${thankid}">
	    ${!paird?`<option value=0 ${0==thankid?"selected":""}>Hála néked...</option>
	     <option value=1 ${1==thankid?"selected":""}>Köszönjük néked...</option>
	     <option value=-1 ${-1==thankid?"selected":""}>nincs</option>`:
	    `<option value=2 ${2==thankid?"selected":""}>páros</option>
	     <option value=-1 ${-1==thankid?"selected":""}>nincs</option>`}
	</select>
	<label for="thanknames${num}1">${paird?"Nevek":"Név"} a köszönjükbe:</label><input id="thanknames${num}1" type="text" style="width:60px;" value="${thanknames[0]}">
	${paird?`<input id="thanknames${num}2" style="width:60px;" type="text" value="${thanknames[1]}">`:""}
    <input type="submit" value="Ok">
    <input type="button" value="reset" onclick=sw.reset_talk(${num})>
    <input type="button" value="⇈" onclick=sw.move_talk(${num},0)>
    <input type="button" value="⇑" onclick=sw.move_talk(${num},${num}-1)>
    <input type="button" value="⇓"onclick=sw.move_talk(${num},${num}+1)>
    <input type="button" value="⇊" onclick=sw.move_talk(${num},1000)>
    <input type="button" value="🗑" onclick=sw.delete_talk(${num})>
    `
    }catch(error){
	process.stdout.write(error.message+"\n"+num+"\n")
	throw error;
    }
}

function delete_talk(idx){
    move_talk(idx,1000)
    talks.pop()
    refreshdb()
    make_talk_inputs()
}
function make_talkinput_html(title,name,images,music,thankid,thanknames,num,isVideo){
    paird=thanknames.length==2
    if (images===undefined) images=["-"]
    image=images.join(" ")
    return `<form id="talk_form${num}" onsubmit="sw.submit_talk(${num})">
	${make_talkinput_html_iner(title,name,images,music,thankid,thanknames,num,paird,isVideo)}
	</form><br>`
}
function format_json(str){
    res=""
    indent=0
    in_str=0
    for (i=0; i!=str.length;++i){
	if (str[i]=='"') in_str=1-in_str
	if (str[i]=='}' && !in_str){
	    --indent
	    res+="\n"
	    for (j=0; j!=indent;++j) res+="  "
	}
	res+=str[i]
	if (in_str) continue
	if (str[i]==':')res+=" "
	if (str[i]=='{'){
	    ++indent
	    res+="\n"
	    for (j=0; j!=indent;++j) res+="  "
	}
	if (str[i]==','){
	    res+="\n"
	    for (j=0; j!=indent;++j) res+="  "
	}
    }
    return res;
}
function submit_talk_nonrefr(num){
    image=document.getElementById(`image${num}`).value
    music=document.getElementById(`music${num}`).value
    talks[num].isVideo=document.getElementById(`isVideo${num}`).checked
    images=image.split(" ")
    try{
	for (_j=0; _j!=images.length; ++_j){
	    img=images[_j]
	    if (img!="-")
		fs.accessSync(path.join(config.images_dir,img))
	}
	if (music!="-")
	    fs.accessSync(path.join(talks[num].isVideo?config.video_dir:config.talkmusic_dir,music))
    }catch(err){
	process.stdout.write(err.message+" "+document.getElementById(`music${num}`).innerHTML+"\n")
	alert(`Hibás a kép vagy a zene filenév győződj meg hogy a "${config.images_dir}" illetve a "${config.talkmusic_dir}"/"${config.video_dir}" mappában vannak ('-' jelzi hogy nincs)`)
        return false;
    }
    talks[num].title=document.getElementById(`title${num}`).value.replace("\\n","\n")
    paird=document.getElementById(`paird${num}`).checked
    talks[num].name=document.getElementById(`name${num}`).value
    talks[num].images=images
    //document.getElementById(`image${num}`).value
    talks[num].music=document.getElementById(`music${num}`).value
    talks[num].thanks.id=document.getElementById(`thankid${num}`).value
    talks[num].thanks.names=[document.getElementById(`thanknames${num}1`).value]
    if (paird){
	talks[num].thanks.names.push(document.getElementById(`thanknames${num}2`).value)
    }
    return true;
}
function submit_talk(num){
    if (submit_talk_nonrefr(num)){
    json_new=format_json(JSON.stringify(talks))
    fs.writeFileSync(config.talks_path,json_new);
    refreshdb()
    return true;
    }else {
	return false
    }
}
function reset_talk(num){
    t=talks[num]
    document.getElementById(`talk_form${num}`).innerHTML=
	make_talkinput_html_iner(t.title,t.name,t.images,t.music,t.thanks.id,t.thanks.names,num,undefined,t.isVideo)
}
function refresh_talk(num){
    //talks = require(config.talks_path)
    try{
    paird=document.getElementById(`paird${num}`).checked
    isVideo=document.getElementById(`isVideo${num}`).checked
    t=talks[num]
    document.getElementById(`talk_form${num}`).innerHTML=
	make_talkinput_html_iner(t.title,t.name,t.images,t.music,t.thanks.id,t.thanks.names,num,paird,isVideo)
    }catch(error){
	process.stdout.write(error.message+"\n"+num+"\n")
    }
}
function make_talk_inputs(){
    //talks = require(config.talks_path)
    res=""
    for (i=0; i!=talks.length;++i){
	iprev=i;
	t=talks[i]
	res+=make_talkinput_html(t.title,t.name,t.images,t.music,t.thanks.id,t.thanks.names,i,t.isVideo)
    }
    document.getElementById("talklist").innerHTML=res
}
function refresh_delay(){
    
}
function ok_all(){
    all=true
    for (i=0; i<talks.length;++i){
	all=all && submit_talk_nonrefr(i);
    }
    if (all) {

    json_new=format_json(JSON.stringify(talks))
    fs.writeFileSync(config.talks_path,json_new);
    refreshdb()
    }
    return all
}
function new_talk(){
    t={
	title:"Alapcím"+talks.length,
	name:"-",
	music:"-",
	images:["-"],
	isVideo:false,
	thanks:{id:0,names:["-"]}
    }
    talks.push(t)
    json_new=format_json(JSON.stringify(talks))
    fs.writeFileSync(config.talks_path,json_new);
    refreshdb()
    make_talk_inputs()
}
function sleepuntil(secs){
    delay=timer.next()-(secs-1)*1000
    get_times(Math.floor(dur-secs))
    if (secs>0){
	sidetimer=pauseable.setTimeout(()=>{sleepuntil(secs-1)},delay)
    }
}
function get_times(c) {
    document.getElementById('talk_music_time').innerText= c+":"+Math.floor(dur);
    document.getElementById('music_time').innerText= c+":"+Math.floor(dur);
}
function init_vs(){
    try{
    document.getElementById('vilagsarkok').value=vs.get_items().join('\n')
    }catch(error){
	process.stdout.write(error.message+"\n")
    }
} 
function init(){
    make_talk_inputs()
    init_vs()
    showSongorderList()
    makeQR(''+ip+':'+config.port)
    document.getElementById('adresslabel').innerHTML="csatlakozz a "+ip+(config.port==80?"":":"+config.port)+" címhez a 'távirányító' telefon(ok)kal"
    //document.getElementById('delay_time').value=config.sleap_length;
}
//init()

function lent_change(){
    arr=['auto','to_on','to_off']
    global.lent_force=arr[document.getElementById('lent_force').value]

    ipcRenderer.send('to_main_lent',global.lent_force)
}


process.stdout.write("----0\n")

// Path to the local repository
const repoPath = config.git_path;

process.stdout.write("----1\n")
async function pullChangesFromUpstream() {
process.stdout.write("CALLED.\n");
  try {
    // Open the local repository
    const repo = await nodegit.Repository.open(repoPath);

    // Get the current branch
    const branchRef = await repo.getCurrentBranch();
    const branchName = branchRef.shorthand();

    process.stdout.write(`Currently on branch: ${branchName}\n`);

    // Fetch from the 'upstream' remote
    const remote = await nodegit.Remote.lookup(repo, "NT-prez");
    process.stdout.write("Fetching from upstream...");
    await remote.fetch(["refs/heads/master:refs/remotes/upstream/master"], {
      callbacks: {
        credentials: () => {
          return nodegit.Cred.userpassPlaintextNew("username", "password"); // Adjust as necessary
        },
        certificateCheck: () => 1, // Skip certificate checks (for testing)
      },
    });
    process.stdout.write("Fetch completed.");

    // Get the upstream branch reference
    const upstreamBranch = await repo.getBranch("refs/remotes/upstream/master");

    // Merge the upstream/master into the current branch
    process.stdout.write("Merging upstream/master...");
    await repo.mergeBranches(branchName, upstreamBranch, nodegit.Signature.now("HBotondI", "horvath.botond.istvan@gmail.com"));

    process.stdout.write("Merge completed.");

  } catch (error) {
    process.stdout.write("Error during pull operation:"+ error);
  }
}

// Call the function to pull changes


function updateGit(){
    process.stdout.write("PUSHED.");
    try{
    if(shell.which('git')){
	try{
	    s=shell.pwd()
	    if (s.endsWith("win32-x64")){
		shell.cd("resources")
		shell.cd("app")
	    }
	    s=shell.pwd()
	    aa=shell.exec('git pull')
	    process.stdout.write(s+"\n");
	    process.stdout.write(aa+"\n");
	    /*if (out=="Already up to date.\n"){
		process.stdout.write("No new thing was found\n")
	    }else{
		process.stdout.write("updated\n")
	    }*/
	} catch (error) {
	    process.stdout.write("Error during pull operation:"+ error);
	}
	process.stdout.write("Done");
    }else{
	process.stdout.write("ERROR, no git\n");
    }
	} catch (error) {
	    process.stdout.write("Error during pull operation:"+ error);
	}
    //pullChangesFromUpstream();
}
module.exports={updateGit,delete_talk,move_talk,search,ok_all,new_talk,init,refreshdb,songordercall,lent_change,importcall,newsongorder,makeplaces,reset_talk,refresh_talk,submit_talk}
