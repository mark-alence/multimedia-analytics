import "./App.css";
import * as d3 from "d3";
import React, { useEffect, useRef } from "react";
import { prettyString } from "./utils";

const ScatterPlot = ({ data, onSelect, current, key }) => {
  const xSize = 450;
  const ySize = 450;
  const margin = 40;

  // How big should the actual graph be in terms of screensize?
  const xMax = xSize - margin * 2;
  const yMax = ySize - margin * 2;

  // What should the range be of the x and y axis?
  const xDom = 500;
  const yDom = 500;
  const svgRef = useRef(null);

  useEffect(() => {
    let xs = data.map((e) => e.x);
    let ys = data.map((e) => e.y);
    let maxX = Math.max(...xs);
    let minX = Math.min(...xs);
    let maxY = Math.max(...ys);
    let minY = Math.min(...ys);

    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll("*").remove();
    const svg = svgEl
      .append("svg")
      .append("g")
      // Set Outside boundary (0 makes the axis hit the edge of the page)
      .attr("transform", "translate(" + margin + "," + margin + ")");

    // X Axis
    const xScale = d3
      .scaleLinear()
      .domain([Math.min(...xs) - 0.1, Math.max(...xs) + 0.1])
      .range([0, xMax]);

    svg
      .append("g")
      .attr("transform", "translate(0," + yMax + ")")
      .call(d3.axisBottom(xScale));

    // Y Axis
    const yScale = d3
      .scaleLinear()
      .domain([Math.min(...ys) - 0.1, Math.max(...ys) + 0.1])
      .range([yMax, 0]);

    svg.append("g").call(d3.axisLeft(yScale));

    // Set the initial state of tooltips as invisible
    var div = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // Dots
    var dots = svg
      .selectAll("scatterPoints")
      .data(data)
      .enter()
      .append("circle")
      //   .attr("cx", (d) => xScale((maxX + minX) / 2))
      //   .attr("cy", (d) => yScale((maxY + minY) / 2))
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 2)
      .style("fill", "#7ea4b3")
      .attr("stroke", "#7ea4b3")
      .attr("stroke-width", 4)
      .on("click", (d, i) => onSelect(i.id))
      .style("opacity", 0);

    //   .attr("cx", (d) => xScale(d.x))
    //   .attr("cy", (d) => yScale(d.y));

    // Animated effects on mouse contact

    dots
      .on("mouseover", function (d, i) {
        // Circle 'pops' out when contact
        d3.select(this).transition().duration("1").attr("r", 5);
        d3.select(this).transition().duration("0").style("opacity", 1);

        // Code for the tooltip that shows the data
        div
          .transition()
          .duration(200)
          .style("opacity", 1)
          .style("left", d.pageX + "px")
          .style("top", d.pageY - 45 + "px");

        var string = "<img src=" + i.src + ' height="300"/>';
        div.html(
          "Title: " +
            i.heading +
            "<br>Artist: " +
            prettyString(i.artist_name) +
            "<br>Date: " +
            i.date +
            "<br>Style: " +
            prettyString(i.style)
        );
      })

      // Animated effects on mouse leaving

      .on("mouseup", function (d, i) {
        // Set  the circle to be the same size as before
        d3.select(this).transition().duration("200").attr("r", 2);
        d3.select(this).transition().duration("0").style("opacity", 1);

        // Remove the tooltip
        div.transition().duration("200").style("opacity", 0);
      })
      .on("mouseout", function (d, i) {
        // Set  the circle to be the same size as before
        d3.select(this).transition().duration("200").attr("r", 2);
        // Remove the tooltip
        div.transition().duration("200").style("opacity", 0);
      });

    dots.transition().duration(750).style("opacity", 1);


  }, [data]);

  return <svg ref={svgRef} width={500} height={500} />;
};

export default ScatterPlot;
