import RenderXML from "./javascript/controllers/renderingcontroller";

(function(window){

    function MusicXML2SVG(){
        // Initialize the rendering
        RenderXML();
        // To be extended..
    }

    // We need that our library is globally accesible, then we save in the window
    if(typeof(window.myWindowGlobalLibraryName) === 'undefined'){
        window.myWindowGlobalLibraryName = MusicXML2SVG();
    }

})(window);