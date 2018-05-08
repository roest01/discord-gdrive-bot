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

const VisualManager = (dates, players) => {
    let visualManager = this;

    this.__construct = function(dates,players) {
        return new Promise(function (resolve, reject) {
            visualManager.drawPDF(dates, players).then(function(pdfPath){
                visualManager.drawImageFromPDF(pdfPath).then(function(pngPath){
                    resolve({
                        pdfPath: pdfPath,
                        pngPath: pngPath
                    })
                });
            });
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
            });
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
            playersRow.push(visualManager.getSinglePlayerRow(player));
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

    this._createTemplate = function(dates, players){
        return {
            compress: false,
            pageSize: {
                width: 2480,
                height: 118 * (players.count() + 2) //+ header
            },
            pageMargins: 40,
            content: [
                {
                    style: 'tableBody',
                    table: {
                        body: this.getPlayersTable(dates, players)
                    },
                    layout: {
                        fillColor: function (row, node, column) {
                            if (!!node.table){
                                let currentCol = node.table.body[row][column];
                                let number = currentCol.text.replace('.', '');
                                if (number < config.epTarget){
                                    return visualManager.colorLuminance("FFFFFF", "ea7b75", number / config.epTarget);
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
                    fillColor: "#5a97f2",
                    color: "#ffffff",
                    alignment: "center",
                    margin: [20, 20, 20, 20]
                },
                tableBody: {
                    fontSize: 65,
                    color: 'black',
                    margin: [20, 20, 20, 20]
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