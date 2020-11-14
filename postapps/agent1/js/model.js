//this is the model
function runSimulation(nodes,obj) {


    updateMarketRents();

    makeDecision();
    newRental();
    moveOut();
    makeReady();
    madeReady();

    moveIn();

    if (d3.timeMonth(obj.currentDate)-obj.currentDate==0) {
        kickOut();
    }
    updateOccupancy();


    //increment the time
    obj.currentDate = d3.timeDay.offset(obj.currentDate, 1);

    /*              simulation functions    */
    function updateMarketRents(){

        if (d3.timeYear(obj.currentDate)-obj.currentDate ==0) {
            clearFilters(obj);

            var actOn = getSet(obj);
            actOn.forEach(function(d) {
                d["Total Market Rent"] *=(1+0.03);
            });
            updateCrossfilter(actOn,obj);
        }
    }//update

    function makeDecision() {

        //for occupied units where the renewal status is undecided
        obj.crossfilter.dims["Status"].filter("OC");
        obj.crossfilter.dims["Renewal Status"].filter("Undecided");


        obj.crossfilter.dims["Lease End Date Current Lease"].filter(function(d) {
            return d3.timeDay.count(obj.currentDate, d) == get("avg-notice-lead-days");

        });

        //this is the set of occupied, undecided renewals whose leases end within  the lead days notice
        var actOn = getSet(obj);


        if(actOn.length > 0 ) {
            //these are renewed for 12 months
            var renewalSample = sampleRandomN(actOn, get("renew-probability") * actOn.length);
            //renewal renewalSample
            renewalSample.forEach(function(unit){
                unit["Renewal Status"] = "Renewed";
                unit["Lease Type Future Lease"] = "Renewal";
                unit["Lease Start Date Future Lease"] = d3.timeDay.offset(unit["Lease End Date Current Lease"],  1);
                unit["Lease End Date Future Lease"] = d3.timeMonth.offset(unit["Lease Start Date Future Lease"], 12);
                log("This tenant renewed!!",unit);
            });

            //these are the units that are not renewed
            var remainingUnits = actOn.filter( function( el ) {
                return !renewalSample.includes( el );
            } );
            var mtmSample = sampleRandomN(remainingUnits, get("longterm-probability") * remainingUnits.length + Math.random() > 0.5 ? 1:0 );

            //make these mtmSampel units go MTM
            mtmSample.forEach(function(unit){
                unit["Renewal Status"] = "Undecided";
                log("This tenant chose to go MTM!!",unit);
            })

            //thee are the ones that are not going month to month; they'll move out
            var ntvSample = remainingUnits.filter( function( el ) {
                return !mtmSample.includes( el );
            } );

            //make the ntvSample give notices
            ntvSample.forEach(function(unit){
                unit["Renewal Status"] = "NTV";
                unit["Status"] = "NA";
                unit["Notice On Date Current Lease"] = obj.currentDate;
                unit["Notice For Date Current Lease"] = unit["Lease End Date Current Lease"];
                unit["Make Ready Date Future Lease"] = d3.timeDay.offset(unit["Lease End Date Current Lease"], get("make-ready-schedule-days") + get("make-ready-days"))
                log("There is one tenant going to move out!!",unit);
            });
        }

        clearFilters(obj); //make the full crossfilter available
        updateCrossfilter(actOn,obj); //update the units that have made a decision

    } // makeDecision

    function newRental() {
        /*
         //for vacant units
         //the new rental is related to vacancy rate, vacancy rate is controled under 3%
         */

        obj.crossfilter.dims["Status"].filter(function(d) {
            return (d == "VA") || (d == "NA")
        });
        actOn = d3.shuffle(getSet(obj));
        var vU = actOn.length; //NA or VA

      if (d3.timeMonday(obj.currentDate)-obj.currentDate==0) {
            //var vUnits = d3.randomInt(3,vU)()
          var vUnits = Math.min(vU / obj.numUnits > 0.03 ? obj.numUnits * 0.03 : Math.random() * vU, get("lease-per-week"));
                actOn.slice(0, vUnits).forEach(function(d, i) {
                var lef = (Math.random() < get("re-12-month-chance")) ? 12 : 6;

                var mTime = d3.randomInt(0, 20)()
                    var nDays = d3.timeDay.count(obj.currentDate,d["Make Ready Date Future Lease"]);
                if (obj.currentDate > d["Make Ready Date Future Lease"]) {
                    d["Make Ready Date Future Lease"] = obj.currentDate;
                }
                if (d["Status"] == "VA") { //unit is empty but may need cleaning
                    if (nDays <= 0) { //means the room is cleaned & ready to move in
                        if (mTime > 0) {
                            d["Status"] = "VL";
                            d["Lease Start Date Future Lease"] = d3.timeDay.offset(obj.currentDate, mTime+50);
                        } else { //move in right today
                            //since we bound mTime to have a minimum of 0... this doesn't get called
                            d["Status"] = "OC";
                            d["Lease End Date Current Lease"] = d3.timeMonth.offset(d["Lease Start Date Future Lease"], lef);
                            d["Lease Start Date Future Lease"] = d3.timeDay.offset(obj.currentDate,0);
                        }
                    } else { //when the unit is not ready, either need to clean or still tenant live in with "NL"
                        d["Status"] = "VL";
                        //check if make-ready days ahead or later
                        if (nDays < mTime) { //makeReady day before new lease start
                            d["Lease Start Date Future Lease"] = d3.timeDay.offset(obj.currentDate, mTime);
                        } else { //makeReady day after lease start, then lease start move to ready day
                            d["Lease Start Date Future Lease"] = d3.timeDay.offset(d["Make Ready Date Future Lease"], mTime+50);
                        }
                    }
                } else { //the unit is still occupied
                    d["Status"] = "NL";
                    d["Notice For Date Current Lease"] = d3.timeDay.offset(d["Make Ready Date Future Lease"], mTime);
                }
                d["Lease Type"] = "New";
                d["Lease End Date Future Lease"] = d3.timeMonth.offset(d["Lease Start Date Future Lease"], lef);
            });

        }

        clearFilters(obj);
        updateCrossfilter(actOn,obj);
    } //newRental

    //moveOut
    function moveOut() {
        obj.crossfilter.dims["Status"].filter("NA");
      obj.crossfilter.dims["Notice For Date Current Lease"].filter(obj.currentDate);
        actOn = getSet(obj);

        actOn.forEach(function(unit) {
            unit["Status"] = "VA";
            unit["Renewal Status"] = "Inactive";
            log("Empty unit vacated",unit);
        });
        clearFilters(obj);
        updateCrossfilter(actOn,obj);

        obj.crossfilter.dims["Notice For Date Current Lease"].filter(obj.currentDate);
        obj.crossfilter.dims["Status"].filter("NL");
        actOn = getSet(obj);

        actOn.forEach(function(unit) {
            unit["Status"] = "VL";
            unit["Lease Start Date Future Lease"] = d3.timeDay.offset(obj.currentDate,50)
            unit["Make Ready Date Future Lease"] = d3.timeDay.offset(obj.currentDate, get("make-ready-schedule-days") + get("make-ready-days"));
            log("Leased out unit vacated",unit);
        });
        clearFilters(obj);
        updateCrossfilter(actOn,obj);
    }//moveOut

    //moveIn
    function moveIn(d) {
O = obj
        obj.crossfilter.dims["Status"].filter("VL");

        actOn = getSet(obj);
        //console.log(actOn.map(d=>d3.timeFormat("%b%d%Y")(d["Lease Start Date Future Lease"])))
        obj.crossfilter.dims["Lease Start Date Future Lease"].filter(obj.currentDate);
        actOn = getSet(obj);
        actOn.forEach(function(unit) {
            unit["Status"] = "OC";
            unit["Lease Start Date Current Lease"] = obj.currentDate;
            unit["Lease End Date Current Lease"] = unit["Lease End Date Future Lease"];


            unit["Lease Start Date Future Lease"] = "";
            unit["Lease End Date Future Lease"] = "";

            unit["Renewal Status"] = "New";
        });

        clearFilters(obj);
        updateCrossfilter(actOn,obj);


      obj.crossfilter.dims["Lease Start Date Future Lease"].filter(obj.currentDate);
        obj.crossfilter.dims["Renewal Status"].filter("Renewed");
        actOn = getSet(obj);

        actOn.forEach(function(unit) {
            unit["Status"] = "OC";
            unit["Lease Start Date Current Lease"] = obj.currentDate;
            unit["Lease End Date Current Lease"] = unit["Lease End Date Future Lease"];


            unit["Lease Start Date Future Lease"] = "";
            unit["Lease End Date Future Lease"] = "";

            unit["Renewal Status"] = "Renewal";
        });
        clearFilters(obj);
        updateCrossfilter(actOn,obj);
    }


    function makeReady(d) {

    }


    function madeReady(d) {

    }

    //evictions and skips
    function kickOut(d) {

        obj.crossfilter.dims["Status"].filter("OC");
        actOn = getSet(obj);

        var kickout = sampleRandomN(actOn, get("evict-rate") * actOn.length);

        kickout.forEach(function(unit) {
            log("bad boy",unit);
            unit["Status"] = "NA";
            unit["Lease End Date Current Lease"] = obj.currentDate;
            // set make_ready time:plus current-date (make-ready-schedule-days + make-ready-days) "days"]
            unit["Make Ready Date Future Lease"] = d3.timeDay.offset(obj.currentDate, get("make-ready-schedule-days") + get("make-ready-days"))
        });


        clearFilters(obj);
        updateCrossfilter(actOn,obj);
    }

    //updateOccupancy
    function updateOccupancy() {
        obj.crossfilter.dims["Status"].filter("OC");
        obj.crossfilter.dims["Lease Start Date Future Lease"].filter(obj.currentDate);
        actOn = getSet(obj);
        actOn.forEach(function(unit) {
            unit["Lease Date Current Lease"] = unit["Lease End Date Future Lease"];
        });
        clearFilters(obj);
        updateCrossfilter(actOn,obj);

        obj.crossfilter.dims["Lease Start Date Future Lease"].filter(function(t) {
            return d3.timeDay.offset(t, 30) > obj.currentDate
        });
        actOn = getSet(obj);
        actOn.forEach(function(unit) {
            unit["Renewal Status"] = "Undecided"
        });
        clearFilters(obj);
        updateCrossfilter(actOn,obj);


        obj.crossfilter.dims["Lease Start Date Future Lease"].filter(null);
        obj.crossfilter.dims["Make Ready"].filter(function(d) {
            return d < obj.currentDate
        });
        actOn = getSet(obj);
        obj.VAready = actOn.length;
        obj.VAnotReady = obj.numUnits - actOn.length;
        clearFilters(obj);
        updateCrossfilter(actOn,obj);
    }


}//runSimulation
