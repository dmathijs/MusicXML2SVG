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
Maps rest to specific character
*/
export function CharacterRestMapping(duration, timing){
    const restDuration = duration/parseFloat(timing)

    if(restDuration == "0.5"){
        return "ä"
    }else if(restDuration == "3"){
        return "·"
    }else if(restDuration == "2"){
        return "î"
    }else if(restDuration == "1"){
        return "Î"
    }else if(restDuration == "4"){
        return "ã"
    }else if(restDuration == "0.25"){
        return "Å"
    }else if(restDuration == "0.125"){
        return "¨"
    }else if(restDuration == "0.0625"){
        return "ô"
    }
}

/*
Maps notes of measure to specific xcoord, ycoord combination
*/
export function MapNotesToCoords(newLine, newLineStart,  start, end, top, tenths, ratio, notes, timing){
    let noteCoords = [];
    let numberOfRests = 0;

    let previousX = start;

    if(newLine){
        previousX = newLineStart;
    }

    // Iterate over notes with goal to determine their respective x and y coords
    for(let i = 0; i < notes.length; i++){
        // Check wheter we have a rest
        if(notes[i].rest != undefined){
            // If so, we need to determine the previous coord
            numberOfRests += 1;
            noteCoords.push({x:undefined, y:(top + (tenths/2)* ratio), previousX, symbol:CharacterRestMapping(notes[i]['duration'], timing), rest:true});
        }else{
            previousX = start + notes[i]["_default-x"]*ratio

            // If high or low note, needs line
            const needsLine = (parseFloat(tenths) + parseFloat(notes[i]['_default-y']) <= -tenths/4 || parseFloat(notes[i]['_default-y']) > 0 ) && parseFloat(notes[i]['_default-y'])%(tenths/4) == 0;
            const noteOffset = GetNoteHeightOffset(notes[i], timing)

            noteCoords.push({x:start + notes[i]["_default-x"]*ratio, y:(top + -(parseFloat(notes[i]['_default-y'])+noteOffset)*ratio), symbol:CharacterNoteMapping(notes[i], timing), rest:false, needsLine, noteOffset});

            if(HandleRestsInMeasure(numberOfRests, start, end, notes, noteCoords, i, ratio)){
                numberOfRests = 0;
            }
        }
    }

    // Upon finalisation, check wheter all rests have been handled
    if(numberOfRests > 0){
        HandleRestsInMeasure(numberOfRests, start, end, notes, noteCoords, notes.length, ratio, previousX)
    }
    return noteCoords;
}


function HandleRestsInMeasure(numberOfRests, start, end, notes, noteCoords, i, ratio, previousX){
    if(numberOfRests > 0){
        var firstMeasuredX = parseFloat(start)

        if(i - numberOfRests >= 0){
            firstMeasuredX = parseFloat(noteCoords[i-numberOfRests].previousX)
        }

        var lastMeasuredX = parseFloat(end)

        if(i != notes.length){
            var lastMeasuredX = parseFloat(start + notes[i]["_default-x"]*ratio)
        }

        // [x ... rest ... rest .. x]
        // + 2 rests to determine the right interval
        var width = (lastMeasuredX - firstMeasuredX)/(numberOfRests + 1)
        var iteration = 1;

        for(let j = i-numberOfRests; j < i; j++){
            noteCoords[j].x = firstMeasuredX + width*iteration
            iteration += 1;
        }

        return true;
    }
    return false;
}
/*
* Returns note mapping, height is included...
* top: top op measure
* ratio: ratio of sheet
* note: note information
* timing: total time in a measure (e.g. 40)
*/
export function CharacterNoteMapping(note, timing){
    const duration = parseFloat(note['duration'])/parseFloat(timing)

    if(duration == "4"){
        return "w"
    }else if(duration == "1"){  
        if(note['stem'] != 'up'){
            return "q".toUpperCase()
        }else{
            return "q"
        }
    
    }else if(duration =="1.5"){
        if(note['stem'] != 'up'){
            return "q".toUpperCase() + " k"
        }else{
            return "q k"
        }
    }else if(duration == "2"){
        if(note['stem'] != 'up'){
            return "h".toUpperCase()
        }else{
            return "h"
        }
    }else if(duration == "3"){
        if(note['stem'] != 'up'){
            return "h".toUpperCase() + " k"
        }else{
            return "h k"
        }

    }else if(duration == "0.5"){
        if(note['stem'] != 'up'){
            return "e".toUpperCase()
        }else{
            return "e"
        }
    }else{
        return "Ï"
    }
}

/*
    Some notes in the font react differentl
*/
export function GetNoteHeightOffset(note, timing){
    const duration = parseFloat(note['duration'])/parseFloat(timing)

    if(duration == "4" || duration < 0.5){
        return 0
    }else{
        return -5
    }
}