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
import CloseIcon from "@mui/icons-material/Close";
import CollectionsIcon from "@mui/icons-material/Collections";

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
  const icicleChart = useRef(null);
  const treemapChart = useRef(null);
  const circlePackChart = useRef(null);
  const [levels, setLevels] = useState(["date", "style", "media"]);
  const reloadChart = useRef(true);
  const [chart, setChart] = useState("sunburst");

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

  function nodeClick(node) {}

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
          let myChart;
          if (chart === "icicle") {
            icicleChart.current.innerHTML = "";
            myChart = Icicle();
            myChart
              .data(res.payload)
              .label("name")
              .height(400)
              .width(400)
              .color((d, parent) => color(parent ? parent.data.name : null))
              .onClick(function (node) {
                if (node) {
                  setAdditionalFilters(getFilterFromNode(node.__dataNode));
                  myChart.zoomToNode(node);
                }
              })
              .tooltipContent((d, node) => `Size: <i>${node.value}</i>`)(
              icicleChart.current
            );
          } else if (chart === "sunburst") {
            sunburstChart.current.innerHTML = "";
            myChart = Sunburst();
            myChart()
              .data(res.payload)
              .label("name")
              .height(400)
              .width(400)
              .color((d, parent) => color(parent ? parent.data.name : null))
              .onClick(function (node) {
                if (node) {
                  setAdditionalFilters(getFilterFromNode(node.__dataNode));
                  myChart.focusOnNode(node);
                }
              })
              .tooltipContent((d, node) => `Size: <i>${node.value}</i>`)(
              sunburstChart.current
            );
          } else if (chart === "circlepack") {
            circlePackChart.current.innerHTML = "";
            myChart = CirclePack();
            myChart
              .data(res.payload)
              .label("name")
              .height(400)
              .width(400)
              .color((d, parent) => color(parent ? parent.data.name : null))
              .onClick(function (node) {
                if (node) {
                  setAdditionalFilters(getFilterFromNode(node.__dataNode));
                  myChart.zoomToNode(node);
                }
              })
              .tooltipContent((d, node) => `Size: <i>${node.value}</i>`)(
              circlePackChart.current
            );
          }
        })
      );
    }
  }, [data, levels, chart]);

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

  useEffect(() => {
    reloadChart.current = true;
  }, [chart]);

  return (
    <div className="App" style={{ height: "100vh" }}>
      <header className="App-header">
        <div className="page-container">
          <div className="body-container">
            {typeof data === "undefined" ? (
              <p>Loading images...</p>
            ) : isGrid ? (
              <div className="grid-container">
                <Gallery
                  id="main-gal"
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

            <div className="chart-info">
              {
                <div
                  className="chart-container"
                  ref={
                    {
                      sunburst: sunburstChart,
                      icicle: icicleChart,
                      circlepack: circlePackChart,
                    }[chart]
                  }
                />
              }
              <CollectionsIcon
                className="display-imgs"
                onClick={() =>
                  setFilters((prev) => {
                    reloadChart.current = false;
                    return { ...prev, ...additionalFilters };
                  })
                }
              />
            </div>
          </div>
          <SideBar
            setChart={(e) => setChart(e)}
            chart={chart}
            onLevelChange={(e) => {
              reloadChart.current = true;
              setLevels(e);
            }}
            removeFilter={(e) => {
              setFilters((prev) => {
                let newFilter = { ...prev };
                delete newFilter[e];
                return newFilter;
              });
            }}
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
              <div className="close-div">
                <CloseIcon
                  className="close-button"
                  onClick={() => setShowOverlay(false)}
                />
              </div>
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
