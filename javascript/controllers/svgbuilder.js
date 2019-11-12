import X2JS from "x2js"

// SVG Container keeps all svg related
export default function SVGBuilder(renderWindow, xmlParser, pageSizing){
    this.renderWindow = renderWindow
    this.width = renderWindow.clientWidth
    this.pageSizing = pageSizing
    this.xmlParser = xmlParser

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

function Generate(test_data){
    _generateMeasures(this.svgObject, this.sheetBoundingBox, test_data, this.ratio)

    return this.xmlParser.ParseToXml(this.svgObject)
    // return this.xmlParser.ParseToXml(_drawMargins(this.svgObject, this.sheetBoundingBox))
}

function _generateMeasures(svgObject, boundingBox, measures, ratio){

    let _previousMeasureEnd = boundingBox.leftBoundary
    const _topDistance = boundingBox.topBoundary + measures[0]["print"]["system-layout"]["top-system-distance"]*ratio

    for(let i= 0; i < measures.length; i++){
        let _endPoint = _previousMeasureEnd + parseFloat(measures[i]["_width"])*ratio
        for(let j = 0; j < 5; j++){
            _drawLine(svgObject, _previousMeasureEnd, _topDistance + (40/4)*j*ratio, _endPoint, _topDistance + (40/4)*j*ratio)
            
        }
        _drawLine(svgObject, _endPoint, _topDistance,_endPoint, _topDistance + 40*ratio)

        _previousMeasureEnd = _endPoint
    }

    _generateText(svgObject, boundingBox.leftBoundary+(7*ratio), _topDistance + (30)*ratio, "&")
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
    "__text":text
    }});
    return svgObject;
}

