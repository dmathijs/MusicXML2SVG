(function(window){

    function MusicXML2SVG(){
        var _meta = {}

        return _meta;
    }

    // We need that our library is globally accesible, then we save in the window
    if(typeof(window.myWindowGlobalLibraryName) === 'undefined'){
        window.myWindowGlobalLibraryName = MusicXML2SVG();
    }

})(window);