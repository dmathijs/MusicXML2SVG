import X2JS from "x2js"
import { GetKeyTenths, CharacterNoteMapping, CharacterRestMapping, MapNotesToCoords } from "../helpers/renderingutil"

// SVG Container keeps all svg related
export default function SVGBuilder(renderWindow, xmlParser, pageSizing){
    this.renderWindow = renderWindow
    this.width = renderWindow.clientWidth
    this.pageSizing = pageSizing
    this.xmlParser = xmlParser

    this.raw_height = pageSizing["page-height"]
    // Keep track of the real ratio (sized to DOM)
    this.ratio = CalculateDomRatio(renderWindow, pageSizing)
    this.height = CalculateAndSetWindowHeight(renderWindow, pageSizing, this.ratio)

    setFontSize(renderWindow, this.ratio)
   
    // Keep track of position of measures
    this.margins = CalculateMeasureMargins(pageSizing["page-margins"][0], this.ratio)
    this.sheetBoundingBox = CalculateSheetBoundingBox(this.margins, this.width, this.height)

    // Initialize SVG
    this.svgObject = {"svg":{"_width":this.width, "_height":this.height,"g":[]}};

    this.Generate = Generate;
    this.setRenderWindowHeight = setRenderWindowHeight
}

function CalculateAndSetWindowHeight(renderWindow, pageSizing, ratio){
    const _height = pageSizing["page-height"]*ratio
    // SetHeight
    setRenderWindowHeight(renderWindow, _height)
    
    return _height;
}

function CalculateSheetBoundingBox(margins, width, height){
    return{
        "leftBoundary":margins.leftMargin,
        "topBoundary":margins.topMargin,
        "rightBoundary":width - margins.rightMargin,
        "bottomBoundary":height - margins.bottomMargin
    }
}

// Re-calculates the margins using the ratio of the viewPort
function CalculateMeasureMargins(margins, ratio){
    return{
        "leftMargin":margins["left-margin"]*ratio,
        "rightMargin":margins["right-margin"]*ratio,
        "topMargin":margins["top-margin"]*ratio,
        "bottomMargin":margins["bottom-margin"]*ratio
    }
}

function CalculateDomRatio(renderWindow, pageSizing){
    const _width = renderWindow.clientWidth;
    const _realWidth = pageSizing["page-width"];

    return _width/_realWidth;
}

function setRenderWindowHeight(renderWindow, height){
    renderWindow.style.height = `${height}px`;
}
function setFontSize(renderWindow, ratio){
    renderWindow.style["font-size"] = `${36*ratio}px`
}

function Generate(scaling, measures, credits){
    // Generate the text on the sheet
    _generateCredits(this.svgObject, this.sheetBoundingBox, credits, this.ratio, this.raw_height)
    // Generate the measures on the sheet
    _generateMeasures(this.svgObject, this.sheetBoundingBox, measures, scaling, this.ratio)

    return this.xmlParser.ParseToXml(this.svgObject)
    // return this.xmlParser.ParseToXml(_drawMargins(this.svgObject, this.sheetBoundingBox))
}

function _generateCredits(svgObject, boundingBox, credits, ratio, height){

    if(credits != undefined){
        if(Array.isArray(credits)){
            for(var i = 0; i < credits.length; i++){
                credit = credits[i]["credit-words"]
                _generateSansSerifText(svgObject, parseFloat(credit["_default-x"])*ratio, (height - credit["_default-y"])*ratio, credit["__text"], credit["_font-size"], credit["_justify"])
            }
        }else{
            var credit = credits["credit-words"]
            _generateSansSerifText(svgObject, parseFloat(credit["_default-x"])*ratio, (height - credit["_default-y"])*ratio, credit["__text"], credit["_font-size"], credit["_justify"])
        }
    }
}

function _generateMeasures(svgObject, boundingBox, measures, scaling, ratio){

    let _previousMeasureEnd = boundingBox.leftBoundary
    let _topDistance = boundingBox.topBoundary + measures[0]["print"]["system-layout"]["top-system-distance"]*ratio
    let _previousMeasureState = {clefTime:{}};
    
    const tenths = scaling.tenths

    for(let i= 0; i < measures.length; i++){
        
        let _endPoint = _previousMeasureEnd + parseFloat(measures[i]["_width"])*ratio

        // Check if we have to move to another line
        if(i != 0 && measures[i]["print"] != undefined){
            _topDistance = _topDistance + measures[i]["print"]["system-layout"]["system-distance"]*ratio
            _previousMeasureEnd =  boundingBox.leftBoundary
            _endPoint = _previousMeasureEnd + parseFloat(measures[i]["_width"])*ratio
        }

        _previousMeasureState = _drawMeasure(svgObject, _previousMeasureEnd, _endPoint, _topDistance, measures[i], tenths, ratio, _previousMeasureState)
        
        _previousMeasureEnd = _endPoint
    }
}

function _drawClefTimes(svgObject, start, top, measure, clefData, ratio){

    const attributes = measure['attributes']
    // Variable that keeps track of new line
    const clefSymbol = "&"

    let last_elem_position = 0;

    if(attributes != undefined){    
  
        if(attributes['clef'] != undefined){
            _generateText(svgObject,start+(7*ratio), top + (30)*ratio, clefSymbol)
            clefData["clef"] = attributes['clef']
        }

        if(attributes['key'] != undefined){
            var fifths = parseInt(attributes['key']['fifths'])

            if(fifths != undefined){
                clefData['key'] = GetKeyTenths(fifths)
                if(clefData['key'].fifths != undefined){
                    for(var i = 0; i <  clefData['key']['fifths'].length; i++){
                        last_elem_position = last_elem_position + 4
                        _generateSignature(svgObject, start + 30*ratio + last_elem_position, top, ratio, clefData['key'].tuning, clefData['key']['fifths'][i])
                    }
                    last_elem_position = last_elem_position + 4
                }
            }
        }

        if(attributes['time'] != undefined){
            
            _drawTimeOnMeasure(svgObject, start + last_elem_position, top, attributes['time']['beat-type'], attributes['time']['beats'], ratio)
            clefData["measure-up"] = attributes['time']['beat-type']
            clefData["measure-down"] = attributes['time']['beats']
        }

    }else if(clefData != undefined){
        
        _generateText(svgObject, start+(7*ratio), top + (30)*ratio, clefSymbol)

        if(clefData["key"] != undefined && clefData["key"].tuning.length > 0){
            // If we have key information, proceed..
            if(clefData["key"]){
                for(var i = 0; i <  clefData['key'].fifths.length; i++){
                    last_elem_position = last_elem_position + 5
                    _generateSignature(svgObject, start + 20*ratio + last_elem_position, top, ratio, clefData["key"].tuning, clefData["key"].fifths[i])
                }
            }
        }
    }

    clefData["last-element-position"] = start + 20*ratio + last_elem_position
    return clefData
}

function _drawMeasure(svgObject, start, end, top, measure, tenths, ratio, measureMetaData){

    for(let j = 0; j < 5; j++){
        _drawLine(svgObject, start, top + (tenths/4)*j*ratio, end, top + (tenths/4)*j*ratio, 0.6)
    }

    _drawLine(svgObject, end, top,end, top + tenths*ratio, 0.6)

    let newLine = false;

    // Check wheter we're a new line
    if((measure['print'] != undefined && measure['print']["_new-system"] == "yes") || measure['attributes'] != undefined){
        var previousClefTime = measureMetaData.clefTime

        measureMetaData["clef-time"] = _drawClefTimes(svgObject, start, top, measure, previousClefTime, ratio)
        // We need a time division to draw our notes
        measureMetaData["time-division"] = _parseTimeDivision(measure, measureMetaData["time-division"])

        newLine = true;
    }else{
        newLine = false;
    }

    // Map the notes to x,y, choords
    const measureNotes = (measure['note'] instanceof Array ) ? measure['note'] : [measure['note']]
    const notes = MapNotesToCoords(newLine, measureMetaData["clef-time"]["last-element-position"], start, end, top, tenths, ratio, measureNotes,measureMetaData["time-division"])

    for(let j = 0; j < notes.length; j++){
        _drawNote(svgObject, notes[j], ratio);
    }

    // return an object with meta data from the measure
    return measureMetaData;
} 

/*
    Timing of a piece is dependent on the <divsion> tag on a measure
*/
function _parseTimeDivision(measure, previousDivision){
    if(measure['attributes'] != undefined && measure['attributes']['divisions'] != undefined){
        return parseInt(measure['attributes']['divisions']);
    }else if(previousDivision != undefined){
        return previousDivision;
    }else{
        return 8;
    }
}


function _drawNote(svgObject, note, ratio){

    // There is a rest
    if(note.rest){
        _generateText(svgObject, note.x, note.y, note.symbol)
        return;
    }
    
    if(note.needsLine){
        _drawLine(svgObject,note.x-2, note.y + note.noteOffset*ratio, note.x + 7, note.y + note.noteOffset*ratio, 0.6)
    }
    // unpack
    _generateText(svgObject,note.x, note.y, note.symbol)
}

// Calculates the middle of 2 notes to put the rest
function _generateRestWidth(start, previousNoteX, nextNoteX, ratio){
    return start + ((parseFloat(previousNoteX) + parseFloat(nextNoteX))/2)*ratio
}

function _generateRest(svgObject, duration, start, top, ratio, tenths, nextNote, previousNote,timing){
    const restCharacter = CharacterRestMapping(top, ratio, duration, timing)
    _generateText(svgObject,_generateRestWidth(start, previousNote["_default-x"], nextNote['_default-x'], ratio), top + (tenths/2)*ratio, restCharacter)
}

function _generateSignature(svgObject, start, top, ratio, tuning, tenths){
    if(tuning == "sharp"){
        _generateText(svgObject,start, top + (tenths)*ratio, "#");
    }else{
        _generateText(svgObject,start, top + (tenths)*ratio, "b");
    }
}

/*

Draw the time of a measure (e.g 4/4)
svgObject -> the object
measureStart -> y-coordinate to draw
timeTop -> top time signature number
timeBottom -> bottom time signature number
*/
function _drawTimeOnMeasure(svgObject, measureStart, topDistance, timeTop, timeBottom, ratio){
    _generateText(svgObject, measureStart +(40*ratio), topDistance + (30)*ratio, timeTop)
    _generateText(svgObject, measureStart +(40*ratio), topDistance + (10)*ratio, timeBottom)
}

function _drawMargins(svgObject, boundingBox){

    _drawLine(svgObject, boundingBox.leftBoundary, boundingBox.topBoundary, boundingBox.rightBoundary, boundingBox.topBoundary)
    _drawLine(svgObject, boundingBox.leftBoundary,  boundingBox.topBoundary, boundingBox.leftBoundary, boundingBox.bottomBoundary)
    _drawLine(svgObject, boundingBox.leftBoundary, boundingBox.bottomBoundary, boundingBox.rightBoundary, boundingBox.bottomBoundary)
    _drawLine(svgObject,  boundingBox.rightBoundary, boundingBox.topBoundary,  boundingBox.rightBoundary, boundingBox.bottomBoundary)

    return svgObject
}


function _drawLine(svgObject, x1, y1, x2, y2, strokeWidth = "0.8"){
    svgObject.svg.g.push({"path":
    {"_d":`M${x1},${y1} L${x2} ${y2}`,
    "_stroke-width":strokeWidth,
    "_stroke":"black",
    "_fill":"none",
    }});
    return svgObject;
}

function _generateText(svgObject,x1,y1,text){
    svgObject.svg.g.push({"text":
    {"_x":x1,
    "_y":y1,
    "_fill":"black",
    "__text":text,
    
    }});
    return svgObject;
}

function _generateSansSerifText(svgObject, x1, y1, text, size, anchor = "center"){

    let textAnchor = "middle";
    if(anchor == "left"){
        textAnchor = "start";
    }else if(anchor == "right"){
        textAnchor = "end";
    }

    svgObject.svg.g.push({
        "text":{
            "_font-family":"sans-serif",
            "_x":x1,
            "_y":y1,
            "_fill":"black",
            "__text":text,
            "_font-size":size,
            "_dominant-baseline":"hanging",
            "_text-anchor":textAnchor
        }
    })
}

