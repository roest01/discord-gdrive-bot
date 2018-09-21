let fonts = {
    Inconsolata: {
        normal: 'fonts/Inconsolata-Regular.ttf',
        bold: 'fonts/Inconsolata-Bold.ttf'
    }
};

let pdfMake = require("pdfmake");
let PdfPrinter = require("pdfmake/src/printer");
let PdfToImage = require("pdf-image").PDFImage;
let printer = new PdfPrinter(fonts);
let fs = require('fs');


let config = {
    epTarget: 1100
};

const VisualManager = (dates, players, options) => {
    let visualManager = this;
    visualManager.options = options;
    visualManager.players = players;

    this.__construct = function(dates,players) {
        return new Promise(function (resolve, reject) {
            visualManager.drawPDF(dates, players).then(function(pdfPath){
                visualManager.drawImageFromPDF(pdfPath).then(function(pngPath){
                    resolve({
                        pdfPath: pdfPath,
                        pngPath: pngPath
                    })
                }).catch(reject);
            }).catch(reject);
        })
    };

    this.drawPDF = function(dates, players){
        let visualManager = this;

        return new Promise(function (resolve, reject) {
            let targetFile = "pdf/overview.pdf";
            let template = visualManager._createTemplate(dates, players);

            let pdfDoc = printer.createPdfKitDocument(template);
            let writeStream = fs.createWriteStream(targetFile);
            pdfDoc.pipe(writeStream);
            pdfDoc.end();

            writeStream.on('finish', function () {
                resolve(targetFile)
            });
        });
    };

    this.drawImageFromPDF = (path) => {
        return new Promise(function(resolve, reject){
            let pdfImage = new PdfToImage(path, {
                combinedImage: true,
                convertOptions: {
                    "-quality": "100"
                }
            });
            pdfImage.convertFile().then(function(imagePaths){
                resolve(imagePaths);
            }).catch(reject);
        });
    };

    this.getPlayersTable = function(headers, players){
        let playersRow = [
            [] //empty header
        ];

        headers.forEach(function(header){
           playersRow[0].push({
               text: header,
               style: 'tableHeader'
           })
        });

        players.each(function(player){
            if (!!player.name){
                playersRow.push(visualManager.getSinglePlayerRow(player));
            }
        });
        return playersRow;
    };

    this.getSinglePlayerRow = function(player){
        return [
            {text: player.name.toString(), style: "tableBody"},
            {text: player.week1.toString(), style: "tableBody"},
            {text: player.week2.toString(), style: "tableBody"},
            {text: player.week3.toString(), style: "tableBody"},
            {text: player.week4.toString(), style: "tableBody"},
            {text: player.avg.toString(), style: "tableBody"}
            ];
    };

    const CELL_MARGIN = 10;
    const CELL_FONT_SIZE = 26;
    const SIZE = players.count() + 1;

    const PAGE_SIZE = (2 * CELL_MARGIN + CELL_FONT_SIZE + 5) * SIZE + 80;

    this._createTemplate = function(dates, players){
        let visualManager = this;
        return {
            compress: false,
            pageSize: {
                width: 1200,
                height: PAGE_SIZE //+ header
            },
            pageMargins: 40,
            content: [
                {
                    style: 'tableBody',
                    table: {
                        body: this.getPlayersTable(dates, players)
                    },
                    layout: {
                        fillColor: function (rowNr, node, columnNr) {
                            if (!!node.table){
                                let currentRow = node.table.body[rowNr];
                                let currentCol = currentRow[columnNr];
                                let number = currentCol.text.replace('.', '');

                                if (number < config.epTarget){
                                    return visualManager.colorLuminance("FFFFFF", "ea7b75", number / config.epTarget);
                                } else if (!!visualManager.options.markRow){
                                    let currentPlayer = visualManager.players.filter({name:currentRow[0].text});
                                    currentPlayer = currentPlayer.first();

                                    let markRow = visualManager.options.markRow;
                                    if (currentPlayer[markRow.field] === markRow.value){
                                        return "#E8E8E8";
                                    }
                                }

                                return "#FFFFFF";
                            }
                        }
                    }
                }
            ],
            styles: {
                tableHeader: {
                    bold: true,
                    fontSize: CELL_FONT_SIZE,
                    fillColor: "#5a97f2",
                    color: "#ffffff",
                    alignment: "center",
                    margin: [CELL_MARGIN, CELL_MARGIN, CELL_MARGIN, CELL_MARGIN]
                },
                tableBody: {
                    fontSize: CELL_FONT_SIZE,
                    color: 'black',
                    margin: [CELL_MARGIN, CELL_MARGIN, CELL_MARGIN, CELL_MARGIN]
                }
            },
            defaultStyle: {
                font: 'Inconsolata'
            }

        }
    };

    this.colorLuminance = function(color1, color2, ratio) {
        let hex = function(x) {
            x = x.toString(16);
            return (x.length === 1) ? '0' + x : x;
        };

        let r = Math.ceil(parseInt(color1.substring(0,2), 16) * ratio + parseInt(color2.substring(0,2), 16) * (1-ratio));
        let g = Math.ceil(parseInt(color1.substring(2,4), 16) * ratio + parseInt(color2.substring(2,4), 16) * (1-ratio));
        let b = Math.ceil(parseInt(color1.substring(4,6), 16) * ratio + parseInt(color2.substring(4,6), 16) * (1-ratio));

        return "#"+hex(r) + hex(g) + hex(b);
    };

    return this.__construct(dates, players);
};


// export
module.exports = {
    generateDocuments: VisualManager
};