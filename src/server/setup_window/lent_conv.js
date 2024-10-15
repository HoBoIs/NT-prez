var romcal = require('romcal');

global.lent_force='auto'

function is_lent_now(){
    
    if (global.lent_force=='to_on'){
	return true;
    }else{
	if (lent_force=='to_off'){
	    return false;
	}else{
	d=new Date
	lent_days=romcal.Dates.daysOfLent(d.getFullYear());
	lbeg=lent_days[0]
	lend=lent_days[lent_days.length-1]
	return (lbeg < d) && (d < lend)
	}
    }
}


function song_conv(s){
    if (is_lent_now()){
	if (s.lent_sections==undefined){
	}else{
	    a=s.sections
	    s.sections=s.lent_sections
	    s.lent_sections=a
	}
    }
    return s
}

function has_alleluja(s){
    try{
    if (s.lent_sections==undefined){
	return ! s.sections.every((x)=>
	    -1==x.toLowerCase().replace('ú','u').replace('á','a').indexOf('alleluja')
	)
    }
    }catch(err){
process.stdout.write(err.message+"\n")
	throw err
    }
    return false;
}
module.exports={
    is_lent_now,song_conv,has_alleluja
}
