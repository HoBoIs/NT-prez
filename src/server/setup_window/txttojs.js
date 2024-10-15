cfn=require('./conv_fname')
const fs = require('fs') 
const path = require('path')
config=require('../config')

function single_file(fname,title_set){
    process.stdout.write("sttjs")
  lines=fs.readFileSync(fname).toString().split('\n')
  outfn=path.join(config.song_dir,cfn.conv_fname(fname)[0])
  data="module.exports = {\n"
  data+="    titles: [`"+ lines[0].replace("\n","").replace("|","`,`")+"`],\n"
  data+=("    sections: [\n")
  data+=("`\n")
  let i;
  for (i=2; i<lines.length;++i){
    line=lines[i].replace(/\s*$/,"")
    if (line==""){
      data+="`,`\n"
    }else{
      data+=line+"\n"
    }
  }
  lastline=lines[i-1].replace(/\s*$/,"")
  if (lastline!=""){
      data+="`,`\n"
  }
  data=data.slice(0,-2)
  data+=("\n    ]\n")
  data+=("}\n")
  titles=lines[0].replace("\n","").split("|");
  titles.forEach((title)=>{
    if (title_set.hasOwnProperty(title.toLowerCase().replace(/[\s,\.]/gi,""))){
	alert(`A '${title}' cím már létezik\n Más cím legyen helyette vagy töröld a régi filet\nÚj file:${fname}\nRégi file ${path.join(config.song_dir,title_set[title.toLowerCase().replace(/[\s,\.]/gi,"")])}`);
	return;
    }
  })
  fs.writeFile(outfn, data, (err) => {       
    if (err) throw err; 
  }) 
}

function txttojs(fname,title_set){
  if(fs.lstatSync(fname).isDirectory()){
    fs.readdirSync(fname).forEach((filename)=> {
      single_file(path.join(fname,filename),title_set)
    })
  }else{
    single_file(fname,title_set)
  }
}
module.exports={txttojs}
