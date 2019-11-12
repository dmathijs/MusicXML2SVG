import X2JS from "x2js"

// SVG Container keeps all svg related
export default function SVGContainer(renderWindow, xmlParser, pageSizing){
    this.renderWindow = renderWindow
    this.width = renderWindow.clientWidth
    this.pageSizing = pageSizing
    this.xmlParser = xmlParser

    // Keep track of the real ratio (sized to DOM)
    this.ratio = CalculateDomRatio(renderWindow, pageSizing)
    this.height = CalculateAndSetWindowHeight(renderWindow, pageSizing, this.ratio)
   
    // Keep track of position of measures
    this.margins = CalculateMeasureMargins(renderWindow, pageSizing["page-margins"][0], this.ratio)

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

// Re-calculates the margins using the ratio of the viewPort
function CalculateMeasureMargins(renderWindow, margins, ratio){
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

function Generate(){
    console.log("started generating...")

    // var example_obj  = {
    //     "svg":{
    //         "_width":this.width,
    //         "circle":{
    //             "_cx":"50",
    //             "_cy":"50",
    //             "_r":"40",
    //             "_stroke":"black",
    //             "_stroke-width":"4"
    //         }
    //     }
    // }
    
    
    return this.xmlParser.ParseToXml(_drawMargins(this.svgObject, this.margins, this.width, this.height))
}


function _drawMargins(svgObject, margins, width, height){

    _drawLine(svgObject, margins.leftMargin, margins.topMargin, width - margins.rightMargin, margins.topMargin)
    _drawLine(svgObject, margins.leftMargin, margins.topMargin, margins.leftMargin, height-margins.bottomMargin)
    _drawLine(svgObject, margins.leftMargin, height-margins.bottomMargin, width - margins.rightMargin, height-margins.bottomMargin)
    _drawLine(svgObject, width - margins.rightMargin, margins.topMargin, width - margins.rightMargin, height-margins.bottomMargin)

    return svgObject
}


function _drawLine(svgObject, x1, y1, x2, y2){
    svgObject.svg.g.push({"path":
    {"_d":`M${x1},${y1} L${x2} ${y2}`,
    "_stroke-width":"1",
    "_stroke":"red",
    "_fill":"none",
    }});
    return svgObject;
}

