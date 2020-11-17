var fname = "/postapps/euwaste/data/Final waste sheets.xlsx";

var histViewLink = "http://eeb.org/eu-waste-negotiations-historical-view/";
//original text

var questions = [
    "Supports 65% or higher recycling target for Municipal Solid Waste",
    "Supports binding minimum requirements for extended producer responsibility at EU level, including full cost coverage and modulated fees",
    "Supports a mandatory separate collection of biowaste and/or a biowaste recycling target",
    "Supports specific targets for preparation for reuse of Municipal Solid Waste",
    "Supports waste prevention targets",
    "Supports 10% or higher packaging reuse target"
];
/*
 var questions = [
 "Do you support a 65% recycling target for Municipal Solid Waste, as asked by the European Commission?",
 "Do you support minimum requirements for extended producer responsibility as binding at EU level, including full cost coverage and modulated fees?",
 "Do you support mandatory separate collection of biowaste and/or a biowaste recycling target?",
 "Do you support specific targets for preparation for reuse of Municipal Solid Waste?",
 "Do you support the European Commission must come up with waste prevention targets?",
 "Do you support a packaging reuse target of 10%?"
 ];
 */
var explanatoryText = [
    "A 65% recycling target in all member states would create 530,000 new green jobs by 2030 as well as Ã¢â€šÂ¬72 billion a year in savings for businesses, according the European Commission.",
    "Producers can choose how to integrate a fee into the price of a product to cover its cost of disposal. But we need EU-wide minimum requirements reflecting the repairability, durability and recyclability of products: the more durable the material, the lower the fee.",
    "Food and other biodegradable waste account for 30-50% of all Municipal Solid Waste. When separated and composted, biowaste can be used to enrich our soils, improve the recycling of other waste streams, reduce residual waste and produce green energy such as biomethane.",
    "1/3 of all material arriving at recycling centres can still be reused. EU targets for preparation for reuse would help ensure that these products are given a new life, and at least 300,000 green jobs could be created.",
    "To reduce waste generation we first need to prevent waste by prioritising sharing and reusing, and by avoiding packaging solutions when possible. The best and most cost-effective way to deal with waste is not to produce it in the first place.",
    "A recent study finds that 1 billion litres of mineral water packaged in refillable bottles can create about 5,000 jobs. This is compared to only 1,000 jobs if the same volume of water is packaged in disposable bottles."
];

d3.request(fname)
    .responseType("arraybuffer")
    .response(function(req) {
        var data = new Uint8Array(req.response);
        var arr = new Array();
        for(var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
        var wb = XLSX.read(arr.join(""), {type:"binary"});
        var lastModified = req.getResponseHeader("Last-Modified")
            .split(" ").splice(1,3).join(" ");
        var workbook = {};
        wb.SheetNames.forEach(function(sheetName,i) {
            var roa = XLSX.utils.sheet_to_row_object_array(wb.Sheets[sheetName]);
            if(roa.length > 0){ workbook[sheetName] = roa}
        });

        d3.xml("postapps/euwaste/data/EUwaste_v6.svg",function(err,xml) {
            if (err) throw err;
            var answers =[
                "Yes", "Yes, but...","No","No Response"
            ];
            var countryNames = {
                "AT":"Austria",
                "BE":"Belgium",
                "BG":"Bulgaria",
                "CY":"Cyprus",
                "CZ":"Czech_Republic",
                "DE":"Germany",
                "DK":"Denmark",
                "EE":"Estonia",
                "EL":"Greece",
                "ES":"Spain",
                "FI":"Finland",
                "FR":"France",
                "HU":"Hungary",
                "HR":"Croatia",
                "IE":"Ireland",
                "IT":"Italy",
                "LT":"Lithuania",
                "LU":"Luxembourg",
                "LV":"Latvia",
                "MT":"Malta",
                "NL":"Netherlands",
                "PL":"Poland",
                "PT":"Portugal",
                "RO":"Romania",
                "SE":"Sweden",
                "SI":"Slovenia",
                "SK":"Slovakia",
                "UK":"UK"
            };

            var state = {}; //this variable with hold the state (question & country) so it's available in all scopes

            //these three lines get the svg into the html document
            var importedNode = document.importNode(xml.documentElement, true);
            var img = importedNode.cloneNode(true);
            d3.select("#d3_app").node().appendChild(d3.select(img).select("g#content svg").node());

            d3.select("#d3_app").style("height","600px")


            remakeMain(); //adds some ids and rewrites some of the text
            remakeMap(); //this function has to modify the group structure of the country shapes
                         //so they're consistent across countries. If the set of EU countries changes,
            //this function will have to be modified.

            remakeRightPanel(); //adds some ids and rewrites some of the text
            arrangeButtons(); //adds some ids and rewrites some of the text


            var colorGradient = createGradient(); //create a function that matches the gradient in the legend
            var answerStyles = renameCountryItems(); //get the country icons ready to be handled by d3


            chooseQuestion("recycling",0); //initialize with the first question

            //be ready in case they want the "no response" icon back in the legend
            hideNoResponseLegend = true; // flag for the no Response object in the legend
            if (hideNoResponseLegend) {
                d3.select("#legend #noResponseIcon").style("display","none");
                d3.select(d3.select("#legend").selectAll("text").selectAll("tspan").nodes()[3]).style("display","none");
                d3.select("#legend").select("rect").attr("height",75);
            }

            //behavior for the left buttons
            d3.selectAll("#leftButtons >g.unselected")
                .on("mouseover",function(d,i) {
                    var classes = "recycling epr biowaste reuse wasteprevention packaging wastegeneration".split(" ");
                    d3.event.stopPropagation();
                    var cl = d3.select(this).attr("class").split(" ")[0];
                    //toggle the buttons

                    chooseQuestion(cl,i);

                })//mouseover left buttons
                .on("touch",function(d,i) {
                    var classes = "recycling epr biowaste reuse wasteprevention packaging wastegeneration".split(" ");
                    d3.event.stopPropagation();
                    var cl = d3.select(this).attr("class").split(" ")[0];
                    //toggle the buttons

                    chooseQuestion(cl,i);
                })


            //behavior for the country icons in the vertical list
            d3.selectAll(".countryItem, #map >g")
                .on("mouseover",function(d) {
                    var cl = state.question;
                    var i = state.questionNum;
                    updateCountry(d.name);
                    countryChosen = d3.select("#CountryName").text();
                    d3.select("#Right_-_Country_Detail").style("display",countryChosen?"inline":"none");
                    d3.select("#Waste_Generation_x5F__layer").style("display",(i<6)?"none":"inline");
                    d3.select(d3.select("#Waste_Generation_x5F__layer").selectAll("text").nodes()[6])
                        .style("display",(i==6) && countryChosen?"inline":"none")
                    d3.select("#Generated_by_CSV >text").style("display",(i<6)?"inline":"none");
                });//behavior for country and icons

            /* ............................................................................... */

            function arrangeButtons() {
                //make the selected nodes available

                d3.select("#Left_Nav_-_selected").style("display", "inline");
                //but turn them all off
                d3.selectAll("#Left_Nav_-_selected > g")
                    .style("opacity", 0)
                    .attr("display", null);

                d3.select("text.wastePrevention").attr("class", "wasteprevention"); //correct a type
                var classes = "recycling epr biowaste reuse wasteprevention packaging wastegeneration".split(" ");
                var logoclasses = "eprL wastepreventionL recyclingL reuseL wastegenerationL".split(" ");
                var fullC = classes.concat(logoclasses);
                //assign the class to each group
                d3.selectAll("#Left_Nav_-_unselected >g")
                    .attr("class", function (d, i) {
                        return fullC[i]
                    })
                    .classed("unselected",function(d,i){ return i<7});
                d3.selectAll("#Left_Nav_-_selected >g").classed("selected",true);

                //put all texts, logos, and rectangles into the proper overallgroup for each button
                classes.forEach(function (c) {
                    var str = "#Left_Nav_-_unselected >";
                    var isPath = d3.select(str + "path." + c).size();
                    var isLogo = d3.select(str + "g." + c + "L").size();
                    var isRect = d3.select(str + "rect." + c).size();
                    d3.select(str + "g." + c).node().appendChild(d3.select(str + "text." + c).node());
                    if (isPath) d3.select(str + "g." + c).node().appendChild(d3.select(str + "path." + c).node());
                    while (isLogo) {
                        var isLogo = d3.select("str+g." + c + "L").size();
                        d3.select(str + "g." + c).node().appendChild(d3.select(str + "g." + c + "L").node());
                    }
                    if (isRect) {
                        d3.select(str + "g." + c).node().appendChild(d3.select(str + "rect." + c).node());
                    }

                    d3.select("#Left_Nav_-_selected").node().appendChild(d3.select(str+ "g."+c).node());
                }); //classes.forEach
                d3.select("#Left_Nav_-_unselected").remove();
                d3.select("#Left_Nav_-_selected").attr("id","leftButtons");
            } //arrangeButtons

            function chooseQuestion(cl,i) {
                var buttons = d3.select("#leftButtons");

                //toggle the buttons depending on which question is chosen
                buttons.selectAll("g.selected").style("opacity",0);
                buttons.selectAll("g.unselected").style("opacity",1);
                buttons.select("g."+cl+".selected").style("opacity",1);
                buttons.select("g."+cl+".unselected").style("opacity",0);

                //store which question is chosen
                state.question = cl;
                state.questionNum = i;

                //update the map based on the question
                d3.selectAll("#map > g").each(function(d) {
                    var answer = d["answer"+state.questionNum];
                    d3.select(this).selectAll("path,polygon")
                        .style("fill",(i<6)?answerStyles[answer].fill:colorGradient(d.waste));
                });

                //the last question requires different icons
                if (i<6) {
                    d3.selectAll(".countryItem").select("circle")
                        .style("display","none");
                    d3.selectAll(".countryItem").select(".icon path")
                        .each(function(d) {
                            var answer = d["answer"+state.questionNum];
                            var aa = answerStyles[answer];
                            d3.select(this).attr("d",aa.path)
                                .attr("transform","translate("+(aa.tx)+","+(aa.ty)+")scale(1,-1)")
                                .style("fill",aa.fill);
                            d3.select(this.parentElement).selectAll(".dot").style("display",(answer==1)?"inline":"none");
                        });
                    d3.selectAll(".countryItem").select("g.icon")
                        .style("display","inline");


                    //the explanatory text
                    d3.select("#furtherDescription").selectAll("tspan").remove();
                    var tspans = svgPara(explanatoryText[i],75);

                    d3.selectAll("#furtherDescription")
                        .attr("transform","translate(320,450)")
                        .selectAll("tspan").data(tspans.tspans,function(d) {return d}).enter()
                        .append("tspan")
                        .text(function(d) {return d.text})
                        .attr("x",0)
                        .attr("y",function(d,i) {return i*10})
                        .style("font-size",9)
                        .style("font-family","'Myriad Pro', Helvetica,Verdana, Arial, sans-serif")
                        .style("fill","#6d6e71");


                } else { //the last question
                    d3.selectAll(".countryItem").select("circle")
                        .style("fill",function(d) {return colorGradient(d.waste)})
                        .style("display","inline");
                    d3.selectAll(".countryItem").select("g.icon")
                        .style("display","none");

                    //no explanatory text for this layer?
                    d3.select("#furtherDescription").selectAll("tspan").remove();
                }


                //toggle the layers
                countryChosen = d3.select("#CountryName").text();
                d3.select("#Right_-_Country_Detail").style("display",countryChosen?"inline":"none");
                d3.select("#Waste_Generation_x5F__layer").style("display",(i<6)?"none":"inline");
                d3.select(d3.select("#Waste_Generation_x5F__layer").selectAll("text").nodes()[6])
                    .style("display",(i==6) && countryChosen?"inline":"none")
                d3.select("#Generated_by_CSV >text").style("display",(i<6)?"inline":"none");
                d3.select("#historicalView").style("display",(i<6)?"inline":"none");

                //update the right panel text
                updateCountry(d3.select("#CountryName").text());

            }//chooseQuestion

            function createGradient() {
                var stops = [200,800];
                var colors = ["#ffffff","#04757B"];

                return d3.scaleLinear()
                    .domain(stops)
                    .range(colors);
            }//createGradient

            function findSheet(str) {
                var foundSheet = d3.entries(workbook).map(function(w) {
                    var s = d3.entries(w.value[0]).filter(function(o) {
                        var k = o.key.match(str);
                        return k
                    });

                    if (s.length>0) {
                        return {
                            sheetName: w.key,
                            columnName:s[0].key
                        };
                    }
                    else return null
                });
                return foundSheet.filter(function(d) {return d})[0]
            }

            function getData() {
                var classes = "recycling epr biowaste reuse wasteprevention packaging wastegeneration"
                    .split(" ");

                var theirData  = ["YES", "YES, under certain circumstances","NO", "NO RESPONSE"];
                var theirData2 = ["YES", "YES UCC","NO", "NO RESPONSE"];
                var theirData3 = ["YES", "YES, UCC","NO", "NO RESPONSE"];

                [0,1,2,3,4,5,6].map(function(n) {

                    //rewrite the questions with the new text

                    RR = d3.selectAll("g." + classes[n]).select("text");
                    var header = RR.select("tspan")
                    var tspans = svgPara(questions[n], 37);

                    RR.selectAll("tspan")
                        .filter(function(d,i) {return i!=0}).remove();
                    RR.selectAll("tspan.quest").data(tspans.tspans,function(d,i) {return i}).enter()
                        .append("tspan")
                        .classed("quest",true)
                        .html(function(d) {return d.text})
                        .attr("x",0)
                        .attr("y",function(d,i,arr) {return ((arr.length>4)?8:15)+i*10})
                        .style("font-size",10)
                        .style("fill",function() {
                            var headFill = d3.select(this.parentNode).select("tspan").style("fill");
                            return (headFill=="rgb(255, 255, 255)")?"#FFFFFF":"rgb(109,110,113)"
                        })
                        .style("font-family","'Myriad Pro', Helvetica,Verdana, Arial, sans-serif");

                });
                //this is the dummy data
                var countries = (d3.entries(countryNames)).map(function(d) {
                    //make sure we can handle changes in sheet names and changes in sheet order
                    var o = findSheet("waste generation");
                    d["waste"] = +workbook[o.sheetName]
                        .filter(function(row) {
                            return row.Country== d.key
                        })[0][o.columnName];


                    var o = findSheet("recycling rate");
                    d["recycleRate"] = Math.round((+workbook[o.sheetName]
                                .filter(function(row) {
                                    return row.Country== d.key
                                })[0][o.columnName])*100*100)/100;

                    d["name"] = d.value; delete d.value;

                    d["dates"] = [];
                    sheetNames = d3.keys(workbook);

                    //store answers to the six questions
                    [0,1,2,3,4,5,6].map(function(n) {

                        //initially, I have to do each sheet separately because I don't yet know how the other
                        // sheets will be named and because each of the sheets is formatted differently
                        // and that's changing
                        //I'll try to DRY this later when the data are stable

                        if (n==0) { //recycling
                            var key = sheetNames.filter(function(w) {
                                return w.toLowerCase().match("recycling")
                            })[0];
                            var row = workbook[key]
                                .filter(function(row) {
                                    return row.Country == d.key || row.Country == d.name.replace("_"," ");
                                })[0];
                            var responseKey = d3.keys(row).filter(function(column) {
                                return column.toLowerCase().match("response")
                            })[0]
                            var responseKey = d3.keys(row).filter(function(column) {
                                return column.toLowerCase().match("response")
                            })[0];
                            if (typeof responseKey == "undefined") row[responseKey] = "No Response";
                            var ans = theirData.indexOf(row[responseKey].trim());
                            if (ans==-1) ans = theirData2.indexOf(row[responseKey].trim());
                            if (ans==-1) ans = theirData3.indexOf(row[responseKey].trim());
                            d["answer"+n] =  ans>=0?ans: 3;
                            var countryPosKey = d3.keys(workbook[key][1]).filter(function(d) {return d.match("pos")})[0];
                            d["countryPosn"+n] =  (typeof row[countryPosKey]!="undefined")?row[countryPosKey]:"";
                            d["EEBAssessment"+n] = row["EEB assessment"] || row["NGO assessment"] || row["EEB Assesment"];

                            var dateKey = d3.keys(row).filter(function(k) {return k.toLowerCase().match("date")})[0];
                            if (typeof dateKey !="undefined") {
                                d["dates"][0] = row[dateKey]
                            }
                            else {
                                d["dates"][0] = lastModified;
                            }

                        } else if (n==1)  { //epr corpResp sheets
                            var key = sheetNames.filter(function(w) {
                                return w.toLowerCase().match("corp")
                            })[0];

                            var row = workbook[key]
                                .filter(function(row) {
                                    return row.Country == d.key || row.Country == d.name.replace("_"," ");
                                })[0];
                            var responseKey = d3.keys(row).filter(function(column) {
                                return column.toLowerCase().match("response")
                            })[0];
                            if (typeof responseKey == "undefined") row[responseKey] = "No Response";
                            var ans = theirData.indexOf(row[responseKey].trim());
                            if (ans==-1) ans = theirData2.indexOf(row[responseKey].trim());
                            if (ans==-1) ans = theirData3.indexOf(row[responseKey].trim());
                            d["answer"+n] =  ans>=0?ans: 3;
                            var countryPosKey = d3.keys(workbook[key][0]).filter(function(d) {return d.match("countr")})[0];
                            console.log(n,countryPosKey)
                            d["countryPosn"+n] =  (typeof row[countryPosKey]!="undefined")?row[countryPosKey]:"";
                            d["EEBAssessment"+n] = row["EEB assessment"] || row["NGO assessment"];


                            var dateKey = d3.keys(row).filter(function(k) {return k.toLowerCase().match("date")})[0];
                            if (typeof dateKey !="undefined") d["dates"][1] = row[dateKey]
                            else d["dates"][1] = lastModified;

                        } else if (n==2) { //biowaste sheet
                            var key = sheetNames.filter(function(w) {
                                return w.toLowerCase().match("biowaste")
                            })[0];
                            var row = workbook[key]
                                .filter(function(row) {
                                    return row.Country == d.key || row.Country == d.name.replace("_"," ");
                                })[0];
                            var responseKey = d3.keys(row).filter(function(column) {
                                return column.toLowerCase().match("response")
                            })[0];
                            if (typeof responseKey == "undefined") row[responseKey] = "No Response";
                            var ans = theirData.indexOf(row[responseKey].trim());
                            if (ans==-1) ans = theirData2.indexOf(row[responseKey].trim());
                            if (ans==-1) ans = theirData3.indexOf(row[responseKey].trim());
                            d["answer"+n] =  ans>=0?ans: 3;
                            var countryPosKey = d3.keys(workbook[key][0]).filter(function(d) {return d.match("countr")})[0];
                            console.log(n,countryPosKey)
                            d["countryPosn"+n] = (typeof row[countryPosKey]!="undefined")?row[countryPosKey]:"";
                            d["EEBAssessment"+n] = row["EEB assessment"] || row["NGO assessment"] || row["EEB Assesment"];


                            var dateKey = d3.keys(row).filter(function(k) {return k.toLowerCase().match("date")})[0];
                            if (typeof dateKey !="undefined") d["dates"][2] = row[dateKey]
                            else d["dates"][2] = lastModified;

                        } else if (n==3) { //biowaste sheet
                            var key = sheetNames.filter(function(w) {
                                return w.toLowerCase().match("reuse")
                            })[0];
                            var row = workbook[key]
                                .filter(function(row) {
                                    return row.Country == d.key || row.Country == d.name.replace("_"," ");
                                })[0];
                            var responseKey = d3.keys(row).filter(function(column) {
                                return column.toLowerCase().match("response")
                            })[0];
                            if (typeof responseKey == "undefined") row[responseKey] = "No Response";
                            var ans = theirData.indexOf(row[responseKey].trim());
                            if (ans==-1) ans = theirData2.indexOf(row[responseKey].trim());
                            if (ans==-1) ans = theirData3.indexOf(row[responseKey].trim());
                            d["answer"+n] =  ans>=0?ans: 3;
                            var countryPosKey = d3.keys(workbook[key][0]).filter(function(d) {return d.match("countr")})[0];
                            console.log(n,countryPosKey)
                            d["countryPosn"+n] = (typeof row[countryPosKey]!="undefined")?row[countryPosKey]:"";
                            d["EEBAssessment"+n] = row["EEB assessment"] || row["NGO assessment"] || row["EEB Assesment"];


                            var dateKey = d3.keys(row).filter(function(k) {return k.toLowerCase().match("date")})[0];
                            if (typeof dateKey !="undefined") d["dates"][3] = row[dateKey]
                            else d["dates"][3] = lastModified;

                        } else if (n==4) { //prevention sheet
                            var key = sheetNames.filter(function(w) {
                                return w.toLowerCase().match("prev")
                            })[0];
                            var row = workbook[key]
                                .filter(function(row) {
                                    return row.Country == d.key || row.Country == d.name.replace("_"," ");
                                })[0];

                            var responseKey = d3.keys(row).filter(function(column) {
                                return column.toLowerCase().match("response")
                            })[0];
                            if (typeof responseKey == "undefined") row[responseKey] = "No Response";
                            var ans = theirData.indexOf(row[responseKey].trim());
                            if (ans==-1) ans = theirData2.indexOf(row[responseKey].trim());
                            if (ans==-1) ans = theirData3.indexOf(row[responseKey].trim());
                            d["answer"+n] =  ans>=0?ans: 3;
                            var countryPosKey = d3.keys(workbook[key][0]).filter(function(d) {return d.match("countr")})[0];
                            console.log(n,countryPosKey)
                            d["countryPosn"+n] = (typeof row[countryPosKey]!="undefined")?row[countryPosKey]:"";
                            d["EEBAssessment"+n] = row["EEB assessment"] || row["NGO assessment"] || row["EEB Assesment"];


                            var dateKey = d3.keys(row).filter(function(k) {return k.toLowerCase().match("date")})[0];
                            if (typeof dateKey !="undefined") d["dates"][4] = row[dateKey]
                            else d["dates"][4] = lastModified;


                        } else if (n==5) { //packaging
                            var key = sheetNames.filter(function(w) {
                                return w.toLowerCase().match("packaging")
                            })[0];
                            var row = workbook[key]
                                .filter(function(row) {
                                    return row.Country == d.key || row.Country == d.name.replace("_"," ");
                                })[0];
                            var responseKey = d3.keys(row).filter(function(column) {
                                return column.toLowerCase().match("response")
                            })[0];
                            if (typeof responseKey == "undefined") row[responseKey] = "No Response";
                            var ans = theirData.indexOf(row[responseKey].trim());
                            if (ans==-1) ans = theirData2.indexOf(row[responseKey].trim());
                            if (ans==-1) ans = theirData3.indexOf(row[responseKey].trim());
                            d["answer"+n] =  ans>=0?ans: 3;
                            var countryPosKey = d3.keys(workbook[key][0]).filter(function(d) {return d.match("countr")})[0];
                            console.log(n,countryPosKey)
                            d["countryPosn"+n] = (typeof row[countryPosKey]!="undefined")?row[countryPosKey]:"";
                            d["EEBAssessment"+n] = row["EEB assessment"] || row["NGO assessment"] || row["EEB Assesment"];



                            var dateKey = d3.keys(row).filter(function(k) {return k.toLowerCase().match("date")})[0];
                            if (typeof dateKey !="undefined") d["dates"][5] = row[dateKey]
                            else d["dates"][5] = lastModified;

                        }  else if (n==6) {//waste generation sheet
                            var key = sheetNames.filter(function(w) {
                                return w.toLowerCase().match("wastegen")
                            })[0];
                            var row = workbook[key]
                                .filter(function(row) {
                                    return row.Country == d.key || row.Country == d.name.replace("_"," ");
                                })[0];
                            var countryPosKey = d3.keys(workbook[key][0]).filter(function(d) {return d.match("countr")})[0];
                            console.log(n,countryPosKey)
                            d["countryPosn"+n] = (typeof row[countryPosKey]!="undefined")?row[countryPosKey]:"";
                            d["EEBAssessment"+n] = row["EEB assessment"] || row["NGO assessment"] || row["EEB Assesment"];

                            var dateKey = d3.keys(row).filter(function(k) {return k.toLowerCase().match("date")})[0];
                            if (typeof dateKey !="undefined") d["dates"][6] = row[dateKey]
                            else d["dates"][6] = lastModified;

                        }
                    });
                    return d
                });
                return countries
            }

            function iconInformation() {
                d3.select(d3.selectAll("#legend > path").nodes()[0]).attr("id","yesIcon");
                d3.select(d3.selectAll("#legend > path").nodes()[1]).attr("id","noIcon");
                d3.select(d3.selectAll("#legend > path").nodes()[2]).attr("id","noResponseIcon");
                d3.select(d3.selectAll("#legend > g").nodes()[1]).attr("id","yesButIcon");
                //get the colors from these icons

                var paths = [ //  "YES", "YESAND", "NO","NORESPONSE"
                    "m 0,0 -0.009,0 c -0.006,0 -0.012,0 -0.018,0 -1.806,0 -3.528,-0.867 -4.607,-2.317 -0.741,-0.994 -1.133,-2.178 -1.133,-3.422 0,-1.095 0.311,-2.161 0.898,-3.081 0.571,-0.896 1.376,-1.615 2.327,-2.079 0.789,-0.385 1.633,-0.58 2.515,-0.58 0.006,0 0.012,0 0.017,10e-4 l 0.009,0 c 3.149,0.015 5.713,2.589 5.713,5.739 C 5.712,-2.589 3.149,-0.016 0,0 m 3.396,-4.522 -3.6,-3.6 c -0.04,-0.04 -0.084,-0.076 -0.132,-0.107 -0.134,-0.088 -0.29,-0.136 -0.452,-0.136 -0.22,0 -0.427,0.087 -0.583,0.243 l -2.08,2.079 c -0.321,0.322 -0.321,0.845 0,1.167 0.157,0.156 0.364,0.243 0.584,0.243 0.221,0 0.428,-0.087 0.584,-0.243 l 1.496,-1.497 3.017,3.018 c 0.155,0.156 0.363,0.242 0.583,0.242 0.22,0 0.428,-0.086 0.583,-0.242 0.156,-0.156 0.242,-0.362 0.241,-0.583 10e-4,-0.221 -0.085,-0.428 -0.241,-0.584",
                    "m 0,0 c -3.097,-0.044 -5.795,-2.58 -5.75,-5.75 0.044,-3.17 2.579,-5.705 5.75,-5.75 3.095,0.045 5.794,2.58 5.749,5.75 C 5.704,-2.654 3.169,0.045 0,0", //just the circle//no
                    "m 0,0 c 0.306,-0.306 0.306,-0.812 0,-1.119 -0.042,-0.041 -0.074,-0.072 -0.116,-0.114 -0.306,-0.306 -0.811,-0.306 -1.117,0 -0.35,0.349 -0.696,0.695 -1.044,1.043 -0.346,-0.348 -0.692,-0.694 -1.043,-1.043 -0.305,-0.306 -0.81,-0.306 -1.117,0 -0.042,0.042 -0.073,0.073 -0.116,0.114 -0.306,0.307 -0.306,0.813 0,1.119 0.35,0.35 0.696,0.696 1.044,1.044 -0.348,0.346 -0.694,0.693 -1.044,1.042 -0.166,0.165 -0.236,0.352 -0.234,0.531 -0.015,0.196 0.051,0.404 0.234,0.587 0.043,0.042 0.074,0.073 0.116,0.115 0.307,0.306 0.812,0.306 1.117,0 0.351,-0.35 0.697,-0.695 1.043,-1.044 0.348,0.349 0.694,0.694 1.044,1.044 0.306,0.306 0.811,0.306 1.117,0 L 0,3.204 C 0.306,2.898 0.306,2.392 0,2.086 -0.351,1.737 -0.696,1.39 -1.043,1.044 -0.696,0.696 -0.351,0.35 0,0 m -2.279,6.793 c -3.097,-0.044 -5.795,-2.58 -5.75,-5.75 0.045,-3.17 2.579,-5.706 5.75,-5.75 3.095,0.044 5.794,2.58 5.749,5.75 -0.045,3.096 -2.58,5.794 -5.749,5.75",//noReponse
                    "m 0,0 c 0,0 -0.073,-0.025 -0.073,-0.068 l 0,-0.592 c 0,-0.987 -1.481,-0.987 -1.481,0 l 0,0.592 c 0.008,0.671 0.44,1.262 1.078,1.471 0.44,0.149 0.731,0.568 0.717,1.032 C 0.212,3.003 -0.254,3.453 -0.825,3.46 -1.227,3.457 -1.593,3.222 -1.766,2.857 -1.944,2.489 -2.387,2.334 -2.754,2.513 L -2.743,2.512 C -3.112,2.69 -3.267,3.133 -3.089,3.5 c 0.416,0.874 1.294,1.431 2.26,1.437 l 0.015,0 C 0.553,4.923 1.668,3.837 1.719,2.471 1.754,1.358 1.056,0.354 0,0 m -1.34,-3.014 c -0.47,0.47 -0.138,1.27 0.526,1.27 0.41,0 0.744,-0.334 0.744,-0.744 0,-0.663 -0.803,-0.995 -1.27,-0.526 m 0.618,9.603 c -3.09,-0.044 -5.782,-2.574 -5.737,-5.737 0.044,-3.165 2.574,-5.695 5.737,-5.739 3.091,0.044 5.784,2.574 5.74,5.739 -0.045,3.088 -2.576,5.782 -5.74,5.737"
                ];

                return [
                    {text:"Yes",icon:"yesIcon",fill:"rgb(152, 199, 71)",path:paths[0],tx:-8,ty:-10},
                    {text:"Yes, but...",icon:"yesButIcon",fill:"#F0DF7C",path:paths[1],tx:-8,ty:-10},
                    {text:"No",icon:"noIcon",fill:"rgb(209,68,79)",path:paths[2],tx:-6,ty:-4},
                    {text:"No Reponse",icon:"noResponseIcon",fill:"url('#SVGID_91_')",path:paths[3],tx:-8,ty:-4}
                ];

            }//iconInformation

            function remakeMain() {
                d3.select("#Background__x28_static_items_x29_").select("text")
                    .text("Who is supporting the Circular Economy?");

                d3.select(d3.select(d3.selectAll("#Background__x28_static_items_x29_ >text").nodes()[3]).selectAll("tspan").nodes()[1])
                    .text("we reveal where EU governments stand");

                d3.select("#historicalView")
                    .style("cursor","pointer")
                    .on("click",function() {
                        window.open(histViewLink,"_blank").focus();
                    })
            }
            function remakeMap() {
                d3.selectAll("text,tspan")
                    .style("font-family","'Myriad Pro', Helvetica,Verdana, Arial, sans-serif");
                d3.select("#EU-28_Countries_1_").attr("id","map");
                d3.select("#dataUpdated").style("display","inline");
                var b = d3.selectAll("#Background__x28_static_items_x29_ >g");
                d3.select(b.nodes()[8]).remove();
                d3.select(b.nodes()[7]).remove();
                d3.select(b.nodes()[6]).remove();
                d3.select(b.nodes()[5]).remove();
                d3.select(b.nodes()[3]).remove();
                d3.selectAll("#Background__x28_static_items_x29_ >path").remove();
                d3.select("doNotUse_x5F_SELECTED_-_EU-28").remove();
                d3.select("svg").attr("width","100%");
                //    window.scrollTo(0,d3.select("#Background__x28_static_items_x29_").node().getBoundingClientRect().top);


                d3.select(d3.select("#Background__x28_static_items_x29_").selectAll("text").nodes()[2])
                    .attr("id","furtherDescription");

                var countriesP = "Belgium Portugal Luxembourg Slovenia Austria Poland Slovakia Hungary Bulgaria Romania Lithuania Latvia Finland Cyprus";
                countriesP.split(" ").forEach(function(c) {
                    var newG = d3.select("#map").append("g").attr("id",c);
                    newG.node().appendChild(d3.select("#map > path#"+c+"_1_").node());
                });

                var newPoly = d3.select("#map").append("g").attr("id","Czech_Republic");
                newPoly.node().appendChild(d3.select("#map > polygon#Czech_Republic_1_").node());

                d3.select("#map").select("#Italy_2_").attr("id","Italy");
                var countriesG = "Netherlands France Croatia Spain UK Ireland Greece Estonia Germany Denmark Sweden";
                countriesG.split(" ").forEach(function(c) {
                    d3.select("#map").select("g#"+c+"_1_").attr("id",c);
                });

                var wasteL = d3.select("#Waste_Generation_x5F__layer")
                d3.select(d3.selectAll("#Waste_Generation_x5F__layer >g").nodes()[3]).remove();
                wasteL.select("#Belgium_4_").remove();
                wasteL.select("#static_x5F_Countries_x5F_ALL_1_").remove();
                d3.select(d3.selectAll("#Waste_Generation_x5F__layer >text").nodes()[2]).remove();

                //we're going to change the size of the masking rectangle so it just covers the legend
                d3.select(d3.selectAll("#Waste_Generation_x5F__layer >rect").nodes()[1]).attr("height",100).attr("x",290).attr("width",200)

                wasteL.select("g").selectAll("path").remove(); //these are the circles; we need
                //to build our own and put them in the proper order

                //this is the rectangle that was covering up the stuff.
                //removing it means we can use the same map

                d3.select("#Generated_by_CSV").select("g").remove();

                d3.select(d3.select("#Waste_Generation_x5F__layer").selectAll("g").nodes()[1])
                    .attr("id","wasteLegend");

                d3.select(d3.select("#wasteLegend").selectAll("text").nodes()[1])
                    .attr("id","wasteText")
                    .style("display","none");

                d3.select("#wasteLegend").select("line")
                    .attr("id","wasteLine")
                    .style("display","none");

                //reorder the logos in the upper right

                d3.selectAll("image")
                    .attr("id",function(d,i) {return "img"+i});
                d3.select("#img0")
                    //    .attr("transform","matrix(0.109 0 0 0.109 650 7.7139)");
                    .attr("xlink:href","/postapps/euwaste/data/EEB_logo_RGB_s.jpg")
                    .attr("transform","matrix(0.15 0 0 0.15 650 2.5)");

                d3.select("#img1")
                    .attr("transform","matrix(0.0336 0 0 0.0336 756.0518 9.8804)")
                d3.select("#img2")
                    .attr("transform","matrix(0.155 0 0 0.155 850 5.4233)");

            }//remakeMap

            function remakeRightPanel() {
                d3.select("#Right_-_Country_Detail").selectAll("text")
                    .filter(function() {return d3.select(this).attr("transform").match("183.93")})
                    .text("Country position");
                d3.select("#Right_-_Country_Detail").selectAll("text")
                    .filter(function() {return d3.select(this).attr("transform").match("284.7603")})
                    .text("Our assessment");

                d3.select("#Right_-_Country_Detail").style("display","none");
                d3.select("#Waste_Generation_x5F__layer").style("display","none");
                d3.select("#CountryName").text("");
                d3.select("#Waste_Generation_x5F__layer >path").remove();

                var circ =d3.select("#Waste_Generation_x5F__layer")
                    .append("g")
                    .attr("id","bigIcon")
                    .append("circle")
                    .attr("r",18).attr("cy",134).attr("cx",678.5)
                    .style("display","none");

                d3.select(".moveRight").attr("transform","matrix(1 0 0 1 675,388)");
                d3.select(d3.selectAll(".moveRight").nodes()[1]).attr("transform","matrix(1 0 0 1 675,460)")

                d3.select("#Right_-_Country_Detail").select("path#bigIcon").remove();
                d3.select("#Right_-_Country_Detail").selectAll(".bigIconDots").remove();

                d3.select("#Right_-_Country_Detail").append("g")
                    .attr("id","bigIcon");
            }//remakeRightPanel

            function renameCountryItems() {
                var str = "#Background__x28_static_items_x29_";
                d3.select(d3.select(str).selectAll("text").nodes()[1]).attr("id","countryCodes");
                d3.select(d3.selectAll(str+" > g").nodes()[3]).attr("id","legend");
                var answerStyles = iconInformation(); //assigns id's to the icons so we can reuse them

                d3.select("#legend").select("text").text("Country position");
                d3.select("#legend").select("rect").attr("width",110);

                var ySet = [];
                d3.select("#countryCodes").selectAll("tspan").each(function() {
                    ySet.push(+d3.select(this).attr("y")); //things are currently spaced 15.97 apart
                });

                var countries  = getData();

                countries.forEach(function(country) {
                    d3.select("#map").select("#"+country.name).datum(country)
                });

                var countryItems = d3.select(str).append("g")
                    .attr("id","countrySet")
                    .attr("transform","matrix(1 0 0 1 261.314 71.1616)")
                    .selectAll("g.countryItem").data(countries).enter()
                    .append("g").classed("countryItem",true)
                    .attr("transform",function(d,i) {return "translate(0,"+(i*15.97)+")"});

                //we have to change the icons
                var Dot = "m 0,0 c 0,-0.47 -0.38,-0.85 -0.85,-0.85 -0.469,0 -0.85,0.38 -0.85,0.85 0,0.469 0.381,0.851 0.85,0.851 C -0.38,0.851 0,0.469 0,0";
                AA = answerStyles;

                countryItems.append("circle")
                    .attr("r",6.2)
                    .attr("cx",-9)
                    .attr("cy",-4)
                    .style("display","none");

                countryItems.append("rect")
                    .attr("height",15.97)
                    .attr("width",50)
                    .attr("y",-12)
                    .attr("x",-20)
                    .style("fill","white")
                    .style("opacity",1e-6);

                countryItems.append("g")
                    .classed("icon",true)
                    .append("path");
                countryItems.select(".icon").selectAll(".dot")
                    .data([0,1,2]).enter().append("path")
                    .classed("dot",true)
                    .attr("d","m 0,0 c 0,-0.47 -0.38,-0.85 -0.85,-0.85 -0.469,0 -0.85,0.38 -0.85,0.85 0,0.469 0.381,0.851 0.85,0.851 C -0.38,0.851 0,0.469 0,0")
                    .attr("transform",function(d,i) {return "translate("+((2.575)*(1-i)-7.25)+",-4)"})
                    .style("display","none")
                    .style("fill","#6d6e71");

                return answerStyles
            } //renameCountryItems
            //figure out the indices of the other text that has to be shown
            //for the elaborations

            //convert a string of text into a paragraph for svg
            function svgPara(text,L) {
                var lines = [{text:""}];
                if (text) {
                    //first look for links and remove that text for splitting purposes
                    //then keep track of the links in an array with the text context that it should appear
                    //around
                    //need to handle cases where the text is split and the index of it
                    //for that reason it would be best to handle the links during the splitting loop.

                    //this find each markdown pattern for a link
                    var regexPattern = /\[[^\]]+\]\(\s*(http|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?\)/g;
                    links = text.match(regexPattern);

                    //they've put some spaces into the markdown. get rid of them
                    text = text.replace(/\]\(\s/g,"](");
                    text = text.replace(/\/\sw{3,3}/g,"/www");
                    text = text.replace(/w{3,3}\.\s/g,"www.");
                    var words = text.split(/\s/g);
                    var j = 0;
                    var linkNum = 0;
                    var openLink = false;
                    var linkSet = [];
                    words.forEach(function(w,i) {
                        var link = "";
                        //check about link
                        if (w[0]=="[" && !openLink) { //start a new Link
                            openLink = true;
                            w = w.slice(1);
                            w = "<tspan id='link"+linkNum+"'>"+w;
                            linkNum++;
                            //first word in link
                        }
                        if (w.match(/\]\(/) && openLink) {
                            //last word in the link
                            var splt = w.split(/\]\(/);
                            if (splt[0].length>L+7) splt[0] = splt[0].slice(0,L+7)+"...";
                            var lastChar = splt[1][splt[1].length-1];
                            var prevChar = splt[1][splt[1].length-2];
                            if (prevChar==")" && lastChar!=")") {
                                splt[0] = splt[0].concat(lastChar);
                                splt[1] = splt[1].slice(0,splt[1].length-1);
                            }
                            w = splt[0]+"</tspan>";
                            linkSet.push(splt[1].slice(0,splt[1].length-1));
                            openLink = false;
                        };

                        var teststr = lines[j].text+w+" ";
                        var checkLength = teststr.replace(/<tspan id='link[0-9]+'>/g,"").replace(/<\/tspan>/g,"");
                        if (checkLength.length<=L)   { //can add on this word
                            if (links && links.indexOf(w)>-1) {
                                obj = {};
                                if (teststr.length>L) teststr = teststr.slice(0,L-4)+"..."
                                obj.text = teststr;
                                lines[j] = obj;
                            }
                            else {
                                lines[j] = {text:teststr};
                            }
                        } else { //start a new line
                            if (openLink) {
                                lines[j].text += "</tspan>"; //close off the old one
                                w = "<tspan id='link"+(linkNum-1)+"'>"+w;
                            }
                            j += 1;
                            lines[j] = {text:w+" "};
                        }
                    });
                }
                lines = lines.filter(function(line) {
                    return line.text.trim()!=""
                });
                return {tspans:lines,links:linkSet}
            }//svgPara

            //called when a country is changed
            function updateCountry(c) {
                if (c) {
                    d3.select("#CountryName").text(c.replace("_"," "))
                        .style("font-family","'Myriad Pro', Helvetica,Verdana, Arial, sans-serif");

                    if (c=="Czech Republic")  c = "Czech_Republic";
                    var dat = d3.selectAll(".countryItem").filter(function(d) {
                        return d.name==c
                    }).datum();

                    if (state.questionNum < 6) {
                        //what's the answer?
                        var answer = dat["answer" + state.questionNum];

                        //fill in the text
                        d3.select("#answer1").text(answerStyles[answer].text)
                            .style("font-family","'Myriad Pro', Helvetica,Verdana, Arial, sans-serif");
                        d3.select("#answer2").style("display", answer == 1 ? "inline" : "none")
                            .style("font-family","'Myriad Pro', Helvetica,Verdana, Arial, sans-serif");

                        //create the big Icon on the right
                        d3.select("g#bigIcon").select("g.icon, .dot").remove();
                        var icon = d3.selectAll(".countryItem").filter(function (d) {
                            return d.name == c
                        })
                            .select(".icon").node();
                        var ii = icon.cloneNode(true);
                        d3.select(ii).attr("transform", "scale(3.45)");
                        d3.select("#Right_-_Country_Detail").select("g#bigIcon").node().appendChild(ii);
                        d3.select("#Right_-_Country_Detail").select("g#bigIcon")
                            .attr("transform", "translate(710,152)");
                        d3.select("g#bigIcon").selectAll(".dot")
                            .style("display",(answer==1)?"inline":"none")
                            .style("fill","#6d6e71");

                        d3.select("#dataUpdated").text("Data updated "+dat.dates[state.questionNum])
                    }
                    else {
                        d3.select("#Waste_Generation_x5F__layer").select("g#bigIcon circle")
                            .style("display", "inline")
                            .style("fill", colorGradient(dat.waste))
                            .style("stroke", colorGradient(Math.max(dat.waste, 400)))
                        d3.select(d3.selectAll("#Waste_Generation_x5F__layer >text").nodes()[2])
                            .text(dat.waste + " kg/capita per year")
                            .style("font-family","'Myriad Pro', Helvetica,Verdana, Arial, sans-serif");
                    }
                    var r = d3.select("#wasteLegend").select("rect");
                    var legendScale = d3.scaleLinear()
                        .range([304.637,485.9866])
                        .domain([200,800]);
                    var xp = legendScale(dat.waste);
                    d3.select("#wasteLine")
                        .transition().duration(200)
                        .attr("x1",xp)
                        .attr("x2",xp)
                        .style("display","inline");

                    d3.select("#wasteText")
                        .text(dat.waste)
                        .attr("text-anchor","middle")
                        .transition().duration(200)
                        .attr("transform","translate("+xp+",129.55)")
                        .style("display","inline")
                        .style("font-family","'Myriad Pro', Helvetica,Verdana, Arial, sans-serif");
                    d3.select("#Right_-_Country_Detail").select("#XXXKGperYear")
                        .text(dat.waste+ " (kg/capita per year)")
                        .style("font-family","'Myriad Pro', Helvetica,Verdana, Arial, sans-serif");
                    d3.select("#Right_-_Country_Detail").select("#XXRecyclingRate")
                        .text(dat.recycleRate+"%")
                        .style("font-family","'Myriad Pro', Helvetica,Verdana, Arial, sans-serif");

                    var rightScale = d3.scaleLinear()
                        .domain([0,1000])
                        .range([0,218]);
                    var recycleKg = dat.waste*dat.recycleRate/100;
                    d3.select("rect#wasteGeneration")
                        .transition().duration(200)
                        .attr("width",rightScale(dat.waste));
                    d3.select("rect#recyclingRate")
                        .transition().duration(200)
                        .attr("width",rightScale(recycleKg));

                    var points =d3.select("#recyclingLine").attr("points").split(",");
                    points[0] = ""+(rightScale(recycleKg)+(+d3.select("rect#wasteGeneration").attr("x")));
                    d3.select("#recyclingLine")
                        .transition().duration(200)
                        .attr("points",points.join(","));

                    var L = 40;
                    var tspans = svgPara(dat["countryPosn"+state.questionNum],L);
                    d3.select("#CountryPosition").selectAll("tspan").remove();
                    d3.select("#CountryPosition")
                        .selectAll("tspan").data(tspans.tspans,function(d,i) {return i}).enter()
                        .append("tspan")
                        .html(function(d) {return d.text})
                        .attr("x",0)
                        .attr("y",function(d,i) {return i*10})
                        .style("font-size",12)
                        .style("fill","#696E71")
                        .style("font-family","'Myriad Pro', Helvetica,Verdana, Arial, sans-serif");

                    if (tspans.links) {
                        d3.select("#CountryPosition").selectAll("tspan >tspan")
                            .style("text-decoration","underline")
                            .style("cursor","pointer")
                            .on("click",function(d) {
                                var id = d3.select(this).attr("id").replace("link","");
                                if (tspans.links[id].match(/\]\(/)) {
                                    var link = tspans.links[id]
                                        .split(/\]\(/)[1]
                                        .replace(/\)$/,"");
                                } else link = tspans.links[id];

                            });
                    }

                    var L = 40;
                    var tspans = svgPara(dat["EEBAssessment"+state.questionNum],L);
                    d3.select("#EEBAssessment").selectAll("tspan").remove();
                    d3.select("#EEBAssessment")
                        .selectAll("tspan").data(tspans.tspans,function(d,i) {return i}).enter()
                        .append("tspan")
                        .html(function(d) {return d.text})
                        .attr("x",0)
                        .attr("y",function(d,i) {return i*10})
                        .style("font-size",12)
                        .style("fill","#696E71")
                        .style("font-family","'Myriad Pro', Helvetica,Verdana, Arial, sans-serif");
                    if (tspans.links) {
                        d3.select("#EEBAssessment").selectAll("tspan > tspan")
                            .style("text-decoration","underline")
                            .style("cursor","pointer")
                            .on("mouseover",function(d) {
                                id = d3.select(this).attr("id").replace("link","");
                                if (tspans.links[id].match(/\]\(/)) {
                                    var link = tspans.links[id]
                                        .split(/\]\(/)[1]
                                        .replace(/\)$/,"");
                                } else link = tspans.links[id];
                                console.log(link,tspans.links[id])
                            })
                            .on("click",function(d) {
                                var id = d3.select(this).attr("id").replace("link","");
                                if (tspans.links[id].match(/\]\(/)) {
                                    var link = tspans.links[id]
                                        .split(/\]\(/)[1]
                                        .replace(/\)$/,"");
                                } else link = tspans.links[id];

                                window.open(link,"_blank").focus();
                            });
                    }
                }
            }//updateCountry
        });
    }).get();
