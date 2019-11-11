// Transforms the raw xml into an object
export default function ParseMusicXML(rawMusicXML){
    const parser = new DOMParser();
    return parser.parseFromString(rawMusicXML, "text/xml");
}