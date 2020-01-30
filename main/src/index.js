import * as d3 from 'https://unpkg.com/d3@5.15.0/index.js?module';
/**
* Represents a bubble chart
* @constructor
* @param {Array} data - Data passed from d3.csv promise
*/
class BubbleChart {
  constructor (data) {
    this.data = data;
    this.svg = null;
    this.width = 940;
    this.height = 600;
    this.tooltip = floatingTooltip('gates_tooltip', 240);
    this.center = {
      x: this.width / 2,
      y: this.height / 2
    };
    this.setBubbleColors = ['#E50000', '#ffa500', '#ffcd00', '#87c735', '#3e49bb', '#682cbf', '#7f4fc9', 'pink', 'brown'];
    this.draw('#vis');
  }

  /**
   * Force strength used in force layout
   * Determines the stength of the force used to push the bubbles towards the center
   * @type {number}
  */
  set setForceStrength (fs = 0.03) {
    this.forceStrength = fs;
  }

  /**
   * Bubble colors
   * Array of k hex codes (String) for each distinct year in the dataset.
   * @type {Array}
  */
  set setBubbleColors (bcs) {
    this.bubbleColors = bcs;
  }

  get dataGetter () {
    return this.data;
  }

  get getBubbleColors () {
    return this.bubbleColors;
  }

  get getForceStrength () {
    return this.forceStrength;
  }

  /**
   * Bubbles corresponding to the circle svg elements
   * Array containing the circle svg elements
   * @type {Array}
  */
  set bubbleSetter (bub = null) {
    this.bubbles = bub;
  }

  get bubbleGetter () {
    return this.bubbles;
  }

  /**
   * Set to null by default
   * These nodes are custom data objects which are based on certain fields in the parsed data
   * @type {Array}
  */
  set nodeSetter (n = []) {
    this.nodes = n;
  }

  get nodeGetter () {
    return this.nodes;
  }

  get centerGetter () {
    return this.center;
  }

  get simulationGetter () {
    return this.simulation;
  }

  /**
   * The domain of the used in the ordinal scale
   * Contains unique years of the publishing dates of the tracks in the specific data set
   * @type {Array}
  */
  set domainSetter (domain) {
    this.domain = domain;
  }

  get domainGetter () {
    return this.domain;
  }

  get getData () {
    return this.data;
  }

  /**
  * When the data is passed into the constructor the facilitates the accessing of the data to different functions. <br>
  * Array containing objects which describe a certain track based on the information of interest which includes Streams,Publishing Date etc
  * @type {Array}
  */
  set setData (_data) {
    this.data = _data;
    this.draw('#vis');
  }

  /**
  * @see {@link setUpChartNodes,populateChart}
  * @description Draws svg canvas into a div and inserts bubbles
  * @param {string} selector - String referencing the css selector of where the visualisation is to be drawn
  */
  draw (selector) {
    // Clears the visualisation before redrawing
    $(selector).html('');
    this.svg = d3.select(selector)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);
    this.setForceStrength = 0.2;
    this.setUpChartNodes(this.getData);
    this.populateChart('#vis', this.nodeGetter);
  }

  /**
  @see {@link getForceStrength,centerGetter}
  @description Moves all bubbles from default position to the centre of the sceen by applying a force
  Another force applied on the bubbles is called 'charge' which prevents the bubbles from colliding
  */
  createForceLayout () {
    // Method used to generate value for force based on electric fields
    // Ensures that no bubbles touch each other
    const charge = (d) => -Math.pow(d.radius, 2.0) * this.getForceStrength;
    // Runs iteratively pushing the bubbles towards the centre of the screen
    const ticked = () => {
      this.bubbleGetter
        .attr('cx', (d) => +d.x)
        .attr('cy', (d) => +d.y);
    };

    // Creates a force simulation
    const simulation = d3.forceSimulation()
      .velocityDecay(0.2)
      .force('x', d3.forceX().strength(this.getForceStrength).x(this.centerGetter.x))
      .force('y', d3.forceY().strength(this.getForceStrength).y(this.centerGetter.y))
      .force('charge', d3.forceManyBody().strength((d) => charge(d)))
      .on('tick', ticked);

    return simulation;
  }

  /**
   * @see {@link nodeSetter,getData} <br>
   * See {@link showDetail} for description of the node object created in this method <br>
   * This creates the radius scale by calculating the range. <br>
   * This also creates the node objects by mapping proprerties of the Objects returned by the raw data
   * Creates node object which is explained at the documentation of {@link showDetail}
  */
  setUpChartNodes () {
    // Maximum amount used to define the range
    const maxAmount = d3.max(this.getData, (d) => +d.Streams * Math.pow(10, 6));
    // Creates a radial scale
    const radiusScale = d3.scalePow()
      .exponent(2)
      .range([2, 85])
      .domain([0, maxAmount]);

    // For each roe in the csv file, a node object is created  and added to an array of nodes.
    const myNodes = this.getData.map((d) => ({
      rank: +d.Rank,
      radius: radiusScale(+d.Streams * Math.pow(10, 6)),
      value: +d.Streams * Math.pow(10, 6),
      name: d.Song,
      artist: d.Artist,
      from: String(d.From).trim(),
      group: +d.Date,
      year: d.Date,
      x: Math.random() * 900,
      y: Math.random() * 800
    }));

    // Sorts the nodes to prevent omission of smaller nodes
    myNodes.sort((a, b) => b.value - a.value);
    this.nodeSetter = myNodes;
  }

  /**
  *@see {@link splitBubbles}
  * @Description This groups the bubbles, should they be split up simply by dragging the bubbles to the center of the visualisation <br>
  * The forceLayout simulation created in {@link createForceLayout} also restarts
  */
  groupBubbles () {
    this.svg.selectAll('.year').remove();
    // @v4 Reset the 'x' force to draw the bubbles to the center.
    this.simulation.force('x', d3.forceX().strength(this.getForceStrength).x(this.centerGetter.x));
    // @v4 We can reset the alpha value and restart the simulation
    this.simulation.alpha(1).restart();
  }

/**
  * This method is responsible for converting the custom node objects into svg circle elements
  * A specific node object is related to bubble based on it's properties such as Streams and Artist Nationality
*/
  populateChart () {
    const set = new Set();
    // Function used in local scope to add all the years of the publishing dates to a set which is used as the domain for the ordinal scale
    function getYearsCol (data) {
      for (let i = data.length - 1; i >= 0; i--) {
        set.add(data[i].Date.toString());
      }
    }
    this.domainSetter = set;
    getYearsCol(this.getData);

    /// Fill color based on Date Published
    const fillColor = d3.scaleOrdinal()
      .domain(this.domainGetter)
      .range(this.getBubbleColors);

    // Bind nodes data to what will become DOM elements to represent them.
    this.bubbleSetter = this.svg.selectAll('.bubble')
      .data(this.nodeGetter, (d) => d.Streams);

    this.bubblesE = this.bubbleGetter.enter().append('circle')
      .classed('bubble', true)
      // node starts off with radius of zero
      .attr('r', 0)
      .attr('fill', (d) => d3.rgb(fillColor(d.group)))
      .attr('stroke', (d) => d3.rgb(fillColor(d.group)).darker())
      .attr('stroke-width', 2)
      .on('mouseover', this.showDetail)
      .on('mouseout', () => {
        $('.tooltip').hide();
        $('.bubble').css({ opacity: 1 });
      });

    this.bubbleSetter = this.bubbleGetter.merge(this.bubblesE);

    // Usinf a transistion the bubble reaches the full size
    this.bubbleGetter.transition()
      .duration(2000)
      .attr('r', (d) => d.radius);

    // Force layout creation
    this.simulation = this.createForceLayout();
    // Stop simulation as the nodes have not been added yet
    this.simulation.stop();
    // This automactically restarts the simulation with the nodes inserted
    this.simulation.nodes(this.nodeGetter);
    // Regrouping bubbles
    this.groupBubbles();
  }

  /**
  * This method utilises the node object which is defined {@link setUpChartNodes}
  * This method is called when you hover over a circle object, when hovering over a bubble this method is responsible for reducing the opacity of the bubble.
  * @param d - Node object containing parsed data which describes a Song
  * @param d.artist {string} - Artist name
  * @param d.year {string} - Date published
  * @param d.rank {number} - Ranking within the top 100 tracks in spotify for this specific year
  * @param d.from {number} - Location where the main artist was born
  * @param d.value {number} - Number of streams
  * @param d.group {number} - Date published (used for the ordinal scale, to color the objects based on their publishing date)
  */
  showDetail (d) {
    // change outline to indicate hover state.
    // Fields displayed here can be changed based on the dataset
    const tooltip = floatingTooltip('gates_tooltip', 240);
    $(this).css({ opacity: 0.8 });
    const content = `<span class="name">Title: </span><span class="value">${
      d.name
    }</span><br/>` +
                  `<span class="name">Artist: </span><span class="value">${
                    d.artist
                  }</span><br/>` +
                  `<span class="name">Date Published </span><span class="value">${
                    d.year
                  }</span> <br/>` +

                  `<span class="name">Rank: </span><span class="value">${
                    d.rank
                  }</span>`;
    tooltip.showTooltip(content, d3.event);
  }

  /**
  * Used to generate a single random color
  * @returns {string} - randomly generated hex code
  */
  randomColor () {
    // Reference this code
    return `#${(`000000${Math.random().toString(16).slice(2, 8).toUpperCase()}`).slice(-6)}`;
  }

  /**
  * Used randomColor method to generate an array of colors which is the same size as the domain; so that each unique year will be assigned a color
  * @see {@link randomColor}
  * @returns {Array}
  */
  generateRandomColorArray () {
    // local array used to store random array
    const randomColors = [];
    while (randomColors.length <= this.domainGetter.size) {
      if (!randomColors.includes(this.randomColor())) {
        randomColors.push(this.randomColor());
      }
    }
    return randomColors;
  }
}
// -----END OF CLASS=-//
// Graph initialisation
d3.csv('./data/2019.csv').then((data) => {
  const chart = new BubbleChart(data);
// -----------------------------------------------------
// -Everyting under here is not necessarlity required for the visulaisation to be created
// -Extra added functionality such as the changing of colors, data and the splitting of the data based on the content
  $(document).ready(() => {
    $('#change_color').click(() => {
      // Once the change color button is pressed
      // Generate a new array of random colors
      // Set this as the bubble colors
      // Readraw the visualisation
      const bubbleColors = chart.generateRandomColorArray();
      chart.setBubbleColors = bubbleColors;
      chart.draw('#vis');
    });
  });

  let currentSSelectedYear = '2019';
  const yearData = ['2019', '2018', '2017'];

  // Creates the slider to change the year
  $('#simple_slider').slider({
    range: 'min',
    min: 0,
    max: yearData.length - 1,
    value: 0,
    change (event, ui) {
      currentSSelectedYear = yearData[ui.value];
      $('#year_update').text(currentSSelectedYear);
      d3.csv(`./data/${currentSSelectedYear}.csv`).then((newData) => {
        chart.setData = newData;
      });
    }

  });

  // Based on how the display is either split the bubbles or group them
  const toggleDisplay = function (displayName) {
    if (displayName === 'year') {
      splitBubbles();
    } else {
      chart.groupBubbles();
    }
  };

  function setupButtons () {
    d3.select('#toolbar')
      .selectAll('.button')
      .on('click', function () {
      // Remove active class from all buttons
        d3.selectAll('.button').classed('active', false);
        // Find the button just clicked
        const button = d3.select(this);

        // Set it as the active button
        button.classed('active', true);

        // Get the id of the button
        const buttonId = button.attr('id');
        // Toggle the bubble chart based on
        // the currently clicked button.
        toggleDisplay(buttonId);
      });
  }

  function nodeYearPos (d) {
    const yearCenters = {
      European: { x: chart.width / 3, y: chart.height / 2 },
      American: { x: chart.width / 2, y: chart.height / 2 },
      'African/Carribean': { x: 2 * chart.width / 3, y: chart.height / 2 },
      Other: { x: chart.width * 0.8, y: chart.height / 2 }
    };
    return yearCenters[d.from].x;
  }

  //  add to class
  function splitBubbles () {
    showYearTitles();

    // @v4 Reset the 'x' force to draw the bubbles to their year centers
    chart.simulation.force('x', d3.forceX().strength(chart.forceStrength).x(nodeYearPos));

    // @v4 We can reset the alpha value and restart the simulation
    chart.simulation.alpha(1).restart();
  }

  // This is responsible for showing the year titles
  function showYearTitles () {
    const decadeTitle = {
      European: chart.width / 4,
      American: chart.width / 2,
      'African/Carribean': chart.width * 0.75,
      Other: chart.width * 0.95
    };

    const yearsData = d3.keys(decadeTitle);
    const years = chart.svg.selectAll('.year')
      .data(yearsData);

    years.enter().append('text')
      .attr('class', 'year')
      .attr('x', (d) => decadeTitle[d])
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .text((d) => d);
  }

  // Initialises the button event listeners which are used to added functinoality
  setupButtons();
});
