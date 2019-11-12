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
   

    this.margins = pageSizing["page-margins"][0]

    this.Data = {};

    this.Generate = Generate;
    this.setRenderWindowHeight = setRenderWindowHeight
}

function CalculateAndSetWindowHeight(renderWindow, pageSizing, ratio){
    const _height = pageSizing["page-height"]*ratio
    // SetHeight
    setRenderWindowHeight(renderWindow, _height)
    
    return _height;
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
    
    // return this.xmlParser.ParseToXml(example_obj)
}


