
cfn=require('./conv_fname')
const fs = require('fs') 
const path = require('path')
config=require('../config')
const folder = config.song_dir
lc=require('./lent_conv')

function getsongorder(lines){
  fails=[]
  warnings=[]
  keys=[]
  fnames={}
  titles={}
  fs.readdirSync(folder).forEach((file)=> {
    try{
      sng=require(path.join(folder,file))
      tmp=sng.titles
      for (j=0;j<tmp.length;++j){
	keys.push(tmp[j].toLowerCase().replace(/[\s,\.-]*/gi,""))
	fnames[tmp[j].toLowerCase().replace(/[\s,\.-]*/gi,"")]=file
	titles[tmp[j].toLowerCase().replace(/[\s,\.-]*/gi,"")]=tmp[j]
      }
    }catch(error){
      process.stdout.write(path.join(folder)+" "+tmp[j]+"\n")
      process.stdout.write(error.message+"\n")
    }
  })
  keys=keys.sort()
  goodlines=[]
  for (j=0;j!=lines.length;j++){
    line=lines[j].toLowerCase().replace(/[\s,\.-]*/gi,"")
    if (line==""){continue;}
    try{
      filekeys=keys.filter((k)=>/*k.startsWith(line)||*/line.startsWith(k))
      filekey=filekeys[0]
      filekeys.forEach((f)=>{
        if (f.length>filekey.length) {filekey=f}
      })
      if (fs.existsSync(path.join(config.song_dir,fnames[filekey]))){
	lines[j]=titles[filekey]
	sng=require(path.join(config.song_dir,fnames[filekey]))
        if (lc.is_lent_now() && lc.has_alleluja(sng)){
	  warnings.push("Alleluja van a(z) '"+lines[j]+"' számban (az"+(j+1)+"-edik elem)")
        }
      }else{
	process.stdout.write(fnames[filekey]+"\n"+path.join(config.song_dir,fnames[filekey])+"\n")
	fails.push([lines[j],"az",(j+1),"dik elem"])
      }
    }catch(error){
      process.stdout.write(error.message+'=ERR2\n')

	fails.push([lines[j],"az",(j+1),"dik elem"])
    }
  }
  res={}
  res.warnings=warnings
  res.fails=fails
  return res;
}

function songorder(begin,end,lines){
  //var lines=[]
  /*fs.readFile('songlist.txt', (err, data) => { 
    lines=data.toString().split('\n'); 
  })*/
  fs.readdirSync(folder).forEach((filename)=> {
    if ('0'<=filename[0] && filename[0]<='9'){
      try{
	fs.unlink(path.join(folder,filename))
      }catch(err){
	process.stdout.write(err.message+'\n')
	throw err
      }
    }
  })
  i=1
  fails=[]
  keys=[]
  titles={}
  fs.readdirSync(folder).forEach((file)=> {
    try{
      tmp=require(path.join(folder,file)).titles
      for (j=0;j<tmp.length;++j){
	keys.push(tmp[j].toLowerCase().replace(/[\s,\.-]*/gi,""))
	titles[tmp[j].toLowerCase().replace(/[\s,\.-]*/gi,"")]=path.join(folder,file)
      }
    }catch(error){
      process.stdout.write(file+"\n")
      //tmp=require(path.join(folder,file)).titles
      process.stdout.write(error.message+" "+'\n')
    }
  })
  keys=keys.sort()
  goodlines=[]
  for (j=begin-1;j!=end;j++){
    line=lines[j].toLowerCase().replace(/[\s,\.-]*/gi,""/*{*/).replace(/.*}/,"")
    if (line==""){continue;}
    comment=""
    if (lines[j][0]=='{') {
	comment=lines[j].replace(/<br\/>}.*/,"").replace("{","")//}
	process.stdout.write(comment+"#\n")
    }
//if (line[0]=="#"){continue;}
    try{
      filekeys=keys.filter((k)=>/*k.startsWith(line)||*/line.startsWith(k))
      filekey=filekeys[0]
      filekeys.forEach((f)=>{
        if (f.length>=filekey.length) {filekey=f}
      })
	//process.stdout.write(filekey+"=FK ")
	//process.stdout.write(titles[filekey]+"=TFK\n")
      //longname=path.join(folder,filename)
      if (fs.existsSync(titles[filekey])){
	line=line.toLowerCase()
        line=line.replace(/é/gi,"e")
        line=line.replace(/í/gi,"i")
        line=line.replace(/á/gi,"a")
        line=line.replace(/[öőó]/gi,"o")
        line=line.replace(/[űúü]/gi,"u")
	if (comment!=""){
	  comment="#"+comment.replace(/<br\/>/gi," - ").replace(/#/g,"")
	}
	goodlines.push([titles[filekey],path.join(folder,((i+begin-1)+'').padStart(3,'0')+line+".js"),comment])
      }else{
	fails.push(lines[j])
      }
    }catch(error){
      process.stdout.write(error.message+'=ERR1\n')
      fails.push(lines[j])
    }
    i++
  }
  if (fails.length==0){
    goodlines.forEach( (ln)=>{
      delete require.cache[ln[0]]
      from=require(ln[0])
      from.comment=ln[2]
    
      try{
	lent_add=""
	if (from.lent_sections!=undefined){
	    lent_add="`],\n    lent_sections: [`"+from.lent_sections.join("` ,`")
	}
        data="module.exports = {\n    titles: [`"+from.titles.join("` ,`")+
	    "`],\n    sections: [`"+from.sections.join("` ,`")+
	      lent_add+
	    "`],\n    comment: `"+from.comment+"`\n}"

	  /*data="module.exports = {\n"+`require("${ln[0]}")`+
	    ",\n    comment: `"+from.comment+"`\n}"*/
        fs.writeFile(ln[1], data, (err) => {       
          if (err) throw err; 
        }) 
      }catch(err){
	process.stdout.write(err.message)
      }
    
      //fs.linkSync(ln[0],ln[1])
    })
  }
  process.stdout.write(fails+'\n')
  return fails;
}
module.exports={songorder,getsongorder}
