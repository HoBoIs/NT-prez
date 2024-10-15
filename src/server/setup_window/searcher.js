

function title_search(titles,phraze,fixed){
    if (fixed=="strict"){
	phraze=phraze.toLowerCase()//.replace(/[\s,\.]/gi,"")
	return titles.filter((x)=>-1!=x.toLowerCase().indexOf(phraze))
    }else if (fixed=="mid-loose"){
	phrazels=phraze.toLowerCase()/*.replace(/[,\.]/gi,"")*/.split(" ")
	//process.stdout.write(titles+"\n")
	return titles.filter((x)=>
	    phrazels.every((phraze)=>-1!=x.toLowerCase().indexOf(phraze))
	)
    }else if (fixed=="regex"){
	re=new RegExp(phraze,'i')
	return titles.filter((x)=>re.test(x))
    }else if (fixed=="loose"){
	phraze=phraze.toLowerCase()/*.replace(/[\s,\.]/gi,"")*/
	return titles.filter((x)=>{
	    x=x.toLowerCase();
	    for (i=0; i!=phraze.length;++i){
		id=x.indexOf(phraze[i])
		if (id==-1) return 0
		x=x.substr(id+1)
	    }
	    return 1;
	})
    }
}
module.exports={
    title_search
}
