config=require('../config')
path=require('path')
fs=require('fs')
cfn=require('./conv_fname')


function is_duplicate(fname){
  outfn=path.join(config.song_dir,cfn.conv_fname(fname)[0])
  return fs.existsSync(outfn);
}
function exsist_list(fname){

  result=[]
  if(fs.lstatSync(fname).isDirectory()){
    fs.readdirSync(fname).forEach((filename)=> {
      result.concat(exsist_list(path.join(fname,filename)))
    })
  }else{
      if (is_duplicate(fname)) {result=[fname.replace(/.*\\/gi,'').replace(/.*\//gi,'')+'; ']}
  }
  return result
}
module.exports={exsist_list}
