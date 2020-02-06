import X2JS from "x2js"

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
        console.log(credits)
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
            _endPoint = parseFloat(measures[i]["_width"])*ratio
        }

        _previousMeasureState = _drawMeasure(svgObject, _previousMeasureEnd, _endPoint, _topDistance, measures[i], tenths, ratio, _previousMeasureState)
        _previousMeasureEnd = _endPoint
    }
}

function _drawClefTimes(svgObject, start, top, measure, clefData, ratio){

    const attributes = measure['attributes']
    // Variable that keeps track of new line
    const clefSymbol = "&"

    if(attributes != undefined){    
        if(attributes['time'] != undefined){
            _drawTimeOnMeasure(svgObject, start, top, attributes['time']['beat-type'], attributes['time']['beats'], ratio)
            clefData["measure-up"] = attributes['time']['beat-type']
            clefData["measure-down"] = attributes['time']['beats']
        }
        
        if(attributes['clef'] != undefined){
            _generateText(svgObject,start+(7*ratio), top + (30)*ratio, clefSymbol)
            clefData["clef"] = attributes['clef']
        }
    }else if(clefData != undefined){
        _drawTimeOnMeasure(svgObject, start, top, clefData['measure-up'], clefData["measure-down"], ratio)
        _generateText(svgObject, start+(7*ratio), top + (30)*ratio, clefSymbol)
    }

    return clefData
}

function _drawMeasure(svgObject, start, end, top, measure, tenths, ratio, measureMetaData){

    for(let j = 0; j < 5; j++){
        _drawLine(svgObject, start, top + (tenths/4)*j*ratio, end, top + (tenths/4)*j*ratio, 0.6)
    }

    _drawLine(svgObject, end, top,end, top + tenths*ratio, 0.6)

    // Check wheter we're a new line
    if((measure['print'] != undefined && measure['print']["_new-system"] == "yes") || measure['attributes'] != undefined){
        var previousClefTime = measureMetaData.clefTime

        measureMetaData["clef-time"] = _drawClefTimes(svgObject, start, top, measure, previousClefTime, ratio)
    }

    // check if only one note, then there won't be an array but an object
    if(!Array.isArray(measure['note'])){
        _drawNote(svgObject, measure['note'], start, top, ratio, tenths)

    }else{
        // Iterate over notes
        for(let j = 0; j < measure['note'].length; j++){
            
            var _previousNote = null
            var _nextNote = null
            
            // Determine next note
            if(j + 1 < measure['note'].length){
                _nextNote = measure['note'][j+1]
            }else{
                // Create a fake note with a position to determine length
                _nextNote = {'_default-x':(end-start)/ratio}
            }

            if( j > 0){
                _previousNote = measure['note'][j-1]
            }else{
                _previousNote = {'_default-x':start}
            }

            _drawNote(svgObject, measure['note'][j], start, top, ratio, tenths, _nextNote, _previousNote)
        }
    }

    // return an object with meta data from the measure
    return measureMetaData;
} 


function _drawNote(svgObject, note, start, top, ratio, tenths, nextNote, previousNote){

    // There is a rest
    if(note['rest'] != undefined){
        _generateRest(svgObject, note['duration'], start, top, ratio, tenths, nextNote, previousNote)
        return;
    }

    var noteStart = start + note['_default-x']*ratio
    
    if((parseFloat(tenths) + parseFloat(note['_default-y']) <= -tenths/4 || parseFloat(note['_default-y']) > 0 ) && parseFloat(note['_default-y'])%(tenths/4) == 0){
        _drawLine(svgObject,noteStart-5*ratio, top + -note['_default-y']*ratio, noteStart+18*ratio, top + -note['_default-y']*ratio, 0.6)
    }
    // unpack
    _generateText(svgObject,noteStart, ..._characterNoteMapping(top, ratio, note))
}

// Calculates the middle of 2 notes to put the rest
function _generateRestWidth(start, previousNoteX, nextNoteX, ratio){
    return start + ((parseFloat(previousNoteX) + parseFloat(nextNoteX))/2)*ratio
}
function _generateRest(svgObject, duration, start, top, ratio, tenths, nextNote, previousNote){
    if(duration == "1"){
        _generateText(svgObject,_generateRestWidth(start, previousNote["_default-x"], nextNote['_default-x'], ratio), top + (tenths/2)*ratio, "ä")
    }
}

/*
* Returns note mapping, height is included...
*/
function _characterNoteMapping(top, ratio, note){
    const duration = note['duration']

    if(duration == "8"){
        return [top + -(note['_default-y'])*ratio,"w"];
    }else if(duration == "2"){  
        let resultArray = [top + -(note['_default-y']-5)*ratio]
        if(note['stem'] != 'up'){
            resultArray.push("q".toUpperCase())
        }else{
            resultArray.push("q")
        }
        return resultArray
    }else if(duration == "4"){
        let resultArray = [top + -(note['_default-y']-5)*ratio]
        if(note['stem'] != 'up'){
            resultArray.push("h".toUpperCase())
        }else{
            resultArray.push("h")
        }
        return resultArray
    }else if(duration == "1"){
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
            "_font-family":"serif",
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

