import SVGBuilder from "./svgbuilder"
import XMLParser from "../helpers/XMLParser";


export default function RenderingController(){
    this.xmlParser = new XMLParser()

    this.Render = RenderXML
    this.FetchMusicXML = FetchMusicXml
}

// Function responsible for finding the view on page
export function RenderXML(){

    const _renderWindow = document.getElementById("musicxml2svg-container");

    if(_renderWindow == null){
        console.error("Couldn't locate the musicxml2svg-container.");
    }

    return this.FetchMusicXML(_renderWindow, RenderView);
}

// Function responsible for fetching the xml specified in the [data-src]
function FetchMusicXml(renderWindow, callback){
    
    if(renderWindow == null){
        return;
    }

    const musicXmlAttribute = renderWindow.dataset.src;

    if(musicXmlAttribute == null){
        console.error("Couldn't access any MusicXML attribute, are you sure data-src is set?");
        return;
    }

    const musicXmlRequest = new XMLHttpRequest();
    // Perform the music xml request
    musicXmlRequest.open("GET", musicXmlAttribute)
    musicXmlRequest.setRequestHeader('Content-Type', 'application/xml');
    musicXmlRequest.send()

    musicXmlRequest.onreadystatechange=(e)=>{
        if(musicXmlRequest.readyState == musicXmlRequest.DONE && musicXmlRequest.status == 200 && musicXmlRequest.responseText){
            callback(renderWindow,this.xmlParser.ParseFromXml(musicXmlRequest.responseText), this.xmlParser);
        }

        return;
    }
}

// Function responsible for the rendering
function RenderView(renderWindow, musicXMLObject, xmlParser){
    console.log(musicXMLObject)
    // Get page layout information
    const _scoreParts = musicXMLObject["score-partwise"];
    const _defaults = _scoreParts.defaults;
    const _pageSizing = _defaults["page-layout"]

    // Initialize the svgContainer with the window height, width
    const _svgContainer = new SVGBuilder(renderWindow, xmlParser, _pageSizing);

    // set the innerhtml
    renderWindow.innerHTML = _svgContainer.Generate(_scoreParts.part.measure);
}