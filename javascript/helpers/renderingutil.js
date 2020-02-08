/*
Described in tenths, the keys are returned
*/
var g_flats = [20, 5, 25, 10, 30, 15, 35]
var g_sharps = [0, 15, -5, 10, 25, 5, 20]

export function GetKeyTenths(keys){

    if(keys == undefined || keys == 0){
        return []
    }

    if(keys < 0){
        var flats = g_flats.slice(0, -keys)
        return {tuning:'flat', fifths:flats}
    }else{
        var sharps = g_sharps.slice(0, keys)
        return {tuning:'sharp', fifths:sharps}
    }
}


/*
* Returns note mapping, height is included...
* top: top op measure
* ratio: ratio of sheet
* note: note information
* timing: total time in a measure (e.g. 40)
*/
export function CharacterNoteMapping(top, ratio, note, timing){
    const duration = parseFloat(note['duration'])/parseFloat(timing)

    if(duration == "4"){
        return [top + -(note['_default-y'])*ratio,"w"];
    }else if(duration == "1"){  
        let resultArray = [top + -(note['_default-y']-5)*ratio]
        if(note['stem'] != 'up'){
            resultArray.push("q".toUpperCase())
        }else{
            resultArray.push("q")
        }
        return resultArray
    }else if(duration == "2"){
        let resultArray = [top + -(note['_default-y']-5)*ratio]
        if(note['stem'] != 'up'){
            resultArray.push("h".toUpperCase())
        }else{
            resultArray.push("h")
        }
        return resultArray
    }else if(duration == "0.5"){
        let resultArray = [top + -(note['_default-y']-5)*ratio]
        if(note['stem'] != 'up'){
            resultArray.push("e".toUpperCase())
        }else{
            resultArray.push("e")
        }
        return resultArray
    }
    return []
}