let fonts = {
    Inconsolata: {
        normal: 'fonts/Inconsolata-Regular.ttf',
        bold: 'fonts/Inconsolata-Bold.ttf'
    }
};

let pdfMake = require("pdfmake");
let PdfPrinter = require("pdfmake/src/printer");
let printer = new PdfPrinter(fonts);
let fs = require('fs');


let config = {
    epTarget: 1100
};

const VisualManager = (dates, players) => {
    let visualManager = this;

    this.drawPDF = function(dates, players){
        let template = this._createTemplate(dates, players);

        let pdfDoc = printer.createPdfKitDocument(template);
        pdfDoc.pipe(fs.createWriteStream('pdf/visual.pdf'));
        pdfDoc.end();
        return 'pdf/visual.pdf';
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

        players.forEach(function(player){
            playersRow.push(visualManager.getSinglePlayerRow(player));
        });
        return playersRow;
    };

    this.getSinglePlayerRow = function(player){
        return [player.name, player[1], player[2], player[3], player[4], player['avg'] ];
    };

    this._createTemplate = function(dates, players){
        return {
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
                                    return "#ff0000";
                                }
                            }
                            //return '#'+Math.floor(Math.random()*16777215).toString(16);
                            //return (row % 2 === 0) ? '#CCCCCC' : null;
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
                    margin: [2, 0, 2, 0]
                },
                tableBody: {
                    fontSize: 15,
                    color: 'black'
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

    return this.drawPDF(dates, players);
};


// export
module.exports = {
    visualManager: VisualManager
};