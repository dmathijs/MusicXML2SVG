# MusicXML2SVG

An ECMAScript 6 Javascript library for converting MusicXML to SVG

## Introduction

The goal of this library is to plublicly develop a minimal library that can render svg directly from a MusicXML file.

The svg will be rendered in a container of type:
```html
<div id="musicxml2svg-container" data-src=" ... link to musixcml file ... ">
    <!-- Place where svg will be rendered--->
</div>
```

Ultimately the goal is to make the library as flexible and extensible as possible in order to allow for additional functionality like audio players, ..

## Roadmap

| Step        | Goal           | Finished  |
| ------------- |:-------------:| -----:|
| 1     | Render full, half, quarter and eight notes in G Major Key | [ ] |
| 2     | Render rests and all type of notes in G Major Key      | [ ] |
| 3     | TBD      | [ ] |


## Setup for contributors

1. Clone the repository to your local computer.
2. Run npm install to install all dependencies.
3. Develop and run "npm run build" to make webpack perform its magic.
4. Run http-server in the root of the repository to get an overview of all available examples
5. For improvements, feel free to make a PR