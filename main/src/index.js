
import * as d3 from "https://unpkg.com/d3@5.15.0/index.js?module";


/**
* Represents a bubble chart
* @constructor
* @param {Array} data - Data passed from d3.csv promise
*/
class BubbleChart{

  constructor(data){

      this.data = data;
      this.svg = null;
      this.width = 940;
      this.height = 600;
      this.tooltip = floatingTooltip('gates_tooltip', 240);
      this.center = {
        x : this.width/2,
        y: this.height/2
      }

      this.setBubbleColors = Array("red", '#ffa500', '#ffcd00','#87c735','#3e49bb','#682cbf','#7f4fc9','pink','brown');
      this.setRadialScale =2;
      this.draw("#vis");

  }


  set setForceStrength(fs = 0.03){
    this.forceStrength = fs;
  }

  set setBubbleColors(bcs){
   this.bubbleColors = bcs;
  }

  set dataSetter(randData){
    this.data = randData;
  }

  get dataGetter(){
    return this.data;
  }

  get getBubbleColors(){
    return this.bubbleColors;
  }


  get getForceStrength(){
    return this.forceStrength;
  }


  set bubbleSetter(bub=null){
    this.bubbles = bub;

  }

  get bubbleGetter(){
    return this.bubbles;
  }

  set nodeSetter(n = []){
    this.nodes = n;
  }

  get nodeGetter(){
    return this.nodes;
  }


  get centerGetter(){
    return this.center;
  }

  get simulationGetter(){
    return this.simulation;
  }

  set domainSetter(domain){
    this.domain = domain;
  }

  get domainGetter(){
    return this.domain;
  }


  get getData(){
    return this.data;
  }

  set setData(_data){
    this.data = _data;
    this.draw("#vis");
  }

  get getRadialScale(){
    return this.radialScale;
  }

  set setRadialScale(scale=2){
      this.radialScale = scale;
  }



    
  /**
  Draws svg canvas into a div and inserts bubbles
  * @param {string} selector - String referencing the css selector of where the visualisation is to be drawn
  */
  draw(selector){
  $(selector).html('');
  this.svg = d3.select(selector)
    .append('svg')
    .attr('width', this.width)
    .attr('height', this.height);
    
    this.setForceStrength = 0.2;
    this.setUpChartNodes(this.getData);
    this.populateChart("#vis",this.nodeGetter);
   

  }


  /**
  *Drags all bubbles to the centre of the svg canvas
  *Sets the force d
  * 
  */
  createForceLayout(){

    const charge = (d) =>
        -Math.pow(d.radius, 2.0) * this.getForceStrength;
    
    const ticked = () =>{ 
      this.bubbleGetter
      .attr('cx', function (d) { return +d.x; })
      .attr('cy', function (d) { return +d.y; });
    }

    const simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force('x', d3.forceX().strength(0.03).x(500))
    .force('y', d3.forceY().strength(this.getForceStrength).y(this.centerGetter.y))
    .force('charge', d3.forceManyBody().strength(function(d) { return charge(d); }))
    .on("tick", ticked);
    //this.simulation.force(d3.forceCenter(this.centerGetter.z, this.centerGetter.y));

    return simulation;
  }


setUpChartNodes(){
    console.log(this.getRadialScale);
    const maxAmount = d3.max(this.getData, function (d) { return +d.Streams * Math.pow(10,6); });

    const radiusScale = d3.scalePow()
      .exponent(this.getRadialScale)
      .range([2, 85])
      .domain([0, maxAmount]);


     const myNodes = this.getData.map(function (d) {
      return {
        rank: d.Rank,
        radius: radiusScale(+d.Streams * Math.pow(10,6)),
        value: +d.Streams * Math.pow(10,6),
        name: d.Song,
        artist: d.Artist,
        from: String(d.From).trim(),
        group: +d.Date,
        year: d.Date,
        x: Math.random() * 900,
        y: Math.random() * 800
      };
      
    });

    // sort them to prevent occlusion of smaller nodes.
    myNodes.sort(function (a, b) { return b.value - a.value; });
    this.nodeSetter = myNodes;

}



  groupBubbles() {
    this.svg.selectAll('.year').remove();

    // @v4 Reset the 'x' force to draw the bubbles to the center.
    this.simulation.force('x', d3.forceX().strength(this.getForceStrength).x(this.centerGetter.x));

    // @v4 We can reset the alpha value and restart the simulation
    this.simulation.alpha(1).restart();
  }




  populateChart(selector){

  var set = new Set();
  function getYearsCol(data){
    for (var i = data.length - 1; i >= 0; i--) {
      set.add(data[i].Date.toString());
    }
  }
  this.domainSetter = set;
  console.log(this.getData);
  getYearsCol(this.getData);

   const fillColor = d3.scaleOrdinal()
  .domain(this.domainGetter)
  .range(this.getBubbleColors);


    this.bubbleSetter = this.svg.selectAll('.bubble')
      .data(this.nodeGetter, function (d) { return d.Song; });



    this.bubblesE = this.bubbleGetter.enter().append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', function (d) { return d3.rgb(fillColor(d.group)); })
      .attr('stroke', function (d) { return d3.rgb(fillColor(d.group)).darker(); })
      .attr('stroke-width', 2)
      .on('mouseover', this.showDetail)
      .on('mouseout', function(){
        $('.tooltip').hide();
      });

  
    this.bubbleSetter = this.bubbleGetter.merge(this.bubblesE);


    this.bubbleGetter.transition()
      .duration(2000)
      .attr('r', function (d) { return d.radius; });

     
     this.simulation = this.createForceLayout();
     this.simulation.stop();
     this.simulation.nodes(this.nodeGetter);


    this.groupBubbles();
}


   showDetail(d) {
    // change outline to indicate hover state.
    let tooltip = floatingTooltip('gates_tooltip', 240);

    let content = '<span class="name">Title: </span><span class="value">' +
                  d.name +
                  '</span><br/>' +
                  '<span class="name">Artist: </span><span class="value">' +
                  d.artist +
                  '</span><br/>' +
                  '<span class="name">Date Published </span><span class="value">' +
                  d.year +
                  '</span> <br/>' +
                  '<span class="name">Rank: </span><span class="value">' +
                  d.rank +
                  '</span>';
    tooltip.showTooltip(content, d3.event);
  }




   randomColor(){
    //Reference this code
      return '#' + ("000000" + Math.random().toString(16).slice(2, 8).toUpperCase()).slice(-6);
    }

  generateRandomColorArray(){
      const randomColors = [];
      while (randomColors.length <= 7) {
        if (!randomColors.includes(this.randomColor())){ 
        randomColors.push(this.randomColor());
      }
      }
      return randomColors;
    }



}


var currentSSelectedYear = "2019";

d3.csv("./data/"+currentSSelectedYear+".csv").then(function(data){

  let chart = new BubbleChart(data);


    $(document).ready(function(){

    $("#change_color").click(function(){
        var bubbleColors = chart.generateRandomColorArray();
        chart.setBubbleColors = bubbleColors;
        chart.draw("#vis");
      });

  });

    const yearData = ["2019","2018","2017"];

     $("#simple_slider").slider({
      range: false,
      min: 0,
      max: yearData.length -1,
      value: 0,
      change : function(event,ui){
        currentSSelectedYear = yearData[ui.value];
        $("#year_update").text(currentSSelectedYear);
        d3.csv("./data/"+currentSSelectedYear+".csv").then(function(newData){
            chart.setData = newData;
            console.log(chart.getData);
        });
    }




});

     $("#r_scale").click(function(){
        chart.setRadialScale = 2.5;
        chart.draw("#vis");
     });


var toggleDisplay = function (displayName) {
    if (displayName === 'year') {
      splitBubbles();
    } else {
      chart.groupBubbles();
  }
};


function setupButtons() {
  d3.select('#toolbar')
    .selectAll('.button')
    .on('click', function () {
      // Remove active class from all buttons
      d3.selectAll('.button').classed('active', false);
      // Find the button just clicked
      var button = d3.select(this);

      // Set it as the active button
      button.classed('active', true);

      // Get the id of the button
      var buttonId = button.attr('id');

      // Toggle the bubble chart based on
      // the currently clicked button.
      toggleDisplay(buttonId);
    });
}


 function nodeYearPos(d){ 

    const yearCenters = {
    "European": { x: chart.width / 3, y: chart.height / 2 },
    "American": { x: chart.width /2 , y: chart.height / 2 },
    "African/Carribean": { x: 2 * chart.width / 3, y: chart.height / 2 },
    "Other" : {x :chart.width * 0.8 , y: chart.height/2}
  }
    console.log(d.from);
    return yearCenters[d.from].x;
  }


    //  add to class
  function splitBubbles() {
    showYearTitles();

    // @v4 Reset the 'x' force to draw the bubbles to their year centers
    chart.simulation.force('x', d3.forceX().strength(chart.forceStrength).x(nodeYearPos));

    // @v4 We can reset the alpha value and restart the simulation
    chart.simulation.alpha(1).restart();
  }

  /*
   * Hides Year title displays.
   */
  function hideYearTitles() {
    svg.selectAll('.year').remove();
  }

  // /*
  //  * Shows Year title displays.
  //  */
  function showYearTitles() {
    // Another way to do this would be to create
    // the year texts once and then just hide them.

  const decadeTitle = {
    "European": chart.width /4,
    "American": chart.width / 2,
    "African/Carribean": chart.width * 0.75,
    "Other" : chart.width * 0.95
  };

    const yearsData = d3.keys(decadeTitle);
    const years = chart.svg.selectAll('.year')
      .data(yearsData);

    years.enter().append('text')
      .attr('class', 'year')
      .attr('x', function (d) { return decadeTitle[d]; })
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .text(function (d) { return d; });



  }

  setupButtons();

});



