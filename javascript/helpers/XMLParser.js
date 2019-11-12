import X2JS from "x2js"

// Transforms the raw xml into an object
export default function XMLParser(){
    this.x2js = new X2JS();
    this.ParseFromXml = ParseFromXml;
    this.ParseToXml = ParseToXml;
}

function ParseFromXml(data){
    return this.x2js.xml2js(data)
}

function ParseToXml(data){
    return this.x2js.js2xml(data)
}