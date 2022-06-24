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

function getQueryString(filters) {
  let str = "?";
  for (const property in filters) {
    str += property + "=" + filters[property] + "&";
  }
  str = str.slice(0, -1);
  return str;
}

function prettyString(str) {
  str = str.replaceAll("-", " ");
  str = str.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
  return str;
}

function App() {
  const [data, setData] = useState([{}]);
  const [filters, setFilters] = useState({ date: 1410 });
  const [artistOptions, setArtistOptions] = useState([]);
  const [isGrid, setIsGrid] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [similarImages, setSimilarImages] = useState();
  const [icicleData, setIcicleData] = useState(null);
  const icicleChart = useRef(null);
  const sunburstChart = useRef(null);
  const treemapChart = useRef(null);
  const circlePackChart = useRef(null);

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
    fetch("/artists").then((res) =>
      res.json().then((data) => {
        let options = data.names.map((e) => {
          return { value: e, label: prettyString(e) };
        });
        setArtistOptions(options);
      })
    );

    fetch("/icicle_data").then((res) =>
      res.json().then((data) => {
        // Icicle()
        //   .data(data.names)
        //   .label("name")
        //   .height(400)
        //   .width(800)
        //   .color((d, parent) => color(parent ? parent.data.name : null))
        //   .tooltipContent((d, node) => `Size: <i>${node.value}</i>`)(
        //   icicleChart.current
        // );

        CirclePack()
          .data(data.names)
          .label("name")
          .height(400)
          .width(800)
          .color((d, parent) => color(parent ? parent.data.name : null))
          .tooltipContent((d, node) => `Size: <i>${node.value}</i>`)(
          circlePackChart.current
        );


        // Sunburst()
        //   .data(data.names)
        //   .label("name")
        //   .height(400)
        //   .width(800)
        //   .color((d, parent) => color(parent ? parent.data.name : null))
        //   .tooltipContent((d, node) => `Size: <i>${node.value}</i>`)(
        //   sunburstChart.current
        // );

        // Treemap()
        // .data(data.names)
        // .color((d) => color(d.name))
        // .height(400)
        // .width(800)
        // .excludeRoot(true)(treemapChart.current);
      })
    );
  }, []);

  useEffect(() => {
    let queryString = getQueryString(filters);
    if (queryString !== "") {
      fetch(`/filtered_images${queryString}`).then((res) =>
        res.json().then((data) => {
          setData(data);
        })
      );
    }
  }, [filters]);

  const color = d3.scaleOrdinal(d3.schemePaired);

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ color: "black", width: "100%" }}>
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-around",
            }}
          >
            <button onClick={() => setFilters({})}>Clear Filters</button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setFilters({ ...filters, date: e.target[0].value });
              }}
            >
              <label>
                Year: <input type="number" />
              </label>
            </form>

            <FormControlLabel
              control={
                <Select
                  options={artistOptions}
                  onChange={(e) => {
                    setFilters({ ...filters, artist_name: e.value });
                  }}
                  isSearchable={true}
                />
              }
              // label="Grid View"
            />

            <Switch
              label="Gird View"
              checked={isGrid}
              onChange={() => {
                setIsGrid(!isGrid);
              }}
            />
          </div>

          <div className="carousel-container">
            {typeof data.names === "undefined" ? (
              <p>Loading images...</p>
            ) : isGrid ? (
              <Gallery
                images={data.names}
                onSelectImage={getSimilarImagesFromGrid}
              />
            ) : (
              <StyleRoot>
                <Coverflow
                  width="100%"
                  height="250"
                  displayQuantityOfSide={2}
                  enableHeading={true}
                  infiniteScroll={true}
                  navigation={false}
                  key={data.names.toString()}
                  clickable={true}
                >
                  {data.names.map((e, i) => (
                    <img
                      resizeMode="contain"
                      width="3vw"
                      src={e.src}
                      key={i}
                      alt={e.heading}
                      onClick={() => getSimilarImagesFromCarousel(e)}
                    />
                  ))}
                </Coverflow>
              </StyleRoot>
            )}
            {data.names && showOverlay && (
              <div className="container">
                <button onClick={() => setShowOverlay(false)}>Close</button>
                <Overlay
                  imageLeft={similarImages.left}
                  imagesRight={similarImages.right}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      <div>
        <div id="icicle" ref={circlePackChart} />
      </div>
      <div>
        {/* <div ref={treemapChart}/> */}
        {/* <div id="sun" ref={sunburstChart} /> */}
      </div>
    </div>
  );
}

export default App;
