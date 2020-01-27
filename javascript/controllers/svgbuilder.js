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

function Generate(measures, credits){
    // Generate the text on the sheet
    _generateCredits(this.svgObject, this.sheetBoundingBox, credits, this.ratio, this.raw_height)
    // Generate the measures on the sheet
    _generateMeasures(this.svgObject, this.sheetBoundingBox, measures, this.ratio)

    return this.xmlParser.ParseToXml(this.svgObject)
    // return this.xmlParser.ParseToXml(_drawMargins(this.svgObject, this.sheetBoundingBox))
}

function _generateCredits(svgObject, boundingBox, credits, ratio, height){

    _generateSansSerifText(svgObject, parseFloat(credits["_default-x"])*ratio, (height - credits["_default-y"])*ratio, credits["__text"], credits["_font-size"])
}

function _generateMeasures(svgObject, boundingBox, measures, ratio){

    let _previousMeasureEnd = boundingBox.leftBoundary
    const _topDistance = boundingBox.topBoundary + measures[0]["print"]["system-layout"]["top-system-distance"]*ratio

    for(let i= 0; i < measures.length; i++){
        
        let _endPoint = _previousMeasureEnd + parseFloat(measures[i]["_width"])*ratio
        
        _drawMeasure(svgObject, _previousMeasureEnd, _endPoint, _topDistance, measures[i], ratio)
        // Draw measure time & cleff
        
        _previousMeasureEnd = _endPoint
    }
}

function _drawMeasure(svgObject, start, end, top, measure, ratio){

    for(let j = 0; j < 5; j++){
        _drawLine(svgObject, start, top + (40/4)*j*ratio, end, top + (40/4)*j*ratio)
    }

    _drawLine(svgObject, end, top,end, top + 40*ratio)

    if(measure['attributes'] != undefined){
        // Try to fetch attributes
        const attributes = measure['attributes']

        if(attributes['time'] != undefined){
            _drawTimeOnMeasure(svgObject, start, top, attributes['time']['beats'], attributes['time']['beat-type'], ratio)
        }
        
        if(attributes['clef'] != undefined){
            _generateText(svgObject,start+(7*ratio), top + (30)*ratio, "&")
        }
    }

    console.log(measure)
    // check if only one note
    if(!Array.isArray(measure['note'])){
        _drawNote(svgObject, measure['note'], start, top, ratio)
    }else{
        // Iterate over notes
        for(let j = 0; j < measure['note'].length; j++){
            _drawNote(svgObject, measure['note'][j], start, top, ratio)
        }
    }


} 


function _drawNote(svgObject, note, start, top, ratio){

    if(note['rest'] != undefined){
        return;
    }

    var noteStart = start + note['_default-x']*ratio
    
    // unpack
    _generateText(svgObject,noteStart, ..._characterNoteMapping(top, ratio, note))
}

/*
* Returns note mapping, height is included...
*/
function _characterNoteMapping(top, ratio, note){
    if(note['duration'] == "8"){
        return [top + -(note['_default-y'])*ratio,"w"];
    }else{  
        let resultArray = [top + -(note['_default-y']-5)*ratio]
        if(note['stem'] != 'up'){
            resultArray.push("q".toUpperCase())
        }else{
            resultArray.push("q")
        }
        return resultArray
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

function _generateSansSerifText(svgObject, x1, y1, text, size){
    svgObject.svg.g.push({
        "text":{
            "_font-family":"serif",
            "_x":x1,
            "_y":y1,
            "_fill":"black",
            "__text":text,
            "_font-size":size,
            "_dominant-baseline":"hanging",
            "_text-anchor":"middle"
        }
    })
}

