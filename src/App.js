import "./App.css";
import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import Gallery from "react-grid-gallery";
import Coverflow from "react-coverflow";
import { StyleRoot } from "radium";
import Overlay from "./Overlay";
import { Switch, FormControlLabel, Button } from "@mui/material";
import Icicle from "icicle-chart";
import Sunburst from "sunburst-chart";
import Treemap from "treemap-chart";
import CirclePack from "circlepack-chart";
import * as d3 from "d3";
import SideBar from "./SideBar";

function getQueryString(filters) {
  let str = "?";
  for (const property in filters) {
    str += property + "=" + filters[property] + "&";
  }
  str = str.slice(0, -1);
  return str;
}

function App() {
  const [data, setData] = useState([{}]);
  const [filters, setFilters] = useState({ artist_name: "ad-reinhardt" });
  const [additionalFilters, setAdditionalFilters] = useState({});
  const [isGrid, setIsGrid] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [similarImages, setSimilarImages] = useState();
  const sunburstChart = useRef(null);
  const treemapChart = useRef(null);
  const circlePackChart = useRef(null);
  const [levels, setLevels] = useState(["date", "style", "media"]);
  const reloadChart = useRef(true);

  function getFilterFromNode(node) {
    let filters = {};
    let depth = 0;
    while (node.parent != null) {
      filters[depth] = node.data.name;
      depth += 1;
      node = node.parent;
    }

    depth -= 1;
    for (let i = depth; i >= 0; i--) {
      filters[levels[depth - i]] = filters[i];
      delete filters[i];
    }

    filters["end_date"] = null;
    return filters;
  }

  function fetchSimilarImages(img) {
    fetch(`/similar_images?id=${img.id}`).then((res) =>
      res.json().then((data) => {
        setSimilarImages({ left: img, right: data.names });
        setShowOverlay(true);
      })
    );
  }

  function getSimilarImagesFromGrid() {
    fetchSimilarImages(arguments[1]);
  }

  function getSimilarImagesFromCarousel(img) {
    fetchSimilarImages(img);
  }

  useEffect(() => {
    if (reloadChart.current) {
      fetch("/icicle_data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...filters, levels: levels }),
      }).then((res) =>
        res.json().then((res) => {
          // Icicle()
          //   .data(data.names)
          //   .label("name")
          //   .height(400)
          //   .width(800)
          //   .color((d, parent) => color(parent ? parent.data.name : null))
          //   .tooltipContent((d, node) => `Size: <i>${node.value}</i>`)(
          //   icicleChart.current
          // );

          // CirclePack()
          //   .data(data.names)
          //   .label("name")
          //   .height(400)
          //   .width(800)
          //   .color((d, parent) => color(parent ? parent.data.name : null))
          //   .tooltipContent((d, node) => `Size: <i>${node.value}</i>`)(
          //   circlePackChart.current
          // );

          sunburstChart.current.innerHTML = "";

          let myChart = Sunburst();

          myChart()
            .data(res.payload)
            .label("name")
            .height(400)
            .width(800)
            .color((d, parent) => color(parent ? parent.data.name : null))
            .onNodeClick(function (node) {
              setAdditionalFilters(getFilterFromNode(node.__dataNode));
              myChart.focusOnNode(node);
            })
            .tooltipContent((d, node) => `Size: <i>${node.value}</i>`)(
            sunburstChart.current
          );

          // Treemap()
          // .data(data.names)
          // .color((d) => color(d.name))
          // .height(400)
          // .width(800)
          // .excludeRoot(true)(treemapChart.current);
        })
      );
    }
  }, [data, levels]);

  useEffect(() => {
    let queryString = getQueryString(filters);
    if (queryString !== "") {
      fetch(`/filtered_images${queryString}`).then((res) =>
        res.json().then((data) => {
          setData(data.names);
        })
      );
    } else {
      setData([]);
    }
  }, [filters]);

  const color = d3.scaleOrdinal(d3.schemePaired);

  return (
    <div className="App" style={{ height: window.innerHeight }}>
      <header className="App-header">
        <div className="page-container">
          <div className="body-container">
            {typeof data === "undefined" ? (
              <p>Loading images...</p>
            ) : isGrid ? (
              <div className="grid-container">
                <Gallery
                  images={data}
                  onSelectImage={getSimilarImagesFromGrid}
                />
              </div>
            ) : (
              <div class="carousel-container">
                <StyleRoot>
                  <Coverflow
                    height="250"
                    displayQuantityOfSide={2}
                    infiniteScroll={true}
                    navigation={false}
                    key={data.toString()}
                    clickable={true}
                  >
                    {data.map((e, i) => (
                      <img
                        // resizeMode="contain"
                        class="carousel-img"
                        width="3vw"
                        src={e.src}
                        key={i}
                        alt={e.heading}
                        onClick={() => getSimilarImagesFromCarousel(e)}
                      />
                    ))}
                  </Coverflow>
                </StyleRoot>
              </div>
            )}

            <div>
              <button
                onClick={() =>
                  setFilters((prev) => {
                    reloadChart.current = false;
                    return { ...prev, ...additionalFilters };
                  })
                }
              >
                Show
              </button>
              <div className="chart-container" ref={sunburstChart} />
            </div>
          </div>
          <SideBar
            onLevelChange={(e) => setLevels(e)}
            clearFilters={() => {
              setFilters({});
              reloadChart.current = true;
            }}
            onSwitch={() => {
              setIsGrid(!isGrid);
            }}
            filters={filters}
            onChange={(e) => {
              reloadChart.current = true;
              setFilters((prev) => ({ ...filters, [e.filter]: e.value }));
            }}
            onClear={(e) => {
              setFilters((prev) => {
                let newData = { ...prev };
                delete newData[e];
                return newData;
              });
            }}
          />
          {data && showOverlay && (
            <div className="container">
              <button onClick={() => setShowOverlay(false)}>Close</button>
              <Overlay
                imageLeft={similarImages.left}
                imagesRight={similarImages.right}
              />
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
