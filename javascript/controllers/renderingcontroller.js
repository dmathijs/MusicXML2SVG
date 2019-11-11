import ParseMusicXML from "../helpers/helpers"

// Function responsible for finding the view on page
export default function RenderXML(){

    const _renderWindow = document.getElementById("musicxml2svg-container");

    if(_renderWindow == null){
        console.error("Couldn't locate the musicxml2svg-container.");
    }

    return FetchMusicXml(_renderWindow, RenderView);
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
            callback(renderWindow,ParseMusicXML(musicXmlRequest.responseText));
        }

        return;
    }
}

// Function responsible for the rendering
// Input: an object which contains:
// 1. renderWindow: HTMLElement
function RenderView(renderWindow, musicXMLObject){

    console.log(musicXMLObject);
}