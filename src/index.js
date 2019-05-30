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
                } else { 
                    textItem.str = textItem.str + " "
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


// firebase
const firebase = require("firebase")
require("firebase/firestore")
const get_fbconf = require('./firebase_config.js')
firebase.initializeApp( get_fbconf() )
const fb_fs = firebase.firestore()

// Elm
var page = 1
require('elm-canvas')
const { Elm } = require("./Main.elm")
const elmnode = document.getElementById('elmapp')
const app = Elm.Main.init( { node:elmnode
                           , flags: 1
                           }
                         )

base64ToUint8Array = (base64) => {
    var raw = atob(base64);
    var uint8Array = new Uint8Array(new ArrayBuffer(raw.length));
    for (var i = 0, len = raw.length; i < len; ++i) {
        uint8Array[i] = raw.charCodeAt(i)
    }
    return uint8Array
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
const fb_inc = firebase.firestore.FieldValue.increment(1)
app.ports.sendWordsToFB.subscribe( (ws) => { 
    for( var i in ws ){
        param = {}
        param[ws[i]] = fb_inc
        tgtRef = fb_fs.collection('words').doc("app")
        tgtRef.update( param )
    }
})


var onTextLayer = false
document.getElementById("textLayer")
    .onmouseover = () => { onTextLayer = true }
document.getElementById("textLayer")
    .onmouseleave = () => { onTextLayer = false }

var sOld = ""
document.onmouseup = () => {
    if (onTextLayer){
        var s = String(document.getSelection()).trim()
        l = s.length
        if (0 < l && l < 24 && sOld != s) { 
            app.ports.sendFocusedStr.send( s )
        }
        sOld = s
    }
}

