cfn=require('./conv_fname')
const fs = require('fs') 
const path = require('path')
const ttjs=require('./txttojs')
const xtjs=require('./xmltojs')

function single_file(fname,title_set){
  if (fname[0]=='.')return;
  if (fname.includes('.txt')){
    ttjs.txttojs(fname,title_set)
  } else if(fname.includes('.xml')){
    xtjs.xmltojs(fname,title_set)
  } else if (fs.lstatSync(fname).isDirectory()) {
      importsong(fname,title_set)
    //Dict or Unknown
  }
}

function importsong(fname,title_set){
  if(fs.lstatSync(fname).isDirectory()){
    fs.readdirSync(fname).forEach((filename)=> {
      importsong(path.join(fname,filename),title_set)
    })
  }else{
    try{
    single_file(fname,title_set)
    }catch(err){
      process.stdout.write(err.message+"\n")
    }
  }
}

module.exports={importsong}
