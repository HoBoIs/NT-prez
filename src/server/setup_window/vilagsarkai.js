config=require('../config')
const header=`module.exports = {
    titles: [\`A fény, ami bennem ég\`],
    sections: [
\`A fény, ami bennem ég, nem fog már kihunyni
A fényt, ami bennem ég, égni hagyom már! HEJ, BABÁM!
A fény, ami bennem ég, sugározzon szét!
Legyen fény, legyen fény, legyen fény!
\`, \`A fény, ami Krisztusé, nem fog már kihunyni
A fényt, ami Krisztusé, égni hagyom már! HEJ, BABÁM!
A fény, ami Krisztusé, sugározzon szét!
Legyen fény, legyen fény, legyen fény!
\`, \`A világ minden sarkában fénynek kell kigyúlni,
A világ minden sarkában éghetne a láng, HEJ BABÁM!
A világ minden sarkába a fényt elvihetném,
Legyen fény, legyen fény, legyen fény!
\`` 
const footer=`    ]
}`
const templ=`
,\`_____ minden sarkában fénynek kell kigyúlni,
_____ minden sarkában éghetne a láng, HEJ BABÁM!
_____ minden sarkába a fényt elvihetném,
Legyen fény, legyen fény, legyen fény!\``

path=require('path')
fs=require('fs')
function makesong(list){
  process.stdout.write("vs called\n")
  ofname=path.join(config.song_dir,"a_feny_ami_bennem_eg.js")
  delete require.cache[ofname]
  data=header
  list.forEach((city)=>{
    data+=templ.replace(/_____/gi,city)
  })
  data+=footer
  fs.writeFile(ofname,data,(err)=>{
  })
  process.stdout.write("vs ended\n")
}
function get_items(){
    filename=path.join(config.song_dir,"a_feny_ami_bennem_eg.js")
    song=require(filename)
    res=[]
    for (let i=3; i<song.sections.length;i+=1){
	res.push(song.sections[i].replace(/ minden(.*\n)*.*/gi,''))
    }
    return res
}

module.exports={makesong,get_items}
