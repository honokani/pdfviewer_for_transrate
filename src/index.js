require('./index.html')
require('./main.sass')


var pdfjsLib = require('./pdf/pdf.js')
pdfjsLib.workerSrc = require('./pdf/pdf.worker.js')


var loadPage = (d, p) => {
    var scale = 1.4
    pdfjsLib.getDocument(d)
    .then( (pdf) => {
        console.log('PDF loaded')
        return pdf.getPage(p)
    })
    .then( (page) => {
        console.log('Page loaded')
        var viewport = page.getViewport(scale)
        var canvas = document.getElementById('the-canvas')
        var context = canvas.getContext('2d')
        canvas.height = viewport.height
        canvas.width = viewport.width
        var renderContext = { canvasContext: context
                            , viewport: viewport
                            }
        return page.render(renderContext)
        .then( () => {
            console.log('Got Texts')
            return page.getTextContent();
        })
        .then( (textContent) => {
            var textLayerDiv = document.getElementById('textLayer')
            while (textLayerDiv.firstChild) {
                textLayerDiv.removeChild(textLayerDiv.firstChild)
            }
            textContent.items.forEach( (textItem) => {
                var tx = pdfjsLib.Util.transform(
                    pdfjsLib.Util.transform(viewport.transform, textItem.transform),
                    [1, 0, 0, -1, 0, 0]
                )
                var style = textContent.styles[textItem.fontName]
                var fontSize = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]))
                if (style.ascent) {
                    tx[5] -= fontSize * style.ascent
                } else if (style.descent) {
                    tx[5] -= fontSize * (1 + style.descent)
                } else {
                    tx[5] -= fontSize / 2
                }

                if (textItem.width > 0) {
                    context.font = tx[0] + 'px ' + style.fontFamily
                    var width = context.measureText(textItem.str).width
                    if (width > 0) {
                        tx[0] = (textItem.width * viewport.scale) / width
                    }
                }

                var item = document.createElement('div')
                l = textItem.str.length - 1
                if (textItem.str[l] == "-") { 
                    textItem.str = textItem.str.substr(0,l)
                }
                item.textContent = textItem.str
                item.style.fontFamily = style.fontFamily;
                item.style.fontSize = fontSize + 'px';
                item.style.transform = 'scaleX(' + tx[0] + ')';
                item.style.left = tx[4] + 'px';
                item.style.top = tx[5] + 'px';

                textLayerDiv.appendChild(item);
            })



            //pdfjsLib.renderTextLayer(
            //    { textContent: textContent
            //    , container: textLayerDiv[0]
            //    , viewport: viewport
            //    , textDivs: []
            //    }
            //)
        }).then( () => {
            console.log('Page rendered')
        })
    })
}

// Elm
var page = 1

require('elm-canvas')
const { Elm } = require("./Main.elm")
const elmnode = document.getElementById('elmapp')
const app     = Elm.Main.init( { node:elmnode
                               , flags: 1
                               }
                             )

base64ToUint8Array = (base64) => {
    var raw = atob(base64);
    var uint8Array = new Uint8Array(new ArrayBuffer(raw.length));
    for (var i = 0, len = raw.length; i < len; ++i) {
        uint8Array[i] = raw.charCodeAt(i);
    }
    return uint8Array;
}

var pdfurl = ""
app.ports.loadPdfFile.subscribe( (url) => {
    pdfurl = url
    loadPage(pdfurl, page)
})
app.ports.pageIncrease.subscribe( (p) => { 
    loadPage(pdfurl, p)
})
app.ports.pageDecrease.subscribe( (p) => { 
    loadPage(pdfurl, p)
})


var onTextLayer = false
document.getElementById("textLayer")
    .onmouseover = () => { onTextLayer = true }
document.getElementById("textLayer")
    .onmouseleave = () => { onTextLayer = false }

var sOld = ""
document.onmouseup = () => {
    if (onTextLayer){
        var s = String(document.getSelection())
        l = s.length
        if (0 < l && l < 20 && sOld != s) { 
            app.ports.sendFocusedStr.send( s )
        }
        sOld = s
    }
}

